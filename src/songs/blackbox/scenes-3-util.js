// Small helpers shared by the group-3 scenes (S10-S13). No state, no allocation per call.
import * as THREE from 'three';
import { PAL } from './style.js';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const easeIn = (k) => { k = clamp01(k); return k * k * k; };
export const easeOut = (k) => { k = clamp01(k); return 1 - Math.pow(1 - k, 3); };
export const easeInOut = (k) => { k = clamp01(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const env = (t, t0, rate = 6) => (t < t0 ? 0 : Math.exp(-(t - t0) * rate));

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export const TMP = { m: _m, q: _q, p: _p, s: _s, e: _e, c: new THREE.Color(), v: new THREE.Vector3(), w: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };

// instance i of mesh: position, Euler (YXZ) rotation, scale
export function setI(mesh, i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
  return _m;
}
// instance from position + quaternion + scale
export function setIQ(mesh, i, p, q, sx, sy, sz) { _s.set(sx, sy, sz); _m.compose(p, q, _s); mesh.setMatrixAt(i, _m); }

export function inst(geo, mat, n, name) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.frustumCulled = false;
  if (name) m.name = name;
  const z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) m.setMatrixAt(i, z);
  return m;
}
export function instColors(mesh, col = 0xffffff) {
  const c = new THREE.Color(col), a = new Float32Array(mesh.count * 3);
  for (let i = 0; i < mesh.count; i++) a.set([c.r, c.g, c.b], i * 3);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(a, 3);
  return mesh;
}
export function setC(mesh, i, hex, k = 1) { TMP.c.set(hex).multiplyScalar(k); mesh.setColorAt(i, TMP.c); }

// flat-faceted copy of a geometry (non-indexed, face normals)
export function facet(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }

// merge parts [{ g, c }] (c: grey 0..1 or hex) into one non-indexed geometry with flat normals and a colour attribute
export function merge(parts) {
  const gs = parts.map((p) => { const g = facet(p.g.clone ? p.g : p.g); return { g, c: p.c ?? 1 }; });
  const total = gs.reduce((s, x) => s + x.g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  const c = new THREE.Color();
  let o = 0;
  for (const { g, c: cc } of gs) {
    const P = g.getAttribute('position'), N = g.getAttribute('normal');
    pos.set(P.array, o * 3); nor.set(N.array, o * 3);
    if (typeof cc === 'number' && cc <= 1) c.setRGB(cc, cc, cc); else c.set(cc);
    for (let i = 0; i < P.count; i++) col.set([c.r, c.g, c.b], (o + i) * 3);
    o += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

export const box = (w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d); if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz); return g.translate(x, y, z);
};
export const disc = (r, seg, x = 0, y = 0, z = 0) => new THREE.CircleGeometry(r, seg).translate(x, y, z);
export const ring = (r0, r1, seg, x = 0, y = 0, z = 0) => new THREE.RingGeometry(r0, r1, seg).translate(x, y, z);
export const ball = (r, w, h, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, w, h).scale(sx, sy, sz).translate(x, y, z);
export const shape = (pts, sc = 1, x = 0, y = 0) => {
  const s = new THREE.Shape(); pts.forEach(([a, b], i) => (i ? s.lineTo(a * sc + x, b * sc + y) : s.moveTo(a * sc + x, b * sc + y)));
  return new THREE.ShapeGeometry(s);
};

// scale a text object down so its widest line fits maxW metres (in its own space)
export function fitText(T, maxW) {
  const lines = {};
  for (const w of T.words) { const L = lines[w.line] || (lines[w.line] = [Infinity, -Infinity]); L[0] = Math.min(L[0], w.x0); L[1] = Math.max(L[1], w.x1); }
  let wd = 0; for (const k in lines) wd = Math.max(wd, lines[k][1] - lines[k][0]);
  const k = wd > maxW ? maxW / wd : 1;
  T.mesh.scale.setScalar(k);
  return k;
}

// the hot sunburst sky as overrides (for scenes whose base preset is not 'hot')
export const HOT_SKY = { zen: PAL.velvet, hor2: PAL.carmineDeep, hor: PAL.carmine, nadir: PAL.velvet, rayA: PAL.crimson, rayB: PAL.carmineDeep, ringCol: PAL.gold, rays: 1, rayR: 1.45, rings: 1 };

// common GLSL bits for the custom surfaces (fog + fades)
export const FOG_U = /* glsl */ `uniform vec3 uFogCol; uniform float uFogNear, uFogFar, uFade, uSceneFade;`;
export const FOG_APPLY = /* glsl */ `c = mix(c, uFogCol, clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0)) * uFade * uSceneFade;`;
export function fogUniforms(kit) {
  const U = kit.U;
  return { uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uFade: U.uFade, uSceneFade: kit.SU.uSceneFade, uTime: U.uTime, uKey: U.uKey };
}
export const WORLD_V = /* glsl */ `varying vec3 vW; varying float vDepth;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
