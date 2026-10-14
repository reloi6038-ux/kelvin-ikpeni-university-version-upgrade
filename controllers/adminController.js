/**
 * controllers/adminController.js
 * Full CRUD + management for admins.
 */
const {
  User, Faculty, Department, Programme, Course, Application,
  Announcement, News, Event, ContactMessage, Subscriber,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');
const { getPagination, buildMeta } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');

/* ============================
   DASHBOARD STATS
   ============================ */
exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, students, lecturers, admins, applicants,
    faculties, departments, programmes, courses,
    applications, pendingApplications,
    newsCount, eventsCount, contacts, subscribers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.LECTURER }),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ role: ROLES.APPLICANT }),
    Faculty.countDocuments(),
    Department.countDocuments(),
    Programme.countDocuments(),
    Course.countDocuments(),
    Application.countDocuments(),
    Application.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    News.countDocuments(),
    Event.countDocuments(),
    ContactMessage.countDocuments(),
    Subscriber.countDocuments(),
  ]);

  const recentApplications = await Application.find()
    .sort({ createdAt: -1 }).limit(5)
    .populate('programme', 'name degree level')
    .select('referenceNumber firstName lastName email status createdAt programme');

  const recentUsers = await User.find()
    .sort({ createdAt: -1 }).limit(5)
    .select('firstName lastName email role createdAt');

  res.json({
    success: true,
    data: {
      stats: {
        users: { total: totalUsers, students, lecturers, admins, applicants },
        academics: { faculties, departments, programmes, courses },
        applications: { total: applications, pending: pendingApplications },
        content: { news: newsCount, events: eventsCount, contacts, subscribers },
      },
      recentApplications,
      recentUsers,
    },
  });
});

/* ============================
   FACTULTY CRUD
   ============================ */
exports.createFaculty = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.slug) data.slug = slugify(data.name);
  const faculty = await Faculty.create(data);
  res.status(201).json({ success: true, message: 'Faculty created.', data: { faculty } });
});

exports.updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const faculty = await Faculty.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
  res.json({ success: true, message: 'Faculty updated.', data: { faculty } });
});

exports.deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Faculty.findByIdAndDelete(id);
  res.json({ success: true, message: 'Faculty deleted.' });
});

/* ============================
   DEPARTMENT CRUD
   ============================ */
exports.createDepartment = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.slug) data.slug = slugify(data.name);
  const department = await Department.create(data);
  res.status(201).json({ success: true, message: 'Department created.', data: { department } });
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const department = await Department.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });
  res.json({ success: true, message: 'Department updated.', data: { department } });
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Department deleted.' });
});

/* ============================
   PROGRAMME CRUD
   ============================ */
exports.createProgramme = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.slug) data.slug = slugify(data.name);
  const programme = await Programme.create(data);
  res.status(201).json({ success: true, message: 'Programme created.', data: { programme } });
});

exports.updateProgramme = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const programme = await Programme.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!programme) return res.status(404).json({ success: false, message: 'Programme not found.' });
  res.json({ success: true, message: 'Programme updated.', data: { programme } });
});

exports.deleteProgramme = asyncHandler(async (req, res) => {
  await Programme.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Programme deleted.' });
});

/* ============================
   COURSE CRUD
   ============================ */
exports.createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json({ success: true, message: 'Course created.', data: { course } });
});
exports.updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  res.json({ success: true, message: 'Course updated.', data: { course } });
});
exports.deleteCourse = asyncHandler(async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Course deleted.' });
});

/* ============================
   USER MANAGEMENT
   ============================ */
exports.listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { matricNumber: rx }, { staffId: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, count: users.length, meta: buildMeta(total, page, limit), data: { users } });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('programme', 'name degree')
    .populate('department', 'name code')
    .populate('faculty', 'name shortName');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: { user } });
});

exports.updateUser = asyncHandler(async (req, res) => {
  // Prevent password change through this endpoint (use auth/change-password)
  const updates = { ...req.body };
  delete updates.password;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: 'User updated.', data: { user } });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted.' });
});

/* ============================
   APPLICATION MANAGEMENT
   ============================ */
exports.listApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.programme) filter.programme = req.query.programme;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ referenceNumber: rx }, { firstName: rx }, { lastName: rx }, { email: rx }];
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('programme', 'name degree level')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);
  res.json({ success: true, count: applications.length, meta: buildMeta(total, page, limit), data: { applications } });
});

exports.getApplication = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id)
    .populate('programme', 'name degree level')
    .populate('faculty', 'name shortName')
    .populate('department', 'name code')
    .populate('reviewedBy', 'firstName lastName');
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
  res.json({ success: true, data: { application: app } });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, reviewerNotes, decisionReason } = req.body;
  const updates = {
    status,
    reviewerNotes,
    decisionReason,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };
  const app = await Application.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
  res.json({ success: true, message: `Application marked as ${status}.`, data: { application: app } });
});

/* ============================
   ANNOUNCEMENTS
   ============================ */
exports.createAnnouncement = asyncHandler(async (req, res) => {
  const data = { ...req.body, author: req.user._id };
  if (!data.slug) data.slug = slugify(data.title) + '-' + Date.now().toString(36);
  const announcement = await Announcement.create(data);
  res.status(201).json({ success: true, message: 'Announcement created.', data: { announcement } });
});
exports.updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!announcement) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, message: 'Announcement updated.', data: { announcement } });
});
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Announcement deleted.' });
});
exports.listAnnouncementsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Announcement.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(),
  ]);
  res.json({ success: true, meta: buildMeta(total, page, limit), data: { announcements: items } });
});

/* ============================
   NEWS
   ============================ */
exports.createNews = asyncHandler(async (req, res) => {
  const data = { ...req.body, author: req.user._id };
  if (!data.slug) data.slug = slugify(data.title) + '-' + Date.now().toString(36);
  const news = await News.create(data);
  res.status(201).json({ success: true, message: 'News created.', data: { news } });
});
exports.updateNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!news) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, message: 'News updated.', data: { news } });
});
exports.deleteNews = asyncHandler(async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'News deleted.' });
});

/* ============================
   EVENTS
   ============================ */
exports.createEvent = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.slug) data.slug = slugify(data.title) + '-' + Date.now().toString(36);
  const event = await Event.create(data);
  res.status(201).json({ success: true, message: 'Event created.', data: { event } });
});
exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!event) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, message: 'Event updated.', data: { event } });
});
exports.deleteEvent = asyncHandler(async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Event deleted.' });
});

/* ============================
   CONTACT MESSAGES & SUBSCRIBERS
   ============================ */
exports.listContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [contacts, total] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(),
  ]);
  res.json({ success: true, meta: buildMeta(total, page, limit), data: { contacts } });
});
exports.markContactRead = asyncHandler(async (req, res) => {
  const contact = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!contact) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, data: { contact } });
});

exports.listSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [subs, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Subscriber.countDocuments(),
  ]);
  res.json({ success: true, meta: buildMeta(total, page, limit), data: { subscribers: subs } });
});