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
    console.log("=== SWITCH CAMERA STARTED ===");

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = filterRealCameras(
      devices.filter((d) => d.kind === "videoinput")
    );

    if (cams.length < 2) {
      console.warn("Only one usable camera found");
      return;
    }

    // Detect current camera properly
    let currentId = currentVideoDeviceRef.current;

    if (!currentId) {
      const liveTrack = localVideoRef.current?.srcObject?.getVideoTracks?.()[0];
      const settings = liveTrack?.getSettings();

      currentId = settings?.deviceId || cams[0].deviceId;
      currentVideoDeviceRef.current = currentId;
    }

    // Find next camera
    const idx = cams.findIndex((c) => c.deviceId === currentId);
    const nextCam = cams[(idx + 1) % cams.length];

    // Stop old stream
    const old = localVideoRef.current?.srcObject;
    if (old) old.getTracks().forEach((t) => t.stop());

    // Start new stream
    const newStream = await getVideoStream(
      nextCam.deviceId,
      null,
      currentVideoDeviceRef
    );

    // Update preview
    localVideoRef.current.srcObject = newStream;
    await localVideoRef.current.play().catch(() => {});

    // Update current cam
    currentVideoDeviceRef.current = nextCam.deviceId;

    // If no call → done
    if (!pcRef.current) {
      console.log("=== SWITCH CAMERA DONE (PREVIEW MODE) ===");
      return;
    }

    // Replace track during call
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && newTrack) await sender.replaceTrack(newTrack);

    console.log("=== SWITCH CAMERA DONE ===");
  } catch (err) {
    console.error("Switch camera error:", err);
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
