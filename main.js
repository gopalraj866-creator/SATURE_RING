import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log('Saturn simulation starting...');

// ─────────────────────────────────────────────────────────────
// Scene setup
// ─────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 35, 95);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 30;
controls.maxDistance = 500;
controls.target.set(0, 0, 0);
controls.update();

// ─────────────────────────────────────────────────────────────
// Starfield
// ─────────────────────────────────────────────────────────────
function createStarfield(count = 5000) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 400 + Math.random() * 1200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const t = Math.random();
    colors[i * 3]     = 0.75 + t * 0.25;
    colors[i * 3 + 1] = 0.8 + t * 0.2;
    colors[i * 3 + 2] = 1.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  return new THREE.Points(geo, mat);
}
scene.add(createStarfield());

// ─────────────────────────────────────────────────────────────
// Lights – stronger so planet is never black
// ─────────────────────────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.2);
sunLight.position.set(180, 50, 100);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8899bb, 0.55);
fillLight.position.set(-120, -30, -80);
scene.add(fillLight);

const ambient = new THREE.AmbientLight(0x334466, 0.45);
scene.add(ambient);

// ─────────────────────────────────────────────────────────────
// Saturn planet
// ─────────────────────────────────────────────────────────────
const SATURN_RADIUS = 20;

function createSaturnTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base warm gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.00, '#d4b07a');
  grad.addColorStop(0.12, '#e8c890');
  grad.addColorStop(0.25, '#c9a05e');
  grad.addColorStop(0.40, '#e0bc88');
  grad.addColorStop(0.55, '#b89050');
  grad.addColorStop(0.70, '#d4b07a');
  grad.addColorStop(0.85, '#e8c890');
  grad.addColorStop(1.00, '#c9a05e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Horizontal atmospheric bands
  for (let i = 0; i < 55; i++) {
    const y = Math.random() * size;
    const h = 1 + Math.random() * 14;
    const alpha = 0.07 + Math.random() * 0.22;
    const dark = Math.random() > 0.5;
    if (dark) {
      ctx.fillStyle = `rgba(90, 60, 25, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(240, 210, 160, ${alpha * 0.7})`;
    }
    ctx.fillRect(0, y, size, h);
  }

  // Subtle noise
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    imgData.data[i]     = Math.min(255, Math.max(0, imgData.data[i] + n));
    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + n * 0.9));
    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + n * 0.65));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const saturnGeo = new THREE.SphereGeometry(SATURN_RADIUS, 96, 64);
const saturnMat = new THREE.MeshStandardMaterial({
  map: createSaturnTexture(),
  roughness: 0.82,
  metalness: 0.04
});
const saturn = new THREE.Mesh(saturnGeo, saturnMat);
saturn.rotation.z = THREE.MathUtils.degToRad(26.7); // axial tilt
scene.add(saturn);

// Soft atmosphere rim
const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(SATURN_RADIUS * 1.03, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0xd4b08a,
    transparent: true,
    opacity: 0.07,
    side: THREE.BackSide
  })
);
saturn.add(atmo);

// ─────────────────────────────────────────────────────────────
// Ring system
// ─────────────────────────────────────────────────────────────
function createRingTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, 64);

  // Approximate real ring structure
  const bands = [
    { start: 0.00, end: 0.17, dens: 0.18, color: [190, 170, 140] }, // C
    { start: 0.17, end: 0.50, dens: 0.90, color: [230, 210, 175] }, // B (bright)
    { start: 0.50, end: 0.57, dens: 0.04, color: [80, 70, 55]   }, // Cassini
    { start: 0.57, end: 0.84, dens: 0.60, color: [210, 195, 160] }, // A
    { start: 0.84, end: 0.90, dens: 0.15, color: [160, 145, 120] },
    { start: 0.90, end: 1.00, dens: 0.28, color: [195, 180, 150] }
  ];

  for (let x = 0; x < size; x++) {
    const t = x / size;
    let dens = 0;
    let col = [190, 170, 140];
    for (const b of bands) {
      if (t >= b.start && t < b.end) {
        dens = b.dens * (0.75 + 0.25 * Math.sin(t * 90));
        col = b.color;
        break;
      }
    }
    dens *= 0.85 + 0.15 * Math.sin(t * 380);
    const a = Math.floor(Math.min(1, dens) * 255);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a / 255})`;
    ctx.fillRect(x, 0, 1, 64);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const ringInner = SATURN_RADIUS * 1.22;
const ringOuter = SATURN_RADIUS * 2.4;

const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 256, 6);
const pos = ringGeo.attributes.position;
const uv = ringGeo.attributes.uv;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const r = Math.sqrt(x * x + y * y);
  const u = (r - ringInner) / (ringOuter - ringInner);
  uv.setXY(i, u, 0.5);
}
uv.needsUpdate = true;

const ringMat = new THREE.MeshStandardMaterial({
  map: createRingTexture(),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.95,
  roughness: 0.65,
  metalness: 0.08,
  depthWrite: false
});
const rings = new THREE.Mesh(ringGeo, ringMat);
rings.rotation.x = -Math.PI / 2;
rings.rotation.z = THREE.MathUtils.degToRad(26.7);
saturn.add(rings);

// Extra particle layer for depth
function createParticleRings() {
  const count = 9000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = ringInner + Math.random() * (ringOuter - ringInner);
    const theta = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * 0.35;
    positions[i * 3]     = r * Math.cos(theta);
    positions[i * 3 + 1] = z;
    positions[i * 3 + 2] = r * Math.sin(theta);

    const t = (r - ringInner) / (ringOuter - ringInner);
    colors[i * 3]     = 0.8 + t * 0.15;
    colors[i * 3 + 1] = 0.75 + t * 0.12;
    colors[i * 3 + 2] = 0.6 + t * 0.1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
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
// Orbital path + distant sun
// ─────────────────────────────────────────────────────────────
const orbitRadius = 320;
const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * 0.97, 0, Math.PI * 2, false, 0);
const orbitPts = orbitCurve.getPoints(180).map(p => new THREE.Vector3(p.x, 0, p.y));
const orbitLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPts),
  new THREE.LineBasicMaterial({ color: 0x3a6a9a, transparent: true, opacity: 0.4 })
);
scene.add(orbitLine);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(8, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff0c0 })
);
sun.position.set(orbitRadius + 50, 0, 0);
scene.add(sun);

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(18, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.18 })
);
sun.add(sunGlow);

// ─────────────────────────────────────────────────────────────
// Animation state
// ─────────────────────────────────────────────────────────────
let timeScale = 1;
let saturnAngle = 0;
const clock = new THREE.Clock();
let frameCount = 0;
let lastFpsTime = performance.now();

const distEl = document.getElementById('dist');
const timescaleEl = document.getElementById('timescale');
const fpsEl = document.getElementById('fps');

document.getElementById('btn-orbit').addEventListener('click', () => {
  orbitLine.visible = !orbitLine.visible;
});

document.getElementById('btn-speed').addEventListener('click', () => {
  timeScale = timeScale >= 16 ? 1 : timeScale * 2;
  timescaleEl.textContent = timeScale + '×';
  document.getElementById('btn-speed').textContent =
    timeScale >= 16 ? 'Speed ×1' : `Speed ×${timeScale * 2}`;
});

document.getElementById('btn-reset').addEventListener('click', () => {
  camera.position.set(0, 35, 95);
  controls.target.set(0, 0, 0);
  controls.update();
});

// ─────────────────────────────────────────────────────────────
// Render loop
// ─────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Self rotation
  saturn.rotation.y += dt * 0.12 * timeScale;

  // Slow orbit visualization
  saturnAngle += dt * 0.006 * timeScale;
  orbitLine.rotation.y = -saturnAngle;

  // HUD
  const camDist = camera.position.length();
  distEl.textContent = (camDist * 0.07).toFixed(1) + ' Rₛ';

  controls.update();
  renderer.render(scene, camera);

  // FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = frameCount + ' fps';
    frameCount = 0;
    lastFpsTime = now;
  }
}

animate();
console.log('Saturn simulation running');

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
