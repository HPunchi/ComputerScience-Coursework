const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cpt = require("./middleware/cryp");
const mailer = require('./middleware/mailer');
const idFuncs = require('./middleware/id');

require("dotenv").config();
const app = express();

const connection = mysql.createConnection(process.env.DATABASE_URL);

console.log("Starting server for HomeShield");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public/"));

const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const controlCentreRouter = require("./routes/controlCentre");
const displayPageRouter = require("./routes/displayPage");
const deviceRouter = require("./routes/devices");
const accountRouter = require("./routes/account");
const apiRouter = require("./routes/api");
const commandRouter = require("./routes/command");
const phoneVerifRouter = require("./routes/phoneVerif");

app.use("/", loginRouter);
app.use("/register", registerRouter);
app.use("/control-centre", controlCentreRouter);
app.use("/display", displayPageRouter);
app.use("/devices", deviceRouter);
app.use("/account", accountRouter);
app.use("/api", apiRouter);
app.use("/command", commandRouter);
app.use('/phone', phoneVerifRouter);

app.get("/signup", (req, res) => {
    res.redirect("/register");
});

app.use((req, res)=>{
    const title = "404 Error";
    const text = "Page not found.";
    res.redirect(`/display?title=${title}&text=${text}`);
});

function runOneWayCommand(sql){
    connection.query(
        sql, 
        (err, r) => {
            if (err) throw err;
        }
    )
}
const absentPingPeriod = 600000; //10 minutes
const uecPinCleanupPeriod = 3600000; //1 hour
const liveImageCleanupPeriod = 3600000; //1 hour


const pingWaitPeriod = 300000; //5 minutes
setInterval(() => {
    const currentTime = (new Date()).getTime();
    const maxPingTime = currentTime - pingWaitPeriod;
    
    var onlineReq = 'True';
    var systemReq = 'Armed';

  
    connection.query(
        `SELECT connection.uec, userAccounts.userID, devices.deviceID, connection.lastPing, userAccounts.name, userAccounts.email, devices.location FROM connection LEFT JOIN userAccounts ON connection.userID=userAccounts.userID LEFT JOIN devices ON connection.deviceID=devices.deviceID WHERE connection.lastPing<${maxPingTime} and connection.online=${onlineReq} and connection.systemStatus='${systemReq}'`,
        (err, res) => {
            if (err) throw err;
            for (var i=0;i<res.length;i++){
                var date = new Date(res[i].lastPing);
                res[i].date = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                res[i].time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                res[i].name = cpt.decrypt(res[i].name, res[i].userID);
                res[i].location = cpt.decrypt(res[i].location, res[i].deviceID);

                mailer.sendEmail(res[i].email, 'HomeShield Alert', 'conLost.ejs', {
                    name: res[i].name,
                    date: res[i].date,
                    time: res[i].time,
                    location: res[i].location
                });

                runOneWayCommand(`UPDATE connection SET systemStatus='Idle', online=False WHERE uec='${res[i].uec}'`);
                runOneWayCommand(`INSERT INTO connectionEvents (connectionEventID, uec, eventID, timestamp, seen) VALUES ('${idFuncs.generateID()}', '${res[i].uec}', '2', '${(new Date()).getTime().toString()}', False)`);
                
                console.log(`Absent ping detected on uec: ${res[i].uec}. Alert sent and correction applied.`);
            }
            console.log(`Background automation completed. PURPOSE => [Absent pings check]. Time => [${(new Date).getTime().toString()}]. Cycle step => [${absentPingPeriod}].`);
        }
    );
}, absentPingPeriod);


const pinExpiryTime = 300000; //5 minutes
setInterval(() => {
    var currentTime = (new Date()).getTime();
    var maxTimestamp = currentTime - pinExpiryTime;

    connection.query(
        `DELETE FROM uecPINs WHERE SUBSTRING(pinToken, 6)<=${maxTimestamp.toString()}`,
        (err, res) => {
            if (err) throw err;
            console.log(`Background automation completed. PURPOSE => [PIN token cleanup]. TIME => [${(new Date()).getTime().toString()}]. Cycle step => [${uecPinCleanupPeriod}].`)
        }
    );
}, uecPinCleanupPeriod);

const liveImageExpiry = 1800000; //30 minutes
setInterval(() => {
    var currentTime = (new Date()).getTime();
    var expiryTimestamp = currentTime - liveImageExpiry;
    connection.query(
        `DELETE FROM liveImages WHERE timestamp <= ${expiryTimestamp.toString()}`,
        (err, res) => {
            if (err) throw err;
            console.log(`Background automation completed. PURPOSE => [Live image cleanup]. Time => [${(new Date()).getTime().toString()}]. Cycle step => [${liveImageCleanupPeriod}]`);
        }
    );
}, liveImageCleanupPeriod); 

app.listen(process.env.PORT || 80, () => {
    console.log("Server ready.");
});


