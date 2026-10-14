/**
 * controllers/publicController.js
 * Everything a visitor can read without logging in.
 */
const { Faculty, Department, Programme, News, Event, Announcement, ContactMessage, Subscriber } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/* ------------------------------------------------------------------
   Faculties
   ------------------------------------------------------------------ */
exports.listFaculties = asyncHandler(async (req, res) => {
  const faculties = await Faculty.find({ isActive: true })
    .populate('dean', 'firstName lastName title')
    .sort({ name: 1 });
  res.json({ success: true, count: faculties.length, data: { faculties } });
});

exports.getFaculty = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const faculty = await Faculty.findOne({ slug, isActive: true })
    .populate('dean', 'firstName lastName title email');
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });

  const departments = await Department.find({ faculty: faculty._id, isActive: true }).sort({ name: 1 });
  const programmes = await Programme.find({ faculty: faculty._id, isActive: true }).sort({ name: 1 });

  res.json({ success: true, data: { faculty, departments, programmes } });
});

/* ------------------------------------------------------------------
   Departments
   ------------------------------------------------------------------ */
exports.listDepartments = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.faculty) filter.faculty = req.query.faculty;
  const departments = await Department.find(filter)
    .populate('faculty', 'name slug shortName')
    .populate('head', 'firstName lastName title')
    .sort({ name: 1 });
  res.json({ success: true, count: departments.length, data: { departments } });
});

exports.getDepartment = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const department = await Department.findOne({ slug, isActive: true })
    .populate('faculty', 'name slug shortName')
    .populate('head', 'firstName lastName title email');
  if (!department) return res.status(404).json({ success: false, message: 'Department not found.' });

  const programmes = await Programme.find({ department: department._id, isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: { department, programmes } });
});

/* ------------------------------------------------------------------
   Programmes
   ------------------------------------------------------------------ */
exports.listProgrammes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isActive: true };

  if (req.query.level) filter.level = req.query.level;
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { overview: rx }, { code: rx }];
  }

  const [programmes, total] = await Promise.all([
    Programme.find(filter)
      .populate('faculty', 'name slug shortName')
      .populate('department', 'name slug code')
      .sort({ isFeatured: -1, name: 1 })
      .skip(skip)
      .limit(limit),
    Programme.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: programmes.length,
    meta: buildMeta(total, page, limit),
    data: { programmes },
  });
});

exports.getProgramme = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const programme = await Programme.findOne({ slug, isActive: true })
    .populate('faculty', 'name slug shortName')
    .populate('department', 'name slug code');
  if (!programme) return res.status(404).json({ success: false, message: 'Programme not found.' });

  // Related programmes in the same faculty
  const related = await Programme.find({
    faculty: programme.faculty._id,
    _id: { $ne: programme._id },
    isActive: true,
  }).limit(4).select('name slug degree level image');

  res.json({ success: true, data: { programme, related } });
});

/* ------------------------------------------------------------------
   News
   ------------------------------------------------------------------ */
exports.listNews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }, { body: rx }];
  }

  const [news, total] = await Promise.all([
    News.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    News.countDocuments(filter),
  ]);

  res.json({ success: true, count: news.length, meta: buildMeta(total, page, limit), data: { news } });
});

exports.getNewsItem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const item = await News.findOneAndUpdate(
    { slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  ).populate('author', 'firstName lastName');
  if (!item) return res.status(404).json({ success: false, message: 'Article not found.' });
  res.json({ success: true, data: { news: item } });
});

/* ------------------------------------------------------------------
   Events
   ------------------------------------------------------------------ */
exports.listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.upcoming === 'true') filter.startDate = { $gte: new Date() };

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startDate: 1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json({ success: true, count: events.length, meta: buildMeta(total, page, limit), data: { events } });
});

exports.getEvent = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const event = await Event.findOne({ slug, isPublished: true });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  res.json({ success: true, data: { event } });
});

/* ------------------------------------------------------------------
   Announcements (public ones only)
   ------------------------------------------------------------------ */
exports.listAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const now = new Date();
  const filter = {
    isPublished: true,
    publishAt: { $lte: now },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  const [announcements, total] = await Promise.all([
    Announcement.find(filter).sort({ isPinned: -1, publishAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  res.json({ success: true, count: announcements.length, meta: buildMeta(total, page, limit), data: { announcements } });
});

/* ------------------------------------------------------------------
   Global search across programmes, news, events
   ------------------------------------------------------------------ */
exports.search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ success: true, data: { programmes: [], news: [], events: [] } });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [programmes, news, events] = await Promise.all([
    Programme.find({ isActive: true, $or: [{ name: rx }, { description: rx }, { code: rx }] })
      .limit(10).select('name slug degree level image'),
    News.find({ isPublished: true, $or: [{ title: rx }, { excerpt: rx }] })
      .limit(10).select('title slug excerpt image publishedAt'),
    Event.find({ isPublished: true, $or: [{ title: rx }, { description: rx }] })
      .limit(10).select('title slug description image startDate'),
  ]);

  res.json({ success: true, data: { programmes, news, events } });
});

/* ------------------------------------------------------------------
   Contact form
   ------------------------------------------------------------------ */
exports.submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, department } = req.body;
  const doc = await ContactMessage.create({
    name, email, phone, subject, message, department,
    ipAddress: req.ip,
  });
  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has been received. We will respond within 2 business days.',
    data: { id: doc._id },
  });
});

/* ------------------------------------------------------------------
   Newsletter subscribe
   ------------------------------------------------------------------ */
exports.subscribe = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  const existing = await Subscriber.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
    }
    return res.json({ success: true, message: 'You are already subscribed. Thank you!' });
  }

  await Subscriber.create({ email: email.toLowerCase(), name, source: 'website' });
  res.status(201).json({ success: true, message: 'Subscribed successfully. Welcome aboard!' });
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const sub = await Subscriber.findOne({ email: email.toLowerCase() });
  if (sub) {
    sub.isActive = false;
    sub.unsubscribedAt = new Date();
    await sub.save();
  }
  res.json({ success: true, message: 'You have been unsubscribed.' });
});