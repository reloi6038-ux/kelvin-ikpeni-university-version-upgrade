/**
 * models/Department.js
 */
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, trim: true, uppercase: true, maxlength: 10 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, trim: true, maxlength: 3000 },
    image: { type: String, default: '' },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.index({ name: 1, faculty: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);