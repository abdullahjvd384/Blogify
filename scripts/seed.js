/**
 * Dev seed script. Idempotent — safe to re-run.
 *
 * Creates:
 *   - 1 admin (admin@blog.local / admin123!)
 *   - 1 demo writer (writer@blog.local / writer123!)
 *   - 10 sample published articles authored by the writer
 *
 * Usage:
 *   node --env-file=server/.env scripts/seed.js
 */
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../server/src/config/db.js';
import { User } from '../server/src/models/User.js';
import { Article } from '../server/src/models/Article.js';
import { Subscription } from '../server/src/models/Subscription.js';
import { uniqueSlug, slugify, slugSuffix } from '../server/src/utils/slug.js';
import { DEFAULT_PLAN } from '../shared/src/index.js';

const ADMIN = { email: 'admin@blog.local', password: 'admin123!', name: 'Admin', role: 'admin', username: 'admin' };
const WRITER = { email: 'writer@blog.local', password: 'writer123!', name: 'Demo Writer', role: 'writer', username: 'demo-writer' };

const SAMPLES = [
  { title: 'Getting Started with Node.js', tags: ['node', 'tutorial'], excerpt: 'A friendly walkthrough of the Node.js runtime, npm, and your first HTTP server.' },
  { title: 'Why MongoDB Beats SQL for Content Apps', tags: ['mongodb', 'database'], excerpt: 'Schemas evolve. Documents bend. Why a content platform should pick MongoDB.' },
  { title: 'The Hidden Cost of useEffect', tags: ['react', 'performance'], excerpt: 'How over-using useEffect creates re-render storms — and what to do instead.' },
  { title: 'Caching Like a Pro with Redis', tags: ['redis', 'caching', 'performance'], excerpt: 'Atomic counters, TTLs, and the patterns that make Redis disappear from your bug tracker.' },
  { title: 'Designing JWT Refresh Token Rotation', tags: ['auth', 'security'], excerpt: 'Stop leaking refresh tokens. A practical guide to rotation, revocation, and reuse detection.' },
  { title: 'BullMQ in Production: 5 Patterns', tags: ['queues', 'bullmq'], excerpt: 'Concurrency, retries, DLQs, idempotency, and graceful shutdown — the patterns I always reach for.' },
  { title: 'Tailwind Without the Class Soup', tags: ['css', 'tailwind'], excerpt: 'Composing utilities, variants, and components without ending up with 80-char className chains.' },
  { title: 'Writing JSDoc That Actually Helps', tags: ['javascript', 'docs'], excerpt: 'JSDoc is a typing system if you let it be. Here is how to wield it.' },
  { title: 'Pino vs Winston: A Honest Comparison', tags: ['logging', 'observability'], excerpt: 'Two great loggers, two different philosophies. Pick the right one for your team.' },
  { title: 'Pakistani Payment Gateways for Developers', tags: ['payments', 'jazzcash', 'pakistan'], excerpt: 'A no-marketing rundown of the major Pakistani payment options for SaaS builders.' },
];

const LOREM = `Caching is one of the highest-leverage optimizations available. The hard part is invalidation. In this article we explore patterns that reduce both latency and cost without sacrificing freshness.

Start by mapping your read paths: which queries are repeated, which are unique per user, and which carry expensive joins. Cache only the repeated ones. Mark cache entries with a clear TTL and a versioned key — when the underlying data changes, bump the version and let TTL evict stale entries gracefully.

Avoid cache stampedes by using request coalescing or stale-while-revalidate. For hot keys, consider a small in-process LRU in front of Redis to cut even the network hop. Measure before and after — your dashboard is the only judge that matters.`;

async function ensureUser({ email, password, name, role, username }) {
  const existing = await User.findOne({ email });
  let user = existing;
  if (existing) {
    let changed = false;
    if (existing.role !== role) {
      existing.role = role;
      existing.email_verified_at = existing.email_verified_at || new Date();
      changed = true;
      console.log(`  updated role: ${email} -> ${role}`);
    }
    if (username && existing.username !== username) {
      existing.username = username;
      changed = true;
      console.log(`  set username: ${email} -> @${username}`);
    }
    if (changed) await existing.save();
    else console.log(`  exists: ${email}`);
  } else {
    const password_hash = await bcrypt.hash(password, 12);
    user = await User.create({
      email,
      password_hash,
      name,
      username: username || null,
      role,
      email_verified_at: new Date(),
    });
    console.log(`  created: ${email} (${role}) @${username || '—'}`);
  }
  await Subscription.updateOne(
    { user_id: user._id },
    { $setOnInsert: { plan: DEFAULT_PLAN, status: 'active', started_at: new Date() } },
    { upsert: true },
  );
  return user;
}

async function ensureSampleArticles(authorId) {
  const existing = await Article.countDocuments({ author_id: authorId });
  if (existing >= SAMPLES.length) {
    console.log(`  ${existing} articles already present, skipping`);
    return;
  }

  for (const sample of SAMPLES) {
    const slug = await uniqueSlug(sample.title, async (s) =>
      Boolean(await Article.exists({ slug: s })),
    );
    const content = `${sample.excerpt}\n\n${LOREM}`;
    const words = content.trim().split(/\s+/).length;
    await Article.create({
      author_id: authorId,
      title: sample.title,
      slug,
      excerpt: sample.excerpt,
      content,
      content_format: 'plain',
      content_text: content,
      tags: sample.tags,
      status: 'published',
      word_count: words,
      estimated_read_minutes: Math.max(1, Math.ceil(words / 220)),
      published_at: new Date(),
      moderation: {
        last_verdict: 'approved',
        confidence: 0.95,
        reasons: [],
        model: 'seed',
        decided_at: new Date(),
        decided_by: 'admin',
      },
    });
    console.log(`  + ${sample.title}  (${slug})`);
  }
}

/**
 * Assigns a unique handle to every user missing one. Idempotent and safe to
 * re-run — only touches users where username is null/absent.
 */
async function backfillUsernames() {
  const cursor = User.find({ $or: [{ username: null }, { username: { $exists: false } }] }).cursor();
  let count = 0;
  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    let base = (slugify(user.name) || 'user').slice(0, 20).replace(/-+$/, '') || 'user';
    if (base.length < 3) base = `${base}user`.slice(0, 20); // enforce min handle length
    const handle = await uniqueSlug(base, async (s) => Boolean(await User.exists({ username: s })));
    user.username = handle.slice(0, 30);
    try {
      await user.save();
      count += 1;
    } catch (err) {
      if (err?.code === 11000) {
        user.username = `user-${slugSuffix(5)}`;
        await user.save();
        count += 1;
      } else throw err;
    }
  }
  console.log(`  backfilled usernames: ${count}`);
}

/**
 * One-time migration to the free/member model. Legacy paid tiers (basic/pro/
 * god_tier) that are still active & unexpired become `member` (period kept);
 * everything else legacy becomes `free`. Idempotent.
 */
async function migrateSubscriptions() {
  const now = new Date();
  const legacy = { plan: { $in: ['basic', 'pro', 'god_tier'] } };
  const toMember = await Subscription.updateMany(
    {
      ...legacy,
      status: 'active',
      $or: [{ current_period_end: null }, { current_period_end: { $gt: now } }],
    },
    { $set: { plan: 'member', billing_cycle: 'monthly' } },
  );
  const toFree = await Subscription.updateMany(legacy, {
    $set: { plan: 'free', billing_cycle: null, current_period_end: null },
  });
  console.log(`  subscriptions → member: ${toMember.modifiedCount}, → free: ${toFree.modifiedCount}`);
}

/** Mark several of the writer's articles member-only so the meter/paywall is testable. */
async function markSampleMemberOnly(authorId) {
  const arts = await Article.find({ author_id: authorId, status: 'published' })
    .sort({ _id: 1 })
    .limit(6);
  for (const a of arts) {
    if (!a.member_only) {
      a.member_only = true;
      await a.save();
    }
  }
  console.log(`  marked ${arts.length} articles member-only`);
}

async function main() {
  await connectDb();
  console.log('seeding users...');
  await ensureUser(ADMIN);
  const writer = await ensureUser(WRITER);
  // A demo member so the unlocked experience is testable: member@blog.local / member123!
  const member = await ensureUser({
    email: 'member@blog.local',
    password: 'member123!',
    name: 'Demo Member',
    role: 'reader',
    username: 'demo-member',
  });
  await Subscription.updateOne(
    { user_id: member._id },
    {
      $set: {
        plan: 'member',
        billing_cycle: 'monthly',
        status: 'active',
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true },
  );

  console.log('migrating legacy subscriptions to free/member...');
  await migrateSubscriptions();

  console.log('backfilling usernames for any legacy users...');
  await backfillUsernames();

  console.log(`seeding articles for writer ${writer.email}...`);
  await ensureSampleArticles(writer._id);
  await markSampleMemberOnly(writer._id);

  const stats = {
    users: await User.countDocuments(),
    articles: await Article.countDocuments(),
    published: await Article.countDocuments({ status: 'published' }),
  };
  console.log('done', stats);
  await disconnectDb();
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('seed failed', err);
  process.exit(1);
});
