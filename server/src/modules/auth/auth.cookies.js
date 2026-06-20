import { COOKIE_NAMES, TOKEN_TTL } from '@blogplatform/shared';
import { env } from '../../config/env.js';

const baseCookie = {
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  secure: env.COOKIE_SECURE,
  domain: env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
  path: '/',
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(COOKIE_NAMES.ACCESS, accessToken, {
    ...baseCookie,
    maxAge: TOKEN_TTL.ACCESS_SECONDS * 1000,
  });
  res.cookie(COOKIE_NAMES.REFRESH, refreshToken, {
    ...baseCookie,
    maxAge: TOKEN_TTL.REFRESH_SECONDS * 1000,
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAMES.ACCESS, { ...baseCookie });
  res.clearCookie(COOKIE_NAMES.REFRESH, { ...baseCookie, path: '/api/v1/auth' });
}
