// S06 The Circuit Board (36.20 to 47.50, cold). The player is bug-sized on her printed circuit board:
// chips and capacitors stand like a skyline, a quartz crystal ticks out cyan rings, a 60 m engineer
// solders overhead. On "Ten" the board splits and the cradle falls through ten circuit layers; on
// "Hold" everything goes black but the wire and her glasses; "here we go" is a spark that runs
// down the wire into the trolley. Out: COLOR FLASH (crimson, then one black frame) at 47.48.
import * as THREE from 'three';
import { PAL, COMFORT } from './style.js';
import { D2R, sm, env, bump, hash, bendText, paint, merge, rod, stripGeo, walk45, shapeOf } from './scenes-2-util.js';

const BY = -8; // board top surface (y)
const SPLIT = 22; // how far each half slides apart (m)
const CRY = { x: -5.8, z: -14 }; // quartz crystal can (board coords)
const CAPT = { x: 5.4, z: -17, r: 4, h: 27 }; // the capacitor that carries "FEEL THE CITY BREATHE"
const STACK_Z = -10.8; // layer stack centre (board coords): the player falls through its holes

// vertical motion: velocity keys (t, v) piecewise linear, integrated exactly. The world rises = the
// cradle sinks into the skyline, then falls ten floors (layer k passes the eye at rise 9.6 + LS*k).
// Comfort: the fall is capped at VMAX (10 m/s, 7 with the comfort flag) and eased in over 1.5 s.
// The layers keep 3 m spacing, so they pass the eye at most ~3 times a second: about six of the
// ten floors go by before the hold at 42.76, the rest wait below in the shaft.
const VMAX = COMFORT ? 7 : 10;
const LS = 3; // layer spacing (m)
const VK = [[36.2, 0], [37.6, 1.0], [39.5, 1.0], [41.0, VMAX], [42.76, VMAX], [44.3, 0]];
function riseAt(t) {
  let s = 0;
  for (let i = 0; i < VK.length - 1; i++) {
    const [ta, va] = VK[i], [tb, vb] = VK[i + 1];
    if (t <= ta) break;
    const te = Math.min(t, tb), k = (te - ta) / (tb - ta);
    s += (va + (va + (vb - va) * k)) * 0.5 * (te - ta);
  }
  return s;
}
const breathAt = (t) => (t >= 39.0 && t < 42.6 ? 0.5 - 0.5 * Math.cos(((t - 39.0) / 1.2) * Math.PI * 2) : 0);

function star(points, r0, r1) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) { const a = (i / (points * 2)) * Math.PI * 2, r = i % 2 ? r1 : r0; pts.push([Math.sin(a) * r, Math.cos(a) * r]); }
  return new THREE.ShapeGeometry(shapeOf(pts));
}

export const S06 = {
  id: 'S06', t0: 36.2, t1: 47.5, world: 'cold', pre: 0.4, post: 0.035,
  key: [0.55, 0.35, -0.75],
  fog: { color: 0x000000, near: 30, far: 190 },
  sky: { stars: 0.55 },
  flashes: [{ t: 47.48, color: PAL.crimson, dur: 0.03 }, { t: 47.51, color: 0x000000, dur: 0.022 }],

  build(kit) {
    const s = { dummy: new THREE.Object3D(), c: new THREE.Color(), cA: new THREE.Color(PAL.teal), cB: new THREE.Color(PAL.cyan), cL: new THREE.Color(PAL.cyan) };
    const R = kit.rnd(606);
    s.prof = kit.travel([[36.2, 2.2, 1.0], [38.6, 3.0, 1.2], [41.6, 0, 1.1], [45.8, 14, 1.5]]);
    const D = s.dummy;
    s.V = new THREE.Group(); s.V.name = 's06-world';
    kit.group.add(s.V);

    const M = {
      board: kit.toon({ ramp: 'cold', rim: null }),
      trace: kit.flat({ color: PAL.teal, side: THREE.DoubleSide }),
      chip: kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.55 }),
      pin: kit.toon({ ramp: 'cream', rim: null }),
      cap: kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.5 }),
      ring: kit.flat({ color: PAL.cyan, side: THREE.DoubleSide }),
      res: kit.toon({ ramp: 'cream', vertexColors: true, rim: null }),
      bond: kit.flat({ color: PAL.gold }),
    };
    M.trace.polygonOffset = true; M.trace.polygonOffsetFactor = -2; M.trace.polygonOffsetUnits = -6;
    s.M = M;

    const chipGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const pinGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const capGeo = new THREE.CylinderGeometry(CAPT.r, CAPT.r, 1, 12, 1).translate(0, 0.5, 0);
    const ringGeo = new THREE.CylinderGeometry(CAPT.r + 0.1, CAPT.r + 0.1, 1, 12, 1, true).translate(0, 0.5, 0);
    // resistor: lying body + three colour bands + two cream leads (vertex colours on the cream ramp)
    const resGeo = merge([
      paint(new THREE.CylinderGeometry(0.75, 0.75, 3.6, 8).rotateZ(Math.PI / 2).translate(0, 1.0, 0), 0x3f8fa6),
      paint(new THREE.CylinderGeometry(0.8, 0.8, 0.34, 8).rotateZ(Math.PI / 2).translate(-0.9, 1.0, 0), 0x9c2219),
      paint(new THREE.CylinderGeometry(0.8, 0.8, 0.34, 8).rotateZ(Math.PI / 2).translate(-0.25, 1.0, 0), 0xffffff),
      paint(new THREE.CylinderGeometry(0.8, 0.8, 0.34, 8).rotateZ(Math.PI / 2).translate(0.9, 1.0, 0), 0xffd040),
      paint(new THREE.BoxGeometry(0.9, 0.16, 0.16).translate(-2.2, 1.0, 0), 0xffffff),
      paint(new THREE.BoxGeometry(0.9, 0.16, 0.16).translate(2.2, 1.0, 0), 0xffffff),
      paint(new THREE.BoxGeometry(0.16, 1.0, 0.16).translate(-2.6, 0.5, 0), 0xffffff),
      paint(new THREE.BoxGeometry(0.16, 1.0, 0.16).translate(2.6, 0.5, 0), 0xffffff),
    ]);

    // ---- two board halves (they split on "Ten") ----
    s.halves = [];
    s.chips = []; s.caps = []; s.pins = []; s.rings = [];
    const placed = [{ x: CRY.x, z: CRY.z, hx: 3.2, hz: 2 }, { x: CAPT.x, z: CAPT.z, hx: 4.5, hz: 4.5 }];
    const free = (x, z, hx, hz) => placed.every((p) => Math.abs(p.x - x) > p.hx + hx + 2.5 || Math.abs(p.z - z) > p.hz + hz + 2.5);
    for (const side of [-1, 1]) {
      const H = new THREE.Group(); H.name = 's06-half' + side;
      s.V.add(H);
      s.halves.push(H);
      const slabM = new THREE.Mesh(new THREE.BoxGeometry(150, 1.2, 300), M.board);
      slabM.position.set(side * 75, BY - 0.6, -60);
      H.add(slabM);
      // traces (pre-generated 45 degree polylines, one merged mesh)
      const polys = [];
      for (let i = 0; i < 70; i++) {
        const x0 = side * (1.2 + Math.pow(R(), 1.4) * 140), z0 = -205 + R() * 290;
        const pts = walk45(R, x0, z0, 2 + Math.floor(R() * 5), 5, 28, (x, z) => x * side > 0.8 && Math.abs(x) < 149 && z > -210 && z < 88);
        if (pts.length > 1) polys.push({ pts, w: 0.9 + R() * 1.1, pad: R() < 0.6 ? 1.9 : 0 });
      }
      const tr = new THREE.Mesh(stripGeo(polys, BY + 0.05), M.trace);
      H.add(tr);
      // chips (black IC packages) with cream pin rows
      const chips = [];
      for (let tries = 0; chips.length < 20 && tries < 400; tries++) {
        const long = 10 + R() * 20, wide = 5 + R() * 4, alongZ = R() < 0.55;
        const hx = (alongZ ? wide : long) / 2, hz = (alongZ ? long : wide) / 2;
        const x = side * (5 + hx + Math.pow(R(), 1.2) * 110), z = -190 + R() * 255;
        if (!free(x, z, hx, hz)) continue;
        placed.push({ x, z, hx, hz });
        chips.push({ x, z, sx: hx * 2, sz: hz * 2, h: 4 + R() * 4, alongZ, long });
      }
      const chipM = new THREE.InstancedMesh(chipGeo, M.chip, chips.length);
      chipM.position.y = BY; chipM.frustumCulled = false;
      H.add(chipM);
      const pinList = [];
      for (const c of chips) {
        const n = Math.floor((c.long - 1.2) / 1.5);
        for (let k = 0; k < n; k++) {
          const u = -c.long / 2 + 1.0 + k * 1.5;
          for (const sd of [-1, 1]) {
            if (c.alongZ) pinList.push({ x: c.x + sd * (c.sx / 2 + 0.45), z: c.z + u, sx: 0.9, sz: 0.55 });
            else pinList.push({ x: c.x + u, z: c.z + sd * (c.sz / 2 + 0.45), sx: 0.55, sz: 0.9 });
          }
        }
      }
      const pinM = new THREE.InstancedMesh(pinGeo, M.pin, pinList.length);
      pinM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(pinList.length * 3).fill(1), 3);
      pinM.position.y = BY; pinM.frustumCulled = false;
      pinList.forEach((p, i) => { D.position.set(p.x, 0, p.z); D.rotation.set(0, 0, 0); D.scale.set(p.sx, 1.15, p.sz); D.updateMatrix(); pinM.setMatrixAt(i, D.matrix); });
      pinM.userData.dist = Float32Array.from(pinList, (p) => Math.hypot(p.x - CRY.x, p.z - CRY.z));
      H.add(pinM);
      // capacitor towers (black, cyan top band), some behind the player
      const caps = [];
      for (let tries = 0; caps.length < 10 && tries < 400; tries++) {
        const behind = caps.length < 3;
        const x = side * (10 + Math.pow(R(), 1.3) * 100), z = behind ? 6 + R() * 70 : -200 + R() * 200;
        if (!free(x, z, 4.4, 4.4)) continue;
        placed.push({ x, z, hx: 4.4, hz: 4.4 });
        caps.push({ x, z, h: 20 + R() * 15 });
      }
      const capM = new THREE.InstancedMesh(capGeo, M.cap, caps.length);
      const ringM = new THREE.InstancedMesh(ringGeo, M.ring, caps.length);
      capM.position.y = BY; ringM.position.y = BY; capM.frustumCulled = false; ringM.frustumCulled = false;
      H.add(capM, ringM);
      // resistor rows
      const res = [];
      for (let r = 0; r < 3; r++) {
        const x0 = side * (16 + R() * 50), z0 = -150 + R() * 170;
        for (let k = 0; k < 7; k++) res.push([x0, z0 + k * 4.6]);
      }
      const resM = new THREE.InstancedMesh(resGeo, M.res, res.length);
      resM.position.y = BY; resM.frustumCulled = false;
      res.forEach(([x, z], i) => { D.position.set(x, 0, z); D.rotation.set(0, 0, 0); D.scale.set(1, 1, 1); D.updateMatrix(); resM.setMatrixAt(i, D.matrix); });
      H.add(resM);
      // gold bond wires (loops from the wire axis out to the pads)
      const bonds = [];
      for (let i = 0; i < 9; i++) {
        const z = -120 + R() * 150, x0 = side * (1.6 + R() * 2.2), x1 = side * (6.5 + R() * 6), z1 = z + (R() - 0.5) * 8, hy = 2.5 + R() * 3;
        const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x0, 0.05, z), new THREE.Vector3((x0 + x1) / 2, hy, (z + z1) / 2), new THREE.Vector3(x1, 0.05, z1));
        bonds.push(new THREE.TubeGeometry(cv, 10, 0.07, 4));
      }
      const bondM = new THREE.Mesh(merge(bonds), M.bond);
      bondM.position.y = BY;
      H.add(bondM);
      s.chips.push({ M: chipM, list: chips, delay: chips.map((c) => Math.hypot(c.x, c.z) / 150) });
      s.caps.push({ M: capM, R: ringM, list: caps, delay: caps.map((c) => Math.hypot(c.x, c.z) / 150) });
      s.pins.push(pinM);
    }
    // the crystal can (cream, rounded ends) carries TICK, TICK
    const cs = new THREE.Shape();
    cs.absarc(-1.4, 0, 1.2, Math.PI / 2, Math.PI * 1.5, false); cs.absarc(1.4, 0, 1.2, -Math.PI / 2, Math.PI / 2, false); cs.closePath();
    const cg = new THREE.ExtrudeGeometry(cs, { depth: 12, bevelEnabled: false, curveSegments: 5 }).rotateX(-Math.PI / 2);
    s.crystal = new THREE.Mesh(cg, kit.toon({ ramp: 'cream', rim: PAL.cyan }));
    s.crystal.position.set(CRY.x, BY, CRY.z);
    s.halves[0].add(s.crystal);
    s.tick1 = kit.text('TICK,', { cap: 1.5, color: 'cream', times: [36.34], parent: s.crystal, out: 40.6 });
    s.tick1.mesh.position.set(0, 9.7, 1.3);
    s.tick2 = kit.text('TICK,', { cap: 1.5, color: 'cream', times: [38.74], parent: s.crystal, out: 40.6 });
    s.tick2.mesh.position.set(0, 7.75, 1.3);
    // the text capacitor ahead-right
    s.capT = new THREE.Mesh(capGeo, M.cap);
    s.capT.scale.y = CAPT.h;
    s.capT.position.set(CAPT.x, BY, CAPT.z);
    s.capTring = new THREE.Mesh(ringGeo, M.ring);
    s.capTring.position.set(CAPT.x, BY + CAPT.h - 1.4, CAPT.z);
    s.halves[1].add(s.capT, s.capTring);
    s.capTG = new THREE.Group(); // text holder (not scaled with the tower)
    s.capTG.position.set(CAPT.x, BY, CAPT.z);
    s.halves[1].add(s.capTG);
    const d39 = s.prof.d(39.6);
    const th = Math.atan2(0 - CAPT.x, -d39 - CAPT.z);
    s.feel = kit.text('FEEL THE\nCITY\nBREATHE', { cap: 0.82, color: 'gold', near: 39.0, say: 'feel the city breathe', parent: s.capTG, out: 40.75 });
    bendText(s.feel, CAPT.r + 0.08);
    s.feel.mesh.position.set(Math.sin(th) * (CAPT.r + 0.08), 5.7, Math.cos(th) * (CAPT.r + 0.08));
    s.feel.mesh.rotation.set(0, th, 0);

    // the cyan "tick" ring racing across the board from the crystal
    s.ring = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 96, 1), kit.flat({ color: PAL.cyan, side: THREE.DoubleSide, fog: 0.6 }));
    s.ring.rotation.x = -Math.PI / 2;
    s.ring.position.set(CRY.x, BY + 0.14, CRY.z);
    s.V.add(s.ring);

    // ---- the Engineer, 60 m tall: forearm + soldering iron overhead right, glasses 50 m up ----
    const E = [52, 62, -86], W = [24, 14, -62], TIP = [17, BY + 4.6, -55];
    const armGeo = merge([
      rod(E, W, 3.0, 2.3, 7),
      new THREE.BoxGeometry(6, 4.2, 6.5).translate(W[0] - 1.5, W[1] - 1.4, W[2] + 0.5),
      rod([W[0] - 2, W[1] - 2, W[2] + 1], [W[0] - 2 + (TIP[0] - W[0]) * 0.55, W[1] + (TIP[1] - W[1]) * 0.55, W[2] + (TIP[2] - W[2]) * 0.55], 0.7, 0.55, 8),
    ], true);
    s.arm = new THREE.Group();
    const armM = new THREE.Mesh(armGeo, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.45 }));
    const shaftA = [W[0] - 2 + (TIP[0] - W[0]) * 0.55, W[1] + (TIP[1] - W[1]) * 0.55, W[2] + (TIP[2] - W[2]) * 0.55];
    const shaft = new THREE.Mesh(rod(shaftA, [TIP[0] + 0.35, TIP[1] + 1.2, TIP[2] - 0.35], 0.28, 0.22, 6), kit.toon({ ramp: 'steel', rim: PAL.cyan }));
    const tip = new THREE.Mesh(rod([TIP[0] + 0.35, TIP[1] + 1.2, TIP[2] - 0.35], TIP, 0.22, 0.02, 6), kit.flat({ color: PAL.cream, fog: 0.3 }));
    s.arm.add(armM, shaft, tip);
    s.V.add(s.arm);
    s.tip = TIP;
    // touchdown spark star + strokes
    s.star = new THREE.Mesh(star(8, 1.0, 0.25), kit.flat({ color: PAL.white, fog: 0.2, side: THREE.DoubleSide }));
    s.star.position.set(TIP[0] + 2.2, BY + 0.6, TIP[2]);
    s.V.add(s.star);
    s.sparks = kit.particles({
      n: 46, shape: 'stroke', size: 0.9, fog: 0.3, seed: 61,
      init: (i, r) => { const a = r() * Math.PI * 2, sp = 7 + r() * 12; return { p: [0, 0, 0], v: [Math.cos(a) * sp, 4 + r() * 10, Math.sin(a) * sp], g: [0, -20, 0], t0: 38.3, life: 0.5 + r() * 0.4, s: 0.6 + r() * 0.8, c: r() < 0.5 ? PAL.white : PAL.cream }; },
    });
    s.sparks.position.set(TIP[0] + 2.2, BY + 0.3, TIP[2]);
    s.V.add(s.sparks);
    // head: black silhouette with a bob, round white glasses, 50 m up ahead-right
    s.head = new THREE.Group();
    s.head.position.set(40, 50, -100);
    const headM = new THREE.Mesh(merge([new THREE.IcosahedronGeometry(6, 0), new THREE.BoxGeometry(13.5, 7.5, 12).translate(0, 1.6, -0.8), new THREE.BoxGeometry(4.5, 7, 4.5).translate(0, -7, -1)], true), kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.4 }));
    const glassGeo = merge([new THREE.CircleGeometry(1.7, 18).translate(-2.4, 0.4, 6.3), new THREE.CircleGeometry(1.7, 18).translate(2.4, 0.4, 6.3), new THREE.PlaneGeometry(1.4, 0.3).translate(0, 0.6, 6.3)]);
    s.glasses = new THREE.Mesh(glassGeo, kit.flat({ color: PAL.white, fog: 0.15 }));
    s.head.add(headM, s.glasses);
    s.head.lookAt(0, 1.6, 12);
    s.V.add(s.head);

    // ---- the ten-layer stack under the board (frames with a 13 m hole on the wire axis) ----
    s.stack = new THREE.Group();
    s.stack.position.z = STACK_Z;
    s.V.add(s.stack);
    const O = 30, Hh = 6.5, TH = Math.min(0.5, LS * 0.3);
    const frameGeo = merge([
      new THREE.BoxGeometry(O - Hh, TH, 2 * O).translate(-(O + Hh) / 2, -TH / 2, 0),
      new THREE.BoxGeometry(O - Hh, TH, 2 * O).translate((O + Hh) / 2, -TH / 2, 0),
      new THREE.BoxGeometry(2 * Hh, TH, O - Hh).translate(0, -TH / 2, -(O + Hh) / 2),
      new THREE.BoxGeometry(2 * Hh, TH, O - Hh).translate(0, -TH / 2, (O + Hh) / 2),
    ]);
    // no rim: seen almost edge-on while falling, a rim lit every slab into a full-width cyan band
    s.frames = new THREE.InstancedMesh(frameGeo, kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null }), 10);
    s.frames.frustumCulled = false;
    const LP = [];
    for (let k = 1; k <= 10; k++) {
      D.position.set(0, BY - LS * k, 0); D.rotation.set(0, 0, 0); D.scale.set(1, 1, 1); D.updateMatrix(); s.frames.setMatrixAt(k - 1, D.matrix);
      const y = BY - LS * k + 0.04;
      const sq = (h) => { LP.push(-h, y, -h, h, y, -h, h, y, -h, h, y, h, h, y, h, -h, y, h, -h, y, h, -h, y, -h); };
      sq(Hh + 0.15); sq(O - 0.2);
      const rk = kit.rnd(900 + k * 17);
      for (let i = 0; i < 16; i++) {
        let x0 = (rk() - 0.5) * 2 * (O - 2), z0 = (rk() - 0.5) * 2 * (O - 2);
        if (Math.abs(x0) < Hh + 1.5 && Math.abs(z0) < Hh + 1.5) x0 = Math.sign(x0 || 1) * (Hh + 3);
        const pts = walk45(rk, x0, z0, 2 + Math.floor(rk() * 4), 3, 14, (x, z) => Math.abs(x) < O - 1 && Math.abs(z) < O - 1 && (Math.abs(x) > Hh + 1 || Math.abs(z) > Hh + 1));
        for (let j = 0; j < pts.length - 1; j++) LP.push(pts[j][0], y, pts[j][1], pts[j + 1][0], y, pts[j + 1][1]);
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3));
    s.layerLines = new THREE.LineSegments(lg, kit.flat({ color: PAL.cyan, fog: 0.5 }));
    s.layerLines.frustumCulled = false;
    s.stack.add(s.frames, s.layerLines);
    s.labels = [];
    for (let k = 1; k <= 10; k++) {
      const L = kit.text('-' + k, { cap: Math.min(0.95, LS * 0.5), color: 'cream', parent: s.stack });
      L.mesh.position.set(-Hh + 0.5, BY - LS * k + 0.62, -5.2); L.mesh.rotation.y = Math.atan2(Hh - 0.5, 5.2); // left corner of the shaft, facing the player, clear of the lyric
      s.labels.push(L);
    }

    // ---- static (player-relative) pieces: lyric type, hold glasses, the spark, the riser pads ----
    s.ten = kit.text('TEN FLOORS UNDER', { cap: 0.78, color: 'gold', near: 40.52, out: 42.76, outDur: 0.04, depthTest: false, at: { d: 5.6, az: 0, y: 2.15 } });
    s.what = kit.text('WHAT YOU BELIEVE', { cap: 0.52, color: 'cream', near: 41.56, out: 42.76, outDur: 0.04, depthTest: false, at: { d: 5.6, az: 0, y: 1.2 } });
    s.hold = kit.text('HOLD YOUR BREATH', { cap: 0.4, color: 'cream', near: 42.76, say: 'hold your breath', out: 44.8, outDur: 0.3, at: { d: 5, az: 0, y: 1.72 } });
    s.here = kit.text('HERE WE', { cap: 0.95, color: 'gold', near: 44.86, out: 47.48, outDur: 0.02, at: { d: 6, az: -15, y: 2.35 } });
    s.go = kit.text('GO', { cap: 1.9, color: 'gold', times: [45.78], pop: true, dur: 0.2, out: 47.48, outDur: 0.02, at: { d: 6, az: 14, y: 2.0 } });
    s.holdG = new THREE.Mesh(glassGeo.clone().translate(0, 0, -6.3).scale(0.92, 0.92, 1), kit.flat({ color: PAL.white, fog: 0 }));
    s.holdG.position.set(0, 5.4, -40);
    kit.group.add(s.holdG);
    s.spark = new THREE.Mesh(star(4, 0.9, 0.16), kit.flat({ color: PAL.goldHi, fog: 0, side: THREE.DoubleSide }));
    kit.group.add(s.spark);
    s.burst = kit.particles({
      n: 60, shape: 'stroke', size: 0.7, fog: 0, seed: 62,
      init: (i, r) => { const a = (i / 60) * Math.PI * 2 + r() * 0.1, sp = 9 + r() * 9, up = r() * 6; return { p: [0, 3.4, 0], v: [Math.cos(a) * sp, up, Math.sin(a) * sp], g: [0, -6, 0], t0: 45.78, life: 0.55 + r() * 0.35, s: 0.5 + r() * 0.7, c: r() < 0.6 ? PAL.gold : PAL.goldHi }; },
    });
    kit.group.add(s.burst);
    // riser: rows of tiny cyan pads (floor, walls, ceiling) streaming past
    const pads = [];
    for (let z = -150; z <= 30; z += 2.5) {
      for (const x of [-4.2, -2.8, -1.6, 1.6, 2.8, 4.2]) pads.push([x, -1.6, z]);
      for (const sd of [-1, 1]) for (const y of [-0.4, 1.4, 3.2, 5.0, 6.8]) pads.push([sd * 6.5, y, z]);
      for (const x of [-3.5, -1.2, 1.2, 3.5]) pads.push([x, 9, z]);
    }
    s.pads = kit.particles({
      n: pads.length, shape: 'quad', size: 0.3, color: PAL.cyan, seed: 63,
      init: (i, r) => ({ p: pads[i], t0: 46.0 + Math.min(1.1, Math.max(0, -pads[i][2]) / 150) + r() * 0.12, life: 1e6, s: 0.22 + r() * 0.18, c: r() < 0.12 ? PAL.white : PAL.cyan }),
    });
    kit.group.add(s.pads);
    s.pulseA = { z: 0, a: 0, w: 2.5 }; s.pulseB = { z: 0, a: 0, w: 1.0 };
    s.grown = -1;
    return s;
  },

  update(t, s, kit) {
    const D = s.dummy;
    const d = s.prof.d(t);
    const rise = riseAt(t);
    const off = SPLIT * sm(40.52, 41.25, t);
    const hold = t >= 42.76;
    const live = t < 47.5;
    s.V.visible = live && !hold;
    s.V.position.set(0, rise, d);
    s.halves[0].position.x = -off; s.halves[1].position.x = off;

    // components grow out of the board in a wave from the player (36.2 to ~37.6); idempotent cache
    const growing = t < 37.8;
    if (growing || s.grown !== 1) {
      for (const C of s.chips) {
        C.list.forEach((c, i) => {
          const g = Math.max(0.01, sm(36.2 + C.delay[i], 36.65 + C.delay[i], t));
          D.position.set(c.x, 0, c.z); D.rotation.set(0, 0, 0); D.scale.set(c.sx, c.h * g, c.sz); D.updateMatrix(); C.M.setMatrixAt(i, D.matrix);
        });
        C.M.instanceMatrix.needsUpdate = true;
      }
      for (const C of s.caps) {
        C.list.forEach((c, i) => {
          const g = Math.max(0.01, sm(36.25 + C.delay[i], 36.8 + C.delay[i], t));
          D.position.set(c.x, 0, c.z); D.rotation.set(0, 0, 0); D.scale.set(1, c.h * g, 1); D.updateMatrix(); C.M.setMatrixAt(i, D.matrix);
          D.position.set(c.x, (c.h - 1.4) * g, c.z); D.scale.set(1, 0.9 * g, 1); D.updateMatrix(); C.R.setMatrixAt(i, D.matrix);
        });
        C.M.instanceMatrix.needsUpdate = true; C.R.instanceMatrix.needsUpdate = true;
      }
      s.grown = growing ? 0 : 1;
    }
    const gT = Math.max(0.01, sm(36.2, 36.55, t));
    s.capT.scale.y = CAPT.h * gT;
    s.crystal.scale.y = Math.max(0.01, sm(36.2, 36.32, t));
    for (const P of s.pins) P.scale.y = Math.max(0.01, sm(36.35, 36.9, t));

    // breathing: traces swell, capacitors rise 2 m and sink, the gold letters swell
    const br = breathAt(t);
    s.M.trace.uniforms.uColor.value.copy(s.cA).lerp(s.cB, br);
    s.M.trace.uniforms.uBright.value = 1 + 0.5 * br;
    s.M.ring.uniforms.uBright.value = 1 + 0.6 * br;
    s.layerLines.material.uniforms.uBright.value = 0.75 + 0.6 * br;
    for (const C of s.caps) { C.M.position.y = BY + 2 * br; C.R.position.y = BY + 2 * br; }
    s.capT.position.y = BY + 2 * br; s.capTring.position.y = BY + CAPT.h * gT - 1.4 + 2 * br; s.capTG.position.y = BY + 2 * br;
    s.feel.mesh.scale.setScalar(1 + 0.07 * br);

    // the tick rings and the pin rows they light
    let rr = -1;
    if (t >= 36.34 && t < 37.4) rr = 150 * (t - 36.34);
    else if (t >= 38.74 && t < 39.8) rr = 150 * (t - 38.74);
    s.ring.visible = rr > 0 && rr < 160;
    if (s.ring.visible) s.ring.scale.setScalar(Math.max(0.5, rr));
    const ringOn = rr > 0;
    if (ringOn || s.pinLit) {
      for (const P of s.pins) {
        const dist = P.userData.dist, a = P.instanceColor.array;
        for (let i = 0; i < dist.length; i++) {
          const f = ringOn ? Math.exp(-Math.pow((rr - dist[i]) / 4, 2)) : 0;
          a[i * 3] = 1 - 0.72 * f; a[i * 3 + 1] = 1 + 0.2 * f; a[i * 3 + 2] = 1 + 0.55 * f;
        }
        P.instanceColor.needsUpdate = true;
      }
      s.pinLit = ringOn;
    }

    // the giant arm works; the iron touches down at 38.30
    const dip = -4.5 * bump(t, 37.85, 38.3, 38.42, 39.2);
    s.arm.position.set(1.4 * Math.sin(t * 0.9), dip + 0.8 * Math.sin(t * 0.7 + 1), 1.0 * Math.sin(t * 0.6 + 2));
    const se = env(t, 38.3, 4.5);
    s.star.visible = se > 0.04;
    s.star.scale.setScalar(0.3 + 4.2 * se);
    s.star.rotation.z = t * 0.6;
    if (s.star.visible) s.star.lookAt(0, 1.6, 0);
    s.sparks.visible = t >= 38.3 && t < 39.3;

    // the layer stack (only while falling) and its floor labels
    s.stack.visible = t > 40.4 && t < 42.76;

    // hold: everything black except the wire and her glasses 40 m ahead (they blink on "breath")
    s.holdG.visible = live && t >= 42.76 && t < 45.0;
    if (s.holdG.visible) s.holdG.scale.set(1, Math.max(0.04, 1 - bump(t, 43.56, 43.6, 43.68, 43.78) - sm(44.86, 44.98, t)), 1);
    // "here": a gold spark ignites at the vanishing point and runs down the wire into the trolley
    const sk = (t - 44.86) / 0.92;
    s.spark.visible = live && sk >= 0 && sk < 1.02;
    const zSp = -150 * (1 - Math.min(1, sk) * Math.min(1, sk));
    if (s.spark.visible) {
      s.spark.position.set(0, 3.4, zSp);
      s.spark.scale.setScalar(0.6 + 0.9 * Math.min(1, sk) + 2.2 * env(t, 44.86, 5));
      s.spark.rotation.z = t * 3;
    }
    s.burst.visible = t >= 45.78 && t < 46.8;
    s.pads.visible = live && t >= 45.95;
    s.pads.position.z = ((d % 2.5) + 2.5) % 2.5;

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wheelSpin = d / 0.075;
      if (hold) {
        rs.dark = t < 44.86 ? 1 : 1 - 0.6 * sm(44.86, 45.8, t);
        kit.setSky({ stars: t < 44.86 ? 0 : 0.18 * sm(45.8, 46.6, t), hor: 0x000000, hor2: 0x000000 });
      }
      if (t >= 45.78) rs.gauge = 1 - 0.12 * sm(46.3, 47.4, t);
      const P = rs.wire.pulses;
      if (t >= 44.04 && t < 47.0 && P.length < 6) {
        s.pulseA.z = -110 + 38 * (t - 44.04); s.pulseA.a = sm(44.04, 44.25, t) * (1 - sm(46.4, 47.0, t)) * 0.85; s.pulseA.w = 2.6;
        P.push(s.pulseA);
      }
      if (s.spark.visible && P.length < 6) { s.pulseB.z = zSp; s.pulseB.a = 1; s.pulseB.w = 1.1; P.push(s.pulseB); }
    }
  },

  events() {
    return [
      { t: 36.34, sfx: 'tick', gain: 0.55 },
      { t: 38.3, sfx: 'crack', gain: 0.32, haptic: [0.2, 40] },
      { t: 38.74, sfx: 'tick', gain: 0.55 },
      { t: 40.52, sfx: 'drop', gain: 0.55, haptic: [0.3, 140] },
      { t: 42.76, sfx: 'switch', gain: 0.6 },
      { t: 44.86, sfx: 'ping', gain: 0.4 },
      { t: 45.78, sfx: 'grab', gain: 0.6, haptic: [0.6, 90] },
    ];
  },
};
