// Cassette: detailed 3D spy compact cassette with toothed reels, visible magnetic tape path,
// guide rollers, gripped side ribs, and the interactive IEYTD-style Pneumatic Spy Cassette
// Dispenser ("TAPE VAULT · MK IV") with animated ejector lever, purge button and pressure gauge.
import * as THREE from 'three';
import { toon, paint, G, Batch, slab, xf, v3 } from '../gfx/shade.js';
import { cassetteLabel, cassetteSpine, plateAtlas, canvasTex, FONT } from '../gfx/textures.js';
import { DESK } from './desk.js';
import { PAL } from './room.js';

export const TAPE = { w: 0.102, h: 0.064, t: 0.012 };

export class Cassette {
  constructor(song) {
    this.song = song;
    this.id = song.id;
    this.group = new THREE.Group();
    this.group.name = `tape-${song.id}`;
    this.half = v3(TAPE.w / 2, TAPE.h / 2, TAPE.t / 2);
    this.hover = 0;
    this._hoverT = 0;
    this.spin = 0; // rad/s of tape travel
    this.progress = 0.25;
    this.materials = [];
    this._build();
  }

  _mat(opts = {}) {
    const m = toon(opts);
    this.materials.push(m);
    return m;
  }

  _build() {
    const { w, h, t } = TAPE;
    const B = new Batch();
    const add = (geo, c, o = {}, m = null) => B.add(paint(geo, c, { ...o, m }));
    const shell = 0x161920, rim = 0x262c36, brass = 0xd4a442, chrome = 0xc8d0d8;

    // Outer shell with bevelled corners + raised center seam ring
    add(slab(w, h, t - 0.002, 0.004), shell, { gloss: 0.48 });
    add(slab(w - 0.004, h - 0.004, t, 0.003), rim, { gloss: 0.35 });

    // Tactile grip ribs along the left and right edges of the cassette shell
    for (const sx of [-1, 1]) {
      for (let i = -3; i <= 3; i++) {
        add(G.box(0.0018, 0.0032, t - 0.001), brass, { gloss: 0.8 }, xf([sx * (w / 2 + 0.0004), i * 0.0055, 0]));
      }
    }

    // Trapezoid head-entry boss along the bottom edge (front & back) + tape access notches
    add(slab(w * 0.72, 0.012, t + 0.0022, 0.002), 0x1e242e, { gloss: 0.45 }, xf([0, -h / 2 + 0.0065, 0]));
    for (const nx of [-0.026, 0, 0.026]) {
      add(G.box(0.012, 0.0045, t + 0.003), 0x090b0f, {}, xf([nx, -h / 2 + 0.002, 0]));
    }
    // Exposed magnetic oxide tape ribbon + brass pressure pad & guide rollers at bottom
    add(G.box(w * 0.64, 0.0016, t * 0.55), 0x3b2316, { gloss: 0.75 }, xf([0, -h / 2 + 0.0032, 0]));
    add(G.box(0.009, 0.003, t * 0.65), brass, { gloss: 0.88 }, xf([0, -h / 2 + 0.0045, 0]));
    for (const gx of [-0.038, -0.018, 0.018, 0.038]) {
      add(G.cyl(0.0026, 0.0026, t + 0.0026, 10), chrome, { gloss: 0.9 }, xf([gx, -h / 2 + 0.006, 0], [Math.PI / 2, 0, 0]));
    }

    // Top write-protect cavities & brass code tabs
    for (const wx of [-0.034, 0.034]) {
      add(G.box(0.011, 0.003, t - 0.003), 0x090b0f, {}, xf([wx, h / 2 - 0.001, 0]));
      add(G.box(0.005, 0.0032, t - 0.004), brass, { gloss: 0.85 }, xf([wx - 0.002, h / 2 - 0.0008, 0]));
    }

    // Center window pocket + measure tick marks across the window
    add(G.box(0.056, 0.019, t + 0.0004), 0x080a0e, {}, xf([0, -0.003, 0]));
    for (let i = -2; i <= 2; i++) {
      add(G.box(0.0012, 0.0035, t + 0.0009), brass, { gloss: 0.85 }, xf([i * 0.007, -0.003, 0]));
    }

    // 5 machined brass corner & center assembly screws on both faces
    for (const s of [-1, 1]) {
      for (const [x, y] of [[-w / 2 + 0.006, h / 2 - 0.006], [w / 2 - 0.006, h / 2 - 0.006], [-w / 2 + 0.006, -h / 2 + 0.006], [w / 2 - 0.006, -h / 2 + 0.006], [0, -h / 2 + 0.011]]) {
        add(G.cyl(0.0022, 0.0022, 0.0014, 10), brass, { gloss: 0.92 }, xf([x, y, s * (t / 2 + 0.0005)], [Math.PI / 2, 0, 0]));
      }
    }
    const body = B.build(this._mat());
    this.group.add(body);

    // Reels (two child groups so they can spin) with 6 teeth, metallic clamp ring & oxide pack
    this.reels = [];
    this.packs = [];
    for (const [i, rx] of [[-0.0225, 0.0225].entries()]) {
      void i;
    }
    [-0.0225, 0.0225].forEach((rx) => {
      const rg = new THREE.Group();
      rg.position.set(rx, -0.003, 0);
      const pack = new THREE.Mesh(paint(G.cyl(1, 1, t + 0.0008, 24), 0x2d1d14, { gloss: 0.3, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }), this._mat());
      rg.add(pack);
      this.packs.push(pack);

      const rb = new Batch();
      // White/ivory reel hub + brass ring + 6 drive teeth
      rb.add(paint(G.cyl(0.0078, 0.0078, t + 0.0018, 20), 0xebe4d4, { gloss: 0.55, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      rb.add(paint(G.cyl(0.0062, 0.0062, t + 0.0021, 18), brass, { gloss: 0.88, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      rb.add(paint(G.cyl(0.0046, 0.0046, t + 0.0026, 16), 0x090b0f, { m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([0.0053, 0, 0]));
        rb.add(paint(G.box(0.0026, 0.0014, t + 0.0028), 0xebe4d4, { m }));
      }
      rg.add(rb.build(this._mat()));
      this.group.add(rg);
      this.reels.push(rg);
    });
    this._setPacks();

    // Label planes (front, back, top spine) — 1.2 mm outside shell + polygonOffset
    const front = cassetteLabel(this.song);
    const spine = cassetteSpine(this.song);
    const fMat = this._mat({ map: front, transparent: true, polygonOffset: true });
    const lW = w - 0.01, lH = h - 0.015;
    for (const s of [1, -1]) {
      const m = new THREE.Mesh(paint(G.plane(lW, lH), 0xffffff, { gloss: 0.25 }), fMat);
      m.position.set(0, 0.003, s * (t / 2 + 0.0012));
      if (s < 0) m.rotation.y = Math.PI;
      this.group.add(m);
    }
    const sMat = this._mat({ map: spine, polygonOffset: true });
    const sm = new THREE.Mesh(paint(G.plane(w - 0.01, t - 0.003), 0xffffff, { gloss: 0.25 }), sMat);
    sm.position.set(0, h / 2 + 0.0011, 0);
    sm.rotation.x = -Math.PI / 2;
    this.group.add(sm);
  }

  _setPacks() {
    const f = THREE.MathUtils.clamp(this.progress, 0.05, 0.95);
    const r = (x) => Math.sqrt(0.008 * 0.008 + x * (0.0165 * 0.0165 - 0.008 * 0.008));
    this.packs[0].scale.set(r(1 - f), r(1 - f), 1);
    this.packs[1].scale.set(r(f), r(f), 1);
    this._r = [r(1 - f), r(f)];
  }

  setHover(h) { this.hover = h; }

  update(dt) {
    this._hoverT += (this.hover - this._hoverT) * (1 - Math.exp(-dt * 16));
    for (const m of this.materials) if (m.uniforms) m.uniforms.uHover.value = this._hoverT;
    if (this.spin) {
      const v = 0.0571 * this.spin;
      this.reels[0].rotation.z += dt * v / this._r[0];
      this.reels[1].rotation.z += dt * v / this._r[1];
    }
  }

  setProgress(p) { this.progress = p; this._setPacks(); }

  distanceTo(p) {
    const lp = this.group.worldToLocal(p.clone());
    const q = v3(Math.abs(lp.x) - this.half.x, Math.abs(lp.y) - this.half.y, Math.abs(lp.z) - this.half.z);
    const outside = v3(Math.max(q.x, 0), Math.max(q.y, 0), Math.abs(Math.max(q.z, 0))).length();
    return outside + Math.min(Math.max(q.x, q.y, q.z), 0);
  }
}

// ---------------------------------------------------------------------------------------------
// IEYTD-Style Pneumatic Spy Cassette Dispenser ("TAPE VAULT · MK IV"):
// Stepped mechanical cassette dispenser turret with spring-loaded pull-chutes, glowing vacuum
// tubes, pneumatic brass delivery pipe, animated pressure gauge, interactive side ejector lever
// and interactive front pneumatic purge button.
export function buildCase(songs) {
  const n = Math.max(4, songs.length);
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const cellW = TAPE.w + 0.032;
  const rowStepZ = 0.105;
  const inW = cols * cellW + 0.028;
  const W = inW + 0.044, D = rows * rowStepZ + 0.075, Hb = 0.14;

  const group = new THREE.Group();
  group.name = 'case';
  // Right wing of the spy console, angled toward the operator
  group.position.set(0.49, DESK.y, -0.60);
  group.rotation.y = -0.34;

  const B = new Batch();
  const add = (geo, c, o = {}, m = null) => B.add(paint(geo, c, { ...o, m }));
  const bodySteel = 0x1a2228, darkIron = 0x101419, brass = PAL.brass, copper = 0xa86028, crimson = 0x6e181a;

  // Heavy rotary turret base plate + bolted brass rim ring + perimeter hex bolts
  add(G.cyl(W * 0.52, W * 0.55, 0.016, 28), darkIron, { gloss: 0.45 }, xf([0, 0.008, 0], [0, 0, 0], [1, 1, D / W]));
  add(G.torus(W * 0.51, 0.005, 8, 32), brass, { gloss: 0.85 }, xf([0, 0.016, 0], [Math.PI / 2, 0, 0], [1, D / W, 1]));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    add(G.cyl(0.004, 0.004, 0.006, 6), brass, { gloss: 0.9 }, xf([Math.cos(a) * W * 0.49, 0.017, Math.sin(a) * D * 0.49]));
  }

  // Stepped mechanical chassis: lower front tier + elevated rear tier
  const frontZ = 0.048, backZ = -0.056;
  add(slab(W, 0.115, 0.058, 0.012), bodySteel, { gloss: 0.42 }, xf([0, 0.044, frontZ], [Math.PI / 2, 0, 0]));
  add(slab(W, 0.125, 0.114, 0.014), bodySteel, { gloss: 0.42 }, xf([0, 0.072, backZ], [Math.PI / 2, 0, 0]));

  // Ribbed cast-iron side cheeks + brass stiffening ribs & hex bolts
  for (const sx of [-1, 1]) {
    add(slab(D - 0.02, 0.135, 0.018, 0.015), darkIron, { gloss: 0.5 }, xf([sx * (W / 2 + 0.004), 0.078, -0.005], [0, Math.PI / 2, 0]));
    for (let k = 0; k < 4; k++) {
      add(G.box(0.008, 0.085, 0.012), brass, { gloss: 0.85 }, xf([sx * (W / 2 + 0.014), 0.075, -0.065 + k * 0.042]));
      add(G.sphere(0.0035, 6, 6), 0xe8d090, { gloss: 0.9 }, xf([sx * (W / 2 + 0.018), 0.11, -0.065 + k * 0.042]));
    }
  }

  // Right-side Ejector Lever Pivot Drum (the moving lever arm itself is an animated Group below)
  const lx = W / 2 + 0.022, ly = 0.078, lz = 0.02;
  add(G.cyl(0.020, 0.024, 0.026, 16), brass, { gloss: 0.88 }, xf([lx - 0.006, ly, lz], [0, 0, Math.PI / 2]));
  add(G.torus(0.021, 0.003, 6, 16), darkIron, { gloss: 0.6 }, xf([lx + 0.005, ly, lz], [0, Math.PI / 2, 0]));

  // Left-side Brass Pressure Gauge housing (the needle is an animated Mesh below)
  const gx = -W / 2 - 0.018, gy = 0.095, gz = -0.04;
  add(G.cyl(0.030, 0.030, 0.018, 20), brass, { gloss: 0.88 }, xf([gx, gy, gz], [0, 0, Math.PI / 2]));
  add(G.torus(0.028, 0.0035, 8, 20), brass, { gloss: 0.9 }, xf([gx - 0.009, gy, gz], [0, Math.PI / 2, 0]));
  add(G.circle(0.024, 18), 0xefe2c4, { glow: 0.35 }, xf([gx - 0.010, gy, gz], [0, -Math.PI / 2, 0]));
  // Gauge scale ticks
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.38;
    add(G.box(0.002, 0.005, 0.002), i >= 2 ? 0xc82822 : 0x1e1810, {}, xf([gx - 0.011, gy + Math.cos(a) * 0.018, gz + Math.sin(a) * 0.018], [a, 0, 0]));
  }

  // Front-left Brass Collar for the interactive Pneumatic Purge Push-Button
  const pbx = -W / 2 + 0.026, pby = 0.078, pbz = 0.088;
  add(G.cyl(0.015, 0.017, 0.012, 16), brass, { gloss: 0.88 }, xf([pbx, pby, pbz], [0.35, 0, 0]));

  // Upper Telemetry Hood & Vacuum Tubes + Pneumatic Brass Delivery Pipe at the back of the dispenser
  const hy = 0.176, hz = -0.112;
  {
    add(slab(W - 0.01, 0.055, 0.105, 0.01), darkIron, { gloss: 0.5 }, xf([0, hy - 0.025, hz], [Math.PI / 2, 0, 0]));
    add(G.box(W - 0.02, 0.008, 0.06), brass, { gloss: 0.85 }, xf([0, hy + 0.028, hz]));
    // Horizontal copper pressure manifold linking the 3 vacuum tubes
    add(G.cyl(0.004, 0.004, 0.22, 10), copper, { gloss: 0.82 }, xf([0, hy + 0.040, hz - 0.014], [0, 0, Math.PI / 2]));
    for (const tx of [-0.095, 0, 0.095]) {
      add(G.cyl(0.015, 0.017, 0.014, 14), brass, { gloss: 0.88 }, xf([tx, hy + 0.036, hz]));
      add(G.torus(0.014, 0.0022, 6, 14), brass, { gloss: 0.88 }, xf([tx, hy + 0.052, hz], [Math.PI / 2, 0, 0]));
      add(G.torus(0.014, 0.0022, 6, 14), brass, { gloss: 0.88 }, xf([tx, hy + 0.068, hz], [Math.PI / 2, 0, 0]));
    }
    // Curved Pneumatic Brass Chute Pipe rising behind the dispenser with bolted flange rings
    const pipeCurve = new THREE.CatmullRomCurve3([
      v3(0.05, hy + 0.025, hz - 0.01),
      v3(0.06, hy + 0.125, hz - 0.05),
      v3(0.11, hy + 0.225, hz - 0.14),
    ]);
    add(new THREE.TubeGeometry(pipeCurve, 16, 0.022, 12, false), copper, { gloss: 0.78 });
    add(G.torus(0.026, 0.005, 8, 18), brass, { gloss: 0.9 }, xf([0.05, hy + 0.034, hz - 0.01], [Math.PI / 2, 0, 0]));
    add(G.torus(0.026, 0.005, 8, 18), brass, { gloss: 0.9 }, xf([0.072, hy + 0.155, hz - 0.075], [Math.PI / 2 - 0.5, 0, 0]));
  }

  // Stepped Ejector Slots (cassettes stand angled at -0.92 rad so you pull them out of the jaws!)
  const tilt = -0.92; // ~53 deg upright tilt toward the player
  const slots = [];
  const platePositions = [];

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const cx = -cols * cellW / 2 + (c + 0.5) * cellW;
    const cz = r === 0 ? backZ + 0.006 : frontZ + 0.006;
    const cy = r === 0 ? 0.132 : 0.076;

    // Mechanical pocket frame, brass ejector springs & spring-claw side rails around each cassette slot
    const pocketM = xf([cx, cy - 0.012, cz + 0.005], [tilt, 0, 0]);
    add(G.box(TAPE.w + 0.014, TAPE.h * 0.62, TAPE.t + 0.014), darkIron, { gloss: 0.45 }, pocketM.clone().multiply(xf([0, -TAPE.h * 0.22, 0])));
    add(G.box(TAPE.w + 0.006, TAPE.h * 0.58, 0.004), crimson, {}, pocketM.clone().multiply(xf([0, -TAPE.h * 0.20, -TAPE.t / 2 - 0.003])));
    for (const jx of [-1, 1]) {
      add(G.box(0.006, TAPE.h * 0.68, TAPE.t + 0.018), brass, { gloss: 0.88 }, pocketM.clone().multiply(xf([jx * (TAPE.w / 2 + 0.005), -TAPE.h * 0.16, 0])));
      add(G.cyl(0.003, 0.003, 0.012, 8), 0xc8d0d8, { gloss: 0.9 }, pocketM.clone().multiply(xf([jx * (TAPE.w / 2 + 0.006), 0.002, 0], [0, 0, Math.PI / 2])));
    }
    add(G.sphere(0.0045, 8, 6), i === 0 ? 0x38e078 : 0xffaa2a, { glow: 1.7 }, xf([cx + TAPE.w * 0.44, cy - 0.032, cz + 0.042]));

    slots.push(v3(cx, cy, cz));
    platePositions.push([cx - 0.012, cy - 0.033, cz + 0.043]);
  }

  const tray = B.build(toon());
  group.add(tray);

  // 3 Animated Glowing Vacuum Tubes on top of the hood (pulse when lever/button pressed!)
  const tubeMeshes = [-0.095, 0, 0.095].map((tx) => {
    const tb = new Batch();
    tb.add(paint(G.cyl(0.010, 0.010, 0.036, 12), 0xff9a36, { glow: 1.85, gloss: 0.8, m: xf([0, 0.058, 0]) }));
    tb.add(paint(G.sphere(0.010, 10, 8), 0xff9a36, { glow: 1.85, m: xf([0, 0.076, 0]) }));
    const m = tb.build(toon({ sweep: 0 }));
    m.position.set(tx, hy, hz);
    group.add(m);
    return m;
  });

  // Animated Left-Side Pressure Gauge Needle
  const gaugeNeedle = new THREE.Group();
  gaugeNeedle.position.set(gx - 0.0115, gy, gz);
  gaugeNeedle.add(new THREE.Mesh(paint(G.box(0.002, 0.018, 0.003), 0xc82822, { m: xf([0, 0.006, 0]) }), toon({ sweep: 0 })));
  gaugeNeedle.rotation.x = 0.55;
  group.add(gaugeNeedle);

  // Interactive Right-Side Ejector Lever Group ('case-lever')
  const leverGroup = new THREE.Group();
  leverGroup.position.set(lx + 0.008, ly, lz);
  leverGroup.rotation.set(-0.38, 0, -0.16);
  {
    const lb = new Batch();
    lb.add(paint(G.cyl(0.0055, 0.0065, 0.115, 12), 0xd0d8e0, { gloss: 0.9, m: xf([0, 0.058, 0]) }));
    lb.add(paint(G.torus(0.009, 0.0025, 6, 12), brass, { gloss: 0.9, m: xf([0, 0.098, 0], [Math.PI / 2, 0, 0]) }));
    lb.add(paint(G.sphere(0.019, 16, 12), 0xd42822, { gloss: 0.82, m: xf([0, 0.118, 0]) }));
    leverGroup.add(lb.build(toon()));
  }
  group.add(leverGroup);

  // Interactive Front-Left Red Pneumatic Purge Button ('case-purge')
  const purgeBtn = new THREE.Mesh(
    paint(G.cyl(0.011, 0.011, 0.014, 16), 0xd42822, { gloss: 0.78, glow: 0.35 }),
    toon({ sweep: 0 })
  );
  purgeBtn.position.set(pbx, pby + 0.006, pbz + 0.002);
  purgeBtn.rotation.set(0.35, 0, 0);
  purgeBtn.userData.rest = purgeBtn.position.clone();
  group.add(purgeBtn);

  // Numbered brass slot plates ('01'..'04') on the front lip of each ejector bay
  {
    const pAtlas = plateAtlas(n);
    const pBatch = new Batch();
    platePositions.forEach(([px, py, pz], i) => {
      const pg = paint(G.plane(0.03, 0.012), 0xffffff, { gloss: 0.75, m: xf([px, py, pz], [-0.35, 0, 0]) });
      const uv = pg.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + uv.getX(k)) / n, uv.getY(k));
      pBatch.add(pg);
    });
    group.add(pBatch.build(toon({ map: pAtlas, polygonOffset: true })));
  }

  // Riveted brass nameplate on the upper hood ('TAPE VAULT · MK IV')
  const plaque = new THREE.Mesh(
    paint(G.plane(0.22, 0.032), 0xffffff, { m: xf([0, 0.178, -0.082], [-0.15, 0, 0]) }),
    toon({
      polygonOffset: true,
      map: canvasTex(512, 80, (g2, w2, h2) => {
        g2.fillStyle = '#c9a046'; g2.fillRect(0, 0, w2, h2);
        g2.strokeStyle = '#4a3510'; g2.lineWidth = 4; g2.strokeRect(5, 5, w2 - 10, h2 - 10);
        g2.fillStyle = '#241906'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
        g2.font = `400 42px ${FONT.caps}`;
        g2.fillText('T A P E   V A U L T  ·  M K  I V', w2 / 2, h2 / 2 + 2);
      }),
    })
  );
  group.add(plaque);

  group.updateMatrixWorld(true);
  const slotPoses = slots.map((s) => {
    const p = s.clone().applyMatrix4(group.matrixWorld);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0)).premultiply(group.quaternion);
    return { p, q };
  });

  // Animation state for interactive lever & purge button
  const anim = { lever: 0, leverT: 0, purge: 0, purgeT: 0, boost: 0 };
  const controls = [
    { name: 'case-lever', parent: group, center: v3(lx + 0.02, ly + 0.085, lz - 0.035), half: v3(0.038, 0.065, 0.045) },
    { name: 'case-purge', parent: group, center: v3(pbx, pby + 0.008, pbz + 0.004), half: v3(0.024, 0.024, 0.024) },
  ];

  function triggerEject(which = 'case-lever') {
    if (which === 'case-purge') { anim.purgeT = 1.0; } else { anim.leverT = 1.0; }
    anim.boost = 1.0;
  }

  function update(dt) {
    const ease = (c, t, r) => c + (t - c) * (1 - Math.exp(-dt * r));
    if (anim.leverT > 0) anim.leverT = Math.max(0, anim.leverT - dt * 2.4);
    if (anim.purgeT > 0) anim.purgeT = Math.max(0, anim.purgeT - dt * 4.5);
    anim.lever = ease(anim.lever, anim.leverT > 0.3 ? 1 : 0, 18);
    anim.purge = ease(anim.purge, anim.purgeT > 0.2 ? 1 : 0, 26);
    anim.boost = Math.max(0, anim.boost - dt * 1.6);

    leverGroup.rotation.x = -0.38 - anim.lever * 0.68;
    purgeBtn.position.y = purgeBtn.userData.rest.y - anim.purge * 0.005;
    purgeBtn.position.z = purgeBtn.userData.rest.z - anim.purge * 0.002;
    gaugeNeedle.rotation.x = 0.55 - anim.boost * 1.45 + Math.sin(performance.now() * 0.025) * anim.boost * 0.12;
    for (const [i, tm] of tubeMeshes.entries()) {
      const pulse = 1 + anim.boost * (1.2 + 0.4 * Math.sin(performance.now() * 0.03 + i));
      tm.material.uniforms.uTint.value.setScalar(pulse);
    }
  }

  return { group, slotPoses, size: { W, D, Hb }, foamTop: 0.08, controls, triggerEject, update };
}
