// S01 Black salt flat: the Two-Faced Mask (0.00 to 9.18, hot). Title on the first sung word.
// Salt flat: kit.saltFlat() with its DEFAULTS (gap 4, spacing 10, count 18, height 12); the flat's
// group is shifted +40 m on z so the pole rows continue behind the player (S18 may do the same).
import * as THREE from 'three';
import { PAL } from './style.js';
import { extrude, mirrorShape, mergeDiscs, scratch } from './scenes-1-util.js';

const RAY_ON = [1.19, 1.75, 2.32, 2.9], RAY_OFF = [8.04, 8.61, 8.9, 9.18];
const FACE_KEY = [0.2, 0.5, 0.84]; // the mask is lit from the player's side

export const S01 = {
  id: 'S01', t0: 0, t1: 9.18, world: 'hot', pre: 0, post: 0,
  key: [0, 0.55, -0.83], // straight ahead and high: the poles are backlit, gold rims toward the player
  fog: { color: PAL.velvet, near: 30, far: 160 },
  build(kit) {
    const s = { x: scratch() };
    s.prof = kit.travel([[1.6, 3, 1.6]]);
    // salt flat + pole rows
    s.salt = kit.saltFlat({ glow: false }); // S01 adds its own glow below
    s.salt.group.position.z = 40;
    kit.group.add(s.salt.group);
    // bigger lamp heads sharing the salt flat's bulb matrices/colours (the bulbs alone are too small to read)
    s.glow = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.42, 1), kit.flat({ color: PAL.white, fog: 0.45 }), s.salt.bulbs.count);
    s.glow.instanceMatrix = s.salt.bulbs.instanceMatrix; s.glow.instanceColor = s.salt.bulbs.instanceColor;
    s.glow.frustumCulled = false; s.salt.group.add(s.glow);

    // giant transmission towers far out on both sides (periphery: rows of repeated giant shapes)
    const tg = mergeG([new THREE.CylinderGeometry(0.7, 3.6, 46, 4).translate(0, 23, 0), new THREE.BoxGeometry(18, 0.7, 0.7).translate(0, 33, 0), new THREE.BoxGeometry(12, 0.7, 0.7).translate(0, 41, 0), new THREE.CylinderGeometry(0.01, 2.2, 3, 4).translate(0, 47, 0)]);
    s.towers = new THREE.InstancedMesh(tg, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.45 }), 12);
    for (let i = 0; i < 12; i++) s.towers.setMatrixAt(i, s.x.m.makeRotationY(0.5).setPosition(i % 2 ? 46 : -46, 0, 50 - (i >> 1) * 55));
    s.towers.frustumCulled = false;
    s.tw = new THREE.Group(); s.tw.add(s.towers); kit.group.add(s.tw);
    s.twLamps = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.9), kit.flat({ color: PAL.crimson, fog: 0.3 }), 12);
    for (let i = 0; i < 12; i++) s.twLamps.setMatrixAt(i, s.x.m.makeTranslation(i % 2 ? 46 : -46, 49.2, 50 - (i >> 1) * 55));
    s.tw.add(s.twLamps);
    // ---- THE TWO-FACED MASK (34 m disc, 2 m deep) ----
    const M = new THREE.Group();
    s.mask = M; s.maskSpin = new THREE.Group();
    M.add(s.maskSpin);
    kit.group.add(M);
    const S = s.maskSpin;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 2, 48, 1, true).rotateX(Math.PI / 2), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.4 }));
    const front = new THREE.Mesh(new THREE.CircleGeometry(16.4, 48), kit.toon({ ramp: 'cream', rim: null, key: FACE_KEY, fog: 0.35 }));
    front.position.z = 1.0;
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(16.9, 0.75, 6, 64), kit.toon({ ramp: 'gold', rim: null, key: FACE_KEY, fog: 0.35 }));
    rimRing.position.z = 1.0;
    // closed eyes: two downward-curving black arcs; the smile: a crimson crescent
    const eyeGeo = new THREE.TorusGeometry(2.7, 0.34, 4, 18, Math.PI * 0.82).rotateZ(Math.PI + Math.PI * 0.09);
    const eyes = new THREE.Group();
    s.eyeMat = kit.flat({ color: PAL.velvet });
    for (const x of [-6, 6]) { const e = new THREE.Mesh(eyeGeo, s.eyeMat); e.position.set(x, 3.4, 1.1); eyes.add(e); }
    const smileShape = new THREE.Shape();
    smileShape.absarc(0, 0, 8.2, Math.PI * 1.12, Math.PI * 1.88, false);
    smileShape.absarc(0, 1.6, 7.0, Math.PI * 1.86, Math.PI * 1.14, true);
    s.smile = new THREE.Mesh(new THREE.ShapeGeometry(smileShape, 20), kit.flat({ color: PAL.crimson }));
    s.smile.position.set(0, -0.6, 1.12);
    // brows: two thin gold strokes (makes the angel read at 90 m)
    const brow = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 3, 14, Math.PI * 0.6).rotateZ(Math.PI * 0.2), kit.flat({ color: PAL.brass }));
    brow.position.set(-6, 5.2, 1.1);
    const brow2 = brow.clone(); brow2.position.x = 6;
    S.add(side, front, rimRing, eyes, s.smile, brow, brow2);
    // back: the Engineer's face (dark carmine) under a black bob, round glasses
    const back = new THREE.Group();
    back.rotation.y = Math.PI;
    const bface = new THREE.Mesh(new THREE.CircleGeometry(16.4, 48), kit.flat({ color: PAL.carmineDeep }));
    bface.position.z = 1.0;
    const bob = mirrorShape([[0, 16.9], [7, 15.4], [12.2, 11.5], [15.6, 5.5], [16.6, -1], [16.4, -9.5], [10.5, -6.8], [9.2, 2.4], [5.5, 7.2], [0, 8.6]]);
    const bobMesh = new THREE.Mesh(new THREE.ShapeGeometry(bob, 8), kit.flat({ color: PAL.black }));
    bobMesh.position.z = 1.06;
    s.glassMat = kit.flat({ color: PAL.white, fog: 0.15 });
    s.glasses = new THREE.Mesh(mergeDiscs([[-5.4, 0.6, 1.14, 2.5], [5.4, 0.6, 1.14, 2.5]], 24), s.glassMat);
    const frames = new THREE.Mesh(mergeDiscs([[-5.4, 0.6, 1.1, 3.1], [5.4, 0.6, 1.1, 3.1]], 24), kit.flat({ color: PAL.gold }));
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 0.1), kit.flat({ color: PAL.gold }));
    bridge.position.set(0, 1.2, 1.12);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(5, 0.45, 0.1), kit.flat({ color: PAL.black }));
    mouth.position.set(0, -8.2, 1.1);
    back.add(bface, bobMesh, frames, s.glasses, bridge, mouth);
    S.add(back);
    // halo (gold torus, 20 m across, tilted) with cream beads so its spin reads
    s.halo = new THREE.Group();
    s.halo.position.y = 24;
    const haloTilt = new THREE.Group(); haloTilt.rotation.x = -1.18;
    s.haloMat = kit.toon({ ramp: 'gold', rim: null, key: FACE_KEY, fog: 0.35 });
    haloTilt.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.85, 6, 48), s.haloMat));
    const beadGeo = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; beadGeo.push(new THREE.OctahedronGeometry(1.1).translate(Math.cos(a) * 10, Math.sin(a) * 10, 0)); }
    s.beadMat = kit.flat({ color: PAL.cream, fog: 0.5 });
    haloTilt.add(new THREE.Mesh(mergeG(beadGeo), s.beadMat));
    s.halo.add(haloTilt);
    M.add(s.halo);
    // wings: cream cut-outs, folded against the sides, fan open on "angel"
    const wing = new THREE.Shape();
    [[0, 3], [4, 7.5], [9, 10.5], [15, 11.5], [20, 10], [17.5, 8], [19, 6.2], [15.5, 5.2], [16.5, 2.8], [12.5, 2.6], [12.8, -0.2], [9, 0.6], [8.6, -2.6], [5, -1.2], [3.6, -4], [0, -2.5]]
      .forEach(([x, y], i) => (i ? wing.lineTo(x, y) : wing.moveTo(x, y)));
    const wg = extrude(wing, 0.5);
    const wMat = kit.toon({ ramp: 'cream', rim: PAL.gold, rimTh: 0.5, key: FACE_KEY, fog: 0.35, side: THREE.DoubleSide });
    s.wings = [-1, 1].map((sd) => {
      const piv = new THREE.Group();
      piv.position.set(sd * 16.2, 2, -0.6);
      const w = new THREE.Mesh(wg, wMat);
      w.scale.x = sd;
      piv.add(w);
      M.add(piv);
      return piv;
    });

    // ---- the first spark: from the console up to the wire ----
    s.spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), kit.flat({ color: PAL.goldHi }));
    kit.group.add(s.spark);
    s.sparks = kit.particles({
      n: 70, shape: 'stroke', size: 0.16, seed: 11, fog: 0.2,
      init: (i, r) => {
        const dir = i % 2 ? -1 : 1, sp = 25 + r() * 60;
        return { p: [0, 3.4, -0.3], v: [(r() - 0.5) * 1.5, (r() - 0.3) * 2, dir * sp], t0: 0.44 + r() * 0.5, life: 0.35 + r() * 0.4, c: r() < 0.5 ? PAL.white : PAL.goldHi, s: 0.1 + r() * 0.12 };
      },
    });
    kit.group.add(s.sparks);

    // ---- type ----
    // depthTest off: the title is never cut by the room pieces while the lobby breaks away (0-1.15 s)
    s.title = kit.text('GOLD ON THE WIRE', { cap: 1.3, color: 'gold', times: [0.26, 0.32, 0.38, 0.44], pop: true, dur: 0.18, out: 3.1, outDur: 0.3, depthTest: false, at: { d: 7, az: 0, y: 1.7 } });
    const fireG = new THREE.Group();
    kit.place(fireG, { d: 7.5, az: 0, y: 4.0 }); // clear of the title block below
    kit.group.add(fireG);
    s.fire = kit.text('FIRE IN THE', { cap: 0.8, color: 'cream', align: 'right', times: [1.16, 1.74, 2.32], out: 3.1, outDur: 0.3, parent: fireG });
    s.fire.mesh.position.x = 0.62;
    s.sky = kit.text('SKY', { cap: 0.8, color: 'gold', align: 'left', times: 2.58, pop: true, dur: 0.12, out: 3.1, outDur: 0.3, parent: fireG });
    s.sky.mesh.position.x = 0.92;
    s.misty = kit.text('MISTYCONIFER', { cap: 0.42, color: 'cream', tracking: 0.32, times: 2.32, out: 3.12, outDur: 0.28, at: { d: 7, az: 0, y: 0.55 } });
    s.rule = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.035), kit.flat({ color: PAL.gold, fog: 0 }));
    kit.place(s.rule, { d: 7, az: 0, y: 0.95 });
    kit.group.add(s.rule);
    s.smileT = kit.text('SMILE LIKE\nAN ANGEL', { cap: 0.85, color: 'cream', colors: { 3: 'gold' }, depthTest: false, near: 3.4, out: 7.9, at: { d: 6, az: -33, y: 1.2 } });
    s.lieT = kit.text('LIE LIKE\nA SPY', { cap: 0.85, color: 'cream', colors: { 3: PAL.rust }, depthTest: false, near: 6.02, out: 7.9, at: { d: 6, az: 33, y: 1.2 } });
    // SPY gets a gold rim: a gold copy, slightly bigger, right behind the rust word
    const w = s.lieT.words[3];
    s.spyRim = kit.text('SPY', { cap: 0.85 * 1.09, color: 'gold', depthTest: false, times: 7.16, out: 7.9, parent: s.lieT.mesh });
    s.spyRim.mesh.position.set((w.x0 + w.x1) / 2 + 0.45 * 0.85 * 0.2, (w.y0 + w.y1) / 2, -0.03);
    s.spyRim.mesh.renderOrder = 5;
    s.count = kit.text('COUNT DOWN', { cap: 1.1, color: 'gold', times: [8.06, 8.9], out: 9.18, outDur: 0.02, at: { d: 6, az: -12, y: 1.9 } });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    // pole lamps: nearest pairs at 0.62 / 1.19, the wave near->far at 2.32, rust on "spy", far->near death 8.04-9.18
    const spy = t >= 7.16 && t < 7.73;
    s.salt.update(t, d, (i, sd, z) => {
      const ahead = -(z + 40);
      const dist = Math.abs(ahead);
      let on = (t >= 0.62 && dist < 12) || (t >= 1.19 && dist < 22) || t >= 2.32 + 0.5 * Math.min(1, dist / 140);
      if (t >= 8.04 + 1.14 * (1 - Math.min(1, Math.max(0, ahead) / 140))) on = false;
      if (!on) return null;
      return spy ? PAL.rust : PAL.white;
    });
    const nOff = kit.FX.lightsOut(t, RAY_OFF);
    s.salt.poles.material.uniforms.uRimAmt.value = 1 - nOff * 0.22 - (t >= 9.12 ? 0.2 : 0);
    // the wire shoots out of the trolley on "Gold" (0 -> 300 m in 0.9 s)
    const k = sm(0.26, 1.16, t);
    if (kit.isOwner) {
      const R = kit.rigState;
      R.wheelSpin = d / 0.075;
      R.wire.on = t >= 0.4 ? 1 : 0;
      R.wire.lenF = 300 * k; R.wire.lenB = 300 * k;
      if (t >= 0.4 && t < 1.3) R.wire.pulses.push({ z: -300 * k, a: 1, w: 2.2 }, { z: 300 * k, a: 1, w: 2.2 });
      R.dark = sm(8.6, 9.18, t);
      if (t >= 6.02 && t < 6.2) R.gauge = 1;
      // sky: rays off until "fire", switched in 4 groups of 4 (and off again: the countdown is the light itself)
      const amt = t < 1.16 ? 0.4 : 1 - 0.18 * nOff;
      kit.setSky({ rot: t * 0.035, ringPhase: Math.max(0, t - 1.16) * 0.14, rings: t >= 1.16 && nOff < 3 ? 1 : 0, rayR: 3.2, amt: t >= 9.17 ? 0 : amt });
      const U = kit.sky.uRays.value;
      for (let i = 0; i < 16; i++) { const g = i % 4; U[i] = t >= RAY_ON[g] && t < RAY_OFF[3 - g] ? 1 : 0; }
    }
    s.tw.position.z = d;
    s.towers.material.uniforms.uRimAmt.value = 1 - nOff * 0.25;
    s.twLamps.visible = t >= 1.16 && t < 9.18 - (nOff > 2 ? 1 : 0) * 0.3;
    // spark: console (0.6 m ahead, deck height) up to the wire
    const sk = sm(0.26, 0.44, t);
    s.spark.visible = t >= 0.26 && t < 0.5;
    s.spark.position.set(0, 0.95 + 2.45 * sk, -0.62 + 0.32 * sk);
    s.spark.scale.setScalar(1 + 1.5 * Math.sin(Math.PI * sk));
    // MISTYCONIFER rule
    const rk = sm(2.32, 2.6, t) * (1 - sm(3.1, 3.38, t));
    s.rule.visible = rk > 0.01;
    s.rule.scale.x = Math.max(0.001, rk);
    s.rule.position.y = 0.95 - 0.4 * sm(3.1, 3.38, t);
    // SKY pops 20% bigger on "sky"
    s.sky.mesh.scale.setScalar(1 + 0.2 * sm(2.58, 2.66, t));
    // the mask: rises on "Smile", turns on "lie" (it holds ~90 m ahead, drifting in a little)
    const M = s.mask;
    M.position.set(0, -42 + 65 * kit.ease.inOut((t - 3.4) / 1.21), -74 + d * 0.3);
    M.scale.setScalar(1.15);
    s.smile.scale.y = 0.25 + 0.75 * sm(3.47, 3.75, t);
    s.maskSpin.rotation.y = Math.PI * kit.ease.inOut((t - 6.02) / 0.58);
    // halo: dark brass until 4.61, then gold; half a turn at 5.74
    const hb = t >= 4.61 ? 1 + 0.6 * Math.exp(-(t - 4.61) * 4) : 0.18;
    s.haloMat.uniforms.uBright.value = hb * (t >= 9.18 ? 0 : 1 - nOff * 0.2);
    s.beadMat.uniforms.uBright.value = t >= 4.61 ? 1 : 0.2;
    s.halo.rotation.y = Math.PI * kit.ease.inOut((t - 5.74) / 0.5);
    // wings fan open on "angel", snap shut on "lie"
    const open = sm(4.96, 5.4, t) * (1 - sm(6.02, 6.18, t));
    s.wings[0].rotation.z = -(-1.5 + 1.85 * open);
    s.wings[1].rotation.z = -1.5 + 1.85 * open;
    // her glasses: white on "lie", red at 6.33, flash on 6.89
    const gm = s.glassMat.uniforms;
    if (t < 6.02) gm.uColor.value.setHex(0x1a1010);
    else if (t < 6.33) gm.uColor.value.setHex(PAL.white);
    else gm.uColor.value.setHex(PAL.red);
    gm.uBright.value = 1 + 1.4 * Math.exp(-Math.max(0, t - 6.89) * 5) * (t >= 6.89 ? 1 : 0);
    // lights out: the mask's lit faces die with the last ray group (only the red glasses stay)
    const dim = t >= 9.12 ? 0 : 1 - nOff * 0.2;
    for (const ch of [s.smile]) ch.material.uniforms.uBright.value = dim;
    s.maskSpin.children[1].material.uniforms.uBright.value = dim;
    s.maskSpin.children[2].material.uniforms.uBright.value = dim;
  },
  events() {
    return [
      { t: 3.4, sfx: 'motor', gain: 0.45 },
      { t: 6.02, sfx: 'whoosh', gain: 0.5, haptic: [0.25, 40] },
      { t: 7.16, sfx: 'switch', gain: 0.4 },
      { t: 8.04, sfx: 'switch', gain: 0.45 },
      { t: 9.18, sfx: 'switch', gain: 0.55, haptic: [0.3, 40] },
    ];
  },
};

function mergeG(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const n = geos.reduce((a, g) => a + g.getAttribute('position').count, 0);
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) { P.set(g.getAttribute('position').array, o * 3); N.set(g.getAttribute('normal').array, o * 3); o += g.getAttribute('position').count; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  return out;
}
