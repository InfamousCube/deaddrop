// S12 The Big Top high wire (95.18-104.33, hot chorus). Clean rework 07.11.
// SHOT CARD (the player floats still above the ring, the gold high wire starts at a mast 4 m ahead)
//   beat A 95.18-99.68  hero: the Walker (the Engineer's double), a big black silhouette with a gold
//                       rim on the high wire, in ONE gold spotlight from the upper left. On "fire" a
//                       burning hoop ignites as he steps through it; on "sky" the dark roof flashes
//                       into the crimson sunburst once (the chorus hit), then goes dark again.
//                       palette: black (tiers, floor, roof) + carmine (tent wall) + gold accent.
//   beat B 99.68-103.5  hero: the Angel on her trapeze, one slow pendulum swing left-right-left,
//                       cream mask and wings; the spotlight follows her. On "lie" mask and wings fall,
//                       red glasses show.
//   beat C 103.5-104.33 "spy": lights out, only her red glasses and the red word SPY stay. Cut.
//   lyric: one block at a time, right of the wire (az +26, clear of the hoop) on the calm carmine wall / black tiers.
//   removed: 24 permanent roof stripes, 600 audience heads with eyes, 6 spotlights with cores,
//            4 fire-breathers, 4 hoops with 432 flame tongues, banner with pennants, rigging lines,
//            the catch, the portal matte (now a lights-out cut).
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, box, disc, ball, shape, fitText, sm, clamp01, easeOut, env, TMP } from './scenes-3-util.js';

const T_IN = 95.18, T_FIRE = 97.44, T_SKY = 98.92, T_SMILE = 99.68, T_LIE = 102.1, T_SPY = 103.5, T_END = 104.33;
const C = new THREE.Vector3(0, 0, -14), TR = 30, FLOOR = -11, WIRE_Y = -0.7;
const HOOP = { z: -12.0, y: 1.3, r: 2.3 };
const AS = 1.8, HANG = 2.12 * AS, PIV = new THREE.Vector3(2.5, 13.5, -9.5), ROPE = 8.5, AMP = 0.3, HALF = (T_SPY - T_SMILE) / 2;
const SPOT = new THREE.Vector3(-11, 15, -12);
const walkZ = (t) => -9.4 - 1.15 * (t - T_IN);
// a point on the swinging trapeze: (lx, ly) in rope space (pivot at 0, rope down -y), swing angle th about z
function onRope(out, lx, ly, th) {
  const c = Math.cos(th), s = Math.sin(th);
  return out.set(PIV.x + lx * c - ly * s, PIV.y + lx * s + ly * c, PIV.z);
}

// the Engineer silhouette (bob, high collar, coverall), feet at y 0, facing +z
function engineerGeo(arms) {
  const P = [
    { g: ball(0.15, 7, 5, 0, 1.63, 0) }, { g: box(0.36, 0.26, 0.32, 0, 1.66, -0.03) }, { g: box(0.3, 0.16, 0.26, 0, 1.43, 0) },
    { g: box(0.44, 0.62, 0.26, 0, 1.08, 0) }, { g: box(0.46, 0.1, 0.28, 0, 0.78, 0) },
  ];
  if (arms === 'pole') P.push({ g: box(0.62, 0.11, 0.11, -0.42, 1.2, 0.12, 0, 0, 0.35) }, { g: box(0.62, 0.11, 0.11, 0.42, 1.2, 0.12, 0, 0, -0.35) });
  if (arms === 'up') P.push({ g: box(0.11, 0.72, 0.11, -0.2, 1.76, 0, 0, 0, 0.12) }, { g: box(0.11, 0.72, 0.11, 0.2, 1.76, 0, 0, 0, -0.12) }, { g: box(0.15, 0.76, 0.17, -0.11, 0.38, 0) }, { g: box(0.15, 0.76, 0.17, 0.11, 0.38, 0) });
  return merge(P);
}
const WING = [[0, 0], [0.25, 0.35], [0.7, 0.7], [1.2, 0.95], [1.05, 0.62], [1.35, 0.6], [1.1, 0.35], [1.3, 0.2], [0.9, 0.05], [0.95, -0.2], [0.5, -0.12]];

export const S12 = {
  id: 'S12', t0: T_IN, t1: T_END, world: 'hot', pre: 0, post: 0,
  key: [0.12, 0.75, -0.65], fog: { near: 30, far: 110 },
  build(kit) {
    const s = { q: new THREE.Quaternion(), dn: new THREE.Vector3(0, -1, 0), tg: new THREE.Vector3(), dir: new THREE.Vector3(), zAx: new THREE.Vector3(0, 0, 1) };
    s.tent = new THREE.Group(); kit.group.add(s.tent);
    // --- the tent: carmine wall band, dark roof (sunburst stripes only on "sky"), black tiers and ring
    s.wallMat = kit.flat({ color: PAL.carmine, side: THREE.DoubleSide, fog: 0.4 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, 10.5, 36, 1, true), s.wallMat);
    wall.position.set(C.x, 3, C.z);
    const rg = new THREE.ConeGeometry(TR, 16, 12, 1, true).toNonIndexed();
    s.roofCol = new Float32Array(rg.getAttribute('position').count * 3);
    rg.setAttribute('color', new THREE.BufferAttribute(s.roofCol, 3));
    s.roofN = rg.getAttribute('position').count / 12;
    s.roofMat = kit.flat({ color: PAL.white, vertexColors: true, side: THREE.DoubleSide, fog: 0.3 });
    s.roof = new THREE.Mesh(rg, s.roofMat); s.roof.position.set(C.x, 8 + 8, C.z);
    const tiers = new THREE.LatheGeometry([[16, FLOOR], [16, -8], [20.5, -8], [20.5, -5], [25, -5], [25, -2.2], [TR + 0.5, -2.2]].map(([r, y]) => new THREE.Vector2(r, y)), 36);
    const black = new THREE.Mesh(merge([{ g: tiers }, { g: new THREE.CircleGeometry(16, 36).rotateX(-Math.PI / 2).translate(0, FLOOR, 0) }]), kit.flat({ color: PAL.black, side: THREE.DoubleSide }));
    black.position.set(C.x, 0, C.z);
    s.ringMat = kit.flat({ color: PAL.brassDark });
    const ring = new THREE.Mesh(new THREE.RingGeometry(9.6, 10.5, 48).rotateX(-Math.PI / 2), s.ringMat);
    ring.position.set(C.x, FLOOR + 0.03, C.z);
    // the high wire (chunky) and its two black masts with platforms
    s.wireMat = kit.flat({ color: PAL.gold });
    // Leo 07.11.: nothing may start at the player. The wire begins at a mast 8 m ahead (it used to run
    // out from under the player and read as a rod attached to them when looking down).
    const wire = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 33.5).translate(0, WIRE_Y, -24.75), s.wireMat);
    const masts = new THREE.Mesh(merge([
      { g: box(0.8, 18, 0.8, 0, FLOOR + 9, -8) }, { g: new THREE.CylinderGeometry(1.8, 1.8, 0.35, 12).translate(0, WIRE_Y - 0.25, -8) },
      { g: box(0.8, 18, 0.8, 0, FLOOR + 9, -41.5) }, { g: new THREE.CylinderGeometry(1.8, 1.8, 0.35, 12).translate(0, WIRE_Y - 0.25, -41.5) },
    ]), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }));
    s.tent.add(wall, s.roof, black, ring, wire, masts);
    // --- the Walker: body, stepping legs, balancing pole
    s.blk = kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 });
    s.walker = new THREE.Group(); s.tent.add(s.walker);
    s.walker.add(new THREE.Mesh(engineerGeo('pole'), s.blk));
    const legG = box(0.15, 0.78, 0.17, 0, -0.39, 0);
    s.legL = new THREE.Mesh(legG, s.blk); s.legL.position.set(-0.11, 0.78, 0);
    s.legR = new THREE.Mesh(legG, s.blk); s.legR.position.set(0.11, 0.78, 0);
    s.pole = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.09, 0.09), s.wireMat); s.pole.position.set(0, 1.2, 0.22);
    s.walker.add(s.legL, s.legR, s.pole);
    s.walker.scale.setScalar(2.0);
    // --- the burning hoop: gold ring + 2 layers of 28 overlapping flame tongues
    s.hoop = new THREE.Group(); s.hoop.position.set(0, HOOP.y, HOOP.z); s.tent.add(s.hoop);
    s.hoopRing = new THREE.Mesh(new THREE.TorusGeometry(HOOP.r, 0.1, 5, 36), kit.toon({ ramp: 'gold', rim: PAL.cream }));
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3)); tri.computeVertexNormals();
    s.flames = inst(tri, kit.flat({ color: PAL.white, side: THREE.DoubleSide }), 56, 's12-flames');
    instColors(s.flames);
    s.fl = [];
    for (let l = 0; l < 2; l++) for (let i = 0; i < 28; i++) { const k = s.fl.length; setC(s.flames, k, l ? PAL.amber : PAL.orange); s.fl.push({ a: (i + l * 0.5) / 28 * Math.PI * 2, l, ph: i * 1.7 + l }); }
    s.hoop.add(s.hoopRing, s.flames);
    // --- one spotlight (opaque gold beam, back faces only, so silhouettes stand in front of it)
    s.beam = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16, 1, true).translate(0, -0.5, 0), kit.flat({ color: PAL.gold, side: THREE.BackSide, fog: 0.4 }));
    s.house = new THREE.Mesh(merge([{ g: box(1.6, 2.0, 1.6, 0, 0.5, 0), c: 0.04 }, { g: new THREE.CircleGeometry(0.62, 12).rotateX(Math.PI / 2).translate(0, -0.52, 0), c: PAL.cream }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.tent.add(s.beam, s.house);
    // --- the Angel on her trapeze
    s.trap = new THREE.Mesh(merge([{ g: box(0.07, ROPE, 0.07, -0.7, -ROPE / 2, 0), c: 0.06 }, { g: box(0.07, ROPE, 0.07, 0.7, -ROPE / 2, 0), c: 0.06 }, { g: box(1.6, 0.12, 0.12, 0, -ROPE, 0), c: PAL.gold }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.trap.position.copy(PIV); s.tent.add(s.trap);
    s.angel = new THREE.Group(); s.trap.add(s.angel);
    s.angel.add(new THREE.Mesh(engineerGeo('up'), s.blk));
    s.mask = new THREE.Mesh(merge([{ g: disc(0.2, 14, 0, 1.64, 0.17), c: PAL.cream }, { g: new THREE.TorusGeometry(0.23, 0.05, 4, 18).rotateX(Math.PI / 2).translate(0, 1.97, 0), c: PAL.gold }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.glassMat = kit.flat({ color: PAL.red });
    s.glass = new THREE.Mesh(merge([{ g: disc(0.075, 12, -0.08, 1.65, 0.175) }, { g: disc(0.075, 12, 0.08, 1.65, 0.175) }]), s.glassMat);
    s.angel.add(s.mask, s.glass);
    s.angel.scale.setScalar(AS);
    s.angel.position.set(0, -ROPE - HANG, 0);
    s.cV = new THREE.Color(PAL.velvet); s.cR = new THREE.Color(PAL.crimson); s.cD = new THREE.Color(PAL.carmineDeep);
    s.wings = inst(merge([{ g: shape(WING, 1.25), c: 1 }]), kit.flat({ color: PAL.cream, vertexColors: true, side: THREE.DoubleSide }), 2, 's12-wings');
    s.tent.add(s.wings);
    // --- type (one block at a time, right of the wire)
    // one short phrase at a time: right of the wire in beat A, left in beat B (the Angel swings centre-right)
    const R_ = { d: 9, az: 26, y: 1.6 }, L_ = { d: 9, az: -22, y: 1.6 };
    s.texts = [
      kit.text('GOLD ON\nTHE WIRE,', { cap: 0.85, color: 'gold', near: 95.16, say: 'gold on the wire', outDur: 0.15, out: 97.25, at: R_ }),
      kit.text('FIRE IN\nTHE SKY', { cap: 0.85, color: 'cream', colors: { 3: PAL.gold }, near: T_FIRE, say: 'fire in the sky', outDur: 0.15, out: 99.5, at: R_ }),
      kit.text('SMILE LIKE\nAN ANGEL,', { cap: 0.95, color: 'cream', near: T_SMILE, say: 'smile like an angel', outDur: 0.15, out: 101.92, at: L_ }),
      kit.text('LIE LIKE\nA SPY', { cap: 1.0, color: 'gold', colors: { 3: PAL.red }, near: T_LIE, say: 'lie like a spy', outDur: 0.15, out: 104.15, at: L_ }),
    ];
    for (const T of s.texts) fitText(T, 5.2);
    return s;
  },
  update(t, s, kit) {
    kit.group.visible = t >= T_IN;
    // lights out on "spy": everything but the red glasses and the word goes black
    const lo = 1 - sm(T_SPY, T_SPY + 0.16, t);
    s.wallMat.uniforms.uBright.value = lo;
    s.roofMat.uniforms.uBright.value = lo;
    s.ringMat.uniforms.uBright.value = lo;
    s.wireMat.uniforms.uBright.value = lo * (1 + 0.15 * kit.beatEnv(t, 6));
    s.blk.uniforms.uBright.value = lo;
    s.hoopRing.material.uniforms.uBright.value = lo;
    // roof: dark velvet, the crimson sunburst only on "sky" (one sweep in, 0.7 s, out)
    const hit = t >= T_SKY ? sm(T_SKY, T_SKY + 0.12, t) * (1 - sm(T_SKY + 0.75, T_SKY + 1.05, t)) : 0;
    const c = TMP.c;
    for (let k = 0; k < 12; k++) {
      c.copy(s.cV).lerp(k % 2 ? s.cD : s.cR, hit);
      for (let v = 0; v < s.roofN; v++) s.roofCol.set([c.r, c.g, c.b], (k * s.roofN + v) * 3);
    }
    s.roof.geometry.getAttribute('color').needsUpdate = true;
    // the Walker steps through the hoop and on into the dark
    const wz = walkZ(t);
    s.walker.visible = t < T_SMILE;
    s.walker.position.set(0, WIRE_Y + 0.08, wz);
    const st = Math.sin(t * Math.PI * 1.76);
    s.legL.rotation.x = 0.3 * st; s.legR.rotation.x = -0.3 * st;
    s.pole.rotation.z = 0.07 * Math.sin(t * 1.3);
    // hoop: flames ignite as he steps through on "fire", burn out after "sky"
    const ig = easeOut((t - T_FIRE) / 0.3) * (1 - sm(T_SKY + 0.6, T_SKY + 1.2, t));
    s.hoop.visible = t < T_SMILE + 0.4;
    for (let i = 0; i < 56; i++) {
      const f = s.fl[i];
      const len = (f.l ? 0.5 : 0.95) * ig * (0.8 + 0.2 * Math.sin(t * 11 + f.ph)) + 1e-4;
      const r0 = HOOP.r + 0.06;
      setI(s.flames, i, Math.cos(f.a) * r0, Math.sin(f.a) * r0, f.l ? 0.02 : 0, 0, 0, f.a - Math.PI / 2, f.l ? 0.36 : 0.55, len, 1);
    }
    s.flames.instanceMatrix.needsUpdate = true;
    // the Angel: one pendulum swing left-right-left from "smile" to "spy"
    const th = t < T_SMILE ? -AMP : -AMP * Math.cos(Math.PI * (Math.min(t, T_SPY) - T_SMILE) / HALF);
    s.trap.visible = t >= T_SMILE - 0.05;
    s.trap.rotation.z = th;
    const lie = t >= T_LIE;
    s.mask.visible = !lie;
    s.glass.visible = lie;
    s.glassMat.uniforms.uBright.value = 1 + 0.8 * sm(T_SPY, T_SPY + 0.2, t);
    s.glass.scale.setScalar(1 + 1.5 * sm(T_SPY, T_SPY + 0.2, t));
    s.trap.material.uniforms.uBright.value = lo;
    // wings on her back, then two cut-outs tumbling into the ring on "lie"
    const thL = -AMP * Math.cos(Math.PI * (T_LIE - T_SMILE) / HALF);
    for (let w = 0; w < 2; w++) {
      const sg = w ? 1 : -1;
      if (!lie) {
        const P = onRope(TMP.v, sg * 0.16, -ROPE - HANG + 1.55 * AS, th);
        setI(s.wings, w, P.x, P.y, P.z - 0.2, 0, w ? 0 : Math.PI, th + 0.12 * Math.sin(t * 7), t >= T_SMILE ? 1 : 0);
      } else {
        const a = t - T_LIE, P = onRope(TMP.v, sg * 0.16, -ROPE - HANG + 1.55 * AS, thL);
        setI(s.wings, w, P.x + sg * (0.3 + a * 1.4), P.y - 4.9 * a * a, P.z - 0.2 + a * 0.6, a * 2.8 * sg, a * 2.1 + (w ? 0 : Math.PI), thL + a * 3.6, t < T_SPY ? 1 : 0);
      }
    }
    s.wings.instanceMatrix.needsUpdate = true;
    // the spotlight: on the Walker, swings to the Angel on "smile"
    const T = s.tg;
    if (t < T_SMILE) T.set(0, WIRE_Y + 1.6, wz);
    else onRope(T, 0, -ROPE - HANG + 1.3 * AS, th);
    const dir = s.dir.copy(T).sub(SPOT); const L = dir.length(); dir.divideScalar(L);
    s.q.setFromUnitVectors(s.dn, dir);
    s.beam.position.copy(SPOT); s.beam.quaternion.copy(s.q); s.beam.scale.set(1.25, L + 1.5, 1.25);
    s.house.position.copy(SPOT); s.house.quaternion.copy(s.q);
    s.beam.visible = t >= T_IN + 0.1 && t < T_SPY + 0.16;
    s.beam.material.uniforms.uBright.value = lo;
    s.house.visible = lo > 0.01;
    if (kit.isOwner) {
      kit.rigState.wire.on = 0; kit.rigState.wire.pulses = [];
      kit.setSky({ rays: 0, rings: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, nadir: PAL.black });
    }
  },
  events() {
    return [
      { t: T_IN + 0.02, sfx: 'shutter', gain: 0.6 },
      { t: T_FIRE, sfx: 'whoosh', gain: 0.55, haptic: [0.3, 60] },
      { t: T_SMILE, sfx: 'whoosh', gain: 0.4 },
      { t: T_LIE, sfx: 'grab', gain: 0.45 },
      { t: T_SPY, sfx: 'switch', gain: 0.7, haptic: [0.4, 50] },
    ];
  },
};
