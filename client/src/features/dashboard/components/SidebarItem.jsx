import React from "react";

export const SidebarItem = ({ label, icon, active, onClick, badge, badgeType = "brand" }) => {
  return (
    <button 
      className={`sidebar-menu-item-btn ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <i className={`menu-item-icon ${icon}`}></i>
      <span className="menu-item-label">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`menu-item-badge-pill ${badgeType}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

export default SidebarItem;
