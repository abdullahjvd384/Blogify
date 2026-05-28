import sanitizeHtmlLib from 'sanitize-html';

/**
 * Hosts allowed to be embedded via <iframe>. Anything else is dropped. Keep this
 * tight — an iframe is an XSS / clickjacking vector if the host isn't trusted.
 */
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'platform.twitter.com',
];

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'span',
    'h1', 'h2', 'h3', 'h4',
    'strong', 'em', 'b', 'i', 'u', 's', 'mark',
    'blockquote', 'ul', 'ol', 'li',
    'a', 'code', 'pre', 'hr',
    'img', 'figure', 'figcaption', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    span: ['data-type'],
    '*': ['data-*'],
  },
  // Links + images may only point at safe schemes. No javascript:, no data: images.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
    iframe: ['https'],
  },
  allowProtocolRelative: false,
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
  // Strip everything not explicitly allowed (drops <script>, <style>, on* handlers).
  disallowedTagsMode: 'discard',
  transformTags: {
    // Force external links to be safe (no tabnabbing, no SEO juice on UGC).
    a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
};

/**
 * Server-side sanitization of rich-text article HTML before persistence.
 * Never trust editor output — this is the security boundary for stored content.
 */
export function sanitizeArticleHtml(dirty = '') {
  if (!dirty) return '';
  return sanitizeHtmlLib(String(dirty), OPTIONS);
}
