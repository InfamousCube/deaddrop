// The shatter show, parameterised by cue times (song seconds):
//   ignite  - gold wires race out of the deck along the cut lines
//   fire    - the sky outside catches fire
//   sweep0..sweep1 - the black-and-gold material sweep rolls out from the deck
//   tremble - the room starts to shake
//   brk     - the room shatters
//   hang0..hang1 - slow-motion hang (the song's silence), title card appears
// Every value is a pure function of t, so shows can seek and run backwards.
import { sm, easeIn, env, hit } from './util.js';

export function breakTime(t, c) {
  if (t < c.brk) return 0;
  const a = Math.min(t, c.hang0) - c.brk;
  if (t <= c.hang0) return a;
  const slow = (Math.min(t, c.hang1) - c.hang0) * 0.12;
  if (t <= c.hang1) return a + slow;
  return a + slow + (t - c.hang1) * 0.45;
}

export function shatterLook(L, t, c, beats) {
  const beat = env(beats.beats, t, 7);
  const down = env(beats.downbeats, t, 4);
  // the room dims a little when the tape starts
  L.lamp0 = 1 - 0.3 * sm(0, 0.8, t);
  // wires
  L.wireFade = sm(c.ignite - 0.05, c.ignite + 0.2, t) * (1 - sm(c.hang0, c.hang1 + 0.2, t));
  L.wirePulse = 0.25 + beat * 0.7 + sm(c.tremble, c.brk, t) * 0.8;
  // fire in the sky
  L.fire = sm(c.fire, c.fire + 1.3, t);
  L.window = 1 + 0.7 * L.fire;
  // lamps breathe with the beat once the song is going
  if (t > c.fire) L.lamp0 *= 0.78 + 0.32 * beat;
  // material sweep
  if (t >= c.sweep0) {
    const k = Math.min(1, (t - c.sweep0) / (c.sweep1 - c.sweep0));
    L.sweepAmt = sm(c.sweep0 - 0.1, c.sweep0 + 0.15, t);
    L.sweepR = -0.2 + 4.6 * easeIn(k) + Math.max(0, t - c.sweep1) * 6;
  }
  L.mix = 0.35 * sm(c.sweep0, c.sweep1, t);
  // tremble
  const tr = sm(c.tremble, c.brk, t);
  L.jitter = t < c.brk ? 0.0055 * tr * tr * (0.6 + 0.8 * beat) : 0;
  // shatter
  L.breakU = breakTime(t, c);
  L.void = sm(c.brk, c.brk + 0.65, t);
  L.mix = Math.max(L.mix, sm(c.brk, c.brk + 0.5, t));
  L.fire *= 1 - L.void;
  L.flash = hit(t, c.brk, 5) * 0.9;
  L.beams = 1 - L.void;
  // title card during the hang
  L.title = sm(c.hang0 + 0.05, c.hang0 + 0.85, t) * (1 - sm(c.titleOut, c.titleOut + 1.5, t));
  L.titleReveal = 0.05 + sm(c.hang0 + 0.05, c.hang0 + 1.3, t) * 1.2;
  L.titleGlint = -0.3 + sm(c.hang0 + 0.8, c.hang0 + 3.0, t) * 1.6;
  // debris slowly orbits the desk after the hang
  L.spinY = t > c.hang1 ? (t - c.hang1) * 0.045 + (t - c.hang1 > 0 ? 0 : 0) : 0;
  // gold glints pulse on downbeats in the void
  if (t > c.hang1) L.flash += down * 0.12;
  return L;
}

// Cues for songs without a hand-made show: derived from the beat grid.
export function genericCues(beats, length) {
  const db = beats.downbeats.length ? beats.downbeats : beats.beats;
  const first = (after) => db.find((x) => x >= after) ?? after;
  const ignite = beats.beats[0] ?? 0.3;
  const sweep0 = first(Math.min(8, length * 0.15));
  const sweep1 = first(sweep0 + 2.2);
  const brk = first(sweep1 + 2.0);
  return {
    ignite, fire: first(ignite + 1), sweep0, sweep1, tremble: sweep1, brk,
    hang0: brk + 0.55, hang1: brk + 2.0, titleOut: brk + 7,
  };
}
