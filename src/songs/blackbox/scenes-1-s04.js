// S04 A limousine of one (22.63 to 29.46, cold).
// SHOT CARD
//   hero     one giant champagne bottle (8.5 m) standing in the aisle of an endless open-top limousine;
//            the player drifts slowly toward it (0.6 m/s)
//   supports the two rows of seats with black passenger busts (10 per side, big ordered silhouettes);
//            6 big gold bubbles (the one accent) that become the match-cut
//   palette  black + petrol (seats) + gold (bubbles, foil) / cream (label, type)
//   motion   23.70 the cork pops over the head (>= 2 m above the eyes) and 6 big bubbles drift out of the neck -> 25.26 the
//            silence freezes them and dims the cabin -> 26.05-27.2 every other passenger vanishes ->
//            MATCH-CUT 28.30-29.46: the 6 bubbles swell, turn cyan and land on S05's 6 front dish faces
//   lyrics   one line at a time on the dark aisle under the bottle (d 6, 2 m under the eyes, above the floor): CHAMPAGNE / SILENCE /
//            I DON'T NEED / A FRIEND (FRIEND struck through in rust)
//   removed  the roof, upper walls and window band (no box around the player), 140 window streaks, 40 flutes + fills + bar counter, 500 bubbles + burst rings, 30 ceiling
//            lamps, the passengers' eye dots, the Engineer at the far end, the letter-by-letter SILENCE
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { bustShape, extrude, scratch, dishLayout, FACE_Y, FACE_R, EYE, UPV } from './scenes-1-util.js';

const KEY = [0, 1, 0.12];
const FL = -1.3, WALL = 3.4, SIDE = 0.55; // an open-top limousine: floor, low side panels, no roof
const FZ0 = 25.26, FZ1 = 27.2; // the silence: everything freezes
const tw = (t) => (t < FZ0 ? t : t < FZ1 ? FZ0 : t - (FZ1 - FZ0));
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const VANISH = [26.05, 26.64, 27.2];
const BOT_Z = -16, BOT_S = 2.6, NECK_Y = FL + 3.28 * BOT_S;
const ROW = 10, PITCH = 10;

export const S04 = {
  id: 'S04', t0: 22.63, t1: 29.46, world: 'cold', pre: 0, post: 0,
  key: KEY, fog: { color: PAL.black, near: 22, far: 95 }, sky: 'black',
  build(kit) {
    const s = { x: scratch(), mats: [] };
    s.x.m2 = new THREE.Matrix4(); s.x.p2 = new THREE.Vector3();
    s.prof = kit.travel([[22.63, 0.6, 0.01]]);
    s.cab = new THREE.Group(); kit.group.add(s.cab);
    s.st = new THREE.Group(); kit.group.add(s.st);
    s.bmats = [];
    const T = (o, b) => { const m = kit.toon({ key: KEY, ...o }); (b ? s.bmats : s.mats).push(m); return m; };
    const F = (o, b) => { const m = kit.flat(o); (b ? s.bmats : s.mats).push(m); return m; };
    // shell: black floor, two low black side panels (an open-top limousine under a black sky; the seats carry the colour)
    s.cab.add(new THREE.Mesh(box(2 * WALL, 0.1, 170, 0, FL - 0.05, -45), F({ color: PAL.black })));
    const wallG = [];
    for (const sx of [-1, 1]) wallG.push(box(0.5, SIDE - FL, 170, sx * (WALL + 0.25), (SIDE + FL) / 2, -45));
    s.cab.add(new THREE.Mesh(mergeSimple(wallG), T({ ramp: 'black', rim: null })));
    // seats (petrol velvet) and passengers (black busts with a cyan rim)
    const seatG = mergeSimple([box(1.1, 0.42, 1.9, 0.05, FL + 0.3, 0), box(0.36, 1.3, 1.9, 0.68, FL + 1.1, 0)]);
    s.seats = new THREE.InstancedMesh(seatG, T({ ramp: [PAL.black, PAL.petrol, PAL.teal], rim: PAL.cyan, rimAmt: 0.6 }), ROW * 2);
    s.busts = new THREE.InstancedMesh(extrude(bustShape(), 0.12), T({ ramp: 'black', rim: PAL.cyan, rimTh: 0.3 }), ROW * 2);
    s.pax = [];
    const m = s.x.m;
    for (let i = 0; i < ROW * 2; i++) {
      const side = i % 2 ? 1 : -1, k = i >> 1, z = 22 - PITCH * k;
      s.seats.setMatrixAt(i, m.makeRotationY(side > 0 ? 0 : Math.PI).setPosition(side * 2.75, 0, z));
      s.pax.push({ side, z, vanish: (k + (side > 0 ? 1 : 0)) % 2 === 0 });
    }
    // every other passenger leaves, near -> far in three waves (by distance at 26.05)
    const d26 = s.prof.d(26.05);
    const gone = s.pax.filter((p) => p.vanish).sort((a, b) => Math.abs(a.z + d26) - Math.abs(b.z + d26));
    gone.forEach((p, j) => { p.tv = VANISH[Math.min(2, Math.floor((j * 3) / gone.length))]; });
    s.cab.add(s.seats, s.busts);
    // THE BOTTLE (rides with the cabin; the player drifts toward it)
    s.bottle = new THREE.Group(); s.bottle.position.set(0, FL, BOT_Z); s.bottle.scale.setScalar(BOT_S); s.cab.add(s.bottle);
    const prof = [[0, 0], [0.42, 0], [0.43, 1.9], [0.36, 2.25], [0.16, 2.55], [0.15, 3.2], [0.17, 3.28], [0, 3.28]].map(([x, y]) => new THREE.Vector2(x, y));
    s.bottle.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 16), T({ ramp: 'black', rim: PAL.cyan, rimTh: 0.4 }, 1)));
    s.bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.26, 0.9, 16, 1, true).translate(0, 2.8, 0), F({ color: PAL.gold, side: THREE.DoubleSide }, 1)));
    s.bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.445, 0.75, 16, 1, true).translate(0, 1.1, 0), F({ color: PAL.cream, side: THREE.DoubleSide }, 1)));
    s.cork = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12), kit.flat({ color: PAL.cream }));
    s.st.add(s.cork);
    // the 6 big bubbles = the match-cut heroes (one per S05 front dish), billboarded to the eye
    const L = dishLayout();
    const tgt = L.nearest.map((i) => L.dishes[i]).sort((a, b) => a.x - b.x);
    const AZ = [-40, -27, -14, 14, 27, 40], EL = [3, 14, 6, 6, 14, 3], DI = [6.0, 7.0, 6.5, 6.5, 7.0, 6.0]; // in the black sky beside the bottle
    s.hero = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 28), kit.flat({ color: PAL.white, side: THREE.DoubleSide, fog: 0.2 }), tgt.length);
    s.hero.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(tgt.length * 3), 3);
    s.hero.frustumCulled = false; s.st.add(s.hero);
    s.hd = tgt.map((D, j) => {
      const az = (AZ[j % 6] * Math.PI) / 180, el = (EL[j % 6] * Math.PI) / 180, di = DI[j % 6];
      const te = 23.78 + j * 0.13;
      const a = new THREE.Vector3(Math.sin(az) * Math.cos(el) * di, EYE.y + Math.sin(el) * di, -Math.cos(az) * Math.cos(el) * di);
      const p0 = new THREE.Vector3(0, NECK_Y + 0.1, BOT_Z + s.prof.d(te));
      const P = new THREE.Vector3(D.x, FACE_Y, D.z);
      const b = P.clone().add(new THREE.Vector3().subVectors(EYE, P).normalize().multiplyScalar(0.2));
      return { te, a, p0, b };
    });
    // ---- type: one line at a time on the dark aisle under the bottle ----
    const at = { d: 6, az: 0, y: -0.45 }; // the floor is at -1.3: the block stays above it
    s.champ = kit.text('CHAMPAGNE', { cap: 0.85, color: 'gold', near: 23.7, out: 25.08, outDur: 0.15, at });
    s.sil = kit.text('SILENCE', { cap: 1.0, color: 'cream', times: 25.24, dur: 0.04, out: 25.84, outDur: 0.06, at });
    s.need = kit.text("I DON'T NEED", { cap: 0.85, color: 'cream', near: 25.94, out: 26.62, outDur: 0.08, at });
    s.friend = kit.text('A FRIEND', { cap: 0.9, color: 'cream', near: 26.72, say: 'a friend', out: 28.2, outDur: 0.2, at });
    const fw = s.friend.words[1];
    s.strike = new THREE.Mesh(new THREE.PlaneGeometry(fw.x1 - fw.x0 + 0.3, 0.16), kit.flat({ color: PAL.rust }));
    s.strike.position.set((fw.x0 + fw.x1) / 2 + 0.08, (fw.y0 + fw.y1) / 2 - 0.02, 0.03);
    s.strike.renderOrder = 7;
    s.friend.mesh.add(s.strike);
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t), T = tw(t);
    s.cab.position.z = d;
    // the bottle sinks away as the match-cut starts, so EVERY (S05, 28.30) reads on clean black
    s.bottle.position.y = FL - 10 * kit.ease.in((t - 28.3) / 0.45);
    const { m, p, q, s: sc, c } = s.x;
    const silent = t >= FZ0 && t < FZ1;
    const fade = 1 - sm(28.3, 28.95, t);
    s.cab.visible = t < 28.97;
    // the silence is a blackout: only the frozen bubbles, the word and a dim bottle stay
    for (const mat of s.mats) mat.uniforms.uBright.value = (silent ? 0 : 1) * fade;
    for (const mat of s.bmats) mat.uniforms.uBright.value = (silent ? 0.45 : 1) * fade;
    // passengers: sway from 23.20 (frozen in the silence); every other one pops out near -> far
    const sway = t >= 23.2 ? 0.08 * Math.sin(((T - 23.2) * Math.PI * 2) / 1.134) * Math.min(1, (T - 23.2) * 2) : 0;
    for (let i = 0; i < s.pax.length; i++) {
      const P = s.pax[i];
      let k = 1;
      if (P.tv !== undefined && t >= P.tv) { const u = (t - P.tv) / 0.22; k = u >= 1 ? 0 : (1 - u) * (1 + 0.5 * Math.sin(u * Math.PI)); }
      q.setFromEuler(s.x.e.set(0, P.side > 0 ? -Math.PI / 2 : Math.PI / 2, P.side * sway, 'YXZ'));
      p.set(P.side * 2.55, FL + 0.5, P.z); sc.set(1.15 * k + 1e-4, 1.15 * k + 1e-4, 1.15);
      m.compose(p, q, sc); s.busts.setMatrixAt(i, m);
    }
    s.busts.instanceMatrix.needsUpdate = true;
    // the cork: pops on "Champagne", arcs over the head (>= 1.9 m above the eyes) and away behind
    const u = (t - 23.7) / 0.8;
    s.cork.visible = u >= 0 && u < 1;
    if (s.cork.visible) {
      const z0 = BOT_Z + s.prof.d(23.7);
      s.cork.position.set(0.5 * u, NECK_Y + 0.1 + (NECK_Y + 1.6 - NECK_Y) * 4 * u * (1 - u) + 1.2 * u * u, z0 + (8 - z0) * u);
      s.cork.rotation.set(u * 14, 0, u * 9);
    }
    // the bubbles: out of the neck, drift into place, frozen in the silence, then the match-cut
    s.hero.visible = t >= s.hd[0].te;
    if (s.hero.visible) {
      const k = kit.ease.inOut((t - 28.3) / 1.16);
      for (let j = 0; j < s.hd.length; j++) {
        const H = s.hd[j];
        const born = t >= H.te;
        const e = kit.ease.out((T - H.te) / 1.5);
        p.lerpVectors(H.p0, H.a, e);
        p.y += 0.06 * Math.max(0, T - H.te - 1.5);
        let r = born ? 0.08 + 0.3 * e : 1e-4;
        if (t >= 28.3) { p.lerp(H.b, k); r = 0.38 + (FACE_R - 0.38) * kit.ease.in((t - 28.3) / 1.16); }
        s.x.m2.lookAt(EYE, p, UPV);
        q.setFromRotationMatrix(s.x.m2);
        sc.setScalar(r);
        m.compose(p, q, sc); s.hero.setMatrixAt(j, m);
        c.setHex(t < 28.62 + (j % 3) * 0.05 ? PAL.gold : PAL.cyan);
        s.hero.setColorAt(j, c);
      }
      s.hero.instanceMatrix.needsUpdate = true; s.hero.instanceColor.needsUpdate = true;
    }
    s.strike.visible = t >= 26.94;
    s.strike.scale.x = Math.max(0.01, sm(26.94, 27.06, t));
  },
  events() {
    return [
      { t: 22.63, sfx: 'switch', gain: 0.5 },
      { t: 23.7, sfx: 'crack', gain: 0.45, haptic: [0.35, 40] },
      { t: 25.26, sfx: 'tapeStop', gain: 0.4 },
      { t: 27.2, sfx: 'tapeStart', gain: 0.35 },
      { t: 28.3, sfx: 'whoosh', gain: 0.5 },
    ];
  },
};
