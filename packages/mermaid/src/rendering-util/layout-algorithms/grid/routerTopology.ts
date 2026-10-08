import { compareCodeUnits } from '../layout-utils/helpers.js';
import {
  GridRoutingResourceLimitError,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';
import type {
  ContainerRoutingTopology,
  GridOrientation,
  GridSide,
  OrthogonalIntervalIndex,
  PairedPortal,
  PortalRange,
  RouterArc,
  RouterObstacle,
  RouterPoint,
  RouterRect,
  RouterSearchArc,
  RouterVertex,
} from './types.js';

// Builds immutable orthogonal visibility graphs per container. Endpoint-specific vertices are added
// through bounded overlays so the expensive obstacle sweep is paid once per container.
export const ROUTE_CLEARANCE_PX = 6;

/**
 * Parallel runs of different edges closer than this are hard to tell apart, so candidates avoid them.
 * Perpendicular crossings are not affected. Lives here (rather than routerOccupancy.ts) because it is
 * shared with routerPlanning.ts and routerConstraint.ts already imports from this module.
 */
export const EDGE_CLEARANCE_PX = 24;

// Caps bound both adversarial geometry and ordinary large-diagram memory growth. Exceeding one is a
// recoverable routing condition handled by the validated compatibility path.
const DEFAULT_MAX_VERTICES = 50_000;
const MAX_VISIBILITY_ADJACENCY_PER_VERTEX = 4;
export const DEFAULT_MAX_ROUTING_ESTIMATED_BYTES = 64 * 1024 * 1024;

export interface RouterObstacleInput {
  id: string;
  bounds: RouterRect;
}

export interface ContainerTopologyInput {
  containerId: string;
  bounds: RouterRect;
  obstacles: readonly RouterObstacleInput[];
  titleExclusions?: readonly RouterObstacleInput[];
  portalRanges?: readonly PortalRange[];
}

export interface TopologyResourceCaps {
  maxVertices?: number;
  maxAdjacencyEntries?: number;
  maxEstimatedBytes?: number;
}

export interface BuildTopologyOptions {
  metrics?: GridRoutingInstrumentation;
  caps?: TopologyResourceCaps;
}

interface VertexRecord {
  point: RouterPoint;
  kind: RouterVertex['kind'];
  ownerId?: string;
  side?: GridSide;
}

interface IndexedBand {
  low: number;
  high: number;
  intervals: readonly (readonly [number, number])[];
}

class CompressedIntervalIndex implements OrthogonalIntervalIndex {
  // Obstacle occupancy is constant between sorted boundaries, so bands share merged interval lists.
  // Exact boundaries use strict intervals to allow visibility paths to run along obstacle edges.
  readonly coordinateCount: number;
  readonly intervalCount: number;
  private readonly byLow = new Map<number, IndexedBand>();
  private readonly byHigh = new Map<number, IndexedBand>();

  constructor(
    private readonly bands: readonly IndexedBand[],
    private readonly strictBoundaryIntervals: ReadonlyMap<
      number,
      readonly (readonly [number, number])[]
    >
  ) {
    this.coordinateCount = new Set(bands.flatMap(({ low, high }) => [low, high])).size;
    let intervalCount = bands.reduce((total, band) => total + band.intervals.length, 0);
    for (const intervals of strictBoundaryIntervals.values()) {
      intervalCount += intervals.length;
    }
    this.intervalCount = intervalCount;
    for (const band of bands) {
      this.byLow.set(band.low, band);
      this.byHigh.set(band.high, band);
    }
    Object.freeze(this.bands);
    Object.freeze(this);
  }

  private containingBand(coordinate: number): IndexedBand | undefined {
    let low = 0;
    let high = this.bands.length - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const band = this.bands[middle];
      if (coordinate <= band.low) {
        high = middle - 1;
      } else if (coordinate >= band.high) {
        low = middle + 1;
      } else {
        return band;
      }
    }
    return undefined;
  }

  private overlaps(
    intervals: readonly (readonly [number, number])[],
    low: number,
    high: number
  ): boolean {
    let left = 0;
    let right = intervals.length;
    while (left < right) {
      const middle = (left + right) >>> 1;
      if (intervals[middle][1] <= low) {
        left = middle + 1;
      } else {
        right = middle;
      }
    }
    return left < intervals.length && intervals[left][0] < high;
  }

  intersects(coordinate: number, intervalStart: number, intervalEnd: number): boolean {
    const low = Math.min(intervalStart, intervalEnd);
    const high = Math.max(intervalStart, intervalEnd);
    const before = this.byHigh.get(coordinate);
    const after = this.byLow.get(coordinate);
    const containing = before || after ? undefined : this.containingBand(coordinate);
    if (containing) {
      return this.overlaps(containing.intervals, low, high);
    }
    if (!before || !after) {
      return false;
    }
    let beforeIndex = 0;
    let afterIndex = 0;
    while (beforeIndex < before.intervals.length && afterIndex < after.intervals.length) {
      const overlapLow = Math.max(
        low,
        before.intervals[beforeIndex][0],
        after.intervals[afterIndex][0]
      );
      const overlapHigh = Math.min(
        high,
        before.intervals[beforeIndex][1],
        after.intervals[afterIndex][1]
      );
      if (overlapLow < overlapHigh) {
        return true;
      }
      if (before.intervals[beforeIndex][1] < after.intervals[afterIndex][1]) {
        beforeIndex++;
      } else {
        afterIndex++;
      }
    }
    return false;
  }

  contains(coordinate: number, varying: number): boolean {
    const intervals =
      this.strictBoundaryIntervals.get(coordinate) ?? this.containingBand(coordinate)?.intervals;
    if (!intervals) {
      return false;
    }
    let low = 0;
    let high = intervals.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (intervals[middle][0] < varying) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low > 0 && varying < intervals[low - 1][1];
  }

  nearestBoundary(coordinate: number, origin: number, direction: -1 | 1): number | undefined {
    const intervals =
      this.strictBoundaryIntervals.get(coordinate) ?? this.containingBand(coordinate)?.intervals;
    if (!intervals) {
      return undefined;
    }
    if (direction < 0) {
      let low = 0;
      let high = intervals.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (intervals[middle][1] <= origin) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      return low > 0 ? intervals[low - 1][1] : undefined;
    }
    let low = 0;
    let high = intervals.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (intervals[middle][0] < origin) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low < intervals.length ? intervals[low][0] : undefined;
  }
}

class ImmutableMap<K, V> implements ReadonlyMap<K, V> {
  readonly [Symbol.toStringTag] = 'ImmutableMap';

  constructor(private readonly backing: ReadonlyMap<K, V>) {
    Object.freeze(this);
  }

  get size(): number {
    return this.backing.size;
  }

  entries(): MapIterator<[K, V]> {
    return this.backing.entries();
  }

  forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void {
    for (const [key, value] of this.backing) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  get(key: K): V | undefined {
    return this.backing.get(key);
  }

  has(key: K): boolean {
    return this.backing.has(key);
  }

  keys(): MapIterator<K> {
    return this.backing.keys();
  }

  values(): MapIterator<V> {
    return this.backing.values();
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}

class OverlayMap<K, V> implements ReadonlyMap<K, V> {
  readonly [Symbol.toStringTag] = 'OverlayMap';

  constructor(
    private readonly base: ReadonlyMap<K, V>,
    private readonly overrides: ReadonlyMap<K, V>
  ) {}

  get size(): number {
    let added = 0;
    for (const key of this.overrides.keys()) {
      if (!this.base.has(key)) {
        added++;
      }
    }
    return this.base.size + added;
  }

  private materialize(): Map<K, V> {
    return new Map([...this.base, ...this.overrides]);
  }

  entries(): MapIterator<[K, V]> {
    return this.materialize().entries();
  }

  forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void {
    for (const [key, value] of this) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  get(key: K): V | undefined {
    return this.overrides.get(key) ?? this.base.get(key);
  }

  has(key: K): boolean {
    return this.overrides.has(key) || this.base.has(key);
  }

  keys(): MapIterator<K> {
    return this.materialize().keys();
  }

  values(): MapIterator<V> {
    return this.materialize().values();
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}

function overlayArray<T>(base: readonly T[], additions: readonly T[]): readonly T[] {
  // Numeric access and iteration are enough for search. A proxy avoids copying the immutable base
  // array for every endpoint pair.
  return new Proxy([] as T[], {
    get(_target, property) {
      if (property === 'length') {
        return base.length + additions.length;
      }
      if (property === Symbol.iterator) {
        return function* () {
          yield* base;
          yield* additions;
        };
      }
      if (typeof property === 'string' && /^\d+$/.test(property)) {
        const index = Number(property);
        return index < base.length ? base[index] : additions[index - base.length];
      }
      return Reflect.get(Array.prototype, property);
    },
  });
}

function overrideArray<T>(
  base: readonly T[],
  overrides: ReadonlyMap<number, T>,
  length: number
): readonly T[] {
  return new Proxy([] as T[], {
    get(_target, property) {
      if (property === 'length') {
        return length;
      }
      if (property === Symbol.iterator) {
        return function* () {
          for (let index = 0; index < length; index++) {
            yield overrides.get(index) ?? base[index];
          }
        };
      }
      if (typeof property === 'string' && /^\d+$/.test(property)) {
        const index = Number(property);
        return overrides.get(index) ?? base[index];
      }
      return Reflect.get(Array.prototype, property);
    },
  });
}

export class EndpointOverlayScratch {
  // One scratch object belongs to one base topology. The undo log clears only overridden base
  // vertices, keeping reset cost proportional to the previous overlay rather than the whole graph.
  readonly addedVertices: RouterVertex[] = [];
  readonly adjacencyOverrides = new Map<number, readonly RouterArc[]>();
  readonly searchAdjacencyOverrides = new Map<number, readonly RouterSearchArc[]>();
  readonly pointOverrides = new Map<string, number>();
  readonly undoLog: number[] = [];
  resetCount = 0;

  constructor(readonly base: ContainerRoutingTopology) {}

  reset(base: ContainerRoutingTopology): void {
    if (base !== this.base) {
      throw new Error('Endpoint overlay scratch cannot be shared across base topologies');
    }
    for (const id of this.undoLog) {
      this.adjacencyOverrides.delete(id);
      this.searchAdjacencyOverrides.delete(id);
    }
    this.undoLog.length = 0;
    this.addedVertices.length = 0;
    this.pointOverrides.clear();
    this.resetCount++;
  }

  setArcs(id: number, arcs: readonly RouterArc[]): void {
    if (!this.adjacencyOverrides.has(id)) {
      this.undoLog.push(id);
    }
    this.adjacencyOverrides.set(id, arcs);
    this.searchAdjacencyOverrides.set(id, searchArcs(arcs));
  }
}

function normalizeCoordinate(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function normalizeRect(rect: RouterRect): RouterRect {
  const values = [rect.left, rect.right, rect.top, rect.bottom];
  if (!values.every(Number.isFinite)) {
    throw new Error('Grid routing geometry must contain only finite coordinates');
  }
  const left = normalizeCoordinate(Math.min(rect.left, rect.right));
  const right = normalizeCoordinate(Math.max(rect.left, rect.right));
  const top = normalizeCoordinate(Math.min(rect.top, rect.bottom));
  const bottom = normalizeCoordinate(Math.max(rect.top, rect.bottom));
  if (left === right || top === bottom) {
    // The production layout path should reject zero-area nodes before routing; this guards direct
    // topology callers and invalid derived geometry.
    throw new Error('Grid routing rectangles must have positive area');
  }
  return { left, right, top, bottom };
}

function inflateAndClip(
  input: RouterObstacleInput,
  domain: RouterRect
): RouterObstacle | undefined {
  const bounds = normalizeRect(input.bounds);
  const obstacle = {
    id: input.id,
    left: Math.max(domain.left, bounds.left - ROUTE_CLEARANCE_PX),
    right: Math.min(domain.right, bounds.right + ROUTE_CLEARANCE_PX),
    top: Math.max(domain.top, bounds.top - ROUTE_CLEARANCE_PX),
    bottom: Math.min(domain.bottom, bounds.bottom + ROUTE_CLEARANCE_PX),
  };
  return obstacle.left < obstacle.right && obstacle.top < obstacle.bottom ? obstacle : undefined;
}

function mergeObstacleIntervals(
  intervals: { low: number; high: number; id: string }[]
): { low: number; high: number; id: string }[] {
  const sorted = [...intervals].sort(
    (a, b) => a.low - b.low || a.high - b.high || compareCodeUnits(a.id, b.id)
  );
  const merged: { low: number; high: number; id: string }[] = [];
  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.low > previous.high) {
      merged.push({ ...interval });
      continue;
    }
    previous.high = Math.max(previous.high, interval.high);
    if (compareCodeUnits(interval.id, previous.id) < 0) {
      previous.id = interval.id;
    }
  }
  return merged;
}

function unionObstacles(obstacles: readonly RouterObstacle[]): RouterObstacle[] {
  // Sweep x-slabs and merge active y-intervals into a non-overlapping obstacle union. This prevents
  // intersecting inflated nodes and title exclusions from multiplying visibility vertices.
  const events = new Map<number, { starts: RouterObstacle[]; ends: RouterObstacle[] }>();
  for (const obstacle of obstacles) {
    const start = events.get(obstacle.left) ?? { starts: [], ends: [] };
    start.starts.push(obstacle);
    events.set(obstacle.left, start);
    const end = events.get(obstacle.right) ?? { starts: [], ends: [] };
    end.ends.push(obstacle);
    events.set(obstacle.right, end);
  }
  const xCoordinates = [...events.keys()].sort((a, b) => a - b);
  const active = new Set<RouterObstacle>();
  const slabs: RouterObstacle[] = [];
  let previousByInterval = new Map<string, RouterObstacle>();
  for (let index = 0; index < xCoordinates.length - 1; index++) {
    const left = xCoordinates[index];
    const right = xCoordinates[index + 1];
    const event = events.get(left)!;
    for (const obstacle of event.ends) {
      active.delete(obstacle);
    }
    for (const obstacle of event.starts) {
      active.add(obstacle);
    }
    const nextByInterval = new Map<string, RouterObstacle>();
    for (const interval of mergeObstacleIntervals(
      [...active].map((obstacle) => ({
        low: obstacle.top,
        high: obstacle.bottom,
        id: obstacle.id,
      }))
    )) {
      const key = `${interval.low}:${interval.high}`;
      const previous = previousByInterval.get(key);
      if (previous) {
        previous.right = right;
        if (compareCodeUnits(interval.id, previous.id) < 0) {
          previous.id = interval.id;
        }
      } else {
        const slab = {
          id: interval.id,
          left,
          right,
          top: interval.low,
          bottom: interval.high,
        };
        slabs.push(slab);
        nextByInterval.set(key, slab);
        continue;
      }
      nextByInterval.set(key, previous);
    }
    previousByInterval = nextByInterval;
  }
  return slabs.sort(
    (a, b) =>
      a.top - b.top ||
      a.left - b.left ||
      a.bottom - b.bottom ||
      a.right - b.right ||
      compareCodeUnits(a.id, b.id)
  );
}

export function routingPointKey(point: RouterPoint): string {
  return `${normalizeCoordinate(point.x)}:${normalizeCoordinate(point.y)}`;
}

function topologySideOrdinal(side?: GridSide): number {
  return side === 'left'
    ? 0
    : side === 'right'
      ? 1
      : side === 'top'
        ? 2
        : side === 'bottom'
          ? 3
          : 4;
}

function vertexRecordOrder(a: VertexRecord, b: VertexRecord): number {
  return (
    compareCodeUnits(a.kind, b.kind) ||
    topologySideOrdinal(a.side) - topologySideOrdinal(b.side) ||
    a.point.x - b.point.x ||
    a.point.y - b.point.y ||
    compareCodeUnits(a.ownerId ?? '', b.ownerId ?? '')
  );
}

function canonicalRecords(records: readonly VertexRecord[]): VertexRecord[] {
  // Sorting before duplicate removal makes vertex identity and numeric ids independent of discovery
  // order.
  const byPoint = new Map<string, VertexRecord>();
  for (const record of [...records].sort(vertexRecordOrder)) {
    const normalized = {
      ...record,
      point: {
        x: normalizeCoordinate(record.point.x),
        y: normalizeCoordinate(record.point.y),
      },
    };
    const key = routingPointKey(normalized.point);
    if (!byPoint.has(key)) {
      byPoint.set(key, normalized);
    }
  }
  return [...byPoint.values()];
}

function cornerRecords(
  bounds: RouterRect,
  ownerId: string,
  kind: RouterVertex['kind'] = 'corner'
): VertexRecord[] {
  return [
    { point: { x: bounds.left, y: bounds.top }, kind, ownerId },
    { point: { x: bounds.right, y: bounds.top }, kind, ownerId },
    { point: { x: bounds.left, y: bounds.bottom }, kind, ownerId },
    { point: { x: bounds.right, y: bounds.bottom }, kind, ownerId },
  ];
}

function portalRecords(range: PortalRange, bounds: RouterRect): VertexRecord[] {
  const coordinate =
    range.coordinate ??
    (range.side === 'left'
      ? bounds.left
      : range.side === 'right'
        ? bounds.right
        : range.side === 'top'
          ? bounds.top
          : bounds.bottom);
  const points =
    range.side === 'left' || range.side === 'right'
      ? [
          { x: coordinate, y: range.low },
          { x: coordinate, y: range.high },
        ]
      : [
          { x: range.low, y: coordinate },
          { x: range.high, y: coordinate },
        ];
  return points.map((value) => ({
    point: value,
    kind: 'portal',
    ownerId: range.ownerId,
    side: range.side,
  }));
}

function rayHit(
  point: RouterPoint,
  side: GridSide,
  bounds: RouterRect,
  horizontalIntervals: OrthogonalIntervalIndex,
  verticalIntervals: OrthogonalIntervalIndex
): RouterPoint {
  if (side === 'left' || side === 'right') {
    const hit =
      horizontalIntervals.nearestBoundary(point.y, point.x, side === 'left' ? -1 : 1) ??
      (side === 'left' ? bounds.left : bounds.right);
    return { x: hit, y: point.y };
  }

  const hit =
    verticalIntervals.nearestBoundary(point.x, point.y, side === 'top' ? -1 : 1) ??
    (side === 'top' ? bounds.top : bounds.bottom);
  return { x: point.x, y: hit };
}

function createIntervalIndex(
  obstacles: readonly RouterObstacle[],
  orientation: GridOrientation,
  budget: { intervalCount: number; maxEstimatedBytes: number }
): OrthogonalIntervalIndex {
  const coordinates = [
    ...new Set(
      obstacles.flatMap((obstacle) =>
        orientation === 'H' ? [obstacle.top, obstacle.bottom] : [obstacle.left, obstacle.right]
      )
    ),
  ].sort((a, b) => a - b);
  const bands: IndexedBand[] = [];
  const strictBoundaryIntervals = new Map<number, readonly (readonly [number, number])[]>();
  const starts = new Map<number, RouterObstacle[]>();
  const ends = new Map<number, RouterObstacle[]>();
  for (const obstacle of obstacles) {
    const start = orientation === 'H' ? obstacle.top : obstacle.left;
    const end = orientation === 'H' ? obstacle.bottom : obstacle.right;
    const startEvents = starts.get(start) ?? [];
    startEvents.push(obstacle);
    starts.set(start, startEvents);
    const endEvents = ends.get(end) ?? [];
    endEvents.push(obstacle);
    ends.set(end, endEvents);
  }
  const active = new Set<RouterObstacle>();
  const activeIntervals = () =>
    mergeObstacleIntervals(
      [...active].map((obstacle) =>
        orientation === 'H'
          ? { low: obstacle.left, high: obstacle.right, id: obstacle.id }
          : { low: obstacle.top, high: obstacle.bottom, id: obstacle.id }
      )
    );
  const freezeIntervals = (
    intervals: readonly { low: number; high: number }[]
  ): readonly (readonly [number, number])[] => {
    const intervalCount = budget.intervalCount + intervals.length;
    enforceCap(
      estimatedTopologyBytes(0, 0, obstacles.length, intervalCount),
      budget.maxEstimatedBytes,
      'estimated_memory_cap'
    );
    budget.intervalCount = intervalCount;
    return Object.freeze(
      intervals.map((interval) => Object.freeze([interval.low, interval.high] as const))
    );
  };
  for (let index = 0; index < coordinates.length; index++) {
    const coordinate = coordinates[index];
    for (const obstacle of ends.get(coordinate) ?? []) {
      active.delete(obstacle);
    }
    strictBoundaryIntervals.set(coordinate, freezeIntervals(activeIntervals()));
    for (const obstacle of starts.get(coordinate) ?? []) {
      active.add(obstacle);
    }
    const high = coordinates[index + 1];
    if (high === undefined) {
      continue;
    }
    const intervals = activeIntervals();
    if (intervals.length > 0) {
      bands.push({
        low: coordinate,
        high,
        intervals: freezeIntervals(intervals),
      });
    }
  }
  return new CompressedIntervalIndex(
    Object.freeze(bands),
    new ImmutableMap(strictBoundaryIntervals)
  );
}

function estimatedTopologyBytes(
  vertices: number,
  adjacencyEntries: number,
  obstacles: number,
  intervals: number
): number {
  return vertices * 64 + adjacencyEntries * 56 + obstacles * 48 + intervals * 24;
}

function enforceCap(
  actual: number,
  maximum: number,
  reason: 'vertex_cap' | 'adjacency_cap' | 'estimated_memory_cap'
): void {
  if (actual > maximum) {
    throw new GridRoutingResourceLimitError(
      reason,
      `Grid routing ${reason} exceeded: ${actual} > ${maximum}`
    );
  }
}

function indexVertexLines(
  vertices: readonly RouterVertex[],
  orientation: GridOrientation
): ReadonlyMap<number, readonly RouterVertex[]> {
  const lines = new Map<number, RouterVertex[]>();
  for (const vertex of vertices) {
    const fixed = orientation === 'H' ? vertex.point.y : vertex.point.x;
    const line = lines.get(fixed) ?? [];
    line.push(vertex);
    lines.set(fixed, line);
  }

  for (const line of lines.values()) {
    line.sort((a, b) =>
      orientation === 'H'
        ? a.point.x - b.point.x || a.id - b.id
        : a.point.y - b.point.y || a.id - b.id
    );
    Object.freeze(line);
  }
  return new ImmutableMap(lines);
}

function searchArcs(arcs: readonly RouterArc[]): readonly RouterSearchArc[] {
  /*
   * Occupancy and crossing tie-breakers are left for future route-quality work.
   *
   * A minimal implementation could scan every committed route segment for every candidate arc:
   * - Sum collinear overlap into an occupied-length cost.
   * - Count perpendicular interior intersections as crossings.
   * - Pass those values into the search arcs.
   * - Recompute them after each committed route.
   *
   * That approach is simple, but likely too expensive: roughly routes x route segments x graph
   * arcs for each edge search. It also risks inconsistent handling of endpoints, terminal
   * segments, portals, and touching-versus-crossing geometry.
   *
   * A production-quality implementation would need:
   * - A container-scoped horizontal/vertical segment index.
   * - Efficient overlap and perpendicular-intersection queries.
   * - Dynamic search or overlay costs without mutating the immutable base topology.
   * - Updates only after route validation succeeds.
   * - Rollback support for bundle retries.
   * - Clear rules for endpoint touches, partial shared arcs, hierarchy segments, and routes that
   *   span multiple containers.
   * - Search tests proving occupancy changes only the intended late tie-breakers.
   * - Routing tests showing reduced sharing and crossings.
   * - Performance tests for the 500-edge contract.
   */
  return Object.freeze(
    arcs.map((arc) =>
      Object.freeze({
        to: arc.to,
        orientationOrdinal: arc.orientation === 'H' ? 1 : 2,
        length: arc.length,
        boundaryTransitions: arc.kind === 'portal' ? 1 : 0,
      } as const)
    )
  );
}

function buildVisibilityGraph(
  records: readonly VertexRecord[],
  horizontalIntervals: OrthogonalIntervalIndex,
  verticalIntervals: OrthogonalIntervalIndex,
  caps: TopologyResourceCaps
): {
  vertices: readonly RouterVertex[];
  adjacency: ReadonlyMap<number, readonly RouterArc[]>;
  adjacencyEntries: number;
} {
  // Vertices connect only to their immediate visible neighbor on each shared x/y line; longer paths
  // are represented by graph traversal instead of quadratic all-pairs arcs.
  const canonical = canonicalRecords(records).sort(vertexRecordOrder);
  const vertexCap = caps.maxVertices ?? DEFAULT_MAX_VERTICES;
  enforceCap(canonical.length, vertexCap, 'vertex_cap');
  const vertices = canonical.map<RouterVertex>((record, id) =>
    Object.freeze({ id, ...record, point: Object.freeze({ ...record.point }) })
  );
  const adjacency = new Map<number, RouterArc[]>(
    vertices.map((vertex) => [vertex.id, [] as RouterArc[]])
  );
  const addArcPair = (a: RouterVertex, b: RouterVertex, orientation: GridOrientation) => {
    const length = Math.abs(a.point.x - b.point.x) + Math.abs(a.point.y - b.point.y);
    if (length === 0) {
      return;
    }

    const intervalStart =
      orientation === 'H' ? Math.min(a.point.x, b.point.x) : Math.min(a.point.y, b.point.y);
    const intervalEnd = intervalStart + length;
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      adjacency.get(from.id)!.push({
        from: from.id,
        to: to.id,
        orientation,
        length,
        kind: 'visibility',
        intervalStart,
        intervalEnd,
      });
    }
  };

  for (const orientation of ['H', 'V'] as const) {
    const lines = new Map<number, RouterVertex[]>();
    for (const vertex of vertices) {
      const coordinate = orientation === 'H' ? vertex.point.y : vertex.point.x;
      const line = lines.get(coordinate) ?? [];
      line.push(vertex);
      lines.set(coordinate, line);
    }
    for (const [fixed, line] of lines) {
      line.sort((a, b) =>
        orientation === 'H'
          ? a.point.x - b.point.x || a.id - b.id
          : a.point.y - b.point.y || a.id - b.id
      );
      for (let index = 1; index < line.length; index++) {
        const a = line[index - 1];
        const b = line[index];
        const start = orientation === 'H' ? a.point.x : a.point.y;
        const end = orientation === 'H' ? b.point.x : b.point.y;
        const intervalIndex = orientation === 'H' ? horizontalIntervals : verticalIntervals;
        if (!intervalIndex.intersects(fixed, start, end)) {
          addArcPair(a, b, orientation);
        }
      }
    }
  }

  const arcKindOrder: Record<RouterArc['kind'], number> = {
    visibility: 0,
    terminal: 1,
    portal: 2,
    lane: 3,
  };
  let adjacencyEntries = 0;
  const immutableAdjacency = new Map<number, readonly RouterArc[]>();
  for (const vertex of vertices) {
    const arcs = adjacency.get(vertex.id)!;
    arcs.sort(
      (a, b) =>
        arcKindOrder[a.kind] - arcKindOrder[b.kind] ||
        compareCodeUnits(a.orientation, b.orientation) ||
        vertices[a.to].point.x - vertices[b.to].point.x ||
        vertices[a.to].point.y - vertices[b.to].point.y ||
        a.to - b.to
    );
    const unique = arcs.filter(
      (arc, index) =>
        index === 0 ||
        arc.to !== arcs[index - 1].to ||
        arc.orientation !== arcs[index - 1].orientation ||
        arc.kind !== arcs[index - 1].kind
    );
    adjacencyEntries += unique.length;
    immutableAdjacency.set(vertex.id, Object.freeze(unique.map((arc) => Object.freeze(arc))));
  }
  enforceCap(
    adjacencyEntries,
    // Each vertex has at most one immediate visible neighbor in each cardinal direction. The
    // override remains a test seam for exercising adjacency-cap fallback behavior.
    caps.maxAdjacencyEntries ?? vertexCap * MAX_VISIBILITY_ADJACENCY_PER_VERTEX,
    'adjacency_cap'
  );
  return {
    vertices: Object.freeze(vertices),
    adjacency: new ImmutableMap(immutableAdjacency),
    adjacencyEntries,
  };
}

export function derivePortalRanges(
  ownerId: string,
  rawBounds: RouterRect,
  rawTitle?: RouterRect
): PortalRange[] {
  const bounds = normalizeRect(rawBounds);
  const title = rawTitle ? normalizeRect(rawTitle) : undefined;
  const verticalLow = Math.max(
    bounds.top + ROUTE_CLEARANCE_PX,
    (title?.bottom ?? -Infinity) + ROUTE_CLEARANCE_PX
  );
  const verticalHigh = bounds.bottom - ROUTE_CLEARANCE_PX;
  const horizontalLow = bounds.left + ROUTE_CLEARANCE_PX;
  const horizontalHigh = bounds.right - ROUTE_CLEARANCE_PX;
  const ranges: PortalRange[] = [];
  if (verticalLow <= verticalHigh) {
    ranges.push(
      { ownerId, side: 'left', low: verticalLow, high: verticalHigh },
      { ownerId, side: 'right', low: verticalLow, high: verticalHigh }
    );
  }
  if (horizontalLow <= horizontalHigh) {
    ranges.push({ ownerId, side: 'bottom', low: horizontalLow, high: horizontalHigh });
    if (!title || title.bottom + ROUTE_CLEARANCE_PX <= bounds.top) {
      ranges.push({ ownerId, side: 'top', low: horizontalLow, high: horizontalHigh });
    }
  }
  return ranges;
}

export function buildPairedPortal(
  ownerId: string,
  bounds: RouterRect,
  title: RouterRect | undefined,
  side: GridSide,
  tangentialCoordinate: number
): PairedPortal {
  // Interior and exterior points sit one clearance unit from the group boundary. The explicit
  // transition is the only hierarchy-crossing arc and contributes one boundary transition to cost.
  const range = derivePortalRanges(ownerId, bounds, title).find((entry) => entry.side === side);
  if (!range || tangentialCoordinate < range.low || tangentialCoordinate > range.high) {
    throw new Error(`Illegal ${side} portal for "${ownerId}" at ${tangentialCoordinate}`);
  }
  const boundary =
    side === 'left'
      ? bounds.left
      : side === 'right'
        ? bounds.right
        : side === 'top'
          ? bounds.top
          : bounds.bottom;
  const inward =
    side === 'left' || side === 'top'
      ? boundary + ROUTE_CLEARANCE_PX
      : boundary - ROUTE_CLEARANCE_PX;
  const outward =
    side === 'left' || side === 'top'
      ? boundary - ROUTE_CLEARANCE_PX
      : boundary + ROUTE_CLEARANCE_PX;
  const interior =
    side === 'left' || side === 'right'
      ? { x: inward, y: tangentialCoordinate }
      : { x: tangentialCoordinate, y: inward };
  const exterior =
    side === 'left' || side === 'right'
      ? { x: outward, y: tangentialCoordinate }
      : { x: tangentialCoordinate, y: outward };
  return {
    ownerId,
    side,
    tangentialCoordinate,
    interior,
    exterior,
    transition: {
      from: interior,
      to: exterior,
      orientation: side === 'left' || side === 'right' ? 'H' : 'V',
      length: ROUTE_CLEARANCE_PX * 2,
      kind: 'portal',
    },
  };
}

export function buildContainerRoutingTopology(
  input: ContainerTopologyInput,
  options: BuildTopologyOptions = {}
): ContainerRoutingTopology {
  // Build phases are normalize/inflate, union obstacles, seed corners and portal endpoints, project
  // rays to blocking boundaries, then connect immediate line-of-sight neighbors.
  const bounds = normalizeRect(input.bounds);
  const inflated = [...input.obstacles, ...(input.titleExclusions ?? [])]
    .map((obstacle) => inflateAndClip(obstacle, bounds))
    .filter((obstacle): obstacle is RouterObstacle => Boolean(obstacle));
  const obstacles = unionObstacles(inflated);
  const portalRanges = [...(input.portalRanges ?? [])].sort(
    (a, b) =>
      topologySideOrdinal(a.side) - topologySideOrdinal(b.side) ||
      a.low - b.low ||
      a.high - b.high ||
      compareCodeUnits(a.ownerId, b.ownerId)
  );

  const seeds = canonicalRecords([
    ...cornerRecords(bounds, input.containerId),
    ...obstacles.flatMap((obstacle) => cornerRecords(obstacle, obstacle.id)),
    ...portalRanges.flatMap((range) => portalRecords(range, bounds)),
  ]);
  const intervalBudget = {
    intervalCount: 0,
    maxEstimatedBytes: options.caps?.maxEstimatedBytes ?? DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
  };
  enforceCap(
    estimatedTopologyBytes(0, 0, obstacles.length, 0),
    intervalBudget.maxEstimatedBytes,
    'estimated_memory_cap'
  );
  const horizontalIntervals = createIntervalIndex(obstacles, 'H', intervalBudget);
  const verticalIntervals = createIntervalIndex(obstacles, 'V', intervalBudget);
  const projections: VertexRecord[] = [];
  const sides: readonly GridSide[] = ['left', 'right', 'top', 'bottom'];
  for (const seed of seeds) {
    for (const side of sides) {
      const hit = rayHit(seed.point, side, bounds, horizontalIntervals, verticalIntervals);
      if (hit.x !== seed.point.x || hit.y !== seed.point.y) {
        projections.push({ point: hit, kind: 'projection', side });
      }
    }
  }

  const { vertices, adjacency, adjacencyEntries } = buildVisibilityGraph(
    [...seeds, ...projections],
    horizontalIntervals,
    verticalIntervals,
    options.caps ?? {}
  );

  const estimatedBytes = estimatedTopologyBytes(
    vertices.length,
    adjacencyEntries,
    obstacles.length,
    horizontalIntervals.intervalCount + verticalIntervals.intervalCount
  );
  enforceCap(
    estimatedBytes,
    options.caps?.maxEstimatedBytes ?? DEFAULT_MAX_ROUTING_ESTIMATED_BYTES,
    'estimated_memory_cap'
  );

  if (options.metrics) {
    options.metrics.containersBuilt++;
    options.metrics.baseTopologyBuilds++;
    options.metrics.baseVertices += vertices.length;
    options.metrics.baseAdjacencyEntries += adjacencyEntries;
    options.metrics.buildSweepEvents += seeds.length * 4 + obstacles.length * 4;
    options.metrics.estimatedBytes += estimatedBytes;
  }

  return Object.freeze({
    containerId: input.containerId,
    bounds: Object.freeze(bounds),
    obstacles: Object.freeze(obstacles.map((obstacle) => Object.freeze(obstacle))),
    vertices: Object.freeze(vertices),
    pointVertexIds: new ImmutableMap(
      new Map(vertices.map(({ id, point }) => [routingPointKey(point), id]))
    ),
    horizontalVertexLines: indexVertexLines(vertices, 'H'),
    verticalVertexLines: indexVertexLines(vertices, 'V'),
    adjacency,
    adjacencyByVertex: Object.freeze(vertices.map(({ id }) => adjacency.get(id) ?? [])),
    searchAdjacencyByVertex: Object.freeze(
      vertices.map(({ id }) => searchArcs(adjacency.get(id) ?? []))
    ),
    adjacencyEntries,
    horizontalIntervals,
    verticalIntervals,
    portalRanges: Object.freeze(portalRanges.map((range) => Object.freeze(range))),
    seedCount: seeds.length,
    estimatedBytes,
  });
}

function pointInsideObstacle(
  point: RouterPoint,
  horizontalIntervals: OrthogonalIntervalIndex
): boolean {
  return horizontalIntervals.contains(point.y, point.x);
}

export function buildEndpointRoutingOverlay(
  base: ContainerRoutingTopology,
  source: RouterPoint,
  target: RouterPoint,
  metrics?: GridRoutingInstrumentation,
  reusableScratch?: EndpointOverlayScratch,
  lanePoints: readonly RouterPoint[] = []
): ContainerRoutingTopology {
  // Overlays are intentionally tiny: two endpoints, optional bundle lane points, orthogonal
  // projections, and four obstacle/bounds ray hits per endpoint. Local caps enforce that invariant.
  const scratch = reusableScratch ?? new EndpointOverlayScratch(base);
  scratch.reset(base);
  const endpointRecords: VertexRecord[] = [
    { point: source, kind: 'endpoint', ownerId: 'source' },
    { point: target, kind: 'endpoint', ownerId: 'target' },
    ...lanePoints
      .filter((point) => !pointInsideObstacle(point, base.horizontalIntervals))
      .map((point) => ({ point, kind: 'lane' as const })),
  ];
  for (const point of [
    { x: source.x, y: target.y },
    { x: target.x, y: source.y },
  ]) {
    if (!pointInsideObstacle(point, base.horizontalIntervals)) {
      endpointRecords.push({ point, kind: 'projection' });
    }
  }
  for (const record of endpointRecords.slice(0, 2)) {
    for (const side of ['left', 'right', 'top', 'bottom'] as const) {
      const hit = rayHit(
        record.point,
        side,
        base.bounds,
        base.horizontalIntervals,
        base.verticalIntervals
      );
      if (hit.x !== record.point.x || hit.y !== record.point.y) {
        endpointRecords.push({ point: hit, kind: 'projection', side });
      }
    }
  }
  const additions = canonicalRecords(endpointRecords)
    .filter(({ point }) => !base.pointVertexIds.has(routingPointKey(point)))
    .sort(vertexRecordOrder);
  enforceCap(additions.length, 32, 'vertex_cap');
  scratch.addedVertices.push(
    ...additions.map<RouterVertex>((record, index) =>
      Object.freeze({
        id: base.vertices.length + index,
        ...record,
        point: Object.freeze({ ...record.point }),
      })
    )
  );
  const vertices = overlayArray(base.vertices, scratch.addedVertices);
  const vertexAt = (id: number): RouterVertex =>
    id < base.vertices.length
      ? base.vertices[id]
      : scratch.addedVertices[id - base.vertices.length];
  const adjacency = new Map<number, RouterArc[]>();
  const mutableArcs = (id: number): RouterArc[] => {
    let arcs = adjacency.get(id);
    if (!arcs) {
      arcs = [...(base.adjacency.get(id) ?? [])];
      adjacency.set(id, arcs);
    }
    return arcs;
  };
  for (const vertex of scratch.addedVertices) {
    adjacency.set(vertex.id, []);
  }
  const addedIds = new Set(scratch.addedVertices.map(({ id }) => id));
  const addedArcKeys = new Set<string>();
  const connect = (a: RouterVertex, b: RouterVertex, orientation: GridOrientation): void => {
    const length = Math.abs(a.point.x - b.point.x) + Math.abs(a.point.y - b.point.y);
    if (length === 0) {
      return;
    }
    const intervalStart =
      orientation === 'H' ? Math.min(a.point.x, b.point.x) : Math.min(a.point.y, b.point.y);
    const intervalEnd = intervalStart + length;
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const key = `${from.id}:${to.id}:${orientation}:visibility`;
      if (
        addedArcKeys.has(key) ||
        (base.adjacency.get(from.id) ?? []).some(
          (arc) => arc.to === to.id && arc.orientation === orientation && arc.kind === 'visibility'
        )
      ) {
        continue;
      }
      addedArcKeys.add(key);
      mutableArcs(from.id).push({
        from: from.id,
        to: to.id,
        orientation,
        length,
        kind: 'visibility',
        intervalStart,
        intervalEnd,
      });
    }
  };

  for (const orientation of ['H', 'V'] as const) {
    const baseLines = orientation === 'H' ? base.horizontalVertexLines : base.verticalVertexLines;
    const affected = new Set(
      scratch.addedVertices.map(({ point }) => (orientation === 'H' ? point.y : point.x))
    );
    for (const fixed of affected) {
      const line = [
        ...(baseLines.get(fixed) ?? []),
        ...scratch.addedVertices.filter(
          ({ point }) => (orientation === 'H' ? point.y : point.x) === fixed
        ),
      ];
      line.sort((a, b) =>
        orientation === 'H'
          ? a.point.x - b.point.x || a.id - b.id
          : a.point.y - b.point.y || a.id - b.id
      );
      for (let index = 1; index < line.length; index++) {
        const a = line[index - 1];
        const b = line[index];
        if (!addedIds.has(a.id) && !addedIds.has(b.id)) {
          continue;
        }
        const start = orientation === 'H' ? a.point.x : a.point.y;
        const end = orientation === 'H' ? b.point.x : b.point.y;
        const intervalIndex =
          orientation === 'H' ? base.horizontalIntervals : base.verticalIntervals;
        if (!intervalIndex.intersects(fixed, start, end)) {
          connect(a, b, orientation);
        }
      }
    }
  }

  for (const [id, arcs] of adjacency) {
    arcs.sort(
      (a, b) =>
        compareCodeUnits(a.kind, b.kind) ||
        compareCodeUnits(a.orientation, b.orientation) ||
        vertexAt(a.to).point.x - vertexAt(b.to).point.x ||
        vertexAt(a.to).point.y - vertexAt(b.to).point.y ||
        a.to - b.to
    );
    const immutableArcs = Object.freeze(arcs.map((arc) => Object.freeze(arc)));
    scratch.setArcs(id, immutableArcs);
  }
  const adjacencyEntries = base.adjacencyEntries + addedArcKeys.size;
  enforceCap(adjacencyEntries, base.adjacencyEntries + 64, 'adjacency_cap');
  const addedVertices = additions.length;
  const estimatedBytes =
    base.estimatedBytes + addedVertices * 64 + (adjacencyEntries - base.adjacencyEntries) * 56;
  if (metrics) {
    metrics.endpointOverlayBuilds++;
    metrics.endpointOverlayVertices += addedVertices;
    metrics.estimatedBytes = Math.max(metrics.estimatedBytes, estimatedBytes);
  }
  const vertexCount = base.vertices.length + scratch.addedVertices.length;
  const adjacencyByVertex = overrideArray(
    base.adjacencyByVertex,
    scratch.adjacencyOverrides,
    vertexCount
  );
  const searchAdjacencyByVertex = overrideArray(
    base.searchAdjacencyByVertex,
    scratch.searchAdjacencyOverrides,
    vertexCount
  );
  for (const vertex of scratch.addedVertices) {
    scratch.pointOverrides.set(routingPointKey(vertex.point), vertex.id);
  }
  return Object.freeze({
    ...base,
    vertices,
    pointVertexIds: new OverlayMap(base.pointVertexIds, scratch.pointOverrides),
    adjacency: new OverlayMap(base.adjacency, scratch.adjacencyOverrides),
    adjacencyByVertex,
    searchAdjacencyByVertex,
    adjacencyEntries,
    estimatedBytes,
    vertexCount,
    getVertex: vertexAt,
    getSearchArcs: (id: number) =>
      scratch.searchAdjacencyOverrides.get(id) ?? base.searchAdjacencyByVertex[id] ?? [],
  });
}
