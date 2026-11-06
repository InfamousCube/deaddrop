// Ten floors under: the lift shaft (B1..B10) and the vault at its bottom. The vault group uses
// "vault coordinates": its floor is y = 0, so once the platform has docked they equal world space.
//   drum     a ring of deposit boxes with the big round door in it. It turns ("the whole room
//            spins") and brings the door round from behind the player to the front
//   door     spoked wheel, combination dial, twelve sliding bolts, a hinge; swings open
//   arms     two ceiling-hung manipulators: cream enamel, copper joints, velvet grippers, a camera
//            eye between the fingers. They look at the player, waltz, crack the door
//   lasers   a cage of ten red beams round the platform that waltzes in 3/4
//   counter  a brass number drum above the door: "count down to zero", "three, two, one"
//   spool    the loot: a golden wire spool. Its wire shoots across the vault into the player's deck
// The heist runs on "vault time" tv, which the bridge rewinds like the tape ("you were never here").
import * as THREE from 'three';
import { paint, G, Batch, xf, slab } from '../../gfx/shade.js';
import { SU, PAL, poster, Sprites, ribbonMat, ribbonGeo, V } from './mat.js';
import { digitDrum } from './text.js';
import { canvasTex, FONT } from '../../gfx/textures.js';
import { sm, clamp01, hit } from '../util.js';
import { mulberry } from './roombox.js';

export const VAULT = { depth: 18.3, floorH: 1.1, shaftR: 4.3, wallR: 7.2, height: 6.8 };
const TAU = Math.PI * 2;
const BEAT = 60 / 105.74;
const lerp = (a, b, k) => a + (b - a) * k;
const smoother = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * k * (k * (k * 6 - 15) + 10); };
const pulse = (t, a, b, fi = 0.1, fo = 0.2) => sm(a, a + fi, t) * (1 - sm(b, b + fo, t));

// the heist, in vault time (song seconds)
export const K = {
  lights: 47.48, sparks: 49.34, armsDown: 51.44, spy: 53.98, lasers: 56.52, zero: 57.5, why: 58.48, ask: 59.4, whyW: 59.84,
  gold2: 59.96, ohoh: 64.0, velvet: 68.58, steel: 70.04, waltz: 71.52, beam: 74.62, red: 77.62, spin0: 78.2, spin1: 81.18,
  tick1: 85.42, tick2: 87.02, breathe: 87.28, bolts0: 88.86, bolts1: 90.64, hold: 91.04, open0: 93.14, open1: 95.0,
  wire: 95.16, wireIn: 96.64, fire: 97.44, smile: 99.68, lie: 102.1, count0: 104.34, count1: 105.76, gold3: 109.98,
  three: 112.62, two: 114.6, one: 115.9, rew0: 117.74, rew1: 124.2, out0: 124.94, out1: 126.38,
};
const REW_TO = 47.6;
export function vaultTime(t) {
  if (t < K.rew0) return t;
  if (t < K.rew1) {
    const k = clamp01((t - K.rew0) / (K.rew1 - K.rew0));
    return lerp(K.rew0, REW_TO, k * k * (3 - 2 * k));
  }
  return REW_TO;
}
// drum angle: door behind the player (pi) until the spin, then in front (0). The rewind turns it
// back slowly in song time, so the fast-rewinding heist never whips the walls round.
function drumAngle(t, tv) {
  if (t >= K.rew0) return Math.PI * smoother(K.rew0 + 0.4, K.rew1, t);
  if (tv < K.spin0) return Math.PI;
  return Math.PI * (1 - smoother(K.spin0, K.spin1, tv));
}
// number drum: a continuous digit value; the drum only ever rolls one way
const LASER_DT = (K.zero - K.lasers) / 9;
const STEPS = [];
for (let i = 1; i <= 9; i++) STEPS.push(K.lasers + i * LASER_DT); // 9 -> 0 "count down to zero"
STEPS.push(K.gold2); // 0 -> 9
for (let i = 0; i < 9; i++) STEPS.push(K.count0 + (i + 1) * (K.count1 - K.count0) / 9); // 9 -> 0
for (let i = 0; i < 7; i++) STEPS.push(K.three - 0.05 + i * 0.06); // 0 -> 3, a quick whirr
STEPS.push(K.two, K.one);
function digitAt(tv) { let d = 9; for (const s of STEPS) d -= smoother(s, s + 0.09, tv); return d; }

// unlit textured material (plates, dial)
function texMat(map, k) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uExposure: SU.uExposure, uFade: SU.uFade },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uExposure, uFade; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb * ${k.toFixed(3)} * uExposure * uFade, 1.0);\n#include <colorspace_fragment>\n}`,
    side: THREE.DoubleSide,
  });
}

export function buildVault(ctx) {
  const world = ctx.world;
  const group = new THREE.Group();
  group.name = 'copper-vault';
  const vault = new THREE.Group(); // vault coordinates
  vault.position.y = -VAULT.depth;
  group.add(vault);
  const shaft = new THREE.Group();
  group.add(shaft);
  const R = mulberry(9);
  const { shaftR, wallR, height: VH, floorH } = VAULT;
  const shaftH = floorH * 10 + 0.5; // shaft bottom == vault ceiling
  const _one = V(1, 1, 1);

  // =============================================================================================
  // SHAFT
  {
    const wall = new THREE.Mesh(paint(G.cyl(shaftR, shaftR, shaftH, 64, true), 0x23272d, { m: xf([0, -shaftH / 2, 0]) }), poster({ side: THREE.BackSide }));
    shaft.add(wall);
    const b = new Batch();
    for (let k = 1; k <= 10; k++) {
      const y = -floorH * k;
      // landing ledge: steel lip with a hazard edge
      b.add(paint(G.ring(shaftR - 0.15, shaftR, 64).rotateX(-Math.PI / 2), 0x3a4048, { gloss: 0.3, m: xf([0, y, 0]) }));
      b.add(paint(G.cyl(shaftR - 0.15, shaftR - 0.15, 0.1, 64, true), 0x30353c, { m: xf([0, y - 0.05, 0]) }));
      b.add(paint(G.torus(shaftR - 0.15, 0.022, 4, 64), k % 2 ? PAL.gold : 0x14171b, { m: xf([0, y + 0.005, 0], [Math.PI / 2, 0, 0]) }));
    }
    // guide rails (I-beams where the deck's guide shoes run)
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + Math.PI / 4;
      b.add(paint(G.box(0.12, shaftH, 0.06), 0x50565e, { gloss: 0.6, m: xf([Math.cos(a) * (shaftR - 0.06), -shaftH / 2, Math.sin(a) * (shaftR - 0.06)], [0, -a, 0]) }));
      b.add(paint(G.box(0.03, shaftH, 0.14), 0x3c4148, { gloss: 0.4, m: xf([Math.cos(a) * (shaftR - 0.11), -shaftH / 2, Math.sin(a) * (shaftR - 0.11)], [0, -a, 0]) }));
    }
    // pipes down the wall
    for (const a of [-2.2, -0.9, 1.3, 2.6]) {
      b.add(paint(G.cyl(0.05, 0.05, shaftH, 8, true), a > 0 ? PAL.copper : 0x2d3138, { gloss: 0.7, m: xf([Math.cos(a) * (shaftR - 0.09), -shaftH / 2, Math.sin(a) * (shaftR - 0.09)]) }));
      for (let k = 1; k <= 10; k++) b.add(paint(G.box(0.14, 0.04, 0.14), 0x1a1d22, { m: xf([Math.cos(a) * (shaftR - 0.09), -floorH * k + 0.5, Math.sin(a) * (shaftR - 0.09)], [0, -a, 0]) }));
    }
    shaft.add(b.build(poster({ side: THREE.DoubleSide })));
    // floor plates: "B1 / SUB-LEVEL 1" .. "B10 / VAULT LEVEL", one atlas, six plates per floor
    const atlas = canvasTex(512, 1280, (g) => {
      for (let k = 0; k < 10; k++) {
        const y0 = k * 128;
        g.fillStyle = '#d9a93a'; g.fillRect(0, y0, 512, 128);
        g.fillStyle = '#14181f';
        for (let s = -64; s < 512; s += 48) { g.beginPath(); g.moveTo(s, y0 + 128); g.lineTo(s + 24, y0 + 128); g.lineTo(s + 48, y0 + 106); g.lineTo(s + 24, y0 + 106); g.fill(); }
        g.fillRect(10, y0 + 10, 492, 88);
        g.fillStyle = '#efe2c4'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `400 78px ${FONT.caps}`;
        g.fillText(`B${k + 1}`, 112, y0 + 58);
        g.fillStyle = '#d9a93a'; g.fillRect(200, y0 + 22, 4, 64);
        g.fillStyle = '#efe2c4'; g.font = `400 42px ${FONT.caps}`;
        g.fillText(k === 9 ? 'VAULT LEVEL' : `SUB-LEVEL ${k + 1}`, 352, y0 + 58);
      }
    });
    const pp = [], pu = [], pi = [];
    for (let k = 0; k < 10; k++) {
      for (const a of [-Math.PI / 2 - 0.36, -Math.PI / 2 + 0.36, Math.PI / 2 - 0.36, Math.PI / 2 + 0.36, Math.PI + 0.5, -0.5]) {
        const y = -floorH * (k + 1) + 0.56;
        const r = shaftR - 0.02;
        const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
        const tx = -Math.sin(a), tz = Math.cos(a); // tangent = the viewer's right when facing the wall
        const w = 0.9, h = 0.225;
        const base = pp.length / 3;
        for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
          const s = (u - 0.5) * w;
          pp.push(cx + tx * s, y + (v - 0.5) * h, cz + tz * s);
          pu.push(u, 1 - (k + 1 - v) / 10);
        }
        pi.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(pu, 2));
    pg.setIndex(pi);
    pg.computeBoundingSphere();
    shaft.add(new THREE.Mesh(pg, texMat(atlas, 0.8)));
  }
  // shaft lamps (group 7, B9 group 8)
  const sfx = new Sprites(200);
  for (let k = 1; k <= 10; k++) {
    for (let q = 0; q < 6; q++) {
      const a = q / 6 * TAU + (k % 2) * 0.52 + 0.26;
      const p = [Math.cos(a) * (shaftR - 0.07), -floorH * k + 0.3, Math.sin(a) * (shaftR - 0.07)];
      const gr = k === 9 ? 8 : 7;
      sfx.add({ p, col: k === 10 ? 0xff5030 : 0xffd9a0, i: 1.7, size: 0.11, group: gr });
      sfx.add({ p, col: 0xffb070, i: 0.32, size: 0.75, group: gr, kind: 4 });
    }
  }
  sfx.commit();
  shaft.add(sfx.mesh);
  // the counterweight runs up past the platform as it goes down
  const cw = new THREE.Group();
  const cwA = Math.PI;
  const cwR = shaftR - 0.085;
  {
    const b = new Batch();
    b.add(paint(G.box(0.9, 1.6, 0.12), 0x2a2d33, { gloss: 0.3 }));
    for (let s = -3; s <= 3; s++) b.add(paint(G.box(0.86, 0.1, 0.01), s % 2 ? PAL.gold : 0x111317, { m: xf([0, s * 0.21, 0.065]) }));
    b.add(paint(G.box(0.2, 0.12, 0.13), PAL.brass, { gloss: 0.8, m: xf([0, 0.84, 0]) }));
    cw.add(b.build(poster()));
    cw.position.set(Math.cos(cwA) * cwR, 0, Math.sin(cwA) * cwR);
    cw.rotation.y = -cwA - Math.PI / 2;
  }
  shaft.add(cw);
  const cable = new THREE.Mesh(paint(G.cyl(0.014, 0.014, 1, 6, true), 0x6a7078, { gloss: 0.8, m: xf([0, 0.5, 0]) }), poster());
  cable.position.set(Math.cos(cwA) * cwR, 0, Math.sin(cwA) * cwR);
  shaft.add(cable);

  // =============================================================================================
  // VAULT SHELL: floor, coffered ceiling, lamp housings, the rail the arms hang from
  {
    const b = new Batch();
    b.add(paint(G.ring(4.12, wallR + 0.3, 96).rotateX(-Math.PI / 2), 0x15181d, { gloss: 0.5, m: xf([0, -0.003, 0]) }));
    for (const r of [4.6, 5.3, 6.5]) b.add(paint(G.ring(r, r + 0.035, 96).rotateX(-Math.PI / 2), PAL.copperDk, { gloss: 0.8, m: xf([0, 0.001, 0]) }));
    for (let k = 0; k < 32; k++) {
      const a = k / 32 * TAU;
      b.add(paint(G.box(wallR - 4.6, 0.004, 0.025), 0x2a2f37, { m: xf([Math.cos(a) * (wallR + 4.6) / 2, 0.002, Math.sin(a) * (wallR + 4.6) / 2], [0, -a, 0]) }));
    }
    b.add(paint(G.torus(4.19, 0.045, 6, 96), PAL.brass, { gloss: 0.9, m: xf([0, 0.0, 0], [Math.PI / 2, 0, 0]) }));
    // ceiling
    b.add(paint(G.ring(shaftR, wallR + 0.3, 96).rotateX(Math.PI / 2), 0x1b1f26, { m: xf([0, VH, 0]) }));
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * TAU;
      b.add(paint(G.box(wallR - shaftR, 0.24, 0.1), 0x2a2f37, { m: xf([Math.cos(a) * (wallR + shaftR) / 2, VH - 0.12, Math.sin(a) * (wallR + shaftR) / 2], [0, -a, 0]) }));
      const la = a + TAU / 48;
      b.add(paint(G.cyl(0.12, 0.17, 0.14, 12), 0x30353d, { gloss: 0.5, m: xf([Math.cos(la) * 6.25, VH - 0.07, Math.sin(la) * 6.25]) }));
    }
    for (const r of [shaftR + 0.04, wallR + 0.05]) b.add(paint(G.torus(r, 0.06, 6, 96), PAL.brass, { gloss: 0.8, m: xf([0, VH - 0.02, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(5.6, 0.07, 6, 120), 0x40464e, { gloss: 0.7, m: xf([0, VH - 0.3, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(5.6, 0.03, 4, 120), PAL.copper, { gloss: 0.9, m: xf([0, VH - 0.37, 0], [Math.PI / 2, 0, 0]) }));
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * TAU + 0.1;
      b.add(paint(G.box(0.05, 0.3, 0.05), 0x40464e, { m: xf([Math.cos(a) * 5.6, VH - 0.15, Math.sin(a) * 5.6]) }));
    }
    vault.add(b.build(poster({ side: THREE.DoubleSide })));
  }
  // floor cables: gold pulses run from the drum to the dock (groups 1..3)
  const cables = [];
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU + 0.13;
    const pts = [];
    for (let q = 0; q <= 8; q++) { const r = wallR - 0.12 - (wallR - 4.3) * q / 8; const aa = a + Math.sin(q * 0.8 + k) * 0.035; pts.push([Math.cos(aa) * r, 0.026, Math.sin(aa) * r]); }
    cables.push(pts);
  }
  const cableMat = ribbonMat(0xe0a527, 0xfff2c0);
  const cableMesh = new THREE.Mesh(ribbonGeo([1, 2, 3].flatMap((gr) => cables.map((pts) => ({
    pts: pts.map((p) => [p[0], p[1] + gr * 0.0015, p[2]]), w: 0.05, t0: [0, K.lights, K.gold2, K.gold3][gr], speed: 5, group: gr,
  })))), cableMat);
  cableMesh.renderOrder = 4;
  cableMesh.frustumCulled = false;
  vault.add(cableMesh);
  {
    const b = new Batch();
    for (const pts of cables) {
      for (let q = 0; q < pts.length - 1; q++) {
        const a = V(pts[q][0], 0.012, pts[q][2]), c = V(pts[q + 1][0], 0.012, pts[q + 1][2]);
        const mid = a.clone().add(c).multiplyScalar(0.5);
        const len = a.distanceTo(c);
        const m = new THREE.Matrix4().lookAt(a, c, V(0, 1, 0));
        m.setPosition(mid);
        b.add(paint(G.box(0.07, 0.024, len + 0.02), 0x1a1210, { gloss: 0.4, m }));
      }
    }
    vault.add(b.build(poster()));
  }

  // =============================================================================================
  // DRUM of deposit boxes (rotates). The door sits in it at local angle -pi/2 (front at drum 0).
  const drum = new THREE.Group();
  vault.add(drum);
  const doorA = -Math.PI / 2;
  const COLS = 64, ROWS = 9, rowH = 0.66, colA = TAU / COLS;
  const DOOR_COLS = 3; // columns cleared each side of the door
  const PLATE_H = 6 * rowH + 0.1;
  const boxR = wallR - 0.06;
  // backing wall: a gap behind the door frame below PLATE_H, closed above
  {
    const gap = DOOR_COLS * colA;
    const th0 = Math.PI / 2 - doorA; // three's cylinder theta for our angle a is pi/2 - a
    const b = new Batch();
    b.add(paint(new THREE.CylinderGeometry(wallR + 0.08, wallR + 0.08, PLATE_H + 0.1, 96, 1, true, th0 + gap, TAU - 2 * gap), 0x0d0f13, { m: xf([0, (PLATE_H + 0.1) / 2, 0]) }));
    b.add(paint(new THREE.CylinderGeometry(wallR + 0.08, wallR + 0.08, VH + 0.1 - PLATE_H, 96, 1, true), 0x0d0f13, { m: xf([0, PLATE_H + (VH + 0.1 - PLATE_H) / 2, 0]) }));
    b.add(paint(G.torus(wallR - 0.02, 0.06, 6, 128), PAL.brass, { gloss: 0.9, m: xf([0, 0.08, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(wallR - 0.02, 0.05, 6, 128), PAL.brass, { gloss: 0.9, m: xf([0, 0.42 + ROWS * rowH - 0.2, 0], [Math.PI / 2, 0, 0]) }));
    drum.add(b.build(poster({ side: THREE.DoubleSide })));
  }
  // box fronts (instanced)
  const boxList = [];
  const boxIndex = new Map();
  let boxes;
  {
    const bb = new Batch();
    bb.add(paint(G.box(0.6, 0.6, 0.05), 0xffffff, { gloss: 0.45, m: xf([0, 0, 0.025]) }));
    bb.add(paint(G.box(0.5, 0.5, 0.012), 0xd0d0d0, { gloss: 0.6, m: xf([0, 0, 0.056]) }));
    bb.add(paint(G.box(0.16, 0.045, 0.008), 0xe8c060, { gloss: 0.9, glow: 0.15, m: xf([0, 0.17, 0.064]) }));
    for (const x of [-0.08, 0.08]) bb.add(paint(G.cyl(0.024, 0.024, 0.016, 6), 0xc9973e, { gloss: 0.9, m: xf([x, -0.02, 0.07], [Math.PI / 2, 0, 0]) }));
    bb.add(paint(G.box(0.14, 0.02, 0.022), 0xb8bcc0, { gloss: 0.9, m: xf([0, -0.17, 0.075]) }));
    const geo = bb.build().geometry;
    for (let c = 0; c < COLS; c++) {
      const a = doorA + (c + 0.5) * colA - Math.PI;
      const da = Math.atan2(Math.sin(a - doorA), Math.cos(a - doorA));
      for (let r = 0; r < ROWS; r++) {
        if (Math.abs(da) < DOOR_COLS * colA && r < 6) continue;
        boxIndex.set(`${c},${r}`, boxList.length);
        boxList.push({ a, r, pull: 0 });
      }
    }
    boxes = new THREE.InstancedMesh(geo, poster(), boxList.length);
    const colr = new THREE.Color();
    boxList.forEach((bx, k) => {
      const v = R();
      colr.set(v < 0.1 ? 0xb8925a : v < 0.55 ? 0x6a727a : 0x5a6169);
      boxes.setColorAt(k, colr);
    });
    boxes.instanceColor.needsUpdate = true;
    drum.add(boxes);
  }
  const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _bp = V();
  const setBox = (k) => {
    const bx = boxList[k];
    const rr = boxR - bx.pull;
    _bq.setFromAxisAngle(V(0, 1, 0), -bx.a - Math.PI / 2);
    _bm.compose(_bp.set(Math.cos(bx.a) * rr, 0.42 + bx.r * rowH, Math.sin(bx.a) * rr), _bq, _one);
    boxes.setMatrixAt(k, _bm);
  };
  for (let k = 0; k < boxList.length; k++) setBox(k);
  boxes.instanceMatrix.needsUpdate = true;
  // the two drawers the velvet gloves pull open: column 61 row 2 (left), column 2 row 3 (right)
  const drawers = [boxIndex.get('61,2'), boxIndex.get('2,3')];
  const handleAt = (c, r) => { // world position of a box handle with the drum at pi
    const a = -Math.PI / 2 + (c + 0.5) * colA;
    const rr = boxR - 0.08;
    return V(Math.cos(a) * rr, 0.42 + r * rowH - 0.17, Math.sin(a) * rr);
  };
  const handles = [handleAt(61, 2), handleAt(2, 3)];
  const bfx = new Sprites(8);
  for (const k of drawers) {
    const bx = boxList[k];
    bfx.add({ p: [Math.cos(bx.a) * (boxR - 0.5), 0.42 + bx.r * rowH, Math.sin(bx.a) * (boxR - 0.5)], col: 0xffb030, i: 1.1, size: 0.9, group: 1, kind: 4 });
  }
  bfx.commit();
  drum.add(bfx.mesh);

  // --- door assembly: child of the drum; local +z faces the centre ---
  const doorMount = new THREE.Group();
  const DOOR_R = 1.62, DOOR_Y = 1.98, HOLE_R = DOOR_R + 0.1;
  const mountR = wallR - 0.26;
  doorMount.position.set(Math.cos(doorA) * mountR, 0, Math.sin(doorA) * mountR);
  doorMount.rotation.y = -doorA - Math.PI / 2;
  drum.add(doorMount);
  const holePlate = (W, H, y0, depth, color, zOff) => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, y0); shape.lineTo(W / 2, y0); shape.lineTo(W / 2, y0 + H); shape.lineTo(-W / 2, y0 + H); shape.lineTo(-W / 2, y0);
    const hole = new THREE.Path(); hole.absarc(0, DOOR_Y, HOLE_R, 0, TAU, true); shape.holes.push(hole);
    return paint(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 48 }), color, { gloss: 0.5, m: xf([0, 0, zOff]) });
  };
  {
    const W = 2 * boxR * Math.sin(DOOR_COLS * colA) + 0.1;
    const b = new Batch();
    b.add(holePlate(W, PLATE_H, 0.1, 0.12, 0x343a42, -0.06));
    b.add(paint(G.torus(DOOR_R + 0.13, 0.11, 10, 64), 0x50565e, { gloss: 0.8, m: xf([0, DOOR_Y, 0.08]) }));
    b.add(paint(G.torus(DOOR_R + 0.3, 0.035, 6, 64), PAL.brass, { gloss: 0.9, m: xf([0, DOOR_Y, 0.08]) }));
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * TAU;
      b.add(paint(G.cyl(0.03, 0.03, 0.03, 8), PAL.brass, { gloss: 0.9, m: xf([Math.cos(a) * (DOOR_R + 0.42), DOOR_Y + Math.sin(a) * (DOOR_R + 0.42), 0.07], [Math.PI / 2, 0, 0]) }));
    }
    b.add(paint(G.cyl(HOLE_R, HOLE_R, 0.9, 48, true), 0x2a2e34, { m: xf([0, DOOR_Y, -0.45], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.box(W * 0.92, 0.05, 0.02), PAL.gold, { glow: 0.3, m: xf([0, 0.1 + PLATE_H - 0.12, 0.07]) }));
    b.add(paint(G.box(W * 0.92, 0.05, 0.02), PAL.gold, { glow: 0.3, m: xf([0, 0.2, 0.07]) }));
    doorMount.add(b.build(poster({ side: THREE.DoubleSide })));
  }
  // the door, hinged on its left as seen from the platform
  const hinge = new THREE.Group();
  hinge.position.set(-(DOOR_R + 0.12), DOOR_Y, 0.15);
  doorMount.add(hinge);
  const door = new THREE.Group();
  door.position.set(DOOR_R + 0.12, 0, 0);
  hinge.add(door);
  let wheel, dial, bolts, backGear;
  {
    const prof = [[0, -0.5], [1.5, -0.5], [1.58, -0.44], [1.58, -0.18], [1.6, -0.16], [1.6, 0.0], [1.5, 0.04], [1.3, 0.05], [1.26, 0.09], [0.5, 0.1], [0.46, 0.13], [0, 0.13]];
    const b = new Batch();
    b.add(paint(G.lathe(prof, 64), 0x8c9299, { gloss: 0.75, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(1.12, 0.022, 6, 64), PAL.brass, { gloss: 0.9, m: xf([0, 0, 0.1]) }));
    b.add(paint(G.torus(1.42, 0.018, 6, 64), 0x5a6068, { gloss: 0.8, m: xf([0, 0, 0.055]) }));
    for (const y of [-1.0, 0, 1.0]) b.add(paint(G.cyl(0.11, 0.11, 0.42, 16), 0x50565e, { gloss: 0.8, m: xf([-(DOOR_R + 0.12), y, -0.15]) }));
    for (const y of [-0.8, 0.8]) b.add(paint(G.box(0.45, 0.28, 0.16), 0x50565e, { gloss: 0.7, m: xf([-1.47, y, -0.08]) }));
    door.add(b.build(poster()));
    // spoked wheel round the dial hub
    const wb = new Batch();
    wb.add(paint(G.cyl(0.36, 0.36, 0.16, 32), 0xb0b6bc, { gloss: 0.9, m: xf([0, 0, 0.08], [Math.PI / 2, 0, 0]) }));
    for (let k = 0; k < 5; k++) {
      const rz = new THREE.Matrix4().makeRotationZ(k / 5 * TAU);
      wb.add(paint(G.cyl(0.035, 0.035, 0.56, 10), 0xb0b6bc, { gloss: 0.9, m: rz.clone().multiply(xf([0, 0.6, 0.14])) }));
      wb.add(paint(G.sphere(0.075, 12, 8), PAL.velvet, { gloss: 0.5, m: rz.clone().multiply(xf([0, 0.88, 0.14])) }));
    }
    wb.add(paint(G.torus(0.62, 0.025, 6, 40), 0x9aa0a6, { gloss: 0.9, m: xf([0, 0, 0.14]) }));
    wheel = wb.build(poster());
    wheel.position.set(0, 0, 0.12);
    door.add(wheel);
    const dialTex = canvasTex(512, 512, (g) => {
      g.fillStyle = '#16191e'; g.beginPath(); g.arc(256, 256, 256, 0, TAU); g.fill();
      g.strokeStyle = '#c9973e'; g.lineWidth = 12; g.beginPath(); g.arc(256, 256, 244, 0, TAU); g.stroke();
      g.fillStyle = '#efe2c4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `400 46px ${FONT.caps}`;
      for (let k = 0; k < 100; k++) {
        const len = k % 10 === 0 ? 36 : k % 5 === 0 ? 24 : 14;
        g.save(); g.translate(256, 256); g.rotate(k / 100 * TAU);
        g.fillRect(-2.5, -232, 5, len);
        if (k % 10 === 0) g.fillText(String(k), 0, -170);
        g.restore();
      }
      g.fillStyle = '#c9973e'; g.beginPath(); g.arc(256, 256, 80, 0, TAU); g.fill();
    });
    dial = new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), texMat(dialTex, 1));
    dial.position.set(0, 0, 0.292);
    door.add(dial);
    const knob = new THREE.Mesh(paint(G.cyl(0.08, 0.1, 0.11, 20), 0xb0b6bc, { gloss: 0.9, m: xf([0, 0, 0.055], [Math.PI / 2, 0, 0]) }), poster());
    knob.add(new THREE.Mesh(paint(G.box(0.02, 0.07, 0.02), PAL.velvet, { m: xf([0, 0.05, 0.11]) }), poster()));
    dial.add(knob);
    door.add(new THREE.Mesh(paint(G.cone(0.03, 0.06, 3), PAL.gold, { glow: 0.5, m: xf([0, 0.33, 0.3], [0, 0, Math.PI]) }), poster()));
    // twelve bolts sliding in radial guides on the door face
    const bg = new Batch();
    bg.add(paint(G.box(0.12, 0.5, 0.08), 0xc8ced4, { gloss: 0.95 }));
    bg.add(paint(G.box(0.13, 0.06, 0.09), PAL.brass, { gloss: 0.9, m: xf([0, 0.24, 0]) }));
    // on the back of the door the same bolt drives a rod to the centre gear, so the mechanism
    // reads when the door swings open towards the player (back face sits at z -0.5)
    bg.add(paint(G.box(0.05, 0.62, 0.035), 0x50565e, { gloss: 0.75, m: xf([0, -0.56, -0.745]) }));
    bg.add(paint(G.box(0.15, 0.13, 0.07), PAL.brass, { gloss: 0.9, m: xf([0, -0.24, -0.73]) }));
    bolts = new THREE.InstancedMesh(bg.build().geometry, poster(), 12);
    door.add(bolts);
    // centre gear on the back; turns with the wheel on the front
    const cg = new Batch();
    cg.add(paint(G.cyl(0.33, 0.33, 0.07, 40), PAL.brass, { gloss: 0.9, m: xf([0, 0, -0.55], [Math.PI / 2, 0, 0]) }));
    cg.add(paint(G.cyl(0.11, 0.11, 0.1, 20), 0xb0b6bc, { gloss: 0.95, m: xf([0, 0, -0.57], [Math.PI / 2, 0, 0]) }));
    for (let k = 0; k < 22; k++) {
      const rz = new THREE.Matrix4().makeRotationZ(k / 22 * TAU);
      cg.add(paint(G.box(0.05, 0.07, 0.07), PAL.brass, { gloss: 0.9, m: rz.multiply(xf([0, 0.35, -0.55])) }));
    }
    for (let k = 0; k < 6; k++) {
      const rz = new THREE.Matrix4().makeRotationZ(k / 6 * TAU);
      cg.add(paint(G.cyl(0.035, 0.035, 0.02, 10), 0x50565e, { m: rz.multiply(xf([0, 0.22, -0.59], [Math.PI / 2, 0, 0])) }));
    }
    cg.add(paint(G.torus(1.47, 0.025, 6, 64), PAL.brass, { gloss: 0.9, m: xf([0, 0, -0.51]) }));
    cg.add(paint(G.torus(0.86, 0.016, 6, 48), 0x5a6068, { gloss: 0.8, m: xf([0, 0, -0.51]) }));
    backGear = cg.build(poster());
    door.add(backGear);
    const gb = new Batch();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + Math.PI / 2;
      for (const s of [-1, 1]) {
        const ox = -Math.sin(a) * s * 0.085, oy = Math.cos(a) * s * 0.085;
        gb.add(paint(G.box(0.03, 0.62, 0.05), 0x50565e, { gloss: 0.6, m: new THREE.Matrix4().makeRotationZ(a - Math.PI / 2).setPosition(Math.cos(a) * 1.3 + ox, Math.sin(a) * 1.3 + oy, 0.14) }));
      }
    }
    door.add(gb.build(poster()));
  }
  // the seal: a thin ring of light round the door when it unseals
  const sealU = { uAmt: { value: 0 }, uExposure: SU.uExposure, uFade: SU.uFade };
  const seal = new THREE.Mesh(new THREE.TorusGeometry(DOOR_R + 0.04, 0.035, 6, 96), new THREE.ShaderMaterial({
    uniforms: sealU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uAmt, uExposure, uFade; void main(){ gl_FragColor = vec4(vec3(1.0,0.5,0.12)*0.75*uAmt*uExposure*uFade, 1.0);\n#include <colorspace_fragment>\n}',
  }));
  seal.position.set(0, DOOR_Y, 0.16);
  doorMount.add(seal);

  // number drum + three warning lamps + beacon above the door
  const counter = new THREE.Group();
  const CNT_Y = DOOR_Y + DOOR_R + 0.98;
  counter.position.set(0, CNT_Y, 0.3);
  doorMount.add(counter);
  let digits, beacon;
  const DR = 0.6;
  {
    const b = new Batch();
    b.add(paint(G.box(1.5, 1.3, 0.3), 0x262a30, { gloss: 0.4, m: xf([0, 0, -0.5]) }));
    for (const x of [-0.29, 0.29]) {
      b.add(paint(G.cyl(DR + 0.07, DR + 0.07, 0.05, 40), PAL.brass, { gloss: 0.9, m: xf([x, 0, 0], [0, 0, Math.PI / 2]) }));
      b.add(paint(G.box(0.05, 0.2, 0.55), 0x3a4048, { m: xf([x * 1.12, -0.6, -0.25]) }));
    }
    b.add(paint(G.cyl(0.04, 0.04, 0.8, 10), 0x9aa0a6, { gloss: 0.9, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
    b.add(paint(G.box(0.62, 0.05, 0.06), PAL.brass, { gloss: 0.9, m: xf([0, 0.23, DR + 0.02]) }));
    b.add(paint(G.box(0.62, 0.05, 0.06), PAL.brass, { gloss: 0.9, m: xf([0, -0.23, DR + 0.02]) }));
    for (const x of [-0.45, 0, 0.45]) b.add(paint(G.cyl(0.1, 0.11, 0.1, 16), 0x1a1c20, { m: xf([x, DR + 0.25, -0.1]) }));
    b.add(paint(G.cyl(0.2, 0.24, 0.14, 16), 0x2a2e34, { gloss: 0.4, m: xf([0, DR + 0.48, -0.32]) }));
    counter.add(b.build(poster()));
    digits = new THREE.Mesh(new THREE.CylinderGeometry(DR, DR, 0.5, 48, 1, true).rotateZ(Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { map: { value: digitDrum() }, uExposure: SU.uExposure, uFade: SU.uFade, uLight: { value: 1 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform sampler2D map; uniform float uExposure, uFade, uLight; varying vec2 vUv; varying vec3 vN; void main(){ vec3 c = texture2D(map, vec2(1.0 - vUv.y, vUv.x)).rgb; float f = 0.35 + 0.65 * smoothstep(0.0, 0.9, abs(vN.z)); gl_FragColor = vec4(c * f * uLight * uExposure * uFade, 1.0);\n#include <colorspace_fragment>\n}',
    }));
    counter.add(digits);
    beacon = new THREE.Mesh(paint(G.sphere(0.17, 20, 12), 0xff2a1a, { glow: 0.3, gloss: 0.9 }).scale(1, 1.15, 1), poster());
    beacon.position.set(0, DR + 0.68, -0.32);
    counter.add(beacon);
  }
  const dfx = new Sprites(16);
  for (let k = 0; k < 3; k++) {
    const p = [-0.45 + k * 0.45, DR + 0.31, -0.1];
    dfx.add({ p, col: k === 2 ? 0xff2a14 : 0xffa020, i: 2.4, size: 0.22, group: 4 + k });
    dfx.add({ p, col: k === 2 ? 0xff2a14 : 0xffa020, i: 0.55, size: 0.9, group: 4 + k, kind: 4 });
  }
  dfx.add({ p: [0, DR + 0.7, -0.32], col: 0xff2010, i: 1.4, size: 1.6, group: 7, kind: 4 });
  dfx.add({ p: [0, DR + 0.7, -0.32], col: 0xff6040, i: 2.5, size: 0.3, group: 7 });
  dfx.commit();
  counter.add(dfx.mesh);

  // treasure room behind the door + the spool
  const treasure = new THREE.Group();
  treasure.position.set(0, 0, -0.9);
  doorMount.add(treasure);
  let spool;
  {
    const b = new Batch();
    b.add(holePlate(4.0, 3.9, 0.0, 0.06, 0x2a2014, -0.06));
    b.add(paint(G.box(3.8, 0.1, 2.9), 0x2e2214, { m: xf([0, 0.2, -1.45]) }));
    b.add(paint(G.box(3.8, 0.1, 2.9), 0x2e2214, { m: xf([0, 3.85, -1.45]) }));
    for (const s of [-1, 1]) {
      b.add(paint(G.box(0.1, 3.7, 2.9), 0x7a5a1c, { glow: 0.12, m: xf([s * 1.9, 2.0, -1.45]) }));
      for (const y of [0.9, 1.6, 2.3, 3.0]) {
        b.add(paint(G.box(0.4, 0.04, 2.6), 0x3a2a14, { m: xf([s * 1.66, y, -1.45]) }));
        for (let k = 0; k < 9; k++) for (let h = 0; h < 2; h++) {
          b.add(paint(G.box(0.22, 0.09, 0.11), h ? PAL.goldLt : PAL.gold, { gloss: 1, glow: 0.35, m: xf([s * (1.66 + (h ? 0.02 : -0.06)), y + 0.065 + h * 0.09, -0.35 - k * 0.25]) }));
        }
      }
    }
    b.add(paint(G.box(3.8, 3.7, 0.1), 0x5e4416, { glow: 0.15, m: xf([0, 2.0, -2.9]) }));
    for (let k = 0; k < 7; k++) b.add(paint(G.box(0.04, 3.5, 0.04), PAL.goldLt, { glow: 0.7, m: xf([-1.5 + k * 0.5, 2.0, -2.84]) }));
    b.add(paint(G.cyl(0.42, 0.55, 1.1, 24), 0x1a1c20, { gloss: 0.5, m: xf([0, 0.8, -1.5]) }));
    b.add(paint(G.torus(0.44, 0.03, 6, 32), PAL.gold, { gloss: 0.9, m: xf([0, 1.34, -1.5], [Math.PI / 2, 0, 0]) }));
    for (const x of [-0.42, 0.42]) b.add(paint(G.box(0.06, 0.75, 0.12), PAL.brass, { gloss: 0.9, m: xf([x, 1.7, -1.5]) }));
    treasure.add(b.build(poster({ side: THREE.DoubleSide })));
    const sb = new Batch();
    for (const x of [-0.3, 0.3]) sb.add(paint(G.cyl(0.55, 0.55, 0.04, 40), PAL.gold, { gloss: 1, glow: 0.25, m: xf([x, 0, 0], [0, 0, Math.PI / 2]) }));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; for (const x of [-0.325, 0.325]) sb.add(paint(G.cyl(0.07, 0.07, 0.02, 12), 0x3a2a14, { m: new THREE.Matrix4().makeRotationX(a).multiply(xf([x, 0.33, 0], [0, 0, Math.PI / 2])) })); }
    sb.add(paint(G.cyl(0.36, 0.36, 0.56, 40), 0xffc84a, { gloss: 1, glow: 0.6, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
    for (let k = 0; k < 9; k++) sb.add(paint(G.torus(0.362, 0.01, 4, 40), PAL.goldLt, { glow: 0.8, m: xf([-0.25 + k * 0.0625, 0, 0], [0, Math.PI / 2, 0]) }));
    sb.add(paint(G.cyl(0.06, 0.06, 0.9, 12), PAL.brass, { gloss: 0.9, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
    spool = sb.build(poster());
    spool.position.set(0, 2.05, -1.5);
    treasure.add(spool);
  }
  const tfx = new Sprites(8);
  tfx.add({ p: [0, 2.2, -1.0], col: 0xffb030, i: 0.9, size: 5.0, group: 1, kind: 4 });
  tfx.add({ p: [0, 2.05, -1.5], col: 0xffd070, i: 1.3, size: 1.7, group: 1, kind: 4 });
  tfx.commit();
  treasure.add(tfx.mesh);

  // world positions of door parts with the drum at 0 (door in front)
  const DOOR_W = V(0, DOOR_Y, -mountR + 0.15);
  const SPOOL_W = V(0, 2.05, -mountR - 0.9 - 1.5);
  const COUNTER_W = V(0, CNT_Y, -mountR + 0.3 + DR);
  const beaconAt = (th, out) => { const r = mountR - 0.02; return out.set(-Math.sin(th) * r, CNT_Y + DR + 0.68, -Math.cos(th) * r); };

  // =============================================================================================
  // ROBOT ARMS
  const arms = [];
  const L1 = 2.45, L2 = 2.2, HAND = 1.3, L3 = 0.66 * HAND;
  const cream = 0xe6dabd, enamelDk = 0x22252b;
  const mkArm = (side) => {
    const base = new THREE.Group();
    const a = -Math.PI / 2 + side * 0.62;
    const home = V(Math.cos(a) * 5.6, VH - 0.42, Math.sin(a) * 5.6);
    base.position.copy(home);
    vault.add(base);
    const yaw = new THREE.Group(); base.add(yaw);
    const sh = new THREE.Group(); sh.position.y = -0.45; yaw.add(sh);
    const el = new THREE.Group(); el.position.y = -L1; sh.add(el);
    const wr = new THREE.Group(); wr.position.y = -L2; wr.scale.setScalar(HAND); el.add(wr);
    const fingers = [new THREE.Group(), new THREE.Group()];
    {
      const b = new Batch();
      b.add(paint(G.box(0.62, 0.22, 0.44), enamelDk, { gloss: 0.5, m: xf([0, 0.12, 0]) }));
      for (const x of [-0.22, 0.22]) b.add(paint(G.cyl(0.08, 0.08, 0.48, 12), 0x50565e, { gloss: 0.8, m: xf([x, 0.2, 0], [Math.PI / 2, 0, 0]) }));
      b.add(paint(G.box(0.08, 0.06, 0.5), PAL.gold, { glow: 0.2, m: xf([0, 0.02, 0]) }));
      base.add(b.build(poster()));
      const yb = new Batch();
      yb.add(paint(G.cyl(0.24, 0.28, 0.3, 24), cream, { gloss: 0.6, m: xf([0, -0.15, 0]) }));
      yb.add(paint(G.torus(0.27, 0.025, 6, 32), PAL.copper, { gloss: 0.9, m: xf([0, -0.02, 0], [Math.PI / 2, 0, 0]) }));
      yb.add(paint(G.box(0.42, 0.3, 0.3), cream, { gloss: 0.6, m: xf([0, -0.4, 0]) }));
      yaw.add(yb.build(poster()));
      const ub = new Batch();
      ub.add(paint(G.cyl(0.17, 0.17, 0.52, 20), PAL.copper, { gloss: 0.9, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
      ub.add(paint(slab(0.26, L1 - 0.2, 0.2, 0.08), cream, { gloss: 0.55, m: xf([0, -L1 / 2, 0], [0, Math.PI / 2, 0]) }));
      for (const x of [-0.135, 0.135]) ub.add(paint(G.box(0.02, L1 - 0.5, 0.21), PAL.copper, { gloss: 0.8, m: xf([x, -L1 / 2, 0]) }));
      ub.add(paint(G.cyl(0.05, 0.05, L1 * 0.55, 10), enamelDk, { gloss: 0.6, m: xf([0, -L1 * 0.32, -0.17]) }));
      ub.add(paint(G.cyl(0.028, 0.028, L1 * 0.45, 8), 0xd0d6dc, { gloss: 1, m: xf([0, -L1 * 0.7, -0.17]) }));
      sh.add(ub.build(poster()));
      const fb = new Batch();
      fb.add(paint(G.cyl(0.14, 0.14, 0.4, 20), PAL.copper, { gloss: 0.9, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
      fb.add(paint(slab(0.2, L2 - 0.18, 0.17, 0.07), cream, { gloss: 0.55, m: xf([0, -L2 / 2, 0], [0, Math.PI / 2, 0]) }));
      for (let k = 0; k < 3; k++) fb.add(paint(G.box(0.215, 0.03, 0.185), enamelDk, { m: xf([0, -L2 * (0.3 + k * 0.2), 0]) }));
      el.add(fb.build(poster()));
      // the hand ("head"): fingers point along -y, the eye sits between them, the brow on +z
      const hb = new Batch();
      hb.add(paint(G.sphere(0.13, 16, 12), PAL.copper, { gloss: 0.9 }));
      hb.add(paint(G.cyl(0.11, 0.12, 0.14, 16), enamelDk, { gloss: 0.6, m: xf([0, -0.12, 0]) }));
      hb.add(paint(slab(0.34, 0.24, 0.24, 0.06), cream, { gloss: 0.6, m: xf([0, -0.3, 0]) }));
      hb.add(paint(G.box(0.36, 0.045, 0.05), PAL.copper, { gloss: 0.9, m: xf([0, -0.26, 0.12]) }));
      hb.add(paint(G.cyl(0.075, 0.085, 0.07, 18), enamelDk, { gloss: 0.6, m: xf([0, -0.445, 0]) }));
      hb.add(paint(G.cyl(0.058, 0.058, 0.01, 18), 0x0a0a0c, { gloss: 1, m: xf([0, -0.482, 0]) }));
      wr.add(hb.build(poster()));
      fingers.forEach((f, i) => {
        const s = i ? 1 : -1;
        f.position.set(s * 0.13, -0.4, 0);
        const b2 = new Batch();
        b2.add(paint(G.box(0.05, 0.28, 0.13), cream, { gloss: 0.6, m: xf([0, -0.14, 0]) }));
        b2.add(paint(G.box(0.035, 0.22, 0.12), PAL.velvet, { gloss: 0.1, m: xf([-s * 0.04, -0.16, 0]) }));
        b2.add(paint(G.cyl(0.03, 0.03, 0.14, 10), PAL.copper, { gloss: 0.9, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
        f.add(b2.build(poster()));
        wr.add(f);
      });
    }
    const eye = new Sprites(4);
    eye.add({ p: [0, -0.5, 0], col: 0xff2010, i: 2.6, size: 0.09, group: 1 });
    eye.add({ p: [0, -0.5, 0], col: 0xff3020, i: 0.5, size: 0.4, group: 1, kind: 4 });
    eye.commit();
    wr.add(eye.mesh);
    const arm = { side, home, base, yaw, sh, el, wr, fingers, eye, inward: V(-home.x, 0, -home.z).normalize() };
    arms.push(arm);
    return arm;
  };
  mkArm(-1); mkArm(1);

  // =============================================================================================
  // LASERS: ten chords round the platform (instanced core + glow)
  const NL = 10;
  const laserGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, 0.5, 0);
  const lAmt = new THREE.InstancedBufferAttribute(new Float32Array(NL * 2), 1);
  laserGeo.setAttribute('aAmt', lAmt);
  const lasers = new THREE.InstancedMesh(laserGeo, new THREE.ShaderMaterial({
    uniforms: { uExposure: SU.uExposure, uFade: SU.uFade },
    vertexShader: `attribute float aAmt; varying float vA; varying vec3 vN; varying vec3 vW;
      void main(){ vA = aAmt; vec4 wp = modelMatrix * instanceMatrix * vec4(position,1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform float uExposure, uFade; varying float vA; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float f = abs(dot(normalize(vN), v)); float core = pow(f, 2.5);
        vec3 c = vec3(1.0, 0.07, 0.03) * core * vA * 1.7 + vec3(1.0, 0.55, 0.45) * pow(f, 16.0) * vA;
        gl_FragColor = vec4(c * uExposure * uFade, 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), NL * 2);
  lasers.frustumCulled = false;
  vault.add(lasers);
  const laserDef = [];
  for (let k = 0; k < NL; k++) {
    laserDef.push({ a: -Math.PI / 2 + (k + 0.5) / NL * TAU + (R() - 0.5) * 0.25, span: 0.72 + R() * 0.1, y0: 0.5 + R() * 2.6, y1: 0.5 + R() * 2.6, on: K.lasers + k * LASER_DT, ph: R() * TAU });
  }
  const lfx = new Sprites(NL * 4);
  for (let k = 0; k < NL * 2; k++) lfx.add({ p: [0, -50, 0], col: 0xff2a14, i: 2.4, size: 0.12 });
  for (let k = 0; k < NL * 2; k++) lfx.add({ p: [0, -50, 0], col: 0xff2010, i: 0.5, size: 0.5, kind: 4 });
  lfx.commit();
  vault.add(lfx.mesh);

  // =============================================================================================
  // GOLD WIRE: spool -> the player's deck (vault coordinates; drawn only with the drum at 0)
  const deckP = world.deck.snapCenter.clone();
  const wireU = { uExposure: SU.uExposure, uFade: SU.uFade, uProg: { value: 0 }, uTail: { value: 0 }, uTime: SU.uTime, uPulse: { value: 0 } };
  const wire = (() => {
    const sp = SPOOL_W.clone().add(V(0, 0.37, 0));
    const curve = new THREE.CubicBezierCurve3(sp, V(0, 3.3, -7.0), V(deckP.x, 2.9, -2.6), deckP.clone().add(V(0, 0.02, 0)));
    const tg = new THREE.TubeGeometry(curve, 200, 0.016, 6, false);
    const m = new THREE.Mesh(tg, new THREE.ShaderMaterial({
      uniforms: wireU,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uExposure, uFade, uProg, uTail, uTime, uPulse; varying vec2 vUv;
        void main(){ if (vUv.x > uProg || vUv.x < uTail) discard; float head = exp(-(uProg - vUv.x) * 30.0);
          float run = smoothstep(0.6, 1.0, sin(vUv.x * 70.0 - uTime * 16.0));
          vec3 c = vec3(0.95, 0.56, 0.12) * (0.7 + 1.1 * run * uPulse) + vec3(1.0, 0.85, 0.5) * head * 1.6;
          gl_FragColor = vec4(c * uExposure * uFade, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    m.frustumCulled = false;
    return m;
  })();
  vault.add(wire);

  // vault sprites, song time: ceiling lamps (each its own on/off window), standby lamps, dust,
  // rail sparks, spool fountain (group 3), the deck spark burst
  const vfx = new Sprites(2200);
  const lampOn = (k) => K.lights + (k / 24) * 0.35;
  const lampOff = (k) => K.out0 + (k / 24) * 1.3;
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * TAU + TAU / 48;
    const p = [Math.cos(a) * 6.25, VH - 0.17, Math.sin(a) * 6.25];
    vfx.add({ p, col: 0xfff0d0, i: 1.8, size: 0.26, t0: lampOn(k), t1: lampOff(k) });
    vfx.add({ p: [p[0], p[1] - 0.12, p[2]], col: 0xffd8a0, i: 0.3, size: 1.8, kind: 4, t0: lampOn(k), t1: lampOff(k) });
  }
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU;
    vfx.add({ p: [Math.cos(a) * 7.0, 0.25, Math.sin(a) * 7.0], col: 0xff3a18, i: 1.6, size: 0.12, t0: 44.0, t1: K.lights + 0.4 });
    vfx.add({ p: [Math.cos(a) * 7.0, 0.25, Math.sin(a) * 7.0], col: 0xff3018, i: 0.35, size: 0.9, kind: 4, t0: 44.0, t1: K.lights + 0.4 });
  }
  const rnd = mulberry(31);
  for (let k = 0; k < 280; k++) { // dust shaken loose when the drum stops
    const a = rnd() * TAU, r = 4.5 + rnd() * 2.6;
    const t0 = K.spin1 + rnd() * 1.4;
    vfx.add({ p: [Math.cos(a) * r, VH - 0.2 - rnd() * 0.3, Math.sin(a) * r], v: [(rnd() - 0.5) * 0.15, -0.1 - rnd() * 0.2, (rnd() - 0.5) * 0.15], col: 0xffe2b0, i: 0.55, size: 0.03 + rnd() * 0.02, t0, t1: t0 + 4.5, grav: 0.4, kind: 1 });
  }
  for (let s = 0; s < 4; s++) { // the rail arcs on "fire in the sky"
    const a = -Math.PI / 2 + (s - 1.5) * 0.9, t0 = K.sparks + s * BEAT * 0.5;
    vfx.burst({ p: [Math.cos(a) * 5.6, VH - 0.35, Math.sin(a) * 5.6], t0, n: 45, speed: 2.4, life: 1.6, cols: [0xffd080, 0xffffff, 0xff9a40], size: 0.06, grav: 6, drag: 0.6, rnd, i: 2.6 });
  }
  for (let burst = 0; burst < 6; burst++) { // the spool fountain on "fire in the sky" (drum at 0)
    const t0 = K.fire + burst * BEAT;
    for (let k = 0; k < 40; k++) {
      const a = rnd() * TAU;
      vfx.add({ p: [SPOOL_W.x, SPOOL_W.y + 0.4, SPOOL_W.z], v: [Math.cos(a) * (0.5 + rnd()), 3 + rnd() * 3, Math.sin(a) * (0.5 + rnd()) + 1.0], col: rnd() < 0.5 ? 0xffc040 : 0xffe8a0, i: 2.3, size: 0.07, group: 3, kind: 1, t0: t0 + rnd() * 0.1, t1: t0 + 1.6 + rnd() * 0.6, grav: 5.5, drag: 0.3 });
    }
  }
  vfx.burst({ p: [deckP.x, deckP.y + 0.05, deckP.z], t0: K.wireIn, n: 40, speed: 1.6, life: 0.9, cols: [0xffd080, 0xffffff], size: 0.018, grav: 4, drag: 1.2, group: 3, rnd, i: 2.4 });
  vfx.commit();
  vault.add(vfx.mesh);

  // =============================================================================================
  // ARM CHOREOGRAPHY. Keys: [time, wrist W, look target Lk, grip 0 closed .. 1 open, roll].
  // W / Lk may be functions of tv (door work). The bases drop out of the ceiling at "smile".
  const HEAD = V(0, 1.5, 0);
  function wheelAngle(tv) { return -smoother(K.bolts0 - 0.1, K.bolts1, tv) * TAU + smoother(K.two, K.one, tv) * TAU; }
  function drawerPull(tv) { return 0.3 * smoother(K.steel + 0.1, K.waltz - 0.1, tv) * (1 - smoother(K.red + 0.05, K.red + 0.3, tv)); }
  const wheelKnob = (tv, out) => {
    const a = 4 / 5 * TAU + wheelAngle(tv);
    return out.set(DOOR_W.x - 0.88 * Math.sin(a), DOOR_W.y + 0.88 * Math.cos(a), DOOR_W.z + 0.12 + 0.14);
  };
  const dialTip = DOOR_W.clone().add(V(0, 0, 0.12 + 0.172 + 0.12));
  const keysFor = (s) => {
    const sx = s ? 1 : -1;
    const P = (x, y, z) => V(sx * x, y, z);
    const home = arms[s].home;
    const fold = V(home.x * 0.9, VH - 1.95, home.z * 0.9);
    const foldL = fold.clone().add(V(0, -1, 0)).add(arms[s].inward.clone().multiplyScalar(0.6));
    const h = handles[s];
    const hd = V(h.x, 0, h.z).normalize(); // into the drawer
    const atHandle = h.clone().addScaledVector(hd, -(L3 + 0.02));
    const pulled = (tv) => atHandle.clone().addScaledVector(hd, -drawerPull(tv));
    const beaconL = (tv) => beaconAt(drumAngle(0, tv), V());
    const door = DOOR_W.clone();
    const counterBehind = V(COUNTER_W.x, COUNTER_W.y, -COUNTER_W.z);
    const workW = s === 0 ? () => dialTip.clone().add(V(0, 0, L3 + 0.02)) : (tv) => wheelKnob(tv, V()).add(V(0, 0, L3 + 0.02));
    const workL = s === 0 ? () => dialTip : (tv) => wheelKnob(tv, V());
    const left = s === 0;
    return [
      [0, fold, foldL, 0.2, 0],
      [K.armsDown, fold, foldL, 0.2, 0],
      [K.armsDown + 1.4, P(2.3, 3.2, -4.9), HEAD, 0.5, 0],
      [K.spy - 0.2, P(2.1, 3.0, -4.6), HEAD, 0.5, 0],
      [K.spy + 0.7, P(1.35, 2.4, -3.6), HEAD, 0.3, 0],
      [K.lasers - 0.2, P(1.35, 2.4, -3.6), HEAD, 0.3, 0],
      [K.lasers + 0.5, P(1.9, 3.0, -4.3), counterBehind, 0.5, 0],
      [K.why - 0.05, P(1.9, 3.0, -4.3), counterBehind, 0.5, 0],
      [K.why + 0.35, P(1.4, 2.45, -3.7), HEAD, 0.4, 0],
      [K.ask - 0.1, P(1.4, 2.45, -3.7), HEAD, 0.4, 0],
      [K.ask + 0.15, P(1.4, 2.45, -3.7), HEAD, 0.4, sx * 0.5],
      [K.whyW - 0.05, P(1.4, 2.45, -3.7), HEAD, 0.4, sx * 0.5],
      [K.whyW + 0.2, P(1.4, 2.45, -3.7), HEAD, 0.4, -sx * 0.5],
      [K.gold2 + 0.8, P(2.0, 2.8, -4.5), HEAD, 0.6, 0],
      [K.velvet - 0.1, P(2.0, 2.8, -4.5), HEAD, 0.6, 0],
      [K.velvet + 1.1, atHandle, h, 1.0, 0],
      [K.steel - 0.15, atHandle, h, 1.0, 0],
      [K.steel + 0.1, atHandle, h, 0.0, 0],
      [K.waltz - 0.05, pulled, h, 0.0, 0],
      [K.waltz + 0.45, P(1.5, 2.7, -4.6), P(-0.6, 2.4, -4.4), 0.6, 0],
      [K.red - 0.05, P(1.5, 2.7, -4.6), P(-0.6, 2.4, -4.4), 0.6, 0],
      [K.red + 0.4, P(2.4, 3.8, -4.6), beaconL, 1.0, 0],
      [K.spin1 + 0.4, P(2.2, 3.5, -4.7), beaconL, 0.9, 0],
      [K.spin1 + 2.2, left ? workW : P(2.0, 3.2, -5.0), left ? workL : door, left ? 0.9 : 0.6, 0],
      [K.tick1 - 0.1, left ? workW : P(2.0, 3.2, -5.0), left ? workL : door, left ? 0.05 : 0.6, 0],
      [K.breathe, left ? workW : P(1.6, 2.6, -5.4), workL, left ? 0.05 : 0.9, 0],
      [K.breathe + 0.9, left ? P(1.9, 3.0, -5.0) : workW, left ? door : workL, left ? 0.7 : 0.9, 0],
      [K.bolts0 - 0.1, left ? P(1.9, 3.0, -5.0) : workW, left ? door : workL, left ? 0.7 : 0.05, 0],
      [K.bolts1, left ? P(1.9, 3.0, -5.0) : workW, left ? door : workL, left ? 0.7 : 0.05, 0],
      [K.hold + 0.6, P(2.2, 3.0, -4.9), door, 0.8, 0],
      [K.open0, P(2.2, 3.0, -4.9), door, 0.8, 0],
      [K.open1, P(2.7, 3.4, -4.5), SPOOL_W, 1.0, 0],
      [K.fire, P(2.4, 3.7, -4.3), V(0, 5.5, -7.5), 1.0, 0],
      [K.smile - 0.2, P(1.5, 2.5, -3.8), HEAD, 0.6, 0],
      [K.smile + 0.6, P(1.5, 2.5, -3.8), HEAD, 0.6, sx * 0.35],
      [K.lie, P(1.5, 2.5, -3.8), HEAD, 0.6, sx * 0.35],
      [K.lie + 0.5, P(1.5, 2.5, -3.8), HEAD, 0.6, -sx * 0.35],
      [K.count0 - 0.1, P(1.9, 3.0, -4.4), COUNTER_W, 0.4, 0],
      [K.gold3 - 0.2, P(1.9, 3.0, -4.4), COUNTER_W, 0.4, 0],
      [K.gold3 + 0.6, P(2.1, 3.0, -4.2), deckP, 0.8, 0],
      [K.three, P(2.1, 3.0, -4.2), COUNTER_W, 0.8, 0],
      [K.two + 0.1, P(2.6, 3.6, -5.0), door, 0.8, 0],
      [K.one + 0.15, P(2.6, 3.6, -5.0), door, 0.8, 0],
      [K.one + 1.4, fold, foldL, 0.2, 0],
    ].map(([t, W, Lk, grip, roll]) => ({ t, W, Lk, grip, roll }));
  };
  const tracks = [keysFor(0), keysFor(1)];
  const _a = V(), _b = V(), _la = V(), _lb = V();
  const ev = (x, tv, out) => out.copy(typeof x === 'function' ? x(tv) : x);
  function armPose(s, tv) {
    const tr = tracks[s];
    let i = 0;
    while (i < tr.length - 1 && tr[i + 1].t <= tv) i++;
    const A = tr[i], B = tr[Math.min(tr.length - 1, i + 1)];
    const k = B.t > A.t ? sm(A.t, B.t, tv) : 1;
    const W = ev(A.W, tv, _a).lerp(ev(B.W, tv, _b), k).clone();
    const Lk = ev(A.Lk, tv, _la).lerp(ev(B.Lk, tv, _lb), k).clone();
    const grip = lerp(A.grip, B.grip, k);
    let roll = lerp(A.roll, B.roll, k);
    const sx = s ? 1 : -1;
    // the waltz: one loop per 3/4 bar, mirrored, the partners facing each other
    const w = sm(K.waltz + 0.2, K.waltz + 0.8, tv) * (1 - sm(K.red - 0.4, K.red - 0.05, tv));
    if (w > 0) {
      const ph = ((tv - K.waltz) / (BEAT * 3)) * TAU;
      W.x += sx * (Math.cos(ph) - 1) * 0.55 * w;
      W.z += Math.sin(ph) * 0.6 * w;
      W.y += (0.16 * Math.sin(ph * 3) - 0.14 * Math.cos(ph)) * w;
      roll += Math.sin(ph) * 0.35 * w;
    }
    // nod on the beat in the "oh-oh"s and while they smile and lie
    const bob = pulse(tv, K.ohoh, K.velvet - 0.4, 0.3, 0.3) + pulse(tv, K.smile, K.count0 - 0.3, 0.3, 0.3);
    if (bob > 0) W.y += Math.abs(Math.sin(((tv - K.ohoh) / BEAT) * Math.PI)) * 0.16 * bob;
    // flinch at the red light
    W.y += hit(tv, K.red, 4) * 0.35;
    return { W, Lk, grip, roll };
  }
  // drop out of the ceiling at "smile", fold back up after "one"
  const armDrop = (tv) => 4.8 * (1 - smoother(K.armsDown, K.armsDown + 1.5, tv)) + 4.8 * smoother(K.one + 0.4, K.one + 1.8, tv);

  const AX = V(1, 0, 0), AY = V(0, 1, 0), AZ = V(0, 0, 1);
  const _d = V(), _x = V(), _y = V(), _z = V(), _ref = V(), _mb = new THREE.Matrix4();
  const _qf = new THREE.Quaternion(), _qh = new THREE.Quaternion(), _qt = new THREE.Quaternion();
  function solveArm(arm, pose, drop) {
    arm.base.position.y = arm.home.y + drop;
    const sx0 = arm.home.x, sy0 = arm.home.y + drop - 0.45, sz0 = arm.home.z;
    const W = pose.W.clone(); W.y += drop;
    const Lk = pose.Lk.clone(); Lk.y += drop;
    const dx = W.x - sx0, dy = W.y - sy0, dz = W.z - sz0;
    const hz = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const D = THREE.MathUtils.clamp(Math.hypot(hz, dy), Math.abs(L1 - L2) + 0.02, (L1 + L2) * 0.999);
    const phT = Math.atan2(hz, -dy);
    const a1 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
    const a2 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
    const up = phT - a1;
    const fore = up + (Math.PI - a2);
    arm.yaw.rotation.y = yaw;
    arm.sh.rotation.x = -up;
    arm.el.rotation.x = -(fore - up);
    // hand frame: -y along the look direction, +z (brow) toward world up
    _d.copy(Lk).sub(W);
    if (_d.lengthSq() < 1e-6) _d.set(0, -1, 0);
    _d.normalize();
    _y.copy(_d).negate();
    const wv = sm(0.75, 0.97, Math.abs(_y.y));
    _ref.set(0, 1, 0).multiplyScalar(1 - wv).addScaledVector(arm.inward, wv);
    _z.copy(_ref).addScaledVector(_y, -_ref.dot(_y)).normalize();
    _x.crossVectors(_y, _z);
    _mb.makeBasis(_x, _y, _z);
    _qh.setFromRotationMatrix(_mb).multiply(_qt.setFromAxisAngle(AY, pose.roll));
    _qf.setFromAxisAngle(AY, yaw).multiply(_qt.setFromAxisAngle(AX, -fore));
    arm.wr.quaternion.copy(_qf.invert()).multiply(_qh);
    const g = 0.08 + pose.grip * 0.42;
    arm.fingers[0].rotation.z = -g; arm.fingers[1].rotation.z = g;
  }

  // =============================================================================================
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = V(), _bw = V();
  const UP = V(0, 1, 0);
  let spinOwned = false;

  function lampLevel(t) {
    const on = clamp01((t - K.lights) / 0.35) - clamp01((t - K.out0) / 1.3);
    const standby = pulse(t, 44.0, K.lights + 0.2, 0.3, 0.2) * 0.12;
    return Math.max(on, standby);
  }

  function update(t, d, show) {
    const inSong = t < 127.6;
    group.visible = d > 0.01 && inSong;
    if (!group.visible) { releaseSpin(show); return; }
    shaft.visible = d < VAULT.depth + 0.01;
    vault.visible = d > 10.5;
    // shaft lamps: on for the ride, out at "hold your breath" (B9 stays), on again for the drop
    sfx.groups[7] = sm(40.3, 40.6, t) * (1 - sm(42.76, 43.0, t)) + pulse(t, 44.86, 47.6, 0.05, 0.4);
    sfx.groups[8] = sm(40.3, 40.6, t) * (1 - sm(46.4, 46.9, t));
    const cwTop = Math.min(-0.9, -shaftH + 1.0 + d * 0.95);
    cw.position.y = cwTop - 0.85;
    cable.position.y = cwTop;
    cable.scale.y = Math.max(0.01, -cwTop);
    // the shaft: a warm lamp rides down with the platform (player space = world)
    if (d > 0.6 && !vault.visible) {
      // inside the shaft: dark concrete, the moon is gone
      SU.uSky.value.set(0x1c2028); SU.uGround.value.set(0x15100b);
      SU.uKeyCol.value.set(0x24252a); SU.uRimCol.value.set(0x1a2230);
      SU.uFogCol.value.set(0x07080b); SU.uFogNear.value = 8; SU.uFogFar.value = 30;
    }
    if (d < VAULT.depth - 0.5) {
      const ride = d > 0.5 ? 1 : 0;
      SU.uP.value[2].set(0, 2.6, 0);
      SU.uPC.value[2].set(0xffc890).multiplyScalar(1.4 * ride * (0.35 + 0.65 * Math.max(sfx.groups[7], sfx.groups[8])));
      SU.uPR.value[2] = 7.5;
    }
    if (!vault.visible) { releaseSpin(show); return; }

    const tv = vaultTime(t);
    const L = lampLevel(t);
    // light rig (vault coordinates == world once docked)
    SU.uSky.value.set(0x3a4252).multiplyScalar(0.2 + 0.8 * L);
    SU.uGround.value.set(0x2a1d12).multiplyScalar(0.25 + 0.75 * L);
    SU.uKeyDir.value.set(0.0, 1.0, 0.0);
    SU.uKeyCol.value.set(0x8a7a60).multiplyScalar(L);
    SU.uRimCol.value.set(0x2a3446).multiplyScalar(0.3 + 0.7 * L);
    SU.uFogCol.value.set(0x07080b); SU.uFogNear.value = 10; SU.uFogFar.value = 45;
    const P = SU.uP.value, PC = SU.uPC.value, PR = SU.uPR.value;
    const th = drumAngle(t, tv);
    const doorOpen = smoother(K.open0, K.open1, tv) * (1 - sm(K.two + 0.3, K.one, tv));
    const crack = pulse(tv, K.hold, K.open1, 0.6, 0.2);
    P[0].set(0, 4.6, -3.2); PC[0].set(0xffe6c0).multiplyScalar(1.1 * L); PR[0] = 11;
    P[1].set(0, 4.6, 3.2); PC[1].set(0xffe6c0).multiplyScalar(1.1 * L); PR[1] = 11;
    P[2].set(0, 2.2, -5.9); PC[2].set(0xffa030).multiplyScalar((doorOpen * 2.6 + crack * 0.5) * (th < 0.05 ? 1 : 0)); PR[2] = 9;
    P[3].set(SPOOL_W.x, 3.4, -6.6); PC[3].set(0xffc060).multiplyScalar((t < K.rew0 ? 1 : 0) * pulse(tv, K.fire, K.fire + 3.6, 0.05, 0.6) * (0.75 + 0.25 * Math.sin(t * 31)) * 1.4); PR[3] = 6;
    // drum + everything on it
    drum.rotation.y = th;
    const pull = drawerPull(tv);
    for (let i = 0; i < 2; i++) { boxList[drawers[i]].pull = pull; setBox(drawers[i]); }
    boxes.instanceMatrix.needsUpdate = true;
    bfx.groups[1] = pull / 0.3;
    // the beacon: one red light (77.62) sweeping the vault until the game begins
    const red = tv >= K.red && tv < K.spin1 + 2.4 && t < K.rew0 + 0.2;
    beaconAt(th, _bw);
    SU.uBeacon.value.set(_bw.x, _bw.y, _bw.z, (tv - K.red) * 8.5);
    SU.uBeaconCol.value.set(0xff1a0a).multiplyScalar(red ? 1.5 : 0);
    beacon.material.uniforms.uGlow.value = red ? 4 : 0.3;
    dfx.groups[7] = red ? 0.75 + 0.25 * Math.sin(tv * 22) : 0;
    // bolts: locked, retract one by one, shoot home again at "one"
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + Math.PI / 2;
      const t0 = K.bolts0 + i * (K.bolts1 - K.bolts0) / 12;
      const lock = 1 - smoother(t0, t0 + 0.12, tv) + smoother(K.one - 0.05, K.one + 0.12, tv);
      const r = lerp(1.25, 1.62, Math.min(1, lock));
      _q.setFromAxisAngle(AZ, a - Math.PI / 2);
      _m.compose(_p.set(Math.cos(a) * r, Math.sin(a) * r, 0.18), _q, _one);
      bolts.setMatrixAt(i, _m);
    }
    bolts.instanceMatrix.needsUpdate = true;
    hinge.rotation.y = -doorOpen * 1.95;
    wheel.rotation.z = wheelAngle(tv);
    backGear.rotation.z = wheel.rotation.z;
    const ticks = sm(K.tick1, K.tick1 + 0.06, tv) + sm(K.tick2, K.tick2 + 0.06, tv);
    dial.rotation.z = smoother(K.spin1 + 2.2, K.tick1 - 0.25, tv) * TAU * 0.8 + ticks * 0.44;
    sealU.uAmt.value = crack * (th < 0.05 ? 1 : 0);
    // number drum + the three warning lamps
    digits.rotation.x = (digitAt(tv) + 0.5) / 10 * TAU;
    digits.material.uniforms.uLight.value = 0.35 + 0.65 * L;
    const lamp = (at) => (tv >= at && tv < K.one + 1.6 ? 1 : 0);
    dfx.groups[4] = lamp(K.three); dfx.groups[5] = lamp(K.two); dfx.groups[6] = lamp(K.one);
    // treasure + wire
    tfx.groups[1] = doorOpen + crack * 0.3;
    spool.rotation.x = -(tv > K.wire ? (tv - K.wire) * 2.2 + Math.max(0, tv - K.fire) * 3 : 0);
    const prog = smoother(K.wire, K.wireIn, tv);
    wireU.uProg.value = prog;
    wireU.uTail.value = smoother(K.two, K.two + 0.5, tv) * 1.001;
    wireU.uPulse.value = pulse(tv, K.fire, K.three, 0.3, 0.3);
    wire.visible = prog > 0.001 && wireU.uTail.value < 1 && th < 0.01 && t < K.rew0;
    vfx.groups[3] = th < 0.01 && t < K.rew0 ? 1 : 0;
    // floor cables
    const cg = cableMat.uniforms.uGroup.value;
    const cab = (t0) => (tv < t0 ? 0 : 1 - sm(t0 + 2.5, t0 + 4, tv)) * (1 - sm(K.rew0, K.rew0 + 1.5, t));
    cg[1] = cab(K.lights); cg[2] = cab(K.gold2); cg[3] = cab(K.gold3);
    // arms
    const drop = armDrop(tv);
    for (let s = 0; s < 2; s++) {
      const arm = arms[s];
      arm.base.visible = drop < 4.7;
      if (!arm.base.visible) continue;
      solveArm(arm, armPose(s, tv), drop);
      arm.eye.groups[1] = (tv >= K.spy - 0.4 ? 1 : 0.15) * (0.3 + 0.7 * L);
    }
    // lasers: on one by one (count down to zero), waltz, off when the game begins
    const waltz = sm(K.waltz - 0.3, K.waltz + 0.6, tv) * (1 - sm(K.red, K.red + 0.6, tv));
    const ph = ((tv - K.waltz) / (BEAT * 3)) * TAU;
    const lp = lfx.a.iPos;
    const beam = 1 + pulse(tv, K.beam, K.beam + 1.4, 0.05, 0.4) * 0.8;
    let anyLaser = false;
    for (let k = 0; k < NL; k++) {
      const L0 = laserDef[k];
      let amt = tv >= L0.on && tv < K.spin1 ? 1 : 0;
      if (amt && tv - L0.on < 0.12) amt = Math.sin((tv - L0.on) * 120) > 0 ? 1 : 0.25;
      anyLaser = anyLaser || amt > 0;
      const a = L0.a + waltz * (Math.sin(ph + L0.ph) * 0.16) + Math.max(0, Math.min(tv, K.red + 0.6) - K.waltz) * 0.05 * (k % 2 ? 1 : -1);
      const yy = waltz * Math.sin(ph * 0.5 + L0.ph) * 0.45;
      const A = V(Math.cos(a - L0.span) * 7.04, L0.y0 + yy, Math.sin(a - L0.span) * 7.04);
      const B = V(Math.cos(a + L0.span) * 7.04, L0.y1 - yy, Math.sin(a + L0.span) * 7.04);
      _d.copy(B).sub(A);
      const len = _d.length();
      _q.setFromUnitVectors(UP, _d.normalize());
      _m.compose(A, _q, _p.set(0.007, len, 0.007)); lasers.setMatrixAt(k * 2, _m); lAmt.setX(k * 2, amt * beam);
      _m.compose(A, _q, _p.set(0.03, len, 0.03)); lasers.setMatrixAt(k * 2 + 1, _m); lAmt.setX(k * 2 + 1, amt * 0.4 * beam);
      for (const j of [0, NL * 2]) {
        lp.setXYZ(j + k * 2, A.x, amt > 0 ? A.y : -50, A.z);
        lp.setXYZ(j + k * 2 + 1, B.x, amt > 0 ? B.y : -50, B.z);
      }
    }
    lasers.instanceMatrix.needsUpdate = true;
    lAmt.needsUpdate = true;
    lp.needsUpdate = true;
    lasers.visible = anyLaser;
    lfx.mesh.visible = anyLaser;
    // the deck: VU kicks while the gold flows, the reels run backwards in the rewind
    const deck = world.deck;
    if (wire.visible && prog >= 1 && tv < K.two) {
      const bp = ((t - K.wireIn) / BEAT) % 1;
      if (bp < 0.12) deck.kickVu?.(0.7);
    }
    const rew = t >= K.rew0 && t < K.rew1;
    if (show?.retFrom) releaseSpin(show);
    else if (rew) {
      spinOwned = true;
      deck.state.spinTarget = -3;
      if (deck.tape) deck.tape.spin = -8;
      deck.kickVu?.(0.3);
    } else releaseSpin(show);
  }
  function releaseSpin(show) {
    if (!spinOwned) return;
    spinOwned = false;
    if (show?.retFrom) return; // the return owns the deck now
    world.deck.state.spinTarget = 1;
    if (world.deck.tape) world.deck.tape.spin = 1;
  }

  function events() {
    const E = [];
    const e = (t, sfx, gain = 0.8, haptic = null) => E.push({ t, sfx, gain, haptic });
    e(K.lights, 'switch', 0.9, [0.4, 40]);
    for (let s = 0; s < 4; s++) e(K.sparks + s * BEAT * 0.5, 'crack', 0.25);
    e(K.armsDown, 'pneumatic', 0.7);
    e(K.armsDown + 1.3, 'grab', 0.5);
    e(K.spy, 'tick', 0.7);
    for (let k = 0; k < NL; k++) e(laserDef[k].on, 'tick', 0.5);
    e(K.zero, 'ping', 0.5);
    e(K.steel, 'grab', 0.7, [0.2, 40]);
    e(K.steel + 0.15, 'slot', 0.5);
    e(K.red, 'morse', 0.8, [0.3, 120]);
    e(K.red + 0.05, 'slot', 0.7);
    e(K.spin0, 'motor', 0.9, [0.3, 260]);
    e(K.spin1, 'hatch', 1, [0.8, 120]);
    e(K.spin1 + 0.05, 'switch', 0.6);
    e(K.tick1, 'tick', 1, [0.15, 30]); e(K.tick2, 'tick', 1, [0.15, 30]);
    for (let i = 0; i < 12; i++) e(K.bolts0 + i * (K.bolts1 - K.bolts0) / 12 + 0.06, 'key', 0.55);
    e(K.hold + 0.3, 'pneumatic', 0.45);
    e(K.open0, 'shutter', 0.8, [0.4, 200]);
    e(K.wire, 'whoosh', 0.8);
    e(K.wireIn, 'slot', 0.9, [0.6, 60]);
    e(K.three, 'ping', 0.6); e(K.two, 'ping', 0.6); e(K.one, 'ping', 0.8);
    e(K.two + 0.1, 'whoosh', 0.6);
    e(K.one + 0.02, 'hatch', 0.9, [0.7, 90]);
    e(K.one + 0.5, 'pneumatic', 0.6);
    e(K.rew0, 'tapeStart', 0.9);
    e(K.rew1, 'tapeStop', 0.8);
    return E;
  }

  function begin() { spinOwned = false; }
  function end() { spinOwned = false; }

  return { group, vault, shaft, drum, arms, lasers, wire, events, update, begin, end, K };
}
