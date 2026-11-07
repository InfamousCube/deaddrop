// S09 The safe and the lasers (67.95 to 77.30, cold with rust). Round 3, STORYBOARD-v3.
// SHOT CARD
//   A 67.95-71.9 HERO a giant bank safe (6.4 m) at the back of a steel vault: rounded body, recessed door,
//                combination dial with a cyan ring, 4 cyan ticks and a knurled knob, 3-spoke handle, barrel
//                hinges, cornice and feet. A long black velvet opera glove (rust cuff) reaches in from the
//                right and turns the dial (right on "velvet", left on "gloves", ... right on "machine"),
//                then the handle; the door swings open (hinged left). AROUND riveted steel panels on both
//                sides, steel beams overhead.
//   B 71.9-76.6  You glide through the safe: beyond it a corridor of riveted panels with ten rust laser
//                beams from brass-hooded emitters; she (gown, bob, long gloves, glasses) waltzes slowly
//                between them; the beams sway in 3/4. Her fingertip touches one beam (76.08), it flares,
//                and all lasers go out (76.6): black until S10's red light.
//   PALETTE  black and petrol steel with cyan rims; rust lasers and the glove's cuff are the only warm.
//   LYRICS   one block at a time, left of the dial (az -18, d 4.4).
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, BEAT, sm, env, clamp01, wt, xf, merge, lathe, ext, tube, cyl, shapeOf, roundRect, ringShape, gearGeo, ladyParts } from './scenes-2-util.js';

const T0 = 67.95, T1 = 77.3;
const GY = -1.6, SF = -8.5, SD = 1.8, SB = SF - SD;
const OW = 3.4, OH = 4.8, OY = 1.5;                 // passage through the safe (centre y)
const KEY = [0.35, 0.65, 0.67];
const BEAMS = [ // emitter side, z, emitter height, base angle (deg), sway (deg), phase
  [-1, -12.6, -0.9, -4, 4, 0], [1, -13.4, 3.9, 8, 5, 1], [-1, -14.3, 0.6, 18, 10, 2], [1, -15.2, 3.0, -25, 10, 3],
  [-1, -16.6, 0.55, 0, 0, 0], [1, -17.9, 2.4, 20, 12, 4], [-1, -18.9, 3.4, -15, 8, 5], [1, -20.1, 0.2, 12, 9, 6],
  [-1, -21.3, 1.8, -10, 10, 1], [1, -22.6, 3.6, -20, 6, 2],
];
const TOUCH = 4;

export const S09 = {
  id: 'S09', t0: 67.95, t1: 77.3, world: 'cold', pre: 0.5, post: 0,
  key: KEY,
  fog: { color: PAL.black, near: 14, far: 48 },
  sky: 'black',
  build(kit) {
    const s = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), v2: new THREE.Vector3(), sc: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
    s.velvet = wt(kit, 'velvet gloves on a steel machine', 68.58, 0); s.gloves = wt(kit, 'velvet gloves on a steel machine', 68.58, 1);
    s.on = wt(kit, 'velvet gloves on a steel machine', 68.58, 2); s.steel = wt(kit, 'velvet gloves on a steel machine', 68.58, 4);
    s.machine = wt(kit, 'velvet gloves on a steel machine', 68.58, 5);
    s.waltz = wt(kit, 'waltzing slow', 71.8, 0);
    s.touch = 76.08; s.out = 76.6;
    s.prof = kit.travel([[67.0, 2.1, 0.01], [T0, 0.15, 1.2], [71.65, 2.0, 1.0], [73.3, 1.5, 1.0], [75.4, 0.3, 1.0]]);
    const W = (s.W = new THREE.Group());
    kit.group.add(W);
    const steel = kit.toon({ ramp: 'steel', rim: PAL.cyan, key: KEY });
    const cold = kit.toon({ ramp: 'cold', rim: PAL.cyan, key: KEY });
    const black = kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY });
    s.lit = [];

    // ---- the vault: riveted steel panels, beams overhead, floor, back wall with the passage -------------
    const panelG = ext(roundRect(2.1, 3.7, 0.12), 0.16, 0.05, 3);
    const P = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) P.push([sx * 6, GY + 2 + j * 3.9, -2.6 - i * 2.2, sx]);
    for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) P.push([sx * 3.5, GY + 2 + j * 3.9, SB - 1.3 - i * 2.2, sx]);
    s.panels = new THREE.InstancedMesh(panelG, steel, P.length);
    P.forEach(([x, y, z, sx], i) => s.panels.setMatrixAt(i, s.m.compose(s.v.set(x, y, z), s.q.setFromAxisAngle(s.up, -sx * Math.PI / 2), s.sc.set(1, 1, 1))));
    const bars = [], riv = [];
    for (const sx of [-1, 1]) for (const y of [GY + 2, GY + 5.9]) {
      bars.push(new THREE.BoxGeometry(0.1, 0.3, 9).translate(sx * 5.88, y, -5.9));
      bars.push(new THREE.BoxGeometry(0.1, 0.3, 15.4).translate(sx * 3.38, y, SB - 7.7));
      for (let k = 0; k < 6; k++) riv.push([sx * 5.8, y, -2.2 - k * 1.5]);
      for (let k = 0; k < 10; k++) riv.push([sx * 3.3, y, SB - 0.8 - k * 1.5]);
    }
    s.rivets = new THREE.InstancedMesh(xf(new THREE.SphereGeometry(0.14, 6, 4), [0, 0, 0], [0, 0, 0], [0.6, 1, 1]), cold, riv.length);
    riv.forEach(([x, y, z], i) => s.rivets.setMatrixAt(i, s.m.makeTranslation(x, y, z)));
    s.rivets.visible = false; // rivets read as specks at corridor distance; the strap bars carry the panel rhythm
    const ib = shapeOf([[-0.4, -0.5], [0.4, -0.5], [0.4, -0.36], [0.1, -0.36], [0.1, 0.36], [0.4, 0.36], [0.4, 0.5], [-0.4, 0.5], [-0.4, 0.36], [-0.1, 0.36], [-0.1, -0.36], [-0.4, -0.36]]);
    const backS = shapeOf([[-6.2, GY], [6.2, GY], [6.2, 6.6], [-6.2, 6.6]]);
    backS.holes.push(shapeOf([[-OW / 2 + 0.05, OY - OH / 2], [-OW / 2 + 0.05, OY + OH / 2], [OW / 2 - 0.05, OY + OH / 2], [OW / 2 - 0.05, OY - OH / 2]]));
    const shell = merge([
      new THREE.PlaneGeometry(12.4, 30).rotateX(-Math.PI / 2).translate(0, GY, -16.6),
      new THREE.PlaneGeometry(12.4, 9).rotateX(Math.PI / 2).translate(0, 6.6, -6.1),
      ...[-1, 1].map((sx) => new THREE.PlaneGeometry(9, 8.2).rotateY(-sx * Math.PI / 2).translate(sx * 6.15, GY + 4.1, -6.1)),
      ...[-1, 1].map((sx) => new THREE.PlaneGeometry(16, 6.2).rotateY(-sx * Math.PI / 2).translate(sx * 3.55, GY + 3.1, SB - 8)),
      new THREE.ShapeGeometry(backS).translate(0, 0, SB - 0.05),
      new THREE.PlaneGeometry(8, 7).translate(0, GY + 3.5, -26),
      new THREE.PlaneGeometry(7.2, 16).rotateX(Math.PI / 2).translate(0, 4.6, SB - 8),
    ]);
    s.shell = new THREE.Mesh(shell, kit.flat({ color: PAL.petrolDeep }));
    s.beamsOver = new THREE.Mesh(merge([-3.0, -5.6, -8.0].map((z) => xf(ext(ib, 12.2, 0.04, 1), [0, 5.9, z], [0, Math.PI / 2, 0]))), black);
    W.add(s.panels, s.rivets, new THREE.Mesh(merge(bars), steel), s.shell, s.beamsOver);

    // ---- the safe ---------------------------------------------------------------------------------
    const front = roundRect(4.6, 6.4, 0.38, 0, 1.9);
    front.holes.push(roundRect(OW, OH, 0.1, 0, OY, new THREE.Path()));
    const recess = roundRect(OW + 0.42, OH + 0.42, 0.18, 0, OY);
    recess.holes.push(roundRect(OW, OH, 0.1, 0, OY, new THREE.Path()));
    const body = [
      ext(front, SD, 0.08, 6).translate(0, 0, SF - SD / 2),
      ext(recess, 0.14, 0.05, 6).translate(0, 0, SF + 0.06),
      ext(roundRect(4.95, 0.42, 0.12, 0, 5.12), 0.5, 0.05, 3).translate(0, 0, SF - 0.12),
      ext(roundRect(4.85, 0.3, 0.08, 0, -1.25), 0.4, 0.04, 3).translate(0, 0, SF - 0.1),
      ...[-1.9, 1.9].flatMap((x) => [SF - 0.35, SB + 0.35].map((z) => lathe([[0, 0], [0.26, 0], [0.3, 0.06], [0.2, 0.22], [0.24, 0.3], [0, 0.3]], 12).translate(x, GY, z))),
      ...[-1.6, 1.6].flatMap((y) => [xf(cyl(0.26, 0.26, 1.1, 14), [-OW / 2 - 0.2, OY + y, SF + 0.14]), xf(cyl(0.12, 0.12, 1.5, 8), [-OW / 2 - 0.2, OY + y, SF + 0.14])]),
    ];
    W.add(new THREE.Mesh(merge(body), steel));
    // the door (pivot at its left edge), dial, handle
    s.hinge = new THREE.Group();
    s.hinge.position.set(-OW / 2, OY, SF);
    W.add(s.hinge);
    const doorG = merge([ext(roundRect(OW - 0.06, OH - 0.06, 0.1, OW / 2, 0), 0.34, 0.05, 3).translate(0, 0, -0.2), ext(roundRect(OW - 0.8, OH - 0.9, 0.12, OW / 2, -0.15), 0.1, 0.04, 3).translate(0, 0, 0.0)]);
    s.hinge.add(new THREE.Mesh(doorG, cold));
    s.dial = new THREE.Group();
    s.dial.position.set(OW / 2, 0.9, 0.07);
    s.dial.scale.setScalar(1.65); // Round 4: a big combination dial in the middle of a bolt ring (was 0.45 m, lost on the door)
    const ticks = [];
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ticks.push(xf(new THREE.BoxGeometry(0.07, 0.17, 0.03), [Math.cos(a) * 0.39, Math.sin(a) * 0.39, 0.06], [0, 0, a - Math.PI / 2])); }
    ticks.push(new THREE.RingGeometry(0.31, 0.345, 40).translate(0, 0, 0.06));
    s.dial.add(new THREE.Mesh(xf(lathe([[0, 0.05], [0.45, 0.05], [0.47, 0.02], [0.45, -0.02], [0, -0.02]], 28), [0, 0, 0], [Math.PI / 2, 0, 0]), black));
    s.dial.add(new THREE.Mesh(merge(ticks), kit.flat({ color: PAL.cyan })));
    s.dial.add(new THREE.Mesh(gearGeo({ r: 0.22, teeth: 18, th: 0.035, thick: 0.18, spokes: 0, hub: 0.08, bolts: 0, bevel: 0.015 }).translate(0, 0, 0.14), steel));
    s.hinge.add(s.dial);
    s.hinge.add(new THREE.Mesh(new THREE.ShapeGeometry(shapeOf([[-0.14, 0.98], [0, 0.8], [0.14, 0.98]])).translate(OW / 2, 0.9, 0.12), kit.flat({ color: PAL.cream })));
    // the bolt ring round the dial: a steel band with 10 chunky bolt heads (they pull in when the handle turns)
    s.hinge.add(new THREE.Mesh(ext(ringShape(1.0, 1.42, 48), 0.06, 0.02, 2).translate(OW / 2, 0.9, 0.0), steel));
    s.boltRing = new THREE.Group(); s.boltRing.position.set(OW / 2, 0.9, 0.05);
    s.boltRing.add(new THREE.Mesh(merge(Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2 + Math.PI / 10; return xf(cyl(0.13, 0.13, 0.2, 10), [Math.cos(a) * 1.21, Math.sin(a) * 1.21, 0.08], [Math.PI / 2, 0, 0]); })), kit.toon({ ramp: [PAL.petrol, PAL.teal, PAL.cyan], rim: PAL.white, key: KEY })));
    s.hinge.add(s.boltRing);
    s.handle = new THREE.Group();
    s.handle.position.set(OW / 2, -1.35, 0.1);
    s.handle.scale.setScalar(1.4);
    const hd = [xf(cyl(0.13, 0.13, 0.25, 12), [0, 0, 0.05], [Math.PI / 2, 0, 0])];
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; hd.push(xf(cyl(0.045, 0.045, 0.55, 6), [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.12], [0, 0, a - Math.PI / 2])); hd.push(new THREE.SphereGeometry(0.09, 8, 6).translate(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.12)); }
    s.handle.add(new THREE.Mesh(merge(hd), kit.toon({ ramp: [PAL.petrol, PAL.teal, PAL.cyan], rim: PAL.white, key: KEY })));
    s.hinge.add(s.handle);

    // ---- the glove (black velvet opera glove, rust cuff, bare upper arm) -------------------------------
    s.glove = new THREE.Group();
    const vel = kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.cyan, rimAmt: 1, key: KEY });
    const handG = merge([
      xf(ext(roundRect(0.36, 0.3, 0.1), 0.13, 0.035, 3), [0.42, 0, 0.22]),
      ...[0.105, 0.035, -0.035, -0.105].map((y, k) => xf(new THREE.CapsuleGeometry(0.047, 0.2 - Math.abs(k - 1.5) * 0.03, 3, 8), [0.14, y, 0.17], [0, -0.55, Math.PI / 2])),
      xf(new THREE.CapsuleGeometry(0.05, 0.16, 3, 8), [0.24, -0.19, 0.2], [0, -0.3, Math.PI / 2 + 0.6]),
      tube([[0.58, 0, 0.22], [1.4, -0.22, 0.32], [2.5, -0.6, 0.42], [3.3, -0.85, 0.46]], 0.12, 16, 8),
    ]);
    s.glove.add(new THREE.Mesh(handG, vel));
    s.glove.add(new THREE.Mesh(xf(lathe([[0.12, 0], [0.17, 0.12], [0.2, 0.2], [0.17, 0.2], [0.11, 0.06]], 14), [3.3, -0.85, 0.46], [0, 0, -Math.PI / 2 + 0.3]), kit.toon({ ramp: 'rust', rim: PAL.orange, key: KEY, side: THREE.DoubleSide })));
    s.glove.add(new THREE.Mesh(tube([[3.42, -0.88, 0.46], [4.5, -1.15, 0.3], [5.7, -1.05, -0.3]], 0.13, 12, 8), kit.toon({ ramp: 'cream', rim: PAL.cyan, key: KEY })));
    s.glove.scale.setScalar(1.9);
    W.add(s.glove);

    // ---- laser emitters, beams (core + halo) ------------------------------------------------------
    const emG = merge([lathe([[0, 0], [0.13, 0], [0.13, 0.32], [0.2, 0.42], [0.24, 0.52], [0.19, 0.52], [0.12, 0.42], [0, 0.42]], 12), xf(new THREE.BoxGeometry(0.3, 0.3, 0.3), [0, -0.1, 0])]);
    s.emit = new THREE.InstancedMesh(emG, cold, BEAMS.length);
    s.core = new THREE.InstancedMesh(cyl(0.045, 0.045, 1, 6).translate(0, 0.5, 0), kit.flat({ color: PAL.white }), BEAMS.length);
    s.halo = new THREE.InstancedMesh(cyl(0.15, 0.15, 1, 8).translate(0, 0.5, 0), kit.flat({ color: PAL.rust, additive: true, opacity: 0.55, depthWrite: false }), BEAMS.length);
    s.cc = new THREE.Color(); s.cw = new THREE.Color(PAL.white);
    for (let i = 0; i < BEAMS.length; i++) s.core.setColorAt(i, s.cc.set(PAL.orange));
    for (const o of [s.emit, s.core, s.halo, s.panels, s.rivets]) o.frustumCulled = false;
    W.add(s.emit, s.core, s.halo);

    // ---- Round 4: what the lasers guard: a fluted pedestal with a cut diamond under a cyan spot at the corridor's
    //      end, three uniform security cameras aimed at it, and laser X's on both side walls of the vault room
    //      (5.4 m out) that you glide past on "waltzing"
    const PZ = -24.6, PTOP = GY + 2.1;
    W.add(new THREE.Mesh(lathe([[0, 0], [0.8, 0], [0.8, 0.2], [0.62, 0.28], [0.46, 0.4], [0.4, 0.5], [0.4, 1.75], [0.5, 1.85], [0.66, 1.95], [0.66, 2.1], [0, 2.1]], 16).translate(0, GY, PZ), steel));
    s.gem = new THREE.Mesh(lathe([[0, 0], [0.48, 0.44], [0.42, 0.54], [0.26, 0.62], [0, 0.62]], 8).toNonIndexed().scale(1.2, 1.2, 1.2), kit.toon({ ramp: [PAL.teal, PAL.cyan, PAL.white], rim: PAL.white, key: KEY }));
    s.gem.geometry.computeVertexNormals();
    s.gem.position.set(0, PTOP + 0.02, PZ);
    s.spot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.15, 4.6 - PTOP - 0.75, 18, 1, true).translate(0, (4.6 + PTOP + 0.75) / 2, PZ), kit.flat({ color: PAL.cyan, additive: true, opacity: 0.16, depthWrite: false }));
    W.add(s.gem, s.spot);
    const camG = merge([ext(roundRect(0.46, 0.4, 0.08), 0.8, 0.04, 2).translate(0, 0, -0.5), xf(cyl(0.15, 0.15, 0.25, 12), [0, 0, 0.38], [Math.PI / 2, 0, 0]), ext(shapeOf([[-0.3, 0.24], [0.3, 0.24], [0.26, 0.3], [-0.26, 0.3]]), 1.0, 0, 1).translate(0, 0, -0.55)]);
    const cams = new THREE.InstancedMesh(camG, cold, 3), stalks = [], o3 = new THREE.Object3D();
    [[-2.9, 3.9, -13.6], [2.9, 3.9, -18.4], [-2.9, 3.9, -22.0]].forEach(([x, y, z], i) => {
      o3.position.set(x, y, z); o3.lookAt(0, PTOP + 0.4, PZ); o3.updateMatrix(); cams.setMatrixAt(i, o3.matrix);
      stalks.push(xf(cyl(0.06, 0.06, 4.6 - y, 6), [x, (4.6 + y) / 2, z]));
    });
    cams.frustumCulled = false;
    W.add(cams, new THREE.Mesh(merge(stalks), black));
    const SB2 = [];
    for (const sx of [-1, 1]) for (const [za, zb] of [[-0.6, -4.4], [-4.4, -0.6], [-2.8, -6.6], [-6.6, -2.8]]) SB2.push([sx * 5.4, GY + 0.4, za, sx * 5.4, GY + 5.6, zb]);
    s.sideCore = new THREE.InstancedMesh(cyl(0.075, 0.075, 1, 6).translate(0, 0.5, 0), kit.flat({ color: PAL.orange }), SB2.length);
    s.sideHalo = new THREE.InstancedMesh(cyl(0.16, 0.16, 1, 8).translate(0, 0.5, 0), kit.flat({ color: PAL.rust, additive: true, opacity: 0.5, depthWrite: false }), SB2.length);
    SB2.forEach(([x0, y0, z0, x1, y1, z1], i) => {
      s.v2.set(x1 - x0, y1 - y0, z1 - z0); const len = s.v2.length(); s.v2.normalize(); s.q.setFromUnitVectors(s.up, s.v2);
      s.m.compose(s.v.set(x0, y0, z0), s.q, s.sc.set(1, len, 1)); s.sideCore.setMatrixAt(i, s.m); s.sideHalo.setMatrixAt(i, s.m);
    });
    s.sideCore.frustumCulled = s.sideHalo.frustumCulled = false;
    W.add(s.sideCore); // one chunky core per beam (a halo doubled every line)

    // ---- the dancer --------------------------------------------------------------------------------
    const LP = ladyParts();
    s.lady = new THREE.Group();
    s.lady.add(new THREE.Mesh(LP.gown, kit.toon({ ramp: 'black', rim: PAL.cyan, rimAmt: 1, key: KEY })));
    s.lady.add(new THREE.Mesh(LP.skin, kit.toon({ ramp: 'cream', rim: PAL.cyan, key: KEY })));
    s.lady.add(new THREE.Mesh(LP.black, kit.toon({ ramp: 'black', rim: PAL.cyan, rimAmt: 1, key: KEY })));
    s.lady.add(new THREE.Mesh(LP.glasses, kit.flat({ color: PAL.white })));
    s.lady.scale.setScalar(1.4);
    W.add(s.lady);

    // ---- lyrics ------------------------------------------------------------------------------------
    const L = { d: 4.4, az: -18, y: 0.35 };
    kit.text('VELVET GLOVES', { cap: 0.56, color: 'cream', colors: { 0: 'rust' }, near: 68.58, out: s.on - 0.1, outDur: 0.08, at: L });
    kit.text('ON A STEEL\nMACHINE', { cap: 0.58, color: 'cream', near: 69.18, out: 71.2, outDur: 0.2, at: L });
    kit.text('WALTZING\nSLOW', { cap: 0.62, color: 'gold', near: 71.8, out: 73.6, outDur: 0.08, depthTest: false, at: L });
    kit.text('THROUGH A\nLASER BEAM', { cap: 0.56, color: 'cream', colors: { 2: 'rust' }, near: 73.72, out: 76.3, outDur: 0.25, depthTest: false, at: { d: 4.4, az: -25, y: 0.2 } }); // low left over the dark floor: clear of her silhouette and the beam crossing
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;
    const { m, q, v, v2, sc } = s;
    // the dial: right on "velvet", left on "gloves", small turns on "on a steel", right on "machine"
    const dialA = -1.7 * sm(s.velvet, s.velvet + 0.09, t) + 2.6 * sm(s.gloves, s.gloves + 0.4, t)
      - 0.7 * sm(s.on, s.on + 0.25, t) + 0.5 * sm(s.steel, s.steel + 0.2, t) - 1.5 * sm(s.machine, s.machine + 0.25, t);
    s.dial.rotation.z = dialA;
    // the handle turns, the door swings open toward you on its left hinge
    const hTurn = sm(70.82, 71.05, t);
    s.handle.rotation.z = -1.1 * hTurn;
    const open = sm(71.05, 71.95, t);
    s.hinge.rotation.y = -1.62 * open;
    // the glove: reaches in, grips the dial, moves to the handle, turns it, withdraws to the right
    const inK = sm(68.15, s.velvet - 0.02, t), toH = sm(70.45, 70.75, t), outK = sm(71.02, 71.5, t);
    s.glove.visible = inK > 0.001 && outK < 0.999;
    s.glove.position.set((1 - inK) * 2.6 + outK * 3.2, OY + 0.9 - 2.25 * toH, SF + 0.13);
    s.boltRing.scale.setScalar(1 - 0.12 * hTurn);
    s.glove.rotation.z = 0.04 * Math.sin(dialA * 2) - 0.06 * hTurn * (1 - outK);
    // lasers: light up far to near on "waltzing", sway in 3/4, the touched beam flares, all out at 76.6
    const lit = sm(s.waltz, s.waltz + 0.5, t);
    const on = t >= s.waltz && t < s.out;
    s.core.visible = s.halo.visible = s.sideCore.visible = s.sideHalo.visible = on;
    s.gem.rotation.y = t * 0.5;
    s.spot.visible = t >= s.waltz && t < s.out;
    s.shell.material.uniforms.uBright.value = 0.55 + 0.6 * lit;
    BEAMS.forEach(([sx, z, ye, b0, A, ph], i) => {
      const bOn = t >= s.waltz + (BEAMS.length - 1 - i) * 0.05 ? 1 : 0;
      const sway = A * Math.sin((2 * Math.PI * (t - s.waltz)) / (3 * BEAT) + ph) * (t < s.touch ? 1 : 0.2);
      const b = (b0 + sway) * D2R;
      v.set(-sx * Math.cos(b), Math.sin(b), 0);
      q.setFromUnitVectors(s.up, v);
      v2.set(sx * 3.32, ye, z);
      s.emit.setMatrixAt(i, m.compose(v2, q, sc.set(1, 1, 1)));
      const flare = i === TOUCH ? 1 + 1.8 * clamp01((t - s.touch) / 0.3) : 1;
      const len = bOn * 10;
      s.core.setMatrixAt(i, m.compose(v2, q, sc.set(flare, Math.max(0.001, len), flare)));
      s.halo.setMatrixAt(i, m.compose(v2, q, sc.set(flare, Math.max(0.001, len), flare)));
      if (i === TOUCH) s.core.setColorAt(i, s.cc.set(PAL.orange).lerp(s.cw, clamp01((t - s.touch) / 0.25)));
    });
    for (const o of [s.emit, s.core, s.halo]) o.instanceMatrix.needsUpdate = true;
    if (s.core.instanceColor) s.core.instanceColor.needsUpdate = true;
    // the dancer: a slow waltz turn on a small circle; she stops with her right hand in the beam
    s.lady.visible = t >= s.waltz - 0.1;
    const tw = Math.min(t, s.touch);
    const w = (2 * Math.PI) / (6 * BEAT);
    s.lady.position.set(0.3 * Math.sin(w * (tw - s.touch)), GY, -17.4 + 0.3 * Math.cos(w * (tw - s.touch)));
    s.lady.rotation.y = -Math.PI / 2 + w * (tw - s.touch);
    s.lady.position.y = GY + 0.04 * Math.abs(Math.sin((Math.PI * (tw - s.waltz)) / BEAT));
    // lights out
    kit.fade(1 - sm(s.out, s.out + 0.35, t));
  },
  events() {
    return [
      { t: 68.58, sfx: 'key', gain: 0.4 }, { t: 68.68, sfx: 'key', gain: 0.35 }, { t: 70.38, sfx: 'key', gain: 0.4 },
      { t: 70.82, sfx: 'lid', gain: 0.5 }, { t: 71.1, sfx: 'lidOpen', gain: 0.5, haptic: [0.3, 90] },
      { t: 72.03, sfx: 'switch', gain: 0.4 }, { t: 76.6, sfx: 'shutter', gain: 0.6, haptic: [0.5, 60] },
    ];
  },
};
