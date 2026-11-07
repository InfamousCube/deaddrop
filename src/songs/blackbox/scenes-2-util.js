// Helpers for scene group 2 (S06-S09, round 3). Pure functions and build-time geometry builders only.
// Shape language (STORYBOARD-v3 section 3): real parts from 2D profiles. Lathe for round parts, extrude
// with bevel for flat-profiled parts, tubes for cables and arms, gears with real teeth.
import * as THREE from 'three';

export const D2R = Math.PI / 180;
export const EYE = 1.6;
export const BEAT = 60 / 105.74;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const env = (t, tp, rate = 6) => (t < tp ? 0 : Math.exp(-(t - tp) * rate));
export const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const lerp = (a, b, k) => a + (b - a) * k;

// start time of word i of the sung phrase nearest `near` (words.json), so word fixes reach every beat
export function wt(kit, phrase, near, i = 0) {
  const m = kit.words.match(phrase, near);
  return m ? m[Math.min(i, m.length - 1)].s : near + i * 0.3;
}

// transform a geometry in place: position p, euler r (XYZ), scale s (number or [x, y, z])
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function xf(g, p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  _e.set(r[0], r[1], r[2], 'XYZ');
  _q.setFromEuler(_e);
  if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.set(s, s, s);
  g.applyMatrix4(_m.compose(_p.set(p[0], p[1], p[2]), _q, _s));
  return g;
}

// merge geometries (position, normal, optional colour; uv dropped)
export function merge(list) {
  const geos = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.getAttribute('normal')) n.computeVertexNormals();
    return n;
  });
  const total = geos.reduce((s, g) => s + g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3).fill(1);
  let o = 0, anyCol = false;
  for (const g of geos) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), c = g.getAttribute('color');
    pos.set(p.array, o * 3);
    nor.set(n.array, o * 3);
    if (c) { col.set(c.array, o * 3); anyCol = true; }
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (anyCol) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

// paint a constant vertex colour (for merged multi-colour meshes)
export function paint(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(hex), n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

export const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
export const lathe = (pts, seg = 16, p0 = 0, pl = Math.PI * 2) => new THREE.LatheGeometry(V2(pts), seg, p0, pl);
// extrude a shape, centred in depth on z = 0, bevel in metres
export function ext(shape, depth, bevel = 0.04, curve = 6, segs = 1) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: segs, curveSegments: curve,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
export const tube = (pts, r, seg = 24, radial = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, radial, false);
export const cyl = (r0, r1, h, seg = 12) => new THREE.CylinderGeometry(r1, r0, h, seg, 1);

export function shapeOf(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}
export function circlePath(r, n = 32, cx = 0, cy = 0, P = new THREE.Path()) {
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (i) P.lineTo(x, y); else P.moveTo(x, y); }
  return P;
}
// annulus (flat ring) as a shape
export function ringShape(r0, r1, n = 48) {
  const s = circlePath(r1, n, 0, 0, new THREE.Shape());
  s.holes.push(circlePath(r0, n));
  return s;
}
export function roundRect(w, h, r, cx = 0, cy = 0, P = new THREE.Shape()) {
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  P.moveTo(x0 + r, y0); P.lineTo(x1 - r, y0); P.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  P.lineTo(x1, y1 - r); P.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  P.lineTo(x0 + r, y1); P.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  P.lineTo(x0, y0 + r); P.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return P;
}
// arch: rectangle with a semicircular top (base at y = 0)
export function archPts(w, h, n = 14) {
  const r = w / 2, pts = [[-r, 0], [r, 0], [r, h - r]];
  for (let i = 1; i < n; i++) { const a = (i / n) * Math.PI; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
  pts.push([-r, h - r]);
  return pts;
}

// GEAR: real teeth (trapezoid, or sawtooth for an escape wheel), rim, spoke windows, hub boss with a bolt
// circle. Lies in the xy plane, axis z, centred.
export function gearGeo({ r, teeth, th = r * 0.1, thick = 0.5, spokes = 6, rim = r * 0.13, hub = r * 0.2, saw = false, bevel = 0.05, bolts = 6 }) {
  const s = new THREE.Shape(), p = (Math.PI * 2) / teeth, rr = r - th;
  let first = true;
  for (let i = 0; i < teeth; i++) {
    const a = i * p;
    const pts = saw ? [[rr, a], [r, a + 0.6 * p], [r, a + 0.7 * p], [rr, a + 0.76 * p]]
      : [[rr, a - 0.3 * p], [r, a - 0.13 * p], [r, a + 0.13 * p], [rr, a + 0.3 * p]];
    for (const [R, A] of pts) { const x = R * Math.cos(A), y = R * Math.sin(A); if (first) { s.moveTo(x, y); first = false; } else s.lineTo(x, y); }
  }
  s.closePath();
  const ro = rr - rim, ri = hub * 1.35, sw = Math.max(r * 0.09, 0.12);
  if (spokes > 0 && ro > ri + 0.1) {
    for (let k = 0; k < spokes; k++) {
      const base = (k / spokes) * Math.PI * 2, step = (Math.PI * 2) / spokes;
      const ao0 = base + Math.asin(sw / 2 / ro), ao1 = base + step - Math.asin(sw / 2 / ro);
      const ai0 = base + Math.asin(Math.min(0.95, sw / 2 / ri)), ai1 = base + step - Math.asin(Math.min(0.95, sw / 2 / ri));
      if (ai1 <= ai0) continue;
      const P = new THREE.Path(), n = 8;
      for (let i = 0; i <= n; i++) { const a = ao0 + ((ao1 - ao0) * i) / n; const x = Math.cos(a) * ro, y = Math.sin(a) * ro; if (i) P.lineTo(x, y); else P.moveTo(x, y); }
      for (let i = 0; i <= 3; i++) { const a = ai1 + ((ai0 - ai1) * i) / 3; P.lineTo(Math.cos(a) * ri, Math.sin(a) * ri); }
      P.closePath();
      s.holes.push(P);
    }
  }
  const parts = [ext(s, thick, bevel, 2, 1)];
  parts.push(xf(cyl(hub, hub, thick * 1.7, 14), [0, 0, 0], [Math.PI / 2, 0, 0]));
  for (let b = 0; b < bolts; b++) {
    const a = (b / bolts) * Math.PI * 2 + 0.3;
    parts.push(xf(cyl(hub * 0.13, hub * 0.13, thick * 1.7 + 0.12, 6), [Math.cos(a) * hub * 0.66, Math.sin(a) * hub * 0.66, 0], [Math.PI / 2, 0, 0]));
  }
  return merge(parts);
}

// ANGEL STATUE (unit height 2.6 at s = 1; stands on y = 0, faces +z). Returns separate parts so the spy
// statue can turn her head and drop her halo.
export function angelParts() {
  const plinth = lathe([[0, 0], [0.5, 0], [0.5, 0.1], [0.44, 0.15], [0, 0.15]], 14);
  const robe = lathe([[0, 0.15], [0.5, 0.15], [0.53, 0.22], [0.45, 0.6], [0.34, 1.1], [0.27, 1.42], [0.25, 1.62], [0.3, 1.8], [0.33, 1.88], [0.27, 1.97], [0.09, 2.01], [0.08, 2.08], [0, 2.08]], 14);
  const arms = [1, -1].map((sx) => tube([[0.3 * sx, 1.84, 0], [0.35 * sx, 1.55, 0.1], [0.06 * sx, 1.5, 0.28]], 0.07, 10, 6));
  const hands = xf(new THREE.SphereGeometry(0.09, 8, 6), [0, 1.5, 0.31], [0, 0, 0], [1.5, 0.95, 0.9]);
  const wing = shapeOf([[0, 1.92], [0.18, 2.24], [0.42, 2.32], [0.62, 2.14], [0.67, 1.86], [0.6, 1.62], [0.5, 1.63], [0.55, 1.32], [0.42, 1.3], [0.45, 0.98], [0.3, 0.95], [0.31, 0.6], [0.16, 0.68], [0.06, 1.2], [0, 1.6]]);
  const wings = [1, -1].map((sx) => xf(xf(ext(wing, 0.07, 0.02, 4), [0, 0, 0], [0, Math.PI / 2, 0]), [0.2 * sx, 0, -0.1], [0, -0.45 * sx, 0]));
  const body = merge([plinth, robe, ...arms, hands, ...wings]);
  const head = merge([
    new THREE.SphereGeometry(0.15, 10, 8).translate(0, 2.2, 0),
    lathe([[0, 2.39], [0.1, 2.38], [0.17, 2.32], [0.195, 2.2], [0.19, 2.08], [0.15, 2.05]], 14, Math.PI * 0.32, Math.PI * 1.36),
    lathe([[0, 2.39], [0.1, 2.38], [0.165, 2.31], [0.175, 2.26]], 8, -Math.PI * 0.36, Math.PI * 0.72),
  ]);
  const face = xf(new THREE.SphereGeometry(0.13, 10, 8), [0, 2.18, 0.085], [0, 0, 0], [0.85, 1.05, 0.55]);
  const halo = xf(new THREE.TorusGeometry(0.21, 0.045, 6, 22), [0, 2.58, -0.04], [Math.PI / 2 - 0.25, 0, 0]);
  return { body, head, face, halo };
}

// THE ENGINEER as a dancer (unit: a 1.7 m woman; scale on placement). Floor-length A-line gown, bodice,
// bare shoulders, black bob, long black gloves, white round glasses. Waltz pose: left arm raised, right
// arm reaching out. Faces +z.
export function ladyParts() {
  const gown = lathe([[0, 0], [0.62, 0], [0.6, 0.06], [0.44, 0.45], [0.27, 0.9], [0.16, 1.04], [0.17, 1.18], [0.2, 1.31], [0.17, 1.37], [0, 1.37]], 18);
  const skin = merge([
    lathe([[0, 1.35], [0.17, 1.35], [0.205, 1.4], [0.19, 1.44], [0.07, 1.47], [0.055, 1.53], [0, 1.53]], 14),
    xf(new THREE.SphereGeometry(0.1, 10, 8), [0, 1.61, 0.01], [0, 0, 0], [0.85, 1.08, 0.92]),
    tube([[0.19, 1.42, 0], [0.31, 1.44, 0.04], [0.4, 1.44, 0.07]], 0.04, 6, 6),
    tube([[-0.19, 1.42, 0], [-0.27, 1.55, 0.0], [-0.3, 1.66, 0.0]], 0.04, 6, 6),
  ]);
  const black = merge([
    lathe([[0, 1.74], [0.07, 1.735], [0.115, 1.69], [0.13, 1.6], [0.125, 1.52], [0.1, 1.5]], 14, Math.PI * 0.3, Math.PI * 1.4),
    lathe([[0, 1.74], [0.07, 1.735], [0.11, 1.69], [0.115, 1.66]], 8, -Math.PI * 0.32, Math.PI * 0.64),
    tube([[0.4, 1.44, 0.07], [0.52, 1.47, 0.1], [0.62, 1.52, 0.12]], 0.034, 8, 6),
    xf(new THREE.SphereGeometry(0.045, 6, 5), [0.66, 1.53, 0.13], [0, 0, 0], [1.6, 0.7, 1]),
    tube([[-0.3, 1.66, 0], [-0.24, 1.82, 0.02], [-0.1, 1.9, 0.03]], 0.034, 8, 6),
    xf(new THREE.SphereGeometry(0.045, 6, 5), [-0.06, 1.91, 0.03], [0, 0, 0], [1.4, 0.8, 1]),
  ]);
  const glasses = merge([-1, 1].map((sx) => xf(new THREE.TorusGeometry(0.03, 0.009, 4, 12), [0.038 * sx, 1.625, 0.095])));
  return { gown, skin, black, glasses };
}
