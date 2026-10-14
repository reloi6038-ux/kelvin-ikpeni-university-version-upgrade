/**
 * public/js/home.js
 * Homepage-only interactivity:
 *   - Hero slideshow (8 slides, autoplay, dots, arrows, keyboard, pause on hover)
 *   - Animated stat counters
 *   - Testimonial carousel
 */
(function () {
  'use strict';

  if (document.body.dataset.page !== 'home') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================
     HERO SLIDESHOW
     ========================================= */
  function initHeroSlideshow() {
    const slides = document.querySelectorAll('.home-hero__slide');
    const dotsWrap = document.getElementById('homeHeroDots');
    const prevBtn = document.getElementById('homeHeroPrev');
    const nextBtn = document.getElementById('homeHeroNext');
    if (!slides.length || !dotsWrap) return;

    let current = 0;
    let timer = null;
    const INTERVAL = 5500; // 5.5 seconds per slide

    // Build dots
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'home-hero__dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('aria-label', `Go to slide ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });
    const dots = dotsWrap.querySelectorAll('.home-hero__dot');

    const goTo = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === current));
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === current));
      restart();
    };
    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const start = () => {
      if (prefersReducedMotion) return;
      clearInterval(timer);
      timer = setInterval(next, INTERVAL);
    };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };

    nextBtn && nextBtn.addEventListener('click', next);
    prevBtn && prevBtn.addEventListener('click', prev);

    // Pause on hover (desktop)
    const hero = document.querySelector('.home-hero');
    if (hero) {
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
    }

    // Pause when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    // Keyboard controls (arrow keys when hero is focused)
    if (hero) {
      hero.setAttribute('tabindex', '-1');
      hero.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });
    }

    // Touch swipe support for mobile
    let touchStartX = 0;
    if (hero) {
      hero.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      hero.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 50) {
          if (dx < 0) next();
          else prev();
        }
      }, { passive: true });
    }

    // Start immediately
    start();
  }

  /* =========================================
     ANIMATED COUNTERS
     ========================================= */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const runCounter = (el) => {
      const target = parseFloat(el.dataset.counter);
      const duration = 1600;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const isDecimal = String(target).includes('.');

      if (prefersReducedMotion) {
        el.textContent = prefix + (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
        return;
      }

      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = target * eased;
        el.textContent = prefix + (isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString()) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    counters.forEach((el) => io.observe(el));
  }

  /* =========================================
     TESTIMONIAL CAROUSEL
     ========================================= */
  function initTestimonialCarousel() {
    const track = document.getElementById('testimonialTrack');
    const dotsWrap = document.getElementById('testimonialDots');
    if (!track || !dotsWrap) return;

    const slides = track.children;
    if (!slides.length) return;

    const getPerPage = () => (window.innerWidth >= 900 ? 3 : 1);
    let index = 0;

    const buildDots = () => {
      const perPage = getPerPage();
      const pages = Math.max(1, Math.ceil(slides.length / perPage));
      dotsWrap.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 'home-testimonials__dot' + (i === index ? ' is-active' : '');
        d.setAttribute('aria-label', `Go to testimonial page ${i + 1}`);
        d.addEventListener('click', () => { index = i; render(); });
        dotsWrap.appendChild(d);
      }
    };

    const render = () => {
      const perPage = getPerPage();
      const pages = Math.max(1, Math.ceil(slides.length / perPage));
      if (index >= pages) index = pages - 1;
      if (index < 0) index = 0;
      const offset = -(index * 100);
      track.style.transform = `translateX(${offset}%)`;
      dotsWrap.querySelectorAll('.home-testimonials__dot').forEach((d, i) =>
        d.classList.toggle('is-active', i === index)
      );
    };

    const rebuild = () => {
      index = 0;
      buildDots();
      render();
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 200);
    });

    rebuild();

    if (!prefersReducedMotion) {
      let auto = setInterval(() => {
        const perPage = getPerPage();
        const pages = Math.max(1, Math.ceil(slides.length / perPage));
        index = (index + 1) % pages;
        render();
      }, 7000);
      track.addEventListener('mouseenter', () => clearInterval(auto));
      track.addEventListener('mouseleave', () => {
        auto = setInterval(() => {
          const perPage = getPerPage();
          const pages = Math.max(1, Math.ceil(slides.length / perPage));
          index = (index + 1) % pages;
          render();
        }, 7000);
      });
    }
  }

  /* =========================================
     INIT
     ========================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroSlideshow();
    initCounters();
    initTestimonialCarousel();
  });
})();