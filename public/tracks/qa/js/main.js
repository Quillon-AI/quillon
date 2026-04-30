/* ─────────────────────────────────────────────────────────────────
 * Quillon track page — main.js
 *
 * Dependency graph (bottom-up, no circular deps):
 *   safeStorage  ←  initCookieBanner, initThemeToggle
 *   trackGoal    ←  initForm
 *   initTabs(root) — generic, called with #cases
 *   initSmoothScroll — self-contained
 * ───────────────────────────────────────────────────────────────── */

'use strict';

// ── Analytics ─────────────────────────────────────────────────────
const YM_ID = 108311343;

function trackGoal(goal) {
  try { if (window.ym) window.ym(YM_ID, 'reachGoal', goal); } catch (_) {}
}

// ── Safe localStorage (throws on private browsing / storage full) ──
const safeStorage = {
  get(k)    { try { return localStorage.getItem(k);    } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v);        } catch (_) {} },
};

// ── Generic ARIA tablist ───────────────────────────────────────────
// OCP: pass any root element — works for #cases or any future tabbed component
function initTabs(root) {
  if (!root) return;
  const tabs   = root.querySelectorAll('[role="tab"]');
  const panels = root.querySelectorAll('[role="tabpanel"]');

  function activate(id) {
    tabs.forEach(t => {
      const on = t.id === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => {
      const on = p.getAttribute('aria-labelledby') === id;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t.id));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const dir  = e.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      activate(next.id);
    });
  });
}

// ── Generic form submit ────────────────────────────────────────────
// SRP: one submit handler shared by all track forms
// btnLabel optional: contact form passes it, lead form doesn't
function initForm(form, ymGoal, btnLabel) {
  if (!form) return;
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    trackGoal(ymGoal);
    form.classList.add('is-sent');
    if (btnLabel) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = btnLabel; btn.disabled = true; }
    }
  });
}

// ── Cookie banner ──────────────────────────────────────────────────
function initCookieBanner() {
  const KEY = 'q-cookie-ok';
  const el  = document.getElementById('q-cookie');
  if (!el) return;
  if (safeStorage.get(KEY)) return;

  setTimeout(() => el.classList.add('is-visible'), 800);

  function dismiss(value) {
    safeStorage.set(KEY, value);
    el.classList.remove('is-visible');
  }

  el.querySelector('[data-q-cookie-accept]' ).addEventListener('click', () => dismiss('accept'));
  el.querySelector('[data-q-cookie-dismiss]').addEventListener('click', () => dismiss('necessary'));
}

// ── Theme toggle ───────────────────────────────────────────────────
function initThemeToggle() {
  const btn = document.querySelector('[data-q-theme-toggle]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    safeStorage.set('q-theme', next);
  });
}

// ── Smooth scroll ──────────────────────────────────────────────────
function initSmoothScroll() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 720;

  function ease(t) { return 1 - Math.pow(1 - t, 4); }

  function topbarOffset() {
    const bar = document.querySelector('.q-topbar');
    return bar ? bar.getBoundingClientRect().height + 8 : 64;
  }

  function scrollTo(targetY) {
    const startY = window.pageYOffset;
    const dist   = targetY - startY;
    if (Math.abs(dist) < 2) return;
    if (prefersReduced) { window.scrollTo(0, targetY); return; }
    const startT = performance.now();
    function step(now) {
      const p = Math.min(1, (now - startT) / DURATION);
      window.scrollTo(0, startY + dist * ease(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('click', ev => {
    const link = ev.target.closest('a[href^="#"]');
    if (!link) return;
    const href   = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    ev.preventDefault();
    scrollTo(target.getBoundingClientRect().top + window.pageYOffset - topbarOffset());
    if (history.replaceState) history.replaceState(null, '', href);
  }, { passive: false });
}

// ── Boot ───────────────────────────────────────────────────────────
initTabs(document.getElementById('cases'));
initCookieBanner();
initThemeToggle();
initForm(
  document.getElementById('cf-track-form'),
  'track_contact_submit',
  'Заявка отправлена ✓'
);
initForm(
  document.querySelector('[data-q-lead-form]'),
  'lead_form_submit'
);
initSmoothScroll();
