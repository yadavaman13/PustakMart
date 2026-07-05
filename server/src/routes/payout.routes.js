import expressRouter from "express";
import { getPayoutController, updatePayoutController } from "../controllers/payout.controller.js";
import { payoutValidator } from "../validators/payout.validator.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const payoutRoute = expressRouter();

// Apply strict authentication
payoutRoute.use(authUser);

/**
 * @route GET /api/seller/payout
 * @description Get seller's payout profile and financial statistics
 * @access private (Sellers)
 */
payoutRoute.get("/", getPayoutController);

/**
 * @route POST /api/seller/payout
 * @description Create or update seller's payout profile credentials
 * @access private (Sellers)
 */
payoutRoute.post("/", payoutValidator, updatePayoutController);
