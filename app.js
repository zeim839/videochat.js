const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const path = require('path')

const dotenv = require('dotenv')
const { MongoClient } = require('mongodb')
const peerSrv = require('peer').PeerServer
const base64 = require('base-64')
const CryptoJS = require('crypto-js')
const { v4: uuidv4 } = require('uuid')
const { createJWT, connectDB } = require('./utils/utils')
const Validate = require('./utils/validation')
const limiter = require('./utils/rateLimiter')

dotenv.config()
const HTTP_PORT = process.env.HTTP_PORT || 3001
const PEER_PORT = process.env.PEER_PORT || 3002
const SECURE = process.env.SECURE || true
const DB_NAME = process.env.DB_NAME || 'CHATDB'

// Initialize and connect to DB
const db = new MongoClient(process.env.CONN_URI)
connectDB(db, DB_NAME).catch(console.error)

// Serves the build folder
app.use(limiter)
app.use(express.static('build'))
app.use(express.json())

// Keeps track of how many users are in a meeting
// so we can block when there's too many.
const rooms = {}

// Returns a meeting page, or redirects home if
// meeting doesnt exist.
app.get('/meeting/:meet', async (req, res) => {
  const meetingExists = await db.db(DB_NAME)
    .collection('Meetings')
    .findOne({ MeetingID: req.params.meet })

  if (!meetingExists) {
    res.redirect('/')
    return
  }

  res.sendFile(path.join(__dirname, '/build/index.html'))
})

app.post('/api/create-meeting', Validate.newMeeting, async (req, res) => {
  const id = uuidv4().slice(0, 8)
  const JWT = createJWT(id, req.body.Username, true)

  const username = req.body.Username
  const password = req.body.Password

  // Hash must be converted to string from wordArray
  const salt = uuidv4().slice(0, 10)
  const hash = CryptoJS.SHA3(password + salt,
    { outputLength: 256 }).toString(CryptoJS.enc.Base64)

  const meeting = {
    MeetingID: id,
    Password: hash,
    Admin: username,
    Salt: salt,
    Date: new Date()
  }

  await db.db(DB_NAME).collection('Meetings')
    .insertOne(meeting).catch((e) => {
      res.status(500).send({
        Error: 'Database failure: please try again.'
      })
      throw e
    })

  // Register username
  // Admins expire whenever the meeting expires
  await db.db(DB_NAME).collection('Users')
    .insertOne({
      MeetingID: id,
      Username: username,
      Admin: true,
      Date: meeting.Date
    }).catch((e) => {
      res.status(500).send({
        Error: 'Database failure: please try again.'
      })
      throw e
    })

  res.status(200).send({
    Username: username,
    Meeting: id,
    Admin: true,
    JWT: JWT
  })
})

app.post('/api/sign-in', Validate.signIn, async (req, res) => {
  const meetingID = req.body.Meeting
  const username = req.body.Username
  const password = req.body.Password

  // Verify meeting exists
  const meetingExists = await db.db(DB_NAME).collection('Meetings')
    .findOne({ MeetingID: meetingID })

  if (!meetingExists || meetingExists === null) {
    res.status(400).send({ Error: 'Meeting expired.' })
    return
  }

  // Block sign-in if meeting is already at capacity
  if (rooms[meetingID] >= 2) {
    res.status(400).send({ Error: 'Meeting is full.' })
    return
  }

  // Query database to check if username is unique
  const userExists = await db.db(DB_NAME).collection('Users')
    .findOne({
      MeetingID: meetingID,
      Username: username
    })

  if (userExists) {
    res.status(400).send({ Error: 'Username already taken' })
    return
  }

  // Verify password is correct
  const salted = password + meetingExists.Salt
  const inputHashed = CryptoJS.SHA3(salted, { outputLength: 256 })
    .toString(CryptoJS.enc.Base64)

  if (inputHashed !== meetingExists.Password) {
    res.status(400).send({ Error: 'Incorrect password' })
    return
  }

  // Register user
  await db.db(DB_NAME).collection('Users')
    .insertOne({
      MeetingID: meetingID,
      Username: username,
      Admin: false,
      Date: meetingExists.Date
    }).catch((e) => {
      res.status(500).send({
        Error: 'Database internal error.'
      })
      throw e
    })

  // Generate JWT
  const JWT = createJWT(meetingID, username, false)

  res.status(200).send({
    Username: username,
    Meeting: meetingID,
    Admin: false,
    JWT: JWT
  })
})

io.on('connection', conn => {
  conn.on('ENTER-MEETING', async msg => {
    if (!Validate.ioMeeting(msg, conn)) return
    const authToken = msg.JWT.split('.')

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
    const message = [authToken[0], '.', authToken[1]].join('')
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

// Start servers
peerSrv({ port: PEER_PORT, secure: SECURE, path: '/' })
http.listen(HTTP_PORT, () => console.log('Server Running'))
