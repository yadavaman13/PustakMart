import { body } from "express-validator";
import { validateRequest } from "./validate.js";

export const payoutValidator = [
  body("preferredMethod")
    .trim()
    .isIn(["upi", "bank"])
    .withMessage("Preferred method must be either 'upi' or 'bank'"),

  // Custom check for UPI details when preferredMethod is upi
  body("upi.upiId")
    .if(body("preferredMethod").equals("upi"))
    .trim()
    .notEmpty()
    .withMessage("UPI ID is required when preferred method is UPI")
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage("UPI ID must follow the name@bank format"),

  // Custom checks for bank details when preferredMethod is bank
  body("bank.accountHolderName")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .notEmpty()
    .withMessage("Account holder name is required for bank transfer"),

  body("bank.bankName")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .notEmpty()
    .withMessage("Bank name is required for bank transfer"),

  body("bank.accountNumber")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .notEmpty()
    .withMessage("Account number is required for bank transfer"),

  body("bank.confirmAccountNumber")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .notEmpty()
    .withMessage("Account number confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.bank?.accountNumber) {
        throw new Error("Bank account numbers do not match");
      }
      return true;
    }),

  body("bank.ifscCode")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("IFSC Code is required for bank transfer")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC Code format (e.g. SBIN0001234)"),

  body("bank.branchName")
    .if(body("preferredMethod").equals("bank"))
    .trim()
    .notEmpty()
    .withMessage("Branch name is required for bank transfer"),

  validateRequest,
];
