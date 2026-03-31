/* ==========================================================================
   Quillon — Config-Driven Section Renderer
   Loads content from JSON, renders all sections into #app and #footer.
   ========================================================================== */

(async function () {
  'use strict';

  /* ── 1. Load JSON data ───────────────────────────────────────────────── */
  const [content, sections, settings] = await Promise.all([
    fetch('/content/content.json').then(r => r.json()),
    fetch('/content/sections.json').then(r => r.json()),
    fetch('/content/settings.json').then(r => r.json())
  ]);

  /* ── 2. Apply meta tags from settings ────────────────────────────────── */
  document.title = settings.meta.title;

  const setMeta = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('og:title', settings.meta.title);
  setMeta('og:description', settings.meta.description);
  setMeta('og:image', settings.meta.og_image);

  /* ── 3. Helpers ──────────────────────────────────────────────────────── */

  /** Return Lucide icon element or inline SVG if the value already contains <svg */
  function icon(name, fallback) {
    if (name && name.indexOf('<svg') !== -1) return name;
    return '<i data-lucide="' + name + '"></i>';
  }

  /** Build standard section header (label + h2 + subtitle) */
  function sectionHeader(data) {
    let html = '';
    if (data.label) {
      html += `<span class="section-label">${data.label}</span>`;
    }
    if (data.title) {
      html += `<h2>${data.title}</h2>`;
    }
    if (data.subtitle) {
      html += `<p class="section-sub">${data.subtitle}</p>`;
    }
    return html;
  }

  /** Inline CTA block (appears after sections that have a .cta field) */
  function inlineCta(cta) {
    if (!cta) return '';
    return `
      <div class="section-cta">
        <a href="${cta.href}" class="btn btn-primary">${cta.text}</a>
      </div>`;
  }

  /** Convert \n in text to <br> tags */
  function nl2br(str) {
    return (str || '').replace(/\n/g, '<br>');
  }

  /** Auto-add tooltips for English tech terms */
  const termGlossary = {
    'Backend': 'Серверная часть приложения — логика, базы данных, API',
    'Frontend': 'Клиентская часть — то, что видит пользователь в браузере',
    'FastAPI': 'Быстрый Python-фреймворк для создания серверных приложений',
    'PostgreSQL': 'Надёжная база данных для хранения информации',
    'Redis': 'Сверхбыстрое хранилище данных в оперативной памяти',
    'Docker': 'Инструмент для упаковки приложений в изолированные контейнеры',
    'CI/CD': 'Автоматическая проверка и публикация кода — как конвейер на заводе',
    'GitHub Actions': 'Сервис для автоматизации тестирования и деплоя кода',
    'Flutter': 'Фреймворк от Google для создания мобильных приложений на iOS и Android',
    'Dart': 'Язык программирования для Flutter',
    'Firebase': 'Облачная платформа Google для мобильных приложений',
    'REST API': 'Способ, которым программы общаются друг с другом через интернет',
    'Claude API': 'Интерфейс для подключения ИИ Claude к твоему коду',
    'RAG': 'Технология, позволяющая ИИ искать ответы в документах компании',
    'Pytest': 'Инструмент для автоматического тестирования Python-кода',
    'Selenium': 'Инструмент для автоматизации действий в браузере',
    'Playwright': 'Современный инструмент для тестирования веб-приложений',
    'Allure': 'Система для красивых отчётов о результатах тестирования',
    'Scrum': 'Метод управления проектами с короткими циклами (спринтами)',
    'MVP': 'Минимально жизнеспособный продукт — первая рабочая версия идеи',
    'WebRTC': 'Технология для видеозвонков прямо в браузере',
    'Django': 'Популярный Python-фреймворк для создания веб-приложений',
    'Riverpod': 'Инструмент управления данными в Flutter-приложениях',
    'SQLite': 'Лёгкая встроенная база данных для мобильных приложений',
    'Appium': 'Инструмент для тестирования мобильных приложений',
    'Prompt Engineering': 'Искусство правильно формулировать запросы к ИИ',
    'Vibe Coding': 'Создание приложений с помощью ИИ через описание на естественном языке',
    'LaunchPad': 'Карьерный центр Quillon — подготовка к трудоустройству',
    'Junior': 'Начинающий специалист, первая ступень в IT-карьере',
    'GitHub': 'Платформа для хранения и совместной работы над кодом',
    'Cursor': 'Редактор кода со встроенным ИИ-помощником',
    'Copilot': 'ИИ от GitHub, который помогает писать код',
    'Fine-Tuning': 'Дообучение нейросети под конкретные задачи компании'
  };

  function addTooltips(html) {
    // Classes whose text content should NOT get tooltips
    const skipClasses = /tag|product-meta|btn|nav-|section-label|hero-supertag|step-period|track-badge|adv-num|metric-value|price-main|footer-|tip/;

    const parts = html.split(/(<[^>]+>)/g);
    let skipDepth = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith('<')) {
        // Opening tag with skip-class?
        if (!part.startsWith('</') && skipClasses.test(part)) {
          skipDepth++;
        }
        // Closing tag — decrement if we were skipping
        if (part.startsWith('</') && skipDepth > 0) {
          skipDepth--;
        }
        // Self-closing tags (like <br/>, <i .../>)
        if (part.endsWith('/>') && skipDepth > 0) {
          skipDepth--;
        }
        continue;
      }

      // Skip empty text or text inside skip-elements
      if (!part.trim() || skipDepth > 0) continue;

      for (const [term, desc] of Object.entries(termGlossary)) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'g');
        if (regex.test(parts[i])) {
          parts[i] = parts[i].replace(new RegExp(`\\b(${escaped})\\b`, 'g'),
            `<span class="tip" data-tip="${desc}">$1</span>`);
        }
      }
    }
    return parts.join('');
  }

  /** Determine background class: odd index = --bg-deep, even = --bg */
  let sectionIndex = 0;
  function sectionBgClass() {
    return sectionIndex % 2 === 0 ? 'section-bg-deep' : 'section-bg-alt';
  }

  /* ── 4. Section Renderers ────────────────────────────────────────────── */

  const sectionRenderers = {

    /* ------------------------------------------------------------------ */
    /*  HERO                                                               */
    /* ------------------------------------------------------------------ */
    hero: (data, settings) => `
      <section id="hero">
        <div class="hero-bg"></div>
        <div class="hero-grid"></div>
        <div class="container">
          <div class="hero-layout">
            <div class="hero-content">
              <span class="hero-supertag">${data.supertag}</span>
              <h1>${data.title}</h1>
              <p class="hero-sub">${data.subtitle}</p>
              <p class="hero-tagline">${data.tagline}</p>
              <div class="hero-ctas">
                <a href="${data.cta_primary.href}" class="btn btn-primary btn-big btn-hero-cta">
                  <span class="btn-hero-title">Пройти тест →</span>
                  <span class="btn-hero-sub">узнать, сколько заработаешь</span>
                </a>
                <a href="${data.cta_secondary.href}" class="btn btn-secondary">${data.cta_secondary.text}</a>
              </div>
              <p class="hero-micro">${data.micro}</p>
              ${data.badge ? `
              <div class="live-badge hero-live-badge">
                <span class="live-dot"></span>
                ${data.badge.text}
              </div>` : ''}
            </div>
            <div class="hero-visual" aria-hidden="true">
              <lottie-player
                src="https://assets2.lottiefiles.com/packages/lf20_w51pcehl.json"
                background="transparent"
                speed="0.7"
                style="width: 340px; height: 340px;"
                loop
                autoplay>
              </lottie-player>
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  HOW_MONEY                                                          */
    /* ------------------------------------------------------------------ */
    how_money: (data) => `
      <section id="how_money" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-3 how-money-cards" data-stagger="true">
            ${data.steps.map(s => `
              <div class="card how-money-card">
                <span class="how-money-num">${s.num}</span>
                <h3 class="how-money-title">${s.title}</h3>
                <p class="how-money-text">${s.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  MARKET                                                             */
    /* ------------------------------------------------------------------ */
    market: (data) => `
      <section id="market" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-4 metric-cards" data-stagger="true">
            ${data.metrics.map(m => `
              <div class="card metric-card">
                <div class="metric-value">${m.value}</div>
                <p class="metric-desc">${m.desc}</p>
              </div>
            `).join('')}
          </div>
          <div class="market-text">
            ${data.text.split('\n\n').map(p => `<p>${p}</p>`).join('')}
          </div>
          ${data.source ? `<p class="market-source">${data.source}</p>` : ''}
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  SOLUTION                                                           */
    /* ------------------------------------------------------------------ */
    solution: (data) => `
      <section id="solution" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-2 solution-cards" data-stagger="true">
            ${data.cards.map(c => `
              <div class="card solution-card">
                <div class="solution-icon">${icon(c.icon, c.icon)}</div>
                <h3>${c.title}</h3>
                <p class="solution-text">${c.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACKS                                                             */
    /* ------------------------------------------------------------------ */
    tracks: (data) => `
      <section id="tracks" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-3 track-cards" data-stagger="true">
            ${data.items.map(t => `
              <div class="card track-card">
                <span class="tag tag-blue track-badge">${t.badge}</span>
                <h3 class="track-title">${t.name}</h3>
                <p class="track-desc">${t.description}</p>
                <div class="track-stack">
                  ${t.stack.map(s => `<span class="tag tag-purple">${s}</span>`).join('')}
                </div>
                <div class="track-junior">
                  <span class="track-junior-label">Зарплата Junior</span>
                  <span class="track-junior-salary">${t.salary}</span>
                </div>
                <div class="track-junior">
                  <span class="track-junior-label">Вакансий</span>
                  <span class="track-junior-vacancies">${t.vacancies}</span>
                </div>
                <p class="track-price">${t.price_hint}</p>
                <a href="${t.cta.href}" class="btn btn-primary btn-sm track-cta">${t.cta.text}</a>
              </div>
            `).join('')}
          </div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  FORMAT                                                             */
    /* ------------------------------------------------------------------ */
    format: (data) => `
      <section id="format" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="format-layout">
            <!-- Left: details -->
            <div class="format-details">
              ${data.details.map(d => `
                <div class="detail-block">
                  <h3 class="detail-title">${d.title}</h3>
                  <p class="detail-text">${d.text}</p>
                </div>
              `).join('')}
            </div>
            <!-- Right: includes -->
            <div class="card">
              <h3 class="includes-title">Что включено</h3>
              <ul class="includes-list">
                ${data.includes.map(item => `
                  <li>
                    <span class="includes-check">&#10003;</span>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  QUILLON_JOBS                                                       */
    /* ------------------------------------------------------------------ */
    quillon_jobs: (data) => `
      <section id="quillon_jobs" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-2 jobs-features" data-stagger="true">
            ${data.features.map(f => `
              <div class="card jobs-feature-card">
                <div class="jobs-feature-icon">${icon(f.icon, f.icon)}</div>
                <h3 class="jobs-feature-title">${f.title}</h3>
                <p class="jobs-feature-text">${f.text}</p>
              </div>
            `).join('')}
          </div>
          <div class="grid-3 jobs-stats" data-stagger="true">
            ${data.stats.map(s => `
              <div class="card metric-card">
                <div class="metric-value">${s.value}</div>
                <p class="metric-desc">${s.label}</p>
              </div>
            `).join('')}
          </div>
          <div class="jobs-screenshot">
            <img src="/assets/images/quillon-jobs-mockup.png" alt="Quillon Jobs — платформа для поиска оплачиваемых IT-заказов" loading="lazy">
          </div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  PRODUCTS                                                           */
    /* ------------------------------------------------------------------ */
    products: (data) => `
      <section id="products" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-3 product-cards" data-stagger="true">
            ${data.items.map(p => `
              <div class="card product-card">
                <div class="product-icon-row">${icon(p.icon, p.icon)}</div>
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                <span class="tag tag-blue product-meta">${p.meta}</span>
                ${p.link ? `<a href="${p.link.href}" class="btn btn-secondary btn-sm product-link" target="_blank" rel="noopener noreferrer">${p.link.text}</a>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="code-showcase card" style="margin-top: var(--space-xl)">
            <div class="code-showcase-header">
              <div class="code-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="code-filename">quillon_chatai/api/chat.py</span>
            </div>
            <pre class="code-body"><code id="typing-code"></code></pre>
          </div>
          <!-- ChatAI Demo placeholder -->
          <div id="chat-demo" class="card-highlight chat-demo"></div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  PATH                                                               */
    /* ------------------------------------------------------------------ */
    path: (data) => `
      <section id="path" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="stepper">
            <!-- Vertical line -->
            <div class="step-line"></div>
            ${data.steps.map((s, i) => `
              <div class="step">
                <div class="step-num">${i + 1}</div>
                <div class="step-content">
                  <span class="tag tag-green step-period">${s.period}</span>
                  <h3 class="step-title">${s.title}</h3>
                  <p class="step-text">${s.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  AI_ANSWER                                                          */
    /* ------------------------------------------------------------------ */
    ai_answer: (data) => `
      <section id="ai_answer" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          <div class="ai-answer-layout">
            <div class="ai-answer-question">
              <span class="section-label">${data.label}</span>
              <h2 class="ai-answer-h2">${data.title}</h2>
              <p class="ai-answer-short">Нет. Но программисты с ИИ заменят программистов без ИИ.</p>
            </div>
            <div class="ai-answer-content">
              ${data.answer.split('\n\n').slice(1).map(p => '<p>' + nl2br(p) + '</p>').join('')}
            </div>
          </div>
          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  LAUNCHPAD                                                          */
    /* ------------------------------------------------------------------ */
    launchpad: (data) => `
      <section id="launchpad" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}

          <!-- Counter blocks -->
          <div class="grid-2 lp-counters">
            <div class="card lp-counter">
              <div class="metric-value">12 000+</div>
              <p class="metric-desc">открытых вакансий для Junior Python / Flutter / QA прямо сейчас</p>
            </div>
            <div class="card lp-counter">
              <div class="metric-value">80%</div>
              <p class="metric-desc">работодателей в IT оценивают по портфолио и навыкам, а не по дипломам</p>
            </div>
          </div>

          <!-- Main stat text -->
          <p class="lp-main-stat">${data.stat}</p>

          <!-- Stage cards -->
          <div class="grid-2 lp-stages" data-stagger="true">
            ${data.stages.map(s => `
              <div class="card lp-stage-card">
                <h3 class="lp-stage-title">${s.title}</h3>
                <p class="lp-stage-text">${s.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- Advantages -->
          <div class="grid-2 lp-advantages" data-stagger="true">
            ${data.advantages.map(a => `
              <div class="card lp-adv-card">
                <div class="lp-adv-icon">${icon(a.icon, a.icon)}</div>
                <h3 class="lp-adv-title">${a.title}</h3>
                <p class="lp-adv-text">${a.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- After graduation -->
          <div class="lp-after">
            <p>${data.after}</p>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  ADVANTAGES                                                         */
    /* ------------------------------------------------------------------ */
    advantages: (data) => `
      <section id="advantages" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-3 advantages-grid" data-stagger="true">
            ${data.items.map(a => `
              <div class="card adv-card">
                <span class="adv-num">${a.num}</span>
                <h3 class="adv-title">${a.title}</h3>
                <p class="adv-text">${a.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  AUDIENCE                                                           */
    /* ------------------------------------------------------------------ */
    audience: (data) => `
      <section id="audience" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-4 audience-grid" data-stagger="true">
            ${data.personas.map(p => `
              <div class="card audience-card">
                <div class="audience-emoji">${icon(p.emoji, p.emoji)}</div>
                <h3 class="audience-title">${p.title}</h3>
                <p class="audience-text">${p.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  PRICING                                                            */
    /* ------------------------------------------------------------------ */
    pricing: (data) => `
      <section id="pricing" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="pricing-layout">
            <!-- Left: pricing card -->
            <div class="card card-highlight price-card">
              <div class="price-main">${data.price}</div>
              <p class="price-details">${data.price_details}</p>
              <p class="price-anchor">${data.anchor}</p>

              <!-- Trial -->
              ${data.trial ? `
              <div class="trial-badge">
                <p>${data.trial.text}</p>
              </div>` : ''}

              <!-- Bonus -->
              ${data.bonus ? `
              <div class="bonus-card">
                <p class="bonus-title">${data.bonus.title}</p>
                <p class="bonus-text">${data.bonus.text}</p>
              </div>` : ''}

              <!-- ROI -->
              <p class="roi-text">${data.roi}</p>

              <!-- Payment options -->
              <div class="payment-options">
                ${data.payment_options.map(o => `
                  <div class="payment-option">
                    <span class="payment-option-name">${o.name}</span>
                    <span class="payment-option-detail">${o.detail}</span>
                  </div>
                `).join('')}
              </div>

              <a href="${data.cta.href}" class="btn btn-primary btn-big price-cta">${data.cta.text}</a>
            </div>

            <!-- Right: includes list -->
            <div class="pricing-includes">
              <h3 class="includes-title">Что входит в программу</h3>
              <ul class="includes-list">
                ${data.includes.map(item => `
                  <li>
                    <span class="includes-check">&#10003;</span>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  FAQ                                                                */
    /* ------------------------------------------------------------------ */
    faq: (data) => `
      <section id="faq" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="faq-list">
            ${data.items.map(item => `
              <div class="faq-item">
                <div class="faq-q">
                  <span>${item.q}</span>
                  <svg class="faq-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="faq-a">
                  <p>${item.a}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  STARTUP                                                            */
    /* ------------------------------------------------------------------ */
    startup: (data) => `
      <section id="startup" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}

          <!-- Steps grid -->
          <div class="grid-3 startup-steps" data-stagger="true">
            ${data.steps.map(s => `
              <div class="card startup-step-card">
                <span class="adv-num">${s.num}</span>
                <h3 class="startup-step-title">${s.title}</h3>
                <p class="startup-step-text">${s.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- Highlight card -->
          <div class="card card-highlight startup-highlight">
            <div class="startup-highlight-value">${data.highlight.value}</div>
            <p class="startup-highlight-text">${data.highlight.text}</p>
          </div>

          <!-- Why card -->
          <div class="card startup-why">
            <h3 class="startup-why-title">${data.why.title}</h3>
            <p class="startup-why-text">${data.why.text}</p>
          </div>

          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  QUILLY_AI                                                          */
    /* ------------------------------------------------------------------ */
    quilly_ai: (data) => `
      <section id="quilly_ai" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}

          <!-- Features grid -->
          <div class="grid-3 quilly-features" data-stagger="true">
            ${data.features.map(f => `
              <div class="card quilly-feature-card">
                <div class="quilly-feature-icon">${icon(f.icon, f.icon)}</div>
                <h3 class="quilly-feature-title">${f.title}</h3>
                <p class="quilly-feature-text">${f.text}</p>
              </div>
            `).join('')}
          </div>

          <!-- Benefit card -->
          <div class="card card-highlight quilly-benefit">
            <div class="quilly-benefit-value">${data.benefit.value}</div>
            <h3 class="quilly-benefit-title">${data.benefit.title}</h3>
            <p class="quilly-benefit-text">${data.benefit.text}</p>
          </div>

          ${inlineCta(data.cta)}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  CONTACT_FORM                                                       */
    /* ------------------------------------------------------------------ */
    contact_form: (data) => `
      <section id="contact_form" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          <div class="contact-form-wrapper">
            ${sectionHeader(data)}
            <form data-form="contact" class="contact-form" novalidate>
              <div class="contact-form-fields">
                <div class="form-group">
                  <label for="contact-name">Имя</label>
                  <input type="text" id="contact-name" name="name" placeholder="Как тебя зовут?" required>
                </div>
                <div class="form-group">
                  <label for="contact-phone">Телефон</label>
                  <input type="tel" id="contact-phone" name="phone" placeholder="+7 (___) ___-__-__" required>
                </div>
                <div class="form-group">
                  <label for="contact-email">Email</label>
                  <input type="email" id="contact-email" name="email" placeholder="your@email.com">
                </div>
              </div>
              <div class="contact-form-consent">
                <label class="checkbox-label">
                  <input type="checkbox" name="consent" required>
                  <span>${data.consent}</span>
                </label>
              </div>
              <button type="submit" class="btn btn-primary btn-big contact-form-submit">${data.cta.text}</button>
            </form>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  FINAL_CTA                                                          */
    /* ------------------------------------------------------------------ */
    final_cta: (data, settings) => `
      <section id="final_cta" class="animate-on-scroll final-cta-section">
        <div class="container final-cta-container">
          <h2>${data.title}</h2>
          <p class="final-cta-sub">${data.subtitle}</p>
          <a href="${data.cta.href}" class="btn btn-primary btn-big">${data.cta.text}</a>
          <p class="final-cta-micro">${data.micro}</p>
          ${data.badge ? `
          <div class="live-badge final-cta-badge">
            <span class="live-dot"></span>
            ${data.badge.text}
          </div>` : ''}
        </div>
      </section>`
  };

  /* ── 5. Render all sections ──────────────────────────────────────────── */
  const app = document.getElementById('app');
  let html = '';

  sections.forEach(section => {
    if (!section.visible) return;
    const data = content[section.id];
    if (!data) return;

    const renderer = sectionRenderers[section.id];
    if (renderer) {
      /* hero is index 0, skip bg alternation for it */
      if (section.id !== 'hero') {
        sectionIndex++;
      }
      html += addTooltips(renderer(data, settings));
    }
  });

  app.innerHTML = html;

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* ── 6. Render footer ────────────────────────────────────────────────── */
  renderFooter(content.footer);

  function renderFooter(data) {
    if (!data) return;

    const footer = document.getElementById('footer');
    footer.className = 'site-footer';

    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-top">

          <!-- Brand column -->
          <div class="footer-brand">
            <div class="footer-logo">${data.logo}</div>
            <p class="footer-tagline">${data.tagline}</p>
          </div>

          <!-- Link columns -->
          ${data.columns.map(col => `
            <div class="footer-col">
              <h4 class="footer-col-title">${col.title}</h4>
              <ul class="footer-links">
                ${col.links.map(l => `
                  <li><a href="${l.href}">${l.text}</a></li>
                `).join('')}
              </ul>
            </div>
          `).join('')}

          <!-- Contacts -->
          <div class="footer-col footer-contacts">
            <h4 class="footer-col-title">Контакты</h4>
            <ul class="footer-links">
              <li><a href="mailto:${data.contacts.email}">${data.contacts.email}</a></li>
              <li><a href="${data.contacts.telegram}" class="footer-social-link" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram</a></li>
              <li><a href="${data.contacts.whatsapp}" class="footer-social-link" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> WhatsApp</a></li>
              <li><a href="${data.contacts.vk}" class="footer-social-link" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.048-2.763-5.339-2.763-5.814 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.864 2.493 2.305 4.68 2.898 4.68.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.747c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.814-.542 1.27-1.422 2.17-3.608 2.17-3.608.119-.254.322-.491.763-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.357 4.036-2.357 4.036-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg> ВКонтакте</a></li>
            </ul>
          </div>
        </div>

        <!-- Legal -->
        <div class="footer-divider"></div>
        <div class="footer-bottom">
          <div class="footer-legal">
            <span>${data.legal.company}</span> · <span>ИНН ${data.legal.inn}</span><br>
            <span>${data.legal.address}</span>
          </div>
          <div class="footer-legal-links">
            ${data.legal.links.map(l => `<a href="${l.href}">${l.text}</a>`).join('')}
            <span class="footer-copyright">${data.copyright}</span>
          </div>
        </div>
      </div>
    `;
  }

  /* ── 7. Re-init Lucide icons after footer ─────────────────────────────── */
  if (window.lucide) window.lucide.createIcons();

  /* ── 8. Initialize animations and interactions ───────────────────────── */
  if (window.initAnimations) window.initAnimations();
  if (window.initInteractions) window.initInteractions();
  if (window.initAnalytics) window.initAnalytics();

})();
