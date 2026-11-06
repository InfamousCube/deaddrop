// Materials for the "Copper Line" show (DD-002). One flat, poster-like lighting model for every set
// piece (hemisphere + key + four point lights + one rotating beacon + rim + distance fog), driven by
// its own uniforms so the show can light its sets without touching the lobby's light rig.
// Global exposure is shared with the lobby (LIGHT.uExposure), so "lights out" darkens everything.
import * as THREE from 'three';
import { LIGHT } from '../../gfx/shade.js';

const C = (h) => new THREE.Color(h);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// palette (sRGB hex; THREE converts to linear)
export const PAL = {
  ink: 0x0b1018, night: 0x111a28, navy: 0x1a2537, slate: 0x2a3446, steel: 0x5b6672, steelLt: 0x9aa4ad,
  copper: 0xb4652a, copperLt: 0xd98a4a, copperDk: 0x6e3a18, gold: 0xe0a527, goldLt: 0xffd27a, brass: 0xc9973e,
  cream: 0xeadcbf, paper: 0xe6dac0, red: 0xc8302a, velvet: 0x8a1626, teal: 0x1f5a5e, black: 0x07090d,
};

export const SU = {
  uExposure: LIGHT.uExposure,
  uFade: { value: 1 },
  uTime: { value: 0 },
  uSky: { value: C(0x2a3550) },
  uGround: { value: C(0x1a1410) },
  uKeyDir: { value: V(-0.4, 0.75, 0.5).normalize() },
  uKeyCol: { value: C(0x55617a) },
  uP: { value: [V(0, 30, 0), V(0, 30, 0), V(0, 30, 0), V(0, 30, 0)] },
  uPC: { value: [C(0), C(0), C(0), C(0)] },
  uPR: { value: [10, 10, 10, 10] },
  uBeacon: { value: new THREE.Vector4(0, -100, 0, 0) }, // xyz position, w beam angle
  uBeaconCol: { value: C(0) },
  uFogCol: { value: C(0x0d1220) },
  uFogNear: { value: 12 },
  uFogFar: { value: 46 },
  uRimCol: { value: C(0x3a4a66) },
};

export const COMMON_PARS = /* glsl */ `
uniform float uExposure, uFade, uTime;
uniform vec3 uSky, uGround, uKeyDir, uKeyCol;
uniform vec3 uP[4]; uniform vec3 uPC[4]; uniform float uPR[4];
uniform vec4 uBeacon; uniform vec3 uBeaconCol;
uniform vec3 uFogCol; uniform float uFogNear, uFogFar;
uniform vec3 uRimCol;
float band(float d) { return smoothstep(-0.1, 0.2, d) * 0.6 + smoothstep(0.45, 0.62, d) * 0.4; }
vec3 lightAt(vec3 n, vec3 w) {
  vec3 L = mix(uGround, uSky, n.y * 0.5 + 0.5);
  L += uKeyCol * band(dot(n, uKeyDir));
  for (int i = 0; i < 4; i++) {
    vec3 d = uP[i] - w;
    float dist = max(length(d), 1e-3);
    float att = clamp(1.0 - dist / uPR[i], 0.0, 1.0);
    L += uPC[i] * att * att * band(dot(n, d / dist));
  }
  // rotating beacon: two opposite beams sweeping around a vertical axis
  vec3 bd = w - uBeacon.xyz;
  float bl = length(bd);
  if (bl < 22.0) {
    vec2 hd = normalize(bd.xz + 1e-4);
    vec2 bdir = vec2(cos(uBeacon.w), sin(uBeacon.w));
    float s = abs(dot(hd, bdir));
    float beam = pow(s, 14.0) * smoothstep(-0.6, 0.0, bd.y / bl + 0.3);
    float att = clamp(1.0 - bl / 22.0, 0.0, 1.0);
    L += uBeaconCol * (0.18 + beam * 1.6) * att * max(0.0, dot(n, -bd / bl) * 0.7 + 0.3);
  }
  return L;
}
vec3 finish(vec3 c, vec3 w) {
  float f = smoothstep(uFogNear, uFogFar, length(w - cameraPosition));
  c = mix(c, uFogCol, f);
  return c * uExposure * uFade;
}`;

const POSTER_V = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aExtra;
varying vec3 vCol; varying vec4 vExtra; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 p = position; vec3 n = normal;
#ifdef USE_INSTANCING
  p = (instanceMatrix * vec4(p, 1.0)).xyz;
  n = mat3(instanceMatrix) * n;
#endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vCol = aCol;
#ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
#endif
  vExtra = aExtra;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const POSTER_F = /* glsl */ `
${COMMON_PARS}
uniform vec3 uTint; uniform float uGlow;
varying vec3 vCol; varying vec4 vExtra; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 base = vCol * uTint;
  vec3 L = lightAt(n, vW);
  vec3 v = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 c = base * L;
  if (vExtra.y > 0.0) {
    vec3 h = normalize(v + uKeyDir);
    float s = pow(max(dot(n, h), 0.0), 60.0);
    c += vExtra.y * vExtra.y * smoothstep(0.3, 0.6, s) * (uKeyCol + 0.25 * uSky);
    c += vExtra.y * fres * 0.25 * L;
  }
  c += uRimCol * fres * 0.35;
  c += base * (vExtra.x * uGlow);
  gl_FragColor = vec4(finish(c, vW), 1.0);
  #include <colorspace_fragment>
}`;

// Lit material for painted geometry (aCol/aExtra from gfx/shade.js paint()).
export function poster({ tint = 0xffffff, glow = 1, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...SU, uTint: { value: C(tint) }, uGlow: { value: glow } },
    vertexShader: POSTER_V, fragmentShader: POSTER_F, side,
  });
}

// ---------------------------------------------------------------------------------------------
// Sprites: one instanced billboard system for lamps, headlights, flares, sparks, bubbles, dust and
// fireworks. Every sprite is a pure function of song time:
//   iPos start, iVel velocity, iCol colour (linear, may be > 1), iT = (t0, t1, size, group),
//   iK = (gravity, drag, twinkle, kind)  kind 0 lamp (on t0..t1), 1 spark (born t0, dies t1),
//   2 bubble ring, 3 loop (moves along iVel, period t1, phase t0), 4 soft halo lamp
const SPRITE_V = /* glsl */ `
uniform float uTime, uScale;
uniform float uGroup[24];
attribute vec3 iPos, iVel, iCol; attribute vec4 iT, iK;
varying vec3 vC; varying vec2 vUv; varying float vKind; varying float vA;
void main() {
  float t0 = iT.x, t1 = iT.y, kind = iK.w;
  float tau = uTime - t0;
  float a = 1.0;
  vec3 p = iPos;
  if (kind < 0.5 || kind > 3.5) {
    a = smoothstep(t0, t0 + 0.08, uTime) * (1.0 - smoothstep(t1, t1 + 0.12, uTime));
  } else if (kind < 2.5) {
    float life = max(t1 - t0, 1e-3);
    float k = tau / life;
    a = step(0.0, tau) * (1.0 - smoothstep(0.55, 1.0, k)) * (kind < 1.5 ? (0.6 + 0.4 * exp(-tau * 6.0)) : 1.0);
    tau = clamp(tau, 0.0, life);
    float d = iK.y;
    vec3 disp = d > 0.0 ? iVel * (1.0 - exp(-d * tau)) / d : iVel * tau;
    p += disp + vec3(0.0, -0.5 * iK.x * tau * tau, 0.0);
  } else {
    float per = max(t1, 1e-3);
    p += iVel * mod(uTime + t0, per);
    a = 1.0;
  }
  if (iK.z > 0.0) a *= 0.65 + 0.35 * sin(uTime * iK.z + iPos.x * 13.0 + iPos.z * 7.0);
  int g = int(iT.w + 0.5);
  a *= uGroup[g];
  vA = a;
  vC = iCol;
  vKind = kind;
  vUv = position.xy;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float sz = iT.z * uScale * (a > 0.001 ? 1.0 : 0.0);
  mv.xy += position.xy * sz;
  gl_Position = projectionMatrix * mv;
}`;
const SPRITE_F = /* glsl */ `
uniform float uExposure, uFade;
varying vec3 vC; varying vec2 vUv; varying float vKind; varying float vA;
void main() {
  float d = length(vUv) * 2.0;
  if (d > 1.0) discard;
  float core = exp(-d * d * 9.0);
  float halo = exp(-d * d * 2.6) * 0.45;
  float s = core + halo;
  if (vKind > 1.5 && vKind < 2.5) s = smoothstep(0.55, 0.78, d) * (1.0 - smoothstep(0.8, 1.0, d)) * 1.2 + core * 0.25;
  if (vKind > 3.5) s = exp(-d * d * 3.5);
  gl_FragColor = vec4(vC * s * vA * uExposure * uFade, 1.0);
  #include <colorspace_fragment>
}`;

export class Sprites {
  constructor(max = 4096) {
    this.max = max;
    this.n = 0;
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.attributes.position);
    const mk = (k, s) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * s), s); g.setAttribute(k, a); return a; };
    this.a = { iPos: mk('iPos', 3), iVel: mk('iVel', 3), iCol: mk('iCol', 3), iT: mk('iT', 4), iK: mk('iK', 4) };
    this.geo = g;
    this.groups = new Array(24).fill(1);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: SU.uTime, uExposure: SU.uExposure, uFade: SU.uFade, uScale: { value: 1 }, uGroup: { value: this.groups } },
      vertexShader: SPRITE_V, fragmentShader: SPRITE_F,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
  }
  // add one sprite; col is a THREE.Color or hex, intensity multiplies it
  add({ p, v = [0, 0, 0], col = 0xffffff, i = 1, t0 = -1e4, t1 = 1e4, size = 0.1, group = 0, grav = 0, drag = 0, tw = 0, kind = 0 }) {
    if (this.n >= this.max) return -1;
    const k = this.n++;
    const c = col instanceof THREE.Color ? col : new THREE.Color(col);
    this.a.iPos.setXYZ(k, p[0], p[1], p[2]);
    this.a.iVel.setXYZ(k, v[0], v[1], v[2]);
    this.a.iCol.setXYZ(k, c.r * i, c.g * i, c.b * i);
    this.a.iT.setXYZW(k, t0, t1, size, group);
    this.a.iK.setXYZW(k, grav, drag, tw, kind);
    return k;
  }
  // a firework/flare burst of n sparks
  burst({ p, t0, n = 60, speed = 3, life = 2.2, cols = [PAL.gold], size = 0.12, grav = 1.2, drag = 1.6, group = 0, rnd = Math.random, ring = false, i = 2.4 }) {
    for (let s = 0; s < n; s++) {
      let d;
      if (ring) { const a = (s / n) * Math.PI * 2; d = new THREE.Vector3(Math.cos(a), (rnd() - 0.5) * 0.15, Math.sin(a)); }
      else { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u); d = new THREE.Vector3(r * Math.cos(a), u, r * Math.sin(a)); }
      const sp = speed * (0.75 + rnd() * 0.35);
      this.add({ p, v: [d.x * sp, d.y * sp, d.z * sp], col: cols[s % cols.length], i: i * (0.7 + rnd() * 0.6), t0: t0 + rnd() * 0.05, t1: t0 + life * (0.7 + rnd() * 0.5), size: size * (0.7 + rnd() * 0.6), grav, drag, group, kind: 1, tw: rnd() < 0.3 ? 30 : 0 });
    }
  }
  commit() {
    for (const a of Object.values(this.a)) a.needsUpdate = true;
    this.geo.instanceCount = this.n;
  }
}

// ---------------------------------------------------------------------------------------------
// Additive ribbons (gold routes, seams, wires, lasers): geometry carries aAlong (distance along the
// path) and aKey (x: start time, y: speed, z: group, w: width side -1..1). A ribbon is drawn up to
// (t - start) * speed, with a bright head; uGroup[] scales whole groups.
const RIB_V = /* glsl */ `
attribute float aAlong; attribute vec4 aKey;
varying float vAlong; varying vec4 vKey;
void main() { vAlong = aAlong; vKey = aKey; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RIB_F = /* glsl */ `
uniform float uTime, uExposure, uFade; uniform float uGroup[16]; uniform vec3 uCol; uniform vec3 uHead;
varying float vAlong; varying vec4 vKey;
void main() {
  float front = (uTime - vKey.x) * vKey.y;
  if (vAlong > front) discard;
  float g = uGroup[int(vKey.z + 0.5)];
  float head = exp(-max(front - vAlong, 0.0) * 3.0);
  float edge = 1.0 - smoothstep(0.35, 1.0, abs(vKey.w));
  vec3 c = (uCol * (0.55 + 0.45 * edge) + uHead * head * 2.5) * g;
  gl_FragColor = vec4(c * uExposure * uFade, 1.0);
  #include <colorspace_fragment>
}`;
export function ribbonMat(col = 0xe0a527, head = 0xfff0c0) {
  const groups = new Array(16).fill(1);
  return new THREE.ShaderMaterial({
    uniforms: { uTime: SU.uTime, uExposure: SU.uExposure, uFade: SU.uFade, uGroup: { value: groups }, uCol: { value: C(col) }, uHead: { value: C(head) } },
    vertexShader: RIB_V, fragmentShader: RIB_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// Build a flat ribbon along a polyline (points [x,y,z]) lying in a plane with normal `up`.
export function ribbonGeo(list) {
  const pos = [], along = [], key = [], idx = [];
  for (const r of list) {
    const pts = r.pts.map((p) => V(...p));
    const up = V(...(r.up || [0, 1, 0]));
    let acc = r.offset || 0;
    const base = pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dir = b.clone().sub(a).normalize();
      const side = dir.clone().cross(up).normalize().multiplyScalar(r.w / 2);
      if (i > 0) acc += pts[i].distanceTo(pts[i - 1]);
      for (const s of [-1, 1]) {
        const p = pts[i].clone().addScaledVector(side, s);
        pos.push(p.x, p.y, p.z); along.push(acc); key.push(r.t0, r.speed, r.group || 0, s);
      }
      if (i > 0) { const k = base + (i - 1) * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  g.setAttribute('aKey', new THREE.Float32BufferAttribute(key, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export { C, V };
