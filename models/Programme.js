/**
 * models/Programme.js
 * Academic programmes (B.Sc. Computer Science, MBA, etc.).
 */
const mongoose = require('mongoose');
const { PROGRAMME_LEVELS, DEGREE_TYPES } = require('../utils/constants');

const programmeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    degree: { type: String, enum: Object.values(DEGREE_TYPES), required: true },
    level: { type: String, enum: Object.values(PROGRAMME_LEVELS), required: true, index: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    description: { type: String, trim: true, maxlength: 5000 },
    overview: { type: String, trim: true, maxlength: 5000 },
    duration: { type: String, default: '4 years' },
    mode: { type: String, enum: ['Full-time', 'Part-time', 'Online', 'Hybrid'], default: 'Full-time' },
    entryRequirements: [String],
    careerProspects: [String],
    tuitionPerYear: { type: Number, default: 0 },
    tuitionCurrency: { type: String, default: 'NGN' },
    image: { type: String, default: '' },
    brochureUrl: { type: String, default: '' },
    accreditation: { type: String, default: 'NUC Accredited' },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programmeSchema.index({ name: 'text', description: 'text', overview: 'text' });

module.exports = mongoose.model('Programme', programmeSchema);