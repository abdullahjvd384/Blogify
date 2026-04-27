# 07 — Coding Guidelines

## 1. Language & Tooling

- **JavaScript (ESM)** across server and client. (TypeScript is strongly recommended; if time allows, switch to TS at Day 1. Otherwise, use JSDoc on exported functions for type hints.)
- **Node 20+**. Use built-ins where possible (`fetch`, `crypto.randomUUID`, AbortController).
- **ESLint** config: `eslint:recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `prettier`. No warnings in committed code.
- **Prettier** with: `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `printWidth: 100`.
- **EditorConfig**: 2 spaces, LF line endings, UTF-8.
- **Husky + lint-staged**: pre-commit lint + format only on staged files.

## 2. Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Variables, functions | camelCase | `getUserById` |
| React components | PascalCase | `ArticleCard` |
| Files: components | PascalCase.jsx | `ArticleCard.jsx` |
| Files: modules/utils | kebab-case.js | `auth-service.js` (server uses dot.notation: `auth.service.js`) |
| Constants | UPPER_SNAKE_CASE | `MAX_ARTICLE_BYTES` |
| Mongoose models | PascalCase singular | `User`, `Article` |
| MongoDB collections | lowercase plural | `users`, `articles` |
| API routes | kebab-case plural | `/api/v1/refresh-tokens` |
| DB fields | snake_case | `created_at`, `author_id` |
| JS object fields | camelCase in JS, snake_case in DB | mapped at boundary |
| Booleans | `is`/`has`/`can` prefix | `isPublished`, `canEdit` |
| Async functions | verb prefix | `fetchUser`, `createPayment` |
| React hooks | `use` prefix | `useArticleFeed` |
| Env vars | UPPER_SNAKE_CASE | `JWT_ACCESS_SECRET` |

**Important**: DB uses `snake_case`, JS uses `camelCase`. Map at the controller/service boundary so internal code is idiomatic JS.

## 3. Folder Structure Rules

- **Vertical slices** (group by feature, not by file type). `auth/` contains its routes, controller, service, validators.
- **Shared infrastructure** (middleware, models, integrations) live at the top of `src/`.
- A module never imports from a sibling module's internals — only from its public `index.js` if needed. Avoids circular deps.
- Tests mirror source layout: `tests/unit/modules/auth/auth.service.test.js`.

## 4. File Size & Structure

- One responsibility per file. If a file exceeds ~300 lines, consider splitting.
- Order within a file: imports → constants → main exports → internal helpers.
- Place small subcomponents in the same file only if they are not reused.

## 5. Reusability & Modularity

### Server
- **Controller**: parses `req`, calls service, writes `res`. No business logic.
- **Service**: business logic. Receives plain inputs, returns plain outputs. Throws `AppError` subclasses.
- **Repository (optional)**: query helpers when Mongoose calls become repetitive.
- **Integration**: wraps an external API (GROQ, JazzCash). Returns typed results, retries internally if appropriate.
- Services should be testable without HTTP layer.

### Client
- **Hooks-first**: data + state lives in custom hooks. Components are presentational where possible.
- **Compose, don't inherit**: build complex UI from small composable components.
- **Avoid prop drilling beyond 2 levels** — use context (sparingly) or Zustand.
- **Don't abstract early**: 3 similar components is fine; abstract on the 4th use, not the 2nd.

## 6. Error Handling Rules

### Server
- Throw `AppError` subclasses. Never `throw new Error('...')` in services.
- `asyncHandler(fn)` wraps async route handlers.
- Central error middleware:
  - Maps known errors to HTTP status + JSON shape.
  - Logs with `requestId`.
  - Captures unknowns to Sentry; returns generic 500.
- Never swallow errors. If you catch, you must either handle, rethrow, or log+rethrow.

### Client
- React Query handles network errors → display via toast or inline.
- ErrorBoundary at route level for render errors.
- Forms: surface validation errors next to fields.
- Never `alert()`. Use the toaster.

## 7. Comments

- **Default to no comments.** Code names should explain *what*; commit messages explain *why*.
- Write a comment only when the *why* is non-obvious: hidden invariants, workarounds for specific bugs, surprising behavior.
- **Never** write comments restating what the code does ("// loop through users").
- **Never** reference tickets, PRs, or "added for X feature" — that goes in commit history.
- JSDoc on exported public APIs (function signature + returns) is allowed and useful.

## 8. Git Workflow

- Default branch: `main` (prod). `develop` (staging).
- Feature branches: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Commit message format (Conventional Commits):
  ```
  feat(articles): support draft autosave
  fix(auth): refresh token rotation race
  chore(ci): bump node to 20
  ```
- Squash merge to `develop`. Promote `develop` → `main` via PR with manual review.
- No force-push to `main` or `develop`.

## 9. Pull Requests

- Small (< 400 lines diff). Feature branches stay short-lived.
- PR description: what + why + test plan + screenshots if UI.
- All checks green before merge.
- At least one self-review before requesting review.

## 10. API Contract Discipline

- Routes versioned under `/api/v1`.
- Breaking changes require new version path.
- Response shape consistency:
  - Success: `{ data: ... }` for single, `{ data: [...], page: { cursor, hasMore } }` for lists.
  - Error: `{ error: { code, message, details? } }`.
- HTTP status codes used semantically (201 for creates, 204 for deletes, 402 for quota, 422 for validation).

## 11. Validation

- **Every** mutating route has a Zod schema for body/query/params.
- **Every** integration response is parsed/validated before use (don't trust GROQ to return clean JSON).
- **Frontend** validates with the same schema (or mirrored Zod schema) before submission, but server is always source of truth.

## 12. Security Defaults

- Passwords: bcrypt with cost factor 12.
- Tokens: cryptographically random, never sequential.
- Secrets: from env only, never hardcoded.
- SQL/NoSQL injection: never string-concat queries; use Mongoose query objects.
- HTML rendering of user content: sanitize with DOMPurify before render. TipTap output sanitized server-side too.
- File uploads: validate MIME by magic bytes, not extension; size limits; store in R2 not on server.
- Logs: PII filter list applied at logger level (passwords, tokens, full emails).

## 13. Performance Defaults

- Avoid N+1 queries. If you `.find()` then loop and `.findOne()`, refactor to a single query with `$in`.
- Mongoose `.lean()` on read-only queries — returns plain JS objects, faster.
- Add indexes for any field used in `find`, `sort`, or `match`.
- React: lists need stable keys; memoize expensive children.
- Client bundle: lazy-load admin and writer routes — readers shouldn't ship them.

## 14. Testing Discipline

(Detailed in `08_testing_plan.md`.)

- Every service has unit tests for happy path + 1 error path.
- Every route has at least one integration test.
- E2E covers the 3 critical journeys (signup→read, write→publish, upgrade→unlimited).
- Coverage target: 70% lines on services and middleware. Don't game coverage with trivial tests.

## 15. Code Review Checklist

Reviewer checks:
- [ ] Does the change do what the PR title says, and nothing more?
- [ ] Are there tests for new logic?
- [ ] Any new env vars added to `.env.example`?
- [ ] Any new index needed on a new query path?
- [ ] Error handling: known errors thrown as `AppError`, not raw `Error`?
- [ ] Validation present on new mutating routes?
- [ ] No secrets, no PII in logs?
- [ ] Frontend: a11y basics (label, alt, focus)?

## 16. Anti-Patterns to Avoid

- ❌ Try/catch that just logs and re-throws — adds noise.
- ❌ Mongoose `.populate()` in hot paths — fetch separately.
- ❌ Global mutable state in modules — use config or DI.
- ❌ Large utils.js dumping ground — name files by purpose.
- ❌ Magic numbers — extract to named constants.
- ❌ Boolean trap parameters — use options objects.
- ❌ React: derived state in `useState` + `useEffect` — derive during render.
- ❌ Wrapping every export in default-only — prefer named exports.
- ❌ Abstracting before duplication exists.
