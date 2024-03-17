async function tokenCheck(token=sessionStorage.getItem("hsli_token")){ 
    var sendObj = { //token is by default fetched from session storage
        token: token, //token being sent to server for check
    }; 
    const options = { //preparing POST request data
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify(sendObj),
	};
	const response = await fetch("/control-centre/test", options); //sending POST request to test route
	const res = await response.json(); //converting response into a JSON format

    if (res.complete){
        if (!res.valid){ //trigger code if response is complete but invalid
            sessionStorage.removeItem("hsli_token"); //wipe the invalid token from session storage
            location.href = `/display?title=${"Token Error"}&text=${res.message}`; //display error page
            return false;
        }
        sessionStorage.setItem("hsh_userid", res.userID); //access user id of token and load into session storage
    };
}  

function getUserID(){
    const userID = sessionStorage.getItem("hsh_userid"); //access user ID stored in session storage
    if (userID === null){ 
        return ""; //return an empty string instead of the null data type to avoid runtime errors
    }
    return userID; //return user ID
}
function logout(){
    sessionStorage.removeItem("hsli_token"); //clear token from session storage
    location.href = "/"; //redirect back to login page
}

selectedRows = [];
let mouseholdTimer;
const readoutsOn = false;
function selectRow(elem, classNameCheck="checked"){

    if (!elem.className.includes(classNameCheck)){
        elem.className += ` ${classNameCheck}`;
        selectedRows.push(elem.id);
    }else{ 
        elem.className = "statusLabel";
        selectedRows.splice(selectedRows.indexOf(elem.id));
    }
}


tokenCheck();
if (readoutsOn){
    document.addEventListener('mousemove', e => {
    
        clearTimeout(mouseholdTimer);
    
        mouseholdTimer = setTimeout(() => {
            window.speechSynthesis.cancel();
    
            var elem = document.elementFromPoint(e.clientX, e.clientY);
    
            var illegalNodeTypes = ['DIV', 'HTML', 'BODY'];
            
            var text = elem.dataset.readout;
            if (text === undefined){
                text = elem.innerText;
            }
            
            if (elem.nodeName == 'I'){
                text = elem.parentNode.title;
            }
    
    
            if ((!illegalNodeTypes.includes(elem.nodeName))&&(true)){
                var speech = new SpeechSynthesisUtterance(text);
                var voices = window.speechSynthesis.getVoices();
                speech.voice = voices.find(voice => voice.lang === 'en-US' &&  voice.gender === 'male');
                speech.pitch = 0.9;
                speech.rate = 0.85;
                speech.volume = 1;
                window.speechSynthesis.speak(speech);
            }
        }, 300);
        
    
        
    }, {passive: true});
}
