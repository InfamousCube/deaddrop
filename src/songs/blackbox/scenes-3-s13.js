// S13 The switchboard canyon (104.33-112.04, hot). Two 40 m switchboard walls 9 m apart (one
// shader plane each: jacks with gold rings, a lamp above each), a ceiling of 150 patch cords,
// 40 operators, and a carmine rotary dial as the rose window at the canyon's end. Count down to
// zero: the dial winds 3-2-1-0 while the lamps go out band by band; "don't ask me why": the
// operators turn away and the cords are ripped out; "gold on the wire tonight": one gold cord is
// plugged in beside the player and the lamps relight in a wave. Out: FADE-TO-BLACK 111.48-112.04.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, box, disc, ball, sm, clamp01, easeIn, easeOut, easeInOut, env, FOG_U, FOG_APPLY, fogUniforms, WORLD_V, TMP } from './scenes-3-util.js';

const T0 = 104.33, T_COUNT = 104.34, T_ZERO = 105.76, T_DONT = 106.98, T_ASK = 107.38, T_WHY = 108.1, T_DARK = 108.7, T_GOLD = 109.98, T_ON = 110.12, T_WIRE = 110.64, T_TONIGHT = 111.16, T_DIE = 111.48, T_END = 112.04;
const GY = -3, WH = 40, WALL_Z0 = 30, WALL_Z1 = -40, DIAL = new THREE.Vector3(0, 12.5, -50), SOCK = new THREE.Vector3(2, 1.6, -0.25), PIV = new THREE.Vector3(2, 31.6, -0.25);
const DIG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const angOf = (n) => THREE.MathUtils.degToRad(n === 0 ? 300 : 30 + (n - 1) * 30);
const STOP = THREE.MathUtils.degToRad(-40);
const PULLS = [{ t: T_COUNT, n: 3, w: 0.4, ret: 7 }, { t: 105.28, n: 2, w: 0.2, ret: 9 }, { t: 105.58, n: 1, w: 0.14, ret: 10 }, { t: T_ZERO, n: 0, w: 0.7, ret: THREE.MathUtils.degToRad(120) }];
PULLS.forEach((p) => { p.A = angOf(p.n) - STOP; });
const pullVal = (p, s0, t) => { const k = (t - p.t) / p.w; return k < 1 ? s0 + (p.A - s0) * easeOut(k) : Math.max(0, p.A - p.ret * (t - p.t - p.w)); };
function dialRot(t) {
  let cur = null, s0 = 0;
  for (const p of PULLS) { if (t < p.t) break; if (cur) s0 = pullVal(cur, cur.s0, p.t); cur = p; cur.s0 = s0; }
  return cur ? pullVal(cur, cur.s0, t) : 0;
}

const WALL_F = /* glsl */ `
uniform float uZs, uBands, uDark, uWave, uWaveOn, uDieZ; uniform vec3 uPanel, uSeam, uLampOn, uLampOff, uRing; ${FOG_U}
varying vec3 vW; varying float vDepth;
void main() {
  float u = uZs - vW.z, v = vW.y - ${GY.toFixed(1)};
  vec2 cs = vec2(1.25, 1.6);
  vec2 cell = floor(vec2(u, v) / cs);
  vec2 f = vec2(u, v) - cell * cs;
  float zc = uZs - (cell.x + 0.5) * cs.x;
  float fromTop = 9.0 - floor(v / 4.0);
  float lit = mix(step(uBands - 0.5, fromTop), uWaveOn * step(-uWave, zc), uDark) * step(uDieZ, zc);
  vec3 panel = uPanel * (1.0 - uDark);
  vec3 c = panel;
  c = mix(c, uSeam * (1.0 - uDark), max(step(f.x, 0.07), step(f.y, 0.07)));
  float rj = length(f - vec2(0.625, 0.62));
  c = mix(c, uRing * (0.75 + 0.25 * step(0.5, lit)) * step(uDieZ, zc), step(rj, 0.28) * step(0.2, rj));
  c = mix(c, vec3(0.0), step(rj, 0.2));
  float rl = length(f - vec2(0.625, 1.24));
  vec3 lamp = mix(uLampOff * (1.0 - uDark), uLampOn, lit);
  c = mix(c, lamp, step(rl, 0.17));
  float px = max(fwidth(u), fwidth(v));
  vec3 avg = panel * 0.8 + uRing * 0.12 * step(uDieZ, zc) + lamp * 0.06;
  c = mix(c, avg, smoothstep(0.05, 0.16, px));
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

function operatorGeo() {
  return merge([
    { g: box(0.5, 0.75, 0.32, 0, 0.82, 0) }, { g: box(0.5, 0.18, 0.6, 0, 0.38, 0.15) }, { g: box(0.36, 0.42, 0.2, 0, 0.18, 0.4) },
    { g: ball(0.15, 7, 5, 0, 1.38, 0.02) }, { g: box(0.38, 0.24, 0.34, 0, 1.42, -0.03) },
    { g: new THREE.TorusGeometry(0.19, 0.025, 3, 10, Math.PI).translate(0, 1.4, 0.02) }, { g: box(0.03, 0.03, 0.22, 0.14, 1.3, 0.14) },
    { g: box(0.7, 0.06, 0.5, 0, 0.62, 0.62) },
  ]);
}

export const S13 = {
  id: 'S13', t0: T0, t1: T_END, world: 'hot', pre: 0.6, post: 0,
  key: [0.55, 0.6, -0.58], fog: { color: PAL.black, near: 30, far: 180 }, sky: 'black',
  build(kit) {
    const s = { v: new THREE.Vector3(), q: new THREE.Quaternion(), zAx: new THREE.Vector3(0, 0, 1) };
    const R = kit.rnd(1313);
    s.prof = kit.travel([[103.7, 4, 0.01], [T0, 6, 0.8], [T_ZERO, 2, 1.2], [T_GOLD, 8, 1.0], [110.9, 2, 1.1]]);
    s.d0 = s.prof.d(T0);
    s.root = new THREE.Group(); kit.group.add(s.root);
    // --- the two switchboard walls (one plane each, shader-drawn jacks and lamps)
    const C = (h) => new THREE.Color(h);
    const L = WALL_Z0 - WALL_Z1;
    s.walls = [];
    for (const sd of [-1, 1]) {
      const u = { ...fogUniforms(kit), uZs: { value: 0 }, uBands: { value: 0 }, uDark: { value: 0 }, uWave: { value: 0 }, uWaveOn: { value: 0 }, uDieZ: { value: -1e4 },
        uPanel: { value: C(sd < 0 ? PAL.carmine : 0x2c0609) }, uSeam: { value: C(sd < 0 ? PAL.carmineDeep : PAL.velvet) }, uLampOn: { value: C(PAL.gold) }, uLampOff: { value: C(0x3a0a0e) }, uRing: { value: C(PAL.gold) } };
      const m = new THREE.Mesh(new THREE.PlaneGeometry(L, WH), new THREE.ShaderMaterial({ uniforms: u, vertexShader: WORLD_V, fragmentShader: WALL_F }));
      m.rotation.y = -sd * Math.PI / 2;
      m.position.set(sd * 4.5, GY + WH / 2, (WALL_Z0 + WALL_Z1) / 2);
      m.frustumCulled = false;
      s.root.add(m); s.walls.push(u);
    }
    // floor, end wall
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 120).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    fl.position.set(0, GY, -15);
    const end = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), kit.flat({ color: PAL.black }));
    end.position.set(0, 20, DIAL.z - 1.2);
    s.root.add(fl, end);
    // --- patch cords: 150 catenaries across the canyon (hinged at one wall jack), crimson / black
    const pts = []; for (let i = 0; i <= 12; i++) { const x = i / 12 * 9; pts.push(new THREE.Vector3(x, -1.5 * (1 - Math.pow((x - 4.5) / 4.5, 2)), 0)); }
    const cg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.11, 4, false);
    s.cords = inst(cg, kit.toon({ ramp: 'hot', rim: PAL.gold, rimTh: 0.55 }), 150, 's13-cords');
    instColors(s.cords);
    s.cd = [];
    const zAsk = s.prof.d(T_ASK) - s.d0;
    for (let i = 0; i < 150; i++) {
      const low = i < 22;
      const z = WALL_Z0 - 2 - R() * (L - 4), y = low ? 12 + R() * 12 : 26 + R() * 12;
      const side = R() < 0.5 ? -1 : 1, yaw = (R() - 0.5) * 0.5, sag = 0.5 + R() * 1.6;
      const zw = z + zAsk;
      const fall = !low && zw > -36 && zw < 12;
      s.cd.push({ z, y, side, yaw, sag, fall, ta: T_ASK + R() * 0.55, tu: T_TONIGHT + R() * 0.35 });
      setC(s.cords, i, R() < 0.55 ? 0xffffff : 0x161012);
    }
    // the last cord to snap (the nearest falling one) gets the spark on "why"
    let best = -1, bd = 1e9;
    s.cd.forEach((c, i) => { if (c.fall) { const dd = Math.abs(c.z + (s.prof.d(T_WHY) - s.d0) + 7); if (dd < bd) { bd = dd; best = i; } } });
    if (best >= 0) { s.cd[best].ta = T_WHY - 0.12; s.last = s.cd[best]; }
    s.root.add(s.cords);
    // --- 2 x 20 operators at the base of the walls (headsets), they turn their backs on "don't"
    s.ops = inst(operatorGeo(), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5, vertexColors: true }), 40, 's13-ops');
    s.opD = [];
    const zDont = s.prof.d(T_DONT) - s.d0;
    for (let i = 0; i < 40; i++) { const sd = i % 2 ? 1 : -1, z = 10 - (i >> 1) * 2.5; s.opD.push({ sd, z, tt: T_DONT + Math.abs(z + zDont) / 28 }); }
    s.root.add(s.ops);
    // --- the rotary dial (rose window): plate, ring, carmine wheel with 10 holes, gold stop, hub
    s.dial = new THREE.Group(); s.dial.position.copy(DIAL); s.root.add(s.dial);
    s.dial.add(new THREE.Mesh(new THREE.CircleGeometry(9.6, 40), kit.flat({ color: PAL.velvet })));
    s.dial.add(new THREE.Mesh(merge([{ g: new THREE.TorusGeometry(9.5, 0.28, 4, 48) }, { g: box(0.7, 2.2, 0.5, Math.cos(STOP) * 7.0, Math.sin(STOP) * 7.0, 0.7, 0, 0, STOP) }]), kit.toon({ ramp: 'gold', rim: PAL.cream, vertexColors: true, key: [0.3, 0.6, 0.75] })));
    s.wheel = new THREE.Group(); s.wheel.position.z = 0.25; s.dial.add(s.wheel);
    s.wheel.add(new THREE.Mesh(merge([{ g: new THREE.CylinderGeometry(7.4, 7.4, 0.4, 40).rotateX(Math.PI / 2) }]), kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: PAL.gold, vertexColors: true, key: [0.25, 0.45, 0.86] })));
    s.holeMat = kit.flat({ color: PAL.black });
    s.wheel.add(new THREE.Mesh(merge(DIG.map((n) => ({ g: disc(1.0, 14, Math.cos(angOf(n)) * 5.6, Math.sin(angOf(n)) * 5.6, 0.22) }))), s.holeMat));
    s.hubMat = kit.flat({ color: PAL.brass });
    const hub = new THREE.Mesh(merge([{ g: disc(2.5, 24, 0, 0, 0.3), c: 0.02 }, { g: new THREE.RingGeometry(2.5, 2.85, 24).translate(0, 0, 0.31) }]), s.hubMat);
    hub.material.vertexColors = true;
    s.wheel.add(hub);
    s.nums = DIG.map((n) => { const T = kit.text(String(n), { cap: 1.3, color: 'cream', parent: s.dial }); T.mesh.position.set(Math.cos(angOf(n)) * 8.35, Math.sin(angOf(n)) * 8.35, 0.1); return T; });
    s.nums[9].hideWord(0, T_ZERO);
    s.zeroGold = kit.text('0', { cap: 1.6, color: 'gold', times: [T_ZERO], pop: true, parent: s.dial });
    s.zeroGold.mesh.position.set(Math.cos(angOf(0)) * 8.35, Math.sin(angOf(0)) * 8.35, 0.15);
    // --- the gold cord (player space): pivot 30 m above, swings in, plugs in beside the player
    s.socket = new THREE.Mesh(merge([{ g: box(0.36, 0.46, 0.1, SOCK.x, SOCK.y, SOCK.z), c: 0.03 }, { g: new THREE.RingGeometry(0.07, 0.12, 12).rotateY(Math.PI).translate(SOCK.x, SOCK.y, SOCK.z - 0.056), c: PAL.gold }, { g: box(0.05, 0.05, 1.25, 1.35, 1.25, -0.12, 0, Math.PI / 2 - 0.35, 0.4), c: 0.03 }]), kit.flat({ color: PAL.white, vertexColors: true }));
    kit.group.add(s.socket);
    s.gcord = inst(new THREE.BoxGeometry(0.22, 0.22, 1), kit.flat({ color: PAL.white }), 24, 's13-goldcord');
    instColors(s.gcord, PAL.brass);
    s.plug = new THREE.Mesh(merge([{ g: box(0.12, 0.12, 0.4, 0, 0, -0.2), c: PAL.gold }, { g: box(0.04, 0.04, 0.12, 0, 0, 0.06), c: PAL.goldHi }]), kit.flat({ color: PAL.white, vertexColors: true }));
    kit.group.add(s.gcord, s.plug);
    // sparks: the last cord snapping (root space) and the plug (player space)
    const lastP = s.last ? [s.last.side * 4.4, s.last.y, s.last.z] : [4.4, 30, -10];
    s.spark1 = kit.particles({ n: 40, shape: 'stroke', size: 0.5, seed: 5, init: (i, r) => { const a = r() * 6.28, b = (r() - 0.5) * 3; return { p: lastP, v: [-s.last?.side * 2 * r() || 0, Math.sin(b) * 6, Math.cos(a) * 6], g: [0, -9, 0], t0: T_WHY, life: 0.7 + r() * 0.4, s: 0.25 + r() * 0.35, c: r() < 0.6 ? PAL.gold : PAL.goldHi }; } });
    s.root.add(s.spark1);
    s.spark2 = kit.particles({ n: 36, shape: 'stroke', size: 0.15, seed: 9, init: (i, r) => { const a = r() * 6.28, b = r() * 1.5; return { p: [SOCK.x, SOCK.y, SOCK.z - 0.1], v: [Math.cos(a) * 2.2 * b, Math.sin(a) * 2.2 * b, -0.6 - r()], g: [0, -5, 0], t0: T_GOLD, life: 0.35 + r() * 0.25, s: 0.06 + r() * 0.1, c: r() < 0.6 ? PAL.gold : PAL.white }; } });
    kit.group.add(s.spark2);
    // --- type
    s.tCount = kit.text('COUNT DOWN TO ZERO', { cap: 1.6, color: 'gold', align: 'left', near: T_COUNT, say: 'count down to zero', out: 108.6 });
    s.tCount.mesh.rotation.y = Math.PI / 2;
    s.root.add(s.tCount.mesh);
    s.tCount.mesh.position.set(-4.46, 1.9, -7.5);
    s.tWhy = kit.text("DON'T ASK ME WHY", { cap: 1.35, color: 'cream', align: 'left', near: T_DONT, say: "don't ask me why", out: 109.9 });
    s.tWhy.mesh.rotation.y = -Math.PI / 2;
    s.root.add(s.tWhy.mesh);
    s.tWhy.mesh.position.set(4.46, 2.1, -18 - (s.prof.d(T_DONT) - s.d0));
    s.tWhy.redact(3, T_WHY);
    s.tGold = kit.text('GOLD ON THE WIRE', { cap: 1.05, color: 'gold', near: T_GOLD, out: 110.95, at: { d: 6, az: 5, y: 3.35 } });
    s.tTonight = kit.text('TONIGHT', { cap: 0.72, color: 'cream', near: T_TONIGHT, say: 'tonight', pop: true, dur: 0.2 });
    return s;
  },
  update(t, s, kit) {
    const live = t >= 103.76;
    s.root.visible = live;
    const d = s.prof.d(t) - s.d0;
    s.root.position.z = d;
    // walls
    const bands = t < T_COUNT ? 0 : Math.min(10, 1 + Math.floor((t - T_COUNT) / ((T_ZERO - T_COUNT) / 9.5)));
    for (const u of s.walls) {
      u.uZs.value = WALL_Z0 + d;
      u.uBands.value = bands;
      u.uDark.value = t >= T_DARK ? 1 : 0;
      u.uWaveOn.value = t >= T_ON ? 1 : 0;
      u.uWave.value = (t - T_ON) / (T_WIRE - T_ON) * 80;
      u.uDieZ.value = t < T_DIE ? -1e4 : -70 + (t - T_DIE) / (T_END - 0.04 - T_DIE) * 150;
    }
    // cords: hanging, ripped out on "ask" (swing down at the wall, then dropped into the dark),
    // the rest swing up against the walls on "tonight"; the ceiling parts onto the stars
    for (let i = 0; i < 150; i++) {
      const c = s.cd[i];
      let ph = 0, drop = 0;
      if (c.fall && t >= c.ta) { const a = t - c.ta; ph = -(Math.PI / 2) * easeIn(a / 0.45); drop = 16 * Math.max(0, a - 0.3) * Math.max(0, a - 0.3); }
      else if (!c.fall && t >= c.tu) ph = (Math.PI / 2) * easeInOut((t - c.tu) / 0.6);
      const gone = drop > 45;
      setI(s.cords, i, c.side * 4.5, c.y - drop, c.z, 0, (c.side < 0 ? 0 : Math.PI) + c.yaw, ph, gone ? 0 : 1, gone ? 0 : c.sag, gone ? 0 : 1);
    }
    s.cords.instanceMatrix.needsUpdate = true;
    // operators turn their backs in a near-to-far wave
    for (let i = 0; i < 40; i++) {
      const o = s.opD[i];
      const turn = Math.PI * easeInOut((t - o.tt) / 0.3);
      setI(s.ops, i, o.sd * 3.55, GY, o.z, 0, -o.sd * Math.PI / 2 + turn, 0, 1.15);
    }
    s.ops.instanceMatrix.needsUpdate = true;
    // dial
    s.wheel.rotation.z = -dialRot(t);
    s.holeMat.uniforms.uColor.value.set(t >= T_TONIGHT ? PAL.cream : PAL.black);
    s.holeMat.uniforms.uBright.value = t >= T_TONIGHT ? 1 + env(t, T_TONIGHT, 4) : 1;
    s.hubMat.uniforms.uColor.value.set(t >= T_WIRE ? PAL.gold : PAL.brassDark);
    s.hubMat.uniforms.uBright.value = 1 + 0.8 * env(t, T_WIRE, 4);
    // the gold cord: swings in on a 30 m arc, plugs in at "Gold", lights end to end on "on the wire"
    const sw = t < 109.3 ? -1 : -0.98 * (1 - easeIn((t - 109.3) / (T_GOLD - 109.3)));
    const vis = live && t >= 109.3;
    const E = s.v.set(PIV.x, PIV.y - Math.cos(sw) * 30, PIV.z + Math.sin(sw) * 30);
    if (t >= T_GOLD) E.copy(SOCK);
    for (let k = 0; k < 24; k++) {
      const a = (k + 0.5) / 24;
      TMP.w.copy(PIV).lerp(E, a);
      s.q.setFromUnitVectors(s.zAx, TMP.p.copy(E).sub(PIV).normalize());
      TMP.m.compose(TMP.w, s.q, TMP.s.set(1, 1, vis ? 30 / 24 + 0.05 : 0)); s.gcord.setMatrixAt(k, TMP.m);
      const lit = t >= T_ON + (1 - a) * (T_WIRE - T_ON);
      setC(s.gcord, k, lit ? PAL.goldHi : PAL.gold, lit ? 1 + env(t, T_ON + (1 - a) * (T_WIRE - T_ON), 5) : 1);
    }
    s.gcord.instanceMatrix.needsUpdate = true; s.gcord.instanceColor.needsUpdate = true;
    s.plug.visible = vis; s.plug.position.copy(E); s.plug.quaternion.copy(s.q);
    s.socket.visible = live;
    // TONIGHT floats on the line of sight to the dial's hub, 8 m away
    TMP.p.set(0, DIAL.y, DIAL.z + d + 0.3).sub(TMP.w.set(0, 1.6, 0.05)).normalize();
    s.tTonight.mesh.position.set(0, 1.6, 0.05).addScaledVector(TMP.p, 8);
    s.tTonight.mesh.rotation.set(Math.asin(TMP.p.y), 0, 0, 'YXZ');
    // fade-to-black, lamps die column by column (far to near)
    kit.fade(1 - sm(T_DIE, T_END - 0.02, t));
    if (kit.isOwner) {
      kit.rigState.wheelSpin = s.prof.d(t) / 0.075;
      if (t >= T_TONIGHT) kit.setSky({ stars: 0.85 * (1 - sm(T_DIE, T_END, t)) });
      if (t >= T_DARK && t < T_ON) kit.rigState.lampOn = 0.15;
    }
  },
  events() {
    return [
      { t: T_COUNT, sfx: 'key', gain: 0.5 },
      { t: T_ZERO, sfx: 'key', gain: 0.6 },
      { t: T_ASK, sfx: 'grab', gain: 0.5 },
      { t: T_WHY, sfx: 'slot', gain: 0.6, haptic: [0.4, 50] },
      { t: T_GOLD, sfx: 'slot', gain: 0.7, haptic: [0.6, 70] },
      { t: T_TONIGHT, sfx: 'switch', gain: 0.45 },
    ];
  },
};
