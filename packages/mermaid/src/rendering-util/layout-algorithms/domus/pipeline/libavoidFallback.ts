import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type { OrthogonalOptions, Point } from '../types.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { scoreLayout } from '../../layout-utils/scoreLayout.js';
import { normalizePolyline, segmentsCross } from '../../layout-utils/geometry.js';
import { applyPortDirectionStubs } from './portStubs.js';
import { partitionDomusValidationIssues } from './validationIssuePartition.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';
import { clusterTitleObstacleRect } from './clusterTitleObstacles.js';

function polylineBendCount(points: Point[] | undefined): number {
  if (!Array.isArray(points) || points.length < 3) {
    return 0;
  }
  let bends = 0;
  for (let i = 2; i < points.length; i++) {
    const a = points[i - 2];
    const b = points[i - 1];
    const c = points[i];
    const dxAB = b.x - a.x;
    const dyAB = b.y - a.y;
    const dxBC = c.x - b.x;
    const dyBC = c.y - b.y;
    const isHorizAB = Math.abs(dxAB) > 0.5 && Math.abs(dyAB) <= 0.5;
    const isVertAB = Math.abs(dxAB) <= 0.5 && Math.abs(dyAB) > 0.5;
    const isHorizBC = Math.abs(dxBC) > 0.5 && Math.abs(dyBC) <= 0.5;
    const isVertBC = Math.abs(dxBC) <= 0.5 && Math.abs(dyBC) > 0.5;
    if ((isHorizAB && isVertBC) || (isVertAB && isHorizBC)) {
      bends++;
    }
  }
  return bends;
}

function clonePoints(points: Point[] | undefined): Point[] | undefined {
  return points?.map((p) => ({ x: p.x, y: p.y }));
}

/**
 * Per-edge veto for libavoid acceptance. Returns true when the candidate
 * polyline is invalid in any of these ways:
 *
 *   1. A segment crosses a non-endpoint, non-group node's interior — the
 *      route passes UNDER another node.
 *   2. The first point sits strictly inside the start node's interior —
 *      the route LEAVES from the node's centroid instead of its boundary.
 *   3. The last point sits strictly inside the end node's interior — the
 *      route ARRIVES at the node's centroid instead of its boundary, so
 *      the rendered polyline visually passes "under" the endpoint node.
 *   4. A segment crosses a non-endpoint group title band — the route passes
 *      through rendered subgraph label text.
 *
 * The acceptance gate must reject these edge-by-edge regardless of how
 * many global crossings they save. Without this veto, libavoid will
 * happily trade real invalidity for crossings count — see Company.mmd's
 * Customer→USCompany polyline (terminus at USCompany center → polyline
 * passes through USCompany's interior on the way there).
 */
function polylineCrossesNonEndpointNodeInterior(
  points: Point[] | undefined,
  startId: string,
  endId: string,
  nodesById: Map<string, Node>,
  spacing: number
): boolean {
  if (!Array.isArray(points) || points.length < 2) {
    return false;
  }
  // (2) and (3): endpoint must be on the node boundary, not interior.
  const startNode = nodesById.get(startId);
  const endNode = nodesById.get(endId);
  const tol = 0.5;
  const isStrictInterior = (p: Point, rect: ReturnType<typeof rectForNode>) =>
    p.x > rect.left + tol &&
    p.x < rect.right - tol &&
    p.y > rect.top + tol &&
    p.y < rect.bottom - tol;
  if (
    startNode &&
    !(startNode as { isGroup?: boolean }).isGroup &&
    isStrictInterior(points[0], rectForNode(startNode))
  ) {
    return true;
  }
  if (
    endNode &&
    !(endNode as { isGroup?: boolean }).isGroup &&
    isStrictInterior(points[points.length - 1], rectForNode(endNode))
  ) {
    return true;
  }
  // (1): no segment may cross a non-endpoint node's interior.
  for (const [id, node] of nodesById) {
    if (id === startId || id === endId) {
      continue;
    }
    if ((node as { isGroup?: boolean }).isGroup) {
      const titleRect = clusterTitleObstacleRect(node, spacing);
      if (!titleRect) {
        continue;
      }
      for (let i = 0; i < points.length - 1; i++) {
        if (segmentIntersectsRectInterior(points[i], points[i + 1], titleRect)) {
          return true;
        }
      }
      continue;
    }
    const rect = rectForNode(node);
    for (let i = 0; i < points.length - 1; i++) {
      if (segmentIntersectsRectInterior(points[i], points[i + 1], rect)) {
        return true;
      }
    }
  }
  return false;
}

function semanticEdges(data: LayoutData) {
  return (data.edges ?? []).filter((e) => e?.id != null && !e?.isLabelEdge);
}

function isSelfLoopEdge(edge: ReturnType<typeof semanticEdges>[number]): boolean {
  return edge?.start != null && edge?.end != null && String(edge.start) === String(edge.end);
}

function excludeSelfLoopEdgeIds(data: LayoutData, edgeIds: string[]): string[] {
  const selfLoopEdgeIds = new Set(
    semanticEdges(data)
      .filter(isSelfLoopEdge)
      .map((edge) => String(edge.id))
  );
  return edgeIds.filter((edgeId) => !selfLoopEdgeIds.has(edgeId));
}

function semanticEdgeIds(data: LayoutData): string[] {
  return semanticEdges(data).map((e) => String(e.id));
}

function semanticEdgeIdsWithMoreThanThreePoints(data: LayoutData): string[] {
  return semanticEdges(data)
    .filter((e) => Array.isArray(e.points) && e.points.length > 3)
    .map((e) => String(e.id));
}

function semanticEdgeIdsWithMoreThanTwoPoints(data: LayoutData): string[] {
  return semanticEdges(data)
    .filter((e) => Array.isArray(e.points) && e.points.length > 2)
    .map((e) => String(e.id));
}

function hasDiagonalEndpoint(points: Point[] | undefined): boolean {
  if (!Array.isArray(points) || points.length < 2) {
    return false;
  }
  const axisEps = 0.5;
  const first = points[0];
  const second = points[1];
  const last = points[points.length - 1];
  const penultimate = points[points.length - 2];
  const firstDiagonal =
    Math.abs((second?.x ?? 0) - (first?.x ?? 0)) > axisEps &&
    Math.abs((second?.y ?? 0) - (first?.y ?? 0)) > axisEps;
  const lastDiagonal =
    Math.abs((last?.x ?? 0) - (penultimate?.x ?? 0)) > axisEps &&
    Math.abs((last?.y ?? 0) - (penultimate?.y ?? 0)) > axisEps;
  return firstDiagonal || lastDiagonal;
}

function renderedDiagonalCandidateEdgeIds(data: LayoutData): string[] {
  return semanticEdges(data)
    .filter((e) => hasDiagonalEndpoint((e.points ?? []) as Point[]))
    .map((e) => String(e.id));
}

function crossingGraph(data: LayoutData): {
  crossingEdgeIds: string[];
  crossingComponents: string[][];
} {
  const edges = semanticEdges(data)
    .map((edge) => ({
      id: String(edge.id),
      segments: normalizePolyline((edge.points ?? []) as Point[]).segments,
    }))
    .filter((edge) => edge.segments.length > 0);
  const counts = new Map<string, number>();
  const neighbors = new Map<string, Set<string>>();
  for (const edge of edges) {
    counts.set(edge.id, 0);
    neighbors.set(edge.id, new Set());
  }
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      let crossed = false;
      for (const s1 of edges[i].segments) {
        for (const s2 of edges[j].segments) {
          if (segmentsCross(s1, s2)) {
            crossed = true;
            break;
          }
        }
        if (crossed) {
          break;
        }
      }
      if (crossed) {
        counts.set(edges[i].id, (counts.get(edges[i].id) ?? 0) + 1);
        counts.set(edges[j].id, (counts.get(edges[j].id) ?? 0) + 1);
        neighbors.get(edges[i].id)?.add(edges[j].id);
        neighbors.get(edges[j].id)?.add(edges[i].id);
      }
    }
  }
  const crossingEdgeIds = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
  const crossingSet = new Set(crossingEdgeIds);
  const seen = new Set<string>();
  const crossingComponents: string[][] = [];
  for (const edgeId of crossingEdgeIds) {
    if (seen.has(edgeId)) {
      continue;
    }
    const stack = [edgeId];
    const component: string[] = [];
    seen.add(edgeId);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);
      for (const next of neighbors.get(current) ?? []) {
        if (!crossingSet.has(next) || seen.has(next)) {
          continue;
        }
        seen.add(next);
        stack.push(next);
      }
    }
    crossingComponents.push(component.sort((a, b) => a.localeCompare(b)));
  }
  crossingComponents.sort((a, b) => b.length - a.length || a.join('|').localeCompare(b.join('|')));
  return { crossingEdgeIds, crossingComponents };
}

function buildLibavoidCandidateEdgeSets(
  data: LayoutData,
  aggressive = false,
  allEdges = false
): {
  preferredEdgeIds: string[];
  candidateEdgeSets: string[][];
} {
  const allSemanticEdgeIds = excludeSelfLoopEdgeIds(data, semanticEdgeIds(data));
  const longEdgeIds = excludeSelfLoopEdgeIds(data, semanticEdgeIdsWithMoreThanThreePoints(data));
  const bentEdgeIds = excludeSelfLoopEdgeIds(data, semanticEdgeIdsWithMoreThanTwoPoints(data));
  const { crossingEdgeIds, crossingComponents } = crossingGraph(data);
  const diagonalEdgeIds = excludeSelfLoopEdgeIds(data, renderedDiagonalCandidateEdgeIds(data));
  const preferredEdgeIds = allEdges
    ? allSemanticEdgeIds
    : [
        ...new Set([
          ...longEdgeIds,
          ...bentEdgeIds,
          ...excludeSelfLoopEdgeIds(data, crossingEdgeIds),
          ...diagonalEdgeIds,
        ]),
      ];
  const candidates: string[][] = [];
  const seen = new Set<string>();
  const push = (edgeIds: string[]) => {
    const ids = [...new Set(edgeIds.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    if (ids.length === 0) {
      return;
    }
    const key = ids.join('||');
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push(ids);
  };

  const edges = semanticEdges(data);
  if (allEdges) {
    push(allSemanticEdgeIds);
    return { preferredEdgeIds, candidateEdgeSets: candidates };
  }
  for (const edge of edges) {
    if (preferredEdgeIds.includes(String(edge.id))) {
      push([String(edge.id)]);
    }
  }

  const byPair = new Map<string, { ab: string[]; ba: string[] }>();
  for (const edge of edges) {
    const start = String(edge.start ?? '');
    const end = String(edge.end ?? '');
    if (!start || !end || start === end) {
      continue;
    }
    const [a, b] = start.localeCompare(end) <= 0 ? [start, end] : [end, start];
    const key = `${a}||${b}`;
    const rec = byPair.get(key) ?? { ab: [], ba: [] };
    if (start === a) {
      rec.ab.push(String(edge.id));
    } else {
      rec.ba.push(String(edge.id));
    }
    byPair.set(key, rec);
  }
  for (const rec of byPair.values()) {
    const pairIds = [...rec.ab, ...rec.ba].filter((id) => preferredEdgeIds.includes(id));
    if (pairIds.length > 0) {
      push(pairIds);
    }
  }

  for (const component of crossingComponents) {
    const ids = component.filter((id) => preferredEdgeIds.includes(id));
    push(ids);
    const expanded = new Set(ids);
    for (const id of ids) {
      if (expanded.size >= 6) {
        break;
      }
      const edge = edges.find((candidate) => String(candidate.id) === id);
      if (!edge) {
        continue;
      }
      const sameEndpoint = edges
        .filter(
          (candidate) =>
            preferredEdgeIds.includes(String(candidate.id)) &&
            (String(candidate.start ?? '') === String(edge.start ?? '') ||
              String(candidate.end ?? '') === String(edge.end ?? '') ||
              String(candidate.start ?? '') === String(edge.end ?? '') ||
              String(candidate.end ?? '') === String(edge.start ?? ''))
        )
        .map((candidate) => String(candidate.id));
      for (const related of sameEndpoint) {
        expanded.add(related);
      }
    }
    push([...expanded]);
  }

  if (aggressive) {
    const topCrossing = crossingEdgeIds.filter((id) => preferredEdgeIds.includes(id)).slice(0, 5);
    for (let size = 2; size <= Math.min(4, topCrossing.length); size++) {
      const choose = (start: number, picked: string[]) => {
        if (picked.length === size) {
          push(picked);
          return;
        }
        for (let i = start; i < topCrossing.length; i++) {
          choose(i + 1, [...picked, topCrossing[i]]);
        }
      };
      choose(0, []);
    }
    push(topCrossing);
    push(preferredEdgeIds);
  } else {
    push(preferredEdgeIds);
  }
  return { preferredEdgeIds, candidateEdgeSets: candidates };
}

function libavoidTriggerState(options: OrthogonalOptions, data: LayoutData) {
  const scores = scoreLayout(data).scores;
  const edgeBends = semanticEdges(data).map((edge) => ({
    id: String(edge.id),
    bends: polylineBendCount((edge.points ?? []) as Point[]),
  }));
  const maxEdgeBends = edgeBends.reduce((best, edge) => Math.max(best, edge.bends), 0);
  const bendHeavyEdgeIds = edgeBends
    .filter(
      (edge) =>
        options.libavoidMaxEdgeBendsThreshold != null &&
        edge.bends > options.libavoidMaxEdgeBendsThreshold
    )
    .map((edge) => edge.id);
  const crossingTriggered =
    options.libavoidCrossingThreshold != null &&
    scores.crossings > options.libavoidCrossingThreshold;
  const renderedDiagonalTriggered =
    options.libavoidRenderedDiagonalThreshold != null &&
    scores.renderedDiagonalEndpoints > options.libavoidRenderedDiagonalThreshold;
  const bendTriggered = bendHeavyEdgeIds.length > 0;
  return {
    scores,
    maxEdgeBends,
    bendHeavyEdgeIds,
    crossingTriggered,
    renderedDiagonalTriggered,
    bendTriggered,
    triggered: crossingTriggered || renderedDiagonalTriggered || bendTriggered,
  };
}

interface LibavoidQualitySnapshot {
  realIssues: number;
  crossings: number;
  renderedDiagonalEndpoints: number;
  avgBendsPerEdge: number;
}

function snapshotQuality(data: LayoutData): {
  validation: ReturnType<typeof validateLayout>;
  score: ReturnType<typeof scoreLayout>;
  quality: LibavoidQualitySnapshot;
} {
  const validation = validateLayout(data);
  const partitioned = partitionDomusValidationIssues(validation.issues, data);
  const score = scoreLayout(data);
  return {
    validation,
    score,
    quality: {
      realIssues: partitioned.real.length,
      crossings: score.scores.crossings,
      renderedDiagonalEndpoints: score.scores.renderedDiagonalEndpoints,
      avgBendsPerEdge: score.scores.avgBendsPerEdge,
    },
  };
}

function compareQuality(
  a: LibavoidQualitySnapshot,
  b: LibavoidQualitySnapshot,
  aggressive = false
): number {
  if (aggressive) {
    if (a.crossings !== b.crossings) {
      return a.crossings < b.crossings ? 1 : -1;
    }
    if (a.renderedDiagonalEndpoints !== b.renderedDiagonalEndpoints) {
      return a.renderedDiagonalEndpoints < b.renderedDiagonalEndpoints ? 1 : -1;
    }
    if (a.realIssues !== b.realIssues) {
      return a.realIssues < b.realIssues ? 1 : -1;
    }
    if (a.avgBendsPerEdge !== b.avgBendsPerEdge) {
      return a.avgBendsPerEdge < b.avgBendsPerEdge ? 1 : -1;
    }
    return 0;
  }
  if (a.realIssues !== b.realIssues) {
    return a.realIssues < b.realIssues ? 1 : -1;
  }
  if (a.crossings !== b.crossings) {
    return a.crossings < b.crossings ? 1 : -1;
  }
  if (a.renderedDiagonalEndpoints !== b.renderedDiagonalEndpoints) {
    return a.renderedDiagonalEndpoints < b.renderedDiagonalEndpoints ? 1 : -1;
  }
  if (a.avgBendsPerEdge !== b.avgBendsPerEdge) {
    return a.avgBendsPerEdge < b.avgBendsPerEdge ? 1 : -1;
  }
  return 0;
}

export function applyLibavoidFallbackIfNeeded(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  nodesById: Map<string, Node>;
  trace?: { edges: Record<string, any> } | undefined;
}): void {
  const { data, options, nodesById, trace } = args;
  const reportTarget = data as LayoutData & { __libavoidReport?: Record<string, unknown> };
  reportTarget.__libavoidReport ??= { adapterCalls: [] };
  const aggressive = options.libavoidAggressive === true;
  if (!options.libavoidFallback || !options.libavoidAdapter) {
    log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_INACTIVE', {
      enabled: Boolean(options.libavoidFallback),
      hasAdapter: Boolean(options.libavoidAdapter),
    });
    return;
  }
  const triggerState = libavoidTriggerState(options, data);
  if (!triggerState.triggered) {
    reportTarget.__libavoidReport = {
      ...(reportTarget.__libavoidReport ?? {}),
      trigger: {
        status: 'not-triggered',
        crossings: triggerState.scores.crossings,
        renderedDiagonalEndpoints: triggerState.scores.renderedDiagonalEndpoints,
        maxEdgeBends: triggerState.maxEdgeBends,
        bendHeavyEdgeIds: triggerState.bendHeavyEdgeIds,
        crossingThreshold: options.libavoidCrossingThreshold,
        renderedDiagonalThreshold: options.libavoidRenderedDiagonalThreshold,
        maxEdgeBendsThreshold: options.libavoidMaxEdgeBendsThreshold,
      },
    };
    log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_NOT_TRIGGERED', {
      crossings: triggerState.scores.crossings,
      renderedDiagonalEndpoints: triggerState.scores.renderedDiagonalEndpoints,
      maxEdgeBends: triggerState.maxEdgeBends,
      bendHeavyEdgeIds: triggerState.bendHeavyEdgeIds,
      crossingThreshold: options.libavoidCrossingThreshold,
      renderedDiagonalThreshold: options.libavoidRenderedDiagonalThreshold,
      maxEdgeBendsThreshold: options.libavoidMaxEdgeBendsThreshold,
    });
    return;
  }

  const { preferredEdgeIds, candidateEdgeSets } = buildLibavoidCandidateEdgeSets(
    data,
    aggressive,
    options.libavoidAllEdges === true
  );
  if (candidateEdgeSets.length === 0) {
    return;
  }

  const before = snapshotQuality(data);
  reportTarget.__libavoidReport = {
    ...(reportTarget.__libavoidReport ?? {}),
    trigger: {
      candidateCount: candidateEdgeSets.length,
      preferredEdgeIds,
      candidateEdgeSets,
      aggressive,
      triggerReasons: {
        crossings: triggerState.crossingTriggered,
        renderedDiagonalEndpoints: triggerState.renderedDiagonalTriggered,
        maxEdgeBends: triggerState.bendTriggered,
        allEdges: options.libavoidAllEdges === true,
      },
      maxEdgeBends: triggerState.maxEdgeBends,
      bendHeavyEdgeIds: triggerState.bendHeavyEdgeIds,
      beforeValidationOk: before.validation.ok,
      beforeRealIssues: before.quality.realIssues,
      beforeCrossings: before.score.scores.crossings,
      beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
    },
  };
  log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_TRIGGERED', {
    candidateCount: candidateEdgeSets.length,
    preferredEdgeIds,
    candidateEdgeSets,
    aggressive,
    triggerReasons: {
      crossings: triggerState.crossingTriggered,
      renderedDiagonalEndpoints: triggerState.renderedDiagonalTriggered,
      maxEdgeBends: triggerState.bendTriggered,
      allEdges: options.libavoidAllEdges === true,
    },
    maxEdgeBends: triggerState.maxEdgeBends,
    bendHeavyEdgeIds: triggerState.bendHeavyEdgeIds,
    beforeValidationOk: before.validation.ok,
    beforeRealIssues: before.quality.realIssues,
    beforeCrossings: before.score.scores.crossings,
    beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
  });
  const originalPoints = new Map<string, Point[] | undefined>();
  for (const edge of data.edges ?? []) {
    if (edge?.id != null) {
      originalPoints.set(String(edge.id), clonePoints(edge.points as Point[] | undefined));
    }
  }

  let best:
    | {
        edgeIds: string[];
        acceptedPoints: Map<string, Point[] | undefined>;
        validation: ReturnType<typeof validateLayout>;
        score: ReturnType<typeof scoreLayout>;
        quality: LibavoidQualitySnapshot;
      }
    | undefined;
  let bestRejected:
    | {
        edgeIds: string[];
        quality: LibavoidQualitySnapshot;
        validationOk: boolean;
        reason: 'issue-budget-exceeded' | 'not-better-than-before';
      }
    | undefined;
  const topRejectedCandidates: {
    edgeIds: string[];
    quality: LibavoidQualitySnapshot;
    validationOk: boolean;
    reason: 'issue-budget-exceeded' | 'not-better-than-before';
  }[] = [];
  const topRejectedLargeBundles: {
    edgeIds: string[];
    quality: LibavoidQualitySnapshot;
    validationOk: boolean;
    reason: 'issue-budget-exceeded' | 'not-better-than-before';
  }[] = [];
  const topIssueBudgetExceededCandidates: {
    edgeIds: string[];
    quality: LibavoidQualitySnapshot;
    validationOk: boolean;
    reason: 'issue-budget-exceeded';
  }[] = [];

  const restoreOriginalPoints = () => {
    for (const edge of data.edges ?? []) {
      const edgeId = edge?.id != null ? String(edge.id) : '';
      if (!edgeId || !originalPoints.has(edgeId)) {
        continue;
      }
      edge.points = clonePoints(originalPoints.get(edgeId));
    }
  };

  for (const targetEdgeIds of candidateEdgeSets) {
    restoreOriginalPoints();

    const routed = options.libavoidAdapter({
      data,
      nodesById,
      edgeIds: targetEdgeIds,
      spacing: options.spacing ?? 10,
    });
    const routedMap = routed instanceof Map ? routed : new Map(Object.entries(routed));
    if (routedMap.size === 0) {
      continue;
    }

    for (const edge of data.edges ?? []) {
      const edgeId = edge?.id != null ? String(edge.id) : '';
      if (!edgeId || !routedMap.has(edgeId)) {
        continue;
      }
      const points = routedMap.get(edgeId);
      if (Array.isArray(points) && points.length >= 2) {
        edge.points = points.map((p) => ({ x: p.x, y: p.y }));
      }
    }

    const afterRouteValidation = validateLayout(data);
    const mismatchEdgeIds = new Set<string>(
      afterRouteValidation.issues
        .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
        .map((iss) => String(iss.edgeId))
        .filter((edgeId) => targetEdgeIds.includes(edgeId))
    );
    if (mismatchEdgeIds.size > 0) {
      applyPortDirectionStubs(
        data,
        mismatchEdgeIds,
        Math.max(2, Math.min(20, options.spacing ?? 10))
      );
    }

    const after = snapshotQuality(data);
    const issueBudgetExceeded =
      aggressive && after.quality.realIssues > before.quality.realIssues + 5;
    if (issueBudgetExceeded || compareQuality(after.quality, before.quality, aggressive) <= 0) {
      const rejected = {
        edgeIds: targetEdgeIds,
        quality: after.quality,
        validationOk: after.validation.ok,
        reason: issueBudgetExceeded
          ? ('issue-budget-exceeded' as const)
          : ('not-better-than-before' as const),
      };
      if (!bestRejected || compareQuality(rejected.quality, bestRejected.quality, aggressive) > 0) {
        bestRejected = rejected;
      }
      const pushRejected = <T extends { edgeIds: string[]; quality: LibavoidQualitySnapshot }>(
        list: T[],
        value: T
      ) => {
        list.push(value);
        list.sort((lhs, rhs) => {
          const cmp = compareQuality(lhs.quality, rhs.quality, aggressive);
          if (cmp !== 0) {
            return cmp > 0 ? -1 : 1;
          }
          return lhs.edgeIds.join('|').localeCompare(rhs.edgeIds.join('|'));
        });
        if (list.length > 5) {
          list.length = 5;
        }
      };
      pushRejected(topRejectedCandidates, rejected);
      if (rejected.edgeIds.length >= 4) {
        pushRejected(topRejectedLargeBundles, rejected);
      }
      if (rejected.reason === 'issue-budget-exceeded') {
        pushRejected(topIssueBudgetExceededCandidates, {
          ...rejected,
          reason: 'issue-budget-exceeded',
        });
      }
      continue;
    }
    if (!best || compareQuality(after.quality, best.quality, aggressive) > 0) {
      const acceptedPoints = new Map<string, Point[] | undefined>();
      for (const edge of data.edges ?? []) {
        if (edge?.id != null) {
          acceptedPoints.set(String(edge.id), clonePoints(edge.points as Point[] | undefined));
        }
      }
      best = {
        edgeIds: targetEdgeIds,
        acceptedPoints,
        validation: after.validation,
        score: after.score,
        quality: after.quality,
      };
    }
  }

  restoreOriginalPoints();
  if (!best) {
    reportTarget.__libavoidReport = {
      ...(reportTarget.__libavoidReport ?? {}),
      outcome: {
        status: 'rejected',
        reason: 'no-acceptable-candidate',
        candidateCount: candidateEdgeSets.length,
        aggressive,
        beforeValidationOk: before.validation.ok,
        beforeRealIssues: before.quality.realIssues,
        beforeCrossings: before.score.scores.crossings,
        beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
        bestRejectedCandidate: bestRejected
          ? {
              edgeIds: bestRejected.edgeIds,
              reason: bestRejected.reason,
              validationOk: bestRejected.validationOk,
              afterRealIssues: bestRejected.quality.realIssues,
              afterCrossings: bestRejected.quality.crossings,
              afterRenderedDiagonalEndpoints: bestRejected.quality.renderedDiagonalEndpoints,
              afterAvgBendsPerEdge: bestRejected.quality.avgBendsPerEdge,
            }
          : undefined,
        topRejectedCandidates: topRejectedCandidates.map((candidate) => ({
          edgeIds: candidate.edgeIds,
          reason: candidate.reason,
          validationOk: candidate.validationOk,
          afterRealIssues: candidate.quality.realIssues,
          afterCrossings: candidate.quality.crossings,
          afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
          afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
        })),
        topRejectedLargeBundles: topRejectedLargeBundles.map((candidate) => ({
          edgeIds: candidate.edgeIds,
          reason: candidate.reason,
          validationOk: candidate.validationOk,
          afterRealIssues: candidate.quality.realIssues,
          afterCrossings: candidate.quality.crossings,
          afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
          afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
        })),
        topIssueBudgetExceededCandidates: topIssueBudgetExceededCandidates.map((candidate) => ({
          edgeIds: candidate.edgeIds,
          reason: candidate.reason,
          validationOk: candidate.validationOk,
          afterRealIssues: candidate.quality.realIssues,
          afterCrossings: candidate.quality.crossings,
          afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
          afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
        })),
      },
    };
    log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_REJECTED', {
      candidateCount: candidateEdgeSets.length,
      aggressive,
      beforeValidationOk: before.validation.ok,
      beforeRealIssues: before.quality.realIssues,
      beforeCrossings: before.score.scores.crossings,
      beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
      bestRejectedCandidate: bestRejected
        ? {
            edgeIds: bestRejected.edgeIds,
            reason: bestRejected.reason,
            validationOk: bestRejected.validationOk,
            afterRealIssues: bestRejected.quality.realIssues,
            afterCrossings: bestRejected.quality.crossings,
            afterRenderedDiagonalEndpoints: bestRejected.quality.renderedDiagonalEndpoints,
            afterAvgBendsPerEdge: bestRejected.quality.avgBendsPerEdge,
          }
        : undefined,
      topRejectedCandidates: topRejectedCandidates.map((candidate) => ({
        edgeIds: candidate.edgeIds,
        reason: candidate.reason,
        validationOk: candidate.validationOk,
        afterRealIssues: candidate.quality.realIssues,
        afterCrossings: candidate.quality.crossings,
        afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
        afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
      })),
      topRejectedLargeBundles: topRejectedLargeBundles.map((candidate) => ({
        edgeIds: candidate.edgeIds,
        reason: candidate.reason,
        validationOk: candidate.validationOk,
        afterRealIssues: candidate.quality.realIssues,
        afterCrossings: candidate.quality.crossings,
        afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
        afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
      })),
      topIssueBudgetExceededCandidates: topIssueBudgetExceededCandidates.map((candidate) => ({
        edgeIds: candidate.edgeIds,
        reason: candidate.reason,
        validationOk: candidate.validationOk,
        afterRealIssues: candidate.quality.realIssues,
        afterCrossings: candidate.quality.crossings,
        afterRenderedDiagonalEndpoints: candidate.quality.renderedDiagonalEndpoints,
        afterAvgBendsPerEdge: candidate.quality.avgBendsPerEdge,
      })),
    });
    return;
  }

  // Per-edge veto: drop any libavoid-accepted route that would pass through
  // a non-endpoint node's interior. The global acceptance gate below trades
  // real invalidity for crossings; this guard prevents that trade-off
  // edge-by-edge. Reverted edges keep their pre-libavoid points and are
  // recorded as `identical` in the diff list (so downstream stages don't
  // try to polish them).
  const nodesByIdForVeto = new Map<string, Node>();
  for (const node of data.nodes ?? []) {
    if (node?.id != null) {
      nodesByIdForVeto.set(String(node.id), node);
    }
  }
  const vetoedEdgeIds = new Set<string>();
  for (const edge of data.edges ?? []) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (!edgeId || !best.acceptedPoints.has(edgeId)) {
      continue;
    }
    const candidatePoints = best.acceptedPoints.get(edgeId);
    const startId = edge?.start != null ? String(edge.start) : '';
    const endId = edge?.end != null ? String(edge.end) : '';
    if (
      polylineCrossesNonEndpointNodeInterior(
        candidatePoints,
        startId,
        endId,
        nodesByIdForVeto,
        options.spacing ?? 10
      )
    ) {
      vetoedEdgeIds.add(edgeId);
      // Restore the pre-libavoid polyline so downstream stages see the
      // original route, not the rejected candidate.
      best.acceptedPoints.set(edgeId, clonePoints(originalPoints.get(edgeId)));
    }
  }

  const acceptedDiffs = best.edgeIds.map((edgeId) => ({
    edgeId,
    before: clonePoints(originalPoints.get(edgeId)),
    after: clonePoints(best.acceptedPoints.get(edgeId)),
    identical:
      JSON.stringify(clonePoints(originalPoints.get(edgeId))) ===
      JSON.stringify(clonePoints(best.acceptedPoints.get(edgeId))),
    vetoed: vetoedEdgeIds.has(edgeId),
  }));
  const changedEdgeIds = acceptedDiffs.filter((d) => !d.identical).map((d) => d.edgeId);
  if (vetoedEdgeIds.size > 0) {
    log.warn(ORTHO_DEBUG, 'LIBAVOID_PER_EDGE_VETO', {
      vetoedEdgeIds: [...vetoedEdgeIds],
      reason: 'candidate-crosses-non-endpoint-node-interior',
    });
  }
  if (changedEdgeIds.length === 0) {
    reportTarget.__libavoidReport = {
      ...(reportTarget.__libavoidReport ?? {}),
      outcome: {
        status: 'rejected',
        reason: 'no-edge-geometry-changed',
        candidateCount: candidateEdgeSets.length,
        aggressive,
      },
    };
    log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_REJECTED', {
      candidateCount: candidateEdgeSets.length,
      aggressive,
      reason: 'no-edge-geometry-changed',
      beforeValidationOk: before.validation.ok,
      beforeRealIssues: before.quality.realIssues,
      beforeCrossings: before.score.scores.crossings,
      beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
    });
    restoreOriginalPoints();
    return;
  }
  const acceptedEdgeIdSet = new Set(changedEdgeIds);
  const changedDiffs = acceptedDiffs.filter((d) => !d.identical);
  const identicalDiffs = acceptedDiffs.filter((d) => d.identical);
  for (const edge of data.edges ?? []) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    (edge as typeof edge & { __libavoidAccepted?: boolean }).__libavoidAccepted =
      acceptedEdgeIdSet.has(edgeId);
    if (!edgeId || !best.acceptedPoints.has(edgeId)) {
      continue;
    }
    edge.points = clonePoints(best.acceptedPoints.get(edgeId));
  }
  (
    data as LayoutData & {
      __libavoidAcceptedEdgeIds?: string[];
      __libavoidAcceptedEdgePoints?: Record<string, Point[] | undefined>;
      __libavoidAcceptedDiffs?: {
        edgeId: string;
        before?: Point[];
        after?: Point[];
        identical: boolean;
      }[];
    }
  ).__libavoidAcceptedEdgeIds = [...changedEdgeIds];
  (
    data as LayoutData & {
      __libavoidAcceptedEdgeIds?: string[];
      __libavoidAcceptedEdgePoints?: Record<string, Point[] | undefined>;
      __libavoidAcceptedDiffs?: {
        edgeId: string;
        before?: Point[];
        after?: Point[];
        identical: boolean;
      }[];
    }
  ).__libavoidAcceptedEdgePoints = Object.fromEntries(
    changedEdgeIds.map((edgeId) => [edgeId, clonePoints(best.acceptedPoints.get(edgeId))])
  );
  (
    data as LayoutData & {
      __libavoidAcceptedDiffs?: {
        edgeId: string;
        before?: Point[];
        after?: Point[];
        identical: boolean;
      }[];
    }
  ).__libavoidAcceptedDiffs = changedDiffs;
  const accepted = snapshotQuality(data);

  if (trace) {
    for (const edgeId of best.edgeIds) {
      const existing = trace.edges[edgeId] ?? {};
      trace.edges[edgeId] = {
        ...existing,
        libavoidFallback: {
          accepted: true,
          candidateEdgeIds: changedEdgeIds,
          beforeRealIssues: before.quality.realIssues,
          afterRealIssues: accepted.quality.realIssues,
          beforeCrossings: before.score.scores.crossings,
          afterCrossings: accepted.score.scores.crossings,
          beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
          afterRenderedDiagonalEndpoints: accepted.score.scores.renderedDiagonalEndpoints,
        },
      };
    }
  }

  reportTarget.__libavoidReport = {
    ...(reportTarget.__libavoidReport ?? {}),
    outcome: {
      status: 'accepted',
      candidateCount: candidateEdgeSets.length,
      aggressive,
      targetEdgeCount: changedEdgeIds.length,
      targetEdgeIds: changedEdgeIds,
      beforeValidationOk: before.validation.ok,
      afterValidationOk: accepted.validation.ok,
      beforeRealIssues: before.quality.realIssues,
      afterRealIssues: accepted.quality.realIssues,
      beforeCrossings: before.score.scores.crossings,
      afterCrossings: accepted.score.scores.crossings,
      beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
      afterRenderedDiagonalEndpoints: accepted.score.scores.renderedDiagonalEndpoints,
      identicalAcceptedEdges: identicalDiffs.map((d) => d.edgeId),
      changedAcceptedEdges: changedDiffs.map((d) => d.edgeId),
    },
    diffs: changedDiffs,
  };
  log.warn(ORTHO_DEBUG, 'LIBAVOID_FALLBACK_ACCEPTED', {
    candidateCount: candidateEdgeSets.length,
    aggressive,
    targetEdgeCount: changedEdgeIds.length,
    targetEdgeIds: changedEdgeIds,
    beforeValidationOk: before.validation.ok,
    afterValidationOk: accepted.validation.ok,
    beforeRealIssues: before.quality.realIssues,
    afterRealIssues: accepted.quality.realIssues,
    beforeCrossings: before.score.scores.crossings,
    afterCrossings: accepted.score.scores.crossings,
    beforeRenderedDiagonalEndpoints: before.score.scores.renderedDiagonalEndpoints,
    afterRenderedDiagonalEndpoints: accepted.score.scores.renderedDiagonalEndpoints,
    identicalAcceptedEdges: identicalDiffs.map((d) => d.edgeId),
    changedAcceptedEdges: changedDiffs.map((d) => d.edgeId),
  });
  log.warn(ORTHO_DEBUG, 'LIBAVOID_ACCEPTED_EDGE_DIFFS', changedDiffs);
}
