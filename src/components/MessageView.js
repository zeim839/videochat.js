/* global localStorage */
import { useState, useEffect } from 'react'

import Message from './Message'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import SendIcon from '@mui/icons-material/Send'
import IconButton from '@mui/material/IconButton'

function MessageView ({ socket, windowHeight, meeting, ...props }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(null)

  // Scrolls all the way to the bottom of the message view
  // useful for when we want new messages to be immediately
  // visible to the client
  const scrollDown = () => {
    document.getElementById('messages').scrollTop =
        document.getElementById('messages').scrollHeight + 250
  }

  // Writes the client's messages to localStorage so they
  // can be retrieved after refresh, etc.
  const saveToStorage = () => {
    const store = JSON.stringify({
      meeting: meeting,
      messages: messages
    })

    localStorage.setItem('Messages', store)
  }

  // Try to load any messages from localStorage into state
  // Runs only once - when component is mounted
  useEffect(() => {
    try {
      const msgData = JSON.parse(localStorage.getItem('Messages'))

      // Delete if its old data from another meeting
      if (msgData.meeting !== meeting) {
        localStorage.removeItem('Messages')
        return
      }

      setMessages(msgData.messages)
    } catch (e) {}
  }, [])

  // Saves meeting messages to localStorage so they can be
  // retrieved in case of a refresh, etc.
  // Runs any time the messages state is updated.
  useEffect(() => {
    saveToStorage()
    scrollDown()
  }, [messages])

  // Socket RECEIVED-MESSAGE event listener, appends new
  // remote messages to the messages state.
  socket.on('RECEIVED-MESSAGE', msg => {
    if (msg.Data.match(/^ *$/) !== null) return

    setMessages([...messages, {
      data: msg.Data,
      from: msg.Username,
      type: 'other'
    }])
  })

  // Runs when the client submits the new message form,
  // broadcasts his message to the server and appends
  // it to the message state.
  const onSubmit = (e) => {
    e.preventDefault()

    if (input.match(/^ *$/) !== null) return

    setMessages([...messages, {
      data: input,
      from: null,
      type: 'self'
    }])

    socket.emit('SENT-MESSAGE', {
      message: input
    })

    // Clears the input text field
    setInput('')
  }

  const renderMessages = () => {
    if (messages.length === 0) {
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

    return messages.map((msg, i) => {
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

  return (
    <div className='message-view'>
      <div
        id='messages' style={{
          width: '100%',
          height: `${(0.85 * windowHeight).toString()}px`,
          overflowY: 'auto'
        }}
      >{renderMessages()}
      </div>
      <form onSubmit={onSubmit.bind(this)}>
        <TextField
          label='Message' autoComplete='off' variant='standard' style={{ width: '100%' }}
          value={input}
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
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  )
}

export default MessageView
