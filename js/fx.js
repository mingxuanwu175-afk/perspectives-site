// Page changes: the page burns away into light and particles, starting where
// it was clicked; a signal readout flashes up; the next page materialises out
// of the particles. Raw WebGL2 (no three.js), so every page can use it.
//
// Technique after Codrops, "Implementing a Dissolve Effect with Shaders and
// Particles in Three.js" (2025): a noise threshold with a glowing front, and
// particles born where the front passes. Rewritten here for a full-screen
// overlay.

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
// 0 where the change starts, about 1 at the far corner, broken up by noise.
float field(vec2 uv, vec2 origin, float aspect, float seed) {
  vec2 d = (uv - origin) * vec2(aspect, 1.0);
  vec2 far = vec2(max(origin.x, 1.0 - origin.x) * aspect, max(origin.y, 1.0 - origin.y));
  return mix(length(d) / length(far), fbm(uv * vec2(aspect, 1.0) * 3.4 + seed), 0.4);
}
`;

const QUAD_VS = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const QUAD_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uT;       // where the front is (0 to about 1.1)
uniform float uReveal;  // 0: the void spreads; 1: it recedes
uniform vec2 uOrigin;
uniform float uAspect;
uniform float uTime;
uniform float uSeed;
uniform vec3 uTone;
uniform float uLight;   // 1: the void is light (coming out of the cover's flash)
uniform vec2 uRes;
${NOISE}
void main() {
  float f = field(vUv, uOrigin, uAspect, uSeed);
  float d = uReveal < 0.5 ? uT - f : f - uT;
  float inside = smoothstep(0.0, 0.006, d);
  float front = exp(-pow(d / 0.012, 2.0));
  float ember = exp(-pow(max(d, 0.0) / 0.05, 2.0)) * step(0.0, d);

  // The void: a tunnel of rings and spokes rushing past, as if flying
  // forward; scanlines and a vignette on top.
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r = length(p);
  float depth = 1.2 / (r + 0.05) + uTime * 3.0;
  float fr = fract(depth);
  float ring = smoothstep(0.07, 0.0, min(fr, 1.0 - fr));
  float s = fract(atan(p.y, p.x) / 6.28318 * 28.0);
  float spoke = smoothstep(0.05, 0.0, min(s, 1.0 - s));
  float vig = smoothstep(1.1, 0.15, r);
  float tunnel = max(ring, spoke * 0.55) * smoothstep(0.02, 0.35, r) * vig;
  float scan = 0.88 + 0.12 * sin(vUv.y * uRes.y * 1.4);
  vec3 dark = vec3(0.01, 0.012, 0.02) + uTone * (0.03 + 0.4 * tunnel);
  vec3 light = mix(mix(uTone, vec3(1.0), 0.55), vec3(1.0), smoothstep(0.95, 0.1, r)) - uTone * 0.12 * tunnel;
  vec3 voidCol = mix(dark * scan, light, uLight);
  voidCol += (hash(vUv * uRes + uTime) - 0.5) * 0.03;

  vec3 hot = mix(uTone, vec3(1.0), 0.65);
  vec3 glow = uTone * 1.6 * ember + hot * 2.4 * front;
  float a = clamp(inside + front * 0.8, 0.0, 1.0);
  // Premultiplied: the glow is added on top of whatever is underneath.
  outColor = vec4(voidCol * inside + glow, a);
}
`;

const DOTS_VS = /* glsl */ `#version 300 es
in vec3 aSeed;          // screen position (0 to 1) and a random number
uniform float uT;
uniform vec2 uOrigin;
uniform float uAspect;
uniform float uTime;
uniform float uSeed;
uniform float uPx;
out float vLife;
out float vHeat;
${NOISE}
void main() {
  vec2 uv = aSeed.xy;
  float f = field(uv, uOrigin, uAspect, uSeed);
  float age = uT - f;                     // born when the front passes
  float life = 0.14 + 0.24 * aSeed.z;
  if (age < 0.0 || age > life) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vLife = 0.0; vHeat = 0.0; return; }
  float k = age / life;
  vec2 away = normalize((uv - uOrigin) * vec2(uAspect, 1.0) + vec2(1e-4));
  vec2 drift = away * (0.05 + 0.22 * aSeed.z) * k + vec2(0.0, 0.1) * k * k;
  drift += (vec2(noise(uv * 9.0 + uTime), noise(uv * 9.0 - uTime + 7.0)) - 0.5) * 0.06 * k;
  // Rising off the page toward the viewer: the particles spread out and grow.
  float zoom = 1.0 + 1.4 * k * aSeed.z;
  vec2 pos = uv + drift / vec2(uAspect, 1.0);
  pos = (pos - 0.5) * zoom + 0.5;
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uPx * (1.2 + 5.0 * aSeed.z * aSeed.z) * zoom * (1.0 - 0.5 * k);
  vLife = 1.0 - k;
  vHeat = 1.0 - smoothstep(0.0, 0.45, k);
}
`;

const DOTS_FS = /* glsl */ `#version 300 es
precision highp float;
in float vLife;
in float vHeat;
out vec4 outColor;
uniform vec3 uTone;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  core *= core;
  vec3 col = mix(uTone, vec3(1.0), 0.25 + 0.6 * vHeat) * core * vLife * 1.8;
  outColor = vec4(col, 0.0);
}
`;

let gl = null;
let canvas = null;
let hud = null;
let progs = null;
let dotCount = 0;
let failed = false;

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function program(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i += 1) {
    const { name } = gl.getActiveUniform(p, i);
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { p, u: uniforms };
}

function setup() {
  if (gl || failed) return Boolean(gl);
  try {
    canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    progs = { quad: program(QUAD_VS, QUAD_FS), dots: program(DOTS_VS, DOTS_FS) };

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    progs.quad.vao = gl.createVertexArray();
    gl.bindVertexArray(progs.quad.vao);
    const qLoc = gl.getAttribLocation(progs.quad.p, 'aPos');
    gl.enableVertexAttribArray(qLoc);
    gl.vertexAttribPointer(qLoc, 2, gl.FLOAT, false, 0, 0);

    dotCount = Math.min(window.innerWidth, window.innerHeight) < 700 ? 3500 : 7000;
    const seeds = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount * 3; i += 1) seeds[i] = Math.random();
    const dots = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dots);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    progs.dots.vao = gl.createVertexArray();
    gl.bindVertexArray(progs.dots.vao);
    const dLoc = gl.getAttribLocation(progs.dots.p, 'aSeed');
    gl.enableVertexAttribArray(dLoc);
    gl.vertexAttribPointer(dLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    hud = document.createElement('div');
    hud.className = 'fx-hud';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<span class="fx-k"></span><span class="fx-t"></span><i class="fx-bar"></i>';
    document.body.append(canvas, hud);
    return true;
  } catch (err) {
    console.warn('Page transition effect unavailable:', err);
    failed = true;
    gl = null;
    canvas?.remove();
    return false;
  }
}

export const available = () => setup();

const easeIn = (x) => x * x;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);

function size() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.round(window.innerWidth * dpr);
  const h = Math.round(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  return { w, h, dpr };
}

function draw({ t, reveal, origin, tone, light, time, seed }) {
  const { w, h, dpr } = size();
  const aspect = w / h;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);

  gl.useProgram(progs.quad.p);
  const q = progs.quad.u;
  gl.uniform1f(q.uT, t);
  gl.uniform1f(q.uReveal, reveal ? 1 : 0);
  gl.uniform2f(q.uOrigin, origin[0], origin[1]);
  gl.uniform1f(q.uAspect, aspect);
  gl.uniform1f(q.uTime, time);
  gl.uniform1f(q.uSeed, seed);
  gl.uniform3f(q.uTone, ...tone);
  gl.uniform1f(q.uLight, light ? 1 : 0);
  gl.uniform2f(q.uRes, w, h);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindVertexArray(progs.quad.vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.useProgram(progs.dots.p);
  const d = progs.dots.u;
  gl.uniform1f(d.uT, t);
  gl.uniform2f(d.uOrigin, origin[0], origin[1]);
  gl.uniform1f(d.uAspect, aspect);
  gl.uniform1f(d.uTime, time);
  gl.uniform1f(d.uSeed, seed);
  gl.uniform1f(d.uPx, 2.2 * dpr);
  gl.uniform3f(d.uTone, ...tone);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindVertexArray(progs.dots.vao);
  gl.drawArrays(gl.POINTS, 0, dotCount);
  gl.bindVertexArray(null);
}

function run(duration, frame) {
  duration *= window.__fxSlow || 1; // QA only: slow the effect down to inspect it
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration);
      frame(k, (now - start) / 1000);
      if (k < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

let seed = 0;
let clock = 0;
let current = null;

// The page is swallowed by the void, from `origin` (client pixels) outward.
export function cover({ origin, tone = '#3B82F6' } = {}) {
  if (!setup()) return Promise.resolve();
  seed = Math.random() * 50;
  const o = origin ? [origin.x / window.innerWidth, 1 - origin.y / window.innerHeight] : [0.5, 0.5];
  current = { origin: o, tone: hex(tone) };
  hud.style.setProperty('--fx-tone', tone);
  hud.classList.remove('is-light');
  canvas.classList.add('is-on');
  return run(620, (k, s) => {
    clock = s;
    draw({ t: 0.02 + easeIn(k) * 1.15, reveal: false, origin: o, tone: current.tone, light: false, time: s, seed });
  });
}

// Cover the screen at once (the cover's flash hands over to this).
export function fill({ tone = '#3B82F6', light = false } = {}) {
  if (!setup()) return;
  seed = Math.random() * 50;
  current = { origin: [0.5, 0.5], tone: hex(tone) };
  hud.style.setProperty('--fx-tone', tone);
  hud.classList.toggle('is-light', light);
  canvas.classList.add('is-on');
  draw({ t: 2, reveal: false, origin: current.origin, tone: current.tone, light, time: 0, seed });
}

// While the screen is covered: the name of the page being opened decodes in.
export function signal(label, title) {
  if (!hud || !canvas.classList.contains('is-on')) return Promise.resolve();
  const [k, tEl] = hud.children;
  k.textContent = label;
  hud.classList.add('is-on');
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>+=';
  const chars = [...title];
  return run(260, (p) => {
    tEl.textContent = chars
      .map((c, i) => (c === ' ' || p * chars.length * 1.6 > i + 2 ? c : glyphs[(Math.random() * glyphs.length) | 0]))
      .join('');
  });
}

// The void recedes and the new page comes out of it. `light` starts from a
// bright void (after the cover's flash) instead of a dark one.
export function reveal({ origin, tone, light = false } = {}) {
  if (!gl) return Promise.resolve();
  const o = origin ? [origin.x / window.innerWidth, 1 - origin.y / window.innerHeight] : current?.origin ?? [0.5, 0.5];
  const col = tone ? hex(tone) : current?.tone ?? hex('#3B82F6');
  if (light) seed = Math.random() * 50;
  canvas.classList.add('is-on');
  hud.classList.remove('is-on');
  const base = clock;
  return run(light ? 900 : 700, (k, s) => {
    draw({ t: -0.05 + easeOut(k) * 1.2, reveal: true, origin: o, tone: col, light, time: base + s, seed });
  }).then(() => {
    canvas.classList.remove('is-on');
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  });
}
