import type { Node } from '../../../types.js';

/**
 * Canonical edge-label dummy node helpers.
 * Edge-label nodes are an internal orthogonal-layout representation detail
 * where an edge label is represented as a dummy node with id prefix `edge-label-`.
 *
 * Keep these utilities orthogonal-scoped (do not share globally) to avoid
 * impacting other layout algorithms.
 */

export const EDGE_LABEL_NODE_PREFIX = 'edge-label-';

export function isEdgeLabelNodeId(id: string): boolean {
  return id.startsWith(EDGE_LABEL_NODE_PREFIX);
}

export function isEdgeLabelNode(node: Pick<Node, 'id'> | null | undefined): boolean {
  return typeof node?.id === 'string' && isEdgeLabelNodeId(node.id);
}
