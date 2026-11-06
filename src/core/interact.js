// Grabbing (with smooth glide-into-claw grip pose), throwing, returning home, deck snapping,
// index-finger tactile poking, and whole-hand collision pushing on console switches/buttons.
import * as THREE from 'three';
import { supportY, onConsole } from '../lobby/surfaces.js';

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _ray = new THREE.Ray();
const _box = new THREE.Box3();
const _mw = new THREE.Matrix4();
const _mi = new THREE.Matrix4();
const _s1 = new THREE.Vector3(1, 1, 1);
const GRAVITY = -9.0;
const GLIDE = 0.09; // seconds for a grabbed item to slide into the hand
const PULL = 0.24;  // seconds for a far item to fly into the hand
const FAR = 3.0;    // telekinesis reach (m)
const HOME = new THREE.Vector3(0, 0.86, -0.62);

export class Interact {
  constructor({ input, deck, audio, camera }) {
    this.input = input;
    this.deck = deck;
    this.audio = audio;
    this.camera = camera;
    this.items = [];
    this.enabled = true;
    this.handlers = {};
    this.hover = { left: null, right: null };
    this.pokeLatch = { left: null, right: null };
    this.deckReady = true; // false while a song plays
    this.far = { left: null, right: null };
    this.beams = {};
    for (const side of ['left', 'right']) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
      const b = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xe8b860, dashSize: 0.02, gapSize: 0.016, transparent: true, opacity: 0.75, depthWrite: false }));
      b.frustumCulled = false; b.visible = false; b.renderOrder = 5;
      (input.scene || camera.parent || camera).add(b);
      this.beams[side] = b;
    }
  }
  on(name, fn) { this.handlers[name] = fn; }
  emit(name, ...a) { const f = this.handlers[name]; if (f) return f(...a); }
  add(item) { item.vel = item.vel || new THREE.Vector3(); item.angVel = item.angVel || new THREE.Vector3(); this.items.push(item); }

  heldBy(item) { for (const h of Object.values(this.input.hands)) if (h.holding === item) return h; return null; }
  anyHeldTape() { for (const h of Object.values(this.input.hands)) if (h.holding && h.holding.kind === 'tape') return h.holding; return null; }

  // distance from the snap point; for mouse mode the distance from the ray to the snap point
  _snapDist(item, hand) {
    if (hand.mode === 'mouse') {
      _ray.set(hand.rayOrigin, hand.rayDir);
      return _ray.distanceToPoint(this.deck.snapCenter);
    }
    return Math.min(
      item.group.position.distanceTo(this.deck.snapCenter),
      hand.grip.position.distanceTo(this.deck.snapCenter)
    );
  }

  canSnap(item, hand) {
    return item.kind === 'tape' && this.deckReady && !this.deck.tape && this._snapDist(item, hand) < (hand.mode === 'mouse' ? 0.09 : 0.125);
  }

  // Index fingertip first, then the index knuckle (pushing a lever with the side of the hand)
  _findTouchedKey(h, extraPad = 0) {
    if (!this.deck) return null;
    const kTip = this.deck.keyAt(h.tip, 0.008 + extraPad);
    if (kTip) return kTip;
    if (h.mode !== 'hand' && h.knuckle) return this.deck.keyAt(h.knuckle, 0.01 + extraPad);
    return null;
  }

  update(dt) {
    const hands = this.input.hands;
    // ---- hover + grab + release + physical switch/button poking per hand ----
    for (const side of ['left', 'right']) {
      const h = hands[side];
      if (!h.active || !this.enabled) {
        if (h.holding && !h.active) this._release(h, true);
        this._setHover(side, null);
        this.pokeLatch[side] = null;
        continue;
      }
      if (!h.holding) {
        const cand = this._candidate(h);
        this._setHover(side, cand);
        // nothing in reach: point at something further away and grab to pull it in
        const far = !cand && h.mode !== 'mouse' && h.mode !== 'sim' ? this._farCandidate(h) : null;
        this._setFar(side, far, h);
        if (h.grabDown && (cand || far)) {
          this._setFar(side, null, h);
          this._grab(h, cand || far, !cand);
          continue;
        }
        // grab or trigger on a nearby switch/lever/button
        if ((h.grabDown || h.triggerDown) && !cand && !far && h.mode !== 'mouse' && this.deck) {
          const kDirect = this._findTouchedKey(h, 0.018);
          if (kDirect && this.pokeLatch[side] !== kDirect) {
            this.pokeLatch[side] = kDirect;
            h.haptic(0.38, 22);
            this.emit('key', kDirect.name, h);
          }
        }
      } else {
        this._setHover(side, null);
        this._setFar(side, null, h);
        this._hold(h, h.holding, dt);
        if (h.grabUp) this._release(h, false);
      }

      // Physical index-finger poking & whole-hand collision pushing on switches/buttons/levers
      // Works both with open hand AND when holding squeeze to point with the index finger!
      if (!h.holding && h.mode !== 'mouse' && this.deck) {
        const k = this._findTouchedKey(h, 0);
        if (k && this.pokeLatch[side] !== k) {
          this.pokeLatch[side] = k;
          h.haptic(0.32, 20);
          this.emit('key', k.name, h);
        } else if (this.pokeLatch[side]) {
          // Hysteresis: keep latched until the finger/hand leaves a slightly wider radius
          const stillInside = this._findTouchedKey(h, 0.008);
          if (stillInside !== this.pokeLatch[side]) this.pokeLatch[side] = null;
        }
      }

      // mouse click on keys (no item under the cursor)
      if (h.mode === 'mouse' && h.grabDown && !h.holding && !this.hover[side]) {
        const k = this._rayKey(h);
        if (k) this.emit('key', k.name, h);
      }
    }
    // ---- deck ghost: show when a held tape is close ----
    let near = false;
    for (const h of Object.values(hands)) if (h.holding && this.canSnap(h.holding, h)) near = true;
    if (this.deck) this.deck.state.ghostTarget = near ? 1 : 0;
    if (near !== this._near) { this._near = near; if (near) for (const h of Object.values(hands)) if (h.holding) h.haptic(0.25, 18); }

    // ---- free items: physics + flights ----
    for (const it of this.items) {
      if (this.heldBy(it)) continue;
      if (it.flight) { this._fly(it, dt); continue; }
      if (it.inDeck || it.resting) continue;
      this._physics(it, dt);
    }
  }

  _candidate(h) {
    let best = null, bd = Infinity;
    for (const it of this.items) {
      if (it.flight && it.flight.kind !== 'home') continue;
      if (it.inDeck && !it.ejected) continue;
      let d;
      if (h.mode === 'mouse') {
        _ray.set(h.rayOrigin, h.rayDir);
        it.group.updateMatrixWorld(true);
        _m.copy(it.group.matrixWorld).invert();
        const lr = _ray.clone().applyMatrix4(_m);
        _box.min.copy(it.half).multiplyScalar(-1.3); _box.max.copy(it.half).multiplyScalar(1.3);
        const hit = lr.intersectBox(_box, _v);
        if (!hit) continue;
        d = hit.applyMatrix4(it.group.matrixWorld).distanceTo(h.rayOrigin) * 0.001;
      } else {
        const p = h.mode === 'hand' ? _v2.copy(h.grip.position) : _v2.setFromMatrixPosition(h.grip.matrixWorld);
        d = it.distanceTo(p);
        if (h.knuckle) d = Math.min(d, it.distanceTo(h.knuckle));
        if (h.model && h.model.visible) d = Math.min(d, it.distanceTo(h.palm) + 0.01);
        if (d > 0.062) continue;
      }
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }

  _rayKey(h) {
    // step along the ray and test key boxes
    for (let s = 0.1; s < 2.0; s += 0.004) {
      _v.copy(h.rayOrigin).addScaledVector(h.rayDir, s);
      const k = this.deck.keyAt(_v);
      if (k) return k;
    }
    return null;
  }

  _setHover(side, it) {
    const prev = this.hover[side];
    if (prev === it) return;
    if (prev && prev !== this.hover[side === 'left' ? 'right' : 'left']) prev.setHover(0);
    this.hover[side] = it;
    if (it) { it.setHover(1); this.input.hands[side].haptic(0.12, 10); }
  }

  // Where the hand wants the item, relative to the hand's grip frame.
  _holdOffset(h, it, out) {
    if (h.model && h.model.visible && h.mode !== 'mouse') {
      h.grip.updateMatrixWorld(true);
      h.model.holdMatrix(it, _mw);
      return out.copy(_mi.copy(h.grip.matrixWorld).invert()).multiply(_mw);
    }
    return out.copy(it.offset0);
  }

  _grab(h, it, pulled = false) {
    const other = this.heldBy(it);
    if (other) { other.holding = null; }
    it.flight = null; it.resting = false;
    if (it.inDeck) { it.inDeck = false; it.ejected = false; this.deck.tape = null; this.emit('takeFromDeck', it); }
    h.grip.updateMatrixWorld(true);
    it.group.updateMatrixWorld(true);
    if (h.mode === 'mouse') {
      // present the tape to the camera, label facing the eye
      it.group.quaternion.copy(this.camera.getWorldQuaternion(_q));
      it.group.position.copy(h.grip.position);
      it.group.updateMatrixWorld(true);
    }
    it.offset = new THREE.Matrix4().copy(h.grip.matrixWorld).invert().multiply(it.group.matrixWorld);
    it.offset0 = it.offset.clone();
    it.grabPos0 = new THREE.Vector3(); it.grabQuat0 = new THREE.Quaternion();
    it.offset.decompose(it.grabPos0, it.grabQuat0, _v);
    it.grabDur = pulled ? PULL : GLIDE;
    it.grabT = h.mode === 'mouse' ? 1 : 0;
    it.group.matrixAutoUpdate = true;
    h.holding = it;
    h.haptic(pulled ? 0.3 : 0.5, pulled ? 18 : 30);
    this.audio.oneShot(pulled ? 'whoosh' : 'grab', it.group.position, pulled ? 0.4 : 0.8);
    this.emit('grab', it, h);
  }

  // Glide into the hold pose (fast, ease-out), then follow the hand.
  _hold(h, it, dt) {
    if (h.mode !== 'mouse') {
      const target = this._holdOffset(h, it, _m2);
      target.decompose(_v2, _q2, _v);
      if (it.grabT < 1) {
        it.grabT = Math.min(1, it.grabT + dt / it.grabDur);
        const e = 1 - Math.pow(1 - it.grabT, 3);
        _v3.lerpVectors(it.grabPos0, _v2, e);
        _q.slerpQuaternions(it.grabQuat0, _q2, e);
        it.offset.compose(_v3, _q, _s1);
        if (it.grabT === 1 && it.grabDur === PULL) { h.haptic(0.5, 30); this.audio.oneShot('grab', it.group.position, 0.8); }
      } else if (h.mode === 'hand') {
        // tracked fingers jitter a little: follow the live pinch softly
        it.offset.decompose(_v3, _q, _v);
        const k = 1 - Math.exp(-dt * 28);
        _v3.lerp(_v2, k); _q.slerp(_q2, k);
        it.offset.compose(_v3, _q, _s1);
      } else {
        it.offset.copy(target);
      }
    }
    it.group.matrix.copy(h.grip.matrixWorld).multiply(it.offset);
    it.group.matrix.decompose(it.group.position, it.group.quaternion, _v);
    it.group.scale.set(1, 1, 1);
  }

  // Telekinesis target: the item the hand's pointer ray hits first.
  _farCandidate(h) {
    _ray.set(h.rayOrigin, h.rayDir);
    let best = null, bd = FAR;
    for (const it of this.items) {
      if (it.flight || (it.inDeck && !it.ejected) || this.heldBy(it)) continue;
      it.group.updateMatrixWorld(true);
      _m.copy(it.group.matrixWorld).invert();
      const lr = _ray.clone().applyMatrix4(_m);
      _box.min.copy(it.half).multiplyScalar(-1.6); _box.max.copy(it.half).multiplyScalar(1.6);
      const hit = lr.intersectBox(_box, _v);
      if (!hit) continue;
      const d = hit.applyMatrix4(it.group.matrixWorld).distanceTo(h.rayOrigin);
      if (d > 0.12 && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  _setFar(side, it, h) {
    const prev = this.far[side];
    const beam = this.beams[side];
    if (it) {
      const pos = beam.geometry.attributes.position;
      it.group.getWorldPosition(_v);
      pos.setXYZ(0, h.rayOrigin.x, h.rayOrigin.y, h.rayOrigin.z);
      pos.setXYZ(1, _v.x, _v.y, _v.z);
      pos.needsUpdate = true;
      beam.computeLineDistances();
      beam.visible = true;
    } else beam.visible = false;
    if (prev === it) return;
    if (prev && prev !== this.hover.left && prev !== this.hover.right) prev.setHover(0);
    this.far[side] = it;
    if (it) { it.setHover(0.6); h.haptic(0.08, 8); }
  }

  _release(h, lost) {
    const it = h.holding;
    if (!it) return;
    h.holding = null;
    it.setHover(0);
    if (!lost && this.canSnap(it, h)) {
      this.emit('insert', it, h);
      h.haptic(0.6, 40);
      return;
    }
    // home slot close by: slide back in
    if (!lost && it.home && (it.group.position.distanceTo(it.home.p) < 0.105 || h.grip.position.distanceTo(it.home.p) < 0.095)) {
      this.sendHome(it, 0.22);
      this.emit('release', it, h);
      return;
    }
    if (h.mode === 'mouse' || lost) {
      this.sendHome(it, 0.55);
    } else {
      it.vel.copy(h.velocity).multiplyScalar(1.1);
      if (it.vel.length() > 6) it.vel.setLength(6);
      it.angVel.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4).multiplyScalar(Math.min(1, it.vel.length()));
      it.resting = false; it.restT = 0; it.airT = 0;
    }
    this.emit('release', it, h);
  }

  // Fly an item to a pose along an arc. kind: 'home' | 'deck' | 'custom'
  flyTo(it, p, q, dur = 0.5, kind = 'custom', onDone = null, lift = 0.12) {
    it.flight = { kind, t: 0, dur, p0: it.group.position.clone(), q0: it.group.quaternion.clone(), p1: p.clone(), q1: q.clone(), onDone, lift };
    it.resting = false;
  }
  sendHome(it, dur = 0.6) {
    if (!it.home) return;
    const far = it.group.position.distanceTo(it.home.p);
    if (far > 0.25) this.audio.oneShot('whoosh', it.group.position, 0.5);
    this.flyTo(it, it.home.p, it.home.q, Math.max(dur, Math.min(0.9, far * 0.6)), 'home', () => {
      it.resting = true;
      this.audio.oneShot('drop', it.home.p, 0.5);
    }, Math.min(0.15, far * 0.3));
  }

  _fly(it, dt) {
    const f = it.flight;
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    it.group.position.lerpVectors(f.p0, f.p1, e);
    it.group.position.y += Math.sin(Math.PI * e) * f.lift;
    it.group.quaternion.slerpQuaternions(f.q0, f.q1, e);
    if (k >= 1) {
      it.flight = null;
      it.vel.set(0, 0, 0); it.angVel.set(0, 0, 0);
      if (f.onDone) f.onDone();
    }
  }

  _physics(it, dt) {
    const g = it.group;
    it.vel.y += GRAVITY * dt;
    g.position.addScaledVector(it.vel, dt);
    // spin
    const w = it.angVel.length();
    if (w > 1e-3) { _q.setFromAxisAngle(_v.copy(it.angVel).divideScalar(w), w * dt); g.quaternion.premultiply(_q); }
    // support surface: console tops or floor
    const floor = supportY(g.position.x, g.position.y, g.position.z);
    const onDesk = floor > 0.5 && onConsole(g.position.x, g.position.z);
    // lowest point of the box along world up
    const ext = this._extentY(it);
    it.airT = (it.airT || 0) + dt;
    if (g.position.y - ext < floor) {
      g.position.y = floor + ext;
      if (it.vel.y < -0.6) { this.audio.oneShot('drop', g.position, Math.min(1, -it.vel.y * 0.25)); }
      it.vel.y = -it.vel.y * 0.25;
      it.vel.x *= 0.6; it.vel.z *= 0.6; it.angVel.multiplyScalar(0.5);
      // settle flat: rotate toward the nearest face-down/face-up orientation
      _v.set(0, 0, 1).applyQuaternion(g.quaternion);
      const up = _v.y >= 0 ? 1 : -1;
      _q.setFromUnitVectors(_v, _v2.set(0, up, 0));
      g.quaternion.premultiply(new THREE.Quaternion().slerp(_q, Math.min(1, dt * 14)));
      if (Math.abs(it.vel.y) < 0.15 && it.vel.length() < 0.2) {
        it.restT = (it.restT || 0) + dt;
        if (it.restT > 0.25) {
          it.vel.set(0, 0, 0); it.angVel.set(0, 0, 0);
          if (!onDesk) { it.resting = false; this.sendHome(it, 0.8); } else it.resting = true;
        }
      }
    }
    // lost in space (thrown out of the room / far away): bring it back
    if (g.position.distanceTo(HOME) > 4 || g.position.y < -1 || it.airT > 6) this.sendHome(it, 0.9);
  }

  _extentY(it) {
    it.group.updateMatrixWorld(true);
    const m = it.group.matrixWorld.elements;
    return Math.abs(m[1]) * it.half.x + Math.abs(m[5]) * it.half.y + Math.abs(m[9]) * it.half.z;
  }
}
