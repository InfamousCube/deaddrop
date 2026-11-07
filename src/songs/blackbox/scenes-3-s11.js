// S11 The sea cable (83.75-95.18, cold). Clean rework 07.11.
// SHOT CARD
//   beat A 83.75-88.86  hero: the harbour city, 7 big black blocks on the horizon over a calm faceted
//                       night sea; on "breathe" the skyline swells once and the horizon glow brightens.
//                       supports: the moon (sky), one chunky cyan sonar ring on each "tick".
//                       palette: black + petrol, accent cyan. Motion: slow glide 3 m/s.
//   beat B 88.86-91.04  hard cut under water on "Ten" (cyan flash). hero: the gold cable diving from
//                       the surface on the left down to the seabed and away. supports: the surface
//                       ceiling (seen from below), 6 big black rock spires at the sides.
//                       palette: black + petrol (fog field), accent gold.
//   beat C 91.04-93.14  hero: the diver (the Engineer), big black silhouette with cyan goggles, glides in
//                       on "breath" at the right; 12 big bubbles freeze on "Hold".
//   beat D 93.14-95.18  the cable lights gold far to near on "here"; we rise 1.1 m toward the surface,
//                       hard cut to the Big Top at 95.18.
//   lyric: one block at a time, straight ahead in the black sky (A) or the petrol water (B-D).
//   removed: 60 buoys + lights, marker board, 18 cranes + 300 windows, lighthouse beam, thin cable,
//            170 rocks, 16 light shafts, 1500 bubbles, 10 depth rings + numerals, 110 shatter shards,
//            22 m/s portal entry and the 4 m/s dive.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, box, disc, ball, fitText, sm, easeOut, env, FOG_U, FOG_APPLY, fogUniforms, TMP } from './scenes-3-util.js';

const T_TICK = 85.42, T_TICK2 = 87.02, T_FEEL = 87.28, T_TEN = 88.86, T_HOLD = 91.04, T_BREATH = 91.76, T_HERE = 93.14, T_RISE = 93.14, T_GO = 94.04, T_OUT = 95.18;
const SEA = -4, BED = -12, SURF = 4.2;
const DIVER = new THREE.Vector3(2.7, -0.9, -5.4), CABX = -7;

const WATER_V = /* glsl */ `
uniform float uTime, uAmp; varying vec3 vW; varying float vDepth;
void main() {
  vec4 w0 = modelMatrix * vec4(position, 1.0);
  float a = uAmp * smoothstep(8.0, 30.0, length(w0.xz));
  float h = sin(position.x * 0.06 + uTime * 0.7) * cos(position.z * 0.05 - uTime * 0.5);
  vec4 w = modelMatrix * vec4(position.x, position.y + a * h, position.z, 1.0);
  vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const WATER_F = /* glsl */ `
uniform vec3 uKey, uA0, uA1, uA2, uB0, uB1, uB2, uRingCol; uniform vec2 uC; uniform float uR0, uR1; ${FOG_U}
varying vec3 vW; varying float vDepth;
float band(float r, float R) { return R < 0.0 ? 0.0 : step(abs(r - R), 0.9) * (1.0 - smoothstep(18.0, 42.0, R)); }
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  if (n.y < 0.0) n = -n;
  vec3 k = normalize(uKey);
  float e = dot(n, k) - k.y;
  vec3 c = gl_FrontFacing ? (e < -0.04 ? uA0 : (e < 0.04 ? uA1 : uA2)) : (e < -0.02 ? uB0 : (e < 0.06 ? uB1 : uB2));
  float r = length(vW.xz - uC);
  c = mix(c, uRingCol, clamp(band(r, uR0) + band(r, uR1), 0.0, 1.0));
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// the Engineer as a diver: bob, mask, tank, one arm raised; feet at y 0, facing +z
function diverGeo() {
  return merge([
    { g: ball(0.16, 7, 5, 0, 1.62, 0) }, { g: box(0.38, 0.24, 0.32, 0, 1.66, -0.05) }, { g: box(0.44, 0.68, 0.28, 0, 1.17, 0) }, { g: box(0.26, 0.56, 0.22, 0, 1.2, -0.24) },
    { g: box(0.16, 0.66, 0.17, -0.11, 0.52, 0) }, { g: box(0.16, 0.66, 0.17, 0.11, 0.52, 0) }, { g: box(0.22, 0.05, 0.55, -0.11, 0.17, 0.16) }, { g: box(0.22, 0.05, 0.55, 0.11, 0.17, 0.16) },
    { g: box(0.12, 0.58, 0.13, -0.31, 1.1, 0.02, 0, 0, 0.18) }, { g: box(0.12, 0.6, 0.13, 0.27, 1.76, 0.02, 0, 0, -0.1) },
  ]);
}

export const S11 = {
  id: 'S11', t0: 83.75, t1: T_OUT, world: 'cold', pre: 0, post: 0,
  key: [-0.45, 0.55, -0.7], fog: { color: PAL.black, near: 30, far: 240 },
  sky: { stars: 0, moonR: 0.06, moonDir: [-0.58, 0.3, -0.76] },
  flashes: [{ t: T_TEN, color: PAL.cyan, dur: 0.03 }],
  build(kit) {
    const s = {};
    s.glide = kit.travel([[83.75, 3, 1.0]]);
    s.drift = kit.travel([[T_TEN, 1, 1.0], [T_HOLD, 0, 1.0], [T_GO, 1.5, 1.0]]);
    // --- above: the sea and the city
    s.above = new THREE.Group(); kit.group.add(s.above);
    const C = (h) => new THREE.Color(h);
    s.wu = {
      ...fogUniforms(kit), uAmp: { value: 1.4 }, uR0: { value: -1 }, uR1: { value: -1 }, uC: { value: new THREE.Vector2(0, -30) },
      uA0: { value: C(PAL.petrolDeep) }, uA1: { value: C(PAL.petrol) }, uA2: { value: C(PAL.teal) },
      uB0: { value: C(PAL.petrol) }, uB1: { value: C(PAL.teal) }, uB2: { value: C(PAL.cyan) }, uRingCol: { value: C(PAL.cyan) },
    };
    const R = kit.rnd(1111);
    const wg = new THREE.PlaneGeometry(300, 300, 40, 40).rotateX(-Math.PI / 2);
    const P = wg.getAttribute('position');
    for (let i = 0; i < P.count; i++) { P.setX(i, P.getX(i) + (R() - 0.5) * 3.5); P.setZ(i, P.getZ(i) + (R() - 0.5) * 3.5); P.setY(i, (R() - 0.5) * 0.6); }
    const wmat = new THREE.ShaderMaterial({ uniforms: s.wu, vertexShader: WATER_V, fragmentShader: WATER_F, side: THREE.DoubleSide });
    s.sea = new THREE.Mesh(wg, wmat); s.sea.frustumCulled = false; s.sea.position.set(0, SEA, -110);
    s.above.add(s.sea);
    // 7 big blocks, a couple of stepped tops: one merged black silhouette
    const cityP = [];
    [[-58, 30, 12], [-30, 22, 17], [-8, 16, 9], [14, 20, 14], [38, 26, 17], [64, 30, 11], [-82, 24, 8]].forEach(([x, w, h], i) => {
      cityP.push({ g: box(w, h, 12, x, h / 2, -i * 2.5) });
      if (i % 2 === 0) cityP.push({ g: box(w * 0.45, h * 0.35, 8, x + w * 0.15, h + h * 0.175, -i * 3) });
    });
    s.city = new THREE.Mesh(merge(cityP), kit.flat({ color: PAL.black, fog: 0 }));
    s.city.position.set(0, SEA, -58);
    s.above.add(s.city);
    // --- below: the surface ceiling, seabed, rock spires, the cable, the diver, the bubbles
    s.below = new THREE.Group(); kit.group.add(s.below);
    s.ceil = new THREE.Mesh(wg, wmat); s.ceil.frustumCulled = false; s.ceil.position.set(0, SURF, -90);
    const bed = new THREE.Mesh(new THREE.CircleGeometry(160, 24).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black }));
    bed.position.set(0, BED, -60);
    s.below.add(s.ceil, bed);
    const sp = [[-9, -13, 13, 3.2], [-16, -27, 15, 4.5], [-8, -38, 10, 3], [10, -15, 14, 3.4], [17, -30, 15, 4.8], [7, -44, 11, 3.2]];
    s.rocks = inst(new THREE.ConeGeometry(1, 1, 4).toNonIndexed(), kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.5 }), sp.length, 's11-spires');
    s.rocks.geometry.computeVertexNormals();
    sp.forEach(([x, z, h, w], i) => setI(s.rocks, i, x, BED + h / 2, z, 0, i * 0.7, 0, w, h, w * 0.8));
    s.below.add(s.rocks);
    // the cable: 8 diving segments + 8 seabed segments, chunky (0.38 m)
    s.cab = inst(new THREE.BoxGeometry(0.38, 0.38, 1), kit.flat({ color: PAL.white }), 16, 's11-cable');
    instColors(s.cab, PAL.brass);
    const A = new THREE.Vector3(CABX, SURF + 0.5, -7), B = new THREE.Vector3(CABX, BED + 0.2, -30);
    const dl = A.distanceTo(B), pitch = Math.atan2(A.y - B.y, A.z - B.z);
    s.cabK = [];
    for (let k = 0; k < 8; k++) { const p = TMP.v.copy(A).lerp(B, (k + 0.5) / 8); setI(s.cab, k, p.x, p.y, p.z, -pitch, 0, 0, 1, 1, dl / 8 + 0.05); s.cabK.push(k / 16); }
    for (let k = 0; k < 8; k++) { setI(s.cab, 8 + k, CABX, BED + 0.2, -30 - 7 - k * 14, 0, 0, 0, 1, 1, 14.05); s.cabK.push((8 + k) / 16); }
    s.below.add(s.cab);
    s.diver = new THREE.Group(); s.below.add(s.diver);
    s.diver.add(new THREE.Mesh(diverGeo(), kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.5 })));
    s.diver.add(new THREE.Mesh(merge([{ g: disc(0.085, 10, -0.08, 1.66, 0.17) }, { g: disc(0.085, 10, 0.08, 1.66, 0.17) }]), kit.flat({ color: PAL.cyan, vertexColors: true, bright: 1.3 })));
    s.diver.scale.setScalar(1.6);
    s.bub = kit.particles({
      n: 12, shape: 'disc', seed: 77,
      init: (i, r) => ({ p: [DIVER.x - 0.6 + r() * 1.8, DIVER.y + 2.6 + r() * 1.8, DIVER.z - 0.8 + r() * 1.6], v: [0, 0.45 + r() * 0.3, 0], t0: T_BREATH + 0.3 + r() * 0.3, life: 6, s: 0.32 + r() * 0.2, c: PAL.cream, freeze: [T_HOLD + 0.2, T_HERE] }),
    });
    s.below.add(s.bub);
    // --- type: one block per line
    // one short phrase at a time (max 2 lines of about 10 letters)
    const sky = { d: 8, az: 0, y: 4.3 }, sea = { d: 6.2, az: -3, y: 2.0 };
    s.texts = [
      kit.text('TICK, TICK,', { cap: 1.1, color: PAL.cyan, near: T_TICK, say: 'tick tick', outDur: 0.15, out: 87.12, at: sky }),
      kit.text('FEEL THE\nCITY BREATHE', { cap: 1.0, color: 'cream', near: T_FEEL, say: 'feel the city breathe', outDur: 0.15, out: 88.7, at: sky }),
      kit.text('TEN FLOORS UNDER\nWHAT YOU BELIEVE', { cap: 0.9, color: 'gold', colors: { 3: PAL.cream, 4: PAL.cream, 5: PAL.cream }, near: T_TEN, say: 'ten floors under what you believe', outDur: 0.15, out: 90.88, at: sea }),
      kit.text('HOLD YOUR\nBREATH', { cap: 1.05, color: 'cream', near: T_HOLD, say: 'hold your breath', outDur: 0.15, out: 92.95, at: { d: 7.5, az: -8, y: 2.3 } }),
      kit.text('HERE WE GO', { cap: 1.1, color: 'cream', colors: { 2: PAL.gold }, near: T_HERE, say: 'here we go', outDur: 0.15, out: 95.0, at: { d: 7.5, az: -4, y: 1.3 } }),
    ];
    for (const T of s.texts) fitText(T, 6);
    s.noPulses = [];
    s.hor = new THREE.Color(); s.horA = new THREE.Color(PAL.teal); s.horB = new THREE.Color(PAL.cyan);
    return s;
  },
  update(t, s, kit) {
    const under = t >= T_TEN;
    s.above.visible = !under;
    s.below.visible = under && t < T_OUT;
    // above: glide, sonar rings on the ticks, the city breathes once on "feel the city breathe"
    const d = s.glide.d(t) - s.glide.d(83.75);
    s.above.position.z = d;
    s.wu.uC.value.set(0, -32 + d);
    s.wu.uR0.value = !under && t >= T_TICK ? (t - T_TICK) * 16 : -1;
    s.wu.uR1.value = !under && t >= T_TICK2 ? (t - T_TICK2) * 16 : -1;
    const br = t > T_FEEL && t < 88.8 ? Math.sin(Math.PI * (t - T_FEEL) / 1.52) : 0;
    s.city.scale.y = 1 + 0.16 * br;
    s.wu.uAmp.value = under ? 0.5 : 1.4;
    // below: drift, the rise to the surface on "go" (surface comes down 2.6 m over 1.7 s)
    const dd = s.drift.d(t) - s.drift.d(T_TEN);
    s.below.position.z = dd;
    s.ceil.position.y = SURF - (SURF - 3.1) * sm(T_RISE, T_OUT, t); // rise 1.1 m, stays 1.5 m above the eyes
    // the cable lights far to near on "here"
    for (let k = 0; k < 16; k++) {
      const tk = T_HERE + (1 - s.cabK[k]) * 0.5;
      setC(s.cab, k, t >= tk ? PAL.goldHi : PAL.brass, t >= tk ? 1 + 0.5 * env(t, tk, 4) : 0.8);
    }
    s.cab.instanceColor.needsUpdate = true;
    // the diver glides in on "breath" and holds
    const dk = easeOut((t - T_BREATH) / 1.1);
    s.diver.visible = t >= T_BREATH;
    s.diver.position.set(DIVER.x + 6 * (1 - dk), DIVER.y + 0.08 * Math.sin(t * 1.4), DIVER.z - 2 * (1 - dk) - dd);
    s.diver.rotation.y = -0.5 - 0.6 * (1 - dk);
    s.bub.position.z = -dd;
    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wire.on = 0; rs.wire.pulses = s.noPulses;
      if (under) {
        kit.setFog(PAL.petrol, 4, 48);
        kit.setSky({ zen: PAL.petrol, hor2: PAL.petrol, hor: PAL.petrol, nadir: PAL.petrol, stars: 0, moonR: 0 });
      } else {
        s.hor.copy(s.horA).lerp(s.horB, 0.6 * br);
        kit.setSky({ hor: s.hor.getHex(), hor2: PAL.petrol, stars: 0 });
      }
    }
  },
  events() {
    return [
      { t: T_TICK, sfx: 'ping', gain: 0.55 },
      { t: T_TICK2, sfx: 'ping', gain: 0.45 },
      { t: T_TEN, sfx: 'whoosh', gain: 0.5 },
      { t: T_HERE, sfx: 'switch', gain: 0.4 },
      { t: T_GO, sfx: 'whoosh', gain: 0.5 },
    ];
  },
};
