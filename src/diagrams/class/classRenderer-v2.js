import { select } from 'd3';
import dagre from 'dagre';
import graphlib from 'graphlib';
import { log } from '../../logger';
import classDb, { lookUpDomId } from './classDb';
import { parser } from './parser/classDiagram';
import svgDraw from './svgDraw';
import { getConfig } from '../../config';
import { render } from '../../dagre-wrapper/index.js';
// import addHtmlLabel from 'dagre-d3/lib/label/add-html-label.js';
import { curveLinear } from 'd3';
import { interpolateToCurve, getStylesFromArray, setupGraphViewbox } from '../../utils';
import common from '../common/common';
import addSVGAccessibilityFields from '../../accessibility';

parser.yy = classDb;

let idCache = {};
const padding = 20;

const sanitizeText = (txt) => common.sanitizeText(txt, getConfig());

const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10,
};

/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 *
 * @param {Object<
 *   string,
 *   { cssClasses: string[]; text: string; id: string; type: string; domId: string }
 * >} classes
 *   Object containing the vertices.
 * @param {SVGGElement} g The graph that is to be drawn.
 */
export const addClasses = function (classes, g) {
  // const svg = select(`[id="${svgId}"]`);
  const keys = Object.keys(classes);
  log.info('keys:', keys);
  log.info(classes);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertex = classes[id];

    /**
     * Variable for storing the classes for the vertex
     *
     * @type {string}
     */
    let cssClassStr = '';
    if (vertex.cssClasses.length > 0) {
      cssClassStr = cssClassStr + ' ' + vertex.cssClasses.join(' ');
    }
    // if (vertex.classes.length > 0) {
    //   classStr = vertex.classes.join(' ');
    // }

    const styles = { labelStyle: '' }; //getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    let vertexText = vertex.text !== undefined ? vertex.text : vertex.id;

    // We create a SVG label, either by delegating to addHtmlLabel or manually
    // let vertexNode;
    // if (evaluate(getConfig().flowchart.htmlLabels)) {
    //   const node = {
    //     label: vertexText.replace(
    //       /fa[lrsb]?:fa-[\w-]+/g,
    //       s => `<i class='${s.replace(':', ' ')}'></i>`
    //     )
    //   };
    //   vertexNode = addHtmlLabel(svg, node).node();
    //   vertexNode.parentNode.removeChild(vertexNode);
    // } else {
    //   const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    //   svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

    //   const rows = vertexText.split(common.lineBreakRegex);

    //   for (let j = 0; j < rows.length; j++) {
    //     const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    //     tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    //     tspan.setAttribute('dy', '1em');
    //     tspan.setAttribute('x', '1');
    //     tspan.textContent = rows[j];
    //     svgLabel.appendChild(tspan);
    //   }
    //   vertexNode = svgLabel;
    // }

    let radious = 0;
    let _shape = '';
    // Set the shape based parameters
    switch (vertex.type) {
      case 'class':
        _shape = 'class_box';
        break;
      default:
        _shape = 'class_box';
    }
    // Add the node
    g.setNode(vertex.id, {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: sanitizeText(vertexText),
      classData: vertex,
      rx: radious,
      ry: radious,
      class: cssClassStr,
      style: styles.style,
      id: vertex.id,
      domId: vertex.domId,
      haveCallback: vertex.haveCallback,
      link: vertex.link,
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      padding: getConfig().flowchart.padding,
    });

    log.info('setNode', {
      labelStyle: styles.labelStyle,
      shape: _shape,
      labelText: vertexText,
      rx: radious,
      ry: radious,
      class: cssClassStr,
      style: styles.style,
      id: vertex.id,
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      padding: getConfig().flowchart.padding,
    });
  });
};

/**
 * Add edges to graph based on parsed graph defninition
 *
 * @param relations
 * @param {object} g The graph object
 */
export const addRelations = function (relations, g) {
  let cnt = 0;

  let defaultStyle;
  let defaultLabelStyle;

  // if (typeof relations.defaultStyle !== 'undefined') {
  //   const defaultStyles = getStylesFromArray(relations.defaultStyle);
  //   defaultStyle = defaultStyles.style;
  //   defaultLabelStyle = defaultStyles.labelStyle;
  // }

  relations.forEach(function (edge) {
    cnt++;
    const edgeData = {};
    //Set relationship style and line type
    edgeData.classes = 'relation';
    edgeData.pattern = edge.relation.lineType == 1 ? 'dashed' : 'solid';

    edgeData.id = 'id' + cnt;
    // Set link type for rendering
    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    log.info(edgeData, edge);
    //Set edge extra labels
    //edgeData.startLabelLeft = edge.relationTitle1;
    edgeData.startLabelRight = edge.relationTitle1 === 'none' ? '' : edge.relationTitle1;
    edgeData.endLabelLeft = edge.relationTitle2 === 'none' ? '' : edge.relationTitle2;
    //edgeData.endLabelRight = edge.relationTitle2;

    //Set relation arrow types
    edgeData.arrowTypeStart = getArrowMarker(edge.relation.type1);
    edgeData.arrowTypeEnd = getArrowMarker(edge.relation.type2);
    let style = '';
    let labelStyle = '';

    if (typeof edge.style !== 'undefined') {
      const styles = getStylesFromArray(edge.style);
      style = styles.style;
      labelStyle = styles.labelStyle;
    } else {
      style = 'fill:none';
      if (typeof defaultStyle !== 'undefined') {
        style = defaultStyle;
      }
      if (typeof defaultLabelStyle !== 'undefined') {
        labelStyle = defaultLabelStyle;
      }
    }

    edgeData.style = style;
    edgeData.labelStyle = labelStyle;

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.curve = interpolateToCurve(edge.interpolate, curveLinear);
    } else if (typeof relations.defaultInterpolate !== 'undefined') {
      edgeData.curve = interpolateToCurve(relations.defaultInterpolate, curveLinear);
    } else {
      edgeData.curve = interpolateToCurve(conf.curve, curveLinear);
    }

    edge.text = edge.title;
    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';

      if (getConfig().flowchart.htmlLabels) {
        // eslint-disable-line
        edgeData.labelType = 'html';
        edgeData.label = '<span class="edgeLabel">' + edge.text + '</span>';
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

        if (typeof edge.style === 'undefined') {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }
    // Add the edge to the graph
    g.setEdge(edge.id1, edge.id2, edgeData, cnt);
  });
};

/**
 * Gets the ID with the same label as in the cache
 *
 * @param {string} label The label to look for
 * @returns {string} The resulting ID
 */
const getGraphId = function (label) {
  const foundEntry = Object.entries(idCache).find((entry) => entry[1].label === label);

  if (foundEntry) {
    return foundEntry[0];
  }
};

/**
 * Merges the value of `conf` with the passed `cnf`
 *
 * @param {object} cnf Config to merge
 */
export const setConf = function (cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param {string} text
 * @param {string} id
 */
export const draw = function (text, id) {
  log.info('Drawing class - ', id);
  classDb.clear();
  // const parser = classDb.parser;
  // parser.yy = classDb;

  // Parse the graph definition
  // try {
  parser.parse(text);
  // } catch (err) {
  // log.debug('Parsing failed');
  // }

  // Fetch the default direction, use TD if none was found
  //let dir = 'TD';

  const conf = getConfig().flowchart;
  const securityLevel = getConfig().securityLevel;
  log.info('config:', conf);
  const nodeSpacing = conf.nodeSpacing || 50;
  const rankSpacing = conf.rankSpacing || 50;

  // Create the input mermaid.graph
  const g = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: classDb.getDirection(),
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  // let subG;
  // const subGraphs = flowDb.getSubGraphs();
  // log.info('Subgraphs - ', subGraphs);
  // for (let i = subGraphs.length - 1; i >= 0; i--) {
  //   subG = subGraphs[i];
  //   log.info('Subgraph - ', subG);
  //   flowDb.addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  // }

  // Fetch the verices/nodes and edges/links from the parsed graph definition
  const classes = classDb.getClasses();
  const relations = classDb.getRelations();

  log.info(relations);
  addClasses(classes, g, id);
  addRelations(relations, g);

  // Add custom shapes
  // flowChartShapes.addToRenderV2(addShape);

  // Set up an SVG group so that we can translate the final graph.
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  const element = root.select('#' + id + ' g');
  render(element, g, ['aggregation', 'extension', 'composition', 'dependency'], 'classDiagram', id);

  setupGraphViewbox(g, svg, conf.diagramPadding, conf.useMaxWidth);

  // Add label rects for non html labels
  if (!conf.htmlLabels) {
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
    const labels = doc.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
    for (let k = 0; k < labels.length; k++) {
      const label = labels[k];

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

  addSVGAccessibilityFields(parser.yy, svg, id);
  // If node has a link, wrap it in an anchor SVG object.
  // const keys = Object.keys(classes);
  // keys.forEach(function(key) {
  //   const vertex = classes[key];

  //   if (vertex.link) {
  //     const node = select('#' + id + ' [id="' + key + '"]');
  //     if (node) {
  //       const link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
  //       link.setAttributeNS('http://www.w3.org/2000/svg', 'class', vertex.classes.join(' '));
  //       link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
  //       link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');

  //       const linkNode = node.insert(function() {
  //         return link;
  //       }, ':first-child');

  //       const shape = node.select('.label-container');
  //       if (shape) {
  //         linkNode.append(function() {
  //           return shape.node();
  //         });
  //       }

  //       const label = node.select('.label');
  //       if (label) {
  //         linkNode.append(function() {
  //           return label.node();
  //         });
  //       }
  //     }
  //   }
  // });
};

/**
 * Gets the arrow marker for a type index
 *
 * @param {number} type The type to look for
 * @returns {'aggregation' | 'extension' | 'composition' | 'dependency'} The arrow marker
 */
function getArrowMarker(type) {
  let marker;
  switch (type) {
    case 0:
      marker = 'aggregation';
      break;
    case 1:
      marker = 'extension';
      break;
    case 2:
      marker = 'composition';
      break;
    case 3:
      marker = 'dependency';
      break;
    default:
      marker = 'none';
  }
  return marker;
}

export default {
  setConf,
  draw,
};
