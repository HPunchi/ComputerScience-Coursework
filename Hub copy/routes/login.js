const express = require("express");
const router = express.Router();
require("dotenv").config();
const mysql = require("mysql2");
const idFuncs = require("../middleware/id");
const cpt = require("../middleware/cryp");
const tokenFuncs = require("../middleware/tokens");

const connection = mysql.createConnection(process.env.DATABASE_URL);


router.get("/", (req, res) => {
    res.render("login"); //renders login.ejs from views folder
});

router.post("/login", (req, res) => { //receival of POST request at '/login' route
    var joiner = "///"; //string inserted in between the email and the hashed password (can be any value)
    
    connection.query(
        "SELECT * FROM userAccounts", //fetch data from userAccounts entity
        (err, results) => {
            if (err) throw err;
            const logins = results.map((element) => element.email+joiner+element.password); //creates array of all loginStrings

            if (!logins.includes(req.body.email+joiner+cpt.hash(req.body.password))){ 
                //creates loginString for inputted data and checks if it is in array
                return res.json({done:true, success:false, message:"Incorrect credentials."});  //error message if not found
            }else{ //code below runs if a loginString is matched
              
                const userID = results[logins.indexOf(req.body.email+joiner+cpt.hash(req.body.password))].userID; 
                //using the loginString the userID for the account is retrived
                    
                const newToken = tokenFuncs.generateToken(userID, cpt.hash(req.socket.remoteAddress)).token;
                //this function generates a token using the userID, and IP address of the device used to login. 


                return res.json({done: true, success:true, message:"Login successful.", 
                    token: newToken
                }); //acknolwedgement of success is sent as well as login token
            }    
        }
    );
});



module.exports = router; //export the router object for use in 'index.js' server file


