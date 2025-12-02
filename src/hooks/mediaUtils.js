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
    // 1️⃣ Get all cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");

    if (cams.length < 2) {
      console.warn("Only one camera found");
      return;
    }

    const currentId = currentVideoDeviceRef.current;

    // 2️⃣ Get next camera index
    const currentIndex = cams.findIndex((c) => c.deviceId === currentId);
    const nextIndex = (currentIndex + 1) % cams.length;
    const nextDeviceId = cams[nextIndex].deviceId;

    console.log("Switching to camera:", nextDeviceId);

    // 3️⃣ Create NEW STREAM FIRST (IMPORTANT)
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextDeviceId } },
      audio: true,
    });

    // 4️⃣ SET LOCAL PREVIEW **BEFORE stopping old stream**
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
      await localVideoRef.current.play().catch(() => {});
    }

    // 5️⃣ Update current device reference
    currentVideoDeviceRef.current = nextDeviceId;

    // 6️⃣ Replace remote video track
    const videoSender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    const newTrack = newStream.getVideoTracks()[0];

    if (videoSender && newTrack) {
      await videoSender.replaceTrack(newTrack);
    }

    // 7️⃣ STOP old stream AFTER switching local video
    const oldStream = localVideoRef.current.srcObject;
    if (oldStream && oldStream !== newStream) {
      oldStream.getTracks().forEach((t) => t.stop());
    }

  } catch (err) {
    console.error("Camera switch failed:", err);
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
