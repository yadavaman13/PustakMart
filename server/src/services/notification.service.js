import { notificationModel } from "../models/notification.model.js";

/**
 * Creates a notification in the database
 * @param {string|mongoose.Types.ObjectId} recipientId 
 * @param {string} type - Enum ['message', 'offer', 'request_match', 'seller_approved', 'other']
 * @param {string} message 
 * @returns {Promise<Object>} The created notification
 */
export const createNotification = async (recipientId, type, message) => {
  try {
    const notification = await notificationModel.create({
      recipient: recipientId,
      type: type || "other",
      message: message,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification in service:", error);
    throw error;
  }
};
