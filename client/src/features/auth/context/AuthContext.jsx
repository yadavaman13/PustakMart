import React, { createContext, useState, useEffect } from "react";
import {
  loginApi,
  logoutApi,
  fetchMeApi,
  registerSendOtpApi,
  registerVerifyOtpApi,
  registerResendOtpApi,
  forgotPasswordSendOtpApi,
  forgotPasswordVerifyOtpApi,
  resetPasswordApi
} from "../services/auth.api.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check current logged-in user session
  const checkSession = async () => {
    try {
      setLoading(true);
      const res = await fetchMeApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await loginApi(email, password);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || "Login failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutApi();
      setUser(null);
      return { success: true };
    } catch (err) {
      return { success: false, message: "Logout failed" };
    } finally {
      setLoading(false);
    }
  };

  const sendRegisterOtp = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await registerSendOtpApi(userData);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send registration OTP";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyRegisterOtp = async (email, otp) => {
    try {
      setLoading(true);
      setError(null);
      const res = await registerVerifyOtpApi(email, otp);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || "OTP verification failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP code";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const resendRegisterOtp = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await registerResendOtpApi(email);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend OTP";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await forgotPasswordSendOtpApi(email);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send forgot password OTP";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotOtp = async (email, otp) => {
    try {
      setLoading(true);
      setError(null);
      const res = await forgotPasswordVerifyOtpApi(email, otp);
      return res; // Contains resetToken on success
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP code";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await resetPasswordApi(email, resetToken, newPassword);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        sendRegisterOtp,
        verifyRegisterOtp,
        resendRegisterOtp,
        sendForgotOtp,
        verifyForgotOtp,
        resetPassword,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
