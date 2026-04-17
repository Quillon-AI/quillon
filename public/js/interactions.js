/* ==========================================================================
   Quillon — Interactive Components
   Mobile menu, FAQ accordion, smooth scroll, chat demo, phone mask,
   form validation, tooltip touch support, live badge updates.
   ========================================================================== */

function initInteractions() {
  'use strict';

  /* ── Lesson-demo iframe (mount early, before anything can break) ───── */
  initLessonDemoEmbed();

  /* ── 0. Theme toggle ────────────────────────────────────────────────── */
  initThemeToggle();

  function initThemeToggle() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // Check saved preference
    var saved = localStorage.getItem('quillon-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Default dark
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    toggle.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('quillon-theme', next);
      // Re-init lucide icons for updated theme
      if (window.lucide) window.lucide.createIcons();
    });
  }

  /* ── 1. Mobile menu toggle ──────────────────────────────────────────── */
  var burger = document.querySelector('.nav-burger');
  var mobileMenu = document.querySelector('.nav-mobile');

  var scrollY = 0;

  function openMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.add('open');
    mobileMenu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
  }

  function isMobileMenuOpen() {
    return mobileMenu && mobileMenu.classList.contains('open');
  }

  if (burger && mobileMenu) {
    burger.setAttribute('aria-expanded', 'false');

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isMobileMenuOpen()) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    /* Close on link click inside mobile menu */
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        closeMobileMenu();
      }
    });

    /* Close on click outside */
    document.addEventListener('click', function (e) {
      if (isMobileMenuOpen() && !mobileMenu.contains(e.target) && !burger.contains(e.target)) {
        closeMobileMenu();
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMobileMenuOpen()) {
        closeMobileMenu();
        burger.focus();
      }
    });
  }

  /* ── 2. FAQ accordion (event delegation) ────────────────────────────── */
  document.addEventListener('click', function (e) {
    var faqQ = e.target.closest('.faq-q');
    if (!faqQ) return;

    var faqItem = faqQ.closest('.faq-item');
    if (!faqItem) return;

    var isOpen = faqItem.classList.contains('open');

    /* Close all other FAQ items */
    document.querySelectorAll('.faq-item.open').forEach(function (item) {
      item.classList.remove('open');
      var q = item.querySelector('.faq-q');
      if (q) q.setAttribute('aria-expanded', 'false');
    });

    /* Toggle current */
    if (!isOpen) {
      faqItem.classList.add('open');
      faqQ.setAttribute('aria-expanded', 'true');
    } else {
      faqQ.setAttribute('aria-expanded', 'false');
    }
  });

  /* Set initial aria-expanded on all FAQ questions */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    q.setAttribute('aria-expanded', 'false');
  });

  /* Allow keyboard activation of FAQ items */
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('faq-q')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ── 3. Smooth scroll for anchor links ──────────────────────────────── */
  var NAV_HEIGHT = 72;

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    var href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    var targetId = href.slice(1);
    var targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    e.preventDefault();

    var targetTop = targetEl.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });

    /* Close mobile menu if open */
    if (isMobileMenuOpen()) {
      closeMobileMenu();
    }

    /* Update URL hash without jumping */
    if (history.pushState) {
      history.pushState(null, '', href);
    }
  });

  /* ── 4. Chat demo (real AI via Polza API or fallback) ────────────────── */
  var chatDemo = document.getElementById('chat-demo');

  if (chatDemo) {
    var POLZA_API_KEY = 'pza_BrCs5QQJ4GS8u_lGuydqKkcjTEXGJm2e';
    var POLZA_ENDPOINT = 'https://api.polza.ai/v1/chat/completions';
    var SYSTEM_PROMPT = 'Ты — Quilly AI, ИИ-ассистент IT-компании Quillon. Отвечай ТОЛЬКО на вопросы о Quillon, IT-образовании, программировании, карьере в IT и выборе трека. На любые вопросы не по теме (политика, личные вопросы, помощь с домашкой, генерация контента) вежливо отказывай: "Я специализируюсь на вопросах о Quillon и карьере в IT. Спроси что-нибудь об этом!"\n\nО Quillon: IT-компания, не онлайн-школа. 3 трека: Python Backend+ML, Flutter, QA Automation. 12 месяцев программы. Стажировка на реальных продуктах (ChatAI, Meet, LMS). Коммерческие проекты с 6 месяца. LaunchPad — помощь до оффера. Стартап как дипломный проект, до 500К инвестиции. Рассрочка от 8 250 руб/мес на 24 месяца, 0%. 7-дневный триал с возвратом.\n\nОтвечай кратко (2-4 предложения), дружелюбно, на "ты", на русском.';
    var CHAT_LIMIT = 5;
    var chatCount = 0;
    var chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
    var isWaitingResponse = false;

    /* Fallback scripted responses */
    var fallbackResponses = [
      'В Quillon Python применяется в бэкенде на Django и FastAPI — вы будете строить REST API, работать с PostgreSQL, настраивать CI/CD и деплоить на production-сервера.',
      'Нет, опыт не нужен! 80% участников приходят с нуля. Первые 8 недель — полное погружение в основы с куратором.',
      'Стоимость — от 8 250 руб/мес в рассрочку 0% на 24 месяца. Первые 7 дней — полный доступ, если не подойдёт — вернём 100%.',
      'Quillon — это IT-компания с собственными продуктами, а не онлайн-школа. Ты работаешь в команде над реальным кодом и получаешь стажировку.',
      'Программа рассчитана на 2 часа в день с гибким графиком. Записи доступны 24/7, можно совмещать с работой.'
    ];
    var fallbackIndex = 0;

    /* Build chat UI */
    chatDemo.innerHTML = '';
    chatDemo.style.textAlign = 'left';

    var chatTitle = document.createElement('div');
    chatTitle.className = 'chat-demo-title';
    chatTitle.textContent = 'Quilly AI — попробуй';
    chatDemo.appendChild(chatTitle);

    var chatMessages = document.createElement('div');
    chatMessages.className = 'chat-demo-messages';
    chatDemo.appendChild(chatMessages);

    /* Typing indicator */
    var typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-demo-typing';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    typingIndicator.style.display = 'none';

    /* Input area */
    var chatInputArea = document.createElement('div');
    chatInputArea.className = 'chat-demo-input-area';

    var chatCounter = document.createElement('div');
    chatCounter.className = 'chat-demo-counter';
    chatCounter.textContent = CHAT_LIMIT + ' сообщений осталось';

    var chatInputRow = document.createElement('div');
    chatInputRow.className = 'chat-demo-input-row';

    var chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'chat-demo-input';
    chatInput.placeholder = 'Спроси что-нибудь о Quillon...';
    chatInput.maxLength = 300;

    var chatSendBtn = document.createElement('button');
    chatSendBtn.className = 'btn btn-primary btn-sm chat-demo-send';
    chatSendBtn.textContent = '→';
    chatSendBtn.type = 'button';

    chatInputRow.appendChild(chatInput);
    chatInputRow.appendChild(chatSendBtn);
    chatInputArea.appendChild(chatCounter);
    chatInputArea.appendChild(chatInputRow);
    chatDemo.appendChild(chatInputArea);

    /* CTA shown after limit */
    var chatCta = document.createElement('div');
    chatCta.className = 'chat-demo-cta';
    chatCta.style.display = 'none';
    chatCta.innerHTML = '<p>Хочешь узнать больше?</p><a href="/quiz" class="btn btn-primary btn-sm">Пройди тест — 90 секунд →</a>';
    chatDemo.appendChild(chatCta);

    function addBubble(role, text) {
      var bubble = document.createElement('div');
      var isUser = role === 'user';
      bubble.className = 'chat-demo-bubble ' + (isUser ? 'chat-demo-bubble--user' : 'chat-demo-bubble--ai');
      bubble.textContent = text;
      chatMessages.appendChild(bubble);

      /* Trigger entrance animation */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bubble.style.opacity = '1';
          bubble.style.transform = 'translateY(0)';
        });
      });

      /* Auto-scroll */
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return bubble;
    }

    function showTyping() {
      chatMessages.appendChild(typingIndicator);
      typingIndicator.style.display = 'flex';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
      typingIndicator.style.display = 'none';
      if (typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
    }

    function updateCounter() {
      var remaining = CHAT_LIMIT - chatCount;
      chatCounter.textContent = remaining + ' ' + (remaining === 1 ? 'сообщение осталось' : 'сообщений осталось');
    }

    function disableChat() {
      chatInputArea.style.display = 'none';
      chatCta.style.display = 'flex';
    }

    function getFallbackResponse() {
      var response = fallbackResponses[fallbackIndex % fallbackResponses.length];
      fallbackIndex++;
      return response;
    }

    async function sendMessage(text) {
      if (!text.trim() || isWaitingResponse) return;
      if (chatCount >= CHAT_LIMIT) {
        disableChat();
        return;
      }

      chatCount++;
      updateCounter();
      addBubble('user', text);
      chatInput.value = '';
      isWaitingResponse = true;
      chatSendBtn.disabled = true;

      chatHistory.push({ role: 'user', content: text });

      showTyping();

      var aiText = '';

      if (POLZA_API_KEY) {
        /* Real API call */
        try {
          var response = await fetch(POLZA_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + POLZA_API_KEY
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: chatHistory,
              max_tokens: 200,
              temperature: 0.7
            })
          });

          if (!response.ok) {
            var errText = await response.text();
            throw new Error('API error ' + response.status + ': ' + errText);
          }

          var data = await response.json();
          aiText = data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : getFallbackResponse();
        } catch (err) {
          console.error('[Quillon ChatDemo] API error, using fallback:', err);
          aiText = getFallbackResponse();
        }
      } else {
        /* Fallback: simulated delay + scripted response */
        await new Promise(function (resolve) { setTimeout(resolve, 800 + Math.random() * 600); });
        aiText = getFallbackResponse();
      }

      chatHistory.push({ role: 'assistant', content: aiText });

      hideTyping();
      addBubble('ai', aiText);

      isWaitingResponse = false;
      chatSendBtn.disabled = false;

      if (chatCount >= CHAT_LIMIT) {
        disableChat();
      }
    }

    /* Event listeners */
    chatSendBtn.addEventListener('click', function () {
      sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage(chatInput.value);
      }
    });

    /* Initial greeting when chat becomes visible */
    var chatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            addBubble('ai', 'Привет! Я Quilly AI. Спроси меня о программе, треках или стоимости обучения в Quillon.');
          }, 400);
          chatObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    chatObserver.observe(chatDemo);
  }

  /* ── 5. Phone input mask +7 (XXX) XXX-XX-XX ────────────────────────── */
  function applyPhoneMask(input) {
    input.addEventListener('input', function () {
      var value = input.value.replace(/\D/g, '');

      /* Ensure starts with 7 */
      if (value.length > 0 && value.charAt(0) !== '7') {
        if (value.charAt(0) === '8') {
          value = '7' + value.slice(1);
        } else {
          value = '7' + value;
        }
      }

      /* Cap at 11 digits */
      if (value.length > 11) {
        value = value.slice(0, 11);
      }

      var formatted = '';
      if (value.length >= 1) {
        formatted = '+' + value.charAt(0);
      }
      if (value.length >= 2) {
        formatted += ' (' + value.slice(1, Math.min(4, value.length));
      }
      if (value.length >= 4) {
        formatted += ')';
      }
      if (value.length >= 5) {
        formatted += ' ' + value.slice(4, Math.min(7, value.length));
      }
      if (value.length >= 8) {
        formatted += '-' + value.slice(7, Math.min(9, value.length));
      }
      if (value.length >= 10) {
        formatted += '-' + value.slice(9, 11);
      }

      input.value = formatted;
    });

    /* Prevent non-digit input on keydown for better UX */
    input.addEventListener('keydown', function (e) {
      /* Allow control keys */
      if (e.ctrlKey || e.metaKey || e.key === 'Backspace' || e.key === 'Delete' ||
          e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
        return;
      }
      /* Allow digits */
      if (/^\d$/.test(e.key)) return;
      /* Block everything else */
      e.preventDefault();
    });

    /* On focus, prefill +7 if empty */
    input.addEventListener('focus', function () {
      if (!input.value) {
        input.value = '+7';
      }
    });
  }

  document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);

  /* ── 6. Form validation & submission ────────────────────────────────── */
  document.querySelectorAll('form[data-form="contact"]').forEach(function (form) {

    function showFieldError(field, message) {
      clearFieldError(field);
      field.classList.add('error');
      var errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      errorEl.style.cssText = 'display:block; font-size:0.8rem; color:var(--warning, #f59e0b); margin-top:4px;';
      errorEl.textContent = message;
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }

    function clearFieldError(field) {
      field.classList.remove('error');
      var existing = field.parentNode.querySelector('.field-error');
      if (existing) existing.remove();
    }

    function validateForm() {
      var valid = true;

      /* Name */
      var nameField = form.querySelector('input[name="name"]');
      if (nameField) {
        clearFieldError(nameField);
        if (!nameField.value.trim()) {
          showFieldError(nameField, 'Введите ваше имя');
          valid = false;
        }
      }

      /* Phone */
      var phoneField = form.querySelector('input[type="tel"]');
      if (phoneField) {
        clearFieldError(phoneField);
        var digits = phoneField.value.replace(/\D/g, '');
        if (digits.length < 11) {
          showFieldError(phoneField, 'Введите корректный номер телефона');
          valid = false;
        }
      }

      /* Email */
      var emailField = form.querySelector('input[type="email"]');
      if (emailField) {
        clearFieldError(emailField);
        var emailVal = emailField.value.trim();
        if (emailVal && emailVal.indexOf('@') === -1) {
          showFieldError(emailField, 'Введите корректный email');
          valid = false;
        }
      }

      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) return;

      var submitBtn = form.querySelector('button[type="submit"], .btn');
      var originalText = submitBtn ? submitBtn.textContent : '';

      /* Loading state */
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        submitBtn.style.opacity = '0.7';
      }

      /* Collect form data */
      var formData = {};
      new FormData(form).forEach(function (value, key) {
        formData[key] = value;
      });

      /* Send to API (placeholder: console.log for now) */
      console.log('[Quillon] Form submission:', formData);

      /* Analytics: track lead submission */
      if (typeof ym === 'function') {
        ym(108311343, 'reachGoal', 'lead_submit', { form_type: 'direct_contact' });
      }

      /* Simulate async response */
      setTimeout(function () {
        if (submitBtn) {
          submitBtn.textContent = 'Отправлено!';
          submitBtn.style.opacity = '1';
          submitBtn.style.background = 'var(--success, #10b981)';
        }

        /* Reset after 3s */
        setTimeout(function () {
          form.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
          }
          /* Clear all error states */
          form.querySelectorAll('.field-error').forEach(function (el) { el.remove(); });
          form.querySelectorAll('.error').forEach(function (el) { el.classList.remove('error'); });
        }, 3000);
      }, 1200);
    });
  });

  /* ── 7. Tooltip touch support ──────────────────────────────────────── */
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    document.addEventListener('click', function (e) {
      var tip = e.target.closest('.tip');

      if (tip) {
        e.preventDefault();
        e.stopPropagation();
        /* Close all other tips */
        document.querySelectorAll('.tip.active').forEach(function (t) {
          if (t !== tip) t.classList.remove('active');
        });
        tip.classList.toggle('active');
      } else {
        /* Tap outside — close all */
        document.querySelectorAll('.tip.active').forEach(function (t) {
          t.classList.remove('active');
        });
      }
    });
  }

  /* ── 8. Live badge dynamic update ───────────────────────────────────── */
  function updateLiveBadge() {
    /* Try reading from global window.quillonSettings (set by renderer) */
    var spotsRemaining = null;

    if (window.quillonSettings && window.quillonSettings.spots_remaining != null) {
      spotsRemaining = window.quillonSettings.spots_remaining;
    }

    /* Also check data attribute on body */
    var bodySpots = document.body.getAttribute('data-spots-remaining');
    if (bodySpots !== null) {
      spotsRemaining = parseInt(bodySpots, 10);
    }

    if (spotsRemaining === null) return;

    /* Update all live-badge elements */
    document.querySelectorAll('.live-badge').forEach(function (badge) {
      var dot = badge.querySelector('.live-dot');
      var textContent = 'Осталось ' + spotsRemaining + ' мест — набор открыт';
      /* Preserve the dot, update text */
      if (dot) {
        badge.textContent = '';
        badge.appendChild(dot);
        badge.appendChild(document.createTextNode(' ' + textContent));
      } else {
        badge.textContent = textContent;
      }
    });
  }

  updateLiveBadge();

  /* ── 9. Code typing animation ──────────────────────────────────────── */
  initCodeTyping();

  function initCodeTyping() {
    var codeEl = document.getElementById('typing-code');
    if (!codeEl) return;

    var snippets = [
      {
        file: 'quillon_chatai/api/chat.py',
        code: 'from fastapi import FastAPI, HTTPException\nfrom quillon.ai import QuillyEngine\n\napp = FastAPI()\nengine = QuillyEngine(model="quilly-v2")\n\n@app.post("/api/chat")\nasync def chat(message: str):\n    response = await engine.generate(\n        prompt=message,\n        context=await engine.search_knowledge(message)\n    )\n    return {"reply": response.text}'
      },
      {
        file: 'quillon_meet/server/room.py',
        code: 'from quillon.meet import RoomManager, WebRTCSignal\n\nmanager = RoomManager()\n\nasync def create_room(name: str):\n    room = await manager.create(\n        name=name,\n        max_participants=50,\n        recording=True\n    )\n    await room.setup_media_server()\n    return room.invite_link'
      },
      {
        file: 'quillon_lms/tests/test_progress.py',
        code: 'import pytest\nfrom quillon.lms import Student, Track\n\n@pytest.mark.asyncio\nasync def test_track_completion():\n    student = await Student.create(\n        name="\u0410\u043D\u043D\u0430",\n        track=Track.PYTHON_ML\n    )\n    await student.complete_module(1)\n    assert student.progress == 0.125\n    assert student.next_module == "FastAPI Deep Dive"'
      }
    ];

    var currentSnippet = 0;
    var charIndex = 0;
    var isVisible = false;
    var typingTimer = null;
    var headerEl = codeEl.closest('.code-showcase').querySelector('.code-filename');
    var showcase = codeEl.closest('.code-showcase');

    function typeNext() {
      if (!isVisible) return; // pause when not visible
      var snippet = snippets[currentSnippet];
      if (charIndex <= snippet.code.length) {
        codeEl.textContent = snippet.code.substring(0, charIndex);
        charIndex++;
        typingTimer = setTimeout(typeNext, 25 + Math.random() * 15);
      } else {
        typingTimer = setTimeout(function() {
          currentSnippet = (currentSnippet + 1) % snippets.length;
          charIndex = 0;
          if (headerEl) headerEl.textContent = snippets[currentSnippet].file;
          codeEl.textContent = '';
          typeNext();
        }, 3000);
      }
    }

    // Pause/resume based on visibility
    var visObserver = new IntersectionObserver(function(entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !typingTimer) {
        typeNext();
      } else if (!isVisible && typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
      }
    }, { threshold: 0.1 });

    visObserver.observe(showcase);
  }

  /* ── N. Lesson-demo iframe (definition — called at top of init) ────── */

  function initLessonDemoEmbed() {
    var player = document.querySelector('.lesson-demo-player');
    if (!player) return;

    var embedSrc = player.getAttribute('data-embed-src');
    if (!embedSrc) return;

    function mountFrame() {
      if (player.querySelector('iframe')) return;

      var frame = document.createElement('iframe');
      frame.src = embedSrc;
      frame.className = 'lesson-demo-frame';
      frame.setAttribute('allow', 'autoplay; clipboard-write');
      frame.setAttribute('title', 'Интерактивный урок Quillon');

      var loading = player.querySelector('.lesson-demo-loading');

      // If iframe fails to load within 12s, show fallback
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

      // Analytics
      if (window.ym) {
        window.ym(108311343, 'reachGoal', 'lesson_demo_view');
      }
    }

    // Mount iframe immediately
    mountFrame();

    // Listen to postMessage events from the embed for analytics
    window.addEventListener('message', function(ev) {
      if (!ev.origin || ev.origin.indexOf('quillon.ru') === -1) return;
      var msg = ev.data || {};
      if (!msg.type || msg.type.indexOf('lesson:') !== 0) return;
      if (window.ym) {
        window.ym(108311343, 'reachGoal', msg.type.replace(':', '_'));
      }
    });
  }
}

/* Export for renderer.js */
window.initInteractions = initInteractions;
