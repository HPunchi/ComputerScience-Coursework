function generateID(length=8){ //default length is 8
    //string containing all letters an ID can have
    var allowed = "abcdefghijklmnopqrstuvwyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var newID = "";
    for (var i=0;i<length;i++){
        newID += allowed[(Math.floor(Math.random()*allowed.length))]; //select random character from string
    }
    return newID; 
}

module.exports = {generateID};



