import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Article } from './models/Article.js';
import { env } from './config/env.js';

const CLIENT_DIST = path.resolve(fileURLToPath(import.meta.url), '../../../client/dist');
const INDEX_PATH = path.join(CLIENT_DIST, 'index.html');
const BASE = (env.CLIENT_ORIGIN || 'https://devcrunch.tech').replace(/\/$/, '');

// index.html template, read once and cached. Server-rendered meta is injected
// between the <!--SEO-->/<!--/SEO--> markers in client/index.html.
let template;
function getTemplate() {
  if (template === undefined) {
    try {
      template = fs.readFileSync(INDEX_PATH, 'utf8');
    } catch {
      template = null;
    }
  }
  return template;
}

const SEO_BLOCK = /<!--SEO-->[\s\S]*?<!--\/SEO-->/;

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Lets Google show large image previews (required for the big Discover/Top
// Stories thumbnail) and full text/video snippets. Applied to every page.
const ROBOTS_PREVIEW = 'max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function metaBlock({
  title,
  ogTitle,
  description,
  url,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  jsonLd,
}) {
  const social = ogTitle || title;
  // jsonLd may be a single string or an array of JSON strings (e.g. homepage
  // emits Organization + WebSite; articles emit NewsArticle + BreadcrumbList).
  const jsonLdBlocks = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean);
  const lines = [
    '<!--SEO-->',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${ROBOTS_PREVIEW}" />`,
    env.GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${esc(env.GOOGLE_SITE_VERIFICATION)}" />`
      : '',
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${esc(type)}" />`,
    `<meta property="og:site_name" content="DevCrunch" />`,
    `<meta property="og:title" content="${esc(social)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    image && imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(social)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
    image && imageAlt ? `<meta name="twitter:image:alt" content="${esc(imageAlt)}" />` : '',
    publishedTime ? `<meta property="article:published_time" content="${esc(publishedTime)}" />` : '',
    modifiedTime ? `<meta property="article:modified_time" content="${esc(modifiedTime)}" />` : '',
    author ? `<meta property="article:author" content="${esc(author)}" />` : '',
    ...jsonLdBlocks.map((j) => `<script type="application/ld+json">${j}</script>`),
    '<!--/SEO-->',
  ];
  return lines.filter(Boolean).join('\n    ');
}

/** Coarse content section from tags, for schema.org articleSection + breadcrumbs. */
function sectionFor(tags = []) {
  const t = tags.join(' ');
  if (/security|privacy|ransomware|phishing|supply-chain|identity|vulnerabilit|surveillance|data-broker|encryption|zero-trust|infostealer|sbom|secrets/.test(t))
    return 'Security';
  if (/funding|venture|startup|founder|saas|go-to-market|pricing|ipo|bootstrap|valuation|seed|acqui|megaround/.test(t))
    return 'Startups';
  return 'AI';
}

/** Official DevCrunch social/profile URLs for sameAs (entity disambiguation). */
const SAME_AS = [
  'https://twitter.com/devcrunch',
  'https://github.com/devcrunch',
].filter(Boolean);

/** Serialize a schema.org object graph for safe embedding in a <script> tag. */
function ldJson(graph) {
  const data = { '@context': 'https://schema.org', '@graph': graph };
  // JSON.stringify drops undefined keys; escape < so a stray value can't close the tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function articleJsonLd({
  title,
  description,
  image,
  url,
  publishedTime,
  modifiedTime,
  author,
  authorUrl,
  authorBio,
  tags = [],
  section,
  wordCount,
}) {
  // NewsArticle is the correct semantic subtype for a news story; Google still
  // treats it as Article for rich results. headline must be <=110 chars.
  const article = {
    '@type': 'NewsArticle',
    headline: String(title).slice(0, 110),
    description,
    image: image ? [image] : undefined,
    datePublished: publishedTime || undefined,
    dateModified: modifiedTime || publishedTime || undefined,
    author: author
      ? {
          '@type': 'Person',
          name: author,
          url: authorUrl || undefined,
          description: authorBio || undefined,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'DevCrunch',
      logo: { '@type': 'ImageObject', url: `${BASE}/favicon.svg` },
    },
    keywords: tags.length ? tags.join(', ') : undefined,
    articleSection: section || undefined,
    wordCount: wordCount || undefined,
    inLanguage: 'en-US',
    mainEntityOfPage: url,
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${BASE}/articles` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };
  return ldJson([article, breadcrumb]);
}

/** Site-wide Organization + WebSite schema (homepage / non-article pages). */
function siteJsonLd() {
  const organization = {
    '@type': 'Organization',
    '@id': `${BASE}/#organization`,
    name: 'DevCrunch',
    url: `${BASE}/`,
    logo: { '@type': 'ImageObject', url: `${BASE}/favicon.svg` },
    description: 'Sharp, fast tech journalism on AI, startups, and cybersecurity, written by people who build.',
    sameAs: SAME_AS.length ? SAME_AS : undefined,
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${BASE}/#website`,
    name: 'DevCrunch',
    url: `${BASE}/`,
    publisher: { '@id': `${BASE}/#organization` },
    inLanguage: 'en-US',
  };
  return ldJson([organization, website]);
}

/**
 * SPA handler with per-article server-side meta injection. Article detail pages
 * (`/articles/:slug`) get title/description/OG/Twitter/JSON-LD reflecting the
 * actual article so crawlers and social scrapers (which don't run JS) see the
 * right tags on first byte. Everything else gets the default index.html.
 */
export async function spaHandler(req, res, next) {
  const tmpl = getTemplate();
  if (!tmpl) return next();

  const match = req.path.match(/^\/articles\/([^/]+)\/?$/);
  if (match) {
    try {
      const slug = decodeURIComponent(match[1]);
      const article = await Article.findOne({ slug, status: 'published', deleted_at: null })
        .populate('author_id', 'name username bio')
        .lean();
      if (article) {
        // <title> uses the SEO-tuned meta_title when set (keeps SERP titles from
        // truncating); social cards keep the full editorial title.
        const fullTitle = `${article.title} · DevCrunch`;
        const title = article.meta_title?.trim() || fullTitle;
        const description = (article.excerpt || article.content_text || '').slice(0, 200);
        const url = `${BASE}/articles/${encodeURIComponent(slug)}`;
        const image = article.cover_image_url || `${BASE}/og-image.png`;
        const imageAlt = article.cover_image_alt?.trim() || article.title;
        const publishedTime = article.published_at
          ? new Date(article.published_at).toISOString()
          : undefined;
        const modifiedTime = article.updated_at
          ? new Date(article.updated_at).toISOString()
          : undefined;
        const author = article.author_id?.name || 'DevCrunch';
        const authorUrl = article.author_id?.username
          ? `${BASE}/u/${article.author_id.username}`
          : undefined;
        const authorBio = article.author_id?.bio || undefined;
        const tags = article.tags || [];
        const section = sectionFor(tags);
        const html = tmpl.replace(
          SEO_BLOCK,
          metaBlock({
            title,
            ogTitle: fullTitle,
            description,
            url,
            image,
            imageAlt,
            type: 'article',
            publishedTime,
            modifiedTime,
            author,
            jsonLd: articleJsonLd({
              title: article.title,
              description,
              image,
              url,
              publishedTime,
              modifiedTime,
              author,
              authorUrl,
              authorBio,
              tags,
              section,
              wordCount: article.word_count,
            }),
          }),
        );
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch {
      // fall through to default template on any error
    }
  }

  // Non-article pages (homepage, feed, tag, etc.): keep the template's default
  // meta but inject site-wide Organization + WebSite schema, the large-preview
  // robots directive, and (optional) Search Console verification before the
  // closing marker so they appear on every page.
  const extras = [
    `<meta name="robots" content="${ROBOTS_PREVIEW}" />`,
    env.GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${esc(env.GOOGLE_SITE_VERIFICATION)}" />`
      : '',
    `<script type="application/ld+json">${siteJsonLd()}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
  const html = tmpl.replace('<!--/SEO-->', `${extras}\n    <!--/SEO-->`);
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
}

/** RSS 2.0 feed of the most recent published articles (for readers + aggregators). */
export async function rssHandler(_req, res, next) {
  try {
    const articles = await Article.find({ status: 'published', deleted_at: null })
      .select('title slug excerpt published_at')
      .populate('author_id', 'name')
      .sort({ published_at: -1 })
      .limit(50)
      .lean();

    const items = articles
      .map((a) => {
        const url = `${BASE}/articles/${encodeURIComponent(a.slug)}`;
        const date = new Date(a.published_at || Date.now()).toUTCString();
        return (
          `    <item>\n` +
          `      <title>${esc(a.title)}</title>\n` +
          `      <link>${esc(url)}</link>\n` +
          `      <guid isPermaLink="true">${esc(url)}</guid>\n` +
          `      <pubDate>${date}</pubDate>\n` +
          (a.author_id?.name ? `      <dc:creator>${esc(a.author_id.name)}</dc:creator>\n` : '') +
          `      <description><![CDATA[${a.excerpt || ''}]]></description>\n` +
          `    </item>`
        );
      })
      .join('\n');

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
      `  <channel>\n` +
      `    <title>DevCrunch</title>\n` +
      `    <link>${BASE}</link>\n` +
      `    <description>Sharp takes on AI, startups, and security — for people who build.</description>\n` +
      `    <language>en</language>\n` +
      `    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />\n` +
      `${items}\n` +
      `  </channel>\n</rss>\n`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    return res.send(body);
  } catch (err) {
    return next(err);
  }
}

/** Dynamic sitemap of static routes + every published article. */
export async function sitemapHandler(_req, res, next) {
  try {
    const articles = await Article.find({ status: 'published', deleted_at: null })
      .select('slug updated_at published_at')
      .sort({ published_at: -1 })
      .limit(5000)
      .lean();

    const staticPaths = ['/', '/articles', '/pricing', '/about', '/guidelines', '/help'];
    const urls = [
      ...staticPaths.map((p) => ({ loc: `${BASE}${p}`, priority: p === '/' ? '1.0' : '0.6' })),
      ...articles.map((a) => ({
        loc: `${BASE}/articles/${encodeURIComponent(a.slug)}`,
        lastmod: new Date(a.updated_at || a.published_at || Date.now()).toISOString(),
        priority: '0.8',
      })),
    ];

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url><loc>${esc(u.loc)}</loc>` +
            (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '') +
            `<priority>${u.priority}</priority></url>`,
        )
        .join('\n') +
      `\n</urlset>\n`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    return res.send(body);
  } catch (err) {
    return next(err);
  }
}

/**
 * Google News sitemap. Per Google's spec it must contain ONLY articles created
 * in the last 2 days and at most 1,000 entries; older URLs must be dropped.
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export async function newsSitemapHandler(_req, res, next) {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const articles = await Article.find({
      status: 'published',
      deleted_at: null,
      published_at: { $gte: since },
    })
      .select('title slug published_at')
      .sort({ published_at: -1 })
      .limit(1000)
      .lean();

    const items = articles
      .map((a) => {
        const url = `${BASE}/articles/${encodeURIComponent(a.slug)}`;
        const pubDate = new Date(a.published_at || Date.now()).toISOString();
        return (
          `  <url>\n` +
          `    <loc>${esc(url)}</loc>\n` +
          `    <news:news>\n` +
          `      <news:publication>\n` +
          `        <news:name>DevCrunch</news:name>\n` +
          `        <news:language>en</news:language>\n` +
          `      </news:publication>\n` +
          `      <news:publication_date>${pubDate}</news:publication_date>\n` +
          `      <news:title>${esc(a.title)}</news:title>\n` +
          `    </news:news>\n` +
          `  </url>`
        );
      })
      .join('\n');

    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
      `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
      `${items}\n` +
      `</urlset>\n`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    return res.send(body);
  } catch (err) {
    return next(err);
  }
}
