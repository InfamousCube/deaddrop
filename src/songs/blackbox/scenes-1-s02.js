// S02 The roulette wheel (7.90 to 17.20, hot). Round 3, storyboard v3.
// SHOT CARD
//   what     the card has been dealt: you hover over the turret of a giant roulette wheel (24 m) in a dark
//            casino; the ball races once around you, bounces off a diamond and lands on the gold zero.
//   hero     the wheel: black bowl with a crimson lip, cream-gold ball track with 8 diamond deflectors, 37
//            pockets (crimson / black, the 0 gold) between bevelled brass frets, the cone and the cross-handle
//            turret right under you; big numerals 3 2 1 0 on four neighbouring pockets light on the countdown
//   around   the ball circles 360 deg at 10.75 m (left, behind, right, front); a 3-tier crystal chandelier
//            overhead; two giant chip stacks left and right beyond the rim; black casino
//   palette  black + crimson pockets + gold zero, lights and frets + cream ball, track and crystals
//   motion   the wheel turns 2 deg/s against the ball; 8.06-9.48 the ball run; 12.80 a gold light runs once
//            round the rim; 14.56 the chandelier flares
//   lyrics   centre, d 7 at eye level, over the far rim (depthTest off)
//   out      LIGHTS OUT 15.10-15.85 (chandelier, bowl, track, pockets), only the gold ball glows; 16.0 it hops out
//            of the 0 and rolls away down the dark street, lighting S03's lamps (S03 pre 1.0)
import * as THREE from 'three';
import { PAL } from './style.js';
import { lathe, ext, polyShape, inst, setM, scratch, merge, tube, buildChandelier, ballOut, BALL_R, D2R } from './scenes-1-util.js';

const N = 37, DA = (Math.PI * 2) / N;
const Y = { lip: -2.2, trackHi: -2.5, trackLo: -3.35, pocket: -4.5, fret: -4.08 };
const R = { lip: 12.8, trackHi: 12.4, trackLo: 10.0, pOut: 9.5, pIn: 7.1, run: 10.75, pocket: 8.3 };
const WSPIN = 2 * D2R;       // wheel rad/s (az increasing), zero angle at 16.0 (the 0 straight ahead when it goes dark)
const T_LAUNCH = 7.98, T_LAND_PAD = 0;
const OFF = [15.1, 15.35, 15.6, 15.85]; // lights out: chandelier, bowl + lip, track + diamonds, pockets + turret
const LYR = { d: 7, az: 0, y: 1.25 };

const trackY = (r) => Y.trackLo + ((r - R.trackLo) / (R.trackHi - R.trackLo)) * (Y.trackHi - Y.trackLo);
const wheelAng = (t) => WSPIN * (Math.min(t, 16.0) - 16.0);

export const S02 = {
  id: 'S02', t0: 7.9, t1: 17.2, world: 'hot', pre: 0.45, post: 0,
  key: [0.15, 0.85, -0.5],
  fog: { color: PAL.velvet, near: 18, far: 60 },
  sky: { rays: 0, rings: 0, sunR: 0, zen: PAL.velvet, hor2: PAL.velvet, hor: PAL.carmineDeep, nadir: PAL.velvet },
  build(kit) {
    const s = { x: scratch(), b: new THREE.Vector3() };
    const W = (txt, near) => kit.words.times(txt, near)[0];
    s.tCount = W('count', 8.06); s.tDown = W('down', 8.9); s.tTo = W('to', 9.3); s.tZero = W('zero', 9.48);
    s.tGold = W('gold', 12.8); s.tTonight = W('tonight', 14.56);
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    // ---- static bowl: wooden band, lip, ball track (one lathe each), crimson lip line
    s.bowl = new THREE.Group(); root.add(s.bowl);
    const bowlG = lathe([[13.4, -6.5], [13.4, -2.35], [12.55, -2.15], [12.5, -2.4]], 64);
    s.bowl.add(new THREE.Mesh(bowlG, kit.toon({ ramp: [PAL.black, PAL.velvet, PAL.velvet], rim: null })));
    s.lipMat = kit.flat({ color: PAL.crimson });
    s.bowl.add(new THREE.Mesh(new THREE.TorusGeometry(R.lip + 0.2, 0.24, 4, 96).rotateX(Math.PI / 2).translate(0, Y.lip + 0.05, 0), s.lipMat));
    s.track = new THREE.Group(); root.add(s.track);
    const trackG = lathe([[12.5, -2.4], [9.6, Y.trackLo - 0.1], [9.5, -3.9]], 64);
    s.track.add(new THREE.Mesh(trackG, kit.toon({ ramp: [0xcfc2a6, 0xe2d6bf, PAL.cream], rim: null })));
    // 8 diamond deflectors (rhombus extrusions with bevel), 4 upright, 4 flat
    const dia = ext(polyShape([[0, -0.55], [0.32, 0], [0, 0.55], [-0.32, 0]]), 0.16, 0.05, 1);
    const dm = inst(dia, kit.toon({ ramp: 'gold', rim: null }), 8, 's02-diamonds');
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) * (Math.PI / 4), r = 10.6, x = Math.sin(a) * r, z = -Math.cos(a) * r;
      if (i % 2) setM(dm, i, x, trackY(r) + 0.12, z, -a, 1, -Math.PI / 2 + 0.28);
      else setM(dm, i, x, trackY(r) + 0.5, z, -a + Math.PI / 2, 1);
    }
    s.track.add(dm);
    // ---- rotating wheel head: pockets, frets, numerals, cone, turret
    s.wheel = new THREE.Group(); root.add(s.wheel);
    s.pockets = new THREE.Group(); s.wheel.add(s.pockets);
    const sector = [];
    const a0 = -DA * 0.45, a1 = DA * 0.45;
    for (let i = 0; i <= 4; i++) { const a = a0 + (a1 - a0) * (i / 4); sector.push([Math.sin(a) * R.pOut, Math.cos(a) * R.pOut]); }
    for (let i = 4; i >= 0; i--) { const a = a0 + (a1 - a0) * (i / 4); sector.push([Math.sin(a) * R.pIn, Math.cos(a) * R.pIn]); }
    const pocketG = ext(polyShape(sector), 0.2, 0, 1, 2); pocketG.rotateX(-Math.PI / 2); // shape y -> -z (outward ahead)
    s.pm = inst(pocketG, kit.toon({ ramp: [PAL.velvet, 0x8a8a8a, PAL.white], rim: null }), N, 's02-pockets');
    const cr = new THREE.Color(PAL.crimson), bl = new THREE.Color(0x1a1418), go = new THREE.Color(PAL.gold);
    for (let k = 0; k < N; k++) { setM(s.pm, k, 0, Y.pocket, 0, -k * DA); s.pm.setColorAt(k, k === 0 ? go : k % 2 ? cr : bl); }
    s.pocketsCol = [cr, bl, go];
    s.pockets.add(s.pm);
    // frets: bevelled brass blades between the pockets (the fine motif), with a ring bead outside
    const fretG = ext(polyShape([[-1.25, 0], [1.25, 0], [1.25, 0.32], [1.05, 0.48], [-1.25, 0.42]]), 0.16, 0, 1);
    fretG.rotateY(Math.PI / 2);
    const fm = inst(fretG, kit.toon({ ramp: [PAL.velvet, PAL.velvet, PAL.brassDark], rim: null }), N, 's02-frets');
    for (let k = 0; k < N; k++) { const a = (k + 0.5) * DA, r = (R.pOut + R.pIn) / 2; setM(fm, k, Math.sin(a) * r, Y.pocket, -Math.cos(a) * r, -a); }
    s.pockets.add(fm);
    s.pockets.add(new THREE.Mesh(flatTorus(R.pOut + 0.05, 0.14, Y.fret + 0.02), kit.toon({ ramp: 'gold', rim: null })));
    // cone + turret: the centre spindle with a 4-arm cross handle ending in balls
    s.turret = new THREE.Group(); s.wheel.add(s.turret);
    s.turret.add(new THREE.Mesh(lathe([[R.pIn + 0.05, Y.pocket - 0.05], [R.pIn, Y.pocket + 0.25], [4.5, -3.75], [1.9, -3.05], [1.5, -3.0], [1.5, -3.2], [0, -3.2]], 48),
      kit.toon({ ramp: [PAL.carmineDeep, PAL.carmineDeep, PAL.carmine], rim: null })));
    const gold = kit.toon({ ramp: 'gold', rim: null });
    const spindle = lathe([[0.75, -3.05], [0.7, -2.85], [0.32, -2.7], [0.22, -2.3], [0.3, -2.15], [0.2, -2.0], [0.24, -1.7], [0.12, -1.5], [0.18, -1.38], [0, -1.3]], 12);
    const arms = [];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
      arms.push(tube([[0, -2.12, 0], [c * 0.8, -2.1, sn * 0.8], [c * 1.45, -1.95, sn * 1.45], [c * 1.65, -1.62, sn * 1.65]], 0.07, 8, 5));
      arms.push(lathe([[0, -0.2], [0.15, -0.14], [0.2, 0], [0.15, 0.14], [0, 0.2]], 8).translate(c * 1.68, -1.45, sn * 1.68));
    }
    s.turret.add(new THREE.Mesh(merge([spindle, ...arms]), gold));
    // countdown numerals on the pockets 3 2 1 0 (they light on the sung words)
    const nums = [['3', 'count', s.tCount, 3], ['2', 'down', s.tDown, 2], ['1', 'to', s.tTo, 1], ['0', 'zero', s.tZero, 0]];
    s.nums = nums.map(([str, say, near, k]) => {
      const T = kit.text(str, { cap: 1.15, color: k === 0 ? PAL.velvet : 'cream', near, say, pop: true, dur: 0.12, parent: s.pockets, align: 'center', vAlign: 'middle' });
      const a = k * DA, r = R.pocket;
      T.mesh.position.set(Math.sin(a) * r, Y.pocket + 0.15, -Math.cos(a) * r);
      T.mesh.rotation.set(-Math.PI / 2, -a, 0, 'YXZ');
      return T;
    });
    // the ball, its motion trail (a ribbon along the track, cut with drawRange) and its gold glow
    s.ballMat = kit.toon({ ramp: 'cream', rim: null });
    s.ball = new THREE.Mesh(lathe([[0, -BALL_R], [BALL_R * 0.7, -BALL_R * 0.7], [BALL_R, 0], [BALL_R * 0.7, BALL_R * 0.7], [0, BALL_R]], 10), s.ballMat);
    s.glowMat = kit.flat({ color: PAL.gold, additive: true, opacity: 0.55, fog: 0.3 });
    s.glow = new THREE.Mesh(new THREE.CircleGeometry(BALL_R * 2.6, 20), s.glowMat);
    s.goldBall = kit.flat({ color: PAL.goldHi, fog: 0.2 });
    root.add(s.ball, s.glow);
    const tr = []; for (let i = 0; i <= 24; i++) { const a = -i * 0.05; tr.push([Math.sin(a) * R.run, 0, -Math.cos(a) * R.run]); }
    s.trail = new THREE.Mesh(tube(tr, 0.2, 24, 4), kit.flat({ color: PAL.cream, additive: true, opacity: 0.45 }));
    s.trailN = s.trail.geometry.getAttribute('position').count / 24;
    root.add(s.trail);
    // gold light that runs once round the lip on "Gold"
    s.run = new THREE.Mesh(new THREE.TorusGeometry(R.lip, 0.2, 5, 24, 0.7).rotateX(Math.PI / 2).rotateY(Math.PI / 2 - 0.35).translate(0, Y.lip + 0.12, 0), kit.flat({ color: PAL.goldHi, additive: true }));
    root.add(s.run);
    // chandelier overhead
    s.chand = buildChandelier(kit, { r: 3.1, drops: 24 });
    s.chand.group.position.set(0, 10.6, 0);
    s.chandMat = s.chand.frame.material;
    root.add(s.chand.group);
    // 8 casino lamp shades on a ring beyond the wheel (lathe shade with a gold lip, cream bulb disc, cord)
    const shadeG = merge([lathe([[0.25, 1.1], [0.6, 0.95], [1.5, 0.35], [2.0, 0.0], [2.05, -0.12], [1.9, -0.1], [0.0, 0.1]], 16),
      lathe([[0.3, 1.0], [0.12, 1.4], [0, 1.45]], 6)]); // shades hang from the dark (no thin cords)
    s.shades = inst(shadeG, kit.toon({ ramp: 'hot', rim: PAL.gold, rimTh: 0.5 }), 8, 's02-shades');
    s.bulbs = inst(new THREE.CircleGeometry(1.75, 18).rotateX(Math.PI / 2).translate(0, -0.08, 0), kit.flat({ color: PAL.amber, fog: 0.3 }), 8, 's02-bulbs');
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; setM(s.shades, i, Math.sin(a) * 17.5, 5.6, -Math.cos(a) * 17.5); setM(s.bulbs, i, Math.sin(a) * 17.5, 5.6, -Math.cos(a) * 17.5); }
    root.add(s.shades, s.bulbs);
    // two giant chip stacks beyond the rim (left, right): crimson chips with cream edge inlays
    const chipG = lathe([[0, 0], [1.95, 0], [2.05, 0.06], [2.05, 0.38], [1.95, 0.44], [0, 0.44]], 28);
    const notch = []; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; notch.push(new THREE.BoxGeometry(0.62, 0.3, 0.1).translate(0, 0.22, 2.06).rotateY(a)); }
    const stacks = [[-19.5, -4, 9], [19, -2, 12]]; // beside you (az +-80), not in the forward shot
    const nC = stacks.reduce((q, v) => q + v[2], 0);
    const chips = inst(chipG, kit.toon({ ramp: 'hot', rim: PAL.gold, rimTh: 0.5 }), nC, 's02-chips');
    const notches = inst(merge(notch), kit.flat({ color: PAL.creamDark }), nC, 's02-notches');
    let c = 0; const rr = kit.rnd(7);
    for (const [x, z, n] of stacks) for (let i = 0; i < n; i++, c++) {
      const ox = (rr() - 0.5) * 0.25, oz = (rr() - 0.5) * 0.25, ry = rr() * 6;
      setM(chips, c, x + ox, -6.5 + i * 0.45, z + oz, ry); setM(notches, c, x + ox, -6.5 + i * 0.45, z + oz, ry);
    }
    root.add(chips, notches);
    s.chips = [chips, notches];
    // lyrics
    const L = { cap: 1.05, lineGap: 1.0, depthTest: false, at: LYR };
    kit.text('COUNT DOWN\nTO ZERO,', { ...L, color: 'gold', near: s.tCount, out: 10.3 });
    s.why = kit.text("DON'T ASK\nME WHY", { ...L, color: 'cream', near: 10.46, out: 12.6 });
    s.why.redact(3, kit.words.times('why', 11.82)[0]);
    kit.text('GOLD ON\nTHE WIRE', { ...L, color: 'gold', near: s.tGold, out: 14.45 });
    kit.text('TONIGHT', { ...L, color: 'cream', near: s.tTonight, out: 15.6 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    // pre: the wheel rises the last 0.9 m (2 m/s) and fades up out of S01's sinking desert
    s.root.position.y = -0.9 * (1 - sm(7.45, 7.9, t));
    kit.fade(sm(7.5, 7.9, t));
    const wa = wheelAng(t);
    s.wheel.rotation.y = -wa;
    // lights out, outside in
    const off = kit.FX.lightsOut(t, OFF);
    s.chand.group.visible = s.shades.visible = s.bulbs.visible = off < 1;
    s.bowl.visible = off < 2; s.chips[0].visible = s.chips[1].visible = off < 2;
    s.track.visible = off < 3;
    s.wheel.visible = off < 4;
    // ---- the ball
    const b = s.b;
    let ang = 0, r = R.run, y = 0, speed = 0;
    if (t >= 16.0) ballOut(t, b);
    else {
      if (t < s.tZero) {
        const T = s.tZero - T_LAUNCH, u = kit.clamp01((t - T_LAUNCH) / T), TOT = Math.PI * 2 + 0.55;
        const e = 1 - Math.pow(1 - u, 1.7);
        ang = wa - TOT * (1 - e); // az decreasing: right -> front -> left -> behind -> front
        speed = (TOT * 1.7 * Math.pow(1 - u, 0.7)) / T;
        const kd = kit.clamp01((t - s.tDown) / (s.tTo - s.tDown));
        r = R.run + (R.pocket - R.run) * kit.ease.inOut(kd);
        y = (r > R.trackLo ? trackY(r) : Y.pocket + (r - R.pocket) * 0.6) + BALL_R;
        const bounce = (a, b2, h) => (t > a && t < b2 ? h * 4 * ((t - a) / (b2 - a)) * (1 - (t - a) / (b2 - a)) : 0);
        y += bounce(s.tDown + 0.05, s.tDown + 0.32, 0.9) + bounce(s.tTo - 0.05, s.tZero, 0.55);
        y = Math.max(y, Y.pocket + BALL_R);
      } else { ang = wa; r = R.pocket; y = Y.pocket + BALL_R + 0.4; }
      b.set(Math.sin(ang) * r, y, -Math.cos(ang) * r);
    }
    s.ball.visible = t >= T_LAUNCH;
    s.ball.position.copy(b);
    const lit = t >= OFF[0];
    s.ball.material = lit ? s.goldBall : s.ballMat;
    s.glow.visible = lit && s.ball.visible;
    s.glow.position.copy(b); s.glow.lookAt(0, 1.6, 0.05);
    // the trail behind the running ball
    const tl = Math.min(24, Math.round(speed * 0.11 / 0.05));
    s.trail.visible = t >= T_LAUNCH && t < s.tZero && tl > 1;
    s.trail.geometry.setDrawRange(0, tl * s.trailN);
    s.trail.rotation.y = -ang; s.trail.position.y = y; s.trail.scale.setScalar(r / R.run);
    // the 0 pocket flares on "zero"; the gold light runs round the lip on "Gold"; the chandelier flares on "tonight"
    const zf = t >= s.tZero ? Math.exp(-(t - s.tZero) * 2.5) : 0;
    s.pm.material.uniforms.uBright.value = 1 + 0.6 * zf;
    const rk = (t - s.tGold) / 1.1;
    s.run.visible = rk >= 0 && rk < 1 && off < 1;
    s.run.rotation.y = -wa - rk * Math.PI * 2;
    const cf = t >= s.tTonight ? Math.exp(-(t - s.tTonight) * 2.2) : 0;
    s.chandMat.uniforms.uBright.value = 1 + 1.4 * cf;
    s.chand.drops.material.uniforms.uBright.value = 1 + 1.2 * cf;
    if (kit.isOwner) kit.setSky({ amt: 1 - sm(15.1, 15.9, t) });
    return zf > 0.97 ? { flash: PAL.gold } : undefined;
  },
  events() { return [{ t: 8.06, sfx: 'tick', gain: 0.35 }, { t: 9.48, sfx: 'drop', gain: 0.45 }, { t: 15.1, sfx: 'switch', gain: 0.4 }]; },
};

function flatTorus(r, tube, y) { return new THREE.TorusGeometry(r, tube, 4, 74).rotateX(Math.PI / 2).translate(0, y, 0); }
