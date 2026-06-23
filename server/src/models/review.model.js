import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listing",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index so buyer can only review seller once per listing
reviewSchema.index({ buyer: 1, listing: 1 }, { unique: true });

export const reviewModel = mongoose.model("review", reviewSchema);
