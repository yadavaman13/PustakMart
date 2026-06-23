import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useDashboard from "../hooks/useDashboard.js";

export const DashboardSwitcher = () => {
  const { dashboardMode, setDashboardMode, isSellerVerified } = useDashboard();
  const [, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMode = (mode) => {
    setDashboardMode(mode);
    setSearchParams({
      mode,
      tab: mode === "seller" ? "overview" : "home",
    });
    setIsOpen(false);
  };

  if (!isSellerVerified) {
    return null; // Hide switcher entirely if user is not a verified seller
  }

  return (
    <div className="dashboard-switcher-container" ref={dropdownRef}>
      <button 
        className="switcher-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="current-mode-label">
          {dashboardMode === "seller" ? "Seller Dashboard" : "User Dashboard"}
        </span>
        <i className={`ri-arrow-down-s-line chevron-icon ${isOpen ? "rotate" : ""}`}></i>
      </button>

      {isOpen && (
        <ul className="switcher-dropdown-list" role="listbox">
          <li 
            className={`switcher-dropdown-item ${dashboardMode === "user" ? "active" : ""}`}
            onClick={() => handleSelectMode("user")}
            role="option"
            aria-selected={dashboardMode === "user"}
          >
            <div className="item-content">
              <i className="ri-user-line item-icon"></i>
              <span className="item-label">User Dashboard</span>
            </div>
            {dashboardMode === "user" && <i className="ri-check-line check-icon"></i>}
          </li>
          <li 
            className={`switcher-dropdown-item ${dashboardMode === "seller" ? "active" : ""}`}
            onClick={() => handleSelectMode("seller")}
            role="option"
            aria-selected={dashboardMode === "seller"}
          >
            <div className="item-content">
              <i className="ri-store-2-line item-icon"></i>
              <span className="item-label">Seller Dashboard</span>
            </div>
            {dashboardMode === "seller" && <i className="ri-check-line check-icon"></i>}
          </li>
        </ul>
      )}
    </div>
  );
};

export default DashboardSwitcher;
