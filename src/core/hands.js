// Gloved hands: a skinned hand mesh (WebXR Input Profiles "generic-hand", MIT, see
// vendor/hands/LICENSE.md) dressed as black spy-leather gloves with a cuff, plus a watch on the
// left wrist (tap and hold it to leave a song).
//
// Bones follow the WebXR joint layout, so tracked hands drive them 1:1. With controllers the
// fingers are posed by forward kinematics from the bind pose (curl per finger), and the hand is
// aligned to the WebXR grip space: palm against the handle, knuckles along the handle axis.
//
// holdMatrix() says where a held object sits: tapes and cards pinched at their edge between
// thumb and index pads (label towards the thumb), the phone handset wrapped in the fist.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toon, paint, G, Batch, xf } from '../gfx/shade.js';

export const JOINTS = [
  'wrist',
  'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip',
  'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip',
];
const FINGERS = [[5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24]];
const THUMB = [1, 2, 3, 4];
// flex per unit curl at proximal / intermediate / distal joint (radians)
const FLEX = [[0.06, 1.42], [0.06, 1.62], [0.03, 1.02]];
// sample points for desk collision: tips, knuckles, wrist
const COLLIDE = [0, 4, 3, 9, 8, 6, 14, 13, 11, 19, 18, 16, 24, 23, 21];
const TIP_R = [0.009, 0.01, 0.009, 0.009, 0.009, 0.012, 0.009, 0.009, 0.012, 0.009, 0.009, 0.012, 0.008, 0.008, 0.011];

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _o = new THREE.Vector3();

export async function loadHandMeshes(base) {
  const loader = new GLTFLoader();
  const [left, right] = await Promise.all(['left', 'right'].map((s) => loader.loadAsync(base + s + '.glb')));
  return { left: left.scene, right: right.scene };
}

// Curl presets for controllers: [thumbOpp, thumbFlex, index, middle, ring, pinky]
export const POSE = {
  relaxed: [0.3, 0.15, 0.32, 0.5, 0.55, 0.6],
  pinch: [0.95, 0.42, 0.5, 0.86, 0.92, 0.96],
  fist: [0.85, 0.75, 0.8, 0.84, 0.88, 0.92],
};

export class HandModel {
  constructor(side, root, scene) {
    this.side = side;
    this.s = side === 'left' ? -1 : 1;
    this.root = root;
    root.name = 'hand-' + side;
    root.position.set(0, 0, 0); root.quaternion.identity(); root.scale.set(1, 1, 1);
    scene.add(root);
    root.traverse((o) => { if (o.isSkinnedMesh) this.mesh = o; });
    const mesh = this.mesh;
    mesh.frustumCulled = false;
    this.bones = JOINTS.map((n) => root.getObjectByName(n));
    if (this.bones.some((b) => !b)) throw new Error('hand model: bones missing');
    this.restP = this.bones.map((b) => b.position.clone());
    this.restQ = this.bones.map((b) => b.quaternion.clone());
    this._paintGlove();

    // rest-pose frame of the hand (model space)
    const R = this.restP;
    this.n0 = this._palmNormal(R, new THREE.Vector3());
    this.flexAxis = FINGERS.map((ch) => new THREE.Vector3().crossVectors(_v.subVectors(R[ch[4]], R[ch[1]]).normalize(), this.n0).normalize());
    this.along0 = new THREE.Vector3().subVectors(R[11], R[0]).normalize();
    // thumb directions: pick signs that move the thumb tip towards the index finger pad
    const target = new THREE.Vector3().copy(R[8]).addScaledVector(this.n0, 0.02);
    this.oppSign = this._bestSign((a) => this._fk([a, 0, 0, 0, 0, 0]), target);
    this.thumbFlexSign = this._bestSign((a) => this._fk([0.5, a, 0, 0, 0, 0]), target);

    // controller alignment: hand basis (palm normal, knuckle line) -> grip basis, then put the
    // centre of the curled fingers on the handle axis
    const across = new THREE.Vector3().subVectors(R[21], R[6]).normalize(); // index -> pinky knuckle
    const n = this.n0.clone().addScaledVector(across, -this.n0.dot(across)).normalize();
    const al = new THREE.Vector3().crossVectors(n, across).normalize();
    const model = new THREE.Matrix4().makeBasis(n, al, across);
    const gn = new THREE.Vector3(-this.s, 0, 0), gz = new THREE.Vector3(0, 0, 1);
    const grip = new THREE.Matrix4().makeBasis(gn, new THREE.Vector3().crossVectors(gn, gz), gz);
    const rot = grip.multiply(model.transpose());
    // slight forward tilt: Touch controller handles lean forward from the fist axis
    rot.premultiply(_m.makeRotationX(-0.25));
    const fist = this._fk([0.6, 0.5, 0.8, 0.82, 0.85, 0.88]);
    const c = new THREE.Vector3();
    for (const f of [1, 2]) for (let j = 1; j <= 4; j++) c.add(fist.P[FINGERS[f][j]]);
    c.multiplyScalar(1 / 8).applyMatrix4(rot);
    this.ctrlOffset = new THREE.Matrix4().makeTranslation(-c.x + 0.004 * this.s, -c.y + 0.006, -c.z - 0.004).multiply(rot);

    // live pose (world space)
    this.P = this.restP.map((p) => p.clone());
    this.Q = this.restQ.map((q) => q.clone());
    this.curl = POSE.relaxed.slice();
    this.n = this.n0.clone();
    this.visible = false;
    this._buildCuff();
  }

  set visible(v) { this.root.visible = v; this._vis = v; }
  get visible() { return this._vis; }

  _paintGlove() {
    const g = this.mesh.geometry;
    const pos = g.attributes.position, nor = g.attributes.normal;
    const cnt = pos.count;
    const ca = new Float32Array(cnt * 3), ea = new Float32Array(cnt * 4);
    const leather = new THREE.Color(0x2b2420), palm = new THREE.Color(0x1d1815), seam = new THREE.Color(0x5a3a22);
    const wrist = this.restP[0];
    // palm side (normal along the palm normal) a touch darker; a brown welt seam around the wrist opening
    const n0 = this._palmNormal(this.restP, new THREE.Vector3());
    const along = new THREE.Vector3().subVectors(this.restP[11], this.restP[0]).normalize();
    const c = new THREE.Color();
    for (let i = 0; i < cnt; i++) {
      _v.fromBufferAttribute(pos, i);
      _v2.fromBufferAttribute(nor, i);
      const palmSide = THREE.MathUtils.smoothstep(_v2.dot(n0), 0.2, 0.7);
      c.copy(leather).lerp(palm, palmSide);
      const t = _v3.subVectors(_v, wrist).dot(along);
      if (t > 0.004 && t < 0.011) c.lerp(seam, 0.75);
      ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b;
      ea[i * 4] = 0; ea[i * 4 + 1] = 0.42 - palmSide * 0.25; ea[i * 4 + 2] = 0; ea[i * 4 + 3] = 0;
    }
    g.setAttribute('aCol', new THREE.BufferAttribute(ca, 3));
    g.setAttribute('aExtra', new THREE.BufferAttribute(ea, 4));
    this.mesh.material = toon({ sweep: 0 });
  }

  _buildCuff() {
    // wrist joint frame: -Z towards the fingers, +Y out of the back of the hand
    const b = new Batch();
    const leather = 0x1d1815, brass = 0xc9973e;
    b.add(paint(G.cyl(0.029, 0.032, 0.036, 20, true), leather, { gloss: 0.35, m: xf([0, 0.002, 0.024], [Math.PI / 2, 0, 0], [1.12, 1, 0.86]) }));
    b.add(paint(G.torus(0.0335, 0.0022, 6, 24), brass, { gloss: 0.9, m: xf([0, 0.002, 0.008], [0, 0, 0], [1.12, 0.86, 1]) }));
    this.cuff = b.build(toon({ sweep: 0, side: THREE.DoubleSide }));
    this.cuff.frustumCulled = false;
    this.bones[0].add(this.cuff);
    if (this.side !== 'left') return;
    // spy watch on the back of the left wrist: tap and hold the face to leave a song
    const w = new Batch();
    w.add(paint(G.cyl(0.0175, 0.0175, 0.007, 24), brass, { gloss: 0.92, m: xf([0, 0, 0]) }));
    w.add(paint(G.cyl(0.0148, 0.0148, 0.0012, 24), 0x0d0b0c, { gloss: 0.6, m: xf([0, 0.0036, 0]) }));
    w.add(paint(G.box(0.008, 0.004, 0.006), brass, { gloss: 0.9, m: xf([0.019, 0, 0]) })); // crown
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      w.add(paint(G.box(0.0012, 0.001, i % 3 ? 0.002 : 0.0035), 0xe9dcc0, { m: xf([Math.sin(a) * 0.0122, 0.0045, Math.cos(a) * 0.0122], [0, a, 0]) }));
    }
    this.watch = w.build(toon({ sweep: 0 }));
    this.watch.position.set(0, 0.026, 0.026);
    this.bones[0].add(this.watch);
    // red return glyph that lights up while held
    const glyph = new Batch();
    glyph.add(paint(G.torus(0.0078, 0.0013, 6, 20, Math.PI * 1.55), 0xff3020, { glow: 1, m: xf([0, 0.0046, 0], [Math.PI / 2, 0, 0.4]) }));
    glyph.add(paint(G.cone(0.0032, 0.005, 3), 0xff3020, { glow: 1, m: xf([0.0072, 0.0046, -0.0036], [Math.PI / 2, 0, -0.9]) }));
    this.glyphMat = toon({ sweep: 0 });
    this.glyph = glyph.build(this.glyphMat);
    this.watch.add(this.glyph);
    this.setWatch(0, false);
  }

  // k: hold progress 0..1, armed: true while a song plays (the watch only works then)
  setWatch(k, armed) {
    if (!this.glyphMat) return;
    const base = armed ? 0.35 + 0.15 * Math.sin(performance.now() * 0.004) : 0.12;
    this.glyphMat.uniforms.uTint.value.setScalar(base + k * 1.6);
  }

  watchPosition(out) {
    if (!this.watch) return null;
    return this.watch.getWorldPosition(out).addScaledVector(_v.set(0, 1, 0).applyQuaternion(this.watch.getWorldQuaternion(_q)), 0.006);
  }

  _palmNormal(P, out) {
    _v.subVectors(P[11], P[0]);
    _v2.subVectors(P[21], P[6]);
    return out.crossVectors(_v, _v2).normalize().multiplyScalar(this.s);
  }

  _bestSign(fn, target) {
    const a = fn(0.4).P[4].distanceTo(target), b = fn(-0.4).P[4].distanceTo(target);
    return a <= b ? 1 : -1;
  }

  // Forward kinematics in model space from the bind pose. curl = [thumbOpp, thumbFlex, index, middle, ring, pinky]
  _fk(curl, out = null) {
    const P = out ? out.P : this.restP.map((p) => p.clone());
    const Q = out ? out.Q : this.restQ.map((q) => q.clone());
    if (out) for (let i = 0; i < 25; i++) { P[i].copy(this.restP[i]); Q[i].copy(this.restQ[i]); }
    const rot = (chain, j, axis, ang) => {
      if (Math.abs(ang) < 1e-5) return;
      _q.setFromAxisAngle(axis, ang);
      const pv = _v3.copy(P[chain[j]]);
      for (let k = j; k < chain.length; k++) {
        if (k > j) P[chain[k]].sub(pv).applyQuaternion(_q).add(pv);
        Q[chain[k]].premultiply(_q);
      }
    };
    FINGERS.forEach((ch, f) => {
      const c = curl[2 + f];
      for (let j = 1; j <= 3; j++) rot(ch, j, this.flexAxis[f], FLEX[j - 1][0] + FLEX[j - 1][1] * c);
    });
    {
      rot(THUMB, 0, this.along0, (this.oppSign ?? 1) * 0.75 * curl[0]);
      const ta = _x.subVectors(P[4], P[2]).normalize();
      const axis = _y.crossVectors(ta, this.n0).normalize();
      const fs = this.thumbFlexSign ?? 1;
      rot(THUMB, 1, axis, fs * 0.55 * curl[1]);
      rot(THUMB, 2, axis, fs * 0.75 * curl[1]);
    }
    return { P, Q };
  }

  // Controller: pose fingers from curl targets (smoothed), place the hand on the grip.
  poseController(gripMatrix, target, dt) {
    const k = dt > 0 ? 1 - Math.exp(-dt * 22) : 1;
    for (let i = 0; i < 6; i++) this.curl[i] += (target[i] - this.curl[i]) * k;
    this._fk(this.curl, this);
    _m.multiplyMatrices(gripMatrix, this.ctrlOffset);
    _m.decompose(_v, _q, _v2);
    for (let i = 0; i < 25; i++) { this.P[i].applyMatrix4(_m); this.Q[i].premultiply(_q); }
    this._apply();
  }

  // Tracked hand: joints from XR, 1:1.
  poseTracked(jointObjects) {
    for (let i = 0; i < 25; i++) jointObjects[i].matrixWorld.decompose(this.P[i], this.Q[i], _v);
    this._apply();
  }

  // Keep the hand on top of desk surfaces. supportY(x, y, z) -> top of whatever is below.
  // Returns the upward correction applied (metres).
  collide(supportY) {
    let dy = 0;
    for (let i = 0; i < COLLIDE.length; i++) {
      const p = this.P[COLLIDE[i]];
      const top = supportY(p.x, p.y, p.z);
      const pen = top + TIP_R[i] - p.y;
      if (pen > dy) dy = pen;
    }
    if (dy > 0.0005) {
      for (let i = 0; i < 25; i++) this.P[i].y += dy;
      this._apply();
      return dy;
    }
    return 0;
  }

  _apply() {
    for (let i = 0; i < 25; i++) { this.bones[i].position.copy(this.P[i]); this.bones[i].quaternion.copy(this.Q[i]); }
    this.root.updateMatrixWorld(true);
    this._palmNormal(this.P, this.n);
  }

  palmCenter(out) { return out.addVectors(this.P[0], this.P[11]).multiplyScalar(0.5).addScaledVector(this.n, 0.012); }

  // finger pad: between the distal joint and the tip, pushed to the pad side of the joint frame
  _pad(a, b, qi, out) {
    out.lerpVectors(this.P[a], this.P[b], 0.6);
    return out.addScaledVector(_v.set(0, -1, 0).applyQuaternion(this.Q[qi]), 0.006);
  }

  // World matrix for a held item (see header).
  holdMatrix(item, out) {
    const P = this.P;
    if (item.kind === 'phone') {
      // handset across the fist, earpiece cups facing out of the palm
      const c = _v3.set(0, 0, 0);
      for (const f of [1, 2]) for (let j = 1; j <= 4; j++) c.add(P[FINGERS[f][j]]);
      c.multiplyScalar(1 / 8).addScaledVector(this.n, -0.004);
      _x.subVectors(P[6], P[21]).normalize(); // pinky -> index along the knuckles
      _y.copy(this.n).negate();
      _y.addScaledVector(_x, -_y.dot(_x)).normalize();
      _z.crossVectors(_x, _y);
      return out.makeBasis(_x, _y, _z).setPosition(c);
    }
    const ip = this._pad(8, 9, 9, new THREE.Vector3());
    const tp = this._pad(3, 4, 4, new THREE.Vector3());
    const pinch = _v3.addVectors(ip, tp).multiplyScalar(0.5);
    // label faces the thumb
    _z.subVectors(tp, ip);
    const nail = _v2.set(0, 1, 0).applyQuaternion(this.Q[9]);
    if (_z.length() < 0.01) _z.copy(nail).negate(); else _z.normalize().lerp(_v.copy(nail).negate(), 0.35).normalize();
    // held upright by its bottom edge: 'up' runs from the palm out through the pinch,
    // the long side lies across the fingers, the label faces the thumb
    const o = this.palmCenter(_o).negate().add(pinch);
    o.addScaledVector(_z, -o.dot(_z)).normalize();
    _x.crossVectors(o, _z).normalize();
    _y.crossVectors(_z, _x);
    const depth = item.kind === 'card' ? 0.02 : 0.011;
    const half = item.half ? item.half.y : 0.032;
    out.makeBasis(_x, _y, _z);
    return out.setPosition(pinch.addScaledVector(_y, half - depth));
  }
}
