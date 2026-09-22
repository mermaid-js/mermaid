import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import type {
  ContainerRoutingTopology,
  GridOrientation,
  GridSide,
  OrthogonalIntervalIndex,
  PortalRange,
  RouterArc,
  RouterObstacle,
  RouterPoint,
  RouterRect,
  RouterSearchArc,
  RouterVertex,
} from './types.js';

export const ROUTE_CLEARANCE_PX = 6;

export interface RouterObstacleInput {
  id: string;
  bounds: RouterRect;
}

export interface ContainerTopologyInput {
  containerId: string;
  ancestryPath: readonly string[];
  bounds: RouterRect;
  obstacles: readonly RouterObstacleInput[];
  titleExclusions?: readonly RouterObstacleInput[];
  portalRanges?: readonly PortalRange[];
}

export interface BuildTopologyOptions {
  metrics?: GridRoutingInstrumentation;
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
    this.intervalCount = bands.reduce((total, band) => total + band.intervals.length, 0);
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

  intersects(coordinate: number, intervalStart: number, intervalEnd: number): boolean {
    const low = Math.min(intervalStart, intervalEnd);
    const high = Math.max(intervalStart, intervalEnd);
    const before = this.byHigh.get(coordinate);
    const after = this.byLow.get(coordinate);
    const containing = before || after ? undefined : this.containingBand(coordinate);
    if (containing) {
      return containing.intervals.some(
        ([intervalLow, intervalHigh]) => high > intervalLow && low < intervalHigh
      );
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
    return Boolean(
      (
        this.strictBoundaryIntervals.get(coordinate) ?? this.containingBand(coordinate)?.intervals
      )?.some(([low, high]) => varying > low && varying < high)
    );
  }

  nearestBoundary(coordinate: number, origin: number, direction: -1 | 1): number | undefined {
    const intervals =
      this.strictBoundaryIntervals.get(coordinate) ?? this.containingBand(coordinate)?.intervals;
    if (!intervals) {
      return undefined;
    }
    if (direction < 0) {
      for (let index = intervals.length - 1; index >= 0; index--) {
        if (intervals[index][1] <= origin) {
          return intervals[index][1];
        }
      }
      return undefined;
    }
    for (const [low] of intervals) {
      if (low >= origin) {
        return low;
      }
    }
    return undefined;
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

function mergeIntervals(
  intervals: { low: number; high: number; id: string }[]
): { low: number; high: number; id: string }[] {
  const sorted = [...intervals].sort(
    (a, b) => a.low - b.low || a.high - b.high || a.id.localeCompare(b.id)
  );
  const merged: { low: number; high: number; id: string }[] = [];
  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.low > previous.high) {
      merged.push({ ...interval });
      continue;
    }
    previous.high = Math.max(previous.high, interval.high);
    if (interval.id.localeCompare(previous.id) < 0) {
      previous.id = interval.id;
    }
  }
  return merged;
}

function unionObstacles(obstacles: readonly RouterObstacle[]): RouterObstacle[] {
  const xCoordinates = [...new Set(obstacles.flatMap(({ left, right }) => [left, right]))].sort(
    (a, b) => a - b
  );
  const slabs: RouterObstacle[] = [];
  for (let index = 0; index < xCoordinates.length - 1; index++) {
    const left = xCoordinates[index];
    const right = xCoordinates[index + 1];
    const active = obstacles
      .filter((obstacle) => obstacle.left < right && obstacle.right > left)
      .map((obstacle) => ({ low: obstacle.top, high: obstacle.bottom, id: obstacle.id }));
    for (const interval of mergeIntervals(active)) {
      const previous = slabs.find(
        (candidate) =>
          candidate.right === left &&
          candidate.top === interval.low &&
          candidate.bottom === interval.high
      );
      if (previous) {
        previous.right = right;
        if (interval.id.localeCompare(previous.id) < 0) {
          previous.id = interval.id;
        }
      } else {
        slabs.push({
          id: interval.id,
          left,
          right,
          top: interval.low,
          bottom: interval.high,
        });
      }
    }
  }
  return slabs.sort(
    (a, b) =>
      a.top - b.top ||
      a.left - b.left ||
      a.bottom - b.bottom ||
      a.right - b.right ||
      a.id.localeCompare(b.id)
  );
}

function pointKey(point: RouterPoint): string {
  return `${normalizeCoordinate(point.x)}:${normalizeCoordinate(point.y)}`;
}

function sideOrdinal(side?: GridSide): number {
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
    a.kind.localeCompare(b.kind) ||
    sideOrdinal(a.side) - sideOrdinal(b.side) ||
    a.point.x - b.point.x ||
    a.point.y - b.point.y ||
    (a.ownerId ?? '').localeCompare(b.ownerId ?? '')
  );
}

function canonicalRecords(records: readonly VertexRecord[]): VertexRecord[] {
  const byPoint = new Map<string, VertexRecord>();
  for (const record of [...records].sort(vertexRecordOrder)) {
    const normalized = {
      ...record,
      point: {
        x: normalizeCoordinate(record.point.x),
        y: normalizeCoordinate(record.point.y),
      },
    };
    const key = pointKey(normalized.point);
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
  const points =
    range.side === 'left' || range.side === 'right'
      ? [
          { x: range.side === 'left' ? bounds.left : bounds.right, y: range.low },
          { x: range.side === 'left' ? bounds.left : bounds.right, y: range.high },
        ]
      : [
          { x: range.low, y: range.side === 'top' ? bounds.top : bounds.bottom },
          { x: range.high, y: range.side === 'top' ? bounds.top : bounds.bottom },
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
  orientation: GridOrientation
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
  for (const coordinate of coordinates) {
    const intervals = obstacles
      .filter((obstacle) =>
        orientation === 'H'
          ? obstacle.top < coordinate && coordinate < obstacle.bottom
          : obstacle.left < coordinate && coordinate < obstacle.right
      )
      .map((obstacle) =>
        orientation === 'H'
          ? { low: obstacle.left, high: obstacle.right, id: obstacle.id }
          : { low: obstacle.top, high: obstacle.bottom, id: obstacle.id }
      );
    strictBoundaryIntervals.set(
      coordinate,
      Object.freeze(
        mergeIntervals(intervals).map((interval) =>
          Object.freeze([interval.low, interval.high] as const)
        )
      )
    );
  }
  for (let index = 1; index < coordinates.length; index++) {
    const low = coordinates[index - 1];
    const high = coordinates[index];
    const intervals = obstacles
      .filter((obstacle) =>
        orientation === 'H'
          ? obstacle.top < high && obstacle.bottom > low
          : obstacle.left < high && obstacle.right > low
      )
      .map((obstacle) =>
        orientation === 'H'
          ? { low: obstacle.left, high: obstacle.right, id: obstacle.id }
          : { low: obstacle.top, high: obstacle.bottom, id: obstacle.id }
      );
    if (intervals.length > 0) {
      bands.push({
        low,
        high,
        intervals: Object.freeze(
          mergeIntervals(intervals).map((interval) =>
            Object.freeze([interval.low, interval.high] as const)
          )
        ),
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
  return Object.freeze(
    arcs.map((arc) =>
      Object.freeze({
        to: arc.to,
        orientationOrdinal: arc.orientation === 'H' ? 1 : 2,
        length: arc.length,
        boundaryTransitions: arc.kind === 'portal' ? 1 : 0,
        occupiedLength: arc.occupiedLength ?? 0,
        crossings: arc.crossingCount ?? 0,
      } as const)
    )
  );
}

function buildVisibilityGraph(
  records: readonly VertexRecord[],
  horizontalIntervals: OrthogonalIntervalIndex,
  verticalIntervals: OrthogonalIntervalIndex
): {
  vertices: readonly RouterVertex[];
  adjacency: ReadonlyMap<number, readonly RouterArc[]>;
  adjacencyEntries: number;
} {
  const canonical = canonicalRecords(records).sort(vertexRecordOrder);
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
        a.orientation.localeCompare(b.orientation) ||
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

export function buildContainerRoutingTopology(
  input: ContainerTopologyInput,
  options: BuildTopologyOptions = {}
): ContainerRoutingTopology {
  const bounds = normalizeRect(input.bounds);
  const inflated = [...input.obstacles, ...(input.titleExclusions ?? [])]
    .map((obstacle) => inflateAndClip(obstacle, bounds))
    .filter((obstacle): obstacle is RouterObstacle => Boolean(obstacle));
  const obstacles = unionObstacles(inflated);
  const portalRanges = [...(input.portalRanges ?? [])].sort(
    (a, b) =>
      sideOrdinal(a.side) - sideOrdinal(b.side) ||
      a.low - b.low ||
      a.high - b.high ||
      a.ownerId.localeCompare(b.ownerId)
  );

  const seeds = canonicalRecords([
    ...cornerRecords(bounds, input.containerId),
    ...obstacles.flatMap((obstacle) => cornerRecords(obstacle, obstacle.id)),
    ...portalRanges.flatMap((range) => portalRecords(range, bounds)),
  ]);
  const horizontalIntervals = createIntervalIndex(obstacles, 'H');
  const verticalIntervals = createIntervalIndex(obstacles, 'V');
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
    verticalIntervals
  );

  const estimatedBytes = estimatedTopologyBytes(
    vertices.length,
    adjacencyEntries,
    obstacles.length,
    horizontalIntervals.intervalCount + verticalIntervals.intervalCount
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
      new Map(vertices.map(({ id, point }) => [pointKey(point), id]))
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
