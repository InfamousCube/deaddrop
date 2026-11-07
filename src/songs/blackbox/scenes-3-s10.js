// S10 One red light (76.89-83.75, cold, flipped red on "spins"). Clean rework 07.11.
// SHOT CARD
//   beat A 76.89-81.95  hero: ONE red alarm lamp straight ahead over a red floor pool.
//                       supports: an octagon of 8 big plain wall panels (petrol), which flip in a
//                       ripple on "spins" and show crimson backs.
//                       palette: black + petrol, accent red. Motion: lamp on, then the flip. Nothing else.
//   beat B 81.8-83.75   hero: ONE giant black chess king (15 m, gold rim) standing at the right from the cut
//                       (81.8, rising only 2 m, slowly), his two white eyes open on "begins". support: a big-cell
//                       carmine/black board that is there at once (5 m cells, fogged to black by 75 m; no radial sweep).
//                       palette: black + carmine (board, low horizon glow) + one crimson disc behind the king
//                       (so he reads as a big black silhouette, not a thin gold outline), accent gold/white.
//   lyric: one 2-line block straight ahead between lamp and pool (beat A), one 2-line block left of
//          the king (beat B). Out: the board goes out from the rim inward, the eyes stay, hard cut.
//   removed: 24 gauge panels with 300 dials, chess-symbol backs, word-per-panel text, radar wedge,
//            light cone, 31 chess pieces, hatch ring with iris blades and portal matte, 8 m/s travel.
import * as THREE from 'three';
import { PAL } from './style.js';
import { setI, inst, merge, box, disc, fitText, sm, clamp01, easeOut, easeInOut, env, FOG_U, FOG_APPLY, fogUniforms, WORLD_V } from './scenes-3-util.js';

const N = 8, R = 9, PW = 7.3, PH = 13, FLOOR = -1.4;
const T_RED = 77.72, T_LIGHT = 78.06, T_SPIN = 80.18, T_DARK = 81.46, T_BOARD = 81.8, T_GAME = 82.42, T_BEGIN = 83.36, T_OFF = 83.5, T_END = 83.75;
const KING = { x: 7.5, z: -24, h: 15 };

const FLOOR_F = /* glsl */ `
uniform float uR, uRin; uniform vec3 uA, uB; ${FOG_U}
varying vec3 vW; varying float vDepth;
void main() {
  vec2 cell = floor((vW.xz + 2.5) / 5.0);
  float chk = mod(cell.x + cell.y, 2.0);
  float r = length(vW.xz);
  float lit = step(r, uR) * step(uRin, r);
  vec3 c = lit * (chk > 0.5 ? uA : uB);
  ${FOG_APPLY}
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// lathe king (profile normalised to height 1) with a chunky cross
const KING_P = [[0, 0], [0.4, 0], [0.4, 0.08], [0.26, 0.16], [0.15, 0.66], [0.3, 0.72], [0.16, 0.78], [0.28, 0.88], [0, 0.9]];
function kingGeo(h) {
  const g = merge([
    { g: new THREE.LatheGeometry(KING_P.map(([r, y]) => new THREE.Vector2(r, y)), 10) },
    { g: box(0.09, 0.2, 0.09, 0, 0.99, 0) }, { g: box(0.24, 0.07, 0.09, 0, 1.01, 0) },
  ]);
  g.scale(h * 0.85, h, h * 0.85);
  return g;
}

export const S10 = {
  id: 'S10', t0: 76.89, t1: T_END, world: 'cold', pre: 0, post: 0,
  key: [0.5, 0.75, 0.3], fog: { color: PAL.black, near: 14, far: 75 }, sky: 'black',
  flashes: [{ t: T_LIGHT, color: PAL.crimson, dur: 0.03 }],
  build(kit) {
    const s = {};
    s.root = new THREE.Group(); kit.group.add(s.root);
    // --- the octagon room: 8 plain panels, petrol fronts and crimson backs (two thin plates each)
    s.front = inst(new THREE.BoxGeometry(PW, PH, 0.12).translate(0, 0, 0.07), kit.toon({ ramp: [PAL.petrolDeep, PAL.petrol, PAL.teal], rim: PAL.cyan }), N, 's10-front');
    s.back = inst(new THREE.BoxGeometry(PW, PH, 0.12).translate(0, 0, -0.07), kit.toon({ ramp: [PAL.carmineDeep, PAL.carmine, PAL.crimson], rim: PAL.gold }), N, 's10-back');
    s.root.add(s.front, s.back);
    // floor of the room (black) with the lamp's red pool
    s.lampPos = new THREE.Vector3(0, 5.4, -8.5);
    s.pool = new THREE.Mesh(new THREE.CircleGeometry(2.8, 28).rotateX(-Math.PI / 2), kit.flat({ color: PAL.red }));
    s.pool.position.set(0, FLOOR + 0.02, s.lampPos.z);
    // the lamp: a chunky red dome under a black cap on a thick hanger
    s.lampMat = kit.flat({ color: PAL.red });
    s.dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), s.lampMat);
    s.cap = new THREE.Mesh(merge([{ g: new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16).translate(0, 0.12, 0) }, { g: box(0.3, 8, 0.3, 0, 4.2, 0) }]), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }));
    s.dome.position.copy(s.lampPos); s.cap.position.copy(s.lampPos);
    s.root.add(s.pool, s.dome, s.cap);
    // --- the board (shader floor) and the king
    s.fu = { ...fogUniforms(kit), uR: { value: -1 }, uRin: { value: -1 }, uA: { value: new THREE.Color(PAL.carmine) }, uB: { value: new THREE.Color(PAL.black) } };
    s.floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: s.fu, vertexShader: WORLD_V, fragmentShader: FLOOR_F }));
    s.floor.position.y = FLOOR; s.floor.frustumCulled = false;
    s.root.add(s.floor);
    s.king = new THREE.Group(); s.root.add(s.king);
    s.king.add(new THREE.Mesh(kingGeo(KING.h), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.45 })));
    s.eyes = new THREE.Mesh(merge([{ g: disc(0.62, 12, -1.0, 0, 0) }, { g: disc(0.62, 12, 1.0, 0, 0) }]), kit.flat({ color: PAL.white, vertexColors: true }));
    s.eyes.position.set(0, KING.h * 0.8, KING.h * 0.85 * 0.19 + 0.1);
    s.king.add(s.eyes);
    s.king.rotation.y = Math.atan2(-KING.x, -KING.z);
    // --- type: one block per line
    // one short phrase at a time (max 2 lines of about 10 letters, cap 1 m at 7.5 m)
    const at0 = { d: 5, az: 0, y: 1.85 }; // in front of the flipping panels (their edges swing in to 5.35 m)
    s.texts = [
      kit.text('ONE RED LIGHT', { cap: 0.68, color: 'cream', colors: { 1: PAL.red }, near: 77.62, say: 'one red light', outDur: 0.15, out: 78.38, at: at0 }),
      kit.text('AND THE WHOLE\nROOM SPINS', { cap: 0.68, color: 'cream', near: 78.54, say: 'and the whole room spins', outDur: 0.15, out: 80.95, at: at0 }),
      kit.text("THAT'S THE\nSECOND", { cap: 0.68, color: 'gold', near: 81.18, say: "that's the second", outDur: 0.15, out: 82.25, at: { ...at0, az: -22 } }), // left of the king and his disc
      kit.text('THE GAME\nBEGINS', { cap: 1.1, color: 'gold', near: 82.42, say: 'the game begins', outDur: 0.15, out: T_OFF + 0.1, at: { d: 7.5, az: -27, y: 1.7 } }),
    ];
    for (const T of s.texts) fitText(T, 6);
    s.hor = new THREE.Color(); s.hor2 = new THREE.Color(); s.hBlack = new THREE.Color(PAL.black); s.hRed = new THREE.Color(PAL.carmine); s.hDeep = new THREE.Color(PAL.carmineDeep);
    return s;
  },
  update(t, s, kit) {
    // panels: ripple flip on "spins" (each about its own vertical axis), lights out on the downbeat
    const light = t < T_RED ? 0 : 1;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const aw = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) / Math.PI; // 0 ahead, 1 behind
      const st = T_SPIN + aw * 0.35;
      const ph = Math.PI * easeInOut((t - st) / 0.75);
      const dk = 1 - sm(T_DARK + aw * 0.3, T_DARK + aw * 0.3 + 0.12, t);
      const sc = t < T_BOARD ? 1 : 0;
      setI(s.front, i, Math.sin(a) * R, FLOOR + PH / 2, -Math.cos(a) * R, 0, -a + ph, 0, sc);
      setI(s.back, i, Math.sin(a) * R, FLOOR + PH / 2, -Math.cos(a) * R, 0, -a + ph, 0, sc);
      if (i === 0) { s.front.material.uniforms.uBright.value = light * dk * 0.85; s.back.material.uniforms.uBright.value = light * dk; }
    }
    s.front.instanceMatrix.needsUpdate = true; s.back.instanceMatrix.needsUpdate = true;
    // the lamp: dark dome until "red", on with a beat pulse; it goes out with the room
    const on = t >= T_RED && t < T_BOARD;
    s.lampMat.uniforms.uColor.value.set(on ? PAL.red : PAL.carmineDeep);
    s.lampMat.uniforms.uBright.value = (on ? 1 + 0.35 * env(t, T_RED, 4) + 0.15 * kit.beatEnv(t, 7) : 0.25) * (t < T_DARK ? 1 : 1 - sm(T_DARK, T_DARK + 0.12, t));
    s.dome.visible = s.cap.visible = t >= 77.5 && t < T_BOARD;
    s.pool.visible = on && t < T_DARK + 0.12;
    // board: lights radially from the player, goes out from the rim inward at the end
    s.floor.visible = t >= T_BOARD;
    s.fu.uR.value = t >= T_BOARD && t < T_OFF + 0.12 ? 48 : -1; // a cut in and a cut out (the old 45 m/s sweep raced out under the player)
    s.fu.uRin.value = -1;
    // the king stands there from the board cut (81.8) and rises only 2 m (at most 1.9 m/s); eyes open on "begins"
    s.king.visible = t >= T_BOARD;
    s.king.position.set(KING.x, FLOOR - 2 * (1 - sm(T_BOARD, 83.4, t)), KING.z);
    s.eyes.visible = t >= T_BEGIN;
    s.eyes.material.uniforms.uBright.value = 1.2 + 0.6 * env(t, T_BEGIN, 5);
    s.king.children[0].visible = t < T_OFF + 0.12;
    if (kit.isOwner) {
      kit.setWorld('hot', sm(T_SPIN, T_SPIN + 0.8, t));
      kit.rigState.lampOn = on ? 1 : 0;
      // beat B: a low carmine glow on the horizon, so the black king reads as a silhouette
      if (t >= T_BOARD) { const k = sm(T_BOARD, T_BOARD + 0.25, t) * (1 - sm(T_OFF, T_END, t)); s.hor.copy(s.hBlack).lerp(s.hRed, k); s.hor2.copy(s.hBlack).lerp(s.hDeep, k); kit.setSky({ hor: s.hor.getHex(), hor2: s.hor2.getHex(), sunR: t < T_OFF + 0.12 ? 0.24 : 0 /* cut in with the board */, sunCol: PAL.crimson, sunRing: PAL.carmine, focal: [KING.x, FLOOR + 8, KING.z] }); }
    }
  },
  events() {
    return [
      { t: T_RED, sfx: 'switch', gain: 0.7, haptic: [0.3, 40] },
      { t: T_SPIN, sfx: 'whoosh', gain: 0.5 },
      { t: T_DARK, sfx: 'switch', gain: 0.5 },
      { t: T_BEGIN, sfx: 'key', gain: 0.6, haptic: [0.3, 40] },
    ];
  },
};
