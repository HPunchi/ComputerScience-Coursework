import os
import sys
import math

def repIndexer(data, valueToFind):
    dotIndexes = [] #new list to store indexes of found value
    for i in range(len(data)): #iterate through string of data
        if data[i] == valueToFind: 
            dotIndexes.append(i) #add index to list if equal to value
    return dotIndexes #return this list of indexes




