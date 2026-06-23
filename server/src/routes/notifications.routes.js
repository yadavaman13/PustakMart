import expressRouter from "express";
import {
  getNotificationsController,
  markNotificationReadController
} from "../controllers/notifications.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const notificationRoute = expressRouter();

/**
 * @route GET /api/notifications
 * @description Retrieve all notifications of the user
 * @access private
 */
notificationRoute.get("/", authUser, getNotificationsController);

/**
 * @route PATCH /api/notifications/:id/read
 * @description Mark a notification as read
 * @access private
 */
notificationRoute.patch("/:id/read", authUser, markNotificationReadController);
