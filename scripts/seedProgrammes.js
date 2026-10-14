/**
 * scripts/seedProgrammes.js
 * Seeds faculties, departments, and a full catalogue of programmes.
 * Safe to re-run — uses upsert by slug.
 *
 * Usage: node scripts/seedProgrammes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Faculty, Department, Programme } = require('../models');

const slugify = (s = '') =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ----------------------------------------------------------------
   Faculty definitions (name, short name, icon, slug)
   ---------------------------------------------------------------- */
const FACULTIES = [
  { name: 'Faculty of Science', shortName: 'SCI', icon: 'fa-flask', slug: 'faculty-of-science',
    description: 'Advancing discovery in the natural, mathematical, and computational sciences.' },
  { name: 'Faculty of Computing & Digital Technology', shortName: 'CMP', icon: 'fa-laptop-code', slug: 'faculty-of-computing-and-digital-technology',
    description: 'Software, AI, data science, cybersecurity, and the technologies shaping tomorrow.' },
  { name: 'Faculty of Engineering', shortName: 'ENG', icon: 'fa-gears', slug: 'faculty-of-engineering',
    description: 'Designing and building the infrastructure and technologies of the modern world.' },
  { name: 'Faculty of Business & Management', shortName: 'BUS', icon: 'fa-briefcase', slug: 'faculty-of-business-and-management',
    description: 'Preparing principled leaders for business, finance, and enterprise.' },
  { name: 'Faculty of Social Sciences', shortName: 'SOC', icon: 'fa-users', slug: 'faculty-of-social-sciences',
    description: 'Understanding society, governance, and human behaviour.' },
  { name: 'Faculty of Arts & Humanities', shortName: 'ART', icon: 'fa-book', slug: 'faculty-of-arts-and-humanities',
    description: 'Exploring language, culture, history, and the human condition.' },
  { name: 'Faculty of Law', shortName: 'LAW', icon: 'fa-scale-balanced', slug: 'faculty-of-law',
    description: 'Rigorous legal training grounded in justice, ethics, and practice.' },
  { name: 'Faculty of Education', shortName: 'EDU', icon: 'fa-graduation-cap', slug: 'faculty-of-education',
    description: 'Preparing the teachers and educational leaders of tomorrow.' },
  { name: 'Faculty of Health Sciences', shortName: 'HLT', icon: 'fa-heart-pulse', slug: 'faculty-of-health-sciences',
    description: 'Public health, nursing, and allied health professions.' },
  { name: 'Faculty of Environmental Design & Architecture', shortName: 'ENV', icon: 'fa-city', slug: 'faculty-of-environmental-design-and-architecture',
    description: 'Architecture, planning, and the built environment.' },
  { name: 'Faculty of Agriculture & Food Systems', shortName: 'AGR', icon: 'fa-seedling', slug: 'faculty-of-agriculture-and-food-systems',
    description: 'Food security, agronomy, and sustainable agriculture.' },
  { name: 'Faculty of Media, Creative Arts & Design', shortName: 'MED', icon: 'fa-film', slug: 'faculty-of-media-creative-arts-and-design',
    description: 'Film, design, advertising, and the creative industries.' },
  { name: 'Faculty of Hospitality & Tourism', shortName: 'HOS', icon: 'fa-hotel', slug: 'faculty-of-hospitality-and-tourism',
    description: 'Hospitality, tourism, and event management.' },
  { name: 'Faculty of Library & Information Science', shortName: 'LIB', icon: 'fa-book-open', slug: 'faculty-of-library-and-information-science',
    description: 'Knowledge management and information science.' },
  { name: 'Faculty of Maritime & Logistics Studies', shortName: 'MAR', icon: 'fa-ship', slug: 'faculty-of-maritime-and-logistics-studies',
    description: 'Shipping, ports, and global supply chains.' },
  { name: 'Faculty of Interdisciplinary & Emerging Studies', shortName: 'IDS', icon: 'fa-lightbulb', slug: 'faculty-of-interdisciplinary-and-emerging-studies',
    description: 'Climate, energy, and emerging interdisciplinary fields.' },
];

/* ----------------------------------------------------------------
   Departments per faculty
   ---------------------------------------------------------------- */
const DEPARTMENTS = {
  'faculty-of-science': ['Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology', 'Microbiology', 'Biochemistry', 'Biotechnology', 'Environmental Science'],
  'faculty-of-computing-and-digital-technology': ['Computer Science', 'Software Engineering', 'Information Technology', 'Data Science', 'Artificial Intelligence', 'Cybersecurity', 'Information Systems', 'Computer Engineering'],
  'faculty-of-engineering': ['Civil Engineering', 'Mechanical Engineering', 'Electrical & Electronics Engineering', 'Chemical Engineering', 'Computer Engineering', 'Mechatronics Engineering', 'Renewable Energy Engineering'],
  'faculty-of-business-and-management': ['Accounting', 'Finance', 'Banking', 'Business Administration', 'Marketing', 'Human Resource Management', 'Entrepreneurship', 'Project Management', 'Supply Chain Management'],
  'faculty-of-social-sciences': ['Economics', 'Sociology', 'Political Science', 'Psychology', 'International Relations', 'Public Administration', 'Criminology & Security Studies', 'Development Studies'],
  'faculty-of-arts-and-humanities': ['English & Literary Studies', 'History', 'Philosophy', 'Linguistics', 'Theatre & Performing Arts', 'Communication & Media Studies', 'Languages & Cultural Studies'],
  'faculty-of-law': ['Law', 'Commercial Law', 'International Law', 'Human Rights & Constitutional Law', 'Intellectual Property Law'],
  'faculty-of-education': ['Educational Management', 'Educational Technology', 'Curriculum Studies', 'Guidance & Counselling', 'Science Education', 'Mathematics Education', 'Educational Psychology'],
  'faculty-of-health-sciences': ['Public Health', 'Health Information Management', 'Medical Laboratory Science', 'Nursing Science', 'Nutrition & Dietetics', 'Environmental Health'],
  'faculty-of-environmental-design-and-architecture': ['Architecture', 'Urban & Regional Planning', 'Estate Management', 'Quantity Surveying', 'Building Technology', 'Geography & Geoinformatics'],
  'faculty-of-agriculture-and-food-systems': ['Agricultural Science', 'Agronomy', 'Animal Science', 'Agricultural Economics', 'Food Science & Technology', 'Fisheries & Aquaculture', 'Soil Science'],
  'faculty-of-media-creative-arts-and-design': ['Graphic Design', 'Digital Media', 'Film & Television Production', 'Animation', 'Advertising', 'Public Relations', 'Multimedia Technology'],
  'faculty-of-hospitality-and-tourism': ['Hospitality Management', 'Tourism Management', 'Hotel Management', 'Event Management', 'Travel & Tourism Studies'],
  'faculty-of-library-and-information-science': ['Library Science', 'Information Management', 'Knowledge Management', 'Digital Archiving'],
  'faculty-of-maritime-and-logistics-studies': ['Maritime Management', 'Logistics & Transport Management', 'Port Management', 'Supply Chain & Operations Management'],
  'faculty-of-interdisciplinary-and-emerging-studies': ['Climate Change & Sustainability', 'Energy Studies', 'Entrepreneurship & Innovation', 'Peace & Conflict Studies', 'Artificial Intelligence & Society', 'Digital Transformation'],
};

/* ----------------------------------------------------------------
   Programmes per department
   Each entry: [degree, level, name, duration, mode]
   - Undergraduate: B.Sc., B.A., B.Eng., LL.B.
   - Postgraduate: M.Sc., M.A., MBA, M.Eng., M.Ed., LL.M., MPH, PGD, M.Phil., Ph.D.
   ---------------------------------------------------------------- */
const PROGRAMMES = {
  /* SCIENCE */
  'Mathematics': [
    ['B.Sc.', 'undergraduate', 'Mathematics', '4 years', 'Full-time'],
    ['B.Sc.', 'undergraduate', 'Industrial Mathematics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Mathematics', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Mathematics', '3 years', 'Full-time'],
  ],
  'Statistics': [
    ['B.Sc.', 'undergraduate', 'Statistics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Statistics', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Statistics', '3 years', 'Full-time'],
  ],
  'Physics': [
    ['B.Sc.', 'undergraduate', 'Physics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Physics', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Physics', '3 years', 'Full-time'],
  ],
  'Chemistry': [
    ['B.Sc.', 'undergraduate', 'Chemistry', '4 years', 'Full-time'],
    ['B.Sc.', 'undergraduate', 'Industrial Chemistry', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Chemistry', '2 years', 'Full-time'],
  ],
  'Biology': [
    ['B.Sc.', 'undergraduate', 'Biology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Biology', '2 years', 'Full-time'],
  ],
  'Microbiology': [
    ['B.Sc.', 'undergraduate', 'Microbiology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Microbiology', '2 years', 'Full-time'],
  ],
  'Biochemistry': [
    ['B.Sc.', 'undergraduate', 'Biochemistry', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Biochemistry', '2 years', 'Full-time'],
  ],
  'Biotechnology': [
    ['B.Sc.', 'undergraduate', 'Biotechnology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Biotechnology', '2 years', 'Full-time'],
  ],
  'Environmental Science': [
    ['B.Sc.', 'undergraduate', 'Environmental Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Environmental Science', '2 years', 'Full-time'],
  ],

  /* COMPUTING */
  'Computer Science': [
    ['B.Sc.', 'undergraduate', 'Computer Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Computer Science', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Computer Science', '3 years', 'Full-time'],
    ['B.Sc.', 'online', 'Computer Science (Online)', '4 years', 'Online'],
  ],
  'Software Engineering': [
    ['B.Sc.', 'undergraduate', 'Software Engineering', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Software Engineering', '2 years', 'Full-time'],
  ],
  'Information Technology': [
    ['B.Sc.', 'undergraduate', 'Information Technology', '4 years', 'Full-time'],
    ['B.Sc.', 'online', 'Information Technology (Online)', '4 years', 'Online'],
  ],
  'Data Science': [
    ['B.Sc.', 'undergraduate', 'Data Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Data Science', '2 years', 'Full-time'],
    ['M.Sc.', 'online', 'Data Science (Online)', '2 years', 'Online'],
  ],
  'Artificial Intelligence': [
    ['B.Sc.', 'undergraduate', 'Artificial Intelligence', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Artificial Intelligence', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Artificial Intelligence', '3 years', 'Full-time'],
  ],
  'Cybersecurity': [
    ['B.Sc.', 'undergraduate', 'Cybersecurity', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Cybersecurity', '2 years', 'Full-time'],
    ['M.Sc.', 'online', 'Cybersecurity (Online)', '2 years', 'Online'],
  ],
  'Information Systems': [
    ['B.Sc.', 'undergraduate', 'Information Systems', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Information Systems', '2 years', 'Full-time'],
  ],
  'Computer Engineering': [
    ['B.Eng.', 'undergraduate', 'Computer Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Computer Engineering', '2 years', 'Full-time'],
  ],

  /* ENGINEERING */
  'Civil Engineering': [
    ['B.Eng.', 'undergraduate', 'Civil Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Civil Engineering', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Civil Engineering', '3 years', 'Full-time'],
  ],
  'Mechanical Engineering': [
    ['B.Eng.', 'undergraduate', 'Mechanical Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Mechanical Engineering', '2 years', 'Full-time'],
  ],
  'Electrical & Electronics Engineering': [
    ['B.Eng.', 'undergraduate', 'Electrical & Electronics Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Electrical & Electronics Engineering', '2 years', 'Full-time'],
  ],
  'Chemical Engineering': [
    ['B.Eng.', 'undergraduate', 'Chemical Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Chemical Engineering', '2 years', 'Full-time'],
  ],
  'Mechatronics Engineering': [
    ['B.Eng.', 'undergraduate', 'Mechatronics Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Mechatronics Engineering', '2 years', 'Full-time'],
  ],
  'Renewable Energy Engineering': [
    ['B.Eng.', 'undergraduate', 'Renewable Energy Engineering', '5 years', 'Full-time'],
    ['M.Eng.', 'postgraduate', 'Renewable Energy Engineering', '2 years', 'Full-time'],
  ],

  /* BUSINESS */
  'Accounting': [
    ['B.Sc.', 'undergraduate', 'Accounting', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Accounting', '2 years', 'Full-time'],
    ['M.Sc.', 'online', 'Accounting (Online)', '2 years', 'Online'],
  ],
  'Finance': [
    ['B.Sc.', 'undergraduate', 'Finance', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Finance', '2 years', 'Full-time'],
  ],
  'Banking': [
    ['B.Sc.', 'undergraduate', 'Banking & Finance', '4 years', 'Full-time'],
  ],
  'Business Administration': [
    ['B.Sc.', 'undergraduate', 'Business Administration', '4 years', 'Full-time'],
    ['MBA', 'postgraduate', 'Business Administration (MBA)', '2 years', 'Full-time'],
    ['MBA', 'online', 'Business Administration (Online MBA)', '2 years', 'Online'],
    ['Ph.D.', 'postgraduate', 'Business Administration', '3 years', 'Full-time'],
  ],
  'Marketing': [
    ['B.Sc.', 'undergraduate', 'Marketing', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Marketing', '2 years', 'Full-time'],
  ],
  'Human Resource Management': [
    ['B.Sc.', 'undergraduate', 'Human Resource Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Human Resource Management', '2 years', 'Full-time'],
  ],
  'Entrepreneurship': [
    ['B.Sc.', 'undergraduate', 'Entrepreneurship', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Entrepreneurship', '2 years', 'Full-time'],
  ],
  'Project Management': [
    ['B.Sc.', 'undergraduate', 'Project Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Project Management', '2 years', 'Full-time'],
  ],
  'Supply Chain Management': [
    ['B.Sc.', 'undergraduate', 'Supply Chain Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Supply Chain Management', '2 years', 'Full-time'],
  ],

  /* SOCIAL SCIENCES */
  'Economics': [
    ['B.Sc.', 'undergraduate', 'Economics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Economics', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Economics', '3 years', 'Full-time'],
  ],
  'Sociology': [
    ['B.Sc.', 'undergraduate', 'Sociology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Sociology', '2 years', 'Full-time'],
  ],
  'Political Science': [
    ['B.Sc.', 'undergraduate', 'Political Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Political Science', '2 years', 'Full-time'],
  ],
  'Psychology': [
    ['B.Sc.', 'undergraduate', 'Psychology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Psychology', '2 years', 'Full-time'],
  ],
  'International Relations': [
    ['B.Sc.', 'undergraduate', 'International Relations', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'International Relations', '2 years', 'Full-time'],
  ],
  'Public Administration': [
    ['B.Sc.', 'undergraduate', 'Public Administration', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Public Administration', '2 years', 'Full-time'],
  ],
  'Criminology & Security Studies': [
    ['B.Sc.', 'undergraduate', 'Criminology & Security Studies', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Criminology & Security Studies', '2 years', 'Full-time'],
  ],
  'Development Studies': [
    ['B.Sc.', 'undergraduate', 'Development Studies', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Development Studies', '2 years', 'Full-time'],
  ],

  /* ARTS */
  'English & Literary Studies': [
    ['B.A.', 'undergraduate', 'English & Literary Studies', '4 years', 'Full-time'],
    ['M.A.', 'postgraduate', 'English & Literary Studies', '2 years', 'Full-time'],
  ],
  'History': [
    ['B.A.', 'undergraduate', 'History', '4 years', 'Full-time'],
    ['M.A.', 'postgraduate', 'History', '2 years', 'Full-time'],
  ],
  'Philosophy': [
    ['B.A.', 'undergraduate', 'Philosophy', '4 years', 'Full-time'],
    ['M.A.', 'postgraduate', 'Philosophy', '2 years', 'Full-time'],
  ],
  'Linguistics': [
    ['B.A.', 'undergraduate', 'Linguistics', '4 years', 'Full-time'],
    ['M.A.', 'postgraduate', 'Linguistics', '2 years', 'Full-time'],
  ],
  'Theatre & Performing Arts': [
    ['B.A.', 'undergraduate', 'Theatre & Performing Arts', '4 years', 'Full-time'],
  ],
  'Communication & Media Studies': [
    ['B.A.', 'undergraduate', 'Communication & Media Studies', '4 years', 'Full-time'],
    ['M.A.', 'postgraduate', 'Communication & Media Studies', '2 years', 'Full-time'],
  ],
  'Languages & Cultural Studies': [
    ['B.A.', 'undergraduate', 'Languages & Cultural Studies', '4 years', 'Full-time'],
  ],

  /* LAW */
  'Law': [
    ['LL.B.', 'undergraduate', 'Law', '5 years', 'Full-time'],
    ['LL.M.', 'postgraduate', 'Commercial Law', '2 years', 'Full-time'],
    ['LL.M.', 'postgraduate', 'International Law', '2 years', 'Full-time'],
    ['LL.M.', 'postgraduate', 'Human Rights & Constitutional Law', '2 years', 'Full-time'],
    ['LL.M.', 'postgraduate', 'Intellectual Property Law', '2 years', 'Full-time'],
    ['Ph.D.', 'postgraduate', 'Law', '3 years', 'Full-time'],
  ],
  'Commercial Law': [ ['LL.M.', 'postgraduate', 'Commercial Law', '2 years', 'Full-time'] ],
  'International Law': [ ['LL.M.', 'postgraduate', 'International Law', '2 years', 'Full-time'] ],
  'Human Rights & Constitutional Law': [ ['LL.M.', 'postgraduate', 'Human Rights & Constitutional Law', '2 years', 'Full-time'] ],
  'Intellectual Property Law': [ ['LL.M.', 'postgraduate', 'Intellectual Property Law', '2 years', 'Full-time'] ],

  /* EDUCATION */
  'Educational Management': [
    ['B.Ed.', 'undergraduate', 'Educational Management', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Educational Management', '2 years', 'Full-time'],
  ],
  'Educational Technology': [
    ['B.Ed.', 'undergraduate', 'Educational Technology', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Educational Technology', '2 years', 'Full-time'],
    ['M.Ed.', 'online', 'Educational Technology (Online)', '2 years', 'Online'],
  ],
  'Curriculum Studies': [
    ['B.Ed.', 'undergraduate', 'Curriculum Studies', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Curriculum Studies', '2 years', 'Full-time'],
  ],
  'Guidance & Counselling': [
    ['B.Ed.', 'undergraduate', 'Guidance & Counselling', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Guidance & Counselling', '2 years', 'Full-time'],
  ],
  'Science Education': [
    ['B.Ed.', 'undergraduate', 'Science Education', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Science Education', '2 years', 'Full-time'],
  ],
  'Mathematics Education': [
    ['B.Ed.', 'undergraduate', 'Mathematics Education', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Mathematics Education', '2 years', 'Full-time'],
  ],
  'Educational Psychology': [
    ['B.Ed.', 'undergraduate', 'Educational Psychology', '4 years', 'Full-time'],
    ['M.Ed.', 'postgraduate', 'Educational Psychology', '2 years', 'Full-time'],
  ],

  /* HEALTH */
  'Public Health': [
    ['B.Sc.', 'undergraduate', 'Public Health', '4 years', 'Full-time'],
    ['MPH', 'postgraduate', 'Public Health (MPH)', '2 years', 'Full-time'],
    ['MPH', 'online', 'Public Health (Online MPH)', '2 years', 'Online'],
    ['Ph.D.', 'postgraduate', 'Public Health', '3 years', 'Full-time'],
  ],
  'Health Information Management': [
    ['B.Sc.', 'undergraduate', 'Health Information Management', '4 years', 'Full-time'],
  ],
  'Medical Laboratory Science': [
    ['B.MLS', 'undergraduate', 'Medical Laboratory Science', '5 years', 'Full-time'],
  ],
  'Nursing Science': [
    ['B.NSc.', 'undergraduate', 'Nursing Science', '5 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Nursing Science', '2 years', 'Full-time'],
  ],
  'Nutrition & Dietetics': [
    ['B.Sc.', 'undergraduate', 'Nutrition & Dietetics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Nutrition & Dietetics', '2 years', 'Full-time'],
  ],
  'Environmental Health': [
    ['B.Sc.', 'undergraduate', 'Environmental Health', '4 years', 'Full-time'],
  ],

  /* ENVIRONMENTAL DESIGN */
  'Architecture': [
    ['B.Sc.', 'undergraduate', 'Architecture', '5 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Architecture', '2 years', 'Full-time'],
  ],
  'Urban & Regional Planning': [
    ['B.Sc.', 'undergraduate', 'Urban & Regional Planning', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Urban & Regional Planning', '2 years', 'Full-time'],
  ],
  'Estate Management': [
    ['B.Sc.', 'undergraduate', 'Estate Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Estate Management', '2 years', 'Full-time'],
  ],
  'Quantity Surveying': [
    ['B.Sc.', 'undergraduate', 'Quantity Surveying', '4 years', 'Full-time'],
  ],
  'Building Technology': [
    ['B.Sc.', 'undergraduate', 'Building Technology', '4 years', 'Full-time'],
  ],
  'Geography & Geoinformatics': [
    ['B.Sc.', 'undergraduate', 'Geography & Geoinformatics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Geography & Geoinformatics', '2 years', 'Full-time'],
  ],

  /* AGRICULTURE */
  'Agricultural Science': [
    ['B.Agric.', 'undergraduate', 'Agricultural Science', '5 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Agricultural Science', '2 years', 'Full-time'],
  ],
  'Agronomy': [
    ['B.Agric.', 'undergraduate', 'Agronomy', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Agronomy', '2 years', 'Full-time'],
  ],
  'Animal Science': [
    ['B.Agric.', 'undergraduate', 'Animal Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Animal Science', '2 years', 'Full-time'],
  ],
  'Agricultural Economics': [
    ['B.Agric.', 'undergraduate', 'Agricultural Economics', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Agricultural Economics', '2 years', 'Full-time'],
  ],
  'Food Science & Technology': [
    ['B.Sc.', 'undergraduate', 'Food Science & Technology', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Food Science & Technology', '2 years', 'Full-time'],
  ],
  'Fisheries & Aquaculture': [
    ['B.Sc.', 'undergraduate', 'Fisheries & Aquaculture', '4 years', 'Full-time'],
  ],
  'Soil Science': [
    ['B.Agric.', 'undergraduate', 'Soil Science', '4 years', 'Full-time'],
  ],

  /* MEDIA */
  'Graphic Design': [
    ['B.A.', 'undergraduate', 'Graphic Design', '4 years', 'Full-time'],
  ],
  'Digital Media': [
    ['B.A.', 'undergraduate', 'Digital Media', '4 years', 'Full-time'],
  ],
  'Film & Television Production': [
    ['B.A.', 'undergraduate', 'Film & Television Production', '4 years', 'Full-time'],
  ],
  'Animation': [
    ['B.A.', 'undergraduate', 'Animation', '4 years', 'Full-time'],
  ],
  'Advertising': [
    ['B.A.', 'undergraduate', 'Advertising', '4 years', 'Full-time'],
  ],
  'Public Relations': [
    ['B.A.', 'undergraduate', 'Public Relations', '4 years', 'Full-time'],
  ],
  'Multimedia Technology': [
    ['B.Sc.', 'undergraduate', 'Multimedia Technology', '4 years', 'Full-time'],
  ],

  /* HOSPITALITY */
  'Hospitality Management': [
    ['B.Sc.', 'undergraduate', 'Hospitality Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Hospitality Management', '2 years', 'Full-time'],
  ],
  'Tourism Management': [
    ['B.Sc.', 'undergraduate', 'Tourism Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Tourism Management', '2 years', 'Full-time'],
  ],
  'Hotel Management': [
    ['B.Sc.', 'undergraduate', 'Hotel Management', '4 years', 'Full-time'],
  ],
  'Event Management': [
    ['B.Sc.', 'undergraduate', 'Event Management', '4 years', 'Full-time'],
  ],
  'Travel & Tourism Studies': [
    ['B.Sc.', 'undergraduate', 'Travel & Tourism Studies', '4 years', 'Full-time'],
  ],

  /* LIBRARY */
  'Library Science': [
    ['B.Sc.', 'undergraduate', 'Library Science', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Library Science', '2 years', 'Full-time'],
  ],
  'Information Management': [
    ['B.Sc.', 'undergraduate', 'Information Management', '4 years', 'Full-time'],
  ],
  'Knowledge Management': [
    ['M.Sc.', 'postgraduate', 'Knowledge Management', '2 years', 'Full-time'],
  ],
  'Digital Archiving': [
    ['M.Sc.', 'postgraduate', 'Digital Archiving', '2 years', 'Full-time'],
  ],

  /* MARITIME */
  'Maritime Management': [
    ['B.Sc.', 'undergraduate', 'Maritime Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Maritime Management', '2 years', 'Full-time'],
  ],
  'Logistics & Transport Management': [
    ['B.Sc.', 'undergraduate', 'Logistics & Transport Management', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Logistics & Transport Management', '2 years', 'Full-time'],
  ],
  'Port Management': [
    ['B.Sc.', 'undergraduate', 'Port Management', '4 years', 'Full-time'],
  ],
  'Supply Chain & Operations Management': [
    ['M.Sc.', 'postgraduate', 'Supply Chain & Operations Management', '2 years', 'Full-time'],
  ],

  /* INTERDISCIPLINARY */
  'Climate Change & Sustainability': [
    ['B.Sc.', 'undergraduate', 'Climate Change & Sustainability', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Climate Change & Sustainability', '2 years', 'Full-time'],
  ],
  'Energy Studies': [
    ['B.Sc.', 'undergraduate', 'Energy Studies', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Energy Studies', '2 years', 'Full-time'],
  ],
  'Entrepreneurship & Innovation': [
    ['M.Sc.', 'postgraduate', 'Entrepreneurship & Innovation', '2 years', 'Full-time'],
  ],
  'Peace & Conflict Studies': [
    ['B.Sc.', 'undergraduate', 'Peace & Conflict Studies', '4 years', 'Full-time'],
    ['M.Sc.', 'postgraduate', 'Peace & Conflict Studies', '2 years', 'Full-time'],
  ],
  'Artificial Intelligence & Society': [
    ['M.Sc.', 'postgraduate', 'Artificial Intelligence & Society', '2 years', 'Full-time'],
  ],
  'Digital Transformation': [
    ['M.Sc.', 'postgraduate', 'Digital Transformation', '2 years', 'Full-time'],
    ['M.Sc.', 'online', 'Digital Transformation (Online)', '2 years', 'Online'],
  ],
};

/* ----------------------------------------------------------------
   Main seeder
   ---------------------------------------------------------------- */
(async () => {
  try {
    await connectDB();
    console.log('\n--- Seeding faculties, departments, and programmes ---\n');

    // Reset optional: uncomment to wipe first
    // await Programme.deleteMany({});
    // await Department.deleteMany({});
    // await Faculty.deleteMany({});

    const facultyMap = {}; // slug -> _id
    const deptMap = {};    // "facultySlug/deptName" -> _id

    /* 1. Faculties */
    for (const f of FACULTIES) {
      const doc = await Faculty.findOneAndUpdate(
        { slug: f.slug },
        {
          name: f.name,
          slug: f.slug,
          shortName: f.shortName,
          icon: f.icon,
          description: f.description,
          established: 2018,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      facultyMap[f.slug] = doc._id;
    }
    console.log(`✓ ${FACULTIES.length} faculties upserted`);

    /* 2. Departments */
    let deptCount = 0;
    for (const [facultySlug, depts] of Object.entries(DEPARTMENTS)) {
      for (const name of depts) {
        const slug = slugify(name);
        const doc = await Department.findOneAndUpdate(
          { slug, faculty: facultyMap[facultySlug] },
          {
            name,
            slug,
            faculty: facultyMap[facultySlug],
            code: name.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'DEP',
            description: `The Department of ${name} at Kelvin Ikpeni University.`,
            isActive: true,
          },
          { upsert: true, new: true }
        );
        deptMap[`${facultySlug}/${name}`] = doc._id;
        deptCount++;
      }
    }
    console.log(`✓ ${deptCount} departments upserted`);

    /* 3. Programmes */
    let progCount = 0;
    let featuredSet = 0;

    for (const [facultySlug, depts] of Object.entries(DEPARTMENTS)) {
      for (const deptName of depts) {
        const list = PROGRAMMES[deptName] || [];
        const deptId = deptMap[`${facultySlug}/${deptName}`];
        if (!deptId) continue;

        for (const [degree, level, name, duration, mode] of list) {
          const slug = slugify(`${degree}-${name}`.replace(/\./g, ''));
          const isFeatured = featuredSet < 12 && level === 'undergraduate';
          if (isFeatured) featuredSet++;

          await Programme.findOneAndUpdate(
            { slug },
            {
              name,
              slug,
              degree,
              level,
              faculty: facultyMap[facultySlug],
              department: deptId,
              duration,
              mode,
              description: `${degree} ${name} — a ${level} programme at Kelvin Ikpeni University designed to prepare graduates for meaningful careers and further study.`,
              overview: `The ${degree} ${name} programme combines rigorous academic training with practical experience, preparing graduates for impactful careers in their field.\n\nDelivered by experienced faculty, the programme includes foundational coursework, advanced electives, and a final-year project or research component.`,
              entryRequirements: level === 'undergraduate'
                ? [
                    'Five (5) O\'Level credits including English Language and Mathematics',
                    'Relevant subjects for the chosen programme',
                    'Acceptable UTME/JAMB score',
                  ]
                : [
                    'Bachelor\'s degree from a recognized university',
                    'Minimum of Second Class Lower (2:2) or equivalent',
                    'Academic transcripts',
                  ],
              careerProspects: [
                'Industry roles in the private sector',
                'Public sector and government positions',
                'Entrepreneurship and consulting',
                'Postgraduate research and academia',
              ],
              tuitionPerYear: level === 'undergraduate' ? 750000 : level === 'postgraduate' ? 1200000 : 500000,
              tuitionCurrency: 'NGN',
              accreditation: 'NUC Accredited',
              isFeatured,
              isActive: true,
            },
            { upsert: true, new: true }
          );
          progCount++;
        }
      }
    }
    console.log(`✓ ${progCount} programmes upserted`);
    console.log('\nDone.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();