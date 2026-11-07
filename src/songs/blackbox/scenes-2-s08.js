// S08 The time bomb and the vault door (56.30 to 67.95, hot). Round 3, STORYBOARD-v3.
// SHOT CARD
//   HERO     a round bank-vault door (7 m, 0.85 m thick) in a black wall: stepped carmine rims with gold
//            bevel rings, a 6-spoke gold handwheel, 24 gold locking-bolt heads round the edge, a massive
//            hinge on the left. Strapped under the handwheel: a time bomb (six crimson dynamite sticks
//            with cream paper caps and black tape, a twin-bell alarm clock on top, a flip counter in
//            front, three loops of wire: crimson, cream, gold).
//   AROUND   an antechamber: fluted columns (black, gold rim) left and right, three cone-shade lamps
//            hanging over the door with soft gold light cones; behind you the dark.
//   BEATS    "count down to zero" = counter 03 02 01 00, the bells ring and the clock shakes; "don't ask
//            me why" = side cutters glide in and hesitate between the wires (WHY redacted); "gold" = the
//            jaws close on the gold wire, "wire" = SNIP (spark), "tonight" = the ringing stops; "oh-oh" =
//            the bolts retract in a wave, the handwheel spins, the gap glows gold; "gold on the wire" =
//            the door swings open inward on its hinge, gold light floods out; you glide through the ring.
//   OUT      FLY-THROUGH THE DOOR (S09 pre 0.5): the ring passes around you (>= 2.5 m), the gold light
//            dies, dark steel beyond. post 0.8: the leaf beside you fades to black.
//   PALETTE  black wall, carmine door, gold bolts/rims/wheel, crimson dynamite, cream clock.
//   LYRICS   one block at a time left of the bomb (az -27, d 4.2); the counter is the hero's display.
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, EYE, sm, env, clamp01, wt, xf, merge, lathe, ext, tube, cyl, shapeOf, ringShape, roundRect } from './scenes-2-util.js';

const T0 = 56.3, T1 = 67.95;
const R = 3.5, TH = 0.85, DCY = 2.6, GY = -1.8, STOP = 5.3, DX = 0.6;
const KEY = [-0.25, 0.7, 0.67];

export const S08 = {
  id: 'S08', t0: 56.3, t1: 67.95, world: 'hot', pre: 0, post: 0.4,
  key: KEY,
  fog: { color: PAL.black, near: 14, far: 50 },
  sky: 'black',
  build(kit) {
    const s = { v: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), sc: new THREE.Vector3() };
    const ct = (i) => wt(kit, 'count down to zero', 56.52, i);
    s.cnt = [ct(0), ct(1), ct(2), ct(3)];
    s.dont = wt(kit, "don't ask me why", 58.48, 0); s.why = wt(kit, "don't ask me why", 58.48, 3);
    s.g1 = wt(kit, 'gold on the wire tonight', 60.2, 0); s.w1 = wt(kit, 'gold on the wire tonight', 60.2, 3); s.tonight = wt(kit, 'gold on the wire tonight', 60.2, 4);
    s.oh1 = wt(kit, 'oh-oh', 64.0, 0);
    s.g2 = wt(kit, 'oh-oh gold on the wire', 64.0, 1); s.w2 = wt(kit, 'oh-oh gold on the wire', 64.0, 4);
    s.oh2 = wt(kit, 'oh-oh', 66.4, 0);
    s.prof = kit.travel([[T0, 0.5, 0.01], [56.7, 0, 1.2], [s.g2 - 0.05, 3, 1.2], [66.9, 2, 1.0]]);
    const DZ = -(STOP + s.prof.d(s.g2 - 0.06));      // door front plane (world group coords)
    s.DZ = DZ;
    const W = (s.W = new THREE.Group());
    kit.group.add(W);
    s.side = [];

    const black = kit.toon({ ramp: 'black', rim: PAL.gold, key: KEY });
    const carm = kit.toon({ ramp: 'hot', rim: PAL.gold, key: KEY });
    const goldM = kit.toon({ ramp: 'gold', rim: PAL.goldHi, key: KEY });
    const cream = kit.toon({ ramp: 'cream', rim: PAL.gold, key: KEY });
    const crimM = kit.toon({ ramp: [PAL.carmineDeep, PAL.carmine, PAL.crimson], rim: PAL.gold, key: KEY });
    s.leafMats = [carm, goldM, cream, crimM];

    // wall with the round opening + bevelled gold frame ring + floor, side walls, coffered ceiling
    const wallS = shapeOf([[-20, GY - 1], [20, GY - 1], [20, 14], [-20, 14]]);
    wallS.holes.push(new THREE.Path().absarc(DX, DCY, R + 0.12, 0, Math.PI * 2, true));
    s.wall = new THREE.Mesh(new THREE.ShapeGeometry(wallS, 48).translate(0, 0, DZ - 0.3), black);
    s.frame = new THREE.Mesh(merge([ext(ringShape(R + 0.1, R + 0.95, 64), 0.7, 0.1, 2), ext(ringShape(R + 0.95, R + 1.25, 64), 0.4, 0.06, 2).translate(0, 0, -0.2)]).translate(DX, DCY, DZ - 0.1), black);
    const room = new THREE.Mesh(merge([
      new THREE.PlaneGeometry(22, 30).rotateX(-Math.PI / 2).translate(0, GY, DZ + 12),
      ...[-1, 1].map((k) => new THREE.PlaneGeometry(30, 12).rotateY(-k * Math.PI / 2).translate(k * 9.5, GY + 6, DZ + 12)),
    ]), kit.flat({ color: PAL.velvet }));
    const cof = shapeOf([[-9.5, -1], [9.5, -1], [9.5, 25], [-9.5, 25]]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) cof.holes.push(roundRect(3.4, 3.4, 0.2, -6 + i * 4, 1.4 + j * 4, new THREE.Path()));
    const ceil = new THREE.Mesh(merge([xf(ext(cof, 0.45, 0.06, 2), [0, 7.6, DZ], [Math.PI / 2, 0, 0]), new THREE.PlaneGeometry(20, 28).rotateX(Math.PI / 2).translate(0, 8.4, DZ + 12)]), black);
    // fluted columns (16 flutes) with lathe base and capital, two per side
    const fl = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 0.48 : 0.58; fl.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const shaftG = xf(ext(shapeOf(fl), 8.2, 0.03, 1), [0, GY + 0.8 + 4.1, 0], [Math.PI / 2, 0, 0]);
    const baseG = lathe([[0, 0], [0.85, 0], [0.85, 0.3], [0.72, 0.42], [0.68, 0.6], [0.6, 0.8], [0, 0.8]], 18).translate(0, GY, 0);
    const capG = lathe([[0, 0], [0.6, 0], [0.75, 0.25], [0.95, 0.45], [0.95, 0.75], [0, 0.75]], 18).translate(0, GY + 9.0, 0);
    const colG = merge([shaftG, baseG, capG]);
    s.cols = new THREE.InstancedMesh(colG, kit.toon({ ramp: 'black', rim: PAL.brassDark, rimAmt: 0.6, key: KEY }), 4);
    [[-6.6, DZ + 1.6], [6.6, DZ + 1.6], [-7.2, DZ + 7.2], [7.2, DZ + 7.2]].forEach(([x, z], i) => s.cols.setMatrixAt(i, s.m.makeTranslation(x, 0, z)));
    // three cone-shade lamps over the door, soft gold cones
    const shadeG = merge([lathe([[0.12, 0.55], [0.3, 0.42], [0.62, 0.05], [0.75, 0], [0.7, -0.03], [0.55, 0.02], [0.24, 0.38], [0, 0.45]], 16), xf(cyl(0.03, 0.03, 4, 6), [0, 2.5, 0])]);
    s.shades = new THREE.InstancedMesh(shadeG, black, 3);
    s.bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), kit.flat({ color: PAL.goldHi }), 3);
    s.cones = new THREE.InstancedMesh(cyl(2.4, 0.55, 5.2, 18).translate(0, -2.6, 0), kit.flat({ color: PAL.gold, opacity: 0.05, additive: true, side: THREE.DoubleSide, depthWrite: false }), 3);
    [-3.2, 0, 3.2].forEach((x, i) => {
      const y = 5.3 + (i === 1 ? 0.5 : 0), z = DZ + 1.4;
      s.shades.setMatrixAt(i, s.m.makeTranslation(x, y, z));
      s.bulbs.setMatrixAt(i, s.m.makeTranslation(x, y + 0.02, z));
      s.cones.setMatrixAt(i, s.m.makeTranslation(x, y, z));
    });
    W.add(s.wall, s.frame, room, ceil, s.cols, s.shades, s.bulbs, s.cones);
    s.side.push(room, ceil, s.cols, s.shades, s.bulbs, s.cones);

    // ---- the door (pivot = hinge on the left; door space: centre at x = R + 0.25, front face z = 0) ---
    s.hinge = new THREE.Group();
    s.hinge.position.set(DX - (R + 0.25), DCY, DZ);
    s.door = new THREE.Group();
    s.door.position.x = R + 0.25;
    s.hinge.add(s.door);
    W.add(s.hinge);
    const body = merge([
      ext(ringShape(2.95, R, 64), TH, 0.06, 2).translate(0, 0, -TH / 2),
      ext(ringShape(2.15, 2.95, 64), TH, 0.06, 2).translate(0, 0, -TH / 2 + 0.13),
      ext(new THREE.Shape().absarc(0, 0, 2.15, 0, Math.PI * 2, false), TH, 0.06, 2).translate(0, 0, -TH / 2 + 0.24),
    ]);
    s.door.add(new THREE.Mesh(body, carm));
    s.door.add(new THREE.Mesh(xf(new THREE.TorusGeometry(R - 0.04, 0.07, 6, 64), [0, 0, 0.04]), goldM));
    // back face: four locking bars and a gear box
    const back = [];
    for (let k = 0; k < 4; k++) back.push(xf(new THREE.BoxGeometry(5.6 - Math.abs(k - 1.5) * 1.2, 0.28, 0.22), [0, -1.5 + k, -TH - 0.05]));
    back.push(xf(new THREE.BoxGeometry(1.6, 1.4, 0.5), [0, 0, -TH - 0.2]));
    s.door.add(new THREE.Mesh(merge(back), black));
    // 24 locking-bolt heads round the edge (they retract in a wave)
    s.bolts = new THREE.InstancedMesh(xf(cyl(0.22, 0.22, 0.34, 10), [0, 0, 0], [Math.PI / 2, 0, 0]), goldM, 18);
    s.door.add(s.bolts);
    // handwheel: rim, 6 spokes with knobs, hub
    const hw = [xf(new THREE.TorusGeometry(0.9, 0.085, 8, 36), [0, 0, 0]), xf(cyl(0.24, 0.24, 0.3, 14), [0, 0, 0], [Math.PI / 2, 0, 0])];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      hw.push(xf(cyl(0.05, 0.05, 1.1, 6), [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0], [0, 0, a - Math.PI / 2]));
      hw.push(new THREE.SphereGeometry(0.12, 8, 6).translate(Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0));
    }
    s.wheel = new THREE.Mesh(merge(hw), goldM);
    s.wheel.position.set(0, 0.35, 0.65);
    s.door.add(s.wheel, new THREE.Mesh(xf(cyl(0.12, 0.12, 0.45, 8), [0, 0.35, 0.45], [Math.PI / 2, 0, 0]), goldM));
    // hinge: two knuckles, the pin and the arms
    const hg = [xf(cyl(0.12, 0.12, 6.4, 10), [-0.1, 0, 0.35]), ...[-1.6, 1.6].map((y) => xf(cyl(0.34, 0.34, 1.1, 14), [-0.1, y, 0.35])), ...[-1.6, 1.6].map((y) => xf(new THREE.BoxGeometry(1.6, 0.5, 0.3), [0.75, y, 0.3]))];
    s.hinge.add(new THREE.Mesh(merge(hg), black));

    // ---- the bomb (door space; centre column x 0) ----------------------------------------------------
    const B = new THREE.Group();
    B.position.set(0, -2.05, 0.24);
    s.door.add(B);
    const sticks = [], caps = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) {
      const y = -0.3 + r * 0.25, z = 0.13 + k * 0.25;
      sticks.push(xf(cyl(0.12, 0.12, 1.2, 12), [0, y, z], [0, 0, Math.PI / 2]));
      for (const sx of [-1, 1]) caps.push(xf(cyl(0.115, 0.115, 0.05, 12), [sx * 0.61, y, z], [0, 0, Math.PI / 2]));
    }
    B.add(new THREE.Mesh(merge(sticks), crimM), new THREE.Mesh(merge(caps), cream));
    const tape = [-0.36, 0.36].map((x) => xf(ext(roundRect(0.66, 0.86, 0.12), 0.14, 0.02, 3), [x, -0.05, 0.25], [0, Math.PI / 2, 0]));
    // flip counter housing in front (black, two flap halves)
    tape.push(xf(ext(roundRect(0.7, 0.5, 0.06), 0.24, 0.03, 3), [0, -0.05, 0.64]));
    B.add(new THREE.Mesh(merge(tape), black));
    // twin-bell alarm clock on top (case faces you), bells, hammer, feet
    s.clock = new THREE.Group();
    s.clock.position.set(0, 0.72, 0.3);
    B.add(s.clock);
    const caseG = xf(lathe([[0, -0.16], [0.3, -0.16], [0.35, -0.12], [0.36, 0.1], [0.32, 0.16], [0, 0.16]], 22), [0, 0, 0], [Math.PI / 2, 0, 0]);
    const bellG = lathe([[0, 0.17], [0.09, 0.15], [0.15, 0.08], [0.17, 0], [0, 0]], 12);
    const bells = [-1, 1].map((sx) => xf(bellG.clone(), [sx * 0.2, 0.36, 0], [0, 0, -sx * 0.45]));
    const legs = [-1, 1].map((sx) => xf(new THREE.SphereGeometry(0.06, 8, 6), [sx * 0.2, -0.36, 0]));
    s.clock.add(new THREE.Mesh(merge([caseG, ...bells, ...legs, xf(cyl(0.03, 0.03, 0.2, 6), [0, 0.42, 0])]), goldM));
    s.clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.28, 24).translate(0, 0, 0.17), kit.flat({ color: PAL.cream })));
    s.clock.add(new THREE.Mesh(merge([xf(new THREE.BoxGeometry(0.035, 0.22, 0.02), [0, 0.09, 0.18]), xf(new THREE.BoxGeometry(0.035, 0.15, 0.02), [0.05, 0.03, 0.185], [0, 0, -1.1])]), kit.flat({ color: PAL.black })));
    s.hammer = new THREE.Mesh(merge([xf(cyl(0.02, 0.02, 0.2, 5), [0, 0.1, 0]), new THREE.SphereGeometry(0.05, 6, 5).translate(0, 0.2, 0)]), goldM);
    s.hammer.position.set(0, 0.3, 0.02);
    s.clock.add(s.hammer);
    // the three wires (crimson, cream, gold) looping from the clock to the stick ends on the right
    const WIRES = {
      crimson: [[0.2, 0.56, 0.38], [0.6, 0.46, 0.75], [0.92, 0.18, 0.78], [0.66, -0.12, 0.5]],
      cream: [[0.24, 0.5, 0.36], [0.7, 0.3, 0.95], [1.05, -0.06, 0.9], [0.68, -0.3, 0.52]],
      gold: [[0.26, 0.44, 0.34], [0.78, 0.12, 1.12], [1.16, -0.32, 1.02], [0.7, -0.48, 0.5]],
    };
    const curve = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    B.add(new THREE.Mesh(new THREE.TubeGeometry(curve(WIRES.crimson), 24, 0.06, 6), kit.flat({ color: PAL.crimson })));
    B.add(new THREE.Mesh(new THREE.TubeGeometry(curve(WIRES.cream), 24, 0.06, 6), kit.flat({ color: PAL.cream })));
    const gc = curve(WIRES.gold), half = (a, b) => { const P = []; for (let i = 0; i <= 12; i++) P.push(gc.getPoint(a + ((b - a) * i) / 12)); return P; };
    const gA = half(0, 0.5), gB = half(0.5, 1);
    s.cut = gc.getPoint(0.5);
    const goldWire = kit.flat({ color: PAL.gold });
    s.wA = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gA), 14, 0.065, 6).translate(-gA[0].x, -gA[0].y, -gA[0].z), goldWire);
    s.wA.position.copy(gA[0]);
    s.wB = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gB), 14, 0.065, 6).translate(-gB[12].x, -gB[12].y, -gB[12].z), goldWire);
    s.wB.position.copy(gB[12]);
    B.add(s.wA, s.wB);
    s.hover = [curve(WIRES.crimson).getPoint(0.5), curve(WIRES.cream).getPoint(0.5), s.cut];
    s.B = B;
    // side cutters: two bevelled halves round a rivet, crimson-dipped handles
    const jaw = shapeOf([[-0.44, 0.0], [-0.05, -0.02], [0.0, -0.09], [0.09, -0.06], [0.45, 0.02], [0.92, 0.1], [0.95, 0.18], [0.5, 0.16], [0.1, 0.12], [0.0, 0.11], [-0.2, 0.08], [-0.36, 0.05]]);
    const grip = shapeOf([[0.34, -0.0], [0.9, 0.07], [0.99, 0.14], [0.96, 0.23], [0.34, 0.19]]);
    const steel = kit.toon({ ramp: [PAL.velvet, PAL.creamDark, PAL.cream], rim: PAL.gold, key: KEY, side: THREE.DoubleSide });
    const gripM = kit.toon({ ramp: [PAL.carmineDeep, PAL.carmine, PAL.crimson], rim: PAL.gold, key: KEY, side: THREE.DoubleSide });
    const halfG = (sy) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(xf(ext(jaw, 0.06, 0.015, 2), [0, 0, 0], [0, 0, 0], [0.62, 0.62 * sy, 1]), steel));
      g.add(new THREE.Mesh(xf(ext(grip, 0.1, 0.02, 2), [0, 0, 0], [0, 0, 0], [0.62, 0.62 * sy, 1]), gripM));
      return g;
    };
    s.cutters = new THREE.Group();
    s.cutU = halfG(1); s.cutL = halfG(-1);
    s.cutU.position.z = 0.05; s.cutL.position.z = -0.05;
    s.cutters.add(s.cutU, s.cutL, new THREE.Mesh(xf(cyl(0.05, 0.05, 0.22, 10), [0, 0, 0], [Math.PI / 2, 0, 0]), goldM));
    B.add(s.cutters);
    s.spark = kit.particles({
      n: 14, shape: 'tri', size: 0.09, color: PAL.goldHi, additive: true,
      init: (i, r) => ({ p: [s.cut.x, s.cut.y, s.cut.z], v: [(r() - 0.3) * 3, (r() - 0.2) * 3, 1 + r() * 2], g: [0, -6, 0], t0: s.w1, life: 0.5 + r() * 0.3, s: 0.06 + r() * 0.07 }),
    });
    B.add(s.spark);
    // counter digits (the hero's display): 03 02 01 00 on the word times
    s.digits = ['03', '02', '01', '00'].map((dg, i) => {
      const T = kit.text(dg, { cap: 0.3, color: 'cream', times: [s.cnt[i]], out: i < 3 ? s.cnt[i + 1] : Infinity, outDur: 0.02, dur: 0.05, pop: true, parent: B, slant: 0 });
      T.mesh.position.set(0, -0.05, 0.79);
      return T;
    });
    // bolt-gap glow and the gold light behind the door
    s.gap = new THREE.Mesh(ext(ringShape(R - 0.02, R + 0.14, 64), 0.05, 0, 2).translate(DX, DCY, DZ + 0.05), kit.flat({ color: PAL.goldHi }));
    // Round 4: behind the open door the strongroom floor glows gold and two stacks of tapered gold bars stand on
    // each side (the old flat gold disc filled the frame and read as a sun or a coin)
    const FLY = DCY - R + 0.15;
    s.light = new THREE.Mesh(new THREE.PlaneGeometry(9, 26).rotateX(-Math.PI / 2).translate(DX, FLY, DZ - 13.4), kit.flat({ color: PAL.brass }));
    const ingot = new THREE.CylinderGeometry(0.36, 0.48, 0.3, 4, 1).rotateY(Math.PI / 4).scale(0.75, 1, 1.6).toNonIndexed();
    ingot.computeVertexNormals();
    const IG = [];
    for (const sx of [-1, 1]) for (const z of [-3.2]) for (let k = 0; k < 2; k++) for (let j = 0; j < 2 - k; j++) IG.push([DX + sx * 1.75 + (j - (1 - k) / 2) * 0.56, FLY + 0.15 + k * 0.3, DZ + z]);
    s.ingots = new THREE.InstancedMesh(ingot, kit.toon({ ramp: [PAL.brass, PAL.gold, PAL.goldHi], rim: null, key: KEY }), IG.length);
    IG.forEach(([x, y, z], i) => s.ingots.setMatrixAt(i, s.m.makeTranslation(x, y, z)));
    W.add(s.gap, s.light, s.ingots);

    // ---- lyrics -------------------------------------------------------------------------------------
    const L = { d: 4.2, az: -31, y: 1.3 };
    kit.text('COUNT DOWN\nTO ZERO,', { cap: 0.5, color: 'gold', near: 56.52, out: 58.25, outDur: 0.15, at: L });
    const why = kit.text("DON'T ASK\nME WHY", { cap: 0.5, color: 'cream', near: 58.48, out: 60.3, outDur: 0.15, at: L });
    why.redact(3, s.why + 0.12);
    kit.text('GOLD ON\nTHE WIRE', { cap: 0.5, color: 'gold', near: 60.3, say: 'gold on the wire', out: s.tonight - 0.2, outDur: 0.15, at: L });
    kit.text('TONIGHT', { cap: 0.56, color: 'cream', near: 62.4, out: 63.6, outDur: 0.2, at: L });
    kit.text('OH-OH,', { cap: 0.6, color: 'gold', near: 64.0, say: 'oh-oh', out: s.g2 - 0.12, outDur: 0.1, at: L });
    kit.text('GOLD ON\nTHE WIRE', { cap: 0.5, color: 'crimson', near: 64.94, out: s.oh2 - 0.2, outDur: 0.15, depthTest: false, at: L });
    kit.text('OH-OH', { cap: 0.6, color: 'crimson', near: 66.4, say: 'oh-oh', out: 67.3, outDur: 0.25, depthTest: false, at: { d: 4.2, az: -20, y: 1.5 } });
    for (const o of [s.bolts, s.cols, s.shades, s.bulbs, s.cones, s.ingots]) o.frustumCulled = false;
    return s;
  },
  update(t, s, kit) {
    s.W.position.z = s.prof.d(t);
    for (const o of s.side) o.visible = t >= T0 - 0.1;
    s.wall.visible = t >= T0 - 0.1;
    // alarm: rings from "zero" to "tonight", the clock shakes, the hammer buzzes
    const ring = t >= s.cnt[3] && t < s.tonight ? 1 : 0;
    s.clock.rotation.z = ring * 0.05 * Math.sin(t * 47);
    s.clock.position.y = 0.72 + ring * 0.015 * Math.abs(Math.sin(t * 31));
    s.hammer.rotation.z = ring ? 0.5 * Math.sin(t * 60) : 0.08 * Math.sin((t - s.cnt[0]) * 30) * env(t, s.cnt[0], 3);
    // cutters: glide in from the right, hesitate between the wires, close on the gold wire, snip, leave
    const inK = sm(s.dont - 0.1, s.dont + 0.7, t), outK = sm(s.tonight + 0.1, s.tonight + 1.1, t);
    s.cutters.visible = inK > 0.001 && outK < 0.999;
    const ph = clamp01((t - (s.dont + 0.7)) / Math.max(0.5, s.g1 - s.dont - 0.7));
    const hv = s.hover, k = ph * 2.2;
    const tgt = s.v;
    if (k < 1) tgt.copy(hv[0]).lerp(hv[1], sm(0.2, 0.8, k)); else tgt.copy(hv[1]).lerp(hv[2], sm(1.1, 1.9, k));
    if (t >= s.g1) tgt.copy(hv[2]);
    // the jaw tip sits on the target; the cutters point left (jaws toward the wire)
    s.cutters.position.set(tgt.x + 0.27 + (1 - inK) * 2.6 + outK * 2.8, tgt.y + 0.02 + outK * 0.6, tgt.z + 0.12);
    s.cutters.rotation.set(0, 0, 0.25 - 0.1 * Math.sin(t * 2.2) * (1 - sm(s.g1 - 0.3, s.g1, t)));
    const openA = 0.36 * (1 - sm(s.g1, s.g1 + 0.35, t)) + 0.18 * sm(s.g1 + 0.4, s.w1 - 0.25, t) * (1 - sm(s.w1 - 0.06, s.w1, t)) + 0.3 * sm(s.w1 + 0.1, s.w1 + 0.4, t);
    s.cutU.rotation.z = openA; s.cutL.rotation.z = -openA;
    // SNIP: the two gold halves spring apart and droop
    const snap = sm(s.w1, s.w1 + 0.35, t);
    s.wA.rotation.set(-0.5 * snap, 0, 0.35 * snap);
    s.wB.rotation.set(0.35 * snap, 0, -0.5 * snap);
    // bolts retract in a wave round the rim on "oh-oh", the wheel spins, the gap glows
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.PI / 2;
      const k2 = sm(s.oh1 + (i / 18) * 0.75, s.oh1 + (i / 18) * 0.75 + 0.18, t);
      const r = 3.22 - 0.25 * k2;
      s.bolts.setMatrixAt(i, s.m.compose(s.v.set(Math.cos(a) * r, Math.sin(a) * r, 0.17 - 0.3 * k2), s.q.identity(), s.sc.set(1, 1, 1)));
    }
    s.bolts.instanceMatrix.needsUpdate = true;
    s.wheel.rotation.z = -Math.PI * 2 * sm(s.oh1, s.g2, t);
    const gapK = sm(s.oh1 + 0.1, s.oh1 + 0.9, t);
    s.gap.visible = gapK > 0.01 && t < s.g2 + 1.6;
    s.gap.material.uniforms.uOpacity.value = gapK;
    // the door swings open inward on its hinge (90 deg), gold light floods, then dies before the ring
    const open = sm(s.g2, s.g2 + 1.6, t);
    s.hinge.rotation.y = (Math.PI / 2) * open;
    s.hinge.visible = t < 67.98;
    // the light disc dies before it can reach the eyes (comfort: nothing within 1.5 m)
    const lk = 1 - sm(67.0, 67.6, t);
    s.light.visible = t > s.g2 - 0.1 && lk > 0.01;
    s.ingots.visible = s.light.visible;
    s.light.material.uniforms.uBright.value = (0.45 + 0.45 * open) * lk;
    s.cones.visible = false;
    { const dk = 1 - 0.75 * sm(s.g2 + 0.4, s.g2 + 1.4, t); for (const m of s.leafMats) m.uniforms.uBright.value = dk; } // the open leaf turns into a backlit silhouette
    // fog as a curtain while the door stands open: the swung leaf and the far strongroom sink into black, the
    // gold floor and the bars near the doorway stay (keeps the frame calm; S05 uses the same trick)
    if (kit.isOwner) { const fk = sm(s.g2 + 0.6, s.g2 + 1.3, t); if (fk > 0) kit.setFog(PAL.black, 14 - 9.5 * fk, 50 - 38 * fk); }
    kit.fade(1 - sm(67.55, 67.98, t));
  },
  events() {
    return [
      { t: 56.52, sfx: 'tick', gain: 0.5 }, { t: 57.5, sfx: 'switch', gain: 0.5 },
      { t: 58.6, sfx: 'whoosh', gain: 0.3 }, { t: 62.08, sfx: 'crack', gain: 0.6, haptic: [0.6, 70] },
      { t: 64.0, sfx: 'pneumatic', gain: 0.5 }, { t: 64.94, sfx: 'lidOpen', gain: 0.6, haptic: [0.4, 120] },
      { t: 66.3, sfx: 'whoosh', gain: 0.5 },
    ];
  },
};
