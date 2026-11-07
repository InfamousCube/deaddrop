// S10 The panel room, then the chessboard (76.89-83.75, cold, flipped hot by "one red light").
// 24 flip panels (2 x 10 m) ring the cradle at r 8; one red alarm dome; the panels spin on "spins",
// show chess backs, sink, and a crimson checkerboard lights out into the fog with 31 lathe pieces.
// Out: PORTAL 83.36-84.06, the hatch ring flies over the player; S11's sea shows only in its hole.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, instColors, setC, merge, facet, box, disc, ring, shape, fitText, sm, clamp01, easeIn, easeOut, easeInOut, env, HOT_SKY, FOG_U, FOG_APPLY, fogUniforms, WORLD_V, TMP } from './scenes-3-util.js';

const N = 24, R = 8, PW = 2.02, PH = 10, FLOOR = -1.2;
const T_RED = 77.72, T_LIGHT = 78.06, T_SWEEP = 79.17, T_ROOM = 79.58, T_SPIN = 80.18, T_STOP = 81.18, T_SINK = 81.46, T_GAME = 82.42, T_BEGIN = 83.36;
const RING_Z = -12;
const WORD_PANELS = [22, 23, 0, 1, 2]; // AND THE WHOLE ROOM SPINS (fronts), THAT'S THE SECOND (backs of the first three)
export const S10_RING = { z0: RING_Z, t0: T_BEGIN, dur: 0.72 };
const ringZ = (t) => RING_Z + 12.3 * easeIn((t - T_BEGIN) / 0.72); // passes the eyes at ~84.06

const FLOOR_F = /* glsl */ `
uniform float uR, uClipZ, uOffZ; uniform vec3 uA, uB; ${FOG_U}
varying vec3 vW; varying float vDepth;
void main() {
  if (vW.z < uClipZ) discard;
  vec2 b = vec2(vW.x, vW.z - uOffZ);
  vec2 cell = floor((b + 1.5) / 3.0);
  float chk = mod(cell.x + cell.y, 2.0);
  float lit = step(length(cell * 3.0), uR);
  vec3 c = lit * (chk > 0.5 ? uA : uB);
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// lathe chess pieces (profiles normalised to height 1)
const PROF = {
  pawn: [[0, 0], [0.42, 0], [0.42, 0.08], [0.3, 0.15], [0.2, 0.5], [0.3, 0.56], [0.13, 0.62], [0.27, 0.74], [0.27, 0.88], [0.13, 0.99], [0, 1]],
  rook: [[0, 0], [0.4, 0], [0.4, 0.08], [0.28, 0.16], [0.24, 0.72], [0.34, 0.76], [0.34, 1], [0, 1]],
  bishop: [[0, 0], [0.38, 0], [0.38, 0.07], [0.24, 0.14], [0.14, 0.58], [0.26, 0.62], [0.12, 0.66], [0.22, 0.8], [0.12, 0.94], [0.05, 1], [0, 1]],
  queen: [[0, 0], [0.38, 0], [0.38, 0.07], [0.24, 0.15], [0.13, 0.66], [0.28, 0.72], [0.16, 0.78], [0.3, 0.92], [0.18, 0.95], [0, 0.97]],
  king: [[0, 0], [0.38, 0], [0.38, 0.07], [0.24, 0.15], [0.14, 0.7], [0.28, 0.75], [0.15, 0.8], [0.27, 0.9], [0, 0.9]],
  knight: [[0, 0], [0.4, 0], [0.4, 0.08], [0.27, 0.16], [0.22, 0.42], [0, 0.42]],
};
const HGT = { pawn: 3, rook: 4.4, knight: 5, bishop: 5.6, queen: 7, king: 8 };
function pieceGeo(type) {
  const pts = PROF[type].map(([r, y]) => new THREE.Vector2(r, y));
  const parts = [{ g: new THREE.LatheGeometry(pts, 9) }];
  if (type === 'king') parts.push({ g: box(0.08, 0.2, 0.08, 0, 1.0, 0) }, { g: box(0.2, 0.06, 0.08, 0, 1.02, 0) });
  if (type === 'queen') parts.push({ g: new THREE.IcosahedronGeometry(0.07, 0).translate(0, 1.0, 0) });
  if (type === 'knight') parts.push({ g: box(0.26, 0.42, 0.5, 0, 0.62, -0.06, -0.35) }, { g: box(0.22, 0.2, 0.36, 0, 0.86, 0.12, 0.25) }, { g: box(0.1, 0.12, 0.1, 0, 0.98, -0.18) });
  const g = merge(parts);
  g.scale(HGT[type] * 0.85, HGT[type], HGT[type] * 0.85);
  return g;
}

function panelDecor() {
  const P = [];
  const z = 0.111;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) {
    const x = c ? 0.47 : -0.47, y = -3.1 + r * 1.42, a = ((r * 7 + c * 3) % 9) / 9 * 2.4 - 1.2;
    P.push({ g: disc(0.27, 12, x, y, z), c: 1 }, { g: ring(0.27, 0.33, 12, x, y, z + 0.002), c: 0 });
    P.push({ g: new THREE.PlaneGeometry(0.04, 0.22).translate(0, 0.1, 0).rotateZ(a).translate(x, y, z + 0.004), c: 0 });
  }
  for (let i = 0; i < 5; i++) P.push({ g: disc(0.085, 8, -0.72 + i * 0.36, 4.35, z), c: 1 });
  for (let i = 0; i < 4; i++) {
    const x = -0.63 + i * 0.42;
    P.push({ g: new THREE.PlaneGeometry(0.22, 0.34).translate(x, -4.25, z), c: 1 });
    P.push({ g: new THREE.PlaneGeometry(0.05, 0.2).translate(x, -4.2 + (i % 2 ? 0.05 : -0.05), z + 0.003), c: 0 });
  }
  P.push({ g: new THREE.PlaneGeometry(1.7, 0.05).translate(0, 3.95, z), c: 1 }, { g: new THREE.PlaneGeometry(1.7, 0.05).translate(0, -3.75, z), c: 1 });
  return merge(P);
}
const KNIGHT = [[-0.45, 0], [0.45, 0], [0.45, 0.08], [0.32, 0.14], [0.3, 0.22], [0.28, 0.3], [0.34, 0.5], [0.36, 0.62], [0.3, 0.78], [0.16, 0.92], [0.05, 1], [-0.02, 0.92], [-0.12, 0.88], [-0.3, 0.74], [-0.44, 0.6], [-0.4, 0.52], [-0.22, 0.56], [-0.08, 0.5], [-0.24, 0.32], [-0.3, 0.22], [-0.32, 0.14], [-0.45, 0.08]];
const KING = [[-0.4, 0], [0.4, 0], [0.4, 0.08], [0.26, 0.15], [0.16, 0.62], [0.3, 0.68], [0.18, 0.74], [0.3, 0.84], [0.04, 0.86], [0.04, 0.92], [0.12, 0.92], [0.12, 0.96], [0.04, 0.96], [0.04, 1.02], [-0.04, 1.02], [-0.04, 0.96], [-0.12, 0.96], [-0.12, 0.92], [-0.04, 0.92], [-0.04, 0.86], [-0.3, 0.84], [-0.18, 0.74], [-0.3, 0.68], [-0.16, 0.62], [-0.26, 0.15], [-0.4, 0.08]];
function backDecor(pts) { return merge([{ g: shape(pts, 3.4, 0, 0.5).rotateY(Math.PI).translate(0, 0, -0.111), c: 1 }]); }

// pieces: [type, x, z, side(0 player gold, 1 enemy black)]
const PIECES = [];
[-12, -9, -6, -3, 3, 6, 9].forEach((x) => PIECES.push(['pawn', x, 0, 0]));
[['rook', -12], ['knight', -9], ['bishop', -6], ['queen', -3], ['king', 0], ['bishop', 3], ['knight', 6], ['rook', 9]].forEach(([k, x]) => PIECES.push([k, x, 4, 0]));
[-12, -9, -6, -3, 0, 3, 6, 9].forEach((x) => PIECES.push(['pawn', x, -18, 1]));
[['rook', -12], ['knight', -9], ['bishop', -6], ['queen', -3], ['king', 0], ['bishop', 3], ['knight', 6], ['rook', 9]].forEach(([k, x]) => PIECES.push([k, x, -22, 1]));

export const S10 = {
  id: 'S10', t0: 76.89, t1: 83.75, world: 'cold', pre: 0, post: 0.32,
  key: [0.5, 0.75, 0.3], fog: { near: 14, far: 95 }, sky: 'black',
  flashes: [{ t: T_LIGHT, color: PAL.crimson, dur: 0.03 }],
  build(kit) {
    const s = {};
    s.root = new THREE.Group(); kit.group.add(s.root);
    s.board = new THREE.Group(); s.root.add(s.board);
    // --- the panel ring
    s.pmat = kit.toon({ ramp: 'world', vertexColors: true });
    const pg = facet(new THREE.BoxGeometry(PW, PH, 0.2));
    const pc = new Float32Array(pg.getAttribute('position').count * 3), pn = pg.getAttribute('normal');
    for (let i = 0; i < pn.count; i++) { const z = pn.getZ(i); const v = z > 0.5 ? 1 : z < -0.5 ? 0.04 : 0.35; pc.set([v, v, v], i * 3); }
    pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
    s.panels = inst(pg, s.pmat, N, 's10-panels');
    s.dmat = kit.flat({ color: PAL.cream, vertexColors: true });
    s.decor = inst(panelDecor(), s.dmat, N, 's10-decor');
    s.backA = inst(backDecor(KNIGHT), kit.flat({ color: PAL.cream }), N / 2);
    s.backB = inst(backDecor(KING), kit.flat({ color: PAL.cream }), N / 2);
    instColors(s.decor); instColors(s.backA); instColors(s.backB);
    s.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    s.root.add(s.panels, s.decor, s.backA, s.backB);
    s.car = WORD_PANELS.map(() => { const g = new THREE.Group(); g.matrixAutoUpdate = false; s.root.add(g); return g; });
    // ceiling (black) and floor (checkerboard shader)
    s.ceil = new THREE.Mesh(new THREE.CircleGeometry(9, 24).rotateX(Math.PI / 2), kit.flat({ color: PAL.black, side: THREE.DoubleSide }));
    s.ceil.position.y = 10.8; s.root.add(s.ceil);
    s.fu = { ...fogUniforms(kit), uR: { value: 0 }, uClipZ: { value: -1e4 }, uOffZ: { value: 0 }, uA: { value: new THREE.Color(PAL.crimson) }, uB: { value: new THREE.Color(PAL.black) } };
    s.floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: s.fu, vertexShader: WORLD_V, fragmentShader: FLOOR_F }));
    s.floor.position.y = FLOOR; s.board.add(s.floor);
    // the red alarm dome lamp (6 m ahead, +12 deg, y 5) with its flat cone and floor pool
    s.lampPos = new THREE.Vector3(0, 5.6, -6);
    s.lamp = new THREE.Group(); s.lamp.position.copy(s.lampPos); s.board.add(s.lamp);
    s.lampMat = kit.flat({ color: PAL.carmineDeep });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), s.lampMat);
    const cap = new THREE.Mesh(merge([{ g: new THREE.CylinderGeometry(1.08, 1.08, 0.22, 14).translate(0, 0.1, 0), c: 0.05 }, { g: box(0.08, 6, 0.08, 0, 3.2, 0), c: 0.03 }]), kit.toon({ ramp: 'black', rim: PAL.gold, vertexColors: true }));
    s.cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6.8, 18, 1, true).translate(0, -3.4, 0), kit.flat({ color: PAL.red, opacity: 0.16, additive: true, side: THREE.DoubleSide }));
    s.pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24).rotateX(-Math.PI / 2), kit.flat({ color: PAL.red, opacity: 0.45, additive: true }));
    s.pool.position.y = FLOOR - 5.6 + 0.03;
    s.lamp.add(dome, cap, s.cone, s.pool);
    // radar sweep wedge
    s.radar = new THREE.Mesh(new THREE.CircleGeometry(15, 10, 0, 0.65).rotateX(-Math.PI / 2), kit.flat({ color: PAL.crimson, opacity: 0.32, additive: true }));
    s.radar.position.y = FLOOR + 0.04; s.board.add(s.radar);
    // chess pieces: one InstancedMesh per type, gold ramp; enemy = near-black via instanceColor, cream rims
    s.pieceMeshes = {}; s.pieceList = [];
    for (const type of Object.keys(HGT)) {
      const list = PIECES.filter((p) => p[0] === type);
      const m = inst(pieceGeo(type), kit.toon({ ramp: 'gold', rim: PAL.cream, rimTh: 0.55 }), list.length, 's10-' + type);
      instColors(m);
      list.forEach((p, i) => { setC(m, i, p[3] ? 0x121012 : 0xffffff); s.pieceList.push({ m, i, type, x: p[1], z: p[2], side: p[3] }); });
      s.pieceMeshes[type] = m; s.board.add(m);
    }
    // the enemy king's two eye dots
    s.eyes = new THREE.Mesh(merge([{ g: disc(0.16, 8, -0.32, 0, 0) }, { g: disc(0.16, 8, 0.32, 0, 0) }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.eyes.position.set(0, FLOOR + 8 * 0.84, -22 + 8 * 0.85 * 0.3); s.board.add(s.eyes);
    // the hatch ring with iris blades and the portal matte
    s.hatch = new THREE.Group(); s.root.add(s.hatch);
    s.hring = new THREE.Mesh(facet(new THREE.TorusGeometry(4, 0.34, 6, 40)), kit.toon({ ramp: 'gold', rim: PAL.cream }));
    const bl = 4.25, bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.Float32BufferAttribute([-bl, 0, 0, 0, 0, 0, bl * Math.cos(Math.PI / 3) - bl, bl * Math.sin(Math.PI / 3), 0], 3));
    bgeo.computeVertexNormals();
    s.blades = inst(bgeo, kit.toon({ ramp: [PAL.velvet, PAL.carmineDeep, PAL.carmine], rim: PAL.gold, side: THREE.DoubleSide }), 6, 's10-iris');
    s.matte = kit.matte({ shape: 'circle', r: 3.72 });
    s.hatch.add(s.hring, s.blades, s.matte);
    // type
    s.tOne = kit.text('ONE RED LIGHT', { cap: 0.95, color: 'gold', near: 77.62, out: 80.9, at: { d: 6, az: 0, y: 3.45 } });
    // one sung word per flip panel: the sentence spins away with its panels; the backs carry the next line
    const fw = kit.words.match('and the whole room spins', 78.54), bw = kit.words.match("that's the second", 81.18);
    ['AND', 'THE', 'WHOLE', 'ROOM', 'SPINS'].forEach((w, k) => {
      const T = kit.text(w, { cap: 1.15, color: 'cream', times: [fw ? fw[k].s : 78.54 + k * 0.4], out: 81.0, parent: s.car[k] });
      fitText(T, 1.9); T.mesh.position.set(0, -2.35, 0.13);
    });
    ["THAT'S", 'THE', 'SECOND'].forEach((w, k) => {
      const T = kit.text(w, { cap: 1.15, color: 'cream', times: [bw ? bw[k].s : 81.18 + k * 0.3], out: 82.7, parent: s.car[k] });
      fitText(T, 1.9); T.mesh.position.set(0, -2.35, -0.13); T.mesh.rotation.y = Math.PI;
    });
    s.tGame = kit.text('THE GAME BEGINS', { cap: 1.25, color: 'gold', near: 82.42, out: 83.62, pop: true, at: { d: 6, az: 0, y: 1.75 } });
    s.prof = kit.travel([[T_BEGIN, 8, 1.2]]);
    return s;
  },
  update(t, s, kit) {
    const hot = t >= T_LIGHT ? 1 : 0;
    const d = s.prof.d(t);
    const pass = ringZ(t) > 0.05;
    s.root.visible = !pass;
    // room light: black until the red lamp, dim cold, then hot
    const light = t < T_RED ? 0 : t < T_LIGHT ? 0.55 : 1;
    s.pmat.uniforms.uBright.value = light;
    s.dmat.uniforms.uColor.value.set(hot ? PAL.gold : PAL.cream);
    s.dmat.uniforms.uBright.value = light;
    // panels: wobble on "room", 540 deg spin ripple on "spins", sink on the downbeat after "That's"
    const m = TMP.m;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      let ph = 0;
      if (t > T_ROOM && t < T_SPIN + 0.6) ph += 0.16 * Math.sin((t - T_ROOM) * 15 + i * 0.9) * Math.exp(-(t - T_ROOM) * 2.5);
      const st = T_SPIN + (((i - WORD_PANELS[0] + N) % N) / N) * 0.4;
      if (t >= st) ph += 3 * Math.PI * easeInOut((t - st) / 0.6);
      const aw = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
      const sk = T_SINK + (1 - aw / Math.PI) * 0.45;
      const y = FLOOR + PH / 2 - 12.5 * easeIn((t - sk) / 0.9);
      const hide = t > sk + 0.95;
      setI(s.panels, i, Math.sin(a) * R, y, -Math.cos(a) * R, 0, -a + ph, 0, hide ? 0 : 1);
      // decor shading follows the panel's facing (hard steps, like the toon ramp)
      const ca = Math.cos(a - ph), sa = Math.sin(a - ph);
      const dn = -0.526 * sa + 0.316 * ca;
      const shF = dn < -0.1 ? 0.22 : dn < 0.45 ? 0.62 : 1, shB = -dn < -0.1 ? 0.22 : -dn < 0.45 ? 0.62 : 1;
      const wk = WORD_PANELS.indexOf(i);
      s.decor.setMatrixAt(i, wk >= 0 ? s.zero : m);
      setC(s.decor, i, 0xffffff, shF);
      const bk = i % 2 ? s.backB : s.backA;
      bk.setMatrixAt(i >> 1, wk >= 0 && wk < 3 ? s.zero : m);
      setC(bk, i >> 1, 0xffffff, shB);
      if (wk >= 0) { s.car[wk].matrix.copy(m); s.car[wk].matrixWorldNeedsUpdate = true; }
    }
    s.panels.instanceMatrix.needsUpdate = true; s.decor.instanceMatrix.needsUpdate = true;
    s.backA.instanceMatrix.needsUpdate = true; s.backB.instanceMatrix.needsUpdate = true;
    s.decor.instanceColor.needsUpdate = true; s.backA.instanceColor.needsUpdate = true; s.backB.instanceColor.needsUpdate = true;
    // ceiling lifts away with the panels
    s.ceil.position.y = 10.8 + 40 * easeIn((t - T_SINK) / 1.2);
    s.ceil.visible = t < T_SINK + 1.2;
    // board travel (only after "begins"), floor lights out radially on the downbeat
    s.board.position.z = d;
    s.fu.uOffZ.value = d;
    s.fu.uR.value = t < T_SINK ? -1 : (t - T_SINK) * 46;
    s.fu.uClipZ.value = t > T_BEGIN + 0.02 ? ringZ(t) : -1e4;
    // lamp
    const on = t >= T_RED;
    s.lampMat.uniforms.uColor.value.set(on ? PAL.red : PAL.carmineDeep);
    s.lampMat.uniforms.uBright.value = on ? 1 + 0.6 * env(t, T_RED, 5) : (t >= 77.62 ? 0.15 : 0);
    s.cone.visible = s.pool.visible = on;
    s.cone.material.uniforms.uOpacity.value = 0.12 + 0.1 * kit.beatEnv(t, 7);
    // radar wedge
    s.radar.visible = t >= T_SWEEP && t < T_SINK + 0.6;
    s.radar.rotation.y = -(t - T_SWEEP) * Math.PI / 2;
    s.radar.material.uniforms.uOpacity.value = 0.32 * (1 - sm(T_SINK, T_SINK + 0.6, t));
    // pieces rise ("the game"), the gold pawn advances and the enemy king looks ("begins")
    for (const p of s.pieceList) {
      const H = HGT[p.type];
      const rt = p.side ? T_GAME + Math.abs(p.x) * 0.012 + (p.z < -20 ? 0.12 : 0) : 82.62 + (p.z > 1 ? 0.15 : 0) + Math.abs(p.x) * 0.01;
      let y = FLOOR - (H + 0.6) * (1 - easeOut((t - rt) / 0.45));
      let z = p.z;
      if (!p.side && p.type === 'pawn' && p.x === 3) z -= 6 * easeInOut((t - T_BEGIN) / 0.45);
      if (p.side) y -= (H + 1) * easeIn((t - 83.55) / 0.3);
      const ry = p.side ? 0 : Math.PI;
      setI(p.m, p.i, p.x, y, z, 0, ry, 0, y < FLOOR - H - 0.5 ? 0 : 1);
    }
    for (const k in s.pieceMeshes) s.pieceMeshes[k].instanceMatrix.needsUpdate = true;
    s.eyes.visible = t >= T_BEGIN && t < 83.8;
    s.eyes.position.y = FLOOR + 8 * 0.8 - 9 * easeIn((t - 83.55) / 0.3);
    s.eyes.material.uniforms.uBright.value = 1.4;
    // hatch ring: rises at z -12, spins open on "begins", flies over the player
    const rz = ringZ(t);
    s.hatch.visible = t > 82.9 && !pass;
    s.hatch.position.set(0, -10 + 11.6 * easeOut((t - 82.9) / 0.46), rz);
    s.hring.rotation.z = t * 0.6 + 2 * easeOut((t - T_BEGIN) / 0.4);
    const open = easeInOut((t - T_BEGIN) / 0.28);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + s.hring.rotation.z;
      setI(s.blades, k, Math.cos(a) * bl(), Math.sin(a) * bl(), 0.02, 0, 0, a + open * 0.9, Math.max(0.0001, 1 - open));
    }
    s.blades.instanceMatrix.needsUpdate = true;
    s.matte.visible = t >= T_BEGIN + 0.03;
    // cradle and world
    if (kit.isOwner) {
      kit.setWorld('hot', hot);
      const rs = kit.rigState;
      rs.dark = t < T_RED ? 1 : t < T_LIGHT ? 0.5 : 0;
      if (t >= T_LIGHT && t < T_LIGHT + 0.25) rs.gauge = 1;
      rs.lampOn = on ? 1 : 0;
      rs.wheelSpin = d / 0.075;
      if (t >= T_LIGHT) kit.setSky({ ...HOT_SKY, rot: t * 0.035, ringPhase: t * 0.12, rays: t < T_SINK ? 0 : sm(T_SINK, T_SINK + 1.0, t), rings: t < T_SINK ? 0 : 1 });
    }
  },
  events() {
    return [
      { t: T_RED, sfx: 'switch', gain: 0.7, haptic: [0.3, 40] },
      { t: T_LIGHT, sfx: 'crack', gain: 0.45, haptic: [0.4, 50] },
      { t: T_SPIN, sfx: 'whoosh', gain: 0.55 },
      { t: T_SINK, sfx: 'drop', gain: 0.6, haptic: [0.35, 60] },
      { t: T_BEGIN, sfx: 'hatch', gain: 0.7, haptic: [0.4, 50] },
    ];
  },
};
function bl() { return 4.25; }
