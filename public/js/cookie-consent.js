/**
 * public/js/cookie-consent.js
 * Shows a cookie consent banner on first visit.
 * Remembers consent via localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'kiu_cookie_consent_v1';

  function getStoredConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function setStoredConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {
      // ignore (private mode, etc.)
    }
  }

  function hideBanner(banner) {
    banner.classList.add('is-hidden');
    setTimeout(() => banner.remove(), 450);
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <div class="cookie-banner__content">
        <div class="cookie-banner__icon"><i class="fas fa-cookie-bite"></i></div>
        <div class="cookie-banner__text">
          <h3>We value your privacy</h3>
          <p>
            We use essential cookies to make this site work, and optional cookies
            to improve your experience and understand how the site is used. See our
            <a href="/pages/privacy.html">Privacy Policy</a> for details.
          </p>
        </div>
      </div>
      <div class="cookie-banner__actions">
        <button class="btn btn--ghost btn--sm" data-cookie="essential">Essential Only</button>
        <button class="btn btn--accent btn--sm" data-cookie="all">Accept All</button>
      </div>
    `;

    banner.querySelectorAll('[data-cookie]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.cookie; // 'essential' | 'all'
        setStoredConsent(value);
        hideBanner(banner);
        // Fire a CustomEvent so future analytics scripts can react
        window.dispatchEvent(new CustomEvent('kiu:consent', { detail: { value } }));
      });
    });

    document.body.appendChild(banner);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Skip on admin pages
    if (document.body.dataset.page && document.body.dataset.page.startsWith('admin-')) return;
    if (getStoredConsent()) return; // already decided
    buildBanner();
  });
})();