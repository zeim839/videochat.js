import Typography from '@mui/material/Typography'
import React from 'react'

class Message extends React.Component {
  constructor(props) {
    super(props)

    // Sender username
    this.from = props.from

    // A message sent from 'self' 
    // or 'other'
    this.type = props.type

    // Sanitise HTML tags
    this.data = props.data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace('"', '&quot;')
      .replace("'", '&apos;')
    
    // Set the style based on who sent the message
    this.className = (this.type === 'self')
      ? 'message-self'
      : 'message-other'
    
    // Decide whether to display the sender's
    // username above the message (only for 
    // messages sent from a remote client)
    this.senderLbl = (this.type !== 'self')
      ? (<h4> {this.from} </h4>)
      : ('')
  }

  render () {
    return (
      <div>
        {this.senderLbl}
        <div className={this.className}>
          <Typography
            color='inherit'
            component='div'
            style={{
              fontSize: '15px',
              wordWrap: 'break-word'
            }}
          > {this.data}
          </Typography>
        </div>
      </div>
    )
  }
}

export default Message
