import type { MermaidConfig } from '../../../config.type.js';
import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import type { LayoutResult } from './types.js';
import {
  createCytoscapeInstance,
  extractPositionedNodes,
  extractPositionedEdges,
} from './cytoscape-setup.js';

/**
 * Execute the cose-bilkent layout algorithm on generic layout data
 *
 * This function takes layout data and uses Cytoscape with the cose-bilkent
 * algorithm to calculate optimal node positions and edge paths.
 *
 * @param data - The layout data containing nodes, edges, and configuration
 * @param config - Mermaid configuration object
 * @returns Promise resolving to layout result with positioned nodes and edges
 */
export async function executeCoseBilkentLayout(
  data: LayoutData,
  _config: MermaidConfig
): Promise<LayoutResult> {
  log.debug('Starting cose-bilkent layout algorithm');

  try {
    // Validate input data
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('No nodes found in layout data');
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      throw new Error('No edges found in layout data');
    }

    // Create and configure cytoscape instance
    const cy = await createCytoscapeInstance(data);

    // Extract positioned nodes and edges after layout
    const positionedNodes = extractPositionedNodes(cy);
    const positionedEdges = extractPositionedEdges(cy);

    log.debug(`Layout completed: ${positionedNodes.length} nodes, ${positionedEdges.length} edges`);

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
    };
  } catch (error) {
    log.error('Error in cose-bilkent layout algorithm:', error);
    throw error;
  }
}

/**
 * Validate layout data structure
 * @param data - The data to validate
 * @returns True if data is valid, throws error otherwise
 */
export function validateLayoutData(data: LayoutData): boolean {
  if (!data) {
    throw new Error('Layout data is required');
  }

  if (!data.config) {
    throw new Error('Configuration is required in layout data');
  }

  if (!Array.isArray(data.nodes)) {
    throw new Error('Nodes array is required in layout data');
  }

  if (!Array.isArray(data.edges)) {
    throw new Error('Edges array is required in layout data');
  }

  return true;
}
