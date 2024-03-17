import cv2
import numpy as np
from .globalFuncs import *

def processFrame(frame):
    frame = cv2.flip(frame, 1)
    
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    return frame


def motionDetection(frame1, frame2, threshVal=30, triggerArea=100):
    motionDetected = False
    
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    diff = cv2.absdiff(gray1, gray2)
    
    _, threshold = cv2.threshold(diff, threshVal, 255, cv2.THRESH_BINARY)
    
    dummyFrame = frame2.copy()
    
    contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        if cv2.contourArea(contour) > triggerArea:
            motionDetected = True
            cv2.drawContours(dummyFrame, [contour], 0, (0, 255, 0), 2)
            
            
    cv2.imshow("c", dummyFrame)
    cv2.waitKey(0)
    return motionDetected