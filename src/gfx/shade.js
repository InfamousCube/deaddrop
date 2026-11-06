// Stylised "flat 60s" shading for everything in DEAD DROP.
//
// One ShaderMaterial family (ToonLit) does all the lighting: hemisphere + one key light + up to
// four point lights, soft two-step banding (poster look), a little fake gloss, emissive glow and
// an analytic ambient-occlusion term for the room shell. Static geometry is painted with vertex
// colours and merged into "batches", so the whole room renders in a handful of draw calls.
//
// A batch built with pieces: true keeps a per-vertex piece id + piece centre. Every piece can be
// moved, rotated and scaled on the GPU through a small float texture (PieceSet). That is how the
// room breaks apart and reassembles without hundreds of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);

// Shared light rig. Every ToonLit material references these objects, so changing a value here
// relights the whole world at once.
export const LIGHT = {
  uHemiSky: { value: col(0x8f8a80) },
  uHemiGround: { value: col(0x1e2a2c) },
  uKeyDir: { value: v3(-0.35, 0.75, 0.55).normalize() },
  uKeyColor: { value: col(0x6d6a8a) },
  uPointPos: { value: [v3(0, 2.3, -0.7), v3(-0.7, 1.4, -0.85), v3(0, 1.6, -3), v3(0, -10, 0)] },
  uPointColor: { value: [col(0xffd9a0), col(0xffc27a), col(0x000000), col(0x000000)] },
  uPointRange: { value: [6.5, 2.2, 6.0, 1.0] },
  uRoomMin: { value: v3(-2.4, 0, -2.5) },
  uRoomMax: { value: v3(2.4, 2.85, 2.1) },
  uExposure: { value: 1 },
  uGlowBoost: { value: 1 },
  uSweepOrigin: { value: v3(0, 0.9, -0.7) },
  uSweepRadius: { value: -1 },
  uSweepWidth: { value: 0.6 },
  uSweepAmt: { value: 0 },
  uSweepA: { value: col(0x0b0a0c) },
  uSweepB: { value: col(0xd9a93a) },
  uTime: { value: 0 },
};

const VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aExtra;   // x glow, y gloss, z shellAO mask, w spare
#ifdef PIECES
attribute vec4 aPiece;   // xyz piece centre (object space), w piece id
uniform sampler2D uPieceTex;
#endif
#include <skinning_pars_vertex>
varying vec3 vCol;
varying vec4 vExtra;
varying vec3 vN;
varying vec3 vW;
varying vec3 vRest;
varying vec2 vUv;
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
void main() {
  vec3 p = position;
  vec3 n = normal;
#ifdef USE_INSTANCING
  p = (instanceMatrix * vec4(p, 1.0)).xyz;
  n = mat3(instanceMatrix) * n;
#endif
  vec3 rest = p;
#ifdef PIECES
  int id = int(aPiece.w + 0.5);
  vec4 T = texelFetch(uPieceTex, ivec2(id, 0), 0);
  vec4 Q = texelFetch(uPieceTex, ivec2(id, 1), 0);
  p = aPiece.xyz + qrot(Q, (p - aPiece.xyz) * T.w) + T.xyz;
  n = qrot(Q, n);
#endif
#ifdef USE_SKINNING
  #include <skinbase_vertex>
  vec3 transformed = p;
  #include <skinning_vertex>
  vec3 objectNormal = n;
  #include <skinnormal_vertex>
  p = transformed; n = objectNormal; rest = p;
#endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vRest = (modelMatrix * vec4(rest, 1.0)).xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vCol = aCol;
  vExtra = aExtra;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
uniform vec3 uHemiSky, uHemiGround, uKeyDir, uKeyColor;
uniform vec3 uPointPos[4];
uniform vec3 uPointColor[4];
uniform float uPointRange[4];
uniform vec3 uRoomMin, uRoomMax;
uniform float uExposure, uGlowBoost;
uniform vec3 uSweepOrigin, uSweepA, uSweepB;
uniform float uSweepRadius, uSweepWidth, uSweepAmt;
uniform vec3 uTint;
uniform float uHover;
uniform float uOpacity;
uniform float uSweepOn;
#ifdef USE_MAP
uniform sampler2D map;
#endif
varying vec3 vCol;
varying vec4 vExtra;
varying vec3 vN;
varying vec3 vW;
varying vec3 vRest;
varying vec2 vUv;
float band(float d) { return smoothstep(-0.08, 0.16, d) * 0.58 + smoothstep(0.42, 0.6, d) * 0.42; }
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 base = vCol * uTint;
  float alpha = uOpacity;
#ifdef USE_MAP
  vec4 tx = texture2D(map, vUv);
  base *= tx.rgb;
  alpha *= tx.a;
  if (alpha < 0.02) discard;
#endif
  float ao = 1.0;
  if (vExtra.z > 0.5) {
    float df = vRest.y - uRoomMin.y;
    float dc = uRoomMax.y - vRest.y;
    float dx = min(vRest.x - uRoomMin.x, uRoomMax.x - vRest.x);
    float dz = min(vRest.z - uRoomMin.z, uRoomMax.z - vRest.z);
    ao *= mix(0.5, 1.0, smoothstep(0.0, 0.85, df));
    ao *= mix(0.78, 1.0, smoothstep(0.0, 0.45, dc));
    ao *= mix(0.7, 1.0, smoothstep(0.0, 0.6, dx));
    ao *= mix(0.7, 1.0, smoothstep(0.0, 0.6, dz));
  }
  vec3 L = mix(uHemiGround, uHemiSky, n.y * 0.5 + 0.5);
  L += uKeyColor * band(dot(n, uKeyDir));
  for (int i = 0; i < 4; i++) {
    vec3 d = uPointPos[i] - vW;
    float dist = max(length(d), 1e-3);
    float att = clamp(1.0 - dist / uPointRange[i], 0.0, 1.0);
    L += uPointColor[i] * att * att * band(dot(n, d / dist));
  }
  vec3 c = base * L * ao;
  if (vExtra.y > 0.0) {
    vec3 v = normalize(cameraPosition - vW);
    vec3 h = normalize(v + uKeyDir);
    float s = pow(max(dot(n, h), 0.0), 90.0);
    vec3 h2 = normalize(v + normalize(uPointPos[0] - vW));
    float s2 = pow(max(dot(n, h2), 0.0), 160.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float gl = vExtra.y * vExtra.y;
    c += gl * (smoothstep(0.35, 0.6, s) * 0.55 * uKeyColor + smoothstep(0.4, 0.65, s2) * 0.6 * uPointColor[0]) + vExtra.y * fres * 0.08 * L;
  }
  c += base * vExtra.x * uGlowBoost;
  c += uHover * (0.18 * base + vec3(0.05, 0.04, 0.02));
  if (uSweepAmt * uSweepOn > 0.0) {
    float r = length(vRest - uSweepOrigin);
    float k = smoothstep(uSweepRadius, uSweepRadius - uSweepWidth, r) * uSweepAmt * uSweepOn;
    float lum = dot(base, vec3(0.3, 0.55, 0.15));
    vec3 swept = mix(uSweepA, uSweepB, smoothstep(0.05, 0.4, lum)) * (L * 0.55 + 0.45) * ao;
    swept += uSweepB * vExtra.x * uGlowBoost;
    c = mix(c, swept, k);
    float edge = exp(-pow((r - uSweepRadius) / 0.045, 2.0)) * uSweepAmt * uSweepOn;
    c += uSweepB * edge * 2.2;
  }
  gl_FragColor = vec4(c * uExposure, alpha);
  #include <colorspace_fragment>
}`;

// A ToonLit material. opts: { map, pieces (PieceSet), transparent, side, tint, depthWrite }
export function toon(opts = {}) {
  const uniforms = {
    ...LIGHT,
    uTint: { value: opts.tint ? col(opts.tint) : col(0xffffff) },
    uHover: { value: 0 },
    uOpacity: { value: opts.opacity ?? 1 },
    uSweepOn: { value: opts.sweep ?? 1 },
  };
  const defines = {};
  if (opts.map) {
    uniforms.map = { value: opts.map };
    defines.USE_MAP = '';
  }
  if (opts.pieces) {
    uniforms.uPieceTex = { value: opts.pieces.texture };
    defines.PIECES = '';
  }
  const m = new THREE.ShaderMaterial({
    uniforms,
    defines,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: !!opts.transparent,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
  });
  if (opts.polygonOffset) {
    m.polygonOffset = true;
    m.polygonOffsetFactor = -1;
    m.polygonOffsetUnits = -2;
  }
  return m;
}

// ---------------------------------------------------------------------------------------------
// Geometry painting

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

// Compose a transform: pos [x,y,z], rot [rx,ry,rz] (radians, XYZ), scale (number or [x,y,z])
export function xf(pos = [0, 0, 0], rot = [0, 0, 0], scale = 1) {
  _e.set(rot[0], rot[1], rot[2]);
  _q.setFromEuler(_e);
  const s = Array.isArray(scale) ? v3(...scale) : v3(scale, scale, scale);
  return new THREE.Matrix4().compose(v3(...pos), _q.clone(), s);
}

// Paint a geometry: bake transform, flat colour, extra channels. Returns a non-indexed geometry
// with aCol/aExtra (and uv) so it can be merged with anything else painted the same way.
export function paint(geo, color, { glow = 0, gloss = 0, ao = 0, m = null, flat = false } = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (m) g.applyMatrix4(m);
  if (flat) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  const n = g.attributes.position.count;
  const c = color instanceof THREE.Color ? color : col(color);
  const ca = new Float32Array(n * 3);
  const ea = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b;
    ea[i * 4] = glow; ea[i * 4 + 1] = gloss; ea[i * 4 + 2] = ao; ea[i * 4 + 3] = 0;
  }
  g.setAttribute('aCol', new THREE.BufferAttribute(ca, 3));
  g.setAttribute('aExtra', new THREE.BufferAttribute(ea, 4));
  g.groups = [];
  return g;
}

// Vertical colour gradient on an already painted geometry (multiplies aCol between y0..y1).
export function shadeY(g, y0, y1, k0 = 0.7, k1 = 1) {
  const p = g.attributes.position, c = g.attributes.aCol;
  for (let i = 0; i < p.count; i++) {
    const t = THREE.MathUtils.clamp((p.getY(i) - y0) / (y1 - y0), 0, 1);
    const k = k0 + (k1 - k0) * t;
    c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// PieceSet: per-piece transforms in a float texture (row 0: translate.xyz + scale, row 1: quat)

export class PieceSet {
  constructor(max = 2048) {
    this.max = max;
    this.data = new Float32Array(max * 2 * 4);
    for (let i = 0; i < max; i++) { this.data[i * 4 + 3] = 1; this.data[(max + i) * 4 + 3] = 1; }
    this.texture = new THREE.DataTexture(this.data, max, 2, THREE.RGBAFormat, THREE.FloatType);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.count = 0;
    this.pieces = []; // { id, center (world Vector3), tag, data }
  }
  alloc(center, tag = '', data = {}) {
    if (this.count >= this.max) throw new Error('PieceSet full');
    const id = this.count++;
    const p = { id, center: center.clone(), tag, data, t: v3(), q: new THREE.Quaternion(), s: 1 };
    this.pieces.push(p);
    return p;
  }
  write(p) {
    const d = this.data, i = p.id * 4, j = (this.max + p.id) * 4;
    d[i] = p.t.x; d[i + 1] = p.t.y; d[i + 2] = p.t.z; d[i + 3] = p.s;
    d[j] = p.q.x; d[j + 1] = p.q.y; d[j + 2] = p.q.z; d[j + 3] = p.q.w;
  }
  reset() {
    for (const p of this.pieces) { p.t.set(0, 0, 0); p.q.identity(); p.s = 1; this.write(p); }
    this.texture.needsUpdate = true;
  }
  flush() {
    for (const p of this.pieces) this.write(p);
    this.texture.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------------------------
// Batch: collect painted geometries, merge into one mesh.

export class Batch {
  constructor(pieceSet = null) {
    this.geos = [];
    this.pieces = pieceSet;
    this._cur = null;
  }
  // Start a new piece (only for piece batches). center: world-space centre of rotation.
  piece(center, tag, data) {
    this._cur = this.pieces.alloc(center, tag, data);
    return this._cur;
  }
  add(g) {
    if (this.pieces) {
      if (!this._cur) throw new Error('Batch.add without piece()');
      const n = g.attributes.position.count;
      const a = new Float32Array(n * 4);
      const c = this._cur.center;
      for (let i = 0; i < n; i++) { a[i * 4] = c.x; a[i * 4 + 1] = c.y; a[i * 4 + 2] = c.z; a[i * 4 + 3] = this._cur.id; }
      g.setAttribute('aPiece', new THREE.BufferAttribute(a, 4));
    }
    this.geos.push(g);
    return g;
  }
  build(material) {
    if (!this.geos.length) return new THREE.Group();
    const g = mergeGeometries(this.geos, false);
    g.computeBoundingSphere();
    this.geos = [];
    const mesh = new THREE.Mesh(g, material || toon({ pieces: this.pieces }));
    mesh.frustumCulled = false; // pieces move outside the static bounds
    return mesh;
  }
}

// Convenience primitives (all unpainted three geometries; paint() bakes them).
export const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (rt, rb, h, s = 24, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open),
  sphere: (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs),
  torus: (r, t, rs = 10, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc),
  plane: (w, h) => new THREE.PlaneGeometry(w, h),
  circle: (r, s = 32) => new THREE.CircleGeometry(r, s),
  ring: (r0, r1, s = 40) => new THREE.RingGeometry(r0, r1, s),
  cone: (r, h, s = 24, open = false) => new THREE.ConeGeometry(r, h, s, 1, open),
  lathe: (pts, s = 32) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), s),
  capsule: (r, l, cs = 4, rs = 10) => new THREE.CapsuleGeometry(r, l, cs, rs),
  extrude: (shape, depth, bevel = 0) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 16 }),
};

export function roundRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Rounded slab: extruded rounded rectangle, centred, thickness along Z.
export function slab(w, h, d, r) {
  const g = G.extrude(roundRectShape(w, h, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4)), d);
  g.translate(0, 0, -d / 2);
  return g;
}

export { v3, col };
