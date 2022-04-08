import './css/video.css'
import React from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import Peer from 'peerjs'
import PEER_OPTIONS from './peerOptions'
import base64 from 'base-64'

import Loading from './components/Loading'
import AlertWrapper from './components/AlertWrapper'
import SignIntoMeeting from './components/SignIntoMeeting'
import GetFeedPrompt from './components/GetFeedPrompt'
import Drawer from '@mui/material/Drawer'
import MessageView from './components/MessageView'
import VideoGrid from './components/VideoGrid'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { CamIcon, MicIcon } from './components/PermissionIcons'
import ChatIcon from './components/ChatIcon'

import CallEndIcon from '@mui/icons-material/CallEnd'
import Divider from '@mui/material/Divider'
import ShareIcon from '@mui/icons-material/Share'

class Video extends React.Component {
  constructor (props) {
    super(props)
    this.showAlert = props.showAlert

    // Session details
    this.Username = null
    this.Password = null
    this.Admin = null
    this.JWT = null

    // Specifies the width of the
    // drawer where the client can
    // type and view messages
    this.drawerWidth = '0px'

    this.state = {
      PeerID: null,
      SignedIn: false,
      Feed: null,
      Meeting: props.params.id,
      PVideo: true,
      PAudio: true,
      chatDrawer: false
    }

    // P2P
    this.socket = io()
    this.peer = new Peer(null, PEER_OPTIONS)

    // Handle errors
    this.socket.on('ERROR', msg => {
      // The client is redirected to the homepage
      // because they wont be able to connect to other
      // peers
      if (msg.Error === 'Meeting expired.' ||
          msg.Error === 'Meeting full.' ||
          msg.Error === 'Failed to authenticate. Please try again.') {
        setTimeout(() => {
          window.location.replace('/')
        }, 4000)
      }

      this.showAlert(msg.Error)
    })
  }

  // Promises to wait until PeerJS has established
  // a PeerID.
  establishPeerID () {
    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        this.setState({ ...this.state, PeerID: id }, () => {
          resolve(id)
        })
      })
    })
  }

  // Takes session parameters (all strings) as input,
  // updates class variables, saves session to localStorage
  // and updates the state so the client can proceed to
  // ask the user for stream permissions.
  setSession (username, password, admin, jwt) {
    this.Username = username
    this.Password = password
    this.Admin = admin
    this.JWT = jwt
    this.setState({ ...this.state, SignedIn: true })

    // Create a session object
    const session = {
      Username: username,
      Meeting: this.state.Meeting,
      Password: password,
      Admin: admin,
      JWT: jwt
    }

    const message = base64.encode(JSON.stringify(session))

    // Store session information to local storage
    // so we can automatically sign-in when the page
    // refreshes.
    localStorage.setItem('Session', message)
  }

  // Takes a mediaStream object as input and updates the
  // state. setFeed is passed as a prop to VideoGrid
  // (which handles establishing a stream/feed).
  setFeed (stream) {
    this.setState({ ...this.state, Feed: stream })
  }

  // Toggles the state of the user's self-stream permissions
  // (camera and microphone).
  togglePermission (perm) {
    if (perm === 'video') this.setState({ ...this.state, PVideo: !this.state.PVideo })
    if (perm === 'audio') this.setState({ ...this.state, PAudio: !this.state.PAudio })
  }

  // Copies meeting details into the user's clipboard,
  // and displays a success alert.
  shareCall () {
    // Get the current site URL
    const url = window.location.href

    // Invite/sharing details to write to clipboard.
    const shareText = (
      `${this.Username} is inviting you to a meeting at ${url} \n\n` +
      `the meeting password is: ${this.Password}`
    )

    // Write share message to clipboard, and then update state so we
    // show the copy success message.
    navigator.clipboard.writeText(shareText).then(res => {
      this.showAlert('Invite link copied to clipboard!')
    })
  }

  // Ends the call by reloading the page. This causes the
  // socket connection to terminate, at which point the
  // server automatically tells all peers that the client
  // has disconnected.
  endCall () {
    window.location.reload()
  }

  // Toggles the drawer's state (on/off), and hence opens
  // and closes the messageView.
  toggleDrawer () {
    this.drawerWidth = (this.drawerWidth === '0px') ? '260px' : '0px'
    this.setState({ ...this.state, chatDrawer: !this.state.chatDrawer })
  }

  componentDidMount () {
    this.establishPeerID()
  }

  render () {
    if (this.state.PeerID === null) {
      // Wait for PeerID to be established, client cant sign-in
      // without one, so show a loading screen in the meantime.

      return (
        <div className='video-page'>
          {Loading()}
        </div>
      )
    } else if (!this.state.SignedIn) {
      // Once a PeerID is established, the user needs to sign-in.
      // The SignIntoMeeting component will either restore a session
      // from localStorage or show a log-in prompt.

      return (
        <div className='video-page'>
          <SignIntoMeeting
            setSession={this.setSession.bind(this)}
            meeting={this.state.Meeting}
          />
        </div>
      )
    } else if (this.state.Feed === null) {
      // Once logged in, the client asks the user for permission to
      // access his webcam and microphone. We can't call peers without
      // a stream.

      return (
        <div className='video-page'>
          <GetFeedPrompt
            setFeed={this.setFeed.bind(this)}
            togglePermission={this.togglePermission.bind(this)}
          />
        </div>
      )
    } else {
      // The client is ready to enter the meeting and start
      // connecting to other peers.
      return (
        <div className='video-page'>
          <Drawer
            anchor='right'
            variant='persistent'
            open={this.state.chatDrawer}
          >
            <MessageView
              meeting={this.state.Meeting}
              socket={this.socket}
              closeDrawer={this.toggleDrawer.bind(this)}
            />
          </Drawer>
          <VideoGrid
            feed={this.state.Feed}
            socket={this.socket}
            peer={this.peer}
            pAudio={this.state.PAudio}
            pVideo={this.state.PVideo}
            JWT={this.JWT}
          />
          <AppBar
            color='inherit' class='nav-menu' style={{
              width: `calc(100% - ${this.drawerWidth})`
            }}
          >
            <Toolbar>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton size='large' color='inherit' onClick={() => this.togglePermission('video')}>
                <CamIcon
                  Active={this.state.PVideo}
                  htmlColor='white'
                />
              </IconButton>
              <IconButton size='large' color='inherit' onClick={() => this.togglePermission('audio')}>
                <MicIcon
                  Active={this.state.PAudio}
                  htmlColor='white'
                />
              </IconButton>
              <IconButton size='large' color='inherit' onClick={this.endCall}> 
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
  }
}

export default (props) => (
  <AlertWrapper>
    <Video {...props} params={useParams()} />
  </AlertWrapper>
)
