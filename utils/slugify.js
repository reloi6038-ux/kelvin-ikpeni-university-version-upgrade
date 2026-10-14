/**
 * utils/slugify.js
 * Turns "B.Sc. Computer Science" into "bsc-computer-science".
 */
const slugify = (str = '') =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

module.exports = slugify;