// Small helpers shared by the song shows.
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const easeIn = (k) => k * k * k;
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);

// index of the last value <= t in a sorted array (or -1)
export function lastIdx(arr, t) {
  let lo = 0, hi = arr.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}
// decaying envelope after the last beat
export function env(arr, t, rate = 8) {
  const i = lastIdx(arr, t);
  return i < 0 ? 0 : Math.exp(-(t - arr[i]) * rate);
}
// one-shot decay after a single moment
export const hit = (t, at, rate = 6) => (t >= at ? Math.exp(-(t - at) * rate) : 0);
