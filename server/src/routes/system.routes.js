import expressRouter from "express";
import { systemCurrentMaintenanceController } from "../controllers/system.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

export const systemRoute = expressRouter();

/**
 * @route GET /api/system/maintenance
 * @description Fetch current maintenance status. Checked by client on startup.
 * @access Public
 */
systemRoute.get("/maintenance", optionalAuth, systemCurrentMaintenanceController);
