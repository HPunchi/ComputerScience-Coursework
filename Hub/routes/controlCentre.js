const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const cpt = require("../middleware/cryp");
const jwt = require("jsonwebtoken");
const tokenFuncs = require("../middleware/tokens");
const idFuncs = require("../middleware/id");

const connection = mysql.createConnection(process.env.DATABASE_URL);

function runOneWayCommand(sql){
    connection.query(
        sql, 
        (err, res) => {
            if (err) throw err;
        }
    );
}

router.get("/", (re1, res) => { //default path
    res.render("cc", { //render controlCentre page without any connection array
        mainFragmentFile: "controlCentre.ejs",
        cArr: []
    });
});

router.get("/:token", (req, res) => {
    const token = req.params.token; //get token of user
    const errorTitle = "Token Invalid"; //title of error
    const errorText = "The token was invalid."; //text of error
    const vRes = tokenFuncs.validateToken(token, req.socket.remoteAddress); //check token
    if (!vRes.valid){
        return res.redirect(`/display?title=${errorTitle}&text=${errorText}`); //redirect to error page if invalid
    }else{ //otherwise run code below
        const userID = vRes.userID; //extract userID from the token
        connection.query( //run SQL command to fetch the user's connections
            `SELECT connection.uec, connection.deviceID, connection.online, devices.location, connection.systemStatus, devices.visibility FROM connection INNER JOIN devices WHERE (connection.deviceID=devices.deviceID) and (connection.userID="${userID}")`,
             (error, results) =>{
                if (error) throw error; //error handling
                const cArr = []; //define empty connection array
                results.forEach((result) => { //iterate through each connection
                    var cVis = false; 
                    if (result.visibility){
                        cVis = true; //if visbility setting is stored as 1, set to boolean value 'true'
                    }
                    cArr.push({ //add following to connection array
                        uec: result.uec, //UEC of connection
                        location: cpt.decrypt(result.location, result.deviceID), //decrypted device location
                        status: result.systemStatus, //system status (i.e., armed or idle)
                        visibility: cVis, //visibility setting in boolean format
                        online: result.online //status of whether device is online or not also in boolean format
                    });
                });
                return res.render("cc", { //render controlCentre page with the user's connections
                    mainFragmentFile: "controlCentre.ejs",
                    cArr: cArr.sort((a, b) => a.location.localeCompare(b.location)) //order alphabetically by device location
                });
             } 
        );
    }
});

router.post("/toggleStatus", (req, res) => {
    const uec = req.body.uec; //get UEC
    const currentStatus = req.body.current; //get current state
    const userID = req.body.userID; //get userID
    connection.query(
        `SELECT uec, systemStatus FROM connection WHERE userID="${userID}"`, //sql command to user's connections' UEC and current status'
        (error, result) => {
            if (error) throw error; //error handling
            if (result.length == 0){ //return following error if there is a blank repsonse - i.e. if the user does not own the connection
                return res.json({
                    done: true,
                    success: false,
                    message: "This UEC does not belong to this account"
                });
            }else{
                const ownedUECs = result.map((r) => r.uec); //create array of UECs owned by the user
                if (!ownedUECs.includes(uec)){         
                    return res.json({ //error if UEC not included in array
                        done: true,
                        success: false,
                        message: "This UEC does not belong to this account"
                    });
                }else{
                    var newStatus = ""; //declare variable for new status
                    const actStatus = result[ownedUECs.indexOf(uec)].systemStatus; //get the actual status of the connection using the UEC
                    if (currentStatus == actStatus){ //run code if the current status (client provided) and the actual status (server provided) match
                        if (currentStatus == "Armed"){
                            newStatus = "Idle"; //toggle to idle if armed
                        }else if (currentStatus == "Idle"){
                            newStatus = "Armed"; //toggle to armed if idle
                        }  
                        runOneWayCommand(
                            `UPDATE connection SET systemStatus="${newStatus}" WHERE uec="${uec}"` //sql command to update status on database
                        );

                        return res.json({ //send success message
                            done: true,
                            success: true,
                            newStatus: newStatus,
                            changed: true
                        });
                    }else{
                        return res.json({ //send error if current and actual status' do not match
                            done: true,
                            success: false,
                            changed: false
                        });
                    }
                    
                    
                }
            }

        }
    );

}); 

router.post("/test", (req, res) => {
    const token = req.body.token;

    const vObj = tokenFuncs.validateToken(token, req.socket.remoteAddress);

    return res.json(vObj);
});

router.post("/getEventLog", (req, res) => {
    const uec = req.body.uec;
    const userID = req.body.userID;


    connection.query(
        `SELECT uec FROM connection WHERE userID="${userID}"`,
        (error, result) => {
            if (error) throw error;
        
            if (result.length == 0){

                return res.json({
                    done: true,
                    success: false,
                    message: "This UEC does not belong to this account"
                });
            }else{
                const ownedUECs = result.map((r) => r.uec);
                if (!ownedUECs.includes(uec)){
                    return res.json({
                        done: true,
                        success: false,
                        message: "This UEC does not belong to this account"
                    });
                }else{
                    connection.query(
                        `SELECT connectionEvents.eventID, connectionEvents.timestamp, events.name, events.category, events.description, events.severity FROM events INNER JOIN connectionEvents WHERE events.eventID=connectionEvents.eventID and connectionEvents.uec="${uec}"`,
                        (e1, r1) => {
                            if (e1) throw e1;
                            r1 = r1.sort((obj1, obj2) => parseInt(obj2.timestamp) - parseInt(obj1.timestamp));
                            return res.json({
                                done: true,
                                success: true,
                                eventLog: r1
                            });
                        }
                    )

                }

            }
        }
    );
});

router.post("/sendCommand", (req, res) => {
    const uec = req.body.uec; //UEC of connection
    const userID = req.body.userID; //userID of user
    const commandID = req.body.commandID; //commandID of command to be sent (0 - live image, 1 - play sound)
  
    connection.query( //run a SQL query to check when the command of the same type was last sent to this device
        `SELECT connection.uec, connection.userID, connection.commandPending, connectionCommands.connectionCommandID, connectionCommands.commandID, connectionCommands.timestampSet FROM connection LEFT JOIN connectionCommands ON connection.uec=connectionCommands.uec and connection.uec="${uec}" and connectionCommands.commandID="${commandID}" and connectionCommands.pending=True WHERE userID="${userID}"`,
        (error, response) => {
            if (error) throw error; //error handling

            var timestampsOfCommand = []; //array declared to show timestamps of each command found
            
            timestampsOfCommand = response.map((r) => parseInt(r.timestampSet)); //load this array with timestamps of when these commands were called on the device
            
            //console.log(timestampsOfCommand);

            var filteredTimestamps = [];
            
            for (var i=0;i<timestampsOfCommand.length;i++){
                if (!Number.isNaN(timestampsOfCommand[i])){
                    filteredTimestamps.push(timestampsOfCommand[i]);
                }
            }

            var mostRecentTimestamp = Math.max(...filteredTimestamps); //find largest time - ie. most recent time when the same command was made on the same device
                       

            if ((Date.now()-mostRecentTimestamp > process.env.COMMAND_GAP)){//if amount of time elapsed since last command of same sort on the device is over command gap (50s)
               
                runOneWayCommand( //add command to connectionCommands setting pending=True, executed=False, feedbackReceieved=False, and timestamps other than timestampSet to blank
                    `INSERT INTO connectionCommands (connectionCommandID, uec, commandID, pending, timestampSet, executed, timestampExecuted, feedback, feedbackReceived) VALUES ("${idFuncs.generateID()}", "${uec}", "${commandID}", True, "${Date.now().toString()}", False, "0", False, "-")`
                )
                runOneWayCommand( //update the main connection entity to set commandsPending to True to be picked up on the Agent's polling loop
                    `UPDATE connection SET commandPending=True WHERE uec="${uec}"`
                );
                
                console.log('Command added: ' + uec);
            } 
           
            return res.json({ //send success acknowledgement back to client
                done: true,
                success: true
            });
        }
    )
});

router.post("/getLiveImage", (req, res) => {
    const uec = req.body.uec; //get UEC
    const userID = req.body.userID; //get userID

    connection.query( //run SQL command to fetch liveImage data from given UEC and userID
        `SELECT liveImages.data FROM connection LEFT JOIN liveImages ON connection.uec=liveImages.uec wHERE connection.uec="${uec}" and connection.userID="${userID}"`,
        (error, result) => {
            if (error) throw error; //error handling
            if ((result.length == 0)||(result[0].data === null)){
                return res.json({ //return error and image unavailable status if no results are returned or if the returned result is null
                    done: true,
                    success: false,
                    imgUnavailable: true
                });
            }else{ //otherwise run the code below - if data is successfully returned
                runOneWayCommand(`DELETE FROM liveImages WHERE uec="${uec}"`); //delete the record from the database - to prevent excessive storage being used up unnecessarily
                res.json({ //return success status and image data
                    done: true,
                    success: true,
                    liveImage: result[0].data
                });
            }
        }
    )
});

router.post("/serverPing", (req, res) => {
    const vRes = tokenFuncs.validateToken(req.body.token, req.socket.remoteAddress); //get token and validate it using the IP address of client device
    if (!vRes.valid){ 
        return res.json({
            done: true,
            success: false,
            message: "Token provided was not valid or does not belong to you."
        }); //return error if the token is invalid or does not belong to the user
    }else{
        connection.query( //SQL command to fetch relevant data to return to client as part of their server ping
            `SELECT connection.uec, connection.userID, connectionEvents.connectionEventID, connection.systemStatus, connection.unreadEvents, connection.online, connectionEvents.eventID, connectionEvents.timestamp, events.name, events.description, events.category FROM connection LEFT JOIN connectionEvents ON connection.uec=connectionEvents.uec and connectionEvents.seen=false  LEFT JOIN events ON connectionEvents.eventID=events.eventID WHERE connection.userID="${vRes.userID}" ORDER BY connectionEvents.timestamp DESC`,
            (error, result) => {
                if (error) throw error; //error handling
                var errorPing = false; //boolean variable tracking if the ping has so far has had any errors
            
                const ownedUECs = [...new Set(result.map((r) => r.uec))]; //filter through response and cyphon out UECs and load them into an array of owned UECs

                var uecData = []; //empty array to be used for uecData
                var allEvents = []; //empty array to be used for events
            
                ownedUECs.forEach((uec) => { //iterate through each UEC in ownedUECs array
                    if (result.map((r) => r.uec).includes(uec)){ //check that the user actually owns all of the UECs in this array
                        var uO = result.find((obj) => obj.uec === uec); //locate the object for the current UEC through the result object
                        uecData.push({ //add a new object to uecData array
                            uec: uec, //uec of connection
                            userID: uO.userID, //userID
                            systemStatus: uO.systemStatus, //currentStatus of UEC (armed/idle)
                            unreadEvents: uO.unreadEvents, //boolean value if the UEC has any unread events or not
                            online: uO.online //boolean value showing if device is online right now or not
                        });
                    }else{
                        errorPing = true; //error - user does not own one or more of these UECs
                    }
                });
                
                result.forEach((item) => { //iterate through each line in the result
                    if (item.connectionEventID !== null){ //if connectionevnetID for row is blank do not run the code below
                        allEvents.push({ //push the new object below to the allEvents object
                            uec: item.uec, //uec this event applies to
                            connectionEventID: item.connectionEventID, //connectionEventID
                            eventID: item.eventID, //eventID (eg. 0 for motion detected)
                            timestamp: item.timestamp, //timestamp of when even occured
                            name: item.name, //name of event
                            description: item.description, //description of event
                            category: item.category //cateogry of event
                        });
                    }   
                });

                if (!errorPing){ //if there was no error in any of the above
                    return res.json({ //return success
                        done: true,
                        success: true,
                        uecData: uecData,
                        allEvents: allEvents.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)) //sort the events by their time (can be changed on client-side)
                    });
                }else{  
                    return res.json({ //return error if errorPing was set to true (if there was an error somewhere)
                        done: true,
                        success: false
                    })
                }
                /* 
                for (let i=0; i<req.body.uecs.length; i++){
                    if (!ownedUECs.includes(req.body.uecs[i])){
                        errorPing = true;
                        break;
                    }else{
                        console.log(result.filter(obj => obj.uec === req.body.uecs[i]));
                    }
                }
                
                if (!errorPing){
                    return res.json({
                        done: true,
                        success: true,
                        responseObj: responseObj
                    });
                }else{
                    return res.json({
                        done: true,
                        success: false,
                        message: "Error ping triggered"
                    })
                }*/

            }  
        )
    }
});

router.post("/allEvents", (req, res) => { //POST route called to get list of possible event names recognised on system
    connection.query(
        `SELECT name FROM events`, //select names of all events listed using SQL command
        (error, result) => {
            if (error) throw error; //error handling
            res.json({
                events: result.map((obj) => obj.name), //return the array of event names
                done: true //signalling attribute to show server runtime has concluded
            });
        }
    );
});

module.exports = router;