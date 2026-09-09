/**
 * Internal layout model for the faithful HOLA implementation.
 *
 * Guide §6: the algorithm never touches Mermaid renderer objects. Everything is
 * converted into this explicit model first and written back at the very end.
 * IDs are kept in distinct namespaces (see `ids.ts`) so no stage ever has to
 * inspect an id string for `_copy`/`bend_`/`cross_` markers.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  /** Centre x. */
  x: number;
  /** Centre y. */
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * The outline of a non-rectangular node, in node-local coordinates with the
 * centre at the origin. Recovered from the shape's `intersect` function by
 * `adapter/silhouette.ts`; absent for a plain rectangle, which is the case every
 * rectangle-based code path already handles.
 */
export interface Silhouette {
  points: Point[];
}

/** Compass direction. `y` grows downward, so NORTH is -y. */
export type Cardinal = 'N' | 'S' | 'E' | 'W';
export type Ordinal = 'NE' | 'NW' | 'SE' | 'SW';
export type Direction = Cardinal | Ordinal;

export type Axis = 'x' | 'y';

/**
 * A node in the HOLA topology. Only ordinary Mermaid nodes reach this type —
 * subgraph containers and edge-label dummies never do (guide §3.2, §3.3).
 */
export interface HolaNode {
  id: string;
  width: number;
  height: number;
  /** Position of this node in the original Mermaid node array; the universal tie-break. */
  inputOrder: number;
  x: number;
  y: number;
  /** Opaque handle back to the Mermaid node, used only for write-back. */
  original: unknown;
  /**
   * Outline of a non-rectangular shape, so ports land on the shape rather than
   * on its bounding box. Obstacles stay rectangular either way.
   */
  silhouette?: Silhouette;
}

export interface MandatoryWaypoint {
  id: string;
  /** The topological edge the bend belongs to. */
  edgeId: string;
  /** Position along the edge; ascending from source to target. */
  order: number;
  x: number;
  y: number;
  source: 'chain-aesthetic-bend';
}

/**
 * A topological edge. Parallel Mermaid edges collapse onto one of these
 * (guide §3.4) and the bundle is expanded again during final routing.
 */
export interface HolaEdge {
  id: string;
  source: string;
  target: string;
  /** Every original Mermaid edge id represented by this topological edge. */
  originalEdgeIds: string[];
  route: Point[];
  sourceSide?: Side;
  targetSide?: Side;
  mandatoryWaypoints: MandatoryWaypoint[];
}

export interface HolaGraph {
  nodes: Map<string, HolaNode>;
  edges: Map<string, HolaEdge>;
  /** Unique undirected neighbours. Self-loops are excluded (guide §3.4). */
  adjacency: Map<string, Set<string>>;
}

/** A Mermaid edge that could not become part of the topology but must still be drawn. */
export interface DeferredEdge {
  originalEdgeId: string;
  source: string;
  target: string;
}

export function createGraph(): HolaGraph {
  return { nodes: new Map(), edges: new Map(), adjacency: new Map() };
}

export function addNode(graph: HolaGraph, node: HolaNode): void {
  graph.nodes.set(node.id, node);
  if (!graph.adjacency.has(node.id)) {
    graph.adjacency.set(node.id, new Set());
  }
}

export function addEdge(graph: HolaGraph, edge: HolaEdge): void {
  graph.edges.set(edge.id, edge);
  graph.adjacency.get(edge.source)?.add(edge.target);
  graph.adjacency.get(edge.target)?.add(edge.source);
}

export function neighbours(graph: HolaGraph, id: string): string[] {
  return [...(graph.adjacency.get(id) ?? [])];
}

export function degree(graph: HolaGraph, id: string): number {
  return graph.adjacency.get(id)?.size ?? 0;
}

export function nodeBounds(node: Rect): Bounds {
  return {
    minX: node.x - node.width / 2,
    minY: node.y - node.height / 2,
    maxX: node.x + node.width / 2,
    maxY: node.y + node.height / 2,
  };
}

export function unionBounds(list: Bounds[]): Bounds | undefined {
  if (list.length === 0) {
    return undefined;
  }
  return list.reduce((acc, b) => ({
    minX: Math.min(acc.minX, b.minX),
    minY: Math.min(acc.minY, b.minY),
    maxX: Math.max(acc.maxX, b.maxX),
    maxY: Math.max(acc.maxY, b.maxY),
  }));
}

export function pointBounds(points: Point[]): Bounds | undefined {
  if (points.length === 0) {
    return undefined;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

export function boundsWidth(b: Bounds): number {
  return b.maxX - b.minX;
}

export function boundsHeight(b: Bounds): number {
  return b.maxY - b.minY;
}

export function rectsOverlap(a: Bounds, b: Bounds, epsilon = 1e-6): boolean {
  return (
    a.minX < b.maxX - epsilon &&
    b.minX < a.maxX - epsilon &&
    a.minY < b.maxY - epsilon &&
    b.minY < a.maxY - epsilon
  );
}

/** Unit vector of a compass direction in screen coordinates (y down). */
export const DIRECTION_VECTOR: Record<Direction, Point> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
  NE: { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
  NW: { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  SE: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
  SW: { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
};

export const CARDINALS: Cardinal[] = ['E', 'S', 'W', 'N'];
export const ORDINALS: Ordinal[] = ['SE', 'SW', 'NW', 'NE'];
export const ALL_DIRECTIONS: Direction[] = [...CARDINALS, ...ORDINALS];

/**
 * Angle of a cardinal direction measured clockwise from EAST in screen
 * coordinates. The clockwise convention matches `Math.atan2(dy, dx)` with y
 * growing downward, so the cyclic order E → S → W → N is the cyclic order of
 * increasing atan2.
 */
export const CARDINAL_ANGLE: Record<Cardinal, number> = {
  E: 0,
  S: Math.PI / 2,
  W: Math.PI,
  N: (3 * Math.PI) / 2,
};

export function sideOfCardinal(direction: Cardinal): Side {
  switch (direction) {
    case 'N':
      return 'top';
    case 'S':
      return 'bottom';
    case 'E':
      return 'right';
    case 'W':
      return 'left';
  }
}

export function oppositeSide(side: Side): Side {
  switch (side) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

/** Normalise an angle into `[0, 2π)`. */
export function normaliseAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/** Shortest arc between two angles, in `[0, π]`. */
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normaliseAngle(a) - normaliseAngle(b));
  return Math.min(diff, 2 * Math.PI - diff);
}
