// DD-003 scenes, group 3: S10, S11, S12, S13 (77.30 to 112.04). Round 3 (storyboard v3).
//   S10 One red light, the game begins   alarm beacon, chessboard armies          (out: FALL THROUGH into black)
//   S11 Under the harbour                pilings, ship hull overhead, car, frogman (out: SURFACE SHATTER)
//   S12 Fireworks over the harbour bridge cables light gold, angel -> spy picture   (out: WORLD PASSES BY, post 7.84)
//   S13 The red phone booth              dial 0, the spark runs along the wire     (out: LIGHTS OUT, wire last; pre 9.1)
// The scenes live in scenes-3-s10.js .. scenes-3-s13.js; shared helpers in scenes-3-util.js.
import { S10 } from './scenes-3-s10.js';
import { S11 } from './scenes-3-s11.js';
import { S12 } from './scenes-3-s12.js';
import { S13 } from './scenes-3-s13.js';

export default [S10, S11, S12, S13];
