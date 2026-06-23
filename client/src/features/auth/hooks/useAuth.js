import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

/**
 * Custom React hook to access PustakMart global authentication context.
 * 
 * @returns {object} Auth state variables and methods.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
