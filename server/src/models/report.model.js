import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const reportModel = mongoose.model("report", reportSchema);
