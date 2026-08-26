import mongoose from "mongoose";

const platformReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Enforce one platform review per user
platformReviewSchema.index({ user: 1 }, { unique: true });

export const platformReviewModel = mongoose.model("platformReview", platformReviewSchema);
