import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Low-level call to the xAI (Grok) chat completions API. OpenAI-compatible.
 * `search` enables Grok Live Search (real-time X/web/news) for grounding.
 * Returns the parsed JSON object from the model (response_format json_object).
 */
async function grokJson({ system, user, search = null, temperature = 0.6 }) {
  if (!env.XAI_API_KEY) throw new Error('XAI_API_KEY is not configured');

  const body = {
    model: env.XAI_MODEL,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (search) body.search_parameters = search;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let res;
  try {
    res = await fetch(XAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.XAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`xAI HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('xAI response missing content');
  try {
    return JSON.parse(raw);
  } catch (err) {
    logger.warn({ raw: raw.slice(0, 300) }, 'xAI returned non-JSON content');
    throw new Error(`xAI JSON parse failed: ${err.message}`);
  }
}

const RESEARCH_SYSTEM = `You are the editor of DevCrunch, a sharp tech-news site for developers and builders.
Using CURRENT, real information (you have live search), pick exactly ONE specific tech story that is genuinely trending RIGHT NOW and that builders/developers are interested in. It must fit one of these beats:
  - "ai": AI models, tools, agents, AI business/regulation
  - "startups": startups, funding rounds, big-tech product/strategy moves
  - "security": cybersecurity breaches, defenses, privacy, policy

Rules:
- Pick something SPECIFIC and CURRENT (a real, recent development) — not an evergreen explainer.
- Do NOT pick anything substantially covered in the "avoid" list.
- Only choose topics grounded in real, verifiable developments — no rumors you can't support.

Output ONLY this JSON (no prose):
{
  "topic": "a specific, concrete headline-style phrase",
  "angle": "one sentence describing the specific angle/why it matters now",
  "category": "ai" | "startups" | "security",
  "imageKeywords": ["3-5 concrete, visual Unsplash search terms relevant to the topic"]
}`;

const WRITE_SYSTEM = `You are a senior tech journalist writing for DevCrunch. Write ONE original, high-quality, SEO-optimized article on the given topic.

Hard rules:
- 900-1400 words. Sharp, knowledgeable, engaging (TechCrunch/The Verge but developer-savvy).
- Ground claims in real, verifiable facts. DO NOT fabricate specific statistics, exact figures, dates, or quotes. No invented quotes attributed to real people. If unsure of a specific, write analytically/qualitatively.
- HTML body using ONLY these tags: p, h2, h3, ul, ol, li, strong, em, blockquote, a (href ok). NO <h1>, NO <img>/<figure>, NO div/script/style.
- Open with a strong <p> hook, then 3-5 <h2> sections (use <h3> where useful), at least one <ul> and one <blockquote>.
- Insert EXACTLY 2 inline image placeholders as a literal <!--IMG--> on its own line, between sections (never at the very top, never adjacent).

Output ONLY this JSON (no prose):
{
  "title": "catchy, specific, credible headline (<= ~70 chars)",
  "metaTitle": "concise SEO title <= 60 chars",
  "excerpt": "compelling meta description, 150-160 characters",
  "tags": ["4-6 lowercase tags, hyphenate multiword"],
  "bodyHtml": "the article body per the rules above"
}`;

/** Find one specific, currently-trending tech topic (excluding recent coverage). */
export async function researchTrendingTopic({ avoid = [] } = {}) {
  const avoidList = avoid.length
    ? avoid.slice(0, 40).map((t) => `- ${t}`).join('\n')
    : '(none yet)';
  return grokJson({
    system: RESEARCH_SYSTEM,
    user: `Recently covered (AVOID these and anything very similar):\n${avoidList}\n\nReturn only the JSON object.`,
    temperature: 0.7,
    search: {
      mode: 'on',
      return_citations: false,
      max_search_results: 15,
      sources: [{ type: 'x' }, { type: 'news' }, { type: 'web' }],
    },
  });
}

/** Write the full article for a finalized topic. */
export async function writeArticle({ topic, angle, category }) {
  return grokJson({
    system: WRITE_SYSTEM,
    user: `Topic: ${topic}\nAngle: ${angle}\nBeat: ${category}\n\nWrite the article now. Return only the JSON object.`,
    temperature: 0.6,
    search: {
      mode: 'auto',
      return_citations: false,
      max_search_results: 10,
      sources: [{ type: 'news' }, { type: 'web' }, { type: 'x' }],
    },
  });
}

export function isGrokConfigured() {
  return Boolean(env.XAI_API_KEY);
}
