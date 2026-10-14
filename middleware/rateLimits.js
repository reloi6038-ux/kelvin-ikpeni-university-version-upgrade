/**
 * middleware/rateLimits.js
 * Stricter rate limiters for sensitive endpoints (auth, applications, contact).
 *
 * In development these SKIP localhost so you can test freely.
 * In production they always apply.
 */
const rateLimit = require('express-rate-limit');

const isProd = () => process.env.NODE_ENV === 'production';

const isLocalRequest = (req) => {
  const ip = req.ip || '';
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === '::ffff:127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::ffff:localhost'
  );
};

const skipInDev = (req) => !isProd() && isLocalRequest(req);

/* Auth endpoints — login, register, password reset */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

/* Application submission — max 5 per hour per IP in production */
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Too many applications submitted from this IP. Please try later.',
  },
});

/* Contact form + newsletter — max 5 per hour per IP in production */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: {
    success: false,
    message: 'Too many contact messages from this IP. Please try later.',
  },
});

module.exports = { authLimiter, applicationLimiter, contactLimiter };