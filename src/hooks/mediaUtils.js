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
    // Ask permission so labels become visible
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    const real = filterRealCameras(cams);

    return real.map((cam) => ({
      deviceId: cam.deviceId,
      label: cam.label || "Camera",
    }));
  } catch (err) {
    console.error("Error fetching camera list:", err);
    return [];
  }
}

// Start camera stream
export async function getVideoStream(
  deviceId = null,
  facingMode = "user",
  currentVideoDeviceRef = null
) {
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode },
    audio: true,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  if (currentVideoDeviceRef) {
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    if (settings?.deviceId) {
      currentVideoDeviceRef.current = settings.deviceId;
    }
  }

  return stream;
}

// Switch camera (works with OR without call)
export async function switchCamera({
  pcRef,
  localVideoRef,
  currentVideoDeviceRef,
}) {
  try {
    console.log("=== SWITCH CAMERA TRIGGERED ===");

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    if (cams.length < 2) {
      console.warn("Only one camera available");
      return;
    }

    // ⭐ Detect current camera ALWAYS from live video stream
    let activeId = null;
    const liveTrack =
      localVideoRef.current?.srcObject?.getVideoTracks?.()[0];

    if (liveTrack) {
      const settings = liveTrack.getSettings();
      activeId = settings.deviceId;
      console.log("Detected active camera from stream:", activeId);
    }

    // Agar stream not started or activeId null:
    if (!activeId) {
      activeId = currentVideoDeviceRef.current || cams[0].deviceId;
      console.log("Fallback active camera:", activeId);
    }

    // Find next camera correctly
    const currentIdx = cams.findIndex((c) => c.deviceId === activeId);
    const nextCam = cams[(currentIdx + 1) % cams.length];

    console.log("Switching to:", nextCam.deviceId);

    // Stop old tracks before capturing new one
    const oldStream = localVideoRef.current?.srcObject;
    if (oldStream) oldStream.getTracks().forEach((t) => t.stop());

    // New Stream
    let newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    // Preview update
    localVideoRef.current.srcObject = newStream;
    await localVideoRef.current.play().catch(() => {});

    // Update ref
    currentVideoDeviceRef.current = nextCam.deviceId;

    // If NO CALL → DONE
    if (!pcRef.current) {
      console.log("=== SWITCH CAMERA DONE (NO CALL) ===");
      return;
    }

    // Replace track
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log("Video track replaced in active call");
    }

    console.log("=== SWITCH CAMERA DONE ===");
  } catch (error) {
    console.error("Switch error:", error);
  }
}



// Toggle video
export function toggleVideo({ localVideoRef, setVideoOn }) {
  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getVideoTracks() || [];
  if (!track) return;

  track.enabled = !track.enabled;
  setVideoOn(track.enabled);
}

// Toggle mic
export function toggleMic({ localVideoRef, setMicOn }) {
  const stream = localVideoRef.current?.srcObject;
  const [track] = stream?.getAudioTracks() || [];
  if (!track) return;

  track.enabled = !track.enabled;
  setMicOn(track.enabled);
}
