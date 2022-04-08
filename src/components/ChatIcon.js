import React from 'react'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'

import { default as Icon } from '@mui/icons-material/Chat' // eslint-disable-line

class ChatIcon extends React.Component {
  constructor (props) {
    super(props)
    this.state = { notifs: 0 }
    this.socket = props.socket
    this.onClick = props.onClick

    this.socket.on('RECEIVED-MESSAGE', () => {
      this.setState({ notifs: this.state.notifs + 1 })
    })
  }

  handleClick () {
    this.setState({ notifs: 0 })
    this.onClick()
  }

  render () {
    return (
      <IconButton size='large' color='inherit' onClick={this.handleClick.bind(this)}>
        <Badge badgeContent={this.state.notifs} color='primary'>
          <Icon htmlColor='white' />
        </Badge>
      </IconButton>
    )
  }
}

export default ChatIcon
