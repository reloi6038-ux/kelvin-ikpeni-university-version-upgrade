/**
 * middleware/validate.js
 * Collects express-validator errors and returns 422 with details.
 */
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(422).json({
    success: false,
    message: 'Validation failed.',
    details,
  });
};

module.exports = validate;