import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

export function useWebRTC(email) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [started, setStarted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  useEffect(() => {
    if (!email) return;

    const socket = io(import.meta.env.VITE_SIGNALING_SERVER);
    socketRef.current = socket;

    socket.on("connect", () => {
      setMySocketId(socket.id);
      socket.emit("register-email", email);
    });

    socket.on("connected-users", (clients) => setConnectedUsers(clients));

    socket.on("initiate-call", (callerId) => setIncomingCall(callerId));

    socket.on("offer", async ({ offer, callerId }) => {
      setTargetUser(callerId);
      if (!pcRef.current) pcRef.current = createPeerConnection(callerId);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, targetUserId: callerId });
      setStarted(true);
      setIncomingCall(null);
    });

    socket.on("answer", async ({ answer }) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (pcRef.current && candidate) await pcRef.current.addIceCandidate(candidate);
    });

    socket.on("cut-call", () => endCall());

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

    pc.ontrack = (event) => (remoteVideoRef.current.srcObject = event.streams[0]);

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId) {
        socketRef.current.emit("ice-candidate", { candidate: event.candidate, targetUserId });
      }
    };

    return pc;
  };

  const startCall = async (targetUserId) => {
    setTargetUser(targetUserId);
    setStarted(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    socketRef.current.emit("start-call", targetUserId);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    startOffer(incomingCall);
  };

  const declineCall = () => setIncomingCall(null);

  const startOffer = async (targetUserId = targetUser) => {
    if (!pcRef.current) pcRef.current = createPeerConnection(targetUserId);
    const pc = pcRef.current;

    const stream =
      localVideoRef.current.srcObject ||
      (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));

    if (!localVideoRef.current.srcObject) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit("offer", { offer, targetUserId });
    setStarted(true);
    setIncomingCall(null);
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStarted(false);
    setTargetUser(null);

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      remoteVideoRef.current.srcObject = null;
    }

    if (socketRef.current && targetUser) {
      socketRef.current.emit("cut-call", { targetUserId: targetUser });
    }
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
