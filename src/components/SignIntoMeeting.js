import React from 'react'
import axios from 'axios'
import validator from 'validator'

import AlertWrapper from './AlertWrapper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import base64 from 'base-64'

import AccountCircle from '@mui/icons-material/AccountCircle'
import InputAdornment from '@mui/material/InputAdornment'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PasswordIcon from '@mui/icons-material/Password'

// The Hint component, when open, will show
// a small explanatory/instruction text below
// the sign-in form.
const Hint = ({ open }) => {
  if (open) {
    return (
      <>
        <Divider />
        <Typography
          style={{ marginTop: '10px' }}
          variant='subtitle2'
        > Hint: You've been invited to a meeting. Enter any username and the
          meeting password to join the call.
        </Typography>
      </>
    )
  }

  return null
}

class SignIntoMeeting extends React.Component {
  constructor (props) {
    super(props)
    this.setSession = props.setSession
    this.showAlert = props.showAlert
    this.meeting = props.meeting
    this.state = {
      Username: null,
      Password: null,
      Meeting: this.meeting,
      hint: false
    }
  }

  // Validates whatever values are in the username
  // password fields after the client submits. Shows
  // an error prompt if the inputs are invalid.
  validate () {
    let username = this.state.Username
    const password = this.state.Password

    // Username cannot be plain whitespace, must be
    // between 1, 20 chars
    username = validator.trim(username)
    if (!validator.isLength(username, { min: 1, max: 20 })) {
      this.showAlert('Username cannot be empty')
      return false
    }

    // Password must be between 4, 20 chars
    if (!validator.isLength(password, { min: 4, max: 20 })) {
      this.showAlert('Password must be at least 4 characters')
      return false
    }

    // Applies whitespace trim to username
    this.setState({ ...this.state, Username: username })
    return true
  }

  establishSession () {
    axios.post('/api/sign-in', {
      Username: this.state.Username,
      Password: this.state.Password,
      Meeting: this.state.Meeting
    })
      .then(res => {
        this.setSession(res.data.Username, this.state.Password,
          res.data.Admin, res.data.JWT)
      })
      .catch((e) => {
        this.showAlert(e.response.data.Error)
      })
  }

  onSubmit (e) {
    e.preventDefault()
    if (!this.validate()) return
    this.establishSession()
  }

  restoreFromStorage () {
    try {
      const storeObj = localStorage.getItem('Session')
      const decoded = base64.decode(storeObj)
      const session = JSON.parse(decoded)

      if (session.Meeting !== this.state.Meeting) {
        localStorage.removeItem('Session')
        return
      }

      this.setSession(session.Username, session.Password,
        session.Admin, session.JWT)
    } catch (e) { }
  }

  componentDidMount () {
    this.restoreFromStorage()
  }

  render () {
    return (
      <div className='sign-into-meeting'>
        <form onSubmit={this.onSubmit.bind(this)} id='sign-into-meeting--form'>
          <Typography
            variant='h2'
            component='h2'
          > Enter Meeting
            <IconButton
              size='large'
              color='inherit'
              onClick={() => {
                this.setState({ ...this.state, hint: true })
              }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Typography>
          <TextField
            margin='normal'
            required fullWidth
            label='Username'
            autoComplete='off'
            variant='outlined'
            onChange={(e) => {
              this.setState({ ...this.state, Username: e.target.value })
            }}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <AccountCircle />
                </InputAdornment>
              )
            }}
          />
          <TextField
            margin='normal'
            required fullWidth
            autoComplete='off'
            label='Meeting Password'
            type='password'
            variant='outlined'
            onChange={(e) => {
              this.setState({ ...this.state, Password: e.target.value })
            }}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <PasswordIcon />
                </InputAdornment>
              )
            }}
          />
          <Button
            type='submit'
            fullWidth
            variant='contained'
            className='join-meeting'
            sx={{ mt: 3, mb: 2 }}
          > Join
          </Button>
          <Hint open={this.state.hint} />
        </form>
      </div>
    )
  }
}

export default (props) => (
  <AlertWrapper>
    <SignIntoMeeting {...props} />
  </AlertWrapper>
)
