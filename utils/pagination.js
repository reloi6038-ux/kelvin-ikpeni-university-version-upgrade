/**
 * utils/pagination.js
 * Parses ?page & ?limit and returns Mongoose-friendly options.
 *
 * The `limit` is capped at 1000 so a single request can return the full
 * catalogue (universities rarely exceed that, and this keeps memory use
 * bounded on the server). Any client requesting more than 1000 gets 1000.
 */
const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limitRaw = parseInt(query.limit, 10) || 20;
  const limit = Math.min(Math.max(limitRaw, 1), 1000); // cap at 1000
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit) || 1,
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { getPagination, buildMeta };