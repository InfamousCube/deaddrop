// Small helpers for scene group 2 (S06-S09). Pure functions and build-time geometry builders only.
import * as THREE from 'three';

export const D2R = Math.PI / 180;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
// 1 at tp, exponential decay after, 0 before
export const env = (t, tp, rate = 6) => (t < tp ? 0 : Math.exp(-(t - tp) * rate));
// 0 -> 1 over [a, b], 1 -> 0 over [c, d]
export const bump = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t));
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const lerp = (a, b, k) => a + (b - a) * k;

// Bend a text mesh (faces +z) around a vertical cylinder of radius R whose axis lies R behind the text.
export function bendText(T, R) {
  const p = T.mesh.geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = x / R;
    p.setXYZ(i, Math.sin(a) * (R + z), p.getY(i), Math.cos(a) * (R + z) - R);
  }
  p.needsUpdate = true;
  T.mesh.geometry.computeBoundingSphere();
}

// Paint a constant vertex colour into a geometry (adds/overwrites 'color'), returns a non-indexed copy.
export function paint(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(hex);
  const n = g.getAttribute('position').count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

// Merge geometries (position, normal, optional color; colours default white). Faceted look: normals are
// recomputed per face when `faceted` is set.
export function merge(list, faceted = false) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = geos.reduce((s, g) => s + g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3).fill(1);
  let o = 0, anyCol = false;
  for (const g of geos) {
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), c = g.getAttribute('color');
    pos.set(p.array, o * 3);
    if (n) nor.set(n.array, o * 3);
    if (c) { col.set(c.array, o * 3); anyCol = true; }
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (anyCol) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (faceted) out.computeVertexNormals();
  return out;
}

// A box between two points (thick line), as geometry
export function beam(a, b, w, h = w) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.BoxGeometry(w, h, len);
  const m = new THREE.Matrix4().lookAt(A, B, new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.abs(B.y - A.y) > 0.99 * len ? 0.3 : 0));
  g.applyMatrix4(m);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

// Cylinder between two points
export function rod(a, b, r0, r1 = r0, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate(A.x, A.y, A.z);
  return g;
}

// Flat horizontal strips along 2D polylines (x, z) at height y: PCB traces with 45 degree corners,
// square joints and square end pads. polys: [{ pts: [[x, z], ...], w, pad }]
export function stripGeo(polys, y) {
  const P = [];
  const quad = (ax, az, bx, bz, cx, cz, dx, dz) => { P.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz); };
  const square = (x, z, h, ux, uz) => {
    const vx = -uz, vz = ux;
    quad(x - ux * h - vx * h, z - uz * h - vz * h, x + ux * h - vx * h, z + uz * h - vz * h,
      x + ux * h + vx * h, z + uz * h + vz * h, x - ux * h + vx * h, z - uz * h + vz * h);
  };
  for (const pl of polys) {
    const pts = pl.pts, h = pl.w / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz * h, nz = ux * h;
      quad(ax + nx, az + nz, bx + nx, bz + nz, bx - nx, bz - nz, ax - nx, az - nz);
      if (i > 0) square(ax, az, h, ux, uz);
      if (pl.pad && (i === 0 || i === pts.length - 2)) {
        const ex = i === 0 ? ax : bx, ez = i === 0 ? az : bz;
        square(ex, ez, h * (pl.pad || 1.8), 1, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(P.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

// Random walk with 45 degree turns (PCB look). Returns [[x, z], ...]
export function walk45(rnd, x, z, steps, minL, maxL, clip) {
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let di = Math.floor(rnd() * 4) * 2;
  const pts = [[x, z]];
  for (let s = 0; s < steps; s++) {
    const [dx, dz] = dirs[di];
    const n = Math.hypot(dx, dz);
    const L = minL + rnd() * (maxL - minL);
    const nx = x + (dx / n) * L, nz = z + (dz / n) * L;
    if (clip && !clip(nx, nz)) break;
    x = nx; z = nz; pts.push([x, z]);
    const r = rnd();
    di = (di + (r < 0.4 ? 1 : r < 0.8 ? 7 : 0)) % 8;
  }
  return pts;
}

// A 2D shape from a point list [[x, y], ...]
export function shapeOf(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// Thin extruded slab of a shape (cut-out), centred in depth on z = z0
export function slab(shape, depth, z0 = 0, curve = 8) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: curve });
  g.translate(0, 0, z0 - depth / 2);
  return g;
}

// sample a curve into a fixed point list (for beads running along it)
export function samplePts(curve, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(curve.getPoint(i / n));
  return out;
}
export function along(pts, k, out) {
  const f = Math.min(pts.length - 1.001, Math.max(0, k * (pts.length - 1)));
  const i = Math.floor(f), u = f - i;
  return out.copy(pts[i]).lerp(pts[i + 1], u);
}
