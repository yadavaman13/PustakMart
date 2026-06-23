import expressRouter from "express";
import { createReportController } from "../controllers/reports.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

export const reportRoute = expressRouter();

/**
 * @route POST /api/reports
 * @description Submit a report against a book listing
 * @access private
 */
reportRoute.post("/", authUser, createReportController);
