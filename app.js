const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const dotenv = require('dotenv')
const { MongoClient } = require('mongodb')
const peerSrv = require('peer').PeerServer
const base64 = require('base-64')
const CryptoJS = require('crypto-js')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

// Edit these parameters accordingly
const HTTP_PORT = 3001
const PEER_PORT = 3002
const SECURE = true
const DB_NAME = 'V2Testing'
const SESSION_EXPIRE_AFTER = 86400 // Lifespan of a meeting in ms (24 HOURS)
const JWT_HEADER = base64.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

// Set up dotenv so we can privately pass DB credentials
dotenv.config()

// Connect to the MongoDB database using creds from dotenv file
const db = new MongoClient(process.env.CONN_URI)

const connectToDb = async () => await db.connect()
connectToDb().catch(console.error)

// Serves the build folder (which includes our public HTML sites)
app.use(express.static('build'))
app.use(express.json())

// Helper function for creating JWT's
const createJWT = (meeting, username, admin) => {
  const payload = JSON.stringify({ Meeting: meeting, Username: username, Admin: admin })

  // Sign the header and payload message
  const message = JWT_HEADER + '.' + base64.encode(payload)
  const signature = CryptoJS.HmacSHA256(message, process.env.SHA_SECRET)

  // JWT's are structure as such: header.payload.signature
  return message + '.' + base64.encode(JSON.stringify(signature))
}

// Keeps track of how many users are in a meeting
// so we can block when there's too many.
const rooms = {}

app.get('/meeting/:meet', (req, res) => {
  res.sendFile('/Users/mz/Desktop/videochat/build/index.html')
})

app.post('/api/create-meeting', async (req, res) => {
  // Validate request
  if (!('Username' in req.body) ||
    !('Password' in req.body)) {
    res.status(400).send({ Error: 'Invalid request.' })
    return
  }

  // Create meeting
  const id = uuidv4().slice(0, 8)
  const JWT = createJWT(id, req.body.Username, true)
  const salt = bcrypt.genSaltSync(10)

  const meeting = {
    MeetingID: id,
    Password: bcrypt.hashSync(req.body.Password, salt),
    Admin: req.body.Username,
    Salt: salt,
    Date: Date(new Date().valueOf()),
    expireAfterSeconds: SESSION_EXPIRE_AFTER
  }

  // Add meeting to database
  await db.db(DB_NAME).collection('Meetings').insertOne(meeting)
    .catch((e) => {
      res.status(500).send({ Error: 'Database internal error.' })
    })

  // Register username
  // Admins expire whenever the meeting expires
  await db.db(DB_NAME).collection('Users').insertOne({
    MeetingID: id,
    Username: req.body.Username,
    Admin: true,
    expireAfterSeconds: SESSION_EXPIRE_AFTER
  }).catch((e) => {
    res.status(500).send({ Error: 'Database internal error.' })
  })

  res.status(200).send({
    Username: req.body.Username,
    Meeting: id,
    Admin: true,
    JWT: JWT
  })
})

app.post('/api/sign-in', async (req, res) => {
  // Validate request
  if (!('Username' in req.body) ||
     !('Password' in req.body) ||
     !('Meeting' in req.body)) {
    res.status(400).send({ Error: 'Invalid Request' })
    return
  }

  // Verify meeting exists
  const meetingExists = await db.db(DB_NAME).collection('Meetings')
    .findOne({ MeetingID: req.body.Meeting })

  if (!meetingExists || meetingExists === null) {
    res.status(400).send({ Error: 'Meeting expired.' })
    return
  }

  // Block sign-in if meeting is already at capacity
  if (rooms[req.body.Meeting] >= 2) {
    res.status(400).send({ Error: 'Meeting is full.' })
    return
  }

  // Query database to check if username is unique
  const userExists = await db.db(DB_NAME).collection('Users').findOne({
    MeetingID: req.body.Meeting,
    Username: req.body.Username
  })

  if (userExists) {
    res.status(400).send({ Error: 'Username already taken' })
    return
  }

  // Verify password is correct
  if (bcrypt.hashSync(req.body.Password, meetingExists.Salt) !== meetingExists.Password) {
    res.status(400).send({ Error: 'Incorrect password' })
    return
  }

  // Register user
  await db.db(DB_NAME).collection('Users').insertOne({
    MeetingID: req.body.Meeting,
    Username: req.body.Username,
    Admin: false,
    expireAfterSeconds: SESSION_EXPIRE_AFTER
  }).catch((e) => {
    res.status(500).send({ Error: 'Database internal error.' })
  })

  // Generate JWT
  const JWT = createJWT(req.body.Meeting, req.body.Username, false)

  res.status(200).send({
    Username: req.body.Username,
    Meeting: req.body.Meeting,
    Admin: false, // @TODO
    JWT: JWT
  })
})

io.on('connection', conn => {
  conn.on('ENTER-MEETING', async msg => {
    // Validate message
    if (!('JWT' in msg) || !('PeerID' in msg)) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return
    }

    // Split the JWT by full-stop so we can get the header and payload.
    const authToken = msg.JWT.split('.')

    if (authToken.length < 3 || authToken.length > 3) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return
    }

    // Unpack JWT
    let decodedJWT = {}
    try {
      const header = JSON.parse(base64.decode(authToken[0]))
      const payload = JSON.parse(base64.decode(authToken[1]))
      decodedJWT = {
        Header: header,
        Username: payload.Username,
        Meeting: payload.Meeting,
        Admin: payload.Admin,
        Signature: authToken[2]
      }
    } catch (e) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return
    }

    if (rooms[decodedJWT.Meeting] >= 2) {
      conn.emit('ERROR', { Error: 'Meeting full.' })
      return
    }

    // Verify JWT
    const message = authToken[0] + '.' + authToken[1]
    const signature = base64.encode(
      JSON.stringify(CryptoJS.HmacSHA256(message, process.env.SHA_SECRET))
    )

    if (signature !== decodedJWT.Signature) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return
    }

    // Verify meeting still exists
    const meetingExists = await db.db(DB_NAME).collection('Meetings')
      .findOne({ MeetingID: decodedJWT.Meeting })

    if (!meetingExists || meetingExists === null) {
      conn.emit('ERROR', { Error: 'Meeting expired.' })
      return
    }

    // User enters socketio meeting room
    conn.join(decodedJWT.Meeting)
    conn.emit('ENTER-SUCCESS')

    if (rooms[decodedJWT.Meeting] === undefined) {
      rooms[decodedJWT.Meeting] = 1
    } else {
      rooms[decodedJWT.Meeting]++
    }

    // Handle room events
    conn.on('SENT-MESSAGE', (msg) => {
      if (!('message' in msg)) return

      conn.broadcast.in(decodedJWT.Meeting).emit('RECEIVED-MESSAGE', {
        Data: msg.message,
        Username: decodedJWT.Username
      })
    })

    // Handle call discovery
    conn.on('CALL-REQUEST', (peer) => {
      conn.broadcast.in(decodedJWT.Meeting).emit('CALL-REQUEST', peer)
    })

    conn.on('disconnect', () => {
      conn.broadcast.in(decodedJWT.Meeting).emit('PEER-DISCONNECTED', {
        PeerID: msg.PeerID
      })

      rooms[decodedJWT.Meeting]--
    })
  })
})

// Starts the peer server
peerSrv({ port: PEER_PORT, secure: SECURE, path: '/' })

// Starts the Express HTTP server
http.listen(HTTP_PORT, () => console.log('Server Running'))
