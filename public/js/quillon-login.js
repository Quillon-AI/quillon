/**
 * Quillon · кастомный логин (quillon.ru/login).
 *
 * Конфиг (опционально, до загрузки скрипта):
 *   window.QUILLON_LOGIN = {
 *     endpoint: '/api/auth/login',           // POST JSON { email, password }
 *     redirectDefault: 'https://lms.quillon.ru/',
 *     tokenKey: 'quillon_access_token',      // если бэкенд отдаёт token / access_token
 *     lmsFallback: 'https://lms.quillon.ru/login'
 *   };
 *
 * Ожидаемые ответы JSON (любой подходящий вариант):
 *   { "redirect": "https://..." } | { "redirectUrl": "..." }
 *   { "token": "..." } | { "access_token": "..." }  → кладём в storage, редирект на next/default
 */
(function () {
  'use strict';

  var cfg = typeof window !== 'undefined' && window.QUILLON_LOGIN ? window.QUILLON_LOGIN : {};
  var ENDPOINT = cfg.endpoint || '/api/auth/login';
  var REDIRECT_DEFAULT = cfg.redirectDefault || 'https://lms.quillon.ru/';
  var TOKEN_KEY = cfg.tokenKey || 'quillon_access_token';
  var LMS_FALLBACK = cfg.lmsFallback || 'https://lms.quillon.ru/login';

  function safeNextParam() {
    var q = new URLSearchParams(window.location.search).get('next');
    if (!q) return null;
    try {
      var u = new URL(q, window.location.origin);
      if (u.hostname === 'quillon.ru' || u.hostname.endsWith('.quillon.ru')) {
        return u.toString();
      }
    } catch (e) {}
    return null;
  }

  function redirectAfterAuth() {
    var next = safeNextParam();
    window.location.href = next || REDIRECT_DEFAULT;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    var label = btn.querySelector('.q-login-submit__text');
    if (label) label.textContent = loading ? 'Входим…' : 'Войти';
  }

  function showError(box, msg) {
    if (!box) return;
    box.hidden = !msg;
    box.textContent = msg || '';
  }

  function parseJsonSafe(res) {
    var ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return Promise.resolve(null);
    return res.json().catch(function () {
      return null;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('quillon-login-form');
    var errBox = document.getElementById('quillon-login-error');
    var submitBtn = document.getElementById('quillon-login-submit');
    var passInput = document.getElementById('quillon-login-password');
    var passToggle = document.getElementById('quillon-login-password-toggle');

    if (passToggle && passInput) {
      passToggle.addEventListener('click', function () {
        var shown = passInput.getAttribute('type') === 'text';
        passInput.setAttribute('type', shown ? 'password' : 'text');
        passToggle.setAttribute('aria-pressed', shown ? 'false' : 'true');
        passToggle.setAttribute('aria-label', shown ? 'Показать пароль' : 'Скрыть пароль');
        passToggle.textContent = shown ? 'Показать' : 'Скрыть';
      });
    }

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError(errBox, '');

      var fd = new FormData(form);
      var email = (fd.get('email') || '').toString().trim();
      var password = (fd.get('password') || '').toString();

      if (!email || !password) {
        showError(errBox, 'Введите email и пароль.');
        return;
      }

      setLoading(submitBtn, true);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (res) {
          return parseJsonSafe(res).then(function (data) {
            return { res: res, data: data };
          });
        })
        .then(function (_ref) {
          var res = _ref.res;
          var data = _ref.data || {};

          if (res.ok) {
            var dest = data.redirect || data.redirectUrl || data.url;
            if (dest) {
              window.location.href = dest;
              return;
            }
            var tok = data.token || data.access_token;
            if (tok) {
              try {
                localStorage.setItem(TOKEN_KEY, tok);
              } catch (e) {}
              redirectAfterAuth();
              return;
            }
            redirectAfterAuth();
            return;
          }

          var msg =
            (data && (data.message || data.error || data.detail)) ||
            (res.status === 401 ? 'Неверный email или пароль.' : null) ||
            ('Не удалось войти' + (res.status ? ' (' + res.status + ')' : '') + '.');

          if (res.status === 404 && ENDPOINT.indexOf('/api/') === 0) {
            msg +=
              ' Проверьте, что на домене настроен прокси на бэкенд авторизации, или откройте вход в LMS.';
          }

          showError(errBox, msg);
        })
        .catch(function () {
          showError(
            errBox,
            'Сеть недоступна или сервер не ответил. Попробуйте снова или воспользуйтесь входом через LMS.',
          );
        })
        .finally(function () {
          setLoading(submitBtn, false);
        });
    });

    var fb = document.getElementById('quillon-login-lms-fallback');
    if (fb) {
      fb.setAttribute('href', LMS_FALLBACK);
    }
  });
})();
