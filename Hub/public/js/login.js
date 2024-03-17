function clearFields(){ //clears all input fields
    document.getElementById("emailInp").value = "";
    document.getElementById("passwordInp").value = "";
}

function createAccount(){ //redirect to sign up page if button pressed
    location.href = "/register";
}

function handleKeyPress(event){
    if (event.key == "Enter"){
        login(); //call login function when enter is pressed on password input
    }
}

function switchPassword(event){
    if (event.key == "Enter"){
        document.getElementById("passwordInp").focus(); 
        //focus password input if enter is pressed on email address input
    }
}


async function login(){
    var sendObj = { //packs email and password entered by user into a JS object
		email: document.getElementById("emailInp").value,
		password: document.getElementById("passwordInp").value
	};

    if ((sendObj.email == "")||(sendObj.password == "")){
        alert("Incomplete credentials."); //returns error if either field is incomplete
        return; //terminates function runtime
    }
	const options = {
		method: "POST", //define type of request
		headers: {
			"Content-type": "application/json", //appropiate headers are set
		},
		body: JSON.stringify(sendObj), //defines sendObject (actual data to be sent)
	};
	const response = await fetch("/login", options); //sends POST request to route '/login'
	const res = await response.json(); //converts response into JSON format
    if (res.done){ //runs code below if response is complete
        if (res.success){ 
            sessionStorage.setItem("hsli_token", res.token); //sets token to variable in session storage on clients device
            clearFields(); //input fields are cleared
            location.href = "/control-centre"; //redirects to control centre page at path '/cc'
            return;
        }
        if (res.repeat){
            login(); //repeats function if server wants to retry the request (rare case)
        }else{
            alert(res.message); //otherwise renders error message
            document.getElementById("emailInp").value = "";
            document.getElementById("passwordInp").value = "";
            document.getElementById("emailInp").focus();
        }       
    }
}

