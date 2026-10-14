/**
 * routes/lecturerRoutes.js
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/lecturerController');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(protect, authorize(ROLES.LECTURER, ROLES.ADMIN));

router.get('/dashboard', ctrl.getDashboard);
router.get('/courses', ctrl.myCourses);
router.get('/courses/:courseId/students', ctrl.courseStudents);
router.post(
  '/results',
  [
    body('courseId').isMongoId(),
    body('session').notEmpty(),
    body('semester').isIn(['First', 'Second']),
    body('results').isArray({ min: 1 }),
  ],
  validate,
  ctrl.uploadResults
);
router.put('/results/:resultId/publish', ctrl.publishResult);

module.exports = router;