import mongoose from "mongoose";
import { reviewModel } from "../models/review.model.js";
import { userModel } from "../models/user.model.js";
import { listingModel } from "../models/listing.model.js";
import { notificationModel } from "../models/notification.model.js";
import { emitToUser } from "../sockets/server.socket.js";

// Submit a review for a seller
export async function createReviewController(req, res) {
  try {
    const { sellerId, rating, review, listingId } = req.body;

    if (!sellerId || rating === undefined || !listingId) {
      return res.status(400).json({
        success: false,
        message: "sellerId, rating, and listingId are required fields",
      });
    }

    if (sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot write a review for yourself",
      });
    }

    const listing = await listingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Associated listing not found",
      });
    }

    // Optional constraint: verify listing is sold to this buyer or has active state
    // For general flexibility we verify listing exist and is sold
    if (listing.status !== "sold") {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted for completed transactions (marked as sold)",
      });
    }

    // Check for duplicate reviews
    const duplicate = await reviewModel.findOne({
      buyer: req.user._id,
      listing: listingId,
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this transaction",
      });
    }

    const reviewDoc = await reviewModel.create({
      seller: sellerId,
      buyer: req.user._id,
      rating: Number(rating),
      review: review || "",
      listing: listingId,
    });

    // Compute updated rating metrics for the seller
    const stats = await reviewModel.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: "$seller",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await userModel.findByIdAndUpdate(sellerId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }

    // Log seller notification
    await notificationModel.create({
      recipient: sellerId,
      type: "other",
      message: `You received a new ${rating}-star review from ${req.user.name}`,
    });

    // Emit Socket notification
    emitToUser(sellerId, "notification", {
      type: "other",
      message: "New feedback received",
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: { review: reviewDoc },
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting review",
      error: error.message,
    });
  }
}

// Fetch reviews for a specific seller
export async function getSellerReviewsController(req, res) {
  try {
    const { sellerId } = req.params;

    const reviews = await reviewModel
      .find({ seller: sellerId })
      .populate("buyer", "name ProfilePicture collegeName department")
      .populate("listing", "title price condition listingType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Seller reviews fetched successfully",
      data: { reviews },
    });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving seller reviews",
    });
  }
}
