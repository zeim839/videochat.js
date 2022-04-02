import React, { useState } from 'react'
import Snackbar from '@mui/material/Snackbar'

import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'

function AlertWrapper (props) {
  const [alert, setAlert] = useState({
    alert: false,
    message: ''
  })

  const showAlert = msg => {
    setAlert({ alert: true, message: msg })
  }

  const alertClose = () => {
    setAlert({ alert: false, message: '' })
  }

  const alertAction = () => {
    return (
      <IconButton
        size='small'
        aria-label='close'
        color='inherit'
        onClick={alertClose.bind(this)}
      > <CloseIcon fontSize='small' />
      </IconButton>
    )
  }

  return (
    <>
      {React.cloneElement(props.children, {
        ...props,
        showAlert: showAlert
      })}
      <Snackbar
        open={alert.alert}
        autoHideDuration={6000}
        onClose={alertClose}
        message={alert.message}
        action={alertAction()}
      />
    </>
  )
}

export default AlertWrapper
