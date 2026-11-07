// S06 The clock tower and the shaft (36.20 to 47.40, cold, black at the end). Round 3, STORYBOARD-v3.
// SHOT CARD
//   A 36.2-40.5  You float inside the gear works of the city clock. HERO the clock window ahead: the
//                cast-iron frame with 12 spokes, mirrored Roman numerals on the backlit cream chapter
//                ring, the hands from behind; the night city glows through it (two skyline layers,
//                cyan windows). AROUND real gears with teeth, spokes and bolted hubs on both sides,
//                behind and overhead (big ones turn <= 3 deg/s), the escape wheel and its anchor front
//                left, a bronze bell overhead, the gold pendulum swinging in the middle. MOTION drift
//                toward the window (1.5 m/s); "tick" = escape wheel click, gears step, pendulum at its
//                extreme; "breathe" = the city light swells twice.
//   B 40.5-42.8  "Ten floors under": you sink through the hole in the gear-room floor (2 m/s), the gear
//                works rise past on both sides; an art-deco floor dial rides down its rails beside you
//                and sweeps 10 -> 1.
//   C 42.8-45.1  The designed black beat: landing rings go out top to bottom, only the cyan needle
//                (trembling at B) and the gold pendulum stay; faint petrol shaft wall.
//   D 45.1-47.4  Art-deco doors with a brass sunburst ahead: crimson seam, they part, crimson light
//                floods, you glide in; the light dies into black (S07 ignites at 47.48).
//   LYRICS one block at a time, left of the pendulum (gear room d 5.8, shaft d 3.5-4), HERE WE GO
//          above the doors.
import * as THREE from 'three';
import { PAL } from './style.js';
import { makeText } from './type.js';
import { D2R, EYE, sm, env, clamp01, wt, xf, merge, paint, lathe, ext, tube, cyl, shapeOf, ringShape, roundRect, gearGeo } from './scenes-2-util.js';

const T0 = 36.2;
const FLOOR = -1.2;                              // gear-room floor (world y), the shaft opens below it
const SR = 4.5;                                  // shaft radius
const DIAL = { y: 3.5, z: -13.5, R: 6.4 };        // clock window (world)
const KEY = [0.2, 0.7, 0.68];
// gears: r, teeth, thick, position, axis ('x' = plane faces the aisle, 'z' = faces the player), turn direction
// Round 4 (Leo: "gears that still pass by when you look to the side"): three depths, all solid toon fills lit
// from the aisle, all clear of the floor (the old ones cut through it and left tooth stubs = specks).
//   L 'n' near brass (4.2-4.4 m from the path, small, fast), 'm' mid steel (6.6-7 m, big, <= 3 deg/s),
//   'sh' brass gears in the shaft wall (3.95 m from its axis): they rise past on both sides and behind as you sink.
const GEARS = [
  { r: 2.4, n: 22, th: 0.45, p: [-4.2, 1.5, -1.2], ax: 'x', L: 'n', dir: 1 },
  { r: 2.0, n: 18, th: 0.4, p: [4.3, 2.4, -3.4], ax: 'x', L: 'n', dir: -1 },
  { r: 1.7, n: 16, th: 0.4, p: [-4.4, 4.9, 2.4], ax: 'x', L: 'n', dir: -1 },
  { r: 1.9, n: 18, th: 0.4, p: [4.2, 1.0, 2.2], ax: 'x', L: 'n', dir: 1 },
  { r: 5.2, n: 48, th: 0.6, p: [-6.8, 4.3, -6.6], ax: 'x', L: 'm', dir: -1 },
  { r: 4.6, n: 42, th: 0.6, p: [7.0, 3.6, -8.2], ax: 'x', L: 'm', dir: 1 },
  { r: 3.6, n: 32, th: 0.5, p: [-6.6, 2.6, 4.6], ax: 'x', L: 'm', dir: 1 },
  { r: 3.4, n: 30, th: 0.5, p: [6.6, 2.4, 4.0], ax: 'x', L: 'm', dir: -1 },
  { r: 4.4, n: 40, th: 0.6, p: [1.5, 3.4, 9.0], ax: 'z', L: 'm', dir: 1 },
  { r: 3.8, n: 36, th: 0.5, p: [3.4, 10.4, -3.0], ax: 'x', L: 'm', dir: -1 },
  { r: 2.0, n: 18, th: 0.4, p: [-3.95, -3.3, 0], ax: 'x', L: 'sh', dir: 1, shaft: 1 },
  { r: 1.7, n: 16, th: 0.4, p: [3.95, -2.7, 0], ax: 'x', L: 'sh', dir: -1, shaft: 1 },
  { r: 2.0, n: 18, th: 0.4, p: [3.95, -5.6, 0], ax: 'x', L: 'sh', dir: 1, shaft: 1 },
  { r: 1.8, n: 16, th: 0.4, p: [0, -4.4, 3.95], ax: 'z', L: 'sh', dir: -1, shaft: 1 },
  { r: 1.6, n: 14, th: 0.4, p: [-3.95, -6.3, 0], ax: 'x', L: 'sh', dir: -1, shaft: 1 },
];
const ESC = { r: 2.3, p: [-3.9, 5.4, -9.4] };

export const S06 = {
  id: 'S06', t0: 36.2, t1: 47.4, world: 'cold', pre: 0.4, post: 0,
  key: KEY,
  fog: { color: PAL.black, near: 16, far: 62 },
  sky: { stars: 0.5, hor: PAL.petrolDeep },
  build(kit) {
    const s = { late: [] };
    // word times (follow words.json fixes)
    s.tk1 = wt(kit, 'tick tick', 36.34, 0); s.tk2 = wt(kit, 'tick tick', 36.34, 1);
    s.feel = wt(kit, 'feel the city breathe', 39.0, 0);
    s.ten = wt(kit, 'ten floors', 40.52, 0); s.floors = wt(kit, 'ten floors', 40.52, 1);
    s.believe = wt(kit, 'under what you believe', 41.22, 3);
    s.hold = wt(kit, 'hold your breath', 42.76, 0); s.breath = wt(kit, 'hold your breath', 42.76, 2);
    s.here = wt(kit, 'here we go', 45.0, 0); s.we = wt(kit, 'here we go', 45.0, 1); s.go = wt(kit, 'here we go', 45.0, 2);
    s.h = (s.tk2 - s.tk1) / 4;                      // pendulum half swing: extremes on both ticks

    // motion: drift toward the window, sink (world rises), final glide through the doors
    s.fwd = kit.travel([[T0, 1.5, 1.0], [39.4, 0, 1.2], [46.25, 2.2, 1.0]]);
    s.sink = kit.travel([[s.ten, 2, 1.0], [43.3, 0.6, 1.0], [45.3, 0, 1.0]]);
    const DR = s.fwd.d(40.6), SINK = s.sink.d(47.4), SZ = -DR, EY = EYE - SINK;
    s.SZ = SZ;
    const W = (s.W = new THREE.Group());
    kit.group.add(W);

    const black = kit.toon({ ramp: 'black', rim: PAL.cyan, rimAmt: 0.9, key: KEY });
    const steel = kit.toon({ ramp: 'steel', rim: PAL.cyan, key: KEY, side: THREE.DoubleSide });
    const bronze = kit.toon({ ramp: [PAL.black, PAL.brassDark, PAL.brass], rim: PAL.teal, key: KEY, side: THREE.DoubleSide });
    const gold = kit.toon({ ramp: 'gold', rim: PAL.cyan, key: KEY });

    // ---- the clock window: black tower wall with a round hole, the city behind it -----------------
    const matte = kit.matte({ shape: 'circle', r: DIAL.R });
    matte.position.set(0, DIAL.y, DIAL.z - 0.32);
    W.add(matte);
    const rnd = kit.rnd(606);
    const skyline = (z, base, hMin, hMax, spire) => {
      const pts = [[-70, base]], bands = [];
      let x = -70;
      while (x < 70) {
        const w = 4 + rnd() * 7, h = hMin + rnd() * (hMax - hMin);
        pts.push([x, h]);
        if (rnd() < 0.6) {
          const sw = w * 0.56, xa = x + (w - sw) / 2, sh = h + 2 + rnd() * 4;
          pts.push([xa, h], [xa, sh]);
          if (spire && rnd() < 0.4) { const xm = xa + sw / 2; pts.push([xm - 0.5, sh], [xm, sh + 5], [xm + 0.5, sh]); }
          pts.push([xa + sw, sh], [xa + sw, h]);
        }
        pts.push([x + w, h]);
        bands.push({ x: x + w / 2, w, h });
        x += w;
      }
      pts.push([x, base]);
      const g = new THREE.ShapeGeometry(shapeOf(pts));
      g.translate(0, 0, z);
      return { g, bands };
    };
    const far = skyline(-33, -40, 1, 12, true), near = skyline(-24, -40, -4, 4, false);
    s.cityFar = new THREE.Mesh(far.g, kit.flat({ color: PAL.petrol, fog: 0, side: THREE.DoubleSide }));
    s.cityNear = new THREE.Mesh(near.g, kit.flat({ color: PAL.black, fog: 0, side: THREE.DoubleSide }));
    // lit floors: a few wide window bands (big, not specks)
    const wins = [];
    for (const b of near.bands) if (b.h > 1 && Math.abs(b.x) < 26) for (let k = 0; k < 2; k++) if (rnd() < 0.7) wins.push([b.x, b.h - 1.6 - k * 2.6, b.w * 0.62]);
    s.wins = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.9), kit.flat({ color: PAL.cyan, fog: 0 }), wins.length);
    const m4 = new THREE.Matrix4();
    wins.forEach(([x, y, w], i) => s.wins.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, -23.9), new THREE.Quaternion(), new THREE.Vector3(w, 1, 1))));
    // the city glow on the horizon (teal at the bottom, black at the top)
    const glowG = new THREE.PlaneGeometry(200, 50, 1, 6);
    const gc = [], ca = new THREE.Color(PAL.cyan), cb = new THREE.Color(0x000000), tmpc = new THREE.Color();
    for (let i = 0; i < glowG.getAttribute('position').count; i++) { const k = clamp01((glowG.getAttribute('position').getY(i) + 25) / 50); tmpc.copy(ca).lerp(cb, Math.min(1, k * 1.6)); gc.push(tmpc.r, tmpc.g, tmpc.b); }
    glowG.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
    s.glow = new THREE.Mesh(glowG.translate(0, 3, -42), kit.flat({ vertexColors: true, fog: 0 }));
    W.add(s.cityFar, s.cityNear, s.wins, s.glow);

    // chapter ring (backlit cream glass), cast-iron frame with 12 spokes, mirrored Roman numerals
    s.ring = new THREE.Mesh(ext(ringShape(4.95, DIAL.R, 64), 0.1, 0, 2).translate(0, DIAL.y, DIAL.z - 0.1), kit.flat({ color: PAL.creamDark, fog: 0 }));
    const frame = [ext(ringShape(DIAL.R - 0.05, DIAL.R + 0.55, 64), 0.5, 0.06, 2), ext(ringShape(2.3, 2.62, 48), 0.3, 0.04, 2), ext(ringShape(4.85, 5.0, 64), 0.3, 0.03, 2), xf(cyl(0.85, 0.85, 0.5, 18), [0, 0, 0], [Math.PI / 2, 0, 0])];
    for (let k = 0; k < 12; k++) frame.push(xf(new THREE.BoxGeometry(0.2, 4.1, 0.28), [0, 0, 0], [0, 0, 0]).translate(0, 2.9, 0).rotateZ(k * Math.PI / 6 + Math.PI / 12));
    const glyph = (ch) => ch === 'I' ? [xf(new THREE.BoxGeometry(0.15, 0.82, 0.14), [0, 0, 0])]
      : ch === 'V' ? [xf(new THREE.BoxGeometry(0.14, 0.86, 0.14), [-0.1, 0, 0], [0, 0, -0.24]), xf(new THREE.BoxGeometry(0.14, 0.86, 0.14), [0.1, 0, 0], [0, 0, 0.24])]
        : [xf(new THREE.BoxGeometry(0.14, 0.9, 0.14), [0, 0, 0], [0, 0, -0.45]), xf(new THREE.BoxGeometry(0.14, 0.9, 0.14), [0, 0, 0], [0, 0, 0.45])];
    const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ROMAN.forEach((str, h) => {
      const chars = [...str].reverse();                    // seen from behind: mirrored
      const wOf = (c) => (c === 'I' ? 0.24 : 0.5);
      const tw = chars.reduce((a, c) => a + wOf(c), 0);
      let x = -tw / 2;
      const a = h * 30 * D2R;                              // from behind the hours run counter-clockwise
      for (const c of chars) {
        for (const g of glyph(c)) frame.push(g.translate(x + wOf(c) / 2, 5.57, 0.1).rotateZ(a));
        x += wOf(c);
      }
    });
    const frameM = new THREE.Mesh(merge(frame).translate(0, DIAL.y, DIAL.z), kit.flat({ color: PAL.black })); // pure silhouette: thin rim lines on the spokes broke into specks
    W.add(s.ring, frameM);
    // hands from behind (10:08, minute steps on each tick)
    const minG = ext(shapeOf([[-0.13, -1.0], [0.13, -1.0], [0.1, 4.0], [0, 5.0], [-0.1, 4.0]]), 0.1, 0.03, 2);
    const hourG = ext(shapeOf([[-0.15, -0.8], [0.15, -0.8], [0.12, 2.0], [0.46, 2.55], [0.1, 3.2], [0, 3.6], [-0.1, 3.2], [-0.46, 2.55], [-0.12, 2.0]]), 0.1, 0.03, 2);
    s.minH = new THREE.Mesh(merge([minG, xf(cyl(0.42, 0.42, 0.1, 16), [0, -0.9, 0], [Math.PI / 2, 0, 0])]), black);
    s.hourH = new THREE.Mesh(hourG, black);
    for (const [m, z] of [[s.minH, 0.45], [s.hourH, 0.32]]) { m.position.set(0, DIAL.y, DIAL.z + z); W.add(m); }

    // ---- gear works -------------------------------------------------------------------------------
    const BR = [PAL.black, PAL.brassDark, PAL.brass];
    const gm = (ramp, key) => kit.toon({ ramp, rim: PAL.cyan, rimAmt: 0.9, key, side: THREE.DoubleSide });
    const kL = [0.78, 0.5, 0.38], kR = [-0.78, 0.5, 0.38];
    s.gm = { nL: gm(BR, kL), nR: gm(BR, kR), nZ: gm(BR, KEY), mL: gm('steel', kL), mR: gm('steel', kR), mZ: gm('steel', KEY), shL: gm(BR, kL), shR: gm(BR, kR), shZ: gm(BR, [0.2, 0.6, -0.77]) };
    s.gears = GEARS.map((g) => {
      const piv = new THREE.Group();
      piv.position.set(g.p[0], g.p[1], g.p[2] + (g.shaft ? SZ : 0));
      if (g.ax === 'x') piv.rotation.y = Math.PI / 2;
      const mat = s.gm[g.L + (g.ax === 'z' ? 'Z' : g.p[0] < 0 ? 'L' : 'R')];
      const m = new THREE.Mesh(gearGeo({ r: g.r, teeth: g.n, thick: g.th, spokes: g.r > 3 ? 6 : 0, bolts: g.r > 3 ? 8 : 6 }), mat);
      piv.add(m);
      W.add(piv); s.late.push(piv);
      return { m, piv, shaft: !!g.shaft, w: 13 / g.r, st: 18 / g.r, dir: g.dir };
    });
    // escape wheel (sawtooth) and its anchor, front left
    s.esc = new THREE.Mesh(gearGeo({ r: ESC.r, teeth: 15, th: 0.5, thick: 0.35, spokes: 4, saw: true, bolts: 4 }), steel);
    s.esc.position.set(...ESC.p);
    const anchorG = ext(shapeOf([[-0.3, 0.3], [0.3, 0.3], [1.75, -1.05], [1.6, -1.8], [1.28, -1.45], [0.22, -0.5], [-0.22, -0.5], [-1.28, -1.45], [-1.6, -1.8], [-1.75, -1.05]]), 0.32, 0.04, 2);
    s.anchor = new THREE.Mesh(merge([anchorG, xf(cyl(0.34, 0.34, 0.5, 14), [0, 0, 0], [Math.PI / 2, 0, 0])]), bronze);
    s.anchor.position.set(ESC.p[0], ESC.p[1] + ESC.r + 1.0, ESC.p[2] + 0.1);
    W.add(s.esc, s.anchor); s.late.push(s.esc, s.anchor);

    // iron beams overhead + the pendulum bracket + the bell yoke
    const ib = (len) => ext(shapeOf([[-0.35, -0.5], [0.35, -0.5], [0.35, -0.38], [0.08, -0.38], [0.08, 0.38], [0.35, 0.38], [0.35, 0.5], [-0.35, 0.5], [-0.35, 0.38], [-0.08, 0.38], [-0.08, -0.38], [-0.35, -0.38]]), len, 0.03, 1);
    const PZ = SZ - 2.8, PY = 14.5, PL = 11.5;
    const iron = merge([
      xf(ib(22), [0, 12.2, -2.2], [0, Math.PI / 2, 0]), xf(ib(22), [0, 12.2, -9.6], [0, Math.PI / 2, 0]),
      xf(ib(16), [0, PY + 0.6, PZ + 1], [0, 0, 0]), xf(ib(10), [0, 11.2, 0.6], [0, Math.PI / 2, 0]),
      xf(ext(ringShape(SR, SR + 0.5, 40), 0.35, 0.05, 2), [0, FLOOR + 0.05, SZ], [Math.PI / 2, 0, 0]),
    ]);
    const ironM = new THREE.Mesh(iron, black);
    W.add(ironM); s.late.push(ironM);
    // gear-room floor with the shaft hole
    const floor = new THREE.Mesh(new THREE.RingGeometry(SR + 0.4, 46, 40, 1).rotateX(-Math.PI / 2).translate(0, FLOOR, SZ), kit.flat({ color: PAL.petrolDeep }));
    W.add(floor); s.late.push(floor);
    // the bell overhead (bronze lathe, open mouth) with clapper
    const bellG = lathe([[0, 3.4], [0.6, 3.38], [1.1, 3.2], [1.32, 2.6], [1.45, 1.7], [1.85, 0.7], [2.35, 0.18], [2.5, 0], [2.3, 0.02], [1.65, 0.45], [1.22, 1.5], [1.06, 2.55], [0.8, 3.05], [0, 3.12]], 22);
    s.bell = new THREE.Group();
    s.bell.position.set(0, 8.4 + 3.4, 0.6);
    const bellM = new THREE.Mesh(bellG.translate(0, -3.4, 0), bronze);
    const clapper = new THREE.Mesh(merge([xf(cyl(0.07, 0.07, 2.6, 6), [0, -1.6, 0]), new THREE.SphereGeometry(0.32, 10, 8).translate(0, -2.95, 0)]), black);
    s.bell.add(bellM, clapper);
    W.add(s.bell); s.late.push(s.bell);
    // the pendulum: gold rod, brass lens bob
    s.pend = new THREE.Group();
    s.pend.position.set(0, PY, PZ);
    const bob = xf(lathe([[0, 0.22], [0.6, 0.18], [0.95, 0], [0.6, -0.18], [0, -0.22]], 24), [0, -PL, 0], [Math.PI / 2, 0, 0]);
    s.pendM = new THREE.Mesh(merge([xf(cyl(0.09, 0.09, PL, 8), [0, -PL / 2, 0]), bob, xf(cyl(0.3, 0.3, 0.4, 12), [0, 0, 0], [Math.PI / 2, 0, 0])]), gold);
    s.pend.add(s.pendM);
    W.add(s.pend); s.late.push(s.pend);

    // ---- the shaft ---------------------------------------------------------------------------------
    const SH = 16, bands = [];
    for (let k = 0; k < SH; k++) bands.push(paint(new THREE.CylinderGeometry(SR, SR, 1, 40, 1, true).translate(0, FLOOR - 0.5 - k, 0), k % 2 ? 0x031a22 : PAL.petrolDeep));
    s.shaftMat = kit.flat({ vertexColors: true, side: THREE.BackSide });
    const shaft = new THREE.Mesh(merge(bands).translate(0, 0, SZ), s.shaftMat);
    W.add(shaft); s.late.push(shaft);
    s.rings = [];
    for (let k = 0; k < 6; k++) {
      const y = FLOOR - 1.3 - k * 2.3;
      if (y < EY + 3.6) break;
      const r = new THREE.Mesh(merge([new THREE.CylinderGeometry(SR - 0.06, SR - 0.06, 0.24, 40, 1, true), xf(new THREE.TorusGeometry(SR - 0.12, 0.1, 4, 40), [0, -0.2, 0], [Math.PI / 2, 0, 0])]).translate(0, y, SZ), kit.flat({ color: PAL.cyan, side: THREE.DoubleSide }));
      W.add(r); s.late.push(r); s.rings.push(r);
    }
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(SR, 40).rotateX(-Math.PI / 2).translate(0, EY - 2.2, SZ), kit.flat({ color: PAL.petrolDeep }));
    W.add(bottom); s.late.push(bottom);
    // art-deco doors at the bottom: stepped frame, two leaves with a brass sunburst, crimson light behind
    const DZ = SZ - 3.9, DB = EY - 2.0, DH = 5.0, DW = 2.2;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(7, 9).translate(0, DB + 3.0, DZ - 0.05), black);
    const fr = new THREE.Shape(); fr.moveTo(-3.2, DB - 0.3); fr.lineTo(3.2, DB - 0.3); fr.lineTo(3.2, DB + DH + 0.9); fr.lineTo(2.2, DB + DH + 0.9); fr.lineTo(2.2, DB + DH + 1.5); fr.lineTo(-2.2, DB + DH + 1.5); fr.lineTo(-2.2, DB + DH + 0.9); fr.lineTo(-3.2, DB + DH + 0.9); fr.closePath();
    const hole = new THREE.Path(); hole.moveTo(-DW, DB); hole.lineTo(-DW, DB + DH); hole.lineTo(DW, DB + DH); hole.lineTo(DW, DB); hole.closePath();
    fr.holes.push(hole);
    s.doorM = kit.toon({ ramp: 'steel', rim: PAL.cyan, key: KEY, side: THREE.DoubleSide });
    s.reliefM = kit.toon({ ramp: [PAL.black, PAL.brassDark, PAL.brass], rim: PAL.teal, key: KEY });
    const frameD = new THREE.Mesh(ext(fr, 0.4, 0.08, 2).translate(0, 0, DZ + 0.2), s.doorM);
    s.crim = new THREE.Mesh(new THREE.PlaneGeometry(DW * 2, DH).translate(0, DB + DH / 2, DZ - 0.6), kit.flat({ color: PAL.crimson }));
    s.seam = new THREE.Mesh(new THREE.PlaneGeometry(0.12, DH).translate(0, DB + DH / 2, DZ + 0.2), kit.flat({ color: PAL.crimson, additive: true }));
    const leaf = (sx) => {
      const parts = [ext(roundRect(DW - 0.04, DH - 0.04, 0.06, sx * DW / 2, DB + DH / 2), 0.16, 0.04, 2)];
      const rel = [];
      const cx = 0, cy = DB + 0.9;                          // the sunburst centre: bottom middle of both doors
      for (let k = 0; k < 5; k++) {
        const a = (sx > 0 ? 0 : Math.PI / 2) + (k + 0.5) * (Math.PI / 2 / 5);
        const L = Math.min(3.6, (DW - 0.25) / Math.max(0.01, Math.abs(Math.cos(a))), (DH - 1.25) / Math.max(0.01, Math.sin(a)));
        const ray = shapeOf([[0, 0], [Math.cos(a - 0.05) * L, Math.sin(a - 0.05) * L], [Math.cos(a + 0.05) * L, Math.sin(a + 0.05) * L]]);
        rel.push(ext(ray, 0.08, 0.02, 1).translate(cx, cy, 0.12));
      }
      const arc = new THREE.Shape(); const a0 = sx > 0 ? 0 : Math.PI / 2, a1 = a0 + Math.PI / 2;
      arc.absarc(cx, cy, 1.25, a0, a1, false); arc.absarc(cx, cy, 0.95, a1, a0, true);
      rel.push(ext(arc, 0.1, 0.02, 8).translate(0, 0, 0.12));
      const g = new THREE.Group();
      const body = new THREE.Mesh(merge(parts), s.doorM), relief = new THREE.Mesh(merge(rel), s.reliefM);
      // clip the rays to the leaf: they start at the seam and stay inside DW x DH
      relief.scale.set(1, 1, 1);
      g.add(body, relief);
      g.position.z = DZ;
      return g;
    };
    s.leafL = leaf(-1); s.leafR = leaf(1);
    W.add(wall, frameD, s.crim, s.seam, s.leafL, s.leafR); s.late.push(wall, frameD, s.crim, s.seam, s.leafL, s.leafR);
    s.doorSet = [wall, frameD, s.crim, s.leafL, s.leafR, bottom];

    // ---- the floor dial (art-deco elevator indicator) on its rails, rides down beside you -----------
    s.dial = new THREE.Group();
    kit.place(s.dial, { d: 4.0, az: 46, y: 1.0 });
    s.dialHome = s.dial.position.clone();
    s.dialSink = s.sink.d(42.3);                     // world-fixed on the shaft wall: at eye-ish height at 42.3
    // Round 4: a full round floor indicator that reads at a glance: black back drum, brass bezel, cream face,
    // black numerals B..10 on a 240 deg arc, crimson hand under a brass pivot cap (was a gold half-disc wedge)
    const DR0 = 1.45;
    s.plateMat = kit.toon({ ramp: 'cream', rim: null, key: [0, 0.3, 0.95] });
    s.bezMat = kit.toon({ ramp: BR, rim: PAL.cyan, key: [0.3, 0.5, 0.8] });
    s.dial.add(new THREE.Mesh(xf(cyl(DR0 + 0.32, DR0 + 0.32, 0.3, 40), [0, 0, -0.17], [Math.PI / 2, 0, 0]), black));
    s.dial.add(new THREE.Mesh(new THREE.CircleGeometry(DR0, 40), s.plateMat));
    s.dial.add(new THREE.Mesh(merge([ext(ringShape(DR0 - 0.02, DR0 + 0.26, 48), 0.2, 0.05, 2), xf(cyl(0.2, 0.2, 0.16, 16), [0, 0, 0.14], [Math.PI / 2, 0, 0])]), s.bezMat));
    s.dA = (fl) => (210 - 24 * fl) * D2R;
    s.nums = [];
    [['B', 0], ['5', 5], ['10', 10]].forEach(([lb, k]) => {
      const a = s.dA(k);
      const T = makeText(lb, { cap: 0.5, color: PAL.black, align: 'center', vAlign: 'middle', slant: 0 }, kit.SU);
      T.mesh.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.05);
      s.dial.add(T.mesh); s.nums.push(T);
    });
    s.needle = new THREE.Mesh(merge([ext(shapeOf([[-0.07, -0.34], [0.07, -0.34], [0.05, 0.62], [0.14, 0.62], [0, 1.02], [-0.14, 0.62], [-0.05, 0.62]]), 0.05, 0.015, 1), xf(cyl(0.17, 0.17, 0.08, 14), [0, -0.3, 0], [Math.PI / 2, 0, 0])]), kit.flat({ color: PAL.crimson, edgeKeep: 1 }));
    s.needle.position.z = 0.1;
    s.dial.add(s.needle);
    kit.group.add(s.dial);
    // its rails (static in the world, they rise past)
    const az = 40 * D2R, rx = Math.sin(az) * 4.25, rz = -Math.cos(az) * 4.25;
    const ux = Math.cos(az), uz = Math.sin(az);
    const rails = merge([-1, 1].map((k) => xf(new THREE.BoxGeometry(0.16, 22, 0.16), [rx + k * 1.35 * ux, FLOOR - 7, rz + k * 1.35 * uz + SZ])));
    rails.dispose(); // Round 4: the two thin 22 m rails read as bars; the dial now hangs on the wall by its back drum

    // ---- lyrics (one block at a time) ------------------------------------------------------------
    const L1 = { d: 5.8, az: -13, y: 0.95 };
    kit.text('TICK, TICK,', { cap: 0.88, color: 'cream', near: 36.34, say: 'tick tick', out: 38.86, outDur: 0.12, at: L1 });
    kit.text('FEEL THE\nCITY BREATHE', { cap: 0.8, color: 'cream', colors: { 3: 'gold' }, near: 39.0, out: 40.32, outDur: 0.18, at: L1 });
    kit.text('TEN FLOORS', { cap: 0.62, color: 'gold', near: 40.52, out: 41.05, outDur: 0.15, at: { d: 4.0, az: -21, y: 1.15 } });
    kit.text('UNDER WHAT\nYOU BELIEVE', { cap: 0.52, color: 'cream', near: 41.22, out: 42.55, outDur: 0.18, at: { d: 4.0, az: -21, y: 1.15 } });
    kit.text('HOLD YOUR\nBREATH...', { cap: 0.54, color: 'cream', near: 42.76, out: 44.62, outDur: 0.2, at: { d: 3.8, az: -21, y: 2.45 } });
    kit.text('HERE WE GO', { cap: 0.5, color: 'gold', near: 44.9, out: 47.1, outDur: 0.25, depthTest: false, at: { d: 3.1, az: 0, y: 3.15 } });

    for (const o of s.late) o.userData.late = true;
    return s;
  },
  update(t, s, kit) {
    const fwd = s.fwd.d(t), sink = s.sink.d(t);
    s.W.position.set(0, sink, fwd);
    const shown = t >= T0;
    for (const o of s.late) o.visible = shown;
    for (const g of s.gears) if (g.shaft) g.piv.visible = shown && t >= s.ten - 0.05; // seen from above through the hole they read as blobs
    for (const o of s.doorSet) o.visible = shown && t >= 44.55;
    const lightD = 0.3 + 0.7 * sm(s.we, s.go + 0.3, t);
    s.doorM.uniforms.uBright.value = lightD; s.reliefM.uniforms.uBright.value = lightD;
    const te = Math.min(t, s.breath + 0.1);                // "breath...": all motion stops
    const steps = sm(s.tk1, s.tk1 + 0.1, t) + sm(s.tk2, s.tk2 + 0.1, t);
    // gears: slow turn + one step per sung tick
    for (const g of s.gears) g.m.rotation.z = g.dir * (g.w * (te - T0) + g.st * steps) * D2R;
    // escape wheel clicks one tooth per pendulum swing, the anchor rocks
    const ph = (te - s.tk1) / s.h;
    const swing = Math.floor(ph), frac = ph - swing;
    s.esc.rotation.z = -(swing + sm(0, 0.12, frac)) * (24 * D2R);
    s.anchor.rotation.z = (swing % 2 ? 1 : -1) * 0.07 * (1 - 2 * sm(0, 0.2, frac));
    const amp = 6 * D2R * (1 - sm(s.hold, s.breath, t));
    s.pend.rotation.z = amp * Math.cos(Math.PI * ph);
    s.bell.rotation.z = 0.03 * Math.sin((t - s.tk1) * 5) * env(t, s.tk1, 1.2) + 0.03 * Math.sin((t - s.tk2) * 5) * env(t, s.tk2, 1.2);
    // hands: minute steps on each tick (from behind time runs counter-clockwise)
    s.minH.rotation.z = (48 + 6 * steps) * D2R;
    s.hourH.rotation.z = (300 + 0.5 * steps) * D2R;
    // the city breathes: two swells over 2 beats from "feel"
    const br = t >= s.feel && t < s.feel + 1.6 ? Math.pow(Math.sin(((t - s.feel) / 1.6) * Math.PI * 2), 2) : 0;
    const tick = env(t, s.tk1, 5) + env(t, s.tk2, 5);
    // going down: the city behind the dial goes dark (storyboard: "Dark"), the window turns to a black disc
    const cityK = 1 - sm(s.ten - 0.1, s.ten + 0.35, t);
    s.glow.material.uniforms.uBright.value = (0.75 + 0.7 * br) * cityK;
    for (const o of [s.glow, s.cityFar, s.cityNear, s.wins]) o.visible = cityK > 0.02;
    s.wins.material.uniforms.uBright.value = 0.7 + 0.8 * br;
    s.ring.material.uniforms.uBright.value = 0.85 + 0.35 * br + 0.3 * tick;
    // shaft: rings go out top to bottom on "hold", the wall dims
    const dark = sm(s.hold - 0.05, s.hold + 0.5, t);
    s.shaftMat.uniforms.uBright.value = 1 - 0.55 * dark;
    s.rings.forEach((r, k) => { r.visible = r.userData.late && t >= T0 && t < s.hold + k * 0.14; });
    // floor dial: mounted on the shaft wall (world-fixed, 0.5 m in front of the wall, 4 m from you); you sink past
    // it while the needle sweeps 10 to B. Nothing travels with the player (integration fix, 07.11.).
    s.dial.visible = t >= s.floors + 0.15 && t < 45.3;
    s.dial.position.copy(s.dialHome);
    s.dial.position.y += sink - s.dialSink;
    let f = 10 - 9 * sm(s.floors, s.believe, t) - sm(s.hold, s.breath, t);
    if (t > s.breath) f += 0.07 * Math.sin(t * 43) * env(t, s.breath, 1.3);
    s.needle.rotation.z = s.dA(f) - Math.PI / 2;
    s.plateMat.uniforms.uBright.value = 1 - 0.75 * dark; s.bezMat.uniforms.uBright.value = 1 - 0.75 * dark;
    for (const k of ['shL', 'shR', 'shZ']) s.gm[k].uniforms.uBright.value = 1 - 0.7 * dark;
    for (const T of s.nums) T.u.uOpacity.value = 1 - 0.85 * dark;
    // doors: crimson seam on "here", part on "we", open on "go", light floods then dies into black
    s.seam.visible = t >= s.here && t < s.we + 0.3;
    s.seam.material.uniforms.uOpacity.value = sm(s.here, s.here + 0.15, t);
    const open = sm(s.we, s.go + 0.35, t);
    s.leafL.position.x = -2.3 * open; s.leafR.position.x = 2.3 * open;
    s.crim.material.uniforms.uBright.value = (0.6 + 0.8 * env(t, s.go, 1.5)) * (1 - sm(46.7, 47.3, t));
    kit.fade(1 - sm(47.0, 47.38, t));
    if (kit.isOwner) kit.setSky({ stars: 0.5 * (1 - dark) });
  },
  events() {
    return [
      { t: 36.34, sfx: 'tick', gain: 0.5 }, { t: 38.6, sfx: 'tick', gain: 0.5 },
      { t: 40.52, sfx: 'motor', gain: 0.4, haptic: [0.3, 80] },
      { t: 45.3, sfx: 'hatch', gain: 0.5 }, { t: 46.3, sfx: 'whoosh', gain: 0.4 },
    ];
  },
};
