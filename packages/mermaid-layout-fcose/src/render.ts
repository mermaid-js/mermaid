import type { InternalHelpers, LayoutData, RenderOptions, SVG } from 'mermaid';
import { executeFcoseLayout } from './layout.js';

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
 * Render function for fcose layout algorithm

 * The fcose layout is optimized for architecture diagrams with spatial constraints
 * and group alignments.
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

        const clusterResult = await insertCluster(subGraphsEl, node);
        if (clusterResult?.cluster) {
          clusterNode.domId = clusterResult.cluster;
        }
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
          dir: data4Layout.direction ?? 'TB',
        });

        const boundingBox = nodeEl.node()!.getBBox();
        nodeWithPosition.width = boundingBox.width;
        nodeWithPosition.height = boundingBox.height;
        nodeWithPosition.domId = nodeEl;

        log.debug(`Node ${node.id} dimensions: ${boundingBox.width}x${boundingBox.height}`);
      }
    })
  );

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

  const layoutResult = await executeFcoseLayout(updatedLayoutData);

  log.debug('Positioning nodes based on fcose layout results');

  layoutResult.nodes.forEach((positionedNode) => {
    const node = nodeDb[positionedNode.id];
    if (
      node &&
      positionedNode.x !== undefined &&
      positionedNode.y !== undefined &&
      !isNaN(positionedNode.x) &&
      !isNaN(positionedNode.y)
    ) {
      node.x = positionedNode.x;
      node.y = positionedNode.y;

      if (node.domId) {
        if (
          node.isGroup &&
          positionedNode.width !== undefined &&
          positionedNode.height !== undefined
        ) {
          const rect = node.domId.select('rect');
          if (!rect.empty()) {
            rect.attr('width', positionedNode.width);
            rect.attr('height', positionedNode.height);
          }
        }
        node.domId.attr('transform', `translate(${positionedNode.x}, ${positionedNode.y})`);
        log.debug(
          `Positioned node ${node.id} at (${positionedNode.x}, ${positionedNode.y})${node.isGroup ? ` with size ${positionedNode.width}x${positionedNode.height}` : ''}`
        );
      } else if (node.isGroup) {
        const clusterElement = subGraphsEl.select(`#${node.id}`);
        if (clusterElement && !clusterElement.empty()) {
          if (positionedNode.width !== undefined && positionedNode.height !== undefined) {
            const rect = clusterElement.select('rect');
            if (!rect.empty()) {
              rect.attr('width', positionedNode.width);
              rect.attr('height', positionedNode.height);
            }
          }
          clusterElement.attr('transform', `translate(${positionedNode.x}, ${positionedNode.y})`);
          log.debug(
            `Positioned group ${node.id} at (${positionedNode.x}, ${positionedNode.y})${positionedNode.width !== undefined ? ` with size ${positionedNode.width}x${positionedNode.height}` : ''}`
          );
        }
      }
    } else if (node && (isNaN(positionedNode.x) || isNaN(positionedNode.y))) {
      log.warn(
        `Node ${node.id} has invalid position: x=${positionedNode.x}, y=${positionedNode.y}`
      );
    }
  });

  await Promise.all(
    data4Layout.edges.map(async (edge) => {
      await insertEdgeLabel(edgeLabels, edge);

      const startNode = nodeDb[edge.start ?? ''];
      const endNode = nodeDb[edge.end ?? ''];

      if (startNode && endNode) {
        const positionedEdge = layoutResult.edges.find((e) => e.id === edge.id);

        if (positionedEdge) {
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
};
