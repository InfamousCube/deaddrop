// DD-003 "black-box" scenes, group 1: S01, S02, S03, S04, S05 (0 to 36.2 s) of GOLD ON THE WIRE.
// The lobby dissolve is in show.js; the title lands on the first sung word at 0.26 (S01).
// Transitions out: S01 LIGHTS-OUT (rays count down, 8.04-9.18), S02 PORTAL (gold zero ring, 15.4-15.8),
// S03 LIGHTS-OUT (the streetlights end, 21.14-22.63), S04 MATCH-CUT (bubbles -> dish faces, 28.30-29.46),
// S05 SHATTER (36.20, post 0.6; the plain is gone from 36.20 so S06's board shows below).
// Scene code lives in scenes-1-s0N.js; shared helpers (the Engineer, bust, dish layout) in scenes-1-util.js.
// S01 uses kit.saltFlat() with its defaults (gap 4, spacing 10, count 18, height 12), group shifted +40 m on z.
import { S01 } from './scenes-1-s01.js';
import { S02 } from './scenes-1-s02.js';
import { S03 } from './scenes-1-s03.js';
import { S04 } from './scenes-1-s04.js';
import { S05 } from './scenes-1-s05.js';

export default [S01, S02, S03, S04, S05];
