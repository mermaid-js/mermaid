import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { LayoutData, Edge } from '../../types.js';

/**
 * Detects cycles in a directed graph using DFS with color marking
 * Returns a set of back edges that form cycles
 *
 * Note: Self-loop edges (A -- A) are NOT considered cycle edges and will be ignored
 *
 * @param data4Layout - The layout data containing nodes and edges
 * @returns Array of edges that participate in cycles (back edges), excluding self-loops
 */
export function detectCycleEdges(data4Layout: LayoutData): Edge[] {
  const graph = new graphlib.Graph({ directed: true, multigraph: false });

  data4Layout.nodes.forEach((node) => {
    graph.setNode(node.id, node);
  });

  data4Layout.edges.forEach((edge) => {
    if (edge.start && edge.end) {
      graph.setEdge(edge.start, edge.end, edge);
    }
  });

  const cycleEdges: Edge[] = [];
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  const parent = new Map<string, string | null>();
  const dfsStack: string[] = [];

  graph.nodes().forEach((nodeId) => {
    color.set(nodeId, 'white');
    parent.set(nodeId, null);
  });

  /**
   * DFS visit function that detects back edges (cycle edges)
   */
  function dfsVisit(nodeId: string): void {
    color.set(nodeId, 'gray'); // Mark as being processed
    dfsStack.push(nodeId);

    const outEdges = graph.outEdges(nodeId, undefined) ?? [];

    outEdges.forEach((edgeObj) => {
      const neighbor = edgeObj.w;
      const neighborColor = color.get(neighbor);

      if (nodeId === neighbor) {
        return;
      }

      if (neighborColor === 'gray') {
        const cycleStartIndex = dfsStack.indexOf(neighbor);
        const cycleLength = dfsStack.length - cycleStartIndex;

        if (cycleLength >= 3) {
          const edgeData = graph.edge(edgeObj.v, edgeObj.w, undefined) ?? {};
          cycleEdges.push({
            ...edgeData,
          });
        }
      } else if (neighborColor === 'white') {
        parent.set(neighbor, nodeId);
        dfsVisit(neighbor);
      }
    });

    dfsStack.pop();
    color.set(nodeId, 'black');
  }

  graph.nodes().forEach((nodeId) => {
    if (color.get(nodeId) === 'white') {
      dfsVisit(nodeId);
    }
  });

  return cycleEdges;
}

/**
 * Removes cycle edges from the layout data and returns them for later restoration
 *
 * @param data4Layout - The layout data to modify
 * @returns Array of removed cycle edges
 */
export function removeCycleEdges(data4Layout: LayoutData): Edge[] {
  const cycleEdges = detectCycleEdges(data4Layout);

  if (cycleEdges.length > 0) {
    // const cycleEdgeSet = new Set(cycleEdges.map(({ start, end }) => `${start}->${end}`));

    data4Layout.edges = data4Layout.edges.filter((edge) => {
      return !cycleEdges.some((cycleEdge) => cycleEdge.id === edge.id);
    });
  }

  return cycleEdges;
}

/**
 * Restores cycle edges to the layout data
 *
 * @param data4Layout - The layout data to modify
 * @param cycleEdges - The cycle edges to restore
 */
export function restoreCycleEdges(data4Layout: LayoutData, cycleEdges: Edge[]): void {
  if (cycleEdges.length > 0) {
    data4Layout.edges = [...data4Layout.edges, ...cycleEdges];
  }
}
