import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { select, curveLinear, selectAll } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { render as Render } from 'dagre-d3-es';
import { applyStyle } from 'dagre-d3-es/src/dagre-js/util.js';
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';
import { log } from '../../logger.js';
import common, { evaluate, renderKatex } from '../common/common.js';
import { interpolateToCurve, getStylesFromArray } from '../../utils.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import flowChartShapes from './flowChartShapes.js';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 *
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 * @param svgId
 * @param root
 * @param _doc
 * @param diagObj
 */
export const addVertices = async function (vert, g, svgId, root, _doc, diagObj) {
  const svg = !root ? select(`[id="${svgId}"]`) : root.select(`[id="${svgId}"]`);
  const doc = !_doc ? document : _doc;
  const keys = Object.keys(vert);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  for (const id of keys) {
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
        label: await renderKatex(
          vertexText.replace(
            /fa[blrs]?:fa-[\w-]+/g, // cspell:disable-line
            (s) => `<i class='${s.replace(':', ' ')}'></i>`
          ),
          getConfig()
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

    let radius = 0;
    let _shape = '';
    // Set the shape based parameters
    switch (vertex.type) {
      case 'round':
        radius = 5;
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
    g.setNode(diagObj.db.lookUpDomId(vertex.id), {
      labelType: 'svg',
      labelStyle: styles.labelStyle,
      shape: _shape,
      label: vertexNode,
      rx: radius,
      ry: radius,
      class: classStr,
      style: styles.style,
      id: diagObj.db.lookUpDomId(vertex.id),
    });
  }
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param {object} edges The edges to add to the graph
 * @param {object} g The graph object
 * @param diagObj
 */
export const addEdges = async function (edges, g, diagObj) {
  let cnt = 0;

  let defaultStyle;
  let defaultLabelStyle;

  if (edges.defaultStyle !== undefined) {
    const defaultStyles = getStylesFromArray(edges.defaultStyle);
    defaultStyle = defaultStyles.style;
    defaultLabelStyle = defaultStyles.labelStyle;
  }

  for (const edge of edges) {
    cnt++;

    // Identify Link
    const linkId = 'L-' + edge.start + '-' + edge.end;
    const linkNameStart = 'LS-' + edge.start;
    const linkNameEnd = 'LE-' + edge.end;

    const edgeData = {};

    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    let style = '';
    let labelStyle = '';

    if (edge.style !== undefined) {
      const styles = getStylesFromArray(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none';
          if (defaultStyle !== undefined) {
            style = defaultStyle;
          }
          if (defaultLabelStyle !== undefined) {
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

      if (evaluate(getConfig().flowchart.htmlLabels)) {
        edgeData.labelType = 'html';
        edgeData.label = `<span id="L-${linkId}" class="edgeLabel L-${linkNameStart}' L-${linkNameEnd}" style="${
          edgeData.labelStyle
        }">${await renderKatex(
          edge.text.replace(
            /fa[blrs]?:fa-[\w-]+/g, // cspell:disable-line
            (s) => `<i class='${s.replace(':', ' ')}'></i>`
          ),
          getConfig()
        )}</span>`;
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

        if (edge.style === undefined) {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }

    edgeData.id = linkId;
    edgeData.class = linkNameStart + ' ' + linkNameEnd;
    edgeData.minlen = edge.length || 1;

    // Add the edge to the graph
    g.setEdge(diagObj.db.lookUpDomId(edge.start), diagObj.db.lookUpDomId(edge.end), edgeData, cnt);
  }
};

/**
 * Returns the all the styles from classDef statements in the graph definition.
 *
 * @param text
 * @param diagObj
 * @returns {Record<string, import('../../diagram-api/types.js').DiagramStyleClassDef>} ClassDef styles
 */
export const getClasses = function (text, diagObj) {
  log.info('Extracting classes');
  return diagObj.db.getClasses();
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text
 * @param id
 * @param _version
 * @param diagObj
 */
export const draw = async function (text, id, _version, diagObj) {
  log.info('Drawing flowchart');
  const { securityLevel, flowchart: conf } = getConfig();
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  // Fetch the default direction, use TD if none was found
  let dir = diagObj.db.getDirection();
  if (dir === undefined) {
    dir = 'TD';
  }
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
  const subGraphs = diagObj.db.getSubGraphs();
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    diagObj.db.addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  }

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const vert = diagObj.db.getVertices();
  log.warn('Get vertices', vert);

  const edges = diagObj.db.getEdges();

  let i = 0;
  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];

    selectAll('cluster').append('text');

    for (let j = 0; j < subG.nodes.length; j++) {
      log.warn(
        'Setting subgraph',
        subG.nodes[j],
        diagObj.db.lookUpDomId(subG.nodes[j]),
        diagObj.db.lookUpDomId(subG.id)
      );
      g.setParent(diagObj.db.lookUpDomId(subG.nodes[j]), diagObj.db.lookUpDomId(subG.id));
    }
  }
  await addVertices(vert, g, id, root, doc, diagObj);
  await addEdges(edges, g, diagObj);

  // Create the renderer
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
    applyStyle(path, edge[type + 'Style']);
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
  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = root.select('#' + id + ' g');
  render(element, g);

  element.selectAll('g.node').attr('title', function () {
    return diagObj.db.getTooltip(this.id);
  });

  // Index nodes
  diagObj.db.indexNodes('subGraph' + i);

  // reposition labels
  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];
    if (subG.title !== 'undefined') {
      const clusterRects = doc.querySelectorAll(
        '#' + id + ' [id="' + diagObj.db.lookUpDomId(subG.id) + '"] rect'
      );
      const clusterEl = doc.querySelectorAll(
        '#' + id + ' [id="' + diagObj.db.lookUpDomId(subG.id) + '"]'
      );

      const xPos = clusterRects[0].x.baseVal.value;
      const yPos = clusterRects[0].y.baseVal.value;
      const _width = clusterRects[0].width.baseVal.value;
      const cluster = select(clusterEl[0]);
      const te = cluster.select('.label');
      te.attr('transform', `translate(${xPos + _width / 2}, ${yPos + 14})`);
      te.attr('id', id + 'Text');

      for (let j = 0; j < subG.classes.length; j++) {
        clusterEl[0].classList.add(subG.classes[j]);
      }
    }
  }

  // Add label rects for non html labels
  if (!conf.htmlLabels) {
    const labels = doc.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
    for (const label of labels) {
      // Get dimensions of label
      const dim = label.getBBox();

      const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      // rect.setAttribute('style', 'fill:#e8e8e8;');

      label.insertBefore(rect, label.firstChild);
    }
  }
  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);

  // If node has a link, wrap it in an anchor SVG object.
  const keys = Object.keys(vert);
  keys.forEach(function (key) {
    const vertex = vert[key];

    if (vertex.link) {
      const node = root.select('#' + id + ' [id="' + diagObj.db.lookUpDomId(key) + '"]');
      if (node) {
        const link = doc.createElementNS('http://www.w3.org/2000/svg', 'a');
        link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
        link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
        link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
        if (securityLevel === 'sandbox') {
          link.setAttributeNS('http://www.w3.org/2000/svg', 'target', '_top');
        } else if (vertex.linkTarget) {
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
