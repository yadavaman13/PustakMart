import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    listingType: {
      type: String,
      enum: ["book", "bundle"],
      required: true,
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: 0,
    },
    images: [
      {
        type: String,
      },
    ],
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
    },
    category: {
      type: String,
      enum: [
        "engineering",
        "medical",
        "school",
        "competitive_exam",
        "novel",
        "other",
      ],
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    semester: {
      type: Number,
    },
    author: {
      type: String,
      trim: true,
    },
    books: [
      {
        title: {
          type: String,
          required: true,
        },
        author: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "reserved", "sold", "removed"],
      default: "active",
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    savedCount: {
      type: Number,
      default: 0,
    },
    city: {
      type: String,
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

listingSchema.index({
  title: "text",
  description: "text",
});

export const listingModel = mongoose.model("listing", listingSchema);