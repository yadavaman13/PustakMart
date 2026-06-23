import expressRouter from "express";
import {
  getAdminAnalyticsController,
  adminGetUsersController,
  adminGetListingsController,
  adminGetReportsController,
  adminResolveReportController
} from "../controllers/admin.controller.js";
import { authUser, isAdmin } from "../middlewares/auth.middleware.js";

export const adminRoute = expressRouter();

// Apply auth + admin middlewares to all admin endpoints
adminRoute.use(authUser, isAdmin);

/**
 * @route GET /api/admin/analytics
 * @description Fetch dashboard stats counts
 * @access private (Admin only)
 */
adminRoute.get("/analytics", getAdminAnalyticsController);

/**
 * @route GET /api/admin/users
 * @description Retrieve all registered users
 * @access private (Admin only)
 */
adminRoute.get("/users", adminGetUsersController);

/**
 * @route GET /api/admin/listings
 * @description Retrieve all listings in the system
 * @access private (Admin only)
 */
adminRoute.get("/listings", adminGetListingsController);

/**
 * @route GET /api/admin/reports
 * @description Retrieve all submitted flags/reports
 * @access private (Admin only)
 */
adminRoute.get("/reports", adminGetReportsController);

/**
 * @route PATCH /api/admin/reports/:id
 * @description Moderate/resolve a report
 * @access private (Admin only)
 */
adminRoute.patch("/reports/:id", adminResolveReportController);
