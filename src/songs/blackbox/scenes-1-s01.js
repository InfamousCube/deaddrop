// S01 The wire at sunset (0.00 to 7.90, hot). Round 3, storyboard v3.
// SHOT CARD
//   what     you float down an old telegraph line through a black desert at sunset; a gold spark races along
//            the wire into the sun, the sun bursts into crimson rays, and a giant Queen card rises: an angel
//            on the front, who turns round and is a spy.
//   hero     the sun at the vanishing point (0-3.4), then the 7.2 x 10 m Queen card standing on the horizon
//   around   two rows of 9 m telegraph poles (crossarms, braces, glass insulators) at x +-4 pass on both sides;
//            the four sagging wires of each row run overhead 6.4 m above the eyes; behind, the line runs back
//   palette  black sand + crimson/carmine sky + gold spark, halo, insulators + cream card face
//   motion   glide 0 -> 3.5 m/s (from 0.3), down to 1 m/s by 7.5. 0.26-1.16 the spark runs to the sun;
//            1.16 the sunburst (rays sweep on until 3.08); 3.40 the card rises; 4.96 halo flash;
//            6.02 the card turns (spy side); 7.16 her glasses flare red
//   lyrics   one block at a time, low centre under the card (d 8), depthTest off
//   out      WORLD ASSEMBLES 7.46-7.90: the card tips forward and falls flat, the desert sinks (<= 2 m/s) and
//            goes dark while S02's roulette bowl rises around and below you
import * as THREE from 'three';
import { PAL } from './style.js';
import { buildTelegraphLine, buildQueenCard, scratch } from './scenes-1-util.js';

const CARD_P = 32;          // card position (path metres; between two pole pairs, narrower than the wire corridor)
const CARD_S = 0.75;        // 5.4 x 7.5 m: it stands between the wires, 24 m ahead on "smile", 12.6 m when it falls
const CARD_Y = 0.3 + 3.75;  // card centre when risen (bottom 0.3 m above the sand)
const SUN = [0, 0.105, -1]; // sun direction (6 deg up): the card covers it exactly
const LOW = { d: 8, az: 0, y: 0.72 };

export const S01 = {
  id: 'S01', t0: 0, t1: 7.9, world: 'hot', pre: 0, post: 0,
  key: [0, 0.35, -0.94], // backlight from the sun: poles read as silhouettes with a gold rim
  fog: { color: PAL.velvet, near: 25, far: 90 },
  flashes: [{ t: 1.16, color: PAL.crimson, dur: 0.03 }],
  build(kit) {
    const s = { x: scratch(), sp: new THREE.Vector3() };
    const W = (txt, near) => kit.words.times(txt, near)[0];
    s.tGold = W('gold', 0.26); s.tFire = W('fire', 1.16); s.tSky = W('sky', 2.58); s.tSmile = W('smile', 3.4);
    s.tAngel = W('angel', 4.96); s.tLie = W('lie', 6.02); s.tSpy = W('spy', 7.16);
    s.prof = kit.travel([[0.3, 3.5, 1.5], [5.0, 1.0, 2.5]]);
    const world = (s.world = new THREE.Group());
    kit.group.add(world);
    // black sand
    s.ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), kit.flat({ color: PAL.velvet, fog: 0 }));
    s.ground.name = 's01-sand';
    world.add(s.ground);
    // the telegraph line
    s.line = buildTelegraphLine(kit, { gap: 4, spacing: 10, count: 8, z0: 20, height: 9, insR: 1.8, wireR: 0.06, rimTh: 0.78 });
    world.add(s.line.group);
    s.line.ins.setColorAt(0, s.x.c.set(0xffffff));
    s.insOff = new THREE.Color(0.3, 0.32, 0.36); s.insOn = new THREE.Color(1.0, 0.72, 0.18);
    // the gold spark on the right row's innermost wire: a 2 m streak + a flare
    const sparkMat = kit.flat({ color: PAL.goldHi, additive: true, fog: 0.2 });
    s.spark = new THREE.Group();
    s.spark.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 2.4, 6).rotateX(Math.PI / 2).translate(0, 0, 1.1), sparkMat));
    s.spark.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), kit.flat({ color: PAL.gold, additive: true, fog: 0.2 })));
    world.add(s.spark);
    // the Queen card on a pivot at its bottom edge (it falls forward from there)
    s.card = buildQueenCard(kit, { rim: PAL.gold });
    s.pivot = new THREE.Group();
    s.pivot.position.set(0, 0, -CARD_P);
    s.card.group.scale.setScalar(CARD_S);
    s.card.group.position.y = (s.card.H * CARD_S) / 2;
    s.pivot.add(s.card.group);
    world.add(s.pivot);
    // lyrics, one block at a time, under the card
    const L = { cap: 1.2, lineGap: 1.0, vAlign: 'top', depthTest: false, at: LOW };
    kit.text('GOLD ON\nTHE WIRE', { ...L, color: 'gold', near: 0.26, pop: true, out: 1.1 });
    kit.text('FIRE IN\nTHE SKY', { ...L, color: 'cream', near: 1.16, out: 3.25 });
    kit.text('SMILE LIKE\nAN ANGEL', { ...L, color: 'gold', near: 3.4, out: 5.9 });
    kit.text('LIE LIKE\nA SPY', { ...L, color: 'cream', colors: { 3: PAL.rust }, near: 6.02, out: 7.8 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    // out: the desert sinks (<= 2 m/s) and goes dark; the sand is gone at 7.62 so the bowl shows below
    s.world.position.set(0, -0.85 * sm(7.46, 7.9, t), d);
    s.ground.visible = t < 7.62;
    kit.fade(1 - sm(7.5, 7.88, t));
    // spark: from beside the player (0.26) down the wire into the sun (1.16), accelerating
    const k = kit.clamp01((t - s.tGold) / (s.tFire - s.tGold)), zs = 4 - 118 * k * k;
    s.spark.visible = t >= s.tGold && t < s.tFire;
    if (s.spark.visible) s.line.wireAt(1, 0, zs, s.spark.position);
    // insulators of the right row turn gold behind the spark; the left row stays glass
    const ins = s.line.ins, n = s.line.n, sparkZ = t < s.tGold ? 1e9 : zs;
    for (let i = 0; i < n; i++) for (let row = 0; row < 2; row++) {
      const z = s.line.z0 - i * s.line.spacing, on = row === 1 && i < 4 && z > sparkZ; // only the near poles glow (far ones would be specks)
      for (let j = 0; j < 8; j++) ins.setColorAt((i * 2 + row) * 8 + j, on ? s.insOn : s.insOff);
    }
    ins.instanceColor.needsUpdate = true;
    // the card: rises 3.40 (1.2 s), halo flash on "angel", turns on "lie", falls flat 7.46-7.9
    const rise = kit.ease.inOut(kit.clamp01((t - s.tSmile) / 1.3));
    s.pivot.visible = t >= s.tSmile - 0.05;
    s.pivot.position.y = CARD_Y - (s.card.H * CARD_S) / 2 - (1 - rise) * (s.card.H * CARD_S + 1.5);
    s.card.group.rotation.y = Math.PI * kit.ease.inOut(kit.clamp01((t - s.tLie) / 0.5));
    s.pivot.rotation.x = -Math.PI / 2 * kit.ease.in(kit.clamp01((t - 7.46) / 0.42));
    const hf = t >= s.tAngel ? Math.exp(-(t - s.tAngel) * 3.5) : 0;
    s.card.haloMat.uniforms.uBright.value = 1 + 1.6 * hf;
    s.card.halo.scale.setScalar(1 + 0.18 * hf);
    const red = t >= s.tSpy;
    s.card.glassMat.uniforms.uColor.value.set(red ? PAL.red : PAL.white);
    s.card.glasses.scale.setScalar(red ? 1 + 0.3 * Math.exp(-(t - s.tSpy) * 5) : 1);
    s.card.smile.visible = true;
    if (kit.isOwner) {
      // sunset: the sun at the vanishing point; on "fire" the sunburst sweeps on wedge by wedge
      const burst = sm(s.tFire, s.tFire + 0.45, t);
      kit.setSky({
        ...(t < s.tFire ? { zen: PAL.carmineDeep } : {}), // sunset glow before the burst: the line reads as a silhouette, not as loose specks
        focal: SUN, sunR: 0.085 * (1 + 0.25 * Math.exp(-Math.max(0, t - s.tFire) * 4) * (t >= s.tFire ? 1 : 0)), sunCol: PAL.amber, sunRing: PAL.gold,
        rays: 0, rayR: 0.25 + 1.25 * burst, rot: t * 0.03, rings: 0, amt: 1 - 0.9 * sm(7.4, 7.72, t),
      });
      const R = kit.sky.uRays.value;
      for (let i = 0; i < 16; i++) {
        const on = s.tFire + (i % 2 ? 0.12 + (i >> 1) * 0.06 : (i >> 1) * 0.03) + (i >= 8 ? (s.tSky - s.tFire) * 0.35 : 0);
        R[i] = sm(on, on + 0.12, t) * (1 - 0.35 * sm(s.tSmile, s.tSmile + 1.0, t));
      }
    }
  },
  events() { return [{ t: 1.16, sfx: 'whoosh', gain: 0.35 }, { t: 6.02, sfx: 'shutter', gain: 0.4 }, { t: 7.5, sfx: 'drop', gain: 0.4 }]; },
};
