import mongoose from "mongoose";

const sellerPayoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    preferredMethod: {
      type: String,
      enum: ["upi", "bank"],
      required: true,
    },
    upi: {
      upiId: {
        type: String,
        trim: true,
      },
    },
    bank: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const sellerPayoutModel = mongoose.model("sellerPayout", sellerPayoutSchema);
