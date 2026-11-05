import mongoose from "mongoose";
import { paymentModel } from "../models/payment.model.js";
import { withdrawalModel } from "../models/withdrawal.model.js";

/**
 * Computes all financials for a given seller in real-time
 * @param {string|mongoose.Types.ObjectId} sellerId 
 * @returns {Promise<Object>} Financial metrics object
 */
export const getSellerFinancials = async (sellerId) => {
  const sId = new mongoose.Types.ObjectId(sellerId);

  // 1. Compute Gross, Commission, and Net from successful orders (paymentStatus === "paid")
  const stats = await paymentModel.aggregate([
    { 
      $match: { 
        seller: sId, 
        paymentStatus: "paid" 
      } 
    },
    {
      $group: {
        _id: null,
        gross: { $sum: "$bookPrice" },
        commission: { $sum: "$sellerCommission" },
        net: { $sum: "$sellerReceivable" },
      },
    },
  ]);

  const gross = stats[0]?.gross || 0;
  const commission = stats[0]?.commission || 0;
  const net = stats[0]?.net || 0;

  // 2. Compute Pending and Completed withdrawals
  const withdrawals = await withdrawalModel.aggregate([
    { 
      $match: { 
        seller: sId 
      } 
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$amount" },
      },
    },
  ]);

  let pendingWithdrawals = 0;
  let totalWithdrawn = 0;

  withdrawals.forEach((w) => {
    if (["pending", "approved", "processing"].includes(w._id)) {
      pendingWithdrawals += w.total;
    } else if (w._id === "completed") {
      totalWithdrawn += w.total;
    }
  });

  const availableBalance = net - pendingWithdrawals - totalWithdrawn;

  return {
    grossEarnings: gross,
    commission,
    netEarnings: net,
    pendingWithdrawals,
    totalWithdrawn,
    availableBalance: Math.max(0, availableBalance),
  };
};
