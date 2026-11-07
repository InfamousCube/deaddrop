// Group 4, part C: S18 salt flat return. The leitmotif plain of S01 completed: a blazing sun on the
// wire, the split Two-Faced Mask, the title GOLD ON THE WIRE rising out of the plain, the wire snipped,
// and a clean fade into the lobby (show.js rebuilds the room 151.8-153.6; everything here is dark by 153.6).
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { D2R, EYE, boxAt, lin, lerp, envAt, clamp01, lerpCol } from './scenes-4-util.js';

const EL18 = 9 * D2R;            // same direction as S17's final rocket dot (match-cut)
const SUN0 = 0.0165, SUN1 = 0.15;
const WAVES = [144.58, 145.18];
const PULSE_T = [145.6, 147.34];
const TITLE_R = 46, CAP = 8.6, GAP = 0.8, INNER = 15.5 * D2R;
const ROWS = [
  { str: 'GOLD', y: 10.9, side: -1, order: 0 },
  { str: 'ON', y: 0.5, side: -1, order: 4 },
  { str: 'THE', y: 10.9, side: 1, order: 6 },
  { str: 'WIRE', y: 0.5, side: 1, order: 9 },
];

export const S18 = {
  id: 'S18', t0: 142.91, t1: 153.771, world: 'hot', pre: 0, post: 0,
  key: [0, 0.35, -0.94],
  fog: { color: PAL.velvet, near: 30, far: 175 },
  flashes: [{ t: 148.0, color: PAL.amber, dur: 0.03 }],
  build(kit) {
    const s = { sky: {}, foc: [0, 0, -1], c: [new THREE.Color(), new THREE.Color()], tNow: 0, pulses: [{ z: 0, a: 0, w: 2 }, { z: 0, a: 0, w: 2 }], plist: [] };
    s.prof = kit.travel([[142.91, 2, 0.01], [148.8, 0, 1.2]]);
    // the S01 plain and pole rows
    s.flat = kit.saltFlat({}); // with the bulb glow, like S01
    s.flat.group.position.z = 40; // as in S01: the pole rows continue behind the player (leitmotif match)
    kit.group.add(s.flat.group);
    s.bulb = (i, side, z) => {
      const t = s.tNow;
      const far = clamp01(-z / 170);
      const tOn = 143.46 + far * 0.57;
      if (t < tOn) return null;
      if (t < tOn + 0.14 && (Math.floor((t - tOn) * 28) & 1) === 1) return null;
      const tOff = 150.0 + (1 - far) * 1.8;
      if (t >= tOff) return null;
      for (let k = 0; k < 2; k++) { const tw = WAVES[k]; if (t >= tw && t < tw + 1.6 && Math.abs(z - (10 - (t - tw) * 150)) < 9) return PAL.gold; }
      return t >= 147.34 && t < 148.3 ? PAL.goldHi : PAL.cream;
    };

    // the split Two-Faced Mask on the horizon, 25 deg left: cream angel half, black Engineer half, one round glass
    const mask = (s.mask = new THREE.Group());
    kit.place(mask, { d: 130, az: -25, y: 0 });
    kit.group.add(mask);
    const MR = 15, MY = 17;
    const angel = new THREE.CircleGeometry(MR, 32, Math.PI / 2, Math.PI); angel.translate(0, MY, 0);
    mask.add(new THREE.Mesh(angel, kit.flat({ color: PAL.cream, fog: 0.15 })));
    const eng = new THREE.CircleGeometry(MR, 32, -Math.PI / 2, Math.PI); eng.translate(0, MY, 0);
    const bob = new THREE.PlaneGeometry(16.6, 13); bob.translate(8.3, MY - 3.5, -0.05);
    mask.add(new THREE.Mesh(mergeSimple([eng.toNonIndexed(), bob.toNonIndexed()]), kit.flat({ color: PAL.black, fog: 0 })));
    const eyeArc = new THREE.TorusGeometry(2.4, 0.32, 4, 14, Math.PI); eyeArc.rotateZ(Math.PI); eyeArc.translate(-6.2, MY + 3, 0.1);
    const smile = new THREE.TorusGeometry(5.4, 0.42, 4, 14, Math.PI / 2); smile.rotateZ(Math.PI); smile.translate(0, MY - 2.5, 0.1);
    mask.add(new THREE.Mesh(mergeSimple([eyeArc.toNonIndexed(), smile.toNonIndexed()]), kit.flat({ color: PAL.velvet, fog: 0.15 })));
    const rimT = new THREE.TorusGeometry(MR + 0.35, 0.4, 4, 64); rimT.translate(0, MY, 0.05);
    const halo = new THREE.TorusGeometry(8, 0.7, 6, 40); halo.rotateX(1.25); halo.translate(-5, MY + MR + 4.5, 0);
    const glassRing = new THREE.TorusGeometry(3.6, 0.35, 4, 28); glassRing.translate(6.6, MY + 2.6, 0.15);
    mask.add(new THREE.Mesh(mergeSimple([rimT.toNonIndexed(), halo.toNonIndexed(), glassRing.toNonIndexed()]), kit.flat({ color: PAL.gold, fog: 0.15 })));
    const glass = new THREE.CircleGeometry(3.2, 24); glass.translate(6.6, MY + 2.6, 0.12);
    s.glassMat = kit.flat({ color: PAL.white, fog: 0 });
    mask.add(new THREE.Mesh(glass, s.glassMat));

    // the title: one mesh per letter (so each rises on its own), with an orange extrusion copy behind
    s.letters = [];
    for (const r of ROWS) {
      const Ls = [...r.str].map((ch, k) => {
        const ti = 147.34 + (r.order + k) * 0.05;
        const front = kit.text(ch, { cap: CAP, color: 'gold', times: [ti], dur: 0.05, vAlign: 'baseline' });
        const back = kit.text(ch, { cap: CAP, color: PAL.orange, times: [ti], dur: 0.05, vAlign: 'baseline' });
        back.mesh.renderOrder = 5;
        return { front, back, ti, w: front.words[0].x1 - front.words[0].x0 };
      });
      const total = Ls.reduce((a, L) => a + L.w, 0) + GAP * (Ls.length - 1);
      const a0 = r.side < 0 ? -INNER - total / TITLE_R : INNER;
      let cum = 0;
      for (const L of Ls) { L.az = a0 + (cum + L.w / 2) / TITLE_R; cum += L.w + GAP; L.y0 = r.y; L.idx = s.letters.length; s.letters.push(L); }
    }
    // other type
    kit.text('TONIGHT', { cap: 1.0, color: 'cream', times: [143.16], out: 144.5, at: { d: 6, az: 16, y: 1.6 } });
    s.oh = kit.text('OH-OH', { cap: 1.5, color: 'gold', times: [144.58], pop: true, out: 146.4, at: { d: 6.5, az: -18, y: 2.1 } });
    // TONIGHT sits under the title's lower row (ON / WIRE end 1.4 deg below the eye), clear of both
    s.ton2s = kit.text('TONIGHT', { cap: 2.1, color: 'black', times: [148.0], pop: true, dur: 0.12, out: 150.1, outDur: 0.4, depthTest: false, at: { d: 24.6, az: 0.5, y: -0.82 } });
    s.ton2s.mesh.renderOrder = 5;
    s.ton2 = kit.text('TONIGHT', { cap: 2.1, color: 'cream', times: [148.0], pop: true, dur: 0.12, out: 150.1, outDur: 0.4, depthTest: false, at: { d: 24, az: 0, y: -0.6 } }); // over the black plain, never cut by it
    s.misty = kit.text('MISTYCONIFER', { cap: 0.5, color: 'cream', tracking: 0.45, times: [148.6], dur: 0.05, out: 151.2, outDur: 0.3, depthTest: false, at: { d: 10, az: 0, y: -0.4 } });
    s.mistyY = s.misty.mesh.position.y;
    s.tonY = [s.ton2.mesh.position.y, s.ton2s.mesh.position.y];

    // the snip: one white spark at the sun end of the wire
    s.spark = kit.particles({
      n: 30, shape: 'stroke', seed: 1801, init: (i, r) => {
        if (i === 0) return { p: [0, 3.4, -120], t0: 151.5, life: 0.12, s: 2.6, c: PAL.white };
        const a = r() * Math.PI * 2, b = (r() - 0.5) * Math.PI, sp = 10 + r() * 16;
        return { p: [0, 3.4, -120], v: [Math.cos(a) * Math.cos(b) * sp, Math.sin(b) * sp + 4, Math.sin(a) * Math.cos(b) * sp], g: [0, -9, 0], t0: 151.5 + r() * 0.04, life: 0.6 + r() * 0.4, s: 0.9 + r() * 0.8, c: r() < 0.6 ? PAL.white : PAL.goldHi };
      },
    });
    kit.group.add(s.spark);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.tNow = t;
    s.flat.update(t, d, s.bulb);
    // fade to black, everything dark by 153.6 (the lobby returns around the player meanwhile)
    kit.fade(1 - kit.sm(152.5, 153.5, t));
    // mask: the glass pulses on the beats; it sinks as the title rises
    s.mask.position.y = -36 * kit.ease.inOut(lin(147.0, 147.7, t));
    s.mask.visible = t < 147.75;
    s.glassMat.uniforms.uBright.value = 1 + 0.5 * kit.beatEnv(t, 7);
    // title letters rise out of the plain (0.4 s each), flare on "tonight", sink last
    const flare = envAt(t, 148.0, 4);
    for (let i = 0; i < s.letters.length; i++) {
      const L = s.letters[i];
      const k = kit.ease.out(lin(L.ti, L.ti + 0.4, t));
      const ks = kit.ease.in(lin(150.85 + i * 0.025, 151.4 + i * 0.025, t)); // all gone by ~151.7, before the lobby rebuild (151.8)
      const drop = (L.y0 + CAP + 1.5) * ((1 - k) + ks);
      const y = L.y0 - drop;
      const sa = Math.sin(L.az), ca = Math.cos(L.az);
      L.front.mesh.position.set(sa * TITLE_R, y, -ca * TITLE_R);
      L.front.mesh.rotation.set(0, -L.az, 0);
      const rb = TITLE_R + 0.7, ab = L.az + 0.4 / TITLE_R;
      L.back.mesh.position.set(Math.sin(ab) * rb, y - 0.55, -Math.cos(ab) * rb);
      L.back.mesh.rotation.set(0, -ab, 0);
      L.front.u.uBright.value = 1 + 0.8 * flare;
      if (ks >= 1) { L.front.mesh.visible = false; L.back.mesh.visible = false; }
    }
    s.oh.mesh.scale.setScalar(1 + 0.22 * Math.max(envAt(t, 144.58, 7), envAt(t, 145.18, 7)));
    // TONIGHT and MISTYCONIFER sink with the title
    const sinkT = kit.ease.in(lin(150.9, 151.45, t));
    s.ton2.mesh.position.y = s.tonY[0] - 4.5 * sinkT;
    s.ton2s.mesh.position.y = s.tonY[1] - 4.5 * sinkT;
    s.ton2.u.uBright.value = 1 + 0.5 * flare;
    s.misty.mesh.position.y = s.mistyY - 1.5 * (1 - kit.ease.out(lin(148.6, 149.2, t))) - 2 * sinkT;

    if (kit.isOwner) {
      // the sky: dot -> full sun on "tonight", rays hold on the last beat, then go out from the edges inward
      const hold = Math.min(t, 149.17);
      let sunR = t < 143.16 ? SUN0 : lerp(SUN0, SUN1, kit.ease.out(lin(143.16, 143.66, t)));
      sunR *= 1 + 0.035 * kit.downEnv(t, 5);
      const fl = t >= 148.0 && t < 148.06;
      if (fl) sunR *= 1.4;
      const shrink = kit.ease.inOut(lin(150.0, 152.2, t));
      sunR = lerp(sunR, 0.0045, shrink);
      const el = lerp(EL18, Math.atan2(1.8, 120), shrink);
      s.foc[0] = 0; s.foc[1] = Math.sin(el); s.foc[2] = -Math.cos(el);
      const sk = s.sky;
      sk.focal = s.foc; sk.rot = hold * 0.035; sk.ringPhase = hold * 0.12;
      sk.sunR = t < 152.4 ? sunR : sunR * (1 - lin(152.4, 152.9, t));
      sk.sunCol = fl ? PAL.white : PAL.amber; sk.sunRing = PAL.orange;
      const rp = Math.max(envAt(t, 146.31, 6), envAt(t, 146.9, 6), 0.7 * envAt(t, 148.0, 3));
      sk.rayA = lerpCol(s.c[0], PAL.crimson, PAL.red, rp);
      sk.rayR = 1.45 * (1 - kit.sm(150.0, 152.5, t)) + 0.0001;
      sk.rays = 1;
      sk.rings = 1 - kit.sm(150.0, 151.4, t);
      sk.amt = 1 - kit.sm(152.6, 153.5, t);
      kit.setSky(sk);
      // the wire: sparks run INTO the sun on "gold" and on the title, then it is snipped at 151.5
      const rs = kit.rigState;
      const snipped = t >= 151.5;
      rs.wire.on = snipped ? 0 : 1;
      const list = s.plist;
      list.length = 0;
      for (let k = 0; k < 2; k++) {
        const a = t - PULSE_T[k];
        if (!snipped && a >= 0 && a < 2.2) { const P = s.pulses[k]; P.z = -a * 135; P.a = 1; P.w = 2; list.push(P); }
      }
      rs.wire.pulses = list;
      rs.wheelSpin = d / 0.075;
    }
  },
  events() {
    return [
      { t: 143.46, sfx: 'switch', gain: 0.5 },
      { t: 145.6, sfx: 'ping', gain: 0.45 },
      { t: 147.34, sfx: 'whoosh', gain: 0.6, haptic: [0.4, 80] },
      { t: 148.0, sfx: 'crack', gain: 0.55, haptic: [0.6, 120] },
      { t: 151.5, sfx: 'shutter', gain: 0.55, haptic: [0.3, 40] },
    ];
  },
};
