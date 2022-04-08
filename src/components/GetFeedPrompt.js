import React from 'react'

import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Loading from './Loading'
import AlertWrapper from './AlertWrapper'

class GetFeedPrompt extends React.Component {
  constructor (props) {
    super(props)
    this.setFeed = props.setFeed
    this.togglePermission = props.togglePermission
    this.showAlert = props.showAlert
    this.state = {loading: false}
  }

  redirect() {
    setTimeout(() => {
      window.location.replace('/')
    }, 4000)
  }

  establishFeed () {
    // Attempts to establish an video/audio feed from the user's device
    // We take both video/audio to be true (at first) so we can toggle
    // them on/off without having to rerun getUserMedia.
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.setFeed(stream)
      }).catch(error => {
        this.showAlert('Failed to initialise stream. Redirecting...')
        //this.redirect()
      })
  }

  onSubmit (e) {
    e.preventDefault()
    this.setState({loading: true}, () => this.establishFeed())
  }

  toggleAudio () {
    this.togglePermission('audio')
  }

  toggleVideo () {
    this.togglePermission('video')
  }

  render () {
    if (this.state.loading) {
      return Loading()
    }

    return (
      <div className='sign-into-meeting'>
        <form id='sign-into-meeting--form' onSubmit={this.onSubmit.bind(this)}>
          <Typography
            variant='h2'
            component='h2'
          > Permissions
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Microphone'
            onChange={this.toggleAudio.bind(this)}
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Camera'
            onChange={this.toggleVideo.bind(this)}
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
}

export default (props) => (
  <AlertWrapper>
    <GetFeedPrompt {...props} />
  </AlertWrapper>
)
