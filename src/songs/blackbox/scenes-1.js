// DD-003 scenes, group 1 (0 to 36.2 s) of GOLD ON THE WIRE, round 3 (storyboard v3, STORYBOARD-v3.md).
//   S01 0.00-7.90   the wire at sunset: telegraph line, gold spark, sunburst, the Queen card (angel / spy)
//   S02 7.90-17.20  the roulette wheel: the ball circles you and lands on the gold 0; lights out
//   S03 17.20-23.40 the black car: street of cast-iron lamps, the car passes on the left, the hotel doors open
//   S04 23.40-28.10 champagne silence: banquet hall, empty chairs, the champagne tower freezes; the room flies apart
//   S05 28.10-36.20 the hall of mirrors: her face in every mirror, the mirrors open like doors, the end one shatters
// Transitions: S01 WORLD ASSEMBLES (S02 pre 0.45), S02 LIGHTS OUT + the gold ball lights the street (S03 pre 1.0),
// S03 PASS-BY + DOOR PORTAL (S04 pre 0.8, S03 post 2.05), S04 WORLD FALLS APART (S05 pre 0.7), S05 SHATTER.
// Scene code lives in scenes-1-s0N.js; shared builders (telegraph line, Queen card, car, chandelier, the shared
// S03-S05 glide path) in scenes-1-util.js.
import { S01 } from './scenes-1-s01.js';
import { S02 } from './scenes-1-s02.js';
import { S03 } from './scenes-1-s03.js';
import { S04 } from './scenes-1-s04.js';
import { S05 } from './scenes-1-s05.js';

export default [S01, S02, S03, S04, S05];
