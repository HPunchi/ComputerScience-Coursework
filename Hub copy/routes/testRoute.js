const mysql = require("mysql2");
require("dotenv").config({path='../.env'});

console.log(process.env.DATABASE_URL);
const connection = mysql.createConnection(process.env.DATABASE_URL);


connection.query(
    `SELECT * FROM userAccounts`,
    (err, res) => {
        if (err) throw err;

        console.log(res);
    }
);