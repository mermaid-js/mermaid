import type { Edge, LayoutData, Node } from '../../types.js';
import { layoutCoreGraph } from './coreGraphLayout.js';
import { removeCycleEdges, restoreCycleEdges } from './cycleUtils.js';
import { detectOverlaps, removeOverlaps } from './overlapUtils.js';
import {
  cleanupOrphanConnections,
  connectOrphanNodesInSubgraphs,
} from './subgraphOrphanHandler.js';
import { topologicalDecomposition } from './topologicalDecomposition.js';
import { layoutAndPlaceTrees } from './treeLayoutAndPlacement.js';

export function reRender(data4Layout: LayoutData, uniformEdgeLength: number) {
  const removeCycles = data4Layout?.config?.hola?.removeCycles ?? true;
  connectOrphanNodesInSubgraphs(data4Layout);

  let cycleEdges: Edge[] = [];
  if (removeCycles) {
    cycleEdges = removeCycleEdges(data4Layout);
  }

  const { core, trees: unsortedTrees } = topologicalDecomposition(data4Layout);
  const sortedCore = sortCoreNodesByConnectivity(core);
  const trees = sortTrees(unsortedTrees, data4Layout);

  const coreWithCoordinates = layoutCoreGraph(sortedCore, uniformEdgeLength);

  const layoutAfterTrees = layoutAndPlaceTrees(coreWithCoordinates, trees, uniformEdgeLength);

  detectAndResolveOverlaps(layoutAfterTrees);

  assignCoordinatesToOriginalNodes(data4Layout, layoutAfterTrees);

  if (removeCycles) {
    restoreCycleEdges(data4Layout, cycleEdges);
  }

  cleanupOrphanConnections(data4Layout);
}

export function assignCoordinatesToOriginalNodes(data4Layout: LayoutData, finalLayout: LayoutData) {
  finalLayout.nodes.forEach((node) => {
    const originalNode = data4Layout.nodes.find((n) => n.id === node.id);
    if (originalNode) {
      originalNode.x = node.x;
      originalNode.y = node.y;
      originalNode.width = node.width;
      originalNode.height = node.height;
    }
  });
}

export function detectAndResolveOverlaps(finalLayout: LayoutData) {
  if (finalLayout.nodes.length !== 0) {
    const overlaps = detectOverlaps(finalLayout.nodes);
    if (overlaps.length > 0) {
      const edgeInfo = finalLayout.edges
        .map((edge) => ({
          start: edge.start ?? '',
          end: edge.end ?? '',
        }))
        .filter((edge) => edge.start && edge.end);

      removeOverlaps(
        finalLayout.nodes,
        {
          maxIterations: 100,
          convergenceThreshold: 0.05,
          dampingFactor: 0.7,
          preserveStress: true,
        },
        edgeInfo
      );
    }
  }
}

export function sortGroupNodesToEnd(nodes: Node[]): Node[] {
  const nonGroupNodes = nodes.filter((n) => !n.isGroup);
  const groupNodes = nodes
    .filter((n) => n.isGroup)
    .map((n) => {
      const width = typeof n.width === 'number' ? n.width : 0;
      const height = typeof n.height === 'number' ? n.height : 0;
      return {
        ...n,
        _area: width * height,
      };
    })
    .sort((a, b) => b._area - a._area)
    .map((n, idx) => {
      const { _area, ...cleanNode } = n;
      cleanNode.order = nonGroupNodes.length + idx;
      return cleanNode;
    });

  return [...nonGroupNodes, ...groupNodes];
}

export function sortTrees(
  trees: Map<string, LayoutData>,
  data4Layout: LayoutData
): Map<string, LayoutData> {
  const treeEntries = [...trees.entries()];

  const trueSubgraphs = getTrueSubgraphs(data4Layout);
  const trueSubgraphIds = new Set(trueSubgraphs.map((sg) => sg.id));

  const subgraphIds = new Set<string>();
  treeEntries.forEach(([, tree]) => {
    tree.nodes.forEach((node) => {
      if (node.isGroup === true && node.id) {
        subgraphIds.add(node.id);
      }
    });
  });

  const treesBySubgraph = new Map<
    string,
    { childTrees: [string, LayoutData][]; parentTree?: [string, LayoutData] }
  >();
  const orphanTrees: [string, LayoutData][] = [];
  const treesWithTrueSubgraphs: [string, LayoutData][] = [];

  subgraphIds.forEach((subgraphId) => {
    treesBySubgraph.set(subgraphId, { childTrees: [], parentTree: undefined });
  });

  treeEntries.forEach(([key, tree]) => {
    const containsTrueSubgraph = tree.nodes.some(
      (node) => node.isGroup === true && node.id && trueSubgraphIds.has(node.id)
    );

    const containsSubgraph = tree.nodes.some(
      (node) => node.isGroup === true && node.id && subgraphIds.has(node.id)
    );

    const childOfSubgraph = tree.nodes.find((node) => {
      if (!node.parentId) {
        return false;
      }
      return subgraphIds.has(node.parentId);
    });

    if (containsTrueSubgraph) {
      treesWithTrueSubgraphs.push([key, tree]);
    } else if (containsSubgraph) {
      const subgraphNode = tree.nodes.find(
        (node) => node.isGroup === true && node.id && subgraphIds.has(node.id)
      );
      if (subgraphNode?.id) {
        const group = treesBySubgraph.get(subgraphNode.id);
        if (group) {
          group.parentTree = [key, tree];
        }
      }
    } else if (childOfSubgraph) {
      const parentId = childOfSubgraph.parentId!;
      const group = treesBySubgraph.get(parentId);
      if (group) {
        group.childTrees.push([key, tree]);
      }
    } else {
      orphanTrees.push([key, tree]);
    }
  });

  const ordered: [string, LayoutData][] = [];

  ordered.push(...treesWithTrueSubgraphs);

  const sortedSubgraphIds = [...subgraphIds].sort();
  sortedSubgraphIds.forEach((subgraphId) => {
    const group = treesBySubgraph.get(subgraphId);
    if (group) {
      ordered.push(...group.childTrees);
      if (group.parentTree && !treesWithTrueSubgraphs.includes(group.parentTree)) {
        ordered.push(group.parentTree);
      }
    }
  });

  ordered.push(...orphanTrees);

  const treesToMoveToEnd: [string, LayoutData][] = [];
  const remainingTrees: [string, LayoutData][] = [];

  ordered.forEach(([key, tree]) => {
    if (subgraphIds.has(key)) {
      if (tree.nodes.length === 1 && tree.nodes[0].isGroup === true) {
        treesToMoveToEnd.push([key, tree]);
      } else if (tree.nodes.length === 2) {
        const nonSubgraphNode = tree.nodes.find((node) => node.id !== key);
        if (nonSubgraphNode?.id.includes('orphan')) {
          treesToMoveToEnd.push([key, tree]);
        } else {
          remainingTrees.push([key, tree]);
        }
      } else {
        remainingTrees.push([key, tree]);
      }
    } else {
      remainingTrees.push([key, tree]);
    }
  });

  const finalOrdered = [...remainingTrees, ...treesToMoveToEnd];

  return new Map(finalOrdered);
}

export function isTrueSubgraph(data4Layout: LayoutData, subgraphId: string): boolean {
  const nodeMap = new Map(data4Layout.nodes.map((n) => [n.id, n]));
  const children = data4Layout.nodes.filter((n) => n.parentId === subgraphId);
  if (children.length === 0) {
    return false;
  }

  for (const child of children) {
    for (const edge of data4Layout.edges) {
      if (edge.start !== child.id && edge.end !== child.id) {
        continue;
      }

      const startParent = edge.start ? nodeMap.get(edge.start)?.parentId : undefined;
      const endParent = edge.end ? nodeMap.get(edge.end)?.parentId : undefined;

      if (startParent !== subgraphId || endParent !== subgraphId) {
        return false;
      }
    }
  }
  return true;
}

export function getTrueSubgraphs(data4Layout: LayoutData): Node[] {
  const subgraphs = data4Layout.nodes.filter((n) => n.isGroup);
  return subgraphs.filter((sg) => isTrueSubgraph(data4Layout, sg.id));
}

/**
 * Sorts true subgraphs bottom-up: deepest subgraphs first, most parent subgraphs last.
 * Subgraphs at the same level maintain their original relative order.
 *
 * @param data4Layout - The layout data containing all nodes
 * @returns Array of subgraphs sorted from deepest (first) to most parent (last)
 */
export function sortTrueSubgraphsBottomUp(data4Layout: LayoutData): Node[] {
  const allTrueSubgraphs = getTrueSubgraphs(data4Layout);

  if (allTrueSubgraphs.length === 0) {
    return [];
  }

  const subgraphIds = new Set(allTrueSubgraphs.map((sg) => sg.id));
  const subgraphMap = new Map(allTrueSubgraphs.map((sg) => [sg.id, sg]));

  const childrenMap = new Map<string, Node[]>();
  const parentMap = new Map<string, string | undefined>();

  allTrueSubgraphs.forEach((subgraph) => {
    const children = data4Layout.nodes.filter(
      (n) => n.parentId === subgraph.id && n.isGroup && subgraphIds.has(n.id)
    );
    childrenMap.set(subgraph.id, children);

    const parentNode = data4Layout.nodes.find((n) => n.id === subgraph.parentId);
    if (parentNode && parentNode.isGroup && subgraphIds.has(parentNode.id)) {
      parentMap.set(subgraph.id, parentNode.id);
    } else {
      parentMap.set(subgraph.id, undefined);
    }
  });

  const leafSubgraphs = allTrueSubgraphs.filter(
    (sg) => (childrenMap.get(sg.id) ?? []).length === 0
  );

  const sorted: Node[] = [];
  const visited = new Set<string>();
  let currentLevel = [...leafSubgraphs];

  while (currentLevel.length > 0) {
    currentLevel.forEach((sg) => {
      if (!visited.has(sg.id)) {
        sorted.push(sg);
        visited.add(sg.id);
      }
    });

    const nextLevel: Node[] = [];
    currentLevel.forEach((sg) => {
      const parentId = parentMap.get(sg.id);
      if (parentId) {
        const parent = subgraphMap.get(parentId);
        if (parent && !visited.has(parent.id)) {
          const children = childrenMap.get(parent.id) ?? [];
          const allChildrenProcessed = children.every((child) => visited.has(child.id));
          if (allChildrenProcessed && !nextLevel.includes(parent)) {
            nextLevel.push(parent);
          }
        }
      }
    });

    currentLevel = nextLevel;
  }

  allTrueSubgraphs.forEach((sg) => {
    if (!visited.has(sg.id)) {
      sorted.push(sg);
    }
  });

  return sorted;
}

function getNodeBounds(
  node: Node
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (node.x === undefined || node.y === undefined) {
    return null;
  }

  const width = typeof node.width === 'number' ? node.width : 0;
  const height = typeof node.height === 'number' ? node.height : 0;
  const halfW = width / 2;
  const halfH = height / 2;

  return {
    minX: node.x - halfW,
    maxX: node.x + halfW,
    minY: node.y - halfH,
    maxY: node.y + halfH,
  };
}

export function compressDisconnectedComponents(data4Layout: LayoutData) {
  const nodeMap = new Map(data4Layout.nodes.map((node) => [node.id, node]));

  const adjacencyList = new Map<string, Set<string>>();
  data4Layout.nodes.forEach((node) => {
    adjacencyList.set(node.id, new Set());
  });

  data4Layout.edges.forEach((edge) => {
    if (edge.start && edge.end) {
      adjacencyList.get(edge.start)?.add(edge.end);
      adjacencyList.get(edge.end)?.add(edge.start);
    }
  });

  data4Layout.nodes.forEach((node) => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        adjacencyList.get(node.id)?.add(node.parentId);
        adjacencyList.get(node.parentId)?.add(node.id);
      }
    }
  });

  const visited = new Set<string>();
  const components: Set<string>[] = [];

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

  data4Layout.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const component = new Set<string>();
      dfs(node.id, component);
      if (component.size > 0) {
        components.push(component);
      }
    }
  });

  if (components.length <= 1) {
    return;
  }

  const componentBounds = components
    .map((component) => {
      const componentNodes: Node[] = [];
      const collectedIds = new Set<string>();

      const collectAllNodes = (nodeId: string) => {
        if (collectedIds.has(nodeId)) {
          return;
        }
        const node = nodeMap.get(nodeId);
        if (!node) {
          return;
        }
        componentNodes.push(node);
        collectedIds.add(nodeId);

        data4Layout.nodes.forEach((child) => {
          if (child.parentId === nodeId) {
            collectAllNodes(child.id);
          }
        });
      };

      component.forEach((nodeId) => {
        collectAllNodes(nodeId);
      });

      const bounds = getNodesBounds(componentNodes);
      return bounds
        ? {
            nodeIds: collectedIds,
            nodes: componentNodes,
            bounds,
          }
        : null;
    })
    .filter(
      (
        comp
      ): comp is {
        nodeIds: Set<string>;
        nodes: Node[];
        bounds: { minX: number; maxX: number; minY: number; maxY: number };
      } => comp !== null
    );

  if (componentBounds.length <= 1) {
    return;
  }

  componentBounds.sort((a, b) => a.bounds.minX - b.bounds.minX);

  const minGap = 100;
  for (let i = 1; i < componentBounds.length; i++) {
    const prevComp = componentBounds[i - 1];
    const currComp = componentBounds[i];

    const gap = currComp.bounds.minX - prevComp.bounds.maxX;

    const hasNodesBetween = data4Layout.nodes.some((node) => {
      if (prevComp.nodeIds.has(node.id) || currComp.nodeIds.has(node.id)) {
        return false;
      }
      const nodeBounds = getNodeBounds(node);
      if (!nodeBounds) {
        return false;
      }
      return nodeBounds.minX >= prevComp.bounds.maxX && nodeBounds.maxX <= currComp.bounds.minX;
    });

    if (!hasNodesBetween && gap > minGap) {
      const targetGap = minGap;
      const shift = gap - targetGap;

      for (let j = i; j < componentBounds.length; j++) {
        const comp = componentBounds[j];
        comp.nodes.forEach((node) => {
          if (typeof node.x === 'number') {
            node.x -= shift;
          }
        });
        comp.bounds.minX -= shift;
        comp.bounds.maxX -= shift;
      }
    }
  }

  componentBounds.sort((a, b) => a.bounds.minY - b.bounds.minY);

  for (let i = 1; i < componentBounds.length; i++) {
    const prevComp = componentBounds[i - 1];
    const currComp = componentBounds[i];

    const gap = currComp.bounds.minY - prevComp.bounds.maxY;

    const hasNodesBetween = data4Layout.nodes.some((node) => {
      if (prevComp.nodeIds.has(node.id) || currComp.nodeIds.has(node.id)) {
        return false;
      }
      const nodeBounds = getNodeBounds(node);
      if (!nodeBounds) {
        return false;
      }
      return nodeBounds.minY >= prevComp.bounds.maxY && nodeBounds.maxY <= currComp.bounds.minY;
    });

    if (!hasNodesBetween && gap > minGap) {
      const targetGap = minGap;
      const shift = gap - targetGap;

      for (let j = i; j < componentBounds.length; j++) {
        const comp = componentBounds[j];
        comp.nodes.forEach((node) => {
          if (typeof node.y === 'number') {
            node.y -= shift;
          }
        });
        comp.bounds.minY -= shift;
        comp.bounds.maxY -= shift;
      }
    }
  }

  data4Layout.edges.forEach((edge) => {
    edge.points = undefined;
  });
}

export function getNodesBounds(
  nodes: Node[]
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  const initial = nodes
    .map((node) => getNodeBounds(node))
    .filter(
      (bounds): bounds is { minX: number; maxX: number; minY: number; maxY: number } =>
        bounds !== null
    );

  if (initial.length === 0) {
    return null;
  }

  return initial.reduce(
    (acc, bounds) => ({
      minX: Math.min(acc.minX, bounds.minX),
      maxX: Math.max(acc.maxX, bounds.maxX),
      minY: Math.min(acc.minY, bounds.minY),
      maxY: Math.max(acc.maxY, bounds.maxY),
    }),
    {
      minX: initial[0].minX,
      maxX: initial[0].maxX,
      minY: initial[0].minY,
      maxY: initial[0].maxY,
    }
  );
}

export function translateNodes(nodes: Node[], deltaX: number, deltaY: number) {
  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  nodes.forEach((node) => {
    if (typeof node.x === 'number') {
      node.x += deltaX;
    }
    if (typeof node.y === 'number') {
      node.y += deltaY;
    }
  });
}

export function buildChildComponents(childIds: Set<string>, edges: Edge[]) {
  const adjacency = new Map<string, Set<string>>();
  childIds.forEach((id) => adjacency.set(id, new Set()));

  edges.forEach((edge) => {
    if (!edge.start || !edge.end) {
      return;
    }
    if (childIds.has(edge.start) && childIds.has(edge.end)) {
      adjacency.get(edge.start)?.add(edge.end);
      adjacency.get(edge.end)?.add(edge.start);
    }
  });

  const visited = new Set<string>();
  const components: Set<string>[] = [];

  childIds.forEach((id) => {
    if (visited.has(id)) {
      return;
    }
    const stack = [id];
    const component = new Set<string>();
    visited.add(id);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.add(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      });
    }
    components.push(component);
  });

  return components;
}

export function dragIntoSubgraphs(data4Layout: LayoutData) {
  const trueSubgraphs = getTrueSubgraphs(data4Layout);
  if (trueSubgraphs.length === 0) {
    return;
  }

  trueSubgraphs.forEach((subgraph) => {
    const children = data4Layout.nodes.filter((node) => node.parentId === subgraph.id);
    if (children.length === 0) {
      return;
    }

    const subgraphBounds = getNodeBounds(subgraph);
    const childBounds = getNodesBounds(children);

    if (!subgraphBounds || !childBounds) {
      return;
    }

    const padding = 10;
    const subgraphCenterX = (subgraphBounds.minX + subgraphBounds.maxX) / 2;
    const subgraphCenterY = (subgraphBounds.minY + subgraphBounds.maxY) / 2;
    const childCenterX = (childBounds.minX + childBounds.maxX) / 2;
    const childCenterY = (childBounds.minY + childBounds.maxY) / 2;

    const deltaX = subgraphCenterX - childCenterX;
    const deltaY = subgraphCenterY - childCenterY;

    translateNodes(children, deltaX, deltaY);

    const centeredBounds = getNodesBounds(children);
    if (centeredBounds) {
      const overLeft = subgraphBounds.minX + padding - centeredBounds.minX;
      const overRight = centeredBounds.maxX - (subgraphBounds.maxX - padding);
      const overTop = subgraphBounds.minY + padding - centeredBounds.minY;
      const overBottom = centeredBounds.maxY - (subgraphBounds.maxY - padding);

      const adjustX = (overLeft > 0 ? overLeft : 0) - (overRight > 0 ? overRight : 0);
      const adjustY = (overTop > 0 ? overTop : 0) - (overBottom > 0 ? overBottom : 0);

      if (adjustX !== 0 || adjustY !== 0) {
        translateNodes(children, adjustX, adjustY);
      }
    }
  });

  const allTrueSubgraphChildrenIds = new Set<string>();
  trueSubgraphs.forEach((subgraph) => {
    const children = data4Layout.nodes.filter((node) => node.parentId === subgraph.id);
    children.forEach((child) => allTrueSubgraphChildrenIds.add(child.id));
  });

  data4Layout.edges.forEach((edge) => {
    if (
      edge.start &&
      edge.end &&
      allTrueSubgraphChildrenIds.has(edge.start) &&
      allTrueSubgraphChildrenIds.has(edge.end)
    ) {
      edge.points = undefined;
    }
  });
}

/**
 * Sorts core nodes so that nodes connected by edges are placed adjacently.
 * Uses BFS traversal to maintain connectivity-based ordering.
 * @param coreData - The core layout data containing nodes and edges to sort
 * @returns Sorted layout data with nodes ordered by connectivity
 */
export function sortCoreNodesByConnectivity(coreData: LayoutData): LayoutData {
  if (!coreData.nodes || coreData.nodes.length === 0) {
    return coreData;
  }

  const outDegreeMap = new Map<string, number>();
  const inDegreeMap = new Map<string, number>();

  coreData.nodes.forEach((node) => {
    outDegreeMap.set(node.id, 0);
    inDegreeMap.set(node.id, 0);
  });

  coreData.edges?.forEach((edge) => {
    if (edge.start) {
      outDegreeMap.set(edge.start, (outDegreeMap.get(edge.start) ?? 0) + 1);
    }
    if (edge.end) {
      inDegreeMap.set(edge.end, (inDegreeMap.get(edge.end) ?? 0) + 1);
    }
  });

  // Sort nodes: descending by out-degree, then ascending by in-degree
  // This puts nodes with most outgoing edges first, and nodes with most incoming edges last
  const sortedNodes = [...coreData.nodes].sort((a, b) => {
    const outDegreeA = outDegreeMap.get(a.id) ?? 0;
    const outDegreeB = outDegreeMap.get(b.id) ?? 0;
    const inDegreeA = inDegreeMap.get(a.id) ?? 0;
    const inDegreeB = inDegreeMap.get(b.id) ?? 0;

    if (outDegreeB !== outDegreeA) {
      return outDegreeB - outDegreeA;
    }

    return inDegreeA - inDegreeB;
  });

  const nodePositionMap = new Map<string, number>();
  sortedNodes.forEach((node, index) => {
    nodePositionMap.set(node.id, index);
  });

  const sortedEdges = [...(coreData.edges ?? [])].sort((e1, e2) => {
    const startPos1 = nodePositionMap.get(e1.start ?? '') ?? Infinity;
    const startPos2 = nodePositionMap.get(e2.start ?? '') ?? Infinity;
    const endPos1 = nodePositionMap.get(e1.end ?? '') ?? Infinity;
    const endPos2 = nodePositionMap.get(e2.end ?? '') ?? Infinity;

    if (startPos1 !== startPos2) {
      return startPos1 - startPos2;
    }

    return endPos1 - endPos2;
  });

  return {
    ...coreData,
    nodes: sortedNodes,
    edges: sortedEdges,
  };
}
