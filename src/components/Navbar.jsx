import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";

export default function Navbar() {
  const { email, updateEmail } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setTempEmail(storedEmail);
      if (!email) updateEmail(storedEmail);
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
    updateEmail(trimmed);
    localStorage.setItem("userEmail", trimmed);
    setIsEditing(false);
    setDropdownOpen(false);
  };

  const handleCancel = () => {
    const storedEmail = localStorage.getItem("userEmail") || "";
    setTempEmail(storedEmail); // reset input
    setDropdownOpen(false);
  };

  return (
<nav className="flex justify-end items-center relative bg-white shadow-md rounded-b-lg p-2 sm:p-4">
  {/* Profile Button */}
  <button
    onClick={() => setDropdownOpen(!dropdownOpen)}
    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition shadow-sm max-w-full truncate"
  >
    <span className="font-medium text-gray-800 truncate max-w-[120px] sm:max-w-xs">
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
    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg text-black p-4 z-20 border border-gray-200 max-w-[90vw] sm:max-w-xs">
      <div className="flex flex-col gap-3 w-full">
        <input
          type="email"
          value={tempEmail}
          onChange={(e) => setTempEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-300 text-gray-600 hover:bg-gray-400 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
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
