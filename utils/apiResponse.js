/**
 * utils/apiResponse.js
 * Standardises JSON responses so the frontend always knows what to expect.
 */
exports.success = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

exports.error = (res, message = 'Error', status = 400, details = null) =>
  res.status(status).json({ success: false, message, details });