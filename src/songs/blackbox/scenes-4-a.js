// Group 4, part A (round 3, STORYBOARD-v3): S14 the tape destroys itself, S15 the cameras go dark.
// Shapes come from shapes-4.js (bevelled extrusions, lathes, NAB reels, CRT monitors). Word times come
// from words.json through sung() (scenes-4-util.js), which applies the storyboard's bridge corrections.
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, EYE, inst, setM, setMQ, initColors, setC, mixC, lin, envAt, clamp01, sung } from './scenes-4-util.js';
import {
  xf, merge, extrude, lathe, tube, roundRect, roundRectHole, reelFlange, reelHub, monitorGeos, MON,
  picVault, picChess, picBooth, picCorridor, picRoom, herFront, herProfile, flameGeo, cloudGeo,
} from './shapes-4.js';

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
const C_WHITE = new THREE.Color(PAL.white), C_AMBER = new THREE.Color(PAL.amber);

// =================================================================================================
// S14 The tape destroys itself (112.04 to 119.70, cold)
// SHOT: hero = a giant reel-to-reel tape machine whose front folds around you: the centre panel ahead
// (head block with the tape running across it, two VU meters, three warning lamps, piano-key
// transport), the two 6 m reels on wings at your left and right (about 50 deg out, turning 3 deg/s).
// Palette: black, petrol steel, cyan bevels, cream meters, rust lamps and flames, brass tape.
// Motion: the lamps go out on "three, two, one", smoke puffs from the head; on "you" the tape catches
// fire at the head and the flames race both ways to the reels; "never" it snaps and falls; "here" the
// reels break loose and drift away. Out: SMOKE WIPE (petrol puffs close from both sides, part on S15).
// Lyric: one block at a time, low centre (d 5) over the transport keys.
const PZ = -6.5;                       // centre panel front face
const PW = 7.2, PH = 10.2, PY0 = -2.6, PYC = PY0 + PH / 2;
const WW = 7.4, WANG = 45 * D2R;       // wing panels, folded 45 deg toward you
const RR = 3.1;                        // reel radius (real 26.5 cm reel at x23)
const PACK = [0.8, 0.42];              // feed / take-up pack radius (x RR)
const TAPE_Y = 4.3, ROLL_X = 3.0, ROLL_R = 0.42, TZ = PZ + 0.62, REEL_Y = 3.4;
const LAMP_X = [0, 0, 0], LAMP_YS = [3.05, 2.2, 1.35]; // lamp "3" (top), "2", "1": a column between the meters
const MX = 2.1, MY = 2.2;              // VU meters
const VB = 11;                         // burn speed along the tape (m/s)
const SMOKE_IN = [118.95, 119.4], SMOKE_OUT = [119.48, 119.93]; // closed 119.36-119.5: the worlds swap behind it

function wingMatrix(side) {
  const hx = side * (PW / 2 + 0.05);
  const c = new THREE.Vector3(hx + side * Math.cos(WANG) * (WW / 2), PYC, PZ + Math.sin(WANG) * (WW / 2));
  return new THREE.Matrix4().compose(c, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -side * WANG, 0)), new THREE.Vector3(1, 1, 1));
}

export const S14 = {
  id: 'S14', t0: 112.04, t1: 119.70, world: 'cold', pre: 0, post: 0.25,
  key: [0.3, 0.9, 0.3],
  fog: { color: 0x000000, near: 14, far: 60 },
  sky: { stars: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, nadir: PAL.black, rays: 0, rings: 0 },
  build(kit) {
    const s = { mats: [] };
    [s.t3, s.t2, s.t1] = sung(kit, 'three two one', 114.29);
    [s.tYou, s.tWere, s.tNever, s.tHere] = sung(kit, 'you were never here', 117.74);
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    const M = (s.machine = new THREE.Group());
    W.add(M);
    s.prof = kit.travel([[112.04, 0.25, 0.01]]);
    const tn = (o) => { const m = kit.toon(o); s.mats.push(m); return m; };
    const fl = (o) => { const m = kit.flat(o); s.mats.push(m); return m; };
    const R = kit.rnd(1407);

    M.add(new THREE.Mesh(new THREE.PlaneGeometry(70, 70).rotateX(-Math.PI / 2).translate(0, PY0, -4), kit.flat({ color: PAL.black, fog: 0 })));

    // ---- the faceplate: centre panel + two folded wings, corner screws ----
    const WM = [wingMatrix(-1), wingMatrix(1)];
    const screw = merge([lathe([[0.2, 0], [0.2, 0.04], [0.15, 0.09], [0, 0.11]], 10, 'z'), xf(new THREE.BoxGeometry(0.28, 0.05, 0.04), 0, 0, 0.1)]);
    const screwsAt = (w, h, mtx) => [-1, 1].flatMap((sx) => [-1, 1].map((sy) => xf(screw.clone(), sx * (w / 2 - 0.45), sy * (h / 2 - 0.45), 0.02).applyMatrix4(mtx)));
    const cM = new THREE.Matrix4().makeTranslation(0, PYC, PZ);
    const pan = [extrude(roundRect(PW, PH, 0.6), 0.3, 0.12, 6).applyMatrix4(cM), ...WM.map((m) => extrude(roundRect(WW, PH, 0.6), 0.3, 0.12, 6).applyMatrix4(m))];
    const panMat = tn({ ramp: [PAL.black, 0x03141a, PAL.petrolDeep], rim: PAL.cyan, rimAmt: 0.35, th: [-0.15, 0.7] });
    M.add(new THREE.Mesh(merge(pan), panMat));
    M.add(new THREE.Mesh(merge([...screwsAt(WW, PH, WM[0]), ...screwsAt(WW, PH, WM[1])]), tn({ ramp: 'steel', rim: null })));

    // ---- the reels: two flanges with three windows, the wound tape pack, the hub with key slots ----
    const flg = reelFlange(RR);
    const flanges = merge([flg.clone().translate(0, 0, 0.38), flg.clone().translate(0, 0, -0.2)]);
    const hubG = reelHub(RR, 0.72).translate(0, 0, 0.46);
    const spindle = lathe([[0.3, -0.85], [0.3, -0.36], [0, -0.36]], 12, 'z');
    const flMat = tn({ ramp: [PAL.petrol, PAL.creamDark, PAL.cream], rim: PAL.cyan, rimAmt: 0.45, th: [-0.1, 0.55] }); // Round 4: aluminium-cream NAB reels read at a glance (petrol ones were blobs)
    const packMat = tn({ ramp: [PAL.black, PAL.brassDark, PAL.brass], rim: null });
    const hubMat = tn({ ramp: 'steel', rim: PAL.cyan, rimAmt: 0.5 });
    s.reels = [];
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;
      const g = new THREE.Group();
      new THREE.Matrix4().multiplyMatrices(WM[k], new THREE.Matrix4().makeTranslation(-side * 0.8, REEL_Y - PYC, 0.8)).decompose(g.position, g.quaternion, g.scale);
      M.add(g);
      g.add(new THREE.Mesh(spindle, hubMat));
      const spin = new THREE.Group();
      g.add(spin);
      spin.add(new THREE.Mesh(flanges, flMat));
      spin.add(new THREE.Mesh(new THREE.CylinderGeometry(PACK[k] * RR, PACK[k] * RR, 0.4, 48).rotateX(Math.PI / 2), packMat));
      spin.add(new THREE.Mesh(hubG, hubMat));
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
      s.reels.push({ g, spin, base: g.position.clone(), out: new THREE.Vector3(-n.x + side * 0.35, 0.05, -n.z).normalize(), top: g.position.clone().add(new THREE.Vector3(0, PACK[k] * RR, 0)) });
    }

    // ---- head block, rollers, capstan, meter bezels, lamp bezels (one steel mesh) ----
    const roller = lathe([[0.42, 0], [0.42, 0.06], [0.35, 0.09], [0.35, 0.31], [0.42, 0.34], [0.42, 0.4], [0.12, 0.43], [0, 0.43]], 16, 'z');
    const bez = roundRect(2.3, 1.75, 0.26); bez.holes.push(roundRectHole(1.98, 1.42, 0.17));
    const lampBez = lathe([[0.42, 0], [0.42, 0.08], [0.36, 0.17], [0.3, 0.17], [0.29, 0.05]], 14, 'z');
    const steel = [
      xf(extrude(roundRect(4.6, 2.3, 0.35), 0.12, 0.05, 5), 0, TAPE_Y + 0.25, PZ + 0.22),        // mounting plate
      xf(extrude(roundRect(2.7, 1.5, 0.32), 0.36, 0.07, 5), 0, TAPE_Y + 0.38, PZ + 0.52),        // head cover
      xf(extrude(roundRect(0.5, 0.22, 0.06), 0.36, 0.04, 3), -0.62, TAPE_Y - 0.22, PZ + 0.6),    // head shields
      xf(extrude(roundRect(0.5, 0.22, 0.06), 0.36, 0.04, 3), 0.62, TAPE_Y - 0.22, PZ + 0.6),
      xf(roller.clone(), -ROLL_X, TAPE_Y - ROLL_R, PZ + 0.4), xf(roller.clone(), ROLL_X, TAPE_Y - ROLL_R, PZ + 0.4),
      xf(lathe([[0.09, -0.6], [0.09, 0.45], [0.14, 0.5], [0, 0.56]], 10), 1.85, TAPE_Y, PZ + 0.5),  // capstan
      xf(new THREE.BoxGeometry(0.2, 0.2, 0.75), 1.85, TAPE_Y + 0.42, PZ + 0.72),               // pinch-roller arm
      xf(extrude(bez, 0.18, 0.06, 5), -MX, MY, PZ + 0.3), xf(extrude(bez, 0.18, 0.06, 5), MX, MY, PZ + 0.3),
      ...LAMP_X.map((x, i) => xf(lampBez.clone(), x, LAMP_YS[i], PZ)),
    ];
    M.add(new THREE.Mesh(merge(steel), tn({ ramp: 'cold', rim: PAL.cyan, rimAmt: 0.6, th: [-0.1, 0.5] })));
    M.add(new THREE.Mesh(xf(lathe([[0, -0.33], [0.3, -0.33], [0.35, -0.28], [0.35, 0.28], [0.3, 0.33], [0, 0.33]], 14), 1.85, TAPE_Y, PZ + 1.08), tn({ ramp: [PAL.black, PAL.black, PAL.velvet], rim: PAL.cyan, rimAmt: 0.8 })));

    // ---- VU meters: cream faces, chunky scale marks, red zone, black needles ----
    const face = new THREE.ShapeGeometry(roundRect(1.98, 1.42, 0.17), 5);
    M.add(new THREE.Mesh(merge([-MX, MX].map((x) => face.clone().translate(x, MY, PZ + 0.03))), fl({ color: PAL.cream, fog: 0.4 })));
    const marks = [], zones = [];
    for (const x of [-MX, MX]) {
      const px = x, py = MY - 0.6;
      for (let k = 0; k < 7; k++) {
        const a = (-50 + (k * 100) / 6) * D2R;
        marks.push(xf(new THREE.PlaneGeometry(0.075, k === 4 ? 0.26 : 0.18), px + Math.sin(a) * 1.0, py + Math.cos(a) * 1.0, PZ + 0.045, 0, 0, -a));
      }
      marks.push(xf(new THREE.CircleGeometry(0.11, 14), px, py + 0.02, PZ + 0.05));
      zones.push(xf(new THREE.RingGeometry(0.9, 1.0, 10, 1, 40 * D2R, 32 * D2R), px, py, PZ + 0.04));
    }
    M.add(new THREE.Mesh(merge(marks), fl({ color: PAL.black, fog: 0.4 })));
    M.add(new THREE.Mesh(merge(zones), fl({ color: PAL.crimson, fog: 0.4 })));
    s.needles = inst(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.04, -0.05), new THREE.Vector2(0.04, -0.05), new THREE.Vector2(0.012, 1.08), new THREE.Vector2(-0.012, 1.08)])), kit.flat({ color: PAL.black, fog: 0.4 }), 2, 's14-needles');
    M.add(s.needles);

    // ---- three warning lamps (faceted rust jewels with an orange halo) ----
    s.jewels = initColors(inst(lathe([[0.29, 0], [0.29, 0.07], [0.24, 0.2], [0.14, 0.3], [0, 0.33]], 8, 'z'), tn({ ramp: [PAL.rust, PAL.orange, PAL.amber], rim: null, th: [-0.3, 0.4] }), 3, 's14-jewels'), 3);
    s.halos = inst(new THREE.CircleGeometry(0.5, 20), kit.flat({ color: PAL.orange, fog: 0.4 }), 3, 's14-halos');
    LAMP_X.forEach((x, i) => setM(s.jewels, i, x, LAMP_YS[i], PZ + 0.07));
    M.add(s.jewels, s.halos);

    // ---- piano-key transport (rewind, play, ffwd, stop, record) ----
    const keys = initColors(inst(extrude(roundRect(1.0, 0.62, 0.13), 0.42, 0.06, 4), tn({ ramp: 'cream', rim: PAL.cyan, rimAmt: 0.4 }), 5, 's14-keys'), 5);
    for (let i = 0; i < 5; i++) { setM(keys, i, -2.44 + i * 1.22, PY0 + 0.75, PZ + 0.5 + (i === 1 ? -0.12 : 0)); if (i === 4) setC(keys, i, 0xff5a40, 0.75); }
    M.add(keys);

    // ---- the tape: brass ribbon pack -> roller -> across the head -> roller -> take-up pack ----
    const path = [s.reels[0].top, new THREE.Vector3(-ROLL_X, TAPE_Y, TZ), new THREE.Vector3(ROLL_X, TAPE_Y, TZ), s.reels[1].top];
    s.seg = [];
    let arc = 0;
    const segs = [];
    for (let k = 0; k < 3; k++) {
      const a = path[k], b = path[k + 1], L = a.distanceTo(b), n = Math.max(2, Math.round(L / 0.25));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), _v.subVectors(b, a).normalize());
      for (let i = 0; i < n; i++) segs.push({ p: a.clone().lerp(b, (i + 0.5) / n), q: q.clone(), len: (L / n) * 1.04, s: arc + ((i + 0.5) * L) / n });
      arc += L;
    }
    const sHead = path[0].distanceTo(path[1]) + ROLL_X;
    for (const g of segs) { g.dist = Math.abs(g.s - sHead); g.delay = R() * 0.08; g.spin = (R() - 0.5) * 3; }
    s.seg = segs;
    s.tape = initColors(inst(new THREE.BoxGeometry(1, 0.34, 0.1), kit.flat({ color: PAL.white, fog: 0.3 }), segs.length, 's14-tape'), segs.length, PAL.brass);
    M.add(s.tape);
    // flat cel flames riding the tape (outer orange, inner amber), every other segment
    s.NF = Math.ceil(segs.length / 2);
    s.flA = inst(flameGeo(0.75, 1.3), kit.flat({ color: PAL.orange, fog: 0.3, side: THREE.DoubleSide }), s.NF, 's14-flames');
    s.flB = inst(flameGeo(0.42, 0.7), kit.flat({ color: PAL.amber, fog: 0.3, side: THREE.DoubleSide }), s.NF, 's14-flames-core');
    M.add(s.flA, s.flB);

    // ---- behind you: dark racks of other machines (big silhouettes, each with two small reels) ----
    const rk = [], minis = [];
    const mini = reelFlange(0.95);
    for (const x of [-5.4, 0, 5.4]) {
      rk.push(xf(extrude(roundRect(3.7, 9.4, 0.35), 1.0, 0.1, 5), x, PY0 + 4.7, 7.6, 0, Math.PI, 0));
      for (const dx of [-0.95, 0.95]) minis.push(xf(mini.clone(), x + dx, PY0 + 6.9, 7.35, 0, Math.PI, 0));
    }
    M.add(new THREE.Mesh(merge(rk), tn({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.teal, rimAmt: 0.7 })));
    M.add(new THREE.Mesh(merge(minis), tn({ ramp: [PAL.petrolDeep, PAL.petrol, PAL.teal], rim: PAL.cyan, rimAmt: 0.5, key: [0.2, 0.6, -0.77] })));

    // ---- smoke from the head on "three" and "two" (the scene's one particle accent) ----
    W.add(kit.particles({
      n: 12, shape: 'disc', billboard: true, seed: 1414, init: (i, r) => {
        const big = i >= 4, t0 = (big ? s.t2 : s.t3) + r() * 0.12;
        return { p: [(r() - 0.5) * 1.2, TAPE_Y + 1.0, PZ + 0.8], v: [(r() - 0.5) * 1.6, 0.9 + r() * 0.8, 0.3 + r() * 0.4], g: [0, 0.25, 0], t0, life: 1.5, s: (big ? 1.1 : 0.7) + r() * 0.5, c: r() < 0.5 ? PAL.teal : PAL.petrol };
      },
    }));

    // ---- SMOKE WIPE: two flat petrol clouds roll in from the sides (3.4 m out) and part on S15 ----
    const back = [[0, 0, 3.3], [0, 3.4, 3.0], [0, -3.4, 3.0], [-1.9, 1.8, 2.4], [1.9, 1.6, 2.3], [-1.6, -2.3, 2.4], [1.8, -2.6, 2.2], [0.6, 5.6, 2.0], [-0.8, -5.4, 2.2], [2.9, 0.2, 1.9], [-2.9, -0.2, 1.9]];
    const front = [[0.7, 1.2, 1.6], [-1.0, -0.9, 1.7], [1.6, -1.7, 1.4], [-0.5, 3.2, 1.4], [0.9, -3.7, 1.3], [2.3, 2.5, 1.2], [-2.2, 1.1, 1.2]];
    const cb = cloudGeo(back), cf = cloudGeo(front).translate(0, 0, 0.06);
    const smBack = kit.flat({ color: PAL.black, fog: 0 }), smFront = kit.flat({ color: 0x03141a, fog: 0 }); // Round 4: dark smoke (teal puffs read as smudges)
    s.clouds = [-1, 1].map((sd) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(cb, smBack), new THREE.Mesh(cf, smFront));
      g.scale.set(sd, 1, 1);
      g.visible = false;
      kit.group.add(g);
      return g;
    });

    // ---- lyric type: one block at a time, low centre ----
    const LOW = { d: 5, az: 0, y: 0.3 };
    const num = (ch, a, b) => kit.text(ch, { cap: 1.6, color: 'gold', times: [a], pop: true, dur: 0.1, out: b, outDur: 0.1, depthTest: false, at: LOW });
    num('3', s.t3, s.t2 - 0.14); num('2', s.t2, s.t1 - 0.14); num('1', s.t1, s.tYou - 0.14);
    kit.text('YOU WERE\nNEVER HERE', { cap: 0.82, color: 'cream', times: [s.tYou, s.tWere, s.tNever, s.tHere], out: 119.42, outDur: 0.15, depthTest: false, at: { d: 5, az: 0, y: 0.0 } });
    return s;
  },
  update(t, s, kit) {
    s.world.position.z = s.prof.d(Math.min(t, 119.4));
    const showM = t < 119.4;
    s.machine.visible = showM;
    // smoke wipe
    const kIn = kit.ease.out(lin(SMOKE_IN[0], SMOKE_IN[1], t)), kOut = kit.ease.in(lin(SMOKE_OUT[0], SMOKE_OUT[1], t));
    const k = kIn * (1 - kOut);
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, g = s.clouds[i];
      g.visible = k > 0.001;
      const g1 = 0.5 + 0.5 * k; // the puffs billow up as they roll in (less sideways speed)
      g.position.set(sd * (10.2 - 7.0 * k), 1.4 + 0.6 * (1 - k), -3.4);
      g.scale.set(sd * g1, g1, 1);
      g.rotation.z = -sd * (t - 119) * 0.5;
    }
    if (!showM) return;

    const wake = kit.sm(112.18, 112.62, t);
    if (!s.rim0) s.rim0 = s.mats.map((m) => (m.uniforms.uRimAmt ? m.uniforms.uRimAmt.value : 0));
    s.mats.forEach((m, i) => { m.uniforms.uBright.value = 0.05 + 0.95 * wake; if (m.uniforms.uRimAmt) m.uniforms.uRimAmt.value = s.rim0[i] * wake; });
    // reels: 3 deg/s while the tape runs; after "here" they break loose and drift outward, away from you
    for (let i = 0; i < 2; i++) {
      const Rl = s.reels[i], side = i ? 1 : -1, a = t - s.tHere;
      const fly = kit.sm(s.tHere, s.tHere + 0.6, t);   // 3 m outward and away, at the sides
      Rl.g.position.copy(Rl.base).addScaledVector(Rl.out, 3 * fly);
      Rl.spin.rotation.z = -(t - 112.04) * 0.05 - (a > 0 ? 0.9 * a * a : 0) * side;
    }
    // VU needles bounce on the beats until "here", then drop to the stop
    for (let i = 0; i < 2; i++) {
      const nv = (tt) => (tt < 112.3 ? 0 : Math.min(1, 0.3 + 0.62 * kit.beatEnv(tt, 4.5) * (0.75 + 0.25 * Math.sin(tt * 5.3 + i * 2.1)) + 0.1 * Math.sin(tt * 9.1 + i)));
      const v = t < s.tHere ? nv(t) : nv(s.tHere) * (1 - kit.ease.out(lin(s.tHere, s.tHere + 0.35, t)));
      const ang = -0.87 + 1.6 * v;
      setM(s.needles, i, (i ? 1 : -1) * MX, MY - 0.6, PZ + 0.06, 1, 1, 1, 0, 0, -ang);
    }
    s.needles.instanceMatrix.needsUpdate = true;
    // warning lamps: lit, then out one per number (a white pop as each goes)
    const tOff = [s.t3, s.t2, s.t1];
    for (let i = 0; i < 3; i++) {
      const lit = t >= 112.45 && t < tOff[i];
      if (lit) setC(s.jewels, i, 0xffffff); else if (t >= tOff[i]) mixC(s.jewels, i, 0x1c1c1c, 0xffffff, envAt(t, tOff[i], 9) * 0.8); else setC(s.jewels, i, 0x1c1c1c);
      const h = lit ? 1 + 0.06 * kit.beatEnv(t, 6) : 0.0001;
      setM(s.halos, i, LAMP_X[i], LAMP_YS[i], PZ + 0.025, h, h, 1);
    }
    s.jewels.instanceColor.needsUpdate = true; s.halos.instanceMatrix.needsUpdate = true;

    // tape: runs 1 m/s (moving splice marks), glows at the head on "one", burns from "you", snaps on "never"
    const glow0 = 1 - lin(112.3, 112.8, t);
    for (let i = 0; i < s.seg.length; i++) {
      const g = s.seg[i], tIg = s.tYou + g.dist / VB;
      const stripe = ((((g.s - (t - 112.04)) % 1.6) + 1.6) % 1.6) < 0.22;
      if (t >= tIg) mixC(s.tape, i, PAL.orange, 0x140a06, lin(tIg + 0.05, tIg + 0.4, t));
      else if (t >= s.t1) mixC(s.tape, i, stripe ? PAL.brassDark : PAL.brass, PAL.orange, clamp01(1 - g.dist / 1.5) * lin(s.t1, s.t1 + 0.5, t));
      else if (glow0 > 0) mixC(s.tape, i, PAL.brass, PAL.goldHi, glow0);
      else setC(s.tape, i, stripe ? PAL.brassDark : PAL.brass);
      _p.copy(g.p);
      let sc = g.len;
      _q.copy(g.q);
      const a = t - s.tNever - g.delay;
      if (a > 0) { _p.y -= 5.5 * a * a; _p.x *= 1 + 0.1 * a; _e.set(0, 0, g.spin * a); _q.multiply(_q2.setFromEuler(_e)); if (a > 1.0) sc = 0; }
      setMQ(s.tape, i, _p, _q, sc, 1, 1);
    }
    s.tape.instanceMatrix.needsUpdate = true; s.tape.instanceColor.needsUpdate = true;
    // flames (pure in t): rise in 0.09 s, burn 0.3 s, die by 0.6 s after the front passes
    for (let j = 0; j < s.NF; j++) {
      const g = s.seg[Math.min(s.seg.length - 1, j * 2 + 1)], a = t - (s.tYou + g.dist / VB);
      let h = 0;
      if (a > 0 && a < 0.6) h = kit.ease.out(clamp01(a / 0.09)) * (1 - kit.sm(0.3, 0.6, a)) * (0.8 + 0.2 * Math.sin(t * 27 + j * 1.9));
      if (h < 0.01) { setM(s.flA, j, 0, -50, 0, 0, 0, 0); setM(s.flB, j, 0, -50, 0, 0, 0, 0); continue; }
      const ry = Math.atan2(EYE.x - g.p.x, EYE.z - g.p.z - s.world.position.z);
      setM(s.flA, j, g.p.x, g.p.y + 0.12, g.p.z, 0.8 + 0.2 * h, h, 1, 0, ry, 0);
      setM(s.flB, j, g.p.x + Math.sin(ry) * 0.04, g.p.y + 0.12, g.p.z + Math.cos(ry) * 0.04, 0.8 + 0.2 * h, h, 1, 0, ry, 0);
    }
    s.flA.instanceMatrix.needsUpdate = true; s.flB.instanceMatrix.needsUpdate = true;
  },
  events() {
    return [
      { t: 114.29, sfx: 'switch', gain: 0.55, haptic: [0.3, 40] }, // = corrected word times (sung())
      { t: 116.56, sfx: 'switch', gain: 0.6, haptic: [0.35, 50] },
      { t: 117.74, sfx: 'crack', gain: 0.5, haptic: [0.4, 90] },
      { t: SMOKE_IN[0], sfx: 'whoosh', gain: 0.5 },
    ];
  },
};

// =================================================================================================
// S15 The cameras go dark (119.70 to 127.62, cold)
// SHOT: hero = a curved wall of 21 old CRT security monitors (3 rows x 7, R 7 m, -72..+72 deg), each a
// deep bevelled case with a tapered tube housing and knobs, screens glowing cyan with camera pictures
// (vault door, chessboard, phone booth, mirror corridor). The big centre monitor shows her standing in
// an empty room. Supports: black rack uprights and shelves, cable looms rising into the dark overhead.
// Motion: one row goes black per number (picture -> line -> black, left to right); "you" she turns to
// the camera, "were never here" she fades out of the picture; "lights" the centre tube collapses to a
// line, then to a dot at 14 deg straight ahead, which S16's sun bursts from (match cut).
// Lyric: one block at a time, low centre (d 5) below the bottom row.
const ROW_Y = [0.8, 3.0, 5.2];             // bottom, middle, top
const MR = 7.0, MSTEP = 24 * D2R, CR = 6.3, CS = 1.5;
const EL_DOT = 14 * D2R, DOT_D = 6.2;

export const S15 = {
  id: 'S15', t0: 119.70, t1: 127.62, world: 'cold', pre: 0.32, post: 0,
  key: [0.25, 0.75, 0.6],
  fog: { color: 0x000000, near: 18, far: 60 },
  sky: 'black',
  build(kit) {
    const s = { mats: [] };
    s.R3 = sung(kit, 'three two one', 119.95);
    s.Y = sung(kit, 'you were never here', 123.15);
    s.L = sung(kit, 'lights out', 125.7);
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    const tn = (o) => { const m = kit.toon(o); s.mats.push(m); return m; };
    const R = kit.rnd(1515);
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2).translate(0, -0.45, 0), kit.flat({ color: PAL.black, fog: 0 })));

    const G = monitorGeos();
    s.mons = [];
    const rowOff = [s.R3[2], s.R3[1], s.R3[0]]; // bottom goes on "one", middle on "two", top on "three"
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
      const centre = r === 1 && c === 3;
      const az = (c - 3) * MSTEP, d = centre ? CR : MR, y = ROW_Y[r], sc = centre ? CS : 1;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.atan2(y - EYE.y, d) * 0.85, -az, 0, 'YXZ'));
      const pos = new THREE.Vector3(EYE.x + Math.sin(az) * d, y, EYE.z - Math.cos(az) * d);
      const m = new THREE.Matrix4().compose(pos, q, new THREE.Vector3(sc, sc, sc));
      const local = (x, yy, z) => new THREE.Vector3(x, yy, z).applyMatrix4(m);
      s.mons.push({
        m, q, sc, centre, r, c, pos,
        tOff: centre ? s.L[0] : rowOff[r] + c * 0.05,
        lp: local(0, MON.scy, 0.02), pp: local(0, MON.scy, 0.034),
        base: new THREE.Color(PAL.teal).lerp(new THREE.Color(PAL.cyan), centre ? 0.85 : 0.3 + 0.45 * R()),
        type: centre ? -1 : (c + r * 2) % 4, flip: (c + r) & 1 ? -1 : 1,
      });
    }
    const N = s.mons.length;
    s.cases = inst(G.caseGeo, tn({ ramp: [PAL.black, PAL.petrol, PAL.teal], rim: PAL.cyan, rimAmt: 0.95, th: [0.05, 0.72] }), N, 's15-cases') // Round 4: lit cases, so every feed has a clear frame;
    s.recess = inst(G.recess, kit.flat({ color: 0x010405, fog: 0.2 }), N, 's15-glass');
    s.mons.forEach((M, i) => { s.cases.setMatrixAt(i, M.m); s.recess.setMatrixAt(i, M.m); });
    s.light = initColors(inst(G.light, kit.flat({ color: PAL.white, fog: 0.15 }), N, 's15-screens'), N);
    root.add(s.cases, s.recess, s.light);
    // camera pictures (dark shapes on the lit screens), one instanced mesh per picture
    const picGeos = [picVault(), picChess(), picBooth(), picCorridor()];
    s.pics = picGeos.map((g, k) => {
      const list = s.mons.filter((M) => M.type === k);
      const mesh = inst(g, kit.flat({ color: PAL.petrolDeep, fog: 0.15 }), list.length, 's15-pic' + k);
      root.add(mesh);
      return { mesh, list };
    });
    // rack: uprights between the columns, a shelf under every monitor, cable looms into the dark
    const rack = [];
    for (let c = 0; c < 8; c++) {
      const az = (c - 3.5) * MSTEP;
      rack.push(xf(extrude(roundRect(0.38, 7.6, 0.08), 0.5, 0.05, 4), Math.sin(az) * (MR + 0.9), 3.35, EYE.z - Math.cos(az) * (MR + 0.9), 0, -az, 0));
    }
    for (const M of s.mons) rack.push(xf(extrude(roundRect(2.9, 0.16, 0.05), 2.3, 0.03, 3), 0, -1.2, 0.12).applyMatrix4(M.m));
    root.add(new THREE.Mesh(merge(rack), tn({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.teal, rimAmt: 0.6 })));
    const looms = [];
    for (const M of s.mons) {
      if (M.r !== 2) continue;
      const a = new THREE.Vector3(0, 0.7, -1.9).applyMatrix4(M.m);
      looms.push(tube([a, new THREE.Vector3(a.x * 0.9, a.y + 2.6, a.z * 0.9 - 0.4), new THREE.Vector3(a.x * 0.55, 10.5, a.z * 0.55 - 1.0), new THREE.Vector3(a.x * 0.2, 15, a.z * 0.2 - 1.5)], 0.2, 14, 6));
    }
    root.add(new THREE.Mesh(merge(looms), tn({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.petrol, rimAmt: 0.8 })));

    // the centre camera: her in an empty room (profile, then she turns to the camera and fades)
    const C = s.mons.find((M) => M.centre);
    s.ci = s.mons.indexOf(C);
    const cg = (s.cg = new THREE.Group());
    C.m.decompose(cg.position, cg.quaternion, cg.scale);
    root.add(cg);
    s.room = new THREE.Mesh(picRoom().translate(0, MON.scy, 0.034), kit.flat({ color: PAL.petrolDeep, fog: 0.15 }));
    cg.add(s.room);
    const herM = (geo) => { const h = initColors(inst(geo, kit.flat({ color: PAL.white, fog: 0.15 }), 1), 1, PAL.black); setM(h, 0, 0.1, MON.scy - 0.56, 0.04, 1.05, 1.05, 1); cg.add(h); return h; };
    s.herP = herM(herProfile());
    s.herF = herM(herFront());
    const gl = merge([-1, 1].map((sd) => new THREE.CircleGeometry(0.03, 12).translate(sd * 0.036, 0.925, 0)));
    s.glasses = herM(gl);
    setM(s.glasses, 0, 0.1, MON.scy - 0.56, 0.045, 1.05, 1.05, 1);
    // the last dot (S16's sun bursts from it)
    s.dot = new THREE.Mesh(new THREE.CircleGeometry(1, 28), kit.flat({ color: PAL.white, fog: 0 }));
    s.dot.position.set(EYE.x, EYE.y + Math.sin(EL_DOT) * DOT_D, EYE.z - Math.cos(EL_DOT) * DOT_D);
    s.dot.lookAt(EYE);
    s.dotMat = s.dot.material;
    root.add(s.dot);

    // ---- lyric type: low centre under the bottom row ----
    const LOW = { d: 5, az: 0, y: -0.55 };
    const num = (ch, a, b) => kit.text(ch, { cap: 1.5, color: 'gold', times: [a], pop: true, dur: 0.1, out: b, outDur: 0.1, depthTest: false, at: LOW });
    num('3', s.R3[0], s.R3[1] - 0.14); num('2', s.R3[1], s.R3[2] - 0.14); num('1', s.R3[2], s.Y[0] - 0.14);
    kit.text('YOU WERE\nNEVER HERE', { cap: 0.8, color: 'cream', times: s.Y, out: s.L[0] - 0.3, outDur: 0.2, depthTest: false, at: LOW });
    kit.text('LIGHTS OUT', { cap: 1.1, color: 'gold', times: s.L, out: 127.3, outDur: 0.15, depthTest: false, at: LOW });
    return s;
  },
  update(t, s, kit) {
    s.root.visible = t >= 119.4;
    if (!s.root.visible) return;
    const dim = 1 - 0.72 * kit.sm(s.L[0], s.L[0] + 0.7, t);
    for (const m of s.mats) m.uniforms.uBright.value = dim;
    // screens: picture -> white line -> black, per monitor
    for (let i = 0; i < s.mons.length; i++) {
      const M = s.mons[i], T = M.tOff;
      const yDur = M.centre ? 0.12 : 0.07, xDur = M.centre ? 0.2 : 0.09;
      let sx = 1, sy = 1, k1 = 0, on = true;
      if (t >= T) {
        k1 = lin(T, T + yDur, t);
        sy = 1 - 0.975 * k1;
        sx = 1 - 0.985 * lin(T + yDur, T + yDur + xDur, t);
        on = t < T + yDur + xDur;
      }
      M.vis = t < T;
      mixC(s.light, i, M.base.getHex(), PAL.white, k1);
      setMQ(s.light, i, M.lp, M.q, on ? sx * M.sc : 0, on ? sy * M.sc : 0, M.sc);
    }
    s.light.instanceMatrix.needsUpdate = true; s.light.instanceColor.needsUpdate = true;
    for (const P of s.pics) {
      P.list.forEach((M, j) => setMQ(P.mesh, j, M.pp, M.q, M.vis ? M.sc * M.flip : 0, M.vis ? M.sc : 0, M.sc));
      P.mesh.instanceMatrix.needsUpdate = true;
    }
    // her: profile, turns on "you", fades on "were never here"; the room stays empty
    const C = s.mons[s.ci], cv = C.vis;
    s.room.visible = cv;
    const turned = t >= s.Y[0], fade = lin(s.Y[1], s.Y[3], t);
    s.herP.visible = cv && !turned;
    s.herF.visible = cv && turned && fade < 1;
    s.glasses.visible = s.herF.visible;
    mixC(s.herF, 0, PAL.black, C.base.getHex(), fade);
    mixC(s.glasses, 0, PAL.white, C.base.getHex(), Math.max(fade, 0.6 - 0.6 * envAt(t, s.Y[0], 3)));
    s.herF.instanceColor.needsUpdate = true; s.glasses.instanceColor.needsUpdate = true;
    // the dot: holds at 14 deg, swells to S16's first sun size, warms to amber
    const tDot = s.L[0] + 0.3;
    s.dot.visible = t >= tDot;
    const rr = 0.0035 + 0.0135 * kit.sm(126.91, 127.62, t);
    s.dot.scale.setScalar(Math.tan(rr) * DOT_D);
    s.dotMat.uniforms.uColor.value.copy(C_WHITE).lerp(C_AMBER, lin(126.4, 127.55, t));
  },
  events() {
    return [
      { t: 119.95, sfx: 'switch', gain: 0.45 },
      { t: 122.27, sfx: 'switch', gain: 0.5, haptic: [0.25, 40] },
      { t: 125.7, sfx: 'switch', gain: 0.6, haptic: [0.3, 60] },
      { t: 126.38, sfx: 'tick', gain: 0.55 },
    ];
  },
};
