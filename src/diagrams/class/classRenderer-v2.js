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
import { interpolateToCurve, getStylesFromArray, configureSvgSize } from '../../utils';
import common from '../common/common';

parser.yy = classDb;

let idCache = {};
const padding = 20;

const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10,
};

/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
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
      labelText: vertexText,
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
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
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

      if (getConfig().flowchart.htmlLabels && false) { // eslint-disable-line
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

// Todo optimize
const getGraphId = function (label) {
  const keys = Object.keys(idCache);

  for (let i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i];
    }
  }

  return undefined;
};

export const setConf = function (cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const drawOld = function (text, id) {
  idCache = {};
  parser.yy.clear();
  parser.parse(text);

  log.info('Rendering diagram ' + text);

  // Fetch the default direction, use TD if none was found
  const diagram = select(`[id='${id}']`);
  // insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const g = new graphlib.Graph({
    multigraph: true,
  });

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true,
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  const classes = classDb.getClasses();
  log.info('classes:');
  log.info(classes);
  const keys = Object.keys(classes);
  for (let i = 0; i < keys.length; i++) {
    const classDef = classes[keys[i]];
    const node = svgDraw.drawClass(diagram, classDef, conf);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);

    log.info('Org height: ' + node.height);
  }

  const relations = classDb.getRelations();
  log.info('relations:', relations);
  relations.forEach(function (relation) {
    log.info(
      'tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation)
    );
    g.setEdge(
      getGraphId(relation.id1),
      getGraphId(relation.id2),
      {
        relation: relation,
      },
      relation.title || 'DEFAULT'
    );
  });

  dagre.layout(g);
  g.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
      log.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      select('#' + lookUpDomId(v)).attr(
        'transform',
        'translate(' +
          (g.node(v).x - g.node(v).width / 2) +
          ',' +
          (g.node(v).y - g.node(v).height / 2) +
          ' )'
      );
    }
  });

  g.edges().forEach(function (e) {
    if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
      log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      svgDraw.drawEdge(diagram, g.edge(e), g.edge(e).relation, conf);
    }
  });

  const svgBounds = diagram.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  diagram.attr('viewBox', vBox);
};

export const draw = function (text, id) {
  log.info('Drawing class');
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
  let dir = 'TD';

  const conf = getConfig().flowchart;
  log.info('config:', conf);
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
  // let i = 0;
  // for (i = subGraphs.length - 1; i >= 0; i--) {
  //   subG = subGraphs[i];

  //   selectAll('cluster').append('text');

  //   for (let j = 0; j < subG.nodes.length; j++) {
  //     g.setParent(subG.nodes[j], subG.id);
  //   }
  // }
  addClasses(classes, g, id);
  addRelations(relations, g);

  // Add custom shapes
  // flowChartShapes.addToRenderV2(addShape);

  // Set up an SVG group so that we can translate the final graph.
  const svg = select(`[id="${id}"]`);
  svg.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Run the renderer. This is what draws the final graph.
  const element = select('#' + id + ' g');
  render(element, g, ['aggregation', 'extension', 'composition', 'dependency'], 'classDiagram', id);

  // element.selectAll('g.node').attr('title', function() {
  //   return flowDb.getTooltip(this.id);
  // });

  const padding = 8;
  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;
  log.debug(
    `new ViewBox 0 0 ${width} ${height}`,
    `translate(${padding - g._label.marginx}, ${padding - g._label.marginy})`
  );

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg
    .select('g')
    .attr('transform', `translate(${padding - g._label.marginx}, ${padding - svgBounds.y})`);

  // Index nodes
  // flowDb.indexNodes('subGraph' + i);

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

export default {
  setConf,
  draw,
};
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
