import { env } from '../config/env.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function parseJsonLoose(text) {
  if (!text) throw new Error('empty model output');
  const t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const s = t.indexOf('{');
    const e = t.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
    throw new Error('could not parse JSON from model output');
  }
}

async function openaiFetch(url, body, timeoutMs = 120_000) {
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Aggregate assistant text from an OpenAI Responses API result. */
function extractResponsesText(json) {
  if (typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text;
  const parts = [];
  for (const item of json.output || []) {
    if (Array.isArray(item.content)) {
      for (const c of item.content) {
        if ((c.type === 'output_text' || c.type === 'text') && typeof c.text === 'string') {
          parts.push(c.text);
        }
      }
    }
  }
  return parts.join('\n');
}

const RESEARCH_INSTRUCTIONS = `You are the editor of DevCrunch, a sharp tech-news site for developers and builders.
Use the web_search tool to find what is genuinely trending RIGHT NOW (today / this week) in tech, then pick exactly ONE specific, current story that builders/developers care about. It must fit one beat:
  - "ai": AI models, tools, agents, AI business/regulation
  - "startups": startups, funding rounds, big-tech product/strategy moves
  - "security": cybersecurity breaches, defenses, privacy, policy
Rules: pick something SPECIFIC and CURRENT (a real, recent development, not evergreen). It must be a genuine time-sensitive event (launch, breach, funding, ruling, release) — a query that DESERVES freshness — not a topic chosen just because it trends. Do NOT pick anything substantially in the "avoid" list. Only choose topics grounded in real, verifiable, recent sources.
Also decide the PRIMARY KEYWORD: the short head search query a real reader would type into Google for this story (e.g. "openai gpt-5 launch", "okta data breach"). 2-5 words, lowercase, includes the key entity (company/product).
Respond with ONLY this JSON (no prose, no markdown fences):
{"topic":"specific headline-style phrase","angle":"one sentence on the specific angle/why it matters now","category":"ai|startups|security","primaryKeyword":"2-5 word head search query","imageKeywords":["3-5 concrete visual Unsplash search terms"]}`;

const WRITE_SYSTEM = `You are a senior tech journalist writing for DevCrunch. Write ONE original, high-quality, SEO-optimized news article on the given topic.
Hard rules:
- 900-1400 words. Sharp, knowledgeable, engaging. (There is no magic ranking word count — write what the story needs within this range.)
- Ground claims in real, verifiable facts. DO NOT fabricate specific statistics, exact figures, dates, or quotes. No invented quotes attributed to real people. If unsure, write qualitatively. Add genuine analysis / "why it matters to builders" — do not just rephrase a press release.
- SEO: use the PRIMARY KEYWORD verbatim (or near-verbatim) in the title, within the first 100 words, and in at least one <h2>. Use it naturally elsewhere — never stuff it.
- Open with a strong news lede <p>: the first 1-2 sentences must answer who / what / when / why it matters, and contain the primary keyword.
- HTML body using ONLY these tags: p, h2, h3, ul, ol, li, strong, em, blockquote, a (href ok). NO <h1>, NO <img>/<figure>, NO div/script/style.
- After the lede, add a one-paragraph <p> starting with "<strong>The gist:</strong>" — a 1-2 sentence TL;DR summary (good for featured snippets).
- Then 3-5 <h2> sections (use <h3> where useful), at least one <ul> and one <blockquote>.
- Insert EXACTLY 2 inline image placeholders as a literal <!--IMG--> on its own line, between sections (never at the very top, never adjacent).
Respond with ONLY this JSON (no prose, no fences):
{"title":"catchy specific headline <=70 chars, primary keyword near the front","metaTitle":"SEO title <=60 chars incl. primary keyword","excerpt":"150-160 char meta description incl. primary keyword + why it matters","tags":["4-6 lowercase tags"],"bodyHtml":"the article body"}`;

/** Research one specific, currently-trending tech topic via OpenAI web search. */
export async function researchTrendingTopic({ avoid = [] } = {}) {
  const avoidList = avoid.length ? avoid.slice(0, 40).map((t) => `- ${t}`).join('\n') : '(none yet)';
  const base = {
    model: env.OPENAI_CONTENT_MODEL,
    instructions: RESEARCH_INSTRUCTIONS,
    input: `Recently covered (AVOID these and anything very similar):\n${avoidList}\n\nFind a fresh trending topic and return only the JSON object.`,
  };
  // The web-search tool type is "web_search" (GA) or "web_search_preview"
  // depending on the API version — try the current name, fall back to the other.
  let lastErr;
  for (const toolType of ['web_search', 'web_search_preview']) {
    try {
      const json = await openaiFetch(OPENAI_RESPONSES_URL, { ...base, tools: [{ type: toolType }] });
      return parseJsonLoose(extractResponsesText(json));
    } catch (err) {
      lastErr = err;
      if (/tool|web_search/i.test(err.message)) continue; // wrong tool name — try the other
      throw err;
    }
  }
  throw lastErr;
}

/** Write the full article for a finalized topic. */
export async function writeArticle({ topic, angle, category, primaryKeyword }) {
  const kw = (primaryKeyword || topic || '').toString().trim();
  const json = await openaiFetch(OPENAI_CHAT_URL, {
    model: env.OPENAI_CONTENT_MODEL,
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: WRITE_SYSTEM },
      {
        role: 'user',
        content: `Topic: ${topic}\nAngle: ${angle}\nBeat: ${category}\nPrimary keyword (use verbatim in title, first 100 words, and one H2): ${kw}\n\nWrite the article now. Return only the JSON object.`,
      },
    ],
  });
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('OpenAI write: missing content');
  return parseJsonLoose(raw);
}

export function isContentAIConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}
