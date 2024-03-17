import sys
import os
import cv2
from io import BytesIO
import math
from dotenv import load_dotenv
import time
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel, QHBoxLayout, QLineEdit, QInputDialog
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt, QTimer, QRect
from PyQt5 import QtGui, QtSvg, QtCore

from tkinter import messagebox, simpledialog

from scripts.styling import *
from scripts.globalFuncs import *
from scripts.imageProc import *
from scripts.serverFuncs import *
from scripts.consoleFeatures import *

import psutil

import pygame
from datetime import datetime
''' for windows 
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume


devices = AudioUtilities.GetSpeakers()
interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
volume = cast(interface, POINTER(IAudioEndpointVolume))
'''

pygame.init()

class mainGUI(QWidget):
    def __init__(self):
        super().__init__()

        self.mainFreq = 30
        self.pulse = 0
        self.connectedUEC = ""
        self.serverPingRate = 100
        self.eventLog = []
        self.motionDetectionEventGap = 60000
        self.batteryLevelEventGap = 1800000
        self.minBatteryLevel = 20
        self.streamWidth = 640
        self.batteryLow = False
        self.soundFile = "./media/sounds/repeat-beeps.mp3"
        
        self.liveImagePath = "./media/liveImg/img.jpg"
        self.logFolder = "./data/logs/"
        self.dLockFile = "./data/dLock.txt"
        
        self.commandLog = []
        self.commandsCompleted = []
        self.minGapBetweenIdenticalCommands = 60000
        
        self.serverPingFreq = 3
        self.lastPing = 0
        
        spinner.start("Fetching and verifying UEC.") #start spinner with text
        
        self.getCurrentUEC() #get the UEC from memory that the Agent is currently connected to
        
        if self.connectedUEC == "": #if there is no connected UEC...
            spinner.end() #terminate spinner
            colorPrint("A UEC was not found.", "RED") #display error message
            self.loadUI("uecSet") #change UI to uecSet where user can enter a UEC to connect to
            return #terminate init function
     
        if not self.loadStartSettings(): #if the UEC connected to cannot be accessed (due to deletion or error)...
            spinner.end() #terminate spinner
            colorPrint("This UEC was not valid, a new one is required.", "RED") #display error message
            self.loadUI("uecSet") #change UI to uecSet where user can enter a UEC to connect to
            return #terminate init function
        
        self.loadMotionDetectionVariables() #acquire the currently connected UEC and fetch motion detection variables
        
        spinner.end() #terminate spinner
        colorPrint("UEC fetched and verified.", "GREEN") #display success message

        if not self.visibility: #if visibility is not enabled...
            print("---GUI DISABLED---") 
            print("Operating on command line...") #boot program on the command line
        else: 
            self.loadUI() #otherwise load main UI and start the webcam's video feed
            self.loadWebcam()
        self.programStart = time.time()
        
    def timeSinceRecentCommandType(self, commandID): #method to find the time elapsed since the last command of same time was serviced by the Agent
        for i in range(len(self.commandLog)-1, -1, -1): #iterate through the command log in reverse to pick up the most recent commands
            if self.commandLog[i][1] == commandID: #run code below if a command of the matching type has been found
                return time.time() - self.commandLog[i][2] #return the difference in current time and time of last command (i.e. time elapsed betweent the two)
        return time.time() #if no return is made by now (command of that type has not been called at all up to now), return total time stamp (till 1970 - to bypass command time gaps)
    
    def loadCommands(self, commands):
        newConnectionCommandIDs, newCommandIDs = [c["connectionCommandID"] for c in commands], [d["commandID"] for d in commands] #split object into 2 arrays for connectionCommandIDs and commandIDs
       
        ccIDsLoaded = [c[0] for c in self.commandLog] #array of connectionCommandIDs that have already been loaded into the command log
        c = 0 #intitially set the count to 0
        for newCID in newConnectionCommandIDs: #iterate through each connectionCommandID
            if (newCID not in ccIDsLoaded) and (newCID != None): #run code below if command is not already in commandLog and the command for it exists
                if self.timeSinceRecentCommandType(newCommandIDs[c]) > self.minGapBetweenIdenticalCommands: #run code below if sufficient time has passed since the 
                    self.commandLog.append([newCID, newCommandIDs[c], time.time()]) #add subarray containing connectionCommandID, commandID, and current timestamp to command log
            c += 1 #inrement counter for next commandID in array
            
    def executeCommands(self): 
        commandsCompleted = [] #array to store completed commands
        for command in self.commandLog: #iterate through each command in the commandLog
            conComID = command[0] #connectionCommandID
            commandID = command[1] #commandID
            commandError = False #flag to track error in command execute
            if commandID == "0": #run code below if commandID equals 0 (live image)
                self.liveImage() #method to capture live image from webcam feed and place into local image file
                c = uploadLiveImage(self.connectedUEC, self.liveImagePath) #function to upload the live image passing in UEC and local image file path
                if not c: #run code below if function above returns false (error)
                    commandError = True #set error flag to true
                    colorPrint("Error in capturing image", "RED") #display error in red text
            elif commandID == "1": #code to run if commandID is 1
                self.playSound() #play sound method is called
            if not commandError: 
                commandsCompleted.append(conComID) #add connectionCommandID to commandsCompleted list if there was no error
        self.commandLog = [] #empty the commandLog once all of the commands in it have been seen to
        return commandsCompleted #return the commands completed list
    
    def liveImage(self):
        img = self.previousFrame #access previous processed frame by accessing its variable (previousFrame is only 1 frame behind and is processed unlike current one)
       
        cv2.imwrite(self.liveImagePath, img) #write the contents of the previousFrame into image path (self.liveImagePath)
          
    def playSound(self):
        #volume.SetMasterVolumeLevel(0, None) #set the volume to maximum if needed
        pygame.mixer.Sound(self.soundFile).play() #play soundFile 'repeatBeeps.mp3' which is stored locally as variable in constuructor method
          
    def loadMotionDetectionVariables(self):
        self.motionDetected = False
        self.stateHold_ms = 1000
        self.motionStart = time.time()
        self.timeElapsed = 0
        self.motionTrigger = 1
        
        self.ksize = (15, 15)
        self.sigmaX = 0.3
        self.thresholdCoefficient = 0.2  
        
    def loadWebcam(self, port=0):
        spinner.start("Connecting to hardware.") #starts the spinner on the command line
        self.cap = cv2.VideoCapture(port) #access the video capture (feed) from the device
        ret, frame = self.cap.read() #take out the current frame
        frame = self.preprocessing(frame) #run the pre-processing on this frame to resize and invert as needed
        self.previousFrame = frame #store this frame as the previous frame
        spinner.end() #terminate the spinner
        colorPrint("Hardware connected.", "GREEN") #update the boot up log on the command line
    
    def updateUI(self, frame):
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) #convert image to RGB format that is PyQt5 rendering friendly
        if self.systemStatus == "Armed": 
            self.statusLabel.setText("Armed") #set the text to armed whenever the system is armed
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelTrue")) #apply the correct styling when armed
        else:
            self.statusLabel.setText("Idle") #set the text to idle whenever the system is not armed (i.e. idle)
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse")) #apply the correct styling when idle

        if self.motionDetected: #run the code below whenever motion is detected
            frame = cv2.putText(frame, "MOTION", (10, 40), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1.3, (0, 0, 255), 2)
            #display text on frame in corner showing motion if this is the case
        if self.batteryLow:
            frame = cv2.putText(frame, "BATTERY LOW", (10, 70), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1.3, (255, 0, 0), 2)
            #display text on frame in corner showing battery low if this is the case (positioned so that both texts can be shown at once)
        
        self.qWebcamImage = QImage(frame.data, frame.shape[1], frame.shape[0], frame.shape[1]*3, QImage.Format_RGB888)
        #set the webcam image object to show the current frame in RBG format
        self.webcamLabel.setPixmap(QPixmap.fromImage(self.qWebcamImage))
        #read the webcam image object from the pixmap structure and load it onto the label on the GUI
      
    def loadStartSettings(self):
        connectionSettings = getUECSettings(self.connectedUEC) #fetches info from server
       
        if not connectionSettings: 
            self.connectedUEC = ""
            return False #any error in returning UEC settings erases this UEC and returns False
            
        #encapsulated variables that are fully accessible throughout the class hence do not need to be returned
        self.deviceID = connectionSettings["deviceID"] #deviceID
        self.location = connectionSettings["location"] #location of device
        self.visibility = connectionSettings["visibility"] #visibility setting of device
        self.deviceLocked = connectionSettings["deviceLocked"] #device lock state of device
        self.systemStatus = connectionSettings["systemStatus"] #system status (armed/disarmed of device)
        self.commandPending = connectionSettings["commandPending"] #boolean value stating if there are pending commands to service
        self.unreadEvents = connectionSettings["unreadEvents"] #boolean value stating if there are any unread events
        
        if self.deviceLocked:   
            with open(self.dLockFile, "w") as dFile:
                dFile.write("1") #update file to '1' indicated that device is locked and this UEC cannot be changed 
        
        return True
        
    def loadUI(self, page="main"): #function to load a specifc UI - load main screen by default
        
        self.mainLayout = QVBoxLayout() #create the main vertical layout to be used on the screen
     
        self.addLogoToUI() #function to add logo to main layout
  
        if page == "main": 
            self.mainUI() #load the main UI
        if page == "uecSet":
            self.uecSetUI() #load the UI to set a UEC
        
     
        self.mainLayout.setAlignment(Qt.AlignCenter) #align the main layout to the centre of the page
        self.setLayout(self.mainLayout) #apply main layout to window object
        self.setWindowTitle(os.getenv("WINDOW_NAME")) #set name of window
        self.setWindowIcon(QtGui.QIcon(os.getenv("WINDOW_ICON_PATH"))) #set window icon (HomeShield logo)
        self.move(QtCore.QPoint(50, 50)) #set initial window position
        self.setStyleSheet(fetchCSS("mainPage")) #apply styling to main page
  
        self.show() #show the window
        
    def mainUI(self):    
        title = "No UEC connected" #intitial title screen
     
        if self.location:
            title = self.location #set the title to the location if defined
        self.detailsLayout = QVBoxLayout() #new layout to store connection details
    
        self.roomLabel = QLabel(title, self) #create label to show room
        self.roomLabel.setStyleSheet(fetchCSS("roomLabel")) #css styling
        self.detailsLayout.addWidget(self.roomLabel) #add to layout
        
        self.uecLabel = QLabel(self.connectedUEC, self) #create label to show connection status
        self.uecLabel.setStyleSheet(fetchCSS("uecLabel")) #css styling
        self.detailsLayout.addWidget(self.uecLabel) #add to layout

        self.mainLayout.addLayout(self.detailsLayout) #nest the details layout within the main layout
    
       
        self.webcamLabel = QLabel(self) #create label to show webcam feed to be altered by other methods in program
        self.webcamLabel.setMinimumSize(640, 480) #minimum size while resizing
        self.webcamLabel.setMaximumSize(960, 720) #maximum size while resizing
        self.webcamLabel.setStyleSheet(fetchCSS("webcamImage")) #css styling
        self.mainLayout.addWidget(self.webcamLabel) #add to layout


        self.buttonsLayout = QHBoxLayout() #new horizontal layout for buttons
    
        if self.connectedUEC == "": #run code below if not connected to a UEC
            self.uecButton = QPushButton("Set UEC", self) #button to prompt to set UEC
            self.uecButton.setFixedSize(QtCore.QSize(180, 50+40)) #fixed size settings
            self.uecButton.setStyleSheet(fetchCSS("uecButton")) #css styling
            self.uecButton.pressed.connect(self.uecSetUI) #launch method to load uecSetUI if pressed
        else: #otherwise run code below (if already connected)
            self.uecButton = QPushButton("Disconnect from UEC", self) #button to prompt to disconnect from UEC
            self.uecButton.setFixedSize(QtCore.QSize(180, 50+40)) #fixed size settings
            self.uecButton.setStyleSheet(fetchCSS("uecButton")) #css styling
            self.uecButton.pressed.connect(self.removeUEC) #launch method to remove connected UEC if pressed
            
        self.buttonsLayout.addWidget(self.uecButton) #add to layout
         
        self.statusLabel = QPushButton("Idle", self) #button showing system state (armed/idle but idle by default)
        self.statusLabel.setFixedSize(QtCore.QSize(180, 50+40)) #fixed size settings
        self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse")) #css styling
        self.buttonsLayout.addWidget(self.statusLabel) #add to layout

        self.buttonsLayout.setAlignment(Qt.AlignLeft) #align all buttons in buttons layout on the left hand side
        
        
        self.mainLayout.addLayout(self.buttonsLayout) #nest the buttons layout into the main layout
        
        self.timer = QTimer(self) #create new instance of Timer and bind to class
        self.timer.timeout.connect(self.mainloop) #on each timeout signal launch the mainloop (polling loop for Agent)
        self.timer.start(self.mainFreq) #start the timer and ping a timeout on the main frequency (once every 30ms)
    
    def addEvent(self, eventID):
        self.eventLog.append([
            self.connectedUEC, eventID, str(round(time.time() * 1000)) #add array containing UEC, eventID, and time of event to local event log
        ])
        
        date = datetime.now().strftime("%d.%m.%Y") #get current date (dd/mm/yyyy)
        eTime = datetime.now().strftime("%H:%M") #get current time (hh:mm)
        
        eText = "Event." #default text to show in file if eventID cannot be recognised
        if eventID == "0":
            eText = "Alert: Motion was detected." #text to display in file if event was motion detected
        elif eventID == "1":
            eText = "Warning: Battery low." #text to display in file if event was battery low
        
        fileName = date + ".txt" #each new date will have its own text file keeping log of events
        
        eventStr = f"[{eTime}] - {eText}\n" #string format for line in file

        with open(self.logFolder + fileName, "a") as file: #add file to logs folder or open existing one if on the same date
            file.write(eventStr) #add a new line with the new event and the time it happened
        
        logEvent(self.connectedUEC, eventID) #log this event on the server's side to update the database
    
    def checkLastEvent(self, eventID): #the eventID is required to be passed in
        for i in range(len(self.eventLog)-1, -1, -1): #iterate through the event log in reverse so the most recent events can be found first
            if self.eventLog[i][1] == eventID: #if the eventID for the log being viewed matches run the line below 
                return int(self.eventLog[i][2]) #return the timestamp for this event in integer form (terminates the function)
        return 0 #returning 0 bypasses all event gaps and only occurs when the event log does not have any events of the requested type/ID
    
    def mainloop(self):
        self.timeElapsed = time.time() - self.programStart #calculation of time elapsed since program start
       
        ret, frame = self.cap.read() #read the current frame from video feed
        
        self.frame = self.preprocessing(frame) #prepare the raw frame for processing and store variable
        
        if self.connectedUEC != "" and (time.time() - self.lastPing > self.serverPingFreq):
            statusResponse = getStatus(self.connectedUEC) #part of polling loop to check status from server about connection
            if statusResponse['connectionDeleted']:
                self.close()
                terminationCode()
                sys.exit()
            self.systemStatus = statusResponse["systemStatus"] #system status [armed/idle]
            self.commandPending = statusResponse["commandPending"] #whether or not commands are pending (checked from database)
            if self.commandPending: #run the code below if there are commands to service
                self.loadCommands(statusResponse["commands"]) #run the loadCommands() method to load these commands into the command log
                    
            self.lastPing = time.time() #store the last time the server was pinged
        
        if self.systemStatus == "Armed": #run code below if the system is armed
            self.motionDetection() #run motion detection event checking (this function will send events if necessary)
            batteryData = psutil.sensors_battery() #returns an object containing data about the current state of the device's battery
            if (not batteryData.power_plugged) and (batteryData.percent < self.minBatteryLevel) and ((time.time()*1000)-self.checkLastEvent("1") > self.batteryLevelEventGap):
                #run code below if battery is below the minimum level (20%) and is not on charge and the last event for low battery was sent longer than the event gap (30 mins)
                self.batteryLow = True #set the battery low variable to true
                self.addEvent("1") #add eventID 1 (battery low)
            if ((batteryData.power_plugged) or (batteryData.percent > self.minBatteryLevel)):
                self.batteryLow = False #set battery low variable to false if the charger is plugged in or if the battery level is above the minimum level (more than 20%)
        
        if len(self.commandLog) > 0: #this part of the polling loop runs any commands if there are any
            commandsDone = self.executeCommands() #service the command log (local processing to execute undone commands)
            resolveCommands(self.connectedUEC, commandsDone) #resolve the commands that have been done (server communication involved)

        if self.pulse == 0: #run code below on first iteration cycle of the 
            setOnlineStat(self.connectedUEC, True) #as the polling loop is in action set it to online via the server 
            colorPrint("HomeShield Agent Bootup complete.", "GREEN") #update the command line boot up to conclude a successful start up
                 
        self.updateUI(self.frame) #update the UI after processing cycle
        
        self.previousFrame = self.frame #set current frame to previous frame for next cycle
        self.pulse += 1 #increment pulse (counter) ready for next cycle

    def motionDetection(self):
        self.bframe = cv2.GaussianBlur(self.frame, self.ksize, self.sigmaX)
         
        self.frameDiff = cv2.absdiff(self.previousFrame, self.bframe)
        
        self.grayedFrameDiff = cv2.cvtColor(self.frameDiff, cv2.COLOR_BGR2GRAY)
        
        _, self.motionMask = cv2.threshold(self.grayedFrameDiff, round(self.thresholdCoefficient * 255), 255, cv2.THRESH_BINARY)

        self.motionValue = np.count_nonzero(self.motionMask)
        
        self.finalValue = np.interp(self.motionValue, [0, self.motionMask.size], [0, 100])

        
        if self.finalValue >= self.motionTrigger: #run the code below if the final motion value surpasses the trigger value (1)
            self.motionDetected = True #set variable to True
            self.motionStart = time.time() #get the current timestamp to mark when motion started
            if (time.time() * 1000) - self.checkLastEvent("0") > self.motionDetectionEventGap:
                self.addEvent("0") #add eventID 0 (motion detected) if the last event sent out for motion detected was more than the event gap (1 min)
    
        if self.motionDetected and (time.time() - self.motionStart > self.stateHold_ms/1000):
            self.motionDetected = False 
            #set variable to false if variable was previously true and has been actively held at True for more than the statehold (1 second)
            #for example if motion is detected, the variable will remain set to true for a whole second after it was first recorded
        
    def preprocessing(self, frame): #perform the following actions to the frame before it is processed
        frame = image_resize(frame, width=640) #resize the frame so it's width is 640px (so it fits neatly into the GUI)
        frame = cv2.flip(frame, 1) #flip the frame horizontally so the webcam acts like a mirror giving a smoother experience to the user
        return frame #the frame object itself can be returned as the variable itself is changed and updated through the function
        
    def addLogoToUI(self):
        self.svglogoWidget = QtSvg.QSvgWidget(os.getenv("SVG_LOGO_PATH")) #create a widget with image path of logo
        self.svglogoWidget.setGeometry(0, 0, 400, 137) #set geometry (position and sizing) of image
        self.svglogoWidget.setFixedSize(QtCore.QSize(400, 137)) #set this size fixed (prevent changing during window resizing)
        
        self.mainLayout.addWidget(self.svglogoWidget) #add this logo widget to the main layout
        
    def uecSetUI(self):
        
        self.wipeLayout(self.mainLayout) #clear the contents of previous page
        
        self.title = QLabel("Set UEC", self) #page title
        self.title.setStyleSheet(fetchCSS("uecLabel")) #linking CSS

        '''
        self.uecInput = QLineEdit(self)
        self.uecInput.setFixedSize(QtCore.QSize(250, 35))
        self.uecInput.setStyleSheet(fetchCSS("uecInput"))
        self.uecInput.setPlaceholderText("Enter UEC")
        self.uecInput.returnPressed.connect(self.setUEC)
        '''

        self.uecInput = QLineEdit(self) #input widget
        self.uecInput.setFixedSize(QtCore.QSize(250, 35)) #sizing of input widget
        self.uecInput.setStyleSheet(fetchCSS("uecInput")) #linking CSS
     

        self.submitButton = QPushButton("Set UEC", self) #submit button widget
        self.submitButton.setFixedSize(QtCore.QSize(140, 80)) #sizing
        self.submitButton.setStyleSheet(fetchCSS("uecButton")) #linking CSS
        self.submitButton.clicked.connect(self.setUEC) #connecting button to setUEC() method
        #adding widgets to main layout in order
        self.mainLayout.addWidget(self.title) 
        self.mainLayout.addWidget(self.uecInput)
        self.mainLayout.addWidget(self.submitButton) 
      
    def largeMsgUI(self, message):
        message = QLabel(message, self) #set label to message passed in as parameter
        message.setStyleSheet(fetchCSS("roomLabel")) #css styling

        self.mainLayout.addWidget(message) #add to layout
    
        okBtn = QPushButton("Ok", self) #ok button
        okBtn.setFixedSize(QtCore.QSize(140, 80)) #sizing
        okBtn.setStyleSheet(fetchCSS("uecButton")) #css styling
        okBtn.clicked.connect(self.restart) #restart the class if clicked to start from the constructor again
        
        self.mainLayout.addWidget(okBtn) #add to layout
    
    def pinDisplayUI(self, pin):
        prompt = QLabel("Here is the security PIN:", self) #prompt to enter security PIN on Hub
        prompt.setStyleSheet(fetchCSS("uecLabel"))
            
        pinDisplay = QLabel(pin, self) #label showing the 4-digit security PIN
        pinDisplay.setStyleSheet(fetchCSS("roomLabel"))
         
        #add the widgets to the main layout
        self.mainLayout.addWidget(prompt)
        self.mainLayout.addWidget(pinDisplay)
        
        
        btnLayout = QHBoxLayout() #new horizontal box layout
        
        backBtn = QPushButton("Back", self) #back button
        backBtn.setFixedSize(QtCore.QSize(140, 80))
        backBtn.setStyleSheet(fetchCSS("uecButton"))
        backBtn.clicked.connect(lambda: self.uecSetUI()) #back to page to set UEC
        
        procBtn = QPushButton("Proceed", self) #proceed button
        procBtn.setFixedSize(QtCore.QSize(140, 80))
        procBtn.setStyleSheet(fetchCSS("uecButton"))
        procBtn.clicked.connect(self.proceedToConnect) #proceed to connect function is run when pressed
        
        #add both widgets to button layout
        btnLayout.addWidget(backBtn)
        btnLayout.addWidget(procBtn)
        
        self.mainLayout.addLayout(btnLayout) #nest button layout within main layoutß
     
    def proceedToConnect(self):
        colorPrint("PIN proceed requested.", "PURPLE") #update command line boot up log
        if checkConnected(self.trialUEC): #check if the UEC is connected by testing the connection
            colorPrint("Connection tested successfully", "GREEN") #show success message
            self.connectedUEC = self.trialUEC #set this to be the main UEC for the class
            
            colorPrint("Encrypting UEC...", "PURPLE") #command line boot up log update
            encrUEC = uecEncr(self.connectedUEC) #encrypt the connected UEC using the server's private key
            
            with open("./data/verifiedUECs.txt", "a") as file:
                file.write(encrUEC + "\n") #write the encrypted UEC and mark a new line for the next write
                
            with open("./data/currentUEC.txt", "w") as file:
                file.write(self.connectedUEC) #update the currentUEC file with the new connected UEC
            self.restart() #reboot the Agent to run with the newly updated files
        else: #otherwise show an error if the UEC remains unverfied
            messagebox.showinfo("Device Enrollment", "This PIN has not yet been used to verify this UEC. Please try again or use another UEC.")
            return
    
    def removeUEC(self):
        with open(self.dLockFile, "r") as dFile:
            state = dFile.readlines()[0]
        if state != "free":
            messagebox.showerror("Error", "This UEC has device locking enabled. You cannot change this UEC.") 
            return False
        setOnlineStat(self.connectedUEC, False)
        self.connectedUEC = ""
        open("./data/currentUEC.txt", "w").close()
        
        self.restart()
            
    def getCurrentUEC(self):
        with open("./data/currentUEC.txt", "r") as file:
            data = file.readlines() #read contents of data inside of currentUEC.txt file (should only be 1 line)

        if data == []:
            self.connectedUEC = "" 
            return #return an empty string if there is no connected UEC
 
        with open("./data/verifiedUECs.txt", "r") as file:
            vUECs = file.readlines() #capture list of verified UECs in encrypted format
        if verifyUEC(data[0], vUECs): #contact server to verify if UEC is within of list of encrypted UECs
            self.connectedUEC = data[0] #set connectedUEC variable to UEC inside of file if included within encrypted UECs
        else:
            messagebox.showerror("UEC", "UEC was is unverified and/or was corrupted.") #otherwise displayy and appropiate error
            self.connectedUEC = "" 
            return #return an empty string
                
    def wipeLayout(self, layout): #call function to wipe a layout (can be the main layout)
        while layout.count(): #boolean value whether a layout contains anything in it or not
            item = layout.takeAt(0) #take the first item from the layout
            widget = item.widget() #convert the item into a widget option if it is a widget
            if widget is not None: #if the extracted item is a widget run the code below
                widget.setParent(None) #remove the parent, deleting it from the UI
            else: #otherwise run the code below (for items that are layouts) 
                self.wipeLayout(item.layout()) #recursively call this function to wipe nested layouts
        #the intital layout passed will now be blank by the time the loop is exitted from
        self.addLogoToUI() #as used on all screens, add logo to UI for main window
    
    def setUEC(self):
        enteredUEC = self.uecInput.text() #get the text from the input field
        self.trialUEC = enteredUEC #set to local variable
        
        if len(enteredUEC) != 8:
            print('error') #display error if the UEC entered is not 8 characters long
            #messagebox.showinfo("Error", "Invalid UEC (Unique Enrollment Code)")
            self.uecInput.setText("") #clear the input field
            return #terminate the function
         
        res = checkUEC(enteredUEC) #check UEC with the server
        
        self.wipeLayout(self.mainLayout) #clear contents of the layout (as no matter what a new UI will be loaded)
        
        print(res['status']) #display the status returned by the server

        if res["status"] == "verifying": #verifying status
            securityPIN = res["pin"] #set security PIN variable to PIN returned from server
            self.pinDisplayUI(securityPIN) #render user interface to display PIN and prompts
        elif res["status"] == "connected": #if already connected
            with open("./data/verifiedUECs.txt", "r") as file:
                data = file.readlines() #gather encrypted verified UECs
            if verifyUEC(enteredUEC, data): #check if this UEC has already been verified by this agent
                self.largeMsgUI("Connected to UEC.") #success message
                self.connectedUEC = enteredUEC #reset variable to UEC
                with open("./data/currentUEC.txt", "w") as f:
                    f.write(enteredUEC) #update currentUEC.txt file in memory
            else:
                self.largeMsgUI("This UEC is not verified with this device.") #error message
        elif res["status"] == "not-found":
            self.largeMsgUI("Invalid UEC.") #error message if UEC is not found anywhere on the system
                          
    def restart(self):

        self.close()  
        self.__init__()
       

def image_resize(image, width = None, height = None, inter = cv2.INTER_AREA): #parameters to dimensions the image needs to resize to fit
    dim = None #image dimensions
    (h, w) = image.shape[:2] #height and width respectively stored in tuple
    if width is None and height is None: #if no new height or widths are required
        return image #return the original image back
    if width is None: #if no width preference is given (resize by height and leave variable width)
        r = height/float(h) #scale factor for height
        dim = (int(w * r), height) #new dimensions with fixed height and width set to maintain aspect ratio
    else: #if no height preference is given (resize by width and leave variable height)
        r = width/float(w) #scale factor for width
        dim = (width, int(h * r)) #new dimensions with fixed width and height set to maintain aspect ratio
    resized = cv2.resize(image, dim, interpolation = inter) #apply the new dimensions and inter_area to image
    return resized #return the resized image 
 
def terminationCode(uec): #run this function as the last thing the program does before ending
    colorPrint(f"Code terminating... UEC => {uec}", "YELLOW") #display the uec and authorise the termination of code
    setOnlineStat(uec, False) #update the server to set the device to offline
    colorPrint("Code exit.", "WHITE") #final message confirming the Agent's termination
        
def main(args):
    app = QApplication(args)
    
    
    
    app.aboutToQuit.connect(lambda: terminationCode(window.connectedUEC))
    
    window = mainGUI()
    window.show()
    sys.exit(app.exec_())



if __name__ == '__main__':
    spinner = Spinner()
    main(sys.argv)
    
    
