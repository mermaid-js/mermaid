import { select, line, curveLinear } from 'd3';
import { insertNode } from '../../../dagre-wrapper/nodes.js';
import insertMarkers from '../../../dagre-wrapper/markers.js';
import { insertEdgeLabel } from '../../../dagre-wrapper/edges.js';
import { findCommonAncestor } from './render-utils';
import { labelHelper } from '../../../dagre-wrapper/shapes/util';
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';
import { getConfig } from '../../../config';
import { log } from '../../../logger';
import { setupGraphViewbox } from '../../../setupGraphViewbox';
import common, { evaluate } from '../../common/common';
import { interpolateToCurve, getStylesFromArray } from '../../../utils';
import ELK from 'elkjs/lib/elk.bundled.js';
const elk = new ELK();

const portPos = {};

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

let nodeDb = {};

// /**
//  * Function that adds the vertices found during parsing to the graph to be rendered.
//  *
//  * @param vert Object containing the vertices.
//  * @param g The graph that is to be drawn.
//  * @param svgId
//  * @param root
//  * @param doc
//  * @param diagObj
//  */
export const addVertices = function (vert, svgId, root, doc, diagObj, parentLookupDb, graph) {
  const svg = root.select(`[id="${svgId}"]`);
  const nodes = svg.insert('g').attr('class', 'nodes');
  const keys = Object.keys(vert);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertex = vert[id];

    /**
     * Variable for storing the classes for the vertex
     *
     * @type {string}
     */
    let classStr = 'default';
    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }
    classStr = classStr + ' flowchart-label';
    const styles = getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    let vertexNode;
    const labelData = { width: 0, height: 0 };

    const ports = [
      {
        id: vertex.id + '-west',
        layoutOptions: {
          'port.side': 'WEST',
        },
      },
      {
        id: vertex.id + '-east',
        layoutOptions: {
          'port.side': 'EAST',
        },
      },
      {
        id: vertex.id + '-south',
        layoutOptions: {
          'port.side': 'SOUTH',
        },
      },
      {
        id: vertex.id + '-north',
        layoutOptions: {
          'port.side': 'NORTH',
        },
      },
    ];

    let radious = 0;
    let _shape = '';
    let layoutOptions = {};
    // Set the shape based parameters
    switch (vertex.type) {
      case 'round':
        radious = 5;
        _shape = 'rect';
        break;
      case 'square':
        _shape = 'rect';
        break;
      case 'diamond':
        _shape = 'question';
        layoutOptions = {
          portConstraints: 'FIXED_SIDE',
        };
        break;
      case 'hexagon':
        _shape = 'hexagon';
        break;
      case 'odd':
        _shape = 'rect_left_inv_arrow';
        break;
      case 'lean_right':
        _shape = 'lean_right';
        break;
      case 'lean_left':
        _shape = 'lean_left';
        break;
      case 'trapezoid':
        _shape = 'trapezoid';
        break;
      case 'inv_trapezoid':
        _shape = 'inv_trapezoid';
        break;
      case 'odd_right':
        _shape = 'rect_left_inv_arrow';
        break;
      case 'circle':
        _shape = 'circle';
        break;
      case 'ellipse':
        _shape = 'ellipse';
        break;
      case 'stadium':
        _shape = 'stadium';
        break;
      case 'subroutine':
        _shape = 'subroutine';
        break;
      case 'cylinder':
        _shape = 'cylinder';
        break;
      case 'group':
        _shape = 'rect';
        break;
      case 'doublecircle':
        _shape = 'doublecircle';
        break;
      default:
        _shape = 'rect';
    }

    // Add the node
    const node = {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      labelType: vertex.labelType,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id,
      link: vertex.link,
      linkTarget: vertex.linkTarget,
      tooltip: diagObj.db.getTooltip(vertex.id) || '',
      domId: diagObj.db.lookUpDomId(vertex.id),
      haveCallback: vertex.haveCallback,
      width: vertex.type === 'group' ? 500 : undefined,
      dir: vertex.dir,
      type: vertex.type,
      props: vertex.props,
      padding: getConfig().flowchart.padding,
    };
    let boundingBox;
    let nodeEl;

    // Add the element to the DOM
    if (node.type !== 'group') {
      nodeEl = insertNode(nodes, node, vertex.dir);
      boundingBox = nodeEl.node().getBBox();
    } else {
      const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      // svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));
      // const rows = vertexText.split(common.lineBreakRegex);
      // for (const row of rows) {
      //   const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      //   tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      //   tspan.setAttribute('dy', '1em');
      //   tspan.setAttribute('x', '1');
      //   tspan.textContent = row;
      //   svgLabel.appendChild(tspan);
      // }
      // vertexNode = svgLabel;
      // const bbox = vertexNode.getBBox();
      const { shapeSvg, bbox } = labelHelper(nodes, node, undefined, true);
      labelData.width = bbox.width;
      labelData.wrappingWidth = getConfig().flowchart.wrappingWidth;
      labelData.height = bbox.height;
      labelData.labelNode = shapeSvg.node();
      node.labelData = labelData;
    }
    // const { shapeSvg, bbox } = labelHelper(svg, node, undefined, true);

    const data = {
      id: vertex.id,
      ports: vertex.type === 'diamond' ? ports : [],
      // labelStyle: styles.labelStyle,
      // shape: _shape,
      layoutOptions,
      labelText: vertexText,
      labelData,
      // labels: [{ text: vertexText }],
      // rx: radius,
      // ry: radius,
      // class: classStr,
      // style: styles.style,
      // link: vertex.link,
      // linkTarget: vertex.linkTarget,
      // tooltip: diagObj.db.getTooltip(vertex.id) || '',
      domId: diagObj.db.lookUpDomId(vertex.id),
      // haveCallback: vertex.haveCallback,
      width: boundingBox?.width,
      height: boundingBox?.height,
      // dir: vertex.dir,
      type: vertex.type,
      // props: vertex.props,
      // padding: getConfig().flowchart.padding,
      // boundingBox,
      el: nodeEl,
      parent: parentLookupDb.parentById[vertex.id],
    };
    // if (!Object.keys(parentLookupDb.childrenById).includes(vertex.id)) {
    // graph.children.push({
    //   ...data,
    // });
    // }
    nodeDb[node.id] = data;
    // log.trace('setNode', {
    //   labelStyle: styles.labelStyle,
    //   shape: _shape,
    //   labelText: vertexText,
    //   rx: radius,
    //   ry: radius,
    //   class: classStr,
    //   style: styles.style,
    //   id: vertex.id,
    //   domId: diagObj.db.lookUpDomId(vertex.id),
    //   width: vertex.type === 'group' ? 500 : undefined,
    //   type: vertex.type,
    //   dir: vertex.dir,
    //   props: vertex.props,
    //   padding: getConfig().flowchart.padding,
    //   parent: parentLookupDb.parentById[vertex.id],
    // });
  });
  return graph;
};

const getNextPosition = (position, edgeDirection, graphDirection) => {
  const portPos = {
    TB: {
      in: {
        north: 'north',
      },
      out: {
        south: 'west',
        west: 'east',
        east: 'south',
      },
    },
    LR: {
      in: {
        west: 'west',
      },
      out: {
        east: 'south',
        south: 'north',
        north: 'east',
      },
    },
    RL: {
      in: {
        east: 'east',
      },
      out: {
        west: 'north',
        north: 'south',
        south: 'west',
      },
    },
    BT: {
      in: {
        south: 'south',
      },
      out: {
        north: 'east',
        east: 'west',
        west: 'north',
      },
    },
  };
  portPos.TD = portPos.TB;
  log.info('abc88', graphDirection, edgeDirection, position);
  return portPos[graphDirection][edgeDirection][position];
  // return 'south';
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

const getEdgeStartEndPoint = (edge, dir) => {
  let source = edge.start;
  let target = edge.end;

  // Save the original source and target
  const sourceId = source;
  const targetId = target;

  const startNode = nodeDb[source];
  const endNode = nodeDb[target];

  if (!startNode || !endNode) {
    return { source, target };
  }

  if (startNode.type === 'diamond') {
    source = `${source}-${getNextPort(source, 'out', dir)}`;
  }

  if (endNode.type === 'diamond') {
    target = `${target}-${getNextPort(target, 'in', dir)}`;
  }

  // Add the edge to the graph
  return { source, target, sourceId, targetId };
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param {object} edges The edges to add to the graph
 * @param {object} g The graph object
 * @param cy
 * @param diagObj
 * @param graph
 * @param svg
 */
export const addEdges = function (edges, diagObj, graph, svg) {
  log.info('abc78 edges = ', edges);
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  let linkIdCnt = {};
  let dir = diagObj.db.getDirection();
  let defaultStyle;
  let defaultLabelStyle;

  if (edges.defaultStyle !== undefined) {
    const defaultStyles = getStylesFromArray(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function (edge) {
    // Identify Link
    var linkIdBase = 'L-' + edge.start + '-' + edge.end;
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
    var linkNameStart = 'LS-' + edge.start;
    var linkNameEnd = 'LE-' + edge.end;

    const edgeData = { style: '', labelStyle: '' };
    edgeData.minlen = edge.length || 1;
    //edgeData.id = 'id' + cnt;

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
    if (edge.style !== undefined) {
      const styles = getStylesFromArray(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    }

    edgeData.style = edgeData.style += style;
    edgeData.labelStyle = edgeData.labelStyle += labelStyle;

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
    edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

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

// TODO: break out and share with dagre wrapper. The current code in dagre wrapper also adds
// adds the line to the graph, but we don't need that here. This is why we cant use the dagre
// wrapper directly for this
/**
 * Add the markers to the edge depending on the type of arrow is
 * @param svgPath
 * @param edgeData
 * @param diagramType
 * @param arrowMarkerAbsolute
 */
const addMarkersToEdge = function (svgPath, edgeData, diagramType, arrowMarkerAbsolute) {
  let url = '';
  // Check configuration for absolute path
  if (arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  // look in edge data and decide which marker to use
  switch (edgeData.arrowTypeStart) {
    case 'arrow_cross':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-crossStart' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-pointStart' + ')');
      break;
    case 'arrow_barb':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-barbStart' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-circleStart' + ')');
      break;
    case 'aggregation':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-aggregationStart' + ')');
      break;
    case 'extension':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-extensionStart' + ')');
      break;
    case 'composition':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-compositionStart' + ')');
      break;
    case 'dependency':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-dependencyStart' + ')');
      break;
    case 'lollipop':
      svgPath.attr('marker-start', 'url(' + url + '#' + diagramType + '-lollipopStart' + ')');
      break;
    default:
  }
  switch (edgeData.arrowTypeEnd) {
    case 'arrow_cross':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-crossEnd' + ')');
      break;
    case 'arrow_point':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-pointEnd' + ')');
      break;
    case 'arrow_barb':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-barbEnd' + ')');
      break;
    case 'arrow_circle':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-circleEnd' + ')');
      break;
    case 'aggregation':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-aggregationEnd' + ')');
      break;
    case 'extension':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-extensionEnd' + ')');
      break;
    case 'composition':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-compositionEnd' + ')');
      break;
    case 'dependency':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-dependencyEnd' + ')');
      break;
    case 'lollipop':
      svgPath.attr('marker-end', 'url(' + url + '#' + diagramType + '-lollipopEnd' + ')');
      break;
    default:
  }
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {object} ClassDef styles
 */
export const getClasses = function (text, diagObj) {
  log.info('Extracting classes');
  diagObj.db.clear('ver-2');
  try {
    // Parse the graph definition
    diagObj.parse(text);
    return diagObj.db.getClasses();
  } catch (e) {
    return {};
  }
};

const addSubGraphs = function (db) {
  const parentLookupDb = { parentById: {}, childrenById: {} };
  const subgraphs = db.getSubGraphs();
  log.info('Subgraphs - ', subgraphs);
  subgraphs.forEach(function (subgraph) {
    subgraph.nodes.forEach(function (node) {
      parentLookupDb.parentById[node] = subgraph.id;
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

const calcOffset = function (src, dest, parentLookupDb) {
  const ancestor = findCommonAncestor(src, dest, parentLookupDb);
  if (ancestor === undefined || ancestor === 'root') {
    return { x: 0, y: 0 };
  }

  const ancestorOffset = nodeDb[ancestor].offset;
  return { x: ancestorOffset.posX, y: ancestorOffset.posY };
};

const insertEdge = function (edgesEl, edge, edgeData, diagObj, parentLookupDb) {
  const offset = calcOffset(edge.sourceId, edge.targetId, parentLookupDb);

  const src = edge.sections[0].startPoint;
  const dest = edge.sections[0].endPoint;
  const segments = edge.sections[0].bendPoints ? edge.sections[0].bendPoints : [];

  const segPoints = segments.map((segment) => [segment.x + offset.x, segment.y + offset.y]);
  const points = [
    [src.x + offset.x, src.y + offset.y],
    ...segPoints,
    [dest.x + offset.x, dest.y + offset.y],
  ];

  // const curve = line().curve(curveBasis);
  const curve = line().curve(curveLinear);
  const edgePath = edgesEl
    .insert('path')
    .attr('d', curve(points))
    .attr('class', 'path')
    .attr('fill', 'none');
  const edgeG = edgesEl.insert('g').attr('class', 'edgeLabel');
  const edgeWithLabel = select(edgeG.node().appendChild(edge.labelEl));
  const box = edgeWithLabel.node().firstChild.getBoundingClientRect();
  edgeWithLabel.attr('width', box.width);
  edgeWithLabel.attr('height', box.height);

  edgeG.attr(
    'transform',
    `translate(${edge.labels[0].x + offset.x}, ${edge.labels[0].y + offset.y})`
  );
  addMarkersToEdge(edgePath, edgeData, diagObj.type, diagObj.arrowMarkerAbsolute);
};

/**
 * Recursive function that iterates over an array of nodes and inserts the children of each node.
 * It also recursively populates the inserts the children of the children and so on.
 * @param {*} graph
 * @param nodeArray
 * @param parentLookupDb
 */
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

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text
 * @param id
 */

export const draw = async function (text, id, _version, diagObj) {
  // Add temporary render element
  diagObj.db.clear();
  nodeDb = {};
  diagObj.db.setGen('gen-2');
  // Parse the graph definition
  diagObj.parser.parse(text);

  const renderEl = select('body').append('div').attr('style', 'height:400px').attr('id', 'cy');
  let graph = {
    id: 'root',
    layoutOptions: {
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'org.eclipse.elk.padding': '[top=100, left=100, bottom=110, right=110]',
      'elk.layered.spacing.edgeNodeBetweenLayers': '30',
      // 'elk.layered.mergeEdges': 'true',
      'elk.direction': 'DOWN',
      // 'elk.ports.sameLayerEdges': true,
      // 'nodePlacement.strategy': 'SIMPLE',
    },
    children: [],
    edges: [],
  };
  log.info('Drawing flowchart using v3 renderer', elk);

  // Set the direction,
  // Fetch the default direction, use TD if none was found
  let dir = diagObj.db.getDirection();
  switch (dir) {
    case 'BT':
      graph.layoutOptions['elk.direction'] = 'UP';
      break;
    case 'TB':
      graph.layoutOptions['elk.direction'] = 'DOWN';
      break;
    case 'LR':
      graph.layoutOptions['elk.direction'] = 'RIGHT';
      break;
    case 'RL':
      graph.layoutOptions['elk.direction'] = 'LEFT';
      break;
  }
  const { securityLevel, flowchart: conf } = getConfig();

  // Find the root dom node to ne used in rendering
  // Handle root and document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  const svg = root.select(`[id="${id}"]`);

  // Define the supported markers for the diagram
  const markers = ['point', 'circle', 'cross'];

  // Add the marker definitions to the svg as marker tags
  insertMarkers(svg, markers, diagObj.type, diagObj.arrowMarkerAbsolute);

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const vert = diagObj.db.getVertices();

  // Setup nodes from the subgraphs with type group, these will be used
  // as nodes with children in the subgraph
  let subG;
  const subGraphs = diagObj.db.getSubGraphs();
  log.info('Subgraphs - ', subGraphs);
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    diagObj.db.addVertex(
      subG.id,
      { text: subG.title, type: subG.labelType },
      'group',
      undefined,
      subG.classes,
      subG.dir
    );
  }

  // debugger;
  // Add an element in the svg to be used to hold the subgraphs container
  // elements
  const subGraphsEl = svg.insert('g').attr('class', 'subgraphs');

  // Create the lookup db for the subgraphs and their children to used when creating
  // the tree structured graph
  const parentLookupDb = addSubGraphs(diagObj.db);

  // Add the nodes to the graph, this will entail creating the actual nodes
  // in order to get the size of the node. You can't get the size of a node
  // that is not in the dom so we need to add it to the dom, get the size
  // we will position the nodes when we get the layout from elkjs
  graph = addVertices(vert, id, root, doc, diagObj, parentLookupDb, graph, svg);

  // Time for the edges, we start with adding an element in the node to hold the edges
  const edgesEl = svg.insert('g').attr('class', 'edges edgePath');
  // Fetch the edges form the parsed graph definition
  const edges = diagObj.db.getEdges();

  // Add the edges to the graph, this will entail creating the actual edges
  graph = addEdges(edges, diagObj, graph, svg);

  // Iterate through all nodes and add the top level nodes to the graph
  const nodes = Object.keys(nodeDb);
  nodes.forEach((nodeId) => {
    const node = nodeDb[nodeId];
    if (!node.parent) {
      graph.children.push(node);
    }
    // Subgraph
    if (parentLookupDb.childrenById[nodeId] !== undefined) {
      node.labels = [
        {
          text: node.labelText,
          layoutOptions: {
            'nodeLabels.placement': '[H_CENTER, V_TOP, INSIDE]',
          },
          width: node.labelData.width,
          height: node.labelData.height,
          // width: 100,
          // height: 100,
        },
      ];
      delete node.x;
      delete node.y;
      delete node.width;
      delete node.height;
    }
  });

  insertChildren(graph.children, parentLookupDb);
  log.info('after layout', JSON.stringify(graph, null, 2));
  const g = await elk.layout(graph);
  drawNodes(0, 0, g.children, svg, subGraphsEl, diagObj, 0);
  log.info('after layout', g);
  g.edges?.map((edge) => {
    insertEdge(edgesEl, edge, edge.edgeData, diagObj, parentLookupDb);
  });
  setupGraphViewbox({}, svg, conf.diagramPadding, conf.useMaxWidth);
  // Remove element after layout
  renderEl.remove();
};

const drawNodes = (relX, relY, nodeArray, svg, subgraphsEl, diagObj, depth) => {
  nodeArray.forEach(function (node) {
    if (node) {
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
        const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
        subgraphEl
          .insert('rect')
          .attr('class', 'subgraph subgraph-lvl-' + (depth % 5) + ' node')
          .attr('x', node.x + relX)
          .attr('y', node.y + relY)
          .attr('width', node.width)
          .attr('height', node.height);
        const label = subgraphEl.insert('g').attr('class', 'label');
        label.attr(
          'transform',
          `translate(${node.labels[0].x + relX + node.x}, ${node.labels[0].y + relY + node.y})`
        );
        label.node().appendChild(node.labelData.labelNode);

        log.info('Id (UGH)= ', node.type, node.labels);
      } else {
        log.info('Id (UGH)= ', node.id);
        node.el.attr(
          'transform',
          `translate(${node.x + relX + node.width / 2}, ${node.y + relY + node.height / 2})`
        );
      }
    }
  });
  nodeArray.forEach(function (node) {
    if (node && node.type === 'group') {
      drawNodes(relX + node.x, relY + node.y, node.children, svg, subgraphsEl, diagObj, depth + 1);
    }
  });
};

export default {
  getClasses,
  draw,
};
