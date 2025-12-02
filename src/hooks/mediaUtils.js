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


export async function switchCamera({ pcRef, localVideoRef, currentVideoDeviceRef }) {
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  // Stop old tracks
  oldStream.getTracks().forEach(t => t.stop());

  try {
    // Get current facing mode
    const currentTrack = oldStream.getVideoTracks()[0];
    const settings = currentTrack.getSettings();
    const isFront = settings.facingMode === "user";

    // Toggle camera
    const newFacingMode = isFront ? "environment" : "user";

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: newFacingMode } },
      audio: true,
    });

    // Update device ref
    currentVideoDeviceRef.current =
      newStream.getVideoTracks()[0]?.getSettings()?.deviceId;

    // Update video element
    localVideoRef.current.srcObject = newStream;

    // Replace track in peer connection
    const sender = pcRef.current
      ?.getSenders()
      .find(s => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(newStream.getVideoTracks()[0]);
    }
  } catch (err) {
    console.log("Camera switch failed:", err);
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
