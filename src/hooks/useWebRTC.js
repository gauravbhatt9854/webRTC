import { useState, useRef, useEffect } from "react";
import { setupSocket } from "./socketSetup";
import {
  getVideoStream,
  switchCameraRaw,
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
  console.log("🟢 useWebRTC initialized for:", email);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const connectedUsersRef = useRef([]);
  const iceQueueRef = useRef([]);

  const [cameraList, setCameraList] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const activeCameraRef = useRef(null);

  const [connectedUsers, setConnectedUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [started, setStarted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  /* ----------------------------------------------
     Load cameras
  ---------------------------------------------- */
  useEffect(() => {
    console.log("📸 [useWebRTC] Initial camera setup...");

    async function initCam() {
      try {
        const cams = await getCameraList();
        setCameraList(cams);

        if (!cams.length) {
          console.warn("❌ [useWebRTC] No available camera found.");
          return;
        }

        const defaultCam = cams[0];
        console.log("🎥 [useWebRTC] Default camera:", defaultCam);

        activeCameraRef.current = defaultCam.deviceId;
        setActiveCamera(defaultCam.deviceId);

        const stream = await getVideoStream(defaultCam.deviceId);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("🟩 [useWebRTC] Local preview started.");
        }
      } catch (err) {
        console.error("🔥 [useWebRTC] initCam failed:", err);
      }
    }

    initCam();

    return () => {
      console.log("🛑 [useWebRTC] Cleaning up camera tracks...");
      const s = localVideoRef.current?.srcObject;
      if (s) s.getTracks().forEach(t => t.stop());
    };
  }, []);

  /* ----------------------------------------------
     Setup socket signaling
  ---------------------------------------------- */
  useEffect(() => {
    if (!email) return;

    console.log("🔌 [useWebRTC] Setting up socket...");

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

    return () => {
      console.log("🔌 [useWebRTC] Socket cleanup...");
      cleanup();
    };
  }, [email]);

  /* ----------------------------------------------
     SWITCH CAMERA
  ---------------------------------------------- */
  async function switchCamera() {
    console.log("🔁 [useWebRTC] switchCamera() triggered");

    await switchCameraRaw({
      pcRef,
      localVideoRef,
      cameraList,
      activeCameraRef,
      setActiveCamera,
    });
  }

  /* ----------------------------------------------
     Return Controls
  ---------------------------------------------- */
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

    startCall: (targetId) => {
      console.log("📞 [useWebRTC] startCall:", targetId);
      return startCallHandler({
        targetId,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setStarted,
      });
    },

    acceptCall: () => {
      console.log("📞 [useWebRTC] acceptCall()");
      return acceptCallHandler({
        incomingCall,
        pcRef,
        socketRef,
        localVideoRef,
        remoteVideoRef,
        setIncomingCall,
        setStarted,
        iceQueueRef,
      });
    },

    declineCall: () => {
      console.log("📵 [useWebRTC] declineCall()");
      return declineCallHandler({
        incomingCall,
        socketRef,
        setIncomingCall,
      });
    },

    endCall: () => {
      console.log("❌ [useWebRTC] endCall()");
      return endCallHandler({
        pcRef,
        localVideoRef,
        remoteVideoRef,
        setStarted,
      });
    },

    switchCamera,

    toggleVideo: () => {
      console.log("🎚 [useWebRTC] toggleVideo()");
      toggleVideo({ localVideoRef, setVideoOn });
    },

    toggleMic: () => {
      console.log("🎚 [useWebRTC] toggleMic()");
      toggleMic({ localVideoRef, setMicOn });
    },
  };
}
