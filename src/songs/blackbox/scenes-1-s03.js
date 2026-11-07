// S03 The Pole Line (16.00 to 22.63, cold). The cradle's wire is the top conductor of a pole row; a
// road 8 m below; the black car waits where the streetlights end. Visible from 15.4 through S02's portal
// (all materials use explicit cold ramps/keys because S02 still owns the world then).
// Out: LIGHTS-OUT 21.14-22.63 (lamps die from behind toward the car; headlights cut at 22.55).
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { engineer, extrude, scratch } from './scenes-1-util.js';

const KEY = [0.33, 0.45, -0.83]; // moonlight from ahead-right: everything is backlit, rims face the player
const RY = -8;                   // road level
const POLE_X = 1.2;
const K0 = -2, KN = 12;          // pole indices: local z = 40 - 25k
const ON = { '2': 16.0, '1': 16.0, '3': 16.59, '0': 16.59, '4': 17.16, '-1': 17.16 };
const OFF = { '-1': 21.14, '0': 21.42, '1': 21.7, '2': 21.98, '3': 22.18, '4': 22.38 };
const CAR_Z = -58, CAR_X = -1.8;

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

export const S03 = {
  id: 'S03', t0: 16.0, t1: 22.63, world: 'cold', pre: 0.6, post: 0,
  key: KEY, fog: { color: PAL.black, near: 30, far: 160 },
  sky: { moonR: 0.07, moonDir: [0.33, 0.26, -0.91], hor: PAL.petrol, hor2: PAL.petrolDeep, stars: 0.55 },
  build(kit) {
    const s = { x: scratch() };
    s.prof = kit.travel([[15.4, 5, 0.01], [16.0, 6, 1.0], [19.6, 3, 1.9]]);
    s.w = new THREE.Group(); kit.group.add(s.w);
    const blackRim = (o = {}) => kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.45, key: KEY, ...o });
    // road, centre dashes, fields
    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 420).rotateX(-Math.PI / 2), kit.flat({ color: PAL.petrolDeep }));
    road.position.set(-3.5, RY, -100); s.w.add(road);
    const dashes = [];
    for (let z = 100; z > -320; z -= 7) dashes.push(new THREE.PlaneGeometry(0.16, 3.2).rotateX(-Math.PI / 2).translate(-3.5, RY + 0.01, z));
    s.w.add(new THREE.Mesh(mergeSimple(dashes), kit.flat({ color: PAL.teal })));
    const fields = [];
    for (let i = 0; i < 12; i++) {
      const w = 9 + (i % 3) * 4, off = 2 + i * 15;
      fields.push(new THREE.PlaneGeometry(w, 420).rotateX(-Math.PI / 2).translate(-7 - off - w / 2, RY - 0.05, -100));
      fields.push(new THREE.PlaneGeometry(w, 420).rotateX(-Math.PI / 2).translate(3 + off + w / 2, RY - 0.05, -100));
    }
    s.w.add(new THREE.Mesh(mergeSimple(fields), kit.flat({ color: PAL.petrol })));
    // poles: mast + crossarm + 3 insulators + streetlamp arm (row A at x 1.2), row B at x -30 (mirrored)
    const poleG = mergeSimple([
      box(0.3, 12, 0.3, 0, RY + 6, 0), box(6.4, 0.18, 0.18, -0.2, 3.0, 0),
      box(0.14, 0.28, 0.14, -2.7, 3.23, 0), box(0.14, 0.28, 0.14, -1.2, 3.23, 0), box(0.14, 0.28, 0.14, 2.3, 3.23, 0),
      box(4.7, 0.12, 0.12, -2.35, 0.62, 0), box(0.12, 1.4, 0.12, -0.3, 0.0, 0).rotateZ(0.6), box(0.7, 0.16, 0.36, -4.55, 0.55, 0),
    ]);
    const nA = KN - K0 + 1;
    s.poles = new THREE.InstancedMesh(poleG, blackRim({ rimTh: 0.62 }), nA * 2);
    const m = s.x.m;
    for (let k = K0; k <= KN; k++) {
      const z = 40 - 25 * k, i = k - K0;
      s.poles.setMatrixAt(i, m.makeTranslation(POLE_X, 0, z));
      s.poles.setMatrixAt(nA + i, m.makeRotationY(Math.PI).setPosition(-30, 0, z + 12));
    }
    s.w.add(s.poles);
    // conductors: ours is the gold wire (rig); two parallel ones, plus row B's
    const cond = [box(0.035, 0.035, 520, -1.5, 3.4, -100), box(0.035, 0.035, 520, 3.5, 3.4, -100)];
    for (const x of [-26.6, -28.6, -33.4]) cond.push(box(0.05, 0.05, 520, x, 3.4, -100));
    s.w.add(new THREE.Mesh(mergeSimple(cond), kit.flat({ color: PAL.teal })));
    // lamps: bulb, two-step light cone, pool on the road (instanced, switched by scale)
    s.bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 6), kit.flat({ color: PAL.white, fog: 0.4 }), nA);
    const cone = (r, h) => new THREE.ConeGeometry(r, h, 20, 1, true).translate(0, -h / 2, 0);
    s.coneO = new THREE.InstancedMesh(cone(4.4, 8.45), kit.flat({ color: PAL.petrol, opacity: 0.32, side: THREE.DoubleSide }), nA);
    s.coneI = new THREE.InstancedMesh(cone(2.5, 8.45), kit.flat({ color: PAL.teal, opacity: 0.3, side: THREE.DoubleSide }), nA);
    s.pools = new THREE.InstancedMesh(new THREE.CircleGeometry(4.4, 24).rotateX(-Math.PI / 2), kit.flat({ color: PAL.teal, opacity: 0.4 }), nA);
    s.bulbs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nA * 3), 3);
    for (const im of [s.bulbs, s.coneO, s.coneI, s.pools]) { im.frustumCulled = false; s.w.add(im); }
    // birds: 40 black silhouettes on the parallel conductors; they take off on "end"
    const bird = new THREE.Shape();
    [[-0.22, 0.02], [-0.1, 0.07], [0.06, 0.1], [0.12, 0.17], [0.19, 0.15], [0.21, 0.11], [0.14, 0.06], [0.1, -0.04], [-0.05, -0.06], [-0.16, -0.02]].forEach(([x, y], i) => (i ? bird.lineTo(x, y) : bird.moveTo(x, y)));
    const bg = extrude(bird, 0.08).rotateY(Math.PI / 2);
    s.birds = new THREE.InstancedMesh(bg, blackRim({ rimTh: 0.3 }), 40);
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.08, 0.36, 0.03, 0, 0, 0, -0.1, 0, 0, -0.1, 0.36, 0.03, 0, 0.3, 0.02, -0.14], 3));
    wg.computeVertexNormals();
    s.wings = new THREE.InstancedMesh(wg, kit.flat({ color: 0x020607, side: THREE.DoubleSide }), 80);
    s.birds.frustumCulled = false; s.wings.frustumCulled = false;
    s.w.add(s.birds, s.wings);
    const R = kit.rnd(303);
    s.bd = Array.from({ length: 40 }, (_, i) => {
      const x = i % 2 ? 3.5 : -1.5;
      return { p: [x, 3.52, -62 + R() * 40], v: [(x > 0 ? 1 : -1) * (0.4 + R() * 1.6), 2.6 + R() * 2.4, 5 + R() * 5], ph: R() * 6, yaw: R() < 0.5 ? 0 : Math.PI };
    });
    // the black car (1960s sedan with fins), facing the player, and the Engineer
    const car = new THREE.Shape();
    [[-3.1, 0.3], [-3.15, 0.55], [-3.3, 1.18], [-2.3, 0.98], [-1.5, 0.96], [-0.95, 1.42], [0.55, 1.44], [1.2, 0.98], [2.85, 0.9], [3.05, 0.62], [3.02, 0.3]]
      .forEach(([x, y], i) => (i ? car.lineTo(x, y) : car.moveTo(x, y)));
    const carG = mergeSimple([extrude(car, 2.0).rotateY(-Math.PI / 2), ...[[-0.95, 2.0], [0.95, 2.0], [-0.95, -2.0], [0.95, -2.0]].map(([x, z]) => new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12).rotateZ(Math.PI / 2).translate(x, 0.36, z))]);
    s.car = new THREE.Group(); s.car.position.set(CAR_X, RY, CAR_Z); s.w.add(s.car);
    s.carBody = new THREE.Mesh(carG, blackRim({ rimTh: 0.35 }));
    s.car.add(s.carBody);
    s.heads = new THREE.Mesh(mergeSimple([new THREE.CircleGeometry(0.17, 14).translate(-0.66, 0.63, 3.07), new THREE.CircleGeometry(0.17, 14).translate(0.66, 0.63, 3.07)]), kit.flat({ color: PAL.white, fog: 0.3 }));
    const hc = (r, h, x) => new THREE.ConeGeometry(r, h, 16, 1, true).translate(0, -h / 2, 0).rotateX(-Math.PI / 2 + 0.07).translate(x, 0.63, 3.07);
    s.beamO = new THREE.Mesh(mergeSimple([hc(2.6, 24, -0.66), hc(2.6, 24, 0.66)]), kit.flat({ color: PAL.teal, opacity: 0.22, side: THREE.DoubleSide }));
    s.beamI = new THREE.Mesh(mergeSimple([hc(1.2, 22, -0.66), hc(1.2, 22, 0.66)]), kit.flat({ color: PAL.cream, opacity: 0.16, side: THREE.DoubleSide }));
    s.car.add(s.heads, s.beamO, s.beamI);
    s.eng = engineer(kit, { rim: PAL.cyan, key: KEY });
    s.car.add(s.eng.group);
    // horizon: factory roofs (sawtooth) and two water towers, a ring all around (static, far)
    const hz = [], HR = kit.rnd(77);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + HR() * 0.05, r = 150 + HR() * 25, w = 14 + HR() * 22, h = 5 + HR() * 9;
      const g = [box(w, h, 10, 0, RY + h / 2, 0)];
      for (let k = 0; k < 3; k++) g.push(new THREE.CylinderGeometry(0.01, 2.4, 3, 3, 1).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(-w / 2 + (k + 0.5) * (w / 3), RY + h + 1.2, 0));
      if (HR() < 0.35) g.push(new THREE.CylinderGeometry(0.7, 0.9, h + 10, 6).translate(w * 0.3, RY + (h + 10) / 2, 0));
      const mg = mergeSimple(g).rotateY(-a).translate(Math.sin(a) * r, 0, -Math.cos(a) * r);
      hz.push(mg);
    }
    for (const [x, z] of [[-40, -165], [32, -158]]) {
      hz.push(new THREE.CylinderGeometry(6, 6, 7, 12).translate(x, RY + 21, z), new THREE.ConeGeometry(6.4, 3, 12).translate(x, RY + 26, z));
      for (const [lx, lz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) hz.push(box(0.6, 18, 0.6, x + lx, RY + 9, z + lz));
    }
    s.horizon = new THREE.Mesh(mergeSimple(hz), kit.flat({ color: PAL.black, fog: 0 }));
    kit.group.add(s.horizon);
    // moon rim (cream, from 20.33)
    s.moonRim = new THREE.Mesh(new THREE.RingGeometry(14.1, 15.0, 48), kit.flat({ color: PAL.cream, fog: 0 }));
    s.moonRim.position.set(0.33, 0.26, -0.91).normalize().multiplyScalar(200);
    s.moonRim.lookAt(0, 1.6, 0);
    kit.group.add(s.moonRim);
    // type
    s.blackT = kit.text('BLACK CAR', { cap: 1.1, color: 'gold', near: 17.44, out: 22.55, at: { d: 6, az: -30, y: 2.4 } });
    s.waitT = kit.text('WAITING', { cap: 0.75, color: 'cream', tracking: 0.12, near: 20.6, out: 22.55, at: { d: 6, az: -30, y: 1.5 } });
    s.armG = new THREE.Group(); kit.place(s.armG, { d: 7, az: 29, y: 2.35 }); kit.group.add(s.armG);
    s.armG.rotation.z = -0.07;
    s.endT = kit.text('WHERE THE\nSTREETLIGHTS END', { cap: 0.62, color: 'cream', near: 21.14, out: 22.55, parent: s.armG });
    s.endT.hideWord(3, 22.38);
    s.endT.mesh.material.depthTest = false; // poles pass between the player and the sign
    const span = Math.max(...s.endT.words.map((w) => w.x1)) - Math.min(...s.endT.words.map((w) => w.x0)) + 1.0;
    const by = Math.min(...s.endT.words.map((w) => w.y0)) - 0.12;
    s.arm = new THREE.Mesh(mergeSimple([box(span, 0.1, 0.1, 0, by - 0.2, -0.05), box(0.08, 0.22, 0.08, -span * 0.35, by - 0.04, -0.05), box(0.08, 0.22, 0.08, 0, by - 0.04, -0.05), box(0.08, 0.22, 0.08, span * 0.35, by - 0.04, -0.05)]), kit.flat({ color: PAL.black }));
    s.arm.visible = false;
    s.armG.add(s.arm);
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.w.position.z = d;
    const { m, p, q, s: sc } = s.x;
    // lamps
    const nA = KN - K0 + 1;
    for (let k = K0; k <= KN; k++) {
      const i = k - K0, on = ON[k] !== undefined && t >= ON[k] && !(OFF[k] !== undefined && t >= OFF[k]);
      const z = 40 - 25 * k, f = on ? 1 : 0;
      m.makeTranslation(-3.35, 0.42, z); s.bulbs.setMatrixAt(i, m);
      m.makeScale(f, f, f).setPosition(-3.35, 0.42, z); s.coneO.setMatrixAt(i, m); s.coneI.setMatrixAt(i, m);
      m.makeScale(f, f, f).setPosition(-3.35, RY + 0.02, z); s.pools.setMatrixAt(i, m);
      s.bulbs.setColorAt(i, s.x.c.setHex(on ? PAL.white : 0x0b1214));
    }
    for (const im of [s.bulbs, s.coneO, s.coneI, s.pools]) im.instanceMatrix.needsUpdate = true;
    s.bulbs.instanceColor.needsUpdate = true;
    // the car: silhouette on "Black", headlights on "car", flash on 18.31, cut 22.55
    s.car.visible = t >= 17.44;
    const hl = t >= 17.56 && t < 22.55;
    s.heads.visible = hl; s.beamO.visible = hl; s.beamI.visible = hl;
    s.heads.material.uniforms.uBright.value = 1 + 1.5 * (t >= 18.31 && t < 18.45 ? 1 : 0);
    s.beamI.material.uniforms.uOpacity.value = t >= 18.31 && t < 18.45 ? 0.4 : 0.16;
    // the Engineer steps out from behind the car on "waiting"
    const ek = kit.ease.out((t - 20.6) / 0.6);
    s.eng.group.visible = t >= 20.6;
    s.eng.group.position.set(-0.4 - 1.25 * ek, 0, -3.6 + 3.2 * ek);
    s.eng.group.rotation.y = 0.2;
    // birds: perched until "end", then all take off up and back past the player
    const fly = t >= 22.38, a = Math.max(0, t - 22.38);
    for (let i = 0; i < 40; i++) {
      const B = s.bd[i];
      p.set(B.p[0] + B.v[0] * a, B.p[1] + B.v[1] * a + 0.6 * a * a, B.p[2] + B.v[2] * a);
      q.setFromEuler(s.x.e.set(fly ? -0.35 : 0, fly ? Math.PI : B.yaw, 0));
      sc.set(1.3, 1.3, 1.3);
      m.compose(p, q, sc); s.birds.setMatrixAt(i, m);
      const flap = fly ? Math.sin(t * 24 + B.ph) * 0.9 : -1.2;
      for (let w = 0; w < 2; w++) {
        q.setFromEuler(s.x.e.set(fly ? -0.35 : 0, fly ? Math.PI : B.yaw, (w ? -1 : 1) * flap));
        sc.set(w ? -1.3 : 1.3, 1.3, 1.3);
        m.compose(p, q, sc); s.wings.setMatrixAt(i * 2 + w, m);
      }
    }
    s.birds.instanceMatrix.needsUpdate = true; s.wings.instanceMatrix.needsUpdate = true;
    s.moonRim.visible = t >= 20.33;
    s.arm.visible = t >= 21.14 && t < 22.55;
    if (kit.isOwner) {
      const R = kit.rigState;
      R.wheelSpin = d / 0.075;
      R.dark = 0.9 * sm(22.3, 22.6, t);
      R.lampOn = t >= 22.38 ? 0 : R.lampOn;
      if (t >= 17.56 && t < 17.7) R.gauge = 1;
    }
  },
  events() {
    return [
      { t: 16.0, sfx: 'switch', gain: 0.35 },
      { t: 17.56, sfx: 'key', gain: 0.4 },
      { t: 21.14, sfx: 'tick', gain: 0.3 },
      { t: 22.38, sfx: 'whoosh', gain: 0.55, haptic: [0.3, 60] },
      { t: 22.55, sfx: 'switch', gain: 0.4 },
    ];
  },
};
