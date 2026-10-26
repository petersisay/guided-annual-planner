# Guided Annual Planner — REST API Reference

**Base URL (Production)**: `https://guided-annual-planner.vercel.app/api/v1`  
**Base URL (Direct Backend)**: `https://guided-annual-planner.onrender.com/api/v1`  
**Local Development**: `http://localhost:5000/api/v1`

---

## 1. Global Standards & Protocols

### Content Type & Encoding
- All request and response bodies use `application/json; charset=utf-8`.

### Required Headers
State-changing requests (`POST`, `PUT`, `DELETE`) require the custom client identification header to mitigate Cross-Site Request Forgery (CSRF):

```http
X-Planner-Client: WebApp
Content-Type: application/json
```

Requests that alter planner records also accept optional headers for concurrency control and idempotency:
- `X-Mutation-Id: <uuid>` — Unique client-generated mutation identifier preventing duplicate execution upon network retry.
- `If-Match: <timestamp>` or body `expectedUpdatedAt` — Timestamp used to detect concurrent edits across multiple devices.

### Standard Response Envelope
All API responses follow a consistent format:

```json
// Successful Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "CONCURRENT_MODIFICATION_CONFLICT",
    "message": "The record was modified on another device.",
    "details": { ... }
  }
}
```

### Common HTTP Status Codes
| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | Request succeeded and returned data. |
| `201 Created`| Created | Resource created successfully. |
| `400 Bad Request` | Validation Error | Payload failed Zod schema validation. |
| `401 Unauthorized` | Auth Required | Session cookie missing, expired, or invalid. |
| `403 Forbidden` | CSRF / Forbidden | Missing `X-Planner-Client` header or mismatched `Origin`. |
| `404 Not Found` | Not Found | Resource not found or belonging to another user. |
| `409 Conflict` | Concurrency Conflict | Record was modified after client's `expectedUpdatedAt`. |
| `429 Too Many Requests` | Rate Limited | Exceeded rate limit (15 auth attempts / 15 min). |
| `500 Server Error` | Internal Error | Unhandled server error. |

---

## 2. Health Check

### Check API Health
```http
GET /health
```
**Response (`200 OK`)**:
```json
{
  "status": "ok",
  "service": "guided-annual-planner-api",
  "timestamp": "2026-10-27T00:00:00.000Z"
}
```

---

## 3. Authentication & Sessions (`/auth`)

### 1. Google OAuth Sign-In
Verifies a Google One Tap / Sign-In credential and establishes a database-backed session cookie.
```http
POST /api/v1/auth/google
```
**Rate Limit**: 15 requests per 15 minutes per IP.  
**Request Body**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```
**Response (`200 OK`)**:
- Sets `HttpOnly`, `SameSite=Lax`, `Secure` cookie `planner_session=<session_token>`.
```json
{
  "success": true,
  "user": {
    "id": "670c1a2b...",
    "email": "user@example.com",
    "name": "Peter Sisay",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "preferences": {
      "weekStart": "Monday",
      "defaultCurrency": "USD",
      "theme": "paper"
    }
  }
}
```

### 2. Get Current Authenticated User
```http
GET /api/v1/auth/me
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "user": {
    "id": "670c1a2b...",
    "email": "user@example.com",
    "name": "Peter Sisay",
    "preferences": { "weekStart": "Monday" }
  }
}
```

### 3. Log Out
Destroys the server session in MongoDB and clears the browser cookie.
```http
POST /api/v1/auth/logout
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 4. Annual Horizon (`/planner/annual`)

### 1. Get Annual Plan
```http
GET /api/v1/planner/annual/:year
```
**Parameters**:
- `year` *(integer, e.g. `2026`)*

**Response (`200 OK`)**:
```json
{
  "success": true,
  "plan": {
    "id": "plan_123",
    "year": 2026,
    "themeOrWord": "Compounding Craft",
    "annualIntentions": [
      "Ship portfolio project",
      "Read 24 books",
      "Daily meditation"
    ],
    "annualReview": {
      "celebrations": "Launched Guided Annual Planner",
      "challenges": "Balancing full-time work and side projects",
      "lessonsLearned": "Small daily consistency wins over sudden sprints"
    },
    "updatedAt": "2026-10-26T12:00:00.000Z"
  }
}
```

### 2. Update Annual Plan
```http
PUT /api/v1/planner/annual/:year
```
**Request Body**:
```json
{
  "themeOrWord": "Compounding Craft",
  "annualIntentions": ["Ship portfolio project", "Read 24 books"],
  "annualReview": {
    "celebrations": "Launched Guided Annual Planner"
  },
  "expectedUpdatedAt": "2026-10-26T12:00:00.000Z"
}
```

---

## 5. Monthly Intentions (`/planner/monthly`)

### 1. Get Monthly Plan
```http
GET /api/v1/planner/monthly/:year/:month
```
**Parameters**:
- `year` *(integer, e.g. `2026`)*
- `month` *(integer `1`-`12`)*

**Response (`200 OK`)**:
```json
{
  "success": true,
  "plan": {
    "year": 2026,
    "month": 10,
    "mustDos": [
      { "id": "m1", "text": "Deploy production release", "completed": true }
    ],
    "newHabits": [
      { "id": "h1", "text": "Morning reflection", "completed": false }
    ],
    "toBuyList": [
      { "id": "b1", "text": "Notebook refills", "completed": false }
    ],
    "booksToRead": [
      { "id": "bk1", "title": "Atomic Habits", "author": "James Clear", "colorHex": "#7A9A48", "completed": true }
    ],
    "selfChangeReflection": "Focus on deliberate execution over premature optimization.",
    "dayNotes": {
      "2026-10-14": "Milestone design completed."
    },
    "updatedAt": "2026-10-26T14:30:00.000Z"
  }
}
```

### 2. Update Monthly Plan
```http
PUT /api/v1/planner/monthly/:year/:month
```

---

## 6. Weekly 7-Day Spread (`/planner/weekly`)

### 1. Get Weekly Plan
```http
GET /api/v1/planner/weekly/:year/:week
```
**Parameters**:
- `year` *(integer, e.g. `2026`)*
- `week` *(integer `1`-`53`, ISO 8601 week)*

**Response (`200 OK`)**:
```json
{
  "success": true,
  "plan": {
    "year": 2026,
    "week": 43,
    "topPriorities": [
      { "id": "wp1", "text": "Complete accessibility audit", "completed": true }
    ],
    "dailyTasks": {
      "2026-10-26": [
        { "id": "dt1", "text": "Verify WCAG 2.2 color contrast", "completed": true }
      ]
    },
    "weeklyReview": "All 202 unit tests verified and passing.",
    "updatedAt": "2026-10-26T16:00:00.000Z"
  }
}
```

### 2. Update Weekly Plan
```http
PUT /api/v1/planner/weekly/:year/:week
```

---

## 7. Daily Focus & Evening Journal (`/planner/daily`)

### 1. Get Daily Plan
```http
GET /api/v1/planner/daily/:date
```
**Parameters**:
- `date` *(string, `YYYY-MM-DD`, e.g. `2026-10-26`)*

**Response (`200 OK`)**:
```json
{
  "success": true,
  "plan": {
    "date": "2026-10-26",
    "topPriorities": [
      { "id": "dp1", "text": "Audit reduced motion preference", "completed": true },
      { "id": "dp2", "text": "Upgrade portfolio documentation", "completed": true },
      { "id": "dp3", "text": "Run full test suite", "completed": true }
    ],
    "secondaryTasks": [
      { "id": "st1", "text": "Review pull request comments", "completed": false }
    ],
    "scheduleBlocks": [
      { "time": "08:00", "activity": "Morning review", "completed": true },
      { "time": "14:00", "activity": "Deep work session", "completed": true }
    ],
    "journal": {
      "gratitude": ["Quiet mornings", "Reliable automated tests", "Tea"],
      "wins": ["Passed 202 tests across workspaces"],
      "challengesAndLessons": "Ensure all async tasks are given adequate timeouts in PowerShell.",
      "freeReflection": "A calm workspace enables high quality software engineering."
    },
    "updatedAt": "2026-10-26T18:00:00.000Z"
  }
}
```

### 2. Update Daily Plan
```http
PUT /api/v1/planner/daily/:date
```

---

## 8. Consistency Trackers (`/trackers`)

### 1. Mood Tracker
- `GET /api/v1/trackers/mood/:year` — Returns all mood records for given year.
- `POST /api/v1/trackers/mood` — Upserts mood entry:
  ```json
  {
    "date": "2026-10-26",
    "moodKey": "radiant",
    "note": "Great focus today!"
  }
  ```
- `DELETE /api/v1/trackers/mood/:date` — Clears mood record for date.

### 2. Habit Tracker
- `GET /api/v1/trackers/habits` — Returns list of active habits and their completed date sets.
- `POST /api/v1/trackers/habits` — Creates a habit:
  ```json
  { "title": "Read 20 mins", "colorHex": "#7A9A48" }
  ```
- `PUT /api/v1/trackers/habits/:id` — Updates habit metadata.
- `POST /api/v1/trackers/habits/:id/toggle` — Toggles habit date:
  ```json
  { "date": "2026-10-26" }
  ```
- `DELETE /api/v1/trackers/habits/:id` — Deletes habit.

---

## 9. Backup & Disaster Recovery (`/backup`)

### 1. Export Complete Backup
```http
GET /api/v1/backup/export
```
Returns a downloadable JSON archive containing all user records across all years and days.

### 2. Validate Backup Payload
```http
POST /api/v1/backup/validate
```
Validates an uploaded JSON file against the Zod backup schema and returns preview item counts without writing to the database:
```json
{
  "success": true,
  "preview": {
    "annualPlansCount": 2,
    "monthlyPlansCount": 12,
    "weeklyPlansCount": 52,
    "dailyPlansCount": 180,
    "habitsCount": 5,
    "moodEntriesCount": 180
  }
}
```

### 3. Restore Backup
```http
POST /api/v1/backup/restore
```
Applies the validated backup payload transactionally to the authenticated user's account.
