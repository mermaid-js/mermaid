import dagre from 'dagre';
import insertMarkers from './markers';
import { insertNode, positionNode, clear as clearNodes } from './nodes';
import { insertCluster, clear as clearClusters } from './clusters';
import { insertEdgeLabel, positionEdgeLabel, insertEdge, clear as clearEdges } from './edges';
import { logger } from '../logger';

let clusterDb = {};

const translateClusterId = id => {
  if (clusterDb[id]) return clusterDb[id].id;
  return id;
};

export const render = (elem, graph) => {
  insertMarkers(elem);
  clusterDb = {};
  clearNodes();
  clearEdges();
  clearClusters();

  const clusters = elem.insert('g').attr('class', 'clusters'); // eslint-disable-line
  const edgePaths = elem.insert('g').attr('class', 'edgePaths');
  const edgeLabels = elem.insert('g').attr('class', 'edgeLabels');
  const nodes = elem.insert('g').attr('class', 'nodes');

  // Insert nodes, this will insert them into the dom and each node will get a size. The size is updated
  // to the abstract node and is later used by dagre for the layout
  graph.nodes().forEach(function(v) {
    const node = graph.node(v);
    logger.trace('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    if (node.type !== 'group') {
      insertNode(nodes, graph.node(v));
    } else {
      // const width = getClusterTitleWidth(clusters, node);
      const children = graph.children(v);
      logger.info('Cluster identified', node.id, children[0]);
      // nodes2expand.push({ id: children[0], width });
      clusterDb[node.id] = { id: children[0] };
      logger.info('Clusters ', clusterDb);
    }
  });

  // Insert labels, this will insert them into the dom so that the width can be calculated
  // Also figure out which edges point to/from clusters and adjust them accordingly
  // Edges from/to clusters really points to the first child in the cluster.
  // TODO: pick optimal child in the cluster to us as link anchor
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    // logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    // logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
    const v = translateClusterId(e.v);
    const w = translateClusterId(e.w);
    if (v !== e.v || w !== e.w) {
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      graph.setEdge(v, w, edge, e.name);
    }
    insertEdgeLabel(edgeLabels, edge);
  });

  // graph.edges().forEach(function(e) {
  //   logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
  // });
  logger.info('#############################################');
  logger.info('###                Layout                 ###');
  logger.info('#############################################');
  dagre.layout(graph);

  // Move the nodes to the correct place
  graph.nodes().forEach(function(v) {
    const node = graph.node(v);
    logger.trace('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    if (node.type !== 'group') {
      positionNode(node);
    } else {
      insertCluster(clusters, node);
      clusterDb[node.id].node = node;
    }
  });

  // Move the edge labels to the correct place after layout
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge));

    insertEdge(edgePaths, edge, clusterDb);
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
