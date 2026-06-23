import { body } from "express-validator";
import { validateRequest } from "./validate.js";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name must be under 50 characters"),
  
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one numeric digit")
    .matches(/[!@#$%^&*(),.?":{}|<>_\-+=`~[\]\\/']/)
    .withMessage("Password must contain at least one special character"),
  
  body("mobileNumber")
    .isNumeric()
    .withMessage("Mobile number must be numeric digits only")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be exactly 10 digits"),
  
  body("collegeName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("College name cannot be empty"),
    
  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty"),
    
  body("semester")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Semester must be an integer between 1 and 10"),
    
  validateRequest,
];

export const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
    
  validateRequest,
];

export const registerVerifyOtpValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric digits only"),
  validateRequest,
];

export const registerResendOtpValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  validateRequest,
];

export const forgotPasswordSendOtpValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  validateRequest,
];

export const forgotPasswordVerifyOtpValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric digits only"),
  validateRequest,
];

export const resetPasswordValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required"),
  body("resetToken")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one numeric digit")
    .matches(/[!@#$%^&*(),.?":{}|<>_\-+=`~[\]\\/']/)
    .withMessage("New password must contain at least one special character"),
  validateRequest,
];

