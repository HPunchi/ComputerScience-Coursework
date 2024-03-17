var api = require('../node_modules/clicksend/api.js');

const username = 'harman.p';
const apiKey = '7ADFBB43-047F-4605-7569-58E069AFFFB3';

const sendNum = '+18338231708';


var textcontentMsg = 'Hello <name>, this is a SMS message from HomeShield. Here is your tag code: 3547';
var voicetoneMsg = "Hello <name>, this is a HomeShield authentication call to verify your phone number. Listen closely for the following tag code: 3. 4. 5. 7. Repeating. 3. 4. 5. 7. This call will now terminate.";
function smsM(number, textcontentMsg){
    var smsMessage = new api.SmsMessage();

    smsMessage.from = sendNum;
    smsMessage.to = number;
    smsMessage.body = textcontentMsg;
    
    var smsApi = new api.SMSApi(username, apiKey);
    
    var smsCollection = new api.SmsMessageCollection();
    
    smsCollection.messages = [smsMessage]
    
    console.log('Texting: ', number);

    smsApi.smsSendPost(smsCollection).then((res) => {
        console.log(res.body);
    }).catch((err) => {
        console.log(err.body);
    });;
}

function voicecall(number, voicetoneMsg){
    var voiceDeliveryReceiptApi = new api.VoiceApi(username, apiKey);

    var voiceMessage = new api.VoiceMessage();

    voiceMessage.to = number;
    voiceMessage.body = voicetoneMsg,
    voiceMessage.voice = "male";
    voiceMessage.customString = "HomeShield";
    //voiceMessage.country = "United Kingdom";
    voiceMessage.country = 'US';
    voiceMessage.source = "php";
    voiceMessage.lang = "en-us";
    voiceMessage.machineDetection = 0;

    var voiceMessages = new api.VoiceMessageCollection();

    voiceMessages.messages = [voiceMessage]


    
    voiceDeliveryReceiptApi.voiceSendPost(voiceMessages).then(function(response) {
        console.log(response.body);
    }).catch(function(err){
        console.error(err.body);
    });
}



function phoneCallAUTH(number, name){
    voicecall(number, voicetoneMsg.replace('<name>', name));
}
function smsAUTH(number, name){
    smsM(number, textcontentMsg.replace('<name>', name));
}

module.exports = { phoneCallAUTH, smsAUTH };