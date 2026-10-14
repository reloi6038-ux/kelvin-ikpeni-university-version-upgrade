/**
 * models/User.js
 * Single User model with role-based fields.
 *
 * Mongoose 7+ note: async pre/post hooks must NOT accept or call `next`.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 60 },
    lastName:  { type: String, required: [true, 'Last name is required'],  trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.APPLICANT,
      index: true,
    },
    phone: { type: String, trim: true, maxlength: 30 },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    nationality: { type: String, trim: true, default: 'Nigerian' },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'Nigeria' },
      postalCode: String,
    },
    avatar: { type: String, default: '' },

    /* Student */
    matricNumber: { type: String, unique: true, sparse: true, trim: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: 'Programme' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    level: { type: Number, enum: [100, 200, 300, 400, 500, 600], default: 100 },
    admissionYear: { type: Number },
    status: {
      type: String,
      enum: ['active', 'suspended', 'graduated', 'withdrawn', 'pending'],
      default: 'active',
    },
    registeredCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    /* Lecturer */
    staffId: { type: String, unique: true, sparse: true, trim: true },
    title: { type: String, trim: true },
    specialization: [String],
    qualifications: [String],

    /* Applicant */
    applicationRef: { type: String, unique: true, sparse: true, trim: true },

    /* Auth */
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    refreshTokens: [{ type: String, select: false }],
  },
  { timestamps: true }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/* ASYNC hook — do NOT accept or call `next` on Mongoose 7+ */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.registerFailedLogin = async function () {
  const MAX = 5;
  const LOCK_MS = 30 * 60 * 1000;
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_MS) };
    updates.$set.loginAttempts = 0;
  }
  await this.updateOne(updates);
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);