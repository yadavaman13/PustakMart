import { bookRequestModel } from "../models/bookrequest.model.js";

// Create a new book request
export async function createBookRequestController(req, res) {
  try {
    const { title, description, budget, department, semester, collegeName } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required to create a book request",
      });
    }

    const requestCollege = collegeName || req.user.collegeName;

    const bookRequest = await bookRequestModel.create({
      requestedBy: req.user._id,
      title,
      description,
      budget: budget !== undefined ? Number(budget) : undefined,
      department,
      semester: semester ? Number(semester) : undefined,
      collegeName: requestCollege,
      status: "open",
    });

    res.status(201).json({
      message: "Book request created successfully",
      bookRequest,
    });
  } catch (error) {
    console.error("Create book request error:", error);
    res.status(500).json({ message: "Error creating book request", error: error.message });
  }
}

// Get list of book requests with filters and local-first prioritization
export async function getBookRequestsController(req, res) {
  try {
    const { collegeName, department, semester, status, requestedBy, search } = req.query;
    const query = {};

    if (collegeName) query.collegeName = { $regex: new RegExp(collegeName, "i") };
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (status) query.status = status;
    if (requestedBy) query.requestedBy = requestedBy;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ title: regex }, { description: regex }];
    }

    let requests = await bookRequestModel.find(query).populate({
      path: "requestedBy",
      select: "name collegeName department isVerified ProfilePicture",
    });

    // Local First sort
    const userCollege = req.user?.collegeName || req.query.userCollege;

    requests.sort((a, b) => {
      if (userCollege) {
        const aColl = a.collegeName?.toLowerCase() === userCollege.toLowerCase();
        const bColl = b.collegeName?.toLowerCase() === userCollege.toLowerCase();
        if (aColl && !bColl) return -1;
        if (!aColl && bColl) return 1;
      }
      return b.createdAt - a.createdAt; // default newest first
    });

    res.status(200).json({
      message: "Book requests retrieved successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get book requests error:", error);
    res.status(500).json({ message: "Error retrieving book requests", error: error.message });
  }
}

// Get single book request details
export async function getBookRequestByIdController(req, res) {
  try {
    const { id } = req.params;
    const bookRequest = await bookRequestModel.findById(id).populate({
      path: "requestedBy",
      select: "name collegeName department isVerified ProfilePicture",
    });

    if (!bookRequest) {
      return res.status(404).json({
        message: "Book request not found",
      });
    }

    res.status(200).json({
      message: "Book request retrieved successfully",
      bookRequest,
    });
  } catch (error) {
    console.error("Get book request by ID error:", error);
    res.status(500).json({ message: "Error retrieving book request details" });
  }
}

// Update book request
export async function updateBookRequestController(req, res) {
  try {
    const { id } = req.params;
    const bookRequest = await bookRequestModel.findById(id);

    if (!bookRequest) {
      return res.status(404).json({
        message: "Book request not found",
      });
    }

    // Ensure only the requesting user can update the request
    if (bookRequest.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to update this book request",
      });
    }

    const { title, description, budget, department, semester, collegeName, status } = req.body;

    if (title !== undefined) bookRequest.title = title;
    if (description !== undefined) bookRequest.description = description;
    if (budget !== undefined) bookRequest.budget = budget !== null ? Number(budget) : undefined;
    if (department !== undefined) bookRequest.department = department;
    if (semester !== undefined) bookRequest.semester = semester !== null ? Number(semester) : undefined;
    if (collegeName !== undefined) bookRequest.collegeName = collegeName;
    if (status !== undefined) {
      if (!["open", "fulfilled", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      bookRequest.status = status;
    }

    await bookRequest.save();

    res.status(200).json({
      message: "Book request updated successfully",
      bookRequest,
    });
  } catch (error) {
    console.error("Update book request error:", error);
    res.status(500).json({ message: "Error updating book request", error: error.message });
  }
}

// Delete book request
export async function deleteBookRequestController(req, res) {
  try {
    const { id } = req.params;
    const bookRequest = await bookRequestModel.findById(id);

    if (!bookRequest) {
      return res.status(404).json({
        message: "Book request not found",
      });
    }

    const isOwner = bookRequest.requestedBy.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        message: "You do not have permission to delete this book request",
      });
    }

    await bookRequestModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "Book request deleted successfully",
    });
  } catch (error) {
    console.error("Delete book request error:", error);
    res.status(500).json({ message: "Error deleting book request" });
  }
}
