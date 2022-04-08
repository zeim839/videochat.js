import React, { createRef } from 'react'

class Stream extends React.Component {
  constructor (props) {
    super(props)

    this.stream = createRef(null)
    this.srcObj = props.srcObj
    this.pVideo = props.pVideo
    this.pAudio = props.pAudio
  }

  updateStreamPermissions () {
    // Ensure this is the client's stream we're modifying
    if (this.pVideo == null || this.pAudio == null) return

    // Turn the audio/video tracks on or off according to
    // the client's permissions
    this.stream.current.srcObject.getVideoTracks()[0].enabled = this.pVideo
    this.stream.current.srcObject.getAudioTracks()[0].enabled = this.pAudio
    this.stream.current.muted = true
  }

  componentDidMount () {
    // window.addEventListener("resize", this.setSize.bind(this))
    if (this.pVideo !== null || this.pAudio !== null) {
      this.stream.current.className = 'self-stream'
    } else {
      this.stream.current.style.width = '100%'
      this.stream.current.style.height = '100%'
    }

    // Set the source object
    this.stream.current.srcObject = this.srcObj

    // Start playing the stream
    this.stream.current.play()

    // If this is the client's own stream, then
    // then mute so the user's audio doesnt play
    // back.
    if (this.pVideo !== null || this.pAudio !== null) {
      this.stream.current.muted = true
    }

    // Update permissions
    this.updateStreamPermissions()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.pVideo !== this.props.pVideo ||
        prevProps.pAudio !== this.props.pAudio) {
      this.pAudio = this.props.pAudio
      this.pVideo = this.props.pVideo
      this.updateStreamPermissions()
    }
  }

  render () {
    return (
      <video ref={this.stream} />
    )
  }
}

export default Stream
