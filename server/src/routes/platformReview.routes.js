import expressRouter from "express";
import {
  createOrUpdatePlatformReviewController,
  getPlatformReviewsController,
} from "../controllers/platformReview.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const platformReviewRoute = expressRouter();

/**
 * @route POST /api/platform-reviews
 * @description Submit or update platform review
 * @access private
 */
platformReviewRoute.post("/", authUser, createOrUpdatePlatformReviewController);

/**
 * @route GET /api/platform-reviews
 * @description Get all platform reviews
 * @access public
 */
platformReviewRoute.get("/", getPlatformReviewsController);
