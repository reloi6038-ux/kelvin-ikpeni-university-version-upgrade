/**
 * utils/reference.js
 * Generates a unique application reference like KIU-2026-AB12CD.
 */
const generateReference = () => {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KIU-${year}-${rand}`;
};

module.exports = generateReference;