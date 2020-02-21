import * as d3 from 'd3';
import dagre from 'dagre';
import graphlib from 'graphlib';
import { logger } from '../../logger';
import classDb, { lookUpDomId } from './classDb';
import { parser } from './parser/classDiagram';
import svgDraw from './svgDraw';

parser.yy = classDb;

let idCache = {};

const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
};

// Todo optimize
const getGraphId = function(label) {
  const keys = Object.keys(idCache);

  for (let i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i];
    }
  }

  return undefined;
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
const insertMarkers = function(elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

export const setConf = function(cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function(key) {
    conf[key] = cnf[key];
  });
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  idCache = {};
  parser.yy.clear();
  parser.parse(text);

  logger.info('Rendering diagram ' + text);

  // Fetch the default direction, use TD if none was found
  const diagram = d3.select(`[id='${id}']`);
  insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const g = new graphlib.Graph({
    multigraph: true
  });

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function() {
    return {};
  });

  const classes = classDb.getClasses();
  const keys = Object.keys(classes);
  for (let i = 0; i < keys.length; i++) {
    const classDef = classes[keys[i]];
    const node = svgDraw.drawClass(diagram, classDef, conf);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);

    logger.info('Org height: ' + node.height);
  }

  const relations = classDb.getRelations();
  relations.forEach(function(relation) {
    logger.info(
      'tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation)
    );
    g.setEdge(
      getGraphId(relation.id1),
      getGraphId(relation.id2),
      {
        relation: relation
      },
      relation.title || 'DEFAULT'
    );
  });

  dagre.layout(g);
  g.nodes().forEach(function(v) {
    if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
      logger.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      d3.select('#' + lookUpDomId(v)).attr(
        'transform',
        'translate(' +
          (g.node(v).x - g.node(v).width / 2) +
          ',' +
          (g.node(v).y - g.node(v).height / 2) +
          ' )'
      );
    }
  });

  g.edges().forEach(function(e) {
    if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
      logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      svgDraw.drawEdge(diagram, g.edge(e), g.edge(e).relation, conf);
    }
  });

  diagram.attr('height', g.graph().height + 40);
  diagram.attr('width', g.graph().width * 1.5 + 20);
  diagram.attr('viewBox', '-10 -10 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20));
};

export default {
  setConf,
  draw
};
