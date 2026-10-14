/**
 * models/index.js
 * Central export for all models.
 */
module.exports = {
  User: require('./User'),
  Faculty: require('./Faculty'),
  Department: require('./Department'),
  Programme: require('./Programme'),
  Application: require('./Application'),
  Course: require('./Course'),
  Result: require('./Result'),
  Announcement: require('./Announcement'),
  News: require('./News'),
  Event: require('./Event'),
  ContactMessage: require('./ContactMessage'),
  Subscriber: require('./Subscriber'),
};