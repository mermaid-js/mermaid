import graphlib from 'graphlib';
import { select, curveLinear, selectAll } from 'd3';

import flowDb from './flowDb';
import { getConfig } from '../../config';
import { insertNode } from '../../dagre-wrapper/nodes.js';
import { render } from '../../dagre-wrapper/index.js';
import addHtmlLabel from 'dagre-d3/lib/label/add-html-label.js';
import { log } from '../../logger';
import common, { evaluate } from '../common/common';
import { interpolateToCurve, getStylesFromArray } from '../../utils';
import { setupGraphViewbox } from '../../setupGraphViewbox';
import addSVGAccessibilityFields from '../../accessibility';

import cytoscape from 'cytoscape';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
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
export const addVertices = function (vert, cy, svgId, root, doc, diagObj) {
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
          /fa[lrsb]?:fa-[\w-]+/g,
          (s) => `<i class='${s.replace(':', ' ')}'></i>`
        ),
      };
      vertexNode = addHtmlLabel(svg, node).node();
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      const svgLabel = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

      const rows = vertexText.split(common.lineBreakRegex);

      for (let j = 0; j < rows.length; j++) {
        const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        tspan.setAttribute('dy', '1em');
        tspan.setAttribute('x', '1');
        tspan.textContent = rows[j];
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
    cy.add({
      group: 'nodes',
      data: {
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
      },
    });

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
    });
  });
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param {object} edges The edges to add to the graph
 * @param {object} g The graph object
 * @param cy
 * @param diagObj
 */
export const addEdges = function (edges, cy, diagObj) {
  // log.info('abc78 edges = ', edges);
  let cnt = 0;
  let linkIdCnt = {};

  let defaultStyle;
  let defaultLabelStyle;

  if (typeof edges.defaultStyle !== 'undefined') {
    const defaultStyles = getStylesFromArray(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function (edge) {
    cnt++;

    // Identify Link
    var linkIdBase = 'L-' + edge.start + '-' + edge.end;
    // count the links from+to the same node to give unique id
    if (typeof linkIdCnt[linkIdBase] === 'undefined') {
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
        if (typeof defaultStyle !== 'undefined') {
          style = defaultStyle;
        }
        if (typeof defaultLabelStyle !== 'undefined') {
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
    if (typeof edge.style !== 'undefined') {
      const styles = getStylesFromArray(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    }

    edgeData.style = edgeData.style += style;
    edgeData.labelStyle = edgeData.labelStyle += labelStyle;

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
    } else if (typeof edges.defaultInterpolate !== 'undefined') {
      edgeData.curve = interpolateToCurve(edges.defaultInterpolate, curveLinear);
    } else {
      edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';
    }

    edgeData.labelType = 'text';
    edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

    if (typeof edge.style === 'undefined') {
      edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

    // Add the edge to the graph
    cy.add({ group: 'edges', data: { source: edge.start, target: edge.end, edgeData, id: cnt } });
  });
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
  diagObj.db.clear();
  try {
    // Parse the graph definition
    diagObj.parse(text);
    return diagObj.db.getClasses();
  } catch (e) {
    return;
  }
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text
 * @param id
 */

export const draw = function (text, id, _version, diagObj) {
  const cy = cytoscape({
    // styleEnabled: false,
    // animate: false,
    // ready: function () {
    //   log.info('Ready', this);
    // },
    container: document.getElementById('cy'), // container to render in

    elements: [
      // list of graph elements to start with
      // { // node a
      //   data: { id: 'a' }
      // },
      // { // node b
      //   data: { id: 'b' }
      // },
      // { // edge ab
      //   data: { id: 'ab', source: 'a', target: 'b' }
      // }
    ],

    style: [
      // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          label: 'data(labelText)',
        },
      },

      {
        selector: 'edge',
        style: {
          width: 3,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(id)',
        },
      },
    ],

    layout: {
      name: 'breadthfirst',
      rows: 1,
    },
  });
  log.info('Drawing flowchart using v3 renderer');
  // Fetch the default direction, use TD if none was found
  let dir = diagObj.db.getDirection();
  if (typeof dir === 'undefined') {
    dir = 'TD';
  }

  const { securityLevel, flowchart: conf } = getConfig();
  // const nodeSpacing = conf.nodeSpacing || 50;
  // const rankSpacing = conf.rankSpacing || 50;

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

  const c = cytoscape({
    // name: 'cose',
    name: 'cose',
    container: null,
    layout: {
      boundingBox: {
        x1: 0,
        y1: 0,
        w: 200,
        h: 200,
      },
    },
    headless: true,
    styleEnabled: false,
    animate: false,
    ready: function () {
      log.info('Ready', this);
    },
  });

  const svg = root.select(`[id="${id}"]`);
  const edgesEl = svg.insert('g').attr('class', 'edges edgePath');

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const vert = diagObj.db.getVertices();
  addVertices(vert, cy, id, root, doc, diagObj);
  // c.style();
  // Make cytoscape care about the dimensisions of the nodes
  cy.nodes().forEach(function (n) {
    n.layoutDimensions = () => {
      const boundingBox = n.data().boundingBox;
      return { w: boundingBox.width, h: boundingBox.height };
    };
  });

  const edges = diagObj.db.getEdges();
  addEdges(edges, cy, diagObj);

  cy.layout({
    // name: 'grid',
    name: 'circle',
    // name: 'cose'
  }).run();
  cy.nodes().map((node, id) => {
    const data = node.data();
    log.info(
      'Position: (',
      node.position().x,
      ', ',
      node.position().y,
      ')',
      node.layoutDimensions()
    );
    data.el.attr('transform', `translate(${node.position().x}, ${node.position().y})`);
  });

  cy.edges().map((edge, id) => {
    const data = edge.data();
    if (edge[0]._private.bodyBounds) {
      const bounds = edge[0]._private.bodyBounds;
      log.info(
        id,
        // 'x:',
        // edge.controlPoints(),
        // 'y:',
        edge[0]._private
        // 'w:',
        // edge.boundingbox().w,
        // 'h:',
        // edge.boundingbox().h,
        // edge.midPoint()
      );
      // data.el.attr('transform', `translate(${node.position().x}, ${node.position().y})`);
      edgesEl
        .insert('line')
        .attr('x1', bounds.x1)
        .attr('y1', bounds.y1)
        .attr('x2', bounds.x2)
        .attr('y2', bounds.y2)
        .attr('class', 'path');
    }
  });
  log.info(cy.json());
  setupGraphViewbox({}, svg, conf.diagramPadding, conf.useMaxWidth);
};

export default {
  // setConf,
  // addVertices,
  // addEdges,
  getClasses,
  draw,
};
