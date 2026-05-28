/**
 * Extracts readable plain text from an HTML (or plain-text) string.
 *
 * Used as the single source of truth for excerpt generation, word counting,
 * search, and feeding the AI moderation pipeline. Works on legacy plain-text
 * content too (no tags → returned mostly unchanged).
 *
 * This is intentionally dependency-free and lenient: block-level tags become
 * spaces/newlines so words don't run together, then entities are decoded.
 */
const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

function decodeEntities(str) {
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code) => {
    if (code[0] === '#') {
      const num = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : match;
    }
    const named = NAMED_ENTITIES[code] ?? NAMED_ENTITIES[code.toLowerCase()];
    return named !== undefined ? named : match;
  });
}

export function htmlToText(input = '') {
  if (!input) return '';
  return decodeEntities(
    String(input)
      // Drop script/style bodies entirely.
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      // Block-ish boundaries → newline so words/sentences stay separated.
      .replace(/<\/(p|div|h[1-6]|li|blockquote|pre|br|tr|figure|figcaption)\s*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Remaining tags → space.
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
