import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: 1000, // Security: max 1000 chars
    },
    messageType: {
      type: String,
      enum: ["text", "image", "offer", "system"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const messageModel = mongoose.model("message", messageSchema);
