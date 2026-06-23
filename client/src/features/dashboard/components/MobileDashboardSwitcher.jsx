import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useDashboard from "../hooks/useDashboard.js";

export const MobileDashboardSwitcher = ({ isOpen, onClose }) => {
  const { dashboardMode, setDashboardMode, isSellerVerified } = useDashboard();
  const [, setSearchParams] = useSearchParams();
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Synchronize animation cycle on opening/closing
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden"; // Prevent scrolling behind overlay
    } else {
      const timer = setTimeout(() => setShouldRender(false), 250); // wait for fade animation
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !isSellerVerified) {
    return null;
  }

  const handleSelectMode = (mode) => {
    setDashboardMode(mode);
    setSearchParams({
      mode,
      tab: mode === "seller" ? "overview" : "home",
    });
    onClose();
  };

  return (
    <div className={`mobile-switcher-overlay ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div 
        className={`mobile-switcher-bottom-sheet ${isOpen ? "slide-up" : "slide-down"}`}
        onClick={(e) => e.stopPropagation()} // Stop bubble up
      >
        {/* Notch pull-bar */}
        <div className="sheet-handle"></div>

        <div className="sheet-header">
          <h3>Switch Dashboard Mode</h3>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close panel">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="sheet-body">
          <button 
            className={`sheet-option-card ${dashboardMode === "user" ? "selected" : ""}`}
            onClick={() => handleSelectMode("user")}
          >
            <div className="option-icon-box user-mode">
              <i className="ri-user-line"></i>
            </div>
            <div className="option-text-box">
              <h4>User Dashboard</h4>
              <p>Browse books, view request listings, saved bookmarks, and message sellers.</p>
            </div>
            {dashboardMode === "user" && <i className="ri-checkbox-circle-fill check-indicator"></i>}
          </button>

          <button 
            className={`sheet-option-card ${dashboardMode === "seller" ? "selected" : ""}`}
            onClick={() => handleSelectMode("seller")}
          >
            <div className="option-icon-box seller-mode">
              <i className="ri-store-2-line"></i>
            </div>
            <div className="option-text-box">
              <h4>Seller Dashboard</h4>
              <p>Manage your listings, look up analytics, answer buy requests, and check profile status.</p>
            </div>
            {dashboardMode === "seller" && <i className="ri-checkbox-circle-fill check-indicator"></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardSwitcher;
