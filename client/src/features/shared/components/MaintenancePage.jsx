import React, { useState } from "react";
import logoImg from "../../../assets/logo.jpg";
import "./MaintenancePage.scss";

/**
 * MaintenancePage - Screen displayed when application-level maintenance is active.
 * Provides retry mechanism and a subtle link for admin login.
 */
export default function MaintenancePage({ message, startedAt, onRetry }) {
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const handleRetry = async () => {
    if (checking || cooldown) return;
    setChecking(true);
    
    // Trigger the check from the parent component
    if (onRetry) {
      await onRetry();
    }

    setChecking(false);
    // Cooldown to prevent spam clicks
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 1500);
  };

  // Format the started time cleanly
  const formatStartedTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="maintenance-page-wrapper">
      <div className="maintenance-glass-card">
        <header className="maintenance-header">
          <img src={logoImg} alt="PustakMart" className="maintenance-logo" />
          <h1 className="maintenance-brand-title">PustakMart</h1>
        </header>

        <div className="maintenance-icon-glow">
          <div className="pulse-ring"></div>
          <i className="ri-tools-line maintenance-icon"></i>
        </div>

        <h2 className="maintenance-status-heading">System Under Maintenance</h2>
        
        <p className="maintenance-message">
          {message || "We're currently making improvements to make your experience better. We'll be back shortly."}
        </p>

        {startedAt && (
          <div className="maintenance-time-box">
            <span className="time-label">Started:</span>
            <span className="time-value">{formatStartedTime(startedAt)}</span>
          </div>
        )}

        <div className="maintenance-actions">
          <button 
            className={`btn-retry ${checking ? "loading" : ""} ${cooldown ? "disabled" : ""}`}
            onClick={handleRetry}
            disabled={checking || cooldown}
          >
            {checking ? (
              <>
                <span className="mini-spinner"></span>
                Checking Status...
              </>
            ) : cooldown ? (
              "Checking completed"
            ) : (
              "Try Again"
            )}
          </button>
        </div>

        <footer className="maintenance-footer">
          <p>© {new Date().getFullYear()} PustakMart. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
