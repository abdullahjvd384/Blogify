import { env } from '../config/env.js';

const SEARCH_URL = 'https://api.unsplash.com/search/photos';

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const coverUrl = (raw) => `${raw}&w=1600&h=900&fit=crop&crop=entropy&q=80&fm=jpg`;
export const inlineUrl = (raw) => `${raw}&w=1200&q=80&fit=max&fm=jpg`;

/** Renders a captioned <figure> for an inline image (sanitizer allows these tags). */
export function figureHtml(photo) {
  const alt = esc(photo.alt || 'Illustration');
  const caption = esc(
    `${(photo.alt || 'Illustration').replace(/^\w/, (c) => c.toUpperCase())} · Photo by ${photo.author} on Unsplash`,
  );
  return `<figure><img src="${inlineUrl(photo.raw)}" alt="${alt}" /><figcaption>${caption}</figcaption></figure>`;
}

/** Search Unsplash for landscape photos matching a query. Returns [] on failure. */
export async function searchUnsplash(query, perPage = 12) {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return (json.results || [])
    .filter((p) => p?.urls?.raw)
    .map((p) => ({ raw: p.urls.raw, alt: p.alt_description || '', author: p.user?.name || 'Unsplash' }));
}

/**
 * Sources imagery for one article: a cover photo + N inline figures, drawn from
 * the given keywords (deduped, shuffled). Returns nulls/empties when Unsplash is
 * unavailable so the caller can still publish text-only.
 *
 * @returns {Promise<{ cover: string|null, coverAlt: string|null, inlineFigures: string[] }>}
 */
export async function buildArticleImagery(keywords = [], inlineCount = 2) {
  const need = inlineCount + 1;
  const seen = new Set();
  const photos = [];
  for (const kw of keywords.slice(0, 4)) {
    if (photos.length >= need + 3) break;
    const found = await searchUnsplash(kw);
    for (const p of found) {
      if (!seen.has(p.raw)) {
        seen.add(p.raw);
        photos.push(p);
      }
    }
  }
  // shuffle for variety
  for (let i = photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [photos[i], photos[j]] = [photos[j], photos[i]];
  }
  const cover = photos[0] || null;
  const inline = photos.slice(1, 1 + inlineCount);
  return {
    cover: cover ? coverUrl(cover.raw) : null,
    coverAlt: cover ? cover.alt || null : null,
    inlineFigures: inline.map(figureHtml),
  };
}
