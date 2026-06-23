import mongoose from "mongoose";
import bcrypt from "bcrypt";
import envConfig from "./src/config/envConfig.js";

async function run() {
  await mongoose.connect(envConfig.MONGO_URL);
  console.log("Connected to MongoDB!");

  const hashedPassword = await bcrypt.hash("Aman@0808", 10);

  const result = await mongoose.connection.db.collection("users").updateOne(
    { email: "suraj20050312@gmail.com" },
    {
      $set: {
        password: hashedPassword,
        sellerStatus: "not_applied",
        collegeIdCard: null
      }
    }
  );

  console.log("Updated user suraj20050312@gmail.com:", result);
  await mongoose.disconnect();
}

run().catch(console.error);
