import type { Edge, Node } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';
import { CORNER_CLEARANCE } from './endpointClip.js';
import {
  collectNodeRectEntries,
  dedupeConsecutivePoints,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  rectOfNodeBounds,
  routesTouchAtBend,
  sameAxisSegmentsOverlap,
  sameX,
  sameY,
  segmentHitsAnyRect,
  simplifyPolyline,
} from './geometry.js';
import type { Point, RectBounds, RectEntry, RectSide } from './geometry.js';

const EPS = 1e-3;
const OBSTACLE_BUFFER = 2;

/** One face of a node's bounding box. */
export interface NodeFace {
  node: Node;
  rect: RectBounds;
  side: RectSide;
}

interface Terminal extends NodeFace {
  edge: Edge;
  /** The route ordered from this terminal outward. */
  route: Point[];
}

export interface Obstacles {
  realNodeRects: RectEntry[];
  labelNodeRects: RectEntry[];
}

export const isDiamond = (node: Node): boolean =>
  node.shape === 'question' || node.shape === 'diamond';

const runsAlongFace = (side: RectSide): 'x' | 'y' =>
  side === 'top' || side === 'bottom' ? 'x' : 'y';

const near = (a: number, b: number): boolean => Math.abs(a - b) < EPS;

const within = (value: number, lo: number, hi: number): boolean =>
  value >= lo - EPS && value <= hi + EPS;

function verticalLegFace(endpoint: Point, next: Point, rect: RectBounds): RectSide | undefined {
  if (!sameX(endpoint, next, EPS) || !within(endpoint.x, rect.left, rect.right)) {
    return undefined;
  }
  if (near(endpoint.y, rect.bottom) && next.y > endpoint.y) {
    return 'bottom';
  }
  return near(endpoint.y, rect.top) && next.y < endpoint.y ? 'top' : undefined;
}

function horizontalLegFace(endpoint: Point, next: Point, rect: RectBounds): RectSide | undefined {
  if (!sameY(endpoint, next, EPS) || !within(endpoint.y, rect.top, rect.bottom)) {
    return undefined;
  }
  if (near(endpoint.x, rect.right) && next.x > endpoint.x) {
    return 'right';
  }
  return near(endpoint.x, rect.left) && next.x < endpoint.x ? 'left' : undefined;
}

/** The face a terminal leg leaves outward from, or undefined when the leg is not on a face. */
const faceOfLeg = (endpoint: Point, next: Point, rect: RectBounds): RectSide | undefined =>
  verticalLegFace(endpoint, next, rect) ?? horizontalLegFace(endpoint, next, rect);

/** The route ordered from the terminal outward, when its first leg leaves a face and turns. */
function terminalFrom(edge: Edge, node: Node, rect: RectBounds, outward: Point[]) {
  const side = faceOfLeg(outward[0], outward[1], rect);
  if (!side) {
    return undefined;
  }
  const axis = runsAlongFace(side);
  return near(outward[1][axis], outward[2][axis])
    ? undefined
    : { edge, node, rect, side, route: outward };
}

const endpointId = (edge: Edge, atStart: boolean): string =>
  (atStart ? edge.start : edge.end) ?? '';

function terminalAt(
  edge: Edge,
  atStart: boolean,
  nodeByIdMap: Map<string, Node>
): Terminal | undefined {
  const route = dedupeConsecutivePoints(edge.points ?? [], EPS);
  const node = nodeByIdMap.get(endpointId(edge, atStart));
  const rect = node ? rectOfNodeBounds(node) : undefined;
  if (!node || !rect || route.length < 3) {
    return undefined;
  }
  return terminalFrom(edge, node, rect, atStart ? route : route.reverse());
}

/**
 * Where the terminal leg belongs on its face: a diamond's face is its vertex, and a leg pushed
 * against a rectangle's corner belongs at the face centre. Undefined when the leg stays put.
 */
function alignedCoord({ node, rect, side, route }: Terminal): number | undefined {
  const axis = runsAlongFace(side);
  const centre = (axis === 'x' ? node.x : node.y) ?? 0;
  const along = route[0][axis];
  if (Math.abs(along - centre) < EPS) {
    return undefined;
  }
  if (isDiamond(node)) {
    return centre;
  }
  const [lo, hi] = axis === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom];
  return Math.min(along - lo, hi - along) <= CORNER_CLEARANCE + EPS ? centre : undefined;
}

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

function alignTerminal(
  terminal: Terminal,
  edges: Edge[],
  obstacles: Obstacles,
  atStart: boolean
): boolean {
  const target = alignedCoord(terminal);
  if (target === undefined || !faceIsOwn(terminal, terminal.edge, edges)) {
    return false;
  }
  const axis = runsAlongFace(terminal.side);
  const [endpoint, legEnd, ...rest] = terminal.route;
  const movedOutward = simplifyPolyline(
    dedupeConsecutivePoints(
      [{ ...endpoint, [axis]: target }, { ...legEnd, [axis]: target }, ...rest],
      EPS
    )
  );
  const current = atStart ? terminal.route : [...terminal.route].reverse();
  const moved = atStart ? movedOutward : [...movedOutward].reverse();
  if (
    !clearOfNodes(terminal.edge, moved, obstacles) ||
    !clearOfOtherEdges(terminal.edge, current, moved, edges)
  ) {
    return false;
  }
  terminal.edge.points = moved;
  return true;
}

/**
 * Moves an edge's terminal leg along the rail it turns onto, so it meets its node where the
 * node's shape has a port: a diamond at the vertex of the face, a rectangle at the face centre
 * when endpoint clipping left the leg against a corner. A leg moves only when no other edge ends
 * on that face and the moved route hits no node or label, overlaps no edge, and crosses or touches
 * no edge it did not already. Returns whether any route changed; endpoints are left deduplicated,
 * so the caller re-prepares them for the renderer.
 */
export function alignTerminalLegsToPorts(edges: Edge[], nodeByIdMap: Map<string, Node>): boolean {
  const obstacles = collectNodeRectEntries(nodeByIdMap.values());
  let changed = false;
  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    for (const atStart of [true, false]) {
      const terminal = terminalAt(edge, atStart, nodeByIdMap);
      if (terminal && alignTerminal(terminal, edges, obstacles, atStart)) {
        changed = true;
      }
    }
  }
  return changed;
}
