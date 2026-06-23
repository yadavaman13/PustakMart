import expressRouter from "express";
import {
  createConversationController,
  getConversationsController,
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
 * @description Get all active conversations of the logged-in user
 * @access private
 */
chatRoute.get("/", authUser, getConversationsController);

/**
 * @route POST /api/conversations/message
 * @description Send a message in a conversation
 * @access private
 */
chatRoute.post("/message", authUser, sendMessageController);

/**
 * @route GET /api/conversations/message/:conversationId
 * @description Get all messages in a conversation
 * @access private
 */
chatRoute.get("/message/:conversationId", authUser, getMessagesController);
