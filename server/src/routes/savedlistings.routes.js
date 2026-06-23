import expressRouter from "express";
import {
  toggleSaveListingController,
  getSavedListingsController
} from "../controllers/savedlistings.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const savedListingRoute = expressRouter();

/**
 * @route POST /api/saved-listings/:listingId
 * @description Save or unsave a listing (bookmark toggle)
 * @access private
 */
savedListingRoute.post("/:listingId", authUser, toggleSaveListingController);

/**
 * @route GET /api/saved-listings
 * @description Retrieve all saved book listings of the authenticated user
 * @access private
 */
savedListingRoute.get("/", authUser, getSavedListingsController);
