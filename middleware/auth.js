/**
 * middleware/auth.js
 * protect() — require authentication.
 * authorize(...roles) — require specific role(s).
 * optionalAuth() — attach user if logged in, don't fail otherwise.
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { COOKIE_NAME } = require('../utils/setAuthCookie');

const extractToken = (req) => {
  // 1. httpOnly cookie (preferred — set by our server)
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  // 2. Bearer token in Authorization header (useful for API tests / mobile)
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/* Attach user if logged in, otherwise continue */
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  const decoded = verifyToken(token);
  if (!decoded) return next();
  try {
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status !== 'suspended') req.user = user;
  } catch (_) {
    /* swallow — optionalAuth shouldn't block */
  }
  next();
};

/* Require a valid login */
const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/* Require specific role(s) */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This resource requires role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };