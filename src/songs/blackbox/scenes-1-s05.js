// S05 The Mirror Field (29.46 to 36.20, cold). 480 mirror dishes in 8 rings around a receiver tower turn
// to look at the player and show her face; 12 exit gates light all around, gold wires to every exit.
// Out: SHATTER at 36.20 (kit.shards, post 0.6); the plain vanishes so S06's board (y -8) shows below.
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { bustShape, BUST_EYES, mergeDiscs, scratch, dishLayout, PLAIN_Y, DISH_POST, TOWER, EYE, UPV } from './scenes-1-util.js';

const KEY = [-0.45, 0.55, -0.7];
const RISE = [29.46, 29.46, 30.06, 30.61]; // per band (band 0 = the 48 match-cut dishes, already up)
const GATE_C = -14, GATE_R = 60, OMEGA = 0.035;
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const colorize = (g, fn) => { g = g.index ? g.toNonIndexed() : g; const n = g.getAttribute('normal'), c = []; for (let i = 0; i < n.count; i++) c.push(...fn(n.getY(i))); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; };

export const S05 = {
  id: 'S05', t0: 29.46, t1: 36.2, world: 'cold', pre: 0.6, post: 0.6,
  key: KEY, fog: { color: PAL.black, near: 40, far: 200 },
  sky: { stars: 0.6, hor: PAL.petrolDeep },
  build(kit) {
    const s = { x: scratch() };
    s.x.v3 = new THREE.Vector3(); s.x.m2 = new THREE.Matrix4();
    s.prof = kit.travel([[29.46, 4, 1.0]]);
    const L = dishLayout();
    s.D = L.dishes;
    s.f = new THREE.Group(); kit.group.add(s.f);
    const plain = new THREE.Mesh(new THREE.CircleGeometry(400, 48).rotateX(-Math.PI / 2), kit.flat({ color: PAL.petrolDeep }));
    plain.position.y = PLAIN_Y; s.f.add(plain);
    // dishes: face (vertex colour white on top, black elsewhere) x instanceColor; posts; face decals; glasses
    const N = s.D.length;
    const dishG = colorize(new THREE.CylinderGeometry(1.5, 1.05, 0.3, 14), (ny) => (ny > 0.9 ? [1, 1, 1] : [0, 0, 0]));
    s.dish = new THREE.InstancedMesh(dishG, kit.flat({ color: PAL.white, vertexColors: true, fog: 0.8 }), N);
    s.dish.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    const headG = new THREE.ShapeGeometry(bustShape(), 3).translate(0, -0.5, 0).scale(2.1, 2.1, 1).rotateX(-Math.PI / 2).translate(0, 0.17, 0);
    s.heads = new THREE.InstancedMesh(headG, kit.flat({ color: PAL.black, fog: 0.8 }), N);
    const eg = mergeDiscs(BUST_EYES.map(([x, y]) => [x * 2.1, (y - 0.5) * 2.1, 0, 0.1]), 8).rotateX(-Math.PI / 2).translate(0, 0.18, 0);
    s.glass = new THREE.InstancedMesh(eg, kit.flat({ color: PAL.white, fog: 0.6 }), N);
    s.heads.instanceMatrix = s.dish.instanceMatrix; s.glass.instanceMatrix = s.dish.instanceMatrix;
    s.posts = new THREE.InstancedMesh(box(0.26, DISH_POST, 0.26, 0, DISH_POST / 2, 0), kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY }), N);
    for (const im of [s.dish, s.heads, s.glass, s.posts]) { im.frustumCulled = false; s.f.add(im); }
    // receiver tower with her 20 m face in the ring
    const tw = new THREE.Group(); tw.position.set(TOWER[0], PLAIN_Y, TOWER[1]); s.f.add(tw);
    tw.add(new THREE.Mesh(mergeSimple([new THREE.CylinderGeometry(1.6, 4.2, 50, 6).translate(0, 25, 0), box(10, 0.8, 0.8, 0, 38, 0), box(0.8, 0.8, 10, 0, 32, 0)]), kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY })));
    s.recv = new THREE.Group(); s.recv.position.y = 50 + 9; tw.add(s.recv);
    s.recv.rotation.y = Math.atan2(-TOWER[0], -TOWER[1] - 20);
    s.recv.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.7, 6, 48), kit.flat({ color: PAL.teal, fog: 0.4 })));
    s.faceDisc = new THREE.Mesh(new THREE.CircleGeometry(9.4, 40), kit.flat({ color: PAL.petrol, fog: 0.4 }));
    s.bigFace = new THREE.Group();
    s.bigFace.add(new THREE.Mesh(new THREE.ShapeGeometry(bustShape(), 6).translate(0, -0.5, 0.05).scale(17, 17, 1), kit.flat({ color: PAL.black, fog: 0.3 })));
    s.bigFace.add(new THREE.Mesh(mergeDiscs(BUST_EYES.map(([x, y]) => [x * 17, (y - 0.5) * 17, 0.1, 1.0]), 16), kit.flat({ color: PAL.white, fog: 0.2 })));
    s.recv.add(s.faceDisc, s.bigFace);
    // 12 exit gates in a ring (rotates 2 deg/s), cream-lit interiors
    s.gates = new THREE.Group(); s.gates.position.set(0, PLAIN_Y, GATE_C); s.f.add(s.gates);
    const frameG = mergeSimple([box(1, 16, 1, -3.5, 8, 0), box(1, 16, 1, 3.5, 8, 0), box(8, 1, 1, 0, 16, 0), box(10, 0.6, 2, 0, 0.3, 0)]);
    s.frames = new THREE.InstancedMesh(frameG, kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY }), 12);
    s.doors = new THREE.InstancedMesh(new THREE.PlaneGeometry(6, 15).translate(0, 8, 0.1), kit.flat({ color: PAL.white, fog: 0.5 }), 12);
    s.doors.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(36), 3);
    s.th0 = -OMEGA * 5.94;
    for (let k = 0; k < 12; k++) {
      const a = s.th0 + (k * Math.PI) / 6;
      const m = s.x.m.makeRotationY(-a).setPosition(Math.sin(a) * GATE_R, 0, -Math.cos(a) * GATE_R);
      s.frames.setMatrixAt(k, m); s.doors.setMatrixAt(k, m);
    }
    s.gates.add(s.frames, s.doors);
    // gold wires trolley -> gates, and the cyan zig-zag beam
    const unit = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
    s.wires = new THREE.InstancedMesh(unit, kit.flat({ color: PAL.gold, fog: 0.4 }), 12);
    s.wires.frustumCulled = false; kit.group.add(s.wires);
    s.beam = new THREE.InstancedMesh(unit, kit.flat({ color: PAL.cyan, fog: 0.2 }), 7);
    s.beam.frustumCulled = false; s.f.add(s.beam);
    const d35 = s.prof.d(35.32), pts = [new THREE.Vector3(0, 3.2, -d35)];
    const used = new Set();
    for (let i = 0; i < 6; i++) {
      const tx = (i % 2 ? 1 : -1) * (5 + i * 1.5), tz = -(12 + i * 8) - d35;
      let best = -1, bd = 1e9;
      s.D.forEach((D, j) => { const dd = Math.hypot(D.x - tx, D.z - tz); if (dd < bd && !used.has(j)) { bd = dd; best = j; } });
      used.add(best); pts.push(new THREE.Vector3(s.D[best].x, PLAIN_Y + DISH_POST + 0.4, s.D[best].z));
    }
    const ga = s.th0 + OMEGA * (35.46 - 29.46);
    pts.push(new THREE.Vector3(Math.sin(ga) * GATE_R, PLAIN_Y + 7, GATE_C - Math.cos(ga) * GATE_R));
    s.bpts = pts;
    // the signal dish 6 m ahead-left carrying EVERY MIRROR (rides along with the cradle)
    s.sig = new THREE.Group(); kit.place(s.sig, { d: 7, az: -30, y: 1.9 }); kit.group.add(s.sig);
    s.sig.rotation.x = 0.12;
    s.sig.add(new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.1, 0.35, 24).rotateX(Math.PI / 2).translate(0, 0, -0.25), kit.toon({ ramp: 'steel', rim: PAL.cyan, key: KEY })));
    s.sig.add(new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 4, 40), kit.flat({ color: PAL.cyan })));
    s.sig.add(new THREE.Mesh(mergeSimple([box(0.22, 7.6, 0.22, 0, -4.4, -0.6)]), kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY })));
    s.mirrorT = kit.text('EVERY\nMIRROR', { cap: 0.5, color: 'gold', lineGap: 1.05, times: [28.9, 29.98], out: 32.4, parent: s.sig }); // EVERY is sung (held) from 28.30; shown as soon as the field is visible (pre)
    s.mirrorT.mesh.position.z = 0.02;
    s.faceT = kit.text('SHOWS A FACE\nI KNOW', { cap: 0.85, color: 'cream', near: 30.24, say: 'shows a face i know', out: 32.4, at: { d: 6, az: 20, y: 1.75 } });
    s.exitG = new THREE.Group(); kit.place(s.exitG, { d: 7, az: 0, y: 2.95 }); kit.group.add(s.exitG); // above the lit forward gate (the cream TO vanished on its cream panel at y 1.75)
    s.exitT = kit.text("EVERY EXIT'S", { cap: 1.0, color: 'gold', near: 32.62, out: 36.2, outDur: 0.06, parent: s.exitG });
    s.exitT.mesh.position.y = 0.95;
    s.placeT = kit.text('GOT A PLACE TO', { cap: 0.62, color: 'cream', align: 'right', near: 34.42, out: 36.2, outDur: 0.06, parent: s.exitG });
    s.placeT.mesh.position.set(0.35, -0.3, 0);
    s.goT = kit.text('GO', { cap: 1.24, color: 'cream', align: 'left', times: 35.46, pop: true, out: 36.2, outDur: 0.06, parent: s.exitG });
    s.goT.mesh.position.set(1.12, -0.2, 0);
    for (const T of [s.exitT, s.placeT, s.goT]) T.mesh.renderOrder = 9; // drawn after the transparent gate panels, which painted over TO
    // SHATTER: 3-4 shards per dish, blown outward and past the cradle
    const d36 = s.prof.d(36.2), sp = [];
    for (const D of s.D) { const n = 3 + (D.rank % 2); for (let k = 0; k < n; k++) sp.push(D); }
    s.shards = kit.shards({ n: sp.length, t0: 36.2, life: 2.2, gravity: -3, seed: 9, colors: [PAL.cyan, PAL.teal, PAL.cyan, PAL.black], init: (i, r) => {
      const D = sp[i];
      const p = [D.x + (r() - 0.5) * 2, PLAIN_Y + DISH_POST + 0.3 + (r() - 0.5), D.z + d36 + (r() - 0.5) * 2];
      const off = 1.6 + r() * 12, oa = r() * Math.PI * 2;
      const aim = [EYE.x + Math.cos(oa) * off, EYE.y + Math.sin(oa) * off * 0.6 + 1.5, EYE.z + (r() - 0.5) * 4];
      const dv = new THREE.Vector3(aim[0] - p[0], aim[1] - p[1], aim[2] - p[2]).normalize().multiplyScalar(22 + r() * 18);
      const sz = 0.9 + r() * 1.1;
      return { p, v: [dv.x, dv.y + 3, dv.z], s: [sz, sz * (0.8 + r() * 0.6)], spin: (r() - 0.5) * 9, delay: Math.min(0.25, D.dist / 600) };
    } });
    kit.group.add(s.shards);
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.f.position.z = d;
    const on = t < 36.2;
    s.f.visible = on; s.sig.visible = on && t < 33.1;
    s.sig.position.y = 1.9 - 9 * sm(32.35, 33.05, t); s.wires.visible = on && t >= 34.42;
    const { m, p, q, q2, s: sc, c, v } = s.x;
    const goFlash = t >= 35.46 && t < 35.62;
    if (on) {
      for (let i = 0; i < s.D.length; i++) {
        const D = s.D[i];
        const rise = D.band === 0 ? 1 : kit.ease.out((t - RISE[D.band]) / 0.45);
        const y = PLAIN_Y - 4.6 * (1 - rise);
        // aim at the eye; the tilt wave runs from the nearest dishes outward on "mirror"
        p.set(D.x, y + DISH_POST + 0.2, D.z);
        v.set(EYE.x - p.x, EYE.y - p.y, EYE.z - (p.z + d)).normalize();
        const tk = kit.ease.inOut((t - (29.98 + 0.9 * Math.min(1, D.dist / 120))) / 0.35);
        // aim the face (+y) at the eye with the decal's head (-z) toward world up
        const ux = -v.x * v.y, uy = 1 - v.y * v.y, uz = -v.z * v.y, ul = Math.hypot(ux, uy, uz);
        if (ul < 1e-3) q2.identity(); else {
          s.x.v2.set(-ux / ul, -uy / ul, -uz / ul);
          s.x.v3.crossVectors(v, s.x.v2);
          s.x.m2.makeBasis(s.x.v3, v, s.x.v2); q2.setFromRotationMatrix(s.x.m2);
        }
        q.identity().slerp(q2, tk);
        sc.setScalar(D.band === 0 && t < 29.46 ? 1e-4 : 1); // the match-cut discs land here at 29.46
        m.compose(p, q, sc); s.dish.setMatrixAt(i, m);
        if (t < 31.2) { m.makeTranslation(D.x, y, D.z); s.posts.setMatrixAt(i, m); }
        // colour: landing cyan (band 0) -> dark; flash while turning; steady teal; all flash on "go"
        if (goFlash || (tk > 0.02 && tk < 0.98)) c.setHex(PAL.cyan);
        else if (tk >= 0.98) c.setHex(PAL.teal);
        else c.setHex(PAL.petrol).lerp(s.x.c2.setHex(PAL.cyan), D.band === 0 ? 1 - sm(29.46, 29.8, t) : 0);
        s.dish.setColorAt(i, c);
      }
      s.dish.instanceMatrix.needsUpdate = true; s.dish.instanceColor.needsUpdate = true;
      if (t < 31.25) s.posts.instanceMatrix.needsUpdate = true;
    }
    s.heads.visible = t >= 30.92;
    s.glass.visible = t >= 31.82;
    s.glass.material.uniforms.uBright.value = 1 + (t >= 31.82 && t < 31.95 ? 1.5 : 0);
    s.bigFace.visible = t >= 31.82; s.faceDisc.visible = t >= 31.82;
    // gates: rotate slowly; light clockwise from 32.62, pulse on 34.03
    const rot = OMEGA * (t - 29.46);
    s.gates.rotation.y = -rot;
    for (let k = 0; k < 12; k++) {
      const lit = t >= 32.62 + 0.07 * k;
      c.setHex(lit ? PAL.cream : 0x050a0c).multiplyScalar(lit ? 1 + 0.7 * (t >= 34.03 && t < 34.18 ? 1 : 0) : 1);
      s.doors.setColorAt(k, c);
      // gold wire from the trolley to gate k
      const a = s.th0 + (k * Math.PI) / 6 + rot;
      p.set(Math.sin(a) * GATE_R, PLAIN_Y + 7, GATE_C - Math.cos(a) * GATE_R + d);
      v.set(p.x, p.y - 3.4, p.z).normalize();
      const len = Math.hypot(p.x, p.y - 3.4, p.z) * sm(34.42, 34.92, t);
      q.setFromUnitVectors(s.x.v2.set(0, 0, 1), v);
      sc.set(0.04, 0.04, Math.max(0.01, len));
      m.compose(s.x.v2.set(0, 3.4, 0), q, sc); s.wires.setMatrixAt(k, m);
    }
    s.doors.instanceColor.needsUpdate = true; s.wires.instanceMatrix.needsUpdate = true;
    // the zig-zag beam (35.18-35.46) from dish to dish out through the forward gate
    s.beam.visible = t >= 35.18 && t < 36.2;
    if (s.beam.visible) {
      const K = ((t - 35.18) / 0.28) * 7;
      for (let i = 0; i < 7; i++) {
        const A = s.bpts[i], B = s.bpts[i + 1], f = Math.min(1, Math.max(0, K - i));
        v.subVectors(B, A); const len = v.length() * f; v.normalize();
        q.setFromUnitVectors(s.x.v2.set(0, 0, 1), v); sc.set(0.07, 0.07, Math.max(0.001, len));
        m.compose(A, q, sc); s.beam.setMatrixAt(i, m);
      }
      s.beam.instanceMatrix.needsUpdate = true;
    }
    if (kit.isOwner) {
      const R = kit.rigState;
      R.wheelSpin = d / 0.075;
      if ((t >= 31.82 && t < 31.95) || (t >= 34.42 && t < 34.55) || goFlash) R.gauge = 1;
    }
  },
  events() {
    return [
      { t: 29.98, sfx: 'ping', gain: 0.35 },
      { t: 31.82, sfx: 'switch', gain: 0.4 },
      { t: 32.62, sfx: 'tick', gain: 0.3 },
      { t: 34.42, sfx: 'whoosh', gain: 0.45 },
      { t: 36.2, sfx: 'crack', gain: 0.7, haptic: [0.55, 90] },
    ];
  },
};
