import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";

export default function Navbar() {
  const { email, updateEmail } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // On mount, initialize tempEmail from context or localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setTempEmail(storedEmail);
      if (!email) updateEmail(storedEmail); // sync context
    } else if (!email) {
      setDropdownOpen(true);
      setIsEditing(true);
    }
  }, []);

  const handleSave = () => {
    const trimmed = tempEmail.trim();
    if (!trimmed) {
      alert("Please enter a valid email!");
      return;
    }

    // Update context and localStorage
    updateEmail(trimmed);
    localStorage.setItem("userEmail", trimmed);

    setIsEditing(false);
    setDropdownOpen(false);
  };

  return (
    <nav className="flex justify-end items-center p-4 relative">
      {/* Profile Button */}
      <button
        onClick={() => {
          if (!email) return; // don't allow closing if email is empty
          setDropdownOpen(!dropdownOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-200 transition"
      >
        <span className="font-medium text-gray-800">
          {email || "Enter your email"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg text-black p-4 z-20">
          <div className="flex flex-col gap-3 w-full">
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex justify-end gap-2">
              {!email && (
                <button
                  disabled
                  className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
