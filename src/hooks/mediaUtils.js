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

export async function switchCamera(deviceId, videoEl, activeStreamRef) {
  try {
    console.log("Switching to:", deviceId);

    // stop old audio + video tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // add a slight delay (mobile browsers need it)
    await new Promise(res => setTimeout(res, 120));

    // start new video input
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false // keep true if you want audio
    });

    activeStreamRef.current = newStream;
    videoEl.srcObject = newStream;
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
