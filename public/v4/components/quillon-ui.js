/* ═══════════════════════════════════════════════════════════════════
 * Quillon UI — shared <quillon-header> + <quillon-footer> components
 *
 * Usage:
 *   <quillon-header accent="mint" current="blog"></quillon-header>
 *   <quillon-footer></quillon-footer>
 *
 * Attributes (header):
 *   accent="default|mint"  — active link + CTA + logo tail color
 *   current="tracks|blog|tech|projects|about"  — highlight active link
 *
 * Light DOM (no Shadow DOM) — links indexable by crawlers; styles
 * cascade from page-level CSS (components.css). Self-contained CSS
 * tokens fallback so the component works on any page.
 * ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const TRACKS = [
    { href: '/tracks/python-backend-ml/', title: 'Python Backend + ML', sub: 'FastAPI · Django · ML · 12 мес' },
    { href: '/tracks/flutter/',           title: 'Flutter Developer',  sub: 'iOS + Android из одного кода · 12 мес' },
    { href: '/tracks/qa/',                title: 'QA Automation',      sub: 'pytest · Playwright · CI/CD · 12 мес' },
  ];

  const NAV = [
    { id: 'tracks',   label: 'Все треки', dropdown: true },
    { id: 'blog',     label: 'Блог',      href: '/blog/' },
    { id: 'tech',     label: 'Tech',      href: 'https://tech.quillon.ru', external: true },
    { id: 'projects', label: 'Проекты',   href: '/#products' },
    { id: 'about',    label: 'О нас',     href: '/#about' },
  ];

  function logoFor(accent) {
    return accent === 'mint'
      ? '/v4/assets/brand/logo-mint.svg'
      : '/v4/assets/brand/logo.svg';
  }

  function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  /* ─── <quillon-header> ─── */
  class QuillonHeader extends HTMLElement {
    connectedCallback() {
      const accent = this.getAttribute('accent') || 'default';
      const current = this.getAttribute('current') || '';
      const logo = logoFor(accent);

      const navItems = NAV.map(item => {
        const isActive = item.id === current ? ' aria-current="page"' : '';
        if (item.dropdown) {
          const dropdownItems = TRACKS.map(t => `
            <a class="q-topbar__dropdown-item" href="${t.href}" role="menuitem">
              ${t.title}
              <span class="q-topbar__dropdown-item__sub">${t.sub}</span>
            </a>`).join('');
          return `
            <div class="q-topbar__dropdown">
              <button class="q-topbar__link q-topbar__dropdown-toggle"${isActive} type="button" aria-haspopup="true" aria-expanded="false">
                ${item.label}
                <svg class="q-topbar__dropdown-toggle__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 8 11 13 6"/></svg>
              </button>
              <div class="q-topbar__dropdown-menu" role="menu">${dropdownItems}</div>
            </div>`;
        }
        const ext = item.external ? ' target="_blank" rel="noopener"' : '';
        return `<a class="q-topbar__link" href="${item.href}"${ext}${isActive}>${item.label}</a>`;
      }).join('');

      this.innerHTML = `
        <header class="q-topbar" data-accent="${escAttr(accent)}">
          <a href="/" class="q-topbar__brand" aria-label="Quillon">
            <img class="q-topbar__brand-img" src="${logo}" alt="Quillon" width="92" height="32">
          </a>

          <nav class="q-topbar__nav" aria-label="Главная навигация">
            ${navItems}
          </nav>

          <div class="q-topbar__actions">
            <a class="q-btn q-btn--link" href="/login/">Войти</a>
            <a class="q-btn q-btn--primary q-btn--sm" href="/quiz">Пройти тест</a>
          </div>
        </header>
      `;
    }
  }

  /* ─── <quillon-footer> ─── */
  class QuillonFooter extends HTMLElement {
    connectedCallback() {
      const accent = this.getAttribute('accent') || 'default';
      const logo = logoFor(accent);

      this.innerHTML = `
        <footer class="q-section q-ft" id="footer" data-accent="${escAttr(accent)}">
          <div class="q-container">
            <div class="q-ft-top">

              <div class="q-ft-brand">
                <a class="q-ft-brand__logo" href="/" aria-label="Quillon">
                  <img class="q-ft-brand__img" src="${logo}" alt="Quillon" width="103" height="36">
                </a>
                <p class="q-ft-brand__tagline">Продукты. Команды. Реальный доход.</p>
              </div>

              <nav class="q-ft-sitemap" aria-label="Карта сайта">
                <div class="q-ft-col">
                  <h4 class="q-ft-col__title">Направления</h4>
                  <ul class="q-ft-col__list">
                    <li><a class="q-ft-link" href="/tracks/python-backend-ml/">Python Backend + ML</a></li>
                    <li><a class="q-ft-link" href="/tracks/flutter/">Flutter Developer</a></li>
                    <li><a class="q-ft-link" href="/tracks/qa/">QA Automation</a></li>
                  </ul>
                </div>

                <div class="q-ft-col">
                  <h4 class="q-ft-col__title">Компания</h4>
                  <ul class="q-ft-col__list">
                    <li><a class="q-ft-link" href="/blog/">Блог</a></li>
                    <li><a class="q-ft-link" href="/#products">Продукты</a></li>
                    <li><a class="q-ft-link" href="https://tech.quillon.ru" target="_blank" rel="noopener">Quillon Tech</a></li>
                  </ul>
                </div>

                <div class="q-ft-col">
                  <h4 class="q-ft-col__title">Программа</h4>
                  <ul class="q-ft-col__list">
                    <li><a class="q-ft-link" href="/#format">Формат</a></li>
                    <li><a class="q-ft-link" href="/#pricing">Стоимость</a></li>
                    <li><a class="q-ft-link" href="/#faq">Вопросы</a></li>
                    <li><a class="q-ft-link" href="/quiz">Пройти тест</a></li>
                  </ul>
                </div>
              </nav>
            </div>

            <div class="q-ft-legal">
              <p class="q-ft-legal__copy">&copy; Quillon, 2026</p>
              <ul class="q-ft-legal__links">
                <li><a class="q-ft-legal__link" href="/v4/docs/oferta.html" target="_blank" rel="noopener">Оферта</a></li>
                <li><a class="q-ft-legal__link" href="/v4/docs/privacy-policy.html" target="_blank" rel="noopener">Политика</a></li>
                <li><a class="q-ft-legal__link" href="/v4/docs/consent-pdn.html" target="_blank" rel="noopener">Согласие на ПД</a></li>
                <li><a class="q-ft-legal__link" href="https://islod.obrnadzor.gov.ru/view/133831" target="_blank" rel="noopener">Лицензия</a></li>
              </ul>
            </div>
          </div>
        </footer>
      `;
    }
  }

  if (!customElements.get('quillon-header')) customElements.define('quillon-header', QuillonHeader);
  if (!customElements.get('quillon-footer')) customElements.define('quillon-footer', QuillonFooter);
})();
