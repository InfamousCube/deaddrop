# DD-003 show, round 3: GOLD ON THE WIRE (MistyConifer), storyboard v3

This file replaces `STORYBOARD.md` (round 1) and the round-2 shot cards as the plan for round 3. `API.md` stays the technical contract (kit, type, fx, travel, comfort, clarity). When a scene is rebuilt, its file header gets a new shot card that follows this file. The title is always **Gold on the Wire**. Never print "Black Box".

Sources used: Leo's round-2 feedback, `reference/IEYTD3-INTRO-ANALYSE.md` and the dense IEYTD3 sheets (`reference/ieytd3-dense/`), the round-2 sheets (`tools/shots/blackbox/clean/live/sheet-01/02.png`), `words.json`, and `node tools/lyriccheck.mjs` (Part A and the vocal-stem Part B, run 07.11. with `runs=`).

## 0. What Leo said, and what v3 does about it

| Leo (round 2) | v3 answer |
|---|---|
| "Often makes little sense, you can't tell what it is" (S13 rotary dial before 3-2-1) | Every scene is a **real place or a real object in its real context**, the kind of thing a 16-year-old knows from films and games: a telegraph line, a roulette wheel, a street with a black car, a champagne tower, a hall of mirrors, a clock tower, a foundry, a time bomb on a vault door, a safe and laser beams, an alarm light and a chessboard, a harbour, fireworks over a bridge, a red phone booth, a self-destructing tape, a wall of TV monitors. No object floats alone on a flat field. |
| "Everything is rectangles and bars, not IEYTD quality" | Section 3: every hero is built from **its 4-6 defining real parts** with real proportions, bevels and one repeated fine detail (teeth, rivets, bolts, ribs, pockets, window panes). Lathe, extrude-with-bevel and tube geometry, not boxes. |
| "Too little happens around you, everything is in front" | Every scene is a **corridor or an enclosure**: rows of big shapes pass on the left and right at 3-12 m, something passes overhead, and things come to the player. 70 % of the action stays in front (IEYTD rule), 30 % at the sides and above. |
| Likes S16 (pylons, angel, halo tilts, all red) and S17 (rocket) | **Kept as they are** (group 4, `scenes-4-b.js`). They are the quality bar for everything else: real object, real parts, a corridor of repeated things passing, one clear story beat. |
| "Some transitions are really bad" | Every change is **motion through space with a reason** (section 5): the world assembles or falls apart around the player, a door opens and you glide through, the next world is visible inside the frame, a match cut on the same shape, objects fly past. No plain cuts, no fades except into the bridge and the end. |
| "Some words are off; the second 3-2-1 does not fit" | `words.json` itself is wrong at both countdowns (13 word times) and at about 20 more word times. Section 2 lists the corrections. They are applied **once, before the groups start**, and every lyric block uses `near:` lookups so the fixes reach the show automatically. |

Still valid: Gemini's hot palette (crimson, gold, cream, black) for choruses and finale, cold petrol/cyan worlds for verses and bridge, hard 3-step toon shading, lyrics big and one block at a time, lobby and desk gone during the song, **nothing that travels with the player** (no cockpit, no deck, no disc under the feet; the IEYTD cog disc is not used).

## 1. The story: one night, one job

**In one sentence for Leo:** Tonight a spy (the Engineer) steals the gold from under the city and escapes by rocket, and you ride along her plan from the first signal on the wire to the launch at dawn.

Her **gold wire** runs through almost every world, the way the cog runs through IEYTD3: telegraph wire, roulette rim, elevator cable, crane wires, the bomb's gold wire, the bridge cables, the phone line, the tape, the power lines, the rocket trail, the title.

| # | Place | What happens (story) |
|---|---|---|
| S01 | Telegraph line in the desert at sunset | The signal runs along the wire: the job is on. Her calling card, the Queen, shows her two faces: angel in front, spy on the back. |
| S02 | A giant roulette wheel in a dark casino | The card is dealt, the bet is placed: the ball counts down and lands on the gold zero. Then it rolls away into the night. |
| S03 | A city street with old streetlamps | The gold ball rolls down the street to the black car that waits where the lamps end. The car pulls away and you glide into the hotel. |
| S04 | The hotel banquet hall | A party for one: a champagne tower, every chair empty. Everything freezes. The room falls apart. |
| S05 | The hall of mirrors behind it | Her face in every mirror. The mirrors are secret doors, every exit leads somewhere. The last one shatters. |
| S06 | Inside the city clock tower, then the shaft below it | Gears tick around you, the city breathes behind the clock face, and you sink ten floors down a shaft under the city. |
| S07 | The secret gold foundry at the bottom | Molten gold pours, gold angel statues ride past on conveyors. One of the angels turns her head: it is her. |
| S08 | The vault door with a time bomb | The bomb counts down to zero, the cutters snip the gold wire, the vault door swings open, you fly through it. |
| S09 | The steel vault | A velvet glove cracks the safe. Behind it a laser corridor, and she waltzes through the beams. |
| S10 | The same vault, red | She touches one beam: one red alarm light spins. The floor is a chessboard and the guards rise as chess pieces: the game begins. |
| S11 | Under the harbour | Trap door, into the water. Pier pilings pass, a ship slides overhead, the black car lies on the bottom. She shoots up to the surface. |
| S12 | The harbour bridge at night | The bridge cables light up gold, fireworks fill the sky and draw her: an angel, then a spy. |
| S13 | A red phone booth at the end of the pier | She dials zero. The call runs as a gold spark along the phone wire into the city. |
| S14 | Headquarters: a giant tape machine | The call is recorded, counts down 3-2-1 and burns: the tape destroys itself. |
| S15 | The wall of security monitors | The cameras go dark row by row, she vanishes from the last screen, lights out: the screen shrinks to a dot. |
| S16 | The dot becomes the sun over the power lines (kept) | Dawn. The angel against the sun, the halo slips, everything turns red: the spy. |
| S17 | The sea launch platform (kept) | Count down to zero, lift-off. The rocket's trail becomes the gold wire. |
| S18 | Back on the telegraph line | The title rises out of the desert on "gold on the wire... tonight". The lobby comes back. |

**Recurring beats** (each time a new machine, never the same twice):
- **Angel and spy** (4 choruses): S01 the Queen card flips; S07 the statue that turns her head (halo drops to a hat brim); S12 the firework picture re-forms; S16 the halo tilts (kept).
- **Count down to zero** (4 choruses): S02 roulette ball lands on 0; S08 bomb flip counter; S13 phone dial; S17 launch lamps (kept). The bridge counts twice more: S14 tape lamps, S15 monitor rows.
- **Her look** (one character everywhere): sharp black bob, high collar, long black gloves, round glasses (white; red on every "lie"). Her spy self adds a wide-brim hat and an upturned collar. Built per scene in that scene's pose, always the same outline rules.

## 2. Lyric timing: fix `words.json` first

`lyriccheck.mjs` Part A (show vs `words.json`) found 12 mismatches; Part B (vocal stem `analysis/gold-on-the-wire/vocals.wav`) shows that `words.json` is itself wrong in these places. The vocal stem cannot be listened to on Leo's PC (silent rule), so the proposals below come from voiced runs and energy onsets (`runs=`). They are estimates: Leo confirms them on the Quest.

**Owner:** the integrator, once, before the groups start (or the group-4 fixer if the integrator says so). Keep line `s`/`e` consistent with the first and last word. Re-run `node tools/lyriccheck.mjs port=5841` afterwards: Part B must lose these warnings, Part A must stay green.

| line | word | words.json | proposed | evidence (vocal stem) |
|---|---|---|---|---|
| L3 | Gold | 12.80 | **13.42** | 12.80-13.42 silent (span 29 % voiced); voice run starts 13.42 |
| L4 | car | 17.56 | **17.87** | onset 17.87 inside run 17.44-18.46 |
| L6 | mirror | 29.98 | **29.39** | voice already runs from 29.39 |
| L8 | tick (2nd) | 38.74 | **38.52** | voice from 38.52 |
| L10 | here | 44.86 | **45.14** | no voice before 45.14 |
| L14 | Gold / on / the / wire / tonight | 59.96 / 61.52 / 61.86 / 62.08 / 62.62 | **60.52 / 61.15 / 61.43 / 61.72 / 62.28** | Gold squeezed to 60 ms; run ends 60.87, next run 61.15; onsets 61.43, 61.72, 62.28 |
| L16 | gold / on / the / wire | 67.36-67.54 (60 ms each) | **remove**, keep "Oh-oh" at **66.13** | no voice at all in 67.27-68.57; onset 66.13. If Leo hears a second "gold on the wire" there, re-time it instead |
| L18 | Waltzing | 71.52 | **72.03** | voice starts 72.03 |
| L21 | Tick (1st) | 85.42 | **86.82** (uncertain) | no voice 84.79-86.82 (11 % voiced span); Leo checks |
| L28 | Three / two / one | 112.62 / 114.60 / 115.90 | **114.29 / 115.39 / 116.56** | runs 114.29-114.79, 115.39-115.92, 116.56-117.04 (2 beats apart). words.json is one word early |
| L29 | never / here | 118.02 / 118.54 | **118.33 / 118.91** | runs 117.74-118.06, 118.33-119.47, onset 118.91 (You 117.74, were 117.90 stay) |
| L30 | Three / two / one | 118.68 / 119.20 / 119.50 | **119.95 / 121.16 / 122.27** | runs 119.95-120.42, 121.16-121.65, 122.27-...; this is **the "second 3-2-1 that does not fit"** |
| L31 | You / were / never / here | 119.56 / 122.30 / 122.60 / 123.00 | **123.15 / 123.50 / 123.85 / 124.35** (estimate) | onsets 123.15, 123.50; run holds to 125.08; same 6-beat spacing as the first round (You = Three + 3.40 s) |
| L32 | Lights | 124.94 | **125.70** | run 122.27-125.08 is still "here"; next run 125.70-127.62 |
| L33 | Gold | 127.68 | **128.27** | no voice before 128.27 (S16's flash at 127.64 stays, it is on the music) |
| L38 | Gold / on / the / wire | 147.34-147.52 (60 ms each) | **remove**, keep "tonight" 148.00 | squeezed duplicate of L37; if Leo hears it sung, re-time to 147.42 / 147.60 / 147.78 / 147.96 |

Left as they are: L0 (first words squeezed, but the lobby breaks until 0.7 s; the title pops at 0.30), L35 "to" 138.04 (S17's lamps are on it).

**Part A rows this storyboard removes by design:** S03 "END" never visible (new block "END" alone, 22.38); S08 "03"/"COUNT" late (S08 now starts at 56.30); S08 "GOLD" late (words.json fix); S15 "YOU" late (fix + new S15); L37 missing and S18 title late (the title letters now rise word by word on L37, section S18).

**Lyric rules (unchanged, from `API.md`):** one block at a time, at most 2 lines, about 12 characters per line, within ±35° of forward, on the `words.json` times via `near:`, gone (`out`) before the next block. Gold for the key phrase, cream for the rest, rust for SPY. Countdowns as big digits (lyriccheck matches '3'/'2'/'1'/'0'). Every WHY is redacted. Times below are words.json; **c** marks a corrected time from the table above.

## 3. Shape and space rules for round 3

**Quality bar: S16 and S17.** Before you build, open `tools/shots/blackbox/clean/live/sheet-02.png` (129.8-141.8 s) next to `reference/ieytd3-dense/sheet-03-052-078.png` and `sheet-06-130-154.png`.

1. **Real object, real parts.** Each hero has the 4-6 parts that make the real thing recognisable, in real proportions (the reference sizes are given per scene; scale up uniformly, never stretch). Never a box with a box on top.
2. **Build from profiles.** `LatheGeometry` for round things (bottles, glasses, poles, bells, lamps, chess pieces, tanks, domes), `ExtrudeGeometry` with `bevelEnabled` (bevel 3-6 % of the part size, 1-2 bevel segments) for flat-profiled things (gears, car body, card, door rims, frames, wings, pliers), `TubeGeometry` along curves for cables, cords, arms and handles, `InstancedMesh` for the one repeated fine detail. Flat-shaded, low-poly faces.
3. **One repeated fine motif per hero** (gear teeth, bolt ring, rivet band, roulette frets, window panes, piano keys, barnacle rings). That rhythm is what makes it look manufactured.
4. **Bevels show.** Bevelled edges catch the rim light as a thin lighter line (`toon({ rim })`), like IEYTD's door rims. Round things get 2-3 toon bands.
5. **2-3 tones plus black per world.** About half of every frame black (shadow shapes, not noise).
6. **Surround the player** (IEYTD corridor): one hero at the vanishing point or in the front ±35°; a row of 3-8 big repeated shapes on each side at 3-12 m passing at the travel speed; one big shape overhead (arches, cables, a hull, chandeliers, a deck); the world often comes to the player (conveyors, statues, a car, a ship, pieces rising). Fog hides the far end of the rows so they never become specks.
7. **Comfort (no cockpit):** travel ≤ 4 m/s, vertical ≤ 2 m/s, eased ≥ 1 s; large structures around the player rotate ≤ 3°/s (a wheel, a reel, the room; a small gear may turn faster); nothing closer than 1.5 m to the eyes; things passing at the sides at ≥ 3 m; no surface (water, floor) ever passes through the eyes (break it before, or cut through black); shards and debris fly away from the player; flashes 0.03 s, nothing whole-view faster than 3 Hz.
8. **Budget per eye, whole frame:** ≤ 150 draw calls, ≤ 200k triangles. Owner scene ≤ 90 calls / ≤ 150k tris unless a scene card says less; the `pre`/`post` partner ≤ 40 calls.
9. **Clarity (`tools/clarity.py`) per forward frame:** edges ≤ 0.095, specks ≤ 26, colours ≤ 8, busy ≤ 19.8; show medians edges ≤ 0.056, busy ≤ 12.4, black ≥ 0.38. Round 3 adds side rows, so aim lower in front: each card gives a target. Side/up views have no hard limit, but must also read in half a second.

## 4. Scene table

| id | window (s) | section | world | one-line content | out |
|---|---|---|---|---|---|
| S01 | 0.00-7.90 | chorus 1 | hot | Telegraph line at sunset, the Queen card | card falls flat; the roulette wheel rises around you |
| S02 | 7.90-17.20 | chorus 1 + instr. | hot | Roulette wheel, ball lands on 0 | lights out ring by ring; the gold ball rolls away and lights the street |
| S03 | 17.20-23.40 | verse 1 | cold | Street of lamps, the black car | car passes on the left; hotel doors open, glide through |
| S04 | 23.40-28.10 | verse 1 | cold | Banquet hall, champagne tower, empty chairs | table, chairs and walls fly apart outward |
| S05 | 28.10-36.20 | verse 1 | cold | Hall of mirrors that are secret doors | the end mirror shatters, clockwork behind |
| S06 | 36.20-47.40 | pre-chorus 1 | cold, black end | Clock tower gear works, shaft ten floors down | shaft doors open; foundry lights on at 47.48 |
| S07 | 47.40-56.30 | chorus 2 | hot | Gold foundry, angel statues, the spy among them | two giant statues close like sliding doors |
| S08 | 56.30-67.95 | chorus 2 + oh-oh | hot | Time bomb on the vault door, the door opens | fly through the door ring |
| S09 | 67.95-77.30 | verse 2 | cold + rust | The safe, then the laser waltz | one beam touched, all lasers out |
| S10 | 77.30-84.70 | verse 2 | cold to red | Alarm beacon, chessboard armies | floor drops away, sink through black |
| S11 | 84.70-95.10 | pre-chorus 2 | cold | Under the harbour, the diver | the surface shatters upward |
| S12 | 95.10-104.20 | chorus 3 | hot | Harbour bridge, fireworks, angel/spy picture | glide on to the pier (no cut) |
| S13 | 104.20-112.04 | chorus 3 | hot | Red phone booth, dial 0, the call runs along the wire | all dark but the gold wire, it becomes the tape |
| S14 | 112.04-119.70 | bridge | cold | Giant tape machine self-destructs | smoke closes and parts |
| S15 | 119.70-127.62 | bridge | cold | Wall of monitors goes dark, lights out | CRT dot becomes the sun (match cut, kept) |
| S16 | 127.62-136.03 | final chorus | amber/hot | **kept** | **kept** |
| S17 | 136.03-142.91 | final chorus | hot/amber | **kept** | **kept** |
| S18 | 142.91-153.771 | outro | hot | Telegraph line again, title rises | fade, lobby returns (show.js) |

Hot and amber cover about 56 % of the runtime. Group boundaries: group 1 0-36.20 (unchanged), group 2 36.20-**77.30** (was 76.89), group 3 **77.30**-112.04, group 4 112.04-153.771 (unchanged).

## 5. Transition list (outgoing scene owns it, incoming sets `pre`)

| out of | type | when | what the player sees |
|---|---|---|---|
| S01 | WORLD ASSEMBLES | 7.46-7.90 | The card (now about 20 m ahead) tips forward and falls flat on the sand; the desert sinks away (≤ 2 m/s) while the roulette bowl rises around and below you. S02 `pre` 0.45. |
| S02 | LIGHTS OUT, then LIGHTS ON along a path | 15.10-17.20 | Wheel rings and chandelier go dark from outside in; only the gold ball glows. It hops out of the 0, rolls forward into the dark, and each street lamp it passes switches on, left and right. S03 `pre` 1.0. |
| S03 | PASS-BY + DOOR PORTAL | 22.40-23.40 | The car drives at you and passes 3.5 m to your left (whoosh). Behind it the hotel's tall doors swing open, the warm banquet hall already visible inside the frame; you glide through. S04 `pre` 0.8. |
| S04 | WORLD FALLS APART | 27.34-28.10 | Chairs, glasses, candelabras and table lift and fly outward past you (≥ 3 m, away from you); the walls fall outward like cards and the mirror hall is standing behind them. S05 `pre` 0.7. |
| S05 | SHATTER | 35.80-36.20 | The big end mirror shatters as you reach it; shards fly forward and outward; the clockwork glows behind. S06 `pre` 0.4. |
| S06 | DOOR OPENS + LIGHTS ON | 45.30-47.48 | Art-deco shaft doors part (crimson seam), you glide through into black; on "Gold" (47.48) the furnaces ignite in a row from near to far. S07 `pre` 0. |
| S07 | BODY WIPE | 55.50-56.30 | Two 12 m angel statues flanking the hall's end slide in from left and right and close the view, then part again on the bomb close-up. S08 `pre` 0.3. |
| S08 | FLY-THROUGH THE DOOR | 64.00-67.95 | Bolts retract, the 7 m door swings open, the door ring grows and passes around you (radius 3.5 m). Inside: dark steel. S09 `pre` 0.5. |
| S09 | LIGHTS OUT | 76.08-77.30 | Her fingertip touches one beam; every laser goes out at once (76.60). Black until the one red light. S10 `pre` 0. |
| S10 | FALL THROUGH (gentle) | 84.04-84.70 | Board squares drop away from the far end toward you (≤ 3 m/s); you sink at 1.5 m/s into the black hole; the board edge rises past at ≥ 3 m. S11 fades up from black at 84.70 (0.5 s). |
| S11 | SURFACE SHATTER | 94.40-95.10 | Rising at 2 m/s, the lit water surface 2 m above you breaks into petrol triangles that fly up and away before you reach it; you come out into the night air. S12 `pre` 0.3. |
| S12 | WORLD PASSES BY | 103.50-104.20 | You glide out from under the bridge deck; the pier with the lit red booth is already ahead. S13 `pre` 0.8. |
| S13 | LIGHTS OUT, wire last | 111.76-112.04 | Everything goes black except the gold wire overhead (left to right, 4 m above your eyes). S14 starts with the tape glowing at exactly that place. S14 `pre` 0. |
| S14 | SMOKE WIPE | 119.00-119.70 | Big flat petrol smoke puffs roll in from both sides (≥ 2 m away), close the view and part on the monitor wall. S15 `pre` 0.4. |
| S15 | MATCH CUT (kept) | 125.70-127.62 | The last CRT collapses to a line and a dot; the dot rises to 14° and becomes S16's sun. |
| S16 | WORLD PASSES BY (kept) | 135.5-136.03 | kept |
| S17 | MATCH CUT (kept) | 142.91 | rocket dot becomes the sun |
| S18 | FADE (kept) | 150.0-153.77 | rays out from the edges, wire snipped at 151.5, lobby back 151.8-153.6 |

## 6. Scenes

Card format: **What** (for a 16-year-old) · **Why** (lyric) · **Hero shapes** (real reference → our size, parts, bevels, fine motif) · **Around** (left / right / above / behind) · **Player** · **Beats** · **Lyrics** (blocks, word times) · **In / Out** · **Palette** · **Budget**.

---

### S01 The wire at sunset (0.00-7.90, hot) · `scenes-1-s01.js`

**What:** You float along an old telegraph line through a black desert at sunset; a gold spark races along the wire into the sun, and a giant playing card rises: a Queen with an angel face, who flips round and is a spy.

**Why:** "Gold on the wire" is the spark on the telegraph wire, "fire in the sky" the sun bursting into rays, "smile like an angel, lie like a spy" a card with two sides: her calling card.

**Hero shapes**
- Telegraph pole (real 8-10 m wooden pole, 2.4 m crossarms): 9 m, 8-sided lathe tapering r 0.15 → 0.10, two crossarms (0.12 × 0.10 × 2.4 m, bevelled ends) with two diagonal braces each, 4 glass insulators per arm (lathe bell with two drip skirts, 0.14 m, cream), a pole cap. Fine motif: the insulators.
- Wires: 4 per row, tubes r 0.035, catenary sag 0.35 m between poles. The top-right wire carries the gold spark (a 2 m gold streak, additive core).
- The Queen card (poker card 63 × 88 mm): 7.2 × 10 m slab, 0.16 m thick, corner radius 0.5, bevel 0.04, extruded from a rounded-rect shape. Front: cream face, a crimson inset border line 0.35 m in, "Q" plus a heart pip in the top-left and bottom-right corners (extruded, crimson), centre portrait: her bust (cream face oval, black bob, high collar, closed smiling eyes as two crescents, a gold torus halo, a heart brooch). Back: black with a crimson border, the spy bust (same outline plus a wide-brim hat and upturned collar, round glasses that turn red, a thin gold smile).

**Around**
- Left and right: two parallel pole lines at x ±4, poles every 10 m, passing every ~2.6 s per side (staggered, one pass every ~1.3 s). Fog near 25 / far 85 m so only 5 poles per side read.
- Above: the sagging wires 6 m over your eyes, and on "fire in the sky" the sunburst wedges over the whole sky (rotation ≤ 2°/s).
- Behind: the line runs back into the dark where the lobby was.

**Player:** forward 0 → 3.5 m/s (eased 1.5 s from 0.3), down to 1.0 m/s by 7.5. Eyes 1.6 m above the sand.

**Beats**
- 0.26-0.7: while the lobby breaks, the gold spark shoots from beside you down the right-hand wire to the horizon; the pole insulators light gold as it passes.
- 1.16 "fire": the sun at the vanishing point bursts into crimson rays (crimson flash 0.03); 2.32-3.08 the rays complete.
- 3.40 "Smile": the card rises out of the sand at the vanishing point, 40 m ahead, centred on the sun (eased 1.2 s). 4.96 "angel": the halo flashes gold.
- 6.02 "lie": the card turns 180° about its vertical axis (0.5 s): spy side. 7.16 "spy": the glasses flare red.

**Lyrics** (low centre, d 8, y 0.6, `vAlign: 'bottom'`, `depthTest: false`)
- "GOLD ON / THE WIRE" gold, pop at 0.30 (L0 0.26 / 0.32 / 0.38 / 0.44), out 1.10.
- "FIRE IN / THE SKY" cream: 1.16 / 1.74 / 2.32 / 2.58, out 3.25.
- "SMILE LIKE / AN ANGEL" gold: 3.40 / 4.06 / 4.60 / 4.96, out 5.90.
- "LIE LIKE / A SPY" cream, SPY rust: 6.02 / 6.42 / 7.00 / 7.16, out 7.80.

**In:** lobby dissolve (show.js). **Out:** WORLD ASSEMBLES (section 5).
**Palette:** black sand, crimson sky wedges, gold wire/spark/halo, cream card face.
**Budget:** ≤ 40 calls, ≤ 60k tris; forward frames edges ≤ 0.06, black ≥ 0.45.
**Shared:** expose `buildTelegraphLine(kit, opts)` and `buildQueenCard(kit)` in `scenes-1-util.js`; S18 (group 4) may import them read-only.

---

### S02 The roulette wheel (7.90-17.20, hot) · `scenes-1-s02.js`

**What:** The card has been dealt: you hover over a giant roulette wheel in a dark casino; the ball races around you, bounces and lands on the gold zero.

**Why:** "Count down to zero" is the ball running out of speed and dropping into 0; "don't ask me why" is the gamble; "gold on the wire tonight" is the gold ball and the gold lights running round the rim like a spark on a wire.

**Hero shapes** (real European wheel Ø 0.81 m → 24 m)
- Bowl: lathe, outer rim r 12 with a bevelled lip, wooden band height 1.5, black with a crimson rim line.
- Ball track: the sloped inner band r 10-11.5 (cream-gold), with 8 diamond deflectors (rhombus extrusions, 4 upright, 4 flat).
- Pocket ring r 7-9.5: 37 pockets alternating crimson and black, the **0 pocket gold**; raised frets between pockets (thin bevelled blades, the fine motif). Our wheel puts big pocket numerals only on the four pockets 3, 2, 1, 0 next to each other (artist licence: the countdown sits on the wheel).
- Cone and **turret**: the centre spindle with a 4-arm cross handle ending in balls (lathe + tubes, 3 m tall), the part that says "roulette".
- Ball: cream sphere r 0.6.
- Chandelier overhead: 3-tier lathe chandelier r 5 at y +9, 24 chunky crystal drops (one instanced mesh), cream glow.
- Two chip stacks as silhouettes beyond the rim (left and right, 18 m): lathe discs with the chip's edge notches.

**Around:** the ball circles the whole 360° at 10.5 m (it passes left, behind, right, front); the wheel turns slowly the other way (≤ 3°/s); chandelier above; black casino beyond with the two chip stacks.

**Player:** hovering above the turret, eyes 5 m above the ball track (track at y -3.4; the rim sits 25° below the horizon). Sinks 1 m at 0.5 m/s during 8-10. No travel.

**Beats**
- 7.90-8.06: the wheel finishes rising around you.
- 8.06 "Count": the ball is launched round the track (one lap per 2.27 s, 4 beats); 8.90 "down": it drops off the track and bounces on a diamond; 9.30 "to": into pocket 1; 9.48 "zero": hops into 0, the 0 pocket lights gold (gold flash 0.03).
- 11.82 "why": redaction bar.
- 13.42c "Gold": a gold light runs around the track from the 0 (it passes around you once in 1.1 s). 14.56 "tonight": the chandelier flares.

**Lyrics** (centre, d 7, y 1.6, over the far rim, `depthTest: false`)
- "COUNT DOWN / TO ZERO," gold, ZERO larger: 8.06 / 8.90 / 9.30 / 9.48, out 10.30. The numerals on the pockets are the hero's display.
- "DON'T ASK / ME WHY" cream: 10.46 / 11.44 / 11.62 / 11.82, redact WHY, out 12.9.
- "GOLD ON / THE WIRE" gold: 13.42c / 13.62 / 13.84 / 14.02, out 14.45.
- "TONIGHT" cream: 14.56, out 15.6.

**In:** WORLD ASSEMBLES. **Out:** LIGHTS OUT, then the ball lights the street (section 5).
**Palette:** black, crimson pockets, gold 0 and lights, cream ball and chandelier.
**Budget:** ≤ 45 calls, ≤ 80k tris; edges ≤ 0.07 (the frets are the risk: keep them 0.12 m thick and few, fog the far side).

---

### S03 The black car (17.20-23.40, cold) · `scenes-1-s03.js`

**What:** A night street lined with old cast-iron lamps; at the end, where the last lamp burns, a black 60s sports car waits with its headlights on, and the last lamp goes out.

**Why:** Literal: "black car waiting where the streetlights end". Story: the gold ball rolled down this street and under the car; this is her ride.

**Hero shapes**
- The car (60s GT coupé, real 4.45 × 1.66 × 1.22 m) at ×1.3: side profile extruded with bevel 0.04: long bonnet (45 % of length), cabin set back, fastback roof sloping to a short tail; plan taper toward the nose (scale the extrusion in x per z, or build 3 slices); wheel arches cut out; 4 wire wheels (tyre torus, rim disc, knock-off spinner with 2 ears); round headlights in scoops (lathe, cream glow + flat light cones); a thin chrome bumper bar (tube); side windows black with cyan rim; rust tail lights. Fine motif: the wire-wheel spokes as 2 crossed discs, not lines.
- Street lamp (cast iron, real 4-6 m): 6 m lathe post with a fluted base (0.5 m wide), collar rings, a swan-neck arm (tube), a bell lantern (lathe, cream glass, black cap with a finial). Light: flat cone (opacity 0.25) and an ellipse pool on the road.
- Road: black with a cream dashed centre line (the fine motif) and bevelled kerbs.

**Around:** lamps on both sides at x ±5 every 12 m (one pass per ~2 s, staggered); building fronts at x ±14 (black blocks with cornices and a few cyan window grids, big panes); the lamp arms reach over the road edges; a cyan moon. Behind: the lamps you passed stay lit.

**Player:** arrives 5 m above the street (S02 height), sinks to eye height 1.6 at 1.5 m/s (17.2-19.5) while gliding 3 m/s; eases to 1.5 m/s by 22.4 and stops 14 m before the car.

**Beats**
- 17.20: the street finishes lighting up behind the rolling ball; the ball rolls under the car and is gone.
- 17.44 "Black car": the car's headlights flash on at the end of the street.
- 20.60 "waiting": the engine idles (body shivers 1 cm, two exhaust puffs).
- 21.14-22.38: the lamps between you and the car go out pair by pair toward the car; 22.38 "end": the lamp above the car goes out; only the headlights remain.

**Lyrics** (left of the road, az -15, d 8, y 1.2)
- "BLACK CAR / WAITING" cream, BLACK CAR gold: 17.44 / 17.87c / 20.60, out 21.0.
- "WHERE THE / STREETLIGHTS" cream: 21.14 / 21.48 / 21.76, out 22.30 (outDur 0.08).
- "END" gold, large, alone, at the dying lamp: 22.38, out 23.1.

**In:** ball lights the street. **Out:** PASS-BY + DOOR PORTAL into the hotel.
**Palette:** black, petrol road and buildings, cyan lamps and moon, cream headlights, rust tail lights.
**Budget:** ≤ 50 calls, ≤ 80k tris; edges ≤ 0.07.
**Shared:** expose `buildCar(kit, opts)` in `scenes-1-util.js` (S11 may import it read-only for the sunken car).

---

### S04 Champagne silence (23.40-28.10, cold with gold) · `scenes-1-s04.js`

**What:** A long banquet table in a grand hotel hall, set for a big party, but every chair is empty; at the end a champagne tower is being filled, and then everything freezes in silence.

**Why:** "Champagne" is the tower and the pouring bottle; "silence" is the pour and the bubbles freezing mid-air; "I don't need a friend" is all the empty chairs sliding back from the table: nobody is coming.

**Hero shapes**
- Champagne tower (coupe: bowl Ø 12 cm, height 15 cm) at ×3: 30 coupes (lathe: foot, stem with a knot, shallow bowl with a lip) in 4 tiers (1 + 4 + 9 + 16) on a round silver tray, 12 m ahead at the table's end.
- Magnum bottle (35 cm × Ø 11.5 cm) at ×3: lathe with punt, body, shoulder, neck, foil cap and a label band, tilted 45° above the top coupe; the pour is a gold tube, the overflow runs down tier to tier as gold ribbons; 12 big bubble discs rise.
- Table: 30 m long, 3.2 m wide, cream cloth hanging 0.4 m with a scalloped hem (the fine motif); a candelabra every 4 m (lathe, 3 arms, cream candles, gold flames); one coupe per seat.
- Chairs (Louis-style, back 1.0 m): arched high back with an oval cut-out, curved front legs; black with cyan rim; every 3 m on both sides (2 instanced meshes).
- Chandeliers: 4 lathe chandeliers along the axis at y +7.

**Around:** chairs pass at 3 m on both sides, the hall walls at 9 m (petrol, tall arched windows as black panes), chandeliers pass overhead; behind: the doors you came through.

**Player:** floats above the table centre, eyes 2.6 m above the cloth (candle tops ≥ 2 m below the eyes). 2.5 m/s, eased to 0.5 m/s by 27.0 (stop 6 m before the tower).

**Beats**
- 23.70 "Champagne": the bottle tips, the gold pour starts, the overflow runs down.
- 25.26 "silence": FREEZE: pour, ribbons, bubbles and candle flames stop dead (particles `freeze`), the chandelier drops stop swinging.
- 25.94-26.94 "I don't need a friend": the chairs slide back 0.6 m from the table in a wave from the tower toward you.

**Lyrics** (left, az -18, d 6, y 0.8)
- "CHAMPAGNE" gold: 23.70, out 25.1.
- "SILENCE," cream, appears hard (no slide): 25.26, out 25.85.
- "I DON'T NEED / A FRIEND" cream: 25.94 / 26.12 / 26.48 / 26.72 / 26.94, out 27.6.

**In:** DOOR PORTAL. **Out:** WORLD FALLS APART into the mirror hall.
**Palette:** petrol hall, cream cloth, gold champagne and flames (the only warm), black chairs.
**Budget:** ≤ 60 calls, ≤ 100k tris; edges ≤ 0.075 (chair backs are the risk: fog near 8 / far 30).

---

### S05 The hall of mirrors (28.10-36.20, cold) · `scenes-1-s05.js`

**What:** A long palace corridor lined with tall gold-framed mirrors; in every mirror stands the same woman, and then the mirrors swing open like secret doors.

**Why:** "Every mirror shows a face I know" is her reflection in every mirror; "every exit's got a place to go" is every mirror being a door to a lit passage.

**Hero shapes**
- Mirror (palace mirror, ~5 m arches): 4.5 × 2 m with a round-arched top; gold frame extruded from the arch outline with bevel 0.08 and a shell crest on top; pale cyan glass with one diagonal highlight band; inside the glass her silhouette (black, cyan rim, round glasses).
- 7 mirrors per side at x ±4.5, every 5 m, turned 10° toward you; hinged on one side (they open like doors).
- The end mirror straight ahead: 6 m, larger crest.
- Hall: barrel vault with gold ribs every 5 m, a petrol floor runner with a cream border band.

**Around:** mirrors pass on both sides at 4.5 m (one pair per 1.7 s); gold ribs pass overhead; behind: the banquet debris still falling away.

**Player:** 3 m/s from 28.10, eased to 1 m/s by 35.5.

**Beats**
- 28.30 "Every": the frames light up pair by pair, near to far. 29.39c "mirror": her reflection appears in all mirrors at once.
- 30.92 "face": all reflections turn their heads toward you at the same moment. 31.82 "know": their glasses flash white.
- 32.62 "Every exit's": the mirrors swing open pair by pair, near to far, revealing bright cream passages (exits). 34.92 "place": only the end mirror stays shut, with her reflection.

**Lyrics** (centre, d 7, y 1.0, below the end mirror)
- "EVERY MIRROR / SHOWS A FACE" cream, MIRROR gold: 28.30 / 29.39c / 30.24 / 30.56 / 30.92, out 31.35.
- "I KNOW" gold: 31.42 / 31.82, out 32.45.
- "EVERY EXIT'S / GOT A PLACE" cream: 32.62 / 33.34 / 34.42 / 34.58 / 34.92, out 35.1.
- "TO GO" gold: 35.18 / 35.46, out 36.1.

**In:** WORLD FALLS APART. **Out:** SHATTER (end mirror).
**Palette:** black, petrol walls, pale cyan glass, gold frames.
**Budget:** ≤ 60 calls, ≤ 90k tris; edges ≤ 0.075.

---

### S06 The clock tower and the shaft (36.20-47.40, cold, black at the end) · `scenes-2-s06.js`

**What:** You float inside the gear works of a giant city clock: gears turn all around you, the pendulum swings, the city's lights breathe behind the clock face; then you sink down the shaft under the tower, ten floors deep, into darkness, until doors open.

**Why:** "Tick, tick" is the escapement clicking and the pendulum at the end of its swing; "feel the city breathe" is the city lights behind the glass dial swelling and fading like breath; "ten floors under what you believe" is the floor dial sweeping 10 → B as you sink; "hold your breath... here we go" is the dark, then the doors.

**Hero shapes**
- Clock face from behind (Big Ben dial 7 m) at 14 m: translucent cream disc 16 m ahead, a cast-iron frame ring with 12 spokes, mirrored Roman numerals (black, big), the hands' silhouettes (spade hour hand, long minute hand). Behind it, the skyline in two layers with cyan windows.
- Gears (6-10, r 2-7 m): extruded with bevel 0.06, 0.6 m thick, 24-60 trapezoid teeth, rim, 6 spokes, hub with a bolt circle (fine motif: teeth). Big gears (r ≥ 4) turn ≤ 3°/s, small ones faster by tooth ratio.
- Escapement wheel (sawtooth teeth, r 2.5) and anchor (pallet fork, extruded), front-left, clicking on each tick.
- Pendulum: gold rod (the wire motif) 18 m from the escapement down through the floor, brass lens bob Ø 2.4 m; swings ±12°, period 2 beats.
- Bell overhead: bronze lathe bell (Ø 5 m) with a clapper, hanging 8 m above you.
- Floor indicator (art-deco elevator dial, real ~60 cm) at ×5: a brass fan-shaped semicircle 3 m wide with numerals B, 1-10 on the rim, a pointer arrow; mounted on the shaft wall ahead.
- Shaft: round, r 4.5, dark brick bands; a landing ring of light every 3 m; at the bottom two art-deco doors (sunburst fan relief) 6 m wide.

**Around:** gears left, right, above and below at 3-12 m; the bell overhead; then the shaft wall all around with landing rings passing upward; the gold pendulum rod in the middle ahead.

**Player:** 36.20-40.30 drift 1.5 m/s toward the dial (stays 8 m from it); 40.30-46.40 sink 2 m/s (eased 1 s, about 11 m); 46.40-47.40 glide 2 m/s through the opening doors.

**Beats**
- 36.34 "Tick" and 38.52c "tick": escapement click, pendulum at its extreme, every gear steps.
- 39.00-39.62 "feel the city breathe": the city behind the dial swells bright and dims, twice in 2 beats (breathing, not flashing).
- 40.52 "Ten": the sinking starts, the gear works rise past you; the floor dial points at 10. 40.90-42.02: the needle sweeps 10 → 1.
- 42.76 "Hold": the landing lights go out ring by ring; only the needle (cyan) and the gold rod stay. 43.56 "breath...": all motion stops, the needle trembles at B.
- 45.14c "here": a crimson seam glows between the doors; 45.30 "we": they start to part; 45.78 "go": open, crimson light floods out.

**Lyrics** (centre, d 7, y 0.9; in the shaft d 6, y 0)
- "TICK, TICK," cream: 36.34 / 38.52c, out 38.95.
- "FEEL THE / CITY BREATHE" cream, BREATHE gold: 39.00 / 39.18 / 39.34 / 39.62, out 40.40.
- "TEN FLOORS" gold: 40.52 / 40.90, out 41.18.
- "UNDER WHAT / YOU BELIEVE" cream: 41.22 / 41.56 / 41.82 / 42.02, out 42.65.
- "HOLD YOUR / BREATH..." cream: 42.76 / 43.08 / 43.56, out 44.70.
- "HERE WE GO" gold: 45.14c / 45.30 / 45.78, out 47.2.

**In:** SHATTER from S05. **Out:** DOOR OPENS + LIGHTS ON.
**Palette:** black, petrol gears and shaft, cream dial, cyan windows, gold rod; crimson seam announces the chorus.
**Budget:** ≤ 70 calls, ≤ 120k tris; edges ≤ 0.08 in the gear works (teeth), ≤ 0.05 in the shaft.

---

### S07 The gold foundry (47.40-56.30, hot) · `scenes-2-s07.js`

**What:** A huge foundry where giant buckets pour molten gold; gold angel statues ride past you on conveyor belts, and one of the angels turns her head: it is the spy hiding among them.

**Why:** "Gold on the wire" is the crucibles hanging on gold crane wires and pouring; "fire in the sky" is the furnaces blazing and the sunburst flaring; "smile like an angel" is the rows of smiling angel statues; "lie like a spy" is the one statue that turns, eyes red, halo dropping into a hat brim.

**Hero shapes**
- Crucible (steelworks ladle, ~3-4 m): 2.5 m lathe pot, tapered, thick lip with a pouring spout, two trunnion pins, hanging from the crane rail on two thick gold cables; tips to pour a thick gold stream (tube, additive core) into ingot moulds.
- Conveyors at x ±5, y -1: roller conveyors with rollers every 0.6 m (fine motif), bevelled side rails; they run toward you at 1.5 m/s.
- Angel statue (2.6 m, gold): robe as a lathe bell, head with a bob, folded wings (extruded feather-step outline, 3 steps), hands folded, a floating torus halo; 6 per side on the conveyors.
- The spy angel: the same statue on the right conveyor; head can turn, glasses can go red, the halo can drop onto her head as a hat brim.
- Hall: furnace mouths along both walls at 12 m (arched openings, flat flame tongues), solid steel roof trusses (chunky bands) carrying the crane rail; the vault door small and dark at the vanishing point.

**Around:** statues on both conveyors pass at 5 m (relative 4 m/s); furnace mouths at 12 m; crucibles pass overhead on the crane rail (pouring to the side, never above you); behind: the conveyors run on.

**Player:** 2.5 m/s toward the vault door (with the conveyors this is 4 m/s relative, the limit).

**Beats**
- 47.48 "Gold": LIGHTS ON, the furnaces ignite near to far (crimson flash 0.03), the first crucible pours.
- 48.72 "wire": the crane cables light gold along the hall.
- 49.34 "fire": furnaces flare (flame tongues leap 3 m), sunburst rays on behind the vault door; 50.58 "sky": rays complete (rays only here).
- 51.44 "Smile": the statues' cream faces light up with smiles as they pass; 52.94 "angel": halos flash in a wave.
- 53.98 "lie": the nearest statue on the right (az +30, 6 m) turns her head to you: red glasses. 54.86-55.22 "a spy": her halo tips and drops onto her head as a hat brim.

**Lyrics** (centre-left, az -10, d 8, y 0.8)
- "GOLD ON / THE WIRE," gold: 47.48 / 48.00 / 48.50 / 48.72, out 49.2.
- "FIRE IN / THE SKY" cream: 49.34 / 49.78 / 50.40 / 50.58, out 51.3.
- "SMILE LIKE / AN ANGEL," gold: 51.44 / 51.98 / 52.60 / 52.94, out 53.85.
- "LIE LIKE / A SPY" cream, SPY rust: 53.98 / 54.34 / 54.86 / 55.22, out 55.6.

**In:** LIGHTS ON. **Out:** BODY WIPE (two 12 m statues).
**Palette:** black hall, crimson furnaces, gold metal and statues, cream faces.
**Budget:** ≤ 75 calls, ≤ 150k tris; edges ≤ 0.08 (rollers: 2 per metre at most, fog near 15 / far 60).

---

### S08 The time bomb and the vault door (56.30-67.95, hot) · `scenes-2-s08.js`

**What:** A time bomb is strapped to a giant round vault door; it counts down 3-2-1-0, the alarm clock starts ringing, a pair of wire cutters snips the gold wire just in time, and the vault door swings open and you fly through it.

**Why:** "Count down to zero" is the bomb's flip counter; "don't ask me why" is which wire to cut (WHY is redacted); "gold on the wire tonight" is the cutters choosing the gold wire; "Oh-oh, gold on the wire" is the bolts retracting and gold light pouring out of the opening door.

**Hero shapes**
- Vault door (bank vault doors 2-3 m, thickness ~1/8 of the diameter) at 7 m Ø, 0.85 m thick: 3 concentric stepped rims with bevels, a 6-spoke handwheel (torus rim, spokes, hub), a ring of 24 locking-bolt heads round the edge (fine motif, they retract), a massive hinge arm on the left with 2 knuckles and a pin; set in a black wall with a bevelled round frame. Back face (when open): 4 locking bars and a gear box.
- The bomb (on the door under the handwheel, 5 m ahead): 6 dynamite sticks (20 × 3 cm) at ×5 (1.0 m long, r 0.11, crimson, cream paper end caps), 2 black tape bands; on top a twin-bell alarm clock (lathe case r 0.35, two bells with a hammer between, two feet, a cream face with hands); in front a flip counter with two cream-on-black flaps (digits 0.5 m); three thick wires (tubes r 0.04: crimson, cream, gold) looping from the clock to the sticks.
- Wire cutters (side cutters, 16 cm) at ×5: two jaws, a pivot rivet, curved crimson-dipped handles; enter from the right.
- Antechamber: fluted columns (lathe) at x ±7, two per side; a coffered ceiling with three cone-shade drop lamps (lathe, gold light).

**Around:** columns at both sides; lamps overhead; behind: the foundry glow and the retreating statues; then the door ring passing all around you.

**Player:** drift 0.5 m/s, stop 5 m from the door; 64.9-67.0 glide 3 m/s through the door ring; then 2 m/s.

**Beats**
- 56.52 "Count" 03 (the clock hammer rattles), 57.00 "down" 02, 57.30 "to" 01, 57.50 "zero" 00: the bells start ringing (the clock shakes).
- 58.48-59.84: the cutters come in and hover between the three wires; 59.84 "why" redacted.
- 60.52c "Gold": the cutters close on the gold wire; 61.72c "wire": SNIP, a spark; 62.28c "tonight": the ringing stops, the clock freezes.
- 64.00 "Oh-oh": the 24 bolts retract in a wave round the rim, gold light lines appear round the door.
- 64.94-65.74 "gold on the wire": the door swings open on its hinge to the left (90° in 1.6 s), gold light floods out.
- 66.13c "Oh-oh": you glide through the door ring.

**Lyrics** (left of the bomb, az -20, d 6, y 1.2)
- "COUNT DOWN / TO ZERO," gold: 56.52 / 57.00 / 57.30 / 57.50, out 58.3. The flip counter is the hero's display.
- "DON'T ASK / ME WHY" cream: 58.48 / 59.40 / 59.60 / 59.84, redact WHY, out 60.4.
- "GOLD ON / THE WIRE" gold: 60.52c / 61.15c / 61.43c / 61.72c, out 62.2.
- "TONIGHT" cream: 62.28c, out 63.6.
- "OH-OH," gold: 64.00 (or 63.90 if Leo hears it earlier), out 64.85.
- "GOLD ON / THE WIRE" gold: 64.94 / 65.44 / 65.68 / 65.74, out 66.05.
- "OH-OH" gold: 66.13c, out 67.3.

**In:** BODY WIPE (`pre` 0.3: the bomb is hidden behind the closing statues). **Out:** FLY-THROUGH THE DOOR.
**Palette:** black wall, carmine door with gold bolts and rim, crimson dynamite, cream clock, gold wire.
**Budget:** ≤ 60 calls, ≤ 100k tris; edges ≤ 0.07.

---

### S09 The safe and the lasers (67.95-77.30, cold with rust) · `scenes-2-s09.js`

**What:** Inside the dark steel vault a hand in a black velvet glove turns the dial of a huge safe; the safe swings open onto a corridor of red laser beams, and a woman in an evening gown dances slowly through them.

**Why:** "Velvet gloves on a steel machine" is the glove on the safe dial; "waltzing slow through a laser beam" is the dancer turning through the laser grid in 3/4 time.

**Hero shapes**
- Safe (bank safe, real 1.8 m) at ×3.3: 6 m tall, 4 m wide, rounded vertical corners (radius 0.25), a bevelled door recess, combination dial (r 0.45: a ring of 20 tick blocks as the fine motif, a knurled knob), a 3-spoke chrome handle, two barrel hinges, a brass nameplate, short feet. The door opening is 3.4 m wide (edges 1.7 m from your eyes when you pass).
- Glove (long opera glove to the elbow, black velvet, rust lining at the cuff) at the safe's scale: five extruded fingers with rounded tips, thumb, wrist; comes in from the right.
- Laser emitters: brass lathe cylinders with a flared lens hood on wall brackets; 10 beams (rust core r 0.05, wider soft halo) across a 7 m wide corridor of riveted steel panels (one rivet band per panel).
- Dancer (her, 2.4 m): floor-length A-line gown (lathe), bodice, bare shoulders, bob, long gloves; 10 m ahead.

**Around:** first the vault walls (steel panels with rivet bands) and thick steel beams overhead; then the beams sweep past over, under and beside you (always ≥ 1.6 m from the eyes) as you glide between them.

**Player:** still (0.3 m/s drift) until 71.5; 71.5-73.0 glide 2 m/s through the open safe; then 1.5 m/s down the laser corridor.

**Beats**
- 68.58 "Velvet": the glove reaches the dial; dial turns right on "Velvet", left on "gloves" (68.68), right on "machine" (70.38), each with a click.
- 70.82: the handle turns; 71.0-71.5 the safe door swings open (hinged left), darkness inside.
- 72.03c "Waltzing": the laser corridor lights up beyond; the beams move on the waltz downbeats (1-2-3), she turns between them.
- 76.08-76.60: her fingertip touches one beam; 76.60 all lasers out.

**Lyrics** (right of centre, az +15, d 7, y 0.8)
- "VELVET GLOVES" cream, VELVET rust: 68.58 / 68.68, out 69.10.
- "ON A STEEL / MACHINE" cream: 69.18 / 69.86 / 70.04 / 70.38, out 71.3.
- "WALTZING / SLOW" gold: 72.03c / 73.46, out 73.68.
- "THROUGH A / LASER BEAM" cream, LASER rust: 73.72 / 74.32 / 74.62 / 75.44, out 76.4.

**In:** FLY-THROUGH THE DOOR. **Out:** LIGHTS OUT.
**Palette:** black and petrol steel with cyan rims; rust lasers and glove lining as the only warm.
**Budget:** ≤ 55 calls, ≤ 80k tris; edges ≤ 0.08 (beams are lines: keep 10 at most, thick).

---

### S10 One red light, the game begins (77.30-84.70, cold to red) · `scenes-3-s10.js`

**What:** In the dark one red alarm light switches on and spins, throwing its red beam around the room; in its light the floor is a giant chessboard and huge chess pieces rise on both sides of you: the guards, ready to play.

**Why:** "One red light and the whole room spins" is a rotating alarm beacon sweeping red light over every wall; "that's the second the game begins" is the two chess armies rising and the pawns making the first move.

**Hero shapes**
- Alarm beacon (real ~20 cm dome) at ×10: hangs from the ceiling 7 m ahead at y +4: chrome base (lathe, bevelled), a ribbed red dome (lathe with 16 vertical ribs, the fine motif), inside it a parabolic mirror and bulb (a darker shape) that turns; one flat red light cone (opacity 0.25, 40° wide, 25 m long) rotating once per 2 beats (0.88 Hz, under the 3 Hz rule; it lights wall panels, it never fills the view).
- Chess pieces (Staunton, real king 9.5 cm, square 5.5 cm) at ×40: king 3.8 m, pawn 2.0 m, squares 2.2 m. Lathe profiles with real parts: pawn (base, collar, ball head), rook (castellated top with 5 merlons), knight (extruded horse-head profile on a lathe base), bishop (mitre with a slit), queen (coronet), king (cross). Cream army on the left, black army (red rim) on the right.
- Board: black and cream marble squares (in red light: black and crimson), bevelled edges.

**Around:** the armies face each other across you: cream pawns at x -6 and back rank at x -8, black pawns at x +6 and back rank at x +8, files running from 8 m behind you to 8 m ahead. Kings and queens are beside you, rooks ahead and behind. Above: the beacon and the red beam sweeping the walls. Nothing closer than 4 m.

**Player:** still; rises 0.5 m during 81-83 to see the board.

**Beats**
- 77.30-77.62: black.
- 77.62 "One": the beacon switches on; `setWorld('hot', k)` blends the room from cold to red whenever the beam passes, fully red from 79.16.
- 78.54-80.18 "and the whole room spins": the beam turns, the wall panels light red one after another around you.
- 81.18 "That's": in the beam the floor shows its chess squares. 81.72 "second": the pieces rise out of their squares row by row, rooks first (0.6 s each). 82.90 "game": the kings rise last, left and right of you.
- 83.36 "begins": both rows of pawns step one square toward you (they stop 4 m away).

**Lyrics** (centre, d 6, y 1.8, above the board, `depthTest: false`)
- "ONE RED / LIGHT" cream, RED crimson: 77.62 / 77.72 / 78.06, out 78.45.
- "AND THE WHOLE / ROOM SPINS" cream: 78.54 / 78.90 / 79.16 / 79.58 / 80.18, out 81.0.
- "THAT'S THE / SECOND" cream: 81.18 / 81.62 / 81.72, out 82.35.
- "THE GAME / BEGINS" gold: 82.42 / 82.90 / 83.36, out 84.0.

**In:** LIGHTS OUT (black). **Out:** FALL THROUGH (gentle, into black).
**Palette:** petrol dark, then crimson and black; cream and black pieces; the beacon red.
**Budget:** ≤ 50 calls (one instanced mesh per piece type and colour), ≤ 120k tris; edges ≤ 0.08.

---

### S11 Under the harbour (84.70-95.10, cold) · `scenes-3-s11.js`

**What:** Under the city's harbour at night: rows of old pier pilings pass on both sides, a ship's hull slides over your head, the black car from the street lies on the bottom with its headlights still on, and the spy swims ahead in 60s diving gear, then shoots up to the surface.

**Why:** "Tick, tick" are her two breaths (two bubble bursts from the regulator); "feel the city breathe" is the city lights on the surface above, swelling and fading; "ten floors under what you believe" is how deep under the city you are, with the sunken car below; "hold your breath" is her bubbles stopping; "here we go" is her scooter firing up and pulling her to the surface.

**Hero shapes**
- The diver (her, 2 m): wetsuit silhouette with the bob under a hood, round mask (cream glass disc with a rim), twin air tanks (lathe cylinders, valves, a strap band), long fins, a looped breathing hose (tube); holds a 60s underwater scooter (torpedo body, ducted propeller ring, two handles). 8-10 m ahead, kicking slowly.
- Pier pilings: wooden piles r 0.4 with barnacle rings near the top (fine motif) and chunky cross-braces; two rows at x ±5, every 6 m, from the seabed to the surface (y +8).
- Ship hull overhead (cargo ship, real beam ~20 m): 12 m wide hull bottom with bilge keels, the stern with a 4-blade propeller (r 2.5, extruded blades) and a rudder; at y +6.5, sliding over you from behind to the front.
- The black car (S03's car; import `buildCar` read-only from `scenes-1-util.js` if it exists, else build the same spec) on the seabed, tilted, headlights on (cyan cones).
- Seabed: petrol sand with a few big boulders and a mooring chain (big links). Surface: a sheet at y +8 with big wobbly cream-cyan light patches (the city lights).

**Around:** pilings pass on both sides at 5 m (one pass per ~1.2 s, staggered); the hull passes overhead (88-91); the bright surface above; the car below-left; behind: pilings fading into the fog.

**Player:** starts in black at 84.70 (the S10 hole), the world fades up (0.5 s); glides 2.5 m/s; descends 0.8 m/s during 88.86-90.64; 94.04-95.10 rises 2 m/s at 3 m/s forward.

**Beats**
- 84.70: bubbles from your entry rise around you (the one particle accent).
- 86.82c "Tick", 87.02 "tick": two bubble bursts from her regulator.
- 87.28-87.90 "feel the city breathe": the light patches above swell and fade twice.
- 88.86 "Ten": the hull's shadow reaches you; 89.20-90.30 "floors under what you believe": the car comes into view on the bottom, below-left at 6 m lateral, headlights on.
- 91.04 "Hold": her bubbles stop. 91.76 "breath...": everything holds (propeller and particles freeze).
- 93.14 "here": she aims the scooter up; 93.46 "we": its propeller spins up; 94.04 "go": she shoots up toward the surface and you follow.

**Lyrics** (low left, az -15, d 7, y 0.6, away from the diver)
- "TICK, TICK," cream: 86.82c / 87.02, out 87.25.
- "FEEL THE / CITY BREATHE" cream, BREATHE gold: 87.28 / 87.46 / 87.64 / 87.90, out 88.7.
- "TEN FLOORS" gold: 88.86 / 89.20, out 89.7.
- "UNDER WHAT / YOU BELIEVE" cream: 89.76 / 89.84 / 90.08 / 90.30, out 90.95.
- "HOLD YOUR / BREATH..." cream: 91.04 / 91.20 / 91.76, out 93.0.
- "HERE WE GO" gold: 93.14 / 93.46 / 94.04, out 94.6.

**In:** fade up from black. **Out:** SURFACE SHATTER (you never touch the surface).
**Palette:** black depth, petrol water, cyan light shafts and headlights, cream mask glint. `kit.setFog` petrol, near 10 / far 45.
**Budget:** ≤ 60 calls, ≤ 100k tris; edges ≤ 0.07.

---

### S12 Fireworks over the harbour bridge (95.10-104.20, hot) · `scenes-3-s12.js`

**What:** You come up in the harbour at night in front of a giant suspension bridge; its cables light up gold from tower to tower, fireworks explode all around the sky, and then the fireworks draw a picture of her: an angel, which turns into a spy.

**Why:** "Gold on the wire" is the bridge cables lighting up gold; "fire in the sky" is the fireworks; "smile like an angel, lie like a spy" is the firework picture changing from her angel face to her spy face.

**Hero shapes**
- The bridge (suspension bridge, real towers 150-230 m) spanning across your path 60 m ahead: two art-deco towers 60 m tall at x ±45, each with two legs (stepped setbacks), three cross-portals with arched tops and a stepped crown; a black deck at y +20 with a band of vertical stiffening ribs on its edge (fine motif); two main cables (tubes r 0.6) in catenaries from the shore anchorages over the towers and down to 4 m above the deck mid-span; vertical hangers every 10 m (r 0.15); gold bulbs along the main cables (instanced discs).
- Fireworks: chrysanthemum bursts of 30-40 thick stroke particles (2-4 m long) in cream, gold and crimson, 20-30 m wide, 60-90 m away; 5 bursts in all, at most 2 visible at once.
- The picture firework, 30 m wide, drawn above the bridge centre with thick glowing tubes (r 0.4): angel = face outline, bob, halo ellipse, closed crescent eyes, smile; spy = the same lines re-formed into a hat brim and crown, an upturned collar, round glasses (red).
- City skyline along both shores at 80-120 m: black blocks with a few big window grids.

**Around:** the shores and skyline left and right; bursts left, right, overhead and behind; the bridge deck passes over you at 102.5-103.5 as you glide under it between the hangers (≥ 5 m to each hanger).

**Player:** eyes 1.6 m above the water; 3 m/s, eased to 2 m/s by 103.

**Beats**
- 95.10: you are up; spray shards still falling.
- 95.16 "Gold": the bulbs light up from the left anchorage, over the left tower, down the sag and over the right tower: a gold line drawn across the sky in 1.5 s.
- 97.44 "fire": first burst ahead-above; 98.04 left; 98.62 right; 98.92 "sky": the biggest, overhead-behind, plus one sunburst flash of rays (chorus hit).
- 99.68 "Smile": the angel picture draws itself (0.6 s). 101.24 "angel": the halo flares.
- 102.10 "lie": the strokes slide and re-form into the spy (0.5 s). 103.50 "spy": the glasses turn red as you pass under the deck.

**Lyrics** (low centre on the water, d 8, y 0.5, `depthTest: false`)
- "GOLD ON / THE WIRE," gold: 95.16 / 96.00 / 96.38 / 96.64, out 97.3.
- "FIRE IN / THE SKY" cream: 97.44 / 98.04 / 98.62 / 98.92, out 99.55.
- "SMILE LIKE / AN ANGEL," gold: 99.68 / 100.46 / 101.02 / 101.24, out 102.0.
- "LIE LIKE / A SPY" cream, SPY rust: 102.10 / 102.70 / 103.30 / 103.50, out 104.1.

**In:** SURFACE SHATTER. **Out:** WORLD PASSES BY (the pier with the booth ahead).
**Palette:** black water and sky, a crimson glow at the horizon, gold cables and bursts, cream picture lines, red glasses.
**Budget:** ≤ 70 calls, ≤ 120k tris; specks ≤ 22 (strokes long and bold, short-lived bursts), edges ≤ 0.075.

---

### S13 The red phone booth (104.20-112.04, hot) · `scenes-3-s13.js`

**What:** At the end of the pier stands a lit red phone booth; its door opens, a gloved hand dials zero on the old payphone while the handset hangs on its cord, and the call shoots away as a gold spark along the telephone wire over your head into the city.

**Why:** "Count down to zero" is dialling 0 (the longest wind of the dial) while the lyric counts; "don't ask me why" is the redacted WHY; "gold on the wire tonight" is the call (her code for "done") running as a gold spark along the phone line. This replaces round 2's dial on a red field: the dial is now in its real frame (booth, payphone, handset, cord, wire, poles) at real size, close enough to read.

**Hero shapes**
- Phone booth (classic red kiosk, real 2.4 m tall, 0.9 m square), our own design (no crown, no lettering): 2.6 m tall, 1 m square, crimson; domed roof with four curved pediments; cream lightbox panels under the dome with a black handset pictogram; window grid 3 × 8 panes per side (muntins as the fine motif); a door hinged on the right with a long brass handle; lit from inside (cream).
- Payphone (60s, real ~0.5 m) at ×1.6, on the booth's back wall at eye height: rounded chrome housing with bevel, a coin slot, the **rotary dial** (finger wheel Ø 0.24 m with 10 round finger holes, a cream number ring with 1-9 and 0, a curved chrome finger stop), the handset (lathe receiver and mouthpiece cups on a curved handle) hanging off the hook, swinging on an armoured cord (tube).
- The glove (black velvet, rust cuff, S09's design at real size ×1.6), coming in from the right edge of the door.
- Telephone poles (S01's pole design, 7 m): one at the left of the pier and one at the right; the line runs from the booth roof to the left pole, then **over your head from left to right** (4 m above your eyes) to the right pole, then along a pole line to the city on the right shore.
- Pier: black planks (wide bands), lathe mooring bollards and two lamp posts along the edges.

**Around:** bollards and lamp posts at 4 m on both sides; harbour water left and right; the bridge behind you, still lit gold; the skyline across the water; the wire overhead.

**Player:** 104.20-105.4 glide 2 m/s, stop 1.5 m in front of the door plane (the dial is 2.5 m from your eyes); still afterwards.

**Beats**
- 104.20: the booth light flickers on.
- 104.34 "Count": the door swings open (0.4 s); the glove's finger goes into the 0 hole.
- 105.76 "zero": the finger winds the dial all the way to the stop (the longest wind, 300°) and lets go; the dial runs back with clicks until 106.9.
- 108.10 "why": redaction.
- 109.98 "Gold": a gold spark jumps from the phone up through the roof onto the wire. 110.12-110.64 "on the wire": it runs to the left pole, then over your head to the right pole, then away along the pole line. 111.16 "tonight": the skyline across the water flashes once as it arrives; the booth light goes out.

**Lyrics** (left of the booth, az -22, d 5, y 1.6)
- "COUNT DOWN / TO ZERO," gold, ZERO larger: 104.34 / 105.28 / 105.58 / 105.76, out 106.7.
- "DON'T ASK / ME WHY" cream: 106.98 / 107.38 / 107.72 / 108.10, redact WHY, out 109.5.
- "GOLD ON / THE WIRE" gold: 109.98 / 110.12 / 110.42 / 110.64, out 111.05.
- "TONIGHT" cream: 111.16, out 111.9.

**In:** WORLD PASSES BY. **Out:** LIGHTS OUT, wire last (the wire overhead, left to right, is the last thing lit).
**Palette:** black night, crimson booth, cream booth light, chrome dial, gold spark and wire.
**Budget:** ≤ 50 calls, ≤ 80k tris; edges ≤ 0.07 (the pane grid is the risk: 0.08 m muntins).

---

### S14 The tape destroys itself (112.04-119.70, cold) · `scenes-4-a.js`

**What:** At headquarters the call lands on a giant reel-to-reel tape machine all around you; it counts down 3-2-1 and the tape catches fire and burns away with the message.

**Why:** "Three... two... one..." are the machine's three warning lamps going out; "you were never here" is the tape burning: the evidence is gone. It is the classic "this tape will self-destruct" spy moment, in a game about tapes.

**Hero shapes**
- Reels (real 26.5 cm) at ×26: 7 m reels left (az -55°) and right (az +55°), 8 m away, upright and facing you; each with two flanges with three big rounded-triangle cut-outs (the classic reel look), a hub with three key slots, and the wound tape pack (dark brown-gold disc).
- Tape: a 0.4 m brown-gold ribbon from the left reel over two guide rollers, **arching over your head** (4 m above the eyes, the same place as S13's wire), past the head block and over to the right reel.
- Head block above-front (y +4, 6 m ahead): chrome head cover with bevel, a capstan and a rubber pinch roller.
- Below it, in front at eye height: two VU meters (cream faces, black needle, red zone arc, bevelled bezels) and three rust jewel warning lamps (lathe).
- Faceplate: petrol steel curving around you (R 9 m, 200°), rounded corners, one band of screw heads along its edge (fine motif); big piano-key transport buttons along the bottom.

**Around:** reels on both sides, the tape overhead, the faceplate around you; behind: dark racks of other machines as big silhouettes.

**Player:** still (0.3 m/s drift forward).

**Comfort:** the reels are big structures beside you: turn them at most 3°/s; the motion you see is the tape ribbon running 1 m/s overhead. When they break free (118.91) they drift outward and away, then may spin.

**Beats**
- 112.04: the tape glows overhead first (where S13's wire was), then the reels and meters light up.
- 112.6-114.2: the VU needles bounce on the beats.
- 114.29c "Three": lamp 3 out, a puff of smoke from the head block. 115.39c "two": lamp 2, a bigger puff. 116.56c "one": lamp 1, the tape at the head glows orange.
- 117.74 "You": the tape catches fire at the head; flat cel flames run along the ribbon both ways over your head toward the reels. 118.33c "never": the burned tape snaps. 118.91c "here": the reels come loose and drift outward, the needles drop to zero.

**Lyrics** (centre, d 6, y 0.2, below the meters, `depthTest: false`)
- "3" gold, cap 1.6: 114.29c, out 115.2. "2": 115.39c, out 116.4. "1": 116.56c, out 117.6.
- "YOU WERE / NEVER HERE" cream: 117.74 / 117.90 / 118.33c / 118.91c, out 119.5.

**In:** the wire becomes the tape. **Out:** SMOKE WIPE.
**Palette:** black, petrol machine, cream meters, rust lamps and flames, brown-gold tape.
**Budget:** ≤ 50 calls, ≤ 80k tris; edges ≤ 0.065.

---

### S15 The cameras go dark (119.70-127.62, cold) · `scenes-4-a.js`

**What:** You stand inside a curved wall of old TV monitors showing the security cameras; row by row they go black, she vanishes from the last screen, and the last TV switches off into a single bright dot.

**Why:** "Three... two... one..." are the three rows of monitors switching off; "you were never here" is her figure fading out of the last camera picture, leaving an empty room; "lights out" is the old-TV switch-off: picture to a line, line to a dot.

**Hero shapes**
- CRT monitors (security monitor, real ~35 cm) at ×4: 21 monitors (3 rows × 7) on a curved rack (R 7 m, az -75° to +75°): deep boxes with rounded edges (bevel 0.06), slightly bulging screens with rounded corners, thick bezels, two knobs and a small cream badge each; screens glow cyan with simple camera pictures made of 2-3 big flat shapes (callbacks: the vault door ring, the chessboard, the phone booth, the mirror hall). The centre monitor (straight ahead, 1.5×) shows her standing in an empty room.
- Rack: black steel uprights with rivet bands; thick cable bundles hanging in catenaries from the monitors up into the dark (overhead).

**Around:** the monitor wall spans 150° in front and to both sides; cable bundles overhead; behind: black.

**Player:** still.

**Beats**
- 119.70: the smoke parts, every screen is on.
- 119.95c "Three": the top row switches off (each screen: picture to a line to black, 0.15 s, staggered left to right over 0.3 s). 121.16c "two": the middle row except the centre monitor. 122.27c "one": the bottom row.
- 123.15c "You": on the centre screen she turns to the camera. 123.50c-124.35c "were never here": she fades out of the picture; the room stays empty.
- 125.70c "Lights": the centre CRT switches off: the picture squeezes to a horizontal line (0.12 s), then to a bright dot (0.2 s). 126.38 "out": the dot holds; everything else is black.
- 126.38-127.62: the dot rises to 14° elevation straight ahead, exactly where S16's sun bursts (keep S16's `EL16`).

**Lyrics** (low centre, d 5, y -0.3, below the bottom row, `depthTest: false`)
- "3" gold: 119.95c, out 121.0. "2": 121.16c, out 122.1. "1": 122.27c, out 123.0.
- "YOU WERE / NEVER HERE" cream: 123.15c / 123.50c / 123.85c / 124.35c, out 125.4.
- "LIGHTS OUT" gold: 125.70c / 126.38, out 127.4.

**In:** SMOKE WIPE. **Out:** MATCH CUT dot to sun (kept, S16 depends on it).
**Palette:** black, petrol rack, cyan screens; the dot cream-amber.
**Budget:** ≤ 45 calls (monitors and screens instanced), ≤ 60k tris; edges ≤ 0.08 at 119.7 (all screens on), falling fast.

---

### S16 The Dynamo Sun (127.62-136.03, amber then hot) · `scenes-4-b.js` · KEEP

Leo's favourite. **Do not rework.** Pylons on both sides, the sun from S15's dot, the Engineer bust rising with her halo; on "lie" the glasses go red, the halo slips, everything turns red; on "spy" she sinks. Only check after the `words.json` fix: "GOLD ON THE WIRE" now reveals on Gold 128.27c (it uses `near: 127.68`, which still finds the phrase) and still leaves at 129.5; the flash at 127.64 and the sun burst stay on the music. If the block would now show for less than 1.2 s, move its `out` to 129.7.

### S17 The sea launch platform (136.03-142.91, hot then amber) · `scenes-4-b.js` · KEEP

Leo's favourite. **Do not rework.** Countdown lamps out on Count 137.28 / down 137.48 / to 138.04 / zero 138.10, ignition, lift-off, the trail turns gold on "Gold on the wire" 141.74, the rocket ends as the amber dot S18's sun grows from.

---

### S18 Home on the wire (142.91-153.771, hot with the amber sun) · `scenes-4-c.js`

**What:** Back on the telegraph line from the start: the rocket's gold trail has become the wire, the sun sits at its end, and the title "GOLD ON THE WIRE" rises out of the desert word by word as she sings it; then the night fades and the lobby comes back.

**Why:** The song ends on "Oh-oh, gold on the wire... tonight": the title appears on exactly those words, and the night ends where it started.

**Hero shapes**
- The S01 telegraph line (import `buildTelegraphLine` read-only from `scenes-1-util.js` when it exists; otherwise build the same spec: 9 m lathe poles, crossarms, glass insulators, sagging wires), replacing the round-2 T-poles of `kit.saltFlat`. The black ground stays.
- The amber sun at the vanishing point (dome), crimson rays with gold rings.
- Title letters (20 m, gold type, rim-lit) in a shallow curve 45 m away, framing the sun within ±30°; **MISTYCONIFER** (cream, 5 m, wide tracking) under them.
- Optional bookend (only if clarity allows): S01's Queen card stands on the horizon at az -25° showing her spy side, and on "tonight" (148.00) turns back to the angel side.

**Around:** pole rows at both sides (as S01), wires overhead, the sunburst sky.

**Player:** glides toward the sun at 2 m/s, eases to a stop by 150.0 (kept).

**Beats** (the rest of round-2 S18 stays: lamp waves, ray pulses, fade, wire snipped at 151.5, lobby 151.8-153.6)
- 142.91: match cut from the rocket dot.
- 143.16 "tonight": the sun swells.
- 144.58 "Oh-oh": the insulators light in two waves running toward the sun.
- 145.60 "gold": the letters G-O-L-D rise together; 146.52 "on": O-N; 146.90 "the": T-H-E; 147.16 "wire": W-I-R-E (each word eased 0.4 s). This replaces the round-2 one-letter-per-0.05 s reveal that made ON/THE/WIRE late and left L37 missing.
- 147.34-147.52: if L38's duplicate words stay in `words.json`, the four title words pulse once each on them instead of being shown again.
- 148.00 "tonight": TONIGHT under the title, the sun flares (brightest moment). 148.60: MISTYCONIFER rises.

**Lyrics**
- "TONIGHT" cream: 143.16, out 144.4 (centre-right, d 6, eye level).
- "OH-OH," gold: 144.58, out 145.5 (left, az -18, d 7).
- The title is the block for L37: 145.60 / 146.52 / 146.90 / 147.16, it stays to the fade.
- "TONIGHT" cream, 3 m: 148.00, under the title.

**In:** MATCH CUT (kept). **Out:** FADE and lobby return (kept, show.js).
**Palette:** black ground, crimson rays, gold title and wire, amber sun, cream type.
**Budget:** ≤ 60 calls, ≤ 120k tris (title letters are big extruded type).

## 7. Groups and files

Ownership stays as in round 2: group n owns `scenes-n.js` and every `scenes-n-*.js`. Each `scenes-n.js` keeps exporting its array in time order. Ids stay S01-S18.

| group | window | files | scenes |
|---|---|---|---|
| 1 | 0.00-36.20 | `scenes-1.js` (exports `[S01, S02, S03, S04, S05]`); `scenes-1-s01.js` S01 The wire at sunset; `scenes-1-s02.js` S02 The roulette wheel; `scenes-1-s03.js` S03 The black car; `scenes-1-s04.js` S04 Champagne silence; `scenes-1-s05.js` S05 The hall of mirrors; `scenes-1-util.js` shared helpers, including the exports `buildTelegraphLine`, `buildQueenCard`, `buildCar` | S01-S05, all rebuilt |
| 2 | 36.20-77.30 | `scenes-2.js` (exports `[S06, S07, S08, S09]`); `scenes-2-s06.js` S06 The clock tower and the shaft; `scenes-2-s07.js` S07 The gold foundry; `scenes-2-s08.js` S08 The time bomb and the vault door; `scenes-2-s09.js` S09 The safe and the lasers; `scenes-2-util.js` | S06-S09, all rebuilt; S09 now ends at 77.30 (was 76.89) |
| 3 | 77.30-112.04 | `scenes-3.js` (exports `[S10, S11, S12, S13]`); `scenes-3-s10.js` S10 One red light, the game begins; `scenes-3-s11.js` S11 Under the harbour; `scenes-3-s12.js` S12 Fireworks over the harbour bridge; `scenes-3-s13.js` S13 The red phone booth; `scenes-3-util.js` | S10-S13, all rebuilt; S10 now starts at 77.30 |
| 4 | 112.04-153.771 | `scenes-4.js` (exports `[S14, S15, S16, S17, S18]`); `scenes-4-a.js` S14 The tape destroys itself + S15 The cameras go dark (rebuilt); `scenes-4-b.js` S16 + S17 (**kept**, timing check only); `scenes-4-c.js` S18 Home on the wire (pole line and title timing reworked); `scenes-4-util.js` | S14, S15, S18 rebuilt; S16, S17 kept |

**Cross-group rules**
- A group never edits another group's files. Three helpers are shared read-only from `scenes-1-util.js`: `buildTelegraphLine` (S18), `buildCar` (S11), `buildQueenCard` (optional in S18). Group 1 publishes their signatures first (a stub that returns a Group is fine); if they are not there in time, the other group builds the same spec itself.
- Handoffs that must match exactly: S02 → S03 (street level y -3.4, the rolling ball); S05 → S06 (mirror hole and clockwork glow); S08 → S09 (door ring, `pre` 0.5); S09 → S10 (black 76.60-77.62); S10 → S11 (black, fade up at 84.70); S11 → S12 (surface shatter, sky above); S12 → S13 (pier ahead, `pre` 0.8); S13 → S14 (gold line overhead left to right, 4 m above the eyes, at 112.04); S15 → S16 (dot at 14° straight ahead, kept).
- The `words.json` corrections (section 2) are applied once by the integrator before the groups start. Scenes use `near:` lookups, never hard-coded word times; beat times inside a scene may be constants but must equal the corrected word times above.
- `tools/xrtest.mjs` has DD-003 checks (seek, return at 4 times, title): the integrator re-runs it after the merge and updates any check that names an old time or scene.

## 8. Checks for every group (silent, headless)

```
node tools/showshots.mjs tape=2 port=581<n> frames=1 times=<every 1.5 s of your window> views=fwd out=tools/shots/blackbox/v3/g<n> fov=95 w=420 cols=6
node tools/showshots.mjs tape=2 port=581<n> times=<3 key beats per scene> views=left,right,up,back out=tools/shots/blackbox/v3/g<n>-around
python tools/clarity.py --quiet tools/shots/blackbox/v3/g<n>/frames
node tools/lyriccheck.mjs port=584<n> from=<t0> to=<t1>
```

- Forward frames within the per-scene targets above; no frame over a hard limit.
- Side and up views: something big and well shaped is there in every scene (section 3, rule 6). Put one forward, one left and one up still per scene next to the IEYTD sheets and ask: "can a 16-year-old tell in half a second what this is?"
- Draw calls and triangles from the sheet captions within the scene budget.
- `lyriccheck` Part A clean for your window (after the `words.json` fix).
- `xrtest.mjs` only by the integrator and the fixer (fixed port 5793, one instance at a time).

## 9. Open points for Leo

- The `words.json` corrections come from the vocal stem's energy, not from listening (the PC stays silent). Leo checks on the Quest: both 3-2-1 countdowns, "Gold" at 60.5 and 128.3, the second "Oh-oh" (66.1), and whether a second "gold on the wire" is really sung at 67.4 and 147.4.
- The red phone booth is our own design (no crown, no lettering), modelled in code.
- No ride object under the player (the IEYTD cog disc) is used; the player still floats freely everywhere.
