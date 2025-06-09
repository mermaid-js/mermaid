import type { Edge, LayoutData, Node } from '../../types.js';

type LayerMap = Record<number, Node[]>;

function groupNodesByLayer(nodes: Node[]): LayerMap {
  const layers: LayerMap = {};
  nodes.forEach((node: Node) => {
    if (node.isGroup) {
      return;
    }

    const layer = node.layer ?? 0;
    if (!layers[layer]) {
      layers[layer] = [];
    }
    layers[layer].push(node);
  });
  return layers;
}

/**
 * Assign horizontal ordering to nodes, excluding group nodes from ordering.
 * Groups are assigned `order` after real nodes are sorted.
 */
export function assignNodeOrder(iterations: number, data4Layout: LayoutData): void {
  const nodes = data4Layout.nodes;
  const edges = data4Layout.edges;
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  const isLayered = nodes.some((n) => n.layer !== undefined);
  if (isLayered) {
    const layers = groupNodesByLayer(nodes);
    const sortedLayers = Object.keys(layers)
      .map(Number)
      .sort((a, b) => a - b);

    // Initial order
    for (const layer of sortedLayers) {
      layers[layer].forEach((node, index) => {
        node.order = index;
      });
    }

    // Barycenter iterations
    for (let i = 0; i < iterations; i++) {
      for (let l = 1; l < sortedLayers.length; l++) {
        sortLayerByBarycenter(layers[sortedLayers[l]], 'inbound', edges, nodeMap);
      }
      for (let l = sortedLayers.length - 2; l >= 0; l--) {
        sortLayerByBarycenter(layers[sortedLayers[l]], 'outbound', edges, nodeMap);
      }
    }

    // Assign order to group nodes at the end
    for (const node of nodes) {
      if (node.isGroup) {
        const childOrders = nodes
          .filter((n) => n.parentId === node.id)
          .map((n) => nodeMap.get(n.id)?.order)
          .filter((o): o is number => typeof o === 'number');

        node.order = childOrders.length
          ? childOrders.reduce((a, b) => a + b, 0) / childOrders.length
          : nodes.length;
      }
    }
  }
}

function sortLayerByBarycenter(
  layerNodes: Node[],
  direction: 'inbound' | 'outbound' | 'both',
  edges: Edge[],
  nodeMap: Map<string, Node>
): void {
  const edgeMap = new Map<string, Set<string>>();
  edges.forEach((e: Edge) => {
    if (e.start && e.end) {
      if (!edgeMap.has(e.start)) {
        edgeMap.set(e.start, new Set());
      }
      edgeMap.get(e.start)?.add(e.end);
    }
  });

  const baryCenters = layerNodes.map((node, originalIndex) => {
    const neighborOrders: number[] = [];

    edges.forEach((edge) => {
      if (direction === 'inbound' && edge.end === node.id) {
        const source = nodeMap.get(edge.start ?? '');
        if (source?.order !== undefined) {
          neighborOrders.push(source.order);
        }
      } else if (direction === 'outbound' && edge.start === node.id) {
        const target = nodeMap.get(edge.end ?? '');
        if (target?.order !== undefined) {
          neighborOrders.push(target.order);
        }
      } else if (direction === 'both' && (edge.start === node.id || edge.end === node.id)) {
        const neighborId = edge.start === node.id ? edge.end : edge.start;
        const neighbor = nodeMap.get(neighborId ?? '');
        if (neighbor?.order !== undefined) {
          neighborOrders.push(neighbor.order);
        }
      }
    });

    const barycenter =
      neighborOrders.length === 0
        ? Infinity // Push unconnected nodes to the end
        : neighborOrders.reduce((sum, o) => sum + o, 0) / neighborOrders.length;

    return { node, barycenter, originalIndex };
  });

  baryCenters.sort((a, b) => {
    if (a.barycenter !== b.barycenter) {
      return a.barycenter - b.barycenter;
    }

    // Stable tie-breaker based on original index
    return a.originalIndex - b.originalIndex;
  });

  baryCenters.forEach((entry, index) => {
    entry.node.order = index;
  });
}
