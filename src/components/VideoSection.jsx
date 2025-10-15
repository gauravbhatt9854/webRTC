export default function VideoSection({ localVideoRef, remoteVideoRef, started, endCall }) {
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="flex gap-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-48 h-36 bg-black rounded"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-48 h-36 bg-black rounded"
        />
      </div>

      {started && (
        <button
          onClick={endCall}
          className="px-4 py-2 bg-red-600 text-white rounded mt-4"
        >
          End Call
        </button>
      )}
    </div>
  );
}
