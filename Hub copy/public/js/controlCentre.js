if (location.pathname == "/control-centre"){ //if the path does not currently have a token run code below
    location.href = `/control-centre/${sessionStorage.getItem("hsli_token")}`; //load path with user's token (verified at server)
}
//declaration of variables and arrays below
observingEvent = "";
var liCaps = 0; 

var masterEventLog = [
]; //store all events as objects
var loadedCCEventIDs = []; //store cumulative connection event IDs
var loadedEvents = []; //store immediate loaded events as objects

var allLocations = []; //store names of all locations as strings
var allEventNames = []; //store names of all types of events as strings

async function toggleStatus(uec, current, buttonElement){ //function to change between a connections states [armed/idle]
    const options = { //prepare POST request
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            uec: uec, //UEC to toggle
            current: current, //current state
            userID: getUserID() //user ID of user
        }),
	};
	const response = await fetch("/control-centre/toggleStatus", options); //send POST request
	const res = await response.json(); //convert response into JSON

    if (res.done){
        if (!res.success){
            alert(res.message); //error if unsuccessful
        }else{
            if (res.changed){ //run code below if the state has been successfully changed
                buttonElement.className = `standardButton tblBtn ${res.newStatus.toLowerCase()}`; //change class to update styles
                buttonElement.value = res.newStatus; //set value to new state
                buttonElement.innerText = res.newStatus; //set text to new state
            }
        }
    }
}


function clearEventLogs(){ //function to clear all events inside of the container
    var div = document.getElementById('elContainer'); //get element of event log container
    while(div.firstChild){ //iterate through each child element (i.e. each event)
        div.removeChild(div.firstChild); //remove child
    }
}

function addEventLog(event, eLocation="<location>"){ //function add an individual event to the event log
    var utcSeconds = parseInt(event.timestamp); //cast timestamp to integer if it isn't already
    var d = (new Date(utcSeconds)).toString(); //convert to stringed Date object

    //formatted date time in the string lies before the time zone + or - sign depending on time zone of device
    var formattedDT = d.split("+")[0]; //extract bit before +
    if (formattedDT.length == d.length){ 
        formattedDT = d.split("-")[0]; //extract bit before - if no change
    }
    
    var formattedDes = event.description; //acquire description from event object
    formattedDes = formattedDes.replace("<location>", eLocation); //replace location tag with real location

    eventText = `${event.category}: ${event.name} [${formattedDT}] - ${formattedDes}`; //format data into one string

    var newEL = document.createElement("p"); //new P element
    newEL.className = "eventLog"; //set class name
    newEL.innerText = eventText; //set text to formatted string of element

    document.getElementById("elContainer").insertAdjacentHTML('afterbegin', newEL.outerHTML); //add new element on top of other events inside of container

    event.location = eLocation; //add the location to the events object
    
    loadedEvents.push(event); //store this event object that has been loaded into an array which is useful for future reference and functions
}

async function getEventLog(parentPad){
    const uec = parentPad.id; //get UEC of connection
    const location = parentPad.dataset.location; //get location of connection

    var locationFilters = document.getElementsByClassName('locationCheckbox'); //array of input checkbox elements for location

    for (var i=0;i < locationFilters.length; i++){ //iterate through each checkbox in array
        var checkboxLocation = locationFilters[i].id.replace('-dd-option', ''); //get the location of the checkbox input element
        if (location == checkboxLocation){
            document.getElementById(locationFilters[i].id).checked = true; //set filter to true if it matches location to get event log for
        }else{
            document.getElementById(locationFilters[i].id).checked = false; //otherwise set false for every other checkbox
        }
    }
    
    loadEvents();
    
    /*
    if (parentPad.dataset.online == "0"){
        return alert("This command cannot be performed on an offline device.");
    }
    const options = {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            uec: uec,
            userID: getUserID()
        }),
	};

	const response = await fetch("/control-centre/getEventLog", options);
	const res = await response.json();

    if (res.done){
        if (!res.success){
            return alert(res.message);
        }
        clearEventLogs();

        for (var i=0;i<res.eventLog.length;i++){
            const currentEvent = res.eventLog[i];

            var utcSeconds = parseInt(currentEvent.timestamp);
            var d = (new Date(utcSeconds)).toString();

            var formattedDT = d.split("+")[0];
            if (formattedDT.length == d.length){
                formattedDT = d.split("-")[0];
            }
            
            var formattedDes = currentEvent.description;
            formattedDes = formattedDes.replace("<location>", location);


            addEventLog(
                `${currentEvent.category}: ${currentEvent.name} [${formattedDT}] - ${formattedDes}`
            );

        }

        //{"eventID":"0","timestamp":"1701207534898","name":"Motion Detected","category":"Alert","description":"Motion was detected at <location>","severity":"High"}
    }
    */
}

async function sendCommand(parentPad, commandID){
    const uec = parentPad.id; //get uec of connection command is to act on
    const location = parentPad.dataset.location; //location of the connection
    //if (parentPad.dataset.online == "0"){ //if the connection is offline display an error and stop the function from proceeding
    //    return alert("This command cannot be performed on an offline device.");
    //}
    const options = { //prepare POST request to send to server
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            uec: uec, //uec of connection
            userID: getUserID(), //userID
            commandID: commandID //comandID (0 = live image, 1 = play sound)
        })
	};
    
	const response = await fetch("/control-centre/sendCommand", options); //send POST request to server route '/control-centre/sendCommand'
	const res = await response.json(); //convert response to a JSON format

    if (res.done){
        if (!res.success){
            return alert(res.message); //display error if the server's processing is not successful
        }
        if (commandID == "0"){ //run the code below only if the command was commandID 0 (i.e. capturing a live image)
            fetchPhoto(uec); //this function (to be written) will retrieve the captured photo and render it to the user
        }
    }
    
}

async function fetchPhoto(uec){ //function to fetch the live photo from database
    if (uec == ""){ 
        return alert("Error occured."); //terminate the function and show error if there is a blank UEC
    }
    const options = { //prepare object for POST request
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({
            uec: uec, //send UEC
            userID: getUserID() //send userID
        })
	};
    const imageResp = await fetch("/control-centre/getLiveImage", options); //send POST request to route '/control-centre/getLiveImage'
	const imgRes = await imageResp.json(); //convert response to JSON
    if (imgRes.done){ //run code once response is done
        if (!imgRes.success){ //run code below if response was not successful
            if (imgRes.imgUnavailable){ //run code below if server has explicity said image is not available
                liCaps += 1; //increment live image captures variable by 1 (declared at 0 at start of program)
                if (liCaps < 3){ //if less than 3 captures have been trialled, run code below
                    console.log("Capture image timed out."); //console.log the error onto the console
                    await delay(5000); //wait for 5 seconds
                    fetchPhoto(uec); //recursively call this function again (liCaps has a higher value now - tend towards base case trigger)
                }else{ //run code below once live image captures (attempts to access live image) surpasses 3
                    liCaps = 0; //reset for future live image command
                    document.getElementById("capturedLiveImage").removeAttribute("src"); //remove source from image on display
                    return alert("An error occured."); //show error and terminate function
                    
                }
                
            }
        }else{ //run code below if response was successful (i.e. image was returned)
            liCaps = 0; //reset for future live image command
            const imageData = imgRes.liveImage; //get image data
            document.getElementById("defaultIconDiv").style.display = "none"; //hide the default icon (HomeShield Logo)
            document.getElementById("capturedLiveImage").src = `data:image/jpg;base64,${imageData}`; //format the base 64 string of image into source URL to load image
            
        }
    }
}
function delay(ms){	
    return new Promise(resolve => setTimeout(resolve, ms)); //return Promise with a timeout set to the number of specified milliseconds
}

function getUECArr(){
    var cBoxes = document.getElementsByClassName("cBox"); //array of elements with class 'cBox'
    var uecs = []; //empty array to store UECs
    for (let i=0; i<cBoxes.length; i++){ //iterate through each element in cBoxes array
        uecs.push(cBoxes[i].id); //get UEC by getting ID and push to uecs array 
    }
    return uecs; //return uecs array
}
async function serverPing(){ //function to 'ping' the server to receive overall updates
    const uecs = getUECArr(); //get array of UECs
    if (uecs.length == 0){
        return; //end the function if the user has got no UECs
    }
    const options = { //prepare POST request to server
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({ //send following info in stringified JSON form
            uecs: uecs, //list of all UECs
            userID: getUserID(), //userID of user
            token: sessionStorage.getItem("hsli_token") //token acquired from login
        })
	};
    const resp = await fetch("/control-centre/serverPing", options); //send POST request to server on '/control-centre/serverPing' route
	const res = await resp.json(); //convert response to JSON

    if (res.done){
        if (!res.success){
            return alert(res.message); //output error if unsuccessful and end function
        }else{
            res.uecData.forEach((obj) => { //iterate through each object in UEC data (1 object per UEC)
                if (obj.online == 1){ //run code below if device is online
                    document.getElementById(`${obj.uec}`).dataset.status = "online"; //set data status to online of UEC's connection pad
                    document.getElementById(`${obj.uec}statLabel`).className = "custom-label online"; //change class to change colours and styling
                    document.getElementById(`${obj.uec}statLabel`).childNodes[3].innerText = "Online"; //change text to show online
                }else if (obj.online == 0){ //run code below if device if offline (vice versa of above)
                    document.getElementById(`${obj.uec}`).dataset.status = "offline";
                    document.getElementById(`${obj.uec}statLabel`).className = "custom-label offline";
                    document.getElementById(`${obj.uec}statLabel`).childNodes[3].innerText = "Offline";
                }
            });
            res.allEvents.forEach((event) => { //iterate through each object in allEvents (1 object per event - regardless of which UEC it belongs to)
                if (!loadedCCEventIDs.includes(event.connectionEventID)){ //discard the code below if this event has already been recognised and acknowledged by the client and move onto next event
                    event.location = document.getElementById(event.uec).dataset.location; //get the location from the UEC through HTML data attributes and set this to the location in the event object                
                    masterEventLog.push(event); //add the entire object to the masterEventLog
                    loadedCCEventIDs.push(event.connectionEventID); //add connectionEventID to array of loaded connectionEventIDs - simple way to keep track of which events (anywhere and everywhere on the system) have been loaded
                }
            });
        }
    }
}

async function clientPollingLoop(pingRate=5000){ //default pingRate at 5000ms but can be manually specified in parameter
    while (true){ //repeat this cycle forever until page is closed or shut down
        serverPing(); //make the server ping which will update parts of the UI and global variables
        loadEvents(); //load any of the newly captured events to the event log and apply the filters
        await delay(pingRate); //wait for the amount of time specified by pingRate (5 seconds) before moving onto the next iteration
    }
}

function toggleDropdown(self){
    var centreID = self.parentNode.childNodes[3].id; 
    var ddos = document.getElementsByClassName("dd-options");
    for (let i=0;i<ddos.length;i++){
        if (ddos[i].id != centreID){
            ddos[i].style.display = "none";
        }
    }
    var c = self.parentNode.childNodes[3].style.display;
    if (c == "block"){
        self.parentNode.childNodes[3].style.display = "none";
    }else{
        self.parentNode.childNodes[3].style.display = "block";
    }
}


async function loadDropboxes(){
    const pads = document.getElementsByClassName("cBox"); //get an array of connection pads
    
    for (let i=0;i<pads.length;i++){ //iterate through each connection pad
        var location = pads[i].dataset.location; //location of device
        var newParent = document.createElement("DIV"); //create a new parent div
        var newCheckBox = document.createElement("INPUT"); //create a new input element
        var newLabel = document.createElement("LABEL"); //create a new label element

        newParent.className = "dd-option"; //set div to be a dropdown option

        newCheckBox.type = "checkbox"; //make the input a type of checkbox
        newCheckBox.className = "locationCheckbox"; //set classname of checkbox to acquire styles
        newCheckBox.id = `${location}-dd-option`; //make unique ID for checkbox element

        newLabel.setAttribute("for", `${location}-dd-option`); //bind the label to its checkbox
        newLabel.innerText = location; //set label text to the location

        newParent.appendChild(newCheckBox); //load checkbox into parent div
        newParent.appendChild(newLabel); //load label into parent div

        document.getElementById("locationOptions").appendChild(newParent); //load parent div into the main area for location options
        
        allLocations.push(location); //add location to array of all locations
    }

    const options = { //prepare POST request to request the types of events available on the database
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({})
	};

    const resp = await fetch("/control-centre/allEvents", options); //POST request sent to server to get event types
	const res = await resp.json(); //convert response to JSON

    if (res.done){ //run code below once the response is done and received successfully
        allEventNames = res.events; //array of names of events (eg. motion detected, battery low)
        res.events.forEach((event) => { //iterate through each type of event
            var newParent = document.createElement("DIV"); //parent div
            var newCheckBox = document.createElement("INPUT"); //input element
            var newLabel = document.createElement("LABEL"); //label element

            newParent.className = "dd-option"; //type of dropdown option

            newCheckBox.type = "checkbox"; //make input a form of checkbox
            newCheckBox.className = "eventCheckbox";//classname to inherit CSS styles
            newCheckBox.id = `${event}-dd-option`; //unqiue ID

            newLabel.setAttribute("for", `${event}-dd-option`); //bind the label to the checkbox input
            newLabel.innerText = event; //set text to name of event

            newParent.appendChild(newCheckBox); //add to parent div
            newParent.appendChild(newLabel); //add to parent div

            document.getElementById("eventOptions").appendChild(newParent); //add parent div to filter box container
        });
    }
}

function getLogSettings(){ //function to return a filter object to help decide which events are allowed to be shown on the event log
    var filters = { //declaration of filters object
        location: [],
        timeBackShift: Date.now(),
        status: [],
        events: [],
        sortBy: ""
    };
    var lCBs = document.getElementsByClassName("locationCheckbox"); //array of elements of location checkboxes
    var checkedItems = false; //by default no locations are selected
    for (let i=0;i<lCBs.length;i++){ //iterate through each location checkbox
        if (lCBs[i].checked){ //run the code below if the current location checkbox is checked
            checkedItems = true; //change flag to show at least one selection has been made
            filters.location.push(lCBs[i].id.replace("-dd-option", "")); //extract the location from ID of checkbox and add to object
        }
    }
    if (!checkedItems){
        filters.location = allLocations; //add all locations to object if no selections have been made
    }
    var tFOs = document.getElementsByClassName("timeFO"); //array of elements of time checkboxes
    for (let i=tFOs.length-1;i>-1;i--){ //iterate through each time checkbox
        if (tFOs[i].checked){ //if the current time checkbox is checked run the code below
            var eID = tFOs[i].id.replace("DDO", ""); //extract the time filter from the ID
            //branch through possible time filters from longest time period to shortest (the checkbox with the largest time period takes priority)
            if (eID == "month"){
                filters.timeBackShift = 1000*60*60*24*30; //set backshift of a month (equal to 30 days)
            }else if (eID == "week"){
                filters.timeBackShift = 1000*60*60*24*7; //set backshift of a week (equal to 7 days)
            }else if (eID == "day"){
                filters.timeBackShift = 1000*60*60*24; //set backshift of a day (equal to 24 hours)
            }else if (eID == "hour"){
                filters.timeBackShift = 1000*60*60; //set backshift of an hour (equal to 60 minutes)
            }
            break; //once a time backshift has been made, the loop is exitted from
        }    
    }

    var statusAssigned = false; //by default no status filter is flaced
    if (document.getElementById("onlineStat").checked){ 
        filters.status.push("online");
        statusAssigned = true;
    } //if the online filter is checked, add it to the filters object and set the assignment flag to true
    if (document.getElementById("offlineStat").checked){
        filters.status.push("offline");
        statusAssigned = true;
    } //if the offlien filter is checked, add it to the filters object and set the assignment flag to true
    if (!statusAssigned){
        filters.status = ["online", "offline"];
    } //if no status filter option is chosen, by default add both 'online' and 'offline' options to the filters object
    
    var eCBs = document.getElementsByClassName("eventCheckbox"); //get array of all event type checkboxes
    var checkedItems = false; //flag to keep track of whether any event filters have been selected
    for (let i=0;i<eCBs.length;i++){ //iterate through each checkbox
        if (eCBs[i].checked){ //if an option is selected, update the flag and add the event name to the filter object by extracting it from the ID of the checbkox element
            checkedItems = true;
            filters.events.push(eCBs[i].id.replace("-dd-option", ""));
        }
    }
    if (!checkedItems){ //if no event filters are checked, add all events to the filter object
        filters.events = allEventNames;
    }
    var sBOs = document.getElementsByName("sortbyCrit"); //array of sort by option elements
    for (let i=0;i<sBOs.length;i++){ //iterate through each sort option
        if (sBOs[i].checked){ //if a sort option is checked run the code below
            filters.sortBy = sBOs[i].id.replace("SB", ""); //extract the sort by code from the ID and add it to the filters object
            break; //automatically exit from the loop as only option will be selected at all times
        }
    }

    return filters; //return the populated filters object
    
}

function loadEvents(eventList=masterEventLog){
    const filters = getLogSettings(); //get filter object

    //keep events that satisfy location requirements
    eventList = eventList.filter((obj) => filters.location.includes(obj.location));
    //keep events within time requirements
    eventList = eventList.filter((obj) => ((Date.now() - (parseInt(obj.timestamp) + (new Date()).getTimezoneOffset()))<=filters.timeBackShift)); 
    //keep events that satisfy status requirements (fetch status from element dataset using location name)
    eventList = eventList.filter((obj) => filters.status.includes(document.querySelector(`[data-location='${obj.location}']`).dataset.status));
    //keep events that satisfy event type requirements
    eventList = eventList.filter((obj) => filters.events.includes(obj.name));

    if (filters.sortBy == 'nto'){ //newest to oldest
        eventList.sort((a, b) => { return a.timestamp - b.timestamp; }); //order timestamps in ascending order
        
    }else if (filters.sortBy == 'otn'){ //oldest to newest
        eventList.sort((a, b) => { return b.timestamp - a.timestamp });  //order timestamps in descending order
    }

    
    clearEventLogs(); //clear all contents of event log
    //eventList.reverse(); //apply stack correction by reversing the array
    eventList.forEach((event) => { //iterate through each sorted and filtered element in array
        addEventLog(event, event.location); //add it to the event log by passing in the object and its location as separate parameters
    });
}

function filterOptionDisplay(criteria){ //get the current criteria for the filter button that was clicked
    if (document.getElementById(`${criteria}Options`).style.display == "block"){
        document.getElementById(`${criteria}Options`).style.display = "none";
        return; //if options for the current filter are showing, hide them and end the function
    }
    const fods = document.getElementsByClassName("dd-options"); //array of div elements for other dropdown options
    for (let i=0;i<fods.length;i++){ //iterate through each div
        fods[i].style.display = "none";  //hide div
        if (fods[i].id == `${criteria}Options`){
            fods[i].style.display = "block"; //show div if it was the div for the filter button that was clicked
        }
    }

}

function readText(text){
    var speech = new SpeechSynthesisUtterance(text);
    
    var voices = window.speechSynthesis.getVoices();
    speech.voice = voices.find(voice => voice.lang === 'en-US' &&  voice.gender === 'female');
    speech.pitch = 0.5;
    speech.rate = 1.9;
    window.speechSynthesis.speak(speech);
}

document.getElementById('filterBox').addEventListener('click', () => {
    loadEvents();
});

loadDropboxes(); //load the filter option dropboxes with dynamic data
document.getElementById("ntoSB").checked = true; //select newest to oldest sort option by default
clientPollingLoop(); //intitiate the polling loop at default ping rate
