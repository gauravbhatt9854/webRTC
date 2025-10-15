import "./App.css";
import { useContext } from "react";
import Navbar from "./components/Navbar";
import ConnectedUsers from "./components/ConnectedUsers";
import VideoSection from "./components/VideoSection";
import IncomingCallModal from "./components/IncomingCallModal";
import { UserContext } from "./context/UserContext";
import { useWebRTC } from "./hooks/useWebRTC";

function App() {
  const { email } = useContext(UserContext);
  const {
    localVideoRef,
    remoteVideoRef,
    connectedUsers,
    started,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  } = useWebRTC(email);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-500 text-white p-6 overflow-hidden">
      <Navbar />

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 animate-pulse">
          ⚡ Simple WebRTC Call App
        </h1>
        <p className="text-gray-200 text-lg">
          Connect. Stream. Communicate in real time.
        </p>
      </div>

      <ConnectedUsers users={connectedUsers} onStartCall={startCall} />

      {incomingCall && (
        <IncomingCallModal
          callerEmail={incomingCall.email}
          acceptCall={acceptCall}
          declineCall={declineCall}
        />
      )}

      <VideoSection
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        started={started}
        endCall={endCall}
      />
    </div>
  );
}

export default App;
