import type { Edge, Node } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';
import {
  dedupeConsecutivePoints,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  routesTouchAtBend,
  sameAxisSegmentsOverlap,
  segmentHitsAnyRect,
} from './geometry.js';
import type { Point, RectBounds, RectEntry, RectSide } from './geometry.js';

/**
 * The faces and routes the passes that move a terminal leg agree on: whether a face is free,
 * and whether a moved route stays clear of the other edges and the nodes.
 */

/** How close two coordinates must be to count as equal. */
export const EPS = 1e-3;
const OBSTACLE_BUFFER = 2;

/** One face of a node's bounding box. */
export interface NodeFace {
  node: Node;
  rect: RectBounds;
  side: RectSide;
}

export interface Obstacles {
  realNodeRects: RectEntry[];
  labelNodeRects: RectEntry[];
}

export const runsAlongFace = (side: RectSide): 'x' | 'y' =>
  side === 'top' || side === 'bottom' ? 'x' : 'y';

/**
 * Whether an endpoint meets the node through this face: on the face, or beyond it, where the
 * renderer joins the endpoint to the node through the face.
 */
function endpointThroughFace(point: Point, rect: RectBounds, side: RectSide): boolean {
  const axis = runsAlongFace(side);
  const [lo, hi] = axis === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom];
  const outward = {
    top: rect.top - point.y,
    bottom: point.y - rect.bottom,
    left: rect.left - point.x,
    right: point.x - rect.right,
  }[side];
  return outward > -EPS && point[axis] >= lo - EPS && point[axis] <= hi + EPS;
}

/** No edge but `edge` meets the node through the face, so a route moved there lands on a free port. */
export function faceIsOwn(face: NodeFace, edge: Edge, edges: Edge[]): boolean {
  const nodeId = face.node.id;
  return edges.every((other) => {
    if (other === edge || other.isLayoutOnly) {
      return true;
    }
    const points = other.points ?? [];
    const ends: [string | undefined, Point | undefined][] = [
      [other.start, points.at(0)],
      [other.end, points.at(-1)],
    ];
    return ends.every(
      ([id, point]) => id !== nodeId || !point || !endpointThroughFace(point, face.rect, face.side)
    );
  });
}

function strictCrossings(route: Point[], other: Point[]): number {
  const otherSegments = orthogonalSegmentsForPoints(other, EPS);
  return orthogonalSegmentsForPoints(route, EPS).reduce(
    (count, segment) =>
      count +
      otherSegments.filter((o) =>
        orthogonalSegmentsStrictlyCross(segment.a, segment.b, o.a, o.b, EPS)
      ).length,
    0
  );
}

function overlapsAny(route: Point[], other: Point[]): boolean {
  const otherSegments = orthogonalSegmentsForPoints(other, EPS);
  return orthogonalSegmentsForPoints(route, EPS).some((segment) =>
    otherSegments.some((o) => sameAxisSegmentsOverlap(segment.a, segment.b, o.a, o.b, EPS))
  );
}

/** The moved route keeps clear of every other edge at least as well as the current one. */
export function clearOfOtherEdges(
  edge: Edge,
  current: Point[],
  moved: Point[],
  edges: Edge[]
): boolean {
  const tolerance = EDGE_ROUTING.ROUTE_TOUCH_TOLERANCE;
  return edges.every((other) => {
    const points = dedupeConsecutivePoints(other.points ?? [], EPS);
    if (other === edge || other.isLayoutOnly || points.length < 2) {
      return true;
    }
    return (
      !overlapsAny(moved, points) &&
      strictCrossings(moved, points) <= strictCrossings(current, points) &&
      (!routesTouchAtBend(moved, points, tolerance) ||
        routesTouchAtBend(current, points, tolerance))
    );
  });
}

/** The moved route passes no node but its own endpoints at its ends, and no label but its own. */
export function clearOfNodes(edge: Edge, moved: Point[], obstacles: Obstacles): boolean {
  const ownLabel = edge.labelNodeId;
  const endpointIds = [edge.start, edge.end].filter((id): id is string => Boolean(id));
  const segments = orthogonalSegmentsForPoints(moved, EPS);
  return segments.every((segment) => {
    const touchesEndpoint = segment.index === 0 || segment.index === segments.length - 1;
    const excluded = touchesEndpoint ? endpointIds : [];
    return (
      !segmentHitsAnyRect(
        segment.a,
        segment.b,
        obstacles.realNodeRects,
        excluded,
        OBSTACLE_BUFFER
      ) &&
      !segmentHitsAnyRect(
        segment.a,
        segment.b,
        obstacles.labelNodeRects,
        ownLabel ? [ownLabel] : [],
        OBSTACLE_BUFFER
      )
    );
  });
}
