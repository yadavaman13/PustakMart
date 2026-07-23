import { Resend } from 'resend';
import envConfig from '../../config/envConfig.js';

const resend = new Resend(envConfig.RESEND_API_KEY);

/**
 * Sends an email using the Resend service.
 * 
 * @param {string|string[]} to - Recipient email address or array of addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendEmail(to, subject, text, html) {
  try {
    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: "PustakMart <pustakmart@yadavaman.tech>",
      to: recipients,
      subject,
      text,
      html
    });

    if (error) {
      console.error("Error sending email via Resend API:", error);
      return {
        success: false,
        error: error.message || JSON.stringify(error),
      };
    }

    console.log(`Email sent successfully via Resend. Message ID: ${data.id}`);
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err) {
    console.error("Unexpected error sending email via Resend:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

export default sendEmail;