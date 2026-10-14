/**
 * controllers/applicantController.js
 * Submit an admission application, check status by reference number.
 */
const { Application, Programme } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const generateReference = require('../utils/reference');
const logger = require('../utils/logger');

/* ------------------------------------------------------------------
   POST /api/applications
   Public (but optionalAuth will link to logged-in user).
   ------------------------------------------------------------------ */
exports.submitApplication = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, middleName, email, phone, dateOfBirth, gender,
    nationality, stateOfOrigin, address,
    programme, level,
    previousSchool, previousQualification, oLevelResults,
    jambScore, jambRegNumber, degreeClass,
  } = req.body;

  // Validate programme exists
  const prog = await Programme.findById(programme);
  if (!prog) return res.status(400).json({ success: false, message: 'Selected programme does not exist.' });

  // Generate a unique reference (retry a couple of times just in case)
  let referenceNumber;
  for (let i = 0; i < 5; i++) {
    referenceNumber = generateReference();
    const exists = await Application.findOne({ referenceNumber });
    if (!exists) break;
  }

  const application = await Application.create({
    referenceNumber,
    applicant: req.user ? req.user._id : undefined,
    firstName, lastName, middleName, email: email.toLowerCase(), phone,
    dateOfBirth, gender, nationality, stateOfOrigin, address,
    programme: prog._id,
    faculty: prog.faculty,
    department: prog.department,
    level,
    previousSchool, previousQualification, oLevelResults: oLevelResults || [],
    jambScore, jambRegNumber, degreeClass,
  });

  logger.info(`Application submitted: ${referenceNumber} (${email})`);

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully. Save your reference number.',
    data: { referenceNumber: application.referenceNumber, applicationId: application._id },
  });
});

/* ------------------------------------------------------------------
   GET /api/applications/status/:reference
   Public. Anyone with the reference can check status (it's a random ID).
   ------------------------------------------------------------------ */
exports.checkStatus = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const application = await Application.findOne({ referenceNumber: reference.toUpperCase() })
    .populate('programme', 'name degree level')
    .select('referenceNumber firstName lastName status level createdAt reviewedAt decisionReason programme');

  if (!application) {
    return res.status(404).json({ success: false, message: 'No application found with that reference number.' });
  }

  res.json({ success: true, data: { application } });
});

/* ------------------------------------------------------------------
   GET /api/applications/my
   Authenticated. Returns applications linked to this user's email.
   ------------------------------------------------------------------ */
exports.myApplications = asyncHandler(async (req, res) => {
  const apps = await Application.find({ email: req.user.email })
    .populate('programme', 'name degree level')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: apps.length, data: { applications: apps } });
});