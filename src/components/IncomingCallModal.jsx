export default function IncomingCallModal({ callerEmail, acceptCall, declineCall }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black rounded-xl p-6 w-80 text-center shadow-lg">
        <h2 className="text-lg font-bold mb-2">Incoming Call</h2>
        <p className="mb-4">📞 {callerEmail} is calling you</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={acceptCall}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Accept
          </button>
          <button
            onClick={declineCall}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
