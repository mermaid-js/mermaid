import type { Point } from '../../../types.js';
import { nonterminalSegments, type OrthogonalSegment } from './routerConstraint.js';
import { EDGE_CLEARANCE_PX } from './routerTopology.js';
import type { GridOrientation, RouterPoint } from './types.js';

function segmentsTooClose(candidate: OrthogonalSegment, committed: OrthogonalSegment): boolean {
  if (candidate.orientation !== committed.orientation) {
    return false;
  }
  const horizontal = candidate.orientation === 'H';
  const lowOf = (segment: OrthogonalSegment) =>
    horizontal ? Math.min(segment.a.x, segment.b.x) : Math.min(segment.a.y, segment.b.y);
  const highOf = (segment: OrthogonalSegment) =>
    horizontal ? Math.max(segment.a.x, segment.b.x) : Math.max(segment.a.y, segment.b.y);
  const overlap =
    Math.min(highOf(candidate), highOf(committed)) - Math.max(lowOf(candidate), lowOf(committed));
  const separation = horizontal
    ? Math.abs(candidate.a.y - committed.a.y)
    : Math.abs(candidate.a.x - committed.a.x);
  return overlap > 0 && separation < EDGE_CLEARANCE_PX;
}

interface OccupiedSegment {
  segment: OrthogonalSegment;
  pairKey: string;
}

interface OccupancyLogEntry {
  orientation: GridOrientation;
  coordinate: number;
}

/**
 * Container-scoped index of committed route segments.
 *
 * Routes from different edges must not share a corridor, so every routed edge registers its
 * nonterminal segments here and later candidates query it with the clearance rule
 * (`segmentsTooClose`). Segments are bucketed by their fixed coordinate so a query
 * only inspects lines within the clearance instead of every committed segment.
 *
 * Routes are append-only and can be truncated back to an earlier size, which is how bundle retries
 * roll back state.
 */
export class RouteOccupancyIndex {
  private readonly lines: Record<'H' | 'V', Map<number, OccupiedSegment[]>> = {
    H: new Map(),
    V: new Map(),
  };
  private readonly sortedCoordinates: Record<'H' | 'V', number[] | undefined> = {
    H: undefined,
    V: undefined,
  };
  private readonly log: OccupancyLogEntry[] = [];

  get size(): number {
    return this.log.length;
  }

  add(route: readonly Point[], pairKey: string): void {
    for (const segment of nonterminalSegments(route)) {
      const orientation = segment.orientation as 'H' | 'V';
      const coordinate = orientation === 'H' ? segment.a.y : segment.a.x;
      const bucket = this.lines[orientation].get(coordinate);
      if (bucket) {
        bucket.push({ segment, pairKey });
      } else {
        this.lines[orientation].set(coordinate, [{ segment, pairKey }]);
        this.sortedCoordinates[orientation] = undefined;
      }
      this.log.push({ orientation, coordinate });
    }
  }

  truncate(size: number): void {
    while (this.log.length > size) {
      const { orientation, coordinate } = this.log.pop()!;
      this.lines[orientation].get(coordinate)?.pop();
    }
  }

  /** Reports whether a route shares a corridor with a committed route of another edge pair. */
  conflictsWithRoute(route: readonly Point[], pairKey: string): boolean {
    return nonterminalSegments(route).some((segment) => this.conflicts(segment, pairKey));
  }

  conflictsWithArc(from: RouterPoint, to: RouterPoint, pairKey: string): boolean {
    const orientation: GridOrientation = from.y === to.y ? 'H' : 'V';
    return this.conflicts({ a: from, b: to, orientation }, pairKey);
  }

  private conflicts(candidate: OrthogonalSegment, pairKey: string): boolean {
    const orientation = candidate.orientation as string;
    if (orientation !== 'H' && orientation !== 'V') {
      return false;
    }
    const coordinate = orientation === 'H' ? candidate.a.y : candidate.a.x;
    const coordinates = this.coordinatesFor(orientation);
    let low = 0;
    let high = coordinates.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (coordinates[middle] <= coordinate - EDGE_CLEARANCE_PX) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    for (let index = low; index < coordinates.length; index++) {
      const key = coordinates[index];
      if (key >= coordinate + EDGE_CLEARANCE_PX) {
        break;
      }
      for (const occupied of this.lines[orientation].get(key)!) {
        if (occupied.pairKey !== pairKey && segmentsTooClose(candidate, occupied.segment)) {
          return true;
        }
      }
    }
    return false;
  }

  private coordinatesFor(orientation: 'H' | 'V'): number[] {
    return (this.sortedCoordinates[orientation] ??= [...this.lines[orientation].keys()].sort(
      (a, b) => a - b
    ));
  }
}
