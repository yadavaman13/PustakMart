import expressRouter from "express";
import {
  createConversationController,
  getConversationsController,
  getConversationDetailsController,
  acceptConversationController,
  rejectConversationController,
  createConversationCouponController,
  sendMessageController,
  getMessagesController
} from "../controllers/chats.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const chatRoute = expressRouter();

/**
 * @route POST /api/conversations
 * @description Create or retrieve conversation for a listing
 * @access private
 */
chatRoute.post("/", authUser, createConversationController);

/**
 * @route GET /api/conversations
 * @description Get all active conversations of the logged-in user (uses aggregation pipeline)
 * @access private
 */
chatRoute.get("/", authUser, getConversationsController);

/**
 * @route GET /api/conversations/:id
 * @description Get conversation details
 * @access private
 */
chatRoute.get("/:id", authUser, getConversationDetailsController);

/**
 * @route PATCH /api/conversations/:id/accept
 * @description Seller accepts conversation request
 * @access private
 */
chatRoute.patch("/:id/accept", authUser, acceptConversationController);

/**
 * @route PATCH /api/conversations/:id/reject
 * @description Seller rejects conversation request
 * @access private
 */
chatRoute.patch("/:id/reject", authUser, rejectConversationController);

/**
 * @route POST /api/conversations/:id/coupon
 * @description Seller generates coupon code for the buyer
 * @access private
 */
chatRoute.post("/:id/coupon", authUser, createConversationCouponController);

// --- Compatibility routes for current frontend api calls ---
chatRoute.post("/message", authUser, sendMessageController);
chatRoute.get("/message/:conversationId", authUser, getMessagesController);
