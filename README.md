<div align="center">

# PustakMart

### *Verified Student-to-Student Campus Book Exchange Marketplace*

[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

A trust-centric, peer-to-peer (P2P) academic marketplace designed for college campuses. It enables students to securely buy, sell, and request reference books, course notes, and study bundles directly within their university campus.

---

[**Why PustakMart**](#-why-pustakmart) • [**Key Features**](#-key-features) • [**Technical Architecture**](#-technical-architecture) • [**Engineering Highlights**](#-engineering-highlights) • [**Project Structure**](#-project-structure) • [**Getting Started**](#-getting-started)

</div>

---

## 💼 Why PustakMart?

Academic textbooks and study packages are expensive, and their utility is typically limited to a single semester. Once a course finishes, these materials sit idle while incoming juniors face high costs to buy them new. 

**PustakMart** bridges this gap by creating a localized, secure, and user-friendly digital marketplace where students can easily discover, trade, and request materials from senior peers on their own campus.

### 🌟 High-Impact Value Proposition
* **Zero Logistics Cost:** Transactions are executed face-to-face on campus, eliminating packaging overhead and shipping costs.
* **Verified Student Network:** Registration is restricted to students with verified emails and student IDs, building a high-trust network.
* **Syllabus-Aligned Search:** Structured search parameters filter listings by college, branch/department, and semester.
* **Demand-Driven System:** A request portal allows buyers to post syllabus needs, turning passive shopping into active seller matching.

---

## 🎯 Key Features

### 👤 Buyer Experience
* **Localized Search & Filters:** Browse listings filtered by College Name, Branch/Department, and Semester.
* **Open Book Requests:** Submit demand-side requests detailing syllabus needs and target budgets.
* **Favorites & Bookmarks:** Save listings to track availability.
* **Negotiation & Live Chat:** Initiate instant messages directly from listing pages to coordinate trades.
* **Integrated Payments:** Complete checkout via Razorpay with support for seller-issued coupons.
* **Feedback Loops:** Submit ratings and reviews to build verified seller reputations.

### 💼 Verified Seller Workspace
* **Analytics Dashboard:** Monitor active listings, total completed sales, aggregate views, and customer ratings.
* **Financial Insights:** Access dynamic month-over-month graphs charting gross sales, net earnings (after 10% commission processing), and transaction volumes.
* **Single & Semester Bundle Uploads:** Publish individual books or semester course packs with condition ratings and cover files.
* **Conversational Discounts:** Generate and send custom coupon codes directly inside active buyer chats, automatically posting system alerts.
* **Active Demand Matching:** Browse campus-wide buyer requests and contact students to complete trades.

### 👑 Admin Control Panel
* **Platform Health HUD:** Monitor registered students, verified sellers, active listings, and completed trades.
* **Identity Audit Queue:** Inspect student verification files (ID images/PDFs) and approve/reject applications with custom feedback.
* **Moderation HUD:** Handle flagged listings, resolve transaction disputes, and manage user access controls.

---

## 🛠️ Tech Stack

| Tier | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, React Router 6, Axios, Socket.io-client, Vanilla SCSS (CSS variables & micro-animations) |
| **Backend** | Node.js, Express 5, Socket.io, Mongoose, Express-Validator |
| **Databases** | MongoDB Atlas (Primary Datastore), Redis Cloud (Session cache, rate limiting, and OTP states) |
| **Integrations** | Razorpay Node SDK (Payments), ImageKit.io SDK (Media uploads), Nodemailer with Google OAuth2 (Secure transactional emails) |
| **Testing** | Artillery (Load testing & concurrency simulations), custom script suites |

---

## 🧱 Technical Architecture

PustakMart is built on a decoupled MERN architecture backed by Redis caching and real-time Socket.io channels:

```
       +------------------------------------------------------------+
       |                  Vite + React 19 Frontend                  |
       +------------------------------------------------------------+
                 | (Axios HTTP Requests)         | (Real-time Sockets)
                 v                               v
       +------------------------------------------------------------+
       |                  Express 5 Backend Server                  |
       +------------------------------------------------------------+
         |               |              |              |          |
         v               v              v              v          v
   +-----------+   +-----------+  +-----------+  +-----------+ +-----------+
   |  MongoDB  |   |   Redis   |  | ImageKit  |  | Razorpay  | | NodeMailer|
   | Database  |   | Cache HUD |  | SDK Auth  |  | Payments  | |  OAuth2   |
   +-----------+   +-----------+  +-----------+  +-----------+ +-----------+
```

---

## ⚙️ Engineering Highlights

### 1. Multi-Stage Registration & Recovery Flow (Redis Guard)
To prevent spam accounts and email abuse, registration and password resets are secured via a multi-tiered Redis caching layer:
* **Rate Limiter:** Redis monitors dispatch frequency (`otp-send-count:${email}`). Users are limited to 5 OTP requests per hour with a strict 2-minute cooldown between dispatches.
* **Payload Serialization:** Unverified user data is temporarily cached in Redis (`register-data:${email}`) with a 5-minute TTL to keep MongoDB free of unverified accounts.
* **Attempt Counter:** Redis limits verification attempts (`attempts:register:${email}`) to 3. Exceeding this limit destroys the registration session.
* **Transaction Commit:** Upon valid OTP verification, the payload is committed to MongoDB, and a secure HTTP-Only JWT is issued.

### 2. High-Performance Hashing (Bcrypt Tuning)
Password hashing uses Bcrypt optimized to **7 salt rounds**. This drops CPU verification latency from ~80ms to ~10ms, improving server login throughput and responsiveness under heavy load.

### 3. Zero-Bottleneck Upload Architecture (Direct-to-Cloud)
To prevent server memory bloat and API latency from file handling:
1. The client requests secure upload parameters (token, signature, expire timestamp) from the server.
2. The server generates these temporary parameters using the ImageKit.io SDK.
3. The client uploads files directly to ImageKit.io, keeping the server free of file handling.
4. The server stores only the returned public file URLs in MongoDB.

### 4. Resilient Redis Reconnection Strategy
The Redis client (`ioredis`) is configured with an exponential backoff retry strategy capped at 3 seconds:
* `maxRetriesPerRequest: null` allows the server to queue database commands during brief Redis connection drops instead of throwing errors.

---

## 📁 Project Structure

The project uses a clean modular structure separating frontend features and backend architectural layers:

```text
PustakMart/
├── client/                     # Vite + React Frontend Application
│   ├── src/
│   │   ├── app/                # Global router and base style sheets
│   │   ├── features/
│   │   │   ├── admin/          # Admin HUD components, hooks, services, and SCSS
│   │   │   ├── auth/           # Login, Register, OTP verification flow
│   │   │   ├── dashboard/      # User & Seller workspace features
│   │   │   ├── home/           # Landing portal, marketplace catalog, search
│   │   │   └── shared/         # Reusable layouts, validation schemas, context
│   │   └── main.jsx            # React mounting entry point
│   └── package.json
└── server/                     # Node.js + Express.js Backend Application
    ├── src/
    │   ├── config/             # DB setups, Redis connectivity, environment variables
    │   ├── controllers/        # Request handlers (Auth, Listings, Payments, Sockets)
    │   ├── middlewares/        # JWT validation, admin checks, request validation parsers
    │   ├── models/             # Mongoose schemas (Listings, Payments, Users, Withdrawals)
    │   ├── routes/             # Express routes
    │   ├── validators/         # Input validation rules (express-validator)
    │   └── services/           # Nodemailer OAuth2, Razorpay, and ImageKit setups
    ├── tests/                  # Integration and Artillery load test suites
    └── server.js               # Express app setup and server listener
```

---

## 🔌 API Summary

### 🔑 Authentication & Recovery (`/api/auth`)
* `POST /register/send-otp` - Validates registration data, checks rate limits, and sends a registration OTP.
* `POST /register/verify-otp` - Verifies the registration OTP, creates the user document in MongoDB, and issues a JWT token.
* `POST /login` - Validates credentials, checks account status, and sets a secure JWT cookie.
* `POST /logout` - Clears cookies and blacklists the active JWT token.
* `POST /forgot-password/send-otp` - Sends a recovery OTP if the email is registered.
* `POST /forgot-password/verify-otp` - Verifies the recovery OTP and returns a password reset session token.
* `POST /reset-password` - Resets the password using a valid reset session token.

### 📚 Listings & Catalog (`/api/book` & `/api/listings`)
* `POST /create` - Publishes a new single book or bundle listing.
* `GET /` - Queries active listings with local campus prioritizations.
* `GET /:id` - Fetches single book metadata and increments views.
* `DELETE /:id` - Soft-deletes a listing (sets status to `removed`).
* `PATCH /:id/sold` - Marks a book as sold and increments seller sales metrics.

### 💳 Payments & Transactions (`/api/payment` & `/api/payments`)
* `POST /create-order` - Generates a Razorpay order, applies coupons, and deactivates duplicate pending orders.
* `POST /verify` - Cryptographically verifies Razorpay payment signatures via HMAC-SHA256, completes payments, marks coupons as used, and reserves listings.

### 💬 Real-Time Chats (`/api/conversations`)
* `POST /` - Starts a chat session for a listing.
* `GET /` - Retrieves active chat channels with previews.
* `POST /message` - Sends messages, registers notifications, and triggers Socket.io broadcasts.
* `POST /:id/coupon` - Generates custom seller discount coupons inside chats.

---

## 🏁 Getting Started

### Prerequisites
* **Node.js** (v18.x or higher)
* **MongoDB** connection string (Atlas or Local)
* **Redis** server instance (Local or Cloud)
* **ImageKit.io** account API credentials
* **Razorpay** merchant keys
* **Gmail** SMTP OAuth2 credentials

### Quick Start Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yadavaman13/PustakMart.git
   cd PustakMart
   ```

2. Install and configure backend dependencies:
   ```bash
   cd server
   npm install
   # Create a .env file based on configurations section below
   npm run dev
   ```

3. Install and configure frontend dependencies:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## 📜 Development Scripts & Verification Tests

### Server Integration Tests (`/server`)
Verify API functionalities, payment pipelines, secure uploads, and caches:
```bash
# Verify Razorpay integration
node tests/test_payment.js

# Verify Gmail SMTP OAuth2 emails
node tests/test_email.js

# Verify Redis caching configurations
node tests/test_redis.js

# Run full OTP registration and recovery lifecycle tests
node tests/test_otp_flow.js
```

### High-Concurrency Concurrency Testing (Artillery)
Assess platform performance under heavy traffic loads:
```bash
# Run Login Page API Load Test
npx artillery run tests/login-load-test.yml

# Run Authenticated Homepage landing page flow Load Test
npx artillery run tests/homepage-load-test.yml
```
*Load test metrics and scaling analyses are located in [load_tests_analysis.md](./server/docs/load_tests_analysis.md).*

---

## 🤝 Contact & Portfolio

* **Developer:** [Aman Yadav](https://www.yadavaman.tech)
* **LinkedIn:** [Aman Yadav on LinkedIn](https://www.linkedin.com/in/gecdhd-comp-yadav-aman/)
* **Code Repository:** [PustakMart GitHub](https://github.com/yadavaman13/PustakMart)

<div align="center">
  Made with ❤️ by <a href="https://www.yadavaman.tech">Aman</a>
</div>