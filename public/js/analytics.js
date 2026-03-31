/* ==========================================================================
   Quillon — Analytics Module
   Yandex.Metrika event tracking: sections, CTA, scroll depth,
   time on page, outbound links, FAQ, chat demo, form, theme toggle.
   ========================================================================== */

function initAnalytics() {
  'use strict';

  if (typeof ym !== 'function') return;
  var YM_ID = 108311343;

  /* ── 1. Section view tracking (IntersectionObserver) ──────────────── */
  var trackedSections = {};
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var sectionId = entry.target.id;
        if (sectionId && !trackedSections[sectionId]) {
          trackedSections[sectionId] = true;
          ym(YM_ID, 'reachGoal', 'section_view_' + sectionId);
        }
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('section[id]').forEach(function (section) {
    sectionObserver.observe(section);
  });

  /* ── 2. CTA click tracking ────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;

    var text = (btn.textContent || '').trim();
    var section = btn.closest('section');
    var location = section ? (section.id || 'unknown') : 'navbar';

    ym(YM_ID, 'reachGoal', 'cta_click', {
      cta: text,
      location: location
    });
  });

  /* ── 3. Scroll depth tracking (25%, 50%, 75%, 100%) ───────────────── */
  var scrollThresholds = { 25: false, 50: false, 75: false, 100: false };
  var scrollTicking = false;

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { scrollTicking = false; return; }

      var percent = Math.round((scrollTop / docHeight) * 100);

      if (percent >= 25 && !scrollThresholds[25]) {
        scrollThresholds[25] = true;
        ym(YM_ID, 'reachGoal', 'scroll_25');
      }
      if (percent >= 50 && !scrollThresholds[50]) {
        scrollThresholds[50] = true;
        ym(YM_ID, 'reachGoal', 'scroll_50');
      }
      if (percent >= 75 && !scrollThresholds[75]) {
        scrollThresholds[75] = true;
        ym(YM_ID, 'reachGoal', 'scroll_75');
      }
      if (percent >= 100 && !scrollThresholds[100]) {
        scrollThresholds[100] = true;
        ym(YM_ID, 'reachGoal', 'scroll_100');
      }

      scrollTicking = false;
    });
  }, { passive: true });

  /* ── 4. Time on page tracking (30s, 60s, 180s) ───────────────────── */
  setTimeout(function () {
    ym(YM_ID, 'reachGoal', 'time_30s');
  }, 30000);

  setTimeout(function () {
    ym(YM_ID, 'reachGoal', 'time_60s');
  }, 60000);

  setTimeout(function () {
    ym(YM_ID, 'reachGoal', 'time_180s');
  }, 180000);

  /* ── 5. Outbound link click tracking ──────────────────────────────── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    /* Track links that go to external domains */
    if (href.indexOf('http') === 0 && href.indexOf(location.hostname) === -1) {
      ym(YM_ID, 'reachGoal', 'outbound_click', { url: href });
    }
  });

  /* ── 6. FAQ open tracking ─────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var faqQ = e.target.closest('.faq-q');
    if (!faqQ) return;

    var faqItem = faqQ.closest('.faq-item');
    if (!faqItem) return;

    /* Only track opening, not closing */
    if (!faqItem.classList.contains('open')) {
      var questionText = (faqQ.textContent || '').trim();
      ym(YM_ID, 'reachGoal', 'faq_open', { question: questionText });
    }
  });

  /* ── 7. Chat demo interaction tracking ────────────────────────────── */
  var chatTracked = false;
  document.addEventListener('click', function (e) {
    var sendBtn = e.target.closest('.chat-demo-send');
    if (!sendBtn) return;

    if (!chatTracked) {
      chatTracked = true;
      ym(YM_ID, 'reachGoal', 'chat_demo_interaction');
    }
  });

  /* Also track Enter key in chat input */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('chat-demo-input')) {
      if (!chatTracked) {
        chatTracked = true;
        ym(YM_ID, 'reachGoal', 'chat_demo_interaction');
      }
    }
  });

  /* ── 8. Form submission tracking (lead) ───────────────────────────── */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form="contact"]');
    if (!form) return;
    ym(YM_ID, 'reachGoal', 'lead_submit');
  });

  /* ── 9. Theme toggle tracking ─────────────────────────────────────── */
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      /* Read the theme AFTER the toggle logic in interactions.js applies */
      setTimeout(function () {
        var currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        ym(YM_ID, 'reachGoal', 'theme_toggle', { theme: currentTheme });
      }, 50);
    });
  }
}

window.initAnalytics = initAnalytics;
