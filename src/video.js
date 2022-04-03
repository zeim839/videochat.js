/* global localStorage */
import './css/video.css'
import React from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import Peer from 'peerjs'
import axios from 'axios'

import Loading from './components/Loading'
import AlertWrapper from './components/AlertWrapper'
import SignIntoMeeting from './components/SignIntoMeeting'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import { CamIcon, MicIcon } from './components/PermissionIcons'
import GetFeedPrompt from './components/GetFeedPrompt'
import Drawer from '@mui/material/Drawer'
import MessageView from './components/MessageView'
import VideoGrid from './components/VideoGrid'
import ChatIcon from './components/ChatIcon'

import CallEndIcon from '@mui/icons-material/CallEnd'
import Divider from '@mui/material/Divider'
import ShareIcon from '@mui/icons-material/Share'

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

class Video extends React.Component {
  constructor (props) {
    super(props)

    this.showAlert = props.showAlert
    this.drawerWidth = '0px'

    this.state = {
      username: null,
      password: null,
      meeting: props.params.id,
      admin: false,
      jwt: null,
      signedIn: false,
      dialedIn: false,
      camPerm: true,
      micPerm: true,
      selfStream: null,
      chatDrawer: false,
      windowHeight: window.innerHeight,
      peerID: null,
      finishedRestoring: false
    }

    // Connect to socket
    this.socket = io()

    // Handle errors
    this.socket.on('ERROR', msg => {
      // Redirect user to home page if meeting
      // has expired or is full.
      if (msg.Error === 'Meeting expired.' ||
      msg.Error === 'Meeting full.' ||
      msg.Error === 'Failed to authenticate. Please try again.') {
        setTimeout(() => {
          window.location.replace('/')
        }, 2500)

        return
      }

      this.showAlert(msg.Error)
    })

    // Initialise peerjs
    this.peer = new Peer(this.state.peerID, PEER_OPTIONS)

    // Wait for peerJS to open to establish peer ID
    this.peer.on('open', id => {
      this.setState({ ...this.state, peerID: id })
    })

    // Event listener for succesful entry into the meeting.
    // Received after sending a good ENTER-MEETING message to
    // the server.
    this.socket.on('ENTER-SUCCESS', msg => {
      this.setState({ ...this.state, signedIn: true })
    })
  }

  waitOnPeerID() {
    return new Promise((resolve, reject) => {
      if (this.state.peerID !== null) resolve(this.state.peerID)
      this.peer.on('open', resolve)
    })
  }

  // Toggles the state of the user's self-stream permissions
  // (camera and microphone).
  togglePermission (perm) {
    if (perm === 'cam') this.setState({ ...this.state, camPerm: !this.state.camPerm })
    if (perm === 'mic') this.setState({ ...this.state, micPerm: !this.state.micPerm })
  }

  // Returns a promise to establish a stream from the client's camera
  // and microphone.
  async establishFeed () {
    return new Promise((resolve, reject) => {
      // Attempts to establish an video/audio feed from the user's device
      // We take both video/audio to be true (at first) so we can toggle
      // them on/off without having to rerun getUserMedia.
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          this.setState({ ...this.state, selfStream: stream, dialedIn: true }, resolve)
        }).catch(error => {
          this.showAlert('Failed to initialise stream.')
          setTimeout(this.handleEndCall, 3000)
          reject(error)
        })
    })
  }

  // newSession is passed down to the <SignIntoMeeting />
  // component and is used to submit data from the sign-in
  // form to the server. Skipped if we already have a valid
  // session in localStorage.
  newSession (username, password) {
    axios.post('/api/sign-in', {
      Username: username,
      Password: password,
      Meeting: this.props.params.id
    })
      .then(res => {
        this.setState({
          ...this.state,
          username: res.data.Username,
          meeting: this.props.params.id,
          password: password,
          admin: res.data.Admin,
          jwt: res.data.JWT,
          signedIn: true
        }, () => {
          this.enterMeeting()
        })
      })
      .catch((e) => {
        this.showAlert(e.response.data.Error)
      })
  }

  // Once a session is established (either by reading localStorage
  // or by manually signing in), we use enterMeeting() to send
  // our session credentials and gain access to the meeting.
  // The server's response (which is what actually grants access),
  // is captured in the class constructor.
  async enterMeeting () {
    this.waitOnPeerID().then((id) => {
      this.socket.emit('ENTER-MEETING', {
        JWT: this.state.jwt,
        PeerID: id
      })
  
      localStorage.setItem('Session', JSON.stringify({
        Username: this.state.username,
        Meeting: this.state.meeting,
        Password: this.state.password,
        Admin: this.state.admin,
        JWT: this.state.jwt
      }))
    })
  }

  // Returns a promise and tries to restore a session from
  // localStorage. If succesful, then the promise is resolved.
  async restoreSession () {
    return new Promise((resolve, reject) => {
      try {
        const Session = JSON.parse(localStorage.getItem('Session'))

        if (Session.Meeting !== this.state.meeting) {
          localStorage.removeItem('Session')
          reject(new Error('Couldnt find session in localStorage.'))
        }

        this.setState({
          ...this.state,
          username: Session.Username,
          password: Session.Password,
          meeting: Session.Meeting,
          admin: Session.Admin,
          jwt: Session.JWT
        }, resolve)
      } catch (e) { reject(new Error('Couldnt find or parse session object from localStorage.')) }
    })
  }

  componentDidMount () {
    // Runs as soon as component is mounted onto view.
    // Attempts to restore a session from memory, and if succesful,
    // joins said session.
    this.restoreSession().then(() => {
      this.enterMeeting()
      this.setState({ ...this.state, finishedRestoring: true })
    }, () => {
      this.setState({ ...this.state, finishedRestoring: true })
    })

    // Listening for resize events so we can keep prevent message view
    // from overflowing.
    window.addEventListener('resize', () => {
      this.setState({
        ...this.state,
        windowHeight: window.innerHeight
      })
    })
  }

  handleEndCall () {
    window.location.reload()
  }

  shareCall () {
    // Get the current site URL
    const url = window.location.href

    // Invite/sharing details to write to clipboard.
    const shareText = (
      `${this.state.username} is inviting you to a meeting at ${url} \n\n` +
      `the meeting password is: ${this.state.password}`
    )

    // Write share message to clipboard, and then update state so we
    // show the copy success message.
    navigator.clipboard.writeText(shareText).then(res => {
      this.showAlert('Invite link copied to clipboard!')
    })
  }

  toggleDrawer () {
    this.drawerWidth = (this.drawerWidth === '0px') ? '260px' : '0px'
    this.setState({ ...this.state, chatDrawer: !this.state.chatDrawer })
  }

  render () {
    if (this.state.peerID === null || this.state.finishedRestoring === false) {
      return (
        <div className='video-page'>
          {Loading()}
        </div>
      )
    }

    // A session has been established and we set-up the client's feed
    if (this.state.signedIn && this.state.dialedIn) {
      return (
        <div className='video-page'>
          <Drawer
            anchor='right'
            variant='persistent'
            open={this.state.chatDrawer}
          >
            <MessageView
              meeting={this.state.meeting}
              socket={this.socket}
              windowHeight={this.state.windowHeight}
              closeDrawer={this.toggleDrawer.bind(this)}
            />
          </Drawer>
          <VideoGrid
            selfStream={this.state.selfStream}
            socket={this.socket}
            peer={this.peer}
            windowHeight={this.state.windowHeight}
            micPerm={this.state.micPerm}
            camPerm={this.state.camPerm}
            showAlert={this.showAlert}
          />
          <AppBar
            color='inherit' class='nav-menu' style={{
              width: `calc(100% - ${this.drawerWidth})`
            }}
          >
            <Toolbar>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton size='large' color='inherit' onClick={() => this.togglePermission('cam')}>
                <CamIcon
                  Active={this.state.camPerm}
                  htmlColor='white'
                />
              </IconButton>
              <IconButton size='large' color='inherit' onClick={() => this.togglePermission('mic')}>
                <MicIcon
                  Active={this.state.micPerm}
                  htmlColor='white'
                />
              </IconButton>
              <IconButton size='large' color='inherit' onClick={this.handleEndCall}>
                <CallEndIcon htmlColor='white' />
              </IconButton>
              <Divider orientation='vertical' color='inherit' class='divider' flexItem />
              <IconButton size='large' color='inherit' onClick={this.shareCall.bind(this)}>
                <ShareIcon htmlColor='white' />
              </IconButton>
              <ChatIcon
                onClick={this.toggleDrawer.bind(this)}
                socket={this.socket}
              />
            </Toolbar>
          </AppBar>
        </div>
      )
    }

    // We have signed in, but we still need to get the client's
    // stream feed.
    if (this.state.signedIn && !this.state.dialedIn) {
      return (
        <div className='video-page'>
          <GetFeedPrompt
            establishFeed={this.establishFeed.bind(this)}
            togglePermission={this.togglePermission.bind(this)}
          />
        </div>
      )
    }

    // We have not signed in.
    return (
      <div className='video-page'>
        <SignIntoMeeting
          newSession={this.newSession.bind(this)}
          showAlert={this.showAlert}
        />
      </div>
    )
  }
}

export default (props) => (
  <AlertWrapper>
    <Video {...props} params={useParams()} />
  </AlertWrapper>
)
