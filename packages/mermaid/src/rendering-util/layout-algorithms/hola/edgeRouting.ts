import type { Edge, LayoutData, Node } from '../../types.js';
import {
  ALIGNMENT_EPSILON,
  EDGE_OBSTACLE_CROSSING_PENALTY,
  MAX_EDGES_PER_SIDE,
} from './Constants.js';
import { RoutingGrid } from './orthogonal-routing/grid.js';
import { findOrthogonalPath } from './orthogonal-routing/pathfinding.js';
import type {
  EdgeContext,
  GridConfig,
  PathValidationResult,
  Point,
} from './orthogonal-routing/types.js';

export type Side = 'left' | 'right' | 'top' | 'bottom';

const START_DIRECTION: Record<Side, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};
const END_APPROACH_DIRECTION: Record<Side, Point> = {
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  top: { x: 0, y: 1 },
  bottom: { x: 0, y: -1 },
};

/**
 * Calculate edge-to-edge distance between two nodes, accounting for node shapes.
 * Uses the node's intersect function to get accurate boundary points.
 *
 * @param node1 - First node
 * @param node2 - Second node
 * @returns Edge-to-edge distance, or Infinity if nodes are invalid
 */
function getEdgeToEdgeDistance(node1: Node | undefined, node2: Node | undefined): number {
  if (!node1 || !node2) {
    return Infinity;
  }

  const x1 = node1.x ?? 0;
  const y1 = node1.y ?? 0;
  const x2 = node2.x ?? 0;
  const y2 = node2.y ?? 0;

  if (node1.intersect && node2.intersect) {
    try {
      const intersect1 = node1.intersect({ x: x2, y: y2 });

      const intersect2 = node2.intersect({ x: x1, y: y1 });

      if (intersect1 && intersect2) {
        const dx = intersect2.x - intersect1.x;
        const dy = intersect2.y - intersect1.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
    } catch (_error) {
      // If intersect functions fail, fall through to bounding box calculation
    }
  }

  const centerDx = x2 - x1;
  const centerDy = y2 - y1;
  const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);

  const width1 = node1.width ?? 0;
  const height1 = node1.height ?? 0;
  const width2 = node2.width ?? 0;
  const height2 = node2.height ?? 0;

  const radius1 = (width1 + height1) / 4;
  const radius2 = (width2 + height2) / 4;

  const edgeDistance = centerDistance - radius1 - radius2;

  return Math.max(0, edgeDistance);
}

/**
 * Sort edges by distance between their connected nodes.
 * - Non-self-loop edges are sorted by edge-to-edge distance (ascending - closer nodes first)
 * - Self-loop edges are placed at the end
 *
 * @param data4Layout - Layout data containing nodes and edges
 */
export function sortEdgesByDistance(data4Layout: LayoutData) {
  const nodeMap = new Map<string, Node>();
  for (const node of data4Layout.nodes) {
    nodeMap.set(node.id, node);
  }

  data4Layout.edges.sort((edgeA, edgeB) => {
    const isSelfLoopA = edgeA.start === edgeA.end;
    const isSelfLoopB = edgeB.start === edgeB.end;

    if (isSelfLoopA && !isSelfLoopB) {
      return 1;
    }
    if (!isSelfLoopA && isSelfLoopB) {
      return -1;
    }
    if (isSelfLoopA && isSelfLoopB) {
      return 0;
    }

    const getDistance = (edge: Edge): number => {
      const n1 = nodeMap.get(edge.start ?? '');
      const n2 = nodeMap.get(edge.end ?? '');
      if (edge.isLabelEdge) {
        if (!n1 || !n2) {
          return Infinity;
        }
        const dx = (n2.x ?? 0) - (n1.x ?? 0);
        const dy = (n2.y ?? 0) - (n1.y ?? 0);
        return Math.sqrt(dx * dx + dy * dy);
      }
      return getEdgeToEdgeDistance(n1, n2);
    };

    const distanceA = getDistance(edgeA);
    const distanceB = getDistance(edgeB);

    return distanceA - distanceB;
  });
}

/**
 * Initialize side usage tracking for all nodes.
 * Creates a map of node IDs to their side usage counts.
 *
 * @param nodes - Array of nodes
 * @returns Map of node IDs to side usage maps
 */
export function initializeSideUsage(nodes: Node[]): Map<string, Map<Side, number>> {
  const sideUsage = new Map<string, Map<Side, number>>();

  for (const node of nodes) {
    const nodeSides = new Map<Side, number>();
    nodeSides.set('left', 0);
    nodeSides.set('right', 0);
    nodeSides.set('top', 0);
    nodeSides.set('bottom', 0);
    sideUsage.set(node.id, nodeSides);
  }

  return sideUsage;
}

/**
 * Update side usage after assigning an edge to a side.
 *
 * @param sideUsage - Side usage tracking map
 * @param nodeId - Node ID
 * @param side - Side that was used
 */
function updateSideUsage(
  sideUsage: Map<string, Map<Side, number>>,
  nodeId: string,
  side: Side | undefined
): void {
  if (!side) {
    return;
  }

  const nodeSides = sideUsage.get(nodeId);
  if (nodeSides) {
    const currentUsage = nodeSides.get(side) ?? 0;
    nodeSides.set(side, currentUsage + 1);
  }
}

function getStartDirectionVector(side: Side): Point {
  return START_DIRECTION[side];
}

function getEndDirectionVector(side: Side): Point {
  return END_APPROACH_DIRECTION[side];
}

function isApproximatelyEqual(a: number, b: number, epsilon = ALIGNMENT_EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}

function tryStraightPath(
  startPoint: Point,
  endPoint: Point,
  startDir: Point,
  endDir: Point
): Point[] | null {
  const horizontalLine = isApproximatelyEqual(startPoint.y, endPoint.y);
  const verticalLine = isApproximatelyEqual(startPoint.x, endPoint.x);

  if (
    horizontalLine &&
    startDir.x !== 0 &&
    endDir.x !== 0 &&
    Math.sign(startDir.x) === Math.sign(endDir.x)
  ) {
    const dx = endPoint.x - startPoint.x;
    if (Math.abs(dx) > ALIGNMENT_EPSILON && dx * startDir.x > 0 && dx * endDir.x > 0) {
      return [startPoint, endPoint];
    }
  }

  if (
    verticalLine &&
    startDir.y !== 0 &&
    endDir.y !== 0 &&
    Math.sign(startDir.y) === Math.sign(endDir.y)
  ) {
    const dy = endPoint.y - startPoint.y;
    if (Math.abs(dy) > ALIGNMENT_EPSILON && dy * startDir.y > 0 && dy * endDir.y > 0) {
      return [startPoint, endPoint];
    }
  }

  return null;
}

function trySingleBendPath(
  startPoint: Point,
  endPoint: Point,
  startDir: Point,
  endDir: Point
): Point[] | null {
  const startHorizontal = startDir.y === 0;
  const endHorizontal = endDir.y === 0;

  if (startHorizontal === endHorizontal) {
    return null;
  }

  if (startHorizontal) {
    const bendPoint: Point = { x: endPoint.x, y: startPoint.y };
    const dx = bendPoint.x - startPoint.x;
    const dy = endPoint.y - bendPoint.y;

    if (dx * startDir.x <= ALIGNMENT_EPSILON) {
      return null;
    }
    if (dy * endDir.y <= ALIGNMENT_EPSILON) {
      return null;
    }
    return [startPoint, bendPoint, endPoint];
  }

  const bendPoint: Point = { x: startPoint.x, y: endPoint.y };
  const dy = bendPoint.y - startPoint.y;
  const dx = endPoint.x - bendPoint.x;

  if (dy * startDir.y <= ALIGNMENT_EPSILON) {
    return null;
  }
  if (dx * endDir.x <= ALIGNMENT_EPSILON) {
    return null;
  }
  return [startPoint, bendPoint, endPoint];
}

function evaluatePathComplexity(
  node1: Node,
  node2: Node,
  startSide: Side,
  endSide: Side,
  obstacles: Node[]
): {
  bendCount: number;
  obstacleHits: number;
  pathPoints: Point[];
  pathType: 'straight' | 'single-bend' | 'multi';
} {
  const startPoint = getSideConnectionPoint(node1, startSide);
  const endPoint = getSideConnectionPoint(node2, endSide);
  const startDir = getStartDirectionVector(startSide);
  const endDir = getEndDirectionVector(endSide);
  const startAxis = startDir.x === 0 ? 'vertical' : 'horizontal';
  const endAxis = endDir.x === 0 ? 'vertical' : 'horizontal';

  const straightPath = tryStraightPath(startPoint, endPoint, startDir, endDir);
  if (straightPath) {
    const straightHits = countObstacleIntersections(
      node1,
      node2,
      startSide,
      endSide,
      obstacles,
      straightPath
    );
    if (straightHits === 0) {
      return {
        bendCount: 0,
        obstacleHits: 0,
        pathPoints: straightPath,
        pathType: 'straight',
      };
    }
  }

  const singleBendPath = trySingleBendPath(startPoint, endPoint, startDir, endDir);
  if (singleBendPath) {
    const singleHits = countObstacleIntersections(
      node1,
      node2,
      startSide,
      endSide,
      obstacles,
      singleBendPath
    );
    if (singleHits === 0) {
      return {
        bendCount: 1,
        obstacleHits: 0,
        pathPoints: singleBendPath,
        pathType: 'single-bend',
      };
    }
  }

  const fallbackBends = startAxis === endAxis ? 2 : 3;
  const fallbackObstacleHits =
    (singleBendPath &&
      countObstacleIntersections(node1, node2, startSide, endSide, obstacles, singleBendPath)) ||
    (straightPath &&
      countObstacleIntersections(node1, node2, startSide, endSide, obstacles, straightPath)) ||
    countObstacleIntersections(node1, node2, startSide, endSide, obstacles);

  return {
    bendCount: fallbackBends,
    obstacleHits: fallbackObstacleHits,
    pathPoints: straightPath ?? [startPoint, endPoint],
    pathType: 'multi',
  };
}

/**
 * Calculate score for a specific side pair between two nodes.
 * Lower score is better.
 *
 * Simplified scoring based on clear priorities:
 * 1. Shortest path (most important)
 * 2. Avoid obstacles
 * 3. Avoid edge crossings
 * 4. Geometric intuition (sides pointing toward each other)
 * 5. Balanced distribution (avoid congested sides)
 *
 * @param node1 - Start node
 * @param node2 - End node
 * @param startSide - Proposed start side
 * @param endSide - Proposed end side
 * @param sideUsage - Current side usage tracking
 * @param obstacles - Array of all nodes that could be obstacles
 * @param reverseEdgeSides - If a reverse edge exists, its side configuration
 * @param routedEdges - Array of edges that have already been assigned points (for crossing detection)
 * @returns Score for this side combination (lower is better)
 */
function getSideScore(
  node1: Node,
  node2: Node,
  startSide: Side,
  endSide: Side,
  sideUsage: Map<string, Map<Side, number>>,
  obstacles: Node[] = [],
  reverseEdgeSides?: { startSide: Side; endSide: Side }
): number {
  let score = 0;

  const x1 = node1.x ?? 0;
  const y1 = node1.y ?? 0;
  const x2 = node2.x ?? 0;
  const y2 = node2.y ?? 0;
  const width1 = node1.width ?? 50;
  const height1 = node1.height ?? 40;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const pathInfo = evaluatePathComplexity(node1, node2, startSide, endSide, obstacles);

  const isAligned = nodesAligned(node1, node2, startSide, endSide, obstacles);
  if (isAligned.aligned) {
    score -= 1000;
  }
  score += pathInfo.obstacleHits * EDGE_OBSTACLE_CROSSING_PENALTY;

  const bendPenalty = (() => {
    if (pathInfo.bendCount <= 0) {
      return -450;
    }
    if (pathInfo.bendCount === 1) {
      return -260;
    }
    if (pathInfo.bendCount === 2) {
      return 400;
    }
    return 600;
  })();
  score += bendPenalty;
  if (pathInfo.pathType === 'single-bend') {
    score -= 140;
  } else if (pathInfo.pathType === 'straight') {
    score -= 200;
  }

  const startUsage = sideUsage.get(node1.id)?.get(startSide) ?? 0;
  const endUsage = sideUsage.get(node2.id)?.get(endSide) ?? 0;

  if (startUsage >= MAX_EDGES_PER_SIDE) {
    score += 1000;
  }
  if (endUsage >= MAX_EDGES_PER_SIDE) {
    score += 1000;
  }

  score += startUsage * 20;
  score += endUsage * 20;

  const verticalDominance = Math.abs(dy) * width1;
  const horizontalDominance = Math.abs(dx) * height1;

  if (verticalDominance > horizontalDominance) {
    if ((dy > 0 && startSide === 'bottom') || (dy < 0 && startSide === 'top')) {
      score -= 50;
    } else {
      score += 30;
    }
  } else {
    if ((dx > 0 && startSide === 'right') || (dx < 0 && startSide === 'left')) {
      score -= 50;
    } else {
      score += 30;
    }
  }

  const isOpposite =
    (startSide === 'right' && endSide === 'left') ||
    (startSide === 'left' && endSide === 'right') ||
    (startSide === 'top' && endSide === 'bottom') ||
    (startSide === 'bottom' && endSide === 'top');

  if (isOpposite) {
    score -= 50;
  }

  const alignmentThreshold = 10;
  const isHorizontallyAligned = Math.abs(dy) <= alignmentThreshold;
  const isVerticallyAligned = Math.abs(dx) <= alignmentThreshold;

  if (
    isHorizontallyAligned &&
    (startSide === 'left' || startSide === 'right') &&
    (endSide === 'left' || endSide === 'right')
  ) {
    score -= 100;
  }

  if (
    isVerticallyAligned &&
    (startSide === 'top' || startSide === 'bottom') &&
    (endSide === 'top' || endSide === 'bottom')
  ) {
    score -= 100;
  }

  // Bidirectional edge preference: strongly favor complementary sides
  // If there's a reverse edge (B→A when we're evaluating A→B), use opposite sides
  if (reverseEdgeSides) {
    // Check if we're using complementary/opposite sides to the reverse edge
    // Reverse edge uses: reverseEdgeSides.startSide (on node2) → reverseEdgeSides.endSide (on node1)
    // Current edge uses: startSide (on node1) → endSide (on node2)
    // For perfect complementarity: our endSide should match reverse's startSide, and vice versa
    const isComplementary =
      startSide === reverseEdgeSides.endSide && endSide === reverseEdgeSides.startSide;

    if (isComplementary) {
      score -= 300;
    } else {
      score += 100;
    }
  }

  return score;
}

/**
 * Calculate optimal sides for a regular edge (non-self-loop).
 * Uses sophisticated scoring to evaluate all possible side combinations.
 *
 * @param node1 - Start node
 * @param node2 - End node
 * @param sideUsage - Current side usage tracking
 * @param obstacles - Array of all nodes that could be obstacles
 * @param allEdges - All edges in the graph (to detect bidirectional edges)
 * @param currentEdgeId - ID of the current edge being evaluated
 * @param routedEdges - Array of edges that have already been assigned points (for crossing detection)
 * @returns Top 2 optimal start and end side combinations (sorted by score, best first)
 */
export function calculateOptimalSides(
  node1: Node,
  node2: Node,
  sideUsage: Map<string, Map<Side, number>>,
  obstacles: Node[] = [],
  allEdges: Edge[] = [],
  currentEdgeId?: string
): { startSide: Side; endSide: Side }[] {
  const allSides: Side[] = ['left', 'right', 'top', 'bottom'];

  const topCombinations: {
    startSide: Side;
    endSide: Side;
    score: number;
  }[] = [
    { startSide: 'right', endSide: 'left', score: Infinity },
    { startSide: 'right', endSide: 'left', score: Infinity },
  ];

  let reverseEdgeSides: { startSide: Side; endSide: Side } | undefined;
  if (allEdges.length > 0 && currentEdgeId) {
    const getBaseEdgeId = (edgeId: string): string => {
      return edgeId.replace(/-(to|from)-label$/, '');
    };
    const currentBaseId = getBaseEdgeId(currentEdgeId);
    for (const edge of allEdges) {
      const edgeBaseId = getBaseEdgeId(edge.id);
      if (edgeBaseId === currentBaseId) {
        continue;
      }
      const isDirectReverse = edge.start === node2.id && edge.end === node1.id;
      const isReverseSegment =
        edgeBaseId.includes(`L_${node2.id}_${node1.id}_`) ||
        edge.id.includes(`L_${node2.id}_${node1.id}_`);
      if ((isDirectReverse || isReverseSegment) && edge.startSide && edge.endSide) {
        reverseEdgeSides = {
          startSide: edge.startSide as Side,
          endSide: edge.endSide as Side,
        };
        break;
      }
    }
  }

  for (const startSide of allSides) {
    for (const endSide of allSides) {
      const score = getSideScore(
        node1,
        node2,
        startSide,
        endSide,
        sideUsage,
        obstacles,
        reverseEdgeSides
      );

      if (score < topCombinations[1].score) {
        topCombinations[1] = { startSide, endSide, score };

        topCombinations.sort((a, b) => a.score - b.score);
      }
    }
  }

  const result = topCombinations.map((comb) => ({
    startSide: comb.startSide,
    endSide: comb.endSide,
  }));

  return result;
}

/**
 * Initialize slot tracking for all nodes.
 * Tracks which edges are assigned to each side in order.
 *
 * @param nodes - Array of nodes
 * @returns Map of node IDs to side slot arrays
 */
export function initializeSideSlots(nodes: Node[]): Map<string, Map<Side, string[]>> {
  const sideSlots = new Map<string, Map<Side, string[]>>();

  for (const node of nodes) {
    const nodeSides = new Map<Side, string[]>();
    nodeSides.set('left', []);
    nodeSides.set('right', []);
    nodeSides.set('top', []);
    nodeSides.set('bottom', []);
    sideSlots.set(node.id, nodeSides);
  }

  return sideSlots;
}

/**
 * Calculate connection point on a node's side with even distribution.
 * Distributes multiple edges evenly across the full length of the side.
 * Uses dimension-based distribution for rectangles, fixed spacing for others.
 *
 * @param node - The node
 * @param side - Which side of the node
 * @param slotIndex - Position in the slot array (0-based)
 * @param totalSlots - Total number of edges on this side
 * @returns Connection point coordinates
 */
function getConnectionPoint(
  node: Node,
  side: Side,
  slotIndex: number,
  totalSlots: number
): { x: number; y: number } {
  const centerX = node.x ?? 0;
  const centerY = node.y ?? 0;
  const width = node.width ?? 50;
  const height = node.height ?? 40;

  const nodeShape = (node as any).shape ?? '';
  const isRectangle =
    nodeShape === 'squareRect' ||
    nodeShape === 'rect' ||
    nodeShape === 'rectangle' ||
    nodeShape === 'roundedRect' ||
    nodeShape === 'rounded-rect';

  let dimension: number;
  let baseOffset: number;

  if (side === 'left' || side === 'right') {
    dimension = height;
  } else {
    dimension = width;
  }

  if (isRectangle && dimension > 0 && totalSlots > 1) {
    const sectionSpacing = dimension / (totalSlots + 1);
    const positionFromTopOrLeft = (slotIndex + 1) * sectionSpacing;
    baseOffset = positionFromTopOrLeft - dimension / 2;
  } else if (totalSlots > 1) {
    const spacing = 10;
    const centerIndex = (totalSlots - 1) / 2;
    baseOffset = (slotIndex - centerIndex) * spacing;
  } else {
    baseOffset = 0;
  }

  switch (side) {
    case 'top':
      return {
        x: centerX + baseOffset,
        y: centerY - height / 2,
      };
    case 'bottom':
      return {
        x: centerX + baseOffset,
        y: centerY + height / 2,
      };
    case 'left':
      return {
        x: centerX - width / 2,
        y: centerY + baseOffset,
      };
    case 'right':
      return {
        x: centerX + width / 2,
        y: centerY + baseOffset,
      };
  }
}

/**
 * Count the number of crossings between edges in a list.
 * Only counts crossings between edges that have points assigned.
 *
 * @param edgeIds - Array of edge IDs to check
 * @param edges - All edges in the graph
 * @returns Number of crossings detected
 */
function countCrossings(edgeIds: string[], edges: Edge[]): number {
  let crossingCount = 0;

  for (let i = 0; i < edgeIds.length; i++) {
    const edge1 = edges.find((e) => e.id === edgeIds[i]);
    if (!edge1?.points || edge1.points.length < 2) {
      continue;
    }

    for (let j = i + 1; j < edgeIds.length; j++) {
      const edge2 = edges.find((e) => e.id === edgeIds[j]);
      if (!edge2?.points || edge2.points.length < 2) {
        continue;
      }

      const crosses = doEdgesCross(edge1, edge2);

      if (crosses) {
        crossingCount++;
      }
    }
  }

  return crossingCount;
}

/**
 * Minimize crossings by iteratively swapping adjacent edges.
 * Uses a greedy approach: swap adjacent edges if it reduces crossings.
 *
 * @param edgeIds - Array of edge IDs on a node side (will be modified in place)
 * @param edges - All edges in the graph
 * @param maxIterations - Maximum number of optimization passes
 * @returns Number of crossings eliminated
 */
function minimizeCrossingsBySwapping(
  edgeIds: string[],
  edges: Edge[],
  nodeId: string,
  side: Side,
  nodeMap: Map<string, Node>,
  maxIterations = 10
): number {
  if (edgeIds.length <= 1) {
    return 0;
  }

  const initialCrossings = countCrossings(edgeIds, edges);
  let currentCrossings = initialCrossings;
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 0; i < edgeIds.length - 1; i++) {
      [edgeIds[i], edgeIds[i + 1]] = [edgeIds[i + 1], edgeIds[i]];

      for (let j = 0; j < edgeIds.length; j++) {
        const edge = edges.find((e) => e.id === edgeIds[j]);
        if (!edge?.start || !edge.end) {
          continue;
        }

        const isStartSide = edge.start === nodeId;
        const isEndSide = edge.end === nodeId;

        if (!isStartSide && !isEndSide) {
          continue;
        }

        const currentNode = nodeMap.get(nodeId);
        if (!currentNode) {
          continue;
        }

        const newSlotIndex = j;
        const totalSlots = edgeIds.length;

        const newPoint = getConnectionPoint(currentNode, side, newSlotIndex, totalSlots);

        if (edge.points && edge.points.length >= 2) {
          if (isStartSide) {
            edge.points[0] = newPoint;
          } else if (isEndSide) {
            edge.points[edge.points.length - 1] = newPoint;
          }
        }
      }

      const newCrossings = countCrossings(edgeIds, edges);

      if (newCrossings < currentCrossings) {
        currentCrossings = newCrossings;
        improved = true;
      } else {
        [edgeIds[i], edgeIds[i + 1]] = [edgeIds[i + 1], edgeIds[i]];

        for (let j = 0; j < edgeIds.length; j++) {
          const edge = edges.find((e) => e.id === edgeIds[j]);
          if (!edge?.start || !edge.end) {
            continue;
          }

          const isStartSide = edge.start === nodeId;
          const isEndSide = edge.end === nodeId;

          if (!isStartSide && !isEndSide) {
            continue;
          }

          const currentNode = nodeMap.get(nodeId);
          if (!currentNode) {
            continue;
          }

          const newSlotIndex = j;
          const totalSlots = edgeIds.length;

          const newPoint = getConnectionPoint(currentNode, side, newSlotIndex, totalSlots);

          if (edge.points && edge.points.length >= 2) {
            if (isStartSide) {
              edge.points[0] = newPoint;
            } else if (isEndSide) {
              edge.points[edge.points.length - 1] = newPoint;
            }
          }
        }
      }
    }
  }

  const crossingsEliminated = initialCrossings - currentCrossings;
  return crossingsEliminated;
}

/**
 * Check if two edges cross each other.
 * Uses line-line intersection algorithm.
 *
 * @param edge1 - First edge with points
 * @param edge2 - Second edge with points
 * @returns True if the edges intersect
 */
function doEdgesCross(edge1: Edge, edge2: Edge): boolean {
  if (
    (edge1.start === edge2.start && edge1.end === edge2.end) ||
    (edge1.start === edge2.end && edge1.end === edge2.start)
  ) {
    return false;
  }

  if (!edge1.points || edge1.points.length < 2 || !edge2.points || edge2.points.length < 2) {
    return false;
  }

  const ax = edge1.points[0].x;
  const ay = edge1.points[0].y;
  const bx = edge1.points[1].x;
  const by = edge1.points[1].y;

  const cx = edge2.points[0].x;
  const cy = edge2.points[0].y;
  const dx = edge2.points[1].x;
  const dy = edge2.points[1].y;

  const denom = (ax - bx) * (cy - dy) - (ay - by) * (cx - dx);

  if (Math.abs(denom) < 1e-10) {
    return false;
  }

  const t = ((ax - cx) * (cy - dy) - (ay - cy) * (cx - dx)) / denom;
  const u = -((ax - bx) * (ay - cy) - (ay - by) * (ax - cx)) / denom;

  const result = t > 0 && t < 1 && u > 0 && u < 1;

  return result;
}

/**
 * Calculate and set edge start and end points based on assigned sides and slot positions.
 * Handles parallel and bidirectional edge distribution.
 *
 * @param data4Layout - Layout data containing nodes and edges
 * @param nodeMap - Map of node IDs to node objects
 * @param sideSlots - Map tracking which edges are on which sides
 * @param connectionSides - Map of edge IDs to their assigned sides
 */
function calculateEdgePoints(
  data4Layout: LayoutData,
  nodeMap: Map<string, Node>,
  sideSlots: Map<string, Map<Side, string[]>>,
  connectionSides: Map<
    string,
    {
      startSide: string;
      endSide: string;
      canDrawStraight: boolean;
      nodeWhichCovered: Node | null;
      overlapCenter: { x: number; y: number } | null;
      coveragePercent: number;
    }
  >
): void {
  for (const edge of data4Layout.edges) {
    if (edge.start === edge.end || !edge.start || !edge.end) {
      continue;
    }

    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);
    const sides = connectionSides.get(edge.id);

    if (!startNode || !endNode || !sides) {
      continue;
    }

    const startSide = sides.startSide as Side;
    const endSide = sides.endSide as Side;

    const startNodeSlots = sideSlots.get(edge.start);
    const startSideEdges = startNodeSlots?.get(startSide) ?? [];
    const startSlotIndex = startSideEdges.indexOf(edge.id);
    const totalStartSlots = startSideEdges.length;

    const endNodeSlots = sideSlots.get(edge.end);
    const endSideEdges = endNodeSlots?.get(endSide) ?? [];
    const endSlotIndex = endSideEdges.indexOf(edge.id);
    const totalEndSlots = endSideEdges.length;

    const startPoint = getConnectionPoint(startNode, startSide, startSlotIndex, totalStartSlots);
    const endPoint = getConnectionPoint(endNode, endSide, endSlotIndex, totalEndSlots);

    edge.points = [startPoint, endPoint];
  }

  for (const [nodeId, sideSlotsMap] of sideSlots) {
    for (const [side, edgeIds] of sideSlotsMap) {
      if (edgeIds.length <= 1) {
        continue;
      }

      minimizeCrossingsBySwapping(edgeIds, data4Layout.edges, nodeId, side, nodeMap);
    }
  }

  for (const edge of data4Layout.edges) {
    if (edge.start === edge.end) {
      continue;
    }

    const startNode = nodeMap.get(edge.start ?? '');
    const endNode = nodeMap.get(edge.end ?? '');
    const sides = connectionSides.get(edge.id);

    if (!startNode || !endNode || !sides) {
      continue;
    }

    const startSide = sides.startSide as Side;
    const endSide = sides.endSide as Side;
    const canDrawStraight = sides.canDrawStraight;
    const nodeWhichCovered = sides.nodeWhichCovered;
    const overlapCenter = sides.overlapCenter;
    const coveragePercent = sides.coveragePercent;

    const startNodeSlots = sideSlots.get(edge.start ?? '');
    const startSideEdges = startNodeSlots?.get(startSide) ?? [];
    const startSlotIndex = startSideEdges.indexOf(edge.id);
    const totalStartSlots = startSideEdges.length;

    const endNodeSlots = sideSlots.get(edge.end ?? '');
    const endSideEdges = endNodeSlots?.get(endSide) ?? [];
    const endSlotIndex = endSideEdges.indexOf(edge.id);
    const totalEndSlots = endSideEdges.length;

    const startPoint = getConnectionPoint(startNode, startSide, startSlotIndex, totalStartSlots);
    const endPoint = getConnectionPoint(endNode, endSide, endSlotIndex, totalEndSlots);

    const edgesBetweenSameNodes = data4Layout.edges.filter(
      (e) =>
        (e.start === edge.start && e.end === edge.end) ||
        (e.start === edge.end && e.end === edge.start)
    ).length;
    const isParallelEdge = edgesBetweenSameNodes > 1;

    const startNodeShape = (startNode as any).shape ?? '';
    const startIsRectangle =
      startNodeShape === 'squareRect' ||
      startNodeShape === 'rect' ||
      startNodeShape === 'rectangle' ||
      startNodeShape === 'roundedRect' ||
      startNodeShape === 'rounded-rect' ||
      startNodeShape === 'labelRect' ||
      startNodeShape === 'stadium' ||
      startNodeShape === 'hexagon';

    const endNodeShape = (endNode as any).shape ?? '';
    const endIsRectangle =
      endNodeShape === 'squareRect' ||
      endNodeShape === 'rect' ||
      endNodeShape === 'rectangle' ||
      endNodeShape === 'roundedRect' ||
      endNodeShape === 'rounded-rect' ||
      endNodeShape === 'labelRect' ||
      endNodeShape === 'stadium' ||
      endNodeShape === 'hexagon';

    if (canDrawStraight && !isParallelEdge && startIsRectangle && endIsRectangle) {
      if (
        (startSide === 'right' && endSide === 'left') ||
        (startSide === 'left' && endSide === 'right')
      ) {
        let targetY: number;
        if (coveragePercent > 50 && nodeWhichCovered) {
          targetY = nodeWhichCovered.y ?? (startPoint.y + endPoint.y) / 2;
        } else if (overlapCenter) {
          targetY = overlapCenter.y;
        } else {
          targetY = (startPoint.y + endPoint.y) / 2;
        }
        startPoint.y = targetY;
        endPoint.y = targetY;
      }
      if (
        (startSide === 'top' && endSide === 'bottom') ||
        (startSide === 'bottom' && endSide === 'top')
      ) {
        let targetX: number;
        if (coveragePercent > 50 && nodeWhichCovered) {
          targetX = nodeWhichCovered.x ?? (startPoint.x + endPoint.x) / 2;
        } else if (overlapCenter) {
          targetX = overlapCenter.x;
        } else {
          targetX = (startPoint.x + endPoint.x) / 2;
        }
        startPoint.x = targetX;
        endPoint.x = targetX;
      }
    }

    edge.points = [startPoint, endPoint];
  }
}

/**
 * Post-process edges to resolve any remaining overlaps.
 * Detects edges on the same line and applies progressive offsets.
 *
 * @param edges - Array of edges with points
 */
function resolveEdgeOverlaps(edges: Edge[]): void {
  interface EdgeWithPoints extends Edge {
    startPoint?: { x: number; y: number };
    endPoint?: { x: number; y: number };
  }

  const edgesWithPoints = edges as EdgeWithPoints[];
  const processedEdges = new Set<string>();
  const adjustmentOffsets = new Map<string, { x: number; y: number }>();

  function areEdgesOverlapping(
    edge1: EdgeWithPoints,
    edge2: EdgeWithPoints
  ): {
    isOverlapping: boolean;
    isHorizontal: boolean;
    isVertical: boolean;
  } {
    if (!edge1.startPoint || !edge1.endPoint || !edge2.startPoint || !edge2.endPoint) {
      return { isOverlapping: false, isHorizontal: false, isVertical: false };
    }

    const tolerance = 0;

    const edge1IsHorizontal = Math.abs(edge1.startPoint.y - edge1.endPoint.y) <= tolerance;
    const edge2IsHorizontal = Math.abs(edge2.startPoint.y - edge2.endPoint.y) <= tolerance;
    const edge1IsVertical = Math.abs(edge1.startPoint.x - edge1.endPoint.x) <= tolerance;
    const edge2IsVertical = Math.abs(edge2.startPoint.x - edge2.endPoint.x) <= tolerance;

    if (edge1IsHorizontal && edge2IsHorizontal) {
      const sameYLine = Math.abs(edge1.startPoint.y - edge2.startPoint.y) <= tolerance;
      if (sameYLine) {
        const edge1MinX = Math.min(edge1.startPoint.x, edge1.endPoint.x);
        const edge1MaxX = Math.max(edge1.startPoint.x, edge1.endPoint.x);
        const edge2MinX = Math.min(edge2.startPoint.x, edge2.endPoint.x);
        const edge2MaxX = Math.max(edge2.startPoint.x, edge2.endPoint.x);

        const xOverlap = edge1MinX <= edge2MaxX && edge2MinX <= edge1MaxX;
        if (xOverlap) {
          return { isOverlapping: true, isHorizontal: true, isVertical: false };
        }
      }
    }

    if (edge1IsVertical && edge2IsVertical) {
      const sameXLine = Math.abs(edge1.startPoint.x - edge2.startPoint.x) <= tolerance;
      if (sameXLine) {
        const edge1MinY = Math.min(edge1.startPoint.y, edge1.endPoint.y);
        const edge1MaxY = Math.max(edge1.startPoint.y, edge1.endPoint.y);
        const edge2MinY = Math.min(edge2.startPoint.y, edge2.endPoint.y);
        const edge2MaxY = Math.max(edge2.startPoint.y, edge2.endPoint.y);

        const yOverlap = edge1MinY <= edge2MaxY && edge2MinY <= edge1MaxY;
        if (yOverlap) {
          return { isOverlapping: true, isHorizontal: false, isVertical: true };
        }
      }
    }

    return { isOverlapping: false, isHorizontal: false, isVertical: false };
  }

  for (let i = 0; i < edgesWithPoints.length; i++) {
    const currentEdge = edgesWithPoints[i];

    if (!currentEdge.startPoint || !currentEdge.endPoint || !currentEdge.id) {
      continue;
    }

    if (processedEdges.has(currentEdge.id)) {
      continue;
    }

    let hasOverlap = false;
    let isHorizontalOverlap = false;
    let isVerticalOverlap = false;

    for (const [j, otherEdge] of edgesWithPoints.entries()) {
      if (i === j) {
        continue;
      }

      if (!otherEdge.id || !otherEdge.startPoint || !otherEdge.endPoint) {
        continue;
      }

      const overlapResult = areEdgesOverlapping(currentEdge, otherEdge);

      if (overlapResult.isOverlapping) {
        hasOverlap = true;
        if (overlapResult.isHorizontal) {
          isHorizontalOverlap = true;
        }
        if (overlapResult.isVertical) {
          isVerticalOverlap = true;
        }
        break;
      }
    }

    if (hasOverlap) {
      const baseOffset = processedEdges.size + 1;

      if (isHorizontalOverlap) {
        const offsetY = 5 * baseOffset;
        currentEdge.startPoint.y += offsetY;
        currentEdge.endPoint.y += offsetY;

        if (currentEdge.points) {
          currentEdge.points = currentEdge.points.map((point) => ({
            ...point,
            y: point.y + offsetY,
          }));
        }

        adjustmentOffsets.set(currentEdge.id, {
          x: adjustmentOffsets.get(currentEdge.id)?.x ?? 0,
          y: (adjustmentOffsets.get(currentEdge.id)?.y ?? 0) + offsetY,
        });
      }

      if (isVerticalOverlap) {
        const offsetX = 20 * baseOffset;
        currentEdge.startPoint.x += offsetX;
        currentEdge.endPoint.x += offsetX;

        if (currentEdge.points) {
          currentEdge.points = currentEdge.points.map((point) => ({
            ...point,
            x: point.x + offsetX,
          }));
        }

        adjustmentOffsets.set(currentEdge.id, {
          x: (adjustmentOffsets.get(currentEdge.id)?.x ?? 0) + offsetX,
          y: adjustmentOffsets.get(currentEdge.id)?.y ?? 0,
        });
      }

      processedEdges.add(currentEdge.id);
    }
  }
}

/**
 * Get the midpoint of a specific side of a node.
 * This is used for validation purposes only (not actual edge connection points).
 *
 * @param node - The node
 * @param side - The side to get the midpoint for
 * @returns The midpoint coordinates of the specified side
 */
function getMidpointForSide(node: Node, side: Side): { x: number; y: number } {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const width = node.width ?? 50;
  const height = node.height ?? 40;

  switch (side) {
    case 'top':
      return { x, y: y - height / 2 };
    case 'bottom':
      return { x, y: y + height / 2 };
    case 'left':
      return { x: x - width / 2, y };
    case 'right':
      return { x: x + width / 2, y };
  }
}

function getSideConnectionPoint(node: Node, side: Side): { x: number; y: number } {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const width = node.width ?? 50;
  const height = node.height ?? 40;

  switch (side) {
    case 'top':
      return { x, y: y - height / 2 };
    case 'bottom':
      return { x, y: y + height / 2 };
    case 'left':
      return { x: x - width / 2, y };
    case 'right':
      return { x: x + width / 2, y };
  }
}

function lineIntersectsRectangle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  obstacle: Node
): boolean {
  const ox = obstacle.x ?? 0;
  const oy = obstacle.y ?? 0;
  const ow = obstacle.width ?? 50;
  const oh = obstacle.height ?? 40;

  const left = ox - ow / 2;
  const right = ox + ow / 2;
  const top = oy - oh / 2;
  const bottom = oy + oh / 2;

  if (
    (ax >= left && ax <= right && ay >= top && ay <= bottom) ||
    (bx >= left && bx <= right && by >= top && by <= bottom)
  ) {
    return true;
  }

  const intersectsEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean => {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) {
      return false;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };

  return (
    intersectsEdge(ax, ay, bx, by, left, top, right, top) ||
    intersectsEdge(ax, ay, bx, by, right, top, right, bottom) ||
    intersectsEdge(ax, ay, bx, by, right, bottom, left, bottom) ||
    intersectsEdge(ax, ay, bx, by, left, bottom, left, top)
  );
}

function segmentHitsObstacles(
  startPoint: Point,
  endPoint: Point,
  obstacles: Node[],
  node1Id: string,
  node2Id: string
): number {
  let hits = 0;
  for (const obstacle of obstacles) {
    if (obstacle.id === node1Id || obstacle.id === node2Id) {
      continue;
    }
    if (obstacle.isGroup) {
      continue;
    }
    if (lineIntersectsRectangle(startPoint.x, startPoint.y, endPoint.x, endPoint.y, obstacle)) {
      hits++;
    }
  }
  return hits;
}

function countObstacleIntersections(
  node1: Node,
  node2: Node,
  startSide: Side,
  endSide: Side,
  obstacles: Node[],
  pathPoints?: Point[]
): number {
  const points = pathPoints ?? [
    getSideConnectionPoint(node1, startSide),
    getSideConnectionPoint(node2, endSide),
  ];

  let intersectionCount = 0;
  for (let i = 0; i < points.length - 1; i++) {
    intersectionCount += segmentHitsObstacles(
      points[i],
      points[i + 1],
      obstacles,
      node1.id,
      node2.id
    );
  }

  return intersectionCount;
}

/**
 * Validate a side selection using orthogonal pathfinding.
 * Creates a fresh RoutingGrid and tests if a valid orthogonal path exists.
 *
 * @param startNode - The source node
 * @param endNode - The target node
 * @param startSide - The proposed start side
 * @param endSide - The proposed end side
 * @param allNodes - All nodes in the layout (for grid construction)
 * @param edgeId - The current edge ID
 * @returns true if a valid orthogonal path exists, false otherwise
 */
function validateSideSelection(
  startNode: Node,
  endNode: Node,
  startSide: Side,
  endSide: Side,
  grid: RoutingGrid,
  data4Layout: LayoutData
): PathValidationResult {
  let startPoint = getMidpointForSide(startNode, startSide);
  let endPoint = getMidpointForSide(endNode, endSide);

  const alignmentResult = nodesAligned(startNode, endNode, startSide, endSide, data4Layout.nodes);
  if (alignmentResult.aligned) {
    if (
      (startSide === 'right' && endSide === 'left') ||
      (startSide === 'left' && endSide === 'right')
    ) {
      let targetY: number;
      if (alignmentResult.coveragePercent > 50 && alignmentResult.nodeWhichCovered) {
        targetY = alignmentResult.nodeWhichCovered.y ?? (startPoint.y + endPoint.y) / 2;
      } else if (alignmentResult.overlapCenter) {
        targetY = alignmentResult.overlapCenter.y;
      } else {
        targetY = (startPoint.y + endPoint.y) / 2;
      }
      startPoint = { ...startPoint, y: targetY };
      endPoint = { ...endPoint, y: targetY };
    }
    if (
      (startSide === 'top' && endSide === 'bottom') ||
      (startSide === 'bottom' && endSide === 'top')
    ) {
      let targetX: number;
      if (alignmentResult.coveragePercent > 50 && alignmentResult.nodeWhichCovered) {
        targetX = alignmentResult.nodeWhichCovered.x ?? (startPoint.x + endPoint.x) / 2;
      } else if (alignmentResult.overlapCenter) {
        targetX = alignmentResult.overlapCenter.x;
      } else {
        targetX = (startPoint.x + endPoint.x) / 2;
      }
      startPoint = { ...startPoint, x: targetX };
      endPoint = { ...endPoint, x: targetX };
    }
  }

  const edgeContext: EdgeContext = {
    sourceNodeId: startNode.id,
    targetNodeId: endNode.id,
  };

  const result = findOrthogonalPath(
    startPoint,
    endPoint,
    grid,
    5,
    edgeContext,
    data4Layout,
    startSide,
    endSide
  );

  return result;
}

export function assignSidesToEdges(
  data4Layout: LayoutData,
  nodeMap: Map<string, Node>,
  sideUsage: Map<string, Map<Side, number>>,
  sideSlots: Map<string, Map<Side, string[]>>,
  connectionSides: Map<
    string,
    {
      startSide: string;
      endSide: string;
      canDrawStraight: boolean;
      nodeWhichCovered: Node | null;
      overlapCenter: { x: number; y: number } | null;
      coveragePercent: number;
    }
  >
): void {
  const allNodes = data4Layout.nodes;
  const gridConfig: GridConfig = {
    cellSize: 8,
    nodeMargin: 0,
  };
  const grid = new RoutingGrid(allNodes, gridConfig);
  const geometricResult = getNodeQuadrants(data4Layout);

  const labelNodeFirstEdgeSide = new Map<string, { side: Side; role: 'start' | 'end' }>();

  for (const edge of data4Layout.edges) {
    const startNode = nodeMap.get(edge.start ?? '');
    const endNode = nodeMap.get(edge.end ?? '');
    let currentNodesAligned: {
      aligned: boolean;
      nodeWhichCovered: Node | null;
      overlapCenter: { x: number; y: number } | null;
      coveragePercent: number;
    } = { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 };
    if (!startNode || !endNode) {
      continue;
    }

    if (edge.start === edge.end) {
      continue;
    } else {
      const topSides = calculateOptimalSides(
        startNode,
        endNode,
        sideUsage,
        allNodes,
        data4Layout.edges,
        edge.id
      );

      if (!topSides || topSides.length < 2 || !topSides[0] || !topSides[1]) {
        topSides[0] = { startSide: 'right', endSide: 'left' };
        topSides[1] = { startSide: 'bottom', endSide: 'top' };
      }

      const result1 = validateSideSelection(
        startNode,
        endNode,
        topSides[0].startSide,
        topSides[0].endSide,
        grid,
        data4Layout
      );

      const result2 = validateSideSelection(
        startNode,
        endNode,
        topSides[1].startSide,
        topSides[1].endSide,
        grid,
        data4Layout
      );

      const priority = { straight: 4, lshape: 3, zshape: 2, astar: 1 };

      let selectedSides = topSides[0];
      let usedResult = result1;
      if (result1.valid && result2.valid) {
        if (result1.type && result2.type && priority[result1.type] === priority[result2.type]) {
          const startNodeQuadrants = geometricResult.get(startNode.id);
          // const endNodeQuadrants = geometricResult.get(endNode.id);

          let endNodeQuadrantForStartNode:
            | 'topLeft'
            | 'topRight'
            | 'bottomLeft'
            | 'bottomRight'
            | null = null;
          if (startNodeQuadrants) {
            if (startNodeQuadrants.topLeft.has(endNode.id)) {
              endNodeQuadrantForStartNode = 'topLeft';
            } else if (startNodeQuadrants.topRight.has(endNode.id)) {
              endNodeQuadrantForStartNode = 'topRight';
            } else if (startNodeQuadrants.bottomLeft.has(endNode.id)) {
              endNodeQuadrantForStartNode = 'bottomLeft';
            } else if (startNodeQuadrants.bottomRight.has(endNode.id)) {
              endNodeQuadrantForStartNode = 'bottomRight';
            }
          }

          let dominantQuadrant: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' = 'topRight';
          let maxNodeCount = 0;

          if (startNodeQuadrants) {
            const endNodeIdsForStartNode = new Set<string>();
            for (const edgeCandidate of data4Layout.edges) {
              if (edgeCandidate.start === startNode.id && edgeCandidate.end) {
                endNodeIdsForStartNode.add(edgeCandidate.end);
              }
            }

            const quadrantCounts = {
              topLeft: 0,
              topRight: 0,
              bottomLeft: 0,
              bottomRight: 0,
            };

            for (const nodeId of startNodeQuadrants.topLeft) {
              if (endNodeIdsForStartNode.has(nodeId)) {
                quadrantCounts.topLeft++;
              }
            }
            for (const nodeId of startNodeQuadrants.topRight) {
              if (endNodeIdsForStartNode.has(nodeId)) {
                quadrantCounts.topRight++;
              }
            }
            for (const nodeId of startNodeQuadrants.bottomLeft) {
              if (endNodeIdsForStartNode.has(nodeId)) {
                quadrantCounts.bottomLeft++;
              }
            }
            for (const nodeId of startNodeQuadrants.bottomRight) {
              if (endNodeIdsForStartNode.has(nodeId)) {
                quadrantCounts.bottomRight++;
              }
            }

            const quadrantsWithNodes = Object.entries(quadrantCounts).filter(
              ([_, count]) => count > 0
            );

            if (endNodeIdsForStartNode.size === 1) {
              const incomingStartNodeIds = new Set<string>();
              for (const edgeCandidate of data4Layout.edges) {
                if (edgeCandidate.end === startNode.id && edgeCandidate.start) {
                  incomingStartNodeIds.add(edgeCandidate.start);
                }
              }

              const incomingQuadrantCounts = {
                topLeft: 0,
                topRight: 0,
                bottomLeft: 0,
                bottomRight: 0,
              };

              for (const nodeId of startNodeQuadrants.topLeft) {
                if (incomingStartNodeIds.has(nodeId)) {
                  incomingQuadrantCounts.topLeft++;
                }
              }
              for (const nodeId of startNodeQuadrants.topRight) {
                if (incomingStartNodeIds.has(nodeId)) {
                  incomingQuadrantCounts.topRight++;
                }
              }
              for (const nodeId of startNodeQuadrants.bottomLeft) {
                if (incomingStartNodeIds.has(nodeId)) {
                  incomingQuadrantCounts.bottomLeft++;
                }
              }
              for (const nodeId of startNodeQuadrants.bottomRight) {
                if (incomingStartNodeIds.has(nodeId)) {
                  incomingQuadrantCounts.bottomRight++;
                }
              }

              const combinedCounts = {
                topLeft: quadrantCounts.topLeft + incomingQuadrantCounts.topLeft,
                topRight: quadrantCounts.topRight + incomingQuadrantCounts.topRight,
                bottomLeft: quadrantCounts.bottomLeft + incomingQuadrantCounts.bottomLeft,
                bottomRight: quadrantCounts.bottomRight + incomingQuadrantCounts.bottomRight,
              };

              const combinedQuadrantsWithNodes = Object.entries(combinedCounts).filter(
                ([_, count]) => count > 0
              );

              if (combinedQuadrantsWithNodes.length === 1) {
                dominantQuadrant = combinedQuadrantsWithNodes[0][0] as
                  | 'topLeft'
                  | 'topRight'
                  | 'bottomLeft'
                  | 'bottomRight';
              } else {
                let maxCombinedCount = 0;
                for (const [quadrant, count] of Object.entries(combinedCounts)) {
                  if (count > maxCombinedCount) {
                    maxCombinedCount = count;
                    dominantQuadrant = quadrant as
                      | 'topLeft'
                      | 'topRight'
                      | 'bottomLeft'
                      | 'bottomRight';
                  }
                }
              }
            } else if (quadrantsWithNodes.length === 1) {
              dominantQuadrant = quadrantsWithNodes[0][0] as
                | 'topLeft'
                | 'topRight'
                | 'bottomLeft'
                | 'bottomRight';
            } else {
              let candidates: { quadrant: string; count: number }[] = [];

              for (const [quadrant, count] of Object.entries(quadrantCounts)) {
                if (count > maxNodeCount && quadrant !== endNodeQuadrantForStartNode) {
                  maxNodeCount = count;
                  candidates = [{ quadrant, count }];
                } else if (
                  count === maxNodeCount &&
                  count > 0 &&
                  quadrant !== endNodeQuadrantForStartNode
                ) {
                  candidates.push({ quadrant, count });
                }
              }
              if (candidates.length > 1 && endNodeQuadrantForStartNode) {
                const endNodeSide = endNodeQuadrantForStartNode.endsWith('Left') ? 'Left' : 'Right';

                const sameSideCandidates = candidates.filter((c) =>
                  c.quadrant.endsWith(endNodeSide)
                );

                if (sameSideCandidates.length > 0) {
                  const endNodeVertical = endNodeQuadrantForStartNode.startsWith('top')
                    ? 'top'
                    : 'bottom';
                  const oppositeVertical = endNodeVertical === 'top' ? 'bottom' : 'top';

                  const preferredCandidate = sameSideCandidates.find((c) =>
                    c.quadrant.startsWith(oppositeVertical)
                  );

                  dominantQuadrant = (preferredCandidate?.quadrant ||
                    sameSideCandidates[0].quadrant) as
                    | 'topLeft'
                    | 'topRight'
                    | 'bottomLeft'
                    | 'bottomRight';
                } else {
                  dominantQuadrant = candidates[0].quadrant as
                    | 'topLeft'
                    | 'topRight'
                    | 'bottomLeft'
                    | 'bottomRight';
                }
              } else if (candidates.length > 0) {
                dominantQuadrant = candidates[0].quadrant as
                  | 'topLeft'
                  | 'topRight'
                  | 'bottomLeft'
                  | 'bottomRight';
              }

              if (maxNodeCount === 0) {
                for (const [quadrant, count] of Object.entries(quadrantCounts)) {
                  if (count > maxNodeCount) {
                    maxNodeCount = count;
                    dominantQuadrant = quadrant as
                      | 'topLeft'
                      | 'topRight'
                      | 'bottomLeft'
                      | 'bottomRight';
                  }
                }
              }
            }
          }

          let preferredStartSides: Side[] = [];

          if (dominantQuadrant && endNodeQuadrantForStartNode) {
            const dominantSide = dominantQuadrant.endsWith('Left') ? 'Left' : 'Right';
            const endNodeSide = endNodeQuadrantForStartNode.endsWith('Left') ? 'Left' : 'Right';

            if (dominantSide === endNodeSide) {
              preferredStartSides = ['top', 'bottom'];
            } else {
              preferredStartSides = ['left', 'right'];
            }
          }

          if (preferredStartSides.length > 0) {
            const firstOptionMatches = preferredStartSides.includes(topSides[0].startSide);
            const secondOptionMatches = preferredStartSides.includes(topSides[1].startSide);

            if (firstOptionMatches && secondOptionMatches) {
              selectedSides = topSides[0];
              usedResult = result1;
            } else if (firstOptionMatches) {
              selectedSides = topSides[0];
              usedResult = result1;
            } else if (secondOptionMatches) {
              selectedSides = topSides[1];
              usedResult = result2;
            } else {
              selectedSides = topSides[0];
              usedResult = result1;
            }
          } else {
            selectedSides = topSides[0];
            usedResult = result1;
          }
        } else {
          const t1 = result1.type ?? 'astar';
          const t2 = result2.type ?? 'astar';
          selectedSides = priority[t1] > priority[t2] ? topSides[0] : topSides[1];
          usedResult = priority[t1] > priority[t2] ? result1 : result2;
        }
      } else if (result1.valid) {
        selectedSides = topSides[0];
        usedResult = result1;
      } else if (result2.valid) {
        selectedSides = topSides[1];
        usedResult = result2;
      } else {
        selectedSides = topSides[0];
        usedResult = result1;
      }
      edge.startSide = selectedSides.startSide;
      edge.endSide = selectedSides.endSide;

      currentNodesAligned = nodesAligned(
        startNode,
        endNode,
        selectedSides.startSide,
        selectedSides.endSide,
        allNodes
      );
      if (startNode.isLabelNode === true) {
        const existingFirstEdge = labelNodeFirstEdgeSide.get(startNode.id);
        if (existingFirstEdge) {
          const oppositeStartSide = getOppositeSide(existingFirstEdge.side) as Side;
          const edgesOnOppositeSide = sideSlots.get(startNode.id)?.get(oppositeStartSide) ?? [];
          const noOtherEdgeOnOppositeSide = edgesOnOppositeSide.length === 0;
          if (
            existingFirstEdge &&
            ((usedResult?.type !== 'straight' && !currentNodesAligned.aligned) ||
              noOtherEdgeOnOppositeSide)
          ) {
            const currentStartSide = getOppositeSide(existingFirstEdge.side) as Side;

            const unusedTopSideIndex = selectedSides === topSides[0] ? 1 : 0;
            const unusedTopSide = topSides[unusedTopSideIndex];

            if (unusedTopSide && unusedTopSide.startSide === currentStartSide) {
              edge.startSide = unusedTopSide.startSide;
              edge.endSide = unusedTopSide.endSide;
            } else {
              const currentSideResult = validateSideSelection(
                startNode,
                endNode,
                currentStartSide,
                edge.endSide,
                grid,
                data4Layout
              );

              if (currentSideResult.valid) {
                edge.startSide = currentStartSide;
              }
            }
          }
        } else {
          labelNodeFirstEdgeSide.set(startNode.id, {
            side: edge.startSide as Side,
            role: 'start',
          });
        }
      }

      if (endNode.isLabelNode === true) {
        const existingFirstEdge = labelNodeFirstEdgeSide.get(endNode.id);
        if (existingFirstEdge && usedResult?.type !== 'straight' && !currentNodesAligned.aligned) {
          const currentEndSide = getOppositeSide(existingFirstEdge.side) as Side;
          const currentSideResult = validateSideSelection(
            startNode,
            endNode,
            edge.startSide,
            currentEndSide,
            grid,
            data4Layout
          );
          if (priority[currentSideResult.type ?? 'astar'] >= priority[usedResult.type ?? 'astar']) {
            edge.endSide = currentEndSide;
            edge.endSide = getOppositeSide(existingFirstEdge.side) as Side;
          }
        } else {
          labelNodeFirstEdgeSide.set(endNode.id, {
            side: edge.endSide as Side,
            role: 'end',
          });
        }
      }
    }

    connectionSides.set(edge.id, {
      startSide: edge.startSide ?? 'right',
      endSide: edge.endSide ?? 'left',
      canDrawStraight: currentNodesAligned.aligned,
      nodeWhichCovered: currentNodesAligned.nodeWhichCovered,
      overlapCenter: currentNodesAligned.overlapCenter,
      coveragePercent: currentNodesAligned.coveragePercent,
    });

    updateSideUsage(sideUsage, edge.start ?? '', edge.startSide);
    updateSideUsage(sideUsage, edge.end ?? '', edge.endSide);

    const startNodeSlots = sideSlots.get(edge.start ?? '');
    if (startNodeSlots && edge.startSide) {
      const sideEdges = startNodeSlots.get(edge.startSide) ?? [];
      sideEdges.push(edge.id);
      startNodeSlots.set(edge.startSide, sideEdges);
    }

    const endNodeSlots = sideSlots.get(edge.end ?? '');
    if (endNodeSlots && edge.endSide) {
      const sideEdges = endNodeSlots.get(edge.endSide) ?? [];
      sideEdges.push(edge.id);
      endNodeSlots.set(edge.endSide, sideEdges);
    }
  }
}

export default function edgeRouting(data4Layout: LayoutData): LayoutData {
  sortEdgesByDistance(data4Layout);

  const nodeMap = new Map<string, Node>();
  for (const node of data4Layout.nodes) {
    nodeMap.set(node.id, node);
  }

  const sideUsage = initializeSideUsage(data4Layout.nodes);
  const sideSlots = initializeSideSlots(data4Layout.nodes);
  const connectionSides = new Map<
    string,
    {
      startSide: string;
      endSide: string;
      canDrawStraight: boolean;
      nodeWhichCovered: Node | null;
      overlapCenter: { x: number; y: number } | null;
      coveragePercent: number;
    }
  >();

  assignSidesToEdges(data4Layout, nodeMap, sideUsage, sideSlots, connectionSides);

  calculateEdgePoints(data4Layout, nodeMap, sideSlots, connectionSides);

  resolveEdgeOverlaps(data4Layout.edges);

  return data4Layout;
}

function getOppositeSide(side: string): string {
  switch (side) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    default:
      return '';
  }
}

/**
 * Check if two nodes are aligned horizontally or vertically based on their connection sides.
 * For horizontal alignment (right/left sides): checks if nodes are vertically aligned (Y ranges overlap \>50%).
 * For vertical alignment (top/bottom sides): checks if nodes are horizontally aligned (X ranges overlap \>50%).
 * Also checks that no other nodes (blockers) are positioned between the two nodes in the relevant dimension.
 *
 * @param node1 - First node
 * @param node2 - Second node
 * @param startSide - Side of node1 where edge starts
 * @param endSide - Side of node2 where edge ends
 * @param obstacles - Array of all nodes to check for blockers (excluding node1 and node2)
 * @returns True if nodes are aligned (\>50% overlap in relevant dimension) and no blockers exist, false otherwise
 */
export function nodesAligned(
  node1: Node,
  node2: Node,
  startSide: Side,
  endSide: Side,
  obstacles: Node[] = []
): {
  aligned: boolean;
  nodeWhichCovered: Node | null;
  overlapCenter: { x: number; y: number } | null;
  coveragePercent: number;
} {
  const x1 = node1.x ?? 0;
  const y1 = node1.y ?? 0;
  const width1 = node1.width ?? 50;
  const height1 = node1.height ?? 40;

  const x2 = node2.x ?? 0;
  const y2 = node2.y ?? 0;
  const width2 = node2.width ?? 50;
  const height2 = node2.height ?? 40;

  const node1Left = x1 - width1 / 2;
  const node1Right = x1 + width1 / 2;
  const node1Top = y1 - height1 / 2;
  const node1Bottom = y1 + height1 / 2;

  const node2Left = x2 - width2 / 2;
  const node2Right = x2 + width2 / 2;
  const node2Top = y2 - height2 / 2;
  const node2Bottom = y2 + height2 / 2;

  if (
    (startSide === 'right' && endSide === 'left') ||
    (startSide === 'left' && endSide === 'right')
  ) {
    const overlapTop = Math.max(node1Top, node2Top);
    const overlapBottom = Math.min(node1Bottom, node2Bottom);
    const overlapHeight = Math.max(0, overlapBottom - overlapTop);

    if (overlapHeight <= 0) {
      return { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 }; // No overlap
    }

    const node1OverlapPercent = (overlapHeight / height1) * 100;
    const node2OverlapPercent = (overlapHeight / height2) * 100;
    const maxCoveragePercent = Math.max(node1OverlapPercent, node2OverlapPercent);

    if (!(node1OverlapPercent > 40 || node2OverlapPercent > 40)) {
      return { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 }; // Not aligned enough
    }

    const nodeWhichCovered = node1OverlapPercent > node2OverlapPercent ? node1 : node2;
    const overlapCenterY = (overlapTop + overlapBottom) / 2;
    for (const obstacle of obstacles) {
      if (obstacle.id === node1.id || obstacle.id === node2.id) {
        continue;
      }

      if ((obstacle as any).isGroup) {
        continue;
      }

      const ox = obstacle.x ?? 0;
      const oy = obstacle.y ?? 0;
      const obstacleWidth = obstacle.width ?? 50;
      const obstacleHeight = obstacle.height ?? 40;
      const oLeft = ox - obstacleWidth / 2;
      const oRight = ox + obstacleWidth / 2;
      const oTop = oy - obstacleHeight / 2;
      const oBottom = oy + obstacleHeight / 2;

      const obstacleOverlapTop = Math.max(overlapTop, oTop);
      const obstacleOverlapBottom = Math.min(overlapBottom, oBottom);
      const obstacleVerticalOverlap = Math.max(0, obstacleOverlapBottom - obstacleOverlapTop);

      if (obstacleVerticalOverlap > 0) {
        const isBlocker =
          (startSide === 'right' &&
            endSide === 'left' &&
            oRight > node1Right &&
            oLeft < node2Left) ||
          (startSide === 'left' && endSide === 'right' && oRight > node2Right && oLeft < node1Left);

        if (isBlocker) {
          return {
            aligned: false,
            nodeWhichCovered: obstacle,
            overlapCenter: null,
            coveragePercent: 0,
          };
        }
      }
    }

    return {
      aligned: true,
      nodeWhichCovered: nodeWhichCovered,
      overlapCenter: { x: 0, y: overlapCenterY },
      coveragePercent: maxCoveragePercent,
    };
  }

  // Check for vertical alignment (top/bottom sides)
  // Nodes should be horizontally aligned (X ranges overlap >50%)
  if (
    (startSide === 'top' && endSide === 'bottom') ||
    (startSide === 'bottom' && endSide === 'top')
  ) {
    const overlapLeft = Math.max(node1Left, node2Left);
    const overlapRight = Math.min(node1Right, node2Right);
    const overlapWidth = Math.max(0, overlapRight - overlapLeft);

    if (overlapWidth <= 0) {
      return { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 }; // No overlap
    }

    const node1OverlapPercent = (overlapWidth / width1) * 100;
    const node2OverlapPercent = (overlapWidth / width2) * 100;
    const maxCoveragePercent = Math.max(node1OverlapPercent, node2OverlapPercent);

    if (!(node1OverlapPercent > 40 || node2OverlapPercent > 40)) {
      return { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 }; // Not aligned enough
    }
    const nodeWhichCovered = node1OverlapPercent > node2OverlapPercent ? node1 : node2;
    const overlapCenterX = (overlapLeft + overlapRight) / 2;

    for (const obstacle of obstacles) {
      if (obstacle.id === node1.id || obstacle.id === node2.id) {
        continue;
      }
      if (
        (obstacle.parentId == node1.id || obstacle.parentId == node2.id) &&
        (node1.isGroup || node2.isGroup)
      ) {
        continue;
      }
      if ((obstacle as any).isGroup) {
        continue;
      }

      const ox = obstacle.x ?? 0;
      const oy = obstacle.y ?? 0;
      const obstacleWidth = obstacle.width ?? 50;
      const obstacleHeight = obstacle.height ?? 40;
      const oLeft = ox - obstacleWidth / 2;
      const oRight = ox + obstacleWidth / 2;
      const oTop = oy - obstacleHeight / 2;
      const oBottom = oy + obstacleHeight / 2;

      const obstacleOverlapLeft = Math.max(overlapLeft, oLeft);
      const obstacleOverlapRight = Math.min(overlapRight, oRight);
      const obstacleHorizontalOverlap = Math.max(0, obstacleOverlapRight - obstacleOverlapLeft);

      if (obstacleHorizontalOverlap > 0) {
        const isBlocker =
          (startSide === 'bottom' &&
            endSide === 'top' &&
            oBottom > node1Bottom &&
            oTop < node2Top) ||
          (startSide === 'top' && endSide === 'bottom' && oBottom > node2Bottom && oTop < node1Top);

        if (isBlocker) {
          return {
            aligned: false,
            nodeWhichCovered: null,
            overlapCenter: null,
            coveragePercent: 0,
          };
        }
      }
    }

    return {
      aligned: true,
      nodeWhichCovered: nodeWhichCovered,
      overlapCenter: { x: overlapCenterX, y: 0 },
      coveragePercent: maxCoveragePercent,
    };
  }

  return { aligned: false, nodeWhichCovered: null, overlapCenter: null, coveragePercent: 0 };
}

export type Quadrant = 'upper-right' | 'upper-left' | 'lower-right' | 'lower-left';

/**
 * Calculate the geometric angle between two nodes using their closest boundary points.
 * Uses node.intersect() for accurate boundary points when available, falling back to
 * rectangular bounding box intersection.
 *
 * Returns the angle within the quadrant (0°-90°) and the quadrant name.
 * Uses standard math convention (Y-up) for quadrant determination.
 *
 * @param startNode - The start node
 * @param endNode - The end node
 * @returns Object with angle (0-90°) in degrees and radians, plus the quadrant
 */
export function getGeometricAngle(
  startNode: Node,
  endNode: Node
): { degrees: number; radians: number; quadrant: Quadrant } {
  const x1 = startNode.x ?? 0;
  const y1 = startNode.y ?? 0;
  const x2 = endNode.x ?? 0;
  const y2 = endNode.y ?? 0;

  let boundaryPoint1: { x: number; y: number } = { x: x1, y: y1 };
  let boundaryPoint2: { x: number; y: number } = { x: x2, y: y2 };

  if (startNode.intersect && endNode.intersect) {
    try {
      const intersect1 = startNode.intersect({ x: x2, y: y2 });
      const intersect2 = endNode.intersect({ x: x1, y: y1 });

      if (intersect1) {
        boundaryPoint1 = intersect1;
      }
      if (intersect2) {
        boundaryPoint2 = intersect2;
      }
    } catch (_error) {
      // Fall through to bounding box calculation
    }
  }

  if (boundaryPoint1.x === x1 && boundaryPoint1.y === y1) {
    boundaryPoint1 = getRectBoundaryPoint(startNode, x2, y2);
  }
  if (boundaryPoint2.x === x2 && boundaryPoint2.y === y2) {
    boundaryPoint2 = getRectBoundaryPoint(endNode, x1, y1);
  }

  const dx = boundaryPoint2.x - boundaryPoint1.x;
  const dy = -(boundaryPoint2.y - boundaryPoint1.y);

  const quadrant: Quadrant =
    dx >= 0 && dy >= 0
      ? 'upper-right'
      : dx < 0 && dy >= 0
        ? 'upper-left'
        : dx >= 0 && dy < 0
          ? 'lower-right'
          : 'lower-left';

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const radians = Math.atan2(absDy, absDx);
  const degrees = (radians * 180) / Math.PI;

  return { degrees, radians, quadrant };
}

/**
 * Get the point where a line from a node's center toward a target intersects the node's rectangular boundary.
 */
function getRectBoundaryPoint(
  node: Node,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const cx = node.x ?? 0;
  const cy = node.y ?? 0;
  const w = (node.width ?? 50) / 2;
  const h = (node.height ?? 40) / 2;

  const dx = targetX - cx;
  const dy = targetY - cy;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let scale: number;
  if (absDx * h > absDy * w) {
    scale = w / absDx;
  } else {
    scale = h / absDy;
  }

  return { x: cx + dx * scale, y: cy + dy * scale };
}

function getNodeQuadrants(data4Layout: LayoutData): Map<
  string,
  {
    topLeft: Set<string>;
    topRight: Set<string>;
    bottomLeft: Set<string>;
    bottomRight: Set<string>;
  }
> {
  const result = new Map<
    string,
    {
      topLeft: Set<string>;
      topRight: Set<string>;
      bottomLeft: Set<string>;
      bottomRight: Set<string>;
    }
  >();

  for (const node of data4Layout.nodes) {
    result.set(node.id, {
      topLeft: new Set<string>(),
      topRight: new Set<string>(),
      bottomLeft: new Set<string>(),
      bottomRight: new Set<string>(),
    });
  }

  const nodeMap = new Map<string, Node>();
  for (const node of data4Layout.nodes) {
    nodeMap.set(node.id, node);
  }

  const mapQuadrantToKey = (
    quadrant: Quadrant
  ): 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' => {
    switch (quadrant) {
      case 'upper-left':
        return 'topLeft';
      case 'upper-right':
        return 'topRight';
      case 'lower-left':
        return 'bottomLeft';
      case 'lower-right':
        return 'bottomRight';
      default:
        return 'topRight';
    }
  };

  for (const edge of data4Layout.edges) {
    if (!edge.start || !edge.end || edge.start === edge.end) {
      continue;
    }

    const startNode = nodeMap.get(edge.start);
    const endNode = nodeMap.get(edge.end);

    if (!startNode || !endNode) {
      continue;
    }

    const areAxisAligned = (node1: Node, node2: Node): boolean => {
      const x1 = node1.x ?? 0;
      const y1 = node1.y ?? 0;
      const x2 = node2.x ?? 0;
      const y2 = node2.y ?? 0;

      const tolerance = 1;

      return Math.abs(x1 - x2) <= tolerance || Math.abs(y1 - y2) <= tolerance;
    };

    const startQuadrants = result.get(edge.start);
    if (startQuadrants && !areAxisAligned(startNode, endNode)) {
      const angleInfo = getGeometricAngle(startNode, endNode);
      const quadrantKey = mapQuadrantToKey(angleInfo.quadrant);
      startQuadrants[quadrantKey].add(edge.end);
    }

    const endQuadrants = result.get(edge.end);
    if (endQuadrants && !areAxisAligned(endNode, startNode)) {
      const angleInfo = getGeometricAngle(endNode, startNode);
      const quadrantKey = mapQuadrantToKey(angleInfo.quadrant);
      endQuadrants[quadrantKey].add(edge.start);
    }
  }

  return result;
}
