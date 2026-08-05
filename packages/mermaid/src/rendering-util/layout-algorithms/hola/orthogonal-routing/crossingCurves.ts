/**
 * Crossing curve generation module for orthogonal edge routing
 * Applies curves or offsets at edge crossing points to improve visual distinction
 */

import type { Point, PathSegment, RoutedEdgeInfo } from './types.js';
import type { RoutingGrid } from './grid.js';

//CrossingCurveConfig,
// CrossingCurveInfo,
// EnhancedCrossingInfo,

//define this 3 interface here only using below code
/**
 * Configuration for crossing curve application
 */
export interface CrossingCurveConfig {
  enabled: boolean;
  curveType: 'arc' | 'offset' | 'none';
  curveRadius: number; // For arc curves
  offsetDistance: number; // For offset curves
  minCrossingAngle: number; // Minimum angle to apply curve
  priority: 'first-edge' | 'second-edge' | 'shorter-edge' | 'longer-edge';
}

export interface CrossingCurveInfo {
  crossingPoint: Point;
  curveType: 'arc' | 'offset';
  curveRadius?: number; // For arc curves
  offsetDistance?: number; // For offset curves
  affectedSegmentIndex: number;
  controlPoints: Point[];
  originalPoints: Point[];
}

export interface EnhancedCrossingInfo {
  point: Point;
  existingEdgeId?: string;
  segment: PathSegment;
  crossingEdgeIds: string[];
  crossingAngle: number;
  shouldApplyCurve: boolean;
  priority: number;
}

/**
 * Default crossing curve configuration
 */
const DEFAULT_CROSSING_CURVE_CONFIG: CrossingCurveConfig = {
  enabled: true,
  curveType: 'arc',
  curveRadius: 12,
  offsetDistance: 8,
  minCrossingAngle: 45,
  priority: 'first-edge',
};

/**
 * Apply crossing curves to all routed edges to improve visual distinction at crossing points.
 * @param routedEdges - Array of successfully routed edges
 * @param grid - Routing grid for crossing detection
 * @param config - Crossing curve configuration options
 * @returns Updated routed edges with crossing curves applied
 */
export function applyCrossingCurves(
  routedEdges: RoutedEdgeInfo[],
  grid: RoutingGrid,
  config: CrossingCurveConfig = DEFAULT_CROSSING_CURVE_CONFIG
): RoutedEdgeInfo[] {
  if (!config.enabled || config.curveType === 'none') {
    return routedEdges;
  }

  const crossings = findAllCrossings(routedEdges, grid);

  const significantCrossings = filterCrossingsByAngle(crossings, config.minCrossingAngle);

  return applyCurvesToCrossings(routedEdges, significantCrossings, config);
}

/**
 * Find all crossings between routed edges and calculate their properties.
 * @param routedEdges - Array of routed edges to analyze for crossings
 * @param grid - Routing grid used for crossing detection
 * @returns Array of enhanced crossing information with angles and priorities
 */
function findAllCrossings(
  routedEdges: RoutedEdgeInfo[],
  grid: RoutingGrid
): EnhancedCrossingInfo[] {
  const crossings: EnhancedCrossingInfo[] = [];

  for (let i = 0; i < routedEdges.length; i++) {
    const edgeA = routedEdges[i];
    const segmentsA = getSegmentsFromPoints(edgeA.points);

    for (const segment of segmentsA) {
      const crossingInfos = grid.getSegmentCrossings(segment, edgeA.edgeId);

      for (const crossingInfo of crossingInfos) {
        if (crossingInfo.existingEdgeId) {
          const edgeB = routedEdges.find((e) => e.edgeId === crossingInfo.existingEdgeId);
          if (edgeB) {
            const angle = calculateCrossingAngle(segment, crossingInfo.segment);

            const enhancedCrossing: EnhancedCrossingInfo = {
              ...crossingInfo,
              crossingEdgeIds: [edgeA.edgeId, edgeB.edgeId],
              crossingAngle: angle,
              shouldApplyCurve: true,
              priority: i,
            };

            crossings.push(enhancedCrossing);
          }
        }
      }
    }
  }

  return crossings;
}

/**
 * Filter crossings by minimum angle threshold to exclude near-parallel crossings.
 * @param crossings - Array of crossing information to filter
 * @param minAngle - Minimum crossing angle in degrees to retain
 * @returns Filtered array containing only crossings that meet the angle threshold
 */
function filterCrossingsByAngle(
  crossings: EnhancedCrossingInfo[],
  minAngle: number
): EnhancedCrossingInfo[] {
  return crossings.filter((crossing) => {
    return (
      Math.abs(crossing.crossingAngle) >= minAngle &&
      Math.abs(crossing.crossingAngle) <= 180 - minAngle
    );
  });
}

/**
 * Apply curves to crossings based on priority configuration.
 * @param routedEdges - Array of routed edges to modify
 * @param crossings - Array of crossing points where curves should be applied
 * @param config - Configuration specifying curve type and selection priority
 * @returns Updated array of routed edges with curves applied
 */
function applyCurvesToCrossings(
  routedEdges: RoutedEdgeInfo[],
  crossings: EnhancedCrossingInfo[],
  config: CrossingCurveConfig
): RoutedEdgeInfo[] {
  const edgeMap = new Map(routedEdges.map((edge) => [edge.edgeId, edge]));
  const processedCrossings = new Set<string>();

  crossings.sort((a, b) => a.priority - b.priority);

  for (const crossing of crossings) {
    const crossingKey = `${crossing.point.x},${crossing.point.y}`;

    if (processedCrossings.has(crossingKey)) {
      continue;
    }

    const edgeToModify = selectEdgeForCurve(crossing, config, edgeMap);

    if (edgeToModify) {
      const curveInfo = generateCrossingCurve(edgeToModify, crossing, config);

      if (curveInfo) {
        if (!edgeToModify.crossingCurves) {
          edgeToModify.crossingCurves = [] as CrossingCurveInfo[];
        }
        edgeToModify.crossingCurves.push(curveInfo);

        applyCurveToEdgePoints(edgeToModify, curveInfo);

        processedCrossings.add(crossingKey);
      }
    }
  }

  return [...edgeMap.values()];
}

/**
 * Select which edge should receive the curve based on priority configuration.
 * @param crossing - Information about the crossing point and involved edges
 * @param config - Configuration specifying selection priority (first, second, shorter, longer)
 * @param edgeMap - Map of edge IDs to edge information
 * @returns Selected edge that should receive the curve, or null if selection fails
 */
function selectEdgeForCurve(
  crossing: EnhancedCrossingInfo,
  config: CrossingCurveConfig,
  edgeMap: Map<string, RoutedEdgeInfo>
): RoutedEdgeInfo | null {
  const [edgeIdA, edgeIdB] = crossing.crossingEdgeIds;
  const edgeA = edgeMap.get(edgeIdA);
  const edgeB = edgeMap.get(edgeIdB);

  if (!edgeA || !edgeB) {
    return null;
  }

  switch (config.priority) {
    case 'first-edge':
      return edgeA;
    case 'second-edge':
      return edgeB;
    case 'shorter-edge':
      return getTotalPathLength(edgeA.points) <= getTotalPathLength(edgeB.points) ? edgeA : edgeB;
    case 'longer-edge':
      return getTotalPathLength(edgeA.points) > getTotalPathLength(edgeB.points) ? edgeA : edgeB;
    default:
      return edgeA;
  }
}

/**
 * Generate curve information for a specific crossing point.
 * @param edge - The edge that will receive the curve modification
 * @param crossing - Information about the crossing point and geometry
 * @param config - Configuration specifying curve type and parameters
 * @returns Crossing curve information, or null if curve cannot be generated
 */
function generateCrossingCurve(
  edge: RoutedEdgeInfo,
  crossing: EnhancedCrossingInfo,
  config: CrossingCurveConfig
): CrossingCurveInfo | null {
  const segments = getSegmentsFromPoints(edge.points);

  for (const [i, segment] of segments.entries()) {
    if (isPointOnSegment(crossing.point, segment)) {
      if (config.curveType === 'arc') {
        return generateArcCurve(edge, crossing, i, config.curveRadius);
      } else if (config.curveType === 'offset') {
        return generateOffsetCurve(edge, crossing, i, config.offsetDistance);
      }
    }
  }

  return null;
}

/**
 * Generate arc curve at crossing point for smooth visual transition.
 * @param edge - The edge to apply the arc curve to
 * @param crossing - Information about the crossing point
 * @param segmentIndex - Index of the segment within the edge where the curve should be applied
 * @param radius - Radius of the arc curve
 * @returns Crossing curve information with arc control points
 */
function generateArcCurve(
  edge: RoutedEdgeInfo,
  crossing: EnhancedCrossingInfo,
  segmentIndex: number,
  radius: number
): CrossingCurveInfo {
  const segment = getSegmentsFromPoints(edge.points)[segmentIndex];
  const crossingPoint = crossing.point;

  const isHorizontal = Math.abs(segment.start.y - segment.end.y) < 1;

  const startToCrossing = isHorizontal
    ? Math.abs(crossingPoint.x - segment.start.x)
    : Math.abs(crossingPoint.y - segment.start.y);
  const crossingToEnd = isHorizontal
    ? Math.abs(segment.end.x - crossingPoint.x)
    : Math.abs(segment.end.y - crossingPoint.y);

  const curveExtent = Math.min(startToCrossing, crossingToEnd, radius);

  if (isHorizontal) {
    const controlPoints: Point[] = [
      { x: crossingPoint.x - curveExtent, y: crossingPoint.y },
      { x: crossingPoint.x, y: crossingPoint.y - radius },
      { x: crossingPoint.x + curveExtent, y: crossingPoint.y },
    ];

    return {
      crossingPoint,
      curveType: 'arc',
      curveRadius: radius,
      affectedSegmentIndex: segmentIndex,
      controlPoints,
      originalPoints: [...edge.points],
    };
  } else {
    const controlPoints: Point[] = [
      { x: crossingPoint.x, y: crossingPoint.y - curveExtent },
      { x: crossingPoint.x + radius, y: crossingPoint.y },
      { x: crossingPoint.x, y: crossingPoint.y + curveExtent },
    ];

    return {
      crossingPoint,
      curveType: 'arc',
      curveRadius: radius,
      affectedSegmentIndex: segmentIndex,
      controlPoints,
      originalPoints: [...edge.points],
    };
  }
}

/**
 * Generate offset curve at crossing point by creating a detour path.
 * @param edge - The edge to apply the offset curve to
 * @param crossing - Information about the crossing point
 * @param segmentIndex - Index of the segment within the edge where the offset should be applied
 * @param offsetDistance - Distance to offset the path from the crossing point
 * @returns Crossing curve information with offset control points
 */
function generateOffsetCurve(
  edge: RoutedEdgeInfo,
  crossing: EnhancedCrossingInfo,
  segmentIndex: number,
  offsetDistance: number
): CrossingCurveInfo {
  const segment = getSegmentsFromPoints(edge.points)[segmentIndex];
  const crossingPoint = crossing.point;

  const isHorizontal = Math.abs(segment.start.y - segment.end.y) < 1;

  let offsetPoints: Point[];
  if (isHorizontal) {
    const offsetY = crossingPoint.y + offsetDistance;
    offsetPoints = [
      { x: crossingPoint.x - offsetDistance, y: offsetY },
      { x: crossingPoint.x + offsetDistance, y: offsetY },
    ];
  } else {
    const offsetX = crossingPoint.x + offsetDistance;
    offsetPoints = [
      { x: offsetX, y: crossingPoint.y - offsetDistance },
      { x: offsetX, y: crossingPoint.y + offsetDistance },
    ];
  }

  return {
    crossingPoint,
    curveType: 'offset',
    offsetDistance,
    affectedSegmentIndex: segmentIndex,
    controlPoints: offsetPoints,
    originalPoints: [...edge.points],
  };
}

/**
 * Apply curve to edge points array by modifying the path geometry.
 * @param edge - The edge whose points will be modified
 * @param curveInfo - Information about the curve to apply including control points
 */
function applyCurveToEdgePoints(edge: RoutedEdgeInfo, curveInfo: CrossingCurveInfo): void {
  const { affectedSegmentIndex, controlPoints, crossingPoint } = curveInfo;

  if (!controlPoints || controlPoints.length === 0) {
    return;
  }

  const segments = getSegmentsFromPoints(edge.points);
  const affectedSegment = segments[affectedSegmentIndex];

  if (!affectedSegment) {
    return;
  }

  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < edge.points.length - 1; i++) {
    const point = edge.points[i];
    const nextPoint = edge.points[i + 1];

    if (pointsEqual(point, affectedSegment.start) && pointsEqual(nextPoint, affectedSegment.end)) {
      startIndex = i;
      endIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    for (let i = 0; i < edge.points.length; i++) {
      if (pointsEqual(edge.points[i], crossingPoint)) {
        edge.points.splice(i, 1, ...controlPoints);
        return;
      }
    }
    return;
  }

  if (curveInfo.curveType === 'arc') {
    // For arc curves, we need to replace the segment with the curve path
    // The control points should be in order: before_curve -> curve_peak -> after_curve
    // But we need to ensure they're in the correct direction of travel

    // Determine direction of travel along the segment
    const travelDirection = {
      x: affectedSegment.end.x - affectedSegment.start.x,
      y: affectedSegment.end.y - affectedSegment.start.y,
    };

    // For horizontal segments, check if we're traveling left or right
    const isHorizontal = Math.abs(travelDirection.y) < 1;
    let orderedControlPoints = [...controlPoints];

    if (isHorizontal && travelDirection.x < 0) {
      orderedControlPoints = [...controlPoints].reverse();
    } else if (!isHorizontal && travelDirection.y < 0) {
      orderedControlPoints = [...controlPoints].reverse();
    }

    edge.points.splice(startIndex + 1, 0, ...orderedControlPoints);
  } else if (curveInfo.curveType === 'offset') {
    const newPath = [affectedSegment.start, ...controlPoints, affectedSegment.end];
    edge.points.splice(startIndex, endIndex - startIndex + 1, ...newPath);
  }
}

/**
 * Check if two points are equal within a specified tolerance.
 * @param p1 - First point to compare
 * @param p2 - Second point to compare
 * @param tolerance - Maximum allowed difference for equality (default: 1)
 * @returns True if points are equal within tolerance, false otherwise
 */
function pointsEqual(p1: Point, p2: Point, tolerance = 1): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Helper functions
 */

/**
 * Convert array of points into array of line segments.
 * @param points - Array of points representing a path
 * @returns Array of path segments connecting consecutive points
 */
function getSegmentsFromPoints(points: Point[]): PathSegment[] {
  const segments: PathSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      start: points[i],
      end: points[i + 1],
    });
  }
  return segments;
}

/**
 * Calculate the crossing angle between two line segments.
 * @param segmentA - First line segment
 * @param segmentB - Second line segment
 * @returns Crossing angle in degrees (0-180 range)
 */
function calculateCrossingAngle(segmentA: PathSegment, segmentB: PathSegment): number {
  const vectorA = {
    x: segmentA.end.x - segmentA.start.x,
    y: segmentA.end.y - segmentA.start.y,
  };
  const vectorB = {
    x: segmentB.end.x - segmentB.start.x,
    y: segmentB.end.y - segmentB.start.y,
  };

  const angleA = Math.atan2(vectorA.y, vectorA.x);
  const angleB = Math.atan2(vectorB.y, vectorB.x);

  let angleDiff = Math.abs(angleA - angleB) * (180 / Math.PI);

  // Normalize to 0-180 degrees
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }

  return angleDiff;
}

/**
 * Check if a point lies on a line segment within tolerance.
 * @param point - Point to test
 * @param segment - Line segment to test against
 * @param tolerance - Distance tolerance for point-on-segment detection (default: 1)
 * @returns True if point is on the segment within tolerance, false otherwise
 */
function isPointOnSegment(point: Point, segment: PathSegment, tolerance = 1): boolean {
  const { start, end } = segment;

  // Check if point is within segment bounds
  const minX = Math.min(start.x, end.x) - tolerance;
  const maxX = Math.max(start.x, end.x) + tolerance;
  const minY = Math.min(start.y, end.y) - tolerance;
  const maxY = Math.max(start.y, end.y) + tolerance;

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Calculate the total length of a path defined by an array of points.
 * @param points - Array of points representing the path
 * @returns Total Euclidean distance along the path
 */
function getTotalPathLength(points: Point[]): number {
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

export { DEFAULT_CROSSING_CURVE_CONFIG };
