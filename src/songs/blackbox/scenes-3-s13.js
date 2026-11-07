// S13 The red phone booth (104.20-112.04, hot; drawn from 95.10 as the pier ahead of S12). Round 3 rebuild.
// SHOT CARD
//   hero: a lit red phone booth at the head of a pier (our own design, no crown, no lettering): plinth,
//         four posts, glazed walls with 3 x 5 panes, lightbox header with a handset pictogram, segmental
//         pediments and a shallow dome. You stop 2.4 m in front of it. Its door swings open on "Count";
//         inside, a chrome 60s payphone with a real rotary dial (10 finger holes, number ring, finger stop)
//         and the handset hanging on its armoured cord. A black velvet glove (rust cuff) puts a finger in
//         the 0 and winds it all the way to the stop on "zero"; the dial runs back.
//   then: on "Gold" a gold spark jumps from the phone through the roof onto the telephone wire, runs to
//         the left pole, over your head to the right pole and away along the pole line to the city; the
//         city flashes on "tonight" and the booth light goes out.
//   around: bollards and lamp posts at the pier corners (4.3 m), telephone poles left and right of you
//           (5.6 m), the lit bridge behind you (S12), the skyline across the water.
//   palette: black night, crimson booth, cream light, chrome dial, gold spark and wire.
//   lyric: left of the booth (az -27, d 6), one block at a time; WHY redacted.
//   out: LIGHTS OUT, wire last: harbour 111.76, pier 111.86, booth 111.96; only the gold wire overhead
//        (left to right, 4 m above your eyes, at your z) stays lit into S14.
import * as THREE from 'three';
import { PAL } from './style.js';
import {
  D2R, sm, lin, lerp, env, clamp01, easeOut, easeInOut, setI, inst, merge, lathe, shapeOf, extrude, rrect, circ, tube, bbox, box, beam,
  sagPts, curveOf, tubeU, wireMat, NEUTRAL, HARBOUR, HOT_NIGHT, TMP,
} from './scenes-3-util.js';

const WY = HARBOUR.waterY;
const CRIM = 0xd8141c, CRIM_D = 0x6b090e, CHROME = 0xc9d0d6;
const STOP = -35 * D2R;                                    // finger stop angle on the dial
const HOLE = (k) => (25 + (k - 1) * 29) * D2R;            // hole k = 1..10 (10 = "0"), counter-clockwise from 1
const WIND0 = HOLE(10) - STOP;                             // 321 deg: the longest wind
const HOLE_R = 0.118;

// one glazed wall (front faces +z), 1.22 x 2.3 m, kick panel below, 3 x 5 panes
function glazedFrame() {
  const W = 1.22, Hh = 2.3, b = 0.08, m = 0.05, kick = 0.36;
  const pw = (W - 2 * b - 2 * m) / 3, ph = (Hh - kick - b - 4 * m) / 5;
  const holes = [];
  for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) {
    const x0 = -W / 2 + b + c * (pw + m), y0 = kick + r * (ph + m);
    holes.push([[x0, y0], [x0 + pw, y0], [x0 + pw, y0 + ph], [x0, y0 + ph]]);
  }
  return extrude(shapeOf([[-W / 2, 0], [W / 2, 0], [W / 2, Hh], [-W / 2, Hh]], holes), 0.05, 0.012, { curve: 1 });
}
const HANDSET_ICON = [[-0.2, 0.02], [-0.14, -0.05], [-0.08, -0.02], [-0.1, 0.03], [0.1, 0.03], [0.08, -0.02], [0.14, -0.05], [0.2, 0.02], [0.16, 0.07], [-0.16, 0.07]];

function boothGeo() {
  const P = [];
  P.push({ g: bbox(1.5, 0.16, 1.5, 0.04, 0, 0.08, 0), c: CRIM_D });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push({ g: bbox(0.15, 2.62, 0.15, 0.03, sx * 0.68, 0.16 + 1.31, sz * 0.68), c: CRIM });
  const fr = glazedFrame();
  P.push({ g: fr.clone().rotateY(-Math.PI / 2).translate(-0.66, 0.16, 0), c: CRIM });
  P.push({ g: fr.clone().rotateY(Math.PI / 2).translate(0.66, 0.16, 0), c: CRIM });
  P.push({ g: bbox(1.24, 2.3, 0.06, 0.015, 0, 0.16 + 1.15, -0.66), c: CRIM });           // solid back wall
  P.push({ g: bbox(1.1, 2.0, 0.02, 0.005, 0, 0.16 + 1.25, -0.62), c: CRIM_D });          // inner back panel
  // header band, lightbox frames, cornice, four segmental pediments, dome and knob
  P.push({ g: bbox(1.5, 0.08, 1.5, 0.02, 0, 2.5, 0), c: CRIM });
  P.push({ g: bbox(1.52, 0.12, 1.52, 0.03, 0, 2.86, 0), c: CRIM });
  const ped = shapeOf([[-0.74, 0]].concat(circ(1.05, 12, 0, -0.78, Math.PI / 2 + 0.785, Math.PI / 2 - 0.785).reverse().map(([x, y]) => [x, y]).reverse(), [[0.74, 0]]));
  for (let i = 0; i < 4; i++) P.push({ g: extrude(ped, 0.06, 0.015, { curve: 1 }).translate(0, 2.92, 0.72).rotateY((i * Math.PI) / 2), c: CRIM });
  P.push({ g: lathe([[0.72, 0], [0.69, 0.1], [0.58, 0.21], [0.4, 0.3], [0.2, 0.35], [0, 0.37]], 24).translate(0, 2.92, 0), c: CRIM });
  P.push({ g: lathe([[0, 0], [0.06, 0], [0.08, 0.05], [0.05, 0.1], [0.02, 0.14], [0, 0.15]], 10).translate(0, 3.27, 0), c: CRIM });
  // handset pictograms on the lightboxes (black)
  for (let i = 0; i < 4; i++) P.push({ g: new THREE.ShapeGeometry(shapeOf(HANDSET_ICON)).translate(0, 2.66, 0.785).rotateY((i * Math.PI) / 2), c: 0x050505 });
  return merge(P);
}
function glassGeo() {
  const P = [];
  for (const sx of [-1, 1]) P.push({ g: new THREE.PlaneGeometry(1.08, 1.92).rotateY(Math.PI / 2).translate(sx * 0.63, 0.16 + 0.36 + 0.96, 0) });
  for (let i = 0; i < 4; i++) P.push({ g: bbox(1.12, 0.26, 0.04, 0.01, 0, 2.66, 0.75).rotateY((i * Math.PI) / 2) });   // lightboxes
  P.push({ g: new THREE.PlaneGeometry(0.9, 0.06).rotateX(Math.PI / 2).translate(0, 2.44, 0) });                      // ceiling lamp
  return merge(P);
}
function phoneGeo() {
  const P = [];
  P.push({ g: extrude(rrect(0.5, 0.84, 0.08, 0, 0, 3), 0.15, 0.025, { curve: 3 }).translate(0, 0, 0.075), c: CHROME });
  P.push({ g: bbox(0.42, 0.22, 0.03, 0.01, 0, 0.27, 0.17), c: 0x5d666e });
  for (let i = 0; i < 3; i++) P.push({ g: bbox(0.07, 0.022, 0.02, 0.005, -0.11 + i * 0.11, 0.3, 0.19), c: 0x0a0a0a }); // coin slots
  P.push({ g: new THREE.CylinderGeometry(0.168, 0.168, 0.02, 32).rotateX(Math.PI / 2).translate(0, -0.03, 0.18), c: PAL.cream }); // number ring
  P.push({ g: lathe([[0, 0], [0.07, 0.0], [0.08, 0.05], [0.07, 0.07], [0, 0.065]], 12, 0, Math.PI).rotateZ(Math.PI).translate(0, -0.32, 0.17), c: 0x6a737a }); // coin return
  // the finger stop: a curved chrome hook over the ring at the stop angle
  const a = STOP, c = Math.cos(a), s = Math.sin(a);
  P.push({ g: tube([[c * 0.1, s * 0.1 - 0.03, 0.215], [c * 0.155, s * 0.155 - 0.03, 0.235], [c * 0.19, s * 0.19 - 0.03, 0.2]], 0.011, 8, 5), c: 0xe8eef2 });
  // hook cradle on the left side
  for (const z of [0.05, 0.13]) P.push({ g: bbox(0.04, 0.12, 0.03, 0.01, -0.28, 0.2, z), c: CHROME });
  P.push({ g: bbox(0.08, 0.03, 0.12, 0.01, -0.29, 0.14, 0.09), c: CHROME });
  P.push({ g: new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16).rotateX(Math.PI / 2).translate(0, -0.03, 0.212), c: PAL.cream }); // centre card
  return merge(P);
}
function wheelGeo() {
  const holes = [];
  for (let k = 1; k <= 10; k++) holes.push(circ(0.03, 10, Math.cos(HOLE(k)) * HOLE_R, Math.sin(HOLE(k)) * HOLE_R).reverse());
  return merge([{ g: extrude(shapeOf(circ(0.165, 36), holes), 0.012, 0.005, { curve: 3 }), c: 0xe2e7ea }]);
}
function handsetGeo() {
  const P = [];
  P.push({ g: tube([[0, -0.6, 0], [0.04, -0.68, 0], [0.05, -0.8, 0], [0.04, -0.92, 0], [0, -1.0, 0]], 0.03, 12, 6), c: 0x0b0b0d });
  P.push({ g: lathe([[0, 0], [0.065, 0.0], [0.07, 0.04], [0.04, 0.07], [0, 0.07]], 12).rotateZ(Math.PI / 2).translate(0.03, -0.6, 0), c: 0x0b0b0d });
  P.push({ g: lathe([[0, 0], [0.06, 0.0], [0.065, 0.04], [0.035, 0.07], [0, 0.07]], 12).rotateZ(Math.PI / 2).translate(0.03, -1.0, 0), c: 0x0b0b0d });
  P.push({ g: tube([[0, 0, 0], [0.02, -0.2, 0.02], [0, -0.4, 0], [0.02, -0.58, 0]], 0.016, 14, 5), c: CHROME }); // armoured cord
  return merge(P);
}
// black velvet glove with a rust gauntlet cuff, fingertip at the origin, finger pointing -z
function gloveGeo() {
  const V = 0x18181e, R = 0x912118;
  const P = [];
  const cz = (r, l, x, y, z, ry = 0, rx = 0) => new THREE.CapsuleGeometry(r, l, 3, 7).rotateX(Math.PI / 2 + rx).rotateY(ry).translate(x, y, z);
  P.push({ g: cz(0.018, 0.085, 0, 0, 0.06), c: V });                                  // index finger
  P.push({ g: bbox(0.1, 0.04, 0.11, 0.015, 0.012, 0.012, 0.165), c: V });              // palm
  for (let i = 0; i < 3; i++) P.push({ g: cz(0.017, 0.04, 0.018 + i * 0.026, -0.02, 0.12, 0, 0.9), c: V }); // curled fingers
  P.push({ g: cz(0.018, 0.05, -0.04, -0.012, 0.15, -0.9), c: V });                    // thumb
  P.push({ g: lathe([[0.045, 0], [0.05, 0.04], [0.07, 0.12], [0.078, 0.16], [0.07, 0.165], [0, 0.165]], 12).rotateX(Math.PI / 2).translate(0.012, 0.01, 0.21), c: R }); // cuff
  return merge(P);
}
function poleGeo() {
  const P = [];
  P.push({ g: lathe([[0, 0], [0.18, 0], [0.16, 3], [0.13, 7.5], [0, 7.55]], 8), c: 0x2a1610 });
  P.push({ g: bbox(2.0, 0.14, 0.15, 0.03, 0, 7.05, 0), c: 0x2a1610 });
  P.push({ g: beam([-0.6, 7.0, 0], [0, 6.4, 0], 0.06), c: 0x40403f }, { g: beam([0.6, 7.0, 0], [0, 6.4, 0], 0.06), c: 0x40403f });
  for (const x of [-0.85, -0.42, 0.42, 0.85]) P.push({ g: lathe([[0, 0], [0.06, 0], [0.085, 0.05], [0.06, 0.12], [0.03, 0.17], [0, 0.18]], 8).translate(x, 7.12, 0), c: 0x40403f });
  for (let i = 0; i < 6; i++) P.push({ g: new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4).rotateZ(Math.PI / 2).rotateY(i % 2 ? 0 : Math.PI / 2).translate(0, 2.2 + i * 0.6, 0), c: 0x40403f });
  return merge(P);
}

export const S13 = {
  id: 'S13', t0: 104.2, t1: 112.04, world: 'hot', pre: 9.1, post: 0,
  key: [0.15, 0.4, 0.9],
  fog: { color: PAL.velvet, near: 60, far: 260 },
  sky: { ...HOT_NIGHT },
  build(kit) {
    const s = { v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion() };
    const W = kit.words;
    [s.tCount, s.tDown, s.tTo, s.tZero] = W.times('count down to zero,', 104.34);
    s.tWhy = W.times('why', 108.1)[0];
    s.tGold = W.times('gold on the wire', 109.98);
    s.tTonight = W.times('tonight', 111.16)[0];
    s.prof = kit.travel(HARBOUR.prof);
    const dEnd = s.prof.d(112);
    const PZ = (s.PZ = -dEnd), DZ = PZ - HARBOUR.stopGap, BC = DZ - 0.66;
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    const Wd = (s.W = new THREE.Group()); root.add(Wd);
    const pierG = (s.pierG = new THREE.Group()); Wd.add(pierG);

    // the pier: a wide head around you and the booth, a walkway to the far shore; piles, bollards
    const P = [];
    for (let i = 0; i < 8; i++) P.push({ g: bbox(1.2, 0.24, 8.6, 0.04, -4.375 + i * 1.25, -0.12, PZ - 2.7), c: i % 2 ? 0x2a1214 : 0x341719 });
    for (let i = 0; i < 4; i++) P.push({ g: bbox(1.05, 0.24, 110, 0.04, -1.65 + i * 1.1, -0.12, PZ - 7 - 55), c: i % 2 ? 0x2a1214 : 0x341719 });
    for (const sx of [-1, 1]) P.push({ g: bbox(0.3, 0.45, 8.6, 0.05, sx * 5.0, -0.3, PZ - 2.7), c: 0x1a0a0c });
    for (const [x, z] of [[-4.8, PZ + 1.4], [4.8, PZ + 1.4], [-4.8, PZ - 6.8], [4.8, PZ - 6.8], [-4.8, PZ - 2.7], [4.8, PZ - 2.7]]) P.push({ g: new THREE.CylinderGeometry(0.28, 0.3, 1.6, 8).translate(x, WY + 0.6, z), c: 0x1a0a0c });
    for (let z = PZ - 11; z > PZ - 116; z -= 5) for (const sx of [-1, 1]) P.push({ g: new THREE.CylinderGeometry(0.22, 0.24, 1.5, 6).translate(sx * 2.1, WY + 0.55, z), c: 0x1a0a0c });
    const bol = lathe([[0, 0], [0.28, 0], [0.28, 0.06], [0.2, 0.12], [0.17, 0.42], [0.23, 0.52], [0.31, 0.58], [0.31, 0.66], [0.2, 0.72], [0, 0.74]], 12);
    for (const [x, z] of [[-4.3, PZ + 0.9], [4.3, PZ + 0.9], [-4.3, PZ - 6.2], [4.3, PZ - 6.2]]) P.push({ g: bol.clone().translate(x, 0, z), c: 0x141418 });
    const post = lathe([[0, 0], [0.2, 0], [0.2, 0.22], [0.11, 0.38], [0.075, 3.4], [0.12, 3.5], [0.12, 3.58], [0, 3.58]], 10);
    s.lampXZ = [[-4.3, PZ - 3.2], [4.3, PZ - 3.2]];
    for (const [x, z] of s.lampXZ) { P.push({ g: post.clone().translate(x, 0, z), c: 0x1c1c22 }); P.push({ g: lathe([[0, 0], [0.24, 0.02], [0.05, 0.12], [0, 0.12]], 10).translate(x, 4.18, z), c: 0x1c1c22 }); }
    // the wire path: phone -> roof -> left pole -> over your head -> right pole -> pole line -> the city
    const poles = [[-5.6, PZ], [5.6, PZ], [14, PZ - 9], [23, PZ - 20], [32, PZ - 31], [41, PZ - 42], [50, PZ - 53]];
    const top = WY + 7.25;
    const sup = [[0, 1.98, BC - 0.5], [0, 3.3, BC - 0.2]].concat(poles.map(([x, z]) => [x, top, z]), [[66, 14, PZ - 70]]);
    let wpts = [new THREE.Vector3(...sup[0])];
    for (let i = 1; i < sup.length; i++) wpts = wpts.concat(sagPts(sup[i - 1], sup[i], i <= 1 ? 0 : i === 3 ? 0.45 : 0.6, i <= 1 ? 2 : 10).slice(1));
    const curve = curveOf(wpts);
    const SEG = 360, RAD = 5;
    P.push({ g: new THREE.TubeGeometry(curve, SEG, 0.05, RAD, false), c: 0x0c0c0e });
    s.pier = new THREE.Mesh(merge(P), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: null }));
    pierG.add(s.pier);
    s.poles = inst(poleGeo(), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.gold, rimTh: 0.72 }), poles.length, 's13-poles');
    poles.forEach(([x, z], i) => {
      const nx = i + 1 < poles.length ? poles[i + 1][0] - x : 1, nz = i + 1 < poles.length ? poles[i + 1][1] - z : 0;
      setI(s.poles, i, x, WY, z, 0, i < 2 ? Math.PI / 2 : Math.atan2(nx, nz) + Math.PI / 2, 0);
    });
    pierG.add(s.poles);
    s.lampMat = kit.flat({ color: PAL.cream, fog: 0.3 });
    const glob = lathe([[0.06, 0], [0.2, 0.12], [0.23, 0.3], [0.16, 0.5], [0.06, 0.58], [0, 0.6]], 10);
    s.lamps = new THREE.Mesh(merge(s.lampXZ.map(([x, z]) => ({ g: glob.clone().translate(x, 3.58, z) }))), s.lampMat);
    pierG.add(s.lamps);

    // the gold wire glow and the spark
    const goldG = tubeU(new THREE.TubeGeometry(curve, SEG, 0.075, RAD, false), SEG, RAD);
    s.goldMat = wireMat(kit, PAL.gold, { fog: 0.2 });
    s.gold = new THREE.Mesh(goldG, s.goldMat); s.gold.frustumCulled = false;
    Wd.add(s.gold);
    const uOf = (p) => { let best = 0, bd = Infinity; const v = new THREE.Vector3(...p); for (let i = 0; i <= 800; i++) { const d = curve.getPointAt(i / 800).distanceToSquared(v); if (d < bd) { bd = d; best = i / 800; } } return best; };
    s.uRoof = uOf(sup[1]); s.uL = uOf(sup[2]); s.uR = uOf(sup[3]);
    s.keys = [[s.tGold[0], 0], [s.tGold[1], s.uRoof], [s.tGold[2], s.uL], [s.tGold[3], s.uR], [s.tTonight, 1]];
    s.curve = curve;
    const star = shapeOf(Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.09 : 0.42; return [Math.cos(a) * r, Math.sin(a) * r]; }));
    s.spark = new THREE.Mesh(new THREE.ShapeGeometry(star), kit.flat({ color: PAL.goldHi, additive: true, fog: 0, depthWrite: false }));
    Wd.add(s.spark);

    // the booth
    const booth = (s.booth = new THREE.Group());
    booth.position.set(0, 0, BC);
    Wd.add(booth);
    const bm = kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.gold, rimTh: 0.8 });
    booth.add(new THREE.Mesh(boothGeo(), bm));
    s.glassMat = kit.flat({ color: PAL.cream, fog: 0.2, side: THREE.DoubleSide });
    booth.add(new THREE.Mesh(glassGeo(), s.glassMat));
    const door = (s.door = new THREE.Group());
    door.position.set(0.61, 0.16, 0.7);
    const dg = merge([{ g: glazedFrame().translate(-0.61, 0, 0), c: CRIM }, { g: tube([[-1.05, 0.95, 0.06], [-1.09, 1.0, 0.09], [-1.09, 1.5, 0.09], [-1.05, 1.55, 0.06]], 0.018, 8, 5), c: PAL.brass }]);
    door.add(new THREE.Mesh(dg, bm));
    s.doorGlass = kit.flat({ color: PAL.creamDark, fog: 0.2, side: THREE.DoubleSide, bright: 0.55 });
    door.add(new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.92).translate(-0.61, 0.36 + 0.96, -0.01), s.doorGlass));
    booth.add(door);
    // the payphone on the back wall, at eye height
    const ph = (s.phone = new THREE.Group());
    ph.position.set(0, 1.58, -0.6);
    booth.add(ph);
    const cm = kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.goldHi, rimTh: 0.65 });
    ph.add(new THREE.Mesh(phoneGeo(), cm));
    s.wheel = new THREE.Mesh(wheelGeo(), cm);
    s.wheel.position.set(0, -0.03, 0.2);
    ph.add(s.wheel);
    s.handset = new THREE.Group();
    s.handset.position.set(-0.29, 0.12, 0.1);
    s.handset.add(new THREE.Mesh(handsetGeo(), cm));
    ph.add(s.handset);
    s.glove = new THREE.Group();
    s.glove.add(new THREE.Mesh(gloveGeo(), cm));
    s.glove.scale.setScalar(1.6);
    ph.add(s.glove);
    s.gloveFrom = new THREE.Vector3(0.75, 0.25, 1.5);

    const AT = { d: 6, az: -33 };
    kit.text('COUNT DOWN\nTO', { cap: 0.56, color: 'gold', near: 104.34, say: 'count down to', out: 106.7, vAlign: 'bottom', depthTest: false, at: { ...AT, y: 1.75 } });
    kit.text('ZERO,', { cap: 1.25, color: 'gold', near: 105.76, say: 'zero,', out: 106.7, vAlign: 'top', depthTest: false, at: { ...AT, y: 1.55 } });
    s.why = kit.text("DON'T ASK\nME WHY", { cap: 0.7, color: 'cream', near: 106.98, say: "don't ask me why", out: 109.5, depthTest: false, at: { ...AT, y: 1.6 } });
    s.why.redact(3, s.tWhy);
    kit.text('GOLD ON\nTHE WIRE', { cap: 0.75, color: 'gold', near: 109.98, say: 'gold on the wire', out: 111.05, depthTest: false, at: { ...AT, y: 1.6 } });
    kit.text('TONIGHT', { cap: 0.85, color: 'cream', near: 111.16, out: 111.7, depthTest: false, at: { ...AT, y: 1.6 } });
    for (const c of kit.group.children) if (c.isMesh && c.material && c.material.depthTest === false) c.renderOrder = 20;
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;
    // booth light: on with a flicker as you come out from under the deck, out when the call arrives
    const fl = t < 103.5 ? 0 : t < 103.9 ? (Math.sin(t * 97) > 0.2 ? 1 : 0.15) : 1;
    const boothOn = t < s.tTonight + 0.08 ? fl : 0;
    s.glassMat.uniforms.uColor.value.set(boothOn > 0.5 ? PAL.cream : 0x1a1210);
    s.glassMat.uniforms.uBright.value = boothOn > 0.5 ? 1.05 + 0.1 * kit.downEnv(t, 6) : 1;
    s.doorGlass.uniforms.uColor.value.set(boothOn > 0.5 ? 0x5a1a14 : 0x1a1210);
    // the door swings open on "Count"
    s.door.rotation.y = 120 * D2R * easeInOut(lin(s.tCount, s.tCount + 0.45, t));
    // the dial: wound on "down to zero" all the way to the stop, then runs back to rest
    const wind = easeInOut(lin(s.tDown, s.tZero, t));
    const back = lin(s.tZero + 0.05, s.tZero + 1.15, t);
    const alpha = t < s.tZero + 0.05 ? WIND0 * wind : WIND0 * (1 - back) - 0.02 * Math.sin(back * Math.PI * 9) * (back < 1 ? 1 : 0);
    s.wheel.rotation.z = -alpha;
    // the glove: in from the right of the door, finger in the 0, rides the hole round, lets go, leaves
    const inK = easeOut(lin(s.tCount + 0.1, s.tCount + 0.7, t));
    const outK = easeInOut(lin(s.tZero + 0.12, s.tZero + 0.7, t));
    const a = HOLE(10) - (t < s.tZero + 0.05 ? alpha : WIND0);
    s.v.set(Math.cos(a) * HOLE_R, Math.sin(a) * HOLE_R - 0.03, 0.2);
    s.w.copy(s.gloveFrom).lerp(s.v, inK * (1 - outK));
    s.glove.position.copy(s.w);
    s.glove.position.z += 0.02 + 0.05 * outK;
    s.glove.rotation.set(-0.35, 0.25, (a - HOLE(10)) * 0.55 + 0.4, 'XYZ');
    s.glove.visible = t > s.tCount + 0.1 && outK < 0.999 && t < 111.96;
    // handset swings on its cord
    s.handset.rotation.set(0.05 * Math.sin(t * 1.3), 0, 0.14 * Math.sin(t * 1.75));
    // the call: a spark along the wire, the glow grows behind it
    let u = 0;
    for (let i = 0; i < s.keys.length - 1; i++) { const [ta, ua] = s.keys[i], [tb, ub] = s.keys[i + 1]; if (t >= ta) u = t >= tb ? ub : lerp(ua, ub, (t - ta) / (tb - ta)); }
    const live = t >= s.keys[0][0];
    s.goldMat.uniforms.uK1.value = live ? u : 0;
    s.goldMat.uniforms.uK0.value = 0;
    s.spark.visible = live && t < s.tTonight + 0.05;
    if (s.spark.visible) { s.curve.getPointAt(Math.min(1, u), s.spark.position); s.v.set(0, 1.6, 0.05); s.spark.lookAt(s.v); s.spark.rotation.z = t * 9; s.spark.scale.setScalar(1 + 0.4 * Math.sin(t * 40)); }
    // LIGHTS OUT, wire last
    if (t >= 111.86) { s.pierG.visible = false; } else s.pierG.visible = true;
    s.booth.visible = t < 111.96;
    if (t >= 111.96) { s.goldMat.uniforms.uK0.value = s.uL; s.goldMat.uniforms.uK1.value = 1; } // only the wire stays: over your head, then the pole line to the city
    s.goldMat.uniforms.uBright.value = 1 + 0.6 * env(t, s.tGold[0], 3) + (t > 111.96 ? 0.3 : 0);
    s.lampMat.uniforms.uBright.value = 0.9;
    if (kit.isOwner) kit.setSky({ ...HOT_NIGHT, hor: t >= 111.76 ? PAL.black : HOT_NIGHT.hor, hor2: t >= 111.76 ? PAL.black : HOT_NIGHT.hor2 });
  },
  events() {
    return [
      { t: 104.2, sfx: 'switch', gain: 0.35 },
      { t: 104.36, sfx: 'lidOpen', gain: 0.4 },
      { t: 105.8, sfx: 'tick', gain: 0.5 },
      { t: 108.1, sfx: 'shutter', gain: 0.4 },
      { t: 109.98, sfx: 'dtmf', gain: 0.4, haptic: [0.3, 50] },
      { t: 111.76, sfx: 'switch', gain: 0.5 },
    ];
  },
};
