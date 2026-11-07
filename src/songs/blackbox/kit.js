// Shared set pieces for DD-003 scene builders:
//   saltFlat(kit, o)  the black salt flat with two rows of T-poles (S01 and its leitmotif return S18)
//   placeholder(spec) a simple stand-in world (ground, rows, a giant ring, lyric lines on their word
//                     timings) so the whole show runs end to end before a group has built its scenes.
import * as THREE from 'three';
import { PAL } from './style.js';
import { RIG } from './rig.js';

// The salt flat: matte-black ground to the horizon, T-poles (black, gold rim, white bulb on each
// crossarm end) in two rows at x = +-gap, every `spacing` m, from far ahead to behind the player.
//   o: { gap = 4, spacing = 10, count = 18 (per side), height = 12, groundY = 0 }
// Returns { group, ground, poles, bulbs, n, update(t, d, bulbFn) }:
//   d = distance travelled (m, from kit.travel), the rows scroll toward +z and wrap (pure in d).
//   bulbFn(i, side, zWorld) -> colour hex | null (null = off), called per pole every frame.
export function saltFlat(kit, o = {}) {
  const gap = o.gap ?? 4, spacing = o.spacing ?? 10, count = o.count ?? 18, h = o.height ?? 12, gy = o.groundY ?? 0;
  const group = new THREE.Group();
  group.name = 'bb-saltflat';
  const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 48), kit.flat({ color: PAL.black, fog: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = gy - 0.02;
  group.add(ground);
  // pole: mast + crossarm, merged
  const mast = new THREE.BoxGeometry(0.22, h, 0.22); mast.translate(0, h / 2, 0);
  const arm = new THREE.BoxGeometry(2.4, 0.16, 0.16); arm.translate(0, h - 0.4, 0);
  const pg = mergeSimple([mast, arm]);
  const n = count * 2;
  const poles = new THREE.InstancedMesh(pg, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }), n);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 6), kit.flat({ color: PAL.white, fog: 0.6 }), n * 2);
  bulbs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 2 * 3), 3);
  poles.frustumCulled = false; bulbs.frustumCulled = false;
  group.add(poles, bulbs);
  // the r 0.16 bulbs vanish beyond ~10 m, so a bigger flat glow shares their matrices and colours
  // (o.glow: false when the scene draws its own, as S01 does)
  let glow = null;
  if (o.glow !== false) {
    glow = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.42, 1), kit.flat({ color: PAL.white, fog: 0.45 }), n * 2);
    glow.instanceMatrix = bulbs.instanceMatrix; glow.instanceColor = bulbs.instanceColor;
    glow.frustumCulled = false; group.add(glow);
  }
  const m = new THREE.Matrix4(), c = new THREE.Color();
  const span = count * spacing;
  return {
    group, ground, poles, bulbs, glow, n, gap, spacing, span,
    update(t, d = 0, bulbFn = null) {
      for (let i = 0; i < count; i++) {
        // z from -span+10 (far ahead) .. +10 (just behind), scrolling toward +z with d
        let z = -span + 10 + ((i * spacing + d) % span + span) % span;
        for (let s = 0; s < 2; s++) {
          const k = i * 2 + s, x = s ? gap : -gap;
          m.makeTranslation(x, gy, z);
          poles.setMatrixAt(k, m);
          const col = bulbFn ? bulbFn(i, s, z) : PAL.white;
          for (let e = 0; e < 2; e++) {
            m.makeTranslation(x + (e ? 1.15 : -1.15), gy + h - 0.2, z);
            bulbs.setMatrixAt(k * 2 + e, m);
            if (col === null || col === undefined) c.setRGB(0.02, 0.02, 0.025); else c.set(col);
            bulbs.setColorAt(k * 2 + e, c);
          }
        }
      }
      poles.instanceMatrix.needsUpdate = true; bulbs.instanceMatrix.needsUpdate = true; bulbs.instanceColor.needsUpdate = true;
    },
  };
}

// merge plain (non-indexed or indexed) geometries with position+normal(+uv) into one
export function mergeSimple(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = geos.reduce((s, g) => s + g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of geos) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv');
    pos.set(p.array, o * 3);
    if (n) nor.set(n.array, o * 3);
    if (u) uv.set(u.array, o * 2);
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

// ------------------------------------------------------------------------------------------------
// Placeholder world (replace per scene). spec: { id, t0, t1, world, place, lines: [lineIdx...],
// salt (use the salt flat), title (show the title reveal), speed (m/s) }
export function placeholder(spec) {
  return {
    id: spec.id, t0: spec.t0, t1: spec.t1, world: spec.world, pre: 0, post: 0,
    key: spec.world === 'cold' ? [-0.5, 0.45, -0.75] : [0.15, 0.55, -0.85],
    sky: spec.world === 'cold' ? { moonR: 0.07, stars: 0.5 } : undefined,
    placeholder: true,
    build(kit) {
      const s = { texts: [] };
      const R = kit.rnd(spec.id.charCodeAt(1) * 31 + spec.id.charCodeAt(2));
      s.world = new THREE.Group();
      kit.group.add(s.world);
      if (spec.salt) {
        s.flat = saltFlat(kit);
        s.world.add(s.flat.group);
      } else {
        const ground = new THREE.Mesh(new THREE.CircleGeometry(300, 40), kit.flat({ color: spec.world === 'cold' ? PAL.petrolDeep : PAL.velvet }));
        ground.rotation.x = -Math.PI / 2; ground.position.y = -3;
        kit.group.add(ground);
        // two rows of pillars (rows of repeated objects), scrolling
        const n = 40;
        const geo = new THREE.BoxGeometry(1.4, 1, 1.4); geo.translate(0, 0.5, 0);
        s.rows = new THREE.InstancedMesh(geo, kit.toon({ ramp: 'world' }), n);
        s.rows.frustumCulled = false;
        s.h = Array.from({ length: n }, () => 6 + R() * 22);
        s.world.add(s.rows);
        // giant slow ring ahead
        s.ring = new THREE.Mesh(new THREE.TorusGeometry(26, 2.2, 8, 48), kit.toon({ ramp: spec.world === 'cold' ? 'cold' : 'gold' }));
        s.ring.position.set(0, 18, -110);
        kit.group.add(s.ring);
      }
      // scene label (debug, small, high up-left so it never covers the lyric type)
      const label = kit.text(`${spec.id}  ${spec.place}`, { cap: 0.32, color: 'cream', at: { d: 9, az: -28, y: 4.2 }, opacity: 0.75 });
      label.mesh.name = 'bb-label';
      // lyric lines on their word timings, alternating left/right
      (spec.lines || []).forEach((li, k) => {
        const L = kit.words.lines[li];
        if (!L) return;
        const str = L.text.replace(/,\s*/g, ',\n').replace(/\.\.\.\s*/g, '...\n').trim();
        const times = L.w.map((w) => w[1]);
        const nextS = kit.words.lines[li + 1]?.s ?? L.e + 2;
        s.texts.push(kit.text(str, {
          cap: 0.55, color: k % 2 ? 'cream' : 'gold', times, out: Math.min(spec.t1 + 0.2, Math.max(L.e + 0.3, nextS - 0.05)),
          at: { d: 6, az: k % 2 ? 22 : -22, y: 2.05 },
        }));
      });
      if (spec.title) {
        kit.text('GOLD ON THE WIRE', { cap: 3.2, color: 'gold', times: [147.34, 147.5, 147.6, 147.7], at: { d: 40, az: 0, y: 9 }, pop: true });
        kit.text('MISTYCONIFER', { cap: 1.0, color: 'cream', tracking: 0.25, times: 148.6, at: { d: 40, az: 0, y: 5.2 } });
      }
      s.prof = kit.travel([[spec.t0, spec.speed ?? 4, 1.2]]);
      return s;
    },
    update(t, s, kit) {
      const d = s.prof.d(t);
      if (s.flat) {
        s.flat.update(t, d, (i) => (i * 0.9 < (t - spec.t0) * 6 ? PAL.white : null));
      } else {
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
        const span = 200;
        for (let i = 0; i < s.rows.count; i++) {
          const side = i % 2 ? 1 : -1;
          const z = -180 + (((i >> 1) * 10 + d) % span + span) % span - 10;
          p.set(side * (9 + (i % 4)), -3, z); sc.set(1, s.h[i], 1);
          m.compose(p, q, sc); s.rows.setMatrixAt(i, m);
        }
        s.rows.instanceMatrix.needsUpdate = true;
        s.ring.rotation.z = t * 0.05;
      }
      // beat pulse on the giant shape + gauge
      if (s.ring) s.ring.scale.setScalar(1 + 0.03 * kit.beatEnv(t, 7));
      if (kit.isOwner && spec.world === 'hot') kit.setSky({ rot: t * 0.035, ringPhase: t * 0.12 });
    },
  };
}

export { RIG };
