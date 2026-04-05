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

  function initForm() {
    const form = document.getElementById('nsForm');
    if (!form) return;
    const ok = document.getElementById('nsOk');
    const input = form.querySelector('input[name="email"]');

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
      // TODO: send to backend endpoint when available
      // fetch('/api/neurostart/subscribe', { method:'POST', body: JSON.stringify({ email: val }) });
      form.style.display = 'none';
      ok.classList.add('on');
    });

    input.addEventListener('input', () => input.classList.remove('err'));
  }

  function boot() {
    if (booted) return;
    booted = true;
    initReveal();
    initAccordion();
    initForm();
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
