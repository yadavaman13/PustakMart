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
  getImageKitAuthParamsApi,
  acceptConversationApi,
  rejectConversationApi,
  generateCouponApi,
  createPaymentOrderApi,
  verifyPaymentApi,
  createReviewApi
} from "../services/dashboard.api.js";
import { useSocket } from "../../shared/context/SocketContext.jsx";
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
  const socket = useSocket();
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSubTab, setChatSubTab] = useState("chats"); // "chats" (accepted) or "requests" (pending)
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);
  
  // Introductory Message Modal State
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introBook, setIntroBook] = useState(null);
  const [introMessage, setIntroMessage] = useState("");

  // Coupon Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tempPaymentOrder, setTempPaymentOrder] = useState(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedListing, setReviewedListing] = useState(null);
  const [reviewedSeller, setReviewedSeller] = useState(null);

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

  // Socket.io Real-Time Event Listener binding
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data) => {
      console.log("Socket message received:", data);
      if (activeChat && activeChat._id === data.conversationId) {
        setChatMessages(prev => {
          // Avoid duplicate UI rendering (e.g. from optimistic send)
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, {
            ...data.message,
            content: data.message.message
          }];
        });
        
        // Auto emit message_read event to clear badges
        socket.emit("message_read", {
          conversationId: activeChat._id,
          recipientId: activeChat.buyer === (user?.id || user?._id) ? activeChat.seller : activeChat.buyer
        });
      }

      // Update conversations sidebar values in real-time
      setChats(prev => prev.map(c => {
        if (c._id === data.conversationId) {
          const isSenderMe = data.message.sender === (user?.id || user?._id);
          const isCurrentActive = activeChat && activeChat._id === data.conversationId;
          return {
            ...c,
            lastMessage: {
              _id: data.message._id,
              content: data.message.message,
              sender: data.message.sender,
              createdAt: data.message.createdAt
            },
            lastMessageAt: data.message.createdAt,
            unreadCountBuyer: (!isSenderMe && !isCurrentActive && c.buyer === (user?.id || user?._id)) ? (c.unreadCountBuyer || 0) + 1 : c.unreadCountBuyer,
            unreadCountSeller: (!isSenderMe && !isCurrentActive && c.seller === (user?.id || user?._id)) ? (c.unreadCountSeller || 0) + 1 : c.unreadCountSeller,
          };
        }
        return c;
      }));
    };

    const handleConversationAccepted = (data) => {
      console.log("Socket conversation accepted:", data);
      if (activeChat && activeChat._id === data.conversationId) {
        setActiveChat(prev => ({ ...prev, status: "accepted" }));
        if (data.systemMessage) {
          setChatMessages(prev => [...prev, {
            ...data.systemMessage,
            content: data.systemMessage.message
          }]);
        }
      }
      setChats(prev => prev.map(c => c._id === data.conversationId ? { ...c, status: "accepted" } : c));
    };

    const handleConversationRejected = (data) => {
      console.log("Socket conversation rejected:", data);
      if (activeChat && activeChat._id === data.conversationId) {
        setActiveChat(prev => ({ ...prev, status: "rejected" }));
        if (data.systemMessage) {
          setChatMessages(prev => [...prev, {
            ...data.systemMessage,
            content: data.systemMessage.message
          }]);
        }
      }
      setChats(prev => prev.map(c => c._id === data.conversationId ? { ...c, status: "rejected" } : c));
    };

    const handleTypingStart = (data) => {
      if (activeChat && activeChat._id === data.conversationId) {
        setOtherPartyTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (activeChat && activeChat._id === data.conversationId) {
        setOtherPartyTyping(false);
      }
    };

    const handleMessageRead = (data) => {
      if (activeChat && activeChat._id === data.conversationId) {
        setChatMessages(prev => prev.map(m => m.sender === (user?.id || user?._id) ? { ...m, isRead: true } : m));
      }
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("conversation_accepted", handleConversationAccepted);
    socket.on("conversation_rejected", handleConversationRejected);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("conversation_accepted", handleConversationAccepted);
      socket.off("conversation_rejected", handleConversationRejected);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("message_read", handleMessageRead);
    };
  }, [socket, activeChat, user]);

  // Direct chat selection
  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    setOtherPartyTyping(false);
    try {
      const res = await getConversationMessagesApi(chat._id);
      if (res.success) {
        const messages = res.data?.messages || [];
        const mappedMessages = messages.map(m => ({
          ...m,
          content: m.message
        }));
        setChatMessages(mappedMessages);

        // Emit message_read receipt
        if (socket) {
          const otherUserId = chat.buyer === (user?.id || user?._id) ? chat.seller : chat.buyer;
          socket.emit("message_read", {
            conversationId: chat._id,
            recipientId: otherUserId
          });
        }

        // Update local chats indicators list
        setChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCountBuyer: 0, unreadCountSeller: 0 } : c));
      }
    } catch (err) {
      setError("Failed to fetch messages");
    }
  };

  // Start chat conversation from Browse Books list (triggers introduction modal)
  const handleStartChatFromBook = (book) => {
    const bookSellerId = book.seller?._id || book.seller;
    if (bookSellerId === (user?.id || user?._id)) {
      setError("You already own this listing. Try managing it from your seller dashboard.");
      setTimeout(clearAlerts, 4000);
      return;
    }
    setIntroBook(book);
    setIntroMessage(`Hi, is this "${book.title}" book still available?`);
    setShowIntroModal(true);
  };

  const handleConfirmStartChat = async () => {
    if (!introBook) return;
    try {
      setLoading(true);
      setShowIntroModal(false);
      const res = await createConversationApi(introBook._id, introMessage);
      if (res.success) {
        setSearchParams({ mode: "user", tab: "messages" });
        setChatSubTab("requests"); // Switch sidebar to Requests tab (where pending requests are)
        const targetChat = res.data?.conversation || res.data;
        await fetchChatConversations();
        handleSelectChat(targetChat);
      }
    } catch (err) {
      setError("Failed to initialize conversation: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 4000);
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
    
    // Stop typing socket notification
    if (socket) {
      const otherUserId = activeChat.buyer === (user?.id || user?._id) ? activeChat.seller : activeChat.buyer;
      socket.emit("typing_stop", {
        conversationId: activeChat._id,
        recipientId: otherUserId
      });
    }

    try {
      if (socket && socket.connected) {
        socket.emit("send_message", {
          conversationId: activeChat._id,
          message: content
        });
        
        // Optimistic update
        const tempMsgId = "temp_" + Date.now();
        setChatMessages(prev => [...prev, {
          _id: tempMsgId,
          sender: user?.id || user?._id,
          content,
          message: content,
          messageType: "text",
          createdAt: new Date().toISOString()
        }]);
      } else {
        // Fallback HTTP
        const res = await sendMessageApi(activeChat._id, content);
        if (res.success) {
          setChatMessages(prev => [...prev, {
            ...res.data?.message,
            content: res.data?.message?.message
          }]);
          setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, lastMessage: res.data?.message } : c));
        }
      }
    } catch (err) {
      setError("Message sending failed");
    }
  };

  // Typing event handler
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (!socket || !activeChat) return;

    const otherUserId = activeChat.buyer === (user?.id || user?._id) ? activeChat.seller : activeChat.buyer;
    if (!otherUserId) return;

    socket.emit("typing_start", {
      conversationId: activeChat._id,
      recipientId: otherUserId
    });

    if (window.typingTimeout) clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit("typing_stop", {
        conversationId: activeChat._id,
        recipientId: otherUserId
      });
    }, 1500);
  };

  // --- Purchase / Checkout handlers ---
  const handleOpenCheckout = async () => {
    if (!activeChat || !activeChat.listing) return;
    setCheckoutLoading(true);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCodeInput("");
    try {
      // Pre-initialize checkout order without coupon first
      const res = await createPaymentOrderApi(activeChat.listing._id);
      if (res.success) {
        setTempPaymentOrder(res.data.order);
        setShowCheckoutModal(true);
      }
    } catch (err) {
      setError("Checkout failed to initialize: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 4000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim() || !activeChat?.listing) return;
    setCheckoutLoading(true);
    try {
      const res = await createPaymentOrderApi(activeChat.listing._id, couponCodeInput.toUpperCase());
      if (res.success) {
        setTempPaymentOrder(res.data.order);
        setAppliedCoupon(couponCodeInput.toUpperCase());
        // Calculate discount amount from differences
        const originalPrice = activeChat.listing.price;
        const finalPrice = res.data.order.amount / 100;
        setCouponDiscount(Math.max(0, originalPrice - finalPrice));
        showToast("Coupon applied successfully!", "success");
      }
    } catch (err) {
      setError("Invalid or unauthorized coupon code");
      setTimeout(clearAlerts, 3000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmMockPurchase = async () => {
    if (!tempPaymentOrder || !activeChat?.listing) return;
    setCheckoutLoading(true);
    try {
      // Simulate Razorpay signature verification
      const verifyData = {
        razorpayOrderId: tempPaymentOrder.id,
        razorpayPaymentId: "pay_mock_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        signature: "mock-verified-signature"
      };

      const res = await verifyPaymentApi(verifyData);
      if (res.success) {
        setShowCheckoutModal(false);
        showToast("Book purchased successfully!", "success");
        
        // Setup review triggers
        setReviewedListing(activeChat.listing);
        const sellerProfile = activeChat.participants?.find(p => p._id !== (user?.id || user?._id));
        setReviewedSeller(sellerProfile);
        
        // Refresh Listing and Chat details
        await fetchChatConversations();
        if (activeChat) {
          const detailRes = await getConversationMessagesApi(activeChat._id);
          if (detailRes.success) {
            setChatMessages(detailRes.data?.messages?.map(m => ({ ...m, content: m.message })) || []);
          }
          // Update local status
          setActiveChat(prev => ({
            ...prev,
            listing: { ...prev.listing, status: "sold" }
          }));
        }

        // Show review popup prompt (Auto Review Request)
        setTimeout(() => {
          setShowReviewModal(true);
        }, 1500);
      }
    } catch (err) {
      setError("Payment verification failed: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 4000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // --- Feedback / Review Submit Handler ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewedSeller || !reviewedListing) return;
    setReviewLoading(true);
    try {
      const reviewPayload = {
        sellerId: reviewedSeller._id || reviewedSeller.id,
        rating: reviewRating,
        review: reviewText,
        listingId: reviewedListing._id || reviewedListing.id
      };
      const res = await createReviewApi(reviewPayload);
      if (res.success) {
        showToast("Review submitted successfully! Thank you.", "success");
        setShowReviewModal(false);
        setReviewText("");
        setReviewRating(5);
      }
    } catch (err) {
      setError("Review submission failed: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 4000);
    } finally {
      setReviewLoading(false);
    }
  };

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
              <div style={{ padding: "12px", borderBottom: "1px solid var(--color-border-default)" }}>
                <input 
                  type="text" 
                  placeholder="Search chats or books..." 
                  className="form-control"
                  style={{ width: "100%", padding: "6px 12px", fontSize: "12px", borderRadius: "16px", border: "1px solid var(--color-border-medium)" }}
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-default)" }}>
                <button 
                  className={`btn-subtab ${chatSubTab === "chats" ? "active" : ""}`}
                  style={{ flex: 1, padding: "8px", border: "none", background: "none", fontSize: "12px", fontWeight: "600", borderBottom: chatSubTab === "chats" ? "2px solid var(--color-brand)" : "none", color: chatSubTab === "chats" ? "var(--color-brand)" : "var(--color-text-secondary)" }}
                  onClick={() => setChatSubTab("chats")}
                >
                  Chats (Accepted)
                </button>
                <button 
                  className={`btn-subtab ${chatSubTab === "requests" ? "active" : ""}`}
                  style={{ flex: 1, padding: "8px", border: "none", background: "none", fontSize: "12px", fontWeight: "600", borderBottom: chatSubTab === "requests" ? "2px solid var(--color-brand)" : "none", color: chatSubTab === "requests" ? "var(--color-brand)" : "var(--color-text-secondary)" }}
                  onClick={() => setChatSubTab("requests")}
                >
                  Requests
                </button>
              </div>

              <div className="channels-scroll-container">
                {chats.length > 0 ? (
                  chats
                    .filter((chat) => {
                      // Filter by status tab
                      if (chatSubTab === "chats") {
                        return chat.status === "accepted";
                      } else {
                        // pending/rejected/closed go to requests
                        return chat.status !== "accepted";
                      }
                    })
                    .filter((chat) => {
                      // Filter by search query
                      if (!chatSearchQuery.trim()) return true;
                      const recipient = chat.participants?.find(p => p._id !== (user?._id || user?.id));
                      const query = chatSearchQuery.toLowerCase();
                      return (
                        recipient?.name?.toLowerCase().includes(query) ||
                        chat.listing?.title?.toLowerCase().includes(query)
                      );
                    })
                    .map((chat) => {
                      const recipient = chat.participants?.find(p => p._id !== (user?._id || user?.id));
                      const isActive = activeChat?._id === chat._id;
                      const unreadCount = (user?.id || user?._id) === chat.buyer ? chat.unreadCountBuyer : chat.unreadCountSeller;
                      
                      return (
                        <div 
                          className={`channel-row-item ${isActive ? "active" : ""}`}
                          key={chat._id}
                          onClick={() => handleSelectChat(chat)}
                          style={{ position: "relative" }}
                        >
                          <img 
                            src={recipient?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                            alt="Recipient" 
                          />
                          <div className="channel-summary">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <h4>{recipient?.name || "Student"}</h4>
                              <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                                {chat.listing?.price ? `₹${chat.listing.price}` : ""}
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-brand)", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {chat.listing?.title}
                            </div>
                            <span className="last-msg-preview">
                              {chat.lastMessage?.messageType === "system" ? (
                                <em>{chat.lastMessage?.content || chat.lastMessage?.message}</em>
                              ) : (
                                chat.lastMessage?.content || chat.lastMessage?.message || "Open chat request..."
                              )}
                            </span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="badge badge-danger" style={{ position: "absolute", right: "12px", bottom: "14px", minWidth: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", padding: "2px" }}>
                              {unreadCount}
                            </span>
                          )}
                          {chat.status === "pending" && (
                            <span className="badge badge-warning" style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", alignSelf: "flex-start", marginTop: "4px" }}>
                              Pending
                            </span>
                          )}
                          {chat.status === "rejected" && (
                            <span className="badge badge-danger" style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", alignSelf: "flex-start", marginTop: "4px" }}>
                              Declined
                            </span>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="channels-empty-box">
                    <p>No conversations found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Message Window */}
            <div className="chat-messages-window" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {activeChat ? (
                <>
                  <div className="chat-window-header" style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="recipient-info">
                        <img 
                          src={activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                          alt="User avatar" 
                        />
                        <div>
                          <h4 style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.name}
                            {activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.isVerified && (
                              <i className="ri-checkbox-circle-fill" style={{ color: "var(--color-brand)", fontSize: "14px" }} title="Verified Student"></i>
                            )}
                          </h4>
                          <p>{activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.collegeName || "SVNIT Student"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Listing Card inside Chat Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg-surface-2)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border-subtle)" }}>
                      <img 
                        src={activeChat.listing?.images?.[0] || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100"} 
                        alt="Listing Cover" 
                        style={{ width: "40px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "700" }}>{activeChat.listing?.title}</h5>
                        <p style={{ margin: "0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          Condition: <strong style={{ textTransform: "capitalize" }}>{activeChat.listing?.condition?.replace("_", " ")}</strong>
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-text-primary)" }}>₹{activeChat.listing?.price}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {activeChat.listing?.status === "sold" ? (
                            <span className="badge badge-success" style={{ fontSize: "10px", padding: "4px 8px" }}>Sold / Purchased</span>
                          ) : (
                            <>
                              {(user?.id || user?._id) === activeChat.buyer && activeChat.status === "accepted" && (
                                <button 
                                  className="btn btn-brand btn-xs" 
                                  onClick={handleOpenCheckout}
                                  disabled={checkoutLoading}
                                >
                                  Buy Now
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages-history-pane" style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isMe = msg.sender === (user?.id || user?._id);
                        if (msg.messageType === "system") {
                          return (
                            <div key={msg._id} style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                              <div style={{ backgroundColor: "var(--color-bg-surface-2)", color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: "600", padding: "6px 16px", borderRadius: "16px", border: "1px solid var(--color-border-subtle)" }}>
                                <i className="ri-information-line" style={{ marginRight: "4px" }}></i>
                                {msg.content || msg.message}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className={`message-bubble-row ${isMe ? "sender-me" : "sender-them"}`} key={msg._id}>
                            <div className="bubble-content-card">
                              <p>{msg.content || msg.message}</p>
                              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px" }}>
                                <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && (
                                  <i className="ri-check-double-line" style={{ fontSize: "10px", color: msg.isRead ? "var(--color-brand)" : "rgba(255,255,255,0.6)" }}></i>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="messages-empty-state">
                        <i className="ri-question-answer-line"></i>
                        <p>No messages yet. Say hello to initiate details.</p>
                      </div>
                    )}
                    {otherPartyTyping && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                        <span className="loading-spinner-xs" style={{ width: "10px", height: "10px" }}></span>
                        <span>Typing...</span>
                      </div>
                    )}
                  </div>

                  {/* State-based Chat Input Bar */}
                  {activeChat.status === "pending" ? (
                    <div style={{ backgroundColor: "#FEF7E0", padding: "12px", borderTop: "1px solid var(--color-border-default)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <i className="ri-time-line text-warning" style={{ fontSize: "18px" }}></i>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#B06000" }}>
                        Chat Request Pending. You can type messages once the seller accepts.
                      </span>
                    </div>
                  ) : activeChat.status === "rejected" ? (
                    <div style={{ backgroundColor: "#FCE8E6", padding: "12px", borderTop: "1px solid var(--color-border-default)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <i className="ri-error-warning-line text-danger" style={{ fontSize: "18px" }}></i>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#C5221F" }}>
                        Seller declined this request. Conversation locked forever.
                      </span>
                    </div>
                  ) : activeChat.status === "closed" ? (
                    <div style={{ backgroundColor: "var(--color-bg-surface-2)", padding: "12px", borderTop: "1px solid var(--color-border-default)", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                        This conversation has been closed.
                      </span>
                    </div>
                  ) : (
                    <form className="chat-input-row-bar" onSubmit={handleSendMessage}>
                      <input 
                        type="text" 
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={handleChatInputChange}
                        maxLength={1000}
                      />
                      <button type="submit" className="btn btn-brand" disabled={!chatInput.trim()}>
                        <i className="ri-send-plane-fill"></i>
                      </button>
                    </form>
                  )}
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

      {/* --- CHAT INTRO MESSAGE MODAL --- */}
      {showIntroModal && introBook && (
        <div className="modal-backdrop-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-card-container animate-slide-up" style={{ backgroundColor: "var(--color-bg-page)", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700" }}>Start Chat with Seller</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 16px 0" }}>
              Send an introductory message for <strong>"{introBook.title}"</strong>. Buyers can only send one message before the seller accepts.
            </p>
            <div className="form-group-field" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", marginBottom: "6px", display: "block" }}>Introductory Message</label>
              <textarea 
                className="form-control"
                rows="3"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border-medium)", resize: "none" }}
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowIntroModal(false)}>Cancel</button>
              <button className="btn btn-brand btn-sm" onClick={handleConfirmStartChat} disabled={!introMessage.trim()}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MOCK CHECKOUT WITH COUPON MODAL --- */}
      {showCheckoutModal && activeChat?.listing && (
        <div className="modal-backdrop-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-card-container animate-slide-up" style={{ backgroundColor: "var(--color-bg-page)", padding: "24px", borderRadius: "12px", width: "420px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", borderBottom: "1px solid var(--color-border-default)", paddingBottom: "12px" }}>
              Checkout Book Listing
            </h3>
            
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Book Title:</span>
                <span style={{ fontSize: "13px", fontWeight: "700", textAlign: "right" }}>{activeChat.listing.title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Original Price:</span>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>₹{activeChat.listing.price}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "var(--color-brand)" }}>
                  <span style={{ fontSize: "13px" }}>Discount Applied:</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>-₹{couponDiscount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border-default)", paddingTop: "12px", marginTop: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700" }}>Total Amount:</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-brand)" }}>
                  ₹{Math.max(0, activeChat.listing.price - couponDiscount)}
                </span>
              </div>
            </div>

            {/* Coupon Code block */}
            <div style={{ background: "var(--color-bg-surface-2)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Have a Negotiated Coupon?</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ flex: 1, padding: "6px 12px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--color-border-medium)" }}
                  placeholder="e.g. PM-XXXXXX"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                <button 
                  className="btn btn-outline btn-xs" 
                  onClick={handleApplyCoupon}
                  disabled={!couponCodeInput.trim() || !!appliedCoupon || checkoutLoading}
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <span style={{ fontSize: "11px", color: "var(--color-brand)", display: "block", marginTop: "4px", fontWeight: "600" }}>
                  <i className="ri-checkbox-circle-fill"></i> Coupon "{appliedCoupon}" applied!
                </span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCheckoutModal(false)} disabled={checkoutLoading}>Cancel</button>
              <button className="btn btn-brand btn-sm" onClick={handleConfirmMockPurchase} disabled={checkoutLoading}>
                {checkoutLoading ? "Processing..." : "Confirm & Pay (Mock)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AUTO REVIEW / RATING MODAL (Auto Review Request) --- */}
      {showReviewModal && reviewedSeller && reviewedListing && (
        <div className="modal-backdrop-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form className="modal-card-container animate-slide-up" onSubmit={handleSubmitReview} style={{ backgroundColor: "var(--color-bg-page)", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700" }}>Review Your Purchase</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 16px 0" }}>
              Share your experience purchasing <strong>"{reviewedListing.title}"</strong> from <strong>{reviewedSeller.name}</strong>.
            </p>
            
            {/* Rating Stars Selector */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star} 
                  className={star <= reviewRating ? "ri-star-fill" : "ri-star-line"} 
                  style={{ fontSize: "28px", color: "#F4B400", cursor: "pointer" }}
                  onClick={() => setReviewRating(star)}
                ></i>
              ))}
            </div>

            <div className="form-group-field" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", marginBottom: "6px", display: "block" }}>Comments (Optional)</label>
              <textarea 
                className="form-control"
                rows="3"
                placeholder="How was the textbook condition? Did you coordinate meet location successfully?"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--color-border-medium)", resize: "none" }}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowReviewModal(false)}>Skip</button>
              <button type="submit" className="btn btn-brand btn-sm" disabled={reviewLoading}>
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
