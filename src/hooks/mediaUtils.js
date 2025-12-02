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
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  // stop old tracks
  oldStream.getTracks().forEach((t) => t.stop());

  const currentId = currentVideoDeviceRef?.current;

  // assumes window.__cams.front / window.__cams.back are set somewhere else
  const nextDeviceId =
    currentId && window.__cams
      ? currentId === window.__cams.front
        ? window.__cams.back
        : window.__cams.front
      : null;

  const constraints = nextDeviceId
    ? { video: { deviceId: { exact: nextDeviceId } }, audio: true }
    : { video: true, audio: true };

  const newStream = await navigator.mediaDevices.getUserMedia(constraints);

  if (currentVideoDeviceRef) {
    const videoTrack = newStream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    if (settings?.deviceId) {
      currentVideoDeviceRef.current = settings.deviceId;
    }
  }

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = newStream;
  }

  const videoSender = pcRef.current
    ?.getSenders()
    .find((s) => s.track?.kind === "video");

  if (videoSender) {
    const newVideoTrack = newStream.getVideoTracks()[0];
    if (newVideoTrack) {
      await videoSender.replaceTrack(newVideoTrack);
    }
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
