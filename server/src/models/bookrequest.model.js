import mongoose from "mongoose";

const bookRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    budget: {
      type: Number,
      min: 0,
    },

    department: {
      type: String,
    },

    semester: {
      type: Number,
    },

    collegeName: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "open",
        "fulfilled",
        "cancelled",
      ],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

export const bookRequestModel = mongoose.model("bookRequest", bookRequestSchema);