// DEAD DROP - listening station.
// States: boot -> intro -> lobby <-> insert -> song -> return -> lobby
import * as THREE from 'three';
import { loadFonts, setAnisotropy } from './gfx/textures.js';
import { AudioEngine } from './core/audio.js';
import { Input } from './core/input.js';
import { Interact } from './core/interact.js';
import { World } from './lobby/world.js';
import { showFor } from './songs/registry.js';
import { sm } from './songs/util.js';

const params = new URLSearchParams(location.search);
const TEST = params.has('test');
const MANUAL = params.has('manual');
const NOINTRO = params.has('nointro');
const AUTOXR = !MANUAL && (params.has('autoxr') || (!TEST && /OculusBrowser|Quest|Pacific|Monterey|Hollywood|Seacliff|Eureka|Panther/i.test(navigator.userAgent)));
if (AUTOXR) document.documentElement.classList.add('autoxr');

const ui = {
  overlay: document.getElementById('overlay'),
  enter: document.getElementById('enter'),
  status: document.getElementById('status'),
  hint: document.getElementById('hint'),
};
const setStatus = (s) => { if (ui.status) ui.status.textContent = s; };

// ---------------------------------------------------------------------------------------------
// Renderer, scene, rig
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: TEST });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 1);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.03, 300);
const rig = new THREE.Group();
rig.name = 'rig';
rig.add(camera);
scene.add(rig);
camera.position.set(0, 1.42, 0.12);

window.addEventListener('resize', () => {
  if (renderer.xr.isPresenting) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const audio = new AudioEngine();
let world, input, interact;
const songs = [];
const songData = new Map(); // id -> { song, words, beats }

// ---------------------------------------------------------------------------------------------
// Game state
const G = {
  state: 'boot',
  t: 0, // time in the current state
  clock: 0,
  song: null, show: null, tape: null,
  songT: 0, // test-mode song clock
  events: [], evIdx: 0,
  lastLook: null, retFrom: null, retDur: 2.8, retReason: '',
  backHold: 0, lidIdle: 0, previewTape: null, pendingPreview: null,
  steps: [],
};
const ctxFor = (id) => ({ world, song: songData.get(id).song, beats: songData.get(id).beats, words: songData.get(id).words, audio });

function setState(s) { G.state = s; G.t = 0; }
function after(sec, fn) { G.steps.push({ at: G.clock + sec, fn }); }

// ---------------------------------------------------------------------------------------------
async function boot() {
  setStatus('loading fonts');
  await loadFonts('fonts/');
  setStatus('loading tapes');
  const idx = await (await fetch('songs/index.json')).json();
  for (const id of idx.songs) {
    const base = `songs/${id}/`;
    const [song, words, beats] = await Promise.all(['song.json', 'words.json', 'beats.json'].map((f) => fetch(base + f).then((r) => r.json())));
    song.url = base + song.audio;
    songs.push(song);
    songData.set(id, { song, words, beats });
  }
  setStatus('building the room');
  world = new World(scene, songs);
  input = new Input(renderer, rig, scene, camera, canvas);
  await input.loadHands('vendor/hands/');
  input.enableMouse();
  interact = new Interact({ input, deck: world.deck, audio, camera });
  for (const t of world.tapes) interact.add(t);
  interact.add(cardItem(world.card));
  if (world.phone) interact.add(world.phone);
  wireInteract();
  world.apply(world.introLook(0), 0);
  renderer.compile(scene, camera);
  setStatus('');
  ui.enter.disabled = false;
  ui.enter.textContent = 'ENTER';
  renderer.setAnimationLoop(MANUAL ? null : frame);
  window.__dd.ready = true;
  if (AUTOXR || (!TEST && !MANUAL)) {
    const xrSupported = AUTOXR || await navigator.xr?.isSessionSupported?.('immersive-vr').catch(() => false);
    if (xrSupported) {
      document.documentElement.classList.add('autoxr');
      start({ xr: true });
    }
  }
}

function cardItem(mesh) {
  const half = new THREE.Vector3(0.08, 0.1075, 0.003);
  return {
    group: mesh, kind: 'card', half, resting: true,
    home: { p: mesh.position.clone(), q: mesh.quaternion.clone() },
    setHover(h) { mesh.material.uniforms.uHover.value = h * 0.7; },
    distanceTo(p) {
      const lp = mesh.worldToLocal(p.clone());
      const q = new THREE.Vector3(Math.abs(lp.x) - half.x, Math.abs(lp.y) - half.y, Math.abs(lp.z) - half.z);
      return new THREE.Vector3(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)).length() + Math.min(Math.max(q.x, q.y, q.z), 0);
    },
  };
}

// ---------------------------------------------------------------------------------------------
// VR session entry: straight into VR when installed as a Quest app, otherwise ENTER
const XR_OPTS = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
let xrRequesting = false;
let pendingXRSession = null;
// Installed Quest app (Meta PWA, immersive mode): launching from the app icon counts as the user
// gesture, so the VR session is requested at once, before the assets load (the gesture expires).
const INSTALLED = !TEST && !MANUAL && (typeof window.getDigitalGoodsService === 'function'
  || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches);
let earlyXR = INSTALLED && navigator.xr?.requestSession
  ? navigator.xr.requestSession('immersive-vr', XR_OPTS).then((s) => {
    s.addEventListener('end', () => { if (pendingXRSession === s) pendingXRSession = null; });
    return s;
  }).catch(() => null)
  : null;
if (!TEST && location.protocol === 'https:' && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

async function requestXR() {
  if (earlyXR) { const s = await earlyXR; earlyXR = null; if (s && !pendingXRSession) pendingXRSession = s; }
  if (renderer.xr.isPresenting || xrRequesting || !navigator.xr) return false;
  xrRequesting = true;
  try {
    // Call requestSession synchronously before any await so transient user activation is preserved
    const session = pendingXRSession || await navigator.xr.requestSession('immersive-vr', XR_OPTS);
    pendingXRSession = null;
    await renderer.xr.setSession(session);
    ui.overlay.classList.add('hidden');
    audio.unlock();
    return true;
  } catch (e) {
    // Quest Browser refuses immersive-vr without a user gesture: show the ENTER button instead of a black page.
    showEnterButton(AUTOXR ? '' : 'VR could not start: ' + e.message);
    return false;
  } finally {
    xrRequesting = false;
  }
}

function showEnterButton(msg) {
  document.documentElement.classList.remove('autoxr');
  ui.overlay.classList.remove('hidden');
  ui.enter.disabled = false;
  ui.enter.textContent = G.state === 'boot' ? 'ENTER' : 'RE-ENTER';
  if (msg) setStatus(msg);
}

async function start({ xr = true } = {}) {
  audio.unlock();
  if (G.state !== 'boot' && G.state !== 'idle') {
    if (xr && !renderer.xr.isPresenting) await requestXR();
    return;
  }
  ui.enter.disabled = true;
  ui.overlay.classList.add('hidden');
  // Initiate requestXR() synchronously before awaiting audio.init()
  const xrPromise = xr ? requestXR() : Promise.resolve(false);
  await audio.init({ muted: TEST });
  // decode tapes in the background (the intro takes long enough)
  for (const s of songs) audio.loadSong(s.id, s.url).then(() => {
    if (G.pendingPreview && G.pendingPreview.id === s.id) { const t = G.pendingPreview; G.pendingPreview = null; if (heldTape() === t) startPreview(t); }
  }).catch((e) => console.error(e));
  await xrPromise;
  audio.startAmbience();
  if (G.state === 'boot') beginIntro();
}

renderer.xr.addEventListener('sessionstart', () => {
  G.recenter = 0; // recenter once the head pose is valid
  ui.overlay.classList.add('hidden');
  audio.unlock();
  const s = renderer.xr.getSession();
  s.addEventListener('visibilitychange', () => {
    if (!audio.ctx) return;
    if (s.visibilityState === 'visible') audio.ctx.resume(); else if (G.state !== 'song') audio.ctx.suspend();
  });
  renderer.xr.getReferenceSpace()?.addEventListener?.('reset', () => { G.recenter = 0; });
});
renderer.xr.addEventListener('sessionend', () => {
  rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0);
  camera.position.set(0, 1.42, 0.12);
  showEnterButton('');
  ui.enter.textContent = 'RE-ENTER';
  G.reenter = true;
});

ui.enter.addEventListener('click', () => {
  if (G.reenter) { G.reenter = false; reenterXR(); return; }
  start({ xr: true });
});
async function reenterXR() {
  await requestXR();
}

if (!TEST && !MANUAL) {
  const onActivateXR = () => {
    audio.unlock();
    if (!window.__dd?.ready) {
      if (!pendingXRSession && !xrRequesting && navigator.xr?.requestSession) {
        xrRequesting = true;
        navigator.xr.requestSession('immersive-vr', XR_OPTS)
          .then((s) => { pendingXRSession = s; })
          .catch(() => {})
          .finally(() => { xrRequesting = false; });
      }
      return;
    }
    if (!renderer.xr.isPresenting) start({ xr: true });
  };
  window.addEventListener('vrdisplayactivate', onActivateXR);
  window.addEventListener('focus', () => { if (AUTOXR && !renderer.xr.isPresenting && window.__dd?.ready) requestXR(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && AUTOXR && !renderer.xr.isPresenting && window.__dd?.ready) requestXR();
  });
  for (const ev of ['pointerdown', 'pointerup', 'mousedown', 'touchstart', 'touchend', 'click', 'keydown']) {
    window.addEventListener(ev, () => {
      audio.unlock();
      if ((AUTOXR || G.reenter) && !renderer.xr.isPresenting && window.__dd?.ready) start({ xr: true });
    }, { passive: true });
  }
}

// Put the player behind the desk, facing the window, wherever they stand in their room.
const _hv = new THREE.Vector3();
const _hq = new THREE.Quaternion();
const _he = new THREE.Euler();
function recenter() {
  const xrCam = renderer.xr.getCamera();
  // head pose in rig space (rig currently identity => reference space)
  rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); rig.updateMatrixWorld(true);
  const pose = renderer.xr.getFrame()?.getViewerPose(renderer.xr.getReferenceSpace());
  if (!pose) return false;
  const p = pose.transform.position, o = pose.transform.orientation;
  _hq.set(o.x, o.y, o.z, o.w);
  _he.setFromQuaternion(_hq, 'YXZ');
  const yaw = _he.y;
  rig.rotation.y = -yaw;
  _hv.set(p.x, 0, p.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);
  rig.position.set(-_hv.x, 0, 0.05 - _hv.z);
  rig.updateMatrixWorld(true);
  void xrCam;
  return true;
}

// ---------------------------------------------------------------------------------------------
// Interaction wiring
function heldTape() { return interact.anyHeldTape(); }

function startPreview(tape) {
  G.previewTape = tape;
  tape.spin = 1;
  if (!audio.songs.has(tape.id)) { G.pendingPreview = tape; return; }
  audio.previewStart(tape.id, tape.song.preview.start, tape.song.preview.end);
}
function stopPreview(fast = false) {
  if (G.previewTape) G.previewTape.spin = 0;
  G.previewTape = null; G.pendingPreview = null;
  audio.previewStop(fast);
}

function wireInteract() {
  interact.on('grab', (it) => {
    if (it.kind === 'phone') {
      world.desk.state.hookLatch = true;
      world.desk.state.telRingT = 0.8;
      audio.oneShot('dtmf', it.group.position, 0.55, 0.8);
      return;
    }
    if (it.kind !== 'tape') return;
    if (G.state === 'lobby' || G.state === 'intro') {
      startPreview(it);
      if (!world.deck.tape && world.deck.state.lidTarget < 1) { world.deck.openLid(true); audio.oneShot('lidOpen', world.deck.snapCenter, 0.7); }
    }
  });
  interact.on('takeFromDeck', () => { world.deck.releaseKeys(); world.deck.state.lampTarget = 0.15; });
  interact.on('release', (it) => {
    if (it.kind === 'phone') {
      world.desk.state.hookLatch = false;
      return;
    }
    if (it.kind !== 'tape') return;
    const other = heldTape();
    if (G.previewTape === it) {
      if (other) startPreview(other); else stopPreview();
    }
  });
  interact.on('insert', (it) => beginInsert(it));
  interact.on('key', (name, h) => onKey(name, h));
}

function onKey(name, h) {
  const deck = world.deck;
  h?.haptic?.(0.35, 20);
  if (name === 'play') {
    audio.oneShot('key', deck.snapCenter, 0.8);
    deck.pressKey('play', G.state === 'lobby' && !!deck.tape);
    if (G.state === 'lobby' && deck.tape) { const t = deck.tape; t.ejected = false; t.inDeck = true; G.tape = t; insertFinish(t, 0.2); }
  } else if (name === 'stop' || name === 'eject') {
    audio.oneShot('key', deck.snapCenter, 0.8);
    deck.pressKey(name);
    if (G.state === 'song') beginReturn('user');
    else if (G.state === 'lobby' && name === 'eject' && deck.tape) ejectTape(deck.tape);
  } else if (name === 'rew' || name === 'ff') {
    audio.oneShot('key', deck.snapCenter, 0.8);
    deck.pressKey(name);
    if (G.state === 'song') seek(name === 'ff' ? 10 : -10);
  } else if (name === 'case-lever' || name === 'case-purge') {
    world.caseObj.triggerEject(name);
    deck.kickVu(0.75);
    audio.oneShot('pneumatic', world.caseObj.group.position, 0.85);
    for (const tp of world.tapes) {
      if (!tp.inDeck && tp.resting && !interact.heldBy(tp)) {
        interact.flyTo(tp, tp.home.p, tp.home.q, 0.28, 'home', () => { tp.resting = true; }, 0.028);
      }
    }
  } else if (name === 'sonar-ping') {
    deck.pressExtra(name);
    audio.oneShot('ping', deck.snapCenter, 0.85);
  } else if (name.startsWith('sw-')) {
    const on = deck.pressExtra(name);
    if (name === 'sw-0') {
      world.consoleMod.redAlertTarget = on ? 1 : 0;
      audio.oneShot('switch', deck.snapCenter, 0.85);
    } else if (name === 'sw-1') {
      world.consoleMod.blindTarget = on ? 1 : 0;
      audio.oneShot('shutter', deck.snapCenter, 0.65);
    } else if (name === 'sw-2') {
      world.consoleMod.wirePulseT = 1.0;
      world.room.scheduleWires(G.clock, G.clock + 0.9, 10);
      audio.oneShot('switch', deck.snapCenter, 0.85);
    }
  } else if (name.startsWith('tel-')) {
    const idx = deck.pressExtra(name);
    const rate = typeof idx === 'number' ? 0.82 + idx * 0.042 : 0.75;
    audio.oneShot('dtmf', deck.snapCenter, 0.75, rate);
  } else if (name === 'morse-key') {
    deck.pressExtra(name);
    audio.oneShot('morse', deck.snapCenter, 0.85);
  } else if (name === 'lamp-toggle') {
    deck.pressExtra(name);
    audio.oneShot('tick', deck.snapCenter, 0.9);
  } else if (name.startsWith('tube-') || name === 'deck-knob') {
    const idx = deck.pressExtra(name);
    audio.oneShot(name === 'deck-knob' ? 'tick' : 'switch', deck.snapCenter, 0.75, 0.92 + (Number(idx) || 0) * 0.07);
  }
}

// ---------------------------------------------------------------------------------------------
// Intro
function beginIntro() {
  setState('intro');
  world.setTitle('dd', { title: 'Dead Drop', sub: 'LISTENING STATION', top: 'MODEL 7' }, '#d9a93a');
  world.room.scheduleWires(2.8, 4.1, 9);
  interact.enabled = false;
  if (NOINTRO) G.t = 7;
  const sfx = [[1.3, 'rebuild', 0.9], [4.5, 'switch', 0.7], [5.0, 'shutter', 0.5]];
  for (const [at, n, g] of sfx) if (!NOINTRO) after(at, () => audio.oneShot(n, null, g));
  after(NOINTRO ? 0 : 3.8, () => audio.ambience(1, 2.5));
}

// ---------------------------------------------------------------------------------------------
// Insert -> song
function beginInsert(tape) {
  const deck = world.deck;
  setState('insert');
  G.tape = tape;
  deck.tape = tape;
  tape.inDeck = true; tape.ejected = false;
  stopPreview(false);
  interact.deckReady = false;
  const above = deck.wellCenter.clone().add(new THREE.Vector3(0, 0.04, 0));
  interact.flyTo(tape, above, deck.wellQuat, 0.17, 'deck', () => {
    interact.flyTo(tape, deck.wellCenter, deck.wellQuat, 0.1, 'deck', () => {
      audio.oneShot('slot', deck.wellCenter, 1);
      for (const h of Object.values(input.hands)) if (h.active) h.haptic(0.5, 35);
    }, 0);
  }, 0.02);
  after(0.42, () => { deck.openLid(false); audio.oneShot('lid', deck.snapCenter, 0.9); });
  insertFinish(tape, 0.85);
}

function insertFinish(tape, delay) {
  const deck = world.deck;
  const song = tape.song;
  G.song = song;
  G.show = showFor(song);
  after(delay, () => {
    deck.pressKey('play', true);
    audio.oneShot('key', deck.snapCenter, 0.9);
    audio.oneShot('motor', deck.snapCenter, 0.6);
    deck.state.spinTarget = 1; deck.state.lampTarget = 1;
    tape.spin = 1;
  });
  after(delay + 0.12, () => {
    if (!audio.songs.has(song.id)) { setStatus('tape still loading'); }
    const ctx = ctxFor(song.id);
    G.show.begin(ctx);
    G.events = G.show.events(ctx).sort((a, b) => a.t - b.t);
    G.evIdx = 0;
    G.songT = -0.12;
    audio.ambience(0.15, 1.2);
    world.setTitle(song.id, { title: song.title, sub: song.artist.toUpperCase(), top: `${song.label.catalog} · SIDE A` }, song.label.foil);
    if (audio.songs.has(song.id)) audio.playSong(song.id, { delay: 0.12 });
    setState('song');
  });
}

function songTime() {
  if (TEST) return G.songT;
  const t = audio.songTime();
  return t < -5 ? G.songT : t;
}

function seek(delta) {
  const song = G.song;
  const t = THREE.MathUtils.clamp(songTime() + delta, 0, song.length - 2);
  if (!TEST) audio.playSong(song.id, { offset: t, delay: 0.02 });
  G.songT = t;
  audio.oneShot(delta > 0 ? 'tapeStart' : 'tapeStop', world.deck.snapCenter, 0.6);
  G.evIdx = G.events.findIndex((e) => e.t > t);
  if (G.evIdx < 0) G.evIdx = G.events.length;
}

function fireEvents(t) {
  while (G.evIdx < G.events.length && G.events[G.evIdx].t <= t) {
    const e = G.events[G.evIdx++];
    if (t - e.t > 0.5) continue; // skipped by a seek
    if (e.sfx) audio.oneShot(e.sfx, e.at ? new THREE.Vector3(...e.at) : null, e.gain ?? 1);
    if (e.haptic) for (const h of Object.values(input.hands)) if (h.active) h.haptic(e.haptic[0], e.haptic[1]);
  }
}

// ---------------------------------------------------------------------------------------------
// Return to the lobby (song ended, STOP/EJECT, or B/Y held)
function beginReturn(reason) {
  if (G.state !== 'song') return;
  G.retReason = reason;
  G.retFrom = { ...G.lastLook };
  // unwind the debris orbit the short way round
  const tau = Math.PI * 2;
  G.retFrom.spinTo = Math.round(G.retFrom.spinY / tau) * tau;
  audio.stopSong(reason === 'end' ? 0.4 : 1.1);
  audio.oneShot('tapeStop', world.deck.snapCenter, 0.8);
  if (G.retFrom.breakU > 0.05) after(0.15, () => audio.oneShot('rebuild', null, 0.9));
  world.deck.releaseKeys();
  world.deck.pressKey('stop');
  world.deck.state.spinTarget = -2.5; // rewind
  if (G.tape) G.tape.spin = -6;
  world.room.scheduleWires(-20, -19, 9); // all seams drawn
  // a show that rebuilds the room itself (onReturn) can ask for its own duration
  G.retDur = G.show?.returnDur ?? (G.retFrom.breakU > 0.05 ? 2.8 : 1.2);
  setState('return');
}

function finishReturn() {
  const deck = world.deck;
  G.show?.end?.();
  world.room.clearWires();
  world.room.props.clockOverride = false;
  world.room.group.rotation.y = 0;
  deck.state.spinTarget = 0;
  deck.state.lampTarget = 0.15;
  if (G.tape) { G.tape.spin = 0; G.tape.setProgress(0); }
  interact.deckReady = true;
  audio.ambience(1, 2);
  setState('lobby');
  after(0.1, () => { if (G.tape) ejectTape(G.tape); });
}

function ejectTape(tape) {
  const deck = world.deck;
  deck.openLid(true);
  deck.pressKey('eject');
  audio.oneShot('lidOpen', deck.snapCenter, 0.8);
  const up = deck.wellCenter.clone().add(new THREE.Vector3(0, 0.026, 0.006));
  const q = deck.wellQuat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.32));
  after(0.18, () => interact.flyTo(tape, up, q, 0.22, 'deck', () => { tape.ejected = true; }, 0.01));
  tape.inDeck = true; deck.tape = tape;
}

function lerpLook(a, b, k) {
  const o = {};
  for (const key of Object.keys(b)) o[key] = typeof b[key] === 'number' && typeof a[key] === 'number' ? a[key] + (b[key] - a[key]) * k : b[key];
  return o;
}

// ---------------------------------------------------------------------------------------------
// Frame
const clock = new THREE.Clock();
function frame(time, xrFrame) { step(Math.min(0.05, clock.getDelta()), xrFrame); }

function step(dt, xrFrame, skipRender = false) {
  if (!world) return;
  G.clock += dt; G.t += dt;
  const xr = renderer.xr.isPresenting;
  if (xr && G.recenter !== undefined && G.recenter < 3) { if (recenter()) G.recenter++; }
  if (!xr) {
    camera.rotation.set(input.desktop.pitch, input.desktop.yaw, 0, 'YXZ');
    if (AUTOXR && !xrRequesting && navigator.getGamepads) {
      const gps = navigator.getGamepads();
      for (let i = 0; i < gps.length; i++) {
        const gp = gps[i];
        if (gp && gp.buttons && gp.buttons.some((b) => b.pressed || b.touched || b.value > 0.25)) {
          start({ xr: true });
          break;
        }
      }
    }
  }
  // scheduled steps
  for (let i = G.steps.length - 1; i >= 0; i--) if (G.clock >= G.steps[i].at) { const s = G.steps[i]; G.steps.splice(i, 1); s.fn(); }

  input.collisionEnabled = G.state !== 'song';
  input.watch.armed = G.state === 'song';
  if (G.state !== 'song') input.watch.progress = 0;
  input.update(dt, xrFrame, xr);
  interact.update(dt);
  const levels = audio.levels || { l: 0, r: 0, low: 0, rms: 0 };

  let L;
  switch (G.state) {
    case 'boot':
    case 'idle':
      L = world.introLook(0);
      break;
    case 'intro': {
      L = world.introLook(G.t);
      if (G.t > 4.6) interact.enabled = true;
      if (G.t > 6.6) { setState('lobby'); world.room.clearWires(); }
      break;
    }
    case 'lobby':
    case 'insert': {
      L = world.defaultLook();
      // preview: the tape in your hand plays its best part, the room listens
      if (G.previewTape && audio.preview) {
        const p = audio.preview, len = p.end - p.start - 1.2;
        const pos = p.start + (((audio.now - p.startedAt) % len) + len) % len;
        G.previewTape.setProgress(pos / G.previewTape.song.length);
        L.lamp0 = 0.92 + levels.low * 0.25;
        L.wirePulse = levels.low;
      }
      // lid closes again when nobody holds a tape
      if (G.state === 'lobby' && !heldTape() && !world.deck.tape && world.deck.state.lidTarget > 0) {
        G.lidIdle += dt;
        if (G.lidIdle > 1.2) { world.deck.openLid(false); audio.oneShot('lid', world.deck.snapCenter, 0.45); G.lidIdle = 0; }
      } else G.lidIdle = 0;
      break;
    }
    case 'song': {
      G.songT += dt;
      const t = songTime();
      const ctx = ctxFor(G.song.id);
      L = G.show.look(world.defaultLook(), t, ctx);
      G.show.frame(t, ctx);
      fireEvents(t);
      if (G.tape) G.tape.setProgress(Math.max(0, t) / G.song.length);
      // hold B / Y to come back
      let back = false;
      for (const h of Object.values(input.hands)) if (h.back) back = true;
      G.backHold = back ? G.backHold + dt : 0;
      if (back && Math.floor(G.backHold * 20) !== Math.floor((G.backHold - dt) * 20)) for (const h of Object.values(input.hands)) if (h.back) h.haptic(0.1 + G.backHold * 0.6, 15);
      if (G.backHold > 0.55) { G.backHold = 0; beginReturn('user'); }
      input.watch.progress = Math.min(1, G.backHold / 0.55);
      if (t >= G.song.length - 0.05 || (audio.play && audio.play.ended && !TEST)) beginReturn('end');
      break;
    }
    case 'return': {
      const k = Math.min(1, G.t / G.retDur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const D = world.defaultLook();
      L = lerpLook(G.retFrom, D, e);
      L.spinY = G.retFrom.spinY + (G.retFrom.spinTo - G.retFrom.spinY) * e;
      L.jitter = 0;
      L.title = G.retFrom.title * (1 - sm(0, 0.25, k));
      L.wireFade = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.9 * (G.retFrom.breakU > 0.05 ? 1 : 0.3);
      L.wirePulse = 0.4;
      if (G.song) G.show?.onReturn?.(e, { ...ctxFor(G.song.id), songT: G.songT });
      if (G.tape) G.tape.setProgress(Math.max(0, (1 - e) * G.tape.progress));
      if (k >= 1) { finishReturn(); L = world.defaultLook(); }
      break;
    }
    default:
      L = world.defaultLook();
  }
  G.lastLook = L;
  world.apply(L, G.state === 'song' ? songTime() : G.clock);
  world.update(dt, G.clock, levels);
  audio.update(dt, camera);
  if (skipRender) scene.updateMatrixWorld();
  else renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------------------------
// Test / debug hooks
window.__dd = {
  ready: false,
  G, THREE,
  get world() { return world; }, get input() { return input; }, get interact() { return interact; }, audio, camera, rig, renderer,
  start: (o) => start(o || { xr: false }),
  pressKey: (name) => onKey(name, null),
  step(dt = 1 / 72, n = 1) { for (let i = 0; i < n; i++) step(dt, null, i < n - 1); },
  sim(s) { input.sim = s; },
  view(pos, yaw, pitch) { camera.position.set(...pos); input.desktop.yaw = yaw; input.desktop.pitch = pitch; },
  seekSong(t) { G.songT = t; G.evIdx = G.events.findIndex((e) => e.t > t); if (G.evIdx < 0) G.evIdx = G.events.length; },
  info() {
    return {
      state: G.state, t: +G.t.toFixed(3), songT: +G.songT.toFixed(3),
      tapes: world.tapes.map((tp) => ({ id: tp.id, inDeck: !!tp.inDeck, ejected: !!tp.ejected, held: !!interact.heldBy(tp), pos: tp.group.position.toArray().map((v) => +v.toFixed(3)) })),
      lid: +world.deck.state.lidOpen.toFixed(2), preview: !!audio.preview, playing: !!audio.play,
      breakU: +(G.lastLook?.breakU ?? 0).toFixed(3), xr: renderer.xr.isPresenting,
    };
  },
};

boot().catch((e) => { console.error(e); setStatus('Error: ' + e.message); });
