const express = require("express"); //module for express web server
const router = express.Router(); //initialise router object for this route '/devices'
const mysql = require("mysql2"); //sql functions
require("dotenv").config(); //acquire variables in .ENV file at root
const cpt = require("../middleware/cryp"); //encryption and hashing functions
const tokenFuncs = require("../middleware/tokens"); //token functions
const stringFuncs = require("../middleware/strings"); //string manipulation functions
const validationFuncs = require("../middleware/validation"); //validation functions
const idFuncs = require("../middleware/id"); //ID functions

const connection = mysql.createConnection(process.env.DATABASE_URL); //initialise connection to database usng URL

function runOneWayCommand(sql){ //only parameter is SQL code
    connection.query( //query is run
        sql, //sql code from parameter is used in this function
        (err, res) => {
            if (err) throw err; //error handling
        } //no return value or further processing
    );
}

router.get("/add", (req, res) => { // route when add device page is accessed
    res.render("cc", {
        mainFragmentFile: "addDevice.ejs",
        deviceTypes: ["Mobile", "Tablet", "Laptop", "Desktop"] // array of device types to be loaded onto template form 
    });
});

router.post("/makeUEC", (req, res) => { // route to generate new UEC
    const deviceDetails = req.body.deviceDetails; // device details of new device to add
    const userID = req.body.userID; //user ID of user
    
    const deviceID = idFuncs.generateID(); //generate a new ID for the device
    const newUEC = idFuncs.generateID(); //generate a new ID representing the UEC

    connection.query(
        `SELECT deviceID FROM devices`, //sql command to fetch all device IDs
        (error, result) => {
            const allIDs = result.map((device) => device.deviceID); //create array of taken device IDs       
            if (allIDs.includes(deviceID)){ //return failsafe clash error if ID is taken and client will automaticaly resend request
                return res.json({
                    done: true,
                    success: false,
                    retry: true
                });
            }
            const pinToken = `${(Math.floor((Math.random() * 9000) + 1000)).toString()}.${Date.now().toString()}`; //generate security PIN
            connection.query(
                `INSERT INTO uecPINs (uec, pinToken) VALUES ("${newUEC}", "${pinToken}")`, //add uec and pin to temporary uecPINs storage
                (e, r) => {
                    res.json({ //return new UEC and device ID as success response
                        done: true,
                        success: true,
                        uec: newUEC,
                        deviceID: deviceID
                    });
                }
            )
        }
    );
});

router.post("/add/verify-pin", (req, res) => { //run this route when PIN and device details have been entered
    const enteredPIN = req.body.securityPIN; //security PIN inputted by user
    const uecToCheck = req.body.uec; //UEC that was provided to user
    const deviceID = req.body.deviceID; //deviceID that was generated and provided to user
    const userID = req.body.userID; //userID
    const dd = req.body.deviceDetails; //deviceDetails object
    connection.query(
        `SELECT pinToken FROM uecPINs WHERE uec="${uecToCheck}"`, //sql command to get PIN of the UEC required
        (error, result) => {
            if (error) throw error; //error handling
            if (result.length == 0){ 
                return res.json({
                    done: true,
                    success: false,
                    message: "PIN error."
                }); //returns error if UEC is not found
            }
            const [ realPIN, creationTime ] = result[0].pinToken.split("."); //splits result into the PIN and the timestamp it was made on
            if (parseInt(Date.now() - parseInt(creationTime)) >= process.env.UEC_PIN_EXPIRY_MS){
                runOneWayCommand(`DELETE FROM uecPINs WHERE uec="${uecToCheck}"`); //wipe UEC from uecPINs table
                return res.json({
                    done: true,
                    success: false,
                    message: "PIN expired."
                }); //returns error if PIN has expired (gone over time limit = 5 mins)
            }
            if (realPIN != enteredPIN){
                runOneWayCommand(`DELETE FROM uecPINs WHERE uec="${uecToCheck}"`); //wipe UEC from uecPINs table
                return res.json({
                    done: true,
                    success: false,
                    message: "PIN incorrect."
                }); //returns error if PIN on database and PIN entered by user do not match
            }
            runOneWayCommand(`DELETE FROM uecPINs WHERE uec="${uecToCheck}"`); //if successful erase the UEC from uecPINs table

            runOneWayCommand(
                `INSERT INTO devices (deviceID, userID, name, location, visibility, type, deviceLocked) VALUES ("${deviceID}", "${req.body.userID}", "${cpt.encrypt(dd.name, deviceID)}", "${cpt.encrypt(dd.location, deviceID)}", ${dd.visibility}, "${cpt.encrypt(dd.type, deviceID)}" , ${dd.deviceLocked})`
            ); //add device data to database in encrypted format using the device ID as the key
            runOneWayCommand(
                `INSERT INTO connection (uec, userID, deviceID, systemStatus, commandPending, unreadEvents, online) VALUES ("${uecToCheck}", "${userID}", "${deviceID}", "Idle", false, false, false)`
            ); //add a new connection connecting UEC, deviceID, and userID
            res.json({
                done: true,
                success: true,
                message: "Device added."
            }); //return success
        }
    )
});

router.post("/remove-devices", (req, res) => { //code here runs when remove device request is received
    const deviceIDs = req.body.devicesIDs; //array of device IDs to remove
    const userID = req.body.userID; //user ID of user making the request

    var valuesStr = "("; //start of string
    deviceIDs.forEach((deviceID) => { //compiles string of deviceIDs in brackets separated by commas
        valuesStr += `"${deviceID}",`;
    });
    valuesStr = valuesStr.slice(0, -1); //remove final comma
    valuesStr += ")"; //close off final bracket
    connection.query(
        `DELETE FROM devices WHERE deviceID IN ${valuesStr}`, //run sql to remove devices
        (error, result) => {
            if (error) throw error; //error handling
            connection.query(
                `DELETE FROM connection WHERE deviceID in ${valuesStr}`, //remove connections
                (e1, r1) => {
                    if (e1) throw e1; //error handling
                    return res.json({ //return success
                        done: true,
                        success: true
                    });
                }
            );
        }
    );
});

router.get("/", (req, res) => { //blank request with no token to '/devices'
    res.render("cc", {
        mainFragmentFile: "devices.ejs", //load fragment into main template
        devices: [] //no devices returned
    });
});

router.get("/:token", (req, res) => { //request with token included in the URL
    const token = req.params.token; //load token from URL into variable
    const vObj = tokenFuncs.validateToken(token, req.socket.remoteAddress); //validate token
    if (!vObj.valid){
        return res.redirect( //redirect to error page if invalid
            `/display?title=${"Token Invalid"}&text=${"Token was invalid."}` 
            //load display page template with appropiate title and text
        );
    }else{ //run code below if token is valid
        const userID = vObj.userID; //acquire userID from token
        var devices = []; //initialise empty devices array
        connection.query(
            `SELECT * FROM devices WHERE userID="${userID}"`, //get user's devices from database
            (err, response) => {
                if (err) throw err; //error handling 
                response.forEach((device) => {
                    const type = cpt.decrypt(device.type, device.deviceID); //decrypt device type
                    var iconType = ""; 
                    //set iconType to font awesome class name based on device type
                    if (type == "Mobile"){
                        iconType = "fa-mobile-button";
                    }else if (type == "Tablet"){
                        iconType = "fa-tablet-button"; 
                    }else if (type == "Laptop"){
                        iconType = "fa-laptop";
                    }else if (type == "Desktop"){
                        iconType = "fa-display";
                    }
                    devices.push({ //push following object into array
                        deviceID: device.deviceID, //device ID
                        name: cpt.decrypt(device.name, device.deviceID), //decrypted device name
                        location: cpt.decrypt(device.location, device.deviceID), //decrypted device locations
                        type: type, //device type in plain text
                        visibility: device.visibility, //device visiblitity setting
                        deviceLocked: device.deviceLocked, //device lock setting
                        iconType: iconType //device type as a font awesome icon class
                    });
                });
                res.render("cc", {
                    mainFragmentFile: "devices.ejs",
                    devices: devices.sort((a, b) => a.location.localeCompare(b.location)) 
                    //alphabetically order devices by location
                });    
        });
    }

});



module.exports = router; //final line to export router object to index.js root file