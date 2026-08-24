/**
 * The independent parts this layout draws.
 *
 * The decomposition itself already happened in `prepareLayout`: every peeled tree
 * was cut off its core and re-rooted on a duplicate of the core node. By the time
 * this runs the graph is therefore a set of unconnected pieces, and finding the
 * parts is just finding the connected components — `hola-faithful`'s own
 * `weaklyConnectedComponents`, the same split HOLA does before laying anything
 * out.
 *
 * Each part is made of nothing but real Mermaid nodes and edges, so a part can be
 * handed to grid-like as an ordinary little diagram and its coordinates land
 * straight on the drawing.
 */

import type { Edge, LayoutData, Node } from '../../types.js';
import { weaklyConnectedComponents } from '../hola-faithful/components/components.js';
import { isPureTree } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import type { FlattenResult } from '../hola-faithful/adapter/flattenFlowchart.js';
import type { HolaGraph } from '../hola-faithful/model.js';
import { rootCopyOf } from './rootCopy.js';

/**
 * Which piece of the decomposition a part is.
 *
 * `core` is what survived leaf peeling and therefore always contains a cycle;
 * `tree` is a peeled tree, recognisable by the duplicated root it was re-rooted
 * on; `pure-tree` is a component that had no cycle at all, so peeling left no
 * core and HOLA treats the whole component as one tree (guide §10.1).
 */
export type PartKind = 'core' | 'tree' | 'pure-tree';

export interface DecomposedPart {
  id: string;
  kind: PartKind;
  componentId: string;
  /** Nodes drawn in this part, in input order. Includes a tree's duplicated root. */
  nodeIds: string[];
  /** Edges drawn inside this part. */
  edgeIds: string[];
  /** Tree parts: the core node this part's duplicated root stands for. */
  rootCopyOf?: string;
  /**
   * Whether the part still contains a cycle. Every core does, which is what
   * decides how the part is laid out — see `layoutCore.ts`.
   */
  cyclic: boolean;
}

export function splitIntoParts(flat: FlattenResult): DecomposedPart[] {
  return weaklyConnectedComponents(flat.graph).map((component) => {
    const nodeIds = [...component.graph.nodes.keys()];
    const duplicatedRoot = nodeIds
      .map((id) => ({ id, copyOf: rootCopyOf(flat.originalNodes.get(id)) }))
      .find((entry) => entry.copyOf !== undefined);
    const cyclic = !isPureTree(component.graph);

    const kind: PartKind = duplicatedRoot ? 'tree' : cyclic ? 'core' : 'pure-tree';

    return {
      id: `${component.id}/${kind}`,
      kind,
      componentId: component.id,
      nodeIds,
      edgeIds: internalEdgeIds(component.graph, flat),
      rootCopyOf: duplicatedRoot?.copyOf,
      cyclic,
    };
  });
}

/**
 * The original Mermaid edges drawn inside one part: every edge of the part graph
 * expanded back into the bundle of parallel edges it collapsed (§3.4), plus the
 * self-loops of its nodes, which the adapter held aside.
 */
function internalEdgeIds(graph: HolaGraph, flat: FlattenResult): string[] {
  const ids: string[] = [];

  for (const edge of graph.edges.values()) {
    ids.push(...edge.originalEdgeIds);
  }

  for (const loop of flat.selfLoops) {
    if (graph.nodes.has(loop.source)) {
      ids.push(loop.originalEdgeId);
    }
  }

  return ids;
}

/**
 * The `LayoutData` for one part: the same diagram-level settings as the whole
 * drawing, but only this part's nodes and edges.
 *
 * The node and edge objects are the *originals*, not copies, so the grid-like run
 * writes its coordinates straight onto the diagram and the part is then moved into
 * place by a rigid translation.
 */
export function buildPartLayoutData(
  data: LayoutData,
  flat: FlattenResult,
  part: DecomposedPart
): LayoutData {
  const nodes: Node[] = [];
  for (const id of part.nodeIds) {
    const node = flat.originalNodes.get(id);
    if (node) {
      nodes.push(node);
    }
  }

  const edges: Edge[] = [];
  for (const id of part.edgeIds) {
    const edge = flat.originalEdges.get(id);
    if (edge) {
      edges.push(edge);
    }
  }

  return { ...data, nodes, edges } as LayoutData;
}
