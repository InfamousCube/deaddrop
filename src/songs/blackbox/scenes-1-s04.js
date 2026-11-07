// S04 A limousine of one (22.63 to 29.46, cold). An endless stretched limo; champagne, the frozen
// silence, every other seat emptying. Out: MATCH-CUT 28.30-29.46: 48 frozen gold bubbles swell, turn
// cyan and fly out to land exactly on the faces of S05's 48 nearest mirror dishes at 29.46.
import * as THREE from 'three';
import { PAL } from './style.js';
import { mergeSimple } from './kit.js';
import { engineer, extrude, bustShape, BUST_EYES, mergeDiscs, scratch, dishLayout, PLAIN_Y, DISH_POST, EYE, UPV } from './scenes-1-util.js';

const KEY = [0, 1, 0.12];
const FL = -1.3, CEIL = 3.65, WALL = 3.0;
const FZ0 = 25.26, FZ1 = 27.2; // the silence: everything freezes
const tw = (t) => (t < FZ0 ? t : t < FZ1 ? FZ0 : t - (FZ1 - FZ0));
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const VANISH = [26.05, 26.64, 27.2];

export const S04 = {
  id: 'S04', t0: 22.63, t1: 29.46, world: 'cold', pre: 0, post: 0,
  key: KEY, fog: { color: PAL.black, near: 18, far: 105 },
  build(kit) {
    const s = { x: scratch(), mats: [] };
    s.prof = kit.travel([[22.63, 3, 0.01]]);
    s.cab = new THREE.Group(); kit.group.add(s.cab);
    s.st = new THREE.Group(); kit.group.add(s.st);
    const T = (o) => { const m = kit.toon({ key: KEY, ...o }); s.mats.push(m); return m; };
    const F = (o) => { const m = kit.flat(o); s.mats.push(m); return m; };
    // shell: floor, ceiling, walls with a black window band (0.6-1.9)
    s.cab.add(new THREE.Mesh(mergeSimple([box(6, 0.1, 170, 0, FL - 0.05, -45), box(6, 0.1, 170, 0, CEIL + 0.05, -45)]), F({ color: PAL.black })));
    s.cab.add(new THREE.Mesh(mergeSimple([box(0.1, 1.9, 170, -WALL - 0.05, FL + 0.95, -45), box(0.1, 1.9, 170, WALL + 0.05, FL + 0.95, -45), box(0.1, 1.75, 170, -WALL - 0.05, 2.78, -45), box(0.1, 1.75, 170, WALL + 0.05, 2.78, -45)]), T({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: null })));
    // seats (petrol velvet, black seams) and passengers
    const seatG = mergeSimple([box(1.0, 0.36, 1.7, 0.05, FL + 0.27, 0), box(0.3, 1.15, 1.7, 0.62, FL + 1.05, 0), box(0.18, 0.5, 0.2, -0.3, FL + 0.6, 0.86), box(0.18, 0.5, 0.2, -0.3, FL + 0.6, -0.86)]);
    s.seats = new THREE.InstancedMesh(seatG, T({ ramp: [PAL.black, PAL.petrol, PAL.teal], rim: PAL.cyan, rimAmt: 0.6 }), 48);
    const bustG = extrude(bustShape(), 0.1);
    s.busts = new THREE.InstancedMesh(bustG, T({ ramp: 'black', rim: PAL.cyan, rimTh: 0.3 }), 48);
    s.eyes = new THREE.InstancedMesh(mergeDiscs(BUST_EYES.map(([x, y]) => [x, y, 0.06, 0.034]), 10), F({ color: PAL.white, fog: 0.4 }), 48);
    s.eyes.instanceMatrix = s.busts.instanceMatrix;
    s.pax = [];
    const m = s.x.m;
    for (let i = 0; i < 48; i++) {
      const side = i % 2 ? 1 : -1, k = i >> 1, z = 30 - 5.83 * k;
      m.makeRotationY(side > 0 ? 0 : Math.PI).setPosition(side * 2.6, 0, z);
      s.seats.setMatrixAt(i, m);
      s.pax.push({ side, z, vanish: (k + (side > 0 ? 1 : 0)) % 2 === 0 });
    }
    // every other passenger leaves, near -> far in three waves (by distance at 26.05)
    const d26 = s.prof.d(26.05);
    const gone = s.pax.filter((p) => p.vanish).sort((a, b) => Math.abs(a.z + d26) - Math.abs(b.z + d26));
    gone.forEach((p, j) => { p.tv = VANISH[Math.min(2, Math.floor((j * 3) / gone.length))]; });
    s.cab.add(s.seats, s.busts, s.eyes);
    // bar counter with 40 flutes (cream glass, gold fill)
    s.cab.add(new THREE.Mesh(box(1.4, 0.5, 170, 0, FL + 0.25, -45), T({ ramp: 'black', rim: PAL.cyan, rimAmt: 0.5 })));
    const fluteG = mergeSimple([new THREE.CylinderGeometry(0.075, 0.04, 0.34, 8, 1, true).translate(0, 0.43, 0), new THREE.CylinderGeometry(0.012, 0.012, 0.24, 4).translate(0, 0.14, 0), new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8).translate(0, 0.01, 0)]);
    s.flutes = new THREE.InstancedMesh(fluteG, F({ color: PAL.cream, opacity: 0.55, side: THREE.DoubleSide }), 40);
    s.fills = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.066, 0.035, 0.3, 8).translate(0, 0.15, 0), F({ color: PAL.gold }), 40);
    for (let i = 0; i < 40; i++) s.flutes.setMatrixAt(i, m.makeTranslation(0.45, FL + 0.5, 34 - i * 3.9));
    s.cab.add(s.flutes, s.fills);
    // ceiling dome lamps (two rows) + the Engineer's lamp
    s.lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 12, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), F({ color: PAL.white, fog: 0.5 }), 30);
    s.lamps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(90), 3);
    for (let i = 0; i < 30; i++) s.lamps.setMatrixAt(i, m.makeTranslation(i % 2 ? 1.05 : -1.05, CEIL - 0.02, 36 - (i >> 1) * 10));
    s.cab.add(s.lamps);
    s.eng = engineer(kit, { sit: true, rim: PAL.cyan, key: KEY });
    s.eng.group.position.set(0.15, FL + 0.5, -66);
    s.cab.add(s.eng.group);
    s.cab.add(new THREE.Mesh(mergeSimple([box(0.9, 0.5, 0.6, 0.15, FL + 0.25, -66.2), box(0.9, 1.6, 0.15, 0.15, FL + 0.8, -66.6)]), T({ ramp: [PAL.black, PAL.petrol, PAL.teal], rim: PAL.cyan })));
    const eLamp = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), kit.flat({ color: PAL.white, fog: 0.2 }));
    eLamp.position.set(0.15, CEIL - 0.02, -66);
    const eCone = new THREE.Mesh(new THREE.ConeGeometry(1.6, CEIL - FL, 18, 1, true).translate(0, -(CEIL - FL) / 2, 0), kit.flat({ color: PAL.cream, opacity: 0.13, side: THREE.DoubleSide, fog: 0.3 }));
    eCone.position.set(0.15, CEIL - 0.02, -66);
    s.cab.add(eLamp, eCone);
    s.toast = new THREE.Mesh(mergeSimple([new THREE.CylinderGeometry(0.05, 0.028, 0.24, 8).translate(0, 0.12, 0), new THREE.CylinderGeometry(0.01, 0.01, 0.16, 4).translate(0, -0.08, 0)]), kit.flat({ color: PAL.gold, fog: 0.2 }));
    s.eng.group.add(s.toast);
    // the giant bottle, 8 m ahead (rides with the cradle) and its cork
    s.bottle = new THREE.Group(); s.bottle.position.set(-0.42, FL + 0.5, -8); s.st.add(s.bottle);
    const prof = [[0, 0], [0.42, 0], [0.43, 1.9], [0.36, 2.25], [0.16, 2.55], [0.15, 3.2], [0.17, 3.28], [0, 3.28]].map(([x, y]) => new THREE.Vector2(x, y));
    s.bottle.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 14), T({ ramp: 'black', rim: PAL.cyan, rimTh: 0.4 })));
    s.bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.24, 0.85, 14, 1, true).translate(0, 2.85, 0), F({ color: PAL.gold, side: THREE.DoubleSide })));
    s.bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.7, 14, 1, true).translate(0, 1.1, 0), F({ color: PAL.cream, side: THREE.DoubleSide })));
    s.cork = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 12), kit.flat({ color: PAL.cream }));
    s.st.add(s.cork);
    // the city streaming past in the window bands (30 m/s, frozen in the silence)
    const R = kit.rnd(404);
    s.dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), kit.flat({ color: PAL.white, side: THREE.DoubleSide }), 140);
    s.dash.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(420), 3);
    s.dd = [];
    for (let i = 0; i < 140; i++) {
      const c = R() < 0.18 ? PAL.rust : R() < 0.5 ? PAL.cyan : PAL.teal;
      s.dash.setColorAt(i, s.x.c.setHex(c));
      s.dd.push({ side: i % 2 ? 1 : -1, z0: R() * 160, len: 1 + R() * 4, h: 0.03 + R() * 0.1, y: FL + 2.0 + R() * 1.2 });
    }
    s.dash.frustumCulled = false; s.st.add(s.dash);
    // bubbles: A bursts 24.33, B bursts 24.90 (into white rings), C freezes in the silence, D from the flutes
    const pick = (r) => {
      let x = (r() < 0.5 ? -1 : 1) * (1.0 + r() * 1.75), y = FL + 0.3 + r() * (CEIL - FL - 0.5);
      if (r() < 0.2) { x = (r() - 0.5) * 2; y = r() < 0.5 ? FL + 0.3 + r() * 0.8 : 2.95 + r() * 0.5; }
      return [x, y, 15 - r() * 75];
    };
    const ringsAt = [];
    s.bub = kit.particles({ n: 500, shape: 'disc', seed: 41, color: PAL.gold, init: (i, r) => {
      const p = pick(r), sz = 0.05 + r() * 0.11, v = [0, 0.5, 0];
      if (i < 260) { const life = i < 130 ? 0.63 : 1.2; ringsAt.push([p[0], p[1] + 0.5 * life, p[2], i < 130 ? 24.33 : 24.9]); return { p, v, t0: 23.7, life, s: sz }; }
      if (i < 420) return { p, v, t0: 23.7, life: Math.min(5.2, (CEIL - 0.1 - p[1]) / 0.5 + 1.94), s: sz, freeze: [FZ0, FZ1], c: r() < 0.2 ? PAL.goldHi : PAL.gold };
      const t0 = 27.2 + r() * 1.0;
      return { p: [r() < 0.5 ? 0.45 : (r() - 0.5) * 5, FL + 0.9, p[2]], v: [0, 0.6, 0], t0, life: Math.max(0.05, 28.9 - t0), s: sz };
    } });
    s.rings = kit.particles({ n: ringsAt.length, shape: 'ring', seed: 42, color: PAL.white, init: (i) => ({ p: ringsAt[i].slice(0, 3), t0: ringsAt[i][3], life: 0.3, s: 0.24 }) });
    s.cab.add(s.bub, s.rings);
    // match-cut heroes: 48 bubbles that swell into the dish faces of S05
    const L = dishLayout();
    s.hero = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 22), kit.flat({ color: PAL.white, side: THREE.DoubleSide, fog: 0.3 }), 48);
    s.hero.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(144), 3);
    s.hero.frustumCulled = false; s.st.add(s.hero);
    s.hd = L.nearest.map((idx, j) => {
      const D = L.dishes[idx];
      const az = (-50 + (100 * ((j * 7) % 48)) / 47) * Math.PI / 180, el = (-18 + R() * 40) * Math.PI / 180, dist = 2.4 + R() * 3.6;
      const a = new THREE.Vector3(Math.sin(az) * Math.cos(el) * dist, EYE.y + Math.sin(el) * dist, -Math.cos(az) * Math.cos(el) * dist);
      const b = new THREE.Vector3(D.x, PLAIN_Y + DISH_POST + 0.32, D.z);
      const qa = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(a, EYE, UPV)).multiply(new THREE.Quaternion().setFromAxisAngle(UPV, Math.PI));
      const qb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      return { a, b, qa, qb, ph: R() * 6 };
    });
    // type
    s.champ = kit.text('CHAMPAGNE', { cap: 1.15, color: 'gold', near: 23.7, out: 26.05, parent: s.st });
    s.champ.mesh.position.set(-2.6, 1.15, -6.2); s.champ.mesh.rotation.y = 0.95;
    s.sil = new THREE.Group(); s.sil.position.set(2.6, 1.15, -6.2); s.sil.rotation.y = -0.95; s.st.add(s.sil);
    s.letters = [];
    let x = 0;
    for (const ch of 'SILENCE') {
      const Tl = kit.text(ch, { cap: 1.15, color: 'cream', times: 25.26 - 0.02, dur: 0.06, out: 26.05, parent: s.sil });
      const w = Tl.words[0].x1 - Tl.words[0].x0;
      Tl.mesh.position.x = x + w / 2; x += w + 0.12; s.letters.push(Tl);
    }
    for (const Tl of s.letters) Tl.mesh.position.x -= x / 2;
    s.friend = kit.text("I DON'T NEED\nA FRIEND", { cap: 0.8, color: 'cream', near: 25.94, out: 28.6, at: { d: 6, az: 0, y: 2.55 } });
    s.friend.mesh.material.depthTest = false; s.champ.mesh.material.depthTest = false;
    for (const Tl of s.letters) Tl.mesh.material.depthTest = false;
    const fw = s.friend.words[4];
    s.strike = new THREE.Mesh(new THREE.PlaneGeometry(fw.x1 - fw.x0 + 0.3, 0.11), kit.flat({ color: PAL.rust }));
    s.strike.position.set((fw.x0 + fw.x1) / 2 + 0.08, (fw.y0 + fw.y1) / 2 - 0.02, 0.03);
    s.strike.renderOrder = 7;
    s.friend.mesh.add(s.strike);
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit;
    const d = s.prof.d(t), T = tw(t);
    s.cab.position.z = d;
    const { m, p, q, s: sc, c } = s.x;
    const silent = t >= FZ0 && t < FZ1;
    const fade = 1 - sm(28.3, 28.95, t);
    s.cab.visible = t < 28.97;
    const bright = (silent ? 0.2 : 1) * fade;
    for (const mat of s.mats) mat.uniforms.uBright.value = bright;
    // lamps: on (22.63), off in the silence, back on 27.20
    for (let i = 0; i < 30; i++) s.lamps.setColorAt(i, c.setHex(silent ? 0x0a1416 : PAL.white).multiplyScalar(fade));
    s.lamps.instanceColor.needsUpdate = true;
    // passengers: sway from 23.20 (frozen in the silence), every other one pops out near -> far
    const sway = t >= 23.2 ? 0.09 * Math.sin(((T - 23.2) * Math.PI * 2) / 1.134) * Math.min(1, (T - 23.2) * 2) : 0;
    for (let i = 0; i < 48; i++) {
      const P = s.pax[i];
      let k = 1;
      if (P.tv !== undefined && t >= P.tv) { const u = (t - P.tv) / 0.22; k = u >= 1 ? 0 : (1 - u) * (1 + 0.5 * Math.sin(u * Math.PI)); }
      q.setFromEuler(s.x.e.set(0, P.side > 0 ? -Math.PI / 2 : Math.PI / 2, P.side * sway, 'YXZ'));
      p.set(P.side * 2.42, FL + 0.45, P.z); sc.set(0.95 * k + 1e-4, 0.95 * k + 1e-4, 0.95);
      m.compose(p, q, sc); s.busts.setMatrixAt(i, m);
    }
    s.busts.instanceMatrix.needsUpdate = true;
    // flutes fill on "Champagne"
    const fill = sm(23.7, 23.85, t);
    for (let i = 0; i < 40; i++) { m.makeScale(1, fill + 1e-4, 1).setPosition(0.45, FL + 0.5 + 0.28, 34 - i * 3.9); s.fills.setMatrixAt(i, m); }
    s.fills.instanceMatrix.needsUpdate = true;
    // the cork arcs over the head to the back
    const u = (t - 23.7) / 0.9;
    s.cork.visible = u >= 0 && u < 1;
    s.cork.position.set(-0.42 + 0.25 * u, FL + 0.5 + 3.3 + 5.0 * u - 6.6 * u * u, -8 + 20 * u);
    s.cork.rotation.set(u * 14, 0, u * 9);
    // the Engineer raises her flute on 27.20
    const rk = kit.ease.out((t - 27.2) / 0.35);
    s.toast.position.set(0.3, 0.8 + 0.85 * rk, 0.1);
    s.toast.material.uniforms.uBright.value = 1 + 2.5 * (t >= 27.2 && t < 27.32 ? 1 : 0);
    // window streaks
    for (let i = 0; i < 140; i++) {
      const D = s.dd[i];
      const z = (((D.z0 + 30 * T) % 160) + 160) % 160 - 120;
      q.setFromAxisAngle(UPV, D.side * Math.PI / 2);
      p.set(D.side * (WALL - 0.03), D.y, z); sc.set(D.len, D.h, 1);
      m.compose(p, q, sc); s.dash.setMatrixAt(i, m);
    }
    s.dash.instanceMatrix.needsUpdate = true;
    s.dash.material.uniforms.uBright.value = fade;
    // SILENCE: letters caught mid-rise, then they float on after 27.20
    s.letters.forEach((Tl, i) => { Tl.mesh.position.y = 0.32 * Math.sin(i * 1.9 + 0.6) + 0.25 * Math.max(0, t - FZ1) * (1 + (i % 3) * 0.3); });
    s.strike.visible = t >= 26.94;
    s.strike.scale.x = Math.max(0.01, sm(26.94, 27.06, t));
    // match-cut heroes
    s.hero.visible = t >= 27.77;
    if (t >= 27.77) {
      const k = kit.ease.inOut((t - 28.3) / 1.16);
      const sw = 0.07 + 0.2 * sm(27.77, 28.3, t) + 1.25 * kit.ease.in((t - 28.3) / 1.16);
      for (let j = 0; j < 48; j++) {
        const H = s.hd[j];
        p.lerpVectors(H.a, H.b, k);
        p.y += (1 - k) * 0.1 * Math.min(t - 27.77, 0.6);
        q.slerpQuaternions(H.qa, H.qb, k);
        sc.set(sw, sw, sw);
        m.compose(p, q, sc); s.hero.setMatrixAt(j, m);
        c.setHex(t < 28.62 + (j % 4) * 0.04 ? PAL.gold : PAL.cyan);
        s.hero.setColorAt(j, c);
      }
      s.hero.instanceMatrix.needsUpdate = true; s.hero.instanceColor.needsUpdate = true;
    }
    if (kit.isOwner) {
      const R = kit.rigState;
      R.wheelSpin = d / 0.075;
      R.dark = silent ? 0.75 : 0;
      if (t >= 23.7 && t < 23.85) R.gauge = 1;
      R.wire.on = 0.35 + 0.65 * fade;
    }
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
