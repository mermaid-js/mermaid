import type { Edge, LayoutData, Node } from '../../../types.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { approxEqual, rectForNode } from '../core/helpers.js';
import type { Point } from '../types.js';

type Side = 'E' | 'W' | 'N' | 'S';

function copyPoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function copyPoints(points: readonly Point[] | undefined): Point[] {
  return points?.map(copyPoint) ?? [];
}

function samePoint(a: Point, b: Point): boolean {
  return approxEqual(a.x, b.x) && approxEqual(a.y, b.y);
}

function normalize(points: readonly Point[]): Point[] {
  const dedup: Point[] = [];
  for (const point of points) {
    const last = dedup[dedup.length - 1];
    if (!last || !samePoint(last, point)) {
      dedup.push(copyPoint(point));
    }
  }

  if (dedup.length <= 2) {
    return dedup;
  }

  const out: Point[] = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = dedup[i];
    const next = dedup[i + 1];
    const collinearX = approxEqual(prev.x, cur.x) && approxEqual(cur.x, next.x);
    const collinearY = approxEqual(prev.y, cur.y) && approxEqual(cur.y, next.y);
    if (!collinearX && !collinearY) {
      out.push(cur);
    }
  }
  out.push(dedup[dedup.length - 1]);
  return out;
}

function sideFromBoundaryPoint(point: Point, node: Node): Side | null {
  const rect = rectForNode(node);
  if (approxEqual(point.x, rect.left)) {
    return 'W';
  }
  if (approxEqual(point.x, rect.right)) {
    return 'E';
  }
  if (approxEqual(point.y, rect.top)) {
    return 'N';
  }
  if (approxEqual(point.y, rect.bottom)) {
    return 'S';
  }
  return null;
}

function outwardPoint(point: Point, side: Side, length: number): Point {
  switch (side) {
    case 'E':
      return { x: point.x + length, y: point.y };
    case 'W':
      return { x: point.x - length, y: point.y };
    case 'N':
      return { x: point.x, y: point.y - length };
    case 'S':
      return { x: point.x, y: point.y + length };
  }
}

function approachesFromOutside(adjacent: Point, boundary: Point, side: Side): boolean {
  switch (side) {
    case 'E':
      return adjacent.x > boundary.x;
    case 'W':
      return adjacent.x < boundary.x;
    case 'N':
      return adjacent.y < boundary.y;
    case 'S':
      return adjacent.y > boundary.y;
  }
}

function connectorViaExterior(a: Point, b: Point, side: Side): Point[] {
  if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
    return [];
  }
  if (side === 'E' || side === 'W') {
    return [{ x: b.x, y: a.y }];
  }
  return [{ x: a.x, y: b.y }];
}

function connectorToEndpointStub(a: Point, b: Point, side: Side): Point[] {
  if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
    return [];
  }
  if (side === 'N' || side === 'S') {
    return [{ x: b.x, y: a.y }];
  }
  return [{ x: a.x, y: b.y }];
}

function pointInsideNode(point: Point, node: Node): boolean {
  const rect = rectForNode(node);
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

function sideFacingAnchor(anchor: Point, node: Node): Side {
  const rect = rectForNode(node);
  if (anchor.y < rect.top) {
    return 'N';
  }
  if (anchor.y > rect.bottom) {
    return 'S';
  }
  if (anchor.x < rect.left) {
    return 'W';
  }
  if (anchor.x > rect.right) {
    return 'E';
  }

  const dxLeft = Math.abs(anchor.x - rect.left);
  const dxRight = Math.abs(anchor.x - rect.right);
  const dyTop = Math.abs(anchor.y - rect.top);
  const dyBottom = Math.abs(anchor.y - rect.bottom);
  const min = Math.min(dxLeft, dxRight, dyTop, dyBottom);
  if (min === dyTop) {
    return 'N';
  }
  if (min === dyBottom) {
    return 'S';
  }
  if (min === dxLeft) {
    return 'W';
  }
  return 'E';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function boundaryPointFacingAnchor(anchor: Point, node: Node, side: Side): Point {
  const rect = rectForNode(node);
  const inset = 1;
  const nodeX = Number(node.x ?? (rect.left + rect.right) / 2);
  const nodeY = Number(node.y ?? (rect.top + rect.bottom) / 2);
  switch (side) {
    case 'N':
      return {
        x:
          anchor.x < rect.left || anchor.x > rect.right
            ? nodeX
            : clamp(anchor.x, rect.left + inset, rect.right - inset),
        y: rect.top,
      };
    case 'S':
      return {
        x:
          anchor.x < rect.left || anchor.x > rect.right
            ? nodeX
            : clamp(anchor.x, rect.left + inset, rect.right - inset),
        y: rect.bottom,
      };
    case 'W':
      return {
        x: rect.left,
        y:
          anchor.y < rect.top || anchor.y > rect.bottom
            ? nodeY
            : clamp(anchor.y, rect.top + inset, rect.bottom - inset),
      };
    case 'E':
      return {
        x: rect.right,
        y:
          anchor.y < rect.top || anchor.y > rect.bottom
            ? nodeY
            : clamp(anchor.y, rect.top + inset, rect.bottom - inset),
      };
  }
}

function candidateWithExteriorEndpointStubs(
  edge: Edge,
  nodesById: Map<string, Node>,
  stubLength: number
): Point[] | null {
  const points = copyPoints(edge.points);
  if (points.length < 2 || !edge.start || !edge.end) {
    return null;
  }

  let next = points;
  const startNode = nodesById.get(String(edge.start));
  const endNode = nodesById.get(String(edge.end));

  if (startNode) {
    const side = sideFromBoundaryPoint(next[0], startNode);
    const adjacent = next[1];
    if (side && adjacent && !approachesFromOutside(adjacent, next[0], side)) {
      const stub = outwardPoint(next[0], side, stubLength);
      const after = next[2];
      next = normalize([
        next[0],
        stub,
        ...(after ? connectorViaExterior(stub, after, side) : []),
        ...next.slice(2),
      ]);
    }
  }

  if (endNode) {
    const end = next[next.length - 1];
    const prev = next[next.length - 2];
    const before = next[next.length - 3];
    const side = sideFromBoundaryPoint(end, endNode);
    if (before && prev && pointInsideNode(prev, endNode)) {
      const replacementSide = sideFacingAnchor(before, endNode);
      const replacementEnd = boundaryPointFacingAnchor(before, endNode, replacementSide);
      const stub = outwardPoint(replacementEnd, replacementSide, stubLength);
      next = normalize([
        ...next.slice(0, -2),
        ...connectorViaExterior(before, stub, replacementSide),
        stub,
        replacementEnd,
      ]);
    } else if (side && prev && !approachesFromOutside(prev, end, side)) {
      const anchor = before ?? prev;
      const replacementSide = sideFacingAnchor(anchor, endNode);
      if (replacementSide !== side) {
        const replacementEnd = boundaryPointFacingAnchor(anchor, endNode, replacementSide);
        const stub = outwardPoint(replacementEnd, replacementSide, stubLength);
        next = normalize([
          ...next.slice(0, -2),
          ...connectorToEndpointStub(anchor, stub, replacementSide),
          stub,
          replacementEnd,
        ]);
      } else {
        const stub = outwardPoint(end, side, stubLength);
        next = normalize([
          ...next.slice(0, -2),
          ...(before ? connectorViaExterior(before, stub, side) : []),
          stub,
          end,
        ]);
      }
    }
  }

  if (
    next.length === points.length &&
    next.every((point, index) => samePoint(point, points[index]))
  ) {
    return null;
  }
  return next;
}

function segmentMatches(a: Point, b: Point, segment: { a?: Point; b?: Point }): boolean {
  return Boolean(
    segment.a &&
      segment.b &&
      ((samePoint(a, segment.a) && samePoint(b, segment.b)) ||
        (samePoint(a, segment.b) && samePoint(b, segment.a)))
  );
}

function candidateWithShiftedBorderHug(
  edge: Edge,
  issue: {
    nodeIds?: string[];
    details?: { segment?: { a?: Point; b?: Point; orientation?: string } };
  },
  nodesById: Map<string, Node>,
  spacing: number
): Point[] | null {
  const segment = issue.details?.segment;
  const groupId = issue.nodeIds?.[0];
  const group = groupId ? nodesById.get(String(groupId)) : undefined;
  const points = copyPoints(edge.points);
  if (!segment || !group || points.length < 2) {
    return null;
  }

  const rect = rectForNode(group);
  const orientation = segment.orientation;
  const shifted = points.map(copyPoint);
  const shiftPoint = (index: number, dx: number, dy: number): void => {
    shifted[index] = { x: shifted[index].x + dx, y: shifted[index].y + dy };
  };

  for (let i = 0; i < points.length - 1; i++) {
    if (!segmentMatches(points[i], points[i + 1], segment)) {
      continue;
    }

    let dx = 0;
    let dy = 0;
    if (orientation === 'V') {
      const x = points[i].x;
      if (approxEqual(x, rect.left)) {
        dx = -spacing;
      } else if (approxEqual(x, rect.right)) {
        dx = spacing;
      } else {
        return null;
      }
    } else if (orientation === 'H') {
      const y = points[i].y;
      if (approxEqual(y, rect.top)) {
        dy = -spacing;
      } else if (approxEqual(y, rect.bottom)) {
        dy = spacing;
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (i === 0) {
      shifted.splice(1, 0, { x: points[0].x + dx, y: points[0].y + dy });
      shiftPoint(2, dx, dy);
    } else if (i === points.length - 2) {
      shiftPoint(i, dx, dy);
      shifted.splice(i + 1, 0, { x: points[i + 1].x + dx, y: points[i + 1].y + dy });
    } else {
      shiftPoint(i, dx, dy);
      shiftPoint(i + 1, dx, dy);
    }
    return normalize(shifted);
  }

  return null;
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

export function repairEndpointApproachesWhenIssuesImprove(
  layout: LayoutData,
  options: { spacing?: number } = {}
): { changed: number } {
  const validation = checkLayout(layout);
  const candidateIds = new Set(
    validation.issues
      .filter(
        (issue) =>
          issue.edgeId &&
          (issue.type === 'edge-port-direction-mismatch' ||
            issue.type === 'edge-intersects-obstacle' ||
            issue.type === 'edge-bend-near-endpoint' ||
            issue.type === 'edge-border-hugging')
      )
      .map((issue) => String(issue.edgeId))
  );
  if (candidateIds.size === 0) {
    return { changed: 0 };
  }

  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  const beforeTotalIssues = validation.issues.length;
  let changed = 0;
  for (const edge of layout.edges ?? []) {
    const edgeId = String(edge.id ?? '');
    if (!candidateIds.has(edgeId)) {
      continue;
    }
    const edgeIssues = validation.issues.filter((issue) => issue.edgeId === edgeId);
    const beforeEdgeIssues = edgeIssues.length;
    const candidatePoints = [
      candidateWithExteriorEndpointStubs(edge, nodesById, Math.max(10, options.spacing ?? 10)),
      ...edgeIssues.map((issue) =>
        candidateWithShiftedBorderHug(
          edge,
          issue,
          nodesById,
          Math.max(20, (options.spacing ?? 10) * 2)
        )
      ),
    ].filter(
      (candidate): candidate is Point[] => Array.isArray(candidate) && candidate.length >= 2
    );

    let bestCandidate: Point[] | null = null;
    let bestEdgeIssues = beforeEdgeIssues;
    let bestTotalIssues = beforeTotalIssues;
    for (const candidate of candidatePoints) {
      const trial = cloneLayoutWithEdgePoints(layout, edgeId, candidate);
      const trialValidation = checkLayout(trial);
      const trialEdgeIssues = trialValidation.issues.filter(
        (issue) => issue.edgeId === edgeId
      ).length;
      if (trialEdgeIssues >= bestEdgeIssues || trialValidation.issues.length > beforeTotalIssues) {
        continue;
      }
      bestCandidate = candidate;
      bestEdgeIssues = trialEdgeIssues;
      bestTotalIssues = trialValidation.issues.length;
    }

    if (!bestCandidate || bestTotalIssues > beforeTotalIssues) {
      continue;
    }

    edge.points = copyPoints(bestCandidate);
    changed++;
  }

  return { changed };
}
