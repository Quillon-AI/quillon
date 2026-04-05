/* ============================================================
   NEUROSTART — Canvas particle field
   Single Responsibility: render animated particle network
   in the <canvas data-particles> inside the hero.
   ============================================================ */

(function () {
  'use strict';

  const LINK_DIST = 120;
  const DENSITY = 12000; // 1 particle per N px²

  function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    let particles = [];

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = rect.width;
      H = rect.height;
    }

    function spawn() {
      const count = Math.min(80, Math.floor((W * H) / DENSITY));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.4,
        a: Math.random() * 0.5 + 0.2,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96,165,250,' + p.a + ')';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(31,78,216,' + (0.15 * (1 - d / LINK_DIST)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    function start() {
      resize();
      spawn();
      step();
    }

    start();
    window.addEventListener('resize', () => { resize(); spawn(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('canvas[data-particles]').forEach(initParticles);
  });
})();
