export default function IncomingCallModal({ callerEmail, acceptCall, declineCall }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
            <div className="bg-white text-black rounded-xl p-6 w-full max-w-xs sm:max-w-sm text-center shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold mb-2">Incoming Call</h2>
                <p className="mb-4 text-sm sm:text-base truncate">📞 {callerEmail} is calling you</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                        onClick={acceptCall}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto transition"
                    >
                        Accept
                    </button>
                    <button
                        onClick={declineCall}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full sm:w-auto transition"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
