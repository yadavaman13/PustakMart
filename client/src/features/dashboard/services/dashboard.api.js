import axios from "axios";
import { API_BASE_URL } from "../../../app/runtime.config.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 1. Listings API
export const getHomeListingsApi = async (params = {}) => {
  const response = await api.get("/book", { params });
  return response.data;
};

export const createBookListingApi = async (data) => {
  const response = await api.post("/book/create", data);
  return response.data;
};

export const updateBookListingApi = async (id, data) => {
  const response = await api.put(`/book/${id}`, data);
  return response.data;
};

export const deleteBookListingApi = async (id) => {
  const response = await api.delete(`/book/${id}`);
  return response.data;
};

export const markListingAsSoldApi = async (id) => {
  const response = await api.post(`/book/${id}/sold`);
  return response.data;
};

// 2. Book Requests API
export const getBookRequestsApi = async (params = {}) => {
  const response = await api.get("/requests", { params });
  return response.data;
};

export const createBookRequestApi = async (data) => {
  const response = await api.post("/requests", data);
  return response.data;
};

export const deleteBookRequestApi = async (id) => {
  const response = await api.delete(`/requests/${id}`);
  return response.data;
};

export const updateBookRequestApi = async (id, data) => {
  const response = await api.put(`/requests/${id}`, data);
  return response.data;
};

// 3. Saved Listings (Bookmarks) API
export const getSavedListingsApi = async () => {
  const response = await api.get("/saved-listings");
  return response.data;
};

export const toggleSaveListingApi = async (listingId) => {
  const response = await api.post(`/saved-listings/${listingId}`);
  return response.data;
};

// 4. Chats (Conversations) API
export const getConversationsApi = async () => {
  const response = await api.get("/conversations");
  return response.data;
};

export const createConversationApi = async (listingId, message) => {
  const response = await api.post("/conversations", { listingId, message });
  return response.data;
};

export const getConversationMessagesApi = async (conversationId) => {
  const response = await api.get(`/conversations/message/${conversationId}`);
  return response.data;
};

export const sendMessageApi = async (conversationId, content) => {
  const response = await api.post("/conversations/message", { conversationId, content });
  return response.data;
};

export const acceptConversationApi = async (conversationId) => {
  const response = await api.patch(`/conversations/${conversationId}/accept`);
  return response.data;
};

export const rejectConversationApi = async (conversationId) => {
  const response = await api.patch(`/conversations/${conversationId}/reject`);
  return response.data;
};

export const generateCouponApi = async (conversationId, discountAmount) => {
  const response = await api.post(`/conversations/${conversationId}/coupon`, { discountAmount });
  return response.data;
};

// 4.5 Payment & Coupon Application API
export const createPaymentOrderApi = async (listingId, couponCode) => {
  const response = await api.post("/payment/create", { listingId, couponCode });
  return response.data;
};

export const verifyPaymentApi = async (paymentData) => {
  const response = await api.post("/payment/verify", paymentData);
  return response.data;
};

// 5. Notifications API
export const getNotificationsApi = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const markNotificationReadApi = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

// 6. Reviews API
export const getSellerReviewsApi = async (sellerId) => {
  const response = await api.get(`/reviews/${sellerId}`);
  return response.data;
};

export const createReviewApi = async (data) => {
  const response = await api.post("/reviews", data);
  return response.data;
};

// 7. Seller Verification API
export const applySellerApi = async (collegeIdCard) => {
  const response = await api.post("/auth/apply-seller", { collegeIdCard });
  return response.data;
};

// 8. ImageKit upload signature API
export const getImageKitAuthParamsApi = async () => {
  const response = await api.get("/media/imagekit-auth");
  return response.data;
};

// 9. Profile & Settings management API
export const updateProfileApi = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const changePasswordApi = async (data) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

export const deleteAccountApi = async (data) => {
  const response = await api.delete("/auth/delete-account", { data });
  return response.data;
};

// 10. Seller Earnings Analytics API
export const getSellerEarningsApi = async () => {
  const response = await api.get("/seller/earnings");
  return response.data;
};
