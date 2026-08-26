import mongoose from "mongoose";
import envConfig from "./env.config.js";

export async function connectDB() {
  try {
    await mongoose.connect(envConfig.MONGO_URL);
    console.log("DB connected successfully!");
  } catch (err) {
    console.error("Error connecting DB:", err);
  }
}
