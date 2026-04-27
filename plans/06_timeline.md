# 06 — Timeline (2.5 weeks = 17 working days)

> Assumption: 1 coding agent (or 1 dev + agent), 8 productive hours/day. If multiple devs, parallelize the marked `[parallel-ok]` tasks.

## High-Level Milestones

| Milestone | Day |
|---|---|
| M1 — Skeleton runs end-to-end (auth + 1 article) | Day 4 |
| M2 — Reader + Writer flows complete (no payments) | Day 9 |
| M3 — Payments + quotas + moderation live | Day 13 |
| M4 — Admin + analytics + polish | Day 15 |
| M5 — Testing, deployment, bug fix | Day 17 |

---

## Week 1 — Foundations & Core Domain (Days 1–6)

### Day 1 — Setup & Skeleton
- [ ] Init monorepo with workspaces; commit folder layout.
- [ ] Set up ESLint + Prettier + EditorConfig.
- [ ] `docker-compose.yml` with mongo + redis.
- [ ] Server: Express skeleton, config loader (Zod), pino logger, error middleware, health check `/healthz`.
- [ ] Client: Vite + React + Tailwind + shadcn install. Single placeholder route.
- [ ] CI: lint + build workflow on PR.
- **Done when**: `npm run dev` boots client, server, mongo, redis; `/healthz` returns 200.

### Day 2 — Auth System
- [ ] User + refresh_token schemas.
- [ ] Signup, login, logout, refresh, me, verify-email endpoints.
- [ ] Email integration (Resend) — verification + reset emails.
- [ ] `authRequired`, `authOptional`, `requireRole` middleware.
- [ ] Cookie config (httpOnly, SameSite, Secure in prod).
- [ ] Tests: unit (services) + integration (signup→login→me happy path).

### Day 3 — Frontend Auth Shell
- [ ] Axios client with refresh interceptor.
- [ ] Auth pages: signup, login, verify-email, forgot/reset.
- [ ] `useMe()` hook + Zustand authStore hydration.
- [ ] Protected route component.
- [ ] Layouts: PublicLayout, AppLayout, AdminLayout.
- [ ] Toaster + ErrorBoundary.

### Day 4 — Article Domain (CRUD)
- [ ] Article + article_versions schemas.
- [ ] Routes: create draft, edit draft, get mine, get by slug, list (feed), delete.
- [ ] Slug generation + uniqueness handling.
- [ ] Authorization: only owner edits; admin overrides.
- [ ] Seed script: 1 admin + 10 sample articles.
- **M1 done**: a logged-in user can create a draft and read another user's published article.

### Day 5 — Writer Editor (Frontend)
- [ ] TipTap editor integration + toolbar.
- [ ] EditorPage: load draft, autosave (debounced), submit button (stub).
- [ ] DraftsPage: list of writer's articles with status badges.
- [ ] Empty + loading + error states.

### Day 6 — Reader Feed & Article Page
- [ ] FeedPage with infinite scroll (cursor pagination).
- [ ] ArticleCard component.
- [ ] ArticlePage: render content, vote buttons, author byline.
- [ ] Vote endpoint + frontend wiring.
- [ ] Basic search by tag (query param filter).

---

## Week 2 — Moderation, Payments, Quotas (Days 7–13)

### Day 7 — Moderation Pipeline (Backend)
- [ ] BullMQ queue setup; worker entrypoint.
- [ ] GROQ integration with structured output prompt for moderation.
- [ ] `/articles/:id/submit` enqueues job.
- [ ] Worker: call GROQ, parse, update article status, store moderation_jobs record.
- [ ] Email writer on verdict.
- [ ] Tests: mock GROQ; verify state transitions.

### Day 8 — Moderation Edge Cases & Tags
- [ ] GROQ tag suggestion: merge with existing tag taxonomy.
- [ ] Confidence threshold → needs_review state.
- [ ] Retry policy (3 attempts, exponential backoff, DLQ).
- [ ] GROQ failure fallback: route to needs_review.
- [ ] Writer dashboard: show rejection reasons.

### Day 9 — Quota & Subscription Foundations
- [ ] Subscription schema; default-create `free` sub on signup.
- [ ] `quota` middleware: Redis INCR with TTL = end-of-day in user TZ.
- [ ] Plans constants + `/subscriptions/plans` endpoint.
- [ ] `/subscriptions/me` returns plan + usage.
- [ ] PaywallModal frontend; show countdown.
- **M2 done**: full reader + writer flows except paid upgrade.

### Day 10 — Read Tracking
- [ ] `/reads/start`, `/reads/heartbeat`, `/reads/end` endpoints.
- [ ] Redis session state during read; persist to Mongo time-series on end.
- [ ] Frontend heartbeat client (visibility + activity gated, sendBeacon on close).
- [ ] Server-side validation: cap watch time, mark fraud_score.
- [ ] Update article stats_snapshot on read_end.

### Day 11 — JazzCash Integration
- [ ] JazzCash sandbox credentials, signing helper.
- [ ] `/payments/checkout` builds payload + returns redirect.
- [ ] `/payments/webhook/jazzcash` with signature verify + idempotency.
- [ ] Activate subscription on success; update user.daily_limit.
- [ ] Frontend: PricingPage + checkout flow + status polling.

### Day 12 — Stripe Integration + Reconciliation
- [ ] Stripe checkout session for international cards.
- [ ] Webhook handler with signature verify.
- [ ] Subscription cancel-at-period-end endpoint.
- [ ] Daily reconciliation job (cron) — log mismatches.
- [ ] Frontend: SubscriptionPage (current plan, change, cancel).

### Day 13 — Hardening & Bug Fixing
- [ ] Rate limits applied to: login, signup, vote, submit, payment.
- [ ] Helmet, CORS allowlist, CSRF token on mutating routes.
- [ ] Audit log on every admin/writer write.
- [ ] Sentry installed (server + client).
- [ ] Fix top issues found through manual exercising.
- **M3 done**: full payment + moderation + quota flow works on staging.

---

## Week 2.5 — Admin, Polish, Launch (Days 14–17)

### Day 14 — Admin Dashboard
- [ ] AdminLayout + role guard.
- [ ] OverviewPage: DAU, total articles, revenue this month, queue depth (call backend metrics endpoint).
- [ ] UsersPage: search, filter, ban/unban, override plan.
- [ ] ArticlesPage: filter by status, force unpublish.
- [ ] ModerationPage: needs_review queue with approve/reject/override buttons.
- [ ] PaymentsPage: list with filters, mark refunded.

### Day 15 — Analytics & Writer Earnings (Read-Only)
- [ ] Nightly analytics-rollup job → read_aggregates.
- [ ] Writer EarningsPage: per-article reads, watch time, votes (no payouts in MVP — just visibility).
- [ ] Admin overview charts (Recharts): reads per day (last 30), revenue per day.
- **M4 done**: admin can run the platform.

### Day 16 — Testing Pass
- [ ] Cover gaps in unit tests (services).
- [ ] Integration tests: auth, article lifecycle, payment webhook, moderation worker.
- [ ] E2E (Playwright): signup → submit article → admin approves → reader reads → upgrade → unlimited reads.
- [ ] Load test: k6 script — 200 concurrent feed requests.
- [ ] Accessibility quick audit (axe-core in Playwright).

### Day 17 — Deployment & Launch
- [ ] Deploy to staging; full smoke test.
- [ ] Deploy to prod; smoke test.
- [ ] Configure UptimeRobot, Sentry alerts, Better Stack log search.
- [ ] Document runbooks.
- [ ] Seed prod with 5 sample articles + about page.
- [ ] **M5 done**: live URL, signup → pay → read works end-to-end on prod.

---

## Dependency Graph (critical path)

```
Day1 setup
  → Day2 auth
    → Day3 client auth
    → Day4 articles
      → Day5 editor
      → Day6 feed
        → Day7 moderation backend
          → Day8 moderation edge cases
        → Day9 quota
          → Day10 reads
          → Day11 jazzcash
            → Day12 stripe
              → Day13 hardening
                → Day14 admin
                  → Day15 analytics
                    → Day16 tests
                      → Day17 deploy
```

## Risk Buffer

The plan has **zero buffer days**. To stay on schedule:
- **Cut first if behind**: Stripe (Day 12) — JazzCash alone is acceptable for MVP.
- **Cut second**: writer earnings dashboard (Day 15) — show "Coming soon".
- **Cut third**: analytics charts — admin can use raw tables.
- **Never cut**: auth, moderation worker (even simplified), quota enforcement, JazzCash, deploy.

## Definition of Done (per task)

A task is done only when:
1. Code is written + linted clean.
2. Unit/integration tests pass.
3. Happy path manually exercised.
4. Pushed and deployed to staging without error.
5. Documented in code (only WHY comments) + this plan checked off.

## Phase 2 Backlog (do not build in MVP)

- Comments, follows, save-for-later
- Personalized feed
- Appeals workflow UI
- Easypaisa + PayFast + 3DS for cards
- Writer payout automation (currently manual export-to-CSV)
- Search relevance (Meilisearch)
- Mobile app
- OAuth (Google) login
- Plagiarism detection
- Content versioning UI for readers
