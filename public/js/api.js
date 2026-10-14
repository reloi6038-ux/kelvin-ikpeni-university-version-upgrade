/**
 * public/js/api.js
 * Thin fetch wrapper for the Kelvin Ikpeni University API.
 * All requests include cookies. Errors are normalised into
 * { success:false, message, details? } so callers can rely on a shape.
 */
(function () {
  'use strict';

  const BASE = '/api';

  async function request(path, options = {}) {
    const url = path.startsWith('http') ? path : BASE + path;

    const opts = {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.headers || {}),
      },
      method: options.method || 'GET',
    };

    if (options.body !== undefined) {
      opts.body =
        options.body instanceof FormData ? options.body : JSON.stringify(options.body);
    }

    let res;
    try {
      res = await fetch(url, opts);
    } catch (networkErr) {
      return { success: false, message: 'Network error. Check your connection.', status: 0 };
    }

    let payload = {};
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { payload = await res.json(); } catch (_) { payload = {}; }
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: payload.message || `Request failed (${res.status})`,
        details: payload.details || null,
      };
    }

    return payload;
  }

  const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),

    /* Convenience wrappers for common endpoints */
    auth: {
      register: (data) => api.post('/auth/register', data),
      login: (data) => api.post('/auth/login', data),
      logout: () => api.post('/auth/logout'),
      me: () => api.get('/auth/me'),
      updateMe: (data) => api.put('/auth/me', data),
      changePassword: (data) => api.put('/auth/change-password', data),
    },

    public: {
      faculties: () => api.get('/public/faculties'),
      faculty: (slug) => api.get(`/public/faculties/${slug}`),
      departments: (qs = '') => api.get('/public/departments' + qs),
      department: (slug) => api.get(`/public/departments/${slug}`),
      programmes: (qs = '') => api.get('/public/programmes' + qs),
      programme: (slug) => api.get(`/public/programmes/${slug}`),
      news: (qs = '') => api.get('/public/news' + qs),
      newsItem: (slug) => api.get(`/public/news/${slug}`),
      events: (qs = '') => api.get('/public/events' + qs),
      event: (slug) => api.get(`/public/events/${slug}`),
      announcements: (qs = '') => api.get('/public/announcements' + qs),
      search: (q) => api.get('/public/search?q=' + encodeURIComponent(q)),
      contact: (data) => api.post('/public/contact', data),
      subscribe: (data) => api.post('/public/subscribe', data),
    },

    applications: {
      submit: (data) => api.post('/applications', data),
      status: (ref) => api.get(`/applications/status/${encodeURIComponent(ref)}`),
      mine: () => api.get('/applications/my'),
    },

    student: {
      dashboard: () => api.get('/student/dashboard'),
      availableCourses: () => api.get('/student/courses/available'),
      registerCourses: (courseIds) => api.post('/student/courses/register', { courseIds }),
      dropCourse: (id) => api.del(`/student/courses/${id}`),
      results: (qs = '') => api.get('/student/results' + qs),
    },

    lecturer: {
      dashboard: () => api.get('/lecturer/dashboard'),
      courses: () => api.get('/lecturer/courses'),
      students: (courseId) => api.get(`/lecturer/courses/${courseId}/students`),
      uploadResults: (data) => api.post('/lecturer/results', data),
      publishResult: (id) => api.put(`/lecturer/results/${id}/publish`),
    },

    admin: {
      stats: () => api.get('/admin/stats'),
      users: (qs = '') => api.get('/admin/users' + qs),
      user: (id) => api.get(`/admin/users/${id}`),
      updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
      deleteUser: (id) => api.del(`/admin/users/${id}`),
      applications: (qs = '') => api.get('/admin/applications' + qs),
      application: (id) => api.get(`/admin/applications/${id}`),
      updateApplication: (id, data) => api.put(`/admin/applications/${id}/status`, data),
      createFaculty: (data) => api.post('/admin/faculties', data),
      updateFaculty: (id, data) => api.put(`/admin/faculties/${id}`, data),
      deleteFaculty: (id) => api.del(`/admin/faculties/${id}`),
      createDepartment: (data) => api.post('/admin/departments', data),
      updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
      deleteDepartment: (id) => api.del(`/admin/departments/${id}`),
      createProgramme: (data) => api.post('/admin/programmes', data),
      updateProgramme: (id, data) => api.put(`/admin/programmes/${id}`, data),
      deleteProgramme: (id) => api.del(`/admin/programmes/${id}`),
      createNews: (data) => api.post('/admin/news', data),
      updateNews: (id, data) => api.put(`/admin/news/${id}`, data),
      deleteNews: (id) => api.del(`/admin/news/${id}`),
      createEvent: (data) => api.post('/admin/events', data),
      updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
      deleteEvent: (id) => api.del(`/admin/events/${id}`),
      createAnnouncement: (data) => api.post('/admin/announcements', data),
      updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
      deleteAnnouncement: (id) => api.del(`/admin/announcements/${id}`),
      contacts: (qs = '') => api.get('/admin/contacts' + qs),
      markContactRead: (id) => api.put(`/admin/contacts/${id}/read`),
      subscribers: (qs = '') => api.get('/admin/subscribers' + qs),
    },
  };

  window.API = api;
})();