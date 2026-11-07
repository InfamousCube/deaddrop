// Helpers shared by the group-3 scenes (S10-S13), round 3. No state, no allocation per call in update paths.
//   profiles: lathe(), shapeOf(), extrude(), tube(), ribbed(), rrect(), circ(), sagPts()
//   merge(parts) bakes parts [{ g, c }] into one flat-faceted geometry with a colour attribute
//   (use it with toon({ ramp: NEUTRAL, vertexColors: true }): the colour IS the material, the ramp gives the 3 steps)
//   wireMat(): a flat glow material that reveals a tube along its length (aU 0..1, uK0..uK1)
//   HARBOUR: the shared travel profile of S12 + S13 (one coordinate frame for bridge, pier and booth)
import * as THREE from 'three';
import { PAL } from './style.js';

export const D2R = Math.PI / 180;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const lin = (a, b, x) => clamp01((x - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeIn = (k) => { k = clamp01(k); return k * k * k; };
export const easeOut = (k) => { k = clamp01(k); return 1 - Math.pow(1 - k, 3); };
export const easeInOut = (k) => { k = clamp01(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const env = (t, t0, rate = 6) => (t < t0 ? 0 : Math.exp(-(t - t0) * rate));
export const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));

// neutral 3-step ramp: shadow black, mid 0.5, lit 1.0, multiplied by the vertex / instance colour
export const NEUTRAL = [0x000000, 0x808080, 0xffffff];

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export const TMP = { m: _m, q: _q, p: _p, s: _s, e: _e, c: new THREE.Color(), c2: new THREE.Color(), v: new THREE.Vector3(), w: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };

// instance i of mesh: position, Euler (YXZ) rotation, scale
export function setI(mesh, i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
  return _m;
}
export function inst(geo, mat, n, name) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.frustumCulled = false;
  if (name) m.name = name;
  const z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < n; i++) m.setMatrixAt(i, z);
  return m;
}
export function instColors(mesh, col = 0xffffff) {
  const c = new THREE.Color(col), a = new Float32Array(mesh.count * 3);
  for (let i = 0; i < mesh.count; i++) a.set([c.r, c.g, c.b], i * 3);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(a, 3);
  return mesh;
}
export function setC(mesh, i, hex, k = 1) { TMP.c.set(hex).multiplyScalar(k); mesh.setColorAt(i, TMP.c); }

// flat-faceted copy of a geometry (non-indexed, face normals)
export function facet(g) { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; }

// merge parts [{ g, c }] (c: grey 0..1 or hex > 1) into one non-indexed geometry with flat normals and a colour attribute
export function merge(parts) {
  const gs = parts.map((p) => ({ g: facet(p.g), c: p.c ?? 1 }));
  const total = gs.reduce((s, x) => s + x.g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  const c = new THREE.Color();
  let o = 0;
  for (const { g, c: cc } of gs) {
    const P = g.getAttribute('position'), N = g.getAttribute('normal');
    pos.set(P.array, o * 3); nor.set(N.array, o * 3);
    if (typeof cc === 'number' && cc <= 1) c.setRGB(cc, cc, cc); else c.set(cc);
    for (let i = 0; i < P.count; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
    o += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

// ---- profile builders ------------------------------------------------------------------------
// lathe around +y from [[r, y], ...]
export function lathe(pts, seg = 16, phi0 = 0, phiLen = Math.PI * 2) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg, phi0, phiLen);
}
// radial ribs on a lathe-like geometry (x/z scaled by 1 + amt * rib(phi)); yMin/yMax limit the band
export function ribbed(g, n, amt, yMin = -Infinity, yMax = Infinity) {
  const P = g.getAttribute('position');
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (y < yMin || y > yMax) continue;
    const a = Math.atan2(x, z), k = 1 + amt * Math.pow(Math.abs(Math.cos(a * n * 0.5)), 3);
    P.setXYZ(i, x * k, y, z * k);
  }
  P.needsUpdate = true;
  return g;
}
// 2D outline helpers: arrays of [x, y]
export function circ(r, n, cx = 0, cy = 0, a0 = 0, a1 = Math.PI * 2) {
  const out = [];
  const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = closed ? n : n + 1;
  for (let i = 0; i < m; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}
export function rrect(w, h, r, cx = 0, cy = 0, n = 3) {
  const out = [], x0 = w / 2 - r, y0 = h / 2 - r;
  const corners = [[x0, y0, 0], [-x0, y0, Math.PI / 2], [-x0, -y0, Math.PI], [x0, -y0, Math.PI * 1.5]];
  for (const [ax, ay, a] of corners) for (let i = 0; i <= n; i++) { const b = a + (Math.PI / 2) * (i / n); out.push([cx + ax + r * Math.cos(b), cy + ay + r * Math.sin(b)]); }
  return out;
}
export function shapeOf(pts, holes = []) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return s;
}
// extrude a shape (or outline array) along z, centred on z = 0, with a bevel that catches the rim light
export function extrude(shape, depth, bevel = 0, o = {}) {
  const s = Array.isArray(shape) ? shapeOf(shape) : shape;
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * (o.size ?? 1), bevelOffset: o.offset ?? 0,
    bevelSegments: o.bseg ?? 1, curveSegments: o.curve ?? 8, steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
const v3 = (p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));
export function curveOf(pts, closed = false) { return new THREE.CatmullRomCurve3(pts.map(v3), closed, 'centripetal'); }
export function tube(pts, r, seg = 32, rad = 6, closed = false) { return new THREE.TubeGeometry(curveOf(pts, closed), seg, r, rad, closed); }
// points of a hanging wire from a to b with sag s (parabola), n segments
export function sagPts(a, b, s, n = 10) {
  const A = v3(a), B = v3(b), out = [];
  for (let i = 0; i <= n; i++) { const k = i / n; out.push(new THREE.Vector3().lerpVectors(A, B, k).add(new THREE.Vector3(0, -4 * s * k * (1 - k), 0))); }
  return out;
}
// a box with bevelled edges (extruded rounded rectangle), centred
export function bbox(w, h, d, bevel = 0.04, x = 0, y = 0, z = 0) {
  const b = Math.min(bevel, w * 0.3, h * 0.3, d * 0.3);
  const g = extrude(rrect(w - 2 * b, h - 2 * b, Math.min(b, (w - 2 * b) * 0.3, (h - 2 * b) * 0.3) + 0.0001, 0, 0, 1), Math.max(0.001, d - 2 * b), b, { curve: 2 });
  return g.translate(x, y, z);
}
export const box = (w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d); if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz); return g.translate(x, y, z);
};
// a beam from a to b (square section w)
export function beam(a, b, w, h = w) {
  const A = v3(a), B = v3(b), L = A.distanceTo(B);
  const g = new THREE.BoxGeometry(w, h, L);
  const m = new THREE.Matrix4().lookAt(B, A, Math.abs(B.x - A.x) + Math.abs(B.z - A.z) < 1e-4 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0));
  m.setPosition(A.clone().add(B).multiplyScalar(0.5));
  return g.applyMatrix4(m);
}

// ---- glow materials ----------------------------------------------------------------------------
export const FOG_U = /* glsl */ `uniform vec3 uFogCol; uniform float uFogNear, uFogFar, uFade, uSceneFade;`;
export const FOG_APPLY = /* glsl */ `c = mix(c, uFogCol, clamp((vDepth - uFogNear) / max(1.0, uFogFar - uFogNear), 0.0, 1.0) * uFogAmt) * uFade * uSceneFade;`;
export function fogUniforms(kit) {
  const U = kit.U;
  return { uFogCol: U.uFogCol, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uFade: U.uFade, uSceneFade: kit.SU.uSceneFade, uTime: U.uTime };
}
export const WORLD_V = /* glsl */ `varying vec3 vW; varying float vDepth;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;

// aU (0..1 along each tube) for a TubeGeometry (rows of rad+1 vertices)
export function tubeU(g, seg, rad, u0 = 0, u1 = 1) {
  const n = g.getAttribute('position').count, a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = u0 + (u1 - u0) * (Math.floor(i / (rad + 1)) / seg);
  g.setAttribute('aU', new THREE.BufferAttribute(a, 1));
  return g;
}
// glow that shows only where uK0 <= aU <= uK1 (cables lighting up along their length)
export function wireMat(kit, color, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogUniforms(kit), uColor: { value: new THREE.Color(color) }, uK0: { value: 0 }, uK1: { value: 0 }, uBright: { value: 1 }, uFogAmt: { value: o.fog ?? 0.5 } },
    vertexShader: /* glsl */ `attribute float aU; varying float vU; varying float vDepth;
      void main(){ vU = aU; vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uK0, uK1, uBright, uFogAmt; ${FOG_U}
      varying float vU; varying float vDepth;
      void main(){ if (vU < uK0 || vU > uK1) discard; vec3 c = uColor * uBright; ${FOG_APPLY} gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
}

// ---- the harbour (S12 + S13 share one frame) ---------------------------------------------------
// You glide 4 m/s out of the water, ease to 2 m/s under the bridge, stop in front of the booth.
export const HARBOUR = {
  waterY: -1.2,
  prof: [[95.1, 3.4, 0.01], [100.2, 2, 1.6], [104.2, 0, 1.4]],
  bridgeX: -19,      // the bridge runs along your path on the left: deck centre x, top at y 12
  towerZ: [-14, -86], // near tower (passes on your left), far tower ahead-left
  stopGap: 2.4,      // door plane this far in front of the eyes at the stop
};
export const HOT_NIGHT = { zen: PAL.black, hor2: PAL.velvet, hor: PAL.carmineDeep, nadir: PAL.black, rays: 0, rings: 0, stars: 0, sunR: 0, moonR: 0, rayA: PAL.crimson, rayB: PAL.carmineDeep };
