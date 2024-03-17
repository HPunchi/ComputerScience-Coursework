#core modules needed including cv2 (opencv)
import sys
import os
import cv2
import time

#data processing and graphing modules
import numpy as np
import matplotlib.pyplot as plt

#module used to access .ENV file contents remotely and locally
from dotenv import load_dotenv

#pyqt5 modules for GUI
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel, QHBoxLayout
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt, QTimer, QRect
from PyQt5 import QtGui, QtSvg, QtCore

#local code from 'styling.py' and 'globalFuncs.py' in '/scripts' folder 
from scripts.styling import *
from scripts.globalFuncs import *


load_dotenv()#load .ENV variables

#define window ratio by dividing width by height showed in .ENV
windowRatio = int(os.getenv("STANDARD_WIDTH"))/int(os.getenv("STANDARD_HEIGHT"))

class mainGUI(QWidget): #main GUI class
    def __init__(self): #class constructor method (code in this function runs first)
        super().__init__() #initialise parent class
        self.startUI() #start UI method
        self.startWebcam(1) #start webcam method
        
        self.motionDetected = False #boolean value for whether motion is detected or not
        self.stateHold_ms = 1000 #shows how long motionDetected stays True for
        self.motionStart = round(time.time(), 2) #time when motion started to 2dp
        self.programStart = round(time.time(), 2) #time when program started to 2dp
        self.timeElapsed = 0 #time elapsed since program started
        self.motionTrigger = 10 #motion value needed to be exceeded to identify as motion
        
        self.ksize = (15, 15) #kernel size used in Gaussian Blur
        self.sigmaX = 0.3 #sigma variable for standard deviation in Gaussian Blur
        self.thresholdCoefficient = 0.2 #threshold proportion to exceed to contribute to motion
        
        '''
        DEFAULT_COEFFICIENTS => (17, 17), 0.3, 0.2
        '''
        #intiialise new graph and subplot
        self.fig = plt.figure() 
        self.ax = self.fig.add_subplot()
        
        self.ax.set_title("Motion Graph") #set title for motion graph
        self.ax.set_xlabel("Time elapsed (s)") #set label for x-axis
        self.ax.set_ylabel("Motion magnitude (.1000)") #set label for y-axis

        self.x = [] #empty set of x co-ordinates
        self.y = [] #empty set of y co-ordinates
        
        self.fig.show() #show the current motion graph
    def startUI(self):
        self.mainLayout = QVBoxLayout() #makes vertical box layout to contain widgets
     
        self.svglogoWidget = QtSvg.QSvgWidget(os.getenv("SVG_LOGO_PATH")) #get logo svg file
        self.svglogoWidget.setGeometry(0, 0, 400, 137) #set position and size of svg_logo widget
        self.svglogoWidget.setFixedWidth(400) #width
        self.svglogoWidget.setFixedHeight(137) #height
  
        self.pageTitle = QLabel("Motion Detection Algorithm", self) #title the page
        self.pageTitle.setStyleSheet(fetchCSS("pageTitle")) #add CSS code for this widget
 
        self.webcamLabel = QLabel(self) #new label object
        self.webcamLabel.setMinimumSize(640, 480) #min size for rescaling
        self.webcamLabel.setMaximumSize(960, 720) #max size for rescaling
        self.webcamLabel.setStyleSheet(fetchCSS("webcamImage")) #add CSS code for widget
        
        #initially no motion is detected
        self.statusLabel = QPushButton("", self) #new button object showing status of motion
        self.statusLabel.setFixedSize(QtCore.QSize(180, 50+40)) #define size of button
        self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse")) #set CSS code
  
        #add all widgets to main layout in order (top - bottom)
        self.mainLayout.addWidget(self.svglogoWidget)    
        self.mainLayout.addWidget(self.pageTitle)
        self.mainLayout.addWidget(self.webcamLabel)
        self.mainLayout.addWidget(self.statusLabel)
        self.mainLayout.setAlignment(Qt.AlignCenter) #align widgets horizontally to the centre 
        
        
        self.setLayout(self.mainLayout)  #apply main layout to winodw
        self.setWindowTitle(os.getenv("WINDOW_NAME")) #set title of window
        self.setWindowIcon(QtGui.QIcon(os.getenv("WINDOW_ICON_PATH"))) #set icon of window
        self.move(QtCore.QPoint(50, 50)) #move window to top left corner
        self.setStyleSheet(fetchCSS("mainPage")) #apply general CSS to whole file
       
        self.timer = QTimer(self) #create new timer object
        self.timer.timeout.connect(self.motionDetection) #every interval of timer launch motionDetection() method
        self.timer.start(30) #tells timer object to produce interval every 30 milliseconds
     
        self.show() #show the main window
    def startWebcam(self, deviceNo=0):
        self.cap = cv2.VideoCapture(deviceNo) #capture video feed from webcam device
        ret, frame = self.cap.read() #read the current frame from video feed
        self.previousFrame = frame #declare a new encapsulated variable for previous frame
    
    def updateUIImage(self, frame):
        #make new pixel map from frame to show onto GUI
        self.qWebcamImage = QImage(frame.data, frame.shape[1], frame.shape[0], frame.shape[1]*3, QImage.Format_RGB888)
        self.webcamLabel.setPixmap(QPixmap.fromImage(self.qWebcamImage)) #place image onto widget
    
        if self.motionDetected: #change text and backgrond if motion detected (red)
            self.statusLabel.setText("Motion Detected.") 
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelTrue"))
        else: #change text and background if motion is not detected (green)
            self.statusLabel.setText("None")
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse"))    

        self.ax.plot(self.x, self.y, color="b") #plot all points up till current onto graph in blue
        self.fig.canvas.draw() #draw graph onto figure and update

    
    def motionDetection(self):
        ret, frame = self.cap.read() #fetch the current frame from the video feed
        #mirror the frame horizontally (to prevent an inverted view)
        self.frame = cv2.flip(frame, 1) 
        #apply Guassian Blur to reduce image noise and relieve the load of image processing
        self.frame = cv2.GaussianBlur(self.frame, self.ksize, self.sigmaX)
        #find the differences between the current frame and previous frame   
        self.frameDiff = cv2.absdiff(self.previousFrame, self.frame)
        #grayscale these differences (black/white)
        self.grayedFrameDiff = cv2.cvtColor(self.frameDiff, cv2.COLOR_BGR2GRAY) 
        #threshold this grayscaled difference by applying the threshold coefficient to it, creating a binary motion mask
        _, self.motionMask = cv2.threshold(self.grayedFrameDiff, round(self.thresholdCoefficient * 255), 255, cv2.THRESH_BINARY)
        #function to count the number of white pixels in the image (representing motion)
        self.motionCount = np.count_nonzero(self.motionMask)
        #using the resolution, this count can be mapped to a 0-100 scale of the proportion of white pixels in the image
        self.motionValue = np.interp(self.motionCount, [0, self.motionMask.size], [0, 100]) #this is the raw motion value
        #find amount of time elapsed - i.e. the difference between the current time and start time
        self.timeElapsed = round(time.time(), 2) - self.programStart
        
        self.x.append(self.timeElapsed) #add time elapsed to set of x-coordinates
        self.y.append(self.motionValue) #add the corresponding motion value to set of y-coordinates
        
        if self.motionValue >= self.motionTrigger: #check if motion is exceeding the trigger
            self.motionDetected = True #set to true if it is
            self.motionStart = round(time.time(), 2) #set time when motion starts
        if self.motionDetected and ((round(time.time(), 2)-self.motionStart)>=(self.stateHold_ms/1000)):
            self.motionDetected = False #reset to false if motion was previously True and it's gone past the hold time
        self.updateUIImage(cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB)) #convert frame to RGB and update the UI
        self.previousFrame = cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB) #set previous frame for next iteration
       
def main():
    app = QApplication(sys.argv) #creates new application
    window = mainGUI() #instantiates MainGUI object
    sys.exit(app.exec_()) #tells code to stop running when window is closed
    
if __name__ == "__main__":
    main() #runs main() function

