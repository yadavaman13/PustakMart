import expressRouter from "express";
import {
  createReviewController,
  getSellerReviewsController
} from "../controllers/reviews.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const reviewRoute = expressRouter();

/**
 * @route POST /api/reviews
 * @description Submit feedback for a completed transaction
 * @access private
 */
reviewRoute.post("/", authUser, createReviewController);

/**
 * @route GET /api/reviews/:sellerId
 * @description Get all reviews for a seller
 * @access public
 */
reviewRoute.get("/:sellerId", getSellerReviewsController);
