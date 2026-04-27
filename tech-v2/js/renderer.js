/* ==========================================================================
   Quillon Tech — Config-Driven Section Renderer
   Loads content from JSON config files, renders all sections into the DOM.
   After rendering, calls window.initApp() which is defined in app.js.
   ========================================================================== */

(async function () {
  'use strict';

  /* ----------------------------------------
     1. Load JSON data
     ---------------------------------------- */
  const [content, sections, settings] = await Promise.all([
    fetch('/content/content.json').then(function (r) { return r.json(); }),
    fetch('/content/sections.json').then(function (r) { return r.json(); }),
    fetch('/content/settings.json').then(function (r) { return r.json(); })
  ]);

  /* ----------------------------------------
     2. Apply meta tags from settings
     ---------------------------------------- */
  document.title = settings.meta.title;

  function setMeta(attr, key, val) {
    if (!val) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  }

  setMeta('name', 'description', settings.meta.description);
  setMeta('name', 'keywords', settings.meta.keywords);
  setMeta('property', 'og:title', settings.meta.og_title);
  setMeta('property', 'og:description', settings.meta.og_description);
  setMeta('property', 'og:image', settings.meta.og_image);
  setMeta('property', 'og:url', settings.meta.canonical);
  setMeta('property', 'og:locale', settings.meta.locale);
  setMeta('property', 'og:site_name', settings.meta.site_name);

  /* ----------------------------------------
     3. Helper: escape HTML to prevent XSS
     ---------------------------------------- */
  // Note: content.json is trusted (our own config), so we allow HTML in
  // specific fields (title with <br>, answer with links). No user input
  // is rendered, so we skip escaping intentionally.

  /* ----------------------------------------
     4. Section renderer functions
     ---------------------------------------- */

  function renderNavbar(navbar) {
    var linksHtml = navbar.links.map(function (l) {
      return '<li><a href="' + l.href + '">' + l.text + '</a></li>';
    }).join('\n        ');

    var mobileLinksHtml = navbar.links.map(function (l) {
      return '<a href="' + l.href + '" data-close-menu>' + l.text + '</a>';
    }).join('\n  ');

    return '<nav class="navbar" id="navbar">\n' +
      '  <div class="navbar__inner">\n' +
      '    <a href="#" class="navbar__brand">\n' +
      '      <svg class="navbar__logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
      '        <defs><linearGradient id="q-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>\n' +
      '        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#q-grad)"/>\n' +
      '        <text x="16" y="23" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="20" fill="#fff">Q</text>\n' +
      '      </svg>\n' +
      '      <span class="navbar__logo-text">\n' +
      '        <span class="navbar__logo-name">' + navbar.brand + '</span>\n' +
      '        <span class="navbar__logo-suffix">' + navbar.suffix + '</span>\n' +
      '      </span>\n' +
      '    </a>\n' +
      '    <ul class="navbar__links">\n' +
      '      ' + linksHtml + '\n' +
      '      <li></li>\n' +
      '    </ul>\n' +
      '    <div class="navbar__right">\n' +
      '      <button class="theme-toggle" id="theme-toggle" aria-label="\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0442\u0435\u043C\u0443">\n' +
      '        <i data-lucide="sun" class="icon-sun"></i>\n' +
      '        <i data-lucide="moon" class="icon-moon"></i>\n' +
      '      </button>\n' +
      '      <button class="navbar__hamburger" id="hamburger" aria-label="\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E">\n' +
      '        <span></span><span></span><span></span>\n' +
      '      </button>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</nav>\n' +
      '<div class="navbar__mobile-menu" id="mobile-menu">\n' +
      '  ' + mobileLinksHtml + '\n' +
      '</div>';
  }

  function renderHero(data) {
    var statsHtml = data.stats.map(function (s) {
      return '      <div class="hero__stat">\n' +
        '        <div class="hero__stat-value">' + s.value + '</div>\n' +
        '        <div class="hero__stat-label">' + s.label + '</div>\n' +
        '      </div>';
    }).join('\n');

    var matrix = data.build_matrix || { products: [], deploys: [], uptime: [] };

    var productsRows = (matrix.products || []).map(function (p) {
      return '          <div class="hero__matrix-row">\n' +
        '            <span class="hero__matrix-name">' + p.name + '</span>\n' +
        '            <span class="hero__matrix-meta">' + p.meta + '</span>\n' +
        '          </div>';
    }).join('\n');

    var deploysRows = (matrix.deploys || []).map(function (d) {
      return '          <div class="hero__matrix-row hero__matrix-row--single">\n' +
        '            <span class="hero__matrix-name">' + d + '</span>\n' +
        '          </div>';
    }).join('\n');

    var uptimeRows = (matrix.uptime || []).map(function (u) {
      return '          <div class="hero__matrix-row hero__matrix-uptime">\n' +
        '            <span class="hero__matrix-name">' + u.label + '</span>\n' +
        '            <span class="hero__matrix-bar-wrap">\n' +
        '              <span class="hero__matrix-bar" style="width:' + u.value + '%"></span>\n' +
        '            </span>\n' +
        '            <span class="hero__matrix-meta">' + u.value.toFixed(2) + '%</span>\n' +
        '          </div>';
    }).join('\n');

    var eyebrowHtml = data.eyebrow ? '    <div class="hero__eyebrow">' + data.eyebrow + '</div>\n' : '';
    var ctaText = data.cta_primary || (data.cta && data.cta.text) || '';
    var ctaHref = (data.cta && data.cta.href) || '#contact';

    return '<section class="hero container" id="hero">\n' +
      '  <canvas class="hero__canvas" id="hero-canvas"></canvas>\n' +
      '  <div class="hero__gradient-overlay"></div>\n' +
      '  <div class="hero__radial-glow"></div>\n' +
      '  <div class="hero__scroll-overlay" id="hero-scroll-overlay"></div>\n' +
      '  <div class="hero__content fade-in">\n' +
      eyebrowHtml +
      '    <h1 class="hero__title" id="hero-title">' + data.title + '</h1>\n' +
      '    <p class="hero__subtitle">' + data.subtitle + '</p>\n' +
      '    <div class="hero__cta">\n' +
      '      <a href="' + ctaHref + '" class="btn-primary">' + ctaText + '</a>\n' +
      '      <span class="hero__cta-note">' + data.cta_note + '</span>\n' +
      '    </div>\n' +
      '    <div class="hero__stats-strip">\n' +
      statsHtml + '\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="hero__visual fade-in">\n' +
      '    <div class="hero__build-matrix">\n' +
      '      <div class="hero__matrix-block">\n' +
      '        <div class="hero__matrix-heading">// PRODUCTS</div>\n' +
      productsRows + '\n' +
      '      </div>\n' +
      '      <div class="hero__matrix-block">\n' +
      '        <div class="hero__matrix-heading">// RECENT DEPLOYS</div>\n' +
      deploysRows + '\n' +
      '      </div>\n' +
      '      <div class="hero__matrix-block">\n' +
      '        <div class="hero__matrix-heading">// UPTIME · 30D</div>\n' +
      uptimeRows + '\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderStudio(data) {
    var pointsHtml = data.selling_points.map(function (sp) {
      return '      <div class="studio__point">\n' +
        '        <div class="studio__point-icon"><i data-lucide="' + sp.icon + '"></i></div>\n' +
        '        <div class="studio__point-title">' + sp.title + '</div>\n' +
        '        <p class="studio__point-desc">' + sp.description + '</p>\n' +
        '      </div>';
    }).join('\n');

    var typesHtml = data.types.map(function (t) {
      var stackHtml = t.stack.map(function (s) {
        return '<span class="type-card__tag">' + s + '</span>';
      }).join('');

      return '        <div class="type-card">\n' +
        '          <div class="type-card__icon"><i data-lucide="' + t.icon + '"></i></div>\n' +
        '          <h3 class="type-card__name">' + t.name + '</h3>\n' +
        '          <p class="type-card__desc">' + t.description + '</p>\n' +
        '          <div class="type-card__price">' + t.price + '</div>\n' +
        '          <div class="type-card__stack">\n' +
        '            ' + stackHtml + '\n' +
        '          </div>\n' +
        '        </div>';
    }).join('\n');

    var stepsHtml = data.steps.map(function (s) {
      return '        <div class="step-card">\n' +
        '          <div class="step-card__number">' + s.number + '</div>\n' +
        '          <div class="step-card__title">' + s.title + '</div>\n' +
        '          <p class="step-card__desc">' + s.description + '</p>\n' +
        '          <div class="step-card__result">' + s.result + '</div>\n' +
        '        </div>';
    }).join('\n');

    return '<section class="studio container" id="studio" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <p class="studio__utp fade-in">' + data.utp + '</p>\n' +
      '  <p class="studio__price-anchors fade-in">' + data.price_anchors + '</p>\n' +
      '  <div class="studio__points fade-in">\n' +
      pointsHtml + '\n' +
      '  </div>\n' +
      '  <div class="fade-in">\n' +
      '    <div class="studio__types-title">' + data.types_title + '</div>\n' +
      '    <div class="studio__types-grid">\n' +
      typesHtml + '\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="studio__steps fade-in">\n' +
      '    <div class="studio__steps-title">' + data.steps_title + '</div>\n' +
      '    <div class="steps-grid">\n' +
      stepsHtml + '\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderProducts(data) {
    function renderVisual(type, name) {
      if (type === 'video-grid') {
        return '<div class="product-mock product-mock--video-grid">\n' +
          '  <div class="product-mock__tile"></div>\n' +
          '  <div class="product-mock__tile"></div>\n' +
          '  <div class="product-mock__tile"></div>\n' +
          '  <div class="product-mock__tile"></div>\n' +
          '  <div class="product-mock__label">' + name + '</div>\n' +
          '</div>';
      }
      if (type === 'dashboard') {
        return '<div class="product-mock product-mock--dashboard">\n' +
          '  <div class="product-mock__row"><span class="product-mock__dot"></span><span class="product-mock__text"></span><span class="product-mock__pill">active</span></div>\n' +
          '  <div class="product-mock__row"><span class="product-mock__dot"></span><span class="product-mock__text"></span><span class="product-mock__pill">done</span></div>\n' +
          '  <div class="product-mock__row"><span class="product-mock__dot"></span><span class="product-mock__text"></span><span class="product-mock__pill">queued</span></div>\n' +
          '  <div class="product-mock__bars">\n' +
          '    <span class="product-mock__bar" style="height:40%"></span>\n' +
          '    <span class="product-mock__bar" style="height:72%"></span>\n' +
          '    <span class="product-mock__bar" style="height:55%"></span>\n' +
          '    <span class="product-mock__bar" style="height:88%"></span>\n' +
          '    <span class="product-mock__bar" style="height:62%"></span>\n' +
          '    <span class="product-mock__bar" style="height:78%"></span>\n' +
          '  </div>\n' +
          '  <div class="product-mock__label">' + name + '</div>\n' +
          '</div>';
      }
      if (type === 'chat') {
        return '<div class="product-mock product-mock--chat">\n' +
          '  <div class="product-mock__bubble product-mock__bubble--in">Как развернуть Meet локально?</div>\n' +
          '  <div class="product-mock__bubble product-mock__bubble--out">git pull · docker compose up</div>\n' +
          '  <div class="product-mock__bubble product-mock__bubble--in">А CI-пайплайн?</div>\n' +
          '  <div class="product-mock__label">' + name + '</div>\n' +
          '</div>';
      }
      if (type === 'list') {
        return '<div class="product-mock product-mock--list">\n' +
          '  <div class="product-mock__list-row"><span>FastAPI · backend</span><span class="product-mock__badge">₽120k</span></div>\n' +
          '  <div class="product-mock__list-row"><span>Flutter · mobile</span><span class="product-mock__badge">₽80k</span></div>\n' +
          '  <div class="product-mock__list-row"><span>QA · автотесты</span><span class="product-mock__badge">₽45k</span></div>\n' +
          '  <div class="product-mock__list-row"><span>RAG · LLM pipeline</span><span class="product-mock__badge">₽160k</span></div>\n' +
          '  <div class="product-mock__list-row"><span>Next.js · лендинг</span><span class="product-mock__badge">₽30k</span></div>\n' +
          '  <div class="product-mock__label">' + name + '</div>\n' +
          '</div>';
      }
      return '<div class="product-mock"></div>';
    }

    var itemsHtml = data.items.map(function (p, i) {
      var idx = String(i + 1).padStart(2, '0');
      var category = p.category || 'PRODUCT';
      var stackHtml = p.stack.map(function (s) {
        return '<span class="product-stack-item__tag">' + s + '</span>';
      }).join('');
      var linkHtml = '';
      if (p.link) {
        linkHtml = '<a href="' + p.link + '" target="_blank" rel="noopener" class="product-stack-item__link">' + p.link_text + ' <i data-lucide="arrow-up-right"></i></a>';
      }

      return '    <div class="product-stack-item fade-in" data-visual="' + (p.visual_type || '') + '">\n' +
        '      <div class="product-stack-item__content">\n' +
        '        <div class="product-stack-item__eyebrow">// PRODUCT ' + idx + ' · ' + category + '</div>\n' +
        '        <h3 class="product-stack-item__name">' + p.name + '</h3>\n' +
        '        <p class="product-stack-item__tagline">' + p.tagline + '</p>\n' +
        '        <div class="product-stack-item__stack">' + stackHtml + '</div>\n' +
        '        <p class="product-stack-item__highlight">' + p.highlight + '</p>\n' +
        (linkHtml ? '        ' + linkHtml + '\n' : '') +
        '      </div>\n' +
        '      <div class="product-stack-item__visual">\n' +
        '        ' + renderVisual(p.visual_type, p.name) + '\n' +
        '      </div>\n' +
        '    </div>';
    }).join('\n');

    return '<section class="products container" id="products" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '  </div>\n' +
      '  <div class="products__stack">\n' +
      itemsHtml + '\n' +
      '  </div>\n' +
      '  <div class="inline-cta">\n' +
      '    <a href="' + data.cta.href + '" class="inline-cta__btn">' + data.cta.text + '</a>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderTechStack(data) {
    // Pre-defined 5-layer order with custom labels (overrides content.categories order)
    var LAYERS = [
      { ids: ['mobile'], label: 'Frontend & Mobile', sublabel: 'клиенты' },
      { ids: ['backend'], label: 'Backend', sublabel: 'API, бизнес-логика' },
      { ids: ['ai_ml'],   label: 'AI / ML',  sublabel: 'модели, агенты, RAG' },
      { ids: ['qa'],      label: 'Data & QA', sublabel: 'тесты, наблюдаемость' },
      { ids: ['infrastructure'], label: 'Infrastructure', sublabel: 'хостинг, CI/CD, сеть' }
    ];

    var byId = {};
    data.categories.forEach(function (c) { byId[c.id] = c; });

    var layersHtml = LAYERS.map(function (layer, i) {
      var techs = [];
      layer.ids.forEach(function (id) {
        if (byId[id]) techs = techs.concat(byId[id].technologies);
      });
      var techHtml = techs.map(function (t) {
        return '<span class="stack-layer__tech">' + t + '</span>';
      }).join('');
      var idx = String(i + 1).padStart(2, '0');

      return '      <div class="stack-layer fade-in">\n' +
        '        <div class="stack-layer__rail"><span class="stack-layer__idx">' + idx + '</span></div>\n' +
        '        <div class="stack-layer__body">\n' +
        '          <div class="stack-layer__head">\n' +
        '            <span class="stack-layer__label">' + layer.label + '</span>\n' +
        '            <span class="stack-layer__sublabel">// ' + layer.sublabel + '</span>\n' +
        '          </div>\n' +
        '          <div class="stack-layer__techs">' + techHtml + '</div>\n' +
        '        </div>\n' +
        '      </div>';
    }).join('\n');

    return '<section class="stack container" id="tech-stack" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <div class="stack-arch">\n' +
      layersHtml + '\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderCases(data) {
    var itemsHtml = data.items.map(function (c, i) {
      var idx = String(i + 1).padStart(2, '0');
      return '      <div class="case-card fade-in">\n' +
        '        <div class="case-card__head">\n' +
        '          <span class="case-card__idx">' + idx + '</span>\n' +
        '          <span class="case-card__tag">' + c.tag + '</span>\n' +
        '        </div>\n' +
        '        <div class="case-card__metric">' + c.metric + '</div>\n' +
        '        <div class="case-card__metric-label">' + c.metric_label + '</div>\n' +
        '        <h3 class="case-card__title">' + c.title + '</h3>\n' +
        '        <p class="case-card__desc">' + c.description + '</p>\n' +
        '      </div>';
    }).join('\n');

    return '<section class="cases container" id="cases" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <div class="cases__grid">\n' +
      itemsHtml + '\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderEngineeringNotes(data) {
    function fmtDate(d) {
      var months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
      var parts = d.split('-');
      return parts[2] + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }
    var itemsHtml = data.items.map(function (n) {
      return '      <article class="note-card fade-in">\n' +
        '        <div class="note-card__meta">\n' +
        '          <span class="note-card__tag">' + n.tag + '</span>\n' +
        '          <span class="note-card__date">' + fmtDate(n.date) + '</span>\n' +
        '        </div>\n' +
        '        <h3 class="note-card__title">' + n.title + '</h3>\n' +
        '        <p class="note-card__excerpt">' + n.excerpt + '</p>\n' +
        '      </article>';
    }).join('\n');

    return '<section class="notes container" id="engineering-notes" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <div class="notes__grid">\n' +
      itemsHtml + '\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderAiCapabilities(data) {
    var cardsHtml = data.cards.map(function (c) {
      var stackHtml = c.stack.map(function (s) {
        return '<span>' + s + '</span>';
      }).join('');

      return '        <div class="ai-cap-card fade-in">\n' +
        '          <div class="ai-cap-icon"><i data-lucide="' + c.icon + '"></i></div>\n' +
        '          <h3>' + c.title + '</h3>\n' +
        '          <p>' + c.description + '</p>\n' +
        '          <div class="ai-cap-stack">\n' +
        '            ' + stackHtml + '\n' +
        '          </div>\n' +
        '        </div>';
    }).join('\n');

    return '<section id="ai-capabilities" style="padding-top: var(--section-gap);">\n' +
      '  <div class="container">\n' +
      '    <div class="section-header fade-in">\n' +
      '      <span class="section-label">' + data.label + '</span>\n' +
      '      <h2>' + data.title + '</h2>\n' +
      '      <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '    </div>\n' +
      '    <div class="ai-caps-grid">\n' +
      cardsHtml + '\n' +
      '    </div>\n' +
      '    <div class="dataflow-wrapper fade-in">\n' +
      '      <canvas id="dataflow-canvas"></canvas>\n' +
      '    </div>\n' +
      '    <div class="inline-cta">\n' +
      '      <a href="' + data.cta.href + '" class="inline-cta__btn">' + data.cta.text + '</a>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderPrinciples(data) {
    var itemsHtml = data.items.map(function (p, i) {
      var number = String(i + 1).padStart(2, '0');
      return '      <div class="principle fade-in">\n' +
        '        <div class="principle__number">' + number + '</div>\n' +
        '        <div class="principle__body">\n' +
        '          <div class="principle__title">' + p.title + '</div>\n' +
        '          <p class="principle__description">' + p.description + '</p>\n' +
        '          <p class="principle__example">' + p.example + '</p>\n' +
        '        </div>\n' +
        '      </div>';
    }).join('\n');

    return '<section class="principles container" id="principles" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <div class="principles__list">\n' +
      itemsHtml + '\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderContact(data) {
    var benefitsHtml = data.benefits.map(function (b) {
      return '<li><i data-lucide="check" class="check-icon"></i> ' + b + '</li>';
    }).join('\n        ');

    var fieldsHtml = data.form.fields.map(function (f) {
      if (f.type === 'textarea') {
        return '<textarea class="cta-form__textarea" name="' + f.name + '" placeholder="' + f.placeholder + '" rows="' + f.rows + '"' + (f.required ? ' required' : '') + '></textarea>';
      }
      return '<input class="cta-form__input" type="' + f.type + '" name="' + f.name + '" placeholder="' + f.placeholder + '"' + (f.required ? ' required' : '') + '>';
    }).join('\n          ');

    return '<section class="cta-section container" id="contact" style="padding-top: var(--section-gap);">\n' +
      '  <div class="cta-wrapper fade-in">\n' +
      '    <div class="cta-benefits">\n' +
      '      <h2 class="cta-benefits__title">' + data.title + '</h2>\n' +
      '      <p class="cta-benefits__subtitle">' + data.subtitle + '</p>\n' +
      '      <ul class="cta-benefits__list">\n' +
      '        ' + benefitsHtml + '\n' +
      '      </ul>\n' +
      '    </div>\n' +
      '    <div class="cta-card-outer">\n' +
      '      <div class="cta-card">\n' +
      '        <h3 class="cta-card__title">' + data.form.title + '</h3>\n' +
      '        <p class="cta-card__subtitle">' + data.form.subtitle + '</p>\n' +
      '        <form class="cta-form" id="cta-form">\n' +
      '          ' + fieldsHtml + '\n' +
      '          <label class="cta-form__consent">\n' +
      '            <input type="checkbox" name="consent" required>\n' +
      '            <span>Даю согласие на обработку <a href="/docs/consent.pdf" target="_blank" rel="noopener">персональных данных</a></span>\n' +
      '          </label>\n' +
      '          <button class="cta-form__submit" type="submit">' + data.form.submit_text + '</button>\n' +
      '        </form>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderFaq(data) {
    var itemsHtml = data.items.map(function (q) {
      return '      <div class="faq__item">\n' +
        '        <button class="faq__question">' + q.question + '</button>\n' +
        '        <div class="faq__answer">\n' +
        '          <div class="faq__answer-inner">' + q.answer + '</div>\n' +
        '        </div>\n' +
        '      </div>';
    }).join('\n');

    return '<section class="faq container" id="faq" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '  </div>\n' +
      '  <div class="faq__list fade-in">\n' +
      itemsHtml + '\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderCareers(data) {
    var positionsHtml = data.positions.map(function (p) {
      return '          <div class="careers__position">\n' +
        '            <div class="careers__position-icon"><i data-lucide="' + p.icon + '"></i></div>\n' +
        '            <div class="careers__position-info">\n' +
        '              <div class="careers__position-name">' + p.name + '</div>\n' +
        '              <div class="careers__position-desc">' + p.description + '</div>\n' +
        '            </div>\n' +
        '          </div>';
    }).join('\n');

    var whyHtml = data.why.map(function (w) {
      return '          <li class="careers__why-item">\n' +
        '            <div class="careers__why-icon"><i data-lucide="' + w.icon + '"></i></div>\n' +
        '            <div class="careers__why-text">\n' +
        '              <h4>' + w.title + '</h4>\n' +
        '              <p>' + w.description + '</p>\n' +
        '            </div>\n' +
        '          </li>';
    }).join('\n');

    return '<section class="careers container" id="careers" style="padding-top: var(--section-gap);">\n' +
      '  <div class="section-header fade-in">\n' +
      '    <div class="section-label">' + data.label + '</div>\n' +
      '    <h2>' + data.title + '</h2>\n' +
      '    <p class="section-subtitle">' + data.subtitle + '</p>\n' +
      '  </div>\n' +
      '  <div class="careers__grid fade-in">\n' +
      '    <div>\n' +
      '      <div class="careers__positions-title">' + data.positions_title + '</div>\n' +
      '      <div class="careers__position-list">\n' +
      positionsHtml + '\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div>\n' +
      '      <div class="careers__why-title">' + data.why_title + '</div>\n' +
      '      <ul class="careers__why-list">\n' +
      whyHtml + '\n' +
      '      </ul>\n' +
      '      <a href="' + data.cta.href + '" target="_blank" rel="noopener" class="careers__cta-btn">\n' +
      '        <i data-lucide="send"></i>\n' +
      '        ' + data.cta.text + '\n' +
      '      </a>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</section>';
  }

  function renderFooter(footer, navbar) {
    var columnsHtml = footer.columns.map(function (col) {
      var linksHtml = col.links.map(function (l) {
        var externalAttrs = l.external ? ' target="_blank" rel="noopener"' : '';
        return '<li><a href="' + l.href + '"' + externalAttrs + '>' + l.text + '</a></li>';
      }).join('\n            ');

      return '      <div class="footer__col">\n' +
        '        <div class="footer__col-title">' + col.title + '</div>\n' +
        '        <ul class="footer__col-links">\n' +
        '            ' + linksHtml + '\n' +
        '        </ul>\n' +
        '      </div>';
    }).join('\n');

    var servicesHtml = footer.services.map(function (s) {
      return '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.name + '</a>';
    }).join('\n        ');

    return '<footer class="footer">\n' +
      '  <div class="container">\n' +
      '    <div class="footer__grid">\n' +
      '      <div class="footer__brand">\n' +
      '        <div class="footer__brand-logo">\n' +
      '          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
      '            <defs><linearGradient id="q-grad-footer" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>\n' +
      '            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#q-grad-footer)"/>\n' +
      '            <text x="16" y="23" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="20" fill="#fff">Q</text>\n' +
      '          </svg>\n' +
      '          <span class="footer__brand-name">' + navbar.brand + '</span>\n' +
      '          <span class="footer__brand-suffix">' + navbar.suffix + '</span>\n' +
      '        </div>\n' +
      '        <div class="footer__brand-tagline">' + footer.tagline + '</div>\n' +
      '      </div>\n' +
      columnsHtml + '\n' +
      '    </div>\n' +
      '    <div class="footer__bottom">\n' +
      '      <div class="footer__copyright">' + footer.copyright + '</div>\n' +
      '      <div class="footer__services">\n' +
      '        ' + servicesHtml + '\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</footer>';
  }

  /* ----------------------------------------
     5. Section renderers map
     ---------------------------------------- */
  var renderers = {
    hero: renderHero,
    studio: renderStudio,
    products: renderProducts,
    tech_stack: renderTechStack,
    ai_capabilities: renderAiCapabilities,
    cases: renderCases,
    engineering_notes: renderEngineeringNotes,
    principles: renderPrinciples,
    contact: renderContact,
    faq: renderFaq,
    careers: renderCareers
  };

  /* ----------------------------------------
     6. Render navbar into #navbar-root
     ---------------------------------------- */
  var navbarRoot = document.getElementById('navbar-root');
  if (navbarRoot) {
    navbarRoot.innerHTML = renderNavbar(content.navbar);
  }

  /* ----------------------------------------
     7. Render visible sections into #app
     ---------------------------------------- */
  var visibleSections = sections.filter(function (s) { return s.visible; });
  var appEl = document.getElementById('app');

  if (appEl) {
    appEl.innerHTML = visibleSections.map(function (s, i) {
      var renderer = renderers[s.id];
      if (!renderer) {
        console.warn('[renderer.js] No renderer for section:', s.id);
        return '';
      }
      var sectionData = content[s.id];
      if (!sectionData) {
        console.warn('[renderer.js] No content data for section:', s.id);
        return '';
      }
      var html = renderer(sectionData);
      return (i > 0 ? '<hr class="section-divider">' : '') + html;
    }).join('');
  }

  /* ----------------------------------------
     8. Render footer into #footer-root
     ---------------------------------------- */
  var footerRoot = document.getElementById('footer-root');
  if (footerRoot) {
    var tickerHtml = '';
    if (content.ci_ticker && content.ci_ticker.items && content.ci_ticker.items.length) {
      var items = content.ci_ticker.items;
      // Duplicate for seamless loop
      var doubled = items.concat(items);
      var rowHtml = doubled.map(function (t) {
        return '<span class="ci-ticker__item">' + t + '</span>';
      }).join('<span class="ci-ticker__sep">·</span>');
      tickerHtml = '<div class="ci-ticker" aria-hidden="true">\n' +
        '  <div class="ci-ticker__track">' + rowHtml + '</div>\n' +
        '</div>\n';
    }
    footerRoot.innerHTML = tickerHtml + renderFooter(content.footer, content.navbar);
  }

  /* ----------------------------------------
     9. Initialize Lucide icons + app.js
     ---------------------------------------- */
  function bootstrap() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    if (typeof window.initApp === 'function') {
      window.initApp();
    }
  }

  // With defer, scripts execute in order, so lucide should be ready.
  // But if async fetch in renderer resolves after lucide loaded, we're fine.
  // Safety: if lucide not yet available, wait for it.
  if (typeof lucide !== 'undefined') {
    bootstrap();
  } else {
    var lucideScript = document.querySelector('script[src*="lucide"]');
    if (lucideScript) {
      lucideScript.addEventListener('load', bootstrap);
    } else {
      bootstrap();
    }
  }

})();
