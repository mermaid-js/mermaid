import graphlib from 'graphlib';
import { select, line, curveLinear, curveCardinal, curveBasis, selectAll } from 'd3';
import { log, getConfig, setupGraphViewbox } from './mermaidUtils';
import { insertNode } from '../../mermaid/src/dagre-wrapper/nodes.js';
import insertMarkers from '../../mermaid/src/dagre-wrapper/markers.js';
import createLabel from '../../mermaid/src/dagre-wrapper/createLabel';
import dagre from 'cytoscape-dagre';
// Replace with other function to avoid dependency to dagre-d3
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';

import common, { evaluate } from '../../mermaid/src/diagrams/common/common';
import { interpolateToCurve, getStylesFromArray } from '../../mermaid/src/utils';

// import ELK from 'elkjs/lib/elk-api';
// const elk = new ELK({
//   workerUrl: './elk-worker.min.js',
// });
import ELK from 'elkjs/lib/elk.bundled.js';
const elk = new ELK();

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

const nodeDb = {};

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

    const styles = getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    let vertexNode;
    const labelData = { width: 0, height: 0 };
    if (evaluate(getConfig().flowchart.htmlLabels)) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      const node = {
        label: vertexText.replace(
          /fa[blrs]?:fa-[\w-]+/g,
          (s) => `<i class='${s.replace(':', ' ')}'></i>`
        ),
      };
      vertexNode = addHtmlLabel(svg, node).node();
      const bbox = vertexNode.getBBox();
      labelData.width = bbox.width;
      labelData.height = bbox.height;
      labelData.labelNode = vertexNode;
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

      const rows = vertexText.split(common.lineBreakRegex);

      for (const row of rows) {
        const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        tspan.setAttribute('dy', '1em');
        tspan.setAttribute('x', '1');
        tspan.textContent = row;
        svgLabel.appendChild(tspan);
      }
      vertexNode = svgLabel;
      const bbox = vertexNode.getBBox();
      labelData.width = bbox.width;
      labelData.height = bbox.height;
      labelData.labelNode = vertexNode;
    }

    let radious = 0;
    let _shape = '';
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
    // // Add the node
    const node = {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
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
    if (node.type !== 'group') {
      nodeEl = insertNode(nodes, node, vertex.dir);
      boundingBox = nodeEl.node().getBBox();
    }

    const data = {
      id: vertex.id,
      // labelStyle: styles.labelStyle,
      // shape: _shape,
      labelText: vertexText,
      labelData,
      // labels: [{ text: vertexText }],
      // rx: radious,
      // ry: radious,
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
    //   rx: radious,
    //   ry: radious,
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
  // log.info('abc78 edges = ', edges);
  const labelsEl = svg.insert('g').attr('class', 'edgeLabels');
  let cnt = 0;
  let linkIdCnt = {};

  let defaultStyle;
  let defaultLabelStyle;

  if (edges.defaultStyle !== undefined) {
    const defaultStyles = getStylesFromArray(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function (edge) {
    cnt++;

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

    edgeData.labelType = 'text';
    edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

    if (edge.style === undefined) {
      edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

    const labelEl = createLabel(edgeData.label, edgeData.labelStyle);
    labelsEl.node().appendChild(labelEl);
    const labelBox = labelEl.firstChild.getBoundingClientRect();
    // console.log('labelEl', labelEl);
    // Add the edge to the graph
    graph.edges.push({
      id: 'e' + edge.start + edge.end,
      sources: [edge.start],
      targets: [edge.end],
      labelEl: labelEl,
      labels: [
        {
          width: labelBox.width,
          // width: 80,
          height: labelBox.height,
          orgWidth: labelBox.width,
          orgHeight: labelBox.height,
          text: edgeData.label,
          layoutOptions: {
            'edgeLabels.inline': 'true',
            'edgeLabels.placement': 'CENTER',
          },
        },
      ],
      edgeData,
      // targetPort: 'PortSide.NORTH',
      // id: cnt,
    });
  });
  return graph;
};

const addmarkers = function (svgPath, edgeData, diagramType, arrowMarkerAbsolute) {
  // // TODO: Can we load this config only from the rendered graph type?
  let url;
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
    return;
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
    // cy.add({
    //   group: 'nodes',
    //   data,
    // });
  });
  return parentLookupDb;
};

/* Reverse engineered with trial and error */
const calcOffset = function (src, dest, sourceId, targetId) {
  if (src === dest) {
    return src;
  }
  return 0;
};

const insertEdge = function (edgesEl, edge, edgeData, diagObj) {
  const srcOffset = nodeDb[edge.sources[0]].offset;
  const targetOffset = nodeDb[edge.targets[0]].offset;
  const offset = {
    x: calcOffset(
      srcOffset.x,
      targetOffset.x,
      nodeDb[edge.sources[0]].id,
      nodeDb[edge.targets[0]].id
    ),
    y: calcOffset(
      srcOffset.y,
      targetOffset.y,
      nodeDb[edge.sources[0]].id,
      nodeDb[edge.targets[0]].id
    ),
  };
  // console.log('srcOffset', srcOffset.x, targetOffset.x, srcOffset.y, targetOffset.y);
  const src = edge.sections[0].startPoint;
  const dest = edge.sections[0].endPoint;
  const segments = edge.sections[0].bendPoints ? edge.sections[0].bendPoints : [];
  // const dest = edge.target().position();
  // const dest = edge.targetEndpoint();
  const segPoints = segments.map((segment) => [segment.x + offset.x, segment.y + offset.y]);
  const points = [
    [src.x + offset.x, src.y + offset.y],
    ...segPoints,
    [dest.x + offset.x, dest.y + offset.y],
  ];
  // console.log('Edge ctrl points:', edge.segmentPoints(), 'Bounds:', bounds, edge.source(), points);
  // console.log('Edge ctrl points:', points);
  // const curve = line().curve(curveCardinal);
  const curve = line().curve(curveLinear);
  const edgePath = edgesEl
    .insert('path')
    .attr('d', curve(points))
    // .attr('d', points))
    .attr('class', 'path')
    .attr('fill', 'none');
  const edgeG = edgesEl.insert('g').attr('class', 'edgeLabel');
  const edgeEl = select(edgeG.node().appendChild(edge.labelEl));
  // console.log('Edge label', edgeEl, edge);
  const box = edgeEl.node().firstChild.getBoundingClientRect();
  edgeEl.attr('width', box.width);
  edgeEl.attr('height', box.height);
  // edgeEl.height = 24;
  edgeG.attr(
    'transform',
    `translate(${edge.labels[0].x - box.width / 2}, ${edge.labels[0].y - box.height / 2})`
  );
  addmarkers(edgesEl, edgeData, diagObj.type, diagObj.arrowMarkerAbsolute);
  // edgesEl
  //   .append('circle')
  //   .style('stroke', 'red')
  //   .style('fill', 'red')
  //   .attr('r', 1)
  //   .attr('cx', src.x)
  //   .attr('cy', src.y);
  // edgesEl
  //   .append('circle')
  //   .style('stroke', 'white')
  //   .style('fill', 'white')
  //   .attr('r', 1)
  //   .attr('cx', segments[0].x)
  //   .attr('cy', segments[0].y);
  // edgesEl
  //   .append('circle')
  //   .style('stroke', 'pink')
  //   .style('fill', 'pink')
  //   .attr('r', 1)
  //   .attr('cx', dest.x)
  //   .attr('cy', dest.y);
};

/**
 *
 * @param {*} graph
 * @param nodeArray
 * @param parentLookupDb
 */
const insertChildren = (nodeArray, parentLookupDb) => {
  nodeArray.forEach((node) => {
    if (!node.children) {
      node.children = [];
    }
    const childIds = parentLookupDb.childrenById[node.id];
    // console.log('UGH', node.id, childIds);
    if (childIds) {
      childIds.forEach((childId) => {
        node.children.push(nodeDb[childId]);
      });
    }
    insertChildren(node.children, parentLookupDb);
  });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text
 * @param id
 */

export const draw = function (text, id, _version, diagObj) {
  // Add temporary render element
  diagObj.db.clear();
  diagObj.db.setGen('gen-2');
  // Parse the graph definition
  diagObj.parser.parse(text);

  return new Promise(function (resolve, reject) {
    const renderEl = select('body').append('div').attr('style', 'height:400px').attr('id', 'cy');
    // .attr('style', 'display:none')
    let graph = {
      id: 'root',
      layoutOptions: {
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'org.eclipse.elk.padding': '[top=100, left=100, bottom=110, right=110]',
        // 'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': 120,
        // 'elk.layered.spacing.nodeNodeBetweenLayers': '140',
        'elk.layered.spacing.edgeNodeBetweenLayers': '30',
        //   'elk.algorithm': 'layered',
        'elk.direction': 'WEST',
        //   'elk.port.side': 'SOUTH',
        // 'nodePlacement.strategy': 'SIMPLE',
        // 'org.eclipse.elk.spacing.labelLabel': 120,
        // 'org.eclipse.elk.graphviz.concentrate': true,
        // 'org.eclipse.elk.spacing.nodeNode': 120,
        // 'org.eclipse.elk.spacing.edgeEdge': 120,
        // 'org.eclipse.elk.spacing.edgeNode': 120,
        // 'org.eclipse.elk.spacing.nodeEdge': 120,
        // 'org.eclipse.elk.spacing.componentComponent': 120,
      },
      children: [],
      edges: [],
    };
    log.info('Drawing flowchart using v3 renderer');
    // Fetch the default direction, use TD if none was found
    let dir = diagObj.db.getDirection();
    if (dir === undefined) {
      dir = 'TD';
    }

    const { securityLevel, flowchart: conf } = getConfig();

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
    const markers = ['point', 'circle', 'cross'];
    insertMarkers(svg, markers, diagObj.type, diagObj.arrowMarkerAbsolute);
    // Fetch the vertices/nodes and edges/links from the parsed graph definition
    const vert = diagObj.db.getVertices();

    let subG;
    const subGraphs = diagObj.db.getSubGraphs();
    log.info('Subgraphs - ', subGraphs);
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      subG = subGraphs[i];
      log.info('Subgraph - ', subG);
      diagObj.db.addVertex(subG.id, subG.title, 'group', undefined, subG.classes, subG.dir);
    }
    const subGraphsEl = svg.insert('g').attr('class', 'subgraphs');

    const parentLookupDb = addSubGraphs(diagObj.db);
    graph = addVertices(vert, id, root, doc, diagObj, parentLookupDb, graph);
    const edgesEl = svg.insert('g').attr('class', 'edges edgePath');
    const edges = diagObj.db.getEdges();
    graph = addEdges(edges, diagObj, graph, svg);

    // Iterate through all nodes and add the top level nodes to the graph
    const nodes = Object.keys(nodeDb);
    nodes.forEach((nodeId) => {
      const node = nodeDb[nodeId];
      if (!node.parent) {
        graph.children.push(node);
      }
      // node.nodePadding = [120, 50, 50, 50];
      // node['org.eclipse.elk.spacing.nodeNode'] = 120;
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
          },
        ];
        delete node.x;
        delete node.y;
        delete node.width;
        delete node.height;
      }
    });
    insertChildren(graph.children, parentLookupDb);
    // console.log('Graph (UGH)- ', JSON.parse(JSON.stringify(graph)), JSON.stringify(graph));
    // const graph2 = {
    //   id: 'root',
    //   layoutOptions: { 'elk.algorithm': 'layered' },
    //   children: [
    //     {
    //       id: 'N1',
    //       width: 30,
    //       height: 30,
    //       padding: 12,
    //       children: [
    //         { id: 'n1', width: 30, height: 30 },
    //         { id: 'n2', width: 30, height: 30 },
    //         { id: 'n3', width: 30, height: 30 },
    //       ],
    //     },
    //   ],
    //   edges: [
    //     { id: 'e1', sources: ['n1'], targets: ['n2'] },
    //     { id: 'e2', sources: ['n1'], targets: ['n3'] },
    //   ],
    // };
    elk.layout(graph).then(function (g) {
      // elk.layout(graph2).then(function (g) {
      // console.log('Layout (UGH)- ', g, JSON.stringify(g));
      drawNodes(0, 0, g.children, svg, subGraphsEl, diagObj);

      g.edges.map((edge, id) => {
        // console.log('Edge (UGH)- ', edge);
        insertEdge(edgesEl, edge, edge.edgeData, diagObj);
      });
      setupGraphViewbox({}, svg, conf.diagramPadding, conf.useMaxWidth);
      resolve();
    });
    // Remove element after layout
    // renderEl.remove();
  });
};

const drawNodes = (relX, relY, nodeArray, svg, subgraphsEl, diagObj) => {
  nodeArray.forEach(function (node) {
    if (node) {
      nodeDb[node.id].offset = {
        posX: node.x + relX,
        posY: node.y + relY,
        x: relX,
        y: relY,
      };
      if (node.type === 'group') {
        const subgraphEl = subgraphsEl.insert('g').attr('class', 'subgraph');
        subgraphEl
          .insert('rect')
          .attr('class', 'subgraph node')
          .attr('style', 'fill:#ccc;stroke:black;stroke-width:1')
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
      drawNodes(relX + node.x, relY + node.y, node.children, svg, subgraphsEl, diagObj);
    }
  });
};

export default {
  // setConf,
  // addVertices,
  // addEdges,
  getClasses,
  draw,
};
