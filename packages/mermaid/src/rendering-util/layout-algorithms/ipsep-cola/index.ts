import type { LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { runIpsepColaLayoutCore } from './layoutCore.js';
import type { IpsepColaLayoutResult } from './layoutCore.js';

/**
 * IPSEP-COLA — constrained stress-majorisation layout, exposed as
 * `layout: 'ipsep-cola'`.
 *
 * Nodes are placed by minimising a stress model of the graph's shortest-path
 * distances, subject to axis-aligned separation constraints that enforce the
 * diagram's declared direction and keep node boxes from overlapping. See
 * `IPSEP-COLA-Pseudocode.md` for the algorithm this implements, and the
 * `solver/` modules for the section-by-section correspondence.
 *
 * Edges are drawn as straight centre-to-centre lines; the shared painter clips
 * both ends against the node shapes, so `skipIntersect` is deliberately left at
 * its default (as with dagre) rather than set the way a router-owning layout
 * such as ELK sets it.
 */
export const render = createCommonLayoutRenderer<IpsepColaLayoutResult>({
  // `defaultMeasureLayout` / `createGraphWithElements` is called by the factory,
  // so every node and edge label already carries a measured size by the time
  // `runLayoutCore` runs.
  runLayoutCore: (data4Layout: LayoutData) => runIpsepColaLayoutCore(data4Layout),
});

export { runIpsepColaLayoutCore } from './layoutCore.js';
export type { IpsepColaLayoutResult } from './layoutCore.js';
export { DEFAULT_IPSEP_COLA_OPTIONS, resolveIpsepColaOptions } from './options.js';
export type { IpsepColaOptions } from './options.js';
