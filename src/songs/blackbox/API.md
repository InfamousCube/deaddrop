# DD-003 "black-box": API for scene builders

This is the show for the song **Gold on the Wire** (MistyConifer) on tape DD-003. Never write "Black Box" anywhere in the show. The first plan is in `STORYBOARD.md`. After Leo's feedback (07.11.: "far too much happens", "no desk, nothing in front of me") every scene was reworked into one clean IEYTD-style shot: the **shot card in the header of each scene file is the source of truth** where it differs from the storyboard. Read **Clarity rules** below before you add anything.

You edit only your own `scenes-N.js`. The foundation files are `show.js`, `style.js`, `rig.js`, `type.js`, `fx.js` and `kit.js`. If you think a foundation file needs a change, say so; don't fork it.

## Files

| file | content |
|---|---|
| `show.js` | Scene manager: picks the scene that owns t; sets the world (ramp, rim, fog, key, sky); computes the rig state (never drawn) and runs the flashes; handles the lobby dissolve and return; prebuilds while the tape is held. |
| `style.js` | `PAL`, `RAMPS`, `WORLDS`, the shared uniforms `U`, `toon()`, `flat()`, the sunburst dome, `mulberry()`, `flatShade()`. |
| `rig.js` | `RIG` constants and `travel()` speed profiles. It still builds the old cradle (deck, railing, hanger, gold wire), but `show.js` never adds it to the scene: **nothing travels with the player**. |
| `type.js` | Glyph-atlas typography (`makeText`), the `words.json` index (`match` / `times` / `line`). |
| `fx.js` | `particles`, `shards`, `matte` (portal), `edges` (edge-mode), and the helpers `sm`, `lightsOut`, `passBy`, `envAfter`, `fadeK`. |
| `kit.js` | `saltFlat()` (S18; S01 now has its own 2 pairs of giant T-poles), `placeholder()`, `mergeSimple()`. |
| `scenes-1.js` .. `scenes-4.js` | Default export: an array of scene objects (group 1 = S01-S05, 2 = S06-S09, 3 = S10-S13, 4 = S14-S18). Since round 3 they only import the scene files below. |
| `scenes-1-s01.js` .. `scenes-3-s13.js`, `scenes-4-a/b/c.js` | One scene per file (group 4: S14+S15 in `a`, S16+S17 in `b`, S18 in `c`). The shot card in each file header is the source of truth. |
| `scenes-1-util.js` .. `scenes-4-util.js`, `shapes-4.js` | Shared geometry builders per group (see **Shared builders** below). Read-only for other groups: import them, don't edit them. |
| `STORYBOARD-v3.md` | Round 3 plan (Leo, 07.11.: "shapes too primitive", "too little happens around you", lyric timing). |

Imports inside a scene file:

```js
import * as THREE from 'three';
import { PAL } from './style.js';   // anything else comes through `kit`
```

## Coordinates

All in metres, world space = rig space.

- The player stands where the desk was. Their eyes are at about `(0, 1.6, 0.05)`.
- `-z` is forward, `+x` is right, `+y` is up.
- **The player floats freely in each world.** There is no deck, railing, gondola, console, hanger rod or wire around them (Leo, 07.11.: "no desk, no control panel, nothing in front of you"). Never add anything that travels with the player, in the lower or the upper view. `RIG.wireY` (3.4) is only a height reference now.
- **The player never moves.** Travel means moving your world: put everything in a group and set `group.position.z = +distance`, using `kit.travel(...)`.
- Comfort without a cockpit (there is no frame around the player any more):
  - cruising speed at most 4 m/s, vertical at most 2 m/s, smooth eases (`kit.travel` eases 1 s or more);
  - no forced camera motion; large structures around the player rotate at most 3°/s; a floor that opens or slides under the player moves at most about 3 m/s (S06 split: 2.9 m/s); no rings or sweeps racing out across the floor from under the player (S06 tick ring and S10 board sweep removed 07.11.); a far hero object drifts at most about 3-4 deg/s (S07 airship: 110 m out, 4 m/s);
  - nothing closer than 1.5 m to the eyes; shards and bursts fly away from the player;
  - every world has a readable ground or horizon below or ahead, so the player does not feel like falling.
- Main action goes in the front ±35°. Sides, back and up may be calm (IEYTD is calm there too), but not empty: one big silhouette or the world colour is enough.
- Comfort flag: `COMFORT` from `style.js` (URL `?comfort=1` or localStorage `dd.comfort` = `1`, read once at load). Only S07 still uses it (9 instead of 16 shards); the old falls and shard storms are gone. Headless renders: `node tools/showshots.mjs tape=2 q=comfort=1`.

## Scene object

```js
{
  id: 'S07', t0: 47.5, t1: 56.61,          // keep the ids and times from the stub
  world: 'hot',                              // 'hot' | 'cold' | 'amber' | 'black': ramp of toon({ramp:'world'}), rim, fog, rig colours, sky preset
  pre: 0.3, post: 0,                         // seconds before t0 / after t1 the scene is already / still visible (transitions)
  key: [0.1, 0.5, -0.86],                    // key light direction (toward the light), one per world
  fog: { color: 0x07070c, near: 30, far: 170 },  // optional, else from the world
  sky: { rays: 0, stars: 0.4 },              // optional: overrides on the world's sky preset; 'hot'|'cold'|'amber'|'black'; false = no dome
  flashes: [{ t: 47.48, color: 0xd8141c, dur: 0.03 }],  // colour flashes (1-2 frames), drawn over everything
  build(kit) { /* create meshes, add to kit.group; return a state object */ },
  update(t, s, kit) { /* pure function of song time t; may return { flash: hex } */ },
  events() { return [{ t: 49.34, sfx: 'whoosh', gain: 0.7, haptic: [0.4, 60] }]; },  // optional
  look(L, t) {},                             // optional, owner only; you should not need it
}
```

**Lifecycle**
- **`build(kit)`** runs once, either in the prebuild pump (one scene per 30 ms idle slice while the tape is in the hand or being inserted) or on demand when a seek needs the scene. Keep it under about 20 ms: no per-frame allocations, reuse geometry, prefer InstancedMesh. Its group starts hidden.
- **Warm-up**: right after `build`, the manager calls `update` once at t0 + 0.05, the middle and t1 - 0.05 while the group is hidden (`kit.isOwner` false, scratch `rigState`), then compiles the group, so lazily created state (`instanceColor` via `setColorAt`) gets its shader program before the first visible frame. Owner-only calls must stay behind `kit.isOwner`.
- **`update(t, s, kit)`** is called every frame while `t0 - pre <= t < t1 + post`. Outside that window the group is hidden and update is not called.
- **Everything must be a pure function of t.** No accumulating state, no `dt`. Seeking ±10 s, scrubbing backwards and the return can happen at any frame. Compute positions from t (`kit.travel(...).d(t)`, `kit.sm`, beat times), never from the previous frame.
- **The owner** is the scene with `t0 <= t < t1`; `kit.isOwner` is true only there. Only the owner may touch the sky (`kit.setSky`, `kit.sky`), the rig state (`kit.rigState`, not drawn) and the world blend (`kit.setWorld`). A scene in its `pre`/`post` overlap only draws its own group.
- **Every frame, before update**, the manager resets for each active scene: the world uniforms, the sky (to the owner's preset), `kit.SU.uSceneFade = 1`, `kit.SU.uEdge = 0`, the rig state, and all text reveals (these update automatically). So set what you need every frame.
- **`pre` / `post`**: content of the incoming scene that is visible before its `t0` is drawn over the outgoing world. Keep `pre: 0` unless a portal, matte or match-cut needs it, and then keep the pre-visible part away from the outgoing scene's hero and lyric (S06, S08 and S09 were set to `pre: 0` for this).
- **Return to the lobby** (B/Y held, the watch, or the song's end) is handled by `show.js`. It freezes the last t and fades the global `U.uFade` to 0 over 0.85 s (`returnDur` 1.2), then hides everything. The lobby (room, desk, case, phone, tapes) breaks apart 0.05-0.7 s (`LOBBY_GONE` in `show.js`; fast, so no debris hangs behind the first title), is hidden for the whole song and comes back 151.8-153.6 s (`L.hideLobby`, in `show.js`). **Never touch the lobby** or `world.*` from a scene.

## The kit (second argument of build/update)

**Groups and uniforms**
- `kit.group`: your scene root. Add everything here.
- `kit.SU`: per-scene uniforms `{ uSceneFade, uEdge }`.
- `kit.U`: global uniforms. `U.uTime.value` is the song time.

**Palette and constants**
- `kit.PAL`, `kit.RAMPS`, `kit.WORLDS`, `kit.RIG`, `kit.FX` (the fx module), `kit.THREE`.

**Materials** (all hard-ramp, unlit, shared program, fog and fades included)
- `kit.toon({ ramp, rim, rimAmt, rimTh, key, fog, opacity, side, vertexColors, bright, th })`
  - `ramp`: `'world'` (default; follows the active world and `setWorld`), or `'hot'|'cold'|'gold'|'cream'|'rust'|'amber'|'black'|'steel'`, or `[c0, c1, c2, (c3)]`.
  - `rim` defaults to the world rim (gold / cyan / amber); `null` means no rim.
  - Uses 3 hard steps (4 if the ramp has 4 colours). The rim appears only on the dark side of silhouettes.
  - InstancedMesh and `instanceColor` multiply the ramp (set `mesh.instanceColor` before the first render).
  - Animate it through `mat.uniforms.uC0..uC3 / uRim / uRimAmt / uOpacity / uBright`.
- `kit.flat({ color, opacity, additive, fog, edgeKeep, side, depthWrite, depthTest, vertexColors, bright })`
  - Flat colour for lamps, cones (opacity about 0.25), flames, graphic cut-outs, wires and bulbs. `instanceColor` works.
  - `edgeKeep: 1` keeps it visible in edge mode.
- Raw `THREE.MeshBasicMaterial` is fine for one-offs, but it ignores fog and fades. Prefer `kit.flat`.

**Type**
- `kit.text(str, opts)` returns a text object `T`, and adds `T.mesh` to `kit.group` (or `opts.parent`).
- Options:
  - `cap` (cap height in m, 0.9-1.6 for lyrics);
  - `color` (`'gold'|'cream'|'rust'|hex`) and `colors: { wordIndex: colour }`;
  - `align`, `vAlign`, `tracking` (em), `lineGap`; `'\n'` breaks the line;
  - `times`: one reveal time per word, or one number for all words;
  - `near: 47.48` takes the word times from `words.json` for the same phrase, nearest that time. Use `say: 'zero'` when the shown text differs from the sung words;
  - `out`: time the line leaves (slides down and fades over `outDur`, 0.25);
  - `pop: true` scales words in instead of sliding them up; `dur` is the reveal duration (0.14);
  - `at: { d, az, y, tilt }` places the text d m away at azimuth az (degrees, + is right), height y, facing the player;
  - `opacity`, `bright`.
- Reveals update automatically each frame (pure in t). One mesh per line, so one draw call.
- `T.words[i]` gives `{ x0, x1, y0, y1 }` in local metres, for glueing things to a word.
- `T.redact(i, t)` slams a black bar with a white spark edge over word i at time t (every "why").
- `T.hideWord(i, t)` hides word i from t on.
- `depthTest: false` draws the line over everything in front of it (signs that set pieces pass between). Use it for lines that sit low over a floor or plain: otherwise the ground plane clips the lower line.
- `vAlign: 'bottom'` puts the last line's baseline at `at.y` and grows the block upward (a 2-line block over a floor never dips into it); `'top'` hangs it below `at.y`, `'baseline'` puts the first baseline there, `'middle'` (default) centres it.
- Size: a Bebas line is about `0.49 x cap` metres wide per character. Glyphs on black count as clarity *specks* unless `cap / d` is about 0.15 or more, so keep a line at 12 characters or fewer and split a long phrase into 2 short lines or 2 sequential blocks.
- To glue text to a surface, pass `parent: someMesh` and set `T.mesh.position/rotation` in that mesh's space.
- The font is Bebas Neue (`web/fonts`, OFL) with an italic slant of 0.2, caps only. Glyphs: `A-Z 0-9 . , ' ! ? - : & / " ( ) + % #`.

**Placement and words**
- `kit.place(obj, { d, az, y, tilt, face })` positions any object like `at`.
- `kit.words.match('smile like an angel', 99)` returns `[{ w, s, e }]`.
- `kit.words.times(text, near)` returns the start times.
- `kit.words.line(i)` returns line i's words; `kit.words.lines[i].text/.s/.e`.

**Beats.** `kit.beats` (all beats, s) and `kit.downbeats`, plus:
- `kit.beatEnv(t, rate)` and `kit.downEnv(t, rate)`: 1 on the beat, exponential decay after;
- `kit.beatIndex(t)`;
- `kit.beatsIn(a, b)`.

**Motion**
- `kit.travel([[t, v, ease], ...])` returns `{ v(t), d(t) }`: speed v (m/s) from time t, eased over `ease` seconds (default 1.2, always 1 or more). `d(t)` is the exact distance, so `world.position.z = prof.d(t)` gives forward travel.
- `kit.sm(a, b, t)`, `kit.clamp01`, `kit.ease.out / in / inOut`, `kit.rnd(seed)` (deterministic RNG).

**Transitions** (the outgoing scene owns its transition; the incoming scene sets `pre`)
- LIGHTS-OUT: `kit.FX.lightsOut(t, [t1, t2, ...])` counts how many switch times have passed; switch rows off by index.
- PORTAL: `kit.matte({ shape: 'circle', r } | { shape: 'rect', w, h })` is a huge black plane with a hole, drawn early, which hides what is behind it. Put it at the frame, facing `+z`, and hide it when the frame passes the eyes. The next scene, visible via `pre`, must stand behind it.
- SHATTER: `kit.shards({ n, t0, life, gravity, colors, init: (i, rnd) => ({ p, v, axis, spin, s: [w, h], c, delay }) })` gives GPU-driven flat triangle shards (one draw call).
- EDGE-MODE: build `const L = kit.edges(obj, { color, threshold })` once in `build`, then `kit.group.add(L)`. It bakes every Mesh under `obj` (text meshes and every InstancedMesh instance too; only InstancedBufferGeometry is skipped), so build the edges before adding text, beads or helper meshes. During the transition set `kit.edge(1)` (fills go black, flat materials and text vanish) and `L.u.uOn.value = 1`. InstancedMesh instances are baked at build time.
- COLOR FLASH: use `flashes: [{ t, color, dur: 0.03 }]` on the scene, or return `{ flash: hex }` from update.
- FADE: `kit.fade(k)` (scene to black, 0..1). `kit.FX.fadeK(t, a, b)` gives `1 - sm(a, b, t)`.
- MATCH-CUT: choreography. Put the same shape at the same screen position, then swap on one frame (old group `post`, new group `pre`).
- PASS-BY: `kit.FX.passBy(t, t0, dur, dist)` gives an eased offset.

**Particles**
- `kit.particles({ n, shape: 'disc'|'ring'|'tri'|'quad'|'stroke', size, color, opacity, additive, billboard, init: (i, rnd) => ({ p, v, g, t0, life, s, c, swirl, freeze: [tA, tB] }) })`.
- Flat, unlit, GPU-driven and pure in t. `swirl` rotates about the world y axis (rad/s). `freeze` stops the motion clock between tA and tB (frozen bubbles).

**Sky** (owner only)
- `kit.setSky({ ... })` overrides on the scene's preset. Keys:
  - `rays` (0..1 for all) or `kit.sky.uRays.value[i]` (16 wedges, each 0..1);
  - `rot` (rad), `rayR` (angular radius of the ray field), `rayAmt`;
  - `rings`, `ringPhase`, `ringFreq`, `focal: [x, y, z]`;
  - `sunR` (rad), `sunCol`, `sunRing`;
  - `moonR`, `moonDir`, `stars`;
  - `zen`, `hor`, `hor2`, `nadir`, `rayA`, `rayB`, `ringCol`, `band: [y0, y1, y2]`, `amt`.
- The defaults are focal straight ahead 7° up; 16 hard crimson / dark-carmine wedges; gold rings.
- Make it pure: e.g. `rot: t * 0.035`, `ringPhase: t * 0.12`.

**Fog** (owner only): `kit.setFog(color, near, far)` overrides the scene's fog for this frame (call it every frame; S11 underwater).

**World blend** (owner only)
- `kit.setWorld('hot', k)` blends the `'world'` ramp, rim and fog colour from your `world` to another by k. Use it for S10 (cold to hot on "light"), S16 (amber to hot) and S17 (hot to amber at ignition).

**Rig state (not drawn)** (owner only): `kit.rigState` is still filled each frame (`dark`, `vis`, `gauge`, `lampOn`, `wheelSpin`, `wire: { on, lenF, lenB, pulses }`, plus `worldB` / `mix` from `setWorld`), so older scene code that writes it keeps working. **None of it has a visible effect**: the cradle, the gold wire and the global "gold on the wire" pulses (`WIRE_PULSES` in `show.js`) are not in the scene. If a scene needs a wire, a gauge or a lamp, it builds its own, out in the world (S08's gold wire, S12's high wire, S13's cord).

**Shared set piece.** `kit.saltFlat({ gap, spacing, count, height })` returns `{ group, update(t, d, bulbFn) }`: the black ground plus T-pole rows (2 draw calls + ground). `bulbFn(i, side, z)` returns a colour hex, or null for off.

## Shared builders (round 3)

Real objects from profiles (lathe, bevelled extrude, tube), one repeated fine motif per hero. Import from the util file; never fork it.

- `scenes-1-util.js`
  - geometry: `lathe(pts, seg)`, `ext(shape, depth, bevel)`, `tube(points, r)`, `roundRect`, `rrPath`, `archPts(w, h)`, `polyShape` / `polyPath`, `heartShape`, `ellPts`, `arcBand`, `gearShape(r, teeth, depth)`, `inst(geo, mat, n)`, `setM(mesh, i, x, y, z, ry, sc)`, `colorsOf`, `merge`.
  - `buildTelegraphLine(kit, { gap, spacing, count, z0, height, wireR, sag, insR, rim, ramp })` returns `{ group, poles, ins, wires, wireAt(row, w, z, out), crossY, n, z0, spacing, gap }` (lathe poles, bevelled crossarms, instanced glass insulators, 4 sagging wires per row; S01).
  - `buildQueenCard(kit, { rim })` returns `{ group, halo, haloMat, glassMat, glasses, smile, W: 7.2, H: 10 }` (angel side / spy side; S01).
  - `buildCar(kit, { scale, ramp, rim, chrome })` returns `{ group, body, lampMat, tailMat, cones, wheels, len, wid }`: lofted 60s GT coupe, nose to +z, origin on the ground (S03).
  - `buildChandelier(kit, { r, drops, ramp, dropColor })` (S02, S04).
  - Shared glide path S03-S05: `PATH_KEYS`, `T_DOOR` (25.2), `streetY(t)`; the gold ball `ballOut(t, out)`, `BALL_R`.
- `scenes-2-util.js`: `wt(kit, phrase, near, i)` (word time from `words.json`), `xf(geo, p, r, s)`, `merge`, `paint(geo, hex)`, `lathe`, `ext`, `tube`, `cyl`, `shapeOf`, `circlePath`, `ringShape(r0, r1)`, `roundRect`, `archPts`, `gearGeo({ r, teeth, spokes, rim, hub, bolts, saw })` (real toothed gear with spoke windows and bolts), `angelParts()` (foundry statue), `ladyParts()` (the dancer: gown, bob, gloves, glasses).
- `scenes-3-util.js`: `setI`, `inst`, `instColors`, `setC`, `facet`, `merge`, `lathe`, `ribbed(geo, n, amt)`, `circ`, `rrect`, `shapeOf(pts, holes)`, `extrude`, `tube`, `sagPts(a, b, sag)`, `bbox`, `box`, `beam(a, b, w)`, `wireMat(kit, color)` (a wire that lights along its length, `uK1`), `HARBOUR` (S11-S13 path, bridge and pier), `HOT_NIGHT` (S12/S13 sky preset).
- `scenes-4-util.js`: `inst`, `setM`, `setMQ`, `initColors`, `setC`, `mixC`, `boxAt`, `shapeGeo`, `mirrorOutline`, `crescent`, `profile`, `clipBand`, `sung(kit, phrase, near)` (word times; its `FIX` table for the bridge is inert since `words.json` carries the corrected times).
- `shapes-4.js`: `extrude`, `lathe`, `tube`, `catenary`, `chaikin`, `reelFlange` / `reelHub` (S14 tape machine), `monitorGeos()` and the `pic*()` screen pictures (S15), `poleGeo()` / `insulatorGeo()` / `POLE` (S18 telegraph line), `flameGeo`, `cloudGeo`.

## Sound effects (`events()`)

The available sfx names are:

`crack drop dtmf grab hatch key keyUp lid lidOpen morse motor ping pneumatic rebuild shutter slot switch tapeStart tapeStop tick whoosh`

Keep them sparse (about 1 per 2-4 s). The song is the soundtrack. `haptic: [strength 0..1, ms]` is optional.

## Performance rules (Quest 3, standalone)

- At peak, per eye: about 150 draw calls and 200k triangles **for the whole frame**. The dome and the texts take about 5-10 calls; your owner scene gets about 60-90 calls, plus about 40 for the scene in its `pre`/`post` overlap. After the clean rework the whole show peaks at about 32 calls and 15k triangles per eye (headless stills).
- Use one InstancedMesh per repeated object type and merge static geometry (`kit.js` `mergeSimple`, or `BufferGeometryUtils` from `three/addons/utils/BufferGeometryUtils.js`). Keep faces low-poly (flat faceted look).
- No lights, shadows, textures (except the glyph atlas), post-processing, transparency stacks or full-screen overdraw.
- Update instance matrices only for what moves. Never allocate in `update` (keep temp vectors in the state).
- Never flash the whole view faster than 3 Hz. Colour flashes last 0.03 s.

## Clarity rules (Leo, 07.11.: "far too much happens", compare the real IEYTD 3 intro)

Reference stills: `reference/ieytd3-samples/*.png`, `reference/ieytd3-intro-frames.png`. Every scene is ONE clear shot (or 2-3 clear beats in sequence) with a shot card in its file header: hero subject, at most 2 supporting elements, palette, the one main motion, where the lyric sits.

- **One hero** per shot (a mask, a zero, a car, a bomb, a dial). Everything else is big dark silhouette framing or empty black. A second hero waits until the first has left (S07: the airship goes down before the angel rises).
- **2-3 flat colours** per shot: black + one field colour + one accent. About half the frame is black, as shadow shapes, not noise.
- **Big chunky shapes.** No thin lines, wires, grids or wireframes (make them chunky bands that read at distance), no swarms of small instances. Repetition is a few large ordered silhouettes, not hundreds of small things.
- **One main motion at a time**, slow and readable. Particles only as one short accent per scene (sparks once). Sunburst rays only on a few chorus hits, never as permanent wallpaper.
- **Lyrics:** one phrase visible at a time (one block, at most 2 short lines), big, in calm space within about +-35 deg of forward, on the `words.json` times, and gone (`out`) before the next phrase appears. Never on top of busy shapes or the hero, never scattered in several places, no credit-size text. A display that belongs to the hero (S08's timer digits, S13's dial hub) may stay next to the lyric.
- Prefer deleting, enlarging and merging over adding.

**The check** (`tools/clarity.py`) measures each frame against the IEYTD stills: `edges` (share of hard colour-edge pixels: thin lines, grids, rows of small things), `specks` (tiny separate shapes), `colours`, `black` share and `busy` (combined).
- Per frame: edges <= 0.095, specks <= 26, colours <= 8, busy <= 19.8.
- Whole show: median edges <= 0.056, median busy <= 12.4, median black >= 0.38.
- Frames before 0.7 s (lobby break) and from 151.8 s (lobby rebuild) are not show frames; leave them out.
- Numbers are not enough: also look at the frames next to the IEYTD stills and ask "can I tell in half a second what this shot is about?"

```
node tools/showshots.mjs tape=2 port=5825 frames=1 times=0.8,3.8,6.8 views=fwd out=tools/shots/blackbox/clean/full fov=95 w=420 cols=6
python tools/clarity.py --quiet tools/shots/blackbox/clean/full/frames --json tools/shots/blackbox/clean/full/clarity.json
```

- `fov=95` is the **vertical** field of view (about 125 deg horizontal at 16:9), and the forward view is pitched -7 deg, so a still spans roughly -54 to +40 deg elevation. Heroes and text look smaller there than on the Quest.
- Black beats: only two designed ones (S06 "hold your breath" 42.76-47.5 and S15 "lights out" 124.9-127.6), and both keep a faint ground (S06 petrol floor, S15 funnel rim). Every other shot has a field colour behind its hero.
- Round 2 check (07.11., 51 forward frames every 3 s from 0.8 s): median edges 0.035, busy 3.6, black 0.52; 0 frames over a per-frame limit. Sheets in `tools/shots/blackbox/clean/final/`.
- **Round 3 check** (07.11., integration, same grid): median edges 0.056, busy 6.7, black 0.55; 0 of 51 frames over a per-frame limit; peak 56 draw calls / 57k triangles per eye. Sheets in `tools/shots/blackbox/v3/full/` (360 views at 10 times: `v3/full360/`, seams at t-0.3 / t / t+0.4: `v3/seams/`). Round 3 has richer heroes and side rows, so the edge median sits at the limit: new detail must replace, not add.
- **Round 4 fixes** (07.11., review of round 3): S06 gears in 3 depths with solid fills lit from the aisle (brass near 4.2 m, steel 6.6 m, 5 brass gears in the shaft wall that rise past while you sink; none cut the floor any more) and a round floor indicator (cream face, B/5/10, crimson hand, brass pivot) at az 46; S04 tower sinks whole instead of bursting into specks; S08 open door shows a gold strongroom floor with gold bars (no flat gold disc), the opened leaf dims to a backlit silhouette; S09 safe has a big dial in a bolt ring, a 1.4x handwheel and barrel hinges, laser X's on both vault-room walls (5.4 m out), a pedestal with a cut diamond under a cyan spot and 3 security cameras at the corridor end; S11 cyan light shafts from the surface beside the path; S12 four moored boat silhouettes at 7.5 m on both sides; S14 cream NAB reels, dark smoke wipe; S15 lit monitor cases. Check (same grid): median edges 0.056, busy 7.4, black 0.56, 0 of 51 over; peak 56 calls / 57k tris. Sheets `v3/final/`. The edge median is at the limit again: replace, don't add.
- Two tricks that keep a transition frame calm:
  - **Fog as a curtain.** Pull the owner's fog in while a dense far row is on screen (`kit.setFog` every frame, pure in t). S05 pulls black fog from 7-24 m to 5-13 m while the mirrors stand open (30.4-35.6).
  - **Murk instead of a long dim fade.** A world faded to 10-40 % breaks into specks (only its bright edges survive). Fade up in 0.1 s into thick fog of the field colour, then open the fog (S11: petrol fog 2.5 m to 42 m over 84.7-85.5).
- A block should leave (`out`) about 0.2 s before the next block in the same place slides in, or both are on screen during the 0.25 s slide (S05).

## Testing (silent, headless; never open windows or play sound)

```
node tools/showshots.mjs tape=2 port=581N out=tools/shots/blackbox/gN times=50,52.9,54.2 views=fwd,left,back,up
node tools/xrtest.mjs        # must end ALL PASS
```

- `tape=2` is DD-003 (the index is 0-based).
- **Lyric timing:** `node tools/lyriccheck.mjs port=5826 [from=0 to=151.8]` boots the show, samples every text block every 0.01 s and compares each word's first visible frame with its `words.json` onset. It must print `0 mismatches` (tolerance 0.08 s; EARLY/LATE, COUNTER for digits, EXTRA, MISSING, NEVER). Part B (advisory) checks `words.json` itself against the vocal stem `analysis/gold-on-the-wire/vocals.wav` when it exists; `runs=a-b` lists voiced runs to re-time words.
- **`words.json` corrections** (07.11., STORYBOARD-v3 section 2, applied in the file): Gold 13.42, car 17.87, mirror 29.39, tick 38.52, here 45.14, Gold/on/the/wire/tonight 60.52/61.15/61.43/61.72/62.28, Oh-oh 66.13 (its squeezed "gold on the wire" 67.36-67.54 removed), Waltzing 72.03, Tick 86.82 (uncertain), both bridge countdowns 114.29/115.39/116.56 and 119.95/121.16/122.27, never/here 118.33/118.91, You/were/never/here 123.15/123.50/123.85/124.35, Lights 125.70, Gold 128.27; L38's squeezed duplicate "gold on the wire" (147.34-147.52) removed, "tonight" 148.00 kept. Every block reads its times through `near:` / `wt()` / `sung()`, so a later correction in `words.json` carries over by itself. No other show reads `words.json`. The file before these corrections is kept in `analysis/gold-on-the-wire/words.before-v3.json`.
- **Nothing travels with the player:** no mesh may follow the player. S06's floor dial is mounted on the shaft wall (world-fixed); you sink past it while its needle sweeps 10 to B.
- Use a different `port` per parallel render (group 1: 5811, 2: 5812, 3: 5813, 4: 5814, integration 5825-5828). `node tools/xrtest.mjs` uses a fixed port: run one instance at a time.
- `frames=1` also writes every still as a PNG to `<out>/frames/` for `clarity.py`.
- The sheet prints draw calls and triangles per still (one eye, 1280x720).

## Minimal example scene

```js
import * as THREE from 'three';
import { PAL } from './style.js';

export const S99 = {
  id: 'S99', t0: 47.5, t1: 56.61, world: 'hot', pre: 0, key: [0.1, 0.55, -0.83],
  flashes: [{ t: 47.48, color: PAL.crimson }],
  build(kit) {
    const s = {};
    s.world = new THREE.Group();
    kit.group.add(s.world);
    // a row of 24 towers (one draw call), rim-lit gold toward the player
    const geo = new THREE.BoxGeometry(0.6, 30, 0.6).translate(0, 15 - 40, 0);
    s.towers = new THREE.InstancedMesh(geo, kit.toon({ ramp: 'black' }), 24);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 24; i++) s.towers.setMatrixAt(i, m.makeTranslation(i % 2 ? 7 : -7, 0, -i * 20 + 30));
    s.world.add(s.towers);
    // lyric line on its sung word timings
    s.line = kit.text('GOLD ON THE WIRE', { cap: 1.4, color: 'gold', near: 47.48, out: 50.9, at: { d: 7, az: -20, y: 2.1 } });
    s.prof = kit.travel([[47.5, 4, 0.01], [47.6, 6, 1.0]]);
    return s;
  },
  update(t, s, kit) {
    const d = s.prof.d(t);
    s.world.position.z = d % 40;                       // rows repeat every 40 m
    s.towers.material.uniforms.uBright.value = 1 + 0.4 * kit.downEnv(t, 5);
    if (kit.isOwner) {
      kit.setSky({ rot: t * 0.035, ringPhase: t * 0.12, rays: kit.sm(49.3, 49.4, t) });
      kit.rigState.wheelSpin = d / 0.075;
    }
  },
  events() { return [{ t: 49.34, sfx: 'whoosh', gain: 0.6 }]; },
};
export default [S99];
```
