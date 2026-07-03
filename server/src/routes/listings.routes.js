import expressRouter from "express";
import { getCheckoutDetailsController } from "../controllers/payments.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const listingsCheckoutRoute = expressRouter();

/**
 * @route GET /api/listings/:id/checkout
 * @description Fetch book listing details and seller stats for the checkout view
 * @access private (authenticated users)
 */
listingsCheckoutRoute.get("/:id/checkout", authUser, getCheckoutDetailsController);
