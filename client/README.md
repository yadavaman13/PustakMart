# PustakMart Client

PustakMart client is a high-performance, responsive single-page web application (SPA) built using React 19 and Vite 7. It features dynamic dashboards, real-time negotiation channels, and secure payment checkpoints.

---

## 🛠️ Tech Stack & Architecture

* **Core Library:** React 19
* **Build Engine:** Vite 7
* **Routing Agent:** React Router 6 (with lazy-loaded dynamic route splits and Suspense placeholders)
* **Styling System:** Vanilla SCSS (structured utilizing CSS Variables, HSL color tokens, responsive grid systems, and subtle hover/micro-animations)
* **API Client:** Axios (configured with interceptors to automatically forward cookies and credential headers)
* **Real-time Client:** Socket.io Client (manages persistent event loops for notifications, message channels, and user actions)

---

## 🗂️ Frontend Project Structure

The client codebase is structured around **features** to isolate components, page routes, Hooks, styles, and services:

```text
client/src/
├── app/                        # Router and global SCSS entry files
├── assets/                     # Branding logos, icons, and static assets
├── features/                   # Core business features
│   ├── admin/                  # Administrative controls, user logs, verification checks
│   │   ├── hooks/              # Admin-specific fetch query hooks
│   │   ├── pages/              # AdminDashboardPage.jsx (HUD overview)
│   │   ├── services/           # Backend admin API callers
│   │   └── styles/             # HUD overlays and validation modals styles
│   ├── auth/                   # Identity gates (Login, Register, and OTP verification)
│   │   ├── context/            # AuthContext.jsx (tracks profile and verification payload)
│   │   ├── pages/              # AuthPage, VerifyEmailPage, ResetPasswordPage
│   │   ├── services/           # OTP generation and session controllers
│   │   └── styles/             # Auth layout and OTP inputs styles
│   ├── dashboard/              # Workspace dashboards (User vs. Seller flows)
│   │   ├── components/         # Chart wrappers, coupon builders, listings forms
│   │   ├── context/            # DashboardContext.jsx (dashboard workspace toggler)
│   │   ├── pages/              # UserDashboard.jsx & SellerDashboard.jsx
│   │   └── services/           # Listing updates, withdrawal creation, analytical data
│   ├── home/                   # Main landing catalog and checkouts
│   │   ├── pages/              # HomePage, MarketplacePage, CategoryLandingPage, CheckoutPage
│   │   └── services/           # Public queries and payment verification
│   └── shared/                 # Common elements (navbars, loaders, toast alerts)
├── index.css                   # Core styles reset and animations imports
└── main.jsx                    # React entry root
```

---

## 🔑 Global State Providers (React Context)

The client shares application-wide parameters using three specialized React Context Providers:

1. **`AuthContext`**
   - **File Location:** [`features/auth/context/AuthContext.jsx`](./src/features/auth/context/AuthContext.jsx)
   - **Responsibilities:** Manages the logged-in student's metadata, verification logs (`isVerified`), pending registration payloads, and authorization cookie checkpoints. Handles automatic user session loading.

2. **`SocketContext`**
   - **File Location:** [`features/shared/context/SocketContext.jsx`](./src/features/shared/context/SocketContext.jsx)
   - **Responsibilities:** Configures and establishes the persistent websocket connection to the server when authenticated. Exposes standard listener functions (`emit`, `on`, `off`) to feature components.

3. **`DashboardContext`**
   - **File Location:** [`features/dashboard/context/DashboardContext.jsx`](./src/features/dashboard/context/DashboardContext.jsx)
   - **Responsibilities:** Manages workspace switching (enabling seamless switching between Buyer and Seller workspaces). Maintains notification badges, active negotiation threads, and current drawer views.

---

## 🎨 Visual Design System & SCSS Guidelines

The interface is styled using Vanilla SCSS to optimize rendering performance, layout responsiveness, and accessibility:
* **HSL Color System:** Uses CSS Custom Properties mapping HSL values for seamless dark/light transformations and color-harmonious UI states.
* **Component-Scoped Styles:** SCSS files are imported locally within their respective features directory, keeping components modular and easy to refactor.
* **Micro-Animations:** Employs CSS transitions for hover states, skeleton loaders, and slide-in notifications to make the interface feel responsive and modern.

---

## 🔌 Integrations & Services

### 1. Razorpay Checkout Overlays
Integrated with Razorpay's standard web SDK script:
- Requests `payment/create-order` from the server to get transaction parameters.
- Triggers the standard `Razorpay` modal iframe within the browser.
- Collects payment response attributes and POSTs them to `payment/verify` to confirm transactions securely.

### 2. Secure Direct-to-Cloud Uploads
To upload images without loading the Express server:
- Calls `/media/imagekit-auth` to retrieve a temporary verification signature from the backend.
- Performs a direct `multipart/form-data` upload request to the ImageKit.io REST API.
- Retrieves the uploaded public file URL and attaches it to listing parameters.

---

## 🚀 Scripts & Local Getting Started

Ensure the server is running locally before booting up the client app.

### 1. Setup Requirements
Configure environment variables by setting public keys inside a `.env` file in the client root:
```env
VITE_API_URL=http://localhost:3000
VITE_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint/
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 2. Execution Commands
```bash
# Install dependencies
npm install

# Run the local Vite dev server (accessible at http://localhost:5173)
npm run dev

# Compile an optimized production build
npm run build

# Run local preview of compiled build folder
npm run preview
```