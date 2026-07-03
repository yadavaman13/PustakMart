import { paymentModel } from "../models/payment.model.js";
import { listingModel } from "../models/listing.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { couponModel } from "../models/coupon.model.js";
import { messageModel } from "../models/message.model.js";
import { conversationModel } from "../models/conversation.model.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/payment/razorpay.service.js";
import { validateCoupon } from "../services/coupon/validation.service.js";
import { emitToUser } from "../sockets/server.socket.js";
import envConfig from "../config/envConfig.js";

// Reusable Constants
const MARKETPLACE_FEE = 5;
const SELLER_COMMISSION_PERCENT = 10;

/**
 * Fetch checkout details for a listing
 * GET /api/listings/:id/checkout
 */
export async function getCheckoutDetailsController(req, res) {
  try {
    const { id } = req.params;

    const listing = await listingModel.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    const seller = await userModel.findById(listing.seller).select(
      "name ProfilePicture collegeName department averageRating totalReviews booksSold sellerStatus"
    );
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found for this listing.",
      });
    }

    const priceBreakdown = {
      bookPrice: listing.price,
      marketplaceFee: MARKETPLACE_FEE,
      couponDiscount: 0,
      totalAmount: listing.price + MARKETPLACE_FEE,
    };

    let couponDetails = null;
    let couponError = null;

    if (req.query.couponCode) {
      try {
        const coupon = await couponModel.findOne({ code: req.query.couponCode.toUpperCase() });
        const validation = validateCoupon(coupon, listing, req.user._id);
        if (validation.isValid) {
          priceBreakdown.couponDiscount = validation.discountAmount;
          priceBreakdown.totalAmount = Math.max(1, priceBreakdown.bookPrice + MARKETPLACE_FEE - validation.discountAmount);
          couponDetails = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          };
        } else {
          couponError = validation.message;
        }
      } catch (err) {
        couponError = "Failed to validate coupon.";
      }
    }

    return res.status(200).json({
      success: true,
      listing,
      seller,
      priceBreakdown,
      couponDetails,
      couponError,
    });
  } catch (error) {
    console.error("Get checkout details error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching checkout details",
      error: error.message,
    });
  }
}

/**
 * Initialize payment order and return Razorpay details
 * POST /api/payments/create-order
 */
export async function createPaymentOrderController(req, res) {
  try {
    const { listingId, couponCode } = req.body;
    const buyerId = req.user._id;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required.",
      });
    }

    // 1. Fetch listing and check existence
    const listing = await listingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "This book listing does not exist.",
      });
    }

    // 2. Check listing status
    if (listing.status === "reserved") {
      return res.status(400).json({
        success: false,
        message: "This book is currently reserved.",
      });
    }
    if (listing.status === "sold") {
      return res.status(400).json({
        success: false,
        message: "This book has already been sold.",
      });
    }
    if (listing.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This book listing is no longer available.",
      });
    }

    // 3. Buyer cannot be the seller
    if (listing.seller.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You already own this listing.",
      });
    }

    // 4. Calculate prices
    const bookPrice = listing.price;
    let couponDiscount = 0;
    let appliedCoupon = null;

    // Validate Coupon if supplied
    if (couponCode) {
      appliedCoupon = await couponModel.findOne({ code: couponCode.toUpperCase() });
      const validation = validateCoupon(appliedCoupon, listing, buyerId);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
      couponDiscount = validation.discountAmount;
    }

    const totalAmount = bookPrice + MARKETPLACE_FEE - couponDiscount;

    // 5. Final amount must be >= 1
    if (totalAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Final payment amount must be at least ₹1.",
      });
    }

    const sellerCommission = Math.round((bookPrice * SELLER_COMMISSION_PERCENT) / 100);
    const sellerReceivable = bookPrice - sellerCommission;

    // Idempotency: check if a pending payment already exists for this listing and buyer
    // If so, we can deactivate the old one or clean it up. Let's delete previous pending
    // payment attempts by this user on this listing to keep the database tidy.
    await paymentModel.deleteMany({
      listing: listingId,
      buyer: buyerId,
      paymentStatus: "pending"
    });

    // 6. Create Razorpay order (amounts must be in paise)
    const amountInPaise = Math.round(totalAmount * 100);
    const razorpayOrder = await createRazorpayOrder(amountInPaise, "INR");

    // 7. Save payment record as pending
    const payment = await paymentModel.create({
      buyer: buyerId,
      seller: listing.seller,
      listing: listingId,
      coupon: appliedCoupon ? appliedCoupon._id : null,
      bookPrice,
      marketplaceFee: MARKETPLACE_FEE,
      couponDiscount,
      sellerCommission,
      sellerReceivable,
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      razorpayOrder,
      razorpayKeyId: envConfig.RAZORPAY_KEY_ID,
      paymentBreakdown: {
        bookPrice,
        marketplaceFee: MARKETPLACE_FEE,
        couponDiscount,
        sellerCommission,
        sellerReceivable,
        totalAmount,
      },
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Create order controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment order.",
      error: error.message,
    });
  }
}

/**
 * Verify Razorpay payment signature
 * POST /api/payments/verify
 */
export async function verifyPaymentController(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const buyerId = req.user._id;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment parameters (orderId, paymentId, signature).",
      });
    }

    // Find the pending payment
    const payment = await paymentModel.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction record not found.",
      });
    }

    // Verify the payment signature
    const isSignatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isSignatureValid) {
      payment.paymentStatus = "failed";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Update payment record to paid
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paymentStatus = "paid";
    await payment.save();

    // Mark Coupon as used if applied
    if (payment.coupon) {
      await couponModel.findByIdAndUpdate(payment.coupon, { isUsed: true });
    }

    // Update listing status to "reserved" (DO NOT mark sold immediately)
    const listing = await listingModel.findById(payment.listing);
    if (listing) {
      listing.status = "reserved";
      await listing.save();

      // Emit notification & Save database notification for seller
      const sellerId = listing.seller.toString();
      await notificationModel.create({
        recipient: listing.seller,
        type: "offer",
        message: `Your book "${listing.title}" is reserved! Payment verified from ${req.user.name}.`,
      });

      emitToUser(sellerId, "notification", {
        type: "offer",
        message: `Your book "${listing.title}" is reserved! Payment verified.`,
      });

      // Find or create conversation to post transaction system message
      let conversation = await conversationModel.findOne({
        listing: listing._id,
        buyer: buyerId,
      });

      // If no conversation exists, create one
      if (!conversation) {
        conversation = await conversationModel.create({
          listing: listing._id,
          buyer: buyerId,
          seller: listing.seller,
          status: "accepted", // Auto-accept since it's a paid transaction
        });
      } else if (conversation.status !== "accepted") {
        conversation.status = "accepted";
        await conversation.save();
      }

      // Add a system notification message inside the chat thread
      const systemMsg = await messageModel.create({
        conversation: conversation._id,
        sender: buyerId,
        message: `Payment successful! Book "${listing.title}" has been reserved. Please coordinate exchange.`,
        messageType: "system",
      });

      conversation.lastMessage = systemMsg._id;
      conversation.lastMessageAt = systemMsg.createdAt;
      await conversation.save();

      // Dispatch live messages via sockets
      const liveMsgPayload = {
        conversationId: conversation._id,
        message: {
          _id: systemMsg._id,
          sender: buyerId,
          message: systemMsg.message,
          messageType: "system",
          createdAt: systemMsg.createdAt,
        },
      };

      emitToUser(sellerId, "message_received", liveMsgPayload);
      emitToUser(buyerId.toString(), "message_received", liveMsgPayload);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Listing marked as reserved.",
      data: {
        payment,
      },
    });
  } catch (error) {
    console.error("Verify payment controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment.",
      error: error.message,
    });
  }
}
