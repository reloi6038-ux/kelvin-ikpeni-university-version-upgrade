/**
 * models/Subscriber.js
 * Newsletter subscribers.
 */
const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    source: { type: String, default: 'website' },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);