import type { Edge, Node } from '../../../types.js';
import {
  collectNodeRectEntries,
  dedupeConsecutivePoints,
  overlapLength,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  rectOfNodeBounds,
  segmentHitsAnyRect,
} from './geometry.js';
import type { OrthogonalSegment, Point } from './geometry.js';

export function nudgeSharedInteriorSubpaths(edges: Edge[], nodeByIdMap: Map<string, Node>): void {
  const EPS_LOCAL = 1e-3;
  const MIN_SHARED = 8;
  const TRACK_SHIFT = 7;
  const MIN_TRACK_GAP = TRACK_SHIFT;
  const SOURCE_DETOUR_STUB = 20;
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

  const hasCrowdedParallelTrack = (a: SegmentLite, b: SegmentLite): boolean => {
    if (a.horizontal && b.horizontal) {
      return (
        overlapLength(a.a.x, a.b.x, b.a.x, b.b.x) >= MIN_SHARED &&
        Math.abs(a.a.y - b.a.y) < MIN_TRACK_GAP
      );
    }
    if (a.vertical && b.vertical) {
      return (
        overlapLength(a.a.y, a.b.y, b.a.y, b.b.y) >= MIN_SHARED &&
        Math.abs(a.a.x - b.a.x) < MIN_TRACK_GAP
      );
    }
    return false;
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
          if (hasCrowdedParallelTrack(candidateSegment, otherSegment)) {
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

  type NodeRect = NonNullable<ReturnType<typeof rectOfNodeBounds>>;

  interface SourceDetourContext {
    sourceCenter: Point;
    targetCenter: Point;
    sourceRect: NodeRect;
    tail: PointLite[];
  }

  const nodeCenter = (node: Node, rect: NodeRect): Point => ({
    x: node.x ?? (rect.left + rect.right) / 2,
    y: node.y ?? (rect.top + rect.bottom) / 2,
  });

  const sourceDetourContextFor = (segment: SegmentLite): SourceDetourContext | undefined => {
    const edge = segment.edge;
    const points = dedupeConsecutivePoints(edge.points ?? []);
    if (points.length !== 4 || segment.index !== 1) {
      return undefined;
    }

    const sourceNode = edge.start ? nodeByIdMap.get(edge.start) : undefined;
    const targetNode = edge.end ? nodeByIdMap.get(edge.end) : undefined;
    const sourceRect = sourceNode ? rectOfNodeBounds(sourceNode) : undefined;
    const targetRect = targetNode ? rectOfNodeBounds(targetNode) : undefined;
    const tail = points.slice(segment.index + 2);
    if (!sourceNode || !targetNode || !sourceRect || !targetRect || tail.length === 0) {
      return undefined;
    }

    return {
      sourceCenter: nodeCenter(sourceNode, sourceRect),
      targetCenter: nodeCenter(targetNode, targetRect),
      sourceRect,
      tail,
    };
  };

  const verticalSourceDetour = (
    segment: SegmentLite,
    shift: number,
    sourceCenter: Point,
    targetCenter: Point,
    sourceRect: NodeRect,
    tail: PointLite[]
  ): PointLite[] | undefined => {
    const targetBelow = targetCenter.y >= sourceCenter.y;
    const sourcePortY = targetBelow ? sourceRect.bottom : sourceRect.top;
    const stubY = sourcePortY + (targetBelow ? SOURCE_DETOUR_STUB : -SOURCE_DETOUR_STUB);
    if (
      (targetBelow && segment.b.y <= stubY + EPS_LOCAL) ||
      (!targetBelow && segment.b.y >= stubY - EPS_LOCAL)
    ) {
      return undefined;
    }

    const railX = segment.a.x + shift;
    return dedupeConsecutivePoints(
      [
        { x: sourceCenter.x, y: sourcePortY },
        { x: sourceCenter.x, y: stubY },
        { x: railX, y: stubY },
        { x: railX, y: segment.b.y },
        ...tail,
      ],
      EPS_LOCAL
    );
  };

  const horizontalSourceDetour = (
    segment: SegmentLite,
    shift: number,
    sourceCenter: Point,
    targetCenter: Point,
    sourceRect: NodeRect,
    tail: PointLite[]
  ): PointLite[] | undefined => {
    const targetRight = targetCenter.x >= sourceCenter.x;
    const sourcePortX = targetRight ? sourceRect.right : sourceRect.left;
    const stubX = sourcePortX + (targetRight ? SOURCE_DETOUR_STUB : -SOURCE_DETOUR_STUB);
    if (
      (targetRight && segment.b.x <= stubX + EPS_LOCAL) ||
      (!targetRight && segment.b.x >= stubX - EPS_LOCAL)
    ) {
      return undefined;
    }

    const railY = segment.a.y + shift;
    return dedupeConsecutivePoints(
      [
        { x: sourcePortX, y: sourceCenter.y },
        { x: stubX, y: sourceCenter.y },
        { x: stubX, y: railY },
        { x: segment.b.x, y: railY },
        ...tail,
      ],
      EPS_LOCAL
    );
  };

  const sourceDetourCandidate = (segment: SegmentLite, shift: number): PointLite[] | undefined => {
    const context = sourceDetourContextFor(segment);
    if (!context) {
      return undefined;
    }

    if (segment.vertical) {
      return verticalSourceDetour(
        segment,
        shift,
        context.sourceCenter,
        context.targetCenter,
        context.sourceRect,
        context.tail
      );
    }
    if (segment.horizontal) {
      return horizontalSourceDetour(
        segment,
        shift,
        context.sourceCenter,
        context.targetCenter,
        context.sourceRect,
        context.tail
      );
    }

    return undefined;
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
        if (first.edge === second.edge || !hasCrowdedParallelTrack(first, second)) {
          continue;
        }

        const candidates = [first, second].filter((segment) => segment.interior);
        for (const segment of candidates) {
          for (const shift of shifts) {
            const direct = shiftedCandidate(segment, shift);
            if (direct && candidateIsSafe(segment.edge, direct)) {
              segment.edge.points = direct;
              fixed = true;
              break;
            }

            const detoured = sourceDetourCandidate(segment, shift);
            if (detoured && candidateIsSafe(segment.edge, detoured)) {
              segment.edge.points = detoured;
              fixed = true;
              break;
            }
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
