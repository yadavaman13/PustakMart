import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import { 
  getHomeListingsApi, 
  createBookListingApi,
  updateBookListingApi,
  deleteBookListingApi,
  markListingAsSoldApi,
  getBookRequestsApi,
  createConversationApi,
  getConversationsApi,
  getConversationMessagesApi,
  sendMessageApi,
  getSellerReviewsApi,
  getImageKitAuthParamsApi
} from "../services/dashboard.api.js";
import axios from "axios";
import ProfileSettingsView from "../components/ProfileSettingsView.jsx";

export const SellerDashboard = ({ activeTab }) => {
  const { user, checkSession } = useAuth();
  const [, setSearchParams] = useSearchParams();

  // Shared states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Business entities
  const [sellerListings, setSellerListings] = useState([]);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [chats, setChats] = useState([]);

  // Create book form states
  const [listingType, setListingType] = useState("book");
  const [bookTitle, setBookTitle] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookPrice, setBookPrice] = useState("");
  const [bookCondition, setBookCondition] = useState("good");
  const [bookCategory, setBookCategory] = useState("Engineering");
  const [bookDept, setBookDept] = useState("");
  const [bookSem, setBookSem] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookCity, setBookCity] = useState("");
  const [bookCollege, setBookCollege] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit book form states
  const [editListing, setEditListing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState("good");

  // Chat window states
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    clearAlerts();
    if (activeTab === "overview") {
      fetchOverviewData();
    } else if (activeTab === "listings") {
      fetchSellerListings();
    } else if (activeTab === "requests-buyer") {
      fetchBuyerRequests();
    } else if (activeTab === "reviews") {
      fetchSellerReviews();
    } else if (activeTab === "messages") {
      fetchConversations();
    }
  }, [activeTab]);

  // --- API Fetchers ---

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      if (!user) return;
      // Get all active and sold listings of the seller
      const res = await getHomeListingsApi({ seller: user._id, status: "all" });
      if (res.success) {
        setSellerListings(res.listings || []);
      }
      
      const reviewRes = await getSellerReviewsApi(user._id);
      if (reviewRes.success) {
        setReviews(reviewRes.data?.reviews || []);
      }

      const chatsRes = await getConversationsApi();
      if (chatsRes.success) {
        setChats(chatsRes.data?.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerListings = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const res = await getHomeListingsApi({ seller: user._id, status: "all" });
      if (res.success) {
        setSellerListings(res.listings || []);
      }
    } catch (err) {
      setError("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerRequests = async () => {
    try {
      setLoading(true);
      const res = await getBookRequestsApi();
      if (res.success) {
        // Show only requests from OTHER users that match SVNIT or user's college
        const filtered = (res.requests || []).filter(r => r.requestedBy?._id !== user?._id);
        setBuyerRequests(filtered);
      }
    } catch (err) {
      setError("Failed to fetch buyer requests feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerReviews = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const res = await getSellerReviewsApi(user._id);
      if (res.success) {
        setReviews(res.data?.reviews || []);
      }
    } catch (err) {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversationsApi();
      if (res.success) {
        setChats(res.data?.conversations || []);
      }
    } catch (err) {
      setError("Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  // --- Seller Actions ---

  // Direct ImageKit File Upload
  const handleUploadImage = async (file) => {
    const authRes = await getImageKitAuthParamsApi();
    if (!authRes.success) throw new Error("Failed to authenticate with upload client");

    const { signature, token, expire, publicKey, urlEndpoint } = authRes.data;

    if (signature.startsWith("mock-") || token.startsWith("mock-")) {
      console.log("Image upload simulated on local mock endpoint.");
      return `https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-${Date.now()}.png`;
    }

    const extension = file.name ? file.name.split('.').pop() : "png";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", `cover_${user?.id || user?._id || "user"}_${Date.now()}.${extension}`);
    formData.append("publicKey", publicKey);
    formData.append("signature", signature);
    formData.append("token", token);
    formData.append("expire", expire);
    formData.append("folder", "/PustakMart/covers");

    const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);
    return uploadRes.data.url;
  };

  // Submit Listing Form
  const handleCreateListingSubmit = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookPrice) return;

    try {
      setIsUploading(true);
      clearAlerts();

      let imageUrls = [];
      if (coverFile) {
        const url = await handleUploadImage(coverFile);
        imageUrls.push(url);
      } else {
        // fallback sample image
        imageUrls.push("https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png");
      }

      const res = await createBookListingApi({
        listingType,
        title: bookTitle,
        description: bookDesc,
        price: Number(bookPrice),
        images: imageUrls,
        condition: bookCondition,
        category: bookCategory,
        department: bookDept,
        semester: bookSem ? Number(bookSem) : undefined,
        author: bookAuthor,
        city: bookCity || user.city || "Surat",
        collegeName: bookCollege || user.collegeName
      });

      if (res.success) {
        setSuccess("Academic listing created successfully!");
        setBookTitle("");
        setBookDesc("");
        setBookPrice("");
        setBookDept("");
        setBookSem("");
        setBookAuthor("");
        setBookCity("");
        setBookCollege("");
        setCoverFile(null);
        
        // Redirect to Listings Tab
        setTimeout(() => {
          setSearchParams({ mode: "seller", tab: "listings" });
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create listing");
    } finally {
      setIsUploading(false);
    }
  };

  // Mark listing as sold
  const handleMarkAsSold = async (id) => {
    try {
      const res = await markListingAsSoldApi(id);
      if (res.success) {
        setSuccess("Book listing status updated to SOLD");
        fetchSellerListings();
        checkSession(); // reload profile metrics
        setTimeout(clearAlerts, 2000);
      }
    } catch (err) {
      setError("Failed to mark listing as sold");
    }
  };

  // Delete listing
  const handleDeleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to remove this listing?")) return;
    try {
      const res = await deleteBookListingApi(id);
      if (res.success) {
        setSuccess("Listing deleted successfully");
        setSellerListings(prev => prev.filter(b => b._id !== id));
        setTimeout(clearAlerts, 2000);
      }
    } catch (err) {
      setError("Failed to delete listing");
    }
  };

  // Update Edit form values
  const handleOpenEdit = (book) => {
    setEditListing(book);
    setEditTitle(book.title);
    setEditPrice(book.price);
    setEditCondition(book.condition || "good");
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editListing) return;
    try {
      setLoading(true);
      const res = await updateBookListingApi(editListing._id, {
        title: editTitle,
        price: Number(editPrice),
        condition: editCondition
      });
      if (res.success) {
        setSuccess("Listing updated successfully");
        setEditListing(null);
        fetchSellerListings();
        setTimeout(clearAlerts, 2000);
      }
    } catch (err) {
      setError("Failed to update listing");
    } finally {
      setLoading(false);
    }
  };

  // Start chat with requester (seller side)
  const handleContactBuyer = async (request) => {
    try {
      setLoading(true);
      // Initiate a conversation using placeholder book or search listing
      setError("Please create or use an active book listing to communicate with this requester.");
      setTimeout(clearAlerts, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Message chat handlers
  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    try {
      const res = await getConversationMessagesApi(chat._id);
      if (res.success) {
        setChatMessages(res.data?.messages || []);
      }
    } catch (err) {
      setError("Failed to load message log");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    const content = chatInput;
    setChatInput("");

    try {
      const res = await sendMessageApi(activeChat._id, content);
      if (res.success) {
        setChatMessages(prev => [...prev, res.data?.message]);
        setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, lastMessage: res.data?.message } : c));
      }
    } catch (err) {
      setError("Failed to send message");
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

  // Metrics computation for dashboard Overview
  const activeCount = sellerListings.filter(l => l.status === "active").length;
  const soldCount = sellerListings.filter(l => l.status === "sold").length;
  const totalViews = sellerListings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);

  return (
    <div className="seller-dashboard-wrapper">
      {error && <div className="dashboard-alert-banner error-banner">{error}</div>}
      {success && <div className="dashboard-alert-banner success-banner">{success}</div>}

      {loading && activeTab !== "messages" && (
        <div className="dashboard-view-loader">
          <div className="loading-spinner"></div>
          <span>Loading Business Panel...</span>
        </div>
      )}

      {/* --- 1. BUSINESS DASHBOARD OVERVIEW VIEW --- */}
      {activeTab === "overview" && !loading && (
        <div className="tab-view-container overview-view animate-fade">
          <div className="grid-summary-metric-cards">
            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-folders-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{activeCount}</h3>
                <p>Active Listings</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-hand-coin-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{soldCount}</h3>
                <p>Total Sales</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-eye-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{totalViews}</h3>
                <p>Traffic Views</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-message-3-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{chats.length}</h3>
                <p>Inquiries</p>
              </div>
            </div>
          </div>

          <div className="split-view-container">
            {/* Left: Quick Actions and Chart */}
            <div className="feed-panel listings-feed-panel">
              <h2 className="panel-title-heading">Traffic & Sales Metrics</h2>
              <div className="quick-actions-card-pane">
                <button 
                  className="quick-action-btn"
                  onClick={() => setSearchParams({ mode: "seller", tab: "create-listing" })}
                >
                  <i className="ri-add-line"></i> Create New Listing
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => setSearchParams({ mode: "seller", tab: "requests-buyer" })}
                >
                  <i className="ri-eye-line"></i> View Buyer Requests
                </button>
              </div>

              {/* Premium HSL custom CSS Chart */}
              <div className="bar-charts-container">
                <h3 className="section-subtitle">Top Book Views</h3>
                <div className="chart-vertical-bars">
                  {sellerListings.slice(0, 4).map((l) => {
                    const pct = Math.min(100, Math.max(8, totalViews > 0 ? (l.viewsCount / totalViews) * 100 : 10));
                    return (
                      <div className="chart-bar-row" key={l._id}>
                        <span className="bar-label">{l.title.substring(0, 24)}...</span>
                        <div className="bar-wrapper">
                          <div className="bar-fill seller-color" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="bar-value">{l.viewsCount || 0} views</span>
                      </div>
                    );
                  })}
                  {sellerListings.length === 0 && (
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>No listings views data available yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Reviews summary */}
            <div className="feed-panel activity-feed-panel">
              <h2 className="panel-title-heading">Recent Buyer Reviews</h2>
              <div className="activity-list-box">
                {reviews.length > 0 ? (
                  reviews.slice(0, 3).map((r) => (
                    <div className="review-box-row" key={r._id}>
                      <div className="review-header-row">
                        <strong>{r.buyer?.name || "Student"}</strong>
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <i className={`ri-star-fill ${i < r.rating ? "text-gold" : "text-gray"}`} key={i}></i>
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">"{r.review}"</p>
                      <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-mini-box">
                    <p>No customer reviews logged yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. LISTINGS VIEW --- */}
      {activeTab === "listings" && !loading && (
        <div className="tab-view-container listings-management-view animate-fade">
          <h2 className="panel-title-heading">Manage Book Listings</h2>
          
          {editListing ? (
            <div className="edit-form-overlay-box feed-panel">
              <h3>Edit Listing Information</h3>
              <form onSubmit={handleUpdateListing} className="modern-input-form-layout">
                <div className="form-group-field">
                  <label>Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </div>
                <div className="form-group-field">
                  <label>Price (₹)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                </div>
                <div className="form-group-field">
                  <label>Condition</label>
                  <select value={editCondition} onChange={(e) => setEditCondition(e.target.value)}>
                    <option value="brand_new">Brand New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
                <div className="button-group-row">
                  <button type="submit" className="btn btn-brand">Save Changes</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditListing(null)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="vertical-catalog-items-grid">
              {sellerListings.length > 0 ? (
                sellerListings.map((book) => (
                  <div className={`catalog-book-card-item vertical-style ${book.status}`} key={book._id}>
                    <div className="book-image-cover-box">
                      <img src={book.images?.[0] || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png"} alt={book.title} />
                      <span className="book-price-tag">₹{book.price}</span>
                      {book.status === "sold" && (
                        <div className="sold-overlay-tag">SOLD</div>
                      )}
                    </div>
                    <div className="book-card-details">
                      <div className="book-top-row">
                        <h4>{book.title}</h4>
                        <span className={`status-pill ${book.status}`}>
                          {book.status}
                        </span>
                      </div>
                      <p className="book-author">By {book.author || "Unknown Author"}</p>
                      <p className="views-counter-tag"><i className="ri-eye-line"></i> {book.viewsCount || 0} views</p>
                      
                      <div className="button-group-row">
                        {book.status === "active" && (
                          <button className="btn btn-success btn-xs" onClick={() => handleMarkAsSold(book._id)}>
                            Mark Sold
                          </button>
                        )}
                        <button className="btn btn-outline btn-xs" onClick={() => handleOpenEdit(book)}>
                          Edit
                        </button>
                        <button className="btn btn-outline-danger btn-xs" onClick={() => handleDeleteListing(book._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-card-box">
                  <i className="ri-folder-open-line"></i>
                  <p>No listings found. Create a listing to start selling!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- 3. CREATE LISTING VIEW --- */}
      {activeTab === "create-listing" && !loading && (
        <div className="tab-view-container create-listing-view animate-fade">
          <div className="feed-panel full-width-form-panel">
            <h2 className="panel-title-heading">Publish New Academic Resource</h2>
            <p className="panel-description-text">List individual books or semester study bundles to students instantly.</p>

            <form className="modern-input-form-layout" onSubmit={handleCreateListingSubmit}>
              <div className="form-group-field">
                <label>Listing Type *</label>
                <div className="radio-group-selectors">
                  <button 
                    type="button" 
                    className={`selector-card ${listingType === "book" ? "selected" : ""}`}
                    onClick={() => setListingType("book")}
                  >
                    <i className="ri-book-line"></i>
                    <strong>Single Book</strong>
                  </button>
                  <button 
                    type="button" 
                    className={`selector-card ${listingType === "bundle" ? "selected" : ""}`}
                    onClick={() => setListingType("bundle")}
                  >
                    <i className="ri-stack-line"></i>
                    <strong>Semester Bundle</strong>
                  </button>
                </div>
              </div>

              <div className="form-group-field">
                <label htmlFor="title">Book or Bundle Title *</label>
                <input 
                  type="text" 
                  id="title" 
                  required 
                  placeholder="e.g. Engineering Mathematics II (Bundle of 3 Books)"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </div>

              <div className="form-row-double">
                <div className="form-group-field">
                  <label htmlFor="price">Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    id="price" 
                    required 
                    placeholder="e.g. 450"
                    value={bookPrice}
                    onChange={(e) => setBookPrice(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="author">Author / Publisher</label>
                  <input 
                    type="text" 
                    id="author" 
                    placeholder="e.g. BS Grewal"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-double">
                <div className="form-group-field">
                  <label htmlFor="condition">Book Condition</label>
                  <select 
                    id="condition"
                    value={bookCondition}
                    onChange={(e) => setBookCondition(e.target.value)}
                  >
                    <option value="brand_new">Brand New (Intact cover)</option>
                    <option value="like_new">Like New (Negligible marks)</option>
                    <option value="good">Good (Fully readable)</option>
                    <option value="fair">Fair (Visible signs of wear)</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="category">Category</label>
                  <select 
                    id="category"
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                  >
                    <option value="Engineering">Engineering Reference</option>
                    <option value="Medical">Medical Science</option>
                    <option value="Management">Management studies</option>
                    <option value="Novels">Novels & Fiction</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div className="form-row-double">
                <div className="form-group-field">
                  <label htmlFor="dept">Department / Branch</label>
                  <input 
                    type="text" 
                    id="dept" 
                    placeholder="e.g. Civil Engineering"
                    value={bookDept}
                    onChange={(e) => setBookDept(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="semester">Semester</label>
                  <input 
                    type="number" 
                    id="semester" 
                    placeholder="e.g. 4"
                    value={bookSem}
                    onChange={(e) => setBookSem(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-double">
                <div className="form-group-field">
                  <label htmlFor="college">College Name</label>
                  <input 
                    type="text" 
                    id="college" 
                    placeholder="SVNIT, Surat (Defaults to your college)"
                    value={bookCollege}
                    onChange={(e) => setBookCollege(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="city">City Location</label>
                  <input 
                    type="text" 
                    id="city" 
                    placeholder="e.g. Surat"
                    value={bookCity}
                    onChange={(e) => setBookCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label htmlFor="desc">Listing Description</label>
                <textarea 
                  id="desc" 
                  placeholder="Provide details about the books, highlights, notes inside, or meet preference."
                  value={bookDesc}
                  onChange={(e) => setBookDesc(e.target.value)}
                />
              </div>

              <div className="form-group-field">
                <label htmlFor="cover-pic">Upload Book Cover Photo</label>
                <p className="field-hint">Upload Cover. JPG, PNG supported. Max 2MB.</p>
                <input 
                  type="file" 
                  id="cover-pic" 
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-brand btn-wide"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="spinner-mini"></div> Publishing Book...
                  </>
                ) : (
                  "Publish Listing"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- 4. BUYER REQUESTS FEED VIEW --- */}
      {activeTab === "requests-buyer" && !loading && (
        <div className="tab-view-container requests-buyer-view animate-fade">
          <h2 className="panel-title-heading">Marketplace Open Book Requests</h2>
          <p className="panel-description-text">Browse what nearby students are looking to buy and contact them to sell.</p>

          <div className="vertical-catalog-items-grid">
            {buyerRequests.length > 0 ? (
              buyerRequests.map((req) => (
                <div className="catalog-book-card-item vertical-style" key={req._id}>
                  <div className="book-image-cover-box requests-placeholder-color">
                    <i className="ri-survey-line placeholder-req-icon"></i>
                    {req.budget && <span className="book-price-tag">Budget: ₹{req.budget}</span>}
                  </div>
                  <div className="book-card-details">
                    <div className="book-top-row">
                      <h4>{req.title}</h4>
                      <span className="condition-indicator-tag good">Open Request</span>
                    </div>
                    <p className="book-description-preview">{req.description || "No description provided."}</p>
                    
                    <div className="college-tag-row">
                      <i className="ri-map-pin-line"></i>
                      <span>{req.collegeName || "SVNIT Campus"}</span>
                    </div>

                    <div className="button-group-row">
                      <button className="btn btn-brand" onClick={() => handleContactBuyer(req)}>
                        Contact Buyer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-card-box">
                <i className="ri-survey-line"></i>
                <p>No active requests from other students found nearby.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 5. ANALYTICS VIEWS & REVIEWS TABS --- */}
      {(activeTab === "sales-analytics" || activeTab === "views" || activeTab === "reviews") && !loading && (
        <div className="tab-view-container sales-analytics-view animate-fade">
          <div className="split-view-container">
            {/* Left: Stats chart review */}
            <div className="feed-panel profile-metadata-panel">
              <h2 className="panel-title-heading">Performance Dashboard</h2>
              <div className="radial-rating-box">
                <h2>{user?.averageRating || 0}</h2>
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <i className={`ri-star-fill ${i < Math.round(user?.averageRating || 0) ? "text-gold" : "text-gray"}`} key={i}></i>
                  ))}
                </div>
                <p>Average Seller Rating ({user?.totalReviews || 0} reviews)</p>
              </div>

              <div className="metadata-table-rows">
                <div className="row-item">
                  <strong>Books Sold successfully</strong>
                  <span>{user?.booksSold || 0} items</span>
                </div>
                <div className="row-item">
                  <strong>Active Listings Online</strong>
                  <span>{activeCount} items</span>
                </div>
                <div className="row-item">
                  <strong>Aggregate Listing Views</strong>
                  <span>{totalViews} views</span>
                </div>
              </div>
            </div>

            {/* Right: Feedback Reviews List */}
            <div className="feed-panel settings-form-panel">
              <h2 className="panel-title-heading">Customer Reviews</h2>
              <div className="reviews-scroller-box">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div className="review-box-card" key={r._id}>
                      <div className="review-card-header">
                        <div className="buyer-info">
                          <img src={r.buyer?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="Buyer avatar" />
                          <div>
                            <h4>{r.buyer?.name || "Student"}</h4>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="stars-row">
                          {[...Array(5)].map((_, i) => (
                            <i className={`ri-star-fill ${i < r.rating ? "text-gold" : "text-gray"}`} key={i}></i>
                          ))}
                        </div>
                      </div>
                      <p className="review-body">"{r.review}"</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card-box">
                    <i className="ri-chat-smile-line"></i>
                    <p>No feedback reviews from buyers yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 6. MESSAGES VIEW (LIVE CHAT PANEL - SELLER PANEL REDIRECT) --- */}
      {activeTab === "messages" && !loading && (
        <div className="tab-view-container chat-workspace-view animate-fade">
          <div className="chat-layout-split-box">
            {/* Left: Chat Channels List */}
            <div className="channels-sidebar-list">
              <h3>Customer Conversations</h3>
              <div className="channels-scroll-container">
                {chats.length > 0 ? (
                  chats.map((chat) => {
                    const recipient = chat.participants?.find(p => p._id !== user?._id);
                    const isActive = activeChat?._id === chat._id;
                    return (
                      <div 
                        className={`channel-row-item ${isActive ? "active" : ""}`}
                        key={chat._id}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <img src={recipient?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="Recipient" />
                        <div className="channel-summary">
                          <h4>{recipient?.name || "Customer"}</h4>
                          <span className="last-msg-preview">{chat.lastMessage?.content || "Click to open conversation..."}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="channels-empty-box">
                    <p>No active seller inquiries yet.</p>
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
                      <img src={activeChat.participants?.find(p => p._id !== user?._id)?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="avatar" />
                      <div>
                        <h4>{activeChat.participants?.find(p => p._id !== user?._id)?.name}</h4>
                        <p>{activeChat.participants?.find(p => p._id !== user?._id)?.collegeName || "SVNIT Customer"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages-history-pane">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isMe = msg.sender === user?._id;
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
                        <p>Say hello to reply to this customer query!</p>
                      </div>
                    )}
                  </div>

                  <form className="chat-input-row-bar" onSubmit={handleSendMessage}>
                    <input 
                      type="text" 
                      placeholder="Type a response..."
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
                  <h3>Select a customer inquiry thread</h3>
                  <p>Reply to questions about book condition, prices, or meet coordinates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 7. SELLER PROFILE, VERIFICATION VIEWS --- */}
      {(activeTab === "seller-profile" || activeTab === "verification") && !loading && (
        <div className="tab-view-container profile-settings-view animate-fade">
          <div className="feed-panel full-width-form-panel">
            <h2 className="panel-title-heading">Seller Credentials & verification</h2>
            <div className="seller-status-success-banner-alert">
              <i className="ri-shield-check-fill animate-pulse"></i>
              <div>
                <h3>Your Seller Account is verified</h3>
                <p>Your student ID Card validation matches SVNIT records. Your listing visibility ranks first in local search algorithms.</p>
              </div>
            </div>

            <div className="metadata-table-rows margin-top-large">
              <div className="row-item">
                <strong>Seller Badge ID</strong>
                <span>PM_SLR_{user?._id?.substring(0, 10)?.toUpperCase()}</span>
              </div>
              <div className="row-item">
                <strong>Registered College</strong>
                <span>{user?.collegeName}</span>
              </div>
              <div className="row-item">
                <strong>Department</strong>
                <span>{user?.department || "General Engineering"}</span>
              </div>
              <div className="row-item">
                <strong>Seller verification Status</strong>
                <span className="text-success" style={{ fontWeight: 600 }}>Active & Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 8. SELLER ACCOUNT SETTINGS VIEW --- */}
      {activeTab === "settings" && !loading && (
        <div className="tab-view-container profile-settings-view animate-fade">
          <ProfileSettingsView showSellerStatus={false} />
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
