# PustakMart Server Architecture & Engineering Guide

> **High-throughput, modular RESTful API & Real-Time WebSocket backend powering the PustakMart campus book exchange marketplace.**  
> Built with Node.js (ES Modules), Express.js (v5), MongoDB Atlas, Redis Cloud, Socket.io, and Sentry.

---

## Table of Contents

- [Overview & Architectural Philosophy](#-overview--architectural-philosophy)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Core Technology Stack](#-core-technology-stack)
- [Directory Structure](#-directory-structure)
- [Cross-Cutting Architectural Mechanisms](#-cross-cutting-architectural-mechanisms)
    - [1. Dual-Stage Redis Auth Guard & Salt Tuning](#1-dual-stage-redis-auth-guard--salt-tuning)
    - [2. Zero-Bottleneck Direct-to-Cloud Uploads](#2-zero-bottleneck-direct-to-cloud-uploads)
    - [3. Dynamic Fail-Open Maintenance Engine](#3-dynamic-fail-open-maintenance-engine)
    - [4. Double-Entry Seller Ledger & Platform Split](#4-double-entry-seller-ledger--platform-split)
    - [5. Resilient Cache & Connection Lifecycle](#5-resilient-cache--connection-lifecycle)
- [Modular Domain Architecture (`src/modules/`)](#-modular-domain-architecture-srcmodules)
    - [1. System Module (`/api/system`)](#1-system-module-apisystem)
    - [2. Auth Module (`/api/auth`)](#2-auth-module-apiauth)
    - [3. Listings Module (`/api/book`, `/api/saved-listings`)](#3-listings-module-apibook-apisaved-listings)
    - [4. Book Requests Module (`/api/requests`)](#4-book-requests-module-apirequests)
    - [5. Chat & Real-Time Module (`/api/conversations`, `/api/messages`)](#5-chat--real-time-module-apiconversations-apimessages)
    - [6. Feeds & Discovery Module (`/api/feeds`)](#6-feeds--discovery-module-apifeeds)
    - [7. Media Broker Module (`/api/media`)](#7-media-broker-module-apimedia)
    - [8. Notifications Module (`/api/notifications`)](#8-notifications-module-apinotifications)
    - [9. Payments & Checkout Module (`/api/payment`, `/api/listings`)](#9-payments--checkout-module-apipayment-apilistings)
    - [10. Reports & Moderation Module (`/api/reports`)](#10-reports--moderation-module-apireports)
    - [11. Reviews & Reputation Module (`/api/reviews`, `/api/platform-reviews`)](#11-reviews--reputation-module-apireviews-apiplatform-reviews)
    - [12. Seller Operations Module (`/api/seller`, `/api/seller/payout`, `/api/seller/withdrawals`)](#12-seller-operations-module-apiseller-apisellerpayout-apisellerwithdrawals)
    - [13. Admin Operations Module (`/api/admin`, `/api/admin/withdrawals`)](#13-admin-operations-module-apiadmin-apiadminwithdrawals)
- [Real-Time WebSocket Architecture](#-real-time-websocket-architecture)
- [Test-Driven Documentation (TDDoc) & QA](#-test-driven-documentation-tddoc--qa)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Setup & Running Locally](#-setup--running-locally)

---

## Overview & Architectural Philosophy

The backend of PustakMart is designed around four key tenets:

1. **Domain-Driven Modularity:** Instead of scattering controllers, validators, and route files across horizontal directories, every feature domain is encapsulated inside its own folder under `src/modules/<feature>/` containing dedicated controllers, routes, validators, and an export index.
2. **Stateless Scalability & In-Memory Efficiency:** Ephemeral state (unverified registration data, OTP rate limits, active token blacklists, and maintenance modes) is handled via Redis Cloud with strict TTLs, preserving MongoDB for confirmed, durable application models.
3. **Zero Buffer Memory Bloat:** Large binary payloads (book photos, verification documents) never stream through Node.js process memory. The backend acts solely as a cryptographic authentication broker, allowing clients to push media directly to CDN storage.
4. **Self-Documenting & Verified Delivery:** The backend uses a custom Test-Driven Documentation (TDDoc) framework. Integration tests run against live endpoints, assert business logic, update Markdown reference documentation in `docs/api-docs/`, and compile importable Postman collections automatically.

---

## System Architecture Diagram

```
                        +---------------------------------------+
                        |        React 19 SPA (Client)          |
                        +---------------------------------------+
                                  |                     ^
                     HTTP Requests|         WebSockets  | Real-time Events
                   (Cookies/JSON) |         (JWT Auth)  | (Chat, Typing, Alerts)
                                  v                     |
              +---------------------------------------------------+
              |              Express 5 Gateway / HTTP             |
              |---------------------------------------------------|
              |   Helmet Security Headers | CORS Origin Policy    |
              |   Cookie Parser | Morgan HTTP Logging | JSON Body |
              |   Optional Auth Middleware (req.user injection)   |
              |   Dynamic Maintenance Engine (Redis Fail-Open)    |
              +---------------------------------------------------+
                                  |
            +---------------------+---------------------+
            | Route Validators (express-validator)      |
            | Domain Controllers (src/modules/*)        |
            +---------------------+---------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  MongoDB Atlas (ODM)  |                   |   Redis Cloud Store   |
|-----------------------|                   |-----------------------|
|  - Users & Profiles   |                   |  - Registration Cache |
|  - Book Listings      |                   |  - OTP Rate Counters  |
|  - Orders & Payments  |                   |  - JWT Blacklist      |
|  - Chats & Messages   |                   |  - Maintenance Flags  |
|  - Reviews & Reports  |                   |  - Cache Invalidation |
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
            +---------------------+---------------------+
            | External Infrastructure & Cloud Services  |
            +-------------------------------------------+
            | • Razorpay API    : Orders & HMAC Verification
            | • ImageKit.io SDK : Direct-to-Cloud Auth Tokens
            | • Nodemailer/OAuth: Transactional Email OTPs
            | • Resend API      : Fallback Mail Delivery
            | • Sentry Node SDK : Telemetry & Unhandled Errors
```

---

## Core Technology Stack

| Layer                         | Technology                 | Role & Purpose                                                                                |
| :---------------------------- | :------------------------- | :-------------------------------------------------------------------------------------------- |
| **Runtime**                   | Node.js (v18+)             | Native ES Modules (`type: "module"`) asynchronous execution engine                            |
| **Framework**                 | Express.js (v5.x)          | HTTP application framework with native async route handling and modern middleware             |
| **Primary Datastore**         | MongoDB Atlas / Mongoose 9 | Document store for domain models, relational population, and schema validation                |
| **In-Memory Cache**           | Redis Cloud / `ioredis`    | Sub-millisecond store for OTP staging, rate limits, session blacklists, and maintenance state |
| **Real-Time Engine**          | Socket.io (v4.x)           | Bidirectional WebSocket communication for instant chats, typing indicators, and alerts        |
| **Payment Gateway**           | Razorpay Node SDK          | Escrow-like payment orders, webhook/client signature verification (HMAC-SHA256)               |
| **Media Pipeline**            | ImageKit.io SDK            | On-demand HMAC authentication token generator for direct client CDN asset delivery            |
| **Mailing Service**           | Nodemailer & Resend        | Dual transactional delivery using Google OAuth2 SMTP and fallback HTTP mail APIs              |
| **Telemetry & APM**           | Sentry Node SDK            | Automatic error capturing, context breadcrumbs, and request lifecycle monitoring              |
| **Validation & Sanitization** | `express-validator`        | Declarative, schema-level request validation and parameter sanitization                       |
| **Testing Harness**           | Jest & Supertest           | Sequential E2E API integration test runner, doc recorder, and Postman exporter                |

---

## Directory Structure

The server codebase follows a modular layout:

```text
server/
├── scripts/
│   └── generate-postman.js       # Automatically builds Postman v2.1.0 collection from test runs
├── src/
│   ├── app.js                    # Express application entrypoint, middleware chain & route mountings
│   ├── config/
│   │   ├── cache.js              # Redis connection client with exponential backoff retry policy
│   │   ├── db.js                 # MongoDB Mongoose connection manager with reconnection hooks
│   │   └── env.config.js         # Environment variable validation & centralized runtime config
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification, cookie parsing, role-based guards (isAdmin)
│   │   ├── maintenance.middleware.js # Redis-backed maintenance interrupter (fails open)
│   │   └── security.middleware.js# Headers, rate limiting, and origin defense
│   ├── models/                   # Centralized Mongoose database schemas
│   │   ├── blacklist.model.js    # Revoked JWT tokens
│   │   ├── bookRequest.model.js  # Demand-side student book requests
│   │   ├── conversation.model.js # Real-time chat threads between buyers and sellers
│   │   ├── coupon.model.js       # In-chat dynamic seller discount coupons
│   │   ├── listing.model.js      # Campus book & semester pack listings
│   │   ├── message.model.js      # Chat messages and system notifications
│   │   ├── notification.model.js # User activity notifications
│   │   ├── payment.model.js      # Ledger of payment orders and transaction states
│   │   ├── platformReview.model.js # General campus marketplace feedback
│   │   ├── report.model.js       # Moderation flags against listings or users
│   │   ├── review.model.js       # Post-transaction seller reviews
│   │   ├── savedlisting.model.js # User-bookmarked listings
│   │   ├── sellerPayout.model.js # UPI and Bank Account payout configurations
│   │   ├── user.model.js         # User identities, student verification status, and ratings
│   │   └── withdrawal.model.js   # Seller balance withdrawal requests and audit history
│   ├── modules/                  # Encapsulated Domain Feature Modules
│   │   ├── admin/                # Identity audit queues, reports HUD, withdrawal resolutions
│   │   ├── auth/                 # Multi-step OTP registration, login, logout, password resets
│   │   ├── book-requests/        # Open campus textbook demand-side feed
│   │   ├── chat/                 # Conversations, messaging, in-chat dynamic coupons
│   │   ├── feeds/                # Proximity-ranked feeds (college, branch, semester)
│   │   ├── listings/             # Book catalog CRUD, search, bookmarks
│   │   ├── media/                # ImageKit upload signature authentication broker
│   │   ├── notifications/        # In-app alerts, read status, and real-time dispatches
│   │   ├── payments/             # Razorpay order generation & HMAC-SHA256 verification
│   │   ├── reports/              # Abuse reporting and audit trail
│   │   ├── reviews/              # Rating stars, post-purchase feedback, dynamic score recalculation
│   │   ├── seller/               # Seller dashboards, earnings ledger, payout profiles, withdrawals
│   │   └── system/               # System health checks and maintenance status
│   ├── public/                   # Static landing files and SPA build hosting
│   ├── services/                 # Reusable domain services & third-party integrations
│   │   ├── coupon/               # Coupon calculation and redemption logic
│   │   ├── email/                # Nodemailer OAuth2 and Resend delivery brokers
│   │   ├── payment/              # Razorpay SDK wrappers and fee/commission computation
│   │   ├── imagekit.service.js   # Direct client upload signature generator
│   │   ├── maintenance.service.js# Redis maintenance mode getters and setters
│   │   ├── notification.service.js# Multi-channel notification dispatcher
│   │   ├── payout.service.js     # Payout validation and snapshotting
│   │   └── withdrawal.service.js # Withdrawal processing logic
│   ├── shared/                   # Shared templates, utils, and cross-cutting validators
│   ├── sockets/
│   │   └── server.socket.js      # Socket.io lifecycle, connection authentication & room routing
│   └── tests/                    # Automated E2E test suites and documentation harnesses
│       ├── helpers/              # Supertest wrappers, auth helpers, Markdown doc loggers
│       ├── modules/              # 14 Sequential test suites mirroring domain modules
│       ├── setup.js              # Database initialization and teardown hooks
│       └── testSequencer.js      # Deterministic numeric test sequencer
├── jest.config.js                # ESM Jest configuration with test sequencer bindings
├── server.js                     # HTTP server startup, DB connections, and Socket.io binding
└── package.json
```

---

## Cross-Cutting Architectural Mechanisms

### 1. Dual-Stage Redis Auth Guard & Salt Tuning

Traditional registration flows write unverified rows into the primary database, leading to orphan records, dead email clutter, and registration spam. PustakMart prevents this using a Redis-staged commitment model:

```
[Client Signup]
       │
       ▼
[Validate Inputs] ──(Valid)──► [Check Rate Limits in Redis]
                                 ├── Exceeded (>5/hr or cooldown <2m) ➔ Reject 429
                                 └── Clear ➔
                                       ├── Serialize payload in Redis: `register-data:<email>` (5m TTL)
                                       ├── Increment attempt counter : `attempts:register:<email>` (max 3)
                                       ├── Dispatch 6-digit OTP via Nodemailer / Resend
                                       └── Return success response (MongoDB untouched)

[Client Enters OTP]
       │
       ▼
[Verify OTP] ──(Valid)──► Commit stored JSON from Redis directly to MongoDB
                        ├── Clear Redis keys
                        └── Issue signed HttpOnly JWT Cookie
```

- **Bcrypt Salt Tuning:** Bcrypt hashing is tuned to **7 rounds**. This balances cryptographic safety with throughput, reducing CPU hashing time from ~80ms down to ~10ms per request. This prevents CPU starvation under traffic spikes while still maintaining strong password security.

### 2. Zero-Bottleneck Direct-to-Cloud Uploads

Node.js is single-threaded. Streaming multi-megabyte book images and student ID verification documents directly through Express causes memory spikes, socket timeouts, and blocks the event loop.

PustakMart decouples file streaming via ImageKit direct uploads:

```
1. Client requests upload signature:
   POST /api/media/auth ────────► Express Server (generates HMAC token, signature & expire time)
                                           │
2. Client uploads file directly:           ▼
   POST https://upload.imagekit.io ◄────── Returns signature parameters
   [Binary Payload]
        │
        ▼ (Direct upload to ImageKit CDN)
   ImageKit returns CDN URL (`https://ik.imagekit.io/...`)
        │
3. Client attaches URL to resource:
   POST /api/book/create ──────► Express Server (stores only string URL in MongoDB)
```

### 3. Dynamic Fail-Open Maintenance Engine

Platform administrators can toggle site-wide maintenance without redeploying code or reconfiguring cloud load balancers.

- **State Storage:** Maintained inside Redis as a serialized hash (`system:maintenance`) containing `enabled`, `message`, and `startedAt`.
- **Interception Pipeline:** `maintenanceMiddleware` sits ahead of application routes. When enabled, all non-admin requests receive a `503 Service Unavailable` with maintenance metadata.
- **Fail-Open Reliability:** If the Redis cluster encounters a transient network partition or downtime, the middleware catches the exception, logs to Sentry, and **fails open** (`next()`), ensuring public traffic is never accidentally locked out by a cache failure.
- **Admin & Auth Bypass:** Routes like `/api/system/maintenance`, `/api/auth/login`, and all `/api/admin/*` endpoints remain accessible so administrators can log in, troubleshoot, and restore normal operations.

### 4. Double-Entry Seller Ledger & Platform Split

Every transaction processed through the `/api/payment/verify` pipeline executes a clear financial split:

- **Gross Amount:** Book sale price (including any dynamic seller coupon applied).
- **Marketplace Commission:** 10% platform service fee.
- **Fixed Platform Fee:** ₹5 transaction processing charge.
- **Seller Credit:** 90% of listing price minus fixed fee is credited to `user.sellerBalance`.
- **Withdrawal Safeguard:** Sellers must accumulate a minimum threshold of ₹300 before requesting a payout. When a withdrawal is initiated, a static snapshot of their payment profile (`payoutDetailsSnapshot`) is stored alongside the request, preventing race conditions or fraudulent payout modifications while the admin audit is active.

### 5. Resilient Cache & Connection Lifecycle

Redis connections (`src/config/cache.js`) use `ioredis` with an exponential backoff retry policy:

- Reconnection attempts delay exponentially up to a hard ceiling of 3000ms.
- `maxRetriesPerRequest: null` ensures queued commands wait through brief network blips rather than immediately crashing active HTTP requests.
- MongoDB connections (`src/config/db.js`) configure connection pool sizing, index buffering, and listeners for disconnect events.

---

## Modular Domain Architecture (`src/modules/`)

Every feature module lives under `src/modules/<feature>/` and typically exposes:

- `controllers/`: Request orchestration, parameter parsing, service calls, and response serialization.
- `routes/`: Express router declarations, middleware bindings, and HTTP method mappings.
- `validators/`: `express-validator` chains validating headers, query params, and request payloads.
- `index.js`: Barrel export file surfacing routes and controllers to `app.js`.

### 1. System Module (`/api/system`)

- **Responsibility:** Public infrastructure status, maintenance mode polling, and service health checks.
- **Key Endpoints:**
    - `GET /health` - Root health endpoint (returns status `ok` and active maintenance boolean).
    - `GET /api/system/maintenance` - Public maintenance check consumed by frontend during initial app boot.

### 2. Auth Module (`/api/auth`)

- **Responsibility:** Secure user registration, authentication, token issuance, and self-service account recovery.
- **Key Models:** `user.model.js`, `blacklist.model.js`
- **Key Endpoints:**
    - `POST /register/send-otp` - Validates registration parameters, ensures email uniqueness, enforces Redis rate limits, and sends OTP.
    - `POST /register/verify-otp` - Validates OTP against Redis, saves user to MongoDB, sets secure HttpOnly JWT cookie.
    - `POST /login` - Authenticates user credentials, inspects account status (blocking/suspension), sets cookie.
    - `POST /logout` - Clears cookie, records JWT signature in `Blacklist` collection until token expiration.
    - `POST /forgot-password/send-otp` & `verify-otp` - Handles password recovery flow with temporary reset tokens.
    - `POST /reset-password` - Resets password with valid session tokens.
    - `GET /me` - Returns logged-in user profile, role, seller balance, and verification states.

### 3. Listings Module (`/api/book`, `/api/saved-listings`)

- **Responsibility:** Publishing textbooks and bundles, campus catalog browsing, condition scoring, and bookmarks.
- **Key Models:** `listing.model.js`, `savedlisting.model.js`
- **Key Endpoints:**
    - `POST /api/book/create` - Creates a book or semester bundle listing (title, author, condition, price, images, college, branch, semester).
    - `GET /api/book` - Queries listings with multi-parameter filtering (college, branch, semester, condition, search query).
    - `GET /api/book/:id` - Returns book details and conditionally increments view count for unique non-owner visitors.
    - `PATCH /api/book/:id/sold` - Marks listing as sold and updates seller transaction metrics.
    - `DELETE /api/book/:id` - Soft-deletes listing (sets status to `removed`).
    - `POST /api/saved-listings/:id` - Toggles saving/bookmarking a book for quick buyer reference.
    - `GET /api/saved-listings` - Retrieves authenticated student's saved wishlist.

### 4. Book Requests Module (`/api/requests`)

- **Responsibility:** Reverse-marketplace demand feed allowing students to request books not yet listed.
- **Key Models:** `bookRequest.model.js`
- **Key Endpoints:**
    - `POST /api/requests` - Posts an open study material request (book title, department, target semester, budget).
    - `GET /api/requests` - Lists active student requests across campuses with filtering.
    - `DELETE /api/requests/:id` - Allows buyers to close or remove fulfilled requests.

### 5. Chat & Real-Time Module (`/api/conversations`, `/api/messages`)

- **Responsibility:** Real-time buyer-seller negotiation channels, conversational coupon distribution, and read receipts.
- **Key Models:** `conversation.model.js`, `message.model.js`, `coupon.model.js`
- **Key Endpoints:**
    - `POST /api/conversations` - Initiates or fetches an existing chat channel attached to a specific book listing.
    - `GET /api/conversations` - Retrieves user's active conversations with unread counts and last message previews.
    - `POST /api/messages` - Sends a text message, saves to database, and triggers real-time Socket.io push.
    - `POST /api/conversations/:id/coupon` - Allows sellers to generate a custom discount coupon directly within the chat. Injects a system message and updates checkout price options in real time.

### 6. Feeds & Discovery Module (`/api/feeds`)

- **Responsibility:** Campus-aware discovery feeds, semester recommendations, and related academic packs.
- **Key Endpoints:**
    - `GET /api/feeds/campus` - Surfaces listings matching the user's registered college and department first.
    - `GET /api/feeds/trending` - Highlights popular listings with highest view velocities and buyer bookmarks.

### 7. Media Broker Module (`/api/media`)

- **Responsibility:** Secure token broker generating transient HMAC signatures for ImageKit.io.
- **Key Endpoints:**
    - `GET /api/media/auth` - Generates short-lived token, expire timestamp, and cryptographic signature for direct client uploads.

### 8. Notifications Module (`/api/notifications`)

- **Responsibility:** In-app notification center for chat alerts, order updates, verification reviews, and administrative notices.
- **Key Models:** `notification.model.js`
- **Key Endpoints:**
    - `GET /api/notifications` - Fetches user notification stream with pagination.
    - `PATCH /api/notifications/:id/read` - Marks single notification as read.
    - `PATCH /api/notifications/read-all` - Clears unread notification counters across the profile.

### 9. Payments & Checkout Module (`/api/payment`, `/api/listings`)

- **Responsibility:** Razorpay order creation, dynamic coupon redemption, cryptographic signature verification, and listing state transitions.
- **Key Models:** `payment.model.js`, `listing.model.js`
- **Key Endpoints:**
    - `POST /api/payment/create-order` - Validates listing availability, deactivates older duplicate pending orders, computes coupon discounts, and generates Razorpay Order ID.
    - `POST /api/payment/verify` - Validates Razorpay `razorpay_signature` using HMAC-SHA256 (`crypto`). Transitions listing to `reserved`, allocates seller balances, and notifies chat participants.

### 10. Reports & Moderation Module (`/api/reports`)

- **Responsibility:** User reporting framework to flag inappropriate listings, copyright violations, or suspicious behavior.
- **Key Models:** `report.model.js`
- **Key Endpoints:**
    - `POST /api/reports` - Submits an infraction report with categorical reason, details, and listing reference.

### 11. Reviews & Reputation Module (`/api/reviews`, `/api/platform-reviews`)

- **Responsibility:** Post-transaction peer reviews and overall platform feedback.
- **Key Models:** `review.model.js`, `platformReview.model.js`
- **Key Endpoints:**
    - `POST /api/reviews` - Submits a 1-to-5 star rating and review for a completed transaction. A post-save Mongoose hook automatically recalculates the seller's `averageRating` and `totalReviews`.
    - `POST /api/platform-reviews` - Submits public testimonials and platform suggestions.

### 12. Seller Operations Module (`/api/seller`, `/api/seller/payout`, `/api/seller/withdrawals`)

- **Responsibility:** Seller workspace, financial summaries, payout preferences, and withdrawal lifecycle.
- **Key Models:** `sellerPayout.model.js`, `withdrawal.model.js`
- **Key Endpoints:**
    - `GET /api/seller/dashboard` - Fetches aggregate statistics: active listings, books sold, gross volume, net balance.
    - `POST /api/seller/payout` - Configures or updates seller payout destination (UPI ID or Bank IFSC/Account).
    - `POST /api/seller/withdrawals` - Initiates a withdrawal request (enforces ₹300 minimum threshold, freezes balance snapshot).
    - `GET /api/seller/transactions` - Returns unified ledger statements of all sales credits and payout debits.

### 13. Admin Operations Module (`/api/admin`, `/api/admin/withdrawals`)

- **Responsibility:** Campus platform administration, student ID verification audits, moderation queues, and payout approvals.
- **Key Endpoints:**
    - `GET /api/admin/dashboard` - Global platform health metrics (total users, verified sellers, active listings, gross sales).
    - `GET /api/admin/verifications` - Audits queue of pending student ID submissions (college ID image/PDF preview).
    - `PATCH /api/admin/verifications/:id` - Approves or rejects student verification with structured feedback remarks.
    - `GET /api/admin/withdrawals` & `PATCH /api/admin/withdrawals/:id` - Manages seller withdrawal requests through status transitions (`approved`, `processing`, `completed`, `rejected`).
    - `POST /api/admin/maintenance` - Enables or disables site-wide maintenance mode in Redis.

---

## Real-Time WebSocket Architecture

Real-time interactions are powered by `src/sockets/server.socket.js` using Socket.io:

```
               [Client Socket Connection Request]
                              │
                              ▼
        [Handshake Auth: Parse Cookies / Bearer / Auth Token]
                              │
               ┌──────────────┴──────────────┐
           (Invalid)                     (Valid)
               ▼                             ▼
        [Reject Connection]         [Lookup User in MongoDB]
                                             │
                                ┌────────────┴────────────┐
                            (Blocked)                  (Active)
                                ▼                         ▼
                        [Refuse Access]          [Register in onlineUsers Map]
                                                 [Join Room: `user:${userId}`]
```

### Supported Socket Events:

- **`join_conversation` / `leave_conversation`:** Rooms scoped to conversation IDs (`conversation:${id}`) so participants receive messages instantly without broadcasting to unintended users.
- **`send_message`:** Emits messages, validates participant membership, and pushes delivery acknowledgements.
- **`typing_start` / `typing_stop`:** Lightweight ephemeral typing indicators broadcast to room peers.
- **`message_read`:** Updates message read status and broadcasts receipt timestamps.
- **`new_notification`:** Server-pushed direct alerts targeting personal user rooms (`user:${userId}`).

---

## Test-Driven Documentation (TDDoc) & QA

PustakMart uses an automated **Test-Driven Documentation (TDDoc)** pipeline built with Jest, Supertest, and a custom sequential test harness.

```
       [npm run test:api:docs]
                  │
                  ▼
   [Jest Numeric Test Sequencer] ────► Runs 14 E2E Test Suites sequentially:
                                        01_system ➔ 02_auth ➔ ... ➔ 14_admin
                  │
                  ▼
   [Live Supertest HTTP Calls] ──────► Executes against live local MongoDB & Redis
                  │
                  ▼
   [Interceptor: md-logger.js] ──────► Records live payloads, status codes, query parameters,
                                        and real JSON response examples
                  │
                  ▼
   [docs/api-docs/*.md] ─────────────► Outputs 14 human-readable Markdown docs
                  │
                  ▼
   [scripts/generate-postman.js] ────► Automatically updates Postman Collection (v2.1.0)
                                        with saved mock examples for rapid team onboarding
```

### Available Test & Quality Commands:

```bash
# Run full Jest test suite
npm run test

# Run tests and update Markdown docs + Postman Collection
npm run test:api:docs

# Manually regenerate Postman collection without re-running tests
npm run generate:postman
```

### Artillery High-Concurrency Load Tests:

Located under `tests/`, Artillery test configurations simulate concurrent user spikes:

```bash
# Load test user authentication & login throughput
npx artillery run tests/login-load-test.yml

# Load test homepage feeds and campus catalog discovery
npx artillery run tests/homepage-load-test.yml
```

---

## Environment Variables Configuration

Create a `.env` file in the `server/` directory:

```env
# ─── Core Server Configuration ───
PORT=3000
NODE_ENV=development
CLIENT_ORIGINS=http://localhost:5173,http://localhost:3000
ALLOWED_CLIENT_ORIGIN=http://localhost:5173

# ─── Primary Database (MongoDB) ───
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pustakmart?retryWrites=true&w=majority

# ─── Cache & Session Store (Redis) ───
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_any

# ─── Cryptography & Security ───
JWT_SECRET_KEY=your_super_secret_jwt_key_here

# ─── Email Dispatcher (Google OAuth2 & Nodemailer) ───
CLIENT_ID=your_google_oauth2_client_id.apps.googleusercontent.com
CLIENT_SECRET=your_google_oauth2_client_secret
REFRESH_TOKEN=your_google_oauth2_refresh_token
EMAIL_USER=your_verified_gmail_sender@gmail.com

# ─── Email Fallback Delivery (Resend API) ───
RESEND_API_KEY=re_your_resend_api_key_here

# ─── Media Pipeline (ImageKit.io) ───
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint

# ─── Payment Gateway (Razorpay) ───
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# ─── Error Tracking & Telemetry (Sentry) ───
SENTRY_DSN=https://your_sentry_key@o000000.ingest.sentry.io/0000000
```

---

## Setup & Running Locally

### Prerequisites

- **Node.js** v18.0.0 or higher
- **MongoDB** instance (local daemon or Atlas cluster)
- **Redis** instance (local daemon or Redis Cloud)

### Installation Steps

1. Navigate to the server folder:

    ```bash
    cd server
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Configure environment variables:

    ```bash
    cp .env.example .env   # Or create .env manually using the guide above
    ```

4. Start development server with automatic file reload:

    ```bash
    npm run dev
    ```

5. Start production server (with Sentry instrumentation):
    ```bash
    npm run start
    ```

The server will initialize database connections, bind Socket.io, and start listening on the configured `PORT` (default: `3000`).

---

<div align="center">
  <sub>PustakMart Server Architecture • Maintained by <a href="https://www.yadavaman.tech">Aman Yadav</a></sub>
</div>
