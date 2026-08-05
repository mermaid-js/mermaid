/**
 * Post-pass: nudge edge path segments away from parent subgraph boundaries
 * when they run within the clearance distance. Does not change the grid or
 * routing decisions, so paths remain valid and never fall back to direct lines.
 */

import type { Node } from '../../../types.js';
import type { Edge } from '../../../types.js';
import { ORTHOGONAL_DEFAULT_CLEARANCE, ORTHOGONAL_EPSILON } from '../Constants.js';
import type { Point } from './types.js';

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Build bounds for a group node (center-based: x, y, width, height).
 * Calculates the rectangular boundary of a subgraph node using its center
 * coordinates and dimensions.
 *
 * @param node - The group node to calculate bounds for
 * @returns Bounds object with left, right, top, bottom coordinates, or null if invalid
 */
function getSubgraphBounds(node: Node): Bounds | null {
  if (
    !node.isGroup ||
    node.x == null ||
    node.y == null ||
    node.width == null ||
    node.height == null
  ) {
    return null;
  }
  return {
    left: node.x - node.width / 2,
    right: node.x + node.width / 2,
    top: node.y - node.height / 2,
    bottom: node.y + node.height / 2,
  };
}

/**
 * Collect all ancestor subgraph IDs for a node (parent, grandparent, ...).
 * Traverses up the parent hierarchy to find all containing subgraphs,
 * preventing infinite loops through cycle detection.
 *
 * @param nodeId - The ID of the node to find ancestors for
 * @param nodeMap - Map of node IDs to node objects for parent lookup
 * @returns Set of ancestor subgraph IDs (empty if no ancestors)
 */
function getAncestorSubgraphIds(nodeId: string, nodeMap: Map<string, Node>): Set<string> {
  const ids = new Set<string>();
  let currentId: string | undefined = nodeId;
  const visited = new Set<string>();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodeMap.get(currentId);
    const parentId = node?.parentId;
    if (parentId) {
      ids.add(parentId);
      currentId = parentId;
    } else {
      break;
    }
  }
  return ids;
}

/**
 * Nudge a horizontal segment (same y) away from subgraph bounds if it runs
 * within the clearance band above or below the subgraph. Modifies p1.y and p2.y
 * coordinates when nudging is needed and appropriate.
 *
 * @param p1 - First point of the horizontal segment (modified in place)
 * @param p2 - Second point of the horizontal segment (modified in place)
 * @param bounds - Subgraph boundary rectangle to avoid
 * @param clearance - Minimum distance to maintain from boundary
 * @param isStartPoint - Whether this segment includes the edge start connection point
 * @param isEndPoint - Whether this segment includes the edge end connection point
 * @returns True if the segment was nudged, false otherwise
 */
function nudgeHorizontalSegment(
  p1: Point,
  p2: Point,
  bounds: Bounds,
  clearance: number,
  isStartPoint: boolean,
  isEndPoint: boolean
): boolean {
  const y = p1.y;
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const segmentOverlapsX = !(maxX < bounds.left || minX > bounds.right);

  if (!segmentOverlapsX) {
    return false;
  }

  let nudged = false;
  let newY: number | null = null;

  if (y < bounds.top && y >= bounds.top - clearance) {
    newY = bounds.top - clearance;
    nudged = true;
  }

  if (!nudged && y > bounds.bottom && y <= bounds.bottom + clearance) {
    newY = bounds.bottom + clearance;
    nudged = true;
  }

  if (nudged && newY !== null && !isStartPoint && !isEndPoint) {
    p1.y = newY;
    p2.y = newY;
  }

  return nudged;
}

/**
 * Nudge a vertical segment (same x) away from subgraph bounds if it runs
 * within the clearance band left or right of the subgraph. Only nudges intermediate
 * points, preserving start/end connection points to maintain valid routing.
 *
 * @param p1 - First point of the vertical segment (modified in place)
 * @param p2 - Second point of the vertical segment (modified in place)
 * @param bounds - Subgraph boundary rectangle to avoid
 * @param clearance - Minimum distance to maintain from boundary
 * @param isStartPoint - Whether this segment includes the edge start connection point
 * @param isEndPoint - Whether this segment includes the edge end connection point
 * @returns True if the segment was nudged, false otherwise
 */
function nudgeVerticalSegment(
  p1: Point,
  p2: Point,
  bounds: Bounds,
  clearance: number,
  isStartPoint: boolean,
  isEndPoint: boolean
): boolean {
  const x = p1.x;
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);
  const segmentOverlapsY = !(maxY < bounds.top || minY > bounds.bottom);

  if (!segmentOverlapsY) {
    return false;
  }

  let nudged = false;
  let newX: number | null = null;

  if (x < bounds.left && x >= bounds.left - clearance) {
    newX = bounds.left - clearance;
    nudged = true;
  }

  if (!nudged && x > bounds.right && x <= bounds.right + clearance) {
    newX = bounds.right + clearance;
    nudged = true;
  }

  if (nudged && newX !== null && !isStartPoint && !isEndPoint) {
    p1.x = newX;
    p2.x = newX;
  }

  return nudged;
}

/**
 * Nudge an edge's path segments away from any ancestor subgraph boundary when
 * the segment runs in the clearance band outside that subgraph. Only considers
 * subgraphs that are ancestors of the edge's start or end node to avoid
 * unnecessary nudging from unrelated subgraphs.
 *
 * @param edge - The edge whose path points will be modified
 * @param nodes - Array of all nodes in the layout
 * @param subgraphBoundsMap - Map of subgraph IDs to their boundary rectangles
 * @param ancestorMap - Map of node IDs to their ancestor subgraph ID sets
 * @param clearance - Minimum distance to maintain from subgraph boundaries
 */
function nudgeEdgePoints(
  edge: Edge,
  nodes: Node[],
  subgraphBoundsMap: Map<string, Bounds>,
  ancestorMap: Map<string, Set<string>>,
  clearance: number
): void {
  const points = edge.points;
  if (!points || points.length < 2) {
    return;
  }

  const startAncestors = ancestorMap.get(edge.start ?? '') ?? new Set();
  const endAncestors = ancestorMap.get(edge.end ?? '') ?? new Set();
  const relevantSubgraphIds = new Set<string>([...startAncestors, ...endAncestors]);

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (!p1 || !p2) {
      continue;
    }

    const isStartPoint = i === 0;
    const isEndPoint = i === points.length - 2;

    const isHorizontal = Math.abs(p1.y - p2.y) <= ORTHOGONAL_EPSILON;
    const isVertical = Math.abs(p1.x - p2.x) <= ORTHOGONAL_EPSILON;

    for (const subgraphId of relevantSubgraphIds) {
      const bounds = subgraphBoundsMap.get(subgraphId);
      if (!bounds) {
        continue;
      }

      if (isHorizontal) {
        if (nudgeHorizontalSegment(p1, p2, bounds, clearance, isStartPoint, isEndPoint)) {
          break;
        }
      } else if (
        isVertical &&
        nudgeVerticalSegment(p1, p2, bounds, clearance, isStartPoint, isEndPoint)
      ) {
        break;
      }
    }
  }
}

/**
 * Post-pass: for each edge with points, nudge segments that run within
 * `clearance` pixels of an ancestor subgraph boundary (outside that subgraph)
 * so the path stays visually away from the border.
 *
 * @param nodes - Layout nodes (for subgraph bounds and parent chain)
 * @param edges - Edges with points (mutated in place)
 * @param clearance - Minimum distance to keep from subgraph border (default 10)
 */
export function nudgePathsAwayFromSubgraphBoundaries(
  nodes: Node[],
  edges: Edge[],
  clearance: number = ORTHOGONAL_DEFAULT_CLEARANCE
): void {
  if (clearance <= 0) {
    return;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const subgraphBoundsMap = new Map<string, Bounds>();
  for (const node of nodes) {
    if (node.isGroup) {
      const bounds = getSubgraphBounds(node);
      if (bounds) {
        subgraphBoundsMap.set(node.id, bounds);
      }
    }
  }

  if (subgraphBoundsMap.size === 0) {
    return;
  }

  const ancestorMap = new Map<string, Set<string>>();
  for (const node of nodes) {
    ancestorMap.set(node.id, getAncestorSubgraphIds(node.id, nodeMap));
  }

  for (const edge of edges) {
    nudgeEdgePoints(edge, nodes, subgraphBoundsMap, ancestorMap, clearance);
  }
}
