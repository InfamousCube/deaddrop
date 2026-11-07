// S10 One red light, the game begins (77.30-84.70, cold to red). Round 3 rebuild (storyboard v3).
// SHOT CARD
//   hero A (77.62-81.2): a real rotating alarm beacon (chrome base, ribbed red dome) on an art-deco
//            column at the far end of the vault, 13.5 m ahead. Its red beam turns once per 2 beats and
//            paints the 16 tall wall panels around you red, one after another; the room turns red.
//   hero B (81.2-84.0): the floor is a giant chessboard (2.6 m squares, you stand in the middle) and two
//            Staunton armies rise out of their squares left (cream) and right (black, red rim): rooks
//            first, kings last beside you. On "begins" both pawn rows step one square toward you (4 m).
//   around: the wall panels all around (R 20 m), the armies left and right (4-9 m), the beam overhead.
//   palette: black + petrol, then black + crimson; cream / black pieces; beacon red.
//   lyric: centre, d 6, low over the board between the armies (depthTest false), one block at a time.
//   out: the centre ranks drop away far to near (<= 3 m/s), you sink 1.5 m/s into the black hole, the
//        pawn rows rise past at >= 3.9 m; fade to black 84.40-84.70 (S11 fades up from black).
import * as THREE from 'three';
import { PAL } from './style.js';
import {
  D2R, sm, lin, lerp, env, clamp01, easeOut, setI, inst, instColors, merge, lathe, ribbed, shapeOf, extrude, rrect, circ,
  bbox, box, beam, NEUTRAL, TMP,
} from './scenes-3-util.js';

const SQ = 2.6, HALF = 4 * SQ;                          // 8 x 8 squares of 2.6 m
const fz = (f) => -HALF + SQ * (f + 0.5);               // file 0..7 -> z (0 = far end, 7 = behind you)
const rx = (r) => -HALF + SQ * (r + 0.5);               // rank 0..7 -> x (cream ranks 0/1 left, black 6/7 right)
const BEAT = 60 / 105.74;
const OMEGA = (2 * Math.PI) / (2 * BEAT);                // one turn per 2 beats (0.88 Hz)
const COL = { z: -12.5, h: 6.0 };                       // beacon column at the far end, on the axis
const WALL = { n: 16, r: 20 };
const RS = 2.0;                                          // radial scale of all pieces (base r 0.84 m)
const H = { pawn: 2.3, rook: 2.7, knight: 3.0, bishop: 3.4, queen: 4.0, king: 4.4 };
const BACK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];   // files a..h (queen on d, king on e)
const RISE = { rook: 0, knight: 0.2, bishop: 0.4, queen: 0.6, pawn: 0.78 };               // offsets after "second"

// ---- Staunton profiles (unit height, radius in the same unit; scaled by RS / H) ----------------
const FOOT = [[0, 0], [0.42, 0], [0.42, 0.065], [0.38, 0.09], [0.38, 0.12], [0.3, 0.165]];
const P_PAWN = FOOT.concat([[0.23, 0.3], [0.17, 0.46], [0.28, 0.5], [0.28, 0.54], [0.15, 0.57], [0.13, 0.62], [0.17, 0.66], [0.205, 0.72], [0.215, 0.78], [0.2, 0.85], [0.15, 0.92], [0.08, 0.97], [0, 0.99]]);
const P_ROOK = FOOT.concat([[0.28, 0.3], [0.26, 0.62], [0.3, 0.66], [0.36, 0.7], [0.36, 0.9], [0.27, 0.9], [0.27, 0.84], [0, 0.84]]);
const P_KNIGHT_BASE = FOOT.concat([[0.28, 0.22], [0.33, 0.25], [0.33, 0.3], [0, 0.3]]);
const P_BISHOP = FOOT.concat([[0.21, 0.35], [0.15, 0.52], [0.25, 0.56], [0.25, 0.59], [0.13, 0.62], [0.17, 0.66], [0.21, 0.72], [0.22, 0.78], [0.19, 0.85], [0.13, 0.91], [0.06, 0.95], [0.065, 0.96], [0.065, 1.0], [0, 1.02]]);
const P_QUEEN = FOOT.concat([[0.2, 0.4], [0.15, 0.62], [0.24, 0.66], [0.24, 0.69], [0.15, 0.72], [0.18, 0.8], [0.27, 0.92], [0.25, 0.94], [0.12, 0.93], [0.1, 0.97], [0, 0.98]]);
const P_KING = FOOT.concat([[0.2, 0.42], [0.16, 0.62], [0.25, 0.66], [0.25, 0.69], [0.16, 0.72], [0.2, 0.8], [0.24, 0.86], [0.2, 0.88], [0.08, 0.88], [0.08, 0.9], [0, 0.9]]);
// knight head, side view facing +x (unit space, y from the collar up)
const HEAD = [[-0.26, 0.3], [-0.3, 0.48], [-0.27, 0.66], [-0.18, 0.84], [-0.1, 1.0], [-0.04, 0.92], [0.06, 0.88], [0.18, 0.8], [0.3, 0.68], [0.38, 0.58], [0.37, 0.5], [0.28, 0.47], [0.16, 0.5], [0.08, 0.46], [0.12, 0.38], [0.22, 0.3]];

function pieceGeo(type) {
  const h = H[type];
  const sc = (g) => g.scale(RS, h, RS);
  const ball = (r, x, y, z) => new THREE.IcosahedronGeometry(r, 1).scale(1, RS / h, 1).translate(x, y, z);
  const parts = [];
  if (type === 'pawn') parts.push({ g: sc(lathe(P_PAWN, 18)) });
  if (type === 'rook') {
    parts.push({ g: sc(lathe(P_ROOK, 18)) });
    for (let i = 0; i < 5; i++) { // five merlons on the castellated rim
      const a = (i / 5) * Math.PI * 2;
      parts.push({ g: sc(box(0.17, 0.1, 0.09, 0, 0.95, 0).rotateY(a).translate(Math.sin(a) * 0.315, 0, Math.cos(a) * 0.315)) });
    }
  }
  if (type === 'knight') {
    parts.push({ g: sc(lathe(P_KNIGHT_BASE, 18)) });
    const head = extrude(shapeOf(HEAD), 0.3, 0.035, { curve: 2 });
    parts.push({ g: sc(head) });
    parts.push({ g: sc(box(0.05, 0.05, 0.36, 0.1, 0.78, 0)), c: 0.05 }); // the eye, a dark notch through the head
  }
  if (type === 'bishop') {
    parts.push({ g: sc(lathe(P_BISHOP, 18)) });
    parts.push({ g: sc(new THREE.CylinderGeometry(0.232, 0.232, 0.03, 18).rotateZ(0.6).translate(0, 0.8, 0)), c: 0.04 }); // the mitre slit
  }
  if (type === 'queen') {
    parts.push({ g: sc(lathe(P_QUEEN, 18)) });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; parts.push({ g: ball(0.05 * RS, Math.sin(a) * 0.265 * RS, 0.95 * h, Math.cos(a) * 0.265 * RS) }); }
    parts.push({ g: ball(0.07 * RS, 0, 1.0 * h, 0) });
  }
  if (type === 'king') {
    parts.push({ g: sc(lathe(P_KING, 18)) });
    const cross = shapeOf([[-0.035, 0.88], [0.035, 0.88], [0.035, 0.95], [0.1, 0.95], [0.1, 1.0], [0.035, 1.0], [0.035, 1.07], [-0.035, 1.07], [-0.035, 1.0], [-0.1, 1.0], [-0.1, 0.95], [-0.035, 0.95]]);
    parts.push({ g: sc(extrude(cross, 0.06, 0.012, { curve: 1 })) });
  }
  return merge(parts);
}

// one art-deco wall panel (front faces +z), 7.2 x 13 m: stepped crown, bevelled frame, recessed plate, rivet row
function panelGeo() {
  const outer = [[-3.6, 0], [3.6, 0], [3.6, 10.6], [2.9, 11.3], [2.9, 12.1], [1.7, 12.9], [-1.7, 12.9], [-2.9, 12.1], [-2.9, 11.3], [-3.6, 10.6]];
  const hole = [[-2.7, 1.2], [2.7, 1.2], [2.7, 9.4], [1.6, 10.2], [-1.6, 10.2], [-2.7, 9.4]];
  const parts = [{ g: extrude(shapeOf(outer, [hole]), 0.5, 0.14, { curve: 1 }), c: 1 }];
  parts.push({ g: extrude(hole, 0.16, 0.05, { curve: 1 }).translate(0, 0, -0.28), c: 0.55 });
  for (let i = 0; i < 2; i++) parts.push({ g: bbox(4.2, 0.28, 0.2, 0.06, 0, 3.6 + i * 3.4, -0.12), c: 0.7 }); // two deco bands
  return merge(parts);
}

export const S10 = {
  id: 'S10', t0: 77.3, t1: 84.7, world: 'cold', pre: 0, post: 0,
  key: [0.3, 0.85, 0.42],
  fog: { color: PAL.black, near: 14, far: 60 },
  sky: { stars: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, rays: 0 },
  flashes: [{ t: 77.62, color: PAL.crimson, dur: 0.03 }],
  build(kit) {
    const s = { tmpC: new THREE.Color() };
    const W = kit.words;
    const tw = (txt, near) => W.times(txt, near);
    const [tOne] = tw('one red light', 77.62);
    const [, , tWhole] = tw('and the whole', 78.54);
    const tThats = tw("that's", 81.18)[0], tSecond = tw('second', 81.72)[0];
    const tGame = tw('game', 82.9)[0], tBegins = tw('begins', 83.36)[0];
    Object.assign(s, { tOne, tWhole, tThats, tSecond, tGame, tBegins });

    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    const lift = (s.lift = new THREE.Group()); // vertical frame: you rise 0.5 m, then sink into the hole
    root.add(lift);

    // the vault floor around the board (a ring: the hole under the board is open to black)
    const fl = shapeOf(rrect(70, 70, 1, 0, 0, 1), [rrect(22.6, 22.6, 0.4, 0, 0, 2)]);
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(fl).rotateX(-Math.PI / 2).translate(0, -0.32, 0), kit.toon({ ramp: [PAL.black, PAL.black, PAL.velvet], rim: null }));
    lift.add(floor);
    // bevelled board frame
    const frame = extrude(shapeOf(rrect(22.6, 22.6, 0.4, 0, 0, 2), [rrect(20.8, 20.8, 0.05, 0, 0, 1)]), 0.32, 0.1, { curve: 2 }).rotateX(-Math.PI / 2).translate(0, -0.12, 0);
    s.frame = new THREE.Mesh(frame, kit.toon({ ramp: 'world', rim: 'world' }));
    lift.add(s.frame);

    // 64 bevelled squares, coloured per frame (beam, red light, the drop)
    const tg = extrude(rrect(2.48, 2.48, 0.08, 0, 0, 1), 0.26, 0.05, { curve: 1 }).rotateX(-Math.PI / 2).translate(0, -0.18, 0);
    s.tiles = instColors(inst(tg, kit.toon({ ramp: NEUTRAL, rim: null }), 64, 's10-board'), 0x000000);
    s.tileInfo = [];
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const x = rx(r), z = fz(f);
      const centre = r >= 2 && r <= 5; // the four empty ranks between the armies drop
      s.tileInfo.push({ x, z, light: (r + f) % 2 === 1, ang: Math.atan2(x, z - COL.z), drop: centre ? 84.04 + (1 - (f / 7)) * 0 + (f / 7) * 0.32 : Infinity });
    }
    lift.add(s.tiles);

    // the armies: one instanced mesh per piece type and colour
    const creamMat = kit.toon({ ramp: [0x8c7c64, PAL.creamDark, PAL.cream], rim: PAL.gold, rimTh: 0.8 });
    const blackMat = kit.toon({ ramp: [PAL.black, 0x0d0d12, 0x2a2a33], rim: PAL.crimson, rimTh: 0.68 });
    const types = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
    s.pieces = [];
    for (const type of types) {
      const g = pieceGeo(type);
      for (const side of [0, 1]) {
        const list = [];
        if (type === 'pawn') for (let f = 0; f < 8; f++) list.push({ f, r: side ? 6 : 1 });
        else BACK.forEach((b, f) => { if (b === type) list.push({ f, r: side ? 7 : 0 }); });
        const mesh = inst(g, side ? blackMat : creamMat, list.length, `s10-${type}-${side}`);
        lift.add(mesh);
        s.pieces.push({ type, side, mesh, list, h: H[type] });
      }
    }

    // the room: 16 tall art-deco wall panels around you, lit red one after another by the beam
    s.walls = instColors(inst(panelGeo(), kit.toon({ ramp: 'world', vertexColors: true, rim: 'world', rimTh: 0.78 }), WALL.n, 's10-walls'), 0x000000);
    s.wallAng = [];
    for (let i = 0; i < WALL.n; i++) {
      const a = (i / WALL.n) * Math.PI * 2 + Math.PI / WALL.n;
      const x = Math.sin(a) * WALL.r, z = Math.cos(a) * WALL.r;
      setI(s.walls, i, x, -0.32, z, 0, a + Math.PI, 0);
      s.wallAng.push(Math.atan2(x, z - COL.z));
    }
    lift.add(s.walls);

    // the beacon column (fluted art-deco shaft) and the beacon itself
    const colG = ribbed(lathe([[0, 0], [1.9, 0], [1.9, 0.3], [1.55, 0.45], [1.55, 0.7], [1.05, 0.9], [0.85, 1.2], [0.75, COL.h - 0.9], [1.05, COL.h - 0.7], [1.5, COL.h - 0.45], [1.5, COL.h], [0, COL.h]], 48), 12, 0.07, 1.25, COL.h - 0.95);
    const col = new THREE.Mesh(colG, kit.toon({ ramp: [PAL.black, 0x0a0a0e, 0x1d1d24], rim: 'world', rimTh: 0.5 }));
    col.position.set(0, -0.32, COL.z);
    lift.add(col);
    const bc = (s.beacon = new THREE.Group());
    bc.position.set(0, COL.h - 0.32, COL.z);
    bc.scale.setScalar(1.8);
    lift.add(bc);
    const base = merge([
      { g: lathe([[0, 0], [1.2, 0], [1.24, 0.06], [1.24, 0.36], [1.13, 0.44], [0, 0.44]], 32), c: 0xc9d2d8 },
      { g: lathe([[1.05, 0.44], [1.09, 0.48], [1.09, 0.56], [1.0, 0.58], [0.9, 0.58], [0.9, 0.44]], 32), c: 0x8a949c },
    ]);
    for (let i = 0; i < 8; i++) { /* bolt heads around the base */ }
    bc.add(new THREE.Mesh(base, kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.cyan })));
    const domeG = ribbed(lathe([[1.0, 0.52], [1.0, 1.0], [0.96, 1.28], [0.85, 1.52], [0.64, 1.71], [0.34, 1.83], [0, 1.87]], 64), 16, 0.05, 0.5, 1.6);
    s.domeMat = kit.toon({ ramp: [0x3a0004, PAL.crimson, PAL.red, 0xff8a7a], rim: 0xff5a4a, rimTh: 0.7 });
    s.dome = new THREE.Mesh(domeG, s.domeMat);
    bc.add(s.dome);
    // the turning parabolic mirror and bulb inside, seen as a dark slot that sweeps round the dome
    const mir = merge([{ g: lathe([[0, 0], [0.3, 0.05], [0.55, 0.2], [0.68, 0.38]], 12).rotateX(Math.PI / 2).translate(0, 1.1, -0.3), c: 0x200002 }]);
    s.mirror = new THREE.Mesh(mir, kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: null }));
    s.mirrorG = new THREE.Group(); s.mirrorG.add(s.mirror); bc.add(s.mirrorG);
    // the beam: one flat red cone, 12 deg half-angle, tilted 6 deg up so it always clears your head
    const cone = new THREE.ConeGeometry(Math.tan(12 * D2R) * 26, 26, 28, 1, true).translate(0, -13, 0).rotateX(-Math.PI / 2);
    s.beamMat = kit.flat({ color: PAL.crimson, opacity: 0.2, additive: true, fog: 0.3, side: THREE.DoubleSide });
    s.beam = new THREE.Mesh(cone, s.beamMat);
    s.beamG = new THREE.Group(); s.beamG.position.y = 1.15; s.beamG.add(s.beam); bc.add(s.beamG);
    s.beam.rotation.x = -6 * D2R;
    s.glow = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), kit.flat({ color: PAL.red, opacity: 0.35, additive: true, fog: 0.2, depthWrite: false }));
    s.glow.position.set(0, 1.15, 1.2);
    bc.add(s.glow);

    // lyric blocks: centre, low over the board, between the armies
    const AT = { d: 6.2, az: 0, y: 1.65 };
    kit.text('ONE RED\nLIGHT', { cap: 1.0, color: 'cream', colors: { 1: PAL.crimson }, near: 77.62, say: 'one red light', out: 78.45, depthTest: false, at: AT });
    kit.text('AND THE WHOLE\nROOM SPINS', { cap: 0.86, color: 'cream', near: 78.54, say: 'and the whole room spins', out: 81.0, depthTest: false, at: AT });
    kit.text("THAT'S THE\nSECOND", { cap: 0.95, color: 'cream', near: 81.18, say: "that's the second", out: 82.35, depthTest: false, at: AT });
    kit.text('THE GAME\nBEGINS', { cap: 0.9, color: 'gold', near: 82.42, say: 'the game begins', out: 84.0, depthTest: false, at: { ...AT, y: 1.4 } });

    s.sink = kit.travel([[84.08, 0, 0.01], [84.1, 1.5, 1.0]]);
    return s;
  },
  update(t, s, kit) {
    const on = t >= s.tOne;
    s.root.visible = t >= 77.3;
    // the beam angle (0 = toward you); it starts pointing away
    const th = Math.PI + Math.max(0, t - s.tOne) * OMEGA;
    s.beamG.rotation.y = th;
    s.mirrorG.rotation.y = th;
    s.beamG.visible = on; s.glow.visible = on;
    const face = Math.max(0, Math.cos(th));              // beam toward you
    s.domeMat.uniforms.uBright.value = on ? 0.9 + 1.4 * Math.pow(face, 6) + 0.5 * env(t, s.tOne, 5) : 0.06;
    s.glow.material.uniforms.uOpacity.value = 0.12 + 0.45 * Math.pow(face, 8);
    const red = on ? Math.max(sm(s.tWhole - 0.25, s.tWhole, t), 0.6 * Math.pow(Math.max(0, -Math.cos(th)), 6) * sm(s.tOne, s.tOne + 0.3, t)) : 0;
    if (kit.isOwner) kit.setWorld('hot', red);
    const wrap = (a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const since = (ang) => wrap(th - ang) / OMEGA;        // seconds since the beam passed this angle
    const turns = Math.max(0, t - s.tOne);
    // wall panels: dark petrol, flare red as the beam passes (only once the beam has reached them)
    for (let i = 0; i < WALL.n; i++) {
      const lag = since(s.wallAng[i]);
      const k = on && lag <= turns ? Math.exp(-lag * 7) : 0;
      s.tmpC.setRGB(1, 1, 1).multiplyScalar(0.045 + 0.075 * red + 1.15 * k);
      if (!on) s.tmpC.setRGB(0, 0, 0);
      s.walls.setColorAt(i, s.tmpC);
    }
    s.walls.instanceColor.needsUpdate = true;
    // the board: unseen until the beam crosses it; squares show in the red light from "That's"
    const lit = sm(s.tThats, s.tThats + 0.35, t);
    const cl = TMP.c, cd = TMP.c2;
    for (let i = 0; i < 64; i++) {
      const T = s.tileInfo[i];
      const lag = since(T.ang);
      const b = on && lag <= turns ? Math.exp(-lag * 4) : 0;
      if (T.light) { s.tmpC.set(PAL.crimson); cl.set(PAL.teal).lerp(s.tmpC, red); cl.multiplyScalar(0.04 + 0.36 * b + 0.16 * lit); }
      else { s.tmpC.set(PAL.carmineDeep); cl.set(PAL.petrolDeep).lerp(s.tmpC, red); cl.multiplyScalar(0.03 + 0.1 * b + 0.05 * lit); }
      s.tiles.setColorAt(i, cl);
      // the drop (pure in t): centre ranks fall from the far end toward you, at most 3 m/s
      let y = 0;
      if (t > T.drop) { const a = t - T.drop; y = -(a < 0.5 ? 3 * a * a : 0.75 + 3 * (a - 0.5)); }
      setI(s.tiles, i, T.x, y, T.z);
    }
    s.tiles.instanceColor.needsUpdate = true;
    s.tiles.instanceMatrix.needsUpdate = true;
    // pieces rise row by row ("second"), kings last ("game"), pawns step toward you ("begins")
    for (const P of s.pieces) {
      const t0 = P.type === 'king' ? s.tGame : s.tSecond + (RISE[P.type] ?? 0);
      const k = easeOut(lin(t0, t0 + 0.6, t));
      const step = sm(s.tBegins, s.tBegins + 0.45, t);
      P.list.forEach((q, i) => {
        let x = rx(q.r), y = -P.h - 0.3 + (P.h + 0.3) * k;
        if (P.type === 'pawn') { x += (q.r < 4 ? 1 : -1) * SQ * step; y += 0.35 * Math.sin(Math.PI * step); }
        const yaw = P.type === 'knight' ? (P.side ? Math.PI : 0) : 0;
        setI(P.mesh, i, x, k > 0.001 ? y : -50, fz(q.f), 0, yaw, 0);
      });
      P.mesh.instanceMatrix.needsUpdate = true;
    }
    // you rise 0.5 m to see the board, then sink into the hole
    s.lift.position.y = -0.5 * sm(81.0, 83.0, t) + s.sink.d(t);
    kit.fade(on ? 1 - sm(84.4, 84.7, t) : 0);  // kit.fade(k): k = brightness
    s.frame.visible = on;
    if (kit.isOwner) kit.setSky({ zen: PAL.black, hor: PAL.black, hor2: PAL.black, nadir: PAL.black, rays: 0, stars: 0 });
  },
  events() {
    return [
      { t: 77.62, sfx: 'switch', gain: 0.6, haptic: [0.3, 40] },
      { t: 81.72, sfx: 'motor', gain: 0.4 },
      { t: 83.36, sfx: 'key', gain: 0.5 },
      { t: 84.06, sfx: 'drop', gain: 0.5, haptic: [0.4, 80] },
    ];
  },
};
