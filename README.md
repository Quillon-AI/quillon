# Quillon — IT-образовательная платформа

## Структура проекта

```
quillon/
├── README.md                 ← Этот файл
├── css/
│   ├── design-system.css     ← Токены, шрифты, reset, анимации
│   ├── components.css        ← Nav, кнопки, карточки, формы, аккордеон, footer
│   └── landing.css           ← Стили квиз-лендинга (hero, quiz, results)
├── js/
│   ├── app1.js               ← Частицы hero, SVG, лабиринт
│   ├── app2.js               ← Квиз-движок, навигация, drag/maze
│   └── app3.js               ← Результаты, roadmap, форма, FAQ
├── pages/                    ← Будущие страницы
├── components/               ← Будущие HTML-компоненты
├── assets/                   ← Изображения, иконки
└── index.html                ← Квиз-лендинг (dev-версия)
```

## Дизайн-система (css/design-system.css)

### Цвета
- Brand: `--qb` (#1F4ED8), `--qbl` (#3B82F6), `--qp` (#7C3AED)
- BG: `--bg0` (#080B14) → `--bg1` → `--bg2` (#141D35)
- Text: `--t1` (primary) → `--t2` (secondary) → `--t3` (muted)
- Status: `--ok` (green), `--err` (red), `--warn` (orange)

### Шрифты
- `--fd` Syne — заголовки
- `--fb` DM Sans — текст
- `--fm` JetBrains Mono — код

## Компоненты (css/components.css)

Nav: `.nav`, `.nav-logo`, `.nav-links`, `.nav-link`, `.nav-btn`
Кнопки: `.btn-big`, `.btn-primary`, `.btn-secondary`, `.btn-submit`
Карточки: `.card`, `.card-highlight`
Формы: `.form-row`, `.form-input`, `.form-consent`
Секции: `.section`, `.section-header`
Аккордеон: `.accordion`, `.acc-item`, `.acc-trigger`, `.acc-icon`, `.acc-body`
Теги: `.tag-blue`, `.tag-green`, `.tag-purple`, `.tag-orange`, `.tag-ok`
Шаги: `.steps-grid`, `.step-card`, `.step-number`, `.step-icon`
Footer: `.footer`, `.footer-logo`

## Сборка

```bash
bash /home/claude/q6/build.sh
# → /mnt/user-data/outputs/quillon-landing-v6.html (один файл)
```

## Для новых страниц

```html
<link href="css/design-system.css" rel="stylesheet">
<link href="css/components.css" rel="stylesheet">
<link href="css/[page-name].css" rel="stylesheet">
```

## Бизнес-контекст

Треки: Python Backend+ML (120к₽), Flutter (100к₽), QA Automation (90к₽)
Бонусы: Промпт-инженеринг и AI (24ч), Dev English (20ч)
УТП: IT-компания, коммерческие заказы с 21-й нед., стартап MVP, LaunchPad бессрочно
Модули: 4 модуля / 2 платежа / 12 месяцев
