// S13 The switchboard canyon (104.33-112.04, hot). Clean rework 07.11.
// SHOT CARD
//   hero: ONE giant rotary dial (carmine wheel, 10 black finger holes, gold ring) closing the canyon
//         ahead. Its hub shows the count: 3, 2, 1, 0 (the wheel winds on each number).
//   supports: two plain carmine canyon walls with 3 big gold lamps each (they go out with the count,
//             the whole canyon goes dark after "why", the lamps relight in a wave on "on the wire");
//             on "Gold" ONE chunky gold cord drops from the sky into the dial's hub (one spark accent).
//   palette: black (floor, end wall, sky) + carmine (walls, wheel) + gold accent.
//   motion: slow glide 1.2 m/s toward the dial; one thing moves at a time (wheel, lamps, cord).
//   lyric: one block at a time, straight ahead below the dial over the black floor; "why" redacted.
//   out: FADE-TO-BLACK 111.48-112.04 (S14 starts black).
//   removed: shader jack grid (2 x 32 x 25 jacks with rings and lamps), 150 patch cords,
//            40 operators, 10 dial numerals, wall-mounted text at grazing angles, 76 sparks, the
//            socket beside the player, the stars.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, box, disc, fitText, sm, easeIn, easeOut, env } from './scenes-3-util.js';

const T0 = 104.33, T_COUNT = 104.34, T_TWO = 105.28, T_ONE = 105.58, T_ZERO = 105.76, T_WHY = 108.1, T_DARK = 108.7, T_DROP = 109.7, T_GOLD = 109.98, T_ON = 110.12, T_WIRE = 110.64, T_TONIGHT = 111.16, T_DIE = 111.48, T_END = 112.04;
const GY = -3, WX = 9.5, DIAL = new THREE.Vector3(0, 8.6, -34);
const DIG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const angOf = (n) => THREE.MathUtils.degToRad(n === 0 ? 300 : 30 + (n - 1) * 30);
const STOP = THREE.MathUtils.degToRad(-40);
const PULLS = [{ t: T_COUNT, n: 3, w: 0.4, ret: 7 }, { t: T_TWO, n: 2, w: 0.2, ret: 9 }, { t: T_ONE, n: 1, w: 0.14, ret: 10 }, { t: T_ZERO, n: 0, w: 0.7, ret: THREE.MathUtils.degToRad(120) }];
PULLS.forEach((p) => { p.A = angOf(p.n) - STOP; });
const pullVal = (p, s0, t) => { const k = (t - p.t) / p.w; return k < 1 ? s0 + (p.A - s0) * easeOut(k) : Math.max(0, p.A - p.ret * (t - p.t - p.w)); };
function dialRot(t) {
  let cur = null, s0 = 0;
  for (const p of PULLS) { if (t < p.t) break; if (cur) s0 = pullVal(cur, cur.s0, p.t); cur = p; cur.s0 = s0; }
  return cur ? pullVal(cur, cur.s0, t) : 0;
}
const LAMPZ = [-16, -23, -30];

export const S13 = {
  id: 'S13', t0: T0, t1: T_END, world: 'hot', pre: 0, post: 0,
  key: [0.55, 0.6, -0.58], fog: { color: PAL.black, near: 30, far: 120 }, sky: 'black',
  build(kit) {
    const s = {};
    s.prof = kit.travel([[T0, 1.2, 1.0]]);
    s.root = new THREE.Group(); kit.group.add(s.root);
    // --- canyon: two plain carmine walls, black floor and end wall
    s.wallMat = kit.flat({ color: PAL.carmine, side: THREE.DoubleSide });
    s.wallMat2 = kit.flat({ color: PAL.carmineDeep, side: THREE.DoubleSide });
    const wg = new THREE.PlaneGeometry(72, 30).rotateY(Math.PI / 2);
    const wl = new THREE.Mesh(wg, s.wallMat); wl.position.set(-WX, GY + 15, -10);
    const wr = new THREE.Mesh(wg, s.wallMat2); wr.position.set(WX, GY + 15, -10);
    const blackM = kit.flat({ color: PAL.black, side: THREE.DoubleSide });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, 72).rotateX(-Math.PI / 2), blackM); fl.position.set(0, GY, -10);
    const end = new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, 30), blackM); end.position.set(0, GY + 15, -45);
    s.root.add(wl, wr, fl, end);
    // --- 3 big lamps per wall
    s.lamps = inst(new THREE.CircleGeometry(1.25, 20), kit.flat({ color: PAL.white, side: THREE.DoubleSide }), 6, 's13-lamps');
    instColors(s.lamps, PAL.gold);
    for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1; setI(s.lamps, i, sd * (WX - 0.04), 3.2, LAMPZ[i >> 1], 0, -sd * Math.PI / 2, 0); }
    s.root.add(s.lamps);
    // --- the rotary dial: gold ring + finger stop, carmine wheel with 10 holes, hub with the count
    s.dial = new THREE.Group(); s.dial.position.copy(DIAL); s.root.add(s.dial);
    s.ringMat = kit.toon({ ramp: 'gold', rim: PAL.cream, key: [0.3, 0.6, 0.75] });
    s.dial.add(new THREE.Mesh(merge([{ g: new THREE.TorusGeometry(8.6, 0.46, 5, 48) }, { g: box(1.0, 2.9, 0.7, Math.cos(STOP) * 6.2, Math.sin(STOP) * 6.2, 0.8, 0, 0, STOP) }]), s.ringMat));
    s.wheel = new THREE.Group(); s.wheel.position.z = 0.2; s.dial.add(s.wheel);
    s.wheelMat = kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: PAL.gold, key: [0.25, 0.45, 0.86] });
    s.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(7.9, 7.9, 0.4, 44).rotateX(Math.PI / 2), s.wheelMat));
    s.holeMat = kit.flat({ color: PAL.black });
    s.wheel.add(new THREE.Mesh(merge(DIG.map((n) => ({ g: disc(1.4, 16, Math.cos(angOf(n)) * 5.55, Math.sin(angOf(n)) * 5.55, 0.22) }))), s.holeMat));
    s.hubMat = kit.flat({ color: PAL.white, vertexColors: true });
    s.dial.add(new THREE.Mesh(merge([{ g: disc(2.8, 28, 0, 0, 0.45), c: PAL.velvet }, { g: new THREE.RingGeometry(2.8, 3.3, 28).translate(0, 0, 0.46), c: PAL.brass }]), s.hubMat));
    s.count = [['3', T_COUNT, T_TWO], ['2', T_TWO, T_ONE], ['1', T_ONE, T_ZERO], ['0', T_ZERO, T_DIE]].map(([str, a, b]) => {
      const T = kit.text(str, { cap: 3.0, color: str === '0' ? 'gold' : 'cream', times: [a], out: b, outDur: 0.04, pop: true, dur: 0.08, parent: s.dial });
      T.mesh.position.set(0, 0, 0.5);
      return T;
    });
    // --- the gold cord drops from the sky into the hub on "Gold"
    s.cordMat = kit.flat({ color: PAL.gold });
    s.cord = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5).translate(0, 0.5, 0), s.cordMat);
    s.cord.position.set(0, DIAL.y, DIAL.z + 0.9);
    s.root.add(s.cord);
    s.spark = kit.particles({ n: 14, shape: 'stroke', seed: 9, init: (i, r) => { const a = (i / 14) * Math.PI * 2 + r() * 0.3; return { p: [0, DIAL.y, DIAL.z + 1.0], v: [Math.cos(a) * 5, Math.sin(a) * 5, 0.5], g: [0, -6, 0], t0: T_GOLD, life: 0.4, s: 0.5, c: PAL.goldHi }; } });
    s.root.add(s.spark);
    // --- type: one block at a time, below the dial
    const at0 = { d: 8, az: 0, y: -0.3 };
    s.texts = [
      kit.text('COUNT DOWN\nTO ZERO,', { cap: 1.0, color: 'gold', near: T_COUNT, say: 'count down to zero', outDur: 0.15, out: 106.8, at: at0 }),
      kit.text("DON'T ASK\nME WHY", { cap: 1.0, color: 'cream', near: 106.98, say: "don't ask me why", outDur: 0.15, out: 108.65, at: at0 }),
      kit.text('GOLD ON\nTHE WIRE', { cap: 1.0, color: 'gold', near: T_GOLD, say: 'gold on the wire', outDur: 0.15, out: 110.98, at: at0 }),
      kit.text('TONIGHT', { cap: 1.25, color: 'cream', near: T_TONIGHT, say: 'tonight', pop: true, dur: 0.18, outDur: 0.15, out: 111.95, at: at0 }),
    ];
    for (const T of s.texts) fitText(T, 6);
    s.texts[1].redact(3, T_WHY);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t) - s.prof.d(T0);
    s.root.position.z = d;
    // walls: dark after "why", relight on "on the wire"
    const wallK = t < T_DARK ? 1 : 0.12 + 0.88 * sm(T_ON, T_WIRE, t);
    s.wallMat.uniforms.uBright.value = wallK; s.wallMat2.uniforms.uBright.value = wallK;
    // lamps: 3 per wall, a pair goes out on each number (far first), relight near to far on "on the wire"
    const lit = t < T_TWO ? 3 : t < T_ONE ? 2 : t < T_ZERO ? 1 : 0;
    for (let i = 0; i < 6; i++) {
      const k = i >> 1;
      const on = t < T_ZERO ? k < lit : t >= T_ON + k * 0.16;
      setC(s.lamps, i, on ? PAL.gold : 0x240508, on ? 1 + 0.6 * env(t, T_ON + k * 0.16, 5) : 1);
    }
    s.lamps.instanceColor.needsUpdate = true;
    // dial
    s.wheel.rotation.z = -dialRot(t);
    s.wheelMat.uniforms.uBright.value = t < T_DARK ? 1 : 0.35 + 0.65 * sm(T_ON, T_WIRE, t);
    s.holeMat.uniforms.uColor.value.set(t >= T_TONIGHT ? PAL.cream : PAL.black);
    s.holeMat.uniforms.uBright.value = t >= T_TONIGHT ? 1 + 0.6 * env(t, T_TONIGHT, 4) : 1;
    s.ringMat.uniforms.uBright.value = 1 + 0.5 * env(t, T_ZERO, 4) + 0.6 * env(t, T_WIRE, 4);
    // the cord: drops from 40 m to the hub, plugs in on "Gold", flares on "on the wire"
    const drop = easeIn((t - T_DROP) / (T_GOLD - T_DROP));
    s.cord.visible = t >= T_DROP;
    s.cord.position.y = DIAL.y + 40 * (1 - drop);
    s.cord.scale.y = 40;
    s.cordMat.uniforms.uBright.value = 1 + 0.8 * env(t, T_ON, 3) + 0.6 * env(t, T_WIRE, 3);
    kit.fade(1 - sm(T_DIE, T_END - 0.02, t));
    if (kit.isOwner) {
      kit.rigState.wire.on = 0; kit.rigState.wire.pulses = [];
      kit.setSky({ stars: 0 });
    }
  },
  events() {
    return [
      { t: T_COUNT, sfx: 'key', gain: 0.5 },
      { t: T_ZERO, sfx: 'key', gain: 0.6 },
      { t: T_WHY, sfx: 'slot', gain: 0.55, haptic: [0.3, 40] },
      { t: T_GOLD, sfx: 'slot', gain: 0.7, haptic: [0.5, 60] },
      { t: T_TONIGHT, sfx: 'switch', gain: 0.45 },
    ];
  },
};
