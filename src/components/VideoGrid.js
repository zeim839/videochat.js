import { useState, useEffect, useRef } from 'react'
import Stream from './Stream'

function VideoGrid ({ selfStream, socket, peer, micPerm, camPerm, showAlert }) {
  const [streams, updateStreams] = useState([])
  const streamRef = useRef(streams)
  const height = window.innerHeight
  const width = window.innerWidth

  // Listens for call events and appends their stream to the state.
  const handleStream = (call) => {
    call.on('stream', remoteStream => {
      updateStreams([{
        peerID: call.peer,
        stream: remoteStream
      }, ...streams])
    })
  }

  // Searches for the disconnected peer by his peerID in state, and
  // then removes any of his streams from state.
  const handleDisconnect = (msg, streams) => {
    const index = streams.findIndex(stream => stream.peerID === msg.PeerID)
    // If found
    if (index > -1) {
      // Deep copy the streams array
      const newStreams = [...streams]

      // Remove the bad stream and update state
      newStreams.splice(index, 1)
      updateStreams(newStreams)

      // Alert user
      showAlert('Peer disconnected')
    }
  }

  useEffect(() => { streamRef.current = streams })

  useEffect(() => {
    // The VideoGrid component only loads once the user has signed in,
    // set up his self stream and initialised his peerID. So at this point,
    // we can safely ask for other users to start calling us.
    socket.emit('CALL-REQUEST', peer.id)

    // Disconnection event.
    socket.on('PEER-DISCONNECTED', (msg) => {
      handleDisconnect(msg, streamRef.current)
    })

    // Video calls are currently limited to only one other
    // peer
    socket.on('CALL-REQUEST', peerID => {
      if (streams.length > 1) { return }
      const call = peer.call(peerID, selfStream)
      handleStream(call)
    })

    peer.on('call', call => {
      if (streams.length > 1) { return }
      call.answer(selfStream)
      handleStream(call)
    })
  }, [])

  return (
    <div className='video-grid'>
      {
        streams.map(streamObj => {
          const remoteStream = streamObj.stream
          return (
            <Stream
              key={streamObj.peerID}
              width={width}
              height={height}
              srcObj={remoteStream}
            />
          )
        })
      }
      <Stream
        width={250}
        height={150}
        srcObj={selfStream}
        cam={camPerm}
        mic={micPerm}
      />
    </div>
  )
}

export default VideoGrid
