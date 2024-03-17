function signIn(){ 
    location.href = "/"; //redirect back to login page
}

function clearInputs(){ //clear all inputs
    document.getElementById("nameInp").value = "";
    document.getElementById("emailInp").value = "";
    document.getElementById("passwordInp").value = "";
    document.getElementById("cpasswordInp").value = "";
    return true;
}
//counter variable to track how many emergency contacts have been added
var contactsAdded = 0; 
//sequence for input collection (useful for event listeners)
const inpSeq = [
    "nameInp",
    "emailInp",
    "passwordInp",
    "cpasswordInp"
]

function loadContactsArr(){
    var emergencyContactsArr = [];
    for (var i=0;i<contactsAdded;i++){
        emergencyContactsArr.push({
            name: document.getElementById(`contact${i+1}NameInp`).value,
            email: document.getElementById(`contact${i+1}EmailInp`).value
        });
    }
    return emergencyContactsArr;
}
async function signUp(){ //function run when 'submit' button is pressed on final part
    var rObj = { //all details are stored in a JavaScript object
        name: document.getElementById("nameInp").value,
        email: document.getElementById("emailInp").value,
        password: document.getElementById("passwordInp").value,
        cPassword: document.getElementById("cpasswordInp").value,
        emergencyContacts: [] //initially blank
    };
    rObj.emergencyContacts = loadContactsArr(); //loads any emergency contacts entered by the user
    if ((rObj.name == "")||(rObj.email == "")||(rObj.password == "")||(rObj.cPassword == "")){
        alert("Details incomplete."); //alerts user if any inputs are left blank
        return false;
    }
    if (rObj.password != rObj.cPassword){ 
        alert("Password do not match."); //alerts user if passwords entered do not match
        return false;
    }
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify(rObj),
	};
    const response = await fetch("/register", options); //sends a POST request to server on /register route
	const res = await response.json(); //converts response to json object
    if (res.done){ //checks if response is complete
        alert(res.message); //outputs appropiate message
        if (res.success){ //if successful clears inputs and redirects to login page
            clearInputs();
            location.href = "/";
        }
        if (res.idClash){ //recursively re-executes function if 2 IDs made by the server are the same
            signUp(); //VERY VERY unlikely to happen but it must be accounted for
        }
    }
}

function moveForward(){ //function to move onto contact inputs from core details
    document.getElementById("mainDetails").style.display = "none";
    document.getElementById("contactDetails").style.display = "block";
}
function moveBack(){ //function to go back to core details from contact inputs
    document.getElementById("contactDetails").style.display = "none";
    document.getElementById("mainDetails").style.display = "block";
}

function addContact(){
    if (contactsAdded == 3){
        return;
    }
    //creates a sub DIV and loads name and email input fields per contact
    var parentDiv1 = document.createElement("div");
    parentDiv1.className = "ttb cDiv";
    parentDiv1.id = `contact1AddDiv${contactsAdded+1}`;
    parentDiv1.setAttribute("name", (contactsAdded+1).toString());

    var nameInput = document.createElement("input");
    nameInput.id = `contact${contactsAdded+1}NameInp`;
    nameInput.className = "inputFieldStyle contactNameInput contactInput";
    nameInput.placeholder = `Name ${contactsAdded+1}:`;

    var parentDiv2 = document.createElement("div");
    parentDiv2.className = "ttb cDiv";
    parentDiv2.id = `contact2AddDiv${contactsAdded+1}`;
    parentDiv2.setAttribute("name", (contactsAdded+1).toString());


    var emailInput = document.createElement("input");
    emailInput.id = `contact${contactsAdded+1}EmailInp`;
    emailInput.className = "inputFieldStyle contactEmailInput contactInput";
    emailInput.placeholder = `Email ${contactsAdded+1}:`;

    parentDiv1.appendChild(nameInput);
    parentDiv2.appendChild(emailInput);
    document.getElementById("contactsHolder").appendChild(parentDiv1);
    document.getElementById("contactsHolder").appendChild(parentDiv2);

    contactsAdded += 1; //increment counter

    document.getElementById(`contact${contactsAdded}NameInp`).focus(); //selects input field to enter name
    document.getElementById(`contact${contactsAdded}NameInp`).addEventListener("keydown", (event) => {
        if (event.key == "Enter"){ //moves onto next input when 'enter' key is pressed
            document.getElementById(`contact${contactsAdded}EmailInp`).focus();
        }
    });
    document.getElementById(`contact${contactsAdded}EmailInp`).addEventListener("keydown", (event) => {
        if (event.key == "Enter"){ //adds another contact when 'enter' key is pressed on last input
            addContact();
        }
    });
}

function removeContact(){
    if (contactsAdded == 0){ //skip function if there are no contacts loaded at present
        return;
    }
    //removes appropiate DIVs from webpage
    document.getElementById(`contact1AddDiv${contactsAdded}`).remove(); 
    document.getElementById(`contact2AddDiv${contactsAdded}`).remove();
    
    contactsAdded -= 1; //decrements variable
}




for (var i=0;i<inpSeq.length-1;i++){ //iterates through all items of input sequence apart from the last
    document.getElementById(inpSeq[i]).addEventListener("keydown", (event) => { //gets current input
        if (event.key == "Enter"){ //runs code below to focus next input in sequence when 'enter' is presssed
            document.getElementById(inpSeq[inpSeq.indexOf(event.target.id)+1]).focus();
        }
    });
}
document.getElementById(inpSeq[inpSeq.length-1]).addEventListener("keydown", (event) => {
    if (event.key == "Enter"){
        moveForward(); //moves onto to emergnecy contacts when the user presses 'enter' on the final input of core details
    }  
});



