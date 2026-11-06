// Canvas textures for the Copper Line show: sign letters, stencil plates, number drum, face mask.
import * as THREE from 'three';
import { canvasTex, FONT } from '../../gfx/textures.js';

// One letter per cell, in a horizontal strip. Saul-Bass-ish cut letters: cream face, copper edge.
export function letterStrip(text, { cell = 160, font = FONT.caps, fill = '#f3e6c4', edge = '#b4652a' } = {}) {
  const chars = [...text];
  const tex = canvasTex(cell * chars.length, cell, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Math.round(cell * 0.92)}px ${font}`;
    chars.forEach((c, i) => {
      const x = (i + 0.5) * cell, y = cell * 0.54;
      g.lineJoin = 'round';
      g.strokeStyle = edge; g.lineWidth = cell * 0.09; g.strokeText(c, x, y);
      g.fillStyle = fill; g.fillText(c, x, y);
    });
  });
  tex.generateMipmaps = true;
  return { tex, n: chars.length };
}

// Stencil plate text (floor numbers, box numbers)
export function plateTex(text, { w = 256, h = 128, bg = '#d9a93a', ink = '#14181f', font = FONT.caps, size = 0.78, border = true } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = ink; g.lineWidth = h * 0.06; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12); }
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Math.round(h * size)}px ${font}`;
    g.fillText(text, w / 2, h * 0.54);
  });
}

// Number drum: digits 0..9 stacked vertically (v = digit / 10), cream on black, for a cylinder
export function digitDrum() {
  const w = 256, h = 2560;
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#101317'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 ${Math.round(h / 10 * 0.82)}px ${FONT.caps}`;
    for (let d = 0; d < 10; d++) {
      const y = h - (d + 0.5) * (h / 10);
      g.fillStyle = d === 0 ? '#e0a527' : '#efe2c4';
      g.fillText(String(d), w / 2, y + h * 0.004);
      g.fillStyle = '#2a2f36'; g.fillRect(0, y - h / 20, w, 3);
    }
  });
}

// Face mask for the mirror towers' windows: R = lips, G = eyes and brows. Drawn as a 1960s
// poster face (almond eyes with heavy lids, one brow raised, a closed-lip smile).
export function faceMask() {
  const w = 128, h = 256;
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const eye = (cx, cy, wink) => {
      g.fillStyle = '#0f0';
      g.beginPath();
      if (wink) {
        g.moveTo(cx - 24, cy + 2); g.quadraticCurveTo(cx, cy + 12, cx + 24, cy + 2);
        g.quadraticCurveTo(cx, cy + 6, cx - 24, cy + 2);
        g.lineWidth = 7; g.strokeStyle = '#0f0'; g.stroke();
      } else {
        g.moveTo(cx - 26, cy); g.quadraticCurveTo(cx, cy - 22, cx + 26, cy); g.quadraticCurveTo(cx, cy + 16, cx - 26, cy); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(cx + 2, cy - 1, 7, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = '#0f0'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 26, cy - 30 - (wink ? 0 : 6)); g.quadraticCurveTo(cx, cy - 44 - (wink ? 0 : 8), cx + 24, cy - 32); g.stroke();
    };
    const t = 0;
    eye(36, 92, t); eye(92, 92, t);
    g.fillStyle = '#f00';
    g.beginPath();
    g.moveTo(30, 178); g.quadraticCurveTo(64, 160, 98, 178); g.quadraticCurveTo(64, 214, 30, 178); g.fill();
  }, { srgb: false });
}
// same face, winking (right eye closed)
export function faceMaskWink() {
  const w = 128, h = 256;
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0f0';
    g.beginPath(); g.moveTo(10, 92); g.quadraticCurveTo(36, 70, 62, 92); g.quadraticCurveTo(36, 108, 10, 92); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(38, 91, 7, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#0f0'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(10, 56); g.quadraticCurveTo(36, 40, 60, 54); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(68, 96); g.quadraticCurveTo(92, 106, 116, 94); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(68, 66); g.quadraticCurveTo(92, 58, 116, 66); g.stroke();
    g.fillStyle = '#f00';
    g.beginPath(); g.moveTo(30, 178); g.quadraticCurveTo(64, 160, 98, 172); g.quadraticCurveTo(64, 214, 30, 178); g.fill();
  }, { srgb: false });
}

export { THREE };
