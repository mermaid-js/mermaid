import type { Graph, Layering, Node, NodeId, EdgeRef } from './helpers.js';
import { normalizeGraph } from './phase0.helpers.js';

export function makeProperLayering(
  layering: Layering,
  gAcyclic: Graph
): { layering: Layering; graphWithDummies: Graph } {
  const g = normalizeGraph(gAcyclic);
  const { rankOf } = layering;
  const layers = layering.layers.map((l) => [...l]);
  const dummy = new Set<NodeId>(layering.dummy ? [...layering.dummy] : []);

  // Helper to create a dummy node at layer L
  let dummySeq = 0;
  const nodeById = new Map(g.nodeById);
  const addDummyAt = (L: number): NodeId => {
    const id: NodeId = `placeholder-${dummySeq++}`;
    const dn: Node = { id, isGroup: false, isDummy: true, width: 0, height: 0 } as any;
    nodeById.set(id, dn);
    dummy.add(id);
    // Ensure layers[L] exists
    while (layers.length <= L) {
      layers.push([]);
    }
    layers[L].push(id);
    (rankOf as any)[id] = L;
    return id;
  };

  // Sort edges deterministically to stabilize dummy creation order
  const edgesSorted = [...g.edges].sort((a, b) =>
    a.id === b.id
      ? a.src === b.src
        ? a.dst.localeCompare(b.dst)
        : a.src.localeCompare(b.src)
      : a.id.localeCompare(b.id)
  );

  const newEdges: EdgeRef[] = [];
  for (const e of edgesSorted) {
    const rU = rankOf[e.src] ?? 0;
    const rV = rankOf[e.dst] ?? 0;
    if (rV - rU <= 1) {
      newEdges.push(e);
      continue;
    }
    // Need to insert dummies on intermediate layers rU+1..rV-1
    let prev = e.src;
    for (let L = rU + 1, k = 0; L < rV; L++, k++) {
      const d = addDummyAt(L);
      // chain prev -> d
      newEdges.push({ id: `${e.id}#${k}`, src: prev, dst: d, weight: e.weight, ref: e.ref });
      prev = d;
    }
    // last dummy (or src if no dummies) -> dst
    const lastIndex = rV - rU - 2; // -2 because we added k from 0..(rV-rU-2)
    newEdges.push({
      id: `${e.id}#${Math.max(lastIndex + 1, 0)}`,
      src: prev,
      dst: e.dst,
      weight: e.weight,
      ref: e.ref,
    });
  }

  // Build new nodes list (preserve original order, then dummies by creation order)
  const nodes = [...g.nodes, ...[...dummy].filter((id) => !g.nodes.includes(id))];
  const graphWithDummies: Graph = { nodes, edges: newEdges, layout: g.layout, nodeById };

  return { layering: { layers, rankOf, dummy }, graphWithDummies };
}
