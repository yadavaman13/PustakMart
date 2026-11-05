import { paymentModel } from "../models/payment.model.js";
import { withdrawalModel } from "../models/withdrawal.model.js";

/**
 * Merges paid orders (Credits) and withdrawal requests (Debits) into a unified ledger
 * @param {string|mongoose.Types.ObjectId} sellerId 
 * @param {number} page 
 * @param {number} limit 
 * @param {string} type - 'all' | 'credit' | 'debit'
 * @returns {Promise<Object>} Unified ledger page
 */
export const getUnifiedTransactions = async (sellerId, page = 1, limit = 10, type = "all") => {
  const skip = (page - 1) * limit;

  let credits = [];
  let debits = [];

  // Fetch credits (paid payments)
  if (type === "all" || type === "credit") {
    // Populate listing to show titles in descriptions
    const payments = await paymentModel
      .find({ seller: sellerId, paymentStatus: "paid" })
      .populate("listing", "title")
      .lean();

    credits = payments.map((p) => ({
      _id: p._id,
      date: p.createdAt,
      type: "credit",
      description: `Sold Book: "${p.listing?.title || "Academic Book"}"`,
      amount: p.sellerReceivable,
      status: "completed",
    }));
  }

  // Fetch debits (withdrawals)
  if (type === "all" || type === "debit") {
    const withdrawals = await withdrawalModel
      .find({ seller: sellerId })
      .lean();

    debits = withdrawals.map((w) => ({
      _id: w._id,
      date: w.requestedAt || w.createdAt,
      type: "debit",
      description: `Withdrawal Request via ${w.payoutMethod.toUpperCase()}`,
      amount: w.amount,
      status: w.status,
    }));
  }

  // Merge and sort by date descending
  let merged = [...credits, ...debits];
  merged.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = merged.length;
  const paginated = merged.slice(skip, skip + limit);

  return {
    transactions: paginated,
    total,
    hasMore: skip + limit < total,
    page,
    limit,
  };
};
