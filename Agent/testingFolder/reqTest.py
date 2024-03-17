import requests
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel, QHBoxLayout, QLineEdit
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt, QTimer, QRect
from PyQt5 import QtGui, QtSvg, QtCore



url = "http://localhost:80/devices/testings"

data = {
    "data1": "hello",
    "data2": "world"
}

response = requests.post(url, json=data)
print(response.json())

