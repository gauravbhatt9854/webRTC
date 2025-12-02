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
    // list all cams
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    if (cams.length < 2) return;

    const currentId = currentVideoDeviceRef.current;

    // find next camera
    const idx = cams.findIndex((c) => c.deviceId === currentId);
    const nextCam = cams[(idx + 1) % cams.length];

    // get new stream
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCam.deviceId } },
      audio: true,
    });

    // update local preview
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = newStream;
    }

    // update ref
    currentVideoDeviceRef.current = nextCam.deviceId;

    // replace track for remote
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
    }

    // stop old stream
    // (simple & safe)
    const tracks =
      localVideoRef.current?.srcObject?.getVideoTracks?.() || [];
    tracks.forEach((t) => t.stop());
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
