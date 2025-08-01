import type { InternalHelpers, LayoutData, RenderOptions, SVG } from 'mermaid';
import { executeTidyTreeLayout } from './layout.js';

interface NodeWithPosition {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  domId?: any;
  [key: string]: any;
}

/**
 * Render function for bidirectional tidy-tree layout algorithm
 *
 * This follows the same pattern as ELK and dagre renderers:
 * 1. Insert nodes into DOM to get their actual dimensions
 * 2. Run the bidirectional tidy-tree layout algorithm to calculate positions
 * 3. Position the nodes and edges based on layout results
 *
 * The bidirectional layout creates two trees that grow horizontally in opposite
 * directions from a central root node:
 * - Left tree: grows horizontally to the left (children: 1st, 3rd, 5th...)
 * - Right tree: grows horizontally to the right (children: 2nd, 4th, 6th...)
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

  const element = svg.select('g');
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);

  const subGraphsEl = element.insert('g').attr('class', 'subgraphs');
  const edgePaths = element.insert('g').attr('class', 'edgePaths');
  const edgeLabels = element.insert('g').attr('class', 'edgeLabels');
  const nodes = element.insert('g').attr('class', 'nodes');

  log.debug('Inserting nodes into DOM for dimension calculation');

  await Promise.all(
    data4Layout.nodes.map(async (node) => {
      if (node.isGroup) {
        const clusterNode: NodeWithPosition = {
          ...node,
          id: node.id,
          width: node.width,
          height: node.height,
        };
        clusterDb[node.id] = clusterNode;
        nodeDb[node.id] = clusterNode;

        await insertCluster(subGraphsEl, node);
      } else {
        const nodeWithPosition: NodeWithPosition = {
          ...node,
          id: node.id,
          width: node.width,
          height: node.height,
        };
        nodeDb[node.id] = nodeWithPosition;

        const nodeEl = await insertNode(nodes, node, {
          config: data4Layout.config,
          dir: data4Layout.direction || 'TB',
        });

        const boundingBox = nodeEl.node()!.getBBox();
        nodeWithPosition.width = boundingBox.width;
        nodeWithPosition.height = boundingBox.height;
        nodeWithPosition.domId = nodeEl;

        log.debug(`Node ${node.id} dimensions: ${boundingBox.width}x${boundingBox.height}`);
      }
    })
  );

  log.debug('Running bidirectional tidy-tree layout algorithm');

  const updatedLayoutData = {
    ...data4Layout,
    nodes: data4Layout.nodes.map((node) => {
      const nodeWithDimensions = nodeDb[node.id];
      return {
        ...node,
        width: nodeWithDimensions.width ?? node.width ?? 100,
        height: nodeWithDimensions.height ?? node.height ?? 50,
      };
    }),
  };

  const layoutResult = await executeTidyTreeLayout(updatedLayoutData, data4Layout.config);

  log.debug('Positioning nodes based on bidirectional layout results');

  layoutResult.nodes.forEach((positionedNode) => {
    const node = nodeDb[positionedNode.id];
    if (node?.domId) {
      node.domId.attr('transform', `translate(${positionedNode.x}, ${positionedNode.y})`);

      node.x = positionedNode.x;
      node.y = positionedNode.y;

      log.debug(`Positioned node ${node.id} at (${positionedNode.x}, ${positionedNode.y})`);
    }
  });

  log.debug('Inserting and positioning edges');

  await Promise.all(
    data4Layout.edges.map(async (edge) => {
      await insertEdgeLabel(edgeLabels, edge);

      const startNode = nodeDb[edge.start ?? ''];
      const endNode = nodeDb[edge.end ?? ''];

      if (startNode && endNode) {
        const positionedEdge = layoutResult.edges.find((e) => e.id === edge.id);

        if (positionedEdge) {
          log.debug('APA01 positionedEdge', positionedEdge);
          const edgeWithPath = {
            ...edge,
            points: positionedEdge.points,
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
        } else {
          const edgeWithPath = {
            ...edge,
            points: [
              { x: startNode.x ?? 0, y: startNode.y ?? 0 },
              { x: endNode.x ?? 0, y: endNode.y ?? 0 },
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

  log.debug('Bidirectional tidy-tree rendering completed');
};
