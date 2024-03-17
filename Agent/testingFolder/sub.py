import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import time



cap = cv2.VideoCapture(0)

ret, prevFrame = cap.read()

ksize = (17, 17)
sigmaX = 0.3
thresholdCoefficient = 0.2

fig = plt.figure()
ax = fig.add_subplot()

ax.set_xlabel("Time elapsed (s)")
ax.set_ylabel("Motion magnitude (.1000)")

fig.show()

x = []
y = []

frameNo = 0

startTime = round(time.time(), 2)

motionDetected = False
motionTrigger = 100
stateRelease = 3
motionStart = round(time.time())

while True:
    ret, frame = cap.read()
    frame = cv2.flip(frame, 1)

    frame = cv2.GaussianBlur(frame, ksize, sigmaX)
    
    frame_diff = cv2.absdiff(prevFrame, frame)

    frame_diff_gray = cv2.cvtColor(frame_diff, cv2.COLOR_BGR2GRAY)

    _, motion_mask = cv2.threshold(frame_diff_gray, round(thresholdCoefficient * 255), 255, cv2.THRESH_BINARY)

    motion_value = np.count_nonzero(motion_mask)

    mapped_value = np.interp(motion_value, [0, motion_mask.size], [0, 1000])
    
    timeElapsed = round(time.time(), 2) - startTime
    x.append(timeElapsed)
    y.append(mapped_value)
    
    if mapped_value > motionTrigger:
        motionDetected = True
        motionStart = round(time.time())
    
    if motionDetected and (round(time.time())-motionStart >= stateRelease):
        motionDetected = False
    
    
    if motionDetected:
        colorName = "r"
    else:
        colorName = "b"
        
        
    ax.plot(x, y, color=colorName)
    fig.canvas.draw()
    
    
    motion_mask = cv2.cvtColor(motion_mask, cv2.COLOR_GRAY2BGR)
    cv2.putText(motion_mask,
                str(round(mapped_value)),
                (10, 50),
                cv2.FONT_HERSHEY_COMPLEX,
                1,
                (255, 0, 0),
                2)
 
    cv2.imshow('Motion Mask', motion_mask)
    cv2.imshow("Frame", cv2.cvtColor(frame, cv2.COLOR_BGR2LUV))
    #fig.set_xlim(left=frameNo-50)
   
    
    prevFrame = frame
    frameNo += 1
    if cv2.waitKey(1) == 32:  
        break

plt.show()
    
cap.release()
cv2.destroyAllWindows()