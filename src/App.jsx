import "./App.css";
import { useState, useRef, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import VideoSection from "./components/VideoSection";
import ConnectedUsers from "./components/ConnectedUsers";
import { UserContext } from "./context/UserContext";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const { email } = useContext(UserContext);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [started, setStarted] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  useEffect(() => {
    if (!email) return; // don't connect if email not set

    const socket = io(import.meta.env.VITE_SIGNALING_SERVER);
    socketRef.current = socket;

    // Send email to backend on connection
    socket.emit("register-email", email);

    socket.on("connect", () => {
      setMySocketId(socket.id);
      console.log("🟢 Connected with ID:", socket.id);
    });

    // Update connected users list
    socket.on("connected-users", (clients) => {
      setConnectedUsers(clients);
    });

    // Incoming call
    socket.on("initiate-call", (callerId) => {
      setTargetUser(callerId);
      startOffer(callerId);
    });

    socket.on("offer", async ({ offer, callerId }) => {
      setTargetUser(callerId);
      if (!pcRef.current) pcRef.current = createPeerConnection(callerId);

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
      socket.emit("answer", { answer, targetUserId: callerId });
    });

    socket.on("answer", async ({ answer }) => {
      const pc = pcRef.current;
      if (pc) await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate, from }) => {
      const pc = pcRef.current;
      if (pc && candidate) await pc.addIceCandidate(candidate);
    });

    socket.on("disconnect-call", () => {
      pcRef.current?.close();
      pcRef.current = null;
      setStarted(false);
      setTargetUser(null);
      console.log("🔴 Call disconnected due to email change");
    });

    return () => {
      socket.disconnect();
      pcRef.current?.close();
    };
  }, [email]);

  const createPeerConnection = (targetUserId) => {
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
      if (event.candidate && targetUserId) {
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          targetUserId,
        });
      }
    };

    return pc;
  };

  const handleStartCall = async (targetUserId) => {
    setTargetUser(targetUserId);
    setStarted(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;

    socketRef.current.emit("start-call", targetUserId);
  };

  const startOffer = async (targetUserId = targetUser) => {
    if (!pcRef.current) pcRef.current = createPeerConnection(targetUserId);
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
    socketRef.current.emit("offer", { offer, targetUserId });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-500 text-white p-6 overflow-hidden">
      <Navbar />
      <div className="relative z-10 text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 animate-pulse">
          ⚡ Simple WebRTC Call App
        </h1>
        <p className="text-gray-200 text-lg">
          Connect. Stream. Communicate in real time.
        </p>
      </div>

      {/* Connected Users */}
      <ConnectedUsers
        users={connectedUsers.filter((u) => u.socketId !== mySocketId)}
        onStartCall={handleStartCall}
      />

      {/* Video Section */}
      <VideoSection
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        started={started}
      />
    </div>
  );
}

export default App;
