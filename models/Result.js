/**
 * models/Result.js
 * A student's result in a course for a semester/session.
 */
const mongoose = require('mongoose');
const { GRADE_SCALE } = require('../utils/constants');

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    session: { type: String, required: true }, // e.g., "2024/2025"
    semester: { type: String, enum: ['First', 'Second'], required: true },
    level: { type: Number, required: true },
    caScore: { type: Number, default: 0, min: 0, max: 40 },
    examScore: { type: Number, default: 0, min: 0, max: 60 },
    totalScore: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: Object.keys(GRADE_SCALE) },
    gradePoint: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, session: 1, semester: 1 });

resultSchema.pre('save', function (next) {
  this.totalScore = (this.caScore || 0) + (this.examScore || 0);
  const s = this.totalScore;
  if (s >= 70) this.grade = 'A';
  else if (s >= 60) this.grade = 'B';
  else if (s >= 50) this.grade = 'C';
  else if (s >= 45) this.grade = 'D';
  else if (s >= 40) this.grade = 'E';
  else this.grade = 'F';
  this.gradePoint = GRADE_SCALE[this.grade];
  next();
});

module.exports = mongoose.model('Result', resultSchema);