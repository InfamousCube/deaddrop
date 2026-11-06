// The listening room: an IEYTD-inspired ("I Expect You To Die") secret-agent submarine /
// underground spy command bunker on a high floor. Every wall, the floor and the ceiling are
// pre-fractured along "wire" lines; arched steel submarine hull ribs, periscope, floor cable
// trunks, tape archive racks and spy equipment are pieces too. All of it is one merged mesh
// whose pieces can fly apart (break) and fly back (rebuild) on the GPU.
import * as THREE from 'three';
import { toon, paint, G, Batch, PieceSet, xf, slab, LIGHT, v3, col } from '../gfx/shade.js';
import { cutAll, voronoi, prism, rng, centroid, area } from '../gfx/fracture.js';
import { rugTexture, artTexture, clockFace, recordSpines } from '../gfx/textures.js';

export const ROOM = { x0: -2.4, x1: 2.4, z0: -2.5, z1: 2.1, h: 2.85 };
export const WIN = { x0: -1.9, x1: 1.9, y0: 0.85, y1: 2.45 };

export const PAL = {
  // Backwards-compatible keys tuned to an IEYTD submarine / secret-agent bunker palette
  teal: 0x18222c, tealDark: 0x0f161e, walnut: 0x212832, walnutDark: 0x141920, walnutLight: 0x2f3846,
  brass: 0xc8963e, cream: 0x192028, creamDark: 0x12171d, orange: 0xc85828, mustard: 0xd99b26,
  ink: 0x0b0e13, red: 0xc8302a, oxblood: 0x42181a, floor: 0x101419, leather: 0x181b21, green: 0x285e48,
  // Dedicated submarine hull, valve & cable keys
  steel: 0x353f4c, steelLight: 0x525e6e, steelDark: 0x161b22, iron: 0x11151b,
  copper: 0xa86428, hazard: 0xd99b26, cableBlack: 0x0d1015, cableGrey: 0x28303b,
  cableRed: 0x721f1d, cableAmber: 0x9c6022, ledGreen: 0x38d878, ledAmber: 0xffaa2a,
};

const WIRE_V = /* glsl */ `
attribute float aAlong;
attribute float aWire;
attribute float aSide;
varying float vAlong; varying float vWire; varying float vSide;
void main() { vAlong = aAlong; vWire = aWire; vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const WIRE_F = /* glsl */ `
uniform float uTime, uFade, uPulse, uExposure;
uniform float uT0[48];
uniform float uSpeed[48];
uniform vec3 uColor;
varying float vAlong; varying float vWire; varying float vSide;
void main() {
  int i = int(vWire + 0.5);
  float head = (uTime - uT0[i]) * uSpeed[i];
  if (head <= 0.0 || vAlong > head) discard;
  float behind = head - vAlong;
  float core = exp(-pow(vSide * 3.2, 2.0));
  float glow = exp(-pow(vSide * 1.1, 2.0)) * 0.35;
  float spark = exp(-behind * 7.0) * 2.5;
  float a = (core + glow) * (0.75 + 0.5 * uPulse) + spark * core;
  vec3 c = uColor * a + vec3(1.0, 0.95, 0.8) * spark * core * 0.6;
  gl_FragColor = vec4(c * uFade * uExposure, 1.0);
}`;

export function buildRoom() {
  const group = new THREE.Group();
  group.name = 'room';
  const pieces = new PieceSet(2048);
  const B = new Batch(pieces);
  const R = rng(1977);
  const wires = []; // { a: Vector3, b: Vector3, n: Vector3 }
  const props = {};

  // ---------------------------------------------------------------------------------------
  // Shell panels (dark riveted submarine pressure-hull plates)
  const thick = 0.09;
  const panel = (name, O, U, V, uLen, vLen, regions, wireLines, colorAt, density) => {
    const N = U.clone().cross(V).normalize();
    for (const reg of regions) {
      let polys = [[[reg[0], reg[1]], [reg[2], reg[1]], [reg[2], reg[3]], [reg[0], reg[3]]]];
      for (const vb of [0.95, 1.0]) if (vb > reg[1] && vb < reg[3]) polys = cutAll(polys, 0, vb, 1, vb);
      for (const [x0, y0, x1, y1] of wireLines) polys = cutAll(polys, x0, y0, x1, y1);
      const cells = [];
      for (const p of polys) {
        const a = Math.abs(area(p));
        const n = Math.max(1, Math.round(a * density));
        for (const c of voronoi(p, n, R)) cells.push(c);
      }
      for (const c of cells) {
        const [cu, cv] = centroid(c);
        const ctr = O.clone().addScaledVector(U, cu).addScaledVector(V, cv).addScaledVector(N, -thick / 2);
        B.piece(ctr, 'shell', { panel: name, u: cu, v: cv, n: N.clone() });
        const g = prism(c, O, U, V, N, thick);
        B.add(paint(g, colorAt(cu, cv), { ao: 1, gloss: 0.22 }));
      }
    }
    for (const [x0, y0, x1, y1] of wireLines) {
      for (const reg of regions) {
        const seg = clipSeg(x0, y0, x1, y1, reg);
        if (!seg) continue;
        const off = name === 'floor' || name === 'ceiling' ? 0.007 : 0.032;
        const a = O.clone().addScaledVector(U, seg[0]).addScaledVector(V, seg[1]).addScaledVector(N, off);
        const b = O.clone().addScaledVector(U, seg[2]).addScaledVector(V, seg[3]).addScaledVector(N, off);
        if (a.distanceTo(b) > 0.15) wires.push({ a, b, n: N.clone(), panel: name });
      }
    }
  };
  const wallColor = (cu, cv) => (cv < 0.95 ? PAL.walnut : cv < 1.0 ? PAL.brass : PAL.teal);
  const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0, H = ROOM.h;

  // front wall with the window opening
  panel('front', v3(ROOM.x0, 0, ROOM.z0), v3(1, 0, 0), v3(0, 1, 0), W, H,
    [[0, 0, W, WIN.y0], [0, WIN.y1, W, H], [0, WIN.y0, WIN.x0 - ROOM.x0, WIN.y1], [WIN.x1 - ROOM.x0, WIN.y0, W, WIN.y1]],
    [[0.2, 0, 1.6, H], [4.6, 0, 3.1, H], [0, 0.3, W, 0.75], [1.2, H, 3.6, 2.2]], wallColor, 3.0);
  // back wall
  panel('back', v3(ROOM.x1, 0, ROOM.z1), v3(-1, 0, 0), v3(0, 1, 0), W, H, [[0, 0, W, H]],
    [[0.4, 0, 2.1, H], [4.4, 0.2, 2.8, H], [0, 1.6, W, 2.3], [0, 0.4, 1.9, 0]], wallColor, 2.0);
  // left wall
  panel('left', v3(ROOM.x0, 0, ROOM.z1), v3(0, 0, -1), v3(0, 1, 0), D, H, [[0, 0, D, H]],
    [[D, 0.2, 0.6, H], [D - 0.3, H, 1.4, 0], [0, 1.9, D, 1.2], [2.2, 0, 3.5, H]], wallColor, 2.4);
  // right wall
  panel('right', v3(ROOM.x1, 0, ROOM.z0), v3(0, 0, 1), v3(0, 1, 0), D, H, [[0, 0, D, H]],
    [[0, 0.3, 3.9, H], [0.5, H, 2.4, 0], [0, 1.3, D, 2.1], [3.1, 0, 4.2, H]], wallColor, 2.4);
  // floor: wires radiate from under the desk
  const fu = 0 - ROOM.x0, fv = ROOM.z1 - (-0.7);
  const floorLines = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    floorLines.push([fu, fv, fu + Math.cos(a) * 3, fv + Math.sin(a) * 3]);
  }
  panel('floor', v3(ROOM.x0, 0, ROOM.z1), v3(1, 0, 0), v3(0, 0, -1), W, D, [[0, 0, W, D]], floorLines,
    () => PAL.floor, 1.8);
  // ceiling (submarine pressure hull deck)
  panel('ceiling', v3(ROOM.x0, H, ROOM.z0), v3(1, 0, 0), v3(0, 0, 1), W, D, [[0, 0, W, D]],
    [[0, 0.6, W, 3.2], [1.3, 0, 3.9, D], [W, 0.2, 0.5, D]], () => PAL.cream, 1.5);

  // ---------------------------------------------------------------------------------------
  // IEYTD Submarine / Secret-Agent Bunker Architecture: Curved Hull Ribs, Periscope, Pipes & Valves
  const prop = (center, tag = 'prop') => B.piece(center, tag);
  const add = (geo, c, o = {}, m = null) => B.add(paint(geo, c, { ...o, m }));

  // Helper: Iconic red cast-iron hand-wheel valve on pipes
  const addValveWheel = (vx, vy, vz, rot = [0, 0, 0], r = 0.068, cRim = PAL.red) => {
    const vm = (p, lr = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(vx, vy, vz).multiply(xf([0, 0, 0], rot)).multiply(xf(p, lr));
    add(G.cyl(0.016, 0.02, 0.055, 10), PAL.brass, { gloss: 0.85 }, vm([0, 0, -0.015], [Math.PI / 2, 0, 0]));
    add(G.torus(r, 0.011, 8, 20), cRim, { gloss: 0.72 }, vm([0, 0, 0.012]));
    for (let i = 0; i < 4; i++) {
      add(G.cyl(0.005, 0.005, r * 1.9, 6), PAL.brass, { gloss: 0.85 }, vm([0, 0, 0.012], [0, 0, (i / 4) * Math.PI]));
    }
    add(G.sphere(0.015, 8, 6), PAL.brass, { gloss: 0.9 }, vm([0, 0, 0.016]));
  };

  // Perimeter steel cable channels (baseboards), corrugated steel wainscot ribs & high-pressure hull manifolds
  const runs = [
    { a: v3(ROOM.x0, 0, ROOM.z0), b: v3(ROOM.x1, 0, ROOM.z0), n: v3(0, 0, 1) },
    { a: v3(ROOM.x1, 0, ROOM.z1), b: v3(ROOM.x0, 0, ROOM.z1), n: v3(0, 0, -1) },
    { a: v3(ROOM.x0, 0, ROOM.z1), b: v3(ROOM.x0, 0, ROOM.z0), n: v3(1, 0, 0) },
    { a: v3(ROOM.x1, 0, ROOM.z0), b: v3(ROOM.x1, 0, ROOM.z1), n: v3(-1, 0, 0) },
  ];
  for (const r of runs) {
    const len = r.a.distanceTo(r.b);
    const nSeg = Math.ceil(len / 1.2);
    const dir = r.b.clone().sub(r.a).normalize();
    const yaw = Math.atan2(dir.x, dir.z) - Math.PI / 2;
    for (let i = 0; i < nSeg; i++) {
      const l = len / nSeg;
      const c = r.a.clone().addScaledVector(dir, l * (i + 0.5)).addScaledVector(r.n, 0.018);
      // Heavy steel baseboard cable tray + brass hazard trim
      prop(c.clone().setY(0.07));
      add(G.box(l - 0.01, 0.13, 0.036), PAL.steelDark, { gloss: 0.4 }, xf([c.x, 0.065, c.z], [0, yaw, 0]));
      add(G.box(l - 0.02, 0.016, 0.042), PAL.brass, { gloss: 0.75 }, xf([c.x, 0.125, c.z], [0, yaw, 0]));
      // Waist-height submarine hull stringer rail + twin copper/steel pressure lines (y = 0.94)
      prop(c.clone().setY(0.94));
      add(G.box(l - 0.01, 0.06, 0.036), PAL.steel, { gloss: 0.5 }, xf([c.x, 0.94, c.z], [0, yaw, 0]));
      add(G.cyl(0.013, 0.013, l - 0.01, 8), PAL.copper, { gloss: 0.78 }, xf([c.x + r.n.x * 0.022, 0.88, c.z + r.n.z * 0.022], [0, yaw, Math.PI / 2]));
      // Upper hull crown girder & twin high-pressure steam/coolant pipes
      prop(c.clone().setY(H - 0.06));
      add(G.box(l - 0.01, 0.11, 0.065), PAL.steelDark, { gloss: 0.38 }, xf([c.x + r.n.x * 0.014, H - 0.055, c.z + r.n.z * 0.014], [0, yaw, 0]));
      add(G.cyl(0.016, 0.016, l - 0.01, 8), PAL.copper, { gloss: 0.75 }, xf([c.x + r.n.x * 0.028, H - 0.16, c.z + r.n.z * 0.028], [0, yaw, Math.PI / 2]));
      add(G.cyl(0.012, 0.012, l - 0.01, 8), PAL.steelLight, { gloss: 0.65 }, xf([c.x + r.n.x * 0.028, H - 0.21, c.z + r.n.z * 0.028], [0, yaw, Math.PI / 2]));
    }
    // Ribbed steel armor channels on lower wall band
    for (let s0 = 0.08; s0 < len - 0.08; s0 += 0.64) {
      const mid = r.a.clone().addScaledVector(dir, Math.min(s0 + 0.32, len - 0.08)).addScaledVector(r.n, 0.014).setY(0.50);
      prop(mid);
      for (let s = s0; s < Math.min(s0 + 0.64, len - 0.06); s += 0.105) {
        const p = r.a.clone().addScaledVector(dir, s + 0.04).addScaledVector(r.n, 0.014);
        add(G.box(0.028, 0.70, 0.022), PAL.walnutLight, { gloss: 0.42 }, xf([p.x, 0.50, p.z], [0, yaw, 0]));
      }
    }
  }

  // ---- Arched Submarine Bulkhead Hull Ribs (4 full pressure-hull frames spanning walls & ceiling) ----
  for (const gz of [-1.76, -0.78, 0.26, 1.28]) {
    for (const sx of [-1, 1]) {
      const wx = sx * (ROOM.x1 - 0.08);
      // Lower vertical hull rib with submarine lightening holes & brass rivets
      prop(v3(wx, 1.05, gz));
      add(G.box(0.16, 1.98, 0.09), PAL.steelDark, { gloss: 0.45 }, xf([wx, 1.02, gz]));
      add(G.box(0.035, 1.98, 0.13), PAL.steel, { gloss: 0.55 }, xf([wx - sx * 0.065, 1.02, gz]));
      for (const hy of [0.42, 0.82, 1.28, 1.68]) {
        add(G.cyl(0.032, 0.032, 0.096, 12), PAL.brass, { gloss: 0.8 }, xf([wx, hy, gz], [Math.PI / 2, 0, 0]));
        add(G.cyl(0.024, 0.024, 0.10, 10), PAL.ink, {}, xf([wx, hy, gz], [Math.PI / 2, 0, 0]));
      }
      // Angled upper submarine hull arch haunches (curves inward from wall to ceiling!)
      const hx = sx * (ROOM.x1 - 0.34), hy = 2.38;
      prop(v3(hx, hy, gz));
      add(G.box(0.16, 0.96, 0.09), PAL.steelDark, { gloss: 0.45 }, xf([hx, hy, gz], [0, 0, sx * 0.62]));
      add(G.box(0.035, 0.96, 0.13), PAL.steel, { gloss: 0.55 }, xf([hx - sx * 0.04, hy - 0.02, gz], [0, 0, sx * 0.62]));
      // Heavy riveted knee gusset plate at the arch bend
      add(G.box(0.28, 0.28, 0.075), PAL.walnutLight, { gloss: 0.5 }, xf([sx * (ROOM.x1 - 0.16), 2.02, gz], [0, 0, Math.PI / 4]));
      add(G.sphere(0.012, 8, 6), PAL.brass, { gloss: 0.85 }, xf([sx * (ROOM.x1 - 0.24), 2.02, gz]));
    }
    // Overhead arched ceiling crown beam with submarine deck status lights
    prop(v3(0, H - 0.09, gz));
    add(G.box(W - 0.96, 0.14, 0.085), PAL.steelDark, { gloss: 0.42 }, xf([0, H - 0.075, gz]));
    add(G.box(W - 0.92, 0.028, 0.13), PAL.steel, { gloss: 0.52 }, xf([0, H - 0.145, gz]));
    for (const lx of [-1.1, 0, 1.1]) {
      add(G.cyl(0.024, 0.028, 0.02, 10), PAL.brass, { gloss: 0.85 }, xf([lx, H - 0.155, gz]));
      add(G.sphere(0.012, 8, 6), lx === 0 ? PAL.ledAmber : PAL.red, { glow: 1.35 }, xf([lx, H - 0.165, gz]));
    }
  }

  // Corner bulkhead columns & longitudinal ceiling keelson spine + ventilation trunk
  for (const [px, pz] of [
    [ROOM.x0 + 0.06, ROOM.z0 + 0.06], [ROOM.x1 - 0.06, ROOM.z0 + 0.06],
    [ROOM.x0 + 0.06, ROOM.z1 - 0.06], [ROOM.x1 - 0.06, ROOM.z1 - 0.06],
  ]) {
    prop(v3(px, H * 0.5, pz));
    add(G.box(0.13, H - 0.04, 0.13), PAL.steelDark, { gloss: 0.42 }, xf([px, H * 0.5, pz]));
    for (const by of [0.45, 1.35, 2.25]) add(G.box(0.15, 0.035, 0.15), PAL.brass, { gloss: 0.75 }, xf([px, by, pz]));
  }
  for (const gx of [-1.25, 0, 1.25]) {
    prop(v3(gx, H - 0.06, -0.2));
    add(G.box(0.09, 0.08, D - 0.16), PAL.steelDark, { gloss: 0.38 }, xf([gx, H - 0.05, -0.2]));
  }

  // ---- Overhead Retracted Brass & Steel Spy Periscope (Front-Left of Console, IEYTD centerpiece!) ----
  {
    const px = -0.58, pz = -1.06;
    prop(v3(px, 2.32, pz));
    // Ceiling pressure-hull gland collar, azimuth ring & twin hydraulic feed tubes
    add(G.cyl(0.16, 0.18, 0.08, 20), PAL.steelDark, { gloss: 0.55 }, xf([px, H - 0.04, pz]));
    add(G.torus(0.15, 0.018, 8, 20), PAL.brass, { gloss: 0.88 }, xf([px, H - 0.08, pz], [Math.PI / 2, 0, 0]));
    for (const sx of [-0.09, 0.09]) {
      add(G.cyl(0.012, 0.012, 0.72, 10), PAL.copper, { gloss: 0.8 }, xf([px + sx, H - 0.42, pz - 0.04]));
      add(G.torus(0.016, 0.004, 6, 12), PAL.brass, { gloss: 0.88 }, xf([px + sx, 2.24, pz - 0.04], [Math.PI / 2, 0, 0]));
    }
    // Outer steel sleeve + polished brass telescoping periscope column
    add(G.cyl(0.075, 0.075, 0.42, 16), PAL.steel, { gloss: 0.6 }, xf([px, H - 0.26, pz]));
    add(G.cyl(0.052, 0.052, 0.56, 16), PAL.brass, { gloss: 0.88 }, xf([px, 2.18, pz]));
    add(G.torus(0.062, 0.012, 8, 16), PAL.steelDark, { gloss: 0.6 }, xf([px, 2.38, pz], [Math.PI / 2, 0, 0]));
    // Periscope optical head box (angled slightly toward the player at z = -0.35, y = 1.7)
    const pm = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(px, 1.92, pz).multiply(new THREE.Matrix4().makeRotationY(0.32)).multiply(xf(p, r));
    add(slab(0.24, 0.17, 0.21, 0.02), PAL.steelDark, { gloss: 0.55 }, pm([0, 0, 0]));
    add(G.box(0.25, 0.02, 0.22), PAL.brass, { gloss: 0.88 }, pm([0, 0.078, 0]));
    // Forward upper objective prism housing & glowing green rangefinder ocular with crosshair reticle
    add(G.cyl(0.050, 0.056, 0.08, 18), PAL.brass, { gloss: 0.88 }, pm([0, 0.012, 0.11], [Math.PI / 2, 0, 0]));
    add(G.circle(0.042, 18), PAL.ledGreen, { glow: 1.65 }, pm([0, 0.012, 0.152]));
    add(G.ring(0.022, 0.025, 18), PAL.ink, {}, pm([0, 0.012, 0.153]));
    add(G.box(0.15, 0.07, 0.06), PAL.ink, { gloss: 0.35 }, pm([0, -0.012, 0.12]));
    // Side knurled elevation vernier drums & red recording tally light
    for (const sx of [-1, 1]) {
      add(G.cyl(0.038, 0.038, 0.026, 16), PAL.brass, { gloss: 0.88 }, pm([sx * 0.125, 0, 0], [0, 0, Math.PI / 2]));
      add(G.cyl(0.024, 0.024, 0.032, 12), PAL.steelDark, { gloss: 0.6 }, pm([sx * 0.128, 0, 0], [0, 0, Math.PI / 2]));
    }
    add(G.sphere(0.013, 8, 6), PAL.red, { glow: 1.75 }, pm([-0.085, 0.052, 0.108]));
    // Folded-down twin brass & red-grip control handles with hand guards
    for (const sx of [-1, 1]) {
      add(G.cyl(0.011, 0.011, 0.18, 8), PAL.brass, { gloss: 0.88 }, pm([sx * 0.15, -0.04, 0.02], [0, 0, sx * 1.15]));
      add(G.cyl(0.017, 0.015, 0.095, 12), PAL.red, { gloss: 0.75 }, pm([sx * 0.22, -0.11, 0.04], [0.25, 0, 0]));
      add(G.sphere(0.017, 10, 8), PAL.brass, { gloss: 0.9 }, pm([sx * 0.22, -0.155, 0.052]));
    }
  }

  // ---- Octagonal / Chamfered Armored Submarine Observation Viewport (Front Window) ----
  {
    const fz = ROOM.z0 + 0.018;
    const frame = (x, y, w, h, z = fz, c = PAL.steelDark, rotZ = 0) => {
      prop(v3(x, y, z));
      add(G.box(w, h, 0.09), c, { gloss: 0.48 }, xf([x, y, z], [0, 0, rotZ]));
    };
    // Heavy top, bottom, left, right bolted armor frame bars
    frame(0, WIN.y0 - 0.04, WIN.x1 - WIN.x0 + 0.22, 0.095);
    frame(0, WIN.y1 + 0.04, WIN.x1 - WIN.x0 + 0.22, 0.095);
    frame(WIN.x0 - 0.05, (WIN.y0 + WIN.y1) / 2, 0.10, WIN.y1 - WIN.y0);
    frame(WIN.x1 + 0.05, (WIN.y0 + WIN.y1) / 2, 0.10, WIN.y1 - WIN.y0);
    // 45-degree diagonal armored corner gussets (turns rectangular opening into an octagonal bunker viewport!)
    for (const [cx, cy, rz] of [
      [WIN.x0 + 0.14, WIN.y0 + 0.14, -Math.PI / 4],
      [WIN.x1 - 0.14, WIN.y0 + 0.14, Math.PI / 4],
      [WIN.x0 + 0.14, WIN.y1 - 0.14, Math.PI / 4],
      [WIN.x1 - 0.14, WIN.y1 - 0.14, -Math.PI / 4],
    ]) {
      prop(v3(cx, cy, fz + 0.01));
      add(G.box(0.46, 0.12, 0.075), PAL.steel, { gloss: 0.55 }, xf([cx, cy, fz + 0.01], [0, 0, rz]));
      add(G.box(0.42, 0.018, 0.082), PAL.brass, { gloss: 0.8 }, xf([cx, cy, fz + 0.012], [0, 0, rz]));
    }
    // Twin vertical submarine viewport mullions with brass pressure clamps
    for (const x of [-0.64, 0.64]) {
      frame(x, (WIN.y0 + WIN.y1) / 2, 0.06, WIN.y1 - WIN.y0, fz - 0.015, PAL.steel);
      for (const my of [WIN.y0 + 0.35, (WIN.y0 + WIN.y1) / 2, WIN.y1 - 0.35]) {
        add(G.box(0.09, 0.035, 0.045), PAL.brass, { gloss: 0.8 }, xf([x, my, fz + 0.01]));
      }
    }
    // Armored viewport sill + hydraulic shutter pistons on left & right
    prop(v3(0, WIN.y0 - 0.065, ROOM.z0 + 0.10));
    add(G.box(WIN.x1 - WIN.x0 + 0.36, 0.055, 0.22), PAL.steel, { gloss: 0.48 }, xf([0, WIN.y0 - 0.075, ROOM.z0 + 0.10]));
    add(G.box(WIN.x1 - WIN.x0 + 0.36, 0.014, 0.018), PAL.brass, { gloss: 0.8 }, xf([0, WIN.y0 - 0.058, ROOM.z0 + 0.205]));
    for (const sx of [-1, 1]) {
      const hx = sx * (WIN.x1 + 0.15);
      prop(v3(hx, (WIN.y0 + WIN.y1) / 2, ROOM.z0 + 0.09));
      add(G.cyl(0.028, 0.028, 0.92, 12), PAL.copper, { gloss: 0.75 }, xf([hx, WIN.y0 + 0.48, ROOM.z0 + 0.09]));
      add(G.cyl(0.018, 0.018, 0.78, 10), PAL.steelLight, { gloss: 0.85 }, xf([hx, WIN.y1 - 0.36, ROOM.z0 + 0.09]));
    }
    // Overhead Armored Shutter Housing + Illuminated Spy DEFCON / INTERCEPT Status Header
    prop(v3(0, WIN.y1 + 0.18, ROOM.z0 + 0.095));
    add(G.box(WIN.x1 - WIN.x0 + 0.30, 0.22, 0.18), PAL.steelDark, { gloss: 0.45 }, xf([0, WIN.y1 + 0.18, ROOM.z0 + 0.095]));
    add(G.box(WIN.x1 - WIN.x0 + 0.30, 0.024, 0.186), PAL.brass, { gloss: 0.8 }, xf([0, WIN.y1 + 0.08, ROOM.z0 + 0.095]));
    for (let i = -2; i <= 2; i++) {
      const cLamp = i === 0 ? PAL.red : Math.abs(i) === 1 ? PAL.ledAmber : PAL.ledGreen;
      add(G.box(0.18, 0.065, 0.02), PAL.ink, {}, xf([i * 0.48, WIN.y1 + 0.18, ROOM.z0 + 0.182]));
      add(G.plane(0.15, 0.042), cLamp, { glow: 1.45 }, xf([i * 0.48, WIN.y1 + 0.18, ROOM.z0 + 0.194]));
    }
  }

  // ---- Heavy industrial monitor speakers (woofer cones are their own pieces so they pump) ----
  props.cones = [];
  for (const sx of [-1.38, 1.38]) {
    const z = -1.55, yaw = sx < 0 ? 0.32 : -0.32;
    const m = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeRotationY(yaw).premultiply(new THREE.Matrix4().makeTranslation(sx, 0, z)).multiply(xf(p, r));
    prop(v3(sx, 0.55, z));
    // Submarine-grade acoustic monitor enclosure + brass corner bumpers
    add(slab(0.44, 1.06, 0.34, 0.025), PAL.steelDark, { gloss: 0.42 }, m([0, 0.59, 0]));
    add(G.box(0.38, 0.98, 0.016), PAL.ink, { gloss: 0.2 }, m([0, 0.59, 0.168]));
    for (const cy of [0.12, 1.05]) for (const cx of [-0.19, 0.19]) {
      add(G.box(0.055, 0.055, 0.024), PAL.brass, { gloss: 0.78 }, m([cx, cy, 0.17]));
    }
    for (const lx of [-0.14, 0.14]) for (const lz of [-0.1, 0.1]) {
      add(G.cyl(0.022, 0.014, 0.07, 10), PAL.steelLight, { gloss: 0.7 }, m([lx, 0.035, lz]));
    }
    // Woofer & horn tweeter machined brass/copper retaining rings
    add(G.torus(0.115, 0.015, 8, 32), PAL.brass, { gloss: 0.88 }, m([0, 0.42, 0.18]));
    add(G.torus(0.054, 0.010, 8, 24), PAL.copper, { gloss: 0.85 }, m([0, 0.82, 0.18]));
    add(G.circle(0.045, 20), PAL.steelLight, { gloss: 0.7 }, m([0, 0.82, 0.182]));
    add(G.cyl(0.006, 0.006, 0.28, 8), PAL.brass, { gloss: 0.8 }, m([0, 0.42, 0.202], [0, 0, Math.PI / 2]));
    add(G.sphere(0.008, 8, 6), PAL.ledGreen, { glow: 1.6 }, m([0.14, 0.98, 0.18]));
    // Pumping woofer cone piece (flush inside the front baffle opening at z = 0.176)
    const cone = prop(new THREE.Vector3(sx, 0.42, z).add(new THREE.Vector3(0, 0, 0.175).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)), 'cone');
    cone.data.dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    add(G.cone(0.105, 0.045, 28, true), PAL.steel, { gloss: 0.35 }, m([0, 0.42, 0.162], [Math.PI / 2, 0, 0]));
    add(G.sphere(0.034, 14, 8), PAL.brass, { gloss: 0.85 }, m([0, 0.42, 0.178]));
    props.cones.push(cone);
  }

  // ---- Suspended Submarine Command Bridge Light Rig above the console ----
  {
    const c = v3(0, 2.28, -0.74);
    prop(c, 'lamp');
    for (const sx of [-0.46, 0.46]) {
      add(G.cyl(0.011, 0.011, H - c.y, 8), PAL.brass, { gloss: 0.8 }, xf([sx, (H + c.y) / 2, c.z]));
      add(G.box(0.065, 0.045, 0.065), PAL.steel, { gloss: 0.55 }, xf([sx, c.y + 0.02, c.z]));
    }
    add(G.box(1.18, 0.048, 0.07), PAL.steelDark, { gloss: 0.45 }, xf([0, c.y + 0.02, c.z]));
    add(G.box(0.18, 0.085, 0.12), PAL.walnutLight, { gloss: 0.5 }, xf([0, c.y + 0.03, c.z]));
    add(G.sphere(0.016, 8, 6), PAL.red, { glow: 1.55 }, xf([0, c.y + 0.03, c.z + 0.065]));
    for (const lx of [-0.38, 0.38]) {
      add(G.box(0.40, 0.062, 0.22), PAL.steel, { gloss: 0.52 }, xf([lx, c.y - 0.03, c.z]));
      add(G.box(0.44, 0.018, 0.26), PAL.brass, { gloss: 0.82 }, xf([lx, c.y - 0.062, c.z]));
      add(G.cyl(0.022, 0.022, 0.34, 12), 0xffe8b0, { glow: 1.9 }, xf([lx, c.y - 0.075, c.z], [0, 0, Math.PI / 2]));
      for (const gx of [-0.12, 0, 0.12]) {
        add(G.torus(0.038, 0.0035, 6, 14, Math.PI), PAL.brass, { gloss: 0.8 }, xf([lx + gx, c.y - 0.07, c.z], [Math.PI, Math.PI / 2, 0]));
      }
    }
  }

  // ---- Extensive 3D Floor Cable Network & Industrial Cable Ramps ("mit so Kabeln am Boden") ----
  {
    const addCable = (pts, rad, color, gloss = 0.48, segs = 20) => {
      const vpts = pts.map(([x, z, yOff = 0]) => v3(x, rad + 0.005 + yOff, z));
      const curve = new THREE.CatmullRomCurve3(vpts);
      const mid = curve.getPoint(0.5);
      prop(mid);
      add(new THREE.TubeGeometry(curve, segs, rad, 7, false), color, { gloss });
      for (const ep of [vpts[0], vpts[vpts.length - 1]]) {
        add(G.cyl(rad * 1.35, rad * 1.35, 0.035, 8), PAL.brass, { gloss: 0.78 }, xf([ep.x, ep.y + 0.008, ep.z]));
      }
    };

    // Under-console main floor cable manifold box
    prop(v3(0, 0.04, -0.82));
    add(G.box(0.54, 0.065, 0.24), PAL.steelDark, { gloss: 0.45 }, xf([0, 0.035, -0.82]));
    add(G.box(0.50, 0.012, 0.20), PAL.brass, { gloss: 0.78 }, xf([0, 0.07, -0.82]));

    // 1. Trunk from console to Left Speaker & Front-Left Wall
    addCable([[-0.18, -0.88], [-0.52, -1.08], [-0.94, -1.26], [-1.32, -1.48]], 0.022, PAL.cableBlack);
    addCable([[-0.12, -0.90], [-0.46, -1.14], [-0.88, -1.34], [-1.26, -1.52]], 0.015, PAL.cableAmber, 0.6);
    addCable([[-0.22, -0.86], [-0.68, -1.08], [-1.45, -1.18], [-2.18, -1.35]], 0.018, PAL.cableGrey);

    // 2. Trunk from console to Right Speaker & Front-Right Coolant Unit
    addCable([[0.18, -0.88], [0.54, -1.08], [0.95, -1.28], [1.32, -1.48]], 0.022, PAL.cableBlack);
    addCable([[0.12, -0.90], [0.48, -1.15], [0.88, -1.36], [1.25, -1.52]], 0.015, PAL.cableRed, 0.55);
    addCable([[0.24, -0.86], [0.78, -1.18], [1.38, -1.78], [1.88, -1.96]], 0.025, PAL.cableGrey);
    addCable([[0.20, -0.84], [0.72, -1.24], [1.32, -1.84], [1.82, -2.02]], 0.016, PAL.cableAmber, 0.6);

    // 3. Multi-cable bundle from under console to Left Spy Mainframe
    addCable([[-0.22, -0.84], [-0.58, -1.02], [-1.18, -0.96], [-2.02, -0.95]], 0.024, PAL.cableBlack);
    addCable([[-0.20, -0.82], [-0.62, -0.98], [-1.25, -0.82], [-2.02, -0.78]], 0.017, PAL.cableRed);
    addCable([[-0.18, -0.48], [-0.55, -0.22], [-1.32, -0.24], [-2.02, -0.22]], 0.019, PAL.cableGrey);
    addCable([[-0.14, -0.45], [-0.52, -0.15], [-1.35, -0.05], [-2.02, 0.05]], 0.014, PAL.cableAmber, 0.6);

    // 4. Multi-cable bundle from under console to Right Pneumatic Terminal & Tape Vault
    addCable([[0.22, -0.84], [0.62, -1.02], [1.32, -0.68], [2.04, -0.18]], 0.024, PAL.cableBlack);
    addCable([[0.20, -0.82], [0.66, -0.96], [1.38, -0.42], [2.04, 0.12]], 0.018, PAL.cableAmber, 0.6);
    addCable([[0.18, -0.48], [0.58, -0.20], [1.38, 0.18], [2.04, 0.55]], 0.021, PAL.cableGrey);
    addCable([[0.14, -0.45], [0.54, -0.14], [1.36, 0.42], [2.04, 0.85]], 0.015, PAL.cableRed);

    // 5. Heavy armored power cables snaking back to Rear Submarine Reactor & Hatch
    addCable([[0.12, -0.44], [0.64, -0.08], [0.96, 0.68], [0.85, 1.48], [0.45, 1.98]], 0.025, PAL.cableBlack, 0.5, 24);
    addCable([[0.08, -0.44], [0.58, -0.04], [0.89, 0.72], [0.78, 1.52], [0.35, 1.98]], 0.018, PAL.cableRed, 0.55, 24);
    addCable([[-0.12, -0.44], [-0.62, -0.06], [-0.95, 0.75], [-1.05, 1.55], [-1.10, 1.98]], 0.023, PAL.cableGrey, 0.5, 24);
    addCable([[-0.08, -0.44], [-0.56, -0.01], [-0.88, 0.80], [-0.96, 1.58], [-1.00, 1.98]], 0.015, PAL.cableAmber, 0.6, 24);

    // 6. Coiled spare cable spools lying on the floor
    for (const [cx, cz, colSpool] of [[-1.78, -1.58, PAL.cableAmber], [1.68, 1.42, PAL.cableBlack], [-0.65, 1.75, PAL.cableRed]]) {
      prop(v3(cx, 0.03, cz));
      for (let k = 0; k < 3; k++) {
        add(G.torus(0.14 - k * 0.012, 0.013, 7, 22), colSpool, { gloss: 0.55 }, xf([cx, 0.016 + k * 0.018, cz], [Math.PI / 2, 0, k * 0.4]));
      }
    }

    // 7. Industrial yellow/black floor cable bridge protector ramps
    const ramp = (rx, rz, ryaw, rw = 0.58) => {
      prop(v3(rx, 0.03, rz));
      const rm = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(rx, 0, rz).multiply(new THREE.Matrix4().makeRotationY(ryaw)).multiply(xf(p, r));
      add(G.box(rw, 0.036, 0.24), PAL.ink, { gloss: 0.3 }, rm([0, 0.022, 0]));
      add(G.box(rw - 0.02, 0.008, 0.11), PAL.hazard, { gloss: 0.45 }, rm([0, 0.044, 0]));
      for (let s = -rw / 2 + 0.06; s < rw / 2 - 0.04; s += 0.09) {
        add(G.box(0.035, 0.01, 0.112), PAL.ink, {}, rm([s, 0.0445, 0]));
      }
    };
    ramp(-1.12, -0.78, 0.12, 0.56);
    ramp(1.16, -0.45, -0.35, 0.56);
    ramp(0.88, 0.65, Math.PI / 2 + 0.12, 0.62);
  }

  // ---- Back Wall: Submarine Watertight Bulkhead Hatch Door + Vacuum-Tube Reactor Core ----
  {
    const z = ROOM.z1 - 0.025;
    // 1. Submarine Watertight Bulkhead Hatch Door (x = 1.16)
    const hx = 1.16, hy = 1.12;
    prop(v3(hx, hy, z));
    // Raised steel bulkhead coaming frame with chamfered corner gussets & threshold step
    add(G.box(1.16, 2.18, 0.09), PAL.steelDark, { gloss: 0.45 }, xf([hx, 1.12, z]));
    add(G.box(1.22, 0.16, 0.16), PAL.hazard, { gloss: 0.45 }, xf([hx, 0.08, z - 0.02]));
    add(slab(0.94, 1.96, 0.09, 0.04), PAL.walnut, { gloss: 0.48 }, xf([hx, 1.12, z - 0.045]));
    add(G.box(0.98, 2.00, 0.02), PAL.brass, { gloss: 0.78 }, xf([hx, 1.12, z - 0.038]));
    // 6 heavy perimeter dog-clamps & massive starboard hinge arms around the hatch door
    for (const dy of [0.45, 1.12, 1.78]) for (const dx of [-0.47, 0.47]) {
      add(G.box(0.08, 0.04, 0.06), PAL.brass, { gloss: 0.85 }, xf([hx + dx, dy, z - 0.085], [0, 0, dx < 0 ? 0.25 : -0.25]));
    }
    for (const hy2 of [0.58, 1.66]) {
      add(G.box(0.18, 0.09, 0.08), PAL.steel, { gloss: 0.6 }, xf([hx + 0.49, hy2, z - 0.075]));
      add(G.cyl(0.025, 0.025, 0.14, 12), PAL.brass, { gloss: 0.88 }, xf([hx + 0.55, hy2, z - 0.075]));
    }
    // Upper round armored submarine porthole window in the hatch (with glowing amber corridor light & perimeter bolts)
    const py = 1.56;
    add(G.cyl(0.19, 0.20, 0.045, 24), PAL.brass, { gloss: 0.88 }, xf([hx, py, z - 0.09], [Math.PI / 2, 0, 0]));
    add(G.torus(0.175, 0.018, 8, 24), PAL.steelDark, { gloss: 0.6 }, xf([hx, py, z - 0.112]));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(G.sphere(0.008, 6, 6), PAL.brass, { gloss: 0.9 }, xf([hx + Math.cos(a) * 0.175, py + Math.sin(a) * 0.175, z - 0.122]));
    }
    add(G.circle(0.16, 24), PAL.ledAmber, { glow: 1.15 }, xf([hx, py, z - 0.108], [0, Math.PI, 0]));
    for (const g of [-0.07, 0, 0.07]) {
      add(G.cyl(0.006, 0.006, 0.32, 6), PAL.steelDark, { gloss: 0.6 }, xf([hx + g, py, z - 0.115]));
    }
    // Central 6-spoke Red & Brass Submarine Hatch Locking Wheel (y = 0.86)
    const wy = 0.86, wz = z - 0.125;
    add(G.cyl(0.045, 0.055, 0.08, 16), PAL.brass, { gloss: 0.88 }, xf([hx, wy, wz + 0.025], [Math.PI / 2, 0, 0]));
    add(G.torus(0.19, 0.018, 10, 28), PAL.red, { gloss: 0.78 }, xf([hx, wy, wz - 0.01]));
    for (let i = 0; i < 6; i++) {
      add(G.cyl(0.009, 0.009, 0.36, 8), PAL.brass, { gloss: 0.88 }, xf([hx, wy, wz - 0.01], [0, 0, (i / 6) * Math.PI]));
    }
    add(G.sphere(0.032, 12, 8), PAL.brass, { gloss: 0.9 }, xf([hx, wy, wz - 0.02]));

    // Caged Red Submarine Klaxon Beacon & Twin Brass Dive Horns above Hatch Door
    prop(v3(hx, 2.38, z - 0.06), 'lamp');
    add(G.box(0.24, 0.14, 0.11), PAL.steelDark, { gloss: 0.45 }, xf([hx, 2.38, z - 0.06]));
    add(G.cyl(0.052, 0.058, 0.11, 16), PAL.red, { glow: 1.75, gloss: 0.75 }, xf([hx, 2.38, z - 0.12], [Math.PI / 2, 0, 0]));
    add(G.torus(0.058, 0.006, 6, 16), PAL.brass, { gloss: 0.85 }, xf([hx, 2.38, z - 0.15]));
    for (const sx of [-0.22, 0.22]) {
      add(G.cone(0.038, 0.12, 14, true), PAL.brass, { gloss: 0.88 }, xf([hx + sx, 2.38, z - 0.11], [-Math.PI / 2, 0, sx < 0 ? 0.3 : -0.3]));
    }

    // 2. Submarine Vacuum-Tube Reactor & Auxiliary Power Core on Back Wall (x = -0.95)
    const bx = -0.95;
    prop(v3(bx, 1.25, z - 0.09));
    add(slab(0.92, 1.56, 0.22, 0.025), PAL.steelDark, { gloss: 0.45 }, xf([bx, 1.24, z - 0.10]));
    add(G.box(0.82, 1.44, 0.022), PAL.walnutLight, { gloss: 0.48 }, xf([bx, 1.24, z - 0.205]));
    add(G.box(0.76, 0.08, 0.025), PAL.hazard, { gloss: 0.5 }, xf([bx, 1.88, z - 0.215]));
    // Recessed glass reactor bay with 3 glowing orange/amber power tubes
    add(G.box(0.52, 0.48, 0.03), PAL.ink, {}, xf([bx - 0.10, 1.48, z - 0.215]));
    for (let i = -1; i <= 1; i++) {
      const tx = bx - 0.10 + i * 0.15;
      add(G.cyl(0.042, 0.042, 0.36, 14), PAL.ledAmber, { glow: 1.7, gloss: 0.8 }, xf([tx, 1.48, z - 0.225]));
      for (const ry of [1.34, 1.48, 1.62]) {
        add(G.torus(0.046, 0.007, 6, 16), PAL.brass, { gloss: 0.88 }, xf([tx, ry, z - 0.225], [Math.PI / 2, 0, 0]));
      }
    }
    // Giant red double-pole knife switch on right of reactor cabinet
    add(G.box(0.16, 0.32, 0.045), PAL.ink, {}, xf([bx + 0.25, 1.48, z - 0.22]));
    add(G.box(0.08, 0.03, 0.14), PAL.red, { gloss: 0.75 }, xf([bx + 0.25, 1.56, z - 0.29], [0.45, 0, 0]));
    // 3 large brass submarine pressure gauges & red valve wheel below reactor bay
    for (let i = 0; i < 3; i++) {
      const gx = bx - 0.24 + i * 0.18;
      add(G.cyl(0.055, 0.055, 0.024, 18), PAL.brass, { gloss: 0.88 }, xf([gx, 1.04, z - 0.218], [Math.PI / 2, 0, 0]));
      add(G.circle(0.044, 18), PAL.ink, {}, xf([gx, 1.04, z - 0.232], [0, Math.PI, 0]));
      add(G.sphere(0.011, 8, 6), i === 0 ? PAL.ledGreen : PAL.ledAmber, { glow: 1.55 }, xf([gx, 0.90, z - 0.218]));
    }
    addValveWheel(bx + 0.26, 0.98, z - 0.23, [0, Math.PI, 0], 0.075, PAL.red);
    // Vertical copper & steel conduits from reactor core to floor & ceiling
    for (const cx of [bx - 0.28, bx - 0.10, bx + 0.10, bx + 0.28]) {
      add(G.cyl(0.022, 0.022, 0.46, 10), PAL.steel, { gloss: 0.55 }, xf([cx, 0.23, z - 0.11]));
      add(G.cyl(0.020, 0.020, H - 2.02, 10), PAL.copper, { gloss: 0.75 }, xf([cx, (H + 2.02) / 2, z - 0.11]));
    }
  }

  // ---- Left Wall: 1960s Spy Mainframe Computer, Twin Reel-to-Reel Banks, Radar Scope & Cassette Vault ----
  {
    const x = ROOM.x0 + 0.28;
    // Lower submarine equipment console base with red valve wheel & cooling grilles
    prop(v3(x, 0.42, -0.58));
    add(slab(1.76, 0.54, 0.48, 0.025), PAL.steelDark, { gloss: 0.42 }, xf([x, 0.48, -0.58], [0, Math.PI / 2, 0]));
    add(G.box(0.52, 0.038, 1.80), PAL.steel, { gloss: 0.52 }, xf([x, 0.76, -0.58]));
    add(G.box(0.018, 0.022, 1.80), PAL.brass, { gloss: 0.8 }, xf([x + 0.255, 0.76, -0.58]));
    for (let i = 0; i < 4; i++) {
      const dz = -1.22 + i * 0.42;
      add(G.box(0.016, 0.42, 0.38), PAL.walnutLight, { gloss: 0.45 }, xf([x + 0.248, 0.48, dz]));
      add(G.box(0.024, 0.12, 0.018), PAL.brass, { gloss: 0.85 }, xf([x + 0.264, 0.52, dz - 0.12]));
    }
    for (const zz of [-1.36, -0.58, 0.2]) for (const xx of [x - 0.18, x + 0.18]) {
      add(G.box(0.048, 0.22, 0.048), PAL.steel, { gloss: 0.5 }, xf([xx, 0.11, zz]));
    }
    // High-pressure hull valve wheel on left wall pipe manifold
    addValveWheel(ROOM.x0 + 0.06, 0.94, -1.62, [0, Math.PI / 2, 0], 0.072, PAL.red);

    // Hooded Spy CRT Signal Analyzer & Blinking Mainframe Matrix on left of console ('globe' piece tag)
    prop(v3(x, 0.98, -1.16), 'globe');
    add(slab(0.42, 0.36, 0.44, 0.02), PAL.steelDark, { gloss: 0.48 }, xf([x, 0.95, -1.16], [0, Math.PI / 2, 0]));
    add(G.cyl(0.11, 0.12, 0.08, 20), PAL.brass, { gloss: 0.85 }, xf([x + 0.21, 0.98, -1.24], [0, 0, Math.PI / 2]));
    add(G.circle(0.095, 20), PAL.ledGreen, { glow: 1.45 }, xf([x + 0.252, 0.98, -1.24], [0, Math.PI / 2, 0]));
    // Blinking spy mainframe status light grid
    for (let iy = 0; iy < 4; iy++) for (let iz = 0; iz < 3; iz++) {
      const cBit = (iy + iz) % 3 === 0 ? PAL.red : (iy + iz) % 2 === 0 ? PAL.ledAmber : PAL.ledGreen;
      add(G.box(0.012, 0.022, 0.022), cBit, { glow: 1.4 }, xf([x + 0.222, 0.84 + iy * 0.055, -1.08 + iz * 0.045]));
    }

    // Twin Upright Reel-to-Reel Magnetic Tape Computers on right of console
    prop(v3(x, 1.06, -0.08));
    add(slab(0.56, 0.58, 0.26, 0.02), PAL.steelDark, { gloss: 0.48 }, xf([x - 0.03, 1.06, -0.08], [0, Math.PI / 2, 0]));
    add(G.box(0.016, 0.24, 0.52), PAL.steel, { gloss: 0.55 }, xf([x + 0.102, 0.89, -0.08]));
    for (const rz of [-0.21, 0.05]) {
      add(G.cyl(0.115, 0.115, 0.018, 24), PAL.steelLight, { gloss: 0.8 }, xf([x + 0.11, 1.18, rz], [0, 0, Math.PI / 2]));
      add(G.cyl(0.082, 0.082, 0.02, 20), PAL.ink, { gloss: 0.4 }, xf([x + 0.112, 1.18, rz], [0, 0, Math.PI / 2]));
      add(G.cyl(0.028, 0.028, 0.026, 14), PAL.brass, { gloss: 0.88 }, xf([x + 0.116, 1.18, rz], [0, 0, Math.PI / 2]));
      for (let s = 0; s < 3; s++) {
        const a = (s / 3) * Math.PI * 2;
        add(G.box(0.024, 0.014, 0.095), PAL.steelLight, { gloss: 0.85 }, xf([x + 0.114, 1.18 + Math.cos(a) * 0.055, rz + Math.sin(a) * 0.055], [a, 0, 0]));
      }
    }
    // Threaded magnetic tape path & brass guide rollers between the twin reels
    for (const gz of [-0.23, -0.14, -0.02, 0.07]) {
      add(G.cyl(0.011, 0.011, 0.024, 12), PAL.brass, { gloss: 0.9 }, xf([x + 0.112, 1.01, gz], [0, 0, Math.PI / 2]));
    }
    add(G.box(0.012, 0.004, 0.28), 0x3b2316, { gloss: 0.7 }, xf([x + 0.112, 1.00, -0.08]));
    add(G.box(0.028, 0.065, 0.16), PAL.brass, { gloss: 0.85 }, xf([x + 0.114, 0.95, -0.08]));
    for (const vz of [-0.15, -0.01]) {
      add(G.plane(0.075, 0.046), PAL.ledAmber, { glow: 1.35 }, xf([x + 0.115, 0.85, vz], [0, Math.PI / 2, 0]));
    }

    // Wall-mounted Armored Spy Cassette & Film-Canister Locker on left wall (z = 0.28)
    const rx = ROOM.x0 + 0.09, rz = 0.28;
    prop(v3(rx, 1.56, rz));
    add(G.box(0.15, 0.82, 0.52), PAL.steelDark, { gloss: 0.45 }, xf([rx, 1.56, rz]));
    add(G.box(0.16, 0.024, 0.54), PAL.brass, { gloss: 0.8 }, xf([rx + 0.005, 1.96, rz]));
    const spCols = [PAL.red, PAL.brass, PAL.steelLight, PAL.orange, PAL.ledGreen, PAL.mustard];
    for (let row = 0; row < 4; row++) {
      const sy = 1.24 + row * 0.18;
      add(G.box(0.155, 0.018, 0.48), PAL.steel, { gloss: 0.52 }, xf([rx + 0.005, sy - 0.05, rz]));
      for (let k = 0; k < 9; k++) {
        const sz = rz - 0.19 + k * 0.046;
        add(G.box(0.11, 0.075, 0.016), PAL.ink, { gloss: 0.48 }, xf([rx + 0.02, sy, sz]));
        add(G.box(0.007, 0.065, 0.012), spCols[(row * 5 + k) % spCols.length], { gloss: 0.55 }, xf([rx + 0.076, sy, sz]));
      }
    }
  }

  // ---- Back-Left Corner: Submarine Command Chair & Searchlight Tripod ----
  {
    const bx = -1.62, bz = 1.22, yaw = Math.atan2(0 - bx, -0.7 - bz);
    const cm = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(bx, 0, bz).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(xf(p, r));
    prop(v3(bx, 0.5, bz));
    add(slab(0.68, 0.64, 0.12, 0.05), PAL.leather, { gloss: 0.38 }, cm([0, 0.42, 0.02], [Math.PI / 2, 0, 0]));
    add(slab(0.66, 0.58, 0.11, 0.05), PAL.leather, { gloss: 0.38 }, cm([0, 0.78, -0.26], [-0.18, 0, 0]));
    add(slab(0.74, 0.64, 0.04, 0.04), PAL.steelDark, { gloss: 0.52 }, cm([0, 0.77, -0.33], [-0.18, 0, 0]));
    add(slab(0.74, 0.68, 0.04, 0.04), PAL.steelDark, { gloss: 0.52 }, cm([0, 0.34, 0.01], [Math.PI / 2, 0, 0]));
    for (const sx of [-1, 1]) {
      add(G.box(0.05, 0.28, 0.05), PAL.brass, { gloss: 0.78 }, cm([sx * 0.36, 0.48, -0.08]));
      add(slab(0.07, 0.48, 0.04, 0.02), PAL.walnutLight, { gloss: 0.48 }, cm([sx * 0.36, 0.62, -0.02], [Math.PI / 2, 0, 0]));
    }
    add(G.cyl(0.04, 0.045, 0.32, 12), PAL.brass, { gloss: 0.78 }, cm([0, 0.17, 0]));
    for (let i = 0; i < 5; i++) {
      add(G.box(0.055, 0.03, 0.34), PAL.steelDark, { gloss: 0.5 }, cm([Math.sin(i * 1.2566) * 0.16, 0.025, Math.cos(i * 1.2566) * 0.16], [0, i * 1.2566, 0]));
    }

    // Industrial Tripod Bunker Searchlight
    const lx = -2.06, lz = 1.68;
    prop(v3(-1.5, 1.3, 1.2), 'lamp');
    add(G.cyl(0.022, 0.026, 1.45, 10), PAL.steel, { gloss: 0.6 }, xf([lx, 0.78, lz]));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094 + 0.4;
      add(G.cyl(0.014, 0.014, 0.48, 8), PAL.steelDark, { gloss: 0.5 }, xf([lx + Math.cos(a) * 0.16, 0.16, lz + Math.sin(a) * 0.16], [Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]));
    }
    const curve = new THREE.QuadraticBezierCurve3(v3(lx, 1.48, lz), v3(lx + 0.18, 2.15, lz - 0.18), v3(-1.52, 1.72, 1.12));
    add(new THREE.TubeGeometry(curve, 16, 0.016, 8), PAL.brass, { gloss: 0.8 });
    const headM = new THREE.Matrix4().makeTranslation(-1.52, 1.68, 1.12).multiply(new THREE.Matrix4().makeRotationY(0.65)).multiply(new THREE.Matrix4().makeRotationX(0.42));
    add(G.box(0.28, 0.18, 0.20), PAL.hazard, { gloss: 0.55 }, headM);
    add(G.box(0.26, 0.16, 0.02), PAL.steelDark, { gloss: 0.5 }, headM.clone().multiply(xf([0, 0, -0.095])));
    add(G.plane(0.23, 0.13), 0xffe8b0, { glow: 1.9 }, headM.clone().multiply(xf([0, 0, -0.108], [0, Math.PI, 0])));
    for (const gx of [-0.07, 0, 0.07]) {
      add(G.box(0.006, 0.15, 0.006), PAL.ink, {}, headM.clone().multiply(xf([gx, 0, -0.112])));
    }
  }

  // ---- Front-Right Corner: Submarine Ballast Pump & High-Pressure Valve Manifold ----
  {
    const px = 1.96, pz = -2.02;
    prop(v3(px, 0.68, pz));
    add(slab(0.54, 0.94, 0.50, 0.03), PAL.steelDark, { gloss: 0.45 }, xf([px, 0.48, pz]));
    add(G.box(0.58, 0.06, 0.54), PAL.steel, { gloss: 0.52 }, xf([px, 0.03, pz]));
    for (let i = -3; i <= 3; i++) {
      add(G.box(0.018, 0.68, 0.52), PAL.walnutLight, { gloss: 0.5 }, xf([px + i * 0.062, 0.48, pz]));
    }
    for (const [bx, bz, cPipe] of [[px - 0.12, pz - 0.08, PAL.copper], [px + 0.12, pz + 0.08, PAL.steelLight]]) {
      for (let k = 0; k < 4; k++) {
        add(G.cyl(0.044, 0.034, 0.04, 12), PAL.brass, { gloss: 0.82 }, xf([bx, 0.96 + k * 0.042, bz]));
      }
      add(G.cyl(0.024, 0.024, H - 1.12, 10), cPipe, { gloss: 0.72 }, xf([bx, (H + 1.12) / 2, bz]));
    }
    add(G.cyl(0.058, 0.058, 0.03, 16), PAL.brass, { gloss: 0.88 }, xf([px - 0.14, 0.78, pz + 0.26], [Math.PI / 2, 0, 0]));
    add(G.circle(0.044, 16), PAL.ink, {}, xf([px - 0.14, 0.78, pz + 0.278]));
    add(G.sphere(0.016, 10, 8), PAL.ledAmber, { glow: 1.75 }, xf([px + 0.14, 0.78, pz + 0.26]));
    addValveWheel(px - 0.28, 0.62, pz + 0.05, [0, -Math.PI / 2, 0], 0.075, PAL.red);
  }

  // ---- Right Wall: Pneumatic Tube Dispatch Station + Master Tape Archive Vault + Bulkhead Clock ----
  {
    // 1. IEYTD Pneumatic Tube Dispatch & Spy Capsule Terminal (z = -1.08)
    const tx = ROOM.x1 - 0.18, tz = -1.08;
    prop(v3(tx, 1.38, tz));
    // Heavy steel & brass receiving terminal console on the right wall
    add(slab(0.32, 0.74, 0.56, 0.02), PAL.steelDark, { gloss: 0.48 }, xf([tx, 1.18, tz]));
    add(G.box(0.34, 0.03, 0.58), PAL.brass, { gloss: 0.85 }, xf([tx, 1.54, tz]));
    add(G.box(0.34, 0.03, 0.58), PAL.brass, { gloss: 0.85 }, xf([tx, 0.82, tz]));
    // Twin brass pneumatic delivery tubes descending from ceiling into the terminal
    for (const oz of [-0.14, 0.14]) {
      add(G.cyl(0.042, 0.042, H - 1.54, 16), PAL.copper, { gloss: 0.82 }, xf([tx, (H + 1.54) / 2, tz + oz]));
      add(G.torus(0.052, 0.012, 8, 16), PAL.brass, { gloss: 0.88 }, xf([tx, 1.85, tz + oz], [Math.PI / 2, 0, 0]));
      add(G.torus(0.052, 0.012, 8, 16), PAL.brass, { gloss: 0.88 }, xf([tx, 2.35, tz + oz], [Math.PI / 2, 0, 0]));
    }
    // Illuminated pneumatic capsule inspection chamber with a brass spy canister inside!
    add(G.box(0.06, 0.36, 0.24), PAL.ink, {}, xf([tx - 0.14, 1.24, tz - 0.10]));
    add(G.cyl(0.034, 0.034, 0.18, 14), PAL.brass, { gloss: 0.9 }, xf([tx - 0.14, 1.24, tz - 0.10]));
    add(G.cyl(0.036, 0.036, 0.06, 14), PAL.red, { gloss: 0.75 }, xf([tx - 0.14, 1.24, tz - 0.10]));
    add(G.sphere(0.014, 8, 6), PAL.ledGreen, { glow: 1.65 }, xf([tx - 0.165, 1.46, tz - 0.10]));
    // Pneumatic pressure gauge & red release valve wheel
    add(G.cyl(0.052, 0.052, 0.025, 16), PAL.brass, { gloss: 0.88 }, xf([tx - 0.16, 1.34, tz + 0.14], [0, 0, Math.PI / 2]));
    add(G.circle(0.04, 16), PAL.ink, {}, xf([tx - 0.175, 1.34, tz + 0.14], [0, -Math.PI / 2, 0]));
    addValveWheel(tx - 0.17, 1.04, tz + 0.14, [0, -Math.PI / 2, 0], 0.068, PAL.red);

    // 2. Master Tape Archive Vault & Splicing Deck (z = 0.4)
    const x = ROOM.x1 - 0.22;
    prop(v3(x, 0.72, 0.4));
    add(G.box(0.04, 1.24, 1.52), PAL.steelDark, { gloss: 0.42 }, xf([x + 0.15, 0.64, 0.4]));
    for (const sz of [-0.34, 1.14]) {
      add(G.box(0.36, 1.24, 0.045), PAL.steelDark, { gloss: 0.48 }, xf([x, 0.64, sz]));
      for (let by = 0.16; by <= 1.18; by += 0.17) {
        add(G.sphere(0.009, 6, 6), PAL.brass, { gloss: 0.85 }, xf([x - 0.185, by, sz]));
      }
    }
    for (const y of [0.04, 0.42, 0.82, 1.24]) {
      add(G.box(0.36, 0.035, 1.52), PAL.steel, { gloss: 0.52 }, xf([x, y, 0.4]));
    }
    add(G.box(0.02, 1.14, 1.42), PAL.ink, {}, xf([x - 0.16, 0.64, 0.4]));

    // Master Tape Dubbing & Splicing Unit on top of the rack ('turntable' tag preserved)
    prop(v3(x, 1.31, 0.55), 'turntable');
    add(slab(0.44, 0.34, 0.09, 0.015), PAL.steelDark, { gloss: 0.48 }, xf([x - 0.02, 1.30, 0.55], [Math.PI / 2, 0, 0]));
    for (const rz of [0.43, 0.65]) {
      add(G.cyl(0.095, 0.095, 0.014, 24), PAL.steelLight, { gloss: 0.78 }, xf([x - 0.02, 1.355, rz]));
      add(G.cyl(0.032, 0.032, 0.018, 16), PAL.brass, { gloss: 0.88 }, xf([x - 0.02, 1.358, rz]));
    }
    add(G.box(0.08, 0.025, 0.16), PAL.brass, { gloss: 0.82 }, xf([x - 0.12, 1.355, 0.54]));
    add(G.sphere(0.008, 8, 6), PAL.ledGreen, { glow: 1.55 }, xf([x - 0.16, 1.36, 0.42]));
  }

  // ---------------------------------------------------------------------------------------
  const shellMat = toon({ pieces });
  const mesh = B.build(shellMat);
  mesh.name = 'room-batch';
  group.add(mesh);

  // ---------------------------------------------------------------------------------------
  // Textured, separately moving props (steel floor plate, schematic display, master clock, tape bays)
  const textured = [];
  const tmesh = (geo, tex, pos, rot = [0, 0, 0], opts = {}) => {
    const m = new THREE.Mesh(paint(geo, 0xffffff, opts), toon({ map: tex, transparent: !!opts.transparent, polygonOffset: !!opts.decal }));
    m.position.set(...pos); m.rotation.set(...rot);
    m.userData.rest = { p: m.position.clone(), q: m.quaternion.clone() };
    group.add(m); textured.push(m);
    return m;
  };
  const rug = tmesh(G.plane(2.6, 2.0), rugTexture(), [0, 0.004, -0.55], [-Math.PI / 2, 0, 0], { decal: true, gloss: 0.25 });
  rug.material.uniforms.uTint.value.set(0xffffff);

  // Backlit technical schematic display on left wall (8 mm in front of frame backing, decal enabled)
  tmesh(G.plane(0.62, 0.92), artTexture(), [ROOM.x0 + 0.032, 1.62, -0.6], [0, Math.PI / 2, 0], { decal: true, glow: 0.35 });
  {
    const f = new THREE.Mesh(paint(slab(0.72, 1.02, 0.032, 0.012), PAL.steelDark, { gloss: 0.5 }), toon());
    f.position.set(ROOM.x0 + 0.008, 1.62, -0.6); f.rotation.set(0, Math.PI / 2, 0);
    f.userData.rest = { p: f.position.clone(), q: f.quaternion.clone() };
    group.add(f); textured.push(f);
  }

  // Master tape archive bays on right wall (clean 12 mm clearance from backing plate)
  tmesh(G.plane(1.38, 0.33), recordSpines(), [ROOM.x1 - 0.395, 0.62, 0.4], [0, -Math.PI / 2, 0], { decal: true });
  tmesh(G.plane(1.38, 0.33), recordSpines(), [ROOM.x1 - 0.395, 1.02, 0.4], [0, -Math.PI / 2, 0], { decal: true });

  // Submarine Bulkhead Master Chronometer (face + heavy steel/brass bolted bezel + hands)
  const clock = new THREE.Group();
  clock.position.set(ROOM.x1 - 0.04, 1.95, 0.4); clock.rotation.set(0, -Math.PI / 2, 0);
  {
    const b = new Batch();
    b.add(paint(G.cyl(0.22, 0.23, 0.036, 32), PAL.steelDark, { gloss: 0.55, m: xf([0, 0, -0.018], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(0.20, 0.016, 10, 32), PAL.brass, { gloss: 0.85, m: xf([0, 0, 0.004]) }));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.add(paint(G.box(0.022, 0.055, 0.018), i % 3 === 0 ? PAL.brass : PAL.steel, { gloss: 0.75, m: new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(0, 0.225, 0.002)) }));
      b.add(paint(G.cyl(0.007, 0.007, 0.024, 6), PAL.brass, { gloss: 0.9, m: new THREE.Matrix4().makeRotationZ(a).multiply(new THREE.Matrix4().makeTranslation(0, 0.235, 0.006)).multiply(xf([0, 0, 0], [Math.PI / 2, 0, 0])) }));
    }
    clock.add(b.build(toon()));
    const face = new THREE.Mesh(paint(G.plane(0.4, 0.4), 0xffffff, { glow: 0.25 }), toon({ map: clockFace(), transparent: true, polygonOffset: true }));
    face.position.z = 0.008;
    clock.add(face);
    const hand = (len, w, c) => {
      const g = paint(G.box(w, len, 0.004), c, { m: xf([0, len / 2 - 0.015, 0]) });
      const m = new THREE.Mesh(g, toon()); m.position.z = 0.016; clock.add(m); return m;
    };
    props.hourHand = hand(0.078, 0.011, PAL.brass);
    props.minHand = hand(0.112, 0.008, 0xefe2c4);
    props.secHand = hand(0.118, 0.0035, PAL.red);
    props.secHand.position.z = 0.021;
  }
  clock.userData.rest = { p: clock.position.clone(), q: clock.quaternion.clone() };
  group.add(clock); textured.push(clock);
  props.clock = clock;

  // window glass: faint additive reflection streaks
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.ShaderMaterial({
    uniforms: { uExposure: LIGHT.uExposure, uAmt: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uExposure, uAmt; varying vec2 vUv; void main(){
      float s = smoothstep(0.0, 0.02, fract(vUv.x * 1.4 + vUv.y * 0.9) - 0.82) * (1.0 - smoothstep(0.02, 0.09, fract(vUv.x * 1.4 + vUv.y * 0.9) - 0.82));
      float a = 0.03 + s * 0.05; gl_FragColor = vec4(vec3(0.75, 0.82, 0.9) * a * uAmt * uExposure, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glass.position.set(0, (WIN.y0 + WIN.y1) / 2, ROOM.z0 - 0.02);
  group.add(glass);

  // industrial steel louver blind (raised during the intro)
  const blind = new THREE.Group();
  {
    const b = new Batch();
    const n = 30, hgt = WIN.y1 - WIN.y0;
    for (let i = 0; i < n; i++) b.add(paint(G.box(WIN.x1 - WIN.x0 - 0.02, 0.05, 0.004), PAL.steel, { gloss: 0.4, m: xf([0, -hgt + (i + 0.5) * (hgt / n), 0], [-0.25, 0, 0]) }));
    b.add(paint(G.box(WIN.x1 - WIN.x0, 0.03, 0.03), PAL.steelDark, { m: xf([0, -hgt, 0]) }));
    props.blindMesh = b.build(toon());
    blind.add(props.blindMesh);
  }
  blind.position.set(0, WIN.y1, ROOM.z0 - 0.035);
  group.add(blind);
  props.blind = blind;
  props.glass = glass;
  for (const m of [blind, glass]) { m.userData.rest = { p: m.position.clone(), q: m.quaternion.clone() }; textured.push(m); }

  // ---------------------------------------------------------------------------------------
  // Wires (sorted so the ones nearest to the deck start first)
  const deckPos = v3(0, 0.9, -0.7);
  wires.forEach((w) => { if (w.a.distanceTo(deckPos) > w.b.distanceTo(deckPos)) { const t = w.a; w.a = w.b; w.b = t; } });
  wires.sort((p, q) => p.a.distanceTo(deckPos) - q.a.distanceTo(deckPos));
  const wireCount = Math.min(48, wires.length);
  const wpos = [], walong = [], wid = [], wside = [], widx = [];
  for (let i = 0; i < wireCount; i++) {
    const w = wires[i];
    const dir = w.b.clone().sub(w.a); const len = dir.length(); dir.normalize();
    const side = dir.clone().cross(w.n).normalize().multiplyScalar(0.06);
    const base = wpos.length / 3;
    for (const [s, sd] of [[-1, -1], [1, 1]]) {
      wpos.push(...w.a.clone().addScaledVector(side, s).toArray()); walong.push(0); wside.push(sd); wid.push(i);
      wpos.push(...w.b.clone().addScaledVector(side, s).toArray()); walong.push(len); wside.push(sd); wid.push(i);
    }
    widx.push(base, base + 1, base + 3, base, base + 3, base + 2);
    w.len = len;
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
  wg.setAttribute('aAlong', new THREE.Float32BufferAttribute(walong, 1));
  wg.setAttribute('aWire', new THREE.Float32BufferAttribute(wid, 1));
  wg.setAttribute('aSide', new THREE.Float32BufferAttribute(wside, 1));
  wg.setIndex(widx);
  const wireU = {
    uTime: { value: 0 }, uFade: { value: 1 }, uPulse: { value: 0 }, uExposure: LIGHT.uExposure,
    uT0: { value: new Array(48).fill(1e6) }, uSpeed: { value: new Array(48).fill(8) }, uColor: { value: col(0xffc24a) },
  };
  const wireMesh = new THREE.Mesh(wg, new THREE.ShaderMaterial({
    uniforms: wireU, vertexShader: WIRE_V, fragmentShader: WIRE_F,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  wireMesh.frustumCulled = false;
  wireMesh.renderOrder = 5;
  group.add(wireMesh);

  // ---------------------------------------------------------------------------------------
  // Break / rebuild: closed-form motion so it can run forward and backward.
  const head = v3(0, 1.4, 0);
  for (const p of pieces.pieces) {
    const r = Math.random;
    const d = p.center.clone().sub(head);
    const dist = d.length();
    d.normalize();
    if (p.tag === 'shell' && p.data.n) d.addScaledVector(p.data.n, -0.6).normalize(); // panels fall outward
    d.x += (r() - 0.5) * 0.5; d.y += (r() - 0.5) * 0.4; d.z += (r() - 0.5) * 0.5; d.normalize();
    p.fly = {
      dir: d,
      reach: 2.5 + r() * 5 + dist * 0.6,
      tau: 0.9 + r() * 1.6,
      drift: 0.15 + r() * 0.35,
      axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      spin: (0.4 + r() * 1.6) * (r() > 0.5 ? 1 : -1),
      delay: Math.min(0.5, dist * 0.06) + r() * 0.12,
      shrink: 0.15 + r() * 0.5,
    };
  }
  const texturedFly = textured.map((m) => {
    const r = Math.random;
    const d = m.userData.rest.p.clone().sub(head).normalize();
    return { m, dir: d, reach: 3 + r() * 4, tau: 1 + r() * 1.4, axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), spin: (r() - 0.5) * 2, delay: 0.1 + r() * 0.2 };
  });
  const _q = new THREE.Quaternion();
  let breakU = 0;
  function applyBreak(u, jitter = 0, time = 0) {
    breakU = u + jitter;
    for (const p of pieces.pieces) {
      if (p.tag === 'cone' && u <= 0 && jitter <= 0) continue;
      const f = p.fly;
      const t = Math.max(0, u - f.delay);
      const k = 1 - Math.exp(-t / f.tau);
      const fade = t > 1.8 ? Math.max(0.06, Math.exp(-(t - 1.8) * 0.45)) : 1;
      p.t.copy(f.dir).multiplyScalar(f.reach * k + f.drift * t);
      p.q.setFromAxisAngle(f.axis, f.spin * t * (0.6 + 0.4 * k));
      p.s = (1 - f.shrink * k) * fade;
      if (jitter > 0) {
        const ph = p.id * 1.731;
        const a = jitter * (0.4 + 0.6 * ((p.id * 0.618) % 1));
        p.t.x += Math.sin(time * 41 + ph) * a; p.t.y += Math.sin(time * 37 + ph * 2.3) * a; p.t.z += Math.sin(time * 45 + ph * 0.7) * a;
        _q.setFromAxisAngle(f.axis, Math.sin(time * 29 + ph) * a * 6);
        p.q.premultiply(_q);
      }
    }
    pieces.flush();
    for (const f of texturedFly) {
      const t = Math.max(0, u - f.delay);
      const k = 1 - Math.exp(-t / f.tau);
      const fade = t > 1.8 ? Math.max(0.001, Math.exp(-(t - 1.8) * 0.55)) : 1;
      f.m.position.copy(f.m.userData.rest.p).addScaledVector(f.dir, f.reach * k + 0.2 * t);
      f.m.quaternion.copy(f.m.userData.rest.q).premultiply(_q.setFromAxisAngle(f.axis, f.spin * t));
      f.m.scale.setScalar(fade);
    }
    props.glass.visible = u < 0.05;
  }

  // ---------------------------------------------------------------------------------------
  const api = {
    group, mesh, pieces, wires, wireU, wireMesh, props, textured, glass, blind, wireCount,
    get breakU() { return breakU; },
    applyBreak,
    scheduleWires(t0, t1, speed = 7) {
      for (let i = 0; i < 48; i++) { wireU.uT0.value[i] = i < wireCount ? t0 + (t1 - t0) * (i / Math.max(1, wireCount - 1)) : 1e6; wireU.uSpeed.value[i] = speed; }
    },
    clearWires() { for (let i = 0; i < 48; i++) wireU.uT0.value[i] = 1e6; wireU.uFade.value = 1; },
    update(dt, t, levels) {
      if (breakU <= 0 && levels) {
        for (const c of props.cones) { c.t.copy(c.data.dir).multiplyScalar(levels.low * 0.012); c.s = 1 + levels.low * 0.04; pieces.write(c); }
        pieces.texture.needsUpdate = true;
      }
      const now = new Date();
      const sec = now.getSeconds() + now.getMilliseconds() / 1000;
      if (!props.clockOverride) {
        props.secHand.rotation.z = -(sec / 60) * Math.PI * 2;
        props.minHand.rotation.z = -((now.getMinutes() + sec / 60) / 60) * Math.PI * 2;
        props.hourHand.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
      }
      wireU.uTime.value = t;
    },
  };
  return api;
}

// Liang-Barsky clip of segment (x0,y0)-(x1,y1) extended to infinity against rect [a,b,c,d]
function clipSeg(x0, y0, x1, y1, [rx0, ry0, rx1, ry1]) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const ax = x0 - ux * 50, ay = y0 - uy * 50, bx = x0 + ux * 50, by = y0 + uy * 50;
  let t0 = 0, t1 = 1;
  const ex = bx - ax, ey = by - ay;
  const p = [-ex, ex, -ey, ey], q = [ax - rx0, rx1 - ax, ay - ry0, ry1 - ay];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-12) { if (q[i] < 0) return null; continue; }
    const r = q[i] / p[i];
    if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  if (t1 - t0 < 1e-6) return null;
  return [ax + ex * t0, ay + ey * t0, ax + ex * t1, ay + ey * t1];
}
