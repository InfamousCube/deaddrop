// Reusable transition and particle effects for DD-003. Everything is GPU-driven or a pure function
// of song time t, so seeking works. Transition types (rotate, never twice in a row):
//   LIGHTS-OUT  lightsOut(t, times)          -> how many of a list of switch times have passed
//   PORTAL      matte(kit, {shape, ...})     -> black wall with a hole: the next world shows only through it
//   SHATTER     shards(kit, {...})           -> flat triangle shards flying outward (instanced, GPU)
//   EDGE-MODE   edges(kit, obj, {...}) + kit.edge(k) -> fills go black, crisp edge lines stay
//   COLOR FLASH scene.flashes / out.flash    -> 1-2 frames full colour (handled by show.js)
//   MATCH-CUT   (choreography: same shape, same screen position, swap groups on one frame)
//   FADE        kit.fade(k) (scene fade to black) / fadeK(t, a, b)
//   PASS-BY     passBy(t, t0, dur, dist)     -> eased offset for a world sliding away / in
import * as THREE from 'three';
import { U, PAL, mulberry } from './style.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const fadeK = (t, a, b) => 1 - sm(a, b, t);
export const lightsOut = (t, times) => { let n = 0; for (const x of times) if (t >= x) n++; return n; };
export const passBy = (t, t0, dur, dist) => dist * sm(t0, t0 + dur, t);
// envelope after the latest of a list of hit times (0..1, decays with rate)
export const envAfter = (t, times, rate = 6) => { let last = -1; for (const x of times) if (x <= t) last = x; return last < 0 ? 0 : Math.exp(-(t - last) * rate); };

// ------------------------------------------------------------------------------------------------
// PARTICLES: flat unlit billboards, pure function of t on the GPU.
//   n, shape: 'disc'|'ring'|'tri'|'quad'|'stroke', billboard (default true), additive, opacity
//   init(i, rnd) -> { p:[x,y,z], v:[..], g:[..], t0, life, s (size m), c (colour hex), swirl (rad/s about y), freeze: [tA, tB] }
//   freeze: motion time stops between tA and tB (frozen bubbles), then continues.
const PV = /* glsl */ `
attribute vec3 aP, aV, aG, aC; attribute vec4 aT; // t0, life, size, swirl
attribute vec2 aF; // freeze window
uniform float uTime, uBill; varying vec2 vUv; varying vec3 vC; varying float vDepth;
void main() {
  float age = uTime - aT.x;
  float fz = clamp(min(uTime, aF.y) - aF.x, 0.0, aF.y - aF.x);
  float a = age - (aF.y > aF.x ? fz : 0.0);
  float vis = step(0.0, age) * step(age, aT.y);
  vec3 p = aP + aV * a + 0.5 * aG * a * a;
  float sw = aT.w * a; float cs = cos(sw), sn = sin(sw);
  p.xz = mat2(cs, -sn, sn, cs) * p.xz;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vec2 corner = position.xy * aT.z * vis;
  if (uBill > 0.5) mv.xy += corner; else mv = viewMatrix * modelMatrix * vec4(p + vec3(corner, 0.0), 1.0);
  vUv = uv; vC = aC; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const PF = /* glsl */ `
uniform float uShape, uOpacity, uFade, uSceneFade, uEdge; uniform vec3 uFogCol; uniform float uFogNear, uFogFar, uFogAmt;
varying vec2 vUv; varying vec3 vC; varying float vDepth;
void main() {
  vec2 q = vUv - 0.5; float r = length(q);
  float m = 1.0;
  if (uShape < 0.5) m = step(r, 0.5);                                   // disc
  else if (uShape < 1.5) m = step(r, 0.5) * step(0.36, r);              // ring
  else if (uShape < 2.5) m = step(abs(q.x) * 2.0, 1.0 - vUv.y);             // triangle
  else if (uShape < 3.5) m = 1.0;                                       // quad
  else m = step(abs(q.x), 0.12);                                        // stroke
  if (m < 0.5) discard;
  vec3 c = vC;
  float f = clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0) * uFogAmt;
  c = mix(c, uFogCol, f) * uFade * uSceneFade;
  float a = uOpacity * (1.0 - uEdge);
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
const SHAPES = { disc: 0, ring: 1, tri: 2, quad: 3, stroke: 4 };

export function particles(kit, o) {
  const n = o.n;
  const rnd = mulberry(o.seed ?? 1);
  const P = new Float32Array(n * 3), V = new Float32Array(n * 3), Gr = new Float32Array(n * 3), C = new Float32Array(n * 3), T = new Float32Array(n * 4), F = new Float32Array(n * 2);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const q = o.init(i, rnd);
    P.set(q.p || [0, 0, 0], i * 3); V.set(q.v || [0, 0, 0], i * 3); Gr.set(q.g || [0, 0, 0], i * 3);
    c.set(q.c ?? o.color ?? PAL.cream); C.set([c.r, c.g, c.b], i * 3);
    T.set([q.t0 ?? -1e5, q.life ?? 1e6, q.s ?? o.size ?? 0.1, q.swirl ?? 0], i * 4);
    F.set(q.freeze || [0, 0], i * 2);
  }
  const base = o.shape === 'stroke' ? new THREE.PlaneGeometry(0.35, 1.6) : new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute('position', base.getAttribute('position')); geo.setAttribute('uv', base.getAttribute('uv'));
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3));
  geo.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 3));
  geo.setAttribute('aG', new THREE.InstancedBufferAttribute(Gr, 3));
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 3));
  geo.setAttribute('aT', new THREE.InstancedBufferAttribute(T, 4));
  geo.setAttribute('aF', new THREE.InstancedBufferAttribute(F, 2));
  geo.instanceCount = n;
  const u = {
    uTime: U.uTime, uBill: { value: o.billboard === false ? 0 : 1 }, uShape: { value: SHAPES[o.shape ?? 'disc'] },
    uOpacity: { value: o.opacity ?? 1 }, uFade: U.uFade, uSceneFade: kit.SU.uSceneFade, uEdge: kit.SU.uEdge,
    uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uFogAmt: { value: o.fog ?? 1 },
  };
  const transparent = (o.opacity ?? 1) < 1 || !!o.additive;
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: u, vertexShader: PV, fragmentShader: PF, side: THREE.DoubleSide, transparent,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !transparent,
  }));
  mesh.frustumCulled = false;
  mesh.name = o.name || 'bb-particles';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// SHATTER: instanced flat triangle shards, GPU-driven (pure in t).
//   n, t0 (burst time), life (default 2.5), init(i, rnd) -> { p:[..] start, v:[..], axis:[..], spin (rad/s), s:[w,h] (m), c }
//   gravity (default -6), colors: palette list used when init gives no c
const SV = /* glsl */ `
attribute vec3 aP, aV, aAx, aC; attribute vec4 aS; // w, h, spin, delay
uniform float uTime, uT0, uLife, uGrav; varying vec3 vC; varying float vDepth; varying vec3 vN;
vec3 rot(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
void main() {
  float age = uTime - uT0 - aS.w;
  float vis = step(0.0, uTime - uT0) * step(age, uLife);
  float a = max(age, 0.0);
  vec3 lp = vec3(position.x * aS.x, position.y * aS.y, 0.0);
  vec3 k = normalize(aAx);
  lp = rot(lp, k, aS.z * a);
  vN = rot(vec3(0.0, 0.0, 1.0), k, aS.z * a);
  vec3 p = aP + aV * a + vec3(0.0, 0.5 * uGrav * a * a, 0.0) + lp * vis;
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vC = aC; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  if (vis < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // outside the clip volume
}`;
const SF = /* glsl */ `
uniform float uFade, uSceneFade; uniform vec3 uKey, uFogCol; uniform float uFogNear, uFogFar;
varying vec3 vC; varying float vDepth; varying vec3 vN;
void main() {
  float d = abs(dot(normalize(vN), normalize(uKey)));
  vec3 c = vC * (d > 0.5 ? 1.0 : 0.62);
  float f = clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0);
  gl_FragColor = vec4(mix(c, uFogCol, f) * uFade * uSceneFade, 1.0);
  #include <colorspace_fragment>
}`;
export function shards(kit, o) {
  const n = o.n ?? 60;
  const rnd = mulberry(o.seed ?? 3);
  const pal = o.colors || [PAL.cyan, PAL.teal, PAL.black];
  const P = new Float32Array(n * 3), V = new Float32Array(n * 3), AX = new Float32Array(n * 3), C = new Float32Array(n * 3), S = new Float32Array(n * 4);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const q = o.init(i, rnd);
    P.set(q.p, i * 3); V.set(q.v, i * 3); AX.set(q.axis || [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], i * 3);
    c.set(q.c ?? pal[Math.floor(rnd() * pal.length)]); C.set([c.r, c.g, c.b], i * 3);
    const s = q.s || [1, 1];
    S.set([s[0], s[1], q.spin ?? (rnd() - 0.5) * 6, q.delay ?? 0], i * 4);
  }
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.4, 0, 0.55, -0.5, 0, -0.05, 0.6, 0], 3));
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', tri.getAttribute('position'));
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3));
  geo.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 3));
  geo.setAttribute('aAx', new THREE.InstancedBufferAttribute(AX, 3));
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 3));
  geo.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4));
  geo.instanceCount = n;
  const u = {
    uTime: U.uTime, uT0: { value: o.t0 }, uLife: { value: o.life ?? 2.5 }, uGrav: { value: o.gravity ?? -6 },
    uFade: U.uFade, uSceneFade: kit.SU.uSceneFade, uKey: U.uKey, uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar,
  };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: SV, fragmentShader: SF, side: THREE.DoubleSide }));
  mesh.frustumCulled = false;
  mesh.name = o.name || 'bb-shards';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// PORTAL matte: a huge black plane with a hole. Everything behind the plane is hidden except what
// is seen through the hole. Place it at the portal frame; it must face the player (+z toward them).
//   shape: 'circle' (r) | 'rect' (w, h), size: half-extent of the matte (default 400), color (default black)
// The next world must sit behind the plane. Hide the matte the moment the frame passes the eyes.
export function matte(kit, o = {}) {
  const S = o.size ?? 400;
  const shape = new THREE.Shape();
  shape.moveTo(-S, -S); shape.lineTo(S, -S); shape.lineTo(S, S); shape.lineTo(-S, S); shape.lineTo(-S, -S);
  const hole = new THREE.Path();
  if ((o.shape ?? 'circle') === 'circle') hole.absarc(0, 0, o.r ?? 2, 0, Math.PI * 2, true);
  else { const w = (o.w ?? 2) / 2, h = (o.h ?? 3) / 2; hole.moveTo(-w, -h); hole.lineTo(-w, h); hole.lineTo(w, h); hole.lineTo(w, -h); hole.lineTo(-w, -h); }
  shape.holes.push(hole);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), new THREE.MeshBasicMaterial({ color: o.color ?? 0x000000, side: THREE.DoubleSide }));
  mesh.renderOrder = -5; // drawn early, writes depth: hides what is behind it
  mesh.name = 'bb-portal-matte';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// EDGE-MODE lines: crisp edges of a mesh/group (InstancedMesh instances are baked at call time),
// merged into one LineSegments in the object's parent space. Visibility/brightness via .u.uOn.
//   color (default cyan), threshold (deg, default 25)
const LV = /* glsl */ `varying float vDepth; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const LF = /* glsl */ `uniform vec3 uCol; uniform float uOn, uFade, uSceneFade; varying float vDepth;
void main(){ if (uOn < 0.003) discard; gl_FragColor = vec4(uCol * uOn * uFade, 1.0);
  #include <colorspace_fragment>
}`;
export function edges(kit, obj, o = {}) {
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.parent ? obj.parent.matrixWorld : new THREE.Matrix4()).invert();
  const out = [];
  const m = new THREE.Matrix4(), mi = new THREE.Matrix4();
  obj.traverse((ch) => {
    if (!ch.isMesh || !ch.geometry || ch.geometry.isInstancedBufferGeometry) return;
    const eg = new THREE.EdgesGeometry(ch.geometry, o.threshold ?? 25);
    const pa = eg.getAttribute('position');
    const count = ch.isInstancedMesh ? ch.count : 1;
    for (let k = 0; k < count; k++) {
      m.copy(inv).multiply(ch.matrixWorld);
      if (ch.isInstancedMesh) { ch.getMatrixAt(k, mi); m.multiply(mi); }
      const v = new THREE.Vector3();
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m); out.push(v.x, v.y, v.z); }
    }
    eg.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  const u = { uCol: { value: new THREE.Color(o.color ?? PAL.cyan) }, uOn: { value: 0 }, uFade: U.uFade, uSceneFade: kit.SU.uSceneFade };
  const lines = new THREE.LineSegments(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: LV, fragmentShader: LF }));
  lines.u = u;
  lines.name = 'bb-edges';
  lines.frustumCulled = false;
  return lines;
}
