import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import logoImg from "../../../assets/logo.jpg";
import PasswordStrengthMeter from "../../shared/components/PasswordStrengthMeter.jsx";



export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  // Retrieve parameters from URL query params
  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";

  // Fields state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setSuccessMessage("");

    if (!email || !resetToken) {
      setUiError("Missing reset session variables. Please request a new recovery link.");
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=`~[\]\\/]/.test(newPassword);
    const hasLength = newPassword.length >= 8;

    if (!hasLength || !hasUppercase || !hasDigit || !hasSpecial) {
      setUiError("New password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 digit, and 1 special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setUiError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, resetToken, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Password reset successfully! Redirecting to sign in page...");
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } else {
      setUiError(result.message || "Failed to reset password");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        
        {/* Brand Logo */}
        <div className="auth-brand-logo">
          <img src={logoImg} alt="PustakMart Logo" />
        </div>

        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Create a secure new password for your account</p>
        </div>


        {uiError && <div className="auth-error-alert">{uiError}</div>}
        {successMessage && <div className="auth-success-alert">{successMessage}</div>}

        {!email || !resetToken ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Invalid or missing reset link parameters.
            </p>
            <button className="btn-primary" onClick={() => navigate("/auth")}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading || !!successMessage}
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            
            <div className="auth-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!successMessage}
              />
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !!successMessage}
            >
              {loading && <div className="btn-spinner"></div>}
              Update Password
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a className="auth-action-link" onClick={() => navigate("/auth")}>
            Back to Sign In
          </a>
        </div>

      </div>
    </div>
  );
}
