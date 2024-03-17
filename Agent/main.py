import sys
import os
import cv2
import math
from dotenv import load_dotenv
import time
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel, QHBoxLayout, QLineEdit
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt, QTimer, QRect
from PyQt5 import QtGui, QtSvg, QtCore

from tkinter import messagebox, simpledialog

from scripts.styling import *
from scripts.globalFuncs import *
from scripts.imageProc import *
from scripts.serverFuncs import *

load_dotenv()

windowRatio = int(os.getenv("STANDARD_WIDTH"))/int(os.getenv("STANDARD_HEIGHT"))
uec = ""

class mainGUI(QWidget):
    def __init__(self):
        super().__init__()
        self.startUI(False)
        
        self.startWebcam()
        
        self.motionDetected = False
        self.stateHold_ms = 1000
        self.motionStart = round(time.time(), 2)
        self.programStart = round(time.time(), 2)
        self.timeElapsed = 0
        self.motionTrigger = 1
        
        self.ksize = (15, 15)
        self.sigmaX = 0.3
        self.thresholdCoefficient = 0.2
        
        '''
        DEFAULT_COEFFICIENTS => (17, 17), 0.3, 0.2
        '''
        self.fig = plt.figure()
        self.ax = self.fig.add_subplot()
        self.ax.set_title("Motion Graph")
        self.ax.set_xlabel("Time elapsed (s)")
        self.ax.set_ylabel("Motion magnitude (.1000)")

        self.x = []
        self.y = []
        
        #self.fig.show()
    def setUEC(self):
        enteredUEC = self.uecInput.text()
        if len(enteredUEC) != 8:
            messagebox.showerror("Error", "Invalid UEC (Unique Enrollment Code)")
            self.uecInput.setText("")
            return
        
    def startUI(self, camStart=True):
        self.mainLayout = QVBoxLayout()
     
        self.svglogoWidget = QtSvg.QSvgWidget(os.getenv("SVG_LOGO_PATH"))
        self.svglogoWidget.setGeometry(0, 0, 400, 137)
        self.svglogoWidget.setFixedWidth(400)
        self.svglogoWidget.setFixedHeight(137)
        
        
        self.detailsLayout = QVBoxLayout()
        
        self.roomLabel = QLabel("Current Location", self)
        self.roomLabel.setStyleSheet(fetchCSS("roomLabel"))
        
        
        self.detailsLayout.addWidget(self.roomLabel)
        '''
        if uec == "":
            self.uecInput = QLineEdit(self)
            self.uecInput.setFixedSize(QtCore.QSize(250, 35))
            self.uecInput.setStyleSheet(fetchCSS("uecInput"))
            self.uecInput.setPlaceholderText("Enter UEC")
            self.uecInput.returnPressed.connect(self.setUEC)
            self.detailsLayout.addWidget(self.uecInput)
            
        else:
            self.uecLabel = QLabel("UEC_Code", self)
            self.uecLabel.setStyleSheet(fetchCSS("uecLabel"))
            self.detailsLayout.addWidget(self.uecLabel)
        '''
            

        self.uecLabel = QLabel("UEC_Code", self)
        self.uecLabel.setStyleSheet(fetchCSS("uecLabel"))
        self.detailsLayout.addWidget(self.uecLabel)

       
        self.webcamLabel = QLabel(self)
        self.webcamLabel.setMinimumSize(640, 480)
        self.webcamLabel.setMaximumSize(960, 720)      
        self.webcamLabel.setStyleSheet(fetchCSS("webcamImage"))

        self.buttonsLayout = QHBoxLayout()
  
        
        self.uecButton = QPushButton("Set UEC", self)
        self.uecButton.setFixedSize(QtCore.QSize(180, 50+40))
        self.uecButton.setStyleSheet(fetchCSS("uecButton"))
        self.uecButton.clicked.connect(self.setUEC)
    
        self.statusLabel = QPushButton("", self)
        self.statusLabel.setFixedSize(QtCore.QSize(180, 50+40))
        self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse"))
  
        self.buttonsLayout.addWidget(self.uecButton)
        self.buttonsLayout.addWidget(self.statusLabel)
        
        
        self.mainLayout.addWidget(self.svglogoWidget)    
        self.mainLayout.addLayout(self.detailsLayout)
        self.mainLayout.addWidget(self.webcamLabel)
        self.mainLayout.addLayout(self.buttonsLayout)
      
        self.mainLayout.setAlignment(Qt.AlignCenter)
        self.buttonsLayout.setAlignment(Qt.AlignLeft)
        
        self.setLayout(self.mainLayout)
        self.setWindowTitle(os.getenv("WINDOW_NAME"))
        self.setWindowIcon(QtGui.QIcon(os.getenv("WINDOW_ICON_PATH")))
        self.move(QtCore.QPoint(50, 50))
        self.setStyleSheet(fetchCSS("mainPage"))
        
        if camStart:
            self.timer = QTimer(self)
            self.timer.timeout.connect(self.motionDetection)
            self.timer.start(15)
     
        self.show()
        

    def startWebcam(self, deviceNo=0):
        self.cap = cv2.VideoCapture(deviceNo) 
        ret, frame = self.cap.read()
        self.previousFrame = frame 
         
    def updateWebcamFeed(self):
        ret, frame = self.cap.read()
        
        if ret:
            motionDetected = motionDetection(self.previousFrame, frame, 60, 300)
            
            frame = processFrame(frame)
            
            cv2.putText(frame, str(motionDetected), (10, 50), cv2.FONT_HERSHEY_COMPLEX, 1, (0, 0, 255), 2)
            
            self.qWebcamImage = QImage(frame.data, frame.shape[1], frame.shape[0], frame.shape[1]*3, QImage.Format_RGB888)
            self.webcamLabel.setPixmap(QPixmap.fromImage(self.qWebcamImage))

            
            self.previousFrame = frame
    
    
    def updateUIImage(self, frame):
        self.qWebcamImage = QImage(frame.data, frame.shape[1], frame.shape[0], frame.shape[1]*3, QImage.Format_RGB888)
        self.webcamLabel.setPixmap(QPixmap.fromImage(self.qWebcamImage)) 
    
        if self.motionDetected:
            self.statusLabel.setText("Motion Detected.")
        
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelTrue"))
        else:
            self.statusLabel.setText("None")
            self.statusLabel.setStyleSheet(fetchCSS("statusLabelFalse"))    

        self.ax.plot(self.x, self.y, color="b")
        self.fig.canvas.draw()
        
        blob = cv2.dnn.blobFromImage(self.previousFrame, scalefactor=1.0, size=(640, 480), mean=(104.0, 177.0, 123.0))


    def motionDetection(self):
        ret, frame = self.cap.read()
        self.frame = cv2.flip(frame, 1)
        
        self.frame = cv2.GaussianBlur(self.frame, self.ksize, self.sigmaX)
         
        self.frameDiff = cv2.absdiff(self.previousFrame, self.frame)
        
        self.grayedFrameDiff = cv2.cvtColor(self.frameDiff, cv2.COLOR_BGR2GRAY)
        
        _, self.motionMask = cv2.threshold(self.grayedFrameDiff, round(self.thresholdCoefficient * 255), 255, cv2.THRESH_BINARY)

        self.motionValue = np.count_nonzero(self.motionMask)

        self.finalValue = np.interp(self.motionValue, [0, self.motionMask.size], [0, 100])
       
        self.timeElapsed = round(time.time(), 2) - self.programStart        
        
        print(self.timeElapsed)
        self.x.append(self.timeElapsed)
        self.y.append(self.finalValue)
        
        
        if self.finalValue >= self.motionTrigger:
            self.motionDetected = True
            self.motionStart = round(time.time(), 2)
        if self.motionDetected and ((round(time.time(), 2)-self.motionStart)>=(self.stateHold_ms/1000)):
            self.motionDetected = False
            
        self.uecLabel.setText(str(self.motionDetected))    
        self.updateUIImage(cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB))
    
        self.frame = cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB)
        self.previousFrame = self.frame
      
def main():
    app = QApplication(sys.argv)
    window = mainGUI()
    sys.exit(app.exec_())
    
if __name__ == "__main__":
    main()
