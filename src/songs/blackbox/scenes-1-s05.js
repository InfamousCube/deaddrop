// S05 The hall of mirrors (28.10 to 36.20, cold; pre 0.7 behind S04's falling walls). Round 3, storyboard v3.
// SHOT CARD
//   what     a palace corridor lined with tall gold-framed mirrors; in every mirror stands the same woman,
//            she turns round to look at you, and then the mirrors swing open like secret doors.
//   hero     the mirrors: round-arched glass (pale cyan, one diagonal highlight), bevelled gold frame with a shell
//            crest, her silhouette inside (sharp bob, high collar, long coat, round white glasses); the 6 m end
//            mirror straight ahead
//   around   4 mirrors per side at x +-4.5 (turned 10 deg toward you, hinged on the far edge) pass every 1.3 s;
//            gold vault ribs every 4 m pass overhead; petrol walls and barrel vault; a petrol runner with cream
//            border bands below; behind, the banquet hall has fallen away into black
//   palette  black + petrol + pale cyan glass + gold frames (cream light in the open doors)
//   motion   3 m/s from 28.1, 1 m/s by 35.4. 28.30 the frames light pair by pair; 29.4 her reflection appears in
//            every mirror; 30.92 they all turn round to you; 31.82 their glasses flash; 32.62-34.5 the mirrors
//            swing open pair by pair, near to far, on bright cream passages; only the end mirror stays shut
//   lyrics   centre (d 7), hanging just below the end mirror, depthTest off
//   out      SHATTER 35.80: the end mirror bursts into glass shards that fly forward and outward; a big gold
//            clock gear turns behind it (the clockwork of S06)
import * as THREE from 'three';
import { PAL } from './style.js';
import { ext, tube, polyShape, polyPath, archPts, ellPts, gearShape, flatShape, inst, setM, scratch, merge, figureShape, PATH_KEYS } from './scenes-1-util.js';

const FY = -1.75, WX = 5.2, SPRING = FY + 6.0, MX = 4.5, PITCH = 5, RIB = 10;
const GW = 2.0, GH = 4.5, FW = 2.46, FH = 4.86;  // glass / frame (round-arched)
const FIG_S = 1.75;                               // her figure (1.75 m outline) scaled to 3.06 m
const T_SHATTER = 35.8;

function mirrorParts(sc = 1) {
  const S = (pts) => pts.map(([x, y]) => [x * sc, y * sc]);
  const frame = polyShape(S(archPts(FW, FH, 0))); frame.holes.push(polyPath(S(archPts(GW, GH, 0.12))));
  const lobes = []; const R = 0.72 * sc, cy = (FH - 0.12) * sc;
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI, r = R * (0.84 + 0.16 * Math.abs(Math.sin(i * Math.PI / 4))); lobes.push([Math.cos(a) * r, cy + Math.sin(a) * r]); }
  const crest = polyShape(lobes);
  const frameG = merge([ext(frame, 0.16, 0.07 * sc, 1, 14), ext(crest, 0.14, 0.05 * sc, 1, 4).translate(0, 0, 0.02)]);
  const glassG = flatShape(polyShape(S(archPts(GW, GH, 0.12))), 14).translate(0, 0, 0.0);
  const bandG = flatShape(polyShape(S([[-0.98, 1.0], [-0.98, 1.55], [0.98, 3.25], [0.98, 2.7]]))).translate(0, 0, 0.01);
  const passG = flatShape(polyShape(S(archPts(GW + 0.1, GH + 0.05, 0.1))), 14).translate(0, 0, -0.12);
  return { frameG, glassG, bandG, passG };
}
function figureGeos() {
  const body = ext(figureShape(), 0.05, 0.012, 1, 1);
  const g = merge([[-0.064, 1.585], [0.064, 1.585]].map(([x, y]) => flatShape(polyShape(ellPts(0.05, 0.05, x, y, 14))).translate(0, 0, 0.045)));
  return { body, glasses: g };
}

export const S05 = {
  id: 'S05', t0: 28.1, t1: 36.2, world: 'cold', pre: 0.7, post: 0,
  key: [0.35, 0.6, 0.72],
  fog: { color: PAL.black, near: 7, far: 24 }, // the far end of the hall melts into black: no dense chain of tiny frames
  sky: { stars: 0, moonR: 0, hor: PAL.black },
  build(kit) {
    const s = { x: scratch(), M: new THREE.Matrix4(), M2: new THREE.Matrix4(), M3: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), sv: new THREE.Vector3() };
    const W = (txt, near) => kit.words.times(txt, near)[0];
    s.tEvery = W('every', 28.3); s.tMirror = W('mirror', 29.98); s.tFace = W('face', 30.92); s.tKnow = W('know', 31.82);
    s.tExit = W('every', 32.62); s.tPlace = W('place', 34.92);
    s.G = kit.travel(PATH_KEYS);
    const Pent = s.G.d(28.0) + 6 + 3.2 + 0.5;            // just behind S04's end wall
    const Pend = (s.Pend = s.G.d(T_SHATTER) + 12); // far enough that the lyric fits under its foot
    const Pfl = s.G.d(27.4) - 6, flen = Pend - Pfl + 1, fzc = -(Pfl + Pend) / 2; // the floor reaches back under S04 (no void at 28.1)
    const hall = (s.hall = new THREE.Group()); kit.group.add(hall);
    const len = Pend - Pent + 1, zc = -(Pent + Pend) / 2;
    // ---- floor, runner with cream borders, walls, barrel vault, gold ribs
    hall.add(new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, flen).rotateX(-Math.PI / 2).translate(0, FY - 0.01, fzc), kit.flat({ color: 0x020a0d })));
    hall.add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, flen).rotateX(-Math.PI / 2).translate(0, FY, fzc), kit.flat({ color: PAL.petrolDeep })));
    const wallMat = kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null });
    hall.add(new THREE.Mesh(merge([-1, 1].map((sx) => new THREE.PlaneGeometry(len, SPRING - FY).rotateY(-sx * Math.PI / 2).translate(sx * WX, (SPRING + FY) / 2, zc))), wallMat));
    hall.add(new THREE.Mesh(new THREE.CylinderGeometry(WX, WX, len, 20, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2).translate(0, SPRING, zc),
      kit.flat({ color: 0x01080a, side: THREE.BackSide })));
    const ribG = merge([new THREE.TorusGeometry(WX - 0.12, 0.17, 5, 20, Math.PI).translate(0, SPRING, 0),
      new THREE.BoxGeometry(0.42, SPRING - FY, 0.34).translate(-(WX - 0.12), (SPRING + FY) / 2, 0), new THREE.BoxGeometry(0.42, SPRING - FY, 0.34).translate(WX - 0.12, (SPRING + FY) / 2, 0)]);
    const nR = Math.floor(len / RIB) + 1;
    const ribs = inst(ribG, kit.toon({ ramp: [PAL.brass, PAL.gold, PAL.gold], rim: null }), nR, 's05-ribs');
    for (let i = 0; i < nR; i++) setM(ribs, i, 0, 0, -(Pent + i * RIB));
    hall.add(ribs);
    // ---- side mirrors (instanced parts, each leaf hinged on its far edge)
    const MP = mirrorParts(1), FG = figureGeos();
    s.mP = []; for (let p = Pent + 2.2; p < Pend - 2.5; p += PITCH) s.mP.push(p);
    const nM = s.mP.length * 2;
    s.frames = inst(MP.frameG, kit.toon({ ramp: [PAL.brass, PAL.gold, PAL.gold], rim: null }), nM, 's05-frames'); // tones under the edge threshold: shading without outlines
    s.glass = inst(MP.glassG, kit.flat({ color: 0x9fd6e4 }), nM, 's05-glass');
    s.band = inst(MP.bandG, kit.flat({ color: 0xd4f1f8 }), nM, 's05-band');
    s.pass = inst(MP.passG, kit.flat({ color: PAL.cream, fog: 0.8 }), nM, 's05-pass');
    s.figs = inst(FG.body, kit.toon({ ramp: 'black', rim: null }), nM, 's05-figs');
    s.figGl = inst(FG.glasses, kit.flat({ color: PAL.white }), nM, 's05-figgl');
    s.base = []; // per leaf: [x, z, psi, hingeX, sigma, pair]
    const x = s.x;
    s.mP.forEach((P, i) => {
      for (let side = 0; side < 2; side++) {
        const sx = side ? 1 : -1, psi = Math.atan2(-sx * Math.cos(10 * Math.PI / 180), Math.sin(10 * Math.PI / 180));
        const hx = sx > 0 ? -FW / 2 : FW / 2, k = i * 2 + side;
        s.base.push([sx * MX, -P, psi, hx, sx, i]);
        s.M.compose(x.p.set(sx * MX, FY + 0.4, -P), x.q.setFromEuler(x.e.set(0, psi, 0)), x.s.set(1, 1, 1));
        s.pass.setMatrixAt(k, s.M);
        s.frames.setColorAt(k, x.c.set(0x333333));
      }
    });
    hall.add(s.frames, s.glass, s.pass, s.figs, s.figGl);
    // ---- the end mirror (6 m), her reflection, the gear behind it and the shards
    const EM = 1.3, ME = mirrorParts(EM);
    const em = (s.endM = new THREE.Group()); em.position.set(0, FY + 0.3, -Pend); hall.add(em);
    s.endFrame = new THREE.Mesh(ME.frameG, kit.toon({ ramp: [PAL.brass, PAL.gold, PAL.gold], rim: null }));
    s.endGlass = new THREE.Group();
    s.endGlass.add(new THREE.Mesh(ME.glassG, kit.flat({ color: 0x9fd6e4 })));
    s.endFig = new THREE.Group(); s.endFig.position.set(0, 0.5, 0.06); s.endFig.scale.setScalar(FIG_S * EM);
    s.endFig.add(new THREE.Mesh(FG.body, s.figs.material), new THREE.Mesh(FG.glasses, s.figGl.material));
    s.endGlass.add(s.endFig);
    em.add(s.endFrame, s.endGlass);
    s.gear = new THREE.Mesh(ext(gearShape(4.2, 24, 0.12, 1.2), 0.6, 0.08, 1, 2), kit.toon({ ramp: 'gold', rim: null }));
    s.gear.position.set(0, FY + 3.5, -Pend - 4.5); hall.add(s.gear);
    s.glow = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), kit.flat({ color: PAL.cyan, fog: 0.2 }));
    s.glow.position.set(0, FY + 3.5, -Pend - 5.2); hall.add(s.glow);
    s.shards = kit.shards({
      n: 46, t0: T_SHATTER, life: 1.8, gravity: -5, colors: [0x9fd6e4, 0xd4f1f8, PAL.cyan], seed: 11,
      init: (i, rnd) => {
        const gx = (rnd() - 0.5) * GW * EM, gy = 0.4 + rnd() * GH * EM * 0.95;
        return { p: [gx, FY + 0.3 + gy, -Pend + 0.05], v: [gx * (1.4 + rnd()), (gy - 2.5) * 0.7 + rnd() * 1.5, -(3.5 + rnd() * 5)], s: [0.35 + rnd() * 0.6, 0.35 + rnd() * 0.6], spin: (rnd() - 0.5) * 9 };
      },
    });
    hall.add(s.shards);
    // ---- lyrics: centre, hanging just under the end mirror's foot
    const LY = { cap: 1.05, lineGap: 1.0, vAlign: 'top', depthTest: false, at: { d: 7, az: 0, y: -0.15 } };
    // one line at a time: the near mirrors carry the frame, the lyric stays a single clean line
    const tShows = kit.words.times('shows', 30.6)[0], tGot = kit.words.times('got', 34.3)[0];
    kit.text('EVERY MIRROR', { ...LY, color: 'cream', colors: { 1: 'gold' }, near: s.tEvery, out: tShows - 0.2 }); // gone before the next block slides in
    kit.text('SHOWS A FACE', { ...LY, color: 'cream', near: tShows, out: 31.35 });
    kit.text('I KNOW', { ...LY, color: 'gold', near: 31.42, out: 32.45 });
    kit.text("EVERY EXIT'S", { ...LY, color: 'cream', near: s.tExit, out: tGot - 0.2 });
    kit.text('GOT A PLACE', { ...LY, color: 'cream', near: tGot, out: 35.1 });
    kit.text('TO GO', { ...LY, color: 'gold', near: 35.18, out: 36.1 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit, x = s.x;
    s.hall.position.z = s.G.d(t);
    const show = t >= s.tMirror;
    const turn = Math.PI * (1 - kit.ease.inOut(kit.clamp01((t - s.tFace) / 0.4))); // pi = back to you, 0 = facing you
    const gk = t >= s.tKnow ? Math.exp(-(t - s.tKnow) * 3) : 0;
    s.figGl.material.uniforms.uBright.value = 1 + 1.5 * gk;
    const nPairs = s.mP.length;
    for (let k = 0; k < s.base.length; k++) {
      const [bx, bz, psi, hx, sig, pair] = s.base[k];
      const lit = t >= s.tEvery + pair * 0.28;
      s.frames.setColorAt(k, x.c.set(lit ? 0xffffff : 0x3a3a3a));
      const t0 = s.tExit + pair * ((s.tPlace - 0.4 - s.tExit) / Math.max(1, nPairs - 1));
      const open = kit.ease.inOut(kit.clamp01((t - t0) / 0.7)) * 1.75 * sig;
      // leaf = T(pos) Ry(psi) T(hx) Ry(open) T(-hx)
      s.M.compose(x.p.set(bx, FY + 0.4, bz), x.q.setFromEuler(x.e.set(0, psi, 0)), x.s.set(1, 1, 1));
      s.M2.makeTranslation(hx, 0, 0); s.M.multiply(s.M2);
      s.M2.makeRotationY(open); s.M.multiply(s.M2);
      s.M2.makeTranslation(-hx, 0, 0); s.M.multiply(s.M2);
      s.frames.setMatrixAt(k, s.M); s.glass.setMatrixAt(k, s.M);
      // her figure inside the glass: turns round on "face"
      s.M3.compose(x.p.set(0, 0.32, 0.05), x.q.setFromEuler(x.e.set(0, turn, 0)), x.s.setScalar(show ? FIG_S : 0.0001));
      s.M2.multiplyMatrices(s.M, s.M3);
      s.figs.setMatrixAt(k, s.M2); s.figGl.setMatrixAt(k, s.M2);
    }
    s.frames.instanceColor.needsUpdate = true;
    for (const m of [s.frames, s.glass, s.figs, s.figGl]) m.instanceMatrix.needsUpdate = true;
    // end mirror: lights last, her reflection turns with the others, then shatters
    s.endFrame.material.uniforms.uBright.value = t >= s.tEvery + nPairs * 0.28 ? 1 : 0.3;
    s.endFig.visible = show; s.endFig.rotation.y = turn;
    s.endGlass.visible = t < T_SHATTER;
    s.shards.visible = t >= T_SHATTER;
    s.gear.visible = s.glow.visible = t >= T_SHATTER - 0.05;
    s.gear.rotation.z = -(t - T_SHATTER) * 0.35;
    if (kit.isOwner) {
      kit.setSky({ stars: 0, amt: 1 });
      // while the mirrors stand open, the far pairs melt into black sooner (fewer small gold frames = calmer frame)
      const k = kit.sm(30.4, 31.4, t) * (1 - kit.sm(34.9, 35.6, t));
      kit.setFog(PAL.black, 7 - 2 * k, 24 - 11 * k);
    }
    return t >= T_SHATTER && t < T_SHATTER + 0.03 ? { flash: PAL.white } : undefined;
  },
  events() { return [{ t: 28.3, sfx: 'switch', gain: 0.3 }, { t: 32.62, sfx: 'hatch', gain: 0.35 }, { t: T_SHATTER, sfx: 'crack', gain: 0.7, haptic: [0.5, 120] }]; },
};
