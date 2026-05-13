import { COOKIE_NAMES } from '@blogplatform/shared';
import * as authService from './auth.service.js';
import { setAuthCookies, clearAuthCookies } from './auth.cookies.js';
import { present } from '../../utils/presenter.js';
import { ok, created, noContent } from '../../utils/response.js';

const publicUser = (doc) => present(doc, { omit: ['password_hash'] });

function requestCtx(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

export async function signup(req, res) {
  const { user, tokens } = await authService.signup(req.valid.body, requestCtx(req));
  setAuthCookies(res, tokens);
  return created(res, { user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const { user, tokens } = await authService.login(email, password, requestCtx(req));
  setAuthCookies(res, tokens);
  return ok(res, { user: publicUser(user) });
}

export async function logout(req, res) {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH];
  await authService.logout(refreshToken);
  clearAuthCookies(res);
  return noContent(res);
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH];
  const { user, tokens } = await authService.refresh(refreshToken, requestCtx(req));
  setAuthCookies(res, tokens);
  return ok(res, { user: publicUser(user) });
}

export async function me(req, res) {
  const user = await authService.getProfile(req.user.id);
  return ok(res, { user: publicUser(user) });
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.valid.body.email);
  // Always 204 regardless of whether the user existed — no enumeration.
  return noContent(res);
}

export async function resetPassword(req, res) {
  const { token, password } = req.valid.body;
  await authService.resetPassword(token, password);
  return noContent(res);
}

export async function verifyEmail(req, res) {
  const user = await authService.verifyEmail(req.valid.body.token);
  return ok(res, { user: publicUser(user) });
}

export async function resendVerification(req, res) {
  const user = await authService.getProfile(req.user.id);
  if (user.email_verified_at) {
    return ok(res, { sent: false, alreadyVerified: true });
  }
  await authService.sendVerificationEmail(user);
  return ok(res, { sent: true });
}
