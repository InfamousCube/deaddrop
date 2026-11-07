// DD-003 scenes, group 4: S14, S15, S16, S17, S18 (112.04 to 153.771) for GOLD ON THE WIRE (MistyConifer).
// Round 3 (STORYBOARD-v3.md):
//   S14 the tape destroys itself  (112.04-119.70, cold)  giant reel-to-reel machine around you; 3 lamps go
//                                  out on "three, two, one"; the tape burns on "you were never here"; SMOKE WIPE
//   S15 the cameras go dark       (119.70-127.62, cold)  curved wall of 21 CRT security monitors; a row goes
//                                  dark per number; she fades from the centre screen; "lights out" = CRT dot
//   S16 the Dynamo Sun            (127.62-136.03)        KEPT (pylons, angel, the halo tilts, all red)
//   S17 the sea launch platform   (136.03-142.91)        KEPT (count down to zero = launch)
//   S18 home on the wire          (142.91-153.771, hot)  S01's telegraph line; GOLD / ON / THE / WIRE rise
//                                  on L37's word times; TONIGHT 148.00; fade, lobby back (show.js)
// Scene code: scenes-4-a.js (S14, S15), scenes-4-b.js (S16, S17), scenes-4-c.js (S18); helpers in
// scenes-4-util.js (incl. sung(): words.json times with the storyboard's bridge corrections) and
// shapes-4.js (reels, CRT monitors, telegraph poles, flames, clouds).
import { S14, S15 } from './scenes-4-a.js';
import { S16, S17 } from './scenes-4-b.js';
import { S18 } from './scenes-4-c.js';

export default [S14, S15, S16, S17, S18];
