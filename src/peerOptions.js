const PEER_OPTIONS = {
  host: '/',
  secure: false,
  port: 3002,
  config: {
    iceServers: [{
      url: 'stun:stun.l.google.com:19302'
    }]
  }
}

export default PEER_OPTIONS
