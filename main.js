import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────────
// Scene setup
// ─────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);
scene.fog = new THREE.FogExp2(0x000010, 0.00035);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 45, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 25;
controls.maxDistance = 400;
controls.target.set(0, 0, 0);

// ─────────────────────────────────────────────────────────────
// Starfield
// ─────────────────────────────────────────────────────────────
function createStarfield(count = 4000) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 600 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const t = Math.random();
    colors[i * 3]     = 0.7 + t * 0.3;
    colors[i * 3 + 1] = 0.8 + t * 0.2;
    colors[i * 3 + 2] = 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
  });
  return new THREE.Points(geo, mat);
}
scene.add(createStarfield());

// ─────────────────────────────────────────────────────────────
// Lights
// ─────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.8);
sunLight.position.set(200, 40, 80);
scene.add(sunLight);

const ambient = new THREE.AmbientLight(0x1a2030, 0.35);
scene.add(ambient);

const rimLight = new THREE.DirectionalLight(0x4060a0, 0.4);
rimLight.position.set(-100, -20, -50);
scene.add(rimLight);

// ─────────────────────────────────────────────────────────────
// Saturn planet
// ─────────────────────────────────────────────────────────────
const SATURN_RADIUS = 18;

// Procedural banded texture via canvas
function createSaturnTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, '#c9a36e');
  grad.addColorStop(0.15, '#d4b07a');
  grad.addColorStop(0.3, '#b8925a');
  grad.addColorStop(0.45, '#e0c090');
  grad.addColorStop(0.55, '#a87c48');
  grad.addColorStop(0.7, '#c9a36e');
  grad.addColorStop(0.85, '#d4b07a');
  grad.addColorStop(1.0, '#b8925a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Horizontal bands
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size;
    const h = 2 + Math.random() * 12;
    const alpha = 0.08 + Math.random() * 0.18;
    ctx.fillStyle = `rgba(${80 + Math.random()*40}, ${50 + Math.random()*30}, ${20}, ${alpha})`;
    ctx.fillRect(0, y, size, h);
  }

  // Subtle noise
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    imgData.data[i]     = Math.min(255, Math.max(0, imgData.data[i] + n));
    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n * 0.9));
    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const saturnGeo = new THREE.SphereGeometry(SATURN_RADIUS, 128, 96);
const saturnMat = new THREE.MeshStandardMaterial({
  map: createSaturnTexture(),
  roughness: 0.85,
  metalness: 0.05
});
const saturn = new THREE.Mesh(saturnGeo, saturnMat);
saturn.rotation.z = THREE.MathUtils.degToRad(26.7); // axial tilt
scene.add(saturn);

// Subtle atmosphere glow
const atmoGeo = new THREE.SphereGeometry(SATURN_RADIUS * 1.025, 64, 48);
const atmoMat = new THREE.MeshBasicMaterial({
  color: 0xd4b08a,
  transparent: true,
  opacity: 0.08,
  side: THREE.BackSide
});
const atmo = new THREE.Mesh(atmoGeo, atmoMat);
saturn.add(atmo);

// ─────────────────────────────────────────────────────────────
// Ring system (multiple concentric rings)
// ─────────────────────────────────────────────────────────────
function createRingTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Transparent base
  ctx.clearRect(0, 0, size, 64);

  // Ring density profile (approximate real rings)
  // C ring (inner), B ring (bright), Cassini Division, A ring
  const bands = [
    { start: 0.00, end: 0.18, dens: 0.15, color: [180, 160, 130] }, // C
    { start: 0.18, end: 0.48, dens: 0.85, color: [220, 200, 170] }, // B
    { start: 0.48, end: 0.55, dens: 0.05, color: [100, 90, 70]  }, // Cassini
    { start: 0.55, end: 0.82, dens: 0.55, color: [200, 185, 155] }, // A
    { start: 0.82, end: 0.88, dens: 0.12, color: [160, 145, 120] }, // Encke region
    { start: 0.88, end: 1.00, dens: 0.25, color: [190, 175, 145] }  // outer A
  ];

  for (let x = 0; x < size; x++) {
    const t = x / size;
    let dens = 0;
    let col = [180, 160, 130];
    for (const b of bands) {
      if (t >= b.start && t < b.end) {
        dens = b.dens;
        col = b.color;
        // micro-structure
        dens *= 0.7 + 0.3 * Math.sin(t * 80 + Math.random());
        break;
      }
    }
    // radial variation
    dens *= 0.85 + 0.15 * Math.sin(t * 400);

    const a = Math.floor(dens * 255);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a / 255})`;
    ctx.fillRect(x, 0, 1, 64);
  }

  // Fine particle noise
  const img = ctx.getImageData(0, 0, size, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 10) {
      const n = (Math.random() - 0.5) * 30;
      img.data[i]     = Math.min(255, Math.max(0, img.data[i] + n));
      img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
      img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 16;
  return tex;
}

const ringInner = SATURN_RADIUS * 1.2;
const ringOuter = SATURN_RADIUS * 2.35;

const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 256, 8);
// UV mapping for radial texture
const pos = ringGeo.attributes.position;
const uv = ringGeo.attributes.uv;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const r = Math.sqrt(x * x + y * y);
  const u = (r - ringInner) / (ringOuter - ringInner);
  uv.setXY(i, u, 0.5);
}
ringGeo.attributes.uv.needsUpdate = true;

const ringMat = new THREE.MeshStandardMaterial({
  map: createRingTexture(),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.95,
  roughness: 0.7,
  metalness: 0.1,
  depthWrite: false
});
const rings = new THREE.Mesh(ringGeo, ringMat);
rings.rotation.x = -Math.PI / 2;
rings.rotation.z = THREE.MathUtils.degToRad(26.7); // match axial tilt
saturn.add(rings);

// Soft particle ring layer for extra realism
function createParticleRings() {
  const count = 8000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = ringInner + Math.random() * (ringOuter - ringInner);
    const theta = Math.random() * Math.PI * 2;
    // slight vertical thickness
    const z = (Math.random() - 0.5) * 0.4;
    positions[i * 3]     = r * Math.cos(theta);
    positions[i * 3 + 1] = z;
    positions[i * 3 + 2] = r * Math.sin(theta);

    const t = (r - ringInner) / (ringOuter - ringInner);
    colors[i * 3]     = 0.75 + t * 0.2;
    colors[i * 3 + 1] = 0.7 + t * 0.15;
    colors[i * 3 + 2] = 0.55 + t * 0.1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  pts.rotation.x = -Math.PI / 2;
  pts.rotation.z = THREE.MathUtils.degToRad(26.7);
  return pts;
}
saturn.add(createParticleRings());

// ─────────────────────────────────────────────────────────────
// Orbital path (ellipse around a distant sun marker)
// ─────────────────────────────────────────────────────────────
const orbitRadius = 280;
const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.98, 0, 2 * Math.PI, false, 0);
const orbitPoints = orbitCurve.getPoints(256);
const orbitGeo = new THREE.BufferGeometry().setFromPoints(
  orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
);
const orbitMat = new THREE.LineBasicMaterial({
  color: 0x3a6a9a,
  transparent: true,
  opacity: 0.35
});
const orbitLine = new THREE.Line(orbitGeo, orbitMat);
orbitLine.visible = true;
scene.add(orbitLine);

// Distant sun marker
const sunGeo = new THREE.SphereGeometry(6, 32, 24);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(orbitRadius + 40, 0, 0);
scene.add(sun);

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(14, 32, 24),
  new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.15 })
);
sun.add(sunGlow);

// ─────────────────────────────────────────────────────────────
// Animation state
// ─────────────────────────────────────────────────────────────
let timeScale = 1;
let showOrbit = true;
let saturnAngle = 0;
const clock = new THREE.Clock();
let frameCount = 0;
let lastFpsTime = performance.now();

// HUD elements
const distEl = document.getElementById('dist');
const timescaleEl = document.getElementById('timescale');
const fpsEl = document.getElementById('fps');

document.getElementById('btn-orbit').addEventListener('click', () => {
  showOrbit = !showOrbit;
  orbitLine.visible = showOrbit;
});

document.getElementById('btn-speed').addEventListener('click', () => {
  timeScale = timeScale >= 16 ? 1 : timeScale * 2;
  timescaleEl.textContent = timeScale + '×';
  document.getElementById('btn-speed').textContent =
    timeScale >= 16 ? 'Speed ×1' : `Speed ×${timeScale * 2}`;
});

document.getElementById('btn-reset').addEventListener('click', () => {
  camera.position.set(0, 45, 120);
  controls.target.set(0, 0, 0);
  controls.update();
});

// ─────────────────────────────────────────────────────────────
// Render loop
// ─────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Saturn self-rotation (real ~10.7 h → accelerated)
  saturn.rotation.y += dt * 0.15 * timeScale;

  // Slow orbital motion around the distant sun
  saturnAngle += dt * 0.008 * timeScale;
  const ox = Math.cos(saturnAngle) * orbitRadius;
  const oz = Math.sin(saturnAngle) * orbitRadius;
  // Keep planet near origin for viewing; move the orbital path instead
  // (visual: planet stays centered, path rotates under it)
  orbitLine.rotation.y = -saturnAngle;

  // Distance readout (fake AU-scale for display)
  const camDist = camera.position.length();
  distEl.textContent = (camDist * 0.08).toFixed(1) + ' Rₛ';

  controls.update();
  renderer.render(scene, camera);

  // FPS counter
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = frameCount + ' fps';
    frameCount = 0;
    lastFpsTime = now;
  }
}

animate();

// ─────────────────────────────────────────────────────────────
// Resize
// ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
