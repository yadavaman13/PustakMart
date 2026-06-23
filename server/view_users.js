import mongoose from "mongoose";
import envConfig from "./src/config/envConfig.js";

async function run() {
  await mongoose.connect(envConfig.MONGO_URL);
  console.log("Connected to MongoDB!");

  const users = await mongoose.connection.db.collection("users").find({}).toArray();
  console.log("Total Users in DB:", users.length);
  for (const user of users) {
    console.log({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      sellerStatus: user.sellerStatus,
      collegeIdCard: user.collegeIdCard
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
