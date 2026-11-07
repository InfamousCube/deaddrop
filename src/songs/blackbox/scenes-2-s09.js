// S09 The music-box ballroom (67.74 to 76.89, cold). The cradle glides over the open lid of a colossal
// steel music box: a pinned cylinder turns against a steel comb, two 15 m rust-velvet gloves descend,
// one turns the crank, the other presses the lid; 24 dancing couples pop up on pegs in three rings
// around the player and waltz (a hard turn every 3rd beat against the 4/4); a fan of laser beams
// snaps on under the deck. In: fills in from S08's edge lines. Out: LIGHTS-OUT at 76.89 (S10).
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, sm, env, hash, paint, merge, rod, shapeOf, slab } from './scenes-2-util.js';

const FL = -1.2; // lid floor (1.2 m below the deck)
const LX0 = -34, LX1 = 26, LZ0 = -30, LZ1 = 10; // lid footprint (lid frame, d = 0); hinge at LZ0
const CYL = { x: 10, y: FL + 3.0, z: -45, r: 2.4, len: 22 }; // the pinned cylinder sits proud of the bed plate
const CRANK = [29, CYL.y, CYL.z];
const BEAT = 60 / 105.74, BAR = BEAT * 4;
const RINGS = [{ r: 4, dir: 1, w: 9 }, { r: 8, dir: -1, w: 7.5 }, { r: 12, dir: 1, w: 6 }];
const BLINKS = [75.17, 75.75];

export const S09 = {
  id: 'S09', t0: 67.74, t1: 76.89, world: 'cold', pre: 0.3, post: 0,
  key: [0, 1, 0],
  fog: { color: 0x000000, near: 30, far: 170 },
  sky: { stars: 0.4 },

  build(kit) {
    const s = { A: new THREE.Object3D(), Bo: new THREE.Object3D(), m: new THREE.Matrix4(), v: new THREE.Vector3() };
    const R = kit.rnd(909);
    s.prof = kit.travel([[67.74, 1.6, 1.0]]);
    s.cylRot = kit.travel([[70.04, 0.9, 0.5], [76.34, 0, 0.4]]);
    s.crankRot = kit.travel([[70.04, (Math.PI * 2) / BAR, 0.3], [76.34, 0, 0.3]]);
    s.ringRot = RINGS.map((r) => kit.travel([[71.52, r.w, 1.0], [73.46, r.w / 2, 0.6]]));
    s.root = new THREE.Group(); s.root.name = 's09-root';
    kit.group.add(s.root);
    s.L = new THREE.Group(); // lid frame (travels)
    s.root.add(s.L);
    const steel = kit.toon({ ramp: 'steel', rim: PAL.cyan, rimTh: 0.6 });

    // ---- the lid's inside: petrol floor, teal lit band, a 16-point star medallion ----
    const parts = [paint(new THREE.PlaneGeometry(LX1 - LX0, LZ1 - LZ0).translate((LX0 + LX1) / 2, -(LZ0 + LZ1) / 2, 0), PAL.petrol)];
    const band = (x0, x1, z0, z1) => parts.push(paint(new THREE.PlaneGeometry(x1 - x0, z1 - z0).translate((x0 + x1) / 2, -(z0 + z1) / 2, 0.02), PAL.teal));
    const I = 2.6, Wb = 1.3;
    band(LX0 + I, LX1 - I, LZ0 + I, LZ0 + I + Wb); band(LX0 + I, LX1 - I, LZ1 - I - Wb, LZ1 - I);
    band(LX0 + I, LX0 + I + Wb, LZ0 + I, LZ1 - I); band(LX1 - I - Wb, LX1 - I, LZ0 + I, LZ1 - I);
    const cx = (LX0 + LX1) / 2, cz = (LZ0 + LZ1) / 2;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, r0 = k % 2 ? 3.2 : 7.5;
      const b = ((k + 1) / 16) * Math.PI * 2, r1 = k % 2 ? 7.5 : 3.2;
      const x0 = cx + Math.sin(a) * r0, z0 = cz - Math.cos(a) * r0, x1 = cx + Math.sin(b) * r1, z1 = cz - Math.cos(b) * r1;
      const L = Math.hypot(x1 - x0, z1 - z0);
      parts.push(paint(new THREE.PlaneGeometry(L, 0.28).rotateZ(-Math.atan2(-(z1 - z0), x1 - x0)).translate((x0 + x1) / 2, -(z0 + z1) / 2, 0.02), PAL.teal));
    }
    const fg = merge(parts).rotateX(-Math.PI / 2).translate(0, FL, 0);
    s.floor = new THREE.Mesh(fg, kit.flat({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
    s.L.add(s.floor);

    // ---- solids: lid rim walls, hinge, box body walls, cylinder, comb, crank ----
    s.solid = new THREE.Group(); s.L.add(s.solid);
    const box = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    s.solid.add(new THREE.Mesh(merge([
      box(LX0 - 1, LX0, FL, FL + 2.2, LZ0, LZ1 + 1), box(LX1, LX1 + 1, FL, FL + 2.2, LZ0, LZ1 + 1), box(LX0, LX1, FL, FL + 2.2, LZ1, LZ1 + 1),
      rod([LX0 - 1, FL - 0.4, LZ0], [LX1 + 1, FL - 0.4, LZ0], 0.75, 0.75, 8),
      box(LX0 - 1, LX0, -20, FL, -70, LZ0), box(LX1, LX1 + 1, -20, FL, -70, LZ0), box(LX0 - 1, LX1 + 1, -20, FL, -71, -70), box(LX0, LX1, -20, FL - 1.0, LZ0 - 0.6, LZ0 + 0.4),
      box(CYL.x - 14, CYL.x + 14, -20, FL, -53, -38), box(CYL.x - 13.4, CYL.x - 11.2, FL, CYL.y, CYL.z - 1.1, CYL.z + 1.1), box(CYL.x + 11.2, CYL.x + 13.4, FL, CYL.y, CYL.z - 1.1, CYL.z + 1.1),
    ]), steel));
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(LX1 - LX0, 40).rotateX(-Math.PI / 2).translate(cx, -20, -50), kit.flat({ color: PAL.black }));
    s.L.add(pit);
    s.cylG = new THREE.Group(); s.cylG.position.set(CYL.x, CYL.y, CYL.z);
    s.cylG.add(new THREE.Mesh(new THREE.CylinderGeometry(CYL.r, CYL.r, CYL.len, 16, 1).rotateZ(Math.PI / 2), steel));
    s.solid.add(s.cylG);
    s.solid.add(new THREE.Mesh(merge([box(CYL.x - 11, CYL.x + 11, FL, CYL.y + 2.55, -50.6, -48.2), rod([CYL.x - 11.2, CYL.y, CYL.z], [CYL.x - 13.6, CYL.y, CYL.z], 0.9, 0.9, 8), rod([CYL.x + 11.2, CYL.y, CYL.z], [CYL.x + 13.6, CYL.y, CYL.z], 0.9, 0.9, 8)]), steel));
    s.teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.24, 1).translate(0, 0, -0.5), kit.toon({ ramp: 'steel', rim: PAL.cyan }), 40);
    s.teeth.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(40 * 3).fill(1), 3);
    s.teeth.frustumCulled = false;
    for (let i = 0; i < 40; i++) {
      const A = s.A; A.position.set(CYL.x - 10.6 + i * 0.545, CYL.y + 2.5, -48.2); A.rotation.set(0, Math.PI, 0); A.scale.set(1, 1, 3.6 - 1.6 * (i / 39)); A.updateMatrix(); s.teeth.setMatrixAt(i, A.matrix);
    }
    s.solid.add(s.teeth);
    s.crankG = new THREE.Group(); s.crankG.position.set(...CRANK);
    s.crankG.add(new THREE.Mesh(merge([rod([-6.8, 0, 0], [0.4, 0, 0], 0.6, 0.6, 8), new THREE.BoxGeometry(0.9, 4.9, 0.9).translate(0.45, 2.3, 0), rod([0.45, 4.5, 0], [3.2, 4.5, 0], 0.45, 0.45, 8), new THREE.CylinderGeometry(1.1, 1.1, 0.5, 10).rotateZ(Math.PI / 2).translate(-2.4, 0, 0)]), steel));
    s.solid.add(s.crankG);
    // edge lines (built now, before pins/emitters/couples join the scene)
    s.edges = kit.edges(s.solid, { color: PAL.cyan, threshold: 24 });
    s.L.add(s.edges);
    // 400 pins on the cylinder
    s.pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.5, 0.17), kit.toon({ ramp: 'cream', rim: null }), 400);
    for (let i = 0; i < 400; i++) {
      const th = R() * Math.PI * 2, x = (R() - 0.5) * (CYL.len - 1.2);
      s.A.position.set(x, Math.cos(th) * (CYL.r + 0.2), Math.sin(th) * (CYL.r + 0.2)); s.A.rotation.set(th, 0, 0); s.A.scale.set(1, 1, 1); s.A.updateMatrix(); s.pins.setMatrixAt(i, s.A.matrix);
    }
    s.cylG.add(s.pins);

    // ---- ten laser emitters on the lid walls, beams in a fan at hip height / under the deck ----
    const beams = [];
    const zl = [-26, -18, -9, 0, 7], dzl = [10, -12, 14, -10, -17], zr = [-24, -14, -5, 3, 8], dzr = [14, -8, 12, -16, -6];
    const clampZ = (z) => Math.max(LZ0 + 0.8, Math.min(LZ1 - 0.8, z));
    for (let i = 0; i < 5; i++) {
      beams.push({ a: [LX0 + 0.6, -0.1 - R() * 0.35, zl[i]], b: [LX1 - 0.6, -0.15 - R() * 0.45, clampZ(zl[i] + dzl[i])] });
      beams.push({ a: [LX1 - 0.6, -0.1 - R() * 0.35, zr[i]], b: [LX0 + 0.6, -0.15 - R() * 0.45, clampZ(zr[i] + dzr[i])] });
    }
    const segs = [];
    beams.forEach((bm, bi) => {
      const [ax, ay, az] = bm.a, [bx, by, bz] = bm.b;
      const L = Math.hypot(bx - ax, by - ay, bz - az), n = Math.ceil(L / 1.2);
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n;
        segs.push({ bi, x: ax + (bx - ax) * u, y: ay + (by - ay) * u, z: az + (bz - az) * u, len: L / n, yaw: Math.atan2(-(bz - az), bx - ax), pitch: Math.atan2(by - ay, Math.hypot(bx - ax, bz - az)) });
      }
    });
    s.segs = segs;
    const lg = merge([new THREE.PlaneGeometry(1, 0.055), new THREE.PlaneGeometry(1, 0.055).rotateX(Math.PI / 2)]);
    s.laser = new THREE.InstancedMesh(lg, kit.flat({ color: PAL.orange, side: THREE.DoubleSide, fog: 0.4 }), segs.length);
    s.laser.frustumCulled = false;
    s.segMat = segs.map((g) => { const A = s.A; A.position.set(g.x, g.y, g.z); A.rotation.set(0, g.yaw, g.pitch, 'YXZ'); A.scale.set(g.len * 1.02, 1, 1); A.updateMatrix(); return A.matrix.clone(); });
    s.segMat.forEach((mm, i) => s.laser.setMatrixAt(i, mm));
    s.L.add(s.laser);
    s.emit = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 0.9, 1.0), kit.toon({ ramp: 'rust', rim: PAL.cyan }), beams.length);
    beams.forEach((bm, i) => { s.A.position.set(bm.a[0] + (bm.a[0] < 0 ? -0.2 : 0.2), bm.a[1], bm.a[2]); s.A.rotation.set(0, 0, 0); s.A.scale.set(1, 1, 1); s.A.updateMatrix(); s.emit.setMatrixAt(i, s.A.matrix); });
    s.L.add(s.emit);

    // ---- 24 couples on pegs, three rings around the player ----
    const man = shapeOf([[-0.78, 0], [-0.6, 0], [-0.5, 0.85], [-0.44, 0], [-0.26, 0], [-0.28, 1.0], [-0.1, 0.72], [-0.2, 1.15], [-0.18, 1.68], [0.14, 1.76], [0.14, 1.88], [-0.22, 1.98], [-0.6, 1.95], [-0.67, 1.5], [-0.68, 1.05], [-0.86, 0.7], [-0.72, 1.02]]);
    const woman = shapeOf([[0.04, 0], [1.02, 0], [0.62, 1.2], [0.58, 1.45], [0.62, 1.86], [0.5, 1.96], [0.3, 1.96], [0.12, 1.9], [0.12, 1.78], [0.28, 1.8], [0.3, 1.45], [0.36, 1.2]]);
    const circ = (x, y, r, n = 10) => shapeOf(Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, y + Math.sin((i / n) * Math.PI * 2) * r]));
    const cg = merge([slab(man, 0.12, 0, 2), slab(woman, 0.12, 0, 2), slab(circ(-0.42, 2.18, 0.2), 0.12, 0, 2), slab(circ(0.44, 2.12, 0.18), 0.12, 0, 2), slab(circ(0.58, 2.25, 0.1, 8), 0.12, 0, 2)]);
    cg.scale(0.82, 0.82, 0.82); // music-box figurines: below eye level, the type stays readable
    s.couples = new THREE.InstancedMesh(cg, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.45, side: THREE.DoubleSide }), 24);
    s.pegs = new THREE.InstancedMesh(merge([new THREE.CylinderGeometry(0.12, 0.12, 0.36, 6).translate(0, 0.18, 0), new THREE.CylinderGeometry(0.42, 0.5, 0.1, 10).translate(0, 0.05, 0)]), steel, 24);
    s.couples.frustumCulled = false; s.pegs.frustumCulled = false;
    s.root.add(s.couples, s.pegs);
    s.cpl = [];
    for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) s.cpl.push({ k, i, phi: (i / 8) * Math.PI * 2 + k * (Math.PI / 8) + 0.2, tp: 70.61 + k * 0.17 + i * 0.025 });
    s.b0 = Math.max(0, kit.beatIndex(71.52 + 0.05));

    // ---- the velvet gloves (15 m, rust velvet, gold cuff buttons) ----
    const palmG = merge([new THREE.BoxGeometry(5.2, 5.6, 2.3), new THREE.BoxGeometry(4.6, 4.4, 0.7).translate(0, 0.3, -1.35), new THREE.CylinderGeometry(3.0, 2.7, 4.6, 8).translate(0, 5.1, 0), new THREE.CylinderGeometry(3.3, 3.3, 0.7, 8).translate(0, 7.3, 0)], true);
    const fingG = merge([new THREE.BoxGeometry(1.15, 4.9, 1.55).translate(0, -2.45, 0), new THREE.BoxGeometry(1.0, 1.1, 1.4).translate(0, -5.3, 0.1)], true);
    const velvet = kit.toon({ ramp: 'rust', rim: PAL.cyan, rimTh: 0.55, side: THREE.DoubleSide });
    s.palms = new THREE.InstancedMesh(palmG, velvet, 2);
    s.fingers = new THREE.InstancedMesh(fingG, velvet, 10);
    s.buttons = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), kit.toon({ ramp: 'gold', rim: null }), 6);
    for (const M of [s.palms, s.fingers, s.buttons]) { M.frustumCulled = false; s.L.add(M); }
    s.fingerDef = [[-1.95, -2.8, 0.1, 0], [-0.65, -2.8, 0.1, 0], [0.65, -2.8, 0.1, 0], [1.95, -2.8, 0.1, 0], [2.9, -0.6, 0.7, 1]];
    s.hideR = new THREE.Vector3(24, 40, -48); s.hideL = new THREE.Vector3(-4, 40, -24);
    s.pressL = new THREE.Vector3(1.5, FL + 7.9, LZ0 - 0.6); // in the gap between the two lyric blocks

    // ---- top spot (straight above) ----
    const spot = new THREE.Mesh(merge([new THREE.CircleGeometry(1.5, 20), new THREE.RingGeometry(1.9, 2.3, 24)]).rotateX(Math.PI / 2).translate(0, 32, -2), kit.flat({ color: PAL.cream, fog: 0, side: THREE.DoubleSide }));
    s.root.add(spot);

    // ---- lyric type ----
    s.velvet = kit.text('VELVET\nGLOVES', { cap: 0.95, color: 'gold', near: 68.58, out: 71.35, at: { d: 6, az: -23, y: 2.4 } });
    s.steelT = kit.text('ON A STEEL\nMACHINE', { cap: 0.85, color: 'cream', near: 69.18, out: 71.4, at: { d: 6.5, az: 23, y: 2.3 } });
    s.waltz = kit.text('WALTZING\nSLOW', { cap: 1.0, color: 'gold', near: 71.52, out: 76.89, outDur: 0.02, at: { d: 6.3, az: -22, y: 2.65 } });
    s.through = kit.text('THROUGH A\nLASER', { cap: 0.85, color: 'cream', near: 73.72, say: 'through a laser', out: 76.89, outDur: 0.02, at: { d: 6.5, az: 23, y: 2.6 } });
    // BEAM: glued along the laser line that crosses ~5.6 m ahead at 75.44, tilted with it
    const dB = s.prof.d(75.44), zl0 = -5.6 - dB;
    let best = null;
    beams.forEach((bm) => {
      const [ax, ay, az] = bm.a, [bx, by, bz] = bm.b;
      if ((az - zl0) * (bz - zl0) > 0) return;
      const u = (zl0 - az) / (bz - az), x = ax + (bx - ax) * u;
      const score = Math.abs(x - 1.8);
      if (!best || score < best.score) best = { score, x, y: ay + (by - ay) * u, dx: bx - ax, dy: by - ay, dz: bz - az };
    });
    s.beam = kit.text('BEAM', { cap: 0.85, color: 'cream', near: 75.44, vAlign: 'baseline', pop: true, dur: 0.18, out: 76.89, outDur: 0.02, parent: s.L });
    if (best) {
      let { dx, dy, dz } = best; if (dx < 0) { dx = -dx; dy = -dy; dz = -dz; }
      s.beam.mesh.position.set(best.x, best.y + 0.05, zl0);
      s.beam.mesh.rotation.set(0, Math.atan2(-dz, dx), Math.atan2(dy, Math.hypot(dx, dz)), 'YXZ');
    }
    // segments that blink off where a couple crosses a beam (precomputed: everything is deterministic)
    s.blinkIdx = BLINKS.map((tb) => {
      const out = [], dd = s.prof.d(tb);
      const P = s.cpl.map((c) => { const a = c.phi + RINGS[c.k].dir * s.ringRot[c.k].d(tb) * D2R; return [Math.sin(a) * RINGS[c.k].r, -Math.cos(a) * RINGS[c.k].r]; });
      segs.forEach((g, i) => { const z = g.z + dd; for (const [px, pz] of P) if (Math.hypot(g.x - px, z - pz) < 1.0) { out.push(i); break; } });
      return out;
    });
    s.blinkOn = -1;
    return s;
  },

  update(t, s, kit) {
    const on = t >= 67.74;
    s.root.visible = on;
    if (!on) return;
    const A = s.A, B = s.Bo, m = s.m;
    const d = s.prof.d(t);
    s.L.position.z = d;

    // in: S08's edge lines become steel
    kit.edge(1 - sm(68.05, 68.5, t));
    s.edges.u.uOn.value = 1 - sm(68.15, 68.58, t);

    // the machine: crank (one turn per bar), cylinder, comb teeth flashing every 8th note
    s.crankG.rotation.x = s.crankRot.d(t);
    s.cylG.rotation.x = -s.cylRot.d(t);
    const playing = t >= 70.04 && t < 76.5;
    if (playing || s.combLit) {
      const n8 = Math.floor((t - 70.04) / (BEAT / 2)), t8 = 70.04 + n8 * (BEAT / 2), f = Math.exp(-(t - t8) * 9);
      const a = s.teeth.instanceColor.array;
      for (let i = 0; i < 40; i++) {
        const lit = playing && (hash(i * 31 + n8 * 7) < 0.1 || i === (n8 * 7) % 40) ? f : 0;
        a[i * 3] = 1 + 1.2 * lit; a[i * 3 + 1] = 1 + 2.2 * lit; a[i * 3 + 2] = 1 + 2.4 * lit;
      }
      s.teeth.instanceColor.needsUpdate = true;
      s.combLit = playing;
    }

    // couples: pop up on their pegs, revolve in rings, hard turn every 3rd beat (waltz against the 4/4)
    const bi = kit.beatIndex(t), k3 = bi - s.b0;
    let steps = 0, sway = 0;
    if (k3 >= 0 && t >= 71.4) {
      const n = Math.floor(k3 / 3), tb = kit.beats[s.b0 + 3 * n] ?? t;
      const e = sm(tb, tb + 0.16, t);
      steps = n + e;
      const sg = n % 2 ? 1 : -1;
      sway = -sg + 2 * sg * e;
    }
    s.cpl.forEach((c, i) => {
      const RG = RINGS[c.k];
      const a = c.phi + RG.dir * s.ringRot[c.k].d(t) * D2R;
      const pop = Math.max(0.0001, sm(c.tp, c.tp + 0.12, t) * 1.1 - 0.1 * sm(c.tp + 0.12, c.tp + 0.24, t));
      const x = Math.sin(a) * RG.r, z = -Math.cos(a) * RG.r;
      A.position.set(x, FL + 0.36, z); A.rotation.set(0, -a + steps * Math.PI + (c.k % 2 ? Math.PI : 0), 0); A.scale.set(1, pop, 1); A.updateMatrix(); s.couples.setMatrixAt(i, A.matrix);
      A.position.set(x, FL, z); A.rotation.set(0, 0, 0); A.scale.set(1, Math.max(0.0001, sm(c.tp - 0.1, c.tp, t)), 1); A.updateMatrix(); s.pegs.setMatrixAt(i, A.matrix);
    });
    s.couples.instanceMatrix.needsUpdate = true; s.pegs.instanceMatrix.needsUpdate = true;
    s.waltz.mesh.rotation.z = 0.07 * sway;

    // lasers: snap on at "laser"; segments blink off where couples slip through
    const lz = t >= 74.62;
    s.laser.visible = lz;
    s.laser.material.uniforms.uBright.value = 1 + 1.4 * env(t, 74.62, 6);
    let bk = -1;
    BLINKS.forEach((tb, j) => { if (t >= tb && t < tb + 0.16) bk = j; });
    if (bk !== s.blinkOn) {
      if (s.blinkOn >= 0) for (const i of s.blinkIdx[s.blinkOn]) s.laser.setMatrixAt(i, s.segMat[i]);
      if (bk >= 0) { m.makeScale(0, 0, 0); for (const i of s.blinkIdx[bk]) s.laser.setMatrixAt(i, m); }
      s.laser.instanceMatrix.needsUpdate = true;
      s.blinkOn = bk;
    }

    // the velvet gloves: descend (68.58, eased 1.2 s), grip/turn the crank and press the lid, lift (76.34)
    const desc = sm(68.58, 69.8, t), lift = sm(76.34, 77.2, t) * 40;
    const ca = s.crankRot.d(t);
    const hx = CRANK[0] + 1.8, hy = CRANK[1] + 4.5 * Math.cos(ca), hz = CRANK[2] + 4.5 * Math.sin(ca);
    const spread = 0.28 * sm(68.7, 69.6, t), grip = sm(69.85, 70.15, t);
    for (let g = 0; g < 2; g++) {
      const right = g === 0;
      if (right) B.position.set(hx + 0.4, hy + 6.1, hz).lerp(s.hideR, 1 - desc);
      else B.position.copy(s.pressL).lerp(s.hideL, 1 - desc);
      if (!right) B.position.y -= 0.8 * sm(70.04, 70.3, t);
      B.position.y += lift;
      B.rotation.set(right ? 0.18 : 0.3, right ? -0.5 : 0.6, right ? 0.1 : -0.1);
      B.scale.set(right ? 1 : -1, 1, 1);
      B.updateMatrix();
      s.palms.setMatrixAt(g, B.matrix);
      s.fingerDef.forEach(([fx, fy, fz, th], f) => {
        A.position.set(fx, fy, fz);
        const curl = right ? 1.05 * grip : 0.15;
        if (th) A.rotation.set(0.3 * curl, 0, 0.75 + 0.3 * spread); else A.rotation.set(curl, 0, (fx / 2) * -spread);
        A.scale.set(th ? 0.85 : 1, th ? 0.85 : 1, th ? 0.85 : 1); A.updateMatrix();
        m.multiplyMatrices(B.matrix, A.matrix); s.fingers.setMatrixAt(g * 5 + f, m);
      });
      for (let k = 0; k < 3; k++) { A.position.set(-1 + k, 5.4, 2.95); A.rotation.set(0, 0, 0); A.scale.set(1, 1, 1); A.updateMatrix(); m.multiplyMatrices(B.matrix, A.matrix); s.buttons.setMatrixAt(g * 3 + k, m); }
    }
    s.palms.instanceMatrix.needsUpdate = true; s.fingers.instanceMatrix.needsUpdate = true; s.buttons.instanceMatrix.needsUpdate = true;

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wheelSpin = d / 0.075;
      if (t >= 76.86) rs.dark = 1;
    }
  },

  events() {
    return [
      { t: 68.58, sfx: 'whoosh', gain: 0.4 },
      { t: 70.04, sfx: 'motor', gain: 0.4, haptic: [0.2, 60] },
      { t: 70.61, sfx: 'pneumatic', gain: 0.35 },
      { t: 74.62, sfx: 'switch', gain: 0.5 },
      { t: 76.34, sfx: 'lid', gain: 0.4 },
    ];
  },
};
