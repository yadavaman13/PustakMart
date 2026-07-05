import { sellerPayoutModel } from "../models/sellerPayout.model.js";
import { withdrawalModel } from "../models/withdrawal.model.js";
import { userModel } from "../models/user.model.js";
import { getSellerFinancials } from "../services/payout.service.js";
import { getUnifiedTransactions } from "../services/withdrawal.service.js";
import { createNotification } from "../services/notification.service.js";

/**
 * Request a withdrawal of seller earnings
 * POST /api/seller/withdrawals
 */
export async function createWithdrawalRequestController(req, res) {
  try {
    const sellerId = req.user._id;
    const { amount, payoutMethod } = req.body;

    // 1. Verify seller is verified
    if (req.user.sellerStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Only verified sellers can request withdrawals.",
      });
    }

    // 2. Fetch Payout Profile
    const payoutProfile = await sellerPayoutModel.findOne({ seller: sellerId });
    if (!payoutProfile) {
      return res.status(400).json({
        success: false,
        message: "Please configure your payout details first.",
      });
    }

    // 3. Ensure no pending withdrawal request exists
    const existingPending = await withdrawalModel.findOne({
      seller: sellerId,
      status: { $in: ["pending", "approved", "processing"] },
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending or active withdrawal request.",
      });
    }

    // 4. Calculate Available Balance
    const financials = await getSellerFinancials(sellerId);
    const amt = Number(amount);

    if (amt > financials.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Your available balance is ₹${financials.availableBalance}.`,
      });
    }

    // 5. Take Payout Details Snapshot based on the requested method
    let snapshot = {};
    if (payoutMethod === "upi") {
      if (!payoutProfile.upi?.upiId) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is not configured in your payout details.",
        });
      }
      snapshot = { upiId: payoutProfile.upi.upiId };
    } else if (payoutMethod === "bank") {
      if (!payoutProfile.bank?.accountNumber || !payoutProfile.bank?.ifscCode) {
        return res.status(400).json({
          success: false,
          message: "Bank Account details are not configured in your payout details.",
        });
      }
      snapshot = {
        accountHolderName: payoutProfile.bank.accountHolderName,
        bankName: payoutProfile.bank.bankName,
        accountNumber: payoutProfile.bank.accountNumber,
        ifscCode: payoutProfile.bank.ifscCode,
        branchName: payoutProfile.bank.branchName,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payout method choice.",
      });
    }

    // 6. Create Withdrawal Request
    const request = await withdrawalModel.create({
      seller: sellerId,
      amount: amt,
      payoutMethod,
      payoutDetailsSnapshot: snapshot,
      status: "pending",
      requestedAt: new Date(),
    });

    // 7. Notify Admins
    try {
      const admins = await userModel.find({ role: "admin", isBlocked: false, isDeleted: false });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "other",
          `New withdrawal request of ₹${amt} submitted by ${req.user.name}`
        );
      }
    } catch (err) {
      console.error("Failed to broadcast admin notifications:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully.",
      withdrawal: request,
    });
  } catch (error) {
    console.error("Error in createWithdrawalRequestController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create withdrawal request.",
      error: error.message,
    });
  }
}

/**
 * Fetch seller's withdrawal history
 * GET /api/seller/withdrawals
 */
export async function getSellerWithdrawalsController(req, res) {
  try {
    const sellerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { seller: sellerId };
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const withdrawals = await withdrawalModel
      .find(query)
      .sort({ requestedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await withdrawalModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      withdrawals,
      total,
      hasMore: skip + withdrawals.length < total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error in getSellerWithdrawalsController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawal requests.",
      error: error.message,
    });
  }
}

/**
 * Fetch unified paginated credits and debits transaction logs
 * GET /api/seller/transactions
 */
export async function getSellerTransactionsController(req, res) {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 10, type = "all" } = req.query;

    const result = await getUnifiedTransactions(sellerId, Number(page), Number(limit), type);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getSellerTransactionsController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history ledger.",
      error: error.message,
    });
  }
}
