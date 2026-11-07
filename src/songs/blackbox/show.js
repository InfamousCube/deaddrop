// DD-003 show "black-box": GOLD ON THE WIRE (MistyConifer), 18 worlds strung on one gold wire.
// The tape label says "Black Box"; the song and every title in the show is "Gold on the Wire".
// See STORYBOARD.md (the plan) and API.md (how scene builders plug in).
//
// This file is the scene manager: a time-windowed list of scene objects (scenes-1..4.js). Every
// frame it picks the scene that owns t, sets the world (ramp, rim, fog, key light, sky), updates
// every scene whose window [t0 - pre, t1 + post) contains t, drives the cradle (rig.js) and the
// colour flashes. Everything is a pure function of song time t (seek, FF/REW, return at any time).
// Scenes are prebuilt while the tape is held/inserted (prepare), one per idle slice, and anything
// still missing is built on demand.
import * as THREE from 'three';
import { U, WORLDS, PAL, RAMPS, toon, flat, sceneUniforms, buildDome, mulberry } from './style.js';
import { buildRig, travel, RIG } from './rig.js';
import { makeText, wordIndex } from './type.js';
import * as FX from './fx.js';
import { saltFlat } from './kit.js';
import S1 from './scenes-1.js';
import S2 from './scenes-2.js';
import S3 from './scenes-3.js';
import S4 from './scenes-4.js';

const sm = FX.sm;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const SONG_LEN = 153.771;
// the lobby is fully gone by this song time (fast, so no room/desk debris hangs behind the first title)
export const LOBBY_GONE = 0.7;
// every sung "gold on the wire": a white-gold pulse runs along the wire (from ahead, over the player, away behind)
export const WIRE_PULSES = [0.26, 13.62, 47.48, 59.96, 64.94, 67.36, 95.16, 109.98, 127.68, 141.74, 145.6, 147.34];

const SCENES = [...S1, ...S2, ...S3, ...S4].sort((a, b) => a.t0 - b.t0);

function lastBefore(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }

class BlackBox {
  constructor() {
    this.name = 'black-box';
    this.returnDur = 1.2;
    this.core = null;
    this.active = false;
    this.scenes = SCENES;
    this.lastT = 0;
    this.retT = null;
  }

  // ---------------------------------------------------------------------------------------------
  // build the shared parts once (root, dome, rig, flash shell, glyph atlas)
  buildCore(ctx) {
    if (this.core) return;
    const world = ctx.world;
    this.world = world;
    this.words = wordIndex(ctx.words);
    this.beats = ctx.beats || { beats: [], downbeats: [] };
    const root = new THREE.Group();
    root.name = 'black-box-show';
    root.visible = false;
    this.dome = buildDome();
    this.rig = buildRig();
    // colour flash shell around the head (1-2 frames, covers everything)
    this.flashMat = new THREE.MeshBasicMaterial({ color: PAL.crimson, side: THREE.BackSide, depthTest: false, depthWrite: false, transparent: true });
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 8), this.flashMat);
    this.flash.position.set(0, RIG.eyeY, 0);
    this.flash.renderOrder = 999;
    this.flash.frustumCulled = false;
    this.flash.visible = false;
    // Leo (07.11.): nothing in front of the player during the song, no desk, no console, no
    // cradle. The rig still computes its state (scenes read kit.rigState), but it is never drawn.
    root.add(this.dome.mesh, this.flash);
    world.scene.add(root);
    this.root = root;
    makeText('GOLD ON THE WIRE', { cap: 0.1 }); // builds the glyph atlas now
    this.core = true;
    this.warm(root); // dome, cradle and flash shell programs

  }

  kitFor(sc) {
    const SU = sceneUniforms();
    const group = new THREE.Group();
    group.name = 'bb-' + sc.id;
    group.visible = false;
    const texts = [];
    const self = this;
    const kit = {
      THREE, id: sc.id, t0: sc.t0, t1: sc.t1, group, SU, U, PAL, RAMPS, WORLDS, RIG, FX,
      words: this.words, beats: this.beats.beats || [], downbeats: this.beats.downbeats || [],
      isOwner: false, rigState: null,
      toon: (o) => toon(o, SU),
      flat: (o) => flat(o, SU),
      // in-world type; o.at = { d, az, y } places it facing the player; o.near (+ o.say) = word times from words.json
      text(str, o = {}) {
        const opts = { ...o };
        if (opts.times === undefined && opts.near !== undefined) opts.times = self.words.times(opts.say ?? str.replace(/\n/g, ' '), opts.near);
        const T = makeText(str, opts, SU);
        texts.push(T);
        if (o.at) kit.place(T.mesh, o.at);
        (o.parent || group).add(T.mesh);
        return T;
      },
      // position obj at distance d (m) and azimuth az (deg, + = right) from the player at height y, facing them
      place(obj, at) {
        const a = THREE.MathUtils.degToRad(at.az ?? 0), d = at.d ?? 6;
        obj.position.set(Math.sin(a) * d, at.y ?? RIG.eyeY, -Math.cos(a) * d + (at.z ?? 0));
        if (at.face !== false) obj.rotation.set(THREE.MathUtils.degToRad(at.tilt ?? 0), -a, 0, 'YXZ');
        return obj;
      },
      particles: (o) => FX.particles(kit, o),
      shards: (o) => FX.shards(kit, o),
      edges: (obj, o) => FX.edges(kit, obj, o),
      matte: (o) => FX.matte(kit, o),
      saltFlat: (o) => saltFlat(kit, o),
      travel, rnd: mulberry, sm, clamp01,
      ease: { out: (k) => 1 - Math.pow(1 - clamp01(k), 3), in: (k) => Math.pow(clamp01(k), 3), inOut: (k) => { k = clamp01(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; } },
      fade(k) { SU.uSceneFade.value = clamp01(k); },
      edge(k) { SU.uEdge.value = clamp01(k); },
      // beat helpers
      beatEnv(t, rate = 8) { const b = kit.beats, i = lastBefore(b, t); return i < 0 ? 0 : Math.exp(-(t - b[i]) * rate); },
      downEnv(t, rate = 6) { const b = kit.downbeats, i = lastBefore(b, t); return i < 0 ? 0 : Math.exp(-(t - b[i]) * rate); },
      beatIndex(t) { return lastBefore(kit.beats, t); },
      beatsIn(a, b) { return kit.beats.filter((x) => x >= a && x < b); },
      // sky (only the owner scene should touch it): kit.setSky({ rays, rot, ringPhase, sunR, ... }) or kit.sky.uRays.value[i] = 0
      sky: this.dome.u,
      setSky(over = {}) { self.dome.apply(self.skyBase, over); },
      // world ramp blend for in-scene colour changes (S10 cold -> hot, S16 amber -> hot, S17 hot -> amber)
      // fog override for a mid-scene change (owner only; the manager resets it every frame, so call it every frame)
      setFog(color, near, far) { if (!kit.isOwner) return; if (color !== null && color !== undefined) U.uFogCol.value.set(color); if (near !== undefined) U.uFogNear.value = near; if (far !== undefined) U.uFogFar.value = far; },
      setWorld(name, k = 1) { self.blendWorld(sc.world, name, k); if (kit.rigState) { kit.rigState.worldB = name; kit.rigState.mix = clamp01(k); } },
      _texts: texts,
    };
    return kit;
  }

  ensure(sc) {
    if (sc.built) return;
    sc.kit = this.kitFor(sc);
    sc.SU = sc.kit.SU;
    try {
      sc.state = sc.build(sc.kit) || {};
    } catch (e) {
      console.error('[black-box] build failed', sc.id, e);
      sc.state = { failed: true };
    }
    this.root.add(sc.kit.group);
    sc.built = true;
    this.warmScene(sc);
  }

  // run the scene once at a few of its own times (hidden, as a non-owner) so lazily created state
  // such as instanceColor exists, then compile: the program keys then match the first visible frame
  warmScene(sc) {
    const kit = sc.kit;
    if (!sc.state.failed) {
      const own = kit.isOwner, rs = kit.rigState;
      kit.isOwner = false; kit.rigState = { wire: {} };
      for (const tw of [sc.t0 + 0.05, (sc.t0 + sc.t1) / 2, sc.t1 - 0.05]) {
        try { for (const T of kit._texts) T.update(tw); sc.update(tw, sc.state, kit); } catch (e) { /* reported on its first real frame */ }
      }
      kit.isOwner = own; kit.rigState = rs;
      this._dirty = true; // apply() runs once more so the shared uniforms are the owner's again
    }
    this.warm(kit.group);
  }

  // compile the scene's shaders now (not on its first visible frame)
  warm(obj) {
    try {
      const dd = window.__dd;
      if (dd?.renderer && dd.camera) dd.renderer.compile(obj, dd.camera, this.world.scene);
    } catch (e) { /* not fatal */ }
  }

  // called when the tape is grabbed (preview) or inserted: build everything in idle slices
  prepare(ctx) {
    this.buildCore(ctx);
    if (this._pump) return;
    // the room's break-apart pieces are hidden until the song's first frames: compile their programs now too
    if (!this._roomWarm) { this._roomWarm = true; this.warm(this.world.room.group); }
    const queue = this.scenes.filter((s) => !s.built);
    const step = () => {
      const sc = queue.shift();
      if (!sc) { this._pump = null; return; }
      if (!sc.built) this.ensure(sc);
      this._pump = setTimeout(step, 30);
    };
    this._pump = setTimeout(step, 30);
  }

  begin(ctx) {
    this.prepare(ctx);
    this.ctx = ctx;
    this.active = true;
    this.retT = null;
    U.uFade.value = 1;
    this.root.visible = true;
    this.world.outside.group.visible = false;
    // only what the first frames need (S01); the prebuild pump (or an on-demand build) does the rest
    for (const sc of this.scenes) if (sc.t0 - (sc.pre || 0) < 1) this.ensure(sc);
  }

  // ---------------------------------------------------------------------------------------------
  owner(t) {
    const S = this.scenes;
    if (t < S[0].t0) return S[0];
    for (const s of S) if (t >= s.t0 && t < s.t1) return s;
    return S[S.length - 1];
  }

  blendWorld(a, b, k) {
    const A = WORLDS[a] || WORLDS.hot, B = WORLDS[b] || A;
    const c = new THREE.Color();
    const r = (i, R) => R[Math.min(i, R.length - 1)];
    [U.uW0, U.uW1, U.uW2, U.uW3].forEach((u, i) => { u.value.set(r(i, A.ramp)).lerp(c.set(r(i, B.ramp)), k); });
    U.uWRim.value.set(A.rim).lerp(c.set(B.rim), k);
    U.uFogCol.value.set(A.fog).lerp(c.set(B.fog), k);
  }

  look(L, t) {
    // the lobby (room, desk, case, phone, tapes) breaks apart and sinks in the first 0.7 s (LOBBY_GONE),
    // stays gone for the whole song and rebuilds around the player at the very end
    L.hideLobby = t < 151.8 ? sm(0.05, LOBBY_GONE, t) : 1 - sm(151.8, 153.6, t);
    L.breakU = t < LOBBY_GONE + 0.05 ? 2.4 * sm(0.0, LOBBY_GONE, t) : 0;
    L.stars = 0; L.beams = 0;
    const o = this.core ? this.owner(t) : null;
    if (o?.look) o.look(L, t);
    return L;
  }

  events() {
    const E = [];
    const ev = (t, sfx, gain = 0.8, haptic = null) => E.push({ t, sfx, gain, haptic });
    ev(0.26, 'whoosh', 0.8);
    ev(0.4, 'crack', 0.45, [0.35, 50]);
    ev(151.8, 'rebuild', 0.6);
    for (const sc of this.scenes) if (sc.events) { try { E.push(...sc.events()); } catch (e) { console.error('[black-box] events', sc.id, e); } }
    return E;
  }

  frame(t) {
    this.lastT = t;
    // the room's break (L.breakU) ends with a jump to 0 once the room is hidden; room.applyBreak(0)
    // skips the speaker cones, so settle every piece once with a tiny u (exact reset, any seek order)
    if (t > 0 && t < LOBBY_GONE + 0.05) this._broke = true;
    else if (this._broke && t >= LOBBY_GONE + 0.05) { this.world.room.applyBreak(1e-6); this._broke = false; }
    this.apply(t);
  }

  apply(t) {
    if (!this.core) return;
    this._dirty = false;
    U.uTime.value = t;
    const own = this.owner(t);
    const W = WORLDS[own.world] || WORLDS.hot;
    // world: ramp, rim, fog, key light
    this.blendWorld(own.world, own.world, 0);
    if (own.fog) {
      if (own.fog.color !== undefined) U.uFogCol.value.set(own.fog.color);
      U.uFogNear.value = own.fog.near ?? W.near; U.uFogFar.value = own.fog.far ?? W.far;
    } else { U.uFogNear.value = W.near; U.uFogFar.value = W.far; }
    U.uKey.value.set(...(own.key || [0, 0.6, -0.8])).normalize();
    // sky
    this.skyBase = own.sky === false ? 'black' : (typeof own.sky === 'object' ? { base: W.sky, ...own.sky } : (own.sky || W.sky));
    this.dome.apply(this.skyBase);
    this.dome.mesh.visible = own.sky !== false;
    // rig defaults (the owner scene may change kit.rigState in update)
    const db = this.beats.downbeats || [];
    const di = lastBefore(db, t);
    const gauge = 0.12 + 0.8 * (di < 0 ? 0 : Math.exp(-(t - db[di]) * 5));
    const pulses = [];
    for (const p of WIRE_PULSES) {
      const a = t - p;
      if (a >= 0 && a < 2.2) pulses.push({ z: -140 + a * 90, a: 1, w: 1.6 });
    }
    const rs = {
      world: own.world, worldB: own.world, mix: 0,
      vis: 1 - sm(152.8, 153.4, t), draw: sm(0.05, 0.6, t), dark: 0,
      gauge, lampOn: 0.3 + 0.7 * Math.exp(-(t - (this.beats.beats?.[lastBefore(this.beats.beats || [], t)] ?? -9)) * 6),
      wheelSpin: t * 4,
      wire: { on: 1, lenF: RIG.wireLen, lenB: RIG.wireLen, pulses },
    };
    let flashCol = null;
    for (const sc of this.scenes) {
      const on = t >= sc.t0 - (sc.pre || 0) && t < sc.t1 + (sc.post || 0);
      if (!on) { if (sc.built) sc.kit.group.visible = false; continue; }
      this.ensure(sc);
      const kit = sc.kit;
      kit.group.visible = true;
      kit.isOwner = sc === own;
      kit.rigState = kit.isOwner ? rs : { wire: {} }; // non-owners get a scratch object
      kit.SU.uSceneFade.value = 1;
      kit.SU.uEdge.value = 0;
      for (const T of kit._texts) T.update(t);
      if (sc.state.failed) continue;
      let out = null;
      try { out = sc.update(t, sc.state, kit); } catch (e) { if (!sc._warned) { console.error('[black-box] update failed', sc.id, e); sc._warned = true; } }
      if (out?.flash !== undefined && out.flash !== null) flashCol = out.flash;
      for (const f of sc.flashes || []) if (t >= f.t && t < f.t + (f.dur ?? 0.03)) flashCol = f.color ?? PAL.crimson;
    }
    this.rig.update(rs);
    this.flash.visible = flashCol !== null;
    if (flashCol !== null) this.flashMat.color.set(flashCol);
    // a scene was built on demand during this pass (seek): its dry run may have touched shared state
    if (this._dirty) this.apply(t);
  }

  // B / Y held, the watch gesture, or the song ended: fade everything out (the lobby comes back via L.hideLobby in main.js)
  onReturn(k) {
    if (!this.active) return;
    if (this.retT === null) this.retT = Math.min(SONG_LEN, Math.max(0, this.lastT));
    U.uFade.value = 1 - sm(0, 0.7, k);
    this.apply(this.retT);
    this.flash.visible = false;
    if (k >= 1) this.end();
  }

  end() {
    if (!this.core) return;
    this.active = false;
    this.root.visible = false;
    for (const sc of this.scenes) if (sc.built) sc.kit.group.visible = false;
    this.flash.visible = false;
    this.world.outside.group.visible = true;
    U.uFade.value = 1;
    this.retT = null;
  }
}

export default new BlackBox();
