// Canvas-painted textures: cassette labels, rug, wall art, clock face, record spines, title cards.
// Everything is drawn at load time on the device, so the APK carries no image files.
import * as THREE from 'three';
import { rng } from './fracture.js';

export const FONT = {
  serif: 'DDBodoni',
  serifItalic: 'DDBodoniI',
  sans: 'DDJost',
  caps: 'DDBebas',
};

export async function loadFonts(base = 'fonts/') {
  const list = [
    [FONT.serif, 'BodoniModa.woff2', {}],
    [FONT.serifItalic, 'BodoniModa-Italic.woff2', { style: 'normal' }],
    [FONT.sans, 'Jost.woff2', {}],
    [FONT.caps, 'BebasNeue.ttf', {}],
  ];
  await Promise.all(list.map(async ([fam, file, desc]) => {
    try {
      const f = new FontFace(fam, `url(${base}${file})`, desc);
      await f.load();
      document.fonts.add(f);
    } catch (e) {
      console.warn('font failed', fam, e);
    }
  }));
}

let maxAniso = 4;
export function setAnisotropy(a) { maxAniso = a; }

export function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

function fitText(g, text, font, maxW, size) {
  let s = size;
  g.font = font.replace('{s}', s);
  while (g.measureText(text).width > maxW && s > 6) { s -= 1; g.font = font.replace('{s}', s); }
  return s;
}

function spaced(g, text, x, y, spacing, align = 'center') {
  const chars = [...text];
  const widths = chars.map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = g.textAlign;
  g.textAlign = 'left';
  chars.forEach((c, i) => { g.fillText(c, cx, y); cx += widths[i] + spacing; });
  g.textAlign = prev;
  return total;
}

// ------------------------------------------------------------------------------------------
// Cassette label. song.label = { paper, ink, accent, foil, stripe, catalog }
// The label has a rounded hole where the tape window is (alpha 0). Aspect 100 x 58.
export function cassetteLabel(song) {
  const L = song.label;
  return canvasTex(1024, 594, (g, w, h) => {
    const k = w / 100; // mm -> px
    g.clearRect(0, 0, w, h);
    // paper
    g.fillStyle = L.paper;
    roundRect(g, 0, 0, w, h, 2.2 * k); g.fill();
    // subtle paper grain
    const r = rng(7);
    g.globalAlpha = 0.06;
    for (let i = 0; i < 2200; i++) { g.fillStyle = r() > 0.5 ? '#000' : '#fff'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    g.globalAlpha = 1;
    // header band
    g.fillStyle = L.ink;
    g.fillRect(0, 0, w, 15.5 * k);
    // stripes under header
    g.fillStyle = L.accent; g.fillRect(0, 15.5 * k, w, 1.6 * k);
    g.fillStyle = L.foil; g.fillRect(0, 17.6 * k, w, 0.8 * k);
    // side A disc
    g.fillStyle = L.accent;
    g.beginPath(); g.arc(8.5 * k, 7.75 * k, 5.4 * k, 0, Math.PI * 2); g.fill();
    g.fillStyle = L.paper;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${7.4 * k}px ${FONT.caps}`;
    g.fillText('A', 8.5 * k, 8.2 * k);
    // title in foil italic serif
    const title = song.title;
    const grad = g.createLinearGradient(0, 2 * k, 0, 14 * k);
    grad.addColorStop(0, '#fff3c4'); grad.addColorStop(0.45, L.foil); grad.addColorStop(1, '#7a5a1c');
    g.fillStyle = grad;
    g.textAlign = 'left';
    fitText(g, title, `italic 600 {s}px ${FONT.serifItalic}`, 74 * k, 10.5 * k);
    g.fillText(title, 16.5 * k, 8.4 * k);
    // catalog no.
    g.fillStyle = L.paper; g.globalAlpha = 0.75;
    g.font = `500 ${2.6 * k}px ${FONT.sans}`;
    g.textAlign = 'right';
    spaced(g, L.catalog, 97 * k, 3.6 * k, 0.5 * k, 'right');
    g.globalAlpha = 1;
    // tape window hole (real cassette: ~ 48 x 14 mm centred around y=31)
    g.save();
    g.globalCompositeOperation = 'destination-out';
    roundRect(g, 26 * k, 23.5 * k, 48 * k, 15 * k, 3 * k); g.fill();
    g.restore();
    // window outline
    g.strokeStyle = L.ink; g.lineWidth = 0.6 * k;
    roundRect(g, 25.6 * k, 23.1 * k, 48.8 * k, 15.8 * k, 3.2 * k); g.stroke();
    // left/right blocks beside the window
    g.fillStyle = L.ink;
    g.font = `600 ${3.1 * k}px ${FONT.sans}`;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    spaced(g, 'SIDE', 4 * k, 27 * k, 0.6 * k, 'left');
    g.font = `500 ${2.4 * k}px ${FONT.sans}`;
    g.globalAlpha = 0.7; spaced(g, 'TYPE II', 4 * k, 31 * k, 0.4 * k, 'left'); g.globalAlpha = 1;
    g.textAlign = 'right';
    g.font = `600 ${3.1 * k}px ${FONT.sans}`;
    spaced(g, song.duration, 96 * k, 27 * k, 0.5 * k, 'right');
    g.font = `500 ${2.4 * k}px ${FONT.sans}`;
    g.globalAlpha = 0.7; spaced(g, 'DOLBY NR', 96 * k, 31 * k, 0.4 * k, 'right'); g.globalAlpha = 1;
    // writing lines
    g.strokeStyle = L.ink; g.globalAlpha = 0.28; g.lineWidth = 0.25 * k;
    for (const y of [44, 49]) { g.beginPath(); g.moveTo(5 * k, y * k); g.lineTo(95 * k, y * k); g.stroke(); }
    g.globalAlpha = 1;
    // artist line, handwritten feel via italic serif
    g.fillStyle = L.ink;
    g.textAlign = 'left';
    g.font = `italic 500 ${4.6 * k}px ${FONT.serifItalic}`;
    g.fillText(song.artist, 6 * k, 48.2 * k);
    g.textAlign = 'right';
    g.font = `600 ${2.5 * k}px ${FONT.sans}`;
    g.globalAlpha = 0.6; spaced(g, 'DEAD DROP · LISTENING TAPE', 95 * k, 48 * k, 0.45 * k, 'right'); g.globalAlpha = 1;
    // bottom stripe
    g.fillStyle = L.stripe; g.fillRect(0, 53 * k, w, 1.4 * k);
    g.fillStyle = L.accent; g.fillRect(0, 55 * k, w, 3 * k);
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Spine (top edge) strip of a cassette, aspect 100 x 12
export function cassetteSpine(song) {
  const L = song.label;
  return canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = L.ink; g.fillRect(0, 0, w, h);
    g.fillStyle = L.accent; g.fillRect(0, h - 7, w, 7);
    g.fillStyle = L.foil;
    g.textBaseline = 'middle'; g.textAlign = 'center';
    fitText(g, song.title.toUpperCase(), `400 {s}px ${FONT.caps}`, w * 0.86, 40);
    spaced(g, song.title.toUpperCase(), w / 2, h / 2 - 2, 3);
  });
}

// ------------------------------------------------------------------------------------------
// Room textures

export function rugTexture() {
  return canvasTex(1024, 1024, (g, w, h) => {
    // Dark industrial steel deck floor plate with recessed cable grating & hazard borders
    g.fillStyle = '#14181f'; g.fillRect(0, 0, w, h);
    // outer steel frame
    g.strokeStyle = '#2d3542'; g.lineWidth = 16; g.strokeRect(12, 12, w - 24, h - 24);
    // hazard stripe bands along top and bottom edges (front/back of desk area)
    for (const [yy, hh] of [[24, 28], [h - 52, 28]]) {
      g.save();
      g.beginPath(); g.rect(24, yy, w - 48, hh); g.clip();
      g.fillStyle = '#181c22'; g.fillRect(24, yy, w - 48, hh);
      g.fillStyle = '#b88628';
      for (let x = -h; x < w + h; x += 44) {
        g.beginPath();
        g.moveTo(x, yy + hh); g.lineTo(x + 22, yy + hh);
        g.lineTo(x + 22 + hh, yy); g.lineTo(x + hh, yy);
        g.closePath(); g.fill();
      }
      g.restore();
      g.strokeStyle = '#0c0e12'; g.lineWidth = 3; g.strokeRect(24, yy, w - 48, hh);
    }
    // steel plate grid seams
    g.strokeStyle = '#0b0d12'; g.lineWidth = 5;
    for (const x of [w * 0.33, w * 0.67]) { g.beginPath(); g.moveTo(x, 56); g.lineTo(x, h - 56); g.stroke(); }
    for (const y of [h * 0.36, h * 0.64]) { g.beginPath(); g.moveTo(28, y); g.lineTo(w - 28, y); g.stroke(); }
    g.strokeStyle = 'rgba(130,150,175,0.12)'; g.lineWidth = 2;
    for (const x of [w * 0.33 + 3, w * 0.67 + 3]) { g.beginPath(); g.moveTo(x, 56); g.lineTo(x, h - 56); g.stroke(); }
    // diamond-plate tread pattern on outer panels
    const r = rng(11);
    g.strokeStyle = '#252c37'; g.lineWidth = 3;
    for (let y = 76; y < h - 72; y += 32) {
      for (let x = 44; x < w - 40; x += 32) {
        if (x > w * 0.34 && x < w * 0.66 && y > h * 0.37 && y < h * 0.63) continue; // central grating
        const odd = (((x - 44) / 32 + (y - 76) / 32) & 1) === 1;
        g.save(); g.translate(x, y); g.rotate(odd ? Math.PI / 4 : -Math.PI / 4);
        g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.stroke();
        g.restore();
      }
    }
    // central recessed cable trench grating under the desk
    const gx = w * 0.33 + 10, gy = h * 0.36 + 10, gw = w * 0.34 - 20, gh = h * 0.28 - 20;
    g.fillStyle = '#090b0f'; g.fillRect(gx, gy, gw, gh);
    g.strokeStyle = '#323b48'; g.lineWidth = 6; g.strokeRect(gx, gy, gw, gh);
    // visible cables inside the floor trench
    const trenchCols = ['#7a201e', '#9e6224', '#24303c', '#1a2028'];
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = trenchCols[i]; g.lineWidth = 10;
      g.beginPath(); g.moveTo(gx + 35 + i * 75, gy + 4); g.lineTo(gx + 35 + i * 75, gy + gh - 4); g.stroke();
    }
    // steel grating bars over the trench
    g.fillStyle = '#222832';
    for (let y = gy + 12; y < gy + gh - 8; y += 20) g.fillRect(gx + 4, y, gw - 8, 8);
    // corner rivets / bolts on plates
    g.fillStyle = '#3d4756';
    for (const px of [42, w * 0.33 - 16, w * 0.33 + 16, w * 0.67 - 16, w * 0.67 + 16, w - 42]) {
      for (const py of [72, h * 0.36 - 16, h * 0.36 + 16, h * 0.64 - 16, h * 0.64 + 16, h - 72]) {
        g.beginPath(); g.arc(px, py, 5, 0, Math.PI * 2); g.fill();
      }
    }
    // stencil text
    g.fillStyle = 'rgba(217, 155, 38, 0.42)';
    g.font = `400 28px ${FONT.caps}`; g.textAlign = 'center';
    spaced(g, 'SECTOR 07 · AUDIO INTERCEPT BAY', w / 2, h - 76, 6);
    // industrial wear & grime grain
    g.globalAlpha = 0.06;
    for (let i = 0; i < 24000; i++) { g.fillStyle = r() > 0.5 ? '#000' : '#8aa0b8'; g.fillRect(r() * w, r() * h, 2, 2); }
    g.globalAlpha = 1;
  });
}

// Technical intercept schematic & acoustic wiring diagram on dark phosphor slate
export function artTexture(seed = 3) {
  return canvasTex(512, 768, (g, w, h) => {
    g.fillStyle = '#0d131a'; g.fillRect(0, 0, w, h);
    // technical grid
    g.strokeStyle = 'rgba(64, 140, 160, 0.16)'; g.lineWidth = 1;
    for (let x = 24; x < w; x += 24) { g.beginPath(); g.moveTo(x, 24); g.lineTo(x, h - 24); g.stroke(); }
    for (let y = 24; y < h; y += 24) { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); }
    // outer border & title block
    g.strokeStyle = '#c8963e'; g.lineWidth = 4; g.strokeRect(24, 24, w - 48, h - 48);
    g.strokeStyle = 'rgba(200, 150, 62, 0.45)'; g.lineWidth = 1.5; g.strokeRect(32, 32, w - 64, h - 64);
    g.fillStyle = '#16202b'; g.fillRect(26, 26, w - 52, 68);
    g.fillStyle = '#d9a93a'; g.font = `400 32px ${FONT.caps}`; g.textAlign = 'left';
    spaced(g, 'MODEL 7 · SIGNAL ROUTING', 44, 68, 3, 'left');
    // upper diagram: twin tape reels + head bridge
    const cy = 235;
    for (const cx of [w * 0.32, w * 0.68]) {
      g.strokeStyle = '#488898'; g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, 68, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#d9a93a'; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, cy, 24, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
        g.lineTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62); g.stroke();
      }
    }
    // magnetic tape path
    g.strokeStyle = '#c8302a'; g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(w * 0.32 - 48, cy + 48); g.lineTo(w * 0.5, cy + 92); g.lineTo(w * 0.68 + 48, cy + 48); g.stroke();
    // middle section: oscilloscope waveform / harmonic envelope
    g.fillStyle = '#090d12'; g.fillRect(48, 360, w - 96, 150);
    g.strokeStyle = '#2d4454'; g.lineWidth = 2; g.strokeRect(48, 360, w - 96, 150);
    g.strokeStyle = '#38d878'; g.lineWidth = 3;
    g.beginPath();
    for (let x = 56; x < w - 56; x += 4) {
      const u = (x - 56) / (w - 112);
      const env = Math.sin(u * Math.PI) * (0.3 + 0.7 * Math.pow(Math.sin(u * Math.PI * 3), 2));
      const y = 435 + Math.sin(u * 42) * 52 * env;
      if (x === 56) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    // lower section: bus lines & node terminals
    g.strokeStyle = '#d9a93a'; g.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      const y = 555 + i * 26;
      g.beginPath(); g.moveTo(56, y); g.lineTo(w - 56, y); g.stroke();
      g.fillStyle = i === 1 ? '#c8302a' : '#d9a93a';
      g.beginPath(); g.arc(90 + ((i * 83) % (w - 180)), y, 6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = 'rgba(200, 48, 42, 0.85)'; g.font = `400 26px ${FONT.caps}`;
    spaced(g, 'CLASSIFIED · LINE 04 ACTIVE', 48, h - 46, 3, 'left');
  });
}

export function clockFace() {
  return canvasTex(512, 512, (g, w, h) => {
    const c = w / 2;
    g.clearRect(0, 0, w, h);
    // dark industrial bulkhead chronometer dial
    g.fillStyle = '#10141b'; g.beginPath(); g.arc(c, c, c * 0.72, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c8963e'; g.lineWidth = 8;
    g.beginPath(); g.arc(c, c, c * 0.70, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(217, 169, 58, 0.35)'; g.lineWidth = 2;
    g.beginPath(); g.arc(c, c, c * 0.56, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const maj = i % 5 === 0;
      g.save(); g.translate(c, c); g.rotate(a);
      g.fillStyle = i === 0 ? '#c8302a' : maj ? '#efe2c4' : 'rgba(239,226,196,0.45)';
      g.fillRect(maj ? -4 : -1.5, -c * 0.66, maj ? 8 : 3, maj ? (i % 15 === 0 ? 38 : 26) : 12);
      g.restore();
    }
    g.fillStyle = 'rgba(217, 169, 58, 0.75)';
    g.font = `400 24px ${FONT.caps}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    spaced(g, 'MASTER SYNC', c, c - 54, 3);
    g.fillStyle = '#c8302a'; g.beginPath(); g.arc(c, c, 11, 0, Math.PI * 2); g.fill();
  });
}

export function recordSpines(count = 48) {
  return canvasTex(1024, 256, (g, w, h) => {
    // Industrial cassette & master-tape archive rack bay
    const r = rng(23);
    g.fillStyle = '#0c0f14'; g.fillRect(0, 0, w, h);
    // top & bottom steel retainer rails
    g.fillStyle = '#252c36'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
    const pal = ['#1c242e', '#28323e', '#7a2220', '#9a6424', '#1f4248', '#22262e', '#3a2420', '#2d3a46'];
    let x = 8;
    let idx = 1;
    while (x < w - 18) {
      const sw = 18 + Math.floor(r() * 14);
      // steel divider fin
      g.fillStyle = '#323a46'; g.fillRect(x - 2, 10, 2, h - 20);
      // tape cassette / master cartridge spine
      g.fillStyle = pal[Math.floor(r() * pal.length)];
      g.fillRect(x + 1, 16, sw - 4, h - 32);
      // metallic label band & catalog stripe
      g.fillStyle = '#e5d6b4';
      g.fillRect(x + 3, 34, sw - 8, h * 0.42);
      g.fillStyle = r() > 0.7 ? '#c8302a' : '#c8963e';
      g.fillRect(x + 3, 34, sw - 8, 8);
      // LED indicator at top of slot
      g.fillStyle = r() > 0.82 ? '#38d878' : r() > 0.65 ? '#ffaa2a' : '#2a323c';
      g.fillRect(x + sw * 0.35, 20, 5, 5);
      x += sw;
      idx++;
    }
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(0,0,0,0.35)'); grd.addColorStop(0.2, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
}

// Desk card with three steps. English UI on purpose (store-ready).
export function instructionCard() {
  return canvasTex(640, 860, (g, w, h) => {
    g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    g.globalAlpha = 0.05;
    for (let i = 0; i < 4000; i++) { g.fillStyle = '#000'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    g.globalAlpha = 1;
    g.fillStyle = '#c8302a';
    g.font = `400 64px ${FONT.caps}`;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    spaced(g, 'FIELD NOTES', w / 2, 96, 6);
    g.fillRect(70, 118, w - 140, 4);
    const steps = [
      ['1', 'PICK A TAPE', 'Grip or pinch to grab:', 'you hear its best part.'],
      ['2', 'SLOT IT IN', 'Drop the tape into the', 'deck. The lid closes itself.'],
      ['3', 'HOLD ON', 'The song takes the room.', 'Hold B, Y or your watch.'],
    ];
    steps.forEach(([n, t, a, b], i) => {
      const y = 210 + i * 210;
      g.fillStyle = '#12161f';
      g.beginPath(); g.arc(110, y, 42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#efe4c8';
      g.font = `400 60px ${FONT.caps}`;
      g.textAlign = 'center'; g.fillText(n, 110, y + 21);
      g.fillStyle = '#12161f';
      g.textAlign = 'left';
      g.font = `400 54px ${FONT.caps}`;
      spaced(g, t, 176, y - 6, 3, 'left');
      g.font = `400 31px ${FONT.sans}`;
      g.globalAlpha = 0.8;
      g.fillText(a, 176, y + 36);
      g.fillText(b, 176, y + 72);
      g.globalAlpha = 1;
    });
    g.save();
    g.translate(w - 150, h - 90); g.rotate(-0.18);
    g.strokeStyle = 'rgba(200,48,42,0.75)'; g.lineWidth = 5;
    g.strokeRect(-110, -40, 220, 70);
    g.fillStyle = 'rgba(200,48,42,0.75)';
    g.font = `400 46px ${FONT.caps}`; g.textAlign = 'center';
    spaced(g, 'EYES ONLY', 0, 12, 4);
    g.restore();
  });
}

// Brass plate strip with slot numbers (atlas: n plates side by side)
export function plateAtlas(n = 12) {
  return canvasTex(128 * n, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) {
      const x = i * 128;
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#f2d98c'); grd.addColorStop(0.5, '#c9a046'); grd.addColorStop(1, '#8b6a24');
      g.fillStyle = grd; g.fillRect(x, 0, 128, h);
      g.fillStyle = '#3a2a10';
      g.font = `400 46px ${FONT.caps}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i + 1).padStart(2, '0'), x + 64, h / 2 + 3);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath(); g.arc(x + 12, h / 2, 4, 0, Math.PI * 2); g.arc(x + 116, h / 2, 4, 0, Math.PI * 2); g.fill();
    }
  });
}

export function deckFascia() {
  return canvasTex(1024, 256, (g, w, h) => {
    // dark anodized brushed gunmetal steel
    const r = rng(41);
    g.fillStyle = '#242a33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.18)'; g.fillRect(0, r() * h, w, 1); }
    g.strokeStyle = '#3d4756'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#e8dfc8';
    g.font = `600 44px ${FONT.sans}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    spaced(g, 'DEAD DROP', 40, 70, 10, 'left');
    g.fillStyle = '#d9a93a';
    g.font = `400 26px ${FONT.sans}`;
    spaced(g, 'INTERCEPT DECK · MODEL 7', 40, 118, 5, 'left');
    g.fillStyle = '#c8302a'; g.fillRect(40, 150, 96, 6);
    g.textAlign = 'right';
    g.fillStyle = '#a8b4c4';
    g.font = `400 24px ${FONT.sans}`;
    spaced(g, 'MAGNETIC TAPE TRANSPORT', w - 40, 70, 4, 'right');
    spaced(g, 'STEEL BIAS · DOLBY B', w - 40, 110, 4, 'right');
  });
}

export function vuFace(label = 'LEFT') {
  return canvasTex(512, 300, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 1.1, 10, w / 2, h * 0.9, h * 1.2);
    grd.addColorStop(0, '#ffe2a2'); grd.addColorStop(1, '#e7b45a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 1.02, R = h * 0.8;
    g.strokeStyle = '#2a1d0c'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, R, Math.PI * 1.25, Math.PI * 1.75); g.stroke();
    g.strokeStyle = '#c8302a'; g.lineWidth = 7;
    g.beginPath(); g.arc(cx, cy, R, Math.PI * 1.62, Math.PI * 1.75); g.stroke();
    const marks = [-20, -10, -7, -5, -3, -1, 0, 1, 3];
    marks.forEach((db, i) => {
      const a = Math.PI * 1.25 + (i / (marks.length - 1)) * Math.PI * 0.5;
      g.strokeStyle = db >= 0 ? '#c8302a' : '#2a1d0c'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16)); g.stroke();
      g.fillStyle = db >= 0 ? '#c8302a' : '#2a1d0c';
      g.font = `500 22px ${FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(Math.abs(db)), cx + Math.cos(a) * (R + 36), cy + Math.sin(a) * (R + 36));
    });
    g.fillStyle = '#2a1d0c'; g.font = `600 34px ${FONT.caps}`;
    g.fillText('VU', cx, h * 0.62);
    g.font = `500 18px ${FONT.sans}`; g.globalAlpha = 0.7;
    spaced(g, label, cx, h * 0.78, 4); g.globalAlpha = 1;
  });
}

// Lit windows for skyline blocks: tiny grid, randomly lit warm/cool
export function windowsTex(seed = 1) {
  return canvasTex(256, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = '#0d1222'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 6; y += 14) {
      for (let x = 6; x < w - 6; x += 12) {
        const v = r();
        if (v > 0.62) {
          g.fillStyle = v > 0.93 ? '#9fd4ff' : v > 0.8 ? '#ffd27a' : '#e9a24a';
          g.globalAlpha = 0.55 + r() * 0.45;
          g.fillRect(x, y, 7, 8);
        }
      }
    }
    g.globalAlpha = 1;
  }, { repeat: true });
}

// Big title card (transparent background): title + credit lines
export function titleCard(lines, { foil = '#d9a93a', w = 2048, h = 768 } = {}) {
  return canvasTex(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const grad = g.createLinearGradient(0, h * 0.15, 0, h * 0.62);
    grad.addColorStop(0, '#fff6d2'); grad.addColorStop(0.4, foil); grad.addColorStop(0.75, '#8a6420'); grad.addColorStop(1, '#f0cf7a');
    g.fillStyle = grad;
    g.shadowColor = 'rgba(0,0,0,0.0)';
    fitText(g, lines.title, `italic 600 {s}px ${FONT.serifItalic}`, w * 0.92, 270);
    g.fillText(lines.title, w / 2, h * 0.56);
    g.fillStyle = '#f3e6c4';
    g.font = `400 64px ${FONT.caps}`;
    if (lines.sub) spaced(g, lines.sub, w / 2, h * 0.76, 22);
    if (lines.top) { g.font = `400 52px ${FONT.caps}`; g.globalAlpha = 0.8; spaced(g, lines.top, w / 2, h * 0.14, 26); g.globalAlpha = 1; }
  });
}

// Soft radial blob (alpha), used for glows, contact shadows and dust sprites
export function blobTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  return canvasTex(size, size, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, inner); grd.addColorStop(1, outer);
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
  }, { srgb: false });
}
