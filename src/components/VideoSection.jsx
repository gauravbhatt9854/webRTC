import { useState } from "react";

export default function VideoSection({ localVideoRef, remoteVideoRef, pcRef, socketRef }) {
  const [callActive, setCallActive] = useState(false);

  const endCall = () => {
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Notify remote user
    if (socketRef.current) {
      socketRef.current.emit("cut-call"); // backend should handle this event
    }

    setCallActive(false);
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-6xl px-2 sm:px-4">

      {/* Videos */}
      <div className="flex flex-wrap justify-center items-center gap-6 w-full">
        <div className="flex flex-col items-center w-full sm:w-auto">
          <h4 className="mb-2 font-semibold text-sm sm:text-base md:text-lg">🎥 You</h4>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="rounded-2xl shadow-lg border-2 border-white/30 w-full max-w-[320px] sm:w-80 sm:h-56 md:w-[420px] md:h-[280px] object-cover bg-black/40"
          />
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto">
          <h4 className="mb-2 font-semibold text-sm sm:text-base md:text-lg">📡 Remote User</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="rounded-2xl shadow-lg border-2 border-white/30 w-full max-w-[320px] sm:w-80 sm:h-56 md:w-[420px] md:h-[280px] object-cover bg-black/40"
          />
        </div>
      </div>

      {/* End Call Button */}
      {callActive && (
        <button
          onClick={endCall}
          className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition text-sm sm:text-base"
        >
          📞 End Call
        </button>
      )}
    </div>

  );
}
