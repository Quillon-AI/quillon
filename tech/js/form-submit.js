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

  function buildBitrixPayload(data, formName) {
    // Bitrix24 crm.lead.add формат
    const fields = {
      TITLE: `Заявка с ${location.hostname} · ${formName}`,
      SOURCE_ID: 'WEB',
      COMMENTS: `Форма: ${formName}\n\n${Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')}\n\nUTM: ${location.search || '—'}\nReferrer: ${document.referrer || '—'}`,
    };
    if (data.name)     fields.NAME    = data.name;
    if (data.email)    fields.EMAIL   = [{ VALUE: data.email, VALUE_TYPE: 'WORK' }];
    if (data.phone)    fields.PHONE   = [{ VALUE: data.phone, VALUE_TYPE: 'WORK' }];
    if (data.contact && /@\w+\.\w+/.test(data.contact)) {
      fields.EMAIL = [{ VALUE: data.contact, VALUE_TYPE: 'WORK' }];
    }
    return { fields, params: { REGISTER_SONET_EVENT: 'Y' } };
  }

  function renderSuccess(form, opts) {
    const successText  = form.dataset.qSuccess     || 'Заявка отправлена';
    const successSub   = form.dataset.qSuccessSub  || 'Ответим на указанный контакт в течение 24 часов.';

    const card = document.createElement('div');
    card.className = 'q-form-success';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <div class="q-form-success__icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle class="q-form-success__circle" cx="32" cy="32" r="28"/>
          <polyline class="q-form-success__check" points="18 33 28 43 46 22"/>
        </svg>
      </div>
      <h3 class="q-form-success__title">${successText}</h3>
      <p class="q-form-success__sub">${successSub}</p>
    `;

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
    const endpoint = form.dataset.qEndpoint;
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === 'string') data[k] = v.trim();
    }
    data._form = formName;
    data._url  = location.href;

    setSubmitting(form, true);

    if (!endpoint) {
      // Нет endpoint — fallback: открываем mailto с pre-filled body
      console.warn('[q-form] data-q-endpoint не задан, fallback to mailto');
      const subj = encodeURIComponent(`Заявка · ${formName}`);
      const body = encodeURIComponent(
        Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
      );
      window.location.href = `mailto:support@quillon.ru?subject=${subj}&body=${body}`;
      setSubmitting(form, false);
      return;
    }

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
      renderSuccess(form);
    } catch (err) {
      console.error('[q-form] submit failed:', err);
      setSubmitting(form, false);
      renderError(form, 'Не удалось отправить заявку. Попробуйте ещё раз или напишите на support@quillon.ru');
    }
  }

  function bind(form) {
    if (form.dataset.qBound) return;
    form.dataset.qBound = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
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
