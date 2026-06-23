import React, { useState, useEffect } from "react";
import { useAdmin } from "../hooks/useAdmin.js";
import useAuth from "../../auth/hooks/useAuth.js";
import logoImg from "../../../assets/logo.jpg";

// Remix Icons
const DashboardIcon = () => <i className="ri-dashboard-line"></i>;
const UsersIcon = () => <i className="ri-group-line"></i>;
const BooksIcon = () => <i className="ri-book-3-line"></i>;
const ReportsIcon = () => <i className="ri-flag-line"></i>;
const LogoutIcon = () => <i className="ri-logout-box-line"></i>;

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const {
    analytics,
    users,
    pendingSellers,
    listings,
    reports,
    loading,
    error,
    success,
    clearMessages,
    verifySeller,
    updateUserStatus,
    resolveReport,
    fetchAllData,
  } = useAdmin();

  // Active view: 'overview' | 'users' | 'listings' | 'reports'
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Selected user application for verification modal review
  const [reviewSeller, setReviewSeller] = useState(null);
  const [adminComment, setAdminComment] = useState("");

  const handleOpenReviewModal = (seller) => {
    setAdminComment("");
    setReviewSeller(seller);
  };

  const handleCloseReviewModal = () => {
    setAdminComment("");
    setReviewSeller(null);
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Clean success/error popups on switching screens
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    clearMessages();
    setSearchQuery("");
    setIsMobileSidebarOpen(false); // Close sidebar drawer on tab switch
  };

  // Helper filters
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = listings.filter((l) => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.seller?.name && l.seller.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredReports = reports.filter((r) => 
    r.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.listing?.title && r.listing.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Trigger verify calls and close modal
  const handleVerifySellerAction = async (id, status) => {
    const res = await verifySeller(id, status, adminComment);
    if (res.success) {
      handleCloseReviewModal();
    }
  };

  const handleDownloadFile = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download document:", err);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <div className="admin-dashboard-container">
      
      {/* 1. FIXED LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src={logoImg} alt="PustakMart logo" className="brand-logo" />
          <div className="brand-text">
            <h2>PustakMart</h2>
            <span>Admin Control Panel</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Close Sidebar">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-group-title">Main Menu</div>
          <button 
            className={`menu-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            <UsersIcon />
            <span>Users & Verification</span>
            {pendingSellers.length > 0 && (
              <span className="pending-indicator-pill">{pendingSellers.length}</span>
            )}
          </button>
          
          <button 
            className={`menu-item ${activeTab === "listings" ? "active" : ""}`}
            onClick={() => handleTabChange("listings")}
          >
            <BooksIcon />
            <span>Book Listings</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => handleTabChange("reports")}
          >
            <ReportsIcon />
            <span>Flags & Reports</span>
            {reports.filter(r => r.status === "pending").length > 0 && (
              <span className="error-indicator-pill">
                {reports.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="admin-profile-box">
            <img 
              src={user?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
              alt="Avatar" 
              className="admin-avatar" 
            />
            <div className="admin-info">
              <h4>{user?.name || "System Admin"}</h4>
              <p>{user?.email || "admin@pustakmart.com"}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Backdrop for Mobile */}
      {isMobileSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)}></div>
      )}

      {/* 2. RIGHT CONTENT AREA PANEL */}
      <div className="admin-main-wrapper">
        
        {/* Top Header Navbar */}
        <header className="admin-navbar">
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Toggle Menu"
          >
            <i className="ri-menu-line"></i>
          </button>
          <div className="search-bar-container">
            <i className="ri-search-line"></i>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="navbar-actions">
            <span className="navbar-badge">Verified System Portal</span>
            <div className="status-indicator">
              <span className="dot online"></span>
              <span>Online</span>
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="admin-content-area">
          
          {/* Notification Alert Popups */}
          {error && <div className="auth-error-alert" style={{ marginBottom: "20px" }}>{error}</div>}
          {success && <div className="auth-success-alert" style={{ marginBottom: "20px" }}>{success}</div>}

          {/* Loader Overlay */}
          {loading && (
            <div className="admin-loading-spinner-overlay">
              <div className="spinner"></div>
              <p>Refreshing system data...</p>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD VIEW */}
          {activeTab === "overview" && (
            <div className="dashboard-overview-tab">
              <div className="tab-title-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, admin. Here's a brief stats breakdown of the PustakMart</p>
              </div>

              {/* Stats Card Rows */}
              <div className="analytics-card-grid">
                <div className="analytics-card">
                  <div className="card-top">
                    <span className="card-lbl">Total Registered Users</span>
                    <span className="card-badge bg-green">Active</span>
                  </div>
                  <h3>{analytics?.totalUsers || 0}</h3>
                  <p className="card-trend">Registered student profiles</p>
                </div>
                
                <div className="analytics-card">
                  <div className="card-top">
                    <span className="card-lbl">Verified Student Sellers</span>
                    <span className="card-badge bg-gold">Sellers</span>
                  </div>
                  <h3>{analytics?.activeSellers || 0}</h3>
                  <p className="card-trend">Student identities approved</p>
                </div>

                <div className="analytics-card">
                  <div className="card-top">
                    <span className="card-lbl">Active Book Listings</span>
                    <span className="card-badge bg-blue">Listings</span>
                  </div>
                  <h3>{analytics?.activeListings || 0}</h3>
                  <p className="card-trend">Available books across campuses</p>
                </div>

                <div className="analytics-card">
                  <div className="card-top">
                    <span className="card-lbl">Books Exchanged (Sold)</span>
                    <span className="card-badge bg-green">Completed</span>
                  </div>
                  <h3>{analytics?.booksSold || 0}</h3>
                  <p className="card-trend">Successfully sold matches</p>
                </div>

                <div className="analytics-card">
                  <div className="card-top">
                    <span className="card-lbl">Open Book Requests</span>
                    <span className="card-badge bg-red">Requests</span>
                  </div>
                  <h3>{analytics?.bookRequests || 0}</h3>
                  <p className="card-trend">Active student demand listings</p>
                </div>
              </div>

              {/* Secondary Layout splits */}
              <div className="dashboard-content-split">
                
                {/* Pending Sellers approvals card list */}
                <div className="split-column card-block">
                  <div className="block-header">
                    <h3>Pending Verification Applications ({pendingSellers.length})</h3>
                    <button className="view-link" onClick={() => handleTabChange("users")}>View All</button>
                  </div>
                  <div className="block-body">
                    {pendingSellers.length === 0 ? (
                      <p className="empty-lbl">No student verification requests at this moment.</p>
                    ) : (
                      <div className="pending-sellers-list">
                        {pendingSellers.slice(0, 4).map((seller) => (
                          <div key={seller._id} className="pending-seller-row">
                            <div className="seller-meta">
                              <img src={seller.ProfilePicture} alt="Avatar" className="small-avatar" />
                              <div>
                                <h5>{seller.name}</h5>
                                <p>{seller.email} • {seller.collegeName || "College"}</p>
                              </div>
                            </div>
                            <button 
                              className="btn-review"
                              onClick={() => handleOpenReviewModal(seller)}
                            >
                              Review ID
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flagged items summaries */}
                <div className="split-column card-block">
                  <div className="block-header">
                    <h3>Recent Reported Listings ({reports.filter(r => r.status === "pending").length})</h3>
                    <button className="view-link" onClick={() => handleTabChange("reports")}>View All</button>
                  </div>
                  <div className="block-body">
                    {reports.filter(r => r.status === "pending").length === 0 ? (
                      <p className="empty-lbl">No open reports. Marketplace is running smoothly!</p>
                    ) : (
                      <div className="pending-sellers-list">
                        {reports.filter(r => r.status === "pending").slice(0, 4).map((report) => (
                          <div key={report._id} className="pending-seller-row">
                            <div className="seller-meta">
                              <div className="report-alert-badge">!</div>
                              <div>
                                <h5>{report.listing?.title || "Unknown Book"}</h5>
                                <p>Reason: {report.reason}</p>
                              </div>
                            </div>
                            <button 
                              className="btn-review border-red"
                              onClick={() => handleTabChange("reports")}
                            >
                              Moderate
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: USERS & VERIFICATION PANEL */}
          {activeTab === "users" && (
            <div className="admin-management-tab">
              <div className="tab-title-header">
                <h1>Users & Verification</h1>
                <p>Manage registered user accounts, toggle blocking logs, or verify student college identity card uploads.</p>
              </div>

              {/* Users Table */}
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>College details</th>
                      <th>Joined Date</th>
                      <th>Role</th>
                      <th>Seller state</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }} className="empty-lbl">
                          No registered users found matching the query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((item) => (
                        <tr key={item._id} className={item.isBlocked ? "row-blocked" : ""}>
                          <td>
                            <div className="table-user-meta">
                              <img src={item.ProfilePicture} alt="User" />
                              <div>
                                <h5>{item.name}</h5>
                                <p>{item.email}</p>
                                <p>{item.mobileNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="college-info-block">
                              <p className="c-name">{item.collegeName || "College"}</p>
                              {item.department && <p className="c-sub">{item.department}</p>}
                              {item.semester && <p className="c-sub">Semester {item.semester}</p>}
                            </div>
                          </td>
                          <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge-pill ${item.role === "admin" ? "bg-red" : "bg-grey"}`}>
                              {item.role.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {item.sellerStatus === "pending" ? (
                              <button 
                                className="badge-pill bg-gold border-blink"
                                onClick={() => handleOpenReviewModal(item)}
                              >
                                Review ID Card
                              </button>
                            ) : (
                              <span className={`badge-pill ${
                                item.sellerStatus === "verified" ? "bg-green" : 
                                item.sellerStatus === "rejected" ? "bg-red" : "bg-grey"
                              }`}>
                                {item.sellerStatus.replace("_", " ").toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td>
                            {item.isDeleted ? (
                              <span className="badge-pill bg-red">DELETED</span>
                            ) : item.isBlocked ? (
                              <span className="badge-pill bg-red">BLOCKED</span>
                            ) : (
                              <span className="badge-pill bg-green">ACTIVE</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions">
                              {!item.isDeleted && (
                                <>
                                  <button 
                                    className={`btn-table ${item.isBlocked ? "btn-unblock" : "btn-block"}`}
                                    onClick={() => updateUserStatus(item._id, { isBlocked: !item.isBlocked })}
                                  >
                                    {item.isBlocked ? "Unblock" : "Block"}
                                  </button>
                                  <button 
                                    className="btn-table btn-delete"
                                    onClick={() => {
                                      if(confirm(`Are you sure you want to delete ${item.name}? This action is permanent.`)) {
                                        updateUserStatus(item._id, { isDeleted: true });
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BOOK LISTINGS MODERATION PANEL */}
          {activeTab === "listings" && (
            <div className="admin-management-tab">
              <div className="tab-title-header">
                <h1>Book Listings</h1>
                <p>Track academic book uploads, search listings, view seller contact credentials, and audit details.</p>
              </div>

              {/* Listings Table */}
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Book Cover</th>
                      <th>Title & Details</th>
                      <th>College Origin</th>
                      <th>Seller details</th>
                      <th>Exchanged value</th>
                      <th>Status</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }} className="empty-lbl">
                          No listing matches found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredListings.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <img 
                              src={item.bookImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=120"} 
                              alt="Book" 
                              className="table-book-cover"
                            />
                          </td>
                          <td>
                            <div className="book-info-block">
                              <h5>{item.title}</h5>
                              <p className="b-author">By {item.author || "Unknown author"}</p>
                              <p className="b-cat">{item.branch || "General"} • Semester {item.semester || "All"}</p>
                              {item.condition && <span className="cond-lbl">{item.condition.toUpperCase()}</span>}
                            </div>
                          </td>
                          <td>{item.collegeName || "College"}</td>
                          <td>
                            <div className="seller-contact">
                              <p className="s-name">{item.seller?.name || "Anonymous"}</p>
                              <p className="s-email">{item.seller?.email || "No email"}</p>
                            </div>
                          </td>
                          <td>
                            <span className="price-lbl">₹{item.price}</span>
                          </td>
                          <td>
                            <span className={`badge-pill ${
                              item.status === "active" ? "bg-green" : 
                              item.status === "sold" ? "bg-grey" : "bg-red"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{item.views || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FLAGS & REPORTS MODERATION */}
          {activeTab === "reports" && (
            <div className="admin-management-tab">
              <div className="tab-title-header">
                <h1>Flags & Reports</h1>
                <p>Moderate student complaints, review reported books, and remove listings violating community policies.</p>
              </div>

              {/* Reports Table */}
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Report Reason</th>
                      <th>Reporter</th>
                      <th>Reported Book</th>
                      <th>Exchanged Value</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }} className="empty-lbl">
                          No flags or reports submitted in the system.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="report-reason-block">
                              <p className="reason-text">{item.reason}</p>
                            </div>
                          </td>
                          <td>
                            <div className="reporter-contact">
                              <h5>{item.reporter?.name || "System audit"}</h5>
                              <p>{item.reporter?.email}</p>
                            </div>
                          </td>
                          <td>
                            <div className="reported-listing">
                              <h5>{item.listing?.title || "Deleted/Removed Listing"}</h5>
                              <p>Status: {item.listing?.status || "Removed"}</p>
                            </div>
                          </td>
                          <td>₹{item.listing?.price || 0}</td>
                          <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge-pill ${
                              item.status === "pending" ? "bg-gold" : 
                              item.status === "resolved" ? "bg-green" : "bg-grey"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {item.status === "pending" && (
                                <>
                                  <button 
                                    className="btn-table btn-unblock"
                                    onClick={() => resolveReport(item._id, "resolved")}
                                  >
                                    Resolve & Remove Book
                                  </button>
                                  <button 
                                    className="btn-table btn-delete"
                                    onClick={() => resolveReport(item._id, "dismissed")}
                                  >
                                    Dismiss
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. MODAL DIALOG OVERLAY: SELLER VERIFICATION ID REVIEW */}
      {reviewSeller && (
        <div className="admin-modal-backdrop" onClick={handleCloseReviewModal}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verify Student Seller Identity</h3>
              <button className="btn-close" onClick={handleCloseReviewModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="student-profile-summary">
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <img 
                    src={reviewSeller.ProfilePicture} 
                    alt="User" 
                    className="modal-profile-avatar"
                  />
                  <div>
                    <h4>{reviewSeller.name}</h4>
                    <p>{reviewSeller.email}</p>
                    <p>Contact: {reviewSeller.mobileNumber}</p>
                  </div>
                </div>

                <div className="detail-meta-table">
                  <div className="meta-row">
                    <span className="lbl">College Origin:</span>
                    <span className="val">{reviewSeller.collegeName || "College"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="lbl">Department:</span>
                    <span className="val">{reviewSeller.department || "Not specified"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="lbl">Semester:</span>
                    <span className="val">{reviewSeller.semester || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* ID Card preview image/PDF block */}
              <div className="id-card-preview-block">
                <h5>Uploaded Student Identity Card</h5>
                {reviewSeller.collegeIdCard ? (
                  (() => {
                    const isPdf = reviewSeller.collegeIdCard.toLowerCase().endsWith(".pdf");
                    const fileName = reviewSeller.collegeIdCard.substring(reviewSeller.collegeIdCard.lastIndexOf('/') + 1).split('?')[0] || "student_id_card.pdf";
                    return (
                      <>
                        <div className="document-download-card">
                          <div className="doc-info">
                            <div className={`icon-box ${isPdf ? 'pdf' : 'image'}`}>
                              <i className={isPdf ? "ri-file-pdf-fill" : "ri-image-fill"}></i>
                            </div>
                            <div className="text-box">
                              <h6>{isPdf ? "Student ID Card (PDF)" : "Student ID Card (Image)"}</h6>
                              <p title={fileName}>{fileName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-download"
                            onClick={() => handleDownloadFile(reviewSeller.collegeIdCard, fileName)}
                          >
                            <i className="ri-download-2-line"></i> Download
                          </button>
                        </div>
                        
                        {/* If it's an image, also show a small visual preview below the download card */}
                        {!isPdf && (
                          <div className="id-image-frame" style={{ marginTop: "12px" }}>
                            <img src={reviewSeller.collegeIdCard} alt="Student ID Card Upload" />
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className="no-id-fallback">
                    <p>No student ID card document was uploaded by the user.</p>
                  </div>
                )}
              </div>

              {/* Comment Textarea Input */}
              <div className="admin-comment-group">
                <label className="admin-comment-label" htmlFor="admin-review-comment">
                  Review Comment / remarks:
                </label>
                <textarea
                  id="admin-review-comment"
                  className="admin-comment-textarea"
                  placeholder="Enter remarks or rejection feedback here..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal btn-reject"
                disabled={loading}
                onClick={() => handleVerifySellerAction(reviewSeller._id, "rejected")}
              >
                Reject Application
              </button>
              <button 
                className="btn-modal btn-approve"
                disabled={loading || !reviewSeller.collegeIdCard}
                onClick={() => handleVerifySellerAction(reviewSeller._id, "verified")}
              >
                Approve Seller Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
