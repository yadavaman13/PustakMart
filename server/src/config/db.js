import mongoose from "mongoose";
import envConfig from "./envConfig.js";

export async function connectDB() {
  try {
    await mongoose.connect(envConfig.MONGO_URL);
    console.log("DB connected successfully!");
  } catch (err) {
    console.error("Error connecting DB:", err);
  }
}
