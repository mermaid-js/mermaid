import type { Edge, Node } from '../../../types.js';
import {
  collectNodeRectEntries,
  dedupeConsecutivePoints,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  sameAxisSegmentOverlapLength,
  segmentHitsAnyRect,
} from './geometry.js';
import type { OrthogonalSegment, Point } from './geometry.js';

export function nudgeSharedInteriorSubpaths(edges: Edge[], nodeByIdMap: Map<string, Node>): void {
  const EPS_LOCAL = 1e-3;
  const MIN_SHARED = 8;
  const TRACK_SHIFT = 7;
  const BUFFER = 2;
  const MAX_ITERATIONS = 12;

  type PointLite = Point;

  interface SegmentLite extends OrthogonalSegment {
    edge: Edge;
    interior: boolean;
  }

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );

  const segmentsFor = (edge: Edge, points: PointLite[]): SegmentLite[] => {
    return orthogonalSegmentsForPoints(points, EPS_LOCAL).map((segment) => ({
      ...segment,
      edge,
      interior: segment.index >= 1 && segment.index <= points.length - 3,
    }));
  };

  const allSegments = (): SegmentLite[] => {
    const result: SegmentLite[] = [];
    for (const edge of edges) {
      if (edge.isLayoutOnly) {
        continue;
      }
      const points = edge.points;
      if (!points || points.length < 2) {
        continue;
      }
      result.push(...segmentsFor(edge, dedupeConsecutivePoints(points)));
    }
    return result;
  };

  const candidateIsSafe = (edge: Edge, candidate: PointLite[]): boolean => {
    const sourceId = edge.start;
    const targetId = edge.end;
    const candidateSegments = segmentsFor(edge, candidate);
    if (candidateSegments.length !== candidate.length - 1) {
      return false;
    }

    const endpointIds = [sourceId, targetId].filter((id): id is string => Boolean(id));
    const ownLabelIds = edge.labelNodeId ? [edge.labelNodeId] : [];
    for (const segment of candidateSegments) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
        return false;
      }
      if (segmentHitsAnyRect(segment.a, segment.b, labelRects, ownLabelIds, -BUFFER)) {
        return false;
      }
    }

    for (const other of edges) {
      if (other === edge || other.isLayoutOnly) {
        continue;
      }
      const otherPoints = other.points;
      if (!otherPoints || otherPoints.length < 2) {
        continue;
      }
      for (const candidateSegment of candidateSegments) {
        for (const otherSegment of segmentsFor(other, dedupeConsecutivePoints(otherPoints))) {
          if (
            sameAxisSegmentOverlapLength(candidateSegment, otherSegment, EPS_LOCAL) >= MIN_SHARED
          ) {
            return false;
          }
          if (
            orthogonalSegmentsStrictlyCross(
              candidateSegment.a,
              candidateSegment.b,
              otherSegment.a,
              otherSegment.b,
              EPS_LOCAL
            )
          ) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const shiftedCandidate = (segment: SegmentLite, shift: number): PointLite[] | undefined => {
    const points = dedupeConsecutivePoints(segment.edge.points ?? []);
    if (points.length < 4 || segment.index >= points.length - 1) {
      return undefined;
    }
    const candidate = points.map((p) => ({ ...p }));
    if (segment.horizontal) {
      candidate[segment.index].y += shift;
      candidate[segment.index + 1].y += shift;
    } else if (segment.vertical) {
      candidate[segment.index].x += shift;
      candidate[segment.index + 1].x += shift;
    } else {
      return undefined;
    }
    return segmentsFor(segment.edge, candidate).length === candidate.length - 1
      ? candidate
      : undefined;
  };

  const shifts = [
    -TRACK_SHIFT,
    TRACK_SHIFT,
    -2 * TRACK_SHIFT,
    2 * TRACK_SHIFT,
    -3 * TRACK_SHIFT,
    3 * TRACK_SHIFT,
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const segments = allSegments();
    let fixed = false;

    for (let i = 0; i < segments.length && !fixed; i++) {
      for (let j = i + 1; j < segments.length && !fixed; j++) {
        const first = segments[i];
        const second = segments[j];
        if (
          first.edge === second.edge ||
          sameAxisSegmentOverlapLength(first, second, EPS_LOCAL) < MIN_SHARED
        ) {
          continue;
        }

        const candidates = [first, second].filter((segment) => segment.interior);
        for (const segment of candidates) {
          for (const shift of shifts) {
            const candidate = shiftedCandidate(segment, shift);
            if (!candidate || !candidateIsSafe(segment.edge, candidate)) {
              continue;
            }

            segment.edge.points = candidate;
            fixed = true;
            break;
          }
          if (fixed) {
            break;
          }
        }
      }
    }

    if (!fixed) {
      return;
    }
  }
}
