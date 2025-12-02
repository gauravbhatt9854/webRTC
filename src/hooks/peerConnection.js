export function createPeerConnection(targetId, socketRef, remoteVideoRef) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_PASSWORD,
      },
    ],
  });

  pc.ontrack = (event) => {
    if (!remoteVideoRef?.current) return;
    const [remoteStream] = event.streams;
    if (remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate && targetId && socketRef.current) {
      socketRef.current.emit("ice-candidate", {
        candidate: event.candidate,
        targetUserId: targetId,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("PeerConnection state:", pc.connectionState);
  };

  pc.oniceconnectionstatechange = () => {
    console.log("ICE connection state:", pc.iceConnectionState);
  };

  pc.addEventListener("iceconnectionstatechange", async () => {
    if (
      pc.iceConnectionState === "connected" ||
      pc.iceConnectionState === "completed"
    ) {
      try {
        const stats = await pc.getStats();
        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            const local = stats.get(report.localCandidateId);
            const remote = stats.get(report.remoteCandidateId);
            console.log("✅ Connection via:", remote?.candidateType);
          }
        });
      } catch (err) {
        console.error("Error reading ICE stats:", err);
      }
    }
  });

  return pc;
}
