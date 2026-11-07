// S07 The gold foundry (47.40 to 56.30, hot). Round 3, STORYBOARD-v3.
// SHOT CARD
//   HERO     the hall of the secret gold foundry: two roller conveyors bring rows of gold angel statues
//            toward you (robe, folded stepped wings, bob, folded hands, halo); crucibles (steelworks
//            ladles on gold crane cables) tip and pour gold into glowing floor channels.
//   AROUND   statues pass at 5 m on both sides; furnace mouths (arched, flames) along both walls at
//            12.5 m; crucibles and crane rails overhead (they pour toward the walls, never above you);
//            steel roof trusses; at the vanishing point the end arch with the vault door ring.
//   BEATS    47.48 "Gold": crimson flash, furnaces ignite near to far, the first crucible pours;
//            "wire": the crane cables light up gold; "fire": flames leap, sunburst rays fill the end
//            arch wedge by wedge until "sky"; "smile": the cream faces light; "angel": halos flash in a
//            wave; the conveyors halt; "lie": the statue on the right turns her head to you, red
//            glasses; "a spy": her halo tips and drops onto her head as a black hat brim.
//   OUT      BODY WIPE: two 12 m statues slide in from the sides and close the view, then part on
//            the bomb (post 0.45, only they stay).
//   PALETTE  black hall, crimson furnaces, gold metal and statues, cream faces.
//   LYRICS   one block at a time over the dark aisle, az -10, d 8.
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, sm, env, clamp01, wt, xf, merge, lathe, ext, tube, cyl, shapeOf, archPts, angelParts } from './scenes-2-util.js';

const T0 = 47.4, T1 = 56.3;
const GY = -2.2;          // floor
const CY = -1.0;          // conveyor top (statues stand here)
const CX = 5;             // conveyor x
const SC = 1.3;           // statue scale (3.4 m)
const VC = 1.5;           // conveyor speed toward you
const WX = 12.6;          // furnace wall x
const KEY = [0.25, 0.75, 0.6];
const NROW = 10, SPACE = 8.5;

export const S07 = {
  id: 'S07', t0: 47.4, t1: 56.3, world: 'hot', pre: 0, post: 0.45,
  key: KEY,
  fog: { color: PAL.velvet, near: 12, far: 48 },
  sky: { rays: 0, rings: 0, zen: PAL.velvet, hor2: PAL.carmineDeep, hor: PAL.carmine },
  flashes: [{ t: 47.48, color: PAL.crimson, dur: 0.03 }],
  build(kit) {
    const s = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), sc: new THREE.Vector3(), c: new THREE.Color(), c2: new THREE.Color() };
    s.gold = wt(kit, 'gold on the wire', 47.48, 0); s.wire = wt(kit, 'gold on the wire', 47.48, 3);
    s.fire = wt(kit, 'fire in the sky', 49.34, 0); s.sky = wt(kit, 'fire in the sky', 49.34, 3);
    s.smile = wt(kit, 'smile like an angel', 51.44, 0); s.angel = wt(kit, 'smile like an angel', 51.44, 3);
    s.lie = wt(kit, 'lie like a spy', 53.98, 0); s.a = wt(kit, 'lie like a spy', 53.98, 2); s.spy = wt(kit, 'lie like a spy', 53.98, 3);
    s.prof = kit.travel([[T0, 2.2, 0.01], [T0 + 0.1, 2.5, 1.0], [s.lie - 0.6, 0.5, 1.0]]);
    // conveyor travel: 1.5 m/s, halts just before "lie"
    s.conv = kit.travel([[T0 - 20, VC, 0.01], [s.lie - 0.95, 0, 1.0]]);
    s.cv0 = s.conv.d(T0);
    const W = (s.W = new THREE.Group());
    kit.group.add(W);
    const black = kit.toon({ ramp: 'black', rim: PAL.gold, key: KEY });
    const goldM = kit.toon({ ramp: 'gold', rim: PAL.goldHi, key: KEY, side: THREE.DoubleSide });
    const potM = kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: PAL.gold, key: KEY });
    const hotM = kit.toon({ ramp: 'hot', rim: PAL.gold, key: KEY });
    s.all = [];
    const add = (o) => { W.add(o); s.all.push(o); return o; };

    // hall: floor, walls, roof, end wall with a high arch (the sky shows through it), vault ring far away
    add(new THREE.Mesh(new THREE.PlaneGeometry(40, 150).rotateX(-Math.PI / 2).translate(0, GY, -50), kit.flat({ color: PAL.velvet })));
    add(new THREE.Mesh(merge([-1, 1].map((sx) => new THREE.PlaneGeometry(150, 19).rotateY(-sx * Math.PI / 2).translate(sx * 13.3, GY + 9.5, -50))), kit.flat({ color: PAL.black })));
    add(new THREE.Mesh(new THREE.PlaneGeometry(28, 150).rotateX(Math.PI / 2).translate(0, 16.8, -50), kit.flat({ color: PAL.black })));
    const endS = shapeOf([[-14, GY - 1], [14, GY - 1], [14, 18], [-14, 18]]);
    endS.holes.push(shapeOf(archPts(13, 15.5).map(([x, y]) => [x, y + GY]).reverse()));
    add(new THREE.Mesh(ext(endS, 1, 0.1, 12).translate(0, 0, -100), black));
    s.vault = add(new THREE.Mesh(merge([xf(new THREE.TorusGeometry(3.6, 0.35, 6, 40), [0, 2.2, -128]), new THREE.CircleGeometry(3.4, 32).translate(0, 2.2, -128.2)]), kit.flat({ color: PAL.brass, fog: 0.4 })));

    // roof trusses (solid steel bands with panel openings)
    const ytop = (x) => 12.4 + 3.6 * (1 - Math.abs(x) / 13.2);
    const tr = shapeOf([[-13.2, 11.5], [13.2, 11.5], [13.2, 12.5], [0, 16.6], [-13.2, 12.5]]);
    for (let k = 0; k < 6; k++) {
      const xa = -12 + k * 4 + 0.5, xb = -12 + (k + 1) * 4 - 0.5;
      tr.holes.push(shapeOf([[xa, 12.3], [xa, ytop(xa) - 0.55], [xb, ytop(xb) - 0.55], [xb, 12.3]]));
    }
    const trussG = ext(tr, 0.5, 0.05, 2);
    s.truss = add(new THREE.InstancedMesh(trussG, kit.toon({ ramp: 'black', rim: PAL.carmineDeep, key: KEY }), 7));
    for (let i = 0; i < 7; i++) s.truss.setMatrixAt(i, s.m.makeTranslation(0, 0, 4 - i * 16));
    // furnace mouths: arched carmine frames, glowing interiors, flame tongues (instanced, 6 per wall)
    const NF = 6, fr = shapeOf(archPts(5.2, 7));
    fr.holes.push(shapeOf(archPts(3.8, 6.1).map(([x, y]) => [x, y + 0.01]).reverse()));
    s.fFrame = add(new THREE.InstancedMesh(ext(fr, 0.7, 0.12, 6), hotM, NF * 2));
    s.fGlow = add(new THREE.InstancedMesh(new THREE.ShapeGeometry(shapeOf(archPts(3.8, 6.1))), kit.flat({ color: PAL.white }), NF * 2));
    const flame = shapeOf([[-1.7, 0], [1.7, 0], [1.6, 1.0], [1.15, 2.2], [0.9, 1.1], [0.5, 2.6], [0.15, 1.3], [-0.3, 2.9], [-0.55, 1.2], [-1.0, 2.3], [-1.3, 1.0]]);
    s.fFlame = add(new THREE.InstancedMesh(new THREE.ShapeGeometry(flame), kit.flat({ color: PAL.white }), NF * 2));
    s.furn = [];
    for (let i = 0; i < NF; i++) for (const sx of [-1, 1]) s.furn.push({ sx, z: -6 - i * 14 - (sx > 0 ? 7 : 0), k: i });
    s.furn.forEach((f, j) => {
      s.fFrame.setMatrixAt(j, s.m.compose(s.v.set(f.sx * WX, GY, f.z), s.q.setFromEuler(s.e.set(0, -f.sx * Math.PI / 2, 0)), s.sc.set(1, 1, 1)));
      s.fGlow.setColorAt(j, s.c.set(PAL.velvet));
      s.fFlame.setColorAt(j, s.c.set(PAL.gold));
    });
    // floor channels of molten gold along both walls (troughs + gold strips)
    const trough = shapeOf([[-0.75, 0], [0.75, 0], [0.75, 0.5], [0.55, 0.5], [0.55, 0.15], [-0.55, 0.15], [-0.55, 0.5], [-0.75, 0.5]]);
    add(new THREE.Mesh(merge([-1, 1].map((sx) => xf(ext(trough, 150, 0.04, 1), [sx * 9.3, GY, -50]))), black));
    s.molten = add(new THREE.Mesh(merge([-1, 1].map((sx) => new THREE.PlaneGeometry(1.1, 150).rotateX(-Math.PI / 2).translate(sx * 9.3, GY + 0.32, -50))), kit.flat({ color: PAL.gold })));

    // conveyors: bevelled side frames, a dark bed, rollers every 0.75 m
    const side = shapeOf([[-0.12, -0.95], [0.12, -0.95], [0.16, -0.05], [0.16, 0.12], [-0.16, 0.12], [-0.16, -0.05]]);
    const beds = [];
    for (const sx of [-1, 1]) {
      for (const k of [-1, 1]) beds.push(xf(ext(side, 150, 0.03, 1), [sx * CX + k * 0.98, CY - 0.05, -50]));
      beds.push(new THREE.BoxGeometry(1.8, 0.9, 150).translate(sx * CX, CY - 0.62, -50));
    }
    add(new THREE.Mesh(merge(beds), black));
    const NR = 170;
    s.rollers = add(new THREE.InstancedMesh(xf(cyl(0.09, 0.09, 1.86, 8), [0, 0, 0], [0, 0, Math.PI / 2]), kit.toon({ ramp: [PAL.black, PAL.velvet, PAL.brassDark], rim: null, key: KEY }), NR));
    for (let i = 0; i < NR; i++) s.rollers.setMatrixAt(i, s.m.makeTranslation((i % 2 ? 1 : -1) * CX, CY - 0.1, 20 - Math.floor(i / 2) * 1.4));

    // crane rails, crucibles (ladles) on gold cables, pour streams
    const ibs = shapeOf([[-0.45, -0.55], [0.45, -0.55], [0.45, -0.4], [0.1, -0.4], [0.1, 0.4], [0.45, 0.4], [0.45, 0.55], [-0.45, 0.55], [-0.45, 0.4], [-0.1, 0.4], [-0.1, -0.4], [-0.45, -0.4]]);
    add(new THREE.Mesh(merge([-1, 1].map((sx) => xf(ext(ibs, 150, 0.04, 1), [sx * 7.6, 10.6, -50]))), black));
    const YC = 5.4;
    const potG = merge([
      lathe([[0, -1.25], [0.75, -1.25], [0.96, -1.08], [1.16, -0.2], [1.3, 0.9], [1.44, 1.05], [1.5, 1.25], [1.32, 1.3], [1.2, 1.16], [0, 1.16]], 18),
      ext(shapeOf([[1.15, 0.95], [1.95, 1.28], [1.88, 1.46], [1.2, 1.34]]), 0.55, 0.04, 1),
      ...[-1, 1].map((k) => xf(cyl(0.2, 0.2, 0.5, 10), [0, 0, k * 1.4], [Math.PI / 2, 0, 0])),
    ]);
    s.pots = [];
    for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) s.pots.push({ sx, z: (sx < 0 ? -16 : -27) - i * 24, tp: 0 });
    // pour order: the first right pot on "Gold", then one pot per phrase beat
    const order = [1, 0, 3, 2, 5, 4];
    const pourT = [s.gold + 0.05, s.wire - 0.2, s.fire, s.sky, s.smile + 0.3, s.angel];
    order.forEach((pi, k) => { s.pots[pi].tp = pourT[k]; });
    s.potI = add(new THREE.InstancedMesh(potG, potM, s.pots.length));
    s.melt = add(new THREE.InstancedMesh(new THREE.CircleGeometry(1.18, 18).rotateX(-Math.PI / 2).translate(0, 1.18, 0), kit.flat({ color: PAL.goldHi }), s.pots.length));
    const hang = [];
    for (const p of s.pots) {
      const x = p.sx * 7.6;
      hang.push(tube([[x, YC, -1.42], [x, YC + 2.2, -1.25], [x, YC + 3.0, 0], [x, YC + 2.2, 1.25], [x, YC, 1.42]].map(([a, b, c]) => [a, b, c + p.z]), 0.1, 16, 6));
      hang.push(xf(new THREE.BoxGeometry(0.5, 0.6, 0.7), [x, YC + 3.25, p.z]));
      for (const k of [-1, 1]) hang.push(xf(cyl(0.09, 0.09, 10.05 - YC - 3.5, 6), [x, (YC + 3.5 + 10.05) / 2, p.z + k * 0.28]));
    }
    s.cables = add(new THREE.Mesh(merge(hang), kit.toon({ ramp: 'gold', rim: PAL.goldHi, key: KEY })));
    s.stream = add(new THREE.InstancedMesh(cyl(0.2, 0.26, 1, 8).translate(0, -0.5, 0), kit.flat({ color: PAL.goldHi }), s.pots.length));

    // statues on the conveyors (gold, cream faces, halos) + the spy among them
    const A = angelParts();
    const bodyG = merge([A.body, A.head]);
    // the spy: on the right conveyor, at az ~33 deg when the conveyors halt on "lie"
    s.spyZ0 = -7.6 - s.prof.d(s.lie) - (s.conv.d(s.lie) - s.cv0);
    s.turn = 70 - Math.atan(CX / 7.6) / D2R;
    s.slots = [];
    for (const sx of [-1, 1]) for (let i = 0; i < NROW; i++) {
      const z0 = -10 - i * SPACE - (sx > 0 ? SPACE / 2 : 0);
      if (sx > 0 && Math.abs(z0 - s.spyZ0) < SPACE * 0.6) continue;
      s.slots.push({ sx, z0 });
    }
    const NS = s.slots.length;
    s.stBody = add(new THREE.InstancedMesh(bodyG, goldM, NS));
    s.faceMat = kit.toon({ ramp: 'cream', rim: null, key: KEY });
    s.stFace = add(new THREE.InstancedMesh(A.face, s.faceMat, NS));
    s.stHalo = add(new THREE.InstancedMesh(A.halo, kit.flat({ color: PAL.white }), NS));
    for (let i = 0; i < NS; i++) s.stHalo.setColorAt(i, s.c.set(PAL.gold));
    // spy statue: body, turning head group (head, face, glasses), halo that becomes a hat brim, hat crown
    s.spyG = add(new THREE.Group());
    s.spyG.add(new THREE.Mesh(A.body, goldM));
    s.spyHead = new THREE.Group();
    s.spyHead.position.y = 2.2;
    s.spyHead.add(new THREE.Mesh(A.head.clone().translate(0, -2.2, 0), goldM));
    s.spyFace = new THREE.Mesh(A.face.clone().translate(0, -2.2, 0), kit.toon({ ramp: 'cream', rim: null, key: KEY }));
    s.glassMat = kit.flat({ color: PAL.cream });
    s.glasses = new THREE.Mesh(merge([-1, 1].map((k) => xf(new THREE.TorusGeometry(0.052, 0.022, 5, 14), [k * 0.062, -0.01, 0.16])).concat([-1, 1].map((k) => new THREE.CircleGeometry(0.05, 12).translate(k * 0.062, -0.01, 0.162)))), s.glassMat);
    s.crown = new THREE.Mesh(lathe([[0, 0.3], [0.15, 0.3], [0.19, 0.26], [0.2, 0.05], [0.21, 0], [0, 0]], 14), kit.toon({ ramp: 'black', rim: PAL.gold, key: KEY }));
    s.crown.position.y = 0.06;
    s.spyHead.add(s.spyFace, s.glasses, s.crown);
    s.spyG.add(s.spyHead);
    s.haloMat = kit.flat({ color: PAL.gold });
    s.spyHalo = new THREE.Mesh(xf(new THREE.TorusGeometry(0.21, 0.045, 6, 22), [0, 0, 0], [Math.PI / 2, 0, 0]), s.haloMat);
    s.spyG.add(s.spyHalo);
    s.spyG.scale.setScalar(SC);
    s.spyG.rotation.y = -70 * D2R;

    // the wipe: two 12 m statues (not in W: they slide across your view)
    s.giant = new THREE.InstancedMesh(bodyG, kit.toon({ ramp: 'gold', rim: PAL.goldHi, key: [0, 0.6, 0.8] }), 2);
    s.giantF = new THREE.InstancedMesh(A.face, kit.toon({ ramp: 'cream', rim: null, key: [0, 0.6, 0.8] }), 2);
    s.giantH = new THREE.InstancedMesh(A.halo, kit.flat({ color: PAL.goldHi }), 2);
    for (const g of [s.giant, s.giantF, s.giantH]) { g.frustumCulled = false; kit.group.add(g); }
    for (const o of [s.stBody, s.stFace, s.stHalo, s.rollers, s.potI, s.melt, s.stream, s.fGlow, s.fFlame, s.fFrame, s.truss]) o.frustumCulled = false;

    // lyrics
    const L = { d: 6, az: -3, y: -1.0 };
    kit.text('GOLD ON\nTHE WIRE,', { cap: 1.0, depthTest: false, color: 'gold', near: 47.48, out: 49.18, outDur: 0.14, at: L });
    kit.text('FIRE IN\nTHE SKY', { cap: 1.0, depthTest: false, color: 'cream', near: 49.34, out: 51.22, outDur: 0.18, at: L });
    kit.text('SMILE LIKE\nAN ANGEL,', { cap: 0.95, depthTest: false, color: 'gold', near: 51.44, out: 53.8, outDur: 0.15, at: L });
    kit.text('LIE LIKE\nA SPY', { cap: 1.0, depthTest: false, color: 'cream', colors: { 3: 'rust' }, near: 53.98, out: 55.5, outDur: 0.2, at: L });
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t), cv = s.conv.d(t) - s.cv0;
    s.W.position.z = d;
    const main = t < T1;
    for (const o of s.all) o.visible = main;
    const { m, q, e, v, sc, c } = s;
    // furnaces ignite near to far from "Gold"; flames leap on "fire"
    const leap = 1 + 1.3 * env(t, s.fire, 1.6) + 0.6 * sm(s.fire, s.sky, t) * (1 - sm(s.sky + 0.5, s.sky + 1.5, t));
    s.furn.forEach((f, j) => {
      const on = sm(s.gold + f.k * 0.08, s.gold + f.k * 0.08 + 0.12, t);
      s.fGlow.setColorAt(j, c.set(PAL.velvet).lerp(s.c2.set(PAL.crimson), on));
      const fl = on * leap * (0.9 + 0.12 * Math.sin(t * 9 + j * 1.7));
      s.fGlow.setMatrixAt(j, m.compose(v.set(f.sx * (WX + 0.35), GY, f.z), q.setFromEuler(e.set(0, -f.sx * Math.PI / 2, 0)), sc.set(1, 1, 1)));
      s.fFlame.setMatrixAt(j, m.compose(v.set(f.sx * (WX - 0.15), GY, f.z), q, sc.set(1, Math.max(0.001, fl), 1)));
    });
    s.fGlow.instanceMatrix.needsUpdate = true; s.fFlame.instanceMatrix.needsUpdate = true;
    if (s.fGlow.instanceColor) s.fGlow.instanceColor.needsUpdate = true;
    // crucibles tip toward the wall and pour
    s.pots.forEach((p, j) => {
      const tip = 68 * D2R * sm(p.tp, p.tp + 1.0, t);
      const ry = p.sx > 0 ? 0 : Math.PI;
      e.set(0, ry, -tip, 'YXZ');
      q.setFromEuler(e);
      m.compose(v.set(p.sx * 7.6, 5.4, p.z), q, sc.set(1, 1, 1));
      s.potI.setMatrixAt(j, m);
      s.melt.setMatrixAt(j, m);
      // spout tip after tipping (local (1.9, 1.38, 0))
      const lx = 1.9 * Math.cos(tip) + 1.38 * Math.sin(tip), ly = -1.9 * Math.sin(tip) + 1.38 * Math.cos(tip);
      const pour = sm(p.tp + 0.55, p.tp + 0.8, t);
      const sy = 5.4 + ly, len = sy - (GY + 0.3);
      s.stream.setMatrixAt(j, m.compose(v.set(p.sx * (7.6 + lx), sy, p.z), q.identity(), sc.set(pour, Math.max(0.001, len * pour), pour)));
    });
    s.potI.instanceMatrix.needsUpdate = true; s.melt.instanceMatrix.needsUpdate = true; s.stream.instanceMatrix.needsUpdate = true;
    s.cables.material.uniforms.uBright.value = 0.8 + 0.7 * sm(s.wire, s.wire + 0.4, t) * (1 - 0.4 * sm(s.wire + 1, s.wire + 2, t));
    s.molten.material.uniforms.uBright.value = 0.35 + 0.75 * sm(s.gold + 0.6, s.gold + 2.5, t);
    // statues ride the conveyors
    const faceOn = sm(s.smile, s.smile + 0.4, t);
    s.faceMat.uniforms.uBright.value = 0.75 + 0.5 * faceOn;
    s.slots.forEach((st, i) => {
      const z = st.z0 + cv;
      q.setFromEuler(e.set(0, -st.sx * 70 * D2R, 0, 'XYZ'));
      m.compose(v.set(st.sx * CX, CY, z), q, sc.set(SC, SC, SC));
      s.stBody.setMatrixAt(i, m); s.stFace.setMatrixAt(i, m); s.stHalo.setMatrixAt(i, m);
      const wave = env(t, s.angel + Math.max(0, -(z + d)) * 0.02, 3);
      s.stHalo.setColorAt(i, c.set(PAL.gold).lerp(s.c2.set(PAL.white), clamp01(wave)));
    });
    for (const im of [s.stBody, s.stFace, s.stHalo]) im.instanceMatrix.needsUpdate = true;
    if (s.stHalo.instanceColor) s.stHalo.instanceColor.needsUpdate = true;
    // the spy: head turns on "lie", glasses red, halo tips on "a" and drops into a hat brim on "spy"
    s.spyG.position.set(CX, CY, s.spyZ0 + cv);
    const turn = sm(s.lie, s.lie + 0.45, t);
    s.spyHead.rotation.y = s.turn * D2R * turn;
    s.glassMat.uniforms.uColor.value.set(PAL.cream).lerp(c.set(PAL.red), sm(s.lie + 0.2, s.lie + 0.35, t));
    s.glasses.visible = t >= s.lie - 0.05;
    const tipK = sm(s.a, s.a + 0.3, t), drop = sm(s.spy - 0.05, s.spy + 0.2, t);
    s.spyHalo.position.set(0.08 * tipK * (1 - drop), 2.58 - 0.26 * drop + 0.04 * tipK * (1 - drop), -0.04 * (1 - drop));
    s.spyHalo.rotation.set(-0.25 * (1 - drop) + 0.5 * tipK * (1 - drop), 0, 0.55 * tipK * (1 - drop));
    s.spyHalo.scale.set(1 + 0.75 * drop, 1 - 0.35 * drop, 1 + 0.75 * drop);
    s.haloMat.uniforms.uColor.value.set(PAL.gold).lerp(c.set(PAL.black), drop);
    s.crown.scale.setScalar(Math.max(0.001, drop));
    // the wipe: giant statues close (55.35-56.05) and part again (56.3-56.75)
    const close = sm(55.35, 56.05, t) * (1 - sm(56.3, 56.75, t));
    const gx = 8.5 - 6.55 * close;
    const gOn = t > 55.3 && t < 56.75;
    for (const g of [s.giant, s.giantF, s.giantH]) g.visible = gOn;
    if (gOn) {
      [-1, 1].forEach((sx, i) => {
        m.compose(v.set(sx * gx, GY, -4.6), q.setFromEuler(e.set(0, -sx * 0.18, 0)), sc.set(3.6, 3.6, 3.6));
        s.giant.setMatrixAt(i, m); s.giantF.setMatrixAt(i, m); s.giantH.setMatrixAt(i, m);
      });
      for (const g of [s.giant, s.giantF, s.giantH]) g.instanceMatrix.needsUpdate = true;
    }
    if (kit.isOwner) {
      const rays = sm(s.fire, s.sky, t) * (1 - sm(s.sky + 0.6, s.sky + 1.2, t));
      const n = Math.round(16 * sm(s.fire, s.sky, t));
      kit.setSky({ rot: t * 0.035, rings: 0 });
      for (let i = 0; i < 16; i++) kit.sky.uRays.value[i] = (i < n ? 1 : 0) * (rays > 0.01 ? 1 : 0) * (1 - sm(s.sky + 0.6, s.sky + 1.2, t));
    }
    if (t >= s.spy && t < s.spy + 0.03) return { flash: PAL.crimson };
  },
  events() {
    return [
      { t: 47.48, sfx: 'switch', gain: 0.5, haptic: [0.4, 60] },
      { t: 49.34, sfx: 'whoosh', gain: 0.4 },
      { t: 53.5, sfx: 'motor', gain: 0.3 },
      { t: 55.22, sfx: 'key', gain: 0.4 },
      { t: 55.6, sfx: 'whoosh', gain: 0.5 },
    ];
  },
};
