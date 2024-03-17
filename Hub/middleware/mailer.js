const nodemailer = require("nodemailer"); //nodemailer functions
const cpt = require("../middleware/cryp"); //encryption and decryption and hashing functions
const path = require("path"); //path module to join paths
const fs = require("fs"); //files module to access template EJS email files
const ejs = require("ejs"); //to faciliate the processing and rendering of EJS templates

const transporter = nodemailer.createTransport({ //a transporter object stores service and credentials of account used to send emails
    service: 'gmail', //gmail
    auth: { //authorisation to 'log into' account to send emails
      user: 'homeshield.alert@gmail.com', //email address
      pass: "bvmd ibjj eqyw iwil" //application use password (specificly made for application mailing)
    }
});
function formatTimeFromStamp(timestamp){ //function to format a timestamp
    const date = new Date(timestamp); //get date object

    const day = date.getDate(); //get date (eg. 11 if it is the 11th of March 2024)
    const month = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(date); //get month in format used and accepted in UK
    const year = date.getFullYear(); //get full year (eg. 2024 if it is the 04th of April 2024)
  
    
    const hour = date.getHours(); //get hours from time
    const minute = date.getMinutes(); //get minutes from time
  
    const formattedDate = `${day} ${month} ${year}`; //format date
    const formattedTime = `${hour}:${minute}`; //format time

    return `${formattedDate} - ${formattedTime}`; //combine and format into one main string to return
}

function sendEmail(recipientAddress, subject="HomeShield Notification", mFilePath="notif.ejs", mailContent){ //function to send an email with parameters
    const templatePath = path.join(__dirname, "../views/email/", mFilePath); // path to find correct EJS email template
    const template = fs.readFileSync(templatePath, 'utf-8'); //read the EJS file

    // Render the EJS template using mailContent (object used for EJS to dynamically render the HTML)
    const renderedHTML = ejs.render(template, mailContent);

    // Email options
    const mailOptions = { //final mail options object
      from: 'homeshield.alert@gmail.com', //sending email address
      to: recipientAddress, //recipient email address (user or emergency contact)
      subject: subject, //subject of email
      html: renderedHTML //HTML to show (read from loaded EJS file)
    };

    //console.log(`Outgoing email to ${recipientAddress} bypassed.`);
    
    transporter.sendMail(mailOptions, (error, info) => { //send the mail by calling the method on the transporter object
        if (error) { 
          return console.error('Error sending email:', error); //end function and raise error if there was an error in sending email
        }
        console.log('Email sent:', info.response); //otherwise output acknowledgement of the sent email
    });
    //transporter function above can be commented out during testing to prevent spam emails and the console.log() below can be uncommented - prevents spam emails
    //console.log("Email notifications off."); 
}

module.exports = { formatTimeFromStamp, sendEmail }; //export the following functions from this file


