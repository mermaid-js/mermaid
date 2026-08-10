/**
 * Mermaid → HOLA adapter (guide §3 and §9.1).
 *
 * Three normative rules are enforced here, and nowhere else needs to know
 * about them again:
 *
 *   §3.2  subgraph containers never enter the layout graph. Ordinary
 *         descendants — at any nesting depth — are flattened to the top level
 *         and lose their group ownership. An edge that names a container is
 *         reported as unsupported and omitted rather than redirected.
 *   §3.3  edge labels stay annotations on the edge. No label node is created,
 *         so no degree, no peeling decision and no face is affected.
 *   §3.4  the topology is a simple undirected graph: parallel edges collapse to
 *         one adjacency with a bundle of original ids, and self-loops are held
 *         aside for final routing only.
 */

import type { Edge, LayoutData, Node } from '../../../types.js';
import type { DeferredEdge, HolaGraph } from '../model.js';
import { addEdge, addNode, createGraph } from '../model.js';
import { topologicalEdgeId } from '../ids.js';
import type { DiagnosticCollector } from '../diagnostics.js';

export interface EdgeLabelInfo {
  originalEdgeId: string;
  label: string;
  width: number;
  height: number;
}

export interface FlattenResult {
  graph: HolaGraph;
  /** Original Mermaid nodes by id, for write-back. */
  originalNodes: Map<string, Node>;
  /** Original Mermaid edges by id, for write-back. */
  originalEdges: Map<string, Edge>;
  /** Self-loops, excluded from topology but routed at the end. */
  selfLoops: DeferredEdge[];
  /** Labels carried on edges rather than turned into nodes. */
  labels: Map<string, EdgeLabelInfo>;
  /** Edges dropped because an endpoint is a subgraph container. */
  unsupported: string[];
}

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 40;

export function flattenFlowchart(
  data: LayoutData,
  diagnostics: DiagnosticCollector
): FlattenResult {
  const groupIds = new Set((data.nodes ?? []).filter((n) => n.isGroup === true).map((n) => n.id));

  const graph = createGraph();
  const originalNodes = new Map<string, Node>();
  const originalEdges = new Map<string, Edge>();
  const selfLoops: DeferredEdge[] = [];
  const labels = new Map<string, EdgeLabelInfo>();
  const unsupported: string[] = [];

  let inputOrder = 0;
  for (const node of data.nodes ?? []) {
    if (groupIds.has(node.id)) {
      continue;
    }
    // A label node injected by another layout would corrupt the topology.
    if (node.isLabelNode === true || node.isEdgeLabel === true) {
      continue;
    }
    originalNodes.set(node.id, node);
    addNode(graph, {
      id: node.id,
      x: 0,
      y: 0,
      width: node.width ?? DEFAULT_WIDTH,
      height: node.height ?? DEFAULT_HEIGHT,
      inputOrder: inputOrder++,
      original: node,
    });
  }

  for (const edge of data.edges ?? []) {
    const source = edge.start;
    const target = edge.end;
    if (!source || !target) {
      continue;
    }
    originalEdges.set(edge.id, edge);

    if (edge.label) {
      labels.set(edge.id, {
        originalEdgeId: edge.id,
        label: edge.label,
        width: edge.width ?? 0,
        height: edge.height ?? 0,
      });
    }

    if (groupIds.has(source) || groupIds.has(target)) {
      unsupported.push(edge.id);
      diagnostics.report({
        code: 'HOLA_SUBGRAPH_ENDPOINT_UNSUPPORTED',
        stage: 'flatten',
        edgeIds: [edge.id],
        nodeIds: [source, target].filter((id) => groupIds.has(id)),
        message:
          'An edge endpoint is a subgraph container. Containers are not rendered in this ' +
          'version, so the edge is omitted rather than redirected to an arbitrary child.',
      });
      continue;
    }

    if (!graph.nodes.has(source) || !graph.nodes.has(target)) {
      continue;
    }

    if (source === target) {
      selfLoops.push({ originalEdgeId: edge.id, source, target });
      continue;
    }

    const id = topologicalEdgeId(source, target);
    const existing = graph.edges.get(id);
    if (existing) {
      existing.originalEdgeIds.push(edge.id);
      continue;
    }
    addEdge(graph, {
      id,
      source,
      target,
      originalEdgeIds: [edge.id],
      route: [],
      mandatoryWaypoints: [],
    });
  }

  return { graph, originalNodes, originalEdges, selfLoops, labels, unsupported };
}
