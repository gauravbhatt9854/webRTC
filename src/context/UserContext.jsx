import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [email, setEmail] = useState("");

  // On mount, read from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const updateEmail = (newEmail) => {
    setEmail(newEmail);
    localStorage.setItem("userEmail", newEmail);
  };

  return (
    <UserContext.Provider value={{ email, updateEmail }}>
      {children}
    </UserContext.Provider>
  );
};
