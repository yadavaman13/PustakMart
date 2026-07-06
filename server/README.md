# PustakMart Server Backend

The PustakMart backend is a high-performance RESTful API and real-time WebSocket server built with Node.js, Express.js, MongoDB/Mongoose, Redis, and Socket.io. It handles campus-first discovery, transaction workflows, conversational negotiations, and secure payments.

---

## 🛠️ Core Tech Stack & Libraries

* **Server Runtime:** Node.js (ES Modules syntax)
* **API Framework:** Express.js (v5)
* **Real-time WebSockets:** Socket.io
* **Databases:** MongoDB Atlas (Mongoose ODM) & Redis Cloud (`ioredis` for session caching and rate-limiting)
* **Payment Integration:** Razorpay Node SDK
* **Media Broker:** ImageKit.io Node SDK (direct client upload auth broker)
* **Notification Agent:** Nodemailer with OAuth2 (secure Google credentials for transactional emails)
* **Security Middleware:** Helmet (headers security), CORS, and Express-Rate-Limit
* **Security Hashing:** Bcrypt (tuned to **7 rounds** to optimize login throughput while keeping verification under ~10ms)
* **Input Validation:** Express-Validator

---

## 🗂️ Architectural Pattern

The server adheres to a clean controller-route-model design pattern. To make onboarding and evaluation easy, the backend logic is split into 10 logical feature domains detailed below.

---

## 🧱 Feature-by-Feature Breakdown

### 1. Authentication & Security Guard
Manages register verification, login flows, session security, and account recovery. It uses Redis to serialize unverified payloads and block spam.

* **Routes:** [`auth.routes.js`](./src/routes/auth.routes.js)
* **Controllers:** [`auth.controller.js`](./src/controllers/auth.controller.js)
* **Mongoose Models:**
  - [`user.model.js`](./src/models/user.model.js) (Profile data, roles, verification states, blocks/suspensions)
  - [`blacklist.model.js`](./src/models/blacklist.model.js) (Stores logged-out JWT tokens to prevent reuse)
* **Under-the-Hood Logic:**
  - **OTP Rate Limiting:** Redis tracks request frequencies (`otp-send-count:${email}`). Users are limited to 5 OTP requests per hour and enforced a 2-minute cooldown.
  - **Unverified Signup Cache:** Registration parameters are serialized and cached in Redis (`register-data:${email}`) with a 5-minute TTL. MongoDB is only populated upon successful verification.
  - **Brute-Force Protection:** Verification attempts are limited to 3 (`attempts:register:${email}`). Exceeding this destroys the Redis registration session.
  - **JWT Authorization:** Employs [`auth.middleware.js`](./src/middlewares/auth.middleware.js) to inspect secure cookies for valid JWT sign-offs.

---

### 2. Book Catalog & Listings
Handles listings creation, catalog queries, details retrieval, and view counting.

* **Routes:** [`listings.routes.js`](./src/routes/listings.routes.js) and [`listing.routes.js`](./src/routes/listing.routes.js)
* **Controllers:** [`listings.controller.js`](./src/controllers/listings.controller.js) and [`feeds.controller.js`](./src/controllers/feeds.controller.js)
* **Mongoose Models:**
  - [`listing.model.js`](./src/models/listing.model.js) (Title, author, price, condition rating, images, college, branch, semester, views count, transaction status)
* **Under-the-Hood Logic:**
  - **Local-First Search:** Search queries prioritize books matching the logged-in student's college, bringing nearby books to the top of their feeds.
  - **Standalone & Semester Bundles:** Supports publishing individual items or complete semester packs.
  - **Unique Views Counter:** The `GET /:id` detail endpoint checks visitor identities; it increments the listing's view counter only if the viewer is not the listing owner or a guest.

---

### 3. Open Book Requests
Enables students to post demand-side requests if a book is not currently listed.

* **Routes:** [`bookrequests.routes.js`](./src/routes/bookrequests.routes.js)
* **Controllers:** [`bookrequests.controller.js`](./src/controllers/bookrequests.controller.js)
* **Mongoose Models:**
  - [`bookrequest.model.js`](./src/models/bookrequest.model.js) (Target book, branch, semester, budget, and requesting student)
* **Under-the-Hood Logic:**
  - Sellers browse the campus requests feed to identify matches and directly message students requesting those titles.

---

### 4. Chat & Real-Time Negotiation
Powers real-time conversations, typing indicators, read receipts, and inside-chat seller discounts.

* **Routes:** [`chats.routes.js`](./src/routes/chats.routes.js) and [`messages.routes.js`](./src/routes/messages.routes.js)
* **Controllers:** [`chats.controller.js`](./src/controllers/chats.controller.js)
* **Mongoose Models:**
  - [`conversation.model.js`](./src/models/conversation.model.js) (Participants array, reference listing, and last message previews)
  - [`message.model.js`](./src/models/message.model.js) (Sender, content, type, conversation link, and timestamps)
  - [`coupon.model.js`](./src/models/coupon.model.js) (Discount structures created dynamically during chat negotiations)
* **Under-the-Hood Logic:**
  - **Conversational Coupons:** Sellers can issue dynamic coupons directly within the active chat. This appends a system notification to the conversation and updates pricing options in real time.
  - **Websocket Events:** Dispatches typing events, message notifications, and read receipts instantly via Socket.io.

---

### 5. Payments & Transaction Engine
Interfaces with Razorpay for secure checkout, platform commission processing, and listing reservation hooks.

* **Routes:** [`payments.routes.js`](./src/routes/payments.routes.js)
* **Controllers:** [`payments.controller.js`](./src/controllers/payments.controller.js)
* **Mongoose Models:**
  - [`payment.model.js`](./src/models/payment.model.js) (Razorpay transaction identifiers, payment ledger split, and status flags)
* **Under-the-Hood Logic:**
  - **Ledger Calculations:** Each payment calculates a 10% marketplace commission and a fixed ₹5 platform fee. The remaining 90% is credited to the seller's virtual balance.
  - **Duplicate Prevention:** Before creating a Razorpay order, the server deactivates older pending checkout attempts for the user/listing to prevent duplicate database rows.
  - **Verification:** Verifies signature headers using SHA-256 HMAC encryption. Upon confirmation, the transaction is marked as completed, the book listing is marked as `reserved`, and a system message is posted in the chat thread.

---

### 6. Payout Profiles & Withdrawals
Allows sellers to manage financial profiles and submit withdrawal requests for their accumulated balances.

* **Routes:** [`payout.routes.js`](./src/routes/payout.routes.js), [`withdrawal.routes.js`](./src/routes/withdrawal.routes.js), and [`adminWithdrawal.routes.js`](./src/routes/adminWithdrawal.routes.js)
* **Controllers:** [`payout.controller.js`](./src/controllers/payout.controller.js), [`withdrawal.controller.js`](./src/controllers/withdrawal.controller.js), and [`adminWithdrawal.controller.js`](./src/controllers/adminWithdrawal.controller.js)
* **Mongoose Models:**
  - [`sellerPayout.model.js`](./src/models/sellerPayout.model.js) (Seller-preferred payout method: UPI ID or Bank account details)
  - [`withdrawal.model.js`](./src/models/withdrawal.model.js) (Withdrawal request, status tracker, audit logs, and transaction references)
* **Under-the-Hood Logic:**
  - **Minimum Threshold:** Enforces a minimum withdrawal threshold of ₹300.
  - **Transaction Snapshot:** Saves a snapshot of payment parameters (`payoutDetailsSnapshot`) to protect transactions from profile updates during processing.
  - **Admin Workflow:** Requests follow a strict lifecycle controlled by the admin: `pending` ➔ `approved` ➔ `processing` ➔ `completed` (or `rejected`).
  - **Ledger Aggregation:** The endpoint `GET /api/seller/withdrawals/transactions` generates a combined statement of credits (sales) and debits (withdrawals) for the dashboard interface.

---

### 7. Bookmarks & Favorites
Enables students to flag listings of interest to track availability.

* **Routes:** [`savedlistings.routes.js`](./src/routes/savedlistings.routes.js)
* **Controllers:** [`savedlistings.controller.js`](./src/controllers/savedlistings.controller.js)
* **Mongoose Models:**
  - [`savedlisting.model.js`](./src/models/savedlisting.model.js) (Maps a student to their bookmarked listings)

---

### 8. Interactive Reviews
Calculates seller reputations using verified post-transaction feedback.

* **Routes:** [`reviews.routes.js`](./src/routes/reviews.routes.js)
* **Controllers:** [`reviews.controller.js`](./src/controllers/reviews.controller.js)
* **Mongoose Models:**
  - [`review.model.js`](./src/models/review.model.js) (Rating stars, comment text, transaction context, buyer, and seller)
* **Under-the-Hood Logic:**
  - **Auto-Aggregation:** Submitting a review triggers a post-save Mongoose middleware. This re-calculates the seller's `averageRating` and `totalReviews` fields on the [`user.model.js`](./src/models/user.model.js) schema automatically.

---

### 9. Media upload credentials
Brokers credentials for client uploads to prevent direct exposure of API private keys.

* **Routes:** [`media.routes.js`](./src/routes/media.routes.js)
* **Controllers:** [`media.controller.js`](./src/controllers/media.controller.js)
* **Under-the-Hood Logic:**
  - Generates transient signature headers, expiration keys, and tokens required by the ImageKit.io SDK for secure direct client uploads.

---

### 10. Platform Moderation & Analytics HUD
Provides administration utilities to audit profiles, resolve flags, and review platform metrics.

* **Routes:** [`admin.routes.js`](./src/routes/admin.routes.js)
* **Controllers:** [`admin.controller.js`](./src/controllers/admin.controller.js)
* **Mongoose Models:**
  - [`report.model.js`](./src/models/report.model.js) (Tracks flagged listings, infraction tags, and audit statuses)
* **Under-the-Hood Logic:**
  - **Application Auditing:** Admins review student applications, inspect uploaded PDF/image student credentials, and approve/reject profiles (attaching remarks that guide corrected submissions).

---

## 🔌 API Summary Table

| Method | Endpoint | Access | Middleware | Controller | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register/send-otp` | Public | Auth Validators | `sendRegistrationOTP` | Validates registration parameters and fires OTP |
| **POST** | `/api/auth/register/verify-otp`| Public | Validation Parser | `verifyRegistrationOTP` | Commits user profile to MongoDB and issues JWT |
| **POST** | `/api/auth/login` | Public | Credentials Checker| `loginController` | Verifies login credentials and sets cookie |
| **POST** | `/api/auth/logout` | Private | `authUser` | `logoutController` | Clears cookie and blacklists JWT token |
| **POST** | `/api/book/create` | Private | `authUser` | `createListingController`| Registers a new single book or semester bundle |
| **GET** | `/api/book` | Public | None | `getListingsController` | Queries listings prioritizing nearby campus |
| **GET** | `/api/book/:id` | Public | None | `getListingDetailController`| Fetches book details and increments views |
| **POST** | `/api/conversations` | Private | `authUser` | `createConversation` | Establishes a chat session for a listing |
| **POST** | `/api/conversations/:id/coupon`| Private | `authUser` | `createChatCoupon` | Generates a custom discount coupon in chat |
| **POST** | `/api/payment/create-order`| Private | `authUser` | `createPaymentOrder` | Generates Razorpay transaction keys |
| **POST** | `/api/payment/verify` | Private | `authUser` | `verifyPaymentOrder` | HMAC-SHA256 verification and transitions listing |
| **POST** | `/api/seller/withdrawals`| Private | `authUser` | `createWithdrawalRequest`| Submits a new payout withdrawal request |
| **GET** | `/api/admin/withdrawals` | Admin | `authUser`, `isAdmin`| `getAdminWithdrawals` | Lists withdrawal requests for administrative audit |

---

## 🏃‍♂️ Verification & Testing Runners

The server includes test runners inside the `/tests` directory to verify backend configurations:
* **Razorpay orders integration:** `node tests/test_payment.js`
* **OAuth2 Nodemailer emails:** `node tests/test_email.js`
* **Redis set/get caching operations:** `node tests/test_redis.js`
* **OTP verification state machine:** `node tests/test_otp_flow.js`