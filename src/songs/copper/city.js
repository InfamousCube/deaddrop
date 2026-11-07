// The engineer's heist maquette: a 1:60 night city around the listening station. Everything that
// moves is computed on the GPU from song time and a handful of uniforms, so the CPU only writes
// uniforms each frame. Street grid: streets on multiples of P (x = 0 is the avenue straight ahead).
import * as THREE from 'three';
import { paint, G, Batch, xf } from '../../gfx/shade.js';
import { SU, COMMON_PARS, poster, PAL, Sprites, ribbonMat, ribbonGeo, C } from './mat.js';
import { letterStrip, faceMask, faceMaskWink } from './text.js';
import { rng } from '../../gfx/fracture.js';

export const GRID = { B: 1.7, S: 0.32, P: 2.02 };
export const CITY = {
  shaftR: 4.25, plazaR: 4.95, maxR: 34,
  avenueLamps: [-5.0, -6.6, -8.2, -9.8, -11.4],
  carZ: -12.9,
  title: { x: 0, z: -15.15, w: 3.72, d: 1.7, h: 0.75 },
  tower: { x: 7.07, z: -7.07 },
  mirrors: [[-5.05, -5.05, 2.0], [-3.03, -9.09, 2.4], [-7.07, -1.01, 1.75]],
};

// ---------------------------------------------------------------------------------------------
// Buildings: instanced unit boxes (y 0..1). iP = (x, z, rotY, delay), iS = (w, h, d, seed),
// iD = (style, lightBias, colourIdx, ring r)
const BLD_V = /* glsl */ `
uniform float uRise, uBreath, uTime;
attribute vec4 iP, iS, iD;
varying vec3 vL; varying vec3 vNl; varying vec3 vW; varying vec3 vN; varying vec4 vS; varying vec4 vD; varying float vH;
float hash1(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float k = clamp((uRise - iP.w) / 0.32, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  float over = sin(k * 3.14159) * 0.05;
  float br = 1.0 + uBreath * (0.55 + 0.45 * hash1(iS.w * 7.1));
  float h = iS.y * br;
  vec3 lp = vec3(position.x * iS.x, position.y * h, position.z * iS.z);
  vL = vec3(lp.x, position.y * iS.y, lp.z); // window space ignores breathing (windows stretch)
  vNl = normal;
  float c = cos(iP.z), s = sin(iP.z);
  vec3 p = vec3(c * lp.x + s * lp.z, lp.y - (1.0 - k - over) * (h + 0.02), -s * lp.x + c * lp.z);
  vec3 n = vec3(c * normal.x + s * normal.z, normal.y, -s * normal.x + c * normal.z);
  p.x += iP.x; p.z += iP.y;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vS = iS; vD = iD; vH = h;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BLD_F = /* glsl */ `
${COMMON_PARS}
uniform float uLit, uLitR, uSilence, uFace, uWink, uMirror, uSurge;
uniform sampler2D uFaceTex, uWinkTex;
uniform vec3 uBody[4];
varying vec3 vL; varying vec3 vNl; varying vec3 vW; varying vec3 vN; varying vec4 vS; varying vec4 vD; varying float vH;
float hash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main() {
  vec3 n = normalize(vN);
  int ci = int(vD.z + 0.5);
  vec3 body = uBody[ci];
  float style = vD.x;
  bool glass = style > 1.5 && style < 2.5;
  if (glass) body = vec3(0.05, 0.07, 0.1);
  vec3 L = lightAt(n, vW);
  vec3 c = body * L;
  // contact darkening at the street and a lighter roof edge
  c *= 0.55 + 0.45 * smoothstep(0.0, 0.12, vL.y);
  vec3 v = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  if (abs(vNl.y) < 0.5) {
    // facade: u runs along the face, y up; windows 3 m floors at 1:60
    float u = abs(vNl.x) > 0.5 ? vL.z * sign(vNl.x) : vL.x * -sign(vNl.z);
    float fw = vS.x * abs(vNl.z) + vS.z * abs(vNl.x);
    float fh = 0.05, cw = glass ? 0.034 : 0.044;
    vec2 g = vec2((u + fw * 0.5) / cw, vL.y / fh);
    vec2 cell = floor(g);
    vec2 f = fract(g);
    float faceId = vNl.x * 3.0 + vNl.z * 5.0;
    float r = hash(vec3(cell, vS.w * 17.0 + faceId));
    float rf = hash(vec3(cell.y, vS.w * 3.1 + faceId, 9.0));
    r = max(r, step(0.55, rf) * 0.999); // whole dark floors: lit windows come in bands
    float frac = uLit * vD.y * (glass ? 0.35 : 1.0);
    float ring = step(uLitR, vD.w);
    frac *= ring * (1.0 - uSilence * (vD.y > 1.5 ? 0.0 : 1.0));
    float lit = step(r, frac);
    // surge: every window flickers on together (city breathing in)
    lit = max(lit, step(r, uSurge * 0.85) * ring);
    vec3 warm = mix(vec3(1.0, 0.78, 0.45), vec3(0.62, 0.78, 1.0), step(0.82, hash(vec3(cell.yx, vS.w))));
    // the mirror towers show a face across their front
    if (glass && uFace > 0.0) {
      vec2 fuv = vec2((u + fw * 0.5) / fw, vL.y / vS.y);
      vec2 q = (floor(fuv * vec2(fw / cw, vS.y / fh)) + 0.5) / vec2(fw / cw, vS.y / fh);
      vec4 m = mix(texture2D(uFaceTex, vec2(q.x, 1.0 - (q.y * 1.25 - 0.18))), texture2D(uWinkTex, vec2(q.x, 1.0 - (q.y * 1.25 - 0.18))), uWink);
      float inside = step(0.0, q.y * 1.25 - 0.18) * step(q.y * 1.25 - 0.18, 1.0);
      float fm = max(m.r, m.g) * inside;
      lit = mix(lit * (1.0 - uFace * 0.9), step(0.5, fm), uFace);
      warm = mix(warm, m.r > 0.5 ? vec3(1.0, 0.25, 0.18) : vec3(1.0, 0.86, 0.6), uFace * fm);
    }
    float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.22, f.y) * step(f.y, 0.74);
    if (glass) win = step(0.12, f.x) * step(0.88, 1.0 - f.y + 0.76) * step(0.14, f.y);
    // fade the pattern to its average where it is smaller than a pixel (no shimmer in the headset)
    float aa = clamp(max(fwidth(g.x), fwidth(g.y)) * 1.6 - 0.4, 0.0, 1.0);
    float avgWin = glass ? 0.6 : 0.24;
    float avgLit = clamp(frac + uSurge * 0.3, 0.0, 1.0);
    vec3 dark = glass ? vec3(0.03, 0.05, 0.08) + uSky * 0.25 : vec3(0.02, 0.03, 0.05);
    vec3 winC = mix(dark, warm * (0.75 + 0.5 * hash(vec3(cell, 5.0))), lit);
    vec3 avgC = mix(dark, warm, avgLit * 0.45) * avgWin + c * (1.0 - avgWin);
    vec3 pat = mix(c, winC, win);
    c = mix(pat, avgC, aa);
    // ground floor shops
    if (vL.y < fh * 0.9 && !glass) c += vec3(0.9, 0.55, 0.25) * 0.35 * step(0.5, hash(vec3(floor(u / 0.09), vS.w, 3.0))) * step(0.3, vL.y / fh) * ring * uLit;
    // mirror glint sweeping across the glass towers
    if (glass) {
      float sweep = exp(-pow((vL.y / vS.y - uMirror * 1.6 + 0.3 + u * 0.4), 2.0) * 40.0);
      c += vec3(1.0, 0.85, 0.6) * sweep * 1.4 * step(0.0, uMirror) * (1.0 - step(1.0, uMirror));
      c += fres * vec3(0.25, 0.32, 0.45);
    }
  } else {
    // roof
    c = body * 0.8 * L + vec3(0.02);
    float edge = max(abs(vL.x) / (vS.x * 0.5), abs(vL.z) / (vS.z * 0.5));
    c = mix(c, c * 1.6 + vec3(0.03), smoothstep(0.86, 0.92, edge));
  }
  c += uRimCol * fres * 0.3;
  gl_FragColor = vec4(finish(c, vW), 1.0);
  #include <colorspace_fragment>
}`;

// Ground with streets, curbs, copper centre lines, lamp pools and the black car's headlight cone.
const GND_V = /* glsl */ `
varying vec3 vW; varying vec3 vLoc;
void main() { vLoc = position; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const GND_F = /* glsl */ `
${COMMON_PARS}
uniform float uGP, uGS, uLamps, uAvenue, uCarLights, uRouteGlow, uLit;
uniform vec3 uCar;
varying vec3 vW; varying vec3 vLoc;
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 p = vLoc.xz;
  float r = length(p);
  vec2 d = abs(fract(p / uGP + 0.5) - 0.5) * uGP; // distance to nearest street centre per axis
  float streetX = step(d.x, uGS * 0.5), streetZ = step(d.y, uGS * 0.5);
  float street = max(streetX, streetZ);
  vec3 asphalt = vec3(0.045, 0.055, 0.075);
  vec3 block = vec3(0.09, 0.1, 0.125);
  vec3 c = mix(block, asphalt, street);
  // curb
  float curb = (1.0 - street) * (step(min(d.x, d.y), uGS * 0.5 + 0.03));
  c = mix(c, vec3(0.16, 0.17, 0.19), curb);
  // dashed copper centre lines
  float dashX = streetX * (1.0 - streetZ) * step(d.x, 0.006) * step(0.5, fract(p.y * 3.0));
  float dashZ = streetZ * (1.0 - streetX) * step(d.y, 0.006) * step(0.5, fract(p.x * 3.0));
  c += vec3(0.7, 0.36, 0.14) * 0.6 * max(dashX, dashZ);
  // plaza ring around the shaft
  float plaza = 1.0 - step(${CITY.plazaR.toFixed(2)}, r);
  c = mix(c, vec3(0.11, 0.115, 0.13) + 0.02 * step(0.5, fract(atan(p.y, p.x) * 6.0)), plaza);
  c += vec3(0.7, 0.38, 0.16) * 0.8 * (smoothstep(0.03, 0.0, abs(r - 4.62)) + smoothstep(0.02, 0.0, abs(r - 4.4)));
  vec3 L = lightAt(vec3(0.0, 1.0, 0.0), vW);
  c *= L * 1.05;
  // lamp pools: every street gets warm pools every half block (staggered switching via hash)
  vec2 c1 = vec2(floor(p.x / uGP + 0.5) * uGP, (floor(p.y / uGP) + 0.5) * uGP);
  vec2 c2 = vec2((floor(p.x / uGP) + 0.5) * uGP, floor(p.y / uGP + 0.5) * uGP);
  float on1 = step(10.46 + hash2(c1) * 1.4, uTime), on2 = step(10.46 + hash2(c2) * 1.4, uTime);
  float pool = (exp(-dot(p - c1, p - c1) * 22.0) * on1 * streetX + exp(-dot(p - c2, p - c2) * 22.0) * on2 * streetZ) * uLamps * (1.0 - smoothstep(15.0, 17.0, r));
  // the avenue's own lamps (x = 0) switch on near to far: uAvenue = lamps lit
  float az = -p.y;
  float ai = floor((az - 5.0) / 1.6 + 0.5);
  float aOn = step(0.0, ai) * step(ai, 4.0) * step(ai + 0.5, uAvenue);
  float apool = exp(-pow(d.x, 2.0) * 60.0 - pow(az - (5.0 + ai * 1.6), 2.0) * 3.0) * aOn * step(abs(p.x), uGS);
  c += vec3(1.0, 0.72, 0.38) * (pool * 0.5 * (1.0 - step(abs(p.x), uGS) * step(4.0, az) * step(az, 12.5)) + apool * 0.9) * uLit;
  // headlight cone of the waiting car (pointing +z, toward the player)
  vec2 cp = p - uCar.xz;
  float cone = smoothstep(0.0, 0.25, cp.y) * exp(-cp.y * 0.55) * exp(-pow(cp.x / (0.05 + cp.y * 0.12), 2.0));
  c += vec3(1.0, 0.86, 0.6) * cone * uCarLights * 0.9;
  gl_FragColor = vec4(finish(c, vW), 1.0);
  #include <colorspace_fragment>
}`;

// Telephone wires around the plaza: copper, a gold pulse runs both ways from the front.
const WIRE_V = /* glsl */ `
attribute float aAng;
varying float vAng; varying vec3 vW;
void main() { vAng = aAng; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WIRE_F = /* glsl */ `
uniform float uExposure, uFade, uWireP, uWireAmt;
varying float vAng; varying vec3 vW;
void main() {
  float dAng = abs(mod(vAng + 1.5708 + 3.14159, 6.28318) - 3.14159); // 0 at the front, pi behind
  float p = uWireP * 3.14159;
  float lit = step(dAng, p) * uWireAmt;
  float head = exp(-pow((dAng - p) * 9.0, 2.0)) * step(0.001, uWireP) * (1.0 - step(1.0, uWireP));
  vec3 c = vec3(0.32, 0.16, 0.07) * 0.6 + vec3(1.0, 0.7, 0.25) * lit * 0.9 + vec3(1.0, 0.95, 0.7) * head * 3.0;
  gl_FragColor = vec4(c * uExposure * uFade, 1.0);
  #include <colorspace_fragment>
}`;

// Sign letters: one quad per letter, lit at its own time (aOn), neon flicker as it comes on
const SIGN_V = /* glsl */ `
attribute float aOn; attribute float aIdx;
varying vec2 vUv; varying float vOn; varying float vIdx;
void main() { vUv = uv; vOn = aOn; vIdx = aIdx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SIGN_F = /* glsl */ `
uniform sampler2D map; uniform float uTime, uExposure, uFade, uSignAmt, uN;
varying vec2 vUv; varying float vOn; varying float vIdx;
void main() {
  vec4 t = texture2D(map, vec2((vIdx + vUv.x) / uN, vUv.y));
  float dt = uTime - vOn;
  float on = step(0.0, dt) * (dt < 0.22 ? step(0.5, fract(dt * 23.0)) * 0.7 + 0.3 : 1.0);
  on *= uSignAmt;
  vec3 off = vec3(0.09, 0.07, 0.06);
  vec3 c = mix(off * t.rgb, t.rgb * 1.7, on);
  if (t.a < 0.35) discard;
  gl_FragColor = vec4(c * uExposure * uFade, 1.0);
  #include <colorspace_fragment>
}`;

export function buildCity() {
  const group = new THREE.Group();
  group.name = 'copper-city';
  const R = rng(2002);
  const U = {
    uRise: { value: 0 }, uBreath: { value: 0 }, uLit: { value: 1 }, uLitR: { value: 0 }, uSilence: { value: 0 },
    uFace: { value: 0 }, uWink: { value: 0 }, uMirror: { value: -1 }, uSurge: { value: 0 },
    uLamps: { value: 0 }, uAvenue: { value: 0 }, uCarLights: { value: 0 }, uRouteGlow: { value: 0 },
    uCar: { value: new THREE.Vector3(-0.07, 0, CITY.carZ) },
    uWireP: { value: 0 }, uWireAmt: { value: 0 }, uSignAmt: { value: 1 },
  };
  const { P, S } = GRID;

  // ---- ground ----
  const ground = new THREE.Mesh(new THREE.RingGeometry(CITY.shaftR, 44, 120, 6).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...SU, uGP: { value: P }, uGS: { value: S }, uLamps: U.uLamps, uAvenue: U.uAvenue, uCarLights: U.uCarLights, uCar: U.uCar, uRouteGlow: U.uRouteGlow, uLit: U.uLit },
    vertexShader: GND_V, fragmentShader: GND_F,
  }));
  ground.name = 'city-ground';
  group.add(ground);

  // ---- buildings ----
  const lots = [];
  const reserved = [
    { x: CITY.tower.x, z: CITY.tower.z, r: 1.15 },
    ...CITY.mirrors.map(([x, z]) => ({ x, z, r: 0.95 })),
  ];
  const isReserved = (x, z) => reserved.some((q) => Math.hypot(x - q.x, z - q.z) < q.r)
    || (Math.abs(x - CITY.title.x) < CITY.title.w / 2 + 0.05 && Math.abs(z - CITY.title.z) < CITY.title.d / 2 + 0.05);
  const angDelay = (x, z) => {
    // the city comes up sector by sector as the walls go down: front, right, back, left
    const a = Math.atan2(x, -z); // 0 front, +pi/2 right, +-pi back, -pi/2 left
    let k = a >= -Math.PI / 4 ? (a + Math.PI / 4) / (Math.PI * 2) : (a + Math.PI * 2 + Math.PI / 4) / (Math.PI * 2);
    return k;
  };
  const N = Math.ceil(CITY.maxR / P);
  for (let i = -N; i < N; i++) {
    for (let j = -N; j < N; j++) {
      const bx0 = i * P + S / 2, bx1 = (i + 1) * P - S / 2, bz0 = j * P + S / 2, bz1 = (j + 1) * P - S / 2;
      const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
      const near = Math.hypot(Math.max(Math.abs(cx) - GRID.B / 2, 0), Math.max(Math.abs(cz) - GRID.B / 2, 0));
      const rC = Math.hypot(cx, cz);
      if (near < CITY.plazaR + 0.12 || rC > CITY.maxR) continue;
      // lots: 1..3 per side
      const nx = 1 + Math.floor(R() * 2.4), nz = 1 + Math.floor(R() * 2.4);
      for (let a = 0; a < nx; a++) {
        for (let b = 0; b < nz; b++) {
          const lx0 = bx0 + (bx1 - bx0) * a / nx, lx1 = bx0 + (bx1 - bx0) * (a + 1) / nx;
          const lz0 = bz0 + (bz1 - bz0) * b / nz, lz1 = bz0 + (bz1 - bz0) * (b + 1) / nz;
          const x = (lx0 + lx1) / 2, z = (lz0 + lz1) / 2;
          if (isReserved(x, z) || Math.hypot(x, z) < CITY.plazaR + 0.45) continue;
          if (R() < 0.08) continue; // a few empty lots (parking, little parks)
          const m = 0.03 + R() * 0.05;
          const w = lx1 - lx0 - m * 2, d = lz1 - lz0 - m * 2;
          const r = Math.hypot(x, z);
          const base = 0.08 + 0.03 * r;
          let h = base * (0.4 + 1.7 * Math.pow(R(), 2.4));
          // downtown: front-left and front-right corridors are taller
          const ang = Math.atan2(x, -z);
          if (r > 9 && Math.abs(Math.abs(ang) - 0.75) < 0.35) h *= 1.7;
          h = Math.max(0.07, Math.min(h, 2.6));
          lots.push({ x, z, w, d, h, rot: 0, style: h > 1.0 && R() < 0.4 ? 1 : 0, r, seed: R() * 100 });
        }
      }
    }
  }
  // set-back crowns on some tall towers
  const crowns = [];
  for (const l of lots) if (l.style === 1) crowns.push({ x: l.x, z: l.z, w: l.w * 0.66, d: l.d * 0.66, h: l.h * 0.22, base: l.h, r: l.r, seed: l.seed });
  // mirror towers (glass, face windows)
  const mirrors = CITY.mirrors.map(([x, z, h], k) => ({ x, z, w: 1.25, d: 0.6, h, rot: Math.atan2(-x, -z) + (k - 1) * 0.08, style: 2, r: Math.hypot(x, z) }));
  // title building closing the avenue
  const T = CITY.title;
  const titleB = { x: T.x, z: T.z, w: T.w, d: T.d, h: T.h, rot: 0, style: 0, r: Math.hypot(T.x, T.z), bias: 1.2 };

  const all = [...lots, ...mirrors, titleB];
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const mkInst = (list, extraBase = false) => {
    const g = new THREE.InstancedBufferGeometry();
    g.index = box.index; g.setAttribute('position', box.attributes.position); g.setAttribute('normal', box.attributes.normal);
    const n = list.length;
    const iP = new Float32Array(n * 4), iS = new Float32Array(n * 4), iD = new Float32Array(n * 4);
    list.forEach((l, k) => {
      iP.set([l.x, l.z, l.rot || 0, angDelay(l.x, l.z) * 0.8 + Math.min(1, l.r / CITY.maxR) * 0.2], k * 4);
      iS.set([l.w, l.h, l.d, l.seed ?? R() * 100], k * 4);
      iD.set([l.style, l.bias ?? (0.55 + R() * 0.6), Math.floor(R() * 4), l.r], k * 4);
    });
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4));
    g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4));
    g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4));
    g.instanceCount = n;
    return g;
  };
  const faceTex = faceMask(), winkTex = faceMaskWink();
  const bodyCols = [C(0x1a2333), C(0x222b3b), C(0x2a2a33), C(0x1d2a33)];
  const bldMat = new THREE.ShaderMaterial({
    uniforms: { ...SU, uRise: U.uRise, uBreath: U.uBreath, uLit: U.uLit, uLitR: U.uLitR, uSilence: U.uSilence, uFace: U.uFace, uWink: U.uWink, uMirror: U.uMirror, uSurge: U.uSurge, uFaceTex: { value: faceTex }, uWinkTex: { value: winkTex }, uBody: { value: bodyCols } },
    vertexShader: BLD_V, fragmentShader: BLD_F,
  });
  const bld = new THREE.Mesh(mkInst(all), bldMat);
  bld.frustumCulled = false;
  bld.name = 'city-buildings';
  group.add(bld);
  // set-back crowns ride on their tower (same shader, lifted by the tower's height iBase)
  const crownMat = new THREE.ShaderMaterial({
    uniforms: bldMat.uniforms,
    vertexShader: BLD_V.replace('attribute vec4 iP, iS, iD;', 'attribute vec4 iP, iS, iD; attribute float iBase;')
      .replace('p.x += iP.x;', 'p.y += iBase * br - (1.0 - k - over) * (iBase * br + 0.02); p.x += iP.x;'),
    fragmentShader: BLD_F,
  });
  const cg = mkInst(crowns.map((c) => ({ ...c, bias: 0.9 })));
  cg.setAttribute('iBase', new THREE.InstancedBufferAttribute(new Float32Array(crowns.map((c) => c.base)), 1));
  const crownMesh = new THREE.Mesh(cg, crownMat);
  crownMesh.frustumCulled = false;
  group.add(crownMesh);

  // ---- rooftop furniture: water tanks + antennas (painted, instanced via merged copies) ----
  const roof = new Batch();
  const tankG = (x, y, z, s) => {
    roof.add(paint(G.cyl(0.035 * s, 0.035 * s, 0.06 * s, 10), 0x5a4030, { m: xf([x, y + 0.045 * s, z]) }));
    roof.add(paint(G.cone(0.04 * s, 0.03 * s, 10), 0x3a2a20, { m: xf([x, y + 0.09 * s, z]) }));
    for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) roof.add(paint(G.box(0.004 * s, 0.03 * s, 0.004 * s), 0x20242a, { m: xf([x + a * 0.025 * s, y + 0.015 * s, z + b * 0.025 * s]) }));
  };
  // roof items are static: only placed on mid-size buildings so that they read; they rise with the
  // city through a shared vertical offset on the whole roof batch (see update: roofMesh.position.y)
  const roofSprites = [];
  for (const l of lots) {
    if (l.r < 13 && l.h > 0.25 && l.h < 1.3 && R() < 0.3) tankG(l.x + (R() - 0.5) * l.w * 0.4, l.h, l.z + (R() - 0.5) * l.d * 0.4, 0.9 + R() * 0.5);
    if (l.h > 1.2 && R() < 0.6) {
      const ah = 0.2 + R() * 0.3;
      roof.add(paint(G.box(0.008, ah, 0.008), 0x30343a, { m: xf([l.x, l.h + ah / 2, l.z]) }));
      roofSprites.push([l.x, l.h + ah + 0.01, l.z]);
    }
  }
  const roofMesh = roof.build(poster());
  roofMesh.name = 'city-roofs';
  group.add(roofMesh);

  // ---- sprites: street lamps, traffic, aviation lights, the car's headlights, tower glow ----
  const fx = new Sprites(5000);
  const lampCol = C(0xffc070);
  // city lamps: one per block edge, mid-block, on alternating sides; switched on in a staggered
  // wave at "don't ask me why" (t0 per lamp), their pools are drawn by the ground shader
  const poles = new Batch();
  const h2 = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let i = -8; i <= 8; i++) {
    for (let j = -8; j <= 8; j++) {
      for (const vert of [true, false]) {
        const cx = vert ? i * P : (i + 0.5) * P, cz = vert ? (j + 0.5) * P : j * P;
        const r = Math.hypot(cx, cz);
        if (r < CITY.plazaR + 0.25 || r > 16.5) continue;
        if (vert && i === 0 && cz < -4 && cz > -14.5) continue; // the avenue has its own lamps
        const side = ((i + j) % 2 ? 1 : -1) * 0.19;
        const sx = vert ? cx + side : cx, sz = vert ? cz : cz + side;
        const t0 = 10.46 + h2(cx, cz) * 1.4;
        fx.add({ p: [sx, 0.16, sz], col: lampCol, i: 1.2, size: 0.07, group: 1, kind: 0, t0, t1: 1e4 });
        poles.add(paint(G.box(0.006, 0.16, 0.006), 0x2a2e34, { m: xf([sx, 0.08, sz]) }));
      }
    }
  }
  // avenue lamps: group 2, each lamp its own on-time is driven by the show via uniforms -> use
  // per-lamp groups 12..16 so they can switch one by one
  CITY.avenueLamps.forEach((z, k) => {
    for (const sx of [-0.19, 0.19]) {
      fx.add({ p: [sx * 0.75, 0.255, z], col: lampCol, i: 1.7, size: 0.2, group: 12 + k, kind: 4 });
      fx.add({ p: [sx * 0.75, 0.255, z], col: 0xfff2d0, i: 1.8, size: 0.045, group: 12 + k, kind: 0 });
      poles.add(paint(G.cyl(0.006, 0.009, 0.26, 6), 0x2a2e34, { m: xf([sx, 0.13, z]) }));
      poles.add(paint(G.box(0.1, 0.008, 0.008), 0x2a2e34, { m: xf([sx * 0.87, 0.262, z]) }));
      poles.add(paint(G.cone(0.022, 0.02, 8, true), 0x2a2e34, { m: xf([sx * 0.75, 0.262, z]) }));
    }
  });
  const poleMesh = poles.build(poster());
  group.add(poleMesh);
  // traffic: loops along streets (group 3)
  for (let c = 0; c < 70; c++) {
    const alongX = R() < 0.5;
    const line = (Math.floor(R() * 16) - 8) * P;
    if (Math.abs(line) < 5.5) continue;
    const dir = R() < 0.5 ? 1 : -1, sp = 0.35 + R() * 0.35;
    const len = 30, lane = 0.06 * dir;
    const start = -len / 2 * dir;
    const p = alongX ? [start, 0.012, line + lane] : [line - lane, 0.012, start];
    const v = alongX ? [sp * dir, 0, 0] : [0, 0, sp * dir];
    const ph = R() * 100;
    const ahead = alongX ? [0.03 * dir, 0, 0] : [0, 0, 0.03 * dir];
    fx.add({ p: [p[0] + ahead[0], p[1], p[2] + ahead[2]], v, col: 0xfff0d0, i: 1.4, size: 0.035, group: 3, kind: 3, t0: ph, t1: len / sp });
    fx.add({ p: [p[0] - ahead[0], p[1], p[2] - ahead[2]], v, col: 0xff2a1a, i: 1.0, size: 0.028, group: 3, kind: 3, t0: ph, t1: len / sp });
  }
  // aviation lights on antennas (group 5), blinking
  for (const q of roofSprites) fx.add({ p: q, col: 0xff2010, i: 2, size: 0.07, group: 5, kind: 0, tw: 5 + R() * 2 });
  fx.commit();
  group.add(fx.mesh);

  // ---- the black car (hero scale, 1960s coupe) ----
  const car = new THREE.Group();
  {
    const b = new Batch();
    const L = 0.24, Wc = 0.095;
    b.add(paint(G.box(Wc, 0.03, L), 0x0a0b0e, { gloss: 0.8, m: xf([0, 0.028, 0]) }));
    b.add(paint(G.box(Wc * 0.98, 0.012, L * 0.98), 0x111317, { gloss: 0.9, m: xf([0, 0.047, 0.01]) }));
    b.add(paint(G.box(Wc * 0.8, 0.028, L * 0.42), 0x0b0c10, { gloss: 0.9, m: xf([0, 0.065, -0.018], [0, 0, 0]) }));
    b.add(paint(G.box(Wc * 0.78, 0.022, 0.004), 0x3a5068, { gloss: 1, m: xf([0, 0.064, 0.034], [-0.6, 0, 0]) }));
    b.add(paint(G.box(Wc * 1.02, 0.006, L * 1.01), 0xc8d0d8, { gloss: 1, m: xf([0, 0.02, 0]) }));
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.add(paint(G.cyl(0.017, 0.017, 0.012, 12), 0x050505, { m: xf([x * Wc * 0.47, 0.017, z * L * 0.32], [0, 0, Math.PI / 2]) }));
    for (const x of [-0.035, 0.035]) b.add(paint(G.cyl(0.009, 0.009, 0.004, 10), 0xfff2d6, { glow: 3, m: xf([x, 0.03, L / 2 + 0.001], [Math.PI / 2, 0, 0]) }));
    for (const x of [-0.035, 0.035]) b.add(paint(G.box(0.014, 0.008, 0.003), 0xb01810, { glow: 1.5, m: xf([x, 0.032, -L / 2 - 0.001]) }));
    car.add(b.build(poster()));
  }
  car.scale.setScalar(1.6);
  car.position.set(-0.07, 0, CITY.carZ);
  {
    const hl = new Sprites(8);
    for (const sx of [-0.035, 0.035]) {
      hl.add({ p: [sx, 0.03, 0.125], col: 0xfff2d6, i: 2.6, size: 0.05, group: 4, kind: 0 });
      hl.add({ p: [sx, 0.03, 0.125], col: 0xffe6b0, i: 0.7, size: 0.26, group: 4, kind: 4 });
    }
    hl.commit();
    car.add(hl.mesh);
    car.userData.lights = hl;
  }
  group.add(car);

  // ---- champagne tower: a 1962 saucer tower shaped like a coupe glass ----
  const tower = new THREE.Group();
  {
    const b = new Batch();
    const stem = [[0.0, 0], [0.16, 0], [0.16, 0.05], [0.07, 0.12], [0.045, 0.6], [0.035, 2.0], [0.05, 2.35], [0.0, 2.36]];
    b.add(paint(G.lathe(stem, 24), 0x2c2a2e, { gloss: 0.5 }));
    const cup = [[0.05, 2.33], [0.32, 2.38], [0.6, 2.52], [0.74, 2.66], [0.72, 2.69], [0.56, 2.6], [0.05, 2.5]];
    b.add(paint(G.lathe(cup, 40), PAL.gold, { gloss: 0.8, glow: 0.35 }));
    b.add(paint(G.torus(0.735, 0.012, 6, 48), PAL.goldLt, { glow: 1.6, m: xf([0, 2.675, 0], [Math.PI / 2, 0, 0]) }));
    b.add(paint(G.cyl(0.006, 0.006, 0.5, 6), 0x2c2a2e, { m: xf([0, 2.9, 0]) }));
    // three thin legs like a 1960s needle tower
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * Math.PI * 2;
      const geo = G.cyl(0.012, 0.018, 1.9, 6);
      b.add(paint(geo, 0x34313a, { gloss: 0.4, m: new THREE.Matrix4().makeTranslation(Math.cos(a) * 0.17, 0.9, Math.sin(a) * 0.17).multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), -0.08)) }));
    }
    tower.add(b.build(poster()));
    // the "champagne" in the bowl: a glowing disc
    const wine = new THREE.Mesh(new THREE.CircleGeometry(0.66, 40).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uExposure: SU.uExposure, uFade: SU.uFade, uAmt: { value: 0 }, uTime: SU.uTime },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uExposure, uFade, uAmt, uTime; varying vec2 vP; void main(){ float r = length(vP)/0.66; float ripple = 0.5+0.5*sin(r*30.0 - uTime*3.0);
        vec3 c = mix(vec3(1.0,0.75,0.3), vec3(1.0,0.92,0.6), ripple*0.4) * (0.9 + 0.6*(1.0-r)) * uAmt; gl_FragColor = vec4(c*uExposure*uFade,1.0);
        #include <colorspace_fragment>
      }`,
    }));
    wine.position.y = 2.62;
    tower.add(wine);
    tower.userData.wine = wine;
  }
  tower.position.set(CITY.tower.x, 0, CITY.tower.z);
  group.add(tower);
  // bubbles rising out of the coupe (group 9): pure function of time, looped
  const bub = new Sprites(400);
  for (let k = 0; k < 160; k++) {
    const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.55;
    const per = 4.5 + R() * 3;
    bub.add({ p: [CITY.tower.x + Math.cos(a) * rr, 2.66, CITY.tower.z + Math.sin(a) * rr], v: [(R() - 0.5) * 0.05, 1.3 + R() * 0.7, (R() - 0.5) * 0.05], col: 0xffd890, i: 1.4, size: 0.05 + R() * 0.06, group: 9, kind: 3, t0: R() * per, t1: per });
  }
  bub.commit();
  group.add(bub.mesh);

  // ---- telephone poles + wires around the plaza (the copper line) ----
  const poleB = new Batch();
  const NP = 20, PR = 4.66, PH = 0.26;
  const wpos = [], wang = [], widx = [];
  const tops = [];
  for (let k = 0; k < NP; k++) {
    const a = (k / NP) * Math.PI * 2 + Math.PI / NP;
    const x = Math.cos(a) * PR, z = Math.sin(a) * PR;
    poleB.add(paint(G.cyl(0.007, 0.009, PH, 6), 0x3a2a1e, { m: xf([x, PH / 2, z]) }));
    poleB.add(paint(G.box(0.1, 0.008, 0.01), 0x3a2a1e, { m: xf([x, PH - 0.02, z], [0, -a + Math.PI / 2, 0]) }));
    for (const s of [-0.04, 0.04]) poleB.add(paint(G.cyl(0.005, 0.005, 0.014, 6), 0x8aa0a8, { gloss: 0.8, m: xf([x - Math.sin(a) * s, PH - 0.008, z + Math.cos(a) * s]) }));
    tops.push(a);
  }
  // wires: thin tubes sagging between poles
  const tubeSegs = 10;
  for (let k = 0; k < NP; k++) {
    const a0 = tops[k], a1 = tops[(k + 1) % NP] + (k === NP - 1 ? Math.PI * 2 : 0);
    for (const s of [-0.04, 0.04]) {
      const pts = [];
      for (let q = 0; q <= tubeSegs; q++) {
        const u = q / tubeSegs, a = a0 + (a1 - a0) * u;
        const rr = PR + s;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, PH - 0.008 - Math.sin(u * Math.PI) * 0.035, Math.sin(a) * rr));
      }
      const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), tubeSegs, 0.0035, 3, false);
      const base = wpos.length / 3;
      const pa = tg.attributes.position;
      for (let v = 0; v < pa.count; v++) { wpos.push(pa.getX(v), pa.getY(v), pa.getZ(v)); wang.push(Math.atan2(pa.getZ(v), pa.getX(v))); }
      const ix = tg.index.array;
      for (let v = 0; v < ix.length; v++) widx.push(base + ix[v]);
    }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
  wg.setAttribute('aAng', new THREE.Float32BufferAttribute(wang, 1));
  wg.setIndex(widx);
  const wires = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: { uExposure: SU.uExposure, uFade: SU.uFade, uWireP: U.uWireP, uWireAmt: U.uWireAmt }, vertexShader: WIRE_V, fragmentShader: WIRE_F }));
  group.add(poleB.build(poster()), wires);

  // ---- title sign on the building that closes the avenue ----
  const sign = new THREE.Group();
  {
    const word = 'GOLD ON THE WIRE'; // the song's title (the tape label says "Copper Line")
    const { tex, n } = letterStrip(word, { cell: 256 });
    const lw = 0.4, lh = 0.57, gap = 0.03;
    const total = n * (lw + gap);
    const pos = [], uv = [], on = [], idx = [], id = [];
    const order = [...word].map((c, i) => (c === ' ' ? -1 : i)).filter((i) => i >= 0);
    [...word].forEach((ch, i) => {
      if (ch === ' ') return;
      const x0 = -total / 2 + i * (lw + gap), x1 = x0 + lw;
      const b = pos.length / 3;
      pos.push(x0, 0, 0, x1, 0, 0, x1, lh, 0, x0, lh, 0);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      const t = 14.56 + order.indexOf(i) * 0.045;
      on.push(t, t, t, t);
      id.push(i, i, i, i);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aOn', new THREE.Float32BufferAttribute(on, 1));
    g.setAttribute('aIdx', new THREE.Float32BufferAttribute(id, 1));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uTime: SU.uTime, uExposure: SU.uExposure, uFade: SU.uFade, uSignAmt: U.uSignAmt, uN: { value: n } },
      vertexShader: SIGN_V, fragmentShader: SIGN_F, side: THREE.DoubleSide,
    }));
    m.position.set(0, 0.16, 0.05);
    sign.add(m);
    // lattice frame behind the letters: posts, two rails and X braces
    const fb = new Batch();
    const nb = 10, bw = total / nb;
    const top = 0.2 + lh; // top rail just above the letters
    for (let k = 0; k <= nb; k++) fb.add(paint(G.box(0.018, top + 0.04, 0.018), 0x1a1d22, { m: xf([-total / 2 + k * bw, (top + 0.04) / 2, -0.03]) }));
    for (let k = 0; k < nb; k++) {
      const span = top - 0.14, x = -total / 2 + (k + 0.5) * bw, len = Math.hypot(bw, span), ang = Math.atan2(span, bw);
      for (const sgn of [1, -1]) fb.add(paint(G.box(len, 0.01, 0.01), 0x1a1d22, { m: xf([x, (top + 0.14) / 2, -0.05], [0, 0, ang * sgn]) }));
    }
    for (const y of [0.14, top]) fb.add(paint(G.box(total + 0.04, 0.025, 0.035), 0x1a1d22, { m: xf([0, y, -0.03]) }));
    sign.add(fb.build(poster()));
  }
  sign.position.set(CITY.title.x, CITY.title.h, CITY.title.z + 0.2);
  group.add(sign);

  // ---- escape routes ("every exit's got a place to go") ----
  const routes = [];
  const NR = 10;
  for (let k = 0; k < NR; k++) {
    const th = (k / NR) * Math.PI * 2 + 0.31;
    const dx = Math.cos(th), dz = Math.sin(th);
    // start at the nearest intersection just outside the plaza
    let ix = Math.round((dx * 5.6) / P), iz = Math.round((dz * 5.6) / P);
    const pts = [[dx * 4.7, 0.008, dz * 4.7], [ix * P, 0.008, iz * P]];
    let guard = 0;
    while (Math.hypot(ix * P, iz * P) < 25 && guard++ < 40) {
      const cx = ix * P, cz = iz * P;
      const ex = dx * (Math.hypot(cx, cz) + P) - cx, ez = dz * (Math.hypot(cx, cz) + P) - cz;
      if (Math.abs(ex) > Math.abs(ez)) ix += Math.sign(ex); else iz += Math.sign(ez);
      pts.push([ix * P, 0.008, iz * P]);
    }
    routes.push({ pts, end: pts[pts.length - 1], th });
  }
  const routeMat = ribbonMat(0xe0a527, 0xfff2c0);
  // two route passes: verse 1 (t0 33.34) and the final chorus (t0 141.74): groups 1 and 2
  const routeGeo = ribbonGeo([
    ...routes.map((r, k) => ({ pts: r.pts, w: 0.11, t0: 33.34 + k * 0.03, speed: 15, group: 1 })),
    ...routes.map((r, k) => ({ pts: r.pts.map((p) => [p[0], p[1] + 0.002, p[2]]), w: 0.11, t0: 141.74 + k * 0.03, speed: 15, group: 2 })),
  ]);
  const routeMesh = new THREE.Mesh(routeGeo, routeMat);
  routeMesh.renderOrder = 4;
  group.add(routeMesh);
  // exit beacons + rockets at the route ends
  const exits = new Sprites(1200);
  routes.forEach((r, k) => {
    const [x, , z] = r.end;
    exits.add({ p: [x, 0.05, z], col: 0xffc860, i: 2.2, size: 0.45, group: 10, kind: 4, t0: 34.9 + k * 0.03, t1: 1e4 });
    exits.add({ p: [x, 0.05, z], col: 0xffc860, i: 2.2, size: 0.45, group: 11, kind: 4, t0: 143.2 + k * 0.03, t1: 1e4 });
    // rocket: one bright spark climbing, then a little ring burst
    for (const [t0, gp] of [[35.46, 10], [143.6, 11]]) {
      exits.add({ p: [x, 0.05, z], v: [0, 7.5, 0], col: 0xfff0c0, i: 3, size: 0.14, group: gp, kind: 1, t0: t0 + k * 0.05, t1: t0 + k * 0.05 + 0.75, grav: 3, drag: 0.4 });
    }
  });
  exits.commit();
  group.add(exits.mesh);

  return {
    group, U, ground, bld, crownMesh, roofMesh, fx, bub, wires, sign, car, tower, routes, routeMat, exits, poleMesh,
  };
}
