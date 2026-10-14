/**
 * utils/constants.js
 * Application-wide enums and constants.
 */
module.exports = {
  ROLES: Object.freeze({
    ADMIN: 'admin',
    LECTURER: 'lecturer',
    STUDENT: 'student',
    APPLICANT: 'applicant',
  }),

  APPLICATION_STATUS: Object.freeze({
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  }),

  PROGRAMME_LEVELS: Object.freeze({
    UNDERGRADUATE: 'undergraduate',
    POSTGRADUATE: 'postgraduate',
    ONLINE: 'online',
  }),

  DEGREE_TYPES: Object.freeze({
    BSC: 'B.Sc.',
    BA: 'B.A.',
    BENG: 'B.Eng.',
    LLB: 'LL.B.',
    MSC: 'M.Sc.',
    MA: 'M.A.',
    MBA: 'MBA',
    PHD: 'Ph.D.',
  }),

  SEMESTERS: Object.freeze({
    FIRST: 'First',
    SECOND: 'Second',
  }),

  GRADE_SCALE: Object.freeze({
    A: 5.0,
    B: 4.0,
    C: 3.0,
    D: 2.0,
    E: 1.0,
    F: 0.0,
  }),
};