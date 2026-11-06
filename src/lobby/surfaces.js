// Walkable/placeable tops of the lobby console, for hand collision and item physics.
// supportY(x, y, z) returns the height of the highest surface under (x, z) that the point is
// above or only slightly below (so a hand pushed deep under the desk is not yanked on top).
// Layout matches desk.js: centre desk, two angled wings, sonar cabinet slope (left wing),
// rear telemetry shelf and the MODEL 7 deck chassis with its cassette well.
const DESK_Y = 0.86;
const REACH = 0.24;

export function supportY(x, y, z) {
  let top = 0; // floor
  const consider = (t) => { if (t > top && y > t - REACH) top = t; };
  if (Math.abs(x) < 0.58 && z > -1.05 && z < -0.245) consider(DESK_Y);
  for (const sx of [-1, 1]) {
    const dx = x - sx * 0.66, dz = z + 0.49;
    const a = sx * 0.46, c = Math.cos(a), s = Math.sin(a);
    const lx = dx * c + dz * s, lz = -dx * s + dz * c;
    if (Math.abs(lx) < 0.285 && Math.abs(lz) < 0.345) {
      consider(DESK_Y);
      if (sx === -1 && lx > -0.17 && lx < 0.21 && lz > -0.13 && lz < 0.03) consider(DESK_Y + 0.045 + (0.03 - lz) * 0.52);
    }
  }
  if (Math.abs(x) < 0.55 && z > -1.06 && z < -0.935) consider(0.952);
  if (x > -0.24 && x < 0.16 && z > -0.83 && z < -0.59) {
    const inWell = x > -0.185 && x < -0.04 && z > -0.8 && z < -0.7;
    consider(inWell ? 0.902 : 0.922);
  }
  return top;
}

// true when (x, z) is over any console top (used to decide whether a dropped item stays put)
export function onConsole(x, z) {
  return supportY(x, 2, z) > 0.5;
}
