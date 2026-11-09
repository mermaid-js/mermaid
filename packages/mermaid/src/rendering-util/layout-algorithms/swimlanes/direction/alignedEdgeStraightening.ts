import type { Edge, Node } from '../../../types.js';
import { collectNodeRectEntries, dedupeConsecutivePoints, rectOfNodeBounds } from './geometry.js';
import type { Point, RectBounds, RectSide } from './geometry.js';
import { EPS, clearOfNodes, clearOfOtherEdges, faceIsOwn } from './terminalGeometry.js';
import type { NodeFace, Obstacles } from './terminalGeometry.js';

/**
 * How far apart two node centres may sit across the line and still count as aligned. The line is
 * drawn at the source's centre, so that distance lands on the target end, which the renderer
 * clips to the target afterwards.
 */
export const ALIGNED_CENTRE_TOLERANCE = 1;

interface Placed {
  node: Node;
  rect: RectBounds;
  cx: number;
  cy: number;
}

interface StraightLine {
  from: NodeFace;
  to: NodeFace;
  points: [Point, Point];
}

function placed(node: Node | undefined): Placed | undefined {
  const rect = node && !node.isGroup ? rectOfNodeBounds(node) : undefined;
  return node && rect ? { node, rect, cx: node.x ?? 0, cy: node.y ?? 0 } : undefined;
}

/** The facing faces of two nodes stacked one above the other, joined at the source's centre. */
function verticalLine(src: Placed, dst: Placed): StraightLine | undefined {
  const down = dst.rect.top > src.rect.bottom;
  if (!down && dst.rect.bottom >= src.rect.top) {
    return undefined;
  }
  const [srcSide, dstSide]: RectSide[] = down ? ['bottom', 'top'] : ['top', 'bottom'];
  return {
    from: { node: src.node, rect: src.rect, side: srcSide },
    to: { node: dst.node, rect: dst.rect, side: dstSide },
    points: [
      { x: src.cx, y: down ? src.rect.bottom : src.rect.top },
      { x: src.cx, y: down ? dst.rect.top : dst.rect.bottom },
    ],
  };
}

/** The facing faces of two nodes side by side, joined at the source's centre. */
function horizontalLine(src: Placed, dst: Placed): StraightLine | undefined {
  const right = dst.rect.left > src.rect.right;
  if (!right && dst.rect.right >= src.rect.left) {
    return undefined;
  }
  const [srcSide, dstSide]: RectSide[] = right ? ['right', 'left'] : ['left', 'right'];
  return {
    from: { node: src.node, rect: src.rect, side: srcSide },
    to: { node: dst.node, rect: dst.rect, side: dstSide },
    points: [
      { x: right ? src.rect.right : src.rect.left, y: src.cy },
      { x: right ? dst.rect.left : dst.rect.right, y: src.cy },
    ],
  };
}

/** The edge's two nodes, when they are distinct nodes in different groups. */
function crossGroupPair(edge: Edge, nodeByIdMap: Map<string, Node>): [Placed, Placed] | undefined {
  const src = placed(nodeByIdMap.get(edge.start ?? ''));
  const dst = placed(nodeByIdMap.get(edge.end ?? ''));
  if (!src || !dst || src.node === dst.node) {
    return undefined;
  }
  return src.node.parentId === dst.node.parentId ? undefined : [src, dst];
}

/** The straight line between the facing faces of two aligned nodes in different groups. */
function straightLineFor(edge: Edge, nodeByIdMap: Map<string, Node>): StraightLine | undefined {
  const pair = crossGroupPair(edge, nodeByIdMap);
  if (!pair) {
    return undefined;
  }
  const [src, dst] = pair;
  if (Math.abs(src.cx - dst.cx) <= ALIGNED_CENTRE_TOLERANCE) {
    return verticalLine(src, dst);
  }
  return Math.abs(src.cy - dst.cy) <= ALIGNED_CENTRE_TOLERANCE
    ? horizontalLine(src, dst)
    : undefined;
}

const isAlready = (current: Point[], line: Point[]): boolean =>
  current.length === line.length &&
  current.every((p, i) => Math.abs(p.x - line[i].x) < EPS && Math.abs(p.y - line[i].y) < EPS);

function lineIsClear(
  edge: Edge,
  line: StraightLine,
  current: Point[],
  edges: Edge[],
  obstacles: Obstacles
): boolean {
  return (
    faceIsOwn(line.from, edge, edges) &&
    faceIsOwn(line.to, edge, edges) &&
    clearOfNodes(edge, line.points, obstacles) &&
    clearOfOtherEdges(edge, current, line.points, edges)
  );
}

function straighten(
  edge: Edge,
  edges: Edge[],
  nodeByIdMap: Map<string, Node>,
  obstacles: Obstacles
): boolean {
  const line = straightLineFor(edge, nodeByIdMap);
  const current = dedupeConsecutivePoints(edge.points ?? [], EPS);
  if (!line || current.length < 2 || isAlready(current, line.points)) {
    return false;
  }
  if (!lineIsClear(edge, line, current, edges, obstacles)) {
    return false;
  }
  edge.points = line.points;
  return true;
}

/**
 * Replaces the route of an edge between two nodes in different groups (lanes, or subgraphs inside them) whose centres are
 * aligned within {@link ALIGNED_CENTRE_TOLERANCE} by one straight segment between their facing
 * faces: a diamond's vertex, a rectangle's face centre. An edge keeps its route when another edge
 * meets either node through those faces, when the segment would pass a node or a label, overlap
 * an edge, or cross or touch an edge the current route does not. Returns whether any route
 * changed; the caller re-anchors labels and re-prepares endpoints for the renderer.
 */
export function straightenAlignedCrossLaneEdges(
  edges: Edge[],
  nodeByIdMap: Map<string, Node>
): boolean {
  const obstacles = collectNodeRectEntries(nodeByIdMap.values());
  let changed = false;
  for (const edge of edges) {
    if (!edge.isLayoutOnly && straighten(edge, edges, nodeByIdMap, obstacles)) {
      changed = true;
    }
  }
  return changed;
}
