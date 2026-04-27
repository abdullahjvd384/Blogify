# 04 — Database Plan (MongoDB)

## 1. Database Conventions

- Database name: `blogplatform`
- Collection naming: lowercase plural (`users`, `articles`, `reads`).
- ObjectId for `_id`.
- Every doc has `created_at`, `updated_at` (Mongoose timestamps).
- Soft delete via `deleted_at` field; never `findOneAndDelete` user-generated content.
- Money stored as integers in **paisa** (1 PKR = 100 paisa) to avoid floats.

## 2. Collections Overview

| Collection | Purpose | Approx Doc Size | Growth |
|---|---|---|---|
| users | accounts, role, profile | small | linear w/ signups |
| refresh_tokens | hashed refresh sessions | small | linear w/ logins |
| writer_profiles | writer metadata + payout info | small | small |
| articles | content + metadata | medium-large | linear w/ writers |
| article_versions | edit history | medium | per edit |
| votes | thumbs up/down | tiny | high |
| reads | read sessions | small | very high (time-series) |
| read_aggregates | per-article daily rollup | tiny | bounded |
| subscriptions | active subscription state | small | bounded by users |
| payments | transaction log | small | linear w/ purchases |
| payouts | writer payouts | small | monthly per writer |
| moderation_jobs | queue mirror + verdict | small | linear w/ submits |
| audit_log | admin action log | small | linear w/ admin ops |
| reports | user-submitted reports | small | low |

## 3. Schemas

### 3.1 users
```
{
  _id,
  email: { type: String, unique: true, lowercase: true, index: true },
  email_verified_at: Date,
  password_hash: String,
  name: String,
  role: { type: String, enum: ['reader','writer','admin'], default: 'reader' },
  status: { type: String, enum: ['active','banned','deleted'], default: 'active' },
  timezone: { type: String, default: 'Asia/Karachi' },
  country: String,
  reputation_score: { type: Number, default: 0 },
  banned_at: Date,
  banned_reason: String,
  created_at, updated_at
}
```
Indexes: `{ email: 1 }` unique, `{ role: 1, status: 1 }`.

### 3.2 refresh_tokens
```
{
  _id,
  user_id: ObjectId (ref users, index),
  token_hash: String (sha256),
  device_fingerprint: String,
  ip: String,
  expires_at: Date (TTL index),
  revoked_at: Date,
  created_at
}
```
Indexes: `{ user_id: 1 }`, `{ token_hash: 1 }` unique, `{ expires_at: 1 }` TTL.

### 3.3 writer_profiles
```
{
  _id,
  user_id: ObjectId unique,
  bio: String,
  payout_method: { type: String, enum: ['jazzcash','easypaisa','bank'] },
  payout_account: { account_title, account_number, bank_name },
  total_earnings_paisa: { type: Number, default: 0 },
  pending_earnings_paisa: { type: Number, default: 0 },
  lifetime_reads: { type: Number, default: 0 },
  trusted: { type: Boolean, default: false },
  applied_at, approved_at, approved_by
}
```

### 3.4 articles
```
{
  _id,
  author_id: ObjectId (index),
  title: String,
  slug: { type: String, unique: true, index: true },
  excerpt: String (auto-generated from content if empty, max 280 chars),
  content: String (HTML/MD, max 50KB),
  cover_image_url: String,
  tags: [String],
  status: {
    type: String,
    enum: ['draft','submitted','in_review','needs_review','approved','published','rejected','unpublished','removed'],
    default: 'draft',
    index: true
  },
  word_count: Number,
  estimated_read_minutes: Number,
  moderation: {
    last_verdict: String,         // approved | rejected | needs_review
    confidence: Number,
    reasons: [String],
    model: String,
    decided_at: Date,
    decided_by: { type: String, enum: ['ai','admin'] }
  },
  published_at: Date,
  unpublished_at: Date,
  version: { type: Number, default: 1 },
  stats_snapshot: {                // denormalized for fast feed render
    reads: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
  },
  deleted_at: Date,
  created_at, updated_at
}
```
Indexes:
- `{ slug: 1 }` unique
- `{ status: 1, published_at: -1 }` (feed)
- `{ author_id: 1, status: 1 }` (writer dashboard)
- `{ tags: 1, published_at: -1 }`
- `{ title: 'text', excerpt: 'text', tags: 'text' }` (basic search)

### 3.5 article_versions
```
{
  _id,
  article_id: ObjectId (index),
  version: Number,
  title, content, tags,
  edited_by: ObjectId,
  edited_at: Date
}
```
Compound index: `{ article_id: 1, version: -1 }`.

### 3.6 votes
```
{
  _id,
  user_id: ObjectId,
  article_id: ObjectId,
  vote: { type: Number, enum: [1, -1] },
  created_at
}
```
Unique compound: `{ user_id: 1, article_id: 1 }`.

### 3.7 reads (time-series collection)
```
Mongoose timeseries: { timeField: 'started_at', metaField: 'meta', granularity: 'minutes' }
{
  _id,
  meta: { article_id, author_id },
  user_id: ObjectId,
  session_id: String,
  started_at: Date,
  ended_at: Date,
  validated_seconds: Number,
  heartbeats: Number,
  is_valid: { type: Boolean, default: true },
  fraud_score: { type: Number, default: 0 },
  ip_hash: String,
  ua_hash: String
}
```
Indexes: `{ 'meta.article_id': 1, started_at: -1 }`, `{ user_id: 1, started_at: -1 }`.

Note: While a session is in progress, state is held in **Redis** (`read:session:{sessionId}` hash). Persisted to Mongo on `read_end` only.

### 3.8 read_aggregates
```
{
  _id,
  article_id: ObjectId,
  author_id: ObjectId,
  date: String (YYYY-MM-DD),
  reads_total: Number,
  reads_valid: Number,
  watch_seconds_total: Number,
  unique_readers: Number,
  upvotes_delta: Number,
  downvotes_delta: Number
}
```
Compound unique: `{ article_id: 1, date: 1 }`.

### 3.9 subscriptions
```
{
  _id,
  user_id: ObjectId unique,
  plan: { type: String, enum: ['free','basic','pro','god_tier'] },
  status: { type: String, enum: ['active','past_due','canceled','expired'] },
  daily_limit: Number,            // null = unlimited
  period_start: Date,
  period_end: Date,
  cancel_at_period_end: Boolean,
  provider: { type: String, enum: ['jazzcash','stripe','none'] },
  provider_subscription_id: String,
  current_payment_id: ObjectId,
  created_at, updated_at
}
```
Plans (server-side constants):
- free: limit=3, price=0
- basic: limit=10, price=50000 paisa (PKR 500)
- pro: limit=25, price=100000 paisa
- god_tier: limit=null, price=250000 paisa

### 3.10 payments
```
{
  _id,
  user_id: ObjectId (index),
  amount_paisa: Number,
  currency: { type: String, default: 'PKR' },
  plan: String,
  provider: { type: String, enum: ['jazzcash','stripe'] },
  provider_txn_id: { type: String, index: true, unique: true, sparse: true },
  status: { type: String, enum: ['pending','success','failed','refunded'], default: 'pending' },
  raw_payload: Object,           // full provider response
  failure_reason: String,
  idempotency_key: { type: String, unique: true, sparse: true },
  initiated_at, completed_at
}
```

### 3.11 payouts (Phase 2 placeholder)
```
{
  _id,
  writer_id: ObjectId,
  period: String (YYYY-MM),
  amount_paisa: Number,
  status: { type: String, enum: ['computed','approved','paid','failed'] },
  computation: {
    valid_reads: Number,
    watch_seconds: Number,
    net_thumbs: Number,
    score: Number,
    pool_paisa: Number,
    share: Number
  },
  paid_at: Date,
  transaction_ref: String,
  created_at
}
```
Compound unique: `{ writer_id: 1, period: 1 }`.

### 3.12 moderation_jobs
```
{
  _id,
  article_id: ObjectId (index),
  queue_job_id: String,
  status: { type: String, enum: ['queued','running','succeeded','failed'] },
  attempts: Number,
  request_payload_hash: String,
  response: Object,              // raw GROQ response
  verdict: String,
  confidence: Number,
  reasons: [String],
  suggested_tags: [String],
  error: String,
  started_at, finished_at
}
```

### 3.13 audit_log
```
{
  _id,
  actor_id: ObjectId,
  actor_role: String,
  action: String,                // e.g., 'article.unpublish'
  target_type: String,
  target_id: ObjectId,
  before: Object,
  after: Object,
  ip: String,
  user_agent: String,
  request_id: String,
  created_at: Date (TTL 365 days)
}
```

### 3.14 reports
```
{
  _id,
  reporter_id: ObjectId,
  target_type: { type: String, enum: ['article','user','comment'] },
  target_id: ObjectId,
  reason: { type: String, enum: ['spam','harassment','illegal','plagiarism','other'] },
  details: String,
  status: { type: String, enum: ['open','resolved','dismissed'] },
  resolved_by: ObjectId,
  resolved_at: Date,
  created_at
}
```

## 4. Relationships

```
users ─┬─< articles (author_id)
       ├─< votes (user_id)
       ├─< reads (user_id)
       ├─< subscriptions (user_id) 1:1
       ├─< payments (user_id)
       ├─< writer_profiles 1:1
       └─< refresh_tokens 1:N

articles ─┬─< votes
          ├─< reads
          ├─< article_versions
          └─< moderation_jobs
```

References by ObjectId. No `populate()` in hot paths — fetch separately and join in service layer to control N+1.

## 5. Indexing Strategy

Listed inline above; summary:

- All foreign keys (`*_id`) indexed.
- Feed query path: `{ status:1, published_at:-1 }` on articles.
- Quota & rate limiting: handled in Redis, not Mongo.
- TTL indexes: `refresh_tokens.expires_at`, `audit_log.created_at`.
- Text search: simple index on articles for MVP search; replace with Meilisearch in Phase 2.

## 6. Sample Documents

### Article (published)
```
{
  "_id": "65f...",
  "author_id": "65a...",
  "title": "How to Cache Like a Pro",
  "slug": "how-to-cache-like-a-pro",
  "excerpt": "Caching is one of the highest-leverage...",
  "content": "<p>Caching is...</p>",
  "tags": ["caching", "performance", "redis"],
  "status": "published",
  "word_count": 1240,
  "estimated_read_minutes": 6,
  "moderation": {
    "last_verdict": "approved",
    "confidence": 0.94,
    "reasons": [],
    "model": "llama-3.3-70b-versatile",
    "decided_at": "2026-04-22T10:01:14Z",
    "decided_by": "ai"
  },
  "published_at": "2026-04-22T10:01:15Z",
  "version": 1,
  "stats_snapshot": { "reads": 412, "upvotes": 38, "downvotes": 2 },
  "created_at": "...", "updated_at": "..."
}
```

### Subscription
```
{
  "_id": "65d...",
  "user_id": "65a...",
  "plan": "pro",
  "status": "active",
  "daily_limit": 25,
  "period_start": "2026-04-01T00:00:00Z",
  "period_end": "2026-05-01T00:00:00Z",
  "cancel_at_period_end": false,
  "provider": "jazzcash",
  "provider_subscription_id": "JC-SUB-998877",
  "current_payment_id": "65e..."
}
```

### Read (time-series)
```
{
  "started_at": "2026-04-22T15:30:00Z",
  "meta": { "article_id": "65f...", "author_id": "65a..." },
  "user_id": "65b...",
  "session_id": "rs_a8f3...",
  "ended_at": "2026-04-22T15:36:42Z",
  "validated_seconds": 402,
  "heartbeats": 27,
  "is_valid": true,
  "fraud_score": 0.05
}
```

## 7. Migration Strategy

- No migration tool needed for MVP (Mongoose schemas are forward-compatible).
- Index creation: declared in schemas, applied at startup via `Model.syncIndexes()` in non-prod; manual in prod via a script in `scripts/sync-indexes.js`.
- Seed script: `scripts/seed.js` creates admin user + 10 sample articles for dev.

## 8. Backup & Recovery

- MongoDB Atlas auto-backups (daily snapshots, 7-day retention on shared tier).
- Disaster recovery test: restore latest snapshot to staging once before launch.
