import type { Edge, LayoutData } from '../../types.ts';

export function layerAssignment(data4Layout: LayoutData): void {
  const removedEdges: Edge[] = [];

  const visited = new Set<string>();
  const visiting = new Set<string>();

  function dfs(nodeId: string): void {
    visited.add(nodeId);
    visiting.add(nodeId);

    const outbound = data4Layout.edges.filter((e) => e.start === nodeId);

    for (const edge of outbound) {
      const neighbor = edge.end!;
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (visiting.has(neighbor)) {
        // Cycle detected: temporarily remove this edge
        removedEdges.push(edge);
      }
    }

    visiting.delete(nodeId);
  }

  // Remove cycles using DFS
  for (const node of data4Layout.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  // Filter out removed edges temporarily
  const workingEdges = data4Layout.edges.filter((e) => !removedEdges.includes(e));

  // Build in-degree map
  const inDegree: Record<string, number> = {};
  for (const node of data4Layout.nodes) {
    inDegree[node.id] = 0;
  }
  for (const edge of workingEdges) {
    if (edge.end) {
      inDegree[edge.end]++;
    }
  }

  // Queue of nodes with in-degree 0
  const queue: string[] = [];
  for (const nodeId in inDegree) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  // Map to store calculated ranks/layers
  const ranks: Record<string, number> = {};
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const parents = workingEdges.filter((e) => e.end === nodeId).map((e) => e.start!);
    const layoutNode = data4Layout.nodes.find((n) => n.id === nodeId);
    if (layoutNode?.parentId && parents.length == 0) {
      const parentNode = data4Layout.nodes.find((n) => n.id === layoutNode.parentId);
      if (!parentNode?.layer) {
        parents.push(parentNode?.id ?? '');
      }
    }
    const parentRanks = parents.map((p) => ranks[p] ?? 0);
    const rank = parentRanks.length ? Math.min(...parentRanks) + 1 : 0;

    ranks[nodeId] = rank;

    // Update layer in data4Layout.nodes

    if (layoutNode) {
      layoutNode.layer = rank + 1;
    }

    // Decrement in-degree of children
    for (const edge of workingEdges) {
      if (edge.start === nodeId && edge.end) {
        inDegree[edge.end]--;
        if (inDegree[edge.end] === 0) {
          queue.push(edge.end);
        }
      }
    }
  }
}
