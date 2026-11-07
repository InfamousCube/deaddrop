// S09 The music-box ballroom (67.74 to 76.89, cold). Clean rework, two beats in one still room:
//  A 67.74-71.5  HERO a giant velvet glove (rust) comes down from above right, grips the crank and turns the steel drum
//                of a colossal music box. SUPPORT the drum itself (steel, a few big pins) and the petrol lid floor
//                inside black box walls. MOTION the crank turning (half a turn per bar). LYRIC low centre over the floor.
//  B 71.5-76.89  HERO seven black couples (gown, tailcoat, raised joined hands) on pegs in one ring around the player (a wide calm gap ahead), waltzing: a
//                hard half turn every third beat. ACCENT three orange laser beams snap on across the floor on "laser".
//                The glove lifts away at 76.34. Out: LIGHTS-OUT at 76.89 (the whole room goes at once).
import * as THREE from 'three';
import { PAL } from './style.js';
import { sm, merge, shapeOf, slab, beam } from './scenes-2-util.js';

const FY = -1.4; // lid floor (y)
const DX = -2, DZ = -14.5, DY = 2.6, DL = 16, DR = 3.4; // drum: centre x, axle z, axle y, length, radius
const CX = DX + DL / 2 + 1.7, CR = 2.8; // crank: x of the crank plane, crank radius
const CAZ = [46, -46, 92, -92, 138, -138, 180]; // couples: azimuths (deg), they frame the sides, the centre stays calm
const NC = CAZ.length, RING = 8, CS = 1.6;
const BEAT = 0.5715; // s
const LASER_T = [74.62, 74.68, 74.74];

export const S09 = {
  id: 'S09', t0: 67.74, t1: 76.89, world: 'cold', pre: 0, post: 0, // pre 0: the drum hung in S08's sky
  key: [0.2, 0.9, 0.35],
  fog: { color: PAL.black, near: 40, far: 140 },
  sky: { stars: 0, hor: PAL.black, hor2: PAL.black, zen: PAL.black },

  build(kit) {
    const s = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), sc: new THREE.Vector3(1, 1, 1), e: new THREE.Euler() };
    s.prof = kit.travel([[67.74, 0, 1.0]]); // the room stands still; the crank and the dancers move
    s.W = new THREE.Group(); s.W.name = 's09-world';
    kit.group.add(s.W);
    const black = kit.flat({ color: PAL.black });

    // ---- the box: petrol lid floor, black walls, one broad teal band under the drum ----
    s.W.add(new THREE.Mesh(new THREE.PlaneGeometry(66, 54).rotateX(-Math.PI / 2).translate(0, FY, -10), kit.flat({ color: PAL.petrol })));
    const band = new THREE.Mesh(new THREE.PlaneGeometry(66, 7).rotateX(-Math.PI / 2).translate(0, FY + 0.03, DZ), kit.flat({ color: PAL.petrolDeep }));
    band.material.polygonOffset = true; band.material.polygonOffsetFactor = -2; band.material.polygonOffsetUnits = -4;
    s.W.add(band);
    s.W.add(new THREE.Mesh(merge([
      new THREE.BoxGeometry(70, 9, 2).translate(0, FY + 4.5, -38),
      new THREE.BoxGeometry(70, 9, 2).translate(0, FY + 4.5, 18),
      new THREE.BoxGeometry(2, 9, 56).translate(-34, FY + 4.5, -10),
      new THREE.BoxGeometry(2, 9, 56).translate(34, FY + 4.5, -10),
    ]), black));

    // ---- the drum with a few big pins, its two bearing stands, and the crank ----
    const pins = [];
    for (let i = 0; i < 12; i++) {
      const x = -DL / 2 + 1.2 + (i / 11) * (DL - 2.4), a = i * 2.1;
      pins.push(new THREE.BoxGeometry(0.9, 0.9, 0.9).translate(0, DR + 0.3, 0).applyMatrix4(new THREE.Matrix4().makeRotationX(a)).translate(x, 0, 0));
    }
    s.drum = new THREE.Mesh(merge([new THREE.CylinderGeometry(DR, DR, DL, 14, 1).rotateZ(Math.PI / 2), ...pins]), kit.toon({ ramp: 'steel', rim: PAL.cyan, rimTh: 0.6 }));
    s.drum.position.set(DX, DY, DZ);
    s.W.add(s.drum);
    s.W.add(new THREE.Mesh(merge([
      new THREE.BoxGeometry(1.6, DY - FY + 0.6, 4.4).translate(DX - DL / 2 - 0.9, (DY + FY) / 2, DZ),
      new THREE.BoxGeometry(1.6, DY - FY + 0.6, 4.4).translate(DX + DL / 2 + 0.9, (DY + FY) / 2, DZ),
    ]), kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.6 })));
    s.crank = new THREE.Group();
    s.crank.position.set(CX, DY, DZ);
    s.crank.add(new THREE.Mesh(merge([
      new THREE.BoxGeometry(CX - DX - DL / 2, 0.6, 0.6).translate(-(CX - DX - DL / 2) / 2, 0, 0),
      new THREE.BoxGeometry(0.7, CR + 0.6, 0.7).translate(0, CR / 2, 0),
      new THREE.BoxGeometry(2.6, 0.55, 0.55).translate(0.9, CR, 0),
    ]), kit.toon({ ramp: 'steel', rim: null })));
    s.W.add(s.crank);

    // ---- the velvet glove (hangs from above, palm on the crank handle) ----
    const fingers = [-1.25, -0.42, 0.42, 1.25].flatMap((x) => [
      new THREE.BoxGeometry(0.8, 2.6, 0.9).translate(x, 0.4, 0.75),
      new THREE.BoxGeometry(0.8, 0.9, 1.7).translate(x, -0.9, 0.1),
    ]);
    const gloveG = merge([
      new THREE.BoxGeometry(3.6, 3.8, 1.7).translate(0, 3.0, 0),
      ...fingers,
      new THREE.BoxGeometry(0.95, 2.6, 0.95).applyMatrix4(new THREE.Matrix4().makeRotationZ(0.5)).translate(-2.3, 2.2, 0.3),
      new THREE.CylinderGeometry(2.25, 2.0, 3.6, 8, 1).translate(0, 6.6, 0),
      new THREE.CylinderGeometry(2.0, 2.0, 22, 8, 1).translate(0, 19, 0),
    ], true);
    s.glove = new THREE.Mesh(gloveG, kit.toon({ ramp: [PAL.black, PAL.rust, PAL.orange], rim: null }));
    s.glove.scale.setScalar(1.25);
    s.W.add(s.glove);

    // ---- seven couples on pegs in one ring around the player (flat black cut-outs, one instanced mesh) ----
    // a waltzing couple: flared gown, tailcoat with two legs, two heads leaning in, the joined hands raised to the left
    const gown = shapeOf([[-1.55, 0], [0.0, 0], [-0.42, 1.0], [-0.48, 1.6], [-0.98, 1.6], [-1.02, 1.0]]);
    const coat = shapeOf([[0.12, 0.85], [0.92, 0.85], [0.98, 1.78], [0.62, 1.86], [0.42, 1.86], [0.08, 1.74]]);
    const head = (x, y, r) => new THREE.CylinderGeometry(r, r, 0.3, 10).rotateX(Math.PI / 2).translate(x, y, 0);
    const coupleG = merge([
      slab(gown, 0.3), slab(coat, 0.3),
      new THREE.BoxGeometry(0.22, 0.95, 0.3).translate(0.3, 0.47, 0), new THREE.BoxGeometry(0.22, 0.95, 0.3).translate(0.74, 0.47, 0),
      head(-0.68, 1.84, 0.23), head(0.5, 2.1, 0.25),
      beam([-0.9, 1.5, 0], [-1.62, 2.12, 0], 0.3, 0.17), beam([0.15, 1.7, 0], [-1.55, 2.08, 0], 0.3, 0.17),
    ]).translate(0.3, 0, 0);
    s.couples = new THREE.InstancedMesh(coupleG, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.62 }), NC);
    s.couples.frustumCulled = false;
    s.ang = CAZ.map((a) => (a * Math.PI) / 180);
    kit.group.add(s.couples);
    s.pegs = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12).translate(0, FY + 0.1, 0), kit.flat({ color: PAL.teal }), NC);
    s.ang.forEach((a, k) => s.pegs.setMatrixAt(k, s.m.makeTranslation(Math.sin(a) * RING, 0, -Math.cos(a) * RING)));
    s.pegs.frustumCulled = false;
    kit.group.add(s.pegs);

    // ---- three orange laser beams across the floor (from the front-left corner) ----
    s.lasers = [[-33, -30, 33, -9], [-33, -30, 33, -15], [-33, -30, 33, -21]].map(([x0, z0, x1, z1]) => {
      const L = Math.hypot(x1 - x0, z1 - z0);
      const M = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, L), kit.flat({ color: PAL.orange, fog: 0.2 }));
      M.position.set((x0 + x1) / 2, -0.1, (z0 + z1) / 2);
      M.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      kit.group.add(M);
      return M;
    });

    // ---- lyric blocks: one at a time, upper left in the dark above the drum ----
    const at = { d: 4.5, az: 0, y: -0.5 }; // close and low: under the drum, both lines above the lid floor (y -1.4)
    s.l1 = kit.text('VELVET GLOVES\nON A STEEL MACHINE', { cap: 0.5, color: 'gold', colors: { 2: 'cream', 3: 'cream', 4: 'cream', 5: 'cream' }, times: [68.58, 68.68, 69.18, 69.86, 70.04, 70.38], out: 71.36, outDur: 0.1, depthTest: false, at });
    s.l2 = kit.text('WALTZING SLOW\nTHROUGH A LASER BEAM', { cap: 0.5, color: 'gold', colors: { 2: 'cream', 3: 'cream', 4: 'cream', 5: 'cream' }, times: [71.52, 73.46, 73.72, 74.32, 74.62, 75.44], out: 76.6, outDur: 0.12, depthTest: false, at });
    return s;
  },

  update(t, s, kit) {
    const d = s.prof.d(t);
    s.W.position.z = d;

    // the crank turns half a revolution per bar from the downbeat on "steel"; the drum follows
    const turn = t < 70.03 ? 0 : (t - 70.03) * (Math.PI / (4 * BEAT)) * (1 - 0.5 * sm(76.0, 76.6, t));
    s.crank.rotation.x = -turn; s.drum.rotation.x = -turn;
    // glove: down from above onto the handle, follows it, lifts away at 76.34
    const hy = DY + Math.cos(turn) * CR, hz = DZ - Math.sin(turn) * CR;
    const down = sm(68.58, 69.78, t), up = sm(76.34, 76.88, t);
    s.glove.visible = t > 68.5;
    s.glove.position.set(CX + 0.9, hy + 0.2 + 30 * (1 - down) + 30 * up, hz);
    s.glove.rotation.x = -0.25 * Math.sin(turn);

    // couples: pop up on their pegs at 70.61, then a hard half turn every third beat from "Waltzing"
    for (let k = 0; k < NC; k++) {
      const a = s.ang[k], x = Math.sin(a) * RING, z = -Math.cos(a) * RING;
      const pop = Math.max(0.01, sm(70.61 + k * 0.05, 70.85 + k * 0.05, t));
      let spin = 0;
      if (t >= 71.52) {
        const ph = (t - 71.52) / (3 * BEAT), n = Math.floor(ph), f = ph - n;
        spin = (n + sm(0, 0.18, f)) * Math.PI * (k % 2 ? 1 : -1);
      }
      s.e.set(0, Math.atan2(-x, -z) + spin, 0); s.q.setFromEuler(s.e);
      s.couples.setMatrixAt(k, s.m.compose(s.p.set(x, FY + 0.2, z), s.q, s.sc.set(CS, CS * pop, CS)));
    }
    s.couples.instanceMatrix.needsUpdate = true;
    s.couples.visible = t > 70.55;
    s.pegs.visible = t > 70.5;

    // lasers snap on, one by one, on "laser"
    s.lasers.forEach((L, i) => { L.visible = t >= LASER_T[i] && t < 76.89; });

    if (kit.isOwner) { kit.rigState.wire.on = 0; kit.rigState.wire.pulses = []; }
  },

  events() {
    return [
      { t: 68.58, sfx: 'motor', gain: 0.3 },
      { t: 70.03, sfx: 'key', gain: 0.4 },
      { t: 74.62, sfx: 'switch', gain: 0.5 },
      { t: 76.34, sfx: 'whoosh', gain: 0.35 },
    ];
  },
};
