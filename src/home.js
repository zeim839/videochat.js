import './css/home.css'
import React from 'react'
import AlertWrapper from './components/AlertWrapper'
import axios from 'axios'
import base64 from 'base-64'
import validator from 'validator'

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
      Username: null,
      Password: null
    }
  }

  apiFail (e) {
    this.showAlert('Server Failed to respond. Please try again.')
  }

  // Validates the username and password fields
  // of the home page form. Returns true for valid
  // submissions, returns false and shows an error
  // prompt on failure.
  // Validates the username and password fields
  // of the home page form. Returns true for valid
  // submissions, returns false and shows an error
  // prompt on failure.
  validate () {
    let username = this.state.Username
    const password = this.state.Password

    // Password cannot be pure whitespace, must be
    // between 1 and 20 chars.
    username = validator.trim(username)
    if (!validator.isLength(username, { min: 1, max: 20 })) {
      this.showAlert('Username cannot be empty')
      return false
    }

    // Password must be between 4 and 20 chars
    if (!validator.isLength(password, { min: 4, max: 20 })) {
      this.showAlert('Password must be at least 4 characters')
      return false
    }

    this.setState({ ...this.state, Username: username })
    return true
  }

  // Creates a session object to load onto localStorage
  // and navigates to the meeting page. Runs after succesful
  // meeting creation.
  createSession (res) {
    // Ensure response returns required session fields
    // "Admin" is not required
    if (!res.data.Username || !res.data.Meeting || !res.data.JWT) {
      this.apiFail()
    }

    // Create a session object
    const session = {
      Username: res.data.Username,
      Meeting: res.data.Meeting,
      Password: this.state.Password,
      Admin: res.data.Admin,
      JWT: res.data.JWT
    }

    const message = base64.encode(JSON.stringify(session))

    // Store session information to local storage
    // so we can automatically enter meeting when
    // redirected.
    localStorage.setItem('Session', message)

    // Redirect user to meeting page
    window.location.replace('/meeting/' + session.Meeting)
  }

  submitForm (e) {
    // Stops the form from refreshing the site
    e.preventDefault()

    // Run input validation
    // Format errors/alerts are handled by validate
    if (!this.validate()) return

    // Submit the form
    axios.post('/api/create-meeting', this.state)
      .then(this.createSession.bind(this), this.apiFail.bind(this))
      .catch(this.apiFail.bind(this))
  }

  render () {
    return (
      <div className='home-page'>
        <form id='create-meeting' onSubmit={this.submitForm.bind(this)}>
          <Typography
            variant='h2'
            component='h1'
            style={{ fontSize: '3rem' }}
          > Create Meeting
          </Typography>
          <TextField
            margin='normal'
            required fullWidth
            autoComplete='off'
            label='Username'
            variant='outlined'
            onChange={(e) => this.setState({
              ...this.state,
              Username: e.target.value
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
            margin='normal'
            required fullWidth
            autoComplete='off'
            label='Meeting Password'
            variant='outlined'
            onChange={(e) => this.setState({
              ...this.state,
              Password: e.target.value
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
