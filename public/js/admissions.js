/**
 * public/js/admissions.js
 * Logic for:
 *   - The application form (pages/apply.html) — programme picker + submit
 *   - The status lookup page (pages/check-status.html)
 */
(function () {
  'use strict';

  const page = document.body.dataset.page;
  const api = window.API;
  const toast = (msg, type) => window.UI && window.UI.toast && window.UI.toast(msg, type);

  /* -----------------------------
     Helpers
     ----------------------------- */
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

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  /* =================================================
     APPLY PAGE
     ================================================= */
  async function initApplyPage() {
    const form = document.getElementById('applyForm');
    if (!form) return;

    const progSearch = document.getElementById('progSearch');
    const programmeList = document.getElementById('programmeList');
    const progCountEl = document.getElementById('progCount');
    const hiddenProgrammeId = document.getElementById('programme');
    const hiddenLevel = document.getElementById('level');
    const summaryBox = document.getElementById('programmeSummary');
    const summaryBody = document.getElementById('programmeSummaryBody');
    const levelTabs = document.getElementById('levelTabs');
    const submitBtn = document.getElementById('submitBtn');
    const successPanel = document.getElementById('successPanel');
    const refNumberEl = document.getElementById('refNumber');
    const copyRefBtn = document.getElementById('copyRefBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressBar = document.getElementById('progressBar');

    const url = new URLSearchParams(window.location.search);
    const preselectedSlug = url.get('programme');

    let allProgrammes = [];
    let selectedProgramme = null;
    let activeLevel = '';
    let searchTerm = '';

    /* ---------- Load all programmes once ---------- */
    const loadProgrammes = async () => {
      programmeList.innerHTML = `
        <div class="programme-empty" style="grid-column:1/-1;">
          <span class="spinner spinner--dark"></span>
          <div class="mt-3">Loading programmes…</div>
        </div>`;

      const res = await api.public.programmes('?limit=500');
      allProgrammes = res.success && res.data && res.data.programmes ? res.data.programmes : [];

      if (!allProgrammes.length) {
        programmeList.innerHTML = `
          <div class="programme-empty" style="grid-column:1/-1;">
            <i class="fas fa-circle-info"></i>
            No programmes available yet. Please check back soon or contact admissions.
          </div>`;
        if (progCountEl) progCountEl.textContent = '0';
        return;
      }

      // Preselect a programme if ?programme=<slug> is in the URL
      if (preselectedSlug) {
        const found = allProgrammes.find((p) => p.slug === preselectedSlug);
        if (found) {
          selectedProgramme = found;
          activeLevel = found.level || '';
          if (hiddenLevel) hiddenLevel.value = found.level || '';
          if (hiddenProgrammeId) hiddenProgrammeId.value = found._id;
          if (levelTabs) {
            levelTabs.querySelectorAll('.level-tab').forEach((t) => {
              t.classList.toggle('is-active', t.dataset.level === activeLevel);
            });
          }
          showSummary(found);
        }
      }

      renderList();
    };

    /* ---------- Render the programme options ---------- */
    const renderList = () => {
      let filtered = allProgrammes.slice();

      if (activeLevel) {
        filtered = filtered.filter((p) => p.level === activeLevel);
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter((p) => {
          const fac = p.faculty && typeof p.faculty === 'object' ? p.faculty.name || '' : '';
          const dept = p.department && typeof p.department === 'object' ? p.department.name || '' : '';
          const hay = `${p.name || ''} ${p.degree || ''} ${p.code || ''} ${fac} ${dept}`.toLowerCase();
          return hay.includes(q);
        });
      }

      if (progCountEl) progCountEl.textContent = String(filtered.length);

      if (!filtered.length) {
        programmeList.innerHTML = `
          <div class="programme-empty" style="grid-column:1/-1;">
            <i class="fas fa-magnifying-glass"></i>
            No programmes match your search. Try a different keyword or level.
          </div>`;
        return;
      }

      programmeList.innerHTML = filtered
        .map((p) => {
          const isSelected = selectedProgramme && selectedProgramme._id === p._id;
          const facultyShort =
            p.faculty && typeof p.faculty === 'object'
              ? p.faculty.shortName || p.faculty.name || ''
              : '';
          const meta = [];
          if (p.level) meta.push(`<span><i class="fas fa-layer-group"></i> ${esc(p.level)}</span>`);
          if (p.duration) meta.push(`<span><i class="fas fa-clock"></i> ${esc(p.duration)}</span>`);
          if (facultyShort) meta.push(`<span><i class="fas fa-building-columns"></i> ${esc(facultyShort)}</span>`);

          return `
            <button type="button"
                    class="programme-option ${isSelected ? 'is-selected' : ''}"
                    data-programme-id="${esc(p._id)}">
              <span class="programme-option__dot"></span>
              <span class="programme-option__body">
                <span class="programme-option__title">${esc(p.degree || '')} ${esc(p.name)}</span>
                <span class="programme-option__meta">${meta.join('')}</span>
              </span>
            </button>
          `;
        })
        .join('');

      // Wire up selection
      programmeList.querySelectorAll('[data-programme-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.programmeId;
          const prog = allProgrammes.find((p) => p._id === id);
          if (!prog) return;
          selectedProgramme = prog;
          if (hiddenProgrammeId) hiddenProgrammeId.value = prog._id;
          if (hiddenLevel) hiddenLevel.value = prog.level || '';
          showSummary(prog);

          programmeList.querySelectorAll('.programme-option').forEach((el) => {
            el.classList.toggle('is-selected', el.dataset.programmeId === id);
          });
        });
      });
    };

    /* ---------- Summary of selected programme ---------- */
    const showSummary = (p) => {
      if (!summaryBox || !summaryBody) return;
      summaryBox.classList.remove('hidden');

      const facultyName =
        p.faculty && typeof p.faculty === 'object' ? p.faculty.name || '' : '';

      summaryBody.innerHTML = `
        <div style="font-weight:600;color:var(--color-primary);">
          ${esc(p.degree || '')} ${esc(p.name)}
        </div>
        <div class="text-muted mt-1" style="font-size:var(--fs-xs);">
          <strong>Level:</strong> ${esc(p.level || '—')}
          ${p.duration ? ` &nbsp;·&nbsp; <strong>Duration:</strong> ${esc(p.duration)}` : ''}
          ${facultyName ? ` &nbsp;·&nbsp; <strong>Faculty:</strong> ${esc(facultyName)}` : ''}
        </div>
        <button type="button" id="clearProgramme" class="btn btn--ghost btn--sm mt-3">
          <i class="fas fa-xmark"></i> Change selection
        </button>
      `;

      const clearBtn = document.getElementById('clearProgramme');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          selectedProgramme = null;
          if (hiddenProgrammeId) hiddenProgrammeId.value = '';
          if (hiddenLevel) hiddenLevel.value = '';
          summaryBox.classList.add('hidden');
          programmeList.querySelectorAll('.programme-option').forEach((el) => el.classList.remove('is-selected'));
        });
      }
    };

    /* ---------- Level tabs ---------- */
    if (levelTabs) {
      levelTabs.querySelectorAll('.level-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
          activeLevel = tab.dataset.level || '';
          levelTabs.querySelectorAll('.level-tab').forEach((t) => {
            t.classList.toggle('is-active', t === tab);
          });
          renderList();
        });
      });
    }

    /* ---------- Search ---------- */
    if (progSearch) {
      let searchTimer;
      progSearch.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchTerm = progSearch.value.trim();
          renderList();
        }, 180);
      });
    }

    /* ---------- Copy reference number ---------- */
    if (copyRefBtn) {
      copyRefBtn.addEventListener('click', async () => {
        const text = refNumberEl ? refNumberEl.textContent : '';
        if (!text || text === '—') return;
        try {
          await navigator.clipboard.writeText(text);
          toast('Reference number copied.', 'success');
        } catch (_) {
          toast('Copy failed — please copy manually.', 'warning');
        }
      });
    }

    /* ---------- Reset button ---------- */
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedProgramme = null;
        if (hiddenProgrammeId) hiddenProgrammeId.value = '';
        if (hiddenLevel) hiddenLevel.value = '';
        if (summaryBox) summaryBox.classList.add('hidden');
        if (progSearch) progSearch.value = '';
        searchTerm = '';
        activeLevel = '';
        if (levelTabs) {
          levelTabs.querySelectorAll('.level-tab').forEach((t, i) => {
            t.classList.toggle('is-active', i === 0);
          });
        }
        renderList();
      });
    }

    /* ---------- Submit ---------- */
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!hiddenProgrammeId || !hiddenProgrammeId.value) {
        toast('Please select a programme.', 'warning');
        if (programmeList) programmeList.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const jambScoreEl = document.getElementById('jambScore');

      const data = {
        level: hiddenLevel ? hiddenLevel.value : '',
        programme: hiddenProgrammeId.value,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        gender: document.getElementById('gender').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        nationality: document.getElementById('nationality').value.trim(),
        stateOfOrigin: document.getElementById('stateOfOrigin').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        previousSchool: document.getElementById('previousSchool').value.trim(),
        previousQualification: document.getElementById('previousQualification').value.trim(),
        jambRegNumber: document.getElementById('jambRegNumber').value.trim(),
        jambScore: jambScoreEl && jambScoreEl.value ? Number(jambScoreEl.value) : undefined,
      };

      const original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

      const res = await api.applications.submit(data);

      submitBtn.disabled = false;
      submitBtn.innerHTML = original;

      if (res.success) {
        form.classList.add('hidden');
        if (progressBar) progressBar.classList.add('hidden');
        if (successPanel) successPanel.classList.remove('hidden');
        if (refNumberEl) refNumberEl.textContent = res.data.referenceNumber;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast('Application submitted successfully!', 'success');
      } else {
        const msg = res.details && res.details.length
          ? res.details.map((d) => d.message).join(', ')
          : (res.message || 'Submission failed.');
        toast(msg, 'error');
      }
    });

    // Kick it off
    await loadProgrammes();
  }

  /* =================================================
     CHECK STATUS PAGE
     ================================================= */
  async function initCheckStatusPage() {
    const form = document.getElementById('statusForm');
    if (!form) return;

    const input = document.getElementById('reference');
    const btn = document.getElementById('statusBtn');
    const result = document.getElementById('statusResult');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ref = input.value.trim().toUpperCase();
      if (!ref) return;

      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Checking…';

      const res = await api.applications.status(ref);

      btn.disabled = false;
      btn.innerHTML = original;

      if (!res.success) {
        result.innerHTML = `
          <div class="card" style="padding:var(--space-6);border-left:4px solid var(--color-danger);">
            <h3><i class="fas fa-circle-exclamation" style="color:var(--color-danger);margin-right:.5rem;"></i> Application Not Found</h3>
            <p class="text-muted mt-3">${esc(res.message || 'No application matches that reference number.')}</p>
            <p class="text-muted mt-3" style="font-size:var(--fs-sm);">Double-check the reference format: <code>KIU-YYYY-XXXXXX</code>.</p>
          </div>`;
        return;
      }

      const a = res.data.application;
      const badgeClass = STATUS_COLORS[a.status] || 'badge--info';
      const statusLabel = STATUS_LABELS[a.status] || a.status;

      result.innerHTML = `
        <div class="card" style="padding:var(--space-6);border-top:4px solid var(--color-accent);">
          <div class="flex justify-between items-start flex-wrap gap-3">
            <div>
              <span class="section-label">Application</span>
              <h2 style="margin-bottom:var(--space-2);">${esc(a.firstName)} ${esc(a.lastName)}</h2>
              <p class="text-muted" style="font-family:var(--font-mono);letter-spacing:.05em;">${esc(a.referenceNumber)}</p>
            </div>
            <span class="badge ${badgeClass}" style="font-size:var(--fs-sm);padding:.5rem 1rem;">${esc(statusLabel)}</span>
          </div>
          <div class="grid grid--2 mt-6" style="gap:var(--space-4);">
            <div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Programme</div>
              <div style="font-weight:600;margin-top:.35rem;">${esc(a.programme?.degree || '')} ${esc(a.programme?.name || 'N/A')}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Level</div>
              <div style="font-weight:600;margin-top:.35rem;">${esc(a.level || 'N/A')}</div>
            </div>
            <div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Submitted</div>
              <div style="font-weight:600;margin-top:.35rem;">${new Date(a.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            ${a.reviewedAt ? `
              <div>
                <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Reviewed</div>
                <div style="font-weight:600;margin-top:.35rem;">${new Date(a.reviewedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>` : ''}
          </div>
          ${a.decisionReason ? `
            <div class="mt-5" style="padding:var(--space-4);background:var(--color-surface-alt);border-radius:var(--radius);">
              <strong>Note from Admissions:</strong>
              <p class="text-muted mt-2" style="margin:0;">${esc(a.decisionReason)}</p>
            </div>` : ''}
        </div>`;
    });
  }

  /* =================================================
     ROUTER
     ================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    if (page === 'apply') initApplyPage();
    if (page === 'check-status') initCheckStatusPage();
  });
})();