/**
 * routes/studentRoutes.js
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/studentController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(protect, authorize(ROLES.STUDENT));

router.get('/dashboard', ctrl.getDashboard);
router.get('/courses/available', ctrl.availableCourses);
router.post(
  '/courses/register',
  [body('courseIds').isArray({ min: 1 }).withMessage('courseIds must be a non-empty array')],
  validate,
  ctrl.registerCourses
);
router.delete('/courses/:courseId', ctrl.dropCourse);
router.get('/results', ctrl.myResults);

module.exports = router;