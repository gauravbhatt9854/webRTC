import { useState, useRef, useEffect } from "react";
import { setupSocket } from "./socketSetup";
import {
  getVideoStream,
  switchCamera,
  toggleVideo,
  toggleMic,
} from "./mediaUtils";
import {
  startCall as startCallHandler,
  acceptCall as acceptCallHandler,
  declineCall as declineCallHandler,
  endCall as endCallHandler,
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

  // setup signaling socket
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
      endCall: () =>
        endCallHandler({
          pcRef,
          localVideoRef,
          remoteVideoRef,
          setStarted,
        }),
      iceQueueRef,
    });

    return cleanup;
  }, [email]);

  // start local preview once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await getVideoStream(
          null,
          "user",
          currentVideoDeviceRef
        );
        if (!cancelled && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
      }
    })();

    return () => {
      cancelled = true;
      const stream = localVideoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        localVideoRef.current.srcObject = null;
      }
    };
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    connectedUsers,
    mySocketId,
    started,
    incomingCall,
    videoOn,
    micOn,

    startCall: (targetId) =>
      startCallHandler({
        targetId,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setStarted,
      }),

    acceptCall: () =>
      acceptCallHandler({
        incomingCall,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setIncomingCall,
        setStarted,
        iceQueueRef,
      }),

    declineCall: () =>
      declineCallHandler({
        incomingCall,
        socketRef,
        setIncomingCall,
      }),

    endCall: () =>
      endCallHandler({
        pcRef,
        localVideoRef,
        remoteVideoRef,
        setStarted,
      }),

    switchCamera: () =>
      switchCamera({
        pcRef,
        localVideoRef,
        currentVideoDeviceRef,
      }),

    toggleVideo: () =>
      toggleVideo({
        localVideoRef,
        setVideoOn,
      }),

    toggleMic: () =>
      toggleMic({
        localVideoRef,
        setMicOn,
      }),
  };
}
