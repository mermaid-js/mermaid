import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { findCommonAncestor } from './find-common-ancestor.js';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import {
  insertNode,
  positionNode,
  clear as clearNodes,
  setNodeElem,
} from '../../rendering-elements/nodes.js';
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
import { labelHelper } from '$root/rendering-util/rendering-elements/shapes/util.js';
import common from '$root/diagrams/common/common.js';
import { log } from '$root/logger.js';

import ELK from 'elkjs/lib/elk.bundled.js';

const nodeDb = {};
let portPos = {};
let clusterDb = {};

export const addVertex = async (nodeEl, graph, nodeArr, node) => {
  const labelData = { width: 0, height: 0 };
  const ports = [
    {
      id: node.id + '-west',
      layoutOptions: {
        'port.side': 'WEST',
      },
    },
    {
      id: node.id + '-east',
      layoutOptions: {
        'port.side': 'EAST',
      },
    },
    {
      id: node.id + '-south',
      layoutOptions: {
        'port.side': 'SOUTH',
      },
    },
    {
      id: node.id + '-north',
      layoutOptions: {
        'port.side': 'NORTH',
      },
    },
  ];

  let boundingBox;
  const child = {
    ...node,
    ports: node.shape === 'diamond' ? ports : [],
  };
  graph.children.push(child);
  nodeDb[node.id] = child;

  //     // Add the element to the DOM
  if (node.type !== 'group') {
    const childNodeEl = await insertNode(nodeEl, node, node.dir);
    boundingBox = childNodeEl.node().getBBox();
    child.domId = childNodeEl;
    child.width = boundingBox.width;
    child.height = boundingBox.height;
  } else {
    child.children = [];
    await addVertices(nodeEl, nodeArr, child, node.id);

    // We need the label hight to be able to size the subgraph;
    //       // svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
    //       // const rows = vertexText.split(common.lineBreakRegex);
    //       // for (const row of rows) {
    //       //   const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    //       //   tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    //       //   tspan.setAttribute('dy', '1em');
    //       //   tspan.setAttribute('x', '1');
    //       //   tspan.textContent = row;
    //       //   svgLabel.appendChild(tspan);
    //       // }
    //       // vertexNode = svgLabel;
    //       // const bbox = vertexNode.getBBox();
    const { shapeSvg, bbox } = await labelHelper(nodeEl, node, undefined, true);
    labelData.width = bbox.width;
    labelData.wrappingWidth = getConfig().flowchart.wrappingWidth;
    labelData.height = bbox.height;
    labelData.labelNode = shapeSvg.node();
    shapeSvg.remove();
    child.labelData = labelData;
    child.domId = nodeEl;
  }
};

export const addVertices = async function (nodeEl, nodeArr, graph, parentId) {
  const siblings = nodeArr.filter((node) => node.parentId === parentId);
  log.info('addVertices DAGA', siblings, parentId);
  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  await Promise.all(
    siblings.map(async (node) => {
      await addVertex(nodeEl, graph, nodeArr, node);
    })
  );
  return graph;
};

const drawNodes = (relX, relY, nodeArray, svg, subgraphsEl, depth) => {
  nodeArray.forEach(function (node) {
    if (node) {
      nodeDb[node.id] = node;
      nodeDb[node.id].offset = {
        posX: node.x + relX,
        posY: node.y + relY,
        x: relX,
        y: relY,
        depth,
        width: node.width,
        height: node.height,
      };
      if (node.type === 'group') {
        log.debug('Id abc88 subgraph (DAGA)= ', node.id, node.x, node.y, node.labelData);
        const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
        const clusterNode = JSON.parse(JSON.stringify(node));
        clusterNode.x = node.offset.posX + node.width / 2;
        clusterNode.y = node.offset.posY + node.height / 2;
        // clusterNode.y = node.y + node.height / 2;
        const cluster = insertCluster(subgraphEl, clusterNode);
        // const bbox = cluster.node().getBBox();
        // node.x -= bbox.width / 2 - 2; // Magic number 2... why??? WHY???
        // node.y -= bbox.height / 2;
        log.info('Id (UGH)= ', node.shape, node.labels);
      } else {
        log.info(
          'Id NODE (DAGA)= ',
          node.id,
          node.x,
          node.y,
          relX,
          relY,
          node.domId.node(),
          `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
        );
        node.domId.attr(
          'transform',
          `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
        );
      }
    }
  });
  nodeArray.forEach(function (node) {
    if (node && node.type === 'group') {
      drawNodes(relX + node.x, relY + node.y, node.children, svg, subgraphsEl, depth + 1);
    }
  });
};

const getNextPort = (node, edgeDirection, graphDirection) => {
  log.info('getNextPort abc88', { node, edgeDirection, graphDirection });
  if (!portPos[node]) {
    switch (graphDirection) {
      case 'TB':
      case 'TD':
        portPos[node] = {
          inPosition: 'north',
          outPosition: 'south',
        };
        break;
      case 'BT':
        portPos[node] = {
          inPosition: 'south',
          outPosition: 'north',
        };
        break;
      case 'RL':
        portPos[node] = {
          inPosition: 'east',
          outPosition: 'west',
        };
        break;
      case 'LR':
        portPos[node] = {
          inPosition: 'west',
          outPosition: 'east',
        };
        break;
    }
  }
  const result = edgeDirection === 'in' ? portPos[node].inPosition : portPos[node].outPosition;

  if (edgeDirection === 'in') {
    portPos[node].inPosition = getNextPosition(
      portPos[node].inPosition,
      edgeDirection,
      graphDirection
    );
  } else {
    portPos[node].outPosition = getNextPosition(
      portPos[node].outPosition,
      edgeDirection,
      graphDirection
    );
  }
  return result;
};

const addSubGraphs = function (nodeArr) {
  const parentLookupDb = { parentById: {}, childrenById: {} };
  const subgraphs = nodeArr.filter((node) => node.type === 'group');
  log.info('Subgraphs - ', subgraphs);
  subgraphs.forEach(function (subgraph) {
    const children = nodeArr.filter((node) => node.parentId === subgraph.id);
    children.forEach(function (node) {
      parentLookupDb.parentById[node.id] = subgraph.id;
      if (parentLookupDb.childrenById[subgraph.id] === undefined) {
        parentLookupDb.childrenById[subgraph.id] = [];
      }
      parentLookupDb.childrenById[subgraph.id].push(node);
    });
  });

  subgraphs.forEach(function (subgraph) {
    const data = { id: subgraph.id };
    if (parentLookupDb.parentById[subgraph.id] !== undefined) {
      data.parent = parentLookupDb.parentById[subgraph.id];
    }
  });
  return parentLookupDb;
};

const insertChildren = (nodeArray, parentLookupDb) => {
  nodeArray.forEach((node) => {
    // Check if we have reached the end of the tree
    if (!node.children) {
      node.children = [];
    }
    // Check if the node has children
    const childIds = parentLookupDb.childrenById[node.id];
    // If the node has children, add them to the node
    if (childIds) {
      childIds.forEach((childId) => {
        node.children.push(nodeDb[childId]);
      });
    }
    // Recursive call
    insertChildren(node.children, parentLookupDb);
  });
};

const getEdgeStartEndPoint = (edge, dir) => {
  let source = edge.start;
  let target = edge.end;

  // Save the original source and target
  const sourceId = source;
  const targetId = target;

  const startNode = nodeDb[edge.start.id];
  const endNode = nodeDb[edge.end.id];

  if (!startNode || !endNode) {
    return { source, target };
  }

  if (startNode.shape === 'diamond') {
    source = `${source}-${getNextPort(source, 'out', dir)}`;
  }

  if (endNode.shape === 'diamond') {
    target = `${target}-${getNextPort(target, 'in', dir)}`;
  }

  // Add the edge to the graph
  return { source, target, sourceId, targetId };
};

const calcOffset = function (src, dest, parentLookupDb) {
  console.log('DAGA src dest', src, dest, parentLookupDb);
  const ancestor = findCommonAncestor(src, dest, parentLookupDb);
  if (ancestor === undefined || ancestor === 'root') {
    return { x: 0, y: 0 };
  }

  const ancestorOffset = nodeDb[ancestor].offset;
  return { x: ancestorOffset.posX, y: ancestorOffset.posY };
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param {object} edges The edges to add to the graph
 * @param {object} g The graph object
 * @param cy
 * @param diagObj
 * @param dataForLayout
 * @param graph
 * @param svg
 */
export const addEdges = function (dataForLayout, graph, svg) {
  log.info('abc78 edges = ', dataForLayout);
  const edges = dataForLayout.edges;
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  let linkIdCnt = {};
  let dir = dataForLayout.direction || 'DOWN';
  let defaultStyle;
  let defaultLabelStyle;

  edges.forEach(function (edge) {
    // Identify Link
    const linkIdBase = edge.id; // 'L-' + edge.start + '-' + edge.end;
    // count the links from+to the same node to give unique id
    if (linkIdCnt[linkIdBase] === undefined) {
      linkIdCnt[linkIdBase] = 0;
      log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
    } else {
      linkIdCnt[linkIdBase]++;
      log.info('abc78 new entry', linkIdBase, linkIdCnt[linkIdBase]);
    }
    let linkId = linkIdBase + '-' + linkIdCnt[linkIdBase];
    log.info('abc78 new link id to be used is', linkIdBase, linkId, linkIdCnt[linkIdBase]);
    const linkNameStart = 'LS-' + edge.start;
    const linkNameEnd = 'LE-' + edge.end;

    const edgeData = { style: '', labelStyle: '' };
    edgeData.minlen = edge.length || 1;

    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    // Check of arrow types, placed here in order not to break old rendering
    edgeData.arrowTypeStart = 'arrow_open';
    edgeData.arrowTypeEnd = 'arrow_open';

    /* eslint-disable no-fallthrough */
    switch (edge.type) {
      case 'double_arrow_cross':
        edgeData.arrowTypeStart = 'arrow_cross';
      case 'arrow_cross':
        edgeData.arrowTypeEnd = 'arrow_cross';
        break;
      case 'double_arrow_point':
        edgeData.arrowTypeStart = 'arrow_point';
      case 'arrow_point':
        edgeData.arrowTypeEnd = 'arrow_point';
        break;
      case 'double_arrow_circle':
        edgeData.arrowTypeStart = 'arrow_circle';
      case 'arrow_circle':
        edgeData.arrowTypeEnd = 'arrow_circle';
        break;
    }

    let style = '';
    let labelStyle = '';

    switch (edge.stroke) {
      case 'normal':
        style = 'fill:none;';
        if (defaultStyle !== undefined) {
          style = defaultStyle;
        }
        if (defaultLabelStyle !== undefined) {
          labelStyle = defaultLabelStyle;
        }
        edgeData.thickness = 'normal';
        edgeData.pattern = 'solid';
        break;
      case 'dotted':
        edgeData.thickness = 'normal';
        edgeData.pattern = 'dotted';
        edgeData.style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
        break;
      case 'thick':
        edgeData.thickness = 'thick';
        edgeData.pattern = 'solid';
        edgeData.style = 'stroke-width: 3.5px;fill:none;';
        break;
    }
    // if (edge.style !== undefined) {
    //   const styles = getStylesFromArray(edge.style);
    //   style = styles.style;
    //   labelStyle = styles.labelStyle;
    // }

    edgeData.style = edgeData.style += style;
    edgeData.labelStyle = edgeData.labelStyle += labelStyle;

    // if (edge.interpolate !== undefined) {
    //   edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
    // } else if (edges.defaultInterpolate !== undefined) {
    //   edgeData.curve = interpolateToCurve(edges.defaultInterpolate, curveLinear);
    // } else {
    //   edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
    // }

    if (edge.text === undefined) {
      if (edge.style !== undefined) {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';
    }

    edgeData.labelType = edge.labelType;
    edgeData.label = (edge?.text || '').replace(common.lineBreakRegex, '\n');

    if (edge.style === undefined) {
      edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

    const labelEl = insertEdgeLabel(labelsEl, edgeData);

    // calculate start and end points of the edge, note that the source and target
    // can be modified for shapes that have ports
    const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge, dir);
    log.debug('abc78 source and target', source, target);
    // Add the edge to the graph
    graph.edges.push({
      id: 'e' + edge.start + edge.end,
      ...edge,
      sources: [source],
      targets: [target],
      sourceId,
      targetId,
      labelEl: labelEl,
      labels: [
        {
          width: edgeData.width,
          height: edgeData.height,
          orgWidth: edgeData.width,
          orgHeight: edgeData.height,
          text: edgeData.label,
          layoutOptions: {
            'edgeLabels.inline': 'true',
            'edgeLabels.placement': 'CENTER',
          },
        },
      ],
      edgeData,
    });
  });
  return graph;
};

export const render = async (data4Layout, svg, element) => {
  const elk = new ELK();

  // Add the arrowheads to the svg
  insertMarkers(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);

  // Setup the graph with the layout options and the data for the layout
  let elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'org.eclipse.elk.padding': '[top=100, left=100, bottom=110, right=110]',
      'elk.layered.spacing.edgeNodeBetweenLayers': '30',
    },
    children: [],
    edges: [],
  };

  log.info('Drawing flowchart using v4 renderer', elk);

  // Set the direction of the graph based on the parsed information
  let dir = data4Layout.direction || 'DOWN';
  switch (dir) {
    case 'BT':
      elkGraph.layoutOptions['elk.direction'] = 'UP';
      break;
    case 'TB':
      elkGraph.layoutOptions['elk.direction'] = 'DOWN';
      break;
    case 'LR':
      elkGraph.layoutOptions['elk.direction'] = 'RIGHT';
      break;
    case 'RL':
      elkGraph.layoutOptions['elk.direction'] = 'LEFT';
      break;
    default:
      elkGraph.layoutOptions['elk.direction'] = 'DOWN';
      break;
  }

  // Create the lookup db for the subgraphs and their children to used when creating
  // the tree structured graph
  const parentLookupDb = addSubGraphs(data4Layout.nodes);

  // Add elements in the svg to be used to hold the subgraphs container
  // elements and the nodes
  const subGraphsEl = svg.insert('g').attr('class', 'subgraphs');
  const nodeEl = svg.insert('g').attr('class', 'nodes');

  // Add the nodes to the graph, this will entail creating the actual nodes
  // in order to get the size of the node. You can't get the size of a node
  // that is not in the dom so we need to add it to the dom, get the size
  // we will position the nodes when we get the layout from elkjs
  elkGraph = await addVertices(nodeEl, data4Layout.nodes, elkGraph);
  // Time for the edges, we start with adding an element in the node to hold the edges
  const edgesEl = svg.insert('g').attr('class', 'edges edgePath');

  // Add the edges to the elk graph, this will entail creating the actual edges
  elkGraph = addEdges(data4Layout, elkGraph, svg);

  // Iterate through all nodes and add the top level nodes to the graph
  const nodes = data4Layout.nodes;
  nodes.forEach((n) => {
    const node = nodeDb[n.id];

    // Subgraph
    if (parentLookupDb.childrenById[node.id] !== undefined) {
      node.labels = [
        {
          text: node.labelText,
          layoutOptions: {
            'nodeLabels.placement': '[H_CENTER, V_TOP, INSIDE]',
          },
          width: node?.labelData?.width || 100,
          height: node?.labelData?.height || 100,
        },
      ];
      delete node.x;
      delete node.y;
      delete node.width;
      delete node.height;
    }
  });

  log.info('before layout abc88', JSON.stringify(elkGraph, null, 2));
  const g = await elk.layout(elkGraph);
  log.info('after layout abc88 DAGA', g);

  // debugger;
  drawNodes(0, 0, g.children, svg, subGraphsEl, 0);
  g.edges?.map((edge) => {
    // (elem, edge, clusterDb, diagramType, graph, id)
    edge.start = nodeDb[edge.sources[0]];
    edge.end = nodeDb[edge.targets[0]];
    const sourceId = edge.start.id;
    const targetId = edge.end.id;

    const offset = calcOffset(sourceId, targetId, parentLookupDb);
    // const offset = { x: 50, y: 25 };

    const src = edge.sections[0].startPoint;
    const dest = edge.sections[0].endPoint;
    const segments = edge.sections[0].bendPoints ? edge.sections[0].bendPoints : [];

    const segPoints = segments.map((segment) => {
      return { x: segment.x + offset.x, y: segment.y + offset.y };
    });
    edge.points = [
      { x: src.x + offset.x, y: src.y + offset.y },
      ...segPoints,
      { x: dest.x + offset.x, y: dest.y + offset.y },
    ];
    console.log(
      'DAGA org points: ',
      [
        { x: src.x, y: src.y },
        { x: dest.x, y: dest.y },
      ],
      'points: ',
      edge.points
    );

    insertEdge(edgesEl, edge, clusterDb, data4Layout.type, g, data4Layout.diagramId);
  });
};
