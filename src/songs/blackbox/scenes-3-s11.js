// S11 Under the harbour (84.70-95.10, cold). Round 3 rebuild (storyboard v3).
// SHOT CARD
//   hero: the spy as a 60s frogman (twin tanks, hood and round mask, long fins) pulled by an underwater
//         scooter (torpedo body, ducted propeller), 8.5 m ahead, kicking slowly; she aims up on "here" and
//         shoots to the surface on "go".
//   around: two rows of old pier pilings (barnacle rings, X-braces) pass left and right at 5 m; a cargo
//           ship's hull with bilge keels, rudder and 4-blade propeller slides overhead (88.4-92.6); the black
//           car lies on the seabed below-left with its headlights on; the lit surface 4.4 m above.
//   palette: black depth, petrol water, cyan light, cream patches and mask glint.
//   motion: you glide 2.5 m/s, sink 1 m on "ten floors", everything holds on "breath...", rise 2 m/s at the end.
//   lyric: low left (az -15, d 7), one block at a time.
//   out: SURFACE SHATTER 94.40: the surface above breaks into petrol / cream triangles that fly up and away;
//        S11 keeps only those shards for 0.6 s over S12 (post 0.6).
import * as THREE from 'three';
import { PAL } from './style.js';
import {
  D2R, sm, lin, lerp, env, clamp01, easeOut, easeInOut, setI, inst, merge, lathe, shapeOf, extrude, rrect, circ, tube, bbox, box, beam,
  NEUTRAL, FOG_U, FOG_APPLY, fogUniforms, WORLD_V, TMP,
} from './scenes-3-util.js';

const SEA = -5, SURF = 6;                      // seabed and surface (world y, before the vertical offsets)
const ROW = { x: 5, step: 6, n: 12 };          // pilings
const HOLD = [91.76, 93.0];                    // "breath...": everything holds
const SHATTER = 94.4;
const ft = (t) => t - clamp01((t - HOLD[0]) / (HOLD[1] - HOLD[0])) * (HOLD[1] - HOLD[0]) * (t > HOLD[0] ? 1 : 0) - (t > HOLD[1] ? 0 : 0);
const frozen = (t) => (t < HOLD[0] ? t : t < HOLD[1] ? HOLD[0] : t - (HOLD[1] - HOLD[0]));

const SURF_F = /* glsl */ `
uniform vec3 uA, uB, uC; uniform float uSwell, uTime, uFogAmt; ${FOG_U}
varying vec3 vW; varying float vDepth;
void main() {
  vec2 p = vW.xz * 0.085;
  float n = sin(p.x * 1.7 + uTime * 0.45) * sin(p.y * 1.25 - uTime * 0.35) + 0.55 * sin((p.x - p.y) * 2.2 + uTime * 0.6);
  float patchA = step(0.62 - 0.3 * uSwell, n);
  float patchB = step(1.05 - 0.25 * uSwell, n);
  vec3 c = mix(uA, uB, patchA);
  c = mix(c, uC, patchB);
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// a 60s four-door sedan, length 5.2 m, front at +x (merged, vertex colours)
function carGeo() {
  const arch = (cx, from, to) => { const o = []; for (let i = 0; i <= 8; i++) { const a = Math.PI - (Math.PI * i) / 8; o.push([cx + 0.47 * Math.cos(a), 0.38 + 0.47 * Math.sin(a)]); } return o; };
  const side = [[-2.55, 0.32]].concat(arch(-1.55), [[1.1, 0.32]], arch(1.55), [[2.55, 0.32], [2.64, 0.45], [2.64, 0.7], [2.5, 0.82], [1.0, 0.9], [0.85, 0.93], [0.25, 1.38], [-0.75, 1.4], [-1.35, 0.95], [-2.4, 0.88], [-2.62, 0.75], [-2.64, 0.45]]);
  const parts = [{ g: extrude(shapeOf(side), 1.66, 0.1, { curve: 2 }), c: 0x101418 }];
  const win = [[[0.78, 0.98], [0.3, 1.32], [-0.28, 1.33], [-0.28, 0.98]], [[-0.4, 0.98], [-0.4, 1.33], [-0.72, 1.33], [-1.2, 0.98]]];
  for (const w of win) for (const sz of [1, -1]) {
    const g = new THREE.ShapeGeometry(shapeOf(sz > 0 ? w : w.map(([x, y]) => [-x, y])));
    if (sz < 0) g.rotateY(Math.PI);
    parts.push({ g: g.translate(0, 0, sz * 0.94), c: 0x2a6f80 });
  }
  for (const wx of [-1.55, 1.55]) for (const wz of [-0.84, 0.84]) {
    parts.push({ g: new THREE.CylinderGeometry(0.37, 0.37, 0.26, 14).rotateX(Math.PI / 2).translate(wx, 0.38, wz), c: 0x050505 });
    parts.push({ g: new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10).rotateX(Math.PI / 2).translate(wx, 0.38, wz), c: 0xa8c8d0 });
  }
  parts.push({ g: bbox(0.16, 0.16, 1.9, 0.05, 2.68, 0.45, 0), c: 0xb8d4dc }, { g: bbox(0.16, 0.16, 1.9, 0.05, -2.68, 0.45, 0), c: 0xb8d4dc });
  parts.push({ g: bbox(0.06, 0.18, 1.0, 0.02, 2.66, 0.62, 0), c: 0x1c2a30 }); // grille
  parts.push({ g: bbox(0.5, 0.05, 1.7, 0.02, 0.7, 0.86, 0), c: 0x0b1215 });   // hood crease
  return merge(parts);
}

// the frogman (local: +y = her back, -z = where she swims), ~2 m incl. fins, without legs and propeller
function diverBody() {
  const P = [];
  const alongZ = (g) => g.rotateX(-Math.PI / 2); // lathe axis y -> -z
  P.push({ g: alongZ(lathe([[0, 0], [0.15, 0.04], [0.2, 0.18], [0.22, 0.42], [0.2, 0.6], [0.12, 0.7], [0, 0.72]], 12)).scale(1.15, 0.8, 1), c: 0x0b0f12 }); // torso
  P.push({ g: new THREE.IcosahedronGeometry(0.135, 1).scale(1, 0.95, 1.1).translate(0, 0.03, -0.86), c: 0x0b0f12 });                                          // hooded head
  P.push({ g: new THREE.CircleGeometry(0.095, 16).rotateX(Math.PI * 0.82).translate(0, -0.05, -0.97), c: 0xf2e6cc });                                          // round mask glass
  P.push({ g: new THREE.TorusGeometry(0.1, 0.02, 5, 16).rotateX(Math.PI * 0.82).translate(0, -0.05, -0.965), c: 0x9fc4cc });
  for (const sx of [-1, 1]) {                                                                                                                                  // twin tanks
    P.push({ g: alongZ(lathe([[0, 0], [0.06, 0], [0.085, 0.04], [0.085, 0.56], [0.06, 0.61], [0.03, 0.63], [0, 0.64]], 10)).translate(sx * 0.1, 0.21, -0.06), c: 0x6fb2c2 });
    P.push({ g: new THREE.CylinderGeometry(0.025, 0.025, 0.1, 6).rotateX(Math.PI / 2).translate(sx * 0.1, 0.21, -0.74), c: 0xb8d4dc });
  }
  for (const z of [-0.2, -0.48]) P.push({ g: bbox(0.42, 0.06, 0.05, 0.015, 0, 0.21, z), c: 0x0b0f12 });                                                       // tank straps
  P.push({ g: new THREE.CylinderGeometry(0.04, 0.04, 0.26, 6).rotateZ(Math.PI / 2).translate(0, 0.25, -0.76), c: 0xb8d4dc });                                 // manifold
  P.push({ g: tube([[0.13, 0.26, -0.76], [0.2, 0.12, -0.88], [0.1, -0.06, -0.98], [0, -0.1, -0.99]], 0.028, 12, 5), c: 0x1b3a44 });                          // breathing hose
  for (const sx of [-1, 1]) P.push({ g: tube([[sx * 0.2, 0.0, -0.62], [sx * 0.3, -0.12, -0.95], [sx * 0.24, -0.14, -1.2]], 0.055, 10, 6), c: 0x0b0f12 });     // arms to the handles
  // the scooter: torpedo body, nose cone, duct ring, two handles
  P.push({ g: alongZ(lathe([[0, 0], [0.1, 0.0], [0.17, 0.08], [0.18, 0.22], [0.18, 0.66], [0.15, 0.8], [0.09, 0.88], [0, 0.91]], 14)).translate(0, -0.14, -1.18), c: 0xd8c690 });
  P.push({ g: new THREE.TorusGeometry(0.22, 0.04, 6, 18).translate(0, -0.14, -1.1), c: 0x9fc4cc });
  for (const sx of [-1, 1]) P.push({ g: tube([[sx * 0.17, -0.14, -1.4], [sx * 0.3, -0.14, -1.32], [sx * 0.3, -0.14, -1.18], [sx * 0.24, -0.14, -1.14]], 0.025, 8, 5), c: 0x9fc4cc });
  P.push({ g: new THREE.CircleGeometry(0.06, 10).rotateY(Math.PI).translate(0, -0.14, -2.1), c: 0xf2e6cc }); // scooter lamp
  return merge(P);
}
function legGeo() {
  const P = [];
  P.push({ g: new THREE.CapsuleGeometry(0.075, 0.36, 3, 8).rotateX(Math.PI / 2).translate(0, 0, 0.22), c: 0x0b0f12 });
  P.push({ g: new THREE.CapsuleGeometry(0.06, 0.34, 3, 8).rotateX(Math.PI / 2).translate(0, -0.03, 0.62), c: 0x0b0f12 });
  const fin = shapeOf([[-0.08, 0], [0.08, 0], [0.17, 0.52], [0.06, 0.58], [0, 0.55], [-0.06, 0.58], [-0.17, 0.52]]);
  P.push({ g: extrude(fin, 0.02, 0.012, { curve: 1 }).rotateX(Math.PI / 2).translate(0, -0.05, 0.82), c: 0x14202a });
  return merge(P);
}
// cargo ship hull from below: lofted sections (keel at y 0), bilge keels, rudder; bow at -z
function hullGeo() {
  const half = [[0, 0], [1.6, 0.04], [3.5, 0.32], [4.8, 1.05], [5.5, 2.1], [5.9, 3.3], [6, 4.4]];
  const st = [[17, 0.62, 1.1], [15, 0.85, 0.35], [11, 1, 0], [-9, 1, 0], [-12.5, 0.8, 0.3], [-15, 0.45, 0.9], [-16.6, 0.06, 1.8]];
  const ring = (k) => { const [z, sx, lift] = st[k]; const o = []; for (let i = half.length - 1; i >= 0; i--) o.push([-half[i][0] * sx, lift + half[i][1] * (1 - lift / 4.6), z]); for (let i = 1; i < half.length; i++) o.push([half[i][0] * sx, lift + half[i][1] * (1 - lift / 4.6), z]); return o; };
  const pos = [];
  for (let k = 0; k < st.length - 1; k++) {
    const A = ring(k), B = ring(k + 1);
    for (let i = 0; i < A.length - 1; i++) { pos.push(...A[i], ...B[i], ...A[i + 1], ...A[i + 1], ...B[i], ...B[i + 1]); }
  }
  const S = ring(0); for (let i = 1; i < S.length - 1; i++) pos.push(...S[0], ...S[i + 1], ...S[i]); // transom
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const parts = [{ g, c: 0x0a0d10 }];
  for (const sx of [-1, 1]) parts.push({ g: box(0.25, 0.6, 16, sx * 4.4, 0.6, 0, 0, 0, sx * 0.6), c: 0x0a0d10 });
  parts.push({ g: bbox(0.35, 3.6, 2.2, 0.08, 0, 1.4, 19.2), c: 0x0a0d10 });               // rudder
  parts.push({ g: box(0.6, 0.5, 4, 0, 0.1, 17.6), c: 0x0a0d10 });                           // skeg
  return merge(parts);
}
function propGeo() {
  const blade = shapeOf([[0, -0.12], [0.5, -0.42], [1.25, -0.4], [1.55, -0.05], [1.35, 0.35], [0.6, 0.42], [0, 0.12]]);
  const parts = [{ g: lathe([[0, -0.5], [0.32, -0.45], [0.36, 0], [0.3, 0.45], [0, 0.6]], 12).rotateX(Math.PI / 2), c: 0x1d2a30 }];
  for (let i = 0; i < 4; i++) parts.push({ g: extrude(blade, 0.07, 0.03, { curve: 1 }).rotateY(0.45).translate(0.2, 0, 0).rotateZ((i * Math.PI) / 2), c: 0x23353c });
  return merge(parts);
}
function pileGeo() {
  const P = [];
  const h = SURF - SEA + 0.5;
  P.push({ g: new THREE.CylinderGeometry(0.55, 0.62, h, 9).translate(0, SEA + h / 2, 0), c: 0x113a44 });
  for (let i = 0; i < 3; i++) P.push({ g: new THREE.TorusGeometry(0.62, 0.12, 5, 11).rotateX(Math.PI / 2).translate(0, SURF - 2.6 + i * 0.75, 0), c: 0x8cc6d0 });
  P.push({ g: new THREE.TorusGeometry(0.5, 0.13, 5, 10).rotateX(Math.PI / 2).translate(0, SEA + 0.7, 0), c: 0x0a2a32 });
  P.push({ g: bbox(0.3, 0.42, ROW.step, 0.06, 0, SEA + 2.2, -ROW.step / 2), c: 0x0a2830 });
  P.push({ g: bbox(0.34, 0.5, ROW.step, 0.06, 0, SURF - 0.7, -ROW.step / 2), c: 0x0d3039 });
  return merge(P);
}

export const S11 = {
  id: 'S11', t0: 84.7, t1: 95.1, world: 'cold', pre: 0, post: 0.6,
  key: [0.15, 0.95, 0.25],
  fog: { color: PAL.petrolDeep, near: 9, far: 42 },
  sky: { zen: PAL.petrolDeep, hor2: PAL.petrolDeep, hor: PAL.petrolDeep, nadir: PAL.black, stars: 0, rays: 0 },
  build(kit) {
    const s = {};
    const W = kit.words;
    s.tTick = W.times('tick, tick,', 85.42);
    s.tFeel = W.times('feel the city breathe', 87.28);
    s.tTen = W.times('ten', 88.86)[0];
    s.tHold = W.times('hold', 91.04)[0];
    [s.tHere, s.tWe, s.tGo] = W.times('here we go', 93.14);
    s.prof = kit.travel([[84.7, 2.5, 0.01], [91.3, 0.5, 1.0], [93.0, 2.5, 1.0], [94.0, 3, 1.0]]);
    s.rise = kit.travel([[93.3, 0, 0.01], [93.35, 2, 1.0]]);
    s.vy = (t) => 1.0 * sm(s.tTen, s.tTen + 1.8, t) - s.rise.d(t); // world offset (you sink 1 m, then rise)

    const root = (s.root = new THREE.Group());
    kit.group.add(root);
    const V = (s.V = new THREE.Group()); root.add(V);       // vertical frame
    const Wd = (s.W = new THREE.Group()); V.add(Wd);        // travel frame
    // Round 4: sunlight from the surface: slanted cyan shafts beside the path (>= 3.4 m out) that pass as you glide
    {
      const shaftG = new THREE.CylinderGeometry(0.5, 1.5, SURF - SEA, 10, 1, true).translate(0, (SURF + SEA) / 2, 0);
      s.shafts = inst(shaftG, kit.flat({ color: PAL.cyan, additive: true, opacity: 0.1, depthWrite: false, fog: 0.6 }), 7, 's11-shafts');
      [[-3.6, -4], [4.2, -11], [-4.6, -19], [3.4, -26], [-3.8, -34], [4.8, -41], [-3.4, -49]].forEach(([x, z], i) => setI(s.shafts, i, x, 0, z, 0, 0, (x < 0 ? 1 : -1) * 0.18));
      s.shafts.frustumCulled = false;
      Wd.add(s.shafts);
    }
    s.worldG = V;

    // seabed: faceted dunes, a mooring chain and a few boulders
    const sea = new THREE.PlaneGeometry(90, 170, 18, 34).rotateX(-Math.PI / 2);
    const P = sea.getAttribute('position');
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, 0.45 * Math.sin(x * 0.27 + z * 0.11) + 0.3 * Math.sin(z * 0.37 - x * 0.05)); }
    sea.translate(0, SEA, -62);
    Wd.add(new THREE.Mesh(merge([{ g: sea, c: 1 }]), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], vertexColors: true, rim: null })));
    const deco = [];
    for (let i = 0; i < 16; i++) {
      const a = i * 0.32;
      const g = new THREE.TorusGeometry(0.42, 0.13, 5, 10).scale(1.35, 1, 1);
      if (i % 2) g.rotateX(Math.PI / 2);
      deco.push({ g: g.rotateY(0.5 + 0.2 * Math.sin(a)).translate(-1.2 + i * 0.95 * Math.cos(0.5) - 3, SEA + 0.35, -16 - i * 0.95 * Math.sin(0.5) * 1.6), c: 0x0f3b46 });
    }
    const rnd = kit.rnd(11);
    for (let i = 0; i < 6; i++) deco.push({ g: new THREE.DodecahedronGeometry(0.8 + rnd() * 1.4, 0).scale(1.3, 0.7, 1).translate((rnd() > 0.5 ? 1 : -1) * (7 + rnd() * 6), SEA + 0.2, -8 - i * 9), c: 0x0c2f38 });
    deco.push({ g: lathe([[0, 0], [0.9, 0], [0.9, 0.4], [0.35, 0.55], [0.3, 1.2], [0, 1.2]], 10).translate(-2.6, SEA, -30), c: 0x113a44 }); // sunken mooring block
    Wd.add(new THREE.Mesh(merge(deco), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.teal, rimTh: 0.6 })));

    // pilings, two rows
    s.piles = inst(pileGeo(), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.teal, rimTh: 0.72 }), ROW.n * 2, 's11-piles');
    s.pileRnd = Array.from({ length: ROW.n * 2 }, (_, i) => [Math.sin(i * 12.9898) * 0.04, (i * 0.618) % 1 * Math.PI]);
    root.add(s.piles);
    s.piles.position.y = 0;

    // the black car on the seabed, headlights on
    const car = (s.car = new THREE.Group());
    car.position.set(-3.4, SEA + 0.3, -24);
    car.rotation.set(0, -Math.PI / 2 + 0.32, 0.14, 'YXZ');
    car.add(new THREE.Mesh(carGeo(), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.cyan, rimTh: 0.58 })));
    const hl = [];
    for (const z of [-0.62, 0.62]) hl.push({ g: new THREE.CircleGeometry(0.13, 12).rotateY(Math.PI / 2).translate(2.7, 0.62, z), c: 0xffffff });
    car.add(new THREE.Mesh(merge(hl), kit.flat({ color: PAL.cream, fog: 0.4, vertexColors: true })));
    const cone = new THREE.ConeGeometry(1.8, 11, 16, 1, true).translate(0, -5.5, 0).rotateZ(Math.PI / 2).translate(2.75, 0.6, 0);
    s.carCone = new THREE.Mesh(cone, kit.flat({ color: PAL.cyan, opacity: 0.16, additive: true, fog: 0.6, side: THREE.DoubleSide }));
    car.add(s.carCone);
    Wd.add(car);

    // the surface: lit patches of the city above
    s.surfU = { ...fogUniforms(kit), uA: { value: new THREE.Color(PAL.petrolDeep) }, uB: { value: new THREE.Color(PAL.petrol) }, uC: { value: new THREE.Color(PAL.teal) }, uSwell: { value: 0 }, uFogAmt: { value: 0.75 } };
    s.surface = new THREE.Mesh(new THREE.PlaneGeometry(200, 220).rotateX(Math.PI / 2).translate(0, SURF, -70), new THREE.ShaderMaterial({ uniforms: s.surfU, vertexShader: WORLD_V, fragmentShader: SURF_F, side: THREE.DoubleSide }));
    Wd.add(s.surface);
    // three soft light shafts
    const sh = [];
    for (let i = 0; i < 3; i++) sh.push({ g: new THREE.PlaneGeometry(3 + i, 14).rotateZ(0.25 - i * 0.18).translate(-6 + i * 7.5, 0, -14 - i * 9), c: 1 });
    s.shafts = new THREE.Mesh(merge(sh), kit.flat({ color: PAL.cyan, opacity: 0.06, additive: true, fog: 0.6, side: THREE.DoubleSide }));
    void s.shafts;

    // the ship overhead (own z clock, frozen in the hold)
    const ship = (s.ship = new THREE.Group());
    ship.add(new THREE.Mesh(hullGeo(), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.cyan, rimTh: 0.55 })));
    s.prop = new THREE.Mesh(propGeo(), kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.cyan }));
    s.prop.position.set(0, 1.5, 17.9);
    ship.add(s.prop);
    ship.position.set(2.4, SURF - 2.7, 0);
    V.add(ship);

    // the diver (moves with you, her own pose clock)
    const dv = (s.diver = new THREE.Group());
    const dm = kit.toon({ ramp: NEUTRAL, vertexColors: true, rim: PAL.cyan, rimTh: 0.55 });
    s.diverPose = new THREE.Group(); dv.add(s.diverPose);
    s.diverPose.add(new THREE.Mesh(diverBody(), dm));
    const lg = legGeo();
    s.legs = [-1, 1].map((sx) => { const m = new THREE.Mesh(lg, dm); m.position.set(sx * 0.11, -0.02, 0.02); s.diverPose.add(m); return m; });
    const blades = merge([0, 1, 2].map((i) => ({ g: box(0.05, 0.16, 0.02, 0, 0.08, 0).rotateZ((i * Math.PI * 2) / 3), c: 0x9fc4cc })));
    s.dprop = new THREE.Mesh(blades, dm); s.dprop.position.set(0, -0.14, -1.12); s.diverPose.add(s.dprop);
    dv.scale.setScalar(1.75);
    const lamp = new THREE.ConeGeometry(0.9, 6, 14, 1, true).translate(0, -3, 0).rotateX(Math.PI / 2).translate(0, -0.14, -2.1);
    s.diverPose.add(new THREE.Mesh(lamp, kit.flat({ color: PAL.cyan, opacity: 0.14, additive: true, fog: 0.5, side: THREE.DoubleSide })));
    root.add(dv);

    // bubbles: your entry, then her two breaths ("tick, tick")
    const dpos = (t) => TMP.v.set(lerp(1.9, 0.6, lin(84.7, 93, t)), 1.5, -6.8);
    const bub = [];
    for (let i = 0; i < 36; i++) bub.push({ kind: 0, i });
    for (const tb of s.tTick) for (let i = 0; i < 14; i++) bub.push({ kind: 1, tb, i });
    s.bubbles = kit.particles({
      n: bub.length, shape: 'ring', size: 0.22, color: PAL.cyan, opacity: 0.8, billboard: true,
      init: (i, r) => {
        const b = bub[i];
        if (b.kind === 0) { const a = r() * Math.PI * 2, d = 2.2 + r() * 3; return { p: [Math.cos(a) * d, -1.5 + r() * 2, Math.sin(a) * d - 1], v: [0, 1.1 + r() * 0.9, 2.5], t0: 84.7 + r() * 0.5, life: 3.2, s: 0.12 + r() * 0.28, c: r() > 0.3 ? PAL.cyan : PAL.cream, freeze: HOLD }; }
        const p = dpos(b.tb);
        return { p: [p.x + (r() - 0.5) * 0.3, p.y + 0.4, p.z - 0.9], v: [(r() - 0.5) * 0.4, 1.4 + r() * 0.8, 2.5], t0: b.tb + r() * 0.12, life: 2.6, s: 0.08 + r() * 0.22, c: PAL.cream, freeze: HOLD };
      },
    });
    root.add(s.bubbles);

    // the surface shatter (root frame, at the surface height of 94.4)
    const sy = SURF + s.vy(SHATTER);
    s.shards = kit.shards({
      n: 20, t0: SHATTER, life: 1.0, gravity: -3, seed: 7, colors: [PAL.teal, PAL.cyan, PAL.petrol, PAL.petrolDeep],
      init: (i, r) => { const x = (r() - 0.5) * 18, z = -2 - r() * 16; const o = Math.hypot(x, z + 4) + 0.5; return { p: [x, sy + r() * 0.3, z], v: [(x / o) * 3, 4 + r() * 5, ((z + 4) / o) * 3], s: [1.9 + r() * 2.0, 1.9 + r() * 2.0], delay: r() * 0.12 }; },
    });
    root.add(s.shards);

    const AT = { d: 7, az: -15, y: 0.6 };
    kit.text('TICK, TICK,', { cap: 1.0, color: 'cream', near: 85.42, out: s.tFeel[0] - 0.03, at: AT });
    kit.text('FEEL THE\nCITY BREATHE', { cap: 0.85, color: 'cream', colors: { 3: 'gold' }, near: 87.28, say: 'feel the city breathe', out: 88.55, at: AT });
    kit.text('TEN FLOORS', { cap: 1.1, color: 'gold', near: 88.86, out: 89.7, at: AT });
    kit.text('UNDER WHAT\nYOU BELIEVE', { cap: 0.85, color: 'cream', near: 89.76, say: 'under what you believe', out: 90.95, at: AT });
    kit.text('HOLD YOUR\nBREATH...', { cap: 0.95, color: 'cream', near: 91.04, say: 'hold your breath...', out: 93.0, at: AT });
    kit.text('HERE WE GO', { cap: 1.05, color: 'gold', near: 93.14, say: 'here we go', out: 94.6, at: AT });
    return s;
  },
  update(t, s, kit) {
    const under = t < 95.1;
    s.worldG.visible = under; s.piles.visible = under; s.diver.visible = under; s.bubbles.visible = under;
    const d = s.prof.d(t), vy = s.vy(t);
    s.V.position.y = vy;
    s.W.position.z = d;
    // pilings wrap with the travel (pure in d)
    const span = ROW.n * ROW.step;
    for (let side = 0; side < 2; side++) for (let i = 0; i < ROW.n; i++) {
      const k = side * ROW.n + i;
      const z = -span + 14 + ((i * ROW.step + (side ? 0 : ROW.step / 2) + d) % span + span) % span;
      const [lean, yaw] = s.pileRnd[k];
      setI(s.piles, k, side ? ROW.x : -ROW.x, vy, z, lean, yaw * 0.2, lean * 0.6);
    }
    s.piles.instanceMatrix.needsUpdate = true;
    // the city breathes: patches swell twice on "feel the city breathe"
    const f0 = s.tFeel[0], f3 = s.tFeel[3];
    s.surfU.uSwell.value = 0.15 + 0.85 * (Math.max(0, Math.sin(Math.PI * 2 * lin(f0, f3 + 0.6, t))) * (t > f0 && t < f3 + 0.6 ? 1 : 0));
    s.surface.visible = t < SHATTER;
    // the ship slides overhead from behind (frozen in the hold)
    const ts = frozen(t);
    s.ship.position.z = 30 - 9.2 * (ts - 87.6);
    s.ship.visible = s.ship.position.z > -60 && s.ship.position.z < 50 && under;
    s.prop.rotation.z = ts * 2.4;
    // the diver: kicks slowly, aims up on "here", shoots up on "go"
    const tp = frozen(t);
    const aim = easeInOut(lin(s.tHere, s.tHere + 0.6, t));
    const go = Math.max(0, t - s.tGo);
    s.diver.position.set(lerp(1.9, 0.6, lin(84.7, 93, t)), 1.5 + 3.3 * go * go + 0.4 * aim, -6.8 - 3 * go);
    s.diver.rotation.set(0, 52 * D2R * (1 - aim * 0.5), 0, 'YXZ');
    s.diverPose.rotation.x = 55 * D2R * aim;
    const kick = Math.sin(tp * Math.PI * 2 * 0.85) * (t < HOLD[0] || t > HOLD[1] ? 1 : 0.0);
    s.legs[0].rotation.x = 0.26 * kick; s.legs[1].rotation.x = -0.26 * kick;
    s.dprop.rotation.z = t > s.tWe ? (t - s.tWe) * (6 + 30 * lin(s.tWe, s.tGo, t)) : 0;
    if (kit.isOwner) {
      // entry: the murk clears (fog opens from 2.5 m to 42 m over 0.8 s) instead of a long dim fade from black
      const clear = sm(84.7, 85.5, t);
      kit.setFog(PAL.petrolDeep, 9 * clear, 2.5 + 39.5 * clear);
      const brk = sm(SHATTER, SHATTER + 0.5, t);
      kit.setSky({ zen: brk > 0 ? 0x0d4c5a : PAL.petrolDeep, hor2: PAL.petrolDeep, hor: PAL.petrolDeep, nadir: PAL.black, stars: 0, rays: 0 });
    }
    kit.fade(sm(84.7, 84.8, t));                 // up from S10's black into the murk (a long dim fade breaks the frame into specks)
  },
  events() {
    return [
      { t: 84.72, sfx: 'whoosh', gain: 0.35 },
      { t: 88.86, sfx: 'motor', gain: 0.3 },
      { t: 93.46, sfx: 'motor', gain: 0.45 },
      { t: SHATTER, sfx: 'crack', gain: 0.6, haptic: [0.5, 90] },
    ];
  },
};
