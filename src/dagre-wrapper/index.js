import dagre from 'dagre';
import insertMarkers from './markers';
import { insertNode, positionNode } from './nodes';
import { insertEdgeLabel, positionEdgeLabel, insertEdge } from './edges';
import { logger } from '../logger';

export const render = (elem, graph) => {
  insertMarkers(elem);

  const clusters = elem.insert('g').attr('class', 'clusters'); // eslint-disable-line
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout
  graph.nodes().forEach(function(v) {
    logger.trace('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    insertNode(nodes, graph.node(v));
  });

  // Inster labels, this will insert them into the dom so that the width can be calculated
  graph.edges().forEach(function(e) {
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
    insertEdgeLabel(edgeLabels, graph.edge(e));
  });

  dagre.layout(graph);

  // Move the nodes to the correct place
  graph.nodes().forEach(function(v) {
    logger.trace('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    positionNode(graph.node(v));
  });

  // Move the edge labels to the correct place after layout
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge));

    insertEdge(edgePaths, edge);
    positionEdgeLabel(edge);
  });
};

// const shapeDefinitions = {};
// export const addShape = ({ shapeType: fun }) => {
//   shapeDefinitions[shapeType] = fun;
// };

// const arrowDefinitions = {};
// export const addArrow = ({ arrowType: fun }) => {
//   arrowDefinitions[arrowType] = fun;
// };
