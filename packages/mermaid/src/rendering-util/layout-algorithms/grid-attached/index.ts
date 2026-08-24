import type { Edge, LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';
import { prepareGridAttachedLayout } from './prepareLayout.js';

/**
 * Attached grid-like layout, exposed as `layout: 'grid-attached'`.
 *
 * `grid-decomposed` with the decomposition put back together: the core is the same
 * grid-like drawing, and every tree HOLA's leaf peeling removed is hung back onto
 * the core node it came from, in the place HOLA's face search chooses for it.
 *
 * Two kinds of edge therefore share the drawing, and they are painted differently:
 *
 *   - core edges are grid-like's straight centre-to-centre lines, so the shared
 *     painter clips both ends against the node shapes;
 *   - tree connectors are settled orthogonal polylines that already end on the
 *     node boundaries, so re-clipping them would bend the terminal segment the
 *     arrowhead is drawn along.
 *
 * `hasIntersectionPoints` is what the layout core marks the second kind with, so
 * `skipIntersect` reads it per edge instead of applying one rule to both.
 */
export const render = createCommonLayoutRenderer({
  prepareLayout: (data4Layout: LayoutData) => prepareGridAttachedLayout(data4Layout),
  runLayoutCore: (data4Layout: LayoutData) => runGridAttachedLayoutCore(data4Layout),
  paintOptions: {
    skipIntersect: (edge: Edge) => edge.hasIntersectionPoints === true,
  },
});

export { runGridAttachedLayoutCore, growthForDirection } from './layoutCore.js';
export type {
  GridAttachedComponentResult,
  GridAttachedResult,
  GridAttachedTreeResult,
} from './layoutCore.js';
export { prepareGridAttachedLayout } from './prepareLayout.js';
export type { PreparedGridAttachedLayout } from './prepareLayout.js';
export { resolveGridAttachedOptions } from './options.js';
export type { GridAttachedOptions } from './options.js';
export { attachTrees } from './attachTrees.js';
export type { Attachment, AttachInput, AttachResult } from './attachTrees.js';
export {
  applyCoreScale,
  coreRects,
  coreSegments,
  drawCore,
  routeCoreEdges,
  routedCoreEdges,
} from './coreDrawing.js';
export type { CoreDrawing, CoreSegment } from './coreDrawing.js';
export { planariseRoutedCore } from './corePlanarisation.js';
export { routeTreeEdges } from './treeConnectors.js';
export type { TreeConnector } from './treeConnectors.js';
