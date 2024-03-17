import sys #importing of modules
import time
import threading
Color = { #colour codes in key-value format for command line outputs from color to code
    "RED": '\033[91m',
    "GREEN": '\033[92m',
    "YELLOW": '\033[93m',
    "BLUE": '\033[94m',
    "PURPLE": '\033[95m',
    "CYAN": '\033[96m',
    "WHITE": '\033[97m',
    "RESET": '\033[0m' 
}   
class Spinner: #class for spinner 
    def __init__(self, interval=0.1): #update the spinner every 0.1s by default
        self.symbols = ['-', '\\', '|', '/']  #these are the symbols the spinner will cycle through
        self.interval = interval 
        self.is_spinning = False
        self.spinner_thread = None
    def start(self, displayText): #the spinner will spin at the start of the and will be followed by display text
        self.displayText = displayText
        if not self.is_spinning:
            self.is_spinning = True
            self.spinner_thread = threading.Thread(target=self._spin) #run the _spin() method on each iteration of the thread
            self.spinner_thread.start() #start the spinner thread
    def _spin(self):
        while self.is_spinning:
            for symbol in self.symbols: #iterate through each symbol in symbols array for spinner
                sys.stdout.write(Color["BLUE"] + '\r\033[K' + symbol + " " + self.displayText + Color["RESET"]) #make blue line
                sys.stdout.flush() #display line on command line
                time.sleep(self.interval) #wait till interval time is done to restart next cycle of spinner
    def end(self): #method to terminate spinner
        if self.is_spinning: 
            self.is_spinning = False #change state to block any additional writes to command line
            self.spinner_thread.join() #join threads
            sys.stdout.write('\r') #reset cursor to start of line
            sys.stdout.write("\n") #start new line for any new outputs to command line
            sys.stdout.flush() #make changes on command lineß

class ProgressBar:
    def __init__(self, total, length=40, fill='█', prefix='Progress:'):
        self.total = total
        self.length = length
        self.fill = fill
        self.prefix = prefix
        self.progress = 0
        self.step = total / length
        self.percent = 0
        self.is_running = False

    def start(self):
        self.is_running = True
        self.progress = 0
        self.percent = 0
        self._update_bar()

    def _update_bar(self):
        while self.is_running and self.percent < 100:
            self.progress += 1
            if self.progress >= self.step:
                self.percent += 1
                self.progress = 0
                bar = self.fill * int(self.length * self.percent / 100)
                sys.stdout.write('\r%s |%s| %d%%' % (self.prefix, bar.ljust(self.length), self.percent))
                #sys.stdout.flush()
            time.sleep(0.1)

    def end(self):
        if self.is_running:
            self.is_running = False
            
            sys.stdout.write('\n')

    def update_text(self, new_text):
        sys.stdout.write('\r%s |%s| %d%% %s' % (self.prefix, self.fill.ljust(self.length), self.percent, new_text))
        #sys.stdout.flush()

def colorPrint(text, color="RESET"): #function to print text in a certain colour (see Color dictionary)
    print(Color[color] + text + Color["RESET"]) #print text in given colour and reset colour to white for next line


