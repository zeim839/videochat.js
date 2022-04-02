import Typography from '@mui/material/Typography'

function Message ({ data, from, type, ...props }) {
  // Sanitise HTML tags
  data = data.replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace('"', '&quot;')
    .replace("'", '&apos;')

  // Set the style based on who sent the message
  const className = (type === 'self')
    ? 'message-self'
    : 'message-other'

  // Dont show sender username if sender is self
  // @TODO: Dont show senderLbl when 'from' equals our own username
  const senderLbl = (type !== 'self')
    ? (<h4> {from} </h4>)
    : ('')

  return (
    <div>
      {senderLbl}
      <div className={className}>
        <Typography
          color='inherit'
          component='div'
          style={{
            fontSize: '15px',
            wordWrap: 'break-word'
          }}
        > {data}
        </Typography>
      </div>
    </div>
  )
}

export default Message
