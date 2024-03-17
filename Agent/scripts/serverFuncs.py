import requests
import base64
import json

url = "http://localhost" 


def checkUEC(uec):
    route = "/api/retrievePIN"
    
    res = requests.post(url + route, json={"uec": uec}).json()
    
    return res

def checkConnected(uec):
    route = "/api/checkConnected"
    
    res = requests.post(url + route, json={"uec": uec}).json()
    
    return res["connected"]

def uecEncr(uec):
    route = "/api/encrUEC"
    
    res = requests.post(url + route, json={"uec": uec}).json()
    
    return res["encryptedUEC"]

def verifyUEC(uec, verifiedUECs):
    route = "/api/verifyUEC"
    if len(verifiedUECs) == 0:
        return False
    res = requests.post(url + route, json={"uec": uec, "verified": verifiedUECs}).json()
    
    if res["valid"]:
        return True
    return False
def getUECSettings(uec):
    route = "/api/getUECSettings"
    
    r = requests.post(url + route, json={"uec": uec}).json()
    
    if r["success"]:
        return r
    else:
        return False

def getStatus(uec):
    route = "/api/status"
    r = requests.post(url + route, json={"uec":uec}).json() #check status on route sending uec
    if r["done"]:
        return r #return response once done
    return False

def logEvent(uec, eventID): #require UEC and eventID
    route = "/api/event/add" #route
    r = requests.post(url + route, json={"uec": uec, "eventID": eventID}).json() #make request to route with UEC and eventID
    
    if r["success"]:
        return True #return True if successful

def getCommands(uec):
    route = "/api/getCommands"
    
    r = requests.post(url + route, json={"uec": uec}).json()
    
    if r["done"]:
        return r["commands"]
    
def resolveCommands(uec, cD):
    route = "/api/resolveCommands" #path to send POST request on
    cStr = "(" #opening bracket to start command string
    for c in cD:
        cStr += '"' + str(c) + '",' #iterate through adding eaching connectionCommandID surrounded by "" separated by commas
    cStr = cStr[:-1] + ")" #truncate the last comma and add a closing bracket
    #this string will be used in the SQL statement
    r = requests.post(url + route, json={"uec": uec, "conComIDStr": cStr}).json() #send POST request containing UEC and connectionCommandID String
    
    if r["done"]:
        return True #return True once the request is done and a response is receieved

def uploadLiveImage(uec, imgPath):
    route = "/api/imgUpload/:" + uec #dynamic route to '/api/imgUpload/[uec]'
    with open(imgPath, 'rb') as f: #open image file path and read bytes
        encoded_string = str(base64.b64encode(f.read())) #read the file and encode data into bytes and cast to string
        modStr = encoded_string[2:len(encoded_string)-1] #modify the string to truncate the first 2 characters
    r = requests.post(url + route, json={"imageData": modStr}).json() #make the POST request at the right route sending the image in string form
    if r["done"]:
        return True #return True if request is successfully serviced by the API
    return False #return False where a successful response is not received

def setOnlineStat(uec, stat):
    route = "/api/setOnline"
    
    r = requests.post(url + route, json={"uec": uec, "oStat": stat}).json()
    if r["done"]:
        return True
    return False

