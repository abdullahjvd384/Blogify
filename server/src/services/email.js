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
  page: '#eef2ee',
  card: '#ffffff',
  ink: '#16140f',
  muted: '#5c5749',
  faint: '#8a8578',
  accent: '#1f8050',
  accentLight: '#bbf7d0',
};
const SITE = (env.CLIENT_ORIGIN || 'https://devcrunch.tech').replace(/\/$/, '');

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Branded, email-client-safe (table-based) wrapper. */
function shell({ title, bodyHtml, preheader = '' }) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escape(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.card};border-radius:16px;overflow:hidden;border:1px solid #e4e8e2;font-family:${FONT};">
        <tr><td style="background:${BRAND.accent};background-image:linear-gradient(135deg,#2f9e63,#1f8050 55%,#15b09e);padding:22px 32px;">
          <span style="font-size:21px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Dev<span style="color:${BRAND.accentLight};">Crunch</span></span>
        </td></tr>
        <tr><td style="padding:34px 32px 8px;">
          <h1 style="margin:0 0 16px;font-size:23px;line-height:1.3;font-weight:800;color:${BRAND.ink};">${escape(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:22px 32px;border-top:1px solid #eef0ec;background:#fafbf9;">
          <p style="margin:0 0 6px;font-size:12px;color:${BRAND.faint};">
            <a href="${SITE}/articles" style="color:${BRAND.accent};text-decoration:none;font-weight:600;">Read articles</a>&nbsp;·&nbsp;
            <a href="${SITE}/help" style="color:${BRAND.accent};text-decoration:none;font-weight:600;">Help</a>&nbsp;·&nbsp;
            <a href="${SITE}" style="color:${BRAND.accent};text-decoration:none;font-weight:600;">devcrunch.tech</a>
          </p>
          <p style="margin:0;font-size:11px;color:#a8a394;">© ${year} DevCrunch — Sharp takes on AI, startups &amp; security.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function p(text) {
  return `<p style="margin:0 0 14px;color:${BRAND.muted};font-size:15px;line-height:1.65;">${text}</p>`;
}

/** Bulletproof-ish CTA button (table cell + styled anchor). */
function btn(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;"><tr>
    <td style="border-radius:10px;background:${BRAND.accent};">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:${FONT};">${escape(label)}</a>
    </td></tr></table>`;
}

function manualLink(link) {
  return `<p style="margin:18px 0 0;color:${BRAND.faint};font-size:12px;line-height:1.6;">
    Or paste this link into your browser:<br><span style="word-break:break-all;color:${BRAND.muted};">${escape(link)}</span>
  </p>`;
}

// --- Templates ---

export function verifyEmailTemplate({ name, link }) {
  return {
    subject: 'Verify your DevCrunch email',
    html: shell({
      title: 'Confirm your email',
      preheader: 'One click to finish setting up your DevCrunch account.',
      bodyHtml:
        p(`Hi ${escape(name || 'there')},`) +
        p('Welcome to DevCrunch — sharp takes on AI, startups, and security. Confirm your email to finish setting up your account.') +
        btn(link, 'Verify email') +
        p(`<span style="font-size:13px;color:${BRAND.faint};">This link is valid for 24 hours.</span>`) +
        manualLink(link),
    }),
  };
}

export function passwordResetTemplate({ name, link }) {
  return {
    subject: 'Reset your DevCrunch password',
    html: shell({
      title: 'Reset your password',
      preheader: 'Set a new password for your DevCrunch account.',
      bodyHtml:
        p(`Hi ${escape(name || 'there')},`) +
        p('Click the button below to set a new password. This link is valid for 1 hour and can only be used once.') +
        btn(link, 'Reset password') +
        p(`<span style="font-size:13px;color:${BRAND.faint};">Didn't ask for this? You can safely ignore this email — your password won't change unless you use the link above.</span>`) +
        manualLink(link),
    }),
  };
}

export function newsletterWelcomeTemplate() {
  return {
    subject: 'Welcome to The DevCrunch brief 🎉',
    html: shell({
      title: "You're in. 🎉",
      preheader: 'Sharp takes on AI, startups & security — now landing in your inbox.',
      bodyHtml:
        p('Thanks for subscribing to <strong>The DevCrunch brief</strong>. You\'ll get our sharpest stories on:') +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
          <tr><td style="padding:4px 0;color:${BRAND.muted};font-size:15px;">🤖&nbsp;&nbsp;<strong>AI</strong> — models, tools, and what they mean for builders</td></tr>
          <tr><td style="padding:4px 0;color:${BRAND.muted};font-size:15px;">🚀&nbsp;&nbsp;<strong>Startups</strong> — funding, products, and the moves that matter</td></tr>
          <tr><td style="padding:4px 0;color:${BRAND.muted};font-size:15px;">🔐&nbsp;&nbsp;<strong>Security</strong> — breaches, defenses, and privacy</td></tr>
        </table>` +
        p('No spam, no fluff — just signal. Start with our latest stories:') +
        btn(`${SITE}/articles`, 'Start reading') +
        p(`<span style="font-size:13px;color:${BRAND.faint};">You're receiving this because you subscribed at devcrunch.tech. Not you? You can ignore this email.</span>`),
    }),
  };
}
