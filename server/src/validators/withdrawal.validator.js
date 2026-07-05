import { body } from "express-validator";
import { validateRequest } from "./validate.js";

export const withdrawalValidator = [
  body("amount")
    .notEmpty()
    .withMessage("Withdrawal amount is required")
    .isNumeric()
    .withMessage("Withdrawal amount must be a number")
    .custom((value) => {
      if (Number(value) < 300) {
        throw new Error("Minimum withdrawal amount is ₹300");
      }
      return true;
    }),

  body("payoutMethod")
    .trim()
    .isIn(["upi", "bank"])
    .withMessage("Payout method must be either 'upi' or 'bank'"),

  validateRequest,
];
