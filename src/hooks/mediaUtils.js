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

    // 1️⃣ Get all available cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    if (cams.length < 2) {
      console.warn("Only one camera found");
      return;
    }

    const currentId = currentVideoDeviceRef.current;

    // 2️⃣ Find next camera in list
    const idx = cams.findIndex((c) => c.deviceId === currentId);
    const nextCam = cams[(idx + 1) % cams.length];

    console.log("Switching to camera:", nextCam.deviceId);

    // 3️⃣ STOP OLD STREAM FIRST (important for mobile)
    const oldStream = localVideoRef.current?.srcObject;
    if (oldStream) {
      console.log("Stopping old tracks...");
      oldStream.getTracks().forEach((t) => t.stop());
    }

    console.log("Old tracks stopped.");

    // 4️⃣ Start NEW stream (mobile-safe)
    let newStream;

    try {
      // Try deviceId first
      newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextCam.deviceId } },
        audio: true,
      });
    } catch (err) {
      console.warn("DeviceId failed, using facingMode fallback...", err);

      // Fallback for Android/iPhone
      newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextCam.label.toLowerCase().includes("front")
            ? "user"
            : "environment",
        },
        audio: true,
      });
    }

    console.log("New stream started:", newStream);

    // 5️⃣ Update local preview
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
      await localVideoRef.current.play().catch((err) =>
        console.error("Local video play failed:", err)
      );
    }

    // 6️⃣ Update current camera ref
    currentVideoDeviceRef.current = nextCam.deviceId;

    // 7️⃣ Replace track in WebRTC sender
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && newTrack) {
      console.log("Replacing sender track...");
      await sender.replaceTrack(newTrack);
      console.log("Track replaced!");
    } else {
      console.warn("Sender/newTrack missing");
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
