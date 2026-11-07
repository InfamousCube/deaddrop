// Group 1 helpers (S01-S05): the Engineer cut-out, bust silhouettes, shape extrusion,
// instancing scratch objects and the S05 dish layout (shared with the S04 match-cut).
import * as THREE from 'three';
import { PAL } from './style.js';

export const EYE = new THREE.Vector3(0, 1.6, 0.05);
export const UPV = new THREE.Vector3(0, 1, 0);

// polygon (right half, top centre -> bottom centre) mirrored into a closed THREE.Shape
export function mirrorShape(right) {
  const s = new THREE.Shape();
  s.moveTo(right[0][0], right[0][1]);
  for (let i = 1; i < right.length; i++) s.lineTo(right[i][0], right[i][1]);
  for (let i = right.length - 1; i >= 0; i--) if (Math.abs(right[i][0]) > 1e-4) s.lineTo(-right[i][0], right[i][1]);
  s.closePath();
  return s;
}
export function extrude(shape, depth, curveSegments = 6) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
  g.translate(0, 0, -depth / 2);
  return g;
}

// The Engineer, front view, feet at y 0, 1.75 m: sharp bob, high collar, coverall, long gloves.
const ENG = [
  [0, 1.75], [0.085, 1.735], [0.135, 1.69], [0.16, 1.61], [0.165, 1.52], [0.172, 1.455], [0.11, 1.47], [0.075, 1.43],
  [0.085, 1.4], [0.12, 1.355], [0.235, 1.33], [0.275, 1.27], [0.29, 1.08], [0.3, 0.86], [0.285, 0.78], [0.235, 0.79],
  [0.218, 1.0], [0.212, 1.17], [0.172, 0.99], [0.192, 0.86], [0.17, 0.06], [0.19, 0], [0.04, 0], [0.028, 0.7], [0, 0.72],
];
const ENG_SIT = [
  [0, 1.75], [0.085, 1.735], [0.135, 1.69], [0.16, 1.61], [0.165, 1.52], [0.172, 1.455], [0.11, 1.47], [0.075, 1.43],
  [0.085, 1.4], [0.12, 1.355], [0.235, 1.33], [0.275, 1.27], [0.29, 1.08], [0.3, 0.9], [0.285, 0.82], [0.235, 0.83],
  [0.218, 1.0], [0.212, 1.17], [0.172, 0.99], [0.215, 0.86], [0.24, 0.72], [0.2, 0.08], [0.22, 0], [0.06, 0], [0.05, 0.6], [0, 0.62],
];
export function engineer(kit, o = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(extrude(mirrorShape(o.sit ? ENG_SIT : ENG), 0.12), kit.toon({ ramp: 'black', rim: o.rim ?? PAL.cyan, rimTh: 0.35, key: o.key }));
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), kit.flat({ color: PAL.gold }));
  belt.position.set(0, 0.95, 0.07);
  const glassMat = kit.flat({ color: PAL.white, fog: 0.3 });
  const gg = mergeDiscs([[-0.058, 1.585, 0.068, 0.036], [0.058, 1.585, 0.068, 0.036]], 14);
  const glasses = new THREE.Mesh(gg, glassMat);
  g.add(body, belt, glasses);
  g.scale.setScalar((o.h ?? 1.75) / 1.75);
  return { group: g, body, glasses, glassMat, belt };
}
// several flat discs (x, y, z, r) facing +z merged into one geometry
export function mergeDiscs(list, seg = 12) {
  const pos = [];
  for (const [x, y, z, r] of list) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      pos.push(x, y, z, x + Math.cos(a0) * r, y + Math.sin(a0) * r, z, x + Math.cos(a1) * r, y + Math.sin(a1) * r, z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
  return geo;
}
// head-and-shoulders bust with a sharp bob, unit height (y 0..1), centred on x
const BUST = [
  [0, 1], [0.12, 0.985], [0.2, 0.93], [0.235, 0.83], [0.24, 0.7], [0.255, 0.58], [0.16, 0.6], [0.11, 0.55],
  [0.12, 0.48], [0.17, 0.42], [0.4, 0.36], [0.47, 0.26], [0.49, 0],
];
export const bustShape = () => mirrorShape(BUST.concat([[0, 0]]));
export const BUST_EYES = [[-0.085, 0.76], [0.085, 0.76]]; // glasses centres (unit bust)

// scratch objects for instance updates (never allocate in update)
export function scratch() {
  return { m: new THREE.Matrix4(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), v: new THREE.Vector3(), v2: new THREE.Vector3(), e: new THREE.Euler(), c: new THREE.Color(), c2: new THREE.Color() };
}

// ------------------------------------------------------------------------------------------------
// S05 Mirror Field layout (world-local metres; the field group sits at y = PLAIN_Y with travel on z)
export const PLAIN_Y = -6;          // the plain lies 6 m below the cradle
export const TOWER = [-18, -70];    // receiver tower (x, z)
export const DISH_POST = 2;         // post height; the face centre sits at PLAIN_Y + DISH_POST + 0.2
let LAYOUT = null;
export function dishLayout() {
  if (LAYOUT) return LAYOUT;
  const R = [];
  for (let i = 0; i < 8; i++) R.push(14 + 8.6 * i);
  const sum = R.reduce((a, b) => a + b, 0);
  const N = R.map((r) => Math.round((480 * r) / sum));
  N[7] += 480 - N.reduce((a, b) => a + b, 0);
  const out = [];
  R.forEach((r, i) => {
    for (let k = 0; k < N[i]; k++) {
      const a = (k / N[i]) * Math.PI * 2 + i * 0.37;
      const x = TOWER[0] + Math.sin(a) * r, z = TOWER[1] + Math.cos(a) * r;
      out.push({ x, z, ring: i, dist: Math.hypot(x, z) });
    }
  });
  // the 48 dishes nearest the player get the match-cut discs (band 0, already up at 29.46)
  const order = out.map((d, i) => i).sort((a, b) => out[a].dist - out[b].dist);
  order.forEach((idx, rank) => { const d = out[idx]; d.rank = rank; d.band = rank < 48 ? 0 : d.dist < 45 ? 1 : d.dist < 80 ? 2 : 3; });
  LAYOUT = { dishes: out, nearest: order.slice(0, 48) };
  return LAYOUT;
}
