import mongoose from "mongoose";
import envConfig from "./src/config/envConfig.js";
import { userModel } from "./src/models/user.model.js";

async function run() {
  try {
    console.log("Connecting to", envConfig.MONGO_URL);
    await mongoose.connect(envConfig.MONGO_URL);
    console.log("DB connected successfully!");
    const users = await userModel.find({}, "name email");
    console.log("Users in DB:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
