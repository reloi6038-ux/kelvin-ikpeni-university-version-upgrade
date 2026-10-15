/**
 * public/js/main.js
 * Global UI behavior + homepage data loading.
 */
(function () {
  'use strict';

  /* =========================================================
     TOAST NOTIFICATIONS
     ========================================================= */
  function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type = 'info', timeout = 4500) {
    const container = ensureToastContainer();
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info',
    };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <span class="toast__icon"><i class="fas ${icons[type] || icons.info}"></i></span>
      <div class="toast__message">${message}</div>
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  /* =========================================================
     HEADER SCROLL SHADOW
     ========================================================= */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* =========================================================
     MOBILE NAVIGATION (with full aria-expanded support)
     ========================================================= */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;

    // Set up aria-haspopup + aria-expanded on dropdown parents from the start
    const dropdownParents = nav.querySelectorAll(
      '.nav-item.has-dropdown > .nav-link, .nav-item.has-mega > .nav-link'
    );
    dropdownParents.forEach((link) => {
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
    });

    const openNav = () => {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      toggle.innerHTML = '<i class="fas fa-xmark"></i>';
      document.body.classList.add('mobile-nav-open');
    };

    const closeNav = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.classList.remove('mobile-nav-open');
      // Reset all dropdown parents to closed
      nav.querySelectorAll('.nav-item.is-open').forEach((el) => {
        el.classList.remove('is-open');
        const parentLink = el.querySelector('.nav-link');
        if (parentLink) parentLink.setAttribute('aria-expanded', 'false');
      });
    };

    toggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) closeNav();
      else openNav();
    });

    // Toggle dropdown groups on mobile; also handle desktop (no-op)
    dropdownParents.forEach((link) => {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          const item = link.parentElement;
          const wasOpen = item.classList.contains('is-open');

          // Close other open dropdowns
          nav.querySelectorAll('.nav-item.is-open').forEach((el) => {
            if (el !== item) {
              el.classList.remove('is-open');
              const sibLink = el.querySelector('.nav-link');
              if (sibLink) sibLink.setAttribute('aria-expanded', 'false');
            }
          });

          const willOpen = !wasOpen;
          item.classList.toggle('is-open', willOpen);
          link.setAttribute('aria-expanded', String(willOpen));
        }
      });
    });

    // Close nav when a real link (not a dropdown parent) is clicked on mobile
    nav.querySelectorAll('a[href]').forEach((a) => {
      a.addEventListener('click', () => {
        const isDropdownParent =
          a.closest('.nav-item.has-dropdown > .nav-link') ||
          a.closest('.nav-item.has-mega > .nav-link');
        if (window.innerWidth <= 900 && !isDropdownParent) {
          closeNav();
        }
      });
    });

    // Auto-close when resizing back up to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('is-open')) {
        closeNav();
      }
    });

    // Escape key closes the nav
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
      }
    });

    // Click outside the nav closes it (mobile only)
    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 900 &&
        nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeNav();
      }
    });
  }

  /* =========================================================
     ACTIVE NAV LINK
     ========================================================= */
  function initActiveNav() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-link[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const clean = href.replace(/\/$/, '');
      if (clean === path || (clean !== '/' && path.startsWith(clean))) {
        a.classList.add('is-active');
      }
    });
  }

  /* =========================================================
     NEWSLETTER FORM
     ========================================================= */
  function initNewsletter() {
    document.querySelectorAll('[data-newsletter-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button');
        const email = input.value.trim();
        if (!email) return;

        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';

        const res = await window.API.public.subscribe({ email });
        btn.disabled = false;
        btn.innerHTML = original;

        if (res.success) {
          toast(res.message || 'Subscribed!', 'success');
          input.value = '';
        } else {
          toast(res.message || 'Subscription failed.', 'error');
        }
      });
    });
  }

  /* =========================================================
     HOMEPAGE DATA LOADERS
     ========================================================= */
  async function loadHomepageData() {
    if (!document.body.dataset.page || document.body.dataset.page !== 'home') return;

    const progContainer = document.querySelector('[data-home-programmes]');
    if (progContainer && !progContainer.dataset.filterReady) {
      const res = await window.API.public.programmes('?limit=6&featured=true');
      const items = res.success ? res.data.programmes : [];
      if (!items.length) {
        const fallback = await window.API.public.programmes('?limit=6');
        renderHomeProgrammes(progContainer, fallback.success ? fallback.data.programmes : []);
      } else {
        renderHomeProgrammes(progContainer, items);
      }
    }

    const facContainer = document.querySelector('[data-home-faculties]');
    if (facContainer) {
      const res = await window.API.public.faculties();
      renderHomeFaculties(facContainer, res.success ? res.data.faculties.slice(0, 6) : []);
    }

    const newsContainer = document.querySelector('[data-home-news]');
    if (newsContainer) {
      const res = await window.API.public.news('?limit=3');
      renderHomeNews(newsContainer, res.success ? res.data.news : []);
    }

    const eventsContainer = document.querySelector('[data-home-events]');
    if (eventsContainer) {
      const res = await window.API.public.events('?limit=3&upcoming=true');
      renderHomeEvents(eventsContainer, res.success ? res.data.events : []);
    }

    const ticker = document.querySelector('[data-announcement-ticker]');
    if (ticker) {
      const res = await window.API.public.announcements('?limit=3');
      const items = res.success ? res.data.announcements : [];
      if (items.length) {
        ticker.innerHTML = items
          .map(
            (a) =>
              `<a href="/pages/announcements.html" style="color:rgba(255,255,255,0.85);"><i class="fas fa-circle" style="font-size:0.4rem;color:var(--color-emerald);vertical-align:middle;"></i> ${escapeHtml(a.title)}</a>`
          )
          .join('');
      } else {
        ticker.innerHTML =
          '<a href="/pages/admissions.html" style="color:rgba(255,255,255,0.85);"><i class="fas fa-circle" style="font-size:0.4rem;color:var(--color-emerald);vertical-align:middle;"></i> 2026/2027 Admissions are now open</a>';
      }
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function renderHomeProgrammes(container, programmes) {
    if (!programmes.length) {
      container.innerHTML = `<p class="text-muted">No programmes match your filters. Try adjusting your search.</p>`;
      return;
    }
    container.innerHTML = programmes
      .map(
        (p) => `
      <a href="/pages/programme.html?slug=${encodeURIComponent(p.slug)}" class="card card--hover programme-card">
        <div class="card__media">
          <span class="programme-card__level">${escapeHtml(p.level)}</span>
          ${p.isFeatured ? '<span class="programme-card__badge">Featured</span>' : ''}
        </div>
        <div class="card__body">
          <div class="programme-card__meta">
            <span><i class="fas fa-graduation-cap"></i> ${escapeHtml(p.degree || 'Degree')}</span>
            <span><i class="fas fa-clock"></i> ${escapeHtml(p.duration || 'Flexible')}</span>
          </div>
          <h3 class="card__title">${escapeHtml(p.name)}</h3>
          <p class="card__text">${escapeHtml((p.description || '').slice(0, 120))}${(p.description || '').length > 120 ? '…' : ''}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="badge badge--purple">${escapeHtml(p.faculty?.shortName || p.faculty?.name || 'KIU')}</span>
            <span class="text-accent" style="font-weight:600;">View <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
    `
      )
      .join('');
  }

  function renderHomeFaculties(container, faculties) {
    if (!faculties.length) {
      container.innerHTML = `<p class="text-muted">Faculties will be listed here shortly.</p>`;
      return;
    }
    container.innerHTML = faculties
      .map(
        (f) => `
      <a href="/pages/faculty.html?slug=${encodeURIComponent(f.slug)}" class="faculty-card reveal">
        <div class="faculty-card__icon"><i class="fas ${escapeHtml(f.icon || 'fa-university')}"></i></div>
        <h3 class="faculty-card__title">${escapeHtml(f.name)}</h3>
        <p class="faculty-card__text">${escapeHtml((f.description || '').slice(0, 110))}${(f.description || '').length > 110 ? '…' : ''}</p>
      </a>
    `
      )
      .join('');
  }

  function renderHomeNews(container, news) {
    if (!news.length) {
      container.innerHTML = `<p class="text-muted">Latest news coming soon.</p>`;
      return;
    }
    container.innerHTML = news
      .map(
        (n) => `
      <a href="/pages/news-item.html?slug=${encodeURIComponent(n.slug)}" class="card card--hover">
        <div class="card__media"></div>
        <div class="card__body">
          <span class="badge badge--accent">${escapeHtml(n.category || 'general')}</span>
          <h3 class="card__title mt-2">${escapeHtml(n.title)}</h3>
          <p class="card__text">${escapeHtml((n.excerpt || '').slice(0, 130))}${(n.excerpt || '').length > 130 ? '…' : ''}</p>
          <div class="mt-4 text-muted" style="font-size:var(--fs-xs);">
            <i class="far fa-calendar"></i>
            ${new Date(n.publishedAt || n.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </a>
    `
      )
      .join('');
  }

  function renderHomeEvents(container, events) {
    if (!events.length) {
      container.innerHTML = `<p class="text-muted">Upcoming events will appear here.</p>`;
      return;
    }
    container.innerHTML = events
      .map((ev) => {
        const d = new Date(ev.startDate);
        return `
        <a href="/pages/event.html?slug=${encodeURIComponent(ev.slug)}" class="card card--hover">
          <div class="card__body flex gap-4 items-center">
            <div style="text-align:center;flex-shrink:0;">
              <div style="font-family:var(--font-display);font-size:2rem;color:var(--color-primary);line-height:1;">${d.getDate()}</div>
              <div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;color:var(--color-accent-dark);font-weight:700;">
                ${d.toLocaleString(undefined, { month: 'short' })}
              </div>
            </div>
            <div style="flex:1;">
              <span class="badge badge--info">${escapeHtml(ev.category || 'event')}</span>
              <h3 class="card__title mt-2" style="font-size:var(--fs-lg);">${escapeHtml(ev.title)}</h3>
              <div class="text-muted mt-2" style="font-size:var(--fs-xs);">
                <i class="fas fa-location-dot"></i> ${escapeHtml(ev.venue || ev.location || 'Campus')}
              </div>
            </div>
          </div>
        </a>
      `;
      })
      .join('');
  }

  /* =========================================================
     HOMEPAGE PROGRAMME FILTER BAR
     ========================================================= */
  async function initProgrammeFilters() {
    const search = document.getElementById('progSearch');
    const facSel = document.getElementById('progFaculty');
    const lvlSel = document.getElementById('progLevel');
    const sortSel = document.getElementById('progSort');
    const container = document.querySelector('[data-home-programmes]');
    if (!container || !search || !facSel || !lvlSel || !sortSel) return;

    container.dataset.filterReady = '1';

    const facRes = await window.API.public.faculties();
    if (facRes.success) {
      facRes.data.faculties.forEach((f) => {
        const o = document.createElement('option');
        o.value = f._id;
        o.textContent = f.name;
        facSel.appendChild(o);
      });
    }

    let allProgrammes = [];
    const initial = await window.API.public.programmes('?limit=100');
    if (initial.success) allProgrammes = initial.data.programmes;

    const applyFilters = () => {
      const q = search.value.trim().toLowerCase();
      const fac = facSel.value;
      const lvl = lvlSel.value;
      const sort = sortSel.value;

      let list = allProgrammes.filter((p) => {
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

      renderHomeProgrammes(container, list.slice(0, 6));
    };

    search.addEventListener('input', applyFilters);
    facSel.addEventListener('change', applyFilters);
    lvlSel.addEventListener('change', applyFilters);
    sortSel.addEventListener('change', applyFilters);

    applyFilters();
  }

  /* =========================================================
     BACK TO TOP
     ========================================================= */
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener(
      'scroll',
      () => {
        btn.classList.toggle('is-visible', window.scrollY > 600);
      },
      { passive: true }
    );
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     SCROLL REVEAL
     ========================================================= */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    els.forEach((el) => io.observe(el));
  }

  /* =========================================================
     COOKIE CONSENT (loaded dynamically)
     ========================================================= */
  function initCookieConsent() {
    if (document.body.dataset.page && document.body.dataset.page.startsWith('admin-')) return;
    if (document.querySelector('link[href="/css/cookie-consent.css"]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/cookie-consent.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = '/js/cookie-consent.js';
    script.defer = true;
    document.body.appendChild(script);
  }

  /* =========================================================
     INIT ON DOM READY
     ========================================================= */
  document.addEventListener('DOMContentLoaded', async () => {
    initHeaderScroll();
    initMobileNav();
    initActiveNav();
    initNewsletter();
    initBackToTop();
    initScrollReveal();
    initCookieConsent();

    // Footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    if (window.Auth) {
      try {
        await window.Auth.renderHeaderAuth();
      } catch (_) {
        /* ignore */
      }
    }

    try {
      await loadHomepageData();
    } catch (_) {
      /* ignore */
    }

    try {
      await initProgrammeFilters();
    } catch (_) {
      /* ignore */
    }
  });

  /* Expose UI helpers */
  window.UI = { toast };
})();