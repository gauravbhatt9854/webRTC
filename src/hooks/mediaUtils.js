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


export async function switchCamera({ pcRef, localVideoRef }) {
  const oldStream = localVideoRef.current?.srcObject;
  if (!oldStream) return;

  // 1️⃣ Stop all old tracks immediately
  oldStream.getTracks().forEach(track => track.stop());

  try {
    // 2️⃣ Detect current facing mode
    const currentVideoTrack = oldStream.getVideoTracks()[0];
    const currentFacing = currentVideoTrack?.getSettings()?.facingMode;
    const isFront = currentFacing === "user";

    // 3️⃣ Toggle facing mode (use IDEAL not EXACT)
    const newFacing = isFront ? "environment" : "user";

    // 4️⃣ Request new camera
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: newFacing } },
      audio: true,
    });

    // 5️⃣ Update local video preview immediately
    localVideoRef.current.srcObject = newStream;

    // 6️⃣ Replace track for WebRTC
    const sender = pcRef.current
      ?.getSenders()
      .find(s => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(newStream.getVideoTracks()[0]);
    }

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
