import expressRouter from "express";
import {
  createPaymentOrderController,
  verifyPaymentController
} from "../controllers/payments.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const paymentRoute = expressRouter();

/**
 * @route POST /api/payment/create
 * @description Create a Razorpay checkout payment order for a listing
 * @access private
 */
paymentRoute.post("/create", authUser, createPaymentOrderController);

/**
 * @route POST /api/payment/verify
 * @description Verify Razorpay transaction signatures and mark listings as sold
 * @access private
 */
paymentRoute.post("/verify", authUser, verifyPaymentController);
