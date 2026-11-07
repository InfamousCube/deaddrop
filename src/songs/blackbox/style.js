// DD-003 "black-box" style: palette, hard-ramp toon shader (3-4 steps, rim, linear fog), flat unlit
// material, line material and the Saul-Bass sunburst dome. Colours are Gemini's DD-001 poster
// palette (hot) plus the style bible's petrol/cyan ramp (cold) and the amber blaze.
// All materials share the global uniforms in U (time, fog, key light, global fade) and take a
// per-scene uniform bag SU (scene fade, edge mode), so one shader program serves every scene.
import * as THREE from 'three';

// Comfort flag (read once at load): ?comfort=1 in the URL or localStorage 'dd.comfort' = '1'.
// It slows the S06 drop further (7 instead of 10 m/s) and thins the S07 shard burst.
export const COMFORT = (() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('comfort')) return q.get('comfort') !== '0';
    return localStorage.getItem('dd.comfort') === '1';
  } catch (e) { return false; }
})();

export const PAL = {
  black: 0x000000, velvet: 0x07070c, carmine: 0x6b090e, carmineDeep: 0x4a0a10, crimson: 0xd8141c,
  brassDark: 0x3a2a08, brass: 0xe5a428, gold: 0xffc638, goldHi: 0xffe888,
  creamDark: 0xb8a888, cream: 0xf7efe0, white: 0xffffff, red: 0xff1e26,
  petrolDeep: 0x05222c, petrol: 0x0b3945, teal: 0x217992, cyan: 0x47bcde,
  rust: 0x912118, orange: 0xe5623e, amber: 0xfdd890,
};

// hard ramps: [shadow, mid, lit, (highlight)]
export const RAMPS = {
  hot: [PAL.velvet, PAL.carmine, PAL.crimson],
  gold: [PAL.velvet, PAL.brass, PAL.gold, PAL.goldHi],
  cream: [PAL.velvet, PAL.creamDark, PAL.cream],
  cold: [PAL.black, PAL.petrol, PAL.teal, PAL.cyan],
  rust: [PAL.black, PAL.rust, PAL.orange],
  amber: [PAL.rust, PAL.orange, PAL.amber],
  black: [PAL.black, PAL.black, PAL.velvet], // pure-black silhouettes; they live from the rim
  steel: [PAL.black, PAL.petrol, PAL.teal],
};

// per colour world: default ramp of 'world' materials, rim, fog, sky preset
export const WORLDS = {
  hot: { ramp: RAMPS.hot, rim: PAL.gold, fog: PAL.velvet, near: 30, far: 170, sky: 'hot' },
  cold: { ramp: RAMPS.cold, rim: PAL.cyan, fog: PAL.black, near: 25, far: 160, sky: 'cold' },
  amber: { ramp: RAMPS.amber, rim: PAL.amber, fog: PAL.velvet, near: 40, far: 220, sky: 'amber' },
  black: { ramp: RAMPS.black, rim: PAL.gold, fog: PAL.black, near: 10, far: 80, sky: 'black' },
};

const col = (c) => (c instanceof THREE.Color ? c.clone() : new THREE.Color(c));
const v3 = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(...a));

// global uniforms (one set for the whole show)
export const U = {
  uTime: { value: 0 },
  uFogCol: { value: col(PAL.velvet) },
  uFogNear: { value: 30 },
  uFogFar: { value: 170 },
  uKey: { value: new THREE.Vector3(0, 0.6, -0.8).normalize() },
  uFade: { value: 1 }, // global fade (return to the lobby)
  // the active world's ramp, used by toon({ ramp: 'world' })
  uW0: { value: col(PAL.velvet) }, uW1: { value: col(PAL.carmine) }, uW2: { value: col(PAL.crimson) }, uW3: { value: col(PAL.crimson) },
  uWRim: { value: col(PAL.gold) },
};

// per-scene uniform bag
export function sceneUniforms() {
  return {
    uSceneFade: { value: 1 }, // 0 = black (fade-to-black / lights-out of the whole scene)
    uEdge: { value: 0 }, // edge mode: 1 = fills go black, flats vanish (pair with kit.edges lines)
  };
}

// ------------------------------------------------------------------------------------------------
const TOON_V = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying float vDepth; varying vec3 vC;
void main() {
  vec4 lp = vec4(position, 1.0);
  vec3 nrm = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp;
    nrm = mat3(instanceMatrix) * nrm;
  #endif
  vec4 wp = modelMatrix * lp;
  vN = normalize(mat3(modelMatrix) * nrm);
  vW = wp.xyz;
  vC = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  #ifdef USE_COLOR
    vC *= color.rgb;
  #endif
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const TOON_F = /* glsl */ `
uniform vec3 uC0, uC1, uC2, uC3; uniform float uSteps;
uniform vec3 uKey, uKeyO; uniform float uUseKeyO;
uniform vec3 uRim; uniform float uRimAmt, uRimTh;
uniform vec3 uFogCol; uniform float uFogNear, uFogFar, uFogAmt;
uniform float uFade, uSceneFade, uEdge, uOpacity, uBright;
uniform vec2 uTh; // ramp thresholds on dot(n, key)
varying vec3 vN; varying vec3 vW; varying float vDepth; varying vec3 vC;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  vec3 k = normalize(mix(uKey, uKeyO, uUseKeyO));
  float d = dot(n, k);
  vec3 c = d < uTh.x ? uC0 : (d < uTh.y ? uC1 : uC2);
  if (uSteps > 3.5 && d > 0.86) c = uC3;
  c *= vC;
  // razor rim on the dark side of silhouettes (no outlines: only where the surface turns away)
  float fr = 1.0 - abs(dot(n, v));
  float rim = step(uRimTh, fr) * step(d, uTh.y) * uRimAmt;
  c = mix(c, uRim, clamp(rim, 0.0, 1.0));
  c *= uBright;
  c = mix(c, vec3(0.0), uEdge);
  float f = clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0) * uFogAmt;
  c = mix(c, uFogCol, f);
  c *= uFade * uSceneFade;
  gl_FragColor = vec4(c, uOpacity);
  #include <colorspace_fragment>
}`;

const FLAT_V = /* glsl */ `
varying float vDepth; varying vec3 vC; varying vec2 vUv;
void main() {
  vec4 lp = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp;
  #endif
  vC = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  #ifdef USE_COLOR
    vC *= color.rgb;
  #endif
  vUv = uv;
  vec4 mv = viewMatrix * modelMatrix * lp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FLAT_F = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity, uBright;
uniform vec3 uFogCol; uniform float uFogNear, uFogFar, uFogAmt;
uniform float uFade, uSceneFade, uEdge, uEdgeKeep;
varying float vDepth; varying vec3 vC; varying vec2 vUv;
void main() {
  vec3 c = uColor * vC * uBright;
  float f = clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0) * uFogAmt;
  c = mix(c, uFogCol, f);
  float a = uOpacity * mix(1.0 - uEdge, 1.0, uEdgeKeep);
  c *= uFade * uSceneFade;
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

function rampOf(r) {
  if (r === 'world') return null;
  const a = typeof r === 'string' ? RAMPS[r] : r;
  if (!a) throw new Error('unknown ramp ' + r);
  return a;
}

// Hard-ramp toon material.
//   ramp: 'hot'|'cold'|'gold'|'cream'|'rust'|'amber'|'black'|'steel'|'world'|[c0,c1,c2,(c3)]
//   rim: colour | 'world' (default 'world'), rimAmt 0..1 (default 1), rimTh (default 0.62)
//   key: [x,y,z] own key direction (default: the scene key, U.uKey)
//   fog: 0..1 (default 1), opacity (default 1, sets transparent), side, vertexColors
//   bright: multiplier (for flashes), th: [t1, t2] ramp thresholds (default [-0.1, 0.45])
// Instancing (InstancedMesh, instanceColor) works automatically. Returns a ShaderMaterial whose
// uniforms (uC0..uC3, uRim, uRimAmt, uOpacity, uBright, uKeyO/uUseKeyO) can be animated.
export function toon(opts = {}, SU = sceneUniforms()) {
  const r = rampOf(opts.ramp ?? 'world');
  const u = {
    uC0: r ? { value: col(r[0]) } : U.uW0,
    uC1: r ? { value: col(r[1]) } : U.uW1,
    uC2: r ? { value: col(r[2]) } : U.uW2,
    uC3: r ? { value: col(r[3] ?? r[2]) } : U.uW3,
    uSteps: { value: r ? (r[3] !== undefined ? 4 : 3) : 3 },
    uKey: U.uKey, uKeyO: { value: v3(opts.key || [0, 1, 0]) }, uUseKeyO: { value: opts.key ? 1 : 0 },
    uRim: opts.rim === undefined || opts.rim === 'world' ? U.uWRim : { value: col(opts.rim ?? PAL.black) },
    uRimAmt: { value: opts.rim === null ? 0 : (opts.rimAmt ?? 1) },
    uRimTh: { value: opts.rimTh ?? 0.62 },
    uTh: { value: new THREE.Vector2(...(opts.th || [-0.1, 0.45])) },
    uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uFogAmt: { value: opts.fog ?? 1 },
    uFade: U.uFade, uSceneFade: SU.uSceneFade, uEdge: SU.uEdge,
    uOpacity: { value: opts.opacity ?? 1 }, uBright: { value: opts.bright ?? 1 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u, vertexShader: TOON_V, fragmentShader: TOON_F,
    side: opts.side ?? THREE.FrontSide, transparent: (opts.opacity ?? 1) < 1 || !!opts.transparent,
    depthWrite: opts.depthWrite ?? true, vertexColors: !!opts.vertexColors,
  });
}

// Flat unlit colour (lamps, glows, cones, flames, emissive wires, cut-out graphics).
//   color, opacity (0..1), additive (bool), fog (0..1, default 1), edgeKeep (1 = stays in edge mode),
//   side, depthWrite, depthTest, vertexColors, bright
export function flat(opts = {}, SU = sceneUniforms()) {
  const u = {
    uColor: { value: col(opts.color ?? PAL.white) }, uOpacity: { value: opts.opacity ?? 1 }, uBright: { value: opts.bright ?? 1 },
    uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uFogAmt: { value: opts.fog ?? 1 },
    uFade: U.uFade, uSceneFade: SU.uSceneFade, uEdge: SU.uEdge, uEdgeKeep: { value: opts.edgeKeep ?? 0 },
  };
  const transparent = (opts.opacity ?? 1) < 1 || !!opts.additive || !!opts.transparent;
  return new THREE.ShaderMaterial({
    uniforms: u, vertexShader: FLAT_V, fragmentShader: FLAT_F,
    side: opts.side ?? THREE.FrontSide, transparent,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: opts.depthWrite ?? !transparent, depthTest: opts.depthTest ?? true, vertexColors: !!opts.vertexColors,
  });
}

// ------------------------------------------------------------------------------------------------
// The sunburst dome (one per show; the scene that owns the current time drives it)
const DOME_V = /* glsl */ `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const DOME_F = /* glsl */ `
uniform vec3 uFocal; uniform float uRot, uRays[16], uRayR, uRayAmt;
uniform vec3 uRayA, uRayB, uZen, uHor, uHor2, uNadir; uniform vec3 uBand; // band: y0, y1, y2
uniform vec3 uRingCol; uniform float uRings, uRingPhase, uRingFreq;
uniform vec3 uSunCol, uSunRing; uniform float uSunR;
uniform vec3 uMoonDir, uMoonCol; uniform float uMoonR;
uniform float uStars, uAmt, uFade, uFlash; uniform vec3 uFlashCol;
varying vec3 vD;
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vD);
  float y = d.y;
  vec3 c = y > uBand.z ? uZen : (y > uBand.y ? uHor2 : (y > uBand.x ? uHor : uNadir));
  vec3 F = normalize(uFocal);
  vec3 R = normalize(abs(F.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : cross(F, vec3(0.0, 1.0, 0.0)));
  vec3 Up = cross(R, F);
  float dist = acos(clamp(dot(d, F), -1.0, 1.0));
  float ang = atan(dot(d, Up), dot(d, R)) + uRot;
  float fi = mod(floor(ang / 6.2831853 * 16.0), 16.0);
  int idx = int(fi);
  float on = uRays[idx] * step(dist, uRayR) * uRayAmt;
  vec3 rc = mod(fi, 2.0) < 0.5 ? uRayA : uRayB;
  c = mix(c, rc, clamp(on, 0.0, 1.0));
  float rw = abs(fract(dist * uRingFreq - uRingPhase) - 0.5);
  c = mix(c, uRingCol, step(rw, 0.014) * uRings * step(dist, uRayR)); // thin hard gold rings
  if (uSunR > 0.0) {
    c = mix(c, uSunRing, step(dist, uSunR * 1.28));
    c = mix(c, uSunCol, step(dist, uSunR));
  }
  if (uMoonR > 0.0) c = mix(c, uMoonCol, step(acos(clamp(dot(d, normalize(uMoonDir)), -1.0, 1.0)), uMoonR));
  float st = step(0.9985, hash(floor(d * 380.0))) * step(0.04, y) * uStars;
  c = mix(c, vec3(1.0), st);
  c *= uAmt * uFade;
  c = mix(c, uFlashCol, uFlash);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export const SKY_PRESETS = {
  hot: { zen: PAL.velvet, hor2: PAL.carmineDeep, hor: PAL.carmine, nadir: PAL.velvet, rayA: PAL.crimson, rayB: PAL.carmineDeep, ringCol: PAL.gold, rays: 1, rayR: 1.45, rings: 1, stars: 0, sunR: 0, moonR: 0 },
  cold: { zen: PAL.black, hor2: PAL.black, hor: PAL.petrolDeep, nadir: PAL.black, rayA: PAL.petrol, rayB: PAL.black, ringCol: PAL.teal, rays: 0, rayR: 1.2, rings: 0, stars: 0.6, sunR: 0, moonR: 0 },
  amber: { zen: PAL.rust, hor2: PAL.orange, hor: PAL.amber, nadir: PAL.velvet, rayA: PAL.orange, rayB: PAL.rust, ringCol: PAL.amber, rays: 1, rayR: 3.2, rings: 1, stars: 0, sunR: 0.12, sunCol: PAL.amber, sunRing: PAL.orange, moonR: 0 },
  black: { zen: PAL.black, hor2: PAL.black, hor: PAL.black, nadir: PAL.black, rayA: PAL.black, rayB: PAL.black, ringCol: PAL.black, rays: 0, rayR: 0, rings: 0, stars: 0, sunR: 0, moonR: 0 },
};

export function buildDome(radius = 280) {
  const su = {
    uFocal: { value: new THREE.Vector3(0, Math.sin(0.12), -Math.cos(0.12)) },
    uRot: { value: 0 }, uRays: { value: new Array(16).fill(1) }, uRayR: { value: 1.45 }, uRayAmt: { value: 1 },
    uRayA: { value: col(PAL.crimson) }, uRayB: { value: col(PAL.carmineDeep) },
    uZen: { value: col(PAL.velvet) }, uHor: { value: col(PAL.carmine) }, uHor2: { value: col(PAL.carmineDeep) }, uNadir: { value: col(PAL.velvet) },
    uBand: { value: new THREE.Vector3(-0.03, 0.05, 0.16) },
    uRingCol: { value: col(PAL.gold) }, uRings: { value: 1 }, uRingPhase: { value: 0 }, uRingFreq: { value: 3.8 },
    uSunCol: { value: col(PAL.amber) }, uSunRing: { value: col(PAL.orange) }, uSunR: { value: 0 },
    uMoonDir: { value: new THREE.Vector3(0.34, 0.26, -0.9).normalize() }, uMoonCol: { value: col(PAL.cyan) }, uMoonR: { value: 0 },
    uStars: { value: 0 }, uAmt: { value: 1 }, uFade: U.uFade, uFlash: { value: 0 }, uFlashCol: { value: col(PAL.crimson) },
  };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.ShaderMaterial({
    uniforms: su, vertexShader: DOME_V, fragmentShader: DOME_F, side: THREE.BackSide, depthWrite: false,
  }));
  mesh.name = 'bb-dome';
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  // reset to a preset (name or object) plus overrides; called every frame by the show
  const setCol = (k, v) => su[k].value.set(v);
  const apply = (preset, over = {}) => {
    // preset: a name ('hot'|'cold'|'amber'|'black') or { base: name, ...overrides }
    const base = typeof preset === 'object' ? (preset.base || 'black') : preset;
    const p = { ...(SKY_PRESETS[base] || SKY_PRESETS.black), ...(typeof preset === 'object' ? preset : {}), ...over };
    setCol('uZen', p.zen); setCol('uHor2', p.hor2); setCol('uHor', p.hor); setCol('uNadir', p.nadir);
    setCol('uRayA', p.rayA); setCol('uRayB', p.rayB); setCol('uRingCol', p.ringCol);
    su.uRays.value.fill(p.rays ?? 1);
    su.uRayR.value = p.rayR ?? 1.45; su.uRayAmt.value = p.rayAmt ?? 1;
    su.uRings.value = p.rings ?? 1; su.uRingPhase.value = p.ringPhase ?? 0; su.uRingFreq.value = p.ringFreq ?? 3.8;
    su.uRot.value = p.rot ?? 0;
    su.uStars.value = p.stars ?? 0;
    su.uSunR.value = p.sunR ?? 0; if (p.sunCol !== undefined) setCol('uSunCol', p.sunCol); else setCol('uSunCol', PAL.amber);
    if (p.sunRing !== undefined) setCol('uSunRing', p.sunRing); else setCol('uSunRing', PAL.orange);
    su.uMoonR.value = p.moonR ?? 0; if (p.moonDir) su.uMoonDir.value.set(...p.moonDir).normalize();
    if (p.focal) su.uFocal.value.set(...p.focal).normalize(); else su.uFocal.value.set(0, Math.sin(0.12), -Math.cos(0.12));
    if (p.band) su.uBand.value.set(...p.band); else su.uBand.value.set(-0.03, 0.05, 0.16);
    su.uAmt.value = p.amt ?? 1;
    su.uFlash.value = 0;
  };
  return { mesh, u: su, apply };
}

// ------------------------------------------------------------------------------------------------
// small geometry helpers
export function flatShade(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
