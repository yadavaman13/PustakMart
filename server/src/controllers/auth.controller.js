import { userModel } from "../models/user.model.js";
import { blacklistTokenModel } from "../models/blacklist.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import envConfig from "../config/envConfig.js";
import redis from "../config/cache.js";
import { generateOtp } from "../utils/otp.util.js";
import { sendOtpEmail } from "../services/email/otp.service.js";
import { notificationModel } from "../models/notification.model.js";
import { emitToUser } from "../sockets/server.socket.js";


// Helper to check and increment hourly send limits
async function checkAndIncrementOtpSendLimit(email, res) {
  let sendCount = await redis.get(`otp-send-count:${email}`);
  sendCount = sendCount ? parseInt(sendCount, 10) : 0;

  if (sendCount >= 5) {
    res.status(429).json({
      success: false,
      message: "Too many OTP verification requests. Please try again after an hour.",
    });
    return false;
  }

  sendCount += 1;
  if (sendCount === 1) {
    await redis.set(`otp-send-count:${email}`, sendCount, "EX", 3600);
  } else {
    const ttl = await redis.ttl(`otp-send-count:${email}`);
    await redis.set(`otp-send-count:${email}`, sendCount, "EX", ttl > 0 ? ttl : 3600);
  }
  return true;
}


// 1. Send Registration OTP
export async function registerSendOtpController(req, res) {
  try {
    const { name, email, password, mobileNumber, collegeName, department, semester } = req.body;

    if (!name || !email || !password || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and mobile number are required for registration",
      });
    }

    // Check if email or mobile is already in use in DB
    const emailExists = await userModel.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "A user already exists with this email address",
      });
    }

    const mobileExists = await userModel.findOne({ mobileNumber });
    if (mobileExists) {
      return res.status(400).json({
        success: false,
        message: "A user already exists with this mobile number",
      });
    }

    // Check hourly limit
    const allowed = await checkAndIncrementOtpSendLimit(email, res);
    if (!allowed) return;

    // Check cooldown
    const cooldownExists = await redis.get(`cooldown:register:${email}`);
    if (cooldownExists) {
      return res.status(429).json({
        success: false,
        message: "Please wait 2 minutes before requesting a new OTP.",
      });
    }

    // Hash password before storing in Redis
    const hashedPassword = await bcrypt.hash(password, 7);

    // Generate and store OTP
    const otp = generateOtp();
    await redis.set(`otp:register:${email}`, otp, "EX", 300); // 5 minutes TTL
    await redis.set(`attempts:register:${email}`, 0, "EX", 300); // 5 minutes TTL

    // Store registration data payload
    const regPayload = JSON.stringify({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      collegeName,
      department,
      semester: semester ? Number(semester) : undefined,
    });
    await redis.set(`register-data:${email}`, regPayload, "EX", 300); // 5 minutes TTL

    // Set cooldown
    await redis.set(`cooldown:register:${email}`, "true", "EX", 120); // 2 minutes TTL

    // Send email
    await sendOtpEmail(email, otp, "register");

    res.status(200).json({
      success: true,
      message: "Verification OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Register Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending verification OTP",
      error: error.message,
    });
  }
}

// 2. Verify Registration OTP and Create User
export async function registerVerifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redis.get(`otp:register:${email}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid. Please request a new one.",
      });
    }

    // Check and increment attempt counter
    let attempts = await redis.get(`attempts:register:${email}`);
    attempts = attempts ? parseInt(attempts, 10) : 0;
    attempts += 1;

    if (attempts > 3) {
      await redis.del(`otp:register:${email}`);
      await redis.del(`attempts:register:${email}`);
      await redis.del(`register-data:${email}`);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. OTP has been invalidated. Please request a new one.",
      });
    }

    await redis.set(`attempts:register:${email}`, attempts, "EX", 300);

    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. Attempt ${attempts} of 3.`,
      });
    }

    // Get registration payload
    const payloadStr = await redis.get(`register-data:${email}`);
    if (!payloadStr) {
      return res.status(400).json({
        success: false,
        message: "Registration session has expired. Please register again.",
      });
    }

    const payload = JSON.parse(payloadStr);

    // Create user in DB
    const user = await userModel.create({
      ...payload,
      isVerified: true,
    });

    // Cleanup keys
    await redis.del(`otp:register:${email}`);
    await redis.del(`attempts:register:${email}`);
    await redis.del(`register-data:${email}`);
    await redis.del(`cooldown:register:${email}`);

    // Log user in automatically
    const token = jwt.sign(
      { id: user._id },
      envConfig.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Email verified and user registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
          role: user.role,
          sellerStatus: user.sellerStatus,
          sellerStatusComment: user.sellerStatusComment,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
}

//TODO: 23/7/26 - setup the resend email service in all the controllers and study all the controllers.
// 3. Resend Registration OTP
export async function registerResendOtpController(req, res) {
  try {
    const { email } = req.body;

    const payloadStr = await redis.get(`register-data:${email}`);
    if (!payloadStr) {
      return res.status(400).json({
        success: false,
        message: "Registration session has expired. Please register again.",
      });
    }

    // Check hourly limit
    const allowed = await checkAndIncrementOtpSendLimit(email, res);
    if (!allowed) return;

    // Check cooldown
    const cooldownExists = await redis.get(`cooldown:register:${email}`);
    if (cooldownExists) {
      return res.status(429).json({
        success: false,
        message: "Please wait 2 minutes before requesting a new OTP.",
      });
    }

    // Generate and store new OTP
    const otp = generateOtp();
    await redis.set(`otp:register:${email}`, otp, "EX", 300);
    await redis.set(`attempts:register:${email}`, 0, "EX", 300); // Reset attempts

    // Set cooldown
    await redis.set(`cooldown:register:${email}`, "true", "EX", 120);

    // Send email
    await sendOtpEmail(email, otp, "register");

    res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Register Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Error resending OTP",
      error: error.message,
    });
  }
}

// Login user
export async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required for login",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Ensure email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email address before logging in",
      });
    }

    // Check if user is blocked or deleted
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact admin.",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT using envConfig
    const token = jwt.sign(
      { id: user._id },
      envConfig.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
          role: user.role,
          sellerStatus: user.sellerStatus,
          sellerStatusComment: user.sellerStatusComment,
          isVerified: user.isVerified,
          ProfilePicture: user.ProfilePicture,
          booksSold: user.booksSold,
          averageRating: user.averageRating,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
}

// Logout user
export async function logoutUserController(req, res) {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }

    if (token) {
      // Blacklist token
      await blacklistTokenModel.create({ token });
    }

    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging out user",
    });
  }
}

// Get own profile
export async function getMeController(req, res) {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
          role: user.role,
          sellerStatus: user.sellerStatus,
          sellerStatusComment: user.sellerStatusComment,
          isVerified: user.isVerified,
          ProfilePicture: user.ProfilePicture,
          booksSold: user.booksSold,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving profile",
    });
  }
}

// Update profile details
export async function updateProfileController(req, res) {
  try {
    const { name, mobileNumber, collegeName, department, semester, ProfilePicture } = req.body;
    const user = req.user;

    if (name) user.name = name;

    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const mobileExists = await userModel.findOne({ mobileNumber, _id: { $ne: user._id } });
      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is already in use",
        });
      }
      user.mobileNumber = mobileNumber;
    }

    if (collegeName !== undefined) user.collegeName = collegeName;
    if (department !== undefined) user.department = department;
    if (semester !== undefined) user.semester = semester ? Number(semester) : undefined;
    if (ProfilePicture !== undefined) user.ProfilePicture = ProfilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
          role: user.role,
          sellerStatus: user.sellerStatus,
          sellerStatusComment: user.sellerStatusComment,
          isVerified: user.isVerified,
          ProfilePicture: user.ProfilePicture,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
}

// Apply for seller verification
export async function applySellerController(req, res) {
  try {
    const { collegeIdCard } = req.body;

    if (!collegeIdCard) {
      return res.status(400).json({
        success: false,
        message: "College ID Card image/URL is required to apply as a seller",
      });
    }

    const user = req.user;
    user.collegeIdCard = collegeIdCard;
    user.sellerStatus = "pending";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Seller verification request submitted successfully",
      data: {
        sellerStatus: user.sellerStatus,
      },
    });
  } catch (error) {
    console.error("Apply seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error applying for seller status",
    });
  }
}

// Get public profile (for buyer browsing listings)
export async function getUserPublicProfileController(req, res) {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Public profile retrieved successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          collegeName: user.collegeName,
          department: user.department,
          ProfilePicture: user.ProfilePicture,
          sellerStatus: user.sellerStatus,
          isVerified: user.isVerified,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          booksSold: user.booksSold,
        },
      },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving public profile",
    });
  }
}

// ADMIN: Get all users with pending seller application
export async function adminGetPendingSellersController(req, res) {
  try {
    const sellers = await userModel.find({ sellerStatus: "pending", isDeleted: false });
    res.status(200).json({
      success: true,
      message: "Pending seller verification list retrieved successfully",
      data: {
        count: sellers.length,
        sellers,
      },
    });
  } catch (error) {
    console.error("Admin get pending sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending sellers",
    });
  }
}

// ADMIN: Verify (Approve/Reject) a seller application
export async function adminVerifySellerController(req, res) {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // should be 'verified' or 'rejected', and option to add comment

    if (!status || !["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'verified' or 'rejected'",
      });
    }

    const user = await userModel.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.sellerStatus = status;
    user.isVerified = status === "verified";
    user.sellerStatusComment = comment || "";
    await user.save();

    // Log seller notification
    const notificationMsg = status === "verified"
      ? `Congratulations! Your seller verification request has been approved.${comment ? ' Comment: ' + comment : ''}`
      : `Your seller verification request was rejected.${comment ? ' Reason: ' + comment : ''}`;

    await notificationModel.create({
      recipient: user._id,
      type: "seller_approved",
      message: notificationMsg,
    });

    // Emit live socket event
    emitToUser(user._id.toString(), "notification", {
      type: "seller_approved",
      message: status === "verified" ? "Seller Approved" : "Seller Rejected",
    });

    res.status(200).json({
      success: true,
      message: `Seller status successfully updated to ${status}`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          sellerStatus: user.sellerStatus,
          sellerStatusComment: user.sellerStatusComment,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Admin verify seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating seller verification",
    });
  }
}

// ADMIN: Block, Unblock or Soft-Delete a user
export async function adminUpdateUserStatusController(req, res) {
  try {
    const { id } = req.params;
    const { isBlocked, isDeleted } = req.body;

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (isBlocked !== undefined) {
      user.isBlocked = !!isBlocked;
    }

    if (isDeleted !== undefined) {
      user.isDeleted = !!isDeleted;
      if (user.isDeleted) {
        user.deletedAt = new Date();
      } else {
        user.deletedAt = undefined;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully by admin",
      data: {
        user: {
          id: user._id,
          name: user.name,
          isBlocked: user.isBlocked,
          isDeleted: user.isDeleted,
        },
      },
    });
  } catch (error) {
    console.error("Admin update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
}

// 4. Send Forgot Password OTP
export async function forgotPasswordSendOtpController(req, res) {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Check hourly limit
    const allowed = await checkAndIncrementOtpSendLimit(email, res);
    if (!allowed) return;

    // Check cooldown
    const cooldownExists = await redis.get(`cooldown:forgot:${email}`);
    if (cooldownExists) {
      return res.status(429).json({
        success: false,
        message: "Please wait 2 minutes before requesting a new OTP.",
      });
    }

    // Generate and store OTP
    const otp = generateOtp();
    await redis.set(`otp:forgot:${email}`, otp, "EX", 300); // 5 minutes TTL
    await redis.set(`attempts:forgot:${email}`, 0, "EX", 300); // 5 minutes TTL

    // Set cooldown
    await redis.set(`cooldown:forgot:${email}`, "true", "EX", 120); // 2 minutes TTL

    // Send email
    await sendOtpEmail(email, otp, "forgot");

    res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending password reset OTP",
      error: error.message,
    });
  }
}

// 5. Verify Forgot Password OTP
export async function forgotPasswordVerifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redis.get(`otp:forgot:${email}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid. Please request a new one.",
      });
    }

    // Check attempts
    let attempts = await redis.get(`attempts:forgot:${email}`);
    attempts = attempts ? parseInt(attempts, 10) : 0;
    attempts += 1;

    if (attempts > 3) {
      await redis.del(`otp:forgot:${email}`);
      await redis.del(`attempts:forgot:${email}`);
      await redis.del(`cooldown:forgot:${email}`);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. OTP has been invalidated. Please request a new one.",
      });
    }

    await redis.set(`attempts:forgot:${email}`, attempts, "EX", 300);

    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. Attempt ${attempts} of 3.`,
      });
    }

    // Generate secure resetToken session
    const resetToken = crypto.randomUUID();
    await redis.set(`reset-session:${email}`, resetToken, "EX", 600); // 10 minutes TTL

    // Cleanup keys
    await redis.del(`otp:forgot:${email}`);
    await redis.del(`attempts:forgot:${email}`);
    await redis.del(`cooldown:forgot:${email}`);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
}

// 6. Reset Password using token
export async function resetPasswordController(req, res) {
  try {
    const { email, resetToken, newPassword } = req.body;

    const storedToken = await redis.get(`reset-session:${email}`);
    if (!storedToken) {
      return res.status(400).json({
        success: false,
        message: "Password reset session has expired or is invalid. Please request a new OTP.",
      });
    }

    if (storedToken !== resetToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset token.",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 7);
    user.password = hashedPassword;
    user.isVerified = true;
    await user.save();

    // Clean up reset session
    await redis.del(`reset-session:${email}`);

    res.status(200).json({
      success: true,
      message: "Password has been updated successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
}

// 6. Change Password (Authenticated)
export async function changePasswordController(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both old password and new password are required",
      });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 7);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
}

// 7. Delete own Account (Authenticated)
export async function deleteAccountController(req, res) {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is required to delete your account",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid confirmation password",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Blacklist token if present
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }
    if (token) {
      await blacklistTokenModel.create({ token });
    }

    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
}

