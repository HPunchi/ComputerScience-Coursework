var selectedRows = []; //empty array showing no previous selections

function toggleSelect(deviceID, currentState){ //toggle a selection using deviceID and current state
    if (currentState == "unselected"){ 
        selectedRows.push(deviceID); //if not selected add deviceID to selectedRows array
        document.getElementById(deviceID).className = "box dBoxSelect"; //make box blue
        document.getElementById(`${deviceID}SB`).className = "select-button SBon"; //highlight button blue
        document.getElementById(`${deviceID}SB`).dataset.state = "selected"; //change state
    }else if (currentState == "selected"){
        selectedRows.splice(selectedRows.indexOf(deviceID), 1); //remove deviceID from array if selected
        document.getElementById(deviceID).className = "box"; //reset box
        document.getElementById(`${deviceID}SB`).className = "select-button"; //reset select button
        document.getElementById(`${deviceID}SB`).dataset.state = "unselected"; //reset state
    }
}

if (location.pathname == "/devices"){ //if a blank path is returned and token check is done (due to defer)
    location.href = `/devices/${sessionStorage.getItem("hsli_token")}`; //add token to path and resend request
}



async function removeDevices(){
    if (selectedRows.length === 0){
        return alert("Select devices you would like to remove."); //return error if no devices are selected
    }

    var sendObj = { //compile userID and array of deviceIDs into object
        userID: getUserID(),
        devicesIDs: selectedRows
    };
    const options = { //prepare post request
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify(sendObj),
	};

	const response = await fetch("/devices/remove-devices", options); //send request to remove-devices route 
	const res = await response.json(); //convert response to JSON format
    
    if (res.done){
        if (!res.success){
            return alert("Error in deletion."); //return error if unsuccessful
        }
        selectedRows.forEach((removeID) => { //remove deleted device pads from screen
            var e = document.getElementById(removeID);
            e.parentNode.removeChild(e);
        });
    
        selectedRows = []; //reset array
    }
}

