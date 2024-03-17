const cpt = require("./cryp");
require("dotenv").config({ path: '../.env' });


function generateToken(userID, ipAddress, splitter = "."){ 
    //splitter is used to divide the token string into its respective components
    const rawString = userID + splitter + Date.now().toString() + splitter + ipAddress; 
    return {
        raw: rawString, //returns a raw version of the token if needed
        token: cpt.encrypt(rawString, process.env.TOKEN_SECRET) 
        //returns the actual token which is encrypted using the token secret stored in .ENV
    };
}
function openToken(token, splitter = "."){
    try{ //corrupted tokens will trigger errors which are caught to reject the token
        const raw = cpt.decrypt(token, process.env.TOKEN_SECRET).split(splitter);
        //forms array of components (userID, creationTimestamp, ipAddress)
        return { //returns object with individual components
            error: false,
            userID: raw[0], 
            creationTimestamp: raw[1],
            hashedIPAddress: raw[2]
        };
    }catch(err){
        return {
            error: true //return error status
        };
    }
}

function validateToken(token, receivedIPAddress){ 
    const openResult = openToken(token); //opens the token to extract components
    if (openResult.error){ 
        return {
            complete: true,
            valid: false,
            message: "Token corruption/forgery detected."
        }; //returns corruption error if token cannot be opened properly
    }
    //stores each components in individual variables
    const userID = openResult.userID;
    const creationTimestamp = openResult.creationTimestamp;
    const hashedIPAddress = openResult.hashedIPAddress;
  
    if (cpt.hash(receivedIPAddress) != hashedIPAddress){ 
        return {
            complete: true,
            valid: false,
            message: "Token source corrupted. Retry."
        }; //returns IP error if IP address of sender and token creator don't match
    }
    const timeDiff = Date.now() - parseInt(creationTimestamp); 
    //calculates how long ago the token was created
    const expiry = parseInt(process.env.TOKEN_TIMEOUT_EXPIRY_MS);
    //retrieves the maximum amount of time a token is valid for after creation
    if (timeDiff >= expiry){
        return {
            complete: true,
            valid: false,
            message: "Token expired. Retry."
        }//returns token expired error if token needs to be refreshed
    }
    return { //return success message as well as userID
        complete: true,
        valid: true,
        message: "Token accepted.",
        userID: userID
    };
}


module.exports = { generateToken, openToken, validateToken }; //exports all functions


