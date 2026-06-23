import Razorpay from "razorpay";
import crypto from "crypto";
import envConfig from "../../config/envConfig.js";

let razorpayClient = null;

if (envConfig.RAZORPAY_KEY_ID && envConfig.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: envConfig.RAZORPAY_KEY_ID,
    key_secret: envConfig.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Creates a payment order token on Razorpay.
 * Falls back to mock order generation if credentials are not configured.
 * @param {number} amount - Amount in the lowest subunit (e.g. paise for INR).
 * @param {string} currency - Currency code (defaults to "INR").
 * @returns {Promise<object>} Razorpay order details.
 */
export async function createRazorpayOrder(amount, currency = "INR") {
  try {
    if (!razorpayClient) {
      console.log("Razorpay credentials are not configured. Simulating mock order creation...");
      const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return {
        id: mockOrderId,
        entity: "order",
        amount: Number(amount),
        amount_paid: 0,
        amount_due: Number(amount),
        currency,
        receipt: `receipt_${Date.now()}`,
        status: "created",
        attempts: 0,
        notes: [],
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const options = {
      amount: Math.round(amount), // must be integer representing paise
      currency,
    };

    const order = await razorpayClient.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error("Failed to create Razorpay payment order");
  }
}

/**
 * Verifies the validity of the Razorpay payment signature.
 * Uses Node.js native crypto HMAC-SHA256 calculation.
 * @param {string} orderId - The Razorpay order ID.
 * @param {string} paymentId - The Razorpay payment ID.
 * @param {string} signature - The signature received from the client checkout.
 * @returns {boolean} True if signature is authentic, false otherwise.
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  try {
    if (!envConfig.RAZORPAY_KEY_SECRET) {
      console.log("Razorpay keys are not configured. Performing mock signature validation...");
      return signature === "mock-verified-signature";
    }

    const generated_signature = crypto
      .createHmac("sha256", envConfig.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("Razorpay signature verification error:", error);
    return false;
  }
}
