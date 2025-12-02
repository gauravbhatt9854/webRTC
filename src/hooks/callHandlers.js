import { createPeerConnection } from "./peerConnection";
import { getVideoStream } from "./mediaUtils";

// internal helper: create PC + attach local stream
async function ensurePeerConnectionWithStream({
  pcRef,
  targetId,
  socketRef,
  localVideoRef,
  remoteVideoRef,
}) {
  // close old PC if any
  if (pcRef.current) {
    try {
      pcRef.current.close();
    } catch (e) {
      console.error("Error closing old peer connection:", e);
    }
  }

  const pc = createPeerConnection(targetId, socketRef, remoteVideoRef);
  pcRef.current = pc;

  // reuse existing local stream if available, otherwise create new
  let stream = localVideoRef.current?.srcObject;
  if (!stream) {
    stream = await getVideoStream();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }

  // attach tracks if not already sending
  stream.getTracks().forEach((track) => {
    const alreadySending = pc
      .getSenders()
      .some((sender) => sender.track === track);

    if (!alreadySending) {
      pc.addTrack(track, stream);
    }
  });

  return pc;
}

export async function startCall({
  targetId,
  pcRef,
  socketRef,
  localVideoRef,
  remoteVideoRef,
  setStarted,
}) {
  if (!targetId) return;

  const pc = await ensurePeerConnectionWithStream({
    pcRef,
    targetId,
    socketRef,
    localVideoRef,
    remoteVideoRef,
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socketRef.current?.emit("initiate-call", { targetId, offer });
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

  const pc = await ensurePeerConnectionWithStream({
    pcRef,
    targetId: socketId,
    socketRef,
    localVideoRef,
    remoteVideoRef,
  });

  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socketRef.current?.emit("answer", {
    answer,
    targetUserId: socketId,
  });

  // add queued ICE candidates (if any)
  if (Array.isArray(iceQueueRef.current) && iceQueueRef.current.length > 0) {
    for (const candidate of iceQueueRef.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding queued ICE candidate:", err);
      }
    }
    iceQueueRef.current = [];
  }

  setIncomingCall(null);
  setStarted(true);
}

export function declineCall({ incomingCall, socketRef, setIncomingCall }) {
  if (incomingCall?.socketId) {
    socketRef.current?.emit("decline-call", {
      targetUserId: incomingCall.socketId,
    });
  }
  setIncomingCall(null);
}

export function endCall({ pcRef, localVideoRef, remoteVideoRef, setStarted }) {
  try {
    if (pcRef.current) {
      // stop tracks on senders (safe)
      pcRef.current.getSenders?.().forEach((sender) => {
        try {
          sender.track?.stop();
        } catch {
          /* ignore */
        }
      });

      pcRef.current.close();
    }
  } catch (e) {
    console.error("Error closing peer connection:", e);
  }

  pcRef.current = null;
  setStarted(false);

  // stop & clear local stream
  if (localVideoRef.current?.srcObject) {
    localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    localVideoRef.current.srcObject = null;
  }

  // stop & clear remote stream
  if (remoteVideoRef.current?.srcObject) {
    remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    remoteVideoRef.current.srcObject = null;
  }
}
