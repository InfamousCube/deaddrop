// In-world typography for DD-003: condensed caps with a synthetic italic slant, built from ONE glyph
// atlas (canvas, drawn on the device with the vendored Bebas Neue, OFL, web/fonts/BebasNeue.ttf,
// family 'DDBebas' loaded by gfx/textures.js). A text line is one mesh (one draw call) whose words
// reveal on their sung word timings in the shader (slide up or pop), so a line costs nothing per
// frame except a uniform array. To use another font, change FONT_FAMILY (load it like DDBebas).
import * as THREE from 'three';
import { PAL, U } from './style.js';

export const FONT_FAMILY = 'DDBebas';
export const SLANT = 0.2; // italic shear (x += y * SLANT)
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,'’!?-–:&/·\"()+%#";
const AW = 2048, AH = 1024, CELL = 160, FPX = 150, PAD = 10;
const MAXW = 24; // words per line (uniform array size)

let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  const c = document.createElement('canvas');
  c.width = AW; c.height = AH;
  const g = c.getContext('2d');
  g.font = `${FPX}px ${FONT_FAMILY}, 'Arial Narrow', sans-serif`;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  const capPx = g.measureText('H').actualBoundingBoxAscent || FPX * 0.7;
  const base = Math.round(CELL * 0.5 + capPx * 0.5); // baseline inside a cell
  const map = {};
  let x = PAD, y = 0;
  for (const ch of GLYPHS) {
    const w = Math.ceil(g.measureText(ch).width);
    if (x + w + PAD * 2 > AW) { x = PAD; y += CELL; }
    g.fillText(ch, x + PAD, y + base);
    map[ch] = { x: x, y: y, w: w + PAD * 2, adv: w };
    x += w + PAD * 3;
  }
  const space = g.measureText(' ').width;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  ATLAS = { tex, map, capPx, base, space };
  return ATLAS;
}

const TEXT_V = /* glsl */ `
attribute float aWord; attribute vec3 aCol; attribute vec2 aWC;
uniform float uK[${MAXW}]; uniform float uSlide, uPop;
varying vec2 vUv; varying float vA; varying vec3 vCol;
void main() {
  int i = int(aWord + 0.5);
  float k = clamp(uK[i], 0.0, 1.0);
  vec3 p = position;
  float e = 1.0 - pow(1.0 - k, 3.0);
  float s = mix(1.0, mix(0.55, 1.0, e) + 0.12 * sin(3.14159 * e), uPop);
  p.xy = aWC + (p.xy - aWC) * s;
  p.y -= (1.0 - e) * uSlide * (1.0 - uPop);
  vA = step(0.001, k) * min(1.0, k * 3.0);
  vUv = uv; vCol = aCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const TEXT_F = /* glsl */ `
uniform sampler2D map; uniform float uOpacity, uFade, uSceneFade, uEdge, uBright;
varying vec2 vUv; varying float vA; varying vec3 vCol;
void main() {
  float a = texture2D(map, vUv).a * vA * uOpacity * (1.0 - uEdge);
  if (a < 0.02) discard;
  gl_FragColor = vec4(vCol * uBright * uFade * uSceneFade, a);
  #include <colorspace_fragment>
}`;

const NAMED = { gold: PAL.gold, cream: PAL.cream, rust: PAL.rust, crimson: PAL.crimson, cyan: PAL.cyan, amber: PAL.amber, white: PAL.white, black: PAL.black, orange: PAL.orange };
const toCol = (c) => new THREE.Color(typeof c === 'string' && NAMED[c] !== undefined ? NAMED[c] : c);

// Build a text line.
//   str: text ('\n' = new line, all caps are used)
//   cap: cap height in metres (default 1)
//   color: default colour ('gold'|'cream'|'rust'|hex), colors: { wordIndex: colour } overrides
//   align: 'center'|'left'|'right' (default center), vAlign: 'middle'|'baseline'|'top'
//   tracking: extra letter spacing in em (default 0.02), lineGap: em (default 1.15)
//   times: array of reveal times, one per word (or a single number = all at once). Missing = shown.
//   out: time the whole line leaves (slides down/fades over outDur, default 0.25)
//   pop: true = words pop (scale) instead of sliding up; dur: reveal duration (default 0.14)
//   slant: italic shear (default SLANT)
// Returns { mesh, words: [{ text, x0, x1, y0, y1 }], times, update(t), redact(i, t, opts), setTimes() }.
export function makeText(str, opts = {}, SU) {
  const A = atlas();
  const cap = opts.cap ?? 1;
  const sc = cap / A.capPx;
  const track = (opts.tracking ?? 0.02) * FPX;
  const slant = opts.slant ?? SLANT;
  const lineGap = (opts.lineGap ?? 1.15) * cap / 0.7;
  const lines = String(str).toUpperCase().split('\n');
  const pos = [], uvs = [], wIdx = [], cols = [], wc = [], index = [];
  const words = [];
  const defCol = toCol(opts.color ?? 'cream');
  let wi = 0, quad = 0;
  lines.forEach((line, li) => {
    const parts = line.split(/\s+/).filter(Boolean);
    // measure
    const wWidths = parts.map((w) => [...w].reduce((s, ch) => s + ((A.map[ch]?.adv ?? A.space) + track), 0) - track);
    const total = wWidths.reduce((a, b) => a + b, 0) + A.space * Math.max(0, parts.length - 1);
    let pen = opts.align === 'left' ? 0 : opts.align === 'right' ? -total : -total / 2;
    const by = -li * lineGap / sc; // baseline in px
    parts.forEach((w, k) => {
      const c = opts.colors && opts.colors[wi] !== undefined ? toCol(opts.colors[wi]) : defCol;
      const x0 = pen;
      for (const ch of w) {
        const gph = A.map[ch];
        if (!gph) { pen += A.space; continue; }
        const qx0 = pen - PAD, qx1 = pen - PAD + gph.w;
        const qy0 = by - (CELL - A.base), qy1 = by + A.base; // px, y up
        const u0 = gph.x / AW, u1 = (gph.x + gph.w) / AW;
        const v1 = 1 - gph.y / AH, v0 = 1 - (gph.y + CELL) / AH;
        const corners = [[qx0, qy0, u0, v0], [qx1, qy0, u1, v0], [qx1, qy1, u1, v1], [qx0, qy1, u0, v1]];
        for (const [x, y, u, v] of corners) {
          pos.push((x + (y - by) * slant) * sc, y * sc, 0);
          uvs.push(u, v); wIdx.push(wi); cols.push(c.r, c.g, c.b);
        }
        const b = quad * 4;
        index.push(b, b + 1, b + 2, b, b + 2, b + 3);
        quad++;
        pen += gph.adv + track;
      }
      pen -= track;
      words.push({ text: w, x0: x0 * sc, x1: pen * sc, y0: by * sc, y1: (by * sc) + cap, line: li });
      pen += A.space;
      wi++;
    });
  });
  // word centres for pop
  const centres = words.map((w) => [(w.x0 + w.x1) / 2 + cap * 0.5 * slant, w.y0 + cap / 2]);
  for (let i = 0; i < wIdx.length; i++) wc.push(...centres[wIdx[i]]);
  // vertical alignment
  const nL = lines.length;
  let dy = 0;
  const va = opts.vAlign ?? 'middle';
  if (va === 'middle') dy = -cap / 2 + ((nL - 1) * lineGap) / 2;
  else if (va === 'top') dy = -cap;
  if (dy) { for (let i = 1; i < pos.length; i += 3) pos[i] += dy; for (let i = 1; i < wc.length; i += 2) wc[i] += dy; for (const w of words) { w.y0 += dy; w.y1 += dy; } }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aWord', new THREE.Float32BufferAttribute(wIdx, 1));
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(cols, 3));
  geo.setAttribute('aWC', new THREE.Float32BufferAttribute(wc, 2));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  const u = {
    map: { value: A.tex }, uK: { value: new Array(MAXW).fill(1) }, uSlide: { value: cap * 0.35 }, uPop: { value: opts.pop ? 1 : 0 },
    uOpacity: { value: opts.opacity ?? 1 }, uBright: { value: opts.bright ?? 1 }, uFade: U.uFade,
    uSceneFade: SU ? SU.uSceneFade : { value: 1 }, uEdge: SU ? SU.uEdge : { value: 0 },
  };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: u, vertexShader: TEXT_V, fragmentShader: TEXT_F, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    depthTest: opts.depthTest !== false, // depthTest: false keeps a sign readable when set pieces pass in front
  }));
  mesh.renderOrder = 6;
  mesh.name = 'bb-text:' + String(str).slice(0, 24);

  const T = {
    mesh, words, cap, u,
    times: null, out: opts.out ?? Infinity, outDur: opts.outDur ?? 0.25, dur: opts.dur ?? 0.14, hides: [],
    setTimes(times) {
      if (typeof times === 'number') this.times = words.map(() => times);
      else this.times = times ? words.map((_, i) => times[i] ?? times[times.length - 1]) : null;
      return this;
    },
    // reveal state for time t (pure). Called by the scene kit every frame.
    update(t) {
      const k = u.uK.value;
      const outK = this.out === Infinity ? 1 : 1 - Math.min(1, Math.max(0, (t - this.out) / this.outDur));
      for (let i = 0; i < words.length && i < MAXW; i++) {
        const t0 = this.times ? this.times[i] : -1e9;
        let r = Math.min(1, Math.max(0, (t - t0) / this.dur));
        for (const h of this.hides) if (h.i === i && t >= h.t) r = 0;
        k[i] = r * outK;
      }
      for (const r of this.reds) r.update(t);
      mesh.visible = outK > 0 && (!this.times || t >= Math.min(...this.times));
    },
    // hide word i from time t on (e.g. a word that "goes out with the lamp")
    hideWord(i, t) { this.hides.push({ i, t }); return this; },
    reds: [],
    // black redaction bar slamming over word i at time t (slides in from the left in 0.12 s, white spark edge)
    redact(i, t, o = {}) {
      const w = words[i];
      const h = (w.y1 - w.y0) * 1.25, wd = (w.x1 - w.x0) + cap * 0.5;
      const g = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(wd, h), new THREE.MeshBasicMaterial({ color: o.color ?? 0x000000 }));
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(cap * 0.06, h * 1.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      edge.position.x = wd / 2;
      g.add(bar, edge);
      g.position.set((w.x0 + w.x1) / 2 + cap * 0.35 * slant, (w.y0 + w.y1) / 2, 0.02);
      g.renderOrder = 7; bar.renderOrder = 7; edge.renderOrder = 8;
      mesh.add(g);
      const cx = g.position.x;
      const R = {
        g, update(tt) {
          const k = Math.min(1, Math.max(0, (tt - t) / 0.12));
          g.visible = tt >= t;
          g.position.x = cx - (1 - k) * wd * 1.6;
          edge.visible = tt < t + 0.5;
        },
      };
      this.reds.push(R);
      return R;
    },
  };
  T.setTimes(opts.times ?? null);
  return T;
}

// ------------------------------------------------------------------------------------------------
// words.json helpers
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '').replace(/’/g, "'");
export function wordIndex(wordsJson) {
  const flat = [];
  (wordsJson?.lines || []).forEach((l, li) => l.w.forEach(([w, s, e], wi) => flat.push({ w, n: norm(w), s, e, li, wi })));
  return {
    flat,
    lines: wordsJson?.lines || [],
    // all words of line i: [{ w, s, e }]
    line(i) { return (this.lines[i]?.w || []).map(([w, s, e]) => ({ w, s, e })); },
    // find a phrase (case/punctuation-insensitive) whose first word is nearest to time `near`.
    // Returns [{ w, s, e }] (one per phrase word) or null.
    match(text, near = 0) {
      const ws = String(text).split(/\s+/).map(norm).filter(Boolean);
      let best = null, bd = Infinity;
      for (let i = 0; i + ws.length <= flat.length; i++) {
        let ok = true;
        for (let k = 0; k < ws.length; k++) if (flat[i + k].n !== ws[k] && flat[i + k].n.replace(/'/g, '') !== ws[k].replace(/'/g, '')) { ok = false; break; }
        if (ok && Math.abs(flat[i].s - near) < bd) { bd = Math.abs(flat[i].s - near); best = i; }
      }
      if (best === null) return null;
      return flat.slice(best, best + ws.length).map((f) => ({ w: f.w, s: f.s, e: f.e }));
    },
    // reveal times for a phrase (start time of each word), with a fallback spacing if not sung
    times(text, near = 0, step = 0.3) {
      const m = this.match(text, near);
      if (m) return m.map((x) => x.s);
      console.warn('[black-box] phrase not in words.json:', text, near);
      return String(text).split(/\s+/).filter(Boolean).map((_, i) => near + i * step);
    },
  };
}
