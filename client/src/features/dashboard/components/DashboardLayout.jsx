import React, { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import { DashboardProvider } from "../context/DashboardContext.jsx";
import useDashboard from "../hooks/useDashboard.js";
import Sidebar from "./Sidebar.jsx";
import DashboardHeader from "./DashboardHeader.jsx";
import UserDashboard from "../pages/UserDashboard.jsx";
import SellerDashboard from "../pages/SellerDashboard.jsx";
import SEO from "../../shared/components/SEO.jsx";
import { getNotificationsApi, getConversationsApi } from "../services/dashboard.api.js";

const DashboardLayoutContent = () => {
  const { user } = useAuth();
  const { dashboardMode, setDashboardMode, isSellerVerified } = useDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const paramMode = searchParams.get("mode");
  const paramTab = searchParams.get("tab");

  // Fetch count indicators for sidebar pills (notifications & chats)
  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const notifRes = await getNotificationsApi();
        const notificationsList = notifRes.success && notifRes.data?.notifications;
        if (Array.isArray(notificationsList)) {
          const unreadNotifs = notificationsList.filter(n => !n.isRead).length;
          setNotificationsCount(unreadNotifs);
        }

        const chatRes = await getConversationsApi();
        const conversationsList = chatRes.success && chatRes.data?.conversations;
        if (Array.isArray(conversationsList)) {
          // Count conversations where the last message was sent by other participant and is unread
          // Or simple unread counts:
          let unreadChats = 0;
          conversationsList.forEach(c => {
            if (c.lastMessage && c.lastMessage.sender !== user._id && !c.lastMessage.isRead) {
              unreadChats++;
            }
          });
          setUnreadMessagesCount(unreadChats);
        }
      } catch (err) {
        console.error("Error fetching counts in layout:", err);
      }
    };

    fetchCounts();
    // Refresh indicators every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync state between SearchParams and Context
  useEffect(() => {
    const defaultTab = dashboardMode === "seller" ? "overview" : "home";
    
    if (!paramMode || !paramTab) {
      setSearchParams({
        mode: dashboardMode,
        tab: defaultTab,
      }, { replace: true });
    } else {
      // Guard: Unauthorized access to seller panel
      if (paramMode === "seller" && !isSellerVerified) {
        setSearchParams({
          mode: "user",
          tab: "home",
        }, { replace: true });
      } else if (paramMode !== dashboardMode) {
        // Update context mode to match URL
        setDashboardMode(paramMode);
      }
    }
  }, [paramMode, paramTab, dashboardMode, isSellerVerified, setSearchParams]);

  const activeTab = paramTab || (dashboardMode === "seller" ? "overview" : "home");

  const personSchema = user ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.name,
    "email": user.email,
    "affiliation": {
      "@type": "Organization",
      "name": user.collegeName || "PustakMart University Partner"
    }
  } : null;

  const seoTitle = dashboardMode === "seller"
    ? `Seller Dashboard (${activeTab.toUpperCase()})`
    : `Student Dashboard (${activeTab.toUpperCase()})`;

  return (
    <div className="dashboard-main-layout-container">
      <SEO
        title={seoTitle}
        description={`Manage your pre-owned textbooks, chat with buyers and sellers, and edit your profile settings on PustakMart.`}
        keywords="student dashboard, used books sell panel, manage textbook requests"
        schema={personSchema}
      />
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)}
        notificationsCount={notificationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Workspace Panel */}
      <div className="dashboard-content-main-wrapper">
        <DashboardHeader 
          onMenuToggle={() => setIsMobileSidebarOpen(true)} 
          activeTabLabel={activeTab}
          notificationsCount={notificationsCount}
        />

        {/* View Router Main Switch */}
        <main className="dashboard-view-workspace-area">
          {dashboardMode === "seller" ? (
            <SellerDashboard 
              activeTab={activeTab} 
              onNotificationsRefresh={() => {}}
            />
          ) : (
            <UserDashboard 
              activeTab={activeTab} 
              onNotificationsRefresh={() => setNotificationsCount(prev => Math.max(0, prev - 1))}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// Export wrapped with the Context Provider
export const DashboardLayout = () => {
  return (
    <DashboardProvider>
      <DashboardLayoutContent />
    </DashboardProvider>
  );
};

export default DashboardLayout;
