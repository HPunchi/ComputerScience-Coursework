const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const cpt = require("../middleware/cryp");
const jwt = require("jsonwebtoken");
const tokenFuncs = require("../middleware/tokens");
const validationFuncs = require("../middleware/validation");
const idFuncs = require("../middleware/id");
const stringFuncs = require("../middleware/strings");

const connection = mysql.createConnection(process.env.DATABASE_URL);

function runOneWayCommand(sql){
    connection.query(
        sql,
        (err, result) => {
            if (err) throw err;
            return true;
        }
    )
}

router.get("/", (req, res) => { //return a blank unrendered page when the request is made without a token
    res.render("cc", {
        mainFragmentFile: "account.ejs",
        accountDetails: {
            name: "",
            email: ""
        }
    });
});

router.get("/:token", (req, res) => { //return rendered page when token is passed into URL
    const token = req.params.token;
    const errorTitle = "Token Invalid";
    const errorText = "The token was invalid.";
    const vRes = tokenFuncs.validateToken(token, req.socket.remoteAddress); //validate the token and raise error if invalid
    if (!vRes.valid){
        return res.redirect(`/display?title=${errorTitle}&text=${errorText}`);
    }else{ 
        const userID = vRes.userID;

        connection.query( //SQL query to collect all needed data about an account and its contacts
            `SELECT userAccounts.name, userAccounts.email, emergencyContacts.contactID, emergencyContacts.name as contactName, emergencyContacts.email as contactEmail FROM userAccounts LEFT JOIN accountContacts ON userAccounts.userID=accountContacts.userID LEFT JOIN emergencyContacts ON accountContacts.contactID=emergencyContacts.contactID WHERE userAccounts.userID="${userID}"`,
            (e, r) => {
                if (e) throw e;
                var accountDetails = { //decrypt account details
                    name: cpt.decrypt(r[0].name, userID),
                    email: r[0].email
                };
                if (r.length != 0){ //if there are no contacts added
                    accountDetails.emergencyContacts = [];
                }
                for (var i=0;i<r.length;i++){ 
                    if ((r[i].contactName === null)||(r[i].contactEmail === null)){
                        break;
                    }
                    accountDetails.emergencyContacts.push({ //decrypt and add contacts to object
                        contactID: r[i].contactID,
                        name: cpt.decrypt(r[i].contactName, r[i].contactID),
                        email: cpt.decrypt(r[i].contactEmail, r[i].contactID)
                    });
                }
                
            
                return res.render("cc", { //render page populated with data
                    mainFragmentFile: "account.ejs",
                    accountDetails: accountDetails
                });
            }
        )
    }
});

router.post("/edit", (req, res) => { //perform edits on account fields (including emergency contacts)
    const vRes = tokenFuncs.validateToken(req.body.token, req.socket.remoteAddress); //validate token
    const originalData = req.body.orgData; //original data
    const ammendedData = req.body.ammendedObj; //ammended data

    if (!vRes.valid){
        return res.json({ //token invalid error
            done: true,
            success: false,
            message: "Token is invalid for this action. Please try again later."
        });
    }else{
        var adKeys = Object.keys(ammendedData); //array of keys of the ammended data object
        var invalidError = false; //flag to show if any data in the new entry is invalid
        var userID = vRes.userID; //userID of the source of the request
        var commandSequence = []; //sequence of SQL commands to execute
        for (let i=0; i < adKeys.length; i++){ //iterate through all fields
            var field = adKeys[i]; //field name
            var newValue = ammendedData[field]; //new value requested for this field
            var sqlCommand = ""; //holder for SQL command
        
            if (field == "Name"){ //if the field name is the name of the user
                if (!validationFuncs.validateName(newValue).valid){ 
                    invalidError = true;
                    break; //exit loop and set error to true if name is invalid
                }
                sqlCommand = `UPDATE userAccounts SET name="${cpt.encrypt(stringFuncs.convertToTitleCase(newValue), userID)}" WHERE userID="${userID}"`;
                //otherwise the command above is loaded to update the name in encrypted and title case form on database
            
            }else if (field.includes("Contact")){ //if the field related to contacts
                const rawStr = field.replace("Contact", ""); //remove 'Contact' from string field name
                const contactNo = parseInt(rawStr[0]); //convert the remaining raw string to an integer to show which contact number this is
                const contactF = rawStr.substring(1, rawStr.length); //read the field of the contact (name or email) from 1st postion to end of string
                
                const contactID = originalData.emergencyContacts[contactNo - 1].contactID; //seek contactID from original data given number
                
                if (contactF == "Name"){ //if contact name
                    if (!validationFuncs.validateName(newValue).valid){ //flag error and exit loop if contact name edit is invalid
                        invalidError = true;
                        break;
                    }
                    sqlCommand = `UPDATE emergencyContacts SET name="${cpt.encrypt(newValue, contactID)}" WHERE contactID="${contactID}"`; 
                    //sql command to set contact name in emergencyContacts entity
                }else if (contactF == "Email"){ //if contact email address
                    if (!validationFuncs.validateEmailAddress(newValue).valid){ //flag error and exit loop if contact email edit is invalid
                        invalidError = true;
                        break; 
                    }
                    sqlCommand = `UPDATE emergencyContacts SET email="${cpt.encrypt(newValue, contactID)}" WHERE contactID="${contactID}"`; 
                    //sql command to set contact email in emergencyContacts entity
                } 
            }
            commandSequence.push(sqlCommand); //push whatever SQL command was made onto the sequence array
        }
        if (invalidError){ //return invalid error if flag is true
            return res.json({
                done: true,
                success: false,
                message: "Invalid details."
            });
        }else{
            commandSequence.forEach((command) => { //iterate through the command sequence and execute command one by one
                runOneWayCommand(command);
            });
            return res.json({ //send success message
                done: true,
                success: true,
                message: "Edits made successfully. It may take some time for them to be visible."
            });
        }
    }
    
});

router.post("/passwordChange", (req, res) => { //perform a password change on the account
    const token = req.body.token; 
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    const vRes = tokenFuncs.validateToken(token, req.socket.remoteAddress); //validate token

    if (!vRes.valid){ //invalid token error
        return res.json({
            done: true,
            success: false,
            message: "Invalid token to change password. Please try again later."
        });
    }else{
        connection.query(
            `SELECT email, password FROM userAccounts WHERE userID="${vRes.userID}"`, //fetch user's email and password from userAccounts
            (error, result) => {
                if (error) throw error;
                if (result[0].password == cpt.hash(oldPassword)){ //check if hashed password stored matches the entered password hashed
                    if (validationFuncs.validatePassword(newPassword).valid){
                        //make change and store hashed version of password on database for the user
                        runOneWayCommand(`UPDATE userAccounts SET password="${cpt.hash(newPassword)}" WHERE userID="${vRes.userID}"`);
                        return res.json({ //success
                            done: true,
                            success: true,
                            message: "Password changed successfully."
                        });
                    }else{
                        return res.json({ //invalid new password error
                            done: true,
                            success: true,
                            message: "New password invalid."
                        });
                    }
                    
                }else{
                    return res.json({ //incorrect old password error 
                        done: true,
                        success: false,
                        message: "Incorrect password."
                    });
                }
            }
        )
    }
});

router.post("/contactDel", (req, res) => { //delete an emergency contact
    const contactID = req.body.contactID;
    runOneWayCommand(`DELETE FROM emergencyContacts WHERE contactID="${contactID}"`); //remove from emergencyContacts entity
    runOneWayCommand(`DELETE FROM accountContacts WHERE contactID="${contactID}"`); //remove from link table

    res.json({
        done: true,
        success: true
    });
});

router.post("/contactAdd", (req, res) => { //add an emergency contact
    const vRes = tokenFuncs.validateToken(req.body.token, req.socket.remoteAddress);
    if (!vRes.valid){ //return error for invalid token
        return res.json({
            done: true,
            success: false,
            message: "Invalid token for this action. Please try again later."
        });
    }else{ //check validity of new details
        if ((validationFuncs.validateName(req.body.name).valid)&&(validationFuncs.validateEmailAddress(req.body.email).valid)){
            const newContactID = idFuncs.generateID(); //new contactID
            //add encrypted details to database
            runOneWayCommand(`INSERT INTO emergencyContacts (contactID, name, email) VALUES ("${newContactID}", "${cpt.encrypt(stringFuncs.convertToTitleCase(req.body.name), newContactID)}", "${cpt.encrypt(req.body.email, newContactID)}")`);
            runOneWayCommand(`INSERT INTO accountContacts (accountContactID, userID, contactID) VALUES ("${idFuncs.generateID()}", "${vRes.userID}", "${newContactID}")`);
            return res.json({ //success
                done: true,
                success: true,
                message: "Contact added successfully."
            });
        }else{
            return res.json({ //invalid details
                done: true,
                success: false,
                message: "Invalid name or email address for new contact."
            });
        }
    }
});

router.post("/accountDelete", (req, res) => { //delete entire account
    const vRes = tokenFuncs.validateToken(req.body.token, req.socket.remoteAddress); //validate the token provided
    if (!vRes.valid){
        return res.json({
            done: true,
            success: false
        });
    }else{
        runOneWayCommand(`DELETE FROM userAccounts WHERE userID="${vRes.userID}"`); //delete from userAccounts
        connection.query(
            `SELECT contactID FROM accountContacts WHERE userID="${vRes.userID}"`, //select this user's contacts
            (e, r) => {
                if (e) throw e;
                if (r.length > 0){
                    const contactIDs = r.map((result) => result.contactID);
                    var contactStr = "(";
                    contactIDs.forEach((id) => { //make string of contactIDs 
                        contactStr += `"${id}",`;
                    });
                    contactStr = contactStr.slice(0, -1) + ")";
                    runOneWayCommand(`DELETE FROM emergencyContacts WHERE contactID in ${contactStr}`); //delete emergency contacts matching these IDs
                }
                runOneWayCommand(`DELETE FROM accountContacts WHERE userID="${vRes.userID}"`); //delete links in accountContacts look up table

                res.json({ //return success
                    done: true,
                    success: true
                });
                
                
            }
        )
    }
});

module.exports = router; //export the router object to root