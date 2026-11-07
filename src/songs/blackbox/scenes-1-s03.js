// S03 The black car (17.20 to 23.40, cold; post 2.4 for the hotel door). Round 3, storyboard v3.
// SHOT CARD
//   what     a night street of cast-iron lamps; at its end, in front of a grand hotel, a black 60s GT coupe
//            waits with its headlights on; the lamps die one pair after another up to the one above the car.
//   hero     the car (lofted body, fastback cabin, wire wheels, round headlights in scoops, chrome bars)
//   around   lamp posts (fluted base, collar rings, swan-neck arm, bell lantern, light cone + pool) on both
//            sides every 6 m at x +-5, passing at 3.4-5 m; black building fronts with cornices and a few big
//            cyan panes at x +-14; the lamp arms overhead; a cyan moon; behind, the lamps you passed stay lit
//   palette  black + petrol road and houses + cyan lamps and moon + cream headlights + rust tail lights
//   motion   16.25-17.5 the lamps light behind the rolling gold ball (S02 draws the ball until it is under the
//            car); the player sinks to eye height (<= 1.5 m/s) and glides at 3 m/s, 1.6 m/s by 22.1;
//            17.44 headlights on; 20.60 the engine idles; 21.14-22.38 the lamps die toward the car
//   lyrics   right of the road (az +15, d 8); END alone, big, above the car
//   out      PASS-BY + DOOR PORTAL: 22.40 the car pulls out and passes 3.5 m to the left; 22.6-23.4 the hotel
//            doors swing open on the banquet hall (S04 pre 0.8); you glide through the door at 25.2 (post 2.4)
import * as THREE from 'three';
import { PAL } from './style.js';
import { lathe, ext, tube, polyShape, polyPath, archPts, inst, setM, scratch, merge, buildCar, PATH_KEYS, T_DOOR, streetY } from './scenes-1-util.js';

const LAMP_P = [-11, -5, 1, 7, 13, 19];
const LAMP_ON = [17.2, 17.32, 17.44, 16.3, 16.6, 16.95]; // the near three after S02 is gone, the far three as the ball passes
const LAMP_OFF = [99, 99, 99, 21.14, 21.76, 22.38];     // toward the car; the last one on "end"
const LX = 5.4, ARM = 1.65;
const CAR_P = 18.6, CAR_X = -3.75;
const T_GO = 22.4;

export const S03 = {
  id: 'S03', t0: 17.2, t1: 23.4, world: 'cold', pre: 1.0, post: T_DOOR + 0.25 - 23.4,
  key: [-0.3, 0.6, 0.74],
  fog: { color: PAL.black, near: 14, far: 62 },
  sky: { moonR: 0.055, moonDir: [-0.45, 0.42, -0.79], stars: 0.35, hor: PAL.petrolDeep },
  build(kit) {
    const s = { x: scratch() };
    const W = (txt, near) => kit.words.times(txt, near)[0];
    s.tBlack = W('black', 17.44); s.tWait = W('waiting', 20.6); s.tEnd = W('end', 22.38);
    s.G = kit.travel(PATH_KEYS);
    s.Pdoor = s.G.d(T_DOOR);
    const st = (s.street = new THREE.Group());
    kit.group.add(st);
    // ---- road, kerbs, pavements, dashed centre line
    const RL = 30 + s.Pdoor, RC = (30 - s.Pdoor) / 2; // the street ends at the hotel facade (the hall floor lies lower behind it)
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, RL).rotateX(-Math.PI / 2).translate(0, 0, RC), kit.flat({ color: 0x041318 }));
    const pave = merge([new THREE.BoxGeometry(12, 0.2, RL).translate(-10.5, 0.1, RC), new THREE.BoxGeometry(12, 0.2, RL).translate(10.5, 0.1, RC)]);
    const kerbS = polyShape([[0, 0], [0.32, 0], [0.32, 0.16], [0.26, 0.22], [0, 0.22]]);
    const kerbL = ext(kerbS, RL, 0.02, 1, 1); kerbL.translate(4.5, 0, RC);
    const kerbR = kerbL.clone().rotateY(Math.PI).translate(0, 0, 2 * RC);
    st.add(road, new THREE.Mesh(pave, kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null })), new THREE.Mesh(merge([kerbL, kerbR]), kit.toon({ ramp: 'steel', rim: null })));
    const dash = inst(new THREE.PlaneGeometry(0.22, 2.6).rotateX(-Math.PI / 2), kit.flat({ color: PAL.creamDark }), 16, 's03-dash');
    for (let i = 0; i < 16; i++) setM(dash, i, 0, 0.01, 14 - i * 6 > -s.Pdoor + 2 ? 14 - i * 6 : 999);
    st.add(dash);
    // ---- cast-iron street lamps (post, fluted base, collar rings, swan neck, bell lantern)
    const post = lathe([[0.32, 0], [0.32, 0.18], [0.24, 0.26], [0.26, 0.62], [0.17, 0.74], [0.13, 1.1], [0.17, 1.18], [0.12, 1.28], [0.1, 3.2], [0.13, 3.28], [0.09, 3.36], [0.075, 5.05], [0.11, 5.12], [0, 5.2]], 8);
    const neck = tube([[0, 5.0, 0], [0.15, 5.55, 0], [0.7, 5.82, 0], [1.3, 5.72, 0], [ARM, 5.45, 0]], 0.075, 14, 5);
    const scroll = tube([[0.05, 4.55, 0], [0.45, 4.75, 0], [0.62, 5.1, 0], [0.45, 5.35, 0], [0.25, 5.25, 0]], 0.045, 8, 4);
    const cap = lathe([[0.0, 5.32], [0.42, 5.32], [0.36, 5.4], [0.12, 5.62], [0.06, 5.66], [0.06, 5.8], [0.0, 5.86]], 10).translate(ARM, -0.25, 0);
    const postG = merge([post, neck, scroll, cap]);
    s.posts = inst(postG, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.42 }), 12, 's03-posts');
    const glassG = lathe([[0.0, 4.55], [0.16, 4.55], [0.34, 4.72], [0.37, 5.0], [0.38, 5.08], [0.0, 5.08]], 10).translate(ARM, 0, 0);
    s.glass = inst(glassG, kit.flat({ color: 0xffffff, fog: 0.5 }), 12, 's03-glass');
    const coneG = new THREE.ConeGeometry(2.1, 4.5, 14, 1, true).translate(ARM, 4.5 - 2.25, 0);
    s.cones = inst(coneG, kit.flat({ color: PAL.cyan, opacity: 0.13, additive: true, depthWrite: false, side: THREE.DoubleSide }), 12, 's03-cones');
    s.pools = inst(new THREE.CircleGeometry(2.3, 20).rotateX(-Math.PI / 2).translate(ARM, 0.02, 0), kit.flat({ color: PAL.teal, opacity: 0.35, additive: true, depthWrite: false }), 12, 's03-pools');
    s.lampXZ = [];
    for (let i = 0; i < LAMP_P.length; i++) for (let side = 0; side < 2; side++) {
      const k = i * 2 + side, x = side ? LX : -LX, ry = side ? Math.PI : 0;
      s.lampXZ.push([x, -LAMP_P[i], ry]);
      setM(s.posts, k, x, 0.2, -LAMP_P[i], ry);
    }
    s.cOn = new THREE.Color(PAL.cream); s.cOff = new THREE.Color(PAL.petrolDeep);
    s.glass.setColorAt(0, s.cOn);
    st.add(s.posts, s.glass, s.cones, s.pools);
    // ---- building fronts at x +-14: black blocks, cornice, string course, a few big cyan panes
    const bld = merge([new THREE.BoxGeometry(9, 14, 11.6).translate(0, 7, 0), ext(polyShape([[-5.2, 0], [5.2, 0], [5.2, 0.5], [4.9, 0.9], [-4.9, 0.9], [-5.2, 0.5]]), 11.8, 0.05, 1, 1).translate(0, 14, 0),
      new THREE.BoxGeometry(9.5, 0.35, 11.8).translate(0, 4.6, 0)]);
    const nB = 10, B = inst(bld, kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.teal, rimTh: 0.5 }), nB, 's03-houses');
    const win = inst(new THREE.PlaneGeometry(1.7, 2.6), kit.flat({ color: 0xffffff }), nB * 4, 's03-panes');
    const rr = kit.rnd(31); let wi = 0;
    for (let i = 0; i < nB; i++) {
      const side = i % 2, x = side ? 18.5 : -18.5, z = 12 - Math.floor(i / 2) * 12, h = 0.85 + rr() * 0.45;
      setM(B, i, x, -0.5, z, 0, [1, h, 1]);
      for (let j = 0; j < 4; j++) {
        const wz = z + (j % 2 ? 2.6 : -2.6), wy = (j < 2 ? 7.2 : 10.6) * h;
        setM(win, wi, side ? 13.98 : -13.98, wy, wz, side ? -Math.PI / 2 : Math.PI / 2);
        win.setColorAt(wi++, new THREE.Color(rr() < 0.3 ? PAL.cyan : PAL.petrolDeep));
      }
    }
    st.add(B, win);
    // ---- the hotel at the street's end: facade with a tall arched doorway, gold frame, two door leaves
    const zf = -s.Pdoor;
    const fac = polyShape([[-30, -2], [30, -2], [30, 22], [-30, 22]]);
    fac.holes.push(polyPath(archPts(5.2, 9.95, -1.75)));
    for (const wx of [-11, -6.2, 6.2, 11]) fac.holes.push(polyPath(archPts(2.2, 4.2, 7.0).map(([x, y]) => [x + wx, y])));
    const facade = new THREE.Mesh(ext(fac, 0.8, 0.06, 1, 8), kit.toon({ ramp: [PAL.black, PAL.black, PAL.petrolDeep], rim: PAL.cyan, rimTh: 0.5 }));
    facade.position.set(0, 0, zf - 0.4);
    const frame = polyShape(archPts(6.4, 10.65, -1.85)); frame.holes.push(polyPath(archPts(5.2, 9.95, -1.75)));
    const frameM = new THREE.Mesh(ext(frame, 0.35, 0.08, 2, 10), kit.toon({ ramp: 'gold', rim: null }));
    frameM.position.set(0, 0, zf + 0.15);
    const canopy = new THREE.Mesh(ext(polyShape([[-4.2, 0], [4.2, 0], [3.9, 0.55], [-3.9, 0.55]]), 3.2, 0.06, 1, 1), kit.toon({ ramp: 'gold', rim: null }));
    canopy.position.set(0, 9.3, zf + 1.4);
    const panes = inst(new THREE.PlaneGeometry(2.2, 4.2), kit.flat({ color: PAL.amber }), 4, 's03-hotelpanes');
    [-11, -6.2, 6.2, 11].forEach((wx, i) => setM(panes, i, wx, 7.0 + 2.1, zf - 0.7));
    st.add(facade, frameM, canopy, panes);
    // door leaves (petrol panels, gold rims, round brass handles), hinged at the frame sides, opening inward
    const leafPts = [[0, -1.75], [2.6, -1.75], [2.6, 8.15]];
    for (let i = 1; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * (Math.PI / 2); leafPts.push([2.6 + 2.6 * Math.cos(a), 5.6 + 2.6 * Math.sin(a) - 0.05]); }
    leafPts.push([0, 5.6]);
    const leafS = polyShape(leafPts);
    s.leaves = [];
    const leafMat = kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: PAL.gold, rimTh: 0.5 });
    const trimG = merge([0.1, -0.1].flatMap((z) => [ext(polyShape([[0.35, 0.45], [2.25, 0.45], [2.25, 3.0], [0.35, 3.0]]), 0.06, 0.04, 1, 1).translate(0, 0, z), ext(polyShape([[0.35, 3.45], [2.25, 3.45], [2.25, 6.6], [0.35, 5.3]]), 0.06, 0.04, 1, 1).translate(0, 0, z)]));
    const knob = lathe([[0, 0], [0.12, 0.05], [0.13, 0.12], [0, 0.18]], 8).rotateX(Math.PI / 2).translate(2.3, 3.2, 0.12);
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(side * 2.6, 0, zf);
      const leaf = new THREE.Group(); leaf.rotation.y = side > 0 ? Math.PI : 0;
      leaf.add(new THREE.Mesh(ext(leafS, 0.14, 0.03, 1, 6), leafMat), new THREE.Mesh(trimG, kit.toon({ ramp: 'gold', rim: null })), new THREE.Mesh(knob, kit.toon({ ramp: 'gold', rim: null })));
      hinge.add(leaf); st.add(hinge); s.leaves.push(hinge);
    }
    // ---- the car, parked at the left kerb in front of the hotel, nose toward you
    s.car = buildCar(kit, { scale: 1.3, rim: PAL.cyan });
    st.add(s.car.group);
    // ---- lyrics
    const R = { cap: 1.2, lineGap: 1.0, vAlign: 'top', depthTest: false, at: { d: 8, az: 8, y: 0.45 } };
    kit.text('BLACK CAR\nWAITING', { ...R, color: 'cream', colors: { 0: 'gold', 1: 'gold' }, near: s.tBlack, out: 21.0 });
    kit.text('WHERE THE\nSTREETLIGHTS', { ...R, color: 'cream', near: 21.14, out: 22.3, outDur: 0.08 });
    kit.text('END', { cap: 1.7, color: 'gold', near: s.tEnd, out: 23.1, depthTest: false, at: { d: 9, az: -29, y: 2.3 } });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.G.d(t);
    s.street.position.set(0, streetY(t), d);
    // lamps: on behind the ball / at the start, off toward the car
    const x = s.x;
    for (let i = 0; i < LAMP_P.length; i++) {
      const on = t >= LAMP_ON[i] && t < LAMP_OFF[i];
      const flick = t >= LAMP_OFF[i] - 0.12 && t < LAMP_OFF[i] ? 0.5 : 1;
      for (let side = 0; side < 2; side++) {
        const k = i * 2 + side, [lx, lz, ry] = s.lampXZ[k];
        s.glass.setColorAt(k, on ? s.cOn : s.cOff);
        setM(s.glass, k, lx, 0.2, lz, ry);
        const sc = on ? flick : 0.0001;
        setM(s.cones, k, lx, 0.2, lz, ry, sc); setM(s.pools, k, lx, 0, lz, ry, [sc, 1, sc]);
      }
    }
    s.glass.instanceColor.needsUpdate = true;
    s.glass.instanceMatrix.needsUpdate = s.cones.instanceMatrix.needsUpdate = s.pools.instanceMatrix.needsUpdate = true;
    // the car: headlights on "black car", idles on "waiting", pulls out at 22.40 and passes 3.5 m left
    const tau = Math.max(0, t - T_GO), zc = -CAR_P + 15 * tau * tau;
    const idle = t > s.tWait && t < T_GO ? 0.012 * Math.sin(t * 90) : 0;
    s.car.group.position.set(CAR_X, idle, zc);
    s.car.group.rotation.x = -0.02 * sm(T_GO, T_GO + 0.3, t) * (1 - sm(T_GO + 0.5, T_GO + 1, t));
    s.car.wheels.forEach((w) => { w.rotation.x = (15 * tau * tau) / 0.345; });
    const lights = t >= s.tBlack;
    s.car.lampMat.uniforms.uColor.value.set(lights ? PAL.cream : PAL.petrolDeep);
    s.car.cones.visible = t >= s.tEnd; // the beams only once the street is dark
    s.car.group.visible = zc < 30 - d;
    // doors swing open 22.6-23.4 (inward, away from you)
    const open = kit.ease.inOut(kit.clamp01((t - 22.6) / 0.8)) * 1.45;
    s.leaves[0].rotation.y = open; s.leaves[1].rotation.y = -open;
    // after the door has passed the eyes only the facade is left behind; hide the rest early
    if (kit.isOwner) kit.setSky({ moonR: 0.055 });
  },
  events() { return [{ t: 17.44, sfx: 'switch', gain: 0.4 }, { t: 22.62, sfx: 'whoosh', gain: 0.7, haptic: [0.3, 80] }, { t: 22.7, sfx: 'hatch', gain: 0.35 }]; },
};
