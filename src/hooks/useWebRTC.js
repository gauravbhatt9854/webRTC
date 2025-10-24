import { useState, useRef, useEffect } from "react";
import { setupSocket } from "./socketSetup";
import { createPeerConnection } from "./peerConnection";
import {
  getVideoStream,
  switchCamera,
  toggleVideo,
  toggleMic,
} from "./mediaUtils";
import {
  startCall,
  acceptCall,
  declineCall,
  endCall,
} from "./callHandlers";

export function useWebRTC(email) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const connectedUsersRef = useRef([]);
  const iceQueueRef = useRef([]);
  const currentVideoDeviceRef = useRef(null);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [started, setStarted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    if (!email) return;
    const cleanup = setupSocket({
      email,
      pcRef,
      socketRef,
      connectedUsersRef,
      setConnectedUsers,
      setMySocketId,
      setIncomingCall,
      endCall: () => endCall({ pcRef, localVideoRef, remoteVideoRef, setStarted }),
      iceQueueRef,
    });
    return cleanup;
  }, [email]);

  // Start local preview
  useEffect(() => {
    (async () => {
      try {
        const stream = await getVideoStream(null, "user", currentVideoDeviceRef);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
      }
    })();
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    connectedUsers,
    started,
    incomingCall,
    mySocketId,
    videoOn,
    micOn,
    startCall: (targetId) =>
      startCall({
        targetId,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setStarted,
      }),
    acceptCall: () =>
      acceptCall({
        incomingCall,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setIncomingCall,
        setStarted,
        iceQueueRef,
      }),
    declineCall: () => declineCall({ incomingCall, socketRef, setIncomingCall }),
    endCall: () =>
      endCall({ pcRef, localVideoRef, remoteVideoRef, setStarted }),
    switchCamera: () => switchCamera({ pcRef, localVideoRef }),
    toggleVideo: () => toggleVideo({ localVideoRef, setVideoOn }),
    toggleMic: () => toggleMic({ localVideoRef, setMicOn }),
  };
}
