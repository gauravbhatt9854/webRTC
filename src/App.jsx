import "./App.css";
import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SIGNALING_SERVER);
    socketRef.current = socket;

    console.log("🟢 Connected to signaling server");

    // Update connected users
    socket.on("connected-users", (clients) => {
      console.log("👥 Connected users:", clients);
      setConnectedUsers(clients);
    });

    // Start call offer (from second client)
    socket.on("initiate-call", () => {
      console.log("📞 Initiate call triggered");
      startOffer();
    });

    // Handle offer
    socket.on("offer", async (offer) => {
      console.log("📨 Offer received");
      if (!pcRef.current) pcRef.current = createPeerConnection();

      const pc = pcRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    // Handle answer
    socket.on("answer", async (answer) => {
      console.log("📩 Answer received");
      const pc = pcRef.current;
      if (pc) await pc.setRemoteDescription(answer);
    });

    // Handle ICE candidate
    socket.on("ice-candidate", async (candidate) => {
      console.log("❄️ ICE candidate received");
      const pc = pcRef.current;
      if (pc && candidate) await pc.addIceCandidate(candidate);
    });

    // Clean up on unmount
    return () => {
      console.log("🔴 Disconnecting...");
      socket.disconnect();
      pcRef.current?.close();
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_PASSWORD,
        },
      ],
    });

    pc.ontrack = (event) => {
      console.log("🎥 Remote stream received");
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 Sending ICE candidate");
        socketRef.current.emit("ice-candidate", event.candidate);
      }
    };

    return pc;
  };

  const startCall = async () => {
    console.log("🟢 Starting call...");
    setStarted(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    socketRef.current.emit("ready");
  };

  const startOffer = async () => {
    console.log("📞 Creating offer...");
    if (!pcRef.current) pcRef.current = createPeerConnection();
    const pc = pcRef.current;

    const stream =
      localVideoRef.current.srcObject ||
      (await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }));

    if (!localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", offer);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "20px",
      }}
    >
      <h2>⚡ Simple WebRTC Call App</h2>

      <div className="users">
        {connectedUsers.map((user, index) => (
          <h4 key={user}>
            👤 User {index + 1}: <code>{user}</code>
          </h4>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", margin: "20px" }}>
        <video ref={localVideoRef} autoPlay playsInline muted width={300} />
        <video ref={remoteVideoRef} autoPlay playsInline width={300} />
      </div>

      {!started && (
        <button onClick={startCall} style={{ padding: "10px 20px" }}>
          Start Call
        </button>
      )}
    </div>
  );
}

export default App;
