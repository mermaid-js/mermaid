import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';

/**
 * Inject DOMUS-style edge-label dummy nodes (the split-edge label topology used by the
 * DOMUS backend). DDLT uses this so the graph matches the browser without a DOM pass.
 */
export function injectDomusEdgeLabelNodes(data: LayoutData): void {
  const hasLabelNodes = (data.nodes ?? []).some((n: Node) =>
    String(n?.id ?? '').startsWith('edge-label-')
  );
  const hasLabelEdges = (data.edges ?? []).some((e: Edge) => Boolean(e?.isLabelEdge));
  if (hasLabelNodes || hasLabelEdges) {
    return;
  }

  const nodesById = new Map<string, Node>();
  for (const n of data.nodes ?? []) {
    nodesById.set(String(n?.id ?? ''), n);
  }

  const newNodes: NonClusterNode[] = [];
  const newEdges: Edge[] = [];
  for (const edge of [...(data.edges ?? [])]) {
    if (edge?.label && String(edge.label).length > 0) {
      const startId = String(edge.start ?? '');
      const endId = String(edge.end ?? '');
      const startNode = nodesById.get(startId);
      const labelNodeId = `edge-label-${startId}-${endId}-${String(edge.id ?? '')}`;

      newNodes.push({
        id: labelNodeId,
        label: edge.label,
        edgeStart: startId,
        edgeEnd: endId,
        shape: 'labelRect',
        width: 0,
        height: 0,
        isEdgeLabel: true,
        isDummy: true,
        parentId: undefined,
        isGroup: false,
        layer: 0,
        order: 0,
        labelStyle: edge?.labelStyle?.[0] ?? '',
        ...(startNode?.dir ? { dir: startNode.dir } : {}),
      } as NonClusterNode);

      newEdges.push(
        {
          ...edge,
          id: `${String(edge.id ?? '')}-to-label`,
          end: labelNodeId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeEnd: 'none',
          arrowTypeStart: 'none',
        },
        {
          ...edge,
          id: `${String(edge.id ?? '')}-from-label`,
          start: labelNodeId,
          end: endId,
          label: undefined,
          isLabelEdge: true,
          arrowTypeStart: 'none',
          arrowTypeEnd: 'arrow_point',
        }
      );
    } else {
      newEdges.push(edge);
    }
  }

  for (const n of newNodes) {
    if (!nodesById.has(String(n.id))) {
      data.nodes.push(n);
      nodesById.set(String(n.id), n);
    }
  }
  data.edges = newEdges;
}
