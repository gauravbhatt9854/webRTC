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
    debugger;

    // 1️⃣ List all cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    console.log("Available cameras:", cams);
    debugger;

    if (cams.length < 2) {
      console.warn("Only one camera found");
      return;
    }

    const currentId = currentVideoDeviceRef.current;
    console.log("Current camera ID:", currentId);
    debugger;

    // 2️⃣ Find next camera
    const idx = cams.findIndex((c) => c.deviceId === currentId);
    console.log("Current index:", idx);

    const nextCam = cams[(idx + 1) % cams.length];
    console.log("Switching to:", nextCam);
    debugger;

    // 3️⃣ Get NEW STREAM
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    console.log("NewStream:", newStream);
    console.log("New Video Track:", newStream.getVideoTracks()[0]);
    debugger;

    // 4️⃣ Update local preview
    if (localVideoRef.current) {
      console.log("Updating local video preview...");
      localVideoRef.current.srcObject = newStream;

      await localVideoRef.current.play().catch((e) => {
        console.error("Local video play error:", e);
      });
    }
    debugger;

    // 5️⃣ Update ref
    currentVideoDeviceRef.current = nextCam.deviceId;
    console.log("Updated currentVideoDeviceRef:", currentVideoDeviceRef.current);
    debugger;

    // 6️⃣ Replace track for remote
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    console.log("Video sender:", sender);
    console.log("New track to replace:", newTrack);
    debugger;

    if (sender && newTrack) {
      console.log("Replacing track...");
      await sender.replaceTrack(newTrack);
      console.log("Track replaced!");
    } else {
      console.warn("Sender or newTrack missing");
    }
    debugger;

    // 7️⃣ Stop OLD STREAM
    const oldStream = localVideoRef.current?.srcObject;
    console.log("Old stream stops next...");
    debugger;

    if (oldStream) {
      oldStream.getTracks().forEach((t) => {
        console.log("Stopping old track:", t);
        t.stop();
      });
    }

    console.log("=== SWITCH CAMERA DONE ===");
  } catch (error) {
    console.error("Switch camera error:", error);
    debugger;
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
