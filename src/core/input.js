// Input: one Hand per side, fed by Quest controllers, Quest hand tracking, the mouse (desktop
// preview) or a scripted simulator (tests). Both XR modes show the same gloved hand model
// (hands.js); hands stop on the desk instead of passing through it.
//
// Hand tracking: pinch (thumb + index) or a fist grabs, the index fingertip presses buttons,
// pointing at a far object and pinching pulls it into the hand, tapping and holding the watch on
// the left wrist leaves a song.
import * as THREE from 'three';
import { pulse } from './audio.js';
import { HandModel, JOINTS, POSE, loadHandMeshes } from './hands.js';
import { supportY } from '../lobby/surfaces.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const WATCH_R = 0.024;

export class Hand {
  constructor(side) {
    this.side = side;
    this.mode = 'none'; // controller | hand | mouse | sim | none
    this.grip = new THREE.Object3D(); // world-space holding pose
    this.rayOrigin = new THREE.Vector3();
    this.rayDir = new THREE.Vector3(0, 0, -1);
    this.squeeze = 0; this.trigger = 0; this.pinch = 0; this.fist = 0;
    this.grabbing = false; this.grabDown = false; this.grabUp = false;
    this.triggerOn = false; this.triggerDown = false; this.triggerUp = false;
    this.back = false; this.backDown = false; // B / Y, or the wrist watch
    this.stickDown = false;
    this.tip = new THREE.Vector3(); this.tipActive = false; // index fingertip for poking
    this.knuckle = new THREE.Vector3();
    this.palm = new THREE.Vector3();
    this.thumbTip = new THREE.Vector3();
    this.colliding = false;
    this.velocity = new THREE.Vector3();
    this._prev = new THREE.Vector3();
    this.source = null;
    this.thumbTouch = false; this.triggerTouch = false;
    this.model = null; // HandModel, once loaded
    this.holding = null;
  }
  get active() { return this.mode !== 'none'; }
  haptic(intensity = 0.4, ms = 25) { if (this.source) pulse(this.source, intensity, ms); }
  _edges(grabNow, trigNow, backNow) {
    this.grabDown = grabNow && !this.grabbing;
    this.grabUp = !grabNow && this.grabbing;
    this.grabbing = grabNow;
    this.triggerDown = trigNow && !this.triggerOn;
    this.triggerUp = !trigNow && this.triggerOn;
    this.triggerOn = trigNow;
    this.backDown = backNow && !this.back;
    this.back = backNow;
  }
}

// curl targets for the controller hand from buttons and what it holds
function controllerCurl(h) {
  const it = h.holding;
  if (it) return it.kind === 'phone' ? POSE.fist : POSE.pinch;
  const lower = 0.48 + 0.45 * h.squeeze;
  const index = h.triggerTouch || h.trigger > 0.05 ? 0.34 + 0.5 * h.trigger : 0.04;
  const thumbOpp = h.thumbTouch ? 0.62 : 0.3;
  const thumbFlex = h.thumbTouch ? 0.35 : 0.08;
  return [thumbOpp, thumbFlex, index, lower, lower + 0.04, lower + 0.08];
}

export class Input {
  constructor(renderer, rig, scene, camera, dom) {
    this.renderer = renderer;
    this.rig = rig;
    this.scene = scene;
    this.camera = camera;
    this.hands = { left: new Hand('left'), right: new Hand('right') };
    this.models = { left: null, right: null };
    this.collisionEnabled = true; // off while a song plays (the desk is gone)
    this.slots = [0, 1].map((i) => {
      const ctrl = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      const hand = renderer.xr.getHand(i);
      rig.add(ctrl, grip, hand);
      const slot = { i, ctrl, grip, hand, source: null };
      ctrl.addEventListener('connected', (e) => { slot.source = e.data; });
      ctrl.addEventListener('disconnected', () => { slot.source = null; });
      return slot;
    });
    this.mouse = { x: 0, y: 0, down: false, inside: false, ndc: new THREE.Vector2() };
    this.sim = null; // { left: {...}, right: {...} } when scripted
    this.dom = dom;
    this._raycaster = new THREE.Raycaster();
    this.desktop = { yaw: 0, pitch: -0.32, dragging: false, moved: 0 };
    this.watch = { touching: false, armed: false, progress: 0 };
    this._jointObjs = new Array(25);
  }

  async loadHands(base) {
    const meshes = await loadHandMeshes(base);
    for (const side of ['left', 'right']) {
      this.models[side] = new HandModel(side, meshes[side], this.scene);
      this.hands[side].model = this.models[side];
    }
  }

  enableMouse() {
    const d = this.dom;
    const pos = (e) => {
      const r = d.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
      this.mouse.ndc.set((this.mouse.x / r.width) * 2 - 1, -(this.mouse.y / r.height) * 2 + 1);
    };
    d.addEventListener('pointermove', (e) => {
      pos(e);
      if (this.desktop.dragging) {
        this.desktop.yaw -= e.movementX * 0.004;
        this.desktop.pitch = THREE.MathUtils.clamp(this.desktop.pitch - e.movementY * 0.004, -1.2, 1.0);
        this.desktop.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
      }
    });
    d.addEventListener('pointerdown', (e) => {
      pos(e);
      if (e.button === 2) { this.desktop.dragging = true; this.desktop.moved = 0; return; }
      if (e.button === 0) this.mouse.down = true;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.button === 2) this.desktop.dragging = false;
      if (e.button === 0) this.mouse.down = false;
    });
    d.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => { if (e.code === 'KeyB' || e.code === 'Escape') this._keyBack = true; });
    window.addEventListener('keyup', (e) => { if (e.code === 'KeyB' || e.code === 'Escape') this._keyBack = false; });
  }

  update(dt, frame, xrActive) {
    const H = this.hands;
    for (const h of Object.values(H)) h._seen = false;
    if (this.sim) this._updateSim(dt);
    else if (xrActive) this._updateXR(dt, frame);
    else this._updateMouse(dt);
    for (const h of Object.values(H)) {
      if (!h._seen) {
        h.mode = 'none'; h._edges(false, false, false);
        if (h.model) h.model.visible = false;
      }
      h.grip.updateMatrixWorld(true);
      _v.setFromMatrixPosition(h.grip.matrixWorld);
      if (dt > 0) h.velocity.lerp(_v2.subVectors(_v, h._prev).divideScalar(dt), 0.35);
      h._prev.copy(_v);
    }
    this._updateWatch();
  }

  // The right index finger on the left watch counts as holding B / Y.
  _updateWatch() {
    const L = this.models.left, r = this.hands.right;
    let touching = false;
    if (L && L.visible && r.model && r.model.visible && !r.holding) {
      const wp = L.watchPosition(_v);
      if (wp && wp.distanceTo(r.tip) < WATCH_R) touching = true;
    }
    if (touching && !this.watch.touching) { r.haptic(0.3, 20); this.hands.left.haptic(0.3, 20); }
    this.watch.touching = touching;
    if (touching) { r.backDown = r.backDown || !r.back; r.back = true; }
    if (L) L.setWatch(this.watch.progress, this.watch.armed);
  }

  // Place the model, keep it on the desk, derive fingertip/palm points from it.
  _finishModel(h, dy) {
    const m = h.model;
    if (dy > 0) h.grip.position.y += dy;
    h.colliding = dy > 0.002;
    if (h.colliding && !h._wasColliding) h.haptic(0.18, 12);
    h._wasColliding = h.colliding;
    h.tip.copy(m.P[9]);
    h.knuckle.copy(m.P[6]);
    m.palmCenter(h.palm);
    h.thumbTip.copy(m.P[4]);
  }

  _updateXR(dt, frame) {
    for (const slot of this.slots) {
      const src = slot.source;
      if (!src) continue;
      const h = this.hands[src.handedness === 'left' ? 'left' : 'right'];
      h._seen = true;
      h.source = src;
      const m = h.model;
      slot.ctrl.updateMatrixWorld(true);
      h.rayOrigin.setFromMatrixPosition(slot.ctrl.matrixWorld);
      h.rayDir.set(0, 0, -1).transformDirection(slot.ctrl.matrixWorld);
      if (src.hand) {
        h.mode = 'hand';
        const J = slot.hand.joints;
        let ok = !!J;
        if (ok) {
          slot.hand.updateMatrixWorld(true);
          for (let i = 0; i < 25; i++) {
            const j = J[JOINTS[i]];
            if (!j || !j.visible) { ok = false; break; }
            this._jointObjs[i] = j;
          }
        }
        if (!ok || !m) { if (m) m.visible = false; h._edges(false, false, false); continue; }
        m.visible = true;
        m.poseTracked(this._jointObjs);
        const dy = this.collisionEnabled ? m.collide(supportY) : 0;
        // gestures
        const P = m.P;
        const d = P[4].distanceTo(P[9]);
        h.pinch = THREE.MathUtils.clamp(1 - (d - 0.012) / 0.05, 0, 1);
        const pinching = h.grabbing ? d < 0.045 : d < 0.024;
        let curl = 0;
        for (const [tip, prox] of [[14, 11], [19, 16], [24, 21]]) curl += P[tip].distanceTo(P[0]) / Math.max(1e-3, P[prox].distanceTo(P[0]));
        curl /= 3;
        h.fist = THREE.MathUtils.clamp((1.7 - curl) / 0.6, 0, 1);
        const fisting = h.grabbing ? curl < 1.42 : curl < 1.22;
        // hold point: between thumb and index (pinch) or in the fist
        h.grip.position.addVectors(P[4], P[9]).multiplyScalar(0.5);
        if (fisting && !pinching) m.palmCenter(h.grip.position).addScaledVector(m.n, 0.03);
        h.grip.quaternion.copy(m.Q[0]);
        const grab = pinching || fisting;
        h._edges(grab, pinching, false);
        this._finishModel(h, dy);
        h.tipActive = !h.holding;
      } else {
        h.mode = 'controller';
        const gp = src.gamepad;
        const b = gp ? gp.buttons : [];
        h.trigger = b[0]?.value ?? 0;
        h.squeeze = b[1]?.value ?? 0;
        h.triggerTouch = !!b[0]?.touched;
        h.thumbTouch = !!(b[3]?.touched || b[4]?.touched || b[5]?.touched);
        const grab = h.grabbing ? h.squeeze > 0.35 : h.squeeze > 0.6;
        const trig = h.triggerOn ? h.trigger > 0.35 : h.trigger > 0.65;
        h.stickDown = !!b[3]?.pressed;
        h._edges(grab, trig, !!b[5]?.pressed);
        slot.grip.updateMatrixWorld(true);
        slot.grip.matrixWorld.decompose(h.grip.position, h.grip.quaternion, _v);
        if (m) {
          m.visible = true;
          m.poseController(slot.grip.matrixWorld, controllerCurl(h), dt);
          const dy = this.collisionEnabled ? m.collide(supportY) : 0;
          this._finishModel(h, dy);
        } else {
          h.tip.set(0, -0.03, -0.09).applyMatrix4(slot.grip.matrixWorld);
        }
        h.tipActive = h.trigger < 0.55 && !h.holding;
      }
    }
  }

  _updateMouse(dt) {
    const h = this.hands.right;
    h._seen = true;
    h.mode = 'mouse';
    if (h.model) h.model.visible = false;
    if (this.models.left) this.models.left.visible = false;
    this._raycaster.setFromCamera(this.mouse.ndc, this.camera);
    h.rayOrigin.copy(this._raycaster.ray.origin);
    h.rayDir.copy(this._raycaster.ray.direction);
    // held objects float 42 cm in front of the eye along the mouse ray, facing the camera
    h.grip.position.copy(h.rayOrigin).addScaledVector(h.rayDir, 0.42);
    h.grip.quaternion.copy(this.camera.getWorldQuaternion(_q));
    h.tipActive = false;
    h._edges(this.mouse.down, this.mouse.down, !!this._keyBack);
  }

  // Scripted hands for tests: sim[side] = { pos:[x,y,z], quat:[x,y,z,w]?, grab, trigger, back,
  // tip:[x,y,z]?, glove: show the controller hand, curl: [6]? }
  _updateSim(dt) {
    for (const side of ['left', 'right']) {
      const s = this.sim[side];
      const h = this.hands[side];
      if (!s) continue;
      h._seen = true;
      h.mode = 'sim';
      h.grip.position.fromArray(s.pos);
      if (s.quat) h.grip.quaternion.fromArray(s.quat); else h.grip.quaternion.identity();
      h.rayOrigin.copy(h.grip.position);
      h.rayDir.set(0, 0, -1).applyQuaternion(h.grip.quaternion);
      if (s.ray) h.rayDir.fromArray(s.ray).normalize();
      h.squeeze = s.grab ? 1 : 0; h.trigger = s.trigger ? 1 : 0;
      h.triggerTouch = !!s.trigger; h.thumbTouch = !!s.thumb;
      h._edges(!!s.grab, !!s.trigger, !!s.back);
      h.grip.updateMatrixWorld(true);
      const m = h.model;
      if (m && s.glove) {
        m.visible = true;
        m.poseController(h.grip.matrixWorld, s.curl || controllerCurl(h), s.curl ? 0 : dt);
        const dy = this.collisionEnabled ? m.collide(supportY) : 0;
        this._finishModel(h, dy);
      } else if (m) m.visible = false;
      if (s.tip) h.tip.fromArray(s.tip);
      else if (!(m && s.glove)) h.tip.set(0, -0.03, -0.09).applyMatrix4(h.grip.matrixWorld);
      h.tipActive = !h.holding;
    }
  }
}
