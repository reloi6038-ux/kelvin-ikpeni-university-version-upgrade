/**
 * routes/authRoutes.js
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimits');

/* Registration */
router.post(
  '/register',
  authLimiter,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('phone').optional().trim().isLength({ max: 30 }),
  ],
  validate,
  ctrl.register
);

/* Login */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  ctrl.login
);

/* Logout */
router.post('/logout', ctrl.logout);

/* Current user */
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);

/* Password */
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Needs an uppercase letter')
      .matches(/[a-z]/).withMessage('Needs a lowercase letter')
      .matches(/[0-9]/).withMessage('Needs a number'),
  ],
  validate,
  ctrl.changePassword
);

router.post('/forgot-password', authLimiter, [body('email').isEmail().normalizeEmail()], validate, ctrl.forgotPassword);
router.post(
  '/reset-password/:token',
  authLimiter,
  [body('password').isLength({ min: 8 })],
  validate,
  ctrl.resetPassword
);

module.exports = router;