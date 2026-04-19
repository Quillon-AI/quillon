/* ============================================================
   NEUROSTART — UI interactions
   Responsibilities:
   - Scroll reveal (IntersectionObserver adds .in to .ns-reveal)
   - FAQ accordion (single-open behavior)
   - Email capture form (validation + local persistence)
   Activated once after the renderer finishes (or on DOM ready
   as a fallback if renderer never fires).
   ============================================================ */

(function () {
  'use strict';

  let booted = false;

  function initReveal() {
    const els = document.querySelectorAll('.ns-reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('in'), i * 60);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  function initAccordion() {
    document.querySelectorAll('.ns-faq-trig').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.ns-faq-item').forEach((i) => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function persistEmail(email) {
    try {
      const list = JSON.parse(localStorage.getItem('ns_emails') || '[]');
      list.push({ email, ts: Date.now() });
      localStorage.setItem('ns_emails', JSON.stringify(list));
    } catch (_) { /* ignore quota errors */ }
  }

  function wireForm(formId, okId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const ok = document.getElementById(okId);
    const input = form.querySelector('input[name="email"]');
    if (!input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!valid) {
        input.classList.add('err');
        input.focus();
        return;
      }
      input.classList.remove('err');
      persistEmail(val);
      form.style.display = 'none';
      if (ok) ok.classList.add('on');
    });

    input.addEventListener('input', () => input.classList.remove('err'));
  }

  function initForm() {
    wireForm('nsForm', 'nsOk');
    wireForm('nsInlineForm', 'nsInlineOk');
  }

  /** Mockup list: stagger rows into view via IntersectionObserver */
  function initMockupSequence() {
    const list = document.querySelector('[data-seq-list]');
    if (!list) return;
    const rows = list.querySelectorAll('.ns-mockup-row');
    if (!rows.length) return;
    if (!('IntersectionObserver' in window)) {
      rows.forEach((r) => r.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            rows.forEach((r) => r.classList.add('in-view'));
            io.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(list);
  }

  /** Timeline: mark reached dots via per-item IO; paint rail from reached ratio */
  function initTimelineProgress() {
    const tl = document.querySelector('[data-tl-progress]');
    if (!tl) return;
    const items = Array.from(tl.querySelectorAll('.ns-tl-item'));
    if (!items.length) return;

    const reduce =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      tl.style.setProperty('--tl-progress', '100%');
      items.forEach((i) => i.classList.add('reached'));
      return;
    }

    const repaint = () => {
      const reached = items.filter((i) => i.classList.contains('reached')).length;
      const pct = Math.min(100, (reached / items.length) * 100);
      tl.style.setProperty('--tl-progress', pct.toFixed(1) + '%');
    };

    // Sentinel sits at 55vh from top — items above it are considered reached.
    // Use a 1px-tall rootMargin trick: shrink viewport so intersection happens
    // when item's center crosses 55% from top.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const it = entry.target;
          if (entry.boundingClientRect.top < entry.rootBounds.top + entry.rootBounds.height * 0.05) {
            it.classList.add('reached');
          } else {
            it.classList.remove('reached');
          }
        });
        repaint();
      },
      {
        // shrink bottom so only top 55vh is "active"; items entering this band activate
        rootMargin: '0px 0px -45% 0px',
        threshold: 0,
      }
    );
    items.forEach((it) => io.observe(it));
    repaint();
  }

  function boot() {
    if (booted) return;
    booted = true;
    initReveal();
    initAccordion();
    initForm();
    initMockupSequence();
    initTimelineProgress();
  }

  // Primary trigger: renderer finished populating the DOM
  document.addEventListener('neurostart:rendered', boot);
  // Fallback: if renderer fails or is absent, boot on DOM ready anyway
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1500));
  } else {
    setTimeout(boot, 1500);
  }
})();
