const express = require("express"); //import server functions
const router = express.Router();

router.get("/", (req, res) => {
    //query part of the URL used with path /display contains title and text
    //display.ejs is rendered passing in the title and text as parameters in an object
    res.render("display", {
        title: req.query.title, //if no title query is there this is null
        text: req.query.text //if no text query is there this is null
    });
});



module.exports = router;

