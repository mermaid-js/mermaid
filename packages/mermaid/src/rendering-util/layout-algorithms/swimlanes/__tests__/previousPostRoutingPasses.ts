/**
 * The rail-channel, terminal tail swap and shared-track nudge passes as they were before they
 * read the round's routes from indexes. They walk every edge, or every pair of edges, for each
 * candidate. `postRoutingPasses.spec.ts` runs them on copies of the same input as the current
 * passes and checks that both make the same changes.
 */
import {
  collectNodeRectEntries,
  countOrthogonalBends,
  dedupeConsecutivePoints,
  isHorizontalSegment,
  isVerticalSegment,
  overlapLength,
  orthogonalSegmentsForPoints,
  orthogonalSegmentsStrictlyCross,
  rectOfNodeBounds,
  sameAxisSegmentOverlapLength,
  segmentHitsAnyRect,
  simplifyPolyline,
} from '../direction/geometry.js';
import type { OrthogonalSegment, Point, RectBounds, RectSide } from '../direction/geometry.js';
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

export function nudgeSharedInteriorSubpaths(edges: Edge[], nodeByIdMap: Map<string, Node>): void {
  const MIN_SHARED_TRACK = 8;
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
        overlapLength(a.a.x, a.b.x, b.a.x, b.b.x) >= MIN_SHARED_TRACK &&
        Math.abs(a.a.y - b.a.y) < MIN_TRACK_GAP
      );
    }
    if (a.vertical && b.vertical) {
      return (
        overlapLength(a.a.y, a.b.y, b.a.y, b.b.y) >= MIN_SHARED_TRACK &&
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
