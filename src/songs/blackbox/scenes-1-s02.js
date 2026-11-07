// S02 The Nixie Hall (9.18 to 16.00, hot). Twelve 16 m Nixie tubes ring the player; the countdown
// lands on "zero". Out: PORTAL (the front tube's gold 0 slides down the wire and passes the eyes ~15.8;
// S03 shows only through it via kit.matte from 15.4).
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { scratch } from './scenes-1-util.js';

const FLOOR_Y = -2.6, R_RING = 22;
// digit polylines in a unit box (x -0.5..0.5, y 0..1); arcs as point runs
const arc = (cx, cy, rx, ry, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const P = Math.PI;
const DIGITS = [
  [arc(0, 0.5, 0.36, 0.5, 0, 2 * P, 20)],
  [[[-0.18, 0.78], [0.06, 1], [0.06, 0]], [[-0.16, 0], [0.26, 0]]],
  [[...arc(0, 0.73, 0.34, 0.27, P * 0.95, -P * 0.2, 9), [-0.36, 0], [0.38, 0]]],
  [[...arc(0, 0.76, 0.32, 0.24, P * 0.9, -P * 0.5, 8), ...arc(0, 0.28, 0.36, 0.28, P * 0.5, -P * 0.9, 9)]],
  [[[0.14, 0], [0.14, 1], [-0.38, 0.3], [0.4, 0.3]]],
  [[[0.32, 1], [-0.28, 1], [-0.32, 0.56], ...arc(0, 0.32, 0.36, 0.32, P * 0.72, -P * 0.85, 10)]],
  [[...arc(0.04, 0.84, 0.3, 0.16, P * 0.15, P, 6), [-0.34, 0.3], ...arc(0, 0.3, 0.34, 0.3, P, -P, 14)]],
  [[[-0.36, 1], [0.38, 1], [-0.1, 0]]],
  [arc(0, 0.76, 0.28, 0.24, -P / 2, P * 1.5, 14), arc(0, 0.27, 0.34, 0.27, P / 2, P * 2.5, 14)],
  [[...arc(0, 0.7, 0.34, 0.3, 0, 2 * P, 14), [0.34, 0.6], [0.3, 0.28], ...arc(-0.04, 0.16, 0.3, 0.16, 0, -P, 6)]],
];
function digitGeo(k, h, r) {
  const parts = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  for (const line of DIGITS[k]) {
    for (let i = 0; i + 1 < line.length; i++) {
      a.set(line[i][0] * h * 0.62, line[i][1] * h - h / 2, 0); b.set(line[i + 1][0] * h * 0.62, line[i + 1][1] * h - h / 2, 0);
      const L = a.distanceTo(b); if (L < 1e-4) continue;
      const c = new THREE.CylinderGeometry(r, r, L + r * 1.2, 5, 1, true);
      dir.subVectors(b, a).normalize(); q.setFromUnitVectors(up, dir); mid.addVectors(a, b).multiplyScalar(0.5);
      c.applyQuaternion(q); c.translate(mid.x, mid.y, mid.z);
      parts.push(c);
    }
  }
  return mergeSimple(parts);
}
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export const S02 = {
  id: 'S02', t0: 9.18, t1: 16.0, world: 'hot', pre: 0, post: 0,
  key: [0.2, 0.6, 0.77], sky: 'black',
  fog: { color: PAL.velvet, near: 26, far: 120 },
  build(kit) {
    const s = { x: scratch() };
    s.x.m2 = new THREE.Matrix4();
    s.prof = kit.travel([[9.18, 0.8, 1.0], [15.0, 5, 1.0]]);
    s.z0 = -22.2 + s.prof.d(12.8);
    s.hall = new THREE.Group(); kit.group.add(s.hall);
    s.ringG = new THREE.Group(); s.hall.add(s.ringG);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 40).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    floor.position.y = FLOOR_Y; s.hall.add(floor); s.floor = floor;
    // gold flash ring on the floor at r 22 (one frame on "zero")
    s.flashRing = new THREE.Mesh(new THREE.RingGeometry(R_RING - 0.5, R_RING + 0.5, 64).rotateX(-Math.PI / 2), kit.flat({ color: PAL.gold, fog: 0 }));
    s.flashRing.position.y = FLOOR_Y + 0.02; s.hall.add(s.flashRing);
    // dome: 8 petals (black, a crimson ring near the top), folding outward on "tonight"
    const RD = 26, pet = [];
    for (let i = 0; i < 6; i++) { const e0 = (i / 6) * (P / 2), e1 = ((i + 1) / 6) * (P / 2); pet.push([e0, e1]); }
    const pos = [], col = [];
    const pt = (el, az) => [RD * Math.cos(el) * Math.sin(az), RD * Math.sin(el), -RD * Math.cos(el) * Math.cos(az) + RD];
    const rows = [0, 0.35, 0.7, 1.0, 1.22, 1.3, 1.36, 1.42, P / 2 - 0.02];
    for (let r = 0; r + 1 < rows.length; r++) {
      const red = r === 5;
      for (let j = 0; j < 4; j++) {
        const a0 = -P / 8 + (j / 4) * (P / 4), a1 = -P / 8 + ((j + 1) / 4) * (P / 4);
        const A = pt(rows[r], a0), B = pt(rows[r], a1), C = pt(rows[r + 1], a1), D = pt(rows[r + 1], a0);
        pos.push(...A, ...B, ...C, ...A, ...C, ...D);
        for (let v = 0; v < 6; v++) col.push(...(red ? [0.69, 0.007, 0.012] : [0, 0, 0]));
      }
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const pMat = kit.flat({ color: PAL.white, vertexColors: true, side: THREE.DoubleSide, fog: 0 });
    s.petals = [];
    for (let i = 0; i < 8; i++) {
      const hold = new THREE.Group(); hold.rotation.y = -(i * P) / 4;
      const piv = new THREE.Group(); piv.position.set(0, FLOOR_Y, -RD);
      piv.add(new THREE.Mesh(pg, pMat));
      hold.add(piv); s.hall.add(hold); s.petals.push(piv);
    }
    // tubes: 12 ring + 1 front (bigger). Body = inside of an open cylinder (dark backdrop, cream rim)
    s.bodyMat = kit.toon({ ramp: 'black', rim: PAL.cream, rimTh: 0.45, side: THREE.BackSide });
    const body = new THREE.CylinderGeometry(2, 2, 16, 18, 1, true).translate(0, 8, 0);
    s.bodies = new THREE.InstancedMesh(body, s.bodyMat, 13);
    const capG = mergeSimple([new THREE.CylinderGeometry(2.25, 2.25, 1.0, 18).translate(0, 0.5, 0), new THREE.CylinderGeometry(1.0, 2.25, 0.8, 18).translate(0, 16.4, 0), new THREE.CylinderGeometry(2.25, 2.25, 0.6, 18).translate(0, 15.7, 0)]);
    s.caps = new THREE.InstancedMesh(capG, kit.toon({ ramp: 'hot', rim: PAL.gold }), 13);
    s.tubeM = [];
    const m = s.x.m, q = s.x.q, p = s.x.p, sc = s.x.s;
    for (let k = 0; k < 13; k++) {
      const front = k === 12;
      const a = front ? 0 : ((k + 0.5) / 12) * P * 2;
      const r = front ? 24 : R_RING;
      p.set(Math.sin(a) * r, FLOOR_Y, -Math.cos(a) * r); q.setFromAxisAngle(s.x.v.set(0, 1, 0), -a);
      sc.set(front ? 1.5 : 1, front ? 22 / 16 : 1, front ? 1.5 : 1);
      m.compose(p, q, sc); s.tubeM.push(m.clone());
      s.bodies.setMatrixAt(k, m); s.caps.setMatrixAt(k, m);
    }
    s.tubes = new THREE.Group();
    s.tubes.add(s.bodies, s.caps);
    // digits: one InstancedMesh per numeral, 13 instances (one per tube), stacked front to back
    s.digits = []; s.frontDM = []; s.dM = []; s.zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
    const dm = kit.flat({ color: PAL.white, fog: 0.7 });
    for (let dgt = 0; dgt < 10; dgt++) {
      const im = new THREE.InstancedMesh(digitGeo(dgt, 3.5, 0.075), dm, 13);
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(13 * 3), 3);
      for (let k = 0; k < 13; k++) {
        const front = k === 12;
        const local = new THREE.Matrix4().makeTranslation(0, front ? (1.8 - FLOOR_Y) / 1.375 : 4 - FLOOR_Y, 1.2 - dgt * 0.12);
        if (front) local.multiply(new THREE.Matrix4().makeScale(8 / 3.5 / 1.5, 8 / 3.5 / 1.375, 1));
        const L = s.tubeM[k].clone().multiply(local);
        im.setMatrixAt(k, L);
        (s.dM[dgt] ||= [])[k] = L;
        if (front) s.frontDM.push(L);
      }
      s.digits.push(im); s.tubes.add(im);
    }
    s.ringG.add(s.tubes); // the ring yaws slowly; instance 12 (front tube) is counter-rotated each frame
    // the big zero ring (8 m), detaches on "Gold" and slides down the wire through the player
    s.zero = new THREE.Group(); kit.group.add(s.zero);
    s.zeroMesh = new THREE.Mesh(new THREE.TorusGeometry(4, 0.17, 6, 48), kit.flat({ color: PAL.gold, fog: 0.3 }));
    s.zero.add(s.zeroMesh);
    s.matte = kit.matte({ shape: 'circle', r: 3.86 });
    s.matte.position.z = -0.05;
    s.zero.add(s.matte);
    // stars (folded-open sky)
    s.stars = kit.particles({ n: 400, shape: 'disc', fog: 0, opacity: 0.999, seed: 7, init: (i, r) => {
      const az = r() * P * 2, el = 0.06 + Math.asin(r()) * 0.98;
      return { p: [Math.cos(el) * Math.sin(az) * 180, Math.sin(el) * 180, -Math.cos(el) * Math.cos(az) * 180], s: 0.35 + r() * 0.55, c: r() < 0.15 ? PAL.cream : PAL.white };
    } });
    kit.group.add(s.stars);
    // the hanging rod for GOLD ON THE WIRE
    // ---- type ----
    s.countT = kit.text('COUNT DOWN TO', { cap: 0.62, color: 'gold', tracking: 0.08, times: [9.2, 9.2, 9.3], out: 10.46, at: { d: 6, az: 0, y: 3.2 } });
    s.zeroT = kit.text('ZERO', { cap: 1.6, color: 'gold', times: 9.48, pop: true, dur: 0.1, out: 10.46, outDur: 0.05, at: { d: 6, az: 0, y: 1.6 } });
    s.why = kit.text("DON'T ASK ME WHY", { cap: 0.95, color: 'cream', near: 10.46, out: 12.7, at: { d: 6, az: 22, y: 1.8 } });
    s.why.redact(3, 11.82);
    s.goldG = new THREE.Group(); kit.place(s.goldG, { d: 7, az: 0, y: 2.62 }); kit.group.add(s.goldG);
    s.goldT = kit.text('GOLD ON THE WIRE', { cap: 1.05, color: 'gold', vAlign: 'top', times: [12.8, 13.62, 13.84, 14.02], out: 15.35, parent: s.goldG });
    const strings = [new THREE.BoxGeometry(6.6, 0.05, 0.05).translate(0, 0.62, 0)];
    for (const w of s.goldT.words) strings.push(new THREE.BoxGeometry(0.025, 0.62, 0.025).translate((w.x0 + w.x1) / 2, 0.31, 0));
    s.rod = new THREE.Mesh(mergeSimple(strings), kit.flat({ color: PAL.brass }));
    s.goldG.add(s.rod);
    s.tonight = kit.text('TONIGHT', { cap: 1.0, color: 'cream', near: 14.56, pop: true, out: 15.55, at: { d: 7, az: 15, y: 3.45 } });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.hall.position.z = d;
    s.ringG.rotation.y = (t - 9.18) * 0.105;
    const lit = t >= 9.48;
    const zkP = Math.min(1, Math.max(0, (t - 12.8) / 3.0)), zzP = s.z0 + (0.05 - s.z0) * zkP * zkP;
    // which numeral each tube shows (-1 = dark)
    const ringDigit = (k) => {
      if (!lit) return -1;
      if (t < 10.46) return 0;
      if (t < 11.47) return Math.floor(hash(k, Math.floor((t - 10.46) * 6)) * 10);
      if (t < 11.82) return Math.floor(hash(k, 99) * 10);
      // relight clockwise from the front-right, 0.08 s apart, on the 13.75 downbeat
      return t >= 13.75 + 0.08 * k ? 0 : -1;
    };
    const frontDigit = lit && t < 12.8 ? 0 : -1;
    const c = s.x.c;
    for (let dg = 0; dg < 10; dg++) {
      const im = s.digits[dg];
      for (let k = 0; k < 13; k++) {
        const v = k === 12 ? frontDigit : ringDigit(k);
        if (v === dg) c.setHex(PAL.gold); else c.setHex(k === 12 && t >= 12.8 && dg === 0 ? 0x000000 : PAL.brassDark);
        if (!lit) c.multiplyScalar(0.35);
        im.setColorAt(k, c);
      }
      im.instanceColor.needsUpdate = true;
    }
    // the front tube stays put while the ring yaws: counter-rotate its instance by re-setting it
    // (tube bodies/caps of instance 12 use the ring group's rotation, so undo it)
    s.x.m.makeRotationY(-s.ringG.rotation.y).multiply(s.tubeM[12]);
    s.bodies.setMatrixAt(12, s.x.m); s.caps.setMatrixAt(12, s.x.m);
    s.bodies.instanceMatrix.needsUpdate = true; s.caps.instanceMatrix.needsUpdate = true;
    for (let dg = 0; dg < 10; dg++) { s.x.m2.makeRotationY(-s.ringG.rotation.y).multiply(s.frontDM[dg]); s.digits[dg].setMatrixAt(12, s.x.m2); s.digits[dg].instanceMatrix.needsUpdate = true; }
    // portal: ring tubes beyond the ring plane vanish (only S03 shows through the hole), the floor too
    s.floor.visible = t < 15.4;
    for (let k = 0; k < 12; k++) {
      const a = ((k + 0.5) / 12) * P * 2, r = s.ringG.rotation.y;
      const x0 = Math.sin(a) * R_RING, z0 = -Math.cos(a) * R_RING;
      const zw = -x0 * Math.sin(r) + z0 * Math.cos(r) + d;
      const hide = t >= 15.4 && zw < zzP - 1;
      s.bodies.setMatrixAt(k, hide ? s.zeroM : s.tubeM[k]); s.caps.setMatrixAt(k, hide ? s.zeroM : s.tubeM[k]);
      for (let dg = 0; dg < 10; dg++) s.digits[dg].setMatrixAt(k, hide ? s.zeroM : s.dM[dg][k]);
    }
    if (t >= 15.4) { s.bodies.setMatrixAt(12, s.zeroM); s.caps.setMatrixAt(12, s.zeroM); for (let dg = 0; dg < 10; dg++) s.digits[dg].setMatrixAt(12, s.zeroM); }
    for (const pv of s.petals) pv.visible = t < 15.4;
    s.bodyMat.uniforms.uRim.value.setHex(t >= 11.44 ? PAL.crimson : PAL.cream);
    s.bodyMat.uniforms.uRimAmt.value = lit ? 1 : 0.15;
    s.caps.material.uniforms.uBright.value = lit ? 1 : 0.25;
    s.flashRing.visible = t >= 9.48 && t < 9.515;
    // petals fold outward on "tonight"
    for (let i = 0; i < 8; i++) s.petals[i].rotation.x = -1.9 * kit.ease.inOut((t - 14.56 - (i % 2) * 0.06) / 0.75);
    s.stars.visible = t >= 14.6 && t < 15.8;
    s.stars.material.uniforms.uOpacity.value = t >= 15.43 && t < 15.6 ? 0.45 : 1;
    // the zero ring: detaches on "Gold", eases down the wire, passes the eyes at ~15.8
    const zk = Math.min(1, Math.max(0, (t - 12.8) / 3.0));
    let zz = s.z0 + (0.05 - s.z0) * zk * zk;
    if (t > 15.8) zz = 0.05 + (t - 15.8) * 16;
    s.zero.visible = t >= 12.8 && t < 16.0;
    s.zero.position.set(0, 1.8, zz);
    s.zeroMesh.scale.set(0.446 + 0.554 * sm(12.8, 14.0, t), 1, 1);
    s.matte.visible = t >= 15.4 && zz < 0.0;
    s.hall.visible = !(t >= 15.8);
    s.goldG.rotation.z = 0.05 * Math.sin(t * 2.2);
    s.rod.visible = t >= 12.8 && t < 15.35;
    if (kit.isOwner) {
      const R = kit.rigState;
      R.wheelSpin = d / 0.075;
      R.dark = t < 9.48 ? 1 : 0;
      // three gold sparks run from the zero to the cradle on "on the wire"
      for (const ts of [13.62, 13.84, 14.02]) {
        const a = (t - ts) / 0.4;
        if (a >= 0 && a < 1) R.wire.pulses.push({ z: zz * (1 - a), a: 1, w: 0.9 });
        if (t >= ts && t < ts + 0.12) R.gauge = 1;
      }
      kit.setSky(t >= 15.4 ? { moonR: 0.07, moonDir: [0.33, 0.26, -0.91], hor: PAL.petrolDeep, stars: 0.5 } : {});
    }
    return t >= 9.48 && t < 9.51 ? { flash: PAL.gold } : undefined;
  },
  events() {
    return [
      { t: 9.48, sfx: 'switch', gain: 0.7, haptic: [0.5, 60] },
      { t: 10.46, sfx: 'tick', gain: 0.35 },
      { t: 11.82, sfx: 'shutter', gain: 0.5 },
      { t: 12.8, sfx: 'slot', gain: 0.45 },
      { t: 14.56, sfx: 'hatch', gain: 0.45 },
      { t: 15.75, sfx: 'whoosh', gain: 0.7, haptic: [0.4, 80] },
    ];
  },
};
