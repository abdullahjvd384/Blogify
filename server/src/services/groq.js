import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a strict but fair content moderator for a public blogging platform.

Decide whether the submitted article should be:
  - "approved":     fit to publish as-is
  - "rejected":     clearly violates the policy and should not be published
  - "needs_review": ambiguous; a human moderator should look

Reject for: explicit sexual content, gratuitous violence, hate speech, harassment,
self-harm encouragement, illegal activity instructions, doxxing, spam/SEO link bait,
plagiarism that's obvious, or content with no substantive point.

Approve everything else, including: opinionated takes, technical content, profanity in
moderation, criticism of public figures, and fiction with mature but non-explicit themes.

Output ONLY a single JSON object matching this schema, no prose, no markdown fences:
{
  "verdict": "approved" | "rejected" | "needs_review",
  "confidence": number between 0 and 1,
  "reasons": string[],            // 0–3 short, specific reasons
  "suggested_tags": string[]      // 0–5 lowercase topic tags
}`;

/**
 * Calls GROQ chat completions and parses the moderation verdict.
 * Throws on network/HTTP/parse failure — the worker catches and decides retry.
 *
 * Returns: { verdict, confidence, reasons, suggestedTags, model, raw }
 */
export async function moderateArticle({ title, content, tags = [] }) {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const userPrompt = [
    `Title: ${title}`,
    tags.length ? `Existing tags: ${tags.join(', ')}` : null,
    '',
    'Article:',
    content.length > 8000 ? `${content.slice(0, 8000)}\n…(truncated)` : content,
  ]
    .filter(Boolean)
    .join('\n');

  const body = {
    model: env.GROQ_MODERATION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GROQ HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('GROQ response missing content');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    logger.warn({ raw }, 'GROQ returned non-JSON content');
    throw new Error(`GROQ JSON parse failed: ${err.message}`);
  }

  return normalize(parsed, env.GROQ_MODERATION_MODEL, json);
}

const VALID_VERDICTS = new Set(['approved', 'rejected', 'needs_review']);

/** Coerces the model output into our shape; falls back to needs_review on weird data. */
function normalize(parsed, model, raw) {
  const verdict = VALID_VERDICTS.has(parsed?.verdict) ? parsed.verdict : 'needs_review';
  const confidence = clamp01(Number(parsed?.confidence));
  const reasons = toStringArray(parsed?.reasons).slice(0, 5);
  const suggestedTags = toStringArray(parsed?.suggested_tags)
    .map((t) => t.toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 5);

  return { verdict, confidence, reasons, suggestedTags, model, raw };
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function toStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim())
    .filter(Boolean);
}
