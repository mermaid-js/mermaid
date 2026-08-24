import type { LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { runGridLikeLayoutCore } from './layoutCore.js';
import type { GridLikeLayoutResult } from './layoutCore.js';

/**
 * Grid-like layout (Kieffer, Dwyer, Marriott & Wybrow, *Incremental Grid-like
 * Layout Using Soft and Hard Constraints*, 2013), exposed as
 * `layout: 'grid-like'`.
 *
 * It is the sibling IPSEP-COLA layout plus the paper's second phase: Adaptive
 * Constrained Alignment makes chosen edges exactly horizontal or vertical, and
 * the Grid-Snap penalty then draws node centres toward a regular grid without
 * ever letting them cross a separation constraint. See
 * `KIEFFER-2013-Pseudocode.md` for the algorithm and the section-by-section map
 * of where each part lives.
 *
 * Edges are drawn as straight centre-to-centre lines; the shared painter clips
 * both ends against the node shapes, so `skipIntersect` is deliberately left at
 * its default (as with dagre and IPSEP-COLA) rather than set the way a
 * router-owning layout such as ELK sets it.
 */
export const render = createCommonLayoutRenderer<GridLikeLayoutResult>({
  // `defaultMeasureLayout` / `createGraphWithElements` is called by the factory,
  // so every node and edge label already carries a measured size by the time
  // `runLayoutCore` runs.
  runLayoutCore: (data4Layout: LayoutData) => runGridLikeLayoutCore(data4Layout),
});

export { runGridLikeLayoutCore } from './layoutCore.js';
export type { GridLikeLayoutResult } from './layoutCore.js';
export { DEFAULT_GRID_LIKE_OPTIONS, resolveGridLikeOptions } from './options.js';
export type { AcaHeuristic, GridLikeMode, GridLikeOptions } from './options.js';
