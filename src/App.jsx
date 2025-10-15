import "./App.css";
import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import VideoSection from "./components/VideoSection";

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

    // Get list of connected users
    socket.on("connected-users", (clients) => {
      setConnectedUsers(clients);
    });

    // Start call when server signals
    socket.on("initiate-call", () => {
      startOffer();
    });

    socket.on("offer", async (offer) => {
      if (!pcRef.current) pcRef.current = createPeerConnection();

      const pc = pcRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    socket.on("answer", async (answer) => {
      const pc = pcRef.current;
      if (pc) await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      const pc = pcRef.current;
      if (pc && candidate) await pc.addIceCandidate(candidate);
    });

    return () => {
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
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", event.candidate);
      }
    };

    return pc;
  };

  const handleStartCall = async (targetUserId) => {
    setStarted(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    // Emit to server: start call with this user
    socketRef.current.emit("start-call", targetUserId);
    console.log("📨 Start call request sent to:", targetUserId);
  };

  const startOffer = async () => {
    if (!pcRef.current) pcRef.current = createPeerConnection();
    const pc = pcRef.current;

    const stream =
      localVideoRef.current.srcObject ||
      (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));

    if (!localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", offer);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-500 text-white p-6 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md"></div>

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 animate-pulse">
          ⚡ Simple WebRTC Call App
        </h1>
        <p className="text-gray-200 text-lg">Connect. Stream. Communicate in real time.</p>
      </div>

      {/* Connected users list */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-6 w-full max-w-lg mb-8 border border-white/20">
        <h3 className="text-lg font-semibold mb-3 text-center">Connected Users</h3>
        <div className="space-y-2 text-sm">
          {connectedUsers.length > 0 ? (
            connectedUsers.map((user) => (
              <div
                key={user}
                className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30 transition"
              >
                <span>👤 {user}</span>
                {/* Optional: call directly from list */}
                <button
                  onClick={() => handleStartCall(user)}
                  className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold transition"
                >
                  Start Call
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-200">No users connected</p>
          )}
        </div>
      </div>

      {/* Video Section */}
      <VideoSection
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        started={started}
        onStartCall={() => {
          if (connectedUsers.length > 0) handleStartCall(connectedUsers[0]);
        }}
      />
    </div>
  );
}

export default App;