import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import envConfig from "./config/env.config.js";
import path from 'path';
import * as Sentry from "@sentry/node";

// ─── Module Route Imports ───
import { authRoute } from "./modules/auth/auth.routes.js";
import { listingRoute } from "./modules/listings/listings.routes.js";
import { savedListingRoute } from "./modules/listings/savedlistings.routes.js";
import { bookRequestRoute } from "./modules/book-requests/bookRequests.routes.js";
import { chatRoute } from "./modules/chat/chat.routes.js";
import { messageRoute } from "./modules/chat/messages.routes.js";
import { reviewRoute } from "./modules/reviews/reviews.routes.js";
import { platformReviewRoute } from "./modules/reviews/platformReview.routes.js";
import { reportRoute } from "./modules/reports/reports.routes.js";
import { notificationRoute } from "./modules/notifications/notifications.routes.js";

import { feedRoute } from "./modules/feeds/feeds.routes.js";
import { adminRoute } from "./modules/admin/admin.routes.js";
import { mediaRoute } from "./modules/media/media.routes.js";
import { paymentRoute } from "./modules/payments/payments.routes.js";
import { listingsCheckoutRoute } from "./modules/payments/listingsCheckout.routes.js";
import { sellerRoute } from "./modules/seller/seller.routes.js";
import { payoutRoute } from "./modules/seller/payout.routes.js";
import { withdrawalRoute } from "./modules/seller/withdrawal.routes.js";
import { adminWithdrawalRoute } from "./modules/admin/adminWithdrawal.routes.js";
import { getSellerTransactionsController } from "./modules/seller/withdrawal.controller.js";
// ─── Middleware & Controller Imports ───
import { authUser, optionalAuth } from "./middlewares/auth.middleware.js";
import { systemRoute } from "./modules/system/system.routes.js";
import { maintenanceMiddleware } from "./middlewares/maintenance.middleware.js";


const app = express();


app.use(express.static(path.join(import.meta.dirname, "public")))
app.use(
  cors({
    origin: envConfig.isAllowedClientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Health check endpoint (always public and fail-open)
app.get("/health", async (req, res) => {
  try {
    const { getMaintenanceStatus } = await import("./services/maintenance.service.js");
    const maintenanceData = await getMaintenanceStatus(app.locals.redis);
    return res.status(200).json({
      status: "ok",
      maintenance: !!maintenanceData?.enabled
    });
  } catch (error) {
    return res.status(200).json({
      status: "ok",
      maintenance: false
    });
  }
});

// System Public routes
app.use("/api/system", systemRoute);

// Apply optionalAuth to populate req.user, then check maintenance mode
app.use(optionalAuth);
app.use(maintenanceMiddleware);

// Mount Routers
app.use("/api/auth", authRoute);
app.use("/api/book", listingRoute);
app.use("/api/requests", bookRequestRoute);
app.use("/api/conversations", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/platform-reviews", platformReviewRoute);
app.use("/api/reports", reportRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/saved-listings", savedListingRoute);
app.use("/api/feeds", feedRoute);
app.use("/api/admin", adminRoute);
app.use("/api/media", mediaRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/listings", listingsCheckoutRoute);
app.use("/api/seller", sellerRoute);
app.use("/api/seller/payout", payoutRoute);
app.use("/api/seller/withdrawals", withdrawalRoute);
app.get("/api/seller/transactions", authUser, getSellerTransactionsController);
app.use("/api/admin/withdrawals", adminWithdrawalRoute);

//sentry error handler
Sentry.setupExpressErrorHandler(app);


// Serve SPA index.html for any non-API GET requests (supporting client-side routing/refresh)
app.get("/*splat", (req, res, next) => {
  if (!req.originalUrl.startsWith("/api")) {
    return res.sendFile(path.join(import.meta.dirname, "public", "index.html"));
  }
  next();
});


// Catch-all route for unmatched paths (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred",
  });
});

export default app;