import cv2
import numpy as np
import time

ksize = (9, 9) #kernel size used in Gaussian Blur
sigmaX = 0.1 #sigma variable for standard deviation in Gaussian Blur
thresholdCoefficient = 0.2 #threshold proportion to exceed to contribute to motion


frame = cv2.imread("./testImgs/frame2.png")
      
previousFrame = cv2.imread("./testImgs/frame1.png")[0:frame.shape[0], 0:frame.shape[1]]



print(previousFrame.shape)
print(frame.shape)

frame = frame[0:previousFrame.shape[0], 0:previousFrame.shape[1]]

cv2.imshow("Current Frame", frame)
cv2.waitKey(0)

frame = cv2.GaussianBlur(frame, ksize, sigmaX)

cv2.imshow("Blurred Frame", frame)
cv2.waitKey(0)

print(previousFrame.shape)
print(frame.shape)

frameDiff = cv2.absdiff(previousFrame, frame)

cv2.imshow("Frame Difference", frameDiff)
cv2.waitKey(0)

grayedFrameDiff = cv2.cvtColor(frameDiff, cv2.COLOR_BGR2GRAY) 

cv2.imshow("Grayed Frame Difference", grayedFrameDiff)
cv2.waitKey(0)

_, motionMask = cv2.threshold(grayedFrameDiff, 60, 255, cv2.THRESH_BINARY)

cv2.imshow("Motion Mask", motionMask)
cv2.waitKey(0)

motionCount = np.count_nonzero(motionMask)
motionValue = np.interp(motionCount, [0, motionMask.size], [0, 100]) #this is the raw motion value

print(f"Raw count: {str(motionCount)}")
print(f"Resolution: {str(motionMask.size)}")
print(f"Motion Value: {str(motionValue)}") 
print("Trigger Value: 1")
print("Motion Detected: True")