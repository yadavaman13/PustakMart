import { withdrawalModel } from "../models/withdrawal.model.js";
import { getSellerFinancials } from "../services/payout.service.js";
import { createNotification } from "../services/notification.service.js";

/**
 * List all withdrawal requests
 * GET /api/admin/withdrawals
 */
export async function getAdminWithdrawalsController(req, res) {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const withdrawals = await withdrawalModel
      .find(query)
      .populate("seller", "name collegeName email mobileNumber")
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
    console.error("Error in getAdminWithdrawalsController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin payout requests list.",
      error: error.message,
    });
  }
}

/**
 * Fetch detailed metrics and credentials snapshot for a single withdrawal request
 * GET /api/admin/withdrawals/:id
 */
export async function getWithdrawalDetailsController(req, res) {
  try {
    const { id } = req.params;

    const withdrawal = await withdrawalModel
      .findById(id)
      .populate("seller", "name email mobileNumber collegeName semester department");

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    // Dynamic financials for reconciliation context
    const financials = await getSellerFinancials(withdrawal.seller._id);

    return res.status(200).json({
      success: true,
      withdrawal,
      financials,
    });
  } catch (error) {
    console.error("Error in getWithdrawalDetailsController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawal details.",
      error: error.message,
    });
  }
}

/**
 * Approve a pending withdrawal request
 * PATCH /api/admin/withdrawals/:id/approve
 */
export async function approveWithdrawalController(req, res) {
  try {
    const { id } = req.params;

    const withdrawal = await withdrawalModel.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    // Constraints check
    if (withdrawal.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot approve an already completed request." });
    }
    if (withdrawal.status === "rejected" || withdrawal.status === "cancelled") {
      return res.status(400).json({ success: false, message: `Cannot approve a ${withdrawal.status} request.` });
    }

    withdrawal.status = "approved";
    withdrawal.reviewedAt = new Date();
    withdrawal.admin = req.user._id;
    await withdrawal.save();

    // Send Notification to Seller
    await createNotification(
      withdrawal.seller,
      "other",
      `Your withdrawal request of ₹${withdrawal.amount} has been approved.`
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal request approved successfully.",
      withdrawal,
    });
  } catch (error) {
    console.error("Error in approveWithdrawalController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve request.",
      error: error.message,
    });
  }
}

/**
 * Reject a pending withdrawal request
 * PATCH /api/admin/withdrawals/:id/reject
 */
export async function rejectWithdrawalController(req, res) {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    if (!remark || !remark.trim()) {
      return res.status(400).json({ success: false, message: "Rejection remark is required." });
    }

    const withdrawal = await withdrawalModel.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    // Constraints check
    if (withdrawal.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot reject an already completed request." });
    }

    withdrawal.status = "rejected";
    withdrawal.reviewedAt = new Date();
    withdrawal.adminRemark = remark;
    withdrawal.admin = req.user._id;
    await withdrawal.save();

    // Send Notification to Seller
    await createNotification(
      withdrawal.seller,
      "other",
      `Your withdrawal request of ₹${withdrawal.amount} was rejected. Reason: ${remark}`
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal request rejected successfully.",
      withdrawal,
    });
  } catch (error) {
    console.error("Error in rejectWithdrawalController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject request.",
      error: error.message,
    });
  }
}

/**
 * Move approved withdrawal request to 'processing' status
 * PATCH /api/admin/withdrawals/:id/processing
 */
export async function processingWithdrawalController(req, res) {
  try {
    const { id } = req.params;

    const withdrawal = await withdrawalModel.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (withdrawal.status !== "approved" && withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending or approved requests can be marked as processing.",
      });
    }

    withdrawal.status = "processing";
    withdrawal.admin = req.user._id;
    await withdrawal.save();

    // Send Notification to Seller
    await createNotification(
      withdrawal.seller,
      "other",
      `Your withdrawal of ₹${withdrawal.amount} is currently being processed.`
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal request marked as processing.",
      withdrawal,
    });
  } catch (error) {
    console.error("Error in processingWithdrawalController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update processing status.",
      error: error.message,
    });
  }
}

/**
 * Complete a withdrawal request
 * PATCH /api/admin/withdrawals/:id/complete
 */
export async function completeWithdrawalController(req, res) {
  try {
    const { id } = req.params;
    const { transactionReference } = req.body;

    if (!transactionReference || !transactionReference.trim()) {
      return res.status(400).json({
        success: false,
        message: "Transaction reference is required to mark a payout as completed.",
      });
    }

    const withdrawal = await withdrawalModel.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (["completed", "rejected", "cancelled"].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark a ${withdrawal.status} withdrawal as completed.`,
      });
    }

    withdrawal.status = "completed";
    withdrawal.processedAt = new Date();
    withdrawal.transactionReference = transactionReference;
    withdrawal.admin = req.user._id;
    await withdrawal.save();

    // Send Notification to Seller
    await createNotification(
      withdrawal.seller,
      "other",
      `Your withdrawal request of ₹${withdrawal.amount} was completed successfully. Ref: ${transactionReference}`
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal request successfully marked as completed.",
      withdrawal,
    });
  } catch (error) {
    console.error("Error in completeWithdrawalController:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete request.",
      error: error.message,
    });
  }
}
