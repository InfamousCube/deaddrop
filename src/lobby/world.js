// World: assembles room, outside, desk, case and tapes, and owns the "look" - one set of knobs
// (exposure, void, fire, sweep, light mix, lamps, blind, wires, title) that the intro, the song
// shows and the return animation all drive. Every knob is a plain function of song time.
import * as THREE from 'three';
import { LIGHT, col } from '../gfx/shade.js';
import { titleCard } from '../gfx/textures.js';
import { buildRoom, ROOM } from './room.js';
import { buildOutside } from './outside.js';
import { buildDesk, DECK_POS } from './desk.js';
import { Cassette, buildCase } from './cassette.js';

const C = (h) => new THREE.Color(h);
const PALETTE = {
  lobby: {
    hemiSky: C(0x525e72), hemiGround: C(0x0c1016), key: C(0x505c76), keyDir: new THREE.Vector3(-0.35, 0.75, 0.55).normalize(),
    p0: C(0xffcb88), p1: C(0xffb866), p2: C(0x3a5288),
  },
  void: {
    hemiSky: C(0x4a0c10), hemiGround: C(0x060405), key: C(0xd9a93a), keyDir: new THREE.Vector3(0.25, 0.45, -0.85).normalize(),
    p0: C(0x000000), p1: C(0xffc27a), p2: C(0x8a0c0c),
  },
};

const EXTRA_TAPES = [
  {
    title: 'Copper Line',
    show: 'copper-line', // own show (songs/copper/show.js); the audio stays the shared song id
    preview: { start: 20.1, end: 47.7 },
    label: { paper: '#e6dac0', ink: '#141920', accent: '#a86428', foil: '#e0a527', stripe: '#a86428', catalog: 'DD-002' },
  },
  {
    title: 'Black Box',
    preview: { start: 47.8, end: 76.5 },
    label: { paper: '#d8e0dc', ink: '#0e1318', accent: '#1f5a5e', foil: '#58b89c', stripe: '#d9a93a', catalog: 'DD-003' },
  },
  {
    title: 'Cold Signal',
    preview: { start: 88.0, end: 117.0 },
    label: { paper: '#eadbc2', ink: '#181419', accent: '#c85828', foil: '#d9a93a', stripe: '#c8302a', catalog: 'DD-004' },
  },
];

const TITLE_V = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const TITLE_F = /* glsl */ `
uniform sampler2D map; uniform float uOpacity, uGlint, uReveal, uExposure;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(map, vUv);
  float reveal = smoothstep(uReveal, uReveal - 0.08, abs(vUv.x - 0.5) * 2.0);
  float g = exp(-pow((vUv.x - uGlint) * 9.0 + (vUv.y - 0.5) * 2.5, 2.0));
  vec3 c = t.rgb * (1.0 + g * 1.6) + vec3(1.0, 0.9, 0.7) * g * t.a * 0.35;
  gl_FragColor = vec4(c * uExposure, t.a * uOpacity * reveal);
  #include <colorspace_fragment>
}`;

export class World {
  constructor(scene, songs) {
    this.scene = scene;
    this.songs = songs;
    this.outside = buildOutside();
    this.room = buildRoom();
    const d = buildDesk();
    this.desk = d;
    this.deck = d.deck;
    this.card = d.card;
    this.phone = d.phoneItem;
    this.caseObj = buildCase(songs);
    this.deck.addExtraKeys(this.caseObj.controls);
    scene.add(this.outside.group, this.room.group, d.group, this.caseObj.group, d.handsetGroup);
    this.consoleMod = { redAlert: 0, redAlertTarget: 0, blindClosed: 0, blindTarget: 0, lampOn: 1, wirePulseT: 0 };

    // Populate all slots in the multi-cassette case so the case has multiple real tapes
    const tapeSpecs = [...songs];
    if (songs.length > 0 && tapeSpecs.length < this.caseObj.slotPoses.length) {
      const base = songs[0];
      for (let i = 0; tapeSpecs.length < this.caseObj.slotPoses.length && i < EXTRA_TAPES.length; i++) {
        const ex = EXTRA_TAPES[i];
        const spec = {
          ...base,
          title: ex.title,
          preview: ex.preview,
          label: ex.label,
        };
        if (ex.show) spec.show = ex.show;
        tapeSpecs.push(spec);
      }
    }

    this.tapes = tapeSpecs.map((s, i) => {
      const t = new Cassette(s);
      const pose = this.caseObj.slotPoses[i];
      t.home = { p: pose.p.clone(), q: pose.q.clone() };
      t.group.position.copy(pose.p); t.group.quaternion.copy(pose.q);
      t.kind = 'tape'; t.resting = true;
      scene.add(t.group);
      return t;
    });

    // title card in the void
    this.titleU = { map: { value: null }, uOpacity: { value: 0 }, uGlint: { value: -1 }, uReveal: { value: 1.2 }, uExposure: LIGHT.uExposure };
    this.title = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.575), new THREE.ShaderMaterial({
      uniforms: this.titleU, vertexShader: TITLE_V, fragmentShader: TITLE_F, transparent: true, depthWrite: false,
    }));
    this.title.position.set(0, 1.75, -3.6);
    this.title.renderOrder = 8;
    this.title.visible = false;
    scene.add(this.title);
    this._titleCache = new Map();

    this.look = this.defaultLook();
    this._tmp = new THREE.Color();
  }

  defaultLook() {
    return {
      exposure: 1, void: 0, fire: 0, sweepR: -1, sweepAmt: 0, mix: 0, lamp0: 1, lamp1: 1, window: 1,
      flash: 0, blind: 0, wireFade: 0, wirePulse: 0, title: 0, titleGlint: -1, titleReveal: 1.2,
      breakU: 0, jitter: 0, spinY: 0, stars: 1, beams: 1, hideLobby: 0,
    };
  }

  setTitle(key, lines, foil) {
    const cacheKey = `${key}:${lines?.title || ''}`;
    if (!this._titleCache.has(cacheKey)) this._titleCache.set(cacheKey, titleCard(lines, { foil }));
    this.titleU.map.value = this._titleCache.get(cacheKey);
  }

  // Apply the look to every uniform. t = clock for animated parts (jitter).
  apply(L, t) {
    LIGHT.uExposure.value = L.exposure;
    this.outside.skyU.uExposure.value = L.exposure;
    this.outside.skyU.uVoid.value = L.void;
    this.outside.skyU.uFireAmt.value = L.fire;
    this.outside.skyU.uStars.value = L.stars * (1 - L.void);
    LIGHT.uSweepRadius.value = L.sweepR;
    LIGHT.uSweepAmt.value = L.sweepAmt;
    const A = PALETTE.lobby, B = PALETTE.void, m = L.mix;
    const cm = this.consoleMod;
    const redMix = cm.redAlert * (1 - m);
    LIGHT.uHemiSky.value.copy(A.hemiSky).lerp(C(0x581414), redMix * 0.65).lerp(B.hemiSky, m);
    LIGHT.uHemiGround.value.copy(A.hemiGround).lerp(B.hemiGround, m);
    LIGHT.uKeyColor.value.copy(A.key).lerp(C(0xd83224), redMix * 0.6).lerp(B.key, m);
    LIGHT.uKeyDir.value.copy(A.keyDir).lerp(B.keyDir, m).normalize();
    const lamp0Gain = L.lamp0 * (0.2 + 0.8 * cm.lampOn);
    LIGHT.uPointColor.value[0].copy(A.p0).lerp(C(0xff2a1e), redMix * 0.85).lerp(B.p0, m).multiplyScalar(lamp0Gain);
    LIGHT.uPointColor.value[1].copy(A.p1).lerp(C(0xff2218), redMix * 0.85).lerp(B.p1, m).multiplyScalar(L.lamp1);
    // window light goes red with the fire
    this._tmp.copy(A.p2).lerp(C(0xd8261c), L.fire * 0.8).lerp(B.p2, m);
    LIGHT.uPointColor.value[2].copy(this._tmp).multiplyScalar(L.window);
    LIGHT.uPointColor.value[3].setScalar(L.flash * 2.2);
    LIGHT.uPointPos.value[3].set(0, 1.6, -1.2);
    LIGHT.uPointRange.value[3] = 6;
    LIGHT.uGlowBoost.value = (0.25 + 0.75 * Math.max(L.lamp0, L.mix)) + L.flash + redMix * 0.25;
    // blind (0 = up, 1 = closed)
    const bm = this.room.props.blindMesh;
    const blindVal = Math.max(L.blind, cm.blindClosed * (1 - m));
    bm.scale.y = THREE.MathUtils.clamp(0.06 + 0.94 * blindVal, 0.06, 1);
    // wires
    const wf = Math.max(L.wireFade, cm.wirePulseT * (1 - m));
    this.room.wireU.uFade.value = wf;
    this.room.wireU.uPulse.value = Math.max(L.wirePulse, cm.wirePulseT * 0.6);
    this.room.wireU.uTime.value = t;
    this.room.wireMesh.visible = wf > 0.001;
    // beams + aviation lights fade with the void
    for (const b of this.outside.beams) b.material.uniforms.uAmt.value = L.beams * (1 - L.void);
    // break
    if (L.breakU !== this._lastU || L.jitter > 0 || this._lastJ > 0) this.room.applyBreak(L.breakU, L.jitter, t);
    this._lastU = L.breakU; this._lastJ = L.jitter;
    this.room.group.rotation.y = L.spinY;
    // title
    this.titleU.uOpacity.value = L.title;
    this.titleU.uGlint.value = L.titleGlint;
    this.titleU.uReveal.value = L.titleReveal;
    this.title.visible = L.title > 0.002;
    // skyline sinks into the void
    const hl = L.hideLobby || 0;
    const lobbyVis = hl < 0.995;
    for (const s of this.outside.skyline) {
      s.position.y = -L.void * 6 - hl * 28;
      s.visible = lobbyVis;
    }
    this.outside.moon.material.opacity = this.outside.disc.material.opacity = (1 - L.void) * (1 - hl);
    this.outside.moon.visible = this.outside.disc.visible = L.void < 0.99 && lobbyVis;

    // Completely hide room, desk, cassette dispenser, phone handset and tapes when hideLobby -> 1
    this.room.group.visible = lobbyVis;
    this.desk.group.visible = lobbyVis;
    this.caseObj.group.visible = lobbyVis;
    // the handset is a free item (it can be held), so it only hides; never move it here
    if (this.desk.handsetGroup) this.desk.handsetGroup.visible = lobbyVis && hl < 0.02;
    for (const tp of this.tapes) tp.group.visible = lobbyVis;
    // sink relative to where desk and vault were built (the vault sits at desk height)
    if (!this._baseY) this._baseY = { desk: this.desk.group.position.y, vault: this.caseObj.group.position.y };
    if (hl > 0 && lobbyVis) {
      const sc = Math.max(0.001, 1 - hl);
      const drop = -hl * 1.8;
      this.desk.group.position.y = this._baseY.desk + drop;
      this.desk.group.scale.setScalar(sc);
      this.caseObj.group.position.y = this._baseY.vault + drop;
      this.caseObj.group.scale.setScalar(sc);
    } else if (hl <= 0) {
      this.desk.group.position.y = this._baseY.desk;
      this.desk.group.scale.setScalar(1);
      this.caseObj.group.position.y = this._baseY.vault;
      this.caseObj.group.scale.setScalar(1);
    }
  }

  update(dt, t, levels) {
    const ease = (c, tgt, r) => c + (tgt - c) * (1 - Math.exp(-dt * r));
    const cm = this.consoleMod;
    cm.redAlert = ease(cm.redAlert, cm.redAlertTarget, 5);
    cm.blindClosed = ease(cm.blindClosed, cm.blindTarget, 3.5);
    cm.lampOn = ease(cm.lampOn, this.desk.state.lampOn ? 1 : 0, 12);
    cm.wirePulseT = Math.max(0, cm.wirePulseT - dt * 0.45);
    this.outside.update(dt, t);
    this.room.update(dt, t, levels);
    this.deck.update(dt, levels);
    this.caseObj.update(dt);
    for (const tp of this.tapes) tp.update(dt);
  }

  // ---- intro: the room assembles around the player ----
  introLook(t) {
    const L = this.defaultLook();
    const sm = (a, b, x) => { const k = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
    L.exposure = sm(0, 1.0, t);
    L.void = 1 - sm(3.9, 5.2, t);
    L.mix = 1 - sm(3.6, 5.0, t);
    const a = sm(1.3, 4.3, t);
    L.breakU = 2.4 * (1 - a) * (1 - a * 0.15);
    L.sweepAmt = 1;
    L.sweepR = 9 * (1 - sm(3.7, 4.9, t)) - 0.3;
    L.title = sm(0.3, 1.1, t) * (1 - sm(2.4, 3.1, t));
    L.titleReveal = 0.2 + sm(0.3, 1.4, t) * 1.0;
    L.titleGlint = -0.3 + sm(0.8, 2.4, t) * 1.6;
    // lamps switch on with a flicker
    const on = sm(4.5, 4.62, t);
    const flick = t > 4.5 && t < 5.1 ? (Math.sin(t * 90) > 0.3 ? 1 : 0.35) : 1;
    L.lamp0 = on * flick; L.lamp1 = sm(4.75, 4.85, t);
    L.window = sm(4.0, 5.2, t);
    L.blind = 1 - sm(5.0, 6.4, t);
    L.wireFade = sm(2.6, 3.0, t) * (1 - sm(4.8, 6.0, t));
    L.wirePulse = 0.3;
    L.beams = sm(4.5, 6, t);
    return L;
  }
}

export { DECK_POS, ROOM };
