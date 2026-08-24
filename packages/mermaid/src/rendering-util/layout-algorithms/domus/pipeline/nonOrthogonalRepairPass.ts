import type { Edge, LayoutData } from '../../../types.js';
import { checkLayout } from '../validateLayoutProxy.js';
import type { Point } from '../types.js';

function copyPoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function copyPoints(points: readonly Point[] | undefined): Point[] {
  return points?.map(copyPoint) ?? [];
}

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}

function normalizeCandidate(points: readonly Point[]): Point[] {
  const dedup: Point[] = [];
  for (const point of points) {
    const last = dedup[dedup.length - 1];
    if (last && samePoint(last, point)) {
      continue;
    }
    dedup.push(copyPoint(point));
  }

  if (dedup.length <= 2) {
    return dedup;
  }

  const out: Point[] = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = dedup[i];
    const next = dedup[i + 1];
    const collinearX = Math.abs(prev.x - cur.x) < 1e-6 && Math.abs(cur.x - next.x) < 1e-6;
    const collinearY = Math.abs(prev.y - cur.y) < 1e-6 && Math.abs(cur.y - next.y) < 1e-6;
    if (collinearX || collinearY) {
      continue;
    }
    out.push(cur);
  }
  out.push(dedup[dedup.length - 1]);
  return out;
}

function issueCountForEdge(layout: LayoutData, edgeId: string): number {
  return checkLayout(layout).issues.filter((issue) => issue.edgeId === edgeId).length;
}

function cloneLayoutWithEdgePoints(
  layout: LayoutData,
  edgeId: string,
  points: Point[]
): LayoutData {
  return {
    ...layout,
    config: layout.config ? { ...(layout.config as Record<string, unknown>) } : layout.config,
    nodes: (layout.nodes ?? []).map((node) => ({
      ...(node as unknown as Record<string, unknown>),
    })) as unknown as LayoutData['nodes'],
    edges: (layout.edges ?? []).map((edge) => ({
      ...(edge as unknown as Record<string, unknown>),
      points:
        String(edge.id ?? '') === edgeId
          ? copyPoints(points)
          : edge.points?.map((point) => ({ x: point.x, y: point.y })),
    })) as LayoutData['edges'],
  };
}

function candidateRoutes(edge: Edge, spacing: number): Point[][] {
  const points = copyPoints(edge.points);
  if (points.length < 2 || edge.label) {
    return [];
  }

  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const clearance = Math.max(20, spacing * 3);
  const candidates: Point[][] = [];

  if (Math.abs(dy) >= Math.abs(dx)) {
    const dir = dy >= 0 ? 1 : -1;
    for (const scale of [1, 1.5, 2]) {
      const viaY = end.y - dir * clearance * scale;
      candidates.push(
        normalizeCandidate([start, { x: start.x, y: viaY }, { x: end.x, y: viaY }, end])
      );
    }
  }

  if (Math.abs(dx) >= Math.abs(dy)) {
    const dir = dx >= 0 ? 1 : -1;
    for (const scale of [1, 1.5, 2]) {
      const viaX = end.x - dir * clearance * scale;
      candidates.push(
        normalizeCandidate([start, { x: viaX, y: start.y }, { x: viaX, y: end.y }, end])
      );
    }
  }

  return candidates;
}

export function repairNonOrthogonalEdgesWhenIssuesImprove(
  layout: LayoutData,
  options: { spacing?: number } = {}
): { changed: number } {
  const spacing = options.spacing ?? 10;
  let currentValidation = checkLayout(layout);
  const candidateEdgeIds = new Set(
    currentValidation.issues
      .filter((issue) => issue.type === 'edge-non-orthogonal' && issue.edgeId)
      .map((issue) => String(issue.edgeId))
  );

  let changed = 0;
  for (const edgeId of candidateEdgeIds) {
    const edge = (layout.edges ?? []).find((item) => String(item.id ?? '') === edgeId);
    if (!edge) {
      continue;
    }

    const beforeEdgeIssues = currentValidation.issues.filter(
      (issue) => issue.edgeId === edgeId
    ).length;
    const beforeTotalIssues = currentValidation.issues.length;
    let bestPoints: Point[] | null = null;
    let bestEdgeIssues = beforeEdgeIssues;
    let bestTotalIssues = beforeTotalIssues;

    for (const candidate of candidateRoutes(edge, spacing)) {
      if (candidate.length < 2) {
        continue;
      }
      const trial = cloneLayoutWithEdgePoints(layout, edgeId, candidate);
      const trialValidation = checkLayout(trial);
      const trialEdgeIssues = issueCountForEdge(trial, edgeId);
      const trialTotalIssues = trialValidation.issues.length;
      if (trialEdgeIssues >= bestEdgeIssues || trialTotalIssues > beforeTotalIssues) {
        continue;
      }
      if (trialEdgeIssues < bestEdgeIssues || trialTotalIssues < bestTotalIssues) {
        bestPoints = candidate;
        bestEdgeIssues = trialEdgeIssues;
        bestTotalIssues = trialTotalIssues;
      }
    }

    if (!bestPoints) {
      continue;
    }
    edge.points = copyPoints(bestPoints);
    changed++;
    currentValidation = checkLayout(layout);
  }

  return { changed };
}
