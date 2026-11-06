// Per-song shows. Each show is a pure function of song time (look(t) -> look knobs), so a song can
// be seeked, scrubbed, tested frame by frame and reversed. Songs without their own show get the
// generic one (sweep + shatter on the first strong downbeat after 8 s).
import gold from './gold-on-the-wire.js';
import generic from './generic.js';

const SHOWS = { 'gold-on-the-wire': gold };

export function showFor(song) {
  return SHOWS[song.id] || generic;
}
