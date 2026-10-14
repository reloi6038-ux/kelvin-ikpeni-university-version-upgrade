/**
 * utils/asyncHandler.js
 * Wraps async route handlers so errors propagate to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;