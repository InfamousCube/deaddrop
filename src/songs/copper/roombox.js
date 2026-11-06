// The lounge opens like a box: the lid (ceiling) is hauled up, the four walls sink into slots in a
// round lift deck, everything mounted on a wall goes down with it. The floor, the desk and the
// furniture standing on the floor stay: that is the platform the player rides for the rest of the
// show. Driven through the room's own PieceSet (per-piece GPU transforms), so it costs nothing and
// can be set to any state at any time (seek, rewind, return).
import * as THREE from 'three';
import { paint, G, Batch, xf } from '../../gfx/shade.js';
import { poster, PAL, Sprites, ribbonMat, ribbonGeo } from './mat.js';

const WALLS = ['front', 'right', 'back', 'left'];

export function buildRoomBox(world) {
  const room = world.room;
  const R0 = { x0: -2.4, x1: 2.4, z0: -2.5, z1: 2.1, h: 2.85 };
  const cls = (c) => {
    const d = { left: c.x - R0.x0, right: R0.x1 - c.x, front: c.z - R0.z0, back: R0.z1 - c.z, ceiling: R0.h - c.y, floor: c.y };
    let best = 'floor', bd = 1e9;
    for (const k in d) if (d[k] < bd) { bd = d[k]; best = k; }
    return best;
  };
  const pieces = room.pieces.pieces.map((p) => ({ p, g: p.tag === 'shell' ? p.data.panel : cls(p.center), rnd: (p.id * 0.618) % 1 }));
  const textured = room.textured.map((m) => ({ m, g: cls(m.userData.rest.p) }));
  const center = new THREE.Vector3(0, R0.h, -0.2);
  const _q = new THREE.Quaternion();
  const _v = new THREE.Vector3();
  const axisX = new THREE.Vector3(1, 0, 0);
  let last = null;

  // state: { lid 0..1, front/right/back/left 0..1 } (0 = closed room)
  function offset(g, st, rnd, out, q) {
    q.identity();
    if (g === 'ceiling') {
      const k = st.lid;
      const e = k * k * (3 - 2 * k);
      out.set(0, e * e * 16 + e * 0.25, 0);
      q.setFromAxisAngle(axisX, e * 0.22);
      return k >= 0.999 ? 0 : 1;
    }
    if (WALLS.includes(g)) {
      const k = st[g];
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      out.set(0, -e * 3.05, 0);
      return k >= 0.999 ? 0 : 1;
    }
    out.set(0, 0, 0);
    return 1;
  }

  function apply(st) {
    const key = `${st.lid.toFixed(4)}|${st.front.toFixed(4)}|${st.right.toFixed(4)}|${st.back.toFixed(4)}|${st.left.toFixed(4)}`;
    if (key === last) return;
    last = key;
    for (const it of pieces) {
      const { p, g } = it;
      const s = offset(g, st, it.rnd, _v, _q);
      if (g === 'ceiling') {
        // rotate about the lid's centre, then lift
        const rel = p.center.clone().sub(center);
        const rot = rel.clone().applyQuaternion(_q);
        p.t.copy(rot).sub(rel).add(_v);
        p.q.copy(_q);
      } else {
        p.t.copy(_v);
        p.q.identity();
      }
      p.s = s;
    }
    room.pieces.flush();
    for (const it of textured) {
      const { m, g } = it;
      const rest = m.userData.rest;
      const s = offset(g, st, 0, _v, _q);
      if (g === 'ceiling') {
        const rel = rest.p.clone().sub(center);
        m.position.copy(center).add(rel.applyQuaternion(_q)).add(_v);
        m.quaternion.copy(rest.q).premultiply(_q);
      } else {
        m.position.copy(rest.p).add(_v);
        m.quaternion.copy(rest.q);
      }
      m.visible = s > 0;
    }
  }

  function reset() {
    last = null;
    room.pieces.reset();
    for (const it of textured) {
      it.m.position.copy(it.m.userData.rest.p);
      it.m.quaternion.copy(it.m.userData.rest.q);
      it.m.visible = true;
    }
  }

  // ---- lift deck: the round steel platform the room floor sits on (static, player space) ----
  const deck = new THREE.Group();
  deck.name = 'copper-liftdeck';
  {
    const b = new Batch();
    const DR = 4.1;
    b.add(paint(G.cyl(DR, DR, 0.1, 96), 0x0f1217, { gloss: 0.3, m: xf([0, -0.058, 0]) }));
    // concentric tread rings and a copper rim band
    for (const r of [3.55, 3.8]) b.add(paint(G.torus(r, 0.008, 4, 96), 0x2c333d, { gloss: 0.6, m: xf([0, -0.008, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.torus(DR - 0.02, 0.03, 6, 120), PAL.copper, { gloss: 0.9, m: xf([0, -0.012, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.cyl(DR + 0.03, DR + 0.03, 0.06, 120, true), 0x2a1a10, { m: xf([0, -0.06, 0]) }));
    // rivets
    for (let k = 0; k < 72; k++) {
      const a = k / 72 * Math.PI * 2;
      b.add(paint(G.cyl(0.012, 0.012, 0.012, 6), PAL.brass, { gloss: 0.9, m: xf([Math.cos(a) * 3.95, -0.006, Math.sin(a) * 3.95]) }));
    }
    // slots the walls sink into: dark strips along the outside of the floor rectangle
    const slot = 0x050608;
    b.add(paint(G.box(4.98, 0.004, 0.11), slot, { m: xf([0, -0.006, -2.55]) }));
    b.add(paint(G.box(4.98, 0.004, 0.11), slot, { m: xf([0, -0.006, 2.15]) }));
    b.add(paint(G.box(0.11, 0.004, 4.8), slot, { m: xf([-2.45, -0.006, -0.2]) }));
    b.add(paint(G.box(0.11, 0.004, 4.8), slot, { m: xf([2.45, -0.006, -0.2]) }));
    // four guide shoes that run in the shaft rails
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2 + Math.PI / 4;
      b.add(paint(G.box(0.22, 0.16, 0.18), 0x30363e, { gloss: 0.5, m: xf([Math.cos(a) * 4.06, -0.06, Math.sin(a) * 4.06], [0, -a, 0]) }));
      b.add(paint(G.box(0.08, 0.05, 0.2), PAL.brass, { gloss: 0.8, m: xf([Math.cos(a) * 4.14, 0.0, Math.sin(a) * 4.14], [0, -a, 0]) }));
    }
    // hazard chevrons at the edge
    for (let k = 0; k < 48; k++) {
      const a = k / 48 * Math.PI * 2;
      b.add(paint(G.box(0.16, 0.003, 0.06), k % 2 ? 0xd9a93a : 0x15181d, { m: xf([Math.cos(a) * 3.72, -0.004, Math.sin(a) * 3.72], [0, -a + Math.PI / 2, 0]) }));
    }
    deck.add(b.build(poster()));
  }
  // rim lamps: 24 small lamps (sprites, group 0 of the deck fx)
  const fx = new Sprites(400);
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2;
    fx.add({ p: [Math.cos(a) * 3.88, 0.02, Math.sin(a) * 3.88], col: 0xffb050, i: 1.6, size: 0.1, group: 1, kind: 0 });
    fx.add({ p: [Math.cos(a) * 3.88, 0.02, Math.sin(a) * 3.88], col: 0xff9a40, i: 0.5, size: 0.42, group: 1, kind: 4 });
  }
  // the flare over the lid at "fire in the sky" (group 2): a red-gold starburst high in front
  const rnd = mulberry(77);
  fx.burst({ p: [0.6, 16, -9], t0: 2.32, n: 90, speed: 6.5, life: 3.2, cols: [0xffc060, 0xff6a30, 0xffe0a0], size: 0.45, grav: 1.4, drag: 1.1, group: 2, rnd, i: 2.6 });
  fx.add({ p: [0.6, 16, -9], col: 0xff9040, i: 3, size: 7, group: 2, kind: 1, t0: 2.32, t1: 3.6 });
  fx.commit();
  deck.add(fx.mesh);

  // ---- gold seams: "gold on the wire" races along the edges of the box before it opens ----
  const y0 = 0.012, yt = R0.h - 0.012;
  const x0 = R0.x0 + 0.012, x1 = R0.x1 - 0.012, z0 = R0.z0 + 0.012, z1 = R0.z1 - 0.012;
  const seamList = [
    { pts: [[0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, y0, z1]], w: 0.03, t0: 0.26, speed: 12.5, group: 1, up: [0, 1, 0] },
    { pts: [[0, y0, z0], [x0, y0, z0], [x0, y0, z1], [0, y0, z1]], w: 0.03, t0: 0.26, speed: 12.5, group: 1, up: [0, 1, 0] },
  ];
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) {
    const n = new THREE.Vector3(-x, 0, -0.2 - z).normalize();
    seamList.push({ pts: [[x, y0, z], [x, yt, z]], w: 0.035, t0: 0.98, speed: 18, group: 2, up: n.toArray() });
  }
  seamList.push({ pts: [[x0, yt, z0], [x1, yt, z0], [x1, yt, z1], [x0, yt, z1], [x0, yt, z0]], w: 0.035, t0: 1.12, speed: 40, group: 2, up: [0, 1, 0] });
  const seamMat = ribbonMat(0xe0a527, 0xfff2c0);
  const seams = new THREE.Mesh(ribbonGeo(seamList), seamMat);
  seams.renderOrder = 7;
  seams.frustumCulled = false;

  return { apply, reset, deck, deckFx: fx, seams, seamMat, pieces, textured };
}

export function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
