/**
 * Temporarily replace `Math.random` with a mulberry32-seeded PRNG for the
 * duration of `fn`, then restore the original. Used to make the
 * cytoscape-fcose layout deterministic — fcose calls `Math.random` internally
 * in its constraint solver and exposes no `seed` option of its own, so the
 * only reliable way to get repeatable layouts is to swap the global at the
 * narrowest possible scope.
 *
 * A seed of `0` is treated as "opt out": the global is left alone and `fn`
 * runs against the real `Math.random`. This preserves the pre-fix behavior
 * for any caller that explicitly wants layout variety per render.
 */
export function withSeededRandom<T>(seed: number, fn: () => T): T {
  if (seed === 0) {
    return fn();
  }
  const original = Math.random;
  let state = seed >>> 0;
  Math.random = function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}
