/**
 * Per-stage timing for the HOLA pipeline.
 *
 * The shared profiler already brackets the whole `layout` phase, which for a
 * layout that owns its own routing is most of the render — so "layout: 37.6ms"
 * on its own says nothing about where the time went. This module names the
 * stages the pipeline is actually built from, so the Dev Explorer's Profile tab
 * can break that one number down the same way the code is broken down.
 *
 * ## Buckets, not tree spans
 * `layoutComponent` runs once per weakly-connected component, so every stage
 * below can execute several times in a single render and the useful number is
 * the sum. That is exactly what {@link Profiler.tickSync} accumulates, whereas a
 * tree span would record only the last component's slice — or, nested in a loop,
 * produce one sibling span per component for the reader to add up by hand.
 *
 * ## Zero production cost
 * Every call is behind `injected.profiling`, the build-time constant esbuild
 * replaces with `false` for normal builds. The branch then folds away and the
 * `profiler` import is tree-shaken out, so this costs nothing outside dev and
 * profiling builds. See `src/profiler.ts`.
 */

import { profiler } from '../../../profiler.js';

/**
 * Bucket names, in pipeline order. Keyed by stage so the Dev Explorer can label
 * its rows from one place rather than repeating the strings.
 *
 * The `hola` prefix keeps them clear of the shared buckets (`getBBox`,
 * `getBoundingClientRect`) in the same flat namespace.
 */
export const HOLA_STAGES = {
  /** `core/`: peel the trees off the core (HOLA's topological decomposition). */
  decompose: 'holaDecompose',
  /** `grid/` + `core/`: draw the core and planarise its routes. */
  core: 'holaCore',
  /** `core/`: symmetric layout of each peeled tree. */
  trees: 'holaTrees',
  /** `core/`: choose a face and a wedge for every tree, and climb the ladder. */
  place: 'holaPlace',
  /** `core/`: orthogonal routing of core edges and tree connectors. */
  route: 'holaRoute',
  /** `attached/`: fit the subgraph frames around the drawn members. */
  frames: 'holaFrames',
  /** `attached/`: place every edge label clear of the nodes and routes. */
  labels: 'holaLabels',
} as const;

export type HolaStage = keyof typeof HOLA_STAGES;

/**
 * Run `fn`, adding its wall-clock to the named stage's bucket.
 *
 * Returns whatever `fn` returns and never swallows a throw, so it can wrap a
 * call in place without changing the surrounding code's shape.
 */
export function timeStage<T>(stage: HolaStage, fn: () => T): T {
  if (!injected.profiling) {
    return fn();
  }
  return profiler.tickSync(HOLA_STAGES[stage], fn);
}
