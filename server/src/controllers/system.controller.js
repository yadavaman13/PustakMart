import { getMaintenanceStatus } from "../services/maintenance.service.js";

export async function  systemCurrentMaintenanceController(req, res) {
  try {
    const status = await getMaintenanceStatus();

    // Determine if the current requester is an admin (used to bypass frontend block)
    const isAdmin = !!(req.user && req.user.role === "admin");

    return res.status(200).json({
      success: true,
      data: {
        enabled: status.enabled,
        message: status.message,
        startedAt: status.startedAt,
        isAdmin
      }
    });
  } catch (error) {
    console.error("Error in public system maintenance route:", error);
    // Fail-open response
    return res.status(200).json({
      success: true,
      data: {
        enabled: false,
        message: "PustakMart is undergoing maintenance.",
        startedAt: null,
        isAdmin: false
      }
    });
  }
}