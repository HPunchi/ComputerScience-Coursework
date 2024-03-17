var deviceDetails = { //global object to store device details
    location: "",
    name: "",
    type: "",
    visibility: false, //default settings
    deviceLocked: false //default settings
};

var deviceID = ""; 
function back(){ //go back from first form
    location.href = "/devices"; //redirect to devices page
}   

function back1(){ //go back from second form
    document.getElementById("addDeviceForm").style.display = "flex"; //display the first form again
    document.getElementById("enterPINForm").style.display = "none"; //hide the second form
}

async function verifySecurityPIN(){ //function called when PIN is entered and submitted on second form
    const securityPIN = document.getElementById("securityPIN").value.toString(); //get string value of entered PIN
    updateDeviceDetails(); //update device details again in case details have changed
    if (securityPIN.length != 4){
        alert("PIN must be 4 digits long.");
        return; //return error if PIN is incomplete or of invalid length
    }
    const options = { //prepare POST request
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            securityPIN: securityPIN, //send inputted security PIN 
            uec: document.getElementById("uecLabel").innerText, //send the UEC this PIN is for (should match the one previously returned in makeUEC() function)
            deviceDetails: deviceDetails, //send device details
            userID: getUserID(), //send userID
            deviceID: deviceID //send deviceID (should also match the one previously returned in makeUEC() function)
        }),
	};
    
	const response = await fetch("/devices/add/verify-pin", options); //send POST request to route
	const res = await response.json(); //convert response to JSON format

    if (res.done){
        document.getElementById("securityPIN").value = ""; //clear security PIN from input regardless of it being correct or incorrect
        if (!res.success){
            alert(res.message);
            back1(); 
            return; //return error and go back to first form if PIN was incorrect
        }else{
            alert(res.message);
            location.href = "/devices"; //show acknowledge of correct PIN and device being added and go back to devices page where new device will appear in a new device pad
        }
    }
}


function updateDeviceDetails(){ //update device details object
    deviceDetails.location = document.getElementById("locationInput").value; //get location input
    deviceDetails.name = document.getElementById("devicenameInput").value; //get name input
    deviceDetails.visibility = document.getElementById("vis").checked; //get visibility input state
    deviceDetails.deviceLocked = document.getElementById("lock").checked; //get device lock input state
    document.getElementsByName("type").forEach((option) => { //iterate through all device types
        if (option.checked){
            deviceDetails.type = option.value; //set device type to whichever is selected (can only be 1 option)
        }
    });
    //no return value as deviceDetails is a global object
}
async function makeUEC(){ //function to make UEC after first form is completed
    updateDeviceDetails(); //update the device details object by syncing from current inputs
    if (deviceDetails.name == "" || deviceDetails.location == "" || deviceDetails.type == ""){ 
        alert("Incomplete details.");
        return false; //return error if any of the inputs are left blank (visiblity and device lock will be set to false by default)
    }
    const options = { //prepare POST request
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            deviceDetails: deviceDetails, //send deviceDetails
            userID: getUserID(), //send userID
        }),
	};
	const response = await fetch("/devices/makeUEC", options); //send POST request to '/devices/makeUEC' route
	const res = await response.json(); //convert response to JSON format
    if (res.done){
        if (res.success){ //if done and successful
            deviceID = res.deviceID; //set deviceID (global variable declared at start)
            document.getElementById("addDeviceForm").style.display = "none"; //hide first form
            document.getElementById("enterPINForm").style.display = "flex"; //show second form

            document.getElementById("uecLabel").innerText = res.uec; //render the provided UEC
            document.getElementById("uecLabel").style.color = "black"; //set to black (in case it was previously red)

        }else{
            if (res.retry){
                makeUEC(); //recursively restart request if told to do so by server (when token clash occurs)
            }
            alert(res.message); //otherwise show error and do not proceed to the second form
        }
    }
    
}

function noUEC(){ //function to launch when no UEC can be rendered
    document.getElementById("uecLabel").innerText = "Unavailable"; //change text to Unavailable 
    document.getElementById("uecLabel").style.color = "red"; //show in red colour
}

/* keyboard shortcuts to give user's faster and seemless form navigation, improving user experience */
document.getElementById("locationInput").addEventListener("keypress", (event) => {
    if (event.key === "Enter"){
        document.getElementById("devicenameInput").focus(); //focus device name input when enter is pressed on the first input
    }
});
document.getElementById("securityPIN").addEventListener("keypress", (event) => {
    if (event.key == "Enter"){
        verifySecurityPIN(); //launch function when enter is pressed on security PIN input
    }
});