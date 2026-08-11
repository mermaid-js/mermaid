/**
 * DOMUS Conversion Utilities
 *
 * This module handles conversion between Mermaid's LayoutData format and
 * the DOMUS algorithm's input/output formats.
 */

import type { LayoutData, Node } from '../../../types.js';
import type { Point } from '../types.js';

/**
 * Convert a LayoutData graph to DOMUS input format.
 *
 * @param layout - The LayoutData with nodes and edges
 * @returns Vertex IDs and edge definitions
 */
export function layoutDataToDomusInput(layout: LayoutData): {
  vertexIds: string[];
  edges: { id: string; from: string; to: string }[];
} {
  const vertexIds: string[] = [];
  const edges: { id: string; from: string; to: string }[] = [];
  const nodesById = new Map<string, Node>();
  const childIdsByParent = new Map<string, string[]>();

  for (const node of layout.nodes ?? []) {
    if (node?.id == null) {
      continue;
    }
    const id = String(node.id);
    nodesById.set(id, node);
    if (!node.isGroup) {
      vertexIds.push(id);
    }
    if (node.parentId != null) {
      const parentId = String(node.parentId);
      const childIds = childIdsByParent.get(parentId);
      if (childIds) {
        childIds.push(id);
      } else {
        childIdsByParent.set(parentId, [id]);
      }
    }
  }
  const vertexIdSet = new Set(vertexIds);
  const leafDescendantCache = new Map<string, string[]>();

  const leafDescendantsOf = (id: string, visiting = new Set<string>()): string[] => {
    const cached = leafDescendantCache.get(id);
    if (cached) {
      return cached;
    }
    if (visiting.has(id)) {
      return [];
    }
    const node = nodesById.get(id);
    if (!node) {
      return [];
    }
    if (!node.isGroup) {
      return vertexIdSet.has(id) ? [id] : [];
    }

    visiting.add(id);
    const leaves: string[] = [];
    for (const childId of childIdsByParent.get(id) ?? []) {
      leaves.push(...leafDescendantsOf(childId, visiting));
    }
    visiting.delete(id);
    leafDescendantCache.set(id, leaves);
    return leaves;
  };

  const resolveEndpoint = (id: string, role: 'source' | 'target'): string | undefined => {
    if (vertexIdSet.has(id)) {
      return id;
    }
    const node = nodesById.get(id);
    if (!node?.isGroup) {
      return undefined;
    }
    const leaves = leafDescendantsOf(id);
    if (leaves.length === 0) {
      return undefined;
    }
    // Keep the DOMUS graph simple while preserving a directional compound hint:
    // incoming group edges attach to the first leaf, outgoing ones to the last.
    return role === 'source' ? leaves[leaves.length - 1] : leaves[0];
  };

  // Collect edges
  for (const edge of layout.edges ?? []) {
    if (edge?.id != null && edge.start != null && edge.end != null) {
      const from = resolveEndpoint(String(edge.start), 'source');
      const to = resolveEndpoint(String(edge.end), 'target');
      if (!from || !to) {
        continue;
      }
      // DOMUS expects simple edges between distinct vertices. Self-loops are handled
      // separately in the orthogonal pipeline with a dedicated loop router.
      if (from === to) {
        continue;
      }
      edges.push({
        id: String(edge.id),
        from,
        to,
      });
    }
  }

  return { vertexIds, edges };
}

/**
 * Extract node sizes from LayoutData.
 *
 * @param layout - The LayoutData with nodes
 * @returns Map from vertex ID to `\{ width, height \}`
 */
export function extractNodeSizes(
  layout: LayoutData
): Map<string, { width: number; height: number }> {
  const nodeSizes = new Map<string, { width: number; height: number }>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodeSizes.set(String(node.id), {
        width: node.width ?? 100,
        height: node.height ?? 50,
      });
    }
  }
  return nodeSizes;
}

/**
 * Build a lookup map of nodes by their ID.
 *
 * @param layout - The LayoutData with nodes
 * @returns Map from node ID to Node
 */
export function buildNodesById(layout: LayoutData): Map<string, Node> {
  const nodesById = new Map<string, Node>();
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }
  return nodesById;
}

/**
 * Update node positions in LayoutData using computed coordinates.
 *
 * @param layout - The LayoutData to update
 * @param pixelCoords - Map from vertex ID to its `\{ x, y \}` pixel coordinates
 */
export function updateNodePositions(layout: LayoutData, pixelCoords: Map<string, Point>): void {
  for (const node of layout.nodes ?? []) {
    if (node?.id != null) {
      const coord = pixelCoords.get(String(node.id));
      if (coord) {
        node.x = coord.x;
        node.y = coord.y;
      }
    }
  }
}
