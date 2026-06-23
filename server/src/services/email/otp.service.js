import sendEmail from "./email.service.js";
import { getOtpHtml } from "../../utils/otp.util.js";

/**
 * Sends an OTP email to a user.
 * 
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {'register'|'forgot'} type - Type of OTP being sent
 * @returns {Promise<{success: boolean, messageId?: string, isMock: boolean, error?: string}>}
 */
export async function sendOtpEmail(email, otp, type) {
  const subject = type === "register" 
    ? "PustakMart - Verify Your Email Address" 
    : "PustakMart - Reset Your Password Request";

  // Use the HTML template utility
  const html = getOtpHtml(otp);
  const text = `Your OTP code is: ${otp}. Please use this to verify your email or reset your password.`;

  return await sendEmail(email, subject, text, html);
}
