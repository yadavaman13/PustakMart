import expressRouter from "express";
import { getSellerEarningsController } from "../controllers/seller.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const sellerRoute = expressRouter();

/**
 * @route GET /api/seller/earnings
 * @description Fetch seller sales metrics and monthly graph statistics
 * @access private (seller or verified user)
 */
sellerRoute.get("/earnings", authUser, getSellerEarningsController);
