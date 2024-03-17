const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");

app.use(express.json());

const data = [
    {
        name: "user1",
        age: 17
    },
    {
        name: "user2",
        age: 20
    }
];


function authenticateToken(req, res, next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token === null){
        res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
app.get("/posts", authenticateToken, (req, res) => {
    console.log(req.user);
    res.json(data.filter((item) => item.name === req.user.name));
});


app.post("/login", (req, res) => {
    const username = req.body.username;
    const user = {
        name: username
    };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

    res.json({accessToken: accessToken});
});

app.listen(80, ()=> {
    console.log("Listening on port 80.");
});