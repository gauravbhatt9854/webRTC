import { useState } from "react";

export default function ConnectedUsers({ users, onStartCall }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search input
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-lg mb-8 border border-white/20 p-4">
      <h3 className="text-lg font-semibold mb-3 text-center">Connected Users</h3>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
      />

      {/* Scrollable User List */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.socketId}
              className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30 transition"
            >
              <span className="truncate">👤 {user.email}</span>
              <button
                onClick={() => onStartCall(user.socketId)}
                className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold transition"
              >
                Start Call
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-200">No users found</p>
        )}
      </div>
    </div>
  );
}
