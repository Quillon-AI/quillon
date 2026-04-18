/* ==========================================================================
   Quillon — Scroll-Triggered Animations
   IntersectionObserver-based entrance animations, counter effects,
   navbar scroll behaviour, active nav highlighting, hero parallax.
   ========================================================================== */

function initAnimations() {
  'use strict';

  /* ── Respect prefers-reduced-motion ───────────────────────────────────── */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    /* Make everything visible immediately, skip all animation logic */
    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  /* ── 1. Scroll-triggered fade-in for sections ────────────────────────── */
  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    fadeObserver.observe(el);
  });

  /* ── 2. Staggered animations for grid children ──────────────────────── */
  var staggerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var children = entry.target.children;
        for (var i = 0; i < children.length; i++) {
          children[i].style.opacity = '0';
          children[i].style.transform = 'translateY(16px)';
          children[i].style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          children[i].style.transitionDelay = (100 * i) + 'ms';
        }
        /* Force reflow then trigger */
        entry.target.offsetHeight; // eslint-disable-line no-unused-expressions
        for (var j = 0; j < children.length; j++) {
          children[j].style.opacity = '1';
          children[j].style.transform = 'translateY(0)';
        }
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-stagger="true"]').forEach(function (el) {
    staggerObserver.observe(el);
  });

  /* ── 3. Counter animation for metric values ─────────────────────────── */

  /**
   * Parse a display value like "89 000", "$2.1 млрд", "+41%", "57 400"
   * and return an object describing how to animate it.
   */
  function parseMetricValue(raw) {
    var text = raw.trim();
    var prefix = '';
    var suffix = '';
    var numericString = text;

    /* Extract leading non-numeric characters (e.g. $ +) */
    var leadMatch = numericString.match(/^([^0-9]*)/);
    if (leadMatch && leadMatch[1]) {
      prefix = leadMatch[1];
      numericString = numericString.slice(prefix.length);
    }

    /* Extract trailing non-numeric characters (e.g. % , млрд) */
    var trailMatch = numericString.match(/([^0-9.,]*)$/);
    if (trailMatch && trailMatch[1]) {
      suffix = trailMatch[1];
      numericString = numericString.slice(0, numericString.length - suffix.length);
    }

    /* Normalise: spaces are thousands separators, keep dots/commas */
    var cleanNum = numericString.replace(/\s/g, '').replace(',', '.');
    var target = parseFloat(cleanNum);

    if (isNaN(target)) {
      return null;
    }

    /* Determine decimal places from original (after dot) */
    var decimals = 0;
    var dotIndex = cleanNum.indexOf('.');
    if (dotIndex !== -1) {
      decimals = cleanNum.length - dotIndex - 1;
    }

    /* Detect space-separated thousands formatting */
    var usesSpaces = /\d\s\d/.test(numericString);

    return {
      prefix: prefix,
      suffix: suffix,
      target: target,
      decimals: decimals,
      usesSpaces: usesSpaces
    };
  }

  /** Format number back with spaces for thousands if needed */
  function formatNumber(num, decimals, usesSpaces) {
    var fixed = num.toFixed(decimals);
    if (!usesSpaces) return fixed;

    var parts = fixed.split('.');
    var intPart = parts[0];
    var formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (parts.length > 1) {
      formatted += '.' + parts[1];
    }
    return formatted;
  }

  /** Ease-out quad */
  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function animateCounter(el, parsed) {
    var duration = 1500; /* ms */
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutQuad(progress);

      var current = easedProgress * parsed.target;
      el.textContent = parsed.prefix + formatNumber(current, parsed.decimals, parsed.usesSpaces) + parsed.suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        /* Ensure final value is exact */
        el.textContent = parsed.prefix + formatNumber(parsed.target, parsed.decimals, parsed.usesSpaces) + parsed.suffix;
      }
    }

    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var originalText = el.textContent;
        var parsed = parseMetricValue(originalText);
        if (parsed) {
          animateCounter(el, parsed);
        }
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.metric-value').forEach(function (el) {
    counterObserver.observe(el);
  });

  /* ── 4. Navbar scroll effect ────────────────────────────────────────── */
  var navbar = document.getElementById('navbar');
  var scrollTicking = false;

  function onNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        onNavbarScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* Run once on init in case the page is already scrolled */
  onNavbarScroll();

  /* ── 5. Active nav link highlighting ────────────────────────────────── */
  var navLinksDesktop = document.querySelectorAll('.nav-links a[href^="#"]');
  var navLinksMobile = document.querySelectorAll('.nav-mobile a[href^="#"]');
  var allNavLinks = [];
  navLinksDesktop.forEach(function (a) { allNavLinks.push(a); });
  navLinksMobile.forEach(function (a) { allNavLinks.push(a); });

  /* Build a list of sections that correspond to nav links */
  var navSectionIds = [];
  navLinksDesktop.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) navSectionIds.push(id);
  });

  var activeSectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var activeId = entry.target.id;
        allNavLinks.forEach(function (link) {
          var linkId = link.getAttribute('href').slice(1);
          if (linkId === activeId) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  navSectionIds.forEach(function (id) {
    var section = document.getElementById(id);
    if (section) {
      activeSectionObserver.observe(section);
    }
  });

  /* ── 6. Hero parallax (layered depth) ───────────────────────────────── */
  var heroBg = document.querySelector('.hero-bg');
  var heroGrid = document.querySelector('.hero-grid');
  var heroVisual = document.querySelector('.hero-visual');
  var heroSection = document.getElementById('hero');
  var parallaxTicking = false;

  if (heroSection && (heroBg || heroGrid || heroVisual)) {
    function updateParallax() {
      var scrollY = window.scrollY;
      var heroHeight = heroSection.offsetHeight;
      if (scrollY <= heroHeight) {
        if (heroBg)   heroBg.style.transform   = 'translateY(' + Math.round(scrollY * 0.3) + 'px)';
        if (heroGrid) heroGrid.style.transform = 'translateY(' + Math.round(scrollY * 0.3) + 'px)';
        /* Orbit moves slower — depth effect */
        if (heroVisual) heroVisual.style.transform = 'translateY(calc(-50% + ' + Math.round(scrollY * 0.18) + 'px))';
      }
    }

    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        requestAnimationFrame(function () {
          updateParallax();
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    }, { passive: true });
  }
}

/* Export for renderer.js */
window.initAnimations = initAnimations;
