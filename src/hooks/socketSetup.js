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
  const socket = io(import.meta.env.VITE_SIGNALING_SERVER);
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
    if (pcRef.current && answer)
      await pcRef.current.setRemoteDescription(answer);
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (pcRef.current) await pcRef.current.addIceCandidate(candidate);
    else iceQueueRef.current.push(candidate);
  });

  socket.on("disconnect-call", endCall);

  return () => {
    socket.disconnect();
    pcRef.current?.close();
  };
}
