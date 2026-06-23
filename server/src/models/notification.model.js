import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["message", "offer", "request_match", "seller_approved", "other"],
      required: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const notificationModel = mongoose.model("notification", notificationSchema);
