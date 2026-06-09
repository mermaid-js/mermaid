/**
 * Core modules for the orthogonal routing pipeline.
 *
 * This barrel export provides access to the focused modules that implement
 * different stages of the RP1 orthogonal routing pipeline.
 */

// Shared utility functions
export {
  rectForNode,
  pointInRectInterior,
  approxEqual,
  manhattanLength,
  manhattanDistance,
  bendCount,
  segmentIntersectsRectInterior,
  polylineIntersectsRect,
  polylineIntersectsRects,
  uniqSorted,
  computeBoundaryPort,
} from './helpers.js';

// Node positioning (topology/shape stage)
export { layoutOrthogonalNodes, type NodeLayoutOptions } from './nodeLayout.js';

// Port assignment (RP1 Stage 1)
export {
  assignPortsForEdge,
  chooseBoundaryPortOutsideOtherNodes,
  pointInsideAnyRectInterior,
} from './portAssignment.js';

// Routing (RP1 Stage 2/3)
export {
  // Geometry helpers
  isStraightHorizontal,
  isStraightVertical,
  polylineIntersectsAnyRect,
  inflateRect,
  collectObstacleRects,
  compressCollinear,
  // Routing graph
  buildRoutingGraphFromRects,
  findShortestOrthogonalPathOnGraph,
  // High-level routing
  findRoutingGraphPathBetweenPorts,
  routeAligned,
  routeLShape,
  detourAlignedIfBlocked,
} from './routing.js';
