// Think Pink ball: a solid-gold basketball with the pink awareness ribbon tied
// on, in a halo of light, turning rays and twinkling sparks.
// The ribbon is wound round the ball: its loop circles the ball, the strands
// cross below it and the tails hang. The ball spins inside the loop; drag or
// flick to spin it, tap it to bounce it and throw off sparks. Built here from
// primitives, after the emblem drawn in icons.js.

import * as THREE from 'three';

const GOLD = '#FFC24A';
const PINK = '#FF5CA5';

// A studio built for gold: hard white softboxes and warm strips on black, so
// the metal shows sharp highlights and deep shadows (what reads as solid gold).
function goldStudio() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x140b04);
  const panel = (w, h, color, strength, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(5, 3.5, '#FFF1D6', 4.2, [-4, 4, 3]);
  panel(1.1, 7, '#FFE9C4', 5, [4.6, 0.5, 2]);
  panel(3.2, 0.45, '#FFF6E6', 6, [0, 4.6, -0.5]);
  panel(1.4, 6, '#FFB347', 3.2, [-4.6, -0.5, -3]);
  panel(7, 2.4, '#A8661C', 2.2, [0, -4.2, 2.5]);
  panel(9, 9, '#3A2208', 1, [0, 0, -6]);
  panel(2.2, 2.2, PINK, 3, [3.2, 3, -4]);
  return env;
}

// Basketball seams (dark grooves) and a gold rim glow, added to the metal.
const BALL_CHUNKS = {
  common: /* glsl */ `
    #include <common>
    varying vec3 vObj;
    float seamLine(float d, float w) { return 1.0 - smoothstep(w * 0.45, w, abs(d)); }
  `,
  color: /* glsl */ `
    #include <color_fragment>
    vec3 nn = normalize(vObj);
    float seam = 0.0;
    seam = max(seam, seamLine(nn.x, 0.03));
    seam = max(seam, seamLine(nn.y, 0.03));
    seam = max(seam, seamLine(abs(nn.x) - 0.7, 0.022));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.036, 0.01), seam);
  `,
  roughness: /* glsl */ `
    #include <roughnessmap_fragment>
    roughnessFactor = mix(roughnessFactor, 0.85, seam);
  `,
  metalness: /* glsl */ `
    #include <metalnessmap_fragment>
    metalnessFactor = mix(metalnessFactor, 0.0, seam);
  `,
  emissive: /* glsl */ `
    #include <emissivemap_fragment>
    float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
    totalEmissiveRadiance += vec3(1.0, 0.68, 0.24) * rim * uGlow * (1.0 - seam);
  `,
};

function ballMaterial(uniforms) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: GOLD,
    metalness: 1,
    roughness: 0.2,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `${BALL_CHUNKS.common}\nuniform float uGlow;`)
      .replace('#include <color_fragment>', BALL_CHUNKS.color)
      .replace('#include <roughnessmap_fragment>', BALL_CHUNKS.roughness)
      .replace('#include <metalnessmap_fragment>', BALL_CHUNKS.metalness)
      .replace('#include <emissivemap_fragment>', BALL_CHUNKS.emissive);
  };
  return mat;
}

// ---------- light: textures drawn once on small canvases

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Painted over the page (not added), so the gold reads on any background.
const haloTexture = () =>
  canvasTexture(256, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255, 226, 150, 0.95)');
    grad.addColorStop(0.46, 'rgba(255, 196, 80, 0.85)');
    grad.addColorStop(0.56, 'rgba(240, 160, 40, 0.5)');
    grad.addColorStop(0.76, 'rgba(170, 90, 12, 0.18)');
    grad.addColorStop(1, 'rgba(90, 40, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });

// Thin rays of different lengths around a soft centre.
const raysTexture = (count, seed) =>
  canvasTexture(512, (g, s) => {
    let r = seed;
    const rand = () => {
      r = (r * 16807) % 2147483647;
      return r / 2147483647;
    };
    g.translate(s / 2, s / 2);
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.2;
      const len = (0.45 + rand() * 0.55) * (s / 2);
      const w = 0.012 + rand() * 0.03;
      const grad = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, 'rgba(255, 222, 140, 0.95)');
      grad.addColorStop(0.5, 'rgba(255, 180, 60, 0.45)');
      grad.addColorStop(1, 'rgba(230, 140, 30, 0)');
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len);
      g.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len);
      g.closePath();
      g.fill();
    }
  });

// A four-point star for the sparks.
const sparkTexture = () =>
  canvasTexture(128, (g, s) => {
    const c = s / 2;
    const glow = g.createRadialGradient(c, c, 0, c, c, c * 0.5);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.3, 'rgba(255, 225, 150, 0.6)');
    glow.addColorStop(1, 'rgba(255, 180, 60, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, s, s);
    for (const [w, h] of [[s, s * 0.06], [s * 0.06, s]]) {
      const grad = w > h ? g.createLinearGradient(0, 0, s, 0) : g.createLinearGradient(0, 0, 0, s);
      grad.addColorStop(0, 'rgba(255, 220, 140, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 220, 140, 0)');
      g.fillStyle = grad;
      g.fillRect(c - w / 2, c - h / 2, w, h);
    }
  });

const SPARK_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uBurst;
  uniform float uPx;
  varying float vA;
  void main() {
    float tw = pow(max(0.0, sin(uTime * (1.2 + aPhase) + aPhase * 6.2831)), 8.0);
    float a = clamp(tw + uBurst, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(position * (1.0 + uBurst * 0.35), 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPx * aSize * (0.25 + 0.75 * a) / -mv.z;
    vA = a;
  }
`;
const SPARK_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vA;
  void main() {
    vec4 c = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(c.rgb * c.a * vA * 1.6, 0.0);
  }
`;

// ---------- the Think Pink ribbon, wound round the ball
// Its loop circles the ball on a tilted orbit (in front of the ball on the
// left, behind it on the right); the two strands cross below the ball, as in
// the awareness ribbon, and the tails hang down.
const RING_R = 1.14;

function ribbonPath() {
  const axis = new THREE.Vector3(0.45, 0.18, 0.87).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  const e1 = down.clone().addScaledVector(axis, -down.dot(axis)).normalize(); // lowest point of the ring
  const e2 = new THREE.Vector3().crossVectors(axis, e1).normalize(); // toward the right
  const ring = (a) => e1.clone().multiplyScalar(Math.cos(a) * RING_R).addScaledVector(e2, Math.sin(a) * RING_R);
  const low = ring(0);
  const cross = new THREE.Vector3(0, low.y - 0.27, low.z + 0.12);
  const at = (dx, dy, dz) => cross.clone().add(new THREE.Vector3(dx, dy, dz));
  const join = 0.62; // how far round from the bottom the strands meet the ring
  const pts = [at(-0.36, -0.52, -0.06), at(-0.18, -0.26, -0.05), at(0, 0, -0.045)];
  for (let i = 0; i <= 32; i += 1) pts.push(ring(join + ((Math.PI * 2 - 2 * join) * i) / 32));
  pts.push(at(0, 0, 0.045), at(0.18, -0.26, 0.065), at(0.36, -0.52, 0.085));
  return { pts, axis, e1, e2, crossY: cross.y };
}

// Sweep a flat band with real thickness along the path. On the ring the band
// twists gently as it goes round, so the satin catches the light; the tails
// turn to face the viewer. aHang (0 to 1) marks how freely each part hangs.
function ribbonGeometry({ pts, axis, e1, e2, crossY }, width = 0.185, thick = 0.032) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const N = 260;
  const facing = new THREE.Vector3(0, 0.15, 1).normalize();
  const pos = [];
  const hang = [];
  const idx = [];
  const tan = new THREE.Vector3();
  const n = new THREE.Vector3();
  const side = new THREE.Vector3();
  const inPlane = new THREE.Vector3();
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
  for (let i = 0; i <= N; i += 1) {
    const u = i / N;
    const p = curve.getPointAt(u);
    curve.getTangentAt(u, tan);
    // Near the ring: face along the ring's axis, twisting as it goes round.
    inPlane.copy(p).addScaledVector(axis, -p.dot(axis));
    const off = Math.hypot(inPlane.length() - RING_R, p.dot(axis));
    const onRing = 1 - THREE.MathUtils.smoothstep(off, 0.03, 0.22);
    const a = Math.atan2(p.dot(e2), p.dot(e1));
    const twist = 0.55 * Math.sin(2 * a + 0.6);
    const ringN = axis.clone().multiplyScalar(Math.cos(twist)).addScaledVector(inPlane.normalize(), Math.sin(twist));
    n.copy(facing).lerp(ringN, onRing).normalize();
    side.crossVectors(tan, n).normalize();
    n.crossVectors(side, tan).normalize();
    const w = side.clone().multiplyScalar(width / 2);
    const h = n.clone().multiplyScalar(thick / 2);
    // The tail ends are cut at a slant.
    const cutL = i === 0 ? tan.clone().multiplyScalar(0.06) : new THREE.Vector3();
    const cutR = i === N ? tan.clone().multiplyScalar(-0.06) : new THREE.Vector3();
    const TL = p.clone().add(w).add(h).add(cutL);
    const TR = p.clone().sub(w).add(h).add(cutR);
    const BR = p.clone().sub(w).sub(h).add(cutR);
    const BL = p.clone().add(w).sub(h).add(cutL);
    // Eight vertices per step so each face keeps its own crisp normals.
    for (const v of [TL, TR, TR, BR, BR, BL, BL, TL]) pos.push(v.x, v.y, v.z);
    const k = THREE.MathUtils.smoothstep(p.y, crossY, crossY - 0.52);
    for (let j = 0; j < 8; j += 1) hang.push(k);
    if (i < N) {
      const s0 = i * 8;
      const s1 = s0 + 8;
      for (let f = 0; f < 8; f += 2) quad(s0 + f, s1 + f, s1 + f + 1, s0 + f + 1);
    }
  }
  // Caps on the two tail ends.
  for (const i of [0, N]) {
    const b = pos.length / 3;
    const s0 = i * 8;
    for (const j of [0, 1, 3, 5]) pos.push(pos[(s0 + j) * 3], pos[(s0 + j) * 3 + 1], pos[(s0 + j) * 3 + 2]);
    for (let j = 0; j < 4; j += 1) hang.push(hang[s0]);
    quad(b, b + 1, b + 2, b + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aHang', new THREE.Float32BufferAttribute(hang, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ---------- mount

export function mountBall(host, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = goldStudio();
  const envRT = pmrem.fromScene(studio, 0.03);
  scene.environment = envRT.texture;
  studio.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });

  const key = new THREE.DirectionalLight('#FFF3DC', 2.6);
  key.position.set(-2.5, 3, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 1, far: 9 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  const pinkLight = new THREE.PointLight(PINK, 6, 0, 2);
  pinkLight.position.set(2.6, -1.8, 2.2);
  scene.add(key, pinkLight);

  const U = { uGlow: { value: 1.1 } };
  const rig = new THREE.Group();
  scene.add(rig);

  // Light behind the ball: a halo and two layers of rays turning opposite ways.
  const haloTex = haloTexture();
  const additive = (map, opacity, boost = 1) =>
    new THREE.SpriteMaterial({
      map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
      color: new THREE.Color(boost, boost, boost),
    });
  const painted = (map, opacity) =>
    new THREE.SpriteMaterial({ map, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const halo = new THREE.Sprite(painted(haloTex, 1));
  halo.scale.setScalar(4.3);
  halo.position.z = -1.2;
  const raysA = new THREE.Sprite(painted(raysTexture(30, 7), 0.85));
  raysA.scale.setScalar(4.2);
  raysA.position.z = -1.4;
  const raysB = new THREE.Sprite(painted(raysTexture(20, 31), 0.6));
  raysB.scale.setScalar(3.7);
  raysB.position.z = -1.3;
  rig.add(raysA, raysB, halo);

  // The ball spins inside the ribbon's loop; the light around them stays put.
  const turn = new THREE.Group();
  turn.rotation.order = 'YXZ';
  rig.add(turn);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), ballMaterial(U));
  ball.rotation.set(0.35, -0.6, 0.12);
  ball.receiveShadow = true;
  turn.add(ball);

  // Sparks on a shell around the ball, and a thin ring of gold dust.
  const sparkMap = sparkTexture();
  // Star glints on the highlights. On a sphere the reflection of a light sits
  // at the half-way vector between light and camera, however the ball spins.
  const view = new THREE.Vector3(0, 0, 1);
  const glints = [[-4, 4, 3, 1.25], [4.6, 0.5, 2, 0.8], [0, 4.6, -0.5, 0.6]].map(([x, y, z, size], i) => {
    const n = new THREE.Vector3(x, y, z).normalize().add(view).normalize();
    const g = new THREE.Sprite(additive(sparkMap, 1, 2));
    g.position.copy(n).multiplyScalar(1.03);
    g.scale.setScalar(size);
    g.userData = { size, phase: i * 1.7 };
    rig.add(g);
    return g;
  });
  const S = { uTime: { value: 0 }, uBurst: { value: 0 }, uPx: { value: 90 * renderer.getPixelRatio() }, uMap: { value: sparkMap } };
  const sparkMat = new THREE.ShaderMaterial({
    uniforms: S, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const sparkGeo = new THREE.BufferGeometry();
  const SPARKS = 46;
  const sp = new Float32Array(SPARKS * 3);
  const ph = new Float32Array(SPARKS);
  const sz = new Float32Array(SPARKS);
  const dir = new THREE.Vector3();
  for (let i = 0; i < SPARKS; i += 1) {
    dir.randomDirection().multiplyScalar(1.12 + Math.random() * 0.9);
    sp.set([dir.x, dir.y * 0.9, dir.z], i * 3);
    ph[i] = Math.random();
    sz[i] = 0.5 + Math.random() * 1.1;
  }
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sparkGeo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  sparkGeo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  rig.add(sparks);

  const DUST = 520;
  const dust = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.42 + (Math.random() - 0.5) * 0.12;
    dust.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.03, Math.sin(a) * r], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const ring = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: new THREE.Color('#FFD27A').multiplyScalar(2.6), size: 0.026, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ring.rotation.set(0.42, 0, 0.28);
  rig.add(ring);

  // The ribbon, wound round the ball; its tails flutter.
  const RT = { uTime: { value: 0 } };
  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: '#EE3A8C', roughness: 0.36, sheen: 0.9, sheenRoughness: 0.35, sheenColor: '#FFB0D6',
    envMapIntensity: 0.6, side: THREE.DoubleSide,
  });
  ribbonMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = RT.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHang;\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.x += sin(uTime * 2.1 + position.y * 4.0) * 0.045 * aHang;
        transformed.z += cos(uTime * 1.6 + position.y * 3.0) * 0.06 * aHang;`);
  };
  const ribbon = new THREE.Mesh(ribbonGeometry(ribbonPath()), ribbonMat);
  ribbon.castShadow = true;
  rig.add(ribbon);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, -0.08, 8.2);
  camera.lookAt(0, -0.1, 0);

  function resize() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    S.uPx.value = 90 * renderer.getPixelRatio() * (h / 260);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // ---------- input: drag or flick to spin the ball; tap to bounce it.
  const idleSpin = reduced ? 0 : 0.5;
  const spin = new THREE.Vector2(0, idleSpin); // radians per second about x and y
  const X = new THREE.Vector3(1, 0, 0);
  const Y = new THREE.Vector3(0, 1, 0);
  const drag = { on: false, id: -1, x: 0, y: 0, t: 0, moved: 0 };
  let bounceAt = -10;

  const onDown = (e) => {
    drag.on = true;
    drag.id = e.pointerId;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = performance.now();
    drag.moved = 0;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer is already gone */
    }
    host.classList.add('is-grabbing');
  };
  const onMove = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return;
    const now = performance.now();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const dt = Math.max(8, now - drag.t) / 1000;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    turn.rotateOnWorldAxis(Y, dx * 0.012);
    turn.rotateOnWorldAxis(X, dy * 0.012);
    spin.set((dy * 0.012) / dt, (dx * 0.012) / dt).clampLength(0, 14);
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = now;
  };
  const onUp = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.on = false;
    host.classList.remove('is-grabbing');
    if (drag.moved < 6) bounceAt = clock.getElapsedTime();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // ---------- loop: only while on screen
  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;
  let last = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last);
    last = t;
    const still = reduced ? 0 : 1;
    if (!drag.on) {
      turn.rotateOnWorldAxis(X, spin.x * dt);
      turn.rotateOnWorldAxis(Y, spin.y * dt);
      spin.x += (0 - spin.x) * Math.min(1, dt * 2.2);
      spin.y += (idleSpin - spin.y) * Math.min(1, dt * 1.6);
    }
    // The ribbon's loop rocks slowly round the ball.
    ribbon.rotation.set(0.05 * Math.sin(t * 0.5) * still, 0.16 * Math.sin(t * 0.43) * still, 0.04 * Math.sin(t * 0.61) * still);
    RT.uTime.value = t * still;
    // The light breathes and the rays turn; a fast spin makes it flare.
    const flare = Math.min(1, Math.abs(spin.y - idleSpin) * 0.15 + Math.abs(spin.x) * 0.15);
    halo.material.opacity = Math.min(1, 0.85 + 0.15 * Math.sin(t * 1.6) * still + 0.3 * flare);
    raysA.material.rotation = t * 0.12 * still;
    raysB.material.rotation = -t * 0.08 * still;
    raysA.material.opacity = Math.min(1, 0.7 + 0.2 * Math.sin(t * 0.9) * still + 0.3 * flare);
    for (const g of glints) {
      const tw = 0.75 + 0.25 * Math.sin(t * 2.3 + g.userData.phase) * still;
      g.scale.setScalar(g.userData.size * (tw + S.uBurst.value * 0.6));
      g.material.rotation = 0.2 * Math.sin(t * 0.7 + g.userData.phase) * still;
    }
    U.uGlow.value = 1 + 0.3 * Math.sin(t * 1.6) * still + 0.6 * flare;
    ring.rotation.y = t * 0.5 * still;
    sparks.rotation.y = t * 0.15 * still;
    S.uTime.value = t;
    // Tap: one dribble, squashing a little at the bottom, with a burst of sparks.
    const b = t - bounceAt;
    if (b >= 0 && b < 0.9) {
      const k = b / 0.9;
      const h = reduced ? 0 : Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k);
      rig.position.y = -h * 0.32;
      const squash = reduced ? 0 : Math.max(0, 0.1 - h) * 0.9;
      turn.scale.set(1 + squash, 1 - squash, 1 + squash);
      S.uBurst.value = 1 - k;
    } else {
      rig.position.y = 0;
      turn.scale.set(1, 1, 1);
      S.uBurst.value = 0;
    }
    renderer.render(scene, camera);
  }
  const start = () => {
    if (!raf && visible && !document.hidden) {
      last = clock.getElapsedTime();
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  io.observe(host);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  renderer.render(scene, camera);
  start();

  return function dispose() {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    scene.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material ?? [])) {
        m.map?.dispose();
        m.dispose();
      }
    });
    sparkMap.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
