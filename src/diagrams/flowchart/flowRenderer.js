import graphlib from 'graphlib';
import { select, curveLinear, selectAll } from 'd3';

import flowDb from './flowDb';
import flow from './parser/flow';
import { getConfig } from '../../config';

import dagreD3 from 'dagre-d3';
import addHtmlLabel from 'dagre-d3/lib/label/add-html-label.js';
import { log } from '../../logger';
import common, { evaluate } from '../common/common';
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
import flowChartShapes from './flowChartShapes';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
export const addVertices = function (vert, g, svgId) {
  const svg = select(`[id="${svgId}"]`);
  const keys = Object.keys(vert);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertex = vert[id];

    /**
     * Variable for storing the classes for the vertex
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
      const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

      const rows = vertexText.split(common.lineBreakRegex);

      for (let j = 0; j < rows.length; j++) {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
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
      default:
        _shape = 'rect';
    }
    // Add the node
    log.warn('Adding node', vertex.id, vertex.domId);
    g.setNode(flowDb.lookUpDomId(vertex.id), {
      labelType: 'svg',
      labelStyle: styles.labelStyle,
      shape: _shape,
      label: vertexNode,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: flowDb.lookUpDomId(vertex.id),
    });
  });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */
export const addEdges = function (edges, g) {
  let cnt = 0;

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
    var linkId = 'L-' + edge.start + '-' + edge.end;
    var linkNameStart = 'LS-' + edge.start;
    var linkNameEnd = 'LE-' + edge.end;

    const edgeData = {};

    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    let style = '';
    let labelStyle = '';

    if (typeof edge.style !== 'undefined') {
      const styles = getStylesFromArray(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none';
          if (typeof defaultStyle !== 'undefined') {
            style = defaultStyle;
          }
          if (typeof defaultLabelStyle !== 'undefined') {
            labelStyle = defaultLabelStyle;
          }
          break;
        case 'dotted':
          style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
          break;
        case 'thick':
          style = ' stroke-width: 3.5px;fill:none';
          break;
      }
    }

    edgeData.style = style;
    edgeData.labelStyle = labelStyle;

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

      if (evaluate(getConfig().flowchart.htmlLabels)) {
        edgeData.labelType = 'html';
        edgeData.label = `<span id="L-${linkId}" class="edgeLabel L-${linkNameStart}' L-${linkNameEnd}">${edge.text.replace(
          /fa[lrsb]?:fa-[\w-]+/g,
          (s) => `<i class='${s.replace(':', ' ')}'></i>`
        )}</span>`;
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

        if (typeof edge.style === 'undefined') {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }

    edgeData.id = linkId;
    edgeData.class = linkNameStart + ' ' + linkNameEnd;
    edgeData.minlen = edge.length || 1;

    // Add the edge to the graph
    g.setEdge(flowDb.lookUpDomId(edge.start), flowDb.lookUpDomId(edge.end), edgeData, cnt);
  });
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
export const getClasses = function (text) {
  log.info('Extracting classes');
  flowDb.clear();
  try {
    const parser = flow.parser;
    parser.yy = flowDb;

    // Parse the graph definition
    parser.parse(text);
    return flowDb.getClasses();
  } catch (e) {
    return;
  }
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function (text, id) {
  log.info('Drawing flowchart');
  flowDb.clear();
  flowDb.setGen('gen-1');
  const parser = flow.parser;
  parser.yy = flowDb;

  // Parse the graph definition
  // try {
  parser.parse(text);
  // } catch (err) {
  // log.debug('Parsing failed');
  // }

  // Fetch the default direction, use TD if none was found
  let dir = flowDb.getDirection();
  if (typeof dir === 'undefined') {
    dir = 'TD';
  }

  const conf = getConfig().flowchart;
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: dir,
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  let subG;
  const subGraphs = flowDb.getSubGraphs();
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    flowDb.addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  }

  // Fetch the verices/nodes and edges/links from the parsed graph definition
  const vert = flowDb.getVertices();
  log.warn('Get vertices', vert);

  const edges = flowDb.getEdges();

  let i = 0;
  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];

    selectAll('cluster').append('text');

    for (let j = 0; j < subG.nodes.length; j++) {
      log.warn(
        'Setting subgraph',
        subG.nodes[j],
        flowDb.lookUpDomId(subG.nodes[j]),
        flowDb.lookUpDomId(subG.id)
      );
      g.setParent(flowDb.lookUpDomId(subG.nodes[j]), flowDb.lookUpDomId(subG.id));
    }
  }
  addVertices(vert, g, id);
  addEdges(edges, g);

  // Create the renderer
  const Render = dagreD3.render;
  const render = new Render();

  // Add custom shapes
  flowChartShapes.addToRender(render);

  // Add our custom arrow - an empty arrowhead
  render.arrows().none = function normal(parent, id, edge, type) {
    const marker = parent
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');

    const path = marker.append('path').attr('d', 'M 0 0 L 0 0 L 0 0 z');
    dagreD3.util.applyStyle(path, edge[type + 'Style']);
  };

  // Override normal arrowhead defined in d3. Remove style & add class to allow css styling.
  render.arrows().normal = function normal(parent, id) {
    const marker = parent
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');

    marker
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('class', 'arrowheadPath')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '1,0');
  };

  // Set up an SVG group so that we can translate the final graph.
  const svg = select(`[id="${id}"]`);
  svg.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  log.warn(g);

  // Run the renderer. This is what draws the final graph.
  const element = select('#' + id + ' g');
  render(element, g);

  element.selectAll('g.node').attr('title', function () {
    return flowDb.getTooltip(this.id);
  });

  const padding = conf.diagramPadding;
  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  svg.attr('viewBox', vBox);

  // Index nodes
  flowDb.indexNodes('subGraph' + i);

  // reposition labels
  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];
    if (subG.title !== 'undefined') {
      const clusterRects = document.querySelectorAll(
        '#' + id + ' [id="' + flowDb.lookUpDomId(subG.id) + '"] rect'
      );
      const clusterEl = document.querySelectorAll(
        '#' + id + ' [id="' + flowDb.lookUpDomId(subG.id) + '"]'
      );

      const xPos = clusterRects[0].x.baseVal.value;
      const yPos = clusterRects[0].y.baseVal.value;
      const width = clusterRects[0].width.baseVal.value;
      const cluster = select(clusterEl[0]);
      const te = cluster.select('.label');
      te.attr('transform', `translate(${xPos + width / 2}, ${yPos + 14})`);
      te.attr('id', id + 'Text');

      for (let j = 0; j < subG.classes.length; j++) {
        clusterEl[0].classList.add(subG.classes[j]);
      }
    }
  }

  // Add label rects for non html labels
  if (!evaluate(conf.htmlLabels) || true) { // eslint-disable-line
    const labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
    for (let k = 0; k < labels.length; k++) {
      const label = labels[k];

      // Get dimensions of label
      const dim = label.getBBox();

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      // rect.setAttribute('style', 'fill:#e8e8e8;');

      label.insertBefore(rect, label.firstChild);
    }
  }

  // If node has a link, wrap it in an anchor SVG object.
  const keys = Object.keys(vert);
  keys.forEach(function (key) {
    const vertex = vert[key];

    if (vertex.link) {
      const node = select('#' + id + ' [id="' + flowDb.lookUpDomId(key) + '"]');
      if (node) {
        const link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
        link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
        link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
        link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
        if (vertex.linkTarget) {
          link.setAttributeNS('http://www.w3.org/2000/svg', 'target', vertex.linkTarget);
        }

        const linkNode = node.insert(function () {
          return link;
        }, ':first-child');

        const shape = node.select('.label-container');
        if (shape) {
          linkNode.append(function () {
            return shape.node();
          });
        }

        const label = node.select('.label');
        if (label) {
          linkNode.append(function () {
            return label.node();
          });
        }
      }
    }
  });
};

export default {
  setConf,
  addVertices,
  addEdges,
  getClasses,
  draw,
};
