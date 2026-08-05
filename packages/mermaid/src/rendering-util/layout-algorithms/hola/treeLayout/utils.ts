/* eslint-disable @cspell/spellchecker */
import type { LayoutData, Node, Edge } from '../../../types.js';
import type { PlanarizedCore } from './types.js';

/**
 * Convert planarized core (with tree nodes added) back to LayoutData format
 */
export function convertPlanarizedToLayoutData(
  planarizedCore: PlanarizedCore,
  config: LayoutData['config']
): LayoutData {
  // Extract all nodes (core + tree nodes) from planarized graph
  const nodes: Node[] = [...planarizedCore.nodes.values()]
    .filter((node) => !node.id.startsWith('bend_') && !node.id.startsWith('cross_'))
    .map((node) => ({
      ...node,
      id: node.id,
      label: 'label' in node ? (node.label ?? node.id) : node.id,
      x: node.x,
      y: node.y,
      isGroup: false,
      shape: 'shape' in node ? node.shape : 'rect',
    })) as Node[];

  // Extract all edges (core + tree edges) from planarized graph
  const edges: Edge[] = planarizedCore.edges
    .filter(
      (edge) =>
        !edge.start.startsWith('bend_') &&
        !edge.start.startsWith('cross_') &&
        !edge.end.startsWith('bend_') &&
        !edge.end.startsWith('cross_')
    )
    .map((edge) => ({
      ...edge,
      id: edge.id,
      start: edge.start,
      end: edge.end,
      type: 'edge',
      points: edge.points,
    }));

  return {
    nodes,
    edges,
    config,
  };
}
