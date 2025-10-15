export default function IncomingCallModal({ acceptCall, declineCall }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg flex flex-col gap-4 items-center">
        <p>📞 Incoming call...</p>
        <div className="flex gap-4">
          <button
            onClick={acceptCall}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Accept
          </button>
          <button
            onClick={declineCall}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
