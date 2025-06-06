import type { SVG } from '../../../diagram-api/types.js';
import type { InternalHelpers } from '../../../internals.js';
import { log } from '../../../logger.js';
import type { LayoutData } from '../../types.js';
import type { RenderOptions } from '../../render.js';
import { executeCoseBilkentLayout } from './layout.js';

/**
 * Cose-Bilkent Layout Algorithm for Generic Diagrams
 *
 * This module provides a layout algorithm implementation using Cytoscape
 * with the cose-bilkent algorithm for positioning nodes and edges.
 *
 * The algorithm follows the unified rendering pattern and can be used
 * by any diagram type that provides compatible LayoutData.
 */

/**
 * Render function for the cose-bilkent layout algorithm
 *
 * This function follows the unified rendering pattern used by all layout algorithms.
 * It takes LayoutData, positions the nodes using Cytoscape with cose-bilkent,
 * and renders the positioned elements to the SVG.
 *
 * @param layoutData - Layout data containing nodes, edges, and configuration
 * @param svg - SVG element to render to
 * @param helpers - Internal helper functions for rendering
 * @param options - Rendering options
 */
export const render = async (
  layoutData: LayoutData,
  _svg: SVG,
  _helpers: InternalHelpers,
  _options?: RenderOptions
): Promise<void> => {
  log.debug('Cose-bilkent layout algorithm starting');
  log.debug('LayoutData keys:', Object.keys(layoutData));

  try {
    // Validate input data
    if (!layoutData.nodes || !Array.isArray(layoutData.nodes)) {
      throw new Error('No nodes found in layout data');
    }

    if (!layoutData.edges || !Array.isArray(layoutData.edges)) {
      throw new Error('No edges found in layout data');
    }

    log.debug(`Processing ${layoutData.nodes.length} nodes and ${layoutData.edges.length} edges`);

    // Execute the layout algorithm directly with the provided data
    const result = await executeCoseBilkentLayout(layoutData, layoutData.config);

    // Update the original layout data with the positioned nodes and edges
    layoutData.nodes.forEach((node) => {
      const positionedNode = result.nodes.find((n) => n.id === node.id);
      if (positionedNode) {
        node.x = positionedNode.x;
        node.y = positionedNode.y;
        log.debug('Updated node position:', node.id, 'at', positionedNode.x, positionedNode.y);
      }
    });

    layoutData.edges.forEach((edge) => {
      const positionedEdge = result.edges.find((e) => e.id === edge.id);
      if (positionedEdge) {
        // Update edge with positioning information if needed
        const edgeWithPosition = edge as unknown as Record<string, unknown>;
        edgeWithPosition.startX = positionedEdge.startX;
        edgeWithPosition.startY = positionedEdge.startY;
        edgeWithPosition.midX = positionedEdge.midX;
        edgeWithPosition.midY = positionedEdge.midY;
        edgeWithPosition.endX = positionedEdge.endX;
        edgeWithPosition.endY = positionedEdge.endY;
      }
    });

    log.debug('Cose-bilkent layout algorithm completed successfully');
    log.debug(`Positioned ${result.nodes.length} nodes and ${result.edges.length} edges`);
  } catch (error) {
    log.error('Cose-bilkent layout algorithm failed:', error);
    throw new Error(
      `Layout algorithm failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
