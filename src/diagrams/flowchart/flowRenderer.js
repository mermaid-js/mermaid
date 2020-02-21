import graphlib from 'graphlib';
import * as d3 from 'd3';

import flowDb from './flowDb';
import flow from './parser/flow';
import { getConfig } from '../../config';

import dagreD3 from 'dagre-d3';
import addHtmlLabel from 'dagre-d3/lib/label/add-html-label.js';
import { logger } from '../../logger';
import { interpolateToCurve, getStylesFromArray } from '../../utils';
import flowChartShapes from './flowChartShapes';

const conf = {};
export const setConf = function(cnf) {
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
export const addVertices = function(vert, g, svgId) {
  const svg = d3.select(`[id="${svgId}"]`);
  const keys = Object.keys(vert);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function(id) {
    const vertex = vert[id];

    /**
     * Variable for storing the classes for the vertex
     * @type {string}
     */
    let classStr = '';
    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }

    const styles = getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    let vertexNode;
    if (getConfig().flowchart.htmlLabels) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      const node = {
        label: vertexText.replace(
          /fa[lrsb]?:fa-[\w-]+/g,
          s => `<i class='${s.replace(':', ' ')}'></i>`
        )
      };
      vertexNode = addHtmlLabel(svg, node).node();
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

      const rows = vertexText.split(/<br\s*\/?>/gi);

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
    g.setNode(vertex.id, {
      labelType: 'svg',
      labelStyle: styles.labelStyle,
      shape: _shape,
      label: vertexNode,
      rx: radious,
      ry: radious,
      class: classStr,
      style: styles.style,
      id: vertex.id
    });
  });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */
export const addEdges = function(edges, g) {
  let cnt = 0;

  let defaultStyle;
  let defaultLabelStyle;

  if (typeof edges.defaultStyle !== 'undefined') {
    const defaultStyles = getStylesFromArray(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  edges.forEach(function(edge) {
    cnt++;
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
      edgeData.curve = interpolateToCurve(edge.interpolate, d3.curveLinear);
    } else if (typeof edges.defaultInterpolate !== 'undefined') {
      edgeData.curve = interpolateToCurve(edges.defaultInterpolate, d3.curveLinear);
    } else {
      edgeData.curve = interpolateToCurve(conf.curve, d3.curveLinear);
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';

      if (getConfig().flowchart.htmlLabels) {
        edgeData.labelType = 'html';
        edgeData.label = '<span class="edgeLabel">' + edge.text + '</span>';
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(/<br\s*\/?>/gi, '\n');

        if (typeof edge.style === 'undefined') {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }
    // Add the edge to the graph
    g.setEdge(edge.start, edge.end, edgeData, cnt);
  });
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */
export const getClasses = function(text) {
  logger.info('Extracting classes');
  flowDb.clear();
  const parser = flow.parser;
  parser.yy = flowDb;

  // Parse the graph definition
  parser.parse(text);
  return flowDb.getClasses();
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  logger.info('Drawing flowchart');
  flowDb.clear();
  const parser = flow.parser;
  parser.yy = flowDb;

  // Parse the graph definition
  try {
    parser.parse(text);
  } catch (err) {
    logger.debug('Parsing failed');
  }

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
    compound: true
  })
    .setGraph({
      rankdir: dir,
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8
    })
    .setDefaultEdgeLabel(function() {
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

  const edges = flowDb.getEdges();

  let i = 0;
  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];

    d3.selectAll('cluster').append('text');

    for (let j = 0; j < subG.nodes.length; j++) {
      g.setParent(subG.nodes[j], subG.id);
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
  const svg = d3.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = d3.select('#' + id + ' g');
  render(element, g);

  element.selectAll('g.node').attr('title', function() {
    return flowDb.getTooltip(this.id);
  });

  const padding = 8;
  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;
  logger.debug(
    `new ViewBox 0 0 ${width} ${height}`,
    `translate(${padding - g._label.marginx}, ${padding - g._label.marginy})`
  );

  if (conf.useMaxWidth) {
    svg.attr('width', '100%');
    svg.attr('style', `max-width: ${width}px;`);
  } else {
    svg.attr('height', height);
    svg.attr('width', width);
  }

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg
    .select('g')
    .attr('transform', `translate(${padding - g._label.marginx}, ${padding - svgBounds.y})`);

  // Index nodes
  flowDb.indexNodes('subGraph' + i);

  // reposition labels
  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];

    if (subG.title !== 'undefined') {
      const clusterRects = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"] rect');
      const clusterEl = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"]');

      const xPos = clusterRects[0].x.baseVal.value;
      const yPos = clusterRects[0].y.baseVal.value;
      const width = clusterRects[0].width.baseVal.value;
      const cluster = d3.select(clusterEl[0]);
      const te = cluster.select('.label');
      te.attr('transform', `translate(${xPos + width / 2}, ${yPos + 14})`);
      te.attr('id', id + 'Text');

      for (let j = 0; j < subG.classes.length; j++) {
        clusterEl[0].classList.add(subG.classes[j]);
      }
    }
  }

  // Add label rects for non html labels
  if (!conf.htmlLabels) {
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
      rect.setAttribute('style', 'fill:#e8e8e8;');

      label.insertBefore(rect, label.firstChild);
    }
  }

  // If node has a link, wrap it in an anchor SVG object.
  const keys = Object.keys(vert);
  keys.forEach(function(key) {
    const vertex = vert[key];

    if (vertex.link) {
      const node = d3.select('#' + id + ' [id="' + key + '"]');
      if (node) {
        const link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
        link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
        link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
        link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');

        const linkNode = node.insert(function() {
          return link;
        }, ':first-child');

        const shape = node.select('.label-container');
        if (shape) {
          linkNode.append(function() {
            return shape.node();
          });
        }

        const label = node.select('.label');
        if (label) {
          linkNode.append(function() {
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
  draw
};
