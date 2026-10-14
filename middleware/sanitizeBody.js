/**
 * middleware/sanitizeBody.js
 * Removes fields that should NEVER come from client input,
 * regardless of endpoint, to prevent privilege escalation.
 */
const FORBIDDEN_FIELDS = ['role', 'isAdmin', 'permissions', 'passwordHash', '_id'];

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    FORBIDDEN_FIELDS.forEach((key) => {
      if (key in req.body) delete req.body[key];
    });
  }
  if (req.params && typeof req.params === 'object') {
    FORBIDDEN_FIELDS.forEach((key) => {
      if (key in req.params && key !== '_id') delete req.params[key];
    });
  }
  next();
};

module.exports = sanitizeBody;