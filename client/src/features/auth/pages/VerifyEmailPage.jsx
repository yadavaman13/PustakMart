import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import logoImg from "../../../assets/logo.jpg";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyRegisterOtp, resendRegisterOtp, error: authError } = useAuth();

  // Retrieve email parameter from query parameter
  const email = searchParams.get("email") || "";

  // UI States
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // OTP inputs state (6 boxes)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef([]);

  // Cooldown timer state (120 seconds = 2 minutes)
  const [cooldown, setCooldown] = useState(120);

  useEffect(() => {
    // If there's no email, redirect back to authentication page
    if (!email) {
      navigate("/auth");
      return;
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval = null;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Format countdown text (e.g., 02:00)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // OTP Focus shifts
  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (val && isNaN(val)) return; // Only allow numeric digits
    
    const newOtp = [...otpValues];
    newOtp[index] = val.substring(val.length - 1);
    setOtpValues(newOtp);

    // Auto-focus next input field
    if (val && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  // Submit OTP Verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) {
      setUiError("Please enter all 6 digits of the OTP");
      setLoading(false);
      return;
    }

    const result = await verifyRegisterOtp(email, otpCode);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Email verified successfully! Redirecting to dashboard...");
      setTimeout(() => {
        if (result.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 2000);
    } else {
      setUiError(result.message || "Failed to verify OTP. Please try again.");
    }
  };

  // Resend OTP trigger
  const handleResendOtp = async () => {
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const result = await resendRegisterOtp(email);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("A new verification code was sent to " + email);
      setCooldown(120); // Reset cooldown to 2 minutes
      setOtpValues(["", "", "", "", "", ""]);
      if (otpInputsRef.current[0]) {
        otpInputsRef.current[0].focus();
      }
    } else {
      setUiError(result.message || "Failed to resend OTP. Please wait and try again.");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        
        {/* Brand Logo */}
        <div className="auth-brand-logo">
          <img src={logoImg} alt="PustakMart Logo" />
        </div>

        {/* Header Title */}
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>Complete your registration to start trading verified academic books</p>
        </div>

        {/* Alerts */}
        {(uiError || authError) && (
          <div className="auth-error-alert">
            {uiError || authError}
          </div>
        )}
        {successMessage && (
          <div className="auth-success-alert">
            {successMessage}
          </div>
        )}

        <div className="otp-container">
          <p className="otp-desc">
            We sent a 6-digit OTP verification code to <strong>{email}</strong>. Please enter it below.
          </p>

          <form onSubmit={handleVerifySubmit}>
            <div className="otp-input-group">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength="1"
                  value={val}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  onChange={(e) => handleOtpChange(e, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  required
                  disabled={loading}
                />
              ))}
            </div>

            {cooldown > 0 ? (
              <div className="otp-timer">
                Resend OTP in <span>{formatTimer(cooldown)}</span>
              </div>
            ) : (
              <div className="otp-timer">OTP code expired. Please request a new one.</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <div className="btn-spinner"></div>}
              Verify Code & Register
            </button>
          </form>

          <div className="otp-resend">
            Didn't receive code?{" "}
            <button
              className="resend-btn"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || loading}
            >
              Resend OTP
            </button>
          </div>

          <div style={{ marginTop: "24px" }}>
            <a className="auth-action-link" onClick={() => navigate("/auth")}>
              Cancel & Back to Sign In
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
