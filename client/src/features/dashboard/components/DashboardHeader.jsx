import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import useDashboard from "../hooks/useDashboard.js";
import MobileDashboardSwitcher from "./MobileDashboardSwitcher.jsx";

export const DashboardHeader = ({ 
  onMenuToggle, 
  activeTabLabel = "Home",
  notificationsCount = 0
}) => {
  const { user } = useAuth();
  const { dashboardMode, setDashboardMode, isSellerVerified } = useDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const formatTitle = (label) => {
    // Make text pretty (e.g. create-listing -> Create Listing)
    return label
      .replace(/-/g, " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handleSelectMode = (mode) => {
    setDashboardMode(mode);
    setSearchParams({
      mode,
      tab: mode === "seller" ? "overview" : "home",
    });
  };

  const userAvatar = user?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png";

  return (
    <>
      <header className="dashboard-top-navbar-header">
        {/* Left: Mobile hamburger menu toggle */}
        <button 
          className="mobile-sidebar-hamburger-btn" 
          onClick={onMenuToggle}
          aria-label="Open sidebar menu"
        >
          <i className="ri-menu-2-line"></i>
        </button>

        {/* Dynamic Title / Current Location */}
        <div className="header-location-breadcrumb">
          <span className="dashboard-context-prefix-badge">
            {dashboardMode === "seller" ? "Seller Panel" : "Marketplace"}
          </span>
          <span className="breadcrumb-chevron-separator">/</span>
          <h1 className="active-view-heading-title">{formatTitle(activeTabLabel)}</h1>
        </div>

        {/* Middle: Mode Switcher */}
        {isSellerVerified && (
          <>
            {/* Desktop Mode Switcher Pill */}
            <div className="dashboard-mode-toggle-pill">
              <button 
                className={`mode-toggle-btn ${dashboardMode === 'user' ? 'active' : ''}`}
                onClick={() => handleSelectMode('user')}
              >
                <i className="ri-user-line"></i> Buyer Mode
              </button>
              <button 
                className={`mode-toggle-btn ${dashboardMode === 'seller' ? 'active' : ''}`}
                onClick={() => handleSelectMode('seller')}
              >
                <i className="ri-store-2-line"></i> Seller Mode
              </button>
            </div>

            {/* Mobile Mode Switcher Trigger */}
            <button 
              className="mobile-top-dashboard-switcher-btn"
              onClick={() => setIsMobileSheetOpen(true)}
            >
              <span>{dashboardMode === "seller" ? "Seller Dashboard" : "User Dashboard"}</span>
              <i className="ri-arrow-down-s-line"></i>
            </button>
          </>
        )}

        {/* Right: Seller badge, user avatar shortcut */}
        <div className="header-actions-area">
          {/* Verified Seller Badge */}
          {user?.sellerStatus === "verified" && (
            <div className="verified-seller-badge-container">
              <i className="ri-shield-check-fill check-badge-icon"></i>
              <span className="badge-label-text">Verified Seller</span>
            </div>
          )}

          {/* Quick status dots */}
          <div className="network-status-indicator">
            <span className="status-online-dot"></span>
            <span className="status-label-text">Live</span>
          </div>

          {/* Avatar avatar badge */}
          <div className="header-avatar-circle">
            <img src={userAvatar} alt="Header Avatar" />
          </div>
        </div>
      </header>

      {/* Unified Mobile Bottom Sheet Switcher */}
      {isSellerVerified && (
        <MobileDashboardSwitcher 
          isOpen={isMobileSheetOpen} 
          onClose={() => setIsMobileSheetOpen(false)} 
        />
      )}
    </>
  );
};

export default DashboardHeader;
