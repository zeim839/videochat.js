import { createRef, useEffect } from 'react'

function Stream ({ srcObj, cam, mic, ...props }) {
  const streamRef = createRef(null)

  const setSize = () => {
    // Self camera
    if (cam !== undefined || mic !== undefined) {
      streamRef.current.style.width = '250px'
      streamRef.current.style.height = '150px'
      return
    }

    let width, height
    const parent = streamRef.current.parentNode

    if (parent.style.height >= parent.style.width) { height = '85%'; width = 'auto' } else { width = '85%'; height = 'auto' }

    streamRef.current.style.width = width
    streamRef.current.style.height = height
  }

  // We wrap the streamRef's operations into a useEffect
  // hook because we want to wait for the video element to
  // mount first (cant access streamRef.curent... otherwise)
  useEffect(() => {
    setSize()
    streamRef.current.srcObject = srcObj
    const track = streamRef.current.srcObject.getVideoTracks()[0]

    if (cam !== undefined) {
      // Enable/disable the video feed. Useful for when the client
      // toggles his permission settings.
      track.enabled = cam
      streamRef.current.muted = true
    }

    if (mic !== undefined) {
      // Enable/disable the microphone feed. Useful for when the
      // client toggles his permission settings.
      streamRef.current.srcObject.getAudioTracks()[0].enabled = mic
      streamRef.current.muted = true
    }

    // Start playing the stream
    streamRef.current.play()
  }, [])

  // Update camera/microphone permissions
  useEffect(() => {
    if (cam !== undefined) {
      streamRef.current.srcObject.getVideoTracks()[0].enabled = cam
    }

    if (mic !== undefined) {
      streamRef.current.srcObject.getAudioTracks()[0].enabled = mic
    }
  })

  // Adjust stream element size whenever our screen size changes
  useEffect(() => { setSize() }, [window.innerHeight, window.innerWidth])

  return (
    <video {...props} ref={streamRef} />
  )
}

export default Stream
