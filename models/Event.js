/**
 * models/Event.js
 */
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    location: { type: String, trim: true },
    venue: { type: String, trim: true },
    organizer: { type: String, trim: true },
    category: { type: String, enum: ['academic', 'cultural', 'sports', 'conference', 'workshop', 'other'], default: 'other' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    capacity: { type: Number },
    registrationRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);