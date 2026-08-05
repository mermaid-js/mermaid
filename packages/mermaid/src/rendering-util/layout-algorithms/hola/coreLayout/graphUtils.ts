import type { LayoutData, Node, Edge } from '../../../types.js';
import { DISCONNECTED_NODE_SPACING, MINIMUM_EDGE_LENGTH } from '../Constants.js';

/**
 * Calculate uniform edge length based on maximum node dimension.
 *
 * @param nodes - Array of nodes to calculate edge length for
 * @returns The uniform edge length that prevents node overlapping
 */
export function calculateUniformEdgeLength(nodes: Node[]): number {
  if (nodes.length === 0) {
    return MINIMUM_EDGE_LENGTH;
  }

  let multiplier = 1;

  if (nodes.length > 20) {
    multiplier = 1.2;
  }

  let maxDimension = 0;
  nodes.forEach((node) => {
    const w = node.width ?? 0;
    const h = node.height ?? 0;
    const largerDimension = Math.max(w, h);
    maxDimension = Math.max(maxDimension, largerDimension * multiplier);
  });

  const minEdgeLength = MINIMUM_EDGE_LENGTH;
  return Math.max(minEdgeLength, maxDimension);
}

/**
 * Calculate base edge length considering node dimensions and graph connectivity.
 * Adjusts edge length based on node degree and density to optimize layout spacing.
 * @param nodes - Array of nodes in the graph
 * @param edges - Array of edges or edge-like objects with start and end properties
 * @returns The calculated base edge length optimized for the graph's characteristics
 */
export function calculateBaseEdgeLength(
  nodes: Node[],
  edges: Edge[] | { start: string; end: string }[]
): number {
  if (nodes.length === 0) {
    return 60;
  }

  const degreeMap = new Map<string, number>();
  nodes.forEach((node) => degreeMap.set(node.id, 0));

  edges.forEach((edge) => {
    if (edge.start && degreeMap.has(edge.start)) {
      degreeMap.set(edge.start, (degreeMap.get(edge.start) ?? 0) + 1);
    }
    if (edge.end && degreeMap.has(edge.end)) {
      degreeMap.set(edge.end, (degreeMap.get(edge.end) ?? 0) + 1);
    }
  });

  let maxDim = 0;

  nodes.forEach((n) => {
    maxDim = Math.max(maxDim, Math.max(n.width ?? 0, n.height ?? 0));
  });

  const densityFactor = 1.0;

  maxDim = maxDim + maxDim * 0.1;

  const baseEdgeLength = Math.max(60, maxDim * densityFactor);
  return baseEdgeLength;
}

/**
 * Find connected components in a graph using depth-first search (DFS).
 * Separates the graph into disconnected subgraphs for independent processing.
 * @param data - The layout data containing nodes and edges to analyze
 * @returns Array of LayoutData objects, each representing a connected component
 */
export function findConnectedComponents(data: LayoutData): LayoutData[] {
  const visited = new Set<string>();
  const components: LayoutData[] = [];
  const adjacencyList = new Map<string, string[]>();

  data.nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
  });

  data.edges?.forEach((edge) => {
    if (edge.start && edge.end) {
      adjacencyList.get(edge.start)?.push(edge.end);
      adjacencyList.get(edge.end)?.push(edge.start);
    }
  });

  /**
   * Depth-first search to traverse connected nodes and build component.
   * @param nodeId - ID of the current node to visit
   * @param component - Set to collect all nodes in this connected component
   */
  function dfs(nodeId: string, component: Set<string>): void {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    component.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) ?? [];
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        dfs(neighborId, component);
      }
    });
  }

  data.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const component = new Set<string>();
      dfs(node.id, component);

      const componentNodes = data.nodes.filter((n) => component.has(n.id));
      const componentEdges =
        data.edges?.filter(
          (e) => e.start && e.end && component.has(e.start) && component.has(e.end)
        ) || [];

      components.push({
        ...data,
        nodes: componentNodes,
        edges: componentEdges,
      });
    }
  });

  return components;
}

/**
 * Layout disconnected components with proper spacing between them.
 * Processes each component independently and arranges them horizontally with spacing.
 * @param data - Original layout data structure to preserve metadata
 * @param components - Array of disconnected components to layout
 * @param layoutCoreGraph - Function to layout individual components
 * @returns Combined LayoutData with all components positioned with proper spacing
 */
export function layoutDisconnectedComponents(
  data: LayoutData,
  components: LayoutData[],
  layoutCoreGraph: (data: LayoutData) => LayoutData
): LayoutData {
  let offsetX = 0;
  const spacing = DISCONNECTED_NODE_SPACING;

  const allNodes: Node[] = [];
  const allEdges: Edge[] = [];

  components.forEach((component) => {
    const processedComponent = layoutCoreGraph(component);

    const offsetNodes = processedComponent.nodes.map((node) => ({
      ...node,
      x: (node.x ?? 0) + offsetX,
      y: node.y ?? 0,
    }));

    allNodes.push(...offsetNodes);
    allEdges.push(...(processedComponent.edges ?? []));

    const maxX = Math.max(...offsetNodes.map((n) => n.x ?? 0));
    offsetX = maxX + spacing;
  });

  return {
    ...data,
    nodes: allNodes,
    edges: allEdges,
  };
}
