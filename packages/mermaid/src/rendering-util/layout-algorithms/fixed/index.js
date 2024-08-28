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

const calcIntersections = (startNodeId, endNodeId, startNodeSize, endNodeSize) => {
  const startNode = nodeDB.get(startNodeId);
  if (startNodeSize) {
    startNode.x = startNodeSize.x;
    startNode.y = startNodeSize.y;
    startNode.width = startNodeSize.width;
    startNode.height = startNodeSize.height;
  }

  // If no end node it provided but you have an endNode size
  // We are adding an edge to a new node
  if (!endNodeId && endNodeSize) {
    const startIntersection = calcIntersectionPoint(startNode, {
      x: endNodeSize.x,
      y: endNodeSize.y,
    });
    const endIntersection = { x: endNodeSize.x, y: endNodeSize.x, pos: 'c' };
    return [startIntersection, endIntersection];
  }
  const endNode = nodeDB.get(endNodeId);
  if (endNodeSize && endNode) {
    endNode.x = endNodeSize.x;
    endNode.y = endNodeSize.y;
    endNode.width = endNodeSize.width;
    endNode.height = endNodeSize.height;
    // Get the intersections
    const startIntersection = calcIntersectionPoint(startNode, { x: endNode.x, y: endNode.y });
    const endIntersection = calcIntersectionPoint(endNode, { x: startNode.x, y: startNode.y });
    return [startIntersection, endIntersection];
  }
  return [];
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
  // Extract children info
  const childDB = new Map();
  data4Layout.nodes.map(function (node) {
    if (node.parentId) {
      const children = childDB.get(node.parentId) || [];
      children.push(node);
      childDB.set(node.parentId, children);
    }
  });

  // calculate next available position
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

  // Add positions for nodes that lack them
  let xPos = 0;
  function calculatePosition(node, positions, childDB) {
    const children = childDB.get(node.id) || [];
    // log.info('STO calculatePosition', node.id, children.length);
    // We have a subgraph without position
    if (children.length > 0) {
      let minX = 10000;
      let maxX = -10000;
      let minYP = 10000;
      let maxYP = -10000;
      for (const child of children) {
        const width = child.width || 50;
        const height = child.height || 50;
        // log.info('BBB node child 1', child.id, width, height);
        calculatePosition(child, positions, childDB);
        // log.info(
        //   'BBB node child 2',
        //   child.id,
        //   positions.nodes[child.id].x,
        //   positions.nodes[child.id].y
        // );
        minX = Math.min(positions.nodes[child.id].x - width / 2, minX);
        maxX = Math.max(positions.nodes[child.id].x + width / 2, maxX);
        minYP = Math.min(positions.nodes[child.id].y - height / 2, minYP);
        maxYP = Math.max(positions.nodes[child.id].y + height / 2, maxYP);
      }
      if (!positions.nodes[node.id]) {
        positions.nodes[node.id] = {
          x: minX + (maxX - minX) / 2,
          y: maxY + 15,
          width: maxX - minX + 20,
          height: maxYP - minYP + 30,
        };
      }
    } else {
      if (!positions.nodes[node.id]) {
        // Simple case
        positions.nodes[node.id] = { x: xPos, y: maxY + 20 };
        xPos = xPos + 75;
      }
    }
  }
  data4Layout.nodes.map(function (node) {
    if (!node.parentId) {
      calculatePosition(node, positions, childDB);
    }
  });

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout

  nodeDB = new Map();
  await Promise.all(
    data4Layout.nodes.map(async function (node) {
      let pos = positions.nodes[node.id];
      node.height = pos?.height || 50;
      node.width = pos?.width || 50;

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
export const render = async (data4Layout, svg, _internalHelpers, _algorithm, positions) => {
  const element = svg.select('g');
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
