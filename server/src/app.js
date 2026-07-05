import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import envConfig from "./config/envConfig.js";

// Import routers
import { authRoute } from "./routes/auth.routes.js";
import { listingRoute } from "./routes/listing.routes.js";
import { bookRequestRoute } from "./routes/bookrequests.routes.js";
import { chatRoute } from "./routes/chats.routes.js";
import { messageRoute } from "./routes/messages.routes.js";
import { reviewRoute } from "./routes/reviews.routes.js";
import { reportRoute } from "./routes/reports.routes.js";
import { notificationRoute } from "./routes/notifications.routes.js";
import { savedListingRoute } from "./routes/savedlistings.routes.js";
import { feedRoute } from "./routes/feeds.routes.js";
import { adminRoute } from "./routes/admin.routes.js";
import { mediaRoute } from "./routes/media.routes.js";
import { paymentRoute } from "./routes/payments.routes.js";
import { listingsCheckoutRoute } from "./routes/listings.routes.js";
import { sellerRoute } from "./routes/seller.routes.js";
import { payoutRoute } from "./routes/payout.routes.js";
import { withdrawalRoute } from "./routes/withdrawal.routes.js";
import { adminWithdrawalRoute } from "./routes/adminWithdrawal.routes.js";
import { getSellerTransactionsController } from "./controllers/withdrawal.controller.js";
import { authUser } from "./middlewares/auth.middleware.js";


const app = express();

// Express CORS Configuration
app.use(
  cors({
    origin: envConfig.isAllowedClientOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Mount Routers
app.use("/api/auth", authRoute);
app.use("/api/book", listingRoute);
app.use("/api/requests", bookRequestRoute);
app.use("/api/conversations", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
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