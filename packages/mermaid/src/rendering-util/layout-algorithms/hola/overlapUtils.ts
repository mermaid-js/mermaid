import type { Edge, LayoutData, Node } from '../../types.js';
import { calculateBaseEdgeLength } from './coreLayout/graphUtils.js';

/**
 * Represents the bounding box coordinates and dimensions of a node
 */
export interface NodeBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Contains information about overlap between two nodes and suggested separation
 */
export interface OverlapInfo {
  node1: string;
  node2: string;
  overlapX: number;
  overlapY: number;
  overlapArea: number;
  separationVector: { x: number; y: number };
}

/**
 * Configuration options for the overlap removal algorithm
 */
export interface OverlapRemovalOptions {
  maxIterations: number;
  convergenceThreshold: number;
  dampingFactor: number;
  preserveStress: boolean;
}

/**
 * Calculates the bounding box of a node including its padding
 * @param node - The node to calculate bounds for
 * @returns The bounding box coordinates and dimensions
 */
export function getNodeBounds(node: Node): NodeBounds {
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  const baseWidth = node.width ?? 60;
  const baseHeight = node.height ?? 40;
  const padding = node.padding ?? 15;

  const totalWidth = baseWidth + padding * 2;
  const totalHeight = baseHeight + padding * 2;

  const halfWidth = totalWidth / 2;
  const halfHeight = totalHeight / 2;

  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - halfHeight,
    bottom: y + halfHeight,
    width: totalWidth,
    height: totalHeight,
  };
}

/**
 * Calculates the overlap between two node bounding boxes and determines separation vector
 * @param bounds1 - Bounding box of the first node
 * @param bounds2 - Bounding box of the second node
 * @returns Overlap information or null if no overlap exists
 */
export function calculateBoundingBoxOverlap(
  bounds1: NodeBounds,
  bounds2: NodeBounds
): OverlapInfo | null {
  const overlapLeft = Math.max(bounds1.left, bounds2.left);
  const overlapRight = Math.min(bounds1.right, bounds2.right);
  const overlapTop = Math.max(bounds1.top, bounds2.top);
  const overlapBottom = Math.min(bounds1.bottom, bounds2.bottom);

  const overlapX = Math.max(0, overlapRight - overlapLeft);
  const overlapY = Math.max(0, overlapBottom - overlapTop);

  if (overlapX <= 0 || overlapY <= 0) {
    return null;
  }

  const overlapArea = overlapX * overlapY;

  const centerX1 = (bounds1.left + bounds1.right) / 2;
  const centerY1 = (bounds1.top + bounds1.bottom) / 2;
  const centerX2 = (bounds2.left + bounds2.right) / 2;
  const centerY2 = (bounds2.top + bounds2.bottom) / 2;

  const deltaX = centerX2 - centerX1;
  const deltaY = centerY2 - centerY1;

  let separationX = 0;
  let separationY = 0;

  if (overlapX < overlapY) {
    separationX = overlapX + 1;
    if (deltaX < 0) {
      separationX = -separationX;
    }
  } else {
    separationY = overlapY + 1;
    if (deltaY < 0) {
      separationY = -separationY;
    }
  }

  return {
    node1: '',
    node2: '',
    overlapX,
    overlapY,
    overlapArea,
    separationVector: { x: separationX, y: separationY },
  };
}

/**
 * Represents a node with its spatial bounds for spatial indexing
 */
interface SpatialNode {
  node: Node;
  bounds: NodeBounds;
}

/**
 * Represents a spatial bucket in the grid that contains nodes and its bounds
 */
interface SpatialBucket {
  nodes: SpatialNode[];
  bounds: { left: number; right: number; top: number; bottom: number };
}

/**
 * Spatial indexing structure for efficient overlap detection using a grid-based approach
 * Optimizes O(n²) pairwise comparisons to approximately O(n) for well-distributed nodes
 */
class SpatialIndex {
  private buckets: SpatialBucket[][];
  private bucketSize: number;
  private gridWidth: number;
  private gridHeight: number;
  private minX: number;
  private minY: number;
  private maxX: number;
  private maxY: number;

  /**
   * Creates a spatial index for the given nodes
   * @param nodes - Array of spatial nodes to index
   * @param bucketSize - Size of each grid bucket in pixels (default: 100)
   */
  constructor(nodes: SpatialNode[], bucketSize = 100) {
    this.bucketSize = bucketSize;

    this.minX = Math.min(...nodes.map((n) => n.bounds.left));
    this.minY = Math.min(...nodes.map((n) => n.bounds.top));
    this.maxX = Math.max(...nodes.map((n) => n.bounds.right));
    this.maxY = Math.max(...nodes.map((n) => n.bounds.bottom));

    const padding = 50;
    this.minX -= padding;
    this.minY -= padding;
    this.maxX += padding;
    this.maxY += padding;

    this.gridWidth = Math.ceil((this.maxX - this.minX) / bucketSize);
    this.gridHeight = Math.ceil((this.maxY - this.minY) / bucketSize);

    this.buckets = Array(this.gridHeight)
      .fill(null)
      .map(() =>
        Array(this.gridWidth)
          .fill(null)
          .map(() => ({
            nodes: [],
            bounds: { left: 0, right: 0, top: 0, bottom: 0 },
          }))
      );

    nodes.forEach((spatialNode) => this.insert(spatialNode));
  }

  /**
   * Calculates which grid buckets a node's bounds span across
   * @param bounds - Node bounds to calculate bucket indices for
   * @returns Grid indices that the bounds intersect
   */
  private getBucketIndices(bounds: NodeBounds): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } {
    const minCol = Math.max(0, Math.floor((bounds.left - this.minX) / this.bucketSize));
    const maxCol = Math.min(
      this.gridWidth - 1,
      Math.floor((bounds.right - this.minX) / this.bucketSize)
    );
    const minRow = Math.max(0, Math.floor((bounds.top - this.minY) / this.bucketSize));
    const maxRow = Math.min(
      this.gridHeight - 1,
      Math.floor((bounds.bottom - this.minY) / this.bucketSize)
    );

    return { minRow, maxRow, minCol, maxCol };
  }

  /**
   * Inserts a spatial node into all buckets it overlaps with
   * @param spatialNode - The node to insert into the spatial index
   */
  private insert(spatialNode: SpatialNode): void {
    const indices = this.getBucketIndices(spatialNode.bounds);

    for (let row = indices.minRow; row <= indices.maxRow; row++) {
      for (let col = indices.minCol; col <= indices.maxCol; col++) {
        this.buckets[row][col].nodes.push(spatialNode);
      }
    }
  }

  /**
   * Finds all nodes that could potentially overlap with the given node
   * @param node - The node to find potential overlaps for
   * @returns Array of nodes in the same spatial buckets (potential overlaps)
   */
  findPotentialOverlaps(node: SpatialNode): SpatialNode[] {
    const indices = this.getBucketIndices(node.bounds);
    const candidates = new Set<SpatialNode>();

    for (let row = indices.minRow; row <= indices.maxRow; row++) {
      for (let col = indices.minCol; col <= indices.maxCol; col++) {
        this.buckets[row][col].nodes.forEach((candidate) => {
          if (candidate.node.id !== node.node.id) {
            candidates.add(candidate);
          }
        });
      }
    }

    return [...candidates];
  }
}

/**
 * Detects overlapping nodes using either spatial indexing or brute force comparison
 * @param nodes - Array of nodes to check for overlaps
 * @param useSpatialIndex - Whether to use spatial indexing for large node sets (default: true)
 * @returns Array of overlap information for all detected overlaps
 */
export function detectOverlaps(nodes: Node[], useSpatialIndex = true): OverlapInfo[] {
  const overlaps: OverlapInfo[] = [];

  const validNodes = nodes.filter((node) => node.x !== undefined && node.y !== undefined);

  if (validNodes.length < 2) {
    return overlaps;
  }

  if (useSpatialIndex && validNodes.length > 20) {
    const spatialNodes: SpatialNode[] = validNodes.map((node) => ({
      node,
      bounds: getNodeBounds(node),
    }));

    const spatialIndex = new SpatialIndex(spatialNodes);

    const checked = new Set<string>();

    spatialNodes.forEach((spatialNode1) => {
      const candidates = spatialIndex.findPotentialOverlaps(spatialNode1);

      candidates.forEach((spatialNode2) => {
        const pairKey = [spatialNode1.node.id, spatialNode2.node.id].sort().join('-');
        if (checked.has(pairKey)) {
          return;
        }
        checked.add(pairKey);

        const overlap = calculateBoundingBoxOverlap(spatialNode1.bounds, spatialNode2.bounds);
        if (overlap) {
          overlap.node1 = spatialNode1.node.id;
          overlap.node2 = spatialNode2.node.id;
          overlaps.push(overlap);
        }
      });
    });
  } else {
    for (let i = 0; i < validNodes.length; i++) {
      for (let j = i + 1; j < validNodes.length; j++) {
        const node1 = validNodes[i];
        const node2 = validNodes[j];

        const bounds1 = getNodeBounds(node1);
        const bounds2 = getNodeBounds(node2);

        const overlap = calculateBoundingBoxOverlap(bounds1, bounds2);
        if (overlap) {
          overlap.node1 = node1.id;
          overlap.node2 = node2.id;
          overlaps.push(overlap);
        }
      }
    }
  }

  return overlaps;
}

/**
 * Calculates the layout stress based on edge length deviation from ideal lengths
 * Used to preserve layout quality during overlap removal
 * @param nodes - Array of nodes with positions
 * @param edges - Array of edges connecting nodes
 * @returns Total stress value (lower is better)
 */
function calculateStress(nodes: Node[], edges?: { start: string; end: string }[] | Edge[]): number {
  if (!edges || edges.length === 0) {
    return 0;
  }

  let totalStress = 0;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  edges.forEach((edge) => {
    if (!edge.start || !edge.end) {
      return;
    }
    const node1 = nodeMap.get(edge.start);
    const node2 = nodeMap.get(edge.end);

    if (
      node1 &&
      node2 &&
      node1.x !== undefined &&
      node1.y !== undefined &&
      node2.x !== undefined &&
      node2.y !== undefined
    ) {
      const dx = node1.x - node2.x;
      const dy = node1.y - node2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const idealLength = calculateBaseEdgeLength(nodes, edges); // Standard edge length for HOLA
      const stress = (distance - idealLength) * (distance - idealLength);
      totalStress += stress;
    }
  });

  return totalStress;
}

/**
 * Removes overlaps between nodes while preserving layout structure and alignment
 * Uses an iterative force-based approach with alignment preservation
 * @param nodes - Array of nodes to process (positions will be modified)
 * @param options - Configuration options for the overlap removal algorithm
 * @param edges - Optional edges for stress calculation
 * @param coreWithCoordinates - Optional core layout data for preserving core node positions
 */
export function removeOverlaps(
  nodes: Node[],
  options: OverlapRemovalOptions = {
    maxIterations: 50,
    convergenceThreshold: 0.1,
    dampingFactor: 0.8,
    preserveStress: true,
  },
  edges?: { start: string; end: string }[] | Edge[],
  coreWithCoordinates?: LayoutData
): void {
  let iteration = 0;
  let hasOverlaps = true;
  let totalDisplacement = 0;

  const initialStress = options.preserveStress ? calculateStress(nodes, edges) : 0;
  let previousStress = initialStress;

  const originalPositions = new Map(nodes.map((node) => [node.id, { x: node.x!, y: node.y! }]));

  const MAX_DISPLACEMENT = 400;

  const horizontalAlignmentGroups = new Map<string, Set<string>>();
  const nodeToHorizontalGroup = new Map<string, string>();
  const verticalAlignmentGroups = new Map<string, Set<string>>();
  const nodeToVerticalGroup = new Map<string, string>();

  const potentialHorizontalGroups = new Map<number, Node[]>();
  nodes.forEach((node) => {
    if (node.y !== undefined) {
      if (!potentialHorizontalGroups.has(node.y)) {
        potentialHorizontalGroups.set(node.y, []);
      }
      potentialHorizontalGroups.get(node.y)!.push(node);
    }
  });

  potentialHorizontalGroups.forEach((groupNodes, yCoord) => {
    if (groupNodes.length >= 2) {
      const xValues = groupNodes.map((n) => n.x!);
      const uniqueX = new Set(xValues);

      if (uniqueX.size !== xValues.length) {
        return;
      }

      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const xSpread = xMax - xMin;

      const avgWidth = groupNodes.reduce((sum, n) => sum + (n.width ?? 60), 0) / groupNodes.length;

      if (xSpread > avgWidth * 0.5) {
        const yKey = yCoord.toFixed(6);
        horizontalAlignmentGroups.set(yKey, new Set(groupNodes.map((n) => n.id)));
        groupNodes.forEach((node) => {
          nodeToHorizontalGroup.set(node.id, yKey);
        });
      }
    }
  });

  const potentialVerticalGroups = new Map<number, Node[]>();
  nodes.forEach((node) => {
    if (node.x !== undefined) {
      if (!potentialVerticalGroups.has(node.x)) {
        potentialVerticalGroups.set(node.x, []);
      }
      potentialVerticalGroups.get(node.x)!.push(node);
    }
  });

  potentialVerticalGroups.forEach((groupNodes, xCoord) => {
    if (groupNodes.length >= 2) {
      const yValues = groupNodes.map((n) => n.y!);
      const uniqueY = new Set(yValues);

      if (uniqueY.size !== yValues.length) {
        return;
      }

      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      const ySpread = yMax - yMin;

      const avgHeight =
        groupNodes.reduce((sum, n) => sum + (n.height ?? 40), 0) / groupNodes.length;

      if (ySpread > avgHeight * 0.5) {
        const xKey = xCoord.toFixed(6);
        verticalAlignmentGroups.set(xKey, new Set(groupNodes.map((n) => n.id)));
        groupNodes.forEach((node) => {
          nodeToVerticalGroup.set(node.id, xKey);
        });
      }
    }
  });

  while (hasOverlaps && iteration < options.maxIterations) {
    const overlaps = detectOverlaps(nodes);
    hasOverlaps = overlaps.length > 0;

    if (!hasOverlaps) {
      break;
    }

    const beforePositions = new Map(nodes.map((node) => [node.id, { x: node.x!, y: node.y! }]));

    totalDisplacement = 0;

    const forces = new Map<string, { x: number; y: number }>();

    nodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    overlaps.forEach((overlap) => {
      const isNode1Core = coreWithCoordinates?.nodes.find((n) => n.id === overlap.node1);
      const isNode2Core = coreWithCoordinates?.nodes.find((n) => n.id === overlap.node2);

      const force1 = forces.get(overlap.node1)!;
      const force2 = forces.get(overlap.node2)!;

      let dampedSeparationX = overlap.separationVector.x * options.dampingFactor;
      let dampedSeparationY = overlap.separationVector.y * options.dampingFactor;

      const hGroup1 = nodeToHorizontalGroup.get(overlap.node1);
      const hGroup2 = nodeToHorizontalGroup.get(overlap.node2);
      if (hGroup1 && hGroup2 && hGroup1 === hGroup2) {
        dampedSeparationY = 0;

        if (dampedSeparationX === 0) {
          const node1 = nodes.find((n) => n.id === overlap.node1);
          const node2 = nodes.find((n) => n.id === overlap.node2);
          if (node1 && node2 && node1.x !== undefined && node2.x !== undefined) {
            const direction = node2.x > node1.x ? 1 : -1;
            dampedSeparationX = (overlap.overlapX + 1) * options.dampingFactor * direction;
          }
        }

        dampedSeparationX = dampedSeparationX * 2.5;
      }

      const vGroup1 = nodeToVerticalGroup.get(overlap.node1);
      const vGroup2 = nodeToVerticalGroup.get(overlap.node2);
      if (vGroup1 && vGroup2 && vGroup1 === vGroup2) {
        dampedSeparationX = 0;

        if (dampedSeparationY === 0) {
          const node1 = nodes.find((n) => n.id === overlap.node1);
          const node2 = nodes.find((n) => n.id === overlap.node2);
          if (node1 && node2 && node1.y !== undefined && node2.y !== undefined) {
            const direction = node2.y > node1.y ? 1 : -1;
            dampedSeparationY = (overlap.overlapY + 1) * options.dampingFactor * direction;
          }
        }

        dampedSeparationY = dampedSeparationY * 2.5;
      }

      if (isNode1Core && !isNode2Core) {
        force2.x += dampedSeparationX;
        force2.y += dampedSeparationY;
      } else if (!isNode1Core && isNode2Core) {
        force1.x -= dampedSeparationX;
        force1.y -= dampedSeparationY;
      } else {
        force1.x -= dampedSeparationX / 2;
        force1.y -= dampedSeparationY / 2;
        force2.x += dampedSeparationX / 2;
        force2.y += dampedSeparationY / 2;
      }
    });

    nodes.forEach((node) => {
      if (node.x !== undefined && node.y !== undefined) {
        const force = forces.get(node.id)!;

        node.x += force.x;
        node.y += force.y;

        totalDisplacement += Math.sqrt(force.x * force.x + force.y * force.y);
      }
    });

    horizontalAlignmentGroups.forEach((nodeIds) => {
      if (nodeIds.size > 1) {
        const groupNodes = [...nodeIds]
          .map((id) => nodes.find((n) => n.id === id))
          .filter((n): n is Node => n?.y !== undefined);

        if (groupNodes.length > 1) {
          const avgY = groupNodes.reduce((sum, n) => sum + n.y!, 0) / groupNodes.length;

          groupNodes.forEach((node) => {
            node.y = avgY;
          });
        }
      }
    });

    verticalAlignmentGroups.forEach((nodeIds) => {
      if (nodeIds.size > 1) {
        const groupNodes = [...nodeIds]
          .map((id) => nodes.find((n) => n.id === id))
          .filter((n): n is Node => n?.x !== undefined);

        if (groupNodes.length > 1) {
          const avgX = groupNodes.reduce((sum, n) => sum + n.x!, 0) / groupNodes.length;

          groupNodes.forEach((node) => {
            node.x = avgX;
          });
        }
      }
    });

    nodes.forEach((node) => {
      if (node.x !== undefined && node.y !== undefined) {
        const original = originalPositions.get(node.id);
        if (original) {
          const dx = node.x - original.x;
          const dy = node.y - original.y;
          const displacement = Math.sqrt(dx * dx + dy * dy);

          if (displacement > MAX_DISPLACEMENT) {
            const scale = MAX_DISPLACEMENT / displacement;
            node.x = original.x + dx * scale;
            node.y = original.y + dy * scale;
          }
        }
      }
    });

    if (options.preserveStress && edges) {
      const currentStress = calculateStress(nodes, edges);
      const stressIncrease = currentStress - previousStress;
      const stressIncreaseRatio = stressIncrease / initialStress;

      if (stressIncreaseRatio > 0.2) {
        beforePositions.forEach((pos, nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (node) {
            node.x = pos.x;
            node.y = pos.y;
          }
        });

        const reducedDamping = options.dampingFactor * 0.5;
        nodes.forEach((node) => {
          if (node.x !== undefined && node.y !== undefined) {
            const force = forces.get(node.id)!;
            node.x += force.x * reducedDamping;
            node.y += force.y * reducedDamping;
          }
        });
      }

      previousStress = calculateStress(nodes, edges);
    }

    if (totalDisplacement < options.convergenceThreshold) {
      break;
    }

    iteration++;
  }

  if (options.preserveStress && edges) {
    const finalStress = calculateStress(nodes, edges);
    const _stressChange = ((finalStress - initialStress) / initialStress) * 100;
  }

  const _finalOverlaps = detectOverlaps(nodes);
}

/**
 * Represents the bounds and dimensions of a group/subgraph
 */
interface GroupBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Information about overlap between two groups including directional bias
 */
interface GroupOverlapInfo {
  hasOverlap: boolean;
  overlapX: number;
  overlapY: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

/**
 * Represents the hierarchical structure of groups organized by depth levels
 */
interface GroupHierarchy {
  groupsByDepth: Map<number, Node[]>;
  maxDepth: number;
  depthMap: Map<string, number>;
}

/**
 * Checks if a point is within a threshold distance of a bounds rectangle.
 * Points inside the bounds are always included (distance = 0).
 * Points outside are only included if within the threshold distance.
 * @param point - The point to check with x and y coordinates
 * @param bounds - The bounding rectangle with minX, minY, maxX, maxY properties
 * @param threshold - Maximum distance from bounds to consider (default: 50)
 * @returns True if point is within threshold distance of bounds
 */
function isPointWithinThreshold(
  point: { x: number; y: number },
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  threshold = 50
): boolean {
  if (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  ) {
    return true;
  }

  let dx = 0;
  let dy = 0;

  if (point.x < bounds.minX) {
    dx = bounds.minX - point.x;
  } else if (point.x > bounds.maxX) {
    dx = point.x - bounds.maxX;
  }

  if (point.y < bounds.minY) {
    dy = bounds.minY - point.y;
  } else if (point.y > bounds.maxY) {
    dy = point.y - bounds.maxY;
  }

  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= threshold;
}

/**
 * Calculates bounds for a group including all children, edge labels, and edge routing points
 * @param group - The group node to calculate bounds for
 * @param data4Layout - The complete layout data containing all nodes and edges
 * @param nodeMap - Map of node IDs to node objects for quick lookup
 * @param padding - Additional padding to add around the calculated bounds
 * @returns The calculated group bounds with position and dimensions
 */
function calculateGroupBoundsWithEdges(
  group: Node,
  data4Layout: LayoutData,
  nodeMap: Map<string, Node>,
  padding: number
): GroupBounds {
  const children = data4Layout.nodes.filter((n) => n.parentId === group.id);

  if (children.length === 0) {
    const width = group.width ?? padding * 2;
    const height = group.height ?? padding * 2;
    return {
      minX: group.x! - width / 2,
      minY: group.y! - height / 2,
      maxX: group.x! + width / 2,
      maxY: group.y! + height / 2,
      width,
      height,
      centerX: group.x!,
      centerY: group.y!,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  children.forEach((child) => {
    const width = child.width ?? (child.isGroup ? 100 : 30);
    const height = child.height ?? (child.isGroup ? 100 : 30);

    if (typeof child.x === 'number' && typeof child.y === 'number') {
      minX = Math.min(minX, child.x - width / 2);
      minY = Math.min(minY, child.y - height / 2);
      maxX = Math.max(maxX, child.x + width / 2);
      maxY = Math.max(maxY, child.y + height / 2);
    }
  });

  data4Layout.nodes.forEach((node) => {
    if (node.isEdgeLabel && node.edgeStart && node.edgeEnd) {
      const startNode = nodeMap.get(node.edgeStart);
      const endNode = nodeMap.get(node.edgeEnd);

      if (startNode?.parentId === group.id && endNode?.parentId === group.id) {
        const width = node.width ?? 40;
        const height = node.height ?? 20;

        if (typeof node.x === 'number' && typeof node.y === 'number') {
          minX = Math.min(minX, node.x - width / 2);
          minY = Math.min(minY, node.y - height / 2);
          maxX = Math.max(maxX, node.x + width / 2);
          maxY = Math.max(maxY, node.y + height / 2);
        }
      }
    }
  });

  const childBoundsBeforeEdges = {
    minX,
    minY,
    maxX,
    maxY,
  };

  data4Layout.edges.forEach((edge) => {
    if (edge.points && edge.start && edge.end) {
      const startNode = nodeMap.get(edge.start);
      const endNode = nodeMap.get(edge.end);

      if (startNode?.parentId === group.id && endNode?.parentId === group.id) {
        edge.points.forEach((point) => {
          if (isPointWithinThreshold(point, childBoundsBeforeEdges, 50)) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          }
        });
      }
    }
  });

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY,
  };
}

/**
 * Builds a hierarchy of groups organized by depth level (0 = root, 1 = children, etc.)
 * @param data4Layout - The layout data containing group nodes to organize
 * @returns Hierarchy object with groups organized by depth and depth mapping
 */
function buildGroupHierarchyByDepth(data4Layout: LayoutData): GroupHierarchy {
  const groupNodes = data4Layout.nodes.filter((n) => n.isGroup);
  const depthMap = new Map<string, number>();
  const groupsByDepth = new Map<number, Node[]>();

  function calculateDepth(groupId: string, visited = new Set<string>()): number {
    if (visited.has(groupId)) {
      return 0;
    }
    if (depthMap.has(groupId)) {
      return depthMap.get(groupId)!;
    }

    visited.add(groupId);
    const group = groupNodes.find((g) => g.id === groupId);
    if (!group) {
      return 0;
    }

    if (!group.parentId) {
      depthMap.set(groupId, 0);
      return 0;
    }

    const parentDepth = calculateDepth(group.parentId, visited);
    const depth = parentDepth + 1;
    depthMap.set(groupId, depth);
    return depth;
  }

  groupNodes.forEach((group) => {
    calculateDepth(group.id);
  });

  let maxDepth = 0;
  groupNodes.forEach((group) => {
    const depth = depthMap.get(group.id) ?? 0;
    maxDepth = Math.max(maxDepth, depth);

    if (!groupsByDepth.has(depth)) {
      groupsByDepth.set(depth, []);
    }
    groupsByDepth.get(depth)!.push(group);
  });

  return { groupsByDepth, maxDepth, depthMap };
}

/**
 * Detects if two groups overlap and determines the alignment direction
 * @param bounds1 - Bounding box of the first group
 * @param bounds2 - Bounding box of the second group
 * @param alignmentThreshold - Distance threshold for determining alignment direction (default: 50)
 * @returns Overlap information including overlap amount and preferred separation direction
 */
function detectOverlapWithDirection(
  bounds1: GroupBounds,
  bounds2: GroupBounds,
  alignmentThreshold = 50
): GroupOverlapInfo {
  const overlapX = Math.max(
    0,
    Math.min(bounds1.maxX, bounds2.maxX) - Math.max(bounds1.minX, bounds2.minX)
  );
  const overlapY = Math.max(
    0,
    Math.min(bounds1.maxY, bounds2.maxY) - Math.max(bounds1.minY, bounds2.minY)
  );

  const hasOverlap = overlapX > 0 && overlapY > 0;

  if (!hasOverlap) {
    return { hasOverlap: false, overlapX: 0, overlapY: 0, direction: 'diagonal' };
  }

  const dx = Math.abs(bounds1.centerX - bounds2.centerX);
  const dy = Math.abs(bounds1.centerY - bounds2.centerY);

  let direction: 'horizontal' | 'vertical' | 'diagonal';

  if (dy < alignmentThreshold) {
    direction = 'horizontal';
  } else if (dx < alignmentThreshold) {
    direction = 'vertical';
  } else {
    direction = 'diagonal';
  }

  return { hasOverlap, overlapX, overlapY, direction };
}

/**
 * Moves a group and all its descendants by the specified offset
 * @param group - The group node to move
 * @param deltaX - Horizontal offset to apply
 * @param deltaY - Vertical offset to apply
 * @param data4Layout - The layout data containing all nodes (for finding descendants)
 */
function moveGroupWithChildren(
  group: Node,
  deltaX: number,
  deltaY: number,
  data4Layout: LayoutData
): void {
  group.x = (group.x ?? 0) + deltaX;
  group.y = (group.y ?? 0) + deltaY;

  function moveDescendants(parentId: string) {
    data4Layout.nodes.forEach((node) => {
      if (node.parentId === parentId) {
        node.x = (node.x ?? 0) + deltaX;
        node.y = (node.y ?? 0) + deltaY;

        if (node.isGroup) {
          moveDescendants(node.id);
        }
      }
    });
  }

  moveDescendants(group.id);
}

/**
 * Resolves a single overlap between two groups with alignment maintenance
 * @param group1 - The first overlapping group
 * @param group2 - The second overlapping group
 * @param bounds1 - Bounding box of the first group
 * @param bounds2 - Bounding box of the second group
 * @param overlap - Information about the overlap including direction
 * @param minSpacing - Minimum required spacing between groups after resolution
 * @param data4Layout - The complete layout data for moving descendants
 * @param _nodeMap - Map of node IDs to nodes (currently unused, prefixed with _)
 */
function resolveSingleOverlapWithAlignment(
  group1: Node,
  group2: Node,
  bounds1: GroupBounds,
  bounds2: GroupBounds,
  overlap: GroupOverlapInfo,
  minSpacing: number,
  data4Layout: LayoutData,
  _nodeMap: Map<string, Node>
): void {
  const area1 = bounds1.width * bounds1.height;
  const area2 = bounds2.width * bounds2.height;

  const connections1 = data4Layout.edges.filter(
    (e) => e.start === group1.id || e.end === group1.id
  ).length;
  const connections2 = data4Layout.edges.filter(
    (e) => e.start === group2.id || e.end === group2.id
  ).length;

  let movingGroup: Node;
  let _stationaryGroup: Node;
  let movingBounds: GroupBounds;
  let stationaryBounds: GroupBounds;

  if (area1 < area2 || (area1 === area2 && connections1 <= connections2)) {
    movingGroup = group1;
    _stationaryGroup = group2;
    movingBounds = bounds1;
    stationaryBounds = bounds2;
  } else {
    movingGroup = group2;
    _stationaryGroup = group1;
    movingBounds = bounds2;
    stationaryBounds = bounds1;
  }

  let deltaX = 0;
  let deltaY = 0;

  if (overlap.direction === 'vertical') {
    deltaX = stationaryBounds.centerX - movingBounds.centerX;

    const separationNeeded = overlap.overlapY + minSpacing;
    if (movingBounds.centerY < stationaryBounds.centerY) {
      deltaY = -separationNeeded;
    } else {
      deltaY = separationNeeded;
    }
  } else if (overlap.direction === 'horizontal') {
    deltaY = stationaryBounds.centerY - movingBounds.centerY;

    const separationNeeded = overlap.overlapX + minSpacing;
    if (movingBounds.centerX < stationaryBounds.centerX) {
      deltaX = -separationNeeded;
    } else {
      deltaX = separationNeeded;
    }
  } else {
    const separationX = overlap.overlapX + minSpacing;
    const separationY = overlap.overlapY + minSpacing;

    if (movingBounds.centerX < stationaryBounds.centerX) {
      deltaX = -separationX;
    } else {
      deltaX = separationX;
    }

    if (movingBounds.centerY < stationaryBounds.centerY) {
      deltaY = -separationY;
    } else {
      deltaY = separationY;
    }
  }

  moveGroupWithChildren(movingGroup, deltaX, deltaY, data4Layout);
}

/**
 * Main function to resolve group overlaps with alignment maintenance
 * Processes groups hierarchically from deepest to shallowest level to maintain structure
 * @param data4Layout - The complete layout data containing all nodes, edges, and groups
 * @param padding - Padding to add around group bounds (default: 20)
 * @param nodeMap - Map of node IDs to node objects for efficient lookup
 */
export function resolveGroupOverlapsWithAlignment(
  data4Layout: LayoutData,
  padding = 20,
  nodeMap: Map<string, Node>
): void {
  const hierarchy = buildGroupHierarchyByDepth(data4Layout);
  const minSpacing = padding;
  const alignmentThreshold = 50;

  for (let depth = hierarchy.maxDepth; depth >= 0; depth--) {
    const groupsAtDepth = hierarchy.groupsByDepth.get(depth) ?? [];

    if (groupsAtDepth.length === 0) {
      continue;
    }

    // Group siblings (same parent)
    const siblingGroups = new Map<string | undefined, Node[]>();
    groupsAtDepth.forEach((group) => {
      const parentId = group.parentId;
      if (!siblingGroups.has(parentId)) {
        siblingGroups.set(parentId, []);
      }
      siblingGroups.get(parentId)!.push(group);
    });

    siblingGroups.forEach((siblings) => {
      if (siblings.length < 2) {
        return;
      }

      let iterationCount = 0;
      const maxIterations = 20;
      let hasOverlaps = true;

      while (hasOverlaps && iterationCount < maxIterations) {
        hasOverlaps = false;
        iterationCount++;

        const boundsMap = new Map<string, GroupBounds>();
        siblings.forEach((group) => {
          const bounds = calculateGroupBoundsWithEdges(group, data4Layout, nodeMap, padding);
          boundsMap.set(group.id, bounds);

          group.x = bounds.centerX;
          group.y = bounds.centerY;
          group.width = bounds.width;
          group.height = bounds.height;
        });

        for (let i = 0; i < siblings.length; i++) {
          const group1 = siblings[i];
          const bounds1 = boundsMap.get(group1.id)!;

          for (let j = i + 1; j < siblings.length; j++) {
            const group2 = siblings[j];
            const bounds2 = boundsMap.get(group2.id)!;

            const overlap = detectOverlapWithDirection(bounds1, bounds2, alignmentThreshold);

            if (overlap.hasOverlap) {
              hasOverlaps = true;

              resolveSingleOverlapWithAlignment(
                group1,
                group2,
                bounds1,
                bounds2,
                overlap,
                minSpacing,
                data4Layout,
                nodeMap
              );

              const newBounds1 = calculateGroupBoundsWithEdges(
                group1,
                data4Layout,
                nodeMap,
                padding
              );
              const newBounds2 = calculateGroupBoundsWithEdges(
                group2,
                data4Layout,
                nodeMap,
                padding
              );
              boundsMap.set(group1.id, newBounds1);
              boundsMap.set(group2.id, newBounds2);

              group1.x = newBounds1.centerX;
              group1.y = newBounds1.centerY;
              group1.width = newBounds1.width;
              group1.height = newBounds1.height;

              group2.x = newBounds2.centerX;
              group2.y = newBounds2.centerY;
              group2.width = newBounds2.width;
              group2.height = newBounds2.height;
            }
          }
        }
      }

      if (iterationCount >= maxIterations) {
        //
      }
    });

    if (depth > 0) {
      const parentGroups = new Set<string>();
      groupsAtDepth.forEach((group) => {
        if (group.parentId) {
          parentGroups.add(group.parentId);
        }
      });

      parentGroups.forEach((parentId) => {
        const parentGroup = data4Layout.nodes.find((n) => n.id === parentId && n.isGroup);
        if (parentGroup) {
          const parentBounds = calculateGroupBoundsWithEdges(
            parentGroup,
            data4Layout,
            nodeMap,
            padding
          );
          parentGroup.x = parentBounds.centerX;
          parentGroup.y = parentBounds.centerY;
          parentGroup.width = parentBounds.width;
          parentGroup.height = parentBounds.height;
        }
      });
    }
  }
}
