import React from 'react'
import Snackbar from '@mui/material/Snackbar'

import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/material/IconButton'

class AlertWrapper extends React.Component {
  constructor (props) {
    super(props)
    this.props = props
    this.state = {
      alert: false,
      message: ''
    }
  }

  showAlert (msg) {
    this.setState({ alert: true, message: msg })
  }

  closeAlert () {
    this.setState({ alert: false, message: '' })
  }

  alertAction () {
    return (
      <IconButton
        size='small'
        aria-label='close'
        color='inherit'
        onClick={this.closeAlert.bind(this)}
      > <CloseIcon fontSize='small' />
      </IconButton>
    )
  }

  render () {
    return (
      <>
        {React.cloneElement(this.props.children, {
          ...this.props,
          showAlert: this.showAlert.bind(this)
        })}
        <Snackbar
          open={this.state.alert}
          autoHideDuration={6000}
          onClose={this.closeAlert.bind(this)}
          message={this.state.message}
          action={this.alertAction()}
        />
      </>
    )
  }
}
export default AlertWrapper
