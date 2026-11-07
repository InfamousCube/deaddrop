// S12 Fireworks over the harbour bridge (95.10-104.20, hot; drawn on to 112.04 beside S13). Round 3 rebuild.
// SHOT CARD
//   hero: an art-deco suspension bridge that runs along your path on the left (deck 12 m up, its edge 13 m
//         to your left): stepped towers with three arched portals (the near one passes on your left at
//         14 m, the far one stands ahead-left at 86 m), a black deck with a band of stiffener ribs, main
//         cables in catenaries over both towers, hangers every 6 m passing by. On "Gold" the cables light
//         up gold from the anchorage behind you, over the near tower and down the span to the far tower
//         (1.5 s), reflected in the black water.
//   then: fireworks (chrysanthemums of thick strokes) ahead, left, right and overhead-behind on
//         "fire in the sky"; on "Smile" a firework picture draws her angel face (bob, halo, closed eyes,
//         smile) over the far shore; on "lie" the strokes slide into her spy face (hat, upturned collar,
//         round glasses that turn red on "spy").
//   around: the bridge and its hangers on the left, the far tower ahead-left, a skyline on the right shore
//           and across the water, bursts behind and overhead; the pier with the red booth ahead (S13 pre).
//   palette: black water and sky, crimson horizon glow, gold cables and bursts, cream picture, red glasses.
//   lyric: low centre on the water (d 7, y -0.25, depthTest false), one block at a time.
//   out: WORLD PASSES BY: the near tower passes on your left, the pier with the lit booth is ahead. The
//        bridge, water and skyline stay drawn beside S13 (post 7.84) until its lights-out.
import * as THREE from 'three';
import { PAL } from './style.js';
import {
  D2R, sm, lin, lerp, env, clamp01, easeOut, easeInOut, setI, inst, merge, lathe, shapeOf, extrude, rrect, circ, tube, bbox, box, beam,
  sagPts, curveOf, tubeU, wireMat, NEUTRAL, FOG_U, fogUniforms, HARBOUR, HOT_NIGHT, TMP,
} from './scenes-3-util.js';

const WY = HARBOUR.waterY, BX = HARBOUR.bridgeX, [TZ0, TZ1] = HARBOUR.towerZ;
const DECK = { top: 12, h: 1.8, w: 12, z0: 30, z1: -140 };
const TOWER = { top: 40 };
const CABLE_X = 3.6;
const PIC = { x: 14, y: 33, z: -112, M: 26, s: 1.25 };

// firework burst: tapered strokes flying out of a centre, pure in uTime (one mesh each)
const BURST_V = /* glsl */ `
attribute vec2 aDir; attribute vec3 aQ; // aQ: x along 0..1, y side -1..1, z speed factor
uniform float uTime, uT0, uR, uW, uLife;
varying float vA; varying float vDepth; varying vec3 vC;
void main() {
  float age = uTime - uT0;
  float k = 1.0 - pow(1.0 - clamp(age / 0.85, 0.0, 1.0), 3.0);
  float r = uR * aQ.z * k;
  float len = uR * 0.42 * (1.0 - 0.55 * clamp(age / uLife, 0.0, 1.0));
  float rr = max(r - len * (1.0 - aQ.x), 0.0);
  vec2 p = aDir * rr;
  p.y -= 1.6 * age * age;
  vec2 perp = vec2(-aDir.y, aDir.x);
  p += perp * aQ.y * uW * (0.25 + 0.75 * aQ.x);
  vec4 mv = modelViewMatrix * vec4(p, 0.0, 1.0);
  vA = (age > 0.0 && age < uLife) ? 1.0 - smoothstep(uLife * 0.45, uLife, age) : 0.0;
  vC = color; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BURST_F = /* glsl */ `uniform float uFade, uSceneFade; varying float vA; varying float vDepth; varying vec3 vC;
void main(){ if (vA < 0.01) discard; vec3 c = vC * vA * uFade * uSceneFade; gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
}`;
function burstMesh(kit, n, cols, seed) {
  const rnd = kit.rnd(seed);
  const pos = [], dir = [], q = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.12, sp = 0.8 + rnd() * 0.25;
    c.set(cols[i % cols.length]);
    const b = pos.length / 3;
    for (const [al, sd] of [[0, -1], [0, 1], [1, -1], [1, 1]]) { pos.push(0, 0, 0); dir.push(Math.cos(a), Math.sin(a)); q.push(al, sd, sp); col.push(c.r, c.g, c.b); }
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 2));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const u = { uTime: kit.U.uTime, uT0: { value: 0 }, uR: { value: 10 }, uW: { value: 0.45 }, uLife: { value: 1.2 }, uFade: kit.U.uFade, uSceneFade: kit.SU.uSceneFade };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: BURST_V, fragmentShader: BURST_F, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// the picture firework: 6 strokes, each M points, angel -> spy (metres, centre of the face at 0,0)
function resample(pts, M) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = [], tot = L[L.length - 1];
  let j = 0;
  for (let i = 0; i < M; i++) {
    const s = (tot * i) / (M - 1);
    while (j < L.length - 2 && L[j + 1] < s) j++;
    const k = (s - L[j]) / Math.max(1e-6, L[j + 1] - L[j]);
    out.push([lerp(pts[j][0], pts[j + 1][0], k), lerp(pts[j][1], pts[j + 1][1], k)]);
  }
  return out;
}
const ell = (cx, cy, rx, ry, a0, a1, n = 24) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; };
const TAU = Math.PI * 2;
const ANGEL = [
  ell(0, -1, 8, 10.5, -Math.PI / 2, TAU - Math.PI / 2, 30),                                                                  // face
  [[-6.5, -6.5], [-10.2, -6.5], [-10.8, 0], [-9.5, 6.5], [-5.5, 10.8], [0, 12], [5.5, 10.8], [9.5, 6.5], [10.8, 0], [10.2, -6.5], [6.5, -6.5]], // bob
  ell(0, 16, 8.5, 2.2, Math.PI / 2, Math.PI / 2 + TAU, 30),                                                                   // halo
  ell(-3.6, 0.6, 2.3, 1.4, Math.PI * 1.1, Math.PI * 1.9, 10),                                                                 // closed eyes
  ell(3.6, 0.6, 2.3, 1.4, Math.PI * 1.1, Math.PI * 1.9, 10),
  ell(0, -3.4, 3.8, 2.4, Math.PI * 1.12, Math.PI * 1.88, 12),                                                                 // smile
];
const SPY = [
  [[-12.5, -17], [-11, -4], [-6.5, -10], [-3.5, -11.5], [0, -14.5], [3.5, -11.5], [6.5, -10], [11, -4], [12.5, -17]],        // upturned collar
  [[-7.2, 4.2], [-6.8, 9.2], [-4.2, 11.4], [-1.2, 11.0], [0, 10.2], [1.2, 11.0], [4.2, 11.4], [6.8, 9.2], [7.2, 4.2]],       // hat crown (dented)
  ell(0, 4.2, 15, 2.6, Math.PI / 2, Math.PI / 2 + TAU, 30),                                                                   // brim (the halo slid down)
  ell(-4.1, -0.6, 2.7, 2.7, -Math.PI / 2, TAU - Math.PI / 2, 14),                                                             // round glasses
  ell(4.1, -0.6, 2.7, 2.7, -Math.PI / 2, TAU - Math.PI / 2, 14),
  [[-2.8, -6.0], [-0.6, -6.3], [1.2, -6.1], [3.0, -5.2]],                                                                     // a flat smirk
];
const COL_A = [PAL.cream, PAL.cream, PAL.gold, PAL.cream, PAL.cream, PAL.gold];
const COL_B = [PAL.cream, PAL.cream, PAL.gold, PAL.cream, PAL.cream, PAL.cream];

function towerGeo() {
  // the tower face lies in x-y (legs straddle the deck), extruded along z (3.4 m)
  const o = [[-8.6, WY], [8.6, WY], [8.6, 16.5], [7.9, 16.5], [7.9, 27], [7.1, 27], [7.1, 35.5], [5.9, 35.5], [5.9, 38], [4.2, 38], [4.2, TOWER.top], [-4.2, TOWER.top], [-4.2, 38], [-5.9, 38], [-5.9, 35.5], [-7.1, 35.5], [-7.1, 27], [-7.9, 27], [-7.9, 16.5], [-8.6, 16.5]];
  const arch = (w, y0, y1) => { const p = [[-w, y0], [w, y0], [w, y1]]; for (let i = 1; i < 10; i++) { const a = (Math.PI * i) / 10; p.push([w * Math.cos(a), y1 + w * 0.55 * Math.sin(a)]); } p.push([-w, y1]); return p; };
  const holes = [arch(6.2, 0.2, 12.4), arch(4.6, 18.2, 23.6), arch(3.2, 28.6, 32.4)];
  const P = [{ g: extrude(shapeOf(o, holes), 3.4, 0.35, { curve: 4 }), c: 1 }];
  P.push({ g: bbox(7.2, 1.0, 3.0, 0.15, 0, TOWER.top + 0.5, 0), c: 0.9 });
  P.push({ g: bbox(4.4, 1.3, 2.2, 0.15, 0, TOWER.top + 1.6, 0), c: 0.9 });
  for (const x of [-CABLE_X, CABLE_X]) P.push({ g: bbox(1.6, 1.0, 2.8, 0.12, x, TOWER.top + 0.4, 0), c: 0.7 });
  // art-deco fluting: two raised strips on each leg, front and back faces
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) P.push({ g: bbox(0.5, 13, 0.5, 0.1, sx * (7.0 + (i - 0.5) * 1.1), 7.5, sz * 1.95), c: 0.75 });
  return merge(P);
}

export const S12 = {
  id: 'S12', t0: 95.1, t1: 104.2, world: 'hot', pre: 0, post: 7.84,
  key: [0.15, 0.4, 0.9],
  fog: { color: PAL.velvet, near: 60, far: 260 },
  sky: { ...HOT_NIGHT },
  build(kit) {
    const s = {};
    const W = kit.words;
    s.tGold = W.times('gold on the wire,', 95.16);
    s.tFire = W.times('fire in the sky', 97.44);
    s.tSmile = W.times('smile like an angel,', 99.68);
    s.tLie = W.times('lie like a spy', 102.1);
    s.tTonight = W.times('tonight', 111.16)[0];
    s.prof = kit.travel(HARBOUR.prof);
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    const Wd = (s.W = new THREE.Group()); root.add(Wd);

    // black water with reflections (translucent: the mirrored glow below shows through)
    s.water = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black, opacity: 0.74, fog: 0 }));
    s.water.position.set(0, WY, -150); s.water.renderOrder = 2;
    Wd.add(s.water);
    // Round 4 (Leo: "too little happens around you"): moored boats on both sides of the channel, 7.5 m out, black
    // with a gold rim like the S16/S17 silhouettes: hull with sheer and keel, wheelhouse, stubby mast. They pass
    // at your sides while you glide toward the booth and stay behind you (back view).
    {
      const hull = extrude(shapeOf([[-4.4, 0.6], [-4.2, -0.6], [3.0, -0.7], [4.8, 1.2], [4.2, 1.15], [0, 0.75]]), 2.6, 0.06);
      hull.computeBoundingBox(); hull.translate(0, 0, -(hull.boundingBox.max.z + hull.boundingBox.min.z) / 2);
      const boatG = merge([hull, box(2.2, 1.4, 2.0, -1.5, 1.4, 0), box(2.5, 0.16, 2.3, -1.5, 2.15, 0), box(0.24, 3.4, 0.24, 1.3, 2.3, 0)].map((g) => ({ g }))).rotateY(Math.PI / 2);
      const BOATS = [[7.6, -5, 0], [-7.8, -12, Math.PI], [7.9, -20, 0.08], [-7.5, -28, Math.PI - 0.06]];
      s.boats = inst(boatG, kit.toon({ ramp: 'black', rim: PAL.carmine, rimAmt: 0.9 }), BOATS.length, 's12-boats');
      BOATS.forEach(([x, z, ry], i) => setI(s.boats, i, x, WY, z, 0, ry, 0));
      Wd.add(s.boats);
    }

    // towers, deck, hangers, anchorages: the bridge runs along your path on the left
    const dark = kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: null });
    const towerMat = kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.gold, rimTh: 0.78 });
    const tg = towerGeo();
    s.towers = new THREE.Mesh(merge([TZ0, TZ1].map((z) => ({ g: tg.clone().translate(BX, 0, z), c: 0x6a1016 }))), towerMat);
    Wd.add(s.towers);
    const P = [];
    const DL = DECK.z0 - DECK.z1, DZc = (DECK.z0 + DECK.z1) / 2;
    P.push({ g: bbox(DECK.w, DECK.h, DL, 0.25, BX, DECK.top - DECK.h / 2, DZc), c: 0x1a0b0d });
    for (let z = DECK.z0 - 1; z >= DECK.z1 + 1; z -= 2.5) for (const sx of [-1, 1]) P.push({ g: box(0.3, DECK.h - 0.3, 0.45, BX + sx * (DECK.w / 2 + 0.12), DECK.top - DECK.h / 2, z), c: 0x1a0b0d });
    for (let z = DECK.z0 - 2; z >= DECK.z1 + 2; z -= 5) P.push({ g: box(DECK.w - 0.6, 0.6, 0.6, BX, DECK.top - DECK.h - 0.3, z), c: 0x12080a });
    P.push({ g: bbox(0.4, 0.5, DL, 0.1, BX + DECK.w / 2 - 0.2, DECK.top + 0.7, DZc), c: 0x3a1014 }); // railing band
    // main cables (dark core) and hangers; anchorages behind you and far ahead
    const A0 = TZ0 + 40, A1 = TZ1 - 40, TOP = TOWER.top + 0.9, LOW = DECK.top + 2.4;
    const cablePts = [];
    for (const sx of [-1, 1]) {
      const x = BX + sx * CABLE_X;
      const pts = [].concat(
        sagPts([x, WY + 2.5, A0], [x, TOP, TZ0], -2, 8),
        sagPts([x, TOP, TZ0], [x, TOP, TZ1], TOP - LOW, 26).slice(1),
        sagPts([x, TOP, TZ1], [x, WY + 2.5, A1], -2, 8).slice(1));
      cablePts.push(pts);
      P.push({ g: tube(pts, 0.45, 140, 6), c: 0x16060a });
      for (let z = TZ0 - 4; z >= TZ1 + 4; z -= 6) {
        const k = (z - (TZ0 + TZ1) / 2) / ((TZ0 - TZ1) / 2);
        const yC = TOP - (TOP - LOW) * (1 - k * k);
        P.push({ g: new THREE.CylinderGeometry(0.18, 0.18, yC - DECK.top, 5).translate(x, DECK.top + (yC - DECK.top) / 2, z), c: 0x16060a });
      }
    }
    for (const z of [A0, A1]) P.push({ g: bbox(16, 5, 9, 0.3, BX, WY + 2.2, z), c: 0x14080a });
    s.bridge = new THREE.Mesh(merge(P), dark);
    Wd.add(s.bridge);

    // the gold glow along both cables (reveals left to right), plus its reflection in the water
    const gg = [];
    for (const pts of cablePts) gg.push(tubeU(tube(pts, 0.52, 140, 6), 140, 6));
    const goldG = new THREE.BufferGeometry();
    {
      const n = gg.reduce((a, g) => a + g.index.count, 0);
      const pos = [], u = [];
      for (const g of gg) { const ng = g.toNonIndexed(); pos.push(...ng.getAttribute('position').array); u.push(...ng.getAttribute('aU').array); }
      goldG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      goldG.setAttribute('aU', new THREE.Float32BufferAttribute(u, 1));
      goldG.computeBoundingSphere();
      void n;
    }
    s.goldMat = wireMat(kit, PAL.gold, { fog: 0.25 });
    s.gold = new THREE.Mesh(goldG, s.goldMat); s.gold.frustumCulled = false;
    Wd.add(s.gold);
    s.goldRefl = new THREE.Mesh(goldG, s.goldMat); s.goldRefl.frustumCulled = false;
    s.goldRefl.scale.y = -1; s.goldRefl.position.y = 2 * WY;
    Wd.add(s.goldRefl);

    // skylines: both shores and across the water; a few big window grids
    const rnd = kit.rnd(29);
    const B = [], Wn = [];
    const block = (x, z, w, d, h, win) => {
      B.push({ g: bbox(w, h, d, 0.3, x, WY + h / 2, z), c: 0x16070a });
      B.push({ g: box(w * 0.6, 2, d * 0.6, x, WY + h + 1, z), c: 0x16070a });
      if (win) {
        const fx = x > 40 ? -1 : x < -40 ? 1 : 0;
        const cols = 2, rows = 2;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const wy = WY + h * 0.45 + j * 5.6, off = (i - (cols - 1) / 2) * 4.6;
          const g = new THREE.PlaneGeometry(3.0, 4.2);
          if (fx) g.rotateY(fx * Math.PI / 2).translate(x + fx * (w / 2 + 0.05), wy, z + off);
          else g.translate(x + off, wy, z + d / 2 + 0.05);
          Wn.push({ g, c: rnd() > 0.35 ? PAL.gold : PAL.cream });
        }
      }
    };
    for (let i = 0; i < 12; i++) block(70 + rnd() * 30, 30 - i * 19, 14 + rnd() * 8, 14 + rnd() * 6, 16 + rnd() * 30, i === 4);
    for (let i = 0; i < 8; i++) block(-60 - rnd() * 25, -150 - i * 12, 14, 14, 14 + rnd() * 20, false);
    for (let i = 0; i < 12; i++) block(-90 + i * 18 + rnd() * 4, -205 - rnd() * 15, 14 + rnd() * 6, 14, 18 + rnd() * 34, i === 9);
    B.push({ g: box(60, 2.4, 300, 102, WY + 1.2, -90), c: 0x12060a });
    B.push({ g: box(300, 2.4, 40, 0, WY + 1.2, -205), c: 0x12060a });
    s.city = new THREE.Mesh(merge(B), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: null }));
    Wd.add(s.city);
    s.winMat = kit.flat({ color: 0xffffff, vertexColors: true, fog: 0.35 });
    s.windows = new THREE.Mesh(merge(Wn), s.winMat);
    Wd.add(s.windows);

    // fireworks: ahead, left, right, overhead-behind (biggest), one small far left-behind
    const BUR = [
      { t: s.tFire[0], p: [10, 42, -105], R: 15, cols: [PAL.cream, PAL.gold], seed: 3 },
      { t: s.tFire[1], p: [-54, 36, -76], R: 12, cols: [PAL.gold, PAL.crimson], seed: 5 },
      { t: s.tFire[2], p: [58, 38, -72], R: 12, cols: [PAL.crimson, PAL.cream], seed: 8 },
      { t: s.tFire[3], p: [0, 50, 4], R: 20, cols: [PAL.gold, PAL.cream, PAL.gold], seed: 13 },
      { t: s.tGold[3], p: [40, 30, 20], R: 10, cols: [PAL.gold], seed: 17 },
    ];
    s.bursts = BUR.map((b) => {
      const m = burstMesh(kit, 22, b.cols, b.seed);
      m.material.uniforms.uT0.value = b.t; m.material.uniforms.uR.value = b.R; m.material.uniforms.uW.value = b.R * 0.085;
      m.position.set(...b.p);
      const dz = -s.prof.d(b.t);
      m.lookAt(0, 1.6, dz);
      Wd.add(m);
      return { m, b };
    });

    // the picture firework (ribbons rebuilt on the CPU from the morph; 6 strokes x M points)
    const M = PIC.M, NS = ANGEL.length;
    s.A = ANGEL.map((p) => resample(p, M)); s.Bp = SPY.map((p) => resample(p, M));
    const nv = NS * M * 2;
    s.picPos = new Float32Array(nv * 3); s.picCol = new Float32Array(nv * 3);
    const idx = [];
    for (let k = 0; k < NS; k++) for (let i = 0; i < M - 1; i++) { const a = (k * M + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(s.picPos, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(s.picCol, 3));
    pg.setIndex(idx);
    s.pic = new THREE.Mesh(pg, kit.flat({ color: 0xffffff, vertexColors: true, fog: 0.15, side: THREE.DoubleSide }));
    s.pic.frustumCulled = false;
    s.pic.position.set(PIC.x, PIC.y, PIC.z); s.pic.scale.setScalar(PIC.s);
    Wd.add(s.pic);
    s.cA = new THREE.Color(); s.cB = new THREE.Color();

    const AT = { d: 7, az: 0, y: -0.25 };
    kit.text('GOLD ON\nTHE WIRE,', { cap: 1.05, color: 'gold', near: 95.16, say: 'gold on the wire,', out: 97.3, depthTest: false, at: AT });
    kit.text('FIRE IN\nTHE SKY', { cap: 1.05, color: 'cream', near: 97.44, say: 'fire in the sky', out: 99.55, depthTest: false, at: AT });
    kit.text('SMILE LIKE\nAN ANGEL,', { cap: 0.95, color: 'gold', near: 99.68, say: 'smile like an angel,', out: 102.0, depthTest: false, at: AT });
    kit.text('LIE LIKE\nA SPY', { cap: 1.0, color: 'cream', colors: { 3: 'rust' }, near: 102.1, say: 'lie like a spy', out: 104.1, depthTest: false, at: { ...AT, az: -33 } }); // left of the booth, not on it
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;
    s.root.visible = t < 111.76;                         // S13's lights-out takes the harbour down first
    // cables light up from the left anchorage over both towers to the right (1.5 s), stay gold
    s.goldMat.uniforms.uK1.value = easeInOut(lin(s.tGold[0], s.tGold[0] + 1.5, t));
    s.goldMat.uniforms.uBright.value = 1 + 0.5 * env(t, s.tGold[0] + 1.5, 3) + 0.25 * kit.downEnv(t, 6);
    // windows: dim, one flash when the call arrives ("tonight")
    const wf = env(t, s.tTonight, 3);
    s.windows.visible = wf > 0.02; // dark until the call arrives, then one flash
    s.winMat.uniforms.uBright.value = 0.4 + 1.6 * wf;
    // fireworks
    for (const B of s.bursts) B.m.visible = t > B.b.t && t < B.b.t + 1.3;
    // the picture: draws itself on "Smile", halo flares on "angel", re-forms into the spy on "lie"
    const draw = easeOut(lin(s.tSmile[0], s.tSmile[0] + 0.7, t));
    const mo = easeInOut(lin(s.tLie[0], s.tLie[0] + 0.55, t));
    const out = 1 - sm(103.9, 104.3, t);
    s.pic.visible = t > s.tSmile[0] && out > 0.01;
    if (s.pic.visible) {
      const M = PIC.M, W2 = 0.6, pp = s.picPos, pc = s.picCol;
      const halo = 1 + 1.2 * env(t, s.tSmile[3], 2.5);
      const red = t >= s.tLie[3];
      for (let k = 0; k < s.A.length; k++) {
        s.cA.set(COL_A[k]); s.cB.set(k >= 3 && k <= 4 && red ? PAL.red : COL_B[k]); s.cA.lerp(s.cB, mo);
        const br = (k === 2 ? lerp(halo, 1, mo) : 1) * out * (red && k >= 3 && k <= 4 ? 1.5 : 1);
        const last = Math.max(1, Math.floor(draw * (M - 1)));
        for (let i = 0; i < M; i++) {
          const j = Math.min(i, last);
          const ax = lerp(s.A[k][j][0], s.Bp[k][j][0], mo), ay = lerp(s.A[k][j][1], s.Bp[k][j][1], mo);
          const j0 = Math.max(0, j - 1), j1 = Math.min(M - 1, j + 1);
          const tx = lerp(s.A[k][j1][0], s.Bp[k][j1][0], mo) - lerp(s.A[k][j0][0], s.Bp[k][j0][0], mo);
          const ty = lerp(s.A[k][j1][1], s.Bp[k][j1][1], mo) - lerp(s.A[k][j0][1], s.Bp[k][j0][1], mo);
          const L = Math.hypot(tx, ty) || 1, nx = (-ty / L) * W2, ny = (tx / L) * W2;
          const o = ((k * M + i) * 2) * 3;
          pp[o] = ax + nx; pp[o + 1] = ay + ny; pp[o + 2] = 0;
          pp[o + 3] = ax - nx; pp[o + 4] = ay - ny; pp[o + 5] = 0;
          for (let e = 0; e < 2; e++) { pc[o + e * 3] = s.cA.r * br; pc[o + e * 3 + 1] = s.cA.g * br; pc[o + e * 3 + 2] = s.cA.b * br; }
        }
      }
      s.pic.geometry.attributes.position.needsUpdate = true;
      s.pic.geometry.attributes.color.needsUpdate = true;
    }
    if (kit.isOwner) {
      const ray = env(t, s.tFire[3], 2.2) * (t > s.tFire[3] ? 1 : 0);
      // crimson horizon glow (storyboard palette) so the bridge, towers and skyline read as black silhouettes
      // (like S16/S17); it settles back to S13's darker night before the seam at 104.2
      const glow = 1 - sm(102.6, 104.1, t);
      const hor = TMP.c.set(HOT_NIGHT.hor).lerp(TMP.c2.set(PAL.crimson), glow).getHex();
      const hor2 = TMP.c.set(HOT_NIGHT.hor2).lerp(TMP.c2.set(PAL.carmine), glow).getHex();
      kit.setSky({ ...HOT_NIGHT, hor, hor2, rays: ray * 0.9, rayA: PAL.carmine, rayB: PAL.black, rayR: 1.3, rot: t * 0.03, focal: [0, 0.35, -0.94] });
    }
  },
  events() {
    return [
      { t: 95.16, sfx: 'switch', gain: 0.4 },
      { t: 97.44, sfx: 'crack', gain: 0.35 },
      { t: 98.92, sfx: 'crack', gain: 0.5, haptic: [0.3, 60] },
      { t: 102.1, sfx: 'whoosh', gain: 0.3 },
    ];
  },
};
