import { useEffect, useRef } from "react";

export default function IncomingCallModal({ callerEmail, acceptCall, declineCall }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        // In case autoplay is blocked, log or handle it
        console.log("Autoplay blocked:", err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      {/* Ringtone audio */}
      <audio ref={audioRef} loop src={import.meta.env.VITE_RINGTONE} />

      <div className="bg-white text-black rounded-xl p-6 w-80 text-center shadow-lg">
        <h2 className="text-lg font-bold mb-2">Incoming Call</h2>
        <p className="mb-4">📞 {callerEmail} is calling you</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => { audioRef.current.pause(); acceptCall(); }}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Accept
          </button>
          <button
            onClick={() => { audioRef.current.pause(); declineCall(); }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
