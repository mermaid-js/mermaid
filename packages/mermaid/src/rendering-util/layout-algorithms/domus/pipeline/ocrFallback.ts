import type { LayoutData, Node } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type { OrthogonalOptions } from '../types.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { assignPortsForEdge, chooseBoundaryPortOutsideOtherNodes } from '../core/portAssignment.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';
import { rectForNode } from '../core/helpers.js';
import { collectObstacleRects } from '../core/routing.js';
import { findOcrPathBetweenPortsWithObstacles } from '../core/ocr/index.js';
import { normalizePolyline } from './polyline.js';
import {
  applyNudgingConstraintsLocal,
  applyPathOrderingAndSpacingLocal,
  segmentKeyForSpacing,
} from './postRouting.js';
import type { CompoundBoundaryStep } from './compoundBoundary.js';

function extractFailingEdgeIdsFromIssues(issues: { edgeId?: string }[]): string[] {
  const ids = new Set<string>();
  for (const iss of issues ?? []) {
    if (iss?.edgeId) {
      ids.add(String(iss.edgeId));
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function applyOcrFallbackIfNeeded(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  nodesById: Map<string, Node>;
  nodesByIdNoGroups: Map<string, Node>;
  groupsById: Map<string, Node>;
  spacing: number;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  incrementalEnabled: boolean;
  // Deterministic per-endpoint port distribution.
  tByEdgeEndpointKey: Map<string, number>;
  trace?: { edges: Record<string, any> } | undefined;
  // Present so the signature stays stable if future OCR fallback needs to reason about compound routes.
  compoundStepsByEdgeId?: Map<string, CompoundBoundaryStep[]> | undefined;
}): void {
  const {
    data,
    options,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    spacing,
    backend,
    incrementalEnabled,
    tByEdgeEndpointKey,
    trace,
  } = args;

  // Validation-gated OCR fallback (non-invasive):
  // - Only applies to routing-graph backend.
  // - Keeps primary routing as-is for happy cases.
  // - Uses validateLayout() unchanged as the oracle.
  if (incrementalEnabled || backend !== 'routing-graph' || !(options.ocrFallback ?? true)) {
    return;
  }
  const primaryModel = options.routingGraphModel ?? 'grid';
  if (primaryModel === 'ocr') {
    return;
  }

  const before = validateLayout(data);
  const scoreGate =
    options.ocrScoreThreshold != null && before.ok && before.score < options.ocrScoreThreshold;
  const hardIssue =
    !before.ok &&
    before.issues.some((iss) =>
      [
        'node-overlap',
        'edge-missing-points',
        'edge-non-orthogonal',
        'edge-intersects-node',
        'edge-intersects-obstacle',
      ].includes(iss.type as any)
    );
  // Only fall back to OCR for correctness-critical violations (or an explicit score gate),
  // not for aesthetic issues like border-hugging/shared-subpath.
  if (!hardIssue && !scoreGate) {
    return;
  }

  const issuesForEdge = (res: { issues: { edgeId?: string }[] }, edgeId: string) =>
    (res.issues ?? []).filter((iss) => iss?.edgeId != null && String(iss.edgeId) === edgeId);

  const failingEdgeIds = extractFailingEdgeIdsFromIssues(before.issues);
  const rerouteAll = !before.ok && failingEdgeIds.length === 0;
  const targetEdgeIds = new Set<string>(
    rerouteAll
      ? (data.edges ?? [])
          .map((e) => (e?.id != null ? String(e.id) : ''))
          .filter((id) => id.length > 0)
      : failingEdgeIds
  );

  const changed = new Set<string>();
  const ocrMaxExpansions = options.ocrMaxExpansions ?? 50_000;

  for (const edge of data.edges ?? []) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (!edgeId || !targetEdgeIds.has(edgeId)) {
      continue;
    }
    if ((edge as any).__orthoCompound) {
      // Compound routes use semantic waypoints; OCR integration for those is handled
      // in the per-segment routing stage and is out of scope for this fallback pass.
      continue;
    }
    if (!edge.start || !edge.end) {
      continue;
    }
    const startNodeId = String(edge.start);
    const endNodeId = String(edge.end);
    const startNode = nodesById.get(startNodeId);
    const endNode = nodesById.get(endNodeId);
    if (!startNode || !endNode) {
      continue;
    }

    // Recompute ports deterministically (same as primary pass).
    const ports = assignPortsForEdge(startNode, endNode);
    const rs0 = rectForNode(startNode);
    const re0 = rectForNode(endNode);
    const tStart = tByEdgeEndpointKey.get(`${edgeId}|start`) ?? 0.5;
    const tEnd = tByEdgeEndpointKey.get(`${edgeId}|end`) ?? 0.5;
    const startCandidate = computeBoundaryPortAtT(rs0, ports.startSide, tStart);
    const endCandidate = computeBoundaryPortAtT(re0, ports.endSide, tEnd);

    const safeStartPortRaw =
      chooseBoundaryPortOutsideOtherNodes(startNodeId, endNodeId, nodesById, {
        preferredSide: ports.startSide,
        candidatePort: startCandidate,
      }) ?? startCandidate;
    const safeEndPortRaw =
      chooseBoundaryPortOutsideOtherNodes(endNodeId, startNodeId, nodesById, {
        preferredSide: ports.endSide,
        candidatePort: endCandidate,
      }) ?? endCandidate;

    const obstacleRects = collectObstacleRects(nodesById, startNodeId, endNodeId, 0);
    const ocr = findOcrPathBetweenPortsWithObstacles(
      safeStartPortRaw,
      safeEndPortRaw,
      obstacleRects,
      spacing,
      { maxExpansions: ocrMaxExpansions }
    );
    if (!ocr.points) {
      continue; // deterministic fallback: keep existing path
    }
    const beforeEdgeIssues = issuesForEdge(before, edgeId);
    const prevPoints = edge.points;
    const candidate = normalizePolyline(ocr.points, groupsById);
    edge.points = candidate;
    const after = validateLayout(data);
    const afterEdgeIssues = issuesForEdge(after, edgeId);

    // Accept OCR reroute only if it improves validation for this edge or fixes the whole layout.
    const accept = after.ok || afterEdgeIssues.length < beforeEdgeIssues.length;
    if (!accept) {
      edge.points = prevPoints;
      continue;
    }

    changed.add(edgeId);

    if (trace) {
      const existing = trace.edges[edgeId] ?? {};
      // Preserve the original routing-graph trace fields; attach OCR details separately.
      trace.edges[edgeId] = {
        ...existing,
        startNodeId,
        endNodeId,
        ocrFallback: {
          points: [...(edge.points as any)],
          stats: { nodes: ocr.stats.nodes, edges: ocr.stats.edges },
          beforeIssues: beforeEdgeIssues,
          afterIssues: afterEdgeIssues,
        } as any,
      };
    }
  }

  if (changed.size > 0 && spacing > 0) {
    // Local post-process only inside the neighborhood affected by changed edges.
    const keys = new Set<string>();
    for (const edge of data.edges ?? []) {
      const edgeId = edge?.id != null ? String(edge.id) : '';
      if (!edgeId || !changed.has(edgeId)) {
        continue;
      }
      const k = edge.points ? segmentKeyForSpacing(edge.points as any) : null;
      if (k) {
        keys.add(k);
      }
    }
    const neighborhood = new Set<string>();
    for (const edge of data.edges ?? []) {
      const edgeId = edge?.id != null ? String(edge.id) : '';
      if (!edgeId) {
        continue;
      }
      const k = edge.points ? segmentKeyForSpacing(edge.points as any) : null;
      if (k && keys.has(k)) {
        neighborhood.add(edgeId);
      }
    }
    applyPathOrderingAndSpacingLocal(data, nodesByIdNoGroups, spacing, neighborhood);
    applyNudgingConstraintsLocal(data, nodesByIdNoGroups, spacing, neighborhood);
  }

  const after = validateLayout(data);
  log.debug(ORTHO_DEBUG, 'OCR_FALLBACK_VALIDATION', {
    primaryModel,
    rerouteAll,
    targeted: targetEdgeIds.size,
    changed: changed.size,
    beforeOk: before.ok,
    beforeScore: before.score,
    afterOk: after.ok,
    afterScore: after.score,
    beforeIssueCount: before.issues.length,
    afterIssueCount: after.issues.length,
  });
}
