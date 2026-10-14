/**
 * routes/applicantRoutes.js
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/applicantController');
const validate = require('../middleware/validate');
const { protect, optionalAuth } = require('../middleware/auth');
const { applicationLimiter } = require('../middleware/rateLimits');

router.post(
  '/',
  applicationLimiter,
  optionalAuth,
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Phone required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender required'),
    body('nationality').trim().notEmpty().withMessage('Nationality required'),
    body('programme').isMongoId().withMessage('Valid programme required'),
    body('level').isIn(['undergraduate', 'postgraduate', 'online']).withMessage('Level required'),
  ],
  validate,
  ctrl.submitApplication
);

router.get('/status/:reference', ctrl.checkStatus);
router.get('/my', protect, ctrl.myApplications);

module.exports = router;