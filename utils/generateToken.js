/**
 * utils/generateToken.js
 * Creates signed JWTs.
 */
const jwt = require('jsonwebtoken');

/**
 * @param {Object} user  Mongoose user document (or plain object with _id and role)
 * @param {string} type  'access' | 'refresh' (future use)
 */
const generateToken = (user, type = 'access') => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    type,
  };

  const expiresIn =
    type === 'refresh'
      ? process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      : process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;