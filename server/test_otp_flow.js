process.env.MOCK_EMAIL = "true";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import express from "express";
import envConfig from "./src/config/envConfig.js";
import { userModel } from "./src/models/user.model.js";
import redis from "./src/config/cache.js";

dotenv.config();

const { default: app } = await import("./src/app.js");

const PORT = 3008;
const testEmail = "test_otp@example.com";
const testMobile = "9999988888";
let server;
let resetToken = "";

// Helper to make API requests using fetch (Node 18+ native)
async function request(path, method, body, cookie = "") {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (cookie) {
    options.headers["Cookie"] = cookie;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`http://localhost:${PORT}${path}`, options);
  const data = await response.json();
  const cookies = response.headers.get("set-cookie") || "";
  return { status: response.status, data, cookies };
}

async function runTests() {
  console.log("\n=================================");
  console.log("STARTING PROGRAMMATIC OTP FLOW TESTS");
  console.log("=================================\n");

  try {
    // 1. Connect to DB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(envConfig.MONGO_URL);
    console.log("DB connected successfully!");

    // Cleanup previous runs
    await userModel.deleteMany({ email: testEmail });
    await redis.del(`otp:register:${testEmail}`);
    await redis.del(`attempts:register:${testEmail}`);
    await redis.del(`register-data:${testEmail}`);
    await redis.del(`cooldown:register:${testEmail}`);
    await redis.del(`otp-send-count:${testEmail}`);
    await redis.del(`otp:forgot:${testEmail}`);
    await redis.del(`attempts:forgot:${testEmail}`);
    await redis.del(`cooldown:forgot:${testEmail}`);
    await redis.del(`reset-session:${testEmail}`);
    console.log("Database and Redis cleaned up.\n");

    // 2. Start Test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on http://localhost:${PORT}\n`);

    // --- STEP 1: Registration Send OTP ---
    console.log("--- STEP 1: Sending Registration OTP ---");
    const regPayload = {
      name: "OTP Test User",
      email: testEmail,
      password: "password123",
      mobileNumber: testMobile,
      collegeName: "Test GEC",
      department: "CSE",
      semester: 4,
    };

    const res1 = await request("/api/auth/register/send-otp", "POST", regPayload);
    console.log("Send OTP Status:", res1.status);
    console.log("Send OTP Response:", res1.data);
    if (res1.status !== 200) throw new Error("Failed to send registration OTP");

    // Verify Redis has register payload and OTP
    const storedOtp = await redis.get(`otp:register:${testEmail}`);
    const regData = await redis.get(`register-data:${testEmail}`);
    console.log("Redis stored OTP:", storedOtp);
    console.log("Redis register data payload exists:", !!regData);
    if (!storedOtp || !regData) throw new Error("Verification key missing in Redis");
    console.log("");

    // --- STEP 2: Cooldown check ---
    console.log("--- STEP 2: Testing Cooldown Check ---");
    const resCooldown = await request("/api/auth/register/send-otp", "POST", regPayload);
    console.log("Resend OTP Status (expecting 429):", resCooldown.status);
    console.log("Resend OTP Response:", resCooldown.data);
    if (resCooldown.status !== 429) throw new Error("Cooldown mechanism failed");
    console.log("");

    // --- STEP 3: Wrong OTP Attempts Check ---
    console.log("--- STEP 3: Testing Failed OTP Attempts ---");
    const wrongOtpRes = await request("/api/auth/register/verify-otp", "POST", {
      email: testEmail,
      otp: "000000",
    });
    console.log("Wrong OTP verification Status (expect 400):", wrongOtpRes.status);
    console.log("Wrong OTP verification Response:", wrongOtpRes.data);
    if (wrongOtpRes.status !== 400) throw new Error("Wrong OTP should return 400");
    console.log("");

    // --- STEP 4: Correct OTP Verification ---
    console.log("--- STEP 4: Verifying with Correct OTP ---");
    const resVerify = await request("/api/auth/register/verify-otp", "POST", {
      email: testEmail,
      otp: storedOtp,
    });
    console.log("Verify OTP Status (expecting 201):", resVerify.status);
    console.log("Verify OTP Response:", resVerify.data);
    if (resVerify.status !== 201) throw new Error("Failed to verify OTP and register");

    const createdUser = await userModel.findOne({ email: testEmail });
    console.log("User verified in DB:", createdUser.isVerified);
    if (!createdUser || !createdUser.isVerified) throw new Error("User was not registered or verified in DB");
    console.log("");

    // --- STEP 5: Login with Verified Account ---
    console.log("--- STEP 5: Login with Verified Account ---");
    const loginRes = await request("/api/auth/login", "POST", {
      email: testEmail,
      password: "password123",
    });
    console.log("Login Status (expecting 200):", loginRes.status);
    console.log("Login Response message:", loginRes.data.message);
    if (loginRes.status !== 200) throw new Error("Login failed");
    console.log("");

    // --- STEP 6: Forgot Password OTP Send ---
    console.log("--- STEP 6: Sending Forgot Password OTP ---");
    // Manually delete cooldown key first to bypass 2 min check
    await redis.del(`cooldown:forgot:${testEmail}`);

    const forgotSendRes = await request("/api/auth/forgot-password/send-otp", "POST", {
      email: testEmail,
    });
    console.log("Forgot send status:", forgotSendRes.status);
    console.log("Forgot send response:", forgotSendRes.data);
    if (forgotSendRes.status !== 200) throw new Error("Failed to send forgot password OTP");

    const forgotOtp = await redis.get(`otp:forgot:${testEmail}`);
    console.log("Forgot password OTP in Redis:", forgotOtp);
    if (!forgotOtp) throw new Error("Forgot OTP missing in Redis");
    console.log("");

    // --- STEP 7: Verify Forgot Password OTP ---
    console.log("--- STEP 7: Verifying Forgot Password OTP ---");
    const forgotVerifyRes = await request("/api/auth/forgot-password/verify-otp", "POST", {
      email: testEmail,
      otp: forgotOtp,
    });
    console.log("Forgot verify status:", forgotVerifyRes.status);
    console.log("Forgot verify response:", forgotVerifyRes.data);
    if (forgotVerifyRes.status !== 200) throw new Error("Forgot verify failed");

    resetToken = forgotVerifyRes.data.resetToken;
    console.log("Generated Reset Token:", resetToken);
    if (!resetToken) throw new Error("Reset token not generated");
    console.log("");

    // --- STEP 8: Reset Password ---
    console.log("--- STEP 8: Resetting Password ---");
    const resetRes = await request("/api/auth/reset-password", "POST", {
      email: testEmail,
      resetToken,
      newPassword: "newPassword123",
    });
    console.log("Reset password status:", resetRes.status);
    console.log("Reset password response:", resetRes.data);
    if (resetRes.status !== 200) throw new Error("Password reset failed");
    console.log("");

    // --- STEP 9: Login with New Password ---
    console.log("--- STEP 9: Logging in with New Password ---");
    const newLoginRes = await request("/api/auth/login", "POST", {
      email: testEmail,
      password: "newPassword123",
    });
    console.log("Login status with new password:", newLoginRes.status);
    console.log("Login response with new password:", newLoginRes.data.message);
    if (newLoginRes.status !== 200) throw new Error("Login with new password failed");

    console.log("\n=================================");
    console.log("ALL OTP FLOW TESTS PASSED SUCCESSFULLY!");
    console.log("=================================\n");

  } catch (error) {
    console.error("\n=================================");
    console.error("TEST RUN CRASHED / FAILED:");
    console.error(error.message || error);
    console.error("=================================\n");
  } finally {
    console.log("Cleaning up test user database records...");
    await userModel.deleteMany({ email: testEmail });
    await mongoose.disconnect();
    redis.disconnect();
    if (server) {
      server.close();
    }
  }
}

// Allow brief delay for connections to stabilize
setTimeout(runTests, 2000);
