// S06 The Circuit Board (36.20 to 47.50, cold). Clean rework: one clear shot per beat, IEYTD style.
//  A 36.2-40.5   HERO the Engineer's head and shoulders, a black 40 m silhouette with white round glasses, against a
//                big teal disc. SUPPORT a low black chip skyline on the petrol board, two broad teal traces per side.
//                MOTION the skyline breathes on "feel the city breathe" (player glides 2.5 m/s, then stops).
//                ACCENT on each "tick" the traces and the disc's ring flash cyan (no motion; the old floor ring raced out
//                at 110 m/s under the player). LYRIC upper left, in the dark sky.
//  B 40.5-42.76  HERO "ten floors under": the board splits along the axis (each half 4 m, at most 2.9 m/s), she sinks behind the horizon, the player
//                sinks at most 2 m/s into the slot and ten cyan floor lamps light top to bottom down the shaft wall.
//                LYRIC centred above the shaft.
//  C 42.76-44.86 The designed black beat: only her big glasses ahead (23 m wide, they blink on "breath") over a faint petrol
//                floor (the ground stays readable); HOLD YOUR / BREATH block under them.
//  D 44.86-47.48 A gold sun ignites at the vanishing point and grows over the same floor; HERE WE GO under it. Out: COLOR FLASH 47.48.
import * as THREE from 'three';
import { PAL } from './style.js';
import { sm, bump, merge, shapeOf } from './scenes-2-util.js';

const BY = -6; // board top (y)
const ZE = -58; // shaft wall (board coords): the split halves end here, the end block carries on
const SPLIT = 4; // each half slides this far out on "Ten" (over 2.08 s: the floor under the player opens at 2.9 m/s peak)
const HEAD = { x: 24, z: -105, cy: 29, S: 2.4, base: -42.6 }; // the Engineer (board coords): silhouette scale S, base hidden
// under the board so only head and shoulders rise over the skyline; head centre at base + cy * S
const LAMP_T = Array.from({ length: 10 }, (_, k) => 40.52 + k * 0.165); // one floor per lamp, -10 lights on "believe"
// sink (the world rises): velocity keys (t, v), never above 2 m/s, integrated exactly
const VK = [[40.52, 0], [41.3, 2], [42.9, 2], [43.8, 0]];
function sinkAt(t) {
  let s = 0;
  for (let i = 0; i < VK.length - 1; i++) {
    const [ta, va] = VK[i], [tb, vb] = VK[i + 1];
    if (t <= ta) break;
    const te = Math.min(t, tb), k = (te - ta) / (tb - ta);
    s += (va + (va + (vb - va) * k)) * 0.5 * (te - ta);
  }
  return s;
}
const tickK = (t, a) => (t >= a ? Math.exp(-(t - a) * 4) : 0); // tick flash: 1 on the tick, gone in about 0.8 s
const breathAt = (t) => (t >= 39.0 && t < 40.8 ? 0.5 - 0.5 * Math.cos(((t - 39.0) / 1.2) * Math.PI * 2) : 0);

// skyline blocks [x, z, w, d, h] (board coords), per board part
const BLOCKS = {
  L: [[-14, -30, 9, 10, 6], [-25, -45, 12, 9, 10], [-40, -24, 11, 14, 8], [-22, 24, 14, 10, 9]],
  R: [[13, -40, 9, 8, 6.5], [28, -22, 12, 12, 9], [44, -48, 14, 10, 12], [24, 20, 12, 12, 8]],
  E: [[-30, -84, 16, 12, 12], [-58, -70, 14, 14, 9], [52, -78, 14, 12, 9]],
};

export const S06 = {
  id: 'S06', t0: 36.2, t1: 47.5, world: 'cold', pre: 0, post: 0.035, // pre 0: her glasses sat on S05's last lyric
  key: [0.55, 0.45, -0.7],
  fog: { color: PAL.black, near: 40, far: 210 },
  sky: { stars: 0, hor: PAL.petrolDeep, hor2: PAL.black, band: [-0.03, 0.16, 0.5] },
  flashes: [{ t: 47.48, color: PAL.crimson, dur: 0.03 }, { t: 47.51, color: 0x000000, dur: 0.022 }],

  build(kit) {
    const s = { m: new THREE.Matrix4(), v: new THREE.Vector3(), cT: new THREE.Color(PAL.teal), cC: new THREE.Color(PAL.cyan), cP: new THREE.Color(PAL.petrol), cR: new THREE.Color() };
    s.prof = kit.travel([[36.2, 2.5, 1.0], [39.2, 0, 1.2]]);
    s.V = new THREE.Group(); s.V.name = 's06-world';
    kit.group.add(s.V);
    const body = kit.flat({ color: PAL.black });
    const top = kit.flat({ color: PAL.petrol });
    s.trace = kit.flat({ color: PAL.teal });
    s.trace.polygonOffset = true; s.trace.polygonOffsetFactor = -2; s.trace.polygonOffsetUnits = -4;
    const blockMat = kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null });
    const blockGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const blocks = (list, parent) => {
      const M = new THREE.InstancedMesh(blockGeo, blockMat, list.length);
      list.forEach(([x, z, w, d, h], i) => M.setMatrixAt(i, s.m.makeScale(w, h, d).setPosition(x, 0, z)));
      M.position.y = BY; M.frustumCulled = false;
      parent.add(M);
      return M;
    };
    const traces = (xs, z0, z1) => merge(xs.map(([x, w]) => new THREE.PlaneGeometry(w, z0 - z1).rotateX(-Math.PI / 2).translate(x, BY + 0.03, (z0 + z1) / 2)));

    // ---- two board halves (they split on "Ten") and the end block beyond the shaft wall ----
    s.halves = [];
    s.blockM = [];
    for (const side of [-1, 1]) {
      const H = new THREE.Group();
      const len = 40 - ZE, cz = (40 + ZE) / 2;
      const slabM = new THREE.Mesh(new THREE.BoxGeometry(100, 40, len), body);
      slabM.position.set(side * 50, BY - 20.02, cz);
      const topM = new THREE.Mesh(new THREE.PlaneGeometry(100, len).rotateX(-Math.PI / 2), top);
      topM.position.set(side * 50, BY, cz);
      const tr = new THREE.Mesh(traces([[side * 4.6, 2.2], [side * 14, 3.2]], 40, ZE), s.trace);
      H.add(slabM, topM, tr);
      s.blockM.push(blocks(side < 0 ? BLOCKS.L : BLOCKS.R, H));
      s.V.add(H);
      s.halves.push(H);
    }
    const endM = new THREE.Mesh(new THREE.BoxGeometry(240, 40, 220), body);
    endM.position.set(0, BY - 20.02, ZE - 110);
    const endTop = new THREE.Mesh(new THREE.PlaneGeometry(240, 220).rotateX(-Math.PI / 2), top);
    endTop.position.set(0, BY, ZE - 110);
    const endTr = new THREE.Mesh(traces([[-4.6, 2.2], [4.6, 2.2], [-14, 3.2], [14, 3.2]], ZE, ZE - 220), s.trace);
    s.V.add(endM, endTop, endTr);
    s.blockM.push(blocks(BLOCKS.E, s.V));
    // ten floor lamps down the shaft wall (one instanced mesh, colour per lamp)
    s.lamps = new THREE.InstancedMesh(new THREE.PlaneGeometry(7, 1.5), kit.flat({ color: PAL.white, fog: 0.4 }), 10);
    s.lamps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(30), 3);
    for (let k = 0; k < 10; k++) s.lamps.setMatrixAt(k, s.m.makeTranslation(0, BY - 3.2 - 3 * k, ZE + 0.06));
    s.lamps.frustumCulled = false;
    s.V.add(s.lamps);
    s.cOff = new THREE.Color(PAL.petrol); s.cOn = new THREE.Color(PAL.cyan);

    // ---- the Engineer: one flat black silhouette, white round glasses ----
    const torso = shapeOf([[-20, 0], [20, 0], [17, 13], [8, 18.5], [-8, 18.5], [-17, 13]]);
    const hair = shapeOf([[-8.6, 21.5], [8.6, 21.5], [9.4, 29], [7.6, 34.6], [3.8, 37.2], [-3.8, 37.2], [-7.6, 34.6], [-9.4, 29]]);
    const ext = (sh) => new THREE.ExtrudeGeometry(sh, { depth: 2, bevelEnabled: false, curveSegments: 4 });
    const silGeo = merge([ext(torso), ext(hair), new THREE.BoxGeometry(5, 5, 2).translate(0, 20, 1)]);
    const glassGeo = merge([new THREE.CircleGeometry(2.4, 20).translate(-3.4, 0, 0), new THREE.CircleGeometry(2.4, 20).translate(3.4, 0, 0), new THREE.PlaneGeometry(1.6, 0.45)]);
    s.head = new THREE.Group();
    s.head.add(new THREE.Mesh(silGeo, kit.flat({ color: PAL.black })));
    const gl = new THREE.Mesh(glassGeo, kit.flat({ color: PAL.white, fog: 0.15 }));
    gl.position.set(0, HEAD.cy - 1.5, 2.1);
    s.head.add(gl);
    s.head.position.set(HEAD.x, HEAD.base, HEAD.z);
    s.head.scale.setScalar(HEAD.S);
    s.head.rotation.y = Math.atan2(-HEAD.x, -HEAD.z) * 0.6; // turned a little toward the player
    s.V.add(s.head);

    // ---- the black beat's ground: a faint petrol floor (fogged to black far out), rising with the sink ----
    s.low = new THREE.Mesh(new THREE.CircleGeometry(170, 40).rotateX(-Math.PI / 2), kit.flat({ color: PAL.petrolDeep }));
    s.low.frustumCulled = false;
    kit.group.add(s.low);

    // ---- player-fixed pieces: the lyric blocks and the hold glasses ----
    s.tick = kit.text('TICK, TICK,', { cap: 0.95, color: 'cream', times: [36.34, 38.74], out: 38.96, outDur: 0.04, at: { d: 7, az: -31, y: 2.85 } });
    s.feel = kit.text('FEEL THE CITY\nBREATHE', { cap: 0.78, color: 'gold', times: [39.0, 39.18, 39.34, 39.62], out: 40.42, outDur: 0.08, at: { d: 7, az: -31, y: 2.95 } });
    s.ten = kit.text('TEN FLOORS UNDER\nWHAT YOU BELIEVE', { cap: 0.72, color: 'gold', colors: { 3: 'cream', 4: 'cream', 5: 'cream' }, times: [40.52, 40.9, 41.22, 41.56, 41.82, 42.02], out: 42.72, outDur: 0.04, at: { d: 7, az: -31, y: 2.9 } });
    s.hold = kit.text('HOLD YOUR\nBREATH', { cap: 0.85, color: 'cream', vAlign: 'top', times: [42.76, 43.08, 43.56], out: 44.72, outDur: 0.12, at: { d: 6, az: 0, y: 0.55 } });
    s.here = kit.text('HERE WE', { cap: 0.8, color: 'gold', times: [44.86, 45.3], out: 47.4, outDur: 0.06, at: { d: 6, az: -13, y: 0.1 } });
    s.go = kit.text('GO', { cap: 1.5, color: 'gold', times: [45.78], pop: true, dur: 0.2, out: 47.4, outDur: 0.06, at: { d: 6, az: 11, y: 0.45 } });
    s.holdG = new THREE.Mesh(glassGeo.clone().scale(2.0, 2.0, 1), kit.flat({ color: PAL.white, fog: 0 }));
    s.holdG.position.set(0, 4.6, -30);
    kit.group.add(s.holdG);
    return s;
  },

  update(t, s, kit) {
    const d = s.prof.d(t);
    const sink = sinkAt(t);
    const live = t < 47.5;
    s.V.visible = live && t < 42.76;
    s.V.position.set(0, sink, d);
    const off = SPLIT * sm(40.52, 42.6, t);
    s.halves[0].position.x = -off; s.halves[1].position.x = off;

    // breathing skyline and traces
    const br = breathAt(t);
    for (const M of s.blockM) M.scale.y = 1 + 0.3 * br;
    const tk = Math.max(tickK(t, 36.34), tickK(t, 38.74));
    s.trace.uniforms.uColor.value.copy(s.cT).lerp(s.cC, Math.max(0.45 * br, tk));

    // the black beat's floor: from the cut on "hold", 5-7 m below the eyes, still rising with the last of the sink
    s.low.visible = live && t >= 42.76;
    s.low.position.y = -9 + sink;

    // she sinks behind the horizon as the board splits
    const duck = sm(40.52, 41.25, t);
    s.head.position.y = HEAD.base - 64 * duck;

    // the floor lamps light top to bottom
    const a = s.lamps.instanceColor.array;
    for (let k = 0; k < 10; k++) {
      const on = t >= LAMP_T[k] ? 1 : 0;
      const c = on ? s.cOn : s.cOff;
      a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b;
    }
    s.lamps.instanceColor.needsUpdate = true;
    s.lamps.visible = t > 40.4;

    // hold: only the glasses (blink on "breath", close on "here")
    s.holdG.visible = live && t >= 42.76 && t < 44.95;
    if (s.holdG.visible) s.holdG.scale.set(1, Math.max(0.04, 1 - bump(t, 43.56, 43.62, 43.7, 43.8) - sm(44.86, 44.95, t)), 1);

    if (kit.isOwner) {
      kit.rigState.wire.on = 0; kit.rigState.wire.pulses = [];
      if (t < 42.76) {
        // the teal disc stands behind her head and sets with her
        const hx = HEAD.x, hy = HEAD.base + HEAD.cy * HEAD.S + sink - 64 * duck - 1.6, hz = HEAD.z + d;
        kit.setSky({ sunR: 0.25 * (1 - duck), sunCol: PAL.teal, sunRing: s.cR.copy(s.cP).lerp(s.cC, tk).getHex(), focal: [hx, hy, hz], hor: PAL.petrolDeep, hor2: PAL.black, band: [-0.03 - sink * 0.004, 0.16, 0.5] });
      } else {
        const g = sm(44.86, 46.6, t); // the sun is a readable disc by "go" (45.78)
        kit.setSky({ hor: PAL.black, hor2: PAL.black, zen: PAL.black, sunR: t >= 44.86 ? 0.03 + 0.15 * g : 0, sunCol: PAL.gold, sunRing: PAL.brass, focal: [0, Math.sin(0.3), -Math.cos(0.3)] });
      }
    }
  },

  events() {
    return [
      { t: 36.34, sfx: 'tick', gain: 0.55 },
      { t: 38.74, sfx: 'tick', gain: 0.55 },
      { t: 40.52, sfx: 'drop', gain: 0.5, haptic: [0.3, 120] },
      { t: 42.76, sfx: 'switch', gain: 0.6 },
      { t: 44.86, sfx: 'ping', gain: 0.4 },
      { t: 45.78, sfx: 'grab', gain: 0.55, haptic: [0.5, 80] },
    ];
  },
};
