/**
 * scripts/testModels.js
 * Verifies that every model can be required and has a valid schema.
 * Run once with: node scripts/testModels.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const models = require('../models');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  console.log('\n--- Loaded models ---');
  Object.entries(models).forEach(([name, Model]) => {
    const paths = Object.keys(Model.schema.paths).length;
    console.log(`  ✓ ${name.padEnd(16)} → collection: ${Model.collection.name}, fields: ${paths}`);
  });
  console.log(`\nTotal models: ${Object.keys(models).length}`);

  // Create indexes (useful on first run)
  for (const [name, Model] of Object.entries(models)) {
    try {
      await Model.createIndexes();
    } catch (e) {
      console.warn(`  ! Index warning for ${name}: ${e.message}`);
    }
  }
  console.log('Indexes ensured.');

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
  process.exit(0);
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});