// Per-song shows. Each show is a pure function of song time (look(t) -> look knobs), so a song can
// be seeked, scrubbed, tested frame by frame and reversed. Songs without their own show get the
// generic one (sweep + shatter on the first strong downbeat after 8 s).
// A tape can carry its own show key (song.show) while sharing the audio of another song id:
// the show is picked by that key first, then by the song id.
import gold from './gold-on-the-wire.js';
import copperLine from './copper/show.js';
import blackBox from './blackbox/show.js';
import generic from './generic.js';

const SHOWS = { 'gold-on-the-wire': gold, 'copper-line': copperLine, 'black-box': blackBox };

export function showFor(song) {
  return (song.show && SHOWS[song.show]) || SHOWS[song.id] || generic;
}
