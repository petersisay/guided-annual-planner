# Guided Annual Planner — Data Models & Schemas

**Database**: MongoDB Atlas Replica Set (M0)  
**ORM**: Mongoose 8  
**Validation Layer**: Shared Zod 3 Schemas (`@planner/shared`)

---

## 1. Overview of Data Architecture

The data architecture is designed for **strict multi-tenant isolation**, **conflict-free compound indexing**, and **zero-loss JSON portability**:

1. **User Scoping**: Every document in the database (with the exception of global system health) contains a foreign key `userId: ObjectId` referencing the `User` collection.
2. **Compound Unique Indexes**: Business constraints (e.g. exactly one daily plan per user per calendar day) are enforced at the database index layer to prevent duplicate creation race conditions.
3. **Optimistic Timestamps**: All planning documents record Mongoose `timestamps: true` (`createdAt` and `updatedAt`). The `updatedAt` field is compared against the client's `expectedUpdatedAt` for concurrency detection.
4. **Idempotency & TTLs**: Processed mutations and expired sessions use MongoDB Time-To-Live (TTL) indexes to automatically purge stale records without manual cron cleanup.

---

## 2. Collection Schemas & Models

### 1. User (`users`)
Represents an authenticated user profile linked to a Google OpenID Connect subject (`sub`).

```typescript
interface IUserDocument extends Document {
  _id: Types.ObjectId;
  googleSub: string;           // Unique Google OIDC Subject ID (indexed, unique)
  email: string;               // Normalized lowercase email (indexed, unique)
  name: string;                // Full user display name
  avatarUrl?: string;          // Google profile picture URL
  preferences: UserPreferences;// Nested display & planning preferences
  lastLoginAt: Date;           // Timestamp of most recent session creation
  createdAt: Date;
  updatedAt: Date;
}
```

#### Nested `UserPreferences`:
| Field | Type | Default | Valid Values | Description |
| :--- | :--- | :--- | :--- | :--- |
| `weekStart` | `string` | `"monday"` | `"monday"`, `"sunday"` | First column of weekly & daily calendar grids. |
| `weeklyViewDefault` | `string` | `"7day"` | `"7day"`, `"5day"` | Default layout mode for weekly planner. |
| `defaultCurrency` | `string` | `"USD"` | Max 5 characters | Currency label for monthly To-Buy cards. |
| `theme` | `string` | `"paper-warm"` | `"paper-warm"`, `"paper-editorial"` | Paper journal styling theme. |
| `prefersReducedMotion`| `boolean`| `false` | `true`, `false` | Disables cursor particles & click ripples. |
| `onboardingStatus` | `string` | `"not_started"`| `"not_started"`, `"completed"` | Guided onboarding flow status. |
| `onboardingStep` | `number` | `1` | `1`-`5` | Current active tour step. |
| `defaultYear` | `number` | Current year | e.g. `2026` | Default year loaded upon initial visit. |

**Indexes**:
- `{ googleSub: 1 }` (unique)
- `{ email: 1 }` (unique)

---

### 2. Session (`sessions`)
Represents an active authenticated browser session. Tokens are stored as one-way SHA-256 cryptographic hashes.

```typescript
interface ISessionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // Ref: User (indexed)
  sessionTokenHash: string;     // SHA-256 hex digest of cookie secret (unique, indexed)
  previousTokenHash?: string;   // Retained during grace period for atomic rotation
  gracePeriodExpiresAt?: Date;  // Rotation expiration (10 seconds)
  userAgent?: string;           // Browser User-Agent header for audit logging
  ipAddress?: string;           // Client IP address
  expiresAt: Date;              // Rolling session expiration (7 days, TTL indexed)
  absoluteExpiresAt: Date;      // Hard maximum session lifetime (30 days)
  lastRotatedAt: Date;          // Timestamp of last token rotation
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ sessionTokenHash: 1 }` (unique)
- `{ userId: 1 }`
- `{ expiresAt: 1 }` with `{ expireAfterSeconds: 0 }` (automatic MongoDB TTL garbage collection)

---

### 3. AnnualPlan (`annualplans`)
Stores annual horizon goals, guiding themes, and retrospective reviews.

```typescript
interface IAnnualPlanDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // Ref: User
  year: number;                 // e.g. 2026
  themeOrWord: string;          // Single guiding anchor word (max 100 chars)
  annualIntentions: string[];   // Milestone intentions (max 10 items, max 300 chars each)
  annualReview: {
    celebrations: string;       // Year-end accomplishments (max 5000 chars)
    challenges: string;         // Obstacles encountered (max 5000 chars)
    lessonsLearned: string;     // Lessons and insights (max 5000 chars)
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ userId: 1, year: 1 }` (compound, unique)

---

### 4. MonthlyPlan (`monthlyplans`)
Stores monthly goals, habits, shopping inventory, reading lists, reflections, and calendar day notes.

```typescript
interface IMonthlyPlanDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // Ref: User
  year: number;                 // e.g. 2026
  month: number;                // 1 through 12
  mustDos: Array<{              // Top 6 monthly non-negotiables
    id: string;
    text: string;
    completed: boolean;
  }>;
  newHabits: Array<{            // 5 monthly target habits
    id: string;
    text: string;
    completed: boolean;
  }>;
  toBuyList: Array<{            // To-Buy inventory list
    id: string;
    text: string;
    completed: boolean;
  }>;
  booksToRead: Array<{          // 5-book interactive bookshelf
    id: string;
    title: string;
    author: string;
    colorHex: string;           // Hex color for the book spine
    completed: boolean;
  }>;
  selfChangeReflection: string; // Reflection on mental models to unlearn
  dayNotes: Map<string, string>;// Key: YYYY-MM-DD, Value: Note text
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ userId: 1, year: 1, month: 1 }` (compound, unique)

---

### 5. WeeklyPlan (`weeklyplans`)
Stores weekly focus priorities and daily spreads adhering to the Rule of 3.

```typescript
interface IWeeklyPlanDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // Ref: User
  year: number;                 // e.g. 2026
  week: number;                 // 1 through 53 (ISO 8601 week number)
  topPriorities: Array<{        // Rule of 3 weekly focus
    id: string;
    text: string;
    completed: boolean;
  }>;
  dailyTasks: Map<string, Array<{ // Key: YYYY-MM-DD
    id: string;
    text: string;
    completed: boolean;
  }>>;
  weeklyReview: string;         // End-of-week reflection
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ userId: 1, year: 1, week: 1 }` (compound, unique)

---

### 6. DailyPlan (`dailyplans`)
The core daily focus spread combining priorities, schedule intervals, and a 4-part evening gratitude journal.

```typescript
interface IDailyPlanDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // Ref: User
  date: string;                 // Format: YYYY-MM-DD (e.g. "2026-10-26")
  year: number;
  month: number;
  isoWeek: number;
  intention: string;            // Daily morning intention
  primaryPriorities: Array<{    // The Rule of 3 (exactly 3 items enforced)
    id: string;
    text: string;
    done: boolean;
  }>;
  additionalTasks: Array<{      // Secondary checklist items
    id: string;
    text: string;
    done: boolean;
  }>;
  schedule: Array<{             // Hourly timeline blocks
    id: string;
    timeSlot: string;           // e.g. "08:00", "14:30"
    activity: string;
    done: boolean;
  }>;
  reflection: string;           // General daily notes
  journal: {                    // Structured 4-part evening journal
    gratitude: [string, string, string]; // Exactly 3 distinct ruled prompts
    wins: string;               // Celebrating small victories
    challengesAndLessons: string;// Reframing daily friction
    freeWriting: string;        // Open reflective journal space
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ userId: 1, date: 1 }` (compound, unique)
- `{ userId: 1, year: 1, month: 1 }`

---

### 7. ProcessedMutation (`processedmutations`)
Maintains an idempotent log of mutations executed by the sync engine, preventing duplicate updates caused by network retries.

```typescript
interface IProcessedMutationDocument extends Document {
  _id: Types.ObjectId;
  mutationId: string;           // Client-generated UUID (indexed, unique)
  userId: Types.ObjectId;       // Ref: User
  endpoint: string;             // Mutated API endpoint
  method: string;               // HTTP method: POST, PUT, DELETE
  responseStatus: number;       // Status code returned to client (e.g. 200, 201)
  responseBody: any;            // Cached response returned to client on retry
  processedAt: Date;            // TTL indexed (purged after 24 hours)
}
```

**Indexes**:
- `{ mutationId: 1 }` (unique)
- `{ processedAt: 1 }` with `{ expireAfterSeconds: 86400 }` (24-hour TTL)

---

## 3. Complete Backup Archive JSON Format

When a user exports their data (`GET /api/v1/backup/export`), the server emits a validated JSON document matching the `@planner/shared` schema:

```json
{
  "version": "1.0",
  "exportedAt": "2026-10-26T20:00:00.000Z",
  "user": {
    "name": "Peter Sisay",
    "email": "user@example.com",
    "preferences": {
      "weekStart": "monday",
      "defaultCurrency": "USD",
      "theme": "paper-warm"
    }
  },
  "annualPlans": [ ... ],
  "monthlyPlans": [ ... ],
  "weeklyPlans": [ ... ],
  "dailyPlans": [ ... ],
  "habits": [ ... ],
  "moodEntries": [ ... ]
}
```

### Validation on Restore:
Before any backup data is applied:
1. The server passes the JSON payload through `BackupRestoreSchema.parse()`.
2. Any malformed structure (e.g. invalid date formats, missing required IDs) throws a `400 ZOD_VALIDATION_ERROR` with detailed field paths.
3. Once validated, all document updates execute within a database transaction or sequentially per user scope, guaranteeing that partial corruptions never occur.
