import { useState } from "react";

export default function ConnectedUsers({ users, onStartCall }) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter users based on search input
    const filteredUsers = users.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-lg mx-auto mb-8 border border-white/20 p-4 px-3 sm:px-4">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-center">Connected Users</h3>

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black text-sm sm:text-base"
            />

            {/* Scrollable User List */}
            <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div
                            key={user.socketId}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30 transition gap-2 sm:gap-0"
                        >
                            <span className="truncate text-sm sm:text-base w-full sm:w-auto">👤 {user.email}</span>
                            <button
                                onClick={() => onStartCall(user.socketId)}
                                className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-full text-sm sm:text-base font-semibold transition mt-1 sm:mt-0"
                            >
                                Start Call
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-200 text-sm sm:text-base">No users found</p>
                )}
            </div>
        </div>

    );
}
