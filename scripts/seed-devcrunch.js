/**
 * DevCrunch content seeder.
 *
 * - Wipes legacy test data (@blog.local, @example.com, moderation.model 'seed')
 *   and any previous DevCrunch seed (so it's safe to re-run).
 * - Creates ~10 realistic author profiles.
 * - Inserts the ~45 articles authored by the writer agents (scripts/content/batch-*.json),
 *   sourcing relevant high-res cover + inline images from Unsplash (rate-limit aware),
 *   sanitizing HTML, and spreading realistic publish dates + engagement stats.
 *
 * Usage (key required for images):
 *   UNSPLASH_KEY=xxxx node --env-file=server/.env scripts/seed-devcrunch.js
 */
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../server/src/config/db.js';
import { User } from '../server/src/models/User.js';
import { Article } from '../server/src/models/Article.js';
import { uniqueSlug } from '../server/src/utils/slug.js';
import { sanitizeArticleHtml } from '../server/src/utils/sanitizeHtml.js';
import { htmlToText } from '../server/src/utils/htmlToText.js';

const UNSPLASH_KEY = process.env.UNSPLASH_KEY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- authors
const AUTHORS = [
  { name: 'Nadia Brooks', username: 'nadiabrooks', bio: 'AI correspondent. Covering frontier models, the labs racing to build them, and what it means for the rest of us.' },
  { name: 'Marcus Lee', username: 'marcuslee', bio: 'Startups & venture. Following the money, the rounds, and the founders betting against the odds.' },
  { name: 'Priya Nair', username: 'priyanair', bio: 'Security reporter. Breaches, threat actors, and the defenders trying to stay one step ahead.' },
  { name: 'Tom Becker', username: 'tombecker', bio: 'Big tech & platforms. Strategy, products, and the power plays inside the giants.' },
  { name: 'Sofia Almeida', username: 'sofiaalmeida', bio: 'ML engineer turned writer. Deep dives on how modern AI actually works under the hood.' },
  { name: 'David Okafor', username: 'davidokafor', bio: 'Two-time founder. Writing the startup playbook I wish I had — GTM, pricing, and hard lessons.' },
  { name: 'Elena Petrova', username: 'elenapetrova', bio: 'Privacy & policy. Where technology meets regulation, rights, and the public interest.' },
  { name: 'Ryan Mitchell', username: 'ryanmitchell', bio: 'Developer tools & engineering. Shipping notes on the tools changing how we build software.' },
  { name: 'Hana Suzuki', username: 'hanasuzuki', bio: 'AI business analyst. The economics, strategy, and money behind the AI boom.' },
  { name: 'Omar Haddad', username: 'omarhaddad', bio: 'Threat intelligence analyst. Translating attacker tradecraft into things defenders can use.' },
];
const SEED_USERNAMES = AUTHORS.map((a) => a.username);

// per-category author rotation
const AUTHOR_POOL = {
  ai: ['nadiabrooks', 'sofiaalmeida', 'hanasuzuki', 'ryanmitchell'],
  startups: ['marcuslee', 'tombecker', 'davidokafor', 'hanasuzuki'],
  security: ['priyanair', 'omarhaddad', 'elenapetrova', 'ryanmitchell'],
};

const BATCH_CATEGORY = { 1: 'ai', 2: 'ai', 3: 'ai', 4: 'startups', 5: 'startups', 6: 'startups', 7: 'security', 8: 'security', 9: 'security' };

const KEYWORDS = {
  ai: ['artificial intelligence', 'neural network', 'data center server', 'computer chip', 'robot technology', 'machine learning', 'futuristic interface', 'circuit board'],
  startups: ['startup office', 'venture capital', 'business meeting', 'team collaboration', 'modern workspace', 'entrepreneur laptop', 'financial growth chart', 'coworking space'],
  security: ['cyber security', 'hacker computer code', 'padlock security', 'server room', 'network data', 'programming code screen', 'digital privacy', 'encryption technology'],
};

// ---------------------------------------------------------------- unsplash
async function unsplashSearch(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!res.ok) throw new Error(`Unsplash ${res.status} for "${query}": ${(await res.text()).slice(0, 150)}`);
  const json = await res.json();
  return (json.results || [])
    .filter((p) => p?.urls?.raw)
    .map((p) => ({ raw: p.urls.raw, alt: p.alt_description || '', author: p.user?.name || 'Unsplash' }));
}

const pools = {}; // category -> { photos: [], idx: 0 }
async function buildPools() {
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    const photos = [];
    const seen = new Set();
    for (const kw of kws) {
      const found = await unsplashSearch(kw);
      for (const p of found) {
        if (!seen.has(p.raw)) {
          seen.add(p.raw);
          photos.push(p);
        }
      }
      process.stdout.write('.');
    }
    // shuffle for variety
    for (let i = photos.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [photos[i], photos[j]] = [photos[j], photos[i]];
    }
    pools[cat] = { photos, idx: 0 };
    console.log(` ${cat}: ${photos.length} photos`);
  }
}

function nextPhoto(cat) {
  const p = pools[cat];
  if (!p || !p.photos.length) throw new Error(`No photos for category ${cat}`);
  const ph = p.photos[p.idx % p.photos.length];
  p.idx += 1;
  return ph;
}

const coverUrl = (raw) => `${raw}&w=1600&h=900&fit=crop&crop=entropy&q=80&fm=jpg`;
const inlineUrl = (raw) => `${raw}&w=1200&q=80&fit=max&fm=jpg`;

function figure(photo) {
  const alt = esc(photo.alt || 'Illustration');
  const caption = esc(
    `${(photo.alt || 'Illustration').replace(/^\w/, (c) => c.toUpperCase())} · Photo by ${photo.author} on Unsplash`,
  );
  return `<figure><img src="${inlineUrl(photo.raw)}" alt="${alt}" /><figcaption>${caption}</figcaption></figure>`;
}

// ---------------------------------------------------------------- wipe
async function wipe() {
  const db = mongoose.connection.db;
  const del = async (col, q) => {
    try {
      const r = await db.collection(col).deleteMany(q);
      if (r.deletedCount) console.log(`  ${col}: -${r.deletedCount}`);
    } catch {
      /* collection may not exist */
    }
  };

  // legacy test users + previous seed authors
  const victims = await User.find({
    $or: [{ email: /@blog\.local$/i }, { email: /@example\.com$/i }, { username: { $in: SEED_USERNAMES } }],
  })
    .select('_id')
    .lean();
  const userIds = victims.map((v) => v._id);

  // articles from those users + any prior seed/editorial articles
  const arts = await Article.find({
    $or: [{ author_id: { $in: userIds } }, { 'moderation.model': { $in: ['seed', 'editorial'] } }],
  })
    .select('_id')
    .lean();
  const articleIds = arts.map((a) => a._id);

  console.log(`wiping: ${userIds.length} test/seed users, ${articleIds.length} articles + relations`);
  await del('moderation_jobs', { article_id: { $in: articleIds } });
  await del('article_versions', { article_id: { $in: articleIds } });
  await del('votes', { article_id: { $in: articleIds } });
  await del('comments', { article_id: { $in: articleIds } });
  await del('bookmarks', { article_id: { $in: articleIds } });
  await del('reads', { article_id: { $in: articleIds } });
  await del('articles', { _id: { $in: articleIds } });
  await del('reads', { user_id: { $in: userIds } });
  await del('notifications', { user_id: { $in: userIds } });
  await del('follows', { $or: [{ follower_id: { $in: userIds } }, { following_id: { $in: userIds } }] });
  await del('tag_follows', { user_id: { $in: userIds } });
  await del('refresh_tokens', { user_id: { $in: userIds } });
  await del('email_tokens', { user_id: { $in: userIds } });
  await del('subscriptions', { user_id: { $in: userIds } });
  await del('writer_wallets', { user_id: { $in: userIds } });
  await del('writer_earnings', { writer_id: { $in: userIds } });
  await del('users', { _id: { $in: userIds } });
}

// ---------------------------------------------------------------- seed
async function createAuthors() {
  const hash = await bcrypt.hash('DevCrunch!2026', 12);
  const byUsername = {};
  for (const a of AUTHORS) {
    const doc = await User.create({
      email: `${a.username}@devcrunch.tech`,
      password_hash: hash,
      name: a.name,
      username: a.username,
      bio: a.bio,
      role: 'writer',
      status: 'active',
      email_verified_at: new Date(),
      avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(a.username)}&backgroundColor=f1faf4,f0fdfa,faf9f6`,
      followers_count: rand(180, 14200),
      following_count: rand(24, 320),
      reputation_score: rand(120, 980),
    });
    byUsername[a.username] = doc;
    console.log(`  + @${a.username} (${a.name})`);
  }
  return byUsername;
}

function loadArticles() {
  const all = [];
  for (let i = 1; i <= 9; i++) {
    const file = path.join(CONTENT_DIR, `batch-${i}.json`);
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    const category = BATCH_CATEGORY[i];
    arr.forEach((art) => all.push({ ...art, category }));
  }
  return all;
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('UNSPLASH_KEY env var is required (pass it inline when running).');
    process.exit(1);
  }
  await connectDb();

  console.log('fetching Unsplash image pools...');
  await buildPools();

  console.log('wiping test/old data...');
  await wipe();

  console.log('creating authors...');
  const authors = await createAuthors();

  console.log('preparing articles...');
  const articles = loadArticles();
  const counters = { ai: 0, startups: 0, security: 0 };

  // assign publish dates spread over the last ~80 days, then insert oldest-first
  // so the feed (sorted by _id desc) shows newest first.
  const now = Date.now();
  articles.forEach((a) => {
    a._publishedAt = new Date(now - rand(4, 80 * 24) * 60 * 60 * 1000);
  });
  articles.sort((a, b) => a._publishedAt - b._publishedAt);

  let inserted = 0;
  for (const art of articles) {
    const cat = art.category;
    const poolNames = AUTHOR_POOL[cat];
    const author = authors[poolNames[counters[cat] % poolNames.length]];
    counters[cat] += 1;

    // images: cover first, then one fresh photo per inline placeholder
    const cover = nextPhoto(cat);
    const body = art.bodyHtml.replace(/<!--IMG-->/g, () => figure(nextPhoto(cat)));

    const safeHtml = sanitizeArticleHtml(body);
    const text = htmlToText(safeHtml);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const slug = await uniqueSlug(art.title, async (s) => Boolean(await Article.exists({ slug: s })));

    await Article.create({
      author_id: author._id,
      title: art.title,
      slug,
      excerpt: art.excerpt,
      content: safeHtml,
      content_format: 'html',
      content_text: text,
      cover_image_url: coverUrl(cover.raw),
      member_only: Boolean(art.memberOnly),
      tags: (art.tags || []).map((t) => String(t).toLowerCase()).slice(0, 8),
      status: 'published',
      word_count: words,
      estimated_read_minutes: Math.max(1, Math.ceil(words / 220)),
      published_at: art._publishedAt,
      moderation: {
        last_verdict: 'approved',
        confidence: 0.97,
        reasons: [],
        model: 'editorial',
        decided_at: art._publishedAt,
        decided_by: 'admin',
      },
      stats_snapshot: {
        reads: rand(280, 9400),
        upvotes: rand(12, 540),
        downvotes: rand(0, 22),
        comments_count: 0,
      },
    });
    inserted += 1;
    process.stdout.write(inserted % 5 === 0 ? `${inserted} ` : '.');
  }

  console.log(`\ndone. inserted ${inserted} articles across ${AUTHORS.length} authors.`);
  console.log({
    users: await User.countDocuments(),
    publishedArticles: await Article.countDocuments({ status: 'published' }),
  });
  await disconnectDb();
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
