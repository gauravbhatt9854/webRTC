import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

export function useWebRTC(email) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const connectedUsersRef = useRef([]);
  const iceQueueRef = useRef([]);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [started, setStarted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    if (!email) return;

    const socket = io(import.meta.env.VITE_SIGNALING_SERVER);
    socketRef.current = socket;

    socket.on("connect", () => {
      setMySocketId(socket.id);
      socket.emit("register-email", email);
    });

    socket.on("connected-users", (users) => {
      setConnectedUsers(users);
      connectedUsersRef.current = users;
    });

    socket.on("offer", ({ callerId, offer }) => {
      const caller = connectedUsersRef.current.find(u => u.socketId === callerId);
      setIncomingCall({ socketId: callerId, email: caller?.email || "Unknown", offer });
    });

    socket.on("answer", async ({ answer }) => {
      if (pcRef.current && answer) await pcRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(candidate);
      } else {
        iceQueueRef.current.push(candidate);
      }
    });

    socket.on("disconnect-call", endCall);

    return () => {
      socket.disconnect();
      pcRef.current?.close();
    };
  }, [email]);

  const createPeerConnection = (targetId) => {
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
      if (event.candidate && targetId) {
        socketRef.current.emit("ice-candidate", { candidate: event.candidate, targetUserId: targetId });
      }
    };

    return pc;
  };

  const startCall = async (targetId) => {
    if (!targetId) return;
    setTargetUser(targetId);

    pcRef.current?.close();
    pcRef.current = createPeerConnection(targetId);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socketRef.current.emit("initiate-call", { targetId, offer });
    setStarted(true);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const { socketId, offer } = incomingCall;
    setTargetUser(socketId);

    pcRef.current?.close();
    pcRef.current = createPeerConnection(socketId);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    await pcRef.current.setRemoteDescription(offer);

    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    socketRef.current.emit("answer", { answer, targetUserId: socketId });

    // Process queued ICE candidates
    while (iceQueueRef.current.length) {
      const candidate = iceQueueRef.current.shift();
      await pcRef.current.addIceCandidate(candidate);
    }

    setIncomingCall(null);
    setStarted(true);
  };

  const declineCall = () => {
    if (incomingCall?.socketId) {
      socketRef.current.emit("decline-call", { targetUserId: incomingCall.socketId });
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    setTargetUser(null);
    setStarted(false);
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
  };

  return {
    localVideoRef,
    remoteVideoRef,
    connectedUsers,
    started,
    incomingCall,
    mySocketId,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
