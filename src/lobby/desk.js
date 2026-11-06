// Desk & MODEL 7 Spy Command Console:
// Wrap-around 3-wing IEYTD submarine/spy console with interactive 3D controls:
// - 12 individually pressable telephone keypad buttons ('tel-0'..'tel-11') + grabbable handset
// - Animated Sonar/Radar CRT scope with rotating sweep & pressable 'sonar-ping' button
// - 3 interactive missile toggle switches ('sw-0'..'sw-2') with flip guards & jewel lamps
// - Interactive brass Morse telegraph key ('morse-key') with signal lamp
// - Interactive banker lamp push-switch ('lamp-toggle')
// - 4 interactive rear vacuum-tube test buttons ('tube-0'..'tube-3') & animated dial gauges
// - MODEL 7 tape transport deck with 5 piano keys ('rew','play','ff','stop','eject') & rotatable 'deck-knob'
import * as THREE from 'three';
import { toon, paint, G, Batch, slab, xf, v3 } from '../gfx/shade.js';
import { vuFace, canvasTex, deckFascia, instructionCard } from '../gfx/textures.js';
import { PAL } from './room.js';
import { TAPE } from './cassette.js';

export const DESK = { w: 1.56, d: 0.78, y: 0.86, top: 0.055, z: -0.65 };
export const DECK_POS = new THREE.Vector3(-0.04, DESK.y, -0.71);
const WELL = { x: -0.075, z: -0.045, w: 0.118, d: 0.076, depth: 0.017 };
const BASE_H = 0.068;
export const KEY_NAMES = ['rew', 'play', 'ff', 'stop', 'eject'];

export function buildDesk() {
  const group = new THREE.Group();
  group.name = 'desk';
  const B = new Batch();
  const add = (geo, c, o = {}, m = null) => B.add(paint(geo, c, { ...o, m }));
  const { w: W, d: D, y: Y, top: T, z: Z } = DESK;

  // Interactive controls list (populated by sub-assemblies and registered into deck.keyAt)
  const extraKeys = [];
  const animItems = []; // functions(dt, t) called every frame

  // ---- Center Console Tabletop + Angled Left/Right Cockpit Wings (U-shaped IEYTD layout) ----
  add(slab(1.16, D, T, 0.025), PAL.walnut, { gloss: 0.42 }, xf([0, Y - T / 2 - 0.004, Z], [Math.PI / 2, 0, 0]));

  const wingW = 0.56, wingD = 0.68, wingYaw = 0.46;
  for (const sx of [-1, 1]) {
    const wx = sx * 0.66, wz = Z + 0.16;
    const wm = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(wx, 0, wz).multiply(new THREE.Matrix4().makeRotationY(-sx * wingYaw)).multiply(xf(p, r));
    add(slab(wingW, wingD, T, 0.025), PAL.walnut, { gloss: 0.42 }, wm([0, Y - T / 2 - 0.004, 0], [Math.PI / 2, 0, 0]));
    add(G.box(wingW + 0.01, 0.024, 0.018), PAL.brass, { gloss: 0.88 }, wm([0, Y - 0.018, wingD / 2 + 0.004]));
    add(G.box(0.018, 0.024, wingD + 0.01), PAL.brass, { gloss: 0.88 }, wm([sx * (wingW / 2 + 0.004), Y - 0.018, 0]));
    for (let i = -2; i <= 2; i++) {
      add(G.sphere(0.0045, 6, 6), 0xe8c872, { gloss: 0.9 }, wm([i * 0.1, Y - 0.018, wingD / 2 + 0.012]));
    }
  }

  // Front armored brass bumper rail across center section + rivet studs
  add(G.box(1.14, 0.026, 0.02), PAL.brass, { gloss: 0.88 }, xf([0, Y - 0.018, Z + D / 2 + 0.004]));
  for (let i = -5; i <= 5; i++) {
    add(G.sphere(0.0048, 6, 6), 0xe8c872, { gloss: 0.9 }, xf([i * 0.095, Y - 0.018, Z + D / 2 + 0.013]));
  }

  // Dark submarine-green tactical leather blotter mat (top surface flush at Y = 0.86)
  add(slab(0.92, 0.50, 0.006, 0.015), 0x122620, { gloss: 0.22 }, xf([0, Y - 0.003, Z + 0.04], [Math.PI / 2, 0, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    add(G.box(0.055, 0.005, 0.055), PAL.brass, { gloss: 0.88 }, xf([sx * 0.44, Y - 0.001, Z + 0.04 + sz * 0.23]));
  }

  // ---- Angled A-Frame Submarine Steel Struts, Hydraulic Rams & Safe Drawers ----
  for (const sx of [-1, 1]) {
    const px = sx * 0.58, pz = Z + 0.08;
    const pm = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(px, 0, pz).multiply(new THREE.Matrix4().makeRotationY(-sx * 0.25)).multiply(xf(p, r));
    add(G.box(0.085, 0.82, 0.11), PAL.steelDark, { gloss: 0.48 }, pm([0, 0.41, 0.12], [-0.18, 0, 0]));
    add(G.box(0.085, 0.82, 0.11), PAL.steelDark, { gloss: 0.48 }, pm([0, 0.41, -0.16], [0.16, 0, 0]));
    // Hydraulic shock piston with brass bleed valve
    add(G.cyl(0.028, 0.028, 0.48, 14), PAL.brass, { gloss: 0.82 }, pm([0, 0.26, -0.02]));
    add(G.cyl(0.018, 0.018, 0.42, 12), PAL.steelLight, { gloss: 0.88 }, pm([0, 0.56, -0.02]));
    add(G.torus(0.032, 0.006, 6, 14), PAL.steelDark, { gloss: 0.6 }, pm([0, 0.48, -0.02], [Math.PI / 2, 0, 0]));
    add(G.box(0.14, 0.038, 0.54), PAL.steel, { gloss: 0.55 }, pm([0, 0.019, -0.02]));
    add(G.box(0.15, 0.012, 0.55), PAL.hazard, { gloss: 0.5 }, pm([0, 0.04, -0.02]));

    // Under-wing 'TOP SECRET' safe box with combination dial & chrome T-handle
    add(slab(0.32, 0.22, 0.36, 0.015), PAL.steelDark, { gloss: 0.48 }, pm([sx * 0.06, Y - 0.18, 0.06]));
    add(G.box(0.28, 0.18, 0.015), PAL.walnutLight, { gloss: 0.52 }, pm([sx * 0.06, Y - 0.18, 0.242]));
    add(G.cyl(0.028, 0.030, 0.016, 18), PAL.brass, { gloss: 0.9 }, pm([sx * 0.02, Y - 0.18, 0.252], [Math.PI / 2, 0, 0]));
    add(G.cyl(0.016, 0.016, 0.022, 14), PAL.ink, { gloss: 0.6 }, pm([sx * 0.02, Y - 0.18, 0.258], [Math.PI / 2, 0, 0]));
    add(G.box(0.014, 0.065, 0.018), PAL.steelLight, { gloss: 0.88 }, pm([sx * 0.12, Y - 0.18, 0.255]));
  }

  // Under-desk Vacuum-Tube Power Core & Reactor Coil Manifold
  add(slab(0.68, 0.32, 0.18, 0.02), PAL.steelDark, { gloss: 0.45 }, xf([0, Y - 0.26, Z - 0.18]));
  add(G.box(0.62, 0.24, 0.016), PAL.ink, {}, xf([0, Y - 0.26, Z - 0.088]));
  for (const tx of [-0.18, -0.06, 0.06, 0.18]) {
    add(G.cyl(0.024, 0.024, 0.18, 12), PAL.brass, { gloss: 0.82 }, xf([tx, Y - 0.26, Z - 0.12], [Math.PI / 2, 0, 0]));
    add(G.cyl(0.018, 0.018, 0.09, 12), 0xff9a36, { glow: 1.5, gloss: 0.7 }, xf([tx, Y - 0.26, Z - 0.11], [Math.PI / 2, 0, 0]));
  }

  // ---- Left Cockpit Wing: Hooded Sonar/Radar Scope, 'PING' Button, 3 Toggle Switches & Cassette Tower ----
  const lm = new THREE.Matrix4().makeTranslation(-0.67, Y, Z + 0.14).multiply(new THREE.Matrix4().makeRotationY(0.46));
  const cabM = lm.clone().multiply(xf([0.02, 0.068, -0.04], [-0.42, 0, 0]));
  {
    // Angled instrument console housing with bolted brass faceplate trim & side handles
    add(slab(0.38, 0.23, 0.14, 0.016), PAL.steelDark, { gloss: 0.48 }, cabM);
    add(G.box(0.38, 0.012, 0.145), PAL.brass, { gloss: 0.88 }, cabM.clone().multiply(xf([0, 0.112, 0])));
    add(G.box(0.36, 0.19, 0.006), 0x161c24, { gloss: 0.4 }, cabM.clone().multiply(xf([0, 0, 0.070])));
    for (const bx of [-0.165, 0.165]) for (const by of [-0.08, 0.08]) {
      add(G.cyl(0.004, 0.004, 0.008, 6), PAL.brass, { gloss: 0.9 }, cabM.clone().multiply(xf([bx, by, 0.072], [Math.PI / 2, 0, 0])));
    }

    // Circular Hooded Green Sonar / Radar Scope static bezel & range rings
    const scopeM = cabM.clone().multiply(xf([-0.085, 0.014, 0.072]));
    add(G.cyl(0.058, 0.062, 0.028, 28), PAL.brass, { gloss: 0.9 }, scopeM.clone().multiply(xf([0, 0, 0], [Math.PI / 2, 0, 0])));
    // 8 perimeter hex bolts on the sonar bezel
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(G.cyl(0.003, 0.003, 0.006, 6), 0x181c22, { gloss: 0.7 }, scopeM.clone().multiply(xf([Math.cos(a) * 0.054, Math.sin(a) * 0.054, 0.015], [Math.PI / 2, 0, 0])));
    }
    add(G.circle(0.050, 28), 0x061c14, {}, scopeM.clone().multiply(xf([0, 0, 0.015])));
    add(G.ring(0.018, 0.020, 28), 0x28b868, { glow: 1.4 }, scopeM.clone().multiply(xf([0, 0, 0.016])));
    add(G.ring(0.036, 0.0385, 28), 0x28b868, { glow: 1.4 }, scopeM.clone().multiply(xf([0, 0, 0.016])));
    // Crosshair lines on sonar glass
    add(G.box(0.092, 0.0012, 0.0005), 0x1e884e, { glow: 1.2 }, scopeM.clone().multiply(xf([0, 0, 0.0162])));
    add(G.box(0.0012, 0.092, 0.0005), 0x1e884e, { glow: 1.2 }, scopeM.clone().multiply(xf([0, 0, 0.0162])));

    // Brass collar for the interactive Sonar 'PING' button below the scope
    add(G.cyl(0.013, 0.015, 0.010, 16), PAL.brass, { gloss: 0.9 }, cabM.clone().multiply(xf([-0.085, -0.068, 0.074], [Math.PI / 2, 0, 0])));

    // Static bases & threaded hex bushings for the 3 interactive Toggle Switches
    for (let i = 0; i < 3; i++) {
      const sx = 0.032 + i * 0.046;
      const swM = cabM.clone().multiply(xf([sx, 0.008, 0.072]));
      add(G.cyl(0.009, 0.010, 0.010, 6), PAL.brass, { gloss: 0.9 }, swM.clone().multiply(xf([0, -0.002, 0.004], [Math.PI / 2, 0, 0])));
      add(G.box(0.028, 0.010, 0.004), PAL.brass, { gloss: 0.85 }, swM.clone().multiply(xf([0, -0.056, 0.002])));
      add(G.cyl(0.008, 0.009, 0.006, 12), PAL.steelDark, { gloss: 0.6 }, swM.clone().multiply(xf([0, -0.034, 0.003], [Math.PI / 2, 0, 0])));
    }

    // Vertical Brass & Steel Cassette Dispenser Clip on outer-left wing (holding 4 spare cassettes)
    const cx = -0.19, cz = 0.23;
    const rackM = lm.clone().multiply(xf([cx, 0, cz], [0, 0.22, 0]));
    add(G.cyl(0.068, 0.076, 0.016, 18), PAL.brass, { gloss: 0.85 }, rackM.clone().multiply(xf([0, 0.008, 0])));
    add(G.box(0.024, 0.18, 0.024), PAL.steelDark, { gloss: 0.5 }, rackM.clone().multiply(xf([0, 0.095, -0.035])));
    const spCols = [0xb3121b, 0xd99b26, 0x287868, 0xc85828];
    for (let i = 0; i < 4; i++) {
      const ty = 0.032 + i * 0.036;
      add(G.box(TAPE.w + 0.01, 0.005, 0.028), PAL.brass, { gloss: 0.85 }, rackM.clone().multiply(xf([0, ty - 0.012, -0.015])));
      const cm = rackM.clone().multiply(xf([0, ty, 0.012], [-Math.PI / 2 + 0.15, 0, 0]));
      add(slab(TAPE.w, TAPE.h, TAPE.t, 0.004), 0x161920, { gloss: 0.45 }, cm);
      add(G.box(TAPE.w - 0.012, 0.004, TAPE.t - 0.002), spCols[i], { gloss: 0.5 }, cm.clone().multiply(xf([0, TAPE.h / 2 + 0.001, 0])));
      add(G.box(TAPE.w - 0.018, TAPE.h * 0.5, 0.002), 0xe6dac0, {}, cm.clone().multiply(xf([0, 0.004, TAPE.t / 2 + 0.001])));
    }
  }

  // ---- Right Cockpit Wing: Detailed Morse Telegraph Cipher Key base & binding posts ----
  const rm = new THREE.Matrix4().makeTranslation(0.66, Y, Z + 0.22).multiply(new THREE.Matrix4().makeRotationY(-0.46));
  const morseBaseM = rm.clone().multiply(xf([0.04, 0, 0.06]));
  {
    add(slab(0.10, 0.145, 0.014, 0.012), PAL.steelDark, { gloss: 0.52 }, morseBaseM.clone().multiply(xf([0, 0.007, 0], [Math.PI / 2, 0, 0])));
    add(G.box(0.088, 0.004, 0.132), PAL.brass, { gloss: 0.88 }, morseBaseM.clone().multiply(xf([0, 0.014, 0])));
    // Pivot trunnion posts, contact anvil & twin binding posts
    for (const sx of [-0.018, 0.018]) {
      add(G.cyl(0.006, 0.007, 0.022, 12), PAL.brass, { gloss: 0.9 }, morseBaseM.clone().multiply(xf([sx, 0.024, -0.022])));
      add(G.cyl(0.005, 0.005, 0.016, 10), PAL.brass, { gloss: 0.9 }, morseBaseM.clone().multiply(xf([sx * 1.5, 0.022, -0.052])));
    }
    add(G.cyl(0.008, 0.010, 0.010, 12), PAL.brass, { gloss: 0.9 }, morseBaseM.clone().multiply(xf([0, 0.019, 0.026])));
    add(G.cyl(0.009, 0.010, 0.008, 12), PAL.steelDark, { gloss: 0.6 }, morseBaseM.clone().multiply(xf([-0.028, 0.018, 0.012])));
  }

  // ---- Rear Console Telemetry Bridge, Vacuum Tube Sockets, Dial Gauges & Patch Cords ----
  const bz = Z - D / 2 + 0.055;
  const rearTubeX = [-0.32, -0.22, 0.24, 0.34];
  const rearGaugeX = [-0.11, 0, 0.11];
  {
    add(slab(1.12, 0.092, 0.102, 0.014), PAL.steelDark, { gloss: 0.48 }, xf([0, Y + 0.045, bz]));
    add(G.box(1.08, 0.010, 0.106), PAL.brass, { gloss: 0.88 }, xf([0, Y + 0.091, bz]));
    for (const tx of rearTubeX) {
      // Ceramic & brass tube socket + protective wire cage ring + front test-button collar
      add(G.cyl(0.015, 0.017, 0.014, 14), PAL.brass, { gloss: 0.88 }, xf([tx, Y + 0.098, bz]));
      add(G.torus(0.015, 0.002, 6, 14), PAL.brass, { gloss: 0.88 }, xf([tx, Y + 0.118, bz], [Math.PI / 2, 0, 0]));
      add(G.cyl(0.010, 0.011, 0.008, 12), PAL.brass, { gloss: 0.88 }, xf([tx, Y + 0.045, bz + 0.050], [Math.PI / 2, 0, 0]));
    }
    for (const gx of rearGaugeX) {
      add(G.cyl(0.026, 0.026, 0.014, 18), PAL.brass, { gloss: 0.88 }, xf([gx, Y + 0.050, bz + 0.048], [Math.PI / 2, 0, 0]));
      add(G.circle(0.021, 18), 0xefe2c4, { glow: 0.35 }, xf([gx, Y + 0.050, bz + 0.056]));
      add(G.sphere(0.005, 8, 6), gx === 0 ? PAL.red : PAL.ledGreen, { glow: 1.6 }, xf([gx + 0.036, Y + 0.050, bz + 0.050]));
    }
    // Patch cords looping from the rear telemetry bridge into the back of the MODEL 7 deck
    for (const [px, colCord] of [[-0.14, 0x101419], [0.06, 0x8a1e1c], [0.16, 0xb87624]]) {
      const pc = new THREE.CatmullRomCurve3([
        v3(px, Y + 0.045, bz + 0.04),
        v3(px + 0.02, Y + 0.095, bz + 0.09),
        v3(px - 0.01, Y + 0.035, Z - 0.18),
      ]);
      add(new THREE.TubeGeometry(pc, 12, 0.0055, 7, false), colCord, { gloss: 0.55 });
    }
  }

  // ---- Detailed Green-Enamel Brass Spy Banker Lamp (left rear of console) ----
  const lampPos = [-0.46, Y, -0.82];
  const lampSwitchLocal = [0, 0.024, 0.052];
  {
    const m = (p, r = [0, 0, 0]) => new THREE.Matrix4().makeTranslation(...lampPos).multiply(xf(p, r));
    // Stepped fluted brass & cast-iron base + switch collar
    add(G.cyl(0.075, 0.086, 0.018, 24), PAL.brass, { gloss: 0.88 }, m([0, 0.009, 0]));
    add(G.cyl(0.058, 0.068, 0.016, 20), PAL.steelDark, { gloss: 0.55 }, m([0, 0.024, 0]));
    add(G.cyl(0.011, 0.012, 0.008, 12), PAL.brass, { gloss: 0.9 }, m(lampSwitchLocal));
    // Twin tubular brass uprights + central decorative finial
    for (const sx of [-0.018, 0.018]) {
      add(G.cyl(0.006, 0.006, 0.34, 10), PAL.brass, { gloss: 0.9 }, m([sx, 0.19, -0.02], [0.15, 0, 0]));
    }
    add(G.sphere(0.014, 12, 8), PAL.brass, { gloss: 0.9 }, m([0, 0.18, -0.02]));
    add(G.cyl(0.018, 0.018, 0.06, 14), PAL.brass, { gloss: 0.9 }, m([0, 0.36, -0.045], [0, 0, Math.PI / 2]));
    add(G.cyl(0.006, 0.006, 0.16, 10), PAL.brass, { gloss: 0.9 }, m([0, 0.40, 0.01], [-0.95, 0, 0]));
    // Beaded brass pull-chain hanging under the shade
    for (let k = 0; k < 7; k++) {
      add(G.sphere(0.003, 6, 6), PAL.brass, { gloss: 0.9 }, m([0.032, 0.36 - k * 0.011, 0.045]));
    }
    add(G.cyl(0.005, 0.003, 0.014, 8), PAL.brass, { gloss: 0.9 }, m([0.032, 0.278, 0.045]));
    // Classic green-enamel cased-glass banker shade with brass side knuckles
    add(G.cone(0.115, 0.105, 24, true), 0x164e36, { gloss: 0.72 }, m([0, 0.39, 0.06], [0.24, 0, 0]));
    add(G.torus(0.115, 0.005, 8, 24), PAL.brass, { gloss: 0.9 }, m([0, 0.34, 0.072], [Math.PI / 2 + 0.24, 0, 0]));
  }

  // ---- Red Secure Hotline Telephone Chassis (12 keys + handset are interactive meshes below!) ----
  const phonePos = [-0.35, Y, -0.68];
  const phoneYaw = 0.28;
  const phoneM = new THREE.Matrix4().makeTranslation(...phonePos).multiply(new THREE.Matrix4().makeRotationY(phoneYaw));
  const faceM = phoneM.clone().multiply(xf([0, 0.068, 0.028], [0.48, 0, 0]));
  {
    const pm = (p, r = [0, 0, 0]) => phoneM.clone().multiply(xf(p, r));
    const red = 0xb8221e, darkRed = 0x7e1412, chrome = 0xd8dfe6;
    // Brass base tray + sculpted multi-tier red bakelite body
    add(slab(0.205, 0.235, 0.010, 0.018), PAL.brass, { gloss: 0.85 }, pm([0, 0.005, 0], [Math.PI / 2, 0, 0]));
    add(slab(0.19, 0.22, 0.056, 0.022), red, { gloss: 0.62 }, pm([0, 0.032, 0], [Math.PI / 2, 0, 0]));
    add(slab(0.165, 0.145, 0.052, 0.018), red, { gloss: 0.62 }, pm([0, 0.068, 0.028], [Math.PI / 2 + 0.48, 0, 0]));
    add(slab(0.16, 0.095, 0.048, 0.014), darkRed, { gloss: 0.58 }, pm([0, 0.076, -0.052], [Math.PI / 2, 0, 0]));
    // Recessed dark steel keypad bezel + chrome trim frame on the sloped face
    add(G.box(0.118, 0.008, 0.094), PAL.brass, { gloss: 0.88 }, faceM.clone().multiply(xf([0, 0.024, 0])));
    add(G.box(0.110, 0.010, 0.086), 0x12151a, { gloss: 0.35 }, faceM.clone().multiply(xf([0, 0.025, 0])));
    // Brass classification plate ('HOTLINE // RED-1') above keypad
    add(G.box(0.078, 0.006, 0.016), PAL.brass, { gloss: 0.9 }, faceM.clone().multiply(xf([-0.016, 0.026, -0.056])));
    // Chrome cradle forks
    for (const sx of [-0.052, 0.052]) {
      add(G.box(0.018, 0.030, 0.026), chrome, { gloss: 0.9 }, pm([sx, 0.104, -0.052]));
      add(G.box(0.026, 0.008, 0.036), chrome, { gloss: 0.9 }, pm([sx, 0.120, -0.052]));
    }
    // Multi-loop coiled telephone cord from handset side to rear of console
    const cordPts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const a = u * Math.PI * 10;
      cordPts.push(v3(
        phonePos[0] + 0.09 + u * 0.15 + Math.sin(a) * 0.008,
        Y + 0.016 + (1 - Math.abs(u - 0.4) * 1.4) * 0.028 + Math.cos(a) * 0.008,
        phonePos[2] - 0.04 - u * 0.10
      ));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 36, 0.0045, 6, false), 0x12141a, { gloss: 0.45 });
  }

  const deskMesh = B.build(toon());
  group.add(deskMesh);

  // =============================================================================================
  // Animated & Interactive 3D Meshes on the Console
  // =============================================================================================

  // 1. Animated Sonar Sweep Arm, Pulse Ring, Blips & Interactive 'sonar-ping' Push-Button
  const scopeOrigin = cabM.clone().multiply(xf([-0.085, 0.014, 0.089]));
  const sonarGroup = new THREE.Group();
  scopeOrigin.decompose(sonarGroup.position, sonarGroup.quaternion, sonarGroup.scale);
  group.add(sonarGroup);

  const sonarSweep = new THREE.Group();
  {
    const sb = new Batch();
    sb.add(paint(G.box(0.045, 0.0028, 0.0008), 0x78ffb8, { glow: 2.2, m: xf([0.022, 0, 0]) }));
    sb.add(paint(G.sphere(0.0045, 8, 6), 0x98ffd0, { glow: 2.2, m: xf([0, 0, 0.0005]) }));
    sonarSweep.add(sb.build(toon({ sweep: 0 })));
  }
  sonarGroup.add(sonarSweep);

  const sonarPulseMat = new THREE.MeshBasicMaterial({ color: 0x58ff9a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const sonarPulseRing = new THREE.Mesh(G.ring(0.040, 0.046, 28), sonarPulseMat);
  sonarPulseRing.position.z = 0.001;
  sonarGroup.add(sonarPulseRing);

  const sonarBlip1 = new THREE.Mesh(paint(G.sphere(0.0045, 8, 6), 0xff4030, { glow: 2.2 }), toon({ sweep: 0 }));
  sonarBlip1.position.set(0.020, 0.016, 0.001);
  const sonarBlip2 = new THREE.Mesh(paint(G.sphere(0.0038, 8, 6), 0xffaa2a, { glow: 2.0 }), toon({ sweep: 0 }));
  sonarBlip2.position.set(-0.024, -0.014, 0.001);
  sonarGroup.add(sonarBlip1, sonarBlip2);

  const pingBtnMat = cabM.clone().multiply(xf([-0.085, -0.068, 0.080], [Math.PI / 2, 0, 0]));
  const pingBtn = new THREE.Mesh(paint(G.cyl(0.0095, 0.0095, 0.012, 16), 0xd82c24, { gloss: 0.8, glow: 0.45 }), toon({ sweep: 0 }));
  pingBtnMat.decompose(pingBtn.position, pingBtn.quaternion, pingBtn.scale);
  pingBtn.userData.rest = pingBtn.position.clone();
  pingBtn.userData.normal = new THREE.Vector3(0, 0, 1).applyQuaternion(cabM. any ? new THREE.Quaternion() : new THREE.Quaternion().setFromRotationMatrix(cabM));
  group.add(pingBtn);
  const pingLocal = new THREE.Vector3(-0.085, -0.068, 0.082).applyMatrix4(cabM);
  extraKeys.push({ name: 'sonar-ping', parent: group, center: pingLocal, half: v3(0.022, 0.022, 0.022) });

  // 2. Three Interactive Missile Toggle Switches ('sw-0', 'sw-1', 'sw-2') on Left Wing
  const switches = [0, 1, 2].map((i) => {
    const sx = 0.032 + i * 0.046;
    const swM = cabM.clone().multiply(xf([sx, 0.008, 0.074]));
    const swGroup = new THREE.Group();
    swM.decompose(swGroup.position, swGroup.quaternion, swGroup.scale);
    group.add(swGroup);

    // Hinged red safety flip-guard
    const guard = new THREE.Group();
    guard.position.set(0, 0.036, 0.003);
    const gb = new Batch();
    gb.add(paint(G.box(0.025, 0.036, 0.018), 0xd43028, { gloss: 0.78, glow: 0.35, m: xf([0, -0.015, 0.008]) }));
    gb.add(paint(G.box(0.019, 0.030, 0.014), 0x161920, { m: xf([0, -0.017, 0.005]) }));
    guard.add(gb.build(toon()));
    swGroup.add(guard);

    // Chrome toggle bat lever
    const lever = new THREE.Group();
    lever.position.set(0, -0.002, 0.005);
    const lb = new Batch();
    lb.add(paint(G.cyl(0.0038, 0.0025, 0.028, 10), 0xe4ebf2, { gloss: 0.92, m: xf([0, 0, 0.014], [Math.PI / 2, 0, 0]) }));
    lb.add(paint(G.sphere(0.0048, 10, 8), 0xe4ebf2, { gloss: 0.92, m: xf([0, 0, 0.028]) }));
    lever.add(lb.build(toon()));
    lever.rotation.x = -0.48;
    swGroup.add(lever);

    // Glowing jewel indicator lamp below switch
    const lampCol = i === 0 ? PAL.ledGreen : i === 1 ? PAL.ledAmber : 0x38b8ff;
    const swLamp = new THREE.Mesh(paint(G.sphere(0.007, 10, 8), lampCol, { glow: 1.85, gloss: 0.85 }), toon({ sweep: 0 }));
    swLamp.position.set(0, -0.034, 0.006);
    swGroup.add(swLamp);

    const wp = new THREE.Vector3(0, 0, 0.012).applyMatrix4(swM);
    extraKeys.push({ name: `sw-${i}`, parent: group, center: wp, half: v3(0.022, 0.042, 0.025) });
    return { on: false, v: 0, guard, lever, lamp: swLamp };
  });

  // 3. Twelve Individually Pressable Telephone Keypad Buttons ('tel-0'..'tel-11') + Hook Button & Handset
  const telKeys = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const kx = (c - 1) * 0.031;
      const kz = (r - 1.5) * 0.019;
      const km = faceM.clone().multiply(xf([kx, 0.030, kz]));
      const kb = new Batch();
      kb.add(paint(G.box(0.022, 0.007, 0.014), 0xc8d0d8, { gloss: 0.85, m: xf([0, -0.001, 0]) }));
      kb.add(paint(G.box(0.019, 0.008, 0.0115), 0xf2e6cc, { gloss: 0.55, m: xf([0, 0.0015, 0]) }));
      kb.add(paint(G.box(0.009, 0.002, 0.0025), 0x1c2026, { m: xf([0, 0.0058, 0]) }));
      const kMesh = kb.build(toon());
      km.decompose(kMesh.position, kMesh.quaternion, kMesh.scale);
      kMesh.userData.rest = kMesh.position.clone();
      kMesh.userData.dir = new THREE.Vector3(0, -1, 0).applyQuaternion(kMesh.quaternion);
      group.add(kMesh);

      extraKeys.push({ name: `tel-${idx}`, parent: group, center: kMesh.position.clone(), half: v3(0.015, 0.016, 0.014) });
      telKeys.push({ mesh: kMesh, down: 0, t: 0 });
    }
  }

  // Flashing red neon incoming-call dome lamp on the telephone faceplate
  const telLampM = faceM.clone().multiply(xf([0.042, 0.030, -0.056]));
  const telLamp = new THREE.Mesh(paint(G.sphere(0.0065, 10, 8), 0xff2a1e, { glow: 1.9, gloss: 0.85 }), toon({ sweep: 0 }));
  telLampM.decompose(telLamp.position, telLamp.quaternion, telLamp.scale);
  telLamp.material.uniforms.uTint.value.setScalar(0.45);
  group.add(telLamp);

  // Chrome cradle plunger bar ('tel-hook')
  const hookM = phoneM.clone().multiply(xf([0, 0.106, -0.052]));
  const telHook = new THREE.Mesh(paint(G.box(0.088, 0.012, 0.012), 0xd8dfe6, { gloss: 0.9 }), toon());
  hookM.decompose(telHook.position, telHook.quaternion, telHook.scale);
  telHook.userData.restY = telHook.position.y;
  group.add(telHook);
  extraKeys.push({ name: 'tel-hook', parent: group, center: telHook.position.clone(), half: v3(0.045, 0.022, 0.022) });

  // Sculpted Red Telephone Handset (grabbable item AND lifts when hook pressed!)
  const handsetGroup = new THREE.Group();
  handsetGroup.name = 'hotline-handset';
  const hsPoseM = phoneM.clone().multiply(xf([0, 0.128, -0.052]));
  hsPoseM.decompose(handsetGroup.position, handsetGroup.quaternion, handsetGroup.scale);
  {
    const hb = new Batch();
    const red = 0xb8221e, darkRed = 0x7e1412, chrome = 0xd8dfe6;
    hb.add(paint(slab(0.215, 0.036, 0.032, 0.014), red, { gloss: 0.72, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
    hb.add(paint(G.box(0.11, 0.008, 0.022), chrome, { gloss: 0.9, m: xf([0, 0.016, 0]) }));
    for (const sx of [-0.082, 0.082]) {
      hb.add(paint(G.cyl(0.032, 0.026, 0.034, 20), red, { gloss: 0.68, m: xf([sx, -0.018, 0]) }));
      hb.add(paint(G.cyl(0.029, 0.032, 0.012, 20), darkRed, { gloss: 0.6, m: xf([sx, -0.038, 0]) }));
      hb.add(paint(G.torus(0.028, 0.0025, 6, 18), chrome, { gloss: 0.9, m: xf([sx, -0.033, 0], [Math.PI / 2, 0, 0]) }));
    }
    thisHandsetMat: hb;
    handsetGroup.add(hb.build(toon()));
  }

  // 4. Interactive Brass Morse Telegraph Key Lever ('morse-key') & Signal Lamp on Right Wing
  const morsePivotM = morseBaseM.clone().multiply(xf([0, 0.028, -0.022]));
  const morseLever = new THREE.Group();
  morsePivotM.decompose(morseLever.position, morseLever.quaternion, morseLever.scale);
  {
    const mb = new Batch();
    mb.add(paint(G.box(0.012, 0.008, 0.095), PAL.brass, { gloss: 0.92, m: xf([0, 0, 0.032], [0.06, 0, 0]) }));
    mb.add(paint(G.cyl(0.008, 0.008, 0.038, 12), PAL.brass, { gloss: 0.92, m: xf([0, 0, 0], [0, 0, Math.PI / 2]) }));
    mb.add(paint(G.cyl(0.006, 0.006, 0.018, 10), PAL.brass, { gloss: 0.9, m: xf([0, 0.010, 0.015]) }));
    // Classic flat-skirted black bakelite telegraph operator knob
    mb.add(paint(G.cyl(0.022, 0.024, 0.006, 18), PAL.ink, { gloss: 0.65, m: xf([0, 0.006, 0.068]) }));
    mb.add(paint(G.cyl(0.015, 0.012, 0.012, 16), PAL.ink, { gloss: 0.72, m: xf([0, 0.014, 0.068]) }));
    mb.add(paint(G.sphere(0.004, 8, 6), PAL.brass, { gloss: 0.9, m: xf([0, 0.020, 0.068]) }));
    morseLever.add(mb.build(toon()));
  }
  group.add(morseLever);

  const morseLampM = morseBaseM.clone().multiply(xf([-0.028, 0.025, 0.012]));
  const morseLamp = new THREE.Mesh(paint(G.sphere(0.0065, 10, 8), PAL.ledAmber, { glow: 1.9, gloss: 0.85 }), toon({ sweep: 0 }));
  morseLampM.decompose(morseLamp.position, morseLamp.quaternion, morseLamp.scale);
  morseLamp.material.uniforms.uTint.value.setScalar(0.35);
  group.add(morseLamp);

  const morseKnobWorld = new THREE.Vector3(0, 0.035, 0.048).applyMatrix4(morseBaseM);
  extraKeys.push({ name: 'morse-key', parent: group, center: morseKnobWorld, half: v3(0.032, 0.028, 0.038) });

  // 5. Interactive Banker Lamp Push-Switch ('lamp-toggle') & Glowing Bulb
  const lampBulb = new THREE.Mesh(paint(G.plane(0.18, 0.07), 0xffe4a0, { glow: 1.95 }), toon({ sweep: 0 }));
  const bulbM = new THREE.Matrix4().makeTranslation(...lampPos).multiply(xf([0, 0.35, 0.068], [Math.PI / 2 + 0.24, 0, 0]));
  bulbM.decompose(lampBulb.position, lampBulb.quaternion, lampBulb.scale);
  group.add(lampBulb);

  const lampBtn = new THREE.Mesh(paint(G.cyl(0.0075, 0.0075, 0.014, 14), 0xd42c24, { gloss: 0.8, glow: 0.3 }), toon({ sweep: 0 }));
  lampBtn.position.set(lampPos[0] + lampSwitchLocal[0], lampPos[1] + lampSwitchLocal[1] + 0.006, lampPos[2] + lampSwitchLocal[2]);
  lampBtn.userData.restY = lampBtn.position.y;
  group.add(lampBtn);
  extraKeys.push({ name: 'lamp-toggle', parent: group, center: lampBtn.position.clone(), half: v3(0.024, 0.024, 0.024) });

  // 6. Four Interactive Rear Telemetry Tube Test Buttons ('tube-0'..'tube-3'), Glowing Tubes & Gauge Needles
  const rearTubes = rearTubeX.map((tx, i) => {
    const tb = new Batch();
    tb.add(paint(G.cyl(0.010, 0.010, 0.038, 12), 0xff9a36, { glow: 1.85, gloss: 0.8, m: xf([0, 0.118, 0]) }));
    tb.add(paint(G.sphere(0.010, 10, 8), 0xff9a36, { glow: 1.85, m: xf([0, 0.137, 0]) }));
    const tMesh = tb.build(toon({ sweep: 0 }));
    tMesh.position.set(tx, Y, bz);
    group.add(tMesh);

    const btn = new THREE.Mesh(paint(G.cyl(0.007, 0.007, 0.010, 12), i % 2 === 0 ? 0xd42c24 : 0xd99b26, { gloss: 0.8, glow: 0.4 }), toon({ sweep: 0 }));
    btn.position.set(tx, Y + 0.045, bz + 0.055);
    btn.rotation.x = Math.PI / 2;
    btn.userData.restZ = btn.position.z;
    group.add(btn);

    extraKeys.push({ name: `tube-${i}`, parent: group, center: btn.position.clone(), half: v3(0.020, 0.022, 0.022) });
    return { tube: tMesh, btn, boost: 0, down: 0 };
  });

  const rearNeedles = rearGaugeX.map((gx, i) => {
    const ng = new THREE.Group();
    ng.position.set(gx, Y + 0.050, bz + 0.058);
    ng.add(new THREE.Mesh(paint(G.box(0.002, 0.016, 0.001), 0xc82822, { m: xf([0, 0.006, 0]) }), toon({ sweep: 0 })));
    ng.rotation.z = -0.4 + i * 0.4;
    group.add(ng);
    return ng;
  });

  // Instruction card on the left of the blotter mat (raised 4.5 mm above Y = 0.86 + polygonOffset)
  const card = new THREE.Mesh(paint(G.plane(0.16, 0.215), 0xffffff), toon({ map: instructionCard(), polygonOffset: true }));
  card.position.set(-0.31, Y + 0.0045, -0.42);
  card.rotation.set(-Math.PI / 2, 0, 0.16);
  card.name = 'card';
  group.add(card);

  // State of interactive console gadgets
  const state = {
    pingBoost: 0,
    morseDown: 0, morseT: 0,
    telRingT: 0, hookUp: 0, hookLatch: false,
    lampOn: true, lampBtnDown: 0, lampBtnT: 0,
  };

  function pressExtra(name) {
    if (name === 'sonar-ping') {
      state.pingBoost = 1.0;
      return true;
    }
    if (name.startsWith('sw-')) {
      const idx = Number(name.slice(3));
      const sw = switches[idx];
      if (sw) { sw.on = !sw.on; return sw.on; }
    }
    if (name.startsWith('tel-')) {
      if (name === 'tel-hook') {
        state.hookLatch = !state.hookLatch;
        state.telRingT = 0.6;
        return state.hookLatch;
      }
      const idx = Number(name.slice(4));
      if (telKeys[idx]) {
        telKeys[idx].t = 0.18;
        state.telRingT = 0.45;
        return idx;
      }
    }
    if (name === 'morse-key') {
      state.morseT = 0.18;
      return true;
    }
    if (name === 'lamp-toggle') {
      state.lampOn = !state.lampOn;
      state.lampBtnT = 0.18;
      return state.lampOn;
    }
    if (name.startsWith('tube-')) {
      const idx = Number(name.slice(5));
      if (rearTubes[idx]) {
        rearTubes[idx].boost = 1.0;
        return idx;
      }
    }
    return null;
  }

  animItems.push((dt, t, levels) => {
    const ease = (c, tgt, r) => c + (tgt - c) * (1 - Math.exp(-dt * r));
    // Sonar scope rotation + ping pulse
    state.pingBoost = Math.max(0, state.pingBoost - dt * 0.55);
    sonarSweep.rotation.z -= dt * (1.8 + state.pingBoost * 5.2);
    const pulsePhase = 1 - state.pingBoost;
    sonarPulseRing.scale.setScalar(0.15 + pulsePhase * 0.95);
    sonarPulseMat.opacity = state.pingBoost * (1 - pulsePhase * 0.7);
    const pingDep = state.pingBoost > 0.75 ? 1 : 0;
    pingBtn.position.copy(pingBtn.userData.rest).addScaledVector(pingBtn.userData.normal, -pingDep * 0.0045);
    sonarBlip1.scale.setScalar(1 + 0.35 * Math.sin(t * 6) + state.pingBoost * 0.6);
    sonarBlip2.scale.setScalar(1 + 0.30 * Math.cos(t * 5) + state.pingBoost * 0.5);

    // 3 Toggle switches
    for (const sw of switches) {
      sw.v = ease(sw.v, sw.on ? 1 : 0, 22);
      sw.lever.rotation.x = -0.48 + sw.v * 0.96;
      sw.guard.rotation.x = -0.35 - sw.v * 1.05;
      sw.lamp.material.uniforms.uTint.value.setScalar(0.45 + sw.v * 1.35);
    }

    // 12 Telephone keypad buttons + lamp + hook
    for (const tk of telKeys) {
      if (tk.t > 0) tk.t = Math.max(0, tk.t - dt);
      tk.down = ease(tk.down, tk.t > 0 ? 1 : 0, 32);
      tk.mesh.position.copy(tk.mesh.userData.rest).addScaledVector(tk.mesh.userData.dir, tk.down * 0.0042);
    }
    if (state.telRingT > 0) state.telRingT = Math.max(0, state.telRingT - dt);
    telLamp.material.uniforms.uTint.value.setScalar(0.4 + (state.telRingT > 0 ? 1.8 * (0.5 + 0.5 * Math.sin(t * 38)) : 0));
    state.hookUp = ease(state.hookUp, state.hookLatch ? 1 : 0, 18);
    telHook.position.y = telHook.userData.restY + state.hookUp * 0.006;

    // Morse telegraph key
    if (state.morseT > 0) state.morseT = Math.max(0, state.morseT - dt);
    state.morseDown = ease(state.morseDown, state.morseT > 0 ? 1 : 0, 36);
    morseLever.rotation.x = state.morseDown * 0.14;
    morseLamp.material.uniforms.uTint.value.setScalar(0.35 + state.morseDown * 1.9);

    // Banker lamp button & bulb
    if (state.lampBtnT > 0) state.lampBtnT = Math.max(0, state.lampBtnT - dt);
    state.lampBtnDown = ease(state.lampBtnDown, state.lampBtnT > 0 ? 1 : 0, 30);
    lampBtn.position.y = lampBtn.userData.restY - state.lampBtnDown * 0.004;
    lampBulb.material.uniforms.uTint.value.setScalar(state.lampOn ? 1.0 : 0.08);

    // Rear telemetry tubes & analog gauges
    let tubeSum = 0;
    for (const [i, rt] of rearTubes.entries()) {
      rt.boost = Math.max(0, rt.boost - dt * 1.1);
      rt.down = ease(rt.down, rt.boost > 0.65 ? 1 : 0, 28);
      rt.btn.position.z = rt.btn.userData.restZ - rt.down * 0.004;
      const p = 1 + rt.boost * 1.6 + (levels ? levels.rms * 0.5 : 0);
      rt.tube.material.uniforms.uTint.value.setScalar(p);
      tubeSum += rt.boost * (i + 1) * 0.3;
    }
    for (const [i, rn] of rearNeedles.entries()) {
      const lv = levels ? (i === 0 ? levels.l : i === 1 ? levels.rms : levels.r) : 0;
      rn.rotation.z = 0.55 - (0.3 + i * 0.25 + lv * 0.9 + tubeSum * 0.5 + state.morseDown * 0.4);
    }
  });

  const deck = buildDeck(extraKeys, pressExtra, animItems, state);
  group.add(deck.group);

  // Grabbable handset item descriptor (can be added to Interact so player can pick up the phone!)
  group.updateMatrixWorld(true);
  const phoneHalf = v3(0.11, 0.035, 0.035);
  const phoneItem = {
    id: 'hotline-handset',
    group: handsetGroup,
    kind: 'phone',
    half: phoneHalf,
    resting: true,
    home: { p: handsetGroup.position.clone(), q: handsetGroup.quaternion.clone() },
    setHover() {},
    distanceTo(p) {
      const lp = handsetGroup.worldToLocal(p.clone());
      const q = v3(Math.abs(lp.x) - phoneHalf.x, Math.abs(lp.y) - phoneHalf.y, Math.abs(lp.z) - phoneHalf.z);
      return v3(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)).length() + Math.min(Math.max(q.x, q.y, q.z), 0);
    },
  };

  return { group, deskMesh, deck, card, handsetGroup, phoneItem, state };
}

// ---------------------------------------------------------------------------------------------
// MODEL 7 spy intercept deck
function buildDeck(extraKeys, pressExtra, animItems, consoleState) {
  const group = new THREE.Group();
  group.name = 'deck';
  group.position.copy(DECK_POS);
  const B = new Batch();
  const add = (geo, c, o = {}, m = null) => B.add(paint(geo, c, { ...o, m }));
  const alu = 0x9aa0a6, aluDark = 0x363e48;
  const W = 0.44, Dp = 0.3, H = BASE_H;

  // Heavy dark steel & brass side cheeks + front rack guard handles + cooling louvers
  for (const sx of [-1, 1]) {
    add(slab(Dp, H + 0.012, 0.02, 0.008), PAL.steelDark, { gloss: 0.52 }, xf([sx * (W / 2 - 0.01), (H + 0.012) / 2, 0], [0, Math.PI / 2, 0]));
    for (const bz of [-0.1, 0, 0.1]) for (const by of [0.02, 0.056]) {
      add(G.cyl(0.004, 0.004, 0.004, 6), PAL.brass, { gloss: 0.9 }, xf([sx * (W / 2 + 0.001), by, bz], [0, 0, Math.PI / 2]));
    }
    add(G.torus(0.016, 0.0038, 6, 14, Math.PI), PAL.brass, { gloss: 0.88 }, xf([sx * (W / 2 - 0.01), H * 0.5, Dp / 2 + 0.002], [0, Math.PI / 2, 0]));
  }
  // Body + top plate with the well hole (4 non-overlapping strips)
  add(G.box(W - 0.04, H - 0.004, Dp - 0.004), 0x16191f, {}, xf([0, (H - 0.004) / 2, 0]));
  const top = (x0, x1, z0, z1) => add(G.box(x1 - x0, 0.004, z1 - z0), alu, { gloss: 0.52 }, xf([(x0 + x1) / 2, H - 0.002, (z0 + z1) / 2]));
  const wx0 = WELL.x - WELL.w / 2, wx1 = WELL.x + WELL.w / 2, wz0 = WELL.z - WELL.d / 2, wz1 = WELL.z + WELL.d / 2;
  const X0 = -W / 2 + 0.02, X1 = W / 2 - 0.02, Z0 = -Dp / 2, Z1 = Dp / 2;
  top(X0, X1, Z0, wz0); top(X0, X1, wz1, Z1); top(X0, wx0, wz0, wz1); top(wx1, X1, wz0, wz1);

  // Corner hex bolts & mechanical tape counter window on the brushed aluminum deck plate
  for (const [bx, bz] of [[X0 + 0.015, Z0 + 0.015], [X1 - 0.015, Z0 + 0.015], [X0 + 0.015, Z1 - 0.015], [X1 - 0.015, Z1 - 0.015]]) {
    add(G.cyl(0.0035, 0.0035, 0.002, 6), PAL.brass, { gloss: 0.9 }, xf([bx, H + 0.001, bz]));
  }
  // 3-digit mechanical tape counter next to the well
  add(G.box(0.036, 0.005, 0.018), 0x12151a, { gloss: 0.5 }, xf([WELL.x - 0.088, H + 0.0025, WELL.z - 0.015]));
  for (let d = -1; d <= 1; d++) {
    add(G.box(0.008, 0.006, 0.012), 0xebe4d4, {}, xf([WELL.x - 0.088 + d * 0.0095, H + 0.0028, WELL.z - 0.015]));
  }
  add(G.cyl(0.0035, 0.0035, 0.006, 10), PAL.red, { gloss: 0.8 }, xf([WELL.x - 0.062, H + 0.003, WELL.z - 0.015]));

  // Well interior (non-overlapping floor and walls) + detailed magnetic head stack & guide rollers
  add(G.box(WELL.w - 0.004, 0.002, WELL.d - 0.004), 0x0b0d11, {}, xf([WELL.x, H - WELL.depth, WELL.z]));
  add(G.box(WELL.w, WELL.depth, 0.002), 0x161920, {}, xf([WELL.x, H - WELL.depth / 2, wz0 + 0.001]));
  add(G.box(WELL.w, WELL.depth, 0.002), 0x161920, {}, xf([WELL.x, H - WELL.depth / 2, wz1 - 0.001]));
  add(G.box(0.002, WELL.depth, WELL.d - 0.004), 0x161920, {}, xf([wx0 + 0.001, H - WELL.depth / 2, WELL.z]));
  add(G.box(0.002, WELL.depth, WELL.d - 0.004), 0x161920, {}, xf([wx1 - 0.001, H - WELL.depth / 2, WELL.z]));

  // Brass trim around the well
  for (const [x, z, w, d] of [[WELL.x, wz0 - 0.003, WELL.w + 0.012, 0.004], [WELL.x, wz1 + 0.003, WELL.w + 0.012, 0.004], [wx0 - 0.003, WELL.z, 0.004, WELL.d - 0.002], [wx1 + 0.003, WELL.z, 0.004, WELL.d - 0.002]]) {
    add(G.box(w, 0.003, d), PAL.brass, { gloss: 0.9 }, xf([x, H + 0.0015, z]));
  }
  // Erase / Record / Playback head stack + copper coil + pinch roller + capstan shaft
  add(G.box(0.032, 0.010, 0.009), 0xb8bec6, { gloss: 0.9 }, xf([WELL.x, H - WELL.depth + 0.006, wz1 - 0.008]));
  add(G.box(0.012, 0.011, 0.010), 0xa86428, { gloss: 0.85 }, xf([WELL.x - 0.022, H - WELL.depth + 0.006, wz1 - 0.008]));
  add(G.cyl(0.0055, 0.0055, 0.012, 12), 0x18171a, {}, xf([WELL.x + 0.03, H - WELL.depth + 0.007, wz1 - 0.008]));
  add(G.cyl(0.0018, 0.0018, 0.015, 8), 0xd8dfe6, { gloss: 0.95 }, xf([WELL.x + 0.03, H - WELL.depth + 0.008, wz1 - 0.015]));
  // Lid hinge bar
  add(G.cyl(0.004, 0.004, WELL.w + 0.01, 12), PAL.brass, { gloss: 0.9 }, xf([WELL.x, H + 0.004, wz0 - 0.006], [0, 0, Math.PI / 2]));

  // VU bezels (tilted toward the player; bezel front at z = 0.015, brass frame at z = 0.018)
  const vuTilt = -0.62;
  const vuPos = [[0.065, -0.045], [0.158, -0.045]];
  for (const [vx, vz] of vuPos) {
    add(slab(0.088, 0.056, 0.03, 0.006), 0x14171c, { gloss: 0.45 }, xf([vx, H + 0.012, vz], [vuTilt, 0, 0]));
    const vm = xf([vx, H + 0.012, vz], [vuTilt, 0, 0]);
    for (const [bx, by, bw, bh] of [[0, 0.0245, 0.082, 0.004], [0, -0.0245, 0.082, 0.004], [0.0395, 0, 0.004, 0.045], [-0.0395, 0, 0.004, 0.045]]) {
      add(G.box(bw, bh, 0.004), PAL.brass, { gloss: 0.88 }, vm.clone().multiply(xf([bx, by, 0.018])));
    }
  }
  // Gain knob scale ring on deck surface (the rotatable knob itself is a separate Group below!)
  add(G.ring(0.031, 0.036, 28), PAL.brass, { gloss: 0.85 }, xf([0.155, H + 0.0008, 0.075], [-Math.PI / 2, 0, 0]));
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.42;
    add(G.box(0.002, 0.001, 0.005), 0x181c22, {}, xf([0.155 + Math.sin(a) * 0.038, H + 0.001, 0.075 - Math.cos(a) * 0.038], [0, -a, 0]));
  }
  // Pilot lamp housing
  add(G.cyl(0.009, 0.009, 0.006, 16), PAL.brass, { gloss: 0.9 }, xf([0.19, H + 0.003, 0.128]));
  // Front face: fascia backing plate + headphone jack & trim
  add(G.box(W - 0.04, H - 0.01, 0.002), aluDark, {}, xf([0, H / 2, Dp / 2 + 0.001]));
  add(G.cyl(0.007, 0.007, 0.006, 12), PAL.brass, { gloss: 0.9 }, xf([0.14, H / 2, Dp / 2 + 0.004], [Math.PI / 2, 0, 0]));
  add(G.cyl(0.004, 0.004, 0.007, 10), 0x090b0f, {}, xf([0.14, H / 2, Dp / 2 + 0.005], [Math.PI / 2, 0, 0]));
  const body = B.build(toon());
  group.add(body);

  // Interactive Rotatable Gain/Volume Knob ('deck-knob')
  const knobGroup = new THREE.Group();
  knobGroup.position.set(0.155, H, 0.075);
  {
    const kb = new Batch();
    kb.add(paint(G.cyl(0.030, 0.031, 0.020, 32), 0x14161a, { gloss: 0.55, m: xf([0, 0.010, 0]) }));
    // Knurled flutes around the outer skirt
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      kb.add(paint(G.box(0.002, 0.018, 0.002), 0x2c323c, { gloss: 0.6, m: new THREE.Matrix4().makeRotationY(a).multiply(xf([0, 0.010, -0.0305])) }));
    }
    kb.add(paint(G.cyl(0.024, 0.026, 0.006, 28), PAL.brass, { gloss: 0.9, m: xf([0, 0.023, 0]) }));
    kb.add(paint(G.box(0.004, 0.0025, 0.018), PAL.red, { glow: 0.5, m: xf([0, 0.027, -0.010]) }));
    knobGroup.add(kb.build(toon()));
  }
  group.add(knobGroup);

  // Fascia texture on the front face (3.5 mm in front of backing plate + polygonOffset)
  const fascia = new THREE.Mesh(paint(G.plane(0.24, 0.056), 0xffffff), toon({ map: deckFascia(), polygonOffset: true }));
  fascia.position.set(-0.065, H / 2 + 0.001, Dp / 2 + 0.0055);
  group.add(fascia);

  // VU meter faces + needles
  const vus = vuPos.map(([vx, vz], i) => {
    const g = new THREE.Group();
    g.position.set(vx, H + 0.012, vz);
    g.rotation.set(vuTilt, 0, 0);
    const face = new THREE.Mesh(paint(G.plane(0.074, 0.044), 0xffffff, { glow: 0.55 }), toon({ map: vuFace(i ? 'RIGHT' : 'LEFT'), sweep: 0, polygonOffset: true }));
    face.position.z = 0.0185;
    g.add(face);
    const needle = new THREE.Group();
    needle.position.set(0, -0.022, 0.0215);
    needle.add(new THREE.Mesh(paint(G.box(0.0014, 0.039, 0.0008), 0x1a120a, { m: xf([0, 0.0195, 0]) }), toon({ sweep: 0 })));
    g.add(needle);
    group.add(g);
    return { g, needle, v: 0 };
  });

  // Keys: one mesh each, sharing the cap atlas + sculpted front finger lip
  const atlas = keyAtlas();
  const keyMat = toon({ map: atlas, polygonOffset: true });
  const keys = {};
  KEY_NAMES.forEach((name, i) => {
    const kb = new Batch();
    const bodyG = paint(G.box(0.036, 0.014, 0.05), 0x8e949c, { gloss: 0.55, m: xf([0, -0.005, 0]) });
    uvFill(bodyG, 0.995, 0.005);
    kb.add(bodyG);
    const lipG = paint(G.box(0.036, 0.008, 0.008), 0xb8c0c8, { gloss: 0.75, m: xf([0, -0.004, 0.027], [0.35, 0, 0]) });
    uvFill(lipG, 0.995, 0.005);
    kb.add(lipG);
    const capG = paint(G.plane(0.033, 0.033), 0xffffff, { gloss: 0.3, m: xf([0, 0.0048, -0.006], [-Math.PI / 2, 0, 0]) });
    const uv = capG.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (i * 128 + 4 + uv.getX(k) * 120) / 640, 1 - (4 + (1 - uv.getY(k)) * 120) / 160);
    kb.add(capG);
    const mesh = kb.build(keyMat);
    const x = -0.17 + i * 0.043;
    mesh.position.set(x, H + 0.004, 0.09);
    mesh.userData.rest = mesh.position.y;
    group.add(mesh);
    keys[name] = { name, mesh, down: 0, target: 0, latched: false, center: new THREE.Vector3(x, H + 0.012, 0.09), half: v3(0.019, 0.02, 0.026) };
  });

  // Also register the rotatable deck gain knob in extraKeys
  extraKeys.push({ name: 'deck-knob', parent: group, center: v3(0.155, H + 0.015, 0.075), half: v3(0.034, 0.026, 0.034) });

  // Pilot lamp
  const lamp = new THREE.Mesh(paint(G.sphere(0.0065, 12, 8), 0xff3a22, { glow: 1.5, gloss: 0.8 }), toon({ sweep: 0 }));
  lamp.position.set(0.19, H + 0.008, 0.128);
  group.add(lamp);

  // Spindles in the well
  const spindles = [-1, 1].map((sx) => {
    const sb = new Batch();
    sb.add(paint(G.cyl(0.0045, 0.0045, 0.01, 12), 0xe9e6dc, { gloss: 0.4 }));
    for (let k = 0; k < 6; k++) sb.add(paint(G.box(0.0016, 0.008, 0.0024), 0xe9e6dc, { m: new THREE.Matrix4().makeRotationY((k / 6) * Math.PI * 2).multiply(xf([0.0048, 0, 0])) }));
    const m = sb.build(toon());
    m.position.set(WELL.x + sx * 0.0255, H - WELL.depth + 0.006, WELL.z + 0.002);
    group.add(m);
    return m;
  });

  // Lid: smoked acrylic, hinged at the back edge of the well
  const lid = new THREE.Group();
  lid.position.set(WELL.x, H + 0.004, wz0 - 0.006);
  const lidMat = toon({ transparent: true, opacity: 0.55, depthWrite: false });
  const lidB = new Batch();
  lidB.add(paint(slab(WELL.w + 0.008, WELL.d + 0.008, 0.005, 0.006), 0x262930, { gloss: 1.0, m: xf([0, 0.0005, (WELL.d + 0.008) / 2 + 0.002], [Math.PI / 2, 0, 0]) }));
  const lidMesh = lidB.build(lidMat);
  lidMesh.renderOrder = 3;
  lid.add(lidMesh);
  const lidTrim = new Batch();
  lidTrim.add(paint(G.box(WELL.w + 0.008, 0.007, 0.01), alu, { gloss: 0.6, m: xf([0, 0.001, WELL.d + 0.007]) }));
  lidTrim.add(paint(G.box(0.03, 0.004, 0.008), PAL.brass, { gloss: 0.9, m: xf([0, 0.0, WELL.d + 0.016]) }));
  lid.add(lidTrim.build(toon()));
  group.add(lid);

  // Positions in world space
  group.updateMatrixWorld(true);
  const wellCenter = new THREE.Vector3(WELL.x, H - WELL.depth + 0.001 + TAPE.t / 2, WELL.z).applyMatrix4(group.matrixWorld);
  const snapCenter = new THREE.Vector3(WELL.x, H + 0.03, WELL.z).applyMatrix4(group.matrixWorld);
  const wellQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)).premultiply(group.quaternion);

  // Ghost outline shown while a held tape is close to the well
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffc24a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const ghostShape = new THREE.Shape();
  {
    const w = TAPE.w / 2 + 0.003, h = TAPE.h / 2 + 0.003, w2 = w - 0.003, h2 = h - 0.003;
    ghostShape.moveTo(-w, -h); ghostShape.lineTo(w, -h); ghostShape.lineTo(w, h); ghostShape.lineTo(-w, h); ghostShape.lineTo(-w, -h);
    const hole = new THREE.Path(); hole.moveTo(-w2, -h2); hole.lineTo(-w2, h2); hole.lineTo(w2, h2); hole.lineTo(w2, -h2); hole.lineTo(-w2, -h2);
    ghostShape.holes.push(hole);
  }
  const ghost = new THREE.Mesh(new THREE.ShapeGeometry(ghostShape), ghostMat);
  ghost.position.set(WELL.x, H - WELL.depth + 0.004, WELL.z);
  ghost.rotation.x = -Math.PI / 2;
  ghost.renderOrder = 4;
  group.add(ghost);

  const _p = new THREE.Vector3();
  const state = {
    lidOpen: 0, lidTarget: 0, spin: 0, spinTarget: 0, ghost: 0, ghostTarget: 0, lamp: 0, lampTarget: 0.15,
    knobStep: 0, knobAngle: 0, vuKick: 0,
  };

  let _clock = 0;
  const api = {
    group, body, lid, keys, extraKeys, vus, lamp, spindles, ghost, wellCenter, snapCenter, wellQuat, state, consoleState,
    openLid(open = true) { state.lidTarget = open ? 1 : 0; },
    addExtraKeys(list) { for (const k of list) extraKeys.push(k); },
    kickVu(amt = 0.65) { state.vuKick = Math.max(state.vuKick, amt); },
    pressExtra(name) {
      if (name === 'deck-knob') {
        state.knobStep = (state.knobStep + 1) % 8;
        state.vuKick = 0.55;
        return state.knobStep;
      }
      state.vuKick = 0.45;
      return pressExtra(name);
    },
    pressKey(name, latch = false) {
      const k = keys[name]; if (!k) return;
      k.target = 1; k.latched = latch; k.t = 0;
      for (const o of Object.values(keys)) if (o !== k && o.latched && latch) { o.latched = false; o.target = 0; }
    },
    releaseKeys() { for (const k of Object.values(keys)) { k.latched = false; k.target = 0; } },
    keyAt(p, pad = 0) {
      let best = null;
      let bestD2 = Infinity;
      const deckPad = Math.min(pad, 0.004);
      _p.copy(p);
      group.worldToLocal(_p);
      for (const k of Object.values(keys)) {
        const dx = Math.abs(_p.x - k.center.x);
        const dz = Math.abs(_p.z - k.center.z);
        if (dx < k.half.x + deckPad && dz < k.half.z + deckPad && _p.y < k.center.y + k.half.y + deckPad && _p.y > k.center.y - 0.032) {
          const d2 = dx * dx + dz * dz + (_p.y - k.center.y) * (_p.y - k.center.y);
          if (d2 < bestD2) { bestD2 = d2; best = k; }
        }
      }
      for (const ek of extraKeys) {
        _p.copy(p);
        ek.parent.worldToLocal(_p);
        const isSmallGrid = ek.name.startsWith('tel-') && ek.name !== 'tel-hook';
        const ep = isSmallGrid ? Math.min(pad, 0.004) : pad;
        const dx = Math.abs(_p.x - ek.center.x);
        const dy = Math.abs(_p.y - ek.center.y);
        const dz = Math.abs(_p.z - ek.center.z);
        if (dx < ek.half.x + ep && dy < ek.half.y + ep && dz < ek.half.z + ep) {
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < bestD2) { bestD2 = d2; best = ek; }
        }
      }
      return best;
    },
    update(dt, levels) {
      _clock += dt;
      const ease = (cur, tgt, rate) => cur + (tgt - cur) * (1 - Math.exp(-dt * rate));
      state.lidOpen = ease(state.lidOpen, state.lidTarget, 15);
      const lo = state.lidOpen;
      lid.rotation.x = -1.9 * (lo * lo * (3 - 2 * lo));
      state.spin = ease(state.spin, state.spinTarget, 2.2);
      for (const [i, s] of spindles.entries()) s.rotation.y -= dt * state.spin * (i ? 7.5 : 4.2);
      state.ghost = ease(state.ghost, state.ghostTarget, 14);
      ghostMat.opacity = state.ghost * (0.55 + 0.45 * Math.sin(performance.now() * 0.012));
      ghost.visible = state.ghost > 0.01;
      state.lamp = ease(state.lamp, state.lampTarget, 8);
      lamp.material.uniforms.uTint.value.setScalar(0.25 + state.lamp * 0.9);
      for (const k of Object.values(keys)) {
        if (!k.latched && k.target > 0 && (k.t = (k.t || 0) + dt) > 0.16) k.target = 0;
        k.down = ease(k.down, k.target, 30);
        k.mesh.position.y = k.mesh.userData.rest - k.down * 0.006;
      }
      state.knobAngle = ease(state.knobAngle, (state.knobStep - 2) * 0.45, 22);
      knobGroup.rotation.y = -state.knobAngle;
      state.vuKick = Math.max(0, state.vuKick - dt * 2.8);
      const lIn = (levels ? levels.l : 0) + state.vuKick * 0.8;
      const rIn = (levels ? levels.r : 0) + state.vuKick * 0.7;
      vus[0].v = ease(vus[0].v, lIn, 20); vus[1].v = ease(vus[1].v, rIn, 20);
      for (const vu of vus) vu.needle.rotation.z = 0.8 - Math.min(1.15, vu.v * 1.35) * 1.4;

      for (const fn of animItems) fn(dt, _clock, levels);
    },
  };
  return api;
}

function uvFill(geo, u, v) {
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { a[i * 2] = u; a[i * 2 + 1] = v; }
  geo.setAttribute('uv', new THREE.BufferAttribute(a, 2));
}

// 5 key caps side by side + a solid grey swatch on the far right (used by key bodies)
function keyAtlas() {
  return canvasTex(640, 160, (g) => {
    g.fillStyle = '#8e949c'; g.fillRect(0, 0, 640, 160);
    const draw = [
      (c, y) => { tri(g, c - 2, y, c - 26, y - 18, c - 26, y + 18); tri(g, c + 22, y, c - 2, y - 18, c - 2, y + 18); }, // rew
      (c, y) => { tri(g, c + 20, y, c - 14, y - 22, c - 14, y + 22); }, // play
      (c, y) => { tri(g, c + 2, y, c - 22, y - 18, c - 22, y + 18); tri(g, c + 26, y, c + 2, y - 18, c + 2, y + 18); }, // ff
      (c, y) => { g.fillRect(c - 17, y - 17, 34, 34); }, // stop
      (c, y) => { tri(g, c, y - 20, c - 20, y + 4, c + 20, y + 4); g.fillRect(c - 20, y + 11, 40, 8); }, // eject
    ];
    for (let i = 0; i < 5; i++) {
      const x = i * 128;
      const play = i === 1;
      g.fillStyle = play ? '#c8302a' : '#e6dcc4';
      g.fillRect(x + 4, 4, 120, 120);
      g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4; g.strokeRect(x + 6, 6, 116, 116);
      g.fillStyle = play ? '#f6ecd8' : '#1b202c';
      draw[i](x + 64, 64);
    }
  });
}

function tri(g, x0, y0, x1, y1, x2, y2) {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
}

