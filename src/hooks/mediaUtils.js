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

    if (idx === -1) {
      console.warn("⚠️ [SwitchCamera] Current camera not in list, fallback to index 0");
    }

    const nextIndex = idx === -1 ? 0 : (idx + 1) % cameraList.length;
    const nextCam = cameraList[nextIndex];

    console.log(
      `➡️ [SwitchCamera] Switching from: ${currentId} → ${nextCam.deviceId} (${nextCam.label})`
    );

    const oldStream = localVideoRef.current?.srcObject;
    if (oldStream) {
      console.log("🛑 [SwitchCamera] Stopping old stream tracks...");
      oldStream.getTracks().forEach(t => t.stop());
    }

    await new Promise(res => setTimeout(res, 150));

    console.log("🎥 [SwitchCamera] Starting new stream...");
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    console.log("🎉 [SwitchCamera] New stream obtained.");
    localVideoRef.current.srcObject = newStream;

    activeCameraRef.current = nextCam.deviceId;
    setActiveCamera(nextCam.deviceId);

    console.log("🔧 [SwitchCamera] Updating WebRTC sender track...");
    const pc = pcRef.current;
    if (pc) {
      const videoSender = pc
        .getSenders()
        .find(s => s.track?.kind === "video");

      if (videoSender) {
        try {
          const newTrack = newStream.getVideoTracks()[0];
          await videoSender.replaceTrack(newTrack);
          console.log("✅ [SwitchCamera] replaceTrack OK");
        } catch (rErr) {
          console.error("❌ [SwitchCamera] replaceTrack failed:", rErr);
        }
      } else {
        console.warn("⚠️ [SwitchCamera] No video sender found in RTCPeerConnection");
      }
    } else {
      console.warn("⚠️ [SwitchCamera] pcRef is null");
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
