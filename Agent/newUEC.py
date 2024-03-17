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

import requests

defaultURL = "http://localhost:80"

load_dotenv()

class mainGUI(QWidget):
    def __init__(self):
        super().__init__()
        self.loadUI()
    
    def loadUI(self):          
        self.mainLayout = QVBoxLayout()
     
        self.svglogoWidget = QtSvg.QSvgWidget(os.getenv("SVG_LOGO_PATH"))
        self.svglogoWidget.setGeometry(0, 0, 400, 137)
        self.svglogoWidget.setFixedSize(QtCore.QSize(400, 137))
        
        self.mainLayout.addWidget(self.svglogoWidget)
             
        self.uecInputUI()

        self.mainLayout.setAlignment(Qt.AlignCenter)
        
        self.setLayout(self.mainLayout)
        self.setWindowTitle(os.getenv("WINDOW_NAME"))
        self.setWindowIcon(QtGui.QIcon(os.getenv("WINDOW_ICON_PATH")))
        self.move(QtCore.QPoint(50, 50))
        self.setFixedSize(QtCore.QSize(500, 800))
        self.setStyleSheet(fetchCSS("mainPage"))
  
        self.show()
    
    
    def uecInputUI(self):
        self.title = QLabel("Set UEC", self)
        self.title.setStyleSheet(fetchCSS("uecLabel"))

        
        self.uecInput = QLineEdit(self)
        self.uecInput.setFixedSize(QtCore.QSize(250, 35))
        self.uecInput.setStyleSheet(fetchCSS("uecInput"))
        self.uecInput.setPlaceholderText("Enter UEC")
        self.uecInput.returnPressed.connect(self.setUEC)
   
        self.submitButton = QPushButton("Set UEC", self)
        self.submitButton.setFixedSize(QtCore.QSize(140, 80))
        self.submitButton.setStyleSheet(fetchCSS("uecButton"))
        self.submitButton.clicked.connect(self.setUEC)
       
        self.mainLayout.addWidget(self.title)
        self.mainLayout.addWidget(self.uecInput)
        self.mainLayout.addWidget(self.submitButton)
    
   
    def pinGenUI(self, response):
        self.prompt = QLabel("Here is the security PIN:", self)
        self.prompt.setStyleSheet(fetchCSS("uecLabel"))

            
        self.pinDisplay = QLabel(response["pin"], self)
        self.pinDisplay.setStyleSheet(fetchCSS("roomLabel"))
        
        self.mainLayout.addWidget(self.prompt)
        self.mainLayout.addWidget(self.pinDisplay)
    
    def connectedUI(self):
        self.message = QLabel("Connected.", self)
        self.message.setStyleSheet(fetchCSS("roomLabel"))

        self.mainLayout.addWidget(self.message)
    def notfoundUI(self):
        self.message = QLabel("Invalid UEC.", self)
        self.message.setStyleSheet(fetchCSS("roomLabel"))

        self.mainLayout.addWidget(self.message)  
    
    def setUEC(self):
        enteredUEC = self.uecInput.text()
        if len(enteredUEC) != 8:
            messagebox.showerror("Error", "Invalid UEC (Unique Enrollment Code)")
            self.uecInput.setText("")
            return
        
        route = "/api/retrievePIN"
     
        response = requests.post(defaultURL + route, json={"uec":enteredUEC}).json()
        
        self.wipeLayout()
        
        
        if response["status"] == "verifying":
            self.pinGenUI(response)
        elif response["status"] == "connected":
            self.connectedUI()
        elif response["status"] == "not-found":
            self.notfoundUI()
                
        

        self.retryButton = QPushButton("Ok", self)
        self.retryButton.setFixedSize(QtCore.QSize(140, 80))
        self.retryButton.setStyleSheet(fetchCSS("uecButton"))
        self.retryButton.clicked.connect(self.reloadPage)
        
        self.mainLayout.addWidget(self.retryButton)

    
    def wipeLayout(self, exempt=[0]):
        for i in range(self.mainLayout.count()):
            item = self.mainLayout.itemAt(i)
            if i not in exempt:
                item.widget().deleteLater()
    def reloadPage(self):
        self.wipeLayout()
        self.uecInputUI()
def main():
    app = QApplication(sys.argv)
    window = mainGUI()
    sys.exit(app.exec_())
    
if __name__ == "__main__":
    main()
