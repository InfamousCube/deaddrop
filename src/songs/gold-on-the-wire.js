// GOLD ON THE WIRE — Full 2:34 360° VR Set-Piece Show ("I Expect You To Die" style).
//
// Modular & self-contained:
// All 3D set-piece geometry and choreography live in `./gold-stage.js` (`GoldStage`).
// To remove or replace this show, simply swap or edit `./gold-stage.js` and this file.
//
// Choreography Timeline:
//   0.26 "Gold"       wires ignite out of the deck + high-voltage insulator coils rise behind desk
//   1.16 "fire"       the sky outside burns red
//   3.40 "Smile"      wall clock runs in time-lapse + Spy Microfilm Camera Boom swings down
//   7.16 "spy"        spy camera flash bulb fires
//   8.06 "Count..."   clock rewinds to 12; Golden Gyroscope levitates out of the MODEL 7 deck
//  10.46 "don't"      black-and-gold sweep rolls out of the deck
//  12.80–15.46        the bunker trembles as the gyroscope accelerates
//  15.46 (hit)        the bunker shatters into the crimson-and-gold void
//  16.02–17.47        slow-motion hang: "Gold on the Wire" title card glints in the void
//  17.44–23.50        Act I-A: "Black car waiting where the streetlights end" — 1960s Spy GT Coupe + extinguishing streetlamps
//  23.70–28.20        Act I-B: "Champagne silence" — floating crystal/brass champagne coupes & golden bubbles
//  28.30–36.20        Act II:  "Every mirror shows a face I know / Every exit's got a place to go" — 8 rotating mirror monoliths flipping into Vault EXIT doors
//  36.34–47.48        Act III: "Tick, tick, feel the city breathe / Ten floors under..." — 7m Astronomical Clockface, breathing wireframe city & 10-floor elevator shaft
//  47.48–68.50        Act IV (Chorus 1): "Gold on the wire, fire in the sky" — Flight through the 30m Clockwork Cathedral Tunnel of meshing gears & pendulums
//  68.58–85.40        Act V (Verse 2): "Velvet gloves on a steel machine / Waltzing slow through a laser beam / One red light and the whole room spins" — 4.5m Cybernetic Spy Automaton + 16 waltzing ruby lasers
//  85.42–112.50       Act VI (Pre-Chorus 2 & Chorus 2): Bullet-time freeze ("Hold your breath...") + Overdrive Clockwork & Automaton Orrery
// 112.62–127.60       Act VII (Bridge): "Three... two... one... You were never here / Lights out" — 4 Countdown Monoliths + 12-blade Mechanical Camera Iris blackout
// 127.68–153.77       Grand Finale: Iris blasts open into all set-pieces united + final golden title emblem

import { shatterLook } from './shatter.js';
import { sm, hit, env } from './util.js';
import { GoldStage } from './gold-stage.js';

const CUES = {
  ignite: 0.26, fire: 1.16, sweep0: 10.46, sweep1: 12.8, tremble: 12.8, brk: 15.46,
  hang0: 16.02, hang1: 17.47, titleOut: 23.0,
};
const TAU = Math.PI * 2;

export default {
  name: 'gold-on-the-wire',
  cues: CUES,

  begin(ctx) {
    ctx.world.room.scheduleWires(CUES.ignite, 2.7, 7.5);
    const p = ctx.world.room.props;
    this.clock0 = { s: -p.secHand.rotation.z, m: -p.minHand.rotation.z, h: -p.hourHand.rotation.z };
    if (!this.stage) {
      this.stage = new GoldStage(ctx.world.scene);
    }
    this.stage.update(0, ctx, 1);
  },

  look(L, t, ctx) {
    shatterLook(L, t, CUES, ctx.beats);
    const beat = env(ctx.beats.beats, t, 7);
    const down = env(ctx.beats.downbeats, t, 4);

    // Completely dissolve and vanish the entire lobby (room, desk, phone, dispenser, tapes, skyline)
    // right as the song begins so the 360° "I Expect You To Die" show unfolds in a pure graphic void!
    L.hideLobby = sm(0.25, 1.45, t);
    L.void = Math.max(L.void, sm(0.2, 1.2, t));
    L.breakU = Math.max(L.breakU, sm(0.15, 1.4, t) * 1.8);

    // "spy" (7.16s): spy camera flash bulb
    L.flash += hit(t, 7.16, 7) * 1.3;
    L.exposure *= 1 - 0.18 * sm(7.25, 7.5, t) * (1 - sm(7.9, 8.4, t));
    // "zero" (9.48s): chandelier dies until "don't"
    L.lamp0 *= 1 - 0.85 * sm(9.48, 9.53, t) * (1 - sm(10.3, 10.55, t));

    // Keep frontal stage illumination warm and crisp once in the void
    if (t > 1.2) {
      L.lamp1 = 1.35 + beat * 0.35;
      L.window = 1.45 + down * 0.55;
    }

    // Chorus 1 (47.48s), Chorus 2 (95.16s), and Finale (127.68s) ignition flashes
    L.flash += hit(t, 47.48, 5) * 0.75;
    L.flash += hit(t, 68.58, 5) * 0.55;
    L.flash += hit(t, 77.62, 6) * 0.65; // "One red light"
    L.flash += hit(t, 94.04, 5) * 0.75; // "here we go"
    L.flash += hit(t, 95.16, 5) * 0.75;
    L.flash += hit(t, 127.68, 4) * 1.15; // Grand Finale burst

    // "Lights out" (124.94s – 127.65s): mechanical iris shuts and plunges exposure before Finale burst
    const blackout = sm(125.0, 125.55, t) * (1 - sm(127.55, 127.75, t));
    L.exposure *= 1 - blackout * 0.78;

    // Finale title reprise (145.5s – 152.5s): "Gold on the wire... tonight"
    const endTitle = sm(145.5, 146.8, t) * (1 - sm(151.8, 153.2, t));
    if (endTitle > 0) {
      L.title = Math.max(L.title, endTitle);
      L.titleReveal = 1.25;
      L.titleGlint = -0.3 + ((t - 145.5) * 0.45) % 1.6;
    }
    return L;
  },

  frame(t, ctx) {
    if (!this.stage) this.stage = new GoldStage(ctx.world.scene);
    this.stage.update(t, ctx, 1);

    const p = ctx.world.room.props;
    if (t < 3.4) { p.clockOverride = false; return; }
    p.clockOverride = true;
    const c0 = this.clock0 || { s: 0, m: 0, h: 0 };
    const at = (tt) => {
      const d = tt - 3.4;
      const m = c0.m + 0.9 * d * d;
      return { s: c0.s + 14 * d, m, h: c0.h + (m - c0.m) / 12 };
    };
    let a;
    if (t < 8.06) a = at(t);
    else {
      const A = at(8.06);
      const k = sm(8.06, 9.48, t);
      const tgt = (x) => Math.floor(x / TAU) * TAU;
      a = { s: A.s + (tgt(A.s) - A.s) * k, m: A.m + (tgt(A.m) - A.m) * k, h: A.h + (tgt(A.h) - A.h) * k };
    }
    p.secHand.rotation.z = -a.s; p.minHand.rotation.z = -a.m; p.hourHand.rotation.z = -a.h;
  },

  onReturn(k, ctx) {
    if (this.stage) {
      this.stage.update(ctx.songT || 0, ctx, Math.max(0, 1 - k * 1.35));
    }
  },

  end() {
    if (this.stage) this.stage.hide();
  },

  events() {
    return [
      { t: 7.16, sfx: 'shutter', gain: 0.55, at: [0, 1.7, -1.6] },
      { t: 9.48, sfx: 'tick', gain: 1.0, at: [2.37, 1.95, 0.4] },
      { t: 9.50, sfx: 'switch', gain: 0.5, at: [0, 2.3, -0.8] },
      { t: 12.80, haptic: [0.3, 60] },
      { t: 14.02, haptic: [0.45, 80] },
      { t: 15.46, sfx: 'crack', gain: 1.0, haptic: [1, 160] },
      // Act transitions & lyrical accents
      { t: 32.62, sfx: 'pneumatic', gain: 0.55, at: [0, 1.5, -3.5] },
      { t: 36.34, sfx: 'tick', gain: 0.85, at: [0, 1.8, -4.5] },
      { t: 38.74, sfx: 'tick', gain: 0.85, at: [0, 1.8, -4.5] },
      { t: 45.78, sfx: 'switch', gain: 0.7, haptic: [0.6, 90] },
      { t: 47.48, haptic: [0.8, 120] },
      { t: 55.22, sfx: 'shutter', gain: 0.5, at: [0, 1.8, -3.0] },
      { t: 68.58, sfx: 'pneumatic', gain: 0.65, at: [0, 1.6, -4.5], haptic: [0.5, 80] },
      { t: 77.62, sfx: 'ping', gain: 0.75, at: [0, 2.2, -4.5], haptic: [0.7, 100] },
      { t: 85.42, sfx: 'tick', gain: 0.85, at: [0, 1.8, -4.5] },
      { t: 87.02, sfx: 'tick', gain: 0.85, at: [0, 1.8, -4.5] },
      { t: 95.16, haptic: [0.85, 120] },
      { t: 112.62, sfx: 'ping', gain: 0.65, haptic: [0.5, 70] },
      { t: 114.60, sfx: 'ping', gain: 0.65, haptic: [0.5, 70] },
      { t: 115.90, sfx: 'ping', gain: 0.75, haptic: [0.6, 90] },
      { t: 124.94, sfx: 'shutter', gain: 0.85, haptic: [0.7, 100] },
      { t: 127.68, sfx: 'crack', gain: 0.85, haptic: [1.0, 150] },
    ];
  },
};
