// S12 The Big Top high wire (95.18-104.33, hot). The cradle rides the high wire through a 70 m
// circus tent whose roof is the sunburst (24 carmine/black stripes), 600 watching eyes, six
// spotlights, burning hoops, the high-wire Walker 15 m ahead and the trapeze Angel who flies over
// the player and turns out to be the spy. Out: PORTAL through the last, largest burning hoop.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, setIQ, inst, instColors, setC, merge, facet, box, disc, ball, shape, fitText, sm, clamp01, easeIn, easeOut, easeInOut, env, TMP } from './scenes-3-util.js';

const T_IN = 95.18, T_FIRE = 97.44, T_SKY = 98.92, T_SMILE = 99.68, T_UP = 100.32, T_ANGEL = 101.24, T_CATCH = 101.47, T_LIE = 102.1, T_SPY = 103.5, T_PORT = 103.76, T_END = 104.33;
const POLE = new THREE.Vector3(12, 0, -18), TENT_R = 35, FLOOR = -20;
const IGN = [97.47, 98.03, 98.62, 99.19];
const PASS = [98.3, 100.0, 101.75, T_END];
const HR = [2.6, 2.6, 2.6, 4.0];
const WALK = new THREE.Vector3(0, 3.4, -15);
const SWING_U = new THREE.Vector3(0.7, 0, -0.71).normalize(), ROPE = 15, PIV_Y = 20.6;

// the Engineer silhouette (bob, high collar, coverall, gloves), feet at y 0, facing +z
function engineerGeo(arms) {
  const P = [
    { g: ball(0.15, 7, 5, 0, 1.63, 0) }, { g: box(0.36, 0.26, 0.32, 0, 1.66, -0.03) }, { g: box(0.3, 0.16, 0.26, 0, 1.43, 0) },
    { g: box(0.44, 0.62, 0.26, 0, 1.08, 0) }, { g: box(0.46, 0.1, 0.28, 0, 0.78, 0) },
  ];
  if (arms === 'pole') P.push({ g: box(0.62, 0.1, 0.1, -0.42, 1.2, 0.12, 0, 0, 0.35) }, { g: box(0.62, 0.1, 0.1, 0.42, 1.2, 0.12, 0, 0, -0.35) });
  if (arms === 'up') P.push({ g: box(0.1, 0.7, 0.1, -0.2, 1.75, 0, 0, 0, 0.12) }, { g: box(0.1, 0.7, 0.1, 0.2, 1.75, 0, 0, 0, -0.12) }, { g: box(0.14, 0.75, 0.16, -0.11, 0.38, 0) }, { g: box(0.14, 0.75, 0.16, 0.11, 0.38, 0) });
  return merge(P);
}
const glassesGeo = () => merge([{ g: disc(0.06, 10, -0.07, 1.64, 0.165) }, { g: disc(0.06, 10, 0.07, 1.64, 0.165) }]);
const WING = [[0, 0], [0.25, 0.35], [0.7, 0.7], [1.2, 0.95], [1.05, 0.62], [1.35, 0.6], [1.1, 0.35], [1.3, 0.2], [0.9, 0.05], [0.95, -0.2], [0.5, -0.12]];

export const S12 = {
  id: 'S12', t0: T_IN, t1: T_END, world: 'hot', pre: 0.3, post: 0.12,
  key: [0.12, 0.75, -0.65], fog: { near: 25, far: 150 },
  build(kit) {
    const s = { v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), dn: new THREE.Vector3(0, -1, 0), tg: Array.from({ length: 6 }, () => new THREE.Vector3()) };
    const R = kit.rnd(1212);
    s.prof = kit.travel([[T_IN, 2, 0.01], [95.3, 4, 1.2]]);
    s.tent = new THREE.Group(); kit.group.add(s.tent);
    // --- roof: the sunburst as architecture (24 stripes, flat, stripe colours animated)
    const rg = new THREE.ConeGeometry(TENT_R, 20, 24, 1, true).toNonIndexed();
    s.roofCol = new Float32Array(rg.getAttribute('position').count * 3);
    rg.setAttribute('color', new THREE.BufferAttribute(s.roofCol, 3));
    s.roofN = rg.getAttribute('position').count / 24;
    s.roof = new THREE.Mesh(rg, kit.flat({ color: PAL.white, vertexColors: true, side: THREE.DoubleSide, fog: 0.5 }));
    s.roof.position.set(POLE.x, 16, POLE.z);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(TENT_R, 0.35, 4, 48).rotateX(Math.PI / 2), kit.flat({ color: PAL.gold, fog: 0.5 }));
    rim.position.set(POLE.x, 6, POLE.z);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(TENT_R, TENT_R, 27, 32, 1, true), kit.flat({ color: PAL.velvet, side: THREE.BackSide }));
    wall.position.set(POLE.x, FLOOR + 13.5, POLE.z);
    // ring floor (black) with the gold ring line, centre pole, masts and rigging (one merged mesh)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(TENT_R, 32).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    floor.position.set(POLE.x, FLOOR, POLE.z);
    const line = new THREE.Mesh(new THREE.RingGeometry(12.4, 13, 48).rotateX(-Math.PI / 2), kit.flat({ color: PAL.gold }));
    line.position.set(POLE.x, FLOOR + 0.05, POLE.z);
    s.dEnd = s.prof.d(T_END);
    s.hz = PASS.map((tp) => -s.prof.d(tp));
    const mastB = s.hz[3] - 14;
    const rigP = [
      { g: new THREE.CylinderGeometry(0.6, 0.9, 46, 8).translate(POLE.x, FLOOR + 23, POLE.z) },
      { g: box(0.7, 28, 0.7, 0, FLOOR + 14 - 0.4, 7) }, { g: new THREE.CylinderGeometry(2.2, 2.2, 0.3, 12).translate(0, -0.15, 7) },
      { g: box(0.7, 28, 0.7, 0, FLOOR + 14 - 0.4, mastB) }, { g: new THREE.CylinderGeometry(2.2, 2.2, 0.3, 12).translate(0, -0.15, mastB) },
    ];
    s.hz.forEach((z, k) => rigP.push({ g: box(0.05, 22, 0.05, -HR[k] * 0.7, 1.6 + HR[k] * 0.7 + 11, z) }, { g: box(0.05, 22, 0.05, HR[k] * 0.7, 1.6 + HR[k] * 0.7 + 11, z) }));
    const rigM = new THREE.Mesh(merge(rigP), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5, vertexColors: true }));
    const plat = new THREE.Mesh(merge([{ g: new THREE.TorusGeometry(2.2, 0.08, 4, 24).rotateX(Math.PI / 2).translate(0, 0, 7) }, { g: new THREE.TorusGeometry(2.2, 0.08, 4, 24).rotateX(Math.PI / 2).translate(0, 0, mastB) }]), kit.flat({ color: PAL.gold, vertexColors: true }));
    s.tent.add(s.roof, rim, wall, floor, line, rigM, plat);
    // --- audience: 6 tiers x 100 (heads and shoulders), eye dots blink on in a wave
    const ag = merge([{ g: ball(0.34, 6, 4, 0, 0.62, 0, 0.9, 1.1, 0.9) }, { g: box(1.2, 0.5, 0.55, 0, 0.05, 0) }, { g: box(0.3, 0.3, 0.3, 0, 0.32, 0) }]);
    s.aud = inst(ag, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.6, vertexColors: true }), 600, 's12-aud');
    s.eyes = inst(merge([{ g: disc(0.095, 6, -0.13, 0.66, 0.31) }, { g: disc(0.095, 6, 0.13, 0.66, 0.31) }]), kit.flat({ color: PAL.white, vertexColors: true, fog: 0.4 }), 600, 's12-eyes');
    instColors(s.eyes, 0x000000);
    s.audT = new Float32Array(600); s.audB = new Float32Array(600);
    for (let j = 0, i = 0; j < 6; j++) for (let k = 0; k < 100; k++, i++) {
      const a = (k + (j % 2) * 0.5) / 100 * Math.PI * 2, r = 21 + j * 2.6, y = FLOOR + 8 + j * 3.2;
      const x = POLE.x + Math.cos(a) * r, z = POLE.z + Math.sin(a) * r, ry = Math.atan2(POLE.x - x, POLE.z - z);
      const sc = 1.5 + R() * 0.25;
      setI(s.aud, i, x, y, z, 0, ry, 0, sc); setI(s.eyes, i, x, y, z, 0, ry, 0, sc);
      s.audT[i] = [95.75, 95.75, 96.33, 96.33, 96.9, 96.9][j] + (k / 100) * 0.5; s.audB[i] = R();
    }
    s.tent.add(s.aud, s.eyes);
    // --- fire-breathers on both masts and their flat flame cones
    const fb = engineerGeo('up');
    s.breath = inst(fb, kit.toon({ ramp: 'black', rim: PAL.gold, vertexColors: true }), 4, 's12-breathers');
    s.bpos = [[-1.3, 7], [1.3, 7], [-1.3, mastB], [1.3, mastB]];
    s.bpos.forEach(([x, z], i) => setI(s.breath, i, x, 0, z, 0, z > 0 ? Math.PI : 0, 0, 1.3));
    s.flame = inst(new THREE.ConeGeometry(1, 1, 6, 1, true).translate(0, -0.5, 0).rotateX(Math.PI), kit.flat({ color: PAL.white, side: THREE.DoubleSide }), 8, 's12-blow');
    instColors(s.flame); for (let i = 0; i < 8; i++) setC(s.flame, i, i % 2 ? PAL.amber : PAL.orange);
    s.tent.add(s.breath, s.flame);
    // --- hoops (gold rings) and their flame tongues (rust, orange, small amber tips)
    s.hoopsG = new THREE.Group(); kit.group.add(s.hoopsG);
    s.hoops = inst(new THREE.TorusGeometry(1, 0.035, 5, 40), kit.toon({ ramp: 'gold', rim: PAL.cream }), 4, 's12-hoops');
    s.hz.forEach((z, k) => setI(s.hoops, k, 0, 1.6, z, 0, 0, 0, HR[k]));
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3)); tri.computeVertexNormals();
    s.tong = inst(tri, kit.flat({ color: PAL.white, side: THREE.DoubleSide }), 4 * 108, 's12-tongues');
    instColors(s.tong);
    s.tongD = [];
    for (let k = 0; k < 4; k++) for (let i = 0; i < 36; i++) for (let l = 0; l < 3; l++) {
      const idx = s.tongD.length;
      setC(s.tong, idx, [PAL.rust, PAL.orange, PAL.amber][l]);
      s.tongD.push({ k, a: (i + l * 0.33) / 36 * Math.PI * 2, l, ph: R() * 6.28, f: 9 + R() * 7 });
    }
    s.matte = kit.matte({ shape: 'circle', r: 3.9 });
    s.matte.position.set(0, 1.6, s.hz[3]);
    s.hoopsG.add(s.hoops, s.tong, s.matte);
    // --- six spotlights on the tent rim: housings + hard opaque beams in two steps (gold shaft, cream
    // core, black around them). BackSide only: we see the beam's far inner wall, so the Walker inside
    // the beam stands in front of it as a silhouette, and nothing is translucent.
    s.srcs = [0.55, 1.05, 1.45, 1.85, 2.5, 3.6].map((a) => new THREE.Vector3(POLE.x + Math.cos(a + Math.PI) * 33, 5.5, POLE.z + Math.sin(a + Math.PI) * 33));
    const coneG = new THREE.ConeGeometry(1, 1, 14, 1, true).translate(0, -0.5, 0);
    s.cones = inst(coneG, kit.flat({ color: PAL.white, side: THREE.BackSide, fog: 0.5 }), 6, 's12-cones');
    instColors(s.cones, PAL.gold);
    s.cores = inst(coneG, kit.flat({ color: PAL.white, side: THREE.BackSide, fog: 0.5 }), 6, 's12-cone-cores');
    instColors(s.cores, PAL.cream);
    kit.group.add(s.cores);
    s.hous = inst(merge([{ g: box(1.4, 1.8, 1.4, 0, 0.4, 0), c: 0.04 }, { g: new THREE.CircleGeometry(0.55, 10).rotateX(Math.PI / 2).translate(0, -0.52, 0), c: PAL.cream }]), kit.flat({ color: PAL.white, vertexColors: true }), 6, 's12-housing');
    kit.group.add(s.cones, s.hous);
    // --- the Walker (looks like the Engineer: the double), legs step, pole balances
    s.walker = new THREE.Group(); kit.group.add(s.walker);
    const blk = kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5, vertexColors: true });
    s.walker.add(new THREE.Mesh(engineerGeo('pole'), blk));
    s.legL = new THREE.Mesh(merge([{ g: box(0.15, 0.78, 0.17, 0, -0.39, 0) }]), blk); s.legL.position.set(-0.11, 0.78, 0);
    s.legR = new THREE.Mesh(merge([{ g: box(0.15, 0.78, 0.17, 0, -0.39, 0) }]), blk); s.legR.position.set(0.11, 0.78, 0);
    s.pole = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 0.06), kit.flat({ color: PAL.gold })); s.pole.position.set(0, 1.2, 0.22);
    s.wGlass = new THREE.Mesh(glassesGeo(), kit.flat({ color: PAL.white, vertexColors: true }));
    s.walker.add(s.legL, s.legR, s.pole, s.wGlass);
    s.walker.scale.setScalar(1.35); s.walker.position.copy(WALK);
    // --- the Angel on her trapeze: body, cream mask with gold halo, crescent smile, cut-out wings
    s.trap = new THREE.Mesh(merge([{ g: box(0.04, ROPE, 0.04, -0.75, -ROPE / 2, 0) }, { g: box(0.04, ROPE, 0.04, 0.75, -ROPE / 2, 0) }, { g: box(1.6, 0.07, 0.07, 0, -ROPE, 0), c: PAL.gold }]), kit.flat({ color: PAL.white, vertexColors: true }));
    kit.group.add(s.trap);
    s.angel = new THREE.Group(); kit.group.add(s.angel);
    s.angel.add(new THREE.Mesh(engineerGeo('up'), blk));
    s.mask = new THREE.Mesh(merge([{ g: disc(0.19, 12, 0, 1.64, 0.17), c: PAL.cream }, { g: new THREE.TorusGeometry(0.22, 0.025, 4, 18).rotateX(Math.PI / 2).translate(0, 1.95, 0), c: PAL.gold }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.smile = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.1, 10, 1, Math.PI * 1.15, Math.PI * 0.7).translate(0, 1.64, 0.175), kit.flat({ color: PAL.velvet }));
    s.aGlass = new THREE.Mesh(glassesGeo(), kit.flat({ color: PAL.red }));
    s.angel.add(s.mask, s.smile, s.aGlass);
    s.angel.scale.setScalar(1.35);
    s.wings = inst(merge([{ g: shape(WING, 1.3), c: 1 }]), kit.flat({ color: PAL.cream, vertexColors: true, side: THREE.DoubleSide }), 2, 's12-wings');
    kit.group.add(s.wings);
    // --- banner (black, cream pennants) hanging from the rig ahead-left, swaying
    s.banner = new THREE.Group(); s.banner.position.set(-3.2, 3.7, -12.5); s.tent.add(s.banner);
    const pen = [];
    for (let i = 0; i < 9; i++) pen.push({ g: new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-3.6 + i * 0.9, -1.0, 0.02, -3.6 + (i + 1) * 0.9, -1.0, 0.02, -3.6 + (i + 0.5) * 0.9, -1.7, 0.02], 3)), c: PAL.cream });
    s.banner.add(new THREE.Mesh(merge([{ g: box(7.4, 2.0, 0.06), c: 0.03 }, { g: box(7.6, 0.1, 0.1, 0, 1.0, 0), c: PAL.cream }, { g: box(0.04, 9, 0.04, -3.4, 5.5, 0), c: 0.05 }, { g: box(0.04, 9, 0.04, 3.4, 5.5, 0), c: 0.05 }, ...pen]), kit.flat({ color: PAL.white, vertexColors: true, side: THREE.DoubleSide })));
    // --- type
    s.tGold = kit.text('GOLD ON THE WIRE', { cap: 0.95, color: 'gold', near: 95.16, out: 97.6, parent: s.banner });
    fitText(s.tGold, 6.9); s.tGold.mesh.position.set(0, 0.05, 0.06);
    s.tFire = kit.text('FIRE IN THE', { cap: 1.1, color: 'cream', near: T_FIRE, say: 'fire in the', out: 99.6, at: { d: 7, az: 24, y: 3.0 } });
    s.tSky = kit.text('SKY', { cap: 1.9, color: 'gold', near: T_SKY, say: 'sky', pop: true, out: 99.6, at: { d: 7, az: 24, y: 1.35 } });
    s.tSmile = kit.text('SMILE LIKE\nAN ANGEL', { cap: 0.95, color: 'cream', near: T_SMILE, say: 'smile like an angel', out: 102.05, at: { d: 7, az: -21, y: 2.2 } });
    s.tLie = kit.text('LIE LIKE A', { cap: 1.3, color: 'gold', near: T_LIE, say: 'lie like a', out: 103.74, at: { d: 7, az: 21, y: 3.0 } });
    s.tSpy = kit.text('SPY', { cap: 2.3, color: 0xb8261a, near: T_SPY, say: 'spy', pop: true, out: 103.74, at: { d: 7, az: 21, y: 1.25 } });
    for (const T of [s.tFire, s.tSky, s.tSmile, s.tLie, s.tSpy]) T.mesh.material.depthTest = false; // hoops and flames pass between
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    const live = t >= T_IN - 0.02, port = t >= T_PORT, pass = s.hz[3] + d > 0.05;
    kit.group.visible = live && !pass;
    s.tent.position.z = d; s.hoopsG.position.z = d;
    const inShow = !port;
    s.tent.visible = inShow;
    // roof stripes: carmine/black, a crimson flash runs round on "sky"; roof turns 3 deg/s
    s.roof.rotation.y = t * 0.052;
    const c = TMP.c;
    for (let k = 0; k < 24; k++) {
      const f = t >= T_SKY ? Math.max(0, 1 - Math.abs((t - T_SKY) * 26 - k) / 3) * (1 - sm(T_SKY + 0.9, T_SKY + 1.6, t)) : 0;
      c.set(k % 2 ? PAL.velvet : PAL.carmine);
      if (f > 0) c.set(PAL.crimson).multiplyScalar(0.6 + 0.6 * f);
      for (let v = 0; v < s.roofN; v++) s.roofCol.set([c.r, c.g, c.b], (k * s.roofN + v) * 3);
    }
    s.roof.geometry.getAttribute('color').needsUpdate = true;
    // audience eyes: on tier by tier in a wave around 360 deg; occasional blinks
    for (let i = 0; i < 600; i++) {
      const on = t >= s.audT[i] && ((t * 0.31 + s.audB[i] * 7) % 1) > 0.025;
      setC(s.eyes, i, on ? PAL.white : 0x000000, on ? 1 + 1.2 * env(t, s.audT[i], 5) : 1);
    }
    s.eyes.instanceColor.needsUpdate = true;
    // fire-breathers blow on "fire"
    for (let i = 0; i < 4; i++) {
      const [x, z] = s.bpos[i];
      const k = t >= T_FIRE ? easeOut((t - T_FIRE - i * 0.08) / 0.25) * (1 - sm(T_FIRE + 1.6, T_FIRE + 2.2, t)) : 0;
      const fl = 1 + 0.12 * Math.sin(t * 14 + i);
      for (let l = 0; l < 2; l++) setI(s.flame, i * 2 + l, x, 2.6, z + (z > 0 ? 0.3 : -0.3), (z > 0 ? 0.55 : -0.55), 0, x * 0.12, (l ? 0.5 : 0.95) * k + 1e-4, (l ? 5 : 8) * k * fl + 1e-4, (l ? 0.5 : 0.95) * k + 1e-4);
    }
    s.flame.instanceMatrix.needsUpdate = true;
    // hoops: tongues ignite one per beat and flicker (per tongue, never full-view)
    for (let i = 0; i < s.tongD.length; i++) {
      const q = s.tongD[i], hr = HR[q.k], sc = q.k === 3 ? 1.45 : 1;
      const ig = easeOut((t - IGN[q.k]) / 0.25);
      const vis = q.k === 3 || !port;
      const len = (q.l === 0 ? 1.15 : q.l === 1 ? 0.75 : 0.32) * sc * ig * (0.75 + 0.25 * Math.sin(t * q.f + q.ph)) * (vis ? 1 : 0);
      const r0 = hr + 0.05 + (q.l === 2 ? 0.55 * sc * ig : 0);
      setI(s.tong, i, Math.cos(q.a) * r0, 1.6 + Math.sin(q.a) * r0, s.hz[q.k], 0, 0, q.a - Math.PI / 2, (q.l === 2 ? 0.16 : 0.34) * sc + 1e-4, len + 1e-4, 1);
    }
    s.tong.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < 3; k++) setI(s.hoops, k, 0, 1.6, s.hz[k], 0, 0, 0, port ? 0 : HR[k]);
    s.hoops.instanceMatrix.needsUpdate = true;
    s.matte.visible = port && !pass;
    // the Walker steps on the spot (he keeps 15 m ahead), pole tilts
    const st = Math.sin(t * Math.PI * 1.76);
    s.walker.visible = inShow; s.legL.rotation.x = 0.35 * st; s.legR.rotation.x = -0.35 * st;
    s.pole.rotation.z = 0.08 * Math.sin(t * 1.3);
    s.walker.position.y = WALK.y + 0.04 * Math.abs(st);
    // the Angel: high back-left, swings over the player (5.6 m above the eyes), lets go at the
    // forward top on "angel", the Walker catches her; on "lie" wings and mask fall: red glasses
    const piv = s.v.set(0, PIV_Y, d - s.prof.d(100.1));
    let th;
    if (t < T_SMILE) th = -1.22;
    else if (t < 100.1) th = -1.22 * (1 - easeIn((t - T_SMILE) / 0.42));
    else if (t < T_ANGEL) th = 1.08 * easeOut((t - 100.1) / (T_ANGEL - 100.1));
    else th = 1.08 - 0.9 * easeInOut((t - T_ANGEL) / 2.2);
    const bar = s.w.copy(SWING_U).multiplyScalar(Math.sin(th) * ROPE).add(piv); bar.y -= Math.cos(th) * ROPE;
    s.trap.visible = inShow;
    s.trap.position.copy(piv);
    s.q.setFromAxisAngle(TMP.w.set(SWING_U.z, 0, -SWING_U.x).normalize(), -th); s.trap.quaternion.copy(s.q);
    const A = s.angel.position;
    if (t < T_ANGEL) { A.set(0, -2.75, 0).applyQuaternion(s.q).add(bar); s.angel.quaternion.copy(s.q); }
    else {
      const k = clamp01((t - T_ANGEL) / (T_CATCH - T_ANGEL));
      TMP.v.set(Math.sin(1.08) * ROPE * SWING_U.x, PIV_Y - Math.cos(1.08) * ROPE - 2.7, (s.prof.d(T_ANGEL) - s.prof.d(100.1)) + Math.sin(1.08) * ROPE * SWING_U.z);
      A.copy(TMP.v).lerp(TMP.w.set(0.95, WALK.y, WALK.z), easeInOut(k)); A.y += Math.sin(k * Math.PI) * 2.5;
      s.angel.quaternion.identity();
      if (k >= 1) A.y = WALK.y;
    }
    s.angel.visible = inShow && t > T_IN;
    const lie = t >= T_LIE;
    s.mask.visible = !lie; s.aGlass.visible = lie;
    s.smile.material.uniforms.uColor.value.set(t >= T_UP ? PAL.cream : PAL.velvet);
    s.smile.material.uniforms.uBright.value = 1 + 1.4 * env(t, T_UP, 4);
    // wings: on her back, then two tumbling cut-outs falling into the ring
    for (let w = 0; w < 2; w++) {
      const sg = w ? 1 : -1;
      if (!lie) {
        TMP.v.set(sg * 0.15, 1.55, -0.12).multiplyScalar(1.35).applyQuaternion(s.angel.quaternion).add(A);
        TMP.e.setFromQuaternion(s.angel.quaternion, 'YXZ');
        setI(s.wings, w, TMP.v.x, TMP.v.y, TMP.v.z, TMP.e.x, TMP.e.y + (w ? 0 : Math.PI), TMP.e.z + 0.15 * Math.sin(t * 9), inShow ? 1 : 0);
      } else {
        const a = t - T_LIE;
        setI(s.wings, w, 0.95 + sg * (0.5 + a * 1.8), WALK.y + 2 - 4.9 * a * a, WALK.z + a * 1.2, a * 3.1 * sg, a * 2.3, a * 4.2, inShow ? 1 : 0);
      }
    }
    s.wings.instanceMatrix.needsUpdate = true;
    // spotlights: snap onto the Walker, two follow the fire/angel, the Walker's turns rust on "lie",
    // all swing onto the cradle on "spy"
    for (let i = 0; i < 6; i++) {
      const T = s.tg[i];
      T.set(WALK.x, WALK.y + 1.6, WALK.z);
      if (t >= T_FIRE && t < T_SMILE && i >= 4) T.set(0, 1.6, s.hz[Math.min(3, Math.max(0, Math.floor((t - T_FIRE) / 0.57)))] + d);
      if (t >= T_SMILE && t < T_CATCH && (i === 1 || i === 4)) T.copy(A).y += 1.6;
      if (t >= T_SPY) T.lerp(TMP.w.set(0, 0.6, 0), easeInOut((t - T_SPY - i * 0.02) / 0.22));
      const S = TMP.v.copy(s.srcs[i]); S.z += d;
      const dir = TMP.w.copy(T).sub(S); let L = dir.length(); dir.divideScalar(L);
      if (t >= T_SPY) L = Math.max(4, L - 3.2 * sm(T_SPY, T_SPY + 0.22, t));
      s.q.setFromUnitVectors(s.dn, dir);
      // on "spy" the beams converge onto the cradle and narrow, so they never fill the view
      let R = 2.1 - 1.2 * sm(T_SPY, T_SPY + 0.22, t);
      // a beam whose end lands near the cradle stops >= 7 m from the eyes and narrows (no wall of cream)
      const ex = S.x + dir.x * L, ey = S.y + dir.y * L - 1.6, ez = S.z + dir.z * L - 0.05;
      const dE = Math.hypot(ex, ey, ez);
      if (dE < 7) { L = Math.max(4, L - (7 - dE)); R *= Math.max(0.45, dE / 7); }
      setIQ(s.cones, i, S, s.q, R, L, R);
      setIQ(s.cores, i, S, s.q, R * 0.3, L, R * 0.3);
      setIQ(s.hous, i, S, s.q, 1, 1, 1);
      setC(s.cones, i, lie && t < T_SPY && i < 4 ? PAL.rust : PAL.gold, 1);
    }
    s.cones.instanceMatrix.needsUpdate = true; s.cores.instanceMatrix.needsUpdate = true; s.hous.instanceMatrix.needsUpdate = true; s.cones.instanceColor.needsUpdate = true;
    s.hous.visible = inShow;
    s.cones.visible = s.cores.visible = inShow && t >= T_IN + 0.08;
    s.cones.material.uniforms.uBright.value = s.cores.material.uniforms.uBright.value = 1 + 0.12 * kit.beatEnv(t, 6);
    // banner sways
    s.banner.rotation.set(0.07 * Math.sin(t * 1.4), 0.25, 0.03 * Math.sin(t * 1.1));
    s.banner.visible = t < 98.6;
    s.tSky.u.uBright.value = 1 + 1.5 * env(t, T_SKY, 3);
    if (kit.isOwner) {
      kit.rigState.wheelSpin = d / 0.075;
      if (t >= T_SPY) kit.rigState.lampOn = 1;
      if (port) kit.setSky({ rays: 0, rings: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, nadir: PAL.black });
      else kit.setSky({ rot: t * 0.035, ringPhase: t * 0.12 });
    }
  },
  events() {
    return [
      { t: T_IN + 0.02, sfx: 'shutter', gain: 0.6 },
      { t: T_FIRE, sfx: 'whoosh', gain: 0.55, haptic: [0.3, 60] },
      { t: T_SMILE, sfx: 'whoosh', gain: 0.4 },
      { t: T_CATCH, sfx: 'grab', gain: 0.55, haptic: [0.3, 40] },
      { t: T_SPY, sfx: 'shutter', gain: 0.7, haptic: [0.4, 50] },
    ];
  },
};
