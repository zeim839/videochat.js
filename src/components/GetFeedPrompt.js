import { useState } from 'react'

import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Loading from './Loading'

function GetFeedPrompt ({ establishFeed, togglePermission, ...props }) {
  const [loading, setLoading] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    establishFeed()
  }

  const toggleMic = () => {
    togglePermission('mic')
  }

  const toggleCam = () => {
    togglePermission('cam')
  }

  if (loading) {
    return Loading()
  }

  return (
    <div className='sign-into-meeting'>
      <form id='sign-into-meeting--form' onSubmit={onSubmit}>
        <Typography
          variant='h2'
          component='h2'
        > Permissions
        </Typography>
        <FormControlLabel
          control={<Switch defaultChecked />}
          label='Microphone'
          onChange={toggleMic}
        />
        <FormControlLabel
          control={<Switch defaultChecked />}
          label='Camera'
          onChange={toggleCam}
        />
        <Button
          type='submit'
          fullWidth
          variant='contained'
          sx={{ mt: 3, mb: 2 }}
        > Join
        </Button>
        <Divider />
        <Typography
          style={{ marginTop: '10px' }}
          variant='subtitle2'
        > Your browser will ask for both camera and audio permission.
          However, only your selected permissions will be streamed.
        </Typography>
      </form>
    </div>
  )
}

export default GetFeedPrompt
