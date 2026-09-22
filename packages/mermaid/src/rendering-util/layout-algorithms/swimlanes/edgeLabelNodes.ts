/**
 * Edge Label Nodes Transformation (label-as-waypoint variant)
 *
 * For each labelled edge, this transform creates an `edge-label-*` node that
 * participates in the Sugiyama layout (so the label text gets a deterministic
 * position in a lane). Unlike the older split-edge model, it leaves the
 * original labelled edge in place and stamps `labelNodeId` on it — the router
 * uses that stamp to thread the original edge's single polyline through the
 * label node's center.
 *
 * Two `isLayoutOnly` virtual edges (A→label, label→B) are appended to the
 * layout so that Sugiyama's layering and ordering honour the label's position
 * between source and target. They are never routed or rendered: the router and
 * renderer skip any edge flagged with `isLayoutOnly`.
 */

import type { LayoutData, Node, Edge, NonClusterNode } from '../../types.js';
import { log } from '../../../logger.js';

const EDGE_LABEL_LOG_PREFIX = '[EdgeLabelNodes]';

/**
 * Transforms edges with labels into label nodes + layout-only virtual edges.
 *
 * For each edge with a label:
 * 1. Creates a label node with the label text.
 * 2. Assigns the label node to the source or target lane (cross-lane edges
 *    prefer the target lane for tighter routing).
 * 3. Stamps `labelNodeId` on the original edge.
 * 4. Appends two `isLayoutOnly: true` virtual edges (A→label, label→B) so
 *    Sugiyama places the label between source and target. The router skips
 *    these; only the original edge is routed (threading through the label
 *    node's center).
 *
 * @param data - The layout data to transform
 * @returns The transformed layout data with label nodes and virtual edges
 */
export function createEdgeLabelNodes(data: LayoutData): LayoutData {
  const nodesToAdd: NonClusterNode[] = [];
  const layoutOnlyEdges: Edge[] = [];

  const nodeById = new Map<string, Node>();
  for (const node of data.nodes) {
    nodeById.set(node.id, node);
  }

  for (const edge of data.edges) {
    if (!edge.label || edge.label.length === 0) {
      continue;
    }
    if ((edge as Edge & { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    // Guard against double-processing if the caller invokes us twice.
    if ((edge as Edge & { labelNodeId?: string }).labelNodeId) {
      continue;
    }

    const sourceNode = edge.start ? nodeById.get(edge.start) : undefined;
    const targetNode = edge.end ? nodeById.get(edge.end) : undefined;

    if (!sourceNode || !targetNode) {
      log.warn(EDGE_LABEL_LOG_PREFIX, `Edge ${edge.id} has missing source or target node`);
      continue;
    }

    const labelNodeId = `edge-label-${edge.start}-${edge.end}-${edge.id}`;

    // For cross-lane edges, assign to the target lane for better routing:
    // it keeps the label closer to where the edge is heading and avoids long
    // detours back to the source lane.
    const isCrossLane = sourceNode.parentId !== targetNode.parentId;
    const labelLane = isCrossLane ? targetNode.parentId : sourceNode.parentId;

    const labelNode: NonClusterNode = {
      id: labelNodeId,
      label: edge.label,
      edgeStart: edge.start ?? '',
      edgeEnd: edge.end ?? '',
      shape: 'labelRect',
      width: 0, // populated when rendered / applied from fixture
      height: 0,
      isEdgeLabel: true,
      isDummy: true,
      parentId: labelLane,
      isGroup: false,
      labelStyle: Array.isArray(edge.labelStyle) ? edge.labelStyle[0] : (edge.labelStyle ?? ''),
      ...(sourceNode.dir ? { dir: sourceNode.dir } : {}),
    };

    nodesToAdd.push(labelNode);

    // Stamp the original edge so the router can decompose routing through the
    // label's center when producing a single polyline.
    (edge as Edge & { labelNodeId?: string }).labelNodeId = labelNodeId;

    // Ownership of the label text moves to the label node. Clear the label
    // off the original edge so the edge renderer does not draw it a second
    // time alongside the label node's own text.
    edge.label = undefined;
    (edge as Edge & { text?: unknown }).text = undefined;

    // Layout-only virtual edges: Sugiyama uses these to place the label node
    // between source and target. They are not routed or rendered — consumers
    // must skip any edge with `isLayoutOnly: true`.
    const toLabelVirtual: Edge = {
      id: `${edge.id}-to-label`,
      start: edge.start,
      end: labelNodeId,
      type: 'normal',
      isLayoutOnly: true,
    } as unknown as Edge;
    const fromLabelVirtual: Edge = {
      id: `${edge.id}-from-label`,
      start: labelNodeId,
      end: edge.end,
      type: 'normal',
      isLayoutOnly: true,
    } as unknown as Edge;

    layoutOnlyEdges.push(toLabelVirtual, fromLabelVirtual);
  }

  const newNodes = [...data.nodes, ...nodesToAdd];
  const newEdges = [...data.edges, ...layoutOnlyEdges];

  return {
    ...data,
    nodes: newNodes,
    edges: newEdges,
  };
}
