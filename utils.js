const validator = require('validator')
const base64 = require('base-64')
const CryptoJS = require('crypto-js')

const HTTP_PORT = 3001
const PEER_PORT = 3002
const SECURE = true
const DB_NAME = 'CHATDB'
const SESSION_EXPIRE_AFTER = 86400 // seconds
const JWT_HEADER = base64.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

// Helper function for creating JWT's
const createJWT = (meeting, username, admin) => {
  const payload = JSON.stringify({
    Meeting: meeting,
    Username: username,
    Admin: admin
  })

  // Sign the header and payload message
  const message = JWT_HEADER + '.' + base64.encode(payload)
  const signature = CryptoJS.HmacSHA256(message, process.env.SHA_SECRET)

  // JWT's are structure as such: header.payload.signature
  return message + '.' + base64.encode(JSON.stringify(signature))
}

// Connects the mongo object to db and set's up auto-expiry
const connectToDb = async (db) => {
  await db.connect()

  // Create TTL indices (auto-expire docs)
  db.db(DB_NAME).collection('Meetings').createIndex(
    { Date: 1 },
    { expireAfterSeconds: SESSION_EXPIRE_AFTER }
  )

  db.db(DB_NAME).collection('Users').createIndex(
    { Date: 1 },
    { expireAfterSeconds: SESSION_EXPIRE_AFTER }
  )
}

const validateNewMeet = (req, res, next) => {
  if (!validator.isLength(req.body.Password, { min: 4, max: 20 })) {
    res.status(400).send({
      Error: 'Password length must be between 4 and 20.'
    })

    return
  }

  validator.trim(req.body.Username)
  if (!validator.isLength(req.body.Username, { min: 1, max: 20 })) {
    res.status(400).send({
      Error: 'Username length must be between 1 and 20 (exluding whitespace)'
    })
  }

  next()
}

const validateSignIn = (req, res, next) => {
  if (!validator.isLength(req.body.Password, { min: 4, max: 20 })) {
    res.status(400).send({
      Error: 'Password length must be between 4 and 20.'
    })

    return
  }

  validator.trim(req.body.Username)
  if (!validator.isLength(req.body.Username, { min: 1, max: 20 })) {
    res.status(400).send({
      Error: 'Username length must be between 1 and 20 (exluding whitespace)'
    })

    return
  }

  validator.trim(req.body.Meeting)
  if (!validator.isLength(req.body.Meeting, { min: 8, max: 8 })) {
    res.status(400).send({
      Error: 'Meeting ID length must be 8 characters.'
    })
  }

  next()
}

module.exports = {
  HTTP_PORT,
  PEER_PORT,
  SECURE,
  DB_NAME,
  createJWT,
  connectToDb,
  validateNewMeet,
  validateSignIn
}
