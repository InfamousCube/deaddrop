// Group 4, part B: S16 the Dynamo Sun (final chorus: angel in front of the sun, the spy is her shadow)
// and S17 the sea launch platform (count down to zero = a launch; the exhaust becomes the gold wire).
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { D2R, EYE, f, inst, setM, setMQ, initColors, setC, mixC, boxAt, shapeGeo, mirrorOutline, crescent, profile, lin, lerp, lerpCol, envAt, clamp01, tmpC } from './scenes-4-util.js';

// thin box from A to B (for lattices and cables)
const _o = new THREE.Object3D();
function seg(ax, ay, az, bx, by, bz, th) {
  const g = new THREE.BoxGeometry(th, th, Math.hypot(bx - ax, by - ay, bz - az));
  _o.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  _o.lookAt(bx, by, bz);
  _o.updateMatrix();
  return g.applyMatrix4(_o.matrix);
}
// tapered square lattice tower (legs, a bar ring per level, X braces on all four faces), base at y 0
function lattice(h, b0, b1, lv, th) {
  const P = [], w = (y) => b0 + (b1 - b0) * (y / h);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(seg(sx * b0, 0, sz * b0, sx * b1, h, sz * b1, th));
  for (let k = 1; k <= lv; k++) {
    const y = (h * k) / lv, a = w(y), y0 = (h * (k - 1)) / lv, a0 = w(y0), tr = th * 0.75, tb = th * 0.6;
    P.push(seg(-a, y, -a, a, y, -a, tr), seg(-a, y, a, a, y, a, tr), seg(-a, y, -a, -a, y, a, tr), seg(a, y, -a, a, y, a, tr));
    P.push(seg(-a0, y0, -a0, a, y, -a, tb), seg(a0, y0, -a0, -a, y, -a, tb), seg(-a0, y0, a0, a, y, a, tb), seg(a0, y0, a0, -a, y, a, tb));
    P.push(seg(-a0, y0, -a0, -a, y, a, tb), seg(-a0, y0, a0, -a, y, -a, tb), seg(a0, y0, -a0, a, y, a, tb), seg(a0, y0, a0, a, y, -a, tb));
  }
  return P;
}
// sagging cable from A to B as n thin boxes
function catenary(ax, ay, az, bx, by, bz, sag, n, th, out) {
  let px = ax, py = ay, pz = az;
  for (let k = 1; k <= n; k++) {
    const u = k / n, nx = ax + (bx - ax) * u, ny = ay + (by - ay) * u - 4 * sag * u * (1 - u), nz = az + (bz - az) * u;
    out.push(seg(px, py, pz, nx, ny, nz, th)); px = nx; py = ny; pz = nz;
  }
  return out;
}

const GROUND_V = /* glsl */ `varying vec3 vW; varying float vDepth;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const GROUND_F = /* glsl */ `
uniform float uOff, uGrid, uBlack, uFade, uSceneFade; uniform float uProf[24]; uniform vec2 uShZ; uniform vec3 uLine, uBase;
varying vec3 vW; varying float vDepth;
void main() {
  vec2 g = vec2(vW.x + 4.0, vW.z - uOff) / 8.0;
  vec2 fw = fwidth(g);
  vec2 gl = abs(fract(g + 0.5) - 0.5);
  float w = 0.009;
  float ln = max(1.0 - smoothstep(w, w + fw.x * 1.5, gl.x), 1.0 - smoothstep(w, w + fw.y * 1.5, gl.y));
  ln *= clamp(1.3 - max(fw.x, fw.y) * 2.5, 0.0, 1.0);
  ln *= 1.0 - smoothstep(150.0, 290.0, vDepth);
  float sh = 0.0;
  float span = uShZ.y - uShZ.x;
  if (abs(span) > 0.5) {
    float sp = (vW.z - uShZ.x) / span;
    if (sp >= 0.0 && sp <= 1.0) {
      float fi = sp * 23.0; int i0 = int(floor(fi)); int i1 = min(i0 + 1, 23);
      float wd = mix(uProf[i0], uProf[i1], fract(fi));
      sh = step(abs(vW.x), wd);
    }
  }
  sh = max(sh, step(length(vW.xz), uBlack));
  vec3 c = mix(uBase, uLine, ln * uGrid) * (1.0 - sh);
  gl_FragColor = vec4(c * uFade * uSceneFade, 1.0);
  #include <colorspace_fragment>
}`;

// flame tongue (width 2, height 1, base on y = 0)
const FLAME = [[-1, 0], [-0.8, 0.45], [-0.55, 0.3], [-0.35, 0.85], [-0.1, 0.55], [0.05, 1.0], [0.25, 0.5], [0.45, 0.75], [0.65, 0.35], [0.85, 0.5], [1, 0]];

// =================================================================================================
// S16 The Dynamo Sun (127.62 to 136.03, amber then hot)
const EL16 = 14 * D2R;
const D_ENG = 150;
const HEAD_Y = 1.6 + D_ENG * Math.tan(EL16);   // her head sits exactly on the sun
const ENG_S = 1.45, HEAD_L = 45.5;              // outline scale, head centre in outline units
const BASE_Y = HEAD_Y - HEAD_L * ENG_S;
const GY = -0.6;                                // plain level (under the deck)
const SH_A = profile([[0, 34], [0.2, 32], [0.33, 26], [0.4, 15], [0.46, 8], [0.52, 13], [0.62, 15.5], [0.78, 15], [0.88, 12], [0.95, 7], [1, 0]]);
const SH_B = profile([[0, 34], [0.25, 31], [0.33, 25], [0.4, 21], [0.46, 23], [0.5, 9], [0.56, 11], [0.62, 12], [0.64, 24], [0.7, 24], [0.72, 11], [0.86, 10.5], [0.95, 8], [1, 0]]);

export const S16 = {
  id: 'S16', t0: 127.62, t1: 136.03, world: 'amber', pre: 0.05, post: 0,
  key: [0, 0.3, -0.95],
  fog: { color: PAL.velvet, near: 120, far: 420 },
  flashes: [{ t: 127.64, color: PAL.amber, dur: 0.03 }],
  build(kit) {
    const s = { sky: {}, foc: [0, 0, -1], c: Array.from({ length: 7 }, () => new THREE.Color()), v: new THREE.Vector3() };
    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    s.prof = kit.travel([[127.62, 8, 0.01]]);
    s.spin = kit.travel([[128.36, 0.15, 1.0]]);

    // the endless black plain with a thin gold grid; her shadow is painted into it
    s.gu = {
      uOff: { value: 0 }, uGrid: { value: 0 }, uBlack: { value: 0 }, uProf: { value: new Array(24).fill(0) }, uShZ: { value: new THREE.Vector2(-150, -150) },
      uLine: { value: new THREE.Color(PAL.gold) }, uBase: { value: new THREE.Color(PAL.velvet) }, uFade: kit.U.uFade, uSceneFade: kit.SU.uSceneFade,
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: s.gu, vertexShader: GROUND_V, fragmentShader: GROUND_F }));
    ground.position.y = GY; ground.frustumCulled = false; ground.name = 's16-plain';
    root.add(ground);

    // outer rust ring of the sun (the dome draws the amber core and the orange ring)
    s.sunRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.24, 64), kit.flat({ color: PAL.rust, fog: 0, depthWrite: false }));
    s.sunRing.renderOrder = -8;
    root.add(s.sunRing);

    // two colossal dynamo rings, 12 m clear of the wire, turning in opposite directions
    s.rings = [];
    const torus = new THREE.TorusGeometry(28, 2.4, 8, 72); torus.rotateY(Math.PI / 2);
    const rimG = new THREE.TorusGeometry(30.7, 0.32, 4, 96); rimG.rotateY(Math.PI / 2);
    const bodyMat = kit.toon({ ramp: 'black', rim: 'world' }), rimMat = kit.flat({ color: PAL.gold, fog: 0.6 });
    for (let sd = 0; sd < 2; sd++) {
      const g = new THREE.Group();
      g.position.set(sd ? 14.6 : -14.6, GY + 30.5, -40);
      g.add(new THREE.Mesh(torus, bodyMat), new THREE.Mesh(rimG, rimMat));
      const coils = initColors(inst(new THREE.BoxGeometry(2.6, 3.2, 3.4), kit.flat({ color: PAL.white, fog: 0.6 }), 48, 's16-coils'), 48, PAL.brassDark);
      for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; setM(coils, i, 0, Math.cos(a) * 24.4, Math.sin(a) * 24.4, 1, 1, 1, a, 0, 0); }
      g.add(coils);
      root.add(g);
      s.rings.push({ g, coils, dir: sd ? -1 : 1 });
    }

    // a ring of flat flame tongues along the whole horizon (360 deg)
    const NF = 44;
    s.flames = initColors(inst(shapeGeo(FLAME), kit.flat({ color: PAL.white, fog: 0.25, side: THREE.DoubleSide }), NF, 's16-flames'), NF);
    s.fl = [];
    const R = kit.rnd(1601);
    for (let i = 0; i < NF; i++) {
      const a = (i / NF) * Math.PI * 2 + R() * 0.05, r = i % 2 ? 96 : 114;
      s.fl.push({ x: Math.sin(a) * r, z: -Math.cos(a) * r, ry: -a, w: 10 + R() * 6, h: 38 + R() * 20, d: R() * 0.25 });
      setC(s.flames, i, [PAL.goldHi, PAL.amber, PAL.gold][i % 3], 1.15);
    }
    root.add(s.flames);

    // the power line: two rows of 36 m lattice pylons 34 m left and right (rows of repeated giants for
    // the sides and the back), gold cables sagging from pylon to pylon; marker posts tick past the cradle
    s.pyl = new THREE.Group();
    root.add(s.pyl);
    const PYL = 12, PSP = 40, PX = 34;
    const towerG = mergeSimple([...lattice(36, 3.6, 1.0, 4, 0.7), boxAt(19, 0.9, 0.9, 0, 30, 0), boxAt(13, 0.9, 0.9, 0, 35, 0)]);
    const cab = [];
    for (const [x, y] of [[-9, 30], [9, 30], [-6, 35], [6, 35]]) {
      cab.push(boxAt(0.4, 2.4, 0.4, x, y - 1.7, 0));
      catenary(x, y - 2.9, 0, x, y - 2.9, -PSP, 4, 8, 0.16, cab);
    }
    s.pylBody = inst(towerG, kit.toon({ ramp: 'black', rim: 'world' }), PYL * 2, 's16-pylons');
    s.pylCab = inst(mergeSimple(cab), kit.flat({ color: PAL.gold, fog: 0.6 }), PYL * 2, 's16-cables');
    for (let i = 0; i < PYL * 2; i++) { const sd = i < PYL ? -1 : 1, z = 60 - (i % PYL) * PSP; setM(s.pylBody, i, sd * PX, GY, z); setM(s.pylCab, i, sd * PX, GY, z); }
    const NP = 30;
    s.posts = inst(boxAt(0.5, 3.2, 0.5, 0, 1.6, 0), kit.toon({ ramp: 'black', rim: 'world' }), NP * 2, 's16-posts');
    s.postCaps = inst(boxAt(0.75, 0.4, 0.75, 0, 3.4, 0), kit.flat({ color: PAL.gold, fog: 0.5 }), NP * 2, 's16-post-caps');
    for (let i = 0; i < NP * 2; i++) { const sd = i < NP ? -1 : 1, z = 70 - (i % NP) * 8; setM(s.posts, i, sd * 7.5, GY, z); setM(s.postCaps, i, sd * 7.5, GY, z); }
    s.pyl.add(s.pylBody, s.pylCab, s.posts, s.postCaps);

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
    const gl1 = new THREE.CircleGeometry(2.35 * ENG_S, 24); gl1.translate(-4.5 * ENG_S, HEAD_L * ENG_S, 0.6);
    const gl2 = new THREE.CircleGeometry(2.35 * ENG_S, 24); gl2.translate(4.5 * ENG_S, HEAD_L * ENG_S, 0.6);
    s.glassMat = kit.flat({ color: PAL.white, fog: 0 });
    eng.add(new THREE.Mesh(mergeSimple([gl1, gl2]), s.glassMat));
    s.smile = new THREE.Mesh(shapeGeo(crescent(4 * ENG_S, 2.15 * ENG_S, ENG_S)), kit.flat({ color: PAL.gold, fog: 0 }));
    s.smile.position.set(0, HEAD_L * ENG_S - 4.8 * ENG_S, 0.6);
    eng.add(s.smile);
    // two wing fans of 20 gold wires each
    s.wings = inst(new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0), kit.flat({ color: PAL.gold, fog: 0 }), 40, 's16-wings');
    s.wingMat = s.wings.material;
    eng.add(s.wings);

    // lyric type
    kit.text('GOLD ON THE WIRE', { cap: 1.6, color: 'gold', near: 127.68, pop: true, out: 131.45, at: { d: 8, az: 0, y: 1.1 } });
    kit.text('FIRE IN THE SKY', { cap: 1.15, color: 'cream', near: 129.8, out: 131.55, at: { d: 8, az: 0, y: 5.6, tilt: 20 } });
    kit.text('SMILE LIKE\nAN ANGEL', { cap: 0.9, color: 'gold', near: 131.68, say: 'smile like an angel', out: 135.3, at: { d: 7.5, az: -27, y: 1.15 } });
    s.lie = kit.text('LIE LIKE A\nSPY', { cap: 0.95, color: 'cream', colors: { 3: 'rust' }, near: 134.56, say: 'lie like a spy', at: { d: 7.5, az: 27, y: 1.15 } });
    s.lieY = s.lie.mesh.position.y;
    return s;
  },
  update(t, s, kit) {
    s.root.visible = t >= 127.62;
    const d = s.prof.d(t);
    const on = t >= 127.68;
    const cool = kit.sm(131.2, 131.68, t);
    // the plain
    s.gu.uOff.value = d;
    s.gu.uGrid.value = kit.sm(127.68, 127.85, t) * (1 - 0.6 * kit.sm(135.5, 135.9, t));
    // the sun: a dot that bursts open on "Gold", sets at the end when the spy's shadow takes the plain
    const el = EL16 - 28 * D2R * kit.ease.in(lin(135.72, 136.03, t));
    s.foc[0] = 0; s.foc[1] = Math.sin(el); s.foc[2] = -Math.cos(el);
    let sunR = t < 127.68 ? 0.017 + 0.02 * lin(127.62, 127.68, t) : 0.037 + 0.163 * kit.ease.out(lin(127.68, 127.95, t));
    sunR *= 1 + 0.03 * kit.downEnv(t, 5);
    s.sunRing.visible = on;
    s.v.set(s.foc[0], s.foc[1], s.foc[2]).multiplyScalar(270).add(EYE);
    s.sunRing.position.copy(s.v);
    s.sunRing.lookAt(EYE);
    const rr = Math.tan(sunR * 1.28) * 270;
    s.sunRing.scale.set(rr, rr, 1);
    // dynamo rings: start on "on the wire", coils light around each ring one after another
    const ang = s.spin.d(t);
    const ringZ = -40 + d;
    for (const R of s.rings) {
      R.g.position.z = ringZ;
      R.g.rotation.x = ang * R.dir;
      for (let i = 0; i < 48; i++) {
        const tl = 128.36 + (i / 48) * 0.58;
        if (t < tl) setC(R.coils, i, PAL.brassDark, 0.8);
        else mixC(R.coils, i, PAL.gold, PAL.goldHi, envAt(t, tl, 6) + 0.6 * kit.beatEnv(t, 7));
      }
      R.coils.instanceColor.needsUpdate = true;
      R.g.visible = ringZ < 120;
    }
    // the power line travels with the plain; cables flare on "Gold" and on the downbeats
    s.pyl.position.z = d;
    s.pylCab.material.uniforms.uBright.value = 1 + 1.2 * envAt(t, 127.68, 3) + 0.35 * kit.downEnv(t, 5);
    s.postCaps.material.uniforms.uBright.value = 1 + 0.6 * kit.beatEnv(t, 7);
    // "fire": the flame ring leaps up around the whole horizon and falls back over 2 s
    const fu = kit.ease.out(lin(129.8, 130.25, t)) * (1 - kit.ease.inOut(lin(130.8, 131.85, t)));
    s.flames.visible = fu > 0.002;
    if (s.flames.visible) {
      for (let i = 0; i < s.fl.length; i++) {
        const F = s.fl[i], k = clamp01(fu * 1.25 - F.d * 0.6);
        setM(s.flames, i, F.x, GY, F.z, F.w, F.h * k * (1 + 0.06 * Math.sin(t * 9 + i)), 1, 0, F.ry, 0);
      }
      s.flames.instanceMatrix.needsUpdate = true;
    }
    // the Engineer rises in front of the sun on "Smile", sinks again after "spy"
    const rise = kit.ease.inOut(lin(131.68, 132.68, t));
    s.eng.position.y = BASE_Y - 70 * (1 - rise) - 70 * kit.ease.in(lin(135.75, 136.03, t));
    s.eng.visible = rise > 0.001;
    s.engRimMat.uniforms.uColor.value.copy(lerpCol(tmpC, PAL.amber, PAL.gold, cool));
    const lie = t >= 134.56;
    s.glassMat.uniforms.uColor.value.set(lie ? PAL.red : PAL.white);
    s.glassMat.uniforms.uBright.value = 1 + 0.6 * envAt(t, 134.56, 5);
    s.smile.scale.y = 1 - 0.78 * kit.sm(134.56, 134.72, t);
    // "like an angel": two fans of gold wires spread to 120 m; they flare on the downbeat
    const wk = kit.ease.out(lin(132.56, 133.54, t));
    s.wings.visible = wk > 0.001;
    if (s.wings.visible) {
      for (let j = 0; j < 20; j++) {
        const a = lerp(-95, -14 + j * (96 / 19), wk) * D2R, len = 4 + 60 * wk;
        setM(s.wings, j, 17 * ENG_S, 26 * ENG_S, -2, len, 0.7, 0.7, 0, 0, a);
        setM(s.wings, 20 + j, -17 * ENG_S, 26 * ENG_S, -2, len, 0.7, 0.7, 0, 0, Math.PI - a);
      }
      s.wings.instanceMatrix.needsUpdate = true;
      s.wingMat.uniforms.uBright.value = 1 + 1.4 * envAt(t, 133.75, 4) - 0.35 * kit.sm(134.56, 134.8, t);
    }
    // her shadow on the plain: grows as she rises, morphs into the spy and slides over the cradle
    const mk = kit.sm(135.06, 135.72, t);
    const P = s.gu.uProf.value;
    for (let i = 0; i < 24; i++) P[i] = lerp(SH_A[i], SH_B[i], mk) * (0.45 + 0.55 * rise);
    const zNear = rise <= 0 ? -150 : lerp(lerp(-150, -46, rise), 34, kit.ease.inOut(mk));
    s.gu.uShZ.value.set(-150, zNear);
    s.gu.uBlack.value = 80 * kit.sm(135.62, 135.82, t);
    // LIE LIKE A SPY is swallowed by the shadow on "spy"
    s.lie.mesh.position.y = s.lieY - 3.4 * kit.ease.in(lin(135.72, 136.0, t));

    if (kit.isOwner) {
      kit.setWorld('hot', cool);
      const sk = s.sky, c = s.c;
      sk.focal = s.foc; sk.rot = t * 0.035; sk.ringPhase = t * 0.12;
      sk.sunR = sunR; sk.sunCol = PAL.amber; sk.sunRing = PAL.orange;
      if (!on) {
        sk.zen = sk.hor = sk.hor2 = sk.nadir = PAL.black; sk.rays = 0; sk.rings = 0; sk.rayA = sk.rayB = PAL.black;
      } else {
        sk.zen = lerpCol(c[0], PAL.rust, PAL.velvet, cool);
        sk.hor2 = lerpCol(c[1], PAL.orange, PAL.carmineDeep, cool);
        sk.hor = lerpCol(c[2], PAL.amber, PAL.carmine, cool);
        sk.nadir = PAL.velvet;
        sk.rayA = lerpCol(c[3], PAL.orange, PAL.crimson, cool);
        sk.rayB = lerpCol(c[4], PAL.rust, PAL.carmineDeep, cool);
        sk.ringCol = lerpCol(c[5], PAL.amber, PAL.gold, cool);
        sk.rays = 1; sk.rings = 1;
      }
      sk.rayR = 1.3 + 1.9 * kit.sm(130.46, 131.16, t);
      kit.setSky(sk);
      const rs = kit.rigState;
      rs.wire.on = on ? 1 : 0;
      rs.wire.lenF = rs.wire.lenB = 290 * kit.ease.out(lin(127.68, 128.1, t));
      rs.wheelSpin = d / 0.075;
      if (t >= 127.68 && t < 128.2) rs.gauge = 1;
    }
  },
  events() {
    return [
      { t: 127.68, sfx: 'whoosh', gain: 0.85, haptic: [0.6, 90] },
      { t: 128.36, sfx: 'motor', gain: 0.5 },
      { t: 129.8, sfx: 'crack', gain: 0.5, haptic: [0.3, 60] },
      { t: 133.54, sfx: 'ping', gain: 0.4 },
      { t: 134.56, sfx: 'switch', gain: 0.5 },
      { t: 135.72, sfx: 'drop', gain: 0.6, haptic: [0.5, 120] },
    ];
  },
};

// =================================================================================================
// S17 The sea launch platform (136.03 to 142.91, hot then amber)
// The rocket stands front-LEFT (az -30) so that its rising trail, and the GOLD ON THE WIRE line on it,
// read left to right and end on the vanishing point where S18's sun appears (match-cut).
const EL17 = 9 * D2R;
const FOC17 = [0, Math.sin(EL17), -Math.cos(EL17)];
const P0 = new THREE.Vector3(-6, 0, -10.4), P1 = new THREE.Vector3(-6, 42, -10.4), P2 = new THREE.Vector3(-3, 40.5, -80);
const PT = new THREE.Vector3(0, 1.6 + 240 * Math.sin(EL17), 0.05 - 240 * Math.cos(EL17));
const UP = new THREE.Vector3(0, 1, 0);
const uAt = (t) => { const k = clamp01((t - 138.94) / 3.78); return k * k; };
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
const DECK_Y = -0.45;
const GANTRY = new THREE.Vector3(-17, DECK_Y, -13);
const LAMP_OFF = [138.1, 138.04, 137.48, 137.28]; // bottom lamp 1 .. top lamp 4
const K_PRE = new THREE.Vector3(-0.62, 0.42, -0.66).normalize(), K_IGN = new THREE.Vector3(0.15, -0.55, 0.82).normalize();

export const S17 = {
  id: 'S17', t0: 136.03, t1: 142.91, world: 'hot', pre: 0.5, post: 0,
  key: [-0.62, 0.42, -0.66],
  fog: { color: PAL.velvet, near: 60, far: 290 },
  build(kit) {
    const s = { sky: {}, c: Array.from({ length: 7 }, () => new THREE.Color()), p: new THREE.Vector3(), tan: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), ax: new THREE.Vector3(), tmp: new THREE.Vector3(), tmp2: new THREE.Vector3(), one: new THREE.Vector3(1, 0, 0) };
    // the flat black sea and its sunburst glints (static, not travelling)
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), kit.flat({ color: PAL.velvet, fog: 0 }));
    sea.position.y = -2.6;
    kit.group.add(sea);
    const R = kit.rnd(1701);
    const NG = 110;
    const glints = initColors(inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), kit.flat({ color: PAL.white, fog: 0.5 }), NG, 's17-glints'), NG);
    for (let i = 0; i < NG; i++) {
      const z = -30 - Math.pow(R(), 0.7) * 250, spread = 12 + (-z) * 0.45;
      setM(glints, i, (R() - 0.5) * 2 * spread * Math.pow(R(), 1.5), -2.55, z, 6 + R() * 26, 1, 0.35 + R() * 0.5);
      setC(glints, i, [PAL.crimson, PAL.carmine, PAL.gold, PAL.crimson][i % 4], 0.7 + R() * 0.3);
    }
    kit.group.add(glints);
    s.sea = sea; s.glints = glints;

    // everything on the pad travels in with the deck
    const W = (s.world = new THREE.Group());
    kit.group.add(W);
    s.prof = kit.travel([[135.53, 8, 0.01], [136.0, 0, 1.2]]);
    s.dEnd = s.prof.d(137.4);
    // the black steel deck with gold edge stripes, a pad ring and the flame trench
    W.add(new THREE.Mesh(boxAt(70, 2.4, 64, -8, DECK_Y - 1.2, -14), kit.flat({ color: PAL.velvet, fog: 0.5 })));
    // giants for the sides and the back: four 70 m lightning masts on the deck corners, gold wires
    // strung between their tops overhead, and two spherical fuel tanks (right-behind and left)
    const MH = 70, MC = [[-41, -44], [25, -44], [25, 16], [-41, 16]];
    const mastG = mergeSimple(lattice(MH, 2.6, 0.6, 7, 0.75));
    s.masts = inst(mastG, kit.toon({ ramp: 'black', rim: 'world' }), 4, 's17-masts');
    MC.forEach(([x, z], i) => setM(s.masts, i, x, DECK_Y, z));
    const mw = [];
    for (let i = 0; i < 4; i++) { const [ax, az] = MC[i], [bx, bz] = MC[(i + 1) % 4]; catenary(ax, DECK_Y + MH, az, bx, DECK_Y + MH, bz, 9, 14, 0.22, mw); }
    s.mastWires = new THREE.Mesh(mergeSimple(mw), kit.flat({ color: PAL.gold, fog: 0.4 }));
    s.mastWires.frustumCulled = false;
    const tankG = mergeSimple([new THREE.SphereGeometry(6.5, 18, 10).translate(0, 9.5, 0), ...[0, 1, 2, 3].map((k) => { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; return seg(Math.cos(a) * 5.4, 0, Math.sin(a) * 5.4, Math.cos(a) * 4.2, 8, Math.sin(a) * 4.2, 0.9); })]);
    s.tanks = inst(tankG, kit.toon({ ramp: 'cream', rim: 'world' }), 2, 's17-tanks');
    setM(s.tanks, 0, 20, DECK_Y, 9); setM(s.tanks, 1, -35, DECK_Y, 5);
    s.tankBands = inst(new THREE.CylinderGeometry(6.62, 6.62, 1.4, 18, 1, true).translate(0, 9.5, 0), kit.toon({ ramp: 'rust', rim: null, side: THREE.DoubleSide }), 2, 's17-tank-bands');
    setM(s.tankBands, 0, 20, DECK_Y, 9); setM(s.tankBands, 1, -35, DECK_Y, 5);
    W.add(s.masts, s.mastWires, s.tanks, s.tankBands);
    const stripes = [boxAt(70, 0.06, 0.5, -8, DECK_Y + 0.02, 17.6), boxAt(70, 0.06, 0.5, -8, DECK_Y + 0.02, -45.6), boxAt(0.5, 0.06, 64, 26.8, DECK_Y + 0.02, -14), boxAt(0.5, 0.06, 64, -42.8, DECK_Y + 0.02, -14)];
    for (let i = 0; i < 9; i++) stripes.push(boxAt(0.35, 0.06, 6, -2 + i * 3, DECK_Y + 0.02, 14.2, 0, 0.6, 0));
    const ringG = new THREE.RingGeometry(7.5, 8.1, 40).rotateX(-Math.PI / 2); ringG.translate(P0.x, DECK_Y + 0.03, P0.z);
    W.add(new THREE.Mesh(mergeSimple([...stripes, ringG]), kit.flat({ color: PAL.gold, fog: 0.8 })));
    W.add(new THREE.Mesh(boxAt(34, 0.08, 6, P0.x - 17, DECK_Y + 0.04, P0.z), kit.flat({ color: PAL.black, fog: 0 })));

    // the rocket: cream body, crimson bands, black fins, in three hard steps
    const rk = (s.rocket = new THREE.Group());
    rk.position.copy(P0);
    W.add(rk);
    const cy = (r0, r1, h, y, n = 18) => { const g = new THREE.CylinderGeometry(r1, r0, h, n); g.translate(0, y + h / 2, 0); return g; };
    const nose = new THREE.ConeGeometry(2.2, 6.5, 18); nose.translate(0, 49.5 + 3.25, 0);
    s.creamMat = kit.toon({ ramp: 'cream', rim: PAL.gold, rimAmt: 0.9 });
    rk.add(new THREE.Mesh(mergeSimple([cy(2.6, 2.6, 40, 2.5), cy(2.6, 2.2, 2, 42.5), cy(2.2, 2.2, 5, 44.5), nose]), s.creamMat));
    s.bandMat = kit.toon({ ramp: 'hot', rim: PAL.gold, rimAmt: 0.8 });
    rk.add(new THREE.Mesh(mergeSimple([cy(2.66, 2.66, 2.4, 7), cy(2.66, 2.66, 1.4, 27), cy(2.66, 2.66, 1.4, 36), cy(2.26, 2.26, 1.6, 46.2)]), s.bandMat));
    const fins = [cy(2.0, 1.4, 2.5, 0, 12)];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; fins.push(boxAt(0.3, 7, 3.4, Math.cos(a) * 3.6, 5.5, Math.sin(a) * 3.6, 0, -a, 0)); }
    rk.add(new THREE.Mesh(mergeSimple(fins), kit.toon({ ramp: 'black', rim: PAL.gold })));
    // flat cel plume (three nested cones), pointing out of the nozzle
    s.plume = new THREE.Group();
    const plumeC = (r, h, col) => { const g = new THREE.ConeGeometry(r, h, 7, 1, true); g.rotateX(Math.PI); g.translate(0, -h / 2, 0); return new THREE.Mesh(g, kit.flat({ color: col, fog: 0, side: THREE.DoubleSide })); };
    s.plume.add(plumeC(3.0, 16, PAL.rust), plumeC(2.1, 11, PAL.orange), plumeC(1.3, 6.5, PAL.amber));
    s.plume.children[1].renderOrder = 1; s.plume.children[2].renderOrder = 2;
    rk.add(s.plume);
    // the amber dot the rocket becomes (billboard)
    s.dot = new THREE.Mesh(new THREE.CircleGeometry(1, 24), kit.flat({ color: PAL.amber, fog: 0 }));
    s.dot.renderOrder = 4;
    W.add(s.dot);
    // the gold line the trail hardens into
    s.line = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5), kit.flat({ color: PAL.goldHi, fog: 0 }));
    s.line.frustumCulled = false;
    W.add(s.line);

    // the gantry: a 60 m black lattice tower, lamps, swing arms and gold umbilicals
    const lat = [];
    const H = 60, wdt = 5, lv = 15;
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lat.push(boxAt(0.5, H, 0.5, (x * wdt) / 2, H / 2, (z * wdt) / 2));
    for (let l = 0; l <= lv; l++) {
      const y = (l * H) / lv;
      lat.push(boxAt(wdt, 0.32, 0.32, 0, y, -wdt / 2), boxAt(wdt, 0.32, 0.32, 0, y, wdt / 2), boxAt(0.32, 0.32, wdt, -wdt / 2, y, 0), boxAt(0.32, 0.32, wdt, wdt / 2, y, 0));
      if (l < lv) {
        const dl = Math.hypot(wdt, H / lv), da = Math.atan2(H / lv, wdt) * (l % 2 ? 1 : -1);
        lat.push(boxAt(dl, 0.22, 0.22, 0, y + H / lv / 2, -wdt / 2, 0, 0, da), boxAt(dl, 0.22, 0.22, 0, y + H / lv / 2, wdt / 2, 0, 0, -da));
        lat.push(boxAt(0.22, 0.22, dl, -wdt / 2, y + H / lv / 2, 0, da, 0, 0), boxAt(0.22, 0.22, dl, wdt / 2, y + H / lv / 2, 0, -da, 0, 0));
      }
    }
    lat.push(boxAt(0.18, 9, 0.18, 0, H + 4.5, 0));
    const toPl = new THREE.Vector3(-GANTRY.x, 0, -GANTRY.z).normalize();
    lat.push(boxAt(3.4, 15, 0.5, toPl.x * 3.4, 15.5, toPl.z * 3.4, 0, Math.atan2(toPl.x, toPl.z), 0));
    const gantry = new THREE.Mesh(mergeSimple(lat), kit.toon({ ramp: 'black', rim: PAL.gold, rimAmt: 0.9 }));
    gantry.position.copy(GANTRY);
    W.add(gantry);
    s.lamps = initColors(inst(new THREE.CircleGeometry(1.15, 20), kit.flat({ color: PAL.white, fog: 0.3 }), 4, 's17-lamps'), 4, PAL.red);
    const o = new THREE.Object3D();
    for (let j = 0; j < 4; j++) {
      o.position.set(GANTRY.x + toPl.x * 3.75, DECK_Y + 10 + j * 3.6, GANTRY.z + toPl.z * 3.75);
      o.lookAt(EYE); o.updateMatrix(); s.lamps.setMatrixAt(j, o.matrix);
    }
    W.add(s.lamps);
    const face = GANTRY.x + wdt / 2;
    s.armPiv = [24, 40].map((y) => new THREE.Vector3(face, DECK_Y + y, GANTRY.z + 1.6));
    const toR = Math.atan2(-(P0.z - (GANTRY.z + 1.6)), P0.x - face);
    s.armRy = toR;
    s.arms = inst(mergeSimple([boxAt(6.4, 0.9, 1.6, 3.2, 0, 0), boxAt(6.4, 0.12, 0.12, 3.2, 1.1, 0.75), boxAt(6.4, 0.12, 0.12, 3.2, 1.1, -0.75)]), kit.toon({ ramp: 'black', rim: PAL.gold }), 2, 's17-arms');
    W.add(s.arms);
    s.umb = [];
    for (let i = 0; i < 6; i++) {
      const y = DECK_Y + 13 + i * 6.2;
      const A = new THREE.Vector3(face, y, GANTRY.z + 0.4 + (i % 2) * 1.2), B = new THREE.Vector3(P0.x - 2.6, y - 1.8, P0.z - 0.4 + (i % 2) * 0.8);
      const dir = B.clone().sub(A);
      const q = new THREE.Quaternion().setFromUnitVectors(s.one, dir.clone().normalize());
      s.umb.push({ A, len: dir.length(), q, ax: dir.clone().normalize().cross(UP).normalize(), ts: 138.1 + i * 0.035 });
    }
    s.umbM = inst(new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0), kit.flat({ color: PAL.gold, fog: 0.6 }), 6, 's17-umbilicals');
    W.add(s.umbM);

    // flames: 12 out of the trench at ignition, 10 that sweep across and burn WHY
    s.flames = initColors(inst(shapeGeo(FLAME), kit.flat({ color: PAL.white, fog: 0.2, side: THREE.DoubleSide }), 22, 's17-flames'), 22);
    s.fl = [];
    for (let i = 0; i < 22; i++) {
      s.fl.push({ w: i < 12 ? 3 + R() * 2.5 : 1.6 + R(), h: i < 12 ? 7 + R() * 9 : 3.2 + R() * 2.2, ph: R() * 6 });
      setC(s.flames, i, [PAL.amber, PAL.orange, PAL.rust][i % 3]);
    }
    W.add(s.flames);

    // all smoke in one GPU system: steam, vent puffs, the ignition billow, the trail and the smoke ring
    const tp = new THREE.Vector3();
    const NT = 56;
    // a black drop-shadow copy behind the line keeps the cream words readable over the cream smoke
    s.whyS = kit.text("DON'T ASK ME WHY", { cap: 0.9, color: 'black', near: 138.94, out: 141.6, at: { d: 6.12, az: -5.55, y: 1.23 } });
    s.why = kit.text("DON'T ASK ME WHY", { cap: 0.9, color: 'cream', near: 138.94, out: 141.6, at: { d: 6, az: -6, y: 1.3 } });
    const ww = s.why.words[3], wa = -6 * D2R, wcx = (ww.x0 + ww.x1) / 2;
    const whyP = [Math.sin(wa) * 6 + Math.cos(wa) * wcx, 1.3 + (ww.y0 + ww.y1) / 2, -Math.cos(wa) * 6 + Math.sin(wa) * wcx];
    const smoke = kit.particles({
      n: 24 + 16 + 96 + 28 + 64 + NT, shape: 'disc', seed: 1702, init: (i, r) => {
        const cr = r() < 0.35 ? PAL.creamDark : PAL.cream;
        if (i < 24) { // steam at the pad base
          const a = Math.PI * (0.55 + r() * 1.25), sp = 0.6 + r() * 1.2, T = 4;
          return { p: [P0.x + Math.cos(a) * 3, DECK_Y + 0.8, P0.z + Math.sin(a) * 3], v: [Math.cos(a) * sp, 0.4, Math.sin(a) * sp], g: [-Math.cos(a) * sp / T, -0.1, -Math.sin(a) * sp / T], freeze: [136.03 + i * 0.05 + T, 1e5], t0: 136.03 + i * 0.05, life: 6, s: 1.4 + r() * 1.6, c: cr };
        }
        i -= 24;
        if (i < 16) { // vent puffs
          const tv = i < 8 ? 136.62 : 137.19, a = -0.4 + r() * 0.8;
          return { p: [P0.x + 2.4, 38 + r() * 3, P0.z], v: [Math.cos(a) * 5, 1 + r(), Math.sin(a) * 5], g: [-2, -0.4, 0], t0: tv + r() * 0.08, life: 1.6, s: 1.2 + r() * 1.4, c: PAL.cream };
        }
        i -= 16;
        if (i < 96) { // ignition billow: 360 deg around the cradle, at least 3 m from the eyes
          const a = r() * Math.PI * 2, r0 = 8 + r() * 3, sp = 3 + r() * 5, T = 2.6;
          const front = Math.abs(((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.6 ? 0.45 : 1;
          const da = Math.abs(((a + 30 * D2R + Math.PI * 3) % (Math.PI * 2)) - Math.PI); // angle from the pad (az -30)
          const t0 = 138.12 + da * 0.11 + r() * 0.08;
          const vy = 0.3 + r() * 1.2;
          return { p: [Math.sin(a) * r0, DECK_Y + 0.2 + r() * 1.0, -Math.cos(a) * r0], v: [Math.sin(a) * sp, vy, -Math.cos(a) * sp], g: [-Math.sin(a) * sp / T, -vy / T, Math.cos(a) * sp / T], freeze: [t0 + T, 1e5], t0, life: 6, s: (1.4 + r() * 1.4) * front, c: cr };
        }
        i -= 96;
        if (i < 28) { // pad billow out of the trench
          const a = r() * Math.PI * 2, sp = 4 + r() * 6, T = 2.2;
          return { p: [P0.x - 3 - r() * 10, DECK_Y + 1, P0.z + (r() - 0.5) * 4], v: [Math.cos(a) * sp - 3, 2 + r() * 4, Math.sin(a) * sp * 0.5], g: [-(Math.cos(a) * sp - 3) / T, -1.5, -Math.sin(a) * sp * 0.5 / T], freeze: [138.1 + T, 1e5], t0: 138.1 + r() * 0.1, life: 5, s: 2.5 + r() * 2.5, c: cr };
        }
        i -= 28;
        if (i < 64) { // the smoke ring expanding to the horizon on the downbeat
          const a = (i / 64) * Math.PI * 2 + r() * 0.1, sp = 40 + r() * 22;
          return { p: [Math.sin(a) * 16, DECK_Y + 0.4 + r() * 1.6, -Math.cos(a) * 16], v: [Math.sin(a) * sp, 0.5 + r(), -Math.cos(a) * sp], t0: 140.61 + r() * 0.08, life: 2.4, s: 3 + r() * 3, c: cr };
        }
        i -= 64;
        // the trail, puffed along the flight path; it vanishes when it hardens into the gold line
        const ti = 139.1 + (i / NT) * 2.6;
        bez(uAt(ti), tp);
        return { p: [tp.x, tp.y, tp.z], v: [(r() - 0.5) * 0.8, (r() - 0.5) * 0.6, (r() - 0.5) * 0.8], t0: ti, life: 141.74 - ti, s: 1.6 + 3.2 * (i / NT) + r(), c: cr };
      },
    });
    W.add(smoke);
    const embers = kit.particles({
      n: 34, shape: 'tri', seed: 1703, init: (i, r) => ({
        p: [whyP[0] + (r() - 0.5) * 1.6, whyP[1] + (r() - 0.5) * 0.7, whyP[2]], v: [(r() - 0.2) * 2.2, 0.6 + r() * 2.2, (r() - 0.5) * 0.8], g: [0.4, -2.5, 0],
        t0: 140.5 + r() * 0.25, life: 1.4, s: 0.1 + r() * 0.12, c: r() < 0.5 ? PAL.amber : PAL.orange,
      }),
    });
    kit.group.add(embers);

    // lyric type
    kit.text('COUNT DOWN TO', { cap: 0.78, color: 'gold', near: 137.28, out: 139.95, outDur: 0.15, at: { d: 6.5, az: 20, y: 3.05 } });
    s.zero = kit.text('0', { cap: 2.0, color: 'amber', times: [138.1], pop: true, dur: 0.1, out: 139.95, outDur: 0.15, at: { d: 6.5, az: 20, y: 1.55 } });
    s.burn = s.why.redact(3, 140.42, { color: PAL.orange });
    s.why.hideWord(3, 140.55);
    s.whyS.hideWord(3, 140.42);
    s.gotw = kit.text('GOLD ON THE WIRE', { cap: 1.05, color: 'gold', near: 141.74, out: 142.86, outDur: 0.05, at: { d: 8, az: -13, y: 3.3 } });
    s.gotw.mesh.rotation.z = 33 * D2R;
    return s;
  },
  update(t, s, kit) {
    // the deck slides in from the vanishing point (pass-by from S16), then the cradle comes to rest
    const slide = -112 * (1 - kit.ease.inOut(lin(135.53, 136.2, t)));
    s.world.position.z = slide + (s.prof.d(t) - s.dEnd);
    s.mastWires.material.uniforms.uBright.value = 1 + 1.1 * envAt(t, 138.2, 2.2) + 0.3 * kit.downEnv(t, 5);
    s.sea.visible = s.glints.visible = t >= 136.03;
    // countdown lamps go out one per word
    for (let j = 0; j < 4; j++) setC(s.lamps, j, t < LAMP_OFF[j] ? PAL.red : 0x1c0405);
    s.lamps.instanceColor.needsUpdate = true;
    // ignition: AMBER CLIMAX 2
    const ign = t >= 138.1;
    const amb = kit.sm(138.08, 138.16, t) * (1 - kit.sm(140.2, 141.0, t));
    // the rocket on its path (vertical, then pitching over toward the vanishing point)
    const u = uAt(t);
    bez(u, s.p); bezD(u, s.tan);
    s.rocket.position.copy(s.p);
    s.q.setFromUnitVectors(UP, s.tan);
    s.rocket.quaternion.copy(s.q);
    const sr = 1 - 0.9 * kit.sm(141.4, 142.62, t);
    s.rocket.scale.setScalar(sr);
    s.rocket.visible = t < 142.72;
    s.creamMat.uniforms.uBright.value = 1 + 0.25 * amb;
    // plume
    s.plume.visible = ign;
    if (ign) {
      const pl = kit.ease.out(lin(138.1, 138.25, t)) * (1 + 1.1 * kit.sm(138.94, 140.4, t));
      s.plume.scale.set(1 + 0.1 * Math.sin(t * 43), pl * (1 + 0.08 * Math.sin(t * 61)), 1 + 0.1 * Math.sin(t * 43));
    }
    // the dot: the flame seen from behind, a constant ~1 deg disc at the nozzle
    s.tmp.copy(s.tan).multiplyScalar(-1.5 * sr).add(s.p);
    s.tmp2.copy(s.tmp).add(s.world.position);
    const dist = s.tmp2.distanceTo(EYE);
    const dk = kit.sm(140.9, 142.4, t);
    s.dot.visible = dk > 0.001;
    if (s.dot.visible) {
      s.dot.position.copy(s.tmp);
      s.dot.lookAt(EYE);
      s.dot.scale.setScalar(Math.max(0.3, dist * 0.0165 * dk));
    }
    // the trail hardens into a straight gold line from the pad to the rocket
    s.line.visible = t >= 141.74;
    if (s.line.visible) {
      s.line.position.set(P0.x, DECK_Y + 0.5, P0.z);
      const L = s.line.position.distanceTo(s.tmp);
      s.tmp2.copy(s.tmp).add(s.world.position);
      s.line.scale.set(0.32, 0.32, L);
      s.line.lookAt(s.tmp2);
    }
    // umbilicals detach on "zero" and swing away
    for (let i = 0; i < 6; i++) {
      const U = s.umb[i], a = t - U.ts;
      const sw = a < 0 ? 0 : (1 - Math.exp(-a * 4) * Math.cos(a * 7)) * 1.25;
      s.q2.setFromAxisAngle(U.ax, -sw).multiply(U.q);
      setMQ(s.umbM, i, U.A, s.q2, U.len * (1 - 0.25 * clamp01(sw)), 0.22, 0.22);
    }
    s.umbM.instanceMatrix.needsUpdate = true;
    // swing arms fall back, one per beat
    for (let i = 0; i < 2; i++) {
      const ta = i ? 140.04 : 139.46;
      const k = kit.ease.out(lin(ta, ta + 0.55, t));
      setM(s.arms, i, s.armPiv[i].x, s.armPiv[i].y, s.armPiv[i].z, 1, 1, 1, 0, s.armRy + 1.65 * k, 0);
    }
    s.arms.instanceMatrix.needsUpdate = true;
    // flames: trench burst at ignition, then the sweep that burns WHY
    const tr = kit.ease.out(lin(138.1, 138.35, t)) * (1 - lin(139.6, 140.4, t));
    const sw = lin(140.28, 140.66, t), swOn = t >= 140.28 && t < 140.75;
    s.flames.visible = tr > 0.002 || swOn;
    if (s.flames.visible) {
      for (let i = 0; i < 22; i++) {
        const F = s.fl[i];
        if (i < 12) {
          const fl = 1 + 0.12 * Math.sin(t * 17 + F.ph);
          setM(s.flames, i, P0.x - 7 - i * 2.4, DECK_Y, P0.z + 0.5, F.w * tr, F.h * tr * fl, 1, 0, 0.25, 0);
        } else {
          const j = i - 12, x = -16 + sw * 30 + (j - 4.5) * 1.5, k = swOn ? Math.sin(Math.PI * clamp01(sw * 1.15 - j * 0.015)) : 0;
          setM(s.flames, i, x, DECK_Y, -8.6 - (j % 3) * 0.6, F.w, F.h * k * (1 + 0.1 * Math.sin(t * 29 + F.ph)), 1, 0, 0, 0);
        }
      }
      s.flames.instanceMatrix.needsUpdate = true;
    }
    if (t > 140.62) s.burn.g.visible = false;
    s.zero.u.uBright.value = 1 + 1.6 * envAt(t, 138.1, 2.5);

    if (kit.isOwner) {
      kit.setWorld('amber', amb);
      kit.U.uKey.value.copy(K_PRE).lerp(K_IGN, kit.sm(138.1, 138.4, t)).normalize();
      const sk = s.sky, c = s.c;
      sk.focal = FOC17; sk.rot = t * 0.035; sk.ringPhase = t * 0.12;
      sk.zen = lerpCol(c[0], PAL.velvet, PAL.rust, amb);
      sk.hor2 = lerpCol(c[1], PAL.carmineDeep, PAL.orange, amb);
      sk.hor = lerpCol(c[2], PAL.carmine, PAL.amber, amb);
      sk.rayA = lerpCol(c[3], PAL.crimson, PAL.orange, amb);
      sk.rayB = lerpCol(c[4], PAL.carmineDeep, PAL.rust, amb);
      sk.ringCol = lerpCol(c[5], PAL.gold, PAL.amber, amb);
      sk.rayR = 1.45 + 1.75 * amb;
      sk.rays = 1; sk.rings = 1;
      kit.setSky(sk);
      const rs = kit.rigState;
      rs.wheelSpin = s.prof.d(t) / 0.075;
      if (t >= 138.1 && t < 138.7) rs.gauge = 1;
    }
  },
  events() {
    return [
      { t: 136.62, sfx: 'pneumatic', gain: 0.5 },
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
