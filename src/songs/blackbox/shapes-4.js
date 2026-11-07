// Group 4 shape kit (S14, S15, S18): rounded profiles, bevelled extrusions, lathes, tape reels, CRT
// monitors, telegraph poles. Everything is modelled in code; these return geometry only (the scenes
// pick the materials). Build-time only: nothing here runs per frame.
import * as THREE from 'three';
import { mergeSimple } from './kit.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

// transform a geometry in place (translate, rotate XYZ, uniform or [sx, sy, sz] scale)
export function xf(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z);
  if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.set(s, s, s);
  g.applyMatrix4(_m.compose(_p, _q, _s));
  return g;
}
export const merge = (list) => mergeSimple(list);

function rrInto(p, w, h, r, cx, cy) {
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
  p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r);
  p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
  return p;
}
export const roundRect = (w, h, r, cx = 0, cy = 0) => rrInto(new THREE.Shape(), w, h, r, cx, cy);
export const roundRectHole = (w, h, r, cx = 0, cy = 0) => rrInto(new THREE.Path(), w, h, r, cx, cy);
export function circleHole(r, cx = 0, cy = 0) { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; }
export function circleShape(r, cx = 0, cy = 0) { const p = new THREE.Shape(); p.absarc(cx, cy, r, 0, Math.PI * 2, false); return p; }
export const polyShape = (pts) => new THREE.Shape(pts.map(([x, y]) => V2(x, y)));
export const polyHole = (pts) => new THREE.Path(pts.map(([x, y]) => V2(x, y)));

// Chaikin corner cutting on a closed polygon (rounds the corners of cut-outs)
export function chaikin(pts, it = 2) {
  let P = pts;
  for (let k = 0; k < it; k++) {
    const Q = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      Q.push(V2(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25), V2(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75));
    }
    P = Q;
  }
  return P;
}

// extrude a profile along +z with a bevel; the front face ends at z = 0, the back at -(depth + 2 bevel)
export function extrude(shape, depth, bevel = 0, curve = 8, segs = 1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: segs, curveSegments: curve });
  g.translate(0, 0, -(depth + bevel));
  return g;
}
// lathe from [radius, height] points; axis 'y' (default) or 'z' (front = +z)
export function lathe(pts, seg = 12, axis = 'y') {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => V2(Math.max(0, r), y)), seg);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}
// a tube along points
export function tube(pts, r, seg = 12, radial = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)))), seg, r, radial, false);
}
// one catenary span from (0,0,0) to (0,0,-len), sagging by sag at the middle
export function catenary(len, sag, r, seg = 10, radial = 4) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const u = i / seg; pts.push(new THREE.Vector3(0, -4 * sag * u * (1 - u), -len * u)); }
  return tube(pts, r, seg, radial);
}

// ---------------------------------------------------------------------------------------------
// Tape reel (NAB style): flange disc with three rounded windows between straight spokes, hub hole.
function windowPts(r0, r1, ac, half, sp, n = 12) {
  const A1 = half - Math.asin(sp / 2 / r1), A0 = half - Math.asin(sp / 2 / r0), pts = [];
  for (let i = 0; i <= n; i++) { const a = ac - A1 + (2 * A1 * i) / n; pts.push(V2(Math.cos(a) * r1, Math.sin(a) * r1)); }
  for (let i = 0; i <= n / 2; i++) { const a = ac + A0 - (2 * A0 * i) / (n / 2); pts.push(V2(Math.cos(a) * r0, Math.sin(a) * r0)); }
  return pts;
}
export function reelFlange(R, thick = R * 0.025) {
  const sh = circleShape(R);
  for (let k = 0; k < 3; k++) sh.holes.push(new THREE.Path(chaikin(windowPts(R * 0.27, R * 0.87, Math.PI / 2 + (k * 2 * Math.PI) / 3, Math.PI / 3, R * 0.2), 2)));
  sh.holes.push(circleHole(R * 0.105));
  return extrude(sh, thick, R * 0.014, 40, 1);
}
// hub with a centre bore and three key slots
export function reelHub(R, depth) {
  const sh = circleShape(R * 0.19);
  sh.holes.push(circleHole(R * 0.045));
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a), l0 = R * 0.075, l1 = R * 0.14, w = R * 0.022;
    sh.holes.push(polyHole([[c * l0 - s * w, s * l0 + c * w], [c * l1 - s * w, s * l1 + c * w], [c * l1 + s * w, s * l1 - c * w], [c * l0 + s * w, s * l0 - c * w]]));
  }
  return extrude(sh, depth, R * 0.012, 24, 1);
}

// ---------------------------------------------------------------------------------------------
// CRT security monitor (real ~35 cm, built at 2.5 m wide). Front plane at z = 0, screen centre (0, SCY).
export const MON = { w: 2.5, h: 2.1, sw: 1.8, sh: 1.35, scy: 0.12 };
export function monitorGeos() {
  const { w, h, sw, sh, scy } = MON;
  // deep case with a thick rounded bezel and the screen opening
  const face = roundRect(w, h, 0.24);
  const caseG = extrude(face, 1.0, 0.07, 6);
  // tapered tube housing at the back (square frustum)
  const back = new THREE.CylinderGeometry(1.36, 0.8, 1.15, 4, 1);
  back.rotateY(Math.PI / 4); back.rotateX(Math.PI / 2); // wide end to the front (+z)
  xf(back, 0, 0.02, -1.14 - 0.575, 0, 0, 0, [1.05, 0.8, 1]);
  // two knobs and a vent ridge on the lower bezel
  const knob = (x) => xf(lathe([[0.13, 0], [0.13, 0.04], [0.1, 0.09], [0.0, 0.1]], 10, 'z'), x, -0.8, 0.0);
  const ridge = xf(extrude(roundRect(0.9, 0.09, 0.04), 0.03, 0.015, 3), -0.45, -0.8, 0.045);
  const caseGeo = merge([caseG, back, knob(0.62), knob(0.95), ridge]);
  // recess: the black glass ring around the lit picture
  const recess = new THREE.ShapeGeometry(roundRect(sw + 0.16, sh + 0.14, 0.24), 5); recess.translate(0, scy, 0.012);
  // the picture plane (centred at the origin; the scene moves it to the screen and squashes it)
  const light = new THREE.ShapeGeometry(roundRect(sw, sh, 0.2), 5);
  return { caseGeo, recess, light };
}
// camera pictures on a screen (flat shapes in screen-local metres, centred on the screen centre)
export function picVault() {
  const ring = new THREE.RingGeometry(0.36, 0.5, 28);
  const hub = new THREE.CircleGeometry(0.11, 16);
  const spokes = [0, 1, 2].map((k) => xf(new THREE.PlaneGeometry(0.62, 0.075), 0, 0, 0, 0, 0, (k * Math.PI) / 3));
  const bolts = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; bolts.push(xf(new THREE.CircleGeometry(0.045, 8), Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0)); }
  return merge([ring, hub, ...spokes, ...bolts]);
}
export function picChess() {
  const g = [];
  // perspective board: two rows of dark squares narrowing to a horizon, one pawn standing on it
  const rows = [[-0.62, -0.38, 0.8, 0.62], [-0.38, -0.22, 0.62, 0.5]];
  rows.forEach(([y0, y1, hb, ht], r) => {
    for (let c = -2; c < 2; c++) {
      if ((c + r) & 1) continue;
      const xa = (c / 2) * hb, xb = ((c + 1) / 2) * hb, xc = ((c + 1) / 2) * ht, xd = (c / 2) * ht;
      g.push(new THREE.ShapeGeometry(polyShape([[xa, y0], [xb, y0], [xc, y1], [xd, y1]])));
    }
  });
  const pawn = [[-0.17, -0.3], [-0.17, -0.25], [-0.1, -0.22], [-0.06, -0.02], [-0.11, 0.0], [-0.11, 0.03], [-0.05, 0.05], [-0.09, 0.12], [-0.08, 0.2], [-0.03, 0.24], [0, 0.245]];
  const full = [...pawn, ...pawn.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  g.push(xf(new THREE.ShapeGeometry(polyShape(full)), 0.18, 0.02, 0.001, 0, 0, 0, 1.25));
  return merge(g);
}
export function picBooth() {
  const sh = polyShape([[-0.26, -0.5], [0.26, -0.5], [0.26, 0.28], [0.18, 0.37], [0, 0.42], [-0.18, 0.37], [-0.26, 0.28]]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) sh.holes.push(roundRectHole(0.15, 0.17, 0.02, -0.09 + c * 0.18, -0.25 + r * 0.21));
  const booth = xf(new THREE.ShapeGeometry(sh, 3), 0.28, 0.0, 0);
  const ground = xf(new THREE.PlaneGeometry(1.8, 0.2), 0, -0.575, 0);
  const pole = xf(new THREE.PlaneGeometry(0.06, 0.95), -0.55, -0.02, 0);
  const arm = xf(new THREE.PlaneGeometry(0.3, 0.05), -0.55, 0.45, 0);
  return merge([booth, ground, pole, arm]);
}
export function picCorridor() {
  const fl = new THREE.ShapeGeometry(polyShape([[-0.9, -0.675], [0.9, -0.675], [0.24, -0.12], [-0.24, -0.12]]));
  const ce = new THREE.ShapeGeometry(polyShape([[-0.9, 0.675], [-0.24, 0.26], [0.24, 0.26], [0.9, 0.675]]));
  const frames = [-1, 1].map((sd) => new THREE.ShapeGeometry(polyShape([[sd * 0.62, -0.42], [sd * 0.44, -0.27], [sd * 0.44, 0.33], [sd * 0.62, 0.47]])));
  return merge([fl, ce, ...frames]);
}
export function picRoom() {
  const fl = new THREE.ShapeGeometry(polyShape([[-0.9, -0.675], [0.9, -0.675], [0.55, -0.3], [-0.55, -0.3]]));
  const door = xf(new THREE.PlaneGeometry(0.24, 0.48), -0.38, -0.06, 0);
  return merge([fl, door]);
}
// the Engineer as a full figure on a camera picture (unit height 1, feet at y 0): bob, high collar, long coat
export function herFront() {
  const L = [[-0.025, 0.27], [-0.035, 0], [-0.1, 0], [-0.085, 0.27], [-0.16, 0.3], [-0.12, 0.58], [-0.16, 0.7], [-0.19, 0.76], [-0.1, 0.8], [-0.085, 0.845], [-0.115, 0.855], [-0.12, 0.94], [-0.085, 0.99], [0, 1.0]];
  return new THREE.ShapeGeometry(polyShape([...L, ...L.slice(0, -1).reverse().map(([x, y]) => [-x, y])]));
}
export function herProfile() {
  return new THREE.ShapeGeometry(polyShape([[-0.07, 0], [0.07, 0], [0.06, 0.28], [0.12, 0.31], [0.08, 0.58], [0.1, 0.72], [0.06, 0.79], [0.08, 0.82], [0.075, 0.86], [0.1, 0.9], [0.085, 0.95], [0.04, 0.995], [-0.05, 1.0], [-0.11, 0.95], [-0.12, 0.855], [-0.07, 0.85], [-0.09, 0.8], [-0.15, 0.75], [-0.1, 0.58], [-0.13, 0.31], [-0.06, 0.28]]));
}

// ---------------------------------------------------------------------------------------------
// Telegraph pole (real 8-10 m): 8-sided tapered pole, cap, one crossarm with braces, 4 glass insulators.
export const POLE = { h: 9, armY: 8.35, armW: 2.6, ins: [-1.12, -0.5, 0.5, 1.12], insH: 0.27 };
export function poleGeo() {
  const pole = lathe([[0.17, 0], [0.155, 3], [0.12, 8.9], [0.135, 9.0], [0.07, 9.12], [0, 9.16]], 8);
  const arm = xf(extrude(roundRect(0.12, 0.15, 0.025), POLE.armW, 0.025, 3), POLE.armW / 2, POLE.armY, 0, 0, Math.PI / 2, 0);
  const braces = [-1, 1].map((sd) => xf(new THREE.BoxGeometry(0.07, 1.05, 0.06), sd * 0.37, POLE.armY - 0.42, 0.0, 0, 0, sd * 0.74));
  const pins = POLE.ins.map((x) => xf(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 5), x, POLE.armY + 0.13, 0));
  const step = [0, 1, 2, 3].map((k) => xf(new THREE.BoxGeometry(0.34, 0.05, 0.05), 0, 2.2 + k * 0.9, 0, 0, (k & 1) * Math.PI / 2, 0));
  return merge([pole, arm, ...braces, ...pins, ...step]);
}
// glass insulator: dome, two drip skirts (scaled up 1.6x from real so it reads at distance)
export function insulatorGeo() {
  return lathe([[0.0, 0], [0.07, 0], [0.105, 0.02], [0.085, 0.05], [0.1, 0.08], [0.075, 0.11], [0.08, 0.15], [0.06, 0.2], [0.035, 0.25], [0, 0.27]], 9);
}
// flat cel flame tongue (base width w at y 0, tip at y h)
export function flameGeo(w, h) {
  const s = new THREE.Shape();
  s.moveTo(0, h);
  s.bezierCurveTo(w * 0.12, h * 0.72, w * 0.5, h * 0.52, w * 0.5, h * 0.22);
  s.bezierCurveTo(w * 0.5, h * 0.05, w * 0.26, 0, 0, 0);
  s.bezierCurveTo(-w * 0.26, 0, -w * 0.5, h * 0.05, -w * 0.5, h * 0.22);
  s.bezierCurveTo(-w * 0.5, h * 0.45, -w * 0.2, h * 0.6, -w * 0.08, h * 0.78);
  s.bezierCurveTo(-w * 0.04, h * 0.86, -w * 0.02, h * 0.93, 0, h);
  return new THREE.ShapeGeometry(s, 6);
}
// a flat smoke cloud: merged discs [x, y, r]
export function cloudGeo(blobs, seg = 22) {
  return merge(blobs.map(([x, y, r]) => new THREE.CircleGeometry(r, seg).translate(x, y, 0)));
}
