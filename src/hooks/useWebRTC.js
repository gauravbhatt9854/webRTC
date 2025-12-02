import { useState, useRef, useEffect } from "react";
import { setupSocket } from "./socketSetup";
import {
  getVideoStream,
  switchCamera as switchCameraRaw,
  toggleVideo,
  toggleMic,
  getCameraList,
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

  // ⭐ NEW — store camera info in hook itself
  const [cameraList, setCameraList] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const activeCameraRef = useRef(null); // logic ke liye fast ref

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [started, setStarted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  /* ----------------------------------------------
     1) Load camera list & start default preview
  ---------------------------------------------- */
  useEffect(() => {
    async function initCam() {
      const cams = await getCameraList();
      setCameraList(cams);

      // DEFAULT CAMERA = cams[0]
      const defaultCam = cams[0];
      activeCameraRef.current = defaultCam.deviceId;
      setActiveCamera(defaultCam.deviceId);

      // Start preview
      const stream = await getVideoStream(defaultCam.deviceId);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }

    initCam();

    return () => {
      const s = localVideoRef.current?.srcObject;
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ----------------------------------------------
     2) Setup socket signaling
  ---------------------------------------------- */
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

  /* ----------------------------------------------
     3) Switch camera — uses hook-level state
  ---------------------------------------------- */
  async function switchCamera() {
    await switchCameraRaw({
      pcRef,
      localVideoRef,
      cameraList,
      activeCameraRef,
      setActiveCamera,
    });
  }

  return {
    localVideoRef,
    remoteVideoRef,

    connectedUsers,
    mySocketId,
    started,
    incomingCall,

    videoOn,
    micOn,

    cameraList,
    activeCamera,

    // CALL CONTROLS
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

    // MEDIA CONTROLS
    switchCamera,
    toggleVideo: () => toggleVideo({ localVideoRef, setVideoOn }),
    toggleMic: () => toggleMic({ localVideoRef, setMicOn }),
  };
}
