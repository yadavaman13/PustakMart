import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import { 
  getHomeListingsApi, 
  getBookRequestsApi, 
  createBookRequestApi, 
  deleteBookRequestApi,
  updateBookRequestApi,
  getSavedListingsApi, 
  toggleSaveListingApi,
  getConversationsApi, 
  getConversationMessagesApi, 
  sendMessageApi,
  createConversationApi,
  getNotificationsApi, 
  markNotificationReadApi,
  applySellerApi,
  getImageKitAuthParamsApi
} from "../services/dashboard.api.js";
import axios from "axios";
import ProfileSettingsView from "../components/ProfileSettingsView.jsx";

export const UserDashboard = ({ activeTab, onNotificationsRefresh }) => {
  const { user, checkSession } = useAuth();
  const [, setSearchParams] = useSearchParams();
  
  // Shared Loader and Messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // States for subviews
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [savedBooks, setSavedBooks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  
  // Browse Book Search Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  
  // Book Request creation states
  const [newRequestTitle, setNewRequestTitle] = useState("");
  const [newRequestDesc, setNewRequestDesc] = useState("");
  const [newRequestBudget, setNewRequestBudget] = useState("");
  const [newRequestDept, setNewRequestDept] = useState("");
  const [newRequestSem, setNewRequestSem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [requestsLimit, setRequestsLimit] = useState(5);

  // Chat/Messages State
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Profile status application states
  const [idCardFile, setIdCardFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clear states helpers
  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    clearAlerts();
    if (activeTab === "home") {
      fetchHomeOverviewData();
    } else if (activeTab === "browse") {
      fetchBrowseListings();
    } else if (activeTab === "requests") {
      fetchBookRequests();
    } else if (activeTab === "saved") {
      fetchSavedListings();
    } else if (activeTab === "messages") {
      fetchChatConversations();
    } else if (activeTab === "notifications") {
      fetchUserNotifications();
    }
  }, [activeTab]);

  // --- API Fetch Handlers ---
  
  const fetchHomeOverviewData = async () => {
    try {
      setLoading(true);
      const listRes = await getHomeListingsApi({ limit: 5 });
      if (listRes.success) setListings(listRes.listings);
      
      const reqRes = await getBookRequestsApi();
      if (reqRes.success) setRequests(reqRes.requests || []);
      
      const savedRes = await getSavedListingsApi();
      if (savedRes.success) setSavedBooks(savedRes.data?.bookmarks || []);
      
      const notifRes = await getNotificationsApi();
      if (notifRes.success) setNotifications(notifRes.data?.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrowseListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (deptFilter) params.department = deptFilter;
      
      const res = await getHomeListingsApi(params);
      if (res.success) {
        setListings(res.listings);
      }
    } catch (err) {
      setError("Failed to fetch book catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookRequests = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getBookRequestsApi();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      setError("Failed to retrieve requests list");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchSavedListings = async () => {
    try {
      setLoading(true);
      const res = await getSavedListingsApi();
      if (res.success) {
        setSavedBooks(res.data?.bookmarks || []);
      }
    } catch (err) {
      setError("Failed to load bookmark folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversationsApi();
      if (res.success) {
        setChats(res.data?.conversations || []);
      }
    } catch (err) {
      setError("Failed to fetch chat logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotificationsApi();
      if (res.success) {
        setNotifications(res.data?.notifications || []);
      }
    } catch (err) {
      setError("Failed to load notification feed");
    } finally {
      setLoading(false);
    }
  };

  // --- Sub-View Actions ---
  
  // Toggle Bookmarks
  const handleToggleSave = async (id) => {
    try {
      const res = await toggleSaveListingApi(id);
      if (res.success) {
        // reload bookmarks or modify inline
        if (activeTab === "saved") {
          setSavedBooks(prev => prev.filter(b => b.listing?._id !== id));
          showToast(res.message || "Removed from bookmarks", "success");
        } else {
          showToast(res.message || "Bookmarked successfully", "success");
        }
      }
    } catch (err) {
      showToast("Failed to toggle bookmark", "error");
    }
  };

  // Create Book Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestTitle.trim()) return;
    try {
      setIsSubmitting(true);
      clearAlerts();
      const res = await createBookRequestApi({
        title: newRequestTitle,
        description: newRequestDesc,
        budget: newRequestBudget,
        department: newRequestDept,
        semester: newRequestSem
      });
      if (res.success) {
        showToast("Book request created successfully", "success");
        setNewRequestTitle("");
        setNewRequestDesc("");
        setNewRequestBudget("");
        setNewRequestDept("");
        setNewRequestSem("");
        await fetchBookRequests(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create book request");
      showToast(err.response?.data?.message || "Failed to create book request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete/Cancel Book Request
  const handleDeleteRequest = async (id) => {
    try {
      setLoading(true);
      const res = await deleteBookRequestApi(id);
      if (res.success) {
        showToast("Request cancelled successfully", "success");
        setRequests(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      showToast("Failed to delete request", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Book Request Status (fulfilled/open)
  const handleToggleRequestStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const nextStatus = currentStatus === "open" ? "fulfilled" : "open";
      const res = await updateBookRequestApi(id, { status: nextStatus });
      if (res.success) {
        showToast(`Request marked as ${nextStatus} successfully`, "success");
        await fetchBookRequests(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update request status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await markNotificationReadApi(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        if (onNotificationsRefresh) {
          onNotificationsRefresh();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Direct chat selection
  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    try {
      const res = await getConversationMessagesApi(chat._id);
      if (res.success) {
        setChatMessages(res.data?.messages || []);
      }
    } catch (err) {
      setError("Failed to fetch messages");
    }
  };

  // Start chat conversation from Browse Books list
  const handleStartChatFromBook = async (book) => {
    try {
      setLoading(true);
      const res = await createConversationApi(book._id);
      if (res.success) {
        setActiveTab("messages");
        // Select chat
        const targetChat = res.data?.conversation || res.data;
        handleSelectChat(targetChat);
      }
    } catch (err) {
      setError("Failed to initialize conversation: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    const content = chatInput;
    setChatInput(""); // Clear field immediately for responsive look
    
    try {
      const res = await sendMessageApi(activeChat._id, content);
      if (res.success) {
        setChatMessages(prev => [...prev, res.data?.message]);
        // Update chat list last message preview
        setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, lastMessage: res.data?.message } : c));
      }
    } catch (err) {
      setError("Message sending failed");
    }
  };

  // Live Chat Polling (10s interval when chat is active)
  useEffect(() => {
    if (!activeChat || activeTab !== "messages") return;
    
    const pollMessages = async () => {
      try {
        const res = await getConversationMessagesApi(activeChat._id);
        if (res.success) {
          const msgs = res.data?.messages || [];
          // Only update if messages length is different to avoid layout shifting
          if (msgs.length !== chatMessages.length) {
            setChatMessages(msgs);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const interval = setInterval(pollMessages, 10000);
    return () => clearInterval(interval);
  }, [activeChat, chatMessages.length, activeTab]);

  // --- Seller Application Upload ---
  const handleUploadAndSubmitSeller = async (e) => {
    e.preventDefault();
    if (!idCardFile) return;

    try {
      setIsUploading(true);
      clearAlerts();
      
      // 1. Fetch credentials
      const authRes = await getImageKitAuthParamsApi();
      if (!authRes.success) throw new Error("Failed to authenticate upload signature");

      const { signature, token, expire, publicKey, urlEndpoint } = authRes.data;
      let finalUrl = "";

      // 2. Direct upload or mock fallback
      if (signature.startsWith("mock-") || token.startsWith("mock-")) {
        console.log("Mock image upload executed.");
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        finalUrl = `https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-${Date.now()}.png`;
      } else {
        const extension = idCardFile.name ? idCardFile.name.split('.').pop() : "png";
        const formData = new FormData();
        formData.append("file", idCardFile);
        formData.append("fileName", `ID_${user?.id || user?._id || "user"}_${Date.now()}.${extension}`);
        formData.append("publicKey", publicKey);
        formData.append("signature", signature);
        formData.append("token", token);
        formData.append("expire", expire);
        formData.append("folder", "/PustakMart/id_cards");

        const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);
        finalUrl = uploadRes.data.url;
      }

      // 3. Apply
      const applyRes = await applySellerApi(finalUrl);
      if (applyRes.success) {
        setSuccess("Your verification application has been submitted successfully!");
        setIdCardFile(null);
        checkSession(); // Reload profile details (sellerStatus -> pending)
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload file or apply");
    } finally {
      setIsUploading(false);
    }
  };

  // Render Subviews depending on tab parameter
  return (
    <div className="user-dashboard-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification-bubble ${toast.type}`}>
          <div className="toast-content">
            <i className={toast.type === "success" ? "ri-checkbox-circle-fill" : "ri-error-warning-fill"}></i>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast(null)}>
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Dynamic Notifications alert banner */}
      {error && <div className="dashboard-alert-banner error-banner">{error}</div>}
      {success && <div className="dashboard-alert-banner success-banner">{success}</div>}

      {loading && activeTab !== "messages" && (
        <div className="dashboard-view-loader">
          <div className="loading-spinner"></div>
          <span>Syncing workspace...</span>
        </div>
      )}

      {/* --- 1. HOME VIEW --- */}
      {activeTab === "home" && !loading && (
        <div className="tab-view-container home-view animate-fade">
          <div className="grid-summary-metric-cards">
            <div className="metric-box-card">
              <div className="card-icon-circle user-color"><i className="ri-bookmark-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{savedBooks.length}</h3>
                <p>Saved Books</p>
              </div>
            </div>
            
            <div className="metric-box-card">
              <div className="card-icon-circle user-color"><i className="ri-question-answer-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{requests.filter(r => r.requestedBy?._id === (user?._id || user?.id)).length}</h3>
                <p>Active Requests</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle user-color"><i className="ri-chat-3-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{chats.length}</h3>
                <p>Chat Channels</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle user-color"><i className="ri-notification-3-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{notifications.filter(n => !n.isRead).length}</h3>
                <p>Alerts</p>
              </div>
            </div>
          </div>

          <div className="split-view-container">
            {/* Left: Recommended Books */}
            <div className="feed-panel listings-feed-panel">
              <h2 className="panel-title-heading">Recommended Listings</h2>
              <p className="panel-description-text">Verified student academic items listed nearby SVNIT colleges first.</p>
              
              <div className="horizontal-listings-grid">
                {listings.length > 0 ? (
                  listings.map((book) => (
                    <div className="catalog-book-card-item" key={book._id}>
                      <div className="book-image-cover-box">
                        <img 
                          src={book.images?.[0] || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png"} 
                          alt={book.title} 
                        />
                        <span className="book-price-tag">₹{book.price}</span>
                      </div>
                      <div className="book-card-details">
                        <h4>{book.title}</h4>
                        <p className="book-author">By {book.author || "Unknown"}</p>
                        <div className="college-tag-row">
                          <i className="ri-map-pin-line"></i>
                          <span>{book.collegeName}</span>
                        </div>
                        <div className="button-group-row">
                          <button className="btn btn-outline" onClick={() => handleToggleSave(book._id)}>
                            <i className="ri-bookmark-line"></i> Save
                          </button>
                          <button className="btn btn-brand" onClick={() => handleStartChatFromBook(book)}>
                            Chat Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card-box">
                    <i className="ri-book-3-line"></i>
                    <p>No active recommended book listings found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Recent Activity */}
            <div className="feed-panel activity-feed-panel">
              <h2 className="panel-title-heading">Recent Activity</h2>
              <div className="activity-list-box">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <div className={`activity-row-item ${n.isRead ? "" : "unread"}`} key={n._id}>
                      <div className="activity-icon-bullet">
                        <i className={n.type === "alert" ? "ri-alert-line" : "ri-information-line"}></i>
                      </div>
                      <div className="activity-content-text">
                        <p>{n.message}</p>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-mini-box">
                    <p>No recent account activity logged.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. BROWSE BOOKS VIEW --- */}
      {activeTab === "browse" && !loading && (
        <div className="tab-view-container browse-catalog-view animate-fade">
          {/* Header Search Filter Bar */}
          <div className="catalog-filters-top-pane">
            <div className="search-input-wrapper-field">
              <i className="ri-search-line input-icon"></i>
              <input 
                type="text" 
                placeholder="Search by Title, Author, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchBrowseListings()}
              />
              <button className="btn btn-brand" onClick={fetchBrowseListings}>Search</button>
            </div>

            <div className="filters-dropdowns-row">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="engineering">Engineering</option>
                <option value="medical">Medical</option>
                <option value="school">School Books</option>
                <option value="competitive_exam">Competitive Exams</option>
                <option value="novel">Novels & Fiction</option>
                <option value="other">Others</option>
              </select>

              <select 
                value={deptFilter} 
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer CS</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Chemical">Chemical</option>
              </select>
            </div>
          </div>

          {/* Book Catalog Grid */}
          <div className="vertical-catalog-items-grid">
            {listings.length > 0 ? (
              listings.map((book) => (
                <div className="catalog-book-card-item vertical-style" key={book._id}>
                  <div className="book-image-cover-box">
                    <img 
                      src={book.images?.[0] || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png"} 
                      alt={book.title} 
                    />
                    <span className="book-price-tag">₹{book.price}</span>
                  </div>
                  <div className="book-card-details">
                    <div className="book-top-row">
                      <h4>{book.title}</h4>
                      <span className={`condition-indicator-tag ${book.condition}`}>
                        {book.condition}
                      </span>
                    </div>
                    <p className="book-author">By {book.author || "Unknown Author"}</p>
                    <p className="book-description-preview">{book.description || "No description provided."}</p>
                    <div className="college-tag-row">
                      <i className="ri-map-pin-line"></i>
                      <span>{book.collegeName}</span>
                    </div>
                    <div className="button-group-row">
                      <button className="btn btn-outline" onClick={() => handleToggleSave(book._id)}>
                        <i className="ri-bookmark-line"></i> Bookmark
                      </button>
                      <button className="btn btn-brand" onClick={() => handleStartChatFromBook(book)}>
                        Initiate Exchange / Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-card-box">
                <i className="ri-search-eye-line"></i>
                <p>No matching academic books found. Try resetting filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 3. BOOK REQUESTS VIEW --- */}
      {activeTab === "requests" && !loading && (
        <div className="tab-view-container book-requests-view animate-fade">
          <div className="split-view-container">
            {/* Left: Create Request */}
            <div className="feed-panel request-form-panel">
              <h2 className="panel-title-heading">Request a Book</h2>
              <p className="panel-description-text">Can't find a book? Publish a request and verified sellers will contact you.</p>
              
              <form className="modern-input-form-layout" onSubmit={handleCreateRequest}>
                <div className="form-group-field">
                  <label htmlFor="req-title">Book Title *</label>
                  <input 
                    type="text" 
                    id="req-title"
                    required
                    placeholder="e.g. Introduction to Algorithms, CLRS"
                    value={newRequestTitle}
                    onChange={(e) => setNewRequestTitle(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="req-desc">Short Description / Requirements</label>
                  <textarea 
                    id="req-desc"
                    placeholder="e.g. Need 3rd or 4th edition. Must have intact pages."
                    value={newRequestDesc}
                    onChange={(e) => setNewRequestDesc(e.target.value)}
                  />
                </div>

                <div className="form-row-double">
                  <div className="form-group-field">
                    <label htmlFor="req-budget">Budget (₹)</label>
                    <input 
                      type="number" 
                      id="req-budget"
                      placeholder="e.g. 500"
                      value={newRequestBudget}
                      onChange={(e) => setNewRequestBudget(e.target.value)}
                    />
                  </div>

                  <div className="form-group-field">
                    <label htmlFor="req-sem">Semester</label>
                    <input 
                      type="number" 
                      id="req-sem"
                      placeholder="e.g. 3"
                      value={newRequestSem}
                      onChange={(e) => setNewRequestSem(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="req-dept">Department</label>
                  <input 
                    type="text" 
                    id="req-dept"
                    placeholder="e.g. Computer Engineering"
                    value={newRequestDept}
                    onChange={(e) => setNewRequestDept(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-brand btn-wide" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner-xs"></span>
                      Submitting...
                    </>
                  ) : "Submit Request"}
                </button>
              </form>
            </div>

            {/* Right: Active requests list */}
            <div className="feed-panel requests-list-panel">
              <h2 className="panel-title-heading">Current Open Requests</h2>
              <div className="requests-vertical-stack">
                {requests.filter(req => req.status === "open").length > 0 ? (
                  requests
                    .filter(req => req.status === "open")
                    .slice(0, requestsLimit)
                    .map((req) => (
                      <div className="request-card-box" key={req._id}>
                        <div className="request-card-header">
                          <h4>{req.title}</h4>
                          {req.requestedBy?._id === (user?._id || user?.id) && (
                            <button 
                              className="btn-trash-icon" 
                              onClick={() => handleDeleteRequest(req._id)}
                              title="Delete Request"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
                        </div>
                        <p className="request-desc">{req.description || "No description provided."}</p>
                        
                        <div className="request-meta-tags">
                          {req.budget && <span className="meta-tag badge-budget">₹{req.budget}</span>}
                          {req.semester && <span className="meta-tag">Sem {req.semester}</span>}
                          {req.department && <span className="meta-tag">{req.department}</span>}
                        </div>

                        <div className="request-card-footer">
                          <div className="student-profile-mini">
                            <img 
                              src={req.requestedBy?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                              alt="Avatar" 
                            />
                            <span>Requested by {req.requestedBy?.name || "Student"}</span>
                          </div>
                          {req.requestedBy?._id !== (user?._id || user?.id) && (
                            <button 
                              className="btn btn-brand btn-xs"
                              onClick={() => {
                                // Direct chat on request
                                setError("Chatting directly about a request is handled through listing chat channels. Contact requester.");
                                setTimeout(clearAlerts, 3000);
                              }}
                            >
                              Contact
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="empty-state-mini-box">
                    <p>No open student requests found.</p>
                  </div>
                )}
              </div>

              {requests.filter(req => req.status === "open").length > requestsLimit && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button 
                    className="btn btn-outline btn-sm btn-wide" 
                    onClick={() => setRequestsLimit(prev => prev + 5)}
                  >
                    Show More Requests
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom full-width panel: Manage My Requests */}
          <div className="feed-panel manage-requests-panel">
            <h2 className="panel-title-heading">My Created Book Requests</h2>
            <p className="panel-description-text">Track, fulfill, reopen, or cancel your published book requests.</p>
            
            <div className="requests-manage-table-wrapper">
              {requests.filter(r => r.requestedBy?._id === (user?._id || user?.id)).length > 0 ? (
                <table className="requests-manage-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Description</th>
                      <th>Budget</th>
                      <th>Sem / Dept</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests
                      .filter(r => r.requestedBy?._id === (user?._id || user?.id))
                      .map((req) => (
                        <tr key={req._id}>
                          <td><strong>{req.title}</strong></td>
                          <td className="desc-cell" title={req.description}>
                            {req.description || "No description provided."}
                          </td>
                          <td>{req.budget ? `₹${req.budget}` : "N/A"}</td>
                          <td>
                            Sem {req.semester || "N/A"} / {req.department || "N/A"}
                          </td>
                          <td>
                            <span className={`status-badge ${req.status}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {req.status === "open" ? (
                              <button 
                                className="btn btn-success btn-xs"
                                onClick={() => handleToggleRequestStatus(req._id, "open")}
                                title="Mark as Fulfilled"
                              >
                                Fulfill
                              </button>
                            ) : (
                              <button 
                                className="btn btn-brand btn-xs"
                                onClick={() => handleToggleRequestStatus(req._id, req.status)}
                                title="Reopen Request"
                              >
                                Reopen
                              </button>
                            )}
                            <button 
                              className="btn btn-outline-danger btn-xs"
                              onClick={() => handleDeleteRequest(req._id)}
                              title="Delete Request"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  You have not published any book requests yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 4. SAVED BOOKS VIEW --- */}
      {activeTab === "saved" && !loading && (
        <div className="tab-view-container saved-books-view animate-fade">
          <h2 className="panel-title-heading">Saved Books Folder</h2>
          <div className="vertical-catalog-items-grid">
            {savedBooks.length > 0 ? (
              savedBooks.map((save) => {
                const book = save.listing;
                if (!book) return null;
                return (
                  <div className="catalog-book-card-item vertical-style" key={save._id}>
                    <div className="book-image-cover-box">
                      <img 
                        src={book.images?.[0] || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png"} 
                        alt={book.title} 
                      />
                      <span className="book-price-tag">₹{book.price}</span>
                    </div>
                    <div className="book-card-details">
                      <div className="book-top-row">
                        <h4>{book.title}</h4>
                        <span className={`condition-indicator-tag ${book.condition || "good"}`}>
                          {book.condition || "good"}
                        </span>
                      </div>
                      <p className="book-author">By {book.author || "Unknown Author"}</p>
                      <div className="college-tag-row">
                        <i className="ri-map-pin-line"></i>
                        <span>{book.collegeName}</span>
                      </div>
                      <div className="button-group-row">
                        <button className="btn btn-outline-danger" onClick={() => handleToggleSave(book._id)}>
                          <i className="ri-bookmark-fill"></i> Remove
                        </button>
                        <button className="btn btn-brand" onClick={() => handleStartChatFromBook(book)}>
                          Contact Seller
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-card-box">
                <i className="ri-bookmark-3-line"></i>
                <p>You have not saved any academic books yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 5. MESSAGES VIEW (LIVE CHAT PANEL) --- */}
      {activeTab === "messages" && !loading && (
        <div className="tab-view-container chat-workspace-view animate-fade">
          <div className="chat-layout-split-box">
            {/* Left: Chat Channels List */}
            <div className="channels-sidebar-list">
              <h3>Active Channels</h3>
              <div className="channels-scroll-container">
                {chats.length > 0 ? (
                  chats.map((chat) => {
                    const recipient = chat.participants?.find(p => p._id !== (user?._id || user?.id));
                    const isActive = activeChat?._id === chat._id;
                    return (
                      <div 
                        className={`channel-row-item ${isActive ? "active" : ""}`}
                        key={chat._id}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <img 
                          src={recipient?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                          alt="Recipient" 
                        />
                        <div className="channel-summary">
                          <h4>{recipient?.name || "Student Seller"}</h4>
                          <span className="last-msg-preview">
                            {chat.lastMessage?.content || "Click to open conversation..."}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="channels-empty-box">
                    <p>No active conversations yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Message Window */}
            <div className="chat-messages-window">
              {activeChat ? (
                <>
                  <div className="chat-window-header">
                    <div className="recipient-info">
                      <img 
                        src={activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                        alt="User avatar" 
                      />
                      <div>
                        <h4>{activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.name}</h4>
                        <p>{activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.collegeName || "SVNIT Student"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages-history-pane">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isMe = msg.sender === (user?.id || user?._id);
                        return (
                          <div className={`message-bubble-row ${isMe ? "sender-me" : "sender-them"}`} key={msg._id}>
                            <div className="bubble-content-card">
                              <p>{msg.content}</p>
                              <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="messages-empty-state">
                        <i className="ri-question-answer-line"></i>
                        <p>No messages here. Say hello to initiate the deal!</p>
                      </div>
                    )}
                  </div>

                  <form className="chat-input-row-bar" onSubmit={handleSendMessage}>
                    <input 
                      type="text" 
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-brand" disabled={!chatInput.trim()}>
                      <i className="ri-send-plane-fill"></i>
                    </button>
                  </form>
                </>
              ) : (
                <div className="chat-welcome-pane">
                  <i className="ri-wechat-line"></i>
                  <h3>Select a conversation channel</h3>
                  <p>Coordinate location, negotiate price, or verify book bundle semester state.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 6. NOTIFICATIONS VIEW --- */}
      {activeTab === "notifications" && !loading && (
        <div className="tab-view-container notifications-view animate-fade">
          <h2 className="panel-title-heading">Alert Notifications Feed</h2>
          <div className="notifications-stack-list">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  className={`notification-card-row ${notif.isRead ? "read" : "unread"}`} 
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkNotificationRead(notif._id)}
                >
                  <div className="notif-bullet">
                    <i className="ri-notification-badge-line"></i>
                  </div>
                  <div className="notif-content">
                    <p>{notif.message}</p>
                    <span className="notif-date">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  {!notif.isRead && (
                    <span className="unread-dot"></span>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state-card-box">
                <i className="ri-notification-off-line"></i>
                <p>No new notifications at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 7. PROFILE VIEW --- */}
      {activeTab === "profile" && !loading && (
        <div className="tab-view-container profile-view animate-fade">
          <div className="profile-details-display-card">
            <div className="profile-details-header">
              <div className="avatar-display-large">
                <img src={user?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="Avatar" />
              </div>
              <div className="header-info-box">
                <h2>{user?.name}</h2>
                <div className="roles-row-box">
                  <span className="user-role-badge">{user?.role?.toUpperCase()}</span>
                  {user?.sellerStatus === "verified" && (
                    <span className="seller-verified-status-tag">
                      <i className="ri-verified-badge-fill"></i> Verified Seller
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="details-info-grid">
              <div className="detail-item-box">
                <i className="ri-mail-line"></i>
                <div className="detail-value-box">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-val">{user?.email}</span>
                </div>
              </div>

              <div className="detail-item-box">
                <i className="ri-phone-line"></i>
                <div className="detail-value-box">
                  <span className="detail-label">Mobile Number</span>
                  <span className="detail-val">{user?.mobileNumber || "Not configured"}</span>
                </div>
              </div>

              <div className="detail-item-box">
                <i className="ri-bank-line"></i>
                <div className="detail-value-box">
                  <span className="detail-label">College / University</span>
                  <span className="detail-val">{user?.collegeName || "Not configured"}</span>
                </div>
              </div>

              <div className="detail-item-box">
                <i className="ri-git-branch-line"></i>
                <div className="detail-value-box">
                  <span className="detail-label">Department</span>
                  <span className="detail-val">{user?.department || "Not configured"}</span>
                </div>
              </div>

              <div className="detail-item-box">
                <i className="ri-node-tree"></i>
                <div className="detail-value-box">
                  <span className="detail-label">Semester</span>
                  <span className="detail-val">{user?.semester || "Not configured"}</span>
                </div>
              </div>

              <div className="detail-item-box">
                <i className="ri-star-line"></i>
                <div className="detail-value-box">
                  <span className="detail-label">Seller Rating</span>
                  <span className="detail-val">
                    {user?.averageRating || 0} ({user?.totalReviews || 0} Reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-actions-footer">
              <button className="btn btn-outline" onClick={() => setSearchParams({ mode: "user", tab: "settings" })}>
                <i className="ri-settings-4-line"></i> Edit Profile & Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 8. SETTINGS VIEW --- */}
      {activeTab === "settings" && !loading && (
        <div className="tab-view-container profile-settings-view animate-fade">
          <ProfileSettingsView showSellerStatus={true} />
        </div>
      )}


    </div>
  );
};

export default UserDashboard;
