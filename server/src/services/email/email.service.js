import nodemailer from "nodemailer";
import envConfig from "../../config/envConfig.js";

const { EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = envConfig;

const hasOAuthCredentials = !!(EMAIL_USER && CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);

let transporter = null;
let isMock = !hasOAuthCredentials || process.env.MOCK_EMAIL === "true";

if (hasOAuthCredentials && process.env.MOCK_EMAIL !== "true") {
  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
      },
    });

    // Verify connection configuration on startup
    transporter.verify((error) => {
      if (error) {
        console.error("Nodemailer transporter verification failed. Email service will run in mock/fallback mode:", error.message);
        isMock = true;
      } else {
        console.log("Nodemailer transporter successfully verified and ready to send emails via OAuth2");
      }
    });
  } catch (err) {
    console.error("Failed to initialize Nodemailer transporter. Using mock fallback:", err.message);
    isMock = true;
  }
} else {
  console.warn("Gmail OAuth2 credentials missing in configuration. Nodemailer will run in mock/fallback mode.");
}

/**
 * Sends an email using Nodemailer or falls back to a simulated console logger.
 * 
 * @param {string|string[]} to - Recipient email address or array of addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @returns {Promise<{success: boolean, messageId?: string, isMock: boolean, error?: string}>}
 */
export const sendEmail = async (to, subject, text, html) => {
  if (isMock || !transporter) {
    console.log("\n--- [MOCK EMAIL SENT] ---");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:    ${text}`);
    console.log(`HTML:    ${html}`);
    console.log("-------------------------\n");
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      isMock: true,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"PustakMart" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      isMock: false,
    };
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
    return {
      success: false,
      error: error.message,
      isMock: false,
    };
  }
};

export { transporter, isMock };
export default sendEmail;
