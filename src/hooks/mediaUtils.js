export async function getVideoStream(deviceId = null, facingMode = "user", currentVideoDeviceRef = null) {
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode },
    audio: true,
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  if (currentVideoDeviceRef)
    currentVideoDeviceRef.current = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
  return stream;
}

export async function switchCamera({ pcRef, localVideoRef, currentVideoDeviceRef }) {
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  // Stop old tracks
  oldStream.getTracks().forEach((t) => t.stop());

  try {
    // Get all available video devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");

    if (videoDevices.length < 2) {
      console.warn("Only one camera available — cannot switch.");
      return;
    }

    // Pick the next camera (cycle through)
    const currentDeviceId = currentVideoDeviceRef?.current;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDeviceId = videoDevices[nextIndex].deviceId;

    // Get new stream from next camera
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextDeviceId } },
      audio: true,
    });

    // Update ref
    if (currentVideoDeviceRef)
      currentVideoDeviceRef.current = nextDeviceId;

    // Replace stream in local video element
    localVideoRef.current.srcObject = newStream;

    // Replace track in peer connection
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(newStream.getVideoTracks()[0]);
  } catch (err) {
    console.error("Camera switch failed:", err);
  }
}


export function toggleVideo({ localVideoRef, setVideoOn }) {
  const stream = localVideoRef.current?.srcObject;
  const track = stream?.getVideoTracks()[0];
  if (track) {
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
  }
}

export function toggleMic({ localVideoRef, setMicOn }) {
  const stream = localVideoRef.current?.srcObject;
  const track = stream?.getAudioTracks()[0];
  if (track) {
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }
}
