import { paymentModel } from "../models/payment.model.js";
import { listingModel } from "../models/listing.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/payment/razorpay.service.js";
import { emitToUser } from "../sockets/server.socket.js";

// Initialize checkout order for a listing
export async function createPaymentOrderController(req, res) {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required to create a payment order",
      });
    }

    const listing = await listingModel.findById(listingId);
    if (!listing || listing.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "The listing is no longer active or available for purchase",
      });
    }

    // A seller cannot purchase their own book
    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own listed books",
      });
    }

    // Convert amount to paise subunit (lowest currency subunit)
    const amountInPaise = Math.round(listing.price * 100);

    // Create Razorpay Order
    const order = await createRazorpayOrder(amountInPaise, "INR");

    // Save transaction trace in database
    const payment = await paymentModel.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "pending",
      buyer: req.user._id,
      listing: listingId,
    });

    res.status(201).json({
      success: true,
      message: "Payment checkout order initialized successfully",
      data: {
        order,
        payment,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing payment order",
      error: error.message,
    });
  }
}

// Verify payment signature
export async function verifyPaymentController(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "razorpayOrderId, razorpayPaymentId, and signature are required for verification",
      });
    }

    const payment = await paymentModel.findOne({ orderId: razorpayOrderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Associated transaction order not found in database",
      });
    }

    // Validate Signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature);

    if (isValid) {
      // Update Payment Record
      payment.paymentId = razorpayPaymentId;
      payment.signature = signature;
      payment.status = "completed";
      await payment.save();

      // Update Listing status to "sold"
      const listing = await listingModel.findById(payment.listing);
      if (listing) {
        listing.status = "sold";
        await listing.save();

        // Increment booksSold metric on Seller Profile
        const seller = await userModel.findById(listing.seller);
        if (seller) {
          seller.booksSold = (seller.booksSold || 0) + 1;
          await seller.save();
        }

        // Add persistent database notification alert for the seller
        await notificationModel.create({
          recipient: listing.seller,
          type: "offer", // using 'offer' type representing transactions
          message: `Your book "${listing.title}" has been purchased successfully by ${req.user.name}!`,
        });

        // Dispatch real-time Socket.io message to seller
        emitToUser(listing.seller, "notification", {
          type: "offer",
          message: `Your book "${listing.title}" has been purchased!`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Payment verified successfully. Listing updated to sold.",
        data: { payment },
      });
    } else {
      // Update Payment Record to failed
      payment.status = "failed";
      await payment.save();

      res.status(400).json({
        success: false,
        message: "Invalid payment signature verification failed",
      });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error during payment verification",
      error: error.message,
    });
  }
}
