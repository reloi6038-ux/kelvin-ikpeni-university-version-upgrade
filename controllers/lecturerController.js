/**
 * controllers/lecturerController.js
 * Lecturer-only endpoints.
 */
const { Course, Result, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

/* ------------------------------------------------------------------
   GET /api/lecturer/dashboard
   ------------------------------------------------------------------ */
exports.getDashboard = asyncHandler(async (req, res) => {
  const courses = await Course.find({ lecturer: req.user._id, isActive: true })
    .populate('department', 'name code')
    .sort({ level: 1, code: 1 });

  const totalStudents = await User.countDocuments({
    role: 'student',
    registeredCourses: { $in: courses.map((c) => c._id) },
  });

  res.json({
    success: true,
    data: { lecturer: { firstName: req.user.firstName, lastName: req.user.lastName }, courses, totalStudents },
  });
});

/* ------------------------------------------------------------------
   GET /api/lecturer/courses
   ------------------------------------------------------------------ */
exports.myCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ lecturer: req.user._id, isActive: true })
    .populate('department', 'name code');
  res.json({ success: true, count: courses.length, data: { courses } });
});

/* ------------------------------------------------------------------
   GET /api/lecturer/courses/:courseId/students
   ------------------------------------------------------------------ */
exports.courseStudents = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  if (course.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You do not teach this course.' });
  }

  const students = await User.find({
    role: 'student',
    registeredCourses: course._id,
  }).select('firstName lastName matricNumber email level');

  res.json({ success: true, count: students.length, data: { course, students } });
});

/* ------------------------------------------------------------------
   POST /api/lecturer/results
   Body: { courseId, session, semester, results: [{studentId, caScore, examScore}] }
   Upserts results for each student.
   ------------------------------------------------------------------ */
exports.uploadResults = asyncHandler(async (req, res) => {
  const { courseId, session, semester, results } = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ success: false, message: 'results must be a non-empty array.' });
  }

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  if (course.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You do not teach this course.' });
  }

  const saved = [];
  for (const r of results) {
    const update = {
      student: r.studentId,
      course: course._id,
      session,
      semester,
      level: course.level,
      caScore: Number(r.caScore) || 0,
      examScore: Number(r.examScore) || 0,
      uploadedBy: req.user._id,
    };
    const doc = await Result.findOneAndUpdate(
      { student: r.studentId, course: course._id, session, semester },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    saved.push(doc._id);
  }

  res.json({ success: true, message: `${saved.length} result(s) saved.`, data: { count: saved.length } });
});

/* ------------------------------------------------------------------
   PUT /api/lecturer/results/:resultId/publish
   ------------------------------------------------------------------ */
exports.publishResult = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const result = await Result.findById(resultId).populate('course', 'lecturer');
  if (!result) return res.status(404).json({ success: false, message: 'Result not found.' });
  if (result.course.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your course.' });
  }
  result.isPublished = true;
  await result.save();
  res.json({ success: true, message: 'Result published.', data: { result } });
});