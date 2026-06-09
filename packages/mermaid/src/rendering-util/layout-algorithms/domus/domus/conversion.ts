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

  // Collect vertex IDs from non-group nodes
  for (const node of layout.nodes ?? []) {
    if (node?.id != null && !node.isGroup) {
      vertexIds.push(String(node.id));
    }
  }

  // Collect edges
  for (const edge of layout.edges ?? []) {
    if (edge?.id != null && edge.start != null && edge.end != null) {
      const from = String(edge.start);
      const to = String(edge.end);
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
