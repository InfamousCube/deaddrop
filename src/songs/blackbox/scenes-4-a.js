// Group 4, part A: S14 the records archive and shredder (bridge "three, two, one, you were never here")
// and S15 inside the scope (the record is wiped, then the old screen switches off into a dot).
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { D2R, EYE, f, inst, setM, initColors, setC, mixC, boxAt, shapeGeo, mirrorOutline, clipBand, lin, envAt, clamp01 } from './scenes-4-util.js';

// =================================================================================================
// S14 The records archive and shredder (112.04 to 119.98, cold)
const LAMPZ = [-8, -18, -30];               // lamp "3" (nearest), "2", "1" (over the shredder)
const LON = [112.62, 114.6, 115.9];
const LOFF = [119.5, 119.2, 118.68];        // they go out in reverse order, one per word
const FLOOR = -0.5;
const NSTRIP = 7;

export const S14 = {
  id: 'S14', t0: 112.04, t1: 119.98, world: 'cold', pre: 0, post: 0.2,
  key: [0.12, 0.95, -0.28],
  fog: { color: 0x000000, near: 10, far: 80 },
  sky: { stars: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, nadir: PAL.black },
  build(kit) {
    const s = { lamp: [0, 0, 0], settled: false };
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    const R = kit.rnd(1401);
    s.prof = kit.travel([[112.04, 1.5, 0.01]]);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 300), kit.flat({ color: PAL.black, fog: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, -80);
    W.add(floor); s.floor = floor;
    // a thin petrol inlay down the aisle (one-point perspective spine)
    const inlay = new THREE.Mesh(mergeSimple([boxAt(0.08, 0.01, 300, -2.2, FLOOR + 0.01, -80), boxAt(0.08, 0.01, 300, 2.2, FLOOR + 0.01, -80)]), kit.flat({ color: PAL.petrol }));
    W.add(inlay); s.inlay = inlay;

    // ---- cabinets (edge-mode source: cabinets + shredder) ----
    const src = (s.src = new THREE.Group());
    W.add(src);
    const units = [];
    let z = 26;
    while (units.length < 30) { if (z < -25.5 && z > -38.5) z = -38.6; units.push(z); z -= 2.6; }
    const cabGeo = new THREE.BoxGeometry(1.4, 6, 2.5); cabGeo.translate(0, 3, 0);
    s.cabMat = kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null });
    const cab = inst(cabGeo, s.cabMat, 60, 's14-cabinets');
    units.forEach((uz, i) => { for (let sd = 0; sd < 2; sd++) setM(cab, i * 2 + sd, (sd ? 1 : -1) * 4.7, FLOOR, uz); });
    src.add(cab);
    const shred = new THREE.Mesh(boxAt(10, 6.5, 4, 0, FLOOR + 3.25, -32), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.cyan, rimAmt: 0.9 }));
    src.add(shred);
    s.edges = kit.edges(src, { color: PAL.cyan, threshold: 20 });
    W.add(s.edges);
    // shredder slot line + two indicator eyes (cyan)
    const eye1 = new THREE.CircleGeometry(0.28, 12); eye1.translate(-3.6, FLOOR + 1.6, -29.98);
    const eye2 = new THREE.CircleGeometry(0.28, 12); eye2.translate(3.6, FLOOR + 1.6, -29.98);
    s.slotMat = kit.flat({ color: PAL.cyan, fog: 0.3 });
    s.slot = new THREE.Mesh(mergeSimple([boxAt(8.8, 0.14, 0.14, 0, FLOOR + 6.45, -29.98), eye1, eye2]), s.slotMat);
    W.add(s.slot);

    // ---- drawers: 6 per unit, open by different amounts, slammed shut on the countdown ----
    const ND = 360;
    s.ND = ND;
    s.dz = new Float32Array(ND); s.dx = new Float32Array(ND); s.dy = new Float32Array(ND);
    s.dOpen = new Float32Array(ND); s.dSlam = new Float32Array(ND);
    let k = 0;
    for (const uz of units) for (let sd = 0; sd < 2; sd++) for (let r = 0; r < 6; r++) {
      s.dz[k] = uz; s.dx[k] = sd ? 1 : -1; s.dy[k] = FLOOR + 0.55 + r * 0.95; s.dOpen[k] = 0.12 + R() * 0.62;
      let ts;
      if (uz >= -12) ts = 112.62;
      else if (uz >= -24) ts = R() < 0.6 ? (uz > -15.5 ? 113.19 : uz > -19.5 ? 113.79 : 114.37) : 114.6;
      else ts = 115.9;
      s.dSlam[k] = ts + R() * 0.05;
      k++;
    }
    s.front = initColors(inst(new THREE.BoxGeometry(0.06, 0.66, 1.9), kit.flat({ color: PAL.white, fog: 1 }), ND, 's14-fronts'), ND, PAL.petrol);
    s.body = inst(new THREE.BoxGeometry(1.0, 0.76, 2.1), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: null }), ND, 's14-drawers');
    s.label = inst(new THREE.PlaneGeometry(0.62, 0.2), kit.flat({ color: PAL.creamDark, side: THREE.DoubleSide }), ND, 's14-labels');
    W.add(s.front, s.body, s.label);

    // ---- distant archive stacks above and behind the cabinets, with a field of drawer labels ----
    const NS = 32;
    s.stacks = inst(new THREE.BoxGeometry(4, 24, 5.6).translate(0, 12, 0), kit.toon({ ramp: 'black', rim: null }), NS, 's14-stacks');
    const NL = NS * 24;
    s.dots = inst(new THREE.PlaneGeometry(0.7, 0.32), kit.flat({ color: PAL.teal, side: THREE.DoubleSide, fog: 1 }), NL, 's14-stack-labels');
    initColors(s.dots, NL);
    let li = 0;
    for (let i = 0; i < NS; i++) {
      const sd = i % 2 ? 1 : -1, zz = 30 - Math.floor(i / 2) * 6.2;
      setM(s.stacks, i, sd * 13, FLOOR, zz);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) {
        setM(s.dots, li, sd * 10.98, FLOOR + 7 + r * 2.1, zz - 1.8 + c * 1.8, 1, 1, 1, 0, Math.PI / 2, 0);
        setC(s.dots, li, R() < 0.18 ? PAL.cyan : PAL.teal, 0.35 + R() * 0.5);
        li++;
      }
    }
    W.add(s.stacks, s.dots);

    // ---- three huge lampshades with flat cream light cones ----
    const lamps = (s.lamps = new THREE.Group());
    W.add(lamps);
    const cord = new THREE.CylinderGeometry(0.04, 0.04, 24, 4); cord.translate(0, 12.6, 0);
    const shadeG = mergeSimple([new THREE.ConeGeometry(1.6, 1.4, 14, 1, true), cord]);
    const shades = inst(shadeG, kit.toon({ ramp: 'black', rim: PAL.cyan, side: THREE.DoubleSide }), 3, 's14-shades');
    s.bulbs = initColors(inst(new THREE.SphereGeometry(0.45, 10, 6), kit.flat({ color: PAL.white, fog: 0.4 }), 3, 's14-bulbs'), 3, 0x0a0a0a);
    const coneG = new THREE.ConeGeometry(4.2, 9, 24, 1, true); coneG.translate(0, -4.5, 0);
    s.cones = inst(coneG, kit.flat({ color: PAL.cream, opacity: 0.11, side: THREE.DoubleSide, fog: 0.5 }), 3, 's14-cones');
    for (let j = 0; j < 3; j++) { setM(shades, j, 0, 8.6, LAMPZ[j]); setM(s.bulbs, j, 0, 8.0, LAMPZ[j]); setM(s.cones, j, 0, 7.9, LAMPZ[j], 0, 0, 0); }
    lamps.add(shades, s.bulbs, s.cones);

    // ---- the Engineer's dossier, lowered on a gold line into the slot ----
    const dos = (s.dos = new THREE.Group());
    dos.position.set(0, 13.5, -32);
    W.add(dos);
    s.paperMat = kit.flat({ color: PAL.cream, fog: 0.4, side: THREE.DoubleSide });
    dos.add(new THREE.Mesh(new THREE.PlaneGeometry(8, 12).translate(0, 6, 0), s.paperMat));
    const hang = new THREE.Mesh(boxAt(0.06, 30, 0.06, 0, 12 + 15, 0), kit.flat({ color: PAL.gold, fog: 0.4 }));
    dos.add(hang);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 4.2).translate(-1.95, 8.6, 0.03), kit.flat({ color: PAL.creamDark, fog: 0.4 }));
    dos.add(photo);
    // her silhouette (bob, high collar) on the photo
    const sil = mirrorOutline([[-1.5, 0], [-1.45, 0.55], [-1.1, 0.85], [-0.55, 1.0], [-0.42, 1.38], [-0.26, 1.32], [-0.22, 1.5], [-0.56, 1.5], [-0.62, 1.95], [-0.5, 2.45], [-0.25, 2.66], [0, 2.7]]);
    const silM = new THREE.Mesh(shapeGeo(sil, 1), kit.flat({ color: PAL.black, fog: 0.4 }));
    silM.position.set(-1.95, 6.65, 0.06); dos.add(silM);
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 4, 16), kit.flat({ color: PAL.gold, fog: 0.4 }));
    clip.scale.set(1, 2.2, 1); clip.position.set(-1.95, 10.75, 0.1); dos.add(clip);
    // typed report lines and redaction bars
    const lines = [];
    for (let r = 0; r < 7; r++) lines.push(boxAt(r % 3 === 1 ? 2.6 : 3.2, r === 4 ? 0.3 : 0.1, 0.01, 1.95 + (r % 3 === 1 ? -0.3 : 0), 10.0 - r * 0.48, 0.04));
    for (let r = 0; r < 9; r++) { const w = 6.6 - (r % 4) * 0.7; lines.push(boxAt(w, r % 3 === 2 ? 0.34 : 0.1, 0.01, -3.3 + w / 2, 5.4 - r * 0.5, 0.04)); }
    dos.add(new THREE.Mesh(mergeSimple(lines), kit.flat({ color: PAL.black, fog: 0.4 })));
    const head = kit.text('PERSONNEL FILE 003', { cap: 0.42, color: 'black', parent: dos, align: 'left' });
    head.mesh.position.set(-3.6, 11.4, 0.07);
    const who = kit.text('THE ENGINEER', { cap: 0.62, color: 'black', parent: dos, align: 'left' });
    who.mesh.position.set(0.3, 10.65, 0.07);
    const stamp = kit.text('CLASSIFIED', { cap: 0.9, color: 'rust', parent: dos });
    stamp.mesh.position.set(1.3, 0.9, 0.08); stamp.mesh.rotation.z = 0.16;

    // ---- lyric type ----
    const num = (ch, tt, az) => kit.text(ch, { cap: 2.5, color: 'gold', times: [tt], pop: true, dur: 0.12, out: 117.62, outDur: 0.12, at: { d: 6, az, y: 2.1 } });
    num('3', 112.62, -26); num('2', 114.6, -9); num('1', 115.9, 9);
    s.ywnh = kit.text('YOU WERE NEVER HERE', { cap: 0.8, color: 'cream', near: 117.74, out: 118.54, outDur: 0.02, at: { d: 4.6, az: 0, y: 2.0 } });
    const wy0 = s.ywnh.words[0].y0 - 0.12, wy1 = s.ywnh.words[0].y1 + 0.12;
    s.strips = [];
    for (let i = 0; i < NSTRIP; i++) {
      const T = kit.text('YOU WERE NEVER HERE', { cap: 0.8, color: 'cream', times: 118.54, dur: 0.001, at: { d: 4.6, az: 0, y: 2.0 } });
      const b0 = wy0 + ((wy1 - wy0) * i) / NSTRIP, b1 = wy0 + ((wy1 - wy0) * (i + 1)) / NSTRIP;
      clipBand(T.mesh.geometry, b0, b1, 0.2);
      s.strips.push({ T, y: T.mesh.position.y, delay: R() * 0.1 + (NSTRIP - 1 - i) * 0.025, dx: (R() - 0.5) * 0.8, rz: (R() - 0.5) * 0.5, rx: (R() - 0.5) * 2 });
    }
    const small = (ch, a, b) => kit.text(ch, { cap: 0.55, color: 'cream', times: [a], pop: true, dur: 0.06, out: b, outDur: 0.06, at: { d: 5, az: 0, y: 3.35 } });
    small('3', 118.68, 118.98); small('2', 119.2, 119.42); small('1', 119.5, 119.75);

    // ---- shredded paper: a burst out of the slot, and a slow 360 degree spiral around the player ----
    const burst = kit.particles({
      n: 90, shape: 'stroke', seed: 1402, init: (i, r) => ({
        p: [-4 + r() * 8, FLOOR + 6.6, -30.4], v: [(r() - 0.5) * 5, 7 + r() * 7, 1 + r() * 4], g: [0, -5.5, 0],
        t0: 117.74 + r() * 0.35, life: 3.4, s: 0.5 + r() * 0.35, c: r() < 0.3 ? PAL.creamDark : PAL.cream,
      }),
    });
    W.add(burst);
    const spiral = kit.particles({
      n: 200, shape: 'stroke', seed: 1403, init: (i, r) => {
        const a = r() * Math.PI * 2, rad = 0.85 + Math.pow(r(), 0.7) * 8.5;
        return {
          p: [Math.cos(a) * rad, 2.2 + r() * 9, Math.sin(a) * rad], v: [0, -(0.9 + r() * 1.1), 0], swirl: 0.32 + r() * 0.35,
          t0: 117.82 + r() * 0.7, life: 8, s: 0.42 + r() * 0.3, c: r() < 0.25 ? PAL.creamDark : PAL.cream,
        };
      },
    });
    kit.group.add(spiral);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.world.position.z = d;
    const lit = t >= 112.62;
    kit.fade(lit ? 1 : 0);
    let nOn = 0;
    for (let j = 0; j < 3; j++) { s.lamp[j] = t >= LON[j] && t < LOFF[j] ? 1 : 0; nOn += s.lamp[j]; }
    for (let j = 0; j < 3; j++) {
      const on = s.lamp[j];
      setC(s.bulbs, j, on ? PAL.cream : 0x0a0a0a);
      setM(s.cones, j, 0, 7.9, LAMPZ[j], on, on, on);
    }
    s.bulbs.instanceColor.needsUpdate = true; s.cones.instanceMatrix.needsUpdate = true;

    // drawers: matrices only while any drawer still moves (pure: recomputed from t on every seek)
    const moving = t < 116.1;
    if (moving || !s.settled) {
      for (let i = 0; i < s.ND; i++) {
        const ts = s.dSlam[i], sd = s.dx[i];
        const open = t < ts ? s.dOpen[i] : s.dOpen[i] * Math.max(0, 1 - (t - ts) / 0.07);
        const xf = sd * (4.0 - open - 0.03);
        setM(s.front, i, xf, s.dy[i], s.dz[i]);
        setM(s.body, i, sd * (4.0 - open + 0.5), s.dy[i], s.dz[i]);
        setM(s.label, i, xf - sd * 0.04, s.dy[i] + 0.18, s.dz[i], 1, 1, 1, 0, Math.PI / 2, 0);
      }
      s.front.instanceMatrix.needsUpdate = true; s.body.instanceMatrix.needsUpdate = true; s.label.instanceMatrix.needsUpdate = true;
      s.settled = !moving;
    }
    for (let i = 0; i < s.ND; i++) {
      const z = s.dz[i];
      let litD = 0;
      for (let j = 0; j < 3; j++) if (s.lamp[j] && Math.abs(z - LAMPZ[j]) < 7.5) litD = 1;
      const kick = envAt(t, s.dSlam[i], 9);
      if (kick > 0.04) mixC(s.front, i, litD ? PAL.teal : PAL.petrol, PAL.cyan, kick);
      else setC(s.front, i, litD ? PAL.teal : PAL.petrol, litD ? 0.8 : 0.3);
    }
    s.front.instanceColor.needsUpdate = true;
    s.cabMat.uniforms.uBright.value = 0.55 + 0.18 * nOn;

    // shredder: idle, then running from 116.59
    const run = t >= 116.59;
    s.slotMat.uniforms.uBright.value = run ? 1.25 + 0.9 * kit.beatEnv(t, 7) : 0.4 + 0.4 * (t >= 115.9 ? 1 : 0);
    // dossier: lowered over the slot, fed in, gone on "you were never here"
    let yb;
    if (t < 112.62) yb = 13.5;
    else if (t < 116.59) yb = 13.5 - 7.3 * kit.ease.inOut(lin(112.62, 116.3, t));
    else if (t < 117.74) yb = 6.2 - 1.6 * lin(116.59, 117.16, t) - 2.6 * lin(117.16, 117.74, t);
    else yb = 2.0 - 10 * kit.ease.in(lin(117.74, 118.05, t));
    s.dos.position.y = yb;
    s.dos.visible = t < 118.05;
    s.paperMat.uniforms.uBright.value = 0.38 + 0.25 * s.lamp[1] + 0.5 * s.lamp[2] + 0.25 * kit.downEnv(t, 5);

    // "here": the line is cut into strips that drop away like shredded paper
    for (let i = 0; i < s.strips.length; i++) {
      const st = s.strips[i], m = st.T.mesh;
      const a = Math.max(0, t - 118.54 - st.delay);
      m.position.y = st.y - 4.5 * a * a;
      m.position.x = st.dx * a;
      m.rotation.z = st.rz * a * 2;
      m.rotation.x = st.rx * a;
      if (t > 119.6) m.visible = false;
    }

    // EDGE-MODE out (119.56-119.98): fills go away, the cyan edges stream forward and flatten onto S15's screen
    const edging = t >= 119.56;
    const ek = kit.sm(119.56, 119.98, t);
    s.src.visible = s.front.visible = s.body.visible = s.label.visible = !edging;
    s.lamps.visible = s.stacks.visible = s.dots.visible = s.floor.visible = s.inlay.visible = s.slot.visible = !edging;
    if (edging) {
      kit.edge(1);
      s.edges.u.uOn.value = 1 - kit.sm(119.98, 120.18, t);
      s.edges.scale.set(1 + 2.6 * ek, 1 + 1.7 * ek, 1 - 0.985 * ek);
      s.edges.position.set(0, 1.2 * ek, ek * (-24 - d));
    } else {
      s.edges.u.uOn.value = 0;
      s.edges.scale.set(1, 1, 1); s.edges.position.set(0, 0, 0);
    }

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.dark = lit ? (edging ? 0.6 : 0) : 1;
      rs.wire.on = lit ? 1 : 0;
      if (!lit) rs.wire.pulses = [];
      rs.wheelSpin = d / 0.075;
    }
  },
  events() {
    return [
      { t: 112.62, sfx: 'shutter', gain: 0.75, haptic: [0.5, 60] },
      { t: 114.6, sfx: 'shutter', gain: 0.6, haptic: [0.35, 50] },
      { t: 115.9, sfx: 'switch', gain: 0.6 },
      { t: 116.59, sfx: 'motor', gain: 0.55 },
      { t: 117.74, sfx: 'whoosh', gain: 0.6, haptic: [0.3, 80] },
      { t: 119.56, sfx: 'tick', gain: 0.45 },
    ];
  },
};

// =================================================================================================
// S15 Inside the scope (119.98 to 127.62, cold)
const AZH = 0.9;            // rad for u = +-1
const EL0 = 14 * D2R;       // screen centre elevation (the dot, and S16's sun, sit here)
const ELH = 0.5;            // rad for v = +-1
const RS = 25, RD = 24.6;   // screen radius, drawing radius (from the eye)
const DRAW0 = 119.98, DSTEP = 0.215, DDUR = 0.25;
const NECK = new THREE.Vector3(0, 3.0, 30); // eye-relative tube axis (world y 4.6)

const circ = (cx, cy, rx, ry, n = 14, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
// six earlier places + the cradle with the player (sketch space -1..1)
const SKETCHES = [
  [[[-0.7, -1], [0.7, -1]], [[-0.2, -1], [-0.2, 0.85], [0.35, 0.85], [0.45, 0.7]], circ(0.45, 0.6, 0.12, 0.09, 10), [[0.35, 0.5], [0.05, -0.95]], [[0.55, 0.5], [0.85, -0.95]]],
  [circ(0, 0.25, 0.75, 0.5, 20), circ(0, 0.25, 0.38, 0.25, 12), [[0, 0.25], [0.28, 0.78]], [[0, -0.25], [0, -1]], [[-0.45, -1], [0.45, -1]]],
  [[[-0.6, -1], [-0.12, 0.85], [0.12, 0.85], [0.6, -1]], [[-0.42, -0.3], [0.42, -0.3]], [[-0.28, 0.25], [0.28, 0.25]], [[-0.42, -0.3], [0.28, 0.25]], [[-0.8, 0.85], [0.8, 0.85]], [[-1, 0.7], [-0.5, 0.9], [0.5, 0.95], [1, 0.8]], [[0.62, 0.9], [0.62, 0.55]], rect(0.45, 0.25, 0.8, 0.55)],
  [circ(0, -0.25, 0.62, 0.62, 22), rect(-0.18, 0.36, 0.18, 0.52), [[0, 0.52], [0.15, 0.75], [0.45, 0.8], [0.62, 0.98]], [[-0.3, 0.1], [-0.75, 0.32], [-0.92, 0.02]], rect(-0.3, -0.45, 0.3, -0.15)],
  [circ(-0.25, 0.68, 0.12, 0.12, 10), circ(0.22, 0.8, 0.12, 0.12, 10), [[-0.25, 0.56], [-0.25, -0.1]], [[-0.25, -0.1], [-0.6, -0.95], [0.08, -0.95], [-0.25, -0.1]], [[0.22, 0.68], [0.22, -0.2], [0.1, -1]], [[0.22, -0.2], [0.38, -1]], [[-0.25, 0.35], [0.22, 0.45]], [[0.22, 0.5], [0.52, 0.86]], [[-0.25, 0.3], [-0.56, 0.56]]],
  [circ(0, 0, 0.8, 0.8, 26), [[-0.8, 0.1], [-0.7, 0.55], [-0.55, 0.35], [-0.4, 0.85], [-0.2, 0.6], [0, 1.0], [0.2, 0.6], [0.4, 0.85], [0.55, 0.35], [0.7, 0.55], [0.8, 0.1]], [[0, -0.8], [0, -1]]],
  [[[-1, 0.9], [1, 0.9]], [[0.08, 0.9], [0.08, 0.72], [0.35, 0.4], [0.35, -0.45]], circ(0, -0.62, 0.5, 0.12, 16), [[-0.45, -0.25], [0.45, -0.25]], [[-0.42, -0.25], [-0.42, -0.6]], [[0.42, -0.25], [0.42, -0.6]], circ(0, 0.2, 0.1, 0.1, 8), [[0, 0.1], [0, -0.3]], [[0, -0.3], [-0.12, -0.6]], [[0, -0.3], [0.12, -0.6]], [[0, 0.02], [-0.2, -0.2]], [[0, 0.02], [0.2, -0.2]]],
];
const SK_AZ = [-51, -34, -17, 0, 17, 34, 51];
const SK_V = 0.2, SK_SA = 0.135; // centre v, angular half size (rad)

const SCREEN_V = /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SCREEN_F = /* glsl */ `
uniform float uGrat, uSqV, uSqU, uLine, uDot, uErase, uBar, uFade, uSceneFade;
uniform vec3 uGC, uCC;
varying vec3 vP;
void main() {
  vec3 d0 = normalize(vP);
  float cs = ${f(Math.cos(EL0))}, sn = ${f(Math.sin(EL0))};
  vec3 d = vec3(d0.x, d0.y * cs + d0.z * sn, -d0.y * sn + d0.z * cs);
  float az = atan(d.x, -d.z);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float u = az / ${f(AZH)}, v = el / ${f(ELH)};
  float sv = max(1.0 - uSqV, 0.001), su = max(1.0 - uSqU, 0.001);
  float uu = u / su, vv = v / sv;
  float inside = step(abs(uu), 1.0) * step(abs(vv), 1.0);
  vec2 g = vec2(uu * 5.0, vv * 4.0);
  vec2 fw = fwidth(g);
  vec2 gl = abs(fract(g + 0.5) - 0.5);
  float w = 0.012;
  float ln = max(1.0 - smoothstep(w, w + fw.x, gl.x), 1.0 - smoothstep(w, w + fw.y, gl.y));
  float cr = max(1.0 - smoothstep(w * 1.7, w * 1.7 + fw.x, abs(g.x)), 1.0 - smoothstep(w * 1.7, w * 1.7 + fw.y, abs(g.y)));
  vec3 c = (uGC * ln + uCC * cr) * inside * uGrat;
  float bar = (1.0 - smoothstep(0.012, 0.02, abs(u - uErase))) * step(abs(v), 1.04) * uBar;
  c = mix(c, vec3(0.75, 1.0, 1.0), bar);
  float du = az, dv = el;
  float hh = max(sv * ${f(ELH)}, 0.0035), hw = max(su * ${f(AZH)}, 0.0035);
  float band = step(abs(dv), hh) * step(abs(du), hw) * uLine;
  float dotm = step(length(vec2(du, dv)), uDot);
  c = mix(c, vec3(1.0), max(band, dotm));
  gl_FragColor = vec4(c * uFade * uSceneFade, 1.0);
  #include <colorspace_fragment>
}`;
const DRAW_V = /* glsl */ `
attribute vec2 aK;
uniform float uSqV, uSqU, uT, uDur, uErase; uniform float uStart[8];
varying float vOn; varying float vHot;
void main() {
  float u = position.x * (1.0 - uSqU), v = position.y * (1.0 - uSqV);
  float az = u * ${f(AZH)}, el = v * ${f(ELH)};
  vec3 q = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el)) * ${f(RD)};
  float cs = ${f(Math.cos(EL0))}, sn = ${f(Math.sin(EL0))};
  vec3 p = vec3(q.x, q.y * cs - q.z * sn, q.y * sn + q.z * cs);
  int i = int(aK.x + 0.5);
  float prog = (uT - uStart[i]) / uDur;
  vOn = step(aK.y, prog) * step(uErase, position.x);
  vHot = 1.0 - clamp((prog - aK.y) * 5.0, 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const DRAW_F = /* glsl */ `
uniform vec3 uCol; uniform float uFade, uSceneFade, uAmt;
varying float vOn; varying float vHot;
void main() {
  if (vOn < 0.5) discard;
  vec3 c = mix(uCol, vec3(1.0), vHot * 0.85) * uAmt;
  gl_FragColor = vec4(c * uFade * uSceneFade, 1.0);
  #include <colorspace_fragment>
}`;

const CE = Math.cos(EL0), SE = Math.sin(EL0);
const uvDir = (u, v, r, out) => { const az = u * AZH, el = v * ELH, y = Math.sin(el) * r, z = -Math.cos(az) * Math.cos(el) * r; return out.set(Math.sin(az) * Math.cos(el) * r, y * CE - z * SE, y * SE + z * CE); };
const capPt = (azD, elD, r) => { const a = azD * D2R, e = elD * D2R; return new THREE.Vector3(-Math.sin(-a) * Math.cos(e) * r, Math.sin(e) * r, -Math.cos(a) * Math.cos(e) * r); };

export const S15 = {
  id: 'S15', t0: 119.98, t1: 127.62, world: 'cold', pre: 0.4, post: 0,
  key: [0.0, 0.25, 0.97],
  sky: 'black',
  build(kit) {
    const s = { tgt: new THREE.Vector3(), tw: new THREE.Vector3() };
    const tube = (s.tube = new THREE.Group());
    tube.position.copy(EYE);
    kit.group.add(tube);
    // the concave phosphor screen (spherical cap around the eye, front 200 deg)
    s.su = {
      uGrat: { value: 0 }, uSqV: { value: 0 }, uSqU: { value: 0 }, uLine: { value: 0 }, uDot: { value: 0 }, uErase: { value: -2 }, uBar: { value: 0 },
      uGC: { value: new THREE.Color(PAL.petrol) }, uCC: { value: new THREE.Color(PAL.teal) }, uFade: kit.U.uFade, uSceneFade: kit.SU.uSceneFade,
    };
    const scr = new THREE.Mesh(
      new THREE.SphereGeometry(RS, 72, 28, 1.5 * Math.PI - 100 * D2R, 200 * D2R, 45 * D2R, 75 * D2R),
      new THREE.ShaderMaterial({ uniforms: s.su, vertexShader: SCREEN_V, fragmentShader: SCREEN_F, side: THREE.DoubleSide }),
    );
    scr.name = 's15-screen'; scr.frustumCulled = false;
    tube.add(scr);

    // phosphor sketches as ribbons on the screen, drawn on by the beam and erased by the sweep
    const pos = [], aK = [], idx = [];
    s.segs = [];
    const hw = 0.0024;
    SKETCHES.forEach((sk, di) => {
      const cu = (SK_AZ[di] * D2R) / AZH;
      const segs = [];
      let total = 0;
      for (const pl of sk) for (let k = 1; k < pl.length; k++) {
        const a = pl[k - 1], b = pl[k];
        const u0 = cu + (a[0] * SK_SA) / AZH, v0 = SK_V + (a[1] * SK_SA) / ELH, u1 = cu + (b[0] * SK_SA) / AZH, v1 = SK_V + (b[1] * SK_SA) / ELH;
        const len = Math.hypot((u1 - u0) * AZH, (v1 - v0) * ELH);
        segs.push([u0, v0, u1, v1, total, total + len]);
        total += len;
      }
      for (const sg of segs) { sg[4] /= total; sg[5] /= total; }
      s.segs.push(segs);
      for (const [u0, v0, u1, v1, f0, f1] of segs) {
        const dA = (u1 - u0) * AZH, dB = (v1 - v0) * ELH, L = Math.hypot(dA, dB) || 1;
        const nu = (-dB / L) * hw / AZH, nv = (dA / L) * hw / ELH;
        const b = pos.length / 3;
        pos.push(u0 - nu, v0 - nv, 0, u0 + nu, v0 + nv, 0, u1 + nu, v1 + nv, 0, u1 - nu, v1 - nv, 0);
        aK.push(di, f0, di, f0, di, f1, di, f1);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    });
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    dg.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 2));
    dg.setIndex(idx);
    s.du = {
      uSqV: s.su.uSqV, uSqU: s.su.uSqU, uErase: s.su.uErase, uT: { value: 0 }, uDur: { value: DDUR },
      uStart: { value: SKETCHES.map((_, i) => DRAW0 + i * DSTEP).concat([1e9]) },
      uCol: { value: new THREE.Color(PAL.cyan) }, uAmt: { value: 1 }, uFade: kit.U.uFade, uSceneFade: kit.SU.uSceneFade,
    };
    const draw = new THREE.Mesh(dg, new THREE.ShaderMaterial({ uniforms: s.du, vertexShader: DRAW_V, fragmentShader: DRAW_F, side: THREE.DoubleSide }));
    draw.frustumCulled = false; draw.renderOrder = 2; draw.name = 's15-sketches';
    tube.add(draw);

    // the funnel: loft from the screen's rim back past the player to the neck
    const N = 64, rim = [];
    for (let i = 0; i < 16; i++) rim.push(capPt(-100 + (200 * i) / 16, 45, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(100, 45 - (75 * i) / 16, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(100 - (200 * i) / 16, -30, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(-100, -30 + (75 * i) / 16, RS));
    const neck = rim.map((p) => { const a = Math.atan2(p.y - NECK.y, p.x); return new THREE.Vector3(Math.cos(a) * 2.5, NECK.y + Math.sin(a) * 2.5, NECK.z); });
    const RINGS = 6, ring = (j) => rim.map((p, i) => p.clone().lerp(neck[i], Math.pow(j / RINGS, 0.85)));
    const P = [];
    let prev = ring(0);
    for (let j = 1; j <= RINGS; j++) {
      const cur = ring(j);
      for (let i = 0; i < N; i++) {
        const a0 = prev[i], a1 = prev[(i + 1) % N], b0 = cur[i], b1 = cur[(i + 1) % N];
        P.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, a1.x, a1.y, a1.z, a1.x, a1.y, a1.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z);
      }
      prev = cur;
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    fg.computeVertexNormals();
    const nk = new THREE.CylinderGeometry(2.5, 2.5, 13, 16, 1, true); nk.rotateX(Math.PI / 2); nk.translate(0, NECK.y, NECK.z + 6.5);
    const cap = new THREE.CircleGeometry(2.5, 16); cap.rotateY(Math.PI); cap.translate(0, NECK.y, NECK.z + 13);
    s.walls = new THREE.Mesh(mergeSimple([fg, nk.toNonIndexed(), cap.toNonIndexed()]), kit.toon({ ramp: 'black', rim: PAL.cyan, rimAmt: 0.7, side: THREE.DoubleSide }));
    s.walls.frustumCulled = false;
    tube.add(s.walls);
    // cyan rim edges: the screen rim, two funnel rings, 8 ribs, the neck rings
    const L = [];
    const loop = (pts) => { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; L.push(a.x, a.y, a.z, b.x, b.y, b.z); } };
    loop(rim); loop(ring(3)); loop(ring(5));
    for (let i = 0; i < N; i += 8) { const r0 = ring(0)[i]; L.push(r0.x, r0.y, r0.z, neck[i].x, neck[i].y, neck[i].z); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    s.lines = new THREE.LineSegments(lg, kit.flat({ color: PAL.teal, fog: 0.5 }));
    s.lines.frustumCulled = false;
    tube.add(s.lines);
    // the electron gun: three cyan rings and a white cathode point
    const gr = [0, 1, 2].map((k) => { const g = new THREE.TorusGeometry(1.5 - k * 0.25, 0.07, 6, 32); g.translate(0, NECK.y, NECK.z + 2.5 + k * 2.5); return g; });
    s.gun = new THREE.Mesh(mergeSimple(gr), kit.flat({ color: PAL.cyan, fog: 0 }));
    tube.add(s.gun);
    s.cath = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 6), kit.flat({ color: PAL.white, fog: 0 }));
    s.cath.position.set(0, NECK.y, NECK.z + 10.5);
    tube.add(s.cath);
    // the beam: one thin white line from the gun to the point being drawn, ~3 m over the head
    s.beam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 1).translate(0, 0, 0.5), kit.flat({ color: PAL.white, fog: 0 }));
    s.beam.position.copy(s.cath.position);
    s.beam.frustumCulled = false;
    tube.add(s.beam);

    // ---- periphery: the electron stream, the deflection yoke, the afterglow ring ----
    // electrons: sparse cyan / white dots leave the gun behind the player and fan out past the
    // sides and overhead onto the whole screen (never nearer than 3 m to the eyes, about 11 m/s)
    const er = kit.rnd(1515), tgtP = new THREE.Vector3();
    s.elec = kit.particles({
      n: 260, shape: 'disc', fog: 0.3, seed: 1516, name: 's15-electrons',
      init: (i) => {
        let p, v, dur;
        for (let k = 0; k < 16; k++) {
          p = [(er() - 0.5) * 2.2, NECK.y + (er() - 0.5) * 2.2, NECK.z - 4 - er() * 2];
          tgtP.copy(capPt(-85 + er() * 170, -24 + er() * 62, RS * 0.97));
          dur = 4.0 + er() * 1.6;
          v = [(tgtP.x - p[0]) / dur, (tgtP.y - p[1]) / dur, (tgtP.z - p[2]) / dur];
          // closest approach of the straight path to the eye (the tube origin)
          const L2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
          const u = Math.min(dur, Math.max(0, -(p[0] * v[0] + p[1] * v[1] + p[2] * v[2]) / L2));
          if (Math.hypot(p[0] + v[0] * u, p[1] + v[1] * u, p[2] + v[2] * u) > 3.0) break;
        }
        return { p, v, t0: 114.0 + (i / 260) * 12.3 - dur * er() * 0.2, life: dur, s: 0.14 + er() * 0.16, c: er() < 0.7 ? PAL.cyan : PAL.white };
      },
    });
    tube.add(s.elec);
    // the deflection yoke: three dashed rings around the tube axis behind and above the player,
    // turning slowly in alternate directions (about 5 deg/s)
    s.yoke = [[7, 10.5, 1], [14, 7.5, -1], [21, 5, 1]].map(([z, r, dir], k) => {
      const parts = [];
      for (let j = 0; j < 12; j++) parts.push(new THREE.TorusGeometry(r, 0.09 + 0.03 * k, 4, 8, (Math.PI * 2 / 12) * 0.62).rotateZ((j / 12) * Math.PI * 2));
      const m = new THREE.Mesh(mergeSimple(parts), kit.flat({ color: k === 1 ? PAL.cyan : PAL.teal, fog: 0.3 }));
      m.position.set(0, NECK.y * (z / NECK.z), z);
      m.lookAt(0, NECK.y * ((z + 1) / NECK.z), z + 1);
      m.frustumCulled = false;
      tube.add(m);
      return { m, dir, base: m.quaternion.clone() };
    });
    // the afterglow: when the screen has collapsed into the dot, one thin ring of phosphor
    // contracts onto it (a slow moving element in the dark, 126.5-127.55)
    s.glow = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), kit.flat({ color: PAL.cyan, fog: 0, side: THREE.DoubleSide }));
    uvDir(0, 0, 17, s.glow.position); // 17 m: a flat ring this size must stay in front of the curved screen (r 25)
    s.glow.lookAt(0, 0, 0);
    s.glow.frustumCulled = false;
    tube.add(s.glow);

    // lyric type
    s.ywnh = kit.text('YOU WERE NEVER HERE', { cap: 1.0, color: 'cream', near: 119.56, at: { d: 6, az: 0, y: 1.55 } });
    const tt = s.ywnh.times.slice(); tt[0] = 119.98; s.ywnh.setTimes(tt);
    for (let i = 0; i < 4; i++) s.ywnh.hideWord(i, 123.42 + i * 0.07);
    s.lo = kit.text('LIGHTS OUT', { cap: 1.35, color: 'gold', near: 124.94, at: { d: 6, az: 0, y: 2.05 } });
    return s;
  },
  update(t, s, kit) {
    const su = s.su;
    // graticule: power-on, downbeat kick, then dims in three hard steps
    let g = t < 119.62 ? 0 : t < 119.8 ? 0.5 : 1;
    g *= t < 123.6 ? 1 : t < 124.1 ? 0.62 : t < 124.67 ? 0.38 : 0.2;
    if (t < 123.6) g *= 1 + 0.6 * kit.downEnv(t, 5);
    su.uGrat.value = g;
    su.uSqV.value = kit.sm(124.94, 125.34, t);
    su.uSqU.value = kit.sm(126.38, 126.5, t);
    su.uLine.value = kit.sm(125.2, 125.34, t);
    su.uDot.value = t >= 126.5 ? 0.0035 + 0.0135 * kit.sm(126.91, 127.62, t) : 0;
    // erase sweep left to right: half gone on "never", the player on "here"
    let ue;
    if (t < 122.3) ue = -2;
    else if (t < 122.6) ue = -1.18 + 1.18 * lin(122.3, 122.6, t);
    else if (t < 123.0) ue = 1.02 * lin(122.6, 123.0, t);
    else ue = 1.02 + 0.2 * lin(123.0, 123.15, t);
    su.uErase.value = ue;
    su.uBar.value = t >= 122.3 && t < 123.15 ? 1 : 0;
    s.du.uT.value = t;
    s.du.uAmt.value = t < 124.94 ? 1 : 1 + su.uSqV.value;

    // the beam: drawing point, then the erase bar, then the collapsing line
    let beamOn = false;
    const bt = s.tgt;
    if (t >= DRAW0 && t < DRAW0 + 6 * DSTEP + DDUR) {
      const i = Math.min(6, Math.floor((t - DRAW0) / DSTEP));
      const p = clamp01((t - (DRAW0 + i * DSTEP)) / DDUR);
      const segs = s.segs[i];
      let sg = segs[segs.length - 1];
      for (let k = 0; k < segs.length; k++) if (p <= segs[k][5]) { sg = segs[k]; break; }
      const kk = clamp01((p - sg[4]) / Math.max(1e-5, sg[5] - sg[4]));
      uvDir(sg[0] + (sg[2] - sg[0]) * kk, sg[1] + (sg[3] - sg[1]) * kk, RD, bt);
      beamOn = true;
    } else if (t >= 122.3 && t < 123.15) {
      uvDir(ue, Math.sin(t * 37) * 0.95, RD, bt); beamOn = true;
    } else if (t >= 124.94 && t < 126.5) {
      uvDir(Math.sin(t * 23) * (1 - su.uSqU.value), 0, RD, bt); beamOn = true;
    }
    s.beam.visible = beamOn;
    if (beamOn) {
      const dx = bt.x - s.beam.position.x, dy = bt.y - s.beam.position.y, dz = bt.z - s.beam.position.z;
      s.tw.copy(bt).add(EYE);
      s.beam.scale.set(1, 1, Math.hypot(dx, dy, dz));
      s.beam.lookAt(s.tw);
    }
    // "out": everything but the dot goes black
    const lit = t < 126.38;
    s.lines.visible = s.gun.visible = s.cath.visible = s.walls.visible = lit;
    // periphery: electrons and yoke while the tube is lit, the afterglow ring in the dark
    s.elec.visible = lit && t >= 119.62;
    for (const Y of s.yoke) {
      Y.m.visible = lit && t >= 119.62;
      Y.m.quaternion.copy(Y.base);
      Y.m.rotateZ(Y.dir * 0.09 * (t - 119.0));
      Y.m.material.uniforms.uBright.value = (t < 123.6 ? 1 : 0.6) * (1 + 0.5 * kit.beatEnv(t, 6));
    }
    const gk = lin(126.5, 127.5, t);
    s.glow.visible = t >= 126.5 && t < 127.55;
    if (s.glow.visible) {
      const gr = (9 * (1 - kit.ease.inOut(gk)) + 0.32) * (17 / RD);
      s.glow.scale.set(gr, gr, 1);
      s.glow.material.uniforms.uColor.value.set(gk < 0.5 ? PAL.teal : PAL.cyan);
    }
    s.lines.material.uniforms.uBright.value = t < 119.98 ? 0.5 + 0.5 * lin(119.58, 119.98, t) : 1;
    // LIGHTS OUT squashes with the screen into the dot
    const m = s.lo.mesh;
    m.scale.y = 1 - 0.97 * kit.sm(126.38, 126.5, t);
    m.scale.x = 1 - 0.98 * kit.sm(126.5, 126.62, t);
    if (t >= 126.64) m.visible = false;

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wire.on = lit ? 1 : 0;
      if (!lit) rs.wire.pulses = [];
      rs.dark = kit.sm(126.3, 126.45, t);
      rs.wheelSpin = 0;
    }
  },
  events() {
    return [
      { t: 119.98, sfx: 'switch', gain: 0.45 },
      { t: 122.3, sfx: 'whoosh', gain: 0.4 },
      { t: 124.94, sfx: 'switch', gain: 0.6, haptic: [0.3, 60] },
      { t: 126.38, sfx: 'tick', gain: 0.55 },
    ];
  },
};
