import * as THREE from "three";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const QUALITY = params.get("q") || "high";
const SIM_SPEED = parseFloat(params.get("speed") || "1");

// ---------------------------------------------------------------------------
// Renderer – same solid pattern as the working Starlink project
// ---------------------------------------------------------------------------
const canvas = document.getElementById("gl");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: QUALITY === "high",
    powerPreference: "high-performance",
    alpha: false
  });
} catch (e) {
  document.getElementById("error").style.display = "flex";
  document.getElementById("errMsg").textContent = e.message || "Error creating WebGL context.";
  throw e;
}

renderer.setPixelRatio(1);                       // stable for streaming
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000008, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 4000);

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------
{
  const n = 6000;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 800 + Math.random() * 1400;
    pos[i * 3]     = s * Math.cos(a) * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = s * Math.sin(a) * r;
    const b = 0.4 + Math.pow(Math.random(), 2) * 0.6;
    col[i * 3]     = b;
    col[i * 3 + 1] = b * (0.92 + Math.random() * 0.08);
    col[i * 3 + 2] = b * (1.05 + Math.random() * 0.1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 1.5, sizeAttenuation: false, vertexColors: true, depthWrite: false
  })));
}

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------
const sunDir = new THREE.Vector3(1.0, 0.3, 0.6).normalize();
const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.8);
sunLight.position.copy(sunDir).multiplyScalar(300);
scene.add(sunLight);

const fill = new THREE.DirectionalLight(0x6a80b0, 0.4);
fill.position.set(-150, -40, -100);
scene.add(fill);

scene.add(new THREE.AmbientLight(0x1a2235, 0.35));

// ---------------------------------------------------------------------------
// Saturn
// ---------------------------------------------------------------------------
const R = 22;   // Saturn radius in scene units

function makeSaturnTexture() {
  const size = QUALITY === "high" ? 1024 : 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0.00, "#d4b07a");
  g.addColorStop(0.15, "#e8c890");
  g.addColorStop(0.30, "#c9a05e");
  g.addColorStop(0.45, "#e0bc88");
  g.addColorStop(0.55, "#b89050");
  g.addColorStop(0.70, "#d4b07a");
  g.addColorStop(0.85, "#e8c890");
  g.addColorStop(1.00, "#c9a05e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 50; i++) {
    const y = Math.random() * size;
    const h = 1 + Math.random() * 12;
    const a = 0.08 + Math.random() * 0.2;
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(80,55,20,${a})`
      : `rgba(245,220,170,${a * 0.6})`;
    ctx.fillRect(0, y, size, h);
  }

  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    img.data[i]     = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.9));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.7));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const saturnGroup = new THREE.Group();
scene.add(saturnGroup);

// Axial tilt 26.7°
saturnGroup.rotation.z = THREE.MathUtils.degToRad(26.7);

const saturnSeg = QUALITY === "high" ? [96, 64] : [48, 32];
const saturn = new THREE.Mesh(
  new THREE.SphereGeometry(R, ...saturnSeg),
  new THREE.MeshStandardMaterial({
    map: makeSaturnTexture(),
    roughness: 0.85,
    metalness: 0.03
  })
);
saturnGroup.add(saturn);

// Soft atmosphere
saturnGroup.add(new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.025, 32, 24),
  new THREE.MeshBasicMaterial({
    color: 0xd4b08a, transparent: true, opacity: 0.06, side: THREE.BackSide
  })
));

// ---------------------------------------------------------------------------
// Rings
// ---------------------------------------------------------------------------
function makeRingTexture() {
  const w = 1024, h = 32;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  const bands = [
    { s: 0.00, e: 0.16, d: 0.20, col: [185, 165, 135] }, // C
    { s: 0.16, e: 0.48, d: 0.92, col: [230, 210, 175] }, // B
    { s: 0.48, e: 0.55, d: 0.05, col: [70, 60, 45]    }, // Cassini
    { s: 0.55, e: 0.82, d: 0.62, col: [210, 195, 160] }, // A
    { s: 0.82, e: 0.88, d: 0.15, col: [155, 140, 115] },
    { s: 0.88, e: 1.00, d: 0.30, col: [195, 180, 150] }
  ];

  for (let x = 0; x < w; x++) {
    const t = x / w;
    let dens = 0, col = [190, 170, 140];
    for (const b of bands) {
      if (t >= b.s && t < b.e) {
        dens = b.d * (0.78 + 0.22 * Math.sin(t * 85));
        col = b.col;
        break;
      }
    }
    dens *= 0.88 + 0.12 * Math.sin(t * 400);
    const a = Math.floor(Math.min(1, dens) * 255);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a / 255})`;
    ctx.fillRect(x, 0, 1, h);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

const ringInner = R * 1.23;
const ringOuter = R * 2.35;

const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 192, 4);
// radial UVs
{
  const pos = ringGeo.attributes.position;
  const uv  = ringGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    uv.setXY(i, (r - ringInner) / (ringOuter - ringInner), 0.5);
  }
  uv.needsUpdate = true;
}

const rings = new THREE.Mesh(
  ringGeo,
  new THREE.MeshStandardMaterial({
    map: makeRingTexture(),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    roughness: 0.7,
    metalness: 0.05,
    depthWrite: false
  })
);
rings.rotation.x = -Math.PI / 2;
saturnGroup.add(rings);

// Fine particle ring layer
{
  const n = QUALITY === "high" ? 7000 : 3000;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = ringInner + Math.random() * (ringOuter - ringInner);
    const th = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * 0.3;
    pos[i * 3]     = r * Math.cos(th);
    pos[i * 3 + 1] = z;
    pos[i * 3 + 2] = r * Math.sin(th);
    const t = (r - ringInner) / (ringOuter - ringInner);
    col[i * 3]     = 0.78 + t * 0.18;
    col[i * 3 + 1] = 0.72 + t * 0.14;
    col[i * 3 + 2] = 0.55 + t * 0.12;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.2, vertexColors: true, transparent: true,
    opacity: 0.45, sizeAttenuation: true, depthWrite: false
  }));
  pts.rotation.x = -Math.PI / 2;
  saturnGroup.add(pts);
}

// ---------------------------------------------------------------------------
// Distant sun marker
// ---------------------------------------------------------------------------
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(5, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xfff0c0 })
);
sun.position.copy(sunDir).multiplyScalar(420);
scene.add(sun);
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(12, 16, 12),
  new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.12 })
)).position.copy(sun.position);

// ---------------------------------------------------------------------------
// Cinematic camera director  (inspired by the working Starlink project)
// ---------------------------------------------------------------------------
const shots = [
  { // slow orbit – classic beauty shot
    name: "ORBITAL VIEW",
    duration: 28,
    fn: (t, out) => {
      const a = t * 0.09;
      const elev = 0.32 + Math.sin(t * 0.07) * 0.08;
      const dist = 95 + Math.sin(t * 0.05) * 12;
      out.pos.set(
        Math.cos(a) * dist * Math.cos(elev),
        Math.sin(elev) * dist * 0.9,
        Math.sin(a) * dist * Math.cos(elev)
      );
      out.look.set(0, 0, 0);
      out.fov = 48;
    }
  },
  { // low ring plane glide
    name: "RING PLANE",
    duration: 22,
    fn: (t, out) => {
      const a = t * 0.07 + 1.2;
      const dist = 70 + Math.sin(t * 0.1) * 8;
      out.pos.set(Math.cos(a) * dist, 6 + Math.sin(t * 0.15) * 3, Math.sin(a) * dist);
      out.look.set(0, -2, 0);
      out.fov = 52;
    }
  },
  { // high dramatic tilt
    name: "HIGH ANGLE",
    duration: 20,
    fn: (t, out) => {
      const a = t * 0.06 + 2.5;
      const elev = 0.85 + Math.sin(t * 0.08) * 0.1;
      const dist = 110;
      out.pos.set(
        Math.cos(a) * dist * Math.cos(elev),
        Math.sin(elev) * dist,
        Math.sin(a) * dist * Math.cos(elev)
      );
      out.look.set(0, 0, 0);
      out.fov = 45;
    }
  },
  { // close approach
    name: "CLOSE APPROACH",
    duration: 18,
    fn: (t, out) => {
      const a = t * 0.11 + 4.0;
      const dist = 48 + Math.sin(t * 0.2) * 6;
      out.pos.set(Math.cos(a) * dist, 18 + Math.sin(t * 0.12) * 5, Math.sin(a) * dist);
      out.look.set(0, 2, 0);
      out.fov = 55;
    }
  },
  { // side-on classic portrait
    name: "PORTRAIT",
    duration: 24,
    fn: (t, out) => {
      const a = Math.PI * 0.5 + Math.sin(t * 0.04) * 0.25;
      const elev = 0.15 + Math.sin(t * 0.06) * 0.05;
      const dist = 100;
      out.pos.set(
        Math.cos(a) * dist * Math.cos(elev),
        Math.sin(elev) * dist,
        Math.sin(a) * dist * Math.cos(elev)
      );
      out.look.set(0, 0, 0);
      out.fov = 46;
    }
  }
];

let shotIdx = 0;
let shotTime = 0;
const camPos  = new THREE.Vector3(0, 40, 100);
const camLook = new THREE.Vector3(0, 0, 0);
const _tmp = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 48 };

function updateCamera(dt) {
  shotTime += dt;
  const shot = shots[shotIdx];
  if (shotTime > shot.duration) {
    shotTime = 0;
    shotIdx = (shotIdx + 1) % shots.length;
    document.getElementById("shotName").textContent = shots[shotIdx].name;
  }
  const s = shots[shotIdx];
  s.fn(shotTime, _tmp);

  // smooth follow
  camPos.lerp(_tmp.pos, 1 - Math.pow(0.001, dt));
  camLook.lerp(_tmp.look, 1 - Math.pow(0.002, dt));
  camera.position.copy(camPos);
  camera.up.set(0, 1, 0);
  camera.lookAt(camLook);
  if (Math.abs(camera.fov - _tmp.fov) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, _tmp.fov, 0.04);
    camera.updateProjectionMatrix();
  }
}

// ---------------------------------------------------------------------------
// HUD helpers
// ---------------------------------------------------------------------------
const distEl = document.getElementById("dist");
const fpsEl  = document.getElementById("fps");
const clockEl = document.getElementById("clock");
const timescaleEl = document.getElementById("timescale");
timescaleEl.textContent = SIM_SPEED + "×";

let frames = 0, lastFps = performance.now();

function updateClock() {
  const d = new Date();
  clockEl.textContent = "UTC " + d.toISOString().substr(11, 8);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
document.getElementById("shotName").textContent = shots[0].name;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1) * SIM_SPEED;

  // Saturn slow self-rotation
  saturn.rotation.y += dt * 0.08;

  updateCamera(dt);

  // HUD
  const dist = camera.position.length();
  distEl.textContent = (dist * 0.085).toFixed(1) + " Rₛ";

  frames++;
  const now = performance.now();
  if (now - lastFps >= 1000) {
    fpsEl.textContent = frames;
    frames = 0;
    lastFps = now;
    updateClock();
  }

  renderer.render(scene, camera);
}

animate();
console.log("Saturn Live simulation running");
