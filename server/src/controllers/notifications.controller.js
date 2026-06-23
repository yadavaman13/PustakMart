import { notificationModel } from "../models/notification.model.js";

// Fetch notifications of the logged-in user
export async function getNotificationsController(req, res) {
  try {
    const notifications = await notificationModel
      .find({ recipient: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: { notifications },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
}

// Mark a specific notification as read
export async function markNotificationReadController(req, res) {
  try {
    const { id } = req.params;

    const notification = await notificationModel.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      data: { notification },
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
    });
  }
}
