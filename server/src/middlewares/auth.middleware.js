import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model.js";
import { blacklistTokenModel } from "../models/blacklist.model.js";
import envConfig from "../config/envConfig.js";

// Strict auth check (requires token)
export async function authUser(req, res, next) {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been blacklisted. Please login again.",
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, envConfig.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Fetch user
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check blocked or deleted status
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact admin.",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted.",
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
}

// Optional auth check (proceeds if no token or token is invalid, but populates req.user if valid)
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, envConfig.JWT_SECRET_KEY);
    } catch (err) {
      return next();
    }

    const user = await userModel.findById(decoded.id);
    if (!user || user.isBlocked || user.isDeleted) {
      return next();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Fail silently and proceed as guest
    next();
  }
}

export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin permission required for this resource",
    });
  }

  next();
}
