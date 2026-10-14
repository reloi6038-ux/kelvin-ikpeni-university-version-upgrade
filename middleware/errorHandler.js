/**
 * middleware/errorHandler.js
 * Centralised error handling. Sanitizes output in production.
 */
const logger = require('../utils/logger');

/* 404 handler */
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

/* Main error handler */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';
  let details = null;

  // Mongoose bad ObjectId → 404
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found.';
  }

  // Mongoose validation error → 422 with field details
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed.';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Duplicate key → 409
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}.`;
  }

  // JWT errors (safety net if any slip past auth middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  // Log full error for our own visibility
  logger.error(`${statusCode} ${req.method} ${req.originalUrl} — ${message}`);
  if (statusCode >= 500) logger.error(err.stack);

  // Response
  const payload = {
    success: false,
    message:
      process.env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Something went wrong. Please try again later.'
        : message,
  };
  if (details) payload.details = details;
  if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };