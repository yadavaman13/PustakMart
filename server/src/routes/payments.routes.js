import expressRouter from "express";
import {
  createPaymentOrderController,
  verifyPaymentController
} from "../controllers/payments.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const paymentRoute = expressRouter();

/**
 * @route POST /api/payments/create-order
 * @route POST /api/payment/create (backward compatibility)
 */
paymentRoute.post("/create-order", authUser, createPaymentOrderController);
paymentRoute.post("/create", authUser, createPaymentOrderController);

/**
 * @route POST /api/payments/verify
 * @route POST /api/payment/verify (backward compatibility)
 */
paymentRoute.post("/verify", authUser, verifyPaymentController);
