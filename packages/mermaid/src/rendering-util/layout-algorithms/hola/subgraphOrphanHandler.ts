import type { LayoutData, Edge, NonClusterNode } from '../../types.js';

/**
 *
 * @param data4Layout - The layout data to process (mutated in place)
 */
export function connectOrphanNodesInSubgraphs(data4Layout: LayoutData): void {
  const subgraphs = data4Layout.nodes.filter((node) => node.isGroup === true);

  if (subgraphs.length === 0) {
    return;
  }

  const nodeConnections = new Map<string, Set<string>>();

  data4Layout.edges.forEach((edge) => {
    if (!edge.start || !edge.end) {
      return;
    }

    if (edge.start === edge.end) {
      return;
    }

    if (!nodeConnections.has(edge.start)) {
      nodeConnections.set(edge.start, new Set());
    }
    if (!nodeConnections.has(edge.end)) {
      nodeConnections.set(edge.end, new Set());
    }

    nodeConnections.get(edge.start)!.add(edge.end);
    nodeConnections.get(edge.end)!.add(edge.start);
  });

  subgraphs.forEach((subgraph) => {
    const children = data4Layout.nodes.filter((node) => node.parentId === subgraph.id);

    if (children.length === 0) {
      return;
    }

    const orphans = children.filter((child) => {
      const connections = nodeConnections.get(child.id);
      return !connections || connections.size === 0;
    });

    if (orphans.length === 0) {
      return;
    }

    if (orphans.length === 1) {
      const orphan = orphans[0];
      const dummyNode = createDummyNode(subgraph.id, orphan.id);
      const dummyEdge = createOrphanEdge(orphan.id, dummyNode.id, subgraph.id);

      data4Layout.nodes.push(dummyNode);
      data4Layout.edges.push(dummyEdge);
    } else {
      for (let i = 0; i < orphans.length - 1; i++) {
        const currentOrphan = orphans[i];
        const nextOrphan = orphans[i + 1];
        const chainEdge = createOrphanEdge(currentOrphan.id, nextOrphan.id, subgraph.id);

        data4Layout.edges.push(chainEdge);
      }
    }
  });
}

/**
 * Removes all dummy nodes and edges created by connectOrphanNodesInSubgraphs.
 *
 * Should be called after layout computation is complete but before
 * final rendering/group layout operations.
 *
 * @param data4Layout - The layout data to clean (mutated in place)
 */
export function cleanupOrphanConnections(data4Layout: LayoutData): void {
  const initialNodeCount = data4Layout.nodes.length;
  const initialEdgeCount = data4Layout.edges.length;

  data4Layout.nodes = data4Layout.nodes.filter((node) => {
    return !(node.isDummy === true && node.cssClasses?.includes('orphan-handler-dummy-node'));
  });

  data4Layout.edges = data4Layout.edges.filter((edge) => {
    return !edge.classes?.includes('orphan-handler-edge');
  });

  const removedNodes = initialNodeCount - data4Layout.nodes.length;
  const removedEdges = initialEdgeCount - data4Layout.edges.length;

  if (removedNodes > 0 || removedEdges > 0) {
    //
  }
}

/**
 * Creates a minimal dummy node to connect a single orphan.
 *
 * @param subgraphId - The ID of the parent subgraph
 * @param orphanId - The ID of the orphan node
 * @returns A dummy node with minimal properties
 */
function createDummyNode(subgraphId: string, orphanId: string): NonClusterNode {
  return {
    id: `orphan-dummy-${subgraphId}-${orphanId}`,
    isGroup: false,
    isDummy: true,
    parentId: subgraphId,
    width: 1,
    height: 1,
    shape: 'circle',
    cssClasses: 'orphan-handler-dummy-node',
    label: '',
    labelStyle: '',
    style: '',
    classes: '',
    padding: 0,
    domId: '',
    link: '',
    linkTarget: '',
    tooltip: '',
    cssStyles: [],
    cssCompiledStyles: [],
    haveCallback: false,
    look: 'classic',
  } as NonClusterNode;
}

/**
 * Creates an invisible edge to connect orphan nodes.
 *
 * @param startId - The ID of the start node (always the orphan)
 * @param endId - The ID of the end node
 * @param subgraphId - The ID of the parent subgraph (for unique ID generation)
 * @returns An edge with properties matching the existing pattern
 */
function createOrphanEdge(startId: string, endId: string, subgraphId: string): Edge {
  return {
    id: `orphan-connection-${subgraphId}-${startId}-${endId}`,
    start: startId,
    end: endId,
    type: 'none',
    classes: 'orphan-handler-edge',
    thickness: 'invisible',
    arrowTypeStart: 'none',
    arrowTypeEnd: 'none',
    cssCompiledStyles: [],
    labelStyle: [],
    style: [],
    pattern: 'normal',
    look: 'neo',
    curve: 'linear',
  };
}
