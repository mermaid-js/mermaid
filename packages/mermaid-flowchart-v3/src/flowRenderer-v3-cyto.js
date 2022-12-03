import graphlib from 'graphlib';
import { select, line, curveLinear, curveCardinal, curveBasis, selectAll } from 'd3';
import { log, getConfig, setupGraphViewbox } from './mermaidUtils';
import { insertNode } from '../../mermaid/src/dagre-wrapper/nodes.js';
import insertMarkers from '../../mermaid/src/dagre-wrapper/markers.js';
import dagre from 'cytoscape-dagre';

// Replace with other function to avoid dependency to dagre-d3
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';

import common, { evaluate } from '../../mermaid/src/diagrams/common/common';
import { interpolateToCurve, getStylesFromArray } from '../../mermaid/src/utils';

import cytoscape from 'cytoscape';
cytoscape.use(dagre);

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

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
export const addVertices = function (vert, svgId, root, doc, diagObj, parentLookUpDb, graph) {
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
    if (evaluate(getConfig().flowchart.htmlLabels)) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      const node = {
        label: vertexText.replace(
          /fa[blrs]?:fa-[\w-]+/g,
          (s) => `<i class='${s.replace(':', ' ')}'></i>`
        ),
      };
      vertexNode = addHtmlLabel(svg, node).node();
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
    const nodeEl = insertNode(nodes, node, vertex.dir);
    const boundingBox = nodeEl.node().getBBox();
    const data = {
      id: vertex.id,
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
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
      boundingBox,
      el: nodeEl,
      parent: parentLookUpDb.parentById[vertex.id],
    };
    // if (!Object.keys(parentLookUpDb.childrenById).includes(vertex.id)) {
    graph.elements.nodes.push({
      group: 'nodes',
      // data,
      data,
    });
    // }
    log.trace('setNode', {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id,
      domId: diagObj.db.lookUpDomId(vertex.id),
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      dir: vertex.dir,
      props: vertex.props,
      padding: getConfig().flowchart.padding,
      parent: parentLookUpDb.parentById[vertex.id],
    });
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
 */
export const addEdges = function (edges, diagObj, graph) {
  // log.info('abc78 edges = ', edges);
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

    // Add the edge to the graph
    graph.elements.edges.push({
      group: 'edges',
      data: { source: edge.start, target: edge.end, edgeData, id: cnt },
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
  const parentLookUpDb = { parentById: {}, childrenById: {} };
  const subgraphs = db.getSubGraphs();
  log.info('Subgraphs - ', subgraphs);
  subgraphs.forEach(function (subgraph) {
    subgraph.nodes.forEach(function (node) {
      parentLookUpDb.parentById[node] = subgraph.id;
      if (parentLookUpDb.childrenById[subgraph.id] === undefined) {
        parentLookUpDb.childrenById[subgraph.id] = [];
      }
      parentLookUpDb.childrenById[subgraph.id].push(node);
    });
  });

  subgraphs.forEach(function (subgraph) {
    const data = { id: subgraph.id };
    if (parentLookUpDb.parentById[subgraph.id] !== undefined) {
      data.parent = parentLookUpDb.parentById[subgraph.id];
    }
    // cy.add({
    //   group: 'nodes',
    //   data,
    // });
  });
  return parentLookUpDb;
};

const insertEdge = function (edgesEl, edge, edgeData, bounds, diagObj) {
  const src = edge.sourceEndpoint();
  const segments = edge.segmentPoints();
  // const dest = edge.target().position();
  const dest = edge.targetEndpoint();
  const segPoints = segments.map((segment) => [segment.x, segment.y]);
  const points = [
    [src.x, src.y],
    [segments[0].x, segments[0].y],
    [dest.x, dest.y],
  ];
  // console.log('Edge ctrl points:', edge.segmentPoints(), 'Bounds:', bounds, edge.source(), points);
  // console.log('Edge ctrl points:', points);
  const curve = line().curve(curveCardinal);
  const edge2 = edgesEl
    .insert('path')
    .attr('d', curve(points))
    .attr('class', 'path')
    .attr('fill', 'none');
  addmarkers(edge2, edgeData, diagObj.type, diagObj.arrowMarkerAbsolute);
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
      styleEnabled: true,
      // animate: false,
      // ready: function () {
      //   log.info('Ready', this);
      // },
      container: document.getElementById('cy'), // container to render in

      boxSelectionEnabled: false,

      style: [
        {
          selector: 'node',
          css: {
            content: 'data(id)',
            'text-valign': 'center',
            'text-halign': 'center',
          },
        },
        {
          selector: ':parent',
          css: {
            'text-valign': 'top',
            'text-halign': 'center',
          },
        },
        {
          selector: 'edge',
          css: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
          },
        },
      ],

      elements: {
        nodes: [
          { data: { id: 'a', parent: 'b' } },
          { data: { id: 'b' } },
          { data: { id: 'c', parent: 'b' } },
          { data: { id: 'd' } },
          { data: { id: 'e' } },
          { data: { id: 'f', parent: 'e' } },
        ],
        edges: [
          { data: { id: 'ad', source: 'a', target: 'd' } },
          { data: { id: 'eb', source: 'e', target: 'b' } },
        ],
      },
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

    const parentLookUpDb = addSubGraphs(diagObj.db);
    graph = addVertices(vert, id, root, doc, diagObj, parentLookUpDb, graph);
    const edgesEl = svg.insert('g').attr('class', 'edges edgePath');
    const edges = diagObj.db.getEdges();
    graph = addEdges(edges, diagObj, graph);

    const cy = cytoscape(graph);

    // c.style();
    // Make cytoscape care about the dimensions of the nodes
    cy.nodes().forEach(function (n) {
      const boundingBox = n.data().boundingBox;
      if (boundingBox) {
        n.style('width', boundingBox.width);
        n.style('height', boundingBox.height);
      }
      n.style('shape', 'rectangle');
      // n.layoutDimensions = () => {
      //   // console.log('Node dimensions', boundingBox.width, boundingBox.height);
      //   if (boundingBox) {
      //     return { w: boundingBox.width, h: boundingBox.height };
      //   }
      //   // return { w: boundingBox.width, h: boundingBox.height };

      //   // const data = n.data();
      //   // return { w: data.width, h: data.height };

      //   return { w: 206, h: 160 };
      // };
    });

    cy.layout({
      // name: 'dagre',
      // name: 'preset',
      // name: 'cose',
      // name: 'circle',
      name: 'concentric',
      headless: false,
      styleEnabled: true,
      animate: false,
    }).run();

    // function runLayouts(fit, callBack) {
    //   // step-1 position child nodes
    //   var parentNodes = cy.nodes(':parent');
    //   var grid_layout = parentNodes.descendants().layout({
    //     name: 'grid',
    //     cols: 1,
    //     fit: fit,
    //   });
    //   grid_layout.promiseOn('layoutstop').then(function (event) {
    //     // step-2 position parent nodes
    //     var dagre_layout = parentNodes.layout({
    //       name: 'dagre',
    //       rankDir: 'TB',
    //       fit: fit,
    //     });
    //     dagre_layout.promiseOn('layoutstop').then(function (event) {
    //       if (callBack) {
    //         callBack.call(cy, event);
    //       }
    //     });
    //     dagre_layout.run();
    //   });
    //   grid_layout.run();
    // }
    // runLayouts();

    // log.info('Positions', cy.nodes().positions());
    // window.cy = cy;
    cy.ready((e) => {
      log.info('Ready', e, cy.data());
      //   // setTimeout(() => {
      cy.nodes().map((node, id) => {
        const data = node.data();

        log.info(
          'Position: (',
          node.position().x,
          ', ',
          node.position().y,
          ')',
          data,
          cy.elements()[0].renderedBoundingBox()
        );
        if (data.el) {
          data.el.attr('transform', `translate(${node.position().x}, ${node.position().y})`);
          // document
          //   .querySelector(`[id="${data.domId}"]`)
          //   .setAttribute('transform', `translate(${node.position().x}, ${node.position().y})`);
          log.info('Id = ', data.domId, svg.select(`[id="${data.domId}"]`), data.el.node());
        }
        // else {
        //   // console.log('No element found for node', data, node.position(), node.size());
        // }
      });

      cy.edges().map((edge, id) => {
        const data = edge.data();
        if (edge[0]._private.bodyBounds) {
          const bounds = edge[0]._private.rscratch;
          // insertEdge(edgesEl, edge, data.edgeData, bounds, diagObj);
        }
      });

      log.info(cy.json());
      setupGraphViewbox({}, svg, conf.diagramPadding, conf.useMaxWidth);
      // Remove element after layout
      // renderEl.remove();
      resolve();
      // }, 500);
    });
  });
};

export default {
  // setConf,
  // addVertices,
  // addEdges,
  getClasses,
  draw,
};
