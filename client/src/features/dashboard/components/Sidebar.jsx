import React from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import useDashboard from "../hooks/useDashboard.js";
import DashboardSwitcher from "./DashboardSwitcher.jsx";
import SidebarItem from "./SidebarItem.jsx";
import logoImg from "../../../assets/logo.jpg";

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  notificationsCount = 0, 
  unreadMessagesCount = 0 
}) => {
  const { user, logout } = useAuth();
  const { dashboardMode } = useDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || (dashboardMode === "seller" ? "overview" : "home");

  const handleTabClick = (tabId) => {
    setSearchParams({ mode: dashboardMode, tab: tabId });
    onClose(); // Close sidebar drawer on mobile
  };

  const handleLogout = async () => {
    await logout();
  };

  const userAvatar = user?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png";

  return (
    <>
      <aside className={`dashboard-sidebar-container ${isOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-section">
          <img src={logoImg} alt="PustakMart logo" className="brand-logo-img" />
          <div className="brand-text-box">
            <h2>PustakMart</h2>
            <span className="brand-subtitle">Student Portal</span>
          </div>
          <button className="sidebar-close-toggle-btn" onClick={onClose} aria-label="Close menu">
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* User Card & Switcher */}
        <div className="sidebar-profile-card">
          <div className="profile-details-row">
            <img src={userAvatar} alt="Avatar" className="user-avatar-img" />
            <div className="user-info-text">
              <h4>{user?.name || "Student User"}</h4>
              <p className="user-college-name">{user?.collegeName || "SVNIT Campus"}</p>
            </div>
          </div>
          {/* Unified Mode Switcher Dropdown */}
          <DashboardSwitcher />
        </div>

        {/* Navigation Group Scrollers */}
        <nav className="sidebar-nav-menu">
          {dashboardMode === "user" ? (
            <>
              {/* Marketplace Group */}
              <div className="nav-group">
                <span className="nav-group-title">Marketplace</span>
                <SidebarItem 
                  label="Home" 
                  icon="ri-home-5-line" 
                  active={activeTab === "home"} 
                  onClick={() => handleTabClick("home")} 
                />
                <SidebarItem 
                  label="Browse Books" 
                  icon="ri-search-2-line" 
                  active={activeTab === "browse"} 
                  onClick={() => handleTabClick("browse")} 
                />
                <SidebarItem 
                  label="Book Requests" 
                  icon="ri-book-open-line" 
                  active={activeTab === "requests"} 
                  onClick={() => handleTabClick("requests")} 
                />
                <SidebarItem 
                  label="Saved Books" 
                  icon="ri-bookmark-line" 
                  active={activeTab === "saved"} 
                  onClick={() => handleTabClick("saved")} 
                />
                <SidebarItem 
                  label="Messages" 
                  icon="ri-chat-3-line" 
                  active={activeTab === "messages"} 
                  onClick={() => handleTabClick("messages")}
                  badge={unreadMessagesCount}
                  badgeType="success"
                />
              </div>

              {/* Account Group */}
              <div className="nav-group">
                <span className="nav-group-title">Account</span>
                <SidebarItem 
                  label="Notifications" 
                  icon="ri-notification-3-line" 
                  active={activeTab === "notifications"} 
                  onClick={() => handleTabClick("notifications")}
                  badge={notificationsCount}
                  badgeType="error"
                />
                <SidebarItem 
                  label="Profile" 
                  icon="ri-user-settings-line" 
                  active={activeTab === "profile"} 
                  onClick={() => handleTabClick("profile")} 
                />
                <SidebarItem 
                  label="Settings" 
                  icon="ri-settings-4-line" 
                  active={activeTab === "settings"} 
                  onClick={() => handleTabClick("settings")} 
                />
              </div>
            </>
          ) : (
            <>
              {/* Business Group */}
              <div className="nav-group">
                <span className="nav-group-title">Business</span>
                <SidebarItem 
                  label="Dashboard Overview" 
                  icon="ri-bar-chart-box-line" 
                  active={activeTab === "overview"} 
                  onClick={() => handleTabClick("overview")} 
                />
                <SidebarItem 
                  label="Listings" 
                  icon="ri-folders-line" 
                  active={activeTab === "listings"} 
                  onClick={() => handleTabClick("listings")} 
                />
                <SidebarItem 
                  label="Create Listing" 
                  icon="ri-add-box-line" 
                  active={activeTab === "create-listing"} 
                  onClick={() => handleTabClick("create-listing")} 
                />
                <SidebarItem 
                  label="Requests" 
                  icon="ri-survey-line" 
                  active={activeTab === "requests-buyer"} 
                  onClick={() => handleTabClick("requests-buyer")} 
                />
                <SidebarItem 
                  label="Messages" 
                  icon="ri-chat-smile-2-line" 
                  active={activeTab === "messages"} 
                  onClick={() => handleTabClick("messages")}
                  badge={unreadMessagesCount}
                  badgeType="success"
                />
              </div>

              {/* Analytics Group */}
              <div className="nav-group">
                <span className="nav-group-title">Analytics</span>
                <SidebarItem 
                  label="Sales Analytics" 
                  icon="ri-pie-chart-2-line" 
                  active={activeTab === "sales-analytics"} 
                  onClick={() => handleTabClick("sales-analytics")} 
                />
                <SidebarItem 
                  label="Views" 
                  icon="ri-eye-line" 
                  active={activeTab === "views"} 
                  onClick={() => handleTabClick("views")} 
                />
                <SidebarItem 
                  label="Reviews" 
                  icon="ri-star-smile-line" 
                  active={activeTab === "reviews"} 
                  onClick={() => handleTabClick("reviews")} 
                />
              </div>

              {/* Seller Settings Group */}
              <div className="nav-group">
                <span className="nav-group-title">Seller</span>
                <SidebarItem 
                  label="Seller Profile" 
                  icon="ri-profile-line" 
                  active={activeTab === "seller-profile"} 
                  onClick={() => handleTabClick("seller-profile")} 
                />
              </div>
            </>
          )}
        </nav>

        {/* Footer Logout Section */}
        <div className="sidebar-footer-action-bar">
          <button className="sidebar-logout-trigger-btn" onClick={handleLogout}>
            <i className="ri-logout-box-r-line"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile screen drawer */}
      {isOpen && (
        <div className="dashboard-sidebar-mobile-backdrop" onClick={onClose}></div>
      )}
    </>
  );
};

export default Sidebar;
