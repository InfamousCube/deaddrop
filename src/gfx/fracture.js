// Pre-fractured panels. A wall/floor/ceiling rectangle is cut by straight "wire" lines and then
// split into convex Voronoi cells. Every cell becomes a thin prism that is one piece of a
// PieceSet, so the panel looks seamless until the pieces start to move.
import * as THREE from 'three';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Keep the part of a convex polygon with nx*u + ny*v <= d.
export function clip(poly, nx, ny, d) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const fp = nx * p[0] + ny * p[1] - d, fq = nx * q[0] + ny * q[1] - d;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

export function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function centroid(poly) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const k = p[0] * q[1] - q[0] * p[1];
    a += k; cx += (p[0] + q[0]) * k; cy += (p[1] + q[1]) * k;
  }
  if (Math.abs(a) < 1e-9) return [poly[0][0], poly[0][1]];
  return [cx / (3 * a), cy / (3 * a)];
}

// Split every polygon by an infinite line through (x0,y0)-(x1,y1).
export function cutAll(polys, x0, y0, x1, y1) {
  const nx = -(y1 - y0), ny = x1 - x0;
  const len = Math.hypot(nx, ny);
  const a = nx / len, b = ny / len, d = a * x0 + b * y0;
  const out = [];
  for (const p of polys) {
    const l = clip(p, a, b, d), r = clip(p, -a, -b, -d);
    if (l.length >= 3 && Math.abs(area(l)) > 1e-5) out.push(l);
    if (r.length >= 3 && Math.abs(area(r)) > 1e-5) out.push(r);
  }
  return out;
}

// Voronoi cells of `count` random seeds inside a convex polygon.
export function voronoi(poly, count, rand) {
  if (count <= 1) return [poly];
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const [x, y] of poly) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const seeds = [];
  let guard = 0;
  while (seeds.length < count && guard++ < count * 40) {
    const s = [minx + rand() * (maxx - minx), miny + rand() * (maxy - miny)];
    // inside test for convex polygon
    let inside = true;
    const sgn = Math.sign(area(poly));
    for (let i = 0; i < poly.length && inside; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      if (sgn * ((q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0])) < 0) inside = false;
    }
    if (inside) seeds.push(s);
  }
  const cells = [];
  for (let i = 0; i < seeds.length; i++) {
    let c = poly;
    for (let j = 0; j < seeds.length && c.length >= 3; j++) {
      if (i === j) continue;
      const a = seeds[j][0] - seeds[i][0], b = seeds[j][1] - seeds[i][1];
      const mx = (seeds[i][0] + seeds[j][0]) / 2, my = (seeds[i][1] + seeds[j][1]) / 2;
      c = clip(c, a, b, a * mx + b * my);
    }
    if (c.length >= 3 && Math.abs(area(c)) > 1e-5) cells.push(c);
  }
  return cells.length ? cells : [poly];
}

// Build a prism from a 2D polygon lying on a panel. Panel frame: origin O, axis U (unit, along u),
// axis V (unit, along v), normal N (unit, front side). Front face sits on the panel plane,
// the back face `thick` behind it. Returns a non-indexed BufferGeometry with normals and uv.
export function prism(poly, O, U, V, N, thick) {
  const P = (u, v, back) => {
    const p = O.clone().addScaledVector(U, u).addScaledVector(V, v);
    if (back) p.addScaledVector(N, -thick);
    return p;
  };
  const pos = [], nor = [], uv = [];
  const tri = (a, b, c, n) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let k = 0; k < 3; k++) nor.push(n.x, n.y, n.z);
    uv.push(0, 0, 0, 0, 0, 0);
  };
  // make polygon counter-clockwise in (U,V) so the front face points along N
  const pts = area(poly) < 0 ? [...poly].reverse() : poly;
  const f = pts.map(([u, v]) => P(u, v, false));
  const b = pts.map(([u, v]) => P(u, v, true));
  const nBack = N.clone().negate();
  for (let i = 1; i < f.length - 1; i++) {
    tri(f[0], f[i], f[i + 1], N);
    tri(b[0], b[i + 1], b[i], nBack);
  }
  for (let i = 0; i < f.length; i++) {
    const j = (i + 1) % f.length;
    const e = f[j].clone().sub(f[i]);
    const sn = e.clone().cross(N).normalize(); // outward for CCW polygons
    tri(f[i], b[i], b[j], sn);
    tri(f[i], b[j], f[j], sn);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
