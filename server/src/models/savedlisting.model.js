import mongoose from "mongoose";

const savedListingSchema = new mongoose.Schema(
  {
    user: {
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
  },
  {
    timestamps: true,
  }
);

// Unique combination index to prevent saving the same listing multiple times
savedListingSchema.index({ user: 1, listing: 1 }, { unique: true });

export const savedListingModel = mongoose.model("savedListing", savedListingSchema);
