import './App.css'
import { useUrl } from './components/customHooks/useUrl'
import { useState, useRef } from 'react';

function App() {
  const { data, loading } = useUrl("https://dummyjson.com/products");


  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef(null);
  const [started, setStarted] = useState(false);

  const startCall = async () => {
    setStarted(true);

    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: turnUrl,
          username: turnUsername,
          credential: turnPassword
        }
      ]
    });

    pcRef.current = pc;

    // Remote stream
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // For demo: loopback (remote peer)
    const remotePc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:80.225.197.245:3478",
          username: "gaurav",
          credential: "gauravbhatt"
        }
      ]
    });

    remotePc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) remotePc.addIceCandidate(event.candidate);
    };

    remotePc.onicecandidate = (event) => {
      if (event.candidate) pc.addIceCandidate(event.candidate);
    };

    stream.getTracks().forEach((track) => remotePc.addTrack(track, stream));

    await remotePc.setRemoteDescription(pc.localDescription);
    const answer = await remotePc.createAnswer();
    await remotePc.setLocalDescription(answer);
    await pc.setRemoteDescription(remotePc.localDescription);
  };

  return (
    <>
      <h1>Hello JI</h1>
      {loading && <h1> Component is loading</h1>}
      {!loading && <h2>Data Loaded</h2>}


      <div style={{ display: "flex", gap: "10px" }}>
        <video ref={localVideoRef} autoPlay playsInline muted width={300} />
        <video ref={remoteVideoRef} autoPlay playsInline width={300} />
        {!started && <button onClick={startCall}>Start Call</button>}
      </div>


    </>
  )
}

export default App
