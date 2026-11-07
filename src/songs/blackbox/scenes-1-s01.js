// S01 Black salt flat: the Two-Faced Mask (0.00 to 9.18, hot). Title on the first sung word.
// SHOT CARD
//   hero     the 40 m two-faced mask: rises over the black horizon on "Smile", turns on "lie"
//   supports 2 pairs of giant black T-pole silhouettes framing it; the sky as one crimson field
//   palette  black ground + crimson field + cream/gold mask (red glasses as the one accent)
//   motion   1.16 the sunburst ignites (the chorus hit) -> 3.40 it flattens into one crimson field and
//            the mask rises -> 6.02 the mask turns -> 8.04-9.18 the field dies in 4 steps (LIGHTS-OUT)
//   lyrics   one block at a time, centred on the black ground right under the mask (d 7, top 0.3 m
//            under the eyes): title / SMILE LIKE AN ANGEL / LIE LIKE A SPY / COUNT DOWN
//   removed  pole-lamp rows, transmission towers, halo beads, brows, wings, spark swarm, rings,
//            MISTYCONIFER credit + rule, the second text block on the other side
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { extrude, mirrorShape, mergeDiscs, scratch } from './scenes-1-util.js';

const RAY_ON = [1.19, 1.75, 2.32, 2.9], RAY_OFF = [8.04, 8.61, 8.9, 9.18];
const FACE_KEY = [0.2, 0.5, 0.84]; // the mask is lit from the player's side
export const BLOCK1 = { d: 7, az: 0, top: 0.95 }; // the lyric block
// the shared two-line layout of S01's COUNT DOWN and S02's blocks (S02 takes the same line over at 9.18)
export const COUNT_LAYOUT = { cap: 0.95, lineGap: 0.95, vAlign: 'top', at: { d: 6.5, az: 0, y: 0.85 } };
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

export const S01 = {
  id: 'S01', t0: 0, t1: 9.18, world: 'hot', pre: 0, post: 0,
  key: [0, 0.55, -0.83],
  fog: { color: PAL.velvet, near: 40, far: 220 },
  build(kit) {
    const s = { x: scratch() };
    s.prof = kit.travel([[1.6, 2.5, 1.6]]);
    s.w = new THREE.Group(); kit.group.add(s.w);
    // the salt flat: one black ground to the horizon
    const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 48).rotateX(-Math.PI / 2), kit.flat({ color: PAL.black, fog: 0 }));
    ground.position.y = -0.02;
    kit.group.add(ground);
    // two pairs of giant T-poles: pure black cut-outs against the field (no rim, no lamps)
    const poleG = mergeSimple([box(0.8, 22, 0.8, 0, 11, 0), box(9, 0.9, 0.9, 0, 20.5, 0), box(0.9, 1.6, 0.9, -3.6, 21.6, 0), box(0.9, 1.6, 0.9, 3.6, 21.6, 0)]);
    s.poles = new THREE.InstancedMesh(poleG, kit.toon({ ramp: 'black', rim: null }), 4);
    for (let i = 0; i < 4; i++) s.poles.setMatrixAt(i, s.x.m.makeTranslation(i % 2 ? 15 : -15, 0, 12 - (i >> 1) * 42));
    s.poles.frustumCulled = false;
    s.w.add(s.poles);

    // ---- THE TWO-FACED MASK (34 m disc, 2 m deep, scaled 1.25) ----
    const M = new THREE.Group();
    s.mask = M; s.maskSpin = new THREE.Group();
    M.add(s.maskSpin);
    kit.group.add(M);
    const S = s.maskSpin;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 2, 48, 1, true).rotateX(Math.PI / 2), kit.toon({ ramp: 'black', rim: null }));
    s.front = new THREE.Mesh(new THREE.CircleGeometry(16.4, 48), kit.toon({ ramp: 'cream', rim: null, key: FACE_KEY, fog: 0.3 }));
    s.front.position.z = 1.0;
    s.rimRing = new THREE.Mesh(new THREE.TorusGeometry(16.9, 1.1, 6, 64), kit.toon({ ramp: 'gold', rim: null, key: FACE_KEY, fog: 0.3 }));
    // closed eyes: two thick downward arcs; the smile: one crimson crescent
    const eyeGeo = new THREE.TorusGeometry(3.0, 0.75, 4, 18, Math.PI * 0.8).rotateZ(Math.PI + Math.PI * 0.1);
    s.eyeMat = kit.flat({ color: PAL.black });
    const eyes = new THREE.Mesh(mergeSimple([eyeGeo.clone().translate(-6, 3.6, 1.12), eyeGeo.clone().translate(6, 3.6, 1.12)]), s.eyeMat);
    const smileShape = new THREE.Shape();
    smileShape.absarc(0, 0, 8.6, Math.PI * 1.12, Math.PI * 1.88, false);
    smileShape.absarc(0, 2.2, 7.0, Math.PI * 1.86, Math.PI * 1.14, true);
    s.smile = new THREE.Mesh(new THREE.ShapeGeometry(smileShape, 20), kit.flat({ color: PAL.crimson }));
    s.smile.position.set(0, -0.8, 1.14);
    S.add(side, s.front, s.rimRing, eyes, s.smile);
    // back: the Engineer as a black head under her bob, two big round glasses (white, then red)
    const back = new THREE.Group();
    back.rotation.y = Math.PI;
    const bob = mirrorShape([[0, 17.4], [7.4, 15.9], [12.8, 11.8], [16.2, 5.5], [17.4, -1], [17.6, -11], [11.2, -8], [9.6, 2.4], [5.5, 7.2], [0, 8.6]]);
    const bface = new THREE.Mesh(new THREE.CircleGeometry(16.4, 48), kit.flat({ color: PAL.black }));
    bface.position.z = 1.0;
    const bobMesh = new THREE.Mesh(new THREE.ShapeGeometry(bob, 8), kit.flat({ color: PAL.black }));
    bobMesh.position.z = 1.04;
    s.glassMat = kit.flat({ color: PAL.white, fog: 0.15 });
    s.glasses = new THREE.Mesh(mergeDiscs([[-5.6, 0.4, 1.14, 3.3], [5.6, 0.4, 1.14, 3.3]], 28), s.glassMat);
    const frames = new THREE.Mesh(mergeDiscs([[-5.6, 0.4, 1.1, 4.0], [5.6, 0.4, 1.1, 4.0]], 28), kit.flat({ color: PAL.gold }));
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.1).translate(0, 1.0, 1.12), kit.flat({ color: PAL.gold }));
    back.add(bface, bobMesh, frames, s.glasses, bridge);
    S.add(back);
    // halo: one thick gold torus above, tilted so it reads as an ellipse
    s.halo = new THREE.Group();
    s.halo.position.y = 18.5; // a crown-like ellipse just over the head
    const haloTilt = new THREE.Group(); haloTilt.rotation.x = -1.2;
    s.haloMat = kit.toon({ ramp: 'gold', rim: null, key: FACE_KEY, fog: 0.3 });
    haloTilt.add(new THREE.Mesh(new THREE.TorusGeometry(10, 1.5, 6, 48), s.haloMat));
    s.halo.add(haloTilt);
    M.add(s.halo);

    // ---- type: one block at a time on the black ground under the mask ----
    const at = { d: BLOCK1.d, az: BLOCK1.az, y: BLOCK1.top };
    // depthTest off: the title is never cut by the room pieces while the lobby breaks away (0-1.15 s)
    s.title = kit.text('GOLD ON THE WIRE', { cap: 1.1, color: 'gold', vAlign: 'top', times: [0.26, 0.32, 0.38, 0.44], pop: true, dur: 0.18, out: 3.12, outDur: 0.25, depthTest: false, at });
    s.fire = kit.text('FIRE IN THE SKY', { cap: 0.8, color: 'cream', colors: { 3: 'gold' }, vAlign: 'top', times: [1.16, 1.74, 2.32, 2.58], out: 3.12, outDur: 0.25, depthTest: false, at: { ...at, y: BLOCK1.top - 1.6 } });
    s.smileT = kit.text('SMILE LIKE\nAN ANGEL', { cap: 1.0, lineGap: 0.95, color: 'cream', colors: { 3: 'gold' }, vAlign: 'top', near: 3.4, out: 5.82, outDur: 0.2, at });
    s.lieT = kit.text('LIE LIKE\nA SPY', { cap: 1.0, lineGap: 0.95, color: 'cream', colors: { 3: PAL.crimson }, vAlign: 'top', near: 6.02, out: 7.86, outDur: 0.2, at });
    s.count = kit.text('COUNT DOWN TO\nZERO', { ...COUNT_LAYOUT, color: 'gold', colors: { 3: 'cream' }, times: [8.06, 8.9, 9.3, 9.48], out: 9.18, outDur: 0.02 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t);
    s.w.position.z = d;
    const nOff = kit.FX.lightsOut(t, RAY_OFF);
    if (kit.isOwner) {
      // sky: dim until "fire"; 1.16 the sunburst ignites in 4 groups (the chorus hit); 3.40 it flattens
      // into one crimson field behind the mask; 8.04-9.18 the field dies group by group (the countdown)
      const amt = t < 1.16 ? 0.4 : 1;
      const flat = t >= 3.4;
      kit.setSky({ rot: t * 0.035, rings: 0, rayR: 3.2, rayB: flat ? PAL.crimson : PAL.carmineDeep, amt: t >= 9.17 ? 0 : amt });
      const U = kit.sky.uRays.value;
      for (let i = 0; i < 16; i++) { const g = i % 4; U[i] = t >= RAY_ON[g] && t < RAY_OFF[3 - g] ? 1 : 0; }
    }
    // the mask: rises on "Smile" (3.40-4.61), holds ~70 m ahead drifting in a little, turns on "lie"
    const M = s.mask;
    M.position.set(0, -44 + 66 * kit.ease.inOut((t - 3.4) / 1.21), -72 + d * 0.3);
    M.scale.setScalar(1.15);
    s.smile.scale.y = 0.25 + 0.75 * sm(3.47, 3.75, t);
    s.maskSpin.rotation.y = Math.PI * kit.ease.inOut((t - 6.02) / 0.58);
    // halo: dark brass until 4.61 ("angel" is coming), then gold with one bright kick
    s.haloMat.uniforms.uBright.value = (t >= 4.61 ? 1 + 0.6 * Math.exp(-(t - 4.61) * 4) : 0.18) * (t >= 9.12 ? 0 : 1 - nOff * 0.2);
    // her glasses: dark, white on "lie", red at 6.33, one flash on the 6.89 downbeat
    const gm = s.glassMat.uniforms;
    if (t < 6.02) gm.uColor.value.setHex(0x1a1010);
    else if (t < 6.33) gm.uColor.value.setHex(PAL.white);
    else gm.uColor.value.setHex(PAL.red);
    gm.uBright.value = 1 + 1.4 * Math.exp(-Math.max(0, t - 6.89) * 5) * (t >= 6.89 ? 1 : 0);
    // lights out: the mask's lit faces die with the field (only the red glasses stay)
    const dim = t >= 9.12 ? 0 : 1 - nOff * 0.2;
    s.smile.material.uniforms.uBright.value = dim;
    s.front.material.uniforms.uBright.value = dim;
    s.rimRing.material.uniforms.uBright.value = dim;
  },
  events() {
    return [
      { t: 3.4, sfx: 'motor', gain: 0.45 },
      { t: 6.02, sfx: 'whoosh', gain: 0.5, haptic: [0.25, 40] },
      { t: 8.04, sfx: 'switch', gain: 0.45 },
      { t: 9.18, sfx: 'switch', gain: 0.55, haptic: [0.3, 40] },
    ];
  },
};
