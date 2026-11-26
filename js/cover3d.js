// Home cover: an android bust made of light, particles and an X-ray layer.
//
// Techniques follow published tutorials, rewritten here rather than copied:
// - particles sampled on the model surface (MeshSurfaceSampler) that the
//   cursor pushes away: Codrops "Crafting a Dreamy Particle Effect with
//   Three.js and GPGPU" and "Interactive Particles with Three.js"
// - a cursor-trail mask that reveals a second, hologram scene:
//   Codrops "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js"
// - fresnel + scanline hologram shading: Anderson Mancini's MIT
//   HolographicMaterial and its YouTube tutorial
// - glow with UnrealBloomPass: three.js examples (MIT)
// Geometry: "Infinite, 3D Head Scan" by Lee Perry-Smith, CC BY 3.0, served
// from the three.js repository through jsDelivr.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';
const ACCENT = '#3B82F6';

// Feature positions once the bust is normalised to 2 units tall, centred,
// facing +z (measured from the scan): eyes y≈0.44 x≈±0.2, ears x≈±0.45
// y≈0.35, chin y≈-0.07, neck down to y≈-0.53, shoulders below.
const VISOR_Y = 0.448;
const EAR = { x: 0.455, y: 0.35, z: -0.01 };
const HEAD_CENTRE = new THREE.Vector3(0, 0.46, 0.04);

// ---------------------------------------------------------------- shell

const SHELL_CHUNKS = {
  common: /* glsl */ `
    #include <common>
    varying vec3 vObj;
    uniform float uScanY;
    uniform float uSpot;
    uniform float uGlow;
    uniform float uPulseY;
    uniform float uDive;
    uniform float uFlood;
    uniform vec3 uAccent;
    float seamLine(float d, float w) { return 1.0 - smoothstep(w * 0.35, w, abs(d)); }
  `,
  masks: /* glsl */ `
    #include <clipping_planes_fragment>
    float ang = atan(vObj.x, vObj.z);
    float rad = length(vObj.xz);
    float headZone = step(-0.1, vObj.y);
    float vy = vObj.y - (${VISOR_Y} - 0.05 * ang * ang);
    float visor = (1.0 - smoothstep(0.074, 0.081, abs(vy))) * (1.0 - smoothstep(1.0, 1.07, abs(ang))) * headZone;
    float neck = (1.0 - step(-0.1, vObj.y)) * step(-0.53, vObj.y) * (1.0 - smoothstep(0.37, 0.41, rad));
    float ringD = abs(fract((vObj.y + 0.1) / 0.075 + 0.5) - 0.5) * 0.075;
    float seam = 0.0;
    seam = max(seam, seamLine(vObj.y - (0.665 - 0.035 * ang * ang), 0.0065) * step(0.12, rad));
    seam = max(seam, seamLine(vObj.x, 0.0065) * step(0.665, vObj.y));
    seam = max(seam, seamLine((abs(ang) - 1.14) * rad, 0.0065) * step(0.12, vObj.y) * (1.0 - step(0.64, vObj.y)));
    seam = max(seam, seamLine(vObj.y - (0.25 - 0.64 * vObj.z), 0.0065) * step(-0.05, vObj.z) * step(abs(vObj.x), 0.43) * headZone);
    seam = max(seam, seamLine(ringD, 0.006) * neck);
    seam = max(seam, seamLine(vObj.y + 0.535, 0.0075));
    seam = max(seam, seamLine(vObj.x, 0.0065) * (1.0 - step(-0.56, vObj.y)));
    seam = max(seam, seamLine(abs(vObj.x) - 0.62, 0.0065) * (1.0 - step(-0.5, vObj.y)));
    seam *= 1.0 - visor;
    if (vObj.y < uScanY) discard;
  `,
  color: /* glsl */ `
    #include <color_fragment>
    vec3 shellCol = diffuseColor.rgb;
    shellCol = mix(shellCol, vec3(0.011, 0.014, 0.019), neck);
    shellCol = mix(shellCol, vec3(0.0012, 0.0016, 0.003), visor);
    shellCol = mix(shellCol, shellCol * 0.07, seam);
    diffuseColor.rgb = shellCol;
  `,
  surface: /* glsl */ `
    #include <metalnessmap_fragment>
    roughnessFactor = mix(roughnessFactor, 0.3, neck);
    roughnessFactor = mix(roughnessFactor, 0.06, visor);
    roughnessFactor = mix(roughnessFactor, 0.85, seam);
    metalnessFactor = mix(metalnessFactor, 0.9, neck);
    metalnessFactor = mix(metalnessFactor, 0.25, visor);
  `,
  emissive: /* glsl */ `
    #include <emissivemap_fragment>
    // Scroll-in: the light bar stays a crisp line, then opens up and floods the visor.
    float bar = 1.0 - smoothstep(0.004 + 0.06 * uFlood, 0.012 + 0.08 * uFlood, abs(vy));
    float spot = exp(-pow((ang - uSpot) * 5.0, 2.0)) * (1.0 - uDive);
    vec3 glow = uAccent * (1.1 * bar + 18.0 * bar * spot + 1.5 * bar * uDive) * visor * uGlow;
    glow += uAccent * visor * uFlood * uFlood * 8.0;
    float ringGlow = seamLine(abs(fract((vObj.y + 0.1) / 0.15 + 0.5) - 0.5) * 0.15, 0.004) * neck;
    glow += uAccent * ringGlow * 9.0 * uGlow;
    float fres = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
    glow += uAccent * fres * 0.5 * (1.0 - visor) * uGlow;
    float edge = 1.0 - smoothstep(0.0, 0.06, vObj.y - uScanY);
    glow += uAccent * edge * 14.0 * step(uScanY, 1.05);
    float pulse = exp(-pow((vObj.y - uPulseY) * 14.0, 2.0));
    glow += uAccent * pulse * 8.0;
    totalEmissiveRadiance += glow;
  `,
  clearcoat: /* glsl */ `
    #include <lights_physical_fragment>
    #ifdef USE_CLEARCOAT
      material.clearcoat *= (1.0 - seam) * (1.0 - 0.6 * neck);
    #endif
  `,
};

function shellMaterial(U) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#DCE1E8'),
    roughness: 0.34,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', SHELL_CHUNKS.common)
      .replace('#include <clipping_planes_fragment>', SHELL_CHUNKS.masks)
      .replace('#include <color_fragment>', SHELL_CHUNKS.color)
      .replace('#include <metalnessmap_fragment>', SHELL_CHUNKS.surface)
      .replace('#include <emissivemap_fragment>', SHELL_CHUNKS.emissive)
      .replace('#include <lights_physical_fragment>', SHELL_CHUNKS.clearcoat);
  };
  return mat;
}

// A dark studio for reflections: a big white softbox upper left, blue strips
// behind, a faint bounce below. Highlights stay crisp and shadow sides dark.
function studioScene() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x020306);
  const panel = (w, h, color, strength, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(6, 4, '#ffffff', 8, [-5, 4.5, 3.5]);
  panel(1.4, 9, ACCENT, 16, [5, 1, -4]);
  panel(1.4, 9, ACCENT, 8, [-5.5, 0, -3.5]);
  panel(9, 2, '#ffffff', 0.9, [0, -4.5, 4]);
  panel(3, 2.4, '#E2E8F0', 1.6, [3.5, 2, 6]);
  return env;
}

function earModule(side, shell) {
  const group = new THREE.Group();
  group.position.set(side * EAR.x, EAR.y, EAR.z);
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.142, 0.085, 72), shell);
  housing.rotation.z = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.094, 0.094, 0.012, 72),
    new THREE.MeshPhysicalMaterial({ color: '#0B0D12', roughness: 0.22, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.05 }),
  );
  face.rotation.z = Math.PI / 2;
  face.position.x = side * 0.044;
  const lit = new THREE.MeshStandardMaterial({ color: '#0A1020', emissive: ACCENT, emissiveIntensity: 10 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.006, 16, 96), lit);
  ring.rotation.y = Math.PI / 2;
  ring.position.x = side * 0.051;
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.129, 0.0035, 12, 128), lit);
  edge.rotation.y = Math.PI / 2;
  edge.position.x = side * 0.043;
  group.add(housing, face, ring, edge);
  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

// ---------------------------------------------------------------- particles

const DOTS_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform vec3 uRayO;
  uniform vec3 uRayD;
  uniform float uPush;
  uniform float uPulse;
  uniform float uDive;
  uniform float uSize;
  uniform float uLift;
  attribute vec3 aNormal;
  attribute vec3 aStart;
  attribute float aSeed;
  varying float vAlpha;
  varying float vHot;
  void main() {
    float t = clamp((uAssemble - aSeed * 0.4) / 0.6, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    float breathe = 0.5 + 0.5 * sin(uTime * 1.4 + aSeed * 57.0);
    vec3 target = position + aNormal * (uLift + 0.016 * breathe);
    vec3 p = mix(aStart, target, t);
    // Push away from the cursor ray.
    vec3 w = p - uRayO;
    vec3 closest = uRayO + uRayD * dot(w, uRayD);
    vec3 away = p - closest;
    float d = length(away);
    float hot = uPush * (1.0 - smoothstep(0.0, 0.26, d));
    p += (away / max(d, 1e-4)) * hot * 0.17 + aNormal * hot * 0.08;
    // Click pulse: burst outward, then settle.
    p += aNormal * uPulse * (0.1 + 0.32 * aSeed);
    // Scroll-in: particles lift off and drift past the camera, fading as they near it.
    p += aNormal * uDive * (0.04 + 0.36 * aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * (0.55 + aSeed) / -mv.z, 44.0);
    vAlpha = t * smoothstep(0.22, 0.9, -mv.z) * (1.0 - 0.9 * uDive);
    vHot = hot;
  }
`;

const DOTS_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vHot;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColor, uHot, clamp(vHot * 1.6, 0.0, 1.0)) * (0.6 + 3.0 * core * core) * (1.0 + 4.0 * vHot);
    gl_FragColor = vec4(col, core * vAlpha * (uOpacity + vHot * 0.9));
  }
`;

function dotsMaterial(shared, { color, hot, opacity, lift }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(color) },
      uHot: { value: new THREE.Color(hot) },
      uOpacity: { value: opacity },
      uLift: { value: lift },
    },
    vertexShader: DOTS_VERT,
    fragmentShader: DOTS_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ---------------------------------------------------------------- hologram (X-ray scene)

const HOLO_VERT = /* glsl */ `
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  void main() {
    vObj = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewV))), 2.2);
    float lines = smoothstep(0.32, 0.5, abs(fract(vObj.y * 55.0 - uTime * 0.6) - 0.5));
    float sweepY = 1.2 - mod(uTime * 0.45, 2.6);
    float sweep = exp(-pow((vObj.y - sweepY) * 8.0, 2.0));
    float flicker = 0.92 + 0.08 * sin(uTime * 37.0 + vObj.y * 9.0);
    float a = ((0.06 + 0.94 * fres) * (0.5 + 0.5 * lines) + sweep * 0.45) * flicker;
    gl_FragColor = vec4(uColor * (0.5 + 5.0 * fres + sweep * 5.0), a);
  }
`;

const GRID_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  float gline(float v, float w) { float f = abs(fract(v + 0.5) - 0.5); return 1.0 - smoothstep(w * 0.5, w, f); }
  void main() {
    vec2 g = vUv * vec2(48.0, 32.0);
    vec2 G = vUv * vec2(8.0, 16.0 / 3.0);
    float fine = max(gline(g.x, 0.06), gline(g.y, 0.06));
    float bold = max(gline(G.x, 0.02), gline(G.y, 0.02));
    float fade = smoothstep(0.62, 0.1, length((vUv - 0.5) * vec2(1.0, 0.8)));
    gl_FragColor = vec4(uColor * (fine * 0.18 + bold * 0.5) * fade, 1.0);
  }
`;

const PLAIN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function glowBasic(hex, strength, extra = {}) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex).multiplyScalar(strength),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    ...extra,
  });
}

// The machine inside: a core, optic lines to the eyes and a jointed spine.
function internals() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), glowBasic(ACCENT, 5, { wireframe: true }));
  core.position.copy(HEAD_CENTRE);
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), glowBasic('#9CC4FF', 12));
  heart.position.copy(HEAD_CENTRE);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.0035, 8, 128), glowBasic(ACCENT, 8));
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.0035, 8, 128), glowBasic(ACCENT, 8));
  ringA.position.copy(HEAD_CENTRE);
  ringB.position.copy(HEAD_CENTRE);
  const nerves = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      HEAD_CENTRE, new THREE.Vector3(-0.2, 0.44, 0.46),
      HEAD_CENTRE, new THREE.Vector3(0.2, 0.44, 0.46),
      HEAD_CENTRE, new THREE.Vector3(-0.42, 0.35, 0.0),
      HEAD_CENTRE, new THREE.Vector3(0.42, 0.35, 0.0),
      HEAD_CENTRE, new THREE.Vector3(0, -0.05, 0.0),
      new THREE.Vector3(0, -0.05, 0.0), new THREE.Vector3(0, -0.62, 0.0),
    ]),
    new THREE.LineBasicMaterial({ color: new THREE.Color(ACCENT).multiplyScalar(7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  group.add(core, heart, ringA, ringB, nerves);
  for (let i = 0; i < 7; i += 1) {
    const disc = new THREE.Mesh(new THREE.TorusGeometry(0.1 - i * 0.004, 0.009, 8, 48), glowBasic(ACCENT, 5));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, -0.08 - i * 0.07, 0.0);
    group.add(disc);
  }
  group.userData = { core, ringA, ringB, heart };
  return group;
}

// ---------------------------------------------------------------- warp
// Streaks of light that rush past the camera during the scroll-in, drawn as
// short lines whose tails stretch with speed (bloom makes them glow).

const WARP_VERT = /* glsl */ `
  attribute vec4 aStreak; // x, y, phase along the tunnel, 0 head / 1 tail
  uniform float uTime;
  uniform float uWarp;
  uniform float uCamZ;
  uniform float uCentreY;
  varying float vA;
  void main() {
    float span = 7.0;
    float speed = 1.2 + 16.0 * uWarp;
    float zRel = fract(aStreak.z + uTime * speed / span) * span;
    float z = uCamZ - span + zRel - aStreak.w * (0.05 + 1.1 * uWarp * uWarp);
    vec4 mv = modelViewMatrix * vec4(aStreak.x, aStreak.y + uCentreY, z, 1.0);
    gl_Position = projectionMatrix * mv;
    float near = 1.0 - smoothstep(span - 1.0, span - 0.15, zRel);
    float far = smoothstep(0.0, 1.6, zRel);
    vA = near * far * uWarp * (1.0 - 0.7 * aStreak.w);
  }
`;
const WARP_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() { gl_FragColor = vec4(uColor, vA); }
`;

function warpStreaks(count) {
  const data = new Float32Array(count * 8);
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.pow(Math.random(), 0.7) * 2.4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.8;
    const phase = Math.random();
    data.set([x, y, phase, 0, x, y, phase, 1], i * 8);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aStreak', new THREE.BufferAttribute(data, 4));
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
  return geo;
}

// ---------------------------------------------------------------- composite

const COMPOSITE = {
  uniforms: {
    tA: { value: null },
    tB: { value: null },
    tMask: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMaskOn: { value: 0 },
    uGlitch: { value: 0 },
    uXray: { value: 0 },
    uAccent: { value: new THREE.Color(ACCENT) },
  },
  vertexShader: PLAIN_VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tA;
    uniform sampler2D tB;
    uniform sampler2D tMask;
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uMaskOn;
    uniform float uGlitch;
    uniform float uXray;
    uniform vec3 uAccent;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    void main() {
      vec2 uv = vUv;
      float g = uGlitch;
      float tear = (hash(vec2(floor(uv.y * 38.0), floor(uTime * 24.0))) - 0.5) * 0.05 * g * step(0.55, hash(vec2(floor(uv.y * 9.0), floor(uTime * 12.0))));
      vec2 o = vec2(tear, 0.0);
      float ca = 0.0035 * g;
      vec3 col = vec3(
        texture2D(tA, uv + o + vec2(ca, 0.0)).r,
        texture2D(tA, uv + o).g,
        texture2D(tA, uv + o - vec2(ca, 0.0)).b
      );
      if (uMaskOn > 0.001) {
        float n = (noise(uv * 7.0 + uTime * 0.35) - 0.5) * 0.06;
        float m = texture2D(tMask, uv + vec2(n, -n)).r;
        float lens = smoothstep(0.22, 0.34, m) * uMaskOn;
        col = mix(col, texture2D(tB, uv + o).rgb, lens);
        float rim = smoothstep(0.15, 0.2, m) * (1.0 - smoothstep(0.2, 0.26, m));
        col += uAccent * rim * 3.2 * uMaskOn;
      }
      col = mix(col, texture2D(tB, uv + o).rgb, uXray);
      col *= 1.0 - 0.045 * (0.5 + 0.5 * sin(uv.y * uRes.y * 1.1));
      col += (hash(uv * uRes + fract(uTime * 7.0)) - 0.5) * 0.012;
      float vig = smoothstep(1.2, 0.35, length((uv - 0.5) * vec2(1.3, 1.0)));
      col *= mix(0.7, 1.0, vig);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// ---------------------------------------------------------------- masthead in 3D
// The masthead is drawn on a canvas and placed on a plane behind the head, so
// the head overlaps it like a magazine cover and the glow spills over it.
// The X-ray scene gets an outlined copy.

const MAST_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>+=';

function mastPlane(outline) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    color: outline ? new THREE.Color(ACCENT).multiplyScalar(3) : new THREE.Color(1.55, 1.57, 1.6),
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = -1;
  return { canvas, ctx, tex, mesh, outline };
}

function drawMast(m, text, box, dpr, scramble = null) {
  const w = Math.max(2, Math.round(Math.min(2400, box.w * dpr)));
  const h = Math.max(2, Math.round((w * box.h) / box.w));
  if (m.canvas.width !== w || m.canvas.height !== h) {
    m.canvas.width = w;
    m.canvas.height = h;
  }
  const { ctx } = m;
  const fs = box.fs * (w / box.w);
  ctx.clearRect(0, 0, w, h);
  ctx.font = `900 ${fs}px Exo, sans-serif`;
  ctx.letterSpacing = `${-0.025 * fs}px`;
  ctx.textBaseline = 'middle';
  const upper = text.toUpperCase();
  ctx.textAlign = 'left';
  const total = ctx.measureText(upper).width;
  let x = (w - total) / 2;
  const y = h * 0.54;
  ctx.textAlign = 'center';
  for (let i = 0; i < upper.length; i += 1) {
    const cw = ctx.measureText(upper[i]).width;
    const ch = scramble?.[i] ?? upper[i];
    if (m.outline) {
      ctx.lineWidth = Math.max(1, fs * 0.012);
      ctx.strokeStyle = '#fff';
      ctx.strokeText(ch, x + cw / 2, y);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillText(ch, x + cw / 2, y);
    }
    x += cw;
  }
  m.tex.needsUpdate = true;
}

// ---------------------------------------------------------------- mount

export async function mountCover(host, { reduced = false, mastEl = null, mastText = 'Perspectives', pipEls = [], onProgress = () => {}, onPose = () => {}, onFrame = () => {}, onIntro = () => {}, onCamera = () => {} } = {}) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);

  // Scene A: the solid android.
  const sceneA = new THREE.Scene();
  sceneA.background = new THREE.Color('#0B0B10');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = studioScene();
  const envRT = pmrem.fromScene(studio, 0.02);
  sceneA.environment = envRT.texture;
  studio.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });

  const key = new THREE.DirectionalLight('#F8FAFC', 4.4);
  key.position.set(-3.3, 2.3, 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.5, far: 10 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight(ACCENT, 7);
  rim.position.set(2.6, 1.3, -3.2);
  const rimLeft = new THREE.DirectionalLight(ACCENT, 3.5);
  rimLeft.position.set(-3, 0.6, -2.6);
  const under = new THREE.DirectionalLight('#6EA8FF', 0.3);
  under.position.set(0, -3, 2);
  // The visitor's cursor is a light: it slides across the face.
  const torch = new THREE.PointLight('#A9C8FF', 0, 0, 2);
  torch.position.set(0, 0.4, 1);
  sceneA.add(key, rim, rimLeft, under, torch);

  // Scene B: the hologram seen through the X-ray lens.
  const sceneB = new THREE.Scene();
  sceneB.background = new THREE.Color('#02050C');

  const U = {
    uScanY: { value: reduced ? -2 : 1.2 },
    uSpot: { value: 0 },
    uGlow: { value: reduced ? 1 : 0 },
    uPulseY: { value: -5 },
    uDive: { value: 0 },
    uFlood: { value: 0 },
    uAccent: { value: new THREE.Color(ACCENT) },
  };

  // Load and normalise the scan.
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL, (e) => {
    if (e.lengthComputable) onProgress(e.loaded / e.total);
  });
  let source = null;
  gltf.scene.traverse((o) => {
    if (o.isMesh && !source) source = o;
  });
  gltf.scene.updateMatrixWorld(true);
  const geometry = source.geometry.clone();
  geometry.applyMatrix4(source.matrixWorld);
  geometry.deleteAttribute('uv');
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  const centre = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  geometry.boundingBox.getCenter(centre);
  const k = 2 / size.y;
  geometry.translate(-centre.x, -centre.y, -centre.z);
  geometry.scale(k, k, k);
  geometry.computeVertexNormals();
  gltf.scene.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      for (const m of [].concat(o.material)) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    }
  });

  // Head gets most of the particles, shoulders the fewest.
  const pos = geometry.attributes.position;
  const weights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    weights[i] = y > -0.08 ? 3 : y > -0.55 ? 1.3 : 0.3;
  }
  geometry.setAttribute('aWeight', new THREE.BufferAttribute(weights, 1));

  // --- rigs (A and B move together)
  const PIVOT_Y = -0.3;
  const makeRig = () => {
    const pivot = new THREE.Group();
    pivot.position.y = PIVOT_Y;
    const rig = new THREE.Group();
    rig.position.y = -PIVOT_Y;
    pivot.add(rig);
    return { pivot, rig };
  };
  const A = makeRig();
  const B = makeRig();
  sceneA.add(A.pivot);
  sceneB.add(B.pivot);

  const shell = shellMaterial(U);
  const bust = new THREE.Mesh(geometry, shell);
  bust.castShadow = true;
  bust.receiveShadow = true;
  const earShell = new THREE.MeshPhysicalMaterial({ color: '#EEF1F5', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
  const ears = [earModule(1, earShell), earModule(-1, earShell)];
  A.rig.add(bust, ...ears);

  // --- particles sampled on the surface
  const COUNT = small ? 5200 : 9000;
  const sampler = new MeshSurfaceSampler(bust).setWeightAttribute('aWeight').build();
  const pAttr = new Float32Array(COUNT * 3);
  const nAttr = new Float32Array(COUNT * 3);
  const sAttr = new Float32Array(COUNT * 3);
  const seedAttr = new Float32Array(COUNT);
  const tp = new THREE.Vector3();
  const tn = new THREE.Vector3();
  const dir = new THREE.Vector3();
  for (let i = 0; i < COUNT; i += 1) {
    sampler.sample(tp, tn);
    pAttr.set([tp.x, tp.y, tp.z], i * 3);
    nAttr.set([tn.x, tn.y, tn.z], i * 3);
    dir.randomDirection();
    const r = 1.8 + Math.random() * 2.2;
    sAttr.set([dir.x * r, dir.y * r * 0.8 + 0.4, dir.z * r], i * 3);
    seedAttr[i] = Math.random();
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute('position', new THREE.BufferAttribute(pAttr, 3));
  dotsGeo.setAttribute('aNormal', new THREE.BufferAttribute(nAttr, 3));
  dotsGeo.setAttribute('aStart', new THREE.BufferAttribute(sAttr, 3));
  dotsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seedAttr, 1));

  const D = {
    uTime: { value: 0 },
    uAssemble: { value: reduced ? 1 : 0 },
    uRayO: { value: new THREE.Vector3(0, 0, 10) },
    uRayD: { value: new THREE.Vector3(0, 0, -1) },
    uPush: { value: 0 },
    uPulse: { value: 0 },
    uDive: U.uDive,
    uSize: { value: 15 * renderer.getPixelRatio() },
  };
  const aura = new THREE.Points(dotsGeo, dotsMaterial(D, { color: '#6E9CFF', hot: '#E2ECFF', opacity: reduced ? 0.22 : 1, lift: 0.012 }));
  aura.frustumCulled = false;
  A.rig.add(aura);

  // --- hologram twin
  const holoMat = new THREE.ShaderMaterial({
    uniforms: { uTime: D.uTime, uColor: { value: new THREE.Color('#5B9BFF') } },
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const holo = new THREE.Mesh(geometry, holoMat);
  const holoWire = new THREE.Mesh(geometry, glowBasic(ACCENT, 0.5, { wireframe: true, opacity: 0.22 }));
  const holoDots = new THREE.Points(dotsGeo, dotsMaterial(D, { color: '#8FB6FF', hot: '#FFFFFF', opacity: 0.8, lift: 0.0 }));
  holoDots.frustumCulled = false;
  const guts = internals();
  B.rig.add(holoWire, holo, holoDots, guts);
  const blueprint = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 6),
    new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(ACCENT) } }, vertexShader: PLAIN_VERT, fragmentShader: GRID_FRAG }),
  );
  blueprint.position.set(0, 0.2, -1.6);
  sceneB.add(blueprint);

  const mastA = mastPlane(false);
  const mastB = mastPlane(true);
  sceneA.add(mastA.mesh);
  sceneB.add(mastB.mesh);
  const MAST_Z = -0.95;
  let mastBox = null;
  let mastScramble = null;

  // --- warp streaks for the scroll-in, in both scenes
  const warpGeo = warpStreaks(small ? 700 : 1400);
  const warpMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: D.uTime,
      uWarp: { value: 0 },
      uCamZ: { value: 5 },
      uCentreY: { value: VISOR_Y },
      uColor: { value: new THREE.Color('#A9C8FF').multiplyScalar(5) },
    },
    vertexShader: WARP_VERT,
    fragmentShader: WARP_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const warpA = new THREE.LineSegments(warpGeo, warpMat);
  const warpB = new THREE.LineSegments(warpGeo, warpMat);
  warpA.frustumCulled = false;
  warpB.frustumCulled = false;
  sceneA.add(warpA);
  sceneB.add(warpB);

  // --- dust in the light
  const DUST = small ? 360 : 700;
  const dust = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i += 1) {
    dust[i * 3] = (Math.random() - 0.5) * 5;
    dust[i * 3 + 1] = Math.random() * 3 - 1.2;
    dust[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const motes = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: '#94A3B8', size: 0.012, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  sceneA.add(motes);

  // --- render targets and post-processing
  // MSAA only where edges matter (the solid scene); the hologram is soft anyway.
  const rtA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: small ? 0 : 2 });
  const rtB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
  const composer = new EffectComposer(renderer);
  const composite = new ShaderPass(COMPOSITE);
  composite.uniforms.tA.value = rtA.texture;
  composite.uniforms.tB.value = rtB.texture;
  // Threshold sits above the lit shell (HDR, before tone mapping), so only
  // emissive parts, hot particles and hologram rims glow.
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.45, 2.4);
  composer.addPass(composite);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- the X-ray lens: a trail drawn on a small canvas
  const maskCanvas = document.createElement('canvas');
  const mctx = maskCanvas.getContext('2d');
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.minFilter = THREE.LinearFilter;
  maskTex.generateMipmaps = false;
  composite.uniforms.tMask.value = maskTex;
  let inkUntil = 0;
  let width = 1;
  let height = 1;
  // Resting camera (set on resize) and how far the visitor has scrolled in (0 to 1).
  const view = { dist: 5, centreY: 0.3, shift: 0, lift: 0, diveZ: 1.6 };
  let dive = 0;
  let offsetBlend = 0;
  function stamp(x, y, radius, strength) {
    // x, y and radius in CSS px inside the stage
    const s = maskCanvas.width / width;
    const cx = x * s;
    const cy = y * s;
    const r = radius * s;
    const grad = mctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(255,255,255,${strength})`);
    grad.addColorStop(0.55, `rgba(255,255,255,${strength * 0.6})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    mctx.fillStyle = grad;
    mctx.beginPath();
    mctx.arc(cx, cy, r, 0, Math.PI * 2);
    mctx.fill();
    inkUntil = performance.now() + 2600;
  }

  // ---------- layout
  function resize() {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    const dpr = renderer.getPixelRatio();
    rtA.setSize(Math.round(width * dpr), Math.round(height * dpr));
    rtB.setSize(Math.round(width * dpr), Math.round(height * dpr));
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    composite.uniforms.uRes.value.set(width * dpr, height * dpr);
    maskCanvas.width = 320;
    maskCanvas.height = Math.max(1, Math.round((320 * height) / width));
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const aspect = width / height;
    camera.aspect = aspect;
    // Frame the bust from just above the crown to the collar; back off on
    // narrow screens so the whole head fits.
    const viewH = Math.max(2.15, 1.55 / aspect);
    const dist = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const centreY = aspect > 1.25 ? 0.32 : 0.2;
    camera.position.set(0, centreY, dist);
    camera.lookAt(0, centreY, 0);
    const shift = aspect > 1.25 ? -0.09 * width : 0;
    const lift = aspect > 1.25 ? 0 : 0.06 * height;
    // Scroll-in ends where the visor spans the screen, well clear of the nose.
    const diveGap = THREE.MathUtils.clamp(0.8 / (2 * Math.tan(THREE.MathUtils.degToRad(13)) * aspect), 0.95, 1.25);
    Object.assign(view, { dist, centreY, shift, lift, diveZ: 0.47 + diveGap });
    offsetBlend = 0;
    camera.setViewOffset(width, height, shift, lift, width, height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    placeMast();
  }

  // Camera 1 (front) and the scroll-in: the camera flies to the visor and the
  // framing moves to the centre.
  function placeCamera(e) {
    const z = Math.exp(THREE.MathUtils.lerp(Math.log(view.dist), Math.log(view.diveZ), e));
    camera.position.set(-pose.yaw * 0.25 * (1 - e), THREE.MathUtils.lerp(view.centreY, VISOR_Y, e), z);
    camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 1);
    if (e !== offsetBlend) {
      offsetBlend = e;
      camera.fov = 26;
      camera.near = 0.1;
      camera.setViewOffset(width, height, view.shift * (1 - e), view.lift * (1 - e), width, height);
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  }

  // Cameras for the picture-in-picture feeds (and the main view when a feed is
  // switched to): 1 front, 2 side, 3 X-ray.
  const CAMS = {
    front: { pos: new THREE.Vector3(0, 0.4, 4.9), look: new THREE.Vector3(0, 0.36, 0), fov: 26 },
    side: { pos: new THREE.Vector3(4.4, 0.66, 0.75), look: new THREE.Vector3(0, 0.38, 0.02), fov: 25 },
    xray: { pos: new THREE.Vector3(2.0, 0.8, 3.7), look: new THREE.Vector3(0, 0.4, 0), fov: 25 },
  };
  const aimDir = new THREE.Vector3();
  function aim(cam, id, aspect) {
    const c = CAMS[id];
    const back = Math.max(1, 1.35 / aspect); // tall screens: step back so the head fits
    cam.position.copy(c.look).addScaledVector(aimDir.subVectors(c.pos, c.look), back);
    cam.fov = c.fov;
    cam.near = 0.1;
    cam.aspect = aspect;
    cam.lookAt(c.look);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
  function placeOther(id) {
    aim(camera, id, width / height);
    camera.setViewOffset(width, height, view.shift, view.lift, width, height);
    camera.updateProjectionMatrix();
    offsetBlend = -1;
  }
  // Past the visor: inside the head, flying at the glowing core.
  function placeInside(k) {
    camera.position.set(0, THREE.MathUtils.lerp(VISOR_Y, HEAD_CENTRE.y + 0.02, k), THREE.MathUtils.lerp(0.52, 0.27, k));
    camera.lookAt(HEAD_CENTRE);
    camera.fov = 62 - 14 * k;
    camera.near = 0.02;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    offsetBlend = -1;
  }

  // Put the masthead plane exactly where the (hidden) DOM masthead sits.
  function placeMast() {
    if (!mastEl) return;
    const stageBox = renderer.domElement.getBoundingClientRect();
    const r = mastEl.getBoundingClientRect();
    if (!r.width || !stageBox.width) return;
    const fs = parseFloat(getComputedStyle(mastEl).fontSize) || r.height;
    mastBox = { x: r.left - stageBox.left, y: r.top - stageBox.top, w: r.width, h: r.height, fs };
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -MAST_Z);
    const rc = new THREE.Raycaster();
    const hit = (px, py) => {
      rc.setFromCamera(new THREE.Vector2((px / stageBox.width) * 2 - 1, -(py / stageBox.height) * 2 + 1), camera);
      const out = new THREE.Vector3();
      rc.ray.intersectPlane(plane, out);
      return out;
    };
    const tl = hit(mastBox.x, mastBox.y);
    const br = hit(mastBox.x + mastBox.w, mastBox.y + mastBox.h);
    for (const m of [mastA, mastB]) {
      m.mesh.position.set((tl.x + br.x) / 2, (tl.y + br.y) / 2, MAST_Z);
      m.mesh.scale.set(Math.abs(br.x - tl.x), Math.abs(tl.y - br.y), 1);
      drawMast(m, mastText, mastBox, renderer.getPixelRatio(), mastScramble);
    }
  }

  // Decode: letters spin through glyphs and lock in left to right.
  let decodeStart = reduced ? -1 : 0;
  function scrambleAt(elapsed) {
    const out = [];
    let done = true;
    for (let i = 0; i < mastText.length; i += 1) {
      if (elapsed >= i * 0.055 + 0.42) out.push(null);
      else {
        done = false;
        out.push(elapsed > i * 0.016 ? MAST_GLYPHS[(Math.random() * MAST_GLYPHS.length) | 0] : null);
      }
    }
    return done ? null : out;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // ---------- input
  const clock = new THREE.Clock();
  const pointer = { x: 0, y: 0, px: -1, py: -1, inside: false, last: -1e9, speed: 0, overMast: false };
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const torchPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.7);
  const torchTarget = new THREE.Vector3();

  function onMove(e) {
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    pointer.inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
    if (!pointer.inside) return;
    if (pointer.px >= 0 && dive < 0.02) {
      const dx = x - pointer.px;
      const dy = y - pointer.py;
      const dist = Math.hypot(dx, dy);
      pointer.speed = Math.min(1, pointer.speed + dist / 180);
      const steps = Math.min(24, Math.ceil(dist / 6));
      for (let s = 1; s <= steps; s += 1) {
        stamp(pointer.px + (dx * s) / steps, pointer.py + (dy * s) / steps, Math.min(width, height) * 0.11, 0.7);
      }
    }
    if (mastBox && !reduced) {
      const over = x >= mastBox.x && x <= mastBox.x + mastBox.w && y >= mastBox.y && y <= mastBox.y + mastBox.h;
      if (over && !pointer.overMast && decodeStart < 0) decodeStart = clock.getElapsedTime() - 0.1;
      pointer.overMast = over;
    }
    pointer.px = x;
    pointer.py = y;
    pointer.x = (x / r.width) * 2 - 1;
    pointer.y = (y / r.height) * 2 - 1;
    pointer.last = performance.now();
  }
  window.addEventListener('pointermove', onMove, { passive: true });

  let pulseStart = -10;
  let touchDown = null;
  function pulse() {
    stamp(pointer.px, pointer.py, Math.min(width, height) * 0.22, 0.9);
    if (!reduced) pulseStart = clock.getElapsedTime();
    onIntro('pulse');
  }
  function onDown(e) {
    if (e.target instanceof Element && e.target.closest('a, button, .cover-foot, .cover-bar')) return;
    onMove(e);
    if (!pointer.inside || dive > 0.02) return;
    // On touch screens a swipe scrolls the page, so only a tap scans.
    if (e.pointerType === 'touch') touchDown = { x: e.clientX, y: e.clientY, t: performance.now() };
    else pulse();
  }
  function onUp(e) {
    if (!touchDown) return;
    const tap = Math.hypot(e.clientX - touchDown.x, e.clientY - touchDown.y) < 12 && performance.now() - touchDown.t < 500;
    touchDown = null;
    if (tap) pulse();
  }
  const onCancel = () => {
    touchDown = null;
  };
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);

  // ---------- helpers for the HUD
  const tmp = new THREE.Vector3();
  function toScreen(local) {
    tmp.copy(local);
    A.rig.localToWorld(tmp);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height };
  }
  const visorPoint = (a) => new THREE.Vector3(Math.sin(a) * 0.5, VISOR_Y - 0.05 * a * a, Math.cos(a) * 0.5);
  const HUD_POINTS = {
    top: new THREE.Vector3(0, 1.02, 0),
    chin: new THREE.Vector3(0, -0.1, 0.45),
    left: new THREE.Vector3(-0.6, 0.38, 0),
    right: new THREE.Vector3(0.6, 0.38, 0),
    visor: visorPoint(-0.95),
    ear: new THREE.Vector3(EAR.x + 0.06, EAR.y, EAR.z),
  };

  // ---------- loop
  const pose = { yaw: 0, pitch: 0 };
  const inv = new THREE.Matrix4();
  let raf = 0;
  let running = true;
  let lastHud = 0;
  let introSent = false;
  let nextWander = 7;
  let mainCam = 'front';
  const feedCams = ['side', 'xray'].slice(0, pipEls.length);
  const feedCameras = feedCams.map(() => new THREE.PerspectiveCamera(25, 1.5, 0.1, 50));
  let cutAt = -10;
  const tellCamera = () => onCamera({ main: mainCam, feeds: feedCams.slice() });
  // Cut the main view to feed i; the feed takes the old main view.
  function cut(i) {
    if (!feedCams[i] || dive > 0.02) return;
    [mainCam, feedCams[i]] = [feedCams[i], mainCam];
    if (!reduced) cutAt = clock.getElapsedTime();
    tellCamera();
  }
  function feedRect(el) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const s = renderer.domElement.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const t = clock.getElapsedTime();
    const now = performance.now();
    D.uTime.value = t;
    composite.uniforms.uTime.value = t;

    // Intro: particles assemble, then the shell scans in, then lights come on.
    if (!reduced) {
      D.uAssemble.value = Math.min(1, t / 2.4);
      const scan = THREE.MathUtils.clamp((t - 1.6) / 1.8, 0, 1);
      U.uScanY.value = 1.12 - (1 - Math.pow(1 - scan, 3)) * 2.35;
      U.uGlow.value = THREE.MathUtils.clamp((t - 3.0) / 0.6, 0, 1) * (0.85 + 0.15 * Math.sin(t * 2.1));
      aura.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(1, 0.22, THREE.MathUtils.clamp((t - 2.4) / 1.2, 0, 1));
      for (const ear of ears) ear.visible = U.uScanY.value < EAR.y + 0.16;
    }
    if (!introSent && (reduced || t > 3.4)) {
      introSent = true;
      onIntro('ready');
    }

    // Masthead decode (at load and when the pointer enters it).
    if (decodeStart >= 0 && mastBox) {
      const next = scrambleAt(t - decodeStart);
      if (next || mastScramble) {
        mastScramble = next;
        drawMast(mastA, mastText, mastBox, renderer.getPixelRatio(), mastScramble);
        drawMast(mastB, mastText, mastBox, renderer.getPixelRatio(), mastScramble);
      }
      if (!next) decodeStart = -1;
    }

    // Head follows the pointer; drifts when nobody is steering.
    const idle = now - pointer.last > 3000;
    // The camera reaches the visor at 80% of the scroll; the rest is light.
    const approach = Math.min(1, dive / 0.8);
    const e = approach * approach * (3 - 2 * approach);
    const steer = 1 - Math.min(1, dive / 0.25);
    const tx = (reduced ? 0 : idle ? 0.32 * Math.sin(t * 0.37) : pointer.x) * steer;
    const ty = (reduced ? 0 : idle ? 0.12 * Math.sin(t * 0.29 + 1) : pointer.y) * steer;
    const ease = dive > 0.001 ? 0.1 : idle ? 0.02 : 0.06;
    pose.yaw += (tx * 0.55 - pose.yaw) * ease;
    pose.pitch += (ty * 0.2 - pose.pitch) * ease;
    for (const rig of [A, B]) {
      rig.pivot.rotation.y = pose.yaw;
      rig.pivot.rotation.x = pose.pitch;
      rig.pivot.updateMatrixWorld(true);
    }
    // Scrolling in always starts from camera 1.
    if (dive > 0.01 && mainCam !== 'front') {
      const i = feedCams.indexOf('front');
      [mainCam, feedCams[i]] = ['front', mainCam];
      cutAt = t;
      tellCamera();
    }
    const inside = dive > 0.8;
    const deep = THREE.MathUtils.smoothstep(dive, 0.8, 0.98);
    if (inside) placeInside(deep);
    else if (mainCam === 'front') placeCamera(e);
    else placeOther(mainCam);
    // The visor's light bar blazes just before the cut inside.
    const flood = THREE.MathUtils.smoothstep(dive, 0.62, 0.8);
    U.uDive.value = e;
    U.uFlood.value = inside ? 0 : flood;
    warpMat.uniforms.uWarp.value = reduced ? 0 : THREE.MathUtils.smoothstep(dive, 0.04, 0.5);
    warpMat.uniforms.uCamZ.value = camera.position.z;
    bloom.strength = inside ? 0.95 + 0.7 * deep : 0.7 + 0.5 * flood * flood;
    bloom.radius = inside ? 0.55 : 0.45 + 0.2 * flood;
    renderer.toneMappingExposure = inside ? 0.95 + 0.25 * deep : 0.95 + 0.15 * flood * flood;
    mastA.mesh.material.opacity = 1 - Math.min(1, e * 5);

    // Visor light looks where the head looks.
    const spotTarget = (reduced ? 0 : idle ? 0.85 * Math.sin(t * 1.3) : THREE.MathUtils.clamp(tx * 0.95, -0.95, 0.95)) * steer;
    U.uSpot.value += (spotTarget - U.uSpot.value) * (idle ? 0.08 : 0.12);

    // Cursor ray: light, particle push.
    ndc.set(pointer.x, -pointer.y);
    raycaster.setFromCamera(ndc, camera);
    const active = pointer.inside && !idle && dive < 0.02;
    if (raycaster.ray.intersectPlane(torchPlane, torchTarget)) torch.position.lerp(torchTarget, 0.2);
    torch.intensity += ((active ? 2.2 : 0) - torch.intensity) * 0.08;
    inv.copy(A.rig.matrixWorld).invert();
    D.uRayO.value.copy(raycaster.ray.origin).applyMatrix4(inv);
    D.uRayD.value.copy(raycaster.ray.direction).transformDirection(inv);
    pointer.speed *= 0.9;
    const pushTarget = active ? 0.45 + pointer.speed * 0.8 : 0;
    D.uPush.value += (pushTarget - D.uPush.value) * 0.12;

    // Click pulse: a band of light runs down, particles burst, the picture tears.
    const pt = t - pulseStart;
    let glitch = Math.max(0, 1 - (t - cutAt) / 0.4);
    if (pt >= 0 && pt < 1.4) {
      U.uPulseY.value = 1.15 - (pt / 1.1) * 1.9;
      D.uPulse.value = Math.sin(Math.min(1, pt / 0.9) * Math.PI) * 0.9;
      glitch = Math.max(glitch, 1 - pt / 0.45);
    } else {
      U.uPulseY.value = -5;
      D.uPulse.value = 0;
    }
    // Crossing into the head tears the picture too.
    glitch = Math.max(glitch, 1 - Math.abs(dive - 0.8) / 0.035);
    composite.uniforms.uGlitch.value = Math.max(0, glitch);

    // Idle: the lens wanders across the face now and then.
    if (!reduced && idle && dive < 0.02 && t > nextWander) {
      const w = t - nextWander;
      if (w < 2.6) {
        const c = toScreen(HEAD_CENTRE);
        const span = Math.min(width, height) * 0.2;
        stamp(c.x + Math.sin(w * 2.4) * span, c.y + Math.sin(w * 3.1) * span * 0.6, Math.min(width, height) * 0.09, 0.4);
      } else {
        nextWander = t + 9;
      }
    }

    // Fade the lens trail.
    mctx.fillStyle = 'rgba(0,0,0,0.028)';
    mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskTex.needsUpdate = true;
    const lensOn = now < inkUntil;
    composite.uniforms.uMaskOn.value += ((lensOn ? 1 : 0) - composite.uniforms.uMaskOn.value) * 0.2;

    // The machine inside turns.
    guts.userData.core.rotation.set(t * 0.25, t * 0.6, 0);
    guts.userData.ringA.rotation.set(t * 0.7, t * 0.4, 0);
    guts.userData.ringB.rotation.set(Math.PI / 2 + t * 0.3, 0, t * 0.5);
    guts.userData.heart.scale.setScalar((1 + 0.15 * Math.sin(t * 3)) * (1 + 1.2 * deep));
    guts.userData.core.scale.setScalar(1 + 0.6 * deep);

    // Dust rises slowly and wraps.
    if (!reduced) {
      const dp = dustGeo.attributes.position;
      for (let i = 0; i < DUST; i += 1) {
        let y = dp.getY(i) + 0.0009 + (i % 7) * 0.00012;
        if (y > 1.8) y = -1.2;
        dp.setY(i, y);
      }
      dp.needsUpdate = true;
    }

    // Render: the main view (A, and B while the lens is open or when the view
    // is the X-ray), composite + bloom, then the picture-in-picture feeds.
    const xrayMain = inside || mainCam === 'xray';
    composite.uniforms.uXray.value = xrayMain ? 1 : 0;
    renderer.shadowMap.needsUpdate = true;
    if (!xrayMain) {
      renderer.setRenderTarget(rtA);
      renderer.render(sceneA, camera);
    }
    if (xrayMain || composite.uniforms.uMaskOn.value > 0.001) {
      renderer.setRenderTarget(rtB);
      renderer.render(sceneB, camera);
    }
    renderer.setRenderTarget(null);
    composer.render();
    if (dive < 0.15 && feedCams.length) {
      const size = D.uSize.value;
      renderer.setScissorTest(true);
      pipEls.forEach((el, i) => {
        const r = feedRect(el);
        if (!r) return;
        aim(feedCameras[i], feedCams[i], r.w / r.h);
        const y = height - r.y - r.h;
        renderer.setViewport(r.x, y, r.w, r.h);
        renderer.setScissor(r.x, y, r.w, r.h);
        D.uSize.value = size * Math.max(0.35, r.h / height);
        renderer.render(feedCams[i] === 'xray' ? sceneB : sceneA, feedCameras[i]);
      });
      D.uSize.value = size;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
    }

    if (now - lastHud > 33) {
      lastHud = now;
      onPose({ yaw: THREE.MathUtils.radToDeg(pose.yaw), pitch: THREE.MathUtils.radToDeg(-pose.pitch) });
      const top = toScreen(HUD_POINTS.top);
      const chin = toScreen(HUD_POINTS.chin);
      const left = toScreen(HUD_POINTS.left);
      const right = toScreen(HUD_POINTS.right);
      onFrame({
        box: { x: Math.min(left.x, right.x), y: top.y, w: Math.abs(right.x - left.x), h: chin.y - top.y },
        visor: toScreen(HUD_POINTS.visor),
        ear: toScreen(HUD_POINTS.ear),
        lens: lensOn,
      });
    }
  }

  const onVisibility = () => {
    running = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);
  tellCamera();

  function dispose() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    document.removeEventListener('visibilitychange', onVisibility);
    const seen = new Set();
    for (const scene of [sceneA, sceneB]) {
      scene.traverse((o) => {
        if (o.geometry && !seen.has(o.geometry)) {
          seen.add(o.geometry);
          o.geometry.dispose();
        }
        for (const m of [].concat(o.material ?? [])) {
          if (seen.has(m)) continue;
          seen.add(m);
          m.map?.dispose();
          m.dispose();
        }
      });
    }
    maskTex.dispose();
    rtA.dispose();
    rtB.dispose();
    bloom.dispose();
    composer.dispose?.();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    dispose,
    // 0 = resting, 0.8 = at the visor, 1 = at the core.
    setDive(value) {
      dive = THREE.MathUtils.clamp(value, 0, 1);
    },
    cut,
  };
}
