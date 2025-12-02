/*******************************
 * CAMERA HELPERS (ALL-IN-ONE)
 *******************************/

// Filter only REAL usable cameras on phone


async function getRealCameras() {
  const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });

  const track = tempStream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();
  track.stop();

  const devices = await navigator.mediaDevices.enumerateDevices();

  const cams = devices.filter(d => d.kind === "videoinput");

  return cams.filter(cam => {
    const isFront =
      cam.label.toLowerCase().includes("front") ||
      cam.label.toLowerCase().includes("user");

    const isBack =
      cam.label.toLowerCase().includes("back") ||
      cam.label.toLowerCase().includes("environment") ||
      cam.label.toLowerCase().includes("rear");

    return isFront || isBack;
  });
}

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
    const cams = devices.filter(d => d.kind === "videoinput");

    // Hide only unusable cameras (IR, Depth, Virtual)
    const realCams = cams.filter(cam => {
      const label = cam.label.toLowerCase();

      // remove useless cameras
      if (
        label.includes("depth") ||
        label.includes("infrared") ||
        label.includes("ir") ||
        label.includes("virtual") ||
        label.includes("dummy")
      ) {
        return false;
      }

      return true; // keep all normal cameras (laptop, phone)
    });

    // If somehow filter returns empty, fallback to all cams
    if (realCams.length === 0) return cams;

    return realCams;
  } catch (err) {
    console.error("Error fetching cameras:", err);
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
    if (cameraList.length < 2) {
      console.warn("Only one real camera");
      return;
    }

    const currentId = activeCameraRef.current;
    const idx = cameraList.findIndex(c => c.deviceId === currentId);

    const nextCam = cameraList[(idx + 1) % cameraList.length];
    console.log("Switching to:", nextCam.deviceId);

    const oldStream = localVideoRef.current?.srcObject;

    // Start new stream FIRST (important for mobile)
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    // Update preview
    localVideoRef.current.srcObject = newStream;
    await localVideoRef.current.play().catch(() => {});

    // Update active camera
    activeCameraRef.current = nextCam.deviceId;
    setActiveCamera(nextCam.deviceId);

    // If NOT in call → done
    if (!pcRef.current) return;

    // Replace track
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      .getSenders()
      .find(s => s.track?.kind === "video");

    if (sender) await sender.replaceTrack(newTrack);

    // NOW stop old stream (safe on mobile)
    if (oldStream) oldStream.getTracks().forEach(t => t.stop());
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
