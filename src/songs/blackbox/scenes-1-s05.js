// S05 The Mirror Field (29.46 to 36.20, cold). Out: SHATTER at 36.20 (kit.shards, post 0.6); the plain
// vanishes so S06's board shows below.
// SHOT CARD
//   hero     12 big mirror dishes (4 m faces) on one ring around the player, every face turned to
//            the player and showing her (black bust, glasses)
//   supports 5 tall exit gates far out on a wider ring (cream doors); the dark petrol plain
//   palette  black + petrol/teal (plain, faces) + cream (doors, glasses) and one cyan flash wave
//   motion   the player drifts to the ring centre (1.8 m/s) while the dishes keep looking at her;
//            29.98 "mirror": one white flash wave around the ring -> 30.92 her face appears on every
//            dish -> 31.82 the glasses light -> 32.62 the gates light one by one -> 35.46 "go" flash ->
//            36.20 SHATTER (big cyan shards blow outward, away from the player)
//   lyrics   one block at a time in the sky ahead (d 6.5, above the dishes): EVERY MIRROR /
//            SHOWS A FACE / I KNOW / EVERY EXIT'S / GOT A PLACE TO GO
//   removed  468 of 480 dishes, the receiver tower and its 20 m face, the signal dish, 12 gold wires,
//            the zig-zag beam, 7 of 12 gates, the gate ring rotation, 3 scattered text spots
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { bustShape, BUST_EYES, mergeDiscs, scratch, dishLayout, PLAIN_Y, DISH_POST, FACE_Y, FACE_R, RING, EYE } from './scenes-1-util.js';

const KEY = [-0.45, 0.55, -0.7];
const GATE_R = 40, NG = 5;
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const colorize = (g, fn) => { g = g.index ? g.toNonIndexed() : g; const n = g.getAttribute('normal'), c = []; for (let i = 0; i < n.count; i++) c.push(...fn(n.getY(i))); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; };

export const S05 = {
  id: 'S05', t0: 29.46, t1: 36.2, world: 'cold', pre: 1.2, post: 0.5,
  key: KEY, fog: { color: PAL.black, near: 45, far: 200 },
  sky: { stars: 0.4, hor: PAL.petrolDeep },
  build(kit) {
    const s = { x: scratch() };
    s.x.v3 = new THREE.Vector3(); s.x.m2 = new THREE.Matrix4();
    s.prof = kit.travel([[29.46, 1.8, 1.0]]);
    const L = dishLayout();
    s.D = L.dishes;
    s.front = new Set(L.nearest);
    s.f = new THREE.Group(); kit.group.add(s.f);
    const plain = new THREE.Mesh(new THREE.CircleGeometry(400, 48).rotateX(-Math.PI / 2), kit.flat({ color: PAL.petrolDeep }));
    plain.position.y = PLAIN_Y; s.f.add(plain);
    // dishes: face (vertex colour white on top, black elsewhere) x instanceColor; posts; face decals
    const N = s.D.length;
    const dishG = colorize(new THREE.CylinderGeometry(FACE_R, FACE_R * 0.7, 0.35, 24), (ny) => (ny > 0.9 ? [1, 1, 1] : [0, 0, 0]));
    s.dish = new THREE.InstancedMesh(dishG, kit.flat({ color: PAL.white, vertexColors: true, fog: 0.6 }), N);
    s.dish.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    const headG = new THREE.ShapeGeometry(bustShape(), 4).translate(0, -0.5, 0).scale(2.8, 2.8, 1).rotateX(-Math.PI / 2).translate(0, 0.19, 0);
    s.heads = new THREE.InstancedMesh(headG, kit.flat({ color: PAL.black, fog: 0.6 }), N);
    const eg = mergeDiscs(BUST_EYES.map(([x, y]) => [x * 2.8, (y - 0.5) * 2.8, 0, 0.18]), 10).rotateX(-Math.PI / 2).translate(0, 0.2, 0);
    s.glass = new THREE.InstancedMesh(eg, kit.flat({ color: PAL.white, fog: 0.5 }), N);
    s.heads.instanceMatrix = s.dish.instanceMatrix; s.glass.instanceMatrix = s.dish.instanceMatrix;
    s.posts = new THREE.InstancedMesh(box(0.55, DISH_POST, 0.55, 0, DISH_POST / 2, 0), kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY }), N);
    for (let i = 0; i < N; i++) s.posts.setMatrixAt(i, s.x.m.makeTranslation(s.D[i].x, PLAIN_Y, s.D[i].z));
    for (const im of [s.dish, s.heads, s.glass, s.posts]) { im.frustumCulled = false; s.f.add(im); }
    // 5 exit gates on a wide ring (static), cream doors
    s.gates = new THREE.Group(); s.gates.position.set(0, PLAIN_Y, RING.cz); s.f.add(s.gates);
    const frameG = mergeSimple([box(1.4, 18, 1.4, -4.6, 9, 0), box(1.4, 18, 1.4, 4.6, 9, 0), box(10.6, 1.4, 1.4, 0, 18.7, 0), box(12, 0.8, 2.4, 0, 0.4, 0)]);
    s.frames = new THREE.InstancedMesh(frameG, kit.toon({ ramp: 'black', rim: PAL.cyan, key: KEY }), NG);
    s.doors = new THREE.InstancedMesh(new THREE.PlaneGeometry(7.8, 17).translate(0, 9.3, 0.1), kit.flat({ color: PAL.white, fog: 0.4 }), NG);
    s.doors.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NG * 3), 3);
    s.gA = [];
    const GA = [48, 120, 180, 240, 312]; // front pair at +-48 deg (about +-40 from the player): the forward view stays free for the type
    for (let k = 0; k < NG; k++) {
      const a = GA[k] * Math.PI / 180;
      const m = s.x.m.makeRotationY(-a).setPosition(Math.sin(a) * GATE_R, 0, -Math.cos(a) * GATE_R);
      s.frames.setMatrixAt(k, m); s.doors.setMatrixAt(k, m); s.gA.push(a);
    }
    s.gates.add(s.frames, s.doors);
    // ---- type: one block at a time in the sky ahead ----
    const at = { d: 6.5, az: 0, y: 3.0 };
    const T2 = { cap: 0.95, lineGap: 0.95, at };
    s.mirrorT = kit.text('EVERY MIRROR', { ...T2, color: 'gold', times: [28.3, 29.98], out: 30.12, outDur: 0.1 });
    s.faceT = kit.text('SHOWS A FACE\nI KNOW', { ...T2, color: 'cream', colors: { 2: 'gold' }, near: 30.24, say: 'shows a face i know', out: 32.45, outDur: 0.15 });
    s.exitT = kit.text("EVERY EXIT'S", { ...T2, color: 'gold', near: 32.62, out: 34.3, outDur: 0.12 });
    s.goT = kit.text('GOT A PLACE\nTO GO', { ...T2, color: 'cream', colors: { 4: 'gold' }, near: 34.42, say: 'got a place to go', out: 36.18, outDur: 0.04 });
    // SHATTER: 2 big shards per dish (was 4 smaller ones; they crowded S06's first frames), blown outward (away from the player)
    const d36 = s.prof.d(36.2), sp = [];
    for (const D of s.D) for (let k = 0; k < 2; k++) sp.push(D);
    s.shards = kit.shards({ n: sp.length, t0: 36.2, life: 2.2, gravity: -3, seed: 9, colors: [PAL.cyan, PAL.teal, PAL.cyan, PAL.black], init: (i, r) => {
      const D = sp[i];
      const p = [D.x + (r() - 0.5) * 2, FACE_Y + (r() - 0.5), D.z + d36 + (r() - 0.5) * 2];
      const ox = D.x, oz = D.z - RING.cz, ol = Math.hypot(ox, oz) || 1, sp0 = 9 + r() * 9;
      const sz = 2.0 + r() * 1.4;
      return { p, v: [(ox / ol) * sp0, 4 + r() * 5, (oz / ol) * sp0], s: [sz, sz * (0.8 + r() * 0.6)], spin: (r() - 0.5) * 6, delay: (i % 2) * 0.04 };
    } });
    kit.group.add(s.shards);
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.f.position.z = d;
    s.f.visible = t >= 28.9 && t < 36.2;
    if (!s.f.visible) return;
    const { m, p, q, s: sc, c, v } = s.x;
    const goFlash = t >= 35.46 && t < 35.62;
    for (let i = 0; i < s.D.length; i++) {
      const D = s.D[i];
      // aim the face (+y) at the eye with the decal's head (-z) toward world up
      p.set(D.x, FACE_Y, D.z);
      v.set(EYE.x - p.x, EYE.y - p.y, EYE.z - (p.z + d)).normalize();
      const ux = -v.x * v.y, uy = 1 - v.y * v.y, uz = -v.z * v.y, ul = Math.hypot(ux, uy, uz);
      s.x.v2.set(-ux / ul, -uy / ul, -uz / ul);
      s.x.v3.crossVectors(v, s.x.v2);
      s.x.m2.makeBasis(s.x.v3, v, s.x.v2); q.setFromRotationMatrix(s.x.m2);
      sc.setScalar(s.front.has(i) && t < 29.46 ? 1e-4 : 1); // the match-cut bubbles land here at 29.46
      m.compose(p, q, sc); s.dish.setMatrixAt(i, m);
      // colour: landing cyan -> teal; one white flash wave on "mirror" (from the front, around); all on "go"
      const wave = 29.98 + 0.045 * Math.min(i, s.D.length - i);
      if (goFlash || (t >= wave && t < wave + 0.12)) c.setHex(t >= wave && t < wave + 0.12 ? PAL.white : PAL.cyan);
      else c.setHex(PAL.teal).lerp(s.x.c2.setHex(PAL.cyan), 1 - sm(29.46, 29.9, t));
      s.dish.setColorAt(i, c);
    }
    s.dish.instanceMatrix.needsUpdate = true; s.dish.instanceColor.needsUpdate = true;
    s.heads.visible = t >= 30.92;
    s.glass.visible = t >= 31.82;
    s.glass.material.uniforms.uBright.value = 1 + (t >= 31.82 && t < 31.95 ? 1.5 : 0);
    // gates light one by one from the front-right, all brighter on "go"
    for (let k = 0; k < NG; k++) {
      const lit = t >= 32.62 + 0.16 * k;
      c.setHex(lit ? PAL.cream : 0x050a0c).multiplyScalar(lit ? 1 + 0.7 * (goFlash ? 1 : 0) : 1);
      s.doors.setColorAt(k, c);
    }
    s.doors.instanceColor.needsUpdate = true;
  },
  events() {
    return [
      { t: 29.98, sfx: 'ping', gain: 0.35 },
      { t: 31.82, sfx: 'switch', gain: 0.4 },
      { t: 32.62, sfx: 'tick', gain: 0.3 },
      { t: 35.46, sfx: 'switch', gain: 0.4 },
      { t: 36.2, sfx: 'crack', gain: 0.7, haptic: [0.55, 90] },
    ];
  },
};
