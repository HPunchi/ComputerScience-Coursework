import sys 
import os
import requests 
from tabulate import tabulate


def clearEvents():
    resp = clearEvents 
    
commands = [
    [    
        "CE",
        "Reset global event state",
    ]
]

callbackDict = {
    "CE": clearEvents
}
exitCode = "exit"
userInput = ""

while userInput != exitCode:
    print("\n")
    headers = ['Command Code', 'Action']
    print(tabulate(commands, headers, tablefmt='grid'))
    
    userInput = input("Enter your command: ").upper()
    
    codes = [subarray[0] for subarray in commands]
    
    if userInput not in codes:
        print("Invalid entry.")
        continue
    
    callbackDict[userInput]()    
    