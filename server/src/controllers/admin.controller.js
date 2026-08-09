import { userModel } from "../models/user.model.js";
import { listingModel } from "../models/listing.model.js";
import { reportModel } from "../models/report.model.js";
import { bookRequestModel } from "../models/bookrequest.model.js";
import {
  getMaintenanceStatus,
  setMaintenanceStatus,
  getMaintenanceHistory
} from "../services/maintenance.service.js";

// Fetch aggregated marketplace analytics
export async function getAdminAnalyticsController(req, res) {
  try {
    const [totalUsers, activeSellers, activeListings, booksSold, bookRequests] = await Promise.all([
      userModel.countDocuments({ isDeleted: false }),
      userModel.countDocuments({ sellerStatus: "verified", isDeleted: false }),
      listingModel.countDocuments({ status: "active" }),
      listingModel.countDocuments({ status: "sold" }),
      bookRequestModel.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      message: "Marketplace analytics calculated successfully",
      data: {
        analytics: {
          totalUsers,
          activeSellers,
          activeListings,
          booksSold,
          bookRequests,
        },
      },
    });
  } catch (error) {
    console.error("Get admin analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating marketplace statistics",
    });
  }
}

// Fetch list of users for administration
export async function adminGetUsersController(req, res) {
  try {
    const users = await userModel.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Users list fetched successfully for admin",
      data: { users },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving users list",
    });
  }
}

// Fetch list of listings for administration
export async function adminGetListingsController(req, res) {
  try {
    const listings = await listingModel
      .find()
      .populate("seller", "name email collegeName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Listings list fetched successfully for admin",
      data: { listings },
    });
  } catch (error) {
    console.error("Admin get listings error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving listings list",
    });
  }
}

// Fetch list of reports for administration
export async function adminGetReportsController(req, res) {
  try {
    const reports = await reportModel
      .find()
      .populate("reporter", "name email collegeName")
      .populate("listing", "title seller status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Reports list fetched successfully for admin",
      data: { reports },
    });
  } catch (error) {
    console.error("Admin get reports error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving reports list",
    });
  }
}

// Moderate listing reports (resolve/dismiss)
export async function adminResolveReportController(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // should be 'resolved' or 'dismissed'

    if (!status || !["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'resolved' or 'dismissed'",
      });
    }

    const report = await reportModel.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;
    await report.save();

    // If report is resolved, soft-delete the violating listing
    if (status === "resolved") {
      await listingModel.findByIdAndUpdate(report.listing, { status: "removed" });
    }

    res.status(200).json({
      success: true,
      message: `Report successfully marked as ${status}`,
      data: { report },
    });
  } catch (error) {
    console.error("Admin resolve report error:", error);
    res.status(500).json({
      success: false,
      message: "Error moderating report",
    });
  }
}

// Fetch current maintenance status and history log for admin dashboard
export async function adminGetMaintenanceController(req, res) {
  try {
    const status = await getMaintenanceStatus();
    const history = await getMaintenanceHistory();

    return res.status(200).json({
      success: true,
      message: "Maintenance configurations fetched successfully",
      data: {
        maintenance: status,
        history
      }
    });
  } catch (error) {
    console.error("Admin get maintenance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve maintenance configuration"
    });
  }
}

// Toggle/Update maintenance mode
export async function adminUpdateMaintenanceController(req, res) {
  try {
    const { enabled, message } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: "The 'enabled' field (boolean) is required"
      });
    }

    const updatedStatus = await setMaintenanceStatus(
      !!enabled,
      message
    );

    const history = await getMaintenanceHistory();

    return res.status(200).json({
      success: true,
      message: enabled
        ? "Maintenance mode enabled successfully. Users will see the warning barrier page."
        : "Maintenance mode disabled. PustakMart is back online.",
      data: {
        maintenance: updatedStatus,
        history
      }
    });
  } catch (error) {
    console.error("Admin update maintenance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update maintenance configuration"
    });
  }
}