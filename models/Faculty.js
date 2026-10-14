/**
 * models/Faculty.js
 * A faculty (e.g., Faculty of Science) contains departments.
 */
const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortName: { type: String, trim: true, maxlength: 20 },
    description: { type: String, trim: true, maxlength: 3000 },
    dean: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: { type: String, default: '' },
    icon: { type: String, default: 'fa-university' }, // font-awesome class
    established: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);