/**
 * server.js
 * Application entry point for Kelvin Ikpeni University.
 * Serves the API and the static frontend from the same Express app.
 *
 * Requires Express 4.x (express@^4.21.0).
 */
require('dotenv').config();

/* -------------------------
   Global error catchers
   ------------------------- */
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { applySecurity } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const sanitizeBody = require('./middleware/sanitizeBody');

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------------
   Trust proxy (Render sits behind a proxy)
   ------------------------- */
app.set('trust proxy', 1);

/* -------------------------
   Body parsers
   ------------------------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* -------------------------
   Strip forbidden fields (prevents mass-assignment privilege escalation)
   ------------------------- */
app.use(sanitizeBody);

/* -------------------------
   req.query writable shim (Mongoose/Mongo-sanitize compatibility)
   ------------------------- */
app.use((req, res, next) => {
  try {
    const q = req.query || {};
    Object.defineProperty(req, 'query', {
      value: { ...q },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch (_) {
    /* ignore */
  }
  next();
});

/* -------------------------
   Cookie parser
   ------------------------- */
app.use(cookieParser(process.env.COOKIE_SECRET));

/* -------------------------
   Security middleware
   ------------------------- */
applySecurity(app);

/* -------------------------
   CORS (configurable via .env)
   ------------------------- */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

/* -------------------------
   Logging
   ------------------------- */
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* -------------------------
   Health check
   ------------------------- */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Kelvin Ikpeni University API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------
   API routes
   ------------------------- */
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const studentRoutes = require('./routes/studentRoutes');
const lecturerRoutes = require('./routes/lecturerRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/applications', applicantRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/admin', adminRoutes);

/* -------------------------
   Static frontend
   ------------------------- */
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true,
  })
);

/* -------------------------
   SPA-style fallback for HTML navigations
   Serves 404.html with 404 status if the requested file is missing.
   ------------------------- */
const notFoundPagePath = path.join(__dirname, 'public', 'pages', '404.html');
const homePagePath = path.join(__dirname, 'public', 'index.html');

app.get(/^\/(?!api).*/, (req, res, next) => {
  if (!req.accepts('html')) return next();

  // Try to resolve the request to an existing file
  const requestedPath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return res.sendFile(requestedPath);
  }

  // Non-existent path → serve 404.html with the correct status
  if (fs.existsSync(notFoundPagePath)) {
    return res.status(404).sendFile(notFoundPagePath);
  }

  // Last-ditch fallback
  return res.sendFile(homePagePath, (err) => {
    if (err) next();
  });
});

/* -------------------------
   404 for API routes + global error handler
   ------------------------- */
app.use('/api', notFound);
app.use(errorHandler);

/* -------------------------
   Start server
   ------------------------- */
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Kelvin Ikpeni University server listening on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();

module.exports = app;