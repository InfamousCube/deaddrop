// S07 Gold ropeway over a canyon (47.50 to 56.61, hot). Twelve gold ropeway cables run parallel to the
// player's wire over a 70 m black canyon under the carmine sunburst; 80 ingot carriers glide both ways,
// a 40 m airship drifts overhead and catches fire on "fire", sixteen angel statues on the rims smile,
// fan their wings and on "lie" spin round: their backs are the Engineer. Out: SHATTER at 56.61.
import * as THREE from 'three';
import { PAL, COMFORT } from './style.js';
import { sm, env, hash, paint, merge, rod, shapeOf, slab } from './scenes-2-util.js';

const RIM_Y = -8.4; // canyon rims / plateau (10 m below eye level)
const SX = 19.5; // statue rows, x = +-SX
// cables [x, y]: 0 = near right (the whooshing carriers), 1 = banner cable (left inner), then side, then overhead
const CABLES = [[3.5, 7.3], [-3.5, 7.3], [-8, 7.3], [8, 7.3], [-14, 7.3], [14, 7.3], [-20, 7.3], [20, 7.3], [-3.5, 15], [3.5, 15], [-8.5, 22], [8.5, 22]];
const ZMIN = -330, ZSPAN = 420; // wrap window for repeating things along the canyon
const wrapZ = (z) => ZMIN + ((((z - ZMIN) % ZSPAN) + ZSPAN) % ZSPAN);
const WHOOSH = [48.08, 48.65, 49.18];

export const S07 = {
  id: 'S07', t0: 47.5, t1: 56.61, world: 'hot', pre: 0, post: 1.2, // post = shard life: the shards fly past instead of popping off
  key: [0, 0.28, -0.96],
  fog: { color: PAL.velvet, near: 35, far: 190 },
  sky: { rayA: PAL.carmine },

  build(kit) {
    const s = { dA: new THREE.Object3D(), dB: new THREE.Object3D(), m: new THREE.Matrix4(), c: new THREE.Color() };
    const R = kit.rnd(707);
    s.prof = kit.travel([[47.5, 4, 0.001], [47.501, 6, 1.0]]);
    const D61 = s.prof.d(56.61);
    s.W = new THREE.Group(); s.W.name = 's07-world';
    kit.group.add(s.W);
    const rockMat = kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: null, side: THREE.DoubleSide });

    // ---- canyon: two jagged faceted walls, plateau, rock spires ----
    const wallPos = [];
    const ys = [RIM_Y, -13, -20, -29, -40, -54, -82];
    for (const side of [-1, 1]) {
      const cols = [];
      for (let z = -470; z <= 190; z += 9) {
        cols.push(ys.map((y, k) => {
          const depth = RIM_Y - y;
          const x = side * (k === 0 ? 18.2 + R() * 1.4 : 17.5 - depth * 0.13 + (R() - 0.5) * 6);
          return [x, y + (k && k < ys.length - 1 ? (R() - 0.5) * 4 : 0), z + (k ? (R() - 0.5) * 6 : 0)];
        }));
      }
      for (let c = 0; c < cols.length - 1; c++) {
        for (let k = 0; k < ys.length - 1; k++) {
          const a = cols[c][k], b = cols[c + 1][k], e = cols[c + 1][k + 1], f = cols[c][k + 1];
          wallPos.push(...a, ...b, ...e, ...a, ...e, ...f);
        }
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
    wg.computeVertexNormals();
    const walls = new THREE.Mesh(wg, rockMat);
    walls.frustumCulled = false;
    const plateau = new THREE.Mesh(merge([
      new THREE.PlaneGeometry(320, 700).rotateX(-Math.PI / 2).translate(-(18.0 + 160), RIM_Y, -140),
      new THREE.PlaneGeometry(320, 700).rotateX(-Math.PI / 2).translate(18.0 + 160, RIM_Y, -140),
    ]), kit.flat({ color: PAL.velvet }));
    plateau.frustumCulled = false;
    s.W.add(walls, plateau);
    // spires: in the canyon (below the deck) and on the plateau (silhouettes against the sunburst)
    const spG = new THREE.ConeGeometry(1, 1, 5, 2).translate(0, 0.5, 0);
    const sp = spG.getAttribute('position');
    for (let i = 0; i < sp.count; i++) if (sp.getY(i) > 0.05 && sp.getY(i) < 0.95) sp.setXYZ(i, sp.getX(i) * (0.7 + hash(i) * 0.6), sp.getY(i), sp.getZ(i) * (0.7 + hash(i + 9) * 0.6));
    s.spires = [];
    for (let i = 0; i < 48; i++) {
      const side = i % 2 ? 1 : -1, inC = i < 18;
      const x = inC ? side * (3 + R() * 9) : side * (27 + Math.pow(R(), 1.5) * 150);
      const base = inC ? -82 : RIM_Y;
      const h = inC ? 40 + R() * 34 : 12 + R() * 42;
      s.spires.push({ x, y: base, z0: ZMIN + R() * ZSPAN, h, w: inC ? 2.5 + R() * 3 : 4 + R() * 9, ry: R() * 6 });
    }
    s.spireM = new THREE.InstancedMesh(spG.toNonIndexed(), kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: PAL.gold, rimTh: 0.55 }), s.spires.length);
    s.spireM.geometry.computeVertexNormals();
    s.spireM.frustumCulled = false;
    s.W.add(s.spireM);

    // ---- ropeway: T-towers every 40 m (mirrored pairs), gold wheel-heads, twelve cables ----
    const tg = merge([
      new THREE.BoxGeometry(0.9, 103, 0.9).translate(-12, -75 + 51.5, 0),
      new THREE.BoxGeometry(19.8, 0.7, 0.8).translate(-11.8, 7.65, 0),
      new THREE.BoxGeometry(11.8, 0.7, 0.8).translate(-7.6, 27.6, 0),
      new THREE.BoxGeometry(0.3, 12.2, 0.3).translate(-3.5, 21.5, 0),
      new THREE.BoxGeometry(0.3, 5.2, 0.3).translate(-8.5, 25, 0),
      new THREE.BoxGeometry(2.4, 0.5, 0.5).rotateZ(0.8).translate(-10.8, 26.3, 0),
      new THREE.BoxGeometry(3.2, 0.5, 0.5).rotateZ(-0.7).translate(-13.3, 6.4, 0),
    ]);
    s.towerM = new THREE.InstancedMesh(tg, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5, side: THREE.DoubleSide }), 20);
    s.towerM.frustumCulled = false;
    const wheelG = new THREE.CylinderGeometry(0.7, 0.7, 0.32, 10).rotateZ(Math.PI / 2);
    s.wheelM = new THREE.InstancedMesh(wheelG, kit.toon({ ramp: 'gold', rim: null }), 20 * 6);
    s.wheelM.frustumCulled = false;
    s.W.add(s.towerM, s.wheelM);
    s.wheelPts = [[-3.5, 7.3], [-8, 7.3], [-14, 7.3], [-20, 7.3], [-3.5, 15], [-8.5, 22]];
    // cable segments (instanced, for the near-to-far gold flash) + 1 px lines to the horizon
    const NSEG = 50;
    s.segM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, 0.085, 10), kit.flat({ color: PAL.gold }), CABLES.length * NSEG);
    s.segM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CABLES.length * NSEG * 3).fill(0.75), 3);
    s.segM.frustumCulled = false;
    const D = s.dA;
    CABLES.forEach(([x, y], c) => { for (let k = 0; k < NSEG; k++) { D.position.set(x, y, -395 + k * 10); D.rotation.set(0, 0, 0); D.scale.set(1, 1, 1); D.updateMatrix(); s.segM.setMatrixAt(c * NSEG + k, D.matrix); } });
    s.segZ = Float32Array.from({ length: CABLES.length * NSEG }, (_, i) => -395 + (i % NSEG) * 10);
    const LP = [];
    for (const [x, y] of CABLES) LP.push(x, y, -500, x, y, 150);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3));
    s.cableLines = new THREE.LineSegments(lg, kit.flat({ color: PAL.brass }));
    s.cableLines.frustumCulled = false;
    kit.group.add(s.segM, s.cableLines);

    // ---- 80 gold ingot carriers ----
    const hangG = merge([
      new THREE.BoxGeometry(0.5, 0.5, 1.0).translate(0, -0.2, 0),
      new THREE.BoxGeometry(0.1, 2.7, 0.1).translate(0, -1.85, 0),
      new THREE.BoxGeometry(1.7, 0.12, 0.9).translate(0, -3.25, 0),
      new THREE.BoxGeometry(0.08, 0.7, 0.08).translate(-0.8, -2.9, 0),
      new THREE.BoxGeometry(0.08, 0.7, 0.08).translate(0.8, -2.9, 0),
    ]);
    const barG = merge([
      new THREE.BoxGeometry(0.72, 0.34, 1.3).translate(-0.38, -3.02, 0),
      new THREE.BoxGeometry(0.72, 0.34, 1.3).translate(0.38, -3.02, 0),
      new THREE.BoxGeometry(0.72, 0.34, 1.3).translate(0, -2.68, 0),
    ]);
    s.carriers = [];
    for (let i = 0; i < 77; i++) {
      const c = 2 + (i % 10);
      s.carriers.push({ c, dir: R() < 0.5 ? -1 : 1, v: 2.5 + R() * 3, z0: ZMIN + R() * ZSPAN });
    }
    for (const tb of WHOOSH) s.carriers.push({ c: 0, tb });
    s.hangM = new THREE.InstancedMesh(hangG, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }), s.carriers.length);
    s.barM = new THREE.InstancedMesh(barG, kit.toon({ ramp: 'gold', rim: null }), s.carriers.length);
    s.hangM.frustumCulled = false; s.barM.frustumCulled = false;
    kit.group.add(s.hangM, s.barM);

    // ---- the airship: 40 m black cigar hull, fins, cream gondola; breaks in two at 54.89 ----
    const prof = [];
    for (let k = 0; k <= 10; k++) { const y = k * 2; prof.push(new THREE.Vector2(Math.max(0.05, 4.6 * Math.sqrt(Math.max(0, 1 - Math.pow(y / 20, 2.2)))), y)); }
    const halfHull = (sign) => {
      const g = new THREE.LatheGeometry(prof, 12).rotateX(-Math.PI / 2); // y (0..20) -> z (0..-20)
      if (sign > 0) g.scale(1, 1, -1); // back half: z 0..+20
      return g;
    };
    s.air = new THREE.Group();
    s.hullF = new THREE.Group(); s.hullB = new THREE.Group();
    const hullMat = kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5, side: THREE.DoubleSide });
    s.hullF.add(new THREE.Mesh(merge([halfHull(-1), rod([0, -3.6, -6], [0, -4.8, -6], 0.12), rod([0, -3.6, -1], [0, -4.8, -1], 0.12)]), hullMat));
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 7).translate(0, -5.4, -3.5), kit.toon({ ramp: 'cream', rim: PAL.gold }));
    s.hullF.add(gondola);
    s.hullB.add(new THREE.Mesh(merge([
      halfHull(1),
      new THREE.BoxGeometry(0.35, 4.2, 5).translate(0, 3.8, 16.2), new THREE.BoxGeometry(0.35, 4.2, 5).translate(0, -3.8, 16.2),
      new THREE.BoxGeometry(4.2, 0.35, 5).translate(3.8, 0, 16.2), new THREE.BoxGeometry(4.2, 0.35, 5).translate(-3.8, 0, 16.2),
    ]), hullMat));
    s.air.add(s.hullF, s.hullB);
    kit.group.add(s.air);
    // cel flames: cut-out tongues in three layers (rust, orange, amber tips), crossed planes, 3 Hz steps
    const tongue = shapeOf([[-0.5, 0], [0.5, 0], [0.42, 0.6], [0.66, 1.35], [0.26, 1.0], [0.22, 1.95], [-0.04, 1.4], [-0.3, 2.35], [-0.36, 1.3], [-0.64, 1.62], [-0.46, 0.7]]);
    const fg = merge([new THREE.ShapeGeometry(tongue), new THREE.ShapeGeometry(tongue).rotateY(Math.PI / 2)]);
    s.flames = [];
    for (let i = 0; i < 16; i++) {
      const z = -17 + (i / 15) * 34 + (R() - 0.5) * 1.5;
      const r = 4.6 * Math.sqrt(Math.max(0.05, 1 - Math.pow(Math.abs(z) / 20, 2.2)));
      const ph = (R() - 0.5) * 2.2;
      s.flames.push({ x: Math.sin(ph) * r, y: Math.cos(ph) * r - 0.3, z, half: z < 0 ? 0 : 1, delay: Math.abs(z) / 17 * 0.25 });
    }
    s.flameL = [[PAL.rust, 3.4], [PAL.orange, 2.3], [PAL.amber, 1.1]].map(([col, sc]) => {
      const m = new THREE.InstancedMesh(fg, kit.flat({ color: col, side: THREE.DoubleSide, fog: 0.25 }), s.flames.length);
      m.frustumCulled = false; m.userData.sc = sc;
      s.air.add(m);
      return m;
    });
    s.embers = kit.particles({
      n: 220, shape: 'tri', size: 0.4, fog: 0.4, seed: 71,
      init: (i, r) => { const a = r() * Math.PI * 2, rad = 4 + r() * 32; return { p: [Math.sin(a) * rad, 8 + r() * 28, -Math.cos(a) * rad], v: [(r() - 0.5) * 1.6, -2.2 - r() * 2.2, (r() - 0.5) * 1.6], t0: i % 2 ? 50.32 : 50.9, life: 7, s: 0.22 + r() * 0.36, swirl: (r() - 0.5) * 0.25, c: [PAL.rust, PAL.orange, PAL.orange, PAL.amber][Math.floor(r() * 4)] }; },
    });
    kit.group.add(s.embers);

    // ---- sixteen two-faced statues on the rims: angel front, Engineer back ----
    const head = new THREE.Shape();
    head.moveTo(-1.7, 0); head.lineTo(1.7, 0); head.lineTo(1.15, 4.6); head.lineTo(1.45, 5.5); head.lineTo(0.95, 5.95); head.lineTo(0.45, 6.08);
    head.absarc(0, 6.75, 0.72, -0.98, 4.12, false);
    head.lineTo(-0.95, 5.95); head.lineTo(-1.45, 5.5); head.lineTo(-1.15, 4.6); head.closePath();
    const back = shapeOf([[-1.35, 0], [1.35, 0], [1.2, 3.4], [1.5, 5.3], [0.7, 5.85], [0.62, 6.25], [0.82, 6.3], [0.88, 7.15], [0.56, 7.52], [-0.56, 7.52], [-0.88, 7.15], [-0.82, 6.3], [-0.62, 6.25], [-0.7, 5.85], [-1.5, 5.3], [-1.2, 3.4]]);
    const creamG = slab(head, 0.3, 0.15, 10);
    const blackG = merge([
      slab(back, 0.3, -0.2, 4),
      new THREE.CircleGeometry(0.5, 14).scale(1, 1.15, 1).translate(0, 6.72, 0.32),
      new THREE.BoxGeometry(2.9, 1.6, 2.3).translate(0, -0.8, 0),
      new THREE.BoxGeometry(2.6, 0.32, 0.12).translate(0, 3.3, -0.4),
    ]);
    const goldG = merge([
      new THREE.TorusGeometry(0.85, 0.1, 6, 22).rotateX(Math.PI / 2 - 0.35).translate(0, 7.78, 0.05),
      new THREE.BoxGeometry(0.4, 0.34, 0.08).translate(0, 3.3, -0.48),
    ]);
    const smilePts = [];
    for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.12 + 0.76 * k / 8); smilePts.push([Math.cos(a) * 0.36, Math.sin(a) * 0.24]); }
    for (let k = 8; k >= 0; k--) { const a = Math.PI * (1.12 + 0.76 * k / 8); smilePts.push([Math.cos(a) * 0.3, Math.sin(a) * 0.1 + 0.02]); }
    const smileG = new THREE.ShapeGeometry(shapeOf(smilePts)).translate(0, 6.62, 0.34);
    const glassG = merge([new THREE.CircleGeometry(0.17, 12).translate(-0.3, 6.95, 0), new THREE.CircleGeometry(0.17, 12).translate(0.3, 6.95, 0)]).rotateY(Math.PI).translate(0, 0, -0.38);
    const wingG = new THREE.ShapeGeometry(shapeOf([[0, 0], [0.55, 0.5], [1.05, 1.7], [1.42, 3.1], [1.3, 4.5], [0.95, 5.1], [0.86, 4.4], [0.6, 4.6], [0.55, 3.8], [0.32, 3.9], [0.3, 2.7], [0.1, 1.3]]));
    const N = 16;
    s.statues = [];
    for (let i = 0; i < N; i++) {
      const side = i < 8 ? -1 : 1, k = i % 8;
      s.statues.push({ x: side * SX, z0: -4.5 - D61 + 13 * (k - 6), yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2, rank: 7 - k, side });
    }
    const mk = (g, mat, n = N) => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; s.W.add(m); return m; };
    s.stCream = mk(creamG, kit.toon({ ramp: 'cream', rim: PAL.gold, rimTh: 0.55 }));
    s.stBlack = mk(blackG, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }));
    s.stGold = mk(goldG, kit.toon({ ramp: 'gold', rim: null }));
    s.stSmile = mk(smileG, kit.flat({ color: PAL.cream, fog: 0.4, side: THREE.DoubleSide }));
    s.stGlass = mk(glassG, kit.flat({ color: PAL.red, fog: 0.2, side: THREE.DoubleSide }));
    s.stWing = mk(wingG, kit.toon({ ramp: 'cream', rim: PAL.gold, side: THREE.DoubleSide }), N * 2);
    // cracks (gold zig-zags) spreading over the backs of the two nearest statues, ordered by distance
    const crackGeo = (seed) => {
      const r = kit.rnd(seed), P = [];
      const strip = (x0, y0, x1, y1, w) => { const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * w, ny = (x1 - x0) / L * w; P.push(x0 + nx, y0 + ny, -0.42, x1 + nx, y1 + ny, -0.42, x1 - nx, y1 - ny, -0.42, x0 + nx, y0 + ny, -0.42, x1 - nx, y1 - ny, -0.42, x0 - nx, y0 - ny, -0.42); };
      for (const pass of [0, 1]) {
        const br = [];
        for (let b = 0; b < 6; b++) br.push({ x: (r() - 0.5) * 0.6, y: pass ? 2.2 + r() * 1.5 : 4.4 + r() * 1.2, a0: r() * Math.PI * 2 });
        for (let k = 0; k < 6; k++) {
          for (const q of br) {
            const a = q.a0 + (r() - 0.5) * 1.6, L = 0.35 + r() * 0.5;
            const nx = Math.max(-1.4, Math.min(1.4, q.x + Math.cos(a) * L)), ny = Math.max(0.1, Math.min(7.3, q.y + Math.sin(a) * L));
            strip(q.x, q.y, nx, ny, 0.055 * (1.4 - k * 0.15)); q.x = nx; q.y = ny;
          }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.rotateY(0); return g;
    };
    s.cracks = [6, 14].map((idx, j) => {
      const anchor = new THREE.Object3D(); anchor.matrixAutoUpdate = false;
      const m = new THREE.Mesh(crackGeo(77 + j), kit.flat({ color: PAL.goldHi, side: THREE.DoubleSide, fog: 0.3 }));
      m.frustumCulled = false;
      anchor.add(m); s.W.add(anchor);
      return { idx, anchor, mesh: m, n: m.geometry.getAttribute('position').count };
    });
    // shatter: angular shards from the two nearest statues fly ahead of the player and away.
    // Comfort: each shard aims at a point 7.5-14 m ahead on its own side and keeps flying away from
    // the player (>= 4 m from the eyes all the way), sizes 0.55-2 m, so they cover at most ~20%
    // of the view (headless measure); the comfort flag halves the count and shrinks them further.
    const shardSrc = [s.statues[6], s.statues[14]];
    const NSH = COMFORT ? 80 : 160, SSH = COMFORT ? 0.75 : 1;
    s.shards = kit.shards({
      n: NSH, t0: 56.61, life: 1.2, gravity: -3, seed: 79, colors: [PAL.cream, PAL.black, PAL.gold, PAL.cream],
      init: (i, r) => {
        const st = shardSrc[i % 2];
        const p = [st.x + (r() - 0.5) * 2.6, RIM_Y + 1.6 + r() * 7.6, st.z0 + D61 + (r() - 0.5) * 2.6];
        const T = [Math.sign(st.x) * (2.5 + r() * 7.5), -0.6 + r() * 5.4, -6.5 - r() * 6];
        const tau = 0.32 + r() * 0.22;
        return { p, v: [(T[0] - p[0]) / tau, (T[1] - p[1]) / tau, (T[2] - p[2]) / tau], s: [(0.55 + r() * 1.35) * SSH, (0.55 + r() * 1.45) * SSH], spin: (r() - 0.5) * 14, delay: r() * 0.08 };
      },
    });
    kit.group.add(s.shards);

    // ---- lyric type ----
    // GOLD ON THE WIRE hangs from the nearest left cable and rides along with the player, swaying
    s.hang = new THREE.Group(); s.hang.position.set(-3.5, 7.3, -7.2);
    const plate = new THREE.Group(); plate.rotation.y = Math.atan2(3.5, 7.2);
    s.hang.add(plate);
    s.banner = kit.text('GOLD ON\nTHE WIRE', { cap: 1.25, color: 'gold', near: 47.48, parent: plate, out: 51.3 });
    s.banner.mesh.position.set(0, -4.1, 0);
    s.bannerRig = new THREE.Mesh(merge([
      new THREE.BoxGeometry(0.06, 2.2, 0.06).translate(-1.8, -1.1, 0), new THREE.BoxGeometry(0.06, 2.2, 0.06).translate(1.8, -1.1, 0),
      new THREE.BoxGeometry(4.0, 0.08, 0.08).translate(0, -2.2, 0),
    ]), kit.flat({ color: PAL.gold }));
    plate.add(s.bannerRig);
    kit.group.add(s.hang);
    s.fire = kit.text('FIRE IN THE', { cap: 0.85, color: 'cream', near: 49.34, out: 53.8, at: { d: 7.6, az: 24, y: 2.85 } });
    s.sky = kit.text('SKY', { cap: 1.75, color: 'cream', times: [50.58], pop: true, dur: 0.18, out: 53.8, at: { d: 7.6, az: 24, y: 1.45 } });
    s.smile = kit.text('SMILE LIKE\nAN ANGEL', { cap: 0.95, color: 'cream', near: 51.44, out: 56.61, outDur: 0.05, at: { d: 7.4, az: -24, y: 2.3 } });
    s.spy = kit.text('LIE LIKE\nA SPY', { cap: 1.3, color: 'gold', colors: { 3: 0xfff4dc }, near: 53.98, out: 56.61, outDur: 0.05, at: { d: 7.4, az: 25, y: 2.35 } });
    return s;
  },

  update(t, s, kit) {
    const d = s.prof.d(t);
    const live = t < 56.61;
    const A = s.dA, B = s.dB, m = s.m;
    s.W.visible = live; s.air.visible = live; s.segM.visible = live; s.cableLines.visible = live; s.hangM.visible = live; s.barM.visible = live; s.hang.visible = live;
    s.embers.visible = live && t >= 50.3;
    s.shards.visible = t >= 56.6;
    if (!live) return;
    s.W.position.z = d;

    // spires, towers and wheel-heads repeat along the canyon (pure in d)
    s.spires.forEach((p, i) => { A.position.set(p.x, p.y, wrapZ(p.z0 + d) - d); A.rotation.set(0, p.ry, 0); A.scale.set(p.w, p.h, p.w); A.updateMatrix(); s.spireM.setMatrixAt(i, A.matrix); });
    s.spireM.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < 10; k++) {
      const z = wrapZ(k * 42 + 20 + d) - d; // in world-group space
      for (let sd = 0; sd < 2; sd++) {
        const sx = sd ? -1 : 1;
        A.position.set(0, 0, z); A.rotation.set(0, 0, 0); A.scale.set(sx, 1, 1); A.updateMatrix(); s.towerM.setMatrixAt(k * 2 + sd, A.matrix);
        s.wheelPts.forEach(([x, y], w) => { A.position.set(x * sx, y + 0.35, z); A.scale.set(1, 1, 1); A.updateMatrix(); s.wheelM.setMatrixAt((k * 2 + sd) * 6 + w, A.matrix); });
      }
    }
    s.towerM.instanceMatrix.needsUpdate = true; s.wheelM.instanceMatrix.needsUpdate = true;

    // carriers: all light gold at once on "Gold" and start gliding both ways; three whoosh past close
    const run = Math.max(0, t - 47.5);
    s.carriers.forEach((c, i) => {
      let z, cx, cy, vis = 1;
      if (c.tb !== undefined) { z = 34 * (t - c.tb); cx = CABLES[0][0]; cy = CABLES[0][1]; vis = z > -170 && z < 60 ? 1 : 0; }
      else { z = wrapZ(c.z0 + c.dir * c.v * run + d); cx = CABLES[c.c][0]; cy = CABLES[c.c][1]; }
      A.position.set(cx, cy, z); A.rotation.set(0, 0, 0); A.scale.setScalar(vis ? 1 : 0.0001); A.updateMatrix();
      s.hangM.setMatrixAt(i, A.matrix); s.barM.setMatrixAt(i, A.matrix);
    });
    s.hangM.instanceMatrix.needsUpdate = true; s.barM.instanceMatrix.needsUpdate = true;
    s.barM.material.uniforms.uBright.value = 1 + 1.3 * env(t, 47.5, 3.5);

    // cables: gold flash from near to far on "Gold" (overhead strongest)
    const waving = t < 48.9;
    if (waving || s.segLit) {
      const zW = -420 * (t - 47.5) / 1.15;
      const a = s.segM.instanceColor.array;
      for (let i = 0; i < s.segZ.length; i++) {
        const over = Math.floor(i / 50) >= 8 ? 1 : 0.55;
        const f = waving ? Math.exp(-Math.pow((s.segZ[i] - zW) / 22, 2)) * over : 0;
        a[i * 3] = 0.78 + 0.5 * f; a[i * 3 + 1] = 0.78 + 0.5 * f; a[i * 3 + 2] = 0.78 + 1.4 * f;
      }
      s.segM.instanceColor.needsUpdate = true;
      s.segLit = waving;
    }

    // the airship drifts front to back over the player, burns, breaks in two
    s.air.position.set(0.5, 28 - 7 * sm(54.89, 57.5, t), 4 * (t - 53));
    const br = sm(54.89, 56.6, t);
    s.hullF.position.z = -1.6 * br; s.hullF.rotation.x = -0.42 * br;
    s.hullB.position.z = 1.6 * br; s.hullB.rotation.x = 0.36 * br;
    s.hullF.updateMatrix(); s.hullB.updateMatrix();
    const step = Math.floor(t * 3);
    const fireOn = t >= 49.34;
    s.flameL.forEach((F, L) => {
      F.visible = fireOn;
      if (!fireOn) return;
      s.flames.forEach((f, i) => {
        const g = sm(49.34 + f.delay, 49.62 + f.delay, t);
        const hs = 0.72 + 0.56 * hash(i * 13 + step * 7 + L * 3);
        const fl = hash(i * 7 + step) < 0.5 ? -1 : 1;
        B.position.set(f.x, f.y + L * 0.15, f.z); B.rotation.set(0, (hash(i + L) - 0.5) * 0.6, (f.x / 4.6) * -0.5); B.scale.set(F.userData.sc * fl * g, F.userData.sc * hs * g + 0.0001, F.userData.sc * g); B.updateMatrix();
        m.multiplyMatrices(f.half ? s.hullB.matrix : s.hullF.matrix, B.matrix);
        F.setMatrixAt(i, m);
      });
      F.instanceMatrix.needsUpdate = true;
    });

    // statues: halos + smiles on "Smile", wings fan open near-to-far, spin 180 on "lie", cracks
    const spin = Math.PI * sm(53.98, 54.38, t);
    s.stGold.material.uniforms.uBright.value = t < 51.44 ? 0.3 : 1 + 1.2 * env(t, 51.44, 3);
    s.stSmile.visible = t >= 51.44;
    s.stGlass.visible = t >= 53.98;
    s.stGlass.material.uniforms.uBright.value = 1 + 1.5 * env(t, 54.3, 3);
    s.statues.forEach((st, i) => {
      A.position.set(st.x, RIM_Y + 1.6, st.z0); A.rotation.set(0, st.yaw + spin, 0); A.scale.set(1, 1, 1); A.updateMatrix();
      s.stCream.setMatrixAt(i, A.matrix); s.stBlack.setMatrixAt(i, A.matrix); s.stGold.setMatrixAt(i, A.matrix);
      s.stSmile.setMatrixAt(i, A.matrix); s.stGlass.setMatrixAt(i, A.matrix);
      const dl = st.rank * 0.06;
      const open = 0.5 * sm(52.04 + dl, 52.36 + dl, t) + 0.5 * sm(52.94 + dl, 53.26 + dl, t);
      for (let w = 0; w < 2; w++) {
        const sx = w ? -1 : 1;
        B.position.set(sx * 0.62, 5.15, -0.28);
        B.rotation.set(0, sx * (1 - open) * (Math.PI / 2 - 0.12), sx * (-0.15 - 0.45 * open));
        B.scale.set(sx * (1 + 0.25 * open), 1 + 0.25 * open, 1); B.updateMatrix();
        m.multiplyMatrices(A.matrix, B.matrix);
        s.stWing.setMatrixAt(i * 2 + w, m);
      }
      for (const C of s.cracks) if (C.idx === i) C.anchor.matrix.copy(A.matrix);
    });
    for (const M of [s.stCream, s.stBlack, s.stGold, s.stSmile, s.stGlass, s.stWing]) M.instanceMatrix.needsUpdate = true;
    for (const C of s.cracks) {
      const segs = C.n / 12; // segments per pass (6 vertices each, two passes)
      const cnt = 6 * Math.floor(segs * sm(55.48, 55.8, t)) + 6 * Math.floor(segs * sm(56.04, 56.36, t));
      C.mesh.visible = cnt > 0;
      C.mesh.geometry.setDrawRange(0, cnt);
    }

    // the banner sways on its cable; SKY flares
    s.hang.rotation.z = 0.08 * Math.sin(((t - 47.5) / 2.3) * Math.PI * 2) * (0.5 + 0.5 * env(t, 47.5, 0.6)) + 0.05 * env(t, 47.5, 2);
    s.sky.u.uBright.value = 1 + 2.4 * env(t, 50.58, 2.6);

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wheelSpin = d / 0.075;
      const lit = sm(49.7, 49.8, t);
      kit.setSky({ rot: t * 0.035, ringPhase: t * 0.12, rayA: lit > 0.5 ? PAL.crimson : PAL.carmine, rayAmt: 0.8 + 0.2 * lit + 0.15 * kit.downEnv(t, 5) });
    }
  },

  events() {
    return [
      { t: 47.5, sfx: 'whoosh', gain: 0.55 },
      { t: 48.65, sfx: 'whoosh', gain: 0.3 },
      { t: 49.34, sfx: 'crack', gain: 0.4, haptic: [0.25, 60] },
      { t: 51.44, sfx: 'ping', gain: 0.32 },
      { t: 53.98, sfx: 'shutter', gain: 0.5 },
      { t: 54.89, sfx: 'crack', gain: 0.4, haptic: [0.3, 80] },
      { t: 56.61, sfx: 'crack', gain: 0.6, haptic: [0.5, 120] },
    ];
  },
};
