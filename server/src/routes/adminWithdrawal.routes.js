import expressRouter from "express";
import {
  getAdminWithdrawalsController,
  getWithdrawalDetailsController,
  approveWithdrawalController,
  rejectWithdrawalController,
  processingWithdrawalController,
  completeWithdrawalController
} from "../controllers/adminWithdrawal.controller.js";
import { authUser, isAdmin } from "../middlewares/auth.middleware.js";

export const adminWithdrawalRoute = expressRouter();

// Restrict all routes to authenticated administrators
adminWithdrawalRoute.use(authUser, isAdmin);

/**
 * @route GET /api/admin/withdrawals
 * @description List all withdrawal requests
 * @access private (Admins only)
 */
adminWithdrawalRoute.get("/", getAdminWithdrawalsController);

/**
 * @route GET /api/admin/withdrawals/:id
 * @description Get details and financials context for a specific request
 * @access private (Admins only)
 */
adminWithdrawalRoute.get("/:id", getWithdrawalDetailsController);

/**
 * @route PATCH /api/admin/withdrawals/:id/approve
 * @description Set request status to approved
 * @access private (Admins only)
 */
adminWithdrawalRoute.patch("/:id/approve", approveWithdrawalController);

/**
 * @route PATCH /api/admin/withdrawals/:id/reject
 * @description Set request status to rejected
 * @access private (Admins only)
 */
adminWithdrawalRoute.patch("/:id/reject", rejectWithdrawalController);

/**
 * @route PATCH /api/admin/withdrawals/:id/processing
 * @description Mark request as currently processing (funds transferring)
 * @access private (Admins only)
 */
adminWithdrawalRoute.patch("/:id/processing", processingWithdrawalController);

/**
 * @route PATCH /api/admin/withdrawals/:id/complete
 * @description Set request status to completed
 * @access private (Admins only)
 */
adminWithdrawalRoute.patch("/:id/complete", completeWithdrawalController);
