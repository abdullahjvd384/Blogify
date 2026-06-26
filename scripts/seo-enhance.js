/**
 * In-place SEO enhancer for the seeded DevCrunch articles.
 *
 * Non-destructive: it matches existing published articles by slug and only
 * updates content / meta_title / cover_image_alt / derived text. It NEVER
 * touches slugs, cover images, publish dates, author, or engagement stats — so
 * live URLs and the feed stay exactly as they are.
 *
 * What it does per article:
 *   1. meta_title       — a SERP-length (<=60 char) title for over-long headlines,
 *                         so Google stops truncating them. Display title is untouched.
 *   2. cover_image_alt  — descriptive, topical alt for the cover image.
 *   3. inline <img> alt — rewrites generic/empty Unsplash alts to topical text.
 *   4. internal links   — weaves up to 3 contextual links to related articles in
 *                         the same topic cluster (followable; see sanitizeHtml.js).
 *   5. recomputes content_text / word_count / estimated_read_minutes.
 *
 * Idempotent: re-running skips link insertion when internal links already exist;
 * everything else is deterministic. Only seeded editorial articles are touched.
 *
 * Usage:
 *   node --env-file=server/.env scripts/seo-enhance.js --dry          # preview, no writes
 *   node --env-file=server/.env scripts/seo-enhance.js --dry --limit=3
 *   node --env-file=server/.env scripts/seo-enhance.js                # apply
 */
import dns from 'node:dns';
// Atlas uses mongodb+srv; the local resolver often refuses SRV lookups, so point
// at public DNS first (same workaround as scripts/seed-devcrunch.js).
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
import { connectDb, disconnectDb } from '../server/src/config/db.js';
import { Article } from '../server/src/models/Article.js';
import { slugify } from '../server/src/utils/slug.js';
import { sanitizeArticleHtml } from '../server/src/utils/sanitizeHtml.js';
import { htmlToText } from '../server/src/utils/htmlToText.js';
import { humanize, insertInternalLinks } from '../server/src/utils/internalLinks.js';

const DRY = process.argv.includes('--dry');
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith('--limit='));
  return a ? Number(a.split('=')[1]) : Infinity;
})();

const WORDS_PER_MINUTE = 220;

// ---------------------------------------------------------------- category map
// Mirrors scripts/seed-devcrunch.js so we know each article's topic cluster.
const BATCH_CATEGORY = { 1: 'ai', 2: 'ai', 3: 'ai', 4: 'startups', 5: 'startups', 6: 'startups', 7: 'security', 8: 'security', 9: 'security' };

// ---------------------------------------------------------------- meta titles
// Authored, SERP-length (<=60) titles for headlines that are too long to render
// in search results. Keyed by the article's display title; resolved by slug so
// straight/smart apostrophes don't matter. Titles <=60 chars fall back below.
const META_TITLE_PAIRS = [
  ['Agentic Coding Grew Up in 2026: From Autocomplete to Agent Teams', 'Agentic Coding in 2026: From Autocomplete to Agents'],
  ['Your AI Agent Passes the Demo and Fails in Production. Evals Are Why.', 'Why AI Agents Pass the Demo but Fail in Production'],
  ['Your AI Coding Agent Is an Insider Threat. Treat It Like One.', 'Your AI Coding Agent Is an Insider Threat'],
  ["The $725 Billion Bet: Inside Big Tech's 2026 AI Compute Arms Race", "Inside Big Tech's $725B AI Compute Arms Race"],
  ["Money in a Loop: Is AI's Circular Financing Building a Bubble?", "Is AI's Circular Financing Building a Bubble?"],
  ['The Broken Bottom Rung: How AI Is Quietly Reshaping Entry-Level Work', 'How AI Is Reshaping Entry-Level Work in 2026'],
  ["Power, Not Chips: Why Electricity Became AI's Real Bottleneck in 2026", "Electricity: AI's Real Bottleneck in 2026"],
  ['The Barbell Market: Why AI Megarounds and a Capital Drought Coexist in 2026', 'AI Megarounds Meet a Capital Drought in 2026'],
  ['Where the Money Actually Goes in 2026: Defense, Robots, and AI Agents', 'Where VC Money Goes in 2026: Defense, Robots, AI'],
  ['Vibe Revenue and 50x Multiples: The 2026 AI Valuation Reckoning', "Vibe Revenue, 50x Multiples: AI's 2026 Reckoning"],
  ['The Exit Window Cracks Open: IPOs, M&A, and the Acqui-Hire Boom of 2026', 'Startup Exits in 2026: IPOs, M&A, and Acqui-Hires'],
  ['The 2026 Seed Playbook: Raising in a Market That Wants Revenue First', 'The 2026 Seed Playbook: Raising on Revenue First'],
  ['The $100B Bet to Dethrone Nvidia: Inside the AWS Silicon Pact', 'The $100B AWS-Anthropic Bet to Dethrone Nvidia'],
  ["Google's Antitrust Tightrope: Winning I/O While Fighting the DOJ", "Google's Antitrust Tightrope: I/O vs. the DOJ"],
  ['How to Build an AI Startup in 2026: The New Economics Every Founder Must Understand', 'How to Build an AI Startup in 2026: New Economics'],
  ['Usage, Seats, or Outcomes: The 2026 SaaS Pricing Playbook for the AI Agent Era', 'SaaS Pricing in 2026: Usage, Seats, or Outcomes?'],
  ['Beyond PLG: The Full-Stack Go-to-Market Playbook for Developer Tools in 2026', 'Beyond PLG: 2026 Go-to-Market for Dev Tools'],
  ["Bootstrapping vs. Venture Capital in 2026: A Founder's Decision Framework for a Selective Market", 'Bootstrapping vs. Venture Capital in 2026'],
  ['Product-Market Fit for AI Products in 2026: The Retention-First Signals That Actually Matter', 'Product-Market Fit for AI Products in 2026'],
  ["Ransomware in 2026: When the Encryption Stops but the Extortion Doesn't", 'Ransomware in 2026: Extortion Without Encryption'],
  ['Poisoning the Well: How Supply-Chain Attacks Are Hitting Developers Where They Build', 'Supply-Chain Attacks Are Hitting Developers Hard'],
  ['Identity Is the New Perimeter: Inside the Rise of Session and Token Theft', 'Identity Is the New Perimeter: Token Theft Rises'],
  ['The AI-fication of Cyberthreats: Deepfakes, Prompt Injection, and Rogue Agents', 'AI Cyberthreats: Deepfakes and Prompt Injection'],
  ['Edge Under Siege: Why Your VPN and Firewall Became the Front Line', 'Edge Under Siege: VPNs and Firewalls on the Line'],
  ['Beyond the SBOM: A Practical Supply-Chain Security Playbook for 2026', 'Beyond the SBOM: Supply-Chain Security for 2026'],
  ['Killing the Hardcoded Key: Secrets Management and Non-Human Identity in 2026', 'Secrets Management & Non-Human Identity in 2026'],
  ["Securing the Agent: A Defender's Guide to LLM and Agentic AI Application Security", 'Securing the Agent: LLM & Agentic AI Defense'],
  ['From Posture to Risk: Modernizing Cloud Security with CSPM and CNAPP in 2026', 'Cloud Security in 2026: CSPM, CNAPP, and Risk'],
  ['Phishing-Resistant by Default: Building an Identity Security Program for the AI Phishing Era', 'Phishing-Resistant by Default: Identity in 2026'],
  ['The 20-State Privacy Patchwork: Why 2026 Is the Year Compliance Got Impossible', 'The 20-State Privacy Patchwork of 2026'],
  ["One Click to Disappear: Inside California's DROP and the New War on Data Brokers", "California's DROP and the War on Data Brokers"],
  ['Buying Their Way Around the Fourth Amendment: How the Government Shops for Your Data', 'How the Government Buys Your Data Legally'],
  ['Your Face Is Now the Password: The Hidden Privacy Cost of Age-Verification Mania', "Age Verification's Hidden Privacy Cost"],
  ['The Reckoning Arrives: How 2026 Forced AI to Confront the Privacy It Was Built On', 'How 2026 Forced AI to Confront Its Privacy Problem'],
];
const META_BY_SLUG = new Map(META_TITLE_PAIRS.map(([t, m]) => [slugify(t), m]));

function computeMetaTitle(title, slug) {
  const authored = META_BY_SLUG.get(slug);
  if (authored) return authored;
  const withBrand = `${title} · DevCrunch`;
  if (withBrand.length <= 60) return withBrand;
  if (title.length <= 60) return title;
  return `${title.slice(0, 57).replace(/\s+\S*$/, '').trim()}…`;
}

// ---------------------------------------------------------------- alt text
const COVER_LEAD = { ai: 'Abstract illustration of', startups: 'Business illustration representing', security: 'Cybersecurity illustration of' };
const INLINE_LEAD = { ai: 'Illustration related to', startups: 'Photo illustrating', security: 'Security concept:' };

function coverAlt(category, tags) {
  const phrase = humanize(tags[0] || category);
  return `${COVER_LEAD[category] || 'Illustration of'} ${phrase}`.slice(0, 160);
}
function inlineAlt(category, tags, idx) {
  // offset by 1 so inline alts differ from the cover's primary-tag phrasing
  const tag = tags.length ? tags[(idx + 1) % tags.length] : category;
  return `${INLINE_LEAD[category] || 'Illustration of'} ${humanize(tag)}`.slice(0, 160);
}

// ---------------------------------------------------------------- escaping
const escAttr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- transforms
function rewriteImgAlts(html, category, tags) {
  let idx = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = inlineAlt(category, tags, idx);
    idx += 1;
    if (/\salt\s*=\s*"/i.test(tag)) {
      return tag.replace(/(\salt\s*=\s*")[^"]*(")/i, `$1${escAttr(alt)}$2`);
    }
    return tag.replace(/<img\b/i, `<img alt="${escAttr(alt)}"`);
  });
}

// Related articles in the same cluster, ranked by shared-tag overlap.
function relatedFor(current, all) {
  return all
    .filter((a) => a.slug !== current.slug && a.category === current.category)
    .map((a) => ({ ...a, score: a.tags.filter((t) => current.tags.includes(t)).length }))
    .sort((x, y) => y.score - x.score || x.slug.localeCompare(y.slug))
    .slice(0, 6);
}

// ---------------------------------------------------------------- main
async function main() {
  // Sanity-check authored meta titles up front.
  const tooLong = META_TITLE_PAIRS.filter(([, m]) => m.length > 60);
  if (tooLong.length) {
    console.error('Authored meta_title over 60 chars:', tooLong.map(([, m]) => `${m} (${m.length})`));
    process.exit(1);
  }

  await connectDb();

  // Only seeded editorial articles — never touch real user content.
  const docs = await Article.find({ 'moderation.model': 'editorial', deleted_at: null });
  console.log(`found ${docs.length} seeded articles${DRY ? ' (DRY RUN — no writes)' : ''}`);

  const categoryOf = (a) => {
    const t = (a.tags || []).join(' ');
    if (/security|privacy|ransomware|phishing|supply-chain|identity|vulnerabilit|surveillance|data-broker|encryption|zero-trust|infostealer|sbom|secrets|cspm|cnapp/.test(t)) return 'security';
    if (/funding|venture|startup|founder|saas|go-to-market|pricing|ipo|bootstrap|valuation|seed|acqui|megaround|exit/.test(t)) return 'startups';
    return 'ai';
  };

  const all = docs.map((d) => ({ slug: d.slug, title: d.title, tags: d.tags || [], category: categoryOf(d) }));

  let changed = 0;
  let totalLinks = 0;
  let shown = 0;
  for (const doc of docs) {
    if (shown >= LIMIT) break;
    shown += 1;

    const meta = all.find((a) => a.slug === doc.slug);
    const category = meta.category;
    const tags = doc.tags || [];

    const metaTitle = computeMetaTitle(doc.title, doc.slug);
    const cAlt = coverAlt(category, tags);

    let html = rewriteImgAlts(doc.content || '', category, tags);
    const related = relatedFor(meta, all);
    const linkRes = insertInternalLinks(html, meta, related);
    html = linkRes.html;

    const safe = sanitizeArticleHtml(html);
    const text = htmlToText(safe);
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const readMin = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

    totalLinks += linkRes.total;
    if (linkRes.added || linkRes.skipped || metaTitle !== doc.meta_title || cAlt !== doc.cover_image_alt) changed += 1;

    if (DRY || shown <= 3) {
      console.log(`\n• ${doc.slug}  [${category}]`);
      console.log(`  meta_title (${metaTitle.length}): ${metaTitle}`);
      console.log(`  cover_alt: ${cAlt}`);
      console.log(`  internal links: ${linkRes.skipped ? `skipped (already ${linkRes.total})` : `${linkRes.added} → ` + linkRes.links.map((l) => `${l.anchor} → /${l.slug}`).join(' | ')}`);
      console.log(`  words: ${doc.word_count} → ${words} (read ${readMin}m)`);
    }

    if (!DRY) {
      doc.content = safe;
      doc.content_text = text;
      doc.word_count = words;
      doc.estimated_read_minutes = readMin;
      doc.meta_title = metaTitle;
      doc.cover_image_alt = cAlt;
      await doc.save();
    }
  }

  console.log(`\n${DRY ? 'would update' : 'updated'} ${changed} articles · internal links present: ${totalLinks}`);
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error('seo-enhance failed:', err);
  process.exit(1);
});
