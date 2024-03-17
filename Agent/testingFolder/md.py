import cv2
import numpy as np
import time
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation


def resize_frame(frame, width=None, height=None):
    # Get the current frame dimensions
    current_height, current_width = frame.shape[:2]

    # If width or height is not specified, use the current dimensions
    if width is None:
        width = current_width
    if height is None:
        height = current_height

    # Calculate the aspect ratio
    aspect_ratio = current_width / current_height

    # Calculate the new dimensions while maintaining the aspect ratio
    if width / aspect_ratio <= height:
        new_width = int(width)
        new_height = int(width / aspect_ratio)
    else:
        new_width = int(height * aspect_ratio)
        new_height = int(height)

    # Resize the frame
    resized_frame = cv2.resize(frame, (new_width, new_height))

    return resized_frame



cap = cv2.VideoCapture(1)

ret, frame = cap.read()

frame = resize_frame(frame, width=600)
frame = cv2.flip(frame, 1)
previousFrame = frame

displayFrame = frame

motionDetected = False
motionTriggerValue = 100
motionTimeStart = round(time.time())
motionHold = 0.5
programStart = motionTimeStart


fig = plt.figure()
ax = fig.add_subplot()

ax.set_xlabel("Time elapsed (s)")
ax.set_ylabel("Motion magnitude (.1000)")

fig.show()

x = []
y = []




while cap.isOpened():
    ret, frame = cap.read()
    frame = resize_frame(frame, width=600)
    frame = cv2.flip(frame, 1)
    displayFrame = frame
    if not ret:
        break
   
    gray1 = cv2.cvtColor(previousFrame, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    sizeFactor = (11, 11)
    sigma = 0
    
    blur1 = cv2.GaussianBlur(gray1, sizeFactor, sigma)
    blur2 = cv2.GaussianBlur(gray2, sizeFactor, sigma)
    
    frameDelta = cv2.absdiff(blur1, blur2)
    
    
    threshold_value = 10

    _, binaryImage = cv2.threshold(frameDelta, threshold_value, 255, cv2.THRESH_BINARY)
    
    totalPixels = binaryImage.size
    whitePixels = np.sum(binaryImage == 255)
    deltaMotion = (whitePixels/totalPixels)*10000

    if deltaMotion >= motionTriggerValue:
        motionDetected = True
        motionTimeStart = round(time.time())

    if motionDetected:
        if (round(time.time()) - motionTimeStart) > motionHold:
            motionDetected = False


    if motionDetected:
        colorName = "r"
    else:
        colorName = "b"
        
    timeElapsed = round(time.time(), 2) - programStart
    x.append(timeElapsed)
    y.append(deltaMotion)
    
    ax.plot(x, y, color=colorName)
    fig.canvas.draw()

    
    cv2.imshow('Current frame', frame)
    cv2.imshow('Previous frame', previousFrame)

    cv2.imshow('Current grayscale', gray1)
    cv2.imshow('Previous grayscale', gray2)
    
    cv2.imshow('Current blur', blur1)
    cv2.imshow('Previous blur', blur2)

    cv2.imshow('Frame delta', frameDelta)

    cv2.imshow('Binary image', binaryImage)


    print(f"Motion value [{deltaMotion}]")
    previousFrame = frame

    key = cv2.waitKey(1)
    if key == ord("q"):
        break

    
cap.release()
cv2.destroyAllWindows()
