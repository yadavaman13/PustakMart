import mongoose from "mongoose";
import { paymentModel } from "../models/payment.model.js";

/**
 * Fetch earnings overview metrics and monthly analytics for the authenticated seller
 * GET /api/seller/earnings
 */
export async function getSellerEarningsController(req, res) {
  try {
    const sellerId = req.user._id;

    // 1. Aggregation Pipeline for overall metrics (Gross, Commission, Net, Books Sold)
    const statsResult = await paymentModel.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          grossEarnings: { $sum: "$bookPrice" },
          commission: { $sum: "$sellerCommission" },
          netEarnings: { $sum: "$sellerReceivable" },
          booksSold: { $sum: 1 },
        },
      },
    ]);

    // 2. Aggregation Pipeline for monthly group analytics
    const monthlyResult = await paymentModel.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          salesCount: { $sum: 1 },
          earnings: { $sum: "$sellerReceivable" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          salesCount: 1,
          earnings: 1,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);

    const stats = statsResult[0] || {
      grossEarnings: 0,
      commission: 0,
      netEarnings: 0,
      booksSold: 0,
    };

    return res.status(200).json({
      success: true,
      grossEarnings: stats.grossEarnings,
      commission: stats.commission,
      netEarnings: stats.netEarnings,
      booksSold: stats.booksSold,
      monthlyAnalytics: monthlyResult,
    });
  } catch (error) {
    console.error("Get seller earnings aggregation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error aggregating seller earnings.",
      error: error.message,
    });
  }
}
