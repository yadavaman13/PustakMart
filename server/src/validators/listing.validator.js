import { body } from "express-validator";
import { validateRequest } from "./validate.js";

const CATEGORIES = ["engineering", "medical", "school", "competitive_exam", "novel", "other"];
const CONDITIONS = ["new", "like_new", "good", "fair", "poor"];

export const createListingValidator = [
  body("listingType")
    .trim()
    .isIn(["book", "bundle"])
    .withMessage("listingType must be either 'book' or 'bundle'"),
  
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be under 200 characters"),
    
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters"),
  
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  
  body("condition")
    .optional()
    .isIn(CONDITIONS)
    .withMessage("Condition must be one of: new, like_new, good, fair, poor"),
  
  body("category")
    .trim()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    
  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department cannot be empty"),
    
  body("semester")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Semester must be an integer between 1 and 10"),
    
  body("books")
    .optional()
    .isArray()
    .withMessage("Books must be an array of book details"),
    
  body("books.*.title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each book in a bundle must have a title"),

  validateRequest,
];

export const updateListingValidator = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 200 }),
    
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    
  body("condition")
    .optional()
    .isIn(CONDITIONS)
    .withMessage("Invalid condition value"),
    
  body("category")
    .optional()
    .isIn(CATEGORIES)
    .withMessage("Invalid category value"),
    
  body("status")
    .optional()
    .isIn(["active", "reserved", "sold", "removed"])
    .withMessage("Status must be one of: active, reserved, sold, removed"),
    
  validateRequest,
];
