import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { select } from 'd3';
import { log } from '../../../logger.js';
import type { LayoutData, Node, Edge } from '../../types.js';
import type { CytoscapeLayoutConfig, PositionedNode, PositionedEdge } from './types.js';

// Inject the layout algorithm into cytoscape
cytoscape.use(coseBilkent);

/**
 * Declare module augmentation for cytoscape edge types
 */
declare module 'cytoscape' {
  interface EdgeSingular {
    _private: {
      bodyBounds: unknown;
      rscratch: {
        startX: number;
        startY: number;
        midX: number;
        midY: number;
        endX: number;
        endY: number;
      };
    };
  }
}

/**
 * Add nodes to cytoscape instance from provided node array
 * This function processes only the nodes provided in the data structure
 * @param nodes - Array of nodes to add
 * @param cy - The cytoscape instance
 */
export function addNodes(nodes: Node[], cy: cytoscape.Core): void {
  nodes.forEach((node) => {
    const nodeData: Record<string, unknown> = {
      id: node.id,
      labelText: node.label,
      height: node.height,
      width: node.width,
      padding: node.padding ?? 0,
    };

    // Add any additional properties from the node
    Object.keys(node).forEach((key) => {
      if (!['id', 'label', 'height', 'width', 'padding', 'x', 'y'].includes(key)) {
        nodeData[key] = (node as unknown as Record<string, unknown>)[key];
      }
    });

    cy.add({
      group: 'nodes',
      data: nodeData,
      position: {
        x: node.x ?? 0,
        y: node.y ?? 0,
      },
    });
  });
}

/**
 * Add edges to cytoscape instance from provided edge array
 * This function processes only the edges provided in the data structure
 * @param edges - Array of edges to add
 * @param cy - The cytoscape instance
 */
export function addEdges(edges: Edge[], cy: cytoscape.Core): void {
  edges.forEach((edge) => {
    const edgeData: Record<string, unknown> = {
      id: edge.id,
      source: edge.start,
      target: edge.end,
    };

    // Add any additional properties from the edge
    Object.keys(edge).forEach((key) => {
      if (!['id', 'start', 'end'].includes(key)) {
        edgeData[key] = (edge as unknown as Record<string, unknown>)[key];
      }
    });

    cy.add({
      group: 'edges',
      data: edgeData,
    });
  });
}

/**
 * Create and configure cytoscape instance
 * @param data - Layout data containing nodes and edges
 * @returns Promise resolving to configured cytoscape instance
 */
export function createCytoscapeInstance(data: LayoutData): Promise<cytoscape.Core> {
  return new Promise((resolve) => {
    // Add temporary render element
    const renderEl = select('body').append('div').attr('id', 'cy').attr('style', 'display:none');

    const cy = cytoscape({
      container: document.getElementById('cy'), // container to render in
      style: [
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
          },
        },
      ],
    });

    // Remove element after layout
    renderEl.remove();

    // Add all nodes and edges to cytoscape using the generic functions
    addNodes(data.nodes, cy);
    addEdges(data.edges, cy);

    // Make cytoscape care about the dimensions of the nodes
    cy.nodes().forEach(function (n) {
      n.layoutDimensions = () => {
        const nodeData = n.data();
        return { w: nodeData.width, h: nodeData.height };
      };
    });

    // Configure and run the cose-bilkent layout
    const layoutConfig: CytoscapeLayoutConfig = {
      name: 'cose-bilkent',
      // @ts-ignore Types for cose-bilkent are not correct?
      quality: 'proof',
      styleEnabled: false,
      animate: false,
    };

    cy.layout(layoutConfig).run();

    cy.ready((e) => {
      log.info('Cytoscape ready', e);
      resolve(cy);
    });
  });
}

/**
 * Extract positioned nodes from cytoscape instance
 * @param cy - The cytoscape instance after layout
 * @returns Array of positioned nodes
 */
export function extractPositionedNodes(cy: cytoscape.Core): PositionedNode[] {
  return cy.nodes().map((node) => {
    const data = node.data();
    const position = node.position();

    // Create a positioned node with all original data plus position
    const positionedNode: PositionedNode = {
      id: data.id,
      x: position.x,
      y: position.y,
    };

    // Add all other properties from the original data
    Object.keys(data).forEach((key) => {
      if (key !== 'id') {
        positionedNode[key] = data[key];
      }
    });

    return positionedNode;
  });
}

/**
 * Extract positioned edges from cytoscape instance
 * @param cy - The cytoscape instance after layout
 * @returns Array of positioned edges
 */
export function extractPositionedEdges(cy: cytoscape.Core): PositionedEdge[] {
  return cy.edges().map((edge) => {
    const data = edge.data();
    const rscratch = edge._private.rscratch;

    // Create a positioned edge with all original data plus position
    const positionedEdge: PositionedEdge = {
      id: data.id,
      source: data.source,
      target: data.target,
      startX: rscratch.startX,
      startY: rscratch.startY,
      midX: rscratch.midX,
      midY: rscratch.midY,
      endX: rscratch.endX,
      endY: rscratch.endY,
    };

    // Add all other properties from the original data
    Object.keys(data).forEach((key) => {
      if (!['id', 'source', 'target'].includes(key)) {
        positionedEdge[key] = data[key];
      }
    });

    return positionedEdge;
  });
}
