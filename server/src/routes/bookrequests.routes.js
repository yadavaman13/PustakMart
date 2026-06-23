import expressRouter from "express";
import {
  createBookRequestController,
  getBookRequestsController,
  getBookRequestByIdController,
  updateBookRequestController,
  deleteBookRequestController
} from "../controllers/bookrequests.controller.js";
import { authUser, optionalAuth } from "../middlewares/auth.middleware.js";
import { createBookRequestValidator, updateBookRequestValidator } from "../validators/bookrequest.validator.js";

export const bookRequestRoute = expressRouter();

/**
 * @route POST /api/requests/
 * @description Create a new student book request
 * @access private
 */
bookRequestRoute.post("/", authUser, createBookRequestValidator, createBookRequestController);

/**
 * @route GET /api/requests/
 * @description Get and filter book requests
 * @access public (personalizes if authenticated)
 */
bookRequestRoute.get("/", optionalAuth, getBookRequestsController);

/**
 * @route GET /api/requests/:id
 * @description Fetch details of a single book request
 * @access public
 */
bookRequestRoute.get("/:id", optionalAuth, getBookRequestByIdController);

/**
 * @route PUT /api/requests/:id
 * @description Update book request details/status
 * @access private (requester only)
 */
bookRequestRoute.put("/:id", authUser, updateBookRequestValidator, updateBookRequestController);

/**
 * @route DELETE /api/requests/:id
 * @description Delete/Cancel book request
 * @access private (requester or admin only)
 */
bookRequestRoute.delete("/:id", authUser, deleteBookRequestController);
