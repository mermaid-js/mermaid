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
import { select } from 'd3';
import { getConfig } from '../../../diagram-api/diagramAPI.js';

/**
 * @typedef {import('../../types.js').Node} Node
 * @typedef {import('../../../types.js').Point} Point
 * @typedef {import('../../../diagram-api/types.js').NodePosition} NodePosition
 * @typedef {import('../../../diagram-api/types.js').IntersectionPoint} IntersectionPoint
 */

/** @type {Map<string, Node>} */
let nodeDB = new Map();

// const fixInterSections = (points, startNodeId, endNodeId) => {
//   const startNode = nodeDB.get(startNodeId);
//   const endNode = nodeDB.get(endNodeId);
//   // Get the intersections
//   const startIntersection = startNode.intersect(points[1]);
//   const endIntersection = endNode.intersect(points[points.length - 2]);

//   // Replace the first and last points with their respective intersections
//   const fixedPoints = [startIntersection, ...points.slice(1, -1), endIntersection];

//   return points;
// };

/**
 * @param {Pick<Node, 'shape' | 'id' | 'intersect' | 'x' | 'y' | 'width' | 'height'>} node
 * @param {Point} point
 * @returns {IntersectionPoint}
 */
const calcIntersectionPoint = (node, point) => {
  const intersection = node.intersect(point);

  const dx = point.x - node.x;
  const dy = point.y - node.y;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);

  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  const criticalAngleRad = Math.atan2(halfHeight, halfWidth);
  const criticalAngleDeg = criticalAngleRad * (180 / Math.PI);

  let pos;
  if (angleDeg >= -criticalAngleDeg && angleDeg <= criticalAngleDeg) {
    pos = 'r'; // Right
  } else if (angleDeg > criticalAngleDeg && angleDeg <= 180 - criticalAngleDeg) {
    pos = 'b'; // Bottom
  } else if (angleDeg < -criticalAngleDeg && angleDeg >= -180 + criticalAngleDeg) {
    pos = 't'; // Top
  } else {
    pos = 'l'; // Left
  }

  return { x: intersection.x, y: intersection.y, pos };
};

/**
 * @param {Pick<Node, 'shape' | 'id' | 'intersect' | 'x' | 'y' | 'width' | 'height'>} _node1
 * @param {Pick<Node, 'shape' | 'id' | 'intersect' | 'x' | 'y' | 'width' | 'height'>} _node2
 * @returns {Promise<IntersectionPoint[]> | IntersectionPoint[]}
 */
export const calcNodeIntersections = async (targetNodeId, _node1, _node2) => {
  // CReate new nodes in order not to require a rendered diagram
  const fakeParent = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const parent = select(fakeParent);
  let node1 = Object.assign({}, _node1);
  let node2 = Object.assign({}, _node2);

  if (!targetNodeId || targetNodeId === _node1.id) {
    await insertNode(parent, node1, 'TB');
  } else {
    node1 = Object.assign({}, nodeDB.get(_node1.id));
  }
  if (!targetNodeId || targetNodeId === _node2.id) {
    await insertNode(parent, node2, 'TB');
  } else {
    node2 = Object.assign({}, nodeDB.get(_node2.id));
  }

  // Insert node will not give any widths as the element is not in the DOM
  node1.width = _node1.width || 50;
  node1.height = _node1.height || 50;
  node2.width = _node2.width || 50;
  node2.height = _node2.height || 50;

  const startIntersection = calcIntersectionPoint(node1, { x: node2.x, y: node2.y });
  const endIntersection = calcIntersectionPoint(node2, { x: node1.x, y: node1.y });
  return [startIntersection, endIntersection];
};

/**
 * @param {string} startNodeId
 * @param {string | undefined} endNodeId
 * @param {NodePosition} startNodeSize
 * @param {{width?: number, height?: number, x: number, y: number}} endNodeSize
 * @returns {IntersectionPoint[]}
 * @throws {Error} If the start node doesn't exist in the nodeDB (e.g. `render` hasn't been called yet)
 */
export const calcIntersections = (startNodeId, endNodeId, startNodeSize, endNodeSize) => {
  const startNode = nodeDB.get(startNodeId);
  if (!startNode) {
    throw new Error("Start node doesn't exist in the nodeDB");
  }
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

  // Check for self loop
  if (startNodeId === endNodeId) {
    const intersection = calcIntersectionPoint(startNode, {
      x: startNode.x + startNode.width / 2 + 20,
      y: startNode.y + startNode.height / 2,
    });

    const forthY = startNode.height / 4;
    return [
      { x: intersection.x, y: startNode.y - forthY, pos: 'r' },
      { x: intersection.x, y: startNode.y + forthY, pos: 'r' },
    ];
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
  const nodes = elem.insert('g').attr('class', 'nodes');
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');

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
    // console.log('STO calculatePosition', node.id, maxY);
    const children = childDB.get(node.id) || [];
    // log.info('STO calculatePosition', node.id, children.length);
    // We have a subgraph without position
    if (children.length > 0) {
      let minX = 10000;
      let maxX = -10000;
      let minYP = 10000;
      let maxYP = -10000;
      for (const child of children) {
        const width = child.width || 150;
        const height = child.height || 50;
        // log.info('BBB node child 1', child.id, width, height);
        calculatePosition(child, positions, childDB);
        // console.log(
        //   'STO node child 2',
        //   child.id,
        //   positions.nodes[child.id].x,
        //   positions.nodes[child.id].y,
        //   positions.nodes[child.id].width
        // );
        minX = Math.min(positions.nodes[child.id].x - width / 2, minX);
        maxX = Math.max(positions.nodes[child.id].x + width / 2, maxX);
        minYP = Math.min(positions.nodes[child.id].y - height / 2, minYP);
        maxYP = Math.max(positions.nodes[child.id].y + height / 2, maxYP);
      }
      if (!positions.nodes[node.id]) {
        // console.log(
        //   'STO calculatePosition SUBGRAPH SIZE',
        //   node.id,
        //   'y:',
        //   maxY - 10,
        //   'minX:',
        //   minX,
        //   'maxX:',
        //   maxX
        // );
        positions.nodes[node.id] = {
          x: minX + (maxX - minX) / 2,
          y: maxY + 120,
          width: maxX - minX + 20,
          height: maxYP - minYP + 30,
        };
      }
    } else {
      if (!positions.nodes[node.id]) {
        // Simple case
        // console.log('STO calculatePosition NODE SIZE', node.id, xPos, maxY, 'y:', maxY + 120);
        positions.nodes[node.id] = { x: xPos, y: maxY + 120 };
        xPos = xPos + 175;
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
      node.height = pos?.height || 0;
      node.width = pos?.width || 0;

      if (node.isGroup) {
        node.x = 0;
        node.y = 0;
        await insertCluster(nodes, node, { config: siteConfig, dir: 'TB' });
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
        await insertNode(nodes, node, { config: siteConfig, dir: 'TB' });
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
  const edgePositionValues = Object.values(positions.edges);
  for (const edge of data4Layout.edges) {
    if (!positions.edges[edge.id]) {
      const startNode = positions.nodes[edge.start];
      const endNode = positions.nodes[edge.end];
      // Edge Flickering fix
      const existingEdge = edgePositionValues?.find(
        (value) => value.start === edge.start && value.end === edge.end
      );
      if (existingEdge) {
        positions.edges[edge.id] = {
          ...existingEdge.points,
        };
      } else {
        positions.edges[edge.id] = {
          points: [
            { x: startNode.x, y: startNode.y },
            { x: (startNode.x + endNode.x) / 2, y: (startNode.y + endNode.y) / 2 },
            { x: endNode.x, y: endNode.y },
          ],
          start: edge.start,
          end: edge.end,
        };
      }
    }

    edge.points = positions.edges[edge.id].points;
    const paths = insertEdge(edgePaths, edge, {}, data4Layout.type, {}, {}, data4Layout.diagramId);
    paths.updatedPath = paths.originalPath;
    positionEdgeLabel(edge, paths);
  }
  if (window) {
    // TODO: Remove this now that we can do:
    // import { calcIntersections, calcNodeIntersections } from '@mermaid-chart/mermaid';
    window.calcIntersections = calcIntersections;
    window.calcNodeIntersections = calcNodeIntersections;
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
