import type { LayoutData } from '../../../types.js';
import { log } from '../../../../logger.js';
import { collectLayoutNodeRects, segmentBoundsOverlapRect } from './geometry.js';

export interface ValidationIssue {
  type: 'edge-node-overlap' | 'edge-edge-crossing';
  edgeId: string;
  /** Second edge ID (for crossings) or node ID (for overlaps) */
  targetId: string;
  detail: string;
}

/**
 * Checks if two line segments intersect.
 * Uses the CCW (counter-clockwise) orientation test.
 * Returns true only for proper intersections: touching endpoints
 * or collinear segments return false.
 */
function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) {
    return false; // parallel or collinear
  }

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;

  // Strict interior intersection to avoid false positives at shared nodes.
  const eps = 0.01;
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
}

/**
 * Final validation pass: scans the completed layout for remaining quality
 * issues. Does not attempt fixes, just logs warnings so developers can
 * identify problems during debugging.
 *
 * Checks:
 * 1. Edge segments that still pass through non-endpoint nodes
 * 2. Edge segments that cross other edge segments
 */
export function validateSwimlanesLayout(layout: LayoutData): ValidationIssue[] {
  const nodes = layout.nodes ?? [];
  const edges = (layout.edges ?? []) as any[];
  const issues: ValidationIssue[] = [];

  if (!edges.length || !nodes.length) {
    return issues;
  }

  const nodeRects = collectLayoutNodeRects(nodes);

  const epsilon = 1; // tighter than the fix pass: catch marginal overlaps
  const edgeSegments: {
    edgeId: string;
    start: string;
    end: string;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  }[] = [];

  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const points = edge.points as { x: number; y: number }[] | undefined;
    if (!points || points.length < 2) {
      continue;
    }
    const edgeStart = edge.start as string | undefined;
    const edgeEnd = edge.end as string | undefined;
    const ownLabelId = edge.labelNodeId as string | undefined;
    const edgeId = (edge.id as string) ?? `${edgeStart}->${edgeEnd}`;

    for (const rect of nodeRects) {
      if (rect.nodeId === edgeStart || rect.nodeId === edgeEnd) {
        continue;
      }
      if (ownLabelId && rect.nodeId === ownLabelId) {
        continue;
      }
      for (let i = 0; i < points.length - 1; i++) {
        if (segmentBoundsOverlapRect(points[i], points[i + 1], rect, -epsilon)) {
          issues.push({
            type: 'edge-node-overlap',
            edgeId,
            targetId: rect.nodeId,
            detail: `segment ${i} passes through node "${rect.nodeId}"`,
          });
          break;
        }
      }
    }

    for (let i = 0; i < points.length - 1; i++) {
      edgeSegments.push({
        edgeId,
        start: edgeStart!,
        end: edgeEnd!,
        p1: points[i],
        p2: points[i + 1],
      });
    }
  }

  const crossingPairs = new Set<string>();
  for (let i = 0; i < edgeSegments.length; i++) {
    for (let j = i + 1; j < edgeSegments.length; j++) {
      const a = edgeSegments[i];
      const b = edgeSegments[j];
      if (a.edgeId === b.edgeId) {
        continue;
      }

      if (a.start === b.start || a.start === b.end || a.end === b.start || a.end === b.end) {
        continue;
      }

      if (segmentsIntersect(a.p1, a.p2, b.p1, b.p2)) {
        const pairKey = a.edgeId < b.edgeId ? `${a.edgeId}|${b.edgeId}` : `${b.edgeId}|${a.edgeId}`;
        if (!crossingPairs.has(pairKey)) {
          crossingPairs.add(pairKey);
          issues.push({
            type: 'edge-edge-crossing',
            edgeId: a.edgeId,
            targetId: b.edgeId,
            detail: `edges "${a.edgeId}" and "${b.edgeId}" cross`,
          });
        }
      }
    }
  }

  if (issues.length > 0) {
    const overlaps = issues.filter((i) => i.type === 'edge-node-overlap').length;
    const crossings = issues.filter((i) => i.type === 'edge-edge-crossing').length;
    log.warn(
      `[SWIMLANE_VALIDATE] ${issues.length} issue(s) detected: ` +
        `${overlaps} edge-node overlap(s), ${crossings} edge crossing(s)`
    );
    for (const issue of issues) {
      log.warn(`[SWIMLANE_VALIDATE]   ${issue.type}: ${issue.detail}`);
    }
  }

  return issues;
}
