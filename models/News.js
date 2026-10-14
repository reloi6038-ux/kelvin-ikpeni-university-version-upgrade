/**
 * models/News.js
 */
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 400 },
    body: { type: String, required: true },
    image: { type: String, default: '' },
    category: { type: String, enum: ['campus', 'research', 'sports', 'alumni', 'general'], default: 'general' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);