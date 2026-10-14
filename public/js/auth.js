/**
 * public/js/auth.js
 * Client-side session helpers built on top of API.auth.
 * Session state is fetched from the server (/api/auth/me) — we never
 * trust localStorage for roles or user info.
 */
(function () {
  'use strict';

  let currentUser = null;
  let loaded = false;

  async function loadUser() {
    if (loaded) return currentUser;
    const res = await window.API.auth.me();
    currentUser = res && res.success ? res.data.user : null;
    loaded = true;
    return currentUser;
  }

  async function login(email, password) {
    const res = await window.API.auth.login({ email, password });
    if (res.success) {
      currentUser = res.data.user;
      loaded = true;
    }
    return res;
  }

  async function register(data) {
    const res = await window.API.auth.register(data);
    if (res.success) {
      currentUser = res.data.user;
      loaded = true;
    }
    return res;
  }

  async function logout() {
    await window.API.auth.logout();
    currentUser = null;
    loaded = true;
  }

  function getUser() { return currentUser; }
  function isLoggedIn() { return !!currentUser; }
  function hasRole(...roles) { return currentUser && roles.includes(currentUser.role); }

  /* Update the header login/register UI based on session state */
  async function renderHeaderAuth() {
    const user = await loadUser();
    const container = document.querySelector('[data-auth-actions]');
    if (!container) return;

    if (!user) {
      container.innerHTML = `
        <a href="/pages/login.html" class="btn btn--ghost btn--sm">Sign In</a>
        <a href="/pages/register.html" class="btn btn--primary btn--sm">Apply Now</a>
      `;
      return;
    }

    const initial = (user.firstName || 'U').charAt(0).toUpperCase();
    const dashboardPath = {
      admin: '/pages/admin-dashboard.html',
      lecturer: '/pages/lecturer-dashboard.html',
      student: '/pages/student-dashboard.html',
      applicant: '/pages/applicant-dashboard.html',
    }[user.role] || '/pages/login.html';

    container.innerHTML = `
      <div class="nav-item has-dropdown" style="position:relative;">
        <button class="nav-link" type="button" style="display:flex;align-items:center;gap:.5rem;">
          <span class="logo__crest" style="width:32px;height:32px;font-size:.8rem;">${initial}</span>
          <span style="font-weight:600;">${user.firstName}</span>
        </button>
        <div class="nav-dropdown">
          <a href="${dashboardPath}"><i class="fas fa-gauge"></i> Dashboard</a>
          <a href="/pages/profile.html"><i class="fas fa-user"></i> My Profile</a>
          <a href="#" data-logout><i class="fas fa-right-from-bracket"></i> Sign Out</a>
        </div>
      </div>
    `;

    container.querySelector('[data-logout]').addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = '/';
    });
  }

  window.Auth = { loadUser, login, register, logout, getUser, isLoggedIn, hasRole, renderHeaderAuth };
})();