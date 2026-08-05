import type { Edge, LayoutData, Node, NonClusterNode } from '../../types.js';

/**
 * Walk up the parent chain of `nodeId`, collecting every ancestor group id.
 */
function buildAncestorSet(nodeById: Map<string, Node>, nodeId?: string): Set<string> {
  const ancestors = new Set<string>();
  if (!nodeId) {
    return ancestors;
  }

  let currentId: string | undefined = nodeId;
  const visited = new Set<string>();

  while (currentId) {
    const parentId: string | undefined = nodeById.get(currentId)?.parentId;
    if (!parentId || visited.has(parentId)) {
      break;
    }
    ancestors.add(parentId);
    visited.add(parentId);
    currentId = parentId;
  }

  return ancestors;
}

/**
 * Lowest group that contains both endpoints, or `undefined` when the edge
 * crosses out of every shared group. The label dummy is parented there so it
 * lands inside the same frame the edge is drawn in.
 */
function findCommonParentId(
  nodeById: Map<string, Node>,
  nodeId1?: string,
  nodeId2?: string
): string | undefined {
  if (!nodeId1 || !nodeId2) {
    return undefined;
  }

  const ancestorsOfFirst = buildAncestorSet(nodeById, nodeId1);
  if (ancestorsOfFirst.size === 0) {
    return undefined;
  }

  let currentId: string | undefined = nodeId2;
  const visited = new Set<string>();

  while (currentId) {
    const parentId: string | undefined = nodeById.get(currentId)?.parentId;
    if (!parentId || visited.has(parentId)) {
      break;
    }
    if (ancestorsOfFirst.has(parentId)) {
      return parentId;
    }
    visited.add(parentId);
    currentId = parentId;
  }

  return undefined;
}

/**
 * Replace every labelled edge with a `start → label → end` chain around a dummy
 * `labelRect` node carrying the label text.
 *
 * HOLA reserves space for labels by treating them as ordinary nodes: the dummy
 * is measured with the rest of the graph (`createGraphWithElements` calls
 * `getBBox` on it), placed by the layout, and painted as a node. Running this
 * BEFORE measurement is what makes the label's real text dimensions available
 * to placement and routing.
 */
export function injectHolaEdgeLabelNodes(data: LayoutData): void {
  const alreadyInjected =
    (data.nodes ?? []).some((node) => node?.isLabelNode) ||
    (data.edges ?? []).some((edge) => edge?.isLabelEdge);
  if (alreadyInjected) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const node of data.nodes ?? []) {
    nodeById.set(node.id, node);
  }

  const nextEdges: Edge[] = [];
  for (const edge of [...(data.edges ?? [])]) {
    if (!edge.label || edge.label.length === 0 || !edge.start || !edge.end) {
      nextEdges.push(edge);
      continue;
    }

    const startNode = nodeById.get(edge.start);
    const labelNodeId = `edge-label-${edge.start}-${edge.end}-${edge.id}`;
    const labelNode: NonClusterNode = {
      id: labelNodeId,
      label: edge.label,
      edgeStart: edge.start,
      edgeEnd: edge.end,
      shape: 'labelRect',
      width: 0,
      height: 0,
      isEdgeLabel: false,
      isLabelNode: true,
      isGroup: false,
      parentId: findCommonParentId(nodeById, edge.start, edge.end),
      labelStyle: edge.labelStyle?.[0] ?? '',
      ...(startNode?.dir ? { dir: startNode.dir } : {}),
    };

    data.nodes.push(labelNode);
    nodeById.set(labelNodeId, labelNode);

    nextEdges.push(
      {
        ...edge,
        id: `${edge.id}-to-label`,
        end: labelNodeId,
        label: undefined,
        isLabelEdge: true,
        arrowTypeEnd: 'none',
        arrowTypeStart: 'none',
      },
      {
        ...edge,
        id: `${edge.id}-from-label`,
        start: labelNodeId,
        end: edge.end,
        label: undefined,
        isLabelEdge: true,
        arrowTypeStart: 'none',
      }
    );
  }

  data.edges = nextEdges;
}
