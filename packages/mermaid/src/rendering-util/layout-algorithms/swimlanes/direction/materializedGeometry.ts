// cspell:ignore Wybrow

import {
  collectNodeRectEntries,
  countOrthogonalBends,
  dedupeConsecutivePoints,
  isHorizontalSegment,
  isVerticalSegment,
  samePoint,
  sameX,
  sameY,
  buildOrthogonalPortPath,
  buildSameSideTrackPath,
  overlapLength,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  portForRectSide,
  rectOfNodeBounds,
  routesTouchAtBend,
  sameAxisSegmentOverlapLength,
  segmentHitsAnyRect,
  simplifyPolyline,
} from './geometry.js';
import type { OrthogonalSegment, Point, RectBounds, RectSide } from './geometry.js';
import { buildRouteCrossings, buildTrackIndex } from './segmentCrossingIndex.js';
import type { RouteCrossings, TrackIndex } from './segmentCrossingIndex.js';
import type { Edge, Node } from '../../../types.js';
import { EDGE_ROUTING } from '../config.js';
import { buildLaneModel } from '../lanes.js';

const EPS_LOCAL = 1e-3;
const MIN_SHARED = 8;

const upperCaseDirection = (raw: unknown): string =>
  typeof raw === 'string' ? raw.toUpperCase() : '';

type PointLite = Point;
type RectLite = RectBounds;
type MaterializedEdge = Edge & { points?: PointLite[] };
type MaterializedNode = Node & { direction?: string };
type EdgeReplacementMap = Map<MaterializedEdge, PointLite[]>;

type SegmentLite = OrthogonalSegment;

const segmentsFor = orthogonalSegmentsForPoints;

const orthogonallyAligned = (a: PointLite, b: PointLite): boolean =>
  sameX(a, b, EPS_LOCAL) || sameY(a, b, EPS_LOCAL);

/** Two segments on one line that overlap enough to read as one track. */
const sharesTrack = (first: SegmentLite, second: SegmentLite): boolean =>
  sameAxisSegmentOverlapLength(first, second, 0.5) >= MIN_SHARED;

/** The routes of the visible edges as a pass reads them while none of them moves. */
interface RoundRoutes {
  routes: RouteCrossings<MaterializedEdge>;
  segmentsByEdge: Map<MaterializedEdge, SegmentLite[]>;
  bendsByEdge: Map<MaterializedEdge, number>;
  totalBends: number;
  tracks: TrackIndex<MaterializedEdge>;
}

function roundRoutes(visibleEdges: MaterializedEdge[]): RoundRoutes {
  const pointsByEdge = new Map(
    visibleEdges.map((edge) => [edge, dedupeConsecutivePoints(edge.points ?? [])])
  );
  const segmentsByEdge = new Map(
    visibleEdges.map((edge) => [edge, segmentsFor(pointsByEdge.get(edge) ?? [])])
  );
  const bendsByEdge = new Map(
    visibleEdges.map((edge) => [edge, countOrthogonalBends(pointsByEdge.get(edge) ?? [])])
  );
  return {
    routes: buildRouteCrossings(segmentsByEdge, EPS_LOCAL),
    segmentsByEdge,
    bendsByEdge,
    totalBends: [...bendsByEdge.values()].reduce((sum, bends) => sum + bends, 0),
    tracks: buildTrackIndex(
      visibleEdges.flatMap((owner) =>
        (segmentsByEdge.get(owner) ?? []).map((segment) => ({ segment, owner }))
      )
    ),
  };
}

export function separateSharedRenderedTerminalLanes(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const MIN_FACE_CLEARANCE = 16;
  const TRACK_SHIFT = 7;

  const FACE_CORNER_INSET = 8;
  const usableFace = (low: number, high: number) => {
    const inset = Math.min(FACE_CORNER_INSET, (high - low) / 4);
    return { low: low + inset, high: high - inset };
  };

  interface TerminalLane {
    edge: MaterializedEdge;
    edgeId: string;
    nodeId: string;
    atStart: boolean;
    orientation: 'H' | 'V';
    coord: number;
    min: number;
    max: number;
    boundary: PointLite;
    railEnd: PointLite;
    rect: RectLite;
  }

  const rectIntersect = (node: MaterializedNode, point: PointLite): PointLite => {
    const x = (node as { x?: number }).x ?? 0;
    const y = (node as { y?: number }).y ?? 0;
    const dx = point.x - x;
    const dy = point.y - y;
    let w = ((node as { width?: number }).width ?? 0) / 2;
    let h = ((node as { height?: number }).height ?? 0) / 2;

    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      if (dy < 0) {
        h = -h;
      }
      return { x: x + (dy === 0 ? 0 : (h * dx) / dy), y: y + h };
    }

    if (dx < 0) {
      w = -w;
    }
    return { x: x + w, y: y + (dx === 0 ? 0 : (w * dy) / dx) };
  };

  const terminalLaneFor = (edge: MaterializedEdge, atStart: boolean): TerminalLane | undefined => {
    const points = dedupeConsecutivePoints((edge as { points?: PointLite[] }).points ?? []);
    if (points.length < 2) {
      return undefined;
    }

    const nodeId = atStart ? (edge as { start?: string }).start : (edge as { end?: string }).end;
    const node = nodeId ? nodeByIdMap.get(nodeId) : undefined;
    const rect = node ? rectOfNodeBounds(node) : undefined;
    if (!node || !nodeId || !rect) {
      return undefined;
    }

    const endpoint = atStart ? points[0] : points[points.length - 1];
    const adjacent = atStart ? points[1] : points[points.length - 2];
    const boundary = rectIntersect(node, endpoint);
    let railEnd = endpoint;
    if (orthogonallyAligned(adjacent, boundary)) {
      railEnd = adjacent;
    }

    if (sameX(boundary, railEnd, EPS_LOCAL)) {
      return {
        edge,
        edgeId: String((edge as { id?: string }).id ?? ''),
        nodeId,
        atStart,
        orientation: 'V',
        coord: boundary.x,
        min: Math.min(boundary.y, railEnd.y),
        max: Math.max(boundary.y, railEnd.y),
        boundary,
        railEnd,
        rect,
      };
    }
    if (sameY(boundary, railEnd, EPS_LOCAL)) {
      return {
        edge,
        edgeId: String((edge as { id?: string }).id ?? ''),
        nodeId,
        atStart,
        orientation: 'H',
        coord: boundary.y,
        min: Math.min(boundary.x, railEnd.x),
        max: Math.max(boundary.x, railEnd.x),
        boundary,
        railEnd,
        rect,
      };
    }
    return undefined;
  };

  const projectedOverlapLength = (a: TerminalLane, b: TerminalLane): number =>
    Math.max(0, Math.min(a.max, b.max) - Math.max(a.min, b.min));

  const sameTerminalFace = (a: TerminalLane, b: TerminalLane): boolean => {
    if (a.nodeId !== b.nodeId || a.orientation !== b.orientation) {
      return false;
    }

    if (a.orientation === 'H') {
      const aOnHorizontalFace =
        Math.abs(a.boundary.x - a.rect.left) < 1 || Math.abs(a.boundary.x - a.rect.right) < 1;
      return aOnHorizontalFace && sameX(a.boundary, b.boundary, 1);
    }

    const aOnVerticalFace =
      Math.abs(a.boundary.y - a.rect.top) < 1 || Math.abs(a.boundary.y - a.rect.bottom) < 1;
    return aOnVerticalFace && sameY(a.boundary, b.boundary, 1);
  };

  const exactTerminalLaneConflict = (a: TerminalLane, b: TerminalLane): boolean => {
    if (a.nodeId !== b.nodeId || a.orientation !== b.orientation) {
      return false;
    }

    const shared = projectedOverlapLength(a, b);
    return shared >= MIN_SHARED && Math.abs(a.coord - b.coord) < 0.5;
  };

  const nearTerminalLaneConflict = (a: TerminalLane, b: TerminalLane): boolean => {
    if (
      a.nodeId !== b.nodeId ||
      a.orientation !== b.orientation ||
      a.orientation !== 'H' ||
      a.atStart === b.atStart
    ) {
      return false;
    }

    const shared = projectedOverlapLength(a, b);
    if (shared < MIN_SHARED) {
      return false;
    }
    const faceSpan = a.rect.bottom - a.rect.top;
    if (shared < faceSpan || shared > 2 * faceSpan) {
      return false;
    }

    // Wybrow-style nudging keeps connector topology fixed while preserving
    // ordering constraints; rendered terminal tracks on the same object face
    // need the same treatment before endpoint duplication pins them in place.
    return sameTerminalFace(a, b) && Math.abs(a.coord - b.coord) < MIN_FACE_CLEARANCE;
  };

  const shiftedCandidate = (lane: TerminalLane, shift: number): PointLite[] | undefined => {
    const points = dedupeConsecutivePoints((lane.edge as { points?: PointLite[] }).points ?? []);
    if (points.length < 2) {
      return undefined;
    }

    const shiftedBoundary =
      lane.orientation === 'V'
        ? { x: lane.boundary.x + shift, y: lane.boundary.y }
        : { x: lane.boundary.x, y: lane.boundary.y + shift };
    const shiftedRailEnd =
      lane.orientation === 'V'
        ? { x: lane.railEnd.x + shift, y: lane.railEnd.y }
        : { x: lane.railEnd.x, y: lane.railEnd.y + shift };

    const boundaryStaysOnSameFace = (): boolean => {
      if (
        Math.abs(lane.boundary.y - lane.rect.top) < 1 ||
        Math.abs(lane.boundary.y - lane.rect.bottom) < 1
      ) {
        const span = usableFace(lane.rect.left, lane.rect.right);
        return (
          sameY(shiftedBoundary, lane.boundary, EPS_LOCAL) &&
          shiftedBoundary.x >= span.low &&
          shiftedBoundary.x <= span.high
        );
      }

      if (
        Math.abs(lane.boundary.x - lane.rect.left) < 1 ||
        Math.abs(lane.boundary.x - lane.rect.right) < 1
      ) {
        const span = usableFace(lane.rect.top, lane.rect.bottom);
        return (
          sameX(shiftedBoundary, lane.boundary, EPS_LOCAL) &&
          shiftedBoundary.y >= span.low &&
          shiftedBoundary.y <= span.high
        );
      }

      return false;
    };

    if (!boundaryStaysOnSameFace()) {
      return undefined;
    }

    if (lane.atStart) {
      const railEndIsAdjacent = points.length > 1 && samePoint(points[1], lane.railEnd, EPS_LOCAL);
      const rest = points.slice(railEndIsAdjacent ? 2 : 1);
      const next = rest[0];
      if (next && !orthogonallyAligned(next, shiftedRailEnd)) {
        return undefined;
      }
      return [shiftedBoundary, shiftedRailEnd, ...rest];
    }

    const railEndIsAdjacent =
      points.length > 1 && samePoint(points[points.length - 2], lane.railEnd, EPS_LOCAL);
    const before = points.slice(0, railEndIsAdjacent ? -2 : -1);
    const previous = before[before.length - 1];
    if (previous && !orthogonallyAligned(previous, shiftedRailEnd)) {
      return undefined;
    }
    return [...before, shiftedRailEnd, shiftedBoundary];
  };

  const laneIsStraightCollinearConnector = (lane: TerminalLane): boolean => {
    const edge = lane.edge as { points?: PointLite[]; start?: string; end?: string };
    const points = dedupeConsecutivePoints(edge.points ?? []);
    if (points.length !== 2) {
      return false;
    }
    const startId = edge.start;
    const endId = edge.end;
    const start = startId ? nodeByIdMap.get(startId) : undefined;
    const end = endId ? nodeByIdMap.get(endId) : undefined;
    if (!start || !end) {
      return false;
    }

    const startX = (start as { x?: number }).x ?? 0;
    const startY = (start as { y?: number }).y ?? 0;
    const endX = (end as { x?: number }).x ?? 0;
    const endY = (end as { y?: number }).y ?? 0;
    const [a, b] = points;

    return (
      (sameY(a, b, EPS_LOCAL) && Math.abs(startY - endY) < 1 && Math.abs(startX - endX) > 1) ||
      (sameX(a, b, EPS_LOCAL) && Math.abs(startX - endX) < 1 && Math.abs(startY - endY) > 1)
    );
  };

  const usableSpanOf = (lane: TerminalLane) =>
    lane.orientation === 'H'
      ? usableFace(lane.rect.top, lane.rect.bottom)
      : usableFace(lane.rect.left, lane.rect.right);

  // The shift that takes a lane to the end of its face's usable span, away from another lane;
  // zero when the lane already sits there.
  const shiftToFaceLimit = (lane: TerminalLane, other: TerminalLane): number => {
    const span = usableSpanOf(lane);
    const away = lane.coord < other.coord ? span.low - lane.coord : span.high - lane.coord;
    return Math.sign(away) === Math.sign(lane.coord - other.coord) ? away : 0;
  };

  // The shifts that take a lane to either end of its face's usable span.
  const shiftsToFaceEnds = (lane: TerminalLane): number[] => {
    const span = usableSpanOf(lane);
    return [span.low - lane.coord, span.high - lane.coord];
  };

  const shifts = [
    -TRACK_SHIFT,
    TRACK_SHIFT,
    -2 * TRACK_SHIFT,
    2 * TRACK_SHIFT,
    -3 * TRACK_SHIFT,
    3 * TRACK_SHIFT,
  ];

  for (let iteration = 0; iteration < 8; iteration++) {
    const lanes = edges
      .filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly)
      .flatMap((edge) => [terminalLaneFor(edge, true), terminalLaneFor(edge, false)])
      .filter((lane): lane is TerminalLane => Boolean(lane));

    let fixed = false;
    for (let i = 0; i < lanes.length && !fixed; i++) {
      for (let j = i + 1; j < lanes.length && !fixed; j++) {
        const first = lanes[i];
        const second = lanes[j];
        if (
          first.edge === second.edge ||
          !(exactTerminalLaneConflict(first, second) || nearTerminalLaneConflict(first, second))
        ) {
          continue;
        }

        const fixingNearConflict = !exactTerminalLaneConflict(first, second);
        const candidates = [first, second].sort((a, b) => {
          const aPreservesStraight = laneIsStraightCollinearConnector(a);
          const bPreservesStraight = laneIsStraightCollinearConnector(b);
          if (aPreservesStraight !== bPreservesStraight) {
            return Number(aPreservesStraight) - Number(bPreservesStraight);
          }
          return Number(!b.atStart) - Number(!a.atStart);
        });
        const conflictsWith = (lane: TerminalLane, nextLane: TerminalLane, near: boolean) =>
          lanes.some(
            (other) =>
              other.edge !== lane.edge &&
              (exactTerminalLaneConflict(nextLane, other) ||
                (near && nearTerminalLaneConflict(nextLane, other)))
          );
        // The distance from a lane to the closest other track along the same stretch of its face.
        const closestTrackGap = (lane: TerminalLane, at: TerminalLane): number =>
          Math.min(
            ...lanes
              .filter(
                (other) =>
                  other.edge !== lane.edge &&
                  other.nodeId === at.nodeId &&
                  other.orientation === at.orientation &&
                  projectedOverlapLength(at, other) >= MIN_SHARED
              )
              .map((other) => Math.abs(at.coord - other.coord))
          );
        const accept = (
          lane: TerminalLane,
          candidate: PointLite[] | undefined,
          near: boolean,
          keepClosestGap = false
        ) => {
          const nextLane = candidate
            ? terminalLaneFor({ ...lane.edge, points: candidate }, lane.atStart)
            : undefined;
          if (
            !candidate ||
            !nextLane ||
            conflictsWith(lane, nextLane, near) ||
            (keepClosestGap && closestTrackGap(lane, nextLane) < closestTrackGap(lane, lane))
          ) {
            return false;
          }
          (lane.edge as { points: PointLite[] }).points = candidate;
          return true;
        };
        // Two tracks that are merely close leave a straight connector between aligned nodes
        // where it is; only two tracks drawn on top of each other may move it.
        const movable = fixingNearConflict
          ? candidates.filter((lane) => !laneIsStraightCollinearConnector(lane))
          : candidates;
        for (const lane of movable) {
          fixed = shifts.some((shift) =>
            accept(lane, shiftedCandidate(lane, shift), fixingNearConflict)
          );
          if (fixed) {
            break;
          }
        }
        // When no whole step fits on the face, a near conflict moves the lane as far from the
        // other as the face allows, so the gap widens and the lane stays on the face; two tracks
        // on top of each other take either end of the face. Neither move may bring the lane
        // closer to its closest track than it already is.
        if (!fixed) {
          for (const lane of movable) {
            const other = lane === first ? second : first;
            const faceShifts = fixingNearConflict
              ? [shiftToFaceLimit(lane, other)]
              : shiftsToFaceEnds(lane);
            fixed = faceShifts.some(
              (shift) =>
                Math.abs(shift) > EPS_LOCAL &&
                accept(lane, shiftedCandidate(lane, shift), false, true)
            );
            if (fixed) {
              break;
            }
          }
        }
      }
    }

    if (!fixed) {
      return;
    }
  }
}

export function collapseRedundantRectangularDoglegs(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const BUFFER = 2;
  const MAX_ITERATIONS = 8;

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );

  const candidateIsSafe = (edge: MaterializedEdge, candidate: PointLite[]): boolean => {
    const sourceId = (edge as { start?: string }).start;
    const targetId = (edge as { end?: string }).end;
    const candidateSegments = segmentsFor(candidate);
    if (candidateSegments.length !== candidate.length - 1) {
      return false;
    }

    const endpointIds = [sourceId, targetId].filter((id): id is string => Boolean(id));
    for (const segment of candidateSegments) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
        return false;
      }
      if (segmentHitsAnyRect(segment.a, segment.b, labelRects, [], -BUFFER)) {
        return false;
      }
    }

    for (const other of edges) {
      if (other === edge || (other as { isLayoutOnly?: boolean }).isLayoutOnly) {
        continue;
      }
      const otherPoints = (other as { points?: PointLite[] }).points;
      if (!otherPoints || otherPoints.length < 2) {
        continue;
      }
      for (const candidateSegment of candidateSegments) {
        for (const otherSegment of segmentsFor(dedupeConsecutivePoints(otherPoints))) {
          if (sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED) {
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

  const withoutDogleg = (points: PointLite[], i: number): PointLite[] | undefined => {
    if (i + 4 >= points.length) {
      return undefined;
    }
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];
    const p4 = points[i + 4];

    const terminalVerticalDogleg =
      isHorizontalSegment(p0, p1) &&
      isVerticalSegment(p1, p2) &&
      isHorizontalSegment(p2, p3) &&
      isVerticalSegment(p3, p4) &&
      sameX(p0, p3, EPS_LOCAL) &&
      sameX(p0, p4, EPS_LOCAL) &&
      sameX(p1, p2, EPS_LOCAL) &&
      (p1.x - p0.x) * (p3.x - p2.x) < 0;

    const terminalHorizontalDogleg =
      isVerticalSegment(p0, p1) &&
      isHorizontalSegment(p1, p2) &&
      isVerticalSegment(p2, p3) &&
      isHorizontalSegment(p3, p4) &&
      sameY(p0, p3, EPS_LOCAL) &&
      sameY(p0, p4, EPS_LOCAL) &&
      sameY(p1, p2, EPS_LOCAL) &&
      (p1.y - p0.y) * (p3.y - p2.y) < 0;

    if (terminalVerticalDogleg || terminalHorizontalDogleg) {
      return dedupeConsecutivePoints([...points.slice(0, i + 1), p4, ...points.slice(i + 5)]);
    }

    if (i + 5 >= points.length) {
      return undefined;
    }
    const p5 = points[i + 5];

    const verticalDogleg =
      isVerticalSegment(p0, p1) &&
      isHorizontalSegment(p1, p2) &&
      isVerticalSegment(p2, p3) &&
      isHorizontalSegment(p3, p4) &&
      isVerticalSegment(p4, p5) &&
      sameX(p0, p4, EPS_LOCAL) &&
      sameX(p0, p5, EPS_LOCAL) &&
      sameX(p2, p3, EPS_LOCAL) &&
      (p2.x - p1.x) * (p4.x - p3.x) < 0;

    const horizontalDogleg =
      isHorizontalSegment(p0, p1) &&
      isVerticalSegment(p1, p2) &&
      isHorizontalSegment(p2, p3) &&
      isVerticalSegment(p3, p4) &&
      isHorizontalSegment(p4, p5) &&
      sameY(p0, p4, EPS_LOCAL) &&
      sameY(p0, p5, EPS_LOCAL) &&
      sameY(p2, p3, EPS_LOCAL) &&
      (p2.y - p1.y) * (p4.y - p3.y) < 0;

    if (!verticalDogleg && !horizontalDogleg) {
      return undefined;
    }

    return dedupeConsecutivePoints([...points.slice(0, i + 1), p5, ...points.slice(i + 6)]);
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let fixed = false;
    for (const edge of edges) {
      if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
        continue;
      }
      const points = dedupeConsecutivePoints((edge as { points?: PointLite[] }).points ?? []);
      for (let i = 0; i <= points.length - 5; i++) {
        const candidate = withoutDogleg(points, i);
        if (!candidate || !candidateIsSafe(edge, candidate)) {
          continue;
        }
        (edge as { points: PointLite[] }).points = candidate;
        fixed = true;
        break;
      }
      if (fixed) {
        break;
      }
    }
    if (!fixed) {
      return;
    }
  }
}

export function liftObstacleHuggingSameSideRails(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const BUFFER = 2;
  const CLEARANCE = 20;
  const MAX_ITERATIONS = 8;

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );
  const visibleEdges = edges.filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly);

  const pointsFor = (
    edge: MaterializedEdge,
    replacementEdge?: MaterializedEdge,
    replacement?: PointLite[]
  ): PointLite[] =>
    dedupeConsecutivePoints(
      edge === replacementEdge
        ? (replacement ?? [])
        : ((edge as { points?: PointLite[] }).points ?? [])
    );

  const strictCrossingCount = (
    replacementEdge?: MaterializedEdge,
    replacement?: PointLite[]
  ): number => {
    let count = 0;
    for (let i = 0; i < visibleEdges.length; i++) {
      const firstSegments = segmentsFor(pointsFor(visibleEdges[i], replacementEdge, replacement));
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const secondSegments = segmentsFor(
          pointsFor(visibleEdges[j], replacementEdge, replacement)
        );
        for (const firstSegment of firstSegments) {
          for (const secondSegment of secondSegments) {
            if (
              orthogonalSegmentsStrictlyCross(
                firstSegment.a,
                firstSegment.b,
                secondSegment.a,
                secondSegment.b,
                EPS_LOCAL
              )
            ) {
              count++;
            }
          }
        }
      }
    }
    return count;
  };

  const middleRail = (
    points: PointLite[]
  ):
    | { index: number; horizontal: boolean; vertical: boolean; segment: SegmentLite }
    | undefined => {
    const segments = segmentsFor(points);
    if (segments.length !== 3) {
      return undefined;
    }
    const middle = segments[1];
    if (
      segments[0].horizontal === middle.horizontal ||
      segments[2].horizontal === middle.horizontal
    ) {
      return undefined;
    }
    return {
      index: middle.index,
      horizontal: middle.horizontal,
      vertical: middle.vertical,
      segment: middle,
    };
  };

  const blockingRectsFor = (edge: MaterializedEdge, rail: SegmentLite) => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    return realNodeRects.filter((entry) => {
      if (endpointIds.includes(entry.id)) {
        return false;
      }
      const rect = entry.rect;
      if (rail.horizontal) {
        const xOverlap = overlapLength(rail.a.x, rail.b.x, rect.left, rect.right);
        return (
          xOverlap >= MIN_SHARED &&
          rail.a.y >= rect.top - BUFFER &&
          rail.a.y <= rect.bottom + BUFFER
        );
      }
      const yOverlap = overlapLength(rail.a.y, rail.b.y, rect.top, rect.bottom);
      return (
        yOverlap >= MIN_SHARED && rail.a.x >= rect.left - BUFFER && rail.a.x <= rect.right + BUFFER
      );
    });
  };

  const candidateByMovingRail = (
    points: PointLite[],
    rail: SegmentLite,
    coord: number
  ): PointLite[] | undefined => {
    const candidate = points.map((point) => ({ ...point }));
    if (rail.horizontal) {
      candidate[rail.index].y = coord;
      candidate[rail.index + 1].y = coord;
    } else if (rail.vertical) {
      candidate[rail.index].x = coord;
      candidate[rail.index + 1].x = coord;
    } else {
      return undefined;
    }
    const simplified = simplifyPolyline(dedupeConsecutivePoints(candidate));
    return segmentsFor(simplified).length === simplified.length - 1 ? simplified : undefined;
  };

  const candidateIsSafe = (
    edge: MaterializedEdge,
    candidate: PointLite[],
    currentCrossings: number
  ): boolean => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    const candidateSegments = segmentsFor(candidate);
    if (candidateSegments.length !== candidate.length - 1) {
      return false;
    }

    for (const segment of candidateSegments) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
        return false;
      }
      if (segmentHitsAnyRect(segment.a, segment.b, labelRects, [], -BUFFER)) {
        return false;
      }
    }

    for (const other of visibleEdges) {
      if (other === edge) {
        continue;
      }
      for (const candidateSegment of candidateSegments) {
        for (const otherSegment of segmentsFor(pointsFor(other))) {
          if (sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED) {
            return false;
          }
        }
      }
    }

    return strictCrossingCount(edge, candidate) <= currentCrossings;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const currentCrossings = strictCrossingCount();
    let fixed = false;

    for (const edge of visibleEdges) {
      const points = pointsFor(edge);
      const rail = middleRail(points);
      if (!rail) {
        continue;
      }
      const blockers = blockingRectsFor(edge, rail.segment);
      if (blockers.length === 0) {
        continue;
      }

      const coords = rail.horizontal
        ? [
            Math.min(...blockers.map((entry) => entry.rect.top)) - CLEARANCE,
            Math.max(...blockers.map((entry) => entry.rect.bottom)) + CLEARANCE,
          ]
        : [
            Math.min(...blockers.map((entry) => entry.rect.left)) - CLEARANCE,
            Math.max(...blockers.map((entry) => entry.rect.right)) + CLEARANCE,
          ];

      for (const coord of coords) {
        const candidate = candidateByMovingRail(points, rail.segment, coord);
        if (!candidate || !candidateIsSafe(edge, candidate, currentCrossings)) {
          continue;
        }
        (edge as { points: PointLite[] }).points = candidate;
        fixed = true;
        break;
      }
      if (fixed) {
        break;
      }
    }

    if (!fixed) {
      return;
    }
  }
}

/**
 * Moves top-lane title bands above any rail that crosses them. A lane with no
 * `direction` of its own takes the layout's `direction`.
 */
export function liftTopLaneTitleBandsAboveRails(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>,
  layoutDirection?: string
): void {
  const CLEARANCE = 4;

  interface LaneTitle {
    node: MaterializedNode;
    rect: RectLite;
  }

  const validTitleRect = (node: MaterializedNode): RectLite | undefined => {
    const rect = (node as { groupTitleRect?: Partial<RectBounds> }).groupTitleRect;
    if (
      !rect ||
      typeof rect.left !== 'number' ||
      typeof rect.right !== 'number' ||
      typeof rect.top !== 'number' ||
      typeof rect.bottom !== 'number' ||
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.right) ||
      !Number.isFinite(rect.top) ||
      !Number.isFinite(rect.bottom) ||
      rect.right <= rect.left ||
      rect.bottom <= rect.top
    ) {
      return undefined;
    }
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  };

  const laneModel = buildLaneModel([...nodeByIdMap.values()]);

  const topLaneTitleFor = (node: MaterializedNode): LaneTitle | undefined => {
    if (!laneModel.isLane(node.id)) {
      return undefined;
    }
    const direction = upperCaseDirection(
      (node as { direction?: unknown }).direction ?? layoutDirection
    );
    if (direction === 'LR' || direction === 'RL' || direction === 'BT') {
      return undefined;
    }
    const rect = validTitleRect(node);
    const y = (node as { y?: number }).y;
    const height = (node as { height?: number }).height;
    if (
      !rect ||
      typeof y !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(y) ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      return undefined;
    }
    const titleWidth = rect.right - rect.left;
    const titleHeight = rect.bottom - rect.top;
    if (titleHeight <= 0 || titleWidth < titleHeight) {
      return undefined;
    }
    return { node, rect };
  };

  const horizontalSegmentIntersectsTitle = (segment: SegmentLite, rect: RectLite): boolean => {
    if (!segment.horizontal) {
      return false;
    }
    const y = segment.a.y;
    // A rail along the band's edge counts, as it does for validateLayout.
    if (y < rect.top - EPS_LOCAL || y > rect.bottom + EPS_LOCAL) {
      return false;
    }
    return overlapLength(segment.a.x, segment.b.x, rect.left, rect.right) >= MIN_SHARED;
  };

  const lanes = [...nodeByIdMap.values()]
    .map(topLaneTitleFor)
    .filter((lane): lane is LaneTitle => Boolean(lane));
  if (lanes.length === 0) {
    return;
  }

  let topDelta = 0;
  for (const edge of edges) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const points = dedupeConsecutivePoints((edge as { points?: PointLite[] }).points ?? []);
    for (const segment of segmentsFor(points)) {
      for (const lane of lanes) {
        if (!horizontalSegmentIntersectsTitle(segment, lane.rect)) {
          continue;
        }
        topDelta = Math.max(topDelta, lane.rect.bottom - segment.a.y + CLEARANCE);
      }
    }
  }

  if (topDelta <= EPS_LOCAL) {
    return;
  }

  for (const lane of lanes) {
    const y = (lane.node as { y?: number }).y;
    const height = (lane.node as { height?: number }).height;
    if (
      typeof y !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(y) ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      continue;
    }
    lane.node.y = y - topDelta / 2;
    lane.node.height = height + topDelta;
    lane.node.groupTitleRect = {
      ...lane.rect,
      top: lane.rect.top - topDelta,
      bottom: lane.rect.bottom - topDelta,
    };
  }
}

/**
 * Moves left-lane title bands of an LR layout left of any rail that crosses them.
 * A lane with no `direction` of its own takes the layout's `direction`.
 */
export function shiftLeftLaneTitleBandsLeftOfRails(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>,
  layoutDirection?: string
): void {
  const CLEARANCE = 4;

  interface LaneTitle {
    node: MaterializedNode;
    rect: RectLite;
  }

  const validTitleRect = (node: MaterializedNode): RectLite | undefined => {
    const rect = (node as { groupTitleRect?: Partial<RectBounds> }).groupTitleRect;
    if (
      !rect ||
      typeof rect.left !== 'number' ||
      typeof rect.right !== 'number' ||
      typeof rect.top !== 'number' ||
      typeof rect.bottom !== 'number' ||
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.right) ||
      !Number.isFinite(rect.top) ||
      !Number.isFinite(rect.bottom) ||
      rect.right <= rect.left ||
      rect.bottom <= rect.top
    ) {
      return undefined;
    }
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  };

  const laneModel = buildLaneModel([...nodeByIdMap.values()]);

  const leftLaneTitleFor = (node: MaterializedNode): LaneTitle | undefined => {
    if (!laneModel.isLane(node.id)) {
      return undefined;
    }
    const direction = upperCaseDirection(
      (node as { direction?: unknown }).direction ?? layoutDirection
    );
    if (direction !== 'LR') {
      return undefined;
    }
    const rect = validTitleRect(node);
    const x = (node as { x?: number }).x;
    const width = (node as { width?: number }).width;
    if (
      !rect ||
      typeof x !== 'number' ||
      typeof width !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(width) ||
      width <= 0
    ) {
      return undefined;
    }
    const titleWidth = rect.right - rect.left;
    const titleHeight = rect.bottom - rect.top;
    if (titleWidth <= 0 || titleHeight < titleWidth) {
      return undefined;
    }
    return { node, rect };
  };

  const verticalSegmentIntersectsTitle = (segment: SegmentLite, rect: RectLite): boolean => {
    if (!segment.vertical) {
      return false;
    }
    const x = segment.a.x;
    // A rail along the band's edge counts, as it does for validateLayout.
    if (x < rect.left - EPS_LOCAL || x > rect.right + EPS_LOCAL) {
      return false;
    }
    return overlapLength(segment.a.y, segment.b.y, rect.top, rect.bottom) >= MIN_SHARED;
  };

  const horizontalSegmentIntersectsTitle = (segment: SegmentLite, rect: RectLite): boolean => {
    if (!segment.horizontal) {
      return false;
    }
    const y = segment.a.y;
    // A rail along the band's edge counts, as it does for validateLayout.
    if (y < rect.top - EPS_LOCAL || y > rect.bottom + EPS_LOCAL) {
      return false;
    }
    return overlapLength(segment.a.x, segment.b.x, rect.left, rect.right) >= MIN_SHARED;
  };

  const lanes = [...nodeByIdMap.values()]
    .map(leftLaneTitleFor)
    .filter((lane): lane is LaneTitle => Boolean(lane));
  if (lanes.length === 0) {
    return;
  }

  let leftDelta = 0;
  for (const edge of edges) {
    if ((edge as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const points = dedupeConsecutivePoints((edge as { points?: PointLite[] }).points ?? []);
    for (const segment of segmentsFor(points)) {
      for (const lane of lanes) {
        if (verticalSegmentIntersectsTitle(segment, lane.rect)) {
          leftDelta = Math.max(leftDelta, lane.rect.right - segment.a.x + CLEARANCE);
        } else if (horizontalSegmentIntersectsTitle(segment, lane.rect)) {
          const segmentLeft = Math.min(segment.a.x, segment.b.x);
          leftDelta = Math.max(leftDelta, lane.rect.right - segmentLeft + CLEARANCE);
        }
      }
    }
  }

  if (leftDelta <= EPS_LOCAL) {
    return;
  }

  for (const lane of lanes) {
    const x = (lane.node as { x?: number }).x;
    const width = (lane.node as { width?: number }).width;
    if (
      typeof x !== 'number' ||
      typeof width !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(width) ||
      width <= 0
    ) {
      continue;
    }
    lane.node.x = x - leftDelta / 2;
    lane.node.width = width + leftDelta;
    lane.node.groupTitleRect = {
      ...lane.rect,
      left: lane.rect.left - leftDelta,
      right: lane.rect.right - leftDelta,
    };
  }
}

export function swapDestinationTerminalTailsToReduceCrossings(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const BUFFER = 2;
  const MAX_ITERATIONS = 4;

  interface TerminalTail {
    tailStart: PointLite;
    terminal: PointLite;
  }

  const { realNodeRects } = collectNodeRectEntries(nodeByIdMap.values());
  const visibleEdges = edges.filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly);

  const replacementPointsFor = (
    edge: MaterializedEdge,
    replacements: EdgeReplacementMap = new Map()
  ): PointLite[] =>
    dedupeConsecutivePoints(
      replacements.get(edge) ?? (edge as { points?: PointLite[] }).points ?? []
    );

  const terminalTailFor = (edge: MaterializedEdge): TerminalTail | undefined => {
    const points = replacementPointsFor(edge);
    if (points.length < 4) {
      return undefined;
    }
    const tailStart = points[points.length - 2];
    const terminal = points[points.length - 1];
    if (
      !isHorizontalSegment(tailStart, terminal, EPS_LOCAL) &&
      !isVerticalSegment(tailStart, terminal, EPS_LOCAL)
    ) {
      return undefined;
    }
    return { tailStart, terminal };
  };

  const candidateWithDestinationTail = (
    edge: MaterializedEdge,
    tail: TerminalTail
  ): PointLite[] | undefined => {
    const points = replacementPointsFor(edge);
    if (points.length < 3) {
      return undefined;
    }
    const start = points[0];
    const firstTurn = points[1];

    let connector: PointLite;
    if (isHorizontalSegment(start, firstTurn, EPS_LOCAL)) {
      connector = { x: firstTurn.x, y: tail.tailStart.y };
    } else if (isVerticalSegment(start, firstTurn, EPS_LOCAL)) {
      connector = { x: tail.tailStart.x, y: firstTurn.y };
    } else {
      return undefined;
    }

    const candidate = simplifyPolyline(
      dedupeConsecutivePoints([start, firstTurn, connector, tail.tailStart, tail.terminal])
    );
    return segmentsFor(candidate).length === candidate.length - 1 ? candidate : undefined;
  };

  const pathHasNodeHit = (edge: MaterializedEdge, path: PointLite[]): boolean => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    for (const segment of segmentsFor(path)) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
        return true;
      }
    }
    return false;
  };

  /** `path` for `edge` shares a track with another route, `partnerPath` standing in for `partner`. */
  const pathHasSharedTrack = (
    round: RoundRoutes,
    [edge, path]: [MaterializedEdge, PointLite[]],
    [partner, partnerPath]: [MaterializedEdge, PointLite[]]
  ): boolean => {
    const partnerSegments = segmentsFor(dedupeConsecutivePoints(partnerPath));
    return segmentsFor(path).some(
      (segment) =>
        round.tracks
          .alongside(segment, 1)
          .some(
            ({ owner, segment: other }) =>
              owner !== edge && owner !== partner && sharesTrack(segment, other)
          ) || partnerSegments.some((other) => sharesTrack(segment, other))
    );
  };

  const candidateIsSafe = (
    round: RoundRoutes,
    replacement: [MaterializedEdge, PointLite[]],
    partner: [MaterializedEdge, PointLite[]]
  ): boolean =>
    !pathHasNodeHit(replacement[0], replacement[1]) &&
    !pathHasSharedTrack(round, replacement, partner);

  /** The bends and the crossings of all routes once both edges take their candidates. */
  const scoreSwap = (
    round: RoundRoutes,
    replacements: EdgeReplacementMap
  ): { crossings: number; bends: number } => {
    let bends = round.totalBends;
    const segments = new Map<MaterializedEdge, SegmentLite[]>();
    for (const [edge, points] of replacements) {
      const deduped = dedupeConsecutivePoints(points);
      bends += countOrthogonalBends(deduped) - (round.bendsByEdge.get(edge) ?? 0);
      segments.set(edge, segmentsFor(deduped));
    }
    return { crossings: round.routes.totalWith(segments), bends };
  };

  const edgesByDestination = (): Map<string, MaterializedEdge[]> => {
    const result = new Map<string, MaterializedEdge[]>();
    for (const edge of visibleEdges) {
      const dstId = (edge as { end?: string }).end;
      if (!dstId || !nodeByIdMap.has(dstId)) {
        continue;
      }
      const points = replacementPointsFor(edge);
      if (points.length < 4) {
        continue;
      }
      const bucket = result.get(dstId) ?? [];
      bucket.push(edge);
      result.set(dstId, bucket);
    }
    return result;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const round = roundRoutes(visibleEdges);
    const currentCrossings = round.routes.total;
    if (currentCrossings === 0) {
      return;
    }
    const currentBends = round.totalBends;

    let bestReplacements: EdgeReplacementMap | undefined;
    let bestCrossings = currentCrossings;
    let bestBends = currentBends;

    for (const destinationEdges of edgesByDestination().values()) {
      for (let i = 0; i < destinationEdges.length; i++) {
        for (let j = i + 1; j < destinationEdges.length; j++) {
          const first = destinationEdges[i];
          const second = destinationEdges[j];
          const firstTail = terminalTailFor(first);
          const secondTail = terminalTailFor(second);
          if (!firstTail || !secondTail) {
            continue;
          }

          const firstCandidate = candidateWithDestinationTail(first, secondTail);
          const secondCandidate = candidateWithDestinationTail(second, firstTail);
          if (!firstCandidate || !secondCandidate) {
            continue;
          }

          const replacements = new Map<MaterializedEdge, PointLite[]>([
            [first, firstCandidate],
            [second, secondCandidate],
          ]);
          if (
            !candidateIsSafe(round, [first, firstCandidate], [second, secondCandidate]) ||
            !candidateIsSafe(round, [second, secondCandidate], [first, firstCandidate])
          ) {
            continue;
          }

          const { crossings: candidateCrossings, bends: candidateBends } = scoreSwap(
            round,
            replacements
          );
          if (candidateCrossings >= currentCrossings) {
            continue;
          }
          if (
            candidateCrossings > bestCrossings ||
            (candidateCrossings === bestCrossings && candidateBends >= bestBends)
          ) {
            continue;
          }
          bestReplacements = replacements;
          bestCrossings = candidateCrossings;
          bestBends = candidateBends;
        }
      }
    }

    if (!bestReplacements) {
      return;
    }

    for (const [edge, points] of bestReplacements) {
      (edge as { points: PointLite[] }).points = points;
    }
  }
}

// Crossing cleanup sometimes requires reordering a small channel bundle as a
// transaction: moving either rail alone is neutral or worse, while swapping the
// shared external tracks removes crossings. Keep the search local and bounded,
// but score it globally so crossing count stays the first acceptance criterion.
export function reassignCrossingExternalRailChannels(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const BUFFER = 2;
  const RAIL_CHANNEL_GAP = 12;
  const MAX_ITERATIONS = 4;
  const MAX_EXHAUSTIVE_COMPONENT = 6;

  type RailAxis = 'horizontal' | 'vertical';

  interface ExternalRail {
    edge: MaterializedEdge;
    points: PointLite[];
    segmentIndex: number;
    axis: RailAxis;
    side: RectSide;
    coord: number;
    min: number;
    max: number;
  }

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );
  const visibleEdges = edges.filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly);

  const replacementPointsFor = (
    edge: MaterializedEdge,
    replacements: EdgeReplacementMap = new Map()
  ): PointLite[] =>
    dedupeConsecutivePoints(
      replacements.get(edge) ?? (edge as { points?: PointLite[] }).points ?? []
    );

  const endpointRectsFor = (
    edge: MaterializedEdge
  ): { src: RectLite; dst: RectLite } | undefined => {
    const srcId = (edge as { start?: string }).start;
    const dstId = (edge as { end?: string }).end;
    const srcNode = srcId ? nodeByIdMap.get(srcId) : undefined;
    const dstNode = dstId ? nodeByIdMap.get(dstId) : undefined;
    const src = srcNode ? rectOfNodeBounds(srcNode) : undefined;
    const dst = dstNode ? rectOfNodeBounds(dstNode) : undefined;
    return src && dst ? { src, dst } : undefined;
  };

  const externalRailForSegment = (
    edge: MaterializedEdge,
    points: PointLite[],
    segment: SegmentLite
  ): ExternalRail | undefined => {
    if (segment.index <= 0 || segment.index + 1 >= points.length - 1) {
      return undefined;
    }

    const endpointRects = endpointRectsFor(edge);
    if (!endpointRects) {
      return undefined;
    }

    if (segment.vertical) {
      const coord = segment.a.x;
      const leftBound = Math.min(endpointRects.src.left, endpointRects.dst.left);
      const rightBound = Math.max(endpointRects.src.right, endpointRects.dst.right);
      const side: RectSide | undefined =
        coord < leftBound - EPS_LOCAL
          ? 'left'
          : coord > rightBound + EPS_LOCAL
            ? 'right'
            : undefined;
      if (!side) {
        return undefined;
      }
      return {
        edge,
        points,
        segmentIndex: segment.index,
        axis: 'vertical',
        side,
        coord,
        min: Math.min(segment.a.y, segment.b.y),
        max: Math.max(segment.a.y, segment.b.y),
      };
    }

    if (segment.horizontal) {
      const coord = segment.a.y;
      const topBound = Math.min(endpointRects.src.top, endpointRects.dst.top);
      const bottomBound = Math.max(endpointRects.src.bottom, endpointRects.dst.bottom);
      const side: RectSide | undefined =
        coord < topBound - EPS_LOCAL
          ? 'top'
          : coord > bottomBound + EPS_LOCAL
            ? 'bottom'
            : undefined;
      if (!side) {
        return undefined;
      }
      return {
        edge,
        points,
        segmentIndex: segment.index,
        axis: 'horizontal',
        side,
        coord,
        min: Math.min(segment.a.x, segment.b.x),
        max: Math.max(segment.a.x, segment.b.x),
      };
    }

    return undefined;
  };

  const collectExternalRails = (): ExternalRail[] => {
    const rails: ExternalRail[] = [];
    for (const edge of visibleEdges) {
      const points = replacementPointsFor(edge);
      for (const segment of segmentsFor(points)) {
        const rail = externalRailForSegment(edge, points, segment);
        if (rail) {
          rails.push(rail);
        }
      }
    }
    return rails;
  };

  const railsInteract = (a: ExternalRail, b: ExternalRail): boolean =>
    a.edge !== b.edge &&
    a.axis === b.axis &&
    a.side === b.side &&
    overlapLength(a.min, a.max, b.min, b.max) >= MIN_SHARED;

  const connectedComponents = (rails: ExternalRail[]): ExternalRail[][] => {
    const result: ExternalRail[][] = [];
    const seen = new Set<ExternalRail>();
    for (const rail of rails) {
      if (seen.has(rail)) {
        continue;
      }
      const queue = [rail];
      const component: ExternalRail[] = [];
      seen.add(rail);
      while (queue.length > 0) {
        const current = queue.pop()!;
        component.push(current);
        for (const next of rails) {
          if (!seen.has(next) && railsInteract(current, next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      if (component.length > 1) {
        result.push(component);
      }
    }
    return result;
  };

  const uniqueCoordsFor = (component: ExternalRail[]): number[] => {
    const coords: number[] = [];
    for (const rail of component) {
      if (!coords.some((coord) => Math.abs(coord - rail.coord) < EPS_LOCAL)) {
        coords.push(rail.coord);
      }
    }

    while (coords.length < component.length) {
      const min = Math.min(...coords);
      const max = Math.max(...coords);
      const side = component[0].side;
      coords.push(
        side === 'left' || side === 'top'
          ? min - RAIL_CHANNEL_GAP * (component.length - coords.length)
          : max + RAIL_CHANNEL_GAP * (component.length - coords.length)
      );
    }
    return coords;
  };

  /** Every arrangement of the component's coordinates that moves some rail by the tolerance. */
  const permutedAssignmentsFor = (component: ExternalRail[]): number[][] => {
    const current = component.map((rail) => rail.coord);
    const coords = uniqueCoordsFor(component);
    const assignments: number[][] = [];
    const used = new Array(coords.length).fill(false);
    const next: number[] = [];
    const visit = () => {
      if (next.length === component.length) {
        if (next.some((coord, index) => Math.abs(coord - current[index]) >= EPS_LOCAL)) {
          assignments.push([...next]);
        }
        return;
      }
      for (const [i, coord] of coords.entries()) {
        if (used[i]) {
          continue;
        }
        used[i] = true;
        next.push(coord);
        visit();
        next.pop();
        used[i] = false;
      }
    };
    visit();
    return assignments;
  };

  /** One edge's route with its rails in a component at some coordinates. */
  interface RailDraft {
    points: PointLite[];
    /** The segments other routes meet, once repeated points are dropped. */
    segments: SegmentLite[];
    bends: number;
    /** A segment runs through a node other than the edge's ends, or through a label. */
    blocked: boolean;
  }

  /**
   * A component of rails and its edges' routes while every rail keeps its coordinate. An
   * assignment is scored from this by the edges whose routes it changes.
   */
  interface ComponentPlan {
    rails: ExternalRail[];
    /** The component's edges, in the order of their first rail. */
    members: MaterializedEdge[];
    memberSet: Set<MaterializedEdge>;
    /** For each member, the places of its rails in `rails`. */
    railPlaces: Map<MaterializedEdge, number[]>;
    /** For each member, its drafts by the coordinates of its rails. */
    drafts: Map<MaterializedEdge, Map<string, RailDraft | undefined>>;
    kept: Map<MaterializedEdge, RailDraft | undefined>;
    /** Members whose kept route is blocked: an assignment must change them. */
    mustMove: MaterializedEdge[];
    /** Members with no kept route at all: an assignment that leaves one is no route. */
    withoutRoute: MaterializedEdge[];
    /** Pairs of edges that share a track while every member keeps its route. */
    keptConflicts: [MaterializedEdge, MaterializedEdge][];
    keptTracks: TrackIndex<MaterializedEdge>;
    keptRoutes: RouteCrossings<MaterializedEdge>;
    keptBends: number;
  }

  /** One assignment to try: each rail's coordinate, and the rails whose coordinate it changes. */
  interface RailTrial {
    coordAt: (place: number) => number;
    moved: number[];
    displacement: () => number;
  }

  interface ScoredAssignment {
    changed: Map<MaterializedEdge, RailDraft>;
    crossings: number;
    bends: number;
  }

  /** Exact coordinates as a key; a negative zero keeps its sign, since it reaches the route. */
  const coordinateKey = (coords: number[]): string =>
    coords.map((coord) => (Object.is(coord, -0) ? '-0' : String(coord))).join(' ');

  const routeIsBlocked = (edge: MaterializedEdge, segments: SegmentLite[]): boolean => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    return segments.some(
      (segment) =>
        segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER) ||
        segmentHitsAnyRect(segment.a, segment.b, labelRects, [], -BUFFER)
    );
  };

  /** The route of `edge` with each of its rails moved to `coordAt(place)`; none if degenerate. */
  const buildRailDraft = (
    rails: ExternalRail[],
    edge: MaterializedEdge,
    places: number[],
    coordAt: (place: number) => number
  ): RailDraft | undefined => {
    const points = rails[places[0]].points.map((point) => ({ x: point.x, y: point.y }));
    for (const place of places) {
      const { axis, segmentIndex } = rails[place];
      const coord = coordAt(place);
      const key = axis === 'vertical' ? 'x' : 'y';
      points[segmentIndex][key] = coord;
      points[segmentIndex + 1][key] = coord;
    }
    const simplified = simplifyPolyline(dedupeConsecutivePoints(points));
    const segments = segmentsFor(simplified);
    if (segments.length !== simplified.length - 1) {
      return undefined;
    }
    const deduped = dedupeConsecutivePoints(simplified);
    return {
      points: simplified,
      segments: segmentsFor(deduped),
      bends: countOrthogonalBends(deduped),
      blocked: routeIsBlocked(edge, segments),
    };
  };

  const railDraft = (
    plan: ComponentPlan,
    edge: MaterializedEdge,
    coordAt: (place: number) => number
  ): RailDraft | undefined => {
    const places = plan.railPlaces.get(edge) ?? [];
    const drafts = plan.drafts.get(edge) ?? new Map<string, RailDraft | undefined>();
    plan.drafts.set(edge, drafts);
    const key = coordinateKey(places.map(coordAt));
    if (!drafts.has(key)) {
      drafts.set(key, buildRailDraft(plan.rails, edge, places, coordAt));
    }
    return drafts.get(key);
  };

  /** The edges whose route, kept or current, shares a track with `segment` of `edge`'s kept route. */
  const keptPartners = (
    round: RoundRoutes,
    plan: ComponentPlan,
    edge: MaterializedEdge,
    segment: SegmentLite
  ): MaterializedEdge[] => [
    ...round.tracks
      .alongside(segment, 1)
      .filter(
        ({ owner, segment: other }) => !plan.memberSet.has(owner) && sharesTrack(segment, other)
      )
      .map(({ owner }) => owner),
    ...plan.keptTracks
      .alongside(segment, 1)
      .filter(({ owner, segment: other }) => owner !== edge && sharesTrack(segment, other))
      .map(({ owner }) => owner),
  ];

  /** Pairs of routes that share a track while every member keeps its route. */
  const keptConflictsOf = (
    round: RoundRoutes,
    plan: ComponentPlan
  ): [MaterializedEdge, MaterializedEdge][] =>
    plan.members.flatMap((edge) =>
      (plan.kept.get(edge)?.segments ?? []).flatMap((segment) =>
        keptPartners(round, plan, edge, segment).map(
          (other): [MaterializedEdge, MaterializedEdge] => [edge, other]
        )
      )
    );

  const sameSegments = (first: SegmentLite[], second: SegmentLite[]): boolean =>
    first.length === second.length &&
    first.every(
      ({ a, b }, index) =>
        a.x === second[index].a.x &&
        a.y === second[index].a.y &&
        b.x === second[index].b.x &&
        b.y === second[index].b.y
    );

  /** The crossings of every route while each member keeps its route. */
  const keptRoutesOf = (
    round: RoundRoutes,
    plan: ComponentPlan
  ): RouteCrossings<MaterializedEdge> => {
    const keptSegments = (edge: MaterializedEdge): SegmentLite[] =>
      plan.kept.get(edge)?.segments ?? round.segmentsByEdge.get(edge) ?? [];
    const unchanged = plan.members.every((edge) =>
      sameSegments(keptSegments(edge), round.segmentsByEdge.get(edge) ?? [])
    );
    return unchanged
      ? round.routes
      : buildRouteCrossings(
          new Map(visibleEdges.map((edge) => [edge, keptSegments(edge)])),
          EPS_LOCAL
        );
  };

  const planComponent = (round: RoundRoutes, rails: ExternalRail[]): ComponentPlan => {
    const railPlaces = new Map<MaterializedEdge, number[]>();
    rails.forEach((rail, place) => {
      railPlaces.set(rail.edge, [...(railPlaces.get(rail.edge) ?? []), place]);
    });
    const members = [...railPlaces.keys()];
    const plan: ComponentPlan = {
      rails,
      members,
      memberSet: new Set(members),
      railPlaces,
      drafts: new Map(),
      kept: new Map(),
      mustMove: [],
      withoutRoute: [],
      keptConflicts: [],
      keptTracks: buildTrackIndex([]),
      keptRoutes: round.routes,
      keptBends: round.totalBends,
    };
    for (const edge of members) {
      const kept = railDraft(plan, edge, (place) => rails[place].coord);
      plan.kept.set(edge, kept);
      plan.keptBends += kept ? kept.bends - (round.bendsByEdge.get(edge) ?? 0) : 0;
      if (kept?.blocked) {
        plan.mustMove.push(edge);
      }
      if (!kept) {
        plan.withoutRoute.push(edge);
      }
    }
    plan.keptTracks = buildTrackIndex(
      members.flatMap((owner) =>
        (plan.kept.get(owner)?.segments ?? []).map((segment) => ({ segment, owner }))
      )
    );
    plan.keptConflicts = keptConflictsOf(round, plan);
    plan.keptRoutes = keptRoutesOf(round, plan);
    return plan;
  };

  /**
   * The members whose route the trial changes, with their new routes. None when some member
   * would get no route, which rules the trial out.
   */
  const changedRoutes = (
    plan: ComponentPlan,
    trial: RailTrial
  ): Map<MaterializedEdge, RailDraft> | undefined => {
    const changed = new Map<MaterializedEdge, RailDraft>();
    for (const place of trial.moved) {
      const edge = plan.rails[place].edge;
      const draft = changed.get(edge) ?? railDraft(plan, edge, trial.coordAt);
      if (!draft) {
        return undefined;
      }
      changed.set(edge, draft);
    }
    return plan.withoutRoute.some((edge) => !changed.has(edge)) ? undefined : changed;
  };

  /** A changed route that shares a track with a route that stays, or with a later change. */
  const changedRouteConflicts = (
    round: RoundRoutes,
    plan: ComponentPlan,
    changed: Map<MaterializedEdge, RailDraft>,
    [edge, draft]: [MaterializedEdge, RailDraft],
    later: [MaterializedEdge, RailDraft][]
  ): boolean =>
    draft.segments.some(
      (segment) =>
        round.tracks
          .alongside(segment, 1)
          .some(
            ({ owner, segment: other }) => !plan.memberSet.has(owner) && sharesTrack(segment, other)
          ) ||
        plan.keptTracks
          .alongside(segment, 1)
          .some(
            ({ owner, segment: other }) =>
              owner !== edge && !changed.has(owner) && sharesTrack(segment, other)
          ) ||
        later.some(([, laterDraft]) =>
          laterDraft.segments.some((other) => sharesTrack(segment, other))
        )
    );

  /** No route runs through a node or a label, and no two routes share a track. */
  const assignmentIsSafe = (
    round: RoundRoutes,
    plan: ComponentPlan,
    changed: Map<MaterializedEdge, RailDraft>
  ): boolean => {
    if (plan.mustMove.some((edge) => !changed.has(edge))) {
      return false;
    }
    if (plan.keptConflicts.some(([first, second]) => !changed.has(first) && !changed.has(second))) {
      return false;
    }
    const moved = [...changed];
    return moved.every(
      (entry, index) =>
        !entry[1].blocked &&
        !changedRouteConflicts(round, plan, changed, entry, moved.slice(index + 1))
    );
  };

  const scoreAssignment = (
    round: RoundRoutes,
    plan: ComponentPlan,
    trial: RailTrial
  ): ScoredAssignment | undefined => {
    const changed = changedRoutes(plan, trial);
    if (!changed || !assignmentIsSafe(round, plan, changed)) {
      return undefined;
    }
    let bends = plan.keptBends;
    for (const [edge, draft] of changed) {
      bends += draft.bends - (plan.kept.get(edge)?.bends ?? round.bendsByEdge.get(edge) ?? 0);
    }
    const crossings = plan.keptRoutes.totalWith(
      new Map([...changed].map(([edge, draft]) => [edge, draft.segments]))
    );
    return { changed, crossings, bends };
  };

  /** Every member takes its route under the assignment, changed or kept. */
  const applyAssignment = (
    plan: ComponentPlan,
    changed: Map<MaterializedEdge, RailDraft>
  ): void => {
    for (const edge of plan.members) {
      const draft = changed.get(edge) ?? plan.kept.get(edge);
      if (draft) {
        (edge as { points: PointLite[] }).points = draft.points;
      }
    }
  };

  const displacementOf = (component: ExternalRail[], assignment: number[]): number =>
    component.reduce((sum, rail, index) => sum + Math.abs(assignment[index] - rail.coord), 0);

  /** The exchange of the coordinates of rails `i < j`; no other rail moves. */
  const swapTrial = (component: ExternalRail[], i: number, j: number): RailTrial => {
    const [first, second] = [component[i].coord, component[j].coord];
    return {
      coordAt: (place) => (place === i ? second : place === j ? first : component[place].coord),
      moved: Object.is(first, second) ? [] : [i, j],
      // `displacementOf` for this assignment: every other rail adds a zero.
      displacement: () => Math.abs(second - first) + Math.abs(first - second),
    };
  };

  /**
   * The assignments to try for a component, in order: every arrangement of its coordinates when
   * it has at most `MAX_EXHAUSTIVE_COMPONENT` rails, otherwise every exchange of two rails.
   */
  const railTrials = function* (component: ExternalRail[]): Generator<RailTrial> {
    if (component.length <= MAX_EXHAUSTIVE_COMPONENT) {
      for (const assignment of permutedAssignmentsFor(component)) {
        yield {
          coordAt: (place) => assignment[place],
          moved: component.flatMap((rail, place) =>
            Object.is(assignment[place], rail.coord) ? [] : [place]
          ),
          displacement: () => displacementOf(component, assignment),
        };
      }
      return;
    }
    for (let i = 0; i < component.length; i++) {
      for (let j = i + 1; j < component.length; j++) {
        yield swapTrial(component, i, j);
      }
    }
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const round = roundRoutes(visibleEdges);
    const currentCrossings = round.routes.total;
    if (currentCrossings === 0) {
      return;
    }

    let best: { plan: ComponentPlan; changed: Map<MaterializedEdge, RailDraft> } | undefined;
    let bestCrossings = currentCrossings;
    let bestBends = round.totalBends;
    let bestDisplacement = Number.POSITIVE_INFINITY;

    for (const component of connectedComponents(collectExternalRails())) {
      const plan = planComponent(round, component);
      for (const trial of railTrials(component)) {
        const scored = scoreAssignment(round, plan, trial);
        if (!scored || scored.crossings >= currentCrossings) {
          continue;
        }
        const displacement = trial.displacement();
        if (
          scored.crossings > bestCrossings ||
          (scored.crossings === bestCrossings &&
            (scored.bends > bestBends ||
              (scored.bends === bestBends && displacement >= bestDisplacement)))
        ) {
          continue;
        }

        best = { plan, changed: scored.changed };
        bestCrossings = scored.crossings;
        bestBends = scored.bends;
        bestDisplacement = displacement;
      }
    }

    if (!best) {
      return;
    }
    applyAssignment(best.plan, best.changed);
  }
}

export function shortcutRedundantOrthogonalJogs(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const BUFFER = 2;
  const MAX_ITERATIONS = 8;

  const { realNodeRects, labelNodeRects: labelRects } = collectNodeRectEntries(
    nodeByIdMap.values()
  );
  const visibleEdges = edges.filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly);

  const pointsFor = (
    edge: MaterializedEdge,
    replacementEdge?: MaterializedEdge,
    replacement?: PointLite[]
  ): PointLite[] =>
    dedupeConsecutivePoints(
      edge === replacementEdge
        ? (replacement ?? [])
        : ((edge as { points?: PointLite[] }).points ?? [])
    );

  const pathLength = (points: PointLite[]): number =>
    segmentsFor(points).reduce((sum, segment) => {
      const dx = segment.a.x - segment.b.x;
      const dy = segment.a.y - segment.b.y;
      return sum + Math.hypot(dx, dy);
    }, 0);

  const currentRoutes = (): RouteCrossings<MaterializedEdge> =>
    buildRouteCrossings(
      new Map(visibleEdges.map((edge) => [edge, segmentsFor(pointsFor(edge))] as const)),
      EPS_LOCAL
    );

  /** The crossing count after `edge` alone takes `replacement`. */
  const strictCrossingCount = (
    routes: RouteCrossings<MaterializedEdge>,
    edge: MaterializedEdge,
    replacement: PointLite[]
  ): number =>
    routes.total -
    routes.of(edge) +
    routes.withOthers(edge, segmentsFor(dedupeConsecutivePoints(replacement)));

  const segmentRunsAlongRectBorder = (segment: SegmentLite, rect: RectLite): boolean => {
    if (segment.horizontal) {
      const y = segment.a.y;
      const onBorder = Math.abs(y - rect.top) < 1 || Math.abs(y - rect.bottom) < 1;
      return (
        onBorder && overlapLength(segment.a.x, segment.b.x, rect.left, rect.right) >= MIN_SHARED
      );
    }

    if (segment.vertical) {
      const x = segment.a.x;
      const onBorder = Math.abs(x - rect.left) < 1 || Math.abs(x - rect.right) < 1;
      return (
        onBorder && overlapLength(segment.a.y, segment.b.y, rect.top, rect.bottom) >= MIN_SHARED
      );
    }

    return false;
  };

  const endpointRectsFor = (edge: MaterializedEdge): RectLite[] => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    const rects: RectLite[] = [];
    for (const id of endpointIds) {
      const node = nodeByIdMap.get(id);
      const rect = node ? rectOfNodeBounds(node) : undefined;
      if (rect) {
        rects.push(rect);
      }
    }
    return rects;
  };

  const shortcutCandidatesAt = (points: PointLite[], index: number): PointLite[][] => {
    if (index + 3 >= points.length) {
      return [];
    }

    const p0 = points[index];
    const p1 = points[index + 1];
    const p2 = points[index + 2];
    const p3 = points[index + 3];
    const isHVH =
      isHorizontalSegment(p0, p1, EPS_LOCAL) &&
      isVerticalSegment(p1, p2, EPS_LOCAL) &&
      isHorizontalSegment(p2, p3, EPS_LOCAL);
    const isVHV =
      isVerticalSegment(p0, p1, EPS_LOCAL) &&
      isHorizontalSegment(p1, p2, EPS_LOCAL) &&
      isVerticalSegment(p2, p3, EPS_LOCAL);
    if (!isHVH && !isVHV) {
      return [];
    }
    const outerSegmentsOppose = isHVH
      ? Math.sign(p1.x - p0.x) !== Math.sign(p3.x - p2.x)
      : Math.sign(p1.y - p0.y) !== Math.sign(p3.y - p2.y);
    if (!outerSegmentsOppose) {
      return [];
    }

    const corners =
      sameX(p0, p3, EPS_LOCAL) || sameY(p0, p3, EPS_LOCAL)
        ? []
        : [
            { x: p0.x, y: p3.y },
            { x: p3.x, y: p0.y },
          ];
    const rawCandidates =
      corners.length === 0
        ? [[...points.slice(0, index + 1), ...points.slice(index + 3)]]
        : corners.map((corner) => [
            ...points.slice(0, index + 1),
            corner,
            ...points.slice(index + 3),
          ]);

    const seen = new Set<string>();
    return rawCandidates
      .map((candidate) => simplifyPolyline(dedupeConsecutivePoints(candidate)))
      .filter((candidate) => {
        if (segmentsFor(candidate).length !== candidate.length - 1) {
          return false;
        }
        if (!candidate.some((point) => samePoint(point, p3, EPS_LOCAL))) {
          return false;
        }
        const key = candidate
          .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)
          .join('|');
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  };

  const candidateIsSafe = (
    edge: MaterializedEdge,
    candidate: PointLite[],
    routes: RouteCrossings<MaterializedEdge>
  ): boolean => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    const endpointRects = endpointRectsFor(edge);

    for (const segment of segmentsFor(candidate)) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
        return false;
      }
      if (segmentHitsAnyRect(segment.a, segment.b, labelRects, [], -BUFFER)) {
        return false;
      }
      if (endpointRects.some((rect) => segmentRunsAlongRectBorder(segment, rect))) {
        return false;
      }
    }

    for (const other of visibleEdges) {
      if (other === edge) {
        continue;
      }
      for (const candidateSegment of segmentsFor(candidate)) {
        for (const otherSegment of segmentsFor(pointsFor(other))) {
          if (sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED) {
            return false;
          }
        }
      }
    }

    return strictCrossingCount(routes, edge, candidate) <= routes.total;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const routes = currentRoutes();
    const currentCrossings = routes.total;
    let bestEdge: { points?: PointLite[] } | undefined;
    let bestPath: PointLite[] | undefined;
    let bestCrossings = currentCrossings;
    let bestBends = Number.POSITIVE_INFINITY;
    let bestLength = Number.POSITIVE_INFINITY;

    for (const edge of visibleEdges) {
      const currentPoints = pointsFor(edge);
      const currentBends = countOrthogonalBends(currentPoints, EPS_LOCAL);
      const currentLength = pathLength(currentPoints);
      for (let index = 0; index <= currentPoints.length - 4; index++) {
        for (const candidate of shortcutCandidatesAt(currentPoints, index)) {
          const candidateBends = countOrthogonalBends(candidate, EPS_LOCAL);
          const candidateLength = pathLength(candidate);
          const improvesShape =
            candidateBends < currentBends ||
            (candidateBends === currentBends && candidateLength < currentLength - EPS_LOCAL);
          if (!improvesShape || !candidateIsSafe(edge, candidate, routes)) {
            continue;
          }

          const candidateCrossings = strictCrossingCount(routes, edge, candidate);
          if (
            candidateCrossings > bestCrossings ||
            (candidateCrossings === bestCrossings &&
              (candidateBends > bestBends ||
                (candidateBends === bestBends && candidateLength >= bestLength)))
          ) {
            continue;
          }

          bestEdge = edge;
          bestPath = candidate;
          bestCrossings = candidateCrossings;
          bestBends = candidateBends;
          bestLength = candidateLength;
        }
      }
    }

    if (!bestEdge || !bestPath) {
      return;
    }

    bestEdge.points = bestPath;
  }
}

export function resolveRenderedOrthogonalCrossings(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const ANCHOR = 20;
  const EXTRA_CHANNEL_COUNT = 2;
  const MAX_ITERATIONS = 4;
  const MAX_PAIR_CANDIDATES_PER_EDGE = 48;

  interface NodeInfo {
    id: string;
    cx: number;
    cy: number;
    rect: RectLite;
  }

  interface CrossingPair {
    first: MaterializedEdge;
    second: MaterializedEdge;
    count: number;
  }

  interface CrossingSnapshot {
    count: number;
    pairs: CrossingPair[];
    edgeSet: Set<MaterializedEdge>;
    edges: MaterializedEdge[];
  }

  /** One round's routes, which stay fixed while the round scores its candidates. */
  interface RoundCrossings {
    snapshot: CrossingSnapshot;
    segmentsByEdge: Map<MaterializedEdge, SegmentLite[]>;
    routes: RouteCrossings<MaterializedEdge>;
    conflictScans: Map<string, ConflictScan>;
  }

  /** The edges, in edge order among the first `scanned`, whose route conflicts with `path`. */
  interface ConflictScan {
    path: PointLite[];
    segments: SegmentLite[];
    found: MaterializedEdge[];
    scanned: number;
  }

  interface SingleReplacement {
    edge: MaterializedEdge;
    path: PointLite[];
  }

  interface PairCandidate {
    path: PointLite[];
    segments: SegmentLite[];
    /** Crossings with the round's routes of every edge except its own. */
    otherCrossings: number;
    /**
     * Other edges whose route conflicts with this one: all of them while there is at most one,
     * and two or more otherwise. A pair only asks whether it conflicts with its partner alone.
     */
    sharedTrackConflicts: Set<MaterializedEdge>;
    totalBends: number;
    length: number;
  }

  interface PairOption {
    edge: MaterializedEdge;
    candidates: PairCandidate[];
  }

  interface PairReplacementScore {
    replacements: EdgeReplacementMap;
    crossings: number;
    bends: number;
    length: number;
  }

  interface PairScoringContext {
    round: RoundCrossings;
    currentBends: number;
    currentLength: number;
    baseBendsByEdge: Map<MaterializedEdge, number>;
    baseLengthByEdge: Map<MaterializedEdge, number>;
  }

  const realNodes: NodeInfo[] = [];
  for (const node of nodeByIdMap.values()) {
    if (
      (node as { isGroup?: boolean }).isGroup ||
      (node as { isEdgeLabel?: boolean }).isEdgeLabel
    ) {
      continue;
    }
    const cx = (node as { x?: number }).x ?? 0;
    const cy = (node as { y?: number }).y ?? 0;
    const rect = rectOfNodeBounds(node);
    if (!rect) {
      continue;
    }
    realNodes.push({
      id: String((node as { id?: string }).id ?? ''),
      cx,
      cy,
      rect,
    });
  }

  if (realNodes.length === 0) {
    return;
  }

  const nodeInfoById = new Map(realNodes.map((node) => [node.id, node]));
  const realNodeRects = realNodes.map((node) => ({ id: node.id, rect: node.rect }));
  const sides: RectSide[] = ['top', 'bottom', 'left', 'right'];
  const outsideTracks = {
    top: Math.min(...realNodes.map((node) => node.rect.top)) - ANCHOR,
    bottom: Math.max(...realNodes.map((node) => node.rect.bottom)) + ANCHOR,
    left: Math.min(...realNodes.map((node) => node.rect.left)) - ANCHOR,
    right: Math.max(...realNodes.map((node) => node.rect.right)) + ANCHOR,
  };

  const visibleEdges = edges.filter((edge) => !(edge as { isLayoutOnly?: boolean }).isLayoutOnly);
  const edgeIndex = new Map(visibleEdges.map((edge, index) => [edge, index]));

  const outwardTracksForSide = (side: RectSide): number[] => {
    const outward = side === 'left' || side === 'top' ? -1 : 1;
    const tracks: number[] = [];
    for (let channel = 0; channel <= EXTRA_CHANNEL_COUNT; channel++) {
      tracks.push(outsideTracks[side] + outward * ANCHOR * channel);
    }
    return tracks;
  };

  const replacementPointsFor = (
    edge: MaterializedEdge,
    replacements: EdgeReplacementMap = new Map()
  ): PointLite[] =>
    dedupeConsecutivePoints(
      replacements.get(edge) ?? (edge as { points?: PointLite[] }).points ?? []
    );

  const crossingCountBetweenSegments = (
    firstSegments: SegmentLite[],
    secondSegments: SegmentLite[]
  ): number => {
    let count = 0;
    for (const firstSegment of firstSegments) {
      for (const secondSegment of secondSegments) {
        if (
          orthogonalSegmentsStrictlyCross(
            firstSegment.a,
            firstSegment.b,
            secondSegment.a,
            secondSegment.b,
            EPS_LOCAL
          )
        ) {
          count++;
        }
      }
    }
    return count;
  };

  const crossingCountBetweenPaths = (first: PointLite[], second: PointLite[]): number =>
    crossingCountBetweenSegments(segmentsFor(first), segmentsFor(second));

  const crossingSnapshot = (replacements: EdgeReplacementMap = new Map()): CrossingSnapshot => {
    let count = 0;
    const pairs: CrossingPair[] = [];
    const edgeSet = new Set<MaterializedEdge>();
    const edgeOrder: MaterializedEdge[] = [];
    const addEdge = (edge: MaterializedEdge): void => {
      if (!edgeSet.has(edge)) {
        edgeSet.add(edge);
        edgeOrder.push(edge);
      }
    };

    for (let i = 0; i < visibleEdges.length; i++) {
      const first = visibleEdges[i];
      const firstPoints = replacementPointsFor(first, replacements);
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const second = visibleEdges[j];
        const pairCount = crossingCountBetweenPaths(
          firstPoints,
          replacementPointsFor(second, replacements)
        );
        if (pairCount > 0) {
          count += pairCount;
          pairs.push({ first, second, count: pairCount });
          addEdge(first);
          addEdge(second);
        }
      }
    }

    edgeOrder.sort((a, b) => (edgeIndex.get(a) ?? 0) - (edgeIndex.get(b) ?? 0));
    return {
      count,
      pairs,
      edgeSet,
      edges: edgeOrder,
    };
  };

  const crossingComponents = (snapshot: CrossingSnapshot): MaterializedEdge[][] => {
    const neighbors = new Map<MaterializedEdge, Set<MaterializedEdge>>();
    for (const pair of snapshot.pairs) {
      const firstNeighbors = neighbors.get(pair.first) ?? new Set<MaterializedEdge>();
      firstNeighbors.add(pair.second);
      neighbors.set(pair.first, firstNeighbors);

      const secondNeighbors = neighbors.get(pair.second) ?? new Set<MaterializedEdge>();
      secondNeighbors.add(pair.first);
      neighbors.set(pair.second, secondNeighbors);
    }

    const components: MaterializedEdge[][] = [];
    const seen = new Set<MaterializedEdge>();
    for (const edge of snapshot.edges) {
      if (seen.has(edge)) {
        continue;
      }
      const queue = [edge];
      const component: MaterializedEdge[] = [];
      seen.add(edge);
      while (queue.length > 0) {
        const current = queue.pop()!;
        component.push(current);
        for (const next of neighbors.get(current) ?? []) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      component.sort((a, b) => (edgeIndex.get(a) ?? 0) - (edgeIndex.get(b) ?? 0));
      if (component.length > 1) {
        components.push(component);
      }
    }

    return components;
  };

  const endpointIdsFor = (edge: MaterializedEdge): string[] =>
    [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );

  const pairSearchGroups = (snapshot: CrossingSnapshot): MaterializedEdge[][] => {
    const groups: MaterializedEdge[][] = [];
    for (const component of crossingComponents(snapshot)) {
      const componentSet = new Set(component);
      const componentEndpointIds = new Set(component.flatMap((edge) => endpointIdsFor(edge)));
      const group = [...component];
      for (const edge of visibleEdges) {
        if (componentSet.has(edge)) {
          continue;
        }
        if (endpointIdsFor(edge).some((id) => componentEndpointIds.has(id))) {
          group.push(edge);
        }
      }
      group.sort((a, b) => (edgeIndex.get(a) ?? 0) - (edgeIndex.get(b) ?? 0));
      groups.push(group);
    }
    return groups;
  };

  const pathLength = (points: PointLite[]): number =>
    points.slice(1).reduce((sum, point, index) => {
      const previous = points[index];
      return sum + Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
    }, 0);

  const totalBends = (replacements: EdgeReplacementMap = new Map()): number =>
    visibleEdges.reduce(
      (sum, edge) => sum + countOrthogonalBends(replacementPointsFor(edge, replacements)),
      0
    );

  const totalLength = (replacements: EdgeReplacementMap = new Map()): number =>
    visibleEdges.reduce(
      (sum, edge) => sum + pathLength(replacementPointsFor(edge, replacements)),
      0
    );

  const touchesAtBend = (first: PointLite[], second: PointLite[]): boolean =>
    routesTouchAtBend(first, second, EDGE_ROUTING.ROUTE_TOUCH_TOLERANCE);

  const pathHitsNode = (edge: MaterializedEdge, path: PointLite[]): boolean => {
    const endpointIds = [(edge as { start?: string }).start, (edge as { end?: string }).end].filter(
      (id): id is string => Boolean(id)
    );
    for (const segment of segmentsFor(path)) {
      if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -2)) {
        return true;
      }
    }
    return false;
  };

  const pushOrthogonalCandidate = (candidates: PointLite[][], points: PointLite[]): void => {
    const candidate = simplifyPolyline(dedupeConsecutivePoints(points));
    if (segmentsFor(candidate).length === candidate.length - 1) {
      candidates.push(candidate);
    }
  };

  const sideIsHorizontal = (side: RectSide): boolean => side === 'left' || side === 'right';

  const localTrackForSameSide = (src: PointLite, side: RectSide, dst: PointLite): number => {
    switch (side) {
      case 'left':
        return Math.min(src.x, dst.x) - ANCHOR;
      case 'right':
        return Math.max(src.x, dst.x) + ANCHOR;
      case 'top':
        return Math.min(src.y, dst.y) - ANCHOR;
      case 'bottom':
        return Math.max(src.y, dst.y) + ANCHOR;
    }
  };

  const addSameSideCandidates = (
    candidates: PointLite[][],
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite
  ): void => {
    const outward = srcSide === 'left' || srcSide === 'top' ? -1 : 1;
    const trackSeeds = [localTrackForSameSide(src, srcSide, dst), outsideTracks[srcSide]];
    for (const seed of trackSeeds) {
      for (let channel = 0; channel <= EXTRA_CHANNEL_COUNT; channel++) {
        pushOrthogonalCandidate(
          candidates,
          buildSameSideTrackPath(src, srcSide, dst, seed + outward * ANCHOR * channel)
        );
      }
    }
  };

  const addHorizontalToVerticalCandidates = (
    candidates: PointLite[][],
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite,
    dstSide: RectSide
  ): void => {
    for (const xTrack of outwardTracksForSide(srcSide)) {
      for (const yTrack of outwardTracksForSide(dstSide)) {
        pushOrthogonalCandidate(candidates, [
          src,
          { x: xTrack, y: src.y },
          { x: xTrack, y: yTrack },
          { x: dst.x, y: yTrack },
          dst,
        ]);
      }
    }
  };

  const addVerticalToHorizontalCandidates = (
    candidates: PointLite[][],
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite,
    dstSide: RectSide
  ): void => {
    for (const yTrack of outwardTracksForSide(srcSide)) {
      for (const xTrack of outwardTracksForSide(dstSide)) {
        pushOrthogonalCandidate(candidates, [
          src,
          { x: src.x, y: yTrack },
          { x: xTrack, y: yTrack },
          { x: xTrack, y: dst.y },
          dst,
        ]);
      }
    }
  };

  const addHorizontalPairCandidates = (
    candidates: PointLite[][],
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite,
    dstSide: RectSide
  ): void => {
    const yTracks = [...outwardTracksForSide('top'), ...outwardTracksForSide('bottom')];
    for (const srcTrack of outwardTracksForSide(srcSide)) {
      for (const dstTrack of outwardTracksForSide(dstSide)) {
        for (const yTrack of yTracks) {
          pushOrthogonalCandidate(candidates, [
            src,
            { x: srcTrack, y: src.y },
            { x: srcTrack, y: yTrack },
            { x: dstTrack, y: yTrack },
            { x: dstTrack, y: dst.y },
            dst,
          ]);
        }
      }
    }
  };

  const addVerticalPairCandidates = (
    candidates: PointLite[][],
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite,
    dstSide: RectSide
  ): void => {
    const xTracks = [...outwardTracksForSide('left'), ...outwardTracksForSide('right')];
    for (const srcTrack of outwardTracksForSide(srcSide)) {
      for (const dstTrack of outwardTracksForSide(dstSide)) {
        for (const xTrack of xTracks) {
          pushOrthogonalCandidate(candidates, [
            src,
            { x: src.x, y: srcTrack },
            { x: xTrack, y: srcTrack },
            { x: xTrack, y: dstTrack },
            { x: dst.x, y: dstTrack },
            dst,
          ]);
        }
      }
    }
  };

  const dedupeCandidatePaths = (candidates: PointLite[][]): PointLite[][] => {
    const seen = new Set<string>();
    return candidates
      .map((candidate) => dedupeConsecutivePoints(candidate))
      .filter((candidate) => {
        const key = candidate
          .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)
          .join('|');
        if (seen.has(key) || candidate.length < 2) {
          return false;
        }
        seen.add(key);
        return true;
      });
  };

  const buildCandidatesForSides = (
    src: PointLite,
    srcSide: RectSide,
    dst: PointLite,
    dstSide: RectSide
  ): PointLite[][] => {
    const candidates: PointLite[][] = [];
    const base = buildOrthogonalPortPath(src, srcSide, dst, dstSide, ANCHOR, EPS_LOCAL);
    if (base) {
      pushOrthogonalCandidate(candidates, base);
    }
    if (srcSide === dstSide) {
      addSameSideCandidates(candidates, src, srcSide, dst);
    }

    const srcHorizontal = sideIsHorizontal(srcSide);
    const dstHorizontal = sideIsHorizontal(dstSide);
    if (srcHorizontal && !dstHorizontal) {
      addHorizontalToVerticalCandidates(candidates, src, srcSide, dst, dstSide);
    } else if (!srcHorizontal && dstHorizontal) {
      addVerticalToHorizontalCandidates(candidates, src, srcSide, dst, dstSide);
    } else if (srcHorizontal) {
      addHorizontalPairCandidates(candidates, src, srcSide, dst, dstSide);
    } else {
      addVerticalPairCandidates(candidates, src, srcSide, dst, dstSide);
    }

    return dedupeCandidatePaths(candidates);
  };

  const addVerticalDepartureOuterTrackCandidates = (
    candidates: PointLite[][],
    first: PointLite,
    departure: PointLite,
    dstNode: NodeInfo
  ): void => {
    const externalXTracks = [...outwardTracksForSide('left'), ...outwardTracksForSide('right')];
    const externalYTracks = [...outwardTracksForSide('top'), ...outwardTracksForSide('bottom')];
    for (const side of sides) {
      const dst = portForRectSide(dstNode, side);
      const targetYTracks =
        side === 'top' || side === 'bottom' ? outwardTracksForSide(side) : externalYTracks;
      for (const track of externalXTracks) {
        if (sideIsHorizontal(side)) {
          pushOrthogonalCandidate(candidates, [
            first,
            departure,
            { x: track, y: departure.y },
            { x: track, y: dst.y },
            dst,
          ]);
        }
        for (const targetTrack of targetYTracks) {
          pushOrthogonalCandidate(candidates, [
            first,
            departure,
            { x: track, y: departure.y },
            { x: track, y: targetTrack },
            { x: dst.x, y: targetTrack },
            dst,
          ]);
        }
      }
    }
  };

  const addHorizontalDepartureOuterTrackCandidates = (
    candidates: PointLite[][],
    first: PointLite,
    departure: PointLite,
    dstNode: NodeInfo
  ): void => {
    const externalXTracks = [...outwardTracksForSide('left'), ...outwardTracksForSide('right')];
    const externalYTracks = [...outwardTracksForSide('top'), ...outwardTracksForSide('bottom')];
    for (const side of sides) {
      const dst = portForRectSide(dstNode, side);
      const targetXTracks =
        side === 'left' || side === 'right' ? outwardTracksForSide(side) : externalXTracks;
      for (const track of externalYTracks) {
        if (!sideIsHorizontal(side)) {
          pushOrthogonalCandidate(candidates, [
            first,
            departure,
            { x: departure.x, y: track },
            { x: dst.x, y: track },
            dst,
          ]);
        }
        for (const targetTrack of targetXTracks) {
          pushOrthogonalCandidate(candidates, [
            first,
            departure,
            { x: departure.x, y: track },
            { x: targetTrack, y: track },
            { x: targetTrack, y: dst.y },
            dst,
          ]);
        }
      }
    }
  };

  const terminalPreservingOuterTrackCandidates = (edge: MaterializedEdge): PointLite[][] => {
    const srcId = (edge as { start?: string }).start;
    const dstId = (edge as { end?: string }).end;
    const dstNode = dstId ? nodeInfoById.get(dstId) : undefined;
    if (!srcId || !dstNode) {
      return [];
    }

    const points = dedupeConsecutivePoints((edge as { points?: PointLite[] }).points ?? []);
    if (points.length < 4) {
      return [];
    }

    const first = points[0];
    const departure = points[1];
    const candidates: PointLite[][] = [];
    if (isVerticalSegment(first, departure, EPS_LOCAL)) {
      addVerticalDepartureOuterTrackCandidates(candidates, first, departure, dstNode);
    } else if (isHorizontalSegment(first, departure, EPS_LOCAL)) {
      addHorizontalDepartureOuterTrackCandidates(candidates, first, departure, dstNode);
    }

    return candidates;
  };

  const candidatePathsFor = (edge: MaterializedEdge): PointLite[][] => {
    const srcId = (edge as { start?: string }).start;
    const dstId = (edge as { end?: string }).end;
    const srcNode = srcId ? nodeInfoById.get(srcId) : undefined;
    const dstNode = dstId ? nodeInfoById.get(dstId) : undefined;
    if (!srcNode || !dstNode) {
      return [];
    }

    const candidates: PointLite[][] = [];
    for (const srcSide of sides) {
      const srcPort = portForRectSide(srcNode, srcSide);
      for (const dstSide of sides) {
        candidates.push(
          ...buildCandidatesForSides(srcPort, srcSide, portForRectSide(dstNode, dstSide), dstSide)
        );
      }
    }
    candidates.push(...terminalPreservingOuterTrackCandidates(edge));
    return candidates;
  };

  const currentSegmentsByEdge = (): Map<MaterializedEdge, SegmentLite[]> =>
    new Map(visibleEdges.map((edge) => [edge, segmentsFor(replacementPointsFor(edge))] as const));

  const roundCrossings = (snapshot: CrossingSnapshot): RoundCrossings => {
    const segmentsByEdge = currentSegmentsByEdge();
    return {
      snapshot,
      segmentsByEdge,
      routes: buildRouteCrossings(segmentsByEdge, EPS_LOCAL),
      conflictScans: new Map(),
    };
  };

  /** The round's crossing count after `edge` alone takes `replacement`. */
  const crossingCountWithSingleReplacement = (
    round: RoundCrossings,
    edge: MaterializedEdge,
    replacement: PointLite[]
  ): number =>
    round.snapshot.count -
    round.routes.of(edge) +
    round.routes.withOthers(edge, segmentsFor(dedupeConsecutivePoints(replacement)));

  const sharesTrackOrTouches = (
    path: PointLite[],
    pathSegments: SegmentLite[],
    other: MaterializedEdge,
    otherSegments: SegmentLite[]
  ): boolean =>
    pathSegments.some((pathSegment) =>
      otherSegments.some(
        (otherSegment) => sameAxisSegmentOverlapLength(pathSegment, otherSegment, 0.5) >= MIN_SHARED
      )
    ) || touchesAtBend(path, replacementPointsFor(other));

  /**
   * The scan of one candidate route against the round's routes, kept for the rest of the
   * round under the route's exact coordinates: edges between the same two nodes try the same
   * candidate routes, and a later edge resumes the scan where an earlier one stopped.
   *
   * The key omits the edge on purpose, so one scan serves different edges: `found` only grows
   * and holds every conflict among the edges scanned so far, whichever edge asked; an edge's
   * early-stop test only gets truer as `found` grows, and a scan that stopped too early for a
   * later edge resumes; `sharedTrackConflictsFor` never stops early.
   */
  const conflictScanFor = (round: RoundCrossings, path: PointLite[]): ConflictScan => {
    const key = path.map((point) => `${point.x},${point.y}`).join(' ');
    let scan = round.conflictScans.get(key);
    if (!scan) {
      scan = { path, segments: segmentsFor(path), found: [], scanned: 0 };
      round.conflictScans.set(key, scan);
    }
    return scan;
  };

  /** Tests the next edges, in edge order, until `enough(found)` holds or none is left. */
  const scanConflicts = (
    round: RoundCrossings,
    scan: ConflictScan,
    enough: (found: MaterializedEdge[]) => boolean
  ): MaterializedEdge[] => {
    while (scan.scanned < visibleEdges.length && !enough(scan.found)) {
      const other = visibleEdges[scan.scanned++];
      const otherSegments = round.segmentsByEdge.get(other) ?? [];
      if (sharesTrackOrTouches(scan.path, scan.segments, other, otherSegments)) {
        scan.found.push(other);
      }
    }
    return scan.found;
  };

  /** True when `path` shares a track with, or touches at a bend, another edge's round route. */
  const pathHasSegmentConflict = (
    round: RoundCrossings,
    edge: MaterializedEdge,
    path: PointLite[]
  ): boolean => {
    const another = (found: MaterializedEdge[]): boolean => found.some((other) => other !== edge);
    return another(scanConflicts(round, conflictScanFor(round, path), another));
  };

  const sharedTrackConflictsFor = (
    round: RoundCrossings,
    edge: MaterializedEdge,
    candidatePath: PointLite[]
  ): Set<MaterializedEdge> => {
    const others = (found: MaterializedEdge[]): MaterializedEdge[] =>
      found.filter((other) => other !== edge);
    const enough = (found: MaterializedEdge[]): boolean => others(found).length >= 2;
    return new Set(others(scanConflicts(round, conflictScanFor(round, candidatePath), enough)));
  };

  const pairCandidatesFor = (edge: MaterializedEdge, round: RoundCrossings): PairCandidate[] => {
    const current = round.snapshot;
    const seen = new Set<string>();
    const candidates = candidatePathsFor(edge)
      .map((candidate) => simplifyPolyline(dedupeConsecutivePoints(candidate)))
      .filter((candidate) => {
        if (pathHitsNode(edge, candidate)) {
          return false;
        }
        const key = candidate
          .map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`)
          .join('|');
        if (seen.has(key) || candidate.length < 2) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((candidate) => {
        const candidateSegments = segmentsFor(candidate);
        const otherCrossings = round.routes.withOthers(edge, candidateSegments);
        return {
          candidate,
          candidateSegments,
          otherCrossings,
          crossings: current.count - round.routes.of(edge) + otherCrossings,
          bends: countOrthogonalBends(candidate, EPS_LOCAL),
          totalBends: countOrthogonalBends(candidate),
          length: pathLength(candidate),
        };
      })
      .filter(({ crossings }) => crossings <= current.count)
      .sort((a, b) => a.crossings - b.crossings || a.bends - b.bends || a.length - b.length);
    return candidates.slice(0, MAX_PAIR_CANDIDATES_PER_EDGE).map((candidate) => {
      return {
        path: candidate.candidate,
        segments: candidate.candidateSegments,
        otherCrossings: candidate.otherCrossings,
        sharedTrackConflicts: sharedTrackConflictsFor(round, edge, candidate.candidate),
        totalBends: candidate.totalBends,
        length: candidate.length,
      };
    });
  };

  /**
   * The round's crossing count after both edges take their candidates. Each candidate already
   * knows its crossings with every other edge's route, so only the crossings that involve the
   * pair itself are counted here.
   */
  const pairCrossingCount = (
    round: RoundCrossings,
    firstEdge: MaterializedEdge,
    firstCandidate: PairCandidate,
    secondEdge: MaterializedEdge,
    secondCandidate: PairCandidate
  ): number => {
    const firstRoute = round.segmentsByEdge.get(firstEdge) ?? [];
    const secondRoute = round.segmentsByEdge.get(secondEdge) ?? [];
    const currentAffected =
      round.routes.of(firstEdge) +
      round.routes.of(secondEdge) -
      crossingCountBetweenSegments(firstRoute, secondRoute);
    const replacementAffected =
      crossingCountBetweenSegments(firstCandidate.segments, secondCandidate.segments) +
      firstCandidate.otherCrossings -
      crossingCountBetweenSegments(firstCandidate.segments, secondRoute) +
      secondCandidate.otherCrossings -
      crossingCountBetweenSegments(secondCandidate.segments, firstRoute);
    return round.snapshot.count - currentAffected + replacementAffected;
  };

  const conflictsOnlyWith = (candidate: PairCandidate, edge: MaterializedEdge): boolean => {
    for (const conflict of candidate.sharedTrackConflicts) {
      if (conflict !== edge) {
        return false;
      }
    }
    return true;
  };

  const candidatesShareTrack = (
    firstCandidate: PairCandidate,
    secondCandidate: PairCandidate
  ): boolean =>
    firstCandidate.segments.some((firstSegment) =>
      secondCandidate.segments.some(
        (secondSegment) =>
          sameAxisSegmentOverlapLength(firstSegment, secondSegment, 0.5) >= MIN_SHARED
      )
    ) || touchesAtBend(firstCandidate.path, secondCandidate.path);

  const pairCandidatesAreCompatible = (
    first: PairOption,
    firstCandidate: PairCandidate,
    second: PairOption,
    secondCandidate: PairCandidate
  ): boolean =>
    conflictsOnlyWith(firstCandidate, second.edge) &&
    conflictsOnlyWith(secondCandidate, first.edge) &&
    !candidatesShareTrack(firstCandidate, secondCandidate);

  const scorePairReplacement = (
    context: PairScoringContext,
    first: PairOption,
    firstCandidate: PairCandidate,
    second: PairOption,
    secondCandidate: PairCandidate
  ): PairReplacementScore | undefined => {
    const crossings = pairCrossingCount(
      context.round,
      first.edge,
      firstCandidate,
      second.edge,
      secondCandidate
    );
    if (crossings >= context.round.snapshot.count) {
      return undefined;
    }

    return {
      replacements: new Map<MaterializedEdge, PointLite[]>([
        [first.edge, firstCandidate.path],
        [second.edge, secondCandidate.path],
      ]),
      crossings,
      bends:
        context.currentBends -
        (context.baseBendsByEdge.get(first.edge) ?? 0) -
        (context.baseBendsByEdge.get(second.edge) ?? 0) +
        firstCandidate.totalBends +
        secondCandidate.totalBends,
      length:
        context.currentLength -
        (context.baseLengthByEdge.get(first.edge) ?? 0) -
        (context.baseLengthByEdge.get(second.edge) ?? 0) +
        firstCandidate.length +
        secondCandidate.length,
    };
  };

  const pairScoreIsBetter = (
    candidate: PairReplacementScore,
    best: PairReplacementScore
  ): boolean =>
    candidate.crossings < best.crossings ||
    (candidate.crossings === best.crossings &&
      (candidate.bends < best.bends ||
        (candidate.bends === best.bends && candidate.length < best.length)));

  const bestScoreForOptionPair = (
    context: PairScoringContext,
    first: PairOption,
    second: PairOption,
    best: PairReplacementScore
  ): PairReplacementScore => {
    let pairBest = best;
    for (const firstCandidate of first.candidates) {
      for (const secondCandidate of second.candidates) {
        if (!pairCandidatesAreCompatible(first, firstCandidate, second, secondCandidate)) {
          continue;
        }
        const score = scorePairReplacement(context, first, firstCandidate, second, secondCandidate);
        if (score && pairScoreIsBetter(score, pairBest)) {
          pairBest = score;
        }
      }
    }
    return pairBest;
  };

  const bestPairedReplacement = (round: RoundCrossings): EdgeReplacementMap | undefined => {
    const current = round.snapshot;
    const currentBends = totalBends();
    const currentLength = totalLength();
    const baseBendsByEdge = new Map(
      visibleEdges.map((edge) => [edge, countOrthogonalBends(replacementPointsFor(edge))] as const)
    );
    const baseLengthByEdge = new Map(
      visibleEdges.map((edge) => [edge, pathLength(replacementPointsFor(edge))] as const)
    );
    const optionsByEdge = new Map<MaterializedEdge, PairOption>();
    const groups = pairSearchGroups(current);
    for (const group of groups) {
      for (const edge of group) {
        if (optionsByEdge.has(edge)) {
          continue;
        }
        const candidates = pairCandidatesFor(edge, round);
        if (candidates.length > 0) {
          optionsByEdge.set(edge, { edge, candidates });
        }
      }
    }

    let best: PairReplacementScore = {
      replacements: new Map(),
      crossings: current.count,
      bends: currentBends,
      length: currentLength,
    };
    const scoringContext: PairScoringContext = {
      round,
      currentBends,
      currentLength,
      baseBendsByEdge,
      baseLengthByEdge,
    };

    for (const group of groups) {
      const crossingEdgeSet = new Set(group.filter((edge) => current.edgeSet.has(edge)));
      const options = group
        .map((edge) => optionsByEdge.get(edge))
        .filter((option): option is PairOption => Boolean(option));
      for (let i = 0; i < options.length; i++) {
        const first = options[i];
        for (let j = i + 1; j < options.length; j++) {
          const second = options[j];
          if (!crossingEdgeSet.has(first.edge) && !crossingEdgeSet.has(second.edge)) {
            continue;
          }
          best = bestScoreForOptionPair(scoringContext, first, second, best);
        }
      }
    }

    return best.replacements.size > 0 ? best.replacements : undefined;
  };

  /** Fewer crossings, or as many crossings and fewer bends. */
  const fewerCrossingsOrBends = (
    crossings: number,
    bends: number,
    thanCrossings: number,
    thanBends: number
  ): boolean => crossings < thanCrossings || (crossings === thanCrossings && bends < thanBends);

  /**
   * The single reroute that gains the most, if any: the candidate with the fewest crossings,
   * then the fewest bends, among those that improve their own edge and neither run through a
   * node nor share a track with another route. The first such candidate wins a tie.
   */
  const bestSingleReplacement = (round: RoundCrossings): SingleReplacement | undefined => {
    let best: SingleReplacement | undefined;
    let bestCrossings = round.snapshot.count;
    let bestBends = Number.POSITIVE_INFINITY;
    for (const edge of round.snapshot.edges) {
      const currentEdgeBends = countOrthogonalBends(replacementPointsFor(edge), EPS_LOCAL);
      for (const path of candidatePathsFor(edge)) {
        const crossings = crossingCountWithSingleReplacement(round, edge, path);
        const bends = countOrthogonalBends(path, EPS_LOCAL);
        if (
          !fewerCrossingsOrBends(crossings, bends, round.snapshot.count, currentEdgeBends) ||
          !fewerCrossingsOrBends(crossings, bends, bestCrossings, bestBends)
        ) {
          continue;
        }
        // The route tests cost the most, so they run only for a candidate that would be the
        // new best. No test has side effects, so their order does not change the choice.
        if (pathHitsNode(edge, path) || pathHasSegmentConflict(round, edge, path)) {
          continue;
        }
        best = { edge, path };
        bestCrossings = crossings;
        bestBends = bends;
      }
    }
    return best;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const current = crossingSnapshot();
    if (current.count === 0) {
      return;
    }

    const round = roundCrossings(current);
    const single = bestSingleReplacement(round);
    if (single) {
      single.edge.points = single.path;
      continue;
    }

    const pairedReplacement = bestPairedReplacement(round);
    if (!pairedReplacement) {
      return;
    }
    for (const [edge, points] of pairedReplacement) {
      (edge as { points: PointLite[] }).points = points;
    }
  }
}
