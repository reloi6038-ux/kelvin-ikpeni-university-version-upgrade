/**
 * routes/publicRoutes.js
 * All public read-only and form-submission endpoints.
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const ctrl = require('../controllers/publicController');
const validate = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimits');

/* Faculties */
router.get('/faculties', ctrl.listFaculties);
router.get('/faculties/:slug', ctrl.getFaculty);

/* Departments */
router.get('/departments', ctrl.listDepartments);
router.get('/departments/:slug', ctrl.getDepartment);

/* Programmes */
router.get('/programmes', ctrl.listProgrammes);
router.get('/programmes/:slug', ctrl.getProgramme);

/* News */
router.get('/news', ctrl.listNews);
router.get('/news/:slug', ctrl.getNewsItem);

/* Events */
router.get('/events', ctrl.listEvents);
router.get('/events/:slug', ctrl.getEvent);

/* Announcements */
router.get('/announcements', ctrl.listAnnouncements);

/* Search */
router.get('/search', ctrl.search);

/* Contact */
router.post(
  '/contact',
  contactLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
    body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be 10–5000 chars'),
    body('phone').optional().trim().isLength({ max: 30 }),
  ],
  validate,
  ctrl.submitContact
);

/* Newsletter */
router.post(
  '/subscribe',
  contactLimiter,
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  ctrl.subscribe
);
router.post('/unsubscribe', [body('email').isEmail().normalizeEmail()], validate, ctrl.unsubscribe);

module.exports = router;