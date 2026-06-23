import { body } from "express-validator";
import { validateRequest } from "./validate.js";

export const createBookRequestValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Book title is required for a request"),
    
  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
    
  body("semester")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Semester must be an integer between 1 and 10"),
    
  validateRequest,
];

export const updateBookRequestValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),
    
  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must be a positive number"),
    
  body("status")
    .optional()
    .isIn(["open", "fulfilled", "cancelled"])
    .withMessage("Status must be one of: open, fulfilled, cancelled"),
    
  validateRequest,
];
