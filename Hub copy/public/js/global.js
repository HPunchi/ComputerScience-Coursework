function validateEmail(email){
    try{  
        if ((email.includes("@"))&&(email.includes("."))&&(email.indexOf(".") > email.indexOf("@"))&&(email.length >= 5)){
            if (email.indexOf(".") > email.indexOf("@")+1){
                return true;
            }
        }
    }catch(err){}
    return false;
}

function validatePassword(password, cpassword){
    if (password.length > 0){
        if (password == cpassword){
            return true;
        }
    }
    return false;
}

function validateName(name){
    var re = /^[A-Za-z ]+$/;
    if ((name.length > 0)&&(re.test(name))){
        return true;
    }
    return false;
}

function logoClick(){
    location.href = "/";
}

var logoElems = document.getElementsByClassName("logoClick");
for (var i=0;i<logoElems.length;i++){
    logoElems[i].addEventListener("click", logoClick);
}