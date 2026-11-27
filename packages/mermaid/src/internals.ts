import { getConfigCopy } from './config.js';
import common from './diagrams/common/common.js';
import { log } from './logger.js';
import { insertCluster } from './rendering-util/rendering-elements/clusters.js';
import {
  insertEdge,
  insertEdgeLabel,
  positionEdgeLabel,
} from './rendering-util/rendering-elements/edges.js';
import insertMarkers from './rendering-util/rendering-elements/markers.js';
import { insertNode } from './rendering-util/rendering-elements/nodes.js';
import { labelHelper } from './rendering-util/rendering-elements/shapes/util.js';
import { interpolateToCurve } from './utils.js';

/**
 * Internal helpers for mermaid
 * @deprecated - This should not be used by external packages, as the definitions will change without notice.
 */
export const internalHelpers = {
  common,
  // Plugins get a mutable copy, not the frozen snapshot. Published `@mermaid-js/layout-elk`
  // bundles pass this to their own `setConfig`, whose `sanitize()` deletes keys in place.
  // TODO(v13, frozen config): return the frozen `getConfig` once layout-elk's peer range no longer
  // allows versions <= 1.0.2 (they sanitize in place). Then drop the per-context cache in
  // `elk/render.ts`.
  getConfig: () => getConfigCopy(),
  insertCluster,
  insertEdge,
  insertEdgeLabel,
  insertMarkers,
  insertNode,
  interpolateToCurve,
  labelHelper,
  log,
  positionEdgeLabel,
};

export type InternalHelpers = typeof internalHelpers;
