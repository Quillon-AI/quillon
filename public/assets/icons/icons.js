/**
 * Quillon Icon System
 *
 * All icons are inline SVG strings, monochrome with currentColor.
 * - 48x48 viewBox: solution, advantages, products (stroke-width: 2)
 * - 32x32 viewBox: audience (stroke-width: 1.5)
 * - 64x64 viewBox: product logos (fill-based, #1F4ED8)
 *
 * Usage: element.innerHTML = ICONS['solution-company'];
 */

window.ICONS = {

  // ──────────────────────────────────────────────
  // SOLUTION (48x48, stroke)
  // ──────────────────────────────────────────────

  // IT-компания, а не школа — здание с символом кода внутри
  'solution-company': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 18h32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 8l4-2 4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 27l-3 3 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M29 27l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 25l-4 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // Команда с первого дня — связанные узлы / группа людей
  'solution-team': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="14" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 24a6 6 0 0 1 12 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="22" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 30a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="36" cy="22" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M31 30a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 25l-2 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M31 25l2 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M8 38h32" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  </svg>`,

  // Доход с 6 месяца — восходящий график с монетой
  'solution-income': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 36l8-8 6 4 10-12 8-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M34 14h6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="14" cy="38" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 36v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12.5 37.2h3c.8 0 .8 1.2 0 1.2h-2c-.8 0-.8 1.2 0 1.2h3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // ИИ встроен в каждый этап — мозг с нейронными связями
  'solution-ai': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8c-6 0-12 4-12 12 0 4 2 7 4 9 1.5 1.5 2 3 2 5v2h12v-2c0-2 .5-3.5 2-5 2-2 4-5 4-9 0-8-6-12-12-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 36h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 40h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.7"/>
    <circle cx="28" cy="20" r="1.5" fill="currentColor" opacity="0.7"/>
    <circle cx="24" cy="26" r="1.5" fill="currentColor" opacity="0.7"/>
    <path d="M20 20l4 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    <path d="M28 20l-4 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    <path d="M20 20h8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  </svg>`,


  // ──────────────────────────────────────────────
  // ADVANTAGES (48x48, stroke)
  // ──────────────────────────────────────────────

  // 01 Стажировка на реальных продуктах — ноутбук с кодом
  'adv-internship': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="22" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 36h40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 32h8v4h-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18 19l-3 3 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M30 19l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 17l-4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 02 Стартап как дипломный проект — ракета
  'adv-startup': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6c0 0-10 8-10 22h20C34 14 24 6 24 6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24" cy="20" r="3" stroke="currentColor" stroke-width="2"/>
    <path d="M14 28c-4 0-6 4-6 8h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M34 28c4 0 6 4 6 8h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 36l-2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M24 36v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 36l2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 03 Первый доход с 6 месяца — кошелёк с монетой
  'adv-income': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="36" height="24" rx="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 16l6-6h24l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="30" y="24" width="12" height="8" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="36" cy="28" r="1.5" fill="currentColor"/>
    <circle cx="18" cy="10" r="4" stroke="currentColor" stroke-width="2"/>
    <path d="M18 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M16.5 9.2h3c.7 0 .7 1.2 0 1.2h-2c-.7 0-.7 1.2 0 1.2h3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // 04 Кросс-функциональные команды — сетка узлов
  'adv-crossteam': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="10" r="4" stroke="currentColor" stroke-width="2"/>
    <circle cx="10" cy="24" r="4" stroke="currentColor" stroke-width="2"/>
    <circle cx="38" cy="24" r="4" stroke="currentColor" stroke-width="2"/>
    <circle cx="16" cy="38" r="4" stroke="currentColor" stroke-width="2"/>
    <circle cx="32" cy="38" r="4" stroke="currentColor" stroke-width="2"/>
    <path d="M21 13l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M27 13l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M13 27l2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M35 27l-2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M20 38h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M14 24h20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  </svg>`,

  // 05 ИИ с первого дня — робот / ИИ-чип
  'adv-ai': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="14" width="24" height="24" rx="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="18" y="20" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22" cy="26" r="1.5" fill="currentColor"/>
    <circle cx="26" cy="26" r="1.5" fill="currentColor"/>
    <path d="M21 30h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M24 8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="24" cy="7" r="2" stroke="currentColor" stroke-width="2"/>
    <path d="M8 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 30h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M36 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M36 30h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // 06 Помощь до первого оффера — рукопожатие
  'adv-career': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 20h6l4 4 8-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 20h-6l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 24l6 6 4-3 4 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 30l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 34l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="4" y="14" width="8" height="14" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="36" y="14" width="8" height="14" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,


  // ──────────────────────────────────────────────
  // AUDIENCE (32x32, stroke-width 1.5)
  // ──────────────────────────────────────────────

  // Менеджер — портфель
  'audience-manager': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="12" width="24" height="14" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 12V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 18h24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 18v2h4v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Выпускник — шапка выпускника
  'audience-graduate': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 6L2 13l14 7 14-7L16 6z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 16.5v7c0 0 3.5 3.5 8 3.5s8-3.5 8-3.5v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 13v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Самоучка — ноутбук с вопросом
  'audience-selftaught': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 24h28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 20h8v4H12z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 12a2 2 0 0 1 2-2 2 2 0 0 1 2 2c0 1.2-2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="17" r="0.75" fill="currentColor"/>
  </svg>`,

  // В декрете — дом с сердцем
  'audience-parent': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15L16 5l12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 14v12h18V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 17c-1-1.5-3-1.5-3.5 0-.5 1.5 3.5 4.5 3.5 4.5s4-3 3.5-4.5c-.5-1.5-2.5-1.5-3.5 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // В поиске — лупа с компасом
  'audience-searching': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 20l7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 9v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 10v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 19v-1" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    <path d="M9 14h-1" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    <path d="M20 14h-1" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  </svg>`,

  // Предприниматель — ракета
  'audience-entrepreneur': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4c0 0-7 5-7 16h14C23 9 16 4 16 4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="14" r="2" stroke="currentColor" stroke-width="1.5"/>
    <path d="M9 20c-3 0-4 3-4 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 20c3 0 4 3 4 6h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 24l-1 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M16 24v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M19 24l1 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Дизайнер — перо / палитра
  'audience-designer': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4l4 4-16 16H8v-4L24 4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4 28h24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Техподдержка — гаечный ключ
  'audience-support': `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24l12-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22 6a6 6 0 0 1 4 10l-2-2-3 1-1 3 2 2A6 6 0 0 1 12 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 20a6 6 0 0 0-4 6 6 6 0 0 0 6-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7" cy="25" r="1.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,


  // ──────────────────────────────────────────────
  // PRODUCTS (48x48, stroke)
  // ──────────────────────────────────────────────

  // Quilly AI (ChatAI) — мозг с пузырём чата
  'product-chatai': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 18c-4 0-8 3-8 8s4 8 8 8c1 0 2-.2 3-.5L14 38l6-4c1 .3 2.5.5 4 .5 4 0 8-3 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 8c-5 0-10 3.5-10 9 0 3 1.5 5 3 6.5 1 1 1.5 2 1.5 3.5v1h11v-1c0-1.5.5-2.5 1.5-3.5 1.5-1.5 3-3.5 3-6.5 0-5.5-5-9-10-9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 27.5h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 30h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="21" cy="16" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="27" cy="16" r="1" fill="currentColor" opacity="0.6"/>
    <path d="M21 16l3 4 3-4" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  </svg>`,

  // Quillon Meet — видеокамера
  'product-meet': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M32 20l10-5v18l-10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="18" cy="24" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <circle cx="18" cy="24" r="1.5" fill="currentColor" opacity="0.4"/>
  </svg>`,

  // Quillon LMS — книга с прогресс-баром
  'product-lms': `<svg viewBox="0 0 48 48" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8h12a4 4 0 0 1 4 4v28c-2-2-5-3-8-3H8V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 8H28a4 4 0 0 0-4 4v28c2-2 5-3 8-3h8V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M13 22h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="30" y="16" width="6" height="2" rx="1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="30" y="16" width="4" height="2" rx="1" fill="currentColor" opacity="0.3"/>
    <path d="M31 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,


  // ──────────────────────────────────────────────
  // PRODUCT LOGOS (64x64, fill-based, brand blue)
  // ──────────────────────────────────────────────

  // Quilly AI Logo — ромбовидный контейнер + мозг/нейросеть
  'logo-quilly-ai': `<svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10.4" y="10.4" width="43.2" height="43.2" rx="8" transform="rotate(45 32 32)" stroke="#1F4ED8" stroke-width="2.5" fill="none"/>
    <path d="M32 18c-4.5 0-9 3-9 8s4.5 8 9 8 9-3 9-8-4.5-8-9-8z" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="28" cy="25" r="1.5" fill="#1F4ED8"/>
    <circle cx="36" cy="25" r="1.5" fill="#1F4ED8"/>
    <circle cx="32" cy="30" r="1.5" fill="#1F4ED8"/>
    <path d="M28 25l4 5" stroke="#1F4ED8" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    <path d="M36 25l-4 5" stroke="#1F4ED8" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    <path d="M28 25h8" stroke="#1F4ED8" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    <path d="M32 34v4" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round"/>
    <path d="M29 38h6" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round"/>
    <path d="M30 41h4" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // Quillon Meet Logo — ромбовидный контейнер + видеокамера
  'logo-quillon-meet': `<svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10.4" y="10.4" width="43.2" height="43.2" rx="8" transform="rotate(45 32 32)" stroke="#1F4ED8" stroke-width="2.5" fill="none"/>
    <rect x="16" y="24" width="22" height="16" rx="3" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 28l8-4v16l-8-4" stroke="#1F4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="27" cy="32" r="3" stroke="#1F4ED8" stroke-width="1.5" opacity="0.5"/>
    <circle cx="27" cy="32" r="1" fill="#1F4ED8" opacity="0.4"/>
  </svg>`,
};

// Export for both module and script usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICONS;
}
