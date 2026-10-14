/**
 * models/Announcement.js
 * Admin-posted announcements.
 */
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    body: { type: String, required: true },
    excerpt: { type: String, trim: true, maxlength: 400 },
    category: { type: String, enum: ['general', 'academic', 'admission', 'event', 'urgent'], default: 'general' },
    audience: { type: String, enum: ['all', 'students', 'lecturers', 'applicants'], default: 'all' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: { type: String, default: '' },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);