import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups on listing chats and user participant lists
conversationSchema.index({ participants: 1 });
conversationSchema.index({ listing: 1 });

export const conversationModel = mongoose.model("conversation", conversationSchema);
