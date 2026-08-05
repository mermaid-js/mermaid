import type { LayoutData, Node, Edge } from '../../types.js';

/**
 * Orders nodes within each layer using the barycenter heuristic.
 * Mutates the nodes in coreData to set their .order property.
 */
export function orderNodesInLayers(coreData: LayoutData, rankMap: Map<string, number>) {
  // Step 1: Group nodes by their layer
  const layers: Record<number, Node[]> = {};
  coreData.nodes.forEach((node) => {
    const layer = rankMap.get(node.id) ?? node.layer ?? 0;
    if (!layers[layer]) {
      layers[layer] = [];
    }
    layers[layer].push(node);
  });

  // Step 2: Sort nodes in each layer by barycenter
  for (const layerStr in layers) {
    const nodesInLayer = layers[layerStr];
    nodesInLayer.sort((a, b) => {
      const baryA = calculateBarycenter(a, coreData.nodes, coreData.edges);
      const baryB = calculateBarycenter(b, coreData.nodes, coreData.edges);
      return baryA - baryB;
    });
    nodesInLayer.forEach((node, i) => {
      node.order = i;
    });
  }
}

/**
 * Calculates the barycenter of a node based on its neighbors' order.
 */
function calculateBarycenter(node: Node, nodes: Node[], edges: Edge[]): number {
  const nodeId = node.id;
  // Find neighbors (in and out edges)
  const inNeighbors = edges.filter((e) => e.end === nodeId).map((e) => e.start!);
  const outNeighbors = edges.filter((e) => e.start === nodeId).map((e) => e.end!);
  const neighborIds = [...inNeighbors, ...outNeighbors];

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const total = neighborIds.reduce((sum, neighborId) => {
    const neighbor = nodeMap[neighborId];
    return sum + (neighbor?.order ?? 0);
  }, 0);

  return neighborIds.length > 0 ? total / neighborIds.length : 0;
}
