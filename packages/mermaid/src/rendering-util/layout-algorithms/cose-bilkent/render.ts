import type { InternalHelpers, LayoutData, RenderOptions, SVG, SVGGroup } from 'mermaid';
import { executeCoseBilkentLayout } from './layout.js';
import type { D3Selection } from '../../../types.js';

type Node = Record<string, unknown>;

interface NodeWithPosition extends Node {
  x?: number;
  y?: number;
  domId?: string | SVGGroup | D3Selection<SVGAElement>;
  width?: number;
  height?: number;
  id?: string;
}

/**
 * Render function for cose-bilkent layout algorithm
 *
 * This follows the same pattern as ELK and dagre renderers:
 * 1. Insert nodes into DOM to get their actual dimensions
 * 2. Run the layout algorithm to calculate positions
 * 3. Position the nodes and edges based on layout results
 */
export const render = async (
  data4Layout: LayoutData,
  svg: SVG,
  {
    insertCluster,
    insertEdge,
    insertEdgeLabel,
    insertMarkers,
    insertNode,
    log,
    positionEdgeLabel,
  }: InternalHelpers,
  { algorithm: _algorithm }: RenderOptions
) => {
  const nodeDb: Record<string, NodeWithPosition> = {};
  const clusterDb: Record<string, any> = {};

  // Insert markers for edges
  const element = svg.select('g');
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);

  // Create container groups
  const subGraphsEl = element.insert('g').attr('class', 'subgraphs');
  const edgePaths = element.insert('g').attr('class', 'edgePaths');
  const edgeLabels = element.insert('g').attr('class', 'edgeLabels');
  const nodes = element.insert('g').attr('class', 'nodes');

  // Step 1: Insert nodes into DOM to get their actual dimensions
  log.debug('Inserting nodes into DOM for dimension calculation');

  await Promise.all(
    data4Layout.nodes.map(async (node) => {
      if (node.isGroup) {
        // Handle subgraphs/clusters
        const clusterNode: NodeWithPosition = { ...node };
        clusterDb[node.id] = clusterNode;
        nodeDb[node.id] = clusterNode;

        // Insert cluster to get dimensions
        await insertCluster(subGraphsEl, node);
      } else {
        // Handle regular nodes
        const nodeWithPosition: NodeWithPosition = { ...node };
        nodeDb[node.id] = nodeWithPosition;

        // Insert node to get actual dimensions
        const nodeEl = await insertNode(nodes, node, {
          config: data4Layout.config,
          dir: data4Layout.direction || 'TB',
        });

        // Get the actual bounding box after insertion
        const boundingBox = nodeEl.node()!.getBBox();
        nodeWithPosition.width = boundingBox.width;
        nodeWithPosition.height = boundingBox.height;
        nodeWithPosition.domId = nodeEl;

        log.debug(`Node ${node.id} dimensions: ${boundingBox.width}x${boundingBox.height}`);
      }
    })
  );

  // Step 2: Run the cose-bilkent layout algorithm
  log.debug('Running cose-bilkent layout algorithm');

  // Update the layout data with actual dimensions
  const updatedLayoutData = {
    ...data4Layout,
    nodes: data4Layout.nodes.map((node) => {
      const nodeWithDimensions = nodeDb[node.id];
      return {
        ...node,
        width: nodeWithDimensions.width,
        height: nodeWithDimensions.height,
      };
    }),
  };

  const layoutResult = await executeCoseBilkentLayout(updatedLayoutData, data4Layout.config);

  // Step 3: Position the nodes based on layout results
  log.debug('Positioning nodes based on layout results');

  layoutResult.nodes.forEach((positionedNode) => {
    const node = nodeDb[positionedNode.id];
    if (node?.domId) {
      // Position the node at the calculated coordinates
      // The positionedNode.x/y represents the center of the node, so use directly
      (node.domId as D3Selection<SVGAElement>).attr(
        'transform',
        `translate(${positionedNode.x}, ${positionedNode.y})`
      );

      // Store the final position
      node.x = positionedNode.x;
      node.y = positionedNode.y;

      log.debug(`Positioned node ${node.id} at center (${positionedNode.x}, ${positionedNode.y})`);
    }
  });

  layoutResult.edges.forEach((positionedEdge) => {
    const edge = data4Layout.edges.find((e) => e.id === positionedEdge.id);
    if (edge) {
      // Update the edge data with positioned coordinates
      edge.points = [
        { x: positionedEdge.startX, y: positionedEdge.startY },
        { x: positionedEdge.midX, y: positionedEdge.midY },
        { x: positionedEdge.endX, y: positionedEdge.endY },
      ];
    }
  });

  // Step 4: Insert and position edges
  log.debug('Inserting and positioning edges');

  await Promise.all(
    data4Layout.edges.map(async (edge) => {
      // Insert edge label first
      const _edgeLabel = await insertEdgeLabel(edgeLabels, edge);

      // Get start and end nodes
      const startNode = nodeDb[edge.start ?? ''];
      const endNode = nodeDb[edge.end ?? ''];

      if (startNode && endNode) {
        // Find the positioned edge data
        const positionedEdge = layoutResult.edges.find((e) => e.id === edge.id);

        if (positionedEdge) {
          log.debug('APA01 positionedEdge', positionedEdge);
          // Create edge path with positioned coordinates
          const edgeWithPath = { ...edge };

          // Insert the edge path
          const paths = insertEdge(
            edgePaths,
            edgeWithPath,
            clusterDb,
            data4Layout.type,
            startNode,
            endNode,
            data4Layout.diagramId
          );

          // Position the edge label
          positionEdgeLabel(edgeWithPath, paths);
        } else {
          // Fallback: create a simple straight line between nodes
          const edgeWithPath = {
            ...edge,
            points: [
              { x: startNode.x || 0, y: startNode.y || 0 },
              { x: endNode.x || 0, y: endNode.y || 0 },
            ],
          };

          const paths = insertEdge(
            edgePaths,
            edgeWithPath,
            clusterDb,
            data4Layout.type,
            startNode,
            endNode,
            data4Layout.diagramId
          );
          positionEdgeLabel(edgeWithPath, paths);
        }
      }
    })
  );

  log.debug('Cose-bilkent rendering completed');
};
