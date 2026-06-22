import { Helmet } from 'react-helmet-async';

const SITE = 'DevCrunch';
const BASE = 'https://devcrunch.tech';
const DEFAULT_TITLE = 'DevCrunch · Sharp takes on AI, startups & security';
const DEFAULT_DESC =
  'Sharp, fast tech journalism on AI, startups, and cybersecurity, written by people who build.';
const DEFAULT_IMAGE = `${BASE}/og-image.png`;

/**
 * Per-page SEO/meta. Drives <title>, description, canonical, and OpenGraph /
 * Twitter cards as the user navigates the SPA. Article pages also get
 * server-injected meta (in server/src/app.js) so non-JS crawlers/scrapers see
 * the right tags on first byte; this keeps the two in sync for JS clients.
 */
export function Seo({
  title,
  metaTitle,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  author,
  noindex = false,
}) {
  // metaTitle is the SEO-tuned <title> (kept short so it doesn't truncate in
  // search results); social cards keep the full editorial title + brand.
  const socialTitle = title ? `${title} · ${SITE}` : DEFAULT_TITLE;
  const fullTitle = metaTitle?.trim() || socialTitle;
  const desc = (description || DEFAULT_DESC).slice(0, 300);
  const url = path ? `${BASE}${path}` : BASE;
  const img = image || DEFAULT_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && author && <meta property="article:author" content={author} />}
    </Helmet>
  );
}
