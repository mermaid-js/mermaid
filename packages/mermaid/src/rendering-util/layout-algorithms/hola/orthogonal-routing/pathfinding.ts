/**
 * Pathfinding algorithms for orthogonal edge routing
 */

import type { Point, PathValidationResult, Side, EdgeContext } from './types.js';
import type { RoutingGrid } from './grid.js';
import type { LayoutData } from '../../../types.js';
import { L_SHAPE_OFFSET_PERCENTAGES, Z_SHAPE_OFFSET_PERCENTAGES } from '../Constants.js';

const candidateScan = (center: number, min: number, max: number, step: number): number[] => {
  const candidates: number[] = [];
  if (center >= min && center <= max) {
    candidates.push(center);
  }
  for (let i = 1; i <= 10; i++) {
    const plus = center + i * step;
    const minus = center - i * step;
    if (plus >= min && plus <= max) {
      candidates.push(plus);
    }
    if (minus >= min && minus <= max) {
      candidates.push(minus);
    }
  }
  if (min <= max) {
    candidates.push(min + step);
    candidates.push(max - step);
  }
  return [...new Set(candidates)];
};

const getOverlapAxisCandidates = (params: {
  layoutData?: LayoutData;
  edgeContext?: EdgeContext;
  startSide?: Side;
  endSide?: Side;
  step: number;
  overlapThresholdPercent?: number;
}): {
  axis: 'x' | 'y';
  values: number[];
  center: number;
  bandMin: number;
  bandMax: number;
} | null => {
  const {
    layoutData,
    edgeContext,
    startSide,
    endSide,
    step,
    overlapThresholdPercent = 50,
  } = params;

  if (!layoutData || !edgeContext || !startSide || !endSide) {
    return null;
  }

  const startNode = layoutData.nodes.find((n) => n.id === edgeContext.sourceNodeId);
  const endNode = layoutData.nodes.find((n) => n.id === edgeContext.targetNodeId);
  if (!startNode || !endNode) {
    return null;
  }
  if (startNode.isLabelNode || endNode.isLabelNode) {
    return null;
  }

  const x1 = startNode.x ?? 0;
  const y1 = startNode.y ?? 0;
  const w1 = startNode.width ?? 50;
  const h1 = startNode.height ?? 40;
  const x2 = endNode.x ?? 0;
  const y2 = endNode.y ?? 0;
  const w2 = endNode.width ?? 50;
  const h2 = endNode.height ?? 40;

  const n1Left = x1 - w1 / 2;
  const n1Right = x1 + w1 / 2;
  const n1Top = y1 - h1 / 2;
  const n1Bottom = y1 + h1 / 2;
  const n2Left = x2 - w2 / 2;
  const n2Right = x2 + w2 / 2;
  const n2Top = y2 - h2 / 2;
  const n2Bottom = y2 + h2 / 2;

  if (
    (startSide === 'bottom' && endSide === 'top') ||
    (startSide === 'top' && endSide === 'bottom')
  ) {
    const overlapLeft = Math.max(n1Left, n2Left);
    const overlapRight = Math.min(n1Right, n2Right);
    const overlapWidth = Math.max(0, overlapRight - overlapLeft);
    const cov1 = (overlapWidth / w1) * 100;
    const cov2 = (overlapWidth / w2) * 100;
    if (Math.max(cov1, cov2) < overlapThresholdPercent) {
      return null;
    }

    const coveredNodeX = cov1 >= cov2 ? x1 : x2;
    const overlapCenterX = (overlapLeft + overlapRight) / 2;
    const bandMin = overlapLeft + 1;
    const bandMax = overlapRight - 1;

    const preferred = [x2, x1, coveredNodeX, overlapCenterX];
    const values = [
      ...new Set<number>([...preferred, ...candidateScan(overlapCenterX, bandMin, bandMax, step)]),
    ].filter((x) => x >= bandMin && x <= bandMax);

    return { axis: 'x', values, center: overlapCenterX, bandMin, bandMax };
  }

  if (
    (startSide === 'right' && endSide === 'left') ||
    (startSide === 'left' && endSide === 'right')
  ) {
    const overlapTop = Math.max(n1Top, n2Top);
    const overlapBottom = Math.min(n1Bottom, n2Bottom);
    const overlapHeight = Math.max(0, overlapBottom - overlapTop);
    const cov1 = (overlapHeight / h1) * 100;
    const cov2 = (overlapHeight / h2) * 100;
    if (Math.max(cov1, cov2) < overlapThresholdPercent) {
      return null;
    }

    const coveredNodeY = cov1 >= cov2 ? y1 : y2;
    const overlapCenterY = (overlapTop + overlapBottom) / 2;
    const bandMin = overlapTop + 1;
    const bandMax = overlapBottom - 1;

    const preferred = [y2, y1, coveredNodeY, overlapCenterY];
    const values = [
      ...new Set<number>([...preferred, ...candidateScan(overlapCenterY, bandMin, bandMax, step)]),
    ].filter((y) => y >= bandMin && y <= bandMax);

    return { axis: 'y', values, center: overlapCenterY, bandMin, bandMax };
  }

  return null;
};

const getNodeBounds = (layoutData: LayoutData, nodeId: string) => {
  const n = layoutData.nodes.find((x) => x.id === nodeId);
  if (n?.x === undefined || n.y === undefined) {
    return null;
  }
  const w = n.width ?? 50;
  const h = n.height ?? 40;
  return {
    left: n.x - w / 2,
    right: n.x + w / 2,
    top: n.y - h / 2,
    bottom: n.y + h / 2,
  };
};

/**
 * Try to find a straight path (horizontal or vertical only) between two points.
 * Supports tolerance-based near-straight paths and validates path clearance.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection
 * @param tolerance - Optional tolerance in pixels for near-straight paths (e.g., 5px)
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @param layoutData - Optional layout data for label node handling
 * @param startSide - Optional start side constraint for direction validation
 * @param endSide - Optional end side constraint for direction validation
 * @returns PathValidationResult indicating success/failure with points or reason
 */
export function tryStraightPath(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  tolerance?: number,
  edgeContext?: EdgeContext,
  layoutData?: LayoutData,
  startSide?: Side,
  endSide?: Side
): PathValidationResult {
  if (startSide && endSide && startSide === endSide) {
    return { valid: false, reason: 'Straight path not allowed: same sides' };
  }

  const directionConflicts = (a: Point, b: Point): string | null => {
    if (!startSide || !endSide) {
      return null;
    }
    const dx0 = b.x - a.x;
    const dy0 = b.y - a.y;
    const horizontal = dy0 === 0 && dx0 !== 0;
    const vertical = dx0 === 0 && dy0 !== 0;
    if (!horizontal && !vertical) {
      return null;
    }

    if (horizontal) {
      if (dx0 > 0 && (startSide === 'left' || endSide === 'right')) {
        return 'Straight path direction conflicts with sides (horizontal)';
      }
      if (dx0 < 0 && (startSide === 'right' || endSide === 'left')) {
        return 'Straight path direction conflicts with sides (horizontal)';
      }
    }
    if (vertical) {
      if (dy0 > 0 && (startSide === 'top' || endSide === 'bottom')) {
        return 'Straight path direction conflicts with sides (vertical)';
      }
      if (dy0 < 0 && (startSide === 'bottom' || endSide === 'top')) {
        return 'Straight path direction conflicts with sides (vertical)';
      }
    }
    return null;
  };

  const cellSize =
    typeof (grid as any).getCellSize === 'function' ? (grid as any).getCellSize() : 8;
  const pCount = edgeContext?.parallelCount ?? 1;
  const isParallelPair = pCount > 1;
  const pIndex = edgeContext?.parallelIndex ?? 0;
  const centered = isParallelPair ? pIndex - (pCount - 1) / 2 : 0;
  const parallelSpacing = Math.max(cellSize * 2, 10);
  const desiredOffset = centered * parallelSpacing;

  const buildOffsetAxisCandidates = (
    base: number,
    min: number,
    max: number,
    fallbackMin?: number,
    fallbackMax?: number
  ): number[] => {
    const candidates: number[] = [];
    const target = base + desiredOffset;
    const pushIfIn = (v: number) => {
      if (v >= min && v <= max) {
        candidates.push(v);
      }
    };
    if (min <= max) {
      pushIfIn(target);
      for (let i = 1; i <= Math.max(2, pCount); i++) {
        pushIfIn(target + i * parallelSpacing);
        pushIfIn(target - i * parallelSpacing);
      }
      pushIfIn(base);
      return [...new Set(candidates)];
    }

    if (fallbackMin !== undefined && fallbackMax !== undefined && fallbackMin <= fallbackMax) {
      const pushIfInFallback = (v: number) => {
        if (v >= fallbackMin && v <= fallbackMax) {
          candidates.push(v);
        }
      };
      pushIfInFallback(target);
      for (let i = 1; i <= Math.max(2, pCount); i++) {
        pushIfInFallback(target + i * parallelSpacing);
        pushIfInFallback(target - i * parallelSpacing);
      }
      pushIfInFallback(base);
    }

    return [...new Set(candidates)];
  };

  const tryAxisStraight = (axis: 'x' | 'y', values: number[]): PathValidationResult | null => {
    for (const v of values) {
      const s: Point = axis === 'x' ? { x: v, y: start.y } : { x: start.x, y: v };
      const t: Point = axis === 'x' ? { x: v, y: end.y } : { x: end.x, y: v };
      const conflict = directionConflicts(s, t);
      if (conflict) {
        continue;
      }
      if (grid.isSegmentClear(s, t, edgeContext)) {
        return { valid: true, points: [s, t] };
      }
    }
    return null;
  };

  if (!isParallelPair && layoutData && edgeContext && startSide && endSide) {
    const overlap = getOverlapAxisCandidates({
      layoutData,
      edgeContext,
      startSide,
      endSide,
      step: cellSize,
      overlapThresholdPercent: 50,
    });
    if (overlap) {
      const offsetValues = buildOffsetAxisCandidates(
        overlap.center,
        overlap.bandMin,
        overlap.bandMax
      );
      const target = overlap.center + desiredOffset;
      const values = [...new Set([...offsetValues, ...overlap.values])].sort(
        (a, b) => Math.abs(a - target) - Math.abs(b - target)
      );

      const res = tryAxisStraight(overlap.axis, values);
      if (res) {
        return res;
      }
    }
  }
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);

  if (dx === 0 || dy === 0) {
    const conflict = directionConflicts(start, end);
    if (conflict) {
      return { valid: false, reason: conflict };
    }
    const isClear = grid.isSegmentClear(start, end, edgeContext);
    if (!isClear) {
      return { valid: false, reason: 'Path is blocked' };
    }
    return { valid: true, points: [start, end] };
  }

  if (tolerance !== undefined && (dx <= tolerance || dy <= tolerance)) {
    const currentStartNode = layoutData?.nodes.find((n) => n.id == edgeContext?.sourceNodeId);
    const currentEndNode = layoutData?.nodes.find((n) => n.id == edgeContext?.targetNodeId);

    let labelNode = 'start';
    if (currentStartNode?.isLabelNode) {
      labelNode = 'start';
    } else if (currentEndNode?.isLabelNode) {
      labelNode = 'end';
    }

    const isHorizontal = dx > dy;
    let snappedEnd: Point = { x: end.x, y: end.y };
    let snappedStart: Point = { x: start.x, y: start.y };
    if (labelNode == 'start') {
      snappedEnd = isHorizontal
        ? { x: end?.x ?? 0, y: start?.y ?? 0 }
        : { x: start?.x ?? 0, y: end?.y ?? 0 };
    } else if (labelNode == 'end') {
      snappedStart = isHorizontal
        ? { x: start?.x ?? 0, y: end?.y ?? 0 }
        : { x: end?.x ?? 0, y: start?.y ?? 0 };
    } else {
      snappedStart = { x: start.x, y: start.y };
      snappedEnd = isHorizontal ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
    }
    const conflict = directionConflicts(snappedStart, snappedEnd);
    if (conflict) {
      return { valid: false, reason: conflict };
    }

    if (pCount > 1 && layoutData && edgeContext && startSide && endSide) {
      const b1 = getNodeBounds(layoutData, edgeContext.sourceNodeId);
      const b2 = getNodeBounds(layoutData, edgeContext.targetNodeId);
      if (b1 && b2) {
        const isHorizontal = snappedStart.y === snappedEnd.y;
        const isVertical = snappedStart.x === snappedEnd.x;
        if (
          isVertical &&
          ((startSide === 'top' && endSide === 'bottom') ||
            (startSide === 'bottom' && endSide === 'top'))
        ) {
          const bandMin = Math.max(b1.left, b2.left) + 1;
          const bandMax = Math.min(b1.right, b2.right) - 1;
          const fallbackMin = b1.left + 1;
          const fallbackMax = b1.right - 1;
          const values = buildOffsetAxisCandidates(
            snappedStart.x,
            bandMin,
            bandMax,
            fallbackMin,
            fallbackMax
          );
          const res = tryAxisStraight('x', values);
          if (res) {
            return res;
          }
        }
        if (
          isHorizontal &&
          ((startSide === 'left' && endSide === 'right') ||
            (startSide === 'right' && endSide === 'left'))
        ) {
          const bandMin = Math.max(b1.top, b2.top) + 1;
          const bandMax = Math.min(b1.bottom, b2.bottom) - 1;
          const fallbackMin = b1.top + 1;
          const fallbackMax = b1.bottom - 1;
          const values = buildOffsetAxisCandidates(
            snappedStart.y,
            bandMin,
            bandMax,
            fallbackMin,
            fallbackMax
          );
          const res = tryAxisStraight('y', values);
          if (res) {
            return res;
          }
        }
      }
    }

    const isClear = grid.isSegmentClear(snappedStart, snappedEnd, edgeContext);

    if (!isClear) {
      return { valid: false, reason: 'Snapped path is blocked' };
    }
    return { valid: true, points: [snappedStart, snappedEnd] };
  }

  return { valid: false, reason: 'Not a straight horizontal or vertical path' };
}

/**
 * Helper function to try L-shaped path with a specific midpoint offset.
 * Tests both horizontal-first and vertical-first L-shaped routing variants
 * with the specified offset percentage to avoid obstacles.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection
 * @param offsetPercent - Percentage offset for midpoint adjustment (-100 to +100)
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @returns PathValidationResult if valid path found, null otherwise
 */
function tryLShapeWithOffset(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  offsetPercent: number,
  edgeContext?: EdgeContext
): PathValidationResult | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const yOffset = dy * (offsetPercent / 100);
  const xOffset = dx * (offsetPercent / 100);

  const hFirstMidpoint = { x: end.x, y: start.y + yOffset };

  const seg1Clear = grid.isSegmentClear(start, hFirstMidpoint, edgeContext);
  const seg2Clear = grid.isSegmentClear(hFirstMidpoint, end, edgeContext);

  if (seg1Clear && seg2Clear) {
    const midpointInFreeSpace = grid.isPointInFreeSpace(hFirstMidpoint);

    if (midpointInFreeSpace) {
      return {
        valid: true,
        points: [start, hFirstMidpoint, end],
      };
    }
  }

  const vFirstMidpoint = { x: start.x + xOffset, y: end.y };

  const seg3Clear = grid.isSegmentClear(start, vFirstMidpoint, edgeContext);
  const seg4Clear = grid.isSegmentClear(vFirstMidpoint, end, edgeContext);

  if (seg3Clear && seg4Clear) {
    const midpointInFreeSpace = grid.isPointInFreeSpace(vFirstMidpoint);

    if (midpointInFreeSpace) {
      return {
        valid: true,
        points: [start, vFirstMidpoint, end],
      };
    }
  }

  return null;
}

/**
 * Try to find an L-shaped path (1 bend) with recursive midpoint adjustment.
 * Iterates through various offset percentages to find a clear L-shaped route
 * that avoids obstacles while maintaining orthogonal constraints.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @returns PathValidationResult indicating success/failure with points or reason
 */
export function tryLShapePath(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  edgeContext?: EdgeContext
): PathValidationResult {
  // const offsetPercentages = [0, -20, 20, -40, 40];
  const offsetPercentages = L_SHAPE_OFFSET_PERCENTAGES;
  // const offsetPercentages = [
  //   0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50, 60, -60, 70, -70, 80, -80,
  // ];

  for (const offset of offsetPercentages) {
    const result = tryLShapeWithOffset(start, end, grid, offset, edgeContext);
    if (result !== null) {
      return result;
    }
  }

  return { valid: false, reason: 'No clear L-shaped path found' };
}

/**
 * Helper function to generate Z-shape variants with offset adjustment.
 * Creates multiple Z-shaped routing patterns with different division ratios
 * and offset percentages to find optimal obstacle-avoiding paths.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param offsetPercent - Percentage offset for path adjustment (-100 to +100)
 * @returns Array of [midpoint1, midpoint2] pairs for Z-shaped paths
 */
function getZShapeVariants(start: Point, end: Point, offsetPercent: number): [Point, Point][] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const xOffset = dx * (offsetPercent / 100);
  const yOffset = dy * (offsetPercent / 100);

  //const ratios = [1 / 2, 1 / 3, 2 / 3];
  const ratios = [0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3, 0.4];

  const variants: [Point, Point][] = ratios.flatMap((ratio) => [
    [
      { x: start.x + dx * ratio + xOffset, y: start.y },
      { x: start.x + dx * ratio + xOffset, y: end.y },
    ] as [Point, Point],
    [
      { x: start.x, y: start.y + dy * ratio + yOffset },
      { x: end.x, y: start.y + dy * ratio + yOffset },
    ] as [Point, Point],
  ]);

  return variants;
}

/**
 * Helper function to try Z-shaped path with a specific offset.
 * Tests various Z-shaped routing patterns (HVH and VHV) with the specified
 * offset to find clear paths while ensuring adequate boundary clearance.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection
 * @param offsetPercent - Percentage offset for midpoint adjustment (-100 to +100)
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @returns PathValidationResult if valid path found, null otherwise
 */
function tryZShapeWithOffset(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  offsetPercent: number,
  edgeContext?: EdgeContext
): PathValidationResult | null {
  const variants = getZShapeVariants(start, end, offsetPercent);

  for (const [mid1, mid2] of variants) {
    const seg1Clear = grid.isSegmentClear(start, mid1, edgeContext);
    const seg2Clear = grid.isSegmentClear(mid1, mid2, edgeContext);
    const seg3Clear = grid.isSegmentClear(mid2, end, edgeContext);

    const isValidForBoundaryCrossing =
      mid1.y == mid2.y ? Math.abs(end.y - mid2.y) > 20 : Math.abs(end.x - mid2.x) > 20;
    if (seg1Clear && seg2Clear && seg3Clear && isValidForBoundaryCrossing) {
      const mid1InFreeSpace = grid.isPointInFreeSpace(mid1);
      const mid2InFreeSpace = grid.isPointInFreeSpace(mid2);

      if (mid1InFreeSpace && mid2InFreeSpace) {
        return {
          valid: true,
          points: [start, mid1, mid2, end],
        };
      }
    }
  }

  return null;
}

/**
 * Try to find a Z-shaped path (2 bends) with recursive midpoint adjustment.
 * Attempts multiple Z-shaped routing patterns with various offset percentages
 * to find an obstacle-free path with exactly two orthogonal bends.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @returns PathValidationResult indicating success/failure with points or reason
 */
export function tryZShapePath(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  edgeContext?: EdgeContext
): PathValidationResult {
  // const offsetPercentages = [0, -20, 20, -40, 40];
  const offsetPercentages = Z_SHAPE_OFFSET_PERCENTAGES;

  for (const offset of offsetPercentages) {
    const result = tryZShapeWithOffset(start, end, grid, offset, edgeContext);
    if (result !== null) {
      return result;
    }
  }

  return { valid: false, reason: 'No clear Z-shaped path found' };
}

/**
 * Find an optimal orthogonal path between two points using priority-based strategies.
 * Attempts pathfinding in order of complexity: straight → L-shaped → Z-shaped.
 * Returns the simplest valid path found, or a fallback direct line if all strategies fail.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param grid - Routing grid for collision detection and validation
 * @param tolerance - Optional tolerance in pixels for near-straight paths
 * @param edgeContext - Optional edge context for subgraph boundary crossing
 * @param layoutData - Optional layout data for label node handling
 * @param startSide - Optional start side constraint for direction validation
 * @param endSide - Optional end side constraint for direction validation
 * @returns PathValidationResult with optimal path points and type, or fallback reason
 */
export function findOrthogonalPath(
  start: Point,
  end: Point,
  grid: RoutingGrid,
  tolerance?: number,
  edgeContext?: EdgeContext,
  layoutData?: LayoutData,
  startSide?: Side,
  endSide?: Side
): PathValidationResult {
  // Priority 1: Try straight path (with tolerance if provided)
  let result = tryStraightPath(
    start,
    end,
    grid,
    tolerance,
    edgeContext,
    layoutData,
    startSide,
    endSide
  );
  if (result.valid) {
    result.type = 'straight';
    return result;
  }

  // Priority 2: Try L-shaped path
  result = tryLShapePath(start, end, grid, edgeContext);
  if (result.valid) {
    result.type = 'lshape';
    return result;
  }

  // Priority 3: Try Z-shaped path
  result = tryZShapePath(start, end, grid, edgeContext);
  if (result.valid) {
    result.type = 'zshape';
    return result;
  }

  // If all strategies fail, return straight line as fallback
  return {
    valid: false,
    points: [start, end],
    reason: 'All pathfinding strategies failed, using direct line as fallback',
  };
}
