import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import { uniqueSlug } from '../utils/slug.js';
import { sanitizeArticleHtml } from '../utils/sanitizeHtml.js';
import { htmlToText } from '../utils/htmlToText.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { researchTrendingTopic, writeArticle, isContentAIConfigured } from './contentAI.js';
import { buildArticleImagery } from './unsplash.js';
import { moderateArticle } from './openai.js';

// Rotate generated articles across the seeded writer personas, by beat.
const AUTHOR_POOL = {
  ai: ['nadiabrooks', 'sofiaalmeida', 'hanasuzuki', 'ryanmitchell'],
  startups: ['marcuslee', 'tombecker', 'davidokafor', 'hanasuzuki'],
  security: ['priyanair', 'omarhaddad', 'elenapetrova', 'ryanmitchell'],
};
const FALLBACK_KEYWORDS = {
  ai: ['artificial intelligence', 'neural network', 'data center'],
  startups: ['startup office', 'venture capital', 'team collaboration'],
  security: ['cyber security', 'server room', 'programming code screen'],
};

const MIN_WORDS = 600;
const CONFIDENCE_FLOOR = 0.6;

function tokens(s = '') {
  return new Set(
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}
function similarity(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let overlap = 0;
  for (const t of A) if (B.has(t)) overlap += 1;
  return overlap / Math.min(A.size, B.size);
}

async function pickAuthor(category) {
  const pool = AUTHOR_POOL[category] || AUTHOR_POOL.ai;
  const username = pool[Math.floor(Math.random() * pool.length)];
  return (
    (await User.findOne({ username, role: 'writer', status: 'active' }).lean()) ||
    (await User.findOne({ role: 'writer', status: 'active' }).lean())
  );
}

/**
 * Research → write → image → gate → publish one trending article.
 * Returns { status, title, slug, id } or { skipped, reason }.
 * "Fully automatic" with a safety net: anything that trips the gate is saved as
 * `needs_review` (admin queue) instead of going live.
 */
export async function generateOneArticle() {
  if (!isContentAIConfigured()) {
    logger.warn('auto-content: OPENAI_API_KEY not set — skipping');
    return { skipped: true, reason: 'ai_not_configured' };
  }

  // 1. Recent coverage for dedup / avoid-list
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const recent = await Article.find({ status: 'published', published_at: { $gte: since } })
    .select('title')
    .sort({ published_at: -1 })
    .limit(60)
    .lean();
  const recentTitles = recent.map((r) => r.title);

  // 2. Research a trending topic
  const topic = await researchTrendingTopic({ avoid: recentTitles });
  const category = ['ai', 'startups', 'security'].includes(topic.category) ? topic.category : 'ai';
  if (recentTitles.some((t) => similarity(topic.topic, t) >= 0.6)) {
    logger.info({ topic: topic.topic }, 'auto-content: topic too similar to recent — skipping');
    return { skipped: true, reason: 'duplicate_topic', topic: topic.topic };
  }

  // 3. Write the article
  const art = await writeArticle({ topic: topic.topic, angle: topic.angle, category });
  if (!art?.title || !art?.bodyHtml) {
    return { skipped: true, reason: 'empty_generation' };
  }

  // 4. Imagery (cover + inline figures), inject into the body
  const keywords =
    Array.isArray(topic.imageKeywords) && topic.imageKeywords.length
      ? topic.imageKeywords
      : FALLBACK_KEYWORDS[category];
  const imagery = await buildArticleImagery(keywords, 2);
  let i = 0;
  const bodyWithImages = String(art.bodyHtml).replace(
    /<!--IMG-->/g,
    () => imagery.inlineFigures[i++] || '',
  );

  // 5. Sanitize + stats
  const safeHtml = sanitizeArticleHtml(bodyWithImages);
  const text = htmlToText(safeHtml);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const tags = Array.from(
    new Set((art.tags || []).map((t) => String(t).toLowerCase().trim()).filter(Boolean)),
  ).slice(0, 8);

  // 6. Safety + quality gate
  const reasons = [];
  if (wordCount < MIN_WORDS) reasons.push(`short:${wordCount}w`);
  if (!art.excerpt) reasons.push('no_excerpt');
  if (tags.length < 3) reasons.push('few_tags');

  let modSnapshot = {
    last_verdict: 'approved',
    confidence: 1,
    reasons: [],
    model: 'auto',
    decided_at: new Date(),
    decided_by: 'ai',
  };
  if (env.OPENAI_API_KEY) {
    try {
      const m = await moderateArticle({ title: art.title, content: text, tags });
      modSnapshot = {
        last_verdict: m.verdict,
        confidence: m.confidence,
        reasons: m.reasons,
        model: `auto+${m.model}`,
        decided_at: new Date(),
        decided_by: 'ai',
      };
      if (m.verdict === 'rejected') reasons.push('moderation_rejected');
      else if (m.verdict !== 'approved' || m.confidence < CONFIDENCE_FLOOR)
        reasons.push('moderation_uncertain');
    } catch (err) {
      logger.warn({ err: err.message }, 'auto-content: moderation call failed');
      reasons.push('moderation_unavailable');
    }
  }

  const passed = reasons.length === 0;
  const status = passed ? 'published' : 'needs_review';
  if (!passed) {
    modSnapshot.last_verdict = 'needs_review';
    modSnapshot.reasons = Array.from(new Set([...(modSnapshot.reasons || []), ...reasons]));
  }

  // 7. Author + slug
  const author = await pickAuthor(category);
  if (!author) return { skipped: true, reason: 'no_writer' };
  const slug = await uniqueSlug(art.title, async (s) => Boolean(await Article.exists({ slug: s })));

  // 8. Persist
  const doc = await Article.create({
    author_id: author._id,
    title: art.title,
    meta_title: (art.metaTitle || '').slice(0, 70),
    slug,
    excerpt: (art.excerpt || text.slice(0, 280)).slice(0, 280),
    content: safeHtml,
    content_format: 'html',
    content_text: text,
    cover_image_url: imagery.cover,
    cover_image_alt: (imagery.coverAlt || art.title).slice(0, 160),
    member_only: false,
    tags,
    status,
    word_count: wordCount,
    estimated_read_minutes: Math.max(1, Math.ceil(wordCount / 220)),
    published_at: status === 'published' ? new Date() : null,
    moderation: modSnapshot,
  });

  logger.info(
    { id: doc._id.toString(), slug, status, category, author: author.username, wordCount },
    `auto-content: ${status}`,
  );
  return { status, title: art.title, slug, id: doc._id.toString(), category, reasons };
}
