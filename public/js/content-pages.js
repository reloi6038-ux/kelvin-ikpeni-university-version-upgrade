/**
 * public/js/content-pages.js
 * Powers dynamic content pages: news, events, announcements, contact form.
 */
(function () {
  'use strict';

  const page = document.body.dataset.page;
  const api = window.API;
  const toast = (msg, type) => window.UI && window.UI.toast && window.UI.toast(msg, type);

  const esc = (s) =>
    String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const qs = (key) => new URLSearchParams(window.location.search).get(key);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  /* ==================================================
     NEWS LISTING
     ================================================== */
  async function initNewsPage() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    const categorySel = document.getElementById('newsCategory');
    const searchInput = document.getElementById('newsSearch');
    const countEl = document.getElementById('newsCount');

    const params = new URLSearchParams();
    if (qs('category')) params.set('category', qs('category'));
    if (qs('q')) params.set('q', qs('q'));
    params.set('limit', '20');
    const queryString = '?' + params.toString();

    const res = await api.public.news(queryString);
    const items = res.success ? res.data.news : [];

    if (searchInput && qs('q')) searchInput.value = qs('q');
    if (categorySel && qs('category')) categorySel.value = qs('category');

    if (countEl) countEl.textContent = `${items.length} article${items.length === 1 ? '' : 's'}`;

    if (!items.length) {
      grid.innerHTML = `
        <div class="text-center" style="grid-column:1/-1;padding:var(--space-8);">
          <div style="font-size:3rem;color:var(--color-text-muted);"><i class="fas fa-newspaper"></i></div>
          <h3 class="mt-4">No articles yet</h3>
          <p class="text-muted mt-2">Check back soon for the latest news and updates.</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map((n) => `
      <a href="/pages/news-item.html?slug=${encodeURIComponent(n.slug)}" class="card card--hover">
        <div class="card__media"></div>
        <div class="card__body">
          <span class="badge badge--accent">${esc(n.category || 'general')}</span>
          <h3 class="card__title mt-2">${esc(n.title)}</h3>
          <p class="card__text">${esc((n.excerpt || '').slice(0, 140))}${(n.excerpt || '').length > 140 ? '…' : ''}</p>
          <div class="mt-4 flex justify-between items-center">
            <span class="text-muted" style="font-size:var(--fs-xs);">
              <i class="far fa-calendar"></i> ${fmtDate(n.publishedAt || n.createdAt)}
            </span>
            <span class="text-accent" style="font-weight:600;font-size:var(--fs-sm);">Read <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
    `).join('');
  }

  /* ==================================================
     NEWS ITEM (single article)
     ================================================== */
  async function initNewsItemPage() {
    const slug = qs('slug');
    const body = document.getElementById('newsBody');
    if (!slug || !body) return;

    const res = await api.public.newsItem(slug);
    if (!res.success) {
      body.innerHTML = `
        <div class="text-center">
          <h2>Article not found</h2>
          <p class="text-muted mt-3">The article you're looking for does not exist or has been removed.</p>
          <a href="/pages/news.html" class="btn btn--primary mt-5">Back to News</a>
        </div>`;
      return;
    }

    const n = res.data.news;
    document.title = `${n.title} | Kelvin Ikpeni University`;
    document.getElementById('newsTitle').textContent = n.title;
    document.getElementById('newsMeta').innerHTML = `
      <span class="badge badge--accent">${esc(n.category || 'general')}</span>
      <span class="text-muted" style="font-size:var(--fs-sm);margin-left:var(--space-3);">
        <i class="far fa-calendar"></i> ${fmtDate(n.publishedAt || n.createdAt)}
      </span>
      ${n.author ? `<span class="text-muted" style="font-size:var(--fs-sm);margin-left:var(--space-3);"><i class="far fa-user"></i> ${esc(n.author.firstName || '')} ${esc(n.author.lastName || '')}</span>` : ''}
    `;

    body.innerHTML = `
      ${n.image ? `<img src="${esc(n.image)}" alt="${esc(n.title)}" style="width:100%;border-radius:var(--radius-lg);margin-bottom:var(--space-5);" />` : ''}
      <div style="font-size:var(--fs-lg);line-height:1.8;color:var(--color-text);">
        ${String(n.body || '').split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      ${(n.tags && n.tags.length) ? `
        <div class="mt-6">
          ${n.tags.map((t) => `<span class="badge badge--purple" style="margin-right:.5rem;">#${esc(t)}</span>`).join('')}
        </div>` : ''}
    `;
  }

  /* ==================================================
     EVENTS LISTING
     ================================================== */
  async function initEventsPage() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    const res = await api.public.events('?limit=50');
    const items = res.success ? res.data.events : [];
    const countEl = document.getElementById('eventsCount');
    if (countEl) countEl.textContent = `${items.length} event${items.length === 1 ? '' : 's'}`;

    if (!items.length) {
      grid.innerHTML = `
        <div class="text-center" style="grid-column:1/-1;padding:var(--space-8);">
          <div style="font-size:3rem;color:var(--color-text-muted);"><i class="fas fa-calendar"></i></div>
          <h3 class="mt-4">No events scheduled</h3>
          <p class="text-muted mt-2">Upcoming events will be announced here.</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map((ev) => {
      const d = new Date(ev.startDate);
      return `
        <a href="/pages/event.html?slug=${encodeURIComponent(ev.slug)}" class="card card--hover">
          <div class="card__body flex gap-4 items-start">
            <div style="text-align:center;flex-shrink:0;padding:var(--space-3);background:var(--color-surface-alt);border-radius:var(--radius);">
              <div style="font-family:var(--font-display);font-size:2rem;color:var(--color-primary);line-height:1;">${d.getDate()}</div>
              <div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;color:var(--color-accent-dark);font-weight:700;">
                ${d.toLocaleString(undefined, { month: 'short' })}
              </div>
            </div>
            <div style="flex:1;">
              <span class="badge badge--info">${esc(ev.category || 'event')}</span>
              <h3 class="card__title mt-2">${esc(ev.title)}</h3>
              <p class="card__text">${esc((ev.description || '').slice(0, 120))}${(ev.description || '').length > 120 ? '…' : ''}</p>
              <div class="mt-3 text-muted" style="font-size:var(--fs-xs);">
                <i class="fas fa-location-dot"></i> ${esc(ev.venue || ev.location || 'Campus')}
              </div>
            </div>
          </div>
        </a>`;
    }).join('');
  }

  /* ==================================================
     EVENT (single)
     ================================================== */
  async function initEventPage() {
    const slug = qs('slug');
    const body = document.getElementById('eventBody');
    if (!slug || !body) return;

    const res = await api.public.event(slug);
    if (!res.success) {
      body.innerHTML = `
        <div class="text-center">
          <h2>Event not found</h2>
          <p class="text-muted mt-3">This event does not exist or has been removed.</p>
          <a href="/pages/events.html" class="btn btn--primary mt-5">Back to Events</a>
        </div>`;
      return;
    }

    const ev = res.data.event;
    document.title = `${ev.title} | Kelvin Ikpeni University`;
    document.getElementById('eventTitle').textContent = ev.title;

    body.innerHTML = `
      <div class="grid" style="grid-template-columns:2fr 1fr;gap:var(--space-6);align-items:start;">
        <div>
          <div class="flex gap-3 flex-wrap mb-5">
            <span class="badge badge--info">${esc(ev.category || 'event')}</span>
            ${ev.isFeatured ? '<span class="badge badge--accent">Featured</span>' : ''}
          </div>
          <div style="font-size:var(--fs-lg);line-height:1.8;color:var(--color-text);">
            ${String(ev.description || '').split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>
        </div>
        <aside>
          <div class="card" style="padding:var(--space-6);border-top:4px solid var(--color-accent);">
            <h3 style="margin-bottom:var(--space-4);">Event Details</h3>
            <ul style="display:flex;flex-direction:column;gap:.85rem;font-size:var(--fs-sm);">
              <li><i class="far fa-calendar" style="color:var(--color-secondary);margin-right:.5rem;"></i> <strong>Start:</strong> ${fmtDate(ev.startDate)}</li>
              ${ev.endDate ? `<li><i class="far fa-calendar-check" style="color:var(--color-secondary);margin-right:.5rem;"></i> <strong>End:</strong> ${fmtDate(ev.endDate)}</li>` : ''}
              ${ev.venue ? `<li><i class="fas fa-location-dot" style="color:var(--color-secondary);margin-right:.5rem;"></i> <strong>Venue:</strong> ${esc(ev.venue)}</li>` : ''}
              ${ev.location ? `<li><i class="fas fa-map" style="color:var(--color-secondary);margin-right:.5rem;"></i> <strong>Location:</strong> ${esc(ev.location)}</li>` : ''}
              ${ev.organizer ? `<li><i class="fas fa-users" style="color:var(--color-secondary);margin-right:.5rem;"></i> <strong>Organizer:</strong> ${esc(ev.organizer)}</li>` : ''}
            </ul>
            ${ev.registrationRequired ? `
              <div class="mt-5">
                <a href="/pages/contact.html" class="btn btn--accent btn--block">Register Interest</a>
              </div>` : ''}
          </div>
        </aside>
      </div>
    `;
  }

  /* ==================================================
     ANNOUNCEMENTS
     ================================================== */
  async function initAnnouncementsPage() {
    const list = document.getElementById('announcementsList');
    if (!list) return;

    const res = await api.public.announcements('?limit=30');
    const items = res.success ? res.data.announcements : [];

    if (!items.length) {
      list.innerHTML = `
        <div class="text-center" style="padding:var(--space-8);">
          <div style="font-size:3rem;color:var(--color-text-muted);"><i class="fas fa-bullhorn"></i></div>
          <h3 class="mt-4">No announcements</h3>
          <p class="text-muted mt-2">Check back soon for university updates.</p>
        </div>`;
      return;
    }

    list.innerHTML = items.map((a) => `
      <div class="card mb-4" style="padding:var(--space-5);${a.isPinned ? 'border-left:4px solid var(--color-accent);' : ''}">
        <div class="flex justify-between items-start flex-wrap gap-3">
          <div style="flex:1;">
            ${a.isPinned ? '<span class="badge badge--accent" style="margin-right:.5rem;">Pinned</span>' : ''}
            <span class="badge badge--info">${esc(a.category || 'general')}</span>
            <h3 style="margin:var(--space-3) 0 var(--space-2);">${esc(a.title)}</h3>
            <p class="text-muted" style="font-size:var(--fs-sm);">${esc(a.excerpt || (a.body || '').slice(0, 200))}${!a.excerpt && (a.body || '').length > 200 ? '…' : ''}</p>
          </div>
        </div>
        <div class="mt-3 text-muted" style="font-size:var(--fs-xs);">
          <i class="far fa-calendar"></i> ${fmtDate(a.publishAt || a.createdAt)}
        </div>
      </div>
    `).join('');
  }

  /* ==================================================
     CONTACT FORM
     ================================================== */
  function initContactPage() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('contactBtn');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sending…';

      const data = {
        name: document.getElementById('cName').value.trim(),
        email: document.getElementById('cEmail').value.trim(),
        phone: document.getElementById('cPhone').value.trim(),
        subject: document.getElementById('cSubject').value.trim(),
        message: document.getElementById('cMessage').value.trim(),
        department: document.getElementById('cDept').value || undefined,
      };

      const res = await api.public.contact(data);

      btn.disabled = false;
      btn.innerHTML = original;

      if (res.success) {
        toast(res.message || 'Message sent. We will respond within 2 business days.', 'success');
        form.reset();
      } else {
        const msg = res.details?.length
          ? res.details.map((d) => d.message).join(', ')
          : (res.message || 'Failed to send message.');
        toast(msg, 'error');
      }
    });
  }

  /* ==================================================
     ROUTER
     ================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    switch (page) {
      case 'news': initNewsPage(); break;
      case 'news-item': initNewsItemPage(); break;
      case 'events': initEventsPage(); break;
      case 'event': initEventPage(); break;
      case 'announcements': initAnnouncementsPage(); break;
      case 'contact': initContactPage(); break;
      default: break;
    }
  });
})();