import { savedListingModel } from "../models/savedlisting.model.js";
import { listingModel } from "../models/listing.model.js";

// Toggle bookmark status of a book listing
export async function toggleSaveListingController(req, res) {
  try {
    const { listingId } = req.params;

    const listing = await listingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const bookmark = await savedListingModel.findOne({
      user: req.user._id,
      listing: listingId,
    });

    if (bookmark) {
      // Unbookmark
      await savedListingModel.findByIdAndDelete(bookmark._id);
      
      // Decrement counter
      listing.savedCount = Math.max(0, (listing.savedCount || 0) - 1);
      await listing.save();

      return res.status(200).json({
        success: true,
        message: "Listing removed from bookmarks",
        data: { saved: false },
      });
    } else {
      // Bookmark
      await savedListingModel.create({
        user: req.user._id,
        listing: listingId,
      });

      // Increment counter
      listing.savedCount = (listing.savedCount || 0) + 1;
      await listing.save();

      return res.status(200).json({
        success: true,
        message: "Listing saved to bookmarks",
        data: { saved: true },
      });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bookmark",
      error: error.message,
    });
  }
}

// Get bookmarks list for the logged-in user
export async function getSavedListingsController(req, res) {
  try {
    const bookmarks = await savedListingModel
      .find({ user: req.user._id })
      .populate({
        path: "listing",
        populate: {
          path: "seller",
          select: "name collegeName department averageRating totalReviews isVerified ProfilePicture"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Saved listings retrieved successfully",
      data: { bookmarks },
    });
  } catch (error) {
    console.error("Get saved listings error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved listings",
    });
  }
}
