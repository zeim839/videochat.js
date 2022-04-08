import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import { default as MicOnIcon } from '@mui/icons-material/Mic' // eslint-disable-line
import MicOffIcon from '@mui/icons-material/MicOff'

function CamIcon ({ Active, ...props }) {
  return (Active) ? <VideocamIcon {...props} /> : <VideocamOffIcon {...props} />
}

function MicIcon ({ Active, ...props }) {
  return (Active) ? <MicOnIcon {...props} /> : <MicOffIcon {...props} />
}

export { CamIcon, MicIcon }
