import { useState } from 'react'

import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'

import AccountCircle from '@mui/icons-material/AccountCircle'
import InputAdornment from '@mui/material/InputAdornment'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PasswordIcon from '@mui/icons-material/Password'

function SignIntoMeeting (props) {
  const [session, setSession] = useState({
    username: null,
    password: null,
    hint: false
  })

  const newSession = props.newSession
  const showAlert = props.showAlert

  // Validates whatever values are in the username
  // password fields after the client submits. Shows
  // an error prompt if the inputs are invalid.
  const validate = () => {
    // Ensure fields are non-empty
    if (session.username.match(/^\s*$/) === '') {
      showAlert('Username cannot be empty')
      return false
    }

    if (session.password.match(/^\s*$/) === '') {
      showAlert('Password cannot be empty')
      return false
    }

    // Enfore minimum 4 character password length
    if (session.password.length < 4) {
      showAlert('Password must be at least 4 characters')
      return false
    }

    // @TODO: Enforce no special characters

    return true
  }

  // Handles submitting the username/password form
  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    newSession(session.username, session.password)
  }

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

  return (
    <div className='sign-into-meeting'>
      <form onSubmit={onSubmit} id='sign-into-meeting--form'>
        <Typography
          variant='h2'
          component='h2'
        > Enter Meeting
          <IconButton
            size='large'
            color='inherit'
            onClick={() => {
              setSession({ ...session, hint: true })
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
          onChange={(e) => setSession({
            ...session,
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
          margin='normal'
          required fullWidth
          autoComplete='off'
          label='Meeting Password'
          type='password'
          variant='outlined'
          onChange={(e) => setSession({
            ...session,
            password: e.target.value
          })}
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
        <Hint open={session.hint} />
      </form>
    </div>
  )
}

export default SignIntoMeeting
