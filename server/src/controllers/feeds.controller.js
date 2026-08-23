import { listingModel } from "../models/listing.model.js";
import { userModel } from "../models/user.model.js";
import { bookRequestModel } from "../models/bookrequest.model.js";

// Retrieve the aggregated Home Feed
export async function getHomeFeedController(req, res) {
  try {
    const userCollege = req.user?.collegeName || req.query.userCollege || "";

    const lookupSeller = [
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          "seller.password": 0,
          "seller.email": 0,
          "seller.mobileNumber": 0,
          "seller.collegeIdCard": 0,
        },
      },
    ];

    // Build Aggregation pipelines
    const collegeFacet = userCollege
      ? [
          { $match: { status: "active", collegeName: { $regex: new RegExp(userCollege, "i") } } },
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          ...lookupSeller,
        ]
      : [];

    const trendingFacet = [
      { $match: { status: "active" } },
      { $sort: { viewsCount: -1 } },
      { $limit: 10 },
      ...lookupSeller,
    ];

    const latestFacet = [
      { $match: { status: "active" } },
      ...(userCollege
        ? [{ $match: { collegeName: { $not: { $regex: new RegExp(userCollege, "i") } } } }]
        : []),
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      ...lookupSeller,
    ];

    // Build the main aggregation query
    const results = await listingModel.aggregate([
      {
        $facet: {
          collegeListings: collegeFacet.length > 0 ? collegeFacet : [{ $match: { _id: null } }],
          trendingListings: trendingFacet,
          latestListings: latestFacet,
        },
      },
    ]);

    const feed = results[0] || {
      collegeListings: [],
      trendingListings: [],
      latestListings: [],
    };

    res.status(200).json({
      success: true,
      message: "Home feed compiled successfully",
      data: {
        collegeName: userCollege || null,
        feed,
      },
    });
  } catch (error) {
    console.error("Get home feed error:", error);
    res.status(500).json({
      success: false,
      message: "Error loading home feed",
      error: error.message,
    });
  }
}

// Retrieve public statistics for the marketplace
export async function getPublicStatsController(req, res) {
  try {
    const [totalUsers, activeSellers, activeListings, booksSold, uniqueColleges] = await Promise.all([
      userModel.countDocuments({ isDeleted: false }),
      userModel.countDocuments({ sellerStatus: "verified", isDeleted: false }),
      listingModel.countDocuments({ status: "active" }),
      listingModel.countDocuments({ status: "sold" }),
      userModel.distinct("collegeName", { isDeleted: false })
    ]);

    const collegesCount = uniqueColleges.filter(Boolean).length;

    res.status(200).json({
      success: true,
      message: "Public statistics retrieved successfully",
      data: {
        stats: {
          totalUsers,
          activeSellers,
          activeListings,
          booksSold,
          collegesCount: collegesCount || 0
        }
      }
    });
  } catch (error) {
    console.error("Get public stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving public statistics",
      error: error.message
    });
  }
}

// Retrieve public college names for display/filters
export async function getPublicCollegesController(req, res) {
  try {
    const [collegesFromUsers, collegesFromListings] = await Promise.all([
      userModel.distinct("collegeName", { isDeleted: false }),
      listingModel.distinct("collegeName", { status: "active" })
    ]);

    const defaultColleges = [
      "IIT Delhi",
      "BITS Pilani",
      "DTU Delhi",
      "NIT Trichy",
      "VIT Vellore",
      "NSUT Delhi",
      "RVCE Bangalore",
      "COEP Pune"
    ];

    const allColleges = Array.from(
      new Set([
        ...collegesFromUsers,
        ...collegesFromListings,
        ...defaultColleges
      ])
    )
      .filter(Boolean)
      .map(c => c.trim());

    res.status(200).json({
      success: true,
      message: "Colleges retrieved successfully",
      colleges: allColleges
    });
  } catch (error) {
    console.error("Get public colleges error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving public colleges",
      error: error.message
    });
  }
}
