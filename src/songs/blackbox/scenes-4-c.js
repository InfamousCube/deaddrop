// Group 4, part C (round 3, STORYBOARD-v3): S18 Home on the wire.
// SHOT: back on S01's telegraph line at sunset: two rows of 9 m wooden poles (8-sided tapered lathe,
// bevelled crossarm with braces and step bolts, four glass insulators, four sagging wires) run toward
// the amber sun that S17's rocket dot became; the inner wire of each row is gold. Supports: the red
// sunburst sky, the black desert. Motion: you glide toward the sun (2 m/s, stopping by 150 s); the
// insulators light in two waves on "oh-oh"; the title GOLD / ON / THE / WIRE rises out of the desert
// word by word exactly on L37's sung words, framing the sun; sparks run along the gold wires into the
// sun on "gold" and "wire"; TONIGHT under the title on 148.00, the sun flares; then the rays go out
// from the edges, the wire is snipped (151.5) and everything fades (show.js brings the lobby back).
// Lyric: TONIGHT right of centre, OH-OH left, then the title is the block; TONIGHT low under it.
import * as THREE from 'three';
import { PAL } from './style.js';
import { D2R, inst, setM, initColors, setC, mixC, lin, lerp, envAt, clamp01, lerpCol, sung } from './scenes-4-util.js';
import { poleGeo, insulatorGeo, catenary, POLE } from './shapes-4.js';

const EL18 = 9 * D2R;            // same direction as S17's final rocket dot (match cut)
const SUN0 = 0.0165, SUN1 = 0.12;
const ROWX = 4.6, SPAN = 10, NP = 21, Z0 = 30;  // pole rows at x +-4.6, a pole every 10 m from z +30
const SAG = 0.38, WIRE_Y = POLE.armY + 0.25;
const TITLE_R = 46, CAP = 5.4, WGAP = 2.2, INNER = 10.5 * D2R;
const TITLE_Y = 1.6 + TITLE_R * Math.tan(EL18) - CAP / 2; // baseline: letters centred on the sun's height

const wireY = (zl) => { const u = ((((Z0 - zl) % SPAN) + SPAN) % SPAN) / SPAN; return WIRE_Y - 4 * SAG * u * (1 - u); };

export const S18 = {
  id: 'S18', t0: 142.91, t1: 153.771, world: 'hot', pre: 0, post: 0,
  key: [0.2, 0.35, -0.92],
  fog: { color: PAL.velvet, near: 30, far: 175 },
  flashes: [{ t: 148.0, color: PAL.amber, dur: 0.03 }],
  build(kit) {
    const s = { sky: {}, foc: [0, 0, -1], c: [new THREE.Color()] };
    s.ton1 = sung(kit, 'tonight', 143.16)[0];
    s.L37 = sung(kit, 'oh-oh gold on the wire', 144.58);
    s.ton2t = sung(kit, 'tonight', 148.0)[0];
    // L38's squeezed duplicate ("gold on the wire" 147.34-147.52): if words.json still has it, the title
    // words pulse once each on it instead of being shown twice
    const dup = sung(kit, 'gold on the wire tonight', 147.34);
    s.dup = Math.abs(dup[0] - 147.34) < 0.3 ? dup.slice(0, 4) : [];
    s.waves = [s.L37[0], s.L37[0] + 0.6];
    s.pulseT = [s.L37[1], s.L37[4]];
    s.prof = kit.travel([[142.91, 2, 0.01], [148.8, 0, 1.2]]);
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    W.add(new THREE.Mesh(new THREE.PlaneGeometry(400, 420).rotateX(-Math.PI / 2).translate(0, 0, -150), kit.flat({ color: PAL.black, fog: 0 })));

    // ---- the two pole lines ----
    const poles = inst(poleGeo(), kit.toon({ ramp: [PAL.black, PAL.black, PAL.carmineDeep], rim: PAL.gold, rimAmt: 0.85 }), NP * 2, 's18-poles');
    const NI = NP * 2 * POLE.ins.length;
    s.ins = initColors(inst(insulatorGeo(), kit.flat({ color: PAL.white, fog: 1 }), NI, 's18-insulators'), NI, PAL.brassDark);
    s.insZ = new Float32Array(NI);
    let k = 0;
    for (let r = 0; r < 2; r++) for (let i = 0; i < NP; i++) {
      const x = (r ? 1 : -1) * ROWX, z = Z0 - i * SPAN;
      setM(poles, r * NP + i, x, 0, z, 1, 1, 1, 0, (i * 0.37) % 0.5, 0);
      for (const dx of POLE.ins) { setM(s.ins, k, x + dx, POLE.armY + 0.08, z); s.insZ[k] = z; k++; }
    }
    W.add(poles, s.ins);
    // wires: one sagging span per pole pair, 4 per row; the inner wire of each row is gold
    const NW = 2 * 4 * (NP - 1);
    s.wires = initColors(inst(catenary(SPAN, SAG, 0.045, 10, 4), kit.flat({ color: PAL.white, fog: 1 }), NW, 's18-wires'), NW, PAL.velvet);
    s.wireGold = new Uint8Array(NW); s.wireZ = new Float32Array(NW);
    k = 0;
    for (let r = 0; r < 2; r++) for (let w = 0; w < 4; w++) for (let i = 0; i < NP - 1; i++) {
      const sd = r ? 1 : -1, dx = POLE.ins[w], x = sd * ROWX + dx, z = Z0 - i * SPAN;
      setM(s.wires, k, x, WIRE_Y, z);
      s.wireGold[k] = Math.abs(x) < ROWX - 1 ? 1 : 0; s.wireZ[k] = z;
      if (s.wireGold[k]) setC(s.wires, k, PAL.gold);
      k++;
    }
    W.add(s.wires);
    // the sparks that run along the gold wires into the sun
    s.sparks = inst(new THREE.BoxGeometry(0.2, 0.2, 3.6), kit.flat({ color: PAL.goldHi, fog: 0.3, additive: true }), 2, 's18-sparks');
    W.add(s.sparks);

    // ---- the title: one block per sung word, rising out of the desert on L37 ----
    const words = ['GOLD', 'ON', 'THE', 'WIRE'];
    s.title = words.map((str, i) => {
      const ti = s.L37[i + 1];
      const front = kit.text(str, { cap: CAP, color: 'gold', times: [ti], dur: 0.12, vAlign: 'baseline' });
      const back = kit.text(str, { cap: CAP, color: PAL.orange, times: [ti], dur: 0.12, vAlign: 'baseline' });
      back.mesh.renderOrder = 5; front.mesh.renderOrder = 6; // once risen, drawn over the near poles (depthTest off)
      return { front, back, ti, w: front.words[0].x1 - front.words[0].x0 };
    });
    // GOLD ON left of the sun, THE WIRE right of it, on a 46 m arc
    for (const [a, b, side] of [[0, 1, -1], [2, 3, 1]]) {
      const A = s.title[a], B = s.title[b], tot = A.w + WGAP + B.w;
      const a0 = side < 0 ? -INNER - tot / TITLE_R : INNER;
      A.az = a0 + A.w / 2 / TITLE_R; B.az = a0 + (A.w + WGAP + B.w / 2) / TITLE_R;
    }

    // ---- other lyric blocks (one at a time) ----
    kit.text('TONIGHT', { cap: 0.95, color: 'cream', times: [s.ton1], out: s.L37[0] - 0.18, outDur: 0.12, depthTest: false, at: { d: 6, az: 9, y: 1.25 } });
    s.oh = kit.text('OH-OH,', { cap: 1.25, color: 'gold', times: [s.L37[0]], pop: true, out: s.L37[1] - 0.12, outDur: 0.1, depthTest: false, at: { d: 7, az: -17, y: 1.35 } });
    s.ton2s = kit.text('TONIGHT', { cap: 2.6, color: 'black', times: [s.ton2t], pop: true, dur: 0.12, out: 150.1, outDur: 0.4, depthTest: false, at: { d: 24.6, az: 0.5, y: -0.82 } });
    s.ton2s.mesh.renderOrder = 5;
    s.ton2 = kit.text('TONIGHT', { cap: 2.6, color: 'cream', times: [s.ton2t], pop: true, dur: 0.12, out: 150.1, outDur: 0.4, depthTest: false, at: { d: 24, az: 0, y: -0.6 } });
    s.tonY = [s.ton2.mesh.position.y, s.ton2s.mesh.position.y];

    // the snip: white sparks where the two gold wires part, 12 m ahead
    s.spark = kit.particles({
      n: 30, shape: 'stroke', seed: 1801, init: (i, r) => {
        const sd = i & 1 ? 1 : -1, p = [sd * (ROWX - 1.12), wireY(-12), -12];
        if (i < 2) return { p, t0: 151.5, life: 0.12, s: 2.2, c: PAL.white };
        const a = r() * Math.PI * 2, b = (r() - 0.5) * Math.PI, sp = 6 + r() * 9;
        return { p, v: [Math.cos(a) * Math.cos(b) * sp, Math.sin(b) * sp + 3, -Math.abs(Math.sin(a) * Math.cos(b) * sp)], g: [0, -9, 0], t0: 151.5 + r() * 0.04, life: 0.5 + r() * 0.4, s: 0.7 + r() * 0.6, c: r() < 0.6 ? PAL.white : PAL.goldHi };
      },
    });
    W.add(s.spark);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.world.position.z = d;
    kit.fade(1 - kit.sm(152.5, 153.5, t));
    // insulators: dark amber glass, two light waves toward the sun on "oh-oh", one flare on "tonight"
    const fl = envAt(t, s.ton2t, 3);
    for (let i = 0; i < s.insZ.length; i++) {
      const ze = s.insZ[i] + d, far = clamp01(-ze / 170);
      let c = PAL.brassDark, k = 0;
      for (const tw of s.waves) if (t >= tw && t < tw + 2.4 && Math.abs(ze - (8 - (t - tw) * 80)) < 7) k = 1;
      if (t >= 150.0 + (1 - far) * 1.8) c = PAL.velvet;
      mixC(s.ins, i, c, PAL.goldHi, Math.max(k, fl * 0.85));
    }
    s.ins.instanceColor.needsUpdate = true;
    // the gold wires go dark past the snip
    const snip = t >= 151.5;
    for (let i = 0; i < s.wireZ.length; i++) if (s.wireGold[i]) setC(s.wires, i, snip && s.wireZ[i] + d < -12 ? PAL.velvet : PAL.gold, 1 + 0.6 * fl);
    s.wires.instanceColor.needsUpdate = true;
    // sparks along the gold wires
    for (let j = 0; j < 2; j++) {
      let on = false, zl = 0;
      for (const tp of s.pulseT) { const a = t - tp; if (a >= 0 && a < 2.2 && !snip) { on = true; zl = 6 - a * 75 - d; } }
      const x = (j ? 1 : -1) * (ROWX - 1.12);
      if (on) setM(s.sparks, j, x, wireY(zl), zl); else setM(s.sparks, j, 0, -60, 0, 0, 0, 0);
    }
    s.sparks.instanceMatrix.needsUpdate = true;

    // title words rise out of the desert (0.4 s each), pulse on L38's duplicate, flare on "tonight", sink last
    for (let i = 0; i < 4; i++) {
      const L = s.title[i];
      const kk = kit.ease.out(lin(L.ti, L.ti + 0.4, t));
      const ks = kit.ease.in(lin(150.85 + i * 0.05, 151.25 + i * 0.05, t));
      const y = TITLE_Y - (TITLE_Y + CAP + 1.5) * ((1 - kk) + ks);
      const sa = Math.sin(L.az), ca = Math.cos(L.az);
      L.front.mesh.position.set(sa * TITLE_R, y, -ca * TITLE_R);
      L.front.mesh.rotation.set(0, -L.az, 0);
      const rb = TITLE_R + 0.8, ab = L.az + 0.45 / TITLE_R;
      L.back.mesh.position.set(Math.sin(ab) * rb, y - 0.5, -Math.cos(ab) * rb);
      L.back.mesh.rotation.set(0, -ab, 0);
      const pulse = s.dup.length ? envAt(t, s.dup[i], 9) : 0;
      L.front.mesh.scale.setScalar(1 + 0.08 * pulse);
      L.front.u.uBright.value = 1 + 0.8 * fl + 0.6 * pulse;
      const up = kk > 0.985 && ks <= 0; // rising/sinking: the desert hides the letters; standing: over the poles
      L.front.mesh.material.depthTest = !up; L.back.mesh.material.depthTest = !up;
      const vis = ks < 1;
      L.front.mesh.visible = vis; L.back.mesh.visible = vis;
    }
    s.oh.mesh.scale.setScalar(1 + 0.2 * Math.max(envAt(t, s.waves[0], 7), envAt(t, s.waves[1], 7)));
    const sinkT = kit.ease.in(lin(150.9, 151.45, t));
    s.ton2.mesh.position.y = s.tonY[0] - 4.5 * sinkT;
    s.ton2s.mesh.position.y = s.tonY[1] - 4.5 * sinkT;
    s.ton2.u.uBright.value = 1 + 0.5 * fl;

    if (kit.isOwner) {
      // the sky: dot -> full sun on "tonight", rays on the two chorus hits, then out from the edges inward
      const hold = Math.min(t, 149.17);
      let sunR = t < s.ton1 ? SUN0 : lerp(SUN0, SUN1, kit.ease.out(lin(s.ton1, s.ton1 + 0.5, t)));
      sunR *= 1 + 0.035 * kit.downEnv(t, 5);
      const flash = t >= s.ton2t && t < s.ton2t + 0.06;
      if (flash) sunR *= 1.4;
      const shrink = kit.ease.inOut(lin(150.0, 152.2, t));
      sunR = lerp(sunR, 0.0045, shrink);
      const el = lerp(EL18, Math.atan2(1.8, 120), shrink);
      s.foc[0] = 0; s.foc[1] = Math.sin(el); s.foc[2] = -Math.cos(el);
      const sk = s.sky;
      sk.focal = s.foc; sk.rot = hold * 0.035; sk.ringPhase = hold * 0.12;
      sk.sunR = t < 152.4 ? sunR : sunR * (1 - lin(152.4, 152.9, t));
      sk.sunCol = flash ? PAL.white : PAL.amber; sk.sunRing = PAL.orange;
      const rp = Math.max(envAt(t, s.L37[1], 6), envAt(t, s.L37[4], 6), 0.7 * envAt(t, s.ton2t, 3));
      sk.rayA = lerpCol(s.c[0], PAL.crimson, PAL.red, rp);
      sk.zen = PAL.carmine; sk.hor2 = PAL.carmine; sk.hor = PAL.crimson;
      sk.rayR = 1.45 * (1 - kit.sm(150.0, 152.5, t)) + 0.0001;
      // sunburst only on the two hits: "gold" and the title end + "tonight"
      sk.rays = Math.max(kit.sm(s.L37[1], s.L37[1] + 0.08, t) * (1 - kit.sm(s.L37[1] + 0.3, s.L37[1] + 0.9, t)), kit.sm(s.L37[4], s.L37[4] + 0.08, t) * (1 - kit.sm(148.7, 149.4, t)));
      sk.rings = 0;
      sk.amt = 1 - kit.sm(152.6, 153.5, t);
      kit.setSky(sk);
    }
  },
  events() {
    return [
      { t: 143.16, sfx: 'switch', gain: 0.45 },
      { t: 145.6, sfx: 'ping', gain: 0.45 },
      { t: 147.16, sfx: 'whoosh', gain: 0.55, haptic: [0.4, 80] },
      { t: 148.0, sfx: 'crack', gain: 0.55, haptic: [0.6, 120] },
      { t: 151.5, sfx: 'shutter', gain: 0.5, haptic: [0.3, 40] },
    ];
  },
};
