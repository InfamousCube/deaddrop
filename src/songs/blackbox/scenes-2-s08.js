// S08 The bomb chamber and the gold harp (56.61 to 67.74, hot). A velvet dome painted with a dark
// sunburst; a colossal 1960s time bomb counts 03-02-01-00 and freezes; giant wire-cutters swing in,
// hover over the rust, the cyan and finally cut the GOLD wire. A 360-degree harp of 72 gold wires
// rings the player: it lights in a sweep around them, gets plucked on "oh-oh", pulses run up to the
// dome. Out: EDGE-MODE at 67.74 (cyan lines of bomb, dome and harp).
import * as THREE from 'three';
import { PAL, U } from './style.js';
import { D2R, sm, env, bump, merge, rod, slab, shapeOf, samplePts, along } from './scenes-2-util.js';

const FLOOR = -3, DR = 24; // floor height, dome radius (centred on the player)
const BZ = -20; // bomb stick row (z at d = 0)
const FLIPS = [56.61, 57.0, 57.3, 57.5];
const PULSES = [60.62, 61.18, 61.75, 62.32];

const HARP_V = /* glsl */ `
attribute vec4 aW; // angle, radius, height, phase
uniform float uRot, uAmp, uTime, uFloor, uSweep;
varying float vY; varying float vLit; varying float vHead;
void main() {
  float ang = aW.x + uRot;
  vec3 rad = vec3(sin(ang), 0.0, -cos(ang));
  vec3 tng = vec3(cos(ang), 0.0, sin(ang));
  float y = position.y;
  float bow = sin(3.14159 * y) * uAmp * sin(uTime * 34.0 + aW.w);
  vec3 p = rad * (aW.y + position.z) + tng * (position.x + bow) + vec3(0.0, uFloor + y * aW.z, 0.0);
  float a = mod(ang, 6.28318);
  vLit = step(a, uSweep);
  vHead = vLit * exp(-pow((uSweep - a) * 2.2, 2.0));
  vY = y;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
}`;
const HARP_F = /* glsl */ `
uniform vec3 uDim, uLit, uHot, uCyan; uniform float uFlash, uPulse, uPulseA, uEdgeC, uOn, uFade, uSceneFade;
varying float vY; varying float vLit; varying float vHead;
void main() {
  vec3 c = mix(uDim, uLit, vLit);
  float g = vHead * 1.2 + uFlash + uPulseA * exp(-pow((vY - uPulse) * 9.0, 2.0)) * 1.6;
  c = mix(c, uHot, clamp(g, 0.0, 1.0));
  c = mix(c, uCyan, uEdgeC);
  c *= uOn * uFade * uSceneFade;
  if (uOn < 0.003) discard;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export const S08 = {
  id: 'S08', t0: 56.61, t1: 67.74, world: 'hot', pre: 0.3, post: 0.4,
  key: [0, -0.35, 0.94],
  fog: { color: PAL.velvet, near: 40, far: 200 },
  sky: false,

  build(kit) {
    const s = { A: new THREE.Object3D(), v: new THREE.Vector3(), pulse: [{ z: 0, a: 0, w: 1.2 }, { z: 0, a: 0, w: 1.2 }] };
    const R = kit.rnd(808);
    s.prof = kit.travel([[56.61, 2.8, 0.01], [57.45, 0, 0.08], [58.33, 2.6, 0.5], [59.2, 0, 0.8]]);
    s.rot = kit.travel([[56.61, 4, 0.01], [57.5, 0, 0.05], [58.33, 4, 0.6]]);
    s.root = new THREE.Group(); s.root.name = 's08-root';
    kit.group.add(s.root);

    // ---- the dome: velvet black, painted with a 32-wedge carmine sunburst and gold target rings ----
    const P = [], C = [], c = new THREE.Color();
    const pt = (az, el) => [DR * Math.cos(el) * Math.sin(az), FLOOR + DR * Math.sin(el), -DR * Math.cos(el) * Math.cos(az)];
    const tri = (a, b, d, col) => { P.push(...a, ...b, ...d); c.set(col); for (let i = 0; i < 3; i++) C.push(c.r, c.g, c.b); };
    const els = [0, 9, 18, 26, 34, 35.4, 44, 53, 54.4, 62, 70, 71.2, 78, 84, 90].map((e) => e * D2R);
    const NW = 32;
    for (let w = 0; w < NW; w++) {
      const a0 = (w / NW) * Math.PI * 2, a1 = ((w + 1) / NW) * Math.PI * 2;
      for (let k = 0; k < els.length - 1; k++) {
        const e0 = els[k], e1 = els[k + 1];
        let col = w % 2 ? PAL.carmineDeep : PAL.crimson;
        if (k === 0) col = PAL.carmine;
        if (k === 4 || k === 7 || k === 10) col = PAL.gold;
        if (k === 0 && w % 4 === 0) col = PAL.velvet;
        tri(pt(a0, e0), pt(a1, e0), pt(a1, e1), col); tri(pt(a0, e0), pt(a1, e1), pt(a0, e1), col);
      }
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    dg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    dg.computeVertexNormals();
    s.domeMat = kit.flat({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, fog: 0 });
    s.dome = new THREE.Mesh(dg, s.domeMat);
    s.dome.frustumCulled = false;
    s.oculus = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24).rotateX(Math.PI / 2).translate(0, FLOOR + DR - 0.4, 0), kit.flat({ color: PAL.goldHi, fog: 0, side: THREE.DoubleSide }));
    // floor: velvet disc with carmine target rings
    const fl = [new THREE.CircleGeometry(DR + 0.5, 48)];
    const cols = [PAL.velvet];
    for (const r of [3.2, 6.4, 16.2, 19.6, 22.8]) { fl.push(new THREE.RingGeometry(r, r + 0.14, 64)); cols.push(PAL.carmine); }
    const fgeo = merge(fl.map((g, i) => { const n = g.index ? g.toNonIndexed() : g; const a = new Float32Array(n.getAttribute('position').count * 3); c.set(cols[i]); for (let j = 0; j < a.length; j += 3) { a[j] = c.r; a[j + 1] = c.g; a[j + 2] = c.b; } n.setAttribute('color', new THREE.BufferAttribute(a, 3)); n.translate(0, 0, i * 0.004); return n; }));
    fgeo.rotateX(-Math.PI / 2); fgeo.translate(0, FLOOR, 0);
    const floor = new THREE.Mesh(fgeo, kit.flat({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, fog: 0 }));
    // harp plinth ring
    const plinth = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(8.3, 0), new THREE.Vector2(14.7, 0), new THREE.Vector2(14.7, 0.55), new THREE.Vector2(8.3, 0.55), new THREE.Vector2(8.3, 0)], 48).translate(0, FLOOR, 0), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.45, side: THREE.DoubleSide }));
    s.root.add(s.dome, s.oculus, floor, plinth);

    // ---- the harp: 72 gold wires in three staggered rings (9, 11.5, 14 m), floor to dome ----
    const base = new THREE.CylinderGeometry(0.045, 0.045, 1, 4, 20, true).translate(0, 0.5, 0);
    const hg = new THREE.InstancedBufferGeometry();
    hg.index = base.index; hg.setAttribute('position', base.getAttribute('position'));
    const aW = new Float32Array(72 * 4);
    for (let i = 0; i < 72; i++) {
      const ring = i % 3, r = [9, 11.5, 14][ring];
      aW.set([(i / 72) * Math.PI * 2, r, Math.sqrt(DR * DR - r * r) - 0.3, R() * 6.28], i * 4);
    }
    hg.setAttribute('aW', new THREE.InstancedBufferAttribute(aW, 4));
    hg.instanceCount = 72;
    s.hu = {
      uRot: { value: 0 }, uAmp: { value: 0 }, uTime: U.uTime, uFloor: { value: FLOOR + 0.55 }, uSweep: { value: 0 },
      uDim: { value: new THREE.Color(PAL.brassDark).multiplyScalar(1.6) }, uLit: { value: new THREE.Color(PAL.gold) }, uHot: { value: new THREE.Color(PAL.goldHi) }, uCyan: { value: new THREE.Color(PAL.cyan) },
      uFlash: { value: 0 }, uPulse: { value: -1 }, uPulseA: { value: 0 }, uEdgeC: { value: 0 }, uOn: { value: 1 }, uFade: U.uFade, uSceneFade: kit.SU.uSceneFade,
    };
    s.harp = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: s.hu, vertexShader: HARP_V, fragmentShader: HARP_F }));
    s.harp.frustumCulled = false;
    s.root.add(s.harp);

    // ---- the bomb (travels toward the player) ----
    s.B = new THREE.Group(); s.root.add(s.B);
    s.Bs = new THREE.Group(); s.B.add(s.Bs); // solid parts (for the edge lines)
    const sticks = [];
    for (let i = 0; i < 7; i++) sticks.push(new THREE.CylinderGeometry(0.6, 0.6, 9, 10).translate((i - 3) * 1.26, FLOOR + 4.5, BZ + 0.07 * (i - 3) * (i - 3)));
    const stickM = new THREE.Mesh(merge(sticks), kit.toon({ ramp: 'hot', rim: PAL.gold, rimTh: 0.5 }));
    s.stickMat = stickM.material;
    const strapM = new THREE.Mesh(merge([
      new THREE.BoxGeometry(9.4, 0.55, 1.75).translate(0, FLOOR + 1.7, BZ + 0.25),
      new THREE.BoxGeometry(9.4, 0.55, 1.75).translate(0, FLOOR + 4.6, BZ + 0.25),
      new THREE.BoxGeometry(9.4, 0.55, 1.75).translate(0, FLOOR + 7.5, BZ + 0.25),
      new THREE.BoxGeometry(4, 2, 1.1).translate(0, -1.1, BZ + 0.75),
      new THREE.CylinderGeometry(0.75, 0.75, 0.5, 12).rotateX(Math.PI / 2).translate(-2.6, 0.5, BZ + 0.85),
      new THREE.CylinderGeometry(0.75, 0.75, 0.5, 12).rotateX(Math.PI / 2).translate(2.6, 0.5, BZ + 0.85),
    ]), kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.5 }));
    s.bezel = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.45).translate(0, -1.1, BZ + 1.32), kit.flat({ color: PAL.rust }));
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 1.15).translate(0, -1.1, BZ + 1.34), kit.flat({ color: PAL.black }));
    s.Bs.add(stickM, strapM, s.bezel, inner);
    s.digits = ['03', '02', '01', '00'].map((str) => {
      const T = kit.text(str, { cap: 0.85, color: 'cream', tracking: 0.12, parent: s.B });
      T.mesh.position.set(0, -1.1, BZ + 1.38);
      return T;
    });
    // three wires from the timer: rust and cyan into the sticks, GOLD up into the overhead wire
    const tube = (pts, r, col, parent) => {
      const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(cv, 32, r, 5), kit.flat({ color: col }));
      parent.add(m);
      return cv;
    };
    tube([[1.9, -0.8, BZ + 1.2], [3.1, 0.2, BZ + 1.7], [3.7, 1.5, BZ + 1.3], [3.4, 2.6, BZ + 0.75]], 0.13, PAL.rust, s.Bs);
    tube([[0.9, -2.1, BZ + 1.2], [1.4, -2.85, BZ + 2.2], [3.0, -2.85, BZ + 2.7], [4.6, -1.1, BZ + 1.6], [4.5, 0.5, BZ + 0.7]], 0.13, PAL.cyan, s.Bs);
    const goldPts = [[-1.9, -0.7, BZ + 1.2], [-4.0, 1.1, BZ + 1.8], [-6.4, 3.4, BZ + 2.6], [-8.8, 5.6, BZ + 3.6], [-8.0, 6.4, BZ + 5.5], [-4.4, 5.0, BZ + 7.4], [0, 3.4, BZ + 9.0]];
    const gcv = new THREE.CatmullRomCurve3(goldPts.map((p) => new THREE.Vector3(...p)));
    const UC = 0.17; // cut point along the gold wire
    const sub = (a, b) => new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => gcv.getPoint(a + (b - a) * (i / 11))));
    s.cut = gcv.getPoint(UC);
    s.junction = new THREE.Vector3(0, 3.4, BZ + 9.0);
    const goldMat = kit.flat({ color: PAL.gold });
    // lower piece pivots at the timer, upper piece at the junction with the overhead wire
    s.gLow = new THREE.Group(); s.gLow.position.set(...goldPts[0]);
    const lowCv = sub(0, UC - 0.006);
    s.gLow.add(new THREE.Mesh(new THREE.TubeGeometry(lowCv, 8, 0.13, 5).translate(-goldPts[0][0], -goldPts[0][1], -goldPts[0][2]), goldMat));
    s.gUp = new THREE.Group(); s.gUp.position.copy(s.junction);
    const upCv = sub(UC + 0.006, 1);
    s.gUp.add(new THREE.Mesh(new THREE.TubeGeometry(upCv, 40, 0.13, 5).translate(-s.junction.x, -s.junction.y, -s.junction.z), goldMat));
    s.upPts = samplePts(upCv, 40).map((p) => p.sub(s.junction));
    s.Bs.add(s.gLow, s.gUp);
    // the giant wire-cutters: two halves (black, gold edge plates) around a pivot
    const half = shapeOf([[0.02, -2.7], [0.36, -1.8], [0.72, -0.6], [0.78, 0.6], [1.08, 3.0], [0.98, 9.0], [0.28, 9.25], [0.16, 3.2], [-0.2, 0.6], [-0.16, -0.6], [-0.12, -1.6]]);
    const cutBlack = slab(half, 0.45, 0, 2);
    const cutGold = new THREE.ShapeGeometry(half).scale(1.07, 1.03, 1).translate(-0.02, 0, -0.26);
    s.cutters = new THREE.Group();
    s.halves = [1, -1].map((sx) => {
      const g = new THREE.Group(); g.scale.x = sx;
      g.add(new THREE.Mesh(cutBlack, kit.toon({ ramp: 'black', rim: PAL.gold, rimTh: 0.45, side: THREE.DoubleSide })));
      g.add(new THREE.Mesh(cutGold, kit.flat({ color: PAL.gold, side: THREE.DoubleSide })));
      s.cutters.add(g);
      return g;
    });
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 10).rotateX(Math.PI / 2), kit.toon({ ramp: 'gold', rim: null }));
    s.cutters.add(bolt);
    s.Bs.add(s.cutters);
    s.targets = [
      new THREE.Vector3(3.55, 1.0, BZ + 1.75), // rust
      new THREE.Vector3(3.0, -2.85, BZ + 2.7), // cyan
      s.cut.clone(), // gold
    ];
    s.hide = new THREE.Vector3(15, 19, BZ + 3);
    s.cpos = (t, out) => {
      const T = s.targets;
      if (t < 58.33) return out.copy(s.hide);
      if (t < 58.9) return out.copy(s.hide).lerp(T[0], sm(58.33, 58.88, t));
      if (t < 59.46) return out.copy(T[0]).lerp(T[1], sm(58.9, 59.25, t));
      if (t < 60.4) return out.copy(T[1]).lerp(T[2], sm(59.46, 59.8, t));
      return out.copy(T[2]).lerp(s.hide, sm(60.4, 61.3, t));
    };
    // snip sparks
    s.snip = kit.particles({
      n: 56, shape: 'stroke', size: 0.6, fog: 0, seed: 81,
      init: (i, r) => { const a = r() * Math.PI * 2, sp = 5 + r() * 9; return { p: [s.cut.x, s.cut.y, s.cut.z], v: [Math.cos(a) * sp, Math.sin(a) * sp + 2, (r() - 0.2) * 5], g: [0, -14, 0], t0: 59.96, life: 0.45 + r() * 0.35, s: 0.4 + r() * 0.6, c: r() < 0.5 ? PAL.white : PAL.cream }; },
    });
    s.B.add(s.snip);

    // edge lines for the out-transition (bomb solids, dome, plinth); cutters in their 67.74 pose
    s.cutters.position.set(s.hide.x, s.hide.y + 2.7, s.hide.z + 0.5); s.cutters.rotation.z = 0.6;
    s.halves[0].rotation.z = -0.26; s.halves[1].rotation.z = 0.26;
    s.edgesB = kit.edges(s.Bs, { color: PAL.cyan, threshold: 22 }); s.B.add(s.edgesB);
    s.edgesD = kit.edges(s.dome, { color: PAL.cyan, threshold: 4 }); s.dome.add(s.edgesD);
    s.edgesP = kit.edges(plinth, { color: PAL.cyan, threshold: 30 }); s.root.add(s.edgesP);

    s.bead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), kit.flat({ color: PAL.goldHi, fog: 0 }));
    s.gUp.add(s.bead);
    // ---- lyric type ----
    s.count = kit.text('COUNT DOWN\nTO', { cap: 0.95, color: 'gold', times: [56.61, 57.0, 57.3], out: 58.5, at: { d: 7, az: -25, y: 2.55 } });
    const wTo = s.count.words[2];
    s.zero = kit.text('0', { cap: 1.6, color: 'gold', times: [57.5], pop: true, dur: 0.16, parent: s.count.mesh });
    s.zero.mesh.position.set(wTo.x1 + 0.7, (wTo.y0 + wTo.y1) / 2 + 0.3, 0);
    s.why = kit.text("DON'T ASK\nME WHY", { cap: 0.95, color: 'cream', near: 58.48, say: "don't ask me why", out: 62.4, at: { d: 7, az: 25, y: 2.55 } });
    s.why.redact(3, 59.84);
    // GOLD ON THE WIRE runs along the upper cut piece, tilted with it
    const mid = gcv.getPoint(0.27).sub(s.junction), dir = gcv.getPoint(0.36).sub(gcv.getPoint(0.18));
    const roll = Math.atan2(-dir.y, -dir.x);
    s.goldT = kit.text('GOLD ON THE WIRE', { cap: 0.78, color: 'gold', near: 59.96, out: 63.95, parent: s.gUp });
    s.goldT.mesh.position.set(mid.x + 0.55, mid.y + 0.6, mid.z + 0.25);
    s.goldT.mesh.rotation.set(0, 0.42, roll, 'YXZ');
    s.tonight = kit.text('TONIGHT', { cap: 1.5, color: 'cream', near: 62.62, out: 63.95, at: { d: 7, az: 22, y: 2.1 } });
    s.oh1 = kit.text('OH-OH', { cap: 1.35, color: 'gold', near: 64.0, say: 'oh-oh', out: 66.6, at: { d: 6.5, az: -22, y: 2.75 } });
    s.g1 = kit.text('GOLD ON THE WIRE', { cap: 0.6, color: 'cream', near: 64.94, out: 66.6, at: { d: 6.5, az: -22, y: 1.55 } });
    s.oh2 = kit.text('OH-OH', { cap: 1.35, color: 'gold', near: 66.72, say: 'oh-oh', out: 67.74, outDur: 0.02, at: { d: 6.5, az: 22, y: 2.75 } });
    s.g2 = kit.text('GOLD ON THE WIRE', { cap: 0.6, color: 'cream', near: 67.36, out: 67.74, outDur: 0.02, at: { d: 6.5, az: 22, y: 1.55 } });
    s.tmp = new THREE.Vector3();
    return s;
  },

  update(t, s, kit) {
    const on = t >= 56.61;
    s.root.visible = on;
    if (!on) return;
    const d = s.prof.d(t);
    s.B.position.z = d;
    const edge = t >= 67.74;

    // countdown 03 02 01 00; the display bezel flashes rust on each flip, then goes dark on the snip
    const flip = FLIPS.reduce((n, x) => n + (t >= x ? 1 : 0), 0) - 1;
    s.digits.forEach((T, i) => { T.mesh.visible = !edge && i === flip && t < 59.96; });
    let fl = 0; for (const x of FLIPS) fl = Math.max(fl, env(t, x, 7));
    s.bezel.material.uniforms.uBright.value = t < 59.96 ? 1 + 2.6 * fl : 0.25;
    s.stickMat.uniforms.uBright.value = 1 + 0.35 * fl + 0.3 * env(t, 59.96, 4);

    // cutters: swing in, hover rust -> cyan -> gold, SNIP on "Gold", lift away
    s.cpos(t, s.tmp);
    s.cutters.position.set(s.tmp.x, s.tmp.y + 2.7, s.tmp.z + 0.5);
    s.cutters.rotation.z = 0.75 * (1 - sm(58.33, 59.0, t)) + 0.6 * sm(60.4, 61.3, t) + 0.12 * Math.sin(t * 2.2) * sm(58.5, 59.0, t) * (1 - sm(59.8, 59.96, t));
    const open = t < 59.96 ? 0.26 + 0.16 * sm(59.5, 59.85, t) : 0.26 * sm(60.3, 60.8, t);
    s.halves[0].rotation.z = -open; s.halves[1].rotation.z = open;
    // the cut: ends spring apart; a bead runs up the upper piece on each beat, then along the overhead wire
    const ck = sm(59.96, 60.25, t);
    s.gLow.rotation.z = 0.2 * ck; s.gLow.rotation.x = 0.06 * ck;
    s.gUp.rotation.z = -0.06 * ck; s.gUp.rotation.x = -0.05 * ck;
    let bead = -1;
    for (const p of PULSES) if (t >= p && t < p + 0.34) bead = (t - p) / 0.34;
    s.bead.visible = bead >= 0;
    if (bead >= 0) along(s.upPts, bead, s.bead.position);
    s.snip.visible = t >= 59.96 && t < 60.9;

    // harp: rotate 4 deg/s (frozen at zero), light sweep circles the player, plucks, pulses
    const hu = s.hu;
    hu.uRot.value = -s.rot.d(t) * D2R;
    const q = [60.62, 61.18, 61.75, 62.32, 62.89];
    let sw = 0; for (let i = 0; i < 4; i++) sw += 0.25 * sm(q[i], q[i + 1], t);
    hu.uSweep.value = t < 60.62 ? -1 : sw * Math.PI * 2 + 0.001;
    if (t >= 62.89) hu.uSweep.value = 7;
    hu.uAmp.value = 0.3 * (env(t, 64.0, 2.8) + env(t, 64.59, 2.8)) + 0.3 * (env(t, 66.72, 3.6) + env(t, 67.19, 3.6));
    hu.uFlash.value = 0.85 * (env(t, 64.0, 7) + env(t, 64.59, 7)) + 0.7 * (env(t, 66.72, 10) + env(t, 66.86, 10) + env(t, 67.19, 10) + env(t, 67.33, 10));
    if (t >= 64.94 && t < 65.6) { hu.uPulse.value = (t - 64.94) / 0.5; hu.uPulseA.value = 1; }
    else if (t >= 67.36 && t < 67.9) { hu.uPulse.value = 1 - (t - 67.36) / 0.38; hu.uPulseA.value = 1; }
    else hu.uPulseA.value = 0;

    // dome: dark sunburst until "tonight", then full carmine; flashes when the pulses reach the centre
    const domeB = 0.17 + 0.83 * sm(62.6, 62.68, t) + 0.4 * env(t, 62.62, 3) + 0.5 * env(t, 65.44, 4);
    s.domeMat.uniforms.uBright.value = domeB;
    s.dome.rotation.y = t * 0.03;
    s.oculus.material.uniforms.uBright.value = 0.35 + 0.65 * sm(62.6, 62.68, t) + 1.4 * env(t, 65.44, 4);
    for (const T of [s.oh1, s.oh2]) T.mesh.scale.setScalar(1 + 0.12 * kit.beatEnv(t, 7));

    // out: EDGE-MODE (cyan lines for 0.4 s, then fade while S09 fills in)
    const eOn = edge ? 1 - sm(67.95, 68.14, t) : 0;
    if (edge) kit.edge(1);
    s.edgesB.u.uOn.value = eOn; s.edgesD.u.uOn.value = eOn; s.edgesP.u.uOn.value = eOn;
    hu.uEdgeC.value = edge ? 1 : 0;
    hu.uOn.value = edge ? eOn : 1;

    if (kit.isOwner) {
      const rs = kit.rigState;
      rs.wheelSpin = d / 0.075;
      rs.wire.lenF = Math.max(0.5, -(s.junction.z + d));
      const P = rs.wire.pulses;
      PULSES.forEach((p, i) => {
        const a = t - p - 0.34;
        if (a >= 0 && a < 1.4 && P.length < 6) {
          const o = s.pulse[i % 2];
          o.z = s.junction.z + d + a * 60; o.a = 1 - sm(1.0, 1.4, a); o.w = 1.3;
          P.push(o);
        }
      });
      if (t >= 57.5 && t < 58.33) rs.gauge = 0.12;
    }
  },

  events() {
    return [
      { t: 57.0, sfx: 'tick', gain: 0.45 },
      { t: 57.5, sfx: 'tick', gain: 0.6, haptic: [0.2, 40] },
      { t: 58.33, sfx: 'motor', gain: 0.4 },
      { t: 59.84, sfx: 'shutter', gain: 0.45 },
      { t: 59.96, sfx: 'crack', gain: 0.6, haptic: [0.55, 80] },
      { t: 62.62, sfx: 'switch', gain: 0.5 },
      { t: 64.0, sfx: 'ping', gain: 0.32 },
      { t: 66.72, sfx: 'ping', gain: 0.32 },
      { t: 67.74, sfx: 'rebuild', gain: 0.35 },
    ];
  },
};
