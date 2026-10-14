/**
 * scripts/makeAdmin.js
 * Promotes an existing user to admin by email, or creates one if missing.
 * Usage: node scripts/makeAdmin.js email@example.com [password] [firstName] [lastName]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User } = require('../models');
const { ROLES } = require('../utils/constants');

(async () => {
  const [email, password, firstName, lastName] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: node scripts/makeAdmin.js email@example.com [password] [firstName] [lastName]');
    process.exit(1);
  }
  await connectDB();

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.role = ROLES.ADMIN;
    user.status = 'active';
    if (password) user.password = password;
    await user.save();
    console.log(`Promoted ${user.email} to admin.`);
  } else {
    if (!password) {
      console.error('User not found and no password provided. Cannot create admin.');
      process.exit(1);
    }
    user = await User.create({
      firstName: firstName || 'System',
      lastName: lastName || 'Administrator',
      email: email.toLowerCase(),
      password,
      role: ROLES.ADMIN,
      status: 'active',
    });
    console.log(`Created admin: ${user.email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });