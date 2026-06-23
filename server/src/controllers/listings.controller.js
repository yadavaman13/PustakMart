import { listingModel } from "../models/listing.model.js";
import { userModel } from "../models/user.model.js";

// Create listing (single book or bundle)
export async function createBookListingController(req, res) {
  try {
    const {
      listingType,
      title,
      description,
      price,
      images,
      condition,
      category,
      department,
      semester,
      author,
      books,
      city,
      collegeName,
    } = req.body;

    if (!listingType || !title || price === undefined || !category) {
      return res.status(400).json({
        message: "listingType, title, price, and category are required fields",
      });
    }

    if (!["book", "bundle"].includes(listingType)) {
      return res.status(400).json({
        message: "listingType must be either 'book' or 'bundle'",
      });
    }

    // Default to user's college if not explicitly provided
    const listingCollege = collegeName || req.user.collegeName;

    const listing = await listingModel.create({
      seller: req.user._id,
      listingType,
      title,
      description,
      price: Number(price),
      images: images || [],
      condition,
      category,
      department,
      semester: semester ? Number(semester) : undefined,
      author,
      books: listingType === "bundle" ? books : [],
      city,
      collegeName: listingCollege,
    });

    res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({ message: "Error creating book listing", error: error.message });
  }
}

// Get listings with advanced search, filters, and Local First sorting
export async function getListingsController(req, res) {
  try {
    const {
      category,
      department,
      semester,
      listingType,
      condition,
      collegeName,
      city,
      minPrice,
      maxPrice,
      status = "active", // default to active listings
      search,
      sortBy,
      page = 1,
      limit = 20,
      seller,
    } = req.query;

    const query = {};

    // Apply basic filters
    if (category) query.category = category;
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (listingType) query.listingType = listingType;
    if (condition) query.condition = condition;
    if (collegeName) query.collegeName = { $regex: new RegExp(collegeName, "i") };
    if (city) query.city = { $regex: new RegExp(city, "i") };
    if (seller) query.seller = seller;
    if (status && status !== "all") {
      query.status = status;
    } else if (status === "all") {
      query.status = { $ne: "removed" };
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Keyword search
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { author: regex },
        { "books.title": regex },
        { "books.author": regex },
      ];
    }

    // Fetch and populate seller
    let listings = await listingModel.find(query).populate({
      path: "seller",
      select: "name collegeName department averageRating totalReviews isVerified ProfilePicture sellerStatus"
    });

    // Local First & Sorting logic
    // Prioritize: user's college Name first, then user's city, then other sorting
    const userCollege = req.user?.collegeName || req.query.userCollege;
    
    listings.sort((a, b) => {
      if (userCollege) {
        const aColl = a.collegeName?.toLowerCase() === userCollege.toLowerCase();
        const bColl = b.collegeName?.toLowerCase() === userCollege.toLowerCase();
        if (aColl && !bColl) return -1;
        if (!aColl && bColl) return 1;
      }

      // Sort by specific fields
      if (sortBy === "price_asc") {
        return a.price - b.price;
      } else if (sortBy === "price_desc") {
        return b.price - a.price;
      } else if (sortBy === "views") {
        return b.viewsCount - a.viewsCount;
      } else {
        // default: newest first
        return b.createdAt - a.createdAt;
      }
    });

    // Handle pagination manually in JS after sorting (since sorting is dynamic and relies on user college context)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    
    const paginatedListings = listings.slice(startIndex, endIndex);

    res.status(200).json({
      message: "Listings retrieved successfully",
      total: listings.length,
      page: pageNum,
      limit: limitNum,
      listings: paginatedListings,
    });
  } catch (error) {
    console.error("Get listings error:", error);
    res.status(500).json({ message: "Error fetching listings", error: error.message });
  }
}

// Get single listing details
export async function getListingByIdController(req, res) {
  try {
    const { id } = req.params;
    const listing = await listingModel.findById(id).populate({
      path: "seller",
      select: "name collegeName department averageRating totalReviews isVerified ProfilePicture sellerStatus"
    });

    if (!listing || listing.status === "removed") {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Increment views count if the viewer is not the seller
    const isSeller = req.user && listing.seller?._id.toString() === req.user._id.toString();
    if (!isSeller) {
      listing.viewsCount = (listing.viewsCount || 0) + 1;
      await listing.save();
    }

    res.status(200).json({
      message: "Listing details retrieved successfully",
      listing,
    });
  } catch (error) {
    console.error("Get listing details error:", error);
    res.status(500).json({ message: "Error retrieving listing details" });
  }
}

// Update listing
export async function updateListingController(req, res) {
  try {
    const { id } = req.params;
    const listing = await listingModel.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Check ownership or admin status
    const isOwner = listing.seller.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        message: "You do not have permission to update this listing",
      });
    }

    const {
      title,
      description,
      price,
      images,
      condition,
      category,
      department,
      semester,
      author,
      books,
      status,
      city,
      collegeName,
    } = req.body;

    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (price !== undefined) listing.price = Number(price);
    if (images !== undefined) listing.images = images;
    if (condition !== undefined) listing.condition = condition;
    if (category !== undefined) listing.category = category;
    if (department !== undefined) listing.department = department;
    if (semester !== undefined) listing.semester = semester ? Number(semester) : undefined;
    if (author !== undefined) listing.author = author;
    if (books !== undefined) listing.books = books;
    if (status !== undefined) listing.status = status;
    if (city !== undefined) listing.city = city;
    if (collegeName !== undefined) listing.collegeName = collegeName;

    await listing.save();

    res.status(200).json({
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    console.error("Update listing error:", error);
    res.status(500).json({ message: "Error updating listing", error: error.message });
  }
}

// Soft delete / Remove listing
export async function deleteListingController(req, res) {
  try {
    const { id } = req.params;
    const listing = await listingModel.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const isOwner = listing.seller.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        message: "You do not have permission to remove this listing",
      });
    }

    listing.status = "removed";
    await listing.save();

    res.status(200).json({
      message: "Listing marked as removed successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ message: "Error removing listing" });
  }
}

// Mark listing as sold and increment seller's booksSold metric
export async function markListingAsSoldController(req, res) {
  try {
    const { id } = req.params;
    const listing = await listingModel.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Only seller can mark as sold
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the seller can mark this listing as sold",
      });
    }

    if (listing.status === "sold") {
      return res.status(400).json({
        message: "Listing is already marked as sold",
      });
    }

    listing.status = "sold";
    await listing.save();

    // Increment seller's booksSold count
    const seller = await userModel.findById(req.user._id);
    if (seller) {
      seller.booksSold = (seller.booksSold || 0) + 1;
      await seller.save();
    }

    res.status(200).json({
      message: "Listing marked as sold. Seller statistics updated.",
      listing,
    });
  } catch (error) {
    console.error("Mark as sold error:", error);
    res.status(500).json({ message: "Error marking listing as sold" });
  }
}