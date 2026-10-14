/**
 * public/js/catalogue.js
 * Powers all catalogue pages: faculties, faculty detail, departments,
 * department detail, programmes directory, programme detail, study-level
 * landing pages, and the faculty showcase grid on faculties.html.
 *
 * Uses only window.API (defined in api.js) and window.UI.toast().
 */
(function () {
  'use strict';

  const api = window.API;
  const page = document.body.dataset.page;

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const qs = (key) => new URLSearchParams(window.location.search).get(key);

  /* ==================================================
     FACULTIES LISTING
     ================================================== */
  async function initFacultiesPage() {
    const grid = document.getElementById('facultyGrid');
    if (!grid) return;
    const empty = document.getElementById('emptyState');

    const res = await api.public.faculties();
    if (!res.success || !res.data.faculties.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    grid.innerHTML = res.data.faculties.map((f) => `
      <a href="/pages/faculty.html?slug=${encodeURIComponent(f.slug)}" class="faculty-card reveal">
        <div class="faculty-card__icon"><i class="fas ${esc(f.icon || 'fa-university')}"></i></div>
        <h3 class="faculty-card__title">${esc(f.name)}</h3>
        <p class="faculty-card__text">${esc((f.description || '').slice(0, 140))}${(f.description || '').length > 140 ? '…' : ''}</p>
        <div class="mt-4 text-accent" style="font-weight:600;font-size:var(--fs-sm);">Explore faculty <i class="fas fa-arrow-right"></i></div>
      </a>
    `).join('');

    // Trigger reveal observer for newly added cards
    document.querySelectorAll('.reveal').forEach((el) => {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
          });
        }, { threshold: 0.1 });
        io.observe(el);
      } else el.classList.add('is-visible');
    });
  }

  /* ==================================================
     FACULTY DETAIL
     ================================================== */
  async function initFacultyPage() {
    const slug = qs('slug');
    const body = document.getElementById('facultyBody');
    if (!slug || !body) return;

    const res = await api.public.faculty(slug);
    if (!res.success) {
      body.innerHTML = `
        <div class="text-center">
          <h2>Faculty not found</h2>
          <p class="text-muted mt-3">The faculty you're looking for does not exist or has been removed.</p>
          <a href="/pages/faculties.html" class="btn btn--primary mt-5">Back to Faculties</a>
        </div>`;
      return;
    }

    const { faculty, departments, programmes } = res.data;
    document.title = `${faculty.name} | Kelvin Ikpeni University`;
    document.getElementById('facultyName').textContent = faculty.name;
    document.getElementById('crumbFaculty').textContent = faculty.shortName || faculty.name;
    document.getElementById('facultyShort').textContent = faculty.shortName || 'Faculty';
    document.getElementById('facultyDesc').textContent = faculty.description || `Overview of ${faculty.name} at Kelvin Ikpeni University.`;

    body.innerHTML = `
      <div class="grid grid--2" style="gap:var(--space-7);align-items:start;">
        <div>
          <span class="section-label">Overview</span>
          <h2 class="section-title">About the Faculty</h2>
          <p class="text-muted" style="line-height:var(--lh-relaxed);">
            ${esc(faculty.description || 'This faculty brings together distinguished scholars, researchers, and practitioners dedicated to advancing knowledge and training the next generation of leaders.')}
          </p>
          <div class="flex gap-4 flex-wrap mt-5">
            <div>
              <div style="font-family:var(--font-display);font-size:2rem;color:var(--color-primary);font-weight:700;">${departments.length}</div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;">Departments</div>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:2rem;color:var(--color-primary);font-weight:700;">${programmes.length}</div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;">Programmes</div>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:2rem;color:var(--color-primary);font-weight:700;">${faculty.established || '—'}</div>
              <div class="text-muted" style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;">Established</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:var(--space-6);">
          <h3 class="card__title">Quick Links</h3>
          <ul class="mt-4" style="display:flex;flex-direction:column;gap:.6rem;">
            <li><a href="/pages/programmes.html"><i class="fas fa-book" style="color:var(--color-secondary);margin-right:.5rem;"></i> View all programmes</a></li>
            <li><a href="/pages/departments.html"><i class="fas fa-sitemap" style="color:var(--color-secondary);margin-right:.5rem;"></i> Browse departments</a></li>
            <li><a href="/pages/apply.html"><i class="fas fa-file-pen" style="color:var(--color-secondary);margin-right:.5rem;"></i> Apply online</a></li>
            <li><a href="/pages/contact.html"><i class="fas fa-envelope" style="color:var(--color-secondary);margin-right:.5rem;"></i> Contact the faculty</a></li>
          </ul>
        </div>
      </div>

      ${departments.length ? `
        <div class="mt-7">
          <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div>
              <span class="section-label">Departments</span>
              <h2 class="section-title" style="margin-bottom:0;">Departments in this Faculty</h2>
            </div>
          </div>
          <div class="grid grid--3">
            ${departments.map((d) => `
              <a href="/pages/department.html?slug=${encodeURIComponent(d.slug)}" class="card card--hover" style="padding:var(--space-5);text-decoration:none;">
                <div class="card__title" style="font-size:var(--fs-lg);">${esc(d.name)}</div>
                <p class="card__text mt-2">${esc((d.description || 'Departmental overview').slice(0, 100))}</p>
                <div class="mt-4 text-accent" style="font-size:var(--fs-sm);font-weight:600;">View department <i class="fas fa-arrow-right"></i></div>
              </a>
            `).join('')}
          </div>
        </div>` : ''}

      ${programmes.length ? `
        <div class="mt-8">
          <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div>
              <span class="section-label">Programmes</span>
              <h2 class="section-title" style="margin-bottom:0;">Programmes Offered</h2>
            </div>
            <a href="/pages/programmes.html" class="btn btn--ghost btn--sm">All Programmes <i class="fas fa-arrow-right"></i></a>
          </div>
          <div class="grid grid--3">
            ${programmes.map((p) => `
              <a href="/pages/programme.html?slug=${encodeURIComponent(p.slug)}" class="card card--hover programme-card">
                <div class="card__media">
                  <span class="programme-card__level">${esc(p.level)}</span>
                </div>
                <div class="card__body">
                  <h3 class="card__title" style="font-size:var(--fs-lg);">${esc(p.degree)} ${esc(p.name)}</h3>
                  <p class="card__text mt-2">${esc((p.description || '').slice(0, 100))}${(p.description || '').length > 100 ? '…' : ''}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </div>` : ''}
    `;
  }

  /* ==================================================
     FACULTY SHOWCASES (faculties.html)
     Renders a detailed block per faculty with departments,
     dean, counts, and quick links. Falls back to a static
     disciplines map when the DB is empty.
     ================================================== */
  const FACULTY_HIGHLIGHTS = {
    'faculty-of-science': [
      'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology',
      'Microbiology', 'Biochemistry', 'Biotechnology', 'Environmental Science',
    ],
    'faculty-of-computing-and-digital-technology': [
      'Computer Science', 'Software Engineering', 'Information Technology',
      'Data Science', 'Artificial Intelligence', 'Cybersecurity',
      'Information Systems', 'Computer Engineering',
    ],
    'faculty-of-engineering': [
      'Civil Engineering', 'Mechanical Engineering', 'Electrical & Electronics Engineering',
      'Chemical Engineering', 'Computer Engineering', 'Mechatronics Engineering',
      'Renewable Energy Engineering',
    ],
    'faculty-of-business-and-management': [
      'Accounting', 'Finance', 'Banking', 'Business Administration', 'Marketing',
      'Human Resource Management', 'Entrepreneurship', 'Project Management',
      'Supply Chain Management',
    ],
    'faculty-of-social-sciences': [
      'Economics', 'Sociology', 'Political Science', 'Psychology',
      'International Relations', 'Public Administration',
      'Criminology & Security Studies', 'Development Studies',
    ],
    'faculty-of-arts-and-humanities': [
      'English & Literary Studies', 'History', 'Philosophy', 'Linguistics',
      'Theatre & Performing Arts', 'Communication & Media Studies',
      'Languages & Cultural Studies',
    ],
    'faculty-of-law': [
      'Law', 'Commercial Law', 'International Law',
      'Human Rights & Constitutional Law', 'Intellectual Property Law',
    ],
    'faculty-of-education': [
      'Educational Management', 'Educational Technology', 'Curriculum Studies',
      'Guidance & Counselling', 'Science Education', 'Mathematics Education',
      'Educational Psychology',
    ],
    'faculty-of-health-sciences': [
      'Public Health', 'Health Information Management', 'Medical Laboratory Science',
      'Nursing Science', 'Nutrition & Dietetics', 'Environmental Health',
    ],
    'faculty-of-environmental-design-and-architecture': [
      'Architecture', 'Urban & Regional Planning', 'Estate Management',
      'Quantity Surveying', 'Building Technology', 'Geography & Geoinformatics',
    ],
    'faculty-of-agriculture-and-food-systems': [
      'Agricultural Science', 'Agronomy', 'Animal Science', 'Agricultural Economics',
      'Food Science & Technology', 'Fisheries & Aquaculture', 'Soil Science',
    ],
    'faculty-of-media-creative-arts-and-design': [
      'Graphic Design', 'Digital Media', 'Film & Television Production',
      'Animation', 'Advertising', 'Public Relations', 'Multimedia Technology',
    ],
    'faculty-of-hospitality-and-tourism': [
      'Hospitality Management', 'Tourism Management', 'Hotel Management',
      'Event Management', 'Travel & Tourism Studies',
    ],
    'faculty-of-library-and-information-science': [
      'Library Science', 'Information Management', 'Knowledge Management',
      'Digital Archiving',
    ],
    'faculty-of-maritime-and-logistics-studies': [
      'Maritime Management', 'Logistics & Transport Management',
      'Port Management', 'Supply Chain & Operations Management',
    ],
    'faculty-of-interdisciplinary-and-emerging-studies': [
      'Climate Change & Sustainability', 'Energy Studies',
      'Entrepreneurship & Innovation', 'Peace & Conflict Studies',
      'Artificial Intelligence & Society', 'Digital Transformation',
    ],
  };

  async function renderFacultyShowcases() {
    const wrap = document.getElementById('facultyFeatureList');
    if (!wrap) return;

    const res = await api.public.faculties();
    const faculties = res.success ? res.data.faculties : [];

    if (!faculties.length) {
      wrap.innerHTML = `
        <div class="text-center" style="padding:var(--space-7);">
          <p class="text-muted">Faculty details will appear here once published.</p>
        </div>`;
      return;
    }

    const blocks = await Promise.all(
      faculties.map(async (f) => {
        let departments = [];
        let programmes = [];
        try {
          const detail = await api.public.faculty(f.slug);
          if (detail.success) {
            departments = detail.data.departments || [];
            programmes = detail.data.programmes || [];
          }
        } catch (_) { /* ignore */ }

        const highlightList = departments.length
          ? departments.map((d) => d.name)
          : (FACULTY_HIGHLIGHTS[f.slug] || []);

        const dean = f.dean
          ? `${f.dean.title || ''} ${f.dean.firstName || ''} ${f.dean.lastName || ''}`.trim()
          : 'To be appointed';

        return `
          <article class="faculty-feature reveal">
            <div class="faculty-feature__visual">
              <i class="fas ${esc(f.icon || 'fa-university')} faculty-feature__icon"></i>
              <div class="faculty-feature__short">${esc(f.shortName || f.name)}</div>
              <div class="faculty-feature__est">${f.established ? 'Established ' + esc(f.established) : 'Faculty'}</div>
            </div>
            <div class="faculty-feature__body">
              <span class="section-label" style="margin-bottom:var(--space-2);">Faculty</span>
              <h2>${esc(f.name)}</h2>
              <p>${esc(f.description || 'A community of scholars advancing knowledge and shaping the next generation of leaders.')}</p>

              <div class="faculty-feature__meta">
                <div class="faculty-feature__meta-item">
                  <div class="label">Dean</div>
                  <div class="value">${esc(dean)}</div>
                </div>
                <div class="faculty-feature__meta-item">
                  <div class="label">Departments</div>
                  <div class="value">${departments.length || highlightList.length || '—'}</div>
                </div>
                <div class="faculty-feature__meta-item">
                  <div class="label">Programmes</div>
                  <div class="value">${programmes.length || '—'}</div>
                </div>
                <div class="faculty-feature__meta-item">
                  <div class="label">Accreditation</div>
                  <div class="value">NUC Accredited</div>
                </div>
              </div>

              ${highlightList.length ? `
                <div class="faculty-feature__depts">
                  <h4>${departments.length ? 'Departments' : 'Disciplines &amp; Specialisations'}</h4>
                  <ul>
                    ${highlightList.map((name) => `<li>${esc(name)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div class="faculty-feature__actions">
                <a href="/pages/faculty.html?slug=${encodeURIComponent(f.slug)}" class="btn btn--primary">
                  View Faculty <i class="fas fa-arrow-right btn__arrow"></i>
                </a>
                <a href="/pages/programmes.html?faculty=${encodeURIComponent(f._id)}" class="btn btn--ghost">
                  Programmes
                </a>
                <a href="/pages/apply.html" class="btn btn--ghost">
                  Apply
                </a>
              </div>
            </div>
          </article>
        `;
      })
    );

    wrap.innerHTML = blocks.join('');

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
      wrap.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    } else {
      wrap.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ==================================================
     DEPARTMENTS LISTING
     ================================================== */
  async function initDepartmentsPage() {
    const grid = document.getElementById('deptGrid');
    if (!grid) return;

    const searchInput = document.getElementById('deptSearch');
    const facultySel = document.getElementById('deptFaculty');

    const facRes = await api.public.faculties();
    const faculties = facRes.success ? facRes.data.faculties : [];
    faculties.forEach((f) => {
      const o = document.createElement('option');
      o.value = f._id;
      o.textContent = f.name;
      facultySel.appendChild(o);
    });

    const res = await api.public.departments();
    const all = res.success ? res.data.departments : [];

    const render = () => {
      const q = searchInput.value.trim().toLowerCase();
      const fac = facultySel.value;
      const filtered = all.filter((d) => {
        if (fac && (d.faculty?._id || d.faculty) !== fac) return false;
        if (q && !d.name.toLowerCase().includes(q)) return false;
        return true;
      });

      if (!filtered.length) {
        grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:var(--space-8);">No departments match your filters.</p>`;
        return;
      }

      grid.innerHTML = filtered.map((d) => `
        <a href="/pages/department.html?slug=${encodeURIComponent(d.slug)}" class="card card--hover" style="padding:var(--space-5);text-decoration:none;">
          <span class="badge badge--purple">${esc(d.faculty?.shortName || 'KIU')}</span>
          <h3 class="card__title mt-3" style="font-size:var(--fs-lg);">${esc(d.name)}</h3>
          <p class="card__text mt-2">${esc((d.description || 'Department overview').slice(0, 120))}</p>
          <div class="mt-4 text-accent" style="font-size:var(--fs-sm);font-weight:600;">View department <i class="fas fa-arrow-right"></i></div>
        </a>
      `).join('');
    };

    searchInput.addEventListener('input', render);
    facultySel.addEventListener('change', render);
    render();
  }

  /* ==================================================
     DEPARTMENT DETAIL
     ================================================== */
  async function initDepartmentPage() {
    const slug = qs('slug');
    const body = document.getElementById('deptBody');
    if (!slug || !body) return;

    const res = await api.public.department(slug);
    if (!res.success) {
      body.innerHTML = `
        <div class="text-center">
          <h2>Department not found</h2>
          <p class="text-muted mt-3">The department you're looking for does not exist or has been removed.</p>
          <a href="/pages/departments.html" class="btn btn--primary mt-5">Back to Departments</a>
        </div>`;
      return;
    }

    const { department, programmes } = res.data;
    document.title = `${department.name} | Kelvin Ikpeni University`;
    document.getElementById('deptName').textContent = department.name;
    document.getElementById('crumbDept').textContent = department.name;
    document.getElementById('deptCode').textContent = department.code || 'Department';
    document.getElementById('deptFaculty').textContent = department.faculty?.name || '';

    body.innerHTML = `
      <div class="grid grid--2" style="gap:var(--space-7);align-items:start;">
        <div>
          <span class="section-label">Overview</span>
          <h2 class="section-title">About the Department</h2>
          <p class="text-muted" style="line-height:var(--lh-relaxed);">
            ${esc(department.description || 'This department anchors teaching and research within its faculty and offers programmes designed to prepare students for impactful careers.')}
          </p>
        </div>
        <div class="card" style="padding:var(--space-6);">
          <h3 class="card__title">Contact</h3>
          <ul class="mt-4" style="display:flex;flex-direction:column;gap:.6rem;">
            ${department.email ? `<li><i class="fas fa-envelope" style="color:var(--color-secondary);margin-right:.5rem;"></i> <a href="mailto:${esc(department.email)}">${esc(department.email)}</a></li>` : ''}
            ${department.phone ? `<li><i class="fas fa-phone" style="color:var(--color-secondary);margin-right:.5rem;"></i> ${esc(department.phone)}</li>` : ''}
            <li><i class="fas fa-building-columns" style="color:var(--color-secondary);margin-right:.5rem;"></i> ${esc(department.faculty?.name || '')}</li>
          </ul>
        </div>
      </div>

      ${programmes.length ? `
        <div class="mt-8">
          <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div>
              <span class="section-label">Programmes</span>
              <h2 class="section-title" style="margin-bottom:0;">Programmes in this Department</h2>
            </div>
          </div>
          <div class="grid grid--3">
            ${programmes.map((p) => `
              <a href="/pages/programme.html?slug=${encodeURIComponent(p.slug)}" class="card card--hover programme-card">
                <div class="card__media"><span class="programme-card__level">${esc(p.level)}</span></div>
                <div class="card__body">
                  <h3 class="card__title" style="font-size:var(--fs-lg);">${esc(p.degree)} ${esc(p.name)}</h3>
                  <p class="card__text mt-2">${esc((p.description || '').slice(0, 100))}${(p.description || '').length > 100 ? '…' : ''}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </div>` : ''}

      <div class="text-center mt-8">
        <a href="/pages/programmes.html" class="btn btn--outline btn--lg">Browse All Programmes <i class="fas fa-arrow-right btn__arrow"></i></a>
      </div>
    `;
  }

  /* ==================================================
     PROGRAMMES DIRECTORY
     ================================================== */
  async function initProgrammesDirectory() {
    const grid = document.getElementById('progGrid');
    if (!grid) return;

    const searchInput = document.getElementById('progSearch');
    const facSel = document.getElementById('progFaculty');
    const lvlSel = document.getElementById('progLevel');
    const sortSel = document.getElementById('progSort');
    const clearBtn = document.getElementById('clearFilters');
    const emptyClear = document.getElementById('emptyClear');
    const emptyState = document.getElementById('progEmpty');
    const countEl = document.getElementById('progCount');
    const pagination = document.getElementById('progPagination');

    const facRes = await api.public.faculties();
    const faculties = facRes.success ? facRes.data.faculties : [];
    faculties.forEach((f) => {
      const o = document.createElement('option');
      o.value = f._id;
      o.textContent = f.name;
      facSel.appendChild(o);
    });

    // Pre-apply filter from ?faculty=<id> query param
    const urlFaculty = qs('faculty');
    if (urlFaculty) facSel.value = urlFaculty;

    const res = await api.public.programmes('?limit=200');
    const all = res.success ? res.data.programmes : [];

    let currentPage = 1;
    const perPage = 9;

    const applyFilters = () => {
      const q = searchInput.value.trim().toLowerCase();
      const fac = facSel.value;
      const lvl = lvlSel.value;
      const sort = sortSel.value;

      let list = all.filter((p) => {
        const facId = p.faculty && typeof p.faculty === 'object' ? p.faculty._id : p.faculty;
        if (fac && facId !== fac) return false;
        if (lvl && p.level !== lvl) return false;
        if (q) {
          const hay = `${p.name} ${p.code || ''} ${p.description || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
      if (sort === 'featured') list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

      countEl.textContent = `${list.length} programme${list.length === 1 ? '' : 's'} found`;
      return list;
    };

    const renderPage = () => {
      const list = applyFilters();
      const totalPages = Math.max(1, Math.ceil(list.length / perPage));
      if (currentPage > totalPages) currentPage = 1;
      const start = (currentPage - 1) * perPage;
      const slice = list.slice(start, start + perPage);

      if (!slice.length) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        emptyState.classList.remove('hidden');
      } else {
        grid.style.display = '';
        emptyState.classList.add('hidden');
        grid.innerHTML = slice.map((p) => `
          <a href="/pages/programme.html?slug=${encodeURIComponent(p.slug)}" class="card card--hover programme-card">
            <div class="card__media">
              <span class="programme-card__level">${esc(p.level)}</span>
              ${p.isFeatured ? '<span class="programme-card__badge">Featured</span>' : ''}
            </div>
            <div class="card__body">
              <div class="programme-card__meta">
                <span><i class="fas fa-graduation-cap"></i> ${esc(p.degree || 'Degree')}</span>
                <span><i class="fas fa-clock"></i> ${esc(p.duration || 'Flexible')}</span>
              </div>
              <h3 class="card__title">${esc(p.name)}</h3>
              <p class="card__text">${esc((p.description || '').slice(0, 130))}${(p.description || '').length > 130 ? '…' : ''}</p>
              <div class="mt-4 flex items-center justify-between">
                <span class="badge badge--purple">${esc(p.faculty?.shortName || p.faculty?.name || 'KIU')}</span>
                <span class="text-accent" style="font-weight:600;">View <i class="fas fa-arrow-right"></i></span>
              </div>
            </div>
          </a>
        `).join('');
      }

      if (totalPages > 1) {
        const buttons = [];
        buttons.push(`<button class="btn btn--ghost btn--sm" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`);
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            buttons.push(`<button class="btn ${i === currentPage ? 'btn--primary' : 'btn--ghost'} btn--sm" data-page="${i}">${i}</button>`);
          } else if (Math.abs(i - currentPage) === 2) {
            buttons.push(`<span style="padding:0 .5rem;color:var(--color-text-muted);">…</span>`);
          }
        }
        buttons.push(`<button class="btn btn--ghost btn--sm" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`);
        pagination.innerHTML = buttons.join('');
        pagination.querySelectorAll('[data-page]').forEach((b) => {
          b.addEventListener('click', () => {
            currentPage = Number(b.dataset.page);
            renderPage();
            window.scrollTo({ top: 300, behavior: 'smooth' });
          });
        });
      } else {
        pagination.innerHTML = '';
      }
    };

    const resetFilters = () => {
      searchInput.value = '';
      facSel.value = '';
      lvlSel.value = '';
      sortSel.value = 'featured';
      currentPage = 1;
      renderPage();
    };

    searchInput.addEventListener('input', () => { currentPage = 1; renderPage(); });
    facSel.addEventListener('change', () => { currentPage = 1; renderPage(); });
    lvlSel.addEventListener('change', () => { currentPage = 1; renderPage(); });
    sortSel.addEventListener('change', () => { currentPage = 1; renderPage(); });
    clearBtn?.addEventListener('click', resetFilters);
    emptyClear?.addEventListener('click', resetFilters);

    renderPage();
  }

  /* ==================================================
     PROGRAMME DETAIL
     ================================================== */
  async function initProgrammePage() {
    const slug = qs('slug');
    const body = document.getElementById('programmeBody');
    if (!slug || !body) return;

    const res = await api.public.programme(slug);
    if (!res.success) {
      body.innerHTML = `
        <div class="text-center">
          <h2>Programme not found</h2>
          <p class="text-muted mt-3">The programme you're looking for does not exist or has been removed.</p>
          <a href="/pages/programmes.html" class="btn btn--primary mt-5">Browse All Programmes</a>
        </div>`;
      return;
    }

    const { programme: p, related = [] } = res.data;
    document.title = `${p.name} | Kelvin Ikpeni University`;
    document.getElementById('programmeName').textContent = `${p.degree || ''} ${p.name}`.trim();
    document.getElementById('crumbProgramme').textContent = p.name;
    document.getElementById('programmeLevel').textContent = p.level;
    document.getElementById('programmeIntro').textContent = p.description || 'Programme overview';

    body.innerHTML = `
      <div class="grid" style="grid-template-columns:2fr 1fr;gap:var(--space-7);align-items:start;">
        <div>
          <span class="section-label">Overview</span>
          <h2 class="section-title">About the Programme</h2>
          <p class="text-muted" style="line-height:var(--lh-relaxed);">
            ${esc(p.overview || p.description || 'Programme details will be published shortly.')}
          </p>

          ${p.entryRequirements?.length ? `
            <h3 class="mt-7" style="margin-bottom:var(--space-4);">Entry Requirements</h3>
            <ul style="display:flex;flex-direction:column;gap:.6rem;">
              ${p.entryRequirements.map((r) => `<li><i class="fas fa-check" style="color:var(--color-emerald);margin-right:.6rem;"></i> ${esc(r)}</li>`).join('')}
            </ul>
          ` : ''}

          ${p.careerProspects?.length ? `
            <h3 class="mt-7" style="margin-bottom:var(--space-4);">Career Prospects</h3>
            <ul style="display:flex;flex-direction:column;gap:.6rem;">
              ${p.careerProspects.map((r) => `<li><i class="fas fa-briefcase" style="color:var(--color-secondary);margin-right:.6rem;"></i> ${esc(r)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>

        <aside>
          <div class="card" style="padding:var(--space-6);">
            <h3 class="card__title">Programme Details</h3>
            <ul class="mt-4" style="display:flex;flex-direction:column;gap:.75rem;font-size:var(--fs-sm);">
              <li><strong>Degree:</strong> ${esc(p.degree || '—')}</li>
              <li><strong>Level:</strong> ${esc(p.level)}</li>
              <li><strong>Duration:</strong> ${esc(p.duration || 'Flexible')}</li>
              <li><strong>Mode:</strong> ${esc(p.mode || 'Full-time')}</li>
              <li><strong>Faculty:</strong> ${esc(p.faculty?.name || '—')}</li>
              <li><strong>Department:</strong> ${esc(p.department?.name || '—')}</li>
              <li><strong>Accreditation:</strong> ${esc(p.accreditation || 'NUC Accredited')}</li>
              ${p.tuitionPerYear ? `<li><strong>Tuition:</strong> ${esc(p.tuitionCurrency || 'NGN')} ${Number(p.tuitionPerYear).toLocaleString()} / year</li>` : ''}
            </ul>
            <div class="mt-5">
              <a href="/pages/apply.html?programme=${encodeURIComponent(p.slug)}" class="btn btn--accent btn--block btn--lg">
                <i class="fas fa-file-pen"></i> Apply for this Programme
              </a>
            </div>
            <div class="mt-3">
              <a href="/pages/contact.html" class="btn btn--outline btn--block">Ask a Question</a>
            </div>
          </div>

          ${p.brochureUrl ? `
            <div class="card mt-4" style="padding:var(--space-5);">
              <h4 style="font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.08em;color:var(--color-accent-dark);margin-bottom:var(--space-3);">Brochure</h4>
              <a href="${esc(p.brochureUrl)}" class="btn btn--primary btn--block" target="_blank" rel="noopener">
                <i class="fas fa-download"></i> Download Brochure
              </a>
            </div>
          ` : ''}
        </aside>
      </div>

      ${related.length ? `
        <div class="mt-8">
          <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div>
              <span class="section-label">Explore More</span>
              <h2 class="section-title" style="margin-bottom:0;">Related Programmes</h2>
            </div>
            <a href="/pages/programmes.html" class="btn btn--ghost btn--sm">All Programmes <i class="fas fa-arrow-right"></i></a>
          </div>
          <div class="grid grid--3">
            ${related.map((r) => `
              <a href="/pages/programme.html?slug=${encodeURIComponent(r.slug)}" class="card card--hover programme-card">
                <div class="card__media"><span class="programme-card__level">${esc(r.level)}</span></div>
                <div class="card__body">
                  <h3 class="card__title" style="font-size:var(--fs-lg);">${esc(r.degree)} ${esc(r.name)}</h3>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  /* ==================================================
     STUDY LEVEL PAGES
     ================================================== */
  async function initStudyLevelPage() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    const level = document.body.dataset.level;
    if (!level) return;

    const res = await api.public.programmes(`?level=${encodeURIComponent(level)}&limit=100`);
    const items = res.success ? res.data.programmes : [];

    if (!items.length) {
      grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:var(--space-8);">Programmes for this study level will be listed here shortly.</p>`;
      return;
    }

    grid.innerHTML = items.map((p) => `
      <a href="/pages/programme.html?slug=${encodeURIComponent(p.slug)}" class="card card--hover programme-card">
        <div class="card__media">
          <span class="programme-card__level">${esc(p.level)}</span>
          ${p.isFeatured ? '<span class="programme-card__badge">Featured</span>' : ''}
        </div>
        <div class="card__body">
          <div class="programme-card__meta">
            <span><i class="fas fa-graduation-cap"></i> ${esc(p.degree || 'Degree')}</span>
            <span><i class="fas fa-clock"></i> ${esc(p.duration || 'Flexible')}</span>
          </div>
          <h3 class="card__title">${esc(p.name)}</h3>
          <p class="card__text">${esc((p.description || '').slice(0, 130))}${(p.description || '').length > 130 ? '…' : ''}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="badge badge--purple">${esc(p.faculty?.shortName || 'KIU')}</span>
            <span class="text-accent" style="font-weight:600;">View <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
    `).join('');
  }

  /* ==================================================
     ROUTER — dispatch by data-page
     ================================================== */
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      switch (page) {
        case 'faculties':
          await initFacultiesPage();
          await renderFacultyShowcases();
          break;
        case 'faculty': await initFacultyPage(); break;
        case 'departments': await initDepartmentsPage(); break;
        case 'department': await initDepartmentPage(); break;
        case 'programmes': await initProgrammesDirectory(); break;
        case 'programme': await initProgrammePage(); break;
        case 'study-level': await initStudyLevelPage(); break;
        default: break;
      }
    } catch (err) {
      console.error('[catalogue]', err);
      if (window.UI && window.UI.toast) {
        window.UI.toast('Failed to load content. Please refresh.', 'error');
      }
    }
  });
})();