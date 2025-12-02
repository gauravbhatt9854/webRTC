/*******************************
 * CAMERA HELPERS (ALL-IN-ONE)
 *******************************/

// Filter only REAL usable cameras on phone
function filterRealCameras(devices) {
  return devices.filter((d) => {
    const label = d.label.toLowerCase();

    return (
      label.includes("front") ||
      label.includes("user") ||
      label.includes("back") ||
      label.includes("rear") ||
      label.includes("environment")
    );
  });
}

// Get usable camera list
export async function getCameraList() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    const real = filterRealCameras(cams);

    return real.map((cam) => ({
      deviceId: cam.deviceId,
      label: cam.label || "Camera"
    }));
  } catch (err) {
    console.error("Error fetching camera list:", err);
    return [];
  }
}

// Start camera stream (simple)
export async function getVideoStream(deviceId = null, facingMode = "user") {
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode },
    audio: true,
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

/*********************************************
 * NEW CLEAN SWITCH CAMERA (index based only)
 *********************************************/

export async function switchCamera({
  pcRef,
  localVideoRef,
  cameraList,
  activeCameraRef,
  setActiveCamera
}) {
  try {
    if (!cameraList || cameraList.length < 2) {
      console.warn("Not enough cameras to switch");
      return;
    }

    // Find current index
    const currentId = activeCameraRef.current;
    const idx = cameraList.findIndex((c) => c.deviceId === currentId);

    // Select next camera
    const nextCam = cameraList[(idx + 1) % cameraList.length];
    console.log("Switching to:", nextCam.deviceId);

    // Stop old stream
    const oldStream = localVideoRef.current?.srcObject;
    if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

    // Start new stream
    const newStream = await getVideoStream(nextCam.deviceId);

    // Preview update
    localVideoRef.current.srcObject = newStream;
    await localVideoRef.current.play().catch(() => {});

    // Update current camera state+ref
    activeCameraRef.current = nextCam.deviceId;
    setActiveCamera(nextCam.deviceId);

    // If no call → done
    if (!pcRef.current) {
      console.log("Switch camera: preview only");
      return;
    }

    // Replace track in WebRTC
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
      console.log("Track replaced in active call");
    }
  } catch (err) {
    console.error("Switch camera error:", err);
  }
}

/*********************************************
 * Toggle video/mic
 *********************************************/

export function toggleVideo({ localVideoRef, setVideoOn }) {
  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getVideoTracks() || [];
  if (!track) return;

  track.enabled = !track.enabled;
  setVideoOn(track.enabled);
}

export function toggleMic({ localVideoRef, setMicOn }) {
  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getAudioTracks() || [];
  if (!track) return;

  track.enabled = !track.enabled;
  setMicOn(track.enabled);
}
