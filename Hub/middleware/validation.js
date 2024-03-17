function validateName(name){ //checks name only has letters in it and no numbers or other digit
    var valid = true;
    const nameRegex = /^[A-Za-z ]+$/; //regex expression set to check this
    if (!nameRegex.test(name)){
        valid = false;
    }
    if (valid){ //returns validity and appropiate messages
        return {
            valid: true,
            message: "Name valid."
        };
    }
    return {
        valid: false,
        message: "Name invalid."
    }
}
function validateEmailAddress(email){ //checks email address to see if it matches format of an email address
    var valid = true;
    const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email.match(emailRegex)){ //rejects email if the email parameter does not match the format specified above
        valid = false;
    }
    if (valid){ //returns validity and appropiate messages
        return {
            valid: true,
            message: "Email address valid."
        };
    }
    return {
        valid: false,
        message: "Email address invalid."
    };
}
function validatePassword(password, criteria={minLength:6, minLetters:1, minNums:1, minSpecs:1}){
    var letters = 0; //counter for number of letters in password
    var nums = 0; //counter for number of digits in password
    var specs = 0; //counter for number of special characters in password
    for (var i=0;i<password.length;i++){ //iterate through each character in password
        char = password[i];
        if (/^[a-zA-Z]+$/.test(char)){ //increment letters counter if letter
            letters += 1;
        }
        else if (/^[0-9]+$/.test(char)){ //increment nums counter if digit
            nums += 1;
        }else{ //increment spec counter if neither
            specs += 1; 
        }
    }
    if ((password.length < criteria.minLength)||(letters < criteria.minLetters)||(nums < criteria.minNums)||(specs < criteria.minSpecs)){
        return {
            valid: false,
            message: `Password invalid. The password must contain at least ${criteria.minLength.toString()} characters, at least ${criteria.minLetters.toString()} letter/s, at least ${criteria.minNums.toString()} digit/s, and at least ${criteria.minSpecs.toString()} special character/s.`
        }; //unsuccessful if password violates the criteria - return false and error message
    }
    return {
        valid: true,
        message: "Password valid."
    }; //successful if no errors found - return true and success message
}

module.exports = {validateName, validateEmailAddress, validatePassword};

