/* ═══════════════════════════════════════════════════════════════════
 * Quillon Tech · Galaxy Sphere
 *
 * 3 nested orbiting spheres из particles + mouse-tilt.
 * Использование:
 *   import { initGalaxy } from './galaxy-sphere.js';
 *   initGalaxy({ canvas, colors: {...}, counts: {...} });
 * ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

function spherePositions(count, radius) {
  const arr = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    arr[i * 3]     = Math.cos(theta) * r * radius;
    arr[i * 3 + 1] = y * radius;
    arr[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return arr;
}

function pointsLayer(count, radius, color, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(spherePositions(count, radius), 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

export function initGalaxy({
  canvas,
  bgColor   = 0x0F1B3D,
  colors    = { outer: '#5689D9', middle: '#9DD9FF', inner: '#E63946' },
  counts    = { outer: 2200,      middle: 1500,      inner: 700 },
  radii     = { outer: 1.6,       middle: 1.05,      inner: 0.55 },
  sizes     = { outer: 0.012,     middle: 0.014,     inner: 0.018 },
  cameraZ   = 4,
  tiltScale = { x: 0.35, y: 0.45 },
} = {}) {
  if (!canvas) throw new Error('initGalaxy: canvas required');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(bgColor, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  const outer  = new THREE.Object3D();
  const middle = new THREE.Object3D();
  const inner  = new THREE.Object3D();

  outer.add(pointsLayer(counts.outer,   radii.outer,   colors.outer,   sizes.outer));
  middle.add(pointsLayer(counts.middle, radii.middle,  colors.middle,  sizes.middle));
  inner.add(pointsLayer(counts.inner,   radii.inner,   colors.inner,   sizes.inner));

  const galaxy = new THREE.Group();
  galaxy.add(outer); galaxy.add(middle); galaxy.add(inner);
  scene.add(galaxy);

  const target = { x: 0, y: 0 };
  const onPointerMove = (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    target.x = ny * tiltScale.x;
    target.y = nx * tiltScale.y;
  };
  window.addEventListener('pointermove', onPointerMove);

  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;        // защита от 0×0 init
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  // ResizeObserver реагирует на изменение размера parent — нужно когда
  // у canvas-контейнера aspect-ratio и/или media-query меняет ширину.
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas);
  window.addEventListener('resize', onResize);
  onResize();

  const clock = new THREE.Clock();
  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    outer.rotation.y  =  t * 0.06;
    outer.rotation.x  =  Math.sin(t * 0.10) * 0.15;
    middle.rotation.z = -t * 0.10;
    middle.rotation.y =  t * 0.13;
    inner.rotation.x  = -t * 0.18;
    inner.rotation.y  =  t * 0.22;
    galaxy.rotation.x += (target.x - galaxy.rotation.x) * 0.05;
    galaxy.rotation.y += (target.y - galaxy.rotation.y) * 0.05;
    renderer.render(scene, camera);
  }
  animate();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      renderer.dispose();
    }
  };
}
