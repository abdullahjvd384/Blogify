# 08 — Testing Plan

## 1. Philosophy

- **Test pyramid**: many unit tests, fewer integration, a small number of end-to-end.
- **Test behavior, not implementation**. If refactoring internals breaks the test, the test is wrong.
- **Tests are first-class code**: same standards for naming, structure, no duplication.
- **Coverage target**: 70% lines on services + middleware. Routes via integration tests. Don't chase 100%.

## 2. Tooling

| Layer | Tool |
|---|---|
| Server unit + integration | Vitest + Supertest |
| In-memory Mongo | mongodb-memory-server |
| Redis mocks | ioredis-mock |
| BullMQ tests | run real Redis (in test container) or in-memory queue |
| Client unit | Vitest + React Testing Library |
| Client mocking | MSW (Mock Service Worker) for API |
| E2E | Playwright |
| Load | k6 |
| Accessibility | @axe-core/playwright |

## 3. Server Unit Tests

**What to cover:**
- Service functions (auth, articles, payments, moderation logic).
- Validators (Zod schemas — accept valid, reject invalid edge cases).
- Utility functions (slug, timezone math, money formatting, signature builders).
- Authorization rules (can this user edit this article?).

**Conventions:**
- File: `tests/unit/<module>/<file>.test.js`
- Naming: `describe('createArticle', () => { it('creates draft for verified writer', ...) })`.
- AAA pattern: Arrange / Act / Assert.
- One behavior per test. Multiple `expect` allowed if they verify the same behavior.
- Mocks via `vi.mock`. Mock at the boundary (integrations, models if needed).
- Avoid snapshot tests for objects that change frequently.

**Examples to write:**
- `auth.service.test.js`: hashPassword + comparePassword, signTokens, refreshRotation.
- `quota.middleware.test.js`: under limit allows, over limit throws QuotaExceeded.
- `moderation.service.test.js`: parses GROQ structured output, low-confidence routes to needs_review, malformed response routes to needs_review.
- `jazzcash.test.js`: signature builder produces deterministic hash.
- `slug.test.js`: dedupes on collision.

## 4. Server Integration Tests

**What to cover:**
- Full HTTP request → DB write/read cycles.
- Auth flow: signup → login → me → refresh.
- Article lifecycle: create draft → submit → (mock GROQ approves) → published → vote → quota decrement.
- Payment webhook: simulated signed payload → subscription activates.
- Quota enforcement: 4th read on free plan returns 402.
- Authorization: writer A cannot edit writer B's article (403).

**Setup:**
- `tests/helpers/setup.js` boots mongodb-memory-server + mock Redis before suite.
- Each test uses transactions or `db.dropDatabase()` between tests for isolation.
- Helper factories: `makeUser({ role })`, `makeArticle({ status })`.
- GROQ + JazzCash + Stripe mocked at integration boundary.

## 5. Client Unit / Component Tests

**What to cover:**
- Components with logic: PaywallModal countdown, ArticleCard variants, EditorPage autosave debounce.
- Custom hooks: `useArticleFeed`, `useHeartbeat`, `useMe`.
- Form validation (RHF + Zod) on signup, login, editor.

**Conventions:**
- Render with `render()` from RTL; query by role/label, not by class/id.
- User interactions via `userEvent`, not `fireEvent`.
- API calls intercepted by MSW handlers in `tests/mocks/handlers.js`.
- No tests for purely presentational components without logic.

## 6. End-to-End Tests (Playwright)

**Run against**: local `npm run dev` for PR CI; staging URL for nightly.

**Critical journeys (must always pass):**

1. **Reader paywall journey**
   - Sign up as new user → email verify (test inbox) → login.
   - Read 3 articles successfully.
   - 4th article click → PaywallModal appears.
   - Navigate to /pricing.

2. **Writer publish journey**
   - Login as existing writer.
   - Create new draft, type content, autosave fires.
   - Submit → status badge becomes "Submitted".
   - (Test seam: webhook from worker marks article approved.)
   - Verify article appears on public feed.

3. **Admin moderation journey**
   - Login as admin.
   - Open moderation queue.
   - Approve a needs_review article → it appears as Published.

4. **Subscription upgrade journey (sandbox)**
   - Login as free user.
   - Click upgrade → Stripe test card.
   - Webhook (simulated) marks payment success.
   - User can now read 4th, 5th, ... article.

5. **Smoke test (every deploy)**
   - Home loads, signup works, login works, single API call returns 200.

**Conventions:**
- Page Object Model in `tests/e2e/pages/`.
- One test = one journey; don't chain unrelated assertions.
- Use `data-testid` for stable selectors; avoid CSS class selectors.

## 7. Load Tests (k6)

**Scenarios in `tests/load/`:**
- `feed.js`: 200 concurrent users hitting `/articles` for 5 min.
- `read-flow.js`: 100 concurrent users running start → 10 heartbeats → end.
- `webhook.js`: 50 webhook calls/sec to `/payments/webhook/jazzcash`.

**Acceptance:**
- p95 latency < 800ms under target load.
- Error rate < 1%.
- No memory leaks over a 30-min sustained run.

Run before launch, not in CI.

## 8. Security Testing

- Manual checks on launch day:
  - Try to read another user's draft → 403 expected.
  - Try expired JWT → 401 expected, refresh works.
  - SQL/NoSQL injection in search params (`?tag={"$ne":null}`) — must be escaped.
  - XSS in article content → sanitization works.
  - CSRF: cross-origin POST without token → rejected.
  - Replay payment webhook → second call no-ops (idempotency).
- Dependency audit: `npm audit` clean of high/critical.

## 9. Accessibility Testing

- `@axe-core/playwright` on every E2E test.
- Manual keyboard nav: tab through every page; focus visible; modals trap focus.
- Color contrast: design tokens audited once before launch (use Stark or similar).

## 10. Test Data Strategy

- **Factories**, not fixtures. Functions like `makeArticle({ status })` produce valid randomized docs.
- Faker.js for text, names, etc.
- Avoid shared mutable test fixtures.

## 11. Continuous Testing in CI

`ci.yml` pipeline:
```
1. Install (cached node_modules)
2. Lint + format check         (fail fast)
3. Server unit tests           (parallel)
4. Server integration tests    (parallel)
5. Client unit tests           (parallel)
6. Client build                (parallel)
7. Playwright smoke (server + client built, run against local)
```
Total target: < 8 minutes.

## 12. Pre-Deploy Manual Checklist

Run before every prod deploy:
- [ ] Smoke E2E on staging passes.
- [ ] Manually run signup → upgrade → read flow on staging using a real test card.
- [ ] Webhook callbacks confirmed firing (check logs).
- [ ] DB index sync ran without errors.
- [ ] Sentry receiving events (trigger a known test error).
- [ ] Logs flowing to Better Stack.
- [ ] No skipped tests committed.

## 13. Post-Bug Process

When a bug is found in prod:
1. Write a failing test that reproduces it.
2. Fix the bug; test now passes.
3. Commit the test in the same PR as the fix.
4. If the bug class can recur, generalize the test to cover the family.

This prevents the same regression twice.

## 14. What NOT to Test

- Third-party libraries (assume they work).
- Trivial getters/setters.
- Mongoose schema definitions (test behavior, not the schema syntax).
- React component snapshots of large trees (brittle).
- UI styling (visual regression is overkill for MVP).
