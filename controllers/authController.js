/**
 * controllers/authController.js
 * Register, login, logout, current user, change password.
 */
const crypto = require('crypto');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { setAuthCookie, clearAuthCookie } = require('../utils/setAuthCookie');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

/* --------------------------
   POST /api/auth/register
   Public. Creates an applicant account by default.
   Admin/lecturer accounts are NOT created here for security.
   -------------------------- */
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth, gender, nationality } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    phone,
    dateOfBirth,
    gender,
    nationality,
    role: ROLES.APPLICANT,
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  logger.info(`New applicant registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      token, // also returned so API clients / mobile can use it
      user: user.toJSON(),
    },
  });
});

/* --------------------------
   POST /api/auth/login
   Public. Accepts email + password. Works for ALL roles.
   -------------------------- */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user including password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.isLocked()) {
    return res.status(423).json({
      success: false,
      message: 'Account temporarily locked due to too many failed login attempts. Try again later.',
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await user.registerFailedLogin();
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact the administrator.' });
  }

  // Reset login attempts and record last login
  await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0, lastLogin: new Date() }, $unset: { lockUntil: 1 } }
  );

  const token = generateToken(user);
  setAuthCookie(res, token);

  logger.info(`Login success: ${user.email} (${user.role})`);

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: user.toJSON(),
    },
  });
});

/* --------------------------
   POST /api/auth/logout
   Authenticated. Clears auth cookie.
   -------------------------- */
exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* --------------------------
   GET /api/auth/me
   Authenticated. Returns the current user.
   -------------------------- */
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON ? req.user.toJSON() : req.user } });
});

/* --------------------------
   PUT /api/auth/me
   Authenticated. Update basic profile fields.
   -------------------------- */
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'nationality', 'address', 'avatar'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', data: { user } });
});

/* --------------------------
   PUT /api/auth/change-password
   Authenticated. Requires current + new password.
   -------------------------- */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  // Issue a fresh token so the user stays logged in
  const token = generateToken(user);
  setAuthCookie(res, token);

  res.json({ success: true, message: 'Password changed successfully.', data: { token } });
});

/* --------------------------
   POST /api/auth/forgot-password
   Public. Generates a reset token.
   NOTE: Sending email is a future integration — right now the token is
   returned in dev mode only, so you can test the flow.
   -------------------------- */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Do not reveal whether the email exists
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  const responseData = {};
  if (process.env.NODE_ENV !== 'production') {
    responseData.resetToken = resetToken; // dev only, so you can test without email
  }

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
    data: responseData,
  });
});

/* --------------------------
   POST /api/auth/reset-password/:token
   Public. Consumes reset token, sets new password.
   -------------------------- */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const freshToken = generateToken(user);
  setAuthCookie(res, freshToken);

  res.json({ success: true, message: 'Password reset successful.', data: { token: freshToken } });
});