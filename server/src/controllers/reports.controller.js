import { reportModel } from "../models/report.model.js";
import { listingModel } from "../models/listing.model.js";

// Submit a report for a listing
export async function createReportController(req, res) {
  try {
    const { listingId, reason } = req.body;

    if (!listingId || !reason) {
      return res.status(400).json({
        success: false,
        message: "listingId and reason are required fields",
      });
    }

    const listing = await listingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const report = await reportModel.create({
      reporter: req.user._id,
      listing: listingId,
      reason,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully for admin review",
      data: { report },
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting report",
      error: error.message,
    });
  }
}
