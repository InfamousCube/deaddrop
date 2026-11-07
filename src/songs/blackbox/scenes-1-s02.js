// S02 The Nixie Hall (9.18 to 16.00, hot).
// SHOT CARD
//   hero     one giant gold zero (an 8 m oval ring) floating straight ahead in the black
//   supports a ring of 6 big Nixie tubes (22 m, crimson caps, 20 m out; the front two at +-34 deg frame
//            the zero), each showing ONE big digit; the black dome with a crimson horizon band behind them
//   palette  black (tubes as silhouettes, floor, upper dome) + crimson field (horizon band, caps) + gold (digits, zero)
//   motion   9.48 everything slams on "zero" -> 10.46 the ring tubes scramble, 11.82 they go dark ->
//            12.80 the zero glides down to eye height and toward the player -> 13.75 the tubes relight
//            clockwise -> 14.56 the dome opens -> PORTAL: the player passes through the zero (15.8)
//   lyrics   one block at a time under the zero (d 6.5, below the eye line, in the calm forward gap):
//            COUNT DOWN TO / ZERO, DON'T ASK / ME WHY (redacted), GOLD ON / THE WIRE, TONIGHT
//   removed  the stacked dark digits in every tube, the front tube, the 400 stars, the hanging rod,
//            the ring yaw, 6 of the 12 tubes; 07.11. review: tubes x1.6 and 20 m out (was 30 m, 95% black frames),
//            the crimson band moved from the zenith down to the horizon (one field colour behind the silhouettes)
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { scratch } from './scenes-1-util.js';
import { COUNT_LAYOUT } from './scenes-1-s01.js';

const FLOOR_Y = -2.6, R_RING = 20, NT = 6, TUBE_AZ = [34, 90, 146, 214, 270, 326], TUBE_S = [1.6, 1.4, 1.6], ZERO_Z = -26, ZERO_Y = 7.5, ZERO_R = 5;
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
      const c = new THREE.CylinderGeometry(r, r, L + r * 1.2, 6, 1, true);
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
  fog: { color: PAL.velvet, near: 40, far: 150 },
  build(kit) {
    const s = { x: scratch() };
    s.prof = kit.travel([[9.18, 0.8, 1.0], [15.0, 4, 1.0]]);
    s.hall = new THREE.Group(); kit.group.add(s.hall);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(44, 40).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    floor.position.y = FLOOR_Y; s.hall.add(floor); s.floor = floor;
    // gold flash ring on the floor under the tubes (one frame on "zero")
    s.flashRing = new THREE.Mesh(new THREE.RingGeometry(R_RING - 1, R_RING + 1, 64).rotateX(-Math.PI / 2), kit.flat({ color: PAL.gold, fog: 0 }));
    s.flashRing.position.y = FLOOR_Y + 0.02; s.hall.add(s.flashRing);
    // dome: 8 petals (black, one crimson band near the top), folding outward on "tonight"
    const RD = 38, pos = [], col = [];
    const pt = (el, az) => [RD * Math.cos(el) * Math.sin(az), RD * Math.sin(el), -RD * Math.cos(el) * Math.cos(az) + RD];
    const rows = [0, 0.5, 0.9, 1.25, P / 2 - 0.02];
    for (let r = 0; r + 1 < rows.length; r++) {
      const red = r === 0; // crimson horizon band (about -6 to +23 deg from the eye): the tubes read as black silhouettes on it
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
    // 6 tubes (TUBE_AZ; the forward +-22 deg stay free for the zero and the lyrics)
    s.bodyMat = kit.toon({ ramp: 'black', rim: PAL.cream, rimTh: 0.45, side: THREE.BackSide });
    const body = new THREE.CylinderGeometry(2.2, 2.2, 16, 18, 1, true).translate(0, 8, 0);
    s.bodies = new THREE.InstancedMesh(body, s.bodyMat, NT);
    const capG = mergeSimple([new THREE.CylinderGeometry(2.5, 2.5, 1.2, 18).translate(0, 0.6, 0), new THREE.CylinderGeometry(1.1, 2.5, 0.9, 18).translate(0, 16.5, 0), new THREE.CylinderGeometry(2.5, 2.5, 0.7, 18).translate(0, 15.7, 0)]);
    s.caps = new THREE.InstancedMesh(capG, kit.toon({ ramp: 'hot', rim: PAL.gold }), NT);
    s.tubeM = []; s.tubeA = [];
    const m = s.x.m, q = s.x.q, p = s.x.p, sc = s.x.s;
    for (let k = 0; k < NT; k++) {
      const a = (TUBE_AZ[k] * P) / 180;
      p.set(Math.sin(a) * R_RING, FLOOR_Y, -Math.cos(a) * R_RING); q.setFromAxisAngle(s.x.v.set(0, 1, 0), -a); sc.set(TUBE_S[0], TUBE_S[1], TUBE_S[2]);
      m.compose(p, q, sc); s.tubeM.push(m.clone()); s.tubeA.push(a);
      s.bodies.setMatrixAt(k, m); s.caps.setMatrixAt(k, m);
    }
    s.tubes = new THREE.Group(); s.tubes.add(s.bodies, s.caps); s.hall.add(s.tubes);
    // digits: one InstancedMesh per numeral, one instance per tube; only the shown numeral is drawn
    s.digits = []; s.dM = []; s.zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
    s.digitMat = kit.flat({ color: PAL.gold, fog: 0.5 });
    for (let dgt = 0; dgt < 10; dgt++) {
      const im = new THREE.InstancedMesh(digitGeo(dgt, 6, 0.24), s.digitMat, NT);
      s.dM[dgt] = [];
      for (let k = 0; k < NT; k++) { const L = s.tubeM[k].clone().multiply(new THREE.Matrix4().makeTranslation(0, 7.6, 0.9)); s.dM[dgt].push(L); im.setMatrixAt(k, s.zeroM); }
      im.frustumCulled = false;
      s.digits.push(im); s.tubes.add(im);
    }
    // THE ZERO: an 8 m gold oval floating ahead; detaches on "Gold" and comes to the player (PORTAL)
    s.zero = new THREE.Group(); kit.group.add(s.zero);
    s.zeroMat = kit.flat({ color: PAL.gold, fog: 0.3 });
    s.zeroMesh = new THREE.Mesh(new THREE.TorusGeometry(ZERO_R, 0.9, 8, 48), s.zeroMat);
    s.zero.add(s.zeroMesh);
    s.matte = kit.matte({ shape: 'circle', r: ZERO_R - 0.7 });
    s.matte.position.z = -0.05;
    s.zero.add(s.matte);
    // ---- type: one block at a time, under the zero, in the free forward gap ----
    const L2 = COUNT_LAYOUT;
    s.countT = kit.text('COUNT DOWN TO\nZERO', { ...L2, color: 'gold', colors: { 3: 'cream' }, times: [9.18, 9.18, 9.3, 9.48], out: 10.3, outDur: 0.15 });
    s.why = kit.text("DON'T ASK\nME WHY", { ...L2, color: 'cream', near: 10.46, out: 12.6, outDur: 0.2 });
    s.why.redact(3, 11.82);
    s.goldT = kit.text('GOLD ON\nTHE WIRE', { ...L2, color: 'gold', times: [12.8, 13.62, 13.84, 14.02], out: 14.4, outDur: 0.15 });
    s.tonight = kit.text('TONIGHT', { ...L2, cap: 1.15, color: 'cream', near: 14.56, pop: true, out: 15.4, outDur: 0.15 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.hall.position.z = d;
    const lit = t >= 9.48;
    // the zero: ahead at eye+4 m; 12.80 "Gold" -> glides down to eye height and passes the eyes at ~15.8
    const zk = Math.min(1, Math.max(0, (t - 12.8) / 3.0));
    let zz = ZERO_Z + (0.05 - ZERO_Z) * zk * zk;
    if (t > 15.8) zz = 0.05 + (t - 15.8) * 16;
    s.zero.visible = t < 16.0;
    s.zero.position.set(0, ZERO_Y + (1.6 - ZERO_Y) * sm(12.8, 15.4, t), zz);
    s.zeroMesh.scale.set(0.62 + 0.38 * sm(14.4, 15.4, t), 1, 1); // oval numeral -> round portal
    s.zeroMat.uniforms.uBright.value = lit ? 1 + 0.8 * (t < 9.62 ? 1 : 0) : 0.2;
    s.matte.visible = t >= 15.4 && zz < 0.0;
    // which numeral each ring tube shows (-1 = dark)
    const ringDigit = (k) => {
      if (!lit) return -1;
      if (t < 10.46) return 0;
      if (t < 11.47) return Math.floor(hash(k, Math.floor((t - 10.46) * 6)) * 10);
      if (t < 11.82) return Math.floor(hash(k, 99) * 10);
      return t >= 13.75 + 0.1 * k ? 0 : -1; // relight clockwise on the 13.75 downbeat
    };
    // portal: from 15.4 everything beyond the zero's plane is hidden (S03 shows only through the hole)
    const portal = t >= 15.4;
    for (let k = 0; k < NT; k++) {
      const zw = -Math.cos(s.tubeA[k]) * R_RING + d;
      const hide = portal && zw < zz - 1;
      s.bodies.setMatrixAt(k, hide ? s.zeroM : s.tubeM[k]); s.caps.setMatrixAt(k, hide ? s.zeroM : s.tubeM[k]);
      const v = hide ? -1 : ringDigit(k);
      for (let dg = 0; dg < 10; dg++) s.digits[dg].setMatrixAt(k, v === dg ? s.dM[dg][k] : s.zeroM);
    }
    s.bodies.instanceMatrix.needsUpdate = true; s.caps.instanceMatrix.needsUpdate = true;
    for (let dg = 0; dg < 10; dg++) s.digits[dg].instanceMatrix.needsUpdate = true;
    s.floor.visible = !portal;
    for (const pv of s.petals) pv.visible = !portal;
    s.bodyMat.uniforms.uRim.value.setHex(t >= 11.44 ? PAL.crimson : PAL.cream);
    s.bodyMat.uniforms.uRimAmt.value = lit ? 1 : 0.15;
    s.caps.material.uniforms.uBright.value = lit ? 1 : 0.25;
    s.flashRing.visible = t >= 9.48 && t < 9.515;
    // petals fold outward on "tonight"
    for (let i = 0; i < 8; i++) s.petals[i].rotation.x = -1.9 * kit.ease.inOut((t - 14.56 - (i % 2) * 0.06) / 0.75);
    s.hall.visible = t < 15.8;
    if (kit.isOwner) kit.setSky(t >= 14.56 ? { moonR: 0.07, moonDir: [0.33, 0.26, -0.91], hor: PAL.petrolDeep, stars: 0.5 } : {});
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
