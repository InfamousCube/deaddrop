// S04 Champagne silence (23.40 to 28.10, cold with gold; pre 0.8 through the hotel door). Round 3, storyboard v3.
// SHOT CARD
//   what     a grand hotel banquet hall set for a party, every chair empty; at the end of the long table a
//            champagne tower is being filled by a magnum, and on "silence" everything freezes.
//   hero     the champagne tower (30 coupes in 4 tiers on a round table) and the tilting magnum
//   around   Louis chairs (oval medallion backs, cabriole legs) pass at 2.3 m left and right below you; the
//            table with its scalloped cloth runs under you; three crystal chandeliers pass overhead; petrol
//            walls with tall black arched windows and pilasters at x +-9; behind, the doors you came through
//   palette  black + petrol hall + cream cloth + gold champagne and flames (the only warm) + pale cyan glass
//   motion   you glide in through the door (4 m/s, passes 25.2) and slow to 0.5 m/s 6 m before the tower;
//            23.70 the bottle tips and pours, the overflow runs down tier by tier, bubbles rise;
//            25.26 FREEZE: pour, ribbons and bubbles stop dead and turn to ice; 25.94-26.94 the chairs slide
//            back from the table in a wave from the tower toward you ("I don't need a friend")
//   lyrics   left (az -18, d 5.5), depthTest off (the facade and the hall pass through them)
//   out      WORLD FALLS APART 27.34-28.10: chairs fly out sideways, the table and candelabras drop away, the
//            chandeliers rise, the tower bursts outward, the side walls fall outward like cards and the end wall
//            sinks: the mirror hall (S05, pre 0.7) is standing behind it
import * as THREE from 'three';
import { PAL } from './style.js';
import { lathe, ext, tube, polyShape, polyPath, archPts, ellPts, roundRect, inst, setM, scratch, merge, buildChandelier, PATH_KEYS, T_DOOR } from './scenes-1-util.js';

const FY = -1.75, TY = -1.0;        // floor, table top (eyes 2.6 above the cloth)
const WX = 9, WH = 11;              // side walls, wall height above the floor
const CS = 1.35;                    // chair scale (Louis chair, back 1.0 m real)
const CQ = 6;                       // coupe scale (bowl 12 cm real): a 3 m tower, 3.3 m tall
const T_FREEZE_NEAR = 25.26;
const T_OUT = 27.34;
const BURST = false; // Round 4: the tower no longer bursts into 30 flying specks; it sinks whole, frozen, as the hero of "I don't need a friend"

function coupeGeo() {
  const p = [[0, 0], [0.036, 0], [0.037, 0.004], [0.012, 0.012], [0.005, 0.03], [0.004, 0.068], [0.009, 0.074], [0.004, 0.08], [0.006, 0.092],
    [0.034, 0.1], [0.056, 0.118], [0.062, 0.131], [0.058, 0.134], [0.05, 0.125], [0.02, 0.112], [0, 0.11]];
  return lathe(p.map(([r, y]) => [r * CQ, y * CQ]), 14);
}
function chairGeos() {
  const s = CS, parts = [], pad = [];
  const seat = ext(roundRect(0.52, 0.48, 0.1), 0.07, 0.025, 1, 4); seat.rotateX(-Math.PI / 2); seat.translate(0, 0.45, 0);
  parts.push(seat);
  pad.push(ext(roundRect(0.44, 0.4, 0.12), 0.05, 0.02, 1, 4).rotateX(-Math.PI / 2).translate(0, 0.51, 0.01));
  const oval = polyShape(ellPts(0.25, 0.32, 0, 0.98, 22)); oval.holes.push(polyPath(ellPts(0.185, 0.25, 0, 0.98, 22).slice(0, 22)));
  parts.push(ext(oval, 0.05, 0.02, 1, 4).translate(0, 0, -0.23));
  pad.push(ext(polyShape(ellPts(0.19, 0.255, 0, 0.98, 22)), 0.04, 0.015, 1, 4).translate(0, 0, -0.225));
  parts.push(ext(polyShape([[-0.05, 1.27], [0.05, 1.27], [0.1, 1.33], [0, 1.38], [-0.1, 1.33]]), 0.05, 0.015, 1, 1).translate(0, 0, -0.23)); // crest
  for (const sx of [-1, 1]) {
    parts.push(tube([[sx * 0.2, 0.47, -0.22], [sx * 0.21, 0.6, -0.24], [sx * 0.2, 0.75, -0.235]], 0.025, 4, 4)); // back posts
    parts.push(tube([[sx * 0.22, 0.46, 0.2], [sx * 0.25, 0.32, 0.25], [sx * 0.2, 0.14, 0.19], [sx * 0.23, 0.0, 0.24]], 0.03, 8, 5)); // cabriole front leg
    parts.push(tube([[sx * 0.2, 0.46, -0.2], [sx * 0.21, 0.22, -0.24], [sx * 0.22, 0.0, -0.3]], 0.026, 6, 4)); // back leg
  }
  const sc = (g) => { g.scale(s, s, s); return g; };
  return { frame: sc(merge(parts)), pad: sc(merge(pad)) };
}

export const S04 = {
  id: 'S04', t0: 23.4, t1: 28.1, world: 'cold', pre: 0.8, post: 0.5,
  key: [0.2, 0.75, 0.62],
  fog: { color: PAL.black, near: 12, far: 46 },
  sky: { stars: 0, moonR: 0, hor: PAL.black },
  build(kit) {
    const s = { x: scratch(), v: new THREE.Vector3() };
    const W = (txt, near) => kit.words.times(txt, near)[0];
    s.tChamp = W('champagne', 23.7); s.tSil = W('silence', 25.26); s.tI = W('i', 25.94); s.tFriend = W('friend', 26.94);
    s.G = kit.travel(PATH_KEYS);
    const Pd = (s.Pdoor = s.G.d(T_DOOR)), Pt = (s.Ptower = s.G.d(28.0) + 6), Pe = (s.Pend = Pt + 3.2);
    const hall = (s.hall = new THREE.Group()); kit.group.add(hall);
    // ---- floor, door wall, side walls (tall arched windows, pilasters), end wall
    const len = Pe - Pd + 0.4;
    s.floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, len).rotateX(-Math.PI / 2).translate(0, FY, -(Pd + Pe) / 2), kit.flat({ color: 0x03141a }));
    hall.add(s.floor);
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(5.6, len - 1).rotateX(-Math.PI / 2).translate(0, FY + 0.01, -(Pd + Pe) / 2), kit.flat({ color: PAL.petrolDeep }));
    hall.add(runner); s.runner = runner;
    const wallMat = kit.toon({ ramp: [PAL.black, PAL.petrolDeep, PAL.petrol], rim: PAL.teal, rimTh: 0.5 });
    const nWin = Math.floor((len - 2) / 4);
    const wallS = polyShape([[0, 0], [len, 0], [len, WH], [0, WH]]);
    for (let i = 0; i < nWin; i++) wallS.holes.push(polyPath(archPts(2.3, 6.2, 1.6).map(([x, y]) => [x + 2.5 + i * 4, y])));
    s.walls = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(side * WX, FY, -Pd);
      const wg = ext(wallS, 0.5, 0.05, 1, 8); wg.rotateY(Math.PI / 2); // shape x (along the hall) -> -z
      const w = new THREE.Mesh(wg, wallMat); w.position.x = side * 0.25;
      pivot.add(w);
      const pil = inst(ext(polyShape([[-0.45, 0], [0.45, 0], [0.45, WH - 0.6], [0.6, WH - 0.3], [-0.6, WH - 0.3], [-0.45, WH - 0.6]]), 0.4, 0.06, 1, 1).rotateY(Math.PI / 2), kit.toon({ ramp: 'steel', rim: PAL.teal }), nWin + 1, 's04-pil');
      for (let i = 0; i <= nWin; i++) setM(pil, i, -side * 0.2, 0, -(0.5 + i * 4));
      pivot.add(pil);
      hall.add(pivot); s.walls.push(pivot);
    }
    const doorWall = polyShape([[-WX, 0], [WX, 0], [WX, WH], [-WX, WH]]); doorWall.holes.push(polyPath(archPts(5.2, 9.95, 0)));
    const dw = new THREE.Mesh(ext(doorWall, 0.4, 0.04, 1, 8), wallMat); dw.position.set(0, FY, -Pd - 0.9); hall.add(dw);
    s.endWall = new THREE.Mesh(merge([ext(polyShape([[-WX, 0], [WX, 0], [WX, WH], [-WX, WH]]), 0.5, 0.05, 1, 1),
      ext(polyShape([[-WX, WH - 1.2], [WX, WH - 1.2], [WX, WH - 0.7], [-WX, WH - 0.7]]), 0.8, 0.05, 1, 1)]), wallMat);
    s.endWall.position.set(0, FY, -Pe); hall.add(s.endWall);
    // ---- the long table: cloth top, scalloped hem (the fine motif) on both sides and the near end
    const t0z = -(Pd + 1.6), t1z = -(Pt - 2.9), tl = t1z - t0z; // tl < 0
    const L = -tl, hemPts = [[0, 0.06], [L, 0.06], [L, -0.42]];
    const nS = Math.round(L / 0.55);
    for (let i = nS; i > 0; i--) { const x1 = (i / nS) * L, x0 = ((i - 1) / nS) * L; for (let j = 1; j <= 4; j++) { const u = j / 4, x = x1 + (x0 - x1) * u; hemPts.push([x, -0.42 + 0.1 * Math.sin(u * Math.PI)]); } }
    hemPts.push([0, 0.06]);
    const hem = ext(polyShape(hemPts), 0.03, 0, 1, 1);
    const tableG = [new THREE.BoxGeometry(3.2, 0.08, L).translate(0, -0.02, 0)];
    for (const sx of [-1, 1]) tableG.push(hem.clone().rotateY(Math.PI / 2).translate(sx * 1.61, 0, L / 2));
    s.table = new THREE.Mesh(merge(tableG), kit.toon({ ramp: 'cream', rim: null }));
    s.table.position.set(0, TY, (t0z + t1z) / 2); hall.add(s.table);
    // candelabras along the table (lathe base and stem, 3 arms, cream candles, gold flames)
    const cand = [lathe([[0.16, 0], [0.16, 0.03], [0.05, 0.08], [0.035, 0.32], [0.06, 0.36], [0.03, 0.4], [0.03, 0.46], [0, 0.48]], 8)];
    for (const ax of [-1, 0, 1]) {
      if (ax) cand.push(tube([[0, 0.42, 0], [ax * 0.12, 0.43, 0], [ax * 0.22, 0.52, 0], [ax * 0.24, 0.6, 0]], 0.018, 6, 4));
      cand.push(lathe([[0.045, 0], [0.05, 0.03], [0.03, 0.04], [0, 0.04]], 6).translate(ax * 0.24, ax ? 0.6 : 0.48, 0));
    }
    const candles = merge([-1, 0, 1].map((ax) => new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6).translate(ax * 0.24, (ax ? 0.64 : 0.52) + 0.12, 0)));
    const nCa = Math.max(2, Math.floor(L / 4));
    s.cand = inst(merge(cand), kit.toon({ ramp: 'gold', rim: null }), nCa, 's04-cand');
    s.candles = inst(candles, kit.flat({ color: PAL.cream }), nCa, 's04-candles');
    s.flames = inst(merge([-1, 0, 1].map((ax) => new THREE.ConeGeometry(0.035, 0.12, 5).translate(ax * 0.24, (ax ? 0.64 : 0.52) + 0.3, 0))), kit.flat({ color: PAL.gold, fog: 0.3 }), nCa, 's04-flames');
    s.candZ = [];
    for (let i = 0; i < nCa; i++) { const z = t0z - 1.5 - i * (L - 3) / Math.max(1, nCa - 1); s.candZ.push(z); for (const m of [s.cand, s.candles, s.flames]) setM(m, i, 0, TY + 0.02, z, i * 0.6); }
    hall.add(s.cand, s.candles, s.flames);
    // chairs both sides every 3 m (frame black with cyan rim, oval pads teal)
    const CG = chairGeos();
    s.chairZ = []; for (let z = t0z - 1.2; z > t1z + 0.8; z -= 3) s.chairZ.push(z);
    const nCh = s.chairZ.length * 2;
    s.chairs = inst(CG.frame, kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.4 }), nCh, 's04-chairs');
    s.pads = inst(CG.pad, kit.toon({ ramp: [PAL.black, PAL.petrol, PAL.teal], rim: null }), nCh, 's04-pads');
    hall.add(s.chairs, s.pads);
    // chandeliers overhead
    s.chands = [];
    for (let i = 0; i < 3; i++) { const c = buildChandelier(kit, { r: 1.4, drops: 16 }); c.group.position.set(0, 7.4, -(Pd + 3 + i * (Pt - Pd - 3) / 3)); hall.add(c.group); s.chands.push(c); }
    // ---- the champagne tower: round table, 30 coupes in 4 tiers, champagne, magnum, pour, overflow, bubbles
    const tw = (s.tower = new THREE.Group()); tw.position.set(0, 0, -Pt); hall.add(tw);
    tw.add((s.round = new THREE.Mesh(lathe([[0, TY + 0.06], [2.25, TY + 0.06], [2.3, TY], [2.32, TY - 0.45], [2.2, TY - 0.47], [0.4, TY - 0.6], [0.35, FY], [0, FY]], 24), kit.toon({ ramp: 'cream', rim: null }))));
    const sp = 0.124 * CQ, th = 0.128 * CQ, cg = coupeGeo();
    s.coupes = inst(cg, kit.toon({ ramp: [PAL.brassDark, PAL.brass, PAL.goldHi], rim: PAL.cream, rimTh: 0.4 }), 30, 's04-coupes');
    s.wine = inst(new THREE.CircleGeometry(0.052 * CQ, 12).rotateX(-Math.PI / 2), kit.flat({ color: PAL.gold }), 30, 's04-wine');
    s.cpos = [];
    let k = 0;
    for (let tier = 0; tier < 4; tier++) {
      const n = 4 - tier, y = TY + 0.06 + tier * th;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = (i - (n - 1) / 2) * sp, z = (j - (n - 1) / 2) * sp;
        s.cpos.push([x, y, z, tier]);
        setM(s.coupes, k, x, y, z); setM(s.wine, k, x, y + 0.125 * CQ, z); k++;
      }
    }
    tw.add(s.coupes, s.wine);
    s.yTop = TY + 0.06 + 3 * th + 0.13 * CQ;
    // magnum (35 cm x 11.5 cm real, x4): punt, body, shoulder, neck, foil cap, label band
    const MB = 6, bot = new THREE.Group();
    bot.add(new THREE.Mesh(lathe([[0.03, 0.02], [0.05, 0], [0.057, 0.01], [0.058, 0.2], [0.05, 0.25], [0.022, 0.29], [0.018, 0.33], [0.02, 0.345], [0, 0.35]].map(([r, y]) => [r * MB, y * MB]), 14), kit.toon({ ramp: 'black', rim: PAL.cyan, rimTh: 0.4 })));
    bot.add(new THREE.Mesh(lathe([[0.0225, 0.275], [0.0205, 0.3], [0.021, 0.347], [0, 0.352]].map(([r, y]) => [r * MB, y * MB]), 12), kit.toon({ ramp: 'gold', rim: null })));
    bot.add(new THREE.Mesh(lathe([[0.0592, 0.09], [0.0592, 0.16]].map(([r, y]) => [r * MB, y * MB]), 14), kit.toon({ ramp: 'cream', rim: null })));
    s.bottle = bot; s.mouth = new THREE.Vector3(0, s.yTop + 0.6, 0.01); s.bBase = new THREE.Vector3(0, s.yTop + 0.6 + 0.175 * MB, 0.01 - 0.303 * MB); // tipped 120 deg its mouth lands on the pour point
    tw.add(bot);
    s.iceMat = kit.flat({ color: PAL.gold, fog: 0.4 });
    s.pour = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1, 6).translate(0, -0.5, 0), s.iceMat);
    s.pour.position.copy(s.mouth); tw.add(s.pour);
    s.ribbons = [];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const pts = [];
      for (let tier = 3; tier >= 0; tier--) { const half = ((4 - tier) * sp) / 2, y = TY + 0.06 + tier * th + 0.13 * CQ; pts.push([dx * (half - 0.04), y, dz * (half - 0.04)], [dx * (half + 0.04), y - th * 0.55, dz * (half + 0.04)]); }
      const rb = new THREE.Mesh(tube(pts, 0.055, 24, 4), s.iceMat);
      rb.userData.n = rb.geometry.getAttribute('position').count; tw.add(rb); s.ribbons.push(rb);
    }
    s.bubbles = kit.particles({
      n: 12, shape: 'ring', color: PAL.cream, seed: 5,
      init: (i, rnd) => ({ p: [(rnd() - 0.5) * 1.8, s.yTop + 0.3, (rnd() - 0.5) * 1.0], v: [(rnd() - 0.5) * 0.15, 0.55 + rnd() * 0.3, 0], t0: s.tChamp + 0.3 + i * 0.11, life: 6, s: 0.28 + rnd() * 0.24, freeze: [s.tSil, 999] }),
    });
    tw.add(s.bubbles);
    // ---- lyrics (left, over the dark wall; never over the tower)
    const LY = { cap: 0.9, lineGap: 1.0, depthTest: false, at: { d: 6, az: 0, y: 3.5 } }; // above the tower, on the calm end wall
    kit.text('CHAMPAGNE', { ...LY, color: 'gold', near: s.tChamp, out: 25.1 });
    kit.text('SILENCE,', { ...LY, color: 'cream', near: s.tSil, out: 25.85, dur: 0.01 });
    kit.text("I DON'T NEED\nA FRIEND", { ...LY, color: 'cream', near: s.tI, out: 27.6 });
    return s;
  },
  update(t, s, kit) {
    const { sm } = kit, x = s.x;
    const d = s.G.d(t);
    s.hall.position.z = d;
    const tf = Math.min(t, s.tSil); // frozen clock
    const out = Math.max(0, t - T_OUT), o2 = out * out;
    // chairs: slide back in a wave from the tower toward you, then fly out sideways
    const zMin = s.chairZ[s.chairZ.length - 1], zMax = s.chairZ[0];
    s.chairZ.forEach((z, i) => {
      const order = (z - zMin) / Math.max(0.1, zMax - zMin);
      const ts = s.tI + order * (s.tFriend - s.tI);
      const slide = 0.6 * kit.ease.out(kit.clamp01((t - ts) / 0.35));
      for (let side = 0; side < 2; side++) {
        const sx = side ? 1 : -1, delay = order * 0.25, oo = Math.max(0, out - delay);
        const px = sx * (2.25 + slide + 3 * oo + 9 * oo * oo), py = FY + 2.5 * oo * oo, ry = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        setM(s.chairs, i * 2 + side, px, py, z, ry + sx * oo * 3, 1, 0, sx * oo * 2);
        setM(s.pads, i * 2 + side, px, py, z, ry + sx * oo * 3, 1, 0, sx * oo * 2);
      }
    });
    s.chairs.instanceMatrix.needsUpdate = s.pads.instanceMatrix.needsUpdate = true;
    // table and candelabras drop away below, chandeliers rise; flames flicker until the freeze
    s.table.position.y = TY - 6 * o2; s.tower.position.y = -4 * o2;
    for (let i = 0; i < s.candZ.length; i++) {
      const fl = 1 + 0.15 * Math.sin(tf * 23 + i * 2);
      setM(s.cand, i, 0, TY + 0.02 - 6 * o2, s.candZ[i], i * 0.6); setM(s.candles, i, 0, TY + 0.02 - 6 * o2, s.candZ[i], i * 0.6);
      setM(s.flames, i, 0, TY + 0.02 - 6 * o2, s.candZ[i], i * 0.6, [1, fl, 1]);
    }
    s.cand.instanceMatrix.needsUpdate = s.candles.instanceMatrix.needsUpdate = s.flames.instanceMatrix.needsUpdate = true;
    s.chands.forEach((c, i) => { c.group.rotation.z = 0.025 * Math.sin(tf * 1.3 + i); c.group.position.y = 7.4 + 12 * o2; c.group.visible = out < 0.7; }); // rise out of the shot, gone before they shrink to specks
    // the pour: bottle tips on "champagne", stream + overflow ribbons, all frozen (and iced) on "silence"
    const tip = kit.ease.inOut(kit.clamp01((t - s.tChamp) / 0.5)) * (Math.PI * 2 / 3);
    s.bottle.rotation.x = tip;
    s.bottle.position.copy(s.bBase);
    s.bottle.position.y += 9 * o2; s.bottle.position.z -= 3 * o2; s.bottle.visible = out < 0.6; // flies up out of the shot
    const pk = kit.clamp01((tf - s.tChamp - 0.35) / 0.25);
    s.pour.visible = pk > 0 && out < 0.05;
    s.pour.scale.set(1, Math.max(0.001, 0.48 * pk), 1);
    s.ribbons.forEach((r, i) => {
      const rk = kit.clamp01((tf - s.tChamp - 0.6 - i * 0.12) / 0.9);
      r.visible = rk > 0 && out < 0.05;
      r.geometry.setDrawRange(0, Math.floor((r.userData.n / 24) * Math.round(24 * rk)) * 1);
    });
    const frozen = t >= s.tSil;
    s.iceMat.uniforms.uColor.value.set(frozen ? 0xbfeaf4 : PAL.gold);
    s.bubbles.visible = out < 0.05;
    // the tower bursts: coupes fly outward and up, away from you
    if (BURST && out > 0) {
      s.cpos.forEach(([cx, cy, cz, tier], i) => {
        const dir = Math.atan2(cx, cz + 0.001), r = 3 * out + 7 * o2;
        const px = cx + Math.sin(dir) * r * (cx === 0 && cz === 0 ? 0 : 1), pz = cz - Math.abs(Math.cos(dir)) * r - 4 * o2, py = cy + 3 * out + tier * 2 * o2;
        setM(s.coupes, i, px, py, pz, 0, out < 0.7 ? 1 : 0.0001, out * 4, out * 3); setM(s.wine, i, px, py + 0.125 * CQ, pz, 0, 0.001);
      });
      s.coupes.instanceMatrix.needsUpdate = s.wine.instanceMatrix.needsUpdate = true;
    } else if (s.coupesMoved !== false) {
      s.cpos.forEach(([cx, cy, cz], i) => { setM(s.coupes, i, cx, cy, cz); setM(s.wine, i, cx, cy + 0.125 * CQ, cz); });
      s.coupes.instanceMatrix.needsUpdate = s.wine.instanceMatrix.needsUpdate = true;
      s.coupesMoved = false;
    }
    if (BURST && out > 0) s.coupesMoved = true;
    // walls fall outward like cards; the end wall sinks away
    const fall = kit.ease.in(kit.clamp01((t - T_OUT - 0.12) / 0.62)) * (Math.PI / 2);
    s.walls[0].rotation.z = fall; s.walls[1].rotation.z = -fall;
    const wSink = kit.clamp01((t - T_OUT - 0.72) / 0.3); // once flat, the walls drop away (no thin edges left beside S05)
    for (const w of s.walls) { w.position.y = FY - 6 * wSink * wSink; w.visible = wSink < 1; }
    s.endWall.position.y = FY - 14 * kit.ease.in(kit.clamp01((t - T_OUT) / 0.7)); // the calm wall stays behind the whole frozen tower
    s.endWall.visible = t < T_OUT + 0.72;
    s.floor.visible = s.runner.visible = t < 27.4; // S05's floor reaches back under the hall from 27.4
    if (kit.isOwner) kit.setSky({ stars: 0, amt: 1 });
    return t >= s.tSil && t < s.tSil + 0.03 ? { flash: 0xbfeaf4 } : undefined;
  },
  events() { return [{ t: 23.7, sfx: 'lidOpen', gain: 0.3 }, { t: 25.26, sfx: 'tapeStop', gain: 0.45, haptic: [0.3, 60] }, { t: 27.34, sfx: 'crack', gain: 0.55, haptic: [0.4, 90] }]; },
};
