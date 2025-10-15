export default function VideoSection({ localVideoRef, remoteVideoRef }) {
  return (
    <div className="relative z-10 flex flex-wrap justify-center items-center gap-8 w-full max-w-6xl">
      <div className="flex flex-col items-center">
        <h4 className="mb-2 font-semibold">🎥 You</h4>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="rounded-2xl shadow-lg border-2 border-white/30 w-80 h-56 md:w-[420px] md:h-[280px] object-cover bg-black/40"
        />
      </div>

      <div className="flex flex-col items-center">
        <h4 className="mb-2 font-semibold">📡 Remote User</h4>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="rounded-2xl shadow-lg border-2 border-white/30 w-80 h-56 md:w-[420px] md:h-[280px] object-cover bg-black/40"
        />
      </div>
    </div>
  );
}
