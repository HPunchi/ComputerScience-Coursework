import cv2
import math



cap = cv2.VideoCapture(1)


while True:
    ret, frame = cap.read()
    if not ret:
        break


    frame = cv2.flip(frame, 1)

    cv2.imshow('Normal Frame', frame)
    key = cv2.waitKey(1)
    if key == ord("q"):
        break

cv2.destroyAllWindows()
cap.release()