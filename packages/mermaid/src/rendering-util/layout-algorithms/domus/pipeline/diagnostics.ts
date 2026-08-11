import type { Node } from '../../../types.js';
import type { Point } from '../types.js';
import { approxEqual } from '../core/helpers.js';
import { isEdgeLabelNodeId } from '../core/labels.js';

export function nodeSummary(n: Node | undefined) {
  if (!n) {
    return null;
  }
  return {
    id: String(n.id ?? ''),
    isGroup: Boolean((n as any).isGroup),
    parentId: (n as any).parentId != null ? String((n as any).parentId) : undefined,
    x: (n as any).x ?? 0,
    y: (n as any).y ?? 0,
    width: (n as any).width ?? 0,
    height: (n as any).height ?? 0,
    label: (n as any).label ?? undefined,
  };
}

export function isSubgraphRelevantEdge(startNode: Node, endNode: Node): boolean {
  // Heuristic: edges are "subgraph relevant" if either endpoint is a group,
  // or if either endpoint belongs to a group (parentId set).
  // Also treat edge-label helper nodes as relevant since most compound/cluster
  // routing bugs show up on the label split-edges.
  return Boolean(
    isEdgeLabelNodeId(String((startNode as any).id ?? '')) ||
      isEdgeLabelNodeId(String((endNode as any).id ?? '')) ||
      (startNode as any).isGroup ||
      (endNode as any).isGroup ||
      (startNode as any).parentId != null ||
      (endNode as any).parentId != null
  );
}

export function polylineIsOrthogonal(points: Point[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!approxEqual(a.x, b.x) && !approxEqual(a.y, b.y)) {
      return false;
    }
  }
  return true;
}
