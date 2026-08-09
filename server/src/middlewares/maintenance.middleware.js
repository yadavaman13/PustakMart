import { getMaintenanceStatus } from "../services/maintenance.service.js";

const BYPASS_PATHS = [
  "/api/system/maintenance",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me"
];

/**
 * Middleware to intercept requests during maintenance mode.
 * Allows Admins and essential auth/system APIs to bypass.
 * Fails open if Redis is unavailable.
 */
export async function maintenanceMiddleware(req, res, next) {
  try {
    const cleanPath = req.path.split("?")[0];

    // 1. Allow bypass paths (public check, login, logout, and self session checks)
    if (BYPASS_PATHS.includes(cleanPath) || cleanPath.startsWith("/api/admin")) {
      return next();
    }

    // 2. Allow logged-in admins to access all site features for testing/resolution
    if (req.user && req.user.role === "admin") {
      return next();
    }

    // 3. Fetch status from Redis
    const maintenance = await getMaintenanceStatus();

    if (maintenance && maintenance.enabled) {
      return res.status(503).json({
        success: false,
        message: maintenance.message || "PustakMart is currently undergoing maintenance. We'll be back shortly.",
        startedAt: maintenance.startedAt
      });
    }

    next();
  } catch (error) {
    // Fail-open: Log the failure to Sentry/Console but don't block the request
    console.error("Error in maintenanceMiddleware (failing open):", error);
    next();
  }
}
