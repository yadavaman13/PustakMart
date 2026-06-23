import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../features/auth/hooks/useAuth.js";
import AuthPage from "../features/auth/pages/AuthPage.jsx";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage.jsx";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage.jsx";
import HomePage from "../features/home/pages/HomePage.jsx";
import DashboardLayout from "../features/dashboard/components/DashboardLayout.jsx";


// Route wrapper for authenticated users only
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Loading PustakMart...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Route wrapper for guests/unauthenticated users only
export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route wrapper for admin users only
export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Checking admin privileges...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <GuestRoute>
            <VerifyEmailPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <ResetPasswordPage />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <HomePage />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
