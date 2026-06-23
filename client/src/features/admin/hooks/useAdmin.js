import { useState, useCallback } from "react";
import {
  getAdminAnalyticsApi,
  getAdminUsersApi,
  getPendingSellersApi,
  verifySellerApi,
  updateUserStatusApi,
  getAdminListingsApi,
  getAdminReportsApi,
  resolveReportApi
} from "../services/admin.api.js";

export function useAdmin() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminAnalyticsApi();
      if (res.success && res.data) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load admin analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsersApi();
      if (res.success && res.data) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingSellers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingSellersApi();
      if (res.success && res.data) {
        setPendingSellers(res.data.sellers || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load pending sellers.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminListingsApi();
      if (res.success && res.data) {
        setListings(res.data.listings || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminReportsApi();
      if (res.success && res.data) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load reported flags.");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifySeller = useCallback(async (userId, status, comment) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await verifySellerApi(userId, status, comment);
      if (res.success) {
        setSuccess(res.message || `Seller successfully ${status}.`);
        // Refresh lists
        await fetchPendingSellers();
        await fetchUsers();
        await fetchAnalytics();
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to verify seller.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [fetchPendingSellers, fetchUsers, fetchAnalytics]);

  const updateUserStatus = useCallback(async (userId, data) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateUserStatusApi(userId, data);
      if (res.success) {
        setSuccess(res.message || "User status updated successfully.");
        await fetchUsers();
        await fetchAnalytics();
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update user status.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, fetchAnalytics]);

  const resolveReport = useCallback(async (reportId, status) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await resolveReportApi(reportId, status);
      if (res.success) {
        setSuccess(res.message || `Report successfully marked as ${status}.`);
        await fetchReports();
        await fetchListings();
        await fetchAnalytics();
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resolve report.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [fetchReports, fetchListings, fetchAnalytics]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchUsers(),
        fetchPendingSellers(),
        fetchListings(),
        fetchReports(),
      ]);
    } catch (err) {
      console.error("Error fetching all data:", err);
      setError("Some data failed to load.");
    } finally {
      setLoading(false);
    }
  }, [fetchAnalytics, fetchUsers, fetchPendingSellers, fetchListings, fetchReports]);

  return {
    analytics,
    users,
    pendingSellers,
    listings,
    reports,
    loading,
    error,
    success,
    clearMessages,
    fetchAnalytics,
    fetchUsers,
    fetchPendingSellers,
    fetchListings,
    fetchReports,
    verifySeller,
    updateUserStatus,
    resolveReport,
    fetchAllData,
  };
}
