import expressRouter from "express";
import { getMessagesController } from "../controllers/chat.controller.js";
import { authUser } from "../../../middlewares/auth.middleware.js";

export const messageRoute = expressRouter();

/**
 * @route GET /api/messages/:conversationId
 * @description Fetch all messages for a conversation
 * @access private
 */
messageRoute.get("/:conversationId", authUser, getMessagesController);
