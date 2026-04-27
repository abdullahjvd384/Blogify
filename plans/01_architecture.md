# 01 — System Architecture

## 1. Scope (MVP, 2.5 weeks)

This plan deliberately cuts the original spec down to what is buildable in 17 working days. Items deferred to a Phase 2 column are listed in `06_timeline.md`.

**In MVP:**
- Auth (email + password, JWT)
- Reader: browse, read, vote (thumbs up/down)
- Writer: draft, submit, edit, view status, view earnings
- AI moderation via GROQ (single-pass + admin override)
- Subscription with Free + 3 paid tiers (quota-enforced)
- ONE Pakistani payment provider integrated end-to-end (JazzCash) + Stripe sandbox for international
- Read tracking (count + simple watch-time heartbeat)
- Admin dashboard (users, articles, moderation, payments, basic analytics)

**Deferred:**
- Comments, follows, search relevance tuning
- Personalized recommendations
- Appeals workflow UI (admin can override; appeals come Phase 2)
- Multi-payment-provider rollout (only JazzCash + Stripe in MVP)
- Mobile app, OAuth login

---

## 2. High-Level Architecture

```
                ┌─────────────────────┐
                │      Browser        │
                │   React SPA (Vite)  │
                └──────────┬──────────┘
                           │ HTTPS / JSON
                           ▼
                ┌─────────────────────┐
                │  Express API (Node) │
                │  - Auth             │
                │  - Articles         │
                │  - Reads/Quota      │
                │  - Payments         │
                │  - Admin            │
                └─┬───────┬─────────┬─┘
                  │       │         │
        ┌─────────▼┐  ┌───▼────┐  ┌─▼──────────┐
        │ MongoDB  │  │ Redis  │  │  BullMQ    │
        │ (Atlas)  │  │ quotas │  │  workers   │
        └──────────┘  │ cache  │  │ (mod jobs) │
                      └────────┘  └─────┬──────┘
                                        │
                                  ┌─────▼─────┐
                                  │ GROQ API  │
                                  └───────────┘

      External: JazzCash, Stripe, Email (Resend), Sentry, Cloudflare CDN
```

---

## 3. Component Breakdown

### 3.1 Frontend (React + Vite)
- **Public site**: home, article view, login, signup, pricing.
- **Reader app**: feed, article reader with paywall + heartbeat client.
- **Writer app**: editor, drafts, submissions, earnings.
- **Admin app**: dashboard, moderation queue, users, payments.
- Shared: design system, auth context, API client, error boundary.

### 3.2 Backend (Node.js + Express)
- **Single monolith**, modular by domain (`/modules/{auth,articles,reads,payments,moderation,admin}`).
- Stateless HTTP servers behind a load balancer (1 instance for MVP, designed to scale horizontally).
- **Worker process** (separate Node entrypoint) for moderation queue and analytics aggregation jobs.

### 3.3 Database (MongoDB Atlas)
- Free tier (M0) for dev; M10 shared for staging/prod.
- Time-series collection for `reads` events.
- Indexes designed up-front (see `04_database_plan.md`).

### 3.4 Cache & Queue (Redis — Upstash)
- Redis is **required**, not optional. It powers:
  - Per-user daily quota counters (TTL = end-of-day in user TZ)
  - BullMQ for moderation jobs
  - Rate limiting (login, signup, submit)
  - Hot article cache

### 3.5 External Services
| Concern | Service |
|---|---|
| AI inference | GROQ (with OpenAI fallback key) |
| Email | Resend |
| PK payments | JazzCash Merchant API |
| Intl payments | Stripe (test mode in MVP) |
| Error tracking | Sentry |
| Hosting (API) | Render or Railway |
| Hosting (web) | Vercel |
| File storage | Cloudflare R2 |
| Logs | Better Stack (free tier) |

---

## 4. Data Flow Diagrams

### 4.1 Read an Article (with paywall)
```
User clicks article
   → GET /api/articles/:slug
       → Auth middleware (parse JWT, attach user)
       → Quota middleware:
           Redis INCR quota:{userId}:{YYYY-MM-DD-tz}
           If > plan.daily_limit → 402 Payment Required
       → Fetch article (cached in Redis, 60s TTL)
       → Return article
   → Client opens reader
       → POST /api/reads/start  → returns sessionId
       → Every 15s: POST /api/reads/heartbeat {sessionId}
       → On unmount: POST /api/reads/end {sessionId}
```

### 4.2 Publish an Article
```
Writer clicks "Submit"
   → POST /api/articles/:id/submit
       → Validate (length, not empty, owner)
       → Update status = 'submitted'
       → Enqueue BullMQ job 'moderate-article' { articleId }
       → Return 202 Accepted
Worker picks up job
   → Build prompt (system + policy + article)
   → Call GROQ structured output
   → Parse {verdict, confidence, reasons, tags}
   → If verdict=approved & conf>0.85 → status='published', publish_at=now
   → If verdict=rejected & conf>0.85 → status='rejected', store reasons
   → Else → status='needs_review' → admin queue
   → Send email to writer
```

### 4.3 Subscription Purchase (JazzCash)
```
User clicks "Upgrade"
   → POST /api/payments/checkout {plan}
       → Create internal payment record (status=pending)
       → Build JazzCash signed payload
       → Return redirect URL + form fields
User redirected to JazzCash → pays → JazzCash redirects back
   → POST /api/payments/webhook/jazzcash
       → Verify signature
       → Idempotency: skip if txn already processed
       → Update payment record (status=success)
       → Activate subscription (period_start, period_end)
       → Update user.daily_limit
   → Frontend polls GET /api/payments/:id until success
```

---

## 5. Key Design Decisions & Trade-offs

| Decision | Rationale | Trade-off Accepted |
|---|---|---|
| Monolith over microservices | Faster to build, easier to deploy in 2.5 weeks | Will refactor when scaling beyond 50k users |
| MongoDB over Postgres | Spec mandates MongoDB; flexible schema for articles | Lose relational integrity guarantees |
| Redis quota counters (not Mongo) | Atomic INCR, TTL-based reset, no thundering herd at midnight | Extra dependency to operate |
| BullMQ over a custom job table | Battle-tested, retries, DLQ included | Locks us to Redis |
| Stateless JWT auth | Horizontal scaling without sticky sessions | Logout-everywhere needs token blocklist (Redis) |
| Single payment provider in MVP (JazzCash) | Reduces integration risk | Other PK methods deferred — explicitly communicate to users |
| Heartbeat read-tracking, not WebSocket | Simpler, no socket scaling concerns | Slightly less precise, ~15s granularity |
| Server-side paywall enforcement | Cannot be bypassed by client manipulation | Every read endpoint must apply middleware |
| Vite + React (no Next.js) | Faster MVP, no SSR complexity | Lose SEO benefits — accept for MVP, plan SSR migration |
| Soft-delete everywhere | Recoverability, audit trail | Slightly larger DB |

---

## 6. Non-Functional Targets (MVP)

- **API p95 latency**: < 300ms for read endpoints (cached), < 800ms for writes.
- **Availability**: 99% (single region acceptable for MVP).
- **Concurrent users**: design for 1,000; load test to 5,000.
- **Moderation latency**: < 30 seconds end-to-end for 95% of articles.
- **Time-to-first-byte (frontend)**: < 1.5s on 3G.

---

## 7. Security Posture

- HTTPS everywhere (enforced by host).
- JWT in `httpOnly` cookies (not localStorage) to prevent XSS theft.
- CSRF protection via SameSite=Lax + double-submit token on mutating routes.
- bcrypt (cost 12) for passwords.
- Rate limit: 5 login attempts / 15 min / IP.
- Helmet + CORS allowlist.
- Input validation with Zod on every route.
- Webhook signatures verified for all payment callbacks.
- Secrets via env vars only; never committed; managed via host's secret store.
