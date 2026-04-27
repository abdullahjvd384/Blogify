import { COOKIE_NAMES } from '@blogplatform/shared';
import * as authService from './auth.service.js';
import { setAuthCookies, clearAuthCookies } from './auth.cookies.js';
import { toCamel } from '../../utils/case.js';
import { ok, created, noContent } from '../../utils/response.js';

function publicUser(userDoc) {
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  obj.id = obj._id?.toString();
  delete obj._id;
  delete obj.password_hash;
  return toCamel(obj);
}

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
