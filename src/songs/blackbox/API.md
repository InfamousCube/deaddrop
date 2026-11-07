# DD-003 "black-box": API for scene builders

This is the show for the song **Gold on the Wire** (MistyConifer) on tape DD-003. Never write "Black Box" anywhere in the show. The plan is in `STORYBOARD.md`, and every scene below follows it.

You edit only your own `scenes-N.js`. The foundation files are `show.js`, `style.js`, `rig.js`, `type.js`, `fx.js` and `kit.js`. If you think a foundation file needs a change, say so; don't fork it.

## Files

| file | content |
|---|---|
| `show.js` | Scene manager: picks the scene that owns t; sets the world (ramp, rim, fog, key, sky); runs the cradle and flashes; handles the lobby dissolve and return; prebuilds while the tape is held. |
| `style.js` | `PAL`, `RAMPS`, `WORLDS`, the shared uniforms `U`, `toon()`, `flat()`, the sunburst dome, `mulberry()`, `flatShade()`. |
| `rig.js` | The cradle (deck, railing, hanger, trolley, console gauge, gold wire), `RIG` constants, and `travel()` speed profiles. |
| `type.js` | Glyph-atlas typography (`makeText`), the `words.json` index (`match` / `times` / `line`). |
| `fx.js` | `particles`, `shards`, `matte` (portal), `edges` (edge-mode), and the helpers `sm`, `lightsOut`, `passBy`, `envAfter`, `fadeK`. |
| `kit.js` | `saltFlat()` (S01 + S18), `placeholder()`, `mergeSimple()`. |
| `scenes-1.js` .. `scenes-4.js` | Default export: an array of scene objects (group 1 = S01-S05, 2 = S06-S09, 3 = S10-S13, 4 = S14-S18). |

Imports inside a scene file:

```js
import * as THREE from 'three';
import { PAL } from './style.js';   // anything else comes through `kit`
```

## Coordinates

All in metres, world space = rig space.

- The player stands where the desk was. Their eyes are at about `(0, 1.6, 0.05)`.
- `-z` is forward along the wire, `+x` is right, `+y` is up.
- The cradle deck's top is at `y = 0.012`, radius 0.9. The railing is at `y = 1.0` (r 0.85). The wire is at `y = RIG.wireY = 3.4` and runs from `z = -290` to `+290`.
- **The cradle never moves.** Travel means moving your world: put everything in a group and set `group.position.z = +distance`, using `kit.travel(...)`.
- Keep everything at least 0.5 m from the eyes. Main action goes in the front 120°, but populate the sides, back and up.
- No forced camera motion. The world may rotate slowly (2-6°/s), mostly in the periphery.
- Comfort flag: `COMFORT` from `style.js` (URL `?comfort=1` or localStorage `dd.comfort` = `1`, read once at load). S06 caps its drop at 7 instead of 10 m/s and S07 halves and shrinks its shard burst. Headless renders: `node tools/showshots.mjs tape=2 q=comfort=1`.

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
- **The owner** is the scene with `t0 <= t < t1`; `kit.isOwner` is true only there. Only the owner may touch the sky (`kit.setSky`, `kit.sky`), the cradle (`kit.rigState`) and the world blend (`kit.setWorld`). A scene in its `pre`/`post` overlap only draws its own group.
- **Every frame, before update**, the manager resets for each active scene: the world uniforms, the sky (to the owner's preset), `kit.SU.uSceneFade = 1`, `kit.SU.uEdge = 0`, the rig state, and all text reveals (these update automatically). So set what you need every frame.
- **Return to the lobby** (B/Y held, the watch, or the song's end) is handled by `show.js`. It freezes the last t and fades the global `U.uFade` to 0 over 0.85 s (`returnDur` 1.2), then hides everything. The lobby (room, desk, case, phone, tapes) is hidden from 0.05-1.15 s and comes back 151.8-153.6 s (`L.hideLobby`, in `show.js`). **Never touch the lobby** or `world.*` from a scene.

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
- `depthTest: false` draws the line over everything in front of it (signs that set pieces pass between).
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
- `kit.setWorld('hot', k)` blends the `'world'` ramp, rim, fog colour and cradle colours from your `world` to another by k. Use it for S10 (cold to hot on "light"), S16 (amber to hot) and S17 (hot to amber at ignition).

**Cradle** (owner only): `kit.rigState`, already filled with defaults each frame:
- `dark` (0..1): dims the railing and hanger, for lights-out;
- `vis`: 1 during the song, and the deck fades out at 152.8;
- `gauge` (0..1): the needle, defaulting to a downbeat kick; set 1 to slam it;
- `lampOn`;
- `wheelSpin`: set it to `prof.d(t) / 0.075` so the wheels roll with your travel;
- `wire: { on (0..1), lenF (m drawn ahead), lenB (behind), pulses: [{ z, a, w }] }`. The global "gold on the wire" pulses are pre-filled; push your own pulses or replace the list. Set `wire.on = 0` and `wire.pulses = []` to hide the wire and draw your own (S11, S18).

**Shared set piece.** `kit.saltFlat({ gap, spacing, count, height })` returns `{ group, update(t, d, bulbFn) }`: the black ground plus T-pole rows (2 draw calls + ground). `bulbFn(i, side, z)` returns a colour hex, or null for off.

## Sound effects (`events()`)

The available sfx names are:

`crack drop dtmf grab hatch key keyUp lid lidOpen morse motor ping pneumatic rebuild shutter slot switch tapeStart tapeStop tick whoosh`

Keep them sparse (about 1 per 2-4 s). The song is the soundtrack. `haptic: [strength 0..1, ms]` is optional.

## Performance rules (Quest 3, standalone)

- At peak, per eye: about 150 draw calls and 200k triangles **for the whole frame**. The cradle, dome and texts take about 15 calls; your owner scene gets about 60-90 calls, plus about 40 for the scene in its `pre`/`post` overlap.
- Use one InstancedMesh per repeated object type and merge static geometry (`kit.js` `mergeSimple`, or `BufferGeometryUtils` from `three/addons/utils/BufferGeometryUtils.js`). Keep faces low-poly (flat faceted look).
- No lights, shadows, textures (except the glyph atlas), post-processing, transparency stacks or full-screen overdraw.
- Update instance matrices only for what moves. Never allocate in `update` (keep temp vectors in the state).
- Never flash the whole view faster than 3 Hz. Colour flashes last 0.03 s.

## Testing (silent, headless; never open windows or play sound)

```
node tools/showshots.mjs tape=2 port=581N out=tools/shots/blackbox/gN times=50,52.9,54.2 views=fwd,left,back,up
node tools/xrtest.mjs        # must end ALL PASS
```

- `tape=2` is DD-003 (the index is 0-based).
- Use a different `port` per builder (group 1: 5811, 2: 5812, 3: 5813, 4: 5814).
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
