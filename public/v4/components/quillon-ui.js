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
    { id: 'about',    label: 'О нас',     href: '/about/' },
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

      // Mobile drawer items (mirrors NAV but flat list — including dropdown contents)
      const drawerItems = NAV.flatMap(item => {
        if (item.dropdown) {
          return TRACKS.map(t => `<a class="q-drawer__link" href="${t.href}">${t.title}</a>`);
        }
        const ext = item.external ? ' target="_blank" rel="noopener"' : '';
        return [`<a class="q-drawer__link" href="${item.href}"${ext}>${item.label}</a>`];
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
            <button type="button" class="q-theme-toggle" data-q-theme-toggle aria-label="Переключить тему">
              <svg class="q-theme-toggle__moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 9.5A6 6 0 1 1 6.5 2a4.5 4.5 0 0 0 7.5 7.5z"/>
              </svg>
              <svg class="q-theme-toggle__sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="3.2"/>
                <path d="M8 1.5v1.6M8 12.9v1.6M2.6 2.6l1.1 1.1M12.3 12.3l1.1 1.1M1.5 8h1.6M12.9 8h1.6M2.6 13.4l1.1-1.1M12.3 3.7l1.1-1.1"/>
              </svg>
            </button>
            <a class="q-btn q-btn--link q-topbar__login" href="/login/">Войти</a>
            <a class="q-btn q-btn--primary q-btn--sm" href="/quiz">Пройти тест</a>
            <button class="q-topbar__burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="q-drawer">
              <span></span><span></span><span></span>
            </button>
          </div>
        </header>

        <div class="q-drawer" id="q-drawer" hidden>
          <div class="q-drawer__header">
            <a href="/" class="q-drawer__brand" aria-label="Quillon">
              <img src="${logo}" alt="Quillon" width="92" height="32">
            </a>
            <button class="q-drawer__close" type="button" aria-label="Закрыть меню">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
              </svg>
            </button>
          </div>
          <nav class="q-drawer__nav" aria-label="Мобильное меню">
            ${drawerItems.split('</a>').filter(s => s.trim()).map((s, i) => `<div class="q-drawer__item" style="--i:${i}">${s}</a></div>`).join('')}
            <div class="q-drawer__divider" style="--i:${NAV.length + TRACKS.length - 1}"></div>
            <div class="q-drawer__item" style="--i:${NAV.length + TRACKS.length}"><a class="q-drawer__link q-drawer__link--muted" href="/login/">Войти</a></div>
            <div class="q-drawer__item" style="--i:${NAV.length + TRACKS.length + 1}"><a class="q-drawer__link q-drawer__link--cta" href="/quiz">Пройти тест →</a></div>
          </nav>
        </div>
      `;

      // Drawer toggle
      const burger = this.querySelector('.q-topbar__burger');
      const drawer = this.querySelector('.q-drawer');
      const closeBtn = this.querySelector('.q-drawer__close');

      const closeDrawer = () => {
        drawer.setAttribute('hidden', '');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      };
      const openDrawer = () => {
        drawer.removeAttribute('hidden');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      };

      burger?.addEventListener('click', () => {
        if (drawer.hasAttribute('hidden')) openDrawer();
        else closeDrawer();
      });
      closeBtn?.addEventListener('click', closeDrawer);

      // Close on link click
      this.querySelectorAll('.q-drawer__link').forEach(a => {
        a.addEventListener('click', closeDrawer);
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !drawer.hasAttribute('hidden')) closeDrawer();
      });

      // Theme toggle
      const themeBtn = this.querySelector('[data-q-theme-toggle]');
      themeBtn?.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', cur);
        try { localStorage.setItem('q-theme', cur); } catch {}
      });
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

                <div class="q-ft-col">
                  <h4 class="q-ft-col__title">Документы</h4>
                  <ul class="q-ft-col__list">
                    <li><a class="q-ft-link q-ft-link--ext" href="/v4/docs/oferta.html" target="_blank" rel="noopener">Оферта</a></li>
                    <li><a class="q-ft-link q-ft-link--ext" href="/v4/docs/privacy-policy.html" target="_blank" rel="noopener">Политика</a></li>
                    <li><a class="q-ft-link q-ft-link--ext" href="/v4/docs/consent-pdn.html" target="_blank" rel="noopener">Согласие на&nbsp;ПД</a></li>
                    <li><a class="q-ft-link q-ft-link--ext" href="https://islod.obrnadzor.gov.ru/view/133831" target="_blank" rel="noopener">Лицензия</a></li>
                  </ul>
                </div>
              </nav>
            </div>

            <div class="q-ft-legal">
              <p class="q-ft-legal__copy">&copy; Quillon, 2026</p>
            </div>
          </div>
        </footer>
      `;
    }
  }

  if (!customElements.get('quillon-header')) customElements.define('quillon-header', QuillonHeader);
  if (!customElements.get('quillon-footer')) customElements.define('quillon-footer', QuillonFooter);
})();
