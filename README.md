<div align="center">

#  PustakMart

### Verified Student-to-Student Campus Book Exchange

<p>
  A trust-centric, peer-to-peer (P2P) academic marketplace designed for college students to buy, sell, and request reference books, notes, and study bundles securely on campus.
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-Cloud-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

<p>
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Payments-Razorpay-blue?style=flat-square" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Auth-OTP_&_JWT-orange?style=flat-square" alt="Auth" />
  <img src="https://img.shields.io/badge/Storage-ImageKit.io-cyan?style=flat-square" alt="ImageKit" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" alt="License" />
</p>

<p>
  <a href="#-why-pustakmart"><strong>Why PustakMart</strong></a> •
  <a href="#-key-features"><strong>Key Features</strong></a> •
  <a href="#-system-architecture"><strong>System Architecture</strong></a> •
  <a href="#-strategic-roadmap"><strong>Future Scope</strong></a>
</p>

</div>

---

## 📋 Table of Contents
- [Why PustakMart](#why-pustakmart)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [User Journey](#user-journey)
- [Routes and API](#routes-and-api)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Strategic Roadmap](#strategic-roadmap)
- [Contributing](#contributing)
- [Socials \& Contact](#socials--contact)

---

## 💼 Why PustakMart

Academic textbooks and study materials are highly expensive, yet their utility is limited to a single semester. Once a student passes a course, these books sit idle, while incoming juniors struggle to find affordable copies. 

**PustakMart** bridges this gap by creating a localized, secure, and user-friendly digital marketplace where students can easily discover, trade, and request books from senior students on their own campus.

### 🌟 High-Impact Value Proposition
* **Zero Logistics Cost**: Trades occur directly on campus (SVNIT & other colleges), removing shipping fees and packaging waste.
* **Verified Student Profiles**: Only vetted student profiles can unlock the Seller Dashboard, creating a high-trust community.
* **Structured Campus Discovery**: Filter academic items by college, department, and semester to find exact syllabus matches instantly.
* **Demand-Driven System**: If a book isn't available, post a request and let sellers find you, turning passive browsing into active transactions.

---

## 🎯 Key Features

### 👤 Student (Buyer) Experience
* **Localized Search**: Discover reference materials filtered by College Name, Branch/Department, and Semester.
* **Open Book Requests**: Submit book requests detailing syllabus needs and custom budget thresholds.
* **Bookmarks & Favorites**: Track desired listings and receive status changes.
* **Live Inquiries**: Start real-time chat threads directly from listing pages to coordinate face-to-face meetups.
* **Secure Checkout & Discount Coupons**: Purchase books directly using the integrated Razorpay checkout overlay. Supports custom seller-issued discount coupons.
* **Rating System**: Submit feedback and rate sellers after completing a transaction.

### 💼 Verified Seller Workspace
* **Analytics Dashboard**: Access active listing counters, total completed sales, aggregate views, and customer ratings.
* **Earnings & Sales Analytics**: Access dynamic month-over-month graphs charting gross sales, net earnings (after 10% commission processing), and transaction volumes.
* **Single & Semester Bundle Uploads**: Publish individual books or semester course packs with condition ratings and cover files.
* **Conversational Discounts**: Generate and send custom coupon codes directly inside active buyer chats, automatically posting system alerts.
* **Active Demand Matching**: Browse campus-wide buyer requests and contact students to complete trades.

### 👑 Admin Control Panel
* **Live Analytics HUD**: Monitor total registered students, verified sellers, listings counts, and books traded.
* **Real-time verification Audit**: Review pending applicant profiles. Opens a modal presenting student details and uploaded documents (images or interactive PDFs).
* **Comment-Driven Approvals**: Approve or Reject requests with specific feedback/remarks. Rejection remarks are shown directly to the user so they can adjust and re-apply.
* **Marketplace Moderation**: Resolve reported issues, delete listings violating guidelines, and manage user account access.

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **Core Library**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router 6 (Lazy-loaded Suspense routing for optimized FCP/LCP performance SEO)
- **Styling**: Vanilla SCSS (CSS variables, HSL color tokens, CSS layouts, and micro-animations)
- **HTTP Client**: Axios
- **Real-Time Client**: Socket.io Client

### ⚙️ Backend
- **Framework**: Node.js + Express 5
- **Database**: MongoDB + Mongoose (ODM)
- **Session Cache & Limiter**: Redis (Cloud / Enterprise)
- **Real-Time Server**: Socket.io
- **Media Upload Broker**: ImageKit.io Node SDK
- **Payment Verification**: Razorpay Node SDK
- **Email Delivery**: NodeMailer with Google OAuth2
- **Cryptography & Hashing**: Bcrypt (Optimized to **7 salt rounds** for peak login throughput)
- **Load Testing**: Artillery

### 🗄️ Database Models (Mongoose)
- `users`: User metadata, role, verification status, and admin rejection comments.
- `listings`: Title, author, condition, branch, semester, images, seller, status, and traffic views.
- `bookrequests`: Budget, semester, branch, and requestedBy user relationship.
- `conversations`: Participant array, last message summary, and update timestamps.
- `messages`: Sender, content, conversation ID, and delivery timestamps.
- `notifications`: Recipient, message, read flag, and event category tags.
- `coupons`: Centralized discount coupon codes (fixed/percentage deductions, expiration dates, user/listing restrictions, and chat-negotiated mappings).
- `payments`: Razorpay transaction logs, ledger calculations (marketplace fee, commission splits), coupon links, transaction status, and pre-save sync hooks.
- `reports`: Flagged listings, reporting user, infraction reason, and status.
- `reviews`: Seller, buyer, review text, transaction listing, and rating stars.
- `blacklistTokens`: Blacklisted JWT tokens for secure logout cycles.

---

## 🧱 System Architecture

```text
       +------------------------------------------------------------+
       |                  Vite + React 19 Frontend                  |
       +------------------------------------------------------------+
                 | (Axios & Credentials)         | (Real-time events)
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

### ⚙️ Strategic Engineering Decisions

#### 1. Registration OTP Flow (Redis Guard)
To prevent bot registration and spam emails, registration and password resets are gated behind a multi-step OTP system:
1. **Send Limiters**: Redis tracks request counts (`otp-send-count:${email}`). Users are limited to 5 OTP requests per hour.
2. **Cooldowns**: Redis enforces a strict 2-minute cooldown before another OTP can be requested.
3. **Registration Session Cache**: Unverified user data payloads are temporarily cached in Redis (`register-data:${email}`) with a 5-minute TTL.
4. **Attempt Counter**: Redis limits verification attempts to 3 (`attempts:register:${email}`). If a user enters an incorrect OTP 3 times, the registration session is destroyed.
5. **Account Creation**: Upon successful verification, the payload is committed to MongoDB, and a secure HTTP-Only JWT is issued.

#### 2. Secure Direct-to-Cloud Uploads (ImageKit.io)
Rather than bottlenecking the Node.js server with heavy image file uploads, the client uploads files directly to ImageKit:
1. The client requests secure upload parameters (token, signature, expire timestamp) from `/api/media/imagekit-auth`.
2. The server calls the ImageKit SDK to generate these signatures.
3. The client uploads the image file via `FormData` directly to `https://upload.imagekit.io/api/v1/files/upload`.
4. Filenames are customized dynamically (`ID_${user.id}_${Date.now()}.${extension}`) to avoid duplicates, and the returned public URL is saved in MongoDB.

#### 3. Infinite Reconnection Cache Client
The Redis client config is built to be resilient against idle timeouts:
* Uses an exponential backoff retry strategy (`retryStrategy`) capped at 3 seconds that retries infinitely.
* Sets `maxRetriesPerRequest: null`, enabling the server to queue database commands during a brief connection drop instead of throwing errors.

---

## 📁 Project Structure

```text
PustakMart/
├── client/                     # Vite + React Frontend Application
│   ├── public/                 # Static assets (Favicons, manifest)
│   ├── src/
│   │   ├── app/                # Root configurations (Router, base Styles)
│   │   ├── assets/             # Media resources (Logo, Favicons)
│   │   └── features/
│   │       ├── admin/          # HUD pages, hooks, services, and SCSS styles
│   │       ├── auth/           # Login/Register OTP flow pages
│   │       ├── dashboard/      # Buyer/Seller dashboard screens & Switcher
│   │       ├── home/           # Landing overview portal
│   │       └── shared/         # Reusable form validators & assets
│   └── package.json
└── server/                     # Node.js + Express.js Backend Application
    ├── src/
    │   ├── config/             # DB connectivity, Redis connection, env checkers
    │   ├── controllers/        # Express handlers (Auth, Listings, Sockets)
    │   ├── middlewares/        # JWT validator, admin checker, validation parser
    │   ├── models/             # Mongoose Schemas (listings, reviews, blacklist)
    │   ├── routes/             # Endpoints routers
    │   └── services/           # Payment brokers, OAuth2 SMTP email handlers
    ├── tests/                  # Automated integration tests, load tests, and seed scripts
    └── package.json
```

---

## 🔌 Routes and API

### 🖥️ Frontend Client Routes
- `/` - Landing homepage.
- `/auth` - Account creation & Login panel.
- `/verify-email` - OTP verification portal.
- `/reset-password` - Password reset gateway.
- `/dashboard` - User view panel (Home feed, browse catalog, request book, messages, alert notifications, settings).
- `/dashboard?mode=seller` - Seller workspace (Analytics charts, listings, publish listing, client requests).
- `/marketplace` - Advanced marketplace search catalog.
- `/category/:categoryId` - Category landing pages.
- `/checkout/:listingId` - Secure checkout screen (requires authentication).
- `/admin` - Admin HUD (Overview analytics, users status control, catalog listing, flagged reviews).

### 🌐 Backend API Endpoints

#### 🔒 Auth & Profile Routes (`/api/auth`)
* `POST /register/send-otp` - Validates inputs, checks Redis rate limit, sends registration OTP (hashing password via Bcrypt at 7 salt rounds).
* `POST /register/verify-otp` - Verifies OTP (max 3 attempts), creates DB user document, and issues JWT cookie.
* `POST /register/resend-otp` - Re-evaluates rate limits, regenerates OTP, and sends email.
* `POST /login` - Audits credentials, checks block status, issues JWT session cookie.
* `POST /logout` - Clears browser cookie, blacklists JWT token.
* `GET /get-me` - Fetches the authenticated user profile.
* `PUT /update-profile` - Modifies name, mobile, department, college, or avatar fields.
* `POST /apply-seller` - Receives Student ID Card upload URL and initiates vetting process.
* `GET /admin/pending-sellers` - Retrieves list of applications.
* `POST /admin/verify-seller/:id` - Vets seller applications (Approve/Reject) with admin comments and notifications.
* `PUT /admin/user-status/:id` - Locks (blocks) or soft-deletes a user profile.
* `POST /forgot-password/send-otp` - Verifies email presence, generates temporary OTP.
* `POST /forgot-password/verify-otp` - Verifies OTP, initializes reset session token.
* `POST /reset-password` - Resets account password using token.

#### 📚 Listings Routes (`/api/book` & `/api/listings`)
* `POST /` - Publishes a new academic listing.
* `GET /` - Queries all listings with search queries (title, category, department).
* `GET /:id` - Fetches single book details and increments views counter.
* `PUT /:id` - Updates listing details.
* `DELETE /:id` - Removes listing.
* `PATCH /:id/sold` - Marks book listing state as SOLD.
* `GET /api/listings/:id/checkout` - Retrieves book details, seller ratings stats, and billing breakdown (book price, ₹5 marketplace fee, optional coupon validation) for checkout page.

#### 📋 Book Requests Routes (`/api/book-requests`)
* `POST /` - Publishes a new book request.
* `GET /` - Retrieves open book requests on campus.
* `DELETE /:id` - Cancels book request.

#### 💬 Chat Routes (`/api/chats` & `/api/conversations`)
* `GET /` - Lists active conversations.
* `GET /:id` - Returns message history.
* `POST /` - Creates new conversation.
* `POST /:id/message` - Sends text message.
* `POST /:id/coupon` - Seller generates a custom discount coupon code (`couponCode`) for the buyer in an active conversation.

#### 💳 Payments (`/api/payment` & `/api/payments`)
* `POST /create-order` / `POST /create` - Requests a new Razorpay order ID. Accepts optional `couponCode`. Deactivates duplicate pending attempts.
* `POST /verify` / `POST /verify-payment` - Verifies Razorpay payment signatures using HMAC-SHA256, sets payment to `completed`/`paid`, marks coupon as used, transitions listing to `reserved` (holding status), writes chat logs, and issues alerts.

#### 📊 Seller Earnings & Analytics (`/api/seller`)
* `GET /earnings` - Aggregates seller overall metrics (gross earnings, 10% commission, net earnings, books sold) and groups sales month-by-month for performance analytics using MongoDB aggregation pipelines.

---

## 🏁 Getting Started

### ✅ Prerequisites
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* **MongoDB** connection URL (Atlas or local)
* **Redis** (Local instance or Redis Enterprise Cloud)
* **ImageKit.io** account credentials
* **Gmail SMTP** account credentials with OAuth2 configured

### 1. Project Installation
Clone the repository:
```bash
git clone https://github.com/yadavaman13/PustakMart.git
cd PustakMart
```

Install backend dependencies:
```bash
cd server
npm install
```

Install frontend dependencies:
```bash
cd ../client
npm install
```

### 2. Database & API Configuration
Create a `.env` configuration file in the `server` directory:
```env
PORT=3000
NODE_ENV=development
MONGO_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_secure_jwt_secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Email Configuration (OAuth2 GMail)
CLIENT_ID=your_gmail_oauth_client_id
CLIENT_SECRET=your_gmail_oauth_client_secret
REFRESH_TOKEN=your_gmail_oauth_refresh_token
EMAIL_USER=your_smtp_gmail_address

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint/

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Allowed Client Origins
CLIENT_ORIGINS=http://localhost:5173
```

### 3. Running Locally
Run the server:
```bash
cd server
npm run dev
```

Run the client:
```bash
cd client
npm run dev
```

Access the portal:
* Client Interface: [http://localhost:5173](http://localhost:5173)
* Server API endpoint: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

| Variable | Scope | Purpose | Required |
| :--- | :--- | :--- | :--- |
| `MONGO_URL` | Server | MongoDB Connection String | Yes |
| `JWT_SECRET_KEY` | Server | JWT Token Cryptographic Signature | Yes |
| `REDIS_HOST` | Server | Redis server address | Yes |
| `REDIS_PORT` | Server | Redis server port | Yes |
| `REDIS_PASSWORD` | Server | Redis server access credentials | Yes |
| `EMAIL_USER` | Server | GMail Address for OTP delivery | Yes |
| `CLIENT_ID` | Server | Google OAuth2 Client ID for SMTP Nodemailer | Yes |
| `CLIENT_SECRET` | Server | Google OAuth2 Client Secret for SMTP Nodemailer | Yes |
| `REFRESH_TOKEN` | Server | Google OAuth2 Refresh Token for SMTP Nodemailer | Yes |
| `IMAGEKIT_PUBLIC_KEY` | Server & Client | ImageKit Client public token | Yes |
| `IMAGEKIT_PRIVATE_KEY`| Server | ImageKit API upload key | Yes |
| `IMAGEKIT_URL_ENDPOINT`| Server | ImageKit public URL endpoint | Yes |
| `RAZORPAY_KEY_ID` | Server & Client | Razorpay Public Key ID | Yes |
| `RAZORPAY_KEY_SECRET` | Server | Razorpay Secret API Key | Yes |
| `CLIENT_ORIGINS` / `ALLOWED_CLIENT_ORIGIN` | Server | Whitelisted client origins for CORS | Yes |

---

## 📜 Scripts

### Backend (`/server`)
* `npm run dev` - Starts development server with nodemon auto-reload.
* `npm start` - Starts production backend server.
* `node tests/test_payment.js` - Runs automated payment signature verification flow tests.
* `node tests/test_email.js` - Runs Nodemailer SMTP Google OAuth2 verification tests.
* `node tests/test_redis.js` - Runs Redis connectivity and cache operations tests.
* `node tests/test_otp_flow.js` - Runs registration OTP and recovery session flow tests.
* `npx artillery run tests/login-load-test.yml` - Executes Login API concurrency load tests.
* `npx artillery run tests/homepage-load-test.yml` - Executes Homepage flow concurrency load tests.

### Frontend (`/client`)
* `npm run dev` - Launches Vite local development server.
* `npm run build` - Compiles production optimized build artifacts.
* `npm run preview` - Runs preview local build checks.

---

## 🗺️ Strategic Roadmap

- [ ] **Multi-Campus Catalog Extension**: Implement college network clusters to permit search discovery across neighboring universities.
- [ ] **Mobile Push Alert Framework**: Build Service Workers and web push endpoints to alert users of offers and chat messages when offline.
- [ ] **AI-Assisted Listing Optimizer**: Integrate Gemini models to automatically draft book description copy and recommend pricing based on conditions.
- [ ] **Integrated Delivery Tracking**: Introduce physical hand-over location pins on campus maps to facilitate safe exchange coordinates.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 🤝 Socials & Contact

Let's connect, share ideas, or collaborate:

* **LinkedIn**: [Aman Yadav](https://www.linkedin.com/in/gecdhd-comp-yadav-aman/)
* **GitHub Repository**: [PustakMart on GitHub](https://github.com/yadavaman13/PustakMart)

---

<div align="center">
  Made with ❤️ by <a href="https://www.yadavaman.tech">Aman</a>
</div>
