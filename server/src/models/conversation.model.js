import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked", "closed"],
      default: "pending",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCountBuyer: {
      type: Number,
      default: 0,
    },
    unreadCountSeller: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups on listing chats, buyer and seller
conversationSchema.index({ listing: 1, buyer: 1, seller: 1 });
conversationSchema.index({ buyer: 1 });
conversationSchema.index({ seller: 1 });

export const conversationModel = mongoose.model("conversation", conversationSchema);
