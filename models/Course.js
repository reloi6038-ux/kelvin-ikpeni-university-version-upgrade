/**
 * models/Course.js
 * Individual courses belonging to a department/programme.
 */
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creditUnits: { type: Number, required: true, min: 1, max: 6 },
    level: { type: Number, required: true, enum: [100, 200, 300, 400, 500, 600] },
    semester: { type: String, enum: ['First', 'Second'], required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isElective: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);