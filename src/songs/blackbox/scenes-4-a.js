// Group 4, part A: S14 the records archive and shredder (bridge "three, two, one, you were never here")
// and S15 inside the scope (the record is wiped, then the old screen switches off into a dot).
// Clean-pass rules (IEYTD): one hero per shot, black + one field colour + one accent, big shapes,
// one main motion at a time, one lyric block at a time in calm space.
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { D2R, EYE, f, inst, setM, initColors, setC, mixC, boxAt, shapeGeo, mirrorOutline, clipBand, lin, envAt } from './scenes-4-util.js';

// =================================================================================================
// S14 The records archive and shredder (112.04 to 119.98, cold)
// SHOT: hero = the shredder, a black machine with two cyan eyes at the end of the aisle, a cream
// dossier (her black bust) hanging over its mouth. Supports: two walls of big petrol drawers, two
// lampshades with teal pools. Motion: one bank of drawers slams + one light per number; the machine
// wakes on "one" and eats the dossier. Lyric: one numeral at a time, low centre over the dark floor.
const LAMPZ = [-2, -9];                    // lamp "3" (near), lamp "2" (mid); "1" is the machine itself
const LON = [112.62, 114.6], LOFF = [119.5, 119.2];
const EYES_ON = 115.9, EYES_OFF = 118.68, RUN = 116.59;
const FLOOR = -0.5;
const UNITZ = [15, 10, 5, 0, -5, -10, -15];
const SHZ = -24.5, SHH = 9;                 // shredder centre z (front face at -22), height
const CABX = 5.2, FACEX = 4.4;
const ROWY = [FLOOR + 1.25, FLOOR + 3.5, FLOOR + 5.75];
const NSTRIP = 6;

export const S14 = {
  id: 'S14', t0: 112.04, t1: 119.98, world: 'cold', pre: 0, post: 0,
  key: [0.12, 0.95, -0.28],
  fog: { color: 0x000000, near: 16, far: 75 },
  sky: { stars: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black, nadir: PAL.black, rays: 0, rings: 0 },
  build(kit) {
    const s = { settled: false };
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    const R = kit.rnd(1401);
    s.prof = kit.travel([[112.04, 1.2, 0.01]]);

    W.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 120).rotateX(-Math.PI / 2).translate(0, FLOOR, -30), kit.flat({ color: PAL.black, fog: 0 })));
    // pools of lamp light on the floor (one big teal ellipse per lamp)
    s.pools = initColors(inst(new THREE.CircleGeometry(3.4, 28).rotateX(-Math.PI / 2), kit.flat({ color: PAL.white, fog: 0.5 }), 2, 's14-pools'), 2, PAL.teal);
    W.add(s.pools);

    // cabinet carcasses: 9 tall units per side
    s.cabMat = kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: null });
    const cab = inst(new THREE.BoxGeometry(1.6, 7, 4.6).translate(0, 3.5, 0), s.cabMat, UNITZ.length * 2, 's14-cabinets');
    UNITZ.forEach((uz, i) => { for (let sd = 0; sd < 2; sd++) setM(cab, i * 2 + sd, (sd ? 1 : -1) * CABX, FLOOR, uz); });
    W.add(cab);
    // drawers: 3 big ones per unit, open by different amounts, slammed shut one bank per number
    const ND = UNITZ.length * 2 * 3;
    s.ND = ND;
    s.dz = new Float32Array(ND); s.dx = new Float32Array(ND); s.dy = new Float32Array(ND); s.dOpen = new Float32Array(ND); s.dSlam = new Float32Array(ND);
    let k = 0;
    for (const uz of UNITZ) for (let sd = 0; sd < 2; sd++) for (let r = 0; r < 3; r++) {
      s.dz[k] = uz; s.dx[k] = sd ? 1 : -1; s.dy[k] = ROWY[r]; s.dOpen[k] = 0.35 + R() * 1.05;
      s.dSlam[k] = (uz >= -3 ? 112.62 : uz >= -12 ? 114.6 : EYES_ON) + R() * 0.05;
      k++;
    }
    s.front = initColors(inst(new THREE.BoxGeometry(0.1, 1.9, 4.2), kit.flat({ color: PAL.white, fog: 1 }), ND, 's14-fronts'), ND, PAL.petrol);
    s.body = inst(new THREE.BoxGeometry(1.0, 1.85, 4.1), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: null }), ND, 's14-drawers');
    W.add(s.front, s.body);

    // THE SHREDDER: a black machine across the aisle end, mouth slot on top, two round eyes
    W.add(new THREE.Mesh(boxAt(12, SHH, 5, 0, FLOOR + SHH / 2, SHZ), kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: PAL.cyan, rimAmt: 0.8 })));
    s.eyes = initColors(inst(new THREE.CircleGeometry(1.05, 24), kit.flat({ color: PAL.white, fog: 0.2 }), 3, 's14-eyes'), 3, PAL.petrolDeep);
    setM(s.eyes, 0, -3.6, FLOOR + 4.2, SHZ + 2.55); setM(s.eyes, 1, 3.6, FLOOR + 4.2, SHZ + 2.55);
    setM(s.eyes, 2, 0, FLOOR + SHH - 1.1, SHZ + 2.55, 4.6, 0.3, 1); // the mouth slot (a squashed disc = rounded band)
    W.add(s.eyes);

    // two huge lampshades (no cords), bulbs light up one per number
    const shades = inst(new THREE.ConeGeometry(1.8, 1.6, 16, 1, true), kit.toon({ ramp: 'black', rim: PAL.cyan, side: THREE.DoubleSide }), 2, 's14-shades');
    W.add(shades);
    s.bulbs = initColors(inst(new THREE.SphereGeometry(0.55, 12, 6), kit.flat({ color: PAL.white, fog: 0.3 }), 2, 's14-bulbs'), 2, 0x0a0a0a);
    for (let j = 0; j < 2; j++) { setM(shades, j, 0, 11, LAMPZ[j]); setM(s.bulbs, j, 0, 10.4, LAMPZ[j]); }
    W.add(s.bulbs);

    // the Engineer's dossier: one cream sheet, her black bust, one redaction bar, a thick gold cable
    const dos = (s.dos = new THREE.Group());
    dos.position.set(0, FLOOR + SHH + 0.9, SHZ);
    W.add(dos);
    s.paperMat = kit.flat({ color: PAL.cream, fog: 0.3, side: THREE.DoubleSide });
    dos.add(new THREE.Mesh(new THREE.PlaneGeometry(7, 9.5).translate(0, 4.75, 0), s.paperMat));
    const sil = mirrorOutline([[-1.5, 0], [-1.45, 0.55], [-1.1, 0.85], [-0.55, 1.0], [-0.42, 1.38], [-0.26, 1.32], [-0.22, 1.5], [-0.56, 1.5], [-0.62, 1.95], [-0.5, 2.45], [-0.25, 2.66], [0, 2.7]]);
    const silG = shapeGeo(sil, 1.85); silG.translate(0, 3.6, 0.03);
    dos.add(new THREE.Mesh(mergeSimple([silG.toNonIndexed(), boxAt(5.2, 0.8, 0.01, 0, 1.9, 0.03).toNonIndexed()]), kit.flat({ color: PAL.black, fog: 0.3 })));
    dos.add(new THREE.Mesh(boxAt(0.3, 30, 0.3, 0, 9.5 + 15, 0), kit.flat({ color: PAL.gold, fog: 0.3 })));

    // ---- lyric type: one numeral at a time, low centre (calm floor) ----
    const num = (ch, a, b, color, cap, at) => kit.text(ch, { cap, color, times: [a], pop: true, dur: 0.1, out: b, outDur: 0.08, depthTest: false, at }); // never cut by the floor
    const LOW = { d: 5, az: 0, y: 0.0 };
    num('3', 112.62, 114.48, 'gold', 1.8, LOW); num('2', 114.6, 115.8, 'gold', 1.8, LOW); num('1', 115.9, 117.55, 'gold', 1.8, LOW);
    s.ywnh = kit.text('YOU WERE NEVER HERE', { cap: 0.72, color: 'cream', near: 117.74, out: 118.54, outDur: 0.02, depthTest: false, at: { d: 5, az: 0, y: 0.1 } });
    // "here": the line is cut into strips that drop away like shredded paper (the scene's one accent)
    const wy0 = s.ywnh.words[0].y0 - 0.1, wy1 = s.ywnh.words[0].y1 + 0.1;
    s.strips = [];
    for (let i = 0; i < NSTRIP; i++) {
      const T = kit.text('YOU WERE NEVER HERE', { cap: 0.72, color: 'cream', times: 118.54, dur: 0.001, out: 118.98, outDur: 0.08, depthTest: false, at: { d: 5, az: 0, y: 0.1 } });
      clipBand(T.mesh.geometry, wy0 + ((wy1 - wy0) * i) / NSTRIP, wy0 + ((wy1 - wy0) * (i + 1)) / NSTRIP, 0.2);
      s.strips.push({ T, y: T.mesh.position.y, delay: (NSTRIP - 1 - i) * 0.03, dx: (R() - 0.5) * 1.2, rz: (R() - 0.5) * 0.6 });
    }
    // the machine counts down again between its eyes as the lights go out
    const MID = { d: 6, az: 0, y: 1.75 };
    num('3', 118.68, 119.12, 'cream', 1.25, MID); num('2', 119.2, 119.44, 'cream', 1.25, MID); num('1', 119.5, 119.82, 'cream', 1.25, MID);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.world.position.z = d;
    const lit = t >= 112.62;
    kit.fade(lit ? 1 - kit.sm(119.58, 119.95, t) : 0);
    // lamps and pools
    const on = [0, 0];
    for (let j = 0; j < 2; j++) {
      on[j] = t >= LON[j] && t < LOFF[j] ? 1 : 0;
      setC(s.bulbs, j, on[j] ? PAL.cream : 0x0a0a0a);
      setM(s.pools, j, 0, FLOOR + 0.02, LAMPZ[j], on[j], 1, on[j] * 1.5);
    }
    s.bulbs.instanceColor.needsUpdate = true; s.pools.instanceMatrix.needsUpdate = true;
    // the machine: eyes on at "one", slot pulses while it runs
    const eyes = t >= EYES_ON && t < EYES_OFF;
    const run = t >= RUN && t < EYES_OFF;
    for (let j = 0; j < 2; j++) { if (eyes) mixC(s.eyes, j, PAL.cyan, PAL.white, envAt(t, EYES_ON, 5)); else setC(s.eyes, j, PAL.petrolDeep); }
    if (run) mixC(s.eyes, 2, PAL.teal, PAL.cyan, 0.4 + 0.6 * kit.beatEnv(t, 6)); else setC(s.eyes, 2, eyes ? PAL.teal : PAL.petrolDeep);
    s.eyes.instanceColor.needsUpdate = true;

    // drawers: matrices only while any drawer still moves (pure: recomputed from t on every seek)
    const moving = t < 116.1;
    if (moving || !s.settled) {
      for (let i = 0; i < s.ND; i++) {
        const ts = s.dSlam[i], sd = s.dx[i];
        const open = t < ts ? s.dOpen[i] : s.dOpen[i] * Math.max(0, 1 - (t - ts) / 0.08);
        setM(s.front, i, sd * (FACEX - open - 0.05), s.dy[i], s.dz[i]);
        setM(s.body, i, sd * (FACEX - open + 0.5), s.dy[i], s.dz[i]);
      }
      s.front.instanceMatrix.needsUpdate = true; s.body.instanceMatrix.needsUpdate = true;
      s.settled = !moving;
    }
    for (let i = 0; i < s.ND; i++) {
      const z = s.dz[i];
      let litD = 0;
      for (let j = 0; j < 2; j++) if (on[j] && Math.abs(z - LAMPZ[j]) < 7.5) litD = 1;
      const kick = envAt(t, s.dSlam[i], 8);
      if (kick > 0.04) mixC(s.front, i, litD ? PAL.teal : PAL.petrol, PAL.cyan, kick);
      else setC(s.front, i, litD ? PAL.teal : PAL.petrol, litD ? 0.55 : 0.8);
    }
    s.front.instanceColor.needsUpdate = true;

    // dossier: hangs over the mouth, fed in while the machine runs, gone on "you were never here"
    let yb;
    const Y0 = FLOOR + SHH + 0.9;
    if (t < RUN) yb = Y0;
    else if (t < 117.74) yb = Y0 - 6 * kit.ease.inOut(lin(RUN, 117.74, t));
    else yb = Y0 - 6 - 11 * kit.ease.in(lin(117.74, 118.05, t));
    s.dos.position.y = yb;
    s.dos.visible = t < 118.05;
    s.paperMat.uniforms.uBright.value = 0.55 + 0.35 * (eyes ? 1 : 0) + 0.15 * on[1];

    // "here": the strips drop away
    for (const st of s.strips) {
      const m = st.T.mesh, a = Math.max(0, t - 118.54 - st.delay);
      m.position.y = st.y - 9 * a * a;
      m.position.x = st.dx * a;
      m.rotation.z = st.rz * a * 2;
    }
  },
  events() {
    return [
      { t: 112.62, sfx: 'shutter', gain: 0.75, haptic: [0.5, 60] },
      { t: 114.6, sfx: 'shutter', gain: 0.6, haptic: [0.35, 50] },
      { t: 115.9, sfx: 'switch', gain: 0.6 },
      { t: 116.59, sfx: 'motor', gain: 0.55 },
      { t: 117.74, sfx: 'whoosh', gain: 0.6, haptic: [0.3, 80] },
    ];
  },
};

// =================================================================================================
// S15 Inside the scope (119.98 to 127.62, cold)
// SHOT: hero = the round-cornered phosphor screen filling the front (teal field) with ONE black agent
// silhouette standing in it. Supports: the cyan erase bar, the black tube funnel around (cyan rim).
// Motion: the bar wipes figure and words left to right after "here"; then the CRT switch-off:
// the screen squashes into a white line on "lights", into a dot on "out" (S16's sun bursts from it).
// Lyric: one block, low centre on the screen's lower field.
const AZH = 0.9;            // rad for u = +-1
const EL0 = 14 * D2R;       // screen centre elevation (the dot, and S16's sun, sit here)
const ELH = 0.5;            // rad for v = +-1
const RS = 25;              // screen radius (from the eye)
const NECK = new THREE.Vector3(0, 3.0, 30); // eye-relative tube axis
const WIPE0 = 123.05, WIPE1 = 123.65;
const CE = Math.cos(EL0), SE = Math.sin(EL0);

const ROT_GLSL = /* glsl */ `
  float cs = ${f(CE)}, sn = ${f(SE)};
  vec3 d = vec3(d0.x, d0.y * cs + d0.z * sn, -d0.y * sn + d0.z * cs);
  float az = atan(d.x, -d.z);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float u = az / ${f(AZH)}, v = el / ${f(ELH)};`;
const SCREEN_V = /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SCREEN_F = /* glsl */ `
uniform float uGrat, uSqV, uSqU, uLine, uDot, uErase, uBar, uFade, uSceneFade;
uniform vec3 uGC;
varying vec3 vP;
void main() {
  vec3 d0 = normalize(vP);
  ${ROT_GLSL}
  float sv = max(1.0 - uSqV, 0.001), su = max(1.0 - uSqU, 0.001);
  float uu = u / su, vv = v / sv;
  float inside = step(pow(abs(uu), 4.0) + pow(abs(vv), 4.0), 1.0);
  vec3 c = uGC * inside * uGrat;
  float bar = (1.0 - step(0.035, abs(u - uErase))) * inside * uBar;
  c = mix(c, vec3(0.75, 1.0, 1.0), bar);
  float hh = max(sv * ${f(ELH)}, 0.0035), hw = max(su * ${f(AZH)}, 0.0035);
  float band = step(abs(el), hh) * step(abs(az), hw) * uLine;
  float dotm = step(length(vec2(az, el)), uDot);
  c = mix(c, vec3(1.0), max(band, dotm));
  gl_FragColor = vec4(c * uFade * uSceneFade, 1.0);
  #include <colorspace_fragment>
}`;
// the agent silhouette: black, discarded where the erase bar has already passed
const FIG_V = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FIG_F = /* glsl */ `
uniform float uErase; uniform vec3 uEye;
varying vec3 vW;
void main() {
  vec3 d0 = normalize(vW - uEye);
  ${ROT_GLSL}
  if (u < uErase) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;
const capPt = (azD, elD, r) => { const a = azD * D2R, e = elD * D2R; return new THREE.Vector3(Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.cos(a) * Math.cos(e) * r); };
const eraseAt = (t) => -1.15 + 2.3 * ((k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2))(lin(WIPE0, WIPE1, t));

export const S15 = {
  id: 'S15', t0: 119.98, t1: 127.62, world: 'cold', pre: 0, post: 0,
  key: [0.0, 0.25, 0.97],
  sky: 'black',
  build(kit) {
    const s = {};
    const tube = (s.tube = new THREE.Group());
    tube.position.copy(EYE);
    kit.group.add(tube);
    // the concave phosphor screen (spherical cap around the eye, front 200 deg)
    s.su = {
      uGrat: { value: 0 }, uSqV: { value: 0 }, uSqU: { value: 0 }, uLine: { value: 0 }, uDot: { value: 0 }, uErase: { value: -2 }, uBar: { value: 0 },
      uGC: { value: new THREE.Color(PAL.teal) }, uFade: kit.U.uFade, uSceneFade: kit.SU.uSceneFade,
    };
    const scr = new THREE.Mesh(
      new THREE.SphereGeometry(RS, 64, 24, 1.5 * Math.PI - 100 * D2R, 200 * D2R, 45 * D2R, 75 * D2R),
      new THREE.ShaderMaterial({ uniforms: s.su, vertexShader: SCREEN_V, fragmentShader: SCREEN_F, side: THREE.DoubleSide }),
    );
    scr.name = 's15-screen'; scr.frustumCulled = false;
    tube.add(scr);

    // the agent (fedora, trench coat): one black shape standing in the screen, 17 m tall at 21 m
    const agent = mirrorOutline([[-0.06, 2.3], [-0.12, 0], [-0.85, 0], [-0.8, 2.4], [-1.55, 2.7], [-1.25, 5.4], [-1.45, 6.5], [-1.15, 7.15], [-0.42, 7.45], [-0.36, 7.75], [-0.52, 7.95], [-0.52, 8.55], [-1.2, 8.6], [-1.2, 8.82], [-0.52, 8.9], [-0.45, 9.55], [0, 9.62]]);
    s.fu = { uErase: s.su.uErase, uEye: { value: EYE.clone() } };
    s.fig = new THREE.Mesh(shapeGeo(agent, 1.7), new THREE.ShaderMaterial({ uniforms: s.fu, vertexShader: FIG_V, fragmentShader: FIG_F, side: THREE.DoubleSide }));
    s.fig.position.set(0, 0.4, -21);
    s.fig.frustumCulled = false; s.fig.name = 's15-agent';
    tube.add(s.fig);

    // the funnel: loft from the screen's rim back past the player to the neck (black, cyan rim only)
    const N = 64, rim = [];
    for (let i = 0; i < 16; i++) rim.push(capPt(-100 + (200 * i) / 16, 45, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(100, 45 - (75 * i) / 16, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(100 - (200 * i) / 16, -30, RS));
    for (let i = 0; i < 16; i++) rim.push(capPt(-100, -30 + (75 * i) / 16, RS));
    const neck = rim.map((p) => { const a = Math.atan2(p.y - NECK.y, p.x); return new THREE.Vector3(Math.cos(a) * 2.5, NECK.y + Math.sin(a) * 2.5, NECK.z); });
    const RINGS = 6, ring = (j) => rim.map((p, i) => p.clone().lerp(neck[i], Math.pow(j / RINGS, 0.85)));
    const P = [];
    let prev = ring(0);
    for (let j = 1; j <= RINGS; j++) {
      const cur = ring(j);
      for (let i = 0; i < N; i++) {
        const a0 = prev[i], a1 = prev[(i + 1) % N], b0 = cur[i], b1 = cur[(i + 1) % N];
        P.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, a1.x, a1.y, a1.z, a1.x, a1.y, a1.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z);
      }
      prev = cur;
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    fg.computeVertexNormals();
    const nk = new THREE.CylinderGeometry(2.5, 2.5, 13, 16, 1, true); nk.rotateX(Math.PI / 2); nk.translate(0, NECK.y, NECK.z + 6.5);
    const cap = new THREE.CircleGeometry(2.5, 16); cap.rotateY(Math.PI); cap.translate(0, NECK.y, NECK.z + 13);
    s.walls = new THREE.Mesh(mergeSimple([fg, nk.toNonIndexed(), cap.toNonIndexed()]), kit.toon({ ramp: 'black', rim: PAL.petrol, rimAmt: 0.5, side: THREE.DoubleSide }));
    s.walls.frustumCulled = false;
    // Leo 07.11.: no frame around the player. The funnel's lit rim curved under and around the
    // player like a cockpit edge, so the funnel is built but not drawn: only the screen stays.
    s.walls.visible = false;
    tube.add(s.walls);

    // lyric type: one block, low centre on the screen's lower field
    s.ywnh = kit.text('YOU WERE NEVER HERE', { cap: 0.95, color: 'cream', near: 119.56, at: { d: 6, az: 0, y: 0.55 } });
    const tt = s.ywnh.times.slice(); tt[0] = 119.98; s.ywnh.setTimes(tt);
    // each word goes when the erase bar passes it
    for (let i = 0; i < s.ywnh.words.length; i++) {
      const W = s.ywnh.words[i], uw = Math.atan2((W.x0 + W.x1) / 2, 6) / AZH;
      let tw = WIPE1;
      for (let q = 0; q <= 120; q++) { const tq = WIPE0 + ((WIPE1 - WIPE0) * q) / 120; if (eraseAt(tq) >= uw) { tw = tq; break; } }
      s.ywnh.hideWord(i, tw);
    }
    s.lo = kit.text('LIGHTS OUT', { cap: 1.3, color: 'gold', near: 124.94, out: 127.1, outDur: 0.01, at: { d: 6, az: 0, y: 0.55 } });
    return s;
  },
  update(t, s, kit) {
    const su = s.su;
    // power on at the downbeat, then the phosphor fades a little after the wipe
    let g = t < 120.08 ? 0.5 : 1;
    g *= t < 123.75 ? 1 : t < 124.2 ? 0.8 : 0.62;
    if (t < 123.0) g *= 1 + 0.25 * kit.downEnv(t, 5);
    su.uGrat.value = g;
    su.uSqV.value = kit.sm(124.94, 125.34, t);
    su.uSqU.value = kit.sm(126.38, 126.5, t);
    su.uLine.value = kit.sm(125.2, 125.34, t);
    su.uDot.value = t >= 126.5 ? 0.0035 + 0.0135 * kit.sm(126.91, 127.62, t) : 0;
    su.uErase.value = t < WIPE0 ? -2 : eraseAt(t);
    su.uBar.value = t >= WIPE0 && t < WIPE1 + 0.05 ? 1 : 0;
    s.fig.visible = t < WIPE1 + 0.05;
    // "out": a designed black beat (only LIGHTS OUT and the dot); the funnel is not drawn
    // LIGHTS OUT squashes flat after "out"
    const m = s.lo.mesh;
    m.scale.y = 1 - 0.97 * kit.sm(126.9, 127.02, t);
    m.scale.x = 1 - 0.98 * kit.sm(127.02, 127.1, t);
  },
  events() {
    return [
      { t: 119.98, sfx: 'switch', gain: 0.45 },
      { t: WIPE0, sfx: 'whoosh', gain: 0.4 },
      { t: 124.94, sfx: 'switch', gain: 0.6, haptic: [0.3, 60] },
      { t: 126.38, sfx: 'tick', gain: 0.55 },
    ];
  },
};
