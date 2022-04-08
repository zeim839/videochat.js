import React from 'react'
import Stream from './Stream'
import AlertWrapper from './AlertWrapper'

class VideoGrid extends React.Component {
  constructor(props) {
    super(props)
    this.feed = props.feed
    this.socket = props.socket
    this.peer = props.peer
    this.showAlert = props.showAlert
    this.JWT = props.JWT

    this.peers = {}
    
    this.state = {
      winHeight: window.innerHeight,
      winWidth: window.innerWidth,
      streams: [],
      pAudio: props.pAudio,
      pVideo: props.pVideo
    }

    this.waitToEnter().then(() => {
      // The VideoGrid component only loads once the user has signed in,
      // set up his self stream and initialised his peerID. So at this point,
      // we can safely ask for other users to start calling us.
      this.socket.emit('CALL-REQUEST', this.peer.id)

      // Disconnection event.
      this.socket.on('PEER-DISCONNECTED', (msg) => {
        this.handleDisconnect(msg)
      })

      // Video calls are currently limited to only one other
      // peer
      this.socket.on('CALL-REQUEST', peerID => {
        if (peerID == this.peer.id) return
        if (this.state.streams.length > 1) return
        const call = this.peer.call(peerID, this.feed)
        this.handleStream(call)
      })

      this.peer.on('call', call => {
        if (this.state.streams.length > 1) { return }
        call.answer(this.feed)
        this.handleStream(call)
      })
    })
  }

  waitToEnter() {
    return new Promise((resolve, reject) => {
      this.socket.on('ENTER-SUCCESS', resolve)
      this.socket.emit('ENTER-MEETING', {
        JWT: this.JWT,
        PeerID: this.peer.id
      })
    })
  }

  handleStream(call) {
    call.on('stream', remoteStream => {
      if (!this.peers[call.peer]) {
        this.setState({
          ...this.state, 
          streams: [
            {peerID: call.peer, stream: remoteStream}, 
            ...this.state.streams
          ]
        })
        this.peers[call.peer] = true
      }
    })
  }

  handleDisconnect(msg) {
    const index = this.state.streams.findIndex(stream => stream.peerID === msg.PeerID)
    // If found
    if (index > -1) {
      // Deep copy the streams array
      const newStreams = [...this.state.streams]

      // Remove the bad stream and update state
      newStreams.splice(index, 1)
      this.setState({...this.state, streams: newStreams})

      // Alert user
      this.showAlert('Peer disconnected')
    }
  }

  resize() {
    if (window.innerHeight != this.state.winHeight) {
      this.setState({...this.state, winHeight: window.innerHeight})
    }

    if (window.innerWidth != this.state.winWidth) {
      this.setState({...this.state, winWidth: window.innerWidth})
    }
  }

  componentDidMount() {
    window.addEventListener("resize", this.resize.bind(this))
  }

  componentDidUpdate(oldProps) {
    if (oldProps.pVideo != this.props.pVideo || 
        oldProps.pAudio != this.props.pAudio) {
      
      this.setState({
        ...this.state, 
        pVideo: this.props.pVideo, 
        pAudio: this.props.pAudio
      })
    }
  }

  render() {
    return (
      <div className='video-grid'>
        {
          this.state.streams.map(streamObj => {
            return (
              <Stream
                key={streamObj.peerID}
                srcObj={streamObj.stream}
                pVideo={null}
                pAudio={null}
              />
            )
          })
        }
        <Stream
          srcObj={this.feed}
          pVideo={this.state.pVideo}
          pAudio={this.state.pAudio}
        />
      </div>
    )
  }
}

export default (props) => (
  <AlertWrapper>
    <VideoGrid {...props} />
  </AlertWrapper>
)