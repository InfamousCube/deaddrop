// DD-002 "Copper Line" - an engineer's heist in one take, for "Gold on the Wire" (MistyConifer).
//
//   0:00  The lounge opens like a box: gold runs along its edges, the lid is hauled into the sky
//         ("fire in the sky" flare), the walls sink into the lift deck and the engineer's 1:60
//         heist maquette of the city unfolds around the desk, lights counting down to zero.
//   0:15  The platform sinks to street level: the black car waits where the streetlights end,
//         the champagne tower, the mirror towers that show a face, gold escape routes to every exit.
//   0:40  "Ten floors under": the platform is a lift. Down the shaft, B1..B10, into the vault.
//   0:47  The vault: a drum of deposit boxes, two robot arms with velvet grippers, a laser cage,
//         one red light and the whole room spins, the big door, the golden wire spool.
//   1:52  "Three, two, one - you were never here": the whole heist rewinds like the tape.
//   2:05  "Lights out". Back above the city: fireworks, gold on every wire, and the room closes
//         again as if nobody had been here.
// Every value is a pure function of song time t (seek, FF/REW, return at any moment).
import * as THREE from 'three';
import { SU, C, poster, Sprites } from './mat.js';
import { buildCity, CITY } from './city.js';
import { buildRoomBox, mulberry } from './roombox.js';
import { buildVault, VAULT } from './vault.js';
import { sm, clamp01, hit } from '../util.js';

const lerp = (a, b, k) => a + (b - a) * k;
const smoother = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * k * (k * (k * 6 - 15) + 10); };
const pulse = (t, a, b, fi = 0.1, fo = 0.2) => sm(a, a + fi, t) * (1 - sm(b, b + fo, t));

// depth profile of the platform (metres the world has moved up)
export const DEPTH = { street: 0.35, vault: VAULT.depth };
function depthAt(t) {
  if (t < 15.1) return 0;
  if (t < 40.52) return DEPTH.street * smoother(15.1, 17.3, t);
  if (t < 126.4) {
    // ten floors: B1..B8 quickly, slow to a halt at B9 for "hold your breath", then the last drop
    const b9 = DEPTH.street + VAULT.floorH * 9 - 0.3;
    if (t < 43.4) return lerp(DEPTH.street, b9, smoother(40.52, 43.4, t));
    if (t < 44.86) return b9 + Math.sin(sm(43.4, 44.86, t) * Math.PI) * 0.04;
    return lerp(b9, DEPTH.vault, smoother(44.86, 47.2, t));
  }
  if (t < 127.68) return DEPTH.vault; // blackout: the scene changes in the dark
  return 0;
}

// Finale fireworks over the maquette: rockets rise from the city, burst on the lyric, light the
// buildings (point light 0 follows the latest burst). City coordinates, pure function of t.
const BEAT = 60 / 105.74;
function buildFireworks() {
  const rnd = mulberry(404);
  const fx = new Sprites(7000);
  const shots = [];
  const PALS = [[0xffc040, 0xffe8a0], [0xff7a30, 0xffc070], [0xfff0c0, 0xffd27a], [0xff3a20, 0xffa060], [0xe0a527, 0xffffff]];
  const shot = (t, a, r, y, o = {}) => {
    const p = [Math.cos(a) * r, y, Math.sin(a) * r];
    const cols = o.cols || PALS[Math.floor(rnd() * PALS.length)];
    // the rocket: decelerates into the burst point (drag), with a short trail
    const d = 4.5;
    for (let k = 0; k < 6; k++) {
      fx.add({ p: [p[0], 0.3, p[2]], v: [0, (y - 0.3) * d, 0], col: k ? 0xff9a50 : 0xffe0b0, i: k ? 1.1 - k * 0.15 : 2.4, size: k ? 0.07 : 0.11, t0: t - 0.8 + k * 0.04, t1: t + 0.05 + k * 0.04, drag: d, kind: 1, group: 1 });
    }
    fx.burst({ p, t0: t, n: o.n ?? 130, speed: o.speed ?? 6.5, life: o.life ?? 2.6, cols, size: 0.3, grav: 1.4, drag: 1.25, group: 1, rnd, ring: !!o.ring, i: 2.6 });
    if (o.inner) fx.burst({ p, t0: t + 0.05, n: 50, speed: 3, life: 1.8, cols: [0xffffff, cols[1]], size: 0.22, grav: 1.2, drag: 1.4, group: 1, rnd, i: 2.2 });
    fx.add({ p, col: cols[0], i: 0.28, size: 3.4, t0: t, t1: t + 0.06, kind: 4, group: 1 });
    shots.push({ t, p, col: new THREE.Color(cols[0]) });
  };
  const F = -Math.PI / 2; // straight ahead
  shot(129.8, F - 0.25, 19, 9.5);                          // "fire in the sky"
  shot(129.8 + BEAT, F + 0.7, 22, 11, { ring: true });
  shot(129.8 + 2 * BEAT, F - 1.0, 20, 10.5, { inner: true });
  shot(131.0, F + 1.6, 17, 9);
  shot(131.68, F, 25, 13.5, { n: 170, inner: true });       // "smile"
  for (let k = 0; k < 4; k++) shot(132.6 + k * 3 * BEAT, F + (k % 2 ? 0.9 : -0.9) + (rnd() - 0.5) * 0.3, 20 + rnd() * 6, 9 + rnd() * 3, { ring: k === 2 });
  for (let k = 0; k < 8; k++) shot(138.1 + k * 0.07, F + (k - 3.5) * 0.33, 21, 10 + (k % 2) * 2.2, { ring: k % 3 === 0, n: 100 }); // "zero"
  shot(140.1, F + Math.PI, 20, 10, { inner: true });        // behind, "why"
  shot(143.16, F, 21, 12.5, { n: 190, speed: 7.5, inner: true, cols: [0xffc040, 0xfff0c0] }); // "tonight"
  shot(143.16 + BEAT, F - 1.3, 19, 10, { ring: true });
  shot(143.16 + BEAT, F + 1.3, 19, 10, { ring: true });
  shot(144.58, F + Math.PI * 0.75, 18, 10);                 // "oh-oh" all round
  shot(144.58, F - Math.PI * 0.75, 18, 10);
  shot(145.6, F + 0.5, 22, 12, { inner: true });
  shot(146.52, F - 0.6, 22, 11.5);
  shot(146.52, F + Math.PI, 21, 11, { ring: true });
  shot(148.0, F, 27, 15, { n: 260, speed: 8.5, life: 3.2, inner: true, cols: [0xffc040, 0xffe8a0] }); // the last "tonight"
  fx.commit();
  fx.groups[1] = 0;
  return { mesh: fx.mesh, groups: fx.groups, shots };
}

class CopperLine {
  constructor() {
    this.name = 'copper-line';
    this.returnDur = 2.4;
    this.built = false;
    this.active = false;
  }

  build(ctx) {
    const world = ctx.world;
    this.world = world;
    this.scene = world.scene;
    this.box = buildRoomBox(world);
    this.root = new THREE.Group();
    this.root.name = 'copper-line-show';
    this.worldRoot = new THREE.Group(); // everything that moves when the platform travels
    this.city = buildCity();
    this.vault = buildVault(ctx);
    this.fw = buildFireworks();
    this.worldRoot.add(this.city.group, this.vault.group, this.fw.mesh);
    this.root.add(this.worldRoot, this.box.deck, this.box.seams);
    // sky dome
    this.skyU = {
      uExposure: SU.uExposure, uFade: SU.uFade, uTop: { value: C(0x04060c) }, uMid: { value: C(0x0c1424) }, uHor: { value: C(0x2a2030) },
      uBelow: { value: C(0x07080c) }, uAmt: { value: 1 }, uFlare: { value: 0 },
    };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), new THREE.ShaderMaterial({
      uniforms: this.skyU, side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform float uExposure, uFade, uAmt, uFlare; uniform vec3 uTop, uMid, uHor, uBelow; varying vec3 vD;
        float hash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        void main(){ float h = vD.y; vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.25, h)); c = mix(c, uTop, smoothstep(0.2, 0.8, h)); c = mix(c, uBelow, smoothstep(0.0, -0.12, h));
          float st = step(0.9982, hash(floor(vD*420.0))) * smoothstep(0.15, 0.5, h); c += vec3(0.8,0.85,1.0) * st * 0.7;
          vec3 fd = normalize(vec3(0.06, 0.85, -0.5)); c += vec3(1.0, 0.45, 0.15) * pow(max(dot(vD, fd), 0.0), 8.0) * uFlare;
          gl_FragColor = vec4(c * uAmt * uExposure * uFade, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    this.sky.renderOrder = -9;
    this.sky.frustumCulled = false;
    this.root.add(this.sky);
    this.root.visible = false;
    this.scene.add(this.root);
    this.camera = this.scene.getObjectByName('rig')?.children.find((c) => c.isCamera) || null;
    this.built = true;
  }

  begin(ctx) {
    if (!this.built) this.build(ctx);
    this.ctx = ctx;
    this.beats = ctx.beats.beats;
    this.down = ctx.beats.downbeats;
    this.active = true;
    this.root.visible = true;
    this.retFrom = null;
    this.vault.begin?.(ctx);
  }

  // ---------------------------------------------------------------------------------------------
  // the box: per-wall open amounts
  boxState(t) {
    if (t >= 148.0) {
      const c = (a) => 1 - sm(a, a + 0.85, t);
      return { lid: 1 - smoother(150.1, 151.2, t), left: c(148.0), back: c(148.55), right: c(149.1), front: c(149.65) };
    }
    const o = (a) => clamp01((t - a) / 0.8);
    return { lid: clamp01((t - 1.16) / 1.84), front: o(3.4), right: o(4.06), back: o(4.96), left: o(6.02) };
  }

  look(L, t) {
    // the desk keeps its warm lamp; the window light goes with the front wall
    const box = this.boxState(t);
    L.window = 1 - box.front;
    L.lamp0 = 0.95;
    L.lamp1 = 1 - 0.6 * box.lid;
    L.flash = hit(t, 2.32, 3) * 0.55 * (t < 4 ? 1 : 0);
    // lights out + the dark scene change
    const lo = sm(124.94, 125.3, t) * 0.55 + sm(126.38, 126.5, t) * 0.45;
    const back = sm(127.62, 127.9, t);
    L.exposure = 1 - lo * (1 - back) * (t < 127.95 ? 1 : 0);
    if (t > 126.38 && t < 127.62) L.exposure = 0.0;
    return L;
  }

  events() {
    const E = [];
    const ev = (t, sfx, gain = 0.8, haptic = null) => E.push({ t, sfx, gain, haptic });
    ev(1.16, 'shutter', 0.55);
    ev(2.32, 'crack', 0.3, [0.4, 60]);
    for (const a of [3.4, 4.06, 4.96, 6.02]) ev(a + 0.78, 'drop', 0.55, [0.35, 40]);
    ev(15.1, 'motor', 0.5);
    ev(40.52, 'motor', 0.7, [0.25, 80]);
    ev(44.86, 'whoosh', 0.7);
    ev(47.1, 'hatch', 0.9, [0.7, 90]);
    for (const e of this.vault.events()) E.push(e);
    ev(124.94, 'switch', 0.8);
    ev(126.38, 'switch', 0.9, [0.5, 50]);
    ev(148.0, 'rebuild', 0.6);
    ev(151.15, 'drop', 0.8, [0.5, 60]);
    return E;
  }

  // ---------------------------------------------------------------------------------------------
  frame(t) {
    this.apply(t, 1);
  }

  apply(t, fade, retK = 0) {
    SU.uTime.value = t;
    SU.uFade.value = fade;
    const world = this.world;
    const box = this.boxState(t);
    const closed = box.lid <= 0 && box.front <= 0 && box.right <= 0 && box.back <= 0 && box.left <= 0;
    this.box.apply(box);
    this.box.deck.visible = !closed; // under the closed floor it is never seen
    // our sky replaces the lobby's view once the lid moves
    const own = !closed;
    world.outside.group.visible = !own;
    this.sky.visible = own;
    this.root.visible = true;
    const d = depthAt(t);
    this.worldRoot.position.y = d;
    this.lightCity(t, d);
    this.cityState(t, d);
    this.vault.update(t, d, this);
    this.fw.groups[1] = t > 127.6 ? 1 - sm(150.4, 151.3, t) : 0;
    // seams
    const sg = this.box.seamMat.uniforms.uGroup.value;
    sg[1] = 1 - sm(5.8, 7.6, t);
    sg[2] = 1 - sm(1.25, 2.0, t);
    this.box.seams.visible = t > 0.2 && t < 7.7;
    // deck rim lamps light at "zero"
    const dg = this.box.deckFx.groups;
    dg[1] = sm(9.48, 9.6, t) * (t < 126.38 || t > 127.62 ? 1 : 0) * (1 - sm(150.0, 151.1, t));
    dg[2] = t < 8 ? 1 : 0;
    this.skyU.uFlare.value = hit(t, 2.32, 0.9) * 0.9 * (t < 8 ? 1 : 0);
  }

  lightCity(t, d) {
    // moonlit night above the maquette, a warm city glow from below
    SU.uSky.value.set(0x141c30);
    SU.uGround.value.set(0x2a1c12);
    SU.uKeyDir.value.set(-0.45, 0.6, -0.65).normalize();
    SU.uKeyCol.value.set(0x3a4766);
    SU.uRimCol.value.set(0x34425e);
    SU.uFogCol.value.set(0x231c28);
    SU.uFogNear.value = 10; SU.uFogFar.value = 40;
    const P = SU.uP.value, PC = SU.uPC.value, PR = SU.uPR.value;
    // 0: the flare, 1: the champagne tower, 2/3: free for the vault
    P[0].set(0.6, 16, -9); PC[0].set(0xff8a40).multiplyScalar(hit(t, 2.32, 0.7) * 2.2 * (t < 8 ? 1 : 0)); PR[0] = 45;
    const wine = sm(23.7, 24.4, t);
    P[1].set(CITY.tower.x, 2.9 - d * 0 + this.worldRoot.position.y, CITY.tower.z); PC[1].set(0xffb040).multiplyScalar(wine * 1.2); PR[1] = 5;
    PC[2].setScalar(0); PC[3].setScalar(0);
    // fireworks light the city (finale)
    if (t > 129 && t < 152) {
      let s = null;
      for (const f of this.fw.shots) if (f.t <= t) s = f;
      if (s) {
        const k = Math.exp(-(t - s.t) * 3.2);
        P[0].set(s.p[0], s.p[1] + this.worldRoot.position.y, s.p[2]); PC[0].copy(s.col).multiplyScalar(k * 2.6); PR[0] = 42;
      }
    }
    SU.uBeacon.value.set(0, -100, 0, 0); SU.uBeaconCol.value.setScalar(0);
  }

  cityState(t, d) {
    const U = this.city.U;
    const c = this.city;
    const show = d < 9 || t > 127.6;
    c.group.visible = show && t < 152;
    if (!show) return;
    // pop-up as the walls go down, fold away when the box closes
    const rise = t < 148 ? lerp(0, 1.32, smoother(3.3, 7.9, t)) : lerp(1.32, 0, smoother(148.0, 150.6, t));
    U.uRise.value = rise;
    // countdown: the lights come on ring by ring from the edge inwards
    const cd = clamp01((t - 8.06) / 1.42);
    U.uLitR.value = t < 8.06 ? 99 : 34 - Math.floor(cd * 10 + 0.0001) / 10 * 30;
    if (t > 9.48) U.uLitR.value = 0;
    // finale reprise: "count down to zero" relights the city ring by ring
    if (t > 137.28 && t < 138.1) U.uLitR.value = 34 - Math.floor(clamp01((t - 137.28) / 0.82) * 10 + 0.0001) / 10 * 30;
    U.uLit.value = 0.62 + 0.25 * sm(36.34, 40.0, t) * 0;
    // silence: the city holds its breath, only the champagne tower stays lit
    const sil = sm(25.26, 25.9, t) * (1 - sm(27.5, 28.3, t));
    U.uSilence.value = sil;
    // tick, tick, breathe
    const tick = -0.1 * (Math.exp(-Math.max(0, t - 36.34) * 5) * (t > 36.34 ? 1 : 0) + Math.exp(-Math.max(0, t - 38.74) * 5) * (t > 38.74 ? 1 : 0));
    const breathe = 0.22 * Math.sin(Math.PI * clamp01((t - 39.0) / 1.5));
    U.uBreath.value = (t < 41 ? tick + breathe : 0);
    U.uSurge.value = Math.max(0, breathe / 0.22) * 0.8;
    // mirror towers: glint (28.3), a face (30.24), a wink (31.82)
    U.uMirror.value = t > 28.3 && t < 30.1 ? (t - 28.3) / 1.6 : -1;
    U.uFace.value = sm(30.24, 30.92, t) * (1 - sm(33.2, 34.0, t)) + sm(131.68, 132.4, t) * (1 - sm(136.6, 137.3, t));
    U.uWink.value = pulse(t, 31.82, 32.5, 0.08, 0.15) + pulse(t, 134.56, 135.3, 0.08, 0.15);
    // street lamps (groups 1/2 in city fx): city lamps switch on at "don't ask me why"
    const g = c.fx.groups;
    const silK = 1 - sil * 0.85;
    g[1] = silK * (1 - sm(149.0, 150.0, t));
    g[3] = sm(10.46, 11.8, t) * (1 - sil);
    g[5] = sm(10.8, 11.5, t);
    U.uLamps.value = silK;
    // the avenue: one lamp per beat from 17.44, the last one flickers at "streetlights end"
    let lit = 0;
    for (let k = 0; k < 5; k++) {
      const on = this.beatAfter(17.44, k);
      let a = t >= on ? 1 : 0;
      if (k === 4 && t > 21.76 && t < 22.5) a *= (Math.sin(t * 60) > 0.2 ? 1 : 0.25);
      if (t < 17.3) a = sm(10.46, 11.0, t) * 0; // before the verse the avenue is dark
      g[12 + k] = a * silK;
      lit += a;
    }
    if (t > 127.6) for (let k = 0; k < 5; k++) { g[12 + k] = 1; lit = 5; }
    U.uAvenue.value = lit;
    // the black car: headlights at "waiting", flash at "end"; drives off in the finale
    let cl = sm(20.6, 20.7, t) * (t < 20.9 ? (Math.sin(t * 70) > 0 ? 1 : 0.3) : 1);
    cl += pulse(t, 22.38, 22.5, 0.02, 0.05) * 1.2 + pulse(t, 22.62, 22.74, 0.02, 0.05) * 1.2;
    if (t > 127.6) cl = 1;
    c.car.userData.lights.groups[4] = cl;
    U.uCarLights.value = Math.min(1.3, cl);
    const drive = smoother(134.56, 139.5, t);
    c.car.position.z = CITY.carZ + drive * 7.0;
    U.uCar.value.z = c.car.position.z;
    // champagne
    const wine = sm(23.7, 24.4, t) * (t < 148.5 ? 1 : 1 - sm(148.5, 149.5, t));
    c.tower.userData.wine.material.uniforms.uAmt.value = wine;
    c.bub.groups[9] = wine * (t < 36 || t > 131.6 ? 1 : 1 - sm(36, 37, t));
    // telephone wire ring: gold races round from the front at "gold on the wire tonight"
    U.uWireP.value = t < 12.8 ? 0 : clamp01((t - 12.8) / 1.25);
    U.uWireAmt.value = sm(12.8, 13.0, t);
    if (t > 127.6) { U.uWireP.value = clamp01((t - 127.68) / 1.2); U.uWireAmt.value = 1; }
    // title sign
    U.uSignAmt.value = 1;
    // exits: routes (verse 1 + final chorus)
    const rg = c.routeMat.uniforms.uGroup.value;
    rg[1] = t < 33.3 ? 0 : 1 - sm(38.5, 40.5, t);
    rg[2] = t < 141.7 ? 0 : 1 - sm(148.4, 149.4, t);
    c.exits.groups[10] = t < 34.8 ? 0 : 1 - sm(38.5, 40.5, t);
    c.exits.groups[11] = t < 143.1 ? 0 : 1 - sm(148.4, 149.4, t);
    // city lights fade when the box closes
    U.uLit.value *= 1 - sm(148.6, 150.4, t);
  }

  beatAfter(t0, k) {
    const b = this.beats;
    let i = 0;
    while (i < b.length && b[i] < t0 - 0.05) i++;
    return b[Math.min(b.length - 1, i + k)] ?? t0 + k * 0.567;
  }

  // ---------------------------------------------------------------------------------------------
  // B / Y held or the song ended: the room closes from wherever it is, the show fades out
  onReturn(k, ctx) {
    if (!this.active) return;
    if (!this.retFrom) {
      const t = ctx.songT ?? 0;
      this.retFrom = { t, box: this.boxState(t) };
    }
    const r = this.retFrom;
    const t = r.t;
    this.apply(t, 1 - sm(0, 0.55, k), k);
    const e = k * k * (3 - 2 * k);
    const b = r.box;
    this.box.apply({ lid: b.lid * (1 - sm(0.35, 1, k)), front: b.front * (1 - e), right: b.right * (1 - e), back: b.back * (1 - e), left: b.left * (1 - e) });
    const open = b.lid > 0 || b.front > 0 || b.right > 0 || b.back > 0 || b.left > 0;
    this.worldRoot.visible = k < 0.6;
    this.sky.visible = open && k < 0.98;
    this.world.outside.group.visible = !open || k > 0.6;
    if (k >= 1) this.end();
  }

  end() {
    if (!this.built) return;
    this.active = false;
    this.root.visible = false;
    this.worldRoot.visible = true;
    this.box.reset();
    this.world.outside.group.visible = true;
    SU.uFade.value = 1;
    this.vault.end?.();
    this.retFrom = null;
  }
}

export default new CopperLine();
