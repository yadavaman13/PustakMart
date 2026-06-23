import expressRouter from "express";
import { getImageKitAuthParamsController } from "../controllers/media.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const mediaRoute = expressRouter();

/**
 * @route GET /api/media/imagekit-auth
 * @description Fetch authentication parameters for direct frontend uploads to ImageKit.io
 * @access private
 */
mediaRoute.get("/imagekit-auth", authUser, getImageKitAuthParamsController);
