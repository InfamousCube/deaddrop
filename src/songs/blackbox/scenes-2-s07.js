// S07 Gold ropeway over a canyon (47.50 to 56.61, hot). Clean rework, two clear beats:
//  A 47.5-51.4  HERO a black 36 m airship crossing a flat crimson sky; on "fire" it catches cel flames, then sinks away
//               behind the left rim. SUPPORT black canyon plateaus and a few big black spires left and right.
//               MOTION the airship drifts slowly right to left 110 m out (4 m/s, about 2 deg/s), sinks nose-down from 49.6
//               (at most about 4 deg/s in all) and is cut on "smile" (player glides 3 m/s).
//               ACCENT sunburst rays on "fire" and "sky" only. LYRIC low centre, over the black canyon.
//  B 51.4-56.61 HERO one colossal angel statue (cream robe, folded wings, gold halo) rises in the canyon ahead in front
//               of a gold sun; on "lie" it flips like a card: its back is the Engineer-spy, black, red glasses.
//               Rays once more on "lie". Out: SHATTER at 56.61 (the statue bursts into big shards).
import * as THREE from 'three';
import { PAL, COMFORT } from './style.js';
import { sm, env, merge, shapeOf, slab } from './scenes-2-util.js';

const RIM = -6; // plateau / canyon rim (y)
const ST = { z: -70, base: -8, h: 20, S: 1.5 }; // statue (world coords before travel): pillar top at base, figure height h * S

export const S07 = {
  id: 'S07', t0: 47.5, t1: 56.61, world: 'hot', pre: 0, post: 0.85,
  key: [0.25, 0.45, 0.85], // from behind the player: the angel's robe faces the light
  fog: { color: PAL.velvet, near: 50, far: 230 },
  sky: { zen: PAL.crimson, hor2: PAL.crimson, hor: PAL.crimson, nadir: PAL.velvet, rayA: PAL.crimson, rayB: PAL.carmine, rays: 0, rings: 0 },

  build(kit) {
    const s = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), sc: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Euler() };
    const R = kit.rnd(707);
    s.prof = kit.travel([[47.5, 3, 1.0]]);
    s.W = new THREE.Group(); s.W.name = 's07-world';
    kit.group.add(s.W);
    const black = kit.flat({ color: PAL.black });

    // ---- canyon: plateaus left and right, a few big black spires (one instanced mesh) ----
    const plat = new THREE.Mesh(merge([
      new THREE.BoxGeometry(300, 80, 600).translate(-(17 + 150), RIM - 40, -150),
      new THREE.BoxGeometry(300, 80, 600).translate(17 + 150, RIM - 40, -150),
    ]), black);
    plat.frustumCulled = false;
    s.W.add(plat);
    const spG = new THREE.CylinderGeometry(0.35, 1, 1, 5, 1).translate(0, 0.5, 0);
    const spires = [];
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, k = Math.floor(i / 2);
      spires.push([side * (26 + R() * 10), RIM, 40 - k * 52 - R() * 12, 7 + R() * 4, 16 + R() * 18]);
    }
    s.spires = new THREE.InstancedMesh(spG, kit.toon({ ramp: [PAL.black, PAL.black, PAL.carmineDeep], rim: null }), spires.length);
    spires.forEach(([x, y, z, r, h], i) => {
      s.e.set(0, R() * 6, 0); s.q.setFromEuler(s.e);
      s.spires.setMatrixAt(i, s.m.compose(s.p.set(x, y, z), s.q, s.sc.set(r, h, r)));
    });
    s.spires.frustumCulled = false;
    s.W.add(s.spires);

    // ---- the airship: black cigar hull with fins and gondola (player-relative, drifts right to left) ----
    const prof = [];
    for (let k = 0; k <= 12; k++) { const y = -18 + k * 3; prof.push(new THREE.Vector2(Math.max(0.05, 4.8 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(y) / 18, 2.4)))), y)); }
    const hull = new THREE.LatheGeometry(prof, 10).rotateZ(Math.PI / 2); // long axis along x
    const airG = merge([
      hull,
      new THREE.BoxGeometry(5, 4.6, 0.4).translate(15.5, 3.6, 0), new THREE.BoxGeometry(5, 4.6, 0.4).translate(15.5, -3.6, 0),
      new THREE.BoxGeometry(5, 0.4, 4.6).translate(15.5, 0, 3.6), new THREE.BoxGeometry(5, 0.4, 4.6).translate(15.5, 0, -3.6),
      new THREE.BoxGeometry(7, 1.6, 2.4).translate(-2, -5.4, 0),
    ]);
    s.air = new THREE.Group();
    s.air.scale.setScalar(3.2); // 115 m long at 110 m: about as big in view as before (55 deg), at a fifth of the angular speed
    s.air.add(new THREE.Mesh(airG, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.55 })));
    // cel flames: big cut-out tongues along the top, two colours, stepped at 3 Hz
    const tongue = shapeOf([[-1, 0], [1, 0], [0.8, 1.2], [1.3, 2.6], [0.5, 2.0], [0.4, 3.8], [-0.1, 2.7], [-0.6, 4.4], [-0.7, 2.5], [-1.3, 3.1], [-0.9, 1.3]]);
    const tg = new THREE.ShapeGeometry(tongue);
    s.flames = [[PAL.orange, 2.6], [PAL.amber, 1.4]].map(([col, sc]) => {
      const M = new THREE.InstancedMesh(tg, kit.flat({ color: col, side: THREE.DoubleSide, fog: 0.2 }), 6);
      M.frustumCulled = false; M.userData.sc = sc;
      s.air.add(M);
      return M;
    });
    s.flameX = [-12, -7, -2, 3, 8, 12.5];
    kit.group.add(s.air);

    // ---- the statue on its pillar: angel front, spy back (a card flip on "lie") ----
    s.SG = new THREE.Group();
    s.SG.position.set(0, 0, ST.z);
    s.W.add(s.SG);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 13, 90, 6).translate(0, ST.base - 45, 0), kit.toon({ ramp: [PAL.black, PAL.black, PAL.carmineDeep], rim: null }));
    s.SG.add(pillar);
    s.fig = new THREE.Group(); // rises on "smile", flips on "lie"
    s.SG.add(s.fig);
    const H = ST.h;
    const robe = shapeOf([[-4.6, 0], [4.6, 0], [3.4, H * 0.55], [4.2, H * 0.68], [2, H * 0.74], [-2, H * 0.74], [-4.2, H * 0.68], [-3.4, H * 0.55]]);
    const wing = shapeOf([[0, 0], [1.6, 2], [2.6, 8], [2.2, 14], [0.8, 17.5], [-0.6, 12], [-0.5, 4]]);
    const angelG = merge([
      slab(robe, 1.6, 0.2),
      new THREE.IcosahedronGeometry(2.3, 0).scale(1, 1.15, 0.8).translate(0, H * 0.74 + 2.4, 0.2),
      slab(wing, 1.2, -0.9).translate(3.6, H * 0.3, 0), slab(wing, 1.2, -0.9).scale(-1, 1, 1).translate(-3.6, H * 0.3, 0),
    ]);
    s.angel = new THREE.Group();
    s.angel.add(new THREE.Mesh(angelG, kit.toon({ ramp: 'cream', rim: null })));
    s.halo = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.5, 5, 18), kit.flat({ color: PAL.gold, fog: 0.3 }));
    s.halo.position.set(0, H * 0.74 + 6.6, -0.4);
    s.angel.add(s.halo);
    const suit = shapeOf([[-4.4, 0], [-1, 0], [-0.6, H * 0.4], [0.6, H * 0.4], [1, 0], [4.4, 0], [4.0, H * 0.66], [2.4, H * 0.74], [-2.4, H * 0.74], [-4.0, H * 0.66]]);
    const bob = shapeOf([[-3.2, 0], [3.2, 0], [3.5, 3.2], [2.6, 5.4], [0, 6.2], [-2.6, 5.4], [-3.5, 3.2]]);
    s.spy = new THREE.Group();
    s.spy.add(new THREE.Mesh(merge([slab(suit, 1.6, 0.2), slab(bob, 1.6, 0.2).translate(0, H * 0.74 + 0.2, 0)]), black));
    const lens = merge([new THREE.CircleGeometry(1.05, 14).translate(-1.3, 0, 0), new THREE.CircleGeometry(1.05, 14).translate(1.3, 0, 0)]);
    const glasses = new THREE.Mesh(lens, kit.flat({ color: PAL.red, fog: 0.2 }));
    glasses.position.set(0, H * 0.74 + 2.6, 1.08);
    s.spy.add(glasses);
    s.fig.add(s.angel, s.spy);
    s.fig.scale.setScalar(ST.S);
    s.headY = ST.base + (H * 0.74 + 2.6) * ST.S;

    // ---- the shatter: big angular shards burst from the statue toward and past the player ----
    const NSH = COMFORT ? 9 : 16; // few, big shards: one short accent
    const zS = ST.z + s.prof.d(56.61);
    s.shards = kit.shards({
      n: NSH, t0: 56.61, life: 0.72, gravity: -4, seed: 79, colors: [PAL.black, PAL.gold, PAL.black],
      init: (i, r) => {
        const y = ST.base + r() * H * ST.S * 0.95, x = (r() - 0.5) * 11;
        const ax = (r() - 0.5) * 30, ay = (r() - 0.3) * 14;
        return { p: [x, y, zS + 1], v: [ax, ay, 36 + r() * 10] /* they end 9-16 m ahead: nothing reaches the player */, s: [4 + r() * 3.5, 4 + r() * 3.5], spin: (r() - 0.5) * 5, delay: r() * 0.05 };
      },
    });
    kit.group.add(s.shards);

    // ---- lyric blocks: one at a time, low centre over the black canyon ----
    const at = { d: 7, az: 0, y: 0.35 };
    s.l1 = kit.text('GOLD ON THE WIRE,', { cap: 0.85, color: 'gold', times: [47.48, 48.0, 48.5, 48.72], out: 49.28, outDur: 0.05, at });
    s.l2 = kit.text('FIRE IN THE SKY', { cap: 0.85, color: 'cream', colors: { 3: 'gold' }, times: [49.34, 49.78, 50.4, 50.58], out: 51.3, outDur: 0.12, at });
    s.l3 = kit.text('SMILE LIKE AN ANGEL,', { cap: 0.8, color: 'cream', times: [51.44, 51.98, 52.6, 52.94], out: 53.92, outDur: 0.05, at });
    s.l4 = kit.text('LIE LIKE A SPY', { cap: 0.95, color: 'gold', colors: { 3: 'rust' }, times: [53.98, 54.34, 54.86, 55.22], out: 56.5, outDur: 0.1, at });
    return s;
  },

  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;
    s.W.visible = t < 56.61;


    // airship: drifts right to left 110 m out at 4 m/s (about 2 deg/s; was 14 m/s at 46 m, 18 deg/s), catches fire on "fire",
    // sinks nose-down from 49.6 (vertical at most 4.4 m/s = 2.3 deg/s) and is cut on "smile" (51.44), before the angel rises
    const ax = 9 - 4 * (t - 47.5), sink = Math.max(0, t - 49.6);
    s.air.visible = t < 51.44;
    s.air.position.set(ax, 30 - 1.2 * sink * sink, -110); // hull bottom stays above the low lyric block
    s.air.rotation.set(0, 0.12, 0.1 * sm(49.6, 51.44, t));
    const fire = t >= 49.34 ? 1 : 0;
    const step = Math.floor(t * 3);
    for (const M of s.flames) {
      M.visible = fire > 0;
      if (!M.visible) continue;
      for (let i = 0; i < 6; i++) {
        const h = M.userData.sc * (0.7 + 0.45 * ((Math.sin(step * 1.7 + i * 2.3) + 1) / 2)) * sm(49.34 + i * 0.05, 49.6 + i * 0.05, t);
        s.m.makeScale(h, Math.max(0.01, h), 1).setPosition(s.flameX[i], 3.6, 0.9);
        M.setMatrixAt(i, s.m);
      }
      M.instanceMatrix.needsUpdate = true;
    }

    // statue rises out of the canyon on "smile", flips like a card on "lie"
    const rise = sm(50.9, 52.0, t);
    s.fig.position.y = -50 * (1 - rise);
    s.SG.visible = t >= 50.85 && t < 56.61;
    const f = (t - 53.98) / 0.32;
    const flip = f <= 0 ? 1 : f >= 1 ? 1 : Math.abs(Math.cos(f * Math.PI));
    s.fig.scale.set(ST.S * Math.max(0.02, flip), ST.S, ST.S);
    const spySide = f >= 0.5;
    s.angel.visible = !spySide; s.spy.visible = spySide;
    s.halo.material.uniforms.uBright.value = 0.6 + 0.5 * sm(51.44, 51.6, t);

    if (kit.isOwner) {
      kit.rigState.wire.on = 0; kit.rigState.wire.pulses = [];
      // rays only on the hits: "fire", "sky", "lie"
      const rays = Math.max(env(t, 49.34, 2.4), env(t, 50.58, 2.8), env(t, 53.98, 2.2));
      const r = rays > 0.12 ? Math.min(1, rays * 1.3) : 0;
      const zH = ST.z + d, yH = s.headY + s.fig.position.y - 1.6;
      const sun = sm(51.44, 51.9, t);
      kit.setSky({
        rays: r, rayR: 1.6, rot: t * 0.03, rings: 0,
        sunR: sun * 0.17, sunCol: PAL.gold, sunRing: PAL.brass,
        focal: t < 51.2 ? [0, Math.sin(0.14), -Math.cos(0.14)] : [0, yH, zH],
      });
    }
  },

  events() {
    return [
      { t: 49.34, sfx: 'whoosh', gain: 0.5 },
      { t: 51.44, sfx: 'rebuild', gain: 0.35 },
      { t: 53.98, sfx: 'shutter', gain: 0.5, haptic: [0.3, 60] },
      { t: 56.61, sfx: 'crack', gain: 0.6, haptic: [0.5, 120] },
    ];
  },
};
