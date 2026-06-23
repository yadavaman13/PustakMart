import expressRouter from "express";
import {
  createBookListingController,
  getListingsController,
  getListingByIdController,
  updateListingController,
  deleteListingController,
  markListingAsSoldController,
} from "../controllers/listings.controller.js";
import { authUser, optionalAuth } from "../middlewares/auth.middleware.js";
import { createListingValidator, updateListingValidator } from "../validators/listing.validator.js";

export const listingRoute = expressRouter();

/**
 * @route POST /api/book/create
 * @description Create a book or bundle listing
 * @access private
 */
listingRoute.post("/create", authUser, createListingValidator, createBookListingController);

/**
 * @route GET /api/book/
 * @description Search and fetch book listings with filters
 * @access public (personalizes if authenticated)
 */
listingRoute.get("/", optionalAuth, getListingsController);

/**
 * @route GET /api/book/:id
 * @description Fetch details of a single book listing
 * @access public (increments view count if viewer is not the owner)
 */
listingRoute.get("/:id", optionalAuth, getListingByIdController);

/**
 * @route PUT /api/book/:id
 * @description Update listing details
 * @access private (listing owner or admin only)
 */
listingRoute.put("/:id", authUser, updateListingValidator, updateListingController);

/**
 * @route DELETE /api/book/:id
 * @description Soft-delete a book listing
 * @access private (listing owner or admin only)
 */
listingRoute.delete("/:id", authUser, deleteListingController);

/**
 * @route POST /api/book/:id/sold
 * @description Mark a book listing as sold
 * @access private (listing owner only)
 */
listingRoute.post("/:id/sold", authUser, markListingAsSoldController);