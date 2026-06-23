import expressRouter from "express";
import {
  registerSendOtpController,
  registerVerifyOtpController,
  registerResendOtpController,
  forgotPasswordSendOtpController,
  forgotPasswordVerifyOtpController,
  resetPasswordController,
  loginUserController,
  logoutUserController,
  getMeController,
  updateProfileController,
  applySellerController,
  getUserPublicProfileController,
  adminGetPendingSellersController,
  adminVerifySellerController,
  adminUpdateUserStatusController
} from "../controllers/auth.controller.js";
import { authUser, isAdmin } from "../middlewares/auth.middleware.js";
import {
  registerValidator,
  loginValidator,
  registerVerifyOtpValidator,
  registerResendOtpValidator,
  forgotPasswordSendOtpValidator,
  forgotPasswordVerifyOtpValidator,
  resetPasswordValidator
} from "../validators/auth.validator.js";

export const authRoute = expressRouter();

/**
 * @route POST /api/auth/register/send-otp
 * @description Send registration verification OTP
 * @access public
 */
authRoute.post("/register/send-otp", registerValidator, registerSendOtpController);

/**
 * @route POST /api/auth/register/verify-otp
 * @description Verify registration OTP and create user
 * @access public
 */
authRoute.post("/register/verify-otp", registerVerifyOtpValidator, registerVerifyOtpController);

/**
 * @route POST /api/auth/register/resend-otp
 * @description Resend registration OTP
 * @access public
 */
authRoute.post("/register/resend-otp", registerResendOtpValidator, registerResendOtpController);

/**
 * @route POST /api/auth/forgot-password/send-otp
 * @description Send password reset OTP
 * @access public
 */
authRoute.post("/forgot-password/send-otp", forgotPasswordSendOtpValidator, forgotPasswordSendOtpController);

/**
 * @route POST /api/auth/forgot-password/verify-otp
 * @description Verify forgot password OTP and create reset session
 * @access public
 */
authRoute.post("/forgot-password/verify-otp", forgotPasswordVerifyOtpValidator, forgotPasswordVerifyOtpController);

/**
 * @route POST /api/auth/reset-password
 * @description Reset user password with token
 * @access public
 */
authRoute.post("/reset-password", resetPasswordValidator, resetPasswordController);

/**
 * @route POST /api/auth/login
 * @description Login User
 * @access public
 */
authRoute.post("/login", loginValidator, loginUserController);

/**
 * @route POST /api/auth/logout
 * @description Logout User
 * @access private
 */
authRoute.post("/logout", authUser, logoutUserController);

/**
 * @route GET /api/auth/me
 * @description Fetch the logged-in user details
 * @access private
 */
authRoute.get("/me", authUser, getMeController);

/**
 * @route PUT /api/auth/profile
 * @description Update user profile details
 * @access private
 */
authRoute.put("/profile", authUser, updateProfileController);

/**
 * @route POST /api/auth/apply-seller
 * @description Apply to become verified seller
 * @access private
 */
authRoute.post("/apply-seller", authUser, applySellerController);

/**
 * @route GET /api/auth/profile/:id
 * @description Fetch public profile of any user/seller
 * @access public
 */
authRoute.get("/profile/:id", getUserPublicProfileController);

/**
 * @route GET /api/auth/admin/pending-sellers
 * @description Fetch all pending seller applications
 * @access private (Admin only)
 */
authRoute.get("/admin/pending-sellers", authUser, isAdmin, adminGetPendingSellersController);

/**
 * @route POST /api/auth/admin/verify-seller/:id
 * @description Approve or reject a seller application
 * @access private (Admin only)
 */
authRoute.post("/admin/verify-seller/:id", authUser, isAdmin, adminVerifySellerController);

/**
 * @route PUT /api/auth/admin/user-status/:id
 * @description Block, unblock or soft-delete user
 * @access private (Admin only)
 */
authRoute.put("/admin/user-status/:id", authUser, isAdmin, adminUpdateUserStatusController);