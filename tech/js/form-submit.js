/* ═══════════════════════════════════════════════════════════════════
 * Quillon · Universal form submit handler
 *
 * Использование:
 *   <form data-q-form="contact"
 *         data-q-endpoint="https://example.bitrix24.ru/rest/.../crm.lead.add.json">
 *     <input name="name" required>
 *     <input name="email" required>
 *     ...
 *     <button type="submit">Отправить</button>
 *   </form>
 *
 * Атрибуты:
 *   data-q-form        — имя формы (для tagging в CRM, default: "contact")
 *   data-q-endpoint    — POST URL (обычно Bitrix24 inbound webhook или proxy)
 *   data-q-success     — кастомный текст success (default: "Заявка отправлена")
 *   data-q-success-sub — кастомный sub-текст
 *
 * Bitrix24 inbound webhook принимает поля fields[TITLE], fields[NAME],
 * fields[PHONE][0][VALUE], fields[EMAIL][0][VALUE], fields[COMMENTS], …
 * Любой backend-proxy получит JSON со всеми полями + form-name.
 * ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Bitrix24 inbound webhook (CRM scope) — приём лидов с сайта.
  // Если URL начнут спамить → перегенерировать в Bitrix24 → Разработчикам → Вебхуки.
  const DEFAULT_ENDPOINT =
    'https://b24-o95wtq.bitrix24.ru/rest/1/6d5yns93ulwkr79s/crm.lead.add.json';

  // Anti-spam: минимальный интервал между отправками (мс).
  const SUBMIT_COOLDOWN_MS = 8000;
  // Anti-spam: ключи honeypot-полей (если заполнены — silent drop).
  const HONEYPOT_FIELDS = ['website', 'company_url', '_hp'];

  /* ── Field aliases (form `name` attr → semantic key) ─────────────── */
  const ALIAS = {
    name:        ['name', 'fullname', 'full_name', 'имя', 'fio', 'contact_name'],
    last_name:   ['last_name', 'surname', 'lastname', 'familia', 'фамилия'],
    email:       ['email', 'e-mail', 'mail', 'почта'],
    phone:       ['phone', 'tel', 'telephone', 'mobile', 'телефон'],
    telegram:    ['telegram', 'tg', 'tg_username', 'tg_handle'],
    contact:     ['contact', 'contact_info', 'how_to_contact'],
    company:     ['company', 'company_name', 'org', 'organization', 'компания'],
    position:    ['position', 'job_title', 'role', 'post', 'должность', 'job'],
    message:     ['message', 'comment', 'comments', 'text', 'описание', 'task', 'msg', 'body', 'project'],
    budget:      ['budget', 'бюджет', 'price'],
    timeline:    ['timeline', 'deadline', 'срок', 'when'],
    topic:       ['topic', 'subject', 'category', 'тема', 'reason'],
    consent:     ['consent', 'agree', 'privacy', 'согласие'],
  };

  function pick(data, semanticKey) {
    for (const alias of ALIAS[semanticKey] || []) {
      if (data[alias] != null && String(data[alias]).trim() !== '') return String(data[alias]).trim();
    }
    return '';
  }

  function detectChannel(value) {
    const v = String(value || '').trim();
    if (!v) return null;
    if (/^@?[a-z0-9_]{4,}$/i.test(v) && /[a-z]/i.test(v) && !v.includes('.')) {
      return { type: 'telegram', value: v.replace(/^@/, '') };
    }
    if (/^\+?[\d\s\-()]{7,}$/.test(v))           return { type: 'phone', value: v };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))    return { type: 'email', value: v };
    if (/^https?:\/\//i.test(v))                  return { type: 'web',   value: v };
    return null;
  }

  function splitName(full) {
    const parts = full.replace(/\s+/g, ' ').trim().split(' ');
    if (parts.length === 1) return { NAME: parts[0], LAST_NAME: '' };
    if (parts.length === 2) return { NAME: parts[0], LAST_NAME: parts[1] };
    return { NAME: parts[0], LAST_NAME: parts.slice(1).join(' ') };
  }

  function getMeta() {
    const url = new URL(location.href);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
      const v = url.searchParams.get(k);
      if (v) utm[k] = v;
    });
    return {
      utm,
      page_url:  location.href,
      page_path: location.pathname,
      referrer:  document.referrer || '',
      user_agent: navigator.userAgent,
      language:   navigator.language,
      screen:     `${window.screen.width}×${window.screen.height}@${window.devicePixelRatio || 1}x`,
      viewport:   `${window.innerWidth}×${window.innerHeight}`,
      timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
      ts:         new Date().toISOString(),
    };
  }

  function buildBitrixPayload(data, formName) {
    const meta = getMeta();

    /* ─── Идентификация контакта ───────────────────────────── */
    const fullName = pick(data, 'name');
    const { NAME, LAST_NAME } = splitName(fullName);

    let email = pick(data, 'email');
    let phone = pick(data, 'phone');
    let tg    = pick(data, 'telegram');
    const contact = pick(data, 'contact');

    // Если есть универсальное поле "contact" — детектим тип
    if (contact) {
      const ch = detectChannel(contact);
      if (ch) {
        if (ch.type === 'email'    && !email) email = ch.value;
        if (ch.type === 'phone'    && !phone) phone = ch.value;
        if (ch.type === 'telegram' && !tg)    tg    = ch.value;
      }
    }

    /* ─── TITLE: коротко и читаемо ─────────────────────────── */
    const formLabel = ({
      contact:        'Связаться',
      'contact-about':'О компании',
      'contact-cases':'Проект',
      career:         'Вакансия',
      support:        'Поддержка',
    })[formName] || formName;

    const PRODUCT_LABELS = {
      meet: 'Quillon Meet', lms: 'Quillon LMS',
      quilly: 'Quilly AI',  jobs: 'Quillon Jobs',
      other: 'Общий вопрос',
    };
    const TYPE_LABELS = {
      bug: 'Bug-report', account: 'Доступ к аккаунту',
      feature: 'Feature request', billing: 'Оплата / подписка',
      enterprise: 'Корпоративный SLA', other: 'Другое',
    };
    const productLabel = PRODUCT_LABELS[data.product]   || data.product   || '';
    const typeLabel    = TYPE_LABELS[data.type]         || data.type      || '';

    const titleSubj =
      productLabel ||
      pick(data, 'position') ||
      pick(data, 'topic') ||
      NAME ||
      'без имени';
    // [host/path] видно сразу на канбане, можно фильтровать «поиск по сделкам».
    const TITLE = `[${location.host}${location.pathname}] ${formLabel} · ${titleSubj}`;

    /* ─── COMMENTS: всё, что не уехало в отдельные поля ────── */
    const lines = [];
    // Маркеры для быстрой визуальной идентификации в карточке Bitrix
    lines.push(`★ ${location.host}${location.pathname}`);
    lines.push(`★ Форма: [${formName}] · ${formLabel}`);
    lines.push('');
    lines.push(`Форма: ${formName} (${location.pathname})`);
    if (productLabel)           lines.push(`Продукт:   ${productLabel}`);
    if (typeLabel)              lines.push(`Тип:       ${typeLabel}`);
    if (pick(data, 'topic'))    lines.push(`Тема:      ${pick(data, 'topic')}`);
    if (pick(data, 'position')) lines.push(`Позиция:   ${pick(data, 'position')}`);
    if (pick(data, 'company'))  lines.push(`Компания:  ${pick(data, 'company')}`);
    if (pick(data, 'budget'))   lines.push(`Бюджет:    ${pick(data, 'budget')}`);
    if (pick(data, 'timeline')) lines.push(`Сроки:     ${pick(data, 'timeline')}`);
    if (tg)                     lines.push(`Telegram:  @${tg}`);

    const msg = pick(data, 'message');
    if (msg) lines.push('', '— Сообщение —', msg);

    // Дамп всех остальных user-полей, которые мы ещё не вытащили выше
    const usedAliases = new Set(
      Object.values(ALIAS).flat().concat(['_form', '_url', 'product', 'type'])
    );
    const extras = Object.entries(data).filter(([k, v]) => v && !usedAliases.has(k));
    if (extras.length) {
      lines.push('', '— Доп. поля —');
      extras.forEach(([k, v]) => lines.push(`${k}: ${v}`));
    }

    lines.push('', '— Источник —');
    lines.push(`Страница:   ${meta.page_url}`);
    if (meta.referrer) lines.push(`Referrer:   ${meta.referrer}`);
    if (Object.keys(meta.utm).length) {
      lines.push('UTM:');
      Object.entries(meta.utm).forEach(([k, v]) => lines.push(`  ${k}=${v}`));
    }
    lines.push(`Браузер:    ${meta.user_agent}`);
    lines.push(`Экран:      ${meta.screen} · viewport ${meta.viewport}`);
    lines.push(`Язык/TZ:    ${meta.language} · ${meta.timezone}`);
    lines.push(`Время:      ${meta.ts}`);

    /* ─── Сборка fields ────────────────────────────────────── */
    const fields = {
      TITLE,
      NAME,
      LAST_NAME,
      SOURCE_ID:          'WEB',
      SOURCE_DESCRIPTION: `Форма «${formLabel}» на ${location.host}${location.pathname}`,
      OPENED:             'Y',
      ASSIGNED_BY_ID:     1,
      COMMENTS:           lines.join('\n'),
    };

    if (pick(data, 'position')) fields.POST          = pick(data, 'position');
    if (pick(data, 'company'))  fields.COMPANY_TITLE = pick(data, 'company');

    if (email) fields.EMAIL = [{ VALUE: email,      VALUE_TYPE: 'WORK' }];
    if (phone) fields.PHONE = [{ VALUE: phone,      VALUE_TYPE: 'WORK' }];
    if (tg)    fields.IM    = [{ VALUE: '@' + tg,   VALUE_TYPE: 'TELEGRAM' }];
    fields.WEB = [{ VALUE: meta.page_url, VALUE_TYPE: 'OTHER' }];

    // Bitrix умеет UTM_* как нативные поля
    if (meta.utm.utm_source)   fields.UTM_SOURCE   = meta.utm.utm_source;
    if (meta.utm.utm_medium)   fields.UTM_MEDIUM   = meta.utm.utm_medium;
    if (meta.utm.utm_campaign) fields.UTM_CAMPAIGN = meta.utm.utm_campaign;
    if (meta.utm.utm_content)  fields.UTM_CONTENT  = meta.utm.utm_content;
    if (meta.utm.utm_term)     fields.UTM_TERM     = meta.utm.utm_term;

    return { fields, params: { REGISTER_SONET_EVENT: 'Y' } };
  }

  function renderSuccess(form, opts) {
    const successText  = form.dataset.qSuccess     || 'Заявка отправлена';
    const successSub   = form.dataset.qSuccessSub  || 'Ответим на указанный контакт в течение 24 часов.';

    const card = document.createElement('div');
    card.className = 'q-form-success';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    // Static structure — innerHTML safe (no user data here)
    card.innerHTML = `
      <div class="q-form-success__icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle class="q-form-success__circle" cx="32" cy="32" r="28"/>
          <polyline class="q-form-success__check" points="18 33 28 43 46 22"/>
        </svg>
      </div>
      <h3 class="q-form-success__title"></h3>
      <p class="q-form-success__sub"></p>
    `;
    // Текст инжектим через textContent — защита от XSS, если вдруг
    // dataset.qSuccess попадёт под user-input (сейчас не попадает, но
    // правильнее защититься на будущее).
    card.querySelector('.q-form-success__title').textContent = successText;
    card.querySelector('.q-form-success__sub').textContent   = successSub;

    form.style.position = 'relative';
    form.classList.add('is-submitted');
    form.replaceWith(card);
    // Trigger animation by forcing reflow then adding class
    requestAnimationFrame(() => card.classList.add('is-visible'));
  }

  function renderError(form, msg) {
    let banner = form.querySelector('.q-form-error');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'q-form-error';
      banner.setAttribute('role', 'alert');
      form.prepend(banner);
    }
    banner.textContent = msg || 'Не удалось отправить форму. Попробуйте ещё раз или напишите на support@quillon.ru.';
  }

  function setSubmitting(form, on) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (on) {
      btn.dataset.origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Отправляем…';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.origText || 'Отправить';
    }
  }

  async function submit(form) {
    const formName = form.dataset.qForm || 'contact';
    const endpoint = form.dataset.qEndpoint || DEFAULT_ENDPOINT;
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === 'string') data[k] = v.trim();
    }

    // ── Honeypot: если бот заполнил скрытое поле — фейк-success, лида не шлём.
    for (const hp of HONEYPOT_FIELDS) {
      if (data[hp]) {
        console.warn('[q-form] honeypot triggered:', hp);
        renderSuccess(form);
        return;
      }
    }
    HONEYPOT_FIELDS.forEach((k) => delete data[k]);

    // ── Cooldown: не чаще 1 раза в 8 секунд с одного браузера.
    try {
      const last = +(localStorage.getItem('q-form-last') || 0);
      if (Date.now() - last < SUBMIT_COOLDOWN_MS) {
        renderError(form, 'Подождите несколько секунд перед повторной отправкой.');
        return;
      }
    } catch (_) { /* localStorage может быть заблокирован */ }

    data._form = formName;
    data._url  = location.href;

    setSubmitting(form, true);

    try {
      // Bitrix24 webhook принимает application/x-www-form-urlencoded или JSON
      // Используем JSON — современнее, проще для proxy.
      const isBitrixDirect = /\.bitrix24\.[a-z]+\/rest\//.test(endpoint);
      const payload = isBitrixDirect
        ? buildBitrixPayload(data, formName)
        : { form: formName, data, meta: { url: location.href, referrer: document.referrer } };

      const res = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Bitrix возвращает {result, time}; proxy может что угодно — нам не важно.
      try { localStorage.setItem('q-form-last', String(Date.now())); } catch (_) {}
      renderSuccess(form);
    } catch (err) {
      console.error('[q-form] submit failed:', err);
      setSubmitting(form, false);
      renderError(form, 'Не удалось отправить заявку. Попробуйте ещё раз или напишите на support@quillon.ru');
    }
  }

  /* ─── Phone mask: +7 (___) ___-__-__ ──────────────────────── */
  function formatRussianPhone(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  function attachPhoneMask(input) {
    if (input.dataset.qPhoneMasked) return;
    input.dataset.qPhoneMasked = '1';

    function getDigits() {
      return input.value.replace(/\D/g, '');
    }

    input.addEventListener('focus', () => {
      if (!input.value.trim()) input.value = '+7 ';
    });

    // keydown: Backspace/Delete работают по ЦИФРАМ, а не по символам формата.
    // Иначе backspace удаляет ')' → input-handler восстанавливает её → не стирается.
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        // Если есть selection — даём браузеру обработать самому
        if (input.selectionStart !== input.selectionEnd) return;
        e.preventDefault();
        const digits = getDigits().slice(0, -1);
        input.value = digits.length > 1 ? formatRussianPhone(digits) : '';
      } else if (e.key === 'Delete') {
        if (input.selectionStart !== input.selectionEnd) return;
        // Delete forward — простой кейс: пересчитать без последней цифры
        e.preventDefault();
        const digits = getDigits().slice(0, -1);
        input.value = digits.length > 1 ? formatRussianPhone(digits) : '';
      }
    });

    input.addEventListener('input', (e) => {
      // Игнорируем deleteContentBackward — keydown уже обработал
      if (e.inputType && e.inputType.startsWith('delete')) return;
      input.value = formatRussianPhone(input.value);
    });

    input.addEventListener('blur', () => {
      const digits = getDigits();
      if (digits.length <= 1) input.value = '';
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      input.value = formatRussianPhone(pasted);
    });
  }

  /* ─── Validation: required checkboxes (consent) ─────────── */
  function validateForm(form) {
    // Сначала стандартная HTML5-валидация (required, pattern, type=email)
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    // Дополнительно — required-чекбоксы (browser native checkValidity их обычно ловит,
    // но при novalidate на форме ломается; подстрахуемся вручную)
    const reqChecks = form.querySelectorAll('input[type="checkbox"][required]');
    for (const cb of reqChecks) {
      if (!cb.checked) {
        cb.focus();
        // Найти ближайший .q-cf-consent или label и подсветить
        const wrapper = cb.closest('label, .q-cf-consent, .q-consent') || cb;
        wrapper.scrollIntoView({ block: 'center', behavior: 'smooth' });
        renderError(form, 'Чтобы отправить заявку, отметь обязательные согласия.');
        return false;
      }
    }
    // Phone — если type=tel и required — должно быть минимум 11 цифр
    const phone = form.querySelector('input[type="tel"][required], input[name="phone"][required]');
    if (phone && phone.value.replace(/\D/g, '').length < 11) {
      phone.focus();
      renderError(form, 'Укажи телефон в формате +7 (XXX) XXX-XX-XX.');
      return false;
    }
    return true;
  }

  function bind(form) {
    if (form.dataset.qBound) return;
    form.dataset.qBound = '1';

    // Phone-mask для tel-полей внутри этой формы
    form.querySelectorAll('input[type="tel"], input[name="phone"], input[name="tel"]').forEach(attachPhoneMask);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      submit(form);
    });
  }

  function init() {
    document.querySelectorAll('form[data-q-form]').forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
