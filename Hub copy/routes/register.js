const express = require("express");
require("dotenv").config();
const mysql = require("mysql2"); //used for database
const validationFuncs = require("../middleware/validation"); 
const stringFuncs = require("../middleware/strings");
const idFuncs = require("../middleware/id");
const cpt = require("../middleware/cryp");
const router = express.Router();


const connection = mysql.createConnection(process.env.DATABASE_URL);

function encryptFinalDetails(finalDetails){
    const userID = finalDetails.id; //fetch userID
    const newObj = {
        id: userID, //remains same
        name: cpt.encrypt(finalDetails.name, userID), //encrypted
        email: finalDetails.email, //remains same
        password: cpt.hash(finalDetails.password), //hashed
        emergencyContacts: []
    };
    finalDetails.emergencyContacts.forEach((contact) => { //encrypts each contacts
        newObj.emergencyContacts.push({
            contactID: contact.contactID, //remains same
            name: cpt.encrypt(contact.name, contact.contactID), //encrypted
            email: cpt.encrypt(contact.email, contact.contactID) //encrypted
        });
    });
    return newObj; //returns final encrypted object in same form as finalDetails
}

router.get("/", (req, res) => {
    res.render("register"); //renders the register webpage (found in views folder)
});

router.post("/", (req, res) => { //recieves POST request from webpage
    const newUserID = idFuncs.generateID(); //makes new user ID

    var finalDetails = { //define blank object for account details where validated data wil go to
        id: "",
        name: "",
        email: "",
        password: "",
        emergencyContacts: []
    };
    var eContactsValid = true;
    req.body.emergencyContacts.forEach((contactObj) => { //check if emergency contact names and emails are valid
        if ((!validationFuncs.validateName(contactObj.name).valid)||(!validationFuncs.validateEmailAddress(contactObj.email).valid)){
            eContactsValid = false;
        }else{
            finalDetails.emergencyContacts.push({ //add contact and new contact ID to final details object
                contactID: idFuncs.generateID(), 
                name: stringFuncs.convertToTitleCase(contactObj.name), //convert name to title case
                email: contactObj.email
            });
        }
    });
    if (!eContactsValid){ //return error if any emergency contact details are invalid
        return res.json({done:true, success:false, message:"Emergency contact/s invalid."});
    }
    

    vN = validationFuncs.validateName(req.body.name); //check if name is valid
    if (!vN.valid){ //return an error if it is not valid
        return res.json({done:true, success:false, message:vN.message});
    }
    finalDetails.name = stringFuncs.convertToTitleCase(req.body.name); //add title case version of name if it is

    vE = validationFuncs.validateEmailAddress(req.body.email); //check if email is valid
    if (!vE.valid){ //return an error if invalid
        return res.json({done:true, success:false, message:vE.message});
    }//not added to final details object yet as it needs to check this email isnt in use
    

    vP = validationFuncs.validatePassword(req.body.password); //checks if password is valid
    if (!vP.valid){ //returns error if invalid
        return res.json({done:true, success:false, message:vP.message});
    }
    finalDetails.password = req.body.password; //add valid password to final details object

    
    
    connection.query( //access database
        "SELECT userAccounts.userID, userAccounts.email, emergencyContacts.contactID, accountContacts.accountContactID FROM userAccounts INNER JOIN emergencyContacts, accountContacts",
        (err, results) => {
            if (err) throw err;
            let emails = results.map((item) => item.email); //creates an array of all email addresses in use
            
            if (emails.includes(req.body.email)){ //returns error if email is already in use
                return res.json({done:true, success:false, message:"Email in use."});
            } 
            finalDetails.email = req.body.email; //otherwise adds to final details

            finalDetails.id = newUserID;

            const userID = finalDetails.id;

            finalDetails = encryptFinalDetails(finalDetails); //calls an encryption function

            
            for (var i=0;i<finalDetails.emergencyContacts.length;i++){
                var currentContact = finalDetails.emergencyContacts[i]; //fetch emergency contact
                var ccID = currentContact.contactID; //fetch each contactID
                var acID = idFuncs.generateID(); //new account contact ID
                
                
                connection.query(`
                    INSERT INTO emergencyContacts (contactID, name, email) VALUES ("${ccID}", "${currentContact.name}", "${currentContact.email}")
                `, (e, r) => { //add contact into emergency contacts (throw error if any)
                    if (e) throw e;
                });
                connection.query(`
                    INSERT INTO accountContacts (accountContactID, userID, contactID) VALUES ("${acID}", "${userID}", "${ccID}")
                `, (e, r) => { //add link into link table accountContacts (throw error if any)
                    if (e) throw e;
                });
            }
            connection.query(`
                INSERT INTO userAccounts (userID, name, email, password) VALUES ("${userID}", "${finalDetails.name}", "${finalDetails.email}", "${finalDetails.password}")
            `, (e, r)=>{ //add account into userAccounts (throw error if any)
                if (e) throw e;
                res.json({done:true, success:true, message:"Account created successfully."}); //final success message
            });
        }
    );
});


module.exports = router; //export the router object to the main index.js server file