// Group 4, part B: S16 the Dynamo Sun (final chorus: angel in front of the sun, the spy is her lie)
// and S17 the sea launch platform (count down to zero = a launch; the trail becomes the gold wire).
// Clean-pass rules (IEYTD): one hero per shot, black + one field colour + one accent, big solid
// silhouettes instead of lattices and wires, sunburst rays only on chorus hits, one lyric block at a time.
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { D2R, EYE, inst, setM, initColors, setC, boxAt, shapeGeo, mirrorOutline, crescent, lin, lerp, lerpCol, envAt, clamp01, tmpC } from './scenes-4-util.js';

// =================================================================================================
// S16 The Dynamo Sun (127.62 to 136.03, amber then hot)
// SHOT: hero = the sun on the horizon (bursting from S15's dot), then the Engineer: a giant black bust
// whose head eclipses the sun, white round glasses, gold smile, thick gold halo. Supports: the black
// plain, two rows of four solid pylon silhouettes. Motion: slow drift (3 m/s); rays only on "gold"
// and "fire in the sky"; she rises on "smile"; on "lie" the glasses go red and the halo slips; on
// "spy" she sinks, the sun sets, black. Lyric: one block at a time, low centre over the black plain.
const EL16 = 14 * D2R, EL_HI = 18 * D2R;       // S15's dot height; the sun lifts to EL_HI as she rises
const D_ENG = 150;
const HEAD_Y = 1.6 + D_ENG * Math.tan(EL_HI);  // her head sits exactly on the risen sun
const ENG_S = 1.3, HEAD_L = 45.5;              // outline scale, head centre in outline units
const BASE_Y = HEAD_Y - HEAD_L * ENG_S;
const GY = -0.6;                                // plain level
const PYZ = [25, -25, -75], PYX = 42;          // pylon rows (frame the edges, never the sun)
const LOW16 = { d: 8, az: 0, y: 0.15 };         // below the horizon; the blocks use depthTest false (never cut by the plain)

export const S16 = {
  id: 'S16', t0: 127.62, t1: 136.03, world: 'amber', pre: 0, post: 0,
  key: [0, 0.3, -0.95],
  fog: { color: PAL.velvet, near: 120, far: 420 },
  flashes: [{ t: 127.64, color: PAL.amber, dur: 0.03 }],
  build(kit) {
    const s = { sky: {}, foc: [0, 0, -1], c: Array.from({ length: 6 }, () => new THREE.Color()), v: new THREE.Vector3() };
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    s.prof = kit.travel([[127.62, 0, 0.01], [127.68, 3, 1.5]]);

    // the endless black plain
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), kit.flat({ color: PAL.velvet, fog: 0 }));
    ground.position.y = GY; ground.name = 's16-plain';
    root.add(ground);

    // outer rust ring of the sun (the dome draws the amber core and the orange ring)
    s.sunRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.24, 64), kit.flat({ color: PAL.rust, fog: 0, depthWrite: false }));
    s.sunRing.renderOrder = -8;
    root.add(s.sunRing);

    // two rows of four solid pylon silhouettes (square frustum, two crossarms, insulator stubs)
    const body = new THREE.CylinderGeometry(1.8, 5.6, 34, 4, 1); body.rotateY(Math.PI / 4); body.translate(0, 17, 0);
    const spike = new THREE.CylinderGeometry(0.3, 1.8, 5, 4, 1); spike.rotateY(Math.PI / 4); spike.translate(0, 36.5, 0);
    const pylG = mergeSimple([body, spike, boxAt(22, 2.2, 2.2, 0, 27, 0), boxAt(15, 2.2, 2.2, 0, 32.5, 0),
      boxAt(1.3, 3.2, 1.3, -10, 24.8, 0), boxAt(1.3, 3.2, 1.3, 10, 24.8, 0), boxAt(1.3, 3.2, 1.3, -6.8, 30.3, 0), boxAt(1.3, 3.2, 1.3, 6.8, 30.3, 0)]);
    s.pyl = inst(pylG, kit.toon({ ramp: 'black', rim: 'world' }), PYZ.length * 2, 's16-pylons');
    PYZ.forEach((z, i) => { setM(s.pyl, i * 2, -PYX, GY, z); setM(s.pyl, i * 2 + 1, PYX, GY, z); });
    s.pylG = new THREE.Group();
    s.pylG.add(s.pyl);
    root.add(s.pylG);

    // THE ENGINEER: an 80 m backlit silhouette whose head sits on the sun
    const eng = (s.eng = new THREE.Group());
    eng.position.set(0, BASE_Y - 70, -D_ENG);
    root.add(eng);
    const outline = mirrorOutline([[-36, 0], [-35.5, 8], [-33, 14], [-28, 18], [-20, 21], [-13, 22.5], [-11, 24], [-11.5, 31], [-8.5, 31.5], [-6.5, 29], [-5, 30], [-5, 33], [-11, 33], [-12.5, 34], [-13, 41], [-12, 49], [-9.5, 54.5], [-5, 57.5], [0, 58.5]]);
    const eg = shapeGeo(outline, ENG_S);
    eng.add(new THREE.Mesh(eg, kit.flat({ color: PAL.black, fog: 0 })));
    s.engRimMat = kit.flat({ color: PAL.amber, fog: 0 });
    const rimM = new THREE.Mesh(eg, s.engRimMat);
    rimM.scale.set(1.035, 1.03, 1); rimM.position.z = -1.5;
    eng.add(rimM);
    const gl1 = new THREE.CircleGeometry(3.2 * ENG_S, 24); gl1.translate(-4.8 * ENG_S, HEAD_L * ENG_S, 0.6);
    const gl2 = new THREE.CircleGeometry(3.2 * ENG_S, 24); gl2.translate(4.8 * ENG_S, HEAD_L * ENG_S, 0.6);
    s.glassMat = kit.flat({ color: PAL.white, fog: 0 });
    eng.add(new THREE.Mesh(mergeSimple([gl1, gl2]), s.glassMat));
    s.smile = new THREE.Mesh(shapeGeo(crescent(4 * ENG_S, 2.15 * ENG_S, ENG_S)), kit.flat({ color: PAL.gold, fog: 0 }));
    s.smile.position.set(0, HEAD_L * ENG_S - 4.8 * ENG_S, 0.6);
    eng.add(s.smile);
    // the halo: one thick gold ring over her head (drops in on "angel", slips on "lie")
    const haloG = new THREE.TorusGeometry(10 * ENG_S, 1.5 * ENG_S, 6, 40); haloG.rotateX(1.2);
    s.haloMat = kit.flat({ color: PAL.gold, fog: 0 });
    s.halo = new THREE.Mesh(haloG, s.haloMat);
    s.haloY = 74 * ENG_S; // clear of the sun's outer ring
    eng.add(s.halo);

    // lyric type: one block at a time, low centre over the black plain
    kit.text('GOLD ON THE WIRE', { cap: 1.1, color: 'gold', near: 127.68, pop: true, out: 129.5, depthTest: false, at: LOW16 });
    kit.text('FIRE IN THE SKY', { cap: 1.1, color: 'cream', near: 129.8, out: 131.4, depthTest: false, at: LOW16 });
    kit.text('SMILE LIKE\nAN ANGEL', { cap: 0.95, color: 'gold', near: 131.68, say: 'smile like an angel', out: 134.3, depthTest: false, at: LOW16 });
    s.lie = kit.text('LIE LIKE\nA SPY', { cap: 0.95, color: 'cream', colors: { 3: 'rust' }, near: 134.56, say: 'lie like a spy', depthTest: false, at: LOW16 });
    s.lieY = s.lie.mesh.position.y;
    return s;
  },
  update(t, s, kit) {
    s.root.visible = t >= 127.62;
    const d = s.prof.d(t);
    const on = t >= 127.68;
    const cool = kit.sm(134.5, 134.7, t); // angel = amber, the lie = hot red
    kit.fade(1 - kit.sm(135.84, 136.03, t));
    s.pylG.position.z = d;
    // the sun: a dot that bursts open on "Gold", narrows behind her head as she rises, sets on "spy"
    const rise = kit.ease.inOut(lin(131.68, 132.68, t));
    const el = lerp(EL16, EL_HI, rise) - 28 * D2R * kit.ease.in(lin(135.72, 136.03, t));
    s.foc[0] = 0; s.foc[1] = Math.sin(el); s.foc[2] = -Math.cos(el);
    let sunR = t < 127.68 ? 0.017 + 0.02 * lin(127.62, 127.68, t) : 0.037 + 0.163 * kit.ease.out(lin(127.68, 127.95, t));
    sunR = lerp(sunR, 0.13, rise);
    sunR *= 1 + 0.03 * kit.downEnv(t, 5);
    s.sunRing.visible = on;
    s.v.set(s.foc[0], s.foc[1], s.foc[2]).multiplyScalar(270).add(EYE);
    s.sunRing.position.copy(s.v);
    s.sunRing.lookAt(EYE);
    const rr = Math.tan(sunR * 1.28) * 270;
    s.sunRing.scale.set(rr, rr, 1);
    // the Engineer rises in front of the sun on "Smile", sinks again on "spy"
    s.eng.position.y = BASE_Y - 70 * (1 - rise) - 70 * kit.ease.in(lin(135.75, 136.03, t));
    s.eng.visible = rise > 0.001;
    s.engRimMat.uniforms.uColor.value.copy(lerpCol(tmpC, PAL.amber, PAL.gold, cool));
    const lie = t >= 134.56;
    s.glassMat.uniforms.uColor.value.set(lie ? PAL.red : PAL.white);
    s.glassMat.uniforms.uBright.value = 1 + 0.6 * envAt(t, 134.56, 5);
    s.smile.scale.y = 1 - 0.78 * kit.sm(134.56, 134.72, t);
    // halo: drops in on "angel", flares on the downbeat, slips and rusts on "lie"
    s.halo.visible = t >= 133.54;
    const slip = kit.ease.out(lin(134.56, 135.0, t));
    s.halo.position.set(10 * ENG_S * slip, s.haloY + 40 * (1 - kit.ease.out(lin(133.54, 133.86, t))) - 9 * ENG_S * slip, 0.3);
    s.halo.rotation.z = -0.45 * slip;
    s.haloMat.uniforms.uColor.value.copy(lerpCol(tmpC, PAL.gold, PAL.rust, slip));
    s.haloMat.uniforms.uBright.value = 1 + 0.5 * envAt(t, 133.75, 4);
    // LIE LIKE A SPY is swallowed by the dark on "spy"
    s.lie.mesh.position.y = s.lieY - 3.4 * kit.ease.in(lin(135.72, 136.0, t));

    if (kit.isOwner) {
      kit.setWorld('hot', cool);
      const sk = s.sky, c = s.c;
      sk.focal = s.foc; sk.rot = t * 0.035; sk.ringPhase = t * 0.12;
      sk.sunR = sunR; sk.sunCol = PAL.amber; sk.sunRing = PAL.orange;
      sk.rings = 0;
      if (!on) {
        sk.zen = sk.hor = sk.hor2 = sk.nadir = PAL.black; sk.rays = 0; sk.rayA = sk.rayB = PAL.black;
      } else {
        sk.zen = lerpCol(c[0], PAL.rust, PAL.carmine, cool);
        sk.hor2 = lerpCol(c[1], PAL.orange, PAL.carmine, cool);
        sk.hor = lerpCol(c[2], PAL.amber, PAL.crimson, cool);
        sk.nadir = PAL.velvet;
        sk.rayA = lerpCol(c[3], PAL.orange, PAL.crimson, cool);
        sk.rayB = lerpCol(c[4], PAL.rust, PAL.carmineDeep, cool);
        sk.ringCol = lerpCol(c[5], PAL.amber, PAL.gold, cool);
        // two chorus hits only: a short burst on "Gold", the whole sky on "fire in the sky"
        const hitGold = 1 - kit.sm(128.0, 128.6, t);
        const hitFire = kit.sm(129.8, 129.95, t) * (1 - kit.sm(131.0, 131.5, t));
        sk.rays = Math.max(hitGold, hitFire);
      }
      sk.rayR = t < 129.5 ? 1.3 : 3.2;
      kit.setSky(sk);
      if (t >= 127.68 && t < 128.2) kit.rigState.gauge = 1;
    }
  },
  events() {
    return [
      { t: 127.68, sfx: 'whoosh', gain: 0.85, haptic: [0.6, 90] },
      { t: 129.8, sfx: 'crack', gain: 0.5, haptic: [0.3, 60] },
      { t: 133.54, sfx: 'ping', gain: 0.4 },
      { t: 134.56, sfx: 'switch', gain: 0.5 },
      { t: 135.72, sfx: 'drop', gain: 0.6, haptic: [0.5, 120] },
    ];
  },
};

// =================================================================================================
// S17 The sea launch platform (136.03 to 142.91, hot then amber)
// SHOT: hero = the cream rocket with crimson bands on its gold pad ring, front-left (az -22, 43 m).
// Supports: the solid black gantry with four big red countdown lamps; two cream tanks at the sides.
// Motion: one lamp out per word; ignition (plume + one billow of big smoke puffs, the accent); the
// rocket rises and pitches toward the vanishing point pulling a thick smoke band that turns gold
// on "gold on the wire"; the rocket ends as the amber dot S18's sun grows from.
// Lyric: right of centre over the black sea, one block at a time.
const EL17 = 9 * D2R;
const FOC17 = [0, Math.sin(EL17), -Math.cos(EL17)];
const DECK_Y = -0.45;
const RK = 0.75;
const P0 = new THREE.Vector3(-13, DECK_Y, -62), P1 = new THREE.Vector3(-13, 62, -62), P2 = new THREE.Vector3(-6, 72, -140);
const PT = new THREE.Vector3(0, 1.6 + 240 * Math.sin(EL17), 0.05 - 240 * Math.cos(EL17));
const UP = new THREE.Vector3(0, 1, 0);
const LIFT = 138.94;
const uAt = (t) => { const k = clamp01((t - LIFT) / 3.78); return k * k; };
function bez(u, out) {
  const a = 1 - u, b0 = a * a * a, b1 = 3 * a * a * u, b2 = 3 * a * u * u, b3 = u * u * u;
  return out.set(b0 * P0.x + b1 * P1.x + b2 * P2.x + b3 * PT.x, b0 * P0.y + b1 * P1.y + b2 * P2.y + b3 * PT.y, b0 * P0.z + b1 * P1.z + b2 * P2.z + b3 * PT.z);
}
function bezD(u, out) {
  const a = 1 - u, c0 = 3 * a * a, c1 = 6 * a * u, c2 = 3 * u * u;
  out.set(c0 * (P1.x - P0.x) + c1 * (P2.x - P1.x) + c2 * (PT.x - P2.x), c0 * (P1.y - P0.y) + c1 * (P2.y - P1.y) + c2 * (PT.y - P2.y), c0 * (P1.z - P0.z) + c1 * (P2.z - P1.z) + c2 * (PT.z - P2.z));
  if (out.lengthSq() < 1e-6) out.set(0, 1, 0);
  return out.normalize();
}
const GANTRY = new THREE.Vector3(-24, DECK_Y, -66);
const LAMP_OFF = [138.1, 138.04, 137.48, 137.28]; // bottom lamp 1 .. top lamp 4
const K_PRE = new THREE.Vector3(0.45, 0.45, 0.77).normalize(), K_IGN = new THREE.Vector3(0.2, -0.3, 0.93).normalize();

export const S17 = {
  id: 'S17', t0: 136.03, t1: 142.91, world: 'hot', pre: 0, post: 0,
  key: [0.45, 0.45, 0.77],
  fog: { color: PAL.velvet, near: 70, far: 300 },
  build(kit) {
    const s = { sky: {}, c: Array.from({ length: 6 }, () => new THREE.Color()), p: new THREE.Vector3(), tan: new THREE.Vector3(), q: new THREE.Quaternion(), tmp: new THREE.Vector3(), tmp2: new THREE.Vector3() };
    // the flat black sea (static)
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), kit.flat({ color: PAL.velvet, fog: 0 }));
    sea.position.y = -2.6;
    kit.group.add(sea);

    // everything on the deck drifts slowly toward the player
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    s.prof = kit.travel([[136.03, 0.6, 0.01]]);
    W.add(new THREE.Mesh(boxAt(110, 2.4, 120, -10, DECK_Y - 1.2, -30), kit.flat({ color: PAL.velvet, fog: 0.5 })));
    // one bold gold pad ring
    const ringG = new THREE.RingGeometry(6.0, 8.6, 40).rotateX(-Math.PI / 2); ringG.translate(P0.x, DECK_Y + 0.03, P0.z);
    W.add(new THREE.Mesh(ringG, kit.flat({ color: PAL.gold, fog: 0.6 })));
    // two big cream fuel tanks for the sides (right-behind and left)
    const tankG = mergeSimple([new THREE.SphereGeometry(6.5, 18, 10).translate(0, 9.5, 0), new THREE.CylinderGeometry(4.6, 5.4, 4, 12).translate(0, 2, 0)]);
    const tanks = inst(tankG, kit.toon({ ramp: 'cream', rim: 'world' }), 2, 's17-tanks');
    const bands = inst(new THREE.CylinderGeometry(6.62, 6.62, 1.6, 18, 1, true).translate(0, 9.5, 0), kit.toon({ ramp: 'rust', rim: null, side: THREE.DoubleSide }), 2, 's17-tank-bands');
    setM(tanks, 0, 24, DECK_Y, 4); setM(tanks, 1, -38, DECK_Y, 0); setM(bands, 0, 24, DECK_Y, 4); setM(bands, 1, -38, DECK_Y, 0);
    W.add(tanks, bands);

    // the rocket: cream body, crimson bands, black fins, in three hard steps
    const rk = (s.rocket = new THREE.Group());
    rk.position.copy(P0);
    W.add(rk);
    const cy = (r0, r1, h, y, n = 18) => { const g = new THREE.CylinderGeometry(r1, r0, h, n); g.translate(0, y + h / 2, 0); return g; };
    const nose = new THREE.ConeGeometry(2.2, 6.5, 18); nose.translate(0, 49.5 + 3.25, 0);
    s.creamMat = kit.toon({ ramp: 'cream', rim: PAL.gold, rimAmt: 0.9 });
    rk.add(new THREE.Mesh(mergeSimple([cy(2.6, 2.6, 40, 2.5), cy(2.6, 2.2, 2, 42.5), cy(2.2, 2.2, 5, 44.5), nose]), s.creamMat));
    rk.add(new THREE.Mesh(mergeSimple([cy(2.66, 2.66, 3.2, 7), cy(2.66, 2.66, 2.2, 30), cy(2.26, 2.26, 2.0, 46)]), kit.toon({ ramp: 'hot', rim: PAL.gold, rimAmt: 0.8 })));
    const fins = [cy(2.0, 1.4, 2.5, 0, 12)];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; fins.push(boxAt(0.5, 8, 3.8, Math.cos(a) * 3.8, 5.5, Math.sin(a) * 3.8, 0, -a, 0)); }
    rk.add(new THREE.Mesh(mergeSimple(fins), kit.toon({ ramp: 'black', rim: PAL.gold })));
    // flat cel plume (three nested cones), pointing out of the nozzle
    s.plume = new THREE.Group();
    const plumeC = (r, h, col) => { const g = new THREE.ConeGeometry(r, h, 7, 1, true); g.rotateX(Math.PI); g.translate(0, -h / 2, 0); return new THREE.Mesh(g, kit.flat({ color: col, fog: 0, side: THREE.DoubleSide })); };
    s.plume.add(plumeC(3.4, 18, PAL.rust), plumeC(2.4, 12, PAL.orange), plumeC(1.5, 7, PAL.amber));
    s.plume.children[1].renderOrder = 1; s.plume.children[2].renderOrder = 2;
    rk.add(s.plume);
    // the amber dot the rocket becomes (billboard)
    s.dot = new THREE.Mesh(new THREE.CircleGeometry(1, 24), kit.flat({ color: PAL.amber, fog: 0 }));
    s.dot.renderOrder = 4;
    W.add(s.dot);
    // the trail: one thick smoke band from the pad to the rocket, turning gold on "gold on the wire"
    s.lineMat = kit.flat({ color: PAL.cream, fog: 0.2 });
    s.line = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), s.lineMat);
    s.line.frustumCulled = false;
    W.add(s.line);

    // the gantry: one solid black tower, two swing arms, four big red countdown lamps
    const gantry = new THREE.Mesh(mergeSimple([boxAt(6, 50, 6, 0, 25, 0), boxAt(8, 1.6, 8, 0, 50.8, 0), boxAt(0.9, 10, 0.9, 0, 56, 0)]), kit.toon({ ramp: 'black', rim: PAL.gold, rimAmt: 0.9 }));
    gantry.position.copy(GANTRY);
    W.add(gantry);
    const toR = new THREE.Vector3(P0.x - GANTRY.x, 0, P0.z - GANTRY.z).normalize();
    s.armRy = Math.atan2(-toR.z, toR.x);
    s.armPiv = [16, 27].map((y) => new THREE.Vector3(GANTRY.x + toR.x * 3, DECK_Y + y, GANTRY.z + toR.z * 3));
    s.arms = inst(boxAt(4.8, 1.5, 2.4, 2.4, 0, 0), kit.toon({ ramp: 'black', rim: PAL.gold }), 2, 's17-arms');
    W.add(s.arms);
    s.lamps = initColors(inst(new THREE.CircleGeometry(1.9, 20), kit.flat({ color: PAL.white, fog: 0.3 }), 4, 's17-lamps'), 4, PAL.red);
    const toE = new THREE.Vector3(-GANTRY.x, 0, -GANTRY.z).normalize(), o = new THREE.Object3D();
    for (let j = 0; j < 4; j++) {
      o.position.set(GANTRY.x + toE.x * 3.15, DECK_Y + 10 + j * 5, GANTRY.z + toE.z * 3.15);
      o.lookAt(EYE); o.updateMatrix(); s.lamps.setMatrixAt(j, o.matrix);
    }
    W.add(s.lamps);

    // ignition billow: 16 big flat puffs around the pad base (the one accent)
    W.add(kit.particles({
      n: 16, shape: 'disc', seed: 1702, init: (i, r) => {
        const a = (i / 16) * Math.PI * 2 + r() * 0.3, sp = 3 + r() * 3, vy = 0.8 + r() * 1.4, T = 2.4;
        return {
          p: [P0.x + Math.cos(a) * 3, DECK_Y + 2 + r() * 2.5, P0.z + Math.sin(a) * 3], v: [Math.cos(a) * sp, vy, Math.sin(a) * sp * 0.6],
          g: [-Math.cos(a) * sp / T, -vy / T, -Math.sin(a) * sp * 0.6 / T], freeze: [138.12 + T, 1e5], t0: 138.12 + r() * 0.12, life: 5.2, s: 5 + r() * 4, c: r() < 0.35 ? PAL.creamDark : PAL.cream,
        };
      },
    }));

    // lyric type: right of centre, over the black sea, one block at a time
    kit.text('COUNT DOWN TO', { cap: 0.75, color: 'gold', near: 137.28, out: 138.78, outDur: 0.12, depthTest: false, at: { d: 7, az: 18, y: 1.0 } });
    s.zero = kit.text('0', { cap: 1.8, color: 'gold', times: [138.1], pop: true, dur: 0.1, out: 138.78, outDur: 0.12, depthTest: false, at: { d: 7, az: 18, y: -0.55 } });
    s.why = kit.text("DON'T ASK ME WHY", { cap: 0.85, color: 'cream', near: 138.94, out: 141.6, outDur: 0.12, depthTest: false, at: { d: 7, az: 16, y: 0.6 } });
    s.burn = s.why.redact(3, 140.42, { color: PAL.orange });
    s.why.hideWord(3, 140.55);
    kit.text('GOLD ON THE WIRE', { cap: 1.0, color: 'gold', near: 141.74, out: 142.86, outDur: 0.05, depthTest: false, at: { d: 8, az: 14, y: 0.6 } });
    return s;
  },
  update(t, s, kit) {
    s.world.position.z = s.prof.d(t);
    kit.fade(kit.sm(136.03, 136.28, t));
    // countdown lamps go out one per word
    for (let j = 0; j < 4; j++) setC(s.lamps, j, t < LAMP_OFF[j] ? PAL.red : 0x1c0405);
    s.lamps.instanceColor.needsUpdate = true;
    // ignition: amber climax
    const ign = t >= 138.1;
    const amb = kit.sm(138.08, 138.16, t) * (1 - kit.sm(140.2, 141.0, t));
    // the rocket on its path (vertical, then pitching over toward the vanishing point)
    const u = uAt(t);
    bez(u, s.p); bezD(u, s.tan);
    s.rocket.position.copy(s.p);
    s.q.setFromUnitVectors(UP, s.tan);
    s.rocket.quaternion.copy(s.q);
    const sr = 1 - 0.9 * kit.sm(141.4, 142.62, t);
    s.rocket.scale.set(RK * 1.35 * sr, RK * sr, RK * 1.35 * sr); // a chunky retro rocket
    s.rocket.visible = t < 142.72;
    s.creamMat.uniforms.uBright.value = 1 + 0.25 * amb;
    s.plume.visible = ign;
    if (ign) {
      const pl = kit.ease.out(lin(138.1, 138.25, t)) * (1 + 0.8 * kit.sm(138.94, 140.4, t));
      s.plume.scale.set(1, pl, 1);
    }
    // the nozzle point (dot, trail end)
    s.tmp.copy(s.tan).multiplyScalar(-1.5 * RK * sr).add(s.p);
    s.tmp2.copy(s.tmp).add(s.world.position);
    const dist = s.tmp2.distanceTo(EYE);
    const dk = kit.sm(140.9, 142.4, t);
    s.dot.visible = dk > 0.001;
    if (s.dot.visible) {
      s.dot.position.copy(s.tmp);
      s.dot.lookAt(EYE);
      s.dot.scale.setScalar(Math.max(0.3, dist * 0.0165 * dk));
    }
    // the trail band: from the pad to the nozzle, cream smoke, gold and thinner on "gold on the wire"
    s.line.visible = t >= LIFT + 0.12;
    if (s.line.visible) {
      s.line.position.set(P0.x, DECK_Y + 0.5, P0.z);
      const L = s.line.position.distanceTo(s.tmp);
      const g = kit.sm(141.74, 141.9, t);
      const th = lerp(2.4, 1.0, g);
      s.line.scale.set(th, th, L);
      s.line.lookAt(s.tmp2);
      s.lineMat.uniforms.uColor.value.copy(lerpCol(tmpC, PAL.cream, PAL.goldHi, g));
    }
    // swing arms fall back, one per beat
    for (let i = 0; i < 2; i++) {
      const ta = i ? 140.04 : 139.46;
      const k = kit.ease.out(lin(ta, ta + 0.55, t));
      setM(s.arms, i, s.armPiv[i].x, s.armPiv[i].y, s.armPiv[i].z, 1, 1, 1, 0, s.armRy + 1.65 * k, 0);
    }
    s.arms.instanceMatrix.needsUpdate = true;
    if (t > 140.62) s.burn.g.visible = false;
    s.zero.u.uBright.value = 1 + 1.2 * envAt(t, 138.1, 2.5);

    if (kit.isOwner) {
      kit.setWorld('amber', amb);
      kit.U.uKey.value.copy(K_PRE).lerp(K_IGN, kit.sm(138.1, 138.4, t)).normalize();
      const sk = s.sky, c = s.c;
      sk.focal = FOC17; sk.rot = t * 0.035; sk.ringPhase = t * 0.12;
      sk.zen = lerpCol(c[0], PAL.carmine, PAL.rust, amb);
      sk.hor2 = lerpCol(c[1], PAL.carmine, PAL.orange, amb);
      sk.hor = lerpCol(c[2], PAL.crimson, PAL.amber, amb);
      sk.rayA = lerpCol(c[3], PAL.crimson, PAL.orange, amb);
      sk.rayB = lerpCol(c[4], PAL.carmineDeep, PAL.rust, amb);
      sk.ringCol = lerpCol(c[5], PAL.gold, PAL.amber, amb);
      sk.rayR = 1.45 + 1.75 * amb;
      sk.rays = kit.sm(138.1, 138.18, t) * (1 - kit.sm(139.0, 139.7, t)); // one hit: ignition
      sk.rings = 0;
      kit.setSky(sk);
      if (t >= 138.1 && t < 138.7) kit.rigState.gauge = 1;
    }
  },
  events() {
    return [
      { t: 137.28, sfx: 'tick', gain: 0.5 },
      { t: 137.48, sfx: 'tick', gain: 0.5 },
      { t: 138.04, sfx: 'tick', gain: 0.5 },
      { t: 138.1, sfx: 'motor', gain: 0.9, haptic: [0.9, 400] },
      { t: 139.46, sfx: 'lid', gain: 0.4 },
      { t: 140.42, sfx: 'whoosh', gain: 0.6, haptic: [0.4, 80] },
      { t: 141.74, sfx: 'ping', gain: 0.5 },
    ];
  },
};
