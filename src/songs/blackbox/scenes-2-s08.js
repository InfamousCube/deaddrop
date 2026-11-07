// S08 The bomb chamber and the gold harp (56.61 to 67.74, hot). Clean rework, one shot:
//   HERO a colossal 1960s time bomb ahead: seven crimson sticks, black straps, a black timer with two cream digits.
//   SUPPORT 1 eight thick gold harp columns in a ring around the player (two flank the bomb, the rest sides/back).
//   SUPPORT 2 the gold wire from the timer up into the dark, and the black wire-cutters that swing in and cut it.
//   PALETTE carmine dome (the field) + black floor + crimson bomb, gold accent, cream digits.
//   MOTION the countdown (03 02 01 00), then the cutters swing in and snip; later the columns are plucked.
//   ACCENT one spark burst at the cut; sunburst rays only on "tonight" and the two post-chorus "gold" hits.
//   LYRIC one block at a time, low centre over the plain floor under the bomb.
//   Out: EDGE-MODE at 67.74 (cyan outlines of bomb and harp for 0.4 s while S09 fills in).
import * as THREE from 'three';
import { PAL } from './style.js';
import { sm, env, merge, shapeOf, slab } from './scenes-2-util.js';

const FY = -4; // floor (y)
const BS = 1.25; // bomb scale
const BZ = -26; // bomb (world z before travel)
const C = [8, 6.5, -21]; // cut point on the gold wire (world, before travel)
const HARP_AZ = [38, -38, 80, -80, 125, -125, 170, -170];
const PLUCK = [64.0, 64.59, 66.72, 67.19];
const SWEEP = [60.62, 61.18, 61.75, 62.32];

export const S08 = {
  id: 'S08', t0: 56.61, t1: 67.74, world: 'hot', pre: 0, post: 0.4, // pre 0: the bomb stood over S07's spy and lyric
  key: [0.35, 0.45, 0.82],
  fog: { color: PAL.velvet, near: 60, far: 200 },
  sky: { zen: PAL.carmine, hor2: PAL.carmine, hor: PAL.carmine, nadir: PAL.velvet, rayA: PAL.crimson, rayB: PAL.carmineDeep, rays: 0, rings: 0 },

  build(kit) {
    const s = { m: new THREE.Matrix4(), c: new THREE.Color(), cDim: new THREE.Color(PAL.brass), cLit: new THREE.Color(PAL.goldHi), cGold: new THREE.Color(PAL.gold) };
    s.prof = kit.travel([[56.61, 2, 1.0], [58.6, 0, 1.4]]);
    s.W = new THREE.Group(); s.W.name = 's08-world';
    kit.group.add(s.W);
    const black = kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.6 });

    // floor: one plain black disc (the readable ground under the carmine dome)
    s.floor = new THREE.Mesh(new THREE.CircleGeometry(90, 40).rotateX(-Math.PI / 2), kit.flat({ color: PAL.velvet }));
    s.floor.position.y = FY;
    kit.group.add(s.floor);

    // ---- the bomb ----
    s.B = new THREE.Group();
    s.B.position.set(0, FY, BZ);
    s.B.scale.setScalar(BS);
    s.W.add(s.B);
    const sticks = [];
    const stick = () => new THREE.CylinderGeometry(0.95, 0.95, 12, 10, 1).translate(0, 6, 0);
    sticks.push(stick());
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; sticks.push(stick().translate(Math.sin(a) * 1.95, 0, Math.cos(a) * 1.95)); }
    s.B.add(new THREE.Mesh(merge(sticks), kit.toon({ ramp: 'hot', rim: null })));
    s.B.add(new THREE.Mesh(merge([2.2, 6.2, 10.2].map((y) => new THREE.CylinderGeometry(3.05, 3.05, 0.75, 12, 1).translate(0, y, 0))), kit.toon({ ramp: 'black', rim: null })));
    s.box = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.8, 1.2), kit.toon({ ramp: 'black', rim: null }));
    s.box.position.set(0, 5.0, 3.4);
    s.B.add(s.box);

    // ---- harp: eight thick gold columns around the player (one instanced mesh, colour per column) ----
    s.harp = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 48, 0.5).translate(0, 24, 0), kit.flat({ color: PAL.white, fog: 0.5 }), HARP_AZ.length);
    s.harp.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(HARP_AZ.length * 3).fill(1), 3);
    s.harpP = HARP_AZ.map((az) => [Math.sin(az * Math.PI / 180) * 13, Math.cos(az * Math.PI / 180) * -13]);
    s.harpP.forEach(([x, z], i) => s.harp.setMatrixAt(i, s.m.makeTranslation(x, FY, z)));
    s.harp.frustumCulled = false;
    kit.group.add(s.harp);

    // edge-mode outlines (built before any text is parented to the bomb)
    s.edgesB = kit.edges(s.B, { color: PAL.cyan, threshold: 40 }); s.W.add(s.edgesB);
    s.edgesH = kit.edges(s.harp, { color: PAL.cyan, threshold: 40 }); kit.group.add(s.edgesH);

    // timer digits on the box face
    s.digits = [['03', 56.3, 57.0], ['02', 57.0, 57.3], ['01', 57.3, 57.5], ['00', 57.5, 59.96]].map(([str, a, b]) => {
      const T = kit.text(str, { cap: 1.9, color: 'cream', times: [a], dur: 0.01, out: b, outDur: 0.01, parent: s.box });
      T.mesh.position.set(0, 0, 0.62);
      return T;
    });

    // ---- the gold wire: lower part (droops after the cut) and upper part (whips up) ----
    const gold = kit.flat({ color: PAL.gold });
    const A = new THREE.Vector3(2.7 * BS, FY + 4.4 * BS, BZ + 3.4 * BS);
    s.lowerG = new THREE.Group(); s.lowerG.position.copy(A);
    const lower = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.2, 0.6, 0.2), new THREE.Vector3(3.9, 2.2, 0.3), new THREE.Vector3(C[0] - A.x, C[1] - A.y, C[2] - A.z)]);
    s.lowerG.add(new THREE.Mesh(new THREE.TubeGeometry(lower, 16, 0.32, 6), gold));
    s.W.add(s.lowerG);
    const upper = new THREE.CatmullRomCurve3([new THREE.Vector3(...C), new THREE.Vector3(9.5, 14, -20), new THREE.Vector3(10.5, 30, -17), new THREE.Vector3(11, 52, -14)]);
    s.upper = new THREE.Mesh(new THREE.TubeGeometry(upper, 20, 0.32, 6), gold);
    s.W.add(s.upper);

    // ---- the wire-cutters: two big black blades with gold rims, pivot above right of the cut ----
    const blade = shapeOf([[-3.4, -1.3], [0, -0.75], [9.2, 0.05], [0, 0.75], [-3.4, 1.3], [-4.6, 0]]);
    const bg = slab(blade, 0.5, 0);
    s.cut = new THREE.Group();
    s.bladeA = new THREE.Mesh(bg, black); s.bladeB = new THREE.Mesh(bg, black);
    s.bladeA.position.z = 0.3; s.bladeB.position.z = -0.3;
    s.cut.add(s.bladeA, s.bladeB);
    s.cut.scale.setScalar(1.4);
    s.P = new THREE.Vector3(C[0] + 10.6, C[1] + 2.4, C[2] + 0.5); // the blades point left at the wire
    s.cut.rotation.z = Math.atan2(C[1] - s.P.y, C[0] - s.P.x);
    s.W.add(s.cut);
    s.sparks = kit.particles({
      n: 22, shape: 'stroke', size: 0.8, fog: 0.2, seed: 81,
      init: (i, r) => { const a = r() * Math.PI * 2, sp = 6 + r() * 9; return { p: [0, 0, 0], v: [Math.cos(a) * sp, Math.sin(a) * sp + 2, (r() - 0.2) * 4], g: [0, -12, 0], t0: 59.96, life: 0.4 + r() * 0.3, s: 0.5 + r() * 0.6, c: r() < 0.5 ? PAL.white : PAL.goldHi }; },
    });
    s.sparks.position.set(...C);
    s.W.add(s.sparks);

    // ---- lyric blocks: one at a time, low centre over the plain floor ----
    const at = { d: 6, az: 0, y: -1.0 };
    s.l1 = kit.text('COUNT DOWN TO ZERO,', { cap: 0.7, color: 'gold', times: [56.52, 57.0, 57.3, 57.5], out: 58.4, outDur: 0.06, at });
    s.l2 = kit.text("DON'T ASK ME WHY", { cap: 0.72, color: 'cream', times: [58.48, 59.4, 59.6, 59.84], out: 60.0, outDur: 0.1, at });
    s.l2.redact(3, 59.84);
    s.l3 = kit.text('GOLD ON THE WIRE', { cap: 0.85, color: 'gold', times: [60.05, 61.52, 61.86, 62.08], out: 62.56, outDur: 0.05, at });
    s.l4 = kit.text('TONIGHT', { cap: 1.25, color: 'cream', times: [62.62], pop: true, dur: 0.18, out: 63.9, outDur: 0.12, at: { d: 6, az: 0, y: -0.85 } });
    s.l5 = kit.text('OH-OH,\nGOLD ON THE WIRE', { cap: 0.7, color: 'gold', colors: { 1: 'cream', 2: 'cream', 3: 'cream', 4: 'cream' }, times: [64.0, 64.94, 65.44, 65.68, 65.74], out: 66.6, outDur: 0.08, at });
    s.l6 = kit.text('OH-OH,\nGOLD ON THE WIRE', { cap: 0.7, color: 'gold', colors: { 1: 'cream', 2: 'cream', 3: 'cream', 4: 'cream' }, times: [66.72, 67.36, 67.42, 67.48, 67.54], out: 67.74, outDur: 0.02, at });
    return s;
  },

  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;

    // cutters: swing in from above right, hover, snip on "Gold", lift away
    const inK = sm(58.33, 59.13, t), outK = sm(61.0, 62.2, t);
    s.cut.visible = t > 58.2 && t < 62.3;
    s.cut.position.set(s.P.x + 26 * (1 - inK) + 26 * outK, s.P.y + 3 * (1 - inK) + 8 * outK, s.P.z);
    const open = 0.36 * (1 - sm(59.88, 59.97, t)) + 0.1 * sm(60.4, 60.9, t);
    s.bladeA.rotation.z = open; s.bladeB.rotation.z = -open;
    // the cut: the upper wire whips up, the lower end droops
    s.upper.position.y = 46 * sm(59.96, 60.9, t);
    s.lowerG.rotation.z = -0.85 * sm(59.96, 60.55, t);
    s.sparks.visible = t >= 59.96 && t < 60.8;

    // harp colours: dim brass, a quarter-turn light sweep per beat, gold from "tonight", flashes on the plucks
    const a = s.harp.instanceColor.array;
    let moved = false;
    for (let i = 0; i < HARP_AZ.length; i++) {
      const az = ((HARP_AZ[i] % 360) + 360) % 360; // 0 front, 90 right, 180 back, 270 left
      const q = Math.floor(az / 90.0001);
      const sw = env(t, SWEEP[q] + ((az % 90) / 90) * 0.5, 2.5);
      let pl = 0, wob = 0;
      for (const tp of PLUCK) { const e = env(t, tp + (i % 2) * 0.04, 3); pl = Math.max(pl, e); if (e > 0) wob += Math.sin((t - tp) * 44) * e; }
      const base = sm(62.6, 62.75, t);
      s.c.copy(s.cDim).lerp(s.cGold, Math.max(base, sw)).lerp(s.cLit, pl);
      a[i * 3] = s.c.r; a[i * 3 + 1] = s.c.g; a[i * 3 + 2] = s.c.b;
      const [x, z] = s.harpP[i];
      const w = 0.35 * wob;
      s.harp.setMatrixAt(i, s.m.makeTranslation(x + w * Math.cos(HARP_AZ[i] * Math.PI / 180), FY, z + w * Math.sin(HARP_AZ[i] * Math.PI / 180)));
      if (w !== 0) moved = true;
    }
    s.harp.instanceColor.needsUpdate = true;
    s.harp.instanceMatrix.needsUpdate = moved || s.wasMoved;
    s.wasMoved = moved;

    // edge-mode out
    const edge = t >= 67.74;
    const eOn = edge ? 1 - sm(67.95, 68.14, t) : 0;
    if (edge) kit.edge(1);
    s.B.visible = s.harp.visible = !edge; // only the cyan lines stay, no black fills over S09
    s.edgesB.u.uOn.value = eOn; s.edgesH.u.uOn.value = eOn;
    s.edgesB.visible = s.edgesH.visible = edge;

    if (kit.isOwner) {
      kit.rigState.wire.on = 0; kit.rigState.wire.pulses = [];
      const rays = Math.max(sm(62.6, 62.7, t) * (1 - sm(63.5, 64.0, t)), env(t, 64.94, 2.6), env(t, 67.36, 3.2));
      kit.setSky({ rays: rays > 0.1 ? Math.min(1, rays * 1.2) : 0, rayR: 1.7, rot: t * 0.03, rings: 0, focal: [0, 0.3, -1] });
    }
  },

  events() {
    return [
      { t: 57.0, sfx: 'tick', gain: 0.45 },
      { t: 57.3, sfx: 'tick', gain: 0.45 },
      { t: 57.5, sfx: 'tick', gain: 0.55 },
      { t: 58.33, sfx: 'whoosh', gain: 0.4 },
      { t: 59.96, sfx: 'shutter', gain: 0.7, haptic: [0.6, 90] },
      { t: 64.0, sfx: 'ping', gain: 0.3 },
      { t: 66.72, sfx: 'ping', gain: 0.3 },
    ];
  },
};
