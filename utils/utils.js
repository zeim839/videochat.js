const base64 = require('base-64')
const CryptoJS = require('crypto-js')

const SESSION_EXPIRY = 86400
const JWT_HEADER = base64.encode(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' })
)

// Helper function for creating JWT's
function createJWT (meeting, username, admin) {
  const payload = JSON.stringify({
    Meeting: meeting,
    Username: username,
    Admin: admin
  })

  // Sign the header and payload message
  const message = [JWT_HEADER, '.', base64.encode(payload)].join('')
  const signature = CryptoJS.HmacSHA256(message, process.env.SHA_SECRET)
  const sigB64 = base64.encode(JSON.stringify(signature))

  // JWT's are structure as such: header.payload.signature
  return [message, '.', sigB64].join('')
}

// Connects the mongo object to db and set's up auto-expiry
async function connectDB (db, DB_NAME) {
  await db.connect()

  // Create TTL indices (auto-expire docs)
  db.db(DB_NAME).collection('Meetings').createIndex(
    { Date: 1 },
    { expireAfterSeconds: SESSION_EXPIRY }
  )

  db.db(DB_NAME).collection('Users').createIndex(
    { Date: 1 },
    { expireAfterSeconds: SESSION_EXPIRY }
  )
}

module.exports = {
  createJWT,
  connectDB
}
