import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'

import { default as Icon } from '@mui/icons-material/Chat'

function ChatIcon ({ socket, onClick }) {
  const [notifs, setNotifs] = useState(0)

  socket.on('RECEIVED-MESSAGE', () => {
    setNotifs(notifs + 1)
  })

  const handleClick = () => {
    setNotifs(0)
    onClick()
  }

  return (
    <IconButton size='large' color='inherit' onClick={handleClick}>
      <Badge badgeContent={notifs} color='primary'>
        <Icon htmlColor='white' />
      </Badge>
    </IconButton>
  )
}

export default ChatIcon
