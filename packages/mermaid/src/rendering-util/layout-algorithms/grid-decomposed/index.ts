import type { LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { runGridDecomposedLayoutCore } from './layoutCore.js';
import { prepareGridDecomposedLayout } from './prepareLayout.js';

/**
 * Decomposed grid-like layout, exposed as `layout: 'grid-decomposed'`.
 *
 * HOLA's topological decomposition (undirected leaf peeling: trees removed from
 * the core) applied first, then every resulting part drawn on its own with
 * grid-like and packed beside the others as an unconnected diagram.
 *
 * `prepareLayout` is where the decomposition happens, because it is the last hook
 * that runs before the measure stage: a peeled tree is re-rooted on a *duplicate*
 * of its core node, and that duplicate has to be measured like any other node for
 * the painter to be able to draw it. See `prepareLayout.ts`.
 *
 * Edges are straight centre-to-centre lines from grid-like's write-back, so
 * `skipIntersect` stays at its default and the shared painter clips both ends
 * against the node shapes.
 */
export const render = createCommonLayoutRenderer({
  prepareLayout: (data4Layout: LayoutData) => prepareGridDecomposedLayout(data4Layout),
  runLayoutCore: (data4Layout: LayoutData) => runGridDecomposedLayoutCore(data4Layout),
});

export { runGridDecomposedLayoutCore } from './layoutCore.js';
export type { GridDecomposedPartResult, GridDecomposedResult } from './layoutCore.js';
export { prepareGridDecomposedLayout } from './prepareLayout.js';
export type { DuplicatedRoot, PreparedGridDecomposedLayout } from './prepareLayout.js';
export { buildPartLayoutData, splitIntoParts } from './parts.js';
export type { DecomposedPart, PartKind } from './parts.js';
export { createRootCopy, rootCopyOf } from './rootCopy.js';
export type { RootCopyNode } from './rootCopy.js';
export { DEFAULT_GRID_DECOMPOSED_OPTIONS, resolveGridDecomposedOptions } from './options.js';
export type { GridDecomposedOptions } from './options.js';
