const validator = require('validator')

class Validate {
  // ROUTE: /api/create-meeting
  static newMeeting (req, res, next) {
  // Password length is between 4 and 20 chars
    if (!validator.isLength(req.body.Password, { min: 4, max: 20 })) {
      res.status(400).send({
        Error: 'Password length must be between 4 and 20.'
      })

      return
    }

    // Username is not whitespace, is between 1 and 20 chars
    req.body.Username = validator.trim(req.body.Username)
    if (!validator.isLength(req.body.Username, { min: 1, max: 20 })) {
      res.status(400).send({
        Error: 'Username length must be between 1 and 20 (exluding whitespace)'
      })

      return
    }

    next()
  }

  // ROUTE: /api/sign-in
  static signIn (req, res, next) {
  // Password length is between 4 and 20 chars
    if (!validator.isLength(req.body.Password, { min: 4, max: 20 })) {
      res.status(400).send({
        Error: 'Password length must be between 4 and 20.'
      })

      return
    }

    // Username is not white space, has length between 1, 20 chars
    req.body.Username = validator.trim(req.body.Username)
    if (!validator.isLength(req.body.Username, { min: 1, max: 20 })) {
      res.status(400).send({
        Error: 'Username length must be between 1 and 20 (exluding whitespace)'
      })

      return
    }

    // Meeting ID length is 8 chars
    req.body.Meeting = validator.trim(req.body.Meeting)
    if (!validator.isLength(req.body.Meeting, { min: 8, max: 8 })) {
      res.status(400).send({
        Error: 'Meeting ID length must be 8 characters.'
      })

      return
    }

    next()
  }

  // Socket.io ENTER-MEETING
  static ioMeeting (msg, conn) {
    if (!('JWT' in msg) || !('PeerID' in msg)) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return false
    }

    // Split the JWT by full-stop so we can get the header and payload.
    const authToken = msg.JWT.split('.')

    if (authToken.length < 3 || authToken.length > 3) {
      conn.emit('ERROR', { Error: 'Failed to authenticate. Please try again.' })
      return false
    }

    return true
  }
}

module.exports = Validate
