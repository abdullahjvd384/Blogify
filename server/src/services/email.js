import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Sends an email via Resend. If RESEND_API_KEY is not configured, logs the
 * email to stdout instead of failing — useful in local dev where signups
 * shouldn't break just because no API key is set.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} input
 */
function logDevLink({ to, subject, html, reason }) {
  // Pull the primary action link out of the HTML so devs can copy/paste it
  // straight from the log without parsing the whole template.
  const linkMatch = html.match(/href="(https?:\/\/[^"]+(?:verify-email|reset-password)[^"]*)"/i);
  logger.warn(
    { to, subject, link: linkMatch?.[1] || '(none found)', reason },
    'email-dev: copy the link below into your browser',
  );
}

export async function sendEmail({ to, subject, html, text }) {
  if (!env.RESEND_API_KEY) {
    logDevLink({ to, subject, html, reason: 'RESEND_API_KEY not set' });
    return { id: 'dev-' + Date.now() };
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text: text || htmlToText(html) }),
  });

  if (res.ok) return res.json();

  const body = await res.text().catch(() => '');
  logger.warn({ status: res.status, body, to, subject }, 'resend send failed');

  // Resend's free / unverified-domain accounts reject any recipient other than
  // the account owner's own email. That's an environment limit, not a bug —
  // fall back to dev-mode logging so the dev (or the human running the demo)
  // can still complete the flow by copy/pasting the link from server.log.
  const isTestModeRestriction =
    res.status === 403 &&
    (body.includes('testing emails') || body.includes('verify a domain'));

  if (isTestModeRestriction) {
    logDevLink({ to, subject, html, reason: 'Resend test-mode rejected this recipient' });
    return { id: 'devfallback-' + Date.now() };
  }

  throw new Error(`Resend send failed: ${res.status}`);
}

/** Quick HTML-to-text fallback. Not perfect but good enough for plaintext part. */
function htmlToText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BRAND = {
  bg: '#11100d',
  card: '#ffffff',
  text: '#1c1a16',
  muted: '#5c5749',
  accent: '#1f8050',
};

function shell(title, bodyHtml) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(title)}</title></head>
<body style="margin:0;padding:32px 16px;background:${BRAND.bg};font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${BRAND.text}">
  <div style="max-width:520px;margin:0 auto;background:${BRAND.card};border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.15)">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700">${escape(title)}</h1>
    ${bodyHtml}
  </div>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#94a3b8;text-align:center">
    You're getting this from DevCrunch. If you didn't request this, you can safely ignore it.
  </p>
</body></html>`;
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;margin:12px 0">${escape(label)}</a>`;
}

// --- Templates ---

export function verifyEmailTemplate({ name, link }) {
  return {
    subject: 'Verify your DevCrunch email',
    html: shell(
      'Verify your email',
      `<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">
        Hi ${escape(name || 'there')},
      </p>
      <p style="color:${BRAND.muted};font-size:14px;line-height:1.6">
        Welcome to DevCrunch. Click the button below to verify your email. The link is valid for 24 hours.
      </p>
      ${btn(link, 'Verify email')}
      <p style="color:${BRAND.muted};font-size:12px;line-height:1.6;margin-top:24px">
        Or open this link manually:<br><span style="word-break:break-all">${escape(link)}</span>
      </p>`,
    ),
  };
}

export function passwordResetTemplate({ name, link }) {
  return {
    subject: 'Reset your DevCrunch password',
    html: shell(
      'Reset your password',
      `<p style="color:${BRAND.muted};font-size:14px;line-height:1.6">
        Hi ${escape(name || 'there')},
      </p>
      <p style="color:${BRAND.muted};font-size:14px;line-height:1.6">
        Use the button below to set a new password. The link is valid for 1 hour and can only be used once.
      </p>
      ${btn(link, 'Reset password')}
      <p style="color:${BRAND.muted};font-size:12px;line-height:1.6;margin-top:24px">
        Didn't ask for this? You can ignore this email — your password won't change unless you click the link.
      </p>
      <p style="color:${BRAND.muted};font-size:12px;line-height:1.6">
        Or open this link manually:<br><span style="word-break:break-all">${escape(link)}</span>
      </p>`,
    ),
  };
}
