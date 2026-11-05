import type { Edge, Node } from '../../../types.js';
import { CORNER_CLEARANCE } from './endpointClip.js';
import {
  collectNodeRectEntries,
  dedupeConsecutivePoints,
  rectOfNodeBounds,
  sameX,
  sameY,
  simplifyPolyline,
} from './geometry.js';
import type { Point, RectBounds, RectSide } from './geometry.js';
import {
  EPS,
  clearOfNodes,
  clearOfOtherEdges,
  faceIsOwn,
  runsAlongFace,
} from './terminalGeometry.js';
import type { NodeFace, Obstacles } from './terminalGeometry.js';

interface Terminal extends NodeFace {
  edge: Edge;
  /** The route ordered from this terminal outward. */
  route: Point[];
}

/** Every name the shape registry accepts for a diamond: a node keeps the one its author wrote. */
const DIAMOND_SHAPES = new Set<string>(['question', 'diamond', 'diam', 'decision']);

export const isDiamond = (node: Node): boolean => DIAMOND_SHAPES.has(node.shape ?? '');

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
