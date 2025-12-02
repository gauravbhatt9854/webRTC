import { useEffect, useState } from "react";
import { getCameraList } from "../hooks/mediaUtils";

export default function VideoSection({
  localVideoRef,
  remoteVideoRef,
  started,
  endCall,
  switchCamera,
  toggleVideo,
  toggleMic,
  videoOn,
  micOn,
}) {
  const [cameraList, setCameraList] = useState([]);

  // Load real camera list on mount
  useEffect(() => {
    async function loadCameras() {
      const cams = await getCameraList();
      setCameraList(cams);
    }
    loadCameras();
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 mt-8 w-full max-w-[90vw]">

      {/* Camera List */}
      {cameraList.length > 0 && (
        <div className="text-sm text-gray-600">
          <strong>Cameras:</strong>{" "}
          {cameraList.map((c, i) => (
            <span key={i}>
              {c.label}
              {i < cameraList.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}

      {/* Video Container */}
      <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full md:w-96 h-64 md:h-72 bg-black rounded-lg shadow-md"
        />

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full md:w-96 h-64 md:h-72 bg-black rounded-lg shadow-md"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap justify-center mt-4">

        {/* Toggle video */}
        <button
          onClick={() => toggleVideo()}
          className={`px-4 py-2 rounded-lg shadow-md transition ${
            videoOn ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-700"
          }`}
        >
          {videoOn ? "Video On" : "Video Off"}
        </button>

        {/* Toggle mic */}
        <button
          onClick={() => toggleMic()}
          className={`px-4 py-2 rounded-lg shadow-md transition ${
            micOn ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
          }`}
        >
          {micOn ? "Mic On" : "Mic Off"}
        </button>

        {/* Switch camera */}
        {cameraList.length > 1 && (
          <button
            onClick={() => switchCamera()}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-white shadow-md hover:bg-yellow-600 transition"
          >
            Switch Camera
          </button>
        )}

        {/* End Call */}
        {started && (
          <button
            onClick={endCall}
            className="px-4 py-2 rounded-lg bg-red-600 text-white shadow-md hover:bg-red-700 transition"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
