import type { Edge, LayoutData, Node } from '../../../types.js';
import { validateLayout, type ValidateLayoutResult } from '../validateLayoutProxy.js';
import { approxEqual, rectForNode } from '../core/helpers.js';
import type { Point } from '../types.js';

export interface StraightLeafAlignmentOptions {
  spacing?: number;
  maxLeafShift?: number;
}

export interface StraightLeafAlignmentStats {
  aligned: number;
  rejected: number;
}

interface StraightLeafCandidate {
  edge: Edge;
  start: Node;
  end: Node;
  leaf: Node;
  fixed: Node;
  vertical: boolean;
}

function nodeId(id: unknown): string | null {
  let value: string;
  if (typeof id === 'string') {
    value = id;
  } else if (typeof id === 'number' || typeof id === 'boolean' || typeof id === 'bigint') {
    value = String(id);
  } else {
    return null;
  }
  return value.length > 0 ? value : null;
}

function isLayoutLeafNode(node: Node | undefined): node is Node {
  return Boolean(
    node &&
      !node.isGroup &&
      !(node as { isEdgeLabel?: boolean }).isEdgeLabel &&
      !(node as { isDummy?: boolean }).isDummy &&
      Number.isFinite(node.x) &&
      Number.isFinite(node.y) &&
      Number.isFinite(node.width) &&
      Number.isFinite(node.height)
  );
}

function isSemanticEdge(edge: Edge): boolean {
  return !edge.isLabelEdge && nodeId(edge.start) !== null && nodeId(edge.end) !== null;
}

function buildNodeMap(layout: LayoutData): Map<string, Node> {
  const out = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    const id = nodeId(node?.id);
    if (id) {
      out.set(id, node);
    }
  }
  return out;
}

function buildDegrees(layout: LayoutData, nodesById: Map<string, Node>): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of layout.edges ?? []) {
    if (!isSemanticEdge(edge)) {
      continue;
    }
    const startId = nodeId(edge.start);
    const endId = nodeId(edge.end);
    if (!startId || !endId || startId === endId) {
      continue;
    }
    const start = nodesById.get(startId);
    const end = nodesById.get(endId);
    if (!isLayoutLeafNode(start) || !isLayoutLeafNode(end)) {
      continue;
    }
    degrees.set(startId, (degrees.get(startId) ?? 0) + 1);
    degrees.set(endId, (degrees.get(endId) ?? 0) + 1);
  }
  return degrees;
}

function straightAxis(points: readonly Point[]): 'vertical' | 'horizontal' | null {
  if (points.length !== 2) {
    return null;
  }
  const [a, b] = points;
  if (approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
    return 'vertical';
  }
  if (approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
    return 'horizontal';
  }
  return null;
}

function findCandidate(
  edge: Edge,
  nodesById: Map<string, Node>,
  degrees: Map<string, number>
): StraightLeafCandidate | null {
  if (!isSemanticEdge(edge) || !Array.isArray(edge.points)) {
    return null;
  }
  const axis = straightAxis(edge.points);
  if (!axis) {
    return null;
  }

  const startId = nodeId(edge.start);
  const endId = nodeId(edge.end);
  const start = startId ? nodesById.get(startId) : undefined;
  const end = endId ? nodesById.get(endId) : undefined;
  if (!isLayoutLeafNode(start) || !isLayoutLeafNode(end)) {
    return null;
  }

  const startDegree = startId ? (degrees.get(startId) ?? 0) : 0;
  const endDegree = endId ? (degrees.get(endId) ?? 0) : 0;
  if (startDegree === 1 && endDegree > 1) {
    return { edge, start, end, leaf: start, fixed: end, vertical: axis === 'vertical' };
  }
  if (endDegree === 1 && startDegree > 1) {
    return { edge, start, end, leaf: end, fixed: start, vertical: axis === 'vertical' };
  }
  return null;
}

function boundaryPoints(start: Node, end: Node, vertical: boolean): Point[] | null {
  const startRect = rectForNode(start);
  const endRect = rectForNode(end);

  if (vertical) {
    if (approxEqual(startRect.cy, endRect.cy)) {
      return null;
    }
    return startRect.cy < endRect.cy
      ? [
          { x: startRect.cx, y: startRect.bottom },
          { x: endRect.cx, y: endRect.top },
        ]
      : [
          { x: startRect.cx, y: startRect.top },
          { x: endRect.cx, y: endRect.bottom },
        ];
  }

  if (approxEqual(startRect.cx, endRect.cx)) {
    return null;
  }
  return startRect.cx < endRect.cx
    ? [
        { x: startRect.right, y: startRect.cy },
        { x: endRect.left, y: endRect.cy },
      ]
    : [
        { x: startRect.left, y: startRect.cy },
        { x: endRect.right, y: endRect.cy },
      ];
}

function shouldAccept(next: ValidateLayoutResult, current: ValidateLayoutResult): boolean {
  return (
    next.ok &&
    next.issues.length === 0 &&
    next.breakdown.crossings <= current.breakdown.crossings &&
    next.score >= current.score
  );
}

function tryAlignCandidate(
  candidate: StraightLeafCandidate,
  current: ValidateLayoutResult,
  maxLeafShift: number,
  layout: LayoutData
): ValidateLayoutResult | null {
  const { edge, leaf, fixed, start, end, vertical } = candidate;
  const originalLeaf = { x: leaf.x, y: leaf.y };
  const originalPoints = edge.points?.map((point) => ({ x: point.x, y: point.y }));
  if (!originalPoints) {
    return null;
  }

  const shift = vertical
    ? Math.abs(Number(fixed.x) - Number(leaf.x))
    : Math.abs(Number(fixed.y) - Number(leaf.y));
  if (!Number.isFinite(shift) || shift <= 1e-6 || shift > maxLeafShift) {
    return null;
  }

  if (vertical) {
    leaf.x = fixed.x;
  } else {
    leaf.y = fixed.y;
  }

  const nextPoints = boundaryPoints(start, end, vertical);
  if (!nextPoints) {
    leaf.x = originalLeaf.x;
    leaf.y = originalLeaf.y;
    edge.points = originalPoints;
    return null;
  }
  edge.points = nextPoints;

  const next = validateLayout(layout);
  if (shouldAccept(next, current)) {
    return next;
  }

  leaf.x = originalLeaf.x;
  leaf.y = originalLeaf.y;
  edge.points = originalPoints;
  return null;
}

/**
 * Final cosmetic alignment for already-valid, straight one-leaf edges.
 *
 * DOMUS can legitimately leave a leaf slightly off the apparent rail after
 * Mermaid-specific size nudging and route cleanup. When the settled route is
 * already a straight edge and exactly one endpoint is a degree-1 leaf, center
 * that leaf on the non-leaf endpoint's row/column and keep the change only if
 * the unified validator remains clean without lowering score.
 */
export function alignStraightLeafEdgesWhenValid(
  layout: LayoutData,
  options: StraightLeafAlignmentOptions = {}
): StraightLeafAlignmentStats {
  let current = validateLayout(layout);
  const stats: StraightLeafAlignmentStats = { aligned: 0, rejected: 0 };
  if (!current.ok || current.issues.length > 0) {
    return stats;
  }

  const maxLeafShift = options.maxLeafShift ?? Math.max(4, (options.spacing ?? 10) * 4);
  const nodesById = buildNodeMap(layout);
  const degrees = buildDegrees(layout, nodesById);

  for (const edge of layout.edges ?? []) {
    const candidate = findCandidate(edge, nodesById, degrees);
    if (!candidate) {
      continue;
    }
    const next = tryAlignCandidate(candidate, current, maxLeafShift, layout);
    if (next) {
      current = next;
      stats.aligned++;
    } else {
      stats.rejected++;
    }
  }

  return stats;
}
