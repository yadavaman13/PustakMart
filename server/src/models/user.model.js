import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email is already in use"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    mobileNumber: {
      type: Number,
      required: [true, "mobile number is required"],
      unique: [true, "mobile number is already in use"],
    },
    collegeName: {
      type: String,
    },
    department: {
      type: String,
    },
    semester: {
      type: Number,
    },
    ProfilePicture: {
      type: String,
      default: "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    sellerStatus: {
      type: String,
      enum: ["not_applied", "pending", "verified", "rejected"],
      default: "not_applied",
    },
    sellerStatusComment: {
      type: String,
      default: "",
    },
    collegeIdCard: {
      type: String,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    booksSold: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// userSchema.index({ email: 1 });

// userSchema.index({ mobileNumber: 1 });

// userSchema.index({
//   collegeName: 1,
//   department: 1,
// });

export const userModel = mongoose.model("user", userSchema);