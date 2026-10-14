/**
 * routes/adminRoutes.js
 */
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(protect, authorize(ROLES.ADMIN));

/* Stats */
router.get('/stats', ctrl.getStats);

/* Faculties */
router.post('/faculties', ctrl.createFaculty);
router.put('/faculties/:id', ctrl.updateFaculty);
router.delete('/faculties/:id', ctrl.deleteFaculty);

/* Departments */
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

/* Programmes */
router.post('/programmes', ctrl.createProgramme);
router.put('/programmes/:id', ctrl.updateProgramme);
router.delete('/programmes/:id', ctrl.deleteProgramme);

/* Courses */
router.post('/courses', ctrl.createCourse);
router.put('/courses/:id', ctrl.updateCourse);
router.delete('/courses/:id', ctrl.deleteCourse);

/* Users */
router.get('/users', ctrl.listUsers);
router.get('/users/:id', ctrl.getUser);
router.put('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

/* Applications */
router.get('/applications', ctrl.listApplications);
router.get('/applications/:id', ctrl.getApplication);
router.put('/applications/:id/status', ctrl.updateApplicationStatus);

/* Announcements */
router.get('/announcements', ctrl.listAnnouncementsAdmin);
router.post('/announcements', ctrl.createAnnouncement);
router.put('/announcements/:id', ctrl.updateAnnouncement);
router.delete('/announcements/:id', ctrl.deleteAnnouncement);

/* News */
router.post('/news', ctrl.createNews);
router.put('/news/:id', ctrl.updateNews);
router.delete('/news/:id', ctrl.deleteNews);

/* Events */
router.post('/events', ctrl.createEvent);
router.put('/events/:id', ctrl.updateEvent);
router.delete('/events/:id', ctrl.deleteEvent);

/* Contacts */
router.get('/contacts', ctrl.listContacts);
router.put('/contacts/:id/read', ctrl.markContactRead);

/* Subscribers */
router.get('/subscribers', ctrl.listSubscribers);

module.exports = router;