/**
 * public/js/auth-pages.js
 * Login, register, profile, forgot password, and reset password logic.
 */
(function () {
  'use strict';

  const page = document.body.dataset.page;
  const api = window.API;
  const Auth = window.Auth;
  const toast = (msg, type) => window.UI && window.UI.toast && window.UI.toast(msg, type);

  /* Password toggles */
  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.password-wrap');
        const input = wrap && wrap.querySelector('input');
        if (!input) return;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.innerHTML = isText ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
      });
    });
  }

  /* ==================================================
     LOGIN
     ================================================== */
  function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn = document.getElementById('loginBtn');

      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';

      const res = await Auth.login(email, password);

      btn.disabled = false;
      btn.innerHTML = original;

      if (!res.success) {
        toast(res.message || 'Login failed.', 'error');
        return;
      }

      toast('Signed in successfully.', 'success');
      const role = res.data.user.role;
      const dest = {
        admin: '/pages/admin-dashboard.html',
        lecturer: '/pages/lecturer-dashboard.html',
        student: '/pages/student-dashboard.html',
        applicant: '/pages/applicant-dashboard.html',
      }[role] || '/';
      setTimeout(() => { window.location.href = dest; }, 600);
    });
  }

  /* ==================================================
     REGISTER
     ================================================== */
  function initRegisterPage() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;

      if (password !== confirm) {
        toast('Passwords do not match.', 'error');
        return;
      }

      const data = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password,
      };

      const btn = document.getElementById('registerBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating account…';

      const res = await Auth.register(data);

      btn.disabled = false;
      btn.innerHTML = original;

      if (!res.success) {
        const msg = res.details?.length
          ? res.details.map((d) => d.message).join(', ')
          : (res.message || 'Registration failed.');
        toast(msg, 'error');
        return;
      }

      toast('Account created. Redirecting…', 'success');
      setTimeout(() => { window.location.href = '/pages/applicant-dashboard.html'; }, 700);
    });
  }

  /* ==================================================
     PROFILE
     ================================================== */
  async function initProfilePage() {
    const body = document.getElementById('profileBody');
    const loading = document.getElementById('profileLoading');
    if (!body) return;

    const user = await Auth.loadUser();
    if (!user) { window.location.href = '/pages/login.html'; return; }

    loading.classList.add('hidden');
    body.classList.remove('hidden');

    document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role;
    document.getElementById('profileInitial').textContent = (user.firstName || 'U').charAt(0).toUpperCase();

    document.getElementById('pFirstName').value = user.firstName || '';
    document.getElementById('pLastName').value = user.lastName || '';
    document.getElementById('pPhone').value = user.phone || '';
    document.getElementById('pGender').value = user.gender || '';
    document.getElementById('pNationality').value = user.nationality || 'Nigerian';
    if (user.dateOfBirth) {
      document.getElementById('pDob').value = new Date(user.dateOfBirth).toISOString().slice(0, 10);
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('saveProfileBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving…';

      const res = await api.auth.updateMe({
        firstName: document.getElementById('pFirstName').value.trim(),
        lastName: document.getElementById('pLastName').value.trim(),
        phone: document.getElementById('pPhone').value.trim(),
        gender: document.getElementById('pGender').value,
        nationality: document.getElementById('pNationality').value.trim(),
        dateOfBirth: document.getElementById('pDob').value || undefined,
      });

      btn.disabled = false;
      btn.innerHTML = original;
      toast(res.success ? 'Profile updated.' : (res.message || 'Update failed.'), res.success ? 'success' : 'error');
      if (res.success) {
        document.getElementById('profileName').textContent = `${res.data.user.firstName} ${res.data.user.lastName}`;
      }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const cur = document.getElementById('curPass').value;
      const neu = document.getElementById('newPass').value;
      const conf = document.getElementById('confirmNewPass').value;

      if (neu !== conf) { toast('New passwords do not match.', 'error'); return; }

      const btn = document.getElementById('changePassBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Updating…';

      const res = await api.auth.changePassword({ currentPassword: cur, newPassword: neu });

      btn.disabled = false;
      btn.innerHTML = original;

      if (res.success) {
        toast('Password changed successfully.', 'success');
        document.getElementById('passwordForm').reset();
      } else {
        toast(res.message || 'Password change failed.', 'error');
      }
    });
  }

  /* ==================================================
     FORGOT PASSWORD
     ================================================== */
  function initForgotPasswordPage() {
    const form = document.getElementById('forgotForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const btn = document.getElementById('forgotBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sending…';

      const res = await api.post('/auth/forgot-password', { email });

      btn.disabled = false;
      btn.innerHTML = original;

      if (!res.success) {
        toast(res.message || 'Request failed.', 'error');
        return;
      }

      toast('If that email exists, reset instructions have been sent.', 'success');

      // Show the token in dev so the flow can be tested without email
      if (res.data && res.data.resetToken) {
        const panel = document.getElementById('resetPanel');
        panel.classList.remove('hidden');
        document.getElementById('resetToken').textContent = res.data.resetToken;
        const resetLink = document.getElementById('resetLink');
        resetLink.href = `/pages/reset-password.html?token=${encodeURIComponent(res.data.resetToken)}`;
      }
    });
  }

  /* ==================================================
     RESET PASSWORD
     ================================================== */
  function initResetPasswordPage() {
    const form = document.getElementById('resetForm');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      toast('Missing or invalid reset token.', 'error');
      setTimeout(() => { window.location.href = '/pages/forgot-password.html'; }, 1500);
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;

      if (password !== confirm) {
        toast('Passwords do not match.', 'error');
        return;
      }

      const btn = document.getElementById('resetBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Resetting…';

      const res = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });

      btn.disabled = false;
      btn.innerHTML = original;

      if (!res.success) {
        toast(res.message || 'Reset failed. The token may have expired.', 'error');
        return;
      }

      toast('Password reset successfully. Redirecting…', 'success');
      setTimeout(() => { window.location.href = '/pages/login.html'; }, 900);
    });
  }

  /* ==================================================
     ROUTER
     ================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    if (page === 'login') initLoginPage();
    if (page === 'register') initRegisterPage();
    if (page === 'profile') initProfilePage();
    if (page === 'forgot-password') initForgotPasswordPage();
    if (page === 'reset-password') initResetPasswordPage();
  });
})();