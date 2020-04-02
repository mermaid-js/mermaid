import dagre from 'dagre';
import insertMarkers from './markers';
import { insertNode, positionNode, clear as clearNodes } from './nodes';
import { insertCluster, clear as clearClusters } from './clusters';
import { insertEdgeLabel, positionEdgeLabel, insertEdge, clear as clearEdges } from './edges';
import { logger } from '../logger';

let clusterDb = {};

const getAnchorId = id => {
  // Only insert an achor once
  if (clusterDb[id]) {
    //   if (!clusterDb[id].inserted) {
    //     // Create anchor node for cluster
    //     const anchorData = {
    //       shape: 'start',
    //       labelText: '',
    //       classes: '',
    //       style: '',
    //       id: id + '_anchor',
    //       type: 'anchor',
    //       padding: 0
    //     };
    //     insertNode(nodes, anchorData);

    //     graph.setNode(anchorData.id, anchorData);
    //     graph.setParent(anchorData.id, id);
    //     clusterDb[id].inserted = true;
    //   }
    return clusterDb[id].id;
  }
  return id;
};

const findNonClusterChild = (id, graph) => {
  const node = graph.node(id);
  logger.info('identified node', node);
  if (node.type !== 'group') {
    return node.id;
  }
  logger.info('identified node Not', node.id);
  const children = graph.children(id);
  for (let i = 0; i < children.length; i++) {
    const _id = findNonClusterChild(children[i], graph);
    if (_id) {
      return _id;
    }
  }
};

export const render = (elem, graph, markers, diagramtype, id) => {
  insertMarkers(elem, markers, diagramtype, id);
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
    logger.info('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    if (node.type !== 'group') {
      insertNode(nodes, graph.node(v));
    } else {
      // const width = getClusterTitleWidth(clusters, node);
      const children = graph.children(v);

      logger.info('Cluster identified', node.id, children[0], findNonClusterChild(node.id, graph));
      // nodes2expand.push({ id: children[0], width });
      clusterDb[node.id] = { id: findNonClusterChild(node.id, graph) };
      // clusterDb[node.id] = { id: node.id + '_anchor' };
    }
  });
  logger.info('Clusters ', clusterDb);

  // Insert labels, this will insert them into the dom so that the width can be calculated
  // Also figure out which edges point to/from clusters and adjust them accordingly
  // Edges from/to clusters really points to the first child in the cluster.
  // TODO: pick optimal child in the cluster to us as link anchor
  graph.edges().forEach(function(e) {
    const edge = graph.edge(e);
    logger.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    logger.info('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    // Check if link is either from or to a cluster
    logger.info(
      'Fix',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translateing: ',
      clusterDb[e.v],
      clusterDb[e.w]
    );
    if (clusterDb[e.v] || clusterDb[e.w]) {
      logger.info('Fixing and trixing - rwemoving', e.v, e.w, e.name);
      v = getAnchorId(e.v, graph, nodes);
      w = getAnchorId(e.w, graph, nodes);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) edge.fromCluster = e.v;
      if (w !== e.w) edge.toCluster = e.w;
      logger.info('Fixing Replacing with', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
    insertEdgeLabel(edgeLabels, edge);
  });

  graph.edges().forEach(function(e) {
    logger.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
  });
  logger.info('#############################################');
  logger.info('###                Layout                 ###');
  logger.info('#############################################');
  logger.info(graph);
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
    logger.trace('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(edge), edge);

    insertEdge(edgePaths, edge, clusterDb, diagramtype);
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
