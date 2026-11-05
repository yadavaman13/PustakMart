<div align="center">

# PustakMart

### _A Verified Peer-to-Peer Academic Marketplace for University Campuses_

[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Sentry](https://img.shields.io/badge/Sentry-Telemetry-362D59?style=for-the-badge&logo=sentry&logoColor=white)](https://sentry.io/)

<p align="center">
  <b>PustakMart bridges the gap between graduating seniors and incoming juniors.</b><br />
  A localized, high-trust digital campus exchange enabling students to buy, sell, request, and negotiate textbooks, reference bundles, and course materials without shipping delays, courier charges, or retail markups.
</p>

---

[**Explore the Problem**](#-the-problem--our-vision) • [**Core Value Pillars**](#-core-value-pillars) • [**Product Feature Tour**](#-product-feature-tour) • [**User Journeys**](#-end-to-end-user-journeys) • [**System Architecture**](#-system-architecture) • [**Tech Stack**](#-technology-stack) • [**Engineering Highlights**](#-engineering-highlights) • [**Repository Structure**](#-repository-structure) • [**Getting Started**](#-getting-started) • [**Documentation**](#-documentation--testing)

---

</div>

## The Problem & Our Vision

Academic textbooks, lab manuals, and exam reference books are notoriously expensive. Yet their utility for any single student is strictly temporary, lasting barely four to five months across a semester. Once finals are over, thousands of rupees worth of study resources sit idle on dorm shelves gathering dust.

Meanwhile, incoming juniors in the adjacent hostel or classroom enter the semester forced to purchase those exact same books brand-new at full retail price.

Generic secondhand classifieds (such as OLX or Facebook Marketplace) fail university students for several reasons:

- **No Academic Context:** You cannot filter by university syllabus, specific branch (e.g., Computer Engineering), or semester.
- **High Shipping & Packaging Friction:** Courier costs often exceed the book's value, and delivery takes days when a student needs the book for classes tomorrow.
- **Trust & Safety Deficits:** Transactions take place with anonymous strangers off-campus without verified student accountability.

**PustakMart transforms campus academia into a circular economy.** By locking discovery to university communities and verifying student credentials, PustakMart empowers peers to discover, negotiate, and exchange books directly between classes, at the campus cafeteria, or in the library.

---

## Core Value Pillars

```
       Zero Logistics Cost                Verified Student Network               Syllabus-Aligned Filter
  Hand off books on campus without     Sign up with college emails & verify     Browse by College, Department,
     courier fees or packaging           student IDs for trusted exchanges         and Semester directly
                 │                                      │                                    │
                 └──────────────────────────────┬────────────────────────────────────────────┘
                                                │
                                                ▼
                                    Two-Way Demand Marketplace
                            List items for sale OR post open book requests
                              to let senior sellers come directly to you
```

- **Zero Delivery Cost & Zero Wait Time:** Trades happen face-to-face inside university premises. Students inspect the book's physical condition on the spot before finalizing.
- **Campus Verified Network:** Students can submit their College ID card for administrative verification. Verified badges foster trust and deter bad actors.
- **Syllabus-Aligned Precision:** Smart categorization allows students to drill down by **College ➔ Branch/Department ➔ Semester**, pinpointing required reading instantly.
- **Demand-Driven Reverse Marketplace:** Can't find a niche elective reference guide? Post an **Open Book Request** stating your target budget, and senior peers on campus can reach out with offers.
- **Conversational Commerce:** Live in-chat negotiations give sellers the power to issue dynamic, custom-tailored coupon discounts directly inside active chat threads.

---

## Product Feature Tour

### 1. Buyer Experience

- **Localized Campus Discovery:** The catalog automatically prioritizes listings from your own college, with instant filters for department, semester, condition grading (Like New, Good, Fair), and price range.
- **Demand-Side Requests:** Post study material requests detailing subject name, semester, and target budget so senior students can match with you.
- **Real-Time Negotiation Chat:** Start instant conversations with sellers directly from any book's detail page with typing indicators, delivery timestamps, and read receipts.
- **Conversational Discounts:** Claim dynamic discount coupons issued directly by sellers inside the chat and apply them at checkout.
- **Seamless Checkout:** Complete orders securely via Razorpay with support for cards, UPI, net banking, and platform coupon deductions.
- **Saved Wishlist & Bookmarks:** Bookmark listings of interest to track price changes or availability before exam season.
- **Verified Reviews & Ratings:** Leave post-purchase ratings and written feedback to highlight helpful sellers across campus.

### 2. Verified Seller Workspace

- **Flexible Listing Engine:** List individual textbooks or bundle entire semester study packs with custom photos, condition ratings, and syllabus descriptions.
- **Direct-to-Cloud Uploads:** Upload high-resolution book cover photos and syllabus notes directly to CDN storage with zero server lag.
- **Seller Analytics & Insights:** Dynamic dashboard tracking active inventory, sold counts, total views, customer ratings, gross revenue, and net earnings.
- **Conversational Coupon Generator:** Negotiate with buyers in real time and issue single-use custom coupon codes right inside the chat window.
- **Reverse Demand Matching:** Browse campus-wide student book requests and message buyers directly to fulfill their academic needs.
- **Payout Profiles & Withdrawals:** Configure payout methods (UPI ID or Bank IFSC/Account) and submit withdrawal requests with a clear, transparent status tracker (`pending` ➔ `approved` ➔ `completed`).
- **Unified Transaction Ledger:** Comprehensive accounting statement recording sales credits, 10% platform fees, and withdrawal debits.

### 3. Admin Control Panel

- **Platform Health HUD:** High-level metrics tracking total registered students, verified sellers, active listings, transaction volume, and platform revenue.
- **Identity Verification Audit Queue:** Review uploaded student ID credentials (images/PDFs) with full-screen inspection tools and approve or reject applications with structured feedback notes.
- **Community Moderation:** Review user-flagged listings or suspicious accounts, resolve disputes, and maintain campus marketplace safety.
- **Withdrawal Processing Hub:** Audit seller payout requests against transaction snapshots, confirm bank/UPI transfers, and update payout states.
- **Dynamic Maintenance Mode:** Toggle platform-wide maintenance mode on the fly with custom advisory notices without redeploying code.

---

## End-to-End User Journeys

### The Buy & Handshake Journey

```
1. Discover Book        2. Live Chat            3. Dynamic Coupon       4. Checkout & Escrow    5. Campus Handoff
Filter by college,  ──► Chat with senior    ──► Seller offers a     ──► Pay securely via    ──► Meet in library
branch & semester       seller to negotiate     custom discount         Razorpay; listing       or cafeteria;
to find textbook        condition & meeting     code inside chat        is marked reserved      inspect and collect
```

### The Seller & Payout Journey

```
1. Snap & Publish       2. Direct Cloud CDN     3. Real-Time Chat       4. Sale Completed       5. Payout Withdrawal
Upload cover photo  ──► Direct upload to    ──► Answer buyer buyer  ──► Listing marked      ──► Request payout to
and set semester,       ImageKit CDN with       questions; issue        as sold; 90% balance    UPI or Bank; admin
condition & price       zero server lag         in-chat coupon          credited to wallet      processes in audit HUD
```

### The Reverse Request Journey

```
1. Post Request         2. Campus Broadcast     3. Senior Match         4. Instant Chat         5. Trade Finalized
Junior posts: "Need ──► Listing appears in  ──► Senior with book    ──► Senior clicks       ──► Book is exchanged
DBMS 4th Sem Book"      campus request feed     spots the request       "Message Student"       on campus easily
```

---

## System Architecture

PustakMart is architected as a decoupled, full-stack monorepo featuring a modern React SPA frontend, an Express 5 REST and WebSocket server, and a dual database layer (MongoDB Atlas + Redis Cloud).

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                 |
|               React 19 • Vite 7 • React Router 7 • SCSS Tokens • Framer Motion        |
+---------------------------------------------------------------------------------------+
            │                                                       │
            │ HTTP (Axios / JSON / Cookies)                         │ WebSockets (Socket.io)
            v                                                       v
+---------------------------------------------------------------------------------------+
|                                   BACKEND APPLICATION                                 |
|                       Node.js (ESM) • Express 5 • Sentry Telemetry                    |
|---------------------------------------------------------------------------------------|
|  • Security Pipeline     : Helmet Headers, CORS Whitelist, Rate Limiting              |
|  • Session & Guard       : Optional Auth JWT Injector, Fail-Open Maintenance Engine   |
|  • Domain Modules        : 13 Modular Domains (Auth, Listings, Chat, Payments, etc.)  |
|  • Real-Time Dispatcher  : Scoped Room Socket Engine (Chat, Typing, Live Alerts)       |
+---------------------------------------------------------------------------------------+
            │                               │                       │
            ├───────────────────────────────┼───────────────────────┤
            v                               v                       v
+-----------------------+       +-----------------------+   +---------------------------+
|     MongoDB Atlas     |       |      Redis Cloud      |   |   Cloud Integrations      |
|-----------------------|       |-----------------------|   |---------------------------|
| • User & ID Profiles  |       | • Staged Registrations|   | • Razorpay (Payments)     |
| • Catalog Listings    |       | • OTP Rate Limiters   |   | • ImageKit.io (Media CDN) |
| • Orders & Ledgers    |       | • Revoked Token List  |   | • Nodemailer (OAuth2 SMTP)|
| • Chat Threads        |       | • Dynamic Maintenance |   | • Resend (Fallback Mail)  |
| • Reviews & Reports   |       | • Sub-ms State Caching|   | • Sentry (APM / Errors)   |
+-----------------------+       +-----------------------+   +---------------------------+
```

---

## Technology Stack

| Domain                      | Technology                                             | Details & Purpose                                                     |
| :-------------------------- | :----------------------------------------------------- | :-------------------------------------------------------------------- |
| **Frontend Framework**      | [React 19](https://react.dev/)                         | Component architecture, hooks, and responsive interface               |
| **Build & Bundler**         | [Vite 7](https://vite.dev/)                            | Lightning-fast HMR and optimized production bundling                  |
| **Routing**                 | [React Router 7](https://reactrouter.com/)             | Client-side routing, protected routes, and navigation layouts         |
| **Styling & Design**        | SCSS & CSS Variables                                   | Responsive design system, CSS variables, modular component styles     |
| **Animations & Icons**      | Framer Motion & Remix Icons                            | Smooth interactive micro-animations and cohesive UI iconography       |
| **Backend Runtime**         | [Node.js](https://nodejs.org/) (ESM)                   | High-concurrency event-driven asynchronous JavaScript runtime         |
| **API Framework**           | [Express 5](https://expressjs.com/)                    | RESTful API routing, modern middleware pipelines, and error handling  |
| **Primary Database**        | [MongoDB Atlas](https://www.mongodb.com/) / Mongoose 9 | Relational document modeling, schema validation, and indexes          |
| **In-Memory Store**         | [Redis Cloud](https://redis.io/) / `ioredis`           | Ephemeral OTP storage, rate limiting counters, and session blacklists |
| **Real-Time Sockets**       | [Socket.io](https://socket.io/) (v4.x)                 | Low-latency WebSockets for campus messaging and alerts                |
| **Payments Integration**    | [Razorpay](https://razorpay.com/) Node SDK             | Escrow-ready payments, order creation, HMAC-SHA256 verification       |
| **Media & Storage**         | [ImageKit.io](https://imagekit.io/)                    | Direct client-to-CDN media uploads via server-authenticated tokens    |
| **Transactional Email**     | Google OAuth2 & Resend                                 | Dual-redundancy mailers delivering verified 6-digit OTP codes         |
| **Monitoring & Telemetry**  | [Sentry](https://sentry.io/) Node SDK                  | Real-time crash diagnostics, stack traces, and request context        |
| **Testing & Documentation** | Jest, Supertest & Artillery                            | Test-Driven Documentation (TDDoc) and high-concurrency load testing   |

---

## Engineering Highlights

### 1. Dual-Tier Redis Auth Staging

Unverified registration attempts never write to MongoDB. Instead, candidate payloads are validated and staged in Redis with a 5-minute TTL while an attempt counter protects against brute-force attacks. Only upon entering a valid OTP is the record committed to MongoDB, keeping the primary database free of junk and dead accounts.

### 2. High-Throughput Bcrypt Tuning

Password hashing is tuned to **7 salt rounds**. This achieves an optimal balance between cryptographic resilience and throughput, cutting CPU hashing latency from ~80ms to ~10ms per request. This prevents event loop starvation during morning campus rush hours.

### 3. Zero-Bottleneck Direct-to-Cloud Uploads

File uploads bypass the Node.js server completely. When a student uploads a textbook photo or ID card, the client requests a transient cryptographic signature from `/api/media/auth` and uploads directly to ImageKit's CDN. The backend only ever handles lightweight JSON URLs, eliminating memory buffer bloat.

### 4. Dynamic Maintenance Mode (Fail-Open)

Platform maintenance can be activated in seconds via an admin toggle stored in Redis. All incoming non-admin requests are gracefully intercepted with a descriptive 503 screen, while administrators retain full access to test fixes. If Redis ever experiences an outage, the middleware **fails open**, preventing inadvertent downtime for users.

### 5. Test-Driven Documentation (TDDoc) Engine

API documentation and Postman collections never go stale. Integration tests running under Jest and Supertest execute against live routes, capture exact request and response schemas, and write human-readable Markdown docs into `docs/api-docs/` while updating `postman_collection.json` automatically.

---

## Folder Structure

```text
PustakMart/
├── client/                     # Frontend Single Page Application (React 19 + Vite)
│   ├── public/                 # Static assets, logos, and favicon
│   ├── src/
│   │   ├── app/                # Root router configuration and global style sheets
│   │   ├── assets/             # Brand logos, illustrations, and banners
│   │   ├── features/           # Domain-driven frontend feature slices
│   │   │   ├── admin/          # Admin HUD, student ID audit queue, user management
│   │   │   ├── auth/           # Login, registration, OTP validation, password reset
│   │   │   ├── dashboard/      # Buyer and seller workspaces, listings, and withdrawals
│   │   │   ├── home/           # Landing page, catalog marketplace, product details, checkout
│   │   │   └── shared/         # Reusable modals, navigation bars, footer, auth context
│   │   └── main.jsx            # React root application entrypoint
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API & WebSocket Server (Node.js + Express 5)
│   ├── scripts/                # Automated Postman collection generator
│   ├── src/
│   │   ├── config/             # DB setups (Mongo, Redis) and centralized env configuration
│   │   ├── middlewares/        # Authentication, maintenance interceptor, security guards
│   │   ├── models/             # 15 Mongoose schemas (Listings, Users, Payments, Chats, etc.)
│   │   ├── modules/            # 13 Encapsulated Domain Modules (Routes, Controllers, Validators)
│   │   ├── services/           # Reusable services (Razorpay, ImageKit, Email, Maintenance)
│   │   ├── shared/             # Shared validation utilities and HTML email templates
│   │   ├── sockets/            # Real-time WebSocket connection manager and room router
│   │   └── tests/              # 14 Sequential E2E test suites with live documentation loggers
│   ├── tests/                  # Artillery load testing configuration scripts
│   ├── server.js               # HTTP server bootstrap and Socket.io binding
│   ├── README.md               # Dedicated Server Architecture & Backend Engineering Guide
│   └── package.json
├── docs/                       # Living Documentation & API Specifications
│   ├── api-docs/               # 14 Auto-generated Markdown API module specs
│   ├── testing.md              # Master Guide: E2E Integration Testing & TDDoc Blueprint
│   └── api-docs/postman_collection.json # Exported Postman collection (v2.1.0)
└── package.json                # Root monorepo script runner
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or free [MongoDB Atlas](https://www.mongodb.com/) cluster)
- **Redis** (Local instance or free [Redis Cloud](https://redis.io/) database)

### Quick Start Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yadavaman13/PustakMart.git
    cd PustakMart
    ```

2. **Configure Backend (`server/`):**

    ```bash
    cd server
    npm install
    ```

    Create a `.env` file in `server/` with the required parameters (see [Environment Configuration](#-environment-configuration) below or refer to [server/README.md](./server/README.md)).

3. **Configure Frontend (`client/`):**

    ```bash
    cd ../client
    npm install
    ```

4. **Launch Development Servers:**
    - In terminal 1 (Server):
        ```bash
        cd server
        npm run dev
        # Backend runs on http://localhost:3000
        ```
    - In terminal 2 (Client):
        ```bash
        cd client
        npm run dev
        # Frontend runs on http://localhost:5173
        ```

---

## Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
# Server Runtime
PORT=3000
NODE_ENV=development
CLIENT_ORIGINS=http://localhost:5173
ALLOWED_CLIENT_ORIGIN=http://localhost:5173

# Databases
MONGO_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pustakmart?retryWrites=true&w=majority
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Security & Tokens
JWT_SECRET_KEY=your_jwt_secret_signing_key

# Email Service (Google OAuth2 + Gmail SMTP)
CLIENT_ID=your_oauth2_client_id.apps.googleusercontent.com
CLIENT_SECRET=your_oauth2_client_secret
REFRESH_TOKEN=your_oauth2_refresh_token
EMAIL_USER=your_campus_mailer@gmail.com
RESEND_API_KEY=re_your_fallback_resend_api_key

# Media Delivery (ImageKit.io)
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Payment Processing (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Telemetry
SENTRY_DSN=https://your_sentry_dsn
```

---

## Documentation & Testing

PustakMart comes with comprehensive, verified documentation:

| Document                                                          | Description                                                                                  |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| [**Server Architecture Guide**](./server/README.md)               | In-depth engineering breakdown of modules, controllers, cache flows, and WebSocket rooms     |
| [**E2E Testing & TDDoc Blueprint**](./docs/testing.md)            | Complete guide on the test-driven documentation pipeline and live doc recording              |
| [**Interactive API Docs**](./docs/api-docs/)                      | 14 structured Markdown documents covering every endpoint with real request/response payloads |
| [**Postman Collection**](./docs/api-docs/postman_collection.json) | Ready-to-import v2.1.0 Postman collection with organized folders and pre-saved responses     |

### Running Tests from Root:

```bash
# Run all E2E integration tests
npm run test

# Run tests and refresh Markdown documentation + Postman collection
npm run test:api:docs

# Re-generate Postman collection
npm run generate:postman

# Check code formatting with Prettier
npm run format:check
```

---

## Roadmap & Future Horizons

- [ ] **Multi-Campus University Federation:** Allow adjacent regional colleges to opt into cross-campus book hubs.
- [ ] **Barcode & ISBN Scanner:** Auto-populate book title, author, edition, and standard cover art by scanning the barcode on the back of any textbook.
- [ ] **Campus Ambassador Verification Nodes:** Enable designated student hostel reps to act as physical verification checkpoints.
- [ ] **AI-Powered Course Matcher:** Upload your semester syllabus PDF to automatically generate a shopping list of matching senior listings.

---

## Author & Acknowledgements

Developed with passion by **Aman Yadav** to solve real everyday challenges on college campuses.

- **Portfolio:** [yadavaman.tech](https://www.yadavaman.tech)
- **LinkedIn:** [Aman Yadav](https://www.linkedin.com/in/gecdhd-comp-yadav-aman/)
- **GitHub:** [@yadavaman13](https://github.com/yadavaman13)
- **Project Repository:** [PustakMart on GitHub](https://github.com/yadavaman13/PustakMart)

---

<div align="center">
  <sub>PustakMart • Empowering Campus Academia Through Circular Exchange</sub><br />
  <sub>Made with ❤️ by Aman Yadav</sub>
</div>
