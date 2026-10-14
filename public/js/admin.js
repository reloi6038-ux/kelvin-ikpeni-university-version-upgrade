/**
 * public/js/admin.js
 * Admin CRUD for users, applications, content, announcements.
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
    offered: 'Offered',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  async function requireAdmin() {
    const user = await Auth.loadUser();
    if (!user) { window.location.href = '/pages/login.html'; return null; }
    if (user.role !== 'admin') {
      toast('Admin access required.', 'error');
      setTimeout(() => { window.location.href = '/pages/portal.html'; }, 800);
      return null;
    }
    return user;
  }

  /* ==================================================
     ADMIN USERS
     ================================================== */
  async function initAdminUsers() {
    if (!(await requireAdmin())) return;

    const tbody = document.getElementById('usersTbody');
    const search = document.getElementById('userSearch');
    const roleSel = document.getElementById('userRole');
    const statusSel = document.getElementById('userStatus');
    const countEl = document.getElementById('usersCount');
    const pagination = document.getElementById('usersPagination');

    let page = 1;
    const perPage = 20;

    const load = async () => {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:var(--space-7);text-align:center;"><span class="spinner spinner--dark"></span></td></tr>';
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', perPage);
      if (search.value.trim()) params.set('q', search.value.trim());
      if (roleSel.value) params.set('role', roleSel.value);
      if (statusSel.value) params.set('status', statusSel.value);

      const res = await api.admin.users('?' + params.toString());
      if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:var(--space-5);text-align:center;" class="text-muted">Failed to load users.</td></tr>`;
        return;
      }

      const users = res.data.users;
      countEl.textContent = `${res.meta.total} user${res.meta.total === 1 ? '' : 's'}`;

      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:var(--space-5);text-align:center;" class="text-muted">No users match your filters.</td></tr>`;
        pagination.innerHTML = '';
        return;
      }

      tbody.innerHTML = users.map((u) => `
        <tr style="border-bottom:1px solid var(--color-border);">
          <td style="padding:.75rem 1rem;"><strong>${esc(u.firstName)} ${esc(u.lastName)}</strong></td>
          <td style="padding:.75rem 1rem;">${esc(u.email)}</td>
          <td style="padding:.75rem 1rem;"><span class="badge badge--purple">${esc(u.role)}</span></td>
          <td style="padding:.75rem 1rem;">
            <span class="badge ${u.status === 'active' ? 'badge--success' : u.status === 'suspended' ? 'badge--danger' : 'badge--warning'}">${esc(u.status || 'active')}</span>
          </td>
          <td style="padding:.75rem 1rem;color:var(--color-text-muted);font-size:var(--fs-xs);">
            ${new Date(u.createdAt).toLocaleDateString()}
          </td>
          <td style="padding:.75rem 1rem;text-align:right;">
            <button class="btn btn--ghost btn--sm" data-edit-user="${u._id}"><i class="fas fa-pen"></i></button>
            <button class="btn btn--ghost btn--sm" data-delete-user="${u._id}"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-edit-user]').forEach((b) =>
        b.addEventListener('click', () => openEditUser(b.dataset.editUser))
      );
      tbody.querySelectorAll('[data-delete-user]').forEach((b) =>
        b.addEventListener('click', () => deleteUser(b.dataset.deleteUser))
      );

      // Pagination
      if (res.meta.pages > 1) {
        const btns = [];
        btns.push(`<button class="btn btn--ghost btn--sm" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`);
        for (let i = 1; i <= res.meta.pages; i++) {
          if (i === 1 || i === res.meta.pages || Math.abs(i - page) <= 1) {
            btns.push(`<button class="btn ${i === page ? 'btn--primary' : 'btn--ghost'} btn--sm" data-page="${i}">${i}</button>`);
          } else if (Math.abs(i - page) === 2) {
            btns.push(`<span style="padding:0 .5rem;color:var(--color-text-muted);">…</span>`);
          }
        }
        btns.push(`<button class="btn btn--ghost btn--sm" ${page === res.meta.pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`);
        pagination.innerHTML = btns.join('');
        pagination.querySelectorAll('[data-page]').forEach((b) =>
          b.addEventListener('click', () => { page = Number(b.dataset.page); load(); })
        );
      } else {
        pagination.innerHTML = '';
      }
    };

    async function openEditUser(id) {
      const res = await api.admin.user(id);
      if (!res.success) { toast('Failed to load user.', 'error'); return; }
      const u = res.data.user;
      document.getElementById('editUserId').value = u._id;
      document.getElementById('editUserName').value = `${u.firstName} ${u.lastName}`;
      document.getElementById('editUserEmail').value = u.email;
      document.getElementById('editUserRole').value = u.role;
      document.getElementById('editUserStatus').value = u.status || 'active';
      document.getElementById('editUserModal').classList.remove('hidden');
    }

    async function deleteUser(id) {
      if (!confirm('Delete this user? This cannot be undone.')) return;
      const res = await api.admin.deleteUser(id);
      if (res.success) { toast('User deleted.', 'success'); load(); }
      else toast(res.message || 'Failed.', 'error');
    }

    // Filters
    let searchTimer;
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { page = 1; load(); }, 350);
    });
    roleSel.addEventListener('change', () => { page = 1; load(); });
    statusSel.addEventListener('change', () => { page = 1; load(); });

    // Edit modal
    const editModal = document.getElementById('editUserModal');
    document.getElementById('closeEditUser').addEventListener('click', () => editModal.classList.add('hidden'));
    document.getElementById('cancelEditUser').addEventListener('click', () => editModal.classList.add('hidden'));
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editUserId').value;
      const res = await api.admin.updateUser(id, {
        role: document.getElementById('editUserRole').value,
        status: document.getElementById('editUserStatus').value,
      });
      if (res.success) { toast('User updated.', 'success'); editModal.classList.add('hidden'); load(); }
      else toast(res.message || 'Failed.', 'error');
    });

    load();
  }

  /* ==================================================
     ADMIN APPLICATIONS
     ================================================== */
  async function initAdminApplications() {
    if (!(await requireAdmin())) return;

    const tbody = document.getElementById('appsTbody');
    const search = document.getElementById('appSearch');
    const statusSel = document.getElementById('appStatus');
    const levelSel = document.getElementById('appLevel');
    const countEl = document.getElementById('appsCount');
    const pagination = document.getElementById('appsPagination');

    let page = 1;
    const perPage = 15;

    const load = async () => {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:var(--space-7);text-align:center;"><span class="spinner spinner--dark"></span></td></tr>';
      const params = new URLSearchParams({ page, limit: perPage });
      if (search.value.trim()) params.set('q', search.value.trim());
      if (statusSel.value) params.set('status', statusSel.value);
      if (levelSel.value) params.set('level', levelSel.value);

      const res = await api.admin.applications('?' + params.toString());
      if (!res.success) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:var(--space-5);text-align:center;" class="text-muted">Failed to load applications.</td></tr>`;
        return;
      }
      const apps = res.data.applications;
      countEl.textContent = `${res.meta.total} application${res.meta.total === 1 ? '' : 's'}`;

      if (!apps.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:var(--space-5);text-align:center;" class="text-muted">No applications match your filters.</td></tr>`;
        pagination.innerHTML = '';
        return;
      }

      tbody.innerHTML = apps.map((a) => `
        <tr style="border-bottom:1px solid var(--color-border);">
          <td style="padding:.75rem 1rem;font-family:var(--font-mono);font-size:.75rem;">${esc(a.referenceNumber)}</td>
          <td style="padding:.75rem 1rem;">${esc(a.firstName)} ${esc(a.lastName)}<br><span class="text-muted" style="font-size:var(--fs-xs);">${esc(a.email)}</span></td>
          <td style="padding:.75rem 1rem;">${esc(a.programme?.name || 'N/A')}</td>
          <td style="padding:.75rem 1rem;">${esc(a.level)}</td>
          <td style="padding:.75rem 1rem;"><span class="badge ${STATUS_COLORS[a.status] || 'badge--info'}">${esc(STATUS_LABELS[a.status] || a.status)}</span></td>
          <td style="padding:.75rem 1rem;color:var(--color-text-muted);font-size:var(--fs-xs);">${new Date(a.createdAt).toLocaleDateString()}</td>
          <td style="padding:.75rem 1rem;text-align:right;">
            <button class="btn btn--ghost btn--sm" data-review="${a._id}"><i class="fas fa-eye"></i> Review</button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-review]').forEach((b) =>
        b.addEventListener('click', () => openReview(b.dataset.review))
      );

      if (res.meta.pages > 1) {
        const btns = [];
        btns.push(`<button class="btn btn--ghost btn--sm" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="fas fa-chevron-left"></i></button>`);
        for (let i = 1; i <= res.meta.pages; i++) {
          if (i === 1 || i === res.meta.pages || Math.abs(i - page) <= 1) {
            btns.push(`<button class="btn ${i === page ? 'btn--primary' : 'btn--ghost'} btn--sm" data-page="${i}">${i}</button>`);
          } else if (Math.abs(i - page) === 2) {
            btns.push(`<span style="padding:0 .5rem;color:var(--color-text-muted);">…</span>`);
          }
        }
        btns.push(`<button class="btn btn--ghost btn--sm" ${page === res.meta.pages ? 'disabled' : ''} data-page="${page + 1}"><i class="fas fa-chevron-right"></i></button>`);
        pagination.innerHTML = btns.join('');
        pagination.querySelectorAll('[data-page]').forEach((b) =>
          b.addEventListener('click', () => { page = Number(b.dataset.page); load(); })
        );
      } else {
        pagination.innerHTML = '';
      }
    };

    async function openReview(id) {
      const res = await api.admin.application(id);
      if (!res.success) { toast('Failed to load application.', 'error'); return; }
      const a = res.data.application;

      document.getElementById('reviewAppId').value = a._id;
      document.getElementById('reviewStatus').value = a.status;
      document.getElementById('reviewNotes').value = a.reviewerNotes || '';

      document.getElementById('reviewBody').innerHTML = `
        <div class="grid grid--2" style="gap:var(--space-4);">
          <div><strong>Reference:</strong><br>${esc(a.referenceNumber)}</div>
          <div><strong>Applicant:</strong><br>${esc(a.firstName)} ${esc(a.middleName || '')} ${esc(a.lastName)}</div>
          <div><strong>Email:</strong><br>${esc(a.email)}</div>
          <div><strong>Phone:</strong><br>${esc(a.phone || '—')}</div>
          <div><strong>Date of Birth:</strong><br>${a.dateOfBirth ? new Date(a.dateOfBirth).toLocaleDateString() : '—'}</div>
          <div><strong>Gender:</strong><br>${esc(a.gender || '—')}</div>
          <div><strong>Nationality:</strong><br>${esc(a.nationality || '—')}</div>
          <div><strong>Level:</strong><br>${esc(a.level)}</div>
          <div><strong>Programme:</strong><br>${esc(a.programme?.degree || '')} ${esc(a.programme?.name || '—')}</div>
          <div><strong>Previous School:</strong><br>${esc(a.previousSchool || '—')}</div>
          <div><strong>Previous Qualification:</strong><br>${esc(a.previousQualification || '—')}</div>
          <div><strong>JAMB Score:</strong><br>${a.jambScore || '—'}</div>
        </div>
      `;
      document.getElementById('reviewModal').classList.remove('hidden');
    }

    search.addEventListener('input', (() => {
      let t;
      return () => { clearTimeout(t); t = setTimeout(() => { page = 1; load(); }, 350); };
    })());
    statusSel.addEventListener('change', () => { page = 1; load(); });
    levelSel.addEventListener('change', () => { page = 1; load(); });

    const modal = document.getElementById('reviewModal');
    document.getElementById('closeReview').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('cancelReview').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('reviewAppId').value;
      const res = await api.admin.updateApplication(id, {
        status: document.getElementById('reviewStatus').value,
        reviewerNotes: document.getElementById('reviewNotes').value.trim(),
      });
      if (res.success) { toast('Application updated.', 'success'); modal.classList.add('hidden'); load(); }
      else toast(res.message || 'Failed.', 'error');
    });

    load();
  }

  /* ==================================================
     ADMIN CONTENT (News + Events)
     ================================================== */
  async function initAdminContent() {
    if (!(await requireAdmin())) return;

    const newsList = document.getElementById('newsAdminList');
    const eventsList = document.getElementById('eventsAdminList');
    const newsModal = document.getElementById('newsModal');
    const eventModal = document.getElementById('eventModal');

    const closeModals = () => {
      newsModal.classList.add('hidden');
      eventModal.classList.add('hidden');
    };
    document.querySelectorAll('[data-close-modal]').forEach((b) =>
      b.addEventListener('click', closeModals)
    );

    const loadNews = async () => {
      newsList.innerHTML = '<div class="loading-state"><span class="spinner spinner--dark"></span></div>';
      const res = await api.public.news('?limit=50');
      const items = res.success ? res.data.news : [];
      if (!items.length) {
        newsList.innerHTML = '<p class="text-muted">No articles yet.</p>';
        return;
      }
      newsList.innerHTML = items.map((n) => `
        <div class="flex justify-between items-center" style="padding:.85rem 0;border-bottom:1px solid var(--color-border);gap:.5rem;flex-wrap:wrap;">
          <div style="flex:1;">
            <strong>${esc(n.title)}</strong>
            <div class="text-muted" style="font-size:var(--fs-xs);">
              <span class="badge badge--accent">${esc(n.category || 'general')}</span>
              &nbsp; ${new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm" data-edit-news="${n._id}"><i class="fas fa-pen"></i></button>
            <button class="btn btn--ghost btn--sm" data-delete-news="${n._id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
      newsList.querySelectorAll('[data-edit-news]').forEach((b) =>
        b.addEventListener('click', () => openNewsEdit(b.dataset.editNews, items))
      );
      newsList.querySelectorAll('[data-delete-news]').forEach((b) =>
        b.addEventListener('click', () => deleteNews(b.dataset.deleteNews))
      );
    };

    const loadEvents = async () => {
      eventsList.innerHTML = '<div class="loading-state"><span class="spinner spinner--dark"></span></div>';
      const res = await api.public.events('?limit=50');
      const items = res.success ? res.data.events : [];
      if (!items.length) {
        eventsList.innerHTML = '<p class="text-muted">No events yet.</p>';
        return;
      }
      eventsList.innerHTML = items.map((e) => `
        <div class="flex justify-between items-center" style="padding:.85rem 0;border-bottom:1px solid var(--color-border);gap:.5rem;flex-wrap:wrap;">
          <div style="flex:1;">
            <strong>${esc(e.title)}</strong>
            <div class="text-muted" style="font-size:var(--fs-xs);">
              <span class="badge badge--info">${esc(e.category || 'event')}</span>
              &nbsp; ${new Date(e.startDate).toLocaleDateString()}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm" data-edit-event="${e._id}"><i class="fas fa-pen"></i></button>
            <button class="btn btn--ghost btn--sm" data-delete-event="${e._id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
      eventsList.querySelectorAll('[data-edit-event]').forEach((b) =>
        b.addEventListener('click', () => openEventEdit(b.dataset.editEvent, items))
      );
      eventsList.querySelectorAll('[data-delete-event]').forEach((b) =>
        b.addEventListener('click', () => deleteEvent(b.dataset.deleteEvent))
      );
    };

    // News create/edit
    document.getElementById('newNewsBtn').addEventListener('click', () => {
      document.getElementById('newsModalTitle').textContent = 'New Article';
      document.getElementById('newsForm').reset();
      document.getElementById('newsId').value = '';
      newsModal.classList.remove('hidden');
    });

    function openNewsEdit(id, items) {
      const n = items.find((x) => x._id === id);
      if (!n) return;
      document.getElementById('newsModalTitle').textContent = 'Edit Article';
      document.getElementById('newsId').value = n._id;
      document.getElementById('newsTitle').value = n.title || '';
      document.getElementById('newsCategory').value = n.category || 'general';
      document.getElementById('newsImage').value = n.image || '';
      document.getElementById('newsExcerpt').value = n.excerpt || '';
      document.getElementById('newsBody').value = n.body || '';
      document.getElementById('newsPublished').checked = n.isPublished !== false;
      newsModal.classList.remove('hidden');
    }

    document.getElementById('newsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('newsId').value;
      const data = {
        title: document.getElementById('newsTitle').value.trim(),
        category: document.getElementById('newsCategory').value,
        image: document.getElementById('newsImage').value.trim(),
        excerpt: document.getElementById('newsExcerpt').value.trim(),
        body: document.getElementById('newsBody').value.trim(),
        isPublished: document.getElementById('newsPublished').checked,
      };
      const res = id ? await api.admin.updateNews(id, data) : await api.admin.createNews(data);
      if (res.success) {
        toast(id ? 'Article updated.' : 'Article created.', 'success');
        closeModals();
        loadNews();
      } else toast(res.message || 'Save failed.', 'error');
    });

    async function deleteNews(id) {
      if (!confirm('Delete this article?')) return;
      const res = await api.admin.deleteNews(id);
      if (res.success) { toast('Article deleted.', 'success'); loadNews(); }
      else toast(res.message || 'Failed.', 'error');
    }

    // Events create/edit
    document.getElementById('newEventBtn').addEventListener('click', () => {
      document.getElementById('eventModalTitle').textContent = 'New Event';
      document.getElementById('eventForm').reset();
      document.getElementById('eventId').value = '';
      eventModal.classList.remove('hidden');
    });

    function openEventEdit(id, items) {
      const ev = items.find((x) => x._id === id);
      if (!ev) return;
      document.getElementById('eventModalTitle').textContent = 'Edit Event';
      document.getElementById('eventId').value = ev._id;
      document.getElementById('eventTitle').value = ev.title || '';
      if (ev.startDate) {
        const d = new Date(ev.startDate);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('eventStartDate').value = iso;
      }
      document.getElementById('eventCategory').value = ev.category || 'academic';
      document.getElementById('eventVenue').value = ev.venue || '';
      document.getElementById('eventLocation').value = ev.location || '';
      document.getElementById('eventDescription').value = ev.description || '';
      document.getElementById('eventPublished').checked = ev.isPublished !== false;
      eventModal.classList.remove('hidden');
    }

    document.getElementById('eventForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('eventId').value;
      const data = {
        title: document.getElementById('eventTitle').value.trim(),
        startDate: document.getElementById('eventStartDate').value,
        category: document.getElementById('eventCategory').value,
        venue: document.getElementById('eventVenue').value.trim(),
        location: document.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        isPublished: document.getElementById('eventPublished').checked,
      };
      const res = id ? await api.admin.updateEvent(id, data) : await api.admin.createEvent(data);
      if (res.success) {
        toast(id ? 'Event updated.' : 'Event created.', 'success');
        closeModals();
        loadEvents();
      } else toast(res.message || 'Save failed.', 'error');
    });

    async function deleteEvent(id) {
      if (!confirm('Delete this event?')) return;
      const res = await api.admin.deleteEvent(id);
      if (res.success) { toast('Event deleted.', 'success'); loadEvents(); }
      else toast(res.message || 'Failed.', 'error');
    }

    loadNews();
    loadEvents();
  }

  /* ==================================================
     ADMIN ANNOUNCEMENTS
     ================================================== */
  async function initAdminAnnouncements() {
    if (!(await requireAdmin())) return;

    const list = document.getElementById('annList');
    const modal = document.getElementById('annModal');
    const form = document.getElementById('annForm');
    const countEl = document.getElementById('annCount');

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('closeAnnModal').addEventListener('click', closeModal);
    document.getElementById('cancelAnn').addEventListener('click', closeModal);

    const load = async () => {
      list.innerHTML = '<div class="loading-state"><span class="spinner spinner--dark"></span></div>';
      const res = await api.admin.listAnnouncements ? await api.admin.listAnnouncements('?limit=50') : { success: false };
      // The API helper currently exposes admin.announcements via the general get.
      const raw = await fetch('/api/admin/announcements?limit=50', { credentials: 'include' }).then((r) => r.json()).catch(() => ({ success: false }));
      const items = raw.success ? raw.data.announcements : [];

      countEl.textContent = `${items.length} announcement${items.length === 1 ? '' : 's'}`;
      if (!items.length) {
        list.innerHTML = '<p class="text-muted">No announcements yet.</p>';
        return;
      }
      list.innerHTML = items.map((a) => `
        <div class="flex justify-between items-center" style="padding:.85rem 0;border-bottom:1px solid var(--color-border);gap:.5rem;flex-wrap:wrap;">
          <div style="flex:1;">
            ${a.isPinned ? '<span class="badge badge--accent">Pinned</span> ' : ''}
            <span class="badge badge--info">${esc(a.category || 'general')}</span>
            <strong style="margin-left:.5rem;">${esc(a.title)}</strong>
            <div class="text-muted" style="font-size:var(--fs-xs);margin-top:.35rem;">
              ${esc(a.audience || 'all')} • ${new Date(a.publishAt || a.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm" data-edit-ann="${a._id}"><i class="fas fa-pen"></i></button>
            <button class="btn btn--ghost btn--sm" data-delete-ann="${a._id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-edit-ann]').forEach((b) =>
        b.addEventListener('click', () => openEdit(b.dataset.editAnn, items))
      );
      list.querySelectorAll('[data-delete-ann]').forEach((b) =>
        b.addEventListener('click', () => del(b.dataset.deleteAnn))
      );
    };

    document.getElementById('newAnnBtn').addEventListener('click', () => {
      document.getElementById('annModalTitle').textContent = 'New Announcement';
      form.reset();
      document.getElementById('annId').value = '';
      document.getElementById('annPublished').checked = true;
      modal.classList.remove('hidden');
    });

    function openEdit(id, items) {
      const a = items.find((x) => x._id === id);
      if (!a) return;
      document.getElementById('annModalTitle').textContent = 'Edit Announcement';
      document.getElementById('annId').value = a._id;
      document.getElementById('annTitle').value = a.title || '';
      document.getElementById('annCategory').value = a.category || 'general';
      document.getElementById('annAudience').value = a.audience || 'all';
      document.getElementById('annExcerpt').value = a.excerpt || '';
      document.getElementById('annBody').value = a.body || '';
      document.getElementById('annPinned').checked = !!a.isPinned;
      document.getElementById('annPublished').checked = a.isPublished !== false;
      modal.classList.remove('hidden');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('annId').value;
      const data = {
        title: document.getElementById('annTitle').value.trim(),
        category: document.getElementById('annCategory').value,
        audience: document.getElementById('annAudience').value,
        excerpt: document.getElementById('annExcerpt').value.trim(),
        body: document.getElementById('annBody').value.trim(),
        isPinned: document.getElementById('annPinned').checked,
        isPublished: document.getElementById('annPublished').checked,
        publishAt: new Date().toISOString(),
      };
      const url = id ? `/api/admin/announcements/${id}` : '/api/admin/announcements';
      const method = id ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then((x) => x.json()).catch(() => ({ success: false }));

      if (r.success) {
        toast(id ? 'Announcement updated.' : 'Announcement created.', 'success');
        closeModal();
        load();
      } else {
        toast(r.message || 'Save failed.', 'error');
      }
    });

    async function del(id) {
      if (!confirm('Delete this announcement?')) return;
      const r = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then((x) => x.json()).catch(() => ({ success: false }));
      if (r.success) { toast('Announcement deleted.', 'success'); load(); }
      else toast(r.message || 'Failed.', 'error');
    }

    load();
  }

  /* ==================================================
     ROUTER
     ================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    switch (page) {
      case 'admin-users': initAdminUsers(); break;
      case 'admin-applications': initAdminApplications(); break;
      case 'admin-content': initAdminContent(); break;
      case 'admin-announcements': initAdminAnnouncements(); break;
    }
  });
})();