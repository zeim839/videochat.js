# Videochat.js
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme) <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a> <a href="https://www.npmjs.com/package/standard"> <img src="https://img.shields.io/npm/v/standard.svg" alt="npm version"></a>

P2P room-based video conferencing built with react.js, peer.js and express server. Try the [demo](https://videochat.ml/).

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Testing](#testing)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Install
Clone the repository to your local directory
```
git clone https://github.com/zeim839/videochat.js.git
```
Navigate to folder
```
cd videochat.js
```
Install dependencies (requires [nodejs](https://nodejs.org/))
```
npm i
```

## Usage
<b> Set up a MongoDB instance: </b> <br>
Videochat.js uses MongoDB to manage user and meeting sessions. You can set up a free cloud-hosted instance with [MongoDB Atlas](https://www.mongodb.com/atlas), or set up your own [MongoDB server](https://www.mongodb.com/try/download/community).

<b> Set up .env: </b> <br>
Videochat.js stores its MongoDB credentials and a SHA_SECRET in a private .env file, which you'll need to set up in order to connect to your own database and sign JWT's. <br>

Assuming you're in the project root folder, create the .env file by running:
```
touch .env
```

Open the .env file in your IDE (it might be hidden if you're using your default file navigator), and paste and fill-in the specified details:
```
CONN_URI = "mongodb+srv://<username>:<password>@..."
SHA_SECRET = "<random string>"
```
The CONN_URI is a connection-by-driver URI, for more details, refer to the mongodb [docs](https://www.mongodb.com/docs/atlas/driver-connection/).

<b> Running on node/local environments: </b> <br>
```
npm start
```
Front-end runs as a react scripts instance and connects to the server via react proxy. Useful for working with the front-end without having to rebuild after each edit. Access the site at: 
```
http://localhost:3000
```

<b> Running on production environments: </b> <br>
```
npm run build 
npm run serve
```
Builds the react front-end and serves the files from the server. This is the approach that you'll most likely use on a production environment (except without serving over npm). Access the site at:
```
http://localhost:3001
```
<b> Optional    Configurations: </b> <br>
You can optionally modify the ports, HTTPS settings, database names, etc. through your .env file. 

```
HTTP_PORT = 3001
PEER_PORT = 3002
SECURE = true
DB_NAME = "CHATDB"
```

Modify the client-side Peer.js client through the [peerOptions.js](src/peerOptions.js) file. 
```js
const PEER_OPTIONS = {
  host: '/',
  secure: false, 
  port: 3002
  // etc...
}
```

## Testing
Testing still hasn't been fully implemented, but existing tests can be ran using the command line:
```
npm test
```
This will fire up an instance of cypress, which Videochat.js uses to test front end code. 

## Security
The PeerJS library and peer brokering servers are highly vulnerable and not meant for high-traffic/commercial applications. That said, PeerID's can easily be spoofed and client streams can be rerouted to an external application. 

Chat messages are also sent unencrypted, which isn't a concern if you're using HTTPS, but they can still be opened and read server-side. 

## Contributing
Please adhere to the following guidelines:
- Write meaningful and detailed commit messages and/or PR descriptions. 
- Please specify steps to reproduce any bugs/issues in your issue descriptions (if applicable). 
- If you want to introduce a new feature, please open an issue first - this way you'll be saving yourself time in the (unlikely) case that your feature is rejected. 
- Lint any code proposals by running ```npm run lint``` and adhere to the [standard.js](https://standardjs.com/) specifications. 
- Any modifications to the README must adhere to [standard-readme](https://github.com/RichardLitt/standard-readme).
- If your PR modifies the front-end, make sure to write and/or modify any appropriate [cypress](https://docs.cypress.io/) tests. 

These guidelines are strongly recommended but are by no means required - feel free to be flexible with your contributions.

## License
[Unlicense](LICENSE.md)
