// S11 The sea cable (83.75-95.18, cold). A faceted night sea, buoy rows, a breathing harbour, a
// lighthouse; the sea rises over the head ("Ten floors under"), depth rings rush past, 1500 bubbles
// freeze on "Hold", the Engineer as a diver, the seabed cable lights gold, "GO" rises to a crimson
// surface. Out: SHATTER at 95.18 (the water sheet breaks into cyan shards).
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, facet, box, disc, ball, fitText, sm, clamp01, easeIn, easeOut, easeInOut, env, FOG_U, FOG_APPLY, fogUniforms, TMP } from './scenes-3-util.js';

const T_TICK = 85.42, T_TICK2 = 87.02, T_FEEL = 87.28, T_TEN = 88.86, T_FLOORS = 89.2, T_HOLD = 91.04, T_BREATH = 91.76, T_HERE = 93.14, T_WE = 93.46, T_GO = 94.04, T_OUT = 95.18;
const SEA = -4, BED = -6.5, SL = Math.tan(THREE.MathUtils.degToRad(15)), S15 = Math.sin(THREE.MathUtils.degToRad(15)), C15 = Math.cos(THREE.MathUtils.degToRad(15));

const WATER_V = /* glsl */ `
uniform float uTime, uAmp, uBreath; varying vec3 vW; varying float vDepth;
void main() {
  vec3 p = position;
  vec4 w0 = modelMatrix * vec4(p, 1.0);
  float a = uAmp * smoothstep(8.0, 30.0, length(w0.xz)) * (1.0 + 0.8 * uBreath);
  float h = sin(p.x * 0.085 + uTime * 0.9) * cos(p.z * 0.07 - uTime * 0.65) + 0.45 * sin((p.x - p.z) * 0.16 + uTime * 1.4);
  vec4 w = modelMatrix * vec4(p.x, p.y + a * h * 0.6, p.z, 1.0);
  vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const WATER_F = /* glsl */ `
uniform vec3 uKey, uA0, uA1, uA2, uB0, uB1, uB2, uH0, uH1, uRingCol; uniform float uHot, uR0, uR1; ${FOG_U}
varying vec3 vW; varying float vDepth;
float band(float r, float R) { return R < 0.0 ? 0.0 : step(abs(r - R), 0.35 + 0.015 * R) * (1.0 - smoothstep(40.0, 110.0, R)); }
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  if (n.y < 0.0) n = -n;
  vec3 k = normalize(uKey);
  float e = dot(n, k) - k.y;
  vec3 c;
  if (gl_FrontFacing) c = e < -0.035 ? uA0 : (e < 0.035 ? uA1 : uA2);
  else c = mix(e < -0.01 ? uB0 : (e < 0.07 ? uB1 : uB2), e < 0.0 ? uH0 : uH1, uHot);
  float r = length(vW.xz);
  c = mix(c, uRingCol, clamp(band(r, uR0) + band(r, uR1), 0.0, 1.0));
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export const S11 = {
  id: 'S11', t0: 83.75, t1: T_OUT, world: 'cold', pre: 0.5, post: 0.6,
  key: [-0.45, 0.55, -0.7], fog: { color: PAL.black, near: 20, far: 260 }, sky: { moonR: 0.045, moonDir: [-0.42, 0.22, -0.88], stars: 0.55 },
  build(kit) {
    const s = {};
    const R = kit.rnd(1111);
    s.prof = kit.travel([[83.3, 22, 0.01], [83.75, 3, 0.8], [T_TEN, 0, 0.6]]);
    s.D0 = s.prof.d(84.2);
    s.dive = kit.travel([[T_FLOORS, 4, 0.5], [90.2, 0, 0.41]]);
    s.zSlope = -(s.prof.d(T_FLOORS) - s.D0);
    s.root = new THREE.Group(); kit.group.add(s.root);
    // --- the sea (faceted plane, own shader: swell, sonar rings, seen from below)
    const wg = new THREE.PlaneGeometry(360, 360, 72, 72).rotateX(-Math.PI / 2);
    const P = wg.getAttribute('position');
    for (let i = 0; i < P.count; i++) { P.setX(i, P.getX(i) + (R() - 0.5) * 2.6); P.setZ(i, P.getZ(i) + (R() - 0.5) * 2.6); P.setY(i, (R() - 0.5) * 0.5); }
    const C = (h) => new THREE.Color(h);
    s.wu = {
      ...fogUniforms(kit), uAmp: { value: 2 }, uBreath: { value: 0 }, uHot: { value: 0 }, uR0: { value: -1 }, uR1: { value: -1 },
      uA0: { value: C(PAL.petrolDeep) }, uA1: { value: C(PAL.petrol) }, uA2: { value: C(PAL.teal) },
      uB0: { value: C(PAL.petrol) }, uB1: { value: C(PAL.teal) }, uB2: { value: C(PAL.cyan) }, uH0: { value: C(PAL.carmine) }, uH1: { value: C(PAL.crimson) }, uRingCol: { value: C(PAL.cyan) },
    };
    s.water = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: s.wu, vertexShader: WATER_V, fragmentShader: WATER_F, side: THREE.DoubleSide }));
    s.water.frustumCulled = false; s.water.position.z = -120;
    s.root.add(s.water);
    s.wz = -120;
    // --- buoys: two rows of 30 along the cable route, white lights
    const bgeo = merge([{ g: new THREE.CylinderGeometry(0.35, 0.6, 1.2, 7).translate(0, 0.3, 0) }, { g: box(0.08, 1.1, 0.08, 0, 1.4, 0) }, { g: new THREE.ConeGeometry(0.22, 0.4, 4).translate(0, 2.05, 0) }]);
    s.buoys = inst(bgeo, kit.toon({ ramp: 'black', rim: PAL.cyan }), 60, 's11-buoys');
    s.blights = inst(new THREE.IcosahedronGeometry(0.17, 0), kit.flat({ color: PAL.white, fog: 0.35 }), 60, 's11-blights');
    instColors(s.blights, 0x000000);
    s.root.add(s.buoys, s.blights);
    s.bz = (k) => -6 - 10 * k;
    // the tall marker buoy with its board
    s.mz = -(s.prof.d(T_FEEL) - s.D0) - 9;
    s.marker = new THREE.Group(); s.root.add(s.marker);
    const mk = new THREE.Mesh(merge([{ g: new THREE.CylinderGeometry(0.5, 0.8, 1.4, 8).translate(0, 0.4, 0), c: 0.05 }, { g: box(0.16, 5, 0.16, 0, 3.4, 0), c: 0.05 }, { g: box(6.6, 2.7, 0.14, 0, 5.8, 0), c: 0.05 }, { g: box(6.9, 0.12, 0.18, 0, 7.2, 0), c: 1 }, { g: box(6.9, 0.12, 0.18, 0, 4.4, 0), c: 1 }]), kit.toon({ ramp: 'gold', rim: PAL.cyan, vertexColors: true }));
    s.marker.add(mk);
    s.tFeel = kit.text('FEEL THE\nCITY BREATHE', { cap: 0.9, color: 'gold', near: T_FEEL, say: 'feel the city breathe', out: 89.7, parent: s.marker });
    s.tFeel.mesh.position.set(0, 5.8, 0.1);
    fitText(s.tFeel, 6.2);
    // --- harbour skyline (black cranes + 300 breathing windows) and the lighthouse
    const cr = [];
    for (let i = 0; i < 18; i++) {
      const x = -230 + i * 27 + (R() - 0.5) * 10, h = 26 + R() * 30, L = 14 + R() * 18, z = -250 - R() * 20;
      cr.push({ g: box(1.8, h, 1.8, x, SEA + h / 2, z) }, { g: box(L, 1.3, 1.3, x + L * 0.35, SEA + h, z) }, { g: box(L * 0.3, 2.4, 1.5, x - L * 0.25, SEA + h - 1, z) }, { g: box(3, 2.2, 2.2, x, SEA + h - 3, z) });
      cr.push({ g: box(18 + R() * 20, 4 + R() * 9, 6, x + 10, SEA + 3, z + 6) });
    }
    const sky = new THREE.Mesh(merge(cr), kit.flat({ color: PAL.black, fog: 0 }));
    s.root.add(sky);
    s.win = inst(new THREE.PlaneGeometry(0.9, 0.55), kit.flat({ color: PAL.cream, fog: 0.25 }), 300, 's11-windows');
    for (let i = 0; i < 300; i++) setI(s.win, i, -235 + R() * 470, SEA + 1 + Math.pow(R(), 1.6) * 32, -247 - R() * 10);
    s.root.add(s.win);
    s.lh = new THREE.Group(); s.lh.position.set(300, SEA, -120); s.root.add(s.lh);
    s.lh.add(new THREE.Mesh(merge([{ g: new THREE.CylinderGeometry(2.4, 4.2, 34, 8).translate(0, 17, 0) }, { g: new THREE.CylinderGeometry(3.4, 3.4, 0.8, 8).translate(0, 34.4, 0) }]), kit.flat({ color: PAL.black, fog: 0 })));
    const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), kit.flat({ color: PAL.cream, fog: 0 })); lamp.position.y = 36; s.lh.add(lamp);
    s.beamYaw = new THREE.Group(); s.beamYaw.position.y = 36; s.lh.add(s.beamYaw);
    const bm = new THREE.BufferGeometry(); bm.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 440, 0, -26, 440, 0, 26], 3));
    s.beam = new THREE.Mesh(bm, kit.flat({ color: PAL.cream, opacity: 0.16, additive: true, side: THREE.DoubleSide, fog: 0 }));
    s.beam.rotation.z = -Math.atan2(20, 300); s.beamYaw.add(s.beam);
    // --- the gold cable (the rig wire is hidden): flat run, 15 deg slope, seabed segments that light up
    s.cmat = kit.flat({ color: PAL.gold });
    const runL = 140 - s.zSlope;
    const run = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, runL), s.cmat); run.position.set(0, 3.4, s.zSlope + runL / 2);
    const slopeL = (3.4 - BED) / S15;
    const slope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, slopeL), s.cmat);
    slope.position.set(0, 3.4 - (3.4 - BED) / 2, s.zSlope - slopeL * C15 / 2); slope.rotation.x = -THREE.MathUtils.degToRad(15);
    s.root.add(run, slope);
    s.bedZ = s.zSlope - slopeL * C15;
    s.seg = inst(new THREE.BoxGeometry(0.09, 0.09, 6.6), kit.flat({ color: PAL.white, fog: 0.8 }), 40, 's11-bedcable');
    instColors(s.seg, PAL.brassDark);
    for (let i = 0; i < 40; i++) setI(s.seg, i, 0, BED + 0.05, s.bedZ - 3.3 - i * 7);
    s.root.add(s.seg);
    // --- under water: seabed, rock shards (cyan rims), light shafts
    s.deep = new THREE.Group(); s.root.add(s.deep);
    const eyeZ = -(s.prof.d(91) - s.D0) - s.dive.d(91) * C15;
    s.eyeZ = eyeZ;
    const bed = new THREE.Mesh(new THREE.CircleGeometry(120, 24).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    bed.position.set(0, BED - 0.4, eyeZ); s.deep.add(bed);
    s.rocks = inst(facet(new THREE.ConeGeometry(1, 1, 4)), kit.toon({ ramp: 'steel', rim: PAL.cyan, rimTh: 0.5 }), 170, 's11-rocks');
    for (let i = 0; i < 170; i++) {
      const a = R() * Math.PI * 2, r = 5 + Math.pow(R(), 0.8) * 60;
      const x = Math.sin(a) * r, z = eyeZ - Math.cos(a) * r;
      if (Math.abs(x) < 2.5) continue;
      const near = r < 10, h = near ? 1 + R() * 2.2 : 2.5 + R() * 9, w = 0.8 + R() * 2.4;
      setI(s.rocks, i, x, BED - 0.3 + h / 2, z, (R() - 0.5) * 0.5, R() * 6, (R() - 0.5) * 0.6, w, h, w * (0.6 + R() * 0.6));
    }
    s.deep.add(s.rocks);
    s.shafts = inst(new THREE.PlaneGeometry(2.4, 30).translate(0, -15, 0), kit.flat({ color: PAL.cyan, opacity: 0.07, additive: true, side: THREE.DoubleSide }), 16, 's11-shafts');
    s.shaftP = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + R() * 0.3, r = 6 + R() * 22; return [Math.sin(a) * r, eyeZ - Math.cos(a) * r, R() * 6]; });
    s.deep.add(s.shafts);
    // 1500 bubbles around the eye at the hold (frozen 91.04-93.46, then they rush up)
    const eyeLocal = [0, 1.6 - s.dive.d(91) * S15, eyeZ];
    s.bub = kit.particles({
      n: 1500, shape: 'disc', size: 0.12, seed: 77,
      init: (i, r) => {
        const a = r() * Math.PI * 2, rr = 1.3 + Math.pow(r(), 0.7) * 20;
        return { p: [Math.sin(a) * rr, eyeLocal[1] - 7 + r() * 11, eyeLocal[2] - Math.cos(a) * rr], v: [0, 0.35 + r() * 0.7, 0], g: [0, 0.9, 0], t0: 89.3 + r() * 1.2, life: 14, s: 0.05 + r() * r() * 0.22, c: r() < 0.7 ? PAL.cream : PAL.cyan, freeze: [T_HOLD, T_WE] };
      },
    });
    s.deep.add(s.bub);
    // --- depth rings (in player space, they rush up the slope past the cradle) with numerals
    s.rings = inst(new THREE.TorusGeometry(6, 0.07, 4, 40), kit.flat({ color: PAL.cyan, fog: 0.6 }), 10, 's11-rings');
    kit.group.add(s.rings);
    s.nums = [];
    for (let k = 0; k < 10; k++) s.nums.push(kit.text('-' + (k + 1), { cap: 1.0, color: 'cream' }));
    // --- the diver (the Engineer): black silhouette, cyan rim and round cyan goggles, finger raised
    s.diver = new THREE.Group(); kit.group.add(s.diver);
    const dg = merge([
      { g: ball(0.15, 7, 5, 0, 1.62, 0) }, { g: box(0.36, 0.22, 0.3, 0, 1.66, -0.06) }, { g: box(0.42, 0.66, 0.26, 0, 1.18, 0) }, { g: box(0.24, 0.52, 0.2, 0, 1.22, -0.22) },
      { g: box(0.14, 0.62, 0.15, -0.11, 0.56, 0) }, { g: box(0.14, 0.62, 0.15, 0.11, 0.56, 0) }, { g: box(0.2, 0.04, 0.5, -0.11, 0.2, 0.14) }, { g: box(0.2, 0.04, 0.5, 0.11, 0.2, 0.14) },
      { g: box(0.11, 0.55, 0.12, -0.3, 1.12, 0.02, 0, 0, 0.18) }, { g: box(0.11, 0.5, 0.12, 0.28, 1.72, 0.02, 0, 0, -0.12) }, { g: box(0.035, 0.16, 0.035, 0.31, 2.03, 0.02) },
    ]);
    s.diver.add(new THREE.Mesh(dg, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.5, vertexColors: true })));
    const gog = new THREE.Mesh(merge([{ g: disc(0.07, 10, -0.075, 1.65, 0.16) }, { g: disc(0.07, 10, 0.075, 1.65, 0.16) }]), kit.flat({ color: PAL.cyan, vertexColors: true, bright: 1.3 }));
    s.diver.add(gog);
    s.diver.scale.setScalar(1.25);
    // --- shatter shards (player space)
    s.shards = kit.shards({
      n: 110, t0: T_OUT, life: 1.7, gravity: -5, seed: 95, colors: [PAL.cyan, PAL.teal, PAL.petrol],
      init: (i, r) => { const a = r() * Math.PI * 2, rr = 2.6 + Math.pow(r(), 0.7) * 22, sp = 7 + r() * 9; return { p: [Math.sin(a) * rr, 2.3 + (r() - 0.5) * 0.6, -Math.cos(a) * rr], v: [Math.sin(a) * sp, 2 + r() * 5, -Math.cos(a) * sp], s: [1.6 + r() * 3.6, 1.2 + r() * 3], spin: (r() - 0.5) * 7 }; },
    });
    kit.group.add(s.shards);
    // --- type
    s.noPulses = [];
    s.tTick1 = kit.text('TICK,', { cap: 1.05, color: 'cream', near: T_TICK, say: 'tick', out: 88.75 });
    s.tTick2 = kit.text('TICK,', { cap: 1.05, color: 'cream', near: T_TICK2, say: 'tick', out: 88.75 });
    s.root.add(s.tTick1.mesh, s.tTick2.mesh);
    s.tTick1.mesh.position.set(-3.6, 1.9, s.bz(1)); s.tTick2.mesh.position.set(3.6, 1.9, s.bz(2));
    s.tTen = kit.text('TEN FLOORS\nUNDER', { cap: 1.15, color: 'gold', near: T_TEN, say: 'ten floors under', out: 90.95, at: { d: 6, az: -13, y: 3.0 } });
    s.tBel = kit.text('WHAT YOU BELIEVE', { cap: 0.92, color: 'cream', near: 89.84, out: 90.95, at: { d: 6.5, az: 17, y: 0.45 } });
    s.tHold = kit.text('HOLD YOUR BREATH', { cap: 1.15, color: 'cream', near: T_HOLD, say: 'hold your breath', out: 93.05, at: { d: 6, az: 0, y: 2.5 } });
    s.tHere = kit.text('HERE WE', { cap: 1.0, color: 'gold', near: T_HERE, say: 'here we', out: 95.05, at: { d: 6.2, az: 0, y: 3.35 } });
    s.tGo = kit.text('GO', { cap: 3.0, color: 'gold', near: T_GO, say: 'go', pop: true, dur: 0.18, out: 95.12, at: { d: 7, az: 0, y: 1.3 } });
    return s;
  },
  update(t, s, kit) {
    const live = t >= 83.36 && t < T_OUT;
    s.root.visible = live;
    s.shards.visible = t >= T_OUT;
    // world motion: flat travel, then the dive along the slope, then "go" sinks the world
    const d = s.prof.d(t) - s.D0, D = s.dive.d(t);
    const go = 6.8 * easeIn((t - T_GO) / 1.14);
    s.root.position.set(0, D * S15 - go, d + D * C15);
    let wl = SEA + 13 * easeInOut((t - T_TEN) / 1.75);
    wl -= go;
    const under = wl > 1.1;
    s.water.position.y = wl - s.root.position.y;
    s.water.visible = !(wl > 1.1 && wl < 2.1);
    s.wu.uAmp.value = under ? 0.6 : 2;
    const br = t > T_FEEL && t < 89.8 ? 0.5 - 0.5 * Math.cos((t - T_FEEL) / 1.25 * Math.PI * 2) : 0;
    s.wu.uBreath.value = br;
    s.wu.uR0.value = t >= T_TICK ? (t - T_TICK) * 20 : -1;
    s.wu.uR1.value = t >= T_TICK2 ? (t - T_TICK2) * 20 : -1;
    s.wu.uHot.value = sm(T_GO, T_GO + 0.6, t);
    // buoys ride the swell (same formula as the shader, amplitude only far away)
    const wy = wl - s.root.position.y;
    for (let k = 0; k < 30; k++) for (let sd = 0; sd < 2; sd++) {
      const i = k * 2 + sd, x = sd ? 3.6 : -3.6, z = s.bz(k);
      const wz = z + s.root.position.z, a = 2 * sm(8, 30, Math.hypot(x, wz)) * (1 + 0.8 * br) * 0.6;
      const lx = x, lz = z - s.wz;
      const h = a * (Math.sin(lx * 0.085 + t * 0.9) * Math.cos(lz * 0.07 - t * 0.65) + 0.45 * Math.sin((lx - lz) * 0.16 + t * 1.4));
      setI(s.buoys, i, x, wy + h, z, 0.08 * Math.sin(t * 1.3 + k), 0, 0.08 * Math.cos(t * 1.1 + k));
      setI(s.blights, i, x, wy + h + 2.35, z);
      const on = t >= T_TICK + k * 0.035;
      setC(s.blights, i, on ? PAL.white : 0x050505, on ? 1 + 0.8 * env(t, T_TICK + k * 0.035, 6) : 1);
    }
    s.buoys.instanceMatrix.needsUpdate = true; s.blights.instanceMatrix.needsUpdate = true; s.blights.instanceColor.needsUpdate = true;
    s.marker.position.set(1.4, wy - 0.2 + 0.12 * Math.sin(t * 1.7), s.mz);
    s.marker.rotation.set(0.05 * Math.sin(t * 1.3), 0, 0.07 * Math.sin(t * 1.05 + 0.6));
    // tick texts face the player as their buoys pass
    for (const T of [s.tTick1, s.tTick2]) { const p = T.mesh.position; T.mesh.rotation.y = -Math.atan2(p.x, -(p.z + s.root.position.z)); T.mesh.position.y = wy + 5.8 + 0.1 * Math.sin(t * 1.3); }
    // harbour breathes, lighthouse beam sweeps (passes over the player at 86.03)
    s.win.material.uniforms.uBright.value = 0.55 + 0.9 * br;
    const lz = -120 + (s.prof.d(86.03) - s.D0);
    const a0 = Math.atan2(0 - lz, -300);
    s.beamYaw.rotation.y = -(a0 + ((t - 86.03) / 8) * Math.PI * 2);
    s.beam.visible = t > 84.06 && !under;
    // cable lights from far to near on "here"
    for (let i = 0; i < 40; i++) setC(s.seg, i, t >= T_HERE + (39 - i) * 0.012 ? PAL.gold : PAL.brassDark, t >= T_HERE ? 1 + 0.6 * env(t, T_HERE + (39 - i) * 0.012, 4) : 1);
    s.seg.instanceColor.needsUpdate = true;
    // deep: rocks pulse on the downbeat, shafts sway
    s.deep.visible = under;
    s.rocks.material.uniforms.uRim.value.set(PAL.cyan).lerp(TMP.c.set(PAL.white), 0.8 * env(t, 92.89, 5));
    for (let i = 0; i < 16; i++) { const p = s.shaftP[i]; setI(s.shafts, i, p[0], wy, p[1], 0, -Math.atan2(p[0], p[1] - s.eyeZ) + 0.2 * Math.sin(t * 0.7 + p[2]), 0.12 * Math.sin(t * 0.9 + p[2])); }
    s.shafts.instanceMatrix.needsUpdate = true;
    // depth rings rush past along the slope, one every 0.125 s
    for (let k = 0; k < 10; k++) {
      const tk = 89.25 + 0.125 * k, sd = (tk - t) * 12;
      const vis = live && t > T_TEN && sd > -6 && sd < 50;
      const cx = 0, cy = 1.6 - sd * S15, cz = -sd * C15;
      setI(s.rings, k, cx, cy, cz, -THREE.MathUtils.degToRad(15), 0, 0, vis ? 1 : 0);
      const T = s.nums[k];
      T.mesh.visible = vis;
      T.mesh.position.set(k % 2 ? 3.4 : -3.4, cy + 0.6, cz);
    }
    s.rings.instanceMatrix.needsUpdate = true;
    // the diver glides in on "breath" and stays at 4 m; she sinks away with the world on "go"
    const dk = easeOut((t - T_BREATH) / 0.9);
    s.diver.visible = live && under && t > T_BREATH - 0.1;
    s.diver.position.set(-16 + 13.7 * dk, -0.4 - go + 0.08 * Math.sin(t * 1.6), -3.1 - 2 * (1 - dk));
    s.diver.rotation.set(0, 0.62 + 0.9 * (1 - dk), 0);
    // texts that live above water hide below and vice versa
    if (under) { s.tTick1.mesh.visible = false; s.tTick2.mesh.visible = false; }
    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wire.on = 0; rs.wire.pulses = s.noPulses;
      rs.wheelSpin = (s.prof.d(t) + D) / 0.075;
      if (under) {
        kit.U.uFogCol.value.set(PAL.petrolDeep).lerp(TMP.c.set(PAL.velvet), s.wu.uHot.value); kit.U.uFogNear.value = 4; kit.U.uFogFar.value = 50 + 40 * s.wu.uHot.value;
        kit.setSky({ zen: PAL.petrolDeep, hor2: PAL.petrolDeep, hor: PAL.petrolDeep, nadir: PAL.black, stars: 0, moonR: 0 });
      }
    }
  },
  events() {
    return [
      { t: T_TICK, sfx: 'ping', gain: 0.55 },
      { t: T_TICK2, sfx: 'ping', gain: 0.45 },
      { t: T_TEN, sfx: 'whoosh', gain: 0.5 },
      { t: T_HERE, sfx: 'switch', gain: 0.4 },
      { t: T_GO, sfx: 'whoosh', gain: 0.6 },
      { t: T_OUT, sfx: 'crack', gain: 0.8, haptic: [0.6, 80] },
    ];
  },
};
