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


export async function switchCamera({
  pcRef,
  localVideoRef,
  currentVideoDeviceRef,
}) {
  try {
    console.log("=== SWITCH CAMERA STARTED ===");

    // 1️⃣ Get all cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    if (cams.length < 2) {
      console.warn("Only one camera found");
      return;
    }

    // If NO CALL and no camera selected → set default
    if (!currentVideoDeviceRef.current) {
      currentVideoDeviceRef.current = cams[0].deviceId;
    }

    let currentId = currentVideoDeviceRef.current;

    // 2️⃣ Find next camera
    const idx = cams.findIndex((c) => c.deviceId === currentId);
    const nextCam = cams[(idx + 1) % cams.length];

    console.log("Switching to:", nextCam.deviceId);

    // 3️⃣ Stop old stream
    const old = localVideoRef.current?.srcObject;
    if (old) {
      old.getTracks().forEach((t) => t.stop());
    }

    // 4️⃣ Start new stream
    let newStream;
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextCam.deviceId } },
        audio: true,
      });
    } catch (err) {
      console.warn("deviceId failed → using facingMode fallback");

      newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextCam.label.toLowerCase().includes("front")
            ? "user"
            : "environment",
        },
        audio: true,
      });
    }

    // 5️⃣ Update preview
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
      await localVideoRef.current.play().catch(() => { });
    }

    // Update current device
    currentVideoDeviceRef.current = nextCam.deviceId;

    // 6️⃣ If NO CALL → exit here (preview-only mode)
    if (!pcRef.current) {
      console.log("No call active → only preview switched");
      console.log("=== SWITCH CAMERA DONE (PREVIEW MODE) ===");
      return;
    }

    // 7️⃣ Replace track ONLY if call is active
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && newTrack) {
      console.log("Replacing track...");
      await sender.replaceTrack(newTrack);
      console.log("Track replaced!");
    } else {
      console.warn("Sender/newTrack missing → no replace");
    }

    console.log("=== SWITCH CAMERA DONE ===");
  } catch (error) {
    console.error("Switch camera error:", error);
  }
}



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

export async function getCameraList() {
  try {
    // First try to get permission → so labels become visible
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();

    // Filter only video input devices (cameras)
    const cameras = devices.filter((d) => d.kind === "videoinput");

    return cameras.map((cam) => ({
      deviceId: cam.deviceId,
      label: cam.label || "Camera",
    }));
  } catch (err) {
    console.error("Error fetching camera list:", err);
    return [];
  }
}
