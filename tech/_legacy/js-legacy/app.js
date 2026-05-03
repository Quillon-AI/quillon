/* ========================================
       INITIALIZATION
       Called by renderer.js after DOM is populated
       ======================================== */
    window.initApp = function () {
      initTheme();
      initNavbar();
      initTabs();
      initFAQ();
      initForm();
      initScrollAnimations();
      initCardGlow();
      initParticleGrid();
      initHeroParallax();
      initScrollProgress();
      initTiltEffect();
      initSectionDividers();
      initStaggeredReveal();
      initPillAnimation();
      initFloatingTags();
      initHeroMorphText();
      initDataFlow();
    };

    /* ========================================
       THEME — light/dark toggle + persistence
       ======================================== */
    function initTheme() {
      const toggle = document.getElementById('theme-toggle');
      const stored = localStorage.getItem('quillon-tech-theme');

      // Disable transitions during initial theme application to prevent flash
      document.documentElement.classList.add('no-transition');

      // Set theme (default to light)
      document.documentElement.setAttribute('data-theme', stored || 'dark');

      // Re-enable transitions after a frame so initial paint has no animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-transition');
        });
      });

      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        // Just switch — global transition rules handle the smooth change
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('quillon-tech-theme', next);

        // Re-create lucide icons so they pick up color changes
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        // Redraw particle grid canvas with new accent color
        // (canvas draws using getComputedStyle on each frame, so it auto-updates)
      });
    }

    /* ========================================
       NAVBAR — scroll blur + mobile menu
       ======================================== */
    function initNavbar() {
      const navbar = document.getElementById('navbar');
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobile-menu');

      // Scroll effect
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            navbar.classList.toggle('scrolled', window.scrollY > 32);
            ticking = false;
          });
          ticking = true;
        }
      });

      // Hamburger toggle
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
      });

      // Close mobile menu on link click
      mobileMenu.querySelectorAll('a[data-close-menu]').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('open');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    /* ========================================
       TABS — tech stack
       ======================================== */
    function initTabs() {
      const tabs = document.querySelectorAll('.stack__tab');
      const panels = document.querySelectorAll('.stack__panel');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');

          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));

          tab.classList.add('active');
          document.getElementById('panel-' + target).classList.add('active');
        });
      });
    }

    /* ========================================
       FAQ — accordion
       ======================================== */
    function initFAQ() {
      document.querySelectorAll('.faq__question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq__item');
          const answer = item.querySelector('.faq__answer');
          const isOpen = item.classList.contains('open');

          // Close all
          document.querySelectorAll('.faq__item').forEach(i => {
            i.classList.remove('open');
            i.querySelector('.faq__answer').style.maxHeight = null;
          });

          // Open clicked (if it was closed)
          if (!isOpen) {
            item.classList.add('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      });
    }

    /* ========================================
       FORM — submit handler
       ======================================== */
    function initForm() {
      const form = document.getElementById('cta-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        console.log('Form submitted:', data);

        // Visual feedback
        const btn = form.querySelector('.cta-form__submit');
        const originalText = btn.textContent;
        btn.textContent = 'Отправлено!';
        btn.style.background = '#22c55e';
        btn.style.boxShadow = '0 0 24px rgba(34, 197, 94, 0.3)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.boxShadow = '';
          form.reset();
        }, 2000);
      });
    }

    /* ========================================
       SCROLL ANIMATIONS — IntersectionObserver
       ======================================== */
    function initScrollAnimations() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    /* ========================================
       CARD GLOW — mouse tracking
       ======================================== */
    function initCardGlow() {
      const cards = document.querySelectorAll('.product-card, .type-card, .ai-cap-card');
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        });
      });
    }

    /* ========================================
       HERO PARALLAX — scroll dim + text shift
       ======================================== */
    function initHeroParallax() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const hero = document.getElementById('hero');
      const wrapper = null;
      const overlay = document.getElementById('hero-scroll-overlay');
      const content = hero.querySelector('.hero__content');
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const wrapperH = wrapper.offsetHeight;
            const heroH = hero.offsetHeight;
            // Progress through the wrapper (0 at top, 1 at bottom)
            const progress = Math.min(scrollY / (wrapperH - heroH), 1);

            // Dim overlay: 0 -> 0.6 opacity
            // parallax disabled
            // overlay.style.opacity = progress * 0.6;

            // Content shifts up with parallax
            // content.style.transform = 'translateY(-' + (progress * 40) + 'px)';

            ticking = false;
          });
          ticking = true;
        }
      });
    }

    /* ========================================
       PARTICLE GRID — interactive canvas
       ======================================== */
    function initParticleGrid() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const canvas = document.getElementById('hero-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const hero = document.getElementById('hero');

      // Allow mouse interaction on canvas
      canvas.style.pointerEvents = 'auto';

      // Configuration
      const COLS = 22;
      const ROWS = 14;
      const MOUSE_RADIUS = 120;
      const MOUSE_STRENGTH = 35;
      const SPRING = 0.03;
      const DAMPING = 0.85;
      const LINE_DIST = 90;
      const DOT_RADIUS = 2;
      const isMobile = window.innerWidth < 768;

      let particles = [];
      let mouseX = -9999;
      let mouseY = -9999;
      let animId = null;
      let width, height;

      function getAccentColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563EB';
      }

      function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
      }

      function resize() {
        const rect = hero.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        initPoints();
      }

      function initPoints() {
        particles = [];
        const spacingX = width / (COLS + 1);
        const spacingY = height / (ROWS + 1);

        for (let row = 1; row <= ROWS; row++) {
          for (let col = 1; col <= COLS; col++) {
            particles.push({
              originX: col * spacingX,
              originY: row * spacingY,
              x: col * spacingX,
              y: row * spacingY,
              vx: 0,
              vy: 0
            });
          }
        }
      }

      // Wave animation for mobile (no mouse)
      let waveTime = 0;

      function update() {
        waveTime += 0.015;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Spring force back to origin
          const dx = p.originX - p.x;
          const dy = p.originY - p.y;
          p.vx += dx * SPRING;
          p.vy += dy * SPRING;

          if (isMobile) {
            // Autonomous wave animation
            const wave = Math.sin(p.originX * 0.008 + waveTime) *
                         Math.cos(p.originY * 0.006 + waveTime * 0.7) * 8;
            p.vx += (p.originX + wave - p.x) * 0.01;
            p.vy += (p.originY + wave * 0.6 - p.y) * 0.01;
          } else {
            // Mouse repulsion
            const mx = p.x - mouseX;
            const my = p.y - mouseY;
            const dist = Math.sqrt(mx * mx + my * my);

            if (dist < MOUSE_RADIUS && dist > 0) {
              const force = (1 - dist / MOUSE_RADIUS) * MOUSE_STRENGTH;
              const angle = Math.atan2(my, mx);
              p.vx += Math.cos(angle) * force * 0.15;
              p.vy += Math.sin(angle) * force * 0.15;
            }
          }

          // Apply velocity with damping
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        }
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        const accent = getAccentColor();
        const rgb = hexToRgb(accent);

        // Draw connection lines
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < LINE_DIST) {
              const alpha = (1 - dist / LINE_DIST) * 0.15;
              ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // Draw dots
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Dot brightness varies by displacement
          const dispX = p.x - p.originX;
          const dispY = p.y - p.originY;
          const disp = Math.sqrt(dispX * dispX + dispY * dispY);
          const brightness = Math.min(0.3 + disp * 0.03, 0.8);

          ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + brightness + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, DOT_RADIUS + disp * 0.04, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function animate() {
        update();
        draw();
        animId = requestAnimationFrame(animate);
      }

      // Mouse tracking on the hero section
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });

      hero.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
      });

      // Pause when hero is not visible for performance
      const visObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!animId) animate();
          } else {
            if (animId) {
              cancelAnimationFrame(animId);
              animId = null;
            }
          }
        });
      }, { threshold: 0.05 });

      visObserver.observe(hero);

      // Init
      window.addEventListener('resize', () => {
        resize();
      });
      resize();
      animate();
    }

    /* ========================================
       SCROLL PROGRESS BAR
       ======================================== */
    function initScrollProgress() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const bar = document.getElementById('scroll-progress');
      if (!bar) return;

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = progress + '%';
            ticking = false;
          });
          ticking = true;
        }
      });
    }

    /* ========================================
       TILT EFFECT — 3D tilt on type-cards
       ======================================== */
    function initTiltEffect() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.matchMedia('(hover: none)').matches) return;

      const cards = document.querySelectorAll('.type-card');
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = 'perspective(800px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
        });
      });
    }

    /* ========================================
       SECTION DIVIDERS — glow on scroll
       ======================================== */
    function initSectionDividers() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.section-divider').forEach(d => d.classList.add('visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('.section-divider').forEach(d => observer.observe(d));
    }

    /* ========================================
       STAGGERED REVEAL — children appear one by one
       ======================================== */
    function initStaggeredReveal() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Stagger principles
      const principles = document.querySelectorAll('.principle.fade-in');
      const principleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Find index among siblings for stagger delay
            const allPrinciples = Array.from(document.querySelectorAll('.principle.fade-in'));
            const idx = allPrinciples.indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, idx * 150);
            principleObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      principles.forEach(p => principleObserver.observe(p));

      // Stagger hero stats
      const heroStats = document.querySelectorAll('.hero__stat');
      heroStats.forEach((stat, i) => {
        stat.classList.add('stagger-child');
        setTimeout(() => {
          stat.classList.add('visible');
        }, 800 + i * 120);
      });

      // Stagger CTA benefits list items
      const ctaBenefits = document.querySelectorAll('.cta-benefits__list li');
      if (ctaBenefits.length) {
        const ctaObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              ctaBenefits.forEach((li, i) => {
                li.classList.add('stagger-child');
                setTimeout(() => {
                  li.classList.add('visible');
                }, i * 80);
              });
              ctaObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        const ctaSection = document.querySelector('.cta-benefits__list');
        if (ctaSection) ctaObserver.observe(ctaSection);
      }

      // Stagger step cards
      const stepCards = document.querySelectorAll('.step-card');
      if (stepCards.length) {
        const stepsObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              stepCards.forEach((card, i) => {
                card.classList.add('stagger-child');
                setTimeout(() => {
                  card.classList.add('visible');
                }, i * 100);
              });
              stepsObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        const stepsGrid = document.querySelector('.steps-grid');
        if (stepsGrid) stepsObserver.observe(stepsGrid);
      }

      // Stagger career positions
      const positions = document.querySelectorAll('.careers__position');
      if (positions.length) {
        const posObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              positions.forEach((pos, i) => {
                pos.classList.add('stagger-child');
                setTimeout(() => {
                  pos.classList.add('visible');
                }, i * 100);
              });
              posObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        const posList = document.querySelector('.careers__position-list');
        if (posList) posObserver.observe(posList);
      }

      // Stagger why-quillon items
      const whyItems = document.querySelectorAll('.careers__why-item');
      if (whyItems.length) {
        const whyObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              whyItems.forEach((item, i) => {
                item.classList.add('stagger-child');
                setTimeout(() => {
                  item.classList.add('visible');
                }, i * 100);
              });
              whyObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        const whyList = document.querySelector('.careers__why-list');
        if (whyList) whyObserver.observe(whyList);
      }
    }

    /* ========================================
       PILL ANIMATION — scale-in on tab switch
       ======================================== */
    function initPillAnimation() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Animate pills when their panel becomes active
      function animatePills(panel) {
        const pills = panel.querySelectorAll('.stack__tech-pill');
        pills.forEach((pill, i) => {
          pill.classList.add('pill-animate');
          pill.classList.remove('pill-visible');
          setTimeout(() => {
            pill.classList.add('pill-visible');
          }, i * 50 + 50);
        });
      }

      // On tab click, animate new panel's pills
      document.querySelectorAll('.stack__tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');
          const panel = document.getElementById('panel-' + target);
          if (panel) {
            requestAnimationFrame(() => animatePills(panel));
          }
        });
      });

      // Initial animation when stack section comes into view
      const stackSection = document.querySelector('.stack');
      if (stackSection) {
        const stackObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const activePanel = stackSection.querySelector('.stack__panel.active');
              if (activePanel) animatePills(activePanel);
              stackObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        stackObserver.observe(stackSection);
      }
    }

    /* ========================================
       HERO MORPHING TEXT — scroll-linked phrase change
       ======================================== */
    function initHeroMorphText() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const wrapper = null;
      const morphText = document.getElementById('hero-morph-text');
      if (!wrapper || !morphText) return;

      const phrases = [
        'AI-инфраструктура.',
        'Высокие нагрузки.',
        'Собственные модели.',
        'Полный цикл.'
      ];

      let currentPhrase = 0;
      let isTransitioning = false;
      let ticking = false;

      function updateMorphText() {
        const scrollY = window.scrollY;
        const wrapperH = wrapper.offsetHeight;
        const viewH = window.innerHeight;
        // Scrollable distance within wrapper
        const scrollRange = wrapperH - viewH;
        if (scrollRange <= 0) return;

        const progress = Math.min(Math.max(scrollY / scrollRange, 0), 1);
        const index = Math.min(Math.floor(progress * phrases.length), phrases.length - 1);

        if (currentPhrase !== index && !isTransitioning) {
          isTransitioning = true;
          currentPhrase = index;

          // Fade out with blur
          morphText.style.opacity = '0';
          morphText.style.filter = 'blur(8px)';

          setTimeout(() => {
            morphText.textContent = phrases[index];
            // Fade in
            morphText.style.opacity = '1';
            morphText.style.filter = 'blur(0px)';
            setTimeout(() => {
              isTransitioning = false;
            }, 300);
          }, 250);
        }
      }

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateMorphText();
            ticking = false;
          });
          ticking = true;
        }
      });
    }

    /* ========================================
       FLOATING TAGS — subtle float on career position desc
       ======================================== */
    function initFloatingTags() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.matchMedia('(hover: none)').matches) return;

      // Add float animation to position cards on hover
      const positions = document.querySelectorAll('.careers__position');
      positions.forEach(pos => {
        pos.addEventListener('mouseenter', () => {
          const icon = pos.querySelector('.careers__position-icon');
          if (icon) {
            icon.style.animation = 'floatTag 2s ease-in-out infinite';
          }
        });
        pos.addEventListener('mouseleave', () => {
          const icon = pos.querySelector('.careers__position-icon');
          if (icon) {
            icon.style.animation = '';
          }
        });
      });
    }

    /* ========================================
       DATA FLOW — canvas pipeline animation
       ======================================== */
    function initDataFlow() {
      var canvas = document.getElementById('dataflow-canvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var H = (window.innerWidth < 600) ? 160 : 160, W, dpr, animating = false, t = 0;
      var mx = -999, my = -999;

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.parentElement.offsetWidth;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = '160px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      canvas.addEventListener('mousemove', function(e) {
        var r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      canvas.addEventListener('mouseleave', function() { mx = -999; my = -999; });

      var allStages = [
        { label: 'Raw Data', icon: '{ }', desc: 'JSON · CSV · API' },
        { label: 'Preprocess', icon: '⚙', desc: 'Clean · Transform' },
        { label: 'Vectorize', icon: '◈', desc: 'Embed · Index' },
        { label: 'Fine-Tune', icon: '◉', desc: 'LoRA · Train' },
        { label: 'Deploy', icon: '▸', desc: 'API · Serve' }
      ];
      var stages = W < 600 ? [allStages[0], allStages[3], allStages[4]] : allStages;
      var cy = H / 2 - 5;
      var particles = [];
      var dataLabels = [];
      var labelTexts = ['0x4F2A','tensor','embed','vector','token','batch','grad','loss','epoch','infer','query','chunk','node','pipe','feat'];

      function rgb() {
        var hex = (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3B82F6').replace('#','');
        return [parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16)];
      }
      function nodeX(i) {
        var pad = W < 600 ? 0.12 : 0.08;
        return W * pad + (W * (1 - pad*2) / (stages.length - 1)) * i;
      }
      function nodeY(i) { return cy; }
      function isMobileLayout() { return W < 600; }

      function spawn() {
        var seg = Math.floor(Math.random() * (stages.length - 1));
        particles.push({ seg:seg, p:0, sp: 0.002+Math.random()*0.005,
          lane:(Math.random()-0.5)*40, sz:1+Math.random()*2,
          w:Math.random()*6.28, amp:2+Math.random()*5, freq:1.5+Math.random()*2,
          al:0.3+Math.random()*0.7 });
      }
      function spawnLabel() {
        var seg = Math.floor(Math.random() * (stages.length - 1));
        dataLabels.push({ seg:seg, p:0, sp:0.001+Math.random()*0.002,
          lane:(Math.random()-0.5)*30, txt: labelTexts[Math.floor(Math.random()*labelTexts.length)],
          al: 0.15+Math.random()*0.2 });
      }

      function draw() {
        if (!animating) return;
        ctx.clearRect(0, 0, W, H); t += 0.014;
        var c = rgb();

        // --- Flowing ribbons (wide river) ---
        for (var i = 0; i < stages.length - 1; i++) {
          var x1 = nodeX(i) + 35, x2 = nodeX(i+1) - 35;
          var y1r = nodeY(i), y2r = nodeY(i+1);
          if (x2 <= x1 && !isMobileLayout()) continue;
          if (isMobileLayout() && Math.abs(x2-x1) < 10 && Math.abs(y2r-y1r) < 10) continue;
          for (var r = -3; r <= 3; r++) {
            var yOff = r * 10;
            ctx.beginPath();
            for (var px = x1; px <= x2; px += 4) {
              var tt = (px-x1)/(x2-x1);
              var wave = Math.sin(tt*5 + t*1.2 + r*0.8) * (3 + Math.abs(r));
              var ribbonY = y1r + (y2r-y1r)*((px-x1)/(x2-x1 || 1));
              if (px === x1) ctx.moveTo(px, ribbonY+yOff+wave);
              else ctx.lineTo(px, ribbonY+yOff+wave);
            }
            ctx.strokeStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(0.06-Math.abs(r)*0.012)+')';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }

        // --- Data labels floating ---
        dataLabels.forEach(function(dl) {
          var x1 = nodeX(dl.seg)+35, x2 = nodeX(dl.seg+1)-35;
          var x = x1 + (x2-x1)*dl.p;
          var y = cy + dl.lane + Math.sin(dl.p*3+t)*4;
          ctx.font = '500 9px "JetBrains Mono",monospace';
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+dl.al+')';
          ctx.textAlign = 'center';
          ctx.fillText(dl.txt, x, y);
          dl.p += dl.sp;
        });
        dataLabels = dataLabels.filter(function(d){return d.p<1;});
        if (dataLabels.length < 12 && Math.random() < 0.05) spawnLabel();

        // --- Particles with mouse interaction ---
        particles.forEach(function(p) {
          var x1 = nodeX(p.seg)+35, x2 = nodeX(p.seg+1)-35;
          var x = x1 + (x2-x1)*p.p;
          var fromY = nodeY(p.seg), toY = nodeY(p.seg+1);
          var baseY = fromY + (toY - fromY) * p.p;
          var wy = Math.sin(p.p*p.freq*3.14 + p.w + t*1.5)*p.amp;
          var y = baseY + p.lane * 0.5 + wy;

          // Mouse repel
          var dx = x-mx, dy = y-my, dist = Math.sqrt(dx*dx+dy*dy);
          if (dist < 60 && dist > 0) {
            var force = (60-dist)/60 * 12;
            x += (dx/dist)*force; y += (dy/dist)*force;
          }

          ctx.beginPath(); ctx.arc(x,y,p.sz*2.5,0,6.28);
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(p.al*0.1)+')';
          ctx.fill();
          ctx.beginPath(); ctx.arc(x,y,p.sz,0,6.28);
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+p.al+')';
          ctx.fill();
          p.p += p.sp;
        });
        particles = particles.filter(function(p){return p.p<1;});
        while (particles.length < (W < 600 ? 25 : 60)) spawn();

        // --- Nodes (large hexagons with spinning ring + description) ---
        stages.forEach(function(s, i) {
          var nx = nodeX(i); var ny = nodeY(i);
          var pulse = 1 + Math.sin(t*2+i*1.3)*0.08;
          var isMobile = W < 600; var R = (isMobile ? 22 : 28) * pulse;

          // Mouse proximity glow
          var ndx = nx-mx, ndy = ny-my, ndist = Math.sqrt(ndx*ndx+ndy*ndy);
          var hovered = ndist < 50;
          var glowAlpha = hovered ? 0.15 : 0.04;

          // Outer glow
          ctx.beginPath(); ctx.arc(nx,ny,R+16,0,6.28);
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+glowAlpha+')';
          ctx.fill();

          // Spinning ring
          ctx.beginPath();
          var ringStart = t*1.5+i;
          ctx.arc(nx,ny,R+6, ringStart, ringStart+3.5);
          ctx.strokeStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?0.5:0.15)+')';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Hexagon
          ctx.beginPath();
          for (var h=0;h<6;h++) {
            var a = (h*60-30)*Math.PI/180;
            var hx = nx+Math.cos(a)*R, hy = cy+Math.sin(a)*R;
            if(h===0)ctx.moveTo(hx,hy);else ctx.lineTo(hx,hy);
          }
          ctx.closePath();
          var hG = ctx.createRadialGradient(nx,ny,0,nx,ny,R);
          hG.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?0.35:0.2)+')');
          hG.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?0.12:0.05)+')');
          ctx.fillStyle = hG;
          ctx.fill();
          ctx.strokeStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?0.8:0.4)+')';
          ctx.lineWidth = hovered?2:1.5;
          ctx.stroke();

          // Icon
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?1:0.8)+')';
          ctx.font = (hovered?'700 '+(isMobile?'10':'14')+'px':'700 '+(isMobile?'9':'13')+'px') +' "JetBrains Mono",monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(s.icon, nx, ny-1);

          // Label
          ctx.font = '600 '+(isMobile?'8':'11')+'px "JetBrains Mono",monospace';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(hovered?0.9:0.6)+')';
          ctx.fillText(s.label, nx, ny+R+18);

          // Desc (visible on hover)
          if (hovered) {
            ctx.font = '400 9px "DM Sans",sans-serif';
            ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+',0.5)';
            ctx.fillText(s.desc, nx, ny+R+32);
          }

          // Orbiting dots
          for (var d=0;d<4;d++) {
            var oa = t*(1.2+d*0.4)+i*1.5+d*1.57;
            var or2 = R+(isMobile?4:8)+d*(isMobile?2:3);
            ctx.beginPath();
            ctx.arc(nx+Math.cos(oa)*or2, ny+Math.sin(oa)*or2, hovered?2:1.2, 0,6.28);
            ctx.fillStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(0.5-d*0.1)+')';
            ctx.fill();
          }
        });

        // --- Connection arcs ---
        for (var j=0;j<stages.length-1;j++) {
          var sx=nodeX(j)+32, ex=nodeX(j+1)-32;
          var sy=nodeY(j), ey=nodeY(j+1);
          ctx.beginPath(); ctx.moveTo(sx,sy);
          ctx.quadraticCurveTo((sx+ex)/2, (sy+ey)/2+Math.sin(t+j)*6, ex, ey);
          ctx.strokeStyle = 'rgba('+c[0]+','+c[1]+','+c[2]+',0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        requestAnimationFrame(draw);
      }

      var observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) { animating=true; draw(); }
        else { animating=false; }
      }, { threshold: 0.1 });
      observer.observe(canvas);
    }
  

    /* ========================================
       ANALYTICS — Yandex.Metrika events
       ======================================== */
    (function() {
      if (typeof ym === 'undefined') return;
      var YM = 108311343;

      // Section scroll tracking
      ['products','tech-stack','ai-capabilities','studio','careers','contact'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var fired = false;
        new IntersectionObserver(function(entries) {
          if (entries[0].isIntersecting && !fired) {
            fired = true;
            ym(YM, 'reachGoal', 'scroll_' + id);
          }
        }, {threshold: 0.3}).observe(el);
      });

      // CTA clicks
      document.addEventListener('click', function(e) {
        var btn = e.target.closest('button[type="submit"], a[href="#contact"]');
        if (btn) ym(YM, 'reachGoal', 'cta_click_tech', {text: btn.textContent.trim()});
      });

      // Form submit
      var form = document.getElementById('cta-form');
      if (form) form.addEventListener('submit', function() {
        ym(YM, 'reachGoal', 'lead_submit_tech');
      });

      // Stack tabs
      document.querySelectorAll('.stack__tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          ym(YM, 'reachGoal', 'stack_tab', {tab: tab.textContent.trim()});
        });
      });

      // Outbound links
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        try {
          var u = new URL(a.href);
          if (u.hostname !== location.hostname) ym(YM, 'reachGoal', 'outbound', {url: a.href});
        } catch(e) {}
      });
    })();