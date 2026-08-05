import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import type { LayoutData, Node, Edge } from '../../types.js';

/**
 * Converts layout data to a graphlib Graph object for graph operations.
 * This function creates a directed or undirected graph representation suitable
 * for algorithms like topological decomposition and pathfinding.
 *
 * @param data4Layout - The layout data containing nodes and edges to convert
 * @param directed - Whether to create a directed graph (default: true)
 * @returns A new graphlib.Graph instance with nodes and edges from the layout data
 */
function toGraphlib(data4Layout: LayoutData, directed = true): graphlib.Graph {
  const g = new graphlib.Graph({ directed, multigraph: false });

  data4Layout.nodes.forEach((node) => {
    g.setNode(node.id, node);
  });

  data4Layout.edges.forEach((edge) => {
    g.setEdge(edge.start!, edge.end!, edge);
  });

  return g;
}

/**
 * Converts a graphlib Graph object back to layout data format.
 * This function extracts nodes and edges from the graph and reconstructs
 * the LayoutData structure with proper edge start/end assignments.
 *
 * @param g - The graphlib.Graph instance to convert
 * @param config - Configuration object to include in the returned layout data
 * @returns LayoutData object containing nodes, edges, and config
 */
function fromGraphlib(g: graphlib.Graph, config: LayoutData['config']): LayoutData {
  const nodes: Node[] = g.nodes().map((id) => g.node(id));
  const edges: Edge[] = g.edges().map((e) => {
    const edgeData = g.edge(e.v, e.w, e.name);
    return { ...edgeData, start: e.v, end: e.w };
  });
  return { nodes, edges, config };
}

/**
 * Calculate the degree of a node in an undirected graph representation.
 * This treats directed edges as undirected for degree calculation as per HOLA theory.
 * The degree is the number of unique neighbors a node has, regardless of edge direction.
 *
 * @param graph - The graphlib graph to analyze
 * @param nodeId - The ID of the node to calculate degree for
 * @returns The degree (number of unique neighbors) of the specified node
 */
function calculateNodeDegree(graph: graphlib.Graph, nodeId: string): number {
  const inEdges = graph.inEdges(nodeId, undefined) ?? [];
  const outEdges = graph.outEdges(nodeId, undefined) ?? [];

  const neighbors = new Set<string>();

  inEdges.forEach((edge) => neighbors.add(edge.v));
  outEdges.forEach((edge) => neighbors.add(edge.w));

  return neighbors.size;
}

/**
 * Check if a node is an edge label node that should not be considered as core.
 * Edge label nodes are auxiliary nodes created for edge labeling and should be
 * treated as leaves in the decomposition, even if they create cycles.
 *
 * @param graph - The graphlib graph containing the node
 * @param nodeId - The ID of the node to check
 * @returns True if the node is marked as an edge label node
 */
function isEdgeLabelNode(graph: graphlib.Graph, nodeId: string): boolean {
  const nodeData = graph.node(nodeId);
  return nodeData && nodeData.isEdgeLabel === true;
}

/**
 * Find all neighbors of a node in an undirected graph representation.
 * Collects all nodes that are connected to the specified node, treating
 * directed edges as bidirectional for neighbor discovery.
 *
 * @param graph - The graphlib graph to search
 * @param nodeId - The ID of the node to find neighbors for
 * @returns Array of node IDs that are neighbors to the specified node
 */
function getNeighbors(graph: graphlib.Graph, nodeId: string): string[] {
  const inEdges = graph.inEdges(nodeId, undefined) ?? [];
  const outEdges = graph.outEdges(nodeId, undefined) ?? [];

  const neighbors = new Set<string>();
  inEdges.forEach((edge) => neighbors.add(edge.v));
  outEdges.forEach((edge) => neighbors.add(edge.w));

  return [...neighbors];
}

/**
 * Performs a modified topological sort that handles cycles gracefully.
 * For acyclic portions, nodes are ordered topologically. For cycles,
 * nodes are ordered lexicographically within the cycle.
 * This ensures deterministic ordering regardless of input edge order.
 *
 * @param graph - The graph to sort
 * @param nodeIds - The set of node IDs to sort
 * @returns Sorted array of node IDs
 */
function topologicalSortWithCycles(graph: graphlib.Graph, nodeIds: string[]): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  const inDegree = new Map<string, number>();
  const nodeSet = new Set(nodeIds);

  nodeIds.forEach((nodeId) => {
    const inEdges = graph.inEdges(nodeId, undefined) ?? [];
    const relevantInEdges = inEdges.filter((edge) => nodeSet.has(edge.v));
    inDegree.set(nodeId, relevantInEdges.length);
  });

  const queue: string[] = nodeIds.filter((nodeId) => inDegree.get(nodeId) === 0).sort();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    result.push(current);

    const outEdges = graph.outEdges(current, undefined) ?? [];
    outEdges.forEach((edge) => {
      if (nodeSet.has(edge.w)) {
        const newInDegree = (inDegree.get(edge.w) ?? 0) - 1;
        inDegree.set(edge.w, newInDegree);
        if (newInDegree === 0 && !visited.has(edge.w)) {
          queue.push(edge.w);
          queue.sort();
        }
      }
    });
  }

  const remaining = nodeIds.filter((nodeId) => !visited.has(nodeId)).sort();
  result.push(...remaining);

  return result;
}

/**
 * Check if a degree-1 node is part of a 2-node cycle.
 * A node with degree 1 is part of a 2-node cycle if there are edges in both directions
 * between it and its single neighbor (e.g., a → b and b → a). Such nodes should not
 * be peeled as leaves since they participate in a cycle structure.
 *
 * @param graph - The graphlib graph to analyze
 * @param nodeId - The ID of the node to check for two-node cycle participation
 * @returns True if the node is part of a bidirectional edge with its single neighbor
 */
function isPartOfTwoNodeCycle(graph: graphlib.Graph, nodeId: string): boolean {
  const neighbors = getNeighbors(graph, nodeId);
  if (neighbors.length !== 1) {
    return false;
  }

  const neighbor = neighbors[0];
  const hasEdgeToNeighbor = graph.hasEdge(nodeId, neighbor, undefined);
  const hasEdgeFromNeighbor = graph.hasEdge(neighbor, nodeId, undefined);

  return hasEdgeToNeighbor && hasEdgeFromNeighbor;
}

/**
 * Check if an edge is an implicit parent-child edge.
 * Implicit parent-child edges are structural relationships created during
 * layout processing and should be excluded from the core graph construction
 * to avoid artificial cycles in the topological structure.
 *
 * @param edge - The edge to examine
 * @returns True if the edge has the implicit parent-child edge class marker
 */
function isImplicitParentChildEdge(edge: Edge): boolean {
  return edge.classes?.includes('implicit-parent-child-edge') ?? false;
}

/**
 * Check if a subgraph is a "true subgraph" - meaning it has no external edges to/from its children.
 * A true subgraph has:
 * - isGroup: true
 * - All edges involving its children are internal (both start and end are children of the same subgraph)
 * - No edges connect children directly to nodes outside the subgraph
 *
 * @param subgraphId - The ID of the subgraph node to check
 * @param originalGraph - The original graphlib graph
 * @param data4Layout - The original layout data
 * @returns true if the subgraph is a true subgraph
 */
function isTrueSubgraph(
  subgraphId: string,
  originalGraph: graphlib.Graph,
  data4Layout: LayoutData
): boolean {
  const subgraphNode = originalGraph.node(subgraphId);
  if (!subgraphNode?.isGroup) {
    return false;
  }

  const children = data4Layout.nodes.filter((node) => node.parentId === subgraphId);
  if (children.length === 0) {
    return false;
  }

  const childIds = new Set(children.map((child) => child.id));

  const edges = originalGraph.edges();
  for (const edgeObj of edges) {
    const { v: start, w: end } = edgeObj;
    const startIsChild = childIds.has(start);
    const endIsChild = childIds.has(end);

    if (startIsChild || endIsChild) {
      if (startIsChild && !endIsChild && end !== subgraphId) {
        return false;
      }
      if (endIsChild && !startIsChild && start !== subgraphId) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Performs topological decomposition on a graph using the HOLA algorithm.
 * Separates the graph into a core (remaining after peeling) and trees (peeled components).
 *
 * Edge label nodes (nodes with isEdgeLabel: true) are treated as leaves and excluded
 * from the core, even if they would otherwise create cycles. This prevents edge labels
 * from being considered as core structural components.
 *
 * @param data4Layout - The input graph data to decompose
 * @returns Object containing the core graph and map of trees
 */
export function topologicalDecomposition(data4Layout: LayoutData): {
  core: LayoutData;
  trees: Map<string, LayoutData>;
} {
  const workingData: LayoutData = {
    nodes: [...data4Layout.nodes],
    edges: [...data4Layout.edges],
    config: { ...data4Layout.config },
  };

  const originalGraph = toGraphlib(workingData, true);

  const workingGraph = toGraphlib(workingData, true);

  const L: string[] = [];
  const rho: Record<string, string> = {};
  const edgeDataMap: Record<string, Edge> = {};

  // STEP 1: ITERATIVE PEELING ALGORITHM
  // Repeatedly remove leaves (nodes of degree 1) until none remain
  while (true) {
    const leaves = workingGraph.nodes().filter((nodeId) => {
      if (calculateNodeDegree(workingGraph, nodeId) !== 1) {
        return false;
      }
      if (isPartOfTwoNodeCycle(workingGraph, nodeId)) {
        return false;
      }
      return true;
    });

    const edgeLabelNodes = workingGraph.nodes().filter((nodeId) => {
      return isEdgeLabelNode(workingGraph, nodeId) && calculateNodeDegree(workingGraph, nodeId) > 0;
    });

    const nodesToRemove = [...new Set([...leaves, ...edgeLabelNodes])];

    if (nodesToRemove.length === 0) {
      const isolatedNodes = workingGraph.nodes().filter((nodeId) => {
        return calculateNodeDegree(workingGraph, nodeId) === 0;
      });

      if (isolatedNodes.length > 0) {
        isolatedNodes.forEach((isolatedNode) => {
          L.push(isolatedNode);
          workingGraph.removeNode(isolatedNode);
        });
        continue;
      }
      break;
    }

    // Remove all nodes to be removed in this iteration
    nodesToRemove.forEach((node) => {
      const neighbors = getNeighbors(workingGraph, node);

      if (neighbors.length >= 1) {
        const coreNeighbor =
          neighbors.find((neighbor) => !isEdgeLabelNode(workingGraph, neighbor)) ?? neighbors[0];

        rho[node] = coreNeighbor;

        const edgeData =
          originalGraph.edge(node, coreNeighbor, undefined) ??
          originalGraph.edge(coreNeighbor, node, undefined);
        edgeDataMap[node] = edgeData ?? {};
      }

      L.push(node);

      workingGraph.removeNode(node);
    });
  }

  const allRemainingNodes = workingGraph.nodes();
  const unsortedCoreNodes = allRemainingNodes.filter(
    (nodeId) => !isEdgeLabelNode(workingGraph, nodeId)
  );

  // Sort core nodes deterministically to ensure consistent ordering regardless of input edge order
  const coreNodes = topologicalSortWithCycles(workingGraph, unsortedCoreNodes);

  const remainingEdgeLabelNodes = allRemainingNodes.filter((nodeId) =>
    isEdgeLabelNode(workingGraph, nodeId)
  );

  remainingEdgeLabelNodes.forEach((edgeLabelNode) => {
    const neighbors = getNeighbors(workingGraph, edgeLabelNode);
    if (neighbors.length > 0) {
      const coreNeighbor =
        neighbors.find((neighbor) => !isEdgeLabelNode(workingGraph, neighbor)) ?? neighbors[0];
      rho[edgeLabelNode] = coreNeighbor;

      const edgeData =
        originalGraph.edge(edgeLabelNode, coreNeighbor, undefined) ??
        originalGraph.edge(coreNeighbor, edgeLabelNode, undefined);
      edgeDataMap[edgeLabelNode] = edgeData ?? {};
    }
    L.push(edgeLabelNode);
  });

  // STEP 1.5: PATH COMPRESSION - Update rho mappings to point to ultimate core nodes
  const findUltimateCore = (nodeId: string, visited = new Set<string>()): string => {
    if (visited.has(nodeId)) {
      return nodeId;
    }
    visited.add(nodeId);

    const nextNode = rho[nodeId];
    if (!nextNode || coreNodes.includes(nodeId)) {
      return nodeId;
    }

    if (coreNodes.includes(nextNode)) {
      return nextNode;
    }

    const ultimate = findUltimateCore(nextNode, visited);
    rho[nodeId] = ultimate;
    return ultimate;
  };

  L.forEach((leaf) => {
    if (rho[leaf]) {
      rho[leaf] = findUltimateCore(rho[leaf]);
    }
  });

  // STEP 2: HANDLE PURE TREE CASE
  if (coreNodes.length === 0) {
    const trees = new Map<string, LayoutData>();

    if (L.length > 0) {
      const treeRoots = L.filter((nodeId) => {
        const inDegree = originalGraph.inEdges(nodeId, undefined)?.length ?? 0;
        return inDegree === 0;
      });

      if (treeRoots.length > 1) {
        const componentMap = new Map<string, Set<string>>();
        const globalVisited = new Set<string>();

        treeRoots.forEach((root) => {
          if (globalVisited.has(root)) {
            return;
          }

          const componentNodes = new Set<string>();
          const visited = new Set<string>();
          const queue = [root];

          // BFS to find all nodes in this connected component (only among peeled nodes in L)
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) {
              continue;
            }
            visited.add(current);
            globalVisited.add(current);
            componentNodes.add(current);

            const neighbors = getNeighbors(originalGraph, current);
            neighbors.forEach((neighbor) => {
              if (L.includes(neighbor) && !visited.has(neighbor) && !queue.includes(neighbor)) {
                queue.push(neighbor);
              }
            });
          }

          componentMap.set(root, componentNodes);
        });

        componentMap.forEach((componentNodes, root) => {
          const treeGraph = new graphlib.Graph({ directed: true });
          const dummyRootId = `${root}_copy`;

          const rootData = originalGraph.node(root) ?? {};
          treeGraph.setNode(dummyRootId, { ...rootData, isCopy: true });

          componentNodes.forEach((nodeId) => {
            if (nodeId !== root) {
              const nodeData = originalGraph.node(nodeId) ?? {};
              treeGraph.setNode(nodeId, nodeData);
            }
          });

          originalGraph.edges().forEach((edgeObj) => {
            const { v: start, w: end } = edgeObj;
            if (componentNodes.has(start) && componentNodes.has(end)) {
              const edgeData = originalGraph.edge(start, end, undefined) ?? {};

              const actualStart = start === root ? dummyRootId : start;
              const actualEnd = end === root ? dummyRootId : end;
              treeGraph.setEdge(actualStart, actualEnd, edgeData);
            }
          });

          const treeLayout = fromGraphlib(treeGraph, data4Layout.config);
          trees.set(root, treeLayout);
        });

        return {
          core: { nodes: [], edges: [], config: data4Layout.config },
          trees,
        };
      } else if (treeRoots.length === 1) {
        trees.set(treeRoots[0], workingData);
        return {
          core: { nodes: [], edges: [], config: data4Layout.config },
          trees,
        };
      }
    }
  }

  // STEP 3: IDENTIFY ROOT SET R
  const R = new Set<string>();

  L.forEach((leaf) => {
    const coreNeighbor = rho[leaf];
    if (coreNeighbor && coreNodes.includes(coreNeighbor)) {
      R.add(coreNeighbor);
    }
  });

  const trueSubgraphs = coreNodes.filter((nodeId) =>
    isTrueSubgraph(nodeId, originalGraph, data4Layout)
  );
  const trueSubgraphChildren = new Set<string>();
  const trueSubgraphChildrenByParent = new Map<string, string[]>();

  trueSubgraphs.forEach((subgraphId) => {
    const children = L.filter((leaf) => {
      const leafNode = originalGraph.node(leaf);
      return leafNode && leafNode.parentId === subgraphId;
    });
    if (children.length > 0) {
      children.forEach((child) => trueSubgraphChildren.add(child));
      trueSubgraphChildrenByParent.set(subgraphId, children);
    }
  });

  // STEP 4: CONSTRUCT TREE STRUCTURES
  const trees = new Map<string, LayoutData>();

  [...R].forEach((root) => {
    const dummyRootId = `${root}_copy`;
    const treeGraph = new graphlib.Graph({ directed: true });

    const rootData = originalGraph.node(root) ?? {};
    treeGraph.setNode(dummyRootId, { ...rootData, isCopy: true });

    const attachedLeaves = L.filter(
      (leaf) => rho[leaf] === root && !trueSubgraphChildren.has(leaf)
    );

    attachedLeaves.forEach((leaf) => {
      const leafData = originalGraph.node(leaf) ?? {};
      treeGraph.setNode(leaf, leafData);
    });

    const treeNodes = new Set(attachedLeaves);
    const visited = new Set<string>();
    const queue = [...attachedLeaves];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const neighbors = getNeighbors(originalGraph, current);
      neighbors.forEach((neighbor) => {
        if (
          L.includes(neighbor) &&
          !visited.has(neighbor) &&
          !queue.includes(neighbor) &&
          !trueSubgraphChildren.has(neighbor)
        ) {
          const shouldAdd = !isEdgeLabelNode(originalGraph, neighbor) || rho[neighbor] === root;

          if (shouldAdd) {
            queue.push(neighbor);
            treeNodes.add(neighbor);

            if (!treeGraph.hasNode(neighbor)) {
              const neighborData = originalGraph.node(neighbor) ?? {};
              treeGraph.setNode(neighbor, neighborData);
            }
          }
        }
      });
    }

    originalGraph.edges().forEach((edgeObj) => {
      const { v: start, w: end } = edgeObj;
      const edgeData = originalGraph.edge(start, end, undefined) ?? {};

      if (treeNodes.has(start) && treeNodes.has(end)) {
        treeGraph.setEdge(start, end, edgeData);
      } else if (start === root && treeNodes.has(end)) {
        treeGraph.setEdge(dummyRootId, end, edgeData);
      } else if (treeNodes.has(start) && end === root) {
        treeGraph.setEdge(start, dummyRootId, edgeData);
      }
    });

    const treeLayout = fromGraphlib(treeGraph, data4Layout.config);
    trees.set(root, treeLayout);
  });

  // STEP 4.5: CREATE SEPARATE TREES FOR TRUE SUBGRAPH CHILDREN
  trueSubgraphChildrenByParent.forEach((children) => {
    if (children.length === 0) {
      return;
    }

    const childSet = new Set(children);
    const inDegree = new Map<string, number>();

    children.forEach((childId) => {
      inDegree.set(childId, 0);
    });

    originalGraph.edges().forEach((edgeObj) => {
      const { v: start, w: end } = edgeObj;
      if (childSet.has(start) && childSet.has(end)) {
        inDegree.set(end, (inDegree.get(end) ?? 0) + 1);
      }
    });

    const roots = children.filter((childId) => inDegree.get(childId) === 0);

    const processedChildren = new Set<string>();
    const unprocessedChildren = new Set(children);

    while (unprocessedChildren.size > 0) {
      let startNode: string | undefined;
      if (roots.length > 0) {
        startNode = roots.find((r) => !processedChildren.has(r));
      }
      if (!startNode) {
        startNode = [...unprocessedChildren][0];
      }

      if (!startNode) {
        break;
      }

      const treeGraph = new graphlib.Graph({ directed: true });
      const treeNodes = new Set<string>();
      const visited = new Set<string>();
      const queue = [startNode];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) {
          continue;
        }
        visited.add(current);
        processedChildren.add(current);
        unprocessedChildren.delete(current);
        treeNodes.add(current);

        const nodeData = originalGraph.node(current) ?? {};
        treeGraph.setNode(current, nodeData);

        const neighbors = getNeighbors(originalGraph, current);
        neighbors.forEach((neighbor) => {
          if (childSet.has(neighbor) && !visited.has(neighbor) && !queue.includes(neighbor)) {
            queue.push(neighbor);
            treeNodes.add(neighbor);
          }
        });
      }

      originalGraph.edges().forEach((edgeObj) => {
        const { v: start, w: end } = edgeObj;
        if (treeNodes.has(start) && treeNodes.has(end)) {
          const edgeData = originalGraph.edge(start, end, undefined) ?? {};
          treeGraph.setEdge(start, end, edgeData);
        }
      });

      if (treeNodes.size > 0) {
        const treeKey = startNode;
        const treeLayout = fromGraphlib(treeGraph, data4Layout.config);
        trees.set(treeKey, treeLayout);
      }
    }
  });

  // STEP 5: CONSTRUCT CORE GRAPH
  const coreGraph = new graphlib.Graph({ directed: true });

  coreNodes.forEach((nodeId) => {
    const nodeData = originalGraph.node(nodeId) ?? {};
    coreGraph.setNode(nodeId, nodeData);
  });

  originalGraph.edges().forEach((edgeObj) => {
    const { v: start, w: end } = edgeObj;
    if (coreNodes.includes(start) && coreNodes.includes(end)) {
      const edgeData = originalGraph.edge(start, end, undefined) ?? {};
      if (!isImplicitParentChildEdge(edgeData)) {
        coreGraph.setEdge(start, end, edgeData);
      }
    }
  });

  const coreLayout = fromGraphlib(coreGraph, data4Layout.config);

  const mergedResult = mergeTreesByHierarchy(data4Layout, { core: coreLayout, trees });

  const result = handleMissingHierarchicalNodes(data4Layout, mergedResult);

  return result;
}

/**
 * Merges trees that share the same parentId to solve hierarchical grouping issues.
 * This ensures nodes with the same parent are grouped into the same tree, even if
 * they weren't directly connected during the peeling process. Resolves cases where
 * hierarchical relationships create multiple separate trees that should be unified.
 *
 * @param originalData - The original layout data for reference
 * @param decompositionResult - The current decomposition result with core and trees
 * @returns Updated decomposition result with merged trees by hierarchy
 */
function mergeTreesByHierarchy(
  originalData: LayoutData,
  decompositionResult: { core: LayoutData; trees: Map<string, LayoutData> }
): { core: LayoutData; trees: Map<string, LayoutData> } {
  const treesByParent = new Map<string, string[]>();

  const coreNodeIds = new Set(decompositionResult.core.nodes.map((n) => n.id));

  decompositionResult.trees.forEach((tree, treeKey) => {
    const parentCounts = new Map<string, number>();

    tree.nodes.forEach((node) => {
      if (!node.id.endsWith('_copy') && node.parentId) {
        const count = parentCounts.get(node.parentId) || 0;
        parentCounts.set(node.parentId, count + 1);
      }
    });

    let predominantParent = '';
    let maxCount = 0;
    parentCounts.forEach((count, parentId) => {
      if (count > maxCount) {
        maxCount = count;
        predominantParent = parentId;
      }
    });

    if (predominantParent) {
      if (!treesByParent.has(predominantParent)) {
        treesByParent.set(predominantParent, []);
      }
      treesByParent.get(predominantParent)!.push(treeKey);
    }
  });

  treesByParent.forEach((treeKeys, parentId) => {
    if (treeKeys.length > 1) {
      let primaryTreeKey = treeKeys[0];
      if (coreNodeIds.has(parentId) && treeKeys.includes(parentId)) {
        primaryTreeKey = parentId;
      }

      const primaryTree = decompositionResult.trees.get(primaryTreeKey)!;

      for (const currentTreeKey of treeKeys) {
        if (currentTreeKey === primaryTreeKey) {
          continue;
        }

        const currentTree = decompositionResult.trees.get(currentTreeKey)!;

        const existingNodeIds = new Set(primaryTree.nodes.map((n) => n.id));
        currentTree.nodes.forEach((node) => {
          if (!existingNodeIds.has(node.id)) {
            primaryTree.nodes.push(node);
          }
        });

        const existingEdgeIds = new Set(primaryTree.edges.map((e) => e.id));
        currentTree.edges.forEach((edge) => {
          if (!existingEdgeIds.has(edge.id)) {
            primaryTree.edges.push(edge);
          }
        });

        decompositionResult.trees.delete(currentTreeKey);
      }

      decompositionResult.trees.set(primaryTreeKey, primaryTree);
    }
  });

  return decompositionResult;
}

/**
 * Post-processing step to handle nodes that were missed due to hierarchical relationships.
 * This runs after the main decomposition to catch disconnected hierarchical nodes that
 * weren't properly assigned to core or tree structures. Ensures all original nodes
 * are included in the final decomposition result.
 *
 * @param originalData - The original layout data containing all nodes
 * @param decompositionResult - The current decomposition result to augment
 * @returns Complete decomposition result with all missing nodes properly assigned
 */
function handleMissingHierarchicalNodes(
  originalData: LayoutData,
  decompositionResult: { core: LayoutData; trees: Map<string, LayoutData> }
): { core: LayoutData; trees: Map<string, LayoutData> } {
  const processedNodes = new Set<string>();

  decompositionResult.core.nodes.forEach((node) => {
    processedNodes.add(node.id);
  });

  decompositionResult.trees.forEach((tree) => {
    tree.nodes.forEach((node) => {
      if (!node.id.endsWith('_copy')) {
        processedNodes.add(node.id);
      }
    });
  });

  const missingNodes = originalData.nodes.filter((node) => !processedNodes.has(node.id));

  if (missingNodes.length === 0) {
    return decompositionResult;
  }

  const missingNodesByParent = new Map<string, Node[]>();
  const orphanedNodes: Node[] = [];

  missingNodes.forEach((node) => {
    if (node.parentId && processedNodes.has(node.parentId)) {
      if (!missingNodesByParent.has(node.parentId)) {
        missingNodesByParent.set(node.parentId, []);
      }
      missingNodesByParent.get(node.parentId)!.push(node);
    } else {
      orphanedNodes.push(node);
    }
  });

  missingNodesByParent.forEach((children, parentId) => {
    let parentTree: LayoutData | null = null;
    let parentTreeKey = '';

    if (decompositionResult.core.nodes.some((n) => n.id === parentId)) {
      if (decompositionResult.trees.has(parentId)) {
        parentTree = decompositionResult.trees.get(parentId)!;
        parentTreeKey = parentId;
      } else {
        const parentNode = decompositionResult.core.nodes.find((n) => n.id === parentId)!;
        parentTree = {
          nodes: [{ ...parentNode, id: `${parentId}_copy` }],
          edges: [],
          config: originalData.config,
        };
        parentTreeKey = parentId;
      }
    } else {
      for (const [treeKey, tree] of decompositionResult.trees.entries()) {
        if (tree.nodes.some((n) => n.id === parentId)) {
          parentTree = tree;
          parentTreeKey = treeKey;
          break;
        }
      }
    }

    if (parentTree) {
      children.forEach((child) => {
        parentTree.nodes.push(child);

        const parentNodeId = parentTree.nodes.find(
          (n) => n.id === parentId || n.id === `${parentId}_copy`
        )?.id;
        if (parentNodeId) {
          parentTree.edges.push({
            id: `missing_${parentNodeId}_${child.id}`,
            start: parentNodeId,
            end: child.id,
            type: 'none',
            classes: 'implicit-parent-child-edge',
            thickness: 'invisible',
            arrowTypeStart: 'none',
            arrowTypeEnd: 'none',
            cssCompiledStyles: [],
            labelStyle: [],
            style: [],
            pattern: 'normal',
            look: 'neo',
            showPoints: false,
            curve: 'linear',
          });
        }
      });

      decompositionResult.trees.set(parentTreeKey, parentTree);
    }
  });

  if (orphanedNodes.length > 0) {
    orphanedNodes.forEach((orphan) => {
      const orphanTree: LayoutData = {
        nodes: [orphan],
        edges: [],
        config: originalData.config,
      };
      decompositionResult.trees.set(orphan.id, orphanTree);
    });
  }

  return decompositionResult;
}
