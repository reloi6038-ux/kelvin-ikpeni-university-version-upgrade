/**
 * middleware/security.js
 * Helmet, HPP, mongo-sanitize, compression, and rate limiting.
 *
 * Behaviour:
 *   - In production: full security headers, HSTS, strict CSP, general limiter active.
 *   - In development: HSTS off, upgrade-insecure-requests off, and the general
 *     rate limiter SKIPS localhost so you can test without hitting limits.
 */
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const isProd = () => process.env.NODE_ENV === 'production';

/* Is this request from the local dev machine?
   Handles IPv4, IPv6, and Express's "::ffff:" prefixed forms. */
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

/* Skip the limiter entirely when developing from localhost. */
const skipInDev = (req) => !isProd() && isLocalRequest(req);

/* =========================================================
   GENERAL RATE LIMITER
   ========================================================= */
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

/* =========================================================
   CONTENT SECURITY POLICY
   Allows exactly what the Kelvin Ikpeni University frontend needs:
     - Self-hosted assets
     - Google Fonts (Fraunces, Playfair Display, Inter)
     - Font Awesome from cdnjs
     - Unsplash / any HTTPS imagery
     - data: and blob: URIs
   Inline styles allowed; inline scripts blocked.
   ========================================================= */
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],

    // All JavaScript lives in /public/js — no inline scripts
    scriptSrc: ["'self'"],

    // Component-level inline styles + Google Fonts + Font Awesome
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdnjs.cloudflare.com',
    ],

    // Web fonts
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdnjs.cloudflare.com',
      'data:',
    ],

    // Images: self, data URIs, blob URIs, any HTTPS source
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],

    // API/fetch: self only
    connectSrc: ["'self'"],

    // No iframes, no objects
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],

    // Restrict <base> and form actions
    baseUri: ["'self'"],
    formAction: ["'self'"],

    // Prevent clickjacking
    frameAncestors: ["'none'"],

    // Force HTTPS only in production
    upgradeInsecureRequests: isProd() ? [] : null,
  },
};

/* =========================================================
   APPLY ALL SECURITY MIDDLEWARE
   ========================================================= */
const applySecurity = (app) => {
  /* -------------------------
     Helmet — HTTP security headers
     ------------------------- */
  app.use(
    helmet({
      contentSecurityPolicy,

      // Allow remote fonts/images without CORP blocking
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },

      // Privacy-conscious referrer policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // HSTS only in production
      hsts: isProd()
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    })
  );

  /* -------------------------
     HPP — HTTP Parameter Pollution protection
     ------------------------- */
  app.use(hpp());

  /* -------------------------
     NoSQL Injection protection
     Strips $ and . from req.body, req.query, req.params.
     Our server.js wraps req.query in a writable own-property before this runs.
     ------------------------- */
  app.use(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        if (!isProd()) {
          // eslint-disable-next-line no-console
          console.warn(`[sanitize] Removed suspicious key "${key}" from ${req.method} ${req.originalUrl}`);
        }
      },
    })
  );

  /* -------------------------
     Compression
     ------------------------- */
  app.use(compression());

  /* -------------------------
     General rate limit (skipped on localhost in dev)
     ------------------------- */
  app.use(generalLimiter);
};

module.exports = { applySecurity, generalLimiter };