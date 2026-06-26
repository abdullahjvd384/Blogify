/**
 * Contextual internal-link weaving, shared by the auto-content pipeline
 * (server/src/services/contentGenerator.js) and the one-off SEO enhancer
 * (scripts/seo-enhance.js). Pure string transforms — no DB / IO.
 *
 * Internal links pass link equity between related articles and are a core
 * ranking + discovery signal. Multi-word topical phrases only (high precision,
 * no awkward single-word links), inserted into visible paragraph text only.
 */

export const MAX_LINKS = 3;

const ACRONYMS = new Set([
  'ai', 'llm', 'rag', 'mcp', 'sbom', 'slsa', 'ipo', 'saas', 'plg', 'cspm', 'cnapp',
  'iac', 'gdpr', 'ccpa', 'mfa', 'vpn', 'raas', 'aws', 'doj', 'eu', 'us', 'ci', 'cd',
  'fido2', 'section', 'drop',
]);

/** "supply-chain" -> "Supply Chain", "ai" -> "AI". */
export function humanize(tag = '') {
  return String(tag)
    .split('-')
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return w.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export const escHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escRe = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Multi-word topical phrases from an article's tags (anchor candidates). */
export function phrasesFor(c) {
  const out = [];
  for (const t of c.tags || []) {
    const h = humanize(t).toLowerCase();
    if (h.includes(' ') && h.length >= 8) out.push(h);
  }
  return out;
}

/** Rank candidate articles by shared-tag overlap with the current tags. */
export function relatedByTags(currentTags = [], candidates = [], limit = 6) {
  const cur = new Set(currentTags);
  return candidates
    .map((a) => ({ ...a, score: (a.tags || []).filter((t) => cur.has(t)).length }))
    .filter((a) => a.score > 0)
    .sort((x, y) => y.score - x.score || String(x.slug).localeCompare(String(y.slug)))
    .slice(0, limit);
}

/**
 * Weaves up to MAX_LINKS contextual internal links into the body. Walks the HTML
 * as alternating text/tag tokens so links are only ever inserted into visible
 * paragraph text (never inside tags, anchors, headings, or figures). If too few
 * contextual matches are found, tops up with a trailing "Related reading" line.
 * Idempotent: skips entirely if internal links already exist.
 */
export function insertInternalLinks(html, current, candidates) {
  if (/href="\/articles\//.test(html)) {
    const existing = (html.match(/href="\/articles\//g) || []).length;
    return { html, added: 0, links: [], skipped: true, total: existing };
  }
  const tokens = html.split(/(<[^>]+>)/);
  let inP = false;
  let aDepth = 0;
  let headDepth = 0;
  let figDepth = 0;
  let paraIdx = -1;
  const linkedSlugs = new Set();
  const linkedParas = new Set();
  const links = [];
  let remaining = MAX_LINKS;

  const cands = candidates.map((c) => ({ ...c, phrases: phrasesFor(c) })).filter((c) => c.phrases.length);

  for (let i = 0; i < tokens.length && remaining > 0; i++) {
    const tok = tokens[i];
    if (tok.startsWith('<')) {
      const m = /^<\s*(\/?)([a-zA-Z0-9]+)/.exec(tok);
      if (m) {
        const close = m[1] === '/';
        const name = m[2].toLowerCase();
        if (name === 'p') { if (close) inP = false; else { inP = true; paraIdx += 1; } }
        else if (name === 'a') aDepth += close ? -1 : 1;
        else if (/^h[1-6]$/.test(name)) headDepth += close ? -1 : 1;
        else if (name === 'figure' || name === 'figcaption') figDepth += close ? -1 : 1;
      }
      continue;
    }
    if (!inP || aDepth > 0 || headDepth > 0 || figDepth > 0) continue;
    if (linkedParas.has(paraIdx)) continue;

    for (const c of cands) {
      if (linkedSlugs.has(c.slug)) continue;
      let hit = null;
      for (const ph of c.phrases) {
        const mm = new RegExp(`\\b(${escRe(ph)})\\b`, 'i').exec(tok);
        if (mm) { hit = mm; break; }
      }
      if (hit) {
        const s = hit.index;
        const e = s + hit[0].length;
        tokens[i] = `${tok.slice(0, s)}<a href="/articles/${c.slug}" data-internal="1">${hit[0]}</a>${tok.slice(e)}`;
        linkedSlugs.add(c.slug);
        linkedParas.add(paraIdx);
        links.push({ slug: c.slug, anchor: hit[0] });
        remaining -= 1;
        break;
      }
    }
  }

  let out = tokens.join('');
  if (linkedSlugs.size < MAX_LINKS) {
    const extra = candidates.filter((c) => !linkedSlugs.has(c.slug)).slice(0, MAX_LINKS - linkedSlugs.size);
    if (extra.length) {
      const items = extra.map((c) => `<a href="/articles/${c.slug}" data-internal="1">${escHtml(c.title)}</a>`);
      const joined = items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
      out += `<p><strong>Related reading:</strong> ${joined}.</p>`;
      extra.forEach((c) => { linkedSlugs.add(c.slug); links.push({ slug: c.slug, anchor: `[related] ${c.title}` }); });
    }
  }
  return { html: out, added: links.length, links, skipped: false, total: linkedSlugs.size };
}
