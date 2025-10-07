import './App.css'
import { useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'

function App() {
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const pcRef = useRef(null)
  const socketRef = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    // Connect to signaling server
    socketRef.current = io(import.meta.env.VITE_SIGNALING_SERVER)

    // Receive offer
    socketRef.current.on("offer", async (offer) => {
      if (!pcRef.current) pcRef.current = createPeerConnection()

      const pc = pcRef.current

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localVideoRef.current.srcObject = stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socketRef.current.emit("answer", answer)
    })

    // Receive answer
    socketRef.current.on("answer", async (answer) => {
      const pc = pcRef.current
      if (pc) await pc.setRemoteDescription(answer)
    })

    // Receive ICE candidate
    socketRef.current.on("ice-candidate", async (candidate) => {
      const pc = pcRef.current
      if (pc && candidate) await pc.addIceCandidate(candidate)
    })

    return () => socketRef.current.disconnect()
  }, [])

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_PASSWORD
        }
      ]
    })

    // Set remote stream
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0]
    }

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit("ice-candidate", event.candidate)
    }

    return pc
  }

  const startCall = async () => {
    setStarted(true)
    if (!pcRef.current) pcRef.current = createPeerConnection()
    const pc = pcRef.current

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideoRef.current.srcObject = stream
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    // Create offer only if we are the first user starting the call
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketRef.current.emit("offer", offer)
  }

  return (
    <div style={{ display: "flex", gap: "10px", flexDirection: "column", alignItems: "center", marginTop: "20px" }}>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted width={300} />
        <video ref={remoteVideoRef} autoPlay playsInline width={300} />
      </div>
      {!started && <button onClick={startCall}>Start Call</button>}
    </div>
  )
}

export default App
