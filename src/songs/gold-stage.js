// =================================================================================================
// GOLD ON THE WIRE — 360° VR Set-Piece Show ("I Expect You To Die" Graphic Spy Title Sequence)
// =================================================================================================
// Self-contained, modular 3D show stage for "Gold on the Wire" (0.00s – 153.77s).
// The lobby room, desk, telephone, cassette dispenser, and outside skyline completely disappear
// right at the start of the song so the player is 100% immersed in a standalone 360° VR
// "I Expect You To Die" (Saul Bass / Maurice Binder / Cog in the Machine) spy title sequence.
//
// To remove or replace this show later, simply edit/replace `web/src/songs/gold-on-the-wire.js`
// (and delete this file).
// =================================================================================================

import * as THREE from 'three';
import { LIGHT, paint, G, Batch, slab, xf, v3 } from '../gfx/shade.js';
import { canvasTex, FONT } from '../gfx/textures.js';
import { sm, env, clamp01 } from './util.js';

const TAU = Math.PI * 2;

// Authentic "I Expect You To Die" / Saul Bass 4-Color Graphic Poster Palette:
// Velvet Pitch Black, Graphic Crimson Red, Burnished Spy Gold, and Crisp Vintage Cream.
const C = {
  obsidian: 0x07070c,
  steelDark: 0x12141d,
  steel: 0x222634,
  chrome: 0xf4eee1,
  brass: 0xe5a428,
  gold: 0xffc638,
  goldBright: 0xffe888,
  copper: 0xc84a1e,
  crimson: 0xd8141c,
  ruby: 0xff1e26,
  ivory: 0xf7efe0,
};

// =================================================================================================
// Custom "I Expect You To Die" Graphic Cel-Shader + Rim-Light Silhouette Outline
// Keeps black pitch-black with a sharp golden/crimson rim contour, and keeps reds, golds, and
// creams 100% crisp and poster-styled (never muddy or dark brown).
// =================================================================================================
const IEYTD_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aExtra;
varying vec3 vCol;
varying vec4 vExtra;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vCol = aCol;
  vExtra = aExtra;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const IEYTD_FRAG = /* glsl */ `
uniform float uExposure;
uniform vec3 uTint;
uniform vec3 uRimCol;
uniform float uBeat;
#ifdef USE_MAP
uniform sampler2D map;
#endif
varying vec3 vCol;
varying vec4 vExtra;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  vec3 base = vCol * uTint;
  float alpha = 1.0;
#ifdef USE_MAP
  vec4 tx = texture2D(map, vUv);
  base *= tx.rgb;
  alpha *= tx.a;
  if (alpha < 0.02) discard;
#endif

  // Crisp two-step Saul Bass / IEYTD graphic poster lighting from front-above
  vec3 keyDir = normalize(vec3(-0.28, 0.65, 0.70));
  float ndl = dot(n, keyDir);

  // Preserve 100% pure velvet black for dark silhouettes while keeping crimson/gold/cream vivid and crisp
  float lum = dot(base, vec3(0.299, 0.587, 0.114));
  float isDark = 1.0 - smoothstep(0.05, 0.16, lum);
  float poster = mix(0.84, 1.05, step(-0.08, ndl));
  vec3 lit = mix(base * poster, vec3(0.022, 0.020, 0.032), isDark);

  // Graphic specular slash ONLY on non-dark glossy brass/gold/crimson surfaces (never greys out black panels)
  if (vExtra.y > 0.0 && isDark < 0.5) {
    vec3 h = normalize(v + keyDir);
    float spec = step(0.92, max(dot(n, h), 0.0)) * vExtra.y * (1.0 - isDark);
    lit += base * spec * 0.25;
  }

  // Iconic IEYTD razor-sharp golden/crimson rim-light contour on curved dark silhouette edges only
  // (never washes out flat frontal black panels where abs(n.z) > 0.45)
  float isCurvedSide = step(abs(n.z), 0.44) * step(abs(n.y), 0.78);
  float rimStep = step(0.68, 1.0 - abs(dot(n, v))) * isCurvedSide * isDark;
  lit = mix(lit, uRimCol, rimStep * 0.92);

  // Controlled color-preserving self-illumination (never bleaches crimson to pink or gold to white)
  lit *= 1.0 + clamp(vExtra.x, 0.0, 1.2) * (0.14 + 0.06 * uBeat) * (1.0 - isDark);

  gl_FragColor = vec4(lit * uExposure, alpha);
  #include <colorspace_fragment>
}`;

const SHARED_RIM = { value: new THREE.Color(0xffb830) };
const SHARED_BEAT = { value: 0 };

function stageMat(opts = {}) {
  const uniforms = {
    uExposure: LIGHT.uExposure,
    uTint: { value: opts.tint ? new THREE.Color(opts.tint) : new THREE.Color(0xffffff) },
    uRimCol: SHARED_RIM,
    uBeat: SHARED_BEAT,
  };
  const defines = {};
  if (opts.map) {
    uniforms.map = { value: opts.map };
    defines.USE_MAP = '';
  }
  return new THREE.ShaderMaterial({
    uniforms,
    defines,
    vertexShader: IEYTD_VERT,
    fragmentShader: IEYTD_FRAG,
    side: opts.side ?? THREE.FrontSide,
  });
}

// =================================================================================================
// 360° Graphic Saul Bass / IEYTD Backdrop Cyclorama Dome
// Replaces the room and outside sky with a bold graphic poster void (velvet black, crimson sunburst
// rays, concentric target circles, and golden geometric horizon rings).
// =================================================================================================
const DOME_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const DOME_FRAG = /* glsl */ `
uniform float uTime;
uniform float uExposure;
uniform float uBeat;
uniform float uRedAlert;
uniform float uBlackout;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;

  // Deep velvet black floor & zenith, rich graphic crimson horizon & focal backdrop
  vec3 colTop = vec3(0.025, 0.015, 0.035);
  vec3 colMid = mix(vec3(0.42, 0.035, 0.055), vec3(0.82, 0.06, 0.08), uRedAlert);
  vec3 colBot = vec3(0.02, 0.015, 0.025);

  float hMask = exp(-pow((y - 0.06) * 2.4, 2.0));
  vec3 col = mix(y > 0.0 ? colTop : colBot, colMid, hMask);

  // Forward focal point at (0, 0.12, -1): Saul Bass concentric spy target & rotating sunburst rays
  vec3 fwd = normalize(vec3(0.0, 0.12, -1.0));
  float ang = acos(clamp(dot(d, fwd), -1.0, 1.0));
  float atanA = atan(d.y - 0.12, d.x);

  // Subtle rotating Saul Bass radial sunburst wedges
  float rays = 0.5 + 0.5 * cos(atanA * 16.0 - uTime * 0.55);
  float rayMask = smoothstep(0.35, 0.65, rays) * exp(-ang * 1.6);
  col += mix(vec3(0.22, 0.02, 0.03), vec3(0.45, 0.24, 0.04), 0.35 + 0.35 * sin(uTime * 0.4)) * rayMask * (0.45 + 0.25 * uBeat);

  // Crisp golden & crimson concentric target rings in the sky
  float rWave = abs(fract(ang * 3.8 - uTime * 0.18) - 0.5);
  float ringLine = smoothstep(0.028, 0.008, rWave) * exp(-ang * 1.3);
  col += vec3(0.95, 0.68, 0.18) * ringLine * (0.28 + 0.22 * uBeat);

  col *= (1.0 - uBlackout * 0.96) * uExposure;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// Helper: build a detailed 3D toothed gear wheel as a single merged Batch mesh
function makeGear({
  r = 1.0,
  rInner = 0.32,
  t = 0.08,
  teeth = 16,
  spokes = 6,
  col = C.brass,
  rimCol = C.gold,
  glow = 0.45,
  gloss = 0.85,
  mat = null,
} = {}) {
  const b = new Batch();
  const toothH = r * (0.14 * (16 / Math.max(8, teeth)));
  const rRoot = r - toothH * 0.45;
  const rWeb = rRoot * 0.82;

  b.add(paint(G.cyl(rRoot, rRoot, t * 0.92, Math.max(20, teeth * 2)), col, { gloss, glow: glow * 0.8, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
  b.add(paint(G.cyl(rWeb, rWeb, t * 0.55, 24), C.obsidian, { gloss: 0.3, glow: 0.12, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
  for (const sz of [-1, 1]) {
    b.add(paint(G.ring(rWeb * 0.96, rRoot, 28), rimCol, { gloss: 0.9, glow, m: xf([0, 0, sz * (t * 0.47)], [sz < 0 ? Math.PI : 0, 0, 0]) }));
  }

  const toothW = (TAU * rRoot) / (teeth * 2.05);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([rRoot + toothH * 0.42, 0, 0]));
    b.add(paint(G.box(toothH, toothW, t), rimCol, { gloss: 0.9, glow, m }));
  }

  const spokeL = Math.max(0.02, rWeb - rInner * 0.8);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU;
    const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([rInner * 0.8 + spokeL * 0.5, 0, 0]));
    b.add(paint(G.box(spokeL, r * 0.085, t * 0.78), col, { gloss, glow: glow * 0.85, m }));
  }

  b.add(paint(G.cyl(rInner, rInner, t * 1.28, 20), rimCol, { gloss: 0.9, glow, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
  b.add(paint(G.cyl(rInner * 0.52, rInner * 0.52, t * 1.36, 16), C.obsidian, { gloss: 0.2, glow: 0.1, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
  return b.build(mat || stageMat());
}

// Helper: generate a crisp 1960s Saul Bass / IEYTD spy graphic placard texture
function makePlacardTex(topText, mainText, subText, accent = '#ffc638', bg = '#07070c') {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = accent;
    g.lineWidth = 9;
    g.strokeRect(14, 14, w - 28, h - 28);
    g.lineWidth = 2.5;
    g.strokeRect(28, 28, w - 56, h - 56);

    g.fillStyle = accent;
    for (const [cx, cy] of [[44, 44], [w - 44, 44], [44, h - 44], [w - 44, h - 44]]) {
      g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
    }

    if (topText) {
      g.fillStyle = accent;
      g.font = `700 25px ${FONT.mono}`;
      g.textAlign = 'center';
      g.fillText(topText, w / 2, 64);
    }
    g.fillStyle = '#f7efe0';
    g.font = `700 70px ${FONT.serif}`;
    g.textAlign = 'center';
    g.fillText(mainText, w / 2, topText ? 150 : 140);

    if (subText) {
      g.fillStyle = accent;
      g.font = `600 27px ${FONT.sans}`;
      g.fillText(subText, w / 2, 208);
    }
  });
}

export class GoldStage {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'gold-stage';
    this.group.visible = false;
    this.scene.add(this.group);

    this.mat = stageMat();
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0xffe078, transparent: true, opacity: 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0xff1e24, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.goldWireMat = new THREE.MeshBasicMaterial({
      color: 0xffd24c, transparent: true, opacity: 0.90,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    this._buildBackdropAndPlatform();
    this._buildIntroGadgets();
    this._buildActCarAndChampagne();
    this._buildActMirrorsAndExits();
    this._buildActClockAndShaft();
    this._buildActClockworkTunnel();
    this._buildActAutomatonAndLasers();
    this._buildActCountdownAndIris();
    this._buildKineticBanners();
  }

  // -----------------------------------------------------------------------------------------------
  // 360° IEYTD Graphic Void Cyclorama Dome + Floating Spy Compass Platform Under the Player's Feet
  // -----------------------------------------------------------------------------------------------
  _buildBackdropAndPlatform() {
    this.domeU = {
      uTime: { value: 0 },
      uExposure: LIGHT.uExposure,
      uBeat: SHARED_BEAT,
      uRedAlert: { value: 0 },
      uBlackout: { value: 0 },
    };
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(42, 32, 20),
      new THREE.ShaderMaterial({
        uniforms: this.domeU,
        vertexShader: DOME_VERT,
        fragmentShader: DOME_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    this.dome.renderOrder = -5;
    this.group.add(this.dome);

    // Floating Graphic Spy Compass Ring beneath the player's feet (y = 0.0m, open glass/skeleton center)
    this.floorCompass = new THREE.Group();
    this.floorCompass.position.set(0, 0.01, 0.05);
    {
      const b = new Batch();
      b.add(paint(G.ring(1.15, 1.48, 36), C.obsidian, { gloss: 0.6, glow: 0.15, m: xf([0, 0, 0], [-Math.PI / 2, 0, 0]) }));
      b.add(paint(G.torus(1.48, 0.035, 8, 36), C.gold, { gloss: 0.95, glow: 1.1, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      b.add(paint(G.torus(1.15, 0.028, 8, 36), C.crimson, { gloss: 0.9, glow: 1.2, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        const isCard = i % 6 === 0;
        const m = new THREE.Matrix4().makeRotationY(a).multiply(xf([0, 0.01, -1.31]));
        b.add(paint(G.box(isCard ? 0.08 : 0.025, 0.015, isCard ? 0.26 : 0.14), isCard ? C.ivory : C.gold, { glow: 1.2, m }));
      }
      this.floorCompass.add(b.build(this.mat));
    }
    this.group.add(this.floorCompass);
  }

  // -----------------------------------------------------------------------------------------------
  // 0. INTRO ACT (0.2s – 17.4s): "Gold on the wire, fire in the sky / Smile like an angel, lie like
  //    a spy / Count down to zero, don't ask me why / Gold on the wire tonight"
  //    (Since the room & desk disappear immediately, this fills the entire 360° space!)
  // -----------------------------------------------------------------------------------------------
  _buildIntroGadgets() {
    const g = new THREE.Group();
    g.name = 'act-intro';
    this.group.add(g);
    this.introGroup = g;

    // 1. Giant Crimson & Gold Sunburst Emblem ("fire in the sky") + 10 High-Voltage Golden Cables
    this.introSunburst = new THREE.Group();
    this.introSunburst.position.set(0, 1.55, -5.2);
    {
      const b = new Batch();
      b.add(paint(G.torus(2.65, 0.08, 10, 36), C.gold, { gloss: 0.95, glow: 1.2 }));
      b.add(paint(G.torus(1.85, 0.06, 10, 32), C.crimson, { gloss: 0.9, glow: 1.4 }));
      // 16 graphic Saul Bass sunburst dagger rays
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        const len = i % 2 === 0 ? 1.45 : 0.95;
        const col = i % 2 === 0 ? C.goldBright : C.crimson;
        const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([0, 1.85 + len * 0.5, -0.04]));
        b.add(paint(G.cone(0.16, len, 4), col, { gloss: 0.9, glow: 1.5, m }));
      }
      this.introSunburst.add(b.build(this.mat));
    }
    g.add(this.introSunburst);

    // 8 High-Voltage Telegraph Insulator Towers & Sweeping Golden Wires curving around the player
    this.introCoils = new THREE.Group();
    {
      const b = new Batch();
      for (let i = 0; i < 8; i++) {
        const a = ((i - 3.5) / 7) * 2.1;
        const r = 3.2;
        const x = Math.sin(a) * r;
        const z = -0.6 - Math.cos(a) * r;
        b.add(paint(G.cyl(0.09, 0.14, 1.4, 14), C.obsidian, { gloss: 0.7, glow: 0.2, m: xf([x, 0.1, z]) }));
        for (let k = 0; k < 5; k++) {
          b.add(paint(G.torus(0.14 - k * 0.012, 0.028, 8, 18), k % 2 === 0 ? C.gold : C.crimson, { gloss: 0.95, glow: 1.1, m: xf([x, 0.85 + k * 0.14, z], [Math.PI / 2, 0, 0]) }));
        }
        b.add(paint(G.sphere(0.075, 14, 10), C.ivory, { gloss: 0.95, glow: 2.0, m: xf([x, 1.62, z]) }));
        // Sweeping golden cable into the central sunburst
        const curve = new THREE.CatmullRomCurve3([
          v3(x, 1.62, z),
          v3(x * 0.55, 1.15 + (i % 2) * 0.45, (z - 5.2) * 0.5),
          v3(0, 1.55, -5.2),
        ]);
        b.add(paint(new THREE.TubeGeometry(curve, 18, 0.018, 8, false), C.goldBright, { glow: 1.9 }));
      }
      this.introCoils.add(b.build(this.mat));
    }
    g.add(this.introCoils);

    // 2. "Smile like an angel, lie like a spy" (3.4s – 7.8s):
    // 6 Giant 1960s Spy Microfilm Cameras & Fanning Golden Angel/Wing Blades surrounding the player
    this.spyCamRing = new THREE.Group();
    this.spyCams = [];
    for (let i = 0; i < 6; i++) {
      const cg = new THREE.Group();
      const a = ((i - 2.5) / 5) * 2.2;
      const dist = 3.45;
      cg.position.set(Math.sin(a) * dist, 1.55, -0.4 - Math.cos(a) * dist);
      cg.rotation.y = -a;

      const b = new Batch();
      b.add(paint(slab(0.58, 0.42, 0.44, 0.04), C.obsidian, { gloss: 0.8, glow: 0.2 }));
      b.add(paint(G.box(0.62, 0.04, 0.46), C.gold, { gloss: 0.95, glow: 1.1, m: xf([0, 0.21, 0]) }));
      for (const sx of [-0.16, 0.16]) {
        b.add(paint(G.cyl(0.16, 0.16, 0.07, 20), C.gold, { gloss: 0.92, glow: 0.95, m: xf([sx, 0.36, -0.04], [0, Math.PI / 2, 0]) }));
      }
      b.add(paint(G.cyl(0.16, 0.19, 0.28, 22), C.brass, { gloss: 0.95, glow: 1.0, m: xf([0, 0, 0.32], [Math.PI / 2, 0, 0]) }));
      b.add(paint(G.torus(0.17, 0.022, 8, 22), C.crimson, { glow: 1.5, m: xf([0, 0, 0.45]) }));
      b.add(paint(G.circle(0.14, 20), C.ivory, { glow: 2.0, m: xf([0, 0, 0.465]) }));
      // Graphic golden wing/halo blades fanning out behind the camera ("Smile like an angel")
      for (let w = -3; w <= 3; w++) {
        if (w === 0) continue;
        const wa = w * 0.26;
        const m = new THREE.Matrix4().makeRotationZ(wa).multiply(xf([0, 0.56, -0.18]));
        b.add(paint(G.box(0.08, 0.55, 0.02), Math.abs(w) % 2 === 1 ? C.goldBright : C.ivory, { glow: 1.5, m }));
      }
      cg.add(b.build(this.mat));
      this.spyCamRing.add(cg);
      this.spyCams.push({ group: cg, idx: i });
    }
    g.add(this.spyCamRing);

    // 3. "Count down to zero, don't ask me why / Gold on the wire tonight" (8.0s – 15.8s):
    // Colossal 3-Axis Open Golden Gyroscope & Toothed Vault Rings around the center stage
    this.deckGyro = new THREE.Group();
    this.deckGyro.position.set(0, 1.50, -3.6);
    this.deckGyroRings = [];
    const ringConfigs = [
      { r: 1.75, teeth: 24, col: C.gold, rim: C.crimson },
      { r: 1.32, teeth: 18, col: C.crimson, rim: C.gold },
      { r: 0.90, teeth: 14, col: C.obsidian, rim: C.gold },
    ];
    for (const cfg of ringConfigs) {
      const rb = new Batch();
      rb.add(paint(G.torus(cfg.r, 0.055, 12, 36), cfg.col, { gloss: 0.95, glow: 1.0 }));
      rb.add(paint(G.torus(cfg.r * 0.92, 0.022, 8, 32), cfg.rim, { gloss: 0.95, glow: 1.2 }));
      for (let k = 0; k < cfg.teeth; k++) {
        const a = (k / cfg.teeth) * TAU;
        const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([0, cfg.r + 0.06, 0]));
        rb.add(paint(G.box(0.08, 0.11, 0.07), cfg.rim, { gloss: 0.95, glow: 1.1, m }));
      }
      const rg = rb.build(this.mat);
      this.deckGyro.add(rg);
      this.deckGyroRings.push(rg);
    }
    const coreSphere = new THREE.Mesh(paint(G.sphere(0.32, 22, 16), C.gold, { gloss: 0.98, glow: 1.4 }), this.mat);
    this.deckGyro.add(coreSphere);
    g.add(this.deckGyro);
  }

  // -----------------------------------------------------------------------------------------------
  // 1. ACT I (17.44s – 28.2s): "Black car waiting where the streetlights end / Champagne silence"
  // -----------------------------------------------------------------------------------------------
  _buildActCarAndChampagne() {
    const g = new THREE.Group();
    g.name = 'act-car';
    this.group.add(g);
    this.actCar = g;

    // Noir Highway stretching directly under the player's feet (+4m to -20m) + Saul Bass Cutout Skyscrapers
    const roadB = new Batch();
    roadB.add(paint(G.box(4.2, 0.05, 24.0), C.obsidian, { gloss: 0.5, glow: 0.12, m: xf([0, -0.35, -8.0]) }));
    for (const sx of [-1.95, 1.95]) {
      roadB.add(paint(G.box(0.09, 0.06, 24.0), C.gold, { gloss: 0.95, glow: 1.3, m: xf([sx, -0.34, -8.0]) }));
    }
    for (let i = 0; i < 12; i++) {
      roadB.add(paint(G.box(0.12, 0.065, 1.05), C.ivory, { glow: 1.6, m: xf([0, -0.34, 2.2 - i * 1.95]) }));
    }
    // Graphic Saul Bass silhouette skyscrapers flanking the highway in black, crimson & gold
    for (let i = 0; i < 10; i++) {
      for (const sx of [-1, 1]) {
        const bx = sx * (4.4 + (i % 3) * 1.2);
        const bz = -2.5 - i * 2.2;
        const bh = 3.2 + ((i * 3) % 5) * 1.1;
        const bw = 1.1 + (i % 2) * 0.45;
        roadB.add(paint(G.box(bw, bh, 0.9), C.obsidian, { gloss: 0.4, glow: 0.1, m: xf([bx, bh / 2 - 0.35, bz]) }));
        roadB.add(paint(G.box(bw + 0.04, 0.06, 0.94), i % 2 === 0 ? C.gold : C.crimson, { glow: 1.5, m: xf([bx, bh - 0.35, bz]) }));
      }
    }
    g.add(roadB.build(this.mat));

    // 8 Receding Noir Streetlamps (4 pairs from z = -2.4m back to z = -12.0m)
    this.streetlamps = [];
    for (let i = 0; i < 4; i++) {
      for (const sx of [-1, 1]) {
        const lg = new THREE.Group();
        const x = sx * 2.35;
        const z = -2.4 - i * 3.1;
        lg.position.set(x, -0.32, z);

        const lb = new Batch();
        lb.add(paint(G.cyl(0.10, 0.16, 0.48, 12), C.obsidian, { gloss: 0.7, glow: 0.2, m: xf([0, 0.24, 0]) }));
        lb.add(paint(G.cyl(0.042, 0.055, 2.95, 10), C.obsidian, { gloss: 0.7, glow: 0.2, m: xf([0, 1.70, 0]) }));
        lb.add(paint(G.torus(0.07, 0.018, 6, 12), C.gold, { gloss: 0.95, glow: 1.1, m: xf([0, 3.05, 0], [Math.PI / 2, 0, 0]) }));
        lb.add(paint(G.box(0.62, 0.045, 0.045), C.gold, { gloss: 0.95, glow: 1.1, m: xf([-sx * 0.29, 3.15, 0], [0, 0, sx * 0.18]) }));
        lb.add(paint(G.cone(0.20, 0.14, 8), C.gold, { gloss: 0.95, glow: 1.2, m: xf([-sx * 0.56, 3.12, 0]) }));
        lg.add(lb.build(this.mat));

        const bulbMat = stageMat();
        const bulb = new THREE.Mesh(paint(G.sphere(0.105, 12, 10), C.ivory, { glow: 2.4 }), bulbMat);
        bulb.position.set(-sx * 0.56, 2.98, 0);
        lg.add(bulb);

        const coneMat = this.beamMat.clone();
        const cone = new THREE.Mesh(G.cone(1.05, 3.1, 18, true), coneMat);
        cone.position.set(-sx * 0.56, 1.48, 0);
        lg.add(cone);

        g.add(lg);
        this.streetlamps.push({ group: lg, bulbMat, coneMat, row: i });
      }
    }

    // Sculpted 1960s Black-and-Gold Spy GT Fastback Coupe (now 100% unobstructed at z = -3.8m!)
    this.spyCar = new THREE.Group();
    this.spyCar.position.set(-0.25, 0.02, -3.9);
    this.spyCar.rotation.y = 0.42;
    {
      const cb = new Batch();
      cb.add(paint(slab(1.72, 0.48, 4.20, 0.08), C.obsidian, { gloss: 0.92, glow: 0.18, m: xf([0, 0.16, 0]) }));
      cb.add(paint(slab(1.58, 0.24, 2.40, 0.06), C.steelDark, { gloss: 0.88, glow: 0.22, m: xf([0, 0.44, 0.55]) }));
      cb.add(paint(slab(1.38, 0.38, 1.80, 0.08), C.obsidian, { gloss: 0.92, glow: 0.18, m: xf([0, 0.64, -0.25], [-0.14, 0, 0]) }));
      cb.add(paint(G.plane(1.26, 0.44), C.ivory, { gloss: 0.98, glow: 1.5, m: xf([0, 0.62, 0.66], [-0.88, 0, 0]) }));
      for (const sx of [-1, 1]) {
        cb.add(paint(G.box(0.035, 0.04, 4.24), C.gold, { gloss: 0.95, glow: 1.4, m: xf([sx * 0.86, 0.25, 0]) }));
        cb.add(paint(G.box(0.07, 0.30, 1.28), C.obsidian, { gloss: 0.88, glow: 0.2, m: xf([sx * 0.78, 0.48, -1.45], [0.18, 0, 0]) }));
        cb.add(paint(G.box(0.08, 0.035, 1.30), C.crimson, { gloss: 0.95, glow: 1.6, m: xf([sx * 0.78, 0.63, -1.45], [0.18, 0, 0]) }));
        cb.add(paint(G.cyl(0.15, 0.15, 0.12, 18), C.gold, { gloss: 0.95, glow: 1.2, m: xf([sx * 0.58, 0.22, 2.08], [Math.PI / 2, 0, 0]) }));
        cb.add(paint(G.circle(0.125, 18), C.ivory, { glow: 2.6, m: xf([sx * 0.58, 0.22, 2.145]) }));
        cb.add(paint(G.cyl(0.12, 0.12, 0.10, 16), C.ruby, { glow: 2.4, m: xf([sx * 0.58, 0.24, -2.10], [Math.PI / 2, 0, 0]) }));
        for (const wz of [-1.30, 1.30]) {
          cb.add(paint(G.cyl(0.35, 0.35, 0.25, 22), C.obsidian, { gloss: 0.5, glow: 0.15, m: xf([sx * 0.84, 0, wz], [0, 0, Math.PI / 2]) }));
          cb.add(paint(G.cyl(0.26, 0.26, 0.26, 20), C.ivory, { gloss: 0.8, glow: 1.2, m: xf([sx * 0.84, 0, wz], [0, 0, Math.PI / 2]) }));
          cb.add(paint(G.cyl(0.19, 0.19, 0.27, 18), C.gold, { gloss: 0.95, glow: 1.4, m: xf([sx * 0.84, 0, wz], [0, 0, Math.PI / 2]) }));
        }
      }
      cb.add(paint(G.box(0.92, 0.17, 0.08), C.gold, { gloss: 0.95, glow: 1.4, m: xf([0, 0.14, 2.10]) }));
      cb.add(paint(G.box(1.78, 0.075, 0.12), C.ivory, { gloss: 0.95, glow: 1.2, m: xf([0, 0.02, 2.12]) }));
      cb.add(paint(G.box(0.48, 0.10, 0.98), C.crimson, { gloss: 0.9, glow: 1.2, m: xf([0, 0.43, 1.22]) }));
      this.spyCar.add(cb.build(this.mat));

      for (const sx of [-0.58, 0.58]) {
        const hb = new THREE.Mesh(G.cone(0.92, 5.2, 18, true), this.beamMat);
        hb.rotation.x = -Math.PI / 2;
        hb.position.set(sx, 0.22, 4.70);
        this.spyCar.add(hb);
      }
    }
    g.add(this.spyCar);

    // "Champagne silence" (23.7s – 28.2s): 6 Sculpted Crystal & Brass Champagne Coupes + 32 Golden Bubbles
    this.champagneGroup = new THREE.Group();
    this.coupes = [];
    for (let i = 0; i < 6; i++) {
      const cg = new THREE.Group();
      const b = new Batch();
      b.add(paint(G.cyl(0.13, 0.15, 0.024, 18), C.gold, { gloss: 0.95, glow: 1.3, m: xf([0, 0, 0]) }));
      b.add(paint(G.cyl(0.018, 0.024, 0.32, 12), C.gold, { gloss: 0.95, glow: 1.3, m: xf([0, 0.16, 0]) }));
      b.add(paint(G.cyl(0.24, 0.035, 0.16, 22), C.ivory, { gloss: 0.95, glow: 1.2, m: xf([0, 0.38, 0]) }));
      b.add(paint(G.torus(0.24, 0.010, 8, 22), C.goldBright, { gloss: 0.95, glow: 1.8, m: xf([0, 0.46, 0], [Math.PI / 2, 0, 0]) }));
      b.add(paint(G.circle(0.22, 20), C.goldBright, { glow: 2.0, m: xf([0, 0.43, 0], [-Math.PI / 2, 0, 0]) }));
      cg.add(b.build(this.mat));
      this.champagneGroup.add(cg);
      this.coupes.push({
        group: cg,
        angle: (i / 6) * TAU + 0.3,
        r: 1.95 + (i % 2) * 0.55,
        yBase: 0.65 + (i % 3) * 0.52,
        phase: i * 1.1,
      });
    }
    this.bubbles = [];
    {
      const bubbleGeo = paint(G.sphere(0.044, 10, 8), C.goldBright, { gloss: 0.95, glow: 2.2 });
      for (let i = 0; i < 32; i++) {
        const bm = new THREE.Mesh(bubbleGeo, this.mat);
        this.champagneGroup.add(bm);
        this.bubbles.push({
          mesh: bm,
          a: (i / 32) * TAU * 2.3,
          r: 1.15 + (i % 7) * 0.42,
          speed: 0.5 + (i % 5) * 0.16,
          y0: (i / 32) * 3.4,
          s: 0.65 + (i % 4) * 0.35,
        });
      }
    }
    g.add(this.champagneGroup);
  }

  // -----------------------------------------------------------------------------------------------
  // 2. ACT II (28.30s – 36.2s): "Every mirror shows a face I know / Every exit's got a place to go"
  // -----------------------------------------------------------------------------------------------
  _buildActMirrorsAndExits() {
    const g = new THREE.Group();
    g.name = 'act-mirrors';
    this.group.add(g);
    this.actMirrors = g;

    this.mirrorPortals = [];
    const exitTex = makePlacardTex('CLASSIFIED ROUTE', 'E X I T', 'SECTOR 07 // VAULT DOOR', '#ff1e26', '#0c0507');

    for (let i = 0; i < 8; i++) {
      const pg = new THREE.Group();
      const angle = (i / 8) * TAU + Math.PI / 8;
      const dist = 3.70;
      pg.position.set(Math.sin(angle) * dist, 1.25, -0.35 - Math.cos(angle) * dist);
      pg.rotation.y = -angle;

      const b = new Batch();
      // Full-height 3.0m graphic brass & obsidian monolith frame
      b.add(paint(slab(1.32, 3.02, 0.14, 0.06), C.gold, { gloss: 0.95, glow: 1.1 }));
      b.add(paint(slab(1.18, 2.86, 0.16, 0.04), C.obsidian, { gloss: 0.88, glow: 0.18 }));

      // FRONT FACE (+Z): Saul Bass Graphic Spy Mirror with crimson & cream target reticle
      b.add(paint(G.plane(1.06, 2.72), 0x101420, { gloss: 0.98, glow: 0.45, m: xf([0, 0, 0.084]) }));
      b.add(paint(G.ring(0.32, 0.355, 24), C.ivory, { glow: 1.9, m: xf([0, 0.25, 0.088]) }));
      b.add(paint(G.ring(0.14, 0.165, 20), C.crimson, { glow: 1.9, m: xf([0, 0.25, 0.088]) }));
      b.add(paint(G.box(0.82, 0.018, 0.004), C.goldBright, { glow: 1.8, m: xf([0, 0.25, 0.088]) }));
      b.add(paint(G.box(0.018, 0.82, 0.004), C.goldBright, { glow: 1.8, m: xf([0, 0.25, 0.088]) }));
      b.add(paint(G.box(0.98, 0.065, 0.004), C.ivory, { glow: 1.6, m: xf([0, -0.45, 0.088], [0, 0, 0.55]) }));
      b.add(paint(G.box(0.68, 0.035, 0.004), C.goldBright, { glow: 1.6, m: xf([0, -0.64, 0.088], [0, 0, 0.55]) }));

      // BACK FACE (-Z): Heavy Armored Vault Exit Door
      b.add(paint(G.box(1.08, 2.74, 0.04), C.obsidian, { gloss: 0.7, glow: 0.2, m: xf([0, 0, -0.084]) }));
      for (const sx of [-0.52, 0.52]) {
        b.add(paint(G.box(0.028, 2.68, 0.02), C.goldBright, { glow: 2.2, m: xf([sx, 0, -0.105]) }));
      }
      b.add(paint(G.box(1.06, 0.028, 0.02), C.goldBright, { glow: 2.2, m: xf([0, 1.34, -0.105]) }));
      b.add(paint(G.box(1.06, 0.028, 0.02), C.goldBright, { glow: 2.2, m: xf([0, -1.34, -0.105]) }));
      b.add(paint(G.box(0.72, 0.16, 0.10), C.ruby, { glow: 2.2, m: xf([0, 1.56, -0.04]) }));
      pg.add(b.build(this.mat));

      const sign = new THREE.Mesh(paint(G.plane(0.92, 0.23), 0xffffff, { glow: 1.7 }), stageMat({ map: exitTex }));
      sign.position.set(0, 0.96, -0.112);
      sign.rotation.y = Math.PI;
      pg.add(sign);

      const wheel = makeGear({ r: 0.36, rInner: 0.11, t: 0.05, teeth: 12, spokes: 6, col: C.crimson, rimCol: C.goldBright, glow: 1.3, mat: this.mat });
      wheel.position.set(0, -0.15, -0.13);
      pg.add(wheel);

      g.add(pg);
      this.mirrorPortals.push({ group: pg, wheel, baseYaw: -angle, idx: i });
    }

    this.mirrorLaserGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * TAU + Math.PI / 8;
      const a1 = (((i + 3) % 8) / 8) * TAU + Math.PI / 8;
      const p0 = v3(Math.sin(a0) * 3.50, 1.35 + (i % 2) * 0.25, -0.35 - Math.cos(a0) * 3.50);
      const p1 = v3(Math.sin(a1) * 3.50, 1.35 + ((i + 1) % 2) * 0.25, -0.35 - Math.cos(a1) * 3.50);
      const dir = p1.clone().sub(p0);
      const len = dir.length();
      const beam = new THREE.Mesh(G.cyl(0.014, 0.014, len, 8), this.goldWireMat);
      beam.position.copy(p0).addScaledVector(dir, 0.5);
      beam.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.normalize());
      this.mirrorLaserGroup.add(beam);
    }
    g.add(this.mirrorLaserGroup);
  }

  // -----------------------------------------------------------------------------------------------
  // 3. ACT III (36.34s – 47.48s): "Tick, tick, feel the city breathe / Ten floors under..."
  // -----------------------------------------------------------------------------------------------
  _buildActClockAndShaft() {
    const g = new THREE.Group();
    g.name = 'act-clock';
    this.group.add(g);
    this.actClock = g;

    // Colossal 7.2-Meter Brass & Crimson Astronomical Clockface at z = -5.2m
    this.megaClock = new THREE.Group();
    this.megaClock.position.set(0, 1.55, -5.2);
    {
      const b = new Batch();
      b.add(paint(G.torus(3.45, 0.12, 12, 48), C.gold, { gloss: 0.95, glow: 1.2 }));
      b.add(paint(G.torus(2.70, 0.065, 10, 48), C.crimson, { gloss: 0.92, glow: 1.4 }));
      b.add(paint(G.torus(1.28, 0.055, 10, 36), C.goldBright, { gloss: 0.95, glow: 1.3 }));
      b.add(paint(G.circle(3.40, 48), C.obsidian, { gloss: 0.4, glow: 0.1, m: xf([0, 0, -0.08]) }));

      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU;
        const isHour = i % 5 === 0;
        const rMid = isHour ? 3.08 : 3.20;
        const len = isHour ? 0.52 : 0.18;
        const w = isHour ? 0.095 : 0.028;
        const m = new THREE.Matrix4().makeRotationZ(a).multiply(xf([0, rMid, 0.02]));
        b.add(paint(G.box(w, len, 0.06), isHour ? C.ivory : C.gold, { gloss: 0.95, glow: isHour ? 1.8 : 1.0, m }));
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        b.add(paint(G.box(0.09, 6.8, 0.05), C.gold, { gloss: 0.95, glow: 1.0, m: new THREE.Matrix4().makeRotationZ(a) }));
      }
      this.megaClock.add(b.build(this.mat));

      this.clockInnerGears = [
        { pos: [0, 0, 0.04], r: 1.18, teeth: 24, speed: 0.8, col: C.gold },
        { pos: [-1.48, 0.88, 0.06], r: 0.80, teeth: 16, speed: -1.2, col: C.crimson },
        { pos: [1.48, 0.88, 0.06], r: 0.80, teeth: 16, speed: -1.2, col: C.crimson },
        { pos: [0, -1.58, 0.06], r: 0.94, teeth: 18, speed: 1.0, col: C.brass },
      ].map((cfg) => {
        const gm = makeGear({ r: cfg.r, rInner: cfg.r * 0.28, t: 0.06, teeth: cfg.teeth, spokes: 6, col: cfg.col, rimCol: C.ivory, glow: 1.2, mat: this.mat });
        gm.position.set(...cfg.pos);
        this.megaClock.add(gm);
        return { mesh: gm, speed: cfg.speed };
      });

      this.escapement = new THREE.Group();
      this.escapement.position.set(0, 2.95, 0.14);
      {
        const eb = new Batch();
        eb.add(paint(G.box(1.42, 0.13, 0.08), C.ivory, { gloss: 0.95, glow: 1.8 }));
        eb.add(paint(G.box(0.15, 0.44, 0.08), C.ruby, { glow: 2.0, m: xf([-0.64, -0.22, 0], [0, 0, 0.35]) }));
        eb.add(paint(G.box(0.15, 0.44, 0.08), C.ruby, { glow: 2.0, m: xf([0.64, -0.22, 0], [0, 0, -0.35]) }));
        this.escapement.add(eb.build(this.mat));
      }
      this.megaClock.add(this.escapement);

      const makeHand = (len, w, col, z) => {
        const hb = new Batch();
        hb.add(paint(G.box(w, len, 0.05), col, { gloss: 0.95, glow: 1.8, m: xf([0, len * 0.38, 0]) }));
        hb.add(paint(G.ring(0.15, 0.24, 16), col, { glow: 1.8, m: xf([0, len * 0.65, 0.03]) }));
        const hm = hb.build(this.mat);
        hm.position.z = z;
        this.megaClock.add(hm);
        return hm;
      };
      this.megaHourHand = makeHand(2.15, 0.15, C.gold, 0.16);
      this.megaMinHand = makeHand(3.05, 0.095, C.ivory, 0.22);
      this.megaSecHand = makeHand(3.25, 0.045, C.ruby, 0.27);
    }
    g.add(this.megaClock);

    // Breathing Saul Bass Cutout City Horizon ("feel the city breathe")
    this.breathingCity = new THREE.Group();
    this.cityTowers = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      if (Math.abs(Math.sin(a)) < 0.38 && Math.cos(a) > 0) continue;
      const dist = 7.0 + (i % 3) * 1.1;
      const w = 0.68 + (i % 4) * 0.18;
      const h = 2.6 + (i % 5) * 0.85;
      const tb = new Batch();
      tb.add(paint(G.box(w, h, w), C.obsidian, { gloss: 0.5, glow: 0.15, m: xf([0, h / 2, 0]) }));
      const edgeCol = i % 2 === 0 ? C.goldBright : C.crimson;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        tb.add(paint(G.box(0.04, h + 0.04, 0.04), edgeCol, { glow: 1.6, m: xf([sx * w * 0.5, h / 2, sz * w * 0.5]) }));
      }
      tb.add(paint(G.box(w + 0.05, 0.055, w + 0.05), C.ivory, { glow: 1.8, m: xf([0, h, 0]) }));
      const tm = tb.build(this.mat);
      tm.position.set(Math.sin(a) * dist, -1.6, -0.4 - Math.cos(a) * dist);
      tm.rotation.y = -a;
      this.breathingCity.add(tm);
      this.cityTowers.push({ mesh: tm, phase: i * 0.45, baseH: h });
    }
    g.add(this.breathingCity);

    // 10-Floor Subterranean Elevator Shaft ("Ten floors under what you believe")
    this.elevatorShaft = new THREE.Group();
    this.shaftRings = [];
    for (let f = 1; f <= 10; f++) {
      const rg = new THREE.Group();
      const rb = new Batch();
      rb.add(paint(G.torus(3.25, 0.08, 8, 8), f === 10 ? C.ruby : C.gold, { gloss: 0.95, glow: f === 10 ? 2.0 : 1.1, m: xf([0, 0, 0], [Math.PI / 2, 0, 0]) }));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + Math.PI / 4;
        rb.add(paint(G.box(0.20, 0.38, 0.20), C.ivory, { glow: 1.6, m: xf([Math.sin(a) * 3.2, 0, Math.cos(a) * 3.2]) }));
      }
      rg.add(rb.build(this.mat));

      const flTex = makePlacardTex('SUBTERRANEAN LEVEL', `FLOOR -${String(f).padStart(2, '0')}`, f === 10 ? 'VAULT CORE REACHED' : 'DESCENDING', f === 10 ? '#ff1e26' : '#ffc638');
      const flSign = new THREE.Mesh(paint(G.plane(1.42, 0.36), 0xffffff, { glow: 1.7 }), stageMat({ map: flTex }));
      flSign.position.set(0, 0.28, -3.12);
      rg.add(flSign);

      this.elevatorShaft.add(rg);
      this.shaftRings.push({ group: rg, floor: f });
    }
    g.add(this.elevatorShaft);
  }

  // -----------------------------------------------------------------------------------------------
  // 4. ACT IV (47.48s – 68.5s & 95.16s – 112.5s & Finale): Flight Through the Clockwork Tunnel
  // -----------------------------------------------------------------------------------------------
  _buildActClockworkTunnel() {
    const g = new THREE.Group();
    g.name = 'act-tunnel';
    this.group.add(g);
    this.actTunnel = g;

    this.tunnelSlices = [];
    this.tunnelSpan = 28.0;
    for (let i = 0; i < 8; i++) {
      const sg = new THREE.Group();
      const sb = new Batch();
      sb.add(paint(G.torus(4.2, 0.13, 8, 16), C.obsidian, { gloss: 0.75, glow: 0.2 }));
      sb.add(paint(G.torus(4.0, 0.05, 8, 24), C.gold, { gloss: 0.95, glow: 1.5 }));
      sb.add(paint(G.torus(3.7, 0.06, 8, 20, Math.PI), i % 2 === 0 ? C.ruby : C.goldBright, { glow: 2.2, m: xf([0, 0.1, 0]) }));
      sg.add(sb.build(this.mat));

      const gLeft = makeGear({
        r: 1.65 + (i % 2) * 0.35, rInner: 0.44, t: 0.10, teeth: 18, spokes: 6,
        col: i % 2 === 0 ? C.gold : C.crimson, rimCol: C.ivory, glow: 1.25, mat: this.mat,
      });
      gLeft.position.set(-3.35, 0.2 + (i % 3 - 1) * 0.55, 0.12);

      const gRight = makeGear({
        r: 1.65 + ((i + 1) % 2) * 0.35, rInner: 0.44, t: 0.10, teeth: 18, spokes: 6,
        col: i % 2 === 1 ? C.gold : C.crimson, rimCol: C.ivory, glow: 1.25, mat: this.mat,
      });
      gRight.position.set(3.35, 0.2 - (i % 3 - 1) * 0.55, -0.12);

      const gTop = makeGear({
        r: 1.22, rInner: 0.32, t: 0.08, teeth: 14, spokes: 5,
        col: i % 2 === 0 ? C.obsidian : C.brass, rimCol: C.goldBright, glow: 1.35, mat: this.mat,
      });
      gTop.position.set((i % 2 === 0 ? -1 : 1) * 1.65, 3.05, 0.2);

      const gBot = makeGear({
        r: 1.25, rInner: 0.32, t: 0.08, teeth: 14, spokes: 5,
        col: C.obsidian, rimCol: C.crimson, glow: 1.2, mat: this.mat,
      });
      gBot.position.set((i % 2 === 0 ? 1 : -1) * 1.55, -1.65, -0.15);

      let pendulum = null;
      if (i % 2 === 0) {
        pendulum = new THREE.Group();
        pendulum.position.set(0, 3.8, 0);
        const pb = new Batch();
        pb.add(paint(G.box(0.065, 2.75, 0.04), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, -1.36, 0]) }));
        pb.add(paint(G.cyl(0.55, 0.55, 0.08, 24), C.crimson, { gloss: 0.95, glow: 1.7, m: xf([0, -2.75, 0], [Math.PI / 2, 0, 0]) }));
        pb.add(paint(G.ring(0.24, 0.42, 20), C.ivory, { glow: 2.0, m: xf([0, -2.75, 0.045]) }));
        pendulum.add(pb.build(this.mat));
        sg.add(pendulum);
      }

      sg.add(gLeft, gRight, gTop, gBot);
      g.add(sg);
      this.tunnelSlices.push({
        group: sg,
        gLeft,
        gRight,
        gTop,
        gBot,
        pendulum,
        idx: i,
        zOffset: (i / 8) * this.tunnelSpan,
      });
    }

    const wireB = new Batch();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + Math.PI / 10;
      const rx = Math.sin(a) * 3.85;
      const ry = 1.25 + Math.cos(a) * 3.1;
      wireB.add(paint(G.cyl(0.020, 0.020, 28, 8), C.goldBright, { glow: 2.1, m: xf([rx, ry, -10], [Math.PI / 2, 0, 0]) }));
    }
    g.add(wireB.build(this.mat));
  }

  // -----------------------------------------------------------------------------------------------
  // 5. ACT V (68.58s – 85.4s & 95.16s+): "Velvet gloves on a steel machine / Waltzing slow through
  //    a laser beam / One red light and the whole room spins"
  // -----------------------------------------------------------------------------------------------
  _buildActAutomatonAndLasers() {
    const g = new THREE.Group();
    g.name = 'act-automaton';
    this.group.add(g);
    this.actAutomaton = g;

    // THE STEEL MACHINE — Colossal 4.8m Zoraxis-Style Cybernetic Spy Automaton (full body visible!)
    this.automaton = new THREE.Group();
    this.automaton.position.set(0, 1.15, -4.65);
    {
      const tb = new Batch();
      // Heavy pedestal / mechanical waist column below torso (now visible since desk is gone!)
      tb.add(paint(G.cyl(0.65, 0.95, 1.45, 16), C.obsidian, { gloss: 0.8, glow: 0.2, m: xf([0, -1.65, 0]) }));
      for (let k = 0; k < 3; k++) {
        tb.add(paint(G.torus(0.75 + k * 0.08, 0.045, 8, 24), k === 1 ? C.crimson : C.gold, { glow: 1.3, m: xf([0, -1.25 - k * 0.35, 0], [Math.PI / 2, 0, 0]) }));
      }
      // Armored Torso Chassis
      tb.add(paint(slab(1.82, 2.02, 0.94, 0.12), C.obsidian, { gloss: 0.85, glow: 0.22 }));
      tb.add(paint(G.box(1.90, 0.13, 1.00), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, 0.92, 0]) }));
      tb.add(paint(G.box(1.70, 0.11, 0.98), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, -0.92, 0]) }));
      tb.add(paint(G.torus(0.66, 0.07, 10, 28), C.gold, { gloss: 0.95, glow: 1.3, m: xf([0, 0.12, 0.47]) }));
      tb.add(paint(G.circle(0.62, 28), C.obsidian, { gloss: 0.3, glow: 0.1, m: xf([0, 0.12, 0.43]) }));
      for (const sx of [-1, 1]) {
        tb.add(paint(G.cyl(0.34, 0.38, 0.50, 18), C.gold, { gloss: 0.95, glow: 1.1, m: xf([sx * 1.12, 0.64, 0], [0, 0, Math.PI / 2]) }));
        for (let v = 0; v < 3; v++) {
          tb.add(paint(G.cyl(0.06, 0.06, 0.30, 12), C.ivory, { glow: 2.0, m: xf([sx * 0.72, -0.35 + v * 0.34, 0.47]) }));
        }
      }
      this.automaton.add(tb.build(this.mat));

      this.autoGyro = new THREE.Group();
      this.autoGyro.position.set(0, 0.12, 0.48);
      this.autoGyroRings = [0.54, 0.40, 0.27].map((r, idx) => {
        const m = makeGear({
          r, rInner: r * 0.68, t: 0.05, teeth: 16 - idx * 2, spokes: 4,
          col: idx === 1 ? C.ruby : C.gold, rimCol: C.ivory, glow: 1.6, mat: this.mat,
        });
        this.autoGyro.add(m);
        return m;
      });
      this.automaton.add(this.autoGyro);

      this.autoHead = new THREE.Group();
      this.autoHead.position.set(0, 1.52, 0.08);
      {
        const hb = new Batch();
        hb.add(paint(slab(1.00, 0.86, 0.80, 0.10), C.obsidian, { gloss: 0.85, glow: 0.22 }));
        hb.add(paint(G.box(1.06, 0.095, 0.84), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, 0.38, 0]) }));
        for (const sx of [-1, 1]) {
          hb.add(paint(G.cyl(0.24, 0.15, 0.17, 18), C.gold, { gloss: 0.95, glow: 1.1, m: xf([sx * 0.58, 0.02, 0], [0, 0, Math.PI / 2]) }));
          hb.add(paint(G.sphere(0.065, 10, 8), C.ruby, { glow: 2.2, m: xf([sx * 0.75, 0.02, 0]) }));
        }
        hb.add(paint(G.cyl(0.34, 0.38, 0.24, 24), C.gold, { gloss: 0.95, glow: 1.3, m: xf([0, 0, 0.40], [Math.PI / 2, 0, 0]) }));
        this.autoHead.add(hb.build(this.mat));

        this.cyclopsEyeMat = stageMat();
        this.cyclopsEye = new THREE.Mesh(paint(G.sphere(0.27, 20, 16), C.ruby, { gloss: 0.98, glow: 2.6 }), this.cyclopsEyeMat);
        this.cyclopsEye.position.set(0, 0, 0.44);
        this.autoHead.add(this.cyclopsEye);

        this.cyclopsConeMat = new THREE.MeshBasicMaterial({
          color: 0xff181e, transparent: true, opacity: 0.0,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        });
        const eyeCone = new THREE.Mesh(G.cone(1.85, 5.8, 24, true), this.cyclopsConeMat);
        eyeCone.rotation.x = -Math.PI / 2;
        eyeCone.position.set(0, 0, 3.30);
        this.autoHead.add(eyeCone);
      }
      this.automaton.add(this.autoHead);

      this.autoArms = [-1, 1].map((sx) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(sx * 1.22, 0.60, 0.12);
        const ab = new Batch();
        ab.add(paint(G.cyl(0.15, 0.17, 1.18, 14), C.obsidian, { gloss: 0.8, glow: 0.22, m: xf([sx * 0.25, -0.48, 0.22], [-0.35, 0, sx * 0.38]) }));
        ab.add(paint(G.cyl(0.065, 0.065, 1.08, 10), C.gold, { gloss: 0.95, glow: 1.2, m: xf([sx * 0.38, -0.45, 0.32], [-0.35, 0, sx * 0.38]) }));
        ab.add(paint(G.sphere(0.24, 16, 12), C.gold, { gloss: 0.95, glow: 1.2, m: xf([sx * 0.48, -0.96, 0.45]) }));
        shoulder.add(ab.build(this.mat));

        const forearm = new THREE.Group();
        forearm.position.set(sx * 0.48, -0.96, 0.45);
        const fb = new Batch();
        fb.add(paint(slab(0.30, 0.30, 1.18, 0.05), C.crimson, { gloss: 0.9, glow: 1.2, m: xf([0, -0.12, 0.56], [0.2, 0, 0]) }));
        fb.add(paint(G.torus(0.22, 0.045, 8, 18), C.ivory, { gloss: 0.95, glow: 1.6, m: xf([0, -0.22, 1.10]) }));
        for (let k = 0; k < 3; k++) {
          const ca = (k / 3) * TAU + (sx > 0 ? 0 : Math.PI);
          const m = new THREE.Matrix4().makeTranslation(0, -0.22, 1.16).multiply(new THREE.Matrix4().makeRotationZ(ca)).multiply(xf([0.17, 0, 0.23], [0, -0.35, 0]));
          fb.add(paint(G.box(0.065, 0.095, 0.48), C.crimson, { gloss: 0.9, glow: 1.35, m }));
          fb.add(paint(G.box(0.075, 0.105, 0.15), C.ivory, { gloss: 0.95, glow: 1.8, m: m.clone().multiply(xf([0, 0, 0.23])) }));
        }
        forearm.add(fb.build(this.mat));
        shoulder.add(forearm);
        this.automaton.add(shoulder);
        return { shoulder, forearm, sx };
      });
    }
    g.add(this.automaton);

    this.laserGrid = new THREE.Group();
    this.laserBeams = [];
    for (let i = 0; i < 18; i++) {
      const lg = new THREE.Group();
      const emitter = new THREE.Mesh(paint(G.cyl(0.065, 0.085, 0.18, 12), C.gold, { gloss: 0.95, glow: 1.2 }), this.mat);
      const beam = new THREE.Mesh(G.cyl(0.018, 0.018, 10.0, 8), this.laserMat);
      beam.position.y = 5.0;
      const tip = new THREE.Mesh(paint(G.sphere(0.06, 10, 8), C.ivory, { glow: 2.4 }), this.mat);
      lg.add(emitter, beam, tip);
      this.laserGrid.add(lg);
      this.laserBeams.push({ group: lg, idx: i, a: (i / 18) * TAU });
    }
    g.add(this.laserGrid);
  }

  // -----------------------------------------------------------------------------------------------
  // 6. ACT VII (112.62s – 127.68s): "Three... Two... One... You Were Never Here / Lights Out"
  // -----------------------------------------------------------------------------------------------
  _buildActCountdownAndIris() {
    const g = new THREE.Group();
    g.name = 'act-countdown';
    this.group.add(g);
    this.actCountdown = g;

    this.countdownTexs = {
      three: makePlacardTex('SELF-DESTRUCT SEQUENCE', '0 3', 'T-MINUS THREE SECONDS', '#ff1e26', '#090507'),
      two: makePlacardTex('SELF-DESTRUCT SEQUENCE', '0 2', 'T-MINUS TWO SECONDS', '#ff1e26', '#090507'),
      one: makePlacardTex('SELF-DESTRUCT SEQUENCE', '0 1', 'FINAL WARNING', '#ff1e26', '#090507'),
      never: makePlacardTex('DOSSIER PURGED // REDACTED', 'NEVER HERE', 'YOU WERE NEVER HERE', '#ffc638', '#07070c'),
      lights: makePlacardTex('PROTOCOL ZERO', 'LIGHTS OUT', 'TRANSMISSION TERMINATED', '#ff1e26', '#040406'),
    };
    this.countdownScreenMat = stageMat({ map: this.countdownTexs.three });

    this.monoliths = [];
    for (let i = 0; i < 4; i++) {
      const mg = new THREE.Group();
      const a = (i - 1.5) * 0.52;
      const dist = 3.80;
      mg.position.set(Math.sin(a) * dist, 1.45, -0.45 - Math.cos(a) * dist);
      mg.rotation.y = -a;

      const b = new Batch();
      b.add(paint(slab(1.52, 3.10, 0.22, 0.06), C.obsidian, { gloss: 0.8, glow: 0.2 }));
      b.add(paint(G.box(1.58, 0.09, 0.26), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, 1.50, 0]) }));
      b.add(paint(G.box(1.58, 0.09, 0.26), C.gold, { gloss: 0.95, glow: 1.2, m: xf([0, -1.50, 0]) }));
      b.add(paint(G.sphere(0.12, 12, 10), C.ruby, { glow: 2.4, m: xf([0, 1.68, 0]) }));
      mg.add(b.build(this.mat));

      const scr = new THREE.Mesh(paint(G.plane(1.36, 0.68), 0xffffff, { glow: 1.8 }), this.countdownScreenMat);
      scr.position.set(0, 0.30, 0.12);
      mg.add(scr);

      const cog = makeGear({ r: 0.48, rInner: 0.15, t: 0.06, teeth: 14, spokes: 5, col: C.crimson, rimCol: C.goldBright, glow: 1.25, mat: this.mat });
      cog.position.set(0, -0.68, 0.13);
      mg.add(cog);

      g.add(mg);
      this.monoliths.push({ group: mg, cog, idx: i });
    }

    // 12-Blade Mechanical Camera Iris Diaphragm ("Lights out" 124.94s – 127.68s)
    this.irisGroup = new THREE.Group();
    this.irisGroup.position.set(0, 1.48, -1.55);
    this.irisBlades = [];
    {
      const ring = new THREE.Mesh(paint(G.torus(1.65, 0.085, 10, 36), C.gold, { gloss: 0.95, glow: 1.2 }), this.mat);
      this.irisGroup.add(ring);
      const bladeGeo = paint(G.box(1.50, 0.60, 0.025), C.obsidian, { gloss: 0.75, glow: 0.15, m: xf([-0.68, 0, 0]) });
      for (let i = 0; i < 12; i++) {
        const pivot = new THREE.Group();
        const a = (i / 12) * TAU;
        pivot.position.set(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0.015 * (i % 2));
        pivot.rotation.z = a + 1.15;
        const bm = new THREE.Mesh(bladeGeo, this.mat);
        pivot.add(bm);
        this.irisGroup.add(pivot);
        this.irisBlades.push({ pivot, baseZ: a + 1.15 });
      }
    }
    this.group.add(this.irisGroup);
  }

  // -----------------------------------------------------------------------------------------------
  // 7. 1960s Spy Kinetic Lyric Banner Plaques
  // -----------------------------------------------------------------------------------------------
  _buildKineticBanners() {
    this.bannerGroup = new THREE.Group();
    this.bannerGroup.position.set(0, 3.22, -3.95);
    this.group.add(this.bannerGroup);

    const b = new Batch();
    b.add(paint(slab(2.90, 0.70, 0.08, 0.04), C.gold, { gloss: 0.95, glow: 1.3 }));
    b.add(paint(G.box(2.78, 0.60, 0.09), C.obsidian, { gloss: 0.6, glow: 0.15 }));
    this.bannerGroup.add(b.build(this.mat));

    this.bannerTexs = {
      gold: makePlacardTex('DEAD DROP // INTERCEPT DD-001', 'GOLD ON THE WIRE', 'FIRE IN THE SKY', '#ffc638'),
      spy: makePlacardTex('DOUBLE AGENT DOSSIER', 'LIE LIKE A SPY', 'SMILE LIKE AN ANGEL', '#ff1e26'),
      zero: makePlacardTex('CHRONOMETER OVERRIDE', 'COUNT DOWN TO ZERO', 'GOLD ON THE WIRE TONIGHT', '#ffc638'),
      car: makePlacardTex('MIDNIGHT RENDEZVOUS', 'BLACK CAR WAITING', 'WHERE THE STREETLIGHTS END', '#ffc638'),
      mirror: makePlacardTex('SURVEILLANCE GRID', 'EVERY MIRROR', 'EVERY EXIT HAS A PLACE TO GO', '#ffc638'),
      ten: makePlacardTex('SUBTERRANEAN DESCENT', 'TEN FLOORS UNDER', 'HOLD YOUR BREATH... HERE WE GO', '#ff1e26'),
      machine: makePlacardTex('ZORAXIS AUTOMATON CORE', 'STEEL MACHINE', 'WALTZING SLOW THROUGH A LASER BEAM', '#ff1e26'),
      red: makePlacardTex('SECURITY BREACH DETECTED', 'ONE RED LIGHT', 'THE SECOND THE GAME BEGINS', '#ff1e26'),
    };
    this.bannerScreenMat = stageMat({ map: this.bannerTexs.gold });
    const plane = new THREE.Mesh(paint(G.plane(2.70, 0.56), 0xffffff, { glow: 1.75 }), this.bannerScreenMat);
    plane.position.z = 0.052;
    this.bannerGroup.add(plane);
  }

  // -----------------------------------------------------------------------------------------------
  // Pure-function frame update
  // -----------------------------------------------------------------------------------------------
  update(t, ctx, retScale = 1) {
    if (t < 0 || retScale <= 0.001) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    this.group.scale.setScalar(retScale);

    const beats = ctx?.beats || { beats: [], downbeats: [] };
    const beat = env(beats.beats, t, 7);
    const down = env(beats.downbeats, t, 4);

    SHARED_BEAT.value = beat;
    const redAlertCue = sm(77.4, 78.0, t) * (1 - sm(84.8, 85.6, t));
    const blackoutCue = sm(125.0, 125.55, t) * (1 - sm(127.55, 127.75, t));
    this.domeU.uTime.value = t;
    this.domeU.uRedAlert.value = redAlertCue;
    this.domeU.uBlackout.value = blackoutCue;
    SHARED_RIM.value.setHex(redAlertCue > 0.4 ? 0xff2228 : 0xffc238);

    this.floorCompass.rotation.y = t * 0.24;

    // ---- 0. Intro Act (0.2s – 17.4s): Sunburst, Coils, 6 Spy Cameras & Combination Gyroscope ----
    const wIntro = sm(0.1, 0.8, t) * (1 - sm(16.3, 17.5, t));
    this.introGroup.visible = wIntro > 0.001;
    if (this.introGroup.visible) {
      this.introSunburst.scale.setScalar(wIntro * (0.85 + 0.15 * sm(0.8, 2.2, t) + beat * 0.06));
      this.introSunburst.rotation.z = t * 0.28;
      this.introCoils.scale.setScalar(wIntro);

      const wCam = sm(3.1, 3.9, t) * (1 - sm(7.8, 8.6, t));
      this.spyCamRing.visible = wCam > 0.001;
      if (this.spyCamRing.visible) {
        this.spyCamRing.scale.setScalar(wCam);
        this.spyCamRing.rotation.y = Math.sin(t * 0.9) * 0.18;
        for (const sc of this.spyCams) {
          sc.group.position.y = 1.52 + Math.sin(t * 2.2 + sc.idx) * 0.12;
        }
      }

      const wGyro = sm(7.8, 8.8, t) * (1 - sm(15.2, 15.9, t));
      this.deckGyro.visible = wGyro > 0.001;
      if (this.deckGyro.visible) {
        const burst = sm(14.5, 15.5, t);
        this.deckGyro.scale.setScalar(wGyro * (0.88 + burst * 0.35));
        this.deckGyroRings[0].rotation.set(t * 1.8, t * 1.1, 0);
        this.deckGyroRings[1].rotation.set(0, -t * 2.4, t * 1.6);
        this.deckGyroRings[2].rotation.set(t * 1.5, 0, -t * 2.2);
      }
    }

    // ---- 1. Act I: Black Car, Streetlights & Champagne Silence (17.2s – 28.5s + Finale) ----
    const wFinale = sm(127.6, 128.4, t) * (1 - sm(150.0, 152.5, t));
    const wCar = Math.max(sm(17.1, 18.2, t) * (1 - sm(27.6, 28.8, t)), wFinale * 0.85);
    this.actCar.visible = wCar > 0.001;
    if (this.actCar.visible) {
      this.actCar.scale.setScalar(wCar);
      const driveIn = sm(17.2, 20.2, t);
      this.spyCar.position.set(-0.25 + Math.sin(t * 0.6) * 0.15, 0.02 - (1 - wCar) * 0.8, -8.8 + driveIn * 5.0);
      this.spyCar.rotation.y = 0.38 + Math.sin(t * 0.45) * 0.08;

      for (const sl of this.streetlamps) {
        const offAt = 20.8 + (3 - sl.row) * 0.48;
        const on = t < 28.5 ? 1 - sm(offAt, offAt + 0.32, t) : 1;
        sl.bulbMat.uniforms.uTint.value.setScalar(0.18 + on * (0.95 + beat * 0.25));
        sl.coneMat.opacity = on * 0.24 * wCar;
      }

      const wChamp = sm(23.3, 24.3, t) * (1 - sm(27.6, 28.6, t));
      this.champagneGroup.visible = wChamp > 0.001;
      if (this.champagneGroup.visible) {
        this.champagneGroup.scale.setScalar(wChamp);
        for (const c of this.coupes) {
          const a = c.angle + t * 0.22;
          c.group.position.set(
            Math.sin(a) * c.r,
            c.yBase + Math.sin(t * 1.4 + c.phase) * 0.16,
            -0.5 - Math.cos(a) * c.r
          );
          c.group.rotation.set(0.28 * Math.sin(t + c.phase), -a, 0.22 * Math.cos(t * 0.8 + c.phase));
        }
        for (const b of this.bubbles) {
          const y = ((b.y0 + t * b.speed) % 3.4) - 0.3;
          const a = b.a + t * 0.35;
          b.mesh.position.set(Math.sin(a) * b.r, y, -0.5 - Math.cos(a) * b.r);
          b.mesh.scale.setScalar(b.s * (0.8 + 0.25 * Math.sin(t * 5 + b.a)));
        }
      }
    }

    // ---- 2. Act II: Mirror Portals & Vault Exit Doors (28.0s – 36.6s + Finale) ----
    const wMirrors = Math.max(sm(28.0, 29.0, t) * (1 - sm(35.8, 36.8, t)), wFinale * 0.75);
    this.actMirrors.visible = wMirrors > 0.001;
    if (this.actMirrors.visible) {
      const flip = t < 40 ? sm(32.5, 33.6, t) : 0.5 + 0.5 * Math.sin(t * 0.8);
      this.actMirrors.rotation.y = t * 0.14;
      for (const mp of this.mirrorPortals) {
        const rise = wMirrors;
        mp.group.position.y = -1.8 * (1 - rise) + 1.25 * rise + Math.sin(t * 1.8 + mp.idx) * 0.08;
        mp.group.scale.setScalar(rise);
        mp.group.rotation.y = mp.baseYaw + flip * Math.PI;
        mp.wheel.rotation.z = t * 2.2 * (mp.idx % 2 ? 1 : -1);
      }
      this.mirrorLaserGroup.visible = true;
      this.mirrorLaserGroup.rotation.y = -t * 0.35;
    }

    // ---- 3. Act III: Giant Astronomical Clock, Breathing City & 10-Floor Shaft (36.1s – 47.8s & 85.2s – 95.4s) ----
    const wClock1 = sm(36.1, 37.1, t) * (1 - sm(47.2, 48.0, t));
    const wClock2 = sm(85.1, 86.0, t) * (1 - sm(94.8, 95.6, t));
    const wClock = Math.max(wClock1, wClock2);
    this.actClock.visible = wClock > 0.001;
    if (this.actClock.visible) {
      const hold1 = sm(42.7, 43.1, t) * (1 - sm(44.8, 45.2, t));
      const hold2 = sm(91.0, 91.4, t) * (1 - sm(93.1, 93.5, t));
      const hold = Math.max(hold1, hold2);
      const effT = t - hold * 0.85;

      this.megaClock.scale.setScalar(wClock * (0.85 + 0.15 * sm(36.1, 38.0, t)));
      const tickStep = Math.floor(effT * (105.74 / 60) * 2);
      this.megaSecHand.rotation.z = -tickStep * (TAU / 60);
      this.megaMinHand.rotation.z = -effT * 0.45;
      this.megaHourHand.rotation.z = -effT * 0.08;
      this.escapement.rotation.z = Math.sin(tickStep * Math.PI) * 0.22 * (1 - hold);

      for (const ig of this.clockInnerGears) {
        ig.mesh.rotation.z = effT * ig.speed;
      }

      const breathe = 0.5 + 0.5 * Math.sin(effT * 2.4) + beat * 0.35;
      for (const ct of this.cityTowers) {
        const sy = (0.55 + 0.65 * breathe + 0.25 * Math.sin(effT * 1.8 + ct.phase)) * wClock;
        ct.mesh.scale.set(wClock, Math.max(0.05, sy), wClock);
      }

      const wShaft = Math.max(sm(40.2, 40.9, t) * (1 - sm(46.8, 47.6, t)), sm(88.6, 89.3, t) * (1 - sm(94.4, 95.2, t)));
      this.elevatorShaft.visible = wShaft > 0.001;
      if (this.elevatorShaft.visible) {
        const localT = t < 60 ? Math.max(0, t - 40.4) : Math.max(0, t - 88.8);
        const dropY = localT * 3.8 * (1 - hold * 0.7);
        for (const sr of this.shaftRings) {
          const y = -sr.floor * 2.4 + dropY + 2.0;
          sr.group.position.y = y;
          const fade = clamp01(1 - Math.abs(y - 1.2) / 7.5) * wShaft;
          sr.group.scale.setScalar(Math.max(0.001, fade));
          sr.group.visible = fade > 0.02;
        }
      }
    }

    // ---- 4. Act IV: Flight Through the Colossal Clockwork Tunnel (47.3–68.6s, 95.0–112.6s, Finale) ----
    const wTun1 = sm(47.2, 48.2, t) * (1 - sm(68.0, 69.0, t));
    const wTun2 = sm(94.8, 95.8, t) * (1 - sm(112.0, 113.0, t));
    const wTunnel = Math.max(wTun1, wTun2, wFinale);
    this.actTunnel.visible = wTunnel > 0.001;
    if (this.actTunnel.visible) {
      this.actTunnel.scale.setScalar(wTunnel);
      const speed = t > 127 ? 7.2 : t > 94 ? 6.2 : 5.2;
      const dist = t * speed;
      for (const sl of this.tunnelSlices) {
        const z = (((sl.zOffset + dist) % this.tunnelSpan) + this.tunnelSpan) % this.tunnelSpan - 24.0;
        sl.group.position.z = z;
        const envZ = sm(-24.0, -19.5, z) * (1 - sm(1.8, 4.0, z));
        sl.group.scale.setScalar(Math.max(0.001, envZ));
        sl.gLeft.rotation.z = t * 1.45 * (sl.idx % 2 ? 1 : -1);
        sl.gRight.rotation.z = -t * 1.45 * (sl.idx % 2 ? 1 : -1);
        sl.gTop.rotation.z = t * 2.2;
        sl.gBot.rotation.z = -t * 2.0;
        if (sl.pendulum) {
          sl.pendulum.rotation.z = Math.sin(t * 2.75 + sl.idx) * 0.52;
        }
      }
    }

    // ---- 5. Act V: The Steel Machine Automaton & Ruby Laser Waltz (68.3–85.6s, 95.0–112.5s, Finale) ----
    const wAuto1 = sm(68.2, 69.4, t) * (1 - sm(85.0, 86.0, t));
    const wAuto2 = sm(95.0, 96.2, t) * (1 - sm(112.0, 113.0, t));
    const wAuto = Math.max(wAuto1, wAuto2, wFinale);
    this.actAutomaton.visible = wAuto > 0.001;
    if (this.actAutomaton.visible) {
      const zTarget = wAuto1 > 0.1 ? -4.65 : -6.0;
      this.automaton.position.set(0, -2.5 * (1 - wAuto) + 1.15 * wAuto + Math.sin(t * 1.8) * 0.08, zTarget);
      this.automaton.scale.setScalar(wAuto);

      this.autoGyroRings[0].rotation.set(t * 2.8, t * 1.2, 0);
      this.autoGyroRings[1].rotation.set(0, -t * 3.4, t * 2.1);
      this.autoGyroRings[2].rotation.set(t * 2.2, 0, -t * 3.8);

      this.autoHead.rotation.y = Math.sin(t * 1.1) * 0.35 * (1 - redAlertCue * 0.7);
      this.autoHead.rotation.x = 0.08 + Math.cos(t * 1.5) * 0.08;
      this.cyclopsConeMat.opacity = (0.20 + redAlertCue * 0.58 + beat * 0.15) * wAuto;

      for (const arm of this.autoArms) {
        const s = arm.sx;
        arm.shoulder.rotation.x = -0.35 + Math.sin(t * 1.8 + s) * 0.38;
        arm.shoulder.rotation.z = s * (0.22 + Math.cos(t * 1.3) * 0.18);
        arm.forearm.rotation.x = -0.45 + Math.cos(t * 2.4 + s) * 0.35;
        arm.forearm.rotation.y = s * Math.sin(t * 1.6) * 0.28;
      }

      const wLasers = Math.max(sm(71.2, 72.2, t) * (1 - sm(85.0, 85.8, t)), wAuto2 * 0.7, wFinale * 0.85);
      this.laserGrid.visible = wLasers > 0.001;
      if (this.laserGrid.visible) {
        this.laserMat.opacity = 0.78 * wLasers * (0.8 + 0.2 * beat);
        const spinBoost = sm(78.5, 80.0, t) * (1 - sm(84.5, 85.5, t));
        this.laserGrid.rotation.y = t * (0.28 + spinBoost * 1.15);
        this.laserGrid.rotation.z = Math.sin(t * 1.2) * 0.18 * spinBoost;
        for (const lb of this.laserBeams) {
          const r = 3.5;
          lb.group.position.set(Math.sin(lb.a) * r, -0.3, -0.4 - Math.cos(lb.a) * r);
          lb.group.rotation.z = Math.sin(t * 1.6 + lb.idx * 0.7) * 0.55;
          lb.group.rotation.x = 0.32 + Math.cos(t * 1.3 + lb.idx * 0.5) * 0.42;
        }
      }
    }

    // ---- 6. Act VII: Bridge Countdown Monoliths & Mechanical Iris (112.4s – 127.8s) ----
    const wCount = sm(112.2, 112.9, t) * (1 - sm(127.4, 128.0, t));
    this.actCountdown.visible = wCount > 0.001;
    if (this.actCountdown.visible) {
      let tex = this.countdownTexs.three;
      if (t >= 124.8) tex = this.countdownTexs.lights;
      else if (t >= 119.55) tex = this.countdownTexs.never;
      else if (t >= 119.48) tex = this.countdownTexs.one;
      else if (t >= 119.18) tex = this.countdownTexs.two;
      else if (t >= 118.65) tex = this.countdownTexs.three;
      else if (t >= 117.65) tex = this.countdownTexs.never;
      else if (t >= 115.85) tex = this.countdownTexs.one;
      else if (t >= 114.55) tex = this.countdownTexs.two;
      this.countdownScreenMat.uniforms.map.value = tex;

      for (const m of this.monoliths) {
        m.group.scale.setScalar(wCount);
        m.group.position.y = 1.45 + Math.sin(t * 3 + m.idx) * 0.06;
        m.cog.rotation.z = -t * 2.4 * (m.idx % 2 ? 1 : -1);
      }
    }

    const wIris = sm(124.5, 125.1, t) * (1 - sm(127.65, 128.25, t));
    this.irisGroup.visible = wIris > 0.001;
    if (this.irisGroup.visible) {
      const shut = sm(124.9, 125.6, t) * (1 - sm(127.62, 127.95, t));
      this.irisGroup.scale.setScalar(0.65 + 0.35 * wIris);
      for (const b of this.irisBlades) {
        b.pivot.rotation.z = b.baseZ - shut * 0.98;
      }
    }

    // ---- 7. 1960s Spy Kinetic Lyric Banners ----
    let bannerKey = null;
    let bWeight = 0;
    const windows = [
      [0.3, 3.1, 'gold'],
      [3.4, 7.5, 'spy'],
      [8.1, 14.8, 'zero'],
      [17.4, 21.8, 'car'],
      [28.3, 33.2, 'mirror'],
      [40.4, 45.8, 'ten'],
      [47.5, 51.2, 'gold'],
      [51.4, 55.6, 'spy'],
      [68.5, 73.5, 'machine'],
      [77.5, 82.5, 'red'],
      [95.1, 99.4, 'gold'],
      [127.7, 134.5, 'gold'],
    ];
    for (const [t0, t1, key] of windows) {
      if (t >= t0 - 0.4 && t <= t1 + 0.4) {
        bannerKey = key;
        bWeight = sm(t0 - 0.3, t0 + 0.35, t) * (1 - sm(t1 - 0.35, t1 + 0.3, t));
        break;
      }
    }
    this.bannerGroup.visible = bWeight > 0.01;
    if (this.bannerGroup.visible && bannerKey) {
      this.bannerScreenMat.uniforms.map.value = this.bannerTexs[bannerKey];
      this.bannerGroup.scale.setScalar(bWeight * (1 + down * 0.06));
      this.bannerGroup.position.set(0, 3.22 + (1 - bWeight) * 0.45, -3.95);
      this.bannerGroup.rotation.z = Math.sin(t * 1.5) * 0.03;
    }
  }

  hide() {
    this.group.visible = false;
  }
}
