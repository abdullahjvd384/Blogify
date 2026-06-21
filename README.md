# Blog Platform MVP

Monorepo for the blog platform described in [plans/](plans/).

## Stack
- **Client**: Vite + React 18 + Tailwind + shadcn/ui + TanStack Query + Zustand
- **Server**: Node 20 + Express + Mongoose + Zod + BullMQ + pino
- **Data**: MongoDB + Redis
- **Auth**: JWT in httpOnly cookies, refresh-token rotation
- **AI moderation**: OpenAI
- **Payments**: JazzCash (sandbox in dev)

## Layout
```
client/    React + Vite SPA
server/    Express API + BullMQ workers
shared/    Shared constants (plan tiers, enums)
scripts/   seed, sync-indexes
docker/    docker-compose for local dev
plans/     Source-of-truth design docs
```

## Quick start
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose -f docker/docker-compose.yml up -d
npm install
npm run dev
```

Then:
- API → http://localhost:4000
- Web → http://localhost:5173
- Healthcheck → http://localhost:4000/api/v1/healthz

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Boot client + server + worker concurrently |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint everything |
| `npm run format` | Prettier write |
| `npm run db:seed` | Seed dev data (admin + sample articles) |

## Documentation
See [plans/](plans/) for architecture, API contract, schemas, timeline, and coding guidelines.
