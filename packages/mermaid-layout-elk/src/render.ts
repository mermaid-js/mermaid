// @ts-nocheck File not ready to check types
import { curveLinear } from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';
import mermaid from 'mermaid';
import { findCommonAncestor } from './find-common-ancestor.js';

const {
  common,
  getConfig,
  insertCluster,
  insertEdge,
  insertEdgeLabel,
  insertMarkers,
  insertNode,
  interpolateToCurve,
  labelHelper,
  log,
  positionEdgeLabel,
} = mermaid.internalHelpers;

const nodeDb = {};
const portPos = {};
const clusterDb = {};

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
  if (!node.isGroup) {
    const childNodeEl = await insertNode(nodeEl, node, node.dir);
    boundingBox = childNodeEl.node().getBBox();
    child.domId = childNodeEl;
    child.width = boundingBox.width;
    child.height = boundingBox.height;
  } else {
    child.children = [];
    await addVertices(nodeEl, nodeArr, child, node.id);

    // We need the label hight to be able to size the subgraph;
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
      if (node.isGroup) {
        log.debug('Id abc88 subgraph = ', node.id, node.x, node.y, node.labelData);
        const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
        // TODO use faster way of cloning
        const clusterNode = JSON.parse(JSON.stringify(node));
        clusterNode.x = node.offset.posX + node.width / 2;
        clusterNode.y = node.offset.posY + node.height / 2;
        const cluster = insertCluster(subgraphEl, clusterNode);

        log.info('Id (UGH)= ', node.shape, node.labels);
      } else {
        log.info(
          'Id NODE = ',
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
    if (node && node.isGroup) {
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
  const subgraphs = nodeArr.filter((node) => node.isGroup);
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
  const ancestor = findCommonAncestor(src, dest, parentLookupDb);
  if (ancestor === undefined || ancestor === 'root') {
    return { x: 0, y: 0 };
  }

  const ancestorOffset = nodeDb[ancestor].offset;
  return { x: ancestorOffset.posX, y: ancestorOffset.posY };
};

/**
 * Add edges to graph based on parsed graph definition
 */
export const addEdges = function (dataForLayout, graph, svg) {
  log.info('abc78 DAGA edges = ', dataForLayout);
  const edges = dataForLayout.edges;
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  const linkIdCnt = {};
  const dir = dataForLayout.direction || 'DOWN';
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
    const linkId = linkIdBase + '_' + linkIdCnt[linkIdBase];
    edge.id = linkId;
    log.info('abc78 new link id to be used is', linkIdBase, linkId, linkIdCnt[linkIdBase]);
    const linkNameStart = 'LS_' + edge.start;
    const linkNameEnd = 'LE_' + edge.end;

    const edgeData = { style: '', labelStyle: '' };
    edgeData.minlen = edge.length || 1;
    edge.text = edge.label;
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

    const conf = getConfig();
    if (edge.interpolate !== undefined) {
      edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
    } else if (edges.defaultInterpolate !== undefined) {
      edgeData.curve = interpolateToCurve(edges.defaultInterpolate, curveLinear);
    } else {
      edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
    }

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

function dir2ElkDirection(dir) {
  switch (dir) {
    case 'LR':
      return 'RIGHT';
    case 'RL':
      return 'LEFT';
    case 'TB':
      return 'DOWN';
    case 'BT':
      return 'UP';
    default:
      return 'DOWN';
  }
}

function setIncludeChildrenPolicy(nodeId: string, ancestorId: string) {
  const node = nodeDb[nodeId];

  if (!node) {
    return;
  }
  if (node?.layoutOptions === undefined) {
    node.layoutOptions = {};
  }
  node.layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
  if (node.id !== ancestorId) {
    setIncludeChildrenPolicy(node.parentId, ancestorId);
  }
}

export const render = async (data4Layout, svg, element, algorithm) => {
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
      'elk.algorithm': algorithm,
      'nodePlacement.strategy': 'NETWORK_SIMPLEX',

      'spacing.nodeNode': 70,
      'spacing.nodeNodeBetweenLayers': 25,
      'spacing.edgeNode': 10,
      'spacing.edgeNodeBetweenLayers': 20,
      'spacing.edgeEdge': 20,
      'spacing.edgeEdgeBetweenLayers': 20,
      'spacing.nodeSelfLoop': 20,
    },
    children: [],
    edges: [],
  };

  log.info('Drawing flowchart using v4 renderer', elk);

  // Set the direction of the graph based on the parsed information
  const dir = data4Layout.direction || 'DOWN';
  elkGraph.layoutOptions['elk.direction'] = dir2ElkDirection(dir);

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
      if (node.dir) {
        node.layoutOptions = {
          'elk.direction': dir2ElkDirection(node.dir),
          'elk.hierarchyHandling': 'SEPARATE_CHILDREN',
        };
      }
      delete node.x;
      delete node.y;
      delete node.width;
      delete node.height;
    }
  });
  elkGraph.edges.forEach((edge) => {
    const source = edge.sources[0];
    const target = edge.targets[0];

    if (nodeDb[source].parentId !== nodeDb[target].parentId) {
      const ancestorId = findCommonAncestor(source, target, parentLookupDb);
      // an edge that breaks a subgraph has been identified, set configuration accordingly
      setIncludeChildrenPolicy(source, ancestorId);
      setIncludeChildrenPolicy(target, ancestorId);
    }
  });

  log.info('before layout', JSON.stringify(elkGraph, null, 2));
  const g = await elk.layout(elkGraph);
  log.info('after layout DAGA', JSON.stringify(g));

  // debugger;
  drawNodes(0, 0, g.children, svg, subGraphsEl, 0);
  g.edges?.map((edge) => {
    // (elem, edge, clusterDb, diagramType, graph, id)
    edge.start = nodeDb[edge.sources[0]];
    edge.end = nodeDb[edge.targets[0]];
    const sourceId = edge.start.id;
    const targetId = edge.end.id;

    const offset = calcOffset(sourceId, targetId, parentLookupDb);

    if (edge.sections) {
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
      const paths = insertEdge(
        edgesEl,
        edge,
        clusterDb,
        data4Layout.type,
        g,
        data4Layout.diagramId
      );

      edge.x = edge.labels[0].x + offset.x + edge.labels[0].width / 2;
      edge.y = edge.labels[0].y + offset.y + edge.labels[0].height / 2;
      positionEdgeLabel(edge, paths);
    }
  });
};
