/**
 * scripts/seedPart7.js
 * Quick seed for one faculty + two programmes + one news item, so the
 * homepage has something to display. Full seed arrives in Part 10.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Faculty, Department, Programme, News, Event } = require('../models');

(async () => {
  await connectDB();

  const faculty = await Faculty.findOneAndUpdate(
    { slug: 'faculty-of-science' },
    {
      name: 'Faculty of Science',
      slug: 'faculty-of-science',
      shortName: 'SCI',
      description: 'Advancing discovery in the natural, mathematical, and computational sciences.',
      icon: 'fa-flask',
      established: 2018,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const dept = await Department.findOneAndUpdate(
    { slug: 'computer-science', faculty: faculty._id },
    {
      name: 'Computer Science',
      slug: 'computer-science',
      code: 'CSC',
      faculty: faculty._id,
      description: 'Software engineering, AI, data science, and cybersecurity.',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const prog1 = await Programme.findOneAndUpdate(
    { slug: 'bsc-computer-science' },
    {
      name: 'Computer Science',
      slug: 'bsc-computer-science',
      degree: 'B.Sc.',
      level: 'undergraduate',
      faculty: faculty._id,
      department: dept._id,
      duration: '4 years',
      mode: 'Full-time',
      description: 'A rigorous programme covering algorithms, systems, AI, and software engineering.',
      overview: 'Our B.Sc. Computer Science programme prepares graduates for careers in software development, data science, AI, and research.',
      tuitionPerYear: 750000,
      isFeatured: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  await Programme.findOneAndUpdate(
    { slug: 'msc-data-science' },
    {
      name: 'Data Science',
      slug: 'msc-data-science',
      degree: 'M.Sc.',
      level: 'postgraduate',
      faculty: faculty._id,
      department: dept._id,
      duration: '2 years',
      mode: 'Full-time',
      description: 'Advanced training in statistics, machine learning, and big data systems.',
      tuitionPerYear: 1200000,
      isFeatured: true,
      isActive: true,
    },
    { upsert: true, new: true }
  );

  await News.findOneAndUpdate(
    { slug: 'kiu-launches-ai-research-centre' },
    {
      title: 'KIU Launches New AI Research Centre',
      slug: 'kiu-launches-ai-research-centre',
      excerpt: 'A new centre dedicated to responsible artificial intelligence research opens on campus.',
      body: 'Kelvin Ikpeni University has officially opened its Centre for Responsible AI, a hub for interdisciplinary research on machine learning, ethics, and policy.',
      category: 'research',
      isPublished: true,
    },
    { upsert: true, new: true }
  );

  await Event.findOneAndUpdate(
    { slug: 'open-day-2026' },
    {
      title: 'Open Day 2026',
      slug: 'open-day-2026',
      description: 'Visit our campus, meet faculty, and explore programmes.',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: 'Main Campus',
      venue: 'Convocation Hall',
      category: 'academic',
      isPublished: true,
    },
    { upsert: true, new: true }
  );

  console.log('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });