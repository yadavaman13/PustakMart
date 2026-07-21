import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import logoImg from "../../../assets/logo.jpg";
import PasswordStrengthMeter from "../../shared/components/PasswordStrengthMeter.jsx";
import SEO from "../../shared/components/SEO.jsx";

export default function AuthPage() {
  const navigate = useNavigate();
  const {
    login,
    sendRegisterOtp,
    sendForgotOtp,
    verifyForgotOtp,
    error: authError,
  } = useAuth();

  // Active form view: 'login' | 'register' | 'forgot' | 'verify-register' | 'verify-forgot'
  const [view, setView] = useState("login");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration details
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regCollege, setRegCollege] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regSemester, setRegSemester] = useState("");

  // OTP inputs state (6 boxes)
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef([]);

  // Cooldown timers
  const [cooldown, setCooldown] = useState(0);

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

  // Clean error messages when toggling forms
  const switchView = (newView) => {
    setView(newView);
    setUiError("");
    setSuccessMessage("");
    setOtpValues(["", "", "", "", "", ""]);
  };

  // Format countdown text (e.g. 02:00)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- FORM HANDLERS ---

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setUiError(result.message);
    }
  };

  // 2. Handle Register Send OTP (Step 1)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setSuccessMessage("");

    const hasUppercase = /[A-Z]/.test(regPassword);
    const hasDigit = /[0-9]/.test(regPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=`~[\]\\/]/.test(regPassword);
    const hasLength = regPassword.length >= 8;

    if (!hasLength || !hasUppercase || !hasDigit || !hasSpecial) {
      setUiError("Password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 digit, and 1 special character.");
      return;
    }

    setLoading(true);

    const userData = {
      name: regName,
      email: regEmail,
      password: regPassword,
      mobileNumber: regMobile,
      collegeName: regCollege || undefined,
      department: regDept || undefined,
      semester: regSemester ? Number(regSemester) : undefined,
    };

    const result = await sendRegisterOtp(userData);
    setLoading(false);

    if (result.success) {
      navigate(`/verify-email?email=${encodeURIComponent(regEmail)}`);
    } else {
      setUiError(result.message);
    }
  };

  // 3. Handle Verify Registration OTP (Step 2)
  const handleRegisterOtpVerify = async (e) => {
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
      if (result.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setUiError(result.message);
    }
  };

  // 4. Handle Register Resend OTP
  const handleRegisterOtpResend = async () => {
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const result = await resendRegisterOtp(email);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("A new verification code was sent to " + email);
      setCooldown(120);
      setOtpValues(["", "", "", "", "", ""]);
    } else {
      setUiError(result.message);
    }
  };

  // 5. Handle Forgot Password Send OTP
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const result = await sendForgotOtp(email);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("Password reset OTP sent to " + email);
      setCooldown(120);
      switchView("verify-forgot");
    } else {
      setUiError(result.message);
    }
  };

  // 6. Handle Verify Forgot Password OTP
  const handleForgotOtpVerify = async (e) => {
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

    const result = await verifyForgotOtp(email, otpCode);
    setLoading(false);

    if (result.success && result.resetToken) {
      // Direct user to reset password screen with context in state/query parameters
      navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(result.resetToken)}`);
    } else {
      setUiError(result.message || "Failed to verify OTP");
    }
  };

  // 7. Handle Forgot Password Resend OTP (Hits send-otp endpoint again)
  const handleForgotOtpResend = async () => {
    setUiError("");
    setSuccessMessage("");
    setLoading(true);

    const result = await sendForgotOtp(email);
    setLoading(false);

    if (result.success) {
      setSuccessMessage("A new reset code was sent to " + email);
      setCooldown(120);
      setOtpValues(["", "", "", "", "", ""]);
    } else {
      setUiError(result.message);
    }
  };

  // --- OTP FIELD NAVIGATION LOGIC ---

  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (val && isNaN(val)) return; // Only numeric digits
    
    const newOtp = [...otpValues];
    newOtp[index] = val.substring(val.length - 1);
    setOtpValues(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className="auth-page-wrapper">
      <SEO
        title={view === "register" ? "Signup" : "Sign In"}
        description="Access PustakMart to buy or sell second-hand academic books directly with peer students on campus. Secure registration and OTP login."
        keywords="pustakmart login, student books signup, verify student email"
      />
      <div className="auth-card">
        
        {/* Brand Logo */}
        <div className="auth-brand-logo">
          <img src={logoImg} alt="PustakMart Logo" />
        </div>

        {/* Banner Headers */}
        <div className="auth-header">
          <h1>PustakMart</h1>
          <p>
            {view === "login" && "Find verified academic books near you"}
            {view === "register" && "Join the student academic community"}
            {view === "forgot" && "Reset your password securely"}
            {view === "verify-forgot" && "Enter the 6-digit code sent to your email"}
          </p>
        </div>


        {/* Dynamic Alerts */}
        {uiError && <div className="auth-error-alert">{uiError}</div>}
        {successMessage && <div className="auth-success-alert">{successMessage}</div>}

        {/* Login / Register Toggle Tabs */}
        {(view === "login" || view === "register") && (
          <div className="auth-tabs">
            <button
              className={`tab-btn ${view === "login" ? "active" : ""}`}
              onClick={() => switchView("login")}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${view === "register" ? "active" : ""}`}
              onClick={() => switchView("register")}
            >
              Register
            </button>
          </div>
        )}

        {/* LOGIN FORM VIEW */}
        {view === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-password-wrapper" style={{ position: "relative" }}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "40px", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  <i className={showLoginPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                </button>
              </div>
            </div>
            
            <a className="auth-action-link" onClick={() => switchView("forgot")}>
              Forgot Password?
            </a>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <div className="btn-spinner"></div>}
              Sign In
            </button>
          </form>
        )}

        {/* REGISTRATION FORM VIEW (Step 1: Input details) */}
        {view === "register" && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="auth-form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>Student Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                maxLength="10"
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group">
              <label>Password</label>
              <div className="auth-password-wrapper" style={{ position: "relative" }}>
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  style={{ paddingRight: "40px", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px"
                  }}
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  <i className={showRegPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                </button>
              </div>
              <PasswordStrengthMeter password={regPassword} />
            </div>

            <div className="auth-row">
              <div className="auth-form-group">
                <label>College Name (Optional)</label>
                <input
                  type="text"
                  placeholder="GEC Dahod"
                  value={regCollege}
                  onChange={(e) => setRegCollege(e.target.value)}
                />
              </div>
              <div className="auth-form-group">
                <label>Department (Optional)</label>
                <input
                  type="text"
                  placeholder="Computer Engineering"
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Semester (Optional)</label>
              <select
                value={regSemester}
                onChange={(e) => setRegSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <div className="btn-spinner"></div>}
              Register & Send OTP
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM VIEW */}
        {view === "forgot" && (
          <form onSubmit={handleForgotSubmit}>
            <div className="auth-form-group">
              <label>Enter Registered Email Address</label>
              <input
                type="email"
                placeholder="your.name@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <div className="btn-spinner"></div>}
              Send Recovery Code
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <a className="auth-action-link" onClick={() => switchView("login")}>
                Back to Sign In
              </a>
            </div>
          </form>
        )}

        {/* OTP VERIFICATION VIEW (FOR PASSWORD RECOVERY ONLY) */}
        {view === "verify-forgot" && (
          <div className="otp-container">
            <p className="otp-desc">
              We sent a 6-digit OTP code to <strong>{email}</strong>. Please enter it below.
            </p>

            <form onSubmit={handleForgotOtpVerify}>
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
                Verify Code
              </button>
            </form>

            <div className="otp-resend">
              Didn't receive code?{" "}
              <button
                className="resend-btn"
                onClick={handleForgotOtpResend}
                disabled={cooldown > 0 || loading}
              >
                Resend OTP
              </button>
            </div>

            <div style={{ marginTop: "24px" }}>
              <a className="auth-action-link" onClick={() => switchView("login")}>
                Cancel
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
