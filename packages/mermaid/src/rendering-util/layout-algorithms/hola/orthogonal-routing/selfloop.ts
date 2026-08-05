import type { Node, Edge } from '../../../types.js';
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  SELF_LOOP_CP_FACTOR,
  SELF_LOOP_OFFSET_MULTIPLIER,
  SELF_LOOP_RADIUS_MULTIPLIER,
} from '../Constants.js';

/**
 * Handles self-loop edge routing by analyzing direction usage and creating curved paths.
 * Positions self-loops to minimize interference with other edges and maintains visual clarity.
 * @param edge - The self-loop edge to route
 * @param startNode - The node that the self-loop connects to itself
 * @param allEdges - Array of all edges in the graph for direction analysis
 * @param nodeMap - Map of node IDs to node objects
 * @returns Modified edge with calculated self-loop path points
 */
export function handleSelfLoop(
  edge: Edge,
  startNode: Node,
  allEdges: Edge[],
  nodeMap: Map<string, Node>
): Edge {
  const center = { x: startNode?.x ?? 0, y: startNode?.y ?? 0 };

  const directions = getDirectionUsage(allEdges, startNode, edge, nodeMap);
  const directionObject = chooseFreeDirection(directions);
  const loopWidth =
    directionObject.direction == 'right' || directionObject.direction == 'left'
      ? (startNode?.height ?? DEFAULT_NODE_HEIGHT) / 4
      : (startNode?.width ?? DEFAULT_NODE_WIDTH) / 4;
  const { start, cp1, cp2, end } = getSelfLoopPoints(
    directionObject.direction,
    center,
    startNode,
    loopWidth,
    directionObject.count
  );

  const points = [start, cp1, cp2, end];
  return { ...edge, points, showPoints: false };
}

/**
 * Analyzes direction usage around a node to determine optimal self-loop placement.
 * Counts existing edges in each direction to avoid overcrowding specific sides.
 * @param edges - Array of all edges in the graph
 * @param node - The node to analyze for direction usage
 * @param currentEdge - The current self-loop edge being processed
 * @param _nodeMap - Map of node IDs to node objects (unused but kept for interface consistency)
 * @returns Record containing usage counts for each direction (top, right, bottom, left)
 */
export function getDirectionUsage(
  edges: Edge[],
  node: Node,
  currentEdge: Edge,
  _nodeMap: Map<string, Node>
): Record<string, number> {
  const usage = { top: 0, right: 0, bottom: 0, left: 0 };
  const nodeId = node.id;

  if (!node.width || !node.height) {
    return usage;
  }

  const nodeLeft = (node.x ?? 0) - node.width / 2;
  const nodeRight = (node.x ?? 0) + node.width / 2;
  const nodeTop = (node.y ?? 0) - node.height / 2;
  const nodeBottom = (node.y ?? 0) + node.height / 2;

  edges.forEach((e: Edge) => {
    if (e.id === currentEdge.id) {
      return;
    }

    if (!e.points || e.points.length < 2) {
      return;
    }

    let connectionPoint: { x: number; y: number } | null = null;

    if (e.start === nodeId && e.end !== nodeId) {
      connectionPoint = e.points[0];
    } else if (e.end === nodeId && e.start !== nodeId) {
      connectionPoint = e.points[e.points.length - 1];
    } else if (e.start === currentEdge.start && e.end === currentEdge.start) {
      const points = e.points;
      if (points && points.length === 4) {
        const cp1 = points[1];
        const dx = cp1.x - (node.x ?? 0);
        const dy = cp1.y - (node.y ?? 0);
        const angle = Math.atan2(dy, dx);
        const deg = (angle * 180) / Math.PI;

        if (deg > -45 && deg <= 45) {
          usage.right++;
        } else if (deg > 45 && deg <= 135) {
          usage.bottom++;
        } else if (deg <= -45 && deg > -135) {
          usage.top++;
        } else {
          usage.left++;
        }
      }
    }

    if (connectionPoint) {
      const direction = getConnectionDirection(connectionPoint, {
        left: nodeLeft,
        right: nodeRight,
        top: nodeTop,
        bottom: nodeBottom,
        centerX: node.x!,
        centerY: node.y!,
      });

      if (direction && direction in usage) {
        usage[direction as keyof typeof usage]++;
      }
    }
  });

  return usage;
}

/**
 * Determines which side of the node a point is connected to based on proximity to node boundaries.
 * @param point - The connection point to analyze
 * @param nodeBounds - Object containing node boundary coordinates and center position
 * @returns The direction string ('top', 'bottom', 'left', 'right') or null if undetermined
 */
function getConnectionDirection(
  point: { x: number; y: number },
  nodeBounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
  }
): string | null {
  const { left, right, top, bottom } = nodeBounds;

  const distToLeft = Math.abs(point.x - left);
  const distToRight = Math.abs(point.x - right);
  const distToTop = Math.abs(point.y - top);
  const distToBottom = Math.abs(point.y - bottom);

  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

  if (minDist === distToTop) {
    return 'top';
  } else if (minDist === distToBottom) {
    return 'bottom';
  } else if (minDist === distToLeft) {
    return 'left';
  } else if (minDist === distToRight) {
    return 'right';
  }

  return null;
}

/**
 * Chooses the direction with the least usage for optimal self-loop placement.
 * Returns the direction and current usage count for proper spacing calculations.
 * @param directions - Record containing usage counts for each direction
 * @returns Object with the chosen direction and its current usage count
 */
export function chooseFreeDirection(directions: Record<string, number>): {
  direction: string;
  count: number;
} {
  const sorted = Object.entries(directions).sort((a, b) => a[1] - b[1]);
  return {
    direction: sorted[0][0],
    count: sorted[0][1],
  };
}

/**
 * Generates self-loop control points based on direction and existing loop count.
 * Creates curved paths with appropriate spacing and radius adjustments for multiple loops.
 * @param direction - The direction for the self-loop ('top', 'bottom', 'left', 'right')
 * @param center - Center coordinates of the node
 * @param node - The node object containing dimensions
 * @param width - Base width/spacing for the self-loop
 * @param directionCount - Number of existing loops in this direction (default: 0)
 * @returns Object containing start, end, and control points for the self-loop curve
 */
export function getSelfLoopPoints(
  direction: string,
  center: { x: number; y: number },
  node: Node,
  width: number,
  directionCount = 0
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
} {
  const nodeWidth = node.width ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT;
  const _radiusX = nodeWidth * SELF_LOOP_RADIUS_MULTIPLIER;
  const radiusY = nodeHeight * SELF_LOOP_RADIUS_MULTIPLIER;
  const cpFactor = SELF_LOOP_CP_FACTOR;

  const verticalOffset = width * SELF_LOOP_OFFSET_MULTIPLIER * directionCount;
  const horizontalOffset = width * SELF_LOOP_OFFSET_MULTIPLIER * directionCount;
  const radiusGrowth = 1 + directionCount * 0.25;

  switch (direction) {
    case 'right':
      return {
        start: {
          x: center.x + nodeWidth / 2,
          y: center.y - width + verticalOffset,
        },
        end: {
          x: center.x + nodeWidth / 2,
          y: center.y + width + verticalOffset,
        },
        cp1: {
          x: center.x + nodeWidth / 2 + radiusY * radiusGrowth,
          y: center.y - width * cpFactor + verticalOffset,
        },
        cp2: {
          x: center.x + nodeWidth / 2 + radiusY * radiusGrowth,
          y: center.y + width * cpFactor + verticalOffset,
        },
      };
    case 'bottom':
      return {
        start: {
          x: center.x - width + horizontalOffset,
          y: center.y + nodeHeight / 2,
        },
        end: {
          x: center.x + width + horizontalOffset,
          y: center.y + nodeHeight / 2,
        },
        cp1: {
          x: center.x - width * cpFactor + horizontalOffset,
          y: center.y + nodeHeight / 2 + radiusY * radiusGrowth,
        },
        cp2: {
          x: center.x + width * cpFactor + horizontalOffset,
          y: center.y + nodeHeight / 2 + radiusY * radiusGrowth,
        },
      };
    case 'left':
      return {
        start: {
          x: center.x - nodeWidth / 2,
          y: center.y + width - verticalOffset,
        },
        end: {
          x: center.x - nodeWidth / 2,
          y: center.y - width - verticalOffset,
        },
        cp1: {
          x: center.x - nodeWidth / 2 - radiusY * radiusGrowth,
          y: center.y + width * cpFactor - verticalOffset,
        },
        cp2: {
          x: center.x - nodeWidth / 2 - radiusY * radiusGrowth,
          y: center.y - width * cpFactor - verticalOffset,
        },
      };
    default: // top
      return {
        start: {
          x: center.x + width - horizontalOffset,
          y: center.y - nodeHeight / 2,
        },
        end: {
          x: center.x - width - horizontalOffset,
          y: center.y - nodeHeight / 2,
        },
        cp1: {
          x: center.x + width * cpFactor - horizontalOffset,
          y: center.y - nodeHeight / 2 - radiusY * radiusGrowth,
        },
        cp2: {
          x: center.x - width * cpFactor - horizontalOffset,
          y: center.y - nodeHeight / 2 - radiusY * radiusGrowth,
        },
      };
  }
}
