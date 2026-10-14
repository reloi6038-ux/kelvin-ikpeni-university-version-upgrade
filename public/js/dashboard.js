/**
 * public/js/dashboard.js
 * Student, lecturer, admin, and applicant dashboards.
 */
(function () {
  'use strict';

  const page = document.body.dataset.page;
  const api = window.API;
  const Auth = window.Auth;
  const toast = (msg, type) => window.UI && window.UI.toast && window.UI.toast(msg, type);

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const STATUS_COLORS = {
    submitted: 'badge--info',
    under_review: 'badge--warning',
    offered: 'badge--success',
    accepted: 'badge--success',
    rejected: 'badge--danger',
    withdrawn: 'badge--purple',
  };
  const STATUS_LABELS = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    offered: 'Offer Extended',
    accepted: 'Accepted',
    rejected: 'Not Successful',
    withdrawn: 'Withdrawn',
  };

  async function requireRole(...roles) {
    const user = await Auth.loadUser();
    if (!user) {
      window.location.href = '/pages/login.html';
      return null;
    }
    if (roles.length && !roles.includes(user.role)) {
      toast('You do not have access to that page.', 'error');
      setTimeout(() => { window.location.href = '/pages/portal.html'; }, 800);
      return null;
    }
    return user;
  }

  /* =================================================
     STUDENT DASHBOARD
     ================================================= */
  async function initStudentDashboard() {
    const user = await requireRole('student');
    if (!user) return;
    document.getElementById('welcomeName').textContent = `Welcome, ${user.firstName}`;

    const res = await api.student.dashboard();
    document.getElementById('studentLoading').classList.add('hidden');
    document.getElementById('studentBody').classList.remove('hidden');

    if (!res.success) {
      document.getElementById('studentStats').innerHTML = `<p class="text-muted">Failed to load dashboard.</p>`;
      return;
    }

    const { student, recentResults, cgpa, totalUnits } = res.data;

    // Stats
    document.getElementById('studentStats').innerHTML = `
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-brand);color:#fff;">
        <div class="stat__number">${cgpa.toFixed(2)}</div>
        <div class="stat__label">CGPA</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-gold);color:var(--color-primary-dark);">
        <div class="stat__number" style="color:var(--color-primary-dark);">${totalUnits}</div>
        <div class="stat__label" style="color:var(--color-primary-dark);">Credit Units</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--color-surface);">
        <div class="stat__number" style="color:var(--color-primary);">${student.registeredCourses?.length || 0}</div>
        <div class="stat__label" style="color:var(--color-text-muted);">Registered Courses</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--color-surface);">
        <div class="stat__number" style="color:var(--color-primary);">Level ${student.level || '—'}</div>
        <div class="stat__label" style="color:var(--color-text-muted);">Current Level</div>
      </div>
    `;

    // Academic info
    document.getElementById('academicInfo').innerHTML = `
      <li><strong>Matric No:</strong> ${esc(student.matricNumber || 'Pending')}</li>
      <li><strong>Programme:</strong> ${esc(student.programme?.name || 'N/A')}</li>
      <li><strong>Department:</strong> ${esc(student.department?.name || 'N/A')}</li>
      <li><strong>Faculty:</strong> ${esc(student.faculty?.name || 'N/A')}</li>
      <li><strong>Status:</strong> <span class="badge badge--success">${esc(student.status || 'active')}</span></li>
    `;

    // Registered courses
    const rc = student.registeredCourses || [];
    document.getElementById('registeredCoursesList').innerHTML = rc.length
      ? `<div class="grid grid--2" style="gap:var(--space-3);">${rc.map((c) => `
          <div class="card" style="padding:var(--space-4);">
            <strong>${esc(c.code)}</strong>
            <div style="font-size:var(--fs-sm);">${esc(c.title)}</div>
            <div class="text-muted" style="font-size:var(--fs-xs);margin-top:.35rem;">${esc(c.creditUnits)} units · ${esc(c.semester || '')}</div>
          </div>`).join('')}</div>`
      : '<p class="text-muted">You have no registered courses yet. Click "Register Courses" to begin.</p>';

    // Results
    document.getElementById('resultsList').innerHTML = recentResults.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:var(--fs-sm);">
          <thead><tr style="border-bottom:2px solid var(--color-border);text-align:left;">
            <th style="padding:.75rem 0;">Course</th><th>Score</th><th>Grade</th>
          </tr></thead>
          <tbody>${recentResults.map((r) => `
            <tr style="border-bottom:1px solid var(--color-border);">
              <td style="padding:.75rem 0;"><strong>${esc(r.course?.code)}</strong> — ${esc(r.course?.title)}</td>
              <td style="padding:.75rem 0;">${r.totalScore ?? '—'}</td>
              <td style="padding:.75rem 0;"><span class="badge badge--accent">${esc(r.grade || '—')}</span></td>
            </tr>`).join('')}</tbody>
        </table>`
      : '<p class="text-muted">No published results yet.</p>';

    // Register courses modal
    const modal = document.getElementById('registerModal');
    const openBtn = document.getElementById('openRegisterCourses');
    const closeBtn = document.getElementById('closeRegisterModal');
    const cancelBtn = document.getElementById('cancelRegisterCourses');
    const submitBtn = document.getElementById('submitRegisterCourses');
    const availableList = document.getElementById('availableCoursesList');
    let available = [];

    const openModal = async () => {
      modal.classList.remove('hidden');
      availableList.innerHTML = '<div class="loading-state"><span class="spinner spinner--dark"></span></div>';
      const r = await api.student.availableCourses();
      available = r.success ? r.data.courses : [];
      if (!available.length) {
        availableList.innerHTML = '<p class="text-muted">No courses available for your level and department.</p>';
        return;
      }
      availableList.innerHTML = available.map((c) => `
        <label class="form-check" style="padding:.65rem 0;border-bottom:1px solid var(--color-border);">
          <input type="checkbox" value="${c._id}" />
          <span><strong>${esc(c.code)}</strong> — ${esc(c.title)} <span class="text-muted">(${esc(c.creditUnits)} units)</span></span>
        </label>`).join('');
    };

    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn?.addEventListener('click', () => modal.classList.add('hidden'));

    submitBtn?.addEventListener('click', async () => {
      const ids = Array.from(availableList.querySelectorAll('input:checked')).map((i) => i.value);
      if (!ids.length) {
        toast('Select at least one course.', 'warning');
        return;
      }
      const r = await api.student.registerCourses(ids);
      if (r.success) {
        toast('Courses registered successfully.', 'success');
        modal.classList.add('hidden');
        setTimeout(() => window.location.reload(), 700);
      } else {
        toast(r.message || 'Registration failed.', 'error');
      }
    });
  }

  /* =================================================
     LECTURER DASHBOARD
     ================================================= */
  async function initLecturerDashboard() {
    const user = await requireRole('lecturer', 'admin');
    if (!user) return;
    document.getElementById('welcomeName').textContent = `Welcome, ${user.firstName}`;

    const res = await api.lecturer.dashboard();
    document.getElementById('lecturerLoading').classList.add('hidden');
    document.getElementById('lecturerBody').classList.remove('hidden');

    if (!res.success) {
      document.getElementById('coursesList').innerHTML = '<p class="text-muted">Failed to load courses.</p>';
      return;
    }

    const { courses, totalStudents } = res.data;

    document.getElementById('lecturerStats').innerHTML = `
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-brand);color:#fff;">
        <div class="stat__number">${courses.length}</div>
        <div class="stat__label">Courses</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-gold);color:var(--color-primary-dark);">
        <div class="stat__number" style="color:var(--color-primary-dark);">${totalStudents}</div>
        <div class="stat__label" style="color:var(--color-primary-dark);">Enrolled Students</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--color-surface);">
        <div class="stat__number" style="color:var(--color-primary);">—</div>
        <div class="stat__label" style="color:var(--color-text-muted);">Pending Results</div>
      </div>
    `;

    document.getElementById('coursesList').innerHTML = courses.length
      ? `<div class="grid grid--2" style="gap:var(--space-4);">${courses.map((c) => `
          <div class="card" style="padding:var(--space-5);">
            <div class="flex justify-between items-start">
              <div>
                <span class="badge badge--purple">${esc(c.level)} Level</span>
                <h4 style="margin-top:.5rem;margin-bottom:.25rem;">${esc(c.code)} — ${esc(c.title)}</h4>
                <p class="text-muted" style="font-size:var(--fs-sm);margin:0;">${esc(c.creditUnits)} units · ${esc(c.semester)} semester</p>
              </div>
            </div>
            <div class="mt-4 flex gap-2 flex-wrap">
              <button class="btn btn--ghost btn--sm" data-view-students="${c._id}"><i class="fas fa-users"></i> Students</button>
              <button class="btn btn--ghost btn--sm" data-upload-results="${c._id}"><i class="fas fa-upload"></i> Upload Results</button>
            </div>
          </div>`).join('')}</div>`
      : '<p class="text-muted">You have no assigned courses yet.</p>';

    // Simple stub for buttons (can be expanded)
    document.querySelectorAll('[data-view-students]').forEach((b) => {
      b.addEventListener('click', async () => {
        const r = await api.lecturer.students(b.dataset.viewStudents);
        if (!r.success) { toast(r.message || 'Failed', 'error'); return; }
        const list = r.data.students.map((s) => `${s.firstName} ${s.lastName} (${s.matricNumber || 'N/A'})`).join('\n');
        alert(`Students in course:\n\n${list || 'No students registered.'}`);
      });
    });
  }

  /* =================================================
     ADMIN DASHBOARD
     ================================================= */
  async function initAdminDashboard() {
    const user = await requireRole('admin');
    if (!user) return;
    document.getElementById('welcomeName').textContent = `Admin Dashboard`;

    const res = await api.admin.stats();
    document.getElementById('adminLoading').classList.add('hidden');
    document.getElementById('adminBody').classList.remove('hidden');

    if (!res.success) {
      document.getElementById('adminStats').innerHTML = '<p class="text-muted">Failed to load stats.</p>';
      return;
    }

    const { stats, recentApplications, recentUsers } = res.data;

    document.getElementById('adminStats').innerHTML = `
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-brand);color:#fff;">
        <div class="stat__number">${stats.users.total}</div>
        <div class="stat__label">Total Users</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-gold);color:var(--color-primary-dark);">
        <div class="stat__number" style="color:var(--color-primary-dark);">${stats.applications.total}</div>
        <div class="stat__label" style="color:var(--color-primary-dark);">Applications</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-emerald);color:#fff;">
        <div class="stat__number">${stats.academics.programmes}</div>
        <div class="stat__label">Programmes</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--color-surface);">
        <div class="stat__number" style="color:var(--color-primary);">${stats.applications.pending}</div>
        <div class="stat__label" style="color:var(--color-text-muted);">Pending Review</div>
      </div>
    `;

    document.getElementById('recentApplications').innerHTML = recentApplications.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:var(--fs-sm);">
          <thead><tr style="border-bottom:2px solid var(--color-border);text-align:left;">
            <th style="padding:.75rem 0;">Ref</th><th>Applicant</th><th>Programme</th><th>Status</th>
          </tr></thead>
          <tbody>${recentApplications.map((a) => `
            <tr style="border-bottom:1px solid var(--color-border);">
              <td style="padding:.75rem 0;font-family:var(--font-mono);font-size:.75rem;">${esc(a.referenceNumber)}</td>
              <td style="padding:.75rem 0;">${esc(a.firstName)} ${esc(a.lastName)}</td>
              <td style="padding:.75rem 0;">${esc(a.programme?.name || 'N/A')}</td>
              <td style="padding:.75rem 0;"><span class="badge ${STATUS_COLORS[a.status] || 'badge--info'}">${esc(STATUS_LABELS[a.status] || a.status)}</span></td>
            </tr>`).join('')}</tbody>
        </table>`
      : '<p class="text-muted">No applications yet.</p>';

    document.getElementById('recentUsers').innerHTML = recentUsers.length
      ? recentUsers.map((u) => `
          <div class="flex justify-between items-center" style="padding:.75rem 0;border-bottom:1px solid var(--color-border);">
            <div>
              <strong>${esc(u.firstName)} ${esc(u.lastName)}</strong>
              <div class="text-muted" style="font-size:var(--fs-xs);">${esc(u.email)}</div>
            </div>
            <span class="badge badge--purple">${esc(u.role)}</span>
          </div>`).join('')
      : '<p class="text-muted">No users yet.</p>';
  }

  /* =================================================
     APPLICANT DASHBOARD
     ================================================= */
  async function initApplicantDashboard() {
    const user = await requireRole('applicant', 'student');
    if (!user) return;
    document.getElementById('welcomeName').textContent = `Welcome, ${user.firstName}`;

    const res = await api.applications.mine();
    document.getElementById('applicantLoading').classList.add('hidden');
    document.getElementById('applicantBody').classList.remove('hidden');

    if (!res.success) {
      document.getElementById('applicationsList').innerHTML = '<p class="text-muted">Failed to load applications.</p>';
      return;
    }

    const apps = res.data.applications;
    const counts = {
      total: apps.length,
      pending: apps.filter((a) => ['submitted', 'under_review'].includes(a.status)).length,
      offered: apps.filter((a) => ['offered', 'accepted'].includes(a.status)).length,
    };

    document.getElementById('applicantStats').innerHTML = `
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-brand);color:#fff;">
        <div class="stat__number">${counts.total}</div>
        <div class="stat__label">Total Applications</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-gold);color:var(--color-primary-dark);">
        <div class="stat__number" style="color:var(--color-primary-dark);">${counts.pending}</div>
        <div class="stat__label" style="color:var(--color-primary-dark);">In Progress</div>
      </div>
      <div class="stat card" style="padding:var(--space-5);background:var(--gradient-emerald);color:#fff;">
        <div class="stat__number">${counts.offered}</div>
        <div class="stat__label">Offers Received</div>
      </div>
    `;

    document.getElementById('applicationsList').innerHTML = apps.length
      ? apps.map((a) => `
          <div class="card mb-4" style="padding:var(--space-5);">
            <div class="flex justify-between items-start flex-wrap gap-3">
              <div>
                <div style="font-family:var(--font-mono);font-size:var(--fs-sm);color:var(--color-text-muted);letter-spacing:.05em;">${esc(a.referenceNumber)}</div>
                <h4 style="margin-top:.25rem;margin-bottom:.25rem;">${esc(a.programme?.degree || '')} ${esc(a.programme?.name || '')}</h4>
                <p class="text-muted" style="font-size:var(--fs-sm);margin:0;">Submitted ${new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <span class="badge ${STATUS_COLORS[a.status] || 'badge--info'}" style="padding:.5rem 1rem;">${esc(STATUS_LABELS[a.status] || a.status)}</span>
            </div>
          </div>`).join('')
      : `<div class="text-center" style="padding:var(--space-7);">
          <div style="font-size:3rem;color:var(--color-text-muted);"><i class="fas fa-file-circle-plus"></i></div>
          <h3 class="mt-4">No applications yet</h3>
          <p class="text-muted mt-2">Start your journey by submitting your first application.</p>
          <a href="/pages/apply.html" class="btn btn--accent mt-5"><i class="fas fa-plus"></i> Apply Now</a>
        </div>`;
  }

  /* =================================================
     ROUTER
     ================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    if (page === 'student-dashboard') initStudentDashboard();
    if (page === 'lecturer-dashboard') initLecturerDashboard();
    if (page === 'admin-dashboard') initAdminDashboard();
    if (page === 'applicant-dashboard') initApplicantDashboard();
  });
})();