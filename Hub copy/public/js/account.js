if (location.pathname == "/account"){
    location.href = `/account/${sessionStorage.getItem("hsli_token")}`; //upon a static redirect load the token into the URL and redirect for data
}

var ammendedIDsArr = []; //IDs of ammendments made so far


async function deleteAccount(){
    if (!confirm("WARNING. Deleting an account is an irreversible action and all data linked to this account will be removed permanently. Are you sure you would like to proceed?")){
        return; //end the function if the user does not confirm that they seek to delete their account
    }
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            token: sessionStorage.getItem("hsli_token") //send token
        })
	}; 
	const response = await fetch("/account/accountDelete", options); //send POST request to route
	const res = await response.json(); //convert response to JSON format

    if (res.done){
        if (!res.success){
            return alert("There was an error with this action. Please try again later."); //error if operation was not successful
        }else{
            alert("Account was successfully deleted. You will be redirected now."); //confirm account deletion if successful
            sessionStorage.removeItem("hsli_token"); //remove the token
            location.href = "/"; //redirect back to login page at base
        }
    }
}

function editDetail(dataElement){ //dataElement marks the field name of the corresponding data attribute that is being editted
    document.getElementById(`de${dataElement}`).style.display = "none"; //hide the data element (showing the current information)
    document.getElementById(`cd${dataElement}EB`).style.display = "flex"; //display the new input field DIV so the new text can be typed in
    
    console.log(document.getElementById(`cd${dataElement}EB`).childNodes);
    document.getElementById(`cd${dataElement}EB`).childNodes[1].focus(); //focus the input field so the user doesn't have to click it each time
    ammendedIDsArr.push(`cd${dataElement}EB`); //add field name to ammendedIDs array 
    setEditMode(true); //activate the editting mode
}
function setEditMode(endPointOn){
    if (endPointOn){ //if setting the editting mode to on
        document.getElementById("editBtn").style.display = "none"; //hide the plain edit button
        document.getElementById("sEditBtn").style.display = "block"; //show the set edit button (to confirm edits on server)
        return; //end function
    } //otherwise when turning off...
    document.getElementById("editBtn").style.display = "block"; //restore the plain edit button
    document.getElementById("sEditBtn").style.display = "none"; //hide the set edit button
}

function plainEdit(){
    alert("Tap on a field to edit it. Your email address for this account cannot be editted."); //prompt user to tap on field to perform an edit
}
function resetAll(){
    location.href = `/account/${sessionStorage.getItem("hsli_token")}`; 
    //function to reset the entire page (close all extra forms) and load account data fresh as it is on the database at present
}
async function editDetails(){ //function to perform any edits made
    var ammendedObj = {}; //blank object to be filled with edits made on various fields
    ammendedIDsArr.forEach((ammendedID) => { //iterate through each field an edit was made on
        var v = document.getElementById(ammendedID).childNodes[1].value; //get value of new information
        var id = ammendedID.substring(2, ammendedID.length -2); //recall field name
        if ((v != undefined)&&(v!= "")){ 
            ammendedObj[id] = v; //set the object key to the value if it is not undefined and not blank
        }
    });
    if (Object.keys(ammendedObj).length == 0){ //if no ammendments have been made reset the page (to remove input fields) and end function
        resetAll();
        return;
    }
    var data = JSON.parse(document.getElementById("details").dataset.details); //reconstruct data object stored in details dataset - parse as object
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            token: sessionStorage.getItem("hsli_token"), //token
            ammendedObj: ammendedObj, //ammended data object
            orgData: data //original data
        }),
	};
    
	const response = await fetch("/account/edit", options); //make the request on route
	const res = await response.json(); //convert response to JSON

    if (res.done){ //run code below when request has been completed
        alert(res.message); //output server's message to client (either success or error)
        return resetAll(); //reload the page with the edits made on the database to re-render with them included
    }
}
function triggerPWDChange(){
    document.getElementById("passwordChange").style.display = "flex"; //show change password form
    document.getElementById("oldPassword").focus(); //focus on first input field so user can start typing
}
function cancelPWDChange(){
    document.getElementById("passwordChange").style.display = "none"; //hide change password form
}

function triggerContactAdd(){
    document.getElementById("contactAdd").style.display = "flex"; //show add contact form
    document.getElementById("newContactName").focus(); //focus on first input field so user can start typing
}
function cancelContactAdd(){
    document.getElementById("contactAdd").style.display = "none"; //hide add contact form
}

async function addContact(){
    const name = document.getElementById("newContactName").value; //get inputted name
    const cEmail = document.getElementById("newContactEmail").value; //get inputted email address

    if ((name == "")||(cEmail == "")){
        return alert("Details incomplete."); //show error and end function if either input is left empty
    }
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            token: sessionStorage.getItem("hsli_token"),
            name: name, //name of new contact
            email: cEmail //email of new contact
        })
	};
    
	const response = await fetch("/account/contactAdd", options); //send request
	const res = await response.json(); //convert to JSON

    if (res.done){
        if (!res.success){ 
            document.getElementById("newContactName").value = ""; //clear input for name
            document.getElementById("newContactEmail").value = ""; //clear input for email
            return alert(res.message); //show error message and end function
        }else{
            alert(res.message); //show success message
            resetAll(); //reload page
        }
    }
}


async function changePassword(){
    const oldPassword = document.getElementById("oldPassword").value; //get old password
    const newPassword = document.getElementById("newPassword").value; //get new password
    const cPassword = document.getElementById("cPassword").value; //get confirmed new password

    if (newPassword != cPassword){ //run code below if new passwords do not match
        document.getElementById("oldPassword").value = ""; //clear input
        document.getElementById("newPassword").value = ""; //clear input
        document.getElementById("cPassword").value = ""; //clear input
        return alert("New passwords do not match."); //return error
    }

    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            token: sessionStorage.getItem("hsli_token"), //token
            oldPassword: oldPassword, //old password
            newPassword: newPassword //new password
        }),
	};
    
	const response = await fetch("/account/passwordChange", options); //send request on route
	const res = await response.json(); //convert response to JSON

    if (res.done){
        if (!res.success){ //clear inputs and return error if unsuccessful
            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("cPassword").value = "";
            return alert(res.message);
        }else{
            alert(res.message); //show success message
            cancelPWDChange(); //close password change form
            return; //end function
        }
    }
}

async function removeContact(contactID){
    if (!confirm("Would you like to remove this emergency contact? This action cannot be reversed.")){
        return; //end function if user does not confirm
    }
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            contactID: contactID //contactID of contact being removed
        }),
	};
    
	const response = await fetch("/account/contactDel", options); //send request on route
	const res = await response.json(); //convert to JSON

    if (res.done && res.success){ //if complete and successful reload the page for changes to appear
        resetAll();
    }
}