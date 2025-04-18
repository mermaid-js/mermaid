import { getConfig } from './config.js';
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
  getConfig,
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
