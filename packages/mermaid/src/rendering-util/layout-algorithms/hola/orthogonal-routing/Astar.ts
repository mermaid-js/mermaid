import type { RoutingGrid } from './grid.js';
import type {
  AStarOptions,
  ConnectionPointCandidate,
  EdgeContext,
  EnhancedAStarNode,
  GridCell,
  PathCandidate,
  PathMetrics,
  PathSegment,
  PathValidationResult,
  RoutedEdgeInfo,
  Side,
} from './types.js';
import type { Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import type { Point } from '../../../../types.js';
import {
  ASTAR_DEFAULT_BEND_PENALTY,
  ASTAR_DEFAULT_CROSSING_PENALTY,
  ASTAR_DEFAULT_ENDPOINT_CLEARANCE,
  ASTAR_DEFAULT_SEARCH_RADIUS,
} from '../Constants.js';

/**
 * A* pathfinding algorithm with flexible connection points.
 * Tries multiple start/end point combinations to achieve zero crossings.
 * @param sourceNode - The source node to route from
 * @param targetNode - The target node to route to
 * @param grid - The routing grid for pathfinding
 * @param edgeContext - Context information about the edge being routed
 * @param existingEdges - Array of existing routed edges to avoid
 * @param options - Configuration options for A* algorithm
 * @param excludeEdgeId - Optional edge ID to exclude from crossing calculations
 * @returns PathValidationResult indicating success/failure and path points if found
 */
export function findAStarPath(
  sourceNode: Node,
  targetNode: Node,
  grid: RoutingGrid,
  edgeContext: EdgeContext,
  existingEdges: RoutedEdgeInfo[],
  options: AStarOptions = {},
  excludeEdgeId?: string
): PathValidationResult {
  // Generate connection point pairs to try
  // Build buffer zones around existing edge endpoints to avoid reusing connection points
  const bufferDistance = options.endpointBufferDistance ?? 8;
  const bufferZones = grid.buildEndpointBufferZones(existingEdges, bufferDistance);

  const targetCenter = { x: targetNode.x ?? 0, y: targetNode.y ?? 0 };
  const sourceCenter = { x: sourceNode.x ?? 0, y: sourceNode.y ?? 0 };

  log.info(
    `[A* ${edgeContext.sourceNodeId}->${edgeContext.targetNodeId}] Node positions: ${JSON.stringify(
      {
        source: {
          x: sourceCenter.x.toFixed(1),
          y: sourceCenter.y.toFixed(1),
          w: sourceNode.width,
          h: sourceNode.height,
        },
        target: {
          x: targetCenter.x.toFixed(1),
          y: targetCenter.y.toFixed(1),
          w: targetNode.width,
          h: targetNode.height,
        },
      }
    )}`
  );

  const fineSpacing = options.connectionPointSpacing ?? 8;
  const maxPerSide = options.maxConnectionPointsPerSide ?? 5;
  const coarseSpacing =
    options.coarseConnectionPointSpacing ??
    fineSpacing * (options.coarseConnectionPointSpacingMultiplier ?? 3);
  const refineIfBendsGreaterThan = options.refineIfBendsGreaterThan ?? 1;
  const refineIfEdgeCrossingsGreaterThan = options.refineIfEdgeCrossingsGreaterThan ?? 0;

  const buildCandidates = (params: {
    spacing: number;
    sourceSides?: Side[];
    targetSides?: Side[];
  }): { source: ConnectionPointCandidate[]; target: ConnectionPointCandidate[] } => {
    const source = grid.generateConnectionPoints(
      sourceNode,
      targetCenter,
      params.spacing,
      bufferZones,
      {
        sides: params.sourceSides,
        maxPerSide,
      }
    );
    const target = grid.generateConnectionPoints(
      targetNode,
      sourceCenter,
      params.spacing,
      bufferZones,
      {
        sides: params.targetSides,
        maxPerSide,
      }
    );
    return { source, target };
  };

  const runSearch = (
    sourceCandidates: ConnectionPointCandidate[],
    targetCandidates: ConnectionPointCandidate[]
  ): PathCandidate[] => {
    const connectionPairs = generateConnectionPointPairs(
      sourceCandidates,
      targetCandidates,
      options,
      sourceNode,
      targetNode
    );

    if (connectionPairs.length === 0) {
      return [];
    }

    const candidates: PathCandidate[] = [];

    for (const pair of connectionPairs) {
      const reusePenalty = calculateEndpointReusePenalty(
        pair.start.point,
        pair.end.point,
        bufferZones,
        options.endpointReusePenalty
      );
      const connectionPriority = pair.start.priority + pair.end.priority + reusePenalty;
      const result = runAStarSearch(
        pair.start.point,
        pair.start.side,
        pair.end.point,
        pair.end.side,
        grid,
        options,
        edgeContext,
        connectionPriority,
        excludeEdgeId
      );

      if (result) {
        result.startSide = pair.start.side;
        result.endSide = pair.end.side;
        candidates.push(result);
      }
    }

    candidates.sort(comparePathCandidates);
    return candidates;
  };

  // Pass A (coarse): sample multiple points using a larger step.
  const coarse = buildCandidates({ spacing: coarseSpacing });
  let coarseResults = runSearch(coarse.source, coarse.target);

  // If coarse produced nothing, fall back to fine over all sides.
  if (coarseResults.length === 0) {
    const fineAll = buildCandidates({ spacing: fineSpacing });
    coarseResults = runSearch(fineAll.source, fineAll.target);
  }

  if (coarseResults.length === 0) {
    return {
      valid: false,
      reason: 'No valid path found with A* for any connection point combination',
    };
  }

  let bestPath = coarseResults[0];

  const shouldRefine =
    bestPath.metrics.edgeCrossings > refineIfEdgeCrossingsGreaterThan ||
    bestPath.metrics.bends > refineIfBendsGreaterThan ||
    bestPath.metrics.nodeCrossings > 0;

  if (shouldRefine) {
    const fineRestricted = buildCandidates({
      spacing: fineSpacing,
      sourceSides: [bestPath.startSide],
      targetSides: [bestPath.endSide],
    });
    const fineResults = runSearch(fineRestricted.source, fineRestricted.target);
    if (fineResults.length > 0 && comparePathCandidates(fineResults[0], bestPath) < 0) {
      bestPath = fineResults[0];
    }
  }

  log.info(
    `[A* ${edgeContext.sourceNodeId}->${edgeContext.targetNodeId}] Found ${coarseResults.length} valid paths`
  );
  log.info(
    `[A* ${edgeContext.sourceNodeId}->${edgeContext.targetNodeId}] Selected: ${bestPath.startSide}->${bestPath.endSide}`
  );
  log.info(
    `[A* ${edgeContext.sourceNodeId}->${edgeContext.targetNodeId}] Path points: ${JSON.stringify(
      bestPath.points.map((p, i) => ({
        index: i,
        x: p.x.toFixed(1),
        y: p.y.toFixed(1),
      }))
    )}`
  );

  // Reject if path crosses nodes
  if (bestPath.metrics.nodeCrossings > 0) {
    return {
      valid: false,
      reason: 'All paths would cross node bodies',
    };
  }

  return {
    valid: true,
    points: bestPath.points,
    type: 'astar',
  };
}

/**
 * Generate all possible connection point pairs between source and target nodes.
 * Filters out invalid combinations and sorts by geometric optimality.
 * @param sourceCandidates - Array of connection point candidates on the source node
 * @param targetCandidates - Array of connection point candidates on the target node
 * @param options - A* algorithm options including max combinations limit
 * @param sourceNode - Source node for position-based filtering
 * @param targetNode - Target node for position-based filtering
 * @returns Array of valid connection point pairs sorted by priority
 */
function generateConnectionPointPairs(
  sourceCandidates: ConnectionPointCandidate[],
  targetCandidates: ConnectionPointCandidate[],
  options: AStarOptions,
  sourceNode: Node,
  targetNode: Node
): { start: ConnectionPointCandidate; end: ConnectionPointCandidate }[] {
  const pairs: { start: ConnectionPointCandidate; end: ConnectionPointCandidate }[] = [];

  for (const sourceCandidate of sourceCandidates) {
    for (const targetCandidate of targetCandidates) {
      // Skip same-side connections (they usually result in poor paths)
      // if (sourceCandidate.side === targetCandidate.side) {
      //   continue;
      // }
      if (
        sourceNode.y == targetNode.y &&
        ((sourceCandidate.side === 'left' && targetCandidate.side === 'left') ||
          (sourceCandidate.side === 'right' && targetCandidate.side === 'right'))
      ) {
        continue;
      }
      if (
        sourceNode.x == targetNode.x &&
        ((sourceCandidate.side === 'top' && targetCandidate.side === 'top') ||
          (sourceCandidate.side === 'bottom' && targetCandidate.side === 'bottom'))
      ) {
        continue;
      }
      pairs.push({
        start: sourceCandidate,
        end: targetCandidate,
      });
    }
  }

  // Sort by combined priority (geometric optimality)
  pairs.sort((a, b) => a.start.priority + a.end.priority - (b.start.priority + b.end.priority));

  // Limit to max combinations
  const maxCombinations = options.maxConnectionPointCombinations ?? 16;
  return pairs.slice(0, maxCombinations);
}

/**
 * Core A* search implementation.
 * Performs pathfinding between specific connection points using grid-based search.
 * @param startPoint - World coordinates of the start connection point
 * @param startSide - Side of the source node where connection starts
 * @param endPoint - World coordinates of the end connection point
 * @param endSide - Side of the target node where connection ends
 * @param grid - The routing grid for pathfinding
 * @param options - A* algorithm configuration options
 * @param edgeContext - Context information about the edge being routed
 * @param connectionPriority - Priority value for this connection point pair
 * @param excludeEdgeId - Optional edge ID to exclude from crossing calculations
 * @returns PathCandidate with the found path, or null if no path exists
 */
const NEIGHBOR_DIRS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
] as const;

function runAStarSearch(
  startPoint: Point,
  startSide: Side,
  endPoint: Point,
  endSide: Side,
  grid: RoutingGrid,
  options: AStarOptions,
  edgeContext: EdgeContext,
  connectionPriority: number,
  excludeEdgeId?: string
): PathCandidate | null {
  const startCell = grid.worldToGrid(startPoint);
  const endCell = grid.worldToGrid(endPoint);
  const cols = grid.getCols();

  // Find free cells near start and end points in the direction away from the nodes
  // Try with a moderate search radius first (8 cells = ~64px with 8px grid)
  // This provides space for arrow heads while avoiding over-reaching into obstacles
  const minimumClearance = options.minimumEndpointClearance ?? ASTAR_DEFAULT_ENDPOINT_CLEARANCE;
  const freeStartCells = findFreeCellsNearPoint(
    startPoint,
    startSide,
    grid,
    ASTAR_DEFAULT_SEARCH_RADIUS,
    minimumClearance,
    edgeContext
  );
  const freeEndCells = findFreeCellsNearPoint(
    endPoint,
    endSide,
    grid,
    ASTAR_DEFAULT_SEARCH_RADIUS,
    minimumClearance,
    edgeContext
  );

  // If start or end has no free neighbors, cannot route
  if (freeStartCells.length === 0 || freeEndCells.length === 0) {
    return null;
  }

  const openSet = new MinHeap<EnhancedAStarNode>(compareAStarNodes);
  const closedSet = new Map<number, EnhancedAStarNode>();
  const openBestG = new Map<number, number>();
  const openSetNodes = new Map<number, EnhancedAStarNode>();
  const cellKey = (cell: GridCell) => cell.row * cols + cell.col;
  const endCellKeys = new Set(freeEndCells.map((cell) => cellKey(cell)));

  // Initialize start nodes from all free neighbors of the start connection point
  // This allows exploring all valid initial directions
  for (const freeStartCell of freeStartCells) {
    const h = calculateHeuristic(freeStartCell, endCell);
    const startNode: EnhancedAStarNode = {
      cell: freeStartCell,
      parent: null,
      g: 1,
      h,
      f: 1 + h,
      direction: undefined,
      crossingCount: 0,
      bendCount: 0,
    };
    openSet.push(startNode);
    const startKey = cellKey(freeStartCell);
    openBestG.set(startKey, startNode.g);
    openSetNodes.set(startKey, startNode);
  }

  let iterations = 0;
  const maxIterations = options.maxSearchIterations ?? 6000;

  while (openSet.size() > 0 && iterations < maxIterations) {
    iterations++;
    const current = openSet.pop()!;
    const currentKey = cellKey(current.cell);
    const bestG = openBestG.get(currentKey);
    if (bestG !== undefined && current.g > bestG) {
      continue;
    }
    if (closedSet.has(currentKey)) {
      continue;
    }

    // Check if we reached one of the goal's free neighbors
    const isGoal = endCellKeys.has(currentKey);

    if (isGoal) {
      // Reconstruct path - add the final connection point
      const pathCells: GridCell[] = buildPathCells(current, startCell);
      pathCells.push(endCell);
      const points = simplifyPath(
        pathCells,
        grid,
        startPoint,
        endPoint,
        options.minimumEndpointClearance ?? ASTAR_DEFAULT_ENDPOINT_CLEARANCE
      );

      // Calculate metrics on the SIMPLIFIED path
      // The simplified path may have longer segments that cross edges even if the
      // individual A* cell-to-cell steps didn't detect crossings
      const metrics = calculatePathMetrics(
        points,
        grid,
        edgeContext.sourceNodeId,
        edgeContext.targetNodeId,
        connectionPriority,
        excludeEdgeId
      );

      // Use the metrics from the simplified path (which correctly detects crossings
      // on near-horizontal/vertical segments after simplification)

      return {
        points,
        startPoint,
        endPoint,
        startSide,
        endSide,
        metrics,
      };
    }

    openSetNodes.delete(currentKey);
    closedSet.set(currentKey, current);

    // Check neighbors (inline to avoid per-iteration allocations)
    const currentWorld = grid.gridToWorld(current.cell);

    for (const dir of NEIGHBOR_DIRS) {
      const neighborCell = {
        row: current.cell.row + dir.row,
        col: current.cell.col + dir.col,
      };
      if (!grid.isValidCell(neighborCell)) {
        continue;
      }
      const key = cellKey(neighborCell);

      if (closedSet.has(key)) {
        continue;
      }

      if (!grid.isCellFreeForRouting(neighborCell, edgeContext)) {
        continue;
      }

      const direction = getDirection(current.cell, neighborCell);
      const neighborWorld = grid.gridToWorld(neighborCell);
      const segment: PathSegment = {
        start: currentWorld,
        end: neighborWorld,
      };
      const crossings = grid.getSegmentCrossings(segment, excludeEdgeId);
      const movementCost = calculateMovementCost(current, neighborCell, options, crossings.length);

      const g = current.g + movementCost;
      const h = calculateHeuristic(neighborCell, endCell);
      const f = g + h;

      // Check if this segment crosses edges
      const crossingCount = current.crossingCount + crossings.length;

      // Track bends
      const isSameDirection = current.direction === direction;
      const bendCount = current.bendCount + (isSameDirection || !current.direction ? 0 : 1);

      // Check if neighbor is already in open set
      const existingNode = openSetNodes.get(key);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
          existingNode.direction = direction;
          existingNode.crossingCount = crossingCount;
          existingNode.bendCount = bendCount;

          openBestG.set(key, g);
        }
      } else {
        const existingBestG = openBestG.get(key);
        if (existingBestG !== undefined && g >= existingBestG) {
          continue;
        }

        const newNode: EnhancedAStarNode = {
          cell: neighborCell,
          parent: current,
          g,
          h,
          f,
          direction,
          crossingCount,
          bendCount,
        };

        openBestG.set(key, g);
        openSetNodes.set(key, newNode);
        openSet.push(newNode);
      }
    }
  }

  return null;
}

/**
 * Determine the direction of movement between two grid cells.
 * @param from - Source grid cell
 * @param to - Target grid cell
 * @returns 'horizontal' if moving along same row, 'vertical' if along same column, undefined otherwise
 */
function getDirection(from: GridCell, to: GridCell): 'horizontal' | 'vertical' | undefined {
  if (from.row === to.row) {
    return 'horizontal';
  }
  if (from.col === to.col) {
    return 'vertical';
  }
  return undefined;
}

/**
 * Find free cells near a connection point on a specific side of a node.
 * Enforces minimum clearance from the connection point to ensure space for arrows.
 * @param point - World coordinates of the connection point
 * @param side - Side of the node where the connection point is located
 * @param grid - The routing grid to search in
 * @param searchRadius - Maximum number of cells to search in the given direction
 * @param minimumClearance - Minimum world distance required from connection point
 * @param edgeContext - Optional edge context for routing checks
 * @returns Array of free grid cells that meet the clearance requirement
 */
function findFreeCellsNearPoint(
  point: Point,
  side: Side,
  grid: RoutingGrid,
  searchRadius: number,
  minimumClearance: number,
  edgeContext?: EdgeContext
): GridCell[] {
  const cell = grid.worldToGrid(point);
  const freeCells: GridCell[] = [];

  const searchOffsets: { row: number; col: number }[] = [];

  switch (side) {
    case 'left':
      for (let i = 1; i <= searchRadius; i++) {
        searchOffsets.push({ row: 0, col: -i });
      }
      break;
    case 'right':
      for (let i = 1; i <= searchRadius; i++) {
        searchOffsets.push({ row: 0, col: i });
      }
      break;
    case 'top':
      for (let i = 1; i <= searchRadius; i++) {
        searchOffsets.push({ row: -i, col: 0 });
      }
      break;
    case 'bottom':
      for (let i = 1; i <= searchRadius; i++) {
        searchOffsets.push({ row: i, col: 0 });
      }
      break;
  }

  // Find free cells in the search direction
  // Stop at first blocked cell to prevent paths from going through node bodies
  for (const offset of searchOffsets) {
    const neighborCell: GridCell = {
      row: cell.row + offset.row,
      col: cell.col + offset.col,
    };

    if (grid.isCellFreeForRouting(neighborCell, edgeContext)) {
      const cellWorldPos = grid.gridToWorld(neighborCell);
      const distance = Math.abs(cellWorldPos.x - point.x) + Math.abs(cellWorldPos.y - point.y);

      if (distance >= minimumClearance) {
        freeCells.push(neighborCell);
      }
    } else {
      break;
    }
  }

  return freeCells;
}

/**
 * Calculate Manhattan distance heuristic for A* pathfinding.
 * @param cell - Current grid cell position
 * @param endCell - Target grid cell position
 * @returns Manhattan distance between the two cells
 */
function calculateHeuristic(cell: GridCell, endCell: GridCell): number {
  return Math.abs(cell.row - endCell.row) + Math.abs(cell.col - endCell.col);
}

/**
 * Calculate movement cost from current cell to neighbor.
 * Includes penalties for bends and edge crossings.
 * @param current - Current A* node with position and direction history
 * @param neighborCell - Target neighbor cell to move to
 * @param grid - The routing grid for crossing detection
 * @param options - A* options containing penalty values
 * @param edgeContext - Edge context for routing validation
 * @param excludeEdgeId - Optional edge ID to exclude from crossing calculations
 * @returns Total movement cost including base cost and penalties
 */
function calculateMovementCost(
  current: EnhancedAStarNode,
  neighborCell: GridCell,
  options: AStarOptions,
  crossingCount: number
): number {
  let cost = 1;

  const direction = getDirection(current.cell, neighborCell);
  if (current.direction && direction !== current.direction) {
    cost += options.bendPenalty ?? ASTAR_DEFAULT_BEND_PENALTY;
  }

  cost += crossingCount * (options.crossingPenalty ?? ASTAR_DEFAULT_CROSSING_PENALTY);

  return cost;
}

function compareAStarNodes(a: EnhancedAStarNode, b: EnhancedAStarNode): number {
  if (a.f !== b.f) {
    return a.f - b.f;
  }
  if (a.crossingCount !== b.crossingCount) {
    return a.crossingCount - b.crossingCount;
  }
  return a.bendCount - b.bendCount;
}

class MinHeap<T> {
  private items: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  size(): number {
    return this.items.length;
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) {
      return undefined;
    }
    const root = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return root;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parentIndex]) >= 0) {
        break;
      }
      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (left < length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) {
        break;
      }
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}

/**
 * Simplify path by removing unnecessary waypoints and converting to world coordinates.
 * Enforces minimum clearance from endpoints to ensure space for arrows.
 * @param cells - Array of grid cells representing the raw path
 * @param grid - The routing grid for coordinate conversion
 * @param start - World coordinates of the start point
 * @param end - World coordinates of the end point
 * @param minimumEndpointClearance - Minimum distance to maintain from endpoints
 * @returns Simplified array of world coordinate points with only necessary bends
 */
function simplifyPath(
  cells: GridCell[],
  grid: RoutingGrid,
  start: Point,
  end: Point,
  minimumEndpointClearance: number
): Point[] {
  if (cells.length === 0) {
    return [start, end];
  }
  if (cells.length === 1) {
    return [start, end];
  }

  const points: Point[] = [start];

  // Convert all cells to world coordinates first
  const worldPoints = cells.map((cell) => grid.gridToWorld(cell));

  // Find essential bend points while preserving clearance segments
  for (let i = 1; i < cells.length - 1; i++) {
    const prev = cells[i - 1];
    const curr = cells[i];
    const next = cells[i + 1];

    const dir1 = getDirection(prev, curr);
    const dir2 = getDirection(curr, next);

    // Direction changed - this is a potential bend point
    if (dir1 !== dir2) {
      const lastPoint = points[points.length - 1];
      const currWorld = worldPoints[i];

      // Enforce strict orthogonality:
      // - If moving horizontally (dir1 === 'horizontal'), preserve y from previous point
      // - If moving vertically (dir1 === 'vertical'), preserve x from previous point
      let bendPoint: Point;
      if (dir1 === 'horizontal') {
        // Moving horizontally to this point, so preserve y from last point
        bendPoint = { x: currWorld.x, y: lastPoint.y };
      } else if (dir1 === 'vertical') {
        // Moving vertically to this point, so preserve x from last point
        bendPoint = { x: lastPoint.x, y: currWorld.y };
      } else {
        // Fallback (shouldn't happen in orthogonal routing)
        bendPoint = currWorld;
      }

      // Check if this is a clearance segment (close to start or end)
      const distanceFromStart = Math.abs(bendPoint.x - start.x) + Math.abs(bendPoint.y - start.y);
      const distanceFromEnd = Math.abs(bendPoint.x - end.x) + Math.abs(bendPoint.y - end.y);

      const isClearancePoint =
        distanceFromStart <= minimumEndpointClearance ||
        distanceFromEnd <= minimumEndpointClearance;

      // Always preserve clearance points and first/last bends
      const isFirstBend = i <= 2;
      const isLastBend = i >= cells.length - 3;

      if (isClearancePoint || isFirstBend || isLastBend) {
        points.push(bendPoint);
      } else {
        // For non-clearance intermediate points, check if removing would cause issues
        // Only keep if it's a significant direction change
        const significantBend = true;
        if (significantBend) {
          points.push(bendPoint);
        }
      }
    }
  }

  points.push(end);

  return points;
}

/**
 * Calculate comprehensive path metrics for quality assessment.
 * @param points - Array of world coordinate points representing the path
 * @param grid - The routing grid for crossing and overlap detection
 * @param sourceNodeId - ID of the source node
 * @param targetNodeId - ID of the target node
 * @param connectionPriority - Priority value for the connection point pair
 * @param excludeEdgeId - Optional edge ID to exclude from calculations
 * @returns PathMetrics object with all quality measurements
 */
function calculatePathMetrics(
  points: Point[],
  grid: RoutingGrid,
  sourceNodeId: string,
  targetNodeId: string,
  connectionPriority: number,
  excludeEdgeId?: string
): PathMetrics {
  const edgeCrossings = grid.countPathCrossings(points, excludeEdgeId);

  const nodeCrossings = grid.doesPathCrossNodes(points, sourceNodeId, targetNodeId) ? 1 : 0;

  const endpointReuses = grid.countEndpointReuses(points, excludeEdgeId);

  const segmentOverlaps = grid.countPathSegmentOverlaps(points, excludeEdgeId);

  const bends = points.length - 2;

  // for (let i = 1; i < points.length - 1; i++) {
  //   const dx1 = points[i].x - points[i - 1].x;
  //   const _dy1 = points[i].y - points[i - 1].y;
  //   const dx2 = points[i + 1].x - points[i].x;
  //   const _dy2 = points[i + 1].y - points[i].y;

  //   // Check if direction changed
  //   const dir1 = dx1 !== 0 ? 'horizontal' : 'vertical';
  //   const dir2 = dx2 !== 0 ? 'horizontal' : 'vertical';

  //   // if (dir1 !== dir2) {
  //   //   // bends++;
  //   // }
  // }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalDistance += Math.abs(dx) + Math.abs(dy);
  }

  return {
    edgeCrossings,
    nodeCrossings,
    endpointReuses,
    segmentOverlaps,
    bends,
    totalDistance,
    connectionPriority,
  };
}

/**
 * Compare two path candidates to determine which is better.
 * Uses hierarchical criteria: node crossings, edge crossings, endpoint reuses, etc.
 * @param path1 - First path candidate to compare
 * @param path2 - Second path candidate to compare
 * @returns Negative if path1 is better, positive if path2 is better, zero if equal
 */
function comparePathCandidates(path1: PathCandidate, path2: PathCandidate): number {
  const m1 = path1.metrics;
  const m2 = path2.metrics;

  if (m1.nodeCrossings !== m2.nodeCrossings) {
    return m1.nodeCrossings - m2.nodeCrossings;
  }

  if (m1.edgeCrossings !== m2.edgeCrossings) {
    return m1.edgeCrossings - m2.edgeCrossings;
  }

  if (m1.endpointReuses !== m2.endpointReuses) {
    return m1.endpointReuses - m2.endpointReuses;
  }

  if (m1.segmentOverlaps !== m2.segmentOverlaps) {
    return m1.segmentOverlaps - m2.segmentOverlaps;
  }

  if (m1.bends !== m2.bends) {
    return m1.bends - m2.bends;
  }

  // Priority 5: Connection point quality / distance (shorter/better is better)
  if (m1.totalDistance !== m2.totalDistance) {
    return m1.totalDistance - m2.totalDistance;
  }

  // Priority 6: Connection priority (lower = better geometry/less reuse)
  return m1.connectionPriority - m2.connectionPriority;
}

/**
 * Calculate penalty for reusing existing endpoints (connection points).
 * Discourages using connection points that are already occupied by other edges.
 * @param start - Start point coordinates
 * @param end - End point coordinates
 * @param bufferZones - Set of coordinate keys representing occupied areas
 * @param penaltyValue - Penalty value to apply for each reused endpoint (default: 500)
 * @returns Total penalty value for endpoint reuse
 */
function calculateEndpointReusePenalty(
  start: Point,
  end: Point,
  bufferZones: Set<string>,
  penaltyValue = 500
): number {
  const startKey = `${Math.round(start.x)},${Math.round(start.y)}`;
  const endKey = `${Math.round(end.x)},${Math.round(end.y)}`;

  const startReuse = bufferZones.has(startKey) ? penaltyValue : 0;
  const endReuse = bufferZones.has(endKey) ? penaltyValue : 0;

  return startReuse + endReuse;
}

function buildPathCells(node: EnhancedAStarNode, startCell: GridCell): GridCell[] {
  const pathCells: GridCell[] = [startCell];
  const chain: GridCell[] = [];
  let current: EnhancedAStarNode | null = node;

  while (current) {
    chain.push(current.cell);
    current = current.parent as EnhancedAStarNode | null;
  }

  chain.reverse();
  pathCells.push(...chain);
  return pathCells;
}
