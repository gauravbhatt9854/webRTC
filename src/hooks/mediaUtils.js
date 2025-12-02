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

export async function getCameraList() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === "videoinput");
}

export async function detectCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const video = devices.filter(d => d.kind === "videoinput");

  let front = null;
  let back = null;

  for (const cam of video) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: cam.deviceId }
    });

    const track = stream.getVideoTracks()[0];
    const facing = track.getSettings().facingMode;

    if (facing === "environment") back = cam.deviceId;
    if (facing === "user") front = cam.deviceId;

    // stop
    stream.getTracks().forEach(t => t.stop());
  }

  return { front, back };
}

export async function switchCamera({ pcRef, localVideoRef, currentVideoDeviceRef }) {
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  oldStream.getTracks().forEach(t => t.stop());

  const current = currentVideoDeviceRef.current;

  // if current = front → switch to back
  // if current = back → switch to front
  const nextDeviceId =
    current === window.__cams.front
      ? window.__cams.back
      : window.__cams.front;

  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: nextDeviceId } },
    audio: true
  });

  currentVideoDeviceRef.current = nextDeviceId;
  localVideoRef.current.srcObject = newStream;

  const sender = pcRef.current
    ?.getSenders()
    .find(s => s.track?.kind === "video");

  if (sender) {
    await sender.replaceTrack(newStream.getVideoTracks()[0]);
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
