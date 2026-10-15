# Guided Annual Planner & Personal Growth Application (MERN Stack)

A guided annual planning and personal growth digital sanctuary inspired by the physical journal system created in Ethiopia to eliminate blank-page paralysis and foster compounding long-term progress.

> *"Doing small things before taking major steps compounds over time to create a huge impact."*

---

## Architecture Overview (Phase 1)

This repository is structured as a TypeScript monorepo with three workspace packages:

- **`shared/`**: Contains shared TypeScript interfaces and Zod validation schemas (`@planner/shared`) consumed by both client and server to guarantee zero API contract drift.
- **`server/`**: Express.js REST API on Node.js using TypeScript, Mongoose for MongoDB Atlas persistence, Google Identity Services token verification (`google-auth-library`), and secure database-backed session management (`Session` collection with SHA-256 hashed secrets).
- **`client/`**: React 19 SPA built with Vite, TypeScript, Tailwind CSS, Framer Motion, and `@react-oauth/google` with paper-journal design tokens.

---

## Directory Structure

```
planner-mern/
├── package.json              # Root npm workspaces configuration
├── tsconfig.json             # Root TypeScript base config
├── .env.example              # Root environment variable template
├── README.md                 # Complete project & setup documentation
├── shared/                   # Shared types and validation schemas
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── types/            # UserProfile, UserPreferences, AuthResponse, etc.
│       ├── schemas/          # googleAuthSchema, userPreferencesSchema
│       └── index.ts          # Barrel export
├── server/                   # Node.js + Express API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example          # Server environment template
│   └── src/
│       ├── config/           # env.ts, db.ts
│       ├── models/           # User.ts, Session.ts
│       ├── services/         # googleAuth.service.ts, session.service.ts
│       ├── middleware/       # auth.middleware.ts, error.middleware.ts
│       ├── controllers/      # auth.controller.ts
│       ├── routes/           # auth.routes.ts
│       ├── app.ts            # Express application factory
│       └── index.ts          # Server entry point
└── client/                   # Vite + React 19 Frontend
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts        # Vite config with API proxy
    ├── tailwind.config.js    # Paper journal design tokens
    ├── .env.example          # Client environment template
    ├── index.html            # Google fonts & HTML entry
    └── src/
        ├── context/          # AuthContext.tsx
        ├── components/       # JournalLoginCard.tsx
        ├── pages/            # LoginPage.tsx, PlaceholderDashboard.tsx
        ├── styles/           # index.css (dot-grid utilities)
        ├── App.tsx           # Router & Providers
        └── main.tsx          # DOM root mount
```

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v22+ / v24+ supported)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/guided_planner`) or MongoDB Atlas URI.

### 1. Installation
Install dependencies for all workspaces from the project root:
```bash
npm install
```

### 2. Environment Configuration
Create `.env` files for both server and client:

**`server/.env`**:
```ini
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/guided_planner
SESSION_SECRET=dev_secret_key_minimum_32_characters_long_for_hmac_sha256
COOKIE_NAME=planner_session
COOKIE_SECURE=false
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**`client/.env`**:
```ini
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Build All Workspaces
```bash
npm run build
```

### 4. Run Development Servers
In two separate terminals:

**Terminal 1 (Backend API)**:
```bash
npm run dev:server
```
*API will start on `http://localhost:5000`.*

**Terminal 2 (Frontend Client)**:
```bash
npm run dev:client
```
*Vite will start on `http://localhost:5173`.*

---

## Google Cloud Console Configuration Steps

To enable live Google Sign-In with your Google account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `Guided Annual Planner`).
3. Navigate to **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - App Name: `Guided Annual Planner`
   - User Support Email: your email
   - Scopes: `openid`, `profile`, `email`
4. Navigate to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Guided Planner Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://your-planner-domain.com` (for production)
   - Click **Create**.
5. Copy the generated **Client ID** (ends with `.apps.googleusercontent.com`).
6. Paste the Client ID into both:
   - `server/.env` as `GOOGLE_CLIENT_ID`
   - `client/.env` as `VITE_GOOGLE_CLIENT_ID`

*Note: No Google Client Secret is needed because the backend verifies the OpenID Connect ID token signature directly against Google's public keys using `google-auth-library`.*

---

## Automated Testing Suite

Run all automated unit and integration tests across the monorepo:
```bash
npm run test
```

Or test individual workspaces:
```bash
npm run test --workspace=shared  # Zod schema validation tests
npm run test --workspace=server  # Session service, cookie security, auth API tests
npm run test --workspace=client  # Component rendering & login preview tests
```

---

## Security Model & Safeguards

1. **Database-Backed Sessions**: Rather than stateless JWTs, sessions are stored in MongoDB with SHA-256 hashed secrets. This enables **instant revocation on sign-out** and cross-device session termination.
2. **HttpOnly Cookie Transmission**: Session secrets are stored exclusively in `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies. Zero secrets or tokens are stored in `localStorage` or `sessionStorage`.
3. **Independent Expiry Validation**: Expirations are checked programmatically on every request, independent of MongoDB's background TTL cleanup.
4. **Session Rotation with Grace Period**: When a session is within 15 days of expiration, a rolling renewal issues a new token while maintaining a 30-second grace window to prevent race conditions during concurrent browser requests.
5. **Zero Raw Secret Logging**: Raw session tokens are never printed in server logs; only the SHA-256 hash is recorded in MongoDB.
