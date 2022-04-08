/* global localStorage */
import React from 'react'

import Message from './Message'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import SendIcon from '@mui/icons-material/Send'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

class MessageView extends React.Component {
  constructor(props) {
    super(props)
    this.socket = props.socket
    this.meeting = props.meeting
    this.closeDrawer = props.closeDrawer
    this.state = {
      winHeight: window.innerHeight,
      winWidth: window.innerWidth,
      messages: [],
      input: ""
    }

    // Socket RECEIVED-MESSAGE event listener, appends new
    // remote messages to the messages state.
    this.socket.on('RECEIVED-MESSAGE', msg => {
      // Message isn't empty space
      if (msg.Data.match(/^ *$/) !== null) return

      this.setState({...this.state, messages: [
        ...this.state.messages, {
        data: msg.Data,
        from: msg.Username,
        type: 'other'
      }]})
    })
  }

  // Updates state to reflect changes to window height/width
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
    
    // Try to load any messages from localStorage into state
    // (if applicable)
    try {
      const msgData = JSON.parse(localStorage.getItem('Messages'))

      // Delete if its old data from another meeting
      if (msgData.meeting !== this.meeting) {
        localStorage.removeItem('Messages')
        return
      }

      this.setState({...this.state, messages: msgData.messages})
    } catch (e) {}
  }

  // Scrolls all the way to the bottom of the message view
  // useful for when we want new messages to be immediately
  // visible to the client
  scrollDown() {
    document.getElementById('messages').scrollTop =
      document.getElementById('messages').scrollHeight + 250
  }

  // Writes the client's messages to localStorage so they
  // can be retrieved after refresh, etc.
  saveToStorage() {
    const store = JSON.stringify({
      meeting: this.meeting,
      messages: this.state.messages
    })

    localStorage.setItem('Messages', store)
  }

  componentDidUpdate(_, prevState) {
    // If client receives a new message, backup messages
    // to localStorage and scroll the message view to the
    // bottom.
    if (prevState.messages != this.state.messages) {
      this.saveToStorage()
      this.scrollDown()
    }
  }

  onSubmit(e) {
    e.preventDefault()

    // Message is not empty space
    if (this.state.input.match(/^ *$/) !== null) return

    // Appends new message to state and clears input
    this.setState({...this.state, input: "", messages: [
      ...this.state.messages, {
      data: this.state.input,
      from: null,
      type: 'self'
    }]})

    this.socket.emit('SENT-MESSAGE', {
      message: this.state.input
    })
  }

  renderMessages() {
    if (this.state.messages.length === 0) {
      return (
        <p style={{
          fontSize: '14px',
          fontFamily: 'arial',
          fontWeight: '300',
          position: 'relative',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
        >No Messages Yet!
        </p>
      )
    }

    return this.state.messages.map((msg, i) => {
      return (
        <Message
          key={i}
          data={msg.data}
          from={msg.from}
          type={msg.type}
        />
      )
    })
  }

  drawerWidth() {
    if (this.state.winWidth > 569) return { width: '260px' }
    else return { width: this.state.winWidth.toString() + 'px' }
  }

  showReturnButton() {
    if (this.state.winWidth > 569) return null
    return (
      <IconButton
        className='max-drawer-return' onClick={() => {
          this.closeDrawer()
        }}
      >
        <ArrowBackIcon />
      </IconButton>
    )
  }

  render() {
    return (
      <div className='message-view' style={this.drawerWidth()}>
        {this.showReturnButton()}
        <div
          id='messages' style={{
            width: '100%',
            height: `${(0.85 * this.state.winHeight).toString()}px`,
            overflowY: 'auto'
          }}
        >{this.renderMessages()}
        </div>
        <form onSubmit={this.onSubmit.bind(this)}>
          <TextField
            label='Message' autoComplete='off' variant='standard' style={{ width: '100%' }}
            value={this.state.input}
            InputProps={{
              endAdornment: (
                <InputAdornment position='start'>
                  <IconButton
                    size='small' aria-controls='menu-appbar' aria-haspopup='true'
                    color='inherit' type='submit'
                  > <SendIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            onChange={(e) => this.setState({...this.state, input: e.target.value})}
          />
        </form>
      </div>
    )
  }
}

export default MessageView
