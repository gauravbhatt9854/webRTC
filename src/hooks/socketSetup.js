import { io } from "socket.io-client";

export function setupSocket({
  email,
  pcRef,
  socketRef,
  connectedUsersRef,
  setConnectedUsers,
  setMySocketId,
  setIncomingCall,
  endCall,
  iceQueueRef,
}) {
  const socket = io(import.meta.env.VITE_SIGNALING_SERVER, {
    transports: ["websocket", "polling"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    setMySocketId(socket.id);
    socket.emit("register-email", email);
  });

  socket.on("connected-users", (users) => {
    setConnectedUsers(users);
    connectedUsersRef.current = users;
  });

  socket.on("offer", ({ callerId, offer }) => {
    const caller = connectedUsersRef.current.find(
      (u) => u.socketId === callerId
    );

    setIncomingCall({
      socketId: callerId,
      email: caller?.email || "Unknown",
      offer,
    });
  });

  socket.on("answer", async ({ answer }) => {
    if (!pcRef.current || !answer) return;
    try {
      await pcRef.current.setRemoteDescription(answer);
    } catch (err) {
      console.error("Error setting remote answer:", err);
    }
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (!candidate) return;

    if (pcRef.current) {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    } else {
      // PC not ready yet → queue it
      iceQueueRef.current.push(candidate);
    }
  });

  socket.on("disconnect-call", () => {
    endCall();
  });

  return () => {
    try {
      socket.disconnect();
    } catch {
      /* ignore */
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        /* ignore */
      }
      pcRef.current = null;
    }
  };
}
