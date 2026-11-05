import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days expiry
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Backward compatibility fields for chat coupons
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: false,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      required: false,
    },
    discountAmount: {
      type: Number,
      required: false,
      min: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware for backward compatibility with chat coupons
couponSchema.pre("validate", function (next) {
  if (this.discountAmount !== undefined && this.discountValue === undefined) {
    this.discountValue = this.discountAmount;
  }
  if (this.discountValue !== undefined && this.discountAmount === undefined) {
    this.discountAmount = this.discountValue;
  }
  next();
});

export const couponModel = mongoose.model("coupon", couponSchema);
