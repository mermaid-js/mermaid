import * as d3 from 'd3';
import dagre from 'dagre-layout';
import graphlib from 'graphlibrary';
import { logger } from '../../logger';
import stateDb from './stateDb';
import { parser } from './parser/stateDiagram';

parser.yy = stateDb;

const idCache = {};

let stateCnt = 0;
const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
};

export const setConf = function(cnf) {};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  parser.yy.clear();
  parser.parse(text);

  logger.info('Rendering diagram ' + text);

  // /// / Fetch the default direction, use TD if none was found
  // const diagram = d3.select(`[id='${id}']`);
  // insertMarkers(diagram);

  // // Layout graph, Create a new directed graph
  // const g = new graphlib.Graph({
  //   multigraph: true
  // });

  // // Set an object for the graph label
  // g.setGraph({
  //   isMultiGraph: true
  // });

  // // Default to assigning a new object as a label for each new edge.
  // g.setDefaultEdgeLabel(function() {
  //   return {};
  // });

  // const classes = classDb.getClasses();
  // const keys = Object.keys(classes);
  // total = keys.length;
  // for (let i = 0; i < keys.length; i++) {
  //   const classDef = classes[keys[i]];
  //   const node = drawClass(diagram, classDef);
  //   // Add nodes to the graph. The first argument is the node id. The second is
  //   // metadata about the node. In this case we're going to add labels to each of
  //   // our nodes.
  //   g.setNode(node.id, node);
  //   logger.info('Org height: ' + node.height);
  // }

  // const relations = classDb.getRelations();
  // relations.forEach(function(relation) {
  //   logger.info(
  //     'tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation)
  //   );
  //   g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), {
  //     relation: relation
  //   });
  // });
  // dagre.layout(g);
  // g.nodes().forEach(function(v) {
  //   if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
  //     logger.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
  //     d3.select('#' + v).attr(
  //       'transform',
  //       'translate(' +
  //         (g.node(v).x - g.node(v).width / 2) +
  //         ',' +
  //         (g.node(v).y - g.node(v).height / 2) +
  //         ' )'
  //     );
  //   }
  // });
  // g.edges().forEach(function(e) {
  //   if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
  //     logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
  //     drawEdge(diagram, g.edge(e), g.edge(e).relation);
  //   }
  // });

  // diagram.attr('height', '100%');
  // diagram.attr('width', '100%');
  // diagram.attr('viewBox', '0 0 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20));
};

export default {
  setConf,
  draw
};
