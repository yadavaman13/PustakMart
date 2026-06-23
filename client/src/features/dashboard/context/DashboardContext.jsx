import React, { createContext, useState, useEffect, useContext } from "react";
import useAuth from "../../auth/hooks/useAuth.js";

export const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize dashboard mode from localStorage, fallback to "user"
  const [dashboardMode, setDashboardModeState] = useState(() => {
    const saved = localStorage.getItem("dashboardMode");
    return saved === "seller" ? "seller" : "user";
  });

  const isSellerVerified = user?.sellerStatus === "verified";

  // Force "user" mode if the user is not verified as a seller or logs out
  useEffect(() => {
    if (!user) {
      setDashboardModeState("user");
      localStorage.setItem("dashboardMode", "user");
    } else if (user.sellerStatus !== "verified" && dashboardMode === "seller") {
      setDashboardModeState("user");
      localStorage.setItem("dashboardMode", "user");
    }
  }, [user, dashboardMode]);

  const setDashboardMode = (mode) => {
    if (mode === "seller" && !isSellerVerified) {
      console.warn("User is not a verified seller. Cannot switch to Seller Dashboard.");
      return;
    }
    const targetMode = mode === "seller" ? "seller" : "user";
    setDashboardModeState(targetMode);
    localStorage.setItem("dashboardMode", targetMode);
  };

  const toggleDashboardMode = () => {
    const nextMode = dashboardMode === "user" ? "seller" : "user";
    if (nextMode === "seller" && !isSellerVerified) {
      return;
    }
    setDashboardMode(nextMode);
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboardMode,
        setDashboardMode,
        toggleDashboardMode,
        isSellerVerified,
        sellerStatus: user?.sellerStatus || "not_applied",
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
