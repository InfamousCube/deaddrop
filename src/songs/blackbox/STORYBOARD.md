# DD-003 show "black-box": GOLD ON THE WIRE (MistyConifer), final storyboard

Tape label DD-003 reads "Black Box". The song is **Gold on the Wire** by **MistyConifer** everywhere: title, credits and type. The words "Black Box" never appear in the show.

Song: 153.771 s, 105.74 bpm (beat 0.567 s). Word timings come from `web/songs/gold-on-the-wire/words.json` (line index L0 to L38). The times below were checked against that file. Use `kit.words.match(text, near)` instead of typing times by hand wherever possible.

## 1. Concept: ONE NIGHT, LINE BY LINE

The engineer-spy of the song has wired the whole night. The player stands in her linesman's cradle, which hangs from a single **gold wire**. The wire is the song title made physical and the spine of the show. On the first sung word it shoots out of the dissolving lobby into the dark. Every world of the night is strung along it: **18 places**, each a different world, from the first fire in the sky to "you were never here". The scale keeps jumping: bug-sized on a circuit board, then 60 m rockets and an 80 m silhouette in front of a sun.

Each sung line gets one literal image that reads instantly. Its key words appear as big in-world type exactly on the word timings.

**Arc**
- The song opens on the chorus, so the show starts HOT with the title as its first image.
- Cold verse 1 covers the pick-up, the ride, the mirrors and the machine city.
- Hot chorus 2 is the gold run and the bomb.
- Cold verse 2 is the waltz, then one red light turns a room red, then the dive.
- Hot chorus 3 is the high wire and the switchboard.
- The cold bridge shreds the evidence and switches the screen off.
- The final chorus runs at maximum scale, through two amber climaxes (the dynamo sun and the launch), back to the opening plain for the title reveal. The lobby then rebuilds around the player.

Hot and amber cover about 56% of the runtime.

## 2. Look (Gemini's DD-001 colours, cel-shaded by the style bible)

**Shading**
- One uniform key direction per world.
- 3 hard ramp steps (4 at most); big pure-black shadows; at least 30% of every frame pure black.
- A razor rim on dark silhouettes: gold in hot worlds, cyan in cold, amber in amber.
- Linear fog to black, or to the darkest step.
- No textures, outlines, PBR, specular or surface gradients.
- Particles are flat and unlit: bubbles are discs, sparks are strokes, shards are triangles.
- Giant slow shapes, rows of repeated objects, one-point perspective.

**Ramps** (all in `style.js`)

| ramp | steps | use |
|---|---|---|
| HOT | velvet #07070C, carmine #6B090E, crimson #D8141C | all choruses and the finale |
| GOLD | #07070C, brass #E5A428, gold #FFC638 (highlight #FFE888) | gold objects in any world |
| CREAM | #07070C, #B8A888, cream #F7EFE0 | type, faces, paper, sparks |
| COLD | #000000, petrol #0B3945, #217992 (highlight #47BCDE) | verses and bridge; fog black or #05222C |
| RUST | #000000, #912118, #E5623E | the only warm accents allowed in cold worlds |
| AMBER | #912118, #E5623E, #FDD890 | only the 2 climaxes: 127.68 to 131.2 and 138.10 to about 141 |

**Sky.** The Saul-Bass sunburst dome (the `DOME_FRAG` look, but with hard wedges):
- velvet-black zenith and nadir;
- carmine horizon band;
- 16 alternating #D8141C / #4A0A10 wedges around a focal point (each wedge switchable);
- thin gold target rings drifting outward;
- slow rotation, 2°/s at most.

The cold sky is black with an optional cyan moon and stars. The amber sky has #E5623E / #912118 rays and a #FDD890 sun disc.

**Colour flash.** 1 to 2 frames (0.03 s) of crimson #D8141C or amber, then black or the cut. There is never any flicker faster than 3 Hz.

**Type.** Condensed caps (Bebas Neue, already vendored in `web/fonts/`, OFL) with a synthetic italic slant of 0.2.
- Gold for the key phrase, cream for the rest, rust only for SPY.
- Cap height 0.9 to 1.6 m, 4 to 8 m away, within ±35° of forward, at eye height or up to +1 m.
- A word enters on its sung word with a short slide up (or a pop) and leaves with its scene.
- Text is sometimes glued to and tilted with a surface.
- Every "why" is redacted.

## 3. The vehicle: the Linesman's Cradle (`rig.js`, built by the foundation)

The player stands where the desk was (eye at about y 1.6, near z 0). The cradle **never moves, yaws, rolls or pitches**. All travel is the world moving past it (`kit.travel` speed profiles, eased over at least 1 s).

| part | description |
|---|---|
| Deck | Round, radius 0.9 m, top at y 0.012, 0.12 m thick, black. Its edge band is the world colour: gold #FFC638 (hot), #217992 (cold) or glowing amber. |
| Railing | Waist-high ring (r 0.85 m, y 1.0) on 3 posts at the sides and back. |
| Hanger | One curved arm rising from the back of the railing, behind the head and up to a two-wheel trolley riding the wire at y 3.4. It stays at least 0.9 m from the eyes, and the front view stays free. |
| Console | A small slanted box at the front (z -0.62, y 0.92) with a round gauge (needle kicks on every downbeat) and one indicator lamp in the world's light colour. It is the diegetic beat meter. |
| The wire | Gold, 2.4 cm, unlit and emissive, at y 3.4. It runs from the vanishing point ahead to the dark behind. White-gold pulses run along it on every sung "gold on the wire" (0.26, 13.62, 47.48, 59.96, 64.94, 67.36, 95.16, 109.98, 127.68, 141.74, 145.60, 147.34). |

A scene can dim the wire, change how far it is drawn, or hide it and draw its own (S11 dives, S18 writes the title, S08 cuts a wire). The deck draws itself as a gold circle at 0.05 s, fills by 0.6 s, and fades out at 152.8 s.

## 4. Protagonist and motifs

**THE ENGINEER.** She wired the night; "the face I know".
- A flat, chunky, pure-black cut-out silhouette: sharp bob, high-collared coverall, long gloves, a tool belt with a thin gold buckle.
- Rim light in the world's rim colour.
- Her eyes are two **round glasses**, white emissive discs. They turn red #FF1E26 on every "lie", become cyan goggles underwater, and are the last light left in blackouts.
- She is never shown arms-spread between buildings.
- Her mask is **THE ANGEL**: a cream face, gold halo and cream crescent smile.

**Motifs**
1. **THE GOLD WIRE** (the cradle's wire). It returns as:
   - ropeway cables (S07);
   - the cut bomb wire and the harp (S08);
   - the high wire (S12);
   - patch cords (S13);
   - the rocket trail (S17);
   - the title (S18).
2. **FIRE IN THE SKY / SUNBURST.** It ignites in S01, is painted on the dome in S08, becomes the tent roof in S12, blazes amber in S16 and S17, and comes home in S18.
3. **TWO FACES.** The angel flips to the engineer-spy: the giant mask (S01), the statues (S07), the trapeze (S12), the dynamo-sun silhouette whose shadow becomes the spy (S16), and the split mask (S18).
4. **COUNTDOWN 3-2-1-0, a new machine every time**:
   - sunburst rays (S01);
   - Nixie zeros (S02);
   - bomb timer (S08);
   - rotary dial (S13);
   - archive lamps (S14);
   - gantry lamps (S17).
5. **THE REDACTION.** Every "why" gets a black bar with a white spark edge (S02, S08, S13). The exhaust burns it away in S17. Its big brother is the bridge: the dossier is shredded (S14) and the memories are erased (S15).
6. **ROWS OF LIGHTS** that switch hard and never dim: poles, streetlamps, dish rings, girders, lamps, jacks and coils. Beats travel along them toward the vanishing point or around the player.

## 5. Rules for every scene

- About 18 distinct worlds. World changes fall on phrase boundaries, colour-world changes on section boundaries, and a beat event lands every 1 to 4 s.
- Transition types rotate and never repeat back to back. No place repeats except S18 returning to S01.
- Main action stays in the front 120°, but the sides, back and up are populated: giant shapes 20 to 60 m away and things passing close by, never nearer than 0.5 m to the eyes.
- Only eased linear motion. The world may rotate slowly, mostly in the periphery.
- Everything is a pure function of song time t. Seeking forwards or backwards and FF/REW ±10 s must work from any frame.
- Performance per eye at peak: at most ~150 draw calls and ~200k triangles. Use instancing and merged geometry, and only the current and next world are visible.
- **The outgoing scene owns its transition-out effect.** The incoming scene sets `pre` (seconds before `t0` it must already be visible) and must look right during that overlap.

## 6. Transition rotation

| out of | type | at |
|---|---|---|
| S01 | LIGHTS-OUT (rays count down) | 8.04 to 9.18, S02 lights on "zero" 9.48 |
| S02 | PORTAL (gold zero ring passes around the player) | 15.7 to 16.0 |
| S03 | LIGHTS-OUT (the streetlights end) | 21.14 to 22.63 |
| S04 | MATCH-CUT (frozen gold bubbles become the mirror dishes) | 28.30 to 29.46 |
| S05 | SHATTER (dishes break into cyan shards) | 36.20 |
| S06 | COLOR FLASH (crimson) | 47.48 |
| S07 | SHATTER (statues burst) | 56.61 |
| S08 | EDGE-MODE (cyan lines rebuild into the music box) | 67.74 |
| S09 | LIGHTS-OUT (one red light follows) | 76.89 |
| S10 | PORTAL (hatch ring) | 83.75 |
| S11 | SHATTER (water surface breaks) | 95.18 |
| S12 | PORTAL (last burning hoop) | 104.33 |
| S13 | FADE-TO-BLACK | 111.48 to 112.04 |
| S14 | EDGE-MODE (lines stream onto the CRT screen) | 119.98 |
| S15 | MATCH-CUT (CRT dot becomes the sun) + 2-frame amber flash | 127.62 to 127.68 |
| S16 | WORLD PASSES BY (the plain runs onto the launch deck) | 135.5 to 136.03 |
| S17 | MATCH-CUT (rocket dot becomes the sun disc) | 142.91 |
| S18 | FADE-TO-BLACK into the lobby | 150.0 to 153.771 |

## 7. Scene table

| id | time (s) | section | world | place | group |
|---|---|---|---|---|---|
| S01 | 0.00 to 9.18 | chorus 1 a | hot | Black salt flat, the Two-Faced Mask | 1 |
| S02 | 9.18 to 16.00 | chorus 1 b | hot | The Nixie Hall | 1 |
| S03 | 16.00 to 22.63 | verse 1, L4 | cold | The Pole Line, the black car | 1 |
| S04 | 22.63 to 29.46 | verse 1, L5 | cold | A limousine of one | 1 |
| S05 | 29.46 to 36.20 | verse 1, L6 and L7 | cold | The Mirror Field (heliostats) | 1 |
| S06 | 36.20 to 47.50 | pre-chorus 1 | cold | The Circuit Board (bug scale) | 2 |
| S07 | 47.50 to 56.61 | chorus 2 a | hot | Gold ropeway over a canyon | 2 |
| S08 | 56.61 to 67.74 | chorus 2 b + oh-oh | hot | The bomb chamber and the gold harp | 2 |
| S09 | 67.74 to 76.89 | verse 2, L17 and L18 | cold | The music-box ballroom | 2 |
| S10 | 76.89 to 83.75 | verse 2, L19 and L20 | cold, then red | The panel room, then the chessboard | 3 |
| S11 | 83.75 to 95.18 | pre-chorus 2 | cold | The sea cable (dive) | 3 |
| S12 | 95.18 to 104.33 | chorus 3 a | hot | The Big Top high wire | 3 |
| S13 | 104.33 to 112.04 | chorus 3 b | hot | The switchboard canyon | 3 |
| S14 | 112.04 to 119.98 | bridge 1 | cold | The records archive and shredder | 4 |
| S15 | 119.98 to 127.62 | bridge 2, "Lights out" | cold | Inside the scope (CRT) | 4 |
| S16 | 127.62 to 136.03 | final chorus a | amber, then hot | The Dynamo Sun | 4 |
| S17 | 136.03 to 142.91 | final chorus b | hot, then amber | The sea launch platform | 4 |
| S18 | 142.91 to 153.771 | tag + outro | hot (amber sun) | Salt flat return, title reveal, lobby rebuilds | 4 |

Groups (scene files):
- **1** = `scenes-1.js` (0 to 36.2, includes the lobby dissolve and the title);
- **2** = `scenes-2.js` (36.2 to 76.89);
- **3** = `scenes-3.js` (76.89 to 112.04);
- **4** = `scenes-4.js` (112.04 to 153.771, includes the title reveal and the clean end).

The lobby dissolve (`L.hideLobby`, `L.breakU`) and its return live in `show.js`, so builders never touch the lobby.

---

## 8. Scenes

### S01 Black salt flat: the Two-Faced Mask (0.00 to 9.18, hot, group 1)

**Place**
- An infinite matte-black ground plane (`kit.saltFlat`), with fog to black from 30 to 160 m.
- Two rows of slim T-shaped wire poles: black, 12 m tall, gold rim, a white bulb dot on each crossarm end, instanced 2 x 18. They stand 4 m left and right of the wire every 10 m, run to the vanishing point and continue behind the player.
- The sky is the full sunburst dome with the focal point straight ahead, 7° above the horizon. The 16 rays start OFF.
- **THE TWO-FACED MASK** hides below the horizon 90 m ahead: a 34 m disc face extruded 2 m deep.
  - Front: a cream angel face with a gold rim, closed eyes as two curved black lines, and a cream crescent smile.
  - Back: the Engineer's black face (bob silhouette) with two round white glasses.
  - Above it, a gold halo torus 20 m across; two cream cut-out wings fold against its sides.
- Key light comes from straight ahead and high, so the poles are backlit with gold rims toward the player.

**Lyrics**
- L0 "Gold on the wire, fire in the sky", 0.26 to 3.08 (Gold 0.26, wire 0.44, fire 1.16, sky 2.58).
- L1 "Smile like an angel, lie like a spy", 3.40 to 7.46 (Smile 3.40, angel 4.96, lie 6.02, spy 7.16).
- L2 starts: "Count down" (Count 8.06, down 8.90).

**On-screen text**
- 0.26 **GOLD ON THE WIRE** (the title): gold, cap 1.3 m, 7 m ahead, centred, 0.6 m above the eyes. The words pop on 0.26, 0.32, 0.38 and 0.44.
- 1.16 **FIRE IN THE SKY**: cream, cap 0.8 m, above the title inside the sunburst centre (+12°). SKY pops 20% bigger at 2.58.
- 2.32 **MISTYCONIFER**: cream, cap 0.42 m, wide tracking, under the title with a thin gold rule.
- 3.10 to 3.40: all three slide down and out.
- 3.40 **SMILE LIKE AN ANGEL**: cream with ANGEL in gold; left, -25°, 6 m, eye height; word by word (3.40, 4.06, 4.60, 4.96).
- 6.02 **LIE LIKE A SPY**: cream; right, +25°; word by word to SPY at 7.16. SPY is rust #912118 with a gold rim.
- Both leave at 7.9.
- 8.06 **COUNT DOWN**: gold, centre-left, 6 m (8.06, 8.90). The lights-out cuts it.

**Beat events**
- **0.00 to 1.50**: the lobby breaks apart and sinks (show.js does this). The deck draws on as a gold circle at 0.05.
- **0.26 "Gold"**:
  - a gold spark ignites 0.6 m ahead at deck height and leaps up to the wire;
  - the wire shoots from the trolley to the vanishing point and back behind (0 to 300 m in 0.9 s) with white spark dashes;
  - sfx whoosh.
- **0.62, 1.19**: the nearest pole-lamp pairs snap on.
- **1.16 "fire"**: the sky ignites. The 16 rays switch on hard in 4 groups of 4 (1.19, 1.75, 2.32, 2.90), and the gold rings start drifting outward.
- **2.32 downbeat**: all pole lamps snap on in a wave from near to far (0.5 s).
- **3.40 "Smile"**: the Mask rises over the horizon (3.40 to 4.61, eased); the smile curls up at 3.47.
- **4.61**: the halo lights gold.
- **4.96 "angel"**: the wings fan open.
- **5.74**: the halo spins half a turn.
- **6.02 "lie"**:
  - the Mask turns 180° on its vertical axis (6.02 to 6.60) to show the Engineer;
  - the wings snap shut;
  - her round glasses light white, then red at 6.33.
- **6.89 downbeat**: the glasses flash.
- **7.16 "spy"**: all pole lamps flick to rust for one beat.
- **8.04, 8.61, 8.90, 9.18 "Count down"**: the rays switch OFF in 4 groups (the countdown is in the light itself), and the pole lamps die pairwise from far to near.
- **9.18**: only the wire, the red glasses and the deck rim are lit.

**Motion**
- The cradle starts at rest and eases up to 3 m/s between 1.6 and 3.2 s.
- Poles pass at 4 m lateral about every 3.3 s.
- The dome rotates 2°/s.
- The Mask holds about 90 m ahead (it moves with the world, minus the travel).

**VR.** The room literally falls away. A 34 m face rises over the horizon and turns around. The sunburst ignites across the whole hemisphere, including overhead and behind. Looking up shows the trolley wheels on the wire.

**Out: LIGHTS-OUT.** The rays and lamps die in 4 steps (8.04 to 9.18). S02 lights up on "zero" at 9.48.

**Why.** The song starts on its hook, so the title is the first image. The gold wire is literally strung into the night, the sky literally catches fire, and the angel literally turns into the spy. The countdown is the sky switching itself off.

### S02 The Nixie Hall (9.18 to 16.00, hot, group 1)

**Place**
- A circular hall, r 26 m: black floor disc and black dome with one thin crimson ring at the top.
- 12 Nixie tubes stand in a ring around the player, one every 30° at r 22 m. Each is a vertical glass cylinder 4 m across and 16 m tall: a black cylinder with a cream silhouette rim, a crimson cap and a crimson base.
- Inside each tube are 10 stacked digit shapes, 3.5 m tall, made of thick wire (TubeGeometry along 2D polylines, merged per digit). Unlit digits are dark brass #3A2A08; the lit digit is emissive gold #FFC638.
- A 13th tube, bigger (6 m across, 22 m tall), stands straight ahead on the wire axis at z -24. The wire runs into its base.
- About 30 draw calls.

**Lyrics**
- 9.48 "zero".
- 10.46 to 12.12 "don't ask me why" (don't 10.46, ask 11.44, me 11.62, why 11.82).
- L3 "Gold on the wire tonight", 12.80 to 15.10 (Gold 12.80, on 13.62, the 13.84, wire 14.02, tonight 14.56).

**On-screen text**
- 9.48 **ZERO**: gold, cap 1.6 m, 6 m ahead, eye height. "COUNT DOWN TO" from S01 sits beside it (S02 draws its own copy, already lit). Both fade at 10.46.
- 10.46 **DON'T ASK ME WHY**: cream, right, +22°, 6 m, word by word. At 11.82 a black redaction bar slams over WHY (`line.redact`) with a white spark edge.
- 12.80 **GOLD ON THE WIRE**: gold, letters hanging under the wire like beads, 6 to 8 m ahead; word by word (12.80, 13.62, 13.84, 14.02).
- 14.56 **TONIGHT**: cream, +15° up, 7 m.

**Beat events**
- **9.48 "zero"**: all 13 tubes slam on at once showing a gold 0; a 1-frame gold ring flashes on the floor at r 22 m.
- **10.46 "don't"**: the 12 ring tubes scramble. Each steps through random digits at 6 Hz; these are small elements, never a full-screen flicker.
- **11.44 "ask"**: the tube rims switch from cream to crimson.
- **11.47 downbeat**: the scramble freezes on random digits.
- **11.82 "why"**: the 12 ring tubes go dark; only the front tube's 0 remains.
- **12.80 "Gold"**: the front 0, an 8 m wire ring, detaches and slides down the wire toward the player (eased, arriving at 15.7).
- **13.62, 13.84, 14.02 "on the wire"**: three gold sparks run along the wire from the 0 to the cradle, one per word; the console needle kicks on each.
- **13.75 downbeat**: the ring tubes relight their 0 one after another, clockwise around the player, 0.08 s apart. This 360° sweep also runs behind the player.
- **14.56 "tonight"**: the dome splits into 8 petals that fold outward onto a black sky with 400 white stars.
- **15.43**: the stars twinkle (alpha step).

**Motion.** The cradle creeps at 0.8 m/s. The ring of tubes yaws slowly around the player (6°/s, periphery only). From 15.0 the cradle eases up to 5 m/s into the portal.

**VR.** Twelve 16 m tubes stand all around, and the clockwise relight runs behind the player's back. An 8 m gold zero comes straight at them, and the player passes through it.

**Out: PORTAL** (15.7 to 16.0). The cradle passes through the gold 0 ring. S03's night pole line is visible only inside the ring (`kit.matte`) until the ring passes the eyes.

**Why.** The countdown lands on "zero" as a hall of zeros. "Don't ask me why" is machines refusing to give a clean number, plus the redaction. "Gold on the wire tonight" sends the golden digit down the wire and opens the night sky.

### S03 The Pole Line (16.00 to 22.63, cold, group 1)

**Place**
- Night over a straight two-lane road 8 m below the cradle, running to the vanishing point. The road is #05222C with a dashed #217992 centre line.
- The cradle's wire is the top conductor of a row of black utility poles at x +1.2, one every 25 m. Each pole is 12 m tall with one crossarm, 3 cyan-rimmed insulators, and a streetlamp arm: a white bulb plus a flat transparent two-step cone down to the road (#217992 / #0B3945, 25% opacity).
- Parallel conductors run at x -1.5 and x +3.5, and a second pole row stands at x -30.
- Fields are flat #0B3945 strips, with fog to black from 30 to 160 m.
- Horizon: a low black strip of factory roofs and two water towers (no city).
- Sky: black, with a flat cyan moon disc (#47BCDE, 8°) 20° right and 15° up.
- 40 flat black bird silhouettes sit on the parallel conductors near the player.
- **THE BLACK CAR** waits at the end of the lamp row, 55 m ahead under the line: a long 1960s sedan silhouette with fins, 6 m long, with two round white headlights. Beyond it the road continues unlit into black.
- The Engineer (1.75 m, real scale) leans on the car.

**Lyrics.** L4 "Black car waiting where the streetlights end", 17.44 to 22.90 (Black 17.44, car 17.56, waiting 20.60, where 21.14, the 21.48, streetlights 21.76, end 22.38).

**On-screen text**
- 17.44 **BLACK CAR**: gold, left, -22°, 6 m, eye height (17.44, 17.56).
- 20.60 **WAITING**: cream, under it.
- 21.14 **WHERE THE STREETLIGHTS END**: cream, glued along the crossarm of the next pole ahead-right (+18°, 7 m, 1 m above the eyes, tilted with the crossarm). END goes out with the last lamp.

**Beat events**
- **16.00, 16.59, 17.16, ...**: the streetlamps switch on pole by pole outward on every beat, up to the car.
- **17.44 "Black"**: the car snaps on as a silhouette at the end of the lamp row.
- **17.56 "car"**: its headlights switch on white, with flat cones down the road.
- **18.31 downbeat**: the headlights flash once.
- **20.33 downbeat**: the moon gains a thin cream rim.
- **20.60 "waiting"**: the Engineer steps out from behind the car, glasses white.
- **21.14 to 22.38 "where the streetlights end"**: the lamps switch OFF pole by pole, from behind the player forward toward the car, one per 8th note.
- **22.38 "end"**: the last lamp over the car goes dark, and all 40 birds take off at once, flapping up and back past the player (some 1.5 m above the head).
- **22.63 downbeat**: the headlights cut. It is black except the moon, the glasses and the deck rim.

**Motion.** From 16.0 the cradle glides along the line at 6 m/s, easing to 3 m/s by 21.5, so the car is about 15 m ahead and below when the lights die. Poles pass on the right about every 4 s, and the lamp cones sweep beneath.

**VR.** The player hangs 8 m above the road and looks down at the car roof. Lamps go out behind and around them, and birds burst up over their head.

**Out: LIGHTS-OUT** (21.14 to 22.63). S04's dome lamps snap on out of the black at 22.63.

**Why.** The noir set-up. The wire the player rides literally feeds the streetlights, so when the lights end, the car waits in the dark.

### S04 A limousine of one (22.63 to 29.46, cold, group 1)

**Place**
- The inside of an impossibly stretched limo: 6 m wide, 3.6 m high and 140 m long, continuing behind the player.
- Two rows of identical bench seats (petrol velvet blocks with black seams, 24 per side, instanced) face the aisle 2.6 m left and right of the wire.
- A low black bar counter runs along the aisle floor with 40 champagne flutes (cream glass silhouettes with gold fill, instanced) and one giant bottle 8 m ahead.
- Window bands above the seats show the city streaming past as flat cyan and rust dashes sliding backward on black.
- The ceiling carries 30 round dome lamps (white discs), and the wire runs just under it.
- A passenger sits on every seat: 48 instanced black cut-out heads and shoulders with a cyan rim and white eye dots.
- The Engineer sits alone at the far end, 60 m ahead, under one lamp.
- Key light comes from the ceiling, top-down, so the lower half of every seat is black.

**Lyrics**
- L5 "Champagne silence, I don't need a friend", 23.70 to 27.34 (Champagne 23.70, silence 25.26, I 25.94, don't 26.12, need 26.48, a 26.72, friend 26.94).
- L6 starts with "Every" at 28.30.

**On-screen text**
- 23.70 **CHAMPAGNE**: gold, glued to the left window band 7 m ahead and tilted with the wall.
- 25.26 **SILENCE**: cream, on the right window band, its letters frozen mid-rise.
- 25.94 **I DON'T NEED A FRIEND**: cream, centre-left, eye level, 6 m, word by word. At 26.94 a rust line strikes through FRIEND.
- All text is gone by 28.9.

**Beat events**
- **22.63**: all dome lamps snap on (the lights come back).
- **23.20**: the passengers sway.
- **23.70 "Champagne"**:
  - a cork (white disc, 0.4 m) pops from the bottle and arcs 2 m over the player's head to the back;
  - all 40 flutes fill gold at once;
  - 300 flat gold bubble discs start rising everywhere.
- **24.33, 24.90**: bubbles burst into thin white rings in two waves.
- **25.26 "silence"**: everything freezes. The bubbles stop mid-air, the window streaks stop, and every dome lamp snaps off except the one over the Engineer.
- **25.94 to 27.20 "I don't need a friend"**: the passengers vanish two pairs per beat from near to far (26.05, 26.64, 27.20). Each pops out as a shrinking flat black disc and leaves an empty seat.
- **27.20 downbeat**: the lamps snap back on, the Engineer raises a gold flute with a rim flash, and the bubbles resume.
- **27.77, 28.32**: the bubbles swell and slow (preparing the match-cut).

**Motion.** The cradle glides 3 m/s along the aisle above the bar. Seats pass 2.6 m away and the dome lamps pass about 1.2 m above the head. Outside, the window streaks race backward at 30 m/s. Bubbles rise at 0.5 m/s, the nearest 0.8 m from the face.

**VR.** The cabin never ends in either direction, and the passengers behind the player vanish too. In the frozen silence, bubbles hang in the air around the head.

**Out: MATCH-CUT** (28.30 to 29.46). The frozen gold bubbles swell into big round discs, turn cyan, and fly outward to become the dish faces of S05. The cabin fades to black behind them.

**Why.** Literal champagne (cork, flutes, bubbles), literal silence (everything freezes), and "I don't need a friend" as every other seat emptying.

### S05 The Mirror Field (29.46 to 36.20, cold, group 1)

**Place**
- A flat petrol plain (#05222C) with 480 round mirror dishes, each 3 m across on a 2 m black post (instanced, 2 draw calls). They stand in 8 concentric rings around a 50 m black receiver tower at z -70, x -18.
- Dish faces use the cold ramp and flash #47BCDE when they turn. Each face carries a flat decal of the Engineer's head silhouette with two glasses dots (vertex colours).
- One taller signal dish (5 m) on a 7 m mast stands beside the wire, 6 m ahead-left, and carries text.
- At the field rim, 75 m from the tower: 12 exit gates, black door frames 8 x 16 m with flat cream-lit interiors, spaced 30° all around.
- The cradle rides at y 6 m above the plain. Fog to black from 40 to 200 m.

**Lyrics**
- L6 "Every mirror shows a face I know", 28.30 to 32.20 (mirror 29.98, shows 30.24, a 30.56, face 30.92, I 31.42, know 31.82).
- L7 "Every exit's got a place to go", 32.62 to 35.80 (Every 32.62, exit's 33.34, got 34.42, a 34.58, place 34.92, to 35.18, go 35.46).

**On-screen text**
- **EVERY MIRROR**: gold, glued on the face of the signal dish (-20°, 6 m, eye height, tilted with the dish). EVERY is already lit at 29.46; MIRROR comes at 29.98.
- **SHOWS A FACE I KNOW**: cream, right, +20°, 6 m, word by word.
- **EVERY EXIT**: gold, centre, 7 m, 0.5 m above the eyes (32.62, 33.34).
- **GOT A PLACE TO GO**: cream, under it, word by word. GO at 35.46 is twice the size.

**Beat events**
- **29.46**: the match-cut discs land as the dish faces. The dish rings rise out of the ground ring by ring on the beats (29.46, 30.06, 30.61), faces dark and pointing up.
- **29.98 "mirror"**: a tilt wave runs from the nearest ring outward. Every dish turns to face the cradle and flashes #47BCDE as it turns (0.9 s wave). From then on the dishes keep re-aiming at the cradle.
- **30.92 "face"**: the face decals appear on all dishes at once.
- **31.82 "know"**: 480 pairs of glasses light white around the player, and a 20 m version of her face appears in the tower's receiver ring.
- **32.62 "Every exit's"**: the 12 gates light cream one after another, clockwise around 360° (0.07 s apart).
- **34.03 downbeat**: the gates pulse.
- **34.42 to 34.92 "got a place"**: 12 gold wires shoot out radially from the trolley to the 12 gates (0.5 s draw-on).
- **35.18 to 35.46 "to go"**: a cyan light beam zig-zags from dish to dish (6 bounces) and exits through the forward gate. On "go" all dish faces flash.

**Motion.** The cradle glides at 4 m/s. The gate ring rotates slowly around the field centre (2°/s, periphery only).

**VR.** 480 mirrors all turn to look at the player and show her face, in 360°. Gates light up behind them too, and gold wires leave the cradle in every direction.

**Out: SHATTER** (36.20). Every dish breaks into 3 or 4 big cyan triangular shards that blow outward and past the cradle (`kit.shards`, closest 1 m). The plain drops away and reveals S06's circuit board below. S06 uses `pre` 0.4.

**Why.** Hundreds of mirrors all show the same face. "Every exit's got a place to go" is a 360° ring of exits, each wired to the player: she planned every escape route.

### S06 The Circuit Board (36.20 to 47.50, cold, group 2)

The player is bug-sized on a printed circuit board.

**Place**
- The board's top surface (#0B3945) lies at y -8 m and extends 300 m.
- Traces: flat #217992 strips 1 to 2 m wide with 45° corners, pre-generated polylines merged into one mesh. They brighten to #47BCDE when the board breathes.
- Components stand like buildings:
  - 40 black IC chips, 10 to 30 m long and 4 to 8 m tall, with cream pin rows (instanced boxes);
  - 20 capacitor towers, 8 m across and 20 to 35 m tall, black with a cyan top ring; one of them stands 7 m ahead-right to carry text;
  - resistor rows;
  - a cream quartz-crystal can (12 m tall, rounded box) 7 m ahead-left.
- The gold wire continues above the board as a bond wire.
- Overhead right: the Engineer as a 60 m giant. Only her black-sleeved forearm, a soldering iron with a white-hot cream tip, and her glasses 50 m up are visible, rim-lit cyan.
- Under the top layer is a 10-layer stack of square frames, 3 m apart, each with a 10 m hole on the wire axis. Each layer has a different cyan trace pattern (edges only) and a cream label from "-1" to "-10" on its edge.

**Lyrics**
- L8 "Tick, tick, feel the city breathe", 36.34 to 40.08 (Tick 36.34, tick 38.74, feel 39.00, the 39.18, city 39.34, breathe 39.62).
- L9 "Ten floors under what you believe", 40.52 to 42.36 (Ten 40.52, floors 40.90, under 41.22, what 41.56, you 41.82, believe 42.02).
- L10 "Hold your breath... here we go", 42.76 to 46.46 (Hold 42.76, your 43.08, breath 43.56, here 44.86, we 45.30, go 45.78).

**On-screen text**
- **TICK,**: cream, glued on the crystal can (-25°, 6 m, eye height) at 36.34. A second **TICK,** appears under it at 38.74.
- **FEEL THE CITY BREATHE**: gold, glued on the curved face of the capacitor ahead-right (+15°, 7 m). The letters swell with each breath.
- **TEN FLOORS UNDER**: gold, 6 m ahead, eye height, held still while the layers rise past.
- **WHAT YOU BELIEVE**: cream, below it.
- **HOLD YOUR BREATH**: cream, small, 5 m, the only lit text in the dark.
- **HERE WE GO**: gold. GO at 45.78 is twice the size.

**Beat events**
- **36.34 "Tick"**: the crystal emits a flat cyan ring that races across the board (0 to 150 m in 1 s); every chip's pin row flashes as it passes.
- **38.30 downbeat**: the soldering iron touches down far right with a white spark star.
- **38.74 "tick"**: a second ring.
- **39.00 to 42.0 "feel the city breathe"**: the traces swell bright and dim like breathing (period 1.2 s, three breaths), and the capacitors rise 2 m and sink.
- **40.52 "Ten"**: the board splits along the wire axis and both halves slide apart. The 10 layer frames rise up past the cradle one every 0.15 s; each passes about 5 m around the player through its hole.
- **42.02 "believe"**: layer -10 passes.
- **42.76 "Hold"**: hard stop. Everything goes black except the wire and her white glasses 40 m ahead.
- **43.56 "breath"**: the glasses blink once.
- **44.04**: one slow gold heartbeat pulse runs along the wire.
- **44.86 "here"**: a gold spark ignites at the vanishing point and runs along the wire toward the player.
- **45.78 "go"**: the spark hits the trolley and the console needle slams to the stop.
- **46.0 to 47.48 (riser)**: rows of tiny cyan pads appear on both sides and stream past faster and faster.

**Motion**
- 36.2 to 40.5: the cradle glides 3 m/s above the board while the giant arm works overhead.
- 40.5 to 42.0: the layer stack rises past; the world moves up.
- 42.8 to 44.9: everything is still.
- 45.8 to 47.5: the cradle accelerates (eased 1.5 s) to 14 m/s.

**VR.** Chips and capacitors tower 20 to 35 m around the player like a skyline in every direction, and a 60 m arm works above their head. Ten frames rise past on all sides.

**Out: COLOR FLASH** (47.48). One frame of crimson #D8141C, one frame of black, then a hard cut into S07. This is the cold-to-hot section change.

**Why.** The ticking crystal is her machine's clock, and the city that breathes is the board she wired. "Ten floors under" is a literal fall through ten circuit layers, "hold your breath" is the silence, and "here we go" is the spark.

### S07 Gold ropeway over a canyon (47.50 to 56.61, hot, group 2)

**Place**
- A canyon 70 m deep and black, made of jagged faceted rock cut-outs whose lit facets are carmine, under the carmine sunburst dome.
- Twelve ropeway cables run parallel to the player's wire: 4 left at 6 to 20 m, 4 right, and 4 overhead at 10 to 25 m.
- The cables hang from black single-mast T-towers, 30 m tall, with gold wheel-heads (instanced, every 40 m), running to the vanishing point and behind.
- 80 gold ingot carriers glide along the cables in both directions: small black hangers each holding a stack of three gold bars (instanced).
- **THE AIRSHIP** drifts 28 m up from front to back over the player: a 40 m black cigar hull with fins and a cream gondola.
- On both canyon rims, 18 m to each side and 10 m below eye level: rows of 8 angel statues per side. Each is an 8 m cut-out on a plinth with a cream robe front, a halo torus and folded wings; its back is the Engineer in her coverall.
- Key light comes from the sunburst focal point ahead, so everything is rim-lit gold toward the player.

**Lyrics**
- L11 "Gold on the wire, fire in the sky", 47.48 to 51.04 (Gold 47.48, on 48.00, the 48.50, wire 48.72, fire 49.34, sky 50.58).
- L12 "Smile like an angel, lie like a spy", 51.44 to 55.46 (Smile 51.44, angel 52.94, lie 53.98, spy 55.22).

**On-screen text**
- 47.48 **GOLD ON THE WIRE**: gold, huge (cap 1.4 m), left, 7 m, hung from the nearest left cable and swaying with it.
- 49.34 **FIRE IN THE SKY**: cream, right. SKY flares at 50.58.
- 51.44 **SMILE LIKE AN ANGEL**: cream, left.
- 53.98 **LIE LIKE A SPY**: gold, big, right. SPY turns rust at 55.22.

**Beat events**
- **47.50 "Gold"**: the colour flash lands. All 80 carriers light gold at once and start moving, and the overhead cables flash gold from near to far.
- **48.08, 48.65, 49.18**: on each beat a carrier whooshes past on the nearest cable (2.5 m lateral, 3.5 m high).
- **49.34 "fire"**: the Airship bursts into flat cel flames along its hull: cut-out tongues in rust #912118, orange #E5623E and small amber tips, stepped at 3 Hz or less.
- **49.75 downbeat**: the sunburst rays brighten to crimson.
- **50.32, 50.90**: flat triangular embers drift down all around, in 360°.
- **51.44 "Smile"**: all the statues' halos light gold and cream crescent smiles appear.
- **52.04 downbeat and 52.94 "angel"**: the wings fan open in a wave from near to far.
- **53.98 "lie"**: all 16 statues spin 180° in 0.4 s. Their backs are the Engineer, with round glasses glowing red.
- **54.89**: the burning Airship breaks in two and the halves tilt down slowly behind the player.
- **55.48, 56.04**: black cracks with gold edges spread across the two nearest statues.

**Motion.** The cradle eases from 4 to 6 m/s by 48.5. Towers pass about 6 m away every 6.5 s, and carriers pass in both directions. The Airship drifts overhead from front to back at 4 m/s and crosses the zenith around 53 s.

**VR.** Gold carriers pass above and beside the player. A burning 40 m airship drifts directly over their head. There is a 70 m drop under the deck, and the statue rows on both sides turn their backs at once.

**Out: SHATTER** (56.61). The two nearest statues burst into big angular shards (cream, black, gold) that fly past the player and fill the view for 0.4 s. S08 appears through the gap (S08 `pre` 0.3).

**Why.** Gold literally travels on wires, fire is literally in the sky as the burning airship, and the angels literally turn around into spies.

### S08 The bomb chamber and the gold harp (56.61 to 67.74, hot, group 2)

**Place**
- A velvet-black dome 36 m across whose ceiling is painted with the carmine sunburst (rays dark at first).
- A colossal 1960s time bomb stands 24 m ahead: 7 crimson sticks, each 1.2 m across and 9 m tall, held by three black straps.
- A black timer box (4 x 2 m) carries a two-digit cream display.
- Three thick wires leave the timer: rust #912118, cyan #47BCDE and GOLD. The gold one rises to join the player's overhead wire.
- A harp of 72 vertical gold wires runs from floor to dome in a ring around the player at radius 9 to 14 m, covering 360° (instanced thin cylinders).
- Giant wire-cutters, a 12 m black silhouette with gold edges, hide above right.
- Key light comes from the timer display, bottom-front.

**Lyrics**
- L13 "Count down to zero, don't ask me why", 56.52 to 59.96 (Count 56.52, down 57.00, to 57.30, zero 57.50, don't 58.48, ask 59.40, me 59.60, why 59.84).
- L14 "Gold on the wire tonight", 59.96 to 63.38 (Gold 59.96, on 61.52, the 61.86, wire 62.08, tonight 62.62).
- L15 "Oh-oh, gold on the wire", 64.00 to 65.98 (gold 64.94).
- L16 "Oh-oh, gold on the wire", 66.72 to 67.60 (gold 67.36).

**On-screen text**
- **COUNT DOWN TO ZERO**: gold, left, word by word. ZERO is replaced by a gold "0", 1.6 m high.
- 58.48 **DON'T ASK ME WHY**: cream, right. At 59.84 the redaction bar slams over WHY.
- 59.96 **GOLD ON THE WIRE**: gold, centre-left, running along the cut gold wire and tilted with it.
- 62.62 **TONIGHT**: cream, right, big.
- 64.00 **OH-OH**: gold, left, pulsing; GOLD ON THE WIRE in cream at 64.94.
- 66.72 **OH-OH**: gold, right; GOLD ON THE WIRE at 67.36.

**Beat events**
- **Countdown**: the timer shows 03 at 56.61, then flips hard to 02 at 57.00, 01 at 57.30 and 00 at 57.50 ("zero"). The frame flashes rust on each flip. At 00 nothing explodes; everything freezes.
- **58.33**: the wire-cutters swing in from above right (eased 0.8 s) and hover over the rust wire, then the cyan at 58.90, then the gold at 59.46.
- **59.84 "why"**: redaction slam.
- **59.96 "Gold"**: SNIP. The cutters close on the gold wire, the cut ends spray white spark strokes, and the timer display goes dark.
- **60.62, 61.18, 61.75, 62.32**: a gold pulse runs from the cut up into the overhead wire. The harp wires light in a sweep that circles the player (front, right, behind, left, front; one quarter per beat).
- **62.62 "tonight"**: the dome's sunburst rays switch on to full carmine.
- **64.00, 64.59 "Oh-oh"**: every harp wire is plucked. It vibrates as a sine bow with 0.3 m amplitude and a gold flash, decaying over 1 s.
- **64.94**: gold pulses race up all 72 wires to the dome centre.
- **66.72, 67.19**: a faster pluck with a double flash.
- **67.36**: pulses race back down.

**Motion.** The cradle approaches the bomb from 24 m to 14 m at 2 m/s and eases to a stop by 60.0. The harp ring rotates slowly around the player at 4°/s. Nothing comes closer than 3 m.

**VR.** The player stands inside a 360° harp of gold wires that gets plucked around them, and the light sweep circles behind their back. A 9 m bomb towers ahead, and the cutters swing over their head.

**Out: EDGE-MODE** (67.74). All surfaces lose their fill (`kit.edge`). The harp wires and the edges of the bomb and dome remain as cyan #47BCDE lines (`kit.edges`) for 0.4 s, then fade while S09 fills in (S09 `pre` 0.3).

**Why.** "Count down to zero" is a bomb timer. "Don't ask me why" is the spy cutting the one wire nobody would choose, the gold one. The "oh-oh" post-chorus literally rings the wires.

### S09 The music-box ballroom (67.74 to 76.89, cold, group 2)

**Place**
- The cradle glides over the open lid of a colossal steel music box. The floor is the lid's inside: a 60 x 40 m petrol plane with a #217992 lit band, 1.2 m below the deck.
- Ahead-right, in an open cutaway below floor level, a steel pinned cylinder 20 m long and 4 m across turns about its long axis (400 instanced pins), next to a steel comb of 40 teeth. A giant crank sits on the right box wall.
- 24 dancing couples stand on pegs in three concentric rings around the player (radius 4, 8 and 12 m). Each couple is a 2.4 m cut-out pair (tailcoat and gown), black with a cyan rim (instanced).
- **THE VELVET GLOVES** hide above: two 15 m gloved hands, chunky and low-poly, in RUST velvet (#000 to #912118 to #E5623E, the scene's only warm colour) with gold cuff buttons.
- 10 laser emitters (rust boxes) sit on the box walls.
- Key light is one top spot straight above.

**Lyrics**
- L17 "Velvet gloves on a steel machine", 68.58 to 70.82 (Velvet 68.58, gloves 68.68, on 69.18, a 69.86, steel 70.04, machine 70.38).
- L18 "Waltzing slow through a laser beam", 71.52 to 76.08 (Waltzing 71.52, slow 73.46, through 73.72, a 74.32, laser 74.62, beam 75.44).

**On-screen text**
- 68.58 **VELVET GLOVES**: gold, left, 6 m, 0.8 m above the eyes.
- 69.18 **ON A STEEL MACHINE**: cream, right.
- 71.52 **WALTZING SLOW**: gold, left; the letters sway in 3-beat steps.
- 73.72 **THROUGH A LASER BEAM**: cream, right. BEAM at 75.44 is glued along the nearest laser line and tilted with it.

**Beat events**
- **67.74 to 68.58**: the edge lines fill in as steel.
- **68.58 "Velvet gloves"**: the hands descend from the dark above-left and above-right (eased 1.2 s), fingers spreading.
- **70.03 downbeat / 70.04 "steel machine"**:
  - the right glove grips the crank and turns it one revolution per bar, and the left presses the lid edge;
  - the cylinder starts turning;
  - the comb teeth flash cyan every 8th note as the pins pluck them.
- **70.61**: the couples pop up on their pegs, staggered per ring.
- **71.52 "Waltzing"**: the rings start revolving (inner clockwise, middle counter-clockwise, outer clockwise, 6 to 9°/s). Each couple spins on its peg with a hard step every 3rd beat, a waltz feel against the 4/4.
- **73.46 "slow"**: the rings slow to half speed.
- **74.62 "laser"**: ten rust-red #E5623E beams (flat 4 cm ribbons) snap on across the floor in a fan from the walls, at dancer hip height and below the deck.
- **75.17, 75.75**: where a couple crosses a beam, that segment blinks off and back as they slip through.
- **76.34**: the gloves lift away upward and the cylinder stops.

**Motion.** The cradle glides 2 m/s across the lid toward the cylinder. The couple rings revolve slowly around the player, in the periphery. The gloves stay 10 m or more above the head.

**VR.** The player is tiny on a giant music box. 15 m gloves descend over their head, couples waltz around them in three rings, and the laser fan crosses beneath their feet.

**Out: LIGHTS-OUT** (76.89). Every light, laser and lamp dies at once; only the console gauge glows. S10's single red light switches on at 77.72.

**Why.** Two literal pictures: velvet gloves working a steel machine, and the music box's dancers waltzing slowly through a laser grid.

### S10 The panel room, then the chessboard (76.89 to 83.75, cold then red, group 3)

**Place**
- A circular control room (r 8 m, 12 m high) around the cradle.
- Its wall is 24 tall flip panels, 2 x 10 m, each on a vertical pivot.
  - Front face: petrol #0B3945 with flat instrument graphics: rows of small round gauges with single needles, toggle switches, small cream lamps.
  - Back face: black with a cream chess-piece silhouette.
- Black floor, which later lights as a checkerboard (3 m squares, 16 x 16, out into the fog). Black ceiling.
- One red alarm dome lamp (2 m) hanging at y 5 m, 6 m ahead.
- A flat radar sweep wedge (#217992, 15 m) on the floor, rotating around the player.
- Chess pieces: 32 instanced lathe silhouettes (pawn 3 m up to king 8 m).
- A round hatch ring frame (8 m) that rises at z -20.

**Lyrics**
- L19 "One red light and the whole room spins", 77.62 to 80.62 (One 77.62, red 77.72, light 78.06, and 78.54, the 78.90, whole 79.16, room 79.58, spins 80.18).
- L20 "That's the second the game begins", 81.18 to 84.04 (That's 81.18, the 81.62, second 81.72, the 82.42, game 82.90, begins 83.36).

**On-screen text**
- 77.62 **ONE RED LIGHT**: gold, 6 m ahead, +12°, just under the red lamp.
- 78.54 **AND THE WHOLE ROOM SPINS**: cream, printed on the flip panel ahead-right (+20°, 8 m, eye height). On "spins" the panel flips and takes the words with it.
- 81.18 **THAT'S THE SECOND**: cream, on the back face of the panel ahead-left as it stops.
- 82.42 **THE GAME BEGINS**: gold, centre, 6 m, eye height.

**Beat events**
- **76.89**: total black.
- **77.72 "red"**: the red dome lamp ignites (#FF1E26) and throws a flat red cone to the floor.
- **78.06 "light"**: the whole room flips from the COLD to the HOT ramp in one frame: petrol becomes velvet, carmine and crimson; cream becomes gold. "One red light turns the room red." This is the show's single in-verse exception to the colour rule, because the lyric says so.
- **79.17 downbeat**: the radar wedge starts sweeping the floor (90°/s).
- **79.58 "room"**: the panels wobble.
- **80.18 "spins"**: all 24 panels spin 360° about their own pivots in a ripple that runs once around the room (each spin 0.8 s, ripple 1.2 s). The whole room spins without moving the player.
- **81.18 "That's"**: the panels stop, showing black backs with cream chess silhouettes.
- **81.46 downbeat**: the panels sink into the floor, and the floor lights as a crimson/black checkerboard radiating out into the fog.
- **82.42 to 82.90 "the game"**: the enemy pieces (black with cream rims) rise in two ranks ahead at 18 to 24 m; the player's gold pieces rise around and behind the player.
- **83.36 "begins"**:
  - the gold pawn 3 m to the right slides forward two squares;
  - the black king ahead turns two glowing white eye dots toward the player;
  - the hatch ring at z -20 spins open.

**Motion.** The cradle hovers still until 83.36, then accelerates toward the hatch (eased 1.2 s, to 8 m/s). The panel ring itself never rotates, so this does not read as a spinning drum.

**VR.** A 360° room of 10 m panels flips all around the player. Then the walls drop away, and they stand on a giant chessboard with their own pieces behind them.

**Out: PORTAL** (83.75). The cradle passes through the hatch ring. S11's night sea is visible only inside the ring (`kit.matte`) until the ring passes the eyes.

**Why.** "One red light" is a single alarm lamp that turns the whole room red. "The whole room spins" is every wall panel spinning, and "the game begins" is the chessboard and the first move.

### S11 The sea cable (83.75 to 95.18, cold, group 3)

**Place**
- Night sea: a vast low-poly faceted water plane (#0B3945 with #217992 lit facets, triangles 3 to 6 m) 4 m below the cradle. A vertex swell is zero near the cradle and up to 2 m beyond 30 m.
- Two lines of 30 black buoys with white lights mark the cable route to the vanishing point. One tall buoy 7 m ahead carries a floating marker board at eye height.
- Horizon: a black strip of harbour cranes with 300 tiny cream window lights (no streets).
- A lighthouse 300 m to the right sweeps a flat cream beam wedge (one turn per 8 s).
- The cradle's wire is hidden; the scene draws its own gold cable, which slopes down into the water 30 m ahead.
- Underwater:
  - dense fog #05222C (5 to 50 m);
  - jagged rock shards on a seabed at y -20, with cyan rims;
  - 10 cyan depth rings, 12 m across, along the descending cable, each with a cream numeral from -1 to -10;
  - the surface seen from below as a jagged cyan ceiling;
  - 1500 instanced bubble discs.
- The Engineer appears as a diver silhouette with round cyan goggles.

**Lyrics**
- L21 "Tick, tick, feel the city breathe", 85.42 to 88.44 (Tick 85.42, tick 87.02, feel 87.28, the 87.46, city 87.64, breathe 87.90).
- L22 "Ten floors under what you believe", 88.86 to 90.64 (Ten 88.86, floors 89.20, under 89.76, what 89.84, you 90.08, believe 90.30).
- L23 "Hold your breath... here we go", 91.04 to 94.64 (Hold 91.04, your 91.20, breath 91.76, here 93.14, we 93.46, go 94.04).

**On-screen text**
- **TICK,**: cream, on a buoy left (-25°, 6 m) at 85.42. A second **TICK,** appears on a buoy right (+25°) at 87.02.
- **FEEL THE CITY BREATHE**: gold, on the marker board 7 m ahead, bobbing and tilting with the swell.
- **TEN FLOORS UNDER**: gold, 6 m ahead, eye height, underwater.
- **WHAT YOU BELIEVE**: cream.
- **HOLD YOUR BREATH**: cream, its letters built from frozen bubbles (or plain cream text with a bubble field behind it).
- **HERE WE GO**: gold. GO at 94.04 is big.

**Beat events**
- **85.42 "Tick"**: the buoy lights blink on in a row toward the horizon, and a flat cyan sonar ring spreads across the sea.
- **86.03 downbeat**: the lighthouse beam passes over the player.
- **87.02 "tick"**: a second sonar ring.
- **87.28 to 87.90 "feel the city breathe"**: the harbour's window lights swell and dim like breathing, and the far swell rises and falls.
- **88.86 "Ten"**: the sea rises. The water plane climbs from 4 m below to 2 m above eye height over 1.4 s (eased).
  - **Never render the surface plane through the head.** When it is within 0.5 m of eye level, switch instantly to underwater mode: fog #05222C, the surface seen from below as a jagged cyan sheet, the light shafts rippling.
- **89.20 to 90.30 "floors under what you believe"**: the cable dives, and the 10 depth rings pass around the cradle, one every 0.12 s.
- **90.61 downbeat**: stop on the seabed line.
- **91.04 "Hold"**: all 1500 bubbles freeze mid-rise.
- **91.76 "breath"**: the diver glides in from the left to 4 m away and stops, goggles cyan, one finger raised.
- **92.89 downbeat**: the rock rims pulse.
- **93.14 "here"**: the cable on the seabed lights gold from far to near.
- **93.46 "we"**: the frozen bubbles release and rush upward.
- **94.04 "go"**: the world sinks (the cradle rises) toward the surface, which turns crimson: the hot world waiting.

**Motion**
- 3 m/s above the sea.
- At 88.86 the water rises around the cradle (the world moves, not the cradle).
- From 89.2 to 90.3 the world tilts the cable down a gentle 15° slope past the cradle (eased, at most 4 m/s).
- Still during "hold".
- From 94.04 a 3 m rise toward the surface (eased).

**VR.** The sea surface passes over the player's head and they look up at it from below. 1500 bubbles hang motionless around them in 360°. The lighthouse beam passes overhead before the dive.

**Out: SHATTER** (95.18). The cradle breaks the surface. The water sheet shatters into big jagged cyan shards that blow outward past the player and reveal the Big Top of S12 (S12 `pre` 0.3).

**Why.** The same pre-chorus words get new literal answers. The ticking is sonar, the city is a harbour breathing on the horizon, and "ten floors under" and "hold your breath" literally take the player under water along her submarine cable.

### S12 The Big Top high wire (95.18 to 104.33, hot, group 3)

**Place**
- The inside of a colossal circus tent, 70 m across and 40 m high. The roof canvas is 24 alternating carmine and black stripes radiating from the top of the centre pole: the Saul-Bass sunburst as architecture, rotating slowly.
- Tiers of 600 instanced audience silhouettes (heads and shoulders, white eye dots) ring the tent through 360°.
- The ring floor lies 20 m below the deck: black with a gold ring line.
- The player's wire IS the high wire, strung between two masts with black, gold-rimmed platforms 60 m apart.
- Six spotlights on the tent rim throw flat transparent cream cones.
- Four hoops, 5.2 m across, hang along the wire ahead at 12 m spacing. Their flame rings are flat cut-out tongues in rust, orange and small amber tips.
- **THE HIGH-WIRE WALKER**: the Engineer with a balance pole and a gold rim, 15 m ahead on the wire.
- A trapeze rig hangs above left with **THE ANGEL**: a trapeze-artist silhouette with cream cut-out wings, and a cream pennant banner hanging from the rig.
- Fire-breather silhouettes stand on both masts.
- Key light comes from the spotlights, front-high.

**Lyrics**
- L24 "Gold on the wire, fire in the sky", 95.16 to 99.40 (Gold 95.16, wire 96.64, fire 97.44, sky 98.92).
- L25 "Smile like an angel, lie like a spy", 99.68 to 103.90 (Smile 99.68, angel 101.24, lie 102.10, spy 103.50).

**On-screen text**
- 95.16 **GOLD ON THE WIRE**: gold, printed on the pennant banner 7 m ahead-left, swaying with it.
- 97.44 **FIRE IN THE SKY**: cream, right. SKY flares at 98.92.
- 99.68 **SMILE LIKE AN ANGEL**: cream, left, under the trapeze.
- 102.10 **LIE LIKE A SPY**: gold, big, right. SPY turns rust at 103.50.

**Beat events**
- **95.18 "Gold"**: the shards clear, and all 6 spotlights snap onto the wire ahead, revealing the Walker mid-step.
- **95.75, 96.33, 96.90**: the audience eyes blink on tier by tier from the lowest up, in a wave that travels around 360°.
- **97.44 "fire"**: the hoops ignite, one per beat (97.47, 98.03, 98.62, 99.19), and the fire-breathers blow flat flame cones toward the roof.
- **98.92 "sky"**: the roof stripes flash crimson in rotation.
- **99.68 "Smile"**: the Angel swings in from the left on an 18 m pendulum whose arc passes 4 m above the player. Her cream crescent smile flashes on the up-swing at 100.32.
- **101.24 "angel"**: she lets go at the top of the swing, flies over the player at least 3 m up, and the Walker catches her at 101.47.
- **102.10 "lie"**: her wings fall away as two tumbling cream cut-outs, revealing the Engineer with red glasses. The Walker's spotlight turns rust-red: he is the double.
- **103.50 "spy"**: all 6 spotlights swing onto the player's cradle.

**Motion.** The cradle rides the high wire at 4 m/s and passes through the 4 burning hoops. Each flame ring has a 2.6 m radius centred at head height, so the flames stay at least 2 m from the eyes. The roof rotates 3°/s and the audience tiers stay static.

**VR.** There are 20 m of air under the deck. Burning hoops pass all around the head, a trapeze artist flies over, 600 eyes watch from every direction, and finally every spotlight turns onto the player.

**Out: PORTAL** (103.76 to 104.33). The last and largest hoop, 8 m across, frames the switchboard canyon of S13 (`kit.matte`, circle). The cradle passes through it at 104.33.

**Why.** A high-wire act in gold, fire hoops under the tent's sunburst sky, and the trapeze angel who is really the spy.

### S13 The switchboard canyon (104.33 to 112.04, hot, group 3)

**Place**
- Two 40 m switchboard walls only 9 m apart (x ±4.5), running 200 m to the vanishing point in one-point perspective.
- Each wall is ONE plane whose fragment shader draws a grid of jack sockets (black discs with gold rings) with a lamp above each. Lamps are dark crimson, or gold when lit; their state comes from row-band and wave uniforms driven by t.
- About 150 crimson and black patch cords (catenary tubes) loop between jacks and span the canyon as a ceiling 30 to 38 m up.
- Rows of operator silhouettes in headsets (instanced, 2 x 20) sit at the base of each wall.
- A vertical rotary dial 24 m across stands 60 m ahead like a rose window: a carmine disc with 10 finger holes, cream numerals 1 to 0, and a gold finger-stop.
- Fog to black from 30 to 180 m.

**Lyrics**
- L26 "Count down to zero, don't ask me why", 104.34 to 108.34 (Count 104.34, down 105.28, to 105.58, zero 105.76, don't 106.98, ask 107.38, me 107.72, why 108.10).
- L27 "Gold on the wire tonight", 109.98 to 111.76 (Gold 109.98, on 110.12, the 110.42, wire 110.64, tonight 111.16).

**On-screen text**
- **COUNT DOWN TO ZERO**: gold, painted on the left wall (glued and tilted with it, -33°, about 8 m, eye height). At ZERO the dial's 0 lights gold.
- **DON'T ASK ME WHY**: cream, painted on the right wall (+33°). At 108.10 the redaction bar slams over WHY.
- 109.98 **GOLD ON THE WIRE**: gold, hanging from the plugged gold cord 6 m ahead.
- 111.16 **TONIGHT**: cream, inside the dial's hub.

**Beat events**
- **104.34 "Count"**: the dial winds to 3 (to the stop in 0.4 s) and springs back. It repeats for 2 at 105.28 and 1 at 105.58. At 105.76 "zero" it winds to 0, the longest pull, with the return spin capped at 120°/s.
- **104.34 to 105.76**: the wall lamps go out in 10 horizontal bands from the top down to the floor, a cascade.
- **106.61 downbeat**: pulse.
- **106.98 "don't"**: every operator turns her back to the player in a near-to-far wave (180° in 0.3 s each).
- **107.38 "ask"**: the cross-canyon cords are pulled out and fall in arcs past the cradle (at least 1.5 m away) into the dark.
- **108.10 "why"**: the last cord snaps out with a gold spark, and the redaction slams.
- **108.70 downbeat**: the canyon is dark; only the gold socket rims remain.
- **109.98 "Gold"**: a single gold cord swings in on a 30 m arc and plugs into a socket 2 m to the right of the player at eye height, with a spark.
- **110.12 to 110.64 "on the wire"**: the cord lights end to end, then all wall lamps relight gold in a wave racing away from the player toward the dial. The dial hub lights gold.
- **111.16 "tonight"**: the dial's finger holes light as a ring of cream lamps, and the cord ceiling parts onto black sky with stars.
- **111.48 to 112.04**: the lamps die column by column (fade-to-black).

**Motion.** The cradle runs 6 m/s, eases to 2 m/s after "zero", eases up to 8 m/s at 109.98, and eases down to 2 m/s by 112.

**VR.** 40 m walls of lights tower on both sides only 4.5 m away, with a ceiling of cords above. Cords fall past the player, and a cord is plugged in right beside their head.

**Out: FADE-TO-BLACK** (111.48 to 112.04). S14 is black until "Three" at 112.62.

**Why.** "Count down to zero" is a whole telephone exchange dialled and going dark. "Don't ask me why" is every operator turning away and every line ripped out. "Gold on the wire tonight" is the one line she leaves connected: to the player.

### S14 The records archive and shredder (112.04 to 119.98, cold, group 4)

**Place**
- An endless corridor between two rows of 6 m filing cabinets, 8 m apart, running to the vanishing point and behind. The cabinets are petrol with lit #217992 drawer fronts and black shadows (instanced 2 x 30 units, each with 6 drawer boxes).
- Three huge lampshades hang over the aisle at 8, 18 and 30 m ahead, throwing flat transparent cream cones, off at first.
- A giant shredder stands 32 m ahead: a black block 10 m wide with a cyan slot line.
- It is being fed the Engineer's dossier: an 8 x 12 m cream sheet with her black silhouette photo clipped to it, sliding toward the slot.
- Key light comes from the lamps, top-down.

**Lyrics**
- L28 "Three... two... one...", 112.62 to 117.10 (Three 112.62, two 114.60, one 115.90).
- L29 "You were never here", 117.74 to 118.68 (You 117.74, were 117.90, never 118.02, here 118.54).
- L30 "Three two one", 118.68 to 119.56 (Three 118.68, two 119.20, one 119.50).

**On-screen text**
- 112.62 **3**: a gold numeral 2.5 m tall, left, 6 m. 114.60 **2**: centre-left. 115.90 **1**: centre-right. Each holds.
- 117.74 **YOU WERE NEVER HERE**: cream, centre, 5 m, word by word. At 118.54 ("here") it is cut into horizontal strips that drop away like shredded paper.
- 118.68, 119.20, 119.50: a small cream 3, 2, 1 blink in quick succession and vanish.

**Beat events**
- **112.04 to 112.62**: black.
- **112.62 "Three"**: lamp 3 (the nearest) snaps on, and every drawer in its stretch slams shut.
- **113.19, 113.79, 114.37**: drawers further down slam shut on each beat, rippling away.
- **114.60 "two"**: lamp 2 comes on and drawer block 2 slams.
- **115.90 "one"**: lamp 1 over the shredder snaps on.
- **116.59, 117.16**: the shredder starts and the dossier slides in.
- **117.74 "You were never here"**: the dossier and photo vanish into the slot, and 200 cream paper strips burst up and swirl around the player through 360° in a slow spiral (the nearest 0.8 m away).
- **118.68, 119.20, 119.50**: the three lamps go out in reverse order, one per word. The strips keep falling in the dark, visible only by their cream colour.

**Motion.** The cradle glides 1.5 m/s toward the shredder with the cabinets 4 m away on each side. The strips spiral down around the cradle.

**VR.** Canyons of cabinets stretch ahead and behind, shredded strips swirl around the head, and the lamps go out above, one by one.

**Out: EDGE-MODE** (119.56 to 119.98). The cabinets lose their fill. Their cyan edge lines stream forward and flatten onto the concave screen of S15, where they become its vector drawings (S15 `pre` 0.4).

**Why.** The bridge's "three, two, one" is a self-destruct of the evidence: the drawers slam and the dossier is shredded. "You were never here" happens to the Engineer's own file.

### S15 Inside the scope (119.98 to 127.62, cold, group 4)

**Place**
- The inside of a giant cathode-ray tube.
- Ahead: a concave phosphor screen, 50 m wide and 35 m tall, curved, its centre 25 m ahead and on the vanishing point. It is black with a faint petrol graticule (10 x 8 lines of #0B3945, brighter centre cross).
- The tube's funnel walls (black, cyan rim edges) taper backward past the player into a narrow neck that ends 40 m behind at the electron gun: three cyan rings and a white cathode point.
- The electron beam is a thin white line from the gun, passing about 3 m over the player's head, to the screen point being drawn.
- On the screen: cyan vector line drawings (phosphor polylines) of six earlier places: a pole with its streetlamp (S03), a mirror dish (S05), a ropeway tower (S07), the bomb (S08), a waltzing couple (S09) and a hoop (S12). There is also a small drawing of the cradle with a stick figure in it.

**Lyrics**
- L31 "You were never here", 119.56 to 123.64 (You 119.56, were 122.30, never 122.60, here 123.00).
- L32 "Lights out", 124.94 to 127.10 (Lights 124.94, out 126.38).

**On-screen text**
- **YOU WERE NEVER HERE**: cream, in front of the screen at 6 m, eye height. YOU is visible from 119.98; then WERE 122.30, NEVER 122.60, HERE 123.00. The erase sweep wipes it.
- 124.94 **LIGHTS**, 126.38 **OUT**: gold, centre, 6 m. On OUT the letters squash with the screen into the dot.

**Beat events**
- **119.98 to 121.50**: the beam draws the six memory sketches and the cradle sketch, one after another (each a 0.25 s draw-on).
- **122.30 "were"**: a vertical erase bar starts sweeping left to right; every line it passes vanishes.
- **122.33 downbeat**: pulse.
- **122.60 "never"**: half the memories are gone.
- **123.00 "here"**: the cradle sketch with the player in it is erased. Only the graticule remains.
- **123.6, 124.1, 124.67**: the graticule dims in 3 hard steps.
- **124.94 "Lights"**: the whole screen image squashes vertically into one bright horizontal white line (0.4 s), the CRT switch-off.
- **126.38 "out"**: the line collapses into a single white dot at the screen centre. Everything else is black, and the rig wire goes out too.
- **126.91 to 127.62**: only the dot, which grows slowly.

**Motion.** The cradle is stationary. Only the beam, the drawings and the erase bar move: total calm after the busy chorus.

**VR.** Looking back shows the tube neck and the electron gun firing its beam over the player's head. The curved screen wraps the front 200°.

**Out: MATCH-CUT** (127.62 to 127.68). The dot on the vanishing point bursts into S16's 120 m sun with a 2-frame amber flash.

**Why.** "You were never here" is the record being wiped: every place the player visited, then the player. "Lights out" is an old screen switching off into a dot.

### S16 The Dynamo Sun (127.62 to 136.03, amber then hot, group 4)

**Place**
- An endless black plain with a grid of thin gold lines.
- On the vanishing point, 300 m away (dome sun): a 120 m sun disc (#FDD890 core, #E5623E ring, #912118 outer ring).
- The full sunburst dome across the whole sky, 360°.
- Two colossal dynamo rings stand left and right of the wire at z -40 with 12 m of clearance: 60 m tall black stator rings, each with 48 instanced gold coil-winding blocks and a rim. They turn slowly in opposite directions (0.15 rad/s).
- The Engineer: an 80 m backlit black silhouette in front of the sun, with the sun exactly behind her head and a rim. Her shadow lies across the plain toward the cradle as one flat black shape that can morph.

**Lyrics**
- L33 "Gold on the wire, fire in the sky", 127.68 to 131.44 (Gold 127.68, on 128.36, the 128.70, wire 128.94, fire 129.80, sky 131.16).
- L34 "Smile like an angel, lie like a spy", 131.68 to 135.98 (Smile 131.68, angel 133.54, lie 134.56, spy 135.72).

**On-screen text**
- **GOLD ON THE WIRE**: gold, the biggest text of the show (cap 1.6 m), 8 m ahead, 0.6 m above the eyes.
- **FIRE IN THE SKY**: cream, +15° up, 8 m.
- **SMILE LIKE AN ANGEL**: gold, left (-25°, 6 m).
- **LIE LIKE A SPY**: cream, right (+25°, 6 m). On SPY the shadow swallows the words.

**Beat events**
- **127.68 "Gold"**: AMBER CLIMAX 1.
  - The dot bursts into the sun; all amber rays slam on with a 2-frame amber flash.
  - The world ramp is AMBER, and the wire lights gold all the way into the sun.
- **128.36 to 128.94 "on the wire"**: the dynamo rings start turning, and their coil blocks light gold one after another around each ring.
- **129.28 downbeat**: pulse.
- **129.80 "fire"**: a ring of flat jagged gold-and-amber flame shapes (30 to 50 m) leaps up along the whole horizon, 360°, and falls back over 2 s.
- **130.46 to 131.16 "in the sky"**: the rays extend over the zenith and down behind the player.
- **131.2 to 131.68**: the sky cools from AMBER to HOT (crimson rays, gold rings). The sun disc stays amber.
- **131.68 "Smile"**: the Engineer rises in front of the sun (eased 1 s). The sun is her halo; her glasses are 6 m white discs, with a gold crescent smile.
- **132.56 to 133.54 "like an angel"**: two wing fans of 20 gold wires each spread to 120 m.
- **133.75 downbeat**: the wings flare.
- **134.56 "lie"**: the glasses turn red and the crescent flattens.
- **135.06 to 135.72 "like a spy"**: her long shadow morphs into a spy silhouette (hat brim, raised collar) and slides forward. On "spy" it covers the cradle and the ground around the player goes pure black.

**Motion.** The cradle runs at 8 m/s toward the sun, which is too far away to grow. The dynamo rings pass on both sides around 132.5. The flame ring rises and falls in the periphery.

**VR.** The largest scale of the show: an 80 m woman with 120 m wings against a sun, 60 m rings passing on both sides, and the sky blazing in every direction. At the end the player stands inside her shadow.

**Out: WORLD PASSES BY** (135.5 to 136.03). The plain runs on; a black steel launch deck slides in from the vanishing point under the cradle. No cut. S17 `pre` 0.5.

**Why.** "Fire in the sky" is a sun and a ring of fire. The angel/spy duality at its most literal: the angel stands against the light, and the spy is her shadow reaching the player.

### S17 The sea launch platform (136.03 to 142.91, hot then amber, group 4)

**Place**
- A black steel deck rising out of a flat black sea at the end of the plain.
- A 55 m rocket stands 12 m front-right of the cradle at bearing +30°: a cream #F7EFE0 body with crimson bands and black fins, in 3 hard steps.
- Beside it, a black lattice gantry tower 60 m tall with swing arms, joined to the rocket by 6 gold umbilical wires. On the gantry, a vertical column of 4 big round red countdown lamps.
- A flame trench lies below, and the sunburst sky is behind.
- Key light is the sunburst backlight until ignition, then the rocket's flame from below.

**Lyrics**
- L35 "Count down to zero, don't ask me why", 137.28 to 140.88 (Count 137.28, down 137.48, to 138.04, zero 138.10, don't 138.94, ask 139.76, me 140.10, why 140.42).
- L36 starts: "Gold on the wire", 141.74 to 142.72 (Gold 141.74, on 142.20, the 142.58, wire 142.72; "tonight" follows in S18).

**On-screen text**
- **COUNT DOWN TO ZERO**: gold, left, word by word. ZERO at 138.10 is a 2 m gold 0 that blazes amber.
- 138.94 **DON'T ASK ME WHY**: cream, centre-left. At 140.42 the exhaust sweeps across and burns WHY away, its letters crumbling into amber embers: the redaction motif done in fire.
- 141.74 **GOLD ON THE WIRE**: gold, set along the rising gold trail, tilted 30° up with it.

**Beat events**
- **136.03 to 137.28**: flat steam blobs roll out at the pad base, all gantry lamps are red, and the rocket vents puff on 136.62 and 137.19.
- **Countdown**: the lamps go out one per word: lamp 4 at 137.28 "Count", lamp 3 at 137.48 "down", lamp 2 at 138.04 "to", lamp 1 at 138.10 "zero".
- **138.10 "zero"**: IGNITION, AMBER CLIMAX 2.
  - The sky and every hot ramp jump to AMBER for about 3 s.
  - A flat cel flame plume bursts at the base, and cream smoke blobs billow out 360° around the cradle (at least 3 m away).
  - The gold umbilicals detach and swing away.
- **138.94 "don't ask me why"**: the rocket rises past the player's view, easing from 0 to 20 m/s over 2 s.
- **139.46, 140.04**: the gantry swing arms fall back, one per beat.
- **140.61 downbeat**: the smoke ring expands to the horizon.
- **141.0**: the ramp eases back to HOT.
- **141.74 "Gold on the wire"**: the exhaust trail hardens into a straight gold line, a wire from the pad to the sky.
- **142.72 "wire"**: the rocket is a bright amber dot at the centre of the sunburst.

**Motion.** The cradle eases from 8 m/s to a stop at the pad by 137.2 (1.2 s). All motion now comes from the rocket and the expanding smoke.

**VR.** A 55 m rocket lifts off right beside the player and they follow it straight up with their head. A 360° wall of smoke rolls out around them, and the amber blaze fills the sky.

**Out: MATCH-CUT** (142.91). The rocket's amber dot becomes S18's amber sun disc, at the same screen position and in the same colour.

**Why.** "Count down to zero" at its most literal, a launch countdown, and "don't ask me why" answered with lift-off. The exhaust becomes the gold wire.

### S18 Salt flat return: title reveal and clean end (142.91 to 153.771, hot with amber sun, group 4)

**Place**
- The leitmotif return to S01 (`kit.saltFlat`, the same pole rows and the gold wire running straight to the vanishing point).
- The focal point now holds a blazing amber sun disc (#FDD890 core, #E5623E ring); the sunburst rays are crimson with gold rings.
- A split Two-Faced Mask stands on the horizon about 25° left: a cream angel half and a black Engineer half with one round glass (built by group 4 itself).
- Hidden below the plain in a curved row 45 m away, left and right of the sun: 20 m title letters **GOLD ON THE WIRE** (gold type, rim-lit), with **MISTYCONIFER** (cream, 5 m) below.
- Key light is the sun, a backlight that rims everything.

**Lyrics**
- L36 "tonight", 143.16.
- L37 "Oh-oh, gold on the wire", 144.58 to 147.34 (Oh-oh 144.58, gold 145.60, on 146.52, the 146.90, wire 147.16).
- L38 "Gold on the wire... tonight", 147.34 to 148.44 (tonight 148.00).
- Outro 148.44 to 153.77.

**On-screen text**
- 143.16 **TONIGHT**: cream, eye level, centre-right, 6 m, leaving at 144.5.
- 144.58 **OH-OH**: gold, left, pulsing on 144.58 and 145.18.
- 147.34 to 148.00 TITLE REVEAL: the giant **GOLD ON THE WIRE** letters rise out of the plain one letter per 16th note, framing the sun within ±30°.
- 148.00 **TONIGHT**: cream, 3 m tall, under the title.
- 148.60 **MISTYCONIFER**: cream, wide tracking, rises under it.
- The title holds until the fade and sinks last.

**Beat events**
- **142.91**: the match-cut lands.
- **143.16 "tonight"**: the sun swells to full size.
- **143.46, 144.03**: the pole lamps flicker on from near to far.
- **144.58 "Oh-oh"**: the lamp rows light in two waves racing toward the sun (144.58, 145.18).
- **145.60 "gold"**: a spark runs along the wire into the sun (a callback to 0.26).
- **146.31, 146.90**: the rays pulse on the beats.
- **147.34 "Gold on the wire..."**: the title letters rise, each eased over 0.4 s.
- **148.00 "tonight"**: the sun flares, the brightest moment of the show (2 frames).
- **148.60**: MISTYCONIFER rises.
- **149.17**, the last beat: the rays stop rotating and everything holds.
- **150.00 to 152.5**: fade to black. The rays go out from the edges inward, the pole lamps die from far to near, and the sun shrinks to a dot on the wire.
- **151.50**: the wire is snipped at the sun with a single white spark, and the wire ahead and behind goes dark. The title stays lit.
- **152.0**: the title letters sink.
- **151.8 to 153.6**: the lobby (room, desk, case, phone, tapes) fades back in around the player; show.js does this. The deck fades out at 152.8 (rig.js does this).

**Motion.** The cradle glides toward the sun at 2 m/s and eases to a stop by 150.0. The dome rotates 2°/s until 149.17, then stops.

**VR.** The same place as the very first second, now complete. 20 m title letters rise out of the ground around the sun under a 360° sky. Finally the lobby rebuilds itself around the player where the desk stood.

**Out: FADE-TO-BLACK** into the lobby. By 153.6 every S18 object is dark, so the scene is clean at 153.771. `onReturn(k)` uses the global fade for early returns.

**Why.** The wire from the first second now leads into a completed fire in the sky. The last "gold on the wire... tonight" writes the song title across the world, the line is cut, and "you were never here": the player is back at the desk.
