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

const calcIntersectionPoint = (node, point) => {
  const intersection = node.intersect(point);
  const dx = intersection.x - node.x;
  const dy = intersection.y - node.y;

  let pos = 'l';

  // Determine the position of the intersection relative to the node
  if (Math.abs(dx) > Math.abs(dy)) {
    pos = dx > 0 ? 'r' : 'l'; // Right or left
  } else {
    pos = dy > 0 ? 'b' : 't'; // Bottom or top
  }

  return { x: intersection.x, y: intersection.y, pos };
};

const calcIntersections = (points, startNodeId, endNodeId, startNodeSize, endNodeSize) => {
  const startNode = nodeDB.get(startNodeId);
  if (startNodeSize) {
    startNode.x = startNodeSize.width;
    startNode.y = startNodeSize.width;
    startNode.width = startNodeSize.width;
    startNode.height = startNodeSize.height;
  }
  const endNode = nodeDB.get(endNodeId);
  if (endNodeSize) {
    endNode.x = endNodeSize.width;
    endNode.y = endNodeSize.width;
    endNode.width = endNodeSize.width;
    endNode.height = endNodeSize.height;
  }
  // Get the intersections
  const startIntersection = calcIntersectionPoint(startNode, { x: endNode.x, y: endNode.y });
  const endIntersection = calcIntersectionPoint(endNode, { x: startNode.x, y: startNode.y });

  return [startIntersection, endIntersection];
};

const doRender = async (_elem, data4Layout, siteConfig, positions) => {
  const elem = _elem.insert('g').attr('class', 'root');
  elem.insert('g').attr('class', 'clusters');
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  if (!positions?.nodes || !positions?.edges) {
    positions = {};
    if (!positions?.nodes) {
      positions.nodes = {};
    }
    if (!positions?.edges) {
      positions.edges = {};
    }
  }
  // Add positions for nodes that lack them
  let maxY = 0;
  data4Layout.nodes.map(function (node) {
    const pos = positions.nodes[node.id];
    if (pos) {
      let y = pos.y;
      if (pos.height) {
        y += pos.height;
      } else if (node.height) {
        y += node.height;
      }

      maxY = Math.max(y, maxY);
    }
  });

  let cnt = 0;
  data4Layout.nodes.map(function (node) {
    let pos;
    if (!positions.nodes[node.id]) {
      positions.nodes[node.id] = { x: cnt * 75, y: maxY + 20 };
      cnt = cnt + 1;
    }
    // if (node.x === undefined || node.y === undefined) {
    pos = positions.nodes[node.id] || { x: 0, y: 0, width: 100, height: 100 };
    node.height = pos?.height || 50;
    node.width = pos?.width || 50;
  });

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout

  nodeDB = new Map();
  await Promise.all(
    data4Layout.nodes.map(async function (node, i) {
      let pos;
      if (!positions.nodes[node.id]) {
        positions.nodes[node.id] = { x: i * 100, y: maxY + 10, width: 50, height: 50 };
      }
      // if (node.x === undefined || node.y === undefined) {
      pos = positions.nodes[node.id] || { x: 0, y: 0, width: 100, height: 100 };
      node.height = pos?.height || 50;
      node.width = pos?.width || 50;
      // }
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
    // console.info('Edge : ' + JSON.stringify(edge), edge);

    if (!positions.edges[edge.id]) {
      const startNode = positions.nodes[edge.start];
      const endNode = positions.nodes[edge.end];
      positions.edges[edge.id] = {
        points: [
          { x: startNode.x, y: startNode.y },
          { x: (startNode.x + endNode.x) / 2, y: (startNode.y + endNode.y) / 2 },
          { x: endNode.x, y: endNode.y },
        ],
      };
    }
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
