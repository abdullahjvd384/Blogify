# Deploying Blogify for free

This app deploys as **one free service** on Render that serves the React SPA, the
API, and the moderation worker from a single Node process. Backing stores
(MongoDB, Redis) use their own free tiers.

## The free stack

| Piece | Provider | Free tier | Notes |
|-------|----------|-----------|-------|
| App (SPA + API + worker) | **Render** web service | Free | Sleeps after ~15 min idle → ~50s cold start on next request |
| Database | **MongoDB Atlas** | M0, 512 MB | Plenty for a demo |
| Redis (queue + rate limit) | **Upstash** | Free | Use the **TCP** `rediss://` URL, not the REST URL — BullMQ needs TCP |
| Images | **Cloudinary** | Free | Optional |
| AI moderation | **OpenAI** | Pay-as-you-go | Optional — without it, articles route to `needs_review` |
| Email | **Resend** | 100/day | Optional |
| Payments | **Stripe** | Test mode free | Use test keys for a demo |

### Honest caveats
- **Cold starts.** The free Render service sleeps. The first request after idle
  takes ~50s. The in-process worker also only runs while the app is awake — a
  submitted article gets moderated once the service is up. Fine for a demo; if
  you need always-on, that's ~$7/mo on Render.
- **Redis budget.** BullMQ polls Redis continuously. Because the worker sleeps
  with the app, free Upstash is survivable, but watch your command usage if you
  upgrade the app to always-on.

## Step by step

### 1. Provision the data stores
1. **MongoDB Atlas** → create a free M0 cluster → Database Access: add a user →
   Network Access: allow `0.0.0.0/0` → copy the connection string. Keep the
   `/blogplatform` db name before the `?` and URL-encode the password.
2. **Upstash** → create a Redis database → copy the **TCP** connection string
   (`rediss://default:...@...upstash.io:6379`).

### 2. Push this repo to GitHub
Render deploys from a Git repo. Commit and push (including `render.yaml`).

### 3. Create the Render service
Two options:

**A. Blueprint (uses `render.yaml`)** — Render dashboard → **New → Blueprint** →
pick this repo. It reads `render.yaml` and pre-fills everything. You'll be
prompted for the secret env vars (`sync: false`).

**B. Manual web service** — New → Web Service → this repo, then set:
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start:server`
- Health check path: `/api/v1/healthz`

### 4. Set environment variables (Render dashboard)
Required:
```
NODE_ENV=production
SERVE_CLIENT=true
RUN_WORKER=true
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
VITE_API_BASE_URL=/api/v1
MONGO_URI=<your Atlas string>
REDIS_URL=<your Upstash TCP string>
JWT_ACCESS_SECRET=<32+ random chars>      # Blueprint auto-generates these
JWT_REFRESH_SECRET=<32+ random chars>
```
After the first deploy you'll know your URL (e.g. `https://blogify.onrender.com`).
Set:
```
CLIENT_ORIGIN=https://blogify.onrender.com
```
Optional integrations (only if you use them): `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CLOUDINARY_*`.

> `VITE_API_BASE_URL` must be present **at build time** — it's baked into the SPA.
> It's `/api/v1` (relative) so the SPA always calls its own origin.

### 5. Deploy & verify
- Open your URL → the React app loads.
- Register/login → confirms cookies + DB work (cookies are same-origin, so
  `sameSite=lax` is correct here).
- Submit an article → confirms the in-process worker + Redis.

### 6. Stripe webhook (only if using payments)
In the Stripe dashboard add a webhook endpoint:
`https://<your-url>/api/v1/payments/webhook/stripe`, then paste its signing
secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

## How the single-service mode works (for reference)
- `SERVE_CLIENT=true` → Express serves `client/dist` and falls back to
  `index.html` for client-side routes ([server/src/app.js](server/src/app.js)).
- `RUN_WORKER=true` → the moderation worker boots inside the API process
  ([server/src/server.js](server/src/server.js)).
- Locally these stay `false`: Vite serves the client and `npm run dev` runs the
  worker as a separate process.
