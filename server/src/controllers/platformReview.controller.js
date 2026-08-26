import { platformReviewModel } from "../models/platformReview.model.js";

// Submit or update a platform rating/review
export async function createOrUpdatePlatformReviewController(req, res) {
  try {
    const { rating, review } = req.body;

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    const platformReview = await platformReviewModel.findOneAndUpdate(
      { user: req.user._id },
      { rating: ratingNum, review: review || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Platform review submitted successfully",
      data: { review: platformReview },
    });
  } catch (error) {
    console.error("Create/update platform review error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting platform review",
      error: error.message,
    });
  }
}

// Fetch all platform ratings/reviews
export async function getPlatformReviewsController(req, res) {
  try {
    const reviews = await platformReviewModel
      .find({})
      .populate("user", "name ProfilePicture collegeName department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Platform reviews fetched successfully",
      data: { reviews },
    });
  } catch (error) {
    console.error("Get platform reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving platform reviews",
      error: error.message,
    });
  }
}
