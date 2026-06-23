import axios from "axios";
import { API_BASE_URL } from "../../../app/runtime.config.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Fetch marketplace analytics counts.
 */
export const getAdminAnalyticsApi = async () => {
  const response = await api.get("/admin/analytics");
  return response.data;
};

/**
 * Fetch list of all registered users.
 */
export const getAdminUsersApi = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

/**
 * Fetch list of pending seller verification applications.
 */
export const getPendingSellersApi = async () => {
  const response = await api.get("/auth/admin/pending-sellers");
  return response.data;
};

/**
 * Approve or Reject a seller verification application.
 * @param {string} id - User ID
 * @param {string} status - 'verified' | 'rejected'
 */
export const verifySellerApi = async (id, status, comment) => {
  const response = await api.post(`/auth/admin/verify-seller/${id}`, { status, comment });
  return response.data;
};

/**
 * Block, unblock, or soft-delete user account.
 * @param {string} id - User ID
 * @param {object} data - { isBlocked, isDeleted }
 */
export const updateUserStatusApi = async (id, data) => {
  const response = await api.put(`/auth/admin/user-status/${id}`, data);
  return response.data;
};

/**
 * Fetch all book listings.
 */
export const getAdminListingsApi = async () => {
  const response = await api.get("/admin/listings");
  return response.data;
};

/**
 * Fetch reported flags.
 */
export const getAdminReportsApi = async () => {
  const response = await api.get("/admin/reports");
  return response.data;
};

/**
 * Resolve or Dismiss listing report.
 * @param {string} id - Report ID
 * @param {string} status - 'resolved' | 'dismissed'
 */
export const resolveReportApi = async (id, status) => {
  const response = await api.patch(`/admin/reports/${id}`, { status });
  return response.data;
};
