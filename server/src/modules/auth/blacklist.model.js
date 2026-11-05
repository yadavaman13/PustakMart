import mongoose from "mongoose";

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "token is required"],
    },
  },
  { timestamps: true },
);

export const blacklistTokenModel = mongoose.model("blacklistToken", blacklistTokenSchema)