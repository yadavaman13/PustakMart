import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import useDashboard from "../hooks/useDashboard.js";

export const ProtectedSellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { isSellerVerified } = useDashboard();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!user || !isSellerVerified) {
    // Redirect to user dashboard mode
    return <Navigate to="/dashboard?mode=user&tab=home" replace />;
  }

  return children;
};

export default ProtectedSellerRoute;
