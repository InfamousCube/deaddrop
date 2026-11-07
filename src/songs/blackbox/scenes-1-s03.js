// S03 The Pole Line (16.00 to 22.63, cold). Visible from 15.4 through S02's portal (all materials use
// explicit cold ramps/keys because S02 still owns the world then).
// SHOT CARD
//   hero     the giant black 1960s car (22 m, fins) waiting at the end of the lamp row, headlights on
//   supports one row of black streetlamp poles on the right (big cones of light on a dark road);
//            the cyan moon in the sky
//   palette  black + petrol (road, horizon) + teal/white light (lamp cones, two headlights)
//   motion   the player glides down the road toward the car (4 -> 1.5 m/s); the Engineer steps out
//            on "waiting"; LIGHTS-OUT 21.14-22.38 the lamps die from behind toward the car,
//            headlights cut at 22.55
//   lyrics   one block at a time in the black sky ahead (d 6.5, az -8, 17 deg up, over the lamp row):
//            BLACK CAR / WAITING, then WHERE THE / STREETLIGHTS END (END dies with the last lamp)
//   removed  fields, centre dashes, 5 thin conductors, the second pole row, the inner light cones, the headlight beam cones, 40 birds, the factory
//            horizon, the moon rim, crossarms and insulators, the sign arm
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { engineer, extrude, scratch } from './scenes-1-util.js';

const KEY = [0.33, 0.45, -0.83]; // moonlight from ahead-right: everything is backlit, rims face the player
const RY = -3;                   // road level: the player floats at the car's roof height
const POLE_X = 8.5, LAMP_X = 4.0, LAMP_Y = 3.6; // lamp heads stay right of the lyric block
const K0 = -1, KN = 7;           // pole indices: local z = 30 - 25k
const ON = { '0': 15.45, '1': 15.45, // the first pair is lit when S02's portal opens: the zero frames the lamp row
   '-1': 16.59, '2': 15.45, '3': 17.16 }; // '2' (20 m ahead) is lit through the portal too
const OFF = { '-1': 21.14, '0': 21.42, '1': 21.7, '2': 21.98, '3': 22.38 };
const CAR_Z = -43.2, CAR_X = -2.0, CAR_S = 3.6; // the car's front sits at -32; the last lit lamp backlights it

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

export const S03 = {
  id: 'S03', t0: 16.0, t1: 22.63, world: 'cold', pre: 0.6, post: 0,
  key: KEY, fog: { color: PAL.black, near: 30, far: 160 },
  sky: { moonR: 0.07, moonDir: [-0.596, 0.375, -0.71], hor: PAL.petrol, hor2: PAL.petrolDeep, stars: 0.4 },
  build(kit) {
    const s = { x: scratch() };
    s.prof = kit.travel([[15.4, 4, 0.01], [17.0, 1.5, 2.0]]);
    s.w = new THREE.Group(); kit.group.add(s.w);
    const blackRim = (o = {}) => kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.45, key: KEY, ...o });
    // black ground to the horizon, one petrol road to the vanishing point (the black car reads against it)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 40).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black, fog: 0 }));
    ground.position.y = RY - 0.05; kit.group.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 420).rotateX(-Math.PI / 2), kit.flat({ color: PAL.petrol }));
    road.position.set(0, RY, -110); s.w.add(road);
    // poles: chunky mast + arm + lamp head, one row on the right
    const top = LAMP_Y + 1.0;
    const poleG = mergeSimple([box(0.6, top - RY, 0.6, POLE_X, (top + RY) / 2, 0), box(POLE_X - LAMP_X + 0.3, 0.32, 0.32, (POLE_X + LAMP_X) / 2, LAMP_Y + 0.4, 0), box(1.3, 0.34, 0.6, LAMP_X, LAMP_Y + 0.2, 0)]);
    const nA = KN - K0 + 1;
    s.poles = new THREE.InstancedMesh(poleG, blackRim({ rimTh: 0.62 }), nA);
    const m = s.x.m;
    for (let k = K0; k <= KN; k++) s.poles.setMatrixAt(k - K0, m.makeTranslation(0, 0, 30 - 25 * k));
    s.poles.frustumCulled = false;
    s.w.add(s.poles);
    // lamps: bulb, one light cone, pool on the road (instanced, switched by scale)
    const H = LAMP_Y - RY;
    s.bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 12, 8), kit.flat({ color: PAL.white, fog: 0.4 }), nA);
    const cone = (r, h) => new THREE.ConeGeometry(r, h, 20, 1, true).translate(0, -h / 2, 0);
    s.coneO = new THREE.InstancedMesh(cone(4.6, H), kit.flat({ color: PAL.petrol, opacity: 0.32, side: THREE.DoubleSide }), nA);
    s.pools = new THREE.InstancedMesh(new THREE.CircleGeometry(4.6, 24).rotateX(-Math.PI / 2), kit.flat({ color: PAL.teal, opacity: 0.4 }), nA);
    s.bulbs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nA * 3), 3);
    for (const im of [s.bulbs, s.coneO, s.pools]) { im.frustumCulled = false; s.w.add(im); }
    // THE BLACK CAR (1960s sedan with fins, 3.6x scale), facing the player, and the Engineer
    const car = new THREE.Shape();
    [[-3.1, 0.3], [-3.15, 0.55], [-3.3, 1.18], [-2.3, 0.98], [-1.5, 0.96], [-0.95, 1.42], [0.55, 1.44], [1.2, 0.98], [2.85, 0.9], [3.05, 0.62], [3.02, 0.3]]
      .forEach(([x, y], i) => (i ? car.lineTo(x, y) : car.moveTo(x, y)));
    const carG = mergeSimple([extrude(car, 2.0).rotateY(-Math.PI / 2), ...[[-0.95, 2.0], [0.95, 2.0], [-0.95, -2.0], [0.95, -2.0]].map(([x, z]) => new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12).rotateZ(Math.PI / 2).translate(x, 0.36, z))]);
    s.car = new THREE.Group(); s.car.position.set(CAR_X, RY, CAR_Z); s.car.scale.setScalar(CAR_S); s.w.add(s.car);
    s.car.add(new THREE.Mesh(carG, blackRim({ rimTh: 0.35 })));
    s.heads = new THREE.Mesh(mergeSimple([new THREE.CircleGeometry(0.26, 16).translate(-0.62, 0.63, 3.08), new THREE.CircleGeometry(0.26, 16).translate(0.62, 0.63, 3.08)]), kit.flat({ color: PAL.white, fog: 0.2 }));
    s.car.add(s.heads);
    s.eng = engineer(kit, { rim: PAL.cyan, key: KEY });
    s.car.add(s.eng.group);
    // ---- type: one block at a time, in the black sky ahead-left ----
    const at = { d: 6.5, az: -8, y: 3.6 }; // over the lamp row, clear of the moon (az -40)
    s.blackT = kit.text('BLACK CAR\nWAITING', { cap: 0.95, lineGap: 0.95, color: 'cream', colors: { 0: 'gold', 1: 'gold' }, near: 17.44, out: 20.98, outDur: 0.15, at });
    s.endT = kit.text('WHERE THE\nSTREETLIGHTS END', { cap: 0.72, lineGap: 0.95, color: 'cream', near: 21.14, out: 22.55, outDur: 0.08, at });
    s.endT.hideWord(3, 22.38);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.w.position.z = d;
    const m = s.x.m;
    // lamps
    let lit = 0;
    for (let k = K0; k <= KN; k++) {
      const i = k - K0, on = ON[k] !== undefined && t >= ON[k] && !(OFF[k] !== undefined && t >= OFF[k]);
      const z = 30 - 25 * k, f = on ? 1 : 0;
      lit += f;
      m.makeTranslation(LAMP_X, LAMP_Y, z); s.bulbs.setMatrixAt(i, m);
      m.makeScale(f, f, f).setPosition(LAMP_X, LAMP_Y, z); s.coneO.setMatrixAt(i, m);
      m.makeScale(f, f, f).setPosition(LAMP_X, RY + 0.02, z); s.pools.setMatrixAt(i, m);
      s.bulbs.setColorAt(i, s.x.c.setHex(on ? PAL.white : 0x0b1214));
    }
    for (const im of [s.bulbs, s.coneO, s.pools]) im.instanceMatrix.needsUpdate = true;
    s.bulbs.instanceColor.needsUpdate = true;
    s.poles.material.uniforms.uRimAmt.value = t < 21.14 ? 1 : 0.35 + 0.65 * (lit / 5);
    // the car: silhouette on "Black", headlights on "car", one flash on 18.31, cut 22.55
    s.car.visible = t >= 17.44;
    const hl = t >= 17.56 && t < 22.55;
    s.heads.visible = hl;
    const kick = t >= 18.31 && t < 18.45;
    s.heads.material.uniforms.uBright.value = 1 + 1.5 * (kick ? 1 : 0);
    // the Engineer steps out from behind the car on "waiting"
    const ek = kit.ease.out((t - 20.6) / 0.6);
    s.eng.group.visible = t >= 20.6;
    s.eng.group.position.set(-0.4 - 1.35 * ek, 0, -3.6 + 3.4 * ek);
    s.eng.group.rotation.y = 0.2;
  },
  events() {
    return [
      { t: 16.0, sfx: 'switch', gain: 0.35 },
      { t: 17.56, sfx: 'key', gain: 0.4 },
      { t: 21.14, sfx: 'tick', gain: 0.3 },
      { t: 22.55, sfx: 'switch', gain: 0.4 },
    ];
  },
};
