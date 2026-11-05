import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [300, "Minimum withdrawal amount is ₹300"],
    },
    payoutMethod: {
      type: String,
      enum: ["upi", "bank"],
      required: true,
    },
    payoutDetailsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    processedAt: {
      type: Date,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    adminRemark: {
      type: String,
      default: "",
    },
    transactionReference: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
withdrawalSchema.index({ seller: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export const withdrawalModel = mongoose.model("withdrawal", withdrawalSchema);
