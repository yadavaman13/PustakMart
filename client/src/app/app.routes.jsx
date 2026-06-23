import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../features/auth/hooks/useAuth.js";

// Lazy-loaded pages for optimized FCP/LCP performance SEO
const HomePage = lazy(() => import("../features/home/pages/HomePage.jsx"));
const AuthPage = lazy(() => import("../features/auth/pages/AuthPage.jsx"));
const VerifyEmailPage = lazy(() => import("../features/auth/pages/VerifyEmailPage.jsx"));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ResetPasswordPage.jsx"));
const AdminDashboardPage = lazy(() => import("../features/admin/pages/AdminDashboardPage.jsx"));
const DashboardLayout = lazy(() => import("../features/dashboard/components/DashboardLayout.jsx"));

// New SEO pages
const CategoryLandingPage = lazy(() => import("../features/home/pages/CategoryLandingPage.jsx"));

// Reusable Loading Fallback for Suspense
const RouteLoader = () => (
  <div className="auth-loader">
    <div className="spinner"></div>
    <p>Loading PustakMart...</p>
  </div>
);

// Route wrapper for authenticated users only
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
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
    <Suspense fallback={<RouteLoader />}>
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
        
        {/* Category Landing Pages Route */}
        <Route
          path="/category/:categoryId"
          element={<CategoryLandingPage />}
        />

        <Route
          path="/"
          element={
            <HomePage />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
