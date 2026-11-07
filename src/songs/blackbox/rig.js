// The Linesman's Cradle: the player's vehicle for the whole DD-003 show. It is fixed in rig space
// (where the desk was) and NEVER moves, yaws, rolls or pitches: the worlds move past it. It is the
// reference frame at the bottom of the view, plus the gold wire that runs through every world.
// Also: travel(keys), an analytic eased speed profile so scenes can move their world as a pure
// function of t.
import * as THREE from 'three';
import { PAL, U, mulberry } from './style.js';

export const RIG = {
  deckR: 0.9, deckTop: 0.012, railR: 0.85, railY: 1.0, wireY: 3.4, eyeY: 1.6,
  wireLen: 290, // the wire runs from -wireLen (ahead) to +wireLen (behind)
};

const WIRE_V = /* glsl */ `varying vec3 vW; varying float vDepth;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const WIRE_F = /* glsl */ `
uniform vec3 uCol, uHot; uniform float uOn, uLenF, uLenB, uFade; uniform vec4 uP[6]; // z, amplitude, width, -
varying vec3 vW; varying float vDepth;
void main() {
  if (vW.z < -uLenF || vW.z > uLenB) discard;
  float g = 0.0;
  for (int i = 0; i < 6; i++) g += uP[i].y * step(abs(vW.z - uP[i].x), uP[i].z);
  vec3 c = mix(uCol * uOn, uHot, clamp(g, 0.0, 1.0));
  float far = clamp((vDepth - 60.0) / 200.0, 0.0, 1.0);
  c *= (1.0 - far * 0.55) * uFade;
  if (uOn < 0.002 && g < 0.002) discard;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

// Analytic eased speed profile. keys: [[t, v, ease = 1.2], ...] sorted by t. From each key's t the
// speed eases (smoothstep over `ease` s) from the previous speed to v. Before the first key the
// speed is 0 (or keys[0][1] if keys[0][0] is -Infinity). d(t) = distance since the first key.
export function travel(keys) {
  const K = keys.map(([t, v, e]) => ({ t, v, e: Math.max(0.001, e ?? 1.2) }));
  // segment list: constant-or-easing pieces with their start distances
  const vAt = (t) => {
    let v = 0;
    for (const k of K) {
      if (t < k.t) break;
      const x = Math.min(1, (t - k.t) / k.e);
      v = v + (k.v - v) * x * x * (3 - 2 * x);
    }
    return v;
  };
  // integral of v from K[0].t to t, piecewise exact (smoothstep integral), assuming eases do not overlap
  const d = (t) => {
    if (!K.length || t <= K[0].t) return 0;
    let s = 0, v = 0;
    for (let i = 0; i < K.length; i++) {
      const k = K[i];
      if (t <= k.t) break;
      const tEnd = Math.min(t, i + 1 < K.length ? K[i + 1].t : Infinity);
      const span = tEnd - k.t;
      const easeSpan = Math.min(span, k.e);
      const x = easeSpan / k.e;
      // \int_0^x (v + (v1 - v)(3u^2 - 2u^3)) e du
      s += k.e * (v * x + (k.v - v) * (x * x * x - x * x * x * x / 2));
      if (span > k.e) s += k.v * (span - k.e);
      const xx = Math.min(1, span / k.e);
      v = v + (k.v - v) * xx * xx * (3 - 2 * xx);
    }
    return s;
  };
  return { v: vAt, d };
}

const colOf = (w) => (w === 'cold' ? { edge: PAL.teal, rail: PAL.cyan, lamp: PAL.cyan } : w === 'amber' ? { edge: PAL.amber, rail: PAL.amber, lamp: PAL.amber } : w === 'black' ? { edge: PAL.velvet, rail: PAL.velvet, lamp: PAL.velvet } : { edge: PAL.gold, rail: PAL.gold, lamp: PAL.crimson });

export function buildRig() {
  const group = new THREE.Group();
  group.name = 'bb-rig';
  const mats = [];
  const basic = (c) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 }); mats.push(m); return m; };
  // deck
  const deckMat = basic(PAL.velvet);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(RIG.deckR, RIG.deckR * 0.96, 0.12, 48), deckMat);
  deck.position.y = RIG.deckTop - 0.06;
  const edgeMat = basic(PAL.gold);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(RIG.deckR, 0.018, 4, 64), edgeMat);
  edge.rotation.x = Math.PI / 2; edge.position.y = RIG.deckTop + 0.004;
  // railing + posts
  const railMat = basic(PAL.gold);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(RIG.railR, 0.02, 6, 64), railMat);
  rail.rotation.x = Math.PI / 2; rail.position.y = RIG.railY;
  const postMat = basic(PAL.velvet);
  const posts = new THREE.Group();
  for (const a of [Math.PI * 0.62, Math.PI, Math.PI * 1.38]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, RIG.railY, 6), postMat);
    p.position.set(Math.sin(a) * RIG.railR, RIG.railY / 2, -Math.cos(a) * RIG.railR);
    posts.add(p);
  }
  // hanger: one curved arm from the back of the railing, over the head, to the trolley
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, RIG.railY, RIG.railR), new THREE.Vector3(0, 2.0, 1.08), new THREE.Vector3(0, 2.95, 0.88),
    new THREE.Vector3(0, 3.25, 0.32), new THREE.Vector3(0, RIG.wireY - 0.12, 0.02),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.035, 6, false), postMat);
  const armRimMat = basic(PAL.gold);
  const armRim = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.008, 4, false), armRimMat);
  armRim.position.set(0.032, 0, 0);
  // trolley block with two wheels on the wire
  const trolley = new THREE.Group();
  const blk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.5), postMat);
  blk.position.set(0, RIG.wireY - 0.06, 0);
  trolley.add(blk);
  const hubMat = basic(PAL.gold);
  const wheels = [];
  for (const z of [-0.18, 0.18]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16), postMat);
    w.rotation.z = Math.PI / 2; w.position.set(0, RIG.wireY + 0.02, z);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8), hubMat);
    h.rotation.z = Math.PI / 2; h.position.copy(w.position);
    trolley.add(w, h); wheels.push(w);
  }
  // console with gauge and lamp
  const con = new THREE.Group();
  con.position.set(0, 0.92, -0.62);
  con.rotation.x = -0.55;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.2), postMat);
  const faceMat = basic(PAL.cream);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.065, 24), faceMat);
  face.rotation.x = -Math.PI / 2; face.position.set(-0.06, 0.032, 0);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.002, 0.058), postMat);
  const needlePivot = new THREE.Group();
  needlePivot.position.set(-0.06, 0.036, 0.0);
  needle.position.z = -0.026;
  needlePivot.add(needle);
  const lampMat = basic(PAL.crimson);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 6), lampMat);
  lamp.position.set(0.09, 0.04, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), postMat);
  pole.position.set(0, -0.45, 0.05); pole.rotation.x = 0.55;
  con.add(box, face, needlePivot, lamp, pole);
  // the gold wire: thin tube near, plus a 1 px line so it reaches the horizon
  const wireU = {
    uCol: { value: new THREE.Color(PAL.gold) }, uHot: { value: new THREE.Color(PAL.goldHi) }, uOn: { value: 1 },
    uLenF: { value: RIG.wireLen }, uLenB: { value: RIG.wireLen }, uFade: U.uFade,
    uP: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 1, 0)) },
  };
  const wireMat = new THREE.ShaderMaterial({ uniforms: wireU, vertexShader: WIRE_V, fragmentShader: WIRE_F });
  const wireTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, RIG.wireLen * 2, 6, 1, true), wireMat);
  wireTube.rotation.x = Math.PI / 2; wireTube.position.set(0, RIG.wireY, 0);
  wireTube.frustumCulled = false;
  const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, RIG.wireY, -RIG.wireLen), new THREE.Vector3(0, RIG.wireY, RIG.wireLen)]);
  const wireLine = new THREE.Line(lg, wireMat);
  wireLine.frustumCulled = false;
  const wire = new THREE.Group();
  wire.add(wireTube, wireLine);

  const body = new THREE.Group();
  body.add(deck, edge, rail, posts, arm, armRim, trolley, con);
  group.add(body, wire);
  const cA = new THREE.Color(), cB = new THREE.Color();
  const _rnd = mulberry(7);

  return {
    group, body, wire, wireU, deck, edge, rail, con, needlePivot, lamp,
    // st: { world, worldB, mix (0..1 toward worldB), vis (0..1 body), draw (0..1 deck draw-on),
    //       gauge (0..1), lampOn (0..1), dark (0..1 dims rail/arm rims, keeps the deck edge),
    //       wire: { on, lenF, lenB, pulses: [{ z, a, w }] }, wheelSpin (rad) }
    update(st) {
      const a = colOf(st.world || 'hot'), b = colOf(st.worldB || st.world || 'hot'), m = st.mix ?? 0;
      const vis = st.vis ?? 1, draw = st.draw ?? 1, dark = st.dark ?? 0;
      const set = (mat, ka, op = 1) => { cA.set(a[ka]); cB.set(b[ka]); mat.color.copy(cA).lerp(cB, m).multiplyScalar(U.uFade.value); mat.opacity = op; };
      body.visible = vis > 0.003;
      group.visible = true;
      set(edgeMat, 'edge', vis);
      edge.scale.setScalar(0.25 + 0.75 * Math.min(1, draw * 2));
      deck.visible = draw > 0.5;
      deckMat.opacity = Math.min(1, (draw - 0.5) * 2) * vis;
      deckMat.color.set(PAL.velvet);
      set(railMat, 'rail', vis * (1 - dark * 0.85));
      set(armRimMat, 'rail', vis * (1 - dark));
      set(hubMat, 'rail', vis * (1 - dark * 0.6));
      for (const mm of [postMat]) mm.opacity = vis;
      faceMat.opacity = vis * (1 - dark * 0.7); faceMat.color.set(PAL.cream).multiplyScalar(U.uFade.value);
      set(lampMat, 'lamp', vis); lampMat.color.multiplyScalar(0.35 + 0.65 * (st.lampOn ?? 1));
      needlePivot.rotation.y = 1.05 - 2.1 * Math.min(1, Math.max(0, st.gauge ?? 0));
      const sp = st.wheelSpin ?? 0;
      for (const w of wheels) w.rotation.x = sp;
      // wire
      const W = st.wire || {};
      wire.visible = (W.on ?? 1) > 0.002 || (W.pulses && W.pulses.some((p) => p.a > 0.01));
      wireU.uOn.value = W.on ?? 1;
      wireU.uLenF.value = W.lenF ?? RIG.wireLen;
      wireU.uLenB.value = W.lenB ?? RIG.wireLen;
      const P = W.pulses || [];
      for (let i = 0; i < 6; i++) { const p = P[i]; wireU.uP.value[i].set(p ? p.z : 0, p ? p.a : 0, p ? (p.w ?? 1.2) : 1, 0); }
      void _rnd;
    },
    dispose() { group.traverse((o) => { o.geometry?.dispose?.(); }); for (const mm of mats) mm.dispose(); wireMat.dispose(); },
  };
}
