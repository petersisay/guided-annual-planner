# Guided Annual Planner — Production Deployment & Operations Guide

This comprehensive guide covers architecture, configuration prerequisites, security posture, operational procedures, rollback strategies, and manual verification steps for the **Guided Annual Planner** application.

---

## 1. Production Architecture Overview

The Guided Annual Planner is structured as a TypeScript monorepo with three workspaces:
- `@planner/shared`: Common TypeScript domain models, Zod validation schemas, and date/calendar utilities.
- `@planner/client`: Vite + React Progressive Web App (PWA) with client-side routing, service worker offline asset caching, and IndexedDB persistence.
- `@planner/server`: Node.js + Express API server with Mongoose/MongoDB persistence, session/JWT authentication, optimistic concurrency, and rate limiting.

### Deployment Topologies

#### Option A: Unified Full-Stack Node.js Process / Container (Recommended Default)
- The Express server serves both the authenticated REST API (`/api/v1/*`) and static client build assets (`client/dist`).
- Unmatched non-API requests fall back to `index.html` for client-side React SPA routing.
- Protected endpoints (`/api/*`, `/auth/*`, `/health/*`) strictly bypass the SPA fallback and return JSON responses.
- Simplest deployment: a single Node.js runtime process (or container) behind an HTTPS reverse proxy (Nginx, AWS ALB, Cloudflare, Traefik, or Caddy).

#### Option B: Decoupled Static Edge + Backend API
- **Frontend**: `client/dist` static assets hosted on an Edge CDN or Object Storage platform (e.g. Cloudflare Pages, AWS CloudFront + S3, Vercel, Netlify).
- **Backend**: Express API server hosted on a container service or cloud VM (e.g. AWS ECS/App Runner, Google Cloud Run, Railway, Render, DigitalOcean App Platform).
- **CORS**: Must strictly configure `CLIENT_ORIGIN` to match the exact frontend CDN domain.

---

## 2. Environment Variables & Configuration Checklist

All production environment variables are documented below, categorized by runtime tier.

### Server Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `development` | Set to `production` in live environments. Enforces secure cookies, locks down `/dev-login` (returns 403), and activates production schema refinements. |
| `PORT` | No | `5000` | Port for the Express server to listen on. |
| `CLIENT_ORIGIN` | **Yes** | `http://localhost:5173` | Exact canonical HTTPS origin of the frontend (e.g. `https://planner.example.com`). Strict CORS forbids credentials with wildcards. |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/guided_planner` | Production MongoDB connection string with TLS/SSL enabled (e.g. MongoDB Atlas cluster URI). Must include auth credentials and database name. |
| `SESSION_SECRET` | **Yes** | *(dev default)* | Cryptographically random string (**minimum 32 characters**) used to sign HMAC-SHA256 session tokens. Startup will fail if default key is used in production mode. |
| `COOKIE_NAME` | No | `planner_session` | Name of the session cookie. |
| `COOKIE_SECURE` | **Yes** | `false` | Must be set to `true` in production to enforce `Secure; HttpOnly; SameSite=Lax` cookie transmission over HTTPS. Startup will fail if false in production mode. |
| `GOOGLE_CLIENT_ID` | Optional | — | Google OAuth 2.0 Web Client ID from Google Cloud Console for server-side ID token verification. |

### Client Environment Variables (Injected at Build Time)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | No | `/api/v1` | Base URL for API requests. Default relative path works when client and server are co-hosted. For decoupled hosting, use full API URL (e.g. `https://api.planner.example.com/api/v1`). |
| `VITE_GOOGLE_CLIENT_ID`| Optional | — | Google OAuth 2.0 Web Client ID injected into the client bundle to render the Google One Tap / Sign-In button. Must match the server's `GOOGLE_CLIENT_ID`. |

> [!CAUTION]
> Never put server secrets (`SESSION_SECRET`, database passwords) into client `.env` files or variables prefixed with `VITE_`. Any variable starting with `VITE_` is compiled into public client-side JavaScript.

---

## 3. Security & Network Hardening

### A. HTTPS Enforcement & Reverse Proxy Trust
- Production traffic **must terminate at an HTTPS endpoint** (TLS 1.2+).
- Configure your reverse proxy to forward client protocols:
  ```nginx
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Host $http_host;
  ```
- In Express, proxy trust is configured via `app.set('trust proxy', 1)`.
- Enforce HTTP Strict Transport Security (HSTS) at the reverse proxy layer:
  ```nginx
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  ```

### B. Secure Cookie Policy
In production (`NODE_ENV=production`, `COOKIE_SECURE=true`), session cookies are set with:
- `Secure`: Cookie is transmitted only over encrypted HTTPS connections.
- `HttpOnly`: Mitigates Cross-Site Scripting (XSS) by preventing JavaScript access.
- `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF) while allowing normal top-level navigation.

### C. CORS & CSRF Defense-in-Depth
- Express CORS middleware strictly checks `origin === env.CLIENT_ORIGIN`.
- Custom CSRF middleware verifies `X-Planner-Client: WebApp` and validates `Origin` or `Referer` headers on all state-changing requests (`POST`, `PUT`, `DELETE`).

### D. Google Cloud Console OAuth 2.0 Configuration
In the [Google Cloud Console](https://console.cloud.google.com/):
1. Navigate to **APIs & Services > Credentials**.
2. Select your OAuth 2.0 Client ID (Application type: Web application).
3. Set **Authorized JavaScript origins**:
   - `https://planner.example.com`
4. Set **Authorized redirect URIs**:
   - `https://planner.example.com`
5. Ensure development URLs (`http://localhost:*`) are separated into a dedicated development client ID.

### E. MongoDB Atlas Least-Privilege & Network Isolation
- **IP Access List**: Do not permit `0.0.0.0/0`. Restrict connections to:
  - Static IP egress addresses of production servers.
  - AWS VPC Peering, Azure VNet Peering, or GCP VPC Peering.
- **Database User**: Create a dedicated database user with `readWrite` role scoped *only* to the `guided_planner` database. Do not use an administrative user (`atlasAdmin`).
- **TLS/SSL**: Use the `mongodb+srv://` protocol which requires TLS encryption for all wire traffic.

### F. Developer Endpoint Lockdown
- `POST /api/v1/auth/dev-login` is strictly guarded by `if (env.NODE_ENV !== 'development')`.
- In production, it returns HTTP 403 `FORBIDDEN` and never creates sessions or sets cookies.

---

## 4. Production Build & Deployment Procedures

### Procedure 1: Containerized Deployment (Docker)
*(Requires Docker Engine installed on CI/CD runner or production server)*

> [!NOTE]
> Container execution has not been verified on the development Windows host because Docker CLI is not installed locally. Container instructions are provided for external deployment environments.

1. **Build the production image**:
   ```bash
   docker build -t guided-annual-planner:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name guided-annual-planner \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e PORT=5000 \
     -e CLIENT_ORIGIN=https://planner.example.com \
     -e MONGODB_URI="mongodb+srv://<dbuser>:<dbpass>@<cluster>.mongodb.net/guided_planner?retryWrites=true&w=majority" \
     -e SESSION_SECRET="<generate-random-32-char-secret>" \
     -e COOKIE_SECURE=true \
     -e GOOGLE_CLIENT_ID="<your-google-client-id>.apps.googleusercontent.com" \
     --restart unless-stopped \
     guided-annual-planner:latest
   ```

---

### Procedure 2: Standard Node.js Process Deployment (PM2 / Systemd)

1. **Install Prerequisites**:
   - Node.js 20 LTS or later.
   - PM2 process manager: `npm install -g pm2`

2. **Clean Install & Build**:
   ```bash
   npm ci
   npm run build
   ```

3. **Configure Environment File (`server/.env`)**:
   ```ini
   NODE_ENV=production
   PORT=5000
   CLIENT_ORIGIN=https://planner.example.com
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/guided_planner?retryWrites=true&w=majority
   SESSION_SECRET=<random-32-char-string>
   COOKIE_NAME=planner_session
   COOKIE_SECURE=true
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   ```

4. **Start Application with PM2**:
   ```bash
   pm2 start server/dist/index.js --name "guided-planner" --env production
   pm2 save
   pm2 startup
   ```

---

## 5. Health Checks, Logging & Monitoring

### Health Check Endpoint
- **URL**: `GET /health`
- **Expected Status**: `200 OK`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "service": "guided-annual-planner-api",
    "timestamp": "2026-10-15T05:00:00.000Z"
  }
  ```
- Configure uptime monitoring services (e.g. AWS Route53 Health Checks, Better Uptime, Datadog) to query `/health` every 30-60 seconds.

### Logging Practices
- The application logs operational startup parameters (port, client origin, node env).
- Passwords, session tokens, and MongoDB connection credentials are sanitized and excluded from logs.
- In production, stream stdout/stderr to a centralized log aggregator (CloudWatch, Datadog, Papertrail).

---

## 6. Rollback & Disaster Recovery Procedures

### Application Rollback
1. **Containerized Rollback**:
   Re-tag or redeploy the previous stable image tag:
   ```bash
   docker stop guided-annual-planner
   docker run -d --name guided-annual-planner ... guided-annual-planner:previous-stable-tag
   ```
2. **Node.js Process Rollback**:
   Extract the verified clean backup archive `Guided_Annual_Planner_Complete_Local_Backup.zip` into the application directory, reinstall, and build:
   ```bash
   tar -xf Guided_Annual_Planner_Complete_Local_Backup.zip -C /opt/guided-planner
   npm ci
   npm run build
   pm2 restart guided-planner
   ```

### Database Disaster Recovery
- Ensure **MongoDB Atlas Continuous Cloud Backups** (point-in-time recovery) are enabled.
- For manual backup snapshots:
  ```bash
  mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/guided_planner" --out=/backups/$(date +%F)
  ```
- To restore a snapshot:
  ```bash
  mongorestore --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/guided_planner" --drop /backups/<snapshot-folder>/guided_planner
  ```

---

## 7. Post-Deployment Verification Checklist (Manual Operator Actions)

After deploying the application to your production domain, execute the following verification steps:

1. **Verify Health Endpoint**:
   ```bash
   curl -i https://planner.example.com/health
   # Expected: HTTP 200 OK, JSON with status: "ok"
   ```

2. **Verify SPA Routing Fallback**:
   ```bash
   curl -i https://planner.example.com/annual
   # Expected: HTTP 200 OK, Content-Type: text/html, returns index.html
   ```

3. **Verify 404 Protection on Unmatched API Routes**:
   ```bash
   curl -i https://planner.example.com/api/v1/unknown-route
   # Expected: HTTP 404 Not Found, JSON with code: "NOT_FOUND" (NOT index.html)
   ```

4. **Verify Dev-Login Lockdown in Production**:
   ```bash
   curl -i -X POST https://planner.example.com/api/v1/auth/dev-login \
     -H "Content-Type: application/json" \
     -H "X-Planner-Client: WebApp" \
     -H "Origin: https://planner.example.com" \
     -d '{"email":"test@example.com"}'
   # Expected: HTTP 403 Forbidden with code: "FORBIDDEN"
   ```

5. **Verify Real-Browser Google OAuth**:
   - Open `https://planner.example.com` in a desktop browser.
   - Click "Sign in with Google" and complete real authentication.
   - Inspect browser DevTools > Application > Cookies: confirm `planner_session` cookie is present with `HttpOnly; Secure; SameSite=Lax`.
   - Refresh page to verify persistent session restoration.
   - Click "Sign Out" to confirm cookie invalidation and session revocation.
