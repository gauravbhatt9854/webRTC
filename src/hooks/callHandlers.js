import { createPeerConnection } from "./peerConnection";
import { getVideoStream } from "./mediaUtils";

export async function startCall({ targetId, pcRef, socketRef, localVideoRef, remoteVideoRef, setStarted }) {
  if (!targetId) return;
  pcRef.current?.close();
  pcRef.current = createPeerConnection(targetId, socketRef, remoteVideoRef);

  const stream = localVideoRef.current?.srcObject || (await getVideoStream());
  localVideoRef.current.srcObject = stream;
  stream.getTracks().forEach((t) => pcRef.current.addTrack(t, stream));

  const offer = await pcRef.current.createOffer();
  await pcRef.current.setLocalDescription(offer);
  socketRef.current.emit("initiate-call", { targetId, offer });
  setStarted(true);
}

export async function acceptCall({
  incomingCall,
  pcRef,
  socketRef,
  localVideoRef,
  remoteVideoRef,
  setIncomingCall,
  setStarted,
  iceQueueRef,
}) {
  if (!incomingCall) return;
  const { socketId, offer } = incomingCall;
  pcRef.current?.close();
  pcRef.current = createPeerConnection(socketId, socketRef, remoteVideoRef);

  const stream = localVideoRef.current?.srcObject || (await getVideoStream());
  localVideoRef.current.srcObject = stream;
  stream.getTracks().forEach((t) => pcRef.current.addTrack(t, stream));

  await pcRef.current.setRemoteDescription(offer);
  const answer = await pcRef.current.createAnswer();
  await pcRef.current.setLocalDescription(answer);

  socketRef.current.emit("answer", { answer, targetUserId: socketId });
  while (iceQueueRef.current.length) {
    const candidate = iceQueueRef.current.shift();
    await pcRef.current.addIceCandidate(candidate);
  }

  setIncomingCall(null);
  setStarted(true);
}

export function declineCall({ incomingCall, socketRef, setIncomingCall }) {
  if (incomingCall?.socketId) {
    socketRef.current.emit("decline-call", {
      targetUserId: incomingCall.socketId,
    });
  }
  setIncomingCall(null);
}

export function endCall({ pcRef, localVideoRef, remoteVideoRef, setStarted }) {
  pcRef.current?.close();
  pcRef.current = null;
  setStarted(false);
  if (localVideoRef.current) localVideoRef.current.srcObject = null;
  if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
}
