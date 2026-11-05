import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
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
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      default: null,
    },
    bookPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    marketplaceFee: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    couponDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sellerCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerReceivable: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      required: true,
    },

    // Backward compatibility fields
    orderId: {
      type: String,
      index: true,
    },
    paymentId: {
      type: String,
    },
    signature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    amount: {
      type: Number, // in paise
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to sync backward compatibility fields
paymentSchema.pre("validate", function () {
  if (this.razorpayOrderId) {
    this.orderId = this.razorpayOrderId;
  }
  if (this.razorpayPaymentId) {
    this.paymentId = this.razorpayPaymentId;
  }
  if (this.razorpaySignature) {
    this.signature = this.razorpaySignature;
  }
  if (this.paymentStatus) {
    if (this.paymentStatus === "paid") {
      this.status = "completed";
    } else {
      this.status = this.paymentStatus;
    }
  }
  if (this.totalAmount !== undefined) {
    this.amount = Math.round(this.totalAmount * 100);
  }
});

// Pre-save hook to sync fields when updated
paymentSchema.pre("save", function () {
  if (this.isModified("razorpayOrderId")) {
    this.orderId = this.razorpayOrderId;
  }
  if (this.isModified("razorpayPaymentId")) {
    this.paymentId = this.razorpayPaymentId;
  }
  if (this.isModified("razorpaySignature")) {
    this.signature = this.razorpaySignature;
  }
  if (this.isModified("paymentStatus")) {
    if (this.paymentStatus === "paid") {
      this.status = "completed";
    } else {
      this.status = this.paymentStatus;
    }
  }
  if (this.isModified("totalAmount")) {
    this.amount = Math.round(this.totalAmount * 100);
  }
});

export const paymentModel = mongoose.model("payment", paymentSchema);
