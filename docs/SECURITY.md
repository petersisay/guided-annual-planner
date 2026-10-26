# Guided Annual Planner — Security & Privacy Architecture

**Production Grade**: Defense-in-depth security model  
**Authentication Standard**: Google Identity Services (OpenID Connect)  
**Session Storage**: Database-backed SHA-256 hashed secrets in `HttpOnly` cookies

---

## 1. Threat Model & Security Posture

Guided Annual Planner stores deeply personal reflections, yearly intentions, financial equipment budgets, and daily journals. Protecting user privacy and data integrity is paramount.

The application adheres to a **defense-in-depth** model across the entire stack:

```
[Browser Client]
       │  (1) HttpOnly, SameSite=Lax, Secure Cookie
       │  (2) Custom Header: X-Planner-Client: WebApp
       ▼
[Vercel Reverse Proxy] (TLS 1.3 Termination & Same-Origin Transport)
       │
       ▼
[Express Security Middleware]
       ├── (3) Helmet Security Headers (CSP, HSTS, X-Frame-Options)
       ├── (4) Rate Limiting (15 attempts / 15 min on Auth endpoints)
       ├── (5) CSRF & Origin Guard (Origin/Referer vs. CLIENT_ORIGIN)
       ├── (6) Session Authenticator (SHA-256 Database Lookup & Expiry Check)
       └── (7) Zod Schema Input Sanitization & Payload Whitelisting
       │
       ▼
[Database Tier]
       └── (8) Strict Tenant Isolation (All queries scoped by session.userId)
```

---

## 2. Authentication: Why Database Sessions Over Stateless JWTs

Many modern web apps use stateless JSON Web Tokens (JWTs) stored in browser `localStorage`. Guided Annual Planner intentionally avoids this pattern for the following critical reasons:

| Vulnerability Vector | Stateless JWT in `localStorage` | Database-Backed Cookie Session (Our Architecture) |
| :--- | :--- | :--- |
| **XSS Token Exfiltration** | **High Risk**: Any script running on the page can read `localStorage.getItem('token')`. | **Mitigated**: `HttpOnly` flag prevents JavaScript from accessing the cookie. |
| **Immediate Revocation** | **Impossible**: Tokens remain valid until their expiration timestamp, even after user logs out. | **Instant**: Calling logout immediately deletes the session in MongoDB. |
| **Session Invalidation** | **Complex**: Requires distributed blacklists or token revoking infrastructure. | **Native**: A compromised session can be revoked in milliseconds. |
| **Database Compromise** | **High**: Plaintext tokens in DB allow session hijacking. | **Mitigated**: Only SHA-256 cryptographic hashes are stored in the database. |

### Session Token Lifecycle:
1. **Generation**: The server generates 32 bytes of cryptographically secure pseudo-random bytes (`crypto.randomBytes(32).toString('hex')`).
2. **Hashing**: The raw token is hashed via SHA-256 (`crypto.createHash('sha256').update(rawToken).digest('hex')`) before saving to MongoDB.
3. **Cookie Transmission**: The raw token is transmitted to the client inside an `HttpOnly`, `SameSite=Lax`, `Secure` cookie.
4. **Validation**: Incoming requests hash the cookie token and query the database for a matching active session.
5. **Rotation**: Sessions are periodically rotated during active use. A 10-second grace period prevents race conditions when concurrent requests arrive during rotation.

---

## 3. Cross-Site Request Forgery (CSRF) Defense

The application employs a dual-layer CSRF defense without requiring stateful CSRF synchronizer tokens:

### Layer 1: Custom Request Header (`X-Planner-Client`)
All state-changing HTTP requests (`POST`, `PUT`, `DELETE`) require the custom header:
```http
X-Planner-Client: WebApp
```
Under browser Cross-Origin Resource Sharing (CORS) rules, cross-origin web pages cannot attach custom HTTP headers to requests without explicit CORS preflight permission (`OPTIONS`). A malicious website triggering a cross-site form post or image fetch cannot attach this header.

### Layer 2: Strict Origin & Referer Verification
The server's CSRF middleware validates the incoming `Origin` or `Referer` header against the configured `CLIENT_ORIGIN`:
- In local development: `http://localhost:5173`
- In production: `https://guided-annual-planner.vercel.app`
- If an untrusted origin sends a state-changing request, the server immediately halts execution with `403 CSRF_FORBIDDEN: Untrusted request origin`.

---

## 4. Google OpenID Connect Verification

The application integrates Google Identity Services without exposing client secrets:

```
[User clicks Sign in with Google]
         │
         ▼
[Google One Tap / Dialog]
         │ (User consents on Google's domain)
         ▼
[Frontend receives OIDC ID Token]
         │
         ▼
[POST /api/v1/auth/google { credential }]
         │
         ├── googleAuthService.verifyIdToken(credential)
         │   ├── Fetches Google's public certificates (cached via google-auth-library)
         │   ├── Verifies cryptographic signature (RS256)
         │   ├── Validates audience (aud === GOOGLE_CLIENT_ID)
         │   └── Validates expiration (exp > current_time)
         │
         ▼
[Extract googleSub, email, name, avatarUrl]
         │
         ▼
[Find or Create User in MongoDB]
```

At no point does the frontend handle passwords or Google API secrets.

---

## 5. Multi-Tenant Data Isolation

To prevent Insecure Direct Object Reference (IDOR) vulnerabilities:

1. **Session-Bound Identity**: The authenticated user's `userId` is extracted exclusively from the validated database session on the server.
2. **No Client-Supplied User IDs**: Endpoints never accept a `userId` in route parameters or request bodies (e.g. `PUT /planner/daily/:date`, not `PUT /users/:userId/daily/:date`).
3. **Strict Query Scoping**: Every Mongoose query combines the route parameter with the session's user ID:
   ```typescript
   const plan = await DailyPlan.findOne({
     userId: req.session.userId,
     date: req.params.date,
   });
   ```
4. **Tenant-Isolated Backup & Restore**: Backup files are validated and restored strictly to the active session's account, ignoring any user identifiers stored within the JSON payload.

---

## 6. Rate Limiting & Denial-of-Service (DoS) Protection

Authentication endpoints (`/api/v1/auth/google` and `/api/v1/auth/dev-login`) are protected by `express-rate-limit`:
- **Limit**: 15 requests per 15-minute sliding window per IP.
- **Headers**: Standard `RateLimit-*` headers inform clients of remaining attempts.
- **Violation Response**: Returns `429 Too Many Requests` with a clear retry timestamp.

---

## 7. Production Hardening Rules

The server's environment parser (`server/src/config/env.ts`) runs strict assertions at startup:
- **Default Key Prevention**: If `NODE_ENV === 'production'`, the server refuses to boot if `SESSION_SECRET` contains default placeholder strings.
- **Key Length Requirement**: `SESSION_SECRET` must be at least 32 characters long for cryptographic entropy.
- **HTTPS Enforcement**: `COOKIE_SECURE` must be `true` in production to prevent plain HTTP transmission.
- **Dev-Login Lockdown**: The `/dev-login` route immediately rejects requests with `403 DEV_LOGIN_DISABLED` when running in production.
