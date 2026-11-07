// Group 1 helpers (S01-S05, round 3). Geometry from real profiles (lathe, bevelled extrude, tube),
// instancing helpers, the shared S03-S05 travel path, the S02 -> S03 rolling ball, and three
// builders other groups may import read-only:
//   buildTelegraphLine(kit, opts)  S01 / S18: two rows of 9 m poles with crossarms, glass insulators, sagging wires
//   buildQueenCard(kit, opts)      S01 / S18: the 7.2 x 10 m Queen card, angel on the front, spy on the back
//   buildCar(kit, opts)            S03 / S11: the black 60s GT coupe (lofted body, wire wheels, round headlights)
import * as THREE from 'three';
import { PAL, flatShade } from './style.js';
import { mergeSimple } from './kit.js';

export const EYE = new THREE.Vector3(0, 1.6, 0.05);
export const D2R = Math.PI / 180;
export const merge = (list) => mergeSimple(list);

// scratch objects for instance updates (never allocate in update)
export function scratch() {
  return { m: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), v: new THREE.Vector3(), v2: new THREE.Vector3(), e: new THREE.Euler(), c: new THREE.Color(), c2: new THREE.Color(), ax: new THREE.Vector3() };
}

// ---------------------------------------------------------------------------------------------- geometry
// lathe from [r, y] pairs (bottom to top), faceted
export function lathe(pts, seg = 12, phi = 0, len = Math.PI * 2) {
  return flatShade(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg, phi, len));
}
// bevelled extrusion of a THREE.Shape, centred on z
export function ext(shape, depth, bevel = 0.04, segs = 1, curve = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments: curve });
  g.translate(0, 0, -depth / 2);
  return flatShade(g);
}
export function flatShape(shape, curve = 16) { return new THREE.ShapeGeometry(shape, curve); }
// tube along points
export function tube(points, r, tubSeg = 16, radSeg = 5, closed = false) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), closed, 'centripetal');
  return flatShade(new THREE.TubeGeometry(c, tubSeg, r, radSeg, closed));
}
export function roundRect(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function rrPath(w, h, r, cx = 0, cy = 0) { // same outline as a hole path (reversed)
  const p = new THREE.Path(), x = cx - w / 2, y = cy - h / 2;
  p.moveTo(x + r, y); p.quadraticCurveTo(x, y, x, y + r); p.lineTo(x, y + h - r); p.quadraticCurveTo(x, y + h, x + r, y + h);
  p.lineTo(x + w - r, y + h); p.quadraticCurveTo(x + w, y + h, x + w, y + h - r); p.lineTo(x + w, y + r);
  p.quadraticCurveTo(x + w, y, x + w - r, y); p.lineTo(x + r, y);
  return p;
}
// round-topped arch (bottom at y0, width w, total height h), as shape or hole path
export function archPts(w, h, y0 = 0, n = 14) {
  const r = w / 2, yc = y0 + h - r, pts = [[-r, y0], [r, y0], [r, yc]];
  for (let i = 1; i < n; i++) { const a = (i / n) * Math.PI; pts.push([Math.cos(a) * r, yc + Math.sin(a) * r]); }
  pts.push([-r, yc]);
  return pts;
}
export function polyShape(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; }
export function polyPath(pts) { const s = new THREE.Path(); const q = pts.slice().reverse(); s.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) s.lineTo(q[i][0], q[i][1]); s.closePath(); return s; }
export function heartShape(s = 1, cx = 0, cy = 0) {
  const h = new THREE.Shape();
  h.moveTo(cx, cy - 0.5 * s);
  h.bezierCurveTo(cx - 0.12 * s, cy - 0.3 * s, cx - 0.55 * s, cy - 0.05 * s, cx - 0.5 * s, cy + 0.22 * s);
  h.bezierCurveTo(cx - 0.45 * s, cy + 0.52 * s, cx - 0.08 * s, cy + 0.55 * s, cx, cy + 0.3 * s);
  h.bezierCurveTo(cx + 0.08 * s, cy + 0.55 * s, cx + 0.45 * s, cy + 0.52 * s, cx + 0.5 * s, cy + 0.22 * s);
  h.bezierCurveTo(cx + 0.55 * s, cy - 0.05 * s, cx + 0.12 * s, cy - 0.3 * s, cx, cy - 0.5 * s);
  return h;
}
// ellipse polygon points
export function ellPts(rx, ry, cx = 0, cy = 0, n = 24, a0 = 0, a1 = Math.PI * 2) {
  const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
// a thick crescent (arc band) from angle a0 to a1 (radians), radius r, thickness th
export function arcBand(r, th, a0, a1, cx = 0, cy = 0, n = 10) {
  const o = ellPts(r + th / 2, r + th / 2, cx, cy, n, a0, a1), i = ellPts(r - th / 2, r - th / 2, cx, cy, n, a1, a0);
  return polyShape(o.concat(i));
}
// gear with real teeth (trapezoid teeth), hole radius rh
export function gearShape(r, teeth, depth = 0.12, rh = 0) {
  const s = new THREE.Shape(), n = teeth * 4, rt = r, rr = r * (1 - depth);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = i % 4, rad = k === 1 || k === 2 ? rt : rr;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  if (rh > 0) s.holes.push(polyPath(ellPts(rh, rh, 0, 0, 20).slice(0, 20)));
  return s;
}

// ---------------------------------------------------------------------------------------------- instancing
export function inst(geo, mat, n, name) { const m = new THREE.InstancedMesh(geo, mat, n); m.name = name || ''; m.frustumCulled = false; return m; }
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
export function setM(mesh, i, x, y, z, ry = 0, sc = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z);
  if (Array.isArray(sc)) _s.set(sc[0], sc[1], sc[2]); else _s.set(sc, sc, sc);
  mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
}
export function colorsOf(mesh, hex) { const c = new THREE.Color(hex); for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, c); mesh.instanceColor.needsUpdate = true; }

// ---------------------------------------------------------------------------------------------- shared paths
// S03-S05 share one forward glide (path metres P since 17.2), so the hotel door (S03 -> S04) and the
// hall end (S04 -> S05) line up exactly. Never above 4 m/s, every ease >= 1 s.
export const PATH_KEYS = [[17.2, 0, 0.01], [17.21, 3, 1.2], [20.6, 1.6, 1.4], [22.4, 4, 1.0], [26.6, 0.5, 1.4], [28.1, 3, 1.2], [33.4, 1, 2.0]];
export const T_DOOR = 25.2; // the player passes the hotel door (S03 -> S04)
// S03: the street sinks from 3.4 m below street level to eye height 1.6 above it (<= 1.5 m/s)
export const STREET_Y0 = -3.4;
export function streetY(t) { const k = Math.min(1, Math.max(0, (t - 17.2) / 2.3)); return STREET_Y0 * (1 - k * k * (3 - 2 * k)); }

// S02 -> S03: the gold ball hops out of the 0 pocket (world 0, -4.05, -8.3) at 16.0, arcs over the dark rim,
// lands on the street (y -3.4 + r) and rolls under the waiting car (x -3.5, z -18.6) by 17.2.
export const BALL_R = 0.45;
export function ballOut(t, out) {
  if (t < 16.0) { out.set(0, -4.05, -8.3); return out; }
  if (t < 16.55) {
    const k = (t - 16.0) / 0.55;
    out.set(0, -4.05 + (STREET_Y0 + BALL_R + 4.05) * k + 3.6 * 4 * k * (1 - k), -8.3 - 5.7 * k);
    return out;
  }
  const k = Math.min(1, (t - 16.55) / 0.65), e = 1 - (1 - k) * (1 - k);
  out.set(-3.5 * e * e, STREET_Y0 + BALL_R, -14 - 4.6 * e);
  return out;
}

// ---------------------------------------------------------------------------------------------- telegraph line
// Two rows of real telegraph poles (9 m, 8-sided taper, 2 crossarms with braces, 4 glass insulators per
// arm, a cap) at x = +-gap, every `spacing` m from z0 forward; 4 sagging wires per row overhead.
// opts: { gap 4, spacing 10, count 11, z0 20, height 9, wireR 0.05, sag 0.35, insR 1 (insulator scale) }
// Returns { group, poles, ins, wires, wireAt(row, wire, z, out) (row 0 = left, 1 = right; wire 0 = innermost), crossY, n }
export function buildTelegraphLine(kit, o = {}) {
  const gap = o.gap ?? 4, sp = o.spacing ?? 10, n = o.count ?? 11, z0 = o.z0 ?? 20, H = o.height ?? 9;
  const g = new THREE.Group();
  const armY = [H - 0.55, H - 1.35], armW = 2.4;
  const pole = lathe([[0.2, -0.5], [0.19, 0], [0.165, H * 0.5], [0.13, H - 0.2], [0.14, H - 0.1], [0.06, H + 0.15], [0.0, H + 0.2]], 8);
  const parts = [pole];
  const armShape = polyShape([[-armW / 2, -0.06], [armW / 2, -0.06], [armW / 2 + 0.04, 0.0], [armW / 2, 0.06], [-armW / 2, 0.06], [-armW / 2 - 0.04, 0]]);
  for (const y of armY) {
    const arm = ext(armShape, 0.1, 0.015, 1, 2); arm.translate(0, y, 0); parts.push(arm);
    for (const sx of [-1, 1]) parts.push(tube([[0, y - 0.9, 0.02], [sx * 0.45, y - 0.45, 0.02], [sx * 0.8, y - 0.06, 0.02]], 0.035, 3, 4));
  }
  const poleGeo = merge(parts);
  const mat = kit.toon({ ramp: o.ramp ?? 'black', rim: o.rim ?? 'world', rimTh: o.rimTh ?? 0.4 });
  const poles = inst(poleGeo, mat, n * 2, 'tl-poles');
  // insulator: a glass bell with two drip skirts on a pin
  const s = o.insR ?? 1;
  const insGeo = lathe([[0.0, 0], [0.03 * s, 0], [0.03 * s, 0.06 * s], [0.13 * s, 0.07 * s], [0.1 * s, 0.12 * s], [0.12 * s, 0.14 * s], [0.085 * s, 0.22 * s], [0.06 * s, 0.3 * s], [0, 0.32 * s]], 8);
  const ins = inst(insGeo, kit.toon({ ramp: o.insRamp ?? 'cream', rim: null }), n * 2 * 8, 'tl-ins');
  const wireX = [-1.05, -0.4, 0.4, 1.05]; // along an arm, innermost first for the right row reversed below
  let k = 0;
  for (let i = 0; i < n; i++) for (let row = 0; row < 2; row++) {
    const x = row ? gap : -gap, z = z0 - i * sp;
    setM(poles, i * 2 + row, x, 0, z);
    for (const y of armY) for (const wx of wireX) setM(ins, k++, x + wx, y + 0.06, z);
  }
  // wires: for each row, 4 wires (top arm, positions sorted innermost first), catenary spans merged in one mesh
  const wGeo = [], wr = o.wireR ?? 0.05, sag = o.sag ?? 0.35;
  const wireDef = []; // [row][w] = { x, y }
  for (let row = 0; row < 2; row++) {
    const x0 = row ? gap : -gap, list = [];
    for (const wx of wireX) list.push({ x: x0 + wx, y: armY[0] + 0.32 * s });
    list.sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
    wireDef.push(list);
    for (const w of list) for (let i = 0; i < n - 1; i++) {
      const za = z0 - i * sp, zb = za - sp, pts = [];
      for (let j = 0; j <= 6; j++) { const u = j / 6; pts.push([w.x, w.y - sag * 4 * u * (1 - u), za + (zb - za) * u]); }
      wGeo.push(tube(pts, wr, 6, 4));
    }
  }
  const wires = new THREE.Mesh(merge(wGeo), kit.toon({ ramp: 'black', rim: o.rim ?? 'world', rimTh: 0.3 }));
  wires.name = 'tl-wires';
  g.add(poles, ins, wires);
  const wireAt = (row, w, z, out) => {
    const d = wireDef[row][w], u = (((z0 - z) % sp) + sp) % sp / sp;
    return out.set(d.x, d.y - sag * 4 * u * (1 - u), z);
  };
  return { group: g, poles, ins, wires, wireAt, crossY: armY[0], n, z0, spacing: sp, gap };
}

// ---------------------------------------------------------------------------------------------- the woman
// bust outlines in card units (1 = 1 m on the 7.2 x 10 card); head centre at (0, 0.9)
const SHOULDERS = [[0, -2.2], [1.85, -2.2], [1.9, -1.6], [1.7, -1.0], [1.15, -0.62], [0.55, -0.42], [0.4, -0.1], [0.0, -0.08]];
const COLLAR_UP = [[0, -1.3], [0.62, -0.72], [0.95, 0.15], [0.62, -0.15], [0.36, -0.08], [0, -0.35]]; // spy's upturned collar (right half)
const mirrorX = (half) => { const out = half.slice(); for (let i = half.length - 1; i >= 0; i--) if (Math.abs(half[i][0]) > 1e-4) out.push([-half[i][0], half[i][1]]); return out; };
// a sharp bob: helmet with a straight fringe, pointed ends at the jaw
const BOB = mirrorX([[0, 2.05], [0.55, 1.97], [0.9, 1.68], [1.02, 1.2], [1.02, 0.55], [1.12, 0.22], [0.72, 0.42], [0.66, 0.9], [0, 0.95]]);
function faceShape() { // oval face under a straight fringe at y 1.32 (head centre 0, 0.9)
  const pts = [], a0 = Math.asin((1.32 - 0.9) / 0.86);
  for (let i = 0; i <= 20; i++) { const a = a0 - (i / 20) * (Math.PI + 2 * a0); pts.push([Math.cos(a) * 0.66, 0.9 + Math.sin(a) * 0.86]); }
  return polyShape(pts);
}
export function busts(kit) {
  return { shoulders: polyShape(mirrorX(SHOULDERS)), bob: polyShape(BOB), face: faceShape(), collarUp: polyShape(mirrorX(COLLAR_UP)) };
}
// full standing figure, front view, feet at 0, 1.75 m (bob, high collar, coat, long gloves)
const FIG = [[0, 1.75], [0.085, 1.735], [0.135, 1.69], [0.16, 1.61], [0.165, 1.52], [0.172, 1.455], [0.11, 1.47], [0.075, 1.43],
  [0.085, 1.4], [0.12, 1.355], [0.235, 1.33], [0.275, 1.27], [0.29, 1.08], [0.3, 0.86], [0.285, 0.78], [0.235, 0.79],
  [0.218, 1.0], [0.212, 1.17], [0.172, 0.99], [0.24, 0.52], [0.13, 0.06], [0.15, 0], [0.04, 0], [0.03, 0.55], [0, 0.6]];
export const figureShape = () => polyShape(mirrorX(FIG));

// ---------------------------------------------------------------------------------------------- Queen card
// 7.2 x 10 x 0.16 m, corner radius 0.5. Front (+z): cream face, crimson inset border, Q + heart pip in two
// corners, her bust (black bob, cream face, closed smiling eyes, gold halo, heart brooch). Back (-z): black
// with a crimson panel and the spy bust (wide-brim hat, upturned collar, round glasses, gold smile).
// Origin at the card centre. Returns { group, halo, haloMat, glassMat, glasses, smile }
export function buildQueenCard(kit, o = {}) {
  const W = 7.2, H = 10, T = 0.16;
  const g = new THREE.Group();
  const F = (c, x = {}) => kit.flat({ color: c, ...x });
  const slab = new THREE.Mesh(ext(roundRect(W - 0.08, H - 0.08, 0.46), T - 0.08, 0.04, 2, 6), kit.toon({ ramp: 'black', rim: o.rim ?? 'world' }));
  g.add(slab);
  const zf = T / 2 + 0.012;
  const add = (geo, mat, z, flip = false) => { const m = new THREE.Mesh(geo, mat); m.position.z = flip ? -z : z; if (flip) m.rotation.y = Math.PI; g.add(m); return m; };
  // FRONT
  add(flatShape(roundRect(W - 0.24, H - 0.24, 0.4), 8), F(PAL.cream), zf);
  const border = roundRect(W - 0.9, H - 0.9, 0.25); border.holes.push(rrPath(W - 1.26, H - 1.26, 0.12));
  add(flatShape(border, 6), F(PAL.crimson), zf + 0.004);
  // corner index: Q (ring with a tail) + heart pip; top-left and bottom-right (rotated)
  const q = polyShape(ellPts(0.36, 0.48, 0, 0, 20)); q.holes.push(polyPath(ellPts(0.2, 0.31, 0, 0, 20).slice(0, 20)));
  const qGeo = merge([flatShape(q), flatShape(polyShape([[0.04, -0.2], [0.14, -0.26], [0.42, -0.58], [0.28, -0.6]]))]);
  const pip = flatShape(heartShape(0.62), 10);
  for (const sgn of [1, -1]) {
    const qm = add(qGeo, F(PAL.crimson), zf + 0.006); qm.position.set(-2.72 * sgn, 3.95 * sgn, zf + 0.006); qm.rotation.z = sgn > 0 ? 0 : Math.PI;
    const pm = add(pip, F(PAL.crimson), zf + 0.006); pm.position.set(-2.72 * sgn, 2.95 * sgn, zf + 0.006); pm.rotation.z = sgn > 0 ? 0 : Math.PI;
  }
  // angel bust (head centre at 0, 0.9 in card units -> card y 0.2)
  const B = busts(kit), by = -0.7;
  const bust = new THREE.Group(); bust.position.set(0, by, zf + 0.01); g.add(bust);
  const bm = (geo, mat, z) => { const m = new THREE.Mesh(geo, mat); m.position.z = z; bust.add(m); return m; };
  bm(flatShape(B.shoulders), F(PAL.black), 0);
  bm(flatShape(polyShape([[-0.42, -0.1], [0.42, -0.1], [0.36, 0.55], [-0.36, 0.55]])), F(PAL.cream), 0.002); // neck
  bm(flatShape(polyShape(mirrorX([[0, -0.62], [0.55, -0.42], [0.5, 0.18], [0.3, 0.02], [0, -0.18]]))), F(PAL.black), 0.004); // high collar
  bm(flatShape(B.bob), F(PAL.black), 0.006);
  bm(flatShape(B.face), F(PAL.cream), 0.008);
  for (const sx of [-1, 1]) bm(flatShape(arcBand(0.17, 0.07, Math.PI * 1.08, Math.PI * 1.92, sx * 0.28, 1.0, 8)), F(PAL.black), 0.01); // closed smiling eyes
  bm(flatShape(arcBand(0.2, 0.06, Math.PI * 1.15, Math.PI * 1.85, 0, 0.6, 8)), F(PAL.crimson), 0.01); // smile
  bm(flatShape(heartShape(0.42, 0, -0.52), 10), F(PAL.crimson), 0.012); // brooch
  const haloMat = kit.toon({ ramp: 'gold', rim: null });
  const halo = new THREE.Mesh(flatShade(new THREE.TorusGeometry(0.82, 0.13, 6, 28)), haloMat);
  halo.position.set(0, 2.45, 0.35); halo.rotation.x = -1.2; bust.add(halo);
  // BACK
  add(flatShape(roundRect(W - 0.24, H - 0.24, 0.4), 8), F(PAL.black), zf, true);
  add(flatShape(roundRect(W - 1.0, H - 1.0, 0.25), 8), F(PAL.crimson), zf + 0.004, true);
  const spy = new THREE.Group(); spy.position.set(0, by, -zf - 0.01); spy.rotation.y = Math.PI; g.add(spy);
  const sm = (geo, mat, z) => { const m = new THREE.Mesh(geo, mat); m.position.z = z; spy.add(m); return m; };
  sm(flatShape(B.shoulders), F(PAL.black), 0);
  sm(flatShape(polyShape([[-0.42, -0.1], [0.42, -0.1], [0.36, 0.6], [-0.36, 0.6]])), F(PAL.black), 0.002);
  sm(flatShape(B.collarUp), F(PAL.black), 0.004);
  sm(flatShape(B.bob), F(PAL.black), 0.006);
  sm(flatShape(polyShape(ellPts(2.05, 0.3, 0, 1.75, 28))), F(PAL.black), 0.008); // hat brim
  sm(flatShape(polyShape([[-0.92, 1.7], [0.92, 1.7], [0.82, 2.55], [0.5, 2.72], [-0.5, 2.72], [-0.82, 2.55]])), F(PAL.black), 0.009); // crown
  sm(flatShape(polyShape([[-0.9, 1.86], [0.9, 1.86], [0.88, 2.1], [-0.88, 2.1]])), F(PAL.carmine), 0.011); // hat band
  const glassMat = F(PAL.white);
  const gl = merge([flatShape(polyShape(ellPts(0.26, 0.26, -0.33, 1.08, 18))), flatShape(polyShape(ellPts(0.26, 0.26, 0.33, 1.08, 18))), flatShape(polyShape([[-0.1, 1.1], [0.1, 1.1], [0.1, 1.15], [-0.1, 1.15]]))]);
  const glasses = sm(gl, glassMat, 0.012);
  const smile = sm(flatShape(arcBand(0.26, 0.07, Math.PI * 1.18, Math.PI * 1.82, 0.04, 0.72, 8)), F(PAL.gold), 0.012);
  return { group: g, halo, haloMat, glassMat, glasses, smile, W, H };
}

// ---------------------------------------------------------------------------------------------- the car
// Lofted body: stations along the length (x = 0 tail .. L nose) with a superellipse cross-section.
function loft(st, M = 14, n = 2.6) {
  const pos = [];
  const ring = (s) => {
    const out = [], hh = (s.yt - s.yb) / 2, yc = (s.yt + s.yb) / 2;
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      out.push([s.x, yc + Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n) * hh, Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * s.w]);
    }
    return out;
  };
  const R = st.map(ring);
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < M; j++) {
    const a = R[i][j], b = R[i][(j + 1) % M], c = R[i + 1][(j + 1) % M], d = R[i + 1][j];
    tri(a, c, b); tri(a, d, c);
  }
  for (const [ri, flip] of [[0, true], [R.length - 1, false]]) { // caps
    const r = R[ri], cx = r.reduce((s, p) => s + p[0], 0) / M, cy = r.reduce((s, p) => s + p[1], 0) / M, ctr = [cx, cy, 0];
    for (let j = 0; j < M; j++) flip ? tri(ctr, r[j], r[(j + 1) % M]) : tri(ctr, r[(j + 1) % M], r[j]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
// 60s GT coupe, real 4.45 x 1.66 x 1.22 m (opts.scale, default 1). Nose toward +z, origin on the ground
// under the car centre. Returns { group, body, lampMat, tailMat, cones, wheels: [4 groups], len, wid }
export function buildCar(kit, o = {}) {
  const S = o.scale ?? 1, L = 4.45;
  const g = new THREE.Group();
  const inner = new THREE.Group(); inner.scale.setScalar(S); g.add(inner);
  // body stations: x from tail (0) to nose (L); wheel arches lift the bottom at the axles (0.95, 3.6)
  const arch = (x, xa) => Math.max(0, 1 - Math.abs(x - xa) / 0.5);
  const xs = [0, 0.12, 0.35, 0.6, 0.95, 1.3, 1.7, 2.1, 2.5, 2.9, 3.25, 3.6, 3.95, 4.2, 4.38, 4.45];
  const top = (x) => (x < 0.35 ? 0.86 + x * 0.2 : x < 2.6 ? 0.93 + (x - 0.35) * 0.012 : 0.96 - Math.pow((x - 2.6) / 1.85, 2) * 0.36);
  const half = (x) => 0.83 - Math.pow(Math.max(0, x - 3.2) / 1.25, 2) * 0.33 - Math.pow(Math.max(0, 0.5 - x) / 0.5, 2) * 0.1;
  const st = xs.map((x) => ({ x, w: half(x), yt: top(x), yb: 0.3 + 0.36 * Math.max(arch(x, 0.95), arch(x, 3.6)) + (x > 4.3 || x < 0.08 ? 0.12 : 0) }));
  const bodyG = loft(st, 16, 3.2);
  // cabin (fastback greenhouse): from the windscreen base (x 2.55) back to the tail (x 0.35)
  const cab = [
    { x: 0.35, w: 0.5, yb: 0.8, yt: 0.95 }, { x: 0.8, w: 0.6, yb: 0.85, yt: 1.08 }, { x: 1.3, w: 0.64, yb: 0.85, yt: 1.2 },
    { x: 1.75, w: 0.63, yb: 0.85, yt: 1.22 }, { x: 2.1, w: 0.6, yb: 0.85, yt: 1.16 }, { x: 2.4, w: 0.55, yb: 0.85, yt: 1.0 }, { x: 2.6, w: 0.5, yb: 0.86, yt: 0.9 },
  ];
  const cabG = loft(cab, 12, 2.4);
  const rot = (geo) => { geo.rotateY(-Math.PI / 2); geo.translate(0, 0, -L / 2); return geo; }; // x (tail->nose) -> +z
  const bodyMat = kit.toon({ ramp: o.ramp ?? 'black', rim: o.rim ?? PAL.cyan, rimTh: 0.45 });
  const body = new THREE.Mesh(rot(bodyG), bodyMat); body.name = 'car-body';
  const cabin = new THREE.Mesh(rot(cabG), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: o.rim ?? PAL.cyan, rimTh: 0.3 }));
  inner.add(body, cabin);
  // chrome: front + rear bumper bars (tubes), a grille mouth ring
  const chromeMat = kit.toon({ ramp: o.chrome ?? 'steel', rim: o.rim ?? PAL.cyan });
  const bz = L / 2;
  const chrome = merge([
    tube([[-0.78, 0.42, bz - 0.25], [-0.55, 0.38, bz + 0.03], [0, 0.36, bz + 0.07], [0.55, 0.38, bz + 0.03], [0.78, 0.42, bz - 0.25]], 0.035, 12, 5),
    tube([[-0.8, 0.5, -bz + 0.2], [-0.5, 0.46, -bz - 0.03], [0.5, 0.46, -bz - 0.03], [0.8, 0.5, -bz + 0.2]], 0.035, 10, 5),
    flatShade(new THREE.TorusGeometry(0.2, 0.035, 5, 16).scale(1.4, 0.75, 1).translate(0, 0.52, bz + 0.0)),
  ]);
  inner.add(new THREE.Mesh(chrome, chromeMat));
  // round headlights in scoops (cream glow) + tail lights (rust)
  const lampMat = kit.flat({ color: PAL.cream, fog: 0.4 });
  const lampG = merge([-0.56, 0.56].map((x) => lathe([[0, 0], [0.12, 0], [0.13, 0.03], [0.1, 0.07], [0, 0.08]], 12).rotateX(Math.PI / 2).translate(x, 0.66, bz - 0.36)));
  inner.add(new THREE.Mesh(lampG, lampMat));
  const tailMat = kit.flat({ color: PAL.rust });
  const tailG = merge([-0.62, 0.62].map((x) => lathe([[0, 0], [0.07, 0], [0.07, 0.03], [0, 0.04]], 10).rotateX(-Math.PI / 2).translate(x, 0.74, -bz + 0.02)));
  inner.add(new THREE.Mesh(tailG, tailMat));
  // headlight cones (flat, additive) toward +z
  const coneG = new THREE.ConeGeometry(0.85, 4.5, 14, 1, true).rotateX(-Math.PI / 2).translate(0, 0, 2.25);
  const cones = new THREE.Mesh(merge([coneG.clone().translate(-0.56, 0.66, bz - 0.3), coneG.clone().translate(0.56, 0.66, bz - 0.3)]),
    kit.flat({ color: PAL.cream, opacity: 0.09, additive: true, depthWrite: false, side: THREE.DoubleSide }));
  inner.add(cones);
  // wire wheels: tyre (torus), dished rim (2 crossed discs read as spokes), knock-off spinner with 2 ears
  const tyre = flatShade(new THREE.TorusGeometry(0.27, 0.075, 6, 18)).rotateY(Math.PI / 2);
  const rim = lathe([[0.0, -0.06], [0.24, -0.04], [0.26, 0.0], [0.24, 0.04], [0.04, 0.07], [0, 0.07]], 14).rotateZ(-Math.PI / 2);
  const spin = merge([new THREE.BoxGeometry(0.04, 0.3, 0.05).translate(0.1, 0, 0), new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6).rotateZ(Math.PI / 2).translate(0.08, 0, 0)]);
  const wheels = [];
  const wMat = kit.toon({ ramp: 'black', rim: o.rim ?? PAL.cyan, rimTh: 0.4 }), rMat = kit.toon({ ramp: 'steel', rim: null });
  for (const [x, z] of [[-0.68, -L / 2 + 0.95], [0.68, -L / 2 + 0.95], [-0.68, -L / 2 + 3.6], [0.68, -L / 2 + 3.6]]) {
    const w = new THREE.Group(); w.position.set(x, 0.345, z);
    const side = Math.sign(x);
    const r = new THREE.Mesh(rim, rMat), sp = new THREE.Mesh(spin, rMat); if (side < 0) { r.rotation.y = Math.PI; sp.rotation.y = Math.PI; }
    w.add(new THREE.Mesh(tyre, wMat), r, sp);
    inner.add(w); wheels.push(w);
  }
  return { group: g, body, lampMat, tailMat, cones, wheels, len: L * S, wid: 1.66 * S };
}

// ---------------------------------------------------------------------------------------------- chandelier
// 3-tier crystal chandelier (lathe frame, instanced drops). Origin at the hanging point. opts: { r, drops, ramp }
export function buildChandelier(kit, o = {}) {
  const r = o.r ?? 2, g = new THREE.Group();
  const frame = lathe([[0.02 * r, 0], [0.05 * r, -0.4 * r], [0.12 * r, -0.5 * r], [0.55 * r, -0.62 * r], [0.75 * r, -0.72 * r], [0.7 * r, -0.78 * r],
    [0.32 * r, -0.86 * r], [1.0 * r, -1.0 * r], [0.95 * r, -1.08 * r], [0.4 * r, -1.2 * r], [0.15 * r, -1.45 * r], [0.04 * r, -1.62 * r], [0, -1.66 * r]], 16);
  const fm = new THREE.Mesh(frame, kit.toon({ ramp: o.ramp ?? 'gold', rim: null }));
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * r, 0.03 * r, 12, 5).translate(0, 6, 0), kit.toon({ ramp: 'black', rim: null }));
  const dropG = lathe([[0, 0], [0.07 * r, -0.12 * r], [0.05 * r, -0.26 * r], [0, -0.34 * r]], 5);
  const n = o.drops ?? 24, drops = inst(dropG, kit.flat({ color: o.dropColor ?? PAL.cream }), n, 'chand-drops');
  for (let i = 0; i < n; i++) {
    const tier = i % 2, a = (i / n) * Math.PI * 2 + tier * 0.1, rr = tier ? 0.68 * r : 0.98 * r, y = tier ? -0.8 * r : -1.06 * r;
    setM(drops, i, Math.cos(a) * rr, y, Math.sin(a) * rr);
  }
  g.add(fm, chain, drops);
  return { group: g, frame: fm, drops };
}
