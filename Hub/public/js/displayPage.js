function returnButtonClick(){
    const tokenValue = sessionStorage.getItem("hsli_token"); 
    if (tokenValue === null){
        location.href = "/"; //login in again if no token is found
    }else{
        location.href = "/control-centre"; //redirect to control centre if token is there
    }
}
