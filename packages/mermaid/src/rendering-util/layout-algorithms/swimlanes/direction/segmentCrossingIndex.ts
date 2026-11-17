import { orthogonalSegmentsStrictlyCross } from './geometry.js';
import type { OrthogonalSegment, Point } from './geometry.js';

/** The two ends of a route segment, as `orthogonalSegmentsForPoints` yields it. */
export interface SegmentEnds {
  a: Point;
  b: Point;
}

/**
 * Counts strict crossings against a fixed set of segments without walking the set.
 * `crossings(segments)` is the number of pairs (one of `segments`, one indexed segment) for
 * which `orthogonalSegmentsStrictlyCross(..., epsilon)` holds, so a caller can swap a loop
 * over every other route for one call. The answer is exact, not an estimate: the index runs
 * the same comparisons on the same sums as the predicate, only on fewer pairs.
 */
export interface CrossingCounter {
  crossings(segments: Iterable<SegmentEnds>): number;
}

/**
 * The strict crossings between a fixed set of routes, counted the way a walk over every pair
 * of routes counts them: each pair of segments from two different routes once.
 */
export interface RouteCrossings<R> {
  /** Crossings between every two of the routes. */
  readonly total: number;
  /** Crossings between `route` and every other route. */
  of(route: R): number;
  /** Crossings of `segments` with every route except `route`. */
  withOthers(route: R, segments: readonly SegmentEnds[]): number;
  /** `total` once each route in `replaced` runs along its segments there instead. */
  totalWith(replaced: ReadonlyMap<R, readonly SegmentEnds[]>): number;
}

/** A segment and what it belongs to, kept by the line the segment runs along. */
export interface TrackEntry<T> {
  segment: OrthogonalSegment;
  owner: T;
}

/**
 * Segments sorted by the line they run along, one list per axis, for the tests that only
 * concern segments on (nearly) the same line: a shared track, a crowded parallel track.
 */
export interface TrackIndex<T> {
  /**
   * The entries on the axis of `segment` whose line is within `reach` of its line, both ends
   * included. A caller then applies its own exact test to these few.
   */
  alongside(segment: OrthogonalSegment, reach: number): TrackEntry<T>[];
}

type Axis = 'horizontal' | 'vertical';

/**
 * A segment as a segment at right angles to it sees it: the line it lies on, and the open
 * interval it covers along that line, narrowed by the tolerance at both ends.
 */
interface Span {
  line: number;
  from: number;
  to: number;
}

/**
 * Spans sorted by line, in a segment tree whose every node keeps the `from` and `to` values
 * of the spans below it in ascending order (a merge-sort tree).
 */
interface SpanTree {
  lines: Float64Array;
  leafBase: number;
  fromValues: Float64Array[];
  toValues: Float64Array[];
}

const NO_VALUES = new Float64Array(0);

/**
 * The predicate's own reading of a segment: flat in y is horizontal, flat in x is vertical.
 * A segment flat in both (a point) or in neither (a diagonal) crosses nothing.
 */
function axisOf({ a, b }: SegmentEnds, epsilon: number): Axis | undefined {
  const flatInY = Math.abs(a.y - b.y) < epsilon;
  const flatInX = Math.abs(a.x - b.x) < epsilon;
  if (flatInY === flatInX) {
    return undefined;
  }
  return flatInY ? 'horizontal' : 'vertical';
}

function spanOf({ a, b }: SegmentEnds, axis: Axis, epsilon: number): Span {
  return axis === 'horizontal'
    ? { line: a.y, from: Math.min(a.x, b.x) + epsilon, to: Math.max(a.x, b.x) - epsilon }
    : { line: a.x, from: Math.min(a.y, b.y) + epsilon, to: Math.max(a.y, b.y) - epsilon };
}

/** How many of the ascending `values` are less than `limit`. */
function countLess(values: Float64Array, limit: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] < limit) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

/** How many of the ascending `values` are less than or equal to `limit`. */
function countLessOrEqual(values: Float64Array, limit: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] <= limit) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

function mergedAscending(left: Float64Array, right: Float64Array): Float64Array {
  const merged = new Float64Array(left.length + right.length);
  merged.set(left);
  merged.set(right, left.length);
  return merged.sort();
}

function buildSpanTree(spans: Span[]): SpanTree {
  // No value lies strictly between the ends of a span with `from >= to`.
  const kept = spans
    .filter((span) => span.from < span.to && !Number.isNaN(span.line))
    .sort((first, second) => first.line - second.line);
  let leafBase = 1;
  while (leafBase < kept.length) {
    leafBase *= 2;
  }
  const fromValues: Float64Array[] = new Array<Float64Array>(2 * leafBase).fill(NO_VALUES);
  const toValues: Float64Array[] = new Array<Float64Array>(2 * leafBase).fill(NO_VALUES);
  kept.forEach((span, i) => {
    fromValues[leafBase + i] = Float64Array.of(span.from);
    toValues[leafBase + i] = Float64Array.of(span.to);
  });
  for (let node = leafBase - 1; node > 0; node--) {
    fromValues[node] = mergedAscending(fromValues[2 * node], fromValues[2 * node + 1]);
    toValues[node] = mergedAscending(toValues[2 * node], toValues[2 * node + 1]);
  }
  return { lines: Float64Array.from(kept, (span) => span.line), leafBase, fromValues, toValues };
}

/**
 * The spans under `node` with `from < at < to`: those starting below `at`, less those also
 * ending at or below it. Because every kept span has `from < to`, a span that ends at or below
 * `at` starts below it too, so the second group lies inside the first.
 */
function countStabbedAt(tree: SpanTree, node: number, at: number): number {
  return countLess(tree.fromValues[node], at) - countLessOrEqual(tree.toValues[node], at);
}

/** The spans whose line lies strictly inside `query` and whose interval holds `query.line`. */
function countCrossed(tree: SpanTree, query: Span): number {
  if (!(query.from < query.to)) {
    return 0;
  }
  let left = tree.leafBase + countLessOrEqual(tree.lines, query.from);
  let right = tree.leafBase + countLess(tree.lines, query.to);
  let count = 0;
  while (left < right) {
    if (left % 2 === 1) {
      count += countStabbedAt(tree, left++, query.line);
    }
    if (right % 2 === 1) {
      count += countStabbedAt(tree, --right, query.line);
    }
    left = Math.floor(left / 2);
    right = Math.floor(right / 2);
  }
  return count;
}

/**
 * Indexes `segments` for strict crossing counts with the tolerance `epsilon`. Building takes
 * O(n log² n) for n segments and each counted segment O(log² n).
 */
export function buildCrossingCounter(
  segments: Iterable<SegmentEnds>,
  epsilon: number
): CrossingCounter {
  const spans: Record<Axis, Span[]> = { horizontal: [], vertical: [] };
  for (const segment of segments) {
    const axis = axisOf(segment, epsilon);
    if (axis) {
      spans[axis].push(spanOf(segment, axis, epsilon));
    }
  }
  // A horizontal segment is crossed by verticals only, and the other way round.
  const crossedBy: Record<Axis, SpanTree> = {
    horizontal: buildSpanTree(spans.vertical),
    vertical: buildSpanTree(spans.horizontal),
  };
  return {
    crossings(queried) {
      let count = 0;
      for (const segment of queried) {
        const axis = axisOf(segment, epsilon);
        if (axis) {
          count += countCrossed(crossedBy[axis], spanOf(segment, axis, epsilon));
        }
      }
      return count;
    },
  };
}

/** Strict crossings between two segment lists, pair by pair. */
function crossingsBetween(
  first: readonly SegmentEnds[],
  second: readonly SegmentEnds[],
  epsilon: number
): number {
  let count = 0;
  for (const one of first) {
    for (const other of second) {
      if (orthogonalSegmentsStrictlyCross(one.a, one.b, other.a, other.b, epsilon)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Indexes `routes` so that the crossings of one route, or of a replacement for it, with all
 * the others cost O(s log² n) for s segments instead of a walk over every route. A route's
 * crossings with itself are never counted.
 */
export function buildRouteCrossings<R>(
  routes: ReadonlyMap<R, readonly SegmentEnds[]>,
  epsilon: number
): RouteCrossings<R> {
  const index = buildCrossingCounter([...routes.values()].flat(), epsilon);
  const withOthers = (route: R, segments: readonly SegmentEnds[]): number =>
    index.crossings(segments) - crossingsBetween(segments, routes.get(route) ?? [], epsilon);
  const own = new Map<R, number>();
  let counted = 0;
  for (const [route, segments] of routes) {
    const count = withOthers(route, segments);
    own.set(route, count);
    counted += count;
  }
  // Every crossing between two routes was counted once from each side.
  const total = counted / 2;
  const of = (route: R): number => own.get(route) ?? 0;
  return {
    total,
    of,
    withOthers,
    totalWith: (replaced) => {
      const changed = [...replaced];
      let result = total;
      changed.forEach(([route, segments], i) => {
        result += withOthers(route, segments) - of(route);
        for (const [other, otherSegments] of changed.slice(i + 1)) {
          result += pairCorrection(
            [routes.get(route) ?? [], segments],
            [routes.get(other) ?? [], otherSegments],
            epsilon
          );
        }
      });
      return result;
    },
  };
}

/**
 * What `withOthers` gets wrong for two routes replaced together, given each as `[old, new]`:
 * each counted its new segments against the other's old ones, and both took their old
 * crossing with each other off the total.
 */
function pairCorrection(
  [firstOld, firstNew]: [readonly SegmentEnds[], readonly SegmentEnds[]],
  [secondOld, secondNew]: [readonly SegmentEnds[], readonly SegmentEnds[]],
  epsilon: number
): number {
  return (
    crossingsBetween(firstOld, secondOld, epsilon) +
    crossingsBetween(firstNew, secondNew, epsilon) -
    crossingsBetween(firstNew, secondOld, epsilon) -
    crossingsBetween(secondNew, firstOld, epsilon)
  );
}

interface TrackLine<T> {
  lines: Float64Array;
  entries: TrackEntry<T>[];
}

const lineOf = (segment: OrthogonalSegment): number =>
  segment.horizontal ? segment.a.y : segment.a.x;

function trackLine<T>(entries: TrackEntry<T>[]): TrackLine<T> {
  // A segment on no number line is near nothing, and would break the order.
  const sorted = entries
    .filter((entry) => !Number.isNaN(lineOf(entry.segment)))
    .sort((first, second) => lineOf(first.segment) - lineOf(second.segment));
  return { lines: Float64Array.from(sorted, (entry) => lineOf(entry.segment)), entries: sorted };
}

/** Indexes `entries` by the line each segment runs along. */
export function buildTrackIndex<T>(entries: Iterable<TrackEntry<T>>): TrackIndex<T> {
  const all = [...entries];
  const horizontal = trackLine(all.filter((entry) => entry.segment.horizontal));
  const vertical = trackLine(all.filter((entry) => !entry.segment.horizontal));
  return {
    alongside(segment, reach) {
      const { lines, entries: sorted } = segment.horizontal ? horizontal : vertical;
      const line = lineOf(segment);
      return sorted.slice(countLess(lines, line - reach), countLessOrEqual(lines, line + reach));
    },
  };
}
