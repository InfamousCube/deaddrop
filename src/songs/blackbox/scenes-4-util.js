// Small shared helpers for group 4 (scenes-4-*.js). No state, no allocation in the per-frame helpers.
import * as THREE from 'three';

export const D2R = Math.PI / 180;
export const EYE = new THREE.Vector3(0, 1.6, 0.05);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export const tmpC = new THREE.Color();
const tmpC2 = new THREE.Color();
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lin = (a, b, t) => clamp01((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const envAt = (t, a, rate = 6) => (t < a ? 0 : Math.exp(-(t - a) * rate));
// float literal for GLSL templates
export const f = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));

export function inst(geo, mat, n, name) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.frustumCulled = false;
  if (name) m.name = name;
  return m;
}
export function setM(mesh, i, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, order = 'XYZ') {
  _e.set(rx, ry, rz, order); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
}
export function setMQ(mesh, i, p, q, sx, sy, sz) { _s.set(sx, sy, sz); _m.compose(p, q, _s); mesh.setMatrixAt(i, _m); }
export function initColors(mesh, n, c = 0xffffff) {
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  for (let i = 0; i < n; i++) mesh.setColorAt(i, tmpC.set(c));
  return mesh;
}
export function setC(mesh, i, hex, k = 1) { tmpC.set(hex); if (k !== 1) tmpC.multiplyScalar(k); mesh.setColorAt(i, tmpC); }
export function mixC(mesh, i, a, b, k) { tmpC.set(a).lerp(tmpC2.set(b), clamp01(k)); mesh.setColorAt(i, tmpC); }
export function lerpCol(out, a, b, k) { return out.set(a).lerp(tmpC2.set(b), clamp01(k)); }

export function boxAt(w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  g.translate(x, y, z);
  return g;
}
export function shapeGeo(pts, scale = 1) {
  const sh = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x * scale, y * scale) : sh.moveTo(x * scale, y * scale)));
  return new THREE.ShapeGeometry(sh);
}
// left half outline (bottom -> top, ending on x = 0) mirrored into a closed symmetric outline
export function mirrorOutline(left) {
  const right = left.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  return [...left, ...right];
}
// a 2D crescent (smile) as a closed outline: outer arc below, inner arc back
export function crescent(w, h, thick, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * (1 + i / n); pts.push([Math.cos(a) * w, Math.sin(a) * h]); }
  for (let i = n; i >= 0; i--) { const a = Math.PI * (1 + i / n); pts.push([Math.cos(a) * w * 0.86, Math.sin(a) * (h - thick)]); }
  return pts;
}
// width profile (array of [s, w] keys, s 0..1) resampled to n stations
export function profile(keys, n = 24) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    let k = 0;
    while (k < keys.length - 2 && keys[k + 1][0] < s) k++;
    const [s0, w0] = keys[k], [s1, w1] = keys[k + 1];
    out[i] = w0 + (w1 - w0) * clamp01((s - s0) / Math.max(1e-6, s1 - s0));
  }
  return out;
}
// clip a makeText geometry to the horizontal band [b0, b1] (local metres) in place (shredded strips)
export function clipBand(geo, b0, b1, slant) {
  const P = geo.getAttribute('position'), UV = geo.getAttribute('uv');
  for (let q = 0; q + 3 < P.count; q += 4) {
    const yB = P.getY(q), yT = P.getY(q + 3), vB = UV.getY(q), vT = UV.getY(q + 3);
    const nb = Math.min(Math.max(yB, b0), b1), nt = Math.max(Math.min(yT, b1), b0);
    const set = (i, ny, from) => {
      P.setX(i, P.getX(i) + (ny - from) * slant); P.setY(i, ny);
      UV.setY(i, vB + (vT - vB) * ((ny - yB) / Math.max(1e-6, yT - yB)));
    };
    set(q, nb, yB); set(q + 1, nb, yB); set(q + 2, nt, yT); set(q + 3, nt, yT);
  }
  P.needsUpdate = true; UV.needsUpdate = true;
  geo.computeBoundingSphere();
}

// ---------------------------------------------------------------------------------------------
// Sung word times for group 4 blocks. STORYBOARD-v3 section 2 corrects 13 word times of the bridge
// (both 3-2-1 countdowns, "never here", "Lights"). The fix belongs in words.json (integrator); until
// it lands there, a time that still equals the old words.json value is mapped to the corrected one,
// so the show is right with either file. Once words.json carries the new times this table is inert.
const FIX = new Map([
  [112.62, 114.29], [114.6, 115.39], [115.9, 116.56],                     // L28 three two one
  [118.02, 118.33], [118.54, 118.91],                                     // L29 never here
  [118.68, 119.95], [119.2, 121.16], [119.5, 122.27],                     // L30 three two one
  [119.56, 123.15], [122.3, 123.5], [122.6, 123.85], [123.0, 124.35],     // L31 you were never here
  [124.94, 125.7],                                                        // L32 Lights
]);
const fixT = (s) => { for (const [o, n] of FIX) if (Math.abs(s - o) < 0.005) return n; return s; };
const normW = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '').replace(/'/g, '');
// start times of the sung phrase (consecutive words) whose corrected first word is nearest `near`
export function sung(kit, phrase, near) {
  const want = phrase.split(/\s+/).map(normW);
  const flat = [];
  for (const l of kit.words.lines) for (const [w, s] of l.w) flat.push([normW(w), s]);
  let best = null, bd = Infinity;
  for (let i = 0; i + want.length <= flat.length; i++) {
    let ok = true;
    for (let j = 0; j < want.length && ok; j++) ok = flat[i + j][0] === want[j];
    if (!ok) continue;
    const ts = want.map((_, j) => fixT(flat[i + j][1]));
    const dd = Math.abs(ts[0] - near);
    if (dd < bd) { bd = dd; best = ts; }
  }
  return best || want.map((_, j) => near + j * 0.3);
}
