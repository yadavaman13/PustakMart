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
  getImageKitAuthParamsApi,
  acceptConversationApi,
  rejectConversationApi,
  generateCouponApi,
  getSellerEarningsApi
} from "../services/dashboard.api.js";
import { useSocket } from "../../shared/context/SocketContext.jsx";
import axios from "axios";
import ProfileSettingsView from "../components/ProfileSettingsView.jsx";

export const SellerDashboard = ({ activeTab }) => {
  const { user, checkSession } = useAuth();
  const [, setSearchParams] = useSearchParams();

  // Shared states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
  const [bookCategory, setBookCategory] = useState("engineering");
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
  const socket = useSocket();
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSubTab, setChatSubTab] = useState("requests"); // "requests" (pending) or "chats" (accepted)
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);

  // Seller coupon creation state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Seller earnings state
  const [earningsData, setEarningsData] = useState({
    grossEarnings: 0,
    commission: 0,
    netEarnings: 0,
    booksSold: 0,
    monthlyAnalytics: []
  });

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    clearAlerts();
    if (activeTab === "overview" || activeTab === "sales-analytics" || activeTab === "views") {
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
      const res = await getHomeListingsApi({ seller: user.id || user._id, status: "all" });
      if (res.success) {
        setSellerListings(res.listings || []);
      }
      
      const reviewRes = await getSellerReviewsApi(user.id || user._id);
      if (reviewRes.success) {
        setReviews(reviewRes.data?.reviews || []);
      }

      const chatsRes = await getConversationsApi();
      if (chatsRes.success) {
        setChats(chatsRes.data?.conversations || []);
      }

      // Fetch Seller Earnings & Analytics
      const earningsRes = await getSellerEarningsApi();
      if (earningsRes.success) {
        setEarningsData({
          grossEarnings: earningsRes.grossEarnings || 0,
          commission: earningsRes.commission || 0,
          netEarnings: earningsRes.netEarnings || 0,
          booksSold: earningsRes.booksSold || 0,
          monthlyAnalytics: earningsRes.monthlyAnalytics || []
        });
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
      const res = await getHomeListingsApi({ seller: user.id || user._id, status: "all" });
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
        const filtered = (res.requests || []).filter(r => r.requestedBy?._id !== (user?.id || user?._id));
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
      const res = await getSellerReviewsApi(user.id || user._id);
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

  const handleBookCoverSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Book cover photo must be smaller than 2MB.", "error");
        setCoverFile(null);
        return;
      }
      setCoverFile(file);
      showToast("Cover photo selected.", "success");
    } else {
      setCoverFile(null);
    }
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
        showToast("Uploading cover image to server...", "success");
        const url = await handleUploadImage(coverFile);
        imageUrls.push(url);
        showToast("Cover photo uploaded successfully!", "success");
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
        showToast("Listing published successfully!", "success");
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
      showToast(err.response?.data?.message || "Failed to create listing", "error");
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

  // Socket.io Real-Time Event Listener binding
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data) => {
      console.log("Seller socket message received:", data);
      if (activeChat && activeChat._id === data.conversationId) {
        setChatMessages(prev => {
          // Avoid duplicate UI rendering (e.g. from duplicate socket events)
          if (prev.some(m => m._id === data.message._id)) return prev;

          // If the message is from me, replace the corresponding optimistic message
          const myId = user?.id || user?._id;
          if (data.message.sender === myId) {
            const tempIndex = prev.findIndex(m => 
              m._id.toString().startsWith("temp_") && 
              (m.message === data.message.message || m.content === data.message.message)
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = {
                ...data.message,
                content: data.message.message
              };
              return updated;
            }
          }

          // Otherwise, append the message
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

    // Listen to new conversation requests (when a buyer starts a chat)
    const handleConversationRequest = (data) => {
      console.log("New conversation request received:", data);
      // Refresh chats list to display the new request
      fetchConversations();
      showToast(`New chat request from ${data.buyer?.name || "Buyer"}!`, "info");
    };

    socket.on("message_received", handleMessageReceived);
    socket.on("conversation_accepted", handleConversationAccepted);
    socket.on("conversation_rejected", handleConversationRejected);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("message_read", handleMessageRead);
    socket.on("conversation_request", handleConversationRequest);

    return () => {
      socket.off("message_received", handleMessageReceived);
      socket.off("conversation_accepted", handleConversationAccepted);
      socket.off("conversation_rejected", handleConversationRejected);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("message_read", handleMessageRead);
      socket.off("conversation_request", handleConversationRequest);
    };
  }, [socket, activeChat, user]);

  // Message chat handlers
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

        // Reset unread badges count in local state
        setChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCountBuyer: 0, unreadCountSeller: 0 } : c));
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

        // Optimistic UI update
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
      setError("Failed to send message");
    }
  };

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

  // --- Seller Conversation Action handlers ---
  const handleAcceptChat = async (chatId) => {
    try {
      setLoading(true);
      if (socket && socket.connected) {
        socket.emit("accept_conversation", { conversationId: chatId });
        showToast("Conversation request accepted!", "success");
        // Reload list and active state after timeout
        setTimeout(async () => {
          await fetchConversations();
          if (activeChat && activeChat._id === chatId) {
            handleSelectChat({ ...activeChat, status: "accepted" });
          }
        }, 300);
      } else {
        const res = await acceptConversationApi(chatId);
        if (res.success) {
          showToast("Conversation request accepted!", "success");
          await fetchConversations();
          if (activeChat && activeChat._id === chatId) {
            handleSelectChat(res.data.conversation);
          }
        }
      }
    } catch (err) {
      setError("Error accepting chat request");
      setTimeout(clearAlerts, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectChat = async (chatId) => {
    try {
      setLoading(true);
      if (socket && socket.connected) {
        socket.emit("reject_conversation", { conversationId: chatId });
        showToast("Conversation request declined.", "info");
        setTimeout(async () => {
          await fetchConversations();
          if (activeChat && activeChat._id === chatId) {
            handleSelectChat({ ...activeChat, status: "rejected" });
          }
        }, 300);
      } else {
        const res = await rejectConversationApi(chatId);
        if (res.success) {
          showToast("Conversation request declined.", "info");
          await fetchConversations();
          if (activeChat && activeChat._id === chatId) {
            handleSelectChat(res.data.conversation);
          }
        }
      }
    } catch (err) {
      setError("Error declining chat request");
      setTimeout(clearAlerts, 3000);
    } finally {
      setLoading(false);
    }
  };

  // --- Seller Coupon creation handlers ---
  const handleOpenCouponCreator = () => {
    setCouponDiscountAmount("");
    setShowCouponModal(true);
  };

  const handleGenerateCouponCode = async (e) => {
    e.preventDefault();
    if (!activeChat || !couponDiscountAmount || Number(couponDiscountAmount) <= 0) return;
    setCouponLoading(true);
    try {
      const res = await generateCouponApi(activeChat._id, Number(couponDiscountAmount));
      if (res.success) {
        showToast(`Discount coupon generated successfully! Code: ${res.data.coupon?.code}`, "success");
        setShowCouponModal(false);
        
        // Optimistically add system message announcing discount code
        if (res.data.systemMessage) {
          setChatMessages(prev => [...prev, {
            ...res.data.systemMessage,
            content: res.data.systemMessage.message
          }]);
        }
      }
    } catch (err) {
      setError("Failed to generate coupon: " + (err.response?.data?.message || err.message));
      setTimeout(clearAlerts, 4000);
    } finally {
      setCouponLoading(false);
    }
  };

  // Metrics computation for dashboard Overview
  const activeCount = sellerListings.filter(l => l.status === "active").length;
  const soldCount = sellerListings.filter(l => l.status === "sold").length;
  const totalViews = sellerListings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);

  return (
    <div className="seller-dashboard-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification-bubble ${toast.type}`}>
          <div className="toast-content">
            <i className={toast.type === "success" ? "ri-checkbox-circle-fill" : "ri-error-warning-fill"}></i>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast(null)} aria-label="Close notification">
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

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
                    <option value="new">Brand New (Intact cover)</option>
                    <option value="like_new">Like New (Negligible marks)</option>
                    <option value="good">Good (Fully readable)</option>
                    <option value="fair">Fair (Visible signs of wear)</option>
                    <option value="poor">Poor (Damaged/Marked)</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label htmlFor="category">Category</label>
                  <select 
                    id="category"
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                  >
                    <option value="engineering">Engineering Reference</option>
                    <option value="medical">Medical Science</option>
                    <option value="school">School Education</option>
                    <option value="competitive_exam">Competitive Exams</option>
                    <option value="novel">Novels & Fiction</option>
                    <option value="other">Others</option>
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
                <label>Upload Book Cover Photo</label>
                <p className="field-hint">Upload Cover. JPG, PNG supported. Max 2MB.</p>
                <div className="custom-file-upload-wrapper" style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <label htmlFor="cover-pic" className="btn btn-outline btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                    <i className="ri-image-add-line"></i> {coverFile ? "Change Image" : "Choose Image"}
                  </label>
                  <input 
                    type="file" 
                    id="cover-pic" 
                    accept="image/*"
                    onChange={handleBookCoverSelect}
                    style={{ display: "none" }}
                  />
                  <span className="file-name-preview" style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    {coverFile ? coverFile.name : "No image selected"}
                  </span>
                </div>
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

      {/* --- 5. SALES ANALYTICS VIEW --- */}
      {activeTab === "sales-analytics" && !loading && (
        <div className="tab-view-container sales-analytics-view animate-fade">
          <div className="grid-summary-metric-cards">
            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-money-dollar-box-line"></i></div>
              <div className="card-numeric-info">
                <h3>₹{(earningsData.grossEarnings || 0).toLocaleString()}</h3>
                <p>Gross Earnings</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-percent-line"></i></div>
              <div className="card-numeric-info">
                <h3>₹{(earningsData.commission || 0).toLocaleString()}</h3>
                <p>Platform Commission (10%)</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-wallet-3-line"></i></div>
              <div className="card-numeric-info">
                <h3>₹{(earningsData.netEarnings || 0).toLocaleString()}</h3>
                <p>Net Earnings</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-book-open-line"></i></div>
              <div className="card-numeric-info">
                <h3>{earningsData.booksSold || 0}</h3>
                <p>Books Sold</p>
              </div>
            </div>
          </div>

          <div className="split-view-container">
            {/* Left: Monthly Sales volume chart */}
            <div className="feed-panel listings-feed-panel">
              <h2 className="panel-title-heading">Monthly Sales (Volume)</h2>
              <p className="panel-description-text">Quantity of academic book listings successfully traded.</p>
              
              <div className="bar-charts-container" style={{ marginTop: "24px" }}>
                <div className="chart-vertical-bars">
                  {earningsData.monthlyAnalytics && earningsData.monthlyAnalytics.length > 0 ? (
                    earningsData.monthlyAnalytics.map((data, idx) => {
                      const maxVal = Math.max(...earningsData.monthlyAnalytics.map(d => d.salesCount), 1);
                      const pct = (data.salesCount / maxVal) * 100;
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const label = `${monthNames[data.month - 1] || data.month} ${data.year}`;
                      return (
                        <div className="chart-bar-row" key={idx}>
                          <span className="bar-label">{label}</span>
                          <div className="bar-wrapper">
                            <div className="bar-fill seller-color" style={{ width: `${Math.max(6, pct)}%` }}></div>
                          </div>
                          <span className="bar-value">{data.salesCount} sold</span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", padding: "16px 0" }}>
                      No sales volume history recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Monthly Earnings value chart */}
            <div className="feed-panel activity-feed-panel">
              <h2 className="panel-title-heading">Monthly Net Earnings (Value)</h2>
              <p className="panel-description-text">Payout amounts credited after platform commission deductions.</p>
              
              <div className="bar-charts-container" style={{ marginTop: "24px" }}>
                <div className="chart-vertical-bars">
                  {earningsData.monthlyAnalytics && earningsData.monthlyAnalytics.length > 0 ? (
                    earningsData.monthlyAnalytics.map((data, idx) => {
                      const maxVal = Math.max(...earningsData.monthlyAnalytics.map(d => d.earnings), 1);
                      const pct = (data.earnings / maxVal) * 100;
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const label = `${monthNames[data.month - 1] || data.month} ${data.year}`;
                      return (
                        <div className="chart-bar-row" key={idx}>
                          <span className="bar-label">{label}</span>
                          <div className="bar-wrapper">
                            <div className="bar-fill seller-color" style={{ width: `${Math.max(6, pct)}%` }}></div>
                          </div>
                          <span className="bar-value">₹{(data.earnings || 0).toLocaleString()}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", padding: "16px 0" }}>
                      No earnings payout history recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 6. TRAFFIC & VIEWS VIEW --- */}
      {activeTab === "views" && !loading && (
        <div className="tab-view-container views-traffic-view animate-fade">
          <div className="grid-summary-metric-cards">
            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-eye-line"></i></div>
              <div className="card-numeric-info">
                <h3>{totalViews}</h3>
                <p>Total Book Views</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-book-read-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{sellerListings.length > 0 ? (totalViews / sellerListings.length).toFixed(1) : 0}</h3>
                <p>Avg Views / Listing</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-line-chart-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{sellerListings.length > 0 ? Math.max(...sellerListings.map(l => l.viewsCount || 0)) : 0}</h3>
                <p>Max Book Views</p>
              </div>
            </div>

            <div className="metric-box-card">
              <div className="card-icon-circle seller-color"><i className="ri-folders-fill"></i></div>
              <div className="card-numeric-info">
                <h3>{sellerListings.length}</h3>
                <p>Total Listings</p>
              </div>
            </div>
          </div>

          <div className="split-view-container">
            {/* Left: Traffic by Category */}
            <div className="feed-panel listings-feed-panel">
              <h2 className="panel-title-heading">Traffic by Category</h2>
              <p className="panel-description-text">Distribution of traffic views across academic book categories.</p>
              
              <div className="bar-charts-container" style={{ marginTop: "16px" }}>
                <div className="chart-vertical-bars">
                  {Object.entries({
                    engineering: "Engineering",
                    medical: "Medical",
                    school: "School",
                    competitive_exam: "Competitive",
                    novel: "Novels",
                    other: "Others"
                  }).map(([cat, label]) => {
                    const catListings = sellerListings.filter(l => l.category?.toLowerCase() === cat);
                    const catViews = catListings.reduce((sum, l) => sum + (l.viewsCount || 0), 0);
                    const maxViews = Math.max(...["engineering", "medical", "school", "competitive_exam", "novel", "other"].map(c => 
                      sellerListings.filter(l => l.category?.toLowerCase() === c).reduce((sum, l) => sum + (l.viewsCount || 0), 0)
                    ), 1);
                    const pct = (catViews / maxViews) * 100;
                    return (
                      <div className="chart-bar-row" key={cat}>
                        <span className="bar-label">{label}</span>
                        <div className="bar-wrapper">
                          <div className="bar-fill seller-color" style={{ width: `${Math.max(4, pct)}%` }}></div>
                        </div>
                        <span className="bar-value">{catViews} views</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Most Viewed Book details */}
            <div className="feed-panel activity-feed-panel">
              <h2 className="panel-title-heading">Top Performing Book</h2>
              <p className="panel-description-text">Detailed view of your most visited academic book listing.</p>
              
              {sellerListings.length > 0 ? (
                (() => {
                  const topBook = [...sellerListings].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))[0];
                  return (
                    <div className="top-performing-book-widget" style={{ marginTop: "16px" }}>
                      <div className="top-book-header" style={{ display: "flex", gap: "12px" }}>
                        <img 
                          src={topBook.images?.[0] || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-1781805823490.png"} 
                          alt={topBook.title}
                          style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover" }}
                        />
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--color-text-primary)" }}>{topBook.title}</h4>
                          <span className={`status-badge ${topBook.status}`} style={{ marginTop: "4px" }}>{topBook.status}</span>
                        </div>
                      </div>
                      <div className="top-book-stats-rows" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="row-item" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Total Views</span>
                          <strong>{topBook.viewsCount || 0} views</strong>
                        </div>
                        <div className="row-item" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Price Tag</span>
                          <strong>₹{topBook.price}</strong>
                        </div>
                        <div className="row-item" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Category</span>
                          <strong>{topBook.category}</strong>
                        </div>
                        <div className="row-item" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Condition</span>
                          <strong>{topBook.condition}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="empty-state-mini-box">
                  <p>No listings views data available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Table: Full Listings View Counts */}
          <div className="feed-panel manage-requests-panel" style={{ marginTop: "24px" }}>
            <h2 className="panel-title-heading">Book Listing Traffic Inventory</h2>
            <p className="panel-description-text">Full breakdown of pageviews and status across all your catalog listings.</p>
            
            <div className="requests-manage-table-wrapper" style={{ marginTop: "16px" }}>
              {sellerListings.length > 0 ? (
                <table className="requests-manage-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Condition</th>
                      <th>Views</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerListings.map(book => (
                      <tr key={book._id}>
                        <td><strong>{book.title}</strong></td>
                        <td>{book.category}</td>
                        <td>₹{book.price}</td>
                        <td><span className={`condition-indicator-tag ${book.condition}`}>{book.condition}</span></td>
                        <td>
                          <span className="views-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                            <i className="ri-eye-line" style={{ color: "var(--color-brand-hover)" }}></i> {book.viewsCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${book.status === "active" ? "open" : "fulfilled"}`}>
                            {book.status === "active" ? "active" : "sold"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  You have not published any book listings yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 7. CUSTOMER REVIEWS VIEW --- */}
      {activeTab === "reviews" && !loading && (
        <div className="tab-view-container reviews-view animate-fade">
          <div className="split-view-container">
            {/* Left: Star breakdown */}
            <div className="feed-panel profile-metadata-panel">
              <h2 className="panel-title-heading">Rating Distribution</h2>
              
              <div className="radial-rating-box">
                <h2>{user?.averageRating || 0}</h2>
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <i className={`ri-star-fill ${i < Math.round(user?.averageRating || 0) ? "text-gold" : "text-gray"}`} key={i}></i>
                  ))}
                </div>
                <p>Average Seller Rating ({reviews.length} reviews)</p>
              </div>

              <div className="rating-distribution-stack" style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div className="star-row-item" key={star} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                      <span style={{ minWidth: "30px", fontWeight: "600" }}>{star} ★</span>
                      <div className="star-bar-wrapper" style={{ flex: 1, height: "8px", backgroundColor: "var(--color-bg-surface-3)", borderRadius: "4px", overflow: "hidden" }}>
                        <div className="star-bar-fill" style={{ height: "100%", width: `${pct}%`, backgroundColor: "var(--color-brand)" }}></div>
                      </div>
                      <span style={{ minWidth: "20px", textAlign: "right", color: "var(--color-text-secondary)" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Feedback reviews scroller list */}
            <div className="feed-panel settings-form-panel">
              <h2 className="panel-title-heading">Customer Reviews</h2>
              <p className="panel-description-text">Recent feedback and grades received from book buyers.</p>
              
              <div className="reviews-scroller-box" style={{ marginTop: "16px" }}>
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
              <div style={{ padding: "12px", borderBottom: "1px solid var(--color-border-default)" }}>
                <input 
                  type="text" 
                  placeholder="Search buyer or book..." 
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
                  Active Chats
                </button>
                <button 
                  className={`btn-subtab ${chatSubTab === "requests" ? "active" : ""}`}
                  style={{ flex: 1, padding: "8px", border: "none", background: "none", fontSize: "12px", fontWeight: "600", borderBottom: chatSubTab === "requests" ? "2px solid var(--color-brand)" : "none", color: chatSubTab === "requests" ? "var(--color-brand)" : "var(--color-text-secondary)" }}
                  onClick={() => setChatSubTab("requests")}
                >
                  Pending Requests
                </button>
              </div>

              <div className="channels-scroll-container">
                {chats.length > 0 ? (
                  chats
                    .filter((chat) => {
                      if (chatSubTab === "chats") {
                        return chat.status === "accepted";
                      } else {
                        return chat.status !== "accepted";
                      }
                    })
                    .filter((chat) => {
                      if (!chatSearchQuery.trim()) return true;
                      const recipient = chat.participants?.find(p => p._id !== (user?._id || user?.id));
                      const query = chatSearchQuery.toLowerCase();
                      return (
                        recipient?.name?.toLowerCase().includes(query) ||
                        chat.listing?.title?.toLowerCase().includes(query)
                      );
                    })
                    .map((chat) => {
                      const recipient = chat.participants?.find(p => p._id !== (user?.id || user?._id));
                      const isActive = activeChat?._id === chat._id;
                      const unreadCount = (user?.id || user?._id) === chat.buyer ? chat.unreadCountBuyer : chat.unreadCountSeller;
                      
                      return (
                        <div 
                          className={`channel-row-item ${isActive ? "active" : ""}`}
                          key={chat._id}
                          onClick={() => handleSelectChat(chat)}
                          style={{ position: "relative" }}
                        >
                          <img src={recipient?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="Recipient" />
                          <div className="channel-summary">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <h4>{recipient?.name || "Customer"}</h4>
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
                                chat.lastMessage?.content || chat.lastMessage?.message || "Click to open inquiry..."
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
                              Request
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
                    <p>No conversation threads found.</p>
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
                        <img src={activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="avatar" />
                        <div>
                          <h4>{activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.name}</h4>
                          <p>{activeChat.participants?.find(p => p._id !== (user?.id || user?._id))?.collegeName || "SVNIT Customer"}</p>
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
                          Original Listing Price: <strong>₹{activeChat.listing?.price}</strong>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {activeChat.listing?.status === "sold" ? (
                          <span className="badge badge-success" style={{ fontSize: "10px", padding: "4px 8px" }}>Marked Sold / Closed</span>
                        ) : (
                          <>
                            {activeChat.status === "accepted" && (
                              <>
                                <button 
                                  className="btn btn-outline btn-xs" 
                                  onClick={handleOpenCouponCreator}
                                >
                                  <i className="ri-coupon-2-line"></i> Offer Coupon
                                </button>
                                <button 
                                  className="btn btn-brand btn-xs" 
                                  onClick={async () => {
                                    if(window.confirm("Mark book as sold manually? This increments your metric count.")) {
                                      try {
                                        const res = await markListingAsSoldApi(activeChat.listing._id);
                                        if (res.success) {
                                          showToast("Listing marked as sold successfully!", "success");
                                          setActiveChat(prev => ({
                                            ...prev,
                                            listing: { ...prev.listing, status: "sold" }
                                          }));
                                        }
                                      } catch (err) {
                                        setError("Action failed.");
                                      }
                                    }
                                  }}
                                >
                                  Mark Sold
                                </button>
                              </>
                            )}
                          </>
                        )}
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
                        <p>Say hello to reply to this customer query!</p>
                      </div>
                    )}
                    {otherPartyTyping && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                        <span className="loading-spinner-xs" style={{ width: "10px", height: "10px" }}></span>
                        <span>Buyer typing...</span>
                      </div>
                    )}
                  </div>

                  {/* State-based Footer / Controls */}
                  {activeChat.status === "pending" ? (
                    <div style={{ backgroundColor: "var(--color-bg-surface-2)", borderTop: "1px solid var(--color-border-default)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600" }}>
                        <i className="ri-question-line" style={{ color: "var(--color-brand)", fontSize: "18px" }}></i>
                        <span>Accept chat request to coordinate deal with this buyer?</span>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleRejectChat(activeChat._id)}>Decline</button>
                        <button className="btn btn-brand" style={{ flex: 1 }} onClick={() => handleAcceptChat(activeChat._id)}>Accept Chat Request</button>
                      </div>
                    </div>
                  ) : activeChat.status === "rejected" ? (
                    <div style={{ backgroundColor: "#FCE8E6", padding: "12px", borderTop: "1px solid var(--color-border-default)", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", color: "#C5221F", fontWeight: "600" }}>
                        You declined this request. Conversation locked forever.
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
                        placeholder="Type a response..."
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
                  <h3>Select a customer inquiry thread</h3>
                  <p>Reply to questions about book condition, prices, or meet coordinates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 7. SELLER PROFILE VIEW --- */}
      {activeTab === "seller-profile" && !loading && (
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
                <span>PM_SLR_{(user?.id || user?._id)?.substring(0, 10)?.toUpperCase()}</span>
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

      {/* --- SELLER COUPON CREATION MODAL --- */}
      {showCouponModal && activeChat && (
        <div className="modal-backdrop-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form className="modal-card-container animate-slide-up" onSubmit={handleGenerateCouponCode} style={{ backgroundColor: "var(--color-bg-page)", padding: "24px", borderRadius: "12px", width: "380px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700" }}>Offer Discount Coupon</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 16px 0" }}>
              Generate a custom discount coupon code for this buyer. The coupon applies only to your listing <strong>"{activeChat.listing?.title}"</strong>.
            </p>
            <div className="form-group-field" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", marginBottom: "6px", display: "block" }}>Discount Amount (₹) *</label>
              <input 
                type="number"
                className="form-control"
                required
                min="1"
                max={activeChat.listing?.price || 1000}
                placeholder="e.g. 50"
                value={couponDiscountAmount}
                onChange={(e) => setCouponDiscountAmount(e.target.value)}
              />
              <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "4px", display: "block" }}>
                This amount will be subtracted from the listing price of ₹{activeChat.listing?.price}.
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCouponModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-brand btn-sm" disabled={couponLoading}>
                {couponLoading ? "Generating..." : "Generate Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
