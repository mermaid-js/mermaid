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
// import { insertEdge } from '../../mermaid/src/rendering-util/rendering-elements/edges.js';
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
    // ports: node.shape === 'diamond' ? ports : [],
  };
  graph.children.push(child);
  nodeDb[node.id] = child;

  // Add the element to the DOM
  if (!node.isGroup) {
    const childNodeEl = await insertNode(nodeEl, node, node.dir);
    boundingBox = childNodeEl.node().getBBox();
    child.domId = childNodeEl;
    child.width = boundingBox.width;
    child.height = boundingBox.height;
  } else {
    // A subgraph
    child.children = [];
    await addVertices(nodeEl, nodeArr, child, node.id);

    if (node.label) {
      const { shapeSvg, bbox } = await labelHelper(nodeEl, node, undefined, true);
      labelData.width = bbox.width;
      labelData.wrappingWidth = getConfig().flowchart.wrappingWidth;
      // Give some padding for elk
      labelData.height = bbox.height - 2;
      labelData.labelNode = shapeSvg.node();
      // We need the label hight to be able to size the subgraph;
      shapeSvg.remove();
    } else {
      // Subgraph without label
      labelData.width = 0;
      labelData.height = 0;
    }
    child.labelData = labelData;
    child.domId = nodeEl;
  }
};

export const addVertices = async function (nodeEl, nodeArr, graph, parentId) {
  const siblings = nodeArr.filter((node) => node.parentId === parentId);
  log.info('addVertices APA12', siblings, parentId);
  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  await Promise.all(
    siblings.map(async (node) => {
      await addVertex(nodeEl, graph, nodeArr, node);
    })
  );
  return graph;
};

const drawNodes = async (relX, relY, nodeArray, svg, subgraphsEl, depth) => {
  Promise.all(
    nodeArray.map(async function (node) {
      if (node) {
        nodeDb[node.id] = node;
        nodeDb[node.id].offset = {
          posX: node.x + relX,
          posY: node.y + relY,
          x: relX,
          y: relY,
          depth,
          width: Math.max(node.width, node.labels ? node.labels[0]?.width || 0 : 0),
          height: node.height,
        };
        if (node.isGroup) {
          console.log('Id abc88 subgraph = ', node.id, node.x, node.y, node.labelData);
          const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
          // TODO use faster way of cloning
          const clusterNode = JSON.parse(JSON.stringify(node));
          clusterNode.x = node.offset.posX + node.width / 2;
          clusterNode.y = node.offset.posY + node.height / 2;
          await insertCluster(subgraphEl, clusterNode);

          console.log('Id (UIO)= ', node.id, node.width, node.shape, node.labels);
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
    })
  );
  nodeArray.forEach(function (node) {
    if (node?.isGroup) {
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
export const addEdges = async function (dataForLayout, graph, svg) {
  log.info('abc78 DAGA edges = ', dataForLayout);
  const edges = dataForLayout.edges;
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  const linkIdCnt = {};
  const dir = dataForLayout.direction || 'DOWN';
  let defaultStyle;
  let defaultLabelStyle;

  await Promise.all(
    edges.map(async function (edge) {
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

      const labelEl = await insertEdgeLabel(labelsEl, edgeData);

      // calculate start and end points of the edge, note that the source and target
      // can be modified for shapes that have ports
      const { source, target, sourceId, targetId } = getEdgeStartEndPoint(edge, dir);
      console.log('abc78 source and target', source, target);
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
    })
  );
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
      'elk.algorithm': algorithm,
      'nodePlacement.strategy': data4Layout.config['elk.nodePlacement.strategy'],
      'elk.layered.mergeEdges': data4Layout.config['elk.mergeEdges'],
      'elk.direction': 'DOWN',
      'spacing.baseValue': 30,
      // 'spacing.nodeNode': 40,
      // 'spacing.nodeNodeBetweenLayers': 45,
      // 'spacing.edgeNode': 40,
      // 'spacing.edgeNodeBetweenLayers': 30,
      // 'spacing.edgeEdge': 30,
      // 'spacing.edgeEdgeBetweenLayers': 40,
      // 'spacing.nodeSelfLoop': 50,
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
  elkGraph = await addEdges(data4Layout, elkGraph, svg);

  // Iterate through all nodes and add the top level nodes to the graph
  const nodes = data4Layout.nodes;
  nodes.forEach((n) => {
    const node = nodeDb[n.id];

    // Subgraph
    if (parentLookupDb.childrenById[node.id] !== undefined) {
      node.labels = [
        {
          text: node.label,
          width: node?.labelData?.width || 50,
          height: node?.labelData?.height || 50,
        },
        (node.width = node.width + 2 * node.paddding),
        console.log('UIO node label', node?.labelData?.width, node.padding),
      ];
      node.layoutOptions = {
        'spacing.baseValue': 30,
        'nodeLabels.placement': '[H_CENTER V_TOP, INSIDE]',
      };
      if (node.dir) {
        node.layoutOptions = {
          ...node.layoutOptions,
          'elk.algorithm': algorithm,
          'elk.direction': dir2ElkDirection(node.dir),
          'nodePlacement.strategy': data4Layout.config['elk.nodePlacement.strategy'],
          'elk.layered.mergeEdges': data4Layout.config['elk.mergeEdges'],
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

  // log.info('before layout', JSON.stringify(elkGraph, null, 2));
  const g = await elk.layout(elkGraph);
  // log.info('after layout', JSON.stringify(g));

  // debugger;
  drawNodes(0, 0, g.children, svg, subGraphsEl, 0);
  g.edges?.map((edge) => {
    // (elem, edge, clusterDb, diagramType, graph, id)
    const startNode = nodeDb[edge.sources[0]];
    const startCluster = parentLookupDb[edge.sources[0]];
    const endNode = nodeDb[edge.targets[0]];
    const sourceId = edge.start;
    const targetId = edge.end;

    const offset = calcOffset(sourceId, targetId, parentLookupDb);
    console.log(
      'offset',
      offset,
      sourceId,
      ' ==> ',
      targetId,
      'edge:',
      edge,
      'cluster:',
      startCluster,
      startNode
    );
    if (edge.sections) {
      const src = edge.sections[0].startPoint;
      const dest = edge.sections[0].endPoint;
      const segments = edge.sections[0].bendPoints ? edge.sections[0].bendPoints : [];

      const segPoints = segments.map((segment) => {
        return { x: segment.x + offset.x, y: segment.y + offset.y };
      });
      edge.points = [
        {
          x: startNode.x + startNode.width / 2 + offset.x,
          y: startNode.y + startNode.height / 2 + offset.y,
        },
        { x: src.x + offset.x, y: src.y + offset.y },
        ...segPoints,
        { x: dest.x + offset.x, y: dest.y + offset.y },
        {
          x: endNode.x + endNode.width / 2 + offset.x,
          y: endNode.y + endNode.height / 2 + offset.y,
        },
      ];
      let sw = startNode.width;
      let ew = endNode.width;
      if (startNode.isGroup) {
        const bbox = startNode.domId.node().getBBox();
        // sw = Math.max(bbox.width, startNode.width, startNode.labels[0].width);
        sw = Math.max(startNode.width, startNode.labels[0].width + startNode.padding);
        // sw = startNode.width;
        console.log(
          'UIO width',
          startNode.id,
          startNode.with,
          'bbox.width=',
          bbox.width,
          'lw=',
          startNode.labels[0].width,
          'node:',
          startNode.width,
          'SW = ',
          sw
          // 'HTML:',
          // startNode.domId.node().innerHTML
        );
      }
      if (endNode.isGroup) {
        const bbox = endNode.domId.node().getBBox();
        ew = Math.max(startNode.width, endNode.labels[0].width + endNode.padding);

        console.log(
          'UIO width',
          startNode.id,
          startNode.with,
          bbox.width,
          'EW = ',
          ew,
          'HTML:',
          startNode.innerHTML
        );
      }
      // // if (startNode.isGroup) {

      edge.points = cutPathAtIntersect(edge.points.reverse(), {
        x: startNode.x + startNode.width / 2 + offset.x,
        y: startNode.y + startNode.height / 2 + offset.y,
        width: sw,
        height: startNode.height,
        intersection: startNode.intersection,
      }).reverse();

      // }
      // if (endNode.isGroup) {
      edge.points = cutPathAtIntersect(edge.points, {
        x: endNode.x + ew / 2 + offset.x,
        y: endNode.y + endNode.height / 2 + offset.y,
        width: ew,
        height: endNode.height,
        intersection: endNode.intersection,
      });
      //   cutPathAtIntersect(edge.points, endNode);
      // }
      const paths = insertEdge(
        edgesEl,
        edge,
        clusterDb,
        data4Layout.type,
        startNode,
        endNode,
        data4Layout.diagramId
      );
      log.info('APA12 edge points after insert', JSON.stringify(edge.points));

      edge.x = edge.labels[0].x + offset.x + edge.labels[0].width / 2;
      edge.y = edge.labels[0].y + offset.y + edge.labels[0].height / 2;
      positionEdgeLabel(edge, paths);
    }
  });
};
export const intersection = (node, outsidePoint, insidePoint) => {
  log.debug(`intersection calc abc89:
  outsidePoint: ${JSON.stringify(outsidePoint)}
  insidePoint : ${JSON.stringify(insidePoint)}
  node        : x:${node.x} y:${node.y} w:${node.width} h:${node.height}`);
  const x = node.x;
  const y = node.y;

  const dx = Math.abs(x - insidePoint.x);
  // const dy = Math.abs(y - insidePoint.y);
  const w = node.width / 2;
  let r = insidePoint.x < outsidePoint.x ? w - dx : w + dx;
  const h = node.height / 2;

  const Q = Math.abs(outsidePoint.y - insidePoint.y);
  const R = Math.abs(outsidePoint.x - insidePoint.x);

  if (Math.abs(y - outsidePoint.y) * w > Math.abs(x - outsidePoint.x) * h) {
    // Intersection is top or bottom of rect.
    let q = insidePoint.y < outsidePoint.y ? outsidePoint.y - h - y : y - h - outsidePoint.y;
    r = (R * q) / Q;
    const res = {
      x: insidePoint.x < outsidePoint.x ? insidePoint.x + r : insidePoint.x - R + r,
      y: insidePoint.y < outsidePoint.y ? insidePoint.y + Q - q : insidePoint.y - Q + q,
    };

    if (r === 0) {
      res.x = outsidePoint.x;
      res.y = outsidePoint.y;
    }
    if (R === 0) {
      res.x = outsidePoint.x;
    }
    if (Q === 0) {
      res.y = outsidePoint.y;
    }

    log.debug(`abc89 topp/bott calc, Q ${Q}, q ${q}, R ${R}, r ${r}`, res); // cspell: disable-line

    return res;
  } else {
    // Intersection onn sides of rect
    if (insidePoint.x < outsidePoint.x) {
      r = outsidePoint.x - w - x;
    } else {
      // r = outsidePoint.x - w - x;
      r = x - w - outsidePoint.x;
    }
    let q = (Q * r) / R;
    //  OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x + dx - w;
    // OK let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
    let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : insidePoint.x - R + r;
    // let _x = insidePoint.x < outsidePoint.x ? insidePoint.x + R - r : outsidePoint.x + r;
    let _y = insidePoint.y < outsidePoint.y ? insidePoint.y + q : insidePoint.y - q;
    log.debug(`sides calc abc89, Q ${Q}, q ${q}, R ${R}, r ${r}`, { _x, _y });
    if (r === 0) {
      _x = outsidePoint.x;
      _y = outsidePoint.y;
    }
    if (R === 0) {
      _x = outsidePoint.x;
    }
    if (Q === 0) {
      _y = outsidePoint.y;
    }

    return { x: _x, y: _y };
  }
};
const outsideNode = (node, point) => {
  console.log('Checking bounds ', node, point);
  const x = node.x;
  const y = node.y;
  const dx = Math.abs(point.x - x);
  const dy = Math.abs(point.y - y);
  const w = node.width / 2;
  const h = node.height / 2;
  if (dx >= w || dy >= h) {
    return true;
  }
  return false;
};
/**
 * This function will page a path and node where the last point(s) in the path is inside the node
 * and return an update path ending by the border of the node.
 *
 * @param {Array} _points
 * @param {any} bounds
 * @returns {Array} Points
 */
const cutPathAtIntersect = (_points, bounds) => {
  console.log('UIO cutPathAtIntersect Points:', _points, 'node:', bounds);
  let points = [];
  let lastPointOutside = _points[0];
  let isInside = false;
  _points.forEach((point) => {
    // const node = clusterDb[edge.toCluster].node;
    console.log(' checking point', point, bounds);

    // check if point is inside the boundary rect
    if (!outsideNode(bounds, point) && !isInside) {
      // First point inside the rect found
      // Calc the intersection coord between the point anf the last point outside the rect
      const inter = intersection(bounds, lastPointOutside, point);
      console.log('abc88 inside', point, lastPointOutside, inter);
      console.log('abc88 intersection', inter, bounds);

      // // Check case where the intersection is the same as the last point
      let pointPresent = false;
      points.forEach((p) => {
        pointPresent = pointPresent || (p.x === inter.x && p.y === inter.y);
      });
      // if (!pointPresent) {
      if (!points.some((e) => e.x === inter.x && e.y === inter.y)) {
        points.push(inter);
      } else {
        console.log('abc88 no intersect', inter, points);
      }
      // points.push(inter);
      isInside = true;
    } else {
      // Outside
      console.log('abc88 outside', point, lastPointOutside, points);
      lastPointOutside = point;
      // points.push(point);
      if (!isInside) {
        points.push(point);
      }
    }
  });
  console.log('returning points', points);
  return points;
};
