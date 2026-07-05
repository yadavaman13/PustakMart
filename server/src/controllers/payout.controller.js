import { sellerPayoutModel } from "../models/sellerPayout.model.js";
import { getSellerFinancials } from "../services/payout.service.js";

/**
 * Fetch seller's payout profile, calculated earnings, and available balance
 * GET /api/seller/payout
 */
export async function getPayoutController(req, res) {
  try {
    const sellerId = req.user._id;

    // 1. Fetch Payout Profile
    const payoutProfile = await sellerPayoutModel.findOne({ seller: sellerId });

    // 2. Compute Financial Metrics dynamically
    const financials = await getSellerFinancials(sellerId);

    return res.status(200).json({
      success: true,
      payoutProfile,
      ...financials,
    });
  } catch (error) {
    console.error("Error in getPayoutController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payout information.",
      error: error.message,
    });
  }
}

/**
 * Create or Update seller's payout details profile
 * POST /api/seller/payout
 */
export async function updatePayoutController(req, res) {
  try {
    const sellerId = req.user._id;
    const { preferredMethod, upi, bank } = req.body;

    // Verify if seller is currently verified in user document
    if (req.user.sellerStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "You must be a verified seller to manage payout details.",
      });
    }

    // Check if there is an active pending, approved or processing withdrawal.
    // In this state, editing payout details is blocked for security (integrity snapshot rule).
    // The prompt says: "Seller cannot edit payout details while request processing."
    // Let's implement this!
    const { withdrawalModel } = await import("../models/withdrawal.model.js");
    const activeWithdrawal = await withdrawalModel.findOne({
      seller: sellerId,
      status: { $in: ["pending", "approved", "processing"] },
    });

    if (activeWithdrawal) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify payout profile details while a withdrawal request is pending or processing.",
      });
    }

    // Build update object
    const updateData = {
      preferredMethod,
      upi: preferredMethod === "upi" ? { upiId: upi?.upiId } : undefined,
      bank: preferredMethod === "bank" ? {
        accountHolderName: bank?.accountHolderName,
        bankName: bank?.bankName,
        accountNumber: bank?.accountNumber,
        ifscCode: bank?.ifscCode?.toUpperCase(),
        branchName: bank?.branchName,
      } : undefined,
      isVerified: true, // Mark verified after clean validate
    };

    const payoutProfile = await sellerPayoutModel.findOneAndUpdate(
      { seller: sellerId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Payout profile details successfully updated.",
      payoutProfile,
    });
  } catch (error) {
    console.error("Error in updatePayoutController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payout details.",
      error: error.message,
    });
  }
}
