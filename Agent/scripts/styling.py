import os
from dotenv import load_dotenv #access to ENV variables for CSS path
from .globalFuncs import * #import repIndexer() function
load_dotenv() #load contents of .ENV file
def verifyDotIndex(dotI, openI, closeI): #function to verify dot is starting a class and not within CSS code
    verfiedDotI = [dotI[0]]
    for i in range(1, len(dotI)):
        if ((dotI[i] > closeI[i-1])and(dotI[i] < openI[i])): #checks if dot is not between any pair of curly brackets
            verfiedDotI.append(dotI[i])
    return verfiedDotI #returns a new array of verified dots
def fetchCSS(cName, path=os.getenv("CSS_PATH"), portionTrigger="."): #class triggered by '.' in CSS syntax
    with open(path, "r") as cssFile: #opens CSS file
        data = cssFile.read().strip() #reads contents of CSS file as string and strips surrounding whitespaces
    dotIndexes = repIndexer(data, portionTrigger) #get indexes of '.' (used to start a class)
    openBraceIndexes = repIndexer(data, "{") #get indexes of '{' (show start of CSS code)
    closeBraceIndexes = repIndexer(data, "}") #get indexes of '}' (show end of CSS code)
    dotIndexes = verifyDotIndex(dotIndexes, openBraceIndexes, closeBraceIndexes) #verify these dot indexes into new array
    cNames = [] #new list of classNames found in CSS file
    for i in range(len(dotIndexes)):
        cNames.append(data[dotIndexes[i]+1:openBraceIndexes[i]]) #add text between a starting '.' and a starting '{'
    if cName not in cNames:
        return ""  #return empty string if class not found in CSS file
    cssCode = data[openBraceIndexes[cNames.index(cName)]+1:closeBraceIndexes[cNames.index(cName)]].strip().replace("    ", "")       
    return cssCode #returns formated CSS code (as string) between corresponding '{' and '}' for classname

