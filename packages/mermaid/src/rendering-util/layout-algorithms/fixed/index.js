import insertMarkers from '../../rendering-elements/markers.js';
import { insertNode, positionNode, clear as clearNodes } from '../../rendering-elements/nodes.js';
import {
  insertCluster,
  clear as clearClusters,
  positionCluster,
} from '../../rendering-elements/clusters.js';
import {
  insertEdgeLabel,
  positionEdgeLabel,
  insertEdge,
  clear as clearEdges,
} from '../../rendering-elements/edges.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

let nodeDB = new Map();

const fixInterSections = (points, startNodeId, endNodeId) => {
  const startNode = nodeDB.get(startNodeId);
  const endNode = nodeDB.get(endNodeId);
  // Get the intersections
  const startIntersection = startNode.intersect(points[1]);
  const endIntersection = endNode.intersect(points[points.length - 2]);

  // Replace the first and last points with their respective intersections
  const fixedPoints = [startIntersection, ...points.slice(1, -1), endIntersection];

  return fixedPoints;
};

const calcIntersections = (points, startNodeId, endNodeId) => {
  const startNode = nodeDB.get(startNodeId);
  const endNode = nodeDB.get(endNodeId);
  // Get the intersections
  const startIntersection = startNode.intersect({ x: endNode.x, y: endNode.y });
  const endIntersection = endNode.intersect({ x: startNode.x, y: startNode.y });

  return [startIntersection, endIntersection];
};

const doRender = async (_elem, data4Layout, siteConfig, positions) => {
  const elem = _elem.insert('g').attr('class', 'root');
  elem.insert('g').attr('class', 'clusters');
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout

  nodeDB = new Map();
  await Promise.all(
    data4Layout.nodes.map(async function (node) {
      let pos;
      if (node.x === undefined || node.y === undefined) {
        pos = positions.nodes[node.id];
        node.height = pos?.height || 0;
        node.width = pos?.width || 0;
      }
      if (node.isGroup) {
        node.x = 0;
        node.y = 0;
        await insertCluster(nodes, node, 'TB');
        // Don't set the coordinates before they "layout", this will mess up the positioning
        if (pos) {
          node.x = pos?.x || 0;
          node.y = pos?.y || 0;
        }
      } else {
        if (pos) {
          node.x = pos?.x || 0;
          node.y = pos?.y || 0;
        }
        await insertNode(nodes, node, 'TB');
      }
      nodeDB.set(node.id, node);
    })
  );

  for (const edge of data4Layout.edges) {
    edge.x = edge?.x || 0;
    edge.y = edge?.y || 0;
    await insertEdgeLabel(edgeLabels, edge);
  }

  // log.info('############################################# XXX');
  // log.info('###                Layout                 ### XXX');
  // log.info('############################################# XXX');

  // Position the nodes

  data4Layout.nodes.map((node) => {
    if (node.isGroup) {
      positionCluster(node);
    } else {
      positionNode(node);
    }
  });

  // Insert the edges and position the edge labels
  for (const edge of data4Layout.edges) {
    //   log.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    edge.points = fixInterSections(positions.edges[edge.id].points, edge.start, edge.end);
    const paths = insertEdge(
      edgePaths,
      edge,
      {},
      data4Layout.type,
      undefined,
      data4Layout.diagramId
    );
    paths.updatedPath = paths.originalPath;
    positionEdgeLabel(edge, paths);
  }
  if (window) {
    window.calcIntersections = calcIntersections;
  }
  return { elem, diff: 0 };
};
/**
 * ###############################################################
 * Render the graph
 * ###############################################################
 */
export const render = async (data4Layout, svg, element, algorithm, positions) => {
  // Org
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  // clearGraphlib();

  // log.warn('Graph at first:', JSON.stringify(graphlibJson.write(graph)));
  const siteConfig = getConfig();
  await doRender(element, data4Layout, siteConfig, positions);
};
