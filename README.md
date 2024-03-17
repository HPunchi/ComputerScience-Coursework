# HomeShield

This is the GitHub Repository for my 2024 A-Level Computer Science Coursework. It contains the source code used for HomeShield, for both the Agent and the Hub. It is recommended to download the contents of each folder and run them locally on your machine. 

## Installation
Ensure you have [Node](https://nodejs.org/en/download) and [Python](https://www.python.org/downloads/) fully downloaded and set up on your machine before attempting to install any packages or run any scripts.
### Hub
Use the Node installation command at terminate [npm install](https://docs.npmjs.com/cli/v10/commands/npm-install) to install all packages. The packages can be found in the *packages.json* file in the root folder. 

```bash
npm install [package_name]
```
### Agent
Use the Python package manager [pip](https://pip.pypa.io/en/stable/) to install each module outlined in the documentation. 

```bash
pip install [module_name]
```

## Usage
Start the HomeShield server locally at root with the command:
```bash
npm run dev
```
Or, alternatively, use:
```bash
node index.js
```
Launch the Agent python file by running the *agent.py* file in any Python IDE or navigate to its directory and use the command:
```bash
python agent.py
```
Note that an instance of the web server is running (either locally or on your local network) in order for the Agent to connect to it. The base URL in the *serverFuncs.py* file may need alteration.

## Notes
Please take the following points into consideration:
- The server and the Hub should work on any operating system with most common web browsers. However, the Agent is only tested and workable on Windows. It may load or work on MacOS but this is unlikely, as PyQt5 is oriented for Windows users.
- The server may show errors because the .ENV file has been purposefully omitted, to protect custom token, private keys, and database URLs. Contact me via email to provide you with a personalised .ENV file to place into the Hub folder to run the server.

Do not hesitate to contact my for any support or queries.

Email address: hpunchi2005@gmail.com
