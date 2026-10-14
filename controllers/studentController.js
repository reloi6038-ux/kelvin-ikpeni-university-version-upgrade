/**
 * controllers/studentController.js
 * Student-only endpoints: courses, registration, results, dashboard.
 */
const { Course, Result, User, Programme, Department } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

/* ------------------------------------------------------------------
   GET /api/student/dashboard
   ------------------------------------------------------------------ */
exports.getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('programme', 'name degree level')
    .populate('department', 'name code')
    .populate('faculty', 'name shortName')
    .populate('registeredCourses', 'code title creditUnits semester level');

  const results = await Result.find({ student: req.user._id, isPublished: true })
    .populate('course', 'code title creditUnits')
    .sort({ createdAt: -1 })
    .limit(10);

  // Compute CGPA (simple average of gradePoints weighted by credit units)
  const allResults = await Result.find({ student: req.user._id, isPublished: true })
    .populate('course', 'creditUnits');

  let totalPoints = 0;
  let totalUnits = 0;
  allResults.forEach((r) => {
    const units = r.course?.creditUnits || 0;
    totalPoints += r.gradePoint * units;
    totalUnits += units;
  });
  const cgpa = totalUnits ? +(totalPoints / totalUnits).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      student: user,
      recentResults: results,
      cgpa,
      totalUnits,
    },
  });
});

/* ------------------------------------------------------------------
   GET /api/student/courses/available
   Courses for this student's level + department.
   ------------------------------------------------------------------ */
exports.availableCourses = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id).select('department level');
  if (!student.department) {
    return res.status(400).json({ success: false, message: 'You are not assigned to a department yet.' });
  }
  const courses = await Course.find({
    department: student.department,
    level: student.level,
    isActive: true,
  }).populate('lecturer', 'firstName lastName title');
  res.json({ success: true, count: courses.length, data: { courses } });
});

/* ------------------------------------------------------------------
   POST /api/student/courses/register
   Body: { courseIds: [id, id, ...] }
   ------------------------------------------------------------------ */
exports.registerCourses = asyncHandler(async (req, res) => {
  const { courseIds } = req.body;
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Provide at least one course.' });
  }

  const student = await User.findById(req.user._id).select('registeredCourses department level');
  const courses = await Course.find({ _id: { $in: courseIds }, department: student.department, level: student.level });

  if (courses.length !== courseIds.length) {
    return res.status(400).json({ success: false, message: 'One or more courses are invalid for your level/department.' });
  }

  const units = courses.reduce((sum, c) => sum + c.creditUnits, 0);
  if (units > 24) {
    return res.status(400).json({ success: false, message: `Max 24 credit units per semester. You selected ${units}.` });
  }

  // Merge with existing (avoid duplicates)
  const existing = new Set(student.registeredCourses.map((id) => id.toString()));
  courseIds.forEach((id) => existing.add(id));
  student.registeredCourses = Array.from(existing);
  await student.save();

  res.json({
    success: true,
    message: `${courses.length} course(s) registered.`,
    data: { registeredCourses: student.registeredCourses, totalUnits: units },
  });
});

/* ------------------------------------------------------------------
   DELETE /api/student/courses/:courseId
   ------------------------------------------------------------------ */
exports.dropCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const student = await User.findById(req.user._id).select('registeredCourses');
  student.registeredCourses = student.registeredCourses.filter((id) => id.toString() !== courseId);
  await student.save();
  res.json({ success: true, message: 'Course dropped.', data: { registeredCourses: student.registeredCourses } });
});

/* ------------------------------------------------------------------
   GET /api/student/results
   ------------------------------------------------------------------ */
exports.myResults = asyncHandler(async (req, res) => {
  const filter = { student: req.user._id, isPublished: true };
  if (req.query.session) filter.session = req.query.session;
  if (req.query.semester) filter.semester = req.query.semester;

  const results = await Result.find(filter)
    .populate('course', 'code title creditUnits')
    .sort({ session: -1, semester: -1, createdAt: -1 });

  res.json({ success: true, count: results.length, data: { results } });
});