import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { select, curveLinear, selectAll } from 'd3';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import utils from '../../utils.js';
import { render } from '../../dagre-wrapper/index.js';
import { addHtmlLabel } from 'dagre-d3-es/src/dagre-js/label/add-html-label.js';
import { log } from '../../logger.js';
import common, { evaluate, renderKatex } from '../common/common.js';
import { interpolateToCurve, getStylesFromArray } from '../../utils.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';

const conf = {};
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);
  for (const key of keys) {
    conf[key] = cnf[key];
  }
};

/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 *
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 * @param svgId
 * @param root
 * @param doc
 * @param diagObj
 */
export const addVertices = async function (vert, g, svgId, root, doc, diagObj) {
  const svg = root.select(`[id="${svgId}"]`);
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
    classStr = classStr + ' flowchart-label';
    const styles = getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    let vertexNode;
    log.info('vertex', vertex, vertex.labelType);
    if (vertex.labelType === 'markdown') {
      log.info('vertex', vertex, vertex.labelType);
    } else {
      if (evaluate(getConfig().flowchart.htmlLabels)) {
        // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
        const node = {
          label: vertexText,
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
      case 'doublecircle':
        _shape = 'doublecircle';
        break;
      default:
        _shape = 'rect';
    }
    const labelText = await renderKatex(vertexText, getConfig());

    // Add the node
    g.setNode(vertex.id, {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText,
      labelType: vertex.labelType,
      rx: radius,
      ry: radius,
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
    });

    log.info('setNode', {
      labelStyle: styles.labelStyle,
      labelType: vertex.labelType,
      shape: _shape,
      labelText,
      rx: radius,
      ry: radius,
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
  log.info('abc78 edges = ', edges);
  let cnt = 0;
  let linkIdCnt = {};

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
    const linkIdBase = 'L-' + edge.start + '-' + edge.end;
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
      case 'invisible':
        edgeData.thickness = 'invisible';
        edgeData.pattern = 'solid';
        edgeData.style = 'stroke-width: 0;fill:none;';
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
    edgeData.label = await renderKatex(edge.text.replace(common.lineBreakRegex, '\n'), getConfig());

    if (edge.style === undefined) {
      edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none;';
    }

    edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');

    edgeData.id = linkId;
    edgeData.classes = 'flowchart-link ' + linkNameStart + ' ' + linkNameEnd;

    // Add the edge to the graph
    g.setEdge(edge.start, edge.end, edgeData, cnt);
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

  // Fetch the default direction, use TD if none was found
  let dir = diagObj.db.getDirection();
  if (dir === undefined) {
    dir = 'TD';
  }

  const { securityLevel, flowchart: conf } = getConfig();
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

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

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: dir,
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 0,
      marginy: 0,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  let subG;
  const subGraphs = diagObj.db.getSubGraphs();
  log.info('Subgraphs - ', subGraphs);
  for (let i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    log.info('Subgraph - ', subG);
    diagObj.db.addVertex(
      subG.id,
      { text: subG.title, type: subG.labelType },
      'group',
      undefined,
      subG.classes,
      subG.dir
    );
  }

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const vert = diagObj.db.getVertices();

  const edges = diagObj.db.getEdges();

  log.info('Edges', edges);
  let i = 0;
  for (i = subGraphs.length - 1; i >= 0; i--) {
    // for (let i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];

    selectAll('cluster').append('text');

    for (let j = 0; j < subG.nodes.length; j++) {
      log.info('Setting up subgraphs', subG.nodes[j], subG.id);
      g.setParent(subG.nodes[j], subG.id);
    }
  }
  await addVertices(vert, g, id, root, doc, diagObj);
  await addEdges(edges, g, diagObj);

  // Add custom shapes
  // flowChartShapes.addToRenderV2(addShape);

  // Set up an SVG group so that we can translate the final graph.
  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = root.select('#' + id + ' g');
  await render(element, g, ['point', 'circle', 'cross'], 'flowchart', id);

  utils.insertTitle(svg, 'flowchartTitleText', conf.titleTopMargin, diagObj.db.getDiagramTitle());

  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);

  // Index nodes
  diagObj.db.indexNodes('subGraph' + i);

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

      label.insertBefore(rect, label.firstChild);
    }
  }

  // If node has a link, wrap it in an anchor SVG object.
  const keys = Object.keys(vert);
  keys.forEach(function (key) {
    const vertex = vert[key];

    if (vertex.link) {
      const node = select('#' + id + ' [id="' + key + '"]');
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
