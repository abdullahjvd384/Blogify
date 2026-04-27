# 05 — DevOps & Tools

## 1. Repository Layout

Monorepo (no Turborepo / Nx — keep it simple):
```
WebProg-Project/
├── client/          # React + Vite
├── server/          # Express API
├── workers/         # BullMQ workers (shares server src via path)
├── shared/          # shared types/constants (plain JS modules)
├── scripts/         # seed, sync-indexes, reconcile
├── docker/          # Dockerfiles + docker-compose.yml
├── plans/
├── .github/workflows/
├── .gitignore
├── README.md
└── package.json     # workspace root (npm workspaces)
```

Workspaces in root `package.json`:
```
"workspaces": ["client", "server", "shared"]
```

## 2. Local Development

### Prereqs
- Node.js 20 LTS
- Docker Desktop
- Git

### One-time setup
```
cp server/.env.example server/.env
cp client/.env.example client/.env
npm install
docker compose up -d mongo redis
npm run db:seed
```

### Run
```
npm run dev          # starts client (5173), server (4000), workers concurrently
```

`npm-run-all` or `concurrently` orchestrates the three processes.

### docker-compose.yml (dev only)
```
services:
  mongo:
    image: mongo:7
    ports: ['27017:27017']
    volumes: ['mongo-data:/data/db']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
volumes:
  mongo-data:
```

Production uses MongoDB Atlas + Upstash Redis — no docker-compose in prod.

## 3. Environments

| Env | API host | Web host | DB | Redis | Notes |
|---|---|---|---|---|---|
| local | localhost:4000 | localhost:5173 | docker mongo | docker redis | dev seed data |
| staging | api-staging.<domain> | staging.<domain> | Atlas M0 | Upstash free | sandbox payments |
| prod | api.<domain> | <domain> | Atlas M10 | Upstash paid | live keys |

Branch → env:
- `main` → prod (manual approval)
- `develop` → staging (auto)
- feature branches → preview deploy on Vercel for client only

## 4. CI/CD

### GitHub Actions

**`.github/workflows/ci.yml`** — runs on every PR:
```
jobs:
  lint:           # eslint + prettier check
  typecheck:      # tsc --noEmit (if TS) / jsdoc check
  test-server:    # vitest server + integration with mongo-memory-server
  test-client:    # vitest client + RTL
  build-client:   # vite build (catches build errors)
  build-server:   # node syntax check, lint
```

**`.github/workflows/deploy-staging.yml`** — push to `develop`:
- Deploys client to Vercel (preview alias = staging)
- Deploys server + workers to Render (staging service) via Render deploy hook
- Runs DB index sync as a post-deploy step
- Runs smoke tests (Playwright headed against staging URL)

**`.github/workflows/deploy-prod.yml`** — push to `main` (requires approval):
- Same as staging but targets prod services
- Runs DB backup-trigger first
- Posts deploy notification to a Slack/Discord webhook

### Required secrets
```
VERCEL_TOKEN
RENDER_DEPLOY_HOOK_STAGING
RENDER_DEPLOY_HOOK_PROD
SENTRY_AUTH_TOKEN
DISCORD_DEPLOY_WEBHOOK
```

## 5. Hosting

| Component | Provider | Why |
|---|---|---|
| Frontend | Vercel | Free tier, fast SPA + edge cache |
| API | Render (Web Service) | Cheapest managed Node, supports background workers |
| Workers | Render (Background Worker) | Same image, separate entrypoint |
| MongoDB | MongoDB Atlas | Managed, free tier sufficient for MVP |
| Redis | Upstash | Serverless, pay-per-request, free tier |
| File storage | Cloudflare R2 | S3-compatible, no egress fees |
| CDN | Cloudflare | In front of API + R2 |
| Email | Resend | Cheap, fast delivery, good DX |
| Errors | Sentry | Free tier covers MVP |
| Logs | Better Stack | Free tier, structured log search |
| Uptime | UptimeRobot | Free, 5-min interval |

Estimated monthly cost at MVP (low traffic): ~$0–$25 (Render starter $7, Atlas free, Upstash free, others free tiers).

## 6. Docker

Production uses single Dockerfile per service for parity.

### `docker/Dockerfile.server`
```
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY server/package*.json server/
RUN npm ci --workspace=server --include-workspace-root

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY server ./server
USER node
EXPOSE 4000
CMD ["node", "server/src/server.js"]
```

### `docker/Dockerfile.worker`
Same base, different `CMD` → `node workers/index.js`.

Render builds from these Dockerfiles directly.

## 7. Configuration & Secrets

- `.env` files **never** committed.
- `.env.example` checked in with placeholders + comments.
- Production secrets stored in Render's environment settings; Vercel for client.
- Rotate JWT secrets quarterly; document the rotation procedure in `docs/runbooks/`.

## 8. Logging

- **Library**: pino (JSON logs).
- **Levels**: trace, debug, info, warn, error, fatal.
- **Default level**: `info` in prod, `debug` in dev.
- **Required fields per log**: `requestId`, `userId` (if authed), `route`, `latencyMs`.
- **Log shipping**: Render → Better Stack via standard log drain.
- **PII**: never log passwords, tokens, raw payment payloads, full email bodies.

## 9. Monitoring & Alerts

| Signal | Tool | Alert Threshold |
|---|---|---|
| Uncaught exceptions | Sentry | any error in prod |
| API p95 latency | Better Stack metric from logs | > 1s for 5 min |
| Queue depth | BullMQ admin endpoint + custom metric | > 100 jobs |
| Failed payments | Custom metric | > 5% in 1 hour |
| Mongo connection | Atlas alerts | connection failures |
| Disk / memory | Render dashboard | > 80% |
| Uptime | UptimeRobot | 1 missed ping |

Notifications → single Discord channel for MVP.

## 10. Backups & Disaster Recovery

- Atlas daily automated backups (7-day retention).
- Pre-deploy DB snapshot trigger (Atlas API call from CI).
- Quarterly restore drill: spin up a temp cluster, restore latest snapshot, verify schema + data sample.

## 11. Security Operations

- HTTPS enforced by host (Vercel/Render).
- HSTS via Helmet.
- Dependency scanning: Dependabot enabled (weekly).
- `npm audit` blocking high/critical in CI.
- Secret scanning: GitHub native + truffleHog action on PR.
- Webhook endpoints behind Cloudflare with strict signature verification.

## 12. Runbooks (place in `docs/runbooks/`)

- `incident-payment-webhook-down.md`
- `incident-groq-down.md` (fallback to OpenAI key + reduced throughput)
- `incident-redis-down.md` (degrade gracefully — disable quotas, log heavily)
- `rotating-jwt-secrets.md`
- `restoring-db-backup.md`

These are written during build, not after launch.
