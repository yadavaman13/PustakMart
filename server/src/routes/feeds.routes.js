import expressRouter from "express";
import { getHomeFeedController } from "../controllers/feeds.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

export const feedRoute = expressRouter();

/**
 * @route GET /api/feeds/home
 * @description Fetch compiled home feed (Local college books, trending, latest)
 * @access public (uses optionalAuth to customize if logged in)
 */
feedRoute.get("/home", optionalAuth, getHomeFeedController);
