const express = require("express"); //web server functions
const router = express.Router(); //intialise a router object
const mysql = require("mysql2"); //database functions
require("dotenv").config(); //get variables from .ENV file
const cpt = require("../middleware/cryp"); //encryption and hashing functions
const stringFuncs = require("../middleware/strings"); //string functions
const validationFuncs = require("../middleware/validation"); //validation functions
const idFuncs = require("../middleware/id"); //id functions


const multer = require('multer');
const mailer = require("../middleware/mailer");


const connection = mysql.createConnection(process.env.DATABASE_URL); //start connection to database from URL in ENV file

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


function runOneWayCommand(sql){
    connection.query(
        sql,
        (err, result) => {
            if (err) throw err;
            return true;
        }
    )
}

function sendEventEmail(uec, eventID){
    connection.query( //SQL command to get device details, user details, contact details from database using UEC and eventID
        `SELECT devices.userID, userAccounts.name, userAccounts.email, devices.deviceID, devices.location, emergencyContacts.contactID, emergencyContacts.name as contactName, emergencyContacts.email as contactEmail, events.name as eventName FROM connection LEFT JOIN devices ON connection.deviceID=devices.deviceID LEFT JOIN accountContacts ON devices.userID=accountContacts.userID LEFT JOIN emergencyContacts ON accountContacts.contactID=emergencyContacts.contactID LEFT JOIN userAccounts ON userAccounts.userID=devices.userID LEFT JOIN events ON events.eventID="${eventID}" WHERE connection.uec="${uec}"`,
        (error, result) => {
            if (error) return false; //error handling and function termination
            var baseObject = { //base object containing information about the event and user and contacts to email
                userID: result[0].userID, //userID for user who's event was triggered
                name: cpt.decrypt(result[0].name, result[0].userID), //decrypted name of user
                email: result[0].email, //email address of user
                location: cpt.decrypt(result[0].location, result[0].deviceID), //decrypted location of device
                eventName: result[0].eventName, //name of event
                //contactDetails: []
            };
            for (let i=0;i<result.length;i++){ //iterate through each row (contact) of the returned object - skip if no contacts found (no records returned)
                if (result[i].contactID === null){
                    break //exit the loop if there is no contactID (assigned as null by MySQL)
                }
                //run function made in mailer.js to send email to emergency contact with parameters - decrypted email address of contact
                mailer.sendEmail(cpt.decrypt(result[i].contactEmail, result[i].contactID), "HomeShield Alert", "notif.ejs", { //mailer object below
                    name: baseObject.name, //name of user
                    contactName: cpt.decrypt(result[i].contactName, result[i].contactID), //decrypted name of contact who is recieving email
                    eventName: baseObject.eventName, //event name
                    deviceLocation: baseObject.location, //location of event
                    eventTime: mailer.formatTimeFromStamp(Date.now()) // formatted time of event
                });           
            }

            mailer.sendEmail(baseObject.email, "HomeShield Alert", "notif.ejs", { //send email to actual user (mandatory)
                name: baseObject.name, //name of user
                eventName: baseObject.eventName, //name of event
                deviceLocation: baseObject.location, //location of event
                eventTime: mailer.formatTimeFromStamp(Date.now()) //formated time of event
            });

            
        }
    )
}

router.post("/retrievePIN", (req, res) => {
    const uec = req.body.uec; //get UEC from POST request body
    connection.query(
        `SELECT * FROM uecPINs WHERE uec="${uec}"`, //SQL command to search for UEC in uecPINs
        (error, results) => {
            if (error) throw error; //error handling
            if (results.length > 0){
                return res.json({ //return when a record is found
                    done: true, //signalling attribute
                    status: "verifying", //status is verifying
                    pin: results[0].pinToken.split(".")[0] //extract and return security PIN needed by user
                });
            }else{ //run code below if no record is found in uecPINs
                connection.query(
                    `SELECT * FROM connection WHERE uec="${uec}"`, //SQL command to search for UEC in connection
                    (e, r) => {
                        if (e) throw e; //error handling
                        if (r.length > 0){
                            return res.json({ //return when record is found
                                done: true,
                                status: "connected" //status connected
                            })
                        }else{
                            return res.json({ //return when UEC is not found anywhere
                                done: true,
                                status: "not-found" //status not-found
                            });
                        }
                    }
                )
            }
        }
    )
}); 

router.post("/fetchLocation", (req, res) => {
    const uec = req.body.uec;

    connection.query(
        `SELECT devices.deviceID, devices.location FROM devices INNER JOIN connection WHERE (connection.deviceID=devices.deviceID) AND (connection.uec="${uec}")`,
        (error, result) => {
            if (error) throw error;
            if (result.length > 0){
                return res.json({
                    success: true,
                    location: cpt.decrypt(result[0].location, result[0].deviceID)
                });
            }else{
                return res.json({
                    success: false
                })
            }
        }
    )
});

router.post("/checkConnected", (req, res) => {
    const uec = req.body.uec;
   
    connection.query(
        `SELECT uec FROM connection WHERE uec="${uec}"`,
        (error, result) => {
            if (error) throw error;
            if (result.length == 0){
                return res.json({
                    connected: false
                });
            }else{
                return res.json({
                    connected: true
                });
            }         
        }
    )
});

router.post("/encrUEC", (req, res) => { //called when adding a new UEC to verified list
    const uec = req.body.uec; //UEC to encrypt

    res.json({
        encryptedUEC: cpt.encrypt(uec, process.env.HSA_UEC_KEY) //return UEC encrypted by server's private key
    });
});

router.post("/verifyUEC", (req, res) => {
    const uec = req.body.uec; //uec to be tested 
    const verified = req.body.verified; //array of verified encrypted UECs on Agent

    const vPlain = []; //empty array to store decrypted UECs that are verified

    verified.forEach((encryptedUEC) => {
        vPlain.push(cpt.decrypt(encryptedUEC, process.env.HSA_UEC_KEY)); //access server's private key and use it to decrypt each UEC
    });
    
    if (vPlain.includes(uec)){
        return res.json({
            valid: true //return valid if UEC is found within verified UECs
        });
    }else{
        return res.json({
            valid: false //otherwise return invalid
        });
    }
});

router.post("/getUECSettings", (req, res) => {
    const uec = req.body.uec;
    connection.query( //sql command to fetch relevant device data from database
        `select devices.location, devices.deviceID, devices.deviceLocked, devices.visibility, connection.systemStatus, connection.commandPending, connection.unreadEvents FROM devices INNER JOIN connection WHERE connection.deviceID=devices.deviceID and connection.uec="${uec}"`,
        (error, response) => {
            if (error) throw error; //error handling
            if (response.length == 0){ 
                return res.json({
                    success: false //return error on a blank response
                });
            }else{ 
                return res.json({
                    success: true, //acknowledge success
                    deviceID: response[0].deviceID, //device ID
                    location: cpt.decrypt(response[0].location, response[0].deviceID), //decrypted device location
                    visibility: (response[0].visibility === 1), //visibility setting (true/false)
                    deviceLocked: (response[0].deviceLocked === 1), //device lock setting (true/false)
                    systemStatus: response[0].systemStatus, //system status
                    commandPending: (response[0].commandPending === 1), //command pending (true/false)
                    unreadEvents: (response[0].unreadEvents === 1) //unread events (true/false)
                });
            }
        }
    )
});

router.post("/setOnline", (req, res) => {
    runOneWayCommand(`UPDATE connection SET online=${req.body.oStat} WHERE uec="${req.body.uec}"`);
    res.json({
        done: true
    });
});

router.post("/status", (req, res) => { //status POST request route
    const uec = req.body.uec; //UEC of connection
    connection.query( //SQL command to retrieve any updates on the system
        `SELECT connection.systemStatus, connection.commandPending, connectionCommands.connectionCommandID, connectionCommands.commandID FROM connection LEFT JOIN connectionCommands ON connection.uec=connectionCommands.uec and connectionCommands.pending=True WHERE connection.uec="${uec}"`,
        (error, result) => { 
            if (error) throw error; //error handling
            if (result[0].commandPending === undefined){
                return res.json({
                    done: true,
                    connectionDeleted: true
                });
            }
            const commandPending = result[0].commandPending; //command pending (true/false)
            const systemStatus = result[0].systemStatus; //system armed (armed/idle)
            var commands = []; //empty array declared to store commands
            if (commandPending){ //run code below if there are commands to add
                commands = result.map(({ connectionCommandID, commandID }) => ({ connectionCommandID, commandID })); //add connectionCommandID and commandID pairs to array
            } 
            runOneWayCommand(`UPDATE connection SET lastPing=${parseInt(Date.now())} WHERE uec="${uec}"`); //update last ping on database showing time this Agent pinged the server
            res.json({ //return information
                done: true,
                systemStatus: systemStatus,
                commandPending: commandPending,
                commands: commands
            });
        }
    ); 
});

router.post("/event/add", (req, res) => { //route to add an event
    const uec = req.body.uec; //UEC of connection
    const eventID = req.body.eventID; //eventID of event to add
   

    const emailEventIDs = ["0"]; //array of eventIDs which require email notifications to be sent - for now only eventID 0 (motion detected)
    runOneWayCommand(`INSERT INTO connectionEvents (connectionEventID, uec, eventID, timestamp, seen) VALUES ("${idFuncs.generateID()}", "${uec}", "${eventID}", "${Date.now().toString()}", ${false})`); 
    //SQL command to insert a new record into connectionsEvents containing a random ID, uec, eventID, timestamp of event, and setting seen to false
    
    if (emailEventIDs.includes(eventID)){ //iterate through each element of array emailEventIDs
        sendEventEmail(uec, eventID); //sendEventEmail() function is called passing in UEC and eventID (the actual emails are sent at a later stage)
    }
    res.json({
        success: true //responding a success state
    });
});

router.post("/getCommands", (req, res) => {
    const uec = req.body.uec;

    connection.query(
        `SELECT connectionCommandID, uec, commandID FROM connectionCommands WHERE uec="${uec}" and pending=True`,
        (err, re) => {
            if (err) throw err;
            var ccIDs = re.map((r) => r.connectionCommandID);
            var ccStr = "(";
            ccIDs.forEach((ccID) => {
                ccStr += `"${ccID}",`;
            });
            ccStr = ccStr.slice(0, -1);
            ccStr += ")";

            //runOneWayCommand(`DELETE `)
            res.json({
                done: true,
                commands: re
            });
        }
    )
});

router.post("/resolveCommands", (req, res) => {
    const uec = req.body.uec; //uec of connection
    const commandsDone = req.body.conComIDStr; //connectionCommandID string

    runOneWayCommand( //run command to remove the command from the connectionCommands database as it is not needed
        `DELETE FROM connectionCommands WHERE connectionCommandID in ${commandsDone}`,
    );    
   
    runOneWayCommand( //update the connection to show there are no command pending at the moment
        `UPDATE connection SET commandPending=False WHERE uec="${uec}"`
    );
    
    res.json({ //send acknowledgment to Agent
        done: true
    });
});

router.post("/imgUpload/::uec", upload.single('image'), (req, res) => { //dynamic route indicated by :: with image upload enabled
    const uec = req.params.uec; //get UEC of request made
    const imageData = req.body.imageData; //image data - string version of base 64 encoded live image (encrypted)

    runOneWayCommand(`INSERT INTO liveImages (uec, data, timestamp) VALUES ("${uec}", "${imageData}", ${(new Date()).getTime()})`); //add UEC and image data to database

    res.json({
        done: true //return success
    });
});

module.exports = router;
