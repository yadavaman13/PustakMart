import axios from "axios";
import { API_BASE_URL } from "../../../app/runtime.config.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Logs in the user with email and password.
 */
export const loginApi = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

/**
 * Sends Registration OTP.
 */
export const registerSendOtpApi = async (userData) => {
  const response = await api.post("/auth/register/send-otp", userData);
  return response.data;
};

/**
 * Verifies Registration OTP and registers user.
 */
export const registerVerifyOtpApi = async (email, otp) => {
  const response = await api.post("/auth/register/verify-otp", { email, otp });
  return response.data;
};

/**
 * Resends Registration OTP.
 */
export const registerResendOtpApi = async (email) => {
  const response = await api.post("/auth/register/resend-otp", { email });
  return response.data;
};

/**
 * Sends Forgot Password reset OTP.
 */
export const forgotPasswordSendOtpApi = async (email) => {
  const response = await api.post("/auth/forgot-password/send-otp", { email });
  return response.data;
};

/**
 * Verifies Forgot Password OTP and retrieves resetToken.
 */
export const forgotPasswordVerifyOtpApi = async (email, otp) => {
  const response = await api.post("/auth/forgot-password/verify-otp", { email, otp });
  return response.data;
};

/**
 * Resets password using resetToken.
 */
export const resetPasswordApi = async (email, resetToken, newPassword) => {
  const response = await api.post("/auth/reset-password", { email, resetToken, newPassword });
  return response.data;
};

/**
 * Fetches current logged-in user profile.
 */
export const fetchMeApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * Logs out the user.
 */
export const logoutApi = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};
