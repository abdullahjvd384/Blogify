# 02 — Backend Plan

## 1. Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4
- **Validation**: Zod
- **ORM**: Mongoose 8
- **Queue**: BullMQ (Redis backend)
- **Auth**: jsonwebtoken + bcrypt
- **Logging**: pino + pino-http
- **Config**: dotenv + zod-validated config object
- **Testing**: Vitest + Supertest

## 2. Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.js            # zod-validated env loader
│   │   ├── db.js             # Mongoose connect
│   │   ├── redis.js          # ioredis client
│   │   └── logger.js         # pino instance
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validators.js
│   │   ├── users/
│   │   ├── articles/
│   │   ├── reads/
│   │   ├── moderation/
│   │   ├── subscriptions/
│   │   ├── payments/
│   │   ├── admin/
│   │   └── analytics/
│   ├── middleware/
│   │   ├── auth.js           # JWT verify, attach req.user
│   │   ├── roles.js          # requireRole('admin')
│   │   ├── quota.js          # daily quota enforcement
│   │   ├── rateLimit.js      # express-rate-limit configs
│   │   ├── validate.js       # zod schema runner
│   │   ├── error.js          # central error handler
│   │   └── notFound.js
│   ├── models/               # Mongoose schemas (one file per collection)
│   ├── jobs/
│   │   ├── queue.js          # BullMQ queue definitions
│   │   ├── workers/
│   │   │   ├── moderationWorker.js
│   │   │   └── analyticsWorker.js
│   │   └── scheduler.js      # cron-like recurring jobs
│   ├── integrations/
│   │   ├── groq.js
│   │   ├── jazzcash.js
│   │   ├── stripe.js
│   │   ├── resend.js
│   │   └── r2.js
│   ├── utils/
│   │   ├── errors.js         # AppError, NotFoundError, etc.
│   │   ├── slug.js
│   │   ├── timezone.js
│   │   └── crypto.js
│   ├── app.js                # Express app assembly
│   └── server.js             # http.createServer + signal handling
├── workers/
│   └── index.js              # entrypoint for BullMQ workers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── .env.example
├── package.json
└── README.md
```

## 3. API Design

All routes prefixed with `/api/v1`. JSON in/out. Errors follow consistent shape:
```
{ "error": { "code": "QUOTA_EXCEEDED", "message": "...", "details": {} } }
```

### 3.1 Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/signup` | – | email, password, name, timezone |
| POST | `/auth/login` | – | sets httpOnly cookies |
| POST | `/auth/logout` | user | clears cookies + revokes refresh |
| POST | `/auth/refresh` | refresh-cookie | rotates tokens |
| POST | `/auth/verify-email` | – | token in query |
| POST | `/auth/forgot-password` | – | sends email |
| POST | `/auth/reset-password` | – | token + new password |
| GET  | `/auth/me` | user | returns profile + plan |

### 3.2 Articles (public + writer)
| Method | Path | Auth |
|---|---|---|
| GET | `/articles` | – | feed, paginated, filters: tag, sort |
| GET | `/articles/:slug` | optional | quota-checked if logged in |
| POST | `/articles` | writer | create draft |
| PATCH | `/articles/:id` | owner | edit draft or republish |
| POST | `/articles/:id/submit` | owner | enqueue moderation |
| GET | `/articles/mine` | writer | my drafts/published/rejected |
| POST | `/articles/:id/vote` | reader | { vote: 1 \| -1 } |
| DELETE | `/articles/:id/vote` | reader | remove vote |

### 3.3 Reads
| POST | `/reads/start` | reader | { articleId } → { sessionId } |
| POST | `/reads/heartbeat` | reader | { sessionId } |
| POST | `/reads/end` | reader | { sessionId } |

### 3.4 Subscriptions & Payments
| GET | `/subscriptions/plans` | – | static list |
| GET | `/subscriptions/me` | user | current plan, period, daily_limit, usage |
| POST | `/payments/checkout` | user | { plan, provider } → redirect data |
| POST | `/payments/webhook/jazzcash` | – | signature-verified |
| POST | `/payments/webhook/stripe` | – | signature-verified |
| GET | `/payments/:id` | user | poll status |
| POST | `/subscriptions/cancel` | user | cancel-at-period-end |

### 3.5 Admin (role=admin)
| GET | `/admin/users` | filters, pagination |
| PATCH | `/admin/users/:id` | { banned, role, plan_override } |
| GET | `/admin/articles` | filters by status |
| PATCH | `/admin/articles/:id` | override moderation, remove |
| GET | `/admin/moderation/queue` | needs_review items |
| POST | `/admin/moderation/:id/decide` | { verdict, reason } |
| GET | `/admin/payments` | reconciliation view |
| GET | `/admin/analytics/overview` | reads, revenue, DAU |

### 3.6 Writer Earnings
| GET | `/writer/earnings/summary` | total, pending, paid |
| GET | `/writer/earnings/articles` | per-article breakdown |

## 4. Authentication & Authorization

### 4.1 Tokens
- **Access token**: JWT, 15 min expiry, httpOnly cookie `access_token`.
- **Refresh token**: opaque random 64-byte token, 30 day expiry, httpOnly cookie `refresh_token`. Stored hashed in `refresh_tokens` collection with `user_id`, `expires_at`, `revoked_at`, `device_fingerprint`.
- Rotate refresh on every use; revoke previous.

### 4.2 Middleware
- `authRequired`: parse access token; if expired, allow client to call `/auth/refresh`.
- `authOptional`: attach user if present, else continue.
- `requireRole('admin' | 'writer')`: 403 if missing.
- `requireVerifiedEmail`: blocks publishing & paid actions.

### 4.3 Authorization Rules
- Article edit/delete: only owner or admin.
- Vote: any verified reader, once per article.
- Admin endpoints: role=admin only.
- Writer earnings: only own data; admin can view all.

## 5. Middleware Design

Order in app.js:
```
helmet → cors(allowlist) → cookieParser → bodyParser
→ requestId → pinoHttp → rateLimit (global)
→ routes
→ notFound → errorHandler
```

### Specialized
- **`quota`** middleware on `GET /articles/:slug`: increments Redis counter, denies if over plan limit.
- **`rateLimit`**: per-route configs — login (5/15min/IP), signup (3/hour/IP), submit-article (10/hour/user), vote (60/min/user).
- **`validate(schema)`**: runs Zod parse on `req.body | params | query`, attaches typed result to `req.valid`.

## 6. Error Handling Strategy

- Custom `AppError` class with `statusCode`, `code`, `message`, `details`.
- Subclasses: `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `QuotaExceededError`, `PaymentError`.
- Controllers throw; central error middleware formats JSON response.
- Async route wrapper (`asyncHandler`) to forward thrown errors to `next`.
- Mongoose validation errors mapped to 400 with field-level details.
- Unknown errors → 500 + Sentry capture; do not leak stack to client.
- All errors logged with `requestId` for traceability.

## 7. Validation

- Zod schemas co-located in each module's `*.validators.js`.
- Examples: `signupSchema`, `createArticleSchema`, `voteSchema`.
- Validators are the source of truth — never trust raw `req.body` in services.

## 8. Service Layer

- Controllers are thin: parse → call service → respond.
- Services contain business logic; receive plain typed objects, never `req`/`res`.
- Services orchestrate models, integrations, and queue enqueues.
- This makes services unit-testable without HTTP.

## 9. Background Jobs

### 9.1 Queues (BullMQ)
- `moderation` — process article submissions
- `email` — outbound transactional email
- `analytics-rollup` — nightly aggregation
- `payouts` — monthly writer payout calculation (Phase 2; placeholder in MVP)

### 9.2 Schedulers
- `quota-cleanup`: belt-and-braces — Redis TTL handles reset, but a daily sweep removes orphaned keys.
- `expire-subscriptions`: nightly, downgrades expired subs to free.
- `analytics-rollup`: nightly at 02:00 UTC, computes per-article daily stats.
- `payment-reconciliation`: nightly, fetches recent JazzCash/Stripe txns and reconciles.

## 10. Scalability Considerations (MVP-realistic)

- **Stateless API** — scales by adding instances; sessions in Redis.
- **Read-heavy caching**: published articles cached by slug in Redis (60s TTL). Bust on edit.
- **Pagination**: cursor-based (by `_id` or `published_at`), not offset, for feed.
- **Indexes** declared in schemas (see `04_database_plan.md`).
- **Heartbeat write absorption**: heartbeats go to Redis (Sorted Set per session); persist to Mongo on `read_end` only. This prevents Mongo write storms.
- **Connection pooling**: Mongoose pool size 20 per instance.
- **Graceful shutdown**: SIGTERM → drain HTTP, then close BullMQ workers, then close DB.

## 11. Configuration

`.env.example`:
```
NODE_ENV=development
PORT=4000
MONGO_URI=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
COOKIE_DOMAIN=localhost
CLIENT_ORIGIN=http://localhost:5173
GROQ_API_KEY=
GROQ_MODERATION_MODEL=llama-3.3-70b-versatile
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
JAZZCASH_RETURN_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SENTRY_DSN=
LOG_LEVEL=info
```

All loaded once via `config/env.js` and validated with Zod at boot. App refuses to start on invalid config.
