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
  sameAxisSegmentOverlapLength,
  segmentHitsAnyRect,
  simplifyPolyline,
} from './geometry.js';
import type { OrthogonalSegment, Point, RectBounds, RectSide } from './geometry.js';
import type { Edge, Node } from '../../../types.js';

const EPS_LOCAL = 1e-3;
const MIN_SHARED = 8;

type PointLite = Point;
type RectLite = RectBounds;
type MaterializedEdge = Edge & { points?: PointLite[] };
type MaterializedNode = Node & { direction?: string };
type EdgeReplacementMap = Map<MaterializedEdge, PointLite[]>;

type SegmentLite = OrthogonalSegment;

const segmentsFor = orthogonalSegmentsForPoints;

const orthogonallyAligned = (a: PointLite, b: PointLite): boolean =>
  sameX(a, b, EPS_LOCAL) || sameY(a, b, EPS_LOCAL);

export function separateSharedRenderedTerminalLanes(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
): void {
  const MIN_FACE_CLEARANCE = 16;
  const TRACK_SHIFT = 7;

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
        return (
          sameY(shiftedBoundary, lane.boundary, EPS_LOCAL) &&
          shiftedBoundary.x >= lane.rect.left + 1 &&
          shiftedBoundary.x <= lane.rect.right - 1
        );
      }

      if (
        Math.abs(lane.boundary.x - lane.rect.left) < 1 ||
        Math.abs(lane.boundary.x - lane.rect.right) < 1
      ) {
        return (
          sameX(shiftedBoundary, lane.boundary, EPS_LOCAL) &&
          shiftedBoundary.y >= lane.rect.top + 1 &&
          shiftedBoundary.y <= lane.rect.bottom - 1
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
        for (const lane of candidates) {
          for (const shift of shifts) {
            const candidate = shiftedCandidate(lane, shift);
            if (!candidate) {
              continue;
            }
            const nextLane = terminalLaneFor({ ...lane.edge, points: candidate }, lane.atStart);
            if (
              !nextLane ||
              lanes.some(
                (other) =>
                  other.edge !== lane.edge &&
                  (exactTerminalLaneConflict(nextLane, other) ||
                    (fixingNearConflict && nearTerminalLaneConflict(nextLane, other)))
              )
            ) {
              continue;
            }

            (lane.edge as { points: PointLite[] }).points = candidate;
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

export function liftTopLaneTitleBandsAboveRails(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
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

  const topLaneTitleFor = (node: MaterializedNode): LaneTitle | undefined => {
    if (!(node as { isGroup?: boolean }).isGroup || (node as { parentId?: unknown }).parentId) {
      return undefined;
    }
    const rawDirection = (node as { direction?: unknown }).direction;
    const direction = typeof rawDirection === 'string' ? rawDirection.toUpperCase() : '';
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
    if (y <= rect.top + EPS_LOCAL || y >= rect.bottom - EPS_LOCAL) {
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

export function shiftLeftLaneTitleBandsLeftOfRails(
  edges: MaterializedEdge[],
  nodeByIdMap: Map<string, MaterializedNode>
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

  const leftLaneTitleFor = (node: MaterializedNode): LaneTitle | undefined => {
    if (!(node as { isGroup?: boolean }).isGroup || (node as { parentId?: unknown }).parentId) {
      return undefined;
    }
    const rawDirection = (node as { direction?: unknown }).direction;
    if (rawDirection !== 'LR') {
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
    if (x <= rect.left + EPS_LOCAL || x >= rect.right - EPS_LOCAL) {
      return false;
    }
    return overlapLength(segment.a.y, segment.b.y, rect.top, rect.bottom) >= MIN_SHARED;
  };

  const horizontalSegmentIntersectsTitle = (segment: SegmentLite, rect: RectLite): boolean => {
    if (!segment.horizontal) {
      return false;
    }
    const y = segment.a.y;
    if (y <= rect.top + EPS_LOCAL || y >= rect.bottom - EPS_LOCAL) {
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

  const crossingCount = (replacements: EdgeReplacementMap = new Map()): number => {
    let count = 0;
    for (let i = 0; i < visibleEdges.length; i++) {
      const firstSegments = segmentsFor(replacementPointsFor(visibleEdges[i], replacements));
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const secondSegments = segmentsFor(replacementPointsFor(visibleEdges[j], replacements));
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

  const totalBends = (replacements: EdgeReplacementMap = new Map()): number =>
    visibleEdges.reduce(
      (sum, edge) => sum + countOrthogonalBends(replacementPointsFor(edge, replacements)),
      0
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

  const pathHasSharedTrack = (
    edge: MaterializedEdge,
    path: PointLite[],
    replacements: EdgeReplacementMap
  ): boolean => {
    for (const other of visibleEdges) {
      if (other === edge) {
        continue;
      }
      for (const candidateSegment of segmentsFor(path)) {
        for (const otherSegment of segmentsFor(replacementPointsFor(other, replacements))) {
          if (sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const candidateIsSafe = (
    edge: MaterializedEdge,
    path: PointLite[],
    replacements: EdgeReplacementMap
  ): boolean => !pathHasNodeHit(edge, path) && !pathHasSharedTrack(edge, path, replacements);

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
    const currentCrossings = crossingCount();
    if (currentCrossings === 0) {
      return;
    }
    const currentBends = totalBends();

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
            !candidateIsSafe(first, firstCandidate, replacements) ||
            !candidateIsSafe(second, secondCandidate, replacements)
          ) {
            continue;
          }

          const candidateCrossings = crossingCount(replacements);
          const candidateBends = totalBends(replacements);
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

  const strictCrossingCount = (replacements: EdgeReplacementMap = new Map()): number => {
    let count = 0;
    for (let i = 0; i < visibleEdges.length; i++) {
      const firstSegments = segmentsFor(replacementPointsFor(visibleEdges[i], replacements));
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const secondSegments = segmentsFor(replacementPointsFor(visibleEdges[j], replacements));
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

  const totalBends = (replacements: EdgeReplacementMap = new Map()): number =>
    visibleEdges.reduce(
      (sum, edge) => sum + countOrthogonalBends(replacementPointsFor(edge, replacements)),
      0
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

  const coordinateAssignmentsFor = (component: ExternalRail[]): number[][] => {
    const current = component.map((rail) => rail.coord);
    const coords = uniqueCoordsFor(component);
    const assignments: number[][] = [];

    if (component.length <= MAX_EXHAUSTIVE_COMPONENT) {
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
    }

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const assignment = [...current];
        [assignment[i], assignment[j]] = [assignment[j], assignment[i]];
        assignments.push(assignment);
      }
    }
    return assignments;
  };

  const replacementsForAssignment = (
    component: ExternalRail[],
    assignment: number[]
  ): EdgeReplacementMap | undefined => {
    const draftByEdge = new Map<MaterializedEdge, PointLite[]>();
    for (const [i, rail] of component.entries()) {
      const coord = assignment[i];
      const points =
        draftByEdge.get(rail.edge) ?? rail.points.map((point) => ({ x: point.x, y: point.y }));
      if (rail.axis === 'vertical') {
        points[rail.segmentIndex].x = coord;
        points[rail.segmentIndex + 1].x = coord;
      } else {
        points[rail.segmentIndex].y = coord;
        points[rail.segmentIndex + 1].y = coord;
      }
      draftByEdge.set(rail.edge, points);
    }

    const replacements = new Map<MaterializedEdge, PointLite[]>();
    for (const [edge, points] of draftByEdge) {
      const simplified = simplifyPolyline(dedupeConsecutivePoints(points));
      if (segmentsFor(simplified).length !== simplified.length - 1) {
        return undefined;
      }
      replacements.set(edge, simplified);
    }
    return replacements;
  };

  const candidateIsSafe = (replacements: EdgeReplacementMap): boolean => {
    for (const [edge, points] of replacements) {
      const endpointIds = [
        (edge as { start?: string }).start,
        (edge as { end?: string }).end,
      ].filter((id): id is string => Boolean(id));
      for (const segment of segmentsFor(points)) {
        if (segmentHitsAnyRect(segment.a, segment.b, realNodeRects, endpointIds, -BUFFER)) {
          return false;
        }
        if (segmentHitsAnyRect(segment.a, segment.b, labelRects, [], -BUFFER)) {
          return false;
        }
      }
    }

    for (let i = 0; i < visibleEdges.length; i++) {
      const first = visibleEdges[i];
      const firstChanged = replacements.has(first);
      const firstSegments = segmentsFor(replacementPointsFor(first, replacements));
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const second = visibleEdges[j];
        if (!firstChanged && !replacements.has(second)) {
          continue;
        }
        const secondSegments = segmentsFor(replacementPointsFor(second, replacements));
        for (const firstSegment of firstSegments) {
          for (const secondSegment of secondSegments) {
            if (sameAxisSegmentOverlapLength(firstSegment, secondSegment, 0.5) >= MIN_SHARED) {
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const currentCrossings = strictCrossingCount();
    if (currentCrossings === 0) {
      return;
    }

    let bestReplacements: EdgeReplacementMap | undefined;
    let bestCrossings = currentCrossings;
    let bestBends = totalBends();
    let bestDisplacement = Number.POSITIVE_INFINITY;

    for (const component of connectedComponents(collectExternalRails())) {
      for (const assignment of coordinateAssignmentsFor(component)) {
        const replacements = replacementsForAssignment(component, assignment);
        if (!replacements || !candidateIsSafe(replacements)) {
          continue;
        }

        const candidateCrossings = strictCrossingCount(replacements);
        if (candidateCrossings >= currentCrossings) {
          continue;
        }
        const candidateBends = totalBends(replacements);
        const candidateDisplacement = component.reduce(
          (sum, rail, index) => sum + Math.abs(assignment[index] - rail.coord),
          0
        );

        if (
          candidateCrossings > bestCrossings ||
          (candidateCrossings === bestCrossings &&
            (candidateBends > bestBends ||
              (candidateBends === bestBends && candidateDisplacement >= bestDisplacement)))
        ) {
          continue;
        }

        bestReplacements = replacements;
        bestCrossings = candidateCrossings;
        bestBends = candidateBends;
        bestDisplacement = candidateDisplacement;
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
    currentCrossings: number
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

    return strictCrossingCount(edge, candidate) <= currentCrossings;
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const currentCrossings = strictCrossingCount();
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
          if (!improvesShape || !candidateIsSafe(edge, candidate, currentCrossings)) {
            continue;
          }

          const candidateCrossings = strictCrossingCount(edge, candidate);
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

  interface PairCandidate {
    path: PointLite[];
    segments: SegmentLite[];
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
    current: CrossingSnapshot;
    currentBends: number;
    currentLength: number;
    baseBendsByEdge: Map<MaterializedEdge, number>;
    baseLengthByEdge: Map<MaterializedEdge, number>;
    baseSegments: Map<MaterializedEdge, SegmentLite[]>;
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

  const crossingCountWithReplacements = (
    current: CrossingSnapshot,
    replacements: EdgeReplacementMap
  ): number => {
    const changed = new Set(replacements.keys());
    if (changed.size === 0) {
      return current.count;
    }

    let currentAffected = 0;
    for (const pair of current.pairs) {
      if (changed.has(pair.first) || changed.has(pair.second)) {
        currentAffected += pair.count;
      }
    }

    let replacementAffected = 0;
    for (let i = 0; i < visibleEdges.length; i++) {
      const first = visibleEdges[i];
      const firstChanged = changed.has(first);
      const firstPoints = replacementPointsFor(first, replacements);
      for (let j = i + 1; j < visibleEdges.length; j++) {
        const second = visibleEdges[j];
        if (!firstChanged && !changed.has(second)) {
          continue;
        }
        replacementAffected += crossingCountBetweenPaths(
          firstPoints,
          replacementPointsFor(second, replacements)
        );
      }
    }

    return current.count - currentAffected + replacementAffected;
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

  const crossingCountWithSingleReplacement = (
    current: CrossingSnapshot,
    edge: MaterializedEdge,
    replacement: PointLite[]
  ): number =>
    crossingCountWithReplacements(
      current,
      new Map<MaterializedEdge, PointLite[]>([[edge, replacement]])
    );

  const currentCrossingsByEdge = (current: CrossingSnapshot): Map<MaterializedEdge, number> => {
    const result = new Map<MaterializedEdge, number>();
    for (const pair of current.pairs) {
      result.set(pair.first, (result.get(pair.first) ?? 0) + pair.count);
      result.set(pair.second, (result.get(pair.second) ?? 0) + pair.count);
    }
    return result;
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

  const pathHasSegmentConflict = (
    edge: MaterializedEdge,
    path: PointLite[],
    replacements: EdgeReplacementMap = new Map()
  ): boolean => {
    const pathSegments = segmentsFor(path);
    for (const other of visibleEdges) {
      if (other === edge) {
        continue;
      }
      for (const candidateSegment of pathSegments) {
        for (const otherSegment of segmentsFor(replacementPointsFor(other, replacements))) {
          if (sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED) {
            return true;
          }
        }
      }
    }
    return false;
  };

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
        pushOrthogonalCandidate(candidates, [
          first,
          departure,
          { x: track, y: departure.y },
          { x: track, y: dst.y },
          dst,
        ]);
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
        pushOrthogonalCandidate(candidates, [
          first,
          departure,
          { x: departure.x, y: track },
          { x: dst.x, y: track },
          dst,
        ]);
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

  const sharedTrackConflictsFor = (
    edge: MaterializedEdge,
    candidateSegments: SegmentLite[],
    baseSegments: Map<MaterializedEdge, SegmentLite[]>
  ): Set<MaterializedEdge> => {
    const conflicts = new Set<MaterializedEdge>();
    for (const other of visibleEdges) {
      if (other === edge) {
        continue;
      }
      const otherSegments = baseSegments.get(other) ?? segmentsFor(replacementPointsFor(other));
      if (
        candidateSegments.some((candidateSegment) =>
          otherSegments.some(
            (otherSegment) =>
              sameAxisSegmentOverlapLength(candidateSegment, otherSegment, 0.5) >= MIN_SHARED
          )
        )
      ) {
        conflicts.add(other);
      }
    }
    return conflicts;
  };

  const pairCandidatesFor = (
    edge: MaterializedEdge,
    current: CrossingSnapshot,
    baseSegments: Map<MaterializedEdge, SegmentLite[]>,
    crossingCountByEdge: Map<MaterializedEdge, number>
  ): PairCandidate[] => {
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
        let replacementAffected = 0;
        for (const other of visibleEdges) {
          if (other === edge) {
            continue;
          }
          replacementAffected += crossingCountBetweenSegments(
            candidateSegments,
            baseSegments.get(other) ?? segmentsFor(replacementPointsFor(other))
          );
        }
        return {
          candidate,
          candidateSegments,
          crossings: current.count - (crossingCountByEdge.get(edge) ?? 0) + replacementAffected,
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
        sharedTrackConflicts: sharedTrackConflictsFor(
          edge,
          candidate.candidateSegments,
          baseSegments
        ),
        totalBends: candidate.totalBends,
        length: candidate.length,
      };
    });
  };

  const pairCrossingCount = (
    current: CrossingSnapshot,
    firstEdge: MaterializedEdge,
    firstCandidate: PairCandidate,
    secondEdge: MaterializedEdge,
    secondCandidate: PairCandidate,
    baseSegments: Map<MaterializedEdge, SegmentLite[]>
  ): number => {
    let currentAffected = 0;
    for (const pair of current.pairs) {
      if (
        pair.first === firstEdge ||
        pair.second === firstEdge ||
        pair.first === secondEdge ||
        pair.second === secondEdge
      ) {
        currentAffected += pair.count;
      }
    }

    let replacementAffected = crossingCountBetweenSegments(
      firstCandidate.segments,
      secondCandidate.segments
    );
    for (const other of visibleEdges) {
      if (other === firstEdge || other === secondEdge) {
        continue;
      }
      const otherSegments = baseSegments.get(other) ?? segmentsFor(replacementPointsFor(other));
      replacementAffected +=
        crossingCountBetweenSegments(firstCandidate.segments, otherSegments) +
        crossingCountBetweenSegments(secondCandidate.segments, otherSegments);
    }

    return current.count - currentAffected + replacementAffected;
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
    );

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
      context.current,
      first.edge,
      firstCandidate,
      second.edge,
      secondCandidate,
      context.baseSegments
    );
    if (crossings >= context.current.count) {
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

  const bestPairedReplacement = (current: CrossingSnapshot): EdgeReplacementMap | undefined => {
    const currentBends = totalBends();
    const currentLength = totalLength();
    const baseSegments = currentSegmentsByEdge();
    const crossingCountByEdge = currentCrossingsByEdge(current);
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
        const candidates = pairCandidatesFor(edge, current, baseSegments, crossingCountByEdge);
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
      current,
      currentBends,
      currentLength,
      baseBendsByEdge,
      baseLengthByEdge,
      baseSegments,
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

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const current = crossingSnapshot();
    const currentCrossings = current.count;
    if (currentCrossings === 0) {
      return;
    }

    let bestEdge: { points?: PointLite[] } | undefined;
    let bestPath: PointLite[] | undefined;
    let bestCrossings = currentCrossings;
    let bestBends = Number.POSITIVE_INFINITY;

    for (const edge of current.edges) {
      const currentEdgeBends = countOrthogonalBends(replacementPointsFor(edge), EPS_LOCAL);
      for (const candidate of candidatePathsFor(edge)) {
        const candidateHitsNode = pathHitsNode(edge, candidate);
        const candidateHasSegmentConflict =
          !candidateHitsNode && pathHasSegmentConflict(edge, candidate);
        const candidateCrossings = crossingCountWithSingleReplacement(current, edge, candidate);
        const candidateBends = countOrthogonalBends(candidate, EPS_LOCAL);
        if (candidateHitsNode || candidateHasSegmentConflict) {
          continue;
        }
        const improvesCurrentEdge =
          candidateCrossings < currentCrossings ||
          (candidateCrossings === currentCrossings && candidateBends < currentEdgeBends);
        if (!improvesCurrentEdge) {
          continue;
        }
        if (
          candidateCrossings > bestCrossings ||
          (candidateCrossings === bestCrossings && candidateBends >= bestBends)
        ) {
          continue;
        }
        bestEdge = edge;
        bestPath = candidate;
        bestCrossings = candidateCrossings;
        bestBends = candidateBends;
      }
    }

    if (bestEdge && bestPath) {
      bestEdge.points = bestPath;
      continue;
    }

    const pairedReplacement = bestPairedReplacement(current);
    if (!pairedReplacement) {
      return;
    }
    for (const [edge, points] of pairedReplacement) {
      (edge as { points: PointLite[] }).points = points;
    }
  }
}
