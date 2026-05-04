/* ═══════════════════════════════════════════════════════════════════
 * Quillon Tech · Black Hole (404)
 *
 * Спиральный particle-vortex с гравитационным вытягиванием к центру.
 * Outer ring — red accretion glow, inner — dark void.
 *
 * Используется на /404/. Тематика: страницу засосало в пустоту.
 * ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

export function initBlackHole({
  canvas,
  bgColor    = 0x0F1B3D,
  count      = 9000,
  innerR     = 0.18,           // event horizon — particles исчезают
  outerR     = 4.5,            // spawn radius
  swirlSpeed = 0.6,             // tangential rotation
  pullSpeed  = 0.18,            // radial inward drift
  colors     = {
    outer: '#5689D9',           // far stars (cool blue)
    edge:  '#E63946',           // accretion disk (red)
    near:  '#FF6B6B',           // hot center (slight pink)
  },
  cameraZ    = 5.2,
} = {}) {
  if (!canvas) throw new Error('initBlackHole: canvas required');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(bgColor, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  /* ─── Particles на диске вокруг чёрной дыры ───────────────── */
  const positions = new Float32Array(count * 3);
  const data      = new Float32Array(count * 3);   // r, theta, ySpread
  const colorsAtt = new Float32Array(count * 3);

  const cOuter = new THREE.Color(colors.outer);
  const cEdge  = new THREE.Color(colors.edge);
  const cNear  = new THREE.Color(colors.near);

  function spawn(i) {
    const r     = innerR + Math.random() * (outerR - innerR);
    const theta = Math.random() * Math.PI * 2;
    const yJit  = (Math.random() - 0.5) * 0.18 * Math.exp(-(r - innerR) * 1.2);
    data[i * 3]     = r;
    data[i * 3 + 1] = theta;
    data[i * 3 + 2] = yJit;
  }
  for (let i = 0; i < count; i++) spawn(i);

  function paintColors() {
    for (let i = 0; i < count; i++) {
      const r = data[i * 3];
      // Mix: near (red-hot) → edge (red) → outer (cool blue)
      // Закрашиваем по нормированному радиусу
      const t = Math.min(1, (r - innerR) / (outerR - innerR));
      let col;
      if (t < 0.25) {
        col = cNear.clone().lerp(cEdge, t / 0.25);
      } else {
        col = cEdge.clone().lerp(cOuter, (t - 0.25) / 0.75);
      }
      colorsAtt[i * 3]     = col.r;
      colorsAtt[i * 3 + 1] = col.g;
      colorsAtt[i * 3 + 2] = col.b;
    }
  }
  paintColors();

  function recalc() {
    for (let i = 0; i < count; i++) {
      const r     = data[i * 3];
      const theta = data[i * 3 + 1];
      const y     = data[i * 3 + 2];
      positions[i * 3]     = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
  }
  recalc();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colorsAtt, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.018,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);

  /* ─── Soft red glow в центре (без жёсткого horizon-диска) ── */
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#E63946') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c) * 2.0;
        float a = pow(1.0 - d, 2.5);
        gl_FragColor = vec4(uColor, a * 0.55);
      }
    `,
  });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(innerR * 6, innerR * 6),
    glowMat
  );

  /* ─── Group rotation для tilt ─────────────────────────────── */
  const group = new THREE.Group();
  group.add(points); group.add(glow);
  scene.add(group);
  // Лёгкий начальный наклон чтобы диск был виден как эллипс
  group.rotation.x = -Math.PI * 0.18;

  /* ─── Mouse-tilt ───────────────────────────────────────────── */
  const target = { x: -Math.PI * 0.18, y: 0 };
  function onPointer(e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    target.x = -Math.PI * 0.18 + ny * 0.12;
    target.y = nx * 0.18;
  }
  window.addEventListener('pointermove', onPointer);

  /* ─── Resize ──────────────────────────────────────────────── */
  function onResize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(canvas);
  window.addEventListener('resize', onResize);
  onResize();

  /* ─── Animation loop ──────────────────────────────────────── */
  const clock = new THREE.Clock();
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    // Update particle positions: spiral inward
    for (let i = 0; i < count; i++) {
      const r0 = data[i * 3];
      let r     = r0;
      let theta = data[i * 3 + 1];

      // Угловая скорость растёт по 1/√r (kepler-like)
      theta += swirlSpeed * dt / Math.sqrt(Math.max(r, 0.05));
      // Радиальный pull — быстрее у горизонта
      r -= pullSpeed * dt * (1.0 / Math.max(r, 0.2));

      // Re-spawn если упал в горизонт
      if (r < innerR) {
        spawn(i);
        // обновляем цвет соответственно новому r
        const newR = data[i * 3];
        const t = Math.min(1, (newR - innerR) / (outerR - innerR));
        let col;
        if (t < 0.25) col = cNear.clone().lerp(cEdge, t / 0.25);
        else          col = cEdge.clone().lerp(cOuter, (t - 0.25) / 0.75);
        colorsAtt[i * 3]     = col.r;
        colorsAtt[i * 3 + 1] = col.g;
        colorsAtt[i * 3 + 2] = col.b;
        continue;
      }
      data[i * 3]     = r;
      data[i * 3 + 1] = theta;
      const y = data[i * 3 + 2];
      positions[i * 3]     = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate    = true;

    // Mouse easing
    group.rotation.x += (target.x - group.rotation.x) * 0.04;
    group.rotation.y += (target.y - group.rotation.y) * 0.04;

    renderer.render(scene, camera);
  }
  animate();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}
