/* global localStorage */
import './css/home.css'
import React from 'react'
import AlertWrapper from './components/AlertWrapper'
import axios from 'axios'

import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import AccountCircle from '@mui/icons-material/AccountCircle'
import InputAdornment from '@mui/material/InputAdornment'
import PasswordIcon from '@mui/icons-material/Password'

class Home extends React.Component {
  constructor (props) {
    super(props)
    this.showAlert = props.showAlert
    this.state = {
      username: null,
      password: null
    }
  }

  // Validates the username and password fields
  // of the home page form. Returns true for valid
  // submissions, returns false and shows an error
  // prompt on failure.
  validate () {
    // Ensure fields are non-empty
    if (this.state.username.match(/^\s*$/) === '') {
      this.showAlert('Username cannot be empty')
      return false
    }

    if (this.state.password.match(/^\s*$/) === '') {
      this.showAlert('Password cannot be empty')
      return false
    }

    // Enfore minimum 4 character password length
    if (this.state.password.length < 4) {
      this.showAlert('Password must be at least 4 characters')
      return false
    }

    // @TODO: Enforce no special characters

    return true
  }

  // Creates a session object to load onto localStorage
  // and navigates to the meeting page. Runs after succesful
  // meeting creation.
  launchSession (res) {
    // Create a session object
    const session = {
      Username: res.data.Username,
      Meeting: res.data.Meeting,
      Password: this.state.password,
      Admin: res.data.Admin,
      JWT: res.data.JWT
    }

    // Store session information to local storage
    // so we can automatically enter meeting when
    // redirected.
    localStorage.setItem('Session', JSON.stringify(session))

    // Redirect user to meeting page
    window.location.replace('/meeting/' + session.Meeting)
  }

  // Submit event handler for the create meeting form.
  // Sends form data to the server and handles success/errors.
  async onSubmit (e) {
    // Do not refresh page, etc.
    e.preventDefault()

    // Validate inputs
    if (!this.validate()) return

    // Submit form
    await axios.post('/api/create-meeting', {
      Username: this.state.username,
      Password: this.state.password
    }).then(this.launchSession.bind(this))
      .catch(e => {
        this.showAlert('Server failed to respond. Please try again.')
      })
  }

  render () {
    return (
      <div className='home-page'>
        <form id='create-meeting' onSubmit={this.onSubmit.bind(this)}>
          <Typography
            variant='h2'
            component='h1'
            style={{ fontSize: '3rem' }}
          > Create Meeting
          </Typography>
          <TextField
            className='-input-username'
            margin='normal'
            required fullWidth
            autoComplete='off'
            label='Username'
            variant='outlined'
            onChange={(e) => this.setState({
              ...this.state,
              username: e.target.value
            })}
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
            className='-input-password'
            margin='normal'
            required fullWidth
            autoComplete='off'
            label='Meeting Password'
            variant='outlined'
            onChange={(e) => this.setState({
              ...this.state,
              password: e.target.value
            })}
            type='password'
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
            sx={{ mt: 3, mb: 2 }}
          > Create Meeting
          </Button>
        </form>
        <div id='banner' />
      </div>
    )
  }
}

export default (props) => (
  <AlertWrapper>
    <Home {...props} />
  </AlertWrapper>
)
