import expressRouter from "express";
import { 
  createWithdrawalRequestController, 
  getSellerWithdrawalsController,
  getSellerTransactionsController
} from "../controllers/withdrawal.controller.js";
import { withdrawalValidator } from "../validators/withdrawal.validator.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const withdrawalRoute = expressRouter();

// Apply authentication to all seller withdrawal routes
withdrawalRoute.use(authUser);

/**
 * @route POST /api/seller/withdrawals
 * @description Submit a new withdrawal request
 * @access private (Sellers)
 */
withdrawalRoute.post("/", withdrawalValidator, createWithdrawalRequestController);

/**
 * @route GET /api/seller/withdrawals
 * @description Get seller's withdrawal history log
 * @access private (Sellers)
 */
withdrawalRoute.get("/", getSellerWithdrawalsController);

/**
 * @route GET /api/seller/transactions
 * @description Get a unified credit and debit transaction ledger
 * @access private (Sellers)
 */
withdrawalRoute.get("/transactions", getSellerTransactionsController);
