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

export async function switchCamera({ pcRef, localVideoRef }) {
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  const oldTrack = oldStream.getVideoTracks()[0];
  const oldFacing = oldTrack.getSettings().facingMode || "user";
  oldStream.getTracks().forEach((t) => t.stop());
  const newFacing = oldFacing === "user" ? "environment" : "user";

  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: newFacing } },
      audio: true,
    });
    localVideoRef.current.srcObject = newStream;
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
