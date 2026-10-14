/**
 * models/Application.js
 * Admission applications submitted via the website.
 */
const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../utils/constants');

const applicationSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional if not registered

    /* Personal */
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    nationality: { type: String, required: true, default: 'Nigerian' },
    stateOfOrigin: { type: String, trim: true },
    address: { type: String, trim: true },

    /* Academic */
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    level: { type: String, enum: ['undergraduate', 'postgraduate', 'online'], required: true },
    previousSchool: { type: String, trim: true },
    previousQualification: { type: String, trim: true },
    oLevelResults: [
      {
        subject: String,
        grade: String,
      },
    ],
    jambScore: { type: Number, min: 0, max: 400 },
    jambRegNumber: { type: String, trim: true },
    degreeClass: { type: String, trim: true }, // for postgrad

    /* Documents (URLs after upload) */
    documents: {
      passportPhoto: { type: String, default: '' },
      oLevelCertificate: { type: String, default: '' },
      degreeCertificate: { type: String, default: '' },
      transcript: { type: String, default: '' },
      otherDoc: { type: String, default: '' },
    },

    /* Status & review */
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.SUBMITTED,
      index: true,
    },
    reviewerNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    decisionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

applicationSchema.index({ email: 1, programme: 1 });

module.exports = mongoose.model('Application', applicationSchema);