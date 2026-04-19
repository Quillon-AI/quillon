/* ==========================================================================
   Quillon — Config-Driven Section Renderer
   Loads content from JSON, renders all sections into #app and #footer.
   ========================================================================== */

(async function () {
  'use strict';

  /* ── 0. Resolve page type from #app data attributes ─────────────────── */
  const appEl = document.getElementById('app');
  const pageType = (appEl && appEl.dataset.page) || 'main';
  const trackSlug = appEl && appEl.dataset.trackSlug;

  /* ── 1. Load JSON data ───────────────────────────────────────────────── */
  const sharedFetches = [
    fetch('/content/content.json').then(r => r.json()),
    fetch('/content/settings.json').then(r => r.json())
  ];

  let content, settings, sections, trackContent;

  if (pageType === 'track' && trackSlug) {
    const [mainContent, mainSettings, track] = await Promise.all([
      ...sharedFetches,
      fetch(`/content/tracks/${trackSlug}.json`).then(r => r.json())
    ]);
    content = mainContent;
    settings = mainSettings;
    trackContent = track;
  } else {
    const [mainContent, mainSettings, mainSections] = await Promise.all([
      ...sharedFetches,
      fetch('/content/sections.json').then(r => r.json())
    ]);
    content = mainContent;
    settings = mainSettings;
    sections = mainSections;
  }

  /* ── 2. Apply meta tags (track page may override) ────────────────────── */
  if (pageType === 'track' && trackContent && trackContent.meta) {
    if (trackContent.meta.title) document.title = trackContent.meta.title;
  } else {
    document.title = settings.meta.title;
  }

  const setMeta = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const metaTitle = (pageType === 'track' && trackContent?.meta?.title) || settings.meta.title;
  const metaDesc = (pageType === 'track' && trackContent?.meta?.description) || settings.meta.description;
  const metaOg = (pageType === 'track' && trackContent?.meta?.og_image) || settings.meta.og_image;
  setMeta('og:title', metaTitle);
  setMeta('og:description', metaDesc);
  setMeta('og:image', metaOg);

  /* ── 3. Helpers ──────────────────────────────────────────────────────── */

  /** Return Lucide icon element, inline SVG, or pass-through <img> markup */
  function icon(name, fallback) {
    if (name && (name.indexOf('<svg') !== -1 || name.indexOf('<img') !== -1)) return name;
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
    var inner = cta.title && cta.subtitle
      ? `<span class="cta-title">${cta.title}</span><span class="cta-sub">${cta.subtitle}</span>`
      : cta.text;
    return `
      <div class="section-cta">
        <a href="${cta.href}" class="btn btn-primary">${inner}</a>
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
    const skipClasses = /tag|product-meta|btn|nav-|section-label|hero-supertag|track-hero-title|track-hero-stat|step-period|track-badge|adv-num|metric-value|price-main|footer-|tip|program-module-title|c-/;

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

  /* ── 3.5 Track-specific hero visuals ────────────────────────────────── */

  const trackHeroVisuals = {
    pythonBackend: () => `
      <div class="track-hero-code">
        <div class="track-hero-code-header">
          <span class="track-hero-code-dot" style="background:#EF4444"></span>
          <span class="track-hero-code-dot" style="background:#F59E0B"></span>
          <span class="track-hero-code-dot" style="background:#10B981"></span>
          <span class="track-hero-code-file">api/main.py</span>
        </div>
        <pre class="track-hero-code-body"><code><span class="c-kw">from</span> fastapi <span class="c-kw">import</span> FastAPI
<span class="c-kw">from</span> claude <span class="c-kw">import</span> Anthropic

app = FastAPI()
client = Anthropic()

<span class="c-dec">@app.post</span>(<span class="c-str">"/ask"</span>)
<span class="c-kw">async def</span> <span class="c-fn">ask_ai</span>(q: <span class="c-tp">str</span>):
    resp = client.messages.create(
        model=<span class="c-str">"claude-sonnet-4-5-20250514"</span>,
        messages=[{<span class="c-str">"role"</span>: <span class="c-str">"user"</span>,
                   <span class="c-str">"content"</span>: q}]
    )
    <span class="c-kw">return</span> {<span class="c-str">"answer"</span>: resp.content}</code></pre>
      </div>`,

    flutter: () => `
      <!-- Decorative layers -->
      <div class="fl-decor fl-decor-grid" aria-hidden="true"></div>
      <div class="fl-decor fl-blob fl-blob--a" aria-hidden="true"></div>
      <div class="fl-decor fl-blob fl-blob--b" aria-hidden="true"></div>
      <div class="fl-decor fl-blob fl-blob--c" aria-hidden="true"></div>

      <!-- SVG beam layer connecting code-card to each device -->
      <svg class="fl-beams" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fl-beam-ios" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#3B6FFF" stop-opacity="0"/>
            <stop offset="0.4" stop-color="#3B6FFF" stop-opacity="0.7"/>
            <stop offset="1" stop-color="#3B6FFF" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="fl-beam-android" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#7C3AED" stop-opacity="0"/>
            <stop offset="0.5" stop-color="#A78BFA" stop-opacity="0.7"/>
            <stop offset="1" stop-color="#A78BFA" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="fl-beam-web" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#10B981" stop-opacity="0.9"/>
            <stop offset="0.5" stop-color="#10B981" stop-opacity="0.7"/>
            <stop offset="1" stop-color="#10B981" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <!-- code (~38,72) → iPhone (~62,52) -->
        <path class="fl-beam fl-beam--ios"
              d="M 38 72 C 50 72 56 62 62 52"
              stroke="url(#fl-beam-ios)" stroke-width="0.45" fill="none"
              stroke-linecap="round" stroke-dasharray="1.4 2.6"/>
        <!-- code (~30,68) → Android (~22,28) -->
        <path class="fl-beam fl-beam--android"
              d="M 30 68 C 22 56 20 42 22 28"
              stroke="url(#fl-beam-android)" stroke-width="0.45" fill="none"
              stroke-linecap="round" stroke-dasharray="1.4 2.6"/>
        <!-- code (~46,68) → Browser (~78,28) -->
        <path class="fl-beam fl-beam--web"
              d="M 46 68 C 60 60 70 42 78 28"
              stroke="url(#fl-beam-web)" stroke-width="0.45" fill="none"
              stroke-linecap="round" stroke-dasharray="1.4 2.6"/>

        <!-- Idle particles (animated via CSS offset-path inside hidden tracks) -->
      </svg>

      <!-- Code card -->
      <div class="fl-code-card" data-fl="code">
        <div class="fl-code-header">
          <span class="fl-code-dot" style="background:#EF4444"></span>
          <span class="fl-code-dot" style="background:#F59E0B"></span>
          <span class="fl-code-dot" style="background:#10B981"></span>
          <span class="fl-code-file">lib/main.dart</span>
          <span class="fl-hot-reload" aria-hidden="true">
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <path d="M6 0L0 7h3l-1 5 6-7H5l1-5z" fill="currentColor"/>
            </svg>
            <span>Hot Reload</span>
          </span>
        </div>
        <pre class="fl-code-body"><code><span class="c-kw">class</span> <span class="c-tp">CounterApp</span> <span class="c-kw">extends</span> <span class="c-tp">StatefulWidget</span> {
  <span class="c-dec">@override</span> _S createState() =&gt; _S();
}

<span class="c-kw">class</span> _S <span class="c-kw">extends</span> <span class="c-tp">State</span>&lt;<span class="c-tp">CounterApp</span>&gt; {
  <span class="c-tp">int</span> count = <span class="c-num" data-fl="count-src">42</span>;

  <span class="c-dec">@override</span>
  <span class="c-tp">Widget</span> <span class="c-fn">build</span>(_) =&gt; <span class="c-tp">Scaffold</span>(
    body: <span class="c-tp">Center</span>(child: <span class="c-tp">Text</span>(<span class="c-str">'$count'</span>)),
    floatingActionButton: <span class="c-tp">FAB</span>(
      onPressed: () =&gt; setState(() =&gt; count++),
      child: <span class="c-tp">Icon</span>(<span class="c-tp">Icons</span>.add),
    ),
  );
}</code></pre>
        <span class="fl-code-caret" aria-hidden="true"></span>
      </div>

      <!-- iPhone (foreground) — Cupertino counter -->
      <div class="fl-device fl-device--ios" data-fl="ios">
        <div class="fl-iphone">
          <span class="fl-iphone-notch"></span>
          <div class="fl-iphone-screen">
            <div class="fl-status">
              <span>9:41</span>
              <span class="fl-status-icons"><i></i><i></i><i></i></span>
            </div>
            <div class="fl-ios-title">Counter</div>
            <div class="fl-ios-sub">Press the button to increment</div>
            <div class="fl-ios-count" data-fl="ios-count">42</div>
            <div class="fl-fab" aria-hidden="true">+</div>
          </div>
        </div>
        <span class="fl-device-label fl-device-label--ios">iOS</span>
      </div>

      <!-- Android (background-left, tilted) — Material 3 tasks -->
      <div class="fl-device fl-device--android" data-fl="android">
        <div class="fl-android">
          <span class="fl-android-punch"></span>
          <div class="fl-android-screen">
            <div class="fl-mat-bar">
              <span class="fl-mat-bar-icon">≡</span>
              <span>Tasks</span>
              <span class="fl-mat-bar-add">+</span>
            </div>
            <ul class="fl-mat-list">
              <li><span class="fl-check fl-check--on" data-fl="android-check"></span>Build app</li>
              <li><span class="fl-check fl-check--on"></span>Hot reload</li>
              <li><span class="fl-check"></span>Ship to stores</li>
              <li><span class="fl-check"></span>Profit</li>
            </ul>
            <div class="fl-mat-nav">
              <i class="active"></i><i></i><i></i>
            </div>
          </div>
        </div>
        <span class="fl-device-label fl-device-label--android">Android</span>
      </div>

      <!-- Web (background-right, tilted) — Dashboard -->
      <div class="fl-device fl-device--web" data-fl="web">
        <div class="fl-browser">
          <div class="fl-browser-bar">
            <span class="fl-browser-dot" style="background:#EF4444"></span>
            <span class="fl-browser-dot" style="background:#F59E0B"></span>
            <span class="fl-browser-dot" style="background:#10B981"></span>
            <span class="fl-browser-url">localhost:8080</span>
          </div>
          <div class="fl-browser-screen">
            <div class="fl-web-title">Dashboard</div>
            <div class="fl-web-stats">
              <div class="fl-web-stat">
                <span class="fl-web-stat-value" data-fl="web-users">1.2k</span>
                <span class="fl-web-stat-label">users</span>
              </div>
              <div class="fl-web-stat">
                <span class="fl-web-stat-value" data-fl="web-growth">42%</span>
                <span class="fl-web-stat-label">growth</span>
              </div>
              <div class="fl-web-stat">
                <span class="fl-web-stat-value" data-fl="web-mrr">$8.4k</span>
                <span class="fl-web-stat-label">MRR</span>
              </div>
            </div>
            <div class="fl-web-chart" aria-hidden="true">
              <span style="--h:30%"></span><span style="--h:55%"></span>
              <span style="--h:75%"></span><span style="--h:90%"></span>
              <span style="--h:80%"></span><span style="--h:65%"></span>
              <span style="--h:50%"></span><span style="--h:70%"></span>
              <span style="--h:85%"></span><span style="--h:95%"></span>
              <span style="--h:80%"></span><span style="--h:65%"></span>
            </div>
          </div>
        </div>
        <span class="fl-device-label fl-device-label--web">Web</span>
      </div>`
  };

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
              <svg class="hero-orbit" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img">
                <defs>
                  <radialGradient id="orbCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#3B6FFF" stop-opacity="0.9"/>
                    <stop offset="55%" stop-color="#1F4ED8" stop-opacity="0.55"/>
                    <stop offset="100%" stop-color="#1F4ED8" stop-opacity="0"/>
                  </radialGradient>
                  <radialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
                  </radialGradient>
                  <radialGradient id="coreBright" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#F0F4FF" stop-opacity="1"/>
                    <stop offset="40%" stop-color="#3B6FFF" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#1F4ED8" stop-opacity="0.8"/>
                  </radialGradient>
                  <linearGradient id="orbStroke" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#3B6FFF" stop-opacity="0.55"/>
                    <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#3B6FFF" stop-opacity="0"/>
                  </linearGradient>
                  <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
                  </filter>
                </defs>

                <!-- soft purple halo -->
                <circle class="hero-orbit-halo" cx="200" cy="200" r="200" fill="url(#orbHalo)"/>

                <!-- core glow -->
                <circle class="hero-orbit-coreglow" cx="200" cy="200" r="60" fill="url(#orbCore)"/>

                <!-- Centerpiece — luminous core (reactor/star) -->
                <g class="hero-orbit-core">
                  <!-- thin dashed boundary ring -->
                  <circle cx="200" cy="200" r="38" fill="none" stroke="#3B6FFF" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="1.5 5"/>
                  <!-- soft bright halo -->
                  <circle cx="200" cy="200" r="20" fill="#3B6FFF" fill-opacity="0.3" filter="url(#nodeGlow)"/>
                  <!-- bright core disc with radial gradient -->
                  <circle cx="200" cy="200" r="10" fill="url(#coreBright)"/>
                </g>

                <!-- orbit rings -->
                <g class="hero-orbit-ring hero-orbit-ring--1">
                  <circle cx="200" cy="200" r="90" fill="none" stroke="url(#orbStroke)" stroke-width="1" stroke-dasharray="2 6"/>
                  <circle cx="290" cy="200" r="4" fill="#3B6FFF"/>
                  <circle cx="290" cy="200" r="9" fill="#3B6FFF" fill-opacity="0.25" filter="url(#nodeGlow)"/>
                </g>

                <g class="hero-orbit-ring hero-orbit-ring--2">
                  <circle cx="200" cy="200" r="135" fill="none" stroke="url(#orbStroke)" stroke-width="1"/>
                  <g transform="translate(65 200)">
                    <circle r="5" fill="#7C3AED"/>
                    <circle r="11" fill="#7C3AED" fill-opacity="0.22" filter="url(#nodeGlow)"/>
                  </g>
                  <g transform="translate(335 200)">
                    <circle r="3.5" fill="#F0F4FF" fill-opacity="0.8"/>
                  </g>
                </g>

                <g class="hero-orbit-ring hero-orbit-ring--3">
                  <circle cx="200" cy="200" r="175" fill="none" stroke="url(#orbStroke)" stroke-width="1" stroke-dasharray="1 4"/>
                  <g transform="translate(200 25)">
                    <circle r="4" fill="#3B6FFF"/>
                    <circle r="10" fill="#3B6FFF" fill-opacity="0.2" filter="url(#nodeGlow)"/>
                  </g>
                  <g transform="translate(200 375)">
                    <circle r="3" fill="#F0F4FF" fill-opacity="0.55"/>
                  </g>
                  <g transform="translate(50 90)">
                    <circle r="2.5" fill="#F0F4FF" fill-opacity="0.4"/>
                  </g>
                </g>

                <!-- tech labels floating -->
                <g class="hero-orbit-labels" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="0.1em">
                  <text x="60" y="70" font-weight="500">PYTHON</text>
                  <text x="310" y="85" font-weight="500">FLUTTER</text>
                  <text x="30" y="330" font-weight="500">AI · ML</text>
                  <text x="300" y="340" font-weight="500">FASTAPI</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  HOW_MONEY                                                          */
    /* ------------------------------------------------------------------ */
    how_money: (data) => `
      <section id="how_money" class="${sectionBgClass()}">
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
      <section id="market" class="${sectionBgClass()}">
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
      <section id="solution" class="${sectionBgClass()}">
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
          <p class="solution-tech-link">Подробнее о продуктах, стеке и команде — <a href="https://tech.quillon.ru" target="_blank" rel="noopener">tech.quillon.ru</a></p>
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
      <section id="format" class="${sectionBgClass()}">
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
      <section id="quillon_jobs" class="${sectionBgClass()}">
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
      <section id="products" class="${sectionBgClass()}">
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
      <section id="path" class="${sectionBgClass()}">
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
      <section id="ai_answer" class="${sectionBgClass()}">
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
      <section id="launchpad" class="${sectionBgClass()}">
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
      <section id="advantages" class="${sectionBgClass()}">
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
    audience: (data) => {
      const audienceCard = (p, accentIdx) => `
        <article class="card audience-card" style="--audience-accent: var(--audience-accent-${accentIdx % 6});">
          <div class="audience-card-head">
            <span class="audience-emoji">${icon(p.emoji, p.emoji)}</span>
            ${p.tag ? `<span class="audience-tag">${p.tag}</span>` : ''}
          </div>
          <h3 class="audience-title">${p.title}</h3>
          ${p.pain ? `<p class="audience-pain">${p.pain}</p>` : ''}
          ${p.solution ? `
            <div class="audience-solution">
              <span class="audience-solution-mark" aria-hidden="true">→</span>
              <p>${p.solution}</p>
            </div>
          ` : (p.text ? `<p class="audience-pain">${p.text}</p>` : '')}
        </article>`;
      const groupsHtml = data.groups ? data.groups.map((g, gi) => `
        <div class="audience-group">
          <div class="audience-group-header">
            <span class="audience-group-index">${String(gi + 1).padStart(2, '0')} / ${String(data.groups.length).padStart(2, '0')}</span>
            <h3 class="audience-group-title">${g.title}</h3>
            ${g.subtitle ? `<p class="audience-group-subtitle">${g.subtitle}</p>` : ''}
          </div>
          <div class="audience-grid" data-stagger="true">
            ${g.personas.map((p, i) => audienceCard(p, gi * g.personas.length + i)).join('')}
          </div>
        </div>
      `).join('') : `
        <div class="audience-grid" data-stagger="true">
          ${data.personas.map((p, i) => audienceCard(p, i)).join('')}
        </div>`;
      return `
      <section id="audience" class="${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          ${groupsHtml}
        </div>
      </section>`;
    },

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
      <section id="faq" class="${sectionBgClass()}">
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
      <section id="startup" class="${sectionBgClass()}">
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
      <section id="quilly_ai" class="${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}

          <!-- Flow diagram: question → AI → answer -->
          <div class="quilly-flow" aria-hidden="true">
            <svg class="quilly-flow-svg" viewBox="0 0 900 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="qfCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#F0F4FF"/>
                  <stop offset="45%" stop-color="#3B6FFF"/>
                  <stop offset="100%" stop-color="#1F4ED8"/>
                </radialGradient>
                <linearGradient id="qfLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"  stop-color="#3B6FFF" stop-opacity="0"/>
                  <stop offset="50%" stop-color="#3B6FFF" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="#3B6FFF" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="qfLine2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"  stop-color="#7C3AED" stop-opacity="0"/>
                  <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
                </linearGradient>
                <filter id="qfGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
                </filter>
              </defs>

              <!-- Connector lines (static base) -->
              <line x1="160" y1="110" x2="380" y2="110" stroke="url(#qfLine)"  stroke-width="1.5"/>
              <line x1="520" y1="110" x2="740" y2="110" stroke="url(#qfLine2)" stroke-width="1.5"/>

              <!-- Animated data packets travelling along lines -->
              <circle class="qf-packet qf-packet--1" r="3" fill="#3B6FFF"/>
              <circle class="qf-packet qf-packet--2" r="3" fill="#7C3AED"/>

              <!-- Node 1: QUESTION bubble -->
              <g class="qf-node qf-node--question">
                <circle cx="100" cy="110" r="42" fill="#0F172A" stroke="rgba(59,111,255,0.3)" stroke-width="1"/>
                <circle cx="100" cy="110" r="48" fill="none" stroke="rgba(59,111,255,0.18)" stroke-width="1" stroke-dasharray="2 5"/>
                <text x="100" y="120" text-anchor="middle" font-family="Syne, sans-serif" font-size="28" font-weight="700" fill="#3B6FFF">?</text>
              </g>
              <text class="qf-label" x="100" y="185" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="500" letter-spacing="0.12em">ВОПРОС</text>

              <!-- Node 2: AI core (orbit-style, matches hero) -->
              <g class="qf-node qf-node--ai">
                <circle cx="450" cy="110" r="58" fill="none" stroke="rgba(59,111,255,0.22)" stroke-width="1" stroke-dasharray="1.5 5"/>
                <circle cx="450" cy="110" r="44" fill="none" stroke="rgba(59,111,255,0.35)" stroke-width="1"/>
                <circle class="qf-core-glow" cx="450" cy="110" r="26" fill="#3B6FFF" fill-opacity="0.3" filter="url(#qfGlow)"/>
                <circle cx="450" cy="110" r="14" fill="url(#qfCore)"/>
              </g>
              <text class="qf-label qf-label--ai" x="450" y="195" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" letter-spacing="0.14em">QUILLY AI</text>

              <!-- Node 3: ANSWER bubble (checkmark) -->
              <g class="qf-node qf-node--answer">
                <circle cx="800" cy="110" r="42" fill="#0F172A" stroke="rgba(124,58,237,0.3)" stroke-width="1"/>
                <circle cx="800" cy="110" r="48" fill="none" stroke="rgba(124,58,237,0.18)" stroke-width="1" stroke-dasharray="2 5"/>
                <path d="M 785 110 L 797 122 L 815 100" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </g>
              <text class="qf-label" x="800" y="185" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" font-weight="500" letter-spacing="0.12em">ОТВЕТ · КОД · РАЗБОР</text>
            </svg>
          </div>

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
      <section id="contact_form" class="${sectionBgClass()}">
        <div class="container">
          <div class="contact-form-layout">
            <div class="contact-form-info">
              <span class="section-label">${data.label}</span>
              <h2>${data.title}</h2>
              <p class="contact-form-desc">${data.subtitle}</p>
              <div class="contact-form-points">
                <div class="contact-form-point">
                  <span class="contact-form-point-icon"></span>
                  <div>
                    <div class="contact-form-point-title">Персональный разбор</div>
                    <div class="contact-form-point-desc">Подберём направление под ваш опыт, цели и график</div>
                  </div>
                </div>
                <div class="contact-form-point">
                  <span class="contact-form-point-icon"></span>
                  <div>
                    <div class="contact-form-point-title">Прогноз заработка</div>
                    <div class="contact-form-point-desc">Покажем, сколько зарабатывают участники на вашем треке</div>
                  </div>
                </div>
                <div class="contact-form-point">
                  <span class="contact-form-point-icon"></span>
                  <div>
                    <div class="contact-form-point-title">Мини-курс в подарок</div>
                    <div class="contact-form-point-desc">Vibe Coding &amp; Prompt Engineering — сразу после записи</div>
                  </div>
                </div>
                <div class="contact-form-point">
                  <span class="contact-form-point-icon"></span>
                  <div>
                    <div class="contact-form-point-title">Без обязательств</div>
                    <div class="contact-form-point-desc">Консультация ни к чему не обязывает — решение всегда за вами</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="contact-form-card">
              <div class="contact-form-bonus">
                <span class="contact-form-bonus-badge">Бонус</span>
                <span class="contact-form-bonus-text">Бесплатный мини-курс «Vibe Coding & Prompt Engineering» — сразу после записи</span>
              </div>
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
                    <input type="email" id="contact-email" name="email" placeholder="Ваша почта">
                  </div>
                </div>
                <div class="contact-form-consent">
                  <label class="checkbox-label">
                    <input type="checkbox" name="consent" required>
                    <span>Даю согласие на обработку <a href="/docs/consent.pdf" target="_blank" rel="noopener">персональных данных</a></span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="ad_consent">
                    <span>Даю согласие на получение <a href="/docs/ad-consent.pdf" target="_blank" rel="noopener">рекламных материалов</a></span>
                  </label>
                </div>
                <button type="submit" class="btn btn-primary btn-big contact-form-submit">${data.cta.text}</button>
              </form>
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  FINAL_CTA                                                          */
    /* ------------------------------------------------------------------ */
    final_cta: (data, settings) => `
      <section id="final_cta" class="animate-on-scroll final-cta-section">
        <div class="final-cta-bg" aria-hidden="true">
          <svg class="final-cta-constellation" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/>
              </filter>
              <linearGradient id="lineFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#3B6FFF" stop-opacity="0"/>
                <stop offset="50%" stop-color="#3B6FFF" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#3B6FFF" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="shootingStar" x1="0" y1="0" x2="1" y2="0.2">
                <stop offset="0%" stop-color="#F0F4FF" stop-opacity="0"/>
                <stop offset="70%" stop-color="#F0F4FF" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#3B6FFF" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- LEFT constellation cluster -->
            <g class="cta-stars-left">
              <!-- Connecting lines -->
              <line x1="90"  y1="120" x2="210" y2="180" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="210" y1="180" x2="160" y2="340" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="160" y1="340" x2="310" y2="420" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="310" y1="420" x2="280" y2="260" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="280" y1="260" x2="210" y2="180" stroke="url(#lineFade)" stroke-width="1"/>

              <!-- Accent stars with glow -->
              <circle cx="210" cy="180" r="3" fill="#3B6FFF"/>
              <circle cx="210" cy="180" r="7" fill="#3B6FFF" fill-opacity="0.3" filter="url(#starGlow)"/>

              <circle cx="310" cy="420" r="2.5" fill="#7C3AED"/>
              <circle cx="310" cy="420" r="6" fill="#7C3AED" fill-opacity="0.25" filter="url(#starGlow)"/>

              <!-- Small stars -->
              <circle cx="90"  cy="120" r="1.5" fill="#F0F4FF" fill-opacity="0.6"/>
              <circle cx="160" cy="340" r="1.8" fill="#F0F4FF" fill-opacity="0.5"/>
              <circle cx="280" cy="260" r="1.2" fill="#F0F4FF" fill-opacity="0.4"/>
              <circle cx="50"  cy="420" r="1"   fill="#F0F4FF" fill-opacity="0.3"/>
              <circle cx="130" cy="500" r="1.5" fill="#F0F4FF" fill-opacity="0.45"/>
              <circle cx="350" cy="150" r="1"   fill="#F0F4FF" fill-opacity="0.35"/>
            </g>

            <!-- RIGHT constellation cluster -->
            <g class="cta-stars-right">
              <line x1="890"  y1="150" x2="1010" y2="240" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="1010" y1="240" x2="960"  y2="400" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="960"  y1="400" x2="1100" y2="450" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="1100" y1="450" x2="1130" y2="280" stroke="url(#lineFade)" stroke-width="1"/>
              <line x1="1130" y1="280" x2="1010" y2="240" stroke="url(#lineFade)" stroke-width="1"/>

              <circle cx="1010" cy="240" r="3" fill="#7C3AED"/>
              <circle cx="1010" cy="240" r="7" fill="#7C3AED" fill-opacity="0.3" filter="url(#starGlow)"/>

              <circle cx="1100" cy="450" r="2.5" fill="#3B6FFF"/>
              <circle cx="1100" cy="450" r="6" fill="#3B6FFF" fill-opacity="0.25" filter="url(#starGlow)"/>

              <circle cx="890"  cy="150" r="1.5" fill="#F0F4FF" fill-opacity="0.6"/>
              <circle cx="960"  cy="400" r="1.8" fill="#F0F4FF" fill-opacity="0.5"/>
              <circle cx="1130" cy="280" r="1.2" fill="#F0F4FF" fill-opacity="0.4"/>
              <circle cx="1150" cy="130" r="1"   fill="#F0F4FF" fill-opacity="0.3"/>
              <circle cx="1070" cy="520" r="1.5" fill="#F0F4FF" fill-opacity="0.45"/>
              <circle cx="850"  cy="350" r="1"   fill="#F0F4FF" fill-opacity="0.35"/>
            </g>

            <!-- Shooting stars — animated via CSS -->
            <g class="cta-shooting">
              <line class="cta-shoot cta-shoot--1" x1="-100" y1="80"  x2="80"   y2="140" stroke="url(#shootingStar)" stroke-width="1.4" stroke-linecap="round"/>
              <line class="cta-shoot cta-shoot--2" x1="1220" y1="500" x2="1040" y2="450" stroke="url(#shootingStar)" stroke-width="1.4" stroke-linecap="round"/>
            </g>
          </svg>
        </div>

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
      </section>`,

    /* =================================================================== */
    /*  TRACK PAGE SECTIONS                                                 */
    /*  Used only on /tracks/{slug}/ pages. Each section has its own id    */
    /*  and renders from per-track JSON (not the main content.json).       */
    /* =================================================================== */

    /* ------------------------------------------------------------------ */
    /*  TRACK_HERO                                                         */
    /* ------------------------------------------------------------------ */
    trackHero: (data) => {
      const slug = trackSlug;
      const visual = slug === 'flutter'
        ? trackHeroVisuals.flutter()
        : trackHeroVisuals.pythonBackend();
      return `
      <section id="hero" class="track-hero track-hero--${slug || 'default'}">
        <div class="hero-bg"></div>
        <div class="hero-grid"></div>
        <div class="container">
          <div class="track-hero-layout">
            <div class="track-hero-content">
              <span class="track-hero-supertag">${data.supertag}</span>
              <h1 class="track-hero-title">${data.title}</h1>
              <p class="track-hero-sub">${data.subtitle}</p>
              <div class="track-hero-stats">
                ${(data.stats || []).map(s => `
                  <div class="track-hero-stat">
                    <span class="track-hero-stat-value">${s.value}</span>
                    <span class="track-hero-stat-label">${s.label}</span>
                  </div>
                `).join('')}
              </div>
              <div class="hero-ctas track-hero-ctas">
                <a href="${data.cta_primary.href}" class="btn btn-primary btn-big btn-hero-cta">
                  <span class="btn-hero-title">${data.cta_primary.title} →</span>
                  <span class="btn-hero-sub">${data.cta_primary.subtitle}</span>
                </a>
                <a href="${data.cta_secondary.href}" class="btn btn-secondary">${data.cta_secondary.text}</a>
              </div>
            </div>
            <div class="track-hero-visual" aria-hidden="true">
              ${visual}
              <div class="track-hero-glow"></div>
            </div>
          </div>
        </div>
      </section>`;
    },

    /* ------------------------------------------------------------------ */
    /*  TRACK_DEMAND — market demand & why this stack                     */
    /* ------------------------------------------------------------------ */
    trackDemand: (data) => {
      const demandColors = ['#3B6FFF', '#10B981', '#F59E0B', '#7C3AED'];
      return `
      <section id="demand" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-4 demand-grid" data-stagger="true">
            ${data.points.map((p, i) => `
              <div class="card demand-card" style="--demand-accent:${demandColors[i % demandColors.length]}">
                <div class="demand-icon">${icon(p.icon, '')}</div>
                <h3 class="demand-title">${p.title}</h3>
                <p class="demand-text">${p.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
    },

    /* ------------------------------------------------------------------ */
    /*  TRACK_FIT — who this is for / not for                              */
    /* ------------------------------------------------------------------ */
    trackFit: (data) => `
      <section id="fit" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="fit-layout">
            <div class="fit-col fit-col-yes">
              <div class="fit-col-head">
                <span class="fit-col-icon fit-col-icon-yes">${icon('check-circle-2', '')}</span>
                <h3>${data.title}</h3>
              </div>
              <ul class="fit-list">
                ${data.fit.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            <div class="fit-col fit-col-no">
              <div class="fit-col-head">
                <span class="fit-col-icon fit-col-icon-no">${icon('x-circle', '')}</span>
                <h3>${data.not_fit_title}</h3>
              </div>
              <ul class="fit-list fit-list-no">
                ${data.not_fit.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_PROGRAM — weekly module breakdown                            */
    /* ------------------------------------------------------------------ */
    trackProgram: (data) => {
      const moduleColors = ['#3B6FFF', '#7C3AED', '#10B981', '#F59E0B', '#EC4899'];
      return `
      <section id="program" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="program-timeline">
            <div class="program-timeline-line" aria-hidden="true"></div>
            ${data.modules.map((m, i) => {
              const color = moduleColors[i % moduleColors.length];
              return `
              <article class="program-module" style="--module-accent:${color}">
                <div class="program-module-marker" aria-hidden="true">
                  <span class="program-module-step">${String(i + 1).padStart(2, '0')}</span>
                </div>
                <div class="program-module-card">
                  <div class="program-module-head">
                    <span class="program-module-num">Модуль ${i + 1}</span>
                    <span class="program-module-weeks">${m.period}</span>
                  </div>
                  <h3 class="program-module-title">${m.title}</h3>
                  <ul class="program-module-topics">
                    ${m.topics.map(t => `<li>${t}</li>`).join('')}
                  </ul>
                  <div class="program-module-outcome">
                    <span class="program-module-outcome-label">Результат</span>
                    <p>${m.outcome}</p>
                  </div>
                </div>
              </article>`;
            }).join('')}
          </div>
        </div>
      </section>`;
    },

    /* ------------------------------------------------------------------ */
    /*  TRACK_STACK — grouped stack with rationale                         */
    /* ------------------------------------------------------------------ */
    trackStack: (data) => `
      <section id="stack" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="stack-groups">
            ${data.groups.map(g => `
              <div class="stack-group">
                <h3 class="stack-group-title">${g.title}</h3>
                <div class="stack-group-items">
                  ${g.items.map(it => `
                    <div class="stack-item">
                      <span class="stack-item-name">${it.name}</span>
                      <span class="stack-item-why">${it.why}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_PROJECTS — portfolio projects                                */
    /* ------------------------------------------------------------------ */
    trackProjects: (data) => {
      const projColors = ['#3B6FFF', '#7C3AED', '#10B981', '#F59E0B', '#EC4899'];
      return `
      <section id="projects" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="projects-layout" data-stagger="true">
            ${data.items.map((p, i) => `
              <article class="card project-card ${i === 0 ? 'project-card-featured' : ''}" style="--proj-accent:${projColors[i % projColors.length]}">
                <span class="project-emoji">${icon(p.emoji, '')}</span>
                <div class="project-body">
                  <h3 class="project-title">${p.title}</h3>
                  <p class="project-text">${p.text}</p>
                  <div class="project-tech">
                    ${p.tech.map(t => `<span class="project-tech-chip">${t}</span>`).join('')}
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>`;
    },

    /* ------------------------------------------------------------------ */
    /*  TRACK_LESSON_DEMO — embedded lesson player (auto-load iframe)      */
    /* ------------------------------------------------------------------ */
    trackLessonDemo: (data) => `
      <section id="lesson-demo" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="lesson-demo-embed-wrap">
            <div class="lesson-demo-player lesson-demo-autoload"
                 data-embed-src="${data.embed.src}"
                 data-fallback="${data.embed.fallback_href}">
              <div class="lesson-demo-loading" aria-label="Загрузка урока">
                <span class="lesson-demo-spinner"></span>
                <span>Загружаем урок...</span>
              </div>
            </div>
          </div>
          <div class="lesson-demo-bar">
            <div class="lesson-demo-bar-info">
              <span class="lesson-demo-bar-title">${data.embed.poster_title}</span>
              <span class="lesson-demo-bar-sub">${data.embed.poster_subtitle}</span>
            </div>
            <div class="lesson-demo-chips">
              ${(data.embed.poster_chips || []).map(c => `<span class="lesson-demo-chip">${c}</span>`).join('')}
            </div>
            <a href="${data.embed.fallback_href}" target="_blank" rel="noopener" class="lesson-demo-bar-link">Открыть в новой вкладке →</a>
          </div>
          <div class="lesson-demo-features-row">
            ${data.features.map(f => `
              <div class="lesson-demo-feature">
                <span class="lesson-demo-feature-icon">${icon(f.icon, '')}</span>
                <div>
                  <h4>${f.title}</h4>
                  <p>${f.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_QUILLY_AI — track-specific tutor usage                       */
    /* ------------------------------------------------------------------ */
    trackQuillyAi: (data) => `
      <section id="quilly-ai" class="animate-on-scroll ${sectionBgClass()} track-quilly">
        <div class="container">
          ${sectionHeader(data)}
          <div class="quilly-layout">
            <div class="quilly-chat" aria-hidden="true">
              <div class="quilly-chat-header">
                <span class="quilly-chat-avatar">Q</span>
                <div>
                  <span class="quilly-chat-name">Квилли</span>
                  <span class="quilly-chat-status">онлайн</span>
                </div>
              </div>
              <div class="quilly-chat-body">
                <div class="quilly-msg quilly-msg-user">
                  <p>У меня ошибка <code>TypeError: 'NoneType'</code> на строке 42. Не могу понять, почему</p>
                </div>
                <div class="quilly-msg quilly-msg-ai">
                  <p>Вижу проблему! Функция <code>get_user()</code> возвращает <code>None</code>, когда пользователь не найден в БД. Добавь проверку:</p>
                  <pre class="quilly-msg-code"><code><span class="c-kw">if</span> user <span class="c-kw">is</span> <span class="c-kw">None</span>:
    <span class="c-kw">raise</span> HTTPException(<span class="c-tp">404</span>)</code></pre>
                </div>
                <div class="quilly-msg quilly-msg-user">
                  <p>Работает, спасибо! А как лучше обрабатывать такие случаи в FastAPI?</p>
                </div>
                <div class="quilly-msg quilly-msg-ai quilly-msg-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div class="quilly-chat-input">
                <span>Спроси Квилли...</span>
              </div>
            </div>
            <div class="quilly-features-wrap">
              <div class="grid-2 track-quilly-grid" data-stagger="true">
                ${data.use_cases.map(u => `
                  <div class="card track-quilly-card">
                    <span class="track-quilly-icon">${icon(u.icon, '')}</span>
                    <h3>${u.title}</h3>
                    <p>${u.text}</p>
                  </div>
                `).join('')}
              </div>
              ${inlineCta(data.cta)}
            </div>
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_MENTORS                                                      */
    /* ------------------------------------------------------------------ */
    trackMentors: (data) => {
      const avatarGradients = [
        ['#3B6FFF', '#7C3AED'],
        ['#10B981', '#3B6FFF'],
        ['#F59E0B', '#EC4899'],
        ['#7C3AED', '#EC4899']
      ];
      return `
      <section id="mentors" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="grid-2 mentors-grid" data-stagger="true">
            ${data.items.map((m, i) => {
              const [c1, c2] = avatarGradients[i % avatarGradients.length];
              return `
              <article class="card mentor-card">
                <div class="mentor-avatar" aria-hidden="true" style="background:linear-gradient(135deg,${c1},${c2})">
                  <span>${m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                </div>
                <div class="mentor-body">
                  <h3 class="mentor-name">${m.name}</h3>
                  <div class="mentor-role">${m.role} · <span class="mentor-company">${m.company}</span></div>
                  <div class="mentor-meta">
                    <span class="mentor-years">${m.years}</span>
                    <span class="mentor-expertise">${m.expertise}</span>
                  </div>
                  <p class="mentor-bio">${m.bio}</p>
                </div>
              </article>`;
            }).join('')}
          </div>
          <p class="mentors-disclaimer">* Данные менторов — для примера. Полный список преподавателей мы показываем после прохождения теста.</p>
        </div>
      </section>`;
    },

    /* ------------------------------------------------------------------ */
    /*  TRACK_CAREER — career growth path                                  */
    /* ------------------------------------------------------------------ */
    trackCareer: (data) => `
      <section id="career" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="career-path">
            ${data.path.map((p, i) => `
              <div class="career-step">
                <div class="career-step-marker">
                  <span class="career-step-num">${i + 1}</span>
                </div>
                <div class="career-step-body">
                  <div class="career-step-head">
                    <span class="career-step-level">${p.level}</span>
                    <h3 class="career-step-role">${p.role}</h3>
                    <span class="career-step-salary">${p.salary}</span>
                  </div>
                  <p class="career-step-text">${p.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ${data.adjacent_title ? `
            <div class="career-adjacent">
              <h3 class="career-adjacent-title">${data.adjacent_title}</h3>
              <div class="career-adjacent-chips">
                ${data.adjacent.map(a => `<span class="career-adjacent-chip">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_FAQ — same markup as main faq, just id scope                */
    /* ------------------------------------------------------------------ */
    trackFaq: (data) => `
      <section id="faq" class="animate-on-scroll ${sectionBgClass()}">
        <div class="container">
          ${sectionHeader(data)}
          <div class="faq-list">
            ${data.items.map((q, i) => `
              <details class="faq-item" ${i === 0 ? 'open' : ''}>
                <summary class="faq-q">${q.q}</summary>
                <div class="faq-a">${q.a}</div>
              </details>
            `).join('')}
          </div>
        </div>
      </section>`,

    /* ------------------------------------------------------------------ */
    /*  TRACK_FINAL_CTA                                                    */
    /* ------------------------------------------------------------------ */
    trackFinalCta: (data) => `
      <section id="final_cta" class="animate-on-scroll final-cta-section">
        <div class="container final-cta-container">
          ${data.label ? `<span class="section-label">${data.label}</span>` : ''}
          <h2>${data.title}</h2>
          <p class="final-cta-sub">${data.subtitle}</p>
          <a href="${data.cta.href}" class="btn btn-primary btn-big btn-hero-cta">
            <span class="btn-hero-title">${data.cta.title} →</span>
            <span class="btn-hero-sub">${data.cta.subtitle}</span>
          </a>
          <p class="final-cta-micro">${data.micro}</p>
        </div>
      </section>`
  };

  /* ── 5. Render all sections ──────────────────────────────────────────── */
  const app = document.getElementById('app');
  let html = '';

  /**
   * Render a single section.
   *  `id`  — DOM id / key, used for bg alternation skipping.
   *  `data` — data object passed to renderer.
   *  `renderer` — template function to invoke.
   */
  function renderSection(id, data, renderer) {
    if (!renderer || !data) return;
    if (id !== 'hero') sectionIndex++;
    html += addTooltips(renderer(data, settings));
  }

  if (pageType === 'track' && trackContent) {
    /* ── Track page: fixed order, mixes per-track + shared data ── */
    const t = trackContent;

    const divider = '<hr class="track-section-divider" aria-hidden="true">';

    // Track-specific sections first
    renderSection('hero', t.hero, sectionRenderers.trackHero);
    renderSection('demand', t.demand, sectionRenderers.trackDemand);
    renderSection('fit', t.fit, sectionRenderers.trackFit);
    html += divider;
    renderSection('program', t.program, sectionRenderers.trackProgram);
    renderSection('stack', t.stack, sectionRenderers.trackStack);
    renderSection('projects', t.projects, sectionRenderers.trackProjects);
    html += divider;
    renderSection('lesson-demo', t.lesson_demo, sectionRenderers.trackLessonDemo);
    renderSection('quilly-ai', t.quilly_ai, sectionRenderers.trackQuillyAi);
    renderSection('mentors', t.mentors, sectionRenderers.trackMentors);
    html += divider;

    // Shared sections from main content.json — reuse main templates
    renderSection('startup', content.startup, sectionRenderers.startup);
    renderSection('format', content.format, sectionRenderers.format);
    renderSection('launchpad', content.launchpad, sectionRenderers.launchpad);
    renderSection('quillon_jobs', content.quillon_jobs, sectionRenderers.quillon_jobs);
    renderSection('how_money', content.how_money, sectionRenderers.how_money);
    html += divider;

    // Pricing — shared markup but override CTA with track-specific link
    if (content.pricing) {
      const pricingData = Object.assign({}, content.pricing);
      if (t.pricing_override?.cta) {
        pricingData.cta = Object.assign({}, pricingData.cta, t.pricing_override.cta);
      }
      renderSection('pricing', pricingData, sectionRenderers.pricing);
    }

    // Track-specific close
    renderSection('career', t.career, sectionRenderers.trackCareer);
    renderSection('faq', t.faq, sectionRenderers.trackFaq);
    renderSection('final_cta', t.final_cta, sectionRenderers.trackFinalCta);

  } else {
    /* ── Main page: driven by sections.json ordering ── */
    sections.forEach(section => {
      if (!section.visible) return;
      const data = content[section.id];
      if (!data) return;
      renderSection(section.id, data, sectionRenderers[section.id]);
    });
  }

  app.innerHTML = html;

  /* ── Auto-mount lesson-demo iframe (inline, guarantees DOM is ready) ── */
  (function() {
    var player = document.querySelector('.lesson-demo-player');
    if (!player) return;
    var embedSrc = player.getAttribute('data-embed-src');
    if (!embedSrc || player.querySelector('iframe')) return;

    var frame = document.createElement('iframe');
    frame.src = embedSrc;
    frame.className = 'lesson-demo-frame';
    frame.setAttribute('allow', 'autoplay; clipboard-write');
    frame.setAttribute('title', 'Интерактивный урок Quillon');

    var loading = player.querySelector('.lesson-demo-loading');
    var failTimer = setTimeout(function() {
      if (!frame.dataset.loaded) {
        player.classList.add('lesson-demo-failed');
        if (loading) loading.innerHTML = '<span>Не удалось загрузить урок</span>';
      }
    }, 12000);

    frame.addEventListener('load', function() {
      frame.dataset.loaded = '1';
      clearTimeout(failTimer);
      player.classList.add('lesson-demo-active');
      if (loading) loading.style.display = 'none';
    });

    player.appendChild(frame);

    if (window.ym) window.ym(108311343, 'reachGoal', 'lesson_demo_view');

    // PostMessage analytics from embed
    window.addEventListener('message', function(ev) {
      if (!ev.origin || ev.origin.indexOf('quillon.ru') === -1) return;
      var msg = ev.data || {};
      if (!msg.type || msg.type.indexOf('lesson:') !== 0) return;
      if (window.ym) window.ym(108311343, 'reachGoal', msg.type.replace(':', '_'));
    });
  })();

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
            <span>${data.legal.company}</span>${data.legal.inn ? ' · <span>ИНН ' + data.legal.inn + '</span>' : ''}<br>
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
