/* eslint-disable tsdoc/syntax */
/**
 * Type definitions for orthogonal edge routing
 */

import type { CrossingCurveInfo } from './crossingCurves.js';

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A grid cell coordinate
 */
export interface GridCell {
  row: number;
  col: number;
}

/**
 * A rectangular boundary
 */
export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Grid cell state
 */
export const CellState = {
  FREE: 0,
  BLOCKED: 1,
  OCCUPIED_BY_EDGE: 2,
} as const;

export type CellState = (typeof CellState)[keyof typeof CellState];

/**
 * Routing grid configuration
 */
export interface GridConfig {
  cellSize: number;
  nodeMargin: number;
  /**
   * Additional clearance (in px) around regular node bodies that edges should not enter.
   * Endpoints are exempt for their own source/target nodes so edges can still connect.
   */
  nodeClearance?: number;
  /**
   * Minimum clearance (in px) to keep from subgraph (group) boundaries.
   * This prevents edges from visually "hugging" cluster boxes.
   *
   * Note: This is applied as a routing constraint for cells just outside
   * subgraph bounds. Boundary crossing rules still apply on the perimeter.
   */
  subgraphBoundaryClearance?: number;
  crossingCurves?: {
    enabled: boolean;
    curveType: 'arc' | 'offset';
    curveRadius: number;
    offsetDistance: number;
    minCrossingAngle: number;
    priority: 'first-edge' | 'second-edge' | 'shorter-edge' | 'longer-edge';
  };
}

/**
 * Path segment representing a straight line between two points
 */
export interface PathSegment {
  start: Point;
  end: Point;
}

/**
 * Result of path validation
 */
export interface PathValidationResult {
  valid: boolean;
  points?: Point[];
  reason?: string;
  type?: 'straight' | 'lshape' | 'zshape' | 'astar';
  startSide?: Side;
  endSide?: Side;
}

/**
 * A* node for pathfinding
 */
export interface AStarNode {
  cell: GridCell;
  parent: AStarNode | null;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  direction?: 'horizontal' | 'vertical';
}

/**
 * Edge context for routing decisions
 */
export interface EdgeContext {
  sourceNodeId: string;
  targetNodeId: string;
  parallelIndex?: number;
  parallelCount?: number;
}

/**
 * Information about a successfully routed edge
 */
export interface RoutedEdgeInfo {
  crossingCurves?: CrossingCurveInfo[];
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  points: Point[];
  startPoint: Point;
  endPoint: Point;
}

/**
 * Connection point candidate on a node side
 */
export interface ConnectionPointCandidate {
  point: Point;
  side: Side;
  nodeId: string;
  priority: number; // Lower = better
}

/**
 * Path candidate with metrics for comparison
 */
export interface PathCandidate {
  points: Point[];
  startPoint: Point;
  endPoint: Point;
  startSide: Side;
  endSide: Side;
  metrics: PathMetrics;
}

/**
 * Metrics for comparing path quality
 */
export interface PathMetrics {
  edgeCrossings: number;
  nodeCrossings: number;
  endpointReuses: number;
  segmentOverlaps: number;
  bends: number;
  totalDistance: number;
  connectionPriority: number; // Combined priority of start and end connection points (lower = better geometry)
}

/**
 * Options for A* pathfinding algorithm
 */
export interface AStarOptions {
  maxConnectionPointCombinations?: number; // Default: 16
  connectionPointSpacing?: number; // Default: 8
  /**
   * Maximum number of connection point candidates to consider per node side.
   * Used to bound the search space when sampling multiple points along a side.
   */
  maxConnectionPointsPerSide?: number; // Default: 5
  /**
   * When running the coarse pass, multiply `connectionPointSpacing` by this factor
   * (unless `coarseConnectionPointSpacing` is explicitly provided).
   */
  coarseConnectionPointSpacingMultiplier?: number; // Default: 3
  /**
   * Explicit spacing to use for the coarse pass connection-point sampling.
   * If not provided, `connectionPointSpacing * coarseConnectionPointSpacingMultiplier` is used.
   */
  coarseConnectionPointSpacing?: number;
  /**
   * If the best coarse path still has bends > this threshold, run a refinement pass
   * using finer connection-point sampling on the selected sides.
   */
  refineIfBendsGreaterThan?: number; // Default: 1
  /**
   * If the best coarse path still has edge crossings > this threshold, run a refinement pass.
   */
  refineIfEdgeCrossingsGreaterThan?: number; // Default: 0
  endpointBufferDistance?: number; // Default: 16
  maxSearchIterations?: number; // Default: 10000
  bendPenalty?: number; // Default: 10
  crossingPenalty?: number; // Default: 1000
  minimumEndpointClearance?: number; // Default: 24 - Minimum distance from node boundary to first/last bend point for arrow space
  endpointReusePenalty?: number; // Penalty added when reusing an existing connection point
}

/**
 * Information about an edge crossing
 */
export interface CrossingInfo {
  point: Point;
  existingEdgeId?: string;
  segment: PathSegment;
}

/**
 * Enhanced A* node with crossing and bend tracking
 */
export interface EnhancedAStarNode extends AStarNode {
  crossingCount: number;
  bendCount: number;
}

/**
 * Node side for connection points
 */
export type Side = 'top' | 'bottom' | 'left' | 'right';
