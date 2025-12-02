/*********************************************
 * GET CAMERA LIST (clean + correct + logs)
 *********************************************/
export async function getCameraList() {
  console.log("📸 [CameraList] Fetching camera list...");

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("🔓 [CameraList] Permission granted, fetching labels...");

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === "videoinput");

    console.log("📸 [CameraList] Raw detected cameras:", cams);

    const real = cams.filter(cam => {
      const l = cam.label.toLowerCase();

      if (
        l.includes("depth") ||
        l.includes("infrared") ||
        l.includes("ir") ||
        l.includes("virtual") ||
        l.includes("dummy")
      ) {
        console.log("⛔ [CameraList] Ignoring unusable camera:", cam.label);
        return false;
      }
      return true;
    });

    console.log("✅ [CameraList] Usable cameras:", real);
    return real.length ? real : cams;
  } catch (err) {
    console.error("❌ [CameraList] Error:", err);
    return [];
  }
}

/*********************************************
 * START CAMERA STREAM (simple + logs)
 *********************************************/
export async function getVideoStream(deviceId) {
  console.log("🎥 [getVideoStream] Starting video for device:", deviceId);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true,
    });

    console.log("🎉 [getVideoStream] Stream success.");
    return stream;
  } catch (err) {
    console.error("❌ [getVideoStream] Failed:", err);
    throw err;
  }
}

/*********************************************
 * SWITCH CAMERA — CLEAN + DEBUG SAFE LOGS
 *********************************************/

/*********************************************
 * SWITCH CAMERA — MOBILE SAFE + NO CALL SAFE
 *********************************************/
export async function switchCameraRaw({
  pcRef,
  localVideoRef,
  cameraList,
  activeCameraRef,
  setActiveCamera,
}) {
  console.log("🔄 [SwitchCamera] REQUEST INIT");

  try {
    if (!cameraList.length) {
      console.warn("❌ [SwitchCamera] No cameras available!");
      return;
    }

    const currentId = activeCameraRef.current;
    const idx = cameraList.findIndex(c => c.deviceId === currentId);
    const nextIndex = idx === -1 ? 0 : (idx + 1) % cameraList.length;
    const nextCam = cameraList[nextIndex];

    console.log(
      `➡️ [SwitchCamera] Switching from: ${currentId} → ${nextCam.deviceId} (${nextCam.label})`
    );

    /***********************
     * 1. STOP OLD STREAM
     ***********************/
    const oldStream = localVideoRef.current?.srcObject;

    if (oldStream) {
      console.log("🛑 [SwitchCamera] Stopping old stream tracks...");
      oldStream.getTracks().forEach(t => t.stop());
    }

    // Mobile camera needs time to release
    await new Promise(res => setTimeout(res, 350));

    /********************************
     * 2. SAFE GET USER MEDIA (retry)
     ********************************/
    async function safeGetUserMedia(constraints) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("⏳ Retrying getUserMedia after camera release:", err);
        await new Promise(res => setTimeout(res, 300));
        return await navigator.mediaDevices.getUserMedia(constraints);
      }
    }

    /***********************
     * 3. START NEW CAMERA
     ***********************/
    console.log("🎥 [SwitchCamera] Starting new stream...");

    const newStream = await safeGetUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    console.log("🎉 [SwitchCamera] New stream obtained.");
    localVideoRef.current.srcObject = newStream;

    activeCameraRef.current = nextCam.deviceId;
    setActiveCamera(nextCam.deviceId);

    /************************************
     * 4. UPDATE TRACK ONLY IF CALL LIVE
     ************************************/
    const pc = pcRef.current;

    if (!pc) {
      console.log("ℹ️ [SwitchCamera] No active call → only preview updated.");
      return;
    }

    console.log("🔧 [SwitchCamera] Updating WebRTC sender track...");
    const videoSender = pc.getSenders().find(s => s.track?.kind === "video");

    if (videoSender) {
      try {
        await videoSender.replaceTrack(newStream.getVideoTracks()[0]);
        console.log("✅ [SwitchCamera] replaceTrack OK");
      } catch (err) {
        console.error("❌ [SwitchCamera] replaceTrack failed:", err);
      }
    } else {
      console.warn("⚠️ [SwitchCamera] No video sender in RTCPeerConnection");
    }

    console.log("✔ [SwitchCamera] DONE");

  } catch (err) {
    console.error("🔥 [SwitchCamera] FATAL ERROR:", err);
  }
}



/*********************************************
 * Toggle video/mic (+ logs)
 *********************************************/
export function toggleVideo({ localVideoRef, setVideoOn }) {
  console.log("🎚 [ToggleVideo] Triggered");

  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getVideoTracks() || [];

  if (!track) {
    console.warn("⚠️ [ToggleVideo] No video track found!");
    return;
  }

  track.enabled = !track.enabled;
  console.log("▶️ [ToggleVideo] Video now:", track.enabled);

  setVideoOn(track.enabled);
}

export function toggleMic({ localVideoRef, setMicOn }) {
  console.log("🎚 [ToggleMic] Triggered");

  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getAudioTracks() || [];

  if (!track) {
    console.warn("⚠️ [ToggleMic] No audio track found!");
    return;
  }

  track.enabled = !track.enabled;
  console.log("🎤 [ToggleMic] Mic now:", track.enabled);

  setMicOn(track.enabled);
}
