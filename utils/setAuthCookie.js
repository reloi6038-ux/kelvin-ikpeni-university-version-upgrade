/**
 * utils/setAuthCookie.js
 * Consistent cookie options for auth. Uses secure cookies in production.
 */
const COOKIE_NAME = 'kiu_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches default JWT_EXPIRES_IN

const baseOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,                   // HTTPS only in prod
    sameSite: isProd ? 'none' : 'lax', // 'none' allows cross-site; safe because secure=true in prod
    path: '/',
  };
};

exports.setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, { ...baseOptions(), maxAge: MAX_AGE_MS });
};

exports.clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, baseOptions());
};

exports.COOKIE_NAME = COOKIE_NAME;